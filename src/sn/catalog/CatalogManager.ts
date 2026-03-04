import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { AggregateQuery } from "../aggregate/AggregateQuery";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import { HTTPRequest } from "../../comm/http/HTTPRequest";
import {
    CatalogItemRecord,
    CatalogItemResponse,
    CatalogItemDetail,
    CatalogCategoryRecord,
    CatalogCategoryResponse,
    CatalogCategoryDetail,
    CatalogVariableRecord,
    CatalogVariableResponse,
    VariableSetItemResponse,
    CatalogOrderResponse,
    CatalogRequestResult,
    RequestItemResponse,
    ListCatalogItemsOptions,
    ListCatalogCategoriesOptions,
    ListCatalogVariablesOptions,
    SubmitCatalogRequestOptions
} from './CatalogModels';

/**
 * Mapping of numeric variable type codes to friendly names.
 * Sourced from a ServiceNow instance with sysparm_display_value: 'all'.
 */
export const VARIABLE_TYPE_MAP: Record<string, string> = {
    '1': 'Yes/No',
    '2': 'Multi Line Text',
    '3': 'Multiple Choice',
    '4': 'Numeric Scale',
    '5': 'Select Box',
    '6': 'Single Line Text',
    '7': 'CheckBox',
    '8': 'Reference',
    '9': 'Date',
    '10': 'Date/Time',
    '11': 'Label',
    '14': 'Custom',
    '16': 'Wide Single Line Text',
    '17': 'Custom with Label',
    '18': 'Lookup Select Box',
    '19': 'Container Start',
    '20': 'Container End',
    '21': 'List Collector',
    '23': 'HTML',
    '24': 'Container Split',
    '26': 'Email',
    '28': 'IP Address',
    '29': 'Duration',
    '31': 'Requested For',
    '32': 'Rich Text Label',
    '33': 'Attachment',
    '40': 'Table Name'
};

/**
 * Get a human-readable variable type name from a numeric type code.
 *
 * @param typeCode The numeric type code (as a string)
 * @returns The friendly type name, or "Unknown ({typeCode})" if not mapped
 */
export function getVariableTypeName(typeCode: string | undefined): string {
    if (!typeCode) return 'Unknown';
    return VARIABLE_TYPE_MAP[typeCode] || `Unknown (${typeCode})`;
}

/**
 * Provides operations for managing ServiceNow Service Catalog items,
 * categories, variables, and request submissions via the Table API,
 * Stats API, and Service Catalog REST API.
 */
export class CatalogManager {
    private static readonly CATALOG_ITEM_TABLE = 'sc_cat_item';
    private static readonly CATEGORY_TABLE = 'sc_category';
    private static readonly VARIABLE_TABLE = 'item_option_new';
    private static readonly VARIABLE_SET_ITEM_TABLE = 'io_set_item';
    private static readonly REQUEST_ITEM_TABLE = 'sc_req_item';
    private static readonly ORDER_NOW_API = '/api/sn_sc/servicecatalog/items/{sys_id}/order_now';

    /** Fields to return for catalog item list operations */
    private static readonly ITEM_LIST_FIELDS =
        'sys_id,name,short_description,description,category,price,active,order,sys_scope,sc_catalogs,type';

    /** Fields to return for category list operations */
    private static readonly CATEGORY_LIST_FIELDS =
        'sys_id,title,description,parent,sc_catalog,active,order,icon,header_icon';

    /** Fields to return for variable list operations */
    private static readonly VARIABLE_LIST_FIELDS =
        'sys_id,name,question_text,type,mandatory,default_value,help_text,order,reference,reference_qual,choice_table,choice_field,cat_item,variable_set';

    private _logger: Logger = new Logger("CatalogManager");
    private _req: ServiceNowRequest;
    private _tableAPI: TableAPIRequest;
    private _aggregateQuery: AggregateQuery;
    private _instance: ServiceNowInstance;

    private _headers: object = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
        this._tableAPI = new TableAPIRequest(instance);
        this._aggregateQuery = new AggregateQuery(instance);
    }

    /**
     * List catalog items with optional filtering and pagination.
     *
     * @param options Filtering and pagination options
     * @returns Array of catalog item records
     * @throws Error if the API call fails
     */
    public async listCatalogItems(options: ListCatalogItemsOptions = {}): Promise<CatalogItemRecord[]> {
        const { query, textSearch, categorySysId, catalogSysId, active, limit = 20, offset = 0 } = options;
        this._logger.info('Listing catalog items');

        const queryParts: string[] = [];
        if (active !== undefined) queryParts.push(`active=${active}`);
        if (categorySysId) queryParts.push(`category=${categorySysId}`);
        if (catalogSysId) queryParts.push(`sc_catalogs=${catalogSysId}`);
        if (textSearch) queryParts.push(`nameLIKE${textSearch}^ORshort_descriptionLIKE${textSearch}`);
        if (query) queryParts.push(query);

        const params: Record<string, string | number> = {
            sysparm_limit: limit,
            sysparm_offset: offset,
            sysparm_fields: CatalogManager.ITEM_LIST_FIELDS
        };
        if (queryParts.length > 0) {
            params.sysparm_query = queryParts.join('^');
        }

        const response: IHttpResponse<CatalogItemResponse> = await this._tableAPI.get<CatalogItemResponse>(
            CatalogManager.CATALOG_ITEM_TABLE, params
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Retrieved ${response.bodyObject.result.length} catalog items`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to list catalog items. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Get details of a specific catalog item, optionally including its variables.
     *
     * @param sysId The sys_id of the catalog item
     * @param includeVariables Whether to include variables (default true)
     * @returns Catalog item detail with item record and variables
     * @throws Error if the sys_id is empty, the item is not found, or the API call fails
     */
    public async getCatalogItem(sysId: string, includeVariables: boolean = true): Promise<CatalogItemDetail> {
        if (!sysId || sysId.trim().length === 0) {
            throw new Error('Catalog item sys_id is required');
        }

        this._logger.info(`Getting catalog item: ${sysId}`);

        const response: IHttpResponse<CatalogItemResponse> = await this._tableAPI.get<CatalogItemResponse>(
            CatalogManager.CATALOG_ITEM_TABLE,
            { sysparm_query: `sys_id=${sysId}`, sysparm_limit: 1 }
        );

        if (!response || response.status !== 200 || !response.bodyObject?.result ||
            response.bodyObject.result.length === 0) {
            throw new Error(`Catalog item '${sysId}' not found. Status: ${response?.status ?? 'unknown'}`);
        }

        const item = response.bodyObject.result[0];
        let variables: CatalogVariableRecord[] = [];

        if (includeVariables) {
            variables = await this._fetchAllVariables(sysId);
        }

        this._logger.info(`Catalog item '${item.name}': ${variables.length} variables`);

        return { item, variables };
    }

    /**
     * List catalog categories with optional filtering and pagination.
     *
     * @param options Filtering and pagination options
     * @returns Array of catalog category records
     * @throws Error if the API call fails
     */
    public async listCatalogCategories(options: ListCatalogCategoriesOptions = {}): Promise<CatalogCategoryRecord[]> {
        const { parentSysId, catalogSysId, active, title, query, limit = 20, offset = 0 } = options;
        this._logger.info('Listing catalog categories');

        const queryParts: string[] = [];
        if (parentSysId) queryParts.push(`parent=${parentSysId}`);
        if (catalogSysId) queryParts.push(`sc_catalog=${catalogSysId}`);
        if (active !== undefined) queryParts.push(`active=${active}`);
        if (title) queryParts.push(`title=${title}`);
        if (query) queryParts.push(query);

        const params: Record<string, string | number> = {
            sysparm_limit: limit,
            sysparm_offset: offset,
            sysparm_fields: CatalogManager.CATEGORY_LIST_FIELDS
        };
        if (queryParts.length > 0) {
            params.sysparm_query = queryParts.join('^');
        }

        const response: IHttpResponse<CatalogCategoryResponse> = await this._tableAPI.get<CatalogCategoryResponse>(
            CatalogManager.CATEGORY_TABLE, params
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Retrieved ${response.bodyObject.result.length} catalog categories`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to list catalog categories. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Get details of a specific catalog category including its item count.
     *
     * @param sysId The sys_id of the catalog category
     * @returns Category detail with category record and item count
     * @throws Error if the sys_id is empty, the category is not found, or the API call fails
     */
    public async getCatalogCategory(sysId: string): Promise<CatalogCategoryDetail> {
        if (!sysId || sysId.trim().length === 0) {
            throw new Error('Catalog category sys_id is required');
        }

        this._logger.info(`Getting catalog category: ${sysId}`);

        const response: IHttpResponse<CatalogCategoryResponse> = await this._tableAPI.get<CatalogCategoryResponse>(
            CatalogManager.CATEGORY_TABLE,
            {
                sysparm_query: `sys_id=${sysId}`,
                sysparm_limit: 1,
                sysparm_fields: CatalogManager.CATEGORY_LIST_FIELDS
            }
        );

        if (!response || response.status !== 200 || !response.bodyObject?.result ||
            response.bodyObject.result.length === 0) {
            throw new Error(`Catalog category '${sysId}' not found. Status: ${response?.status ?? 'unknown'}`);
        }

        const category = response.bodyObject.result[0];

        const itemCount = await this._aggregateQuery.count({
            table: CatalogManager.CATALOG_ITEM_TABLE,
            query: `category=${sysId}`
        });

        this._logger.info(`Category '${category.title}': ${itemCount} items`);

        return { category, itemCount };
    }

    /**
     * List variables for a catalog item, including variables from variable sets.
     *
     * @param options Options including the catalog item sys_id
     * @returns Array of catalog variable records sorted by order
     * @throws Error if the catalog item sys_id is empty or the API call fails
     */
    public async listCatalogItemVariables(options: ListCatalogVariablesOptions): Promise<CatalogVariableRecord[]> {
        if (!options.catalogItemSysId || options.catalogItemSysId.trim().length === 0) {
            throw new Error('Catalog item sys_id is required');
        }

        this._logger.info(`Listing variables for catalog item: ${options.catalogItemSysId}`);

        const includeVariableSets = options.includeVariableSets !== false;
        const variables = includeVariableSets
            ? await this._fetchAllVariables(options.catalogItemSysId)
            : await this._fetchDirectVariables(options.catalogItemSysId);

        this._logger.info(`Retrieved ${variables.length} variables for item ${options.catalogItemSysId}`);
        return variables;
    }

    /**
     * Submit a catalog request using the Service Catalog order_now API.
     * After ordering, fetches the RITM record for the complete result.
     *
     * @param options Request submission options
     * @returns Request result with REQ and RITM numbers/sys_ids
     * @throws Error if the catalog item sys_id is empty or the API call fails
     */
    public async submitCatalogRequest(options: SubmitCatalogRequestOptions): Promise<CatalogRequestResult> {
        if (!options.catalogItemSysId || options.catalogItemSysId.trim().length === 0) {
            throw new Error('Catalog item sys_id is required');
        }

        this._logger.info(`Submitting catalog request for item: ${options.catalogItemSysId}`);

        const orderBody = {
            sysparm_quantity: options.quantity || 1,
            variables: options.variables || {}
        };

        const orderUrl = CatalogManager.ORDER_NOW_API.replace('{sys_id}', options.catalogItemSysId);
        const request: HTTPRequest = {
            path: orderUrl,
            method: 'post',
            headers: this._headers,
            query: null,
            body: null,
            json: orderBody
        };

        const orderResponse: IHttpResponse<CatalogOrderResponse> = await this._req.executeRequest<CatalogOrderResponse>(request);

        if (!orderResponse || orderResponse.status !== 200 || !orderResponse.bodyObject?.result) {
            throw new Error(`Failed to submit catalog request. Status: ${orderResponse?.status ?? 'unknown'}`);
        }

        const orderResult = orderResponse.bodyObject.result;
        const result: CatalogRequestResult = {
            requestNumber: orderResult.request_number || orderResult.number,
            requestSysId: orderResult.request_id || orderResult.sys_id
        };

        // Fetch the RITM record
        try {
            const ritmResponse: IHttpResponse<RequestItemResponse> = await this._tableAPI.get<RequestItemResponse>(
                CatalogManager.REQUEST_ITEM_TABLE,
                {
                    sysparm_query: `request=${result.requestSysId}`,
                    sysparm_fields: 'sys_id,number',
                    sysparm_limit: 1
                }
            );

            if (ritmResponse && ritmResponse.status === 200 &&
                ritmResponse.bodyObject?.result && ritmResponse.bodyObject.result.length > 0) {
                const ritm = ritmResponse.bodyObject.result[0];
                result.requestItemNumber = ritm.number;
                result.requestItemSysId = ritm.sys_id;
                this._logger.info(`Catalog request submitted: ${result.requestNumber} / ${result.requestItemNumber}`);
            } else {
                this._logger.info(`Catalog request submitted: ${result.requestNumber} (RITM not yet available)`);
            }
        } catch (err) {
            // RITM fetch is best-effort; log but don't fail the overall request
            this._logger.info(`Catalog request submitted: ${result.requestNumber} (RITM fetch failed)`);
        }

        return result;
    }

    /**
     * Fetch all variables for a catalog item: direct variables + variable set variables.
     * Merges, deduplicates by sys_id, enriches with friendly_type, and sorts by order.
     * @private
     */
    private async _fetchAllVariables(catalogItemSysId: string): Promise<CatalogVariableRecord[]> {
        // Fetch direct variables and variable set IDs in parallel
        const [directVars, setItemResponse] = await Promise.all([
            this._fetchDirectVariables(catalogItemSysId),
            this._tableAPI.get<VariableSetItemResponse>(
                CatalogManager.VARIABLE_SET_ITEM_TABLE,
                {
                    sysparm_query: `sc_cat_item=${catalogItemSysId}`,
                    sysparm_fields: 'sys_id,sc_cat_item,variable_set'
                }
            )
        ]);

        let setVars: CatalogVariableRecord[] = [];

        if (setItemResponse && setItemResponse.status === 200 &&
            setItemResponse.bodyObject?.result && setItemResponse.bodyObject.result.length > 0) {

            const setIds = setItemResponse.bodyObject.result.map(r => r.variable_set).filter(Boolean);

            if (setIds.length > 0) {
                const setQuery = `variable_setIN${setIds.join(',')}`;
                const setVarsResponse: IHttpResponse<CatalogVariableResponse> = await this._tableAPI.get<CatalogVariableResponse>(
                    CatalogManager.VARIABLE_TABLE,
                    {
                        sysparm_query: setQuery,
                        sysparm_fields: CatalogManager.VARIABLE_LIST_FIELDS
                    }
                );

                if (setVarsResponse && setVarsResponse.status === 200 && setVarsResponse.bodyObject?.result) {
                    setVars = setVarsResponse.bodyObject.result;
                }
            }
        }

        // Merge, deduplicate by sys_id, enrich, and sort
        const allVars = [...directVars, ...setVars];
        const seen = new Set<string>();
        const deduped: CatalogVariableRecord[] = [];
        for (const v of allVars) {
            if (!seen.has(v.sys_id)) {
                seen.add(v.sys_id);
                v.friendly_type = getVariableTypeName(v.type);
                deduped.push(v);
            }
        }

        deduped.sort((a, b) => {
            const orderA = parseInt(a.order || '0', 10);
            const orderB = parseInt(b.order || '0', 10);
            return orderA - orderB;
        });

        return deduped;
    }

    /**
     * Fetch variables directly assigned to a catalog item (cat_item field).
     * @private
     */
    private async _fetchDirectVariables(catalogItemSysId: string): Promise<CatalogVariableRecord[]> {
        const response: IHttpResponse<CatalogVariableResponse> = await this._tableAPI.get<CatalogVariableResponse>(
            CatalogManager.VARIABLE_TABLE,
            {
                sysparm_query: `cat_item=${catalogItemSysId}^ORDERBYorder`,
                sysparm_fields: CatalogManager.VARIABLE_LIST_FIELDS
            }
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            return response.bodyObject.result.map(v => ({
                ...v,
                friendly_type: getVariableTypeName(v.type)
            }));
        }

        return [];
    }
}

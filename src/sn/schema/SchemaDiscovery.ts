import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import {
    TableSchemaOptions,
    FieldSchema,
    TableSchema,
    FieldExplanation,
    ValidationIssue,
    CatalogValidationResult,
    SysDbObjectRecord,
    SysDbObjectResponse,
    SysDictionaryRecord,
    SysDictionaryResponse,
    SysChoiceRecord,
    SysChoiceResponse,
    CatalogItemOptionRecord,
    CatalogItemOptionResponse,
    CatalogUIPolicyRecord,
    CatalogUIPolicyResponse
} from './SchemaModels';

/**
 * SchemaDiscovery provides operations for discovering ServiceNow table schemas,
 * explaining fields, and validating catalog configurations.
 */
export class SchemaDiscovery {
    private static readonly SYS_DB_OBJECT_TABLE = 'sys_db_object';
    private static readonly SYS_DICTIONARY_TABLE = 'sys_dictionary';
    private static readonly SYS_CHOICE_TABLE = 'sys_choice';
    private static readonly ITEM_OPTION_NEW_TABLE = 'item_option_new';
    private static readonly CATALOG_UI_POLICY_TABLE = 'catalog_ui_policy';

    private _logger: Logger = new Logger("SchemaDiscovery");
    private _req: ServiceNowRequest;
    private _tableAPI: TableAPIRequest;
    private _instance: ServiceNowInstance;

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
        this._tableAPI = new TableAPIRequest(instance);
    }

    /**
     * Discover the schema for a ServiceNow table.
     * Queries sys_db_object for table info and sys_dictionary for field definitions.
     * Optionally includes choice tables, relationships, UI policies, and business rules.
     *
     * @param tableName The name of the table to discover
     * @param options Optional flags to include additional information
     * @returns TableSchema with all discovered information
     * @throws Error if tableName is empty or the table is not found
     */
    public async discoverTableSchema(tableName: string, options: TableSchemaOptions = {}): Promise<TableSchema> {
        if (!tableName || tableName.trim().length === 0) {
            throw new Error('Table name is required');
        }

        this._logger.info(`Discovering schema for table: ${tableName}`);

        // Query sys_db_object for the table record
        const tableQuery: Record<string, string | number> = {
            sysparm_query: `name=${tableName}`,
            sysparm_limit: 1
        };

        const tableResp: IHttpResponse<SysDbObjectResponse> = await this._tableAPI.get<SysDbObjectResponse>(
            SchemaDiscovery.SYS_DB_OBJECT_TABLE,
            tableQuery
        );

        if (!tableResp || tableResp.status !== 200 || !tableResp.bodyObject?.result || tableResp.bodyObject.result.length === 0) {
            throw new Error(`Table '${tableName}' not found in sys_db_object`);
        }

        const tableRecord = tableResp.bodyObject.result[0];

        // Query sys_dictionary for field definitions
        const dictQuery: Record<string, string | number> = {
            sysparm_query: `name=${tableName}^elementISNOTEMPTY`,
            sysparm_limit: 500
        };

        const dictResp: IHttpResponse<SysDictionaryResponse> = await this._tableAPI.get<SysDictionaryResponse>(
            SchemaDiscovery.SYS_DICTIONARY_TABLE,
            dictQuery
        );

        const dictRecords = (dictResp.status === 200 && dictResp.bodyObject?.result) ? dictResp.bodyObject.result : [];

        // Build field schemas
        const fields: FieldSchema[] = dictRecords.map((record: SysDictionaryRecord) => {
            const internalType = typeof record.internal_type === 'object' && record.internal_type !== null
                ? (record.internal_type as { value: string }).value || ''
                : (record.internal_type || '') as string;

            const referenceTable = typeof record.reference === 'object' && record.reference !== null
                ? (record.reference as { value: string }).value || undefined
                : (record.reference || undefined) as string | undefined;

            return {
                name: record.element,
                label: record.column_label || record.element,
                internalType: internalType,
                maxLength: parseInt(record.max_length || '0', 10),
                mandatory: record.mandatory === 'true',
                readOnly: record.read_only === 'true',
                referenceTable: referenceTable,
                defaultValue: record.default_value || undefined
            };
        });

        // Determine super class
        let superClass: string | undefined;
        if (tableRecord.super_class) {
            superClass = typeof tableRecord.super_class === 'object' && tableRecord.super_class !== null
                ? (tableRecord.super_class as { display_value?: string; value: string }).display_value || (tableRecord.super_class as { value: string }).value
                : tableRecord.super_class as string;
        }

        const schema: TableSchema = {
            table: tableName,
            label: tableRecord.label || tableName,
            superClass,
            fields
        };

        // Optionally include choice tables
        if (options.includeChoiceTables) {
            schema.choiceTables = await this._getChoicesForTable(tableName);
        }

        // Optionally include relationships
        if (options.includeRelationships) {
            schema.relationships = this._extractRelationships(fields);
        }

        // Optionally include UI policies
        if (options.includeUIPolicies) {
            schema.uiPolicies = await this._getUIPoliciesForTable(tableName);
        }

        // Optionally include business rules
        if (options.includeBusinessRules) {
            schema.businessRules = await this._getBusinessRulesForTable(tableName);
        }

        this._logger.info(`Discovered schema for ${tableName}: ${fields.length} fields`);
        return schema;
    }

    /**
     * Explain a specific field on a table.
     * Queries sys_dictionary for the field definition and sys_choice for available choices.
     *
     * @param tableName The table containing the field
     * @param fieldName The field name to explain
     * @returns Detailed FieldExplanation
     * @throws Error if tableName or fieldName is empty, or the field is not found
     */
    public async explainField(tableName: string, fieldName: string): Promise<FieldExplanation> {
        if (!tableName || tableName.trim().length === 0) {
            throw new Error('Table name is required');
        }
        if (!fieldName || fieldName.trim().length === 0) {
            throw new Error('Field name is required');
        }

        this._logger.info(`Explaining field: ${tableName}.${fieldName}`);

        // Query sys_dictionary for the specific field
        const dictQuery: Record<string, string | number> = {
            sysparm_query: `name=${tableName}^element=${fieldName}`,
            sysparm_limit: 1
        };

        const dictResp: IHttpResponse<SysDictionaryResponse> = await this._tableAPI.get<SysDictionaryResponse>(
            SchemaDiscovery.SYS_DICTIONARY_TABLE,
            dictQuery
        );

        if (!dictResp || dictResp.status !== 200 || !dictResp.bodyObject?.result || dictResp.bodyObject.result.length === 0) {
            throw new Error(`Field '${fieldName}' not found on table '${tableName}'`);
        }

        const record = dictResp.bodyObject.result[0];

        const internalType = typeof record.internal_type === 'object' && record.internal_type !== null
            ? (record.internal_type as { value: string }).value || ''
            : (record.internal_type || '') as string;

        const referenceTable = typeof record.reference === 'object' && record.reference !== null
            ? (record.reference as { value: string }).value || undefined
            : (record.reference || undefined) as string | undefined;

        // Query sys_choice for available choices
        const choiceQuery: Record<string, string | number> = {
            sysparm_query: `name=${tableName}^element=${fieldName}`,
            sysparm_limit: 500
        };

        const choiceResp: IHttpResponse<SysChoiceResponse> = await this._tableAPI.get<SysChoiceResponse>(
            SchemaDiscovery.SYS_CHOICE_TABLE,
            choiceQuery
        );

        let choices: Array<{ label: string; value: string }> | undefined;
        if (choiceResp.status === 200 && choiceResp.bodyObject?.result && choiceResp.bodyObject.result.length > 0) {
            choices = choiceResp.bodyObject.result.map((choice: SysChoiceRecord) => ({
                label: choice.label,
                value: choice.value
            }));
        }

        this._logger.info(`Explained field: ${tableName}.${fieldName}`);

        return {
            field: fieldName,
            table: tableName,
            label: record.column_label || fieldName,
            type: internalType,
            maxLength: parseInt(record.max_length || '0', 10),
            mandatory: record.mandatory === 'true',
            readOnly: record.read_only === 'true',
            comments: record.comments || undefined,
            help: record.help || undefined,
            referenceTable,
            choices
        };
    }

    /**
     * Validate a catalog item configuration.
     * Checks variables (item_option_new) and UI policies (catalog_ui_policy) for integrity issues.
     *
     * @param catalogItemSysId The sys_id of the catalog item to validate
     * @returns Validation result with issues, warnings, and errors
     * @throws Error if catalogItemSysId is empty
     */
    public async validateCatalogConfiguration(catalogItemSysId: string): Promise<CatalogValidationResult> {
        if (!catalogItemSysId || catalogItemSysId.trim().length === 0) {
            throw new Error('Catalog item sys_id is required');
        }

        this._logger.info(`Validating catalog configuration for: ${catalogItemSysId}`);

        const issues: ValidationIssue[] = [];

        // Query variables (item_option_new)
        const varQuery: Record<string, string | number> = {
            sysparm_query: `cat_item=${catalogItemSysId}`,
            sysparm_limit: 500
        };

        const varResp: IHttpResponse<CatalogItemOptionResponse> = await this._tableAPI.get<CatalogItemOptionResponse>(
            SchemaDiscovery.ITEM_OPTION_NEW_TABLE,
            varQuery
        );

        const variables = (varResp.status === 200 && varResp.bodyObject?.result) ? varResp.bodyObject.result : [];

        // Validate variables
        const variableNames = new Set<string>();
        for (const variable of variables) {
            // Check for missing name
            if (!variable.name || variable.name.trim().length === 0) {
                issues.push({
                    severity: 'error',
                    component: 'variable',
                    sys_id: variable.sys_id,
                    issue: 'Variable has no name',
                    fix: 'Set a unique variable name'
                });
            } else {
                // Check for duplicate names
                if (variableNames.has(variable.name)) {
                    issues.push({
                        severity: 'error',
                        component: 'variable',
                        sys_id: variable.sys_id,
                        issue: `Duplicate variable name: ${variable.name}`,
                        fix: 'Rename the variable to be unique within the catalog item'
                    });
                }
                variableNames.add(variable.name);
            }

            // Check for missing question text
            if (!variable.question_text || variable.question_text.trim().length === 0) {
                issues.push({
                    severity: 'warning',
                    component: 'variable',
                    sys_id: variable.sys_id,
                    issue: `Variable '${variable.name || 'unnamed'}' has no question text`,
                    fix: 'Add a descriptive question text for the variable'
                });
            }

            // Check for inactive mandatory variables
            if (variable.mandatory === 'true' && variable.active === 'false') {
                issues.push({
                    severity: 'warning',
                    component: 'variable',
                    sys_id: variable.sys_id,
                    issue: `Mandatory variable '${variable.name || 'unnamed'}' is inactive`,
                    fix: 'Either activate the variable or remove the mandatory flag'
                });
            }
        }

        // Query UI policies
        const policyQuery: Record<string, string | number> = {
            sysparm_query: `catalog_item=${catalogItemSysId}`,
            sysparm_limit: 500
        };

        const policyResp: IHttpResponse<CatalogUIPolicyResponse> = await this._tableAPI.get<CatalogUIPolicyResponse>(
            SchemaDiscovery.CATALOG_UI_POLICY_TABLE,
            policyQuery
        );

        const policies = (policyResp.status === 200 && policyResp.bodyObject?.result) ? policyResp.bodyObject.result : [];

        // Validate UI policies
        for (const policy of policies) {
            if (!policy.short_description || policy.short_description.trim().length === 0) {
                issues.push({
                    severity: 'warning',
                    component: 'ui_policy',
                    sys_id: policy.sys_id,
                    issue: 'UI policy has no short description',
                    fix: 'Add a descriptive short description to the UI policy'
                });
            }
        }

        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;

        this._logger.info(`Validation complete: ${errorCount} errors, ${warningCount} warnings`);

        return {
            valid: errorCount === 0,
            issues,
            warnings: warningCount,
            errors: errorCount
        };
    }

    /**
     * Get choice values for all fields on a table.
     * @private
     */
    private async _getChoicesForTable(tableName: string): Promise<Array<{ field: string; choices: Array<{ label: string; value: string }> }>> {
        const choiceQuery: Record<string, string | number> = {
            sysparm_query: `name=${tableName}`,
            sysparm_limit: 1000
        };

        const choiceResp: IHttpResponse<SysChoiceResponse> = await this._tableAPI.get<SysChoiceResponse>(
            SchemaDiscovery.SYS_CHOICE_TABLE,
            choiceQuery
        );

        if (choiceResp.status !== 200 || !choiceResp.bodyObject?.result) {
            return [];
        }

        // Group choices by field
        const fieldChoices = new Map<string, Array<{ label: string; value: string }>>();
        for (const choice of choiceResp.bodyObject.result) {
            if (!fieldChoices.has(choice.element)) {
                fieldChoices.set(choice.element, []);
            }
            fieldChoices.get(choice.element)!.push({
                label: choice.label,
                value: choice.value
            });
        }

        return Array.from(fieldChoices.entries()).map(([field, choices]) => ({
            field,
            choices
        }));
    }

    /**
     * Extract relationship information from field schemas (reference fields).
     * @private
     */
    private _extractRelationships(fields: FieldSchema[]): Array<{ name: string; type: string; relatedTable: string }> {
        return fields
            .filter(f => f.referenceTable)
            .map(f => ({
                name: f.name,
                type: 'reference',
                relatedTable: f.referenceTable!
            }));
    }

    /**
     * Get UI policies for a table.
     * @private
     */
    private async _getUIPoliciesForTable(tableName: string): Promise<Array<{ sys_id: string; short_description: string; active: boolean }>> {
        const query: Record<string, string | number> = {
            sysparm_query: `table=${tableName}`,
            sysparm_limit: 500
        };

        const resp: IHttpResponse<{ result: Array<{ sys_id: string; short_description?: string; active?: string; [key: string]: unknown }> }> =
            await this._tableAPI.get(
                'sys_ui_policy',
                query
            );

        if (resp.status !== 200 || !resp.bodyObject?.result) {
            return [];
        }

        return resp.bodyObject.result.map(policy => ({
            sys_id: policy.sys_id,
            short_description: policy.short_description || '',
            active: policy.active === 'true'
        }));
    }

    /**
     * Get business rules for a table.
     * @private
     */
    private async _getBusinessRulesForTable(tableName: string): Promise<Array<{ sys_id: string; name: string; when: string; active: boolean }>> {
        const query: Record<string, string | number> = {
            sysparm_query: `collection=${tableName}`,
            sysparm_limit: 500
        };

        const resp: IHttpResponse<{ result: Array<{ sys_id: string; name?: string; when?: string; active?: string; [key: string]: unknown }> }> =
            await this._tableAPI.get(
                'sys_script',
                query
            );

        if (resp.status !== 200 || !resp.bodyObject?.result) {
            return [];
        }

        return resp.bodyObject.result.map(rule => ({
            sys_id: rule.sys_id,
            name: rule.name || '',
            when: rule.when || '',
            active: rule.active === 'true'
        }));
    }
}

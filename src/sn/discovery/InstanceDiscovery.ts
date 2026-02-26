import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import {
    ListTablesOptions,
    ListScopedAppsOptions,
    ListStoreAppsOptions,
    ListPluginsOptions,
    TableDefinition,
    ScopedAppRecord,
    StoreAppRecord,
    PluginRecord,
    TableDefinitionResponse,
    ScopedAppResponse,
    StoreAppResponse,
    PluginResponse
} from './DiscoveryModels';

/**
 * InstanceDiscovery provides methods for discovering what tables,
 * scoped applications, store applications, and plugins exist on a
 * ServiceNow instance.
 */
export class InstanceDiscovery {
    private static readonly SYS_DB_OBJECT_TABLE = 'sys_db_object';
    private static readonly SYS_APP_TABLE = 'sys_app';
    private static readonly SYS_STORE_APP_TABLE = 'sys_store_app';
    private static readonly V_PLUGIN_TABLE = 'v_plugin';

    private _logger: Logger = new Logger("InstanceDiscovery");
    private _tableAPI: TableAPIRequest;
    private _instance: ServiceNowInstance;

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._tableAPI = new TableAPIRequest(instance);
    }

    /**
     * List tables on the instance with optional filtering.
     *
     * @param options Filtering and pagination options
     * @returns Array of table definitions
     */
    public async listTables(options: ListTablesOptions = {}): Promise<TableDefinition[]> {
        this._logger.info('Listing tables on instance');

        const queryParts: string[] = [];

        if (options.namePrefix) {
            queryParts.push(`nameSTARTSWITH${options.namePrefix}`);
        }
        if (options.scope) {
            queryParts.push(`sys_scope=${options.scope}`);
        }
        if (options.extendableOnly) {
            queryParts.push('is_extendable=true');
        }
        if (options.query) {
            queryParts.push(options.query);
        }

        const query: Record<string, string | number> = {
            sysparm_limit: options.limit ?? 100
        };

        if (options.offset !== undefined && options.offset > 0) {
            query.sysparm_offset = options.offset;
        }

        if (queryParts.length > 0) {
            query.sysparm_query = queryParts.join('^');
        }

        if (options.fields && options.fields.length > 0) {
            query.sysparm_fields = options.fields.join(',');
        }

        const response: IHttpResponse<TableDefinitionResponse> = await this._tableAPI.get<TableDefinitionResponse>(
            InstanceDiscovery.SYS_DB_OBJECT_TABLE,
            query
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Found ${response.bodyObject.result.length} tables`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to list tables. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * List scoped applications on the instance.
     *
     * @param options Filtering and pagination options
     * @returns Array of scoped application records
     */
    public async listScopedApps(options: ListScopedAppsOptions = {}): Promise<ScopedAppRecord[]> {
        this._logger.info('Listing scoped applications');

        const queryParts: string[] = [];

        if (options.namePrefix) {
            queryParts.push(`nameSTARTSWITH${options.namePrefix}`);
        }
        if (options.activeOnly) {
            queryParts.push('active=true');
        }
        if (options.query) {
            queryParts.push(options.query);
        }

        const query: Record<string, string | number> = {
            sysparm_limit: options.limit ?? 100
        };

        if (options.offset !== undefined && options.offset > 0) {
            query.sysparm_offset = options.offset;
        }

        if (queryParts.length > 0) {
            query.sysparm_query = queryParts.join('^');
        }

        const response: IHttpResponse<ScopedAppResponse> = await this._tableAPI.get<ScopedAppResponse>(
            InstanceDiscovery.SYS_APP_TABLE,
            query
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Found ${response.bodyObject.result.length} scoped applications`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to list scoped applications. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * List store applications on the instance.
     *
     * @param options Filtering and pagination options
     * @returns Array of store application records
     */
    public async listStoreApps(options: ListStoreAppsOptions = {}): Promise<StoreAppRecord[]> {
        this._logger.info('Listing store applications');

        const queryParts: string[] = [];

        if (options.namePrefix) {
            queryParts.push(`nameSTARTSWITH${options.namePrefix}`);
        }
        if (options.activeOnly) {
            queryParts.push('active=true');
        }
        if (options.query) {
            queryParts.push(options.query);
        }

        const query: Record<string, string | number> = {
            sysparm_limit: options.limit ?? 100
        };

        if (options.offset !== undefined && options.offset > 0) {
            query.sysparm_offset = options.offset;
        }

        if (queryParts.length > 0) {
            query.sysparm_query = queryParts.join('^');
        }

        const response: IHttpResponse<StoreAppResponse> = await this._tableAPI.get<StoreAppResponse>(
            InstanceDiscovery.SYS_STORE_APP_TABLE,
            query
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Found ${response.bodyObject.result.length} store applications`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to list store applications. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * List plugins on the instance.
     *
     * @param options Filtering and pagination options
     * @returns Array of plugin records
     */
    public async listPlugins(options: ListPluginsOptions = {}): Promise<PluginRecord[]> {
        this._logger.info('Listing plugins');

        const queryParts: string[] = [];

        if (options.namePrefix) {
            queryParts.push(`nameSTARTSWITH${options.namePrefix}`);
        }
        if (options.activeOnly) {
            queryParts.push('active=active');
        }
        if (options.query) {
            queryParts.push(options.query);
        }

        const query: Record<string, string | number> = {
            sysparm_limit: options.limit ?? 100
        };

        if (options.offset !== undefined && options.offset > 0) {
            query.sysparm_offset = options.offset;
        }

        if (queryParts.length > 0) {
            query.sysparm_query = queryParts.join('^');
        }

        const response: IHttpResponse<PluginResponse> = await this._tableAPI.get<PluginResponse>(
            InstanceDiscovery.V_PLUGIN_TABLE,
            query
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Found ${response.bodyObject.result.length} plugins`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to list plugins. Status: ${response?.status ?? 'unknown'}`);
    }
}

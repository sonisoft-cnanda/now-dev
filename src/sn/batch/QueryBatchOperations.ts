import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import { HTTPRequest } from "../../comm/http/HTTPRequest";
import {
    QueryUpdateOptions,
    QueryDeleteOptions,
    QueryUpdateResult,
    QueryDeleteResult,
    QueryMatchResponse
} from './QueryBatchModels';

/**
 * QueryBatchOperations provides query-based bulk update and delete operations.
 * Records are found by encoded query, then updated or deleted in bulk.
 * Includes a dry-run mode (default) for safe previewing before execution.
 */
export class QueryBatchOperations {
    private static readonly DEFAULT_LIMIT = 200;
    private static readonly MAX_LIMIT = 10000;

    private _logger: Logger = new Logger("QueryBatchOperations");
    private _req: ServiceNowRequest;
    private _tableAPI: TableAPIRequest;
    private _instance: ServiceNowInstance;

    private _headers: object = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
        this._tableAPI = new TableAPIRequest(instance);
    }

    /**
     * Find records matching a query and update them with the provided data.
     * Defaults to dry-run mode (confirm=false) which returns match count without executing.
     *
     * @param options Query update options
     * @returns QueryUpdateResult with match count, update count, and any errors
     * @throws Error if table, query, or data is empty
     */
    public async queryUpdate(options: QueryUpdateOptions): Promise<QueryUpdateResult> {
        const startTime = Date.now();

        if (!options.table || options.table.trim().length === 0) {
            throw new Error('Table name is required');
        }
        if (!options.query || options.query.trim().length === 0) {
            throw new Error('Query is required');
        }
        if (!options.data || Object.keys(options.data).length === 0) {
            throw new Error('Update data is required and must not be empty');
        }

        const limit = Math.min(options.limit ?? QueryBatchOperations.DEFAULT_LIMIT, QueryBatchOperations.MAX_LIMIT);
        const isDryRun = options.confirm !== true;

        this._logger.info(`Query update on '${options.table}' with query '${options.query}' (dryRun=${isDryRun}, limit=${limit})`);

        // Step 1: Find matching records
        const matchingSysIds = await this._findMatchingRecords(options.table, options.query, limit);
        const matchCount = matchingSysIds.length;

        if (options.onProgress) {
            options.onProgress(`Found ${matchCount} matching records in '${options.table}'`);
        }

        // Step 2: Dry run - return count only
        if (isDryRun) {
            this._logger.info(`Dry run: ${matchCount} records would be updated in '${options.table}'`);
            return {
                dryRun: true,
                matchCount,
                updatedCount: 0,
                success: true,
                errors: [],
                executionTimeMs: Date.now() - startTime
            };
        }

        // Step 3: Execute updates
        const errors: QueryUpdateResult['errors'] = [];
        let updatedCount = 0;

        for (let i = 0; i < matchingSysIds.length; i++) {
            const sysId = matchingSysIds[i];

            try {
                const response = await this._tableAPI.put(options.table, sysId, options.data);

                if (response && response.status === 200) {
                    updatedCount++;
                } else {
                    errors.push({ sysId, error: `Update failed with status: ${response?.status ?? 'unknown'}` });
                }
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                errors.push({ sysId, error: errorMsg });
            }

            if (options.onProgress && (i + 1) % 50 === 0) {
                options.onProgress(`Updated ${updatedCount}/${matchCount} records (${errors.length} errors)`);
            }
        }

        if (options.onProgress) {
            options.onProgress(`Update complete: ${updatedCount} updated, ${errors.length} errors`);
        }

        return {
            dryRun: false,
            matchCount,
            updatedCount,
            success: errors.length === 0,
            errors,
            executionTimeMs: Date.now() - startTime
        };
    }

    /**
     * Find records matching a query and delete them.
     * Defaults to dry-run mode (confirm=false) which returns match count without executing.
     *
     * @param options Query delete options
     * @returns QueryDeleteResult with match count, delete count, and any errors
     * @throws Error if table or query is empty
     */
    public async queryDelete(options: QueryDeleteOptions): Promise<QueryDeleteResult> {
        const startTime = Date.now();

        if (!options.table || options.table.trim().length === 0) {
            throw new Error('Table name is required');
        }
        if (!options.query || options.query.trim().length === 0) {
            throw new Error('Query is required');
        }

        const limit = Math.min(options.limit ?? QueryBatchOperations.DEFAULT_LIMIT, QueryBatchOperations.MAX_LIMIT);
        const isDryRun = options.confirm !== true;

        this._logger.info(`Query delete on '${options.table}' with query '${options.query}' (dryRun=${isDryRun}, limit=${limit})`);

        // Step 1: Find matching records
        const matchingSysIds = await this._findMatchingRecords(options.table, options.query, limit);
        const matchCount = matchingSysIds.length;

        if (options.onProgress) {
            options.onProgress(`Found ${matchCount} matching records in '${options.table}'`);
        }

        // Step 2: Dry run - return count only
        if (isDryRun) {
            this._logger.info(`Dry run: ${matchCount} records would be deleted from '${options.table}'`);
            return {
                dryRun: true,
                matchCount,
                deletedCount: 0,
                success: true,
                errors: [],
                executionTimeMs: Date.now() - startTime
            };
        }

        // Step 3: Execute deletes
        const errors: QueryDeleteResult['errors'] = [];
        let deletedCount = 0;

        for (let i = 0; i < matchingSysIds.length; i++) {
            const sysId = matchingSysIds[i];

            try {
                const request: HTTPRequest = {
                    path: `/api/now/table/${options.table}/${sysId}`,
                    method: 'delete',
                    headers: this._headers,
                    query: null,
                    body: null
                };

                const response = await this._req.executeRequest(request);

                if (response && (response.status === 200 || response.status === 204)) {
                    deletedCount++;
                } else {
                    errors.push({ sysId, error: `Delete failed with status: ${response?.status ?? 'unknown'}` });
                }
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                errors.push({ sysId, error: errorMsg });
            }

            if (options.onProgress && (i + 1) % 50 === 0) {
                options.onProgress(`Deleted ${deletedCount}/${matchCount} records (${errors.length} errors)`);
            }
        }

        if (options.onProgress) {
            options.onProgress(`Delete complete: ${deletedCount} deleted, ${errors.length} errors`);
        }

        return {
            dryRun: false,
            matchCount,
            deletedCount,
            success: errors.length === 0,
            errors,
            executionTimeMs: Date.now() - startTime
        };
    }

    /**
     * Find records matching a query and return their sys_ids.
     * Only fetches sys_id field for efficiency.
     * @private
     */
    private async _findMatchingRecords(table: string, query: string, limit: number): Promise<string[]> {
        const queryParams: Record<string, string | number> = {
            sysparm_query: query,
            sysparm_limit: limit,
            sysparm_fields: 'sys_id'
        };

        const response: IHttpResponse<QueryMatchResponse> = await this._tableAPI.get<QueryMatchResponse>(
            table,
            queryParams
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            return response.bodyObject.result.map(r => r.sys_id);
        }

        throw new Error(`Failed to query records in table '${table}'. Status: ${response?.status ?? 'unknown'}`);
    }
}

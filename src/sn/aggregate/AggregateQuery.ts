import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import { HTTPRequest } from "../../comm/http/HTTPRequest";
import {
    AggregateQueryOptions,
    CountQueryOptions,
    AggregateResult,
    GroupedAggregateResult,
    AggregateResponse,
    GroupedAggregateResponse
} from './AggregateModels';

/**
 * AggregateQuery provides aggregate operations (COUNT, AVG, MIN, MAX, SUM)
 * against ServiceNow tables via the Stats API (/api/now/stats/).
 * Supports GROUP BY for grouped aggregations.
 */
export class AggregateQuery {
    private static readonly STATS_API_BASE = '/api/now/stats/';

    private _logger: Logger = new Logger("AggregateQuery");
    private _req: ServiceNowRequest;
    private _instance: ServiceNowInstance;

    private _headers: object = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
    }

    /**
     * Count records matching an optional query on a table.
     * Convenience method that returns a parsed integer.
     *
     * @param options Count query options (table required, query optional)
     * @returns The number of matching records
     * @throws Error if table name is empty or the API call fails
     */
    public async count(options: CountQueryOptions): Promise<number> {
        if (!options.table || options.table.trim().length === 0) {
            throw new Error('Table name is required');
        }

        this._logger.info(`Counting records in table: ${options.table}${options.query ? ` with query: ${options.query}` : ''}`);

        const queryParams: Record<string, string> = {
            sysparm_count: 'true'
        };

        if (options.query) {
            queryParams.sysparm_query = options.query;
        }

        const response = await this._executeStatsRequest<AggregateResponse>(options.table, queryParams);

        if (response && response.status === 200 && response.bodyObject?.result?.stats) {
            const count = parseInt(response.bodyObject.result.stats.count || '0', 10);
            this._logger.info(`Count result for ${options.table}: ${count}`);
            return count;
        }

        throw new Error(`Failed to count records in table '${options.table}'. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Run an aggregate query (COUNT, AVG, MIN, MAX, SUM) without grouping.
     *
     * @param options Aggregate query options
     * @returns AggregateResult containing the computed statistics
     * @throws Error if table name is empty or the API call fails
     */
    public async aggregate(options: AggregateQueryOptions): Promise<AggregateResult> {
        if (!options.table || options.table.trim().length === 0) {
            throw new Error('Table name is required');
        }

        this._logger.info(`Running aggregate query on table: ${options.table}`);

        const queryParams = this._buildQueryParams(options);
        const response = await this._executeStatsRequest<AggregateResponse>(options.table, queryParams);

        if (response && response.status === 200 && response.bodyObject?.result?.stats) {
            this._logger.info(`Aggregate query complete for ${options.table}`);
            return { stats: response.bodyObject.result.stats };
        }

        throw new Error(`Failed to run aggregate query on table '${options.table}'. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Run a grouped aggregate query with GROUP BY.
     *
     * @param options Aggregate query options (groupBy is required)
     * @returns GroupedAggregateResult with groups and their stats
     * @throws Error if table name is empty, groupBy is missing/empty, or the API call fails
     */
    public async groupBy(options: AggregateQueryOptions): Promise<GroupedAggregateResult> {
        if (!options.table || options.table.trim().length === 0) {
            throw new Error('Table name is required');
        }

        if (!options.groupBy || options.groupBy.length === 0) {
            throw new Error('groupBy fields are required for grouped aggregation');
        }

        this._logger.info(`Running grouped aggregate on table: ${options.table}, groupBy: ${options.groupBy.join(',')}`);

        const queryParams = this._buildQueryParams(options);
        const response = await this._executeStatsRequest<GroupedAggregateResponse>(options.table, queryParams);

        if (response && response.status === 200 && response.bodyObject?.result) {
            const groups = Array.isArray(response.bodyObject.result)
                ? response.bodyObject.result
                : [];
            this._logger.info(`Grouped aggregate complete for ${options.table}: ${groups.length} groups`);
            return { groups };
        }

        throw new Error(`Failed to run grouped aggregate on table '${options.table}'. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Build query parameters from aggregate options.
     * @private
     */
    private _buildQueryParams(options: AggregateQueryOptions): Record<string, string> {
        const params: Record<string, string> = {};

        if (options.count) {
            params.sysparm_count = 'true';
        }

        if (options.avgFields && options.avgFields.length > 0) {
            params.sysparm_avg_fields = options.avgFields.join(',');
        }

        if (options.minFields && options.minFields.length > 0) {
            params.sysparm_min_fields = options.minFields.join(',');
        }

        if (options.maxFields && options.maxFields.length > 0) {
            params.sysparm_max_fields = options.maxFields.join(',');
        }

        if (options.sumFields && options.sumFields.length > 0) {
            params.sysparm_sum_fields = options.sumFields.join(',');
        }

        if (options.groupBy && options.groupBy.length > 0) {
            params.sysparm_group_by = options.groupBy.join(',');
        }

        if (options.query) {
            params.sysparm_query = options.query;
        }

        if (options.having) {
            params.sysparm_having = options.having;
        }

        if (options.displayValue) {
            params.sysparm_display_value = options.displayValue;
        }

        return params;
    }

    /**
     * Execute a GET request against the Stats API.
     * @private
     */
    private async _executeStatsRequest<T>(tableName: string, queryParams: Record<string, string>): Promise<IHttpResponse<T>> {
        const request: HTTPRequest = {
            path: AggregateQuery.STATS_API_BASE + tableName,
            method: 'get',
            headers: this._headers,
            query: queryParams,
            body: null
        };

        return await this._req.executeRequest<T>(request);
    }
}

import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { HTTPRequest } from "../../comm/http/HTTPRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import {
    CodeSearchOptions,
    CodeSearchResult,
    CodeSearchRecordTypeResult,
    CodeSearchResponse,
    CodeSearchTable,
    CodeSearchTablesResponse,
    CodeSearchGroup,
    CodeSearchGroupResponse,
    CodeSearchGroupQueryOptions
} from './CodeSearchModels';

/**
 * CodeSearch class for querying ServiceNow's code search REST API.
 * Supports searching across the platform, within specific applications or tables,
 * listing search groups, and listing tables within a search group.
 */
export class CodeSearch {
    private static readonly SEARCH_API_PATH = '/api/sn_codesearch/code_search/search';
    private static readonly TABLES_API_PATH = '/api/sn_codesearch/code_search/tables';
    private static readonly SEARCH_GROUP_TABLE = 'sn_codesearch_search_group';

    private _logger: Logger = new Logger("CodeSearch");
    private _req: ServiceNowRequest;
    private _tableAPI: TableAPIRequest;
    private _instance: ServiceNowInstance;

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
        this._tableAPI = new TableAPIRequest(instance);
    }

    /**
     * Search across the ServiceNow platform for code matching the given term.
     * Returns flattened results for easy consumption by CLI and MCP consumers.
     * Uses GET /api/sn_codesearch/code_search/search
     *
     * @param options Search options including the required search term
     * @returns Array of flattened CodeSearchResult items
     * @throws Error if term is empty or if table is specified without search_group
     */
    public async search(options: CodeSearchOptions): Promise<CodeSearchResult[]> {
        const raw = await this.searchRaw(options);
        return CodeSearch.flattenResults(raw);
    }

    /**
     * Search and return the raw hierarchical response from the API.
     * Results are grouped by record type, then by hit, then by field match.
     * Use this when you need the full response structure.
     *
     * @param options Search options including the required search term
     * @returns Array of CodeSearchRecordTypeResult groups
     * @throws Error if term is empty or if table is specified without search_group
     */
    public async searchRaw(options: CodeSearchOptions): Promise<CodeSearchRecordTypeResult[]> {
        if (!options.term || options.term.trim().length === 0) {
            throw new Error('Search term is required');
        }

        if (options.table && !options.search_group) {
            throw new Error('search_group is required when searching a specific table');
        }

        this._logger.info(`Performing code search for term: ${options.term}`);

        const query: Record<string, string> = {
            term: options.term
        };

        if (options.search_group) {
            query.search_group = options.search_group;
        }
        if (options.table) {
            query.table = options.table;
        }
        if (options.current_app) {
            query.current_app = options.current_app;
        }
        if (options.search_all_scopes !== undefined) {
            query.search_all_scopes = String(options.search_all_scopes);
        }
        if (options.extended_matching !== undefined) {
            query.extended_matching = String(options.extended_matching);
        }
        if (options.limit !== undefined) {
            query.limit = String(options.limit);
        }

        const request: HTTPRequest = {
            method: 'GET',
            path: CodeSearch.SEARCH_API_PATH,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            query: query,
            body: null
        };

        const resp: IHttpResponse<CodeSearchResponse> = await this._req.get<CodeSearchResponse>(request);

        if (resp.status === 200 && resp.bodyObject?.result) {
            const results = resp.bodyObject.result;
            // The API normally returns an array of record type groups.
            // When filtering by table, it may return a single object — normalize to array.
            const normalized = Array.isArray(results) ? results : [results];
            this._logger.info(`Code search returned ${normalized.length} record type groups`);
            return normalized;
        }

        throw new Error(`Code search failed. Status: ${resp.status}`);
    }

    /**
     * Search for code within a specific application scope.
     * Convenience method that sets current_app and search_all_scopes=false.
     *
     * @param term The search term
     * @param appScope The application scope to search within (e.g., "x_myapp")
     * @param additionalOptions Optional additional search options
     * @returns Array of flattened CodeSearchResult items
     */
    public async searchInApp(
        term: string,
        appScope: string,
        additionalOptions?: Omit<CodeSearchOptions, 'term' | 'current_app' | 'search_all_scopes'>
    ): Promise<CodeSearchResult[]> {
        return this.search({
            ...additionalOptions,
            term,
            current_app: appScope,
            search_all_scopes: false
        });
    }

    /**
     * Search for code within a specific table.
     * Convenience method that sets table and search_group.
     *
     * @param term The search term
     * @param tableName The table to search in
     * @param searchGroup The search group name (required when searching by table)
     * @param additionalOptions Optional additional search options
     * @returns Array of flattened CodeSearchResult items
     */
    public async searchInTable(
        term: string,
        tableName: string,
        searchGroup: string,
        additionalOptions?: Omit<CodeSearchOptions, 'term' | 'table' | 'search_group'>
    ): Promise<CodeSearchResult[]> {
        return this.search({
            ...additionalOptions,
            term,
            table: tableName,
            search_group: searchGroup
        });
    }

    /**
     * List the tables that would be searched for a given search group.
     * Uses GET /api/sn_codesearch/code_search/tables
     *
     * @param searchGroup The search group NAME
     * @returns Array of CodeSearchTable items
     * @throws Error if searchGroup is empty
     */
    public async getTablesForSearchGroup(searchGroup: string): Promise<CodeSearchTable[]> {
        if (!searchGroup || searchGroup.trim().length === 0) {
            throw new Error('Search group name is required');
        }

        this._logger.info(`Listing tables for search group: ${searchGroup}`);

        const request: HTTPRequest = {
            method: 'GET',
            path: CodeSearch.TABLES_API_PATH,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            query: { search_group: searchGroup },
            body: null
        };

        const resp: IHttpResponse<CodeSearchTablesResponse> = await this._req.get<CodeSearchTablesResponse>(request);

        if (resp.status === 200 && resp.bodyObject?.result) {
            const tables = resp.bodyObject.result;
            this._logger.info(`Found ${tables.length} tables in search group: ${searchGroup}`);
            return tables;
        }

        throw new Error(`Failed to list tables for search group '${searchGroup}'. Status: ${resp.status}`);
    }

    /**
     * List all available code search groups.
     * Queries the sn_codesearch_search_group table via Table API.
     *
     * @param options Optional query/limit options
     * @returns Array of CodeSearchGroup records
     */
    public async getSearchGroups(options: CodeSearchGroupQueryOptions = {}): Promise<CodeSearchGroup[]> {
        const { encodedQuery, limit = 100 } = options;

        this._logger.info(`Querying code search groups with query: ${encodedQuery || 'none'}`);

        const query: Record<string, string | number> = {
            sysparm_limit: limit,
            sysparm_display_value: 'false'
        };

        if (encodedQuery) {
            query.sysparm_query = encodedQuery;
        }

        const response: IHttpResponse<CodeSearchGroupResponse> = await this._tableAPI.get<CodeSearchGroupResponse>(
            CodeSearch.SEARCH_GROUP_TABLE,
            query
        );

        if (response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Retrieved ${response.bodyObject.result.length} code search groups`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to query code search groups. Status: ${response.status}`);
    }

    /**
     * Flatten the hierarchical search API response into a simple array of results.
     * Each entry represents one field match in one record — ideal for CLI display or MCP output.
     *
     * @param rawResults The raw record type results from searchRaw()
     * @returns Flattened array of CodeSearchResult
     */
    public static flattenResults(rawResults: CodeSearchRecordTypeResult[]): CodeSearchResult[] {
        const flattened: CodeSearchResult[] = [];
        if (!rawResults || !Array.isArray(rawResults)) return flattened;

        for (const group of rawResults) {
            if (!group.hits || group.hits.length === 0) continue;

            for (const hit of group.hits) {
                if (!hit.matches || hit.matches.length === 0) continue;

                for (const match of hit.matches) {
                    const lineMatches = match.lineMatches || [];
                    flattened.push({
                        table: hit.className || group.recordType,
                        tableLabel: hit.tableLabel || group.tableLabel,
                        name: hit.name,
                        field: match.field,
                        fieldLabel: match.fieldLabel,
                        lineMatches: lineMatches,
                        matchCount: lineMatches.length,
                        firstMatchContext: lineMatches.length > 0 ? lineMatches[0].context : '',
                        firstMatchLine: lineMatches.length > 0 ? lineMatches[0].line : 0
                    });
                }
            }
        }

        return flattened;
    }

    /**
     * Format flattened search results as a simple text summary.
     * Useful for CLI output.
     *
     * @param results Flattened search results from search()
     * @returns Formatted string
     */
    public static formatResultsAsText(results: CodeSearchResult[]): string {
        if (results.length === 0) {
            return 'No results found.';
        }

        const lines: string[] = [];
        lines.push(`Found ${results.length} matches:\n`);

        for (const result of results) {
            lines.push(`  ${result.tableLabel} > ${result.name} > ${result.fieldLabel}`);
            lines.push(`    Table: ${result.table}, Field: ${result.field}, Matches: ${result.matchCount}`);

            for (const lm of result.lineMatches.slice(0, 3)) {
                const lineStr = lm.line > 0 ? `L${lm.line}: ` : '';
                lines.push(`      ${lineStr}${lm.context}`);
            }
            if (result.lineMatches.length > 3) {
                lines.push(`      ... and ${result.lineMatches.length - 3} more matches`);
            }
            lines.push('');
        }

        return lines.join('\n');
    }
}

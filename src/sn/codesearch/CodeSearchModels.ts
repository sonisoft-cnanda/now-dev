// ============================================================
// Request/Options Types
// ============================================================

/**
 * Options for performing a code search.
 * Maps to query parameters for GET /api/sn_codesearch/code_search/search
 */
export interface CodeSearchOptions {
    /** The term to search for (required) */
    term: string;

    /**
     * The Search Group NAME to search within (optional).
     * Note: This is the NAME of the code search group, not the sys_id.
     */
    search_group?: string;

    /**
     * The specific table to search in.
     * Requires search_group to also be provided.
     */
    table?: string;

    /**
     * When false, limits results to files within the scope specified by current_app.
     * Defaults to true (search all scopes).
     */
    search_all_scopes?: boolean;

    /**
     * Limits results to the specified application scope.
     * Only effective when search_all_scopes is false.
     */
    current_app?: string;

    /** When true, returns additional fields with match context */
    extended_matching?: boolean;

    /** Maximum number of results to return */
    limit?: number;
}

/**
 * Options for querying search groups from the table API.
 */
export interface CodeSearchGroupQueryOptions {
    /** Encoded query string for filtering search groups */
    encodedQuery?: string;

    /** Maximum number of records to return (default: 100) */
    limit?: number;
}

// ============================================================
// Search API Response Types (actual ServiceNow response shape)
// ============================================================

/**
 * A single line match within a field.
 */
export interface CodeSearchLineMatch {
    /** Line number of the match */
    line: number;

    /** The matching line content / context snippet */
    context: string;

    /** HTML-escaped version of the context */
    escaped?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * A matching field within a record hit.
 */
export interface CodeSearchFieldMatch {
    /** The field name where the match was found (e.g., "script") */
    field: string;

    /** Display label of the field (e.g., "Script") */
    fieldLabel: string;

    /** Array of individual line matches within this field */
    lineMatches: CodeSearchLineMatch[];

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * A record that contains matches — a "hit" within a record type group.
 */
export interface CodeSearchHit {
    /** The name/label of the record */
    name: string;

    /** The table name (className) of the record */
    className: string;

    /** Display label of the table */
    tableLabel: string;

    /** Array of field matches within this record */
    matches: CodeSearchFieldMatch[];

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * A record type group in the search results.
 * The search API groups results by table/record type.
 */
export interface CodeSearchRecordTypeResult {
    /** The table name / record type (e.g., "sys_script_include") */
    recordType: string;

    /** Display label of the table (e.g., "Script Includes") */
    tableLabel: string;

    /** Array of record hits within this record type */
    hits: CodeSearchHit[];

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * Top-level response from the code search API.
 * GET /api/sn_codesearch/code_search/search
 *
 * The result is an array of record type groups, each containing hits.
 */
export interface CodeSearchResponse {
    result: CodeSearchRecordTypeResult[];
}

// ============================================================
// Flattened Result (for easy CLI/MCP consumption)
// ============================================================

/**
 * A flattened, easy-to-consume search result.
 * Each entry represents a single field match in a single record.
 * Ideal for CLI table output or MCP server responses.
 */
export interface CodeSearchResult {
    /** The table name where the match was found */
    table: string;

    /** Display label of the table */
    tableLabel: string;

    /** The name of the record containing the match */
    name: string;

    /** The field name where the match was found */
    field: string;

    /** Display label of the field */
    fieldLabel: string;

    /** Array of line matches within this field */
    lineMatches: CodeSearchLineMatch[];

    /** Total number of line matches in this field */
    matchCount: number;

    /** First matching line's context (convenience for display) */
    firstMatchContext: string;

    /** First matching line number */
    firstMatchLine: number;
}

// ============================================================
// Tables Endpoint Response Types
// ============================================================

/**
 * A table entry returned by the tables endpoint.
 */
export interface CodeSearchTable {
    /** Table name (e.g., "sys_script_include") */
    name: string;

    /** Display label of the table */
    label?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * Response from the tables endpoint.
 * GET /api/sn_codesearch/code_search/tables
 *
 * The result is a flat array of table objects.
 */
export interface CodeSearchTablesResponse {
    result: CodeSearchTable[];
}

// ============================================================
// Search Groups Table API Response Types
// ============================================================

/**
 * A search group record from the sn_codesearch_search_group table.
 * Retrieved via Table API.
 */
export interface CodeSearchGroup {
    /** System ID */
    sys_id: string;

    /** Search group name — this is the value used in the search_group parameter */
    name: string;

    /** Description of the search group */
    description?: string;

    /** Whether extended matching is enabled */
    extended_matching?: string;

    /** Sys scope */
    sys_scope?: string | { link: string; value: string };

    /** Created timestamp */
    sys_created_on?: string;

    /** Updated timestamp */
    sys_updated_on?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * Response from the search groups table query (Table API).
 */
export interface CodeSearchGroupResponse {
    result: CodeSearchGroup[];
}

// ============================================================
// Code Search Table (sn_codesearch_table) Types
// ============================================================

/**
 * Options for adding a table to a code search group.
 * Maps to fields on the sn_codesearch_table table.
 */
export interface AddCodeSearchTableOptions {
    /** Table name to add (e.g., "sys_script_include") */
    table: string;

    /** Comma-separated fields to search (e.g., "script,name") */
    search_fields: string;

    /** sys_id of the target code search group */
    search_group: string;
}

/**
 * A record from the sn_codesearch_table Table API.
 * This is the full record shape including sys_id, unlike CodeSearchTable
 * which only has name/label from the REST endpoint.
 */
export interface CodeSearchTableRecord {
    /** System ID of this table record */
    sys_id: string;

    /** The table name (e.g., "sys_script_include") */
    table: string;

    /** Comma-separated search fields (e.g., "script,name") */
    search_fields: string;

    /** Reference (sys_id) to the search group */
    search_group: string | { link: string; value: string };

    /** Created timestamp */
    sys_created_on?: string;

    /** Updated timestamp */
    sys_updated_on?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * Response from inserting into sn_codesearch_table (Table API POST).
 * POST returns a single record under result.
 */
export interface CodeSearchTableRecordResponse {
    result: CodeSearchTableRecord;
}

/**
 * Response from querying sn_codesearch_table (Table API GET).
 * GET returns an array of records under result.
 */
export interface CodeSearchTableRecordsResponse {
    result: CodeSearchTableRecord[];
}

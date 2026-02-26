// ============================================================
// Options Types
// ============================================================

/**
 * Options for an aggregate query against a ServiceNow table.
 */
export interface AggregateQueryOptions {
    /** The table name to aggregate (required) */
    table: string;

    /** Encoded query to filter records before aggregation */
    query?: string;

    /** When true, includes record count in the result */
    count?: boolean;

    /** Field names to compute AVG on */
    avgFields?: string[];

    /** Field names to compute MIN on */
    minFields?: string[];

    /** Field names to compute MAX on */
    maxFields?: string[];

    /** Field names to compute SUM on */
    sumFields?: string[];

    /** Field names to GROUP BY */
    groupBy?: string[];

    /** HAVING clause for group filtering */
    having?: string;

    /** Display value handling: "true", "false", or "all" */
    displayValue?: "true" | "false" | "all";
}

/**
 * Convenience options for a simple count query.
 */
export interface CountQueryOptions {
    /** The table name to count records from (required) */
    table: string;

    /** Encoded query to filter records */
    query?: string;
}

// ============================================================
// Result Types
// ============================================================

/**
 * Statistics block returned in the aggregate response.
 * Keys follow ServiceNow naming: count, avg.{field}, min.{field}, max.{field}, sum.{field}
 */
export interface AggregateStats {
    /** Record count (when count was requested) */
    count?: string;

    /** Additional stat fields keyed by "avg.{field}", "min.{field}", etc. */
    [key: string]: unknown;
}

/**
 * A single group in a grouped aggregate result.
 */
export interface AggregateGroupResult {
    /** The group-by field values */
    groupby_fields: Array<{
        field: string;
        value: string;
        display_value?: string;
    }>;

    /** The stats for this group */
    stats: AggregateStats;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * Result of an aggregate query (non-grouped).
 */
export interface AggregateResult {
    /** The stats for the entire result set */
    stats: AggregateStats;
}

/**
 * Result of a grouped aggregate query.
 */
export interface GroupedAggregateResult {
    /** Array of group results */
    groups: AggregateGroupResult[];
}

// ============================================================
// ServiceNow Response Wrappers
// ============================================================

/**
 * Response wrapper for non-grouped aggregate queries.
 * The API returns { result: { stats: { count: "123", ... } } }
 */
export interface AggregateResponse {
    result: {
        stats: AggregateStats;
    };
}

/**
 * Response wrapper for grouped aggregate queries.
 * The API returns { result: [ { groupby_fields: [...], stats: {...} }, ... ] }
 */
export interface GroupedAggregateResponse {
    result: AggregateGroupResult[];
}

// ============================================================
// Options Types
// ============================================================

/**
 * Options for a query-based batch update operation.
 */
export interface QueryUpdateOptions {
    /** The table to update records in (required) */
    table: string;

    /** Encoded query to find matching records (required) */
    query: string;

    /** The field data to apply to all matching records (required) */
    data: Record<string, unknown>;

    /**
     * When true, actually executes the update.
     * When false (default), performs a dry run and returns match count only.
     */
    confirm?: boolean;

    /**
     * Maximum number of records to update.
     * Defaults to 200. Maximum allowed: 10000.
     */
    limit?: number;

    /** Optional progress callback invoked periodically */
    onProgress?: (message: string) => void;
}

/**
 * Options for a query-based batch delete operation.
 */
export interface QueryDeleteOptions {
    /** The table to delete records from (required) */
    table: string;

    /** Encoded query to find matching records (required) */
    query: string;

    /**
     * When true, actually executes the delete.
     * When false (default), performs a dry run and returns match count only.
     */
    confirm?: boolean;

    /**
     * Maximum number of records to delete.
     * Defaults to 200. Maximum allowed: 10000.
     */
    limit?: number;

    /** Optional progress callback invoked periodically */
    onProgress?: (message: string) => void;
}

// ============================================================
// Result Types
// ============================================================

/**
 * Result of a query-based batch update operation.
 */
export interface QueryUpdateResult {
    /** Whether this was a dry run or live execution */
    dryRun: boolean;

    /** Number of records that matched the query */
    matchCount: number;

    /** Number of records successfully updated (0 if dry run) */
    updatedCount: number;

    /** True if all matched records were updated without error (or if dry run) */
    success: boolean;

    /** Details of any errors encountered during execution */
    errors: Array<{
        sysId: string;
        error: string;
    }>;

    /** Total execution time in milliseconds */
    executionTimeMs: number;
}

/**
 * Result of a query-based batch delete operation.
 */
export interface QueryDeleteResult {
    /** Whether this was a dry run or live execution */
    dryRun: boolean;

    /** Number of records that matched the query */
    matchCount: number;

    /** Number of records successfully deleted (0 if dry run) */
    deletedCount: number;

    /** True if all matched records were deleted without error (or if dry run) */
    success: boolean;

    /** Details of any errors encountered during execution */
    errors: Array<{
        sysId: string;
        error: string;
    }>;

    /** Total execution time in milliseconds */
    executionTimeMs: number;
}

// ============================================================
// ServiceNow Response Wrappers
// ============================================================

/**
 * Response from table query used to find matching records.
 */
export interface QueryMatchResponse {
    result: Array<{ sys_id: string; [key: string]: unknown }>;
}

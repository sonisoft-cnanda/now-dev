/**
 * Models for batch operations against ServiceNow tables.
 */

// ============================================================
// Batch Create Types
// ============================================================

/**
 * A single create operation within a batch.
 */
export interface BatchCreateOperation {
    /** The target table name (e.g., "incident", "sys_user") */
    table: string;

    /** The field data to create the record with */
    data: Record<string, unknown>;

    /**
     * Optional key to save the resulting sys_id under.
     * Other operations can reference this via ${saveAs} in their data values.
     */
    saveAs?: string;
}

/**
 * Options for a batch create operation.
 */
export interface BatchCreateOptions {
    /** The ordered list of create operations to execute */
    operations: BatchCreateOperation[];

    /**
     * When true (default), stops on first error (transactional behavior).
     * When false, continues past errors.
     */
    transaction?: boolean;

    /** Optional progress callback invoked after each operation */
    onProgress?: (message: string) => void;
}

/**
 * Result of a batch create operation.
 */
export interface BatchCreateResult {
    /** True if all operations completed without error */
    success: boolean;

    /** Number of records successfully created */
    createdCount: number;

    /** Map of saveAs keys to their created sys_ids */
    sysIds: Record<string, string>;

    /** Details of any errors encountered */
    errors: Array<{
        operationIndex: number;
        table: string;
        error: string;
    }>;

    /** Total execution time in milliseconds */
    executionTimeMs: number;
}

// ============================================================
// Batch Update Types
// ============================================================

/**
 * A single update operation within a batch.
 */
export interface BatchUpdateOperation {
    /** The target table name */
    table: string;

    /** The sys_id of the record to update */
    sysId: string;

    /** The field data to update */
    data: Record<string, unknown>;
}

/**
 * Options for a batch update operation.
 */
export interface BatchUpdateOptions {
    /** The ordered list of update operations to execute */
    updates: BatchUpdateOperation[];

    /** When true, stops on first error. Defaults to false. */
    stopOnError?: boolean;

    /** Optional progress callback invoked after each operation */
    onProgress?: (message: string) => void;
}

/**
 * Result of a batch update operation.
 */
export interface BatchUpdateResult {
    /** True if all updates completed without error */
    success: boolean;

    /** Number of records successfully updated */
    updatedCount: number;

    /** Details of any errors encountered */
    errors: Array<{
        updateIndex: number;
        table: string;
        sysId: string;
        error: string;
    }>;

    /** Total execution time in milliseconds */
    executionTimeMs: number;
}

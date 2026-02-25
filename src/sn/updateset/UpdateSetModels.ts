// ============================================================
// Update Set Record Types
// ============================================================

/**
 * A record from the sys_update_set table.
 */
export interface UpdateSetRecord {
    /** System ID */
    sys_id: string;

    /** Name of the update set */
    name: string;

    /** Description of the update set */
    description?: string;

    /** State of the update set (e.g., "in progress", "complete") */
    state: string;

    /** Application scope reference */
    application?: string;

    /** Created timestamp */
    sys_created_on?: string;

    /** Updated timestamp */
    sys_updated_on?: string;

    /** Created by user */
    sys_created_by?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * A record from the sys_update_xml table.
 */
export interface UpdateXmlRecord {
    /** System ID */
    sys_id: string;

    /** Name of the update XML record */
    name?: string;

    /** Type of the record (e.g., "sys_script_include") */
    type?: string;

    /** Target name of the record */
    target_name?: string;

    /** Reference to the parent update set */
    update_set: string;

    /** XML payload */
    payload?: string;

    /** Category of the update */
    category?: string;

    /** Created timestamp */
    sys_created_on?: string;

    /** Additional fields */
    [key: string]: unknown;
}

// ============================================================
// Options Types
// ============================================================

/**
 * Options for setting the current update set.
 */
export interface SetUpdateSetOptions {
    /** Name of the update set */
    name: string;

    /** sys_id of the update set */
    sysId: string;
}

/**
 * Options for listing update sets.
 */
export interface ListUpdateSetsOptions {
    /** Encoded query string for filtering */
    encodedQuery?: string;

    /** Maximum number of records to return */
    limit?: number;

    /** Comma-separated list of fields to return */
    fields?: string;
}

/**
 * Options for creating a new update set.
 */
export interface CreateUpdateSetOptions {
    /** Name of the update set */
    name: string;

    /** Description of the update set */
    description?: string;

    /** Application scope sys_id */
    application?: string;

    /** State of the update set (defaults to "in progress") */
    state?: string;
}

/**
 * Options for moving records between update sets.
 */
export interface MoveRecordsOptions {
    /** Specific record sys_ids to move */
    recordSysIds?: string[];

    /** Time range to select records */
    timeRange?: {
        start: string;
        end: string;
    };

    /** Source update set sys_id to move records from */
    sourceUpdateSet?: string;

    /** Callback for progress updates */
    onProgress?: (message: string) => void;
}

// ============================================================
// Result Types
// ============================================================

/**
 * Result of moving records between update sets.
 */
export interface MoveRecordsResult {
    /** Number of records successfully moved */
    moved: number;

    /** Number of records that failed to move */
    failed: number;

    /** Details of each record processed */
    records: Array<{
        sys_id: string;
        name?: string;
        type?: string;
        status: string;
    }>;

    /** Details of errors encountered */
    errors: Array<{
        sys_id: string;
        error: string;
    }>;
}

/**
 * Result of cloning an update set.
 */
export interface CloneUpdateSetResult {
    /** sys_id of the newly created update set */
    newUpdateSetId: string;

    /** Name of the newly created update set */
    newUpdateSetName: string;

    /** sys_id of the source update set */
    sourceUpdateSetId: string;

    /** Name of the source update set */
    sourceUpdateSetName: string;

    /** Number of records cloned */
    recordsCloned: number;

    /** Total number of records in the source update set */
    totalSourceRecords: number;
}

/**
 * Result of inspecting an update set.
 */
export interface InspectUpdateSetResult {
    /** The update set record */
    updateSet: {
        sys_id: string;
        name: string;
        state: string;
        description?: string;
    };

    /** Total number of records in the update set */
    totalRecords: number;

    /** Components grouped by type */
    components: Array<{
        type: string;
        count: number;
        items: string[];
    }>;
}

// ============================================================
// ServiceNow Response Wrappers
// ============================================================

/**
 * Response wrapper for multiple update set records.
 */
export interface UpdateSetResponse {
    result: UpdateSetRecord[];
}

/**
 * Response wrapper for a single update set record.
 */
export interface UpdateSetSingleResponse {
    result: UpdateSetRecord;
}

/**
 * Response wrapper for multiple update XML records.
 */
export interface UpdateXmlResponse {
    result: UpdateXmlRecord[];
}

/**
 * Response wrapper for a single update XML record.
 */
export interface UpdateXmlSingleResponse {
    result: UpdateXmlRecord;
}

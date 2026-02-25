/**
 * Models for task convenience operations against ServiceNow tables.
 */

// ============================================================
// Task Operation Options
// ============================================================

/**
 * Options for adding a comment or work note to a task record.
 */
export interface AddCommentOptions {
    /** The table name (e.g., "incident", "change_request") */
    table: string;

    /** The sys_id of the record to add the comment to */
    recordSysId: string;

    /** The comment text */
    comment: string;

    /** When true, adds a work note instead of a customer-visible comment. Defaults to false. */
    isWorkNote?: boolean;
}

/**
 * Options for assigning a task to a user or group.
 */
export interface AssignTaskOptions {
    /** The table name (e.g., "incident", "sc_task") */
    table: string;

    /** The sys_id of the record to assign */
    recordSysId: string;

    /** The sys_id or user_name of the user to assign to */
    assignedTo: string;

    /** Optional sys_id of the assignment group */
    assignmentGroup?: string;
}

/**
 * Options for resolving an incident.
 */
export interface ResolveIncidentOptions {
    /** The sys_id of the incident to resolve */
    sysId: string;

    /** Resolution notes describing how the incident was resolved */
    resolutionNotes: string;

    /** The close code (e.g., "Solved (Work Around)", "Solved (Permanently)") */
    closeCode?: string;
}

/**
 * Options for closing an incident.
 */
export interface CloseIncidentOptions {
    /** The sys_id of the incident to close */
    sysId: string;

    /** Close notes describing why the incident is being closed */
    closeNotes: string;

    /** The close code (e.g., "Solved (Work Around)", "Solved (Permanently)") */
    closeCode?: string;
}

/**
 * Options for approving a change request.
 */
export interface ApproveChangeOptions {
    /** The sys_id of the change request to approve */
    sysId: string;

    /** Optional comments to include with the approval */
    comments?: string;
}

// ============================================================
// Task Response Types
// ============================================================

/**
 * A task record from ServiceNow.
 */
export interface TaskRecord {
    /** System ID of the record */
    sys_id: string;

    /** The task number (e.g., "INC0010001") */
    number?: string;

    /** The task state */
    state?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * Response containing a single task record.
 */
export interface TaskRecordResponse {
    result: TaskRecord;
}

/**
 * Response containing a list of task records.
 */
export interface TaskRecordListResponse {
    result: TaskRecord[];
}

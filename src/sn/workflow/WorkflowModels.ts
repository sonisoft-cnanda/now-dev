/**
 * Models for workflow management operations in ServiceNow.
 */

// ============================================================
// Workflow Creation Options
// ============================================================

/**
 * Options for creating a workflow record.
 */
export interface CreateWorkflowOptions {
    /** Name of the workflow */
    name: string;

    /** Description of the workflow */
    description?: string;

    /** Whether this is a template workflow */
    template?: boolean;

    /** Access level (e.g., "public", "package_private") */
    access?: string;
}

/**
 * Result of creating a workflow.
 */
export interface CreateWorkflowResult {
    /** The sys_id of the created workflow */
    workflowSysId: string;

    /** The name of the created workflow */
    name: string;
}

// ============================================================
// Workflow Version Options
// ============================================================

/**
 * Options for creating a workflow version.
 */
export interface CreateWorkflowVersionOptions {
    /** Name of the workflow version */
    name: string;

    /** The sys_id of the parent workflow */
    workflowSysId: string;

    /** The table this workflow version applies to (e.g., "incident") */
    table: string;

    /** Description of the workflow version */
    description?: string;

    /** Whether the version is active */
    active?: boolean;

    /** Whether the version is published */
    published?: boolean;

    /** Condition expression for triggering the workflow */
    condition?: string;

    /** Execution order */
    order?: number;
}

/**
 * Result of creating a workflow version.
 */
export interface CreateWorkflowVersionResult {
    /** The sys_id of the created workflow version */
    versionSysId: string;

    /** The name of the created workflow version */
    name: string;
}

// ============================================================
// Activity Options
// ============================================================

/**
 * Options for creating a workflow activity.
 */
export interface CreateActivityOptions {
    /** Name of the activity */
    name: string;

    /** The sys_id of the workflow version this activity belongs to */
    workflowVersionSysId: string;

    /** The sys_id of the activity definition (type of activity) */
    activityDefinitionSysId?: string;

    /** X position on the workflow canvas */
    x?: number;

    /** Y position on the workflow canvas */
    y?: number;

    /** Width on the workflow canvas */
    width?: number;

    /** Height on the workflow canvas */
    height?: number;

    /** Script content for the activity */
    script?: string;

    /** Activity variables (JSON string or comma-separated key=value pairs) */
    vars?: string;
}

/**
 * Result of creating a workflow activity.
 */
export interface CreateActivityResult {
    /** The sys_id of the created activity */
    activitySysId: string;

    /** The name of the created activity */
    name: string;
}

// ============================================================
// Transition Options
// ============================================================

/**
 * Options for creating a workflow transition between activities.
 */
export interface CreateTransitionOptions {
    /** The sys_id of the source activity */
    fromActivitySysId: string;

    /** The sys_id of the target activity */
    toActivitySysId: string;

    /** The sys_id of an optional condition record */
    conditionSysId?: string;

    /** Execution order of this transition */
    order?: number;
}

/**
 * Result of creating a workflow transition.
 */
export interface CreateTransitionResult {
    /** The sys_id of the created transition */
    transitionSysId: string;
}

// ============================================================
// Condition Options
// ============================================================

/**
 * Options for creating a workflow condition.
 */
export interface CreateConditionOptions {
    /** The sys_id of the activity this condition belongs to */
    activitySysId: string;

    /** Name of the condition */
    name: string;

    /** Description of the condition */
    description?: string;

    /** Condition expression */
    condition?: string;

    /** Execution order */
    order?: number;

    /** Whether this is an else condition */
    elseFlag?: boolean;
}

/**
 * Result of creating a workflow condition.
 */
export interface CreateConditionResult {
    /** The sys_id of the created condition */
    conditionSysId: string;

    /** The name of the created condition */
    name: string;
}

// ============================================================
// Publish Options
// ============================================================

/**
 * Options for publishing a workflow version.
 */
export interface PublishWorkflowOptions {
    /** The sys_id of the workflow version to publish */
    versionSysId: string;

    /** The sys_id of the start activity */
    startActivitySysId: string;
}

// ============================================================
// Complete Workflow Spec (Orchestration)
// ============================================================

/**
 * Specification for a single activity in a complete workflow.
 */
export interface ActivitySpec {
    /** Optional unique identifier used for referencing in transitions */
    id?: string;

    /** Name of the activity */
    name: string;

    /** Script content for the activity */
    script?: string;

    /** The activity type / definition sys_id */
    activityType?: string;

    /** X position on the workflow canvas */
    x?: number;

    /** Y position on the workflow canvas */
    y?: number;

    /** Width on the workflow canvas */
    width?: number;

    /** Height on the workflow canvas */
    height?: number;

    /** Activity variables */
    vars?: string;
}

/**
 * Specification for a transition between activities in a complete workflow.
 */
export interface TransitionSpec {
    /** The id or name of the source activity */
    from: string;

    /** The id or name of the target activity */
    to: string;

    /** Optional condition sys_id for this transition */
    conditionSysId?: string;

    /** Execution order */
    order?: number;
}

/**
 * Complete specification for creating a workflow with all its components.
 */
export interface CompleteWorkflowSpec {
    /** Name of the workflow */
    name: string;

    /** Description of the workflow */
    description?: string;

    /** The table this workflow applies to (e.g., "incident") */
    table: string;

    /** Whether this is a template workflow */
    template?: boolean;

    /** Access level */
    access?: string;

    /** Whether the workflow version is active */
    active?: boolean;

    /** Condition expression for triggering the workflow */
    condition?: string;

    /** The activities in this workflow */
    activities: ActivitySpec[];

    /** The transitions between activities */
    transitions?: TransitionSpec[];

    /** Whether to publish the workflow after creation */
    publish?: boolean;

    /** The id or name of the start activity (required if publish=true) */
    startActivity?: string;
}

/**
 * Result of creating a complete workflow.
 */
export interface CompleteWorkflowResult {
    /** The sys_id of the created workflow */
    workflowSysId: string;

    /** The sys_id of the created workflow version */
    versionSysId: string;

    /** Map of activity id/index keys to their created sys_ids */
    activitySysIds: Record<string, string>;

    /** Array of created transition sys_ids */
    transitionSysIds: string[];

    /** Whether the workflow was published */
    published: boolean;

    /** The start activity key, if published */
    startActivity?: string;
}

// ============================================================
// Standard SN Record Response Wrappers
// ============================================================

/**
 * A generic ServiceNow record with sys_id and additional fields.
 */
export interface WorkflowRecord {
    sys_id: string;
    name?: string;
    [key: string]: unknown;
}

/**
 * Response containing a single workflow-related record.
 */
export interface WorkflowRecordResponse {
    result: WorkflowRecord;
}

/**
 * Response containing a list of workflow-related records.
 */
export interface WorkflowRecordListResponse {
    result: WorkflowRecord[];
}

/**
 * Models for Flow Designer execution operations.
 * Supports executing flows, subflows, and actions via BackgroundScriptExecutor
 * using the sn_fd.FlowAPI.getRunner() (ScriptableFlowRunner) API.
 */

// ============================================================
// Enums / Type Aliases
// ============================================================

/** Type of Flow Designer object to execute. */
export type FlowObjectType = 'flow' | 'subflow' | 'action';

/** Execution mode: synchronous (foreground) or asynchronous (background). */
export type FlowExecutionMode = 'foreground' | 'background';

// ============================================================
// Options Types
// ============================================================

/** Options for executing a Flow Designer object (flow, subflow, or action). */
export interface ExecuteFlowOptions {
    /** Scoped name of the flow/subflow/action, e.g. "global.my_flow" */
    scopedName: string;

    /** Type of object to execute */
    type: FlowObjectType;

    /** Input name-value pairs to pass to the flow/subflow/action */
    inputs?: Record<string, unknown>;

    /**
     * Execution mode: 'foreground' (sync) or 'background' (async).
     * Default: 'foreground'
     */
    mode?: FlowExecutionMode;

    /** Timeout in milliseconds (optional, SN default is 30s) */
    timeout?: number;

    /**
     * Quick mode: skip execution detail records for better performance.
     * Default: false
     */
    quick?: boolean;

    /**
     * Scope context for BackgroundScriptExecutor.
     * Can be a scope name ("global", "x_myapp_custom") or a 32-character sys_id.
     * Default: uses the FlowManager's default scope.
     */
    scope?: string;
}

/** Convenience options for executing a flow (type is implied). */
export interface ExecuteFlowByNameOptions extends Omit<ExecuteFlowOptions, 'type'> {}

/** Convenience options for executing a subflow (type is implied). */
export interface ExecuteSubflowOptions extends Omit<ExecuteFlowOptions, 'type'> {}

/** Convenience options for executing an action (type is implied). */
export interface ExecuteActionOptions extends Omit<ExecuteFlowOptions, 'type'> {}

// ============================================================
// Result Types
// ============================================================

/** Structured result from executing a flow/subflow/action. */
export interface FlowExecutionResult {
    /** Whether the execution completed without error */
    success: boolean;

    /** The scoped name of the executed flow object, e.g. "global.my_flow" */
    flowObjectName: string;

    /** Type of flow object that was executed */
    flowObjectType: FlowObjectType;

    /** sys_id of the execution context record (if not quick mode) */
    contextId?: string;

    /** Execution date/time as a string from the SN server */
    executionDate?: string;

    /** Domain sys_id (for domain-separated instances) */
    domainId?: string;

    /** Output name-value pairs returned by the flow/subflow/action */
    outputs?: Record<string, unknown>;

    /** Raw debug() output from ScriptableFlowRunnerResult */
    debugOutput?: string;

    /** Error message if execution failed */
    errorMessage?: string;

    /** The raw BackgroundScriptExecutionResult for advanced inspection */
    rawScriptResult?: unknown;
}

// ============================================================
// Internal Script Protocol
// ============================================================

/**
 * JSON envelope structure used for communication between
 * the generated SN server-side script and the FlowManager parser.
 * @internal
 */
export interface FlowScriptResultEnvelope {
    __flowResult: true;
    success: boolean;
    flowObjectName: string;
    flowObjectType: string;
    contextId: string | null;
    executionDate: string | null;
    domainId: string | null;
    outputs: Record<string, unknown> | null;
    debugOutput: string;
    errorMessage: string | null;
}

// ============================================================
// Flow Context Lifecycle Types
// ============================================================

/** Known states of a flow context record in sys_flow_context. */
export type FlowContextState = 'QUEUED' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETE' | 'CANCELLED' | 'ERROR' | string;

/** Result from querying a flow context's status. */
export interface FlowContextStatusResult {
    success: boolean;
    contextId: string;
    found: boolean;
    state?: FlowContextState;
    name?: string;
    started?: string;
    ended?: string;
    errorMessage?: string;
    rawScriptResult?: unknown;
}

/** Result from retrieving outputs of a completed flow context. */
export interface FlowOutputsResult {
    success: boolean;
    contextId: string;
    outputs?: Record<string, unknown>;
    errorMessage?: string;
    rawScriptResult?: unknown;
}

/** Result from retrieving error messages of a flow context. */
export interface FlowErrorResult {
    success: boolean;
    contextId: string;
    flowErrorMessage?: string;
    errorMessage?: string;
    rawScriptResult?: unknown;
}

/** Result from cancelling a flow context. */
export interface FlowCancelResult {
    success: boolean;
    contextId: string;
    errorMessage?: string;
    rawScriptResult?: unknown;
}

/** Result from sending a message to a paused flow. */
export interface FlowSendMessageResult {
    success: boolean;
    contextId: string;
    errorMessage?: string;
    rawScriptResult?: unknown;
}

// ============================================================
// Internal Script Protocol - Lifecycle Operations
// ============================================================

/**
 * JSON envelope for lifecycle operations (status, outputs, errors, cancel, message).
 * @internal
 */
export interface FlowLifecycleEnvelope {
    __flowResult: true;
    success: boolean;
    contextId: string;
    errorMessage: string | null;
    found?: boolean;
    state?: string | null;
    name?: string | null;
    started?: string | null;
    ended?: string | null;
    outputs?: Record<string, unknown> | null;
    flowErrorMessage?: string | null;
}

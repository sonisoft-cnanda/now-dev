// ============================================================
// Options Types
// ============================================================

/**
 * Options for the health check.
 */
export interface HealthCheckOptions {
    /** Include instance version info from sys_properties. Defaults to true. */
    includeVersion?: boolean;

    /** Include cluster node status from sys_cluster_state. Defaults to true. */
    includeCluster?: boolean;

    /** Include stuck job detection from sys_trigger. Defaults to true. */
    includeStuckJobs?: boolean;

    /** Include active semaphore count from sys_semaphore. Defaults to true. */
    includeSemaphores?: boolean;

    /** Include operational counts (incidents, changes, problems). Defaults to true. */
    includeOperationalCounts?: boolean;

    /** Threshold in minutes for a job to be considered "stuck". Defaults to 30. */
    stuckJobThresholdMinutes?: number;
}

// ============================================================
// Result Types
// ============================================================

/**
 * Instance version information.
 */
export interface InstanceVersionInfo {
    /** The WAR version (glide.war) */
    version?: string | null;

    /** Build date (glide.build.date) */
    buildDate?: string | null;

    /** Build tag (glide.build.tag) */
    buildTag?: string | null;
}

/**
 * A cluster node status record.
 */
export interface ClusterNodeStatus {
    /** The system ID */
    sys_id: string;

    /** The node ID */
    node_id?: string;

    /** The node status */
    status?: string;

    /** System updated on */
    sys_updated_on?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * A stuck job (sys_trigger) record.
 */
export interface StuckJobRecord {
    /** The system ID */
    sys_id: string;

    /** Name of the trigger */
    name?: string;

    /** The next scheduled action time */
    next_action?: string;

    /** The state of the trigger */
    state?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * Operational record counts.
 */
export interface OperationalCounts {
    /** Number of open incidents */
    openIncidents?: number | null;

    /** Number of open change requests */
    openChanges?: number | null;

    /** Number of open problems */
    openProblems?: number | null;
}

/**
 * Consolidated health check result.
 */
export interface HealthCheckResult {
    /** Timestamp of the health check */
    timestamp: string;

    /** Instance version information (null if check failed or was skipped) */
    version: InstanceVersionInfo | null;

    /** Cluster node statuses (null if check failed or was skipped) */
    clusterNodes: ClusterNodeStatus[] | null;

    /** Stuck jobs (null if check failed or was skipped) */
    stuckJobs: StuckJobRecord[] | null;

    /** Number of active semaphores (null if check failed or was skipped) */
    activeSemaphoreCount: number | null;

    /** Operational counts (null if check failed or was skipped) */
    operationalCounts: OperationalCounts | null;

    /** Summary string describing overall health */
    summary: string;
}

// ============================================================
// ServiceNow Response Wrappers
// ============================================================

/**
 * A sys_properties record.
 */
export interface SysPropertyRecord {
    sys_id: string;
    name?: string;
    value?: string;
    [key: string]: unknown;
}

/**
 * Response from sys_properties query.
 */
export interface SysPropertyResponse {
    result: SysPropertyRecord[];
}

/**
 * Response from sys_cluster_state query.
 */
export interface ClusterStateResponse {
    result: ClusterNodeStatus[];
}

/**
 * Response from sys_trigger query.
 */
export interface SysTriggerResponse {
    result: StuckJobRecord[];
}

/**
 * Response from sys_semaphore query.
 */
export interface SysSemaphoreResponse {
    result: Array<{ sys_id: string; [key: string]: unknown }>;
}

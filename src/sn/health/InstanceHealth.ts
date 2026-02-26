import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import { AggregateQuery } from "../aggregate/AggregateQuery";
import {
    HealthCheckOptions,
    HealthCheckResult,
    InstanceVersionInfo,
    ClusterNodeStatus,
    StuckJobRecord,
    OperationalCounts,
    SysPropertyResponse,
    ClusterStateResponse,
    SysTriggerResponse,
    SysSemaphoreResponse
} from './HealthModels';

/**
 * InstanceHealth provides a consolidated health check for a ServiceNow instance.
 * Checks version info, cluster status, stuck jobs, semaphores, and operational counts.
 * Each sub-check is isolated — a failure in one does not affect others.
 */
export class InstanceHealth {
    private static readonly SYS_PROPERTIES_TABLE = 'sys_properties';
    private static readonly SYS_CLUSTER_STATE_TABLE = 'sys_cluster_state';
    private static readonly SYS_TRIGGER_TABLE = 'sys_trigger';
    private static readonly SYS_SEMAPHORE_TABLE = 'sys_semaphore';

    private _logger: Logger = new Logger("InstanceHealth");
    private _tableAPI: TableAPIRequest;
    private _aggregateQuery: AggregateQuery;
    private _instance: ServiceNowInstance;

    public constructor(instance: ServiceNowInstance, aggregateQuery?: AggregateQuery) {
        this._instance = instance;
        this._tableAPI = new TableAPIRequest(instance);
        this._aggregateQuery = aggregateQuery || new AggregateQuery(instance);
    }

    /**
     * Run a consolidated health check on the instance.
     * Each sub-check is wrapped in try/catch — failures return null for that check
     * without affecting the overall result.
     *
     * @param options Options to control which checks are run
     * @returns HealthCheckResult with all collected information and a summary
     */
    public async checkHealth(options: HealthCheckOptions = {}): Promise<HealthCheckResult> {
        const includeVersion = options.includeVersion !== false;
        const includeCluster = options.includeCluster !== false;
        const includeStuckJobs = options.includeStuckJobs !== false;
        const includeSemaphores = options.includeSemaphores !== false;
        const includeOperationalCounts = options.includeOperationalCounts !== false;
        const stuckJobThreshold = options.stuckJobThresholdMinutes ?? 30;

        this._logger.info('Running instance health check');

        const version = includeVersion ? await this._getVersionInfo() : null;
        const clusterNodes = includeCluster ? await this._getClusterStatus() : null;
        const stuckJobs = includeStuckJobs ? await this._getStuckJobs(stuckJobThreshold) : null;
        const activeSemaphoreCount = includeSemaphores ? await this._getActiveSemaphores() : null;
        const operationalCounts = includeOperationalCounts ? await this._getOperationalCounts() : null;

        const summary = this._buildSummary(version, clusterNodes, stuckJobs, activeSemaphoreCount, operationalCounts);

        this._logger.info(`Health check complete: ${summary}`);

        return {
            timestamp: new Date().toISOString(),
            version,
            clusterNodes,
            stuckJobs,
            activeSemaphoreCount,
            operationalCounts,
            summary
        };
    }

    /**
     * Get instance version information from sys_properties.
     * @private
     */
    private async _getVersionInfo(): Promise<InstanceVersionInfo | null> {
        try {
            const query: Record<string, string | number> = {
                sysparm_query: 'nameINglide.war,glide.build.date,glide.build.tag',
                sysparm_limit: 10
            };

            const response: IHttpResponse<SysPropertyResponse> = await this._tableAPI.get<SysPropertyResponse>(
                InstanceHealth.SYS_PROPERTIES_TABLE,
                query
            );

            if (response && response.status === 200 && response.bodyObject?.result) {
                const props = response.bodyObject.result;
                const versionInfo: InstanceVersionInfo = {};

                for (const prop of props) {
                    switch (prop.name) {
                        case 'glide.war':
                            versionInfo.version = prop.value || null;
                            break;
                        case 'glide.build.date':
                            versionInfo.buildDate = prop.value || null;
                            break;
                        case 'glide.build.tag':
                            versionInfo.buildTag = prop.value || null;
                            break;
                    }
                }

                return versionInfo;
            }

            return null;
        } catch (err) {
            this._logger.error(`Failed to get version info: ${err}`);
            return null;
        }
    }

    /**
     * Get cluster node status from sys_cluster_state.
     * @private
     */
    private async _getClusterStatus(): Promise<ClusterNodeStatus[] | null> {
        try {
            const query: Record<string, string | number> = {
                sysparm_limit: 100
            };

            const response: IHttpResponse<ClusterStateResponse> = await this._tableAPI.get<ClusterStateResponse>(
                InstanceHealth.SYS_CLUSTER_STATE_TABLE,
                query
            );

            if (response && response.status === 200 && response.bodyObject?.result) {
                return response.bodyObject.result;
            }

            return null;
        } catch (err) {
            this._logger.error(`Failed to get cluster status: ${err}`);
            return null;
        }
    }

    /**
     * Get stuck jobs from sys_trigger (state=0 and next_action overdue).
     * @private
     */
    private async _getStuckJobs(thresholdMinutes: number): Promise<StuckJobRecord[] | null> {
        try {
            const query: Record<string, string | number> = {
                sysparm_query: `state=0^next_action<javascript:gs.minutesAgoStart(${thresholdMinutes})`,
                sysparm_limit: 100
            };

            const response: IHttpResponse<SysTriggerResponse> = await this._tableAPI.get<SysTriggerResponse>(
                InstanceHealth.SYS_TRIGGER_TABLE,
                query
            );

            if (response && response.status === 200 && response.bodyObject?.result) {
                return response.bodyObject.result;
            }

            return null;
        } catch (err) {
            this._logger.error(`Failed to get stuck jobs: ${err}`);
            return null;
        }
    }

    /**
     * Get count of active semaphores from sys_semaphore.
     * @private
     */
    private async _getActiveSemaphores(): Promise<number | null> {
        try {
            const query: Record<string, string | number> = {
                sysparm_limit: 1000
            };

            const response: IHttpResponse<SysSemaphoreResponse> = await this._tableAPI.get<SysSemaphoreResponse>(
                InstanceHealth.SYS_SEMAPHORE_TABLE,
                query
            );

            if (response && response.status === 200 && response.bodyObject?.result) {
                return response.bodyObject.result.length;
            }

            return null;
        } catch (err) {
            this._logger.error(`Failed to get active semaphores: ${err}`);
            return null;
        }
    }

    /**
     * Get operational counts using AggregateQuery.
     * @private
     */
    private async _getOperationalCounts(): Promise<OperationalCounts | null> {
        try {
            const counts: OperationalCounts = {};

            try {
                counts.openIncidents = await this._aggregateQuery.count({ table: 'incident', query: 'active=true' });
            } catch {
                counts.openIncidents = null;
            }

            try {
                counts.openChanges = await this._aggregateQuery.count({ table: 'change_request', query: 'active=true' });
            } catch {
                counts.openChanges = null;
            }

            try {
                counts.openProblems = await this._aggregateQuery.count({ table: 'problem', query: 'active=true' });
            } catch {
                counts.openProblems = null;
            }

            return counts;
        } catch (err) {
            this._logger.error(`Failed to get operational counts: ${err}`);
            return null;
        }
    }

    /**
     * Build a human-readable summary string from the health check results.
     * @private
     */
    private _buildSummary(
        version: InstanceVersionInfo | null,
        clusterNodes: ClusterNodeStatus[] | null,
        stuckJobs: StuckJobRecord[] | null,
        activeSemaphoreCount: number | null,
        operationalCounts: OperationalCounts | null
    ): string {
        const parts: string[] = [];

        if (version) {
            parts.push(`Version: ${version.version || 'unknown'}${version.buildTag ? ` (${version.buildTag})` : ''}`);
        }

        if (clusterNodes !== null) {
            parts.push(`Cluster: ${clusterNodes.length} node(s)`);
        }

        if (stuckJobs !== null) {
            parts.push(`Stuck jobs: ${stuckJobs.length}`);
        }

        if (activeSemaphoreCount !== null) {
            parts.push(`Active semaphores: ${activeSemaphoreCount}`);
        }

        if (operationalCounts) {
            const countParts: string[] = [];
            if (operationalCounts.openIncidents !== null && operationalCounts.openIncidents !== undefined) {
                countParts.push(`${operationalCounts.openIncidents} incidents`);
            }
            if (operationalCounts.openChanges !== null && operationalCounts.openChanges !== undefined) {
                countParts.push(`${operationalCounts.openChanges} changes`);
            }
            if (operationalCounts.openProblems !== null && operationalCounts.openProblems !== undefined) {
                countParts.push(`${operationalCounts.openProblems} problems`);
            }
            if (countParts.length > 0) {
                parts.push(`Open: ${countParts.join(', ')}`);
            }
        }

        return parts.length > 0 ? parts.join(' | ') : 'Health check completed (no data collected)';
    }
}

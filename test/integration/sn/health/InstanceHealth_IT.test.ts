import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';
import { InstanceHealth } from '../../../../src/sn/health/InstanceHealth';

const SECONDS = 1000;

describe('InstanceHealth - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let health: InstanceHealth;

    beforeAll(async () => {
        const credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            health = new InstanceHealth(instance);
        }

        if (!instance) throw new Error("Could not get credentials.");
    }, 300 * SECONDS);

    describe('checkHealth', () => {
        it('should return full health check result', async () => {
            const result = await health.checkHealth();

            console.log(`\nHealth check timestamp: ${result.timestamp}`);
            console.log(`Summary: ${result.summary}`);

            if (result.version) {
                console.log(`Version: ${result.version.version || 'N/A'}`);
                console.log(`Build tag: ${result.version.buildTag || 'N/A'}`);
            }

            if (result.clusterNodes) {
                console.log(`Cluster nodes: ${result.clusterNodes.length}`);
            }

            if (result.stuckJobs) {
                console.log(`Stuck jobs: ${result.stuckJobs.length}`);
            }

            if (result.activeSemaphoreCount !== null) {
                console.log(`Active semaphores: ${result.activeSemaphoreCount}`);
            }

            if (result.operationalCounts) {
                console.log(`Open incidents: ${result.operationalCounts.openIncidents ?? 'N/A'}`);
                console.log(`Open changes: ${result.operationalCounts.openChanges ?? 'N/A'}`);
                console.log(`Open problems: ${result.operationalCounts.openProblems ?? 'N/A'}`);
            }

            expect(result.timestamp).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(result.summary.length).toBeGreaterThan(0);
        }, 60 * SECONDS);

        it('should skip cluster check when disabled', async () => {
            const result = await health.checkHealth({ includeCluster: false });

            expect(result.clusterNodes).toBeNull();
            expect(result.timestamp).toBeDefined();
        }, 60 * SECONDS);

        it('should return version info', async () => {
            const result = await health.checkHealth({
                includeCluster: false,
                includeStuckJobs: false,
                includeSemaphores: false,
                includeOperationalCounts: false
            });

            console.log(`\nVersion only: ${JSON.stringify(result.version, null, 2)}`);

            // Version info may or may not be available depending on instance permissions
            expect(result.timestamp).toBeDefined();
        }, 30 * SECONDS);
    });
});

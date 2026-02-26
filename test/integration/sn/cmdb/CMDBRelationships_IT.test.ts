import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';
import { CMDBRelationships } from '../../../../src/sn/cmdb/CMDBRelationships';
import { TableAPIRequest } from '../../../../src/comm/http/TableAPIRequest';

const SECONDS = 1000;

describe('CMDBRelationships - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let cmdb: CMDBRelationships;
    let tableAPI: TableAPIRequest;

    beforeAll(async () => {
        const credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            cmdb = new CMDBRelationships(instance);
            tableAPI = new TableAPIRequest(instance);
        }

        if (!instance) throw new Error("Could not get credentials.");
    }, 300 * SECONDS);

    /**
     * Helper to find any CI that exists in the instance for testing.
     */
    async function findAnyCISysId(): Promise<string | null> {
        const response = await tableAPI.get<{ result: Array<{ sys_id: string; name?: string }> }>(
            'cmdb_ci',
            { sysparm_limit: 1, sysparm_fields: 'sys_id,name' }
        );

        if (response && response.status === 200 && response.bodyObject?.result?.length > 0) {
            return response.bodyObject.result[0].sys_id;
        }
        return null;
    }

    describe('getRelationships', () => {
        it('should get relationships for a CI', async () => {
            const ciSysId = await findAnyCISysId();
            if (!ciSysId) {
                console.log('  Skipping: no CMDB CIs found in instance');
                return;
            }

            console.log(`\nQuerying relationships for CI: ${ciSysId}`);

            const result = await cmdb.getRelationships({ ciSysId, limit: 10 });

            console.log(`  CI: ${result.ci.name} (${result.ci.sys_class_name})`);
            console.log(`  Relationships found: ${result.relationships.length}`);
            result.relationships.slice(0, 5).forEach(r => {
                console.log(`    - ${r.direction}: ${r.relatedCI.name || r.relatedCI.sys_id} (${r.typeName})`);
            });

            expect(result.ci).toBeDefined();
            expect(result.ci.sys_id).toBe(ciSysId);
            expect(Array.isArray(result.relationships)).toBe(true);
        }, 30 * SECONDS);

        it('should throw for nonexistent CI', async () => {
            await expect(
                cmdb.getRelationships({ ciSysId: 'ffffffffffffffffffffffffffffffff' })
            ).rejects.toThrow('not found');
        }, 30 * SECONDS);
    });

    describe('traverseGraph', () => {
        it('should traverse graph with limited depth and nodes', async () => {
            const ciSysId = await findAnyCISysId();
            if (!ciSysId) {
                console.log('  Skipping: no CMDB CIs found in instance');
                return;
            }

            console.log(`\nTraversing graph from CI: ${ciSysId}`);

            const result = await cmdb.traverseGraph({
                ciSysId,
                direction: 'downstream',
                maxDepth: 2,
                maxNodes: 20
            });

            console.log(`  Root: ${result.rootCI.name} (${result.rootCI.sys_class_name})`);
            console.log(`  Nodes: ${result.nodes.length}`);
            console.log(`  Edges: ${result.edges.length}`);
            console.log(`  API calls: ${result.apiCallCount}`);
            console.log(`  Truncated: ${result.truncated}${result.truncationReason ? ` (${result.truncationReason})` : ''}`);

            expect(result.rootCI).toBeDefined();
            expect(result.nodes.length).toBeGreaterThan(0);
            expect(result.nodes.length).toBeLessThanOrEqual(20);
            expect(result.nodes[0].depth).toBe(0);
            expect(Array.isArray(result.edges)).toBe(true);
        }, 60 * SECONDS);
    });
});

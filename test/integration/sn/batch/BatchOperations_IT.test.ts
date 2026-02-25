import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';

import { BatchOperations } from '../../../../src/sn/batch/BatchOperations';
import { BatchCreateResult, BatchUpdateResult } from '../../../../src/sn/batch/BatchModels';

const SECONDS = 1000;

describe('BatchOperations - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;
    let batchOps: BatchOperations;
    let createdSysIds: string[] = [];

    beforeEach(async () => {
        createdSysIds = [];
        credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            batchOps = new BatchOperations(instance);
        }

        if (!instance) throw new Error("Could not get credentials.");
    });

    afterEach(async () => {
        // Clean up all created test incidents
        if (createdSysIds.length > 0 && instance) {
            const { ServiceNowRequest } = await import('../../../../src/comm/http/ServiceNowRequest');
            const snReq = new ServiceNowRequest(instance);

            for (const sysId of createdSysIds) {
                try {
                    await snReq.delete({
                        path: `/api/now/table/incident/${sysId}`,
                        headers: { "Content-Type": "application/json", "Accept": "application/json" },
                        query: null,
                        body: null
                    });
                    console.log(`Cleaned up test incident: ${sysId}`);
                } catch (e) {
                    console.warn(`Warning: Failed to clean up incident ${sysId}:`, e);
                }
            }
        }
    });

    describe('batchCreate', () => {
        it('should create 2 incidents in a simple batch', async () => {
            const timestamp = new Date().toISOString();

            const result: BatchCreateResult = await batchOps.batchCreate({
                operations: [
                    {
                        table: 'incident',
                        data: {
                            short_description: `[IT_TEST] Batch1 ${timestamp}`,
                            urgency: '3',
                            impact: '3'
                        }
                    },
                    {
                        table: 'incident',
                        data: {
                            short_description: `[IT_TEST] Batch2 ${timestamp}`,
                            urgency: '3',
                            impact: '3'
                        }
                    }
                ]
            });

            console.log('\n=== batchCreate (simple) ===');
            console.log('Success:', result.success);
            console.log('Created count:', result.createdCount);
            console.log('Errors:', JSON.stringify(result.errors, null, 2));

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.createdCount).toBe(2);
            expect(result.errors.length).toBe(0);

            // Collect sys_ids for cleanup by querying back, since no saveAs was used
            const { TableAPIRequest } = await import('../../../../src/comm/http/TableAPIRequest');
            const tableAPI = new TableAPIRequest(instance);
            const queryResp = await tableAPI.get<{ result: Array<{ sys_id: string }> }>('incident', {
                sysparm_query: `short_descriptionLIKE[IT_TEST] Batch1 ${timestamp}^ORshort_descriptionLIKE[IT_TEST] Batch2 ${timestamp}`,
                sysparm_limit: '10'
            });

            if (queryResp.status === 200 && queryResp.bodyObject?.result) {
                for (const record of queryResp.bodyObject.result) {
                    createdSysIds.push(record.sys_id);
                }
            }

            console.log('Sys IDs for cleanup:', createdSysIds);
        }, 60 * SECONDS);

        it('should create incidents with saveAs and variable references between operations', async () => {
            const timestamp = new Date().toISOString();

            const result: BatchCreateResult = await batchOps.batchCreate({
                operations: [
                    {
                        table: 'incident',
                        data: {
                            short_description: `[IT_TEST] Parent ${timestamp}`,
                            urgency: '3',
                            impact: '3'
                        },
                        saveAs: 'parent'
                    },
                    {
                        table: 'incident',
                        data: {
                            short_description: `[IT_TEST] Child ${timestamp}`,
                            parent: '${parent}',
                            urgency: '3',
                            impact: '3'
                        },
                        saveAs: 'child'
                    }
                ]
            });

            console.log('\n=== batchCreate (variable references) ===');
            console.log('Success:', result.success);
            console.log('Created count:', result.createdCount);
            console.log('Sys IDs map:', JSON.stringify(result.sysIds, null, 2));
            console.log('Errors:', JSON.stringify(result.errors, null, 2));

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.createdCount).toBe(2);
            expect(result.sysIds['parent']).toBeDefined();
            expect(result.sysIds['child']).toBeDefined();

            const parentSysId = result.sysIds['parent'];
            const childSysId = result.sysIds['child'];

            // Store for cleanup
            createdSysIds.push(parentSysId, childSysId);

            // Verify the child's parent field references the parent sys_id
            const { TableAPIRequest } = await import('../../../../src/comm/http/TableAPIRequest');
            const tableAPI = new TableAPIRequest(instance);
            const childResp = await tableAPI.get<{ result: Array<{ sys_id: string; parent: { value: string } | string }> }>('incident', {
                sysparm_query: `sys_id=${childSysId}`,
                sysparm_limit: '1'
            });

            expect(childResp.status).toBe(200);
            expect(childResp.bodyObject?.result?.length).toBeGreaterThan(0);

            const childRecord = childResp.bodyObject.result[0];
            const parentValue = typeof childRecord.parent === 'object' && childRecord.parent !== null
                ? (childRecord.parent as { value: string }).value
                : childRecord.parent;

            console.log('Child parent field value:', parentValue);
            console.log('Expected parent sys_id:', parentSysId);

            expect(parentValue).toBe(parentSysId);
        }, 60 * SECONDS);

        it('should report failure when stopOnError encounters an invalid table', async () => {
            const timestamp = new Date().toISOString();

            const result: BatchCreateResult = await batchOps.batchCreate({
                transaction: true,
                operations: [
                    {
                        table: 'incident',
                        data: {
                            short_description: `[IT_TEST] Valid ${timestamp}`,
                            urgency: '3',
                            impact: '3'
                        },
                        saveAs: 'valid'
                    },
                    {
                        table: 'nonexistent_table_xyz',
                        data: {
                            short_description: `[IT_TEST] Invalid ${timestamp}`
                        }
                    }
                ]
            });

            console.log('\n=== batchCreate (stopOnError) ===');
            console.log('Success:', result.success);
            console.log('Created count:', result.createdCount);
            console.log('Errors:', JSON.stringify(result.errors, null, 2));

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);

            // Clean up the first record if it was successfully created
            if (result.sysIds['valid']) {
                createdSysIds.push(result.sysIds['valid']);
            }
        }, 60 * SECONDS);
    });

    describe('batchUpdate', () => {
        it('should update a previously created incident', async () => {
            // First create an incident via TableAPIRequest
            const { TableAPIRequest } = await import('../../../../src/comm/http/TableAPIRequest');
            const tableAPI = new TableAPIRequest(instance);
            const timestamp = new Date().toISOString();

            const createBody = {
                short_description: `[IT_TEST] For Update ${timestamp}`,
                description: 'Integration test record for batchUpdate - safe to delete',
                urgency: '3',
                impact: '3'
            };

            const createResp = await tableAPI.post<{ result: { sys_id: string } }>('incident', {}, createBody);

            expect(createResp).toBeDefined();
            expect(createResp.status).toBe(201);

            const createdSysId = createResp.bodyObject.result.sys_id;
            createdSysIds.push(createdSysId);

            console.log('\nCreated incident for update test:', createdSysId);

            // Now batch update it
            const updateResult: BatchUpdateResult = await batchOps.batchUpdate({
                updates: [
                    {
                        table: 'incident',
                        sysId: createdSysId,
                        data: { short_description: `[IT_TEST] Updated ${timestamp}` }
                    }
                ]
            });

            console.log('\n=== batchUpdate ===');
            console.log('Success:', updateResult.success);
            console.log('Updated count:', updateResult.updatedCount);
            console.log('Errors:', JSON.stringify(updateResult.errors, null, 2));

            expect(updateResult).toBeDefined();
            expect(updateResult.success).toBe(true);
            expect(updateResult.updatedCount).toBe(1);
            expect(updateResult.errors.length).toBe(0);

            // Verify the update took effect
            const verifyResp = await tableAPI.get<{ result: Array<{ sys_id: string; short_description: string }> }>('incident', {
                sysparm_query: `sys_id=${createdSysId}`,
                sysparm_limit: '1'
            });

            expect(verifyResp.status).toBe(200);
            expect(verifyResp.bodyObject?.result?.length).toBeGreaterThan(0);

            console.log('Updated short_description:', verifyResp.bodyObject.result[0].short_description);
            expect(verifyResp.bodyObject.result[0].short_description).toContain('[IT_TEST] Updated');
        }, 60 * SECONDS);
    });
});

import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';

import { TaskOperations } from '../../../../src/sn/task/TaskOperations';
import { TableAPIRequest } from '../../../../src/comm/http/TableAPIRequest';
import { TaskRecord } from '../../../../src/sn/task/TaskModels';

const SECONDS = 1000;

describe('TaskOperations - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;
    let taskOps: TaskOperations;
    let tableAPI: TableAPIRequest;
    let createdRecords: Array<{ table: string; sysId: string }> = [];

    beforeEach(async () => {
        createdRecords = [];
        credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            taskOps = new TaskOperations(instance);
            tableAPI = new TableAPIRequest(instance);
        }

        if (!instance) throw new Error("Could not get credentials.");
    });

    afterEach(async () => {
        // Clean up all created test records
        if (createdRecords.length > 0 && instance) {
            const { ServiceNowRequest } = await import('../../../../src/comm/http/ServiceNowRequest');
            const snReq = new ServiceNowRequest(instance);

            for (const record of createdRecords) {
                try {
                    await snReq.delete({
                        path: `/api/now/table/${record.table}/${record.sysId}`,
                        headers: { "Content-Type": "application/json", "Accept": "application/json" },
                        query: null,
                        body: null
                    });
                    console.log(`Cleaned up test ${record.table}: ${record.sysId}`);
                } catch (e) {
                    console.warn(`Warning: Failed to clean up ${record.table} ${record.sysId}:`, e);
                }
            }
        }
    });

    /**
     * Helper to create a test incident and track it for cleanup.
     */
    async function createTestIncident(suffix: string): Promise<{ sys_id: string; number: string }> {
        const timestamp = new Date().toISOString();
        const body = {
            short_description: `[IT_TEST] ${suffix} ${timestamp}`,
            description: 'Integration test record - safe to delete',
            urgency: '3',
            impact: '3'
        };

        const resp = await tableAPI.post<{ result: { sys_id: string; number: string } }>(
            'incident', {}, body
        );

        expect(resp).toBeDefined();
        expect(resp.status).toBe(201);

        const sysId = resp.bodyObject.result.sys_id;
        const number = resp.bodyObject.result.number;

        createdRecords.push({ table: 'incident', sysId });
        console.log(`Created test incident: ${number} (${sysId})`);

        return { sys_id: sysId, number };
    }

    describe('findByNumber', () => {
        it('should find an incident by its number', async () => {
            const incident = await createTestIncident('findByNumber');

            const result: TaskRecord | null = await taskOps.findByNumber('incident', incident.number);

            console.log('\n=== findByNumber ===');
            console.log('Input number:', incident.number);
            console.log('Result sys_id:', result?.sys_id);

            expect(result).not.toBeNull();
            expect(result!.sys_id).toBe(incident.sys_id);
        }, 60 * SECONDS);
    });

    describe('addComment', () => {
        it('should add a customer comment to an incident', async () => {
            const incident = await createTestIncident('addComment');
            const commentText = `IT test comment ${Date.now()}`;

            const result: TaskRecord = await taskOps.addComment({
                table: 'incident',
                recordSysId: incident.sys_id,
                comment: commentText
            });

            console.log('\n=== addComment (customer comment) ===');
            console.log('Result sys_id:', result.sys_id);

            expect(result).toBeDefined();
            expect(result.sys_id).toBeDefined();
        }, 60 * SECONDS);

        it('should add a work note to an incident', async () => {
            const incident = await createTestIncident('addComment workNote');
            const commentText = `IT test work note ${Date.now()}`;

            const result: TaskRecord = await taskOps.addComment({
                table: 'incident',
                recordSysId: incident.sys_id,
                comment: commentText,
                isWorkNote: true
            });

            console.log('\n=== addComment (work note) ===');
            console.log('Result sys_id:', result.sys_id);

            expect(result).toBeDefined();
            expect(result.sys_id).toBeDefined();
        }, 60 * SECONDS);
    });

    describe('assignTask', () => {
        it('should assign an incident to the admin user', async () => {
            const incident = await createTestIncident('assignTask');

            // Query sys_user for the admin user
            const userResp = await tableAPI.get<{ result: Array<{ sys_id: string; user_name: string }> }>('sys_user', {
                sysparm_query: 'user_name=admin',
                sysparm_limit: '1'
            });

            expect(userResp.status).toBe(200);
            expect(userResp.bodyObject?.result?.length).toBeGreaterThan(0);

            const adminSysId = userResp.bodyObject.result[0].sys_id;
            console.log('Admin user sys_id:', adminSysId);

            const result: TaskRecord = await taskOps.assignTask({
                table: 'incident',
                recordSysId: incident.sys_id,
                assignedTo: adminSysId
            });

            console.log('\n=== assignTask ===');
            console.log('Result sys_id:', result.sys_id);

            expect(result).toBeDefined();
            expect(result.sys_id).toBeDefined();
        }, 60 * SECONDS);
    });

    describe('resolveIncident', () => {
        it('should resolve an incident with resolution notes and close code', async () => {
            const incident = await createTestIncident('resolveIncident');

            // Query valid close_code choices from sys_choice
            const choiceResp = await tableAPI.get<{ result: Array<{ value: string; label: string }> }>('sys_choice', {
                sysparm_query: 'name=incident^element=close_code',
                sysparm_limit: '1'
            });

            let closeCode = 'Solved (Permanently)';
            if (choiceResp.status === 200 && choiceResp.bodyObject?.result?.length > 0) {
                closeCode = choiceResp.bodyObject.result[0].value;
                console.log('Using close_code from sys_choice:', closeCode);
            }

            const result: TaskRecord = await taskOps.resolveIncident({
                sysId: incident.sys_id,
                resolutionNotes: 'IT test resolution',
                closeCode
            });

            console.log('\n=== resolveIncident ===');
            console.log('Result sys_id:', result.sys_id);
            console.log('Result state:', result.state);

            expect(result).toBeDefined();
            expect(result.sys_id).toBeDefined();
        }, 60 * SECONDS);
    });

    describe('closeIncident', () => {
        it('should close an incident with close notes and close code', async () => {
            const incident = await createTestIncident('closeIncident');

            // First resolve it (required before closing)
            const choiceResp = await tableAPI.get<{ result: Array<{ value: string; label: string }> }>('sys_choice', {
                sysparm_query: 'name=incident^element=close_code',
                sysparm_limit: '1'
            });

            let closeCode = 'Solved (Permanently)';
            if (choiceResp.status === 200 && choiceResp.bodyObject?.result?.length > 0) {
                closeCode = choiceResp.bodyObject.result[0].value;
            }

            // Resolve first
            await taskOps.resolveIncident({
                sysId: incident.sys_id,
                resolutionNotes: 'IT test resolution for close',
                closeCode
            });

            const result: TaskRecord = await taskOps.closeIncident({
                sysId: incident.sys_id,
                closeNotes: 'IT test close',
                closeCode
            });

            console.log('\n=== closeIncident ===');
            console.log('Result sys_id:', result.sys_id);
            console.log('Result state:', result.state);

            expect(result).toBeDefined();
            expect(result.sys_id).toBeDefined();
        }, 60 * SECONDS);
    });

    describe('approveChange', () => {
        it('should approve a change request', async () => {
            const timestamp = new Date().toISOString();
            const body = {
                short_description: `[IT_TEST] change for approval ${timestamp}`,
                type: 'Standard'
            };

            const createResp = await tableAPI.post<{ result: { sys_id: string; number: string } }>(
                'change_request', {}, body
            );

            expect(createResp).toBeDefined();
            expect(createResp.status).toBe(201);

            const changeSysId = createResp.bodyObject.result.sys_id;
            const changeNumber = createResp.bodyObject.result.number;
            createdRecords.push({ table: 'change_request', sysId: changeSysId });

            console.log(`Created test change_request: ${changeNumber} (${changeSysId})`);

            const result: TaskRecord = await taskOps.approveChange({
                sysId: changeSysId,
                comments: 'IT approved'
            });

            console.log('\n=== approveChange ===');
            console.log('Result sys_id:', result.sys_id);

            expect(result).toBeDefined();
            expect(result.sys_id).toBeDefined();
        }, 60 * SECONDS);
    });
});

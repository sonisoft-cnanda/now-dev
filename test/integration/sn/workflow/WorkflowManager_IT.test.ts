import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth/index.js';
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';

import { WorkflowManager } from '../../../../src/sn/workflow/WorkflowManager';
import { ServiceNowRequest } from '../../../../src/comm/http/ServiceNowRequest';

const SECONDS = 1000;

describe('WorkflowManager - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;
    let wfManager: WorkflowManager;
    let snReq: ServiceNowRequest;

    const createdWorkflows: string[] = [];
    const createdVersions: string[] = [];
    const createdActivities: string[] = [];
    const createdTransitions: string[] = [];
    const createdConditions: string[] = [];

    beforeEach(async () => {
        createdWorkflows.length = 0;
        createdVersions.length = 0;
        createdActivities.length = 0;
        createdTransitions.length = 0;
        createdConditions.length = 0;

        credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            wfManager = new WorkflowManager(instance);
            snReq = new ServiceNowRequest(instance);
        }

        if (!instance) throw new Error('Could not get credentials.');
    });

    afterEach(async () => {
        // Cleanup in reverse dependency order: conditions -> transitions -> activities -> versions -> workflows
        for (const sysId of createdConditions) {
            try {
                await snReq.delete({
                    path: `/api/now/table/wf_condition/${sysId}`,
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    query: null,
                    body: null
                });
                console.log(`Cleaned up wf_condition: ${sysId}`);
            } catch (e) {
                console.warn(`Warning: Failed to clean up wf_condition ${sysId}:`, e);
            }
        }

        for (const sysId of createdTransitions) {
            try {
                await snReq.delete({
                    path: `/api/now/table/wf_transition/${sysId}`,
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    query: null,
                    body: null
                });
                console.log(`Cleaned up wf_transition: ${sysId}`);
            } catch (e) {
                console.warn(`Warning: Failed to clean up wf_transition ${sysId}:`, e);
            }
        }

        for (const sysId of createdActivities) {
            try {
                await snReq.delete({
                    path: `/api/now/table/wf_activity/${sysId}`,
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    query: null,
                    body: null
                });
                console.log(`Cleaned up wf_activity: ${sysId}`);
            } catch (e) {
                console.warn(`Warning: Failed to clean up wf_activity ${sysId}:`, e);
            }
        }

        for (const sysId of createdVersions) {
            try {
                await snReq.delete({
                    path: `/api/now/table/wf_workflow_version/${sysId}`,
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    query: null,
                    body: null
                });
                console.log(`Cleaned up wf_workflow_version: ${sysId}`);
            } catch (e) {
                console.warn(`Warning: Failed to clean up wf_workflow_version ${sysId}:`, e);
            }
        }

        for (const sysId of createdWorkflows) {
            try {
                await snReq.delete({
                    path: `/api/now/table/wf_workflow/${sysId}`,
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    query: null,
                    body: null
                });
                console.log(`Cleaned up wf_workflow: ${sysId}`);
            } catch (e) {
                console.warn(`Warning: Failed to clean up wf_workflow ${sysId}:`, e);
            }
        }
    });

    it('should create a workflow', async () => {
        const timestamp = new Date().toISOString();
        const workflowName = `[IT_TEST] WF ${timestamp}`;

        const result = await wfManager.createWorkflow({
            name: workflowName
        });

        console.log('\n=== createWorkflow ===');
        console.log('workflowSysId:', result.workflowSysId);
        console.log('name:', result.name);

        expect(result).toBeDefined();
        expect(result.workflowSysId).toBeDefined();
        expect(typeof result.workflowSysId).toBe('string');
        expect(result.workflowSysId.length).toBeGreaterThan(0);

        createdWorkflows.push(result.workflowSysId);
    }, 120 * SECONDS);

    it('should create a workflow version', async () => {
        const timestamp = new Date().toISOString();
        const workflowName = `[IT_TEST] WF ${timestamp}`;

        // Create workflow first
        const wfResult = await wfManager.createWorkflow({
            name: workflowName
        });
        createdWorkflows.push(wfResult.workflowSysId);

        // Create version
        const versionResult = await wfManager.createWorkflowVersion({
            name: workflowName,
            workflowSysId: wfResult.workflowSysId,
            table: 'incident'
        });

        console.log('\n=== createWorkflowVersion ===');
        console.log('versionSysId:', versionResult.versionSysId);
        console.log('name:', versionResult.name);

        expect(versionResult).toBeDefined();
        expect(versionResult.versionSysId).toBeDefined();
        expect(typeof versionResult.versionSysId).toBe('string');
        expect(versionResult.versionSysId.length).toBeGreaterThan(0);

        createdVersions.push(versionResult.versionSysId);
    }, 120 * SECONDS);

    it('should create an activity', async () => {
        const timestamp = new Date().toISOString();
        const workflowName = `[IT_TEST] WF ${timestamp}`;

        // Create workflow
        const wfResult = await wfManager.createWorkflow({
            name: workflowName
        });
        createdWorkflows.push(wfResult.workflowSysId);

        // Create version
        const versionResult = await wfManager.createWorkflowVersion({
            name: workflowName,
            workflowSysId: wfResult.workflowSysId,
            table: 'incident'
        });
        createdVersions.push(versionResult.versionSysId);

        // Create activity
        const activityResult = await wfManager.createActivity({
            name: 'Test Activity',
            workflowVersionSysId: versionResult.versionSysId,
            script: '// IT_TEST activity script'
        });

        console.log('\n=== createActivity ===');
        console.log('activitySysId:', activityResult.activitySysId);
        console.log('name:', activityResult.name);

        expect(activityResult).toBeDefined();
        expect(activityResult.activitySysId).toBeDefined();
        expect(typeof activityResult.activitySysId).toBe('string');
        expect(activityResult.activitySysId.length).toBeGreaterThan(0);

        createdActivities.push(activityResult.activitySysId);
    }, 120 * SECONDS);

    it('should create a transition between two activities', async () => {
        const timestamp = new Date().toISOString();
        const workflowName = `[IT_TEST] WF ${timestamp}`;

        // Create workflow
        const wfResult = await wfManager.createWorkflow({
            name: workflowName
        });
        createdWorkflows.push(wfResult.workflowSysId);

        // Create version
        const versionResult = await wfManager.createWorkflowVersion({
            name: workflowName,
            workflowSysId: wfResult.workflowSysId,
            table: 'incident'
        });
        createdVersions.push(versionResult.versionSysId);

        // Create two activities
        const activity1 = await wfManager.createActivity({
            name: 'Activity 1',
            workflowVersionSysId: versionResult.versionSysId
        });
        createdActivities.push(activity1.activitySysId);

        const activity2 = await wfManager.createActivity({
            name: 'Activity 2',
            workflowVersionSysId: versionResult.versionSysId
        });
        createdActivities.push(activity2.activitySysId);

        // Create transition from activity1 to activity2
        const transitionResult = await wfManager.createTransition({
            fromActivitySysId: activity1.activitySysId,
            toActivitySysId: activity2.activitySysId
        });

        console.log('\n=== createTransition ===');
        console.log('transitionSysId:', transitionResult.transitionSysId);

        expect(transitionResult).toBeDefined();
        expect(transitionResult.transitionSysId).toBeDefined();
        expect(typeof transitionResult.transitionSysId).toBe('string');
        expect(transitionResult.transitionSysId.length).toBeGreaterThan(0);

        createdTransitions.push(transitionResult.transitionSysId);
    }, 120 * SECONDS);

    it('should create a condition on an activity', async () => {
        const timestamp = new Date().toISOString();
        const workflowName = `[IT_TEST] WF ${timestamp}`;

        // Create workflow
        const wfResult = await wfManager.createWorkflow({
            name: workflowName
        });
        createdWorkflows.push(wfResult.workflowSysId);

        // Create version
        const versionResult = await wfManager.createWorkflowVersion({
            name: workflowName,
            workflowSysId: wfResult.workflowSysId,
            table: 'incident'
        });
        createdVersions.push(versionResult.versionSysId);

        // Create activity
        const activityResult = await wfManager.createActivity({
            name: 'Condition Activity',
            workflowVersionSysId: versionResult.versionSysId
        });
        createdActivities.push(activityResult.activitySysId);

        // Create condition on the activity
        const conditionResult = await wfManager.createCondition({
            activitySysId: activityResult.activitySysId,
            name: 'Test Condition'
        });

        console.log('\n=== createCondition ===');
        console.log('conditionSysId:', conditionResult.conditionSysId);
        console.log('name:', conditionResult.name);

        expect(conditionResult).toBeDefined();
        expect(conditionResult.conditionSysId).toBeDefined();
        expect(typeof conditionResult.conditionSysId).toBe('string');
        expect(conditionResult.conditionSysId.length).toBeGreaterThan(0);

        createdConditions.push(conditionResult.conditionSysId);
    }, 120 * SECONDS);

    it('should publish a workflow without error', async () => {
        const timestamp = new Date().toISOString();
        const workflowName = `[IT_TEST] WF ${timestamp}`;

        // Create workflow
        const wfResult = await wfManager.createWorkflow({
            name: workflowName
        });
        createdWorkflows.push(wfResult.workflowSysId);

        // Create version
        const versionResult = await wfManager.createWorkflowVersion({
            name: workflowName,
            workflowSysId: wfResult.workflowSysId,
            table: 'incident'
        });
        createdVersions.push(versionResult.versionSysId);

        // Create activity to serve as start activity
        const activityResult = await wfManager.createActivity({
            name: 'Start Activity',
            workflowVersionSysId: versionResult.versionSysId
        });
        createdActivities.push(activityResult.activitySysId);

        // Publish workflow - should not throw
        await expect(
            wfManager.publishWorkflow({
                versionSysId: versionResult.versionSysId,
                startActivitySysId: activityResult.activitySysId
            })
        ).resolves.not.toThrow();

        console.log('\n=== publishWorkflow ===');
        console.log('Published successfully without error');
    }, 120 * SECONDS);

    it('should create a complete workflow', async () => {
        const timestamp = new Date().toISOString();
        const workflowName = `[IT_TEST] Complete WF ${timestamp}`;

        const result = await wfManager.createCompleteWorkflow({
            name: workflowName,
            table: 'incident',
            activities: [
                { name: 'Activity1', x: 0, y: 0 },
                { name: 'Activity2', x: 200, y: 0 }
            ],
            transitions: [
                { from: '0', to: '1' }
            ]
        });

        console.log('\n=== createCompleteWorkflow ===');
        console.log('workflowSysId:', result.workflowSysId);
        console.log('versionSysId:', result.versionSysId);
        console.log('activitySysIds:', JSON.stringify(result.activitySysIds, null, 2));
        console.log('transitionSysIds:', JSON.stringify(result.transitionSysIds, null, 2));

        expect(result).toBeDefined();
        expect(result.workflowSysId).toBeDefined();
        expect(typeof result.workflowSysId).toBe('string');
        expect(result.workflowSysId.length).toBeGreaterThan(0);

        expect(result.versionSysId).toBeDefined();
        expect(typeof result.versionSysId).toBe('string');
        expect(result.versionSysId.length).toBeGreaterThan(0);

        expect(result.activitySysIds).toBeDefined();
        expect(result.activitySysIds['0']).toBeDefined();
        expect(result.activitySysIds['1']).toBeDefined();

        // Track all sys_ids for cleanup
        createdWorkflows.push(result.workflowSysId);
        createdVersions.push(result.versionSysId);

        for (const key of Object.keys(result.activitySysIds)) {
            // Avoid duplicate pushes for numeric index keys that reference the same sys_id
            if (!createdActivities.includes(result.activitySysIds[key])) {
                createdActivities.push(result.activitySysIds[key]);
            }
        }

        for (const transitionSysId of result.transitionSysIds) {
            createdTransitions.push(transitionSysId);
        }
    }, 120 * SECONDS);
});

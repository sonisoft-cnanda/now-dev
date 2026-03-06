import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';

import { FlowManager } from '../../../../src/sn/flow/FlowManager';
import { FlowExecutionResult, FlowContextStatusResult } from '../../../../src/sn/flow/FlowModels';

const SECONDS = 1000;

describe('FlowManager - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let flowMgr: FlowManager;

    beforeAll(async () => {
        const credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            flowMgr = new FlowManager(instance);
        }

        if (!flowMgr) {
            throw new Error('Could not get credentials.');
        }
    }, 60 * SECONDS);

    // ============================================================
    // Error Handling - Non-existent objects
    // ============================================================

    describe('error handling', () => {
        it('should handle non-existent flow gracefully', async () => {
            const result: FlowExecutionResult = await flowMgr.executeFlow({
                scopedName: 'global.nonexistent_flow_xyz_12345'
            });

            console.log('\n=== executeFlow (non-existent) ===');
            console.log('Success:', result.success);
            console.log('Error:', result.errorMessage);

            expect(result.success).toBe(false);
            expect(result.errorMessage).toBeDefined();
            expect(result.errorMessage).toContain('does not exist');
            expect(result.flowObjectName).toBe('global.nonexistent_flow_xyz_12345');
            expect(result.flowObjectType).toBe('flow');
        }, 120 * SECONDS);

        it('should handle non-existent subflow gracefully', async () => {
            const result: FlowExecutionResult = await flowMgr.executeSubflow({
                scopedName: 'global.nonexistent_subflow_xyz_12345'
            });

            console.log('\n=== executeSubflow (non-existent) ===');
            console.log('Success:', result.success);
            console.log('Error:', result.errorMessage);

            expect(result.success).toBe(false);
            expect(result.errorMessage).toContain('does not exist');
            expect(result.flowObjectType).toBe('subflow');
        }, 120 * SECONDS);

        it('should handle non-existent action gracefully', async () => {
            const result: FlowExecutionResult = await flowMgr.executeAction({
                scopedName: 'global.nonexistent_action_xyz_12345'
            });

            console.log('\n=== executeAction (non-existent) ===');
            console.log('Success:', result.success);
            console.log('Error:', result.errorMessage);

            expect(result.success).toBe(false);
            expect(result.errorMessage).toContain('does not exist');
            expect(result.flowObjectType).toBe('action');
        }, 120 * SECONDS);

        it('should return descriptive error when action receives wrong inputs', async () => {
            const result: FlowExecutionResult = await flowMgr.executeAction({
                scopedName: 'global.should_send_notification',
                inputs: {
                    table_name: 'incident',
                    sys_id: '0000000000000000000000000000dead'
                }
            });

            console.log('\n=== executeAction (wrong inputs) ===');
            console.log('Success:', result.success);
            console.log('Error:', result.errorMessage);

            expect(result.success).toBe(false);
            expect(result.errorMessage).toBeDefined();
            expect(result.errorMessage).toContain('inputs');
            expect(result.flowObjectName).toBe('global.should_send_notification');
        }, 120 * SECONDS);
    });

    // ============================================================
    // executeFlow - Background mode (proven to succeed)
    // ============================================================

    describe('executeFlow', () => {
        it('should execute a flow in background and return context ID', async () => {
            // "Change - Unauthorized - Review" is a known global OOB flow.
            // Background mode returns immediately with a context ID.
            const result: FlowExecutionResult = await flowMgr.executeFlow({
                scopedName: 'global.change__unauthorized__review',
                mode: 'background'
            });

            console.log('\n=== executeFlow (background) ===');
            console.log('Success:', result.success);
            console.log('Context ID:', result.contextId);
            console.log('Flow Object Name:', result.flowObjectName);
            console.log('Debug Output:', result.debugOutput?.substring(0, 300));

            expect(result.success).toBe(true);
            expect(result.flowObjectName).toBe('global.change__unauthorized__review');
            expect(result.flowObjectType).toBe('flow');
            expect(result.contextId).toBeDefined();
            expect(result.contextId).toMatch(/^[0-9a-f]{32}$/);
            expect(result.debugOutput).toContain('FlowRunnerResult');
            expect(result.debugOutput).toContain('global.change__unauthorized__review');
            expect(result.executionDate).toBeDefined();
        }, 120 * SECONDS);

        it('should execute a flow in foreground and get structured error for wait-state flow', async () => {
            // Foreground execution of a flow with approval/wait steps
            // produces a structured error "The current execution is in the waiting state"
            const result: FlowExecutionResult = await flowMgr.executeFlow({
                scopedName: 'global.change__unauthorized__review',
                mode: 'foreground',
                timeout: 30000
            });

            console.log('\n=== executeFlow (foreground, wait-state) ===');
            console.log('Success:', result.success);
            console.log('Error Message:', result.errorMessage);

            expect(result.success).toBe(false);
            expect(result.flowObjectName).toBe('global.change__unauthorized__review');
            expect(result.flowObjectType).toBe('flow');
            expect(result.errorMessage).toContain('waiting state');
            expect(result.rawScriptResult).toBeDefined();
        }, 120 * SECONDS);

        it('should execute a flow with quick mode', async () => {
            const result: FlowExecutionResult = await flowMgr.executeFlow({
                scopedName: 'global.change__unauthorized__review',
                mode: 'foreground',
                quick: true
            });

            console.log('\n=== executeFlow (quick mode) ===');
            console.log('Success:', result.success);
            console.log('Error Message:', result.errorMessage);

            // Quick mode on a complex flow should return a structured result
            expect(result.flowObjectName).toBe('global.change__unauthorized__review');
            expect(result.flowObjectType).toBe('flow');
            expect(result.rawScriptResult).toBeDefined();
        }, 120 * SECONDS);
    });

    // ============================================================
    // executeAction - Proven to succeed with outputs
    // ============================================================

    describe('executeAction', () => {
        it('should execute an action and return outputs', async () => {
            // "Get Notification Details" (should_send_notification) is a global action
            // that runs successfully without inputs and returns outputs.
            const result: FlowExecutionResult = await flowMgr.executeAction({
                scopedName: 'global.should_send_notification',
                mode: 'foreground'
            });

            console.log('\n=== executeAction (should_send_notification) ===');
            console.log('Success:', result.success);
            console.log('Flow Object Name:', result.flowObjectName);
            console.log('Flow Object Type:', result.flowObjectType);
            console.log('Context ID:', result.contextId);
            console.log('Outputs:', JSON.stringify(result.outputs));
            console.log('Debug Output:', result.debugOutput?.substring(0, 300));

            expect(result.success).toBe(true);
            expect(result.flowObjectName).toBe('global.should_send_notification');
            expect(result.flowObjectType).toBe('action');
            expect(result.contextId).toBeDefined();
            expect(result.contextId).toMatch(/^[0-9a-f]{32}$/);
            expect(result.outputs).toBeDefined();
            expect(result.outputs).toHaveProperty('send_va');
            expect(result.debugOutput).toContain('FlowRunnerResult');
            expect(result.debugOutput).toContain('action');
            expect(result.executionDate).toBeDefined();
        }, 120 * SECONDS);
    });

    // ============================================================
    // executeSubflow
    // ============================================================

    describe('executeSubflow', () => {
        it('should execute a subflow and return structured result', async () => {
            // "Placeholder Subflow for MFA Guided Setup" is a simple global subflow.
            // It may hit a wait state in foreground, but we verify envelope parsing works.
            const result: FlowExecutionResult = await flowMgr.executeSubflow({
                scopedName: 'global.placeholder_subflow_for_mfa_guided_setup',
                mode: 'foreground'
            });

            console.log('\n=== executeSubflow (placeholder_subflow_for_mfa_guided_setup) ===');
            console.log('Success:', result.success);
            console.log('Flow Object Name:', result.flowObjectName);
            console.log('Flow Object Type:', result.flowObjectType);
            console.log('Error Message:', result.errorMessage);

            expect(result.flowObjectName).toBe('global.placeholder_subflow_for_mfa_guided_setup');
            expect(result.flowObjectType).toBe('subflow');
            expect(result.rawScriptResult).toBeDefined();
        }, 120 * SECONDS);
    });

    // ============================================================
    // Scope handling
    // ============================================================

    describe('scope handling', () => {
        it('should execute with explicit global scope by name', async () => {
            const result: FlowExecutionResult = await flowMgr.executeFlow({
                scopedName: 'global.nonexistent_flow_xyz_12345',
                scope: 'global'
            });

            console.log('\n=== executeFlow (explicit scope: global) ===');
            console.log('Success:', result.success);
            console.log('Error:', result.errorMessage);

            expect(result.success).toBe(false);
            // Error should be about the flow not existing, not scope resolution failure
            expect(result.errorMessage).toContain('does not exist');
        }, 120 * SECONDS);
    });

    // ============================================================
    // Flow Context Lifecycle
    // ============================================================

    describe('flow context lifecycle', () => {
        it('should get context status for a background flow execution', async () => {
            // Execute a flow in background to get a real context ID
            const execResult: FlowExecutionResult = await flowMgr.executeFlow({
                scopedName: 'global.change__unauthorized__review',
                mode: 'background'
            });

            console.log('\n=== lifecycle: executeFlow (background) ===');
            console.log('Success:', execResult.success);
            console.log('Context ID:', execResult.contextId);

            expect(execResult.success).toBe(true);
            expect(execResult.contextId).toBeDefined();
            expect(execResult.contextId).toMatch(/^[0-9a-f]{32}$/);

            // Now query the context status
            const statusResult: FlowContextStatusResult = await flowMgr.getFlowContextStatus(execResult.contextId!);

            console.log('\n=== lifecycle: getFlowContextStatus ===');
            console.log('Success:', statusResult.success);
            console.log('Found:', statusResult.found);
            console.log('State:', statusResult.state);
            console.log('Name:', statusResult.name);
            console.log('Started:', statusResult.started);

            expect(statusResult.success).toBe(true);
            expect(statusResult.found).toBe(true);
            expect(statusResult.state).toBeDefined();
            expect(['QUEUED', 'IN_PROGRESS', 'WAITING', 'COMPLETE', 'CANCELLED', 'ERROR']).toContain(statusResult.state);
            expect(statusResult.name).toBeDefined();
        }, 120 * SECONDS);

        it('should return found=false for non-existent context ID', async () => {
            const statusResult = await flowMgr.getFlowContextStatus('00000000000000000000000000000000');

            console.log('\n=== lifecycle: getFlowContextStatus (non-existent) ===');
            console.log('Success:', statusResult.success);
            console.log('Found:', statusResult.found);

            expect(statusResult.success).toBe(true);
            expect(statusResult.found).toBe(false);
            expect(statusResult.state).toBeUndefined();
        }, 120 * SECONDS);

        it('should get outputs for a completed action', async () => {
            // Execute an action in foreground (completes immediately)
            const execResult: FlowExecutionResult = await flowMgr.executeAction({
                scopedName: 'global.should_send_notification',
                mode: 'foreground'
            });

            console.log('\n=== lifecycle: executeAction (foreground) ===');
            console.log('Success:', execResult.success);
            console.log('Context ID:', execResult.contextId);

            expect(execResult.success).toBe(true);
            expect(execResult.contextId).toBeDefined();

            // Now get outputs via lifecycle API
            const outputsResult = await flowMgr.getFlowOutputs(execResult.contextId!);

            console.log('\n=== lifecycle: getFlowOutputs ===');
            console.log('Success:', outputsResult.success);
            console.log('Outputs:', JSON.stringify(outputsResult.outputs));

            expect(outputsResult.success).toBe(true);
            // Outputs may be empty object if the flow already returned them inline
            expect(outputsResult.outputs).toBeDefined();
        }, 120 * SECONDS);

        it('should get error message for a completed context', async () => {
            // Execute an action with wrong inputs to produce an error
            const execResult: FlowExecutionResult = await flowMgr.executeAction({
                scopedName: 'global.should_send_notification',
                inputs: {
                    table_name: 'incident',
                    sys_id: '0000000000000000000000000000dead'
                }
            });

            console.log('\n=== lifecycle: executeAction (wrong inputs) ===');
            console.log('Success:', execResult.success);

            // The action may fail or succeed depending on how it handles bad input.
            // Either way, we can query the error message.
            if (execResult.contextId) {
                const errorResult = await flowMgr.getFlowError(execResult.contextId);

                console.log('\n=== lifecycle: getFlowError ===');
                console.log('Success:', errorResult.success);
                console.log('Flow Error:', errorResult.flowErrorMessage);

                expect(errorResult.success).toBe(true);
                // flowErrorMessage may or may not be present depending on the error
            }
        }, 120 * SECONDS);

        it('should cancel a background flow', async () => {
            // Execute a flow in background
            const execResult: FlowExecutionResult = await flowMgr.executeFlow({
                scopedName: 'global.change__unauthorized__review',
                mode: 'background'
            });

            console.log('\n=== lifecycle: executeFlow for cancel ===');
            console.log('Success:', execResult.success);
            console.log('Context ID:', execResult.contextId);

            expect(execResult.success).toBe(true);
            expect(execResult.contextId).toBeDefined();

            // Cancel the flow
            const cancelResult = await flowMgr.cancelFlow(
                execResult.contextId!,
                'Cancelled by integration test'
            );

            console.log('\n=== lifecycle: cancelFlow ===');
            console.log('Success:', cancelResult.success);
            console.log('Error:', cancelResult.errorMessage);

            // Cancel should succeed (or fail gracefully if already completed)
            expect(cancelResult.contextId).toBe(execResult.contextId);
            expect(cancelResult.rawScriptResult).toBeDefined();
        }, 120 * SECONDS);
    });
});

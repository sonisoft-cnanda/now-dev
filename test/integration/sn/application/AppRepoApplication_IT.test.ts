import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';

import {
    AppRepoApplication,
    AppRepoInstallRequest,
    AppRepoPublishRequest,
    AppRepoInstallResponse,
    AppRepoPublishResponse,
    AppRepoOperationResult
} from '../../../../src/sn/application/AppRepoApplication';

describe('AppRepoApplication', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;
    const SECONDS = 1000;

    // Test application details - replace with actual values for your instance
    const TEST_APP_SCOPE = 'x_test_app';
    const TEST_APP_SYS_ID = 'test_app_sys_id_here';
    const TEST_APP_VERSION = '1.0.0';

    beforeEach(async () => {
        credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
        }
    });

    describe('installFromAppRepo', () => {
        it('should initiate app repo install', async () => {
            const appRepo = new AppRepoApplication(instance);
            const installRequest: AppRepoInstallRequest = {
                scope: TEST_APP_SCOPE,
                sys_id: TEST_APP_SYS_ID,
                version: TEST_APP_VERSION
            };
            
            const response: AppRepoInstallResponse = await appRepo.installFromAppRepo(installRequest);
            
            console.log('Install Response:', JSON.stringify(response, null, 2));
            
            expect(response).toBeDefined();
            expect(response.status).toBeDefined();
            expect(response.status_label).toBeDefined();
            expect(response.links).toBeDefined();
            expect(response.links.progress).toBeDefined();
            expect(response.links.progress.id).toBeDefined();
            expect(response.links.progress.url).toBeDefined();
            expect(response.percent_complete).toBeDefined();
        }, 60 * SECONDS);

        it('should install with optional parameters', async () => {
            const appRepo = new AppRepoApplication(instance);
            const installRequest: AppRepoInstallRequest = {
                scope: TEST_APP_SCOPE,
                sys_id: TEST_APP_SYS_ID,
                version: TEST_APP_VERSION,
                auto_upgrade_base_app: false,
                base_app_version: '1.0.0'
            };
            
            const response: AppRepoInstallResponse = await appRepo.installFromAppRepo(installRequest);
            
            expect(response).toBeDefined();
            expect(response.links.progress.id).toBeDefined();
        }, 60 * SECONDS);

        it('should handle install errors gracefully', async () => {
            const appRepo = new AppRepoApplication(instance);
            const invalidRequest: AppRepoInstallRequest = {
                scope: 'invalid_scope',
                sys_id: 'invalid_sys_id'
            };
            
            await expect(appRepo.installFromAppRepo(invalidRequest)).rejects.toThrow();
        }, 30 * SECONDS);
    });

    describe('installFromAppRepoAndWait', () => {
        it('should install and wait for completion', async () => {
            const appRepo = new AppRepoApplication(instance);
            const installRequest: AppRepoInstallRequest = {
                scope: TEST_APP_SCOPE,
                sys_id: TEST_APP_SYS_ID,
                version: TEST_APP_VERSION
            };
            
            // This test may take a long time depending on app size
            const result: AppRepoOperationResult = await appRepo.installFromAppRepoAndWait(
                installRequest,
                5000, // Poll every 5 seconds
                600000 // 10 minute timeout
            );
            
            console.log('Install Result:', JSON.stringify(result, null, 2));
            
            expect(result).toBeDefined();
            expect(result.success).toBeDefined();
            expect(result.percent_complete).toBe(100);
            expect(result.status_label).toBeDefined();
            
            if (result.success) {
                console.log('✓ Installation completed successfully');
            } else {
                console.log('✗ Installation failed:', result.error);
            }
        }, 600 * SECONDS); // 10 minute timeout for long-running install

        it('should handle timeout for long-running installs', async () => {
            const appRepo = new AppRepoApplication(instance);
            const installRequest: AppRepoInstallRequest = {
                scope: TEST_APP_SCOPE,
                sys_id: TEST_APP_SYS_ID
            };
            
            // Use very short timeout to test timeout handling
            await expect(
                appRepo.installFromAppRepoAndWait(installRequest, 1000, 5000)
            ).rejects.toThrow(/timed out/i);
        }, 10 * SECONDS);
    });

    describe('publishToAppRepo', () => {
        it('should initiate app repo publish', async () => {
            const appRepo = new AppRepoApplication(instance);
            const publishRequest: AppRepoPublishRequest = {
                scope: TEST_APP_SCOPE,
                sys_id: TEST_APP_SYS_ID,
                version: TEST_APP_VERSION,
                dev_notes: 'Published via AppRepoApplication test'
            };
            
            const response: AppRepoPublishResponse = await appRepo.publishToAppRepo(publishRequest);
            
            console.log('Publish Response:', JSON.stringify(response, null, 2));
            
            expect(response).toBeDefined();
            expect(response.status).toBeDefined();
            expect(response.status_label).toBeDefined();
            expect(response.links).toBeDefined();
            expect(response.links.progress).toBeDefined();
            expect(response.links.progress.id).toBeDefined();
            expect(response.percent_complete).toBeDefined();
        }, 60 * SECONDS);

        it('should publish without optional parameters', async () => {
            const appRepo = new AppRepoApplication(instance);
            const publishRequest: AppRepoPublishRequest = {
                scope: TEST_APP_SCOPE,
                sys_id: TEST_APP_SYS_ID
            };
            
            const response: AppRepoPublishResponse = await appRepo.publishToAppRepo(publishRequest);
            
            expect(response).toBeDefined();
            expect(response.links.progress.id).toBeDefined();
        }, 60 * SECONDS);

        it('should handle publish errors gracefully', async () => {
            const appRepo = new AppRepoApplication(instance);
            const invalidRequest: AppRepoPublishRequest = {
                scope: 'invalid_scope',
                sys_id: 'invalid_sys_id'
            };
            
            await expect(appRepo.publishToAppRepo(invalidRequest)).rejects.toThrow();
        }, 30 * SECONDS);
    });

    describe('publishToAppRepoAndWait', () => {
        it('should publish and wait for completion', async () => {
            const appRepo = new AppRepoApplication(instance);
            const publishRequest: AppRepoPublishRequest = {
                scope: TEST_APP_SCOPE,
                sys_id: TEST_APP_SYS_ID,
                version: TEST_APP_VERSION,
                dev_notes: 'Test publish with wait'
            };
            
            const result: AppRepoOperationResult = await appRepo.publishToAppRepoAndWait(
                publishRequest,
                5000, // Poll every 5 seconds
                300000 // 5 minute timeout
            );
            
            console.log('Publish Result:', JSON.stringify(result, null, 2));
            
            expect(result).toBeDefined();
            expect(result.success).toBeDefined();
            expect(result.percent_complete).toBe(100);
            
            if (result.success) {
                console.log('✓ Publish completed successfully');
            } else {
                console.log('✗ Publish failed:', result.error);
            }
        }, 300 * SECONDS); // 5 minute timeout

        it('should handle timeout for long-running publishes', async () => {
            const appRepo = new AppRepoApplication(instance);
            const publishRequest: AppRepoPublishRequest = {
                scope: TEST_APP_SCOPE,
                sys_id: TEST_APP_SYS_ID
            };
            
            // Use very short timeout to test timeout handling
            await expect(
                appRepo.publishToAppRepoAndWait(publishRequest, 1000, 5000)
            ).rejects.toThrow(/timed out/i);
        }, 10 * SECONDS);
    });

    describe('getProgress', () => {
        it('should get progress for an operation', async () => {
            const appRepo = new AppRepoApplication(instance);
            
            // First start an operation to get a progress ID
            const publishRequest: AppRepoPublishRequest = {
                scope: TEST_APP_SCOPE,
                sys_id: TEST_APP_SYS_ID
            };
            
            const publishResponse = await appRepo.publishToAppRepo(publishRequest);
            const progressId = publishResponse.links.progress.id;
            
            // Then check the progress
            const progress = await appRepo.getProgress(progressId);
            
            console.log('Progress:', JSON.stringify(progress, null, 2));
            
            expect(progress).toBeDefined();
            expect(progress.status).toBeDefined();
            expect(progress.status_label).toBeDefined();
            expect(progress.percent_complete).toBeDefined();
            expect(typeof progress.percent_complete).toBe('number');
            expect(progress.percent_complete).toBeGreaterThanOrEqual(0);
            expect(progress.percent_complete).toBeLessThanOrEqual(100);
        }, 60 * SECONDS);

        it('should handle invalid progress ID', async () => {
            const appRepo = new AppRepoApplication(instance);
            const invalidProgressId = 'invalid_progress_id_123';
            
            await expect(appRepo.getProgress(invalidProgressId)).rejects.toThrow();
        }, 30 * SECONDS);
    });

    describe('integration workflow', () => {
        it('should complete full publish workflow', async () => {
            const appRepo = new AppRepoApplication(instance);
            
            console.log('\n=== Starting Publish Workflow ===');
            
            // Step 1: Initiate publish
            const publishRequest: AppRepoPublishRequest = {
                scope: TEST_APP_SCOPE,
                sys_id: TEST_APP_SYS_ID,
                version: TEST_APP_VERSION,
                dev_notes: 'Integration test publish'
            };
            
            const publishResponse = await appRepo.publishToAppRepo(publishRequest);
            console.log(`Step 1: Publish initiated (Progress ID: ${publishResponse.links.progress.id})`);
            expect(publishResponse.links.progress.id).toBeDefined();
            
            // Step 2: Monitor progress
            let progress = await appRepo.getProgress(publishResponse.links.progress.id);
            console.log(`Step 2: Initial progress: ${progress.percent_complete}%`);
            
            let iterations = 0;
            while (progress.percent_complete < 100 && iterations < 60) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                progress = await appRepo.getProgress(publishResponse.links.progress.id);
                console.log(`  Progress update: ${progress.percent_complete}% - ${progress.status_label}`);
                iterations++;
            }
            
            // Step 3: Verify completion
            expect(progress.percent_complete).toBe(100);
            console.log('Step 3: Publish completed successfully ✓');
            console.log('=== Workflow Complete ===\n');
        }, 600 * SECONDS);

        it('should complete full install workflow', async () => {
            const appRepo = new AppRepoApplication(instance);
            
            console.log('\n=== Starting Install Workflow ===');
            
            // Step 1: Initiate install
            const installRequest: AppRepoInstallRequest = {
                scope: TEST_APP_SCOPE,
                sys_id: TEST_APP_SYS_ID,
                version: TEST_APP_VERSION
            };
            
            const installResponse = await appRepo.installFromAppRepo(installRequest);
            console.log(`Step 1: Install initiated (Progress ID: ${installResponse.links.progress.id})`);
            
            // Step 2: Monitor progress
            let progress = await appRepo.getProgress(installResponse.links.progress.id);
            console.log(`Step 2: Initial progress: ${progress.percent_complete}%`);
            
            let iterations = 0;
            while (progress.percent_complete < 100 && iterations < 120) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                progress = await appRepo.getProgress(installResponse.links.progress.id);
                console.log(`  Progress update: ${progress.percent_complete}% - ${progress.status_label}`);
                iterations++;
            }
            
            // Step 3: Verify completion
            expect(progress.percent_complete).toBe(100);
            console.log('Step 3: Install completed successfully ✓');
            console.log('=== Workflow Complete ===\n');
        }, 600 * SECONDS);
    });
});




import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";

import { BatchDefinition } from '../../../../src/sn/application/BatchDefinition';
import { 
    ApplicationManager, 
    ApplicationValidationResult, 
    BatchValidationResult 
} from '../../../../src/sn/application/ApplicationManager';

import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ApplicationManager', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;
    const BATCH_DEFINITION_PATH = path.join(__dirname, '../../../data/batchInstallDefinition.json');
    const SECONDS = 1000;

    beforeEach(async () => {
       
        const alias: string = 'dev209219';
   
        credential = await getCredentials(alias);
        
         if(credential){
            const snSettings:ServiceNowSettingsInstance = {
            alias: alias,
            credential: credential
            }
            instance = new ServiceNowInstance(snSettings);
        }
         
       
        
    });

    describe('getApplicationDetails', () => {
        it('should get application details', async () => {
            const appManager = new ApplicationManager(instance);
            const result = await appManager.getApplicationDetails('012fa9ad7367ad6393ae5dea97af6f65');
            console.log(result);
            expect(result).toBeDefined();
        });
    });

    describe('serializeBatchDefinition', () => {
        it('should serialize batch definition', async () => {
           const batchDefinition = new BatchDefinition("123", true, "test", "1.0.0", "1.0.0", "test");
           const batchStr = JSON.stringify(batchDefinition);
            expect(batchStr).toBe('{"id":"123","load_demo_data":true,"notes":"test","requested_customization_version":"1.0.0","requested_version":"1.0.0","type":"test"}');
        });
    });


    describe('installBatch', () => {
        it('should install batch', async () => {
            const appManager = new ApplicationManager(instance);
            const result = await appManager.installBatch('/Users/cnanda/git/now-sdk-ext/now-sdk-ext-core/test/data/batchInstallDefinition.json');
            expect(result).toBe(true);
        });
    });

    describe('validateBatchDefinition', () => {
        it('should validate batch definition file', async () => {
            const appManager = new ApplicationManager(instance);
            const result: BatchValidationResult = await appManager.validateBatchDefinition(BATCH_DEFINITION_PATH);
            
            console.log('Batch Validation Result:', JSON.stringify(result, null, 2));
            
            expect(result).toBeDefined();
            expect(result.totalApplications).toBeGreaterThan(0);
            expect(result.applications).toBeDefined();
            expect(result.applications.length).toBe(result.totalApplications);
            expect(result.isValid).toBeDefined();
            
            // Check that summary counts add up
            const calculatedTotal = result.alreadyValid + result.needsInstallation + result.needsUpgrade + result.errors;
            expect(calculatedTotal).toBe(result.totalApplications);
        }, 60 * SECONDS);

        it('should validate batch and provide detailed app information', async () => {
            const appManager = new ApplicationManager(instance);
            const result: BatchValidationResult = await appManager.validateBatchDefinition(BATCH_DEFINITION_PATH);
            
            // Check each application has required properties
            result.applications.forEach((app: ApplicationValidationResult) => {
                expect(app.id).toBeDefined();
                expect(app.requested_version).toBeDefined();
                expect(app.isInstalled).toBeDefined();
                expect(app.isVersionMatch).toBeDefined();
                expect(app.isUpdateAvailable).toBeDefined();
                expect(app.needsAction).toBeDefined();
                expect(app.validationStatus).toBeDefined();
                expect(['valid', 'mismatch', 'not_installed', 'update_needed', 'error']).toContain(app.validationStatus);
                
                if (app.isInstalled) {
                    expect(app.installed_version).toBeDefined();
                    expect(app.name).toBeDefined();
                }
                
                console.log(`App ${app.id} (${app.name || 'Unknown'}): ${app.validationStatus}`);
                console.log(`  Requested: ${app.requested_version}, Installed: ${app.installed_version || 'N/A'}`);
            });
        }, 60 * SECONDS);
    });

    describe('validateApplication', () => {
        it('should validate a single application from batch definition', async () => {
            const appManager = new ApplicationManager(instance);
            const batchDef = new BatchDefinition(
                '012fa9ad7367ad6393ae5dea97af6f65', // Mobile Card Builder
                true,
                'Test validation',
                '',
                '25.10.0',
                'application'
            );
            
            const result: ApplicationValidationResult = await appManager.validateApplication(batchDef);
            
            console.log('Single App Validation Result:', JSON.stringify(result, null, 2));
            
            expect(result).toBeDefined();
            expect(result.id).toBe('012fa9ad7367ad6393ae5dea97af6f65');
            expect(result.requested_version).toBe('25.10.0');
            expect(result.validationStatus).toBeDefined();
            
            if (result.isInstalled) {
                expect(result.installed_version).toBeDefined();
                expect(result.name).toBeDefined();
                expect(result.appDetails).toBeDefined();
            }
        }, 30 * SECONDS);

        it('should detect when installed version matches requested version', async () => {
            const appManager = new ApplicationManager(instance);
            
            // First get the actual installed version
            const appDetails = await appManager.getApplicationDetails('012fa9ad7367ad6393ae5dea97af6f65');
            
            if (appDetails && appDetails.isInstalled) {
                const installedVersion = appDetails.version;
                
                const batchDef = new BatchDefinition(
                    '012fa9ad7367ad6393ae5dea97af6f65',
                    true,
                    'Test exact match',
                    '',
                    installedVersion,
                    'application'
                );
                
                const result: ApplicationValidationResult = await appManager.validateApplication(batchDef);
                
                expect(result.isInstalled).toBe(true);
                expect(result.isVersionMatch).toBe(true);
                expect(result.validationStatus).toBe('valid');
                expect(result.needsAction).toBe(false);
            }
        }, 30 * SECONDS);

        it('should detect when application needs update', async () => {
            const appManager = new ApplicationManager(instance);
            const batchDef = new BatchDefinition(
                '012fa9ad7367ad6393ae5dea97af6f65',
                true,
                'Test update needed',
                '',
                '99.99.99', // Request a higher version
                'application'
            );
            
            const result: ApplicationValidationResult = await appManager.validateApplication(batchDef);
            
            console.log('Update Detection Result:', JSON.stringify(result, null, 2));
            
            if (result.isInstalled) {
                // If app is installed, requesting higher version should show update needed or mismatch
                expect(['update_needed', 'mismatch', 'valid']).toContain(result.validationStatus);
            }
        }, 30 * SECONDS);

        it('should handle non-existent application', async () => {
            const appManager = new ApplicationManager(instance);
            const batchDef = new BatchDefinition(
                'invalid_sys_id_12345678901234567890',
                true,
                'Test non-existent',
                '',
                '1.0.0',
                'application'
            );
            
            const result: ApplicationValidationResult = await appManager.validateApplication(batchDef);
            
            expect(result).toBeDefined();
            expect(result.isInstalled).toBe(false);
            expect(['not_installed', 'error']).toContain(result.validationStatus);
            expect(result.needsAction).toBeDefined();
        }, 30 * SECONDS);
    });

    describe('checkInstalledApplications', () => {
        it('should return only installed applications from batch', async () => {
            const appManager = new ApplicationManager(instance);
            const installedApps: ApplicationValidationResult[] = await appManager.checkInstalledApplications(BATCH_DEFINITION_PATH);
            
            console.log(`Found ${installedApps.length} installed applications`);
            
            expect(installedApps).toBeDefined();
            expect(Array.isArray(installedApps)).toBe(true);
            
            // All returned apps should be installed
            installedApps.forEach((app: ApplicationValidationResult) => {
                expect(app.isInstalled).toBe(true);
                expect(app.installed_version).toBeDefined();
                expect(app.name).toBeDefined();
                console.log(`  - ${app.name} (${app.installed_version}): ${app.validationStatus}`);
            });
        }, 60 * SECONDS);

        it('should include app details for installed applications', async () => {
            const appManager = new ApplicationManager(instance);
            const installedApps: ApplicationValidationResult[] = await appManager.checkInstalledApplications(BATCH_DEFINITION_PATH);
            
            if (installedApps.length > 0) {
                const firstApp = installedApps[0];
                expect(firstApp.appDetails).toBeDefined();
                expect(firstApp.appDetails?.name).toBe(firstApp.name);
                expect(firstApp.appDetails?.version).toBe(firstApp.installed_version);
            }
        }, 60 * SECONDS);
    });

    describe('getApplicationsNeedingAction', () => {
        it('should return applications that need installation or upgrade', async () => {
            const appManager = new ApplicationManager(instance);
            const needsActionApps: ApplicationValidationResult[] = await appManager.getApplicationsNeedingAction(BATCH_DEFINITION_PATH);
            
            console.log(`Found ${needsActionApps.length} applications needing action`);
            
            expect(needsActionApps).toBeDefined();
            expect(Array.isArray(needsActionApps)).toBe(true);
            
            // All returned apps should need action
            needsActionApps.forEach((app: ApplicationValidationResult) => {
                expect(app.needsAction).toBe(true);
                expect(['not_installed', 'update_needed']).toContain(app.validationStatus);
                console.log(`  - ${app.name || app.id}: ${app.validationStatus} (${app.requested_version})`);
            });
        }, 60 * SECONDS);

        it('should not include apps with matching versions', async () => {
            const appManager = new ApplicationManager(instance);
            const needsActionApps: ApplicationValidationResult[] = await appManager.getApplicationsNeedingAction(BATCH_DEFINITION_PATH);
            
            // Apps with valid status should not be in this list
            needsActionApps.forEach((app: ApplicationValidationResult) => {
                expect(app.validationStatus).not.toBe('valid');
            });
        }, 60 * SECONDS);
    });

    describe('version comparison scenarios', () => {
        it('should correctly identify version mismatches', async () => {
            const appManager = new ApplicationManager(instance);
            const batchValidation = await appManager.validateBatchDefinition(BATCH_DEFINITION_PATH);
            
            const versionMismatches = batchValidation.applications.filter(
                (app: ApplicationValidationResult) => app.isInstalled && !app.isVersionMatch
            );
            
            console.log(`Found ${versionMismatches.length} version mismatches`);
            
            versionMismatches.forEach((app: ApplicationValidationResult) => {
                console.log(`  - ${app.name}:`);
                console.log(`    Installed: ${app.installed_version}`);
                console.log(`    Requested: ${app.requested_version}`);
                console.log(`    Status: ${app.validationStatus}`);
                
                expect(app.installed_version).not.toBe(app.requested_version);
            });
        }, 60 * SECONDS);

        it('should provide comprehensive batch summary', async () => {
            const appManager = new ApplicationManager(instance);
            const result: BatchValidationResult = await appManager.validateBatchDefinition(BATCH_DEFINITION_PATH);
            
            console.log('\n=== Batch Validation Summary ===');
            console.log(`Total Applications: ${result.totalApplications}`);
            console.log(`Already Valid: ${result.alreadyValid}`);
            console.log(`Need Installation: ${result.needsInstallation}`);
            console.log(`Need Upgrade: ${result.needsUpgrade}`);
            console.log(`Errors: ${result.errors}`);
            console.log(`Overall Valid: ${result.isValid}`);
            console.log('===============================\n');
            
            expect(result.totalApplications).toBeGreaterThan(0);
            expect(typeof result.alreadyValid).toBe('number');
            expect(typeof result.needsInstallation).toBe('number');
            expect(typeof result.needsUpgrade).toBe('number');
            expect(typeof result.errors).toBe('number');
            expect(typeof result.isValid).toBe('boolean');
        }, 60 * SECONDS);

        it('should handle mixed validation statuses', async () => {
            const appManager = new ApplicationManager(instance);
            const result: BatchValidationResult = await appManager.validateBatchDefinition(BATCH_DEFINITION_PATH);
            
            const statusCounts: Record<string, number> = {
                valid: 0,
                mismatch: 0,
                not_installed: 0,
                update_needed: 0,
                error: 0
            };
            
            result.applications.forEach((app: ApplicationValidationResult) => {
                statusCounts[app.validationStatus]++;
            });
            
            console.log('Status Distribution:');
            Object.entries(statusCounts).forEach(([status, count]) => {
                if (count > 0) {
                    console.log(`  ${status}: ${count}`);
                }
            });
            
            // At least some statuses should be present
            const totalStatuses = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
            expect(totalStatuses).toBe(result.totalApplications);
        }, 60 * SECONDS);
    });

});
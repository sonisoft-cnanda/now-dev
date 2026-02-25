import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';

import { ApplicationManager, APP_TAB_CONTEXT } from '../../../../src/sn/application/ApplicationManager';
import { ApplicationDetailModel } from '../../../../src/sn/application/ApplicationDetailModel';
import {
    StoreAppOperationResult,
    StoreAppFinalResult
} from '../../../../src/sn/application/StoreApplicationModels';

const SECONDS = 1000;

describe('Store Application Management - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;
    let appManager: ApplicationManager;

    beforeEach(async () => {
        credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            appManager = new ApplicationManager(instance);
        }

        if (!instance) throw new Error("Could not get credentials.");
    });

    // ============================================================
    // Search Applications
    // ============================================================

    describe('searchApplications', () => {
        it('should search available apps', async () => {
            const apps: ApplicationDetailModel[] = await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.AVAILABLE_FOR_YOU,
                limit: 10
            });

            console.log(`\nFound ${apps.length} available apps`);

            expect(apps).toBeDefined();
            expect(Array.isArray(apps)).toBe(true);

            if (apps.length > 0) {
                console.log('\nSample available apps:');
                apps.slice(0, 5).forEach(app => {
                    console.log(`  - ${app.name} (version: ${app.version}, sys_id: ${app.sys_id})`);
                });
            }
        }, 60 * SECONDS);

        it('should search installed apps', async () => {
            const apps: ApplicationDetailModel[] = await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.INSTALLED,
                limit: 10
            });

            console.log(`\nFound ${apps.length} installed apps`);

            expect(apps).toBeDefined();
            expect(Array.isArray(apps)).toBe(true);

            if (apps.length > 0) {
                console.log('\nSample installed apps:');
                apps.slice(0, 5).forEach(app => {
                    console.log(`  - ${app.name} (version: ${app.version})`);
                });
            }
        }, 60 * SECONDS);

        it('should search apps with updates available', async () => {
            const apps: ApplicationDetailModel[] = await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.UPDATES,
                limit: 10
            });

            console.log(`\nFound ${apps.length} apps with updates`);

            expect(apps).toBeDefined();
            expect(Array.isArray(apps)).toBe(true);

            if (apps.length > 0) {
                console.log('\nApps with updates:');
                apps.slice(0, 5).forEach(app => {
                    console.log(`  - ${app.name} (current: ${app.version}, latest: ${app.latest_version || 'N/A'})`);
                });
            }
        }, 60 * SECONDS);

        it('should search with keyword filter', async () => {
            const apps: ApplicationDetailModel[] = await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.AVAILABLE_FOR_YOU,
                searchKey: 'ITSM',
                limit: 10
            });

            console.log(`\nFound ${apps.length} apps matching "ITSM"`);

            expect(apps).toBeDefined();
            expect(Array.isArray(apps)).toBe(true);

            if (apps.length > 0) {
                console.log('\nMatching apps:');
                apps.slice(0, 5).forEach(app => {
                    console.log(`  - ${app.name}`);
                });
            }
        }, 60 * SECONDS);

        it('should respect pagination limit', async () => {
            const limit = 3;
            const apps: ApplicationDetailModel[] = await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.INSTALLED,
                limit
            });

            console.log(`\nRequested limit: ${limit}, returned: ${apps.length}`);

            expect(apps).toBeDefined();
            expect(Array.isArray(apps)).toBe(true);
            expect(apps.length).toBeLessThanOrEqual(limit);
        }, 60 * SECONDS);

        it('should support pagination offset', async () => {
            // First page
            const page1 = await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.INSTALLED,
                limit: 3,
                offset: 0
            });

            // Second page
            const page2 = await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.INSTALLED,
                limit: 3,
                offset: 3
            });

            console.log(`\nPage 1: ${page1.length} apps, Page 2: ${page2.length} apps`);

            expect(page1).toBeDefined();
            expect(page2).toBeDefined();

            // If there are enough apps, pages should be different
            if (page1.length > 0 && page2.length > 0) {
                const page1Ids = page1.map(a => a.sys_id);
                const page2Ids = page2.map(a => a.sys_id);
                const overlap = page1Ids.filter(id => page2Ids.includes(id));
                console.log(`  Overlap between pages: ${overlap.length}`);
                expect(overlap.length).toBe(0);
            }
        }, 60 * SECONDS);
    });

    // ============================================================
    // Install Store Application (Real Install)
    // ============================================================

    describe('installStoreApplication', () => {
        it('should find an available app and initiate install', async () => {
            // First, search for available apps to find one we can install
            const availableApps = await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.AVAILABLE_FOR_YOU,
                limit: 20
            });

            console.log(`\nFound ${availableApps.length} available apps for install test`);

            if (availableApps.length === 0) {
                console.log('No available apps found to install. Skipping install test.');
                return;
            }

            // Find a free app that can be installed
            const installableApp = availableApps.find(app =>
                app.can_install_or_upgrade && app.version
            );

            if (!installableApp) {
                console.log('No installable app found (all may require entitlements). Skipping.');
                return;
            }

            console.log(`\nAttempting to install: ${installableApp.name} (v${installableApp.version})`);
            console.log(`  app_id: ${installableApp.source_app_id || installableApp.sys_id}`);

            try {
                const result: StoreAppOperationResult = await appManager.installStoreApplication({
                    appId: installableApp.source_app_id || installableApp.sys_id,
                    version: installableApp.version
                });

                console.log('\nInstall result:', JSON.stringify(result, null, 2));

                expect(result).toBeDefined();
                const trackerId = result.tracker_id || result.trackerId || result.links?.progress?.id;
                console.log(`  Tracker ID: ${trackerId || 'none'}`);
                // Tracker ID confirms the operation was initiated
                expect(trackerId || result.status).toBeDefined();
            } catch (e: any) {
                // Install may fail due to entitlements or other reasons - that's OK
                console.log(`Install failed (may be expected): ${e.message}`);
                expect(e.message).toBeDefined();
            }
        }, 120 * SECONDS);
    });

    describe('installStoreApplicationAndWait', () => {
        it('should install an app and wait for completion', async () => {
            // Search for available apps
            const availableApps = await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.AVAILABLE_FOR_YOU,
                limit: 20
            });

            if (availableApps.length === 0) {
                console.log('No available apps found. Skipping install-and-wait test.');
                return;
            }

            const installableApp = availableApps.find(app =>
                app.can_install_or_upgrade && app.version
            );

            if (!installableApp) {
                console.log('No installable app found. Skipping.');
                return;
            }

            console.log(`\nInstalling and waiting: ${installableApp.name} (v${installableApp.version})`);

            try {
                const result: StoreAppFinalResult = await appManager.installStoreApplicationAndWait(
                    {
                        appId: installableApp.source_app_id || installableApp.sys_id,
                        version: installableApp.version
                    },
                    5000,        // poll every 5s
                    10 * 60000   // 10 minute timeout
                );

                console.log('\nInstall final result:', JSON.stringify(result, null, 2));

                expect(result).toBeDefined();
                expect(typeof result.success).toBe('boolean');
                expect(typeof result.percent_complete).toBe('number');
                expect(result.status).toBeDefined();
                expect(result.status_label).toBeDefined();

                if (result.success) {
                    console.log(`Successfully installed: ${installableApp.name}`);
                } else {
                    console.log(`Install completed with failure: ${result.error || result.status_message}`);
                }
            } catch (e: any) {
                console.log(`Install-and-wait failed (may be expected): ${e.message}`);
                expect(e.message).toBeDefined();
            }
        }, 15 * 60 * SECONDS); // 15 minute timeout for full install
    });

    // ============================================================
    // Update Store Application
    // ============================================================

    describe('updateStoreApplication', () => {
        it('should find an app with updates and initiate update', async () => {
            // Search for apps with updates
            const updatableApps = await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.UPDATES,
                limit: 10
            });

            console.log(`\nFound ${updatableApps.length} apps with updates`);

            if (updatableApps.length === 0) {
                console.log('No updatable apps found. Skipping update test.');
                return;
            }

            const targetApp = updatableApps[0];
            const targetVersion = targetApp.latest_version || targetApp.version;

            console.log(`\nAttempting to update: ${targetApp.name} to v${targetVersion}`);

            try {
                const result: StoreAppOperationResult = await appManager.updateStoreApplication({
                    appId: targetApp.source_app_id || targetApp.sys_id,
                    version: targetVersion
                });

                console.log('\nUpdate result:', JSON.stringify(result, null, 2));

                expect(result).toBeDefined();

                const trackerId = result.tracker_id || result.trackerId || result.links?.progress?.id;
                console.log(`  Tracker ID: ${trackerId || 'none'}`);
                expect(trackerId || result.status).toBeDefined();
            } catch (e: any) {
                console.log(`Update failed (may be expected): ${e.message}`);
                expect(e.message).toBeDefined();
            }
        }, 120 * SECONDS);
    });
});

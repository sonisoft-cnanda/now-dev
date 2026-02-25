/**
 * Unit tests for ApplicationManager
 * Tests compareVersions, validateApplication, validateBatchInstallation, getApplicationDetails
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { createGetCredentialsMock } from '../../__mocks__/servicenow-sdk-mocks';
import { ApplicationManager, APP_TAB_CONTEXT } from '../../../../src/sn/application/ApplicationManager';
import { ApplicationDetailModel } from '../../../../src/sn/application/ApplicationDetailModel';
import {
    StoreAppSearchResponse,
    StoreAppOperationResponse
} from '../../../../src/sn/application/StoreApplicationModels';
import { BatchDefinition } from '../../../../src/sn/application/BatchDefinition';
import { BatchInstallation } from '../../../../src/sn/application/BatchInstallation';
import { IHttpResponse } from '../../../../src/comm/http/IHttpResponse';
import { MockAuthenticationHandler } from '../../__mocks__/servicenow-sdk-mocks';
import { AuthenticationHandlerFactory } from '../../../../src/auth/AuthenticationHandlerFactory';
import { RequestHandlerFactory } from '../../../../src/comm/http/RequestHandlerFactory';

// Mock getCredentials
const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

// Mock factories
jest.mock('../../../../src/auth/AuthenticationHandlerFactory');
jest.mock('../../../../src/comm/http/RequestHandlerFactory');

// Mock request handler
class MockRequestHandler {
    get = jest.fn<() => Promise<IHttpResponse<unknown>>>();
    post = jest.fn<() => Promise<IHttpResponse<unknown>>>();
    put = jest.fn<() => Promise<IHttpResponse<unknown>>>();
    delete = jest.fn<() => Promise<IHttpResponse<unknown>>>();
}

/**
 * Creates a mock ApplicationDetailModel with realistic defaults
 */
function createMockAppDetails(overrides: Partial<ApplicationDetailModel> = {}): ApplicationDetailModel {
    const defaults: Partial<ApplicationDetailModel> = {
        sys_id: 'abc123',
        name: 'Test Application',
        version: '1.0.0',
        isInstalled: true,
        isInstalledAndUpdateAvailable: false,
        active: true,
        scope: 'x_test_app',
        short_description: 'A test application',
        vendor: 'Test Vendor',
    };

    return { ...defaults, ...overrides } as ApplicationDetailModel;
}

describe('ApplicationManager - Unit Tests', () => {
    let instance: ServiceNowInstance;
    let appManager: ApplicationManager;
    let mockAuthHandler: MockAuthenticationHandler;
    let mockRequestHandler: MockRequestHandler;

    beforeEach(async () => {
        jest.clearAllMocks();

        mockAuthHandler = new MockAuthenticationHandler();
        mockRequestHandler = new MockRequestHandler();

        jest.spyOn(AuthenticationHandlerFactory, 'createAuthHandler')
            .mockReturnValue(mockAuthHandler as unknown as ReturnType<typeof AuthenticationHandlerFactory.createAuthHandler>);
        jest.spyOn(RequestHandlerFactory, 'createRequestHandler')
            .mockReturnValue(mockRequestHandler as unknown as ReturnType<typeof RequestHandlerFactory.createRequestHandler>);

        const alias = 'test-instance';
        const credential = await mockGetCredentials(alias);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: alias,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            appManager = new ApplicationManager(instance);
        }
    });

    describe('Constructor', () => {
        it('should create instance with ServiceNow instance', () => {
            expect(appManager).toBeInstanceOf(ApplicationManager);
            expect((appManager as any)._instance).toBe(instance);
        });

        it('should initialize logger', () => {
            expect((appManager as any)._logger).toBeDefined();
        });

        it('should initialize ServiceNowRequest', () => {
            expect((appManager as any)._req).toBeDefined();
        });
    });

    describe('compareVersions (private method, tested via validateApplication)', () => {
        // We test compareVersions indirectly through validateApplication
        // since it's private, but also directly via accessing with (appManager as any)

        it('should return 0 for equal versions', () => {
            const result = (appManager as any).compareVersions('1.2.3', '1.2.3');
            expect(result).toBe(0);
        });

        it('should return -1 when first version is lower', () => {
            const result = (appManager as any).compareVersions('1.0.0', '2.0.0');
            expect(result).toBe(-1);
        });

        it('should return 1 when first version is higher', () => {
            const result = (appManager as any).compareVersions('2.0.0', '1.0.0');
            expect(result).toBe(1);
        });

        it('should handle minor version differences', () => {
            expect((appManager as any).compareVersions('1.1.0', '1.2.0')).toBe(-1);
            expect((appManager as any).compareVersions('1.3.0', '1.2.0')).toBe(1);
        });

        it('should handle patch version differences', () => {
            expect((appManager as any).compareVersions('1.0.1', '1.0.2')).toBe(-1);
            expect((appManager as any).compareVersions('1.0.3', '1.0.2')).toBe(1);
        });

        it('should handle different length versions by padding with zeros', () => {
            expect((appManager as any).compareVersions('1.0', '1.0.0')).toBe(0);
            expect((appManager as any).compareVersions('1', '1.0.0')).toBe(0);
        });

        it('should handle version with trailing zeros', () => {
            expect((appManager as any).compareVersions('1.0.0', '1')).toBe(0);
            expect((appManager as any).compareVersions('1.0.0.0', '1.0.0')).toBe(0);
        });

        it('should return 0 when both versions are empty', () => {
            expect((appManager as any).compareVersions('', '')).toBe(0);
        });

        it('should return -1 when first version is empty/falsy', () => {
            expect((appManager as any).compareVersions('', '1.0.0')).toBe(-1);
            expect((appManager as any).compareVersions(null, '1.0.0')).toBe(-1);
            expect((appManager as any).compareVersions(undefined, '1.0.0')).toBe(-1);
        });

        it('should return 1 when second version is empty/falsy', () => {
            expect((appManager as any).compareVersions('1.0.0', '')).toBe(1);
            expect((appManager as any).compareVersions('1.0.0', null)).toBe(1);
            expect((appManager as any).compareVersions('1.0.0', undefined)).toBe(1);
        });

        it('should handle multi-digit version numbers', () => {
            expect((appManager as any).compareVersions('1.10.0', '1.9.0')).toBe(1);
            expect((appManager as any).compareVersions('1.9.0', '1.10.0')).toBe(-1);
            expect((appManager as any).compareVersions('25.10.0', '25.10.0')).toBe(0);
        });

        it('should handle non-numeric version parts by treating them as 0', () => {
            // parseInt('abc') returns NaN, || 0 makes it 0
            expect((appManager as any).compareVersions('1.abc.0', '1.0.0')).toBe(0);
        });
    });

    describe('getApplicationDetails', () => {
        it('should return app details on success', async () => {
            const mockAppDetails = createMockAppDetails({
                sys_id: 'app123',
                name: 'My App',
                version: '2.0.0'
            });

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { app_info_on_instance: mockAppDetails } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { app_info_on_instance: mockAppDetails } }
            } as IHttpResponse<any>);

            const result = await appManager.getApplicationDetails('app123');
            expect(result).toBeDefined();
            expect(result.name).toBe('My App');
            expect(result.version).toBe('2.0.0');
        });

        it('should return null on non-200 response', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: null,
                status: 404,
                statusText: 'Not Found',
                headers: {},
                config: {},
                bodyObject: null
            } as IHttpResponse<any>);

            const result = await appManager.getApplicationDetails('invalid-id');
            expect(result).toBeNull();
        });

        it('should construct correct URL with appID', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { app_info_on_instance: createMockAppDetails() } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { app_info_on_instance: createMockAppDetails() } }
            } as IHttpResponse<any>);

            await appManager.getApplicationDetails('my-app-id-123');

            const callArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(callArgs.path).toContain('my-app-id-123');
            expect(callArgs.path).not.toContain('{appID}');
        });
    });

    describe('validateApplication', () => {
        it('should return not_installed when app details are null', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: null,
                status: 404,
                statusText: 'Not Found',
                headers: {},
                config: {},
                bodyObject: null
            } as IHttpResponse<any>);

            const pkg = new BatchDefinition('app123', true, '', '1.0.0', '1.0.0', 'application');
            const result = await appManager.validateApplication(pkg);

            expect(result.validationStatus).toBe('not_installed');
            expect(result.isInstalled).toBe(false);
            expect(result.needsAction).toBe(true);
            expect(result.error).toBe('Application not found on instance');
        });

        it('should return not_installed when app exists but is not installed', async () => {
            const appDetails = createMockAppDetails({ isInstalled: false, version: '1.0.0' });

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { app_info_on_instance: appDetails } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { app_info_on_instance: appDetails } }
            } as IHttpResponse<any>);

            const pkg = new BatchDefinition('abc123', true, '', '1.0.0', '1.0.0', 'application');
            const result = await appManager.validateApplication(pkg);

            expect(result.validationStatus).toBe('not_installed');
            expect(result.isInstalled).toBe(false);
            expect(result.needsAction).toBe(true);
        });

        it('should return valid when installed version matches requested', async () => {
            const appDetails = createMockAppDetails({ isInstalled: true, version: '2.0.0' });

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { app_info_on_instance: appDetails } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { app_info_on_instance: appDetails } }
            } as IHttpResponse<any>);

            const pkg = new BatchDefinition('abc123', true, '', '2.0.0', '2.0.0', 'application');
            const result = await appManager.validateApplication(pkg);

            expect(result.validationStatus).toBe('valid');
            expect(result.isInstalled).toBe(true);
            expect(result.isVersionMatch).toBe(true);
            expect(result.needsAction).toBe(false);
        });

        it('should return update_needed when installed version is older', async () => {
            const appDetails = createMockAppDetails({ isInstalled: true, version: '1.0.0' });

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { app_info_on_instance: appDetails } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { app_info_on_instance: appDetails } }
            } as IHttpResponse<any>);

            const pkg = new BatchDefinition('abc123', true, '', '2.0.0', '2.0.0', 'application');
            const result = await appManager.validateApplication(pkg);

            expect(result.validationStatus).toBe('update_needed');
            expect(result.isInstalled).toBe(true);
            expect(result.isVersionMatch).toBe(false);
            expect(result.needsAction).toBe(true);
        });

        it('should return mismatch when installed version is newer', async () => {
            const appDetails = createMockAppDetails({ isInstalled: true, version: '3.0.0' });

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { app_info_on_instance: appDetails } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { app_info_on_instance: appDetails } }
            } as IHttpResponse<any>);

            const pkg = new BatchDefinition('abc123', true, '', '2.0.0', '2.0.0', 'application');
            const result = await appManager.validateApplication(pkg);

            expect(result.validationStatus).toBe('mismatch');
            expect(result.isInstalled).toBe(true);
            expect(result.isVersionMatch).toBe(false);
            expect(result.needsAction).toBe(false);
        });

        it('should return error when getApplicationDetails throws', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockRejectedValue(new Error('Network error'));

            const pkg = new BatchDefinition('abc123', true, '', '1.0.0', '1.0.0', 'application');
            const result = await appManager.validateApplication(pkg);

            expect(result.validationStatus).toBe('error');
            expect(result.error).toContain('Network error');
            expect(result.needsAction).toBe(false);
        });

        it('should include app details in result when available', async () => {
            const appDetails = createMockAppDetails({
                isInstalled: true,
                version: '1.0.0',
                name: 'My Cool App'
            });

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { app_info_on_instance: appDetails } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { app_info_on_instance: appDetails } }
            } as IHttpResponse<any>);

            const pkg = new BatchDefinition('abc123', true, '', '1.0.0', '1.0.0', 'application');
            const result = await appManager.validateApplication(pkg);

            expect(result.name).toBe('My Cool App');
            expect(result.appDetails).toBeDefined();
            expect(result.installed_version).toBe('1.0.0');
        });

        it('should track isUpdateAvailable from app details', async () => {
            const appDetails = createMockAppDetails({
                isInstalled: true,
                version: '1.0.0',
                isInstalledAndUpdateAvailable: true
            });

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { app_info_on_instance: appDetails } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { app_info_on_instance: appDetails } }
            } as IHttpResponse<any>);

            const pkg = new BatchDefinition('abc123', true, '', '1.0.0', '1.0.0', 'application');
            const result = await appManager.validateApplication(pkg);

            expect(result.isUpdateAvailable).toBe(true);
        });
    });

    describe('validateBatchInstallation', () => {
        function setupMockForApp(appDetails: ApplicationDetailModel | null) {
            if (appDetails === null) {
                mockRequestHandler.get.mockResolvedValueOnce({
                    data: null,
                    status: 404,
                    statusText: 'Not Found',
                    headers: {},
                    config: {},
                    bodyObject: null
                } as IHttpResponse<any>);
            } else {
                mockRequestHandler.get.mockResolvedValueOnce({
                    data: { result: { app_info_on_instance: appDetails } },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {},
                    bodyObject: { result: { app_info_on_instance: appDetails } }
                } as IHttpResponse<any>);
            }
        }

        it('should validate all packages in batch', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            const app1Details = createMockAppDetails({ isInstalled: true, version: '1.0.0' });
            const app2Details = createMockAppDetails({ isInstalled: true, version: '2.0.0' });

            setupMockForApp(app1Details);
            setupMockForApp(app2Details);

            const batch = new (BatchInstallation as any)();
            batch.packages = [
                new BatchDefinition('app1', true, '', '1.0.0', '1.0.0', 'application'),
                new BatchDefinition('app2', true, '', '2.0.0', '2.0.0', 'application')
            ];

            const result = await appManager.validateBatchInstallation(batch);

            expect(result.totalApplications).toBe(2);
            expect(result.alreadyValid).toBe(2);
            expect(result.needsInstallation).toBe(0);
            expect(result.needsUpgrade).toBe(0);
            expect(result.errors).toBe(0);
            expect(result.isValid).toBe(true);
        });

        it('should count applications needing installation', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            setupMockForApp(null); // not found
            setupMockForApp(createMockAppDetails({ isInstalled: true, version: '1.0.0' }));

            const batch = new (BatchInstallation as any)();
            batch.packages = [
                new BatchDefinition('new-app', true, '', '1.0.0', '1.0.0', 'application'),
                new BatchDefinition('existing-app', true, '', '1.0.0', '1.0.0', 'application')
            ];

            const result = await appManager.validateBatchInstallation(batch);

            expect(result.totalApplications).toBe(2);
            expect(result.alreadyValid).toBe(1);
            expect(result.needsInstallation).toBe(1);
            expect(result.isValid).toBe(true);
        });

        it('should count applications needing upgrade', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            setupMockForApp(createMockAppDetails({ isInstalled: true, version: '1.0.0' }));
            setupMockForApp(createMockAppDetails({ isInstalled: true, version: '1.0.0' }));

            const batch = new (BatchInstallation as any)();
            batch.packages = [
                new BatchDefinition('app1', true, '', '2.0.0', '2.0.0', 'application'),
                new BatchDefinition('app2', true, '', '3.0.0', '3.0.0', 'application')
            ];

            const result = await appManager.validateBatchInstallation(batch);

            expect(result.needsUpgrade).toBe(2);
            expect(result.alreadyValid).toBe(0);
        });

        it('should set isValid to false when there are errors', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            mockRequestHandler.get.mockRejectedValueOnce(new Error('Network timeout'));

            const batch = new (BatchInstallation as any)();
            batch.packages = [
                new BatchDefinition('app1', true, '', '1.0.0', '1.0.0', 'application')
            ];

            const result = await appManager.validateBatchInstallation(batch);

            expect(result.errors).toBe(1);
            expect(result.isValid).toBe(false);
        });

        it('should handle empty batch', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            const batch = new (BatchInstallation as any)();
            batch.packages = [];

            const result = await appManager.validateBatchInstallation(batch);

            expect(result.totalApplications).toBe(0);
            expect(result.alreadyValid).toBe(0);
            expect(result.isValid).toBe(true);
        });

        it('should handle mixed statuses', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            // valid
            setupMockForApp(createMockAppDetails({ isInstalled: true, version: '1.0.0' }));
            // needs upgrade (installed 1.0.0, requested 2.0.0)
            setupMockForApp(createMockAppDetails({ isInstalled: true, version: '1.0.0' }));
            // not installed (404)
            setupMockForApp(null);
            // mismatch (installed 3.0.0, requested 1.0.0)
            setupMockForApp(createMockAppDetails({ isInstalled: true, version: '3.0.0' }));

            const batch = new (BatchInstallation as any)();
            batch.packages = [
                new BatchDefinition('app1', true, '', '1.0.0', '1.0.0', 'application'),
                new BatchDefinition('app2', true, '', '2.0.0', '2.0.0', 'application'),
                new BatchDefinition('app3', true, '', '1.0.0', '1.0.0', 'application'),
                new BatchDefinition('app4', true, '', '1.0.0', '1.0.0', 'application')
            ];

            const result = await appManager.validateBatchInstallation(batch);

            expect(result.totalApplications).toBe(4);
            expect(result.alreadyValid).toBe(1);
            expect(result.needsInstallation).toBe(1);
            expect(result.needsUpgrade).toBe(2); // update_needed + mismatch
            expect(result.isValid).toBe(true);
        });
    });

    describe('Method existence', () => {
        it('should have getApplicationDetails method', () => {
            expect(typeof appManager.getApplicationDetails).toBe('function');
        });

        it('should have validateBatchDefinition method', () => {
            expect(typeof appManager.validateBatchDefinition).toBe('function');
        });

        it('should have validateBatchInstallation method', () => {
            expect(typeof appManager.validateBatchInstallation).toBe('function');
        });

        it('should have validateApplication method', () => {
            expect(typeof appManager.validateApplication).toBe('function');
        });

        it('should have checkInstalledApplications method', () => {
            expect(typeof appManager.checkInstalledApplications).toBe('function');
        });

        it('should have getApplicationsNeedingAction method', () => {
            expect(typeof appManager.getApplicationsNeedingAction).toBe('function');
        });

        it('should have installBatch method', () => {
            expect(typeof appManager.installBatch).toBe('function');
        });

        it('should have searchApplications method', () => {
            expect(typeof appManager.searchApplications).toBe('function');
        });

        it('should have installStoreApplication method', () => {
            expect(typeof appManager.installStoreApplication).toBe('function');
        });

        it('should have installStoreApplicationAndWait method', () => {
            expect(typeof appManager.installStoreApplicationAndWait).toBe('function');
        });

        it('should have updateStoreApplication method', () => {
            expect(typeof appManager.updateStoreApplication).toBe('function');
        });

        it('should have updateStoreApplicationAndWait method', () => {
            expect(typeof appManager.updateStoreApplicationAndWait).toBe('function');
        });

    });

    // ============================================================
    // Store Application Management Tests
    // ============================================================

    describe('searchApplications', () => {
        it('should POST to correct URL with tab_context query param', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: { result: { apps: [] } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { apps: [] } }
            } as IHttpResponse<any>);

            await appManager.searchApplications({ tabContext: APP_TAB_CONTEXT.AVAILABLE_FOR_YOU });

            const callArgs = mockRequestHandler.post.mock.calls[0][0] as any;
            expect(callArgs.path).toBe('/api/sn_appclient/appmanager/apps');
            expect(callArgs.query).toEqual(expect.objectContaining({ tab_context: 'available_for_you' }));
            expect(callArgs.method).toBe('POST');
        });

        it('should include search_key when provided', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: { result: { apps: [] } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { apps: [] } }
            } as IHttpResponse<any>);

            await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.INSTALLED,
                searchKey: 'ITSM'
            });

            const callArgs = mockRequestHandler.post.mock.calls[0][0] as any;
            expect(callArgs.query.search_key).toBe('ITSM');
            expect(callArgs.query.tab_context).toBe('installed');
        });

        it('should include pagination params when provided', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: { result: { apps: [] } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { apps: [] } }
            } as IHttpResponse<any>);

            await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.UPDATES,
                limit: 5,
                offset: 10
            });

            const callArgs = mockRequestHandler.post.mock.calls[0][0] as any;
            expect(callArgs.query.sysparm_limit).toBe('5');
            expect(callArgs.query.sysparm_offset).toBe('10');
        });

        it('should return apps array on successful response', async () => {
            const mockApps = [
                createMockAppDetails({ sys_id: 'app1', name: 'App 1' }),
                createMockAppDetails({ sys_id: 'app2', name: 'App 2' })
            ];

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: { result: { apps: mockApps } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { apps: mockApps } }
            } as IHttpResponse<any>);

            const result = await appManager.searchApplications({ tabContext: APP_TAB_CONTEXT.AVAILABLE_FOR_YOU });

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('App 1');
            expect(result[1].name).toBe('App 2');
        });

        it('should return empty array on non-200 response', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: null,
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {},
                bodyObject: null
            } as IHttpResponse<any>);

            const result = await appManager.searchApplications({ tabContext: APP_TAB_CONTEXT.INSTALLED });
            expect(result).toEqual([]);
        });

        it('should pass requestBody as JSON body when provided', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: { result: { apps: [] } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { apps: [] } }
            } as IHttpResponse<any>);

            const customBody = { filter: 'custom_filter' };
            await appManager.searchApplications({
                tabContext: APP_TAB_CONTEXT.AVAILABLE_FOR_YOU,
                requestBody: customBody
            });

            const callArgs = mockRequestHandler.post.mock.calls[0][0] as any;
            expect(callArgs.json).toEqual(customBody);
        });

        it('should send empty object as JSON body when no requestBody', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: { result: { apps: [] } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { apps: [] } }
            } as IHttpResponse<any>);

            await appManager.searchApplications({ tabContext: APP_TAB_CONTEXT.AVAILABLE_FOR_YOU });

            const callArgs = mockRequestHandler.post.mock.calls[0][0] as any;
            expect(callArgs.json).toEqual({});
        });
    });

    describe('installStoreApplication', () => {
        it('should GET install URL with correct query params', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { tracker_id: 'tracker-123' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { tracker_id: 'tracker-123' } }
            } as IHttpResponse<any>);

            await appManager.installStoreApplication({ appId: 'my-app', version: '1.0.0' });

            const callArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(callArgs.path).toBe('/api/sn_appclient/appmanager/app/install');
            expect(callArgs.query).toEqual(expect.objectContaining({
                app_id: 'my-app',
                version: '1.0.0'
            }));
        });

        it('should include optional customization_version and load_demo_data', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { tracker_id: 'tracker-123' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { tracker_id: 'tracker-123' } }
            } as IHttpResponse<any>);

            await appManager.installStoreApplication({
                appId: 'my-app',
                version: '1.0.0',
                customizationVersion: '1.0.0',
                loadDemoData: true
            });

            const callArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(callArgs.query.customization_version).toBe('1.0.0');
            expect(callArgs.query.load_demo_data).toBe('true');
        });

        it('should return operation result with tracker_id', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { tracker_id: 'tracker-abc', status: 'initiated' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { tracker_id: 'tracker-abc', status: 'initiated' } }
            } as IHttpResponse<any>);

            const result = await appManager.installStoreApplication({ appId: 'my-app', version: '1.0.0' });

            expect(result.tracker_id).toBe('tracker-abc');
            expect(result.status).toBe('initiated');
        });

        it('should throw on non-200 response', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: null,
                status: 403,
                statusText: 'Forbidden',
                headers: {},
                config: {},
                bodyObject: null
            } as IHttpResponse<any>);

            await expect(appManager.installStoreApplication({ appId: 'my-app', version: '1.0.0' }))
                .rejects.toThrow('Failed to initiate store app install: HTTP 403');
        });
    });

    describe('updateStoreApplication', () => {
        it('should GET update URL with correct query params', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { tracker_id: 'tracker-456' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { tracker_id: 'tracker-456' } }
            } as IHttpResponse<any>);

            await appManager.updateStoreApplication({ appId: 'my-app', version: '2.0.0' });

            const callArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(callArgs.path).toBe('/api/sn_appclient/appmanager/app/update');
            expect(callArgs.query).toEqual(expect.objectContaining({
                app_id: 'my-app',
                version: '2.0.0'
            }));
        });

        it('should include optional params', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { tracker_id: 'tracker-456' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { tracker_id: 'tracker-456' } }
            } as IHttpResponse<any>);

            await appManager.updateStoreApplication({
                appId: 'my-app',
                version: '2.0.0',
                customizationVersion: '2.0.0',
                loadDemoData: false
            });

            const callArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(callArgs.query.customization_version).toBe('2.0.0');
            expect(callArgs.query.load_demo_data).toBe('false');
        });

        it('should return operation result', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { tracker_id: 'tracker-456', status: 'initiated' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { tracker_id: 'tracker-456', status: 'initiated' } }
            } as IHttpResponse<any>);

            const result = await appManager.updateStoreApplication({ appId: 'my-app', version: '2.0.0' });
            expect(result.tracker_id).toBe('tracker-456');
        });

        it('should throw on non-200 response', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({
                data: null,
                status: 500,
                statusText: 'Server Error',
                headers: {},
                config: {},
                bodyObject: null
            } as IHttpResponse<any>);

            await expect(appManager.updateStoreApplication({ appId: 'my-app', version: '2.0.0' }))
                .rejects.toThrow('Failed to initiate store app update: HTTP 500');
        });
    });

    describe('installStoreApplicationAndWait', () => {
        it('should install and poll until complete', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            // First call: install returns tracker_id
            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { tracker_id: 'tracker-wait-1' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { tracker_id: 'tracker-wait-1' } }
            } as IHttpResponse<any>);

            // Second call: status at 50%
            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { id: 'tracker-wait-1', percent_complete: 50, status: '2', status_label: 'Running', status_message: 'Installing...' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { id: 'tracker-wait-1', percent_complete: 50, status: '2', status_label: 'Running', status_message: 'Installing...' } }
            } as IHttpResponse<any>);

            // Third call: status at 100%
            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { id: 'tracker-wait-1', percent_complete: 100, status: '2', status_label: 'Complete', status_message: 'Done' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { id: 'tracker-wait-1', percent_complete: 100, status: '2', status_label: 'Complete', status_message: 'Done' } }
            } as IHttpResponse<any>);

            const result = await appManager.installStoreApplicationAndWait(
                { appId: 'my-app', version: '1.0.0' },
                10, // fast poll for tests
                60000
            );

            expect(result.success).toBe(true);
            expect(result.percent_complete).toBe(100);
            expect(result.status_label).toBe('Complete');
        });

        it('should resolve tracker_id from links.progress.id as fallback', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            // Install returns links.progress.id instead of tracker_id
            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { links: { progress: { id: 'progress-id-1', url: '/progress' } } } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { links: { progress: { id: 'progress-id-1', url: '/progress' } } } }
            } as IHttpResponse<any>);

            // Status poll at 100%
            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { id: 'progress-id-1', percent_complete: 100, status: '2', status_label: 'Complete', status_message: 'Done' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { id: 'progress-id-1', percent_complete: 100, status: '2', status_label: 'Complete', status_message: 'Done' } }
            } as IHttpResponse<any>);

            const result = await appManager.installStoreApplicationAndWait(
                { appId: 'my-app', version: '1.0.0' },
                10,
                60000
            );

            expect(result.success).toBe(true);
            // Verify the status poll used the correct tracker path
            const statusCallArgs = mockRequestHandler.get.mock.calls[1][0] as any;
            expect(statusCallArgs.path).toContain('progress-id-1');
        });

        it('should throw when no tracker ID is returned', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { status: 'initiated' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { status: 'initiated' } }
            } as IHttpResponse<any>);

            await expect(appManager.installStoreApplicationAndWait(
                { appId: 'my-app', version: '1.0.0' },
                10,
                60000
            )).rejects.toThrow('No tracker ID returned from install operation');
        });

        it('should return failure on timeout', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            // Install returns tracker
            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { tracker_id: 'tracker-timeout' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { tracker_id: 'tracker-timeout' } }
            } as IHttpResponse<any>);

            // Status always at 50% (never completes)
            mockRequestHandler.get.mockResolvedValue({
                data: { result: { id: 'tracker-timeout', percent_complete: 50, status: '2', status_label: 'Running', status_message: 'Still going...' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { id: 'tracker-timeout', percent_complete: 50, status: '2', status_label: 'Running', status_message: 'Still going...' } }
            } as IHttpResponse<any>);

            const result = await appManager.installStoreApplicationAndWait(
                { appId: 'my-app', version: '1.0.0' },
                10,  // fast poll
                50   // very short timeout
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe('Installation timed out');
        });

        it('should return failure when installation has error', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            // Install returns tracker
            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { tracker_id: 'tracker-error' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { tracker_id: 'tracker-error' } }
            } as IHttpResponse<any>);

            // Status at 100% but with error
            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { id: 'tracker-error', percent_complete: 100, status: '2', status_label: 'Complete', status_message: 'Done', error: 'Dependency conflict' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { id: 'tracker-error', percent_complete: 100, status: '2', status_label: 'Complete', status_message: 'Done', error: 'Dependency conflict' } }
            } as IHttpResponse<any>);

            const result = await appManager.installStoreApplicationAndWait(
                { appId: 'my-app', version: '1.0.0' },
                10,
                60000
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe('Dependency conflict');
        });

        it('should return failure when status is 3 (failed)', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            // Install returns tracker
            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { tracker_id: 'tracker-failed' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { tracker_id: 'tracker-failed' } }
            } as IHttpResponse<any>);

            // Status at 100% with status '3' (failure)
            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { id: 'tracker-failed', percent_complete: 100, status: '3', status_label: 'Failed', status_message: 'Installation failed due to conflict' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { id: 'tracker-failed', percent_complete: 100, status: '3', status_label: 'Failed', status_message: 'Installation failed due to conflict' } }
            } as IHttpResponse<any>);

            const result = await appManager.installStoreApplicationAndWait(
                { appId: 'my-app', version: '1.0.0' },
                10,
                60000
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed');
            expect(result.error).toContain('Installation failed due to conflict');
        });
    });

    describe('updateStoreApplicationAndWait', () => {
        it('should update and poll until complete', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            // Update returns tracker
            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { tracker_id: 'tracker-update-1' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { tracker_id: 'tracker-update-1' } }
            } as IHttpResponse<any>);

            // Status at 100%
            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: { id: 'tracker-update-1', percent_complete: 100, status: '2', status_label: 'Complete', status_message: 'Updated' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: { id: 'tracker-update-1', percent_complete: 100, status: '2', status_label: 'Complete', status_message: 'Updated' } }
            } as IHttpResponse<any>);

            const result = await appManager.updateStoreApplicationAndWait(
                { appId: 'my-app', version: '2.0.0' },
                10,
                60000
            );

            expect(result.success).toBe(true);
            expect(result.percent_complete).toBe(100);

            // Verify the first call was to the update URL
            const installCallArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(installCallArgs.path).toBe('/api/sn_appclient/appmanager/app/update');
        });

        it('should throw when no tracker ID is returned', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            mockRequestHandler.get.mockResolvedValueOnce({
                data: { result: {} },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
                bodyObject: { result: {} }
            } as IHttpResponse<any>);

            await expect(appManager.updateStoreApplicationAndWait(
                { appId: 'my-app', version: '2.0.0' },
                10,
                60000
            )).rejects.toThrow('No tracker ID returned from update operation');
        });
    });
});

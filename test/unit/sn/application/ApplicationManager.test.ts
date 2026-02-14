/**
 * Unit tests for ApplicationManager
 * Tests compareVersions, validateApplication, validateBatchInstallation, getApplicationDetails
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { createGetCredentialsMock } from '../../__mocks__/servicenow-sdk-mocks';
import { ApplicationManager } from '../../../../src/sn/application/ApplicationManager';
import { ApplicationDetailModel } from '../../../../src/sn/application/ApplicationDetailModel';
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
    });
});

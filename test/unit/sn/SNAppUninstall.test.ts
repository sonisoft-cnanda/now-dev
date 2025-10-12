/**
 * Unit tests for Application Uninstall functionality
 * Uses mocks instead of real credentials
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../src/sn/ServiceNowInstance';
import { createGetCredentialsMock, createGetSafeUserSessionMock } from '../__mocks__/servicenow-sdk-mocks';
import { Application } from '../../../src/sn/Application';

// Mock getCredentials and getSafeUserSession
const mockGetCredentials = createGetCredentialsMock();
const mockGetSafeUserSession = createGetSafeUserSessionMock();

jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

jest.mock('@servicenow/sdk-cli-core/dist/util/sessionToken.js', () => ({
    getSafeUserSession: mockGetSafeUserSession
}));

// Mock SDK utilities
jest.mock('@servicenow/sdk-cli-core/dist/util/index.js', () => ({
    parseXml: jest.fn(),
    getScopeMetadataFromInstance: jest.fn(),
    getNowTableRequest: jest.fn(),
    monitorUninstallWorkerCompletion: jest.fn(),
    getAppAndSummary: jest.fn()
}));

jest.mock('@servicenow/sdk-cli-core/dist/http/index.js', () => ({
    makeRequest: jest.fn(),
    parseResponseBody: jest.fn()
}));

describe('SNAppUninstall - Unit Tests', () => {
    let instance: ServiceNowInstance;
    const TEST_SCOPE = 'x_test_app';
    const TEST_APP_ID = 'test-app-id-123';

    beforeEach(async () => {
        jest.clearAllMocks();
        
        const alias:string = 'test-instance';
        const credential = await mockGetCredentials(alias);
        
        if(credential){
            const snSettings:ServiceNowSettingsInstance = {
                alias: alias,
                credential: credential
            }
            instance = new ServiceNowInstance(snSettings);
        }
    });

    describe('Application changeApplication', () => {
        it('should create Application instance', () => {
            const app = new Application(instance, TEST_SCOPE, TEST_APP_ID);
            expect(app).toBeInstanceOf(Application);
        });

        it('should have changeApplication method', () => {
            const app = new Application(instance, TEST_SCOPE, TEST_APP_ID);
            expect(typeof app.changeApplication).toBe('function');
        });
    });

    describe('Application scope handling', () => {
        it('should handle global scope', () => {
            const app = new Application(instance, 'global', TEST_APP_ID);
            expect((app as any)._scope).toBe('global');
        });

        it('should handle custom scope', () => {
            const app = new Application(instance, 'x_custom_app', TEST_APP_ID);
            expect((app as any)._scope).toBe('x_custom_app');
        });
    });

    // Note: Actual uninstall operations are in integration tests
    // These unit tests focus on initialization and structure
});

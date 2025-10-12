/**
 * Unit tests for Application class
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

// Mock other SDK utilities
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

describe('Application - Unit Tests', () => {
    let instance: ServiceNowInstance;
    let application: Application;
    const TEST_SCOPE = 'x_test_app';
    const TEST_APP_ID = 'test-app-sys-id-123';
    
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
            application = new Application(instance, TEST_SCOPE, TEST_APP_ID);
        }
    });

    describe('Constructor', () => {
        it('should create instance with scope and app ID', () => {
            expect(application).toBeInstanceOf(Application);
            expect((application as any)._scope).toBe(TEST_SCOPE);
            expect((application as any)._applicationId).toBe(TEST_APP_ID);
        });

        it('should initialize ServiceNowRequest', () => {
            expect((application as any).snRequest).toBeDefined();
        });

        it('should initialize logger', () => {
            expect((application as any)._logger).toBeDefined();
        });

        it('should store instance reference', () => {
            expect((application as any).instance).toBe(instance);
        });
    });

    describe('Properties', () => {
        it('should have scope property', () => {
            expect((application as any)._scope).toBe(TEST_SCOPE);
        });

        it('should have applicationId property', () => {
            expect((application as any)._applicationId).toBe(TEST_APP_ID);
        });

        it('should accept different scopes', () => {
            const app1 = new Application(instance, 'global', 'app1');
            const app2 = new Application(instance, 'x_custom', 'app2');
            
            expect((app1 as any)._scope).toBe('global');
            expect((app2 as any)._scope).toBe('x_custom');
        });
    });

    describe('Method existence', () => {
        it('should have changeApplication method', () => {
            expect(typeof application.changeApplication).toBe('function');
        });

        it('should have convertToStoreApp method', () => {
            expect(typeof application.convertToStoreApp).toBe('function');
        });
    });

    // Note: Actual API interaction tests are in integration tests
    // These unit tests focus on initialization and structure
});

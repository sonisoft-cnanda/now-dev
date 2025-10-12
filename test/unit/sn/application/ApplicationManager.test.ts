/**
 * Unit tests for ApplicationManager
 * Uses mocks instead of real credentials
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { createGetCredentialsMock } from '../../__mocks__/servicenow-sdk-mocks';
import { ApplicationManager } from '../../../../src/sn/application/ApplicationManager';

// Mock getCredentials
const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

describe('ApplicationManager - Unit Tests', () => {
    let instance: ServiceNowInstance;
    let appManager: ApplicationManager;

    beforeEach(async () => {
        jest.clearAllMocks();
       
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

    // Note: Actual application management tests are in integration tests
    // These unit tests focus on initialization and structure
});

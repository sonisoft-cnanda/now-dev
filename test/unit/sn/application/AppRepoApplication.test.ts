/**
 * Unit tests for AppRepoApplication
 * Uses mocks instead of real credentials
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { createGetCredentialsMock } from '../../__mocks__/servicenow-sdk-mocks';
import { AppRepoApplication } from '../../../../src/sn/application/AppRepoApplication';

// Mock getCredentials
const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

describe('AppRepoApplication - Unit Tests', () => {
    let instance: ServiceNowInstance;
    let appRepo: AppRepoApplication;

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
            appRepo = new AppRepoApplication(instance);
        }
    });

    describe('Constructor', () => {
        it('should create instance with ServiceNow instance', () => {
            expect(appRepo).toBeInstanceOf(AppRepoApplication);
            expect((appRepo as any)._instance).toBe(instance);
        });

        it('should initialize ServiceNowRequest', () => {
            expect((appRepo as any)._req).toBeDefined();
        });

        it('should initialize logger', () => {
            expect((appRepo as any)._logger).toBeDefined();
        });
    });

    describe('Method existence', () => {
        it('should have installFromAppRepo method', () => {
            expect(typeof appRepo.installFromAppRepo).toBe('function');
        });

        it('should have installFromAppRepoAndWait method', () => {
            expect(typeof appRepo.installFromAppRepoAndWait).toBe('function');
        });

        it('should have publishToAppRepo method', () => {
            expect(typeof appRepo.publishToAppRepo).toBe('function');
        });

        it('should have publishToAppRepoAndWait method', () => {
            expect(typeof appRepo.publishToAppRepoAndWait).toBe('function');
        });

        it('should have getProgress method', () => {
            expect(typeof appRepo.getProgress).toBe('function');
        });
    });

    // Note: Actual app repository operations are in integration tests
    // These unit tests focus on initialization and structure
});

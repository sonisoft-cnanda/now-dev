/**
 * Unit tests for CompanyApplications
 * Uses mocks instead of real credentials
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { createGetCredentialsMock } from '../../__mocks__/servicenow-sdk-mocks';
import { CompanyApplications } from '../../../../src/sn/application/CompanyApplications';

// Mock getCredentials
const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

describe('CompanyApplications - Unit Tests', () => {
    let instance: ServiceNowInstance;
    let companyApps: CompanyApplications;

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
            companyApps = new CompanyApplications(instance);
        }
    });

    describe('Constructor', () => {
        it('should create instance with ServiceNow instance', () => {
            expect(companyApps).toBeInstanceOf(CompanyApplications);
            expect((companyApps as any)._instance).toBe(instance);
        });

        it('should initialize ServiceNowRequest', () => {
            expect((companyApps as any)._req).toBeDefined();
        });

        it('should initialize logger', () => {
            expect((companyApps as any)._logger).toBeDefined();
        });
    });

    describe('Method existence', () => {
        it('should have getCompanyApplications method', () => {
            expect(typeof companyApps.getCompanyApplications).toBe('function');
        });
    });

    // Note: Actual company application queries are in integration tests
    // These unit tests focus on initialization and structure
});


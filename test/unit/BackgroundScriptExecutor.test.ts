/**
 * Unit tests for BackgroundScriptExecutor
 * Uses mocks instead of real credentials
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../src/sn/ServiceNowInstance';
import { BackgroundScriptExecutor } from '../../src/sn/BackgroundScriptExecutor';
import { createGetCredentialsMock } from './__mocks__/servicenow-sdk-mocks';

// Mock getCredentials
const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

describe('BackgroundScriptExecutor - Unit Tests', () => {
    let instance: ServiceNowInstance;
    let executor: BackgroundScriptExecutor;
    const TEST_SCOPE = 'global';
    
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
            executor = new BackgroundScriptExecutor(instance, TEST_SCOPE);
        }
    });

    describe('Constructor', () => {
        it('should create instance with ServiceNow instance and scope', () => {
            expect(executor).toBeInstanceOf(BackgroundScriptExecutor);
            expect((executor as any).instance).toBe(instance);
            expect((executor as any).scope).toBe(TEST_SCOPE);
        });

        it('should initialize with global scope by default', () => {
            const exec = new BackgroundScriptExecutor(instance, 'global');
            expect((exec as any).scope).toBe('global');
        });

        it('should accept custom scope', () => {
            const customScope = 'x_custom_app';
            const exec = new BackgroundScriptExecutor(instance, customScope);
            expect((exec as any).scope).toBe(customScope);
        });

        it('should initialize ServiceNowRequest', () => {
            expect((executor as any).snRequest).toBeDefined();
        });
    });

    describe('Instance properties', () => {
        it('should maintain instance reference', () => {
            expect((executor as any).instance).toBe(instance);
        });

        it('should maintain scope reference', () => {
            expect((executor as any).scope).toBe(TEST_SCOPE);
        });

        it('should have logger', () => {
            expect((executor as any)._logger).toBeDefined();
        });
    });

    describe('Method existence', () => {
        it('should have executeScript method', () => {
            expect(typeof executor.executeScript).toBe('function');
        });

        it('should have getBackgroundScriptCSRFToken method', () => {
            expect(typeof executor.getBackgroundScriptCSRFToken).toBe('function');
        });
    });

    describe('Scope handling', () => {
        it('should handle global scope', () => {
            const globalExec = new BackgroundScriptExecutor(instance, 'global');
            expect((globalExec as any).scope).toBe('global');
        });

        it('should handle custom app scope', () => {
            const appExec = new BackgroundScriptExecutor(instance, 'x_my_app');
            expect((appExec as any).scope).toBe('x_my_app');
        });

        it('should allow scope changes via new instance', () => {
            const exec1 = new BackgroundScriptExecutor(instance, 'global');
            const exec2 = new BackgroundScriptExecutor(instance, 'x_app');
            
            expect((exec1 as any).scope).toBe('global');
            expect((exec2 as any).scope).toBe('x_app');
        });
    });

    // Note: Actual script execution tests are in integration tests
    // These unit tests focus on initialization and configuration
});

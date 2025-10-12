/**
 * Unit tests for NowSDKAuthenticationHandler
 * Tests structure and basic functionality
 * Note: Full authentication flow tests are in integration tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NowSDKAuthenticationHandler } from '../../../src/auth/NowSDKAuthenticationHandler';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../src/sn/ServiceNowInstance';
import { IRequestHandler } from '../../../src/comm/http/IRequestHandler';

describe("NowSDKAuthenticationHandler - Unit Tests", () => {
    let authHandler: NowSDKAuthenticationHandler;
    let mockInstance: ServiceNowInstance;

    beforeEach(() => {
        // Create a minimal mock instance
        const snSettings: ServiceNowSettingsInstance = {
            alias: 'test-instance',
            host: 'test.service-now.com',
            username: 'test.user',
            password: 'test-password',
            credential: {
                host: 'test.service-now.com',
                username: 'test.user',
                password: 'test-password',
                instanceUrl: 'https://test.service-now.com'
            }
        };
        mockInstance = new ServiceNowInstance(snSettings);
        
        // Create auth handler
        authHandler = new NowSDKAuthenticationHandler(mockInstance);
    });

    it("should create instance with ServiceNow instance", () => {
        expect(authHandler).toBeInstanceOf(NowSDKAuthenticationHandler);
    });

    it("should initially not be logged in", () => {
        expect(authHandler.isLoggedIn()).toBe(false);
    });

    it("setLoggedIn should update login state", () => {
        expect(authHandler.isLoggedIn()).toBe(false);
        
        authHandler.setLoggedIn(true);
        expect(authHandler.isLoggedIn()).toBe(true);
        
        authHandler.setLoggedIn(false);
        expect(authHandler.isLoggedIn()).toBe(false);
    });

    it("should have request handler getter/setter", () => {
        const mockRequestHandler = { 
            setSession: () => {},
            get: () => Promise.resolve({} as any),
            post: () => Promise.resolve({} as any),
            put: () => Promise.resolve({} as any),
            delete: () => Promise.resolve({} as any)
        };
        
        authHandler.setRequestHandler(mockRequestHandler as IRequestHandler);
        const retrievedHandler = authHandler.getRequestHandler();
        
        expect(retrievedHandler).toBe(mockRequestHandler);
    });

    it("should store instance reference", () => {
        expect((authHandler as any)._instance).toBe(mockInstance);
    });

    it("should have logger", () => {
        expect((authHandler as any)._logger).toBeDefined();
    });

    it("should have isLoggedIn method", () => {
        expect(typeof authHandler.isLoggedIn).toBe('function');
    });

    it("should have getSession method", () => {
        expect(typeof authHandler.getSession).toBe('function');
    });

    it("should have doLogin method", () => {
        expect(typeof authHandler.doLogin).toBe('function');
    });

    it("should have getToken method", () => {
        expect(typeof authHandler.getToken).toBe('function');
    });

    it("should have getCookies method", () => {
        expect(typeof authHandler.getCookies).toBe('function');
    });

    // Note: Actual authentication flow tests (doLogin, getToken, getCookies)
    // are in integration tests as they require real getSafeUserSession behavior
});

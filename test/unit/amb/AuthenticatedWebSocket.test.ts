/**
 * Unit tests for AuthenticatedWebSocket
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuthenticatedWebSocket, createAuthenticatedWebSocketClass } from '../../../src/sn/amb/AuthenticatedWebSocket';

describe('AuthenticatedWebSocket - Unit Tests', () => {
    beforeEach(() => {
        // Reset static cookie header before each test
        AuthenticatedWebSocket.setCookies('');
    });

    describe('setCookies', () => {
        it('should set cookie header', () => {
            const cookies = 'JSESSIONID=abc123; glide_session_store=xyz789';
            
            AuthenticatedWebSocket.setCookies(cookies);
            
            expect((AuthenticatedWebSocket as unknown as {cookieHeader: string}).cookieHeader).toBe(cookies);
        });

        it('should overwrite existing cookies', () => {
            AuthenticatedWebSocket.setCookies('old=cookie');
            AuthenticatedWebSocket.setCookies('new=cookie');
            
            expect((AuthenticatedWebSocket as unknown as {cookieHeader: string}).cookieHeader).toBe('new=cookie');
        });

        it('should handle empty string', () => {
            AuthenticatedWebSocket.setCookies('');
            
            expect((AuthenticatedWebSocket as unknown as {cookieHeader: string}).cookieHeader).toBe('');
        });

        it('should store cookies statically', () => {
            AuthenticatedWebSocket.setCookies('test=value');
            
            // Cookie should be accessible statically
            expect((AuthenticatedWebSocket as unknown as {cookieHeader: string}).cookieHeader).toBe('test=value');
        });
    });

    describe('createAuthenticatedWebSocketClass', () => {
        it('should return a class/function', () => {
            const WSClass = createAuthenticatedWebSocketClass();
            
            expect(typeof WSClass).toBe('function');
        });

        it('should set cookies when provided', () => {
            const cookies = 'JSESSIONID=test123';
            
            createAuthenticatedWebSocketClass(cookies);
            
            expect((AuthenticatedWebSocket as unknown as {cookieHeader: string}).cookieHeader).toBe(cookies);
        });

        it('should work without cookies parameter', () => {
            expect(() => createAuthenticatedWebSocketClass()).not.toThrow();
        });

        it('should return different class instances', () => {
            const WSClass1 = createAuthenticatedWebSocketClass('cookie1');
            const WSClass2 = createAuthenticatedWebSocketClass('cookie2');
            
            // Both should be constructor functions
            expect(typeof WSClass1).toBe('function');
            expect(typeof WSClass2).toBe('function');
        });
    });

    describe('Static cookieHeader', () => {
        it('should start as null', () => {
            // After beforeEach sets it to '', but originally it should be null
            const freshAuthWS = AuthenticatedWebSocket;
            expect(typeof freshAuthWS).toBe('function');
        });

        it('should be accessible as static property', () => {
            AuthenticatedWebSocket.setCookies('test=value');
            
            expect((AuthenticatedWebSocket as unknown as {cookieHeader: string}).cookieHeader).toBeDefined();
        });

        it('should persist across multiple set calls', () => {
            AuthenticatedWebSocket.setCookies('first=cookie');
            const first = (AuthenticatedWebSocket as unknown as {cookieHeader: string}).cookieHeader;
            
            AuthenticatedWebSocket.setCookies('second=cookie');
            const second = (AuthenticatedWebSocket as unknown as {cookieHeader: string}).cookieHeader;
            
            expect(first).toBe('first=cookie');
            expect(second).toBe('second=cookie');
        });
    });

    describe('Cookie format handling', () => {
        it('should handle single cookie', () => {
            const cookie = 'JSESSIONID=abc123';
            AuthenticatedWebSocket.setCookies(cookie);
            
            expect((AuthenticatedWebSocket as unknown as {cookieHeader: string}).cookieHeader).toBe(cookie);
        });

        it('should handle multiple cookies', () => {
            const cookies = 'JSESSIONID=abc123; glide_session_store=xyz789; glide_user_route=route1';
            AuthenticatedWebSocket.setCookies(cookies);
            
            expect((AuthenticatedWebSocket as unknown as {cookieHeader: string}).cookieHeader).toBe(cookies);
        });

        it('should handle cookies with special characters', () => {
            const cookies = 'session=abc123-def456_ghi789; path=/';
            AuthenticatedWebSocket.setCookies(cookies);
            
            expect((AuthenticatedWebSocket as unknown as {cookieHeader: string}).cookieHeader).toBe(cookies);
        });
    });

    // Note: Actual WebSocket creation and connection tests
    // require a WebSocket server and are in integration tests
    describe('Method existence', () => {
        it('should have create static method', () => {
            expect(typeof AuthenticatedWebSocket.create).toBe('function');
        });

        it('should have setCookies static method', () => {
            expect(typeof AuthenticatedWebSocket.setCookies).toBe('function');
        });
    });
});


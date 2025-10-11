/**
 * Authenticated WebSocket wrapper for ServiceNow AMB connections
 * 
 * This wrapper ensures cookies are properly included in WebSocket connections
 * for authentication with ServiceNow's AMB server.
 */

import * as ws from 'ws';

export class AuthenticatedWebSocket {
    // Make cookieHeader public static so it can be accessed in the factory function
    public static cookieHeader: string | null = null;
    
    /**
     * Set the cookie header to be used for all WebSocket connections
     * @param cookies Cookie string (e.g., "JSESSIONID=xxx; glide_session_store=yyy")
     */
    public static setCookies(cookies: string): void {
        AuthenticatedWebSocket.cookieHeader = cookies;
    }
    
    /**
     * Create a WebSocket with authentication cookies
     * This is used by CometD to create WebSocket connections
     */
    public static create(url: string, protocols?: string | string[]): ws.WebSocket {
        const options: ws.ClientOptions = {};
        
        // Add cookie header if available
        if (AuthenticatedWebSocket.cookieHeader) {
            options.headers = {
                'Cookie': AuthenticatedWebSocket.cookieHeader,
                'Origin': url.replace(/^wss?:\/\//, 'https://').replace(/\/amb.*$/, '')
            };
        }
        
        return new ws.WebSocket(url, protocols, options);
    }
}

/**
 * Factory function that returns a WebSocket constructor with cookies
 * Using 'any' type to avoid complex WebSocket type inference issues
 */
export function createAuthenticatedWebSocketClass(cookies?: string): any {
    if (cookies) {
        AuthenticatedWebSocket.setCookies(cookies);
    }
    
    // Return a class that creates authenticated WebSockets
    return class extends ws.WebSocket {
        constructor(url: string, protocols?: string | string[]) {
            const options: ws.ClientOptions = {};
            
            if (AuthenticatedWebSocket.cookieHeader) {
                options.headers = {
                    'Cookie': AuthenticatedWebSocket.cookieHeader,
                    'Origin': url.replace(/^wss?:\/\//, 'https://').replace(/\/amb.*$/, '')
                };
            }
            
            super(url, protocols, options);
        }
    };
}


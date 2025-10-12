/**
 * Reusable mocks for ServiceNow SDK dependencies
 * These mocks can be used across multiple test files
 */

import { jest } from '@jest/globals';

/**
 * Mock for Response object (Web API Response)
 */
export class MockResponse {
    ok: boolean;
    status: number;
    statusText: string;
    body: any;
    private _text: string;
    public headersMap: Map<string, string>;

    constructor(
        body: any,
        init: {
            status?: number;
            statusText?: string;
            headers?: Record<string, string>;
            ok?: boolean;
        } = {}
    ) {
        this.status = init.status ?? 200;
        this.statusText = init.statusText ?? 'OK';
        this.ok = init.ok ?? (this.status >= 200 && this.status < 300);
        this.headersMap = new Map();
        
        if (init.headers) {
            Object.entries(init.headers).forEach(([key, value]) => {
                this.headersMap.set(key, value);
            });
        }

        this.body = body;
        this._text = typeof body === 'string' ? body : JSON.stringify(body);
    }

    async text(): Promise<string> {
        return this._text;
    }

    async json(): Promise<any> {
        return JSON.parse(this._text);
    }

    // Mock headers property with forEach method
    get headers(): any {
        return {
            forEach: (callback: (value: string, key: string) => void) => {
                this.headersMap.forEach((value, key) => callback(value, key));
            },
            get: (key: string) => this.headersMap.get(key),
            set: (key: string, value: string) => this.headersMap.set(key, value)
        };
    }
}

/**
 * Mock for makeRequest from @servicenow/sdk-cli-core
 */
export const createMakeRequestMock = () => {
    return jest.fn().mockImplementation(async (config: any) => {
        // Default successful response
        const body = { result: 'success' };
        const response = new MockResponse(body, {
            status: 200,
            statusText: 'OK',
            headers: {
                'content-type': 'application/json',
                'set-cookie': 'JSESSIONID=test-session-id'
            }
        });
        
        return response;
    });
};

/**
 * Mock for parseResponseBody from @servicenow/sdk-cli-core
 */
export const createParseResponseBodyMock = () => {
    return jest.fn().mockImplementation(async (response: any) => {
        if (typeof response === 'string') {
            try {
                return JSON.parse(response);
            } catch {
                return response;
            }
        }
        return response;
    });
};

/**
 * Mock for parseXml from @servicenow/sdk-cli-core
 */
export const createParseXmlMock = () => {
    return jest.fn().mockImplementation(async (xmlString: string) => {
        // Simple XML parsing mock
        return {
            xml: {
                '@_answer': 'parsed xml result'
            }
        };
    });
};

/**
 * Helper to create response with specific status code
 */
export const createMockResponse = (
    status: number,
    body: any,
    headers: Record<string, string> = {}
): MockResponse => {
    return new MockResponse(body, {
        status,
        statusText: getStatusText(status),
        headers,
        ok: status >= 200 && status < 300
    });
};

/**
 * Helper to create error response
 */
export const createErrorResponse = (status: number, message: string): MockResponse => {
    return createMockResponse(
        status,
        { error: message },
        { 'content-type': 'application/json' }
    );
};

/**
 * Helper to create success response with JSON body
 */
export const createSuccessResponse = (data: any): MockResponse => {
    return createMockResponse(
        200,
        data,
        { 
            'content-type': 'application/json',
            'set-cookie': 'JSESSIONID=test-session'
        }
    );
};

/**
 * Helper to create response with XML body
 */
export const createXmlResponse = (xmlString: string): MockResponse => {
    return new MockResponse(xmlString, {
        status: 200,
        headers: { 'content-type': 'application/xml' }
    });
};

/**
 * Helper to create response with text body
 */
export const createTextResponse = (text: string): MockResponse => {
    return new MockResponse(text, {
        status: 200,
        headers: { 'content-type': 'text/plain' }
    });
};

/**
 * Get status text for HTTP status code
 */
function getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
        200: 'OK',
        201: 'Created',
        204: 'No Content',
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable'
    };
    return statusTexts[status] || 'Unknown';
}

/**
 * Mock IAuthenticationHandler
 */
export class MockAuthenticationHandler {
    private _isLoggedIn = true;
    private _token = 'mock-token-12345';
    private _session = { username: 'test.user', host: 'test.service-now.com' };
    private _requestHandler: any = null;
    private _cookieStore: any = null;

    doLogin = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    
    getRequestHandler = jest.fn().mockReturnValue(this._requestHandler);
    
    setRequestHandler = jest.fn().mockImplementation((handler: any) => {
        this._requestHandler = handler;
    });

    isLoggedIn = jest.fn().mockReturnValue(this._isLoggedIn);
    
    setLoggedIn = jest.fn().mockImplementation((loggedIn: boolean) => {
        this._isLoggedIn = loggedIn;
    });

    getToken = jest.fn().mockReturnValue(this._token);
    
    getCookies = jest.fn().mockReturnValue(this._cookieStore);
    
    getSession = jest.fn().mockReturnValue(this._session);

    // Helper methods for testing
    setToken(token: string) {
        this._token = token;
    }

    setSession(session: any) {
        this._session = session;
    }

    setCookieStore(store: any) {
        this._cookieStore = store;
    }
}

/**
 * Mock Logger
 */
export class MockLogger {
    debug = jest.fn();
    info = jest.fn();
    warn = jest.fn();
    error = jest.fn();
    log = jest.fn();

    getLabel = jest.fn().mockReturnValue('MockLogger');
    setLogger = jest.fn();

    // Helper to check if error was logged
    hasErrorBeenLogged(message?: string): boolean {
        if (!message) {
            return this.error.mock.calls.length > 0;
        }
        return this.error.mock.calls.some(call => 
            call.some(arg => 
                typeof arg === 'string' && arg.includes(message)
            )
        );
    }

    // Helper to clear all logs
    clearLogs() {
        this.debug.mockClear();
        this.info.mockClear();
        this.warn.mockClear();
        this.error.mockClear();
        this.log.mockClear();
    }
}

/**
 * Mock ICookieStore
 */
export class MockCookieStore {
    private cookies: Map<string, any> = new Map();

    getCookie = jest.fn().mockImplementation((name: string) => {
        return this.cookies.get(name);
    });

    setCookie = jest.fn().mockImplementation((name: string, cookie: any) => {
        this.cookies.set(name, cookie);
    });

    getAllCookies = jest.fn().mockImplementation(() => {
        return Array.from(this.cookies.values());
    });

    clearCookies = jest.fn().mockImplementation(() => {
        this.cookies.clear();
    });
}

/**
 * Mock for getCredentials from @servicenow/sdk-cli
 */
export const createGetCredentialsMock = () => {
    return jest.fn<any>().mockImplementation(async (aliasOrArgs: string | unknown) => {
        const alias = typeof aliasOrArgs === 'string' ? aliasOrArgs : (aliasOrArgs as {auth?: string})?.auth || 'test-instance';
        
        // Return mock credentials with all required properties
        return {
            host: `${alias}.service-now.com`,
            username: 'mock.user',
            password: 'mock-password',
            instanceUrl: `https://${alias}.service-now.com`,
            token: 'mock-oauth-token',
            // Additional properties that may be accessed
            alias: alias,
            authType: 'basic'
        };
    });
};

/**
 * Mock for getSafeUserSession from @servicenow/sdk-cli-core
 */
export const createGetSafeUserSessionMock = () => {
    return jest.fn<any>().mockImplementation(async (auth: unknown, logger: unknown) => {
        const authObj = auth as {credentials?: {username?: string, host?: string}};
        return {
            username: authObj?.credentials?.username || 'mock.user',
            host: authObj?.credentials?.host || 'test.service-now.com',
            token: 'mock-session-token',
            sessionId: 'mock-session-id',
            setSession: jest.fn(),
            getToken: jest.fn().mockReturnValue('mock-session-token'),
            getCookies: jest.fn().mockReturnValue({}),
            instanceUrl: 'https://test.service-now.com'
        };
    });
};

/**
 * Create a mock ServiceNowInstance for testing
 */
export const createMockServiceNowInstance = (alias: string = 'test-instance') => {
    return {
        getAlias: jest.fn().mockReturnValue(alias),
        getHost: jest.fn().mockReturnValue(`${alias}.service-now.com`),
        getInstanceUrl: jest.fn().mockReturnValue(`https://${alias}.service-now.com`),
        getCredential: jest.fn().mockReturnValue({
            host: `${alias}.service-now.com`,
            username: 'mock.user',
            password: 'mock-password'
        })
    };
};

/**
 * Factory function to create a complete mock setup
 */
export const createMockSetup = () => {
    return {
        makeRequest: createMakeRequestMock(),
        parseResponseBody: createParseResponseBodyMock(),
        parseXml: createParseXmlMock(),
        getCredentials: createGetCredentialsMock(),
        getSafeUserSession: createGetSafeUserSessionMock(),
        authHandler: new MockAuthenticationHandler(),
        logger: new MockLogger(),
        cookieStore: new MockCookieStore()
    };
};


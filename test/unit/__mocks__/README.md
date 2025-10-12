# ServiceNow SDK Mocks

This directory contains reusable mocks for testing code that depends on ServiceNow SDK.

## Overview

The `servicenow-sdk-mocks.ts` file provides comprehensive mocks for:
- ServiceNow SDK HTTP functions (`makeRequest`, `parseResponseBody`)
- ServiceNow authentication handlers
- Logger utilities
- Cookie stores
- Response objects

## Usage

### Basic Setup

```typescript
import {
    createMockSetup,
    createSuccessResponse,
    createErrorResponse,
    MockAuthenticationHandler
} from '../../__mocks__/servicenow-sdk-mocks';

describe('MyTest', () => {
    let mockSetup: ReturnType<typeof createMockSetup>;
    
    beforeEach(() => {
        mockSetup = createMockSetup();
    });
    
    it('should work', () => {
        // Use mockSetup.makeRequest, mockSetup.authHandler, etc.
    });
});
```

### Creating Mock Responses

#### Success Response
```typescript
import { createSuccessResponse } from '../../__mocks__/servicenow-sdk-mocks';

const response = createSuccessResponse({
    result: [{ sys_id: '123', name: 'Test' }]
});

mockMakeRequest.mockResolvedValue(response);
```

#### Error Response
```typescript
import { createErrorResponse } from '../../__mocks__/servicenow-sdk-mocks';

const response = createErrorResponse(404, 'Not Found');
mockMakeRequest.mockResolvedValue(response);
```

#### Custom Response
```typescript
import { createMockResponse } from '../../__mocks__/servicenow-sdk-mocks';

const response = createMockResponse(
    201,
    { result: { sys_id: 'abc123' } },
    { 'Location': '/api/now/table/incident/abc123' }
);
```

#### XML Response
```typescript
import { createXmlResponse } from '../../__mocks__/servicenow-sdk-mocks';

const xmlData = '<?xml version="1.0"?><root><item>test</item></root>';
const response = createXmlResponse(xmlData);
```

#### Text Response
```typescript
import { createTextResponse } from '../../__mocks__/servicenow-sdk-mocks';

const response = createTextResponse('Plain text response');
```

### MockResponse Class

The `MockResponse` class simulates the Web API Response object:

```typescript
import { MockResponse } from '../../__mocks__/servicenow-sdk-mocks';

const response = new MockResponse(
    { result: 'data' },
    {
        status: 200,
        statusText: 'OK',
        headers: {
            'content-type': 'application/json',
            'set-cookie': 'JSESSIONID=abc123'
        }
    }
);

// Access response data
await response.text();  // Returns JSON string
await response.json();  // Returns parsed object

// Iterate headers
response.headers.forEach((value, key) => {
    console.log(`${key}: ${value}`);
});
```

### MockAuthenticationHandler

Mock implementation of `IAuthenticationHandler`:

```typescript
import { MockAuthenticationHandler } from '../../__mocks__/servicenow-sdk-mocks';

const authHandler = new MockAuthenticationHandler();

// Use with classes that need authentication
const myClass = new MyClass(authHandler as any);

// Verify authentication was called
expect(authHandler.doLogin).toHaveBeenCalled();
expect(authHandler.getToken()).toBe('mock-token-12345');

// Customize behavior
authHandler.setToken('custom-token');
authHandler.setSession({ username: 'test', host: 'instance.service-now.com' });
```

### MockLogger

Mock logger for verifying log calls:

```typescript
import { MockLogger } from '../../__mocks__/servicenow-sdk-mocks';

const logger = new MockLogger();

// Your code logs something
logger.error('Something went wrong');

// Verify logging
expect(logger.error).toHaveBeenCalled();
expect(logger.hasErrorBeenLogged('went wrong')).toBe(true);

// Clear logs between tests
logger.clearLogs();
```

### MockCookieStore

Mock cookie store implementation:

```typescript
import { MockCookieStore } from '../../__mocks__/servicenow-sdk-mocks';

const cookieStore = new MockCookieStore();

// Set cookies
cookieStore.setCookie('session', { name: 'JSESSIONID', value: 'abc123' });

// Get cookies
const cookie = cookieStore.getCookie('session');
const allCookies = cookieStore.getAllCookies();

// Clear cookies
cookieStore.clearCookies();
```

### Complete Mock Setup

The `createMockSetup()` function creates all mocks at once:

```typescript
import { createMockSetup } from '../../__mocks__/servicenow-sdk-mocks';

const mockSetup = createMockSetup();

// Access all mocks
mockSetup.makeRequest        // Mock for makeRequest
mockSetup.parseResponseBody  // Mock for parseResponseBody
mockSetup.parseXml          // Mock for parseXml
mockSetup.authHandler       // MockAuthenticationHandler instance
mockSetup.logger            // MockLogger instance
mockSetup.cookieStore       // MockCookieStore instance
```

## Testing Request Handlers

Example of testing a class that uses ServiceNow SDK:

```typescript
import { RequestHandler } from '../../../src/comm/http/RequestHandler';
import {
    createMockSetup,
    createSuccessResponse,
    MockAuthenticationHandler
} from '../../__mocks__/servicenow-sdk-mocks';

describe('RequestHandler', () => {
    let requestHandler: RequestHandler;
    let mockAuthHandler: MockAuthenticationHandler;
    
    beforeEach(() => {
        mockAuthHandler = new MockAuthenticationHandler();
        requestHandler = new RequestHandler(mockAuthHandler as any);
    });
    
    it('should handle successful request', async () => {
        const responseData = { result: 'success' };
        mockMakeRequest.mockResolvedValue(createSuccessResponse(responseData));
        
        const response = await requestHandler.get({
            path: '/api/endpoint',
            headers: null,
            query: null,
            body: null
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toEqual(responseData);
    });
});
```

## Testing Without Mocking External Dependencies

For testing logic that doesn't require mocking external SDK functions:

```typescript
import { RequestHandler } from '../../../src/comm/http/RequestHandler';
import { MockAuthenticationHandler } from '../../__mocks__/servicenow-sdk-mocks';

describe('RequestHandler - Logic Tests', () => {
    let requestHandler: RequestHandler;
    
    beforeEach(() => {
        const authHandler = new MockAuthenticationHandler();
        requestHandler = new RequestHandler(authHandler as any);
    });
    
    it('should validate XML strings', () => {
        const validXml = '<root><item>test</item></root>';
        expect(requestHandler.isValidXmlString(validXml)).toBe(true);
    });
    
    it('should build query strings', () => {
        const queryObj = { param1: 'value1', param2: 'value2' };
        const queryString = (requestHandler as any).getQueryString(queryObj);
        expect(queryString).toContain('param1=value1');
    });
});
```

## Best Practices

1. **Use `createMockSetup()`** for comprehensive mock initialization
2. **Clear mocks between tests** using `jest.clearAllMocks()` in `beforeEach()`
3. **Use helper functions** like `createSuccessResponse()` instead of creating MockResponse directly
4. **Type assertions** may be needed when passing mocks to typed functions (`as any`)
5. **Test logic separately** from external dependencies when possible

## Mock Limitations

- The mocks simulate SDK behavior but don't make actual network requests
- Complex ServiceNow-specific behaviors may need additional customization
- Some edge cases might not be fully covered

## Adding New Mocks

To add new mocks to this file:

1. Define the mock class or function
2. Export it from `servicenow-sdk-mocks.ts`
3. Add documentation here
4. Update `createMockSetup()` if it's a common dependency

## Related Files

- `RequestHandler.simple.test.ts` - Example of logic testing without complex mocks
- `RequestHandler.test.ts` - Example of full request/response testing (requires module mocking)
- `servicenow-sdk-mocks.ts` - Mock implementations


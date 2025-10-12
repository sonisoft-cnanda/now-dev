/**
 * Unit tests for ServiceNowRequest class
 * Tests all methods with proper mocking
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServiceNowRequest } from '../../../../src/comm/http/ServiceNowRequest';
import { ServiceNowInstance } from '../../../../src/sn/ServiceNowInstance';
import { HTTPRequest } from '../../../../src/comm/http/HTTPRequest';
import { IHttpResponse } from '../../../../src/comm/http/IHttpResponse';
import { MockAuthenticationHandler } from '../../__mocks__/servicenow-sdk-mocks';

// Create mock request handler
class MockRequestHandler {
    get = jest.fn<() => Promise<IHttpResponse<unknown>>>();
    post = jest.fn<() => Promise<IHttpResponse<unknown>>>();
    put = jest.fn<() => Promise<IHttpResponse<unknown>>>();
    delete = jest.fn<() => Promise<IHttpResponse<unknown>>>();
}

// Import first
import { AuthenticationHandlerFactory } from '../../../../src/auth/AuthenticationHandlerFactory';
import { RequestHandlerFactory } from '../../../../src/comm/http/RequestHandlerFactory';

// Then mock
jest.mock('../../../../src/auth/AuthenticationHandlerFactory');
jest.mock('../../../../src/comm/http/RequestHandlerFactory');

describe('ServiceNowRequest', () => {
    let serviceNowRequest: ServiceNowRequest;
    let mockInstance: ServiceNowInstance;
    let mockAuthHandler: MockAuthenticationHandler;
    let mockRequestHandler: MockRequestHandler;
    let mockCreateAuthHandler: ReturnType<typeof jest.spyOn>;
    let mockCreateRequestHandler: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Create mock instance
        mockInstance = {
            getAlias: jest.fn().mockReturnValue('test-instance'),
            getHost: jest.fn().mockReturnValue('test.service-now.com')
        } as unknown as ServiceNowInstance;

        // Create mock handlers
        mockAuthHandler = new MockAuthenticationHandler();
        mockRequestHandler = new MockRequestHandler();

        // Setup factory mocks using spyOn
        mockCreateAuthHandler = jest.spyOn(AuthenticationHandlerFactory, 'createAuthHandler')
            .mockReturnValue(mockAuthHandler as unknown as ReturnType<typeof AuthenticationHandlerFactory.createAuthHandler>);
        mockCreateRequestHandler = jest.spyOn(RequestHandlerFactory, 'createRequestHandler')
            .mockReturnValue(mockRequestHandler as unknown as ReturnType<typeof RequestHandlerFactory.createRequestHandler>);

        // Create ServiceNowRequest instance
        serviceNowRequest = new ServiceNowRequest(mockInstance);
    });

    describe('Constructor', () => {
        it('should create instance with ServiceNow instance', () => {
            expect(serviceNowRequest).toBeInstanceOf(ServiceNowRequest);
            expect((serviceNowRequest as unknown as {_instance: ServiceNowInstance})._instance).toBe(mockInstance);
        });

        it('should initialize authentication handler via factory', () => {
            expect(mockCreateAuthHandler).toHaveBeenCalledWith(mockInstance);
            expect(serviceNowRequest.auth).toBe(mockAuthHandler);
        });

        it('should initialize request handler via factory', () => {
            expect(mockCreateRequestHandler).toHaveBeenCalledWith(mockAuthHandler);
            expect(serviceNowRequest['_requestHandler']).toBe(mockRequestHandler);
        });

        it('should set request handler on auth handler', () => {
            expect(mockAuthHandler.setRequestHandler).toHaveBeenCalledWith(mockRequestHandler);
        });

        it('should work with null instance', () => {
            const reqWithoutInstance = new ServiceNowRequest(null);
            expect(reqWithoutInstance).toBeInstanceOf(ServiceNowRequest);
            expect(mockCreateAuthHandler).toHaveBeenCalled();
        });
    });

    describe('GET requests', () => {
        it('should execute GET request when logged in', async () => {
            const mockResponse: IHttpResponse<unknown> = {
                data: { result: [{ sys_id: '123' }] },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            };

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue(mockResponse);

            const request: HTTPRequest = {
                path: '/api/now/table/incident',
                headers: null,
                query: { sysparm_limit: 10 },
                body: null,
                method: 'GET'
            };

            const response = await serviceNowRequest.get(request);

            expect(response).toEqual(mockResponse);
            expect(mockRequestHandler.get).toHaveBeenCalledWith(request);
            expect(mockAuthHandler.doLogin).not.toHaveBeenCalled();
        });

        it('should login before GET request when not logged in', async () => {
            const mockResponse: IHttpResponse<unknown> = {
                data: { result: [] },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            };

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(false);
            mockRequestHandler.get.mockResolvedValue(mockResponse);

            const request: HTTPRequest = {
                path: '/api/now/table/incident',
                headers: null,
                query: null,
                body: null
            };

            const response = await serviceNowRequest.get(request);

            expect(mockAuthHandler.doLogin).toHaveBeenCalled();
            expect(mockRequestHandler.get).toHaveBeenCalledWith(request);
            expect(response).toEqual(mockResponse);
        });

        it('should handle GET request with query parameters', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({ data: {}, status: 200 } as IHttpResponse<unknown>);

            const request: HTTPRequest = {
                path: '/api/now/table/sys_user',
                headers: { 'Accept': 'application/json' },
                query: { 
                    sysparm_query: 'active=true',
                    sysparm_limit: 25 
                },
                body: null
            };

            await serviceNowRequest.get(request);

            expect(mockRequestHandler.get).toHaveBeenCalledWith(request);
        });
    });

    describe('POST requests', () => {
        it('should execute POST request when logged in', async () => {
            const requestBody = { short_description: 'Test incident' };
            const mockResponse: IHttpResponse<unknown> = {
                data: { result: { sys_id: 'abc123', ...requestBody } },
                status: 201,
                statusText: 'Created',
                headers: {},
                config: {}
            };

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue(mockResponse);

            const request: HTTPRequest = {
                path: '/api/now/table/incident',
                headers: { 'Content-Type': 'application/json' },
                query: null,
                body: requestBody,
                method: 'POST'
            };

            const response = await serviceNowRequest.post(request);

            expect(response).toEqual(mockResponse);
            expect(mockRequestHandler.post).toHaveBeenCalledWith(request);
            expect(mockAuthHandler.doLogin).not.toHaveBeenCalled();
        });

        it('should login before POST request when not logged in', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(false);
            mockRequestHandler.post.mockResolvedValue({ data: {}, status: 201 } as IHttpResponse<unknown>);

            const request: HTTPRequest = {
                path: '/api/now/table/incident',
                headers: null,
                query: null,
                body: { test: 'data' }
            };

            await serviceNowRequest.post(request);

            expect(mockAuthHandler.doLogin).toHaveBeenCalled();
            expect(mockRequestHandler.post).toHaveBeenCalledWith(request);
        });

        it('should handle POST with form fields', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({ data: {}, status: 200 } as IHttpResponse<unknown>);

            const request: HTTPRequest = {
                path: '/xmlhttp.do',
                headers: null,
                query: null,
                body: null,
                fields: { 
                    sysparm_processor: 'ChannelAjax',
                    sysparm_value: '12345'
                }
            };

            await serviceNowRequest.post(request);

            expect(mockRequestHandler.post).toHaveBeenCalledWith(request);
        });
    });

    describe('PUT requests', () => {
        it('should execute PUT request when logged in', async () => {
            const updateData = { state: '6', close_notes: 'Resolved' };
            const mockResponse: IHttpResponse<unknown> = {
                data: { result: { sys_id: '123', ...updateData } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            };

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.put.mockResolvedValue(mockResponse);

            const request: HTTPRequest = {
                path: '/api/now/table/incident/123',
                headers: { 'Content-Type': 'application/json' },
                query: null,
                body: updateData,
                method: 'PUT'
            };

            const response = await serviceNowRequest.put(request);

            expect(response).toEqual(mockResponse);
            expect(mockRequestHandler.put).toHaveBeenCalledWith(request);
            expect(mockAuthHandler.doLogin).not.toHaveBeenCalled();
        });

        it('should login before PUT request when not logged in', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(false);
            mockRequestHandler.put.mockResolvedValue({ data: {}, status: 200 } as IHttpResponse<unknown>);

            const request: HTTPRequest = {
                path: '/api/now/table/incident/123',
                headers: null,
                query: null,
                body: { state: '3' }
            };

            await serviceNowRequest.put(request);

            expect(mockAuthHandler.doLogin).toHaveBeenCalled();
            expect(mockRequestHandler.put).toHaveBeenCalledWith(request);
        });
    });

    describe('DELETE requests', () => {
        it('should execute DELETE request when logged in', async () => {
            const mockResponse: IHttpResponse<unknown> = {
                data: null,
                status: 204,
                statusText: 'No Content',
                headers: {},
                config: {}
            };

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.delete.mockResolvedValue(mockResponse);

            const request: HTTPRequest = {
                path: '/api/now/table/incident/123',
                headers: null,
                query: null,
                body: null,
                method: 'DELETE'
            };

            const response = await serviceNowRequest.delete(request);

            expect(response).toEqual(mockResponse);
            expect(mockRequestHandler.delete).toHaveBeenCalledWith(request);
            expect(mockAuthHandler.doLogin).not.toHaveBeenCalled();
        });

        it('should login before DELETE request when not logged in', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(false);
            mockRequestHandler.delete.mockResolvedValue({ data: null, status: 204 } as IHttpResponse<unknown>);

            const request: HTTPRequest = {
                path: '/api/now/table/incident/123',
                headers: null,
                query: null,
                body: null
            };

            await serviceNowRequest.delete(request);

            expect(mockAuthHandler.doLogin).toHaveBeenCalled();
            expect(mockRequestHandler.delete).toHaveBeenCalledWith(request);
        });
    });

    describe('executeRequest', () => {
        it('should route to GET for get method', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({ data: {}, status: 200 } as IHttpResponse<unknown>);

            const request: HTTPRequest = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: null,
                method: 'get'
            };

            await serviceNowRequest.executeRequest(request);

            expect(mockRequestHandler.get).toHaveBeenCalledWith(request);
        });

        it('should route to POST for post method', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({ data: {}, status: 201 } as IHttpResponse<unknown>);

            const request: HTTPRequest = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: {},
                method: 'post'
            };

            await serviceNowRequest.executeRequest(request);

            expect(mockRequestHandler.post).toHaveBeenCalledWith(request);
        });

        it('should route to PUT for put method', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.put.mockResolvedValue({ data: {}, status: 200 } as IHttpResponse<unknown>);

            const request: HTTPRequest = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: {},
                method: 'put'
            };

            await serviceNowRequest.executeRequest(request);

            expect(mockRequestHandler.put).toHaveBeenCalledWith(request);
        });

        it('should route to DELETE for delete method', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.delete.mockResolvedValue({ data: null, status: 204 } as IHttpResponse<unknown>);

            const request: HTTPRequest = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: null,
                method: 'delete'
            };

            await serviceNowRequest.executeRequest(request);

            expect(mockRequestHandler.delete).toHaveBeenCalledWith(request);
        });

        it('should handle uppercase method names', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({ data: {}, status: 200 } as IHttpResponse<unknown>);

            const request: HTTPRequest = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: null,
                method: 'GET'
            };

            await serviceNowRequest.executeRequest(request);

            expect(mockRequestHandler.get).toHaveBeenCalled();
        });

        it('should handle method names with spaces', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({ data: {}, status: 200 } as IHttpResponse<unknown>);

            const request: HTTPRequest = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: {},
                method: ' POST '
            };

            await serviceNowRequest.executeRequest(request);

            expect(mockRequestHandler.post).toHaveBeenCalled();
        });

        it('should throw error when method is not provided', async () => {
            const request: HTTPRequest = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: null,
                method: null
            };

            await expect(serviceNowRequest.executeRequest(request)).rejects.toThrow(
                'Method must be populated on HTTPRequest object in order to utlize executeRequest.'
            );
        });

        it('should throw error when method is undefined', async () => {
            const request: HTTPRequest = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: null,
                method: undefined
            };

            await expect(serviceNowRequest.executeRequest(request)).rejects.toThrow(
                'Method must be populated on HTTPRequest object'
            );
        });

        it('should throw error when method is empty string', async () => {
            const request: HTTPRequest = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: null,
                method: ''
            };

            await expect(serviceNowRequest.executeRequest(request)).rejects.toThrow(
                'Method must be populated on HTTPRequest object'
            );
        });
    });

    describe('getUserSession', () => {
        it('should return session when logged in', async () => {
            const mockSession = { username: 'test', host: 'test.service-now.com' };
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockAuthHandler.getSession = jest.fn().mockReturnValue(mockSession);

            const session = await serviceNowRequest.getUserSession();

            expect(session).toEqual(mockSession);
            expect(mockAuthHandler.getSession).toHaveBeenCalled();
            expect(mockAuthHandler.doLogin).not.toHaveBeenCalled();
        });

        it('should login and return session when not logged in', async () => {
            const mockSession = { username: 'test', host: 'test.service-now.com' };
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(false);
            mockAuthHandler.doLogin = jest.fn<() => Promise<void>>().mockResolvedValue(mockSession as unknown as void);

            const session = await serviceNowRequest.getUserSession();

            expect(session).toEqual(mockSession);
            expect(mockAuthHandler.doLogin).toHaveBeenCalled();
            expect(mockAuthHandler.getSession).not.toHaveBeenCalled();
        });
    });

    describe('isLoggedIn', () => {
        it('should return true when authenticated', () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            const result = serviceNowRequest.isLoggedIn();

            expect(result).toBe(true);
            expect(mockAuthHandler.isLoggedIn).toHaveBeenCalled();
        });

        it('should return false when not authenticated', () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(false);

            const result = serviceNowRequest.isLoggedIn();

            expect(result).toBe(false);
            expect(mockAuthHandler.isLoggedIn).toHaveBeenCalled();
        });
    });

    describe('getAuth', () => {
        it('should return authentication handler', () => {
            const authHandler = serviceNowRequest.getAuth();

            expect(authHandler).toBe(mockAuthHandler);
        });

        it('should return same instance on multiple calls', () => {
            const auth1 = serviceNowRequest.getAuth();
            const auth2 = serviceNowRequest.getAuth();

            expect(auth1).toBe(auth2);
            expect(auth1).toBe(mockAuthHandler);
        });
    });

    describe('ensureLoggedIn (private method)', () => {
        it('should login when not authenticated', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(false);
            mockRequestHandler.get.mockResolvedValue({ data: {}, status: 200 } as IHttpResponse<unknown>);

            const request: HTTPRequest = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: null
            };

            await serviceNowRequest.get(request);

            expect(mockAuthHandler.doLogin).toHaveBeenCalledTimes(1);
        });

        it('should be called before each request when not logged in', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(false);
            mockRequestHandler.get.mockResolvedValue({ data: {}, status: 200 } as IHttpResponse<unknown>);
            mockRequestHandler.post.mockResolvedValue({ data: {}, status: 201 } as IHttpResponse<unknown>);

            const getRequest: HTTPRequest = {
                path: '/api/endpoint1',
                headers: null,
                query: null,
                body: null
            };

            const postRequest: HTTPRequest = {
                path: '/api/endpoint2',
                headers: null,
                query: null,
                body: {}
            };

            await serviceNowRequest.get(getRequest);
            await serviceNowRequest.post(postRequest);

            expect(mockAuthHandler.doLogin).toHaveBeenCalledTimes(2);
        });
    });

    describe('Integration scenarios', () => {
        it('should handle multiple sequential requests', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.get.mockResolvedValue({ data: { result: [] }, status: 200 } as IHttpResponse<unknown>);
            mockRequestHandler.post.mockResolvedValue({ data: { result: {} }, status: 201 } as IHttpResponse<unknown>);
            mockRequestHandler.put.mockResolvedValue({ data: { result: {} }, status: 200 } as IHttpResponse<unknown>);

            const getReq: HTTPRequest = { path: '/api/get', headers: null, query: null, body: null };
            const postReq: HTTPRequest = { path: '/api/post', headers: null, query: null, body: {} };
            const putReq: HTTPRequest = { path: '/api/put', headers: null, query: null, body: {} };

            await serviceNowRequest.get(getReq);
            await serviceNowRequest.post(postReq);
            await serviceNowRequest.put(putReq);

            expect(mockRequestHandler.get).toHaveBeenCalledTimes(1);
            expect(mockRequestHandler.post).toHaveBeenCalledTimes(1);
            expect(mockRequestHandler.put).toHaveBeenCalledTimes(1);
            expect(mockAuthHandler.doLogin).not.toHaveBeenCalled();
        });

        it('should handle authentication state changes', async () => {
            // First request: not logged in
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValueOnce(false);
            mockRequestHandler.get.mockResolvedValue({ data: {}, status: 200 } as IHttpResponse<unknown>);

            const request1: HTTPRequest = {
                path: '/api/endpoint1',
                headers: null,
                query: null,
                body: null
            };

            await serviceNowRequest.get(request1);
            expect(mockAuthHandler.doLogin).toHaveBeenCalledTimes(1);

            // Second request: now logged in
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);

            const request2: HTTPRequest = {
                path: '/api/endpoint2',
                headers: null,
                query: null,
                body: null
            };

            await serviceNowRequest.get(request2);
            expect(mockAuthHandler.doLogin).toHaveBeenCalledTimes(1); // Should not call again
        });

        it('should handle different request types in sequence', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            
            const mockGetResponse = { data: { result: { id: '1' } }, status: 200 } as IHttpResponse<unknown>;
            const mockPostResponse = { data: { result: { id: '2' } }, status: 201 } as IHttpResponse<unknown>;
            const mockPutResponse = { data: { result: { id: '2', updated: true } }, status: 200 } as IHttpResponse<unknown>;
            const mockDeleteResponse = { data: null, status: 204 } as IHttpResponse<unknown>;

            mockRequestHandler.get.mockResolvedValue(mockGetResponse);
            mockRequestHandler.post.mockResolvedValue(mockPostResponse);
            mockRequestHandler.put.mockResolvedValue(mockPutResponse);
            mockRequestHandler.delete.mockResolvedValue(mockDeleteResponse);

            // CRUD operations
            const getResp = await serviceNowRequest.get({ path: '/api/record/1', headers: null, query: null, body: null });
            const postResp = await serviceNowRequest.post({ path: '/api/record', headers: null, query: null, body: { name: 'New' } });
            const putResp = await serviceNowRequest.put({ path: '/api/record/2', headers: null, query: null, body: { name: 'Updated' } });
            const deleteResp = await serviceNowRequest.delete({ path: '/api/record/2', headers: null, query: null, body: null });

            expect((getResp.data as {result: {id: string}}).result.id).toBe('1');
            expect((postResp.data as {result: {id: string}}).result.id).toBe('2');
            expect((putResp.data as {result: {id: string, updated: boolean}}).result.updated).toBe(true);
            expect(deleteResp.status).toBe(204);
        });
    });
});

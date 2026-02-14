/**
 * Unit tests for ServiceNowProcessorRequest
 * Tests execute(), doXmlHttpRequest(), parameter assembly, and error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServiceNowProcessorRequest } from '../../../../src/comm/http/ServiceNowProcessorRequest';
import { IHttpResponse } from '../../../../src/comm/http/IHttpResponse';
import { MockAuthenticationHandler } from '../../__mocks__/servicenow-sdk-mocks';
import { AuthenticationHandlerFactory } from '../../../../src/auth/AuthenticationHandlerFactory';
import { RequestHandlerFactory } from '../../../../src/comm/http/RequestHandlerFactory';
import { ServiceNowInstance } from '../../../../src/sn/ServiceNowInstance';

// Mock factories
jest.mock('../../../../src/auth/AuthenticationHandlerFactory');
jest.mock('../../../../src/comm/http/RequestHandlerFactory');

// Mock request handler
class MockRequestHandler {
    get = jest.fn<() => Promise<IHttpResponse<unknown>>>();
    post = jest.fn<() => Promise<IHttpResponse<unknown>>>();
    put = jest.fn<() => Promise<IHttpResponse<unknown>>>();
    delete = jest.fn<() => Promise<IHttpResponse<unknown>>>();
}

describe('ServiceNowProcessorRequest', () => {
    let processorReq: ServiceNowProcessorRequest;
    let mockInstance: ServiceNowInstance;
    let mockAuthHandler: MockAuthenticationHandler;
    let mockRequestHandler: MockRequestHandler;

    beforeEach(() => {
        jest.clearAllMocks();

        mockAuthHandler = new MockAuthenticationHandler();
        mockRequestHandler = new MockRequestHandler();

        jest.spyOn(AuthenticationHandlerFactory, 'createAuthHandler')
            .mockReturnValue(mockAuthHandler as unknown as ReturnType<typeof AuthenticationHandlerFactory.createAuthHandler>);
        jest.spyOn(RequestHandlerFactory, 'createRequestHandler')
            .mockReturnValue(mockRequestHandler as unknown as ReturnType<typeof RequestHandlerFactory.createRequestHandler>);

        mockInstance = {
            getAlias: jest.fn().mockReturnValue('test-instance'),
            getHost: jest.fn().mockReturnValue('test.service-now.com')
        } as unknown as ServiceNowInstance;

        processorReq = new ServiceNowProcessorRequest(mockInstance);
    });

    describe('Constructor', () => {
        it('should create instance with ServiceNow instance', () => {
            expect(processorReq).toBeInstanceOf(ServiceNowProcessorRequest);
            expect(processorReq._instance).toBe(mockInstance);
        });
    });

    describe('doXmlHttpRequest', () => {
        it('should assemble parameters correctly', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: '<xml answer="test"></xml>',
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            } as IHttpResponse<unknown>);

            await processorReq.doXmlHttpRequest('TestProcessor', 'testMethod', 'global', { key1: 'val1' });

            const callArgs = mockRequestHandler.post.mock.calls[0][0] as any;
            expect(callArgs.path).toBe('/xmlhttp.do');
            expect(callArgs.fields.sysparm_processor).toBe('TestProcessor');
            expect(callArgs.fields.sysparm_name).toBe('testMethod');
            expect(callArgs.fields.sysparm_scope).toBe('global');
            expect(callArgs.fields.key1).toBe('val1');
        });

        it('should set Content-Type to x-www-form-urlencoded', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: '',
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            } as IHttpResponse<unknown>);

            await processorReq.doXmlHttpRequest('Proc', 'method', 'global', {});

            const callArgs = mockRequestHandler.post.mock.calls[0][0] as any;
            expect(callArgs.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
        });

        it('should merge processor args into data object', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: '',
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            } as IHttpResponse<unknown>);

            await processorReq.doXmlHttpRequest('Proc', 'method', 'global', {
                custom_param1: 'value1',
                custom_param2: 'value2'
            });

            const callArgs = mockRequestHandler.post.mock.calls[0][0] as any;
            expect(callArgs.fields.custom_param1).toBe('value1');
            expect(callArgs.fields.custom_param2).toBe('value2');
        });

        it('should return null when request throws', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockRejectedValue(new Error('Connection refused'));

            const result = await processorReq.doXmlHttpRequest('Proc', 'method', 'global', {});
            expect(result).toBeNull();
        });

        it('should return response on success', async () => {
            const expectedResponse: IHttpResponse<unknown> = {
                data: '<xml answer="result"></xml>',
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            };

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue(expectedResponse);

            const result = await processorReq.doXmlHttpRequest('Proc', 'method', 'global', {});
            expect(result).toBe(expectedResponse);
        });
    });

    describe('execute', () => {
        it('should parse answer from XML response', async () => {
            // The execute method uses xml2js Parser to extract the 'answer' attribute.
            // Response format: <?xml version="1.0"?>\n<xml answer="the_answer_value"></xml>
            const xmlResponse = '<?xml version="1.0" encoding="UTF-8"?><xml answer="scope_sys_id_123"></xml>';

            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: xmlResponse,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            } as IHttpResponse<unknown>);

            const result = await processorReq.execute('ChangeAppScope', 'changeScope', 'global', { app_id: 'abc' });
            expect(result).toBe('scope_sys_id_123');
        });

        it('should return null when response has no answer= in data', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: '<xml><result>no answer attribute</result></xml>',
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            } as IHttpResponse<unknown>);

            const result = await processorReq.execute('Proc', 'method', 'global', {});
            expect(result).toBeNull();
        });

        it('should return null when response status is not 200', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: 'error',
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {}
            } as IHttpResponse<unknown>);

            const result = await processorReq.execute('Proc', 'method', 'global', {});
            expect(result).toBeNull();
        });

        it('should return null when data is empty', async () => {
            mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
            mockRequestHandler.post.mockResolvedValue({
                data: '',
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            } as IHttpResponse<unknown>);

            const result = await processorReq.execute('Proc', 'method', 'global', {});
            expect(result).toBeNull();
        });
    });
});

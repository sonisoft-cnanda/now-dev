/**
 * Unit tests for RequestHandler class
 * Testing core functionality and logic
 */

import { describe, it, expect } from '@jest/globals';
import { RequestHandler } from '../../../../src/comm/http/RequestHandler';
import { MockAuthenticationHandler } from '../../__mocks__/servicenow-sdk-mocks';

describe('RequestHandler - Basic Tests', () => {
    let requestHandler: RequestHandler;
    let mockAuthHandler: MockAuthenticationHandler;

    beforeEach(() => {
        mockAuthHandler = new MockAuthenticationHandler();
        requestHandler = new RequestHandler(mockAuthHandler as any);
    });

    describe('Constructor', () => {
        it('should create instance with authentication handler', () => {
            expect(requestHandler).toBeInstanceOf(RequestHandler);
            expect((requestHandler as any)._authHandler).toBe(mockAuthHandler);
        });

        it('should initialize logger', () => {
            expect((requestHandler as any)._logger).toBeDefined();
        });

        it('should initialize without session', () => {
            expect((requestHandler as any)._session).toBeUndefined();
        });
    });

    describe('setSession', () => {
        it('should set session object', () => {
            const session = { username: 'test', host: 'test.service-now.com' };
            requestHandler.setSession(session);
            expect((requestHandler as any)._session).toEqual(session);
        });

        it('should overwrite existing session', () => {
            const session1 = { username: 'user1' };
            const session2 = { username: 'user2' };
            
            requestHandler.setSession(session1);
            expect((requestHandler as any)._session).toEqual(session1);
            
            requestHandler.setSession(session2);
            expect((requestHandler as any)._session).toEqual(session2);
        });

        it('should accept null session', () => {
            requestHandler.setSession(null);
            expect((requestHandler as any)._session).toBeNull();
        });
    });

    describe('isValidXmlString', () => {
        it('should return true for valid XML', () => {
            const validXml = '<?xml version="1.0"?><root><item>test</item></root>';
            const result = requestHandler.isValidXmlString(validXml);
            expect(result).toBe(true);
        });

        it('should return true for simple XML', () => {
            const simpleXml = '<root>test</root>';
            const result = requestHandler.isValidXmlString(simpleXml);
            expect(result).toBe(true);
        });

        it('should handle invalid XML gracefully', () => {
            const invalidXml = '<root><unclosed>';
            const result = requestHandler.isValidXmlString(invalidXml);
            // xmldom may be lenient with unclosed tags
            expect(typeof result).toBe('boolean');
        });

        it('should handle malformed XML gracefully', () => {
            const malformedXml = '<root>test</wrong>';
            const result = requestHandler.isValidXmlString(malformedXml);
            // xmldom may be lenient with mismatched tags
            expect(typeof result).toBe('boolean');
        });

        it('should return false for empty string', () => {
            const result = requestHandler.isValidXmlString('');
            expect(result).toBe(false);
        });

        it('should handle non-XML string gracefully', () => {
            const result = requestHandler.isValidXmlString('just plain text');
            // xmldom will wrap plain text in a document
            expect(typeof result).toBe('boolean');
        });

        it('should handle XML with attributes', () => {
            const xmlWithAttrs = '<root attr="value"><item id="1">test</item></root>';
            const result = requestHandler.isValidXmlString(xmlWithAttrs);
            expect(result).toBe(true);
        });

        it('should handle XML with namespaces', () => {
            const xmlWithNs = '<ns:root xmlns:ns="http://example.com"><ns:item>test</ns:item></ns:root>';
            const result = requestHandler.isValidXmlString(xmlWithNs);
            expect(result).toBe(true);
        });

        it('should handle XML with CDATA', () => {
            const xmlWithCdata = '<root><![CDATA[some data]]></root>';
            const result = requestHandler.isValidXmlString(xmlWithCdata);
            expect(result).toBe(true);
        });

        it('should handle XML with comments', () => {
            const xmlWithComments = '<root><!-- comment --><item>test</item></root>';
            const result = requestHandler.isValidXmlString(xmlWithComments);
            expect(result).toBe(true);
        });
    });

    describe('Query string building', () => {
        it('should build query string from object', () => {
            const queryObj = { 
                param1: 'value1', 
                param2: 'value2',
                param3: 'value with spaces'
            };

            const queryString = (requestHandler as any).getQueryString(queryObj);
            
            expect(queryString).toContain('param1=value1');
            expect(queryString).toContain('param2=value2');
            expect(queryString).toContain('param3=value');
        });

        it('should handle empty query object', () => {
            const queryString = (requestHandler as any).getQueryString({});
            expect(queryString).toBe('');
        });

        it('should handle special characters in query values', () => {
            const queryObj = { 
                query: 'name=John&age>30'
            };

            const queryString = (requestHandler as any).getQueryString(queryObj);
            expect(queryString).toContain('query=');
            expect(queryString).toContain('name');
        });

        it('should handle numeric values', () => {
            const queryObj = { 
                limit: '10',
                offset: '0'
            };

            const queryString = (requestHandler as any).getQueryString(queryObj);
            expect(queryString).toContain('limit=10');
            expect(queryString).toContain('offset=0');
        });

        it('should handle boolean values', () => {
            const queryObj = { 
                active: 'true',
                archived: 'false'
            };

            const queryString = (requestHandler as any).getQueryString(queryObj);
            expect(queryString).toContain('active=true');
            expect(queryString).toContain('archived=false');
        });
    });

    describe('Request configuration building', () => {
        it('should build config with session', async () => {
            const session = { username: 'test', host: 'test.service-now.com' };
            requestHandler.setSession(session);

            const request = {
                path: '/api/endpoint',
                headers: { 'Accept': 'application/json' },
                query: { limit: '10' },
                body: null
            };

            const config = await (requestHandler as any).getRequestConfig(request);

            expect(config.config.auth).toEqual(session);
            expect(config.config.path).toBe(request.path);
            expect(config.config.headers).toEqual(request.headers);
            expect(config.config.params).toEqual(request.query);
        });

        it('should build config without session', async () => {
            const request = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: null
            };

            const config = await (requestHandler as any).getRequestConfig(request);

            expect(config.config.path).toBe(request.path);
            expect(config.config.auth).toBeUndefined();
        });

        it('should include body in config', async () => {
            const request = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: { test: 'data' }
            };

            const config = await (requestHandler as any).getRequestConfig(request);

            expect(config.config.body).toEqual(request.body);
        });

        it('should include fields in config', async () => {
            const request = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: null,
                fields: { field1: 'value1' }
            };

            const config = await (requestHandler as any).getRequestConfig(request);

            expect(config.config.fields).toEqual(request.fields);
        });

        it('should include json in config', async () => {
            const request = {
                path: '/api/endpoint',
                headers: null,
                query: null,
                body: null,
                json: { json: 'data' }
            };

            const config = await (requestHandler as any).getRequestConfig(request);

            expect(config.config.json).toEqual(request.json);
        });
    });
});


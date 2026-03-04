/**
 * Unit tests for XMLRecordManager
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { createGetCredentialsMock, MockAuthenticationHandler } from '../../__mocks__/servicenow-sdk-mocks';
import { XMLRecordManager } from '../../../../src/sn/xml/XMLRecordManager';
import { IHttpResponse } from '../../../../src/comm/http/IHttpResponse';
import { AuthenticationHandlerFactory } from '../../../../src/auth/AuthenticationHandlerFactory';
import { RequestHandlerFactory } from '../../../../src/comm/http/RequestHandlerFactory';

// Mock getCredentials
const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

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

const SAMPLE_UNLOAD_XML = `<?xml version="1.0" encoding="UTF-8"?>
<unload unload_date="2026-03-04 15:40:36">
<incident action="INSERT_OR_UPDATE">
<sys_id>abc123def456</sys_id>
<short_description>Test incident</short_description>
<description>A test incident for unit tests</description>
</incident>
</unload>`;

const SAMPLE_CSRF_HTML = `<html><body>
<form>
<input name="sysparm_ck" id="sysparm_ck" type="hidden" value="csrf_token_12345">
<input type="submit" value="Upload">
</form>
</body></html>`;

function createRawResponse(data: string, status: number = 200, headers: Record<string, string> = {}): IHttpResponse<any> {
    return {
        data,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        headers,
        config: {},
        bodyObject: null
    } as IHttpResponse<any>;
}

describe('XMLRecordManager - Unit Tests', () => {
    let instance: ServiceNowInstance;
    let xmlMgr: XMLRecordManager;
    let mockAuthHandler: MockAuthenticationHandler;
    let mockRequestHandler: MockRequestHandler;

    beforeEach(async () => {
        jest.clearAllMocks();

        mockAuthHandler = new MockAuthenticationHandler();
        mockRequestHandler = new MockRequestHandler();

        jest.spyOn(AuthenticationHandlerFactory, 'createAuthHandler')
            .mockReturnValue(mockAuthHandler as unknown as ReturnType<typeof AuthenticationHandlerFactory.createAuthHandler>);
        jest.spyOn(RequestHandlerFactory, 'createRequestHandler')
            .mockReturnValue(mockRequestHandler as unknown as ReturnType<typeof RequestHandlerFactory.createRequestHandler>);

        const alias = 'test-instance';
        const credential = await mockGetCredentials(alias);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: alias,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            xmlMgr = new XMLRecordManager(instance);
        }
    });

    // ============================================================
    // Constructor
    // ============================================================

    describe('Constructor', () => {
        it('should create instance with ServiceNow instance', () => {
            expect(xmlMgr).toBeInstanceOf(XMLRecordManager);
        });
    });

    // ============================================================
    // exportRecord
    // ============================================================

    describe('exportRecord', () => {
        it('should export a record and return XML with parsed metadata', async () => {
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(SAMPLE_UNLOAD_XML)
            );

            const result = await xmlMgr.exportRecord({ table: 'incident', sysId: 'abc123def456' });

            expect(result.xml).toBe(SAMPLE_UNLOAD_XML);
            expect(result.table).toBe('incident');
            expect(result.sysId).toBe('abc123def456');
            expect(result.unloadDate).toBe('2026-03-04 15:40:36');
        });

        it('should use the correct endpoint path and query', async () => {
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(SAMPLE_UNLOAD_XML)
            );

            await xmlMgr.exportRecord({ table: 'kb_knowledge', sysId: 'xyz789' });

            const request = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(request.path).toBe('/kb_knowledge.do');
            expect(request.query).toEqual({
                UNL: '',
                sysparm_query: 'sys_id=xyz789'
            });
        });

        it('should throw error when table is empty', async () => {
            await expect(xmlMgr.exportRecord({ table: '', sysId: 'abc123' }))
                .rejects.toThrow('table is required');
        });

        it('should throw error when table is whitespace only', async () => {
            await expect(xmlMgr.exportRecord({ table: '   ', sysId: 'abc123' }))
                .rejects.toThrow('table is required');
        });

        it('should throw error when sysId is empty', async () => {
            await expect(xmlMgr.exportRecord({ table: 'incident', sysId: '' }))
                .rejects.toThrow('sysId is required');
        });

        it('should throw error when sysId is whitespace only', async () => {
            await expect(xmlMgr.exportRecord({ table: 'incident', sysId: '  ' }))
                .rejects.toThrow('sysId is required');
        });

        it('should throw error on non-200 response', async () => {
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse('', 500)
            );

            await expect(xmlMgr.exportRecord({ table: 'incident', sysId: 'abc123' }))
                .rejects.toThrow('Failed to export record');
        });

        it('should throw error when response data is null', async () => {
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(null as any, 200)
            );

            await expect(xmlMgr.exportRecord({ table: 'incident', sysId: 'abc123' }))
                .rejects.toThrow('Failed to export record');
        });

        it('should fall back to provided table/sysId when XML parsing fails', async () => {
            // Return non-XML content that will fail parsing
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse('this is not xml at all')
            );

            const result = await xmlMgr.exportRecord({ table: 'incident', sysId: 'abc123' });

            expect(result.xml).toBe('this is not xml at all');
            expect(result.table).toBe('incident');
            expect(result.sysId).toBe('abc123');
            expect(result.unloadDate).toBeUndefined();
        });

        it('should handle XML without unload_date attribute', async () => {
            const xmlNoDate = `<?xml version="1.0" encoding="UTF-8"?>
<unload>
<incident action="INSERT_OR_UPDATE">
<sys_id>abc123</sys_id>
</incident>
</unload>`;
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(xmlNoDate)
            );

            const result = await xmlMgr.exportRecord({ table: 'incident', sysId: 'abc123' });

            expect(result.table).toBe('incident');
            expect(result.sysId).toBe('abc123');
            expect(result.unloadDate).toBeUndefined();
        });

        it('should handle valid XML without unload root element', async () => {
            const nonUnloadXml = `<?xml version="1.0" encoding="UTF-8"?>
<root><data>not an unload format</data></root>`;
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(nonUnloadXml)
            );

            const result = await xmlMgr.exportRecord({ table: 'incident', sysId: 'abc123' });

            expect(result.xml).toBe(nonUnloadXml);
            expect(result.table).toBe('incident');
            expect(result.sysId).toBe('abc123');
            expect(result.unloadDate).toBeUndefined();
        });

        it('should handle XML with empty unload element', async () => {
            const emptyUnload = `<?xml version="1.0" encoding="UTF-8"?>
<unload unload_date="2026-03-04 15:40:36">
</unload>`;
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(emptyUnload)
            );

            const result = await xmlMgr.exportRecord({ table: 'incident', sysId: 'abc123' });

            // Falls back to provided values since no record element found
            expect(result.table).toBe('incident');
            expect(result.sysId).toBe('abc123');
            expect(result.unloadDate).toBe('2026-03-04 15:40:36');
        });
    });

    // ============================================================
    // importRecords
    // ============================================================

    describe('importRecords', () => {
        it('should import records successfully', async () => {
            // First GET: CSRF token
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(SAMPLE_CSRF_HTML)
            );
            // POST: upload
            mockRequestHandler.post.mockResolvedValueOnce(
                createRawResponse(undefined as any, 200)
            );

            const result = await xmlMgr.importRecords({
                xmlContent: SAMPLE_UNLOAD_XML,
                targetTable: 'incident'
            });

            expect(result.success).toBe(true);
            expect(result.targetTable).toBe('incident');
        });

        it('should fetch CSRF token from /upload.do', async () => {
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(SAMPLE_CSRF_HTML)
            );
            mockRequestHandler.post.mockResolvedValueOnce(
                createRawResponse(undefined as any, 200)
            );

            await xmlMgr.importRecords({
                xmlContent: SAMPLE_UNLOAD_XML,
                targetTable: 'incident'
            });

            const getRequest = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(getRequest.path).toBe('/upload.do');
        });

        it('should POST to /sys_upload.do with FormData body', async () => {
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(SAMPLE_CSRF_HTML)
            );
            mockRequestHandler.post.mockResolvedValueOnce(
                createRawResponse(undefined as any, 200)
            );

            await xmlMgr.importRecords({
                xmlContent: SAMPLE_UNLOAD_XML,
                targetTable: 'incident'
            });

            const postRequest = mockRequestHandler.post.mock.calls[0][0] as any;
            expect(postRequest.path).toBe('/sys_upload.do');
            expect(postRequest.body).toBeInstanceOf(FormData);
            expect(postRequest.headers).toEqual({});
        });

        it('should include correct form fields in upload', async () => {
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(SAMPLE_CSRF_HTML)
            );
            mockRequestHandler.post.mockResolvedValueOnce(
                createRawResponse(undefined as any, 200)
            );

            await xmlMgr.importRecords({
                xmlContent: SAMPLE_UNLOAD_XML,
                targetTable: 'kb_knowledge'
            });

            const postRequest = mockRequestHandler.post.mock.calls[0][0] as any;
            const formData: FormData = postRequest.body;

            expect(formData.get('sysparm_ck')).toBe('csrf_token_12345');
            expect(formData.get('sysparm_upload_prefix')).toBe('');
            expect(formData.get('sysparm_referring_url')).toBe('');
            expect(formData.get('sysparm_target')).toBe('kb_knowledge');
            expect(formData.get('attachFile')).toBeTruthy();
        });

        it('should throw error when xmlContent is empty', async () => {
            await expect(xmlMgr.importRecords({ xmlContent: '', targetTable: 'incident' }))
                .rejects.toThrow('xmlContent is required');
        });

        it('should throw error when xmlContent is whitespace only', async () => {
            await expect(xmlMgr.importRecords({ xmlContent: '   ', targetTable: 'incident' }))
                .rejects.toThrow('xmlContent is required');
        });

        it('should throw error when targetTable is empty', async () => {
            await expect(xmlMgr.importRecords({ xmlContent: SAMPLE_UNLOAD_XML, targetTable: '' }))
                .rejects.toThrow('targetTable is required');
        });

        it('should throw error when targetTable is whitespace only', async () => {
            await expect(xmlMgr.importRecords({ xmlContent: SAMPLE_UNLOAD_XML, targetTable: '  ' }))
                .rejects.toThrow('targetTable is required');
        });

        it('should throw error when CSRF token cannot be obtained', async () => {
            // Return page without sysparm_ck
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse('<html><body>No token here</body></html>')
            );

            await expect(xmlMgr.importRecords({
                xmlContent: SAMPLE_UNLOAD_XML,
                targetTable: 'incident'
            })).rejects.toThrow('Failed to obtain CSRF token');
        });

        it('should throw error when CSRF fetch returns non-200', async () => {
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse('', 403)
            );

            await expect(xmlMgr.importRecords({
                xmlContent: SAMPLE_UNLOAD_XML,
                targetTable: 'incident'
            })).rejects.toThrow('Failed to obtain CSRF token');
        });

        it('should throw error when CSRF fetch returns null data', async () => {
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(null as any, 200)
            );

            await expect(xmlMgr.importRecords({
                xmlContent: SAMPLE_UNLOAD_XML,
                targetTable: 'incident'
            })).rejects.toThrow('Failed to obtain CSRF token');
        });

        it('should throw error when upload POST returns non-200', async () => {
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(SAMPLE_CSRF_HTML)
            );
            mockRequestHandler.post.mockResolvedValueOnce(
                createRawResponse('', 500)
            );

            await expect(xmlMgr.importRecords({
                xmlContent: SAMPLE_UNLOAD_XML,
                targetTable: 'incident'
            })).rejects.toThrow('Failed to import records');
        });

        it('should include response body in result when available', async () => {
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(SAMPLE_CSRF_HTML)
            );
            mockRequestHandler.post.mockResolvedValueOnce(
                createRawResponse('<html>Upload complete</html>', 200)
            );

            const result = await xmlMgr.importRecords({
                xmlContent: SAMPLE_UNLOAD_XML,
                targetTable: 'incident'
            });

            expect(result.responseBody).toBe('<html>Upload complete</html>');
        });

        it('should handle undefined response body (redirect scenario)', async () => {
            mockRequestHandler.get.mockResolvedValueOnce(
                createRawResponse(SAMPLE_CSRF_HTML)
            );
            mockRequestHandler.post.mockResolvedValueOnce(
                createRawResponse(undefined as any, 200)
            );

            const result = await xmlMgr.importRecords({
                xmlContent: SAMPLE_UNLOAD_XML,
                targetTable: 'incident'
            });

            expect(result.success).toBe(true);
            expect(result.responseBody).toBeUndefined();
        });
    });
});

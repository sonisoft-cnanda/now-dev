import { Parser } from 'xml2js';
import { ServiceNowInstance } from '../ServiceNowInstance';
import { ServiceNowRequest } from '../../comm/http/ServiceNowRequest';
import { HTTPRequest } from '../../comm/http/HTTPRequest';
import { IHttpResponse } from '../../comm/http/IHttpResponse';
import { Logger } from '../../util/Logger';
import { CSRFTokenHelper } from '../../util/CSRFTokenHelper';
import {
    ExportRecordOptions,
    ExportRecordResult,
    ImportRecordsOptions,
    ImportRecordsResult
} from './XMLRecordModels';

const UPLOAD_ENDPOINT = '/upload.do';
const SYS_UPLOAD_ENDPOINT = '/sys_upload.do';

/**
 * Manages XML record export (unload) and import (upload) operations
 * against ServiceNow `.do` processor endpoints.
 */
export class XMLRecordManager {
    private _snRequest: ServiceNowRequest;
    private _logger: Logger = new Logger('XMLRecordManager');

    public constructor(instance: ServiceNowInstance) {
        this._snRequest = new ServiceNowRequest(instance);
    }

    /**
     * Export a single record as XML (ServiceNow unload format).
     *
     * @param options - Table name and sys_id of the record to export
     * @returns The raw XML string plus parsed metadata (table, sysId, unloadDate)
     */
    public async exportRecord(options: ExportRecordOptions): Promise<ExportRecordResult> {
        if (!options.table || !options.table.trim()) {
            throw new Error('table is required for exportRecord');
        }
        if (!options.sysId || !options.sysId.trim()) {
            throw new Error('sysId is required for exportRecord');
        }

        const path = `/${options.table}.do`;
        const request: HTTPRequest = {
            path,
            headers: null,
            query: {
                UNL: '',
                sysparm_query: `sys_id=${options.sysId}`
            },
            body: null
        };

        this._logger.debug(`Exporting record: ${options.table}/${options.sysId}`);
        const response: IHttpResponse<string> = await this._snRequest.get<string>(request);

        if (response.status !== 200 || !response.data) {
            throw new Error(
                `Failed to export record ${options.table}/${options.sysId}. ` +
                `Status: ${response.status}`
            );
        }

        const xml = response.data;
        const metadata = await this._parseUnloadXml(xml);

        return {
            xml,
            table: metadata.table || options.table,
            sysId: metadata.sysId || options.sysId,
            unloadDate: metadata.unloadDate
        };
    }

    /**
     * Import XML records into ServiceNow via the sys_upload.do processor.
     *
     * Acquires a CSRF token first, then POSTs a multipart form with the XML content.
     *
     * @param options - XML content and target table name
     * @returns Success status and the target table
     */
    public async importRecords(options: ImportRecordsOptions): Promise<ImportRecordsResult> {
        if (!options.xmlContent || !options.xmlContent.trim()) {
            throw new Error('xmlContent is required for importRecords');
        }
        if (!options.targetTable || !options.targetTable.trim()) {
            throw new Error('targetTable is required for importRecords');
        }

        // Step 1: Get CSRF token
        const csrfToken = await this._getUploadCSRFToken();
        if (!csrfToken) {
            throw new Error(
                'Failed to obtain CSRF token from /upload.do. ' +
                'This may indicate an authentication failure or insufficient permissions.'
            );
        }

        // Step 2: Build multipart form
        const formData = new FormData();
        formData.append('sysparm_ck', csrfToken);
        formData.append('sysparm_upload_prefix', '');
        formData.append('sysparm_referring_url', '');
        formData.append('sysparm_target', options.targetTable);

        const blob = new Blob([options.xmlContent], { type: 'text/xml' });
        formData.append('attachFile', blob, 'upload.xml');

        // Step 3: POST to sys_upload.do
        // Do NOT set Content-Type header — let fetch auto-set it with the multipart boundary
        const request: HTTPRequest = {
            path: SYS_UPLOAD_ENDPOINT,
            headers: {},
            query: null,
            body: formData
        };

        this._logger.debug(`Importing records to table: ${options.targetTable}`);
        const response: IHttpResponse<string> = await this._snRequest.post<string>(request);

        if (response.status !== 200) {
            throw new Error(
                `Failed to import records to ${options.targetTable}. ` +
                `Status: ${response.status}`
            );
        }

        return {
            success: true,
            targetTable: options.targetTable,
            responseBody: response.data || undefined
        };
    }

    /**
     * Fetch the CSRF token from /upload.do by parsing the sysparm_ck hidden input.
     */
    private async _getUploadCSRFToken(): Promise<string | null> {
        const request: HTTPRequest = {
            path: UPLOAD_ENDPOINT,
            headers: null,
            query: null,
            body: null
        };

        const response: IHttpResponse<string> = await this._snRequest.get<string>(request);

        if (response.status === 200 && response.data) {
            const token = CSRFTokenHelper.extractCSRFToken(response.data);
            this._logger.debug('CSRF Token Received', { token });
            return token;
        }

        this._logger.error('Failed to fetch CSRF token from /upload.do', { status: response.status });
        return null;
    }

    /**
     * Parse ServiceNow unload XML to extract metadata (table name, sys_id, unload_date).
     */
    private async _parseUnloadXml(xml: string): Promise<{ table?: string; sysId?: string; unloadDate?: string }> {
        try {
            const parser = new Parser({ explicitArray: false });
            const result = await new Promise<any>((resolve, reject) => {
                parser.parseString(xml, (err: Error | null, parsed: any) => {
                    if (err) reject(err);
                    else resolve(parsed);
                });
            });

            if (!result?.unload) {
                return {};
            }

            const unloadDate = result.unload.$?.unload_date;

            // Find the first child element that is the record (not $ which holds attributes)
            const recordKeys = Object.keys(result.unload).filter(k => k !== '$');
            if (recordKeys.length === 0) {
                return { unloadDate };
            }

            const tableName = recordKeys[0];
            const record = result.unload[tableName];
            const sysId = record?.sys_id;

            return { table: tableName, sysId, unloadDate };
        } catch (err) {
            this._logger.warn('Failed to parse unload XML for metadata', { error: err });
            return {};
        }
    }
}

import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { HTTPRequest } from "../../comm/http/HTTPRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import {
    AttachmentRecord,
    UploadAttachmentOptions,
    ListAttachmentsOptions,
    AttachmentResponse,
    AttachmentSingleResponse
} from './AttachmentModels';

/**
 * AttachmentManager provides methods for uploading, listing, and retrieving
 * attachments on ServiceNow records via the Attachment API.
 */
export class AttachmentManager {
    public static readonly ATTACHMENT_API_PATH = '/api/now/attachment';
    public static readonly ATTACHMENT_FILE_API_PATH = '/api/now/attachment/file';
    public static readonly ATTACHMENT_TABLE = 'sys_attachment';

    private _logger: Logger = new Logger("AttachmentManager");
    private _req: ServiceNowRequest;
    private _tableAPI: TableAPIRequest;
    private _instance: ServiceNowInstance;

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
        this._tableAPI = new TableAPIRequest(instance);
    }

    /**
     * Upload an attachment to a ServiceNow record.
     * POST to /api/now/attachment/file with multipart/form-data headers
     * and query params for table_name, table_sys_id, and file_name.
     */
    public async uploadAttachment(options: UploadAttachmentOptions): Promise<AttachmentRecord> {
        const { tableName, recordSysId, fileName, contentType, data } = options;

        this._logger.info(`Uploading attachment '${fileName}' to ${tableName}/${recordSysId}`);

        const query: Record<string, string> = {
            table_name: tableName,
            table_sys_id: recordSysId,
            file_name: fileName
        };

        const request: HTTPRequest = {
            path: AttachmentManager.ATTACHMENT_FILE_API_PATH,
            method: 'POST',
            headers: {
                'Content-Type': contentType,
                'Accept': 'application/json'
            },
            query: query,
            body: data
        };

        const response: IHttpResponse<AttachmentSingleResponse> = await this._req.post<AttachmentSingleResponse>(request);

        if (response && (response.status === 200 || response.status === 201) && response.bodyObject?.result) {
            this._logger.info(`Successfully uploaded attachment '${fileName}' with sys_id: ${response.bodyObject.result.sys_id}`);
            return response.bodyObject.result;
        }

        throw new Error(
            `Failed to upload attachment '${fileName}' to ${tableName}/${recordSysId}. Status: ${response?.status ?? 'unknown'}`
        );
    }

    /**
     * List attachments for a specific record.
     * Uses TableAPIRequest.get on sys_attachment with encoded query.
     */
    public async listAttachments(options: ListAttachmentsOptions): Promise<AttachmentRecord[]> {
        const { tableName, recordSysId, limit = 100 } = options;

        this._logger.info(`Listing attachments for ${tableName}/${recordSysId}`);

        const query: Record<string, string | number> = {
            sysparm_query: `table_name=${tableName}^table_sys_id=${recordSysId}`,
            sysparm_limit: limit
        };

        const response: IHttpResponse<AttachmentResponse> = await this._tableAPI.get<AttachmentResponse>(
            AttachmentManager.ATTACHMENT_TABLE,
            query
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Found ${response.bodyObject.result.length} attachments`);
            return response.bodyObject.result;
        }

        throw new Error(
            `Failed to list attachments for ${tableName}/${recordSysId}. Status: ${response?.status ?? 'unknown'}`
        );
    }

    /**
     * Get a single attachment record by sys_id.
     * Uses TableAPIRequest.get on sys_attachment with sys_id filter.
     */
    public async getAttachment(sysId: string): Promise<AttachmentRecord> {
        this._logger.info(`Getting attachment with sys_id: ${sysId}`);

        const query: Record<string, string | number> = {
            sysparm_query: `sys_id=${sysId}`,
            sysparm_limit: 1
        };

        const response: IHttpResponse<AttachmentResponse> = await this._tableAPI.get<AttachmentResponse>(
            AttachmentManager.ATTACHMENT_TABLE,
            query
        );

        if (response && response.status === 200 && response.bodyObject?.result && response.bodyObject.result.length > 0) {
            this._logger.info(`Found attachment: ${response.bodyObject.result[0].file_name}`);
            return response.bodyObject.result[0];
        }

        throw new Error(
            `Attachment with sys_id '${sysId}' not found. Status: ${response?.status ?? 'unknown'}`
        );
    }
}

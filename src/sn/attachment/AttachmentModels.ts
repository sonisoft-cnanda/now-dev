export interface AttachmentRecord {
    sys_id: string;
    file_name: string;
    table_name: string;
    table_sys_id: string;
    content_type: string;
    size_bytes?: string;
    sys_created_on?: string;
    [key: string]: unknown;
}

export interface UploadAttachmentOptions {
    tableName: string;
    recordSysId: string;
    fileName: string;
    contentType: string;
    data: Buffer | string;
}

export interface ListAttachmentsOptions {
    tableName: string;
    recordSysId: string;
    limit?: number;
}

export interface AttachmentResponse {
    result: AttachmentRecord[];
}

export interface AttachmentSingleResponse {
    result: AttachmentRecord;
}

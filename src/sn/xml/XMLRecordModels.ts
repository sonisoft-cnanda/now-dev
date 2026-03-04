/**
 * Options for exporting a single ServiceNow record as XML (unload).
 */
export interface ExportRecordOptions {
    /** The table name (e.g. 'incident', 'kb_knowledge') */
    table: string;
    /** The sys_id of the record to export */
    sysId: string;
}

/**
 * Result of an XML record export operation.
 */
export interface ExportRecordResult {
    /** The raw XML string returned by the platform */
    xml: string;
    /** The table name extracted from the XML envelope */
    table: string;
    /** The sys_id extracted from the XML record */
    sysId: string;
    /** The unload_date attribute from the XML envelope, if present */
    unloadDate?: string;
}

/**
 * Options for importing XML records into ServiceNow.
 */
export interface ImportRecordsOptions {
    /** The raw XML content to upload (ServiceNow unload format) */
    xmlContent: string;
    /** The target table name (e.g. 'kb_knowledge') */
    targetTable: string;
}

/**
 * Result of an XML record import operation.
 */
export interface ImportRecordsResult {
    /** Whether the upload request completed successfully (HTTP 200) */
    success: boolean;
    /** The target table the XML was uploaded to */
    targetTable: string;
    /** The raw response body from the upload confirmation page, if available */
    responseBody?: string;
}

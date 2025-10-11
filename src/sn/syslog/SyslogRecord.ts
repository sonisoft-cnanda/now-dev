/**
 * Represents a syslog record from the ServiceNow syslog table
 */
export interface SyslogRecord {
    /** System ID */
    sys_id: string;
    
    /** Created timestamp */
    sys_created_on: string;
    
    /** Message level (debug, info, warn, error) */
    level: string;
    
    /** Log message */
    message: string;
    
    /** Source of the log entry */
    source: string;
    
    /** User who triggered the log */
    sys_created_by?: string;
    
    /** Additional fields that may be present */
    [key: string]: unknown;
}

/**
 * Represents a syslog_app_scope record from ServiceNow
 */
export interface SyslogAppScopeRecord {
    /** System ID */
    sys_id: string;
    
    /** Created timestamp */
    sys_created_on: string;
    
    /** Message level (debug, info, warn, error) */
    level: string;
    
    /** Log message */
    message: string;
    
    /** Source of the log entry */
    source: string;
    
    /** Application scope */
    app_scope: string;
    
    /** Application name */
    app_name?: string;
    
    /** User who triggered the log */
    sys_created_by?: string;
    
    /** Additional fields that may be present */
    [key: string]: unknown;
}

/**
 * Response from syslog table query
 */
export interface SyslogResponse {
    result: SyslogRecord[];
}

/**
 * Response from syslog_app_scope table query
 */
export interface SyslogAppScopeResponse {
    result: SyslogAppScopeRecord[];
}

/**
 * Options for formatting syslog output
 */
export interface SyslogFormatOptions {
    /** Fields to display in the output */
    fields?: string[];
    
    /** Maximum width for message field */
    maxMessageWidth?: number;
    
    /** Whether to include headers in the output */
    includeHeaders?: boolean;
    
    /** Date format for timestamps */
    dateFormat?: 'iso' | 'locale' | 'relative';
}

/**
 * Options for tailing syslog
 */
export interface SyslogTailOptions {
    /** Polling interval in milliseconds */
    interval?: number;
    
    /** Number of initial records to fetch */
    initialLimit?: number;
    
    /** Encoded query string to filter logs */
    query?: string;
    
    /** Callback function for each new log entry */
    onLog?: (log: SyslogRecord | SyslogAppScopeRecord) => void;
    
    /** Format options for output */
    formatOptions?: SyslogFormatOptions;
    
    /** File path to write logs to (optional) */
    outputFile?: string;
    
    /** Whether to append to existing file */
    append?: boolean;
}


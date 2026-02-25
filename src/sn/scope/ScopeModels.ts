// ============================================================
// Application/Scope Record Types
// ============================================================

/**
 * A record from the sys_app table.
 */
export interface ApplicationRecord {
    /** System ID */
    sys_id: string;

    /** Application name */
    name: string;

    /** Application scope (e.g., "x_myapp") */
    scope?: string;

    /** Application version */
    version?: string;

    /** Whether the application is active */
    active?: string;

    /** Additional fields */
    [key: string]: unknown;
}

// ============================================================
// Result Types
// ============================================================

/**
 * Result of setting the current application scope.
 */
export interface SetCurrentApplicationResult {
    /** Whether the operation was successful */
    success: boolean;

    /** Application name */
    application: string;

    /** Application scope */
    scope: string;

    /** Application sys_id */
    sysId: string;

    /** The previously active scope before the change */
    previousScope?: {
        sys_id?: string;
        name?: string;
    };

    /** Whether the scope change was verified */
    verified: boolean;

    /** Any warnings generated during the operation */
    warnings: string[];
}

// ============================================================
// Options Types
// ============================================================

/**
 * Options for listing applications.
 */
export interface ListApplicationsOptions {
    /** Encoded query string for filtering */
    encodedQuery?: string;

    /** Maximum number of records to return */
    limit?: number;
}

// ============================================================
// ServiceNow Response Wrappers
// ============================================================

/**
 * Response wrapper for multiple application records.
 */
export interface ApplicationResponse {
    result: ApplicationRecord[];
}

/**
 * Response wrapper for a single application record.
 */
export interface ApplicationSingleResponse {
    result: ApplicationRecord;
}

/**
 * Response from the UI preferences API for the current application.
 */
export interface CurrentApplicationResponse {
    result: ApplicationRecord;
}

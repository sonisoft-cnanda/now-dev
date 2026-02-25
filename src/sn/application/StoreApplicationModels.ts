import { APP_TAB_CONTEXT } from './ApplicationManager';
import { ApplicationDetailModel } from './ApplicationDetailModel';

// ============================================================
// Search / List Applications
// ============================================================

/**
 * Options for searching/listing store applications.
 */
export interface StoreAppSearchOptions {
    /** Required: Tab context filter */
    tabContext: APP_TAB_CONTEXT;

    /** Optional: Search keyword to filter applications */
    searchKey?: string;

    /** Optional: Maximum number of results (default: 10,000) */
    limit?: number;

    /** Optional: Pagination offset (default: 0) */
    offset?: number;

    /** Optional: Request body for POST /apps endpoint (for advanced filtering) */
    requestBody?: Record<string, unknown>;
}

/**
 * Response wrapper from POST /api/sn_appclient/appmanager/apps
 */
export interface StoreAppSearchResponse {
    result: StoreAppSearchResult;
}

/**
 * The result payload inside the search response.
 */
export interface StoreAppSearchResult {
    apps: ApplicationDetailModel[];
    total?: number;
}

// ============================================================
// Install / Update Application
// ============================================================

/**
 * Options for installing a store application.
 */
export interface StoreAppInstallOptions {
    /** Required: The app_id (source app id) of the application */
    appId: string;

    /** Required: The version to install */
    version: string;

    /** Optional: Customization version to apply */
    customizationVersion?: string;

    /** Optional: Whether to load demo data */
    loadDemoData?: boolean;
}

/**
 * Options for updating a store application.
 */
export interface StoreAppUpdateOptions {
    /** Required: The app_id (source app id) of the application */
    appId: string;

    /** Required: The version to update to */
    version: string;

    /** Optional: Customization version to apply */
    customizationVersion?: string;

    /** Optional: Whether to load demo data */
    loadDemoData?: boolean;
}

/**
 * Response from store app install or update.
 */
export interface StoreAppOperationResponse {
    result: StoreAppOperationResult;
}

/**
 * Result of initiating an install or update operation.
 */
export interface StoreAppOperationResult {
    /** Tracker ID for monitoring progress (snake_case variant) */
    tracker_id?: string;

    /** Tracker ID for monitoring progress (camelCase variant) */
    trackerId?: string;

    /** Status of the initiated operation */
    status?: string;

    /** Any message from the server */
    message?: string;

    /** Links (may include progress link) */
    links?: {
        progress?: {
            id: string;
            url: string;
        };
    };
}

/**
 * Final result after an install/update operation completes.
 */
export interface StoreAppFinalResult {
    /** Whether the operation completed successfully */
    success: boolean;

    /** Final status */
    status: string;

    /** Status label */
    status_label: string;

    /** Status message */
    status_message: string;

    /** Error message if any */
    error?: string;

    /** Completion percentage */
    percent_complete: number;
}

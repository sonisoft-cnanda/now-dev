// ============================================================
// Options Types
// ============================================================

/**
 * Options for listing tables on the instance.
 */
export interface ListTablesOptions {
    /** Encoded query to filter tables */
    query?: string;

    /** Filter by name prefix (e.g., "cmdb_" to get all CMDB tables) */
    namePrefix?: string;

    /** Filter by scope (application scope sys_id or name) */
    scope?: string;

    /** Only return extendable tables. Defaults to false. */
    extendableOnly?: boolean;

    /** Maximum number of results. Defaults to 100. */
    limit?: number;

    /** Offset for pagination. Defaults to 0. */
    offset?: number;

    /** Fields to return (maps to sysparm_fields). Defaults to common fields. */
    fields?: string[];
}

/**
 * Options for listing scoped applications.
 */
export interface ListScopedAppsOptions {
    /** Encoded query to filter applications */
    query?: string;

    /** Filter by scope name prefix */
    namePrefix?: string;

    /** Only return active applications. Defaults to false. */
    activeOnly?: boolean;

    /** Maximum number of results. Defaults to 100. */
    limit?: number;

    /** Offset for pagination. Defaults to 0. */
    offset?: number;
}

/**
 * Options for listing store applications.
 */
export interface ListStoreAppsOptions {
    /** Encoded query to filter store applications */
    query?: string;

    /** Filter by name prefix */
    namePrefix?: string;

    /** Only return active (installed) applications. Defaults to false. */
    activeOnly?: boolean;

    /** Maximum number of results. Defaults to 100. */
    limit?: number;

    /** Offset for pagination. Defaults to 0. */
    offset?: number;
}

/**
 * Options for listing plugins.
 */
export interface ListPluginsOptions {
    /** Encoded query to filter plugins */
    query?: string;

    /** Filter by name prefix */
    namePrefix?: string;

    /** Only return active plugins. Defaults to false. */
    activeOnly?: boolean;

    /** Maximum number of results. Defaults to 100. */
    limit?: number;

    /** Offset for pagination. Defaults to 0. */
    offset?: number;
}

// ============================================================
// Record Types
// ============================================================

/**
 * A table definition record from sys_db_object.
 */
export interface TableDefinition {
    /** System ID */
    sys_id: string;

    /** Table name */
    name: string;

    /** Display label */
    label?: string;

    /** Parent table reference */
    super_class?: string | { link: string; value: string; display_value?: string };

    /** Application scope */
    sys_scope?: string | { link: string; value: string; display_value?: string };

    /** Whether the table is extendable */
    is_extendable?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * A scoped application record from sys_app.
 */
export interface ScopedAppRecord {
    /** System ID */
    sys_id: string;

    /** Application name */
    name: string;

    /** Application scope */
    scope?: string;

    /** Version */
    version?: string;

    /** Whether active */
    active?: string;

    /** Vendor */
    vendor?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * A store application record from sys_store_app.
 */
export interface StoreAppRecord {
    /** System ID */
    sys_id: string;

    /** Application name */
    name: string;

    /** Application scope */
    scope?: string;

    /** Version */
    version?: string;

    /** Whether active */
    active?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * A plugin record from v_plugin.
 */
export interface PluginRecord {
    /** System ID */
    sys_id: string;

    /** Plugin ID */
    id?: string;

    /** Plugin display name */
    name?: string;

    /** Whether active */
    active?: string;

    /** Version */
    version?: string;

    /** Additional fields */
    [key: string]: unknown;
}

// ============================================================
// Response Wrappers
// ============================================================

/** Response from sys_db_object query. */
export interface TableDefinitionResponse {
    result: TableDefinition[];
}

/** Response from sys_app query. */
export interface ScopedAppResponse {
    result: ScopedAppRecord[];
}

/** Response from sys_store_app query. */
export interface StoreAppResponse {
    result: StoreAppRecord[];
}

/** Response from v_plugin query. */
export interface PluginResponse {
    result: PluginRecord[];
}

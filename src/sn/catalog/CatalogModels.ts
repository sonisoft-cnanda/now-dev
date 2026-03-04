/**
 * Models for Service Catalog management operations against ServiceNow tables:
 * sc_cat_item, sc_category, and item_option_new.
 */

// ============================================================
// Record Types
// ============================================================

/**
 * A catalog item record from the sc_cat_item table.
 */
export interface CatalogItemRecord {
    sys_id: string;
    name: string;
    short_description?: string;
    description?: string;
    category?: string;
    price?: string;
    active?: string;
    order?: string;
    sys_scope?: string;
    sc_catalogs?: string;
    type?: string;
    [key: string]: unknown;
}

/**
 * A catalog category record from the sc_category table.
 */
export interface CatalogCategoryRecord {
    sys_id: string;
    title: string;
    description?: string;
    parent?: string;
    sc_catalog?: string;
    active?: string;
    order?: string;
    icon?: string;
    header_icon?: string;
    [key: string]: unknown;
}

/**
 * A catalog variable record from the item_option_new table.
 * Includes an enriched friendly_type field mapped from the numeric type code.
 */
export interface CatalogVariableRecord {
    sys_id: string;
    name: string;
    question_text?: string;
    type?: string;
    mandatory?: string;
    default_value?: string;
    help_text?: string;
    order?: string;
    reference?: string;
    reference_qual?: string;
    choice_table?: string;
    choice_field?: string;
    cat_item?: string;
    variable_set?: string;
    /** Human-readable variable type name mapped from the numeric type code */
    friendly_type?: string;
    [key: string]: unknown;
}

/**
 * A record from the io_set_item table linking variable sets to catalog items.
 */
export interface VariableSetItemRecord {
    sys_id: string;
    sc_cat_item: string;
    variable_set: string;
    [key: string]: unknown;
}

// ============================================================
// Options Types
// ============================================================

/**
 * Options for listing catalog items.
 */
export interface ListCatalogItemsOptions {
    /** Encoded query string for filtering */
    query?: string;
    /** Text search term (searches name and short_description) */
    textSearch?: string;
    /** Filter by category sys_id */
    categorySysId?: string;
    /** Filter by catalog sys_id */
    catalogSysId?: string;
    /** Filter by active status */
    active?: boolean;
    /** Maximum number of records to return (default 20) */
    limit?: number;
    /** Offset for pagination (default 0) */
    offset?: number;
}

/**
 * Options for listing catalog categories.
 */
export interface ListCatalogCategoriesOptions {
    /** Filter by parent category sys_id */
    parentSysId?: string;
    /** Filter by catalog sys_id */
    catalogSysId?: string;
    /** Filter by active status */
    active?: boolean;
    /** Filter by title (exact match) */
    title?: string;
    /** Encoded query string for additional filtering */
    query?: string;
    /** Maximum number of records (default 20) */
    limit?: number;
    /** Offset for pagination (default 0) */
    offset?: number;
}

/**
 * Options for listing catalog item variables.
 */
export interface ListCatalogVariablesOptions {
    /** The catalog item sys_id (required) */
    catalogItemSysId: string;
    /** Include variables from variable sets (default true) */
    includeVariableSets?: boolean;
}

/**
 * Options for submitting a catalog request via order_now.
 */
export interface SubmitCatalogRequestOptions {
    /** The catalog item sys_id (required) */
    catalogItemSysId: string;
    /** Quantity to order (default 1) */
    quantity?: number;
    /** Variable name-value pairs */
    variables?: Record<string, string>;
}

// ============================================================
// Result Types
// ============================================================

/**
 * Enriched catalog item detail including its variables.
 */
export interface CatalogItemDetail {
    item: CatalogItemRecord;
    variables: CatalogVariableRecord[];
}

/**
 * Enriched catalog category detail including item count.
 */
export interface CatalogCategoryDetail {
    category: CatalogCategoryRecord;
    itemCount: number;
}

/**
 * Result from submitting a catalog request, including both REQ and RITM.
 */
export interface CatalogRequestResult {
    requestNumber: string;
    requestSysId: string;
    requestItemNumber?: string;
    requestItemSysId?: string;
}

// ============================================================
// ServiceNow Response Wrappers
// ============================================================

export interface CatalogItemResponse {
    result: CatalogItemRecord[];
}

export interface CatalogCategoryResponse {
    result: CatalogCategoryRecord[];
}

export interface CatalogVariableResponse {
    result: CatalogVariableRecord[];
}

export interface VariableSetItemResponse {
    result: VariableSetItemRecord[];
}

export interface CatalogOrderResponse {
    result: {
        sys_id: string;
        number: string;
        request_number: string;
        request_id: string;
        table: string;
    };
}

export interface RequestItemResponse {
    result: Array<{
        sys_id: string;
        number: string;
        [key: string]: unknown;
    }>;
}

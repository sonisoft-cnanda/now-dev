// ============================================================
// Options Types
// ============================================================

/**
 * Options for discovering a table schema.
 */
export interface TableSchemaOptions {
    /** Include internal type codes from sys_dictionary */
    includeTypeCodes?: boolean;

    /** Include choice tables (sys_choice) for fields with choices */
    includeChoiceTables?: boolean;

    /** Include relationship information */
    includeRelationships?: boolean;

    /** Include UI policies */
    includeUIPolicies?: boolean;

    /** Include business rules */
    includeBusinessRules?: boolean;
}

// ============================================================
// Schema Types
// ============================================================

/**
 * Schema information for a single field.
 */
export interface FieldSchema {
    /** Internal field name */
    name: string;

    /** Display label */
    label: string;

    /** Internal type (e.g., "string", "integer", "reference") */
    internalType: string;

    /** Maximum length for the field */
    maxLength: number;

    /** Whether the field is mandatory */
    mandatory: boolean;

    /** Whether the field is read-only */
    readOnly: boolean;

    /** Reference table name (for reference fields) */
    referenceTable?: string;

    /** Default value for the field */
    defaultValue?: string;
}

/**
 * Schema for a ServiceNow table.
 */
export interface TableSchema {
    /** Table name */
    table: string;

    /** Display label of the table */
    label: string;

    /** Super class (parent table) if any */
    superClass?: string;

    /** Array of field schemas */
    fields: FieldSchema[];

    /** Choice tables data (if includeChoiceTables was true) */
    choiceTables?: Array<{
        field: string;
        choices: Array<{ label: string; value: string }>;
    }>;

    /** Relationship data (if includeRelationships was true) */
    relationships?: Array<{
        name: string;
        type: string;
        relatedTable: string;
    }>;

    /** UI policies (if includeUIPolicies was true) */
    uiPolicies?: Array<{
        sys_id: string;
        short_description: string;
        active: boolean;
    }>;

    /** Business rules (if includeBusinessRules was true) */
    businessRules?: Array<{
        sys_id: string;
        name: string;
        when: string;
        active: boolean;
    }>;
}

// ============================================================
// Field Explanation Types
// ============================================================

/**
 * Detailed explanation of a field.
 */
export interface FieldExplanation {
    /** Internal field name */
    field: string;

    /** Table the field belongs to */
    table: string;

    /** Display label */
    label: string;

    /** Internal type */
    type: string;

    /** Maximum length */
    maxLength: number;

    /** Whether the field is mandatory */
    mandatory: boolean;

    /** Whether the field is read-only */
    readOnly: boolean;

    /** Comments/description of the field */
    comments?: string;

    /** Help text for the field */
    help?: string;

    /** Reference table (for reference fields) */
    referenceTable?: string;

    /** Available choices (for choice fields) */
    choices?: Array<{ label: string; value: string }>;
}

// ============================================================
// Validation Types
// ============================================================

/**
 * A single validation issue found during catalog configuration validation.
 */
export interface ValidationIssue {
    /** Severity of the issue */
    severity: 'error' | 'warning';

    /** Component type where the issue was found */
    component: string;

    /** sys_id of the component (if applicable) */
    sys_id?: string;

    /** Description of the issue */
    issue: string;

    /** Suggested fix */
    fix?: string;
}

/**
 * Result of validating a catalog configuration.
 */
export interface CatalogValidationResult {
    /** Whether the configuration is valid (no errors) */
    valid: boolean;

    /** Array of validation issues */
    issues: ValidationIssue[];

    /** Count of warnings */
    warnings: number;

    /** Count of errors */
    errors: number;
}

// ============================================================
// ServiceNow Response Wrappers
// ============================================================

/**
 * Record from the sys_db_object table.
 */
export interface SysDbObjectRecord {
    /** System ID */
    sys_id: string;

    /** Table name */
    name: string;

    /** Display label */
    label?: string;

    /** Super class (parent table) reference */
    super_class?: string | { link: string; value: string; display_value?: string };

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * Response wrapper for sys_db_object query.
 */
export interface SysDbObjectResponse {
    result: SysDbObjectRecord[];
}

/**
 * Record from the sys_dictionary table.
 */
export interface SysDictionaryRecord {
    /** System ID */
    sys_id: string;

    /** Table name */
    name: string;

    /** Field element name */
    element: string;

    /** Display label (column_label) */
    column_label?: string;

    /** Internal type */
    internal_type?: string | { link: string; value: string; display_value?: string };

    /** Maximum length */
    max_length?: string;

    /** Whether the field is mandatory */
    mandatory?: string;

    /** Whether the field is read-only */
    read_only?: string;

    /** Reference table */
    reference?: string | { link: string; value: string; display_value?: string };

    /** Default value */
    default_value?: string;

    /** Comments */
    comments?: string;

    /** Help text */
    help?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * Response wrapper for sys_dictionary query.
 */
export interface SysDictionaryResponse {
    result: SysDictionaryRecord[];
}

/**
 * Record from the sys_choice table.
 */
export interface SysChoiceRecord {
    /** System ID */
    sys_id: string;

    /** Table name */
    name: string;

    /** Field element name */
    element: string;

    /** Choice label */
    label: string;

    /** Choice value */
    value: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * Response wrapper for sys_choice query.
 */
export interface SysChoiceResponse {
    result: SysChoiceRecord[];
}

/**
 * Record from the catalog item options (item_option_new) table.
 */
export interface CatalogItemOptionRecord {
    /** System ID */
    sys_id: string;

    /** Variable name */
    name?: string;

    /** Question text */
    question_text?: string;

    /** Variable type */
    type?: string;

    /** Whether the variable is mandatory */
    mandatory?: string;

    /** Catalog item reference */
    cat_item?: string;

    /** Order */
    order?: string;

    /** Active flag */
    active?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * Response wrapper for catalog item option query.
 */
export interface CatalogItemOptionResponse {
    result: CatalogItemOptionRecord[];
}

/**
 * Record from the catalog_ui_policy table.
 */
export interface CatalogUIPolicyRecord {
    /** System ID */
    sys_id: string;

    /** Short description */
    short_description?: string;

    /** Catalog item reference */
    catalog_item?: string;

    /** Active flag */
    active?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * Response wrapper for catalog UI policy query.
 */
export interface CatalogUIPolicyResponse {
    result: CatalogUIPolicyRecord[];
}

# SchemaDiscovery

The `SchemaDiscovery` class provides operations for discovering ServiceNow table schemas, explaining individual fields, and validating catalog item configurations.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Related](#related)

## Overview

The `SchemaDiscovery` enables you to:

- Discover the full schema of any ServiceNow table (fields, types, constraints)
- Optionally include choice values, relationships, UI policies, and business rules
- Explain a specific field with its type, constraints, help text, and available choices
- Validate catalog item configurations for common issues
- Identify errors and warnings in catalog variables and UI policies

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, SchemaDiscovery } from '@sonisoft/now-sdk-ext-core';

const schema = new SchemaDiscovery(instance);
```

## Methods

### discoverTableSchema

Discover the schema for a ServiceNow table. Queries `sys_db_object` for table metadata and `sys_dictionary` for field definitions. Optionally includes choice values, relationships, UI policies, and business rules.

```typescript
async discoverTableSchema(
    tableName: string,
    options?: TableSchemaOptions
): Promise<TableSchema>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tableName` | `string` | - | The name of the table to discover |
| `options` | `TableSchemaOptions` | `{}` | Optional flags to include additional information |

#### TableSchemaOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeTypeCodes` | `boolean` | `false` | Include internal type codes from sys_dictionary |
| `includeChoiceTables` | `boolean` | `false` | Include choice values for fields with choices |
| `includeRelationships` | `boolean` | `false` | Include relationship information (reference fields) |
| `includeUIPolicies` | `boolean` | `false` | Include UI policies defined on the table |
| `includeBusinessRules` | `boolean` | `false` | Include business rules defined on the table |

#### Returns

`Promise<TableSchema>` containing:
- `table`: Table name
- `label`: Display label
- `superClass`: Parent table (if any)
- `fields`: Array of `FieldSchema` objects
- `choiceTables`: Choice values grouped by field (if requested)
- `relationships`: Reference field relationships (if requested)
- `uiPolicies`: UI policies on the table (if requested)
- `businessRules`: Business rules on the table (if requested)

#### Throws

- `Error` if `tableName` is empty
- `Error` if the table is not found in `sys_db_object`

#### Example

```typescript
const tableSchema = await schema.discoverTableSchema('incident', {
    includeChoiceTables: true,
    includeRelationships: true
});

console.log(`Table: ${tableSchema.label} (${tableSchema.table})`);
console.log(`Parent: ${tableSchema.superClass || 'none'}`);
console.log(`Fields: ${tableSchema.fields.length}`);

for (const field of tableSchema.fields) {
    const mandatory = field.mandatory ? ' [required]' : '';
    console.log(`  ${field.label} (${field.name}): ${field.internalType}${mandatory}`);
}
```

---

### explainField

Explain a specific field on a table. Queries `sys_dictionary` for the field definition and `sys_choice` for available choices.

```typescript
async explainField(tableName: string, fieldName: string): Promise<FieldExplanation>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `tableName` | `string` | The table containing the field |
| `fieldName` | `string` | The field name to explain |

#### Returns

`Promise<FieldExplanation>` containing:
- `field`: Internal field name
- `table`: Table the field belongs to
- `label`: Display label
- `type`: Internal type (e.g., `"string"`, `"integer"`, `"reference"`)
- `maxLength`: Maximum length
- `mandatory`: Whether the field is mandatory
- `readOnly`: Whether the field is read-only
- `comments`: Comments/description (if available)
- `help`: Help text (if available)
- `referenceTable`: Referenced table name (for reference fields)
- `choices`: Array of `{ label, value }` (for choice fields)

#### Throws

- `Error` if `tableName` or `fieldName` is empty
- `Error` if the field is not found on the table

#### Example

```typescript
const explanation = await schema.explainField('incident', 'state');

console.log(`Field: ${explanation.label} (${explanation.field})`);
console.log(`Type: ${explanation.type}`);
console.log(`Mandatory: ${explanation.mandatory}`);
console.log(`Read Only: ${explanation.readOnly}`);

if (explanation.choices) {
    console.log('Choices:');
    for (const choice of explanation.choices) {
        console.log(`  ${choice.value} = ${choice.label}`);
    }
}

if (explanation.referenceTable) {
    console.log(`References: ${explanation.referenceTable}`);
}
```

---

### validateCatalogConfiguration

Validate a catalog item configuration. Checks variables (`item_option_new`) and UI policies (`catalog_ui_policy`) for integrity issues such as missing names, duplicate variable names, missing question text, and inactive mandatory variables.

```typescript
async validateCatalogConfiguration(catalogItemSysId: string): Promise<CatalogValidationResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `catalogItemSysId` | `string` | The sys_id of the catalog item to validate |

#### Returns

`Promise<CatalogValidationResult>` containing:
- `valid`: `true` if no errors were found
- `issues`: Array of `ValidationIssue` objects
- `warnings`: Count of warning-level issues
- `errors`: Count of error-level issues

#### Throws

- `Error` if `catalogItemSysId` is empty

#### Example

```typescript
const result = await schema.validateCatalogConfiguration('catalog-item-sys-id');

console.log(`Valid: ${result.valid}`);
console.log(`Errors: ${result.errors}, Warnings: ${result.warnings}`);

for (const issue of result.issues) {
    const icon = issue.severity === 'error' ? '[ERROR]' : '[WARN]';
    console.log(`${icon} ${issue.component}: ${issue.issue}`);
    if (issue.fix) {
        console.log(`  Fix: ${issue.fix}`);
    }
}
```

## Interfaces

### TableSchemaOptions

```typescript
interface TableSchemaOptions {
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
```

### FieldSchema

```typescript
interface FieldSchema {
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
```

### TableSchema

```typescript
interface TableSchema {
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
```

### FieldExplanation

```typescript
interface FieldExplanation {
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
```

### ValidationIssue

```typescript
interface ValidationIssue {
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
```

### CatalogValidationResult

```typescript
interface CatalogValidationResult {
    /** Whether the configuration is valid (no errors) */
    valid: boolean;

    /** Array of validation issues */
    issues: ValidationIssue[];

    /** Count of warnings */
    warnings: number;

    /** Count of errors */
    errors: number;
}
```

### SysDbObjectRecord

```typescript
interface SysDbObjectRecord {
    /** System ID */
    sys_id: string;

    /** Table name */
    name: string;

    /** Display label */
    label?: string;

    /** Super class (parent table) reference */
    super_class?: string | { link: string; value: string; display_value?: string };
}
```

### SysDictionaryRecord

```typescript
interface SysDictionaryRecord {
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
}
```

### SysChoiceRecord

```typescript
interface SysChoiceRecord {
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
}
```

### CatalogItemOptionRecord

```typescript
interface CatalogItemOptionRecord {
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
}
```

### CatalogUIPolicyRecord

```typescript
interface CatalogUIPolicyRecord {
    /** System ID */
    sys_id: string;

    /** Short description */
    short_description?: string;

    /** Catalog item reference */
    catalog_item?: string;

    /** Active flag */
    active?: string;
}
```

## Examples

### Example 1: Full Schema Discovery

```typescript
async function discoverIncidentSchema() {
    const schema = new SchemaDiscovery(instance);

    const tableSchema = await schema.discoverTableSchema('incident', {
        includeChoiceTables: true,
        includeRelationships: true,
        includeUIPolicies: true,
        includeBusinessRules: true
    });

    console.log(`\n=== ${tableSchema.label} (${tableSchema.table}) ===`);
    if (tableSchema.superClass) {
        console.log(`Extends: ${tableSchema.superClass}`);
    }

    console.log(`\nFields (${tableSchema.fields.length}):`);
    for (const field of tableSchema.fields) {
        const flags = [];
        if (field.mandatory) flags.push('required');
        if (field.readOnly) flags.push('read-only');
        if (field.referenceTable) flags.push(`-> ${field.referenceTable}`);
        const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
        console.log(`  ${field.label} (${field.name}): ${field.internalType}${flagStr}`);
    }

    if (tableSchema.relationships && tableSchema.relationships.length > 0) {
        console.log(`\nRelationships (${tableSchema.relationships.length}):`);
        for (const rel of tableSchema.relationships) {
            console.log(`  ${rel.name} -> ${rel.relatedTable}`);
        }
    }

    if (tableSchema.businessRules && tableSchema.businessRules.length > 0) {
        console.log(`\nBusiness Rules (${tableSchema.businessRules.length}):`);
        for (const rule of tableSchema.businessRules) {
            const status = rule.active ? 'active' : 'inactive';
            console.log(`  ${rule.name} (${rule.when}, ${status})`);
        }
    }
}
```

### Example 2: Field Deep Dive

```typescript
async function explainChoiceField() {
    const schema = new SchemaDiscovery(instance);

    const explanation = await schema.explainField('incident', 'priority');

    console.log(`\n=== ${explanation.label} ===`);
    console.log(`Table: ${explanation.table}`);
    console.log(`Type: ${explanation.type}`);
    console.log(`Max Length: ${explanation.maxLength}`);
    console.log(`Mandatory: ${explanation.mandatory}`);

    if (explanation.comments) {
        console.log(`Description: ${explanation.comments}`);
    }

    if (explanation.choices) {
        console.log(`\nAvailable Values:`);
        for (const choice of explanation.choices) {
            console.log(`  ${choice.value} - ${choice.label}`);
        }
    }
}
```

### Example 3: Catalog Item Validation

```typescript
async function validateCatalog() {
    const schema = new SchemaDiscovery(instance);

    const result = await schema.validateCatalogConfiguration('catalog-item-sys-id');

    if (result.valid) {
        console.log('Catalog item configuration is valid.');
    } else {
        console.log(`Catalog validation failed: ${result.errors} error(s), ${result.warnings} warning(s)`);
    }

    for (const issue of result.issues) {
        if (issue.severity === 'error') {
            console.error(`  ERROR (${issue.component}): ${issue.issue}`);
        } else {
            console.warn(`  WARNING (${issue.component}): ${issue.issue}`);
        }
        if (issue.fix) {
            console.log(`    Suggested fix: ${issue.fix}`);
        }
    }
}
```

### Example 4: Compare Table Schemas

```typescript
async function compareSchemas() {
    const schema = new SchemaDiscovery(instance);

    const incidentSchema = await schema.discoverTableSchema('incident');
    const changeSchema = await schema.discoverTableSchema('change_request');

    const incidentFields = new Set(incidentSchema.fields.map(f => f.name));
    const changeFields = new Set(changeSchema.fields.map(f => f.name));

    const shared = [...incidentFields].filter(f => changeFields.has(f));
    const incidentOnly = [...incidentFields].filter(f => !changeFields.has(f));
    const changeOnly = [...changeFields].filter(f => !incidentFields.has(f));

    console.log(`Shared fields: ${shared.length}`);
    console.log(`Incident-only fields: ${incidentOnly.length}`);
    console.log(`Change-only fields: ${changeOnly.length}`);
}
```

### Example 5: Find All Mandatory Reference Fields

```typescript
async function findMandatoryReferences() {
    const schema = new SchemaDiscovery(instance);

    const tableSchema = await schema.discoverTableSchema('incident', {
        includeRelationships: true
    });

    const mandatoryRefs = tableSchema.fields.filter(
        f => f.mandatory && f.referenceTable
    );

    console.log('Mandatory reference fields on incident:');
    for (const field of mandatoryRefs) {
        console.log(`  ${field.label} (${field.name}) -> ${field.referenceTable}`);
    }
}
```

## Best Practices

1. **Request Only What You Need**: Use `TableSchemaOptions` flags selectively -- each flag triggers additional API calls
2. **Cache Schema Results**: Table schemas rarely change; consider caching `discoverTableSchema()` results in long-running processes
3. **Validate Before Deployment**: Run `validateCatalogConfiguration()` before promoting catalog items to production
4. **Use explainField for Details**: When you need full detail on a single field including choices, use `explainField()` instead of discovering the entire table
5. **Handle Missing Tables Gracefully**: Wrap `discoverTableSchema()` in try/catch to handle tables that may not exist on all instances
6. **Check Inherited Fields**: The `superClass` property tells you if a table extends another; query the parent table to see inherited fields

## Related

- [Getting Started Guide](./GettingStarted.md)
- [Application Manager](./ApplicationManager.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)

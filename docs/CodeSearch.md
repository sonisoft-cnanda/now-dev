# CodeSearch

The `CodeSearch` class provides functionality for searching code across the ServiceNow platform using the Code Search REST API and Table API.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Related](#related)

## Overview

The `CodeSearch` enables you to:

- Search for code across the entire ServiceNow platform
- Narrow searches to a specific application scope
- Narrow searches to a specific table within a search group
- Retrieve raw hierarchical results or flattened, easy-to-consume results
- List available code search groups
- List tables within a search group
- Add new tables to existing search groups
- Format search results as plain text for CLI output

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, CodeSearch } from '@sonisoft/now-sdk-ext-core';

const codeSearch = new CodeSearch(instance);
```

## Methods

### search

Search across the ServiceNow platform for code matching a given term. Returns a flattened array of results for easy consumption.

```typescript
async search(options: CodeSearchOptions): Promise<CodeSearchResult[]>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `CodeSearchOptions` | Search options including the required search term |

#### Returns

`Promise<CodeSearchResult[]>` - A flattened array where each entry represents one field match in one record.

#### Throws

- `Error` if `term` is empty
- `Error` if `table` is specified without `search_group`

#### Example

```typescript
const results = await codeSearch.search({ term: 'GlideRecord' });

for (const result of results) {
    console.log(`${result.tableLabel} > ${result.name} > ${result.fieldLabel}`);
    console.log(`  Matches: ${result.matchCount}`);
}
```

---

### searchRaw

Search and return the raw hierarchical response from the API. Results are grouped by record type, then by hit, then by field match.

```typescript
async searchRaw(options: CodeSearchOptions): Promise<CodeSearchRecordTypeResult[]>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `CodeSearchOptions` | Search options including the required search term |

#### Returns

`Promise<CodeSearchRecordTypeResult[]>` - An array of record type groups, each containing hits with field matches.

#### Throws

- `Error` if `term` is empty
- `Error` if `table` is specified without `search_group`

#### Example

```typescript
const rawResults = await codeSearch.searchRaw({ term: 'GlideRecord', limit: 50 });

for (const group of rawResults) {
    console.log(`Record Type: ${group.tableLabel} (${group.recordType})`);
    console.log(`  Hits: ${group.hits.length}`);
}
```

---

### searchInApp

Search for code within a specific application scope. Convenience method that sets `current_app` and `search_all_scopes=false`.

```typescript
async searchInApp(
    term: string,
    appScope: string,
    additionalOptions?: Omit<CodeSearchOptions, 'term' | 'current_app' | 'search_all_scopes'>
): Promise<CodeSearchResult[]>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `term` | `string` | The search term |
| `appScope` | `string` | The application scope to search within (e.g., `"x_myapp"`) |
| `additionalOptions` | `Omit<CodeSearchOptions, ...>` | Optional additional search options |

#### Returns

`Promise<CodeSearchResult[]>` - Flattened results scoped to the specified application.

#### Example

```typescript
const results = await codeSearch.searchInApp('getUserRoles', 'x_myapp');

console.log(`Found ${results.length} matches in x_myapp`);
```

---

### searchInTable

Search for code within a specific table. Convenience method that sets `table` and `search_group`.

```typescript
async searchInTable(
    term: string,
    tableName: string,
    searchGroup: string,
    additionalOptions?: Omit<CodeSearchOptions, 'term' | 'table' | 'search_group'>
): Promise<CodeSearchResult[]>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `term` | `string` | The search term |
| `tableName` | `string` | The table to search in |
| `searchGroup` | `string` | The search group name (required when searching by table) |
| `additionalOptions` | `Omit<CodeSearchOptions, ...>` | Optional additional search options |

#### Returns

`Promise<CodeSearchResult[]>` - Flattened results from the specified table.

#### Example

```typescript
const results = await codeSearch.searchInTable(
    'GlideRecord',
    'sys_script_include',
    'sn_global_search'
);

for (const result of results) {
    console.log(`${result.name}: ${result.matchCount} matches`);
}
```

---

### getTablesForSearchGroup

List the tables that would be searched for a given search group. Uses the Code Search REST API endpoint.

```typescript
async getTablesForSearchGroup(searchGroup: string): Promise<CodeSearchTable[]>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `searchGroup` | `string` | The search group NAME |

#### Returns

`Promise<CodeSearchTable[]>` - Array of table entries with `name` and optional `label`.

#### Throws

- `Error` if `searchGroup` is empty

#### Example

```typescript
const tables = await codeSearch.getTablesForSearchGroup('sn_global_search');

for (const table of tables) {
    console.log(`${table.label || table.name} (${table.name})`);
}
```

---

### getSearchGroups

List all available code search groups. Queries the `sn_codesearch_search_group` table via Table API.

```typescript
async getSearchGroups(options?: CodeSearchGroupQueryOptions): Promise<CodeSearchGroup[]>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options` | `CodeSearchGroupQueryOptions` | `{}` | Optional query and limit options |

#### Returns

`Promise<CodeSearchGroup[]>` - Array of search group records including `sys_id`, `name`, and `description`.

#### Example

```typescript
const groups = await codeSearch.getSearchGroups();

for (const group of groups) {
    console.log(`${group.name} (${group.sys_id})`);
    if (group.description) {
        console.log(`  ${group.description}`);
    }
}
```

---

### addTableToSearchGroup

Add a new table to an existing code search group. Inserts a record into the `sn_codesearch_table` table via Table API POST.

```typescript
async addTableToSearchGroup(options: AddCodeSearchTableOptions): Promise<CodeSearchTableRecord>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `AddCodeSearchTableOptions` | The table name, search fields, and search group sys_id |

#### Returns

`Promise<CodeSearchTableRecord>` - The created record including its `sys_id`.

#### Throws

- `Error` if `table`, `search_fields`, or `search_group` is empty

#### Example

```typescript
const record = await codeSearch.addTableToSearchGroup({
    table: 'sys_script_include',
    search_fields: 'script,name',
    search_group: 'abc123def456'
});

console.log(`Added table with sys_id: ${record.sys_id}`);
```

---

### getTableRecordsForSearchGroup

List table records for a search group from the `sn_codesearch_table` table. Unlike `getTablesForSearchGroup()` which returns `{name, label}` from the REST API, this method uses the Table API and returns full records including `sys_id`.

```typescript
async getTableRecordsForSearchGroup(
    searchGroupSysId: string,
    options?: CodeSearchGroupQueryOptions
): Promise<CodeSearchTableRecord[]>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `searchGroupSysId` | `string` | - | The sys_id of the search group |
| `options` | `CodeSearchGroupQueryOptions` | `{}` | Optional query and limit options |

#### Returns

`Promise<CodeSearchTableRecord[]>` - Array of full table records including `sys_id`, `table`, `search_fields`, and `search_group`.

#### Throws

- `Error` if `searchGroupSysId` is empty

#### Example

```typescript
const tableRecords = await codeSearch.getTableRecordsForSearchGroup('abc123def456');

for (const rec of tableRecords) {
    console.log(`${rec.table} - fields: ${rec.search_fields} (${rec.sys_id})`);
}
```

---

### flattenResults (static)

Flatten the hierarchical search API response into a simple array of results. Each entry represents one field match in one record.

```typescript
static flattenResults(rawResults: CodeSearchRecordTypeResult[]): CodeSearchResult[]
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `rawResults` | `CodeSearchRecordTypeResult[]` | The raw record type results from `searchRaw()` |

#### Returns

`CodeSearchResult[]` - Flattened array of results.

#### Example

```typescript
const rawResults = await codeSearch.searchRaw({ term: 'GlideRecord' });
const flattened = CodeSearch.flattenResults(rawResults);

console.log(`Total field matches: ${flattened.length}`);
```

---

### formatResultsAsText (static)

Format flattened search results as a plain text summary. Useful for CLI output.

```typescript
static formatResultsAsText(results: CodeSearchResult[]): string
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `results` | `CodeSearchResult[]` | Flattened search results from `search()` |

#### Returns

`string` - Formatted multi-line text summary.

#### Example

```typescript
const results = await codeSearch.search({ term: 'GlideRecord' });
const text = CodeSearch.formatResultsAsText(results);

console.log(text);
// Output:
// Found 5 matches:
//
//   Script Includes > MyUtils > Script
//     Table: sys_script_include, Field: script, Matches: 3
//       L12: var gr = new GlideRecord('incident');
//       ...
```

## Interfaces

### CodeSearchOptions

```typescript
interface CodeSearchOptions {
    /** The term to search for (required) */
    term: string;

    /** The Search Group NAME to search within (not the sys_id) */
    search_group?: string;

    /** The specific table to search in (requires search_group) */
    table?: string;

    /** When false, limits results to the scope specified by current_app. Defaults to true */
    search_all_scopes?: boolean;

    /** Limits results to the specified application scope */
    current_app?: string;

    /** When true, returns additional fields with match context */
    extended_matching?: boolean;

    /** Maximum number of results to return */
    limit?: number;
}
```

### CodeSearchGroupQueryOptions

```typescript
interface CodeSearchGroupQueryOptions {
    /** Encoded query string for filtering search groups */
    encodedQuery?: string;

    /** Maximum number of records to return (default: 100) */
    limit?: number;
}
```

### CodeSearchResult

```typescript
interface CodeSearchResult {
    /** The table name where the match was found */
    table: string;

    /** Display label of the table */
    tableLabel: string;

    /** The name of the record containing the match */
    name: string;

    /** The field name where the match was found */
    field: string;

    /** Display label of the field */
    fieldLabel: string;

    /** Array of line matches within this field */
    lineMatches: CodeSearchLineMatch[];

    /** Total number of line matches in this field */
    matchCount: number;

    /** First matching line's context (convenience for display) */
    firstMatchContext: string;

    /** First matching line number */
    firstMatchLine: number;
}
```

### CodeSearchLineMatch

```typescript
interface CodeSearchLineMatch {
    /** Line number of the match */
    line: number;

    /** The matching line content / context snippet */
    context: string;

    /** HTML-escaped version of the context */
    escaped?: string;
}
```

### CodeSearchFieldMatch

```typescript
interface CodeSearchFieldMatch {
    /** The field name where the match was found (e.g., "script") */
    field: string;

    /** Display label of the field (e.g., "Script") */
    fieldLabel: string;

    /** Array of individual line matches within this field */
    lineMatches: CodeSearchLineMatch[];
}
```

### CodeSearchHit

```typescript
interface CodeSearchHit {
    /** The name/label of the record */
    name: string;

    /** The table name (className) of the record */
    className: string;

    /** Display label of the table */
    tableLabel: string;

    /** Array of field matches within this record */
    matches: CodeSearchFieldMatch[];
}
```

### CodeSearchRecordTypeResult

```typescript
interface CodeSearchRecordTypeResult {
    /** The table name / record type (e.g., "sys_script_include") */
    recordType: string;

    /** Display label of the table (e.g., "Script Includes") */
    tableLabel: string;

    /** Array of record hits within this record type */
    hits: CodeSearchHit[];
}
```

### CodeSearchTable

```typescript
interface CodeSearchTable {
    /** Table name (e.g., "sys_script_include") */
    name: string;

    /** Display label of the table */
    label?: string;
}
```

### CodeSearchGroup

```typescript
interface CodeSearchGroup {
    /** System ID */
    sys_id: string;

    /** Search group name -- used in the search_group parameter */
    name: string;

    /** Description of the search group */
    description?: string;

    /** Whether extended matching is enabled */
    extended_matching?: string;

    /** Sys scope */
    sys_scope?: string | { link: string; value: string };

    /** Created timestamp */
    sys_created_on?: string;

    /** Updated timestamp */
    sys_updated_on?: string;
}
```

### AddCodeSearchTableOptions

```typescript
interface AddCodeSearchTableOptions {
    /** Table name to add (e.g., "sys_script_include") */
    table: string;

    /** Comma-separated fields to search (e.g., "script,name") */
    search_fields: string;

    /** sys_id of the target code search group */
    search_group: string;
}
```

### CodeSearchTableRecord

```typescript
interface CodeSearchTableRecord {
    /** System ID of this table record */
    sys_id: string;

    /** The table name (e.g., "sys_script_include") */
    table: string;

    /** Comma-separated search fields (e.g., "script,name") */
    search_fields: string;

    /** Reference (sys_id) to the search group */
    search_group: string | { link: string; value: string };

    /** Created timestamp */
    sys_created_on?: string;

    /** Updated timestamp */
    sys_updated_on?: string;
}
```

## Examples

### Example 1: Platform-Wide Code Search

```typescript
async function searchPlatform() {
    const codeSearch = new CodeSearch(instance);

    const results = await codeSearch.search({ term: 'current.state' });

    console.log(CodeSearch.formatResultsAsText(results));
}
```

### Example 2: Search Within an Application Scope

```typescript
async function searchAppScope() {
    const codeSearch = new CodeSearch(instance);

    const results = await codeSearch.searchInApp('getUserRoles', 'x_acme_hr');

    console.log(`Found ${results.length} matches in x_acme_hr`);
    for (const result of results) {
        console.log(`  ${result.name} (${result.table}.${result.field}): ${result.matchCount} hits`);
    }
}
```

### Example 3: Discover Search Groups and Their Tables

```typescript
async function discoverSearchGroups() {
    const codeSearch = new CodeSearch(instance);

    const groups = await codeSearch.getSearchGroups();

    for (const group of groups) {
        console.log(`\nGroup: ${group.name}`);
        if (group.description) {
            console.log(`  Description: ${group.description}`);
        }

        const tables = await codeSearch.getTablesForSearchGroup(group.name);
        for (const table of tables) {
            console.log(`  - ${table.label || table.name}`);
        }
    }
}
```

### Example 4: Add a Custom Table to a Search Group

```typescript
async function addCustomTable() {
    const codeSearch = new CodeSearch(instance);

    // Find the target search group
    const groups = await codeSearch.getSearchGroups({
        encodedQuery: 'name=sn_global_search'
    });

    if (groups.length === 0) {
        console.error('Search group not found');
        return;
    }

    // Add a custom table
    const record = await codeSearch.addTableToSearchGroup({
        table: 'u_custom_scripts',
        search_fields: 'script,name,description',
        search_group: groups[0].sys_id
    });

    console.log(`Added table u_custom_scripts (${record.sys_id})`);

    // Verify the table was added
    const tableRecords = await codeSearch.getTableRecordsForSearchGroup(groups[0].sys_id);
    console.log(`Search group now has ${tableRecords.length} tables`);
}
```

### Example 5: Targeted Table Search with Raw Results

```typescript
async function deepTableSearch() {
    const codeSearch = new CodeSearch(instance);

    const rawResults = await codeSearch.searchRaw({
        term: 'GlideAggregate',
        search_group: 'sn_global_search',
        table: 'sys_script_include',
        extended_matching: true,
        limit: 100
    });

    for (const group of rawResults) {
        console.log(`\n=== ${group.tableLabel} ===`);
        for (const hit of group.hits) {
            console.log(`  Record: ${hit.name}`);
            for (const match of hit.matches) {
                console.log(`    Field: ${match.fieldLabel}`);
                for (const lm of match.lineMatches) {
                    console.log(`      Line ${lm.line}: ${lm.context}`);
                }
            }
        }
    }
}
```

## Best Practices

1. **Use Flattened Results for Display**: Prefer `search()` over `searchRaw()` for CLI output and simple integrations; use `searchRaw()` only when you need the full hierarchical structure
2. **Scope Your Searches**: Use `searchInApp()` or `searchInTable()` to narrow results and improve performance
3. **Provide search_group with table**: The API requires `search_group` when specifying a `table` -- omitting it will throw an error
4. **Set Reasonable Limits**: Use the `limit` option to cap result counts, especially on large instances
5. **Use formatResultsAsText for CLI**: The static `formatResultsAsText()` method provides well-structured output suitable for terminal display
6. **Distinguish Table Listing Methods**: Use `getTablesForSearchGroup()` (by name) for quick lookups and `getTableRecordsForSearchGroup()` (by sys_id) when you need full records with sys_id

## Related

- [Getting Started Guide](./GettingStarted.md)
- [Application Manager](./ApplicationManager.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)

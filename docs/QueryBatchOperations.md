# QueryBatchOperations

The `QueryBatchOperations` class provides query-based bulk update and delete operations against ServiceNow tables. Records are found by encoded query, then updated or deleted in bulk with a built-in dry-run mode for safe previewing.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Related](#related)

## Overview

The `QueryBatchOperations` class enables you to:

- Bulk update records matching a ServiceNow encoded query
- Bulk delete records matching a ServiceNow encoded query
- Preview changes safely with dry-run mode (enabled by default)
- Limit the number of affected records with a configurable cap (default 200, max 10000)
- Monitor progress via an optional callback
- Retrieve detailed results including match counts, execution counts, and errors

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, QueryBatchOperations } from '@sonisoft/now-sdk-ext-core';

const queryBatch = new QueryBatchOperations(instance);
```

## Methods

### queryUpdate

Find records matching an encoded query and update them with the provided field data. Defaults to dry-run mode (`confirm=false`), which returns the match count without executing any changes.

```typescript
async queryUpdate(options: QueryUpdateOptions): Promise<QueryUpdateResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `QueryUpdateOptions` | Query update configuration including table, query, data, and execution flags |

#### QueryUpdateOptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `table` | `string` | - | Table to update records in (required) |
| `query` | `string` | - | ServiceNow encoded query to find matching records (required) |
| `data` | `Record<string, unknown>` | - | Field data to apply to all matching records (required) |
| `confirm` | `boolean` | `false` | When `true`, executes the update. When `false`, performs a dry run |
| `limit` | `number` | `200` | Maximum number of records to update (max: 10000) |
| `onProgress` | `(message: string) => void` | - | Optional callback invoked periodically during execution |

#### Returns

`Promise<QueryUpdateResult>` containing:
- `dryRun`: Whether this was a dry run or live execution
- `matchCount`: Number of records matching the query
- `updatedCount`: Number of records successfully updated (0 if dry run)
- `success`: `true` if all matched records were updated without error (or if dry run)
- `errors`: Array of error details with sys_id and error message
- `executionTimeMs`: Total execution time in milliseconds

#### Throws

- `Error` if `table` is empty or missing
- `Error` if `query` is empty or missing
- `Error` if `data` is empty or missing

#### Example

```typescript
// Step 1: Dry run to preview affected records
const preview = await queryBatch.queryUpdate({
    table: 'incident',
    query: 'priority=1^state=1',
    data: { state: '2', assigned_to: 'admin' }
});

console.log(`Dry run: ${preview.matchCount} records would be updated`);

// Step 2: Execute the update
const result = await queryBatch.queryUpdate({
    table: 'incident',
    query: 'priority=1^state=1',
    data: { state: '2', assigned_to: 'admin' },
    confirm: true
});

console.log(`Updated ${result.updatedCount}/${result.matchCount} records`);
```

---

### queryDelete

Find records matching an encoded query and delete them. Defaults to dry-run mode (`confirm=false`), which returns the match count without executing any deletions.

```typescript
async queryDelete(options: QueryDeleteOptions): Promise<QueryDeleteResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `QueryDeleteOptions` | Query delete configuration including table, query, and execution flags |

#### QueryDeleteOptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `table` | `string` | - | Table to delete records from (required) |
| `query` | `string` | - | ServiceNow encoded query to find matching records (required) |
| `confirm` | `boolean` | `false` | When `true`, executes the delete. When `false`, performs a dry run |
| `limit` | `number` | `200` | Maximum number of records to delete (max: 10000) |
| `onProgress` | `(message: string) => void` | - | Optional callback invoked periodically during execution |

#### Returns

`Promise<QueryDeleteResult>` containing:
- `dryRun`: Whether this was a dry run or live execution
- `matchCount`: Number of records matching the query
- `deletedCount`: Number of records successfully deleted (0 if dry run)
- `success`: `true` if all matched records were deleted without error (or if dry run)
- `errors`: Array of error details with sys_id and error message
- `executionTimeMs`: Total execution time in milliseconds

#### Throws

- `Error` if `table` is empty or missing
- `Error` if `query` is empty or missing

#### Example

```typescript
// Step 1: Dry run to see how many records match
const preview = await queryBatch.queryDelete({
    table: 'sys_audit',
    query: 'sys_created_on<javascript:gs.daysAgoStart(90)'
});

console.log(`Dry run: ${preview.matchCount} records would be deleted`);

// Step 2: Execute the delete
const result = await queryBatch.queryDelete({
    table: 'sys_audit',
    query: 'sys_created_on<javascript:gs.daysAgoStart(90)',
    confirm: true,
    limit: 1000
});

console.log(`Deleted ${result.deletedCount}/${result.matchCount} records`);
```

## Interfaces

### QueryUpdateOptions

```typescript
interface QueryUpdateOptions {
    /** The table to update records in (required) */
    table: string;

    /** Encoded query to find matching records (required) */
    query: string;

    /** The field data to apply to all matching records (required) */
    data: Record<string, unknown>;

    /**
     * When true, actually executes the update.
     * When false (default), performs a dry run and returns match count only.
     */
    confirm?: boolean;

    /**
     * Maximum number of records to update.
     * Defaults to 200. Maximum allowed: 10000.
     */
    limit?: number;

    /** Optional progress callback invoked periodically */
    onProgress?: (message: string) => void;
}
```

### QueryDeleteOptions

```typescript
interface QueryDeleteOptions {
    /** The table to delete records from (required) */
    table: string;

    /** Encoded query to find matching records (required) */
    query: string;

    /**
     * When true, actually executes the delete.
     * When false (default), performs a dry run and returns match count only.
     */
    confirm?: boolean;

    /**
     * Maximum number of records to delete.
     * Defaults to 200. Maximum allowed: 10000.
     */
    limit?: number;

    /** Optional progress callback invoked periodically */
    onProgress?: (message: string) => void;
}
```

### QueryUpdateResult

```typescript
interface QueryUpdateResult {
    /** Whether this was a dry run or live execution */
    dryRun: boolean;

    /** Number of records that matched the query */
    matchCount: number;

    /** Number of records successfully updated (0 if dry run) */
    updatedCount: number;

    /** True if all matched records were updated without error (or if dry run) */
    success: boolean;

    /** Details of any errors encountered during execution */
    errors: Array<{
        sysId: string;
        error: string;
    }>;

    /** Total execution time in milliseconds */
    executionTimeMs: number;
}
```

### QueryDeleteResult

```typescript
interface QueryDeleteResult {
    /** Whether this was a dry run or live execution */
    dryRun: boolean;

    /** Number of records that matched the query */
    matchCount: number;

    /** Number of records successfully deleted (0 if dry run) */
    deletedCount: number;

    /** True if all matched records were deleted without error (or if dry run) */
    success: boolean;

    /** Details of any errors encountered during execution */
    errors: Array<{
        sysId: string;
        error: string;
    }>;

    /** Total execution time in milliseconds */
    executionTimeMs: number;
}
```

### QueryMatchResponse

```typescript
interface QueryMatchResponse {
    result: Array<{ sys_id: string; [key: string]: unknown }>;
}
```

## Examples

### Example 1: Safe Dry-Run-Then-Execute Pattern

```typescript
import { ServiceNowInstance, QueryBatchOperations } from '@sonisoft/now-sdk-ext-core';

async function closeResolvedIncidents(instance: ServiceNowInstance) {
    const queryBatch = new QueryBatchOperations(instance);

    // Dry run first
    const preview = await queryBatch.queryUpdate({
        table: 'incident',
        query: 'state=6^resolved_atRELATIVELE@dayofweek@ago@7',
        data: { state: '7', close_code: 'Solved (Permanently)', close_notes: 'Auto-closed after 7 days' }
    });

    console.log(`Preview: ${preview.matchCount} resolved incidents older than 7 days`);

    if (preview.matchCount === 0) {
        console.log('No records to update.');
        return;
    }

    // Execute
    const result = await queryBatch.queryUpdate({
        table: 'incident',
        query: 'state=6^resolved_atRELATIVELE@dayofweek@ago@7',
        data: { state: '7', close_code: 'Solved (Permanently)', close_notes: 'Auto-closed after 7 days' },
        confirm: true,
        onProgress: (msg) => console.log(`[Progress] ${msg}`)
    });

    console.log(`Closed ${result.updatedCount} incidents in ${result.executionTimeMs}ms`);
}
```

### Example 2: Bulk Delete Old Records

```typescript
async function purgeOldAuditRecords(instance: ServiceNowInstance) {
    const queryBatch = new QueryBatchOperations(instance);

    const preview = await queryBatch.queryDelete({
        table: 'sys_audit',
        query: 'sys_created_on<javascript:gs.daysAgoStart(180)',
        limit: 5000
    });

    console.log(`Found ${preview.matchCount} audit records older than 180 days`);

    if (preview.matchCount > 0) {
        const result = await queryBatch.queryDelete({
            table: 'sys_audit',
            query: 'sys_created_on<javascript:gs.daysAgoStart(180)',
            confirm: true,
            limit: 5000,
            onProgress: (msg) => console.log(msg)
        });

        console.log(`\n=== Purge Results ===`);
        console.log(`Deleted: ${result.deletedCount}/${result.matchCount}`);
        console.log(`Errors: ${result.errors.length}`);
        console.log(`Time: ${result.executionTimeMs}ms`);
    }
}
```

### Example 3: Bulk Reassign with Progress Tracking

```typescript
async function reassignIncidents(
    instance: ServiceNowInstance,
    fromGroup: string,
    toGroup: string
) {
    const queryBatch = new QueryBatchOperations(instance);

    const result = await queryBatch.queryUpdate({
        table: 'incident',
        query: `assignment_group=${fromGroup}^state!=7`,
        data: { assignment_group: toGroup },
        confirm: true,
        limit: 500,
        onProgress: (message) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${message}`);
        }
    });

    if (result.success) {
        console.log(`Successfully reassigned ${result.updatedCount} incidents`);
    } else {
        console.error(`Completed with ${result.errors.length} errors:`);
        result.errors.forEach(e => {
            console.error(`  Record ${e.sysId}: ${e.error}`);
        });
    }
}
```

### Example 4: CI/CD Cleanup Script

```typescript
async function cleanupTestData(instance: ServiceNowInstance) {
    const queryBatch = new QueryBatchOperations(instance);
    const tables = ['incident', 'change_request', 'problem'];

    for (const table of tables) {
        const preview = await queryBatch.queryDelete({
            table,
            query: 'short_descriptionLIKE[TEST]',
            limit: 1000
        });

        console.log(`${table}: ${preview.matchCount} test records found`);

        if (preview.matchCount > 0) {
            const result = await queryBatch.queryDelete({
                table,
                query: 'short_descriptionLIKE[TEST]',
                confirm: true,
                limit: 1000
            });

            console.log(`  Deleted: ${result.deletedCount}, Errors: ${result.errors.length}`);
        }
    }
}
```

## Best Practices

1. **Always Dry Run First**: The default `confirm=false` behavior is intentional. Preview match counts before executing destructive operations.
2. **Use Specific Queries**: Broad queries can match thousands of records. Always test your encoded query in ServiceNow first to verify expected results.
3. **Set Appropriate Limits**: The default limit of 200 provides a safety net. Increase it deliberately when you know the expected record count.
4. **Monitor Progress**: For large operations, use the `onProgress` callback to track execution and detect failures early.
5. **Handle Partial Failures**: Even when some records fail to update or delete, the operation continues. Always check `result.errors` for details.
6. **Be Cautious with Deletes**: Deleted records cannot be recovered. Use dry-run mode and verify the match count before setting `confirm: true`.
7. **Respect the 10000 Record Cap**: The maximum limit of 10000 is enforced to prevent runaway operations. For larger datasets, run multiple passes.

## Related

- [BatchOperations](./BatchOperations.md)
- [Getting Started Guide](./GettingStarted.md)
- [Application Manager](./ApplicationManager.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)

# BatchOperations

The `BatchOperations` class provides batch create and update operations against ServiceNow tables with optional transactional behavior and variable reference resolution between operations.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Related](#related)

## Overview

The `BatchOperations` class enables you to:

- Execute multiple record creation operations sequentially in a single batch
- Execute multiple record update operations sequentially in a single batch
- Use variable references (`${saveAs}`) to pass created sys_ids between create operations
- Enable transactional behavior that stops on the first error
- Monitor progress via an optional callback
- Retrieve detailed results including timing, counts, and error details

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, BatchOperations } from '@sonisoft/now-sdk-ext-core';

const batchOps = new BatchOperations(instance);
```

## Methods

### batchCreate

Execute a batch of create operations sequentially. Supports variable references: if an operation specifies a `saveAs` key, later operations can reference `${saveAs}` in their data values to substitute the created sys_id.

```typescript
async batchCreate(options: BatchCreateOptions): Promise<BatchCreateResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `BatchCreateOptions` | Batch create configuration including operations list, transaction flag, and progress callback |

#### BatchCreateOptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `operations` | `BatchCreateOperation[]` | - | Ordered list of create operations to execute |
| `transaction` | `boolean` | `true` | When `true`, stops on first error. When `false`, continues past errors |
| `onProgress` | `(message: string) => void` | - | Optional callback invoked after each operation |

#### BatchCreateOperation

| Field | Type | Description |
|-------|------|-------------|
| `table` | `string` | Target table name (e.g., `"incident"`, `"sys_user"`) |
| `data` | `Record<string, unknown>` | Field data for the new record |
| `saveAs` | `string` | Optional key to save the created sys_id under for later reference via `${key}` |

#### Returns

`Promise<BatchCreateResult>` containing:
- `success`: `true` if all operations completed without error
- `createdCount`: Number of records successfully created
- `sysIds`: Map of `saveAs` keys to their created sys_ids
- `errors`: Array of error details with operation index, table, and error message
- `executionTimeMs`: Total execution time in milliseconds

#### Example

```typescript
const result = await batchOps.batchCreate({
    operations: [
        {
            table: 'sys_user_group',
            data: { name: 'New Support Group', description: 'Tier 2 Support' },
            saveAs: 'groupId'
        },
        {
            table: 'incident',
            data: { short_description: 'Server outage', assignment_group: '${groupId}' }
        }
    ],
    transaction: true
});

console.log(`Created ${result.createdCount} records in ${result.executionTimeMs}ms`);
console.log(`Group sys_id: ${result.sysIds['groupId']}`);
```

---

### batchUpdate

Execute a batch of update operations sequentially.

```typescript
async batchUpdate(options: BatchUpdateOptions): Promise<BatchUpdateResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `BatchUpdateOptions` | Batch update configuration including updates list, stopOnError flag, and progress callback |

#### BatchUpdateOptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `updates` | `BatchUpdateOperation[]` | - | Ordered list of update operations to execute |
| `stopOnError` | `boolean` | `false` | When `true`, stops on first error. When `false`, continues past errors |
| `onProgress` | `(message: string) => void` | - | Optional callback invoked after each operation |

#### BatchUpdateOperation

| Field | Type | Description |
|-------|------|-------------|
| `table` | `string` | Target table name |
| `sysId` | `string` | Sys ID of the record to update |
| `data` | `Record<string, unknown>` | Field data to apply to the record |

#### Returns

`Promise<BatchUpdateResult>` containing:
- `success`: `true` if all updates completed without error
- `updatedCount`: Number of records successfully updated
- `errors`: Array of error details with update index, table, sys_id, and error message
- `executionTimeMs`: Total execution time in milliseconds

#### Example

```typescript
const result = await batchOps.batchUpdate({
    updates: [
        { table: 'incident', sysId: 'inc-001', data: { state: '2', priority: '1' } },
        { table: 'incident', sysId: 'inc-002', data: { state: '2', priority: '1' } },
        { table: 'incident', sysId: 'inc-003', data: { state: '2', priority: '1' } }
    ],
    stopOnError: false,
    onProgress: (msg) => console.log(msg)
});

console.log(`Updated ${result.updatedCount} records`);
if (!result.success) {
    console.error(`Errors: ${result.errors.length}`);
}
```

## Interfaces

### BatchCreateOperation

```typescript
interface BatchCreateOperation {
    /** The target table name (e.g., "incident", "sys_user") */
    table: string;

    /** The field data to create the record with */
    data: Record<string, unknown>;

    /**
     * Optional key to save the resulting sys_id under.
     * Other operations can reference this via ${saveAs} in their data values.
     */
    saveAs?: string;
}
```

### BatchCreateOptions

```typescript
interface BatchCreateOptions {
    /** The ordered list of create operations to execute */
    operations: BatchCreateOperation[];

    /**
     * When true (default), stops on first error (transactional behavior).
     * When false, continues past errors.
     */
    transaction?: boolean;

    /** Optional progress callback invoked after each operation */
    onProgress?: (message: string) => void;
}
```

### BatchCreateResult

```typescript
interface BatchCreateResult {
    /** True if all operations completed without error */
    success: boolean;

    /** Number of records successfully created */
    createdCount: number;

    /** Map of saveAs keys to their created sys_ids */
    sysIds: Record<string, string>;

    /** Details of any errors encountered */
    errors: Array<{
        operationIndex: number;
        table: string;
        error: string;
    }>;

    /** Total execution time in milliseconds */
    executionTimeMs: number;
}
```

### BatchUpdateOperation

```typescript
interface BatchUpdateOperation {
    /** The target table name */
    table: string;

    /** The sys_id of the record to update */
    sysId: string;

    /** The field data to update */
    data: Record<string, unknown>;
}
```

### BatchUpdateOptions

```typescript
interface BatchUpdateOptions {
    /** The ordered list of update operations to execute */
    updates: BatchUpdateOperation[];

    /** When true, stops on first error. Defaults to false. */
    stopOnError?: boolean;

    /** Optional progress callback invoked after each operation */
    onProgress?: (message: string) => void;
}
```

### BatchUpdateResult

```typescript
interface BatchUpdateResult {
    /** True if all updates completed without error */
    success: boolean;

    /** Number of records successfully updated */
    updatedCount: number;

    /** Details of any errors encountered */
    errors: Array<{
        updateIndex: number;
        table: string;
        sysId: string;
        error: string;
    }>;

    /** Total execution time in milliseconds */
    executionTimeMs: number;
}
```

## Examples

### Example 1: Create Related Records with Variable References

```typescript
async function createIncidentWithNotes(instance: ServiceNowInstance) {
    const batchOps = new BatchOperations(instance);

    const result = await batchOps.batchCreate({
        operations: [
            {
                table: 'incident',
                data: {
                    short_description: 'Database connection pool exhausted',
                    urgency: '1',
                    impact: '1',
                    category: 'database'
                },
                saveAs: 'incidentId'
            },
            {
                table: 'sys_journal_field',
                data: {
                    element_id: '${incidentId}',
                    name: 'incident',
                    element: 'comments',
                    value: 'Initial triage: connection pool at 100% capacity'
                }
            },
            {
                table: 'sys_journal_field',
                data: {
                    element_id: '${incidentId}',
                    name: 'incident',
                    element: 'work_notes',
                    value: 'Escalated to DBA team for immediate investigation'
                }
            }
        ],
        transaction: true,
        onProgress: (msg) => console.log(`[Progress] ${msg}`)
    });

    if (result.success) {
        console.log(`Incident created: ${result.sysIds['incidentId']}`);
        console.log(`Total records created: ${result.createdCount}`);
    } else {
        console.error('Batch create failed:', result.errors);
    }
}
```

### Example 2: Bulk Update Incidents

```typescript
async function escalateIncidents(instance: ServiceNowInstance, incidentSysIds: string[]) {
    const batchOps = new BatchOperations(instance);

    const updates = incidentSysIds.map(sysId => ({
        table: 'incident',
        sysId,
        data: {
            priority: '1',
            state: '2',
            escalation: '1'
        }
    }));

    const result = await batchOps.batchUpdate({
        updates,
        stopOnError: false,
        onProgress: (msg) => console.log(msg)
    });

    console.log(`\n=== Batch Update Results ===`);
    console.log(`Updated: ${result.updatedCount}/${incidentSysIds.length}`);
    console.log(`Time: ${result.executionTimeMs}ms`);

    if (result.errors.length > 0) {
        console.error(`\nFailed updates:`);
        result.errors.forEach(e => {
            console.error(`  - ${e.table}/${e.sysId}: ${e.error}`);
        });
    }
}
```

### Example 3: Non-Transactional Batch Create

```typescript
async function seedTestData(instance: ServiceNowInstance) {
    const batchOps = new BatchOperations(instance);

    const users = ['Alice', 'Bob', 'Charlie', 'Diana'];

    const result = await batchOps.batchCreate({
        operations: users.map(name => ({
            table: 'sys_user',
            data: {
                first_name: name,
                last_name: 'TestUser',
                user_name: `${name.toLowerCase()}.test`,
                email: `${name.toLowerCase()}.test@example.com`
            }
        })),
        transaction: false  // Continue even if one user creation fails
    });

    console.log(`Created ${result.createdCount}/${users.length} test users`);
    console.log(`Execution time: ${result.executionTimeMs}ms`);
}
```

### Example 4: Track Progress on Large Batch

```typescript
async function batchUpdateWithProgress(instance: ServiceNowInstance) {
    const batchOps = new BatchOperations(instance);

    const result = await batchOps.batchUpdate({
        updates: largeUpdatesList,
        stopOnError: true,
        onProgress: (message) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${message}`);
        }
    });

    if (!result.success) {
        console.error(`Batch stopped due to error at operation ${result.errors[0].updateIndex + 1}`);
        process.exit(1);
    }
}
```

## Best Practices

1. **Use Transaction Mode for Related Records**: When creating records that depend on each other, keep `transaction: true` (the default) so a failure rolls back cleanly.
2. **Use `saveAs` for Cross-References**: When a later operation needs the sys_id of an earlier one, use `saveAs` and `${key}` variable references instead of hardcoding IDs.
3. **Monitor Progress**: For large batches, supply an `onProgress` callback to track execution and detect stalls.
4. **Handle Partial Failures**: When `transaction` is `false` or `stopOnError` is `false`, always inspect the `errors` array to identify which operations failed.
5. **Keep Batches Reasonably Sized**: Very large batches can time out or consume excessive memory. Consider splitting into chunks of 50-100 operations.
6. **Check `executionTimeMs`**: Use timing data to identify performance bottlenecks and tune batch sizes.

## Related

- [QueryBatchOperations](./QueryBatchOperations.md)
- [Getting Started Guide](./GettingStarted.md)
- [Application Manager](./ApplicationManager.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)

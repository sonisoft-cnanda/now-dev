# AggregateQuery

The `AggregateQuery` class provides aggregate operations (COUNT, AVG, MIN, MAX, SUM) against ServiceNow tables via the Stats API.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Related](#related)

## Overview

The `AggregateQuery` enables you to:

- Count records in any ServiceNow table with optional filtering
- Compute AVG, MIN, MAX, and SUM aggregations on numeric fields
- Group results using GROUP BY with HAVING clause support
- Filter aggregated data using encoded queries
- Control display value handling for reference fields

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, AggregateQuery } from '@sonisoft/now-sdk-ext-core';

const aggregateQuery = new AggregateQuery(instance);
```

## Methods

### count

Count records matching an optional query on a table. Returns a parsed integer for convenience.

```typescript
async count(options: CountQueryOptions): Promise<number>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `CountQueryOptions` | Count query options (table required, query optional) |

#### CountQueryOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `table` | `string` | Yes | The table name to count records from |
| `query` | `string` | No | Encoded query to filter records |

#### Returns

`Promise<number>` - The number of matching records.

#### Throws

- `Error` if the table name is empty
- `Error` if the API call fails

#### Example

```typescript
const incidentCount = await aggregateQuery.count({
    table: 'incident',
    query: 'active=true'
});

console.log(`Active incidents: ${incidentCount}`);
```

---

### aggregate

Run an aggregate query (COUNT, AVG, MIN, MAX, SUM) without grouping.

```typescript
async aggregate(options: AggregateQueryOptions): Promise<AggregateResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `AggregateQueryOptions` | Aggregate query options |

#### AggregateQueryOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `table` | `string` | Yes | The table name to aggregate |
| `query` | `string` | No | Encoded query to filter records before aggregation |
| `count` | `boolean` | No | When true, includes record count in the result |
| `avgFields` | `string[]` | No | Field names to compute AVG on |
| `minFields` | `string[]` | No | Field names to compute MIN on |
| `maxFields` | `string[]` | No | Field names to compute MAX on |
| `sumFields` | `string[]` | No | Field names to compute SUM on |
| `groupBy` | `string[]` | No | Field names to GROUP BY |
| `having` | `string` | No | HAVING clause for group filtering |
| `displayValue` | `"true" \| "false" \| "all"` | No | Display value handling for reference fields |

#### Returns

`Promise<AggregateResult>` containing:
- `stats`: An `AggregateStats` object with keys like `count`, `avg.{field}`, `min.{field}`, `max.{field}`, `sum.{field}`

#### Throws

- `Error` if the table name is empty
- `Error` if the API call fails

#### Example

```typescript
const result = await aggregateQuery.aggregate({
    table: 'incident',
    query: 'active=true',
    count: true,
    avgFields: ['reassignment_count'],
    maxFields: ['reassignment_count']
});

console.log(`Total: ${result.stats.count}`);
console.log(`Avg reassignments: ${result.stats['avg.reassignment_count']}`);
console.log(`Max reassignments: ${result.stats['max.reassignment_count']}`);
```

---

### groupBy

Run a grouped aggregate query with GROUP BY.

```typescript
async groupBy(options: AggregateQueryOptions): Promise<GroupedAggregateResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `AggregateQueryOptions` | Aggregate query options (the `groupBy` field is required) |

#### Returns

`Promise<GroupedAggregateResult>` containing:
- `groups`: An array of `AggregateGroupResult` objects, each with `groupby_fields` and `stats`

#### Throws

- `Error` if the table name is empty
- `Error` if `groupBy` is missing or empty
- `Error` if the API call fails

#### Example

```typescript
const result = await aggregateQuery.groupBy({
    table: 'incident',
    query: 'active=true',
    count: true,
    groupBy: ['priority']
});

for (const group of result.groups) {
    const priority = group.groupby_fields[0].value;
    console.log(`Priority ${priority}: ${group.stats.count} incidents`);
}
```

## Interfaces

### CountQueryOptions

```typescript
interface CountQueryOptions {
    /** The table name to count records from (required) */
    table: string;

    /** Encoded query to filter records */
    query?: string;
}
```

### AggregateQueryOptions

```typescript
interface AggregateQueryOptions {
    /** The table name to aggregate (required) */
    table: string;

    /** Encoded query to filter records before aggregation */
    query?: string;

    /** When true, includes record count in the result */
    count?: boolean;

    /** Field names to compute AVG on */
    avgFields?: string[];

    /** Field names to compute MIN on */
    minFields?: string[];

    /** Field names to compute MAX on */
    maxFields?: string[];

    /** Field names to compute SUM on */
    sumFields?: string[];

    /** Field names to GROUP BY */
    groupBy?: string[];

    /** HAVING clause for group filtering */
    having?: string;

    /** Display value handling: "true", "false", or "all" */
    displayValue?: "true" | "false" | "all";
}
```

### AggregateStats

```typescript
interface AggregateStats {
    /** Record count (when count was requested) */
    count?: string;

    /** Additional stat fields keyed by "avg.{field}", "min.{field}", etc. */
    [key: string]: unknown;
}
```

### AggregateGroupResult

```typescript
interface AggregateGroupResult {
    /** The group-by field values */
    groupby_fields: Array<{
        field: string;
        value: string;
        display_value?: string;
    }>;

    /** The stats for this group */
    stats: AggregateStats;

    /** Additional fields */
    [key: string]: unknown;
}
```

### AggregateResult

```typescript
interface AggregateResult {
    /** The stats for the entire result set */
    stats: AggregateStats;
}
```

### GroupedAggregateResult

```typescript
interface GroupedAggregateResult {
    /** Array of group results */
    groups: AggregateGroupResult[];
}
```

## Examples

### Example 1: Dashboard Metrics

```typescript
async function getDashboardMetrics() {
    const aggregateQuery = new AggregateQuery(instance);

    // Count active incidents by priority
    const byPriority = await aggregateQuery.groupBy({
        table: 'incident',
        query: 'active=true',
        count: true,
        groupBy: ['priority']
    });

    console.log('=== Incident Distribution by Priority ===');
    for (const group of byPriority.groups) {
        const priority = group.groupby_fields[0].display_value || group.groupby_fields[0].value;
        console.log(`  ${priority}: ${group.stats.count}`);
    }

    // Get overall stats
    const overall = await aggregateQuery.aggregate({
        table: 'incident',
        query: 'active=true',
        count: true,
        avgFields: ['reassignment_count'],
        sumFields: ['reassignment_count']
    });

    console.log(`\nTotal active incidents: ${overall.stats.count}`);
    console.log(`Average reassignments: ${overall.stats['avg.reassignment_count']}`);
    console.log(`Total reassignments: ${overall.stats['sum.reassignment_count']}`);
}
```

### Example 2: Quick Record Counts

```typescript
async function getRecordCounts() {
    const aggregateQuery = new AggregateQuery(instance);

    const tables = ['incident', 'change_request', 'problem', 'sc_request'];
    const counts: Record<string, number> = {};

    for (const table of tables) {
        counts[table] = await aggregateQuery.count({
            table,
            query: 'active=true'
        });
    }

    console.log('Active Record Counts:');
    for (const [table, count] of Object.entries(counts)) {
        console.log(`  ${table}: ${count}`);
    }
}
```

### Example 3: Multi-Field Grouped Aggregation

```typescript
async function getIncidentsByAssignmentGroup() {
    const aggregateQuery = new AggregateQuery(instance);

    const result = await aggregateQuery.groupBy({
        table: 'incident',
        query: 'active=true',
        count: true,
        avgFields: ['reassignment_count'],
        groupBy: ['assignment_group', 'priority'],
        displayValue: 'all'
    });

    for (const group of result.groups) {
        const assignmentGroup = group.groupby_fields[0].display_value || 'Unassigned';
        const priority = group.groupby_fields[1].display_value || 'Unknown';
        console.log(`${assignmentGroup} / ${priority}: ${group.stats.count} incidents`);
    }
}
```

## Best Practices

1. **Use `count()` for Simple Counts**: When you only need a record count, use the dedicated `count()` method for cleaner code and a parsed integer return value
2. **Filter Before Aggregating**: Always provide a query filter to reduce the dataset before aggregation for better performance
3. **Limit GROUP BY Fields**: Keep the number of `groupBy` fields small to avoid excessively large result sets
4. **Use Display Values Carefully**: Setting `displayValue` to `"all"` doubles the data returned; use it only when you need both raw and display values
5. **Handle Dynamic Keys**: Stats fields like `avg.{field}` are dynamic; access them using bracket notation (e.g., `result.stats['avg.reassignment_count']`)
6. **Validate Table Names**: The API will throw an error if the table name is empty; validate inputs before calling

## Related

- [Getting Started Guide](./GettingStarted.md)
- [InstanceHealth](./InstanceHealth.md)
- [InstanceDiscovery](./InstanceDiscovery.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)

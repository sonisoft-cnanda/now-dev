# InstanceDiscovery

The `InstanceDiscovery` class provides methods for discovering tables, scoped applications, store applications, and plugins on a ServiceNow instance.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Related](#related)

## Overview

The `InstanceDiscovery` enables you to:

- List and filter table definitions from `sys_db_object`
- Discover scoped applications installed on the instance from `sys_app`
- Query store applications from `sys_store_app`
- Enumerate plugins from `v_plugin`
- Apply name prefix filters, active-only filters, and custom encoded queries
- Paginate through large result sets with limit and offset

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, InstanceDiscovery } from '@sonisoft/now-sdk-ext-core';

const discovery = new InstanceDiscovery(instance);
```

## Methods

### listTables

List tables on the instance with optional filtering by name prefix, scope, extendability, and custom query.

```typescript
async listTables(options?: ListTablesOptions): Promise<TableDefinition[]>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `ListTablesOptions` | Filtering and pagination options. All properties are optional. |

#### ListTablesOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `query` | `string` | - | Encoded query to filter tables |
| `namePrefix` | `string` | - | Filter by name prefix (e.g., `"cmdb_"` to get all CMDB tables) |
| `scope` | `string` | - | Filter by application scope (sys_id or name) |
| `extendableOnly` | `boolean` | `false` | Only return extendable tables |
| `limit` | `number` | `100` | Maximum number of results |
| `offset` | `number` | `0` | Offset for pagination |
| `fields` | `string[]` | - | Fields to return (maps to sysparm_fields) |

#### Returns

`Promise<TableDefinition[]>` - Array of table definition records.

#### Throws

- `Error` if the API call fails

#### Example

```typescript
const tables = await discovery.listTables({
    namePrefix: 'cmdb_',
    limit: 50
});

for (const table of tables) {
    console.log(`${table.name} - ${table.label || 'No label'}`);
}
```

---

### listScopedApps

List scoped applications on the instance.

```typescript
async listScopedApps(options?: ListScopedAppsOptions): Promise<ScopedAppRecord[]>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `ListScopedAppsOptions` | Filtering and pagination options. All properties are optional. |

#### ListScopedAppsOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `query` | `string` | - | Encoded query to filter applications |
| `namePrefix` | `string` | - | Filter by scope name prefix |
| `activeOnly` | `boolean` | `false` | Only return active applications |
| `limit` | `number` | `100` | Maximum number of results |
| `offset` | `number` | `0` | Offset for pagination |

#### Returns

`Promise<ScopedAppRecord[]>` - Array of scoped application records.

#### Throws

- `Error` if the API call fails

#### Example

```typescript
const apps = await discovery.listScopedApps({
    activeOnly: true
});

for (const app of apps) {
    console.log(`${app.name} (${app.scope}) v${app.version}`);
}
```

---

### listStoreApps

List store applications on the instance.

```typescript
async listStoreApps(options?: ListStoreAppsOptions): Promise<StoreAppRecord[]>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `ListStoreAppsOptions` | Filtering and pagination options. All properties are optional. |

#### ListStoreAppsOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `query` | `string` | - | Encoded query to filter store applications |
| `namePrefix` | `string` | - | Filter by name prefix |
| `activeOnly` | `boolean` | `false` | Only return active (installed) applications |
| `limit` | `number` | `100` | Maximum number of results |
| `offset` | `number` | `0` | Offset for pagination |

#### Returns

`Promise<StoreAppRecord[]>` - Array of store application records.

#### Throws

- `Error` if the API call fails

#### Example

```typescript
const storeApps = await discovery.listStoreApps({
    activeOnly: true,
    limit: 25
});

for (const app of storeApps) {
    console.log(`${app.name} v${app.version} (active: ${app.active})`);
}
```

---

### listPlugins

List plugins on the instance.

```typescript
async listPlugins(options?: ListPluginsOptions): Promise<PluginRecord[]>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `ListPluginsOptions` | Filtering and pagination options. All properties are optional. |

#### ListPluginsOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `query` | `string` | - | Encoded query to filter plugins |
| `namePrefix` | `string` | - | Filter by name prefix |
| `activeOnly` | `boolean` | `false` | Only return active plugins |
| `limit` | `number` | `100` | Maximum number of results |
| `offset` | `number` | `0` | Offset for pagination |

#### Returns

`Promise<PluginRecord[]>` - Array of plugin records.

#### Throws

- `Error` if the API call fails

#### Example

```typescript
const plugins = await discovery.listPlugins({
    activeOnly: true,
    namePrefix: 'com.snc'
});

for (const plugin of plugins) {
    console.log(`${plugin.id}: ${plugin.name} (active: ${plugin.active})`);
}
```

## Interfaces

### ListTablesOptions

```typescript
interface ListTablesOptions {
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
```

### ListScopedAppsOptions

```typescript
interface ListScopedAppsOptions {
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
```

### ListStoreAppsOptions

```typescript
interface ListStoreAppsOptions {
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
```

### ListPluginsOptions

```typescript
interface ListPluginsOptions {
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
```

### TableDefinition

```typescript
interface TableDefinition {
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
```

### ScopedAppRecord

```typescript
interface ScopedAppRecord {
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
```

### StoreAppRecord

```typescript
interface StoreAppRecord {
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
```

### PluginRecord

```typescript
interface PluginRecord {
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
```

## Examples

### Example 1: Instance Inventory Report

```typescript
async function generateInventoryReport() {
    const discovery = new InstanceDiscovery(instance);

    const [tables, apps, storeApps, plugins] = await Promise.all([
        discovery.listTables({ limit: 250 }),
        discovery.listScopedApps({ activeOnly: true }),
        discovery.listStoreApps({ activeOnly: true }),
        discovery.listPlugins({ activeOnly: true })
    ]);

    console.log('=== Instance Inventory ===');
    console.log(`Tables: ${tables.length}`);
    console.log(`Scoped Applications: ${apps.length}`);
    console.log(`Store Applications: ${storeApps.length}`);
    console.log(`Active Plugins: ${plugins.length}`);

    console.log('\nScoped Applications:');
    for (const app of apps) {
        console.log(`  ${app.name} (${app.scope}) v${app.version}`);
    }

    console.log('\nStore Applications:');
    for (const app of storeApps) {
        console.log(`  ${app.name} v${app.version}`);
    }
}
```

### Example 2: CMDB Table Discovery

```typescript
async function discoverCMDBTables() {
    const discovery = new InstanceDiscovery(instance);

    const cmdbTables = await discovery.listTables({
        namePrefix: 'cmdb_ci',
        extendableOnly: true,
        fields: ['name', 'label', 'super_class', 'is_extendable'],
        limit: 200
    });

    console.log(`Found ${cmdbTables.length} extendable CMDB CI tables:`);
    for (const table of cmdbTables) {
        console.log(`  ${table.name} - ${table.label || '(no label)'}`);
    }
}
```

### Example 3: Paginated Plugin Listing

```typescript
async function listAllPlugins() {
    const discovery = new InstanceDiscovery(instance);
    const allPlugins: PluginRecord[] = [];
    let offset = 0;
    const pageSize = 100;

    while (true) {
        const page = await discovery.listPlugins({
            limit: pageSize,
            offset
        });

        allPlugins.push(...page);

        if (page.length < pageSize) {
            break; // Last page
        }

        offset += pageSize;
    }

    console.log(`Total plugins: ${allPlugins.length}`);

    const active = allPlugins.filter(p => p.active === 'active');
    console.log(`Active plugins: ${active.length}`);
    console.log(`Inactive plugins: ${allPlugins.length - active.length}`);
}
```

### Example 4: Compare Two Instances

```typescript
async function compareInstances(instanceA: ServiceNowInstance, instanceB: ServiceNowInstance) {
    const discoveryA = new InstanceDiscovery(instanceA);
    const discoveryB = new InstanceDiscovery(instanceB);

    const [appsA, appsB] = await Promise.all([
        discoveryA.listScopedApps({ activeOnly: true }),
        discoveryB.listScopedApps({ activeOnly: true })
    ]);

    const scopesA = new Set(appsA.map(a => a.scope));
    const scopesB = new Set(appsB.map(a => a.scope));

    const onlyA = appsA.filter(a => !scopesB.has(a.scope));
    const onlyB = appsB.filter(a => !scopesA.has(a.scope));

    console.log(`Apps only on Instance A: ${onlyA.length}`);
    for (const app of onlyA) {
        console.log(`  ${app.name} (${app.scope})`);
    }

    console.log(`\nApps only on Instance B: ${onlyB.length}`);
    for (const app of onlyB) {
        console.log(`  ${app.name} (${app.scope})`);
    }
}
```

## Best Practices

1. **Use Pagination for Large Datasets**: Tables and plugins can number in the thousands; use `limit` and `offset` to page through results
2. **Filter Early**: Apply `namePrefix`, `activeOnly`, or `query` filters to reduce the result set and API response time
3. **Specify Fields When Possible**: Use the `fields` option in `listTables` to return only the columns you need, reducing payload size
4. **Use `activeOnly` for Operational Queries**: When checking what is currently running on an instance, always set `activeOnly: true` to exclude inactive or uninstalled items
5. **Run Queries in Parallel**: The four listing methods are independent and can be called concurrently with `Promise.all` for faster inventory gathering
6. **Handle Missing Fields**: Records may have optional fields that are undefined; always use optional chaining or null checks when accessing properties like `label`, `version`, or `vendor`

## Related

- [Getting Started Guide](./GettingStarted.md)
- [AggregateQuery](./AggregateQuery.md)
- [InstanceHealth](./InstanceHealth.md)
- [CMDBRelationships](./CMDBRelationships.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)

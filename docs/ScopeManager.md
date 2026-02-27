# ScopeManager

The `ScopeManager` class provides operations for managing ServiceNow application scopes programmatically.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Related](#related)

## Overview

The `ScopeManager` enables you to:

- Set the current application scope with validation and verification
- Retrieve the currently active application scope
- List applications from the `sys_scope` table with filtering
- Look up a specific application by sys_id

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, ScopeManager } from '@sonisoft/now-sdk-ext-core';

const scopeManager = new ScopeManager(instance);
```

## Methods

### setCurrentApplication

Sets the current application scope. Validates the sys_id format, retrieves the previous scope, performs the PUT request, and verifies the change.

```typescript
async setCurrentApplication(appSysId: string): Promise<SetCurrentApplicationResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `appSysId` | `string` | The sys_id of the application to set as current (32-character hex string) |

#### Returns

`Promise<SetCurrentApplicationResult>` containing:
- `success`: Whether the operation was successful
- `application`: Name of the application
- `scope`: Application scope string (e.g., `"x_myapp"`)
- `sysId`: The sys_id that was set
- `previousScope`: The scope that was active before the change
- `verified`: Whether the scope change was confirmed by re-reading the current scope
- `warnings`: Any warnings generated during the operation

#### Throws

- `Error` if `appSysId` is empty or not a 32-character hexadecimal string
- `Error` if the application is not found in `sys_scope`
- `Error` if the PUT request fails

#### Example

```typescript
const result = await scopeManager.setCurrentApplication('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');

console.log(`Application: ${result.application}`);
console.log(`Scope: ${result.scope}`);
console.log(`Verified: ${result.verified}`);

if (result.previousScope) {
    console.log(`Previous scope: ${result.previousScope.name}`);
}

if (result.warnings.length > 0) {
    result.warnings.forEach(w => console.warn(w));
}
```

---

### getCurrentApplication

Retrieves the currently active application scope using the concoursepicker API.

```typescript
async getCurrentApplication(): Promise<ApplicationRecord | null>
```

#### Returns

`Promise<ApplicationRecord | null>` -- the current application record with `sys_id`, `name`, and `scope` fields populated, or `null` if unavailable.

#### Throws

- `Error` if the API call fails or returns a non-200 status

#### Example

```typescript
const current = await scopeManager.getCurrentApplication();

if (current) {
    console.log(`Current app: ${current.name} (${current.scope})`);
    console.log(`sys_id: ${current.sys_id}`);
}
```

---

### listApplications

Lists applications from the `sys_scope` table using the Table API.

```typescript
async listApplications(options?: ListApplicationsOptions): Promise<ApplicationRecord[]>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options` | `ListApplicationsOptions` | `{}` | Optional query and limit options |

#### ListApplicationsOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `encodedQuery` | `string` | - | Encoded query string for filtering (ServiceNow encoded query syntax) |
| `limit` | `number` | `100` | Maximum number of records to return |

#### Returns

`Promise<ApplicationRecord[]>` -- an array of application records.

#### Throws

- `Error` if the API call fails or returns a non-200 status

#### Example

```typescript
// List all applications
const allApps = await scopeManager.listApplications();
console.log(`Found ${allApps.length} applications`);

// List active applications with a filter
const activeApps = await scopeManager.listApplications({
    encodedQuery: 'active=true',
    limit: 50
});

activeApps.forEach(app => {
    console.log(`${app.name} (${app.scope}) - active: ${app.active}`);
});
```

---

### getApplication

Retrieves a specific application by its sys_id from the `sys_scope` table.

```typescript
async getApplication(sysId: string): Promise<ApplicationRecord | null>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sysId` | `string` | The sys_id of the application to retrieve |

#### Returns

`Promise<ApplicationRecord | null>` -- the application record if found, or `null` if no application matches the given sys_id.

#### Throws

- `Error` if `sysId` is empty
- `Error` if the API call fails or returns a non-200 status

#### Example

```typescript
const app = await scopeManager.getApplication('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');

if (app) {
    console.log(`Name: ${app.name}`);
    console.log(`Scope: ${app.scope}`);
    console.log(`Version: ${app.version}`);
} else {
    console.log('Application not found');
}
```

## Interfaces

### ApplicationRecord

A record from the `sys_scope` table.

```typescript
interface ApplicationRecord {
    /** System ID */
    sys_id: string;

    /** Application name */
    name: string;

    /** Application scope (e.g., "x_myapp") */
    scope?: string;

    /** Application version */
    version?: string;

    /** Whether the application is active */
    active?: string;

    /** Additional fields */
    [key: string]: unknown;
}
```

### SetCurrentApplicationResult

Result of setting the current application scope.

```typescript
interface SetCurrentApplicationResult {
    /** Whether the operation was successful */
    success: boolean;

    /** Application name */
    application: string;

    /** Application scope */
    scope: string;

    /** Application sys_id */
    sysId: string;

    /** The previously active scope before the change */
    previousScope?: {
        sys_id?: string;
        name?: string;
    };

    /** Whether the scope change was verified */
    verified: boolean;

    /** Any warnings generated during the operation */
    warnings: string[];
}
```

### ListApplicationsOptions

Options for listing applications.

```typescript
interface ListApplicationsOptions {
    /** Encoded query string for filtering */
    encodedQuery?: string;

    /** Maximum number of records to return */
    limit?: number;
}
```

## Examples

### Example 1: Switch Scope Before Making Changes

```typescript
import { ServiceNowInstance, ScopeManager } from '@sonisoft/now-sdk-ext-core';

async function switchToAppScope(instance: ServiceNowInstance, appSysId: string) {
    const scopeManager = new ScopeManager(instance);

    // Save the current scope so we can restore it later
    const original = await scopeManager.getCurrentApplication();
    console.log(`Current scope: ${original?.name}`);

    // Switch to the target application scope
    const result = await scopeManager.setCurrentApplication(appSysId);
    console.log(`Switched to: ${result.application} (${result.scope})`);
    console.log(`Verified: ${result.verified}`);

    // ... perform operations in the new scope ...

    // Restore the original scope
    if (original) {
        await scopeManager.setCurrentApplication(original.sys_id);
        console.log(`Restored scope: ${original.name}`);
    }
}
```

### Example 2: Find an Application by Scope Name

```typescript
async function findAppByScope(instance: ServiceNowInstance, scopeName: string) {
    const scopeManager = new ScopeManager(instance);

    const apps = await scopeManager.listApplications({
        encodedQuery: `scope=${scopeName}`,
        limit: 1
    });

    if (apps.length > 0) {
        const app = apps[0];
        console.log(`Found: ${app.name} (${app.sys_id})`);
        return app;
    }

    console.log(`No application found with scope "${scopeName}"`);
    return null;
}
```

### Example 3: List All Custom Applications

```typescript
async function listCustomApps(instance: ServiceNowInstance) {
    const scopeManager = new ScopeManager(instance);

    const apps = await scopeManager.listApplications({
        encodedQuery: 'scopeSTARTSWITHx_^active=true',
        limit: 200
    });

    console.log(`\n=== Custom Applications (${apps.length}) ===`);
    apps.forEach(app => {
        console.log(`  ${app.name} | ${app.scope} | v${app.version || 'N/A'}`);
    });

    return apps;
}
```

### Example 4: Validate and Switch Scope

```typescript
async function safeSetScope(instance: ServiceNowInstance, appSysId: string) {
    const scopeManager = new ScopeManager(instance);

    // Verify the application exists before switching
    const app = await scopeManager.getApplication(appSysId);
    if (!app) {
        throw new Error(`Application ${appSysId} does not exist`);
    }

    if (app.active !== 'true') {
        throw new Error(`Application "${app.name}" is not active`);
    }

    const result = await scopeManager.setCurrentApplication(appSysId);

    if (!result.verified) {
        console.warn('Scope change was not verified. Warnings:');
        result.warnings.forEach(w => console.warn(`  - ${w}`));
    }

    return result;
}
```

## Best Practices

1. **Verify Scope Changes**: Always check the `verified` flag on `SetCurrentApplicationResult` to confirm the scope was actually changed.
2. **Restore Original Scope**: When temporarily switching scopes, save the current scope first and restore it when finished.
3. **Validate sys_id Format**: The `setCurrentApplication` method enforces 32-character hexadecimal format -- pass valid sys_ids to avoid errors.
4. **Check Warnings**: Inspect the `warnings` array even when the operation succeeds, as it may contain important information about verification failures.
5. **Use Encoded Queries for Filtering**: Leverage ServiceNow encoded query syntax in `listApplications` for efficient server-side filtering rather than client-side filtering.
6. **Handle Null Returns**: Both `getCurrentApplication` and `getApplication` can return `null` -- always check for this case.

## Related

- [Getting Started Guide](./GettingStarted.md)
- [UpdateSetManager](./UpdateSetManager.md)
- [Application Manager](./ApplicationManager.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)

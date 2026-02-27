# ScriptSync

The `ScriptSync` class provides bidirectional synchronization between local files and ServiceNow script records (Script Includes, Business Rules, Client Scripts, UI Scripts, and UI Actions).

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Related](#related)

## Overview

The `ScriptSync` class enables you to:

- Pull script content from ServiceNow and write it to local files
- Push local file content to ServiceNow script records
- Sync all scripts in a directory based on a naming convention
- Parse and generate filenames in the `{name}.{type}.js` format
- Work with Script Includes, Business Rules, Client Scripts, UI Scripts, and UI Actions

### Supported Script Types

| Key | Table | Label |
|-----|-------|-------|
| `sys_script_include` | `sys_script_include` | Script Include |
| `sys_script` | `sys_script` | Business Rule |
| `sys_ui_script` | `sys_ui_script` | UI Script |
| `sys_ui_action` | `sys_ui_action` | UI Action |
| `sys_script_client` | `sys_script_client` | Client Script |

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, ScriptSync } from '@sonisoft/now-sdk-ext-core';

const scriptSync = new ScriptSync(instance);
```

## Methods

### pullScript

Pull a script from ServiceNow and write it to a local file. Queries the appropriate table by name and writes the script field content to the specified file path.

```typescript
async pullScript(options: SyncScriptOptions): Promise<SyncResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `SyncScriptOptions` | The pull options |

#### SyncScriptOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `scriptName` | `string` | Yes | The name of the script record in ServiceNow |
| `scriptType` | `string` | Yes | The script type key (e.g., `"sys_script_include"`) |
| `filePath` | `string` | Yes | The local file path to write the script to |
| `direction` | `'push' \| 'pull'` | No | Optional direction hint (not used by the method directly) |

#### Returns

`Promise<SyncResult>` containing:
- `scriptName`: The script name
- `scriptType`: The script type
- `filePath`: The file path
- `direction`: `'pull'`
- `success`: Whether the operation succeeded
- `sysId`: The sys_id of the record (on success)
- `message`: A human-readable status message
- `error`: Error details (on failure)
- `timestamp`: ISO timestamp of the operation

#### Example

```typescript
const result = await scriptSync.pullScript({
    scriptName: 'MyScriptInclude',
    scriptType: 'sys_script_include',
    filePath: './scripts/MyScriptInclude.sys_script_include.js'
});

if (result.success) {
    console.log(`Pulled ${result.scriptName} (sys_id: ${result.sysId})`);
} else {
    console.error(`Failed: ${result.error}`);
}
```

---

### pushScript

Push a local file to ServiceNow by updating the script field on the matching record. Reads the file from the specified path, queries the table by name to find the record, then updates the script field.

```typescript
async pushScript(options: SyncScriptOptions): Promise<SyncResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `SyncScriptOptions` | The push options |

#### Returns

`Promise<SyncResult>` containing:
- `scriptName`: The script name
- `scriptType`: The script type
- `filePath`: The file path
- `direction`: `'push'`
- `success`: Whether the operation succeeded
- `sysId`: The sys_id of the updated record (on success)
- `message`: A human-readable status message
- `error`: Error details (on failure)
- `timestamp`: ISO timestamp of the operation

#### Example

```typescript
const result = await scriptSync.pushScript({
    scriptName: 'MyScriptInclude',
    scriptType: 'sys_script_include',
    filePath: './scripts/MyScriptInclude.sys_script_include.js'
});

if (result.success) {
    console.log(`Pushed ${result.scriptName} to ServiceNow`);
} else {
    console.error(`Failed: ${result.error}`);
}
```

---

### syncAllScripts

Sync all scripts in a directory. Reads filenames, parses them using the `{name}.{type}.js` convention, and pushes each matching file to ServiceNow.

```typescript
async syncAllScripts(options: SyncAllOptions): Promise<SyncAllResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `SyncAllOptions` | The sync-all options |

#### SyncAllOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `directory` | `string` | Yes | Path to the directory containing script files |
| `scriptTypes` | `string[]` | No | Filter to specific script type keys. Defaults to all supported types. |

#### Returns

`Promise<SyncAllResult>` containing:
- `directory`: The directory that was synced
- `scriptTypes`: The script types that were included
- `totalFiles`: Total number of valid files found
- `synced`: Number of files successfully synced
- `failed`: Number of files that failed
- `scripts`: Array of individual `SyncResult` entries
- `timestamp`: ISO timestamp of the operation

#### Example

```typescript
const result = await scriptSync.syncAllScripts({
    directory: './scripts',
    scriptTypes: ['sys_script_include', 'sys_script']
});

console.log(`Total: ${result.totalFiles}`);
console.log(`Synced: ${result.synced}`);
console.log(`Failed: ${result.failed}`);

result.scripts.forEach(s => {
    const status = s.success ? 'OK' : 'FAIL';
    console.log(`  [${status}] ${s.scriptName} (${s.scriptType})`);
});
```

---

### parseFileName (static)

Parse a filename in the format `{name}.{type}.js` to extract the script name and type. Valid types are keys of the `SCRIPT_TYPES` map.

```typescript
static parseFileName(fileName: string): ParsedFileName
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `fileName` | `string` | The filename to parse |

#### Returns

`ParsedFileName` containing:
- `isValid`: Whether the filename matched the expected pattern
- `scriptName`: The extracted script name (when valid)
- `scriptType`: The extracted script type key (when valid)

#### Example

```typescript
const parsed = ScriptSync.parseFileName('MyUtils.sys_script_include.js');

if (parsed.isValid) {
    console.log(`Name: ${parsed.scriptName}`);   // "MyUtils"
    console.log(`Type: ${parsed.scriptType}`);    // "sys_script_include"
}

const invalid = ScriptSync.parseFileName('readme.txt');
console.log(invalid.isValid); // false
```

---

### generateFileName (static)

Generate a filename in the format `{name}.{type}.js`.

```typescript
static generateFileName(scriptName: string, scriptType: string): string
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `scriptName` | `string` | The name of the script |
| `scriptType` | `string` | The script type key |

#### Returns

`string` - The generated filename.

#### Example

```typescript
const fileName = ScriptSync.generateFileName('MyUtils', 'sys_script_include');
console.log(fileName); // "MyUtils.sys_script_include.js"
```

## Interfaces

### ScriptTypeConfig

```typescript
interface ScriptTypeConfig {
    table: string;
    label: string;
    nameField: string;
    scriptField: string;
    extension: string;
}
```

### SCRIPT_TYPES (constant)

```typescript
const SCRIPT_TYPES: Record<string, ScriptTypeConfig> = {
    sys_script_include: { table: 'sys_script_include', label: 'Script Include', nameField: 'name', scriptField: 'script', extension: '.js' },
    sys_script:         { table: 'sys_script',         label: 'Business Rule', nameField: 'name', scriptField: 'script', extension: '.js' },
    sys_ui_script:      { table: 'sys_ui_script',      label: 'UI Script',     nameField: 'name', scriptField: 'script', extension: '.js' },
    sys_ui_action:      { table: 'sys_ui_action',      label: 'UI Action',     nameField: 'name', scriptField: 'script', extension: '.js' },
    sys_script_client:  { table: 'sys_script_client',   label: 'Client Script', nameField: 'name', scriptField: 'script', extension: '.js' },
};
```

### SyncScriptOptions

```typescript
interface SyncScriptOptions {
    scriptName: string;
    scriptType: string;
    filePath: string;
    direction?: 'push' | 'pull';
}
```

### SyncResult

```typescript
interface SyncResult {
    scriptName: string;
    scriptType: string;
    filePath: string;
    direction: 'push' | 'pull';
    success: boolean;
    sysId?: string;
    message: string;
    error?: string;
    timestamp: string;
}
```

### SyncAllOptions

```typescript
interface SyncAllOptions {
    directory: string;
    scriptTypes?: string[];
}
```

### SyncAllResult

```typescript
interface SyncAllResult {
    directory: string;
    scriptTypes: string[];
    totalFiles: number;
    synced: number;
    failed: number;
    scripts: SyncResult[];
    timestamp: string;
}
```

### ParsedFileName

```typescript
interface ParsedFileName {
    isValid: boolean;
    scriptName?: string;
    scriptType?: string;
}
```

### ScriptRecord

```typescript
interface ScriptRecord {
    sys_id: string;
    name: string;
    script: string;
    [key: string]: unknown;
}
```

### ScriptRecordResponse

```typescript
interface ScriptRecordResponse {
    result: ScriptRecord;
}
```

### ScriptRecordListResponse

```typescript
interface ScriptRecordListResponse {
    result: ScriptRecord[];
}
```

## Examples

### Example 1: Pull All Script Includes to a Local Directory

```typescript
async function pullScriptIncludes(scriptNames: string[]) {
    const scriptSync = new ScriptSync(instance);
    const outputDir = './scripts';

    for (const name of scriptNames) {
        const fileName = ScriptSync.generateFileName(name, 'sys_script_include');
        const result = await scriptSync.pullScript({
            scriptName: name,
            scriptType: 'sys_script_include',
            filePath: `${outputDir}/${fileName}`
        });

        if (result.success) {
            console.log(`Pulled: ${result.scriptName}`);
        } else {
            console.error(`Failed to pull ${name}: ${result.error}`);
        }
    }
}
```

### Example 2: Push Local Changes and Report Results

```typescript
async function pushAndReport() {
    const scriptSync = new ScriptSync(instance);

    const result = await scriptSync.syncAllScripts({
        directory: './scripts'
    });

    console.log('\n=== Sync Report ===');
    console.log(`Directory: ${result.directory}`);
    console.log(`Total files: ${result.totalFiles}`);
    console.log(`Synced: ${result.synced}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Timestamp: ${result.timestamp}`);

    if (result.failed > 0) {
        console.log('\nFailed scripts:');
        result.scripts
            .filter(s => !s.success)
            .forEach(s => console.log(`  - ${s.scriptName}: ${s.error}`));
    }
}
```

### Example 3: Selective Sync by Script Type

```typescript
async function syncBusinessRulesOnly() {
    const scriptSync = new ScriptSync(instance);

    const result = await scriptSync.syncAllScripts({
        directory: './scripts',
        scriptTypes: ['sys_script']
    });

    console.log(`Synced ${result.synced} business rules`);

    if (result.failed > 0) {
        console.error(`${result.failed} business rules failed to sync`);
        process.exit(1);
    }
}
```

### Example 4: Round-Trip Workflow (Pull, Edit, Push)

```typescript
async function roundTrip(scriptName: string) {
    const scriptSync = new ScriptSync(instance);
    const filePath = ScriptSync.generateFileName(scriptName, 'sys_script_include');
    const localPath = `./scripts/${filePath}`;

    // Pull the latest version
    const pullResult = await scriptSync.pullScript({
        scriptName,
        scriptType: 'sys_script_include',
        filePath: localPath
    });

    if (!pullResult.success) {
        console.error(`Pull failed: ${pullResult.error}`);
        return;
    }

    console.log(`Pulled ${scriptName} to ${localPath}`);
    console.log('Edit the file locally, then run push...');

    // After editing, push it back
    const pushResult = await scriptSync.pushScript({
        scriptName,
        scriptType: 'sys_script_include',
        filePath: localPath
    });

    if (pushResult.success) {
        console.log(`Pushed ${scriptName} back to ServiceNow (sys_id: ${pushResult.sysId})`);
    } else {
        console.error(`Push failed: ${pushResult.error}`);
    }
}
```

## Best Practices

1. **Follow the Naming Convention**: Use the `{name}.{type}.js` format for all script files so that `syncAllScripts` and `parseFileName` work correctly
2. **Use `generateFileName` for Consistency**: Let the static helper produce filenames instead of manually constructing them
3. **Pull Before Editing**: Always pull the latest version from ServiceNow before making local changes to avoid overwriting others' work
4. **Filter Script Types**: Use the `scriptTypes` option in `syncAllScripts` to limit operations to the types you are working with
5. **Check `SyncResult.success`**: Every sync operation returns a result object with a `success` flag; always check it rather than assuming the call succeeded
6. **Handle Missing Records Gracefully**: Both `pullScript` and `pushScript` return a failure result (not an exception) when the script record is not found in ServiceNow

## Related

- [Getting Started Guide](./GettingStarted.md)
- [ATF Test Executor](./ATFTestExecutor.md)
- [Application Manager](./ApplicationManager.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)

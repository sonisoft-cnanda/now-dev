## SyslogReader Class

The `SyslogReader` class provides functionality to query and tail ServiceNow syslog tables using encoded query strings. It supports formatted table output, file export, and real-time log tailing similar to `tail -f`.

## Features

- ✅ Query `syslog` and `syslog_app_scope` tables
- ✅ Support for ServiceNow Encoded Query Strings
- ✅ Formatted ASCII table output with color-coded log levels
- ✅ Export logs to JSON, CSV, or formatted table files
- ✅ Real-time log tailing (like `tail -f`)
- ✅ Customizable output formatting
- ✅ Callback support for log processing

## Installation

The `SyslogReader` class is part of the `@sonisoft/now-sdk-ext-core` package.

```bash
npm install @sonisoft/now-sdk-ext-core
```

## Basic Usage

### Creating a SyslogReader Instance

```typescript
import { SyslogReader, ServiceNowInstance } from '@sonisoft/now-sdk-ext-core';

const instance = new ServiceNowInstance({
    instanceURL: 'https://your-instance.service-now.com',
    username: 'your-username',
    password: 'your-password'
});

const syslogReader = new SyslogReader(instance);
```

### Querying Syslog

```typescript
// Get last 10 syslog entries
const logs = await syslogReader.querySyslog(undefined, 10);

// Get error logs only
const errorLogs = await syslogReader.querySyslog('level=error', 20);

// Get recent logs with ordering
const recentLogs = await syslogReader.querySyslog(
    'level=error^ORDERBYDESCsys_created_on', 
    50
);
```

### Querying App Scope Logs

```typescript
// Get app scope logs
const appLogs = await syslogReader.querySyslogAppScope(undefined, 10);

// Get logs for specific scope
const myAppLogs = await syslogReader.querySyslogAppScope(
    'app_scope=x_my_app^ORDERBYDESCsys_created_on', 
    20
);
```

## ServiceNow Encoded Query Strings

ServiceNow uses encoded query strings to filter table data. Here are common patterns:

### Basic Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `level=error` |
| `!=` | Not equals | `level!=info` |
| `>` | Greater than | `sys_created_on>2025-01-01` |
| `<` | Less than | `sys_created_on<2025-12-31` |
| `>=` | Greater than or equal | `level>=warn` |
| `<=` | Less than or equal | `level<=info` |
| `STARTSWITH` | Starts with | `sourceSTARTSWITHsecurity` |
| `ENDSWITH` | Ends with | `sourceENDSWITHhandler` |
| `CONTAINS` | Contains | `messageCONTAINSerror` |
| `IN` | In list | `levelINerror,warn` |
| `NOT IN` | Not in list | `levelNOT INdebug,info` |

### Logical Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `^` | AND | `level=error^sourceSTARTSWITHauth` |
| `^OR` | OR | `level=error^ORlevel=warn` |
| `^NQ` | New Query (OR) | `level=error^NQlevel=warn` |

### Ordering

| Operator | Description | Example |
|----------|-------------|---------|
| `ORDERBY` | Order ascending | `ORDERBYsys_created_on` |
| `ORDERBYDESC` | Order descending | `ORDERBYDESCsys_created_on` |

### Examples

```typescript
// Error logs from last hour
const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
const query1 = `level=error^sys_created_on>${oneHourAgo}^ORDERBYDESCsys_created_on`;

// Errors OR warnings from security sources
const query2 = `level=error^ORlevel=warn^sourceSTARTSWITHsecurity`;

// All logs except debug and info
const query3 = `levelNOT INdebug,info^ORDERBYDESCsys_created_on`;

// Logs with specific message content
const query4 = `messageCONTAINSauthentication^ORDERBYDESCsys_created_on`;
```

## Formatted Output

### Display as Table

```typescript
const logs = await syslogReader.querySyslog(undefined, 10);

// Print to console
syslogReader.printTable(logs);

// Get as string
const tableString = syslogReader.formatAsTable(logs);
console.log(tableString);
```

**Example Output:**

```
┌───────────────────────────┬────────────┬────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────┐
│ SYS_CREATED_ON            │ LEVEL      │ SOURCE                         │ MESSAGE                                                                        │
├───────────────────────────┼────────────┼────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ 10/10/2025, 2:30:15 PM    │ ERROR      │ security.authentication        │ Failed login attempt for user admin from IP 192.168.1.100                     │
│ 10/10/2025, 2:29:45 PM    │ WARN       │ database.query                 │ Slow query detected: SELECT * FROM sys_user WHERE active=true                 │
│ 10/10/2025, 2:29:30 PM    │ INFO       │ system.startup                 │ Application server started successfully                                        │
└───────────────────────────┴────────────┴────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────┘
```

### Custom Formatting Options

```typescript
const logs = await syslogReader.querySyslog(undefined, 10);

syslogReader.printTable(logs, {
    fields: ['sys_created_on', 'level', 'message'],
    maxMessageWidth: 60,
    includeHeaders: true,
    dateFormat: 'relative' // 'iso', 'locale', or 'relative'
});
```

**Date Format Options:**
- `iso`: ISO 8601 format (`2025-10-10T14:30:15.000Z`)
- `locale`: Localized format (`10/10/2025, 2:30:15 PM`)
- `relative`: Relative time (`5m ago`, `2h ago`, `3d ago`)

## Exporting Logs

### Save to JSON

```typescript
const logs = await syslogReader.querySyslog('level=error', 100);
await syslogReader.saveToFile(logs, './logs/errors.json', 'json');
```

### Save to CSV

```typescript
const logs = await syslogReader.querySyslog('level=error', 100);
await syslogReader.saveToFile(logs, './logs/errors.csv', 'csv');
```

### Save as Formatted Table

```typescript
const logs = await syslogReader.querySyslog('level=error', 100);
await syslogReader.saveToFile(logs, './logs/errors.txt', 'table');
```

### Append to Existing File

```typescript
const logs = await syslogReader.querySyslog('level=error', 10);
await syslogReader.saveToFile(logs, './logs/errors.json', 'json', true); // append=true
```

## Real-Time Log Tailing

The `startTailing` method provides `tail -f` like functionality for real-time log monitoring.

### Basic Tailing

```typescript
await syslogReader.startTailing('syslog', {
    interval: 5000, // Poll every 5 seconds
    initialLimit: 10, // Show last 10 logs initially
    query: 'level=error^ORDERBYDESCsys_created_on'
});

// Tail will run until stopped
// Press Ctrl+C or call stopTailing()
```

### Tail with Callback

```typescript
await syslogReader.startTailing('syslog', {
    interval: 3000,
    initialLimit: 5,
    query: 'level=error^ORlevel=warn',
    onLog: (log) => {
        // Process each new log
        console.log(`[${log.level}] ${log.message}`);
        
        // Send alert, update database, etc.
        if (log.level === 'error') {
            sendAlert(log.message);
        }
    }
});
```

### Tail with File Output

```typescript
await syslogReader.startTailing('syslog', {
    interval: 5000,
    initialLimit: 10,
    query: 'ORDERBYDESCsys_created_on',
    outputFile: './logs/tail-output.txt',
    append: true,
    formatOptions: {
        fields: ['sys_created_on', 'level', 'source', 'message'],
        maxMessageWidth: 80,
        dateFormat: 'locale'
    }
});
```

### Tail App Scope Logs

```typescript
await syslogReader.startTailing('syslog_app_scope', {
    interval: 5000,
    query: 'app_scope=x_my_app^ORDERBYDESCsys_created_on',
    onLog: (log) => {
        const appLog = log as SyslogAppScopeRecord;
        console.log(`[${appLog.app_scope}] ${appLog.message}`);
    }
});
```

### Stop Tailing

```typescript
// In another part of your code or signal handler
syslogReader.stopTailing();

// Check if currently tailing
if (syslogReader.isTailing) {
    console.log('Still tailing...');
}
```

## Complete Examples

### Example 1: Error Log Monitor

```typescript
import { SyslogReader, ServiceNowInstance } from '@sonisoft/now-sdk-ext-core';

async function monitorErrors() {
    const instance = new ServiceNowInstance({
        alias: 'my-instance'
    });
    
    const syslogReader = new SyslogReader(instance);
    
    console.log('Starting error log monitor...');
    
    await syslogReader.startTailing('syslog', {
        interval: 5000,
        initialLimit: 5,
        query: 'level=error^ORDERBYDESCsys_created_on',
        onLog: (log) => {
            console.log(`\n🔴 ERROR DETECTED`);
            console.log(`Time: ${log.sys_created_on}`);
            console.log(`Source: ${log.source}`);
            console.log(`Message: ${log.message}`);
            
            // Send notification
            sendSlackNotification(`Error in ServiceNow: ${log.message}`);
        },
        outputFile: './logs/errors.log',
        append: true
    });
}

monitorErrors().catch(console.error);
```

### Example 2: Application-Specific Log Viewer

```typescript
import { SyslogReader, ServiceNowInstance } from '@sonisoft/now-sdk-ext-core';

async function viewAppLogs(appScope: string, limit: number = 50) {
    const instance = new ServiceNowInstance({ alias: 'my-instance' });
    const syslogReader = new SyslogReader(instance);
    
    // Query logs for specific app
    const query = `app_scope=${appScope}^ORDERBYDESCsys_created_on`;
    const logs = await syslogReader.querySyslogAppScope(query, limit);
    
    console.log(`\n=== Logs for ${appScope} ===\n`);
    
    syslogReader.printTable(logs, {
        fields: ['sys_created_on', 'level', 'message'],
        maxMessageWidth: 100,
        dateFormat: 'relative'
    });
    
    // Also save to file
    await syslogReader.saveToFile(
        logs,
        `./logs/${appScope}-logs.json`,
        'json'
    );
    
    console.log(`\n✓ Logs saved to ./logs/${appScope}-logs.json`);
}

// Usage
viewAppLogs('x_my_custom_app', 100);
```

### Example 3: Daily Log Export

```typescript
import { SyslogReader, ServiceNowInstance } from '@sonisoft/now-sdk-ext-core';

async function exportDailyLogs() {
    const instance = new ServiceNowInstance({ alias: 'my-instance' });
    const syslogReader = new SyslogReader(instance);
    
    // Get logs from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const query = `sys_created_on>${yesterday}^ORDERBYDESCsys_created_on`;
    
    console.log('Exporting logs from last 24 hours...');
    
    const logs = await syslogReader.querySyslog(query, 10000);
    
    const date = new Date().toISOString().split('T')[0];
    
    // Export in multiple formats
    await syslogReader.saveToFile(logs, `./exports/${date}-logs.json`, 'json');
    await syslogReader.saveToFile(logs, `./exports/${date}-logs.csv`, 'csv');
    await syslogReader.saveToFile(logs, `./exports/${date}-logs.txt`, 'table');
    
    console.log(`✓ Exported ${logs.length} logs`);
    console.log(`  - JSON: ./exports/${date}-logs.json`);
    console.log(`  - CSV:  ./exports/${date}-logs.csv`);
    console.log(`  - Text: ./exports/${date}-logs.txt`);
}

exportDailyLogs().catch(console.error);
```

### Example 4: CLI Tool with Tail

```typescript
#!/usr/bin/env node
import { SyslogReader, ServiceNowInstance } from '@sonisoft/now-sdk-ext-core';
import { program } from 'commander';

program
    .name('syslog-tail')
    .description('Tail ServiceNow syslog in real-time')
    .option('-i, --instance <alias>', 'Instance alias')
    .option('-t, --table <table>', 'Table name (syslog or syslog_app_scope)', 'syslog')
    .option('-q, --query <query>', 'Encoded query string')
    .option('-l, --level <level>', 'Filter by log level')
    .option('-o, --output <file>', 'Output file path')
    .option('--interval <ms>', 'Polling interval in ms', '5000')
    .parse();

const options = program.opts();

async function main() {
    const instance = new ServiceNowInstance({
        alias: options.instance || 'default'
    });
    
    const syslogReader = new SyslogReader(instance);
    
    let query = options.query || 'ORDERBYDESCsys_created_on';
    
    if (options.level) {
        query = `level=${options.level}^${query}`;
    }
    
    console.log(`Tailing ${options.table} table...`);
    if (options.level) console.log(`Filtering by level: ${options.level}`);
    if (options.output) console.log(`Output file: ${options.output}`);
    console.log('\nPress Ctrl+C to stop\n');
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
        syslogReader.stopTailing();
        process.exit(0);
    });
    
    await syslogReader.startTailing(options.table as any, {
        interval: parseInt(options.interval),
        initialLimit: 10,
        query: query,
        outputFile: options.output,
        append: true,
        formatOptions: {
            fields: ['sys_created_on', 'level', 'source', 'message'],
            maxMessageWidth: 80,
            dateFormat: 'relative'
        }
    });
}

main().catch(console.error);
```

**Usage:**
```bash
# Tail all logs
./syslog-tail.ts -i my-instance

# Tail error logs only
./syslog-tail.ts -i my-instance -l error

# Tail with output file
./syslog-tail.ts -i my-instance -o ./logs/tail.log

# Tail app scope logs for specific app
./syslog-tail.ts -i my-instance -t syslog_app_scope -q "app_scope=x_my_app"
```

## API Reference

### Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

Creates a new SyslogReader instance.

### Methods

#### `querySyslog(encodedQuery?: string, limit?: number): Promise<SyslogRecord[]>`

Query the syslog table.

**Parameters:**
- `encodedQuery` (optional): ServiceNow encoded query string
- `limit` (optional): Maximum number of records to return (default: 100)

**Returns:** Promise<SyslogRecord[]>

#### `querySyslogAppScope(encodedQuery?: string, limit?: number): Promise<SyslogAppScopeRecord[]>`

Query the syslog_app_scope table.

**Parameters:**
- `encodedQuery` (optional): ServiceNow encoded query string
- `limit` (optional): Maximum number of records to return (default: 100)

**Returns:** Promise<SyslogAppScopeRecord[]>

#### `formatAsTable(records, options?): string`

Format log records as an ASCII table.

**Parameters:**
- `records`: Array of log records
- `options` (optional): Formatting options

**Returns:** Formatted table string

#### `printTable(records, options?): void`

Print log records as a formatted table to console.

#### `saveToFile(records, filePath, format?, append?): Promise<void>`

Save log records to a file.

**Parameters:**
- `records`: Array of log records
- `filePath`: Output file path
- `format`: Output format ('json', 'csv', 'table')
- `append`: Whether to append to existing file

#### `startTailing(tableName?, options?): Promise<void>`

Start tailing logs in real-time.

**Parameters:**
- `tableName`: 'syslog' or 'syslog_app_scope' (default: 'syslog')
- `options`: Tail options

#### `stopTailing(): void`

Stop the current tail operation.

#### `get isTailing(): boolean`

Check if currently tailing logs.

## Interfaces

### `SyslogRecord`

```typescript
interface SyslogRecord {
    sys_id: string;
    sys_created_on: string;
    level: string;
    message: string;
    source: string;
    sys_created_by?: string;
    [key: string]: unknown;
}
```

### `SyslogAppScopeRecord`

```typescript
interface SyslogAppScopeRecord extends SyslogRecord {
    app_scope: string;
    app_name?: string;
}
```

### `SyslogFormatOptions`

```typescript
interface SyslogFormatOptions {
    fields?: string[];
    maxMessageWidth?: number;
    includeHeaders?: boolean;
    dateFormat?: 'iso' | 'locale' | 'relative';
}
```

### `SyslogTailOptions`

```typescript
interface SyslogTailOptions {
    interval?: number;
    initialLimit?: number;
    query?: string;
    onLog?: (log: SyslogRecord | SyslogAppScopeRecord) => void;
    formatOptions?: SyslogFormatOptions;
    outputFile?: string;
    append?: boolean;
}
```

## Best Practices

1. **Use Encoded Queries**: Always use encoded queries to filter logs server-side rather than filtering after retrieval
2. **Limit Results**: Use appropriate limits to avoid overwhelming the system
3. **Order Results**: Always include ordering in your queries for consistent results
4. **Handle Errors**: Wrap calls in try-catch blocks to handle API errors gracefully
5. **Stop Tailing**: Always call `stopTailing()` when done to clean up resources
6. **File Rotation**: Implement log rotation for tail output files to prevent disk space issues

## Troubleshooting

### Issue: No logs returned
**Solution**: Check your encoded query syntax and ensure the table has data

### Issue: Tail not detecting new logs
**Solution**: Verify the instance is generating logs and check the polling interval

### Issue: Table formatting issues
**Solution**: Adjust `maxMessageWidth` and field selection in format options

### Issue: File save errors
**Solution**: Ensure the output directory exists and you have write permissions

## Related Documentation

- [ServiceNow Encoded Query Strings](https://www.servicenow.com/docs/bundle/zurich-platform-user-interface/page/use/using-lists/concept/c_EncodedQueryStrings.html)
- [TableAPIRequest Documentation](./TableAPIRequest.md)
- [Getting Started](./GettingStarted.md)


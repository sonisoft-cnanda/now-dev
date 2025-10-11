# SyslogReader - ChannelAjax Log Tailing

## Overview

The `SyslogReader` class now includes a more efficient method for tailing ServiceNow logs in real-time using the `ChannelAjax` processor. This approach is significantly more efficient than polling the Table API because it uses sequence numbers to track log positions.

## Key Differences

### Traditional Table API Approach (`startTailing`)
- Polls the `syslog` or `syslog_app_scope` tables using REST API
- Requires filtering by `sys_id` or timestamps to avoid duplicates
- Default interval: 5 seconds
- More database load on ServiceNow instance
- Can filter by encoded queries

### ChannelAjax Approach (`startTailingWithChannelAjax`)
- Uses the internal `ChannelAjax` processor via `xmlhttp.do`
- Tracks position using sequence numbers
- Default interval: 1 second (more responsive)
- Minimal database load - reads from log channel
- Returns all logs (no filtering capability)
- More efficient for real-time monitoring

## Usage

### Basic Example

```typescript
import { ServiceNowInstance, SyslogReader } from '@sonisoft/now-sdk-ext-core';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth/index.js';

async function tailLogs() {
    // Get credentials
    const credential = await getCredentials('your-instance-alias');
    
    // Create instance
    const instance = new ServiceNowInstance({
        alias: 'your-instance-alias',
        credential: credential
    });
    
    // Create reader
    const syslogReader = new SyslogReader(instance);
    
    // Start tailing with ChannelAjax
    await syslogReader.startTailingWithChannelAjax({
        interval: 1000, // Poll every second
        onLog: (log) => {
            console.log(`[${log.sequence}] ${log.message}`);
        }
    });
}

tailLogs();
```

### With File Output

```typescript
await syslogReader.startTailingWithChannelAjax({
    interval: 1000,
    outputFile: './logs/servicenow-tail.log',
    append: true,
    onLog: (log) => {
        const timestamp = new Date(log.sys_created_on).toLocaleString();
        console.log(`[${timestamp}] ${log.message}`);
    }
});
```

### Stop Tailing

```typescript
// Stop tailing gracefully
syslogReader.stopTailing();

// Handle Ctrl+C
process.on('SIGINT', () => {
    syslogReader.stopTailing();
    process.exit(0);
});
```

## API Reference

### Method: `startTailingWithChannelAjax(options)`

Starts tailing ServiceNow logs using the ChannelAjax processor.

#### Parameters

```typescript
interface SyslogTailOptions {
    /** Polling interval in milliseconds (default: 1000) */
    interval?: number;
    
    /** Callback function for each new log entry */
    onLog?: (log: SyslogRecord) => void;
    
    /** Format options for output (not used in ChannelAjax mode) */
    formatOptions?: SyslogFormatOptions;
    
    /** File path to write logs to (optional) */
    outputFile?: string;
    
    /** Whether to append to existing file (default: true) */
    append?: boolean;
}
```

#### Returns

`Promise<void>` - Resolves when tailing starts

#### Throws

- Error if already tailing logs

### Log Record Format

When using ChannelAjax, logs are converted to the `SyslogRecord` format:

```typescript
interface SyslogRecord {
    sys_id: string;         // Sequence number as ID
    sys_created_on: string; // ISO timestamp
    level: string;          // Always 'info' (ChannelAjax doesn't provide level)
    message: string;        // The log message
    source: string;         // Always 'logtail'
    sequence?: string;      // The sequence number from ChannelAjax
}
```

## How It Works

### Sequence-Based Tracking

The ChannelAjax processor maintains a sequence number for each log entry. When you request logs:

1. **Initial Request**: Send `sysparm_value=0` to get current logs
2. **Response**: Receive logs and a `channel_last_sequence` value
3. **Next Request**: Use the previous `channel_last_sequence` as `sysparm_value`
4. **Response**: Get only new logs since that sequence

This approach ensures:
- No duplicate logs
- No missed logs
- Minimal server load
- Fast response times

### XML Response Format

The ChannelAjax processor returns XML:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xml channel_last_sequence="19866707" 
     client_last_sequence="19866702" 
     sysparm_max="15">
    <item date="1760222118148" 
          message="SYSTEM User agent..." 
          sequence="19866703"/>
    <item date="1760222118148" 
          message="SYSTEM New transaction..." 
          sequence="19866704"/>
    <!-- More items... -->
</xml>
```

The library automatically parses this XML and converts it to `SyslogRecord` objects.

## Command-Line Example

A ready-to-use command-line script is provided:

```bash
# Basic usage
node docs/examples/syslog-tail-channel.mjs your-instance

# With output file
node docs/examples/syslog-tail-channel.mjs your-instance ./logs/tail.log

# Custom interval (500ms)
node docs/examples/syslog-tail-channel.mjs your-instance ./logs/tail.log 500
```

## Performance Comparison

| Feature | Table API | ChannelAjax |
|---------|-----------|-------------|
| Default Interval | 5000ms | 1000ms |
| Database Load | High | Minimal |
| Filtering | Yes | No |
| Real-time | Good | Excellent |
| Missed Logs | Possible | Never |
| Duplicates | Possible | Never |

## When to Use Each Method

### Use `startTailing()` (Table API) when:
- You need to filter logs by level, source, or other fields
- You want to tail `syslog_app_scope` table
- You need custom encoded queries
- Real-time performance is less critical

### Use `startTailingWithChannelAjax()` when:
- You need the most real-time log monitoring
- You want all logs without filtering
- You need guaranteed no duplicates or missed logs
- You want minimal impact on the ServiceNow instance

## Complete Example

See `docs/examples/syslog-tail-channel.mjs` for a complete, production-ready example with:
- Error handling
- Graceful shutdown (Ctrl+C)
- File output
- Formatted console output
- Command-line arguments

## Troubleshooting

### No logs appearing

**Problem**: Tailing starts but no logs appear

**Solutions**:
1. Verify your instance is active and generating logs
2. Check credentials are valid
3. Ensure you have access to the ChannelAjax processor
4. Try the traditional `startTailing()` method to compare

### Authentication errors

**Problem**: 401 or 403 errors

**Solutions**:
1. Re-authenticate: `snc configure profile set`
2. Verify user has sufficient permissions
3. Check if the instance requires special access for xmlhttp.do

### XML parsing errors

**Problem**: Error parsing XML response

**Solutions**:
1. Check ServiceNow instance version compatibility
2. Verify the ChannelAjax processor is available
3. Enable debug logging to see raw XML response

## Related Documentation

- [SyslogReader Overview](./SyslogReader.md)
- [SyslogReader Summary](./SyslogReaderSummary.md)
- [Table API Example](./examples/syslog-query-example.ts)
- [Traditional Tail Example](./examples/syslog-tail.mjs)


# ServiceNow Syslog Examples

This directory contains example scripts demonstrating how to use the `SyslogReader` class.

## Prerequisites

```bash
# Install dependencies (if not already done)
npm install

# Ensure tsx is installed for running TypeScript files
npm install --save-dev tsx
```

## Running the Examples

### Option 1: Using tsx (Recommended)

```bash
# Tail syslog
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012

# Tail error logs only
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error

# Tail with output file
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --output ./logs/tail.log

# Tail app scope logs
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --table syslog_app_scope
```

### Option 2: Using Node with ts-node/esm loader

```bash
node --loader ts-node/esm docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error
```

### Option 3: After Building the Project

```bash
# Build the project first
npm run build

# Then compile and run the example
npx tsc docs/examples/syslog-tail-cli.ts --module ESNext --target ES2020 --moduleResolution node
node docs/examples/syslog-tail-cli.js --instance tanengdev012
```

## Available Scripts

### syslog-tail-cli.ts

Real-time log monitoring tool (like `tail -f`)

**Options:**
- `--instance <alias>` - ServiceNow instance alias (required)
- `--table <table>` - Table name: `syslog` or `syslog_app_scope` (default: syslog)
- `--level <level>` - Filter by log level: error, warn, info, debug
- `--query <query>` - Custom encoded query string
- `--output <file>` - Output file path for logging
- `--interval <ms>` - Polling interval in milliseconds (default: 5000)
- `--limit <n>` - Number of initial logs to display (default: 10)

**Examples:**

```bash
# Monitor all logs
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012

# Monitor errors only
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error

# Monitor with custom query
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --query "sourceSTARTSWITHsecurity"

# Monitor and save to file
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error --output ./error-logs.txt

# Monitor specific app scope
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --table syslog_app_scope --query "app_scope=x_my_app"

# Fast polling (every 2 seconds)
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --interval 2000
```

### syslog-query-example.ts

Demonstrates various query patterns and export options

```bash
npx tsx docs/examples/syslog-query-example.ts
```

This script will:
- Show recent error logs
- Query logs from the last hour
- Filter by source
- Query app scope logs
- Export logs to multiple formats
- Demonstrate complex queries

## Troubleshooting

### Error: "Unknown file extension .ts"

This happens when using `ts-node` directly with ES modules. Use one of these solutions:

1. **Use tsx (recommended):**
   ```bash
   npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012
   ```

2. **Use node with loader:**
   ```bash
   node --loader ts-node/esm docs/examples/syslog-tail-cli.ts --instance tanengdev012
   ```

3. **Build and run JavaScript:**
   ```bash
   npm run build
   # Then use the compiled .js files in dist/
   ```

### Error: "No credentials found"

Configure your ServiceNow credentials:

```bash
snc configure profile set --profile tanengdev012 --username <username> --password <password> --instanceUrl <url>
```

Or use the SDK CLI authentication:

```bash
snc configure profile set
```

### Error: "Cannot find module"

Make sure all dependencies are installed:

```bash
npm install
```

## Creating Your Own CLI Tool

You can use these examples as templates for your own CLI tools:

1. Copy `syslog-tail-cli.ts` to your project
2. Modify the command-line argument parsing as needed
3. Add your custom log processing logic in the `onLog` callback
4. Run with `tsx` or compile to JavaScript

Example custom processing:

```typescript
await syslogReader.startTailing('syslog', {
    interval: 5000,
    query: 'level=error',
    onLog: (log) => {
        // Custom processing
        if (log.message.includes('authentication')) {
            sendAlert(log);
        }
        updateDashboard(log);
        saveToDatabase(log);
    }
});
```

## Tips

1. **Use encoded queries** to filter logs server-side for better performance
2. **Adjust polling interval** based on your needs (faster = more API calls)
3. **Save to file** for later analysis or auditing
4. **Use callbacks** to process logs in real-time (alerts, dashboards, etc.)
5. **Handle Ctrl+C** gracefully to ensure clean shutdown

## More Information

See the main documentation:
- [SyslogReader API Reference](../SyslogReader.md)
- [Encoded Query String Guide](../SyslogReader.md#servicenow-encoded-query-strings)


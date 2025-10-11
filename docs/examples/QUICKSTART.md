# Quick Start Guide - Running Syslog Examples

## The Problem

You're getting this error:
```
TypeError: Unknown file extension ".ts"
```

This happens because the project uses ES modules (`"type": "module"` in package.json), which requires special handling for TypeScript files.

## ✅ Solutions (Choose One)

### Solution 1: Use tsx (Recommended - Easiest)

**Install tsx globally (one time):**
```bash
npm install -g tsx
```

**Then run:**
```bash
tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error
```

**Or use npx (no installation needed):**
```bash
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error
```

---

### Solution 2: Use Node with ES Module Loader

```bash
node --loader ts-node/esm docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error
```

---

### Solution 3: Compile First, Then Run

**Step 1: Compile the example to JavaScript:**
```bash
npx tsc docs/examples/syslog-tail-cli.ts \
  --module ESNext \
  --target ES2020 \
  --moduleResolution node \
  --esModuleInterop \
  --skipLibCheck
```

**Step 2: Run the compiled JavaScript:**
```bash
node docs/examples/syslog-tail-cli.js --instance tanengdev012 --level error
```

---

### Solution 4: Create a Simple JavaScript Version

Create a file `syslog-tail.mjs`:

```javascript
import { SyslogReader, ServiceNowInstance } from '@sonisoft/now-sdk-ext-core';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";

const instanceAlias = process.argv[2] || 'tanengdev012';
const credential = await getCredentials(instanceAlias);

const instance = new ServiceNowInstance({
    alias: instanceAlias,
    credential: credential
});

const syslogReader = new SyslogReader(instance);

console.log(`Tailing logs for ${instanceAlias}...`);
console.log('Press Ctrl+C to stop\n');

process.on('SIGINT', () => {
    syslogReader.stopTailing();
    process.exit(0);
});

await syslogReader.startTailing('syslog', {
    interval: 5000,
    initialLimit: 10,
    query: 'level=error^ORDERBYDESCsys_created_on'
});
```

**Run it:**
```bash
node syslog-tail.mjs tanengdev012
```

---

## 🚀 Quick Examples

### Monitor Error Logs
```bash
# Using tsx
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error

# Using node loader
node --loader ts-node/esm docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error
```

### Monitor All Logs
```bash
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012
```

### Save to File
```bash
npx tsx docs/examples/syslog-tail-cli.ts \
  --instance tanengdev012 \
  --level error \
  --output ./logs/errors.log
```

### Monitor App Scope Logs
```bash
npx tsx docs/examples/syslog-tail-cli.ts \
  --instance tanengdev012 \
  --table syslog_app_scope \
  --query "app_scope=x_my_app"
```

### Fast Polling (Every 2 Seconds)
```bash
npx tsx docs/examples/syslog-tail-cli.ts \
  --instance tanengdev012 \
  --level error \
  --interval 2000
```

---

## 📝 Creating Your Own Script

If you want to create your own script without the TypeScript complexity, use this template:

**my-tail.mjs:**
```javascript
#!/usr/bin/env node
import { SyslogReader, ServiceNowInstance } from '@sonisoft/now-sdk-ext-core';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";

async function main() {
    const instanceAlias = 'tanengdev012'; // Or get from args
    const credential = await getCredentials(instanceAlias);
    
    const instance = new ServiceNowInstance({
        alias: instanceAlias,
        credential: credential
    });
    
    const syslogReader = new SyslogReader(instance);
    
    console.log('═══════════════════════════════════════');
    console.log('  Tailing ServiceNow Logs');
    console.log('═══════════════════════════════════════\n');
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\nStopping...');
        syslogReader.stopTailing();
        process.exit(0);
    });
    
    // Start tailing
    await syslogReader.startTailing('syslog', {
        interval: 5000,
        initialLimit: 10,
        query: 'level=error^ORDERBYDESCsys_created_on',
        onLog: (log) => {
            const time = new Date(log.sys_created_on).toLocaleTimeString();
            console.log(`[${time}] ${log.level}: ${log.message}`);
        }
    });
}

main().catch(console.error);
```

**Make it executable:**
```bash
chmod +x my-tail.mjs
```

**Run it:**
```bash
node my-tail.mjs
```

---

## 🔧 Troubleshooting

### Problem: "tsx: command not found"

**Solution:** Install tsx:
```bash
npm install -g tsx
# OR use npx
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012
```

### Problem: "No credentials found"

**Solution:** Configure credentials:
```bash
snc configure profile set \
  --profile tanengdev012 \
  --username your-username \
  --password your-password \
  --instanceUrl https://tanengdev012.service-now.com
```

### Problem: "Cannot find module"

**Solution:** Build the project first:
```bash
npm install
npm run build
```

### Problem: Still having TypeScript issues?

**Simplest Solution:** Just use JavaScript!

Create a `.mjs` file (see Solution 4 above) and run with plain Node.js. No TypeScript, no compilation, no hassle.

---

## 📚 More Information

- [Full SyslogReader Documentation](../SyslogReader.md)
- [Examples README](./README.md)
- [ServiceNow Encoded Query Strings](https://www.servicenow.com/docs/bundle/zurich-platform-user-interface/page/use/using-lists/concept/c_EncodedQueryStrings.html)

---

## 🎯 Recommended Approach

For **development and testing**:
```bash
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012
```

For **production CLI tools**:
1. Build the project: `npm run build`
2. Use compiled JavaScript from `dist/`
3. Or create a simple `.mjs` script (Solution 4)

**Why?** It's simpler, faster, and has no TypeScript compilation overhead at runtime.


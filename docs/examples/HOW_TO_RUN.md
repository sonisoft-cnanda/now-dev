# How to Run Syslog Tail Examples

## 🚨 Problem You Encountered

You got this error:
```
TypeError: Unknown file extension ".ts"
```

This happens because the project uses ES modules and `ts-node` doesn't work directly with `.ts` files in this setup.

---

## ✅ SOLUTION: Use One of These Methods

### Method 1: Use the JavaScript Version (EASIEST!)

I created a pure JavaScript version that works immediately:

```bash
# First, make sure the project is built
npm run build

# Then run the JavaScript version
node docs/examples/syslog-tail.mjs tanengdev012 error
```

**All options:**
```bash
# All logs
node docs/examples/syslog-tail.mjs tanengdev012

# Errors only
node docs/examples/syslog-tail.mjs tanengdev012 error

# Errors with file output
node docs/examples/syslog-tail.mjs tanengdev012 error ./logs/errors.log

# Warnings with faster polling (every 3 seconds)
node docs/examples/syslog-tail.mjs tanengdev012 warn ./logs/warnings.log 3000
```

---

### Method 2: Use tsx (If You Want TypeScript)

Install tsx globally:
```bash
npm install -g tsx
```

Then run:
```bash
tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error
```

Or use npx (no installation):
```bash
npx tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error
```

---

### Method 3: Use Node with Loader

```bash
node --loader ts-node/esm docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error
```

---

## 🎯 Quick Start (Recommended)

**Step 1: Build the project (one time)**
```bash
npm install
npm run build
```

**Step 2: Run the JavaScript version**
```bash
node docs/examples/syslog-tail.mjs tanengdev012 error
```

That's it! The JavaScript version (`syslog-tail.mjs`) works immediately without any TypeScript complexity.

---

## 📝 Available Options

### JavaScript Version (syslog-tail.mjs)

**Syntax:**
```bash
node syslog-tail.mjs <instance> [level] [output-file] [interval]
```

**Arguments:**
1. `instance` - ServiceNow instance alias (required)
2. `level` - Log level: `error`, `warn`, `info`, `debug`, or `all` (default: all)
3. `output-file` - Path to save logs (optional)
4. `interval` - Poll interval in milliseconds (default: 5000)

**Examples:**
```bash
# Monitor all logs
node docs/examples/syslog-tail.mjs tanengdev012

# Monitor errors only
node docs/examples/syslog-tail.mjs tanengdev012 error

# Save to file
node docs/examples/syslog-tail.mjs tanengdev012 error ./errors.log

# Fast polling (every 2 seconds)
node docs/examples/syslog-tail.mjs tanengdev012 all ./all-logs.log 2000
```

### TypeScript Version (syslog-tail-cli.ts)

**Syntax:**
```bash
tsx syslog-tail-cli.ts --instance <instance> [options]
```

**Options:**
- `--instance <alias>` - Instance alias (required)
- `--table <table>` - Table: syslog or syslog_app_scope (default: syslog)
- `--level <level>` - Log level filter
- `--query <query>` - Custom encoded query
- `--output <file>` - Output file path
- `--interval <ms>` - Poll interval (default: 5000)
- `--limit <n>` - Initial logs to show (default: 10)

**Examples:**
```bash
tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012
tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --level error
tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --query "sourceSTARTSWITHsecurity"
tsx docs/examples/syslog-tail-cli.ts --instance tanengdev012 --output ./logs/tail.log
```

---

## 🔧 Troubleshooting

### "No credentials found"

Configure your credentials:
```bash
snc configure profile set --profile tanengdev012
```

### "Cannot find module"

Build the project:
```bash
npm install
npm run build
```

### Still having issues?

Use the JavaScript version - it's simpler and just works:
```bash
node docs/examples/syslog-tail.mjs tanengdev012
```

---

## 💡 Which Method Should You Use?

| Method | When to Use |
|--------|-------------|
| **JavaScript (.mjs)** | **Best for production**, simple, no compilation needed |
| **tsx** | Development, when you want TypeScript syntax checking |
| **node --loader** | Alternative to tsx, built into Node |

**Recommendation:** Use the JavaScript version (`syslog-tail.mjs`) for reliability and simplicity.

---

## 📚 More Information

- [QUICKSTART.md](./QUICKSTART.md) - Detailed troubleshooting guide
- [README.md](./README.md) - Full examples documentation
- [SyslogReader.md](../SyslogReader.md) - API reference

---

## ✨ Summary

**To run right now:**

```bash
# 1. Build (if not already done)
npm run build

# 2. Run the JavaScript version
node docs/examples/syslog-tail.mjs tanengdev012 error

# That's it! 🎉
```

The error you encountered is fixed by using the `.mjs` version which runs directly with Node.js without any TypeScript compilation issues.


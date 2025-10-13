# Path Aliases Configuration

## Overview

The project uses TypeScript path aliases (`@src/*` and `@test/*`) to simplify imports. This document explains the configuration needed for these to work in both TypeScript compilation and Jest testing.

## Problem

TypeScript path aliases defined in `tsconfig.json` don't automatically work in Jest. Jest needs its own module resolution configuration.

## Solution

Path aliases must be configured in **three places**:

### 1. Root `tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",                    // ✅ REQUIRED: Base path for resolution
    "paths": {
      "@src/*": ["src/*"],             // Maps @src/* to src/*
      "@test/*": ["test/*"]            // Maps @test/* to test/*
    }
  }
}
```

**Key Points:**
- `baseUrl` must be set to `"."` (project root)
- Paths are relative to `baseUrl`

### 2. Test `tsconfig.json` (`test/tsconfig.json`)

```json
{
  "extends": "../tsconfig",
  "compilerOptions": {
    "noEmit": true,
    "baseUrl": "..",                   // ✅ REQUIRED: Relative to test directory
    "paths": {
      "@src/*": ["../src/*"],          // ✅ Relative paths from test/
      "@test/*": ["../test/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.test.ts"
  ]
}
```

**Key Points:**
- `baseUrl` is `".."` (one level up from test directory)
- Paths use `../` prefix to go up from test directory
- Overrides parent paths to work from test context

### 3. Jest Config (`jest.config.ts`)

```json
{
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",     // Handle .js extensions
    "^@src/(.*)$": "<rootDir>/src/$1", // ✅ REQUIRED: Map @src
    "^@test/(.*)$": "<rootDir>/test/$1" // ✅ REQUIRED: Map @test
  }
}
```

**Key Points:**
- Uses `<rootDir>` to refer to project root
- Maps `@src/*` to `<rootDir>/src/*`
- Maps `@test/*` to `<rootDir>/test/*`

## Usage

### In Source Files

```typescript
// Instead of:
import { MyClass } from '../../../sn/MyClass';

// Use:
import { MyClass } from '@src/sn/MyClass';
```

### In Test Files

```typescript
// Instead of:
import { MyClass } from '../../../src/sn/MyClass';

// Use:
import { MyClass } from '@src/sn/MyClass';
```

### In Test Utilities

```typescript
// Instead of:
import { MockHelper } from '../../__mocks__/helper';

// Use:
import { MockHelper } from '@test/unit/__mocks__/helper';
```

## Why Three Configurations?

### TypeScript Compiler (`tsconfig.json`)
- Used when running `tsc` or in VS Code
- Needs paths for type checking and intellisense

### Test TypeScript Config (`test/tsconfig.json`)
- Used for type checking test files
- Needs adjusted paths since tests are in subdirectory

### Jest (`jest.config.ts`)
- Used when running tests with Jest
- Has its own module resolution system
- Doesn't automatically read tsconfig paths

## Verification

### Check TypeScript Resolution
```bash
# Should compile without errors
npm run buildts
```

### Check Jest Resolution
```bash
# Should run tests without "Cannot find module" errors
npm test -- test/integration/amb/ChannelListener_IT.test.ts
```

### Check in VS Code
- Hover over imports using `@src/*`
- Should show correct file path
- Cmd+Click should navigate to file

## Common Issues

### Issue: "Cannot find module '@src/...'"

**In TypeScript:**
- Check `tsconfig.json` has `baseUrl` set
- Check `paths` are correctly defined
- Run `npm run buildts` to verify

**In Jest:**
- Check `jest.config.ts` has `moduleNameMapper` entries
- Verify `<rootDir>` resolves to project root
- Check no typos in path patterns

### Issue: TypeScript works but Jest doesn't

**Problem:** TypeScript and Jest use different module resolvers

**Solution:** Ensure both have matching configurations:
- `tsconfig.json`: Use `"baseUrl": "."` and `"@src/*": ["src/*"]`
- `jest.config.ts`: Use `"^@src/(.*)$": "<rootDir>/src/$1"`

### Issue: VS Code can't find imports

**Problem:** VS Code uses wrong tsconfig

**Solution:**
1. Open any .ts file
2. Cmd+Shift+P → "TypeScript: Select TypeScript Version"
3. Choose "Use Workspace Version"
4. Reload VS Code

## ES Modules and __dirname

In ES modules, `__dirname` is not available. Use this pattern:

```typescript
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Now __dirname works as expected
const filePath = path.join(__dirname, '../relative/path');
```

## Best Practices

### When to Use Path Aliases

✅ **Use path aliases for:**
- Cross-module imports
- Test utilities
- Frequently imported modules
- Deep nesting scenarios

❌ **Don't use path aliases for:**
- Imports within same directory (use `./file`)
- Sibling files (use `./sibling`)
- Parent directory (use `../parent`)

### Migration from Relative Paths

If you have existing tests with relative paths, you can migrate gradually:

```typescript
// Old (still works)
import { Channel } from '../../../src/sn/amb/Channel';

// New (cleaner)
import { Channel } from '@src/sn/amb/Channel';
```

Both will work once path mapping is configured.

## Testing the Configuration

Create a test file to verify paths work:

```typescript
// test/integration/test-paths.test.ts
import { describe, it, expect } from '@jest/globals';
import { AMBConstants } from '@src/sn/amb/AMBConstants';

describe('Path Mapping Test', () => {
    it('should resolve @src paths', () => {
        expect(AMBConstants).toBeDefined();
        expect(AMBConstants.WEBSOCKET_TYPE_NAME).toBe('websocket');
    });
});
```

Run: `npm test -- test/integration/test-paths.test.ts`

## Summary

**For path aliases to work:**

1. ✅ Root `tsconfig.json` needs `baseUrl: "."` and `paths`
2. ✅ Test `tsconfig.json` needs `baseUrl: ".."` and adjusted `paths`
3. ✅ `jest.config.ts` needs `moduleNameMapper` with `@src` and `@test` mappings
4. ✅ Use `fileURLToPath(import.meta.url)` for `__dirname` in ES modules

All configurations are now properly set up! 🎉


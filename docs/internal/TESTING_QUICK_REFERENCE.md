# Testing Quick Reference

## Test Commands

```bash
# Unit Tests (Fast, No Credentials)
npm test                           # Run all unit tests
npm run test:unit                  # Run all unit tests (explicit)
npm run watch-test                 # Watch mode for unit tests

# Integration Tests (Requires Credentials)
npm run test:integration           # Run all integration tests
npm run watch-test:integration     # Watch mode for integration tests

# All Tests
npm run test:all                   # Run unit + integration tests

# Specific Tests
npm test -- path/to/test.ts        # Run specific test file
npm test -- test/unit/sn/          # Run tests in directory
npm test -- --testNamePattern="pattern"  # Run tests matching pattern
```

## Test Organization

```
test/
├── unit/                  ← Unit tests (mocks only, fast)
│   ├── __mocks__/        ← Reusable mocks
│   ├── comm/http/        ← 87 HTTP tests
│   ├── auth/             ← 11 auth tests
│   ├── sn/               ← 80 ServiceNow tests
│   └── amb/              ← 2 AMB tests
│
└── integration/           ← Integration tests (real API)
    ├── amb/              ← 17 AMB tests
    ├── sn/               ← 7 SN tests
    └── auth/             ← 1 auth test
```

## When to Use Which

### Unit Tests ✅
- Testing logic
- Testing error handling  
- Testing state management
- Fast feedback during development
- CI/CD pipelines
- Pre-commit hooks

### Integration Tests 🌍
- Testing API interactions
- Testing complete workflows
- Validating real behavior
- End-to-end scenarios
- Release validation
- Nightly builds

## Test Stats

| Type | Count | Speed | Requires Creds |
|------|-------|-------|----------------|
| Unit | 180 | ~2.4s | ❌ No |
| Integration | 25+ | ~30-300s | ✅ Yes |

## Common Patterns

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MyClass } from '../../src/MyClass';
import { createGetCredentialsMock } from './__mocks__/servicenow-sdk-mocks';

const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

describe('MyClass - Unit Tests', () => {
    let myClass: MyClass;

    beforeEach(async () => {
        const credential = await mockGetCredentials('test');
        const instance = new ServiceNowInstance({
            alias: 'test',
            credential
        });
        myClass = new MyClass(instance);
    });

    it('should work', () => {
        expect(myClass).toBeDefined();
    });
});
```

### Integration Test Template

```typescript
import { getCredentials } from '@servicenow/sdk-cli/dist/auth/index.js';

describe('MyClass - Integration Tests', () => {
    let myClass: MyClass;

    beforeEach(async () => {
        const credential = await getCredentials('real-instance');
        const instance = new ServiceNowInstance({
            alias: 'real-instance',
            credential
        });
        myClass = new MyClass(instance);
    });

    it('should work with real API', async () => {
        const result = await myClass.doSomething();
        expect(result).toBeDefined();
    }, 60000);
});
```

## Available Mocks

```typescript
// From test/unit/__mocks__/servicenow-sdk-mocks.ts

createGetCredentialsMock()         // Mock credentials
createGetSafeUserSessionMock()     // Mock session
createMockServiceNowInstance()     // Mock instance
createSuccessResponse()            // HTTP 200 response
createErrorResponse()              // HTTP error response
MockAuthenticationHandler          // Auth handler
MockLogger                         // Logger
MockCookieStore                    // Cookie store
MockResponse                       // HTTP response
```

## Debugging Tests

```bash
# Verbose output
npm test -- --verbose

# Run single test
npm test -- --testNamePattern="specific test name"

# Debug with Node
node --inspect-brk node_modules/.bin/jest --runInBand test/path/test.ts

# Show console.log output
npm test -- --silent=false
```

## Pre-Commit Checklist

- [ ] Run `npm test` (unit tests)
- [ ] All tests pass
- [ ] No linter errors: `npm run lint`
- [ ] Build succeeds: `npm run buildts`
- [ ] (Optional) Run `npm run test:integration` if relevant

## Coverage

```bash
# Generate coverage report
npm test -- --coverage

# View in browser
open coverage/index.html

# Coverage by directory
npm test -- --coverage --coverageDirectory=coverage test/unit/sn/
```

## Watch Mode Tips

```bash
# Watch unit tests
npm run watch-test

# Press 'p' to filter by filename
# Press 't' to filter by test name
# Press 'q' to quit
# Press 'a' to run all tests
# Press 'f' to run only failed tests
```

## Quick Troubleshooting

| Error | Solution |
|-------|----------|
| "Cannot locate module" | Check import paths, ensure module exists |
| "No credentials found" | For unit tests: use mocks. For integration: `snc configure profile set` |
| "Test timeout" | Increase timeout or use `--testTimeout=120000` |
| "Mock not working" | Clear mocks with `jest.clearAllMocks()` in `beforeEach()` |

---

**For complete testing documentation**, see `docs/TESTING.md`


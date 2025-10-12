# Testing Guide

## Overview

The project has a comprehensive test suite separated into **unit tests** and **integration tests**.

## Test Scripts

### Quick Reference

```bash
npm test                    # Run unit tests only (fast, no credentials)
npm run test:unit           # Run unit tests only (same as npm test)
npm run test:integration    # Run integration tests (requires credentials)
npm run test:all            # Run ALL tests (unit + integration)
npm run watch-test          # Watch mode for unit tests
npm run watch-test:integration  # Watch mode for integration tests
```

## Unit Tests

### Location
`test/unit/`

### Characteristics
- ✅ **Fast**: ~2-3 seconds for 180+ tests
- ✅ **No credentials required**: Uses mocks
- ✅ **Deterministic**: Same results every time
- ✅ **CI/CD ready**: Runs anywhere
- ✅ **Test logic and structure**: Focus on code behavior

### Running Unit Tests

```bash
# Run all unit tests (default)
npm test

# Or explicitly
npm run test:unit

# Run specific unit test file
npm test -- test/unit/ATFTestExecutor.test.ts

# Run unit tests in a directory
npm test -- test/unit/sn/

# Watch mode for TDD
npm run watch-test

# With coverage
npm test -- --coverage
```

### Unit Test Structure

```typescript
import { createGetCredentialsMock } from './__mocks__/servicenow-sdk-mocks';

const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

describe('ClassName - Unit Tests', () => {
    beforeEach(async () => {
        const credential = await mockGetCredentials('test-instance');
        // Setup with mocks
    });
    
    it('should test behavior', () => {
        // Test with mocks
    });
});
```

## Integration Tests

### Location
`test/integration/`

### Characteristics
- ⚠️ **Requires credentials**: Real ServiceNow instance access
- ⏱️ **Slower**: Seconds to minutes (network calls)
- 🌍 **Environment-dependent**: Requires instance availability
- ✅ **Real validation**: Tests actual API behavior
- ✅ **End-to-end**: Complete workflows

### Running Integration Tests

```bash
# First, configure ServiceNow credentials
snc configure profile set

# Run all integration tests
npm run test:integration

# Run specific integration test
npm run test:integration -- ATFTestExecutor_IT.test.ts

# Run integration tests in a directory
npm run test:integration -- test/integration/sn/

# Watch mode
npm run watch-test:integration
```

### Integration Test Structure

```typescript
import { getCredentials } from '@servicenow/sdk-cli/dist/auth/index.js';

describe('ClassName - Integration Tests', () => {
    beforeEach(async () => {
        const credential = await getCredentials('real-instance-alias');
        // Setup with real credentials
    });
    
    it('should test real API', async () => {
        // Test with real ServiceNow instance
    }, 60000); // Long timeout for network calls
});
```

## Test Categories

### Unit Tests (180 tests)

| Category | Tests | Files |
|----------|-------|-------|
| HTTP Layer | 87 | 3 files |
| Authentication | 11 | 1 file |
| Application Management | 30 | 3 files |
| Background Scripts | 9 | 1 file |
| ATF Testing | 9 | 1 file |
| Syslog | 19 | 1 file |
| Progress | 5 | 1 file |
| AMB | 2 | 1 file |
| Others | 8 | 2 files |

### Integration Tests (25+ files)

| Category | Files |
|----------|-------|
| AMB | 17 files |
| Application Management | 3 files |
| Authentication | 1 file |
| Background Scripts | 1 file |
| ATF | 1 file |
| Syslog | 1 file |
| Progress | 1 file |

## CI/CD Integration

### GitHub Actions / GitLab CI Example

```yaml
test:
  script:
    # Run unit tests (fast, no credentials)
    - npm run test:unit
    
    # Optionally run integration tests if credentials available
    - if [ -n "$SERVICENOW_CREDENTIALS" ]; then
        npm run test:integration;
      fi
```

### Recommended Pipeline

```yaml
stages:
  - test-unit
  - test-integration
  - build

unit-tests:
  stage: test-unit
  script:
    - npm run test:unit
  # Runs on every commit

integration-tests:
  stage: test-integration
  script:
    - snc configure profile set --profile $INSTANCE_ALIAS
    - npm run test:integration
  # Only on main branch or tags
  only:
    - main
    - tags
```

## Test Development Workflow

### TDD (Test-Driven Development)

```bash
# 1. Start watch mode
npm run watch-test

# 2. Create/modify test
# 3. Watch test fail
# 4. Implement feature
# 5. Watch test pass
# 6. Refactor
```

### Adding New Tests

#### Unit Test
1. Create test file in `test/unit/`
2. Use mocks from `test/unit/__mocks__/servicenow-sdk-mocks.ts`
3. Test logic and structure
4. Run `npm test` to verify

#### Integration Test
1. Create test file in `test/integration/` with `_IT` suffix
2. Use real `getCredentials()`
3. Test actual API behavior
4. Run `npm run test:integration` to verify

## Mocking Guide

### Available Mocks

```typescript
import {
    createGetCredentialsMock,
    createGetSafeUserSessionMock,
    createMockServiceNowInstance,
    createSuccessResponse,
    createErrorResponse,
    MockAuthenticationHandler,
    MockLogger
} from './__mocks__/servicenow-sdk-mocks';
```

### Using Mocks

#### Mock Credentials

```typescript
const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

// In test
const credential = await mockGetCredentials('my-instance');
// Returns complete mock credential object
```

#### Mock Session

```typescript
const mockGetSafeUserSession = createGetSafeUserSessionMock();
jest.mock('@servicenow/sdk-cli-core/dist/util/sessionToken.js', () => ({
    getSafeUserSession: mockGetSafeUserSession
}));

// In test
const session = await mockGetSafeUserSession(auth, logger);
// Returns mock session with all methods
```

#### Mock Instance

```typescript
const mockInstance = createMockServiceNowInstance('test-instance');
// mockInstance has getAlias(), getHost(), etc.
```

### Complete Example

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MyClass } from '../../src/MyClass';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../src/sn/ServiceNowInstance';
import { createGetCredentialsMock } from './__mocks__/servicenow-sdk-mocks';

const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

describe('MyClass - Unit Tests', () => {
    let instance: ServiceNowInstance;
    let myClass: MyClass;

    beforeEach(async () => {
        const credential = await mockGetCredentials('test-instance');
        const snSettings: ServiceNowSettingsInstance = {
            alias: 'test-instance',
            credential: credential
        };
        instance = new ServiceNowInstance(snSettings);
        myClass = new MyClass(instance);
    });

    it('should initialize correctly', () => {
        expect(myClass).toBeInstanceOf(MyClass);
    });
});
```

## Troubleshooting

### "Cannot locate module" errors

**Problem**: Jest can't find modules with `.js` extension

**Solution**: Some existing AMB tests have module resolution issues. These are pre-existing and being addressed separately.

### "No credentials found" in unit tests

**Problem**: Unit test is trying to use real credentials

**Solution**: Make sure you're using mocks:
```typescript
const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));
```

### Integration tests fail with auth errors

**Problem**: Credentials not configured

**Solution**:
```bash
snc configure profile set --profile your-instance
```

### Tests timeout

**Problem**: Default timeout too short for integration tests

**Solution**: Integration test script already has `--testTimeout=120000` (2 minutes)

Or in test:
```typescript
it('should complete long operation', async () => {
    // test code
}, 180000); // 3 minutes
```

## Best Practices

### Unit Tests
1. ✅ Use mocks for all external dependencies
2. ✅ Test one thing at a time
3. ✅ Keep tests fast (< 100ms each)
4. ✅ Test edge cases and error handling
5. ✅ Use descriptive test names

### Integration Tests
1. ✅ Test complete workflows
2. ✅ Use realistic data
3. ✅ Clean up after tests (delete created records)
4. ✅ Use appropriate timeouts
5. ✅ Skip with `.skip()` if instance unavailable

### General
1. ✅ Name unit tests: `ClassName.test.ts`
2. ✅ Name integration tests: `ClassName_IT.test.ts`
3. ✅ Group related tests with `describe()`
4. ✅ Use `beforeEach()` for setup
5. ✅ Clear mocks between tests

## Test Coverage

### Current Coverage
- **Statements**: 10.56%
- **Branches**: 7.39%
- **Functions**: 8.77%
- **Lines**: 10.59%

### Improving Coverage

```bash
# Run tests with coverage report
npm test -- --coverage

# See detailed coverage
open coverage/index.html
```

### Coverage Goals
- Unit tests should cover logic and structure
- Integration tests validate real-world usage
- Combined coverage target: 70%+

## FAQ

### Q: When should I write a unit test vs integration test?

**Unit Test when:**
- Testing logic and algorithms
- Testing error handling
- Testing state management
- Fast feedback needed
- No ServiceNow instance required

**Integration Test when:**
- Testing API interactions
- Testing end-to-end workflows
- Validating ServiceNow-specific behavior
- Testing with real data

### Q: Can I run both test types together?

Yes:
```bash
npm run test:all
```

### Q: How do I debug a failing test?

```bash
# Run specific test with verbose output
npm test -- path/to/test.ts --verbose

# Use Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand path/to/test.ts
```

### Q: Can I run tests in parallel?

Yes, Jest runs tests in parallel by default. To run serially:
```bash
npm test -- --runInBand
```

## Performance

### Unit Tests
- **Average**: ~2-3 seconds for 180 tests
- **Per test**: ~13-17ms average
- **Suitable for**: Every commit, PR checks, pre-push hooks

### Integration Tests
- **Average**: Varies (seconds to minutes)
- **Per test**: Depends on API complexity
- **Suitable for**: Main branch, releases, nightly builds

## Next Steps

1. Review unit test coverage
2. Add more unit tests for uncovered code
3. Run integration tests on CI/CD
4. Set up coverage thresholds
5. Add performance benchmarks

---

For more information, see:
- **Mock Documentation**: `test/unit/__mocks__/README.md`
- **Test Reorganization**: `docs/TEST_REORGANIZATION_SUMMARY.md`
- **Migration Summary**: `TEST_MIGRATION_COMPLETE.md`


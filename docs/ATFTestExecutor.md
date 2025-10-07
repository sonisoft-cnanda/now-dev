# ATFTestExecutor

The `ATFTestExecutor` class provides functionality for executing Automated Test Framework (ATF) tests and test suites programmatically.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)

## Overview

The `ATFTestExecutor` enables you to:

- Execute individual ATF tests
- Run complete test suites
- Monitor test execution progress
- Configure test execution parameters (browser, OS, cloud runner)
- Retrieve detailed test results
- Integrate testing into CI/CD pipelines

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, ATFTestExecutor } from '@sonisoft/now-sdk-ext-core';

const testExecutor = new ATFTestExecutor(instance);
```

## Methods

### executeTest

Executes a single ATF test and waits for completion.

```typescript
async executeTest(testId: string): Promise<TestResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `testId` | `string` | Sys ID of the test to execute |

#### Returns

`Promise<TestResult>` containing:
- `test_name`: Name of the test
- `status`: Test status ("success", "failure", etc.)
- `run_time`: Time taken to execute
- `output`: Test output/logs
- `sys_id`: Result sys_id

#### Example

```typescript
const result = await testExecutor.executeTest('test-sys-id-here');

console.log(`Test: ${result.test_name}`);
console.log(`Status: ${result.status}`);
console.log(`Run Time: ${result.run_time}`);

if (result.status !== 'success') {
    console.error(`Test failed!`);
    console.error(result.output);
    process.exit(1);
}
```

---

### executeTestSuite

Initiates execution of a test suite.

```typescript
async executeTestSuite(
    testSuiteSysId: string,
    options?: Partial<TestSuiteExecutionRequest>
): Promise<TestSuiteExecutionResponse>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `testSuiteSysId` | `string` | Sys ID of the test suite |
| `options` | `Partial<TestSuiteExecutionRequest>` | Optional execution parameters |

#### TestSuiteExecutionRequest Options

```typescript
interface TestSuiteExecutionRequest {
    browser_name?: string;              // 'any', 'chrome', 'firefox', 'edge', 'safari'
    browser_version?: string;           // Starting version (e.g., "9" for 9.x.x.x)
    is_performance_run?: boolean;       // Run as performance test
    os_name?: string;                   // Operating system name
    os_version?: string;                // Starting OS version
    run_in_cloud?: boolean;             // Use Cloud Runner
}
```

#### Example

```typescript
const response = await testExecutor.executeTestSuite('suite-sys-id', {
    browser_name: 'chrome',
    run_in_cloud: false
});

console.log(`Test suite started: ${response.links.progress.id}`);
```

---

### executeTestSuiteByName

Executes a test suite by name instead of sys_id.

```typescript
async executeTestSuiteByName(
    testSuiteName: string,
    options?: Partial<TestSuiteExecutionRequest>
): Promise<TestSuiteExecutionResponse>
```

#### Example

```typescript
const response = await testExecutor.executeTestSuiteByName('My Test Suite', {
    browser_name: 'firefox',
    is_performance_run: false
});
```

---

### executeTestSuiteAndWait

Executes a test suite and waits for completion.

```typescript
async executeTestSuiteAndWait(
    testSuiteSysId: string,
    options?: Partial<TestSuiteExecutionRequest>,
    pollIntervalMs?: number
): Promise<TestSuiteExecutionResult>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `testSuiteSysId` | `string` | - | Test suite sys_id |
| `options` | `Partial<TestSuiteExecutionRequest>` | - | Execution options |
| `pollIntervalMs` | `number` | `5000` | Polling interval |

#### Returns

`Promise<TestSuiteExecutionResult>` containing:
- `total_tests`: Total number of tests
- `passed_tests`: Number of passed tests
- `failed_tests`: Number of failed tests
- `skipped_tests`: Number of skipped tests
- `status`: Overall status
- `duration`: Total execution time

#### Example

```typescript
const result = await testExecutor.executeTestSuiteAndWait('suite-sys-id', {
    browser_name: 'chrome',
    run_in_cloud: false
});

console.log(`Total Tests: ${result.total_tests}`);
console.log(`Passed: ${result.passed_tests}`);
console.log(`Failed: ${result.failed_tests}`);

if (result.failed_tests > 0) {
    console.error(`${result.failed_tests} tests failed!`);
    process.exit(1);
}
```

---

### getTestSuiteProgress

Gets the current progress of a test suite execution.

```typescript
async getTestSuiteProgress(progressId: string): Promise<TestSuiteExecutionResponse>
```

#### Example

```typescript
const response = await testExecutor.executeTestSuite('suite-id');
const progressId = response.links.progress.id;

let progress = await testExecutor.getTestSuiteProgress(progressId);
while (progress.percent_complete < 100) {
    console.log(`Progress: ${progress.percent_complete}%`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    progress = await testExecutor.getTestSuiteProgress(progressId);
}
```

## Interfaces

### TestResult

```typescript
interface TestResult {
    end_time_millis: string;
    execution_tracker: ReferenceLink;
    test_name: string;
    test: ReferenceLink;
    rollback_context: ReferenceLink;
    root_tracker_id: ReferenceLink;
    output: string;
    sys_id: string;
    run_time: string;
    status: string;
}
```

### TestSuiteExecutionResult

```typescript
interface TestSuiteExecutionResult {
    sys_id: string;
    test_suite: ReferenceLink;
    status: string;
    start_time: string;
    end_time: string;
    duration: string;
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    skipped_tests: number;
    output: string;
}
```

## Examples

### Example 1: CI/CD Test Execution

```typescript
async function runCICDTests() {
    const testExecutor = new ATFTestExecutor(instance);
    
    console.log('Running test suite...');
    const result = await testExecutor.executeTestSuiteAndWait('smoke-tests-suite-id');
    
    console.log('\n=== Test Results ===');
    console.log(`Total: ${result.total_tests}`);
    console.log(`Passed: ${result.passed_tests}`);
    console.log(`Failed: ${result.failed_tests}`);
    console.log(`Duration: ${result.duration}`);
    
    if (result.failed_tests > 0) {
        console.error('\n✗ Tests failed - blocking deployment');
        process.exit(1);
    }
    
    console.log('\n✓ All tests passed - proceeding with deployment');
}
```

### Example 2: Cross-Browser Testing

```typescript
async function crossBrowserTest(suiteId: string) {
    const testExecutor = new ATFTestExecutor(instance);
    const browsers = ['chrome', 'firefox', 'edge'];
    const results = [];
    
    for (const browser of browsers) {
        console.log(`\nTesting on ${browser}...`);
        
        const result = await testExecutor.executeTestSuiteAndWait(suiteId, {
            browser_name: browser,
            run_in_cloud: true
        });
        
        results.push({
            browser,
            passed: result.passed_tests,
            failed: result.failed_tests,
            total: result.total_tests
        });
    }
    
    // Summary
    console.log('\n=== Cross-Browser Test Summary ===');
    results.forEach(r => {
        const status = r.failed === 0 ? '✓' : '✗';
        console.log(`${status} ${r.browser}: ${r.passed}/${r.total} passed`);
    });
}
```

### Example 3: Performance Testing

```typescript
async function runPerformanceTests() {
    const testExecutor = new ATFTestExecutor(instance);
    
    const result = await testExecutor.executeTestSuiteAndWait('perf-suite-id', {
        is_performance_run: true,
        browser_name: 'chrome'
    });
    
    console.log('Performance Test Results:');
    console.log(`Duration: ${result.duration}`);
    console.log(`Status: ${result.status}`);
}
```

## Best Practices

1. **Always Check Results**: Verify test status before proceeding
2. **Use Appropriate Timeouts**: Test suites can take a long time
3. **Log Test Output**: Capture output for debugging
4. **Fail Fast**: Exit with error code if tests fail in CI/CD
5. **Browser Specification**: Specify browser for consistent results
6. **Progress Monitoring**: Log progress for long-running suites

## Related

- [Getting Started Guide](./GettingStarted.md)
- [Application Manager](./ApplicationManager.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)


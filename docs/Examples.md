# Examples & Recipes

Real-world examples and common patterns for using ServiceNow SDK Extension Core.

## Table of Contents

- [CI/CD Deployment Pipeline](#cicd-deployment-pipeline)
- [Application Version Management](#application-version-management)
- [Automated Testing Workflows](#automated-testing-workflows)
- [Multi-Environment Deployment](#multi-environment-deployment)
- [Error Handling Patterns](#error-handling-patterns)
- [Progress Monitoring](#progress-monitoring)

## CI/CD Deployment Pipeline

Complete CI/CD pipeline example:

```typescript
import { ServiceNowInstance, ApplicationManager, ATFTestExecutor, AppRepoApplication } from '@sonisoft/now-sdk-ext-core';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth';

async function deployPipeline() {
    // Setup
    const credential = await getCredentials('target-instance');
    const instance = new ServiceNowInstance({
        alias: 'target-instance',
        credential
    });
    
    const appManager = new ApplicationManager(instance);
    const testExecutor = new ATFTestExecutor(instance);
    const appRepo = new AppRepoApplication(instance);
    
    try {
        // Step 1: Validate applications
        console.log('Step 1: Validating applications...');
        const validation = await appManager.validateBatchDefinition('./apps.json');
        
        if (!validation.isValid) {
            throw new Error(`Validation failed with ${validation.errors} errors`);
        }
        
        console.log(`  ✓ ${validation.alreadyValid} apps valid`);
        console.log(`  ⚠ ${validation.needsInstallation + validation.needsUpgrade} apps need updates`);
        
        // Step 2: Install/upgrade applications
        if (validation.needsInstallation + validation.needsUpgrade > 0) {
            console.log('\nStep 2: Installing applications...');
            await appManager.installBatch('./apps.json');
            console.log('  ✓ Installation complete');
        } else {
            console.log('\nStep 2: Skipped (all apps up to date)');
        }
        
        // Step 3: Run smoke tests
        console.log('\nStep 3: Running smoke tests...');
        const testResults = await testExecutor.executeTestSuiteAndWait('smoke-test-suite-id', {
            browser_name: 'chrome',
            run_in_cloud: false
        });
        
        console.log(`  Tests: ${testResults.passed_tests}/${testResults.total_tests} passed`);
        
        if (testResults.failed_tests > 0) {
            throw new Error(`${testResults.failed_tests} tests failed`);
        }
        
        console.log('\n✅ Deployment successful!');
        return true;
        
    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
        throw error;
    }
}

deployPipeline();
```

## Application Version Management

Check and manage application versions:

```typescript
async function manageApplicationVersions() {
    const appManager = new ApplicationManager(instance);
    
    // Get validation results
    const validation = await appManager.validateBatchDefinition('./apps.json');
    
    // Generate version report
    console.log('=== Application Version Report ===\n');
    
    for (const app of validation.applications) {
        console.log(`Application: ${app.name || app.id}`);
        console.log(`  Current: ${app.installed_version || 'Not installed'}`);
        console.log(`  Required: ${app.requested_version}`);
        console.log(`  Status: ${app.validationStatus}`);
        
        if (app.needsAction) {
            if (app.validationStatus === 'not_installed') {
                console.log(`  Action: INSTALL version ${app.requested_version}`);
            } else if (app.validationStatus === 'update_needed') {
                console.log(`  Action: UPGRADE from ${app.installed_version} to ${app.requested_version}`);
            }
        } else {
            console.log(`  Action: None - up to date`);
        }
        
        console.log('');
    }
    
    // Summary
    console.log('=== Summary ===');
    console.log(`Total Applications: ${validation.totalApplications}`);
    console.log(`Up to Date: ${validation.alreadyValid}`);
    console.log(`Needs Installation: ${validation.needsInstallation}`);
    console.log(`Needs Upgrade: ${validation.needsUpgrade}`);
    console.log(`Errors: ${validation.errors}`);
}
```

## Automated Testing Workflows

### Sequential Test Execution

```typescript
async function runSequentialTests() {
    const testExecutor = new ATFTestExecutor(instance);
    
    const testSuites = [
        { id: 'unit-tests-id', name: 'Unit Tests' },
        { id: 'integration-tests-id', name: 'Integration Tests' },
        { id: 'e2e-tests-id', name: 'End-to-End Tests' }
    ];
    
    const results = [];
    
    for (const suite of testSuites) {
        console.log(`\nRunning ${suite.name}...`);
        
        const result = await testExecutor.executeTestSuiteAndWait(suite.id);
        
        results.push({
            name: suite.name,
            passed: result.passed_tests,
            failed: result.failed_tests,
            total: result.total_tests,
            duration: result.duration
        });
        
        console.log(`  ✓ ${result.passed_tests}/${result.total_tests} passed`);
        console.log(`  Duration: ${result.duration}`);
        
        if (result.failed_tests > 0) {
            console.error(`  ✗ ${result.failed_tests} tests failed - stopping execution`);
            break;
        }
    }
    
    // Summary
    console.log('\n=== Test Summary ===');
    results.forEach(r => {
        const status = r.failed === 0 ? '✓' : '✗';
        console.log(`${status} ${r.name}: ${r.passed}/${r.total} (${r.duration})`);
    });
    
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    return totalFailed === 0;
}
```

### Parallel Test Execution

```typescript
async function runParallelTests() {
    const testExecutor = new ATFTestExecutor(instance);
    
    const testSuites = [
        'smoke-tests-id',
        'api-tests-id',
        'ui-tests-id'
    ];
    
    console.log(`Running ${testSuites.length} test suites in parallel...`);
    
    const promises = testSuites.map(id =>
        testExecutor.executeTestSuiteAndWait(id)
    );
    
    const results = await Promise.all(promises);
    
    // Summary
    const totalTests = results.reduce((sum, r) => sum + r.total_tests, 0);
    const totalPassed = results.reduce((sum, r) => sum + r.passed_tests, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed_tests, 0);
    
    console.log('\n=== Combined Results ===');
    console.log(`Total: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    
    return totalFailed === 0;
}
```

## Multi-Environment Deployment

Deploy to multiple environments:

```typescript
interface Environment {
    name: string;
    alias: string;
    testSuite?: string;
}

async function multiEnvironmentDeploy() {
    const environments: Environment[] = [
        { name: 'Development', alias: 'dev-instance', testSuite: 'dev-tests' },
        { name: 'Test', alias: 'test-instance', testSuite: 'test-suite' },
        { name: 'Production', alias: 'prod-instance', testSuite: 'smoke-tests' }
    ];
    
    for (const env of environments) {
        console.log(`\n=== Deploying to ${env.name} ===`);
        
        try {
            // Create instance connection
            const credential = await getCredentials(env.alias);
            const instance = new ServiceNowInstance({
                alias: env.alias,
                credential
            });
            
            const appManager = new ApplicationManager(instance);
            const testExecutor = new ATFTestExecutor(instance);
            
            // Validate
            console.log('Validating applications...');
            const validation = await appManager.validateBatchDefinition('./apps.json');
            
            if (!validation.isValid) {
                throw new Error('Validation failed');
            }
            
            // Deploy if needed
            if (validation.needsInstallation + validation.needsUpgrade > 0) {
                console.log('Installing applications...');
                await appManager.installBatch('./apps.json');
            }
            
            // Test
            if (env.testSuite) {
                console.log('Running tests...');
                const testResults = await testExecutor.executeTestSuiteAndWait(env.testSuite);
                
                if (testResults.failed_tests > 0) {
                    throw new Error(`${testResults.failed_tests} tests failed`);
                }
            }
            
            console.log(`✅ ${env.name} deployment successful`);
            
        } catch (error) {
            console.error(`❌ ${env.name} deployment failed:`, error.message);
            throw error; // Stop on first failure
        }
    }
    
    console.log('\n✅ All environments deployed successfully!');
}
```

## Error Handling Patterns

### Retry Logic

```typescript
async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 5000
): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) {
                throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
            }
            
            console.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    throw new Error('Retry logic failed unexpectedly');
}

// Usage
const result = await withRetry(() => 
    appRepo.publishToAppRepoAndWait(publishRequest)
);
```

### Timeout Wrapper

```typescript
async function withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    errorMessage: string
): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });
    
    return Promise.race([operation, timeoutPromise]);
}

// Usage
const result = await withTimeout(
    appManager.installBatch('./apps.json'),
    1800000, // 30 minutes
    'Installation timed out after 30 minutes'
);
```

### Comprehensive Error Handler

```typescript
async function safeExecute<T>(
    operation: () => Promise<T>,
    context: string
): Promise<T | null> {
    try {
        return await operation();
    } catch (error) {
        if (error.message.includes('401')) {
            console.error(`${context}: Authentication failed`);
        } else if (error.message.includes('403')) {
            console.error(`${context}: Insufficient permissions`);
        } else if (error.message.includes('404')) {
            console.error(`${context}: Resource not found`);
        } else if (error.message.includes('timeout')) {
            console.error(`${context}: Operation timed out`);
        } else {
            console.error(`${context}: ${error.message}`);
        }
        
        return null;
    }
}
```

## Progress Monitoring

### Detailed Progress Logging

```typescript
async function installWithDetailedProgress(
    appRepo: AppRepoApplication,
    request: AppRepoInstallRequest
) {
    const response = await appRepo.installFromAppRepo(request);
    const progressId = response.links.progress.id;
    const startTime = Date.now();
    
    let progress = await appRepo.getProgress(progressId);
    let lastPercent = 0;
    
    console.log('Installation Progress:');
    console.log('┌─────────────────────────────────────────┐');
    
    while (progress.percent_complete < 100) {
        if (progress.percent_complete !== lastPercent) {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            const bar = '█'.repeat(Math.floor(progress.percent_complete / 5));
            const space = '░'.repeat(20 - bar.length);
            
            console.log(`│ [${bar}${space}] ${progress.percent_complete}% (${elapsed}s) │`);
            lastPercent = progress.percent_complete;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        progress = await appRepo.getProgress(progressId);
    }
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log('└─────────────────────────────────────────┘');
    console.log(`✓ Completed in ${totalTime} seconds`);
}
```

### Progress with ETA

```typescript
async function installWithETA(
    appRepo: AppRepoApplication,
    request: AppRepoInstallRequest
) {
    const response = await appRepo.installFromAppRepo(request);
    const progressId = response.links.progress.id;
    const startTime = Date.now();
    
    let progress = await appRepo.getProgress(progressId);
    
    while (progress.percent_complete < 100) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = progress.percent_complete / elapsed;
        const remaining = (100 - progress.percent_complete) / rate;
        const eta = Math.round(remaining);
        
        console.log(
            `Progress: ${progress.percent_complete}% | ` +
            `Elapsed: ${Math.round(elapsed)}s | ` +
            `ETA: ${eta}s`
        );
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        progress = await appRepo.getProgress(progressId);
    }
}
```

## Best Practices Summary

1. **Always validate before deployment**
2. **Use try-catch for error handling**
3. **Log all operations for audit trails**
4. **Implement retry logic for network operations**
5. **Set appropriate timeouts**
6. **Monitor progress for long operations**
7. **Test deployments in non-production first**
8. **Use version control for batch definitions**
9. **Document your deployment processes**
10. **Fail fast on test failures in CI/CD**

## Related Documentation

- [Getting Started](./GettingStarted.md)
- [Application Manager](./ApplicationManager.md)
- [App Repository](./AppRepoApplication.md)
- [ATF Test Executor](./ATFTestExecutor.md)
- [API Reference](./APIReference.md)


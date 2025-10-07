# API Reference

Complete API reference for `@sonisoft/now-sdk-ext-core`.

## Table of Contents

- [Core Classes](#core-classes)
- [Application Management](#application-management)
- [ATF Testing](#atf-testing)
- [Type Definitions](#type-definitions)
- [Utility Classes](#utility-classes)

## Core Classes

### ServiceNowInstance

Creates a connection to a ServiceNow instance.

```typescript
class ServiceNowInstance {
    constructor(settings: ServiceNowSettingsInstance)
}

interface ServiceNowSettingsInstance {
    alias: string;
    credential: unknown;
}
```

**Usage:**
```typescript
const instance = new ServiceNowInstance({
    alias: 'my-instance',
    credential: await getCredentials('my-instance')
});
```

## Application Management

### ApplicationManager

#### Constructor
```typescript
constructor(instance: ServiceNowInstance)
```

#### Methods

**getApplicationDetails(appID: string): Promise<ApplicationDetailModel>**
- Get detailed information about an application

**validateBatchDefinition(batchDefinitionPath: string): Promise<BatchValidationResult>**
- Validate applications in a batch definition file

**validateBatchInstallation(batchInstall: BatchInstallation): Promise<BatchValidationResult>**
- Validate a BatchInstallation object

**validateApplication(pkg: BatchDefinition): Promise<ApplicationValidationResult>**
- Validate a single application

**checkInstalledApplications(batchDefinitionPath: string): Promise<ApplicationValidationResult[]>**
- Get installed applications from batch

**getApplicationsNeedingAction(batchDefinitionPath: string): Promise<ApplicationValidationResult[]>**
- Get applications needing installation or upgrade

**installBatch(batchDefinitionPath: string): Promise<boolean>**
- Install all applications in batch

### AppRepoApplication

#### Constructor
```typescript
constructor(instance: ServiceNowInstance)
```

#### Methods

**installFromAppRepo(request: AppRepoInstallRequest): Promise<AppRepoInstallResponse>**
- Initiate app installation from repository

**installFromAppRepoAndWait(request: AppRepoInstallRequest, pollIntervalMs?: number, timeoutMs?: number): Promise<AppRepoOperationResult>**
- Install and wait for completion

**publishToAppRepo(request: AppRepoPublishRequest): Promise<AppRepoPublishResponse>**
- Initiate app publish to repository

**publishToAppRepoAndWait(request: AppRepoPublishRequest, pollIntervalMs?: number, timeoutMs?: number): Promise<AppRepoOperationResult>**
- Publish and wait for completion

**getProgress(progressId: string): Promise<ProgressResult>**
- Get operation progress

### BatchDefinition

```typescript
class BatchDefinition {
    constructor(
        id: string,
        load_demo_data: boolean,
        notes: string,
        requested_customization_version: string,
        requested_version: string,
        type: string
    )
    
    toJSON(): object
}
```

### BatchInstallation

```typescript
class BatchInstallation {
    get name(): string
    get packages(): BatchDefinition[]
    set packages(value: BatchDefinition[])
    
    toJSON(): object
}
```

## ATF Testing

### ATFTestExecutor

#### Constructor
```typescript
constructor(instance: ServiceNowInstance)
```

#### Methods

**executeTest(testId: string): Promise<TestResult>**
- Execute a single test

**executeTestSuite(testSuiteSysId: string, options?: Partial<TestSuiteExecutionRequest>): Promise<TestSuiteExecutionResponse>**
- Start test suite execution

**executeTestSuiteByName(testSuiteName: string, options?: Partial<TestSuiteExecutionRequest>): Promise<TestSuiteExecutionResponse>**
- Start test suite by name

**executeTestSuiteAndWait(testSuiteSysId: string, options?: Partial<TestSuiteExecutionRequest>, pollIntervalMs?: number): Promise<TestSuiteExecutionResult>**
- Execute suite and wait for completion

**executeTestSuiteByNameAndWait(testSuiteName: string, options?: Partial<TestSuiteExecutionRequest>, pollIntervalMs?: number): Promise<TestSuiteExecutionResult>**
- Execute suite by name and wait

**getTestSuiteProgress(progressId: string): Promise<TestSuiteExecutionResponse>**
- Get test suite execution progress

**getTestSuiteResults(resultsId: string): Promise<TestSuiteExecutionResult>**
- Get test suite execution results

## Type Definitions

### Application Management Types

```typescript
interface ApplicationValidationResult {
    id: string;
    name?: string;
    requested_version: string;
    installed_version?: string;
    isInstalled: boolean;
    isVersionMatch: boolean;
    isUpdateAvailable: boolean;
    needsAction: boolean;
    validationStatus: 'valid' | 'mismatch' | 'not_installed' | 'update_needed' | 'error';
    error?: string;
    appDetails?: ApplicationDetailModel;
}

interface BatchValidationResult {
    applications: ApplicationValidationResult[];
    totalApplications: number;
    alreadyValid: number;
    needsInstallation: number;
    needsUpgrade: number;
    errors: number;
    isValid: boolean;
}

interface ApplicationDetailModel {
    name: string;
    version: string;
    scope: string;
    isInstalled: boolean;
    isInstalledAndUpdateAvailable: boolean;
    vendor: string;
    // ... many more fields
}
```

### App Repository Types

```typescript
interface AppRepoInstallRequest {
    scope: string;
    sys_id: string;
    version?: string;
    auto_upgrade_base_app?: boolean;
    base_app_version?: string;
}

interface AppRepoPublishRequest {
    scope: string;
    sys_id: string;
    version?: string;
    dev_notes?: string;
}

interface AppRepoInstallResponse {
    links: {
        progress: {
            id: string;
            url: string;
        };
    };
    status: string;
    status_label: string;
    status_message: string;
    status_detail: string;
    error: string;
    percent_complete: number;
}

interface AppRepoOperationResult {
    success: boolean;
    status: string;
    status_label: string;
    status_message: string;
    status_detail: string;
    error: string;
    percent_complete: number;
    links: {
        progress: {
            id: string;
            url: string;
        };
        results?: {
            id: string;
            url: string;
        };
    };
}
```

### ATF Testing Types

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

interface TestSuiteExecutionRequest {
    browser_name?: string;
    browser_version?: string;
    is_performance_run?: boolean;
    os_name?: string;
    os_version?: string;
    run_in_cloud?: boolean;
}

interface TestSuiteExecutionResponse {
    links: {
        progress: {
            id: string;
            url: string;
        };
        results?: {
            id: string;
            url: string;
        };
    };
    status: string;
    status_label: string;
    status_message: string;
    status_detail: string;
    error: string;
    percent_complete: number;
}

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

### Common Types

```typescript
interface ReferenceLink {
    link: string;
    value: string;
}

interface ProgressResult {
    links: {
        progress: {
            id: string;
            url: string;
        };
        results: {
            id: string;
            url: string;
        };
    };
    status: string;
    status_label: string;
    status_message: string;
    status_detail: string;
    error: string;
    percent_complete: number;
}
```

## Utility Classes

### Logger

```typescript
class Logger {
    constructor(name: string)
    
    info(message: string): void
    error(message: string): void
    debug(message: string): void
    warn(message: string): void
}
```

### ProgressWorker

```typescript
class ProgressWorker {
    constructor(instance: ServiceNowInstance)
    
    getProgress(progressId: string): Promise<ProgressResult>
}
```

## HTTP Layer

### ServiceNowRequest

```typescript
class ServiceNowRequest {
    constructor(instance: ServiceNowInstance)
    
    get<T>(request: HTTPRequest): Promise<IHttpResponse<T>>
    post<T>(request: HTTPRequest): Promise<IHttpResponse<T>>
}
```

### HTTPRequest

```typescript
interface HTTPRequest {
    path: string;
    method?: string;
    headers?: Record<string, string> | null;
    query?: Record<string, any> | null;
    body?: any;
    json?: any;
}
```

### IHttpResponse

```typescript
interface IHttpResponse<T> {
    status: number;
    headers: Record<string, string>;
    bodyObject: T;
    body: string;
}
```

## Constants

### Status Codes

```typescript
// Progress status codes
enum ProgressStatus {
    PENDING = "0",
    RUNNING = "1",
    SUCCESSFUL = "2",
    FAILED = "3"
}
```

## Related Documentation

- [Getting Started](./GettingStarted.md)
- [Application Manager](./ApplicationManager.md)
- [App Repository](./AppRepoApplication.md)
- [ATF Test Executor](./ATFTestExecutor.md)
- [Examples](./Examples.md)


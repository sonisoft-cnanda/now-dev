# AppRepoApplication

The `AppRepoApplication` class provides functionality for installing applications from and publishing applications to your company's ServiceNow application repository using the CI/CD API.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
  - [installFromAppRepo](#installfromapprepo)
  - [installFromAppRepoAndWait](#installfromapprepoandwait)
  - [publishToAppRepo](#publishtoapprepo)
  - [publishToAppRepoAndWait](#publishtoapprepoandwait)
  - [getProgress](#getprogress)
- [Interfaces](#interfaces)
- [Examples](#examples)

## Overview

The `AppRepoApplication` class enables you to:

- **Install Applications**: Install applications from your company's app repository to an instance
- **Publish Applications**: Publish applications from an instance to your app repository
- **Monitor Progress**: Track installation and publish operations in real-time
- **Wait for Completion**: Automatically poll and wait for operations to complete
- **Handle Timeouts**: Configure custom timeouts and polling intervals

This is particularly useful for:
- CI/CD pipelines
- Automated deployments
- Version management workflows
- Multi-instance synchronization

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `instance` | `ServiceNowInstance` | Configured ServiceNow instance connection |

### Example

```typescript
import { ServiceNowInstance, AppRepoApplication } from '@sonisoft/now-sdk-ext-core';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth';

const credential = await getCredentials('my-instance');
const instance = new ServiceNowInstance({
    alias: 'my-instance',
    credential: credential
});

const appRepo = new AppRepoApplication(instance);
```

## Methods

### installFromAppRepo

Initiates installation of an application from the app repository. Returns immediately with progress information.

```typescript
async installFromAppRepo(request: AppRepoInstallRequest): Promise<AppRepoInstallResponse>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `request` | `AppRepoInstallRequest` | Installation request parameters |

#### AppRepoInstallRequest

```typescript
interface AppRepoInstallRequest {
    scope: string;                    // Required: Application scope
    sys_id: string;                   // Required: Application sys_id
    version?: string;                 // Optional: Specific version
    auto_upgrade_base_app?: boolean;  // Optional: Auto-upgrade base app
    base_app_version?: string;        // Optional: Base app version
}
```

#### Returns

`Promise<AppRepoInstallResponse>` containing:
- `status`: Status code ("0"=Pending, "1"=Running, "2"=Successful, "3"=Failed)
- `status_label`: Human-readable status
- `links.progress.id`: Progress ID for monitoring
- `percent_complete`: Current completion percentage
- `error`: Error message if any

#### Example

```typescript
const installRequest: AppRepoInstallRequest = {
    scope: 'x_my_custom_app',
    sys_id: 'abc123def456ghi789',
    version: '1.0.0',
    auto_upgrade_base_app: false
};

const response = await appRepo.installFromAppRepo(installRequest);

console.log(`Installation started`);
console.log(`Progress ID: ${response.links.progress.id}`);
console.log(`Status: ${response.status_label}`);
console.log(`Progress: ${response.percent_complete}%`);

// You can now monitor progress separately
```

---

### installFromAppRepoAndWait

Installs an application from the app repository and waits for completion.

```typescript
async installFromAppRepoAndWait(
    request: AppRepoInstallRequest,
    pollIntervalMs?: number,
    timeoutMs?: number
): Promise<AppRepoOperationResult>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `request` | `AppRepoInstallRequest` | - | Installation request parameters |
| `pollIntervalMs` | `number` | `5000` | Polling interval in milliseconds |
| `timeoutMs` | `number` | `1800000` | Timeout in milliseconds (30 min) |

#### Returns

`Promise<AppRepoOperationResult>` containing:
- `success`: Whether operation completed successfully
- `status`: Final status code
- `status_label`: Final status label
- `percent_complete`: Should be 100
- `error`: Error message if failed

#### Example

```typescript
try {
    console.log('Starting installation...');
    
    const result = await appRepo.installFromAppRepoAndWait({
        scope: 'x_my_app',
        sys_id: 'app-sys-id',
        version: '2.0.0'
    }, 5000, 600000); // Poll every 5s, 10 min timeout
    
    if (result.success) {
        console.log('✓ Installation completed successfully!');
        console.log(`Final status: ${result.status_label}`);
    } else {
        console.error('✗ Installation failed:', result.error);
    }
} catch (error) {
    if (error.message.includes('timed out')) {
        console.error('Installation timed out');
    } else {
        console.error('Installation error:', error.message);
    }
}
```

---

### publishToAppRepo

Initiates publishing of an application to the app repository. Returns immediately with progress information.

```typescript
async publishToAppRepo(request: AppRepoPublishRequest): Promise<AppRepoPublishResponse>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `request` | `AppRepoPublishRequest` | Publish request parameters |

#### AppRepoPublishRequest

```typescript
interface AppRepoPublishRequest {
    scope: string;       // Required: Application scope
    sys_id: string;      // Required: Application sys_id
    version?: string;    // Optional: Version number
    dev_notes?: string;  // Optional: Developer notes
}
```

#### Returns

`Promise<AppRepoPublishResponse>` - Same structure as `AppRepoInstallResponse`

#### Example

```typescript
const publishRequest: AppRepoPublishRequest = {
    scope: 'x_my_app',
    sys_id: 'app-sys-id',
    version: '1.2.0',
    dev_notes: 'Added new features:\n- Feature A\n- Feature B\n- Bug fixes'
};

const response = await appRepo.publishToAppRepo(publishRequest);

console.log(`Publish initiated`);
console.log(`Progress ID: ${response.links.progress.id}`);
console.log(`Current status: ${response.status_label}`);
```

---

### publishToAppRepoAndWait

Publishes an application to the app repository and waits for completion.

```typescript
async publishToAppRepoAndWait(
    request: AppRepoPublishRequest,
    pollIntervalMs?: number,
    timeoutMs?: number
): Promise<AppRepoOperationResult>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `request` | `AppRepoPublishRequest` | - | Publish request parameters |
| `pollIntervalMs` | `number` | `5000` | Polling interval in milliseconds |
| `timeoutMs` | `number` | `1800000` | Timeout in milliseconds (30 min) |

#### Returns

`Promise<AppRepoOperationResult>` - Final operation result

#### Example

```typescript
console.log('Publishing application to repository...');

const result = await appRepo.publishToAppRepoAndWait({
    scope: 'x_customer_portal',
    sys_id: 'portal-app-sys-id',
    version: '3.1.0',
    dev_notes: 'Quarterly release - Q1 2024'
});

if (result.success) {
    console.log('✓ Application published successfully!');
    console.log(`Version 3.1.0 is now available in the app repository`);
} else {
    console.error('✗ Publish failed:', result.error);
    throw new Error('Publish operation failed');
}
```

---

### getProgress

Gets the current progress of an app repository operation.

```typescript
async getProgress(progressId: string): Promise<ProgressResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `progressId` | `string` | Progress ID from install/publish response |

#### Returns

`Promise<ProgressResult>` containing:
- `status`: Current status code
- `status_label`: Current status label
- `percent_complete`: Completion percentage (0-100)
- `status_message`: Additional status information
- `error`: Error message if any

#### Example

```typescript
// Start an operation
const response = await appRepo.publishToAppRepo(request);
const progressId = response.links.progress.id;

// Poll for progress
let progress = await appRepo.getProgress(progressId);
let previousPercent = 0;

while (progress.percent_complete < 100) {
    if (progress.percent_complete !== previousPercent) {
        console.log(`Progress: ${progress.percent_complete}% - ${progress.status_label}`);
        previousPercent = progress.percent_complete;
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
    progress = await appRepo.getProgress(progressId);
}

console.log('Operation complete!');
```

## Interfaces

### AppRepoInstallRequest

```typescript
interface AppRepoInstallRequest {
    scope: string;
    sys_id: string;
    version?: string;
    auto_upgrade_base_app?: boolean;
    base_app_version?: string;
}
```

### AppRepoPublishRequest

```typescript
interface AppRepoPublishRequest {
    scope: string;
    sys_id: string;
    version?: string;
    dev_notes?: string;
}
```

### AppRepoInstallResponse / AppRepoPublishResponse

```typescript
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
```

### AppRepoOperationResult

```typescript
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

## Examples

### Example 1: Simple Publish Workflow

```typescript
async function publishApp() {
    const appRepo = new AppRepoApplication(instance);
    
    const result = await appRepo.publishToAppRepoAndWait({
        scope: 'x_myapp',
        sys_id: 'abc123',
        version: '1.0.0',
        dev_notes: 'Initial release'
    });
    
    return result.success;
}
```

### Example 2: Install with Custom Polling

```typescript
async function installWithCustomPolling() {
    const appRepo = new AppRepoApplication(instance);
    
    // Poll every 10 seconds with 1 hour timeout
    const result = await appRepo.installFromAppRepoAndWait(
        {
            scope: 'x_large_app',
            sys_id: 'large-app-id',
            version: '5.0.0'
        },
        10000,  // 10 second intervals
        3600000 // 1 hour timeout
    );
    
    return result;
}
```

### Example 3: Manual Progress Monitoring with Logging

```typescript
async function installWithDetailedLogging() {
    const appRepo = new AppRepoApplication(instance);
    
    // Start installation
    const response = await appRepo.installFromAppRepo({
        scope: 'x_critical_app',
        sys_id: 'critical-app-id'
    });
    
    const progressId = response.links.progress.id;
    const startTime = Date.now();
    
    // Monitor with detailed logging
    let progress = await appRepo.getProgress(progressId);
    
    while (progress.percent_complete < 100) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(
            `[${elapsed}s] ${progress.percent_complete}% - ` +
            `${progress.status_label} - ${progress.status_message || 'In progress'}`
        );
        
        if (progress.error) {
            throw new Error(`Installation error: ${progress.error}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        progress = await appRepo.getProgress(progressId);
    }
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`✓ Installation completed in ${totalTime} seconds`);
}
```

### Example 4: CI/CD Pipeline Integration

```typescript
async function cicdDeploy(environment: string) {
    const appRepo = new AppRepoApplication(instance);
    
    // Configuration per environment
    const apps = {
        dev: { version: '1.0.0-dev' },
        test: { version: '1.0.0-rc1' },
        prod: { version: '1.0.0' }
    };
    
    const appConfig = apps[environment];
    
    try {
        // Step 1: Publish from dev
        if (environment === 'dev') {
            console.log(`Publishing ${appConfig.version} to repository...`);
            await appRepo.publishToAppRepoAndWait({
                scope: 'x_my_app',
                sys_id: 'app-sys-id',
                version: appConfig.version,
                dev_notes: `Automated build for ${environment}`
            });
        }
        
        // Step 2: Install to target environment
        console.log(`Installing ${appConfig.version} to ${environment}...`);
        const result = await appRepo.installFromAppRepoAndWait({
            scope: 'x_my_app',
            sys_id: 'app-sys-id',
            version: appConfig.version
        });
        
        if (!result.success) {
            throw new Error(`Deployment to ${environment} failed`);
        }
        
        console.log(`✓ Successfully deployed to ${environment}`);
        return true;
        
    } catch (error) {
        console.error(`✗ Deployment to ${environment} failed:`, error.message);
        throw error;
    }
}
```

### Example 5: Batch Publish Multiple Apps

```typescript
async function publishMultipleApps(apps: AppRepoPublishRequest[]) {
    const appRepo = new AppRepoApplication(instance);
    const results = [];
    
    for (const app of apps) {
        console.log(`\nPublishing ${app.scope}...`);
        
        try {
            const result = await appRepo.publishToAppRepoAndWait(app, 5000, 600000);
            
            results.push({
                scope: app.scope,
                success: result.success,
                error: result.error
            });
            
            if (result.success) {
                console.log(`  ✓ ${app.scope} published successfully`);
            } else {
                console.error(`  ✗ ${app.scope} failed: ${result.error}`);
            }
        } catch (error) {
            console.error(`  ✗ ${app.scope} error: ${error.message}`);
            results.push({
                scope: app.scope,
                success: false,
                error: error.message
            });
        }
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n=== Summary ===`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    
    return results;
}
```

## Best Practices

1. **Use AndWait Methods for Synchronous Workflows**: For CI/CD pipelines and automated deployments
2. **Set Appropriate Timeouts**: Large applications may need longer timeouts
3. **Handle Errors Gracefully**: Always wrap in try-catch and check `result.success`
4. **Log Progress**: Especially for long-running operations
5. **Version Management**: Always specify explicit versions in production
6. **Dev Notes**: Include meaningful notes for traceability
7. **Monitor Progress**: For large applications, implement detailed progress logging

## Troubleshooting

### Issue: "No progress ID returned"

**Cause**: API returned without progress information  
**Solution**: Check that the CI/CD API is enabled and user has proper roles

### Issue: Operation times out

**Cause**: Operation takes longer than timeout setting  
**Solution**: Increase timeout or check instance/network performance

### Issue: "401 Unauthorized"

**Cause**: Insufficient permissions  
**Solution**: Ensure user has `sn_cicd.sys_ci_automation` role

## Related

- [Getting Started Guide](./GettingStarted.md)
- [Application Manager Documentation](./ApplicationManager.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)


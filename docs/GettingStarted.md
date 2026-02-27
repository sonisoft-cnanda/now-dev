# Getting Started

This guide will help you get up and running with the ServiceNow SDK Extension Core.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Authentication Setup](#authentication-setup)
- [Basic Configuration](#basic-configuration)
- [Your First Script](#your-first-script)
- [Common Patterns](#common-patterns)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+ or 20+** installed
2. **TypeScript 5.0+** installed
3. **A ServiceNow instance** with:
   - CI/CD API enabled
   - Appropriate user roles (admin or `sn_cicd.sys_ci_automation`)
4. **ServiceNow CLI** installed (`@servicenow/sdk`)

## Installation

### 1. Install the Package

```bash
npm install @sonisoft/now-sdk-ext-core
```

### 2. Install ServiceNow CLI (if not already installed)

```bash
npm install -g @servicenow/sdk
```

### 3. Install Type Definitions (for TypeScript)

The package includes TypeScript definitions, but you may want to install Node types:

```bash
npm install --save-dev @types/node
```

## Authentication Setup

### Configure ServiceNow Instance Credentials

The SDK uses the ServiceNow CLI authentication system.

#### Step 1: Add Your Instance

```bash
# Interactive mode
npx @servicenow/sdk auth --add my-dev-instance

# You'll be prompted for:
# - Instance URL (e.g., https://dev12345.service-now.com)
# - Username
# - Password
```

#### Step 2: Verify Authentication

```bash
npx @servicenow/sdk auth --list
```

You should see your instance alias listed.

### Multiple Instances

You can configure multiple instances with different aliases:

```bash
npx @servicenow/sdk auth --add dev-instance
npx @servicenow/sdk auth --add test-instance
npx @servicenow/sdk auth --add prod-instance
```

## Basic Configuration

### Create a TypeScript Configuration

If you don't have one, create a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Project Structure

Recommended project structure:

```
my-servicenow-project/
├── src/
│   ├── index.ts           # Main entry point
│   ├── config/
│   │   └── instances.ts   # Instance configurations
│   └── scripts/
│       ├── deploy.ts      # Deployment scripts
│       └── test.ts        # Test execution scripts
├── data/
│   └── batch-apps.json    # Batch installation definitions
├── package.json
└── tsconfig.json
```

## Your First Script

### Example 1: Get Application Details

Create `src/get-app-info.ts`:

```typescript
import { ServiceNowInstance, ApplicationManager } from '@sonisoft/now-sdk-ext-core';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth';

async function getAppInfo() {
    try {
        // 1. Get credentials
        const credential = await getCredentials('my-dev-instance');
        
        // 2. Create instance connection
        const instance = new ServiceNowInstance({
            alias: 'my-dev-instance',
            credential: credential
        });
        
        // 3. Create application manager
        const appManager = new ApplicationManager(instance);
        
        // 4. Get application details
        const appDetails = await appManager.getApplicationDetails('your-app-sys-id');
        
        // 5. Display results
        console.log('Application Details:');
        console.log(`  Name: ${appDetails.name}`);
        console.log(`  Version: ${appDetails.version}`);
        console.log(`  Installed: ${appDetails.isInstalled}`);
        console.log(`  Scope: ${appDetails.scope}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

getAppInfo();
```

### Example 2: Run an ATF Test

Create `src/run-test.ts`:

```typescript
import { ServiceNowInstance, ATFTestExecutor } from '@sonisoft/now-sdk-ext-core';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth';

async function runTest() {
    const credential = await getCredentials('my-dev-instance');
    const instance = new ServiceNowInstance({
        alias: 'my-dev-instance',
        credential: credential
    });
    
    const testExecutor = new ATFTestExecutor(instance);
    
    console.log('Running ATF test...');
    const result = await testExecutor.executeTest('test-sys-id');
    
    console.log(`Test: ${result.test_name}`);
    console.log(`Status: ${result.status}`);
    console.log(`Run Time: ${result.run_time}`);
    
    if (result.status !== 'success') {
        console.error('Test failed!');
        process.exit(1);
    }
}

runTest();
```

### Example 3: Publish to App Repository

Create `src/publish-app.ts`:

```typescript
import { ServiceNowInstance, AppRepoApplication } from '@sonisoft/now-sdk-ext-core';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth';

async function publishApp() {
    const credential = await getCredentials('my-dev-instance');
    const instance = new ServiceNowInstance({
        alias: 'my-dev-instance',
        credential: credential
    });
    
    const appRepo = new AppRepoApplication(instance);
    
    console.log('Publishing application to repository...');
    
    const result = await appRepo.publishToAppRepoAndWait({
        scope: 'x_my_app',
        sys_id: 'app-sys-id',
        version: '1.0.0',
        dev_notes: 'Initial release with core features'
    });
    
    if (result.success) {
        console.log('✓ Application published successfully!');
    } else {
        console.error('✗ Publish failed:', result.error);
        process.exit(1);
    }
}

publishApp();
```

### Running Your Scripts

```bash
# Compile TypeScript
npx tsc

# Run the compiled script
node dist/get-app-info.js

# Or use ts-node for development
npx ts-node src/get-app-info.ts
```

## Common Patterns

### Pattern 1: Environment-Based Configuration

```typescript
// src/config/instances.ts
export const instances = {
    dev: 'dev-instance-alias',
    test: 'test-instance-alias',
    prod: 'prod-instance-alias'
};

// Usage
const env = process.env.ENV || 'dev';
const credential = await getCredentials(instances[env]);
```

### Pattern 2: Reusable Instance Factory

```typescript
// src/utils/instance-factory.ts
import { ServiceNowInstance } from '@sonisoft/now-sdk-ext-core';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth';

export async function createInstance(alias: string): Promise<ServiceNowInstance> {
    const credential = await getCredentials(alias);
    return new ServiceNowInstance({ alias, credential });
}

// Usage
const instance = await createInstance('my-dev-instance');
```

### Pattern 3: Error Handling Wrapper

```typescript
async function safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        console.error(`${errorMessage}:`, error.message);
        throw error;
    }
}

// Usage
const result = await safeExecute(
    () => appManager.validateBatchDefinition('./apps.json'),
    'Failed to validate applications'
);
```

### Pattern 4: Progress Logging

```typescript
async function installWithProgress(appRepo: AppRepoApplication, request: AppRepoInstallRequest) {
    const response = await appRepo.installFromAppRepo(request);
    const progressId = response.links.progress.id;
    
    let progress = await appRepo.getProgress(progressId);
    
    while (progress.percent_complete < 100) {
        console.log(`[${new Date().toISOString()}] Progress: ${progress.percent_complete}% - ${progress.status_label}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        progress = await appRepo.getProgress(progressId);
    }
    
    console.log('✓ Installation complete!');
}
```

## Common Issues and Solutions

### Issue 1: "Could not find stored credentials"

**Solution:** Ensure you've added your instance credentials:
```bash
npx @servicenow/sdk auth --add my-instance
```

### Issue 2: "401 Unauthorized"

**Solution:** Check that your user has the required roles:
- Admin role, OR
- `sn_cicd.sys_ci_automation` role

### Issue 3: "Module not found"

**Solution:** Ensure all dependencies are installed:
```bash
npm install
```

### Issue 4: TypeScript Compilation Errors

**Solution:** Check your `tsconfig.json` has proper settings (see Basic Configuration above).

## Next Steps

Now that you have the basics, explore more advanced features:

**Application & Scope Management:**
1. [Application Manager](./ApplicationManager.md) - Batch validation and installation
2. [Store Applications](./CompanyApplications.md) - Store app search, install, and update
3. [Scope Manager](./ScopeManager.md) - Application scope management
4. [Update Set Manager](./UpdateSetManager.md) - Update set lifecycle management

**Code, Schema & Data:**
5. [Code Search](./CodeSearch.md) - Platform code search
6. [Schema Discovery](./SchemaDiscovery.md) - Table schema and field discovery
7. [Attachment Manager](./AttachmentManager.md) - File attachment operations
8. [Batch Operations](./BatchOperations.md) - Bulk create/update with variable substitution
9. [Query Batch Operations](./QueryBatchOperations.md) - Query-based bulk update/delete

**Workflow, Task & Scripting:**
10. [Workflow Manager](./WorkflowManager.md) - Programmatic workflow creation
11. [Task Operations](./TaskOperations.md) - ITSM task management
12. [Script Sync](./ScriptSync.md) - Bidirectional script synchronization

**Monitoring & Discovery:**
13. [Aggregate Query](./AggregateQuery.md) - Stats API aggregations
14. [Instance Health](./InstanceHealth.md) - Health monitoring
15. [CMDB Relationships](./CMDBRelationships.md) - CI relationship graph traversal
16. [Instance Discovery](./InstanceDiscovery.md) - Table, app, and plugin discovery

**Testing & Logging:**
17. [ATF Test Executor](./ATFTestExecutor.md) - Automate your testing workflow
18. [Syslog Reader](./SyslogReader.md) - Log monitoring and tailing

**Reference:**
19. [API Reference](./APIReference.md) - Complete API documentation
20. [Examples & Recipes](./Examples.md) - Real-world use cases

## Additional Resources

- [ServiceNow CI/CD API Documentation](https://docs.servicenow.com/bundle/latest/page/integrate/inbound-rest/concept/cicd-api.html)
- [ServiceNow CLI Documentation](https://docs.servicenow.com/bundle/latest/page/build/servicenow-cli/concept/servicenow-cli.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

Need help? Check out the [API Reference](./APIReference.md) or [Examples](./Examples.md) for more detailed information.


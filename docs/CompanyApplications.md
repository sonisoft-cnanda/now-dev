# CompanyApplications Class

The `CompanyApplications` class provides functionality to retrieve and manage company applications that are shared internally within a ServiceNow instance.

## Overview

This class allows you to:
- Get a list of all company applications
- Find applications by scope or sys_id
- Filter for installed applications
- Access detailed version information for each application

## Usage

### Creating an Instance

```typescript
import { CompanyApplications, ServiceNowInstance } from '@sonisoft/now-sdk-ext-core';

// Create a ServiceNow instance
const instance = new ServiceNowInstance({
    instanceURL: 'https://your-instance.service-now.com',
    username: 'your-username',
    password: 'your-password'
});

// Create a CompanyApplications instance
const companyApps = new CompanyApplications(instance);
```

### Getting All Company Applications

```typescript
// Get all internally shared applications
const response = await companyApps.getCompanyApplications();

console.log(`Found ${response.data.length} applications`);
console.log(`Processing time: ${response.dataProcessingTime}ms`);

// Iterate through applications
response.data.forEach(app => {
    console.log(`${app.name} (${app.scope}) - Version: ${app.latest_version}`);
    console.log(`  Installed: ${app.isInstalled}`);
    console.log(`  Vendor: ${app.vendor}`);
});
```

### Finding an Application by Scope

```typescript
// Find a specific application by scope
const app = await companyApps.getCompanyApplicationByScope('x_taniu_ai_itsm');

if (app) {
    console.log(`Application: ${app.name}`);
    console.log(`Latest Version: ${app.latest_version}`);
    console.log(`Is Installed: ${app.isInstalled}`);
    console.log(`Available Versions: ${app.versions.length}`);
    
    // List all available versions
    app.versions.forEach(version => {
        console.log(`  - Version ${version.version} (${version.publish_date_display})`);
    });
}
```

### Finding an Application by Sys ID

```typescript
// Find a specific application by sys_id
const app = await companyApps.getCompanyApplicationBySysId('6a2b97eb2b771210ad9df7ddfe91bf17');

if (app) {
    console.log(`Found: ${app.name}`);
}
```

### Getting Only Installed Applications

```typescript
// Get only installed company applications
const installedApps = await companyApps.getInstalledCompanyApplications();

console.log(`Installed Applications (${installedApps.length}):`);
installedApps.forEach(app => {
    console.log(`  - ${app.name} v${app.version}`);
});
```

### Filtering and Working with Results

```typescript
// Get all applications and filter by vendor
const response = await companyApps.getCompanyApplications();

const taniumApps = response.data.filter(app => app.vendor === 'Tanium Inc');
console.log(`Found ${taniumApps.length} Tanium applications`);

// Find applications that can be installed or upgraded
const upgradableApps = response.data.filter(app => 
    app.can_install_or_upgrade && !app.isInstalled
);
console.log(`${upgradableApps.length} applications can be installed`);

// Get applications with specific dependencies
const appsWithDeps = response.data.filter(app => 
    app.dependencies && app.dependencies.includes('sn_itsm_gen_ai')
);
console.log(`${appsWithDeps.length} applications depend on sn_itsm_gen_ai`);
```

### Accessing Version Details

```typescript
const app = await companyApps.getCompanyApplicationByScope('x_taniu_ai_itsm');

if (app && app.versions.length > 0) {
    // Get the latest version
    const latestVersion = app.versions[app.versions.length - 1];
    
    console.log('Latest Version Details:');
    console.log(`  Version: ${latestVersion.version}`);
    console.log(`  Published: ${latestVersion.publish_date_display}`);
    console.log(`  Upload Info: ${latestVersion.upload_info}`);
    console.log(`  Dependencies: ${latestVersion.dependencies || 'None'}`);
    console.log(`  Store Link: ${latestVersion.store_link}`);
}
```

## API Reference

### Methods

#### `getCompanyApplications(sharedInternally?: boolean, isFirstLoad?: boolean): Promise<CompanyApplicationsResponse>`

Gets the list of company applications shared internally.

**Parameters:**
- `sharedInternally` (optional): Filter for internally shared applications (default: `true`)
- `isFirstLoad` (optional): Indicates if this is the first load (default: `true`)

**Returns:** Promise resolving to `CompanyApplicationsResponse`

#### `getCompanyApplicationByScope(scope: string, sharedInternally?: boolean): Promise<CompanyApplication | null>`

Gets a specific company application by scope.

**Parameters:**
- `scope`: The application scope to search for
- `sharedInternally` (optional): Filter for internally shared applications (default: `true`)

**Returns:** Promise resolving to the application if found, `null` otherwise

#### `getCompanyApplicationBySysId(sysId: string, sharedInternally?: boolean): Promise<CompanyApplication | null>`

Gets a specific company application by sys_id.

**Parameters:**
- `sysId`: The application sys_id to search for
- `sharedInternally` (optional): Filter for internally shared applications (default: `true`)

**Returns:** Promise resolving to the application if found, `null` otherwise

#### `getInstalledCompanyApplications(sharedInternally?: boolean): Promise<CompanyApplication[]>`

Gets only installed company applications.

**Parameters:**
- `sharedInternally` (optional): Filter for internally shared applications (default: `true`)

**Returns:** Promise resolving to an array of installed applications

## Response Types

### `CompanyApplicationsResponse`

```typescript
interface CompanyApplicationsResponse {
    appServer: string;              // Application server URL
    data: CompanyApplication[];     // Array of company applications
    dataProcessingTime: number;     // Processing time in milliseconds
    reporesponsetime: number;       // Repository response time in milliseconds
    storeURL: string;               // Store URL
    storetrackerId: string;         // Store tracker ID
}
```

### `CompanyApplication`

```typescript
interface CompanyApplication {
    name: string;                   // Application name
    scope: string;                  // Application scope
    sys_id: string;                 // System ID
    vendor: string;                 // Vendor name
    isInstalled: boolean;           // Installation status
    latest_version: string;         // Latest available version
    version: string;                // Current version (if installed)
    dependencies: string | null;    // Application dependencies
    short_description: string;      // Short description
    versions: CompanyApplicationVersion[];  // Available versions
    // ... and many more properties
}
```

### `CompanyApplicationVersion`

```typescript
interface CompanyApplicationVersion {
    version: string;                // Version number
    version_display: string;        // Version display name
    sys_id: string;                 // Version sys_id
    publish_date: string;           // Publish date timestamp
    publish_date_display: string;   // Publish date display
    dependencies: string | null;    // Version dependencies
    upload_info: string;            // Upload information
    store_link: string;             // Store link URL
    // ... and many more properties
}
```

## Complete Example

```typescript
import { 
    CompanyApplications, 
    ServiceNowInstance 
} from '@sonisoft/now-sdk-ext-core';

async function main() {
    // Create instance
    const instance = new ServiceNowInstance({
        instanceURL: 'https://your-instance.service-now.com',
        username: 'your-username',
        password: 'your-password'
    });

    const companyApps = new CompanyApplications(instance);

    try {
        // Get all company applications
        console.log('Fetching company applications...');
        const response = await companyApps.getCompanyApplications();
        
        console.log(`\nTotal Applications: ${response.data.length}`);
        console.log(`Processing Time: ${response.dataProcessingTime}ms\n`);

        // Find installed applications
        const installedApps = await companyApps.getInstalledCompanyApplications();
        console.log(`Installed Applications: ${installedApps.length}\n`);

        // Search for a specific application
        const specificApp = await companyApps.getCompanyApplicationByScope('x_taniu_ai_itsm');
        
        if (specificApp) {
            console.log(`Found Application: ${specificApp.name}`);
            console.log(`Scope: ${specificApp.scope}`);
            console.log(`Latest Version: ${specificApp.latest_version}`);
            console.log(`Installed: ${specificApp.isInstalled}`);
            console.log(`Available Versions: ${specificApp.versions.length}`);
            
            console.log('\nVersion History:');
            specificApp.versions.forEach((v, i) => {
                console.log(`  ${i + 1}. v${v.version} - ${v.publish_date_display}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
```

## Error Handling

```typescript
try {
    const response = await companyApps.getCompanyApplications();
    // Process response
} catch (error) {
    if (error instanceof Error) {
        console.error(`Failed to get company applications: ${error.message}`);
    }
}
```

## Notes

- The API endpoint used is `/sn_appclient_api_v1.do` with query parameters
- By default, only internally shared applications are returned
- Each application includes detailed version information
- The response includes performance metrics (processing time, response time)
- Applications can be filtered by various properties after retrieval

## See Also

- [ApplicationManager](./ApplicationManager.md) - For batch application installation
- [AppRepoApplication](./AppRepoApplication.md) - For app repository operations
- [Getting Started](./GettingStarted.md) - General setup and configuration


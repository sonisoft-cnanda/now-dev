# AttachmentManager

The `AttachmentManager` class provides methods for uploading, listing, and retrieving attachments on ServiceNow records via the Attachment API.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Related](#related)

## Overview

The `AttachmentManager` enables you to:

- Upload file attachments to any ServiceNow record
- List all attachments associated with a specific record
- Retrieve attachment metadata by sys_id
- Work with any content type (text, images, PDFs, binaries)
- Integrate file management into automation workflows

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, AttachmentManager } from '@sonisoft/now-sdk-ext-core';

const attachmentManager = new AttachmentManager(instance);
```

## Methods

### uploadAttachment

Upload an attachment to a ServiceNow record. Sends a POST request to `/api/now/attachment/file` with the file content and metadata as query parameters.

```typescript
async uploadAttachment(options: UploadAttachmentOptions): Promise<AttachmentRecord>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `UploadAttachmentOptions` | Upload configuration including target record, file name, content type, and data |

#### UploadAttachmentOptions

| Field | Type | Description |
|-------|------|-------------|
| `tableName` | `string` | Target table name (e.g., `"incident"`, `"sys_user"`) |
| `recordSysId` | `string` | Sys ID of the record to attach the file to |
| `fileName` | `string` | Name of the file being uploaded |
| `contentType` | `string` | MIME type of the file (e.g., `"text/plain"`, `"image/png"`) |
| `data` | `Buffer \| string` | File content as a Buffer or string |

#### Returns

`Promise<AttachmentRecord>` containing the created attachment metadata:
- `sys_id`: Unique identifier of the attachment
- `file_name`: Name of the uploaded file
- `table_name`: Table the attachment belongs to
- `table_sys_id`: Sys ID of the parent record
- `content_type`: MIME type of the file
- `size_bytes`: File size in bytes

#### Example

```typescript
const attachment = await attachmentManager.uploadAttachment({
    tableName: 'incident',
    recordSysId: 'abc123def456',
    fileName: 'error_log.txt',
    contentType: 'text/plain',
    data: 'Error occurred at line 42...'
});

console.log(`Uploaded: ${attachment.file_name} (${attachment.sys_id})`);
```

---

### listAttachments

List all attachments for a specific record. Queries the `sys_attachment` table filtered by table name and record sys_id.

```typescript
async listAttachments(options: ListAttachmentsOptions): Promise<AttachmentRecord[]>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `ListAttachmentsOptions` | Filter options for listing attachments |

#### ListAttachmentsOptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tableName` | `string` | - | Table name to filter by |
| `recordSysId` | `string` | - | Sys ID of the record to list attachments for |
| `limit` | `number` | `100` | Maximum number of attachments to return |

#### Returns

`Promise<AttachmentRecord[]>` - Array of attachment metadata records.

#### Example

```typescript
const attachments = await attachmentManager.listAttachments({
    tableName: 'incident',
    recordSysId: 'abc123def456'
});

console.log(`Found ${attachments.length} attachments`);
attachments.forEach(a => {
    console.log(`  - ${a.file_name} (${a.content_type}, ${a.size_bytes} bytes)`);
});
```

---

### getAttachment

Get a single attachment record by its sys_id.

```typescript
async getAttachment(sysId: string): Promise<AttachmentRecord>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sysId` | `string` | Sys ID of the attachment to retrieve |

#### Returns

`Promise<AttachmentRecord>` - The attachment metadata record.

#### Example

```typescript
const attachment = await attachmentManager.getAttachment('attachment-sys-id');

console.log(`File: ${attachment.file_name}`);
console.log(`Type: ${attachment.content_type}`);
console.log(`Size: ${attachment.size_bytes} bytes`);
console.log(`Created: ${attachment.sys_created_on}`);
```

## Interfaces

### AttachmentRecord

```typescript
interface AttachmentRecord {
    sys_id: string;
    file_name: string;
    table_name: string;
    table_sys_id: string;
    content_type: string;
    size_bytes?: string;
    sys_created_on?: string;
    [key: string]: unknown;
}
```

### UploadAttachmentOptions

```typescript
interface UploadAttachmentOptions {
    tableName: string;
    recordSysId: string;
    fileName: string;
    contentType: string;
    data: Buffer | string;
}
```

### ListAttachmentsOptions

```typescript
interface ListAttachmentsOptions {
    tableName: string;
    recordSysId: string;
    limit?: number;
}
```

### AttachmentResponse

```typescript
interface AttachmentResponse {
    result: AttachmentRecord[];
}
```

### AttachmentSingleResponse

```typescript
interface AttachmentSingleResponse {
    result: AttachmentRecord;
}
```

## Examples

### Example 1: Upload a Text File to an Incident

```typescript
import { ServiceNowInstance, AttachmentManager } from '@sonisoft/now-sdk-ext-core';

async function uploadLogFile(instance: ServiceNowInstance, incidentSysId: string) {
    const attachmentManager = new AttachmentManager(instance);

    const logContent = 'Application error at 2024-01-15T10:30:00Z\nStack trace...';

    const attachment = await attachmentManager.uploadAttachment({
        tableName: 'incident',
        recordSysId: incidentSysId,
        fileName: 'application_error.log',
        contentType: 'text/plain',
        data: logContent
    });

    console.log(`Log file uploaded: ${attachment.sys_id}`);
}
```

### Example 2: Upload a Binary File from Disk

```typescript
import * as fs from 'fs';

async function uploadScreenshot(instance: ServiceNowInstance, incidentSysId: string, filePath: string) {
    const attachmentManager = new AttachmentManager(instance);
    const fileBuffer = fs.readFileSync(filePath);

    const attachment = await attachmentManager.uploadAttachment({
        tableName: 'incident',
        recordSysId: incidentSysId,
        fileName: 'screenshot.png',
        contentType: 'image/png',
        data: fileBuffer
    });

    console.log(`Screenshot uploaded: ${attachment.file_name} (${attachment.size_bytes} bytes)`);
}
```

### Example 3: List and Verify Attachments

```typescript
async function verifyAttachments(instance: ServiceNowInstance, tableName: string, recordSysId: string) {
    const attachmentManager = new AttachmentManager(instance);

    const attachments = await attachmentManager.listAttachments({
        tableName,
        recordSysId,
        limit: 50
    });

    if (attachments.length === 0) {
        console.log('No attachments found on this record.');
        return;
    }

    console.log(`Found ${attachments.length} attachments:`);
    for (const att of attachments) {
        console.log(`  ${att.file_name} | ${att.content_type} | ${att.size_bytes ?? 'unknown'} bytes`);
    }
}
```

### Example 4: Retrieve a Specific Attachment

```typescript
async function getAttachmentDetails(instance: ServiceNowInstance, attachmentSysId: string) {
    const attachmentManager = new AttachmentManager(instance);

    try {
        const attachment = await attachmentManager.getAttachment(attachmentSysId);
        console.log(`File: ${attachment.file_name}`);
        console.log(`Table: ${attachment.table_name}`);
        console.log(`Record: ${attachment.table_sys_id}`);
        console.log(`Type: ${attachment.content_type}`);
    } catch (error) {
        console.error(`Attachment not found: ${attachmentSysId}`);
    }
}
```

## Best Practices

1. **Specify Accurate Content Types**: Always set the correct MIME type in `contentType` to ensure proper rendering and download behavior in ServiceNow.
2. **Use Buffer for Binary Files**: When uploading non-text files (images, PDFs), read them into a `Buffer` rather than passing a string.
3. **Set Reasonable Limits**: When listing attachments, use the `limit` parameter to avoid retrieving unnecessarily large result sets.
4. **Handle Errors Gracefully**: Both `uploadAttachment` and `getAttachment` throw errors on failure; wrap calls in try/catch blocks.
5. **Validate Before Upload**: Check file size and type before uploading to avoid unnecessary API calls.
6. **Use Descriptive File Names**: Include timestamps or identifiers in file names to make attachments easy to locate later.

## Related

- [Getting Started Guide](./GettingStarted.md)
- [Application Manager](./ApplicationManager.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)

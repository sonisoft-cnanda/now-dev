# TaskOperations

The `TaskOperations` class provides convenience operations for common task-related actions in ServiceNow, such as adding comments, assigning tasks, resolving/closing incidents, and approving change requests.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Related](#related)

## Overview

The `TaskOperations` class enables you to:

- Add comments or work notes to any task-based record
- Assign tasks to users and assignment groups
- Resolve incidents with resolution notes and close codes
- Close incidents with close notes
- Approve change requests
- Look up task records by their number field

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, TaskOperations } from '@sonisoft/now-sdk-ext-core';

const taskOps = new TaskOperations(instance);
```

## Methods

### addComment

Add a comment or work note to a task record.

```typescript
async addComment(options: AddCommentOptions): Promise<TaskRecord>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `AddCommentOptions` | The comment options |

#### AddCommentOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `table` | `string` | Yes | The table name (e.g., `"incident"`, `"change_request"`) |
| `recordSysId` | `string` | Yes | The sys_id of the record to add the comment to |
| `comment` | `string` | Yes | The comment text |
| `isWorkNote` | `boolean` | No | When `true`, adds a work note instead of a customer-visible comment. Defaults to `false`. |

#### Returns

`Promise<TaskRecord>` - The updated task record.

#### Example

```typescript
// Add a customer-visible comment
const record = await taskOps.addComment({
    table: 'incident',
    recordSysId: 'abc123',
    comment: 'We are investigating your issue and will update you shortly.'
});

// Add a work note (internal only)
await taskOps.addComment({
    table: 'incident',
    recordSysId: 'abc123',
    comment: 'Escalating to network team for further analysis.',
    isWorkNote: true
});
```

---

### assignTask

Assign a task record to a user and optionally to an assignment group.

```typescript
async assignTask(options: AssignTaskOptions): Promise<TaskRecord>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `AssignTaskOptions` | The assignment options |

#### AssignTaskOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `table` | `string` | Yes | The table name (e.g., `"incident"`, `"sc_task"`) |
| `recordSysId` | `string` | Yes | The sys_id of the record to assign |
| `assignedTo` | `string` | Yes | The sys_id or user_name of the user to assign to |
| `assignmentGroup` | `string` | No | Optional sys_id of the assignment group |

#### Returns

`Promise<TaskRecord>` - The updated task record.

#### Example

```typescript
const record = await taskOps.assignTask({
    table: 'incident',
    recordSysId: 'abc123',
    assignedTo: 'admin',
    assignmentGroup: 'group-sys-id'
});

console.log(`Assigned to: ${record.sys_id}`);
```

---

### resolveIncident

Resolve an incident by setting its state to 6 (Resolved).

```typescript
async resolveIncident(options: ResolveIncidentOptions): Promise<TaskRecord>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `ResolveIncidentOptions` | The resolve options |

#### ResolveIncidentOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `sysId` | `string` | Yes | The sys_id of the incident to resolve |
| `resolutionNotes` | `string` | Yes | Resolution notes describing how the incident was resolved |
| `closeCode` | `string` | No | The close code (e.g., `"Solved (Work Around)"`, `"Solved (Permanently)"`) |

#### Returns

`Promise<TaskRecord>` - The updated incident record.

#### Example

```typescript
const resolved = await taskOps.resolveIncident({
    sysId: 'incident-sys-id',
    resolutionNotes: 'Restarted the application server, service restored.',
    closeCode: 'Solved (Permanently)'
});

console.log(`Incident state: ${resolved.state}`);
```

---

### closeIncident

Close an incident by setting its state to 7 (Closed).

```typescript
async closeIncident(options: CloseIncidentOptions): Promise<TaskRecord>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `CloseIncidentOptions` | The close options |

#### CloseIncidentOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `sysId` | `string` | Yes | The sys_id of the incident to close |
| `closeNotes` | `string` | Yes | Close notes describing why the incident is being closed |
| `closeCode` | `string` | No | The close code (e.g., `"Solved (Work Around)"`, `"Solved (Permanently)"`) |

#### Returns

`Promise<TaskRecord>` - The updated incident record.

#### Example

```typescript
const closed = await taskOps.closeIncident({
    sysId: 'incident-sys-id',
    closeNotes: 'Confirmed resolution with the end user. Closing.',
    closeCode: 'Solved (Permanently)'
});

console.log(`Incident state: ${closed.state}`);
```

---

### approveChange

Approve a change request by setting its approval field to `'approved'`.

```typescript
async approveChange(options: ApproveChangeOptions): Promise<TaskRecord>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `ApproveChangeOptions` | The approval options |

#### ApproveChangeOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `sysId` | `string` | Yes | The sys_id of the change request to approve |
| `comments` | `string` | No | Optional comments to include with the approval |

#### Returns

`Promise<TaskRecord>` - The updated change request record.

#### Example

```typescript
const approved = await taskOps.approveChange({
    sysId: 'change-sys-id',
    comments: 'Reviewed and approved. Deployment window looks good.'
});

console.log(`Change approved: ${approved.sys_id}`);
```

---

### findByNumber

Find a task record by its number field (e.g., `"INC0010001"`).

```typescript
async findByNumber(table: string, number: string): Promise<TaskRecord | null>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `table` | `string` | The table to search in |
| `number` | `string` | The task number to find |

#### Returns

`Promise<TaskRecord | null>` - The matching task record, or `null` if not found.

#### Example

```typescript
const incident = await taskOps.findByNumber('incident', 'INC0010001');

if (incident) {
    console.log(`Found: ${incident.sys_id}`);
} else {
    console.log('Incident not found');
}
```

## Interfaces

### AddCommentOptions

```typescript
interface AddCommentOptions {
    table: string;
    recordSysId: string;
    comment: string;
    isWorkNote?: boolean;
}
```

### AssignTaskOptions

```typescript
interface AssignTaskOptions {
    table: string;
    recordSysId: string;
    assignedTo: string;
    assignmentGroup?: string;
}
```

### ResolveIncidentOptions

```typescript
interface ResolveIncidentOptions {
    sysId: string;
    resolutionNotes: string;
    closeCode?: string;
}
```

### CloseIncidentOptions

```typescript
interface CloseIncidentOptions {
    sysId: string;
    closeNotes: string;
    closeCode?: string;
}
```

### ApproveChangeOptions

```typescript
interface ApproveChangeOptions {
    sysId: string;
    comments?: string;
}
```

### TaskRecord

```typescript
interface TaskRecord {
    sys_id: string;
    number?: string;
    state?: string;
    [key: string]: unknown;
}
```

### TaskRecordResponse

```typescript
interface TaskRecordResponse {
    result: TaskRecord;
}
```

### TaskRecordListResponse

```typescript
interface TaskRecordListResponse {
    result: TaskRecord[];
}
```

## Examples

### Example 1: Incident Lifecycle Management

```typescript
async function manageIncidentLifecycle() {
    const taskOps = new TaskOperations(instance);

    // Find the incident by number
    const incident = await taskOps.findByNumber('incident', 'INC0010042');
    if (!incident) {
        console.error('Incident not found');
        return;
    }

    // Assign to a technician
    await taskOps.assignTask({
        table: 'incident',
        recordSysId: incident.sys_id,
        assignedTo: 'john.smith',
        assignmentGroup: 'network-team-sys-id'
    });

    // Add a work note
    await taskOps.addComment({
        table: 'incident',
        recordSysId: incident.sys_id,
        comment: 'Assigned to network team for investigation.',
        isWorkNote: true
    });

    // Resolve the incident
    await taskOps.resolveIncident({
        sysId: incident.sys_id,
        resolutionNotes: 'Network switch rebooted. Connectivity restored.',
        closeCode: 'Solved (Permanently)'
    });

    // Close the incident after confirmation
    await taskOps.closeIncident({
        sysId: incident.sys_id,
        closeNotes: 'User confirmed resolution. Closing ticket.',
        closeCode: 'Solved (Permanently)'
    });

    console.log('Incident lifecycle complete');
}
```

### Example 2: Bulk Change Approval

```typescript
async function bulkApproveChanges(changeNumbers: string[]) {
    const taskOps = new TaskOperations(instance);
    const results: { number: string; approved: boolean }[] = [];

    for (const num of changeNumbers) {
        const change = await taskOps.findByNumber('change_request', num);

        if (!change) {
            console.log(`Change ${num} not found, skipping`);
            results.push({ number: num, approved: false });
            continue;
        }

        try {
            await taskOps.approveChange({
                sysId: change.sys_id,
                comments: 'Batch approved via automation'
            });
            results.push({ number: num, approved: true });
        } catch (err) {
            console.error(`Failed to approve ${num}: ${(err as Error).message}`);
            results.push({ number: num, approved: false });
        }
    }

    console.log('\n=== Approval Summary ===');
    results.forEach(r => {
        const status = r.approved ? 'Approved' : 'Failed';
        console.log(`${r.number}: ${status}`);
    });
}
```

### Example 3: Comment and Assign from External Webhook

```typescript
async function handleWebhookEvent(event: { incidentNumber: string; message: string; assignTo: string }) {
    const taskOps = new TaskOperations(instance);

    const incident = await taskOps.findByNumber('incident', event.incidentNumber);
    if (!incident) {
        throw new Error(`Incident ${event.incidentNumber} not found`);
    }

    // Add the external message as a comment
    await taskOps.addComment({
        table: 'incident',
        recordSysId: incident.sys_id,
        comment: `[External Webhook] ${event.message}`
    });

    // Reassign if requested
    if (event.assignTo) {
        await taskOps.assignTask({
            table: 'incident',
            recordSysId: incident.sys_id,
            assignedTo: event.assignTo
        });
    }

    console.log(`Processed webhook for ${event.incidentNumber}`);
}
```

## Best Practices

1. **Use `findByNumber` Before Operations**: Look up records by their human-readable number instead of hardcoding sys_ids
2. **Provide Close Codes**: Always include a `closeCode` when resolving or closing incidents for accurate reporting
3. **Distinguish Comments from Work Notes**: Use `isWorkNote: true` for internal notes that should not be visible to end users
4. **Handle Null Returns**: `findByNumber` returns `null` when no record matches; always check before proceeding
5. **Catch Errors on Bulk Operations**: When processing multiple records, wrap each call in try/catch to avoid one failure stopping the batch
6. **Specify Assignment Groups**: When assigning tasks, include the `assignmentGroup` to ensure proper queue routing

## Related

- [Getting Started Guide](./GettingStarted.md)
- [ATF Test Executor](./ATFTestExecutor.md)
- [Application Manager](./ApplicationManager.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)

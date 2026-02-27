# WorkflowManager

The `WorkflowManager` class manages ServiceNow workflow lifecycle operations including creating workflows, versions, activities, transitions, conditions, and publishing.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Related](#related)

## Overview

The `WorkflowManager` enables you to:

- Create workflow records and workflow versions
- Add activities to a workflow version
- Define transitions between activities
- Create conditions on activities for branching logic
- Publish workflow versions with a designated start activity
- Orchestrate a complete workflow from a single specification

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, WorkflowManager } from '@sonisoft/now-sdk-ext-core';

const workflowManager = new WorkflowManager(instance);
```

## Methods

### createWorkflow

Create a new workflow record.

```typescript
async createWorkflow(options: CreateWorkflowOptions): Promise<CreateWorkflowResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `CreateWorkflowOptions` | Workflow creation options |

#### CreateWorkflowOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Name of the workflow |
| `description` | `string` | No | Description of the workflow |
| `template` | `boolean` | No | Whether this is a template workflow |
| `access` | `string` | No | Access level (e.g., `"public"`, `"package_private"`) |

#### Returns

`Promise<CreateWorkflowResult>` containing:
- `workflowSysId`: The sys_id of the created workflow
- `name`: The name of the created workflow

#### Example

```typescript
const result = await workflowManager.createWorkflow({
    name: 'Incident Escalation',
    description: 'Escalates high-priority incidents automatically',
    access: 'public'
});

console.log(`Workflow created: ${result.workflowSysId}`);
```

---

### createWorkflowVersion

Create a new workflow version tied to a parent workflow and a target table.

```typescript
async createWorkflowVersion(options: CreateWorkflowVersionOptions): Promise<CreateWorkflowVersionResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `CreateWorkflowVersionOptions` | Workflow version creation options |

#### CreateWorkflowVersionOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Name of the workflow version |
| `workflowSysId` | `string` | Yes | The sys_id of the parent workflow |
| `table` | `string` | Yes | The table this version applies to (e.g., `"incident"`) |
| `description` | `string` | No | Description of the workflow version |
| `active` | `boolean` | No | Whether the version is active |
| `published` | `boolean` | No | Whether the version is published |
| `condition` | `string` | No | Condition expression for triggering the workflow |
| `order` | `number` | No | Execution order |

#### Returns

`Promise<CreateWorkflowVersionResult>` containing:
- `versionSysId`: The sys_id of the created workflow version
- `name`: The name of the created workflow version

#### Example

```typescript
const version = await workflowManager.createWorkflowVersion({
    name: 'Incident Escalation v1',
    workflowSysId: result.workflowSysId,
    table: 'incident',
    active: true,
    condition: 'priority=1'
});

console.log(`Version created: ${version.versionSysId}`);
```

---

### createActivity

Create a new workflow activity within a workflow version.

```typescript
async createActivity(options: CreateActivityOptions): Promise<CreateActivityResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `CreateActivityOptions` | Activity creation options |

#### CreateActivityOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Name of the activity |
| `workflowVersionSysId` | `string` | Yes | The sys_id of the workflow version |
| `activityDefinitionSysId` | `string` | No | The sys_id of the activity definition (type) |
| `x` | `number` | No | X position on the workflow canvas |
| `y` | `number` | No | Y position on the workflow canvas |
| `width` | `number` | No | Width on the workflow canvas |
| `height` | `number` | No | Height on the workflow canvas |
| `script` | `string` | No | Script content for the activity |
| `vars` | `string` | No | Activity variables (JSON string or comma-separated key=value pairs) |

#### Returns

`Promise<CreateActivityResult>` containing:
- `activitySysId`: The sys_id of the created activity
- `name`: The name of the created activity

#### Example

```typescript
const activity = await workflowManager.createActivity({
    name: 'Send Notification',
    workflowVersionSysId: version.versionSysId,
    x: 200,
    y: 100,
    script: 'gs.eventQueue("incident.escalated", current, current.assigned_to);'
});

console.log(`Activity created: ${activity.activitySysId}`);
```

---

### createTransition

Create a transition between two activities.

```typescript
async createTransition(options: CreateTransitionOptions): Promise<CreateTransitionResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `CreateTransitionOptions` | Transition creation options |

#### CreateTransitionOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `fromActivitySysId` | `string` | Yes | The sys_id of the source activity |
| `toActivitySysId` | `string` | Yes | The sys_id of the target activity |
| `conditionSysId` | `string` | No | The sys_id of an optional condition record |
| `order` | `number` | No | Execution order of this transition |

#### Returns

`Promise<CreateTransitionResult>` containing:
- `transitionSysId`: The sys_id of the created transition

#### Example

```typescript
const transition = await workflowManager.createTransition({
    fromActivitySysId: startActivity.activitySysId,
    toActivitySysId: notifyActivity.activitySysId
});

console.log(`Transition created: ${transition.transitionSysId}`);
```

---

### createCondition

Create a condition on an activity for branching logic.

```typescript
async createCondition(options: CreateConditionOptions): Promise<CreateConditionResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `CreateConditionOptions` | Condition creation options |

#### CreateConditionOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `activitySysId` | `string` | Yes | The sys_id of the activity this condition belongs to |
| `name` | `string` | Yes | Name of the condition |
| `description` | `string` | No | Description of the condition |
| `condition` | `string` | No | Condition expression |
| `order` | `number` | No | Execution order |
| `elseFlag` | `boolean` | No | Whether this is an else condition |

#### Returns

`Promise<CreateConditionResult>` containing:
- `conditionSysId`: The sys_id of the created condition
- `name`: The name of the created condition

#### Example

```typescript
const condition = await workflowManager.createCondition({
    activitySysId: checkActivity.activitySysId,
    name: 'Is P1 Incident',
    condition: 'current.priority == 1'
});

console.log(`Condition created: ${condition.conditionSysId}`);
```

---

### publishWorkflow

Publish a workflow version by setting `published=true` and designating the start activity.

```typescript
async publishWorkflow(options: PublishWorkflowOptions): Promise<void>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `PublishWorkflowOptions` | Publish options |

#### PublishWorkflowOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `versionSysId` | `string` | Yes | The sys_id of the workflow version to publish |
| `startActivitySysId` | `string` | Yes | The sys_id of the start activity |

#### Example

```typescript
await workflowManager.publishWorkflow({
    versionSysId: version.versionSysId,
    startActivitySysId: startActivity.activitySysId
});

console.log('Workflow published successfully');
```

---

### createCompleteWorkflow

Create a complete workflow from a single specification. Orchestrates all steps: create workflow, create version, create activities, create transitions, and optionally publish.

Activity references in transitions use the activity's `id` field (if set) or its index in the `activities` array (as a string like `"0"`, `"1"`, etc.).

```typescript
async createCompleteWorkflow(
    spec: CompleteWorkflowSpec,
    onProgress?: (message: string) => void
): Promise<CompleteWorkflowResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `spec` | `CompleteWorkflowSpec` | The complete workflow specification |
| `onProgress` | `(message: string) => void` | Optional progress callback |

#### Returns

`Promise<CompleteWorkflowResult>` containing:
- `workflowSysId`: The sys_id of the created workflow
- `versionSysId`: The sys_id of the created workflow version
- `activitySysIds`: Map of activity id/index keys to their created sys_ids
- `transitionSysIds`: Array of created transition sys_ids
- `published`: Whether the workflow was published
- `startActivity`: The start activity key, if published

#### Example

```typescript
const result = await workflowManager.createCompleteWorkflow({
    name: 'Incident Triage',
    table: 'incident',
    description: 'Auto-triage incoming incidents',
    activities: [
        { id: 'start', name: 'Begin', x: 100, y: 50 },
        { id: 'check', name: 'Check Priority', x: 100, y: 150 },
        { id: 'notify', name: 'Notify On-Call', x: 100, y: 250, script: 'gs.eventQueue("notify", current);' }
    ],
    transitions: [
        { from: 'start', to: 'check' },
        { from: 'check', to: 'notify' }
    ],
    publish: true,
    startActivity: 'start'
}, (message) => console.log(message));

console.log(`Workflow: ${result.workflowSysId}`);
console.log(`Published: ${result.published}`);
```

## Interfaces

### CreateWorkflowOptions

```typescript
interface CreateWorkflowOptions {
    name: string;
    description?: string;
    template?: boolean;
    access?: string;
}
```

### CreateWorkflowResult

```typescript
interface CreateWorkflowResult {
    workflowSysId: string;
    name: string;
}
```

### CreateWorkflowVersionOptions

```typescript
interface CreateWorkflowVersionOptions {
    name: string;
    workflowSysId: string;
    table: string;
    description?: string;
    active?: boolean;
    published?: boolean;
    condition?: string;
    order?: number;
}
```

### CreateWorkflowVersionResult

```typescript
interface CreateWorkflowVersionResult {
    versionSysId: string;
    name: string;
}
```

### CreateActivityOptions

```typescript
interface CreateActivityOptions {
    name: string;
    workflowVersionSysId: string;
    activityDefinitionSysId?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    script?: string;
    vars?: string;
}
```

### CreateActivityResult

```typescript
interface CreateActivityResult {
    activitySysId: string;
    name: string;
}
```

### CreateTransitionOptions

```typescript
interface CreateTransitionOptions {
    fromActivitySysId: string;
    toActivitySysId: string;
    conditionSysId?: string;
    order?: number;
}
```

### CreateTransitionResult

```typescript
interface CreateTransitionResult {
    transitionSysId: string;
}
```

### CreateConditionOptions

```typescript
interface CreateConditionOptions {
    activitySysId: string;
    name: string;
    description?: string;
    condition?: string;
    order?: number;
    elseFlag?: boolean;
}
```

### CreateConditionResult

```typescript
interface CreateConditionResult {
    conditionSysId: string;
    name: string;
}
```

### PublishWorkflowOptions

```typescript
interface PublishWorkflowOptions {
    versionSysId: string;
    startActivitySysId: string;
}
```

### ActivitySpec

```typescript
interface ActivitySpec {
    id?: string;
    name: string;
    script?: string;
    activityType?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    vars?: string;
}
```

### TransitionSpec

```typescript
interface TransitionSpec {
    from: string;
    to: string;
    conditionSysId?: string;
    order?: number;
}
```

### CompleteWorkflowSpec

```typescript
interface CompleteWorkflowSpec {
    name: string;
    description?: string;
    table: string;
    template?: boolean;
    access?: string;
    active?: boolean;
    condition?: string;
    activities: ActivitySpec[];
    transitions?: TransitionSpec[];
    publish?: boolean;
    startActivity?: string;
}
```

### CompleteWorkflowResult

```typescript
interface CompleteWorkflowResult {
    workflowSysId: string;
    versionSysId: string;
    activitySysIds: Record<string, string>;
    transitionSysIds: string[];
    published: boolean;
    startActivity?: string;
}
```

## Examples

### Example 1: Build a Workflow Step by Step

```typescript
async function buildWorkflowStepByStep() {
    const wfManager = new WorkflowManager(instance);

    // Step 1: Create the workflow
    const workflow = await wfManager.createWorkflow({
        name: 'Change Approval Flow',
        description: 'Routes change requests through approval'
    });

    // Step 2: Create a version
    const version = await wfManager.createWorkflowVersion({
        name: 'Change Approval Flow v1',
        workflowSysId: workflow.workflowSysId,
        table: 'change_request',
        active: true
    });

    // Step 3: Create activities
    const begin = await wfManager.createActivity({
        name: 'Begin',
        workflowVersionSysId: version.versionSysId,
        x: 100, y: 50
    });

    const approve = await wfManager.createActivity({
        name: 'Manager Approval',
        workflowVersionSysId: version.versionSysId,
        x: 100, y: 200
    });

    const end = await wfManager.createActivity({
        name: 'End',
        workflowVersionSysId: version.versionSysId,
        x: 100, y: 350
    });

    // Step 4: Create transitions
    await wfManager.createTransition({
        fromActivitySysId: begin.activitySysId,
        toActivitySysId: approve.activitySysId
    });

    await wfManager.createTransition({
        fromActivitySysId: approve.activitySysId,
        toActivitySysId: end.activitySysId
    });

    // Step 5: Publish
    await wfManager.publishWorkflow({
        versionSysId: version.versionSysId,
        startActivitySysId: begin.activitySysId
    });

    console.log('Workflow published successfully');
}
```

### Example 2: Create a Complete Workflow in One Call

```typescript
async function createIncidentEscalation() {
    const wfManager = new WorkflowManager(instance);

    const result = await wfManager.createCompleteWorkflow({
        name: 'P1 Incident Escalation',
        table: 'incident',
        description: 'Automatically escalates P1 incidents',
        condition: 'priority=1',
        activities: [
            { id: 'start', name: 'Begin', x: 100, y: 50 },
            { id: 'assign', name: 'Assign to On-Call', x: 100, y: 150,
              script: 'current.assigned_to = getOnCallUser(); current.update();' },
            { id: 'notify', name: 'Send Page', x: 100, y: 250 },
            { id: 'end', name: 'End', x: 100, y: 350 }
        ],
        transitions: [
            { from: 'start', to: 'assign' },
            { from: 'assign', to: 'notify' },
            { from: 'notify', to: 'end' }
        ],
        publish: true,
        startActivity: 'start'
    });

    console.log(`Workflow sys_id: ${result.workflowSysId}`);
    console.log(`Version sys_id: ${result.versionSysId}`);
    console.log(`Activities created: ${Object.keys(result.activitySysIds).length}`);
    console.log(`Transitions created: ${result.transitionSysIds.length}`);
    console.log(`Published: ${result.published}`);
}
```

### Example 3: Workflow with Branching Conditions

```typescript
async function createBranchingWorkflow() {
    const wfManager = new WorkflowManager(instance);

    // Create workflow and version
    const workflow = await wfManager.createWorkflow({ name: 'Triage Router' });
    const version = await wfManager.createWorkflowVersion({
        name: 'Triage Router v1',
        workflowSysId: workflow.workflowSysId,
        table: 'incident'
    });

    // Create activities
    const check = await wfManager.createActivity({
        name: 'Check Category',
        workflowVersionSysId: version.versionSysId
    });

    const hwRoute = await wfManager.createActivity({
        name: 'Route to Hardware',
        workflowVersionSysId: version.versionSysId
    });

    const swRoute = await wfManager.createActivity({
        name: 'Route to Software',
        workflowVersionSysId: version.versionSysId
    });

    // Create conditions on the check activity
    const hwCondition = await wfManager.createCondition({
        activitySysId: check.activitySysId,
        name: 'Is Hardware',
        condition: 'current.category == "hardware"',
        order: 100
    });

    const elseCondition = await wfManager.createCondition({
        activitySysId: check.activitySysId,
        name: 'Otherwise',
        elseFlag: true,
        order: 200
    });

    // Create conditional transitions
    await wfManager.createTransition({
        fromActivitySysId: check.activitySysId,
        toActivitySysId: hwRoute.activitySysId,
        conditionSysId: hwCondition.conditionSysId
    });

    await wfManager.createTransition({
        fromActivitySysId: check.activitySysId,
        toActivitySysId: swRoute.activitySysId,
        conditionSysId: elseCondition.conditionSysId
    });

    console.log('Branching workflow created');
}
```

## Best Practices

1. **Use `createCompleteWorkflow` for New Workflows**: The orchestration method handles all steps and provides a cleaner API than building step by step
2. **Assign Activity IDs**: Always set the `id` field on `ActivitySpec` entries for readable transition references instead of relying on array indices
3. **Validate Before Publishing**: Ensure all transitions are connected and a valid start activity is specified before calling `publishWorkflow`
4. **Track Progress**: Pass an `onProgress` callback to `createCompleteWorkflow` for visibility into long-running orchestrations
5. **Handle Errors Gracefully**: All methods throw on failure; wrap calls in try/catch to handle partial creation scenarios
6. **Use Conditions for Branching**: Pair `createCondition` with conditional transitions rather than embedding logic in activity scripts

## Related

- [Getting Started Guide](./GettingStarted.md)
- [ATF Test Executor](./ATFTestExecutor.md)
- [Application Manager](./ApplicationManager.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)

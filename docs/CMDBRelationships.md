# CMDBRelationships

The `CMDBRelationships` class provides methods for querying and traversing CMDB relationship graphs in ServiceNow.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Methods](#methods)
- [Interfaces](#interfaces)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Related](#related)

## Overview

The `CMDBRelationships` enables you to:

- Retrieve direct upstream and downstream relationships for any CI
- Traverse the full CMDB relationship graph using breadth-first search (BFS)
- Filter relationships by type (e.g., "Depends on::Used by")
- Control traversal depth and maximum node count
- Detect graph truncation with clear reasons
- Benefit from built-in CI caching to minimize API calls during traversal

## Constructor

```typescript
constructor(instance: ServiceNowInstance)
```

### Example

```typescript
import { ServiceNowInstance, CMDBRelationships } from '@sonisoft/now-sdk-ext-core';

const cmdb = new CMDBRelationships(instance);
```

## Methods

### getRelationships

Get direct relationships of a CI (single level). Returns both upstream (this CI is a child) and downstream (this CI is a parent) relationships depending on the specified direction.

```typescript
async getRelationships(options: GetRelationshipsOptions): Promise<RelationshipsResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `GetRelationshipsOptions` | Relationship query options |

#### GetRelationshipsOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ciSysId` | `string` | - | The sys_id of the CI to get relationships for (required) |
| `direction` | `TraversalDirection` | `'both'` | Direction of traversal: `'upstream'`, `'downstream'`, or `'both'` |
| `relationType` | `string` | - | Optional relationship type filter (name from cmdb_rel_type) |
| `limit` | `number` | `100` | Maximum number of relationships to return |

#### Returns

`Promise<RelationshipsResult>` containing:
- `ci`: The queried CI record
- `relationships`: Array of relationship entries, each with `relatedCI`, `direction`, `typeName`, and `relationshipSysId`

#### Throws

- `Error` if `ciSysId` is empty
- `Error` if the CI is not found

#### Example

```typescript
const result = await cmdb.getRelationships({
    ciSysId: 'abc123def456',
    direction: 'both'
});

console.log(`CI: ${result.ci.name}`);
console.log(`Relationships: ${result.relationships.length}`);

for (const rel of result.relationships) {
    console.log(`  ${rel.direction}: ${rel.relatedCI.name} (${rel.typeName})`);
}
```

---

### traverseGraph

Traverse the CMDB relationship graph using BFS starting from a CI. Visits connected CIs up to a configurable depth and node limit.

```typescript
async traverseGraph(options: TraverseGraphOptions): Promise<GraphTraversalResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `TraverseGraphOptions` | Traversal options |

#### TraverseGraphOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ciSysId` | `string` | - | The sys_id of the starting CI (required) |
| `direction` | `TraversalDirection` | `'downstream'` | Direction of traversal: `'upstream'`, `'downstream'`, or `'both'` |
| `maxDepth` | `number` | `3` | Maximum traversal depth. Max allowed: 5. |
| `relationType` | `string` | - | Optional relationship type filter |
| `maxNodes` | `number` | `200` | Maximum total CIs to visit. Max allowed: 1000. |

#### Returns

`Promise<GraphTraversalResult>` containing:
- `rootCI`: The starting CI record
- `nodes`: All `GraphNode` objects visited during traversal
- `edges`: All `GraphEdge` objects discovered during traversal
- `apiCallCount`: Total number of API calls made
- `truncated`: Whether the traversal was cut short
- `truncationReason`: Reason for truncation (if applicable)

#### Throws

- `Error` if `ciSysId` is empty
- `Error` if the starting CI is not found

#### Example

```typescript
const graph = await cmdb.traverseGraph({
    ciSysId: 'abc123def456',
    direction: 'downstream',
    maxDepth: 2,
    maxNodes: 50
});

console.log(`Root: ${graph.rootCI.name}`);
console.log(`Nodes: ${graph.nodes.length}, Edges: ${graph.edges.length}`);
console.log(`API calls: ${graph.apiCallCount}`);

if (graph.truncated) {
    console.warn(`Traversal truncated: ${graph.truncationReason}`);
}
```

## Interfaces

### TraversalDirection

```typescript
type TraversalDirection = 'upstream' | 'downstream' | 'both';
```

### GetRelationshipsOptions

```typescript
interface GetRelationshipsOptions {
    /** The sys_id of the CI to get relationships for (required) */
    ciSysId: string;

    /** Direction of traversal. Defaults to 'both'. */
    direction?: TraversalDirection;

    /** Optional relationship type filter (name from cmdb_rel_type) */
    relationType?: string;

    /** Maximum number of relationships to return. Defaults to 100. */
    limit?: number;
}
```

### TraverseGraphOptions

```typescript
interface TraverseGraphOptions {
    /** The sys_id of the starting CI (required) */
    ciSysId: string;

    /** Direction of traversal. Defaults to 'downstream'. */
    direction?: TraversalDirection;

    /** Maximum traversal depth. Defaults to 3. Max allowed: 5. */
    maxDepth?: number;

    /** Optional relationship type filter */
    relationType?: string;

    /** Maximum total CIs to visit. Defaults to 200. Max allowed: 1000. */
    maxNodes?: number;
}
```

### CMDBCIRecord

```typescript
interface CMDBCIRecord {
    /** The system ID */
    sys_id: string;

    /** The CI name */
    name?: string;

    /** The CI class (table name) */
    sys_class_name?: string;

    /** Additional fields */
    [key: string]: unknown;
}
```

### CMDBRelationshipRecord

```typescript
interface CMDBRelationshipRecord {
    /** The system ID of the relationship */
    sys_id: string;

    /** The parent CI sys_id */
    parent: string | { link: string; value: string; display_value?: string };

    /** The child CI sys_id */
    child: string | { link: string; value: string; display_value?: string };

    /** The relationship type */
    type: string | { link: string; value: string; display_value?: string };

    /** Additional fields */
    [key: string]: unknown;
}
```

### GraphNode

```typescript
interface GraphNode {
    /** The CI sys_id */
    sysId: string;

    /** The CI name */
    name: string;

    /** The CI class */
    className: string;

    /** Depth from the starting CI (0 = root) */
    depth: number;
}
```

### GraphEdge

```typescript
interface GraphEdge {
    /** Parent CI sys_id */
    parentSysId: string;

    /** Child CI sys_id */
    childSysId: string;

    /** Relationship type name */
    typeName: string;

    /** Relationship sys_id */
    relationshipSysId: string;
}
```

### RelationshipsResult

```typescript
interface RelationshipsResult {
    /** The queried CI */
    ci: CMDBCIRecord;

    /** Direct relationships */
    relationships: Array<{
        /** The related CI */
        relatedCI: CMDBCIRecord;
        /** Direction: 'upstream' (this CI is child) or 'downstream' (this CI is parent) */
        direction: 'upstream' | 'downstream';
        /** Relationship type name */
        typeName: string;
        /** Relationship record sys_id */
        relationshipSysId: string;
    }>;
}
```

### GraphTraversalResult

```typescript
interface GraphTraversalResult {
    /** The starting CI */
    rootCI: CMDBCIRecord;

    /** All nodes visited in the graph */
    nodes: GraphNode[];

    /** All edges discovered in the graph */
    edges: GraphEdge[];

    /** Total number of API calls made */
    apiCallCount: number;

    /** Whether the traversal was truncated due to maxDepth or maxNodes */
    truncated: boolean;

    /** Reason for truncation if truncated is true */
    truncationReason?: string;
}
```

## Examples

### Example 1: Impact Analysis

```typescript
async function analyzeImpact(ciSysId: string) {
    const cmdb = new CMDBRelationships(instance);

    // Get all downstream dependencies
    const graph = await cmdb.traverseGraph({
        ciSysId,
        direction: 'downstream',
        maxDepth: 3
    });

    console.log(`=== Impact Analysis for ${graph.rootCI.name} ===`);
    console.log(`Total dependent CIs: ${graph.nodes.length - 1}`);

    // Group nodes by depth
    const byDepth: Record<number, GraphNode[]> = {};
    for (const node of graph.nodes) {
        if (!byDepth[node.depth]) byDepth[node.depth] = [];
        byDepth[node.depth].push(node);
    }

    for (const [depth, nodes] of Object.entries(byDepth)) {
        if (depth === '0') continue; // skip root
        console.log(`\n  Depth ${depth} (${nodes.length} CIs):`);
        for (const node of nodes) {
            console.log(`    - ${node.name} [${node.className}]`);
        }
    }

    if (graph.truncated) {
        console.warn(`\nNote: ${graph.truncationReason}`);
    }
}
```

### Example 2: Dependency Lookup

```typescript
async function listDependencies(ciSysId: string) {
    const cmdb = new CMDBRelationships(instance);

    const result = await cmdb.getRelationships({
        ciSysId,
        direction: 'both',
        relationType: 'Depends on::Used by'
    });

    console.log(`CI: ${result.ci.name} (${result.ci.sys_class_name})`);

    const upstream = result.relationships.filter(r => r.direction === 'upstream');
    const downstream = result.relationships.filter(r => r.direction === 'downstream');

    console.log(`\nDepends on (${upstream.length}):`);
    for (const rel of upstream) {
        console.log(`  - ${rel.relatedCI.name}`);
    }

    console.log(`\nUsed by (${downstream.length}):`);
    for (const rel of downstream) {
        console.log(`  - ${rel.relatedCI.name}`);
    }
}
```

### Example 3: Generating a Graph Export

```typescript
async function exportGraphAsJSON(ciSysId: string) {
    const cmdb = new CMDBRelationships(instance);

    const graph = await cmdb.traverseGraph({
        ciSysId,
        direction: 'both',
        maxDepth: 4,
        maxNodes: 500
    });

    const exportData = {
        root: graph.rootCI.name,
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        truncated: graph.truncated,
        nodes: graph.nodes.map(n => ({
            id: n.sysId,
            label: n.name,
            class: n.className,
            depth: n.depth
        })),
        edges: graph.edges.map(e => ({
            source: e.parentSysId,
            target: e.childSysId,
            type: e.typeName
        }))
    };

    console.log(JSON.stringify(exportData, null, 2));
}
```

## Best Practices

1. **Start with `getRelationships`**: Use single-level lookups before resorting to full graph traversal to minimize API calls
2. **Set Reasonable Limits**: Always configure `maxDepth` and `maxNodes` to avoid runaway traversals on densely connected CMDB graphs
3. **Filter by Relationship Type**: Use `relationType` to narrow results when you only care about specific relationship kinds (e.g., "Depends on::Used by")
4. **Check for Truncation**: Always inspect `truncated` and `truncationReason` on graph traversal results to know whether you are seeing the complete picture
5. **Leverage the CI Cache**: The class caches CI records internally during traversal; creating a new `CMDBRelationships` instance clears the cache if a fresh view is needed
6. **Respect Hard Limits**: Maximum depth is capped at 5 and maximum nodes at 1000 regardless of the values you pass

## Related

- [Getting Started Guide](./GettingStarted.md)
- [AggregateQuery](./AggregateQuery.md)
- [InstanceDiscovery](./InstanceDiscovery.md)
- [API Reference](./APIReference.md)
- [Examples](./Examples.md)

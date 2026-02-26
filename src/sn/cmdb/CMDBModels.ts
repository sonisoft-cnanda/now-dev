// ============================================================
// Options Types
// ============================================================

/**
 * Direction of relationship traversal.
 */
export type TraversalDirection = 'upstream' | 'downstream' | 'both';

/**
 * Options for getting direct relationships of a CI.
 */
export interface GetRelationshipsOptions {
    /** The sys_id of the CI to get relationships for (required) */
    ciSysId: string;

    /** Direction of traversal. Defaults to 'both'. */
    direction?: TraversalDirection;

    /** Optional relationship type filter (name from cmdb_rel_type) */
    relationType?: string;

    /** Maximum number of relationships to return. Defaults to 100. */
    limit?: number;
}

/**
 * Options for traversing the CMDB relationship graph.
 */
export interface TraverseGraphOptions {
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

// ============================================================
// Result Types
// ============================================================

/**
 * A CI record from the CMDB.
 */
export interface CMDBCIRecord {
    /** The system ID */
    sys_id: string;

    /** The CI name */
    name?: string;

    /** The CI class (table name) */
    sys_class_name?: string;

    /** Additional fields */
    [key: string]: unknown;
}

/**
 * A relationship record from cmdb_rel_ci.
 */
export interface CMDBRelationshipRecord {
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

/**
 * A node in the relationship graph.
 */
export interface GraphNode {
    /** The CI sys_id */
    sysId: string;

    /** The CI name */
    name: string;

    /** The CI class */
    className: string;

    /** Depth from the starting CI (0 = root) */
    depth: number;
}

/**
 * An edge in the relationship graph.
 */
export interface GraphEdge {
    /** Parent CI sys_id */
    parentSysId: string;

    /** Child CI sys_id */
    childSysId: string;

    /** Relationship type name */
    typeName: string;

    /** Relationship sys_id */
    relationshipSysId: string;
}

/**
 * Result of getting direct relationships.
 */
export interface RelationshipsResult {
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

/**
 * Result of a full graph traversal.
 */
export interface GraphTraversalResult {
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

// ============================================================
// ServiceNow Response Wrappers
// ============================================================

/** Response from cmdb_ci query. */
export interface CMDBCIResponse {
    result: CMDBCIRecord[];
}

/** Response from cmdb_rel_ci query. */
export interface CMDBRelResponse {
    result: CMDBRelationshipRecord[];
}

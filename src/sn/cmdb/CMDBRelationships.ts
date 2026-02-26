import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import {
    GetRelationshipsOptions,
    TraverseGraphOptions,
    CMDBCIRecord,
    CMDBRelationshipRecord,
    GraphNode,
    GraphEdge,
    RelationshipsResult,
    GraphTraversalResult,
    CMDBCIResponse,
    CMDBRelResponse
} from './CMDBModels';

/**
 * CMDBRelationships provides methods for querying and traversing
 * CMDB relationship graphs. Supports single-level lookups and
 * multi-level BFS traversal with configurable depth and direction.
 */
export class CMDBRelationships {
    private static readonly CMDB_CI_TABLE = 'cmdb_ci';
    private static readonly CMDB_REL_CI_TABLE = 'cmdb_rel_ci';
    private static readonly MAX_DEPTH = 5;
    private static readonly MAX_NODES = 1000;

    private _logger: Logger = new Logger("CMDBRelationships");
    private _tableAPI: TableAPIRequest;
    private _instance: ServiceNowInstance;

    /** Cache for CI records to minimize API calls during traversal */
    private _ciCache: Map<string, CMDBCIRecord> = new Map();

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._tableAPI = new TableAPIRequest(instance);
    }

    /**
     * Get direct relationships of a CI (single level).
     *
     * @param options Relationship query options
     * @returns RelationshipsResult with the CI and its direct relationships
     * @throws Error if ciSysId is empty
     */
    public async getRelationships(options: GetRelationshipsOptions): Promise<RelationshipsResult> {
        if (!options.ciSysId || options.ciSysId.trim().length === 0) {
            throw new Error('CI sys_id is required');
        }

        const direction = options.direction ?? 'both';
        const limit = options.limit ?? 100;

        this._logger.info(`Getting relationships for CI ${options.ciSysId} (direction=${direction})`);

        // Look up the CI
        const ci = await this._lookupCI(options.ciSysId);
        if (!ci) {
            throw new Error(`CI with sys_id '${options.ciSysId}' not found`);
        }

        // Query relationships
        const relationships: RelationshipsResult['relationships'] = [];

        if (direction === 'downstream' || direction === 'both') {
            const downstreamRels = await this._queryRelationships(options.ciSysId, 'parent', limit, options.relationType);
            for (const rel of downstreamRels) {
                const childId = this._extractSysId(rel.child);
                const relatedCI = await this._lookupCI(childId);
                if (relatedCI) {
                    relationships.push({
                        relatedCI,
                        direction: 'downstream',
                        typeName: this._extractDisplayValue(rel.type),
                        relationshipSysId: rel.sys_id
                    });
                }
            }
        }

        if (direction === 'upstream' || direction === 'both') {
            const upstreamRels = await this._queryRelationships(options.ciSysId, 'child', limit, options.relationType);
            for (const rel of upstreamRels) {
                const parentId = this._extractSysId(rel.parent);
                const relatedCI = await this._lookupCI(parentId);
                if (relatedCI) {
                    relationships.push({
                        relatedCI,
                        direction: 'upstream',
                        typeName: this._extractDisplayValue(rel.type),
                        relationshipSysId: rel.sys_id
                    });
                }
            }
        }

        this._logger.info(`Found ${relationships.length} relationships for CI ${options.ciSysId}`);

        return { ci, relationships };
    }

    /**
     * Traverse the CMDB relationship graph using BFS starting from a CI.
     *
     * @param options Traversal options
     * @returns GraphTraversalResult with all nodes, edges, and metadata
     * @throws Error if ciSysId is empty
     */
    public async traverseGraph(options: TraverseGraphOptions): Promise<GraphTraversalResult> {
        if (!options.ciSysId || options.ciSysId.trim().length === 0) {
            throw new Error('CI sys_id is required');
        }

        const direction = options.direction ?? 'downstream';
        const maxDepth = Math.min(options.maxDepth ?? 3, CMDBRelationships.MAX_DEPTH);
        const maxNodes = Math.min(options.maxNodes ?? 200, CMDBRelationships.MAX_NODES);

        this._logger.info(`Traversing graph from CI ${options.ciSysId} (direction=${direction}, maxDepth=${maxDepth}, maxNodes=${maxNodes})`);

        // Clear cache for fresh traversal
        this._ciCache.clear();

        // Look up root CI
        const rootCI = await this._lookupCI(options.ciSysId);
        if (!rootCI) {
            throw new Error(`CI with sys_id '${options.ciSysId}' not found`);
        }

        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const visited = new Set<string>();
        const queue: Array<{ sysId: string; depth: number }> = [];
        let apiCallCount = 0;
        let truncated = false;
        let truncationReason: string | undefined;

        // Initialize BFS
        visited.add(options.ciSysId);
        nodes.push({
            sysId: rootCI.sys_id,
            name: rootCI.name || '',
            className: rootCI.sys_class_name || '',
            depth: 0
        });
        queue.push({ sysId: options.ciSysId, depth: 0 });

        let depthLimited = false;

        // BFS loop
        while (queue.length > 0) {
            const { sysId, depth } = queue.shift()!;

            if (depth >= maxDepth) {
                depthLimited = true;
                continue;
            }

            if (nodes.length >= maxNodes) {
                truncated = true;
                truncationReason = `Maximum node limit reached (${maxNodes})`;
                break;
            }

            // Query relationships based on direction
            const rels: CMDBRelationshipRecord[] = [];

            if (direction === 'downstream' || direction === 'both') {
                const downRels = await this._queryRelationships(sysId, 'parent', 100, options.relationType);
                rels.push(...downRels);
                apiCallCount++;
            }

            if (direction === 'upstream' || direction === 'both') {
                const upRels = await this._queryRelationships(sysId, 'child', 100, options.relationType);
                rels.push(...upRels);
                apiCallCount++;
            }

            // Process relationships
            const newSysIds: string[] = [];

            for (const rel of rels) {
                const parentId = this._extractSysId(rel.parent);
                const childId = this._extractSysId(rel.child);
                const typeName = this._extractDisplayValue(rel.type);

                // Determine the "other" CI based on current node
                const relatedId = parentId === sysId ? childId : parentId;

                edges.push({
                    parentSysId: parentId,
                    childSysId: childId,
                    typeName,
                    relationshipSysId: rel.sys_id
                });

                if (!visited.has(relatedId)) {
                    visited.add(relatedId);
                    newSysIds.push(relatedId);
                }
            }

            // Batch-fetch CI details for new nodes
            if (newSysIds.length > 0) {
                const ciRecords = await this._batchLookupCIs(newSysIds);
                apiCallCount++;

                for (const ciRecord of ciRecords) {
                    if (nodes.length >= maxNodes) {
                        truncated = true;
                        truncationReason = `Maximum node limit reached (${maxNodes})`;
                        break;
                    }

                    nodes.push({
                        sysId: ciRecord.sys_id,
                        name: ciRecord.name || '',
                        className: ciRecord.sys_class_name || '',
                        depth: depth + 1
                    });

                    queue.push({ sysId: ciRecord.sys_id, depth: depth + 1 });
                }
            }
        }

        if (depthLimited && !truncated) {
            truncated = true;
            truncationReason = `Maximum depth reached (${maxDepth})`;
        }

        this._logger.info(`Traversal complete: ${nodes.length} nodes, ${edges.length} edges, ${apiCallCount} API calls`);

        return {
            rootCI,
            nodes,
            edges,
            apiCallCount,
            truncated,
            truncationReason
        };
    }

    /**
     * Look up a single CI by sys_id. Uses cache when available.
     * @private
     */
    private async _lookupCI(sysId: string): Promise<CMDBCIRecord | null> {
        if (this._ciCache.has(sysId)) {
            return this._ciCache.get(sysId)!;
        }

        const query: Record<string, string | number> = {
            sysparm_query: `sys_id=${sysId}`,
            sysparm_limit: 1
        };

        const response: IHttpResponse<CMDBCIResponse> = await this._tableAPI.get<CMDBCIResponse>(
            CMDBRelationships.CMDB_CI_TABLE,
            query
        );

        if (response && response.status === 200 && response.bodyObject?.result && response.bodyObject.result.length > 0) {
            const ci = response.bodyObject.result[0];
            this._ciCache.set(sysId, ci);
            return ci;
        }

        return null;
    }

    /**
     * Batch look up multiple CIs by sys_id.
     * @private
     */
    private async _batchLookupCIs(sysIds: string[]): Promise<CMDBCIRecord[]> {
        // Filter out already cached IDs
        const uncachedIds = sysIds.filter(id => !this._ciCache.has(id));
        const results: CMDBCIRecord[] = [];

        // Return cached items
        for (const id of sysIds) {
            if (this._ciCache.has(id)) {
                results.push(this._ciCache.get(id)!);
            }
        }

        if (uncachedIds.length === 0) {
            return results;
        }

        // Batch-fetch in chunks of 50
        for (let i = 0; i < uncachedIds.length; i += 50) {
            const chunk = uncachedIds.slice(i, i + 50);
            const query: Record<string, string | number> = {
                sysparm_query: `sys_idIN${chunk.join(',')}`,
                sysparm_limit: chunk.length
            };

            const response: IHttpResponse<CMDBCIResponse> = await this._tableAPI.get<CMDBCIResponse>(
                CMDBRelationships.CMDB_CI_TABLE,
                query
            );

            if (response && response.status === 200 && response.bodyObject?.result) {
                for (const ci of response.bodyObject.result) {
                    this._ciCache.set(ci.sys_id, ci);
                    results.push(ci);
                }
            }
        }

        return results;
    }

    /**
     * Query relationships from cmdb_rel_ci.
     * @private
     */
    private async _queryRelationships(
        sysId: string,
        role: 'parent' | 'child',
        limit: number,
        relationType?: string
    ): Promise<CMDBRelationshipRecord[]> {
        let queryStr = `${role}=${sysId}`;

        if (relationType) {
            queryStr += `^type.name=${relationType}`;
        }

        const query: Record<string, string | number> = {
            sysparm_query: queryStr,
            sysparm_limit: limit
        };

        const response: IHttpResponse<CMDBRelResponse> = await this._tableAPI.get<CMDBRelResponse>(
            CMDBRelationships.CMDB_REL_CI_TABLE,
            query
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            return response.bodyObject.result;
        }

        return [];
    }

    /**
     * Extract sys_id from a field that may be a string or reference object.
     * @private
     */
    private _extractSysId(field: string | { value: string; [key: string]: unknown }): string {
        if (typeof field === 'object' && field !== null) {
            return field.value;
        }
        return field as string;
    }

    /**
     * Extract display value or value from a field.
     * @private
     */
    private _extractDisplayValue(field: string | { value: string; display_value?: string; [key: string]: unknown }): string {
        if (typeof field === 'object' && field !== null) {
            return field.display_value || field.value || '';
        }
        return field as string || '';
    }
}

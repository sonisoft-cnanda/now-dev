import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import {
    BatchCreateOptions,
    BatchCreateResult,
    BatchUpdateOptions,
    BatchUpdateResult
} from './BatchModels';

/**
 * Provides batch create and update operations against ServiceNow tables.
 * Operations are executed sequentially, with optional transactional (stop-on-error) behavior
 * and variable reference resolution between operations.
 */
export class BatchOperations {
    private _logger: Logger = new Logger("BatchOperations");
    private _req: ServiceNowRequest;
    private _tableAPI: TableAPIRequest;
    private _instance: ServiceNowInstance;

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
        this._tableAPI = new TableAPIRequest(instance);
    }

    /**
     * Execute a batch of create operations sequentially.
     * Supports variable references: if an operation has saveAs="myKey", later operations
     * can reference ${myKey} in their data values to substitute the created sys_id.
     *
     * @param options Batch create options including operations list and transaction flag
     * @returns BatchCreateResult with counts, sys_ids, errors, and timing
     */
    public async batchCreate(options: BatchCreateOptions): Promise<BatchCreateResult> {
        const startTime = Date.now();
        const transaction = options.transaction !== undefined ? options.transaction : true;
        const sysIds: Record<string, string> = {};
        const errors: BatchCreateResult['errors'] = [];
        let createdCount = 0;

        this._logger.info(`Starting batch create with ${options.operations.length} operations (transaction=${transaction})`);

        for (let i = 0; i < options.operations.length; i++) {
            const op = options.operations[i];

            try {
                // Resolve variable references in the data using previously saved sys_ids
                const resolvedData = this.resolveVariableReferences(op.data, sysIds);

                if (options.onProgress) {
                    options.onProgress(`Creating record ${i + 1}/${options.operations.length} in table '${op.table}'`);
                }

                this._logger.info(`Batch create [${i + 1}/${options.operations.length}]: POST to '${op.table}'`);

                const response: IHttpResponse<{ result: { sys_id: string; [key: string]: unknown } }> =
                    await this._tableAPI.post(op.table, {}, resolvedData);

                if (response && (response.status === 200 || response.status === 201) && response.bodyObject?.result?.sys_id) {
                    const createdSysId = response.bodyObject.result.sys_id;
                    createdCount++;

                    if (op.saveAs) {
                        sysIds[op.saveAs] = createdSysId;
                    }

                    this._logger.info(`Batch create [${i + 1}]: Created sys_id=${createdSysId} in '${op.table}'`);
                } else {
                    const errorMsg = `Failed to create record in '${op.table}'. Status: ${response?.status ?? 'unknown'}`;
                    this._logger.error(errorMsg);
                    errors.push({ operationIndex: i, table: op.table, error: errorMsg });

                    if (transaction) {
                        if (options.onProgress) {
                            options.onProgress(`Stopping batch: error at operation ${i + 1}`);
                        }
                        break;
                    }
                }
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                this._logger.error(`Batch create [${i + 1}] exception: ${errorMsg}`);
                errors.push({ operationIndex: i, table: op.table, error: errorMsg });

                if (transaction) {
                    if (options.onProgress) {
                        options.onProgress(`Stopping batch: error at operation ${i + 1}`);
                    }
                    break;
                }
            }
        }

        const executionTimeMs = Date.now() - startTime;

        if (options.onProgress) {
            options.onProgress(`Batch create complete: ${createdCount} created, ${errors.length} errors`);
        }

        return {
            success: errors.length === 0,
            createdCount,
            sysIds,
            errors,
            executionTimeMs
        };
    }

    /**
     * Execute a batch of update operations sequentially.
     *
     * @param options Batch update options including updates list and stopOnError flag
     * @returns BatchUpdateResult with counts, errors, and timing
     */
    public async batchUpdate(options: BatchUpdateOptions): Promise<BatchUpdateResult> {
        const startTime = Date.now();
        const stopOnError = options.stopOnError ?? false;
        const errors: BatchUpdateResult['errors'] = [];
        let updatedCount = 0;

        this._logger.info(`Starting batch update with ${options.updates.length} updates (stopOnError=${stopOnError})`);

        for (let i = 0; i < options.updates.length; i++) {
            const update = options.updates[i];

            try {
                if (options.onProgress) {
                    options.onProgress(`Updating record ${i + 1}/${options.updates.length} in table '${update.table}'`);
                }

                this._logger.info(`Batch update [${i + 1}/${options.updates.length}]: PUT to '${update.table}/${update.sysId}'`);

                const response: IHttpResponse<{ result: { sys_id: string; [key: string]: unknown } }> =
                    await this._tableAPI.put(update.table, update.sysId, update.data);

                if (response && response.status === 200 && response.bodyObject?.result) {
                    updatedCount++;
                    this._logger.info(`Batch update [${i + 1}]: Updated '${update.table}/${update.sysId}'`);
                } else {
                    const errorMsg = `Failed to update record '${update.sysId}' in '${update.table}'. Status: ${response?.status ?? 'unknown'}`;
                    this._logger.error(errorMsg);
                    errors.push({ updateIndex: i, table: update.table, sysId: update.sysId, error: errorMsg });

                    if (stopOnError) {
                        if (options.onProgress) {
                            options.onProgress(`Stopping batch: error at update ${i + 1}`);
                        }
                        break;
                    }
                }
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                this._logger.error(`Batch update [${i + 1}] exception: ${errorMsg}`);
                errors.push({ updateIndex: i, table: update.table, sysId: update.sysId, error: errorMsg });

                if (stopOnError) {
                    if (options.onProgress) {
                        options.onProgress(`Stopping batch: error at update ${i + 1}`);
                    }
                    break;
                }
            }
        }

        const executionTimeMs = Date.now() - startTime;

        if (options.onProgress) {
            options.onProgress(`Batch update complete: ${updatedCount} updated, ${errors.length} errors`);
        }

        return {
            success: errors.length === 0,
            updatedCount,
            errors,
            executionTimeMs
        };
    }

    /**
     * Resolve ${variable} references in data values using the sysIds map.
     * Serializes the data to JSON, replaces all ${key} patterns with the
     * corresponding sys_id value, then deserializes back.
     *
     * @param data The record data that may contain variable references
     * @param sysIds Map of variable names to sys_id values
     * @returns A new data object with all references resolved
     */
    private resolveVariableReferences(
        data: Record<string, unknown>,
        sysIds: Record<string, string>
    ): Record<string, unknown> {
        if (Object.keys(sysIds).length === 0) {
            return data;
        }

        let json = JSON.stringify(data);

        for (const [key, value] of Object.entries(sysIds)) {
            // Use a global regex to replace all occurrences of ${key}
            const pattern = new RegExp('\\$\\{' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\}', 'g');
            json = json.replace(pattern, value);
        }

        return JSON.parse(json) as Record<string, unknown>;
    }
}

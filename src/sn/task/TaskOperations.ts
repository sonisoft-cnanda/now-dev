import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import {
    AddCommentOptions,
    AssignTaskOptions,
    ResolveIncidentOptions,
    CloseIncidentOptions,
    ApproveChangeOptions,
    TaskRecord,
    TaskRecordResponse,
    TaskRecordListResponse
} from './TaskModels';

/**
 * Provides convenience operations for common task-related actions in ServiceNow,
 * such as adding comments, assigning tasks, resolving/closing incidents,
 * and approving change requests.
 */
export class TaskOperations {
    private _logger: Logger = new Logger("TaskOperations");
    private _req: ServiceNowRequest;
    private _tableAPI: TableAPIRequest;
    private _instance: ServiceNowInstance;

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
        this._tableAPI = new TableAPIRequest(instance);
    }

    /**
     * Add a comment or work note to a task record.
     *
     * @param options The comment options including table, record sys_id, and comment text
     * @returns The updated task record
     * @throws Error if the API call fails
     */
    public async addComment(options: AddCommentOptions): Promise<TaskRecord> {
        if (!options.table || options.table.trim().length === 0) {
            throw new Error('Table name is required');
        }
        if (!options.recordSysId || options.recordSysId.trim().length === 0) {
            throw new Error('Record sys_id is required');
        }
        if (!options.comment || options.comment.trim().length === 0) {
            throw new Error('Comment text is required');
        }

        const fieldName = options.isWorkNote ? 'work_notes' : 'comments';
        this._logger.info(`Adding ${fieldName} to ${options.table}/${options.recordSysId}`);

        const body: Record<string, string> = {
            [fieldName]: options.comment
        };

        const response: IHttpResponse<TaskRecordResponse> = await this._tableAPI.put<TaskRecordResponse>(
            options.table, options.recordSysId, body
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Successfully added ${fieldName} to ${options.table}/${options.recordSysId}`);
            return response.bodyObject.result;
        }

        throw new Error(
            `Failed to add ${fieldName} to ${options.table}/${options.recordSysId}. Status: ${response?.status ?? 'unknown'}`
        );
    }

    /**
     * Assign a task record to a user and optionally to an assignment group.
     *
     * @param options The assignment options
     * @returns The updated task record
     * @throws Error if the API call fails
     */
    public async assignTask(options: AssignTaskOptions): Promise<TaskRecord> {
        if (!options.table || options.table.trim().length === 0) {
            throw new Error('Table name is required');
        }
        if (!options.recordSysId || options.recordSysId.trim().length === 0) {
            throw new Error('Record sys_id is required');
        }
        if (!options.assignedTo || options.assignedTo.trim().length === 0) {
            throw new Error('Assigned to value is required');
        }

        this._logger.info(`Assigning ${options.table}/${options.recordSysId} to ${options.assignedTo}`);

        const body: Record<string, string> = {
            assigned_to: options.assignedTo
        };

        if (options.assignmentGroup) {
            body.assignment_group = options.assignmentGroup;
        }

        const response: IHttpResponse<TaskRecordResponse> = await this._tableAPI.put<TaskRecordResponse>(
            options.table, options.recordSysId, body
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Successfully assigned ${options.table}/${options.recordSysId}`);
            return response.bodyObject.result;
        }

        throw new Error(
            `Failed to assign ${options.table}/${options.recordSysId}. Status: ${response?.status ?? 'unknown'}`
        );
    }

    /**
     * Resolve an incident by setting its state to 6 (Resolved).
     *
     * @param options The resolve options including sys_id and resolution notes
     * @returns The updated incident record
     * @throws Error if the API call fails
     */
    public async resolveIncident(options: ResolveIncidentOptions): Promise<TaskRecord> {
        if (!options.sysId || options.sysId.trim().length === 0) {
            throw new Error('Incident sys_id is required');
        }
        if (!options.resolutionNotes || options.resolutionNotes.trim().length === 0) {
            throw new Error('Resolution notes are required');
        }

        this._logger.info(`Resolving incident ${options.sysId}`);

        const body: Record<string, string> = {
            state: '6',
            close_notes: options.resolutionNotes
        };

        if (options.closeCode) {
            body.close_code = options.closeCode;
        }

        const response: IHttpResponse<TaskRecordResponse> = await this._tableAPI.put<TaskRecordResponse>(
            'incident', options.sysId, body
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Successfully resolved incident ${options.sysId}`);
            return response.bodyObject.result;
        }

        throw new Error(
            `Failed to resolve incident ${options.sysId}. Status: ${response?.status ?? 'unknown'}`
        );
    }

    /**
     * Close an incident by setting its state to 7 (Closed).
     *
     * @param options The close options including sys_id and close notes
     * @returns The updated incident record
     * @throws Error if the API call fails
     */
    public async closeIncident(options: CloseIncidentOptions): Promise<TaskRecord> {
        if (!options.sysId || options.sysId.trim().length === 0) {
            throw new Error('Incident sys_id is required');
        }
        if (!options.closeNotes || options.closeNotes.trim().length === 0) {
            throw new Error('Close notes are required');
        }

        this._logger.info(`Closing incident ${options.sysId}`);

        const body: Record<string, string> = {
            state: '7',
            close_notes: options.closeNotes
        };

        if (options.closeCode) {
            body.close_code = options.closeCode;
        }

        const response: IHttpResponse<TaskRecordResponse> = await this._tableAPI.put<TaskRecordResponse>(
            'incident', options.sysId, body
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Successfully closed incident ${options.sysId}`);
            return response.bodyObject.result;
        }

        throw new Error(
            `Failed to close incident ${options.sysId}. Status: ${response?.status ?? 'unknown'}`
        );
    }

    /**
     * Approve a change request by setting its approval field to 'approved'.
     *
     * @param options The approval options including sys_id and optional comments
     * @returns The updated change request record
     * @throws Error if the API call fails
     */
    public async approveChange(options: ApproveChangeOptions): Promise<TaskRecord> {
        if (!options.sysId || options.sysId.trim().length === 0) {
            throw new Error('Change request sys_id is required');
        }

        this._logger.info(`Approving change request ${options.sysId}`);

        const body: Record<string, string> = {
            approval: 'approved'
        };

        if (options.comments) {
            body.comments = options.comments;
        }

        const response: IHttpResponse<TaskRecordResponse> = await this._tableAPI.put<TaskRecordResponse>(
            'change_request', options.sysId, body
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Successfully approved change request ${options.sysId}`);
            return response.bodyObject.result;
        }

        throw new Error(
            `Failed to approve change request ${options.sysId}. Status: ${response?.status ?? 'unknown'}`
        );
    }

    /**
     * Find a task record by its number field (e.g., "INC0010001").
     *
     * @param table The table to search in
     * @param number The task number to find
     * @returns The matching TaskRecord, or null if not found
     * @throws Error if the API call fails
     */
    public async findByNumber(table: string, number: string): Promise<TaskRecord | null> {
        if (!table || table.trim().length === 0) {
            throw new Error('Table name is required');
        }
        if (!number || number.trim().length === 0) {
            throw new Error('Task number is required');
        }

        this._logger.info(`Finding ${table} record with number=${number}`);

        const query: Record<string, string | number> = {
            sysparm_query: `number=${number}`,
            sysparm_limit: 1
        };

        const response: IHttpResponse<TaskRecordListResponse> = await this._tableAPI.get<TaskRecordListResponse>(
            table, query
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            const results = response.bodyObject.result;
            if (results.length > 0) {
                this._logger.info(`Found ${table} record: ${results[0].sys_id}`);
                return results[0];
            }
            this._logger.info(`No ${table} record found with number=${number}`);
            return null;
        }

        throw new Error(
            `Failed to query ${table} for number=${number}. Status: ${response?.status ?? 'unknown'}`
        );
    }
}

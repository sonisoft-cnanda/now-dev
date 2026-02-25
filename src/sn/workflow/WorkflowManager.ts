import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import {
    CreateWorkflowOptions,
    CreateWorkflowResult,
    CreateWorkflowVersionOptions,
    CreateWorkflowVersionResult,
    CreateActivityOptions,
    CreateActivityResult,
    CreateTransitionOptions,
    CreateTransitionResult,
    CreateConditionOptions,
    CreateConditionResult,
    PublishWorkflowOptions,
    CompleteWorkflowSpec,
    CompleteWorkflowResult,
    WorkflowRecordResponse
} from './WorkflowModels';

/**
 * Manages ServiceNow workflow lifecycle operations including creating workflows,
 * versions, activities, transitions, conditions, and publishing.
 * Also provides a high-level orchestration method to create a complete workflow
 * from a single specification.
 */
export class WorkflowManager {
    private static readonly WF_WORKFLOW = 'wf_workflow';
    private static readonly WF_WORKFLOW_VERSION = 'wf_workflow_version';
    private static readonly WF_ACTIVITY = 'wf_activity';
    private static readonly WF_TRANSITION = 'wf_transition';
    private static readonly WF_CONDITION = 'wf_condition';

    private _logger: Logger = new Logger("WorkflowManager");
    private _req: ServiceNowRequest;
    private _tableAPI: TableAPIRequest;
    private _instance: ServiceNowInstance;

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
        this._tableAPI = new TableAPIRequest(instance);
    }

    /**
     * Create a new workflow record.
     *
     * @param options Workflow creation options
     * @returns The sys_id and name of the created workflow
     * @throws Error if the API call fails
     */
    public async createWorkflow(options: CreateWorkflowOptions): Promise<CreateWorkflowResult> {
        if (!options.name || options.name.trim().length === 0) {
            throw new Error('Workflow name is required');
        }

        this._logger.info(`Creating workflow: ${options.name}`);

        const body: Record<string, unknown> = {
            name: options.name
        };

        if (options.description !== undefined) {
            body.description = options.description;
        }
        if (options.template !== undefined) {
            body.template = options.template;
        }
        if (options.access !== undefined) {
            body.access = options.access;
        }

        const response: IHttpResponse<WorkflowRecordResponse> = await this._tableAPI.post<WorkflowRecordResponse>(
            WorkflowManager.WF_WORKFLOW, {}, body
        );

        if (response && (response.status === 200 || response.status === 201) && response.bodyObject?.result?.sys_id) {
            const result = response.bodyObject.result;
            this._logger.info(`Created workflow '${options.name}' with sys_id=${result.sys_id}`);
            return {
                workflowSysId: result.sys_id,
                name: (result.name as string) || options.name
            };
        }

        throw new Error(`Failed to create workflow '${options.name}'. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Create a new workflow version.
     *
     * @param options Workflow version creation options
     * @returns The sys_id and name of the created version
     * @throws Error if the API call fails
     */
    public async createWorkflowVersion(options: CreateWorkflowVersionOptions): Promise<CreateWorkflowVersionResult> {
        if (!options.name || options.name.trim().length === 0) {
            throw new Error('Workflow version name is required');
        }
        if (!options.workflowSysId || options.workflowSysId.trim().length === 0) {
            throw new Error('Workflow sys_id is required');
        }
        if (!options.table || options.table.trim().length === 0) {
            throw new Error('Table name is required');
        }

        this._logger.info(`Creating workflow version: ${options.name} for workflow ${options.workflowSysId}`);

        const body: Record<string, unknown> = {
            name: options.name,
            workflow: options.workflowSysId,
            table: options.table
        };

        if (options.description !== undefined) {
            body.description = options.description;
        }
        if (options.active !== undefined) {
            body.active = options.active;
        }
        if (options.published !== undefined) {
            body.published = options.published;
        }
        if (options.condition !== undefined) {
            body.condition = options.condition;
        }
        if (options.order !== undefined) {
            body.order = options.order;
        }

        const response: IHttpResponse<WorkflowRecordResponse> = await this._tableAPI.post<WorkflowRecordResponse>(
            WorkflowManager.WF_WORKFLOW_VERSION, {}, body
        );

        if (response && (response.status === 200 || response.status === 201) && response.bodyObject?.result?.sys_id) {
            const result = response.bodyObject.result;
            this._logger.info(`Created workflow version '${options.name}' with sys_id=${result.sys_id}`);
            return {
                versionSysId: result.sys_id,
                name: (result.name as string) || options.name
            };
        }

        throw new Error(`Failed to create workflow version '${options.name}'. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Create a new workflow activity.
     *
     * @param options Activity creation options
     * @returns The sys_id and name of the created activity
     * @throws Error if the API call fails
     */
    public async createActivity(options: CreateActivityOptions): Promise<CreateActivityResult> {
        if (!options.name || options.name.trim().length === 0) {
            throw new Error('Activity name is required');
        }
        if (!options.workflowVersionSysId || options.workflowVersionSysId.trim().length === 0) {
            throw new Error('Workflow version sys_id is required');
        }

        this._logger.info(`Creating activity: ${options.name} for version ${options.workflowVersionSysId}`);

        const body: Record<string, unknown> = {
            name: options.name,
            workflow_version: options.workflowVersionSysId
        };

        if (options.activityDefinitionSysId !== undefined) {
            body.activity_definition = options.activityDefinitionSysId;
        }
        if (options.x !== undefined) {
            body.x = options.x;
        }
        if (options.y !== undefined) {
            body.y = options.y;
        }
        if (options.width !== undefined) {
            body.width = options.width;
        }
        if (options.height !== undefined) {
            body.height = options.height;
        }
        if (options.script !== undefined) {
            body.script = options.script;
        }
        if (options.vars !== undefined) {
            body.vars = options.vars;
        }

        const response: IHttpResponse<WorkflowRecordResponse> = await this._tableAPI.post<WorkflowRecordResponse>(
            WorkflowManager.WF_ACTIVITY, {}, body
        );

        if (response && (response.status === 200 || response.status === 201) && response.bodyObject?.result?.sys_id) {
            const result = response.bodyObject.result;
            this._logger.info(`Created activity '${options.name}' with sys_id=${result.sys_id}`);
            return {
                activitySysId: result.sys_id,
                name: (result.name as string) || options.name
            };
        }

        throw new Error(`Failed to create activity '${options.name}'. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Create a transition between two activities.
     *
     * @param options Transition creation options
     * @returns The sys_id of the created transition
     * @throws Error if the API call fails
     */
    public async createTransition(options: CreateTransitionOptions): Promise<CreateTransitionResult> {
        if (!options.fromActivitySysId || options.fromActivitySysId.trim().length === 0) {
            throw new Error('From activity sys_id is required');
        }
        if (!options.toActivitySysId || options.toActivitySysId.trim().length === 0) {
            throw new Error('To activity sys_id is required');
        }

        this._logger.info(`Creating transition: ${options.fromActivitySysId} -> ${options.toActivitySysId}`);

        const body: Record<string, unknown> = {
            from: options.fromActivitySysId,
            to: options.toActivitySysId
        };

        if (options.conditionSysId !== undefined) {
            body.condition = options.conditionSysId;
        }
        if (options.order !== undefined) {
            body.order = options.order;
        }

        const response: IHttpResponse<WorkflowRecordResponse> = await this._tableAPI.post<WorkflowRecordResponse>(
            WorkflowManager.WF_TRANSITION, {}, body
        );

        if (response && (response.status === 200 || response.status === 201) && response.bodyObject?.result?.sys_id) {
            const result = response.bodyObject.result;
            this._logger.info(`Created transition with sys_id=${result.sys_id}`);
            return {
                transitionSysId: result.sys_id
            };
        }

        throw new Error(
            `Failed to create transition from '${options.fromActivitySysId}' to '${options.toActivitySysId}'. Status: ${response?.status ?? 'unknown'}`
        );
    }

    /**
     * Create a condition on an activity.
     *
     * @param options Condition creation options
     * @returns The sys_id and name of the created condition
     * @throws Error if the API call fails
     */
    public async createCondition(options: CreateConditionOptions): Promise<CreateConditionResult> {
        if (!options.activitySysId || options.activitySysId.trim().length === 0) {
            throw new Error('Activity sys_id is required');
        }
        if (!options.name || options.name.trim().length === 0) {
            throw new Error('Condition name is required');
        }

        this._logger.info(`Creating condition: ${options.name} on activity ${options.activitySysId}`);

        const body: Record<string, unknown> = {
            activity: options.activitySysId,
            name: options.name
        };

        if (options.description !== undefined) {
            body.description = options.description;
        }
        if (options.condition !== undefined) {
            body.condition = options.condition;
        }
        if (options.order !== undefined) {
            body.order = options.order;
        }
        if (options.elseFlag !== undefined) {
            body.else_flag = options.elseFlag;
        }

        const response: IHttpResponse<WorkflowRecordResponse> = await this._tableAPI.post<WorkflowRecordResponse>(
            WorkflowManager.WF_CONDITION, {}, body
        );

        if (response && (response.status === 200 || response.status === 201) && response.bodyObject?.result?.sys_id) {
            const result = response.bodyObject.result;
            this._logger.info(`Created condition '${options.name}' with sys_id=${result.sys_id}`);
            return {
                conditionSysId: result.sys_id,
                name: (result.name as string) || options.name
            };
        }

        throw new Error(`Failed to create condition '${options.name}'. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Publish a workflow version by setting published=true and the start activity.
     *
     * @param options Publish options including version sys_id and start activity sys_id
     * @throws Error if the API call fails
     */
    public async publishWorkflow(options: PublishWorkflowOptions): Promise<void> {
        if (!options.versionSysId || options.versionSysId.trim().length === 0) {
            throw new Error('Workflow version sys_id is required');
        }
        if (!options.startActivitySysId || options.startActivitySysId.trim().length === 0) {
            throw new Error('Start activity sys_id is required');
        }

        this._logger.info(`Publishing workflow version ${options.versionSysId} with start activity ${options.startActivitySysId}`);

        const body: Record<string, unknown> = {
            published: true,
            start: options.startActivitySysId
        };

        const response: IHttpResponse<WorkflowRecordResponse> = await this._tableAPI.put<WorkflowRecordResponse>(
            WorkflowManager.WF_WORKFLOW_VERSION, options.versionSysId, body
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Successfully published workflow version ${options.versionSysId}`);
            return;
        }

        throw new Error(`Failed to publish workflow version ${options.versionSysId}. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Create a complete workflow from a single specification.
     * Orchestrates: create workflow -> create version -> create activities ->
     * create transitions -> optionally publish.
     *
     * Activity references in transitions use the activity's id field (if set) or
     * its index in the activities array (as a string like "0", "1", etc.).
     *
     * @param spec The complete workflow specification
     * @param onProgress Optional progress callback
     * @returns The complete result including all created sys_ids
     * @throws Error if any step fails
     */
    public async createCompleteWorkflow(
        spec: CompleteWorkflowSpec,
        onProgress?: (message: string) => void
    ): Promise<CompleteWorkflowResult> {
        if (!spec.name || spec.name.trim().length === 0) {
            throw new Error('Workflow name is required');
        }
        if (!spec.activities || spec.activities.length === 0) {
            throw new Error('At least one activity is required');
        }

        this._logger.info(`Creating complete workflow: ${spec.name}`);

        // Step 1: Create workflow
        if (onProgress) {
            onProgress(`Creating workflow '${spec.name}'`);
        }

        const workflowResult = await this.createWorkflow({
            name: spec.name,
            description: spec.description,
            template: spec.template,
            access: spec.access
        });

        // Step 2: Create workflow version
        if (onProgress) {
            onProgress(`Creating workflow version for '${spec.name}'`);
        }

        const versionResult = await this.createWorkflowVersion({
            name: spec.name,
            workflowSysId: workflowResult.workflowSysId,
            table: spec.table,
            description: spec.description,
            active: spec.active,
            condition: spec.condition
        });

        // Step 3: Create activities
        const activitySysIds: Record<string, string> = {};

        for (let i = 0; i < spec.activities.length; i++) {
            const activitySpec = spec.activities[i];

            if (onProgress) {
                onProgress(`Creating activity ${i + 1}/${spec.activities.length}: '${activitySpec.name}'`);
            }

            const activityResult = await this.createActivity({
                name: activitySpec.name,
                workflowVersionSysId: versionResult.versionSysId,
                activityDefinitionSysId: activitySpec.activityType,
                x: activitySpec.x,
                y: activitySpec.y,
                width: activitySpec.width,
                height: activitySpec.height,
                script: activitySpec.script,
                vars: activitySpec.vars
            });

            // Store by id if provided, and always by index
            if (activitySpec.id) {
                activitySysIds[activitySpec.id] = activityResult.activitySysId;
            }
            activitySysIds[String(i)] = activityResult.activitySysId;
        }

        // Step 4: Create transitions
        const transitionSysIds: string[] = [];

        if (spec.transitions && spec.transitions.length > 0) {
            for (let i = 0; i < spec.transitions.length; i++) {
                const transitionSpec = spec.transitions[i];

                if (onProgress) {
                    onProgress(`Creating transition ${i + 1}/${spec.transitions.length}: '${transitionSpec.from}' -> '${transitionSpec.to}'`);
                }

                const fromSysId = activitySysIds[transitionSpec.from];
                const toSysId = activitySysIds[transitionSpec.to];

                if (!fromSysId) {
                    throw new Error(`Transition 'from' activity '${transitionSpec.from}' not found in activity map`);
                }
                if (!toSysId) {
                    throw new Error(`Transition 'to' activity '${transitionSpec.to}' not found in activity map`);
                }

                const transitionResult = await this.createTransition({
                    fromActivitySysId: fromSysId,
                    toActivitySysId: toSysId,
                    conditionSysId: transitionSpec.conditionSysId,
                    order: transitionSpec.order
                });

                transitionSysIds.push(transitionResult.transitionSysId);
            }
        }

        // Step 5: Publish if requested
        let published = false;
        let startActivityKey: string | undefined;

        if (spec.publish) {
            if (!spec.startActivity) {
                throw new Error('startActivity is required when publish=true');
            }

            const startSysId = activitySysIds[spec.startActivity];
            if (!startSysId) {
                throw new Error(`Start activity '${spec.startActivity}' not found in activity map`);
            }

            if (onProgress) {
                onProgress(`Publishing workflow '${spec.name}'`);
            }

            await this.publishWorkflow({
                versionSysId: versionResult.versionSysId,
                startActivitySysId: startSysId
            });

            published = true;
            startActivityKey = spec.startActivity;
        }

        if (onProgress) {
            onProgress(`Complete workflow '${spec.name}' created successfully`);
        }

        return {
            workflowSysId: workflowResult.workflowSysId,
            versionSysId: versionResult.versionSysId,
            activitySysIds,
            transitionSysIds,
            published,
            startActivity: startActivityKey
        };
    }
}

import { ServiceNowInstance } from "../ServiceNowInstance";
import { BackgroundScriptExecutor, BackgroundScriptExecutionResult } from "../BackgroundScriptExecutor";
import { Logger } from "../../util/Logger";
import {
    ExecuteFlowOptions,
    ExecuteFlowByNameOptions,
    ExecuteSubflowOptions,
    ExecuteActionOptions,
    FlowExecutionResult,
    FlowObjectType,
    FlowScriptResultEnvelope,
    FlowContextStatusResult,
    FlowOutputsResult,
    FlowErrorResult,
    FlowCancelResult,
    FlowSendMessageResult,
    FlowLifecycleEnvelope
} from './FlowModels';

const RESULT_MARKER = '___FLOW_EXEC_RESULT___';
const VALID_TYPES: FlowObjectType[] = ['flow', 'subflow', 'action'];

/**
 * Provides operations for executing ServiceNow Flow Designer flows,
 * subflows, and actions remotely via BackgroundScriptExecutor.
 *
 * Uses the sn_fd.FlowAPI.getRunner() (ScriptableFlowRunner) API
 * on the server side to execute and capture results.
 */
export class FlowManager {
    private _logger: Logger = new Logger("FlowManager");
    private _bgExecutor: BackgroundScriptExecutor;
    private _instance: ServiceNowInstance;
    private _defaultScope: string;

    /**
     * @param instance ServiceNow instance connection
     * @param scope Default scope for script execution (default: "global")
     */
    public constructor(instance: ServiceNowInstance, scope: string = 'global') {
        this._instance = instance;
        this._defaultScope = scope;
        this._bgExecutor = new BackgroundScriptExecutor(instance, scope);
    }

    // ================================================================
    // Public API
    // ================================================================

    /** Execute any flow object (flow, subflow, or action). */
    public async execute(options: ExecuteFlowOptions): Promise<FlowExecutionResult> {
        if (!options.scopedName || options.scopedName.trim().length === 0) {
            throw new Error('Flow scoped name is required (e.g. "global.my_flow")');
        }
        if (!options.type) {
            throw new Error('Flow object type is required ("flow", "subflow", or "action")');
        }
        if (!VALID_TYPES.includes(options.type)) {
            throw new Error(`Invalid flow object type "${options.type}". Must be one of: ${VALID_TYPES.join(', ')}`);
        }

        this._logger.info(`Executing ${options.type}: ${options.scopedName}`);

        const script = this._buildFlowScript(options);
        const scope = options.scope || this._defaultScope;

        try {
            const bgResult = await this._bgExecutor.executeScript(script, scope, this._instance);
            const flowResult = this._parseFlowResult(bgResult, options);

            this._logger.info(`${options.type} execution complete: ${flowResult.success ? 'SUCCESS' : 'FAILED'}`);
            return flowResult;
        } catch (error) {
            const err = error as Error;
            this._logger.error(`Error executing ${options.type} "${options.scopedName}": ${err.message}`);
            return {
                success: false,
                flowObjectName: options.scopedName,
                flowObjectType: options.type,
                errorMessage: `Script execution error: ${err.message}`,
                rawScriptResult: null
            };
        }
    }

    /** Execute a flow by scoped name. */
    public async executeFlow(options: ExecuteFlowByNameOptions): Promise<FlowExecutionResult> {
        return this.execute({ ...options, type: 'flow' });
    }

    /** Execute a subflow by scoped name. */
    public async executeSubflow(options: ExecuteSubflowOptions): Promise<FlowExecutionResult> {
        return this.execute({ ...options, type: 'subflow' });
    }

    /** Execute an action by scoped name. */
    public async executeAction(options: ExecuteActionOptions): Promise<FlowExecutionResult> {
        return this.execute({ ...options, type: 'action' });
    }

    // ================================================================
    // Flow Context Lifecycle API
    // ================================================================

    /** Query the status of a flow context by its sys_id. */
    public async getFlowContextStatus(contextId: string): Promise<FlowContextStatusResult> {
        this._validateContextId(contextId);
        this._logger.info(`Getting context status: ${contextId}`);

        const script = this._buildContextStatusScript(contextId);
        try {
            const bgResult = await this._bgExecutor.executeScript(script, this._defaultScope, this._instance);
            const envelope = this._extractResultEnvelope(bgResult) as unknown as FlowLifecycleEnvelope | null;

            if (envelope) {
                return {
                    success: envelope.success,
                    contextId,
                    found: envelope.found ?? false,
                    state: envelope.state ?? undefined,
                    name: envelope.name ?? undefined,
                    started: envelope.started ?? undefined,
                    ended: envelope.ended ?? undefined,
                    errorMessage: envelope.errorMessage ?? undefined,
                    rawScriptResult: bgResult
                };
            }

            return {
                success: false, contextId, found: false,
                errorMessage: 'Could not parse context status result from script output.',
                rawScriptResult: bgResult
            };
        } catch (error) {
            const err = error as Error;
            return {
                success: false, contextId, found: false,
                errorMessage: `Script execution error: ${err.message}`,
                rawScriptResult: null
            };
        }
    }

    /** Retrieve outputs from a completed flow/subflow/action by context ID. */
    public async getFlowOutputs(contextId: string): Promise<FlowOutputsResult> {
        this._validateContextId(contextId);
        this._logger.info(`Getting outputs for context: ${contextId}`);

        const script = this._buildGetOutputsScript(contextId);
        try {
            const bgResult = await this._bgExecutor.executeScript(script, this._defaultScope, this._instance);
            const envelope = this._extractResultEnvelope(bgResult) as unknown as FlowLifecycleEnvelope | null;

            if (envelope) {
                return {
                    success: envelope.success,
                    contextId,
                    outputs: envelope.outputs ?? undefined,
                    errorMessage: envelope.errorMessage ?? undefined,
                    rawScriptResult: bgResult
                };
            }

            return {
                success: false, contextId,
                errorMessage: 'Could not parse outputs result from script output.',
                rawScriptResult: bgResult
            };
        } catch (error) {
            const err = error as Error;
            return {
                success: false, contextId,
                errorMessage: `Script execution error: ${err.message}`,
                rawScriptResult: null
            };
        }
    }

    /** Retrieve error messages from a flow/subflow/action by context ID. */
    public async getFlowError(contextId: string): Promise<FlowErrorResult> {
        this._validateContextId(contextId);
        this._logger.info(`Getting error for context: ${contextId}`);

        const script = this._buildGetErrorScript(contextId);
        try {
            const bgResult = await this._bgExecutor.executeScript(script, this._defaultScope, this._instance);
            const envelope = this._extractResultEnvelope(bgResult) as unknown as FlowLifecycleEnvelope | null;

            if (envelope) {
                return {
                    success: envelope.success,
                    contextId,
                    flowErrorMessage: envelope.flowErrorMessage ?? undefined,
                    errorMessage: envelope.errorMessage ?? undefined,
                    rawScriptResult: bgResult
                };
            }

            return {
                success: false, contextId,
                errorMessage: 'Could not parse error result from script output.',
                rawScriptResult: bgResult
            };
        } catch (error) {
            const err = error as Error;
            return {
                success: false, contextId,
                errorMessage: `Script execution error: ${err.message}`,
                rawScriptResult: null
            };
        }
    }

    /** Cancel a running or paused flow/subflow/action. */
    public async cancelFlow(contextId: string, reason?: string): Promise<FlowCancelResult> {
        this._validateContextId(contextId);
        this._logger.info(`Cancelling context: ${contextId}`);

        const script = this._buildCancelScript(contextId, reason || 'Cancelled via FlowManager');
        try {
            const bgResult = await this._bgExecutor.executeScript(script, this._defaultScope, this._instance);
            const envelope = this._extractResultEnvelope(bgResult) as unknown as FlowLifecycleEnvelope | null;

            if (envelope) {
                return {
                    success: envelope.success,
                    contextId,
                    errorMessage: envelope.errorMessage ?? undefined,
                    rawScriptResult: bgResult
                };
            }

            return {
                success: false, contextId,
                errorMessage: 'Could not parse cancel result from script output.',
                rawScriptResult: bgResult
            };
        } catch (error) {
            const err = error as Error;
            return {
                success: false, contextId,
                errorMessage: `Script execution error: ${err.message}`,
                rawScriptResult: null
            };
        }
    }

    /** Send a message to a paused flow to resume it (for Wait for Message actions). */
    public async sendFlowMessage(contextId: string, message: string, payload?: string): Promise<FlowSendMessageResult> {
        this._validateContextId(contextId);
        if (!message || message.trim().length === 0) {
            throw new Error('Message is required');
        }
        this._logger.info(`Sending message to context: ${contextId}`);

        const script = this._buildSendMessageScript(contextId, message, payload || '');
        try {
            const bgResult = await this._bgExecutor.executeScript(script, this._defaultScope, this._instance);
            const envelope = this._extractResultEnvelope(bgResult) as unknown as FlowLifecycleEnvelope | null;

            if (envelope) {
                return {
                    success: envelope.success,
                    contextId,
                    errorMessage: envelope.errorMessage ?? undefined,
                    rawScriptResult: bgResult
                };
            }

            return {
                success: false, contextId,
                errorMessage: 'Could not parse send message result from script output.',
                rawScriptResult: bgResult
            };
        } catch (error) {
            const err = error as Error;
            return {
                success: false, contextId,
                errorMessage: `Script execution error: ${err.message}`,
                rawScriptResult: null
            };
        }
    }

    // ================================================================
    // Internal Methods
    // ================================================================

    /** Build the ServiceNow server-side script string. */
    _buildFlowScript(options: ExecuteFlowOptions): string {
        const mode = options.mode || 'foreground';
        const modeMethod = mode === 'background' ? 'inBackground' : 'inForeground';
        const inputsJson = options.inputs ? this._serializeInputs(options.inputs) : '{}';
        const scopedName = options.scopedName.replace(/'/g, "\\'");
        const type = options.type;

        let optionalChain = '';
        if (options.timeout !== undefined && options.timeout !== null) {
            optionalChain += `\n            .timeout(${options.timeout})`;
        }
        if (options.quick === true) {
            optionalChain += `\n            .quick()`;
        }

        const hasInputs = options.inputs && Object.keys(options.inputs).length > 0;
        const inputsChain = hasInputs ? `\n            .withInputs(inputs)` : '';

        return `(function() {
    var __RESULT_MARKER = '${RESULT_MARKER}';
    try {
        var inputs = ${inputsJson};

        var result = sn_fd.FlowAPI.getRunner()
            .${type}('${scopedName}')
            .${modeMethod}()${optionalChain}${inputsChain}
            .run();

        var envelope = {
            __flowResult: true,
            success: true,
            flowObjectName: '' + result.getFlowObjectName(),
            flowObjectType: '' + result.getFlowObjectType(),
            contextId: result.getContextId() ? '' + result.getContextId() : null,
            executionDate: result.getDate() ? '' + result.getDate() : null,
            domainId: result.getDomainId() ? '' + result.getDomainId() : null,
            outputs: null,
            debugOutput: '' + result.debug(),
            errorMessage: null
        };

        try {
            var rawOutputs = result.getOutputs();
            if (rawOutputs) {
                var outputObj = {};
                for (var key in rawOutputs) {
                    if (rawOutputs.hasOwnProperty(key)) {
                        outputObj[key] = '' + rawOutputs[key];
                    }
                }
                envelope.outputs = outputObj;
            }
        } catch (outErr) {
            envelope.outputs = null;
        }

        gs.info(__RESULT_MARKER + JSON.stringify(envelope));
    } catch (ex) {
        var errorEnvelope = {
            __flowResult: true,
            success: false,
            flowObjectName: '${scopedName}',
            flowObjectType: '${type}',
            contextId: null,
            executionDate: null,
            domainId: null,
            outputs: null,
            debugOutput: '',
            errorMessage: '' + (ex.getMessage ? ex.getMessage() : ex)
        };
        gs.info(__RESULT_MARKER + JSON.stringify(errorEnvelope));
    }
})();`;
    }

    /** Serialize inputs for embedding in the generated script. */
    _serializeInputs(inputs: Record<string, unknown>): string {
        const cleanInputs: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(inputs)) {
            if (value !== undefined) {
                cleanInputs[key] = value;
            }
        }
        return JSON.stringify(cleanInputs);
    }

    /**
     * Decode HTML entities and strip HTML tags from a string.
     * ServiceNow's background script output encodes quotes as &quot;
     * and appends <BR/> tags that must be removed before JSON parsing.
     */
    _decodeHtmlEntities(str: string): string {
        return str
            .replace(/<BR\s*\/?>/gi, '')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .trim();
    }

    /** Try to parse a line containing the result marker into a FlowScriptResultEnvelope. */
    private _tryParseEnvelopeFromLine(line: string): FlowScriptResultEnvelope | null {
        if (!line || !line.includes(RESULT_MARKER)) {
            return null;
        }
        const afterMarker = line.substring(line.indexOf(RESULT_MARKER) + RESULT_MARKER.length);
        const jsonStr = this._decodeHtmlEntities(afterMarker);
        try {
            const parsed = JSON.parse(jsonStr);
            if (parsed && parsed.__flowResult === true) {
                return parsed as FlowScriptResultEnvelope;
            }
        } catch {
            this._logger.warn(`Failed to parse flow result JSON: ${jsonStr.substring(0, 200)}`);
        }
        return null;
    }

    /** Extract the JSON envelope from script output lines. */
    _extractResultEnvelope(bgResult: BackgroundScriptExecutionResult): FlowScriptResultEnvelope | null {
        // Search through scriptResults for our marker line
        if (bgResult.scriptResults && bgResult.scriptResults.length > 0) {
            for (const outputLine of bgResult.scriptResults) {
                const envelope = this._tryParseEnvelopeFromLine(outputLine.line);
                if (envelope) return envelope;
            }
        }

        // Fallback: search through consoleResult string array
        if (bgResult.consoleResult && bgResult.consoleResult.length > 0) {
            for (const line of bgResult.consoleResult) {
                const envelope = this._tryParseEnvelopeFromLine(line);
                if (envelope) return envelope;
            }
        }

        return null;
    }

    /** Parse BackgroundScriptExecutionResult into FlowExecutionResult. */
    _parseFlowResult(bgResult: BackgroundScriptExecutionResult, options: ExecuteFlowOptions): FlowExecutionResult {
        const envelope = this._extractResultEnvelope(bgResult);

        if (envelope) {
            return {
                success: envelope.success,
                flowObjectName: envelope.flowObjectName || options.scopedName,
                flowObjectType: (envelope.flowObjectType as FlowObjectType) || options.type,
                contextId: envelope.contextId || undefined,
                executionDate: envelope.executionDate || undefined,
                domainId: envelope.domainId || undefined,
                outputs: envelope.outputs || undefined,
                debugOutput: envelope.debugOutput || undefined,
                errorMessage: envelope.errorMessage || undefined,
                rawScriptResult: bgResult
            };
        }

        this._logger.warn('Could not extract flow result envelope from script output');
        return {
            success: false,
            flowObjectName: options.scopedName,
            flowObjectType: options.type,
            errorMessage: 'Could not parse flow execution result from script output. ' +
                          'The script may have failed before producing output.',
            rawScriptResult: bgResult
        };
    }

    // ================================================================
    // Lifecycle Script Builders
    // ================================================================

    /** Validate that a context ID is non-empty. */
    private _validateContextId(contextId: string): void {
        if (!contextId || contextId.trim().length === 0) {
            throw new Error('Context ID is required');
        }
    }

    /** Escape a string for embedding in a generated SN script single-quoted string. */
    private _escapeForScript(str: string): string {
        return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    /** Build script to query sys_flow_context status. */
    _buildContextStatusScript(contextId: string): string {
        const escapedId = this._escapeForScript(contextId);
        return `(function() {
    var __RESULT_MARKER = '${RESULT_MARKER}';
    try {
        var gr = new GlideRecord('sys_flow_context');
        if (gr.get('${escapedId}')) {
            gs.info(__RESULT_MARKER + JSON.stringify({
                __flowResult: true,
                success: true,
                contextId: '${escapedId}',
                found: true,
                state: '' + gr.getValue('state'),
                name: '' + gr.getValue('name'),
                started: gr.getValue('started') ? '' + gr.getValue('started') : null,
                ended: gr.getValue('ended') ? '' + gr.getValue('ended') : null,
                errorMessage: null
            }));
        } else {
            gs.info(__RESULT_MARKER + JSON.stringify({
                __flowResult: true,
                success: true,
                contextId: '${escapedId}',
                found: false,
                state: null,
                name: null,
                started: null,
                ended: null,
                errorMessage: null
            }));
        }
    } catch (ex) {
        gs.info(__RESULT_MARKER + JSON.stringify({
            __flowResult: true,
            success: false,
            contextId: '${escapedId}',
            found: false,
            errorMessage: '' + (ex.getMessage ? ex.getMessage() : ex)
        }));
    }
})();`;
    }

    /** Build script to retrieve flow outputs via FlowAPI.getOutputs(). */
    _buildGetOutputsScript(contextId: string): string {
        const escapedId = this._escapeForScript(contextId);
        return `(function() {
    var __RESULT_MARKER = '${RESULT_MARKER}';
    try {
        var outputs = sn_fd.FlowAPI.getOutputs('${escapedId}');
        var outputObj = {};
        if (outputs) {
            for (var key in outputs) {
                if (outputs.hasOwnProperty(key)) {
                    outputObj[key] = '' + outputs[key];
                }
            }
        }
        gs.info(__RESULT_MARKER + JSON.stringify({
            __flowResult: true,
            success: true,
            contextId: '${escapedId}',
            outputs: outputObj,
            errorMessage: null
        }));
    } catch (ex) {
        gs.info(__RESULT_MARKER + JSON.stringify({
            __flowResult: true,
            success: false,
            contextId: '${escapedId}',
            outputs: null,
            errorMessage: '' + (ex.getMessage ? ex.getMessage() : ex)
        }));
    }
})();`;
    }

    /** Build script to retrieve flow error via FlowAPI.getErrorMessage(). */
    _buildGetErrorScript(contextId: string): string {
        const escapedId = this._escapeForScript(contextId);
        return `(function() {
    var __RESULT_MARKER = '${RESULT_MARKER}';
    try {
        var errorMsg = sn_fd.FlowAPI.getErrorMessage('${escapedId}');
        gs.info(__RESULT_MARKER + JSON.stringify({
            __flowResult: true,
            success: true,
            contextId: '${escapedId}',
            flowErrorMessage: errorMsg ? '' + errorMsg : null,
            errorMessage: null
        }));
    } catch (ex) {
        gs.info(__RESULT_MARKER + JSON.stringify({
            __flowResult: true,
            success: false,
            contextId: '${escapedId}',
            flowErrorMessage: null,
            errorMessage: '' + (ex.getMessage ? ex.getMessage() : ex)
        }));
    }
})();`;
    }

    /** Build script to cancel a flow via FlowAPI.cancel(). */
    _buildCancelScript(contextId: string, reason: string): string {
        const escapedId = this._escapeForScript(contextId);
        const escapedReason = this._escapeForScript(reason);
        return `(function() {
    var __RESULT_MARKER = '${RESULT_MARKER}';
    try {
        sn_fd.FlowAPI.cancel('${escapedId}', '${escapedReason}');
        gs.info(__RESULT_MARKER + JSON.stringify({
            __flowResult: true,
            success: true,
            contextId: '${escapedId}',
            errorMessage: null
        }));
    } catch (ex) {
        gs.info(__RESULT_MARKER + JSON.stringify({
            __flowResult: true,
            success: false,
            contextId: '${escapedId}',
            errorMessage: '' + (ex.getMessage ? ex.getMessage() : ex)
        }));
    }
})();`;
    }

    /** Build script to send a message to a paused flow via FlowAPI.sendMessage(). */
    _buildSendMessageScript(contextId: string, message: string, payload: string): string {
        const escapedId = this._escapeForScript(contextId);
        const escapedMessage = this._escapeForScript(message);
        const escapedPayload = this._escapeForScript(payload);
        return `(function() {
    var __RESULT_MARKER = '${RESULT_MARKER}';
    try {
        sn_fd.FlowAPI.sendMessage('${escapedId}', '${escapedMessage}', '${escapedPayload}');
        gs.info(__RESULT_MARKER + JSON.stringify({
            __flowResult: true,
            success: true,
            contextId: '${escapedId}',
            errorMessage: null
        }));
    } catch (ex) {
        gs.info(__RESULT_MARKER + JSON.stringify({
            __flowResult: true,
            success: false,
            contextId: '${escapedId}',
            errorMessage: '' + (ex.getMessage ? ex.getMessage() : ex)
        }));
    }
})();`;
    }
}

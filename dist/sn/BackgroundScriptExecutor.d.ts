import { ServiceNowInstance } from "./ServiceNowInstance.js";
import { ServiceNowRequest } from "../comm/http/ServiceNowRequest.js";
import { Logger } from "../util/Logger.js";
export declare class BackgroundScriptExecutor {
    snRequest: ServiceNowRequest;
    instance: ServiceNowInstance;
    scope: string;
    _logger: Logger;
    constructor(instance: ServiceNowInstance, scope: string);
    executeScript(script: string, scope?: string, instance?: ServiceNowInstance): Promise<BackgroundScriptExecutionResult>;
    parseScriptResult(responseXML: string): BackgroundScriptExecutionResult;
    getBackgroundScriptCSRFToken(): Promise<string>;
    private _parseBGScriptResult;
    private _parseAffectedRecords;
}
export type CompositeScriptExecutionResult = {
    consoleResult: string[];
    rawResult: string;
    scriptResults: ScriptExecutionOutputLine[];
};
export type BackgroundScriptExecutionResult = {
    raw: string;
    result: string;
    affectedRecords: string;
    consoleResult: string[];
    rawResult: string;
    scriptResults: ScriptExecutionOutputLine[];
};
export declare class ScriptExecutionOutputLine {
    private _line;
    private _isDebug;
    private _isSystem;
    private _isScript;
    constructor(line: string);
    get line(): string;
    set line(val: string);
    asDebugLine(isDebugLine?: boolean): ScriptExecutionOutputLine;
    asSystemLine(isSystemLine?: boolean): ScriptExecutionOutputLine;
    asScriptLine(isScriptLine?: boolean): ScriptExecutionOutputLine;
}
export interface BackgroundScriptExecutorOptions {
    instance?: ServiceNowInstance;
    scope?: string;
}

/**
 * Unit tests for FlowManager
 * Tests script generation, result parsing, and execution flow with mocked dependencies
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { createGetCredentialsMock, MockAuthenticationHandler } from '../../__mocks__/servicenow-sdk-mocks';
import { FlowManager } from '../../../../src/sn/flow/FlowManager';
import { BackgroundScriptExecutionResult, ScriptExecutionOutputLine } from '../../../../src/sn/BackgroundScriptExecutor';
import { AuthenticationHandlerFactory } from '../../../../src/auth/AuthenticationHandlerFactory';
import { RequestHandlerFactory } from '../../../../src/comm/http/RequestHandlerFactory';
import { ExecuteFlowOptions, FlowScriptResultEnvelope, FlowLifecycleEnvelope } from '../../../../src/sn/flow/FlowModels';

// Mock getCredentials
const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

// Mock factories
jest.mock('../../../../src/auth/AuthenticationHandlerFactory');
jest.mock('../../../../src/comm/http/RequestHandlerFactory');

// Mock request handler for BGS's internal HTTP calls
class MockRequestHandler {
    get = jest.fn<() => Promise<any>>();
    post = jest.fn<() => Promise<any>>();
    put = jest.fn<() => Promise<any>>();
    delete = jest.fn<() => Promise<any>>();
}

const RESULT_MARKER = '___FLOW_EXEC_RESULT___';

function createSuccessEnvelope(overrides: Partial<FlowScriptResultEnvelope> = {}): FlowScriptResultEnvelope {
    return {
        __flowResult: true,
        success: true,
        flowObjectName: 'global.test_flow',
        flowObjectType: 'flow',
        contextId: 'abc123def456789012345678901234ab',
        executionDate: '2024-06-12 17:54:58',
        domainId: null,
        outputs: { result_key: 'result_value' },
        debugOutput: 'FlowRunnerResult\nFlow Object Name: global.test_flow\nFlow Object Type: flow',
        errorMessage: null,
        ...overrides
    };
}

function createErrorEnvelope(errorMessage: string): FlowScriptResultEnvelope {
    return {
        __flowResult: true,
        success: false,
        flowObjectName: 'global.test_flow',
        flowObjectType: 'flow',
        contextId: null,
        executionDate: null,
        domainId: null,
        outputs: null,
        debugOutput: '',
        errorMessage
    };
}

function createBGResult(envelope: FlowScriptResultEnvelope | null, extraLines: string[] = []): BackgroundScriptExecutionResult {
    const scriptResults: ScriptExecutionOutputLine[] = [];

    for (const line of extraLines) {
        scriptResults.push(new ScriptExecutionOutputLine(line).asScriptLine());
    }

    if (envelope) {
        const markerLine = RESULT_MARKER + JSON.stringify(envelope);
        scriptResults.push(new ScriptExecutionOutputLine(markerLine).asScriptLine());
    }

    const consoleResult = scriptResults.map(sr => sr.line);

    return {
        raw: '<html><body><pre>mock</pre></body></html>',
        result: 'mock result',
        affectedRecords: '',
        consoleResult,
        rawResult: consoleResult.join('\n'),
        scriptResults
    };
}

describe('FlowManager - Unit Tests', () => {
    let instance: ServiceNowInstance;
    let flowMgr: FlowManager;
    let mockAuthHandler: MockAuthenticationHandler;
    let mockRequestHandler: MockRequestHandler;

    beforeEach(async () => {
        jest.clearAllMocks();

        mockAuthHandler = new MockAuthenticationHandler();
        mockRequestHandler = new MockRequestHandler();

        jest.spyOn(AuthenticationHandlerFactory, 'createAuthHandler')
            .mockReturnValue(mockAuthHandler as unknown as ReturnType<typeof AuthenticationHandlerFactory.createAuthHandler>);
        jest.spyOn(RequestHandlerFactory, 'createRequestHandler')
            .mockReturnValue(mockRequestHandler as unknown as ReturnType<typeof RequestHandlerFactory.createRequestHandler>);

        const alias = 'test-instance';
        const credential = await mockGetCredentials(alias);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: alias,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            flowMgr = new FlowManager(instance);
        }
    });

    // ================================================================
    // Constructor
    // ================================================================

    describe('Constructor', () => {
        it('should create instance with ServiceNow instance', () => {
            expect(flowMgr).toBeInstanceOf(FlowManager);
            expect((flowMgr as any)._instance).toBe(instance);
        });

        it('should use default scope "global"', () => {
            expect((flowMgr as any)._defaultScope).toBe('global');
        });

        it('should accept custom scope', () => {
            const customMgr = new FlowManager(instance, 'x_myapp');
            expect((customMgr as any)._defaultScope).toBe('x_myapp');
        });

        it('should initialize BackgroundScriptExecutor', () => {
            expect((flowMgr as any)._bgExecutor).toBeDefined();
        });

        it('should initialize logger', () => {
            expect((flowMgr as any)._logger).toBeDefined();
        });
    });

    // ================================================================
    // _buildFlowScript
    // ================================================================

    describe('_buildFlowScript', () => {
        it('should generate script for flow execution in foreground', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.test_flow',
                type: 'flow'
            } as ExecuteFlowOptions);

            expect(script).toContain(".flow('global.test_flow')");
            expect(script).toContain('.inForeground()');
            expect(script).toContain('sn_fd.FlowAPI.getRunner()');
            expect(script).toContain('.run()');
            expect(script).toContain(RESULT_MARKER);
            expect(script).toContain('result.getFlowObjectName()');
            expect(script).toContain('result.getOutputs()');
            expect(script).toContain('result.debug()');
        });

        it('should generate script for subflow execution', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.my_subflow',
                type: 'subflow'
            } as ExecuteFlowOptions);

            expect(script).toContain(".subflow('global.my_subflow')");
            expect(script).toContain('.inForeground()');
        });

        it('should generate script for action execution', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.my_action',
                type: 'action'
            } as ExecuteFlowOptions);

            expect(script).toContain(".action('global.my_action')");
        });

        it('should use inBackground when mode is background', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.test_flow',
                type: 'flow',
                mode: 'background'
            } as ExecuteFlowOptions);

            expect(script).toContain('.inBackground()');
            expect(script).not.toContain('.inForeground()');
        });

        it('should include timeout when specified', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.test_flow',
                type: 'flow',
                timeout: 120000
            } as ExecuteFlowOptions);

            expect(script).toContain('.timeout(120000)');
        });

        it('should not include timeout when not specified', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.test_flow',
                type: 'flow'
            } as ExecuteFlowOptions);

            expect(script).not.toContain('.timeout(');
        });

        it('should include quick() when enabled', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.test_flow',
                type: 'flow',
                quick: true
            } as ExecuteFlowOptions);

            expect(script).toContain('.quick()');
        });

        it('should not include quick() when disabled', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.test_flow',
                type: 'flow',
                quick: false
            } as ExecuteFlowOptions);

            expect(script).not.toContain('.quick()');
        });

        it('should include withInputs when inputs provided', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.test_flow',
                type: 'flow',
                inputs: { table_name: 'incident', sys_id: 'abc123' }
            } as ExecuteFlowOptions);

            expect(script).toContain('.withInputs(inputs)');
            expect(script).toContain('"table_name":"incident"');
            expect(script).toContain('"sys_id":"abc123"');
        });

        it('should not include withInputs when inputs not provided', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.test_flow',
                type: 'flow'
            } as ExecuteFlowOptions);

            expect(script).not.toContain('.withInputs(inputs)');
        });

        it('should not include withInputs when inputs is empty', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.test_flow',
                type: 'flow',
                inputs: {}
            } as ExecuteFlowOptions);

            expect(script).not.toContain('.withInputs(inputs)');
        });

        it('should escape single quotes in scopedName', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: "global.test'flow",
                type: 'flow'
            } as ExecuteFlowOptions);

            expect(script).toContain(".flow('global.test\\'flow')");
        });

        it('should include both timeout and quick when both specified', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.test_flow',
                type: 'flow',
                timeout: 60000,
                quick: true
            } as ExecuteFlowOptions);

            expect(script).toContain('.timeout(60000)');
            expect(script).toContain('.quick()');
        });

        it('should include error handling with catch block', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.test_flow',
                type: 'flow'
            } as ExecuteFlowOptions);

            expect(script).toContain('catch (ex)');
            expect(script).toContain('ex.getMessage');
            expect(script).toContain('success: false');
        });

        it('should include output iteration with hasOwnProperty check', () => {
            const script = (flowMgr as any)._buildFlowScript({
                scopedName: 'global.test_flow',
                type: 'flow'
            } as ExecuteFlowOptions);

            expect(script).toContain('rawOutputs.hasOwnProperty(key)');
        });
    });

    // ================================================================
    // _serializeInputs
    // ================================================================

    describe('_serializeInputs', () => {
        it('should serialize simple string inputs', () => {
            const result = (flowMgr as any)._serializeInputs({ name: 'test' });
            expect(result).toBe('{"name":"test"}');
        });

        it('should serialize numeric inputs', () => {
            const result = (flowMgr as any)._serializeInputs({ count: 42 });
            expect(result).toBe('{"count":42}');
        });

        it('should serialize boolean inputs', () => {
            const result = (flowMgr as any)._serializeInputs({ active: true });
            expect(result).toBe('{"active":true}');
        });

        it('should handle null values', () => {
            const result = (flowMgr as any)._serializeInputs({ value: null });
            expect(result).toBe('{"value":null}');
        });

        it('should strip undefined values', () => {
            const result = (flowMgr as any)._serializeInputs({ a: 'keep', b: undefined });
            expect(result).toBe('{"a":"keep"}');
        });

        it('should handle nested objects', () => {
            const result = (flowMgr as any)._serializeInputs({
                config: { key: 'value', nested: { deep: true } }
            });
            const parsed = JSON.parse(result);
            expect(parsed.config.nested.deep).toBe(true);
        });

        it('should handle arrays', () => {
            const result = (flowMgr as any)._serializeInputs({ items: [1, 2, 3] });
            const parsed = JSON.parse(result);
            expect(parsed.items).toEqual([1, 2, 3]);
        });

        it('should escape special characters in strings', () => {
            const result = (flowMgr as any)._serializeInputs({ text: 'line1\nline2\ttab"quote' });
            expect(() => JSON.parse(result)).not.toThrow();
            const parsed = JSON.parse(result);
            expect(parsed.text).toBe('line1\nline2\ttab"quote');
        });

        it('should handle empty object', () => {
            const result = (flowMgr as any)._serializeInputs({});
            expect(result).toBe('{}');
        });
    });

    // ================================================================
    // _decodeHtmlEntities
    // ================================================================

    describe('_decodeHtmlEntities', () => {
        it('should decode &quot; to double quotes', () => {
            const result = (flowMgr as any)._decodeHtmlEntities('&quot;hello&quot;');
            expect(result).toBe('"hello"');
        });

        it('should strip <BR/> tags', () => {
            const result = (flowMgr as any)._decodeHtmlEntities('some text<BR/>');
            expect(result).toBe('some text');
        });

        it('should strip <br> tags case-insensitively', () => {
            const result = (flowMgr as any)._decodeHtmlEntities('text<br>more<BR />end');
            expect(result).toBe('textmoreend');
        });

        it('should decode &amp;, &lt;, &gt;', () => {
            const result = (flowMgr as any)._decodeHtmlEntities('a &amp; b &lt; c &gt; d');
            expect(result).toBe('a & b < c > d');
        });

        it('should decode a full HTML-encoded JSON string', () => {
            const encoded = '{&quot;__flowResult&quot;:true,&quot;success&quot;:true}<BR/>';
            const result = (flowMgr as any)._decodeHtmlEntities(encoded);
            expect(result).toBe('{"__flowResult":true,"success":true}');
            expect(() => JSON.parse(result)).not.toThrow();
        });
    });

    // ================================================================
    // _extractResultEnvelope
    // ================================================================

    describe('_extractResultEnvelope', () => {
        it('should extract envelope from HTML-encoded scriptResults', () => {
            // Simulate what ServiceNow actually returns
            const encoded = RESULT_MARKER + '{&quot;__flowResult&quot;:true,&quot;success&quot;:true,&quot;flowObjectName&quot;:&quot;global.test_flow&quot;,&quot;flowObjectType&quot;:&quot;flow&quot;,&quot;contextId&quot;:null,&quot;executionDate&quot;:null,&quot;domainId&quot;:null,&quot;outputs&quot;:null,&quot;debugOutput&quot;:&quot;&quot;,&quot;errorMessage&quot;:null}<BR/>';
            const scriptResults = [new ScriptExecutionOutputLine(encoded).asScriptLine()];
            const bgResult: BackgroundScriptExecutionResult = {
                raw: '', result: '', affectedRecords: '',
                consoleResult: [encoded], rawResult: '', scriptResults
            };

            const result = (flowMgr as any)._extractResultEnvelope(bgResult);
            expect(result).not.toBeNull();
            expect(result.__flowResult).toBe(true);
            expect(result.success).toBe(true);
            expect(result.flowObjectName).toBe('global.test_flow');
        });

        it('should extract envelope from scriptResults', () => {
            const envelope = createSuccessEnvelope();
            const bgResult = createBGResult(envelope);

            const result = (flowMgr as any)._extractResultEnvelope(bgResult);

            expect(result).not.toBeNull();
            expect(result.__flowResult).toBe(true);
            expect(result.success).toBe(true);
            expect(result.flowObjectName).toBe('global.test_flow');
        });

        it('should extract envelope with extra output lines before marker', () => {
            const envelope = createSuccessEnvelope();
            const bgResult = createBGResult(envelope, ['some other output', 'debug info']);

            const result = (flowMgr as any)._extractResultEnvelope(bgResult);

            expect(result).not.toBeNull();
            expect(result.success).toBe(true);
        });

        it('should return null when no marker found', () => {
            const bgResult = createBGResult(null, ['some random output']);

            const result = (flowMgr as any)._extractResultEnvelope(bgResult);

            expect(result).toBeNull();
        });

        it('should return null for malformed JSON after marker', () => {
            const scriptResults = [
                new ScriptExecutionOutputLine(RESULT_MARKER + '{invalid json}').asScriptLine()
            ];
            const bgResult: BackgroundScriptExecutionResult = {
                raw: '', result: '', affectedRecords: '',
                consoleResult: [RESULT_MARKER + '{invalid json}'],
                rawResult: '', scriptResults
            };

            const result = (flowMgr as any)._extractResultEnvelope(bgResult);

            expect(result).toBeNull();
        });

        it('should return null when JSON is valid but missing __flowResult flag', () => {
            const scriptResults = [
                new ScriptExecutionOutputLine(RESULT_MARKER + '{"notAFlowResult":true}').asScriptLine()
            ];
            const bgResult: BackgroundScriptExecutionResult = {
                raw: '', result: '', affectedRecords: '',
                consoleResult: [RESULT_MARKER + '{"notAFlowResult":true}'],
                rawResult: '', scriptResults
            };

            const result = (flowMgr as any)._extractResultEnvelope(bgResult);

            expect(result).toBeNull();
        });

        it('should extract envelope from consoleResult as fallback', () => {
            const envelope = createSuccessEnvelope();
            const markerLine = RESULT_MARKER + JSON.stringify(envelope);
            const bgResult: BackgroundScriptExecutionResult = {
                raw: '', result: '', affectedRecords: '',
                consoleResult: [markerLine],
                rawResult: markerLine,
                scriptResults: [] // empty scriptResults
            };

            const result = (flowMgr as any)._extractResultEnvelope(bgResult);

            expect(result).not.toBeNull();
            expect(result.success).toBe(true);
        });

        it('should handle empty scriptResults and consoleResult', () => {
            const bgResult: BackgroundScriptExecutionResult = {
                raw: '', result: '', affectedRecords: '',
                consoleResult: [], rawResult: '', scriptResults: []
            };

            const result = (flowMgr as any)._extractResultEnvelope(bgResult);

            expect(result).toBeNull();
        });

        it('should extract error envelope', () => {
            const envelope = createErrorEnvelope('Flow not found: global.nonexistent');
            const bgResult = createBGResult(envelope);

            const result = (flowMgr as any)._extractResultEnvelope(bgResult);

            expect(result).not.toBeNull();
            expect(result.success).toBe(false);
            expect(result.errorMessage).toBe('Flow not found: global.nonexistent');
        });
    });

    // ================================================================
    // _parseFlowResult
    // ================================================================

    describe('_parseFlowResult', () => {
        const defaultOptions: ExecuteFlowOptions = {
            scopedName: 'global.test_flow',
            type: 'flow'
        };

        it('should return success result with all fields populated', () => {
            const envelope = createSuccessEnvelope();
            const bgResult = createBGResult(envelope);

            const result = (flowMgr as any)._parseFlowResult(bgResult, defaultOptions);

            expect(result.success).toBe(true);
            expect(result.flowObjectName).toBe('global.test_flow');
            expect(result.flowObjectType).toBe('flow');
            expect(result.contextId).toBe('abc123def456789012345678901234ab');
            expect(result.executionDate).toBe('2024-06-12 17:54:58');
            expect(result.outputs).toEqual({ result_key: 'result_value' });
            expect(result.debugOutput).toContain('FlowRunnerResult');
            expect(result.rawScriptResult).toBe(bgResult);
        });

        it('should return success result with minimal fields', () => {
            const envelope = createSuccessEnvelope({
                contextId: null,
                executionDate: null,
                outputs: null,
                debugOutput: ''
            });
            const bgResult = createBGResult(envelope);

            const result = (flowMgr as any)._parseFlowResult(bgResult, defaultOptions);

            expect(result.success).toBe(true);
            expect(result.contextId).toBeUndefined();
            expect(result.executionDate).toBeUndefined();
            expect(result.outputs).toBeUndefined();
        });

        it('should return failure result when envelope indicates failure', () => {
            const envelope = createErrorEnvelope('Flow execution failed');
            const bgResult = createBGResult(envelope);

            const result = (flowMgr as any)._parseFlowResult(bgResult, defaultOptions);

            expect(result.success).toBe(false);
            expect(result.errorMessage).toBe('Flow execution failed');
        });

        it('should return failure result when envelope cannot be extracted', () => {
            const bgResult = createBGResult(null, ['no marker here']);

            const result = (flowMgr as any)._parseFlowResult(bgResult, defaultOptions);

            expect(result.success).toBe(false);
            expect(result.errorMessage).toContain('Could not parse flow execution result');
            expect(result.rawScriptResult).toBe(bgResult);
        });

        it('should use options values as fallback for flowObjectName and type', () => {
            const envelope = createSuccessEnvelope({ flowObjectName: '', flowObjectType: '' });
            const bgResult = createBGResult(envelope);

            const result = (flowMgr as any)._parseFlowResult(bgResult, defaultOptions);

            expect(result.flowObjectName).toBe('global.test_flow');
            expect(result.flowObjectType).toBe('flow');
        });
    });

    // ================================================================
    // execute
    // ================================================================

    describe('execute', () => {
        it('should throw error for empty scopedName', async () => {
            await expect(flowMgr.execute({
                scopedName: '',
                type: 'flow'
            })).rejects.toThrow('Flow scoped name is required');
        });

        it('should throw error for whitespace-only scopedName', async () => {
            await expect(flowMgr.execute({
                scopedName: '   ',
                type: 'flow'
            })).rejects.toThrow('Flow scoped name is required');
        });

        it('should throw error for missing type', async () => {
            await expect(flowMgr.execute({
                scopedName: 'global.test_flow',
                type: '' as any
            })).rejects.toThrow('Flow object type is required');
        });

        it('should throw error for invalid type', async () => {
            await expect(flowMgr.execute({
                scopedName: 'global.test_flow',
                type: 'invalid' as any
            })).rejects.toThrow('Invalid flow object type "invalid"');
        });

        it('should execute script via BackgroundScriptExecutor and return parsed result', async () => {
            const envelope = createSuccessEnvelope();
            const bgResult = createBGResult(envelope);

            // Mock the BGS executeScript method
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.execute({
                scopedName: 'global.test_flow',
                type: 'flow'
            });

            expect(result.success).toBe(true);
            expect(result.flowObjectName).toBe('global.test_flow');
            expect(result.contextId).toBe('abc123def456789012345678901234ab');
            expect(bgExecutor.executeScript).toHaveBeenCalledTimes(1);
        });

        it('should pass correct scope to BackgroundScriptExecutor', async () => {
            const bgResult = createBGResult(createSuccessEnvelope());
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            await flowMgr.execute({
                scopedName: 'global.test_flow',
                type: 'flow',
                scope: 'x_custom_app'
            });

            const callArgs = bgExecutor.executeScript.mock.calls[0];
            expect(callArgs[1]).toBe('x_custom_app');
        });

        it('should use default scope when scope not specified', async () => {
            const bgResult = createBGResult(createSuccessEnvelope());
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            await flowMgr.execute({
                scopedName: 'global.test_flow',
                type: 'flow'
            });

            const callArgs = bgExecutor.executeScript.mock.calls[0];
            expect(callArgs[1]).toBe('global');
        });

        it('should return failure result when BackgroundScriptExecutor throws', async () => {
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockRejectedValueOnce(new Error('CSRF token not found'));

            const result = await flowMgr.execute({
                scopedName: 'global.test_flow',
                type: 'flow'
            });

            expect(result.success).toBe(false);
            expect(result.errorMessage).toContain('Script execution error');
            expect(result.errorMessage).toContain('CSRF token not found');
            expect(result.flowObjectName).toBe('global.test_flow');
            expect(result.flowObjectType).toBe('flow');
        });

        it('should pass generated script containing the correct flow name', async () => {
            const bgResult = createBGResult(createSuccessEnvelope());
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            await flowMgr.execute({
                scopedName: 'global.my_specific_flow',
                type: 'flow'
            });

            const scriptArg = bgExecutor.executeScript.mock.calls[0][0] as string;
            expect(scriptArg).toContain(".flow('global.my_specific_flow')");
        });

        it('should handle flow execution error envelope from SN', async () => {
            const errorEnvelope = createErrorEnvelope('No flow found with name: global.nonexistent');
            const bgResult = createBGResult(errorEnvelope);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.execute({
                scopedName: 'global.nonexistent',
                type: 'flow'
            });

            expect(result.success).toBe(false);
            expect(result.errorMessage).toBe('No flow found with name: global.nonexistent');
        });
    });

    // ================================================================
    // Convenience Methods
    // ================================================================

    describe('executeFlow', () => {
        it('should delegate to execute with type "flow"', async () => {
            const bgResult = createBGResult(createSuccessEnvelope());
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.executeFlow({
                scopedName: 'global.test_flow'
            });

            const scriptArg = bgExecutor.executeScript.mock.calls[0][0] as string;
            expect(scriptArg).toContain(".flow('global.test_flow')");
            expect(result.success).toBe(true);
        });

        it('should pass all options through', async () => {
            const bgResult = createBGResult(createSuccessEnvelope());
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            await flowMgr.executeFlow({
                scopedName: 'global.test_flow',
                inputs: { key: 'val' },
                mode: 'background',
                timeout: 60000,
                quick: true,
                scope: 'x_app'
            });

            const scriptArg = bgExecutor.executeScript.mock.calls[0][0] as string;
            expect(scriptArg).toContain('.inBackground()');
            expect(scriptArg).toContain('.timeout(60000)');
            expect(scriptArg).toContain('.quick()');
            expect(scriptArg).toContain('.withInputs(inputs)');

            const scopeArg = bgExecutor.executeScript.mock.calls[0][1];
            expect(scopeArg).toBe('x_app');
        });
    });

    describe('executeSubflow', () => {
        it('should delegate to execute with type "subflow"', async () => {
            const envelope = createSuccessEnvelope({
                flowObjectName: 'global.test_subflow',
                flowObjectType: 'subflow'
            });
            const bgResult = createBGResult(envelope);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.executeSubflow({
                scopedName: 'global.test_subflow'
            });

            const scriptArg = bgExecutor.executeScript.mock.calls[0][0] as string;
            expect(scriptArg).toContain(".subflow('global.test_subflow')");
            expect(result.flowObjectType).toBe('subflow');
        });
    });

    describe('executeAction', () => {
        it('should delegate to execute with type "action"', async () => {
            const envelope = createSuccessEnvelope({
                flowObjectName: 'global.test_action',
                flowObjectType: 'action'
            });
            const bgResult = createBGResult(envelope);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.executeAction({
                scopedName: 'global.test_action'
            });

            const scriptArg = bgExecutor.executeScript.mock.calls[0][0] as string;
            expect(scriptArg).toContain(".action('global.test_action')");
            expect(result.flowObjectType).toBe('action');
        });
    });

    // ================================================================
    // Lifecycle - Validation
    // ================================================================

    describe('_validateContextId', () => {
        it('should throw for empty contextId', () => {
            expect(() => (flowMgr as any)._validateContextId('')).toThrow('Context ID is required');
        });

        it('should throw for whitespace-only contextId', () => {
            expect(() => (flowMgr as any)._validateContextId('   ')).toThrow('Context ID is required');
        });

        it('should not throw for valid contextId', () => {
            expect(() => (flowMgr as any)._validateContextId('abc123def456789012345678901234ab')).not.toThrow();
        });
    });

    describe('_escapeForScript', () => {
        it('should escape single quotes', () => {
            const result = (flowMgr as any)._escapeForScript("it's a test");
            expect(result).toBe("it\\'s a test");
        });

        it('should escape backslashes', () => {
            const result = (flowMgr as any)._escapeForScript('path\\to\\file');
            expect(result).toBe('path\\\\to\\\\file');
        });

        it('should handle strings without special characters', () => {
            const result = (flowMgr as any)._escapeForScript('abc123');
            expect(result).toBe('abc123');
        });
    });

    // ================================================================
    // Lifecycle - Script Generation
    // ================================================================

    describe('_buildContextStatusScript', () => {
        it('should generate script querying sys_flow_context', () => {
            const script = (flowMgr as any)._buildContextStatusScript('abc123def456789012345678901234ab');
            expect(script).toContain("GlideRecord('sys_flow_context')");
            expect(script).toContain("gr.get('abc123def456789012345678901234ab')");
            expect(script).toContain("gr.getValue('state')");
            expect(script).toContain("gr.getValue('name')");
            expect(script).toContain("gr.getValue('started')");
            expect(script).toContain("gr.getValue('ended')");
            expect(script).toContain('found: true');
            expect(script).toContain('found: false');
            expect(script).toContain(RESULT_MARKER);
        });
    });

    describe('_buildGetOutputsScript', () => {
        it('should generate script calling FlowAPI.getOutputs', () => {
            const script = (flowMgr as any)._buildGetOutputsScript('abc123def456789012345678901234ab');
            expect(script).toContain("sn_fd.FlowAPI.getOutputs('abc123def456789012345678901234ab')");
            expect(script).toContain('outputs.hasOwnProperty(key)');
            expect(script).toContain(RESULT_MARKER);
        });
    });

    describe('_buildGetErrorScript', () => {
        it('should generate script calling FlowAPI.getErrorMessage', () => {
            const script = (flowMgr as any)._buildGetErrorScript('abc123def456789012345678901234ab');
            expect(script).toContain("sn_fd.FlowAPI.getErrorMessage('abc123def456789012345678901234ab')");
            expect(script).toContain('flowErrorMessage');
            expect(script).toContain(RESULT_MARKER);
        });
    });

    describe('_buildCancelScript', () => {
        it('should generate script calling FlowAPI.cancel', () => {
            const script = (flowMgr as any)._buildCancelScript('abc123def456789012345678901234ab', 'Test reason');
            expect(script).toContain("sn_fd.FlowAPI.cancel('abc123def456789012345678901234ab', 'Test reason')");
            expect(script).toContain(RESULT_MARKER);
        });

        it('should escape single quotes in reason', () => {
            const script = (flowMgr as any)._buildCancelScript('abc123def456789012345678901234ab', "it's done");
            expect(script).toContain("it\\'s done");
        });
    });

    describe('_buildSendMessageScript', () => {
        it('should generate script calling FlowAPI.sendMessage', () => {
            const script = (flowMgr as any)._buildSendMessageScript('abc123def456789012345678901234ab', 'Resume Flow', 'payload data');
            expect(script).toContain("sn_fd.FlowAPI.sendMessage('abc123def456789012345678901234ab', 'Resume Flow', 'payload data')");
            expect(script).toContain(RESULT_MARKER);
        });

        it('should escape single quotes in message and payload', () => {
            const script = (flowMgr as any)._buildSendMessageScript('abc123', "it's time", "it's data");
            expect(script).toContain("it\\'s time");
            expect(script).toContain("it\\'s data");
        });
    });

    // ================================================================
    // Lifecycle - Public Methods
    // ================================================================

    describe('getFlowContextStatus', () => {
        const contextId = 'abc123def456789012345678901234ab';

        it('should throw for empty contextId', async () => {
            await expect(flowMgr.getFlowContextStatus('')).rejects.toThrow('Context ID is required');
        });

        it('should return found context with state', async () => {
            const envelope: FlowLifecycleEnvelope = {
                __flowResult: true, success: true, contextId,
                found: true, state: 'COMPLETE', name: 'Test Flow',
                started: '2024-06-12 17:54:58', ended: '2024-06-12 17:55:00',
                errorMessage: null
            };
            const bgResult = createBGResult(envelope as any);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.getFlowContextStatus(contextId);

            expect(result.success).toBe(true);
            expect(result.found).toBe(true);
            expect(result.state).toBe('COMPLETE');
            expect(result.name).toBe('Test Flow');
            expect(result.started).toBe('2024-06-12 17:54:58');
            expect(result.ended).toBe('2024-06-12 17:55:00');
        });

        it('should return not found for unknown contextId', async () => {
            const envelope: FlowLifecycleEnvelope = {
                __flowResult: true, success: true, contextId,
                found: false, state: null, name: null,
                started: null, ended: null, errorMessage: null
            };
            const bgResult = createBGResult(envelope as any);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.getFlowContextStatus(contextId);

            expect(result.success).toBe(true);
            expect(result.found).toBe(false);
            expect(result.state).toBeUndefined();
        });

        it('should return failure when BGS throws', async () => {
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockRejectedValueOnce(new Error('Network error'));

            const result = await flowMgr.getFlowContextStatus(contextId);

            expect(result.success).toBe(false);
            expect(result.found).toBe(false);
            expect(result.errorMessage).toContain('Network error');
        });
    });

    describe('getFlowOutputs', () => {
        const contextId = 'abc123def456789012345678901234ab';

        it('should throw for empty contextId', async () => {
            await expect(flowMgr.getFlowOutputs('')).rejects.toThrow('Context ID is required');
        });

        it('should return outputs on success', async () => {
            const envelope: FlowLifecycleEnvelope = {
                __flowResult: true, success: true, contextId,
                outputs: { key1: 'val1', key2: 'val2' },
                errorMessage: null
            };
            const bgResult = createBGResult(envelope as any);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.getFlowOutputs(contextId);

            expect(result.success).toBe(true);
            expect(result.outputs).toEqual({ key1: 'val1', key2: 'val2' });
        });

        it('should return failure with error message', async () => {
            const envelope: FlowLifecycleEnvelope = {
                __flowResult: true, success: false, contextId,
                outputs: null,
                errorMessage: 'Context not found'
            };
            const bgResult = createBGResult(envelope as any);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.getFlowOutputs(contextId);

            expect(result.success).toBe(false);
            expect(result.errorMessage).toBe('Context not found');
        });
    });

    describe('getFlowError', () => {
        const contextId = 'abc123def456789012345678901234ab';

        it('should throw for empty contextId', async () => {
            await expect(flowMgr.getFlowError('')).rejects.toThrow('Context ID is required');
        });

        it('should return flow error message', async () => {
            const envelope: FlowLifecycleEnvelope = {
                __flowResult: true, success: true, contextId,
                flowErrorMessage: 'Operation failed: invalid record',
                errorMessage: null
            };
            const bgResult = createBGResult(envelope as any);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.getFlowError(contextId);

            expect(result.success).toBe(true);
            expect(result.flowErrorMessage).toBe('Operation failed: invalid record');
        });

        it('should return null flowErrorMessage when no errors', async () => {
            const envelope: FlowLifecycleEnvelope = {
                __flowResult: true, success: true, contextId,
                flowErrorMessage: null,
                errorMessage: null
            };
            const bgResult = createBGResult(envelope as any);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.getFlowError(contextId);

            expect(result.success).toBe(true);
            expect(result.flowErrorMessage).toBeUndefined();
        });
    });

    describe('cancelFlow', () => {
        const contextId = 'abc123def456789012345678901234ab';

        it('should throw for empty contextId', async () => {
            await expect(flowMgr.cancelFlow('')).rejects.toThrow('Context ID is required');
        });

        it('should return success on cancel', async () => {
            const envelope: FlowLifecycleEnvelope = {
                __flowResult: true, success: true, contextId,
                errorMessage: null
            };
            const bgResult = createBGResult(envelope as any);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.cancelFlow(contextId, 'Test cancellation');

            expect(result.success).toBe(true);
            expect(result.contextId).toBe(contextId);
        });

        it('should use default reason when none provided', async () => {
            const envelope: FlowLifecycleEnvelope = {
                __flowResult: true, success: true, contextId,
                errorMessage: null
            };
            const bgResult = createBGResult(envelope as any);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            await flowMgr.cancelFlow(contextId);

            const scriptArg = bgExecutor.executeScript.mock.calls[0][0] as string;
            expect(scriptArg).toContain('Cancelled via FlowManager');
        });

        it('should return failure when cancel fails', async () => {
            const envelope: FlowLifecycleEnvelope = {
                __flowResult: true, success: false, contextId,
                errorMessage: 'Cannot cancel: context is already complete'
            };
            const bgResult = createBGResult(envelope as any);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.cancelFlow(contextId);

            expect(result.success).toBe(false);
            expect(result.errorMessage).toContain('already complete');
        });
    });

    describe('sendFlowMessage', () => {
        const contextId = 'abc123def456789012345678901234ab';

        it('should throw for empty contextId', async () => {
            await expect(flowMgr.sendFlowMessage('', 'Resume')).rejects.toThrow('Context ID is required');
        });

        it('should throw for empty message', async () => {
            await expect(flowMgr.sendFlowMessage(contextId, '')).rejects.toThrow('Message is required');
        });

        it('should throw for whitespace-only message', async () => {
            await expect(flowMgr.sendFlowMessage(contextId, '   ')).rejects.toThrow('Message is required');
        });

        it('should return success when message sent', async () => {
            const envelope: FlowLifecycleEnvelope = {
                __flowResult: true, success: true, contextId,
                errorMessage: null
            };
            const bgResult = createBGResult(envelope as any);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            const result = await flowMgr.sendFlowMessage(contextId, 'Resume Flow', 'payload data');

            expect(result.success).toBe(true);
            expect(result.contextId).toBe(contextId);
        });

        it('should pass correct script with message and payload', async () => {
            const envelope: FlowLifecycleEnvelope = {
                __flowResult: true, success: true, contextId,
                errorMessage: null
            };
            const bgResult = createBGResult(envelope as any);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            await flowMgr.sendFlowMessage(contextId, 'Resume Flow', 'my payload');

            const scriptArg = bgExecutor.executeScript.mock.calls[0][0] as string;
            expect(scriptArg).toContain("sendMessage('abc123def456789012345678901234ab', 'Resume Flow', 'my payload')");
        });

        it('should use empty payload when not provided', async () => {
            const envelope: FlowLifecycleEnvelope = {
                __flowResult: true, success: true, contextId,
                errorMessage: null
            };
            const bgResult = createBGResult(envelope as any);
            const bgExecutor = (flowMgr as any)._bgExecutor;
            jest.spyOn(bgExecutor, 'executeScript').mockResolvedValueOnce(bgResult);

            await flowMgr.sendFlowMessage(contextId, 'Resume');

            const scriptArg = bgExecutor.executeScript.mock.calls[0][0] as string;
            expect(scriptArg).toContain("'Resume', ''");
        });
    });
});

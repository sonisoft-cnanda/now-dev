import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../src/sn/ServiceNowInstance';
import { BackgroundScriptExecutor } from '../../src/sn/BackgroundScriptExecutor';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../test_utils/test_config';

import * as path from 'path';
import * as fs from 'fs';
import { info } from "console";


describe('BackgroundScriptExecutor', () => {
    let instance: ServiceNowInstance;
    let executor: BackgroundScriptExecutor | null = null;
    const TEST_SCOPE = 'global';


    beforeEach(async () => {

        const credential = await getCredentials(SN_INSTANCE_ALIAS);

         if(credential){
            const snSettings:ServiceNowSettingsInstance = {
            alias: SN_INSTANCE_ALIAS,
            credential: credential
            }
            instance = new ServiceNowInstance(snSettings);
            executor = new BackgroundScriptExecutor( instance,TEST_SCOPE );
        }
         
        if(executor == null)
            throw new Error("Could not get credentials.");
        
    });

    describe('getBackgroundScriptCSRFToken', () => {

        it('should return csrf token and log its format', async () => {
           const result:string | undefined = await executor?.getBackgroundScriptCSRFToken();

           console.log('\n=== CSRF Token Result ===');
           console.log('Token:', result);
           console.log('Token length:', result?.length);

           expect(result).toBeDefined();
           expect(result).not.toBeNull();
           expect(result.length).toBeGreaterThan(0);
        }, 100000);

    });
    
    describe('executeScript', () => {

        xit('should throw error if instance is not a ServiceNowInstance', () => {
            const script = 'testScript';
            const scope = TEST_SCOPE;
            const instance = {}; // mock object, not an instance of ServiceNowInstance
            // @ts-expect-error - returning arguments must be valid column names
            expect(() => executor.executeScript( script, scope, instance )).rejects.toThrow('instance must be a ServiceNowInstance')
        });

        xit('should throw error if scope is not a string', () => {
            const script = 'testScript';
            const scope = 123; // mock object, not a string
            // @ts-expect-error - returning arguments must be valid column names
            expect(() => executor.executeScript(script, scope, instance )).rejects.toThrow('scope must be a string')
        });

        xit('should throw error if script is not a string', () => {
            const scope = TEST_SCOPE;
            const script = 123; // mock object, not a string
            // @ts-expect-error - returning arguments must be valid column names
            expect(() => executor.executeScript( script, scope, instance )).rejects.toThrow('script must be a string')
        })

        it('should execute simple gs.info script and capture full payload', async () => {
            const sVal = "TESTING_BG_SCRIPT_" + Date.now();
            const script = `gs.info("${sVal}")`;
            const scope = TEST_SCOPE;
            const result = await executor?.executeScript(script, scope, instance);

            console.log('\n=== BackgroundScriptExecutor simple gs.info result ===');
            console.log('Full result:', JSON.stringify(result, null, 2));
            console.log('Raw XML (first 3000 chars):', result?.raw?.substring(0, 3000));

            expect(result).toBeDefined();
            expect(result).not.toBeNull();
            expect(result?.result).toBeDefined();
            expect(result?.result).toContain(sVal);
            expect(result?.scriptResults).toBeDefined();
            expect(Array.isArray(result?.scriptResults)).toBe(true);
        }, 100000);

        it('should execute script with debug output and capture payload', async () => {
            const script = `gs.info("INFO_LINE_1"); gs.debug("DEBUG_LINE_1"); gs.info("INFO_LINE_2");`;
            const scope = TEST_SCOPE;
            const result = await executor?.executeScript(script, scope, instance);

            console.log('\n=== BackgroundScriptExecutor debug output result ===');
            console.log('Full result:', JSON.stringify(result, null, 2));
            console.log('Console result lines:', result?.consoleResult);
            console.log('Script results:', JSON.stringify(result?.scriptResults, null, 2));
            console.log('Raw XML (first 3000 chars):', result?.raw?.substring(0, 3000));

            expect(result).toBeDefined();
            expect(result?.consoleResult).toBeDefined();
            expect(result?.consoleResult.length).toBeGreaterThanOrEqual(1);
        }, 100000);

        it('should execute script with mixed system and script output', async () => {
            // This script generates both system output and script output
            const script = `
                var gr = new GlideRecord("sys_properties");
                gr.setLimit(1);
                gr.query();
                if(gr.next()){
                    gs.info("Property: " + gr.getValue("name"));
                }
                gs.info("Script complete");
            `;
            const scope = TEST_SCOPE;
            const result = await executor?.executeScript(script, scope, instance);

            console.log('\n=== BackgroundScriptExecutor mixed output result ===');
            console.log('Full result:', JSON.stringify(result, null, 2));
            console.log('Console result lines:', result?.consoleResult);
            console.log('Script results classification:', result?.scriptResults?.map(sr => ({
                line: (sr as any)._line,
                isDebug: (sr as any)._isDebug,
                isSystem: (sr as any)._isSystem,
                isScript: (sr as any)._isScript
            })));
            console.log('Raw XML (first 3000 chars):', result?.raw?.substring(0, 3000));

            expect(result).toBeDefined();
            expect(result?.consoleResult).toBeDefined();
        }, 100000);

        it('should execute script from file with given scope', async () => {
            const filePath:string = path.resolve('./test/unit/testScript1.js');
            if (!fs.existsSync(filePath)) {
                console.log('Skipping: testScript1.js not found at', filePath);
                return;
            }
            const script:string = fs.readFileSync(filePath).toString('utf8');

            const scope = TEST_SCOPE;
            const result = await executor?.executeScript(script, scope, instance);

            console.log('\n=== BackgroundScriptExecutor file script result ===');
            console.log('Full result:', JSON.stringify(result, null, 2));

            expect(result).toBeDefined();
            expect(result).not.toBeNull();
            expect(result?.result).toBeDefined();

            const consoleResult:string[] = result?.consoleResult;
            expect(consoleResult.length).toBeGreaterThan(1);
        }, 100000);

    })

    describe('parseScriptResult', () => {
        it('should parse script result with known XML', async () => {
            const xmlBody = `[0:00:00.066]
                <HTML>
                    <BODY>
                        Script completed in scope global: script<HR/>
                        Script execution history and recovery <A target='blank' HREF='sys_script_execution_history.do?sys_id=8453505893a30210e1feb2ddfaba102c'>available here</A>
                        <HR/>
                        <PRE>
                            *** Script: testResult<BR/>
                        </PRE>
                        <HR/>
                    </BODY>
                </HTML>`;
            const resultObj = executor?.parseScriptResult(xmlBody);

            console.log('\n=== parseScriptResult result ===');
            console.log('Full parsed result:', JSON.stringify(resultObj, null, 2));

            expect(resultObj).toBeDefined();
            expect(resultObj?.result).toContain("testResult");
        });

        it('should parse XML with multiple output lines', async () => {
            const xmlBody = `[0:00:00.100]
                <HTML>
                    <BODY>
                        Script completed in scope global: script<HR/>
                        <HR/>
                        <PRE>
                            *** Script: Line 1
*** Script: Line 2
*** Script: [DEBUG] Debug line
System output here<BR/>
                        </PRE>
                        <HR/>
                    </BODY>
                </HTML>`;
            const resultObj = executor?.parseScriptResult(xmlBody);

            console.log('\n=== parseScriptResult multi-line result ===');
            console.log('Full parsed result:', JSON.stringify(resultObj, null, 2));
            console.log('Console result:', resultObj?.consoleResult);
            console.log('Script results:', JSON.stringify(resultObj?.scriptResults, null, 2));

            expect(resultObj).toBeDefined();
            expect(resultObj?.consoleResult.length).toBeGreaterThan(0);
        });
    })

});
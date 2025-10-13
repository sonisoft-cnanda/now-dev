import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../src/sn/ServiceNowInstance';
import { BackgroundScriptExecutor } from '../../src/sn/BackgroundScriptExecutor';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";

import * as path from 'path';
import * as fs from 'fs';
import { info } from "console";


describe('BackgroundScriptExecutor', () => {
    let instance: ServiceNowInstance;
    let executor: BackgroundScriptExecutor | null = null;
    const TEST_SCOPE = 'global';
    

    beforeEach(async () => {
       
        const alias:string = 'tanengdev012';
   
        const credential = await getCredentials(alias);
        
         if(credential){
            const snSettings:ServiceNowSettingsInstance = {
            alias: alias,
            credential: credential
            }
            instance = new ServiceNowInstance(snSettings);
            executor = new BackgroundScriptExecutor( instance,TEST_SCOPE );
        }
         
        if(executor == null)
            throw new Error("Could not get credentials.");
        
    });

    describe('getBackgroundScriptCSRFToken', () => {

        it('should return csrf token', async () => {
           const result:string | undefined = await executor?.getBackgroundScriptCSRFToken();
           expect(result).toBeDefined();
            expect(result).not.toBeNull();
            
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

        xit('should execute script with given scope', async () => {
            const sVal = "TESTING SN-ATF";
            const script = `gs.info("`+sVal+`")`;
            const scope = TEST_SCOPE;
            const result = await executor?.executeScript(script, scope, instance );
            expect(result).toBeDefined();
            expect(result).not.toBeNull();
            expect(result?.result).toBeDefined();
            expect(result?.result.indexOf(sVal)).not.toBe(-1);
            expect(result?.result).toBe(sVal);
        }, 100000);

        it('should execute script with given scope', async () => {
            const filePath:string = path.resolve('./test/unit/testScript1.js');
            const script:string = fs.readFileSync(filePath).toString('utf8');
          
            const scope = TEST_SCOPE;
            const result     = await executor?.executeScript(script, scope, instance );
            //info(result.result);
            expect(result).toBeDefined();
            expect(result).not.toBeNull();
            expect(result?.result).toBeDefined();
            
            const consoleResult:string[] = result?.consoleResult;
            expect( consoleResult.length).toBeGreaterThan(1);
            //expect(result?.result.indexOf(sVal)).not.toBe(-1);
            //expect(result?.result).toBe(sVal);
        }, 100000);

       

    })

    describe('parseScriptResult', () => {
        it('should parse script result', async () => {
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
            const resultObj = await executor?.parseScriptResult(xmlBody);
            expect(resultObj).toBeDefined();
            expect(resultObj?.result).toContain("testResult");
        })
    })

});
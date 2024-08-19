import { ServiceNowInstance } from '../../src/sn/ServiceNowInstance';
import { BackgroundScriptExecutor } from '../../src/sn/BackgroundScriptExecutor';

describe('BackgroundScriptExecutor', () => {
    let instance: ServiceNowInstance;
    let executor: BackgroundScriptExecutor;
    const TEST_SCOPE = 'global';
    
    it('should allow construction with or without specified options', ()=>{
        instance = new ServiceNowInstance();
        executor = new BackgroundScriptExecutor({ instance, scope: TEST_SCOPE });
        expect(executor).toBeDefined();
        expect(executor.instance).toBe(instance);
        expect(executor.scope).toBe(TEST_SCOPE);
        
        executor = new BackgroundScriptExecutor({ instance });
        expect(executor).toBeDefined();
        expect(executor.instance).toBe(instance);
        expect(executor.scope).toBeUndefined;

        executor = new BackgroundScriptExecutor();
        expect(executor).toBeDefined();
    })

    beforeEach(() => {
        instance = new ServiceNowInstance();
        executor = new BackgroundScriptExecutor({ instance, scope: TEST_SCOPE });
    });

    describe('getBackgroundScriptCSRFToken', () => {

        it('should return csrf token', async () => {
           let result:string = await executor.getBackgroundScriptCSRFToken();
            expect(result).not.toBeNull();
            
        }, 100000);

    });
    
    describe('executeScript', () => {

        it('should throw error if instance is not a ServiceNowInstance', () => {
            const script = 'testScript';
            const scope = TEST_SCOPE;
            const instance = {}; // mock object, not an instance of ServiceNowInstance
            // @ts-expect-error - returning arguments must be valid column names
            expect(() => executor.executeScript({ script, scope, instance })).rejects.toThrow('instance must be a ServiceNowInstance')
        });

        it('should throw error if scope is not a string', () => {
            const script = 'testScript';
            const scope = 123; // mock object, not a string
            // @ts-expect-error - returning arguments must be valid column names
            expect(() => executor.executeScript({ script, scope, instance })).rejects.toThrow('scope must be a string')
        });

        it('should throw error if script is not a string', () => {
            const scope = TEST_SCOPE;
            const script = 123; // mock object, not a string
            // @ts-expect-error - returning arguments must be valid column names
            expect(() => executor.executeScript({ script, scope, instance })).rejects.toThrow('script must be a string')
        })

        it('should execute script with given scope', async () => {
            const script = `gs.info("TESTING SN-ATF")`;
            const scope = TEST_SCOPE;
            const result = await executor.executeScript({ script, scope, instance });
            expect(result).toBeDefined();
            expect(result).toBe("TESTING SN-ATF");
        });

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
            const resultObj = await executor.parseScriptResult(xmlBody);
            expect(resultObj).toBeDefined();
            expect(resultObj.result).toBe("testResult");
        })
    })

});
import { 
    ATFTestExecutor, 
    TestResult, 
    TestSuiteExecutionRequest, 
    TestSuiteExecutionResponse, 
    TestSuiteExecutionResult 
} from '../../src/sn/atf/ATFTestExecutor';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../src/sn/ServiceNowInstance';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth';

const SECONDS = 1000;


describe('ATFTestExecutor', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;



    beforeEach(async () => {
       
        const alias: string = 'ven07473';
        //const credentialArgs = {"_": "get-credentials", auth: alias || "fluent-default"};
   
         credential = await getCredentials(alias);
       
        
         if(credential){
            const snSettings:ServiceNowSettingsInstance = {
            alias: alias,
            credential: credential
            }
            instance = new ServiceNowInstance(snSettings);
        }
         
       
        
    });

    describe('execute test', () => {
       

        xit('defined test', async () => {
            const testExec:ATFTestExecutor = new ATFTestExecutor(instance);
           const resp:TestResult =  await testExec.executeTest('60ecb62b933626505ecb74718bba10e8');
           
           expect(resp).not.toBeNull();
            expect(resp.status).toBe("success");

        }, 700 * SECONDS)

       


      

    });

    describe('execute test suite', () => {
        const TEST_SUITE_SYS_ID = 'e077e00b83103210621e78c6feaad383'; // Example test suite sys_id
        const TEST_SUITE_NAME = 'My New Test Suite'; // Example test suite name

        it('should execute test suite by sys_id', async () => {
            const testExec: ATFTestExecutor = new ATFTestExecutor(instance);
            const resp: TestSuiteExecutionResponse = await testExec.executeTestSuite(TEST_SUITE_SYS_ID);
            
            expect(resp).not.toBeNull();
            expect(resp.status).toBeDefined();
            expect(resp.status_label).toBeDefined();
            expect(resp.links).toBeDefined();
            expect(resp.links.progress).toBeDefined();
            expect(resp.links.progress.id).toBeDefined();
        }, 60 * SECONDS);

        it('should execute test suite by sys_id with options', async () => {
            const testExec: ATFTestExecutor = new ATFTestExecutor(instance);
            const options: Partial<TestSuiteExecutionRequest> = {
                browser_name: 'chrome',
                is_performance_run: false,
                run_in_cloud: false
            };
            
            const resp: TestSuiteExecutionResponse = await testExec.executeTestSuite(TEST_SUITE_SYS_ID, options);
            
            expect(resp).not.toBeNull();
            expect(resp.status).toBeDefined();
            expect(resp.status_label).toBeDefined();
            expect(resp.links).toBeDefined();
            expect(resp.links.progress).toBeDefined();
        }, 60 * SECONDS);

        it('should execute test suite by name', async () => {
            const testExec: ATFTestExecutor = new ATFTestExecutor(instance);
            const resp: TestSuiteExecutionResponse = await testExec.executeTestSuiteByName(TEST_SUITE_NAME);
            
            expect(resp).not.toBeNull();
            expect(resp.status).toBeDefined();
            expect(resp.status_label).toBeDefined();
            expect(resp.links).toBeDefined();
            expect(resp.links.progress).toBeDefined();
        }, 60 * SECONDS);

        xit('should execute test suite by name with options', async () => {
            const testExec: ATFTestExecutor = new ATFTestExecutor(instance);
            const options: Partial<TestSuiteExecutionRequest> = {
                browser_name: 'firefox',
                browser_version: '9',
                is_performance_run: true,
                run_in_cloud: true
            };
            
            const resp: TestSuiteExecutionResponse = await testExec.executeTestSuiteByName(TEST_SUITE_NAME, options);
            
            expect(resp).not.toBeNull();
            expect(resp.status).toBeDefined();
            expect(resp.status_label).toBeDefined();
            expect(resp.links).toBeDefined();
            expect(resp.links.progress).toBeDefined();
        }, 60 * SECONDS);

        it('should get test suite progress', async () => {
            const testExec: ATFTestExecutor = new ATFTestExecutor(instance);
            
            // First execute a test suite to get a progress ID
            const executionResp: TestSuiteExecutionResponse = await testExec.executeTestSuite(TEST_SUITE_SYS_ID);
            const progressId = executionResp.links.progress.id;
            
            // Then get the progress
            const progress: TestSuiteExecutionResponse = await testExec.getTestSuiteProgress(progressId);
            
            expect(progress).not.toBeNull();
            expect(progress.status).toBeDefined();
            expect(progress.percent_complete).toBeDefined();
            expect(progress.status_label).toBeDefined();
        }, 60 * SECONDS);

        it('should execute test suite and wait for completion', async () => {
            const testExec: ATFTestExecutor = new ATFTestExecutor(instance);
            
            // This test might take a while depending on the test suite
            const result: TestSuiteExecutionResult = await testExec.executeTestSuiteAndWait(TEST_SUITE_SYS_ID, undefined, 10000);
            
            expect(result).not.toBeNull();
            expect(result.sys_id).toBeDefined();
            expect(result.status).toBeDefined();
            expect(result.test_suite).toBeDefined();
        }, 300 * SECONDS); // Longer timeout for completion

        it('should execute test suite by name and wait for completion', async () => {
            const testExec: ATFTestExecutor = new ATFTestExecutor(instance);
            const options: Partial<TestSuiteExecutionRequest> = {
                browser_name: 'chrome',
                run_in_cloud: false
            };
            
            // This test might take a while depending on the test suite
            const result: TestSuiteExecutionResult = await testExec.executeTestSuiteByNameAndWait(TEST_SUITE_NAME, options, 10000);
            
            expect(result).not.toBeNull();
            expect(result.sys_id).toBeDefined();
            expect(result.status).toBeDefined();
            expect(result.test_suite).toBeDefined();
        }, 300 * SECONDS); // Longer timeout for completion

        it('should handle invalid test suite sys_id', async () => {
            const testExec: ATFTestExecutor = new ATFTestExecutor(instance);
            const invalidSysId = 'invalid_sys_id_123456789';
            
            await expect(testExec.executeTestSuite(invalidSysId)).rejects.toThrow();
        }, 30 * SECONDS);

        it('should handle invalid test suite name', async () => {
            const testExec: ATFTestExecutor = new ATFTestExecutor(instance);
            const invalidName = 'Non-existent Test Suite Name';
            
            await expect(testExec.executeTestSuiteByName(invalidName)).rejects.toThrow();
        }, 30 * SECONDS);
    });

 
    
   
})
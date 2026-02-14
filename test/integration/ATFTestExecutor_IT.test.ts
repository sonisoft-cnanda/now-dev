import { 
    ATFTestExecutor, 
    TestResult, 
    TestSuiteExecutionRequest, 
    TestSuiteExecutionResponse, 
    TestSuiteExecutionResult 
} from '../../src/sn/atf/ATFTestExecutor';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../src/sn/ServiceNowInstance';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth';
import { SN_INSTANCE_ALIAS } from '../test_utils/test_config';

const SECONDS = 1000;


describe('ATFTestExecutor', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;



    beforeEach(async () => {

         credential = await getCredentials(SN_INSTANCE_ALIAS);

         if(credential){
            const snSettings:ServiceNowSettingsInstance = {
            alias: SN_INSTANCE_ALIAS,
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

        it('should execute test suite by sys_id with CICD Credentials', async () => {
            process.env['SN_SDK_NODE_ENV'] = 'SN_SDK_CI_INSTALL';
            process.env['SN_SDK_INSTANCE_URL'] = 'https://tanengqa02.service-now.com';
            process.env['SN_SDK_USER'] = 'admin';
            process.env['SN_SDK_USER_PWD'] = 'G$$k0utTanium';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cred: any = await getCredentials('test');
       
            expect(cred).not.toBeNull();
            expect(cred).toBeDefined();
            expect(cred.instanceUrl).toBe('https://tanengqa02.service-now.com');
            expect(cred.username).toBe('admin');
            expect(cred.password).toBe('G$$k0utTanium');
    
            if(cred){
               const snSettings:ServiceNowSettingsInstance = {
               alias: '',
               credential: cred
               }
               instance = new ServiceNowInstance(snSettings);
           }

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
            expect(result.number).toBeDefined();
            expect(result.success).toBeDefined();
            expect(result.start_time).toBeDefined();
            expect(result.end_time).toBeDefined();
            expect(result.run_time).toBeDefined();
            expect(result.success_count).toBeDefined();
            expect(result.failure_count).toBeDefined();
            expect(result.skip_count).toBeDefined();
            expect(result.error_count).toBeDefined();
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
            expect(result.number).toBeDefined();
            expect(result.success).toBeDefined();
            expect(result.run_time).toBeDefined();
            expect(result.success_count).toBeDefined();
            expect(result.failure_count).toBeDefined();
            expect(result.skip_count).toBeDefined();
            expect(result.error_count).toBeDefined();
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

    describe('DIAGNOSTIC - ATF Suite Result Fields', () => {
        const DIAG_SUITE_SYS_ID = 'ab72ec6b8f033300a8616c7827bdee01';

        it('should log complete raw response from executeTestSuiteAndWait', async () => {
            const testExec: ATFTestExecutor = new ATFTestExecutor(instance);

            // Step 1: Execute the test suite
            console.log('=== STEP 1: executeTestSuite ===');
            const executionResp: TestSuiteExecutionResponse = await testExec.executeTestSuite(DIAG_SUITE_SYS_ID);
            console.log('ExecutionResponse:', JSON.stringify(executionResp, null, 2));

            const progressId = executionResp.links.progress.id;
            console.log('Progress ID:', progressId);

            // Step 2: Poll progress until complete
            console.log('\n=== STEP 2: Polling progress ===');
            let progress: TestSuiteExecutionResponse = await testExec.getTestSuiteProgress(progressId);
            console.log('Initial progress:', JSON.stringify(progress, null, 2));

            while (progress.percent_complete < 100 && progress.status !== "3" && progress.status !== "4") {
                await new Promise(resolve => setTimeout(resolve, 10000));
                progress = await testExec.getTestSuiteProgress(progressId);
                console.log(`Progress: ${progress.percent_complete}% - ${progress.status_label}`);
            }
            console.log('Final progress:', JSON.stringify(progress, null, 2));

            // Step 3: Get the suite results - THIS IS THE CRITICAL PART
            console.log('\n=== STEP 3: getTestSuiteResults (raw) ===');
            const resultsId = progress.links.results.id;
            console.log('Results ID:', resultsId);

            // Make a raw request to see EXACTLY what ServiceNow returns
            const rawRequest = {
                path: `/api/now/table/sys_atf_test_suite_result?sysparm_query=sys_id=${resultsId}`,
                headers: { 'Accept': 'application/json' },
                query: null,
                body: null
            };
            const rawResp = await testExec._req.get<any>(rawRequest);
            console.log('Raw response status:', rawResp.status);
            console.log('Raw response bodyObject:', JSON.stringify(rawResp.bodyObject, null, 2));

            if (rawResp.bodyObject && rawResp.bodyObject.result && rawResp.bodyObject.result.length > 0) {
                const rawResult = rawResp.bodyObject.result[0];
                console.log('\n=== ACTUAL FIELD NAMES on sys_atf_test_suite_result ===');
                console.log('Object.keys:', JSON.stringify(Object.keys(rawResult)));
                console.log('\n=== FIELD VALUES ===');
                for (const [key, value] of Object.entries(rawResult)) {
                    console.log(`  ${key}: ${JSON.stringify(value)}`);
                }

                // Check the fields our interface expects
                console.log('\n=== CHECKING CURRENT INTERFACE FIELDS ===');
                console.log('sys_id:', rawResult.sys_id);
                console.log('status:', rawResult.status);
                console.log('test_suite:', rawResult.test_suite);
                console.log('start_time:', rawResult.start_time);
                console.log('end_time:', rawResult.end_time);
                console.log('duration (WRONG?):', rawResult.duration);
                console.log('total_tests (WRONG?):', rawResult.total_tests);
                console.log('passed_tests (WRONG?):', rawResult.passed_tests);
                console.log('failed_tests (WRONG?):', rawResult.failed_tests);
                console.log('skipped_tests (WRONG?):', rawResult.skipped_tests);
                console.log('output (WRONG?):', rawResult.output);

                console.log('\n=== CHECKING CORRECT FIELD NAMES ===');
                console.log('run_time:', rawResult.run_time);
                console.log('success_count:', rawResult.success_count);
                console.log('failure_count:', rawResult.failure_count);
                console.log('skip_count:', rawResult.skip_count);
                console.log('error_count:', rawResult.error_count);
                console.log('success:', rawResult.success);
                console.log('number:', rawResult.number);
            }

            // Also try with sysparm_display_value=all to see if virtual fields differ
            console.log('\n=== STEP 4: Request WITH sysparm_display_value=all ===');
            const displayValueRequest = {
                path: `/api/now/table/sys_atf_test_suite_result?sysparm_query=sys_id=${resultsId}&sysparm_display_value=all`,
                headers: { 'Accept': 'application/json' },
                query: null,
                body: null
            };
            const dvResp = await testExec._req.get<any>(displayValueRequest);
            if (dvResp.bodyObject && dvResp.bodyObject.result && dvResp.bodyObject.result.length > 0) {
                const dvResult = dvResp.bodyObject.result[0];
                console.log('WITH display_value=all:');
                console.log('  run_time:', JSON.stringify(dvResult.run_time));
                console.log('  success_count:', JSON.stringify(dvResult.success_count));
                console.log('  failure_count:', JSON.stringify(dvResult.failure_count));
                console.log('  skip_count:', JSON.stringify(dvResult.skip_count));
                console.log('  error_count:', JSON.stringify(dvResult.error_count));
            }

            // Basic assertion so the test passes
            expect(rawResp.status).toBe(200);
        }, 600 * SECONDS);
    });

 
    
   
})
import * as qs from 'qs';
import { ATFTestExecutor, TestResult } from '../../src/sn/atf/ATFTestExecutor';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../src/sn/ServiceNowInstance';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth';

const SECONDS = 1000;


describe('ATFTestExecutor', () => {
    let instance: ServiceNowInstance;
    const TEST_SCOPE = 'global';
    let credential:any;



    beforeEach(async () => {
       
        const alias:string = 'ven05195';
        const credentialArgs = {"_": "get-credentials", auth: alias};
   
        credential = await getCredentials(credentialArgs);
        
         if(credential){
            const snSettings:ServiceNowSettingsInstance = {
            alias: alias,
            credential: credential
            }
            instance = new ServiceNowInstance(snSettings);
        }
         
       
        
    });

    describe('execute test', () => {
       

        it('defined test', async () => {
            let testExec:ATFTestExecutor = new ATFTestExecutor(instance);
           let resp:TestResult =  await testExec.executeTest('60ecb62b933626505ecb74718bba10e8');
           
           expect(resp).not.toBeNull();
            expect(resp.status).toBe("success");

        }, 700 * SECONDS)

       


      

    });

 
    
   
})

import { Creds } from '@servicenow/sdk-cli-core';
import { CredentialWrapper } from '../../src/now/sdk/auth/CredentialWrapper';
import { ATFTestExecutor, TestResult } from '../../src/sn/ATFTestExecutor';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../src/sn/ServiceNowInstance';

const SECONDS = 1000;

const CREDENTIAL_ALIAS:string = "ven05195";
const wrapper:CredentialWrapper = new CredentialWrapper();
const credential:Creds = await wrapper.getStoredCredentialsByAlias(CREDENTIAL_ALIAS);
let instance:ServiceNowInstance | null = null;
if(credential){
   const snSettings:ServiceNowSettingsInstance = {
        alias: CREDENTIAL_ALIAS,
        host: credential.host,
        password: credential.password,
        username: credential.username,
    }
    
    instance = new ServiceNowInstance(snSettings);
}else{
    throw new Error("Cannot retrieve credential for alias: " + CREDENTIAL_ALIAS);
}

describe('ATFTestExecutor', () => {
   
    describe('execute test', () => {
       

        it('execute non-parameterized test', async () => {

            const testExec:ATFTestExecutor = new ATFTestExecutor(instance);
           const resp:TestResult =  await testExec.executeTest('81ea300c93851a500aec3a718bba1090');
           
           expect(resp).not.toBeNull();
            expect(resp.status).toBe("success");

        }, 700 * SECONDS)


        it('execute parameterized test', async () => {

            const testExec:ATFTestExecutor = new ATFTestExecutor(instance);
           const resp:TestResult =  await testExec.executeTest('dea365cd93309a100aec3a718bba1020');
           
           expect(resp).not.toBeNull();
            expect(resp.status).toBe("success");

        }, 700 * SECONDS)

       


      

    });

 
    
   
})
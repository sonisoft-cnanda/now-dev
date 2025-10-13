import { getCredentials } from "@servicenow/sdk-cli/dist/auth";
import { ServiceNowInstance, ServiceNowSettingsInstance } from "../../../src/sn/ServiceNowInstance";
import { ProgressWorker } from "../../../src/sn/ProgressWorker";

describe('ProgressWorker', () => {

    let instance: ServiceNowInstance;
    const TEST_SCOPE = 'global';
    let credential:any;

    beforeEach(async () => {
       
        const alias:string = 'ven05195';
   
        credential = await getCredentials(alias);
        
         if(credential){
            const snSettings:ServiceNowSettingsInstance = {
            alias: alias,
            credential: credential
            }
            instance = new ServiceNowInstance(snSettings);
        }
         
       
        
    });

    it('should get progress', async () => {
      
        const progressWorker = new ProgressWorker(instance);
        const progressResult = await progressWorker.getProgress('96260c6093072a505ecb74718bba10d6');
        console.log(progressResult);
        console.log(progressResult.status);
        expect(progressResult).toBeDefined();
    });
});
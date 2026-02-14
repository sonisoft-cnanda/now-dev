import { getCredentials } from "@servicenow/sdk-cli/dist/auth";
import { ServiceNowInstance, ServiceNowSettingsInstance } from "../../../src/sn/ServiceNowInstance";
import { ProgressWorker } from "../../../src/sn/ProgressWorker";
import { SN_INSTANCE_ALIAS } from '../../test_utils/test_config';

describe('ProgressWorker', () => {

    let instance: ServiceNowInstance;
    const TEST_SCOPE = 'global';
    let credential:any;

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

    it('should get progress', async () => {
      
        const progressWorker = new ProgressWorker(instance);
        const progressResult = await progressWorker.getProgress('96260c6093072a505ecb74718bba10d6');
        console.log(progressResult);
        console.log(progressResult.status);
        expect(progressResult).toBeDefined();
    });
});
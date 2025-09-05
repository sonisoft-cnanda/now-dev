

import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
//import { changeApplication } from "@servicenow/sdk-cli-core/dist/command/install/index.js";
import { parseXml, getScopeMetadataFromInstance, getNowTableRequest, monitorUninstallWorkerCompletion, getAppAndSummary } from "@servicenow/sdk-cli-core/dist/util/index.js";
import { makeRequest, parseResponseBody } from "@servicenow/sdk-cli-core/dist/http/index.js";
import { getSafeUserSession } from "@servicenow/sdk-cli-core/dist/util/sessionToken.js";

import { BatchDefinition } from '../../../../src/sn/application/BatchDefinition';
import { ApplicationManager } from '../../../../src/sn/application/ApplicationManager';


import * as path from 'path';
import * as fs from 'fs';
import { info } from "console";


describe('ApplicationManager', () => {
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

    describe('getApplicationDetails', () => {
        it('should get application details', async () => {
            let appManager = new ApplicationManager(instance);
            let result = await appManager.getApplicationDetails('012fa9ad7367ad6393ae5dea97af6f65');
            console.log(result);
            expect(result).toBeDefined();
        });
    });

    describe('serializeBatchDefinition', () => {
        it('should serialize batch definition', async () => {
           let batchDefinition = new BatchDefinition("123", true, "test", "1.0.0", "1.0.0", "test");
           let batchStr = JSON.stringify(batchDefinition);
            expect(batchStr).toBe('{"id":"123","load_demo_data":true,"notes":"test","requested_customization_version":"1.0.0","requested_version":"1.0.0","type":"test"}');
        });
    });


    describe('installBatch', () => {
        it('should install batch', async () => {
            let appManager = new ApplicationManager(instance);
            let result = await appManager.installBatch('/Users/cnanda/git/now-sdk-ext/now-sdk-ext-core/test/data/batchInstallDefinition.json');
            expect(result).toBe(true);
        });
    });

});
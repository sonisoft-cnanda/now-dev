import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
//import { changeApplication } from "@servicenow/sdk-cli-core/dist/command/install/index.js";
import { parseXml, getScopeMetadataFromInstance, getNowTableRequest, monitorUninstallWorkerCompletion, getAppAndSummary } from "@servicenow/sdk-cli-core/dist/util/index.js";
import { makeRequest, parseResponseBody } from "@servicenow/sdk-cli-core/dist/http/index.js";
import { getSafeUserSession } from "@servicenow/sdk-cli-core/dist/util/sessionToken.js";

import { Application } from '../../../src/sn/Application';

import * as path from 'path';
import * as fs from 'fs';
import { info } from "console";


describe('SNAppUninstall', () => {
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

    describe('convertToStoreApp', () => {

        it('should change application for user session', async () => {
            let auth = {credentials: credential};
            let logger = {debug: () => {}, info: () => {}, warn: () => {}, error: () => {}};
            let session = await getSafeUserSession(auth, logger);
           
            var app = new Application(instance,  "x_taniu_tan_core", "c4134c50db6ec910495d70f339961931");
            await app.convertToStoreApp();
        }, 100000);

    });

    describe('changeApplicationTest', () => {

        it('should change application for user session', async () => {
            let auth = {credentials: credential};
            let logger = {debug: () => {}, info: () => {}, warn: () => {}, error: () => {}};
            let session = await getSafeUserSession(auth, logger);
           
            var app = new Application(instance, "a014653c83ef821036c659d0deaad39c", "x_1439397_inver");
            await app.changeApplication();
        }, 100000);

    });

    describe('uninstallNowSDK', () => {

        it('should uninstall', async () => {
            let scopeId = "a014653c83ef821036c659d0deaad39c";
            let scope = "x_1439397_inver";
          
            var app = new Application(instance,scope , scopeId);
            await app.changeApplication();
            await app.uninstall();
           
        }, 100000);

        it('should return csrf token', async () => {
            let scopeId = "a014653c83ef821036c659d0deaad39c";
            let scope = "x_1439397_inver";
            let auth = {credentials: credential};
            let logger = {debug: () => {}, info: () => {}, warn: () => {}, error: () => {}};
            let userSession = await getSafeUserSession(auth, logger);
            const { appID, sys_class_name, upgrade_finished } = await (getAppAndSummary)(scopeId, scope, userSession);
            var app = new Application(instance, "a014653c83ef821036c659d0deaad39c", "x_1439397_inver");
            await app.changeApplication();
            await app.uninstallApplication(userSession, appID, scopeId, sys_class_name, logger);
            console.log(appID, sys_class_name, upgrade_finished);
        }, 100000);

    });

});


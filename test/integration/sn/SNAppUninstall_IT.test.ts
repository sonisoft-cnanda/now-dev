import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
//import { changeApplication } from "@servicenow/sdk-cli-core/dist/command/install/index.js";
import { parseXml, getScopeMetadataFromInstance, getNowTableRequest, monitorUninstallWorkerCompletion, getAppAndSummary } from "@servicenow/sdk-cli-core/dist/util/index.js";
import { makeRequest, parseResponseBody } from "@servicenow/sdk-cli-core/dist/http/index.js";
import { getSafeUserSession } from "@servicenow/sdk-cli-core/dist/util/sessionToken.js";

import { Application } from '../../../src/sn/Application';
import { SN_INSTANCE_ALIAS } from '../../test_utils/test_config';

import * as path from 'path';
import * as fs from 'fs';
import { info } from "console";


describe.skip('SNAppUninstall', () => {
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

    describe('changeApplicationTest', () => {

        it('should change application for user session', async () => {
            const auth = {credentials: credential};
            const logger = {debug: () => {}, info: () => {}, warn: () => {}, error: () => {}};
            const session = await getSafeUserSession(auth, logger);
           
            const app = new Application(instance, "a014653c83ef821036c659d0deaad39c", "x_1439397_inver");
            await app.changeApplication();
        }, 100000);

    });

    describe('uninstallNowSDK', () => {

        it('should uninstall', async () => {
            const scopeId = "a014653c83ef821036c659d0deaad39c";
            const scope = "x_1439397_inver";
          
            const app = new Application(instance,scope , scopeId);
            await app.changeApplication();
            await app.uninstall();
           
        }, 100000);

        it('should return csrf token', async () => {
            const scopeId = "a014653c83ef821036c659d0deaad39c";
            const scope = "x_1439397_inver";
            const auth = {credentials: credential};
            const logger = {debug: () => {}, info: () => {}, warn: () => {}, error: () => {}};
            const userSession = await getSafeUserSession(auth, logger);
            const { appID, sys_class_name, upgrade_finished } = await (getAppAndSummary)(scopeId, scope, userSession);
            const app = new Application(instance, "a014653c83ef821036c659d0deaad39c", "x_1439397_inver");
            await app.changeApplication();
            await app.uninstallApplication(userSession, appID, scopeId, sys_class_name, logger);
            console.log(appID, sys_class_name, upgrade_finished);
        }, 100000);

    });

});


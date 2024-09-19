
import { Creds } from '@servicenow/sdk-cli-core';
import { IHttpResponse } from '../../../src/comm/http/IHttpResponse';
import { CredentialWrapper } from '../../../src/now/sdk/auth/CredentialWrapper';
import { IServiceNowInstance } from '../../../src/sn/IServiceNowInstance';
import { ProjectRequest, SysMetadata } from './../../../src/project/ProjectRequest';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../src/sn/ServiceNowInstance';

describe('ProjectRequest', () => {

    let instance: IServiceNowInstance;
    beforeEach(async ()=>{

        const wrapper:CredentialWrapper = new CredentialWrapper();
        const alias:string = 'fluent-default';
        const credential:Creds = await wrapper.getStoredCredentialsByAlias( alias);
        
         if(credential){
            const snSettings:ServiceNowSettingsInstance = {
            alias: alias,
            host: credential.host,
            password: credential.password,
            username: credential.username,
            }
            instance = new ServiceNowInstance(snSettings);
           
        }
    });
     
    describe('getSysMetadataObjectsForApplication', () => {
        it('should return metadata', async () => {
            const pReq:ProjectRequest = new ProjectRequest(instance);
            const resp: IHttpResponse<SysMetadata> =  await pReq.getSysMetadataObjectsForApplication("7717da92dbd41510495d70f339961943", ['sys_script_include', 'sys_script'], "sys_scope.scope");
       
            expect(resp).not.toBeNull();
            expect(resp.status).toBe(200);
            
        }, 100000);
    });


    describe('getUrlSearchParamsForMetadata', () => {
        it('should return URL Search params', async () => {
            const pReq:ProjectRequest = new ProjectRequest(instance);
            const searchParams:URLSearchParams = pReq.getUrlSearchParamsForMetadata("test", ['sys_script_include', 'sys_script'], "sys_scope.scope");

            expect(searchParams.size).toBe(4);
            expect(searchParams.toString()).toBe("sysparm_fields=sys_id%2Csys_name%2Csys_class_name%2Csys_package%2Csys_package.name%2Csys_scope%2Csys_scope.name%2Csys_scope.scope&sysparm_transaction_scope=test&sysparm_query=sys_class_nameINsys_script_include%2Csys_script&sys_scope=test");
        });
    });

    afterEach(async () => {

    });
});

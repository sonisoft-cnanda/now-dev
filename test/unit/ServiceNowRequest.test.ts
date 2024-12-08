/* eslint-disable @typescript-eslint/no-unused-vars */
import { ServiceNowRequest } from '../../src/comm/http/ServiceNowRequest';
import { IServiceNowInstance } from '../../src/sn/IServiceNowInstance';
import { CredentialWrapper } from '../../src/now/sdk/auth/CredentialWrapper';
import { Creds } from '@servicenow/sdk-cli-core';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../src/sn/ServiceNowInstance';
import { HTTPRequest } from '../../src/comm/http/HTTPRequest';
import { HttpResponse } from '../../src/comm/http/HttpResponse';


describe('ServiceNowRequest', () => {
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
   
    describe('req', () => {
       

        xit('should execute post', async () => {
           const req:ServiceNowRequest = new ServiceNowRequest(instance);

           const request:HTTPRequest = { path: "/api/sn_cicd/progress/6af1439c835b4210a9f8aec0deaad315", headers: null, query: null, body:null};
           
            
        })


        it('should execute get', async () => {
            const req:ServiceNowRequest = new ServiceNowRequest(instance);
 
            const request:HTTPRequest = { path: "/api/now/table/sys_user?sysparm_query=username=chris.nanda", headers: null, query: null, body:null};
            const resp:HttpResponse<unknown> = await req.get(request);
            
             expect(resp).not.toBeNull();
             expect(resp.status).toBe(200);
             
         }, 10000)

         xit('should execute get with bad/no token', async () => {
            const req:ServiceNowRequest = new ServiceNowRequest(instance);
            //pre-set the logged in to true, which should cause the initial call to fail since it believes it is logged in
            req.getAuth().setLoggedIn(true);
 
            const request:HTTPRequest = { path: "/api/now/table/sys_user?sysparm_query=username=chris.nanda", headers: null, query: null, body:null};
            const resp:HttpResponse<unknown> = await req.get(request);
            
             expect(resp).not.toBeNull();
             expect(resp.status).toBe(200);
         }, 10000)

    });

 
    
   
})
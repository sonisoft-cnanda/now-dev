import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as qs from 'qs';
import {SNAuthentication} from '../../src/auth/SNAuthentication';
import { HTTPRequest, HTTPRequestHandler, HttpResponse } from '../../src/comm/http/HTTPRequestHandler';
import { ServiceNowRequest } from '../../src/comm/http/ServiceNowRequest';


describe('ServiceNowRequest', () => {
   
    describe('req', () => {
       

        xit('should execute post', async () => {
           let req:ServiceNowRequest = new ServiceNowRequest();

           let request:HTTPRequest = { path: "/api/sn_cicd/progress/6af1439c835b4210a9f8aec0deaad315", headers: null, query: null, body:null};
           
            
        })


        it('should execute get', async () => {
            let req:ServiceNowRequest = new ServiceNowRequest();
 
            let request:HTTPRequest = { path: "/api/now/table/sys_user?sysparm_query=username=chris.nanda", headers: null, query: null, body:null};
            let resp:HttpResponse<unknown> = await req.get(request);
            
             expect(resp).not.toBeNull();
             expect(resp.status).toBe(200);
             
         })

         xit('should execute get with bad/no token', async () => {
            let req:ServiceNowRequest = new ServiceNowRequest();
            //pre-set the logged in to true, which should cause the initial call to fail since it believes it is logged in
            req.getAuth().setLoggedIn(true);
 
            let request:HTTPRequest = { path: "/api/now/table/sys_user?sysparm_query=username=chris.nanda", headers: null, query: null, body:null};
            let resp:HttpResponse<unknown> = await req.get(request);
            
             expect(resp).not.toBeNull();
             expect(resp.status).toBe(200);
         })

    });

 
    
   
})
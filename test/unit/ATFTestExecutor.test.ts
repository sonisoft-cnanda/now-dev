import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as qs from 'qs';
import {SNAuthentication} from '../../src/auth/SNAuthentication';
import { HTTPRequest, HTTPRequestHandler, HttpResponse } from '../../src/comm/http/HTTPRequestHandler';
import { ServiceNowRequest } from '../../src/comm/http/ServiceNowRequest';
import { ATFTestExecutor, TestResult } from '../../src/sn/ATFTestExecutor';

const SECONDS = 1000;


describe('ATFTestExecutor', () => {
   
    describe('execute test', () => {
       

        xit('defined test', async () => {
            let testExec:ATFTestExecutor = new ATFTestExecutor();
           let resp:TestResult =  await testExec.executeTest('817a3214835b4210a9f8aec0deaad3f4');
           
           expect(resp).not.toBeNull();
            expect(resp.status).toBe("success");

        }, 700 * SECONDS)

       


      

    });

 
    
   
})
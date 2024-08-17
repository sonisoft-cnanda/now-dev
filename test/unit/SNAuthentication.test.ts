import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as qs from 'qs';
import {SNAuthentication} from '../../src/auth/SNAuthentication';
import { HTTPRequest, HTTPRequestHandler, HttpResponse } from '../../src/comm/http/HTTPRequestHandler';


xdescribe('SNAuthentication', () => {
   
    describe('doLogin', () => {
        it('should return gck', async () => {
            let auth:SNAuthentication = SNAuthentication.instance;
            await auth.doLogin("admin", "Qz@sEyj*30GY");
            let gck:string = auth.getToken();
            expect(gck).not.toBeNull();
            expect(auth.isLoggedIn()).toBe(true);
        })

        xit('cookies and gck should allow for request', async () => {
            let auth:SNAuthentication = SNAuthentication.instance;
            await auth.doLogin("admin", "Qz@sEyj*30GY");
            let gck:string = auth.getToken();
            expect(gck).not.toBeNull();
            expect(auth.isLoggedIn()).toBe(true);
            //Test that we are actually logged in
            let requestHandler:HTTPRequestHandler = HTTPRequestHandler.instance;

            let request:HTTPRequest = { path: "/api/sn_cicd/progress/6af1439c835b4210a9f8aec0deaad315", headers: {"X-UserToken": gck, "Cookie": auth.getCookies()}, query: null, body:null};
            let response: HttpResponse<unknown> =  await requestHandler.get(request);
            expect(response).not.toBeNull();
            expect(response.status).toBe(200);

            
        })


        xit('Test Login With login.do', async () => {
            let data = qs.stringify({
            'user_name': 'admin',
            'sys_action': 'sysverb_login',
            'user_password': 'Qz@sEyj*30GY' 
            });

            axios.defaults.withCredentials = true;

            const axiosInstance = axios.create({
                baseURL: "https://dev261189.service-now.com"
            });
            axiosInstance.defaults.maxRedirects = 0;
            axiosInstance.interceptors.response.use(
                response => response,
                error => {
                  if (error.response && [301, 302].includes(error.response.status)) {
                    let cookies = error.response.headers["set-cookie"];
                    const redirectUrl = error.response.headers.location;
                    return axiosInstance.get(redirectUrl, { withCredentials: true, headers: {"cookie": cookies}});
                  }
                  return Promise.reject(error);
                }
              );

              let config = {
                withCredentials: true,
                method: 'post',
                maxBodyLength: Infinity,
                url: '/login.do',
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded', 
                    'Host': 'dev261189.service-now.com',
                    'Accept':'*/*'
                },
                data : data
                } as AxiosRequestConfig;

                
                let response:AxiosResponse = await axiosInstance.request(config);
                expect(response).not.toBeNull();
                expect(response.headers["x-is-logged-in"]).toBe("true");
               
        })

    })

 

   
})
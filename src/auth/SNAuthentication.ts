import { AxiosHeaderValue } from "axios";
import {  HTTPRequestHandler } from "../comm/http/HTTPRequestHandler";
import * as qs from 'qs';
import { ExtensionConfiguration } from "../conf/ExtensionConfiguration";
import { HTTPRequest, HttpResponse } from "../comm";

export class SNAuthentication{
    static #instance: SNAuthentication;
    _requestHandler:HTTPRequestHandler;
    private _gck:string = "";
    private _cookies:any = [];
    private _isLoggedIn:Boolean = false;

    private constructor(requestHandler:HTTPRequestHandler){
       this._requestHandler = requestHandler;
    }

    /**
     * The static getter that controls access to the singleton instance.
     *
     * This implementation allows you to extend the Singleton class while
     * keeping just one instance of each subclass around.
     */
    public static get instance(): SNAuthentication {
        if (!SNAuthentication.#instance) {
            SNAuthentication.#instance = new SNAuthentication(HTTPRequestHandler.instance);
        }

        return SNAuthentication.#instance;
    }


    public async doLogin(username:string, password:string){
      
        let data = qs.stringify({
            'user_name': username,
            'sys_action': 'sysverb_login',
            'user_password': password 
            });

        let request:HTTPRequest = { path: "/login.do", 
                                    headers: {"Content-Type":"application/x-www-form-urlencoded", "Host":ExtensionConfiguration.instance.getServiceNowHost(),  'Accept':'*/*'}, 
                                    query: null, 
                                    body:data};

        try{
            //Since we are re-logging in, clear the cookies in the request handler.  It will fill it's cookies and we will add the additional cookies needed.
            this._requestHandler.clearCookies();
           let response: HttpResponse<unknown> =  await this._requestHandler.post(request);
           if(response.status == 200){
                if(response.headers["x-is-logged-in"] && response.headers["x-is-logged-in"] === "true"){
                    this._isLoggedIn = true;
                    let gck:string = this.parseToken(response.data as string);
                    this._gck = gck;
                    this._cookies = response.headers["set-cookie"];
                    this._requestHandler.setCookies(this._cookies);
                }
           }
        }catch(ex){
            console.log(ex);
        }
        
    }

    public getRequestHandler():HTTPRequestHandler{
        return this._requestHandler;
    }

    public isLoggedIn():Boolean{
        return this._isLoggedIn;
    }

    public setLoggedIn(loggedIn:Boolean){
        this._isLoggedIn = loggedIn;
    }

    public getToken():string{
        return this._gck;
    }

    public getCookies():AxiosHeaderValue{
        return this._cookies;
    }


    private parseToken(body:string):string{
        const regex = /\s*var\s+g_ck\s*=\s*'([^']*)'\s*;/;
        const match = body.match(regex);
        if (match) {
            const value = match[1];
            //console.log(value);
            return value;
        }
        return null;
    }






}
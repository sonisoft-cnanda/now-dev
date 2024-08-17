import { AuthenticationHandlerFactory } from "../../auth/AuthenticationHandlerFactory";
import { IAuthenticationHandler } from "../../auth/IAuthenticationHandler";
import { SNAuthentication } from "../../auth/SNAuthentication";
import { ExtensionConfiguration } from "../../conf/ExtensionConfiguration";
import { HTTPRequest, HTTPRequestHandler, HttpResponse } from "./HTTPRequestHandler";
import { ICookieStore } from "./ICookieStore";
import { IRequestHandler } from "./IRequestHandler";
import { IUserSession } from "./IUserSession";
import { RequestHandlerFactory } from "./RequestHandlerFactory";


export class ServiceNowRequest{
   
    _requestHandler:IRequestHandler;
    auth:IAuthenticationHandler;

    constructor(){
        let self:ServiceNowRequest = this;

        this.auth = AuthenticationHandlerFactory.createAuthHandler();
        this._requestHandler = RequestHandlerFactory.createRequestHandler( this.auth);

        
    }

    public async executeRequest<T>(request: HTTPRequest) : Promise<HttpResponse<T>>{
        let httpMethod:string = request.method;
        let resp:HttpResponse<T> = null;


        if(typeof httpMethod != "undefined" && httpMethod){
            httpMethod = httpMethod.trim().toLowerCase();

            switch(httpMethod){
                case "post":
                    resp = await this.post<T>(request);
                    break;
                case "put":
                    resp = await this.put<T>(request);
                    break;
                case "get":
                    resp = await this.get<T>(request);
                    break;
                case "delete":
                    resp = await this.delete<T>(request);
                    break;
            }

        }else{
            throw new Error("Method must be populated on HTTPRequest object in order to utlize executeRequest.");
        }

       
        return resp;

    }



    public async put<T>(request: HTTPRequest): Promise<HttpResponse<T>>{
        if(!this.isLoggedIn())
            await this.ensureLoggedIn();

        return await this._requestHandler.put<T>(request);
    }

    public async post<T>(request: HTTPRequest): Promise<HttpResponse<T>>{
        if(!this.isLoggedIn())
            await this.ensureLoggedIn();

        return await this._requestHandler.post<T>(request);
    }

    public async get<T>(request: HTTPRequest): Promise<HttpResponse<T>>{
        if(!this.isLoggedIn())
            await this.ensureLoggedIn();

        return await this._requestHandler.get<T>(request);
    }

    public async delete<T>(request: HTTPRequest): Promise<HttpResponse<T>>{
        if(!this.isLoggedIn())
            await this.ensureLoggedIn();

        return await this._requestHandler.delete<T>(request);
    }


    private async ensureLoggedIn(){
       //if(!this.isLoggedIn()){
            
                let session:IUserSession = await this.auth.doLogin(
                    ExtensionConfiguration.instance.getServiceNowInstanceURL(),
                    ExtensionConfiguration.instance.getServiceNowUserName(), 
                    ExtensionConfiguration.instance.getServiceNowPassword()
                );

                if(!this.auth.isLoggedIn()){
                    throw new Error("Unable to login.");
                }

                this._requestHandler.setRequestToken(this.auth.getToken());
                //this._requestHandler._defaultHeaders["cookie"] = this.auth.getCookies();
            
            
        //}
    }

    isLoggedIn():Boolean{
        return this.getAuth().isLoggedIn();
    }

    public getAuth():IAuthenticationHandler{
        return this.auth;
    }

}
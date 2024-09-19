import { AuthenticationHandlerFactory } from "../../auth/AuthenticationHandlerFactory";
import { IAuthenticationHandler } from "../../auth/IAuthenticationHandler";
import { IServiceNowInstance } from "../../sn/IServiceNowInstance";
import { HTTPRequest } from "./HTTPRequest";
import { HttpResponse } from "./HttpResponse";
import { IRequestHandler } from "./IRequestHandler";
import { IUserSession } from "./IUserSession";
import { RequestHandlerFactory } from "./RequestHandlerFactory";


export class ServiceNowRequest{
   
    _instance:IServiceNowInstance;
    _requestHandler:IRequestHandler;
    auth:IAuthenticationHandler;

    _session:IUserSession = null;

    public constructor(instance:IServiceNowInstance){
        this.auth = AuthenticationHandlerFactory.createAuthHandler();
        this._requestHandler = RequestHandlerFactory.createRequestHandler(instance,  this.auth);

        this._instance = instance;
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
            
                this._session = await this.auth.doLogin(
                    this._instance.getHost(),
                    this._instance.getUserName(), 
                   this._instance.getPassword()
                );

                if(!this.auth.isLoggedIn()){
                    throw new Error("Unable to login.");
                }

                this._requestHandler.setRequestToken(this.auth.getToken());
                //this._requestHandler._defaultHeaders["cookie"] = this.auth.getCookies();
            
            
        //}
    }

    isLoggedIn():boolean{
        return this.getAuth().isLoggedIn();
    }

    public getAuth():IAuthenticationHandler{
        return this.auth;
    }

}
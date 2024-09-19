/* eslint-disable @typescript-eslint/no-explicit-any */

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig, RawAxiosRequestHeaders, AxiosHeaderValue } from 'axios';

import { HTTPRequest } from './HTTPRequest';
import { IHttpResponse } from './IHttpResponse';
import { IRequestHandler } from './IRequestHandler';
import { Cookie } from 'tough-cookie';
import { ICookieStore } from './ICookieStore';
import { IAuthenticationHandler } from '../../auth/IAuthenticationHandler';
import { Logger } from '../../util/Logger';
import { IServiceNowInstance } from '../../sn/IServiceNowInstance';
import { isNil } from "../../amb/Helper";


axios.defaults.withCredentials = true;

export class RequestHandler implements IRequestHandler{
   
    _logger:Logger = new Logger("RequestHandler");
    _defaultHeaders:RawAxiosRequestHeaders;
    httpClient:AxiosInstance;
    _cookies: Cookie[];

    _cookieStore:ICookieStore;
    _authHandler:IAuthenticationHandler;

    private _snInstance: IServiceNowInstance;
    public get snInstance(): IServiceNowInstance {
        return this._snInstance;
    }
    public set snInstance(value: IServiceNowInstance) {
        this._snInstance = value;
    }

    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    public constructor(snInstance:IServiceNowInstance, authHandler:IAuthenticationHandler) {
        this.snInstance = snInstance;
        this._defaultHeaders = {} as RawAxiosRequestHeaders;
       this._authHandler = authHandler;
        
        //Need to get the config from the extension info
        //baseURL should be instance URL that was added to settings
        //todo: Updated with settings config
        this.httpClient = axios.create({
            withCredentials: true,
            baseURL: this.snInstance.getHost(),
          });

        this.httpClient.defaults.maxRedirects = 0;
         
     }

    public getHttpClient():AxiosInstance{
        return this.httpClient;
    }

    //FIXME: This should pull a more variable instance url
    public async getCookies() : Promise<Cookie[]> {
        return await this._authHandler.getCookies().getCookies( this.snInstance.getHost());
    }

    public async getCookieString():Promise<string>{
        return await this._authHandler.getCookies().getCookieString(this.snInstance.getHost());
    }

    public setRequestToken(token:string){
        this._defaultHeaders["X-Usertoken"]  = token as AxiosHeaderValue;
    }

    public async request(config:AxiosRequestConfig):Promise<AxiosResponse<any,any>>{

        for(const prop in this._defaultHeaders){
            if(typeof this._defaultHeaders[prop] !='undefined' && this._defaultHeaders[prop])
                config.headers[prop] = this._defaultHeaders[prop];
        }
        config.headers["Cookie"] = await this.getCookieString();
        return this.httpClient.request(config);
    }


    public async post<T>(request: HTTPRequest) : Promise<IHttpResponse<T>> {

        const {config, url} = await this.getRequestConfig(request);
        this._logger.debug("Retrieved Configuration", {config:config, url:url});
        let response:IHttpResponse<T> = null;
       try{
            response = await this.httpClient.post(url, request.body , config);
            this._logger.debug("Http  POST Response Received", response);
            try{
                if(!((response.data) instanceof String) ){
                    const rpObj: T | null = response.data as T;
                    response.bodyObject = rpObj;
                }
            }catch(ex){
                this._logger.error("Error setting response.bodyObject.", {error:ex as Error, response: response, request: request});
            }
            
            return response;
       }catch(ex){
            const err:Error = ex as Error;
            this._logger.error("Error during POST request.", {error:err, response: response, request: request});
            throw err;
       }
        

        return null;
    }

    public async put<T>(request: HTTPRequest) : Promise<IHttpResponse<T>> {

        const {config, url} = await this.getRequestConfig(request);
        this._logger.debug("Retrieved Configuration", {config:config, url:url});
        let response:IHttpResponse<T> = null;
       try{
            response = await this.httpClient.put(url, request.body , config);
            this._logger.debug("Http PUT Response Received", response);
            try{
                if(!((response.data) instanceof String) ){
                    const rpObj: T | null = response.data as T;
                    response.bodyObject = rpObj;
                }
            }catch(ex){
                const err:Error = ex as Error;
                this._logger.error("Error during PUT request.", {err, request});
                throw err;
                //console.log(ex);
            }
            
            return response;
       }catch(ex){
            const err:Error = ex as Error;
            this._logger.error("Error during PUT request.", {err, request});
            throw err;
       }
        

    }

    public async get<T>(request: HTTPRequest) : Promise<IHttpResponse<T>> {
        this._logger.debug("get", request);

        const {config, url} =  await this.getRequestConfig(request);

        this._logger.debug("Retrieved Configuration", {config:config, url:url});
        let response:IHttpResponse<T> = null;
       try{
        response = await this.httpClient.get(url , config);
        this._logger.debug("Http Response Received", response);

        try{
            if(!((response.data) instanceof String) ){
                const rpObj: T | null = response.data as T;
                response.bodyObject = rpObj;
            }
        }catch(ex){
            const err:Error = ex as Error;
            this._logger.error("Error setting response.bodyObject.", {error:err, response: response, request: request});
            throw err;
        }

        return response;
       }catch(ex){
            const err:Error = ex as Error;
            this._logger.error("Error setting response.bodyObject.", {error:err, response: response, request: request});
            throw err;
       }
        
    }

    public async delete<T>(request: HTTPRequest) : Promise<IHttpResponse<T>> {

        const {config, url} = await this.getRequestConfig(request);
            
       try{
        const response: IHttpResponse<T> = await this.httpClient.delete(url , config);

        try{
            if(!((response.data) instanceof String) ){
                const rpObj: T | null = response.data as T;
                response.bodyObject = rpObj;
            }
        }catch(ex){
            const err:Error = ex as Error;
            this._logger.error("Error setting response.bodyObject.", {error:err, response: response, request: request});
            throw err;
        }

        return response;
       }catch(ex){
            const err:Error = ex as Error;
            this._logger.error("Error setting response.bodyObject.", {error:err, request: request});
            throw err;
       }
        

    }

    private async getRequestConfig(request: HTTPRequest):Promise<{ config: AxiosRequestConfig; url: string; }>{
       
        const config:AxiosRequestConfig = {
                                                withCredentials: true, 
                                                headers:this._defaultHeaders
                                            };
        let url:string = request.path;
       
        if(request.headers != null){
            for(const prop in request.headers){
                if(!isNil(request.headers[prop])){
                    const val:string = request.headers[prop] as string;
                    config.headers[prop] = val;
                }
                    
            }
        }
        config.headers["Cookie"] = await this.getCookieString();
        if(request.query != null){
            const strQuery = this.getQueryString(request.query);
            if(url.indexOf("?") == -1){
                url += "?" + strQuery;
            }else{
                url += "&" + strQuery;
            }
        }

        return {config: config, url: url};
    }

    private getQueryString(queryObj:object):string{

        const params = new URLSearchParams();
      
      
        for(const prop in queryObj){
            params.set(prop, queryObj[prop] as string);
        }

        return params.toString();;
    }


  

}

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios';
import { ExtensionConfiguration } from '../../conf/ExtensionConfiguration';
import { HTTPRequest } from './HTTPRequest';
import { HttpResponse } from './HttpResponse';

axios.defaults.withCredentials = true;

export class HTTPRequestHandler{
    static #instance: HTTPRequestHandler;
    _defaultHeaders:RawAxiosRequestHeaders;
    httpClient:AxiosInstance;
    _cookies: never[];
    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    private constructor() {
        //Need to get the config from the extension info
        //baseURL should be instance URL that was added to settings
        //todo: Updated with settings config
        this.httpClient = axios.create({
            withCredentials: true,
            baseURL: ExtensionConfiguration.instance.getServiceNowInstanceURL(),
          });

          this.httpClient.defaults.maxRedirects = 0;
          this.httpClient.interceptors.response.use(
                response => response,
                error => {
                  if (error.response && [301, 302].includes(error.response.status)) {
                    const cookies = error.response.headers["set-cookie"];
                    this.setCookies(cookies);
                    const redirectUrl = error.response.headers.location;
                    return this.httpClient.get(redirectUrl, { withCredentials: true, headers: {"cookie": cookies}});
                  }
                  return Promise.reject(error);
                }
              );

              this._defaultHeaders = {} as RawAxiosRequestHeaders;
     }

    /**
     * The static getter that controls access to the singleton instance.
     *
     * This implementation allows you to extend the Singleton class while
     * keeping just one instance of each subclass around.
     */
    public static get instance(): HTTPRequestHandler {
        if (!HTTPRequestHandler.#instance) {
            HTTPRequestHandler.#instance = new HTTPRequestHandler();
        }

        return HTTPRequestHandler.#instance;
    }

    public getHttpClient():AxiosInstance{
        return this.httpClient;
    }

    public setCookies(addCookies:any){
        this._cookies = this._cookies.concat(addCookies);
    }

    public clearCookies(){
        this._cookies = [];
    }

    public async request(config:AxiosRequestConfig):Promise<AxiosResponse<any,any>>{

        for(const prop in this._defaultHeaders){
            if(typeof this._defaultHeaders[prop] !='undefined' && this._defaultHeaders[prop])
                config.headers[prop] = this._defaultHeaders[prop];
        }
        config.headers["Cookie"] = this._cookies;
        return this.httpClient.request(config);
    }


    public async post<T>(request: HTTPRequest) : Promise<HttpResponse<T>> {

        const {config, url} = this.getRequestConfig(request);
            
       try{
        const response: HttpResponse<T> = await this.httpClient.post(url, request.body , config);

        try{
            if(!((response.data) instanceof String) ){
                const rpObj: T | null = response.data as T;
                response.bodyObject = response.data;
            }
        }catch(ex){
            //console.log(ex);
        }
        
        return response;
       }catch(ex){
        //log error
        //console.log(ex);
        throw new Error(ex);
       }
        

        return null;
    }

    public async put<T>(request: HTTPRequest) : Promise<HttpResponse<T>> {

        const {config, url} = this.getRequestConfig(request);
            
       try{
        const response: HttpResponse<T> = await this.httpClient.put(url, request.body , config);

        try{
            if(!((response.data) instanceof String) ){
                const rpObj: T | null = response.data as T;
                response.bodyObject = response.data;
            }
        }catch(ex){
            //console.log(ex);
        }
        
        return response;
       }catch(ex){
        //log error
        //console.log(ex);
        throw new Error(ex);
       }
        

        return null;
    }

    public async get<T>(request: HTTPRequest) : Promise<HttpResponse<T>> {

        const {config, url} = this.getRequestConfig(request);
            
       try{
        const response: HttpResponse<T> = await this.httpClient.get(url , config);

        try{
            if(!((response.data) instanceof String) ){
                const rpObj: T | null = response.data as T;
                response.bodyObject = response.data;
            }
        }catch(ex){
            console.log(ex);
        }

        return response;
       }catch(ex){
        //log error
        console.log(ex);
       }
        

        return null;
    }

    public async delete<T>(request: HTTPRequest) : Promise<HttpResponse<T>> {

        const {config, url} = this.getRequestConfig(request);
            
       try{
        const response: HttpResponse<T> = await this.httpClient.delete(url , config);

        try{
            if(!((response.data) instanceof String) ){
                const rpObj: T | null = response.data as T;
                response.bodyObject = response.data;
            }
        }catch(ex){
            console.log(ex);
        }

        return response;
       }catch(ex){
        //log error
        console.log(ex);
       }
        

        return null;
    }

    private getRequestConfig(request: HTTPRequest):{config:AxiosRequestConfig, url:string}{
       
        const config:AxiosRequestConfig = {
                                                withCredentials: true, 
                                                headers:this._defaultHeaders
                                            };
        let url:string = request.path;
       
        if(request.headers != null){
            for(const prop in request.headers){
                config.headers[prop] = request.headers[prop];
            }
        }
        config.headers["Cookie"] = this._cookies;
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
        let queryStr = "";
        for(const prop in queryObj){
            if(queryStr != "")
                queryStr += "&";
            queryStr += prop + "=" + encodeURIComponent(queryObj[prop]);
        }

        return queryStr;
    }


  

}
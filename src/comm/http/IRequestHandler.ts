import { HTTPRequest } from "./HTTPRequest";
import { IHttpResponse } from "./IHttpResponse";
import { Cookie } from 'tough-cookie';

export interface IRequestHandler{
    post<T>(request: HTTPRequest) : Promise<IHttpResponse<T>> ;
    
    put<T>(request: HTTPRequest) : Promise<IHttpResponse<T>> ;

    get<T>(request: HTTPRequest) : Promise<IHttpResponse<T>> ;

    delete<T>(request: HTTPRequest) : Promise<IHttpResponse<T>> ;

    //request(config:AxiosRequestConfig):Promise<AxiosResponse<any,any>>;
    setRequestToken(token:String);

    getCookies() : Promise<Cookie[]> ;

}
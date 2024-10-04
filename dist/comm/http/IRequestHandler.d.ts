import { HTTPRequest } from "./HTTPRequest.js";
import { IHttpResponse } from "./IHttpResponse.js";
import { Cookie } from 'tough-cookie';
export interface IRequestHandler {
    post<T>(request: HTTPRequest): Promise<IHttpResponse<T>>;
    put<T>(request: HTTPRequest): Promise<IHttpResponse<T>>;
    get<T>(request: HTTPRequest): Promise<IHttpResponse<T>>;
    delete<T>(request: HTTPRequest): Promise<IHttpResponse<T>>;
    setRequestToken(token: string): any;
    getCookies(): Promise<Cookie[]>;
}

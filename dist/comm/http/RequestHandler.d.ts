import { AxiosInstance, AxiosResponse, AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios';
import { HTTPRequest } from './HTTPRequest.js';
import { IHttpResponse } from './IHttpResponse.js';
import { IRequestHandler } from './IRequestHandler.js';
import { Cookie } from 'tough-cookie';
import { ICookieStore } from './ICookieStore.js';
import { IAuthenticationHandler } from '../../auth/IAuthenticationHandler.js';
import { Logger } from '../../util/Logger.js';
import { IServiceNowInstance } from '../../sn/IServiceNowInstance.js';
export declare class RequestHandler implements IRequestHandler {
    _logger: Logger;
    _defaultHeaders: RawAxiosRequestHeaders;
    httpClient: AxiosInstance;
    _cookies: Cookie[];
    _cookieStore: ICookieStore;
    _authHandler: IAuthenticationHandler;
    private _snInstance;
    get snInstance(): IServiceNowInstance;
    set snInstance(value: IServiceNowInstance);
    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    constructor(snInstance: IServiceNowInstance, authHandler: IAuthenticationHandler);
    getHttpClient(): AxiosInstance;
    getCookies(): Promise<Cookie[]>;
    getCookieString(): Promise<string>;
    setRequestToken(token: string): void;
    request(config: AxiosRequestConfig): Promise<AxiosResponse<any, any>>;
    post<T>(request: HTTPRequest): Promise<IHttpResponse<T>>;
    put<T>(request: HTTPRequest): Promise<IHttpResponse<T>>;
    get<T>(request: HTTPRequest): Promise<IHttpResponse<T>>;
    delete<T>(request: HTTPRequest): Promise<IHttpResponse<T>>;
    private getRequestConfig;
    private getQueryString;
}

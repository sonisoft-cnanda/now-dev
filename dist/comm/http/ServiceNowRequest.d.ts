import { IAuthenticationHandler } from "../../auth/IAuthenticationHandler.js";
import { IServiceNowInstance } from "../../sn/IServiceNowInstance.js";
import { HTTPRequest } from "./HTTPRequest.js";
import { HttpResponse } from "./HttpResponse.js";
import { IRequestHandler } from "./IRequestHandler.js";
import { IUserSession } from "./IUserSession.js";
export declare class ServiceNowRequest {
    _instance: IServiceNowInstance;
    _requestHandler: IRequestHandler;
    auth: IAuthenticationHandler;
    _session: IUserSession;
    constructor(instance: IServiceNowInstance);
    executeRequest<T>(request: HTTPRequest): Promise<HttpResponse<T>>;
    put<T>(request: HTTPRequest): Promise<HttpResponse<T>>;
    post<T>(request: HTTPRequest): Promise<HttpResponse<T>>;
    get<T>(request: HTTPRequest): Promise<HttpResponse<T>>;
    delete<T>(request: HTTPRequest): Promise<HttpResponse<T>>;
    private ensureLoggedIn;
    isLoggedIn(): boolean;
    getAuth(): IAuthenticationHandler;
}

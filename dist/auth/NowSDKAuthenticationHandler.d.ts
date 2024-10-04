import { IRequestHandler } from "../comm/http/IRequestHandler.js";
import { IAuthenticationHandler } from "./IAuthenticationHandler.js";
import { ICookieStore } from "../comm/http/ICookieStore.js";
import { IUserSession } from "../comm/http/IUserSession.js";
export declare class NowSDKAuthenticationHandler implements IAuthenticationHandler {
    private _requestHandler;
    private _isLoggedIn;
    private _session;
    private _logger;
    constructor();
    doLogin(host: string, username: string, password: string): Promise<IUserSession>;
    private login;
    getRequestHandler(): IRequestHandler;
    isLoggedIn(): boolean;
    setLoggedIn(loggedIn: boolean): void;
    getToken(): string;
    getCookies(): ICookieStore;
}

import { ICookieStore } from "../comm/http/ICookieStore";
import { IRequestHandler } from "../comm/http/IRequestHandler";


export interface IAuthenticationHandler{

    doLogin(host:string, username:string, password:string);

    getRequestHandler():IRequestHandler;

    isLoggedIn():Boolean;

    setLoggedIn(loggedIn:Boolean);

    getToken():string;

    getCookies():ICookieStore;
}
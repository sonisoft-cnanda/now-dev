import { ICookieStore } from "../comm/http/ICookieStore";
import { IRequestHandler } from "../comm/http/IRequestHandler";


export interface IAuthenticationHandler{

    doLogin(host:string, username:string, password:string);

    getRequestHandler():IRequestHandler;

    isLoggedIn():boolean;

    setLoggedIn(loggedIn:boolean);

    getToken():string;

    getCookies():ICookieStore;
}
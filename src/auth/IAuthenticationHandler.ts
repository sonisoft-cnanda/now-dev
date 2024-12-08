import { ICookieStore } from "../comm/http/ICookieStore.js";
import { IRequestHandler } from "../comm/http/IRequestHandler.js";
import { IUserSession } from "../comm/http/IUserSession.js";


export interface IAuthenticationHandler{

    doLogin(host:string, username:string, password:string) : Promise<IUserSession>;

    getRequestHandler():IRequestHandler;

    isLoggedIn():boolean;

    setLoggedIn(loggedIn:boolean);

    getToken():string;

    getCookies():ICookieStore;
}
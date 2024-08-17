import { ICookieStore } from "./ICookieStore";


export interface IUserSession{
    getCookies():ICookieStore;
    getToken():string;
}
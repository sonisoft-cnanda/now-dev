
import { Cookie } from 'tough-cookie';

export interface ICookieStore{
    getCookies(currentUrl:string, options?:any) : Promise<Cookie[]>;
    getCookieString(currentUrl:string):Promise<string>;
}
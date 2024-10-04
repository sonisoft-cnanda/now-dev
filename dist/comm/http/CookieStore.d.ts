import { ICookieStore } from "./ICookieStore.js";
import { CookieJar, Cookie } from 'tough-cookie';
export declare class CookieStore implements ICookieStore {
    private _cookieJar;
    constructor(cookieJar: CookieJar);
    getCookies(currentUrl: string, options?: CookieJar.GetCookiesOptions): Promise<Cookie[]>;
    getCookieString(currentUrl: string): Promise<string>;
}

import { ICookieStore } from "./ICookieStore.js";
import { CookieJar } from 'tough-cookie';
export declare class CookieStoreFactory {
    static createCookieStore(cookieJar: CookieJar | null): ICookieStore;
}

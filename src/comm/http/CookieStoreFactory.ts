
import { isNil } from "../../util/utils";
import { CookieStore } from "./CookieStore";
import { ICookieStore } from "./ICookieStore";
import { CookieJar } from 'tough-cookie';

export class CookieStoreFactory{


    public static createCookieStore(cookieJar:CookieJar | null):ICookieStore{
        if(isNil(cookieJar)){
            return null;
        }
        
        return new CookieStore(cookieJar);
    }
}
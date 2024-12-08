
import { isNil } from "../../util/utils";
import { ICookieStore } from "./ICookieStore";
import { CookieJar, Cookie } from 'tough-cookie';

export class CookieStore implements ICookieStore{

    private _cookieJar:CookieJar;
    public constructor(cookieJar:CookieJar){
        this._cookieJar = cookieJar;
    }


    public async getCookies(currentUrl:string, options?:CookieJar.GetCookiesOptions) : Promise<Cookie[]> {
       
        let cookies:Cookie[] = null;

        if(isNil(options)){
            cookies = await this._cookieJar.getCookies(currentUrl);
        }else{
            cookies = await this._cookieJar.getCookies(currentUrl, options);
        }
       

        return cookies;
    }

    public async getCookieString(currentUrl:string):Promise<string>{
        return await this._cookieJar.getCookieString(currentUrl);
    }
}
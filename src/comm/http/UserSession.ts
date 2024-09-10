import { UISession } from "@servicenow/sdk-cli-core";
import { ICookieStore } from "./ICookieStore";
import { CookieStoreFactory } from "./CookieStoreFactory";
import { IUserSession } from "./IUserSession";
import { isNil } from "../../amb/Helper";


export class UserSession implements IUserSession{
    
    private _nowSession:UISession;


    public constructor(session:UISession){
        this._nowSession = session;
    }

    public getCookies():ICookieStore{
        if(isNil(this._nowSession.cookieJar)){
            return null;
        }

        return CookieStoreFactory.createCookieStore(this._nowSession.cookieJar);
    }

    public getToken():string{
        return this._nowSession.userToken;
    }

}
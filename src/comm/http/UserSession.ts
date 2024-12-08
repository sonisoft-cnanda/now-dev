import { UISession } from "@servicenow/sdk-cli-core";
import { ICookieStore } from "./ICookieStore";
import { CookieStoreFactory } from "./CookieStoreFactory";
import { IUserSession } from "./IUserSession";
import { isNil } from "../../util/utils";



export class UserSession implements IUserSession{
    
    private _nowSession: UISession;
    public get nowSession(): UISession {
        return this._nowSession;
    }
    public set nowSession(value: UISession) {
        this._nowSession = value;
    }


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
import { UISession } from "@servicenow/sdk-cli-core";
import { ICookieStore } from "./ICookieStore";


export interface IUserSession{
    getCookies():ICookieStore;
    getToken():string;

    get nowSession(): UISession;

    set nowSession(value: UISession);
}
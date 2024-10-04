import { UISession } from "@servicenow/sdk-cli-core";
import { ICookieStore } from "./ICookieStore.js";
import { IUserSession } from "./IUserSession.js";
export declare class UserSession implements IUserSession {
    private _nowSession;
    get nowSession(): UISession;
    set nowSession(value: UISession);
    constructor(session: UISession);
    getCookies(): ICookieStore;
    getToken(): string;
}

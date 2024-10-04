import { CookieStoreFactory } from "./CookieStoreFactory.js";
import { isNil } from "../../util/utils.js";
export class UserSession {
    _nowSession;
    get nowSession() {
        return this._nowSession;
    }
    set nowSession(value) {
        this._nowSession = value;
    }
    constructor(session) {
        this._nowSession = session;
    }
    getCookies() {
        if (isNil(this._nowSession.cookieJar)) {
            return null;
        }
        return CookieStoreFactory.createCookieStore(this._nowSession.cookieJar);
    }
    getToken() {
        return this._nowSession.userToken;
    }
}
//# sourceMappingURL=UserSession.js.map
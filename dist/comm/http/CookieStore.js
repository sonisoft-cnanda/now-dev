import { isNil } from "../../util/utils.js";
export class CookieStore {
    _cookieJar;
    constructor(cookieJar) {
        this._cookieJar = cookieJar;
    }
    async getCookies(currentUrl, options) {
        let cookies = null;
        if (isNil(options)) {
            cookies = await this._cookieJar.getCookies(currentUrl);
        }
        else {
            cookies = await this._cookieJar.getCookies(currentUrl, options);
        }
        return cookies;
    }
    async getCookieString(currentUrl) {
        return await this._cookieJar.getCookieString(currentUrl);
    }
}
//# sourceMappingURL=CookieStore.js.map
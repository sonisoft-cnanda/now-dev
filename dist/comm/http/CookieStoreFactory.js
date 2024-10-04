import { isNil } from "../../util/utils.js";
import { CookieStore } from "./CookieStore.js";
export class CookieStoreFactory {
    static createCookieStore(cookieJar) {
        if (isNil(cookieJar)) {
            return null;
        }
        return new CookieStore(cookieJar);
    }
}
//# sourceMappingURL=CookieStoreFactory.js.map
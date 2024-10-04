import { Logger } from "../util/Logger.js";
import { login } from "@servicenow/sdk-cli-core";
import { UserSession } from "../comm/http/UserSession.js";
export class NowSDKAuthenticationHandler {
    _requestHandler;
    _isLoggedIn = false;
    _session;
    _logger;
    constructor() {
        this._logger = new Logger("NowSDKAuthenticationHandler");
    }
    async doLogin(host, username, password) {
        const session = await this.login(host, username, password);
        this._session = session;
        return session;
    }
    async login(host, username, password) {
        let result = null;
        try {
            const credentials = {
                host: host,
                username: username,
                password: password,
            };
            result = await login(credentials, this._logger);
            //FIXME: This needs to be changed to be a variable host
            if ((await result.cookieJar.getCookies(host)).length > 0) {
                this.setLoggedIn(true);
            }
            ;
            this._logger.debug("Login Attempt Complete.", result);
        }
        catch (e) {
            this._logger.error("Error during login.", e);
        }
        return new UserSession(result);
    }
    getRequestHandler() {
        return this._requestHandler;
    }
    isLoggedIn() {
        return this._isLoggedIn;
    }
    setLoggedIn(loggedIn) {
        this._isLoggedIn = loggedIn;
    }
    getToken() {
        return this._session.getToken();
    }
    getCookies() {
        return this._session.getCookies();
    }
}
//# sourceMappingURL=NowSDKAuthenticationHandler.js.map
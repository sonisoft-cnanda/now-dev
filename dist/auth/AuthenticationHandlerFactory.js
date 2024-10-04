import { NowSDKAuthenticationHandler } from "./NowSDKAuthenticationHandler.js";
export class AuthenticationHandlerFactory {
    static createAuthHandler() {
        return new NowSDKAuthenticationHandler();
    }
}
//# sourceMappingURL=AuthenticationHandlerFactory.js.map
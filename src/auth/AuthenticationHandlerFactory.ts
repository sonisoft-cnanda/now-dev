import { IAuthenticationHandler } from "./IAuthenticationHandler.js";
import { NowSDKAuthenticationHandler } from "./NowSDKAuthenticationHandler.js";


export class AuthenticationHandlerFactory{


    public static createAuthHandler():IAuthenticationHandler{
        return new NowSDKAuthenticationHandler();
    }
}
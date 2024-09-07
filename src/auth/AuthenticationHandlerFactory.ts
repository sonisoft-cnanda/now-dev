import { IAuthenticationHandler } from "./IAuthenticationHandler";
import { NowSDKAuthenticationHandler } from "./NowSDKAuthenticationHandler";


export class AuthenticationHandlerFactory{


    public static createAuthHandler():IAuthenticationHandler{
        return new NowSDKAuthenticationHandler();
    }
}
import { ServiceNowInstance } from "../sn/ServiceNowInstance";
import { IAuthenticationHandler } from "./IAuthenticationHandler";
import { NowSDKAuthenticationHandler } from "./NowSDKAuthenticationHandler";


export class AuthenticationHandlerFactory{


    public static createAuthHandler(instance:ServiceNowInstance):IAuthenticationHandler{
        return new NowSDKAuthenticationHandler(instance);
    }
}
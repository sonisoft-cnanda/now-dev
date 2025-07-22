//import { UISession } from "@servicenow/sdk-cli-core/dist/util/UISession";
import { IRequestHandler } from "../comm/http/IRequestHandler";
import { Logger } from "../util/Logger";
import { IAuthenticationHandler } from "./IAuthenticationHandler";
//import { Creds, login } from "@servicenow/sdk-cli-core/dist/command/login";
import { ICookieStore } from "../comm/http/ICookieStore";
import { ServiceNowInstance } from "../sn/ServiceNowInstance";
import { getSafeUserSession } from "@servicenow/sdk-cli-core/dist/util/sessionToken.js";


export class NowSDKAuthenticationHandler implements IAuthenticationHandler{

    private _requestHandler:IRequestHandler;
  
    private _isLoggedIn:Boolean = false;

    private _session:any;

    private _logger:any;

    private _instance:ServiceNowInstance;

    public constructor(instance:ServiceNowInstance){
        this._logger = new Logger("NowSDKAuthenticationHandler");
        this._instance = instance;
    }

    public async doLogin() : Promise<any>{
        let session:any =  await this.login();
        this._session = session;

        return session;
    }

    private async login() : Promise<any>{

        try{
            let auth = {credentials: this._instance.credential};
            let session = await getSafeUserSession(auth, this._logger);
            if(session){
                this._requestHandler.setSession(session);
                this.setLoggedIn(true);
            }else{
                throw new Error("Unable to login.");
            }
           
            this._logger.debug("Login Attempt Complete.");
            return session;
        }catch(e){
            this._logger.error("Error during login.", e);
        }
        return null;
    }

    public getRequestHandler():IRequestHandler{
        return this._requestHandler;
    }

    public setRequestHandler(requestHandler:IRequestHandler){
        this._requestHandler = requestHandler;
    }

    public isLoggedIn():Boolean{
        return this._isLoggedIn;
    }

    public setLoggedIn(loggedIn:Boolean){
        this._isLoggedIn = loggedIn;
    }

    public getToken():string{
        return this._session.getToken();
    }

    public getCookies():ICookieStore{
        return this._session.getCookies();
    }
}
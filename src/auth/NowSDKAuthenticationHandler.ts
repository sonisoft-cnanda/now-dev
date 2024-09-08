import { UISession } from "@servicenow/sdk-cli-core/dist/util/UISession";
import { IRequestHandler } from "../comm/http/IRequestHandler";
import { Logger } from "../util/Logger";
import { IAuthenticationHandler } from "./IAuthenticationHandler";
import { Creds, login } from "@servicenow/sdk-cli-core/dist/command/login";
import { logger } from "@servicenow/sdk-cli/dist/logger";
import { ICookieStore } from "../comm/http/ICookieStore";
import { IUserSession } from "../comm/http/IUserSession";
import { UserSession } from "../comm/http/UserSession";
import { ExtensionConfiguration } from "../conf/ExtensionConfiguration";


export class NowSDKAuthenticationHandler implements IAuthenticationHandler{

    private _requestHandler:IRequestHandler;
  
    private _isLoggedIn:Boolean = false;

    private _session:IUserSession;

    private _logger:any;

    public constructor(){
        this._logger = new Logger("NowSDKAuthenticationHandler");
    }

    public async doLogin(host:string, username:string, password:string) : Promise<IUserSession>{
        let session:IUserSession =  await this.login(host, username, password);
        this._session = session;

        return session;
    }

    private async login(host:string, username:string, password:string) : Promise<IUserSession>{

        let result:UISession | null = null;
        try{
            const credentials: Creds = {
                host: host,
                username: username,
                password: password,
            } as Creds;

            result = await login(credentials, logger);
            //FIXME: This needs to be changed to be a variable host
            if((await result.cookieJar.getCookies(host)).length > 0){
                this.setLoggedIn(true);
            };
            this._logger.debug("Login Attempt Complete.", result);
        }catch(e){
            this._logger.error("Error during login.", e);
        }
        return new UserSession(result);
    }

    public getRequestHandler():IRequestHandler{
        return this._requestHandler;
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
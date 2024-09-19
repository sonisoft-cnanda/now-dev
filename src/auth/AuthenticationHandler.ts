import { UISession } from "@servicenow/sdk-cli-core";
import { IAuthenticationHandler } from "./IAuthenticationHandler.js";
import { Creds, login } from "@servicenow/sdk-cli-core";
import { Logger } from '../util/Logger.js';
import { IRequestHandler } from "../comm/http/IRequestHandler.js";

import { ICookieStore } from "../comm/http/ICookieStore.js";
import { IUserSession } from "../comm/http/IUserSession.js";
import { UserSession } from "../comm/http/UserSession.js";



export class AuthenticationHandler implements IAuthenticationHandler{


    private _requestHandler:IRequestHandler;
    private _gck = "";
    private _cookies:ICookieStore;
    private _isLoggedIn = false;

    private _logger:Logger;

    public constructor(){
        this._logger = new Logger("SNAuthWrapper");

        // this._requestHandler.getHttpClient().interceptors.response.use(
        //     (response) => response,
        //     async (error) => {
        //       if (error.response && error.response.status === 401) {
        //         // Access token has expired, refresh it
        //         try {
        //             this.auth.setLoggedIn(false);
        //             await self.ensureLoggedIn();
                  
        //           console.error("Received 401. Ran ensureLoggedIn. Result: " + JSON.stringify(this.auth));
        //           return this._requestHandler.request(error.config);
        //         } catch (refreshError) {
        //           // Handle token refresh error
        //           throw refreshError;
        //         }
        //       }
        //       return Promise.reject(error);
        //     }
        //   );
    }

    public async doLogin(host:string, username:string, password:string) : Promise<IUserSession>{
        return await this.login(host, username, password);
      
    }


    private async login(host:string, username:string, password:string) : Promise<IUserSession>{

        let result:UISession | null = null;
        try{
            const credentials: Creds = {
                host: host,
                username: username,
                password: password,
            } as Creds;

            result = await login(credentials, this._logger);
            this._logger.debug("Login Attempt Complete.", result);
        }catch(e){
            this._logger.error("Error during login.", e);
            throw e;
        }
        if(result){
            return new UserSession(result);
        }
        
        return null;
    }

    public getRequestHandler():IRequestHandler{
        return this._requestHandler;
    }

    public isLoggedIn():boolean{
        return this._isLoggedIn;
    }

    public setLoggedIn(loggedIn:boolean){
        this._isLoggedIn = loggedIn;
    }

    public getToken():string{
        return this._gck;
    }

    public getCookies():ICookieStore{
        return this._cookies;
    }

}
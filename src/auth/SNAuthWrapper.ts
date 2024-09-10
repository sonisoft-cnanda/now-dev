import { Creds } from '@servicenow/sdk-cli-core';
import { login } from '@servicenow/sdk-cli-core';
import { UISession } from '@servicenow/sdk-cli-core';
import { Logger } from '../util/Logger.js';
export class SNAuthWrapper{

    private _logger:any;

    public constructor(){
        this._logger = new Logger("SNAuthWrapper");
    }

    public async doLogin(){
      
        try {


            const credentials: Creds = {
                host: "https://ven01280.service-now.com",
                username: "chris.nanda",
                password: "D$adP00l$G$$k0ut",
            } as Creds;

            const session = await login(credentials, this._logger)
           
            if (!session) {
                // throw new Error(
                //     'Unauthorized. Use the $now-sdk login command first to authenticate before using $now-sdk fetch.',
                //     {
                //         type: 'login_failed',
                //         command: 'fetch',
                //     }
                // )
            }
        
            const { instanceUrl, cookieJar, userToken } = session

        } catch (error) {
           
        }
    }


    public async login(host:string, username:string, password:string) : Promise<UISession>{

        let result:UISession | null = null;
        try{
            const credentials: Creds = {
                host: host,
                username: username,
                password: password,
            } as Creds;

            result = await login(credentials, this._logger)
            this._logger.debug("Login Attempt Complete.", result);
        }catch(e){
            this._logger.error("Error during login.", e);
        }
        return result;
    }
}
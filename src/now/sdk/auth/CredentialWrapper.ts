
import { NowSDKError, Creds } from '@servicenow/sdk-cli-core'
import * as sdk_auth from '@servicenow/sdk-cli/dist/auth';
import { NowStringUtil } from '../../../util/NowStringUtil';
import { KeyChain } from '@servicenow/sdk-cli/dist/auth/keychain'
 import { ArgumentsCamelCase } from 'yargs'
import { Logger } from '../../../util/Logger';

interface Arguments {
    alias: string
}

export interface CredentialArg extends sdk_auth.StoredCredential {
    isDefault: boolean;
    alias: string;

    auth:string;
}

export type NowAuthArgument = {
    _:string | number[]; //Command syntax since we are calling something that is expected to be called from the command line 
     alias:string;
    auth: string;
}


/***
 * Wraps the functions exposed in @servicenow/sdk-cli/auth/index.ts
 */
export class CredentialWrapper{

    private _logger:Logger = new Logger("CredentialWrapper");

    private keychain:KeyChain;

    private DEFAULT_ALIAS:string = 'fluent-default';

    public constructor(){
        this.keychain = new KeyChain(sdk_auth.SERVICE);
    }

    public async getStoredCredentials(alias?:string) : Promise<Creds>{
          return await this.getStoredCredentialsByAlias(alias);
    }

    public async testCredential(username: null, password: null, host: null) : Promise<Creds>{
        return await this.getCredentialsTestWrapper(username, password, host);
    }

    public async getStoredCredentialsByAlias(alias?:string)  : Promise<Creds>{
        //let credArgs:ArgumentsCamelCase<Arguments> = {alias: alias};
        let credentialArgs:NowAuthArgument = {_:[], alias:null, auth: null} as NowAuthArgument;
        if(!NowStringUtil.isStringEmpty(alias)){
            credentialArgs.auth = alias;
            credentialArgs.alias = alias;
        }
            
        return await sdk_auth.getCredentials(credentialArgs);
    }

    public async getCredentialsTestWrapper(username: null, password: null, host: null) : Promise<Creds>{
        let credentialArgs = {command: "test", alias:null, auth: null, username: username, password: password, host: host, isDefault: false} as Creds;
        return await sdk_auth.getCredentials(credentialArgs);
    }

    public async validateCredentials(alias:string){
        const { login: loginService } = await import('@servicenow/sdk-cli-core/dist/command/login/index.js')
        try {
           
            const creds:Creds = await this.getStoredCredentials(alias)

            const session = await loginService(creds, this._logger);

            if (!session) {
                return
            }
            const { instanceUrl } = session
            this._logger.successful(`Successfully validated creds with instance ${instanceUrl}.`)
        } catch (error) {
            this._logger.error(error instanceof Error ? error.message : (error as string), error)
        }
    }

    public async storeCredentials(alias:string, isDefault:boolean, host:string, username:string, password:string) : Promise<void>{
        const { login: loginService } = await import('@servicenow/sdk-cli-core/dist/command/login/index.js')
        try {
           const credential:Creds = { host, username, password };
            const session = await loginService(credential, this._logger)

            if (!session) {
                return
            }

            const { instanceUrl } = session
            this._logger.successful(`Successfully authenticated to instance ${instanceUrl}.`)
            this._logger.info(`Storing credentials for instance "${instanceUrl}" with alias ${alias}.`)
            await sdk_auth.storeCredentials(alias, instanceUrl, username, password, isDefault)
            this._logger.successful(`Successfully stored credentials for instance "${instanceUrl}" with alias ${alias}.`)
        } catch (error) {
            this._logger.error(error instanceof Error ? error.message : (error as string), error)
        }
    }

    public async updateDefaultCredential(alias: string, defaultCreds?: sdk_auth.StoredCredential){
        if(defaultCreds){
            await sdk_auth.updateDefaultCredential(alias, defaultCreds)
        }else{
            await sdk_auth.updateDefaultCredential(alias)
        }
    }

    public async getDefaultCredentials() : Promise<sdk_auth.StoredCredential | undefined>{
        const keyStore = await this.keychain.getPassword(this.DEFAULT_ALIAS)
        if (!keyStore) {
            return
        }

        return JSON.parse(keyStore) as sdk_auth.StoredCredential
    }

    public async removeCredentials(alias:string){
        await sdk_auth.removeCredentials(alias);
    }

    public async listCredentials(alias:string) : Promise<void> {
        await sdk_auth.listCredentials(alias);
    }


//    private async getCredentialsFromSdk(argsObject:){

//    }
}
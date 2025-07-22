import { IServiceNowInstance } from "./IServiceNowInstance";

export interface ServiceNowSettingsInstance {
    host?:string;
    username?:string;
    alias?:string;
    isDefault?:boolean;
    password?:string;
    credential?:any;
}

export class ServiceNowInstance implements IServiceNowInstance{
    private _isDefault:boolean;
    private _host:string;
    private _username:string;
    private _alias:string;

    private _password:string;
    
    private _credential:any;

    constructor(snInstanceSettingsObj?:ServiceNowSettingsInstance | null){
        if(typeof snInstanceSettingsObj != 'undefined' && snInstanceSettingsObj != null){
            if(snInstanceSettingsObj.host){
                this._host = snInstanceSettingsObj.host;
            }
            if(snInstanceSettingsObj.alias){
                this._alias = snInstanceSettingsObj.alias;
            }
            if(snInstanceSettingsObj.username){
                this._username = snInstanceSettingsObj.username;
            }
            if(snInstanceSettingsObj.isDefault){
                this._isDefault = snInstanceSettingsObj.isDefault;
            }
            if(snInstanceSettingsObj.password){
                this._password = snInstanceSettingsObj.password;
            }

            if(snInstanceSettingsObj.credential){
                this._credential = snInstanceSettingsObj.credential;
            }

        }
    }

    isDefault():boolean{
        return this._isDefault;
    }

    getHost():string{
        return this._host;
    }

    getUserName():string{
        return this._username;
    }

    getAlias():string{
        return this._alias;
    }

    //todo: Do we store the password in Secrets or the entire SN Instance? Can we store the entire array of SN Instances in secrets?
    getPassword():string{
        return this._password;
    }

    public get credential():any{
        return this._credential;
    }
}
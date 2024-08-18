import { ConfigProvider } from "typed-config";
import JSON5 from 'json5';
import fs from 'fs';
import { Logger } from "../util/Logger";
import { isNil } from "../amb/Helper";

export class ServiceNowAppConfigProvider implements ConfigProvider{
    
    public static CONFIG_FILE:string = "nowdev.app.config.json";
    
    private _json5File:any;

    private _logger:Logger;

    public constructor(){
        this._logger = new Logger("NowConfigProvider");


        this.loadConfigFile();
    }

    private loadConfigFile(){
        let strFile:string = fs.readFileSync(ServiceNowAppConfigProvider.CONFIG_FILE, 'utf8');
        this._json5File = JSON5.parse(strFile);

        this._logger.debug("Loaded Config File", this._json5File);
    }

    public getConfigFile():any{
        return this._json5File;
    }
    
    
    
    get(key: string): string {
        let val:string | null = null;
        try{
            val = key.split('.').reduce((a, b) => a[b], this._json5File);
            if(isNil(val))
                val = null;
            
        }catch(ex){
            val = null;
            this._logger.error("Key does not exist for get: " + key, this._json5File)
        }
       
        return val;
    }
    has(key: string): boolean {
       
        try{
            let val:string = this.get(key);
            if(!isNil(val)){
                return true;
            }
        }catch(e){
            this._logger.error("Key does not exist for has key: " + key, this._json5File);
        }

        return false;
    }
    
}

import { key, optional,  loadConfiguration, ConfigProvider, split, map } from 'typed-config';
import { ServiceNowAppConfigProvider } from './ServiceNowAppConfigProvider';
import { trim } from 'typed-config/dist/src/transforms.js';

export class ServiceNowAppConfig {

    private static _instance:ServiceNowAppConfig | null = null;

    private _isReady = false;

    public static get instance() : ServiceNowAppConfig{

        if(ServiceNowAppConfig._instance == null){
            ServiceNowAppConfig._instance = new ServiceNowAppConfig();
        }else{
            if(!ServiceNowAppConfig._instance.isReady){
                throw new Error("Must call await AppConfig.instance.init() before any other calls.")
            }
        }

        return ServiceNowAppConfig._instance;
    }

    private constructor(){

    }

    public async init() : Promise<void>{
        const provider:ConfigProvider = new ServiceNowAppConfigProvider();
        await loadConfiguration(ServiceNowAppConfig._instance, provider);
        this._isReady = true;
    }

    public get isReady():boolean{
        return this._isReady;
    }

    @key('metaDataTypes', split(','), map(trim))
    @optional('sys_script_include,sys_script')
    public metaDataTypes:string[];

}
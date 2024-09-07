
import { key, optional, asNumber, loadConfiguration, ConfigProvider, split, map } from 'typed-config';
import { NowConfigProvider } from './NowConfigProvider';
import { map2, split2, trim2 } from './config-transformer';

export class AppConfig{

    private static _instance:AppConfig | null = null;

    private _isReady:boolean = false;

    public static get instance() : AppConfig{

        if(AppConfig._instance == null){
            AppConfig._instance = new AppConfig();
        }else{
            if(!AppConfig._instance.isReady){
                throw new Error("Must call await AppConfig.instance.init() before any other calls.")
            }
        }

        return AppConfig._instance;
    }

    private constructor(){

    }

    public async init() : Promise<void>{
        let provider:ConfigProvider = new NowConfigProvider();
        await loadConfiguration(AppConfig._instance, provider);
        this._isReady = true;
    }

    public get isReady():boolean{
        return this._isReady;
    }

    @key('logLevel' )
    @optional('debug')
    public logLevel:string;

    @key('fs.rootDir' )
    @optional('./')
    public rootDirectory:string;

    @key('fs.scriptSrc' )
    @optional('src/script')
    public scriptSourceDirectory:string;

    @key('fs.testDir')
    @optional('test')
    public testDirectory:string;

    @key('fs.atfTestDir')
    @optional('atf')
    public atfTestDirectory:string;

    @key('fs.configDataPath')
    @optional('nowd')
    public configDataPath:string;

    @key('metaDataTypes', split2(','), map2(trim2))
    @optional('sys_script_include,sys_script')
    public metaDataTypes:string[];




}
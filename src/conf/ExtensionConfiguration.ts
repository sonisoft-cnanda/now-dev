
import { ServiceNowSettingsInstance } from '../sn/ServiceNowInstance';

const ATFCONFIG_NAME:string = "sn-atf";
const TEST_HOST:string = "ven01280.service-now.com";//"dev271900.service-now.com";
const TEST_USER:string = "chris.nanda";
const TEST_PASSWORD:string ="D$adP00l$G$$k0ut";

export class ExtensionConfiguration{
    static #instance: ExtensionConfiguration;

    authenticationType:number;
    rootTestFolder:string;
    settings;
 
    _settings:any;
    
    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    private constructor() {
        //TODO: Update this from the VSCode work done before
        this.settings = null;//vscode.workspace.getConfiguration();
       this._settings = this.settings;
     }

    /**
     * The static getter that controls access to the singleton instance.
     *
     * This implementation allows you to extend the Singleton class while
     * keeping just one instance of each subclass around.
     */
    public static get instance(): ExtensionConfiguration {
        if (!ExtensionConfiguration.#instance) {
            ExtensionConfiguration.#instance = new ExtensionConfiguration();
        }

        return ExtensionConfiguration.#instance;
    }

    initSettings(){
        let strRoot = this.getRootTestFolder();
        if(strRoot == null){
            
        }
    }

    getSettings() : any{
       return this._settings;
    }

    getProtocol():string{
        return "https://"
    }

    getServiceNowInstanceURL():string{
        return this.getProtocol() + this.getServiceNowHost();
    }

    getServiceNowHost():string{
        return TEST_HOST;
    }

    getServiceNowUserName():string{
        return TEST_USER;
    }

    getServiceNowPassword():string{
        return TEST_PASSWORD;
    }

    getRootTestFolder():string | null {
        let strRootFolder:string | null | undefined =  this.settings.get('rootTestFolder');

       if(strRootFolder != null && strRootFolder != undefined){
            this.rootTestFolder = strRootFolder;
            return  this.rootTestFolder;
       }

        return null;
    }

    public async addInstanceConfiguration(instance:ServiceNowSettingsInstance){
        
        //add instance to settings
       let instanceSetting:ServiceNowInstanceSettings = await this.getInstances();
       if(instanceSetting == null)
        instanceSetting = {} as ServiceNowInstanceSettings;

       let alias:string = instance.alias;
       let password:string = instance.password;
       instance.password = null;
       if(alias != null && typeof instanceSetting[alias] == 'undefined'){
        instanceSetting[alias] = instance;
        await this.setInstances(instanceSetting);
       } 
    }
    
    //FIXME: Fix this
    public async setInstances(instancesObj:ServiceNowInstanceSettings){
        throw new Error("Not Implemented");
        // var wsSettings:vscode.WorkspaceConfiguration = this.getSettings();
        // await wsSettings.update("instances", JSON.stringify(instancesObj), vscode.ConfigurationTarget.Workspace);
    }

    public async getInstances():Promise<ServiceNowInstanceSettings>{
        let wsSettings:any = this.getSettings();
        try{
            let json:string = wsSettings.get("instances");
            console.log(json);
            if(json){
                let instances:ServiceNowInstanceSettings =  JSON.parse(json) as ServiceNowInstanceSettings;
        
                console.log(instances);
                return instances;
            }
            
        }catch(err){
            console.error(err);
            return null;
        }
      
        return null;
    }

}

type ServiceNowInstanceSettings = {
    [key: string]: ServiceNowSettingsInstance

}
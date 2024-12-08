import { ServiceNowRequest } from "../comm/http/ServiceNowRequest";
import { Logger } from "../util/Logger";
import { IServiceNowInstance } from "./IServiceNowInstance";


export abstract class SNRequestBase{
    private _snInstance: IServiceNowInstance;
   

    private _req: ServiceNowRequest;
  

    _logger:Logger = new Logger("ATFTestExecutor");

    public constructor(instance:IServiceNowInstance){
        this._snInstance = instance;
        this._req  = new ServiceNowRequest(this._snInstance);
    }

    public get request (): ServiceNowRequest {
        return this._req;
    }
    public set request ( value: ServiceNowRequest ) {
        this._req = value;
    }

    public get snInstance (): IServiceNowInstance {
        return this._snInstance;
    }
    public set snInstance ( value: IServiceNowInstance ) {
        this._snInstance = value;
    }

}
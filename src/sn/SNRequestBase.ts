import { ServiceNowRequest } from "../comm/http/ServiceNowRequest";
import { Logger } from "../util/Logger";
import { ServiceNowInstance } from "./ServiceNowInstance";


export abstract class SNRequestBase{
    private _snInstance: ServiceNowInstance;
   

    private _req: ServiceNowRequest;
  

    _logger:Logger = new Logger("ATFTestExecutor");

    public constructor(instance:ServiceNowInstance){
        this._snInstance = instance;
        this._req  = new ServiceNowRequest(this._snInstance);
    }

    public get request (): ServiceNowRequest {
        return this._req;
    }
    public set request ( value: ServiceNowRequest ) {
        this._req = value;
    }

    public get snInstance (): ServiceNowInstance {
        return this._snInstance;
    }
    public set snInstance ( value: ServiceNowInstance ) {
        this._snInstance = value;
    }

}
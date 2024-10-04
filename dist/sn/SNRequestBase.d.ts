import { ServiceNowRequest } from "../comm/http/ServiceNowRequest.js";
import { Logger } from "../util/Logger.js";
import { IServiceNowInstance } from "./IServiceNowInstance.js";
export declare abstract class SNRequestBase {
    private _snInstance;
    private _req;
    _logger: Logger;
    constructor(instance: IServiceNowInstance);
    get request(): ServiceNowRequest;
    set request(value: ServiceNowRequest);
    get snInstance(): IServiceNowInstance;
    set snInstance(value: IServiceNowInstance);
}

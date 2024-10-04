import { HttpResponse } from "./HttpResponse.js";
import { IServiceNowInstance } from "../../sn/IServiceNowInstance.js";
export declare class ServiceNowProcessorRequest {
    private _instance;
    constructor(instance: IServiceNowInstance);
    private _headers;
    execute(processor: string, processorMethod: string, scope: string, processorArgs: object): Promise<string>;
    doXmlHttpRequest(processor: string, processorMethod: string, scope: string, processorArgs: object): Promise<HttpResponse<unknown>>;
}

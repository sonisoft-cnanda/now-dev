import { IServiceNowInstance } from "../../sn/IServiceNowInstance.js";
import { HttpResponse } from "./HttpResponse.js";
export declare class TableAPIRequest {
    private _headers;
    private _apiBase;
    private _snInstance;
    get snInstance(): IServiceNowInstance;
    set snInstance(value: IServiceNowInstance);
    constructor(instance: IServiceNowInstance);
    get<T>(tableName: string, query: object): Promise<HttpResponse<T>>;
    post<T>(tableName: string, query: object, body: object): Promise<HttpResponse<T>>;
    private _doRequest;
    private replaceVar;
}

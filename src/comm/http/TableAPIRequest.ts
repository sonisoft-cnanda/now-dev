

import { IServiceNowInstance } from "../../sn/IServiceNowInstance";
import { ServiceNowInstance } from "../../sn/ServiceNowInstance";
import { HTTPRequest } from "./HTTPRequest";
import { IHttpResponse } from "./IHttpResponse";
import { ServiceNowRequest } from "./ServiceNowRequest";

export class TableAPIRequest{

    private _headers:object = {
        "Content-Type":"application/json",
        "Accept": "application/json"
    };

    private _apiBase = "/api/now/table/{table_name}";

    private _snInstance: IServiceNowInstance;
    public get snInstance(): IServiceNowInstance {
        return this._snInstance;
    }
    public set snInstance(value: IServiceNowInstance) {
        this._snInstance = value;
    }

    public constructor(instance:IServiceNowInstance){
        this.snInstance = instance;
    }

    public async get<T>(tableName:string, query:object): Promise<IHttpResponse<T>>{
       
        const uri:string = this.replaceVar(this._apiBase, {table_name:tableName});

        return await this._doRequest<T>(uri, "get", query, null);
    }

    public async post<T>(tableName:string, query:object, body:object): Promise<IHttpResponse<T>>{
       
        const uri:string = this.replaceVar(this._apiBase, {table_name:tableName});

        return await this._doRequest<T>(uri, "post", query, body);
    }

    private async _doRequest<T>(uri:string, httpMethod:string, query: object | null, bodyData:object | null) : Promise<IHttpResponse<T>>{
        let resp:IHttpResponse<T> = null;

        try{
            const req:ServiceNowRequest = new ServiceNowRequest(this.snInstance as ServiceNowInstance);

            const request:HTTPRequest = { path: uri, method: httpMethod, headers: this._headers, query: query, body:bodyData};
            resp = await req.executeRequest<T>(request);
        }catch(err){
            console.log(err);
        }
       
        return resp;
    }


    private replaceVar(strBaseString:string, variables:object):string{
       let strNewString:string = strBaseString;
        for(const prop in variables){
            strNewString = strNewString.replace("{"+prop+"}", variables[prop] as string);
        }

        return strNewString;
    }
}
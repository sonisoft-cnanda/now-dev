

import { HTTPRequest } from "./HTTPRequest";
import { HttpResponse } from "./HttpResponse";
import { ServiceNowRequest } from "./ServiceNowRequest";

export class TableAPIRequest{

    private _headers:object = {
        "Content-Type":"application/json",
        "Accept": "application/json"
    };

    private _apiBase:string = "/api/now/table/{table_name}";

    public async get<T>(tableName:string, query:object): Promise<HttpResponse<T>>{
       
        let uri:string = this.replaceVar(this._apiBase, {table_name:tableName});

        return await this._doRequest<T>(uri, "get", query, null);
    }

    public async post<T>(tableName:string, query:object, body:object): Promise<HttpResponse<T>>{
       
        let uri:string = this.replaceVar(this._apiBase, {table_name:tableName});

        return await this._doRequest<T>(uri, "post", query, body);
    }

    private async _doRequest<T>(uri:string, httpMethod:string, query: object | null, bodyData:object | null) : Promise<HttpResponse<T>>{
        let resp:HttpResponse<T> = null;

        try{
            let req:ServiceNowRequest = new ServiceNowRequest();

            let request:HTTPRequest = { path: uri, method: httpMethod, headers: this._headers, query: query, body:bodyData};
            resp = await req.executeRequest<T>(request);
        }catch(err){
            console.log(err);
        }
       
        return resp;
    }


    private replaceVar(strBaseString:string, variables:object):string{
       let strNewString:string = strBaseString;
        for(let prop in variables){
            strNewString = strNewString.replace("{"+prop+"}", variables[prop]);
        }

        return strNewString;
    }
}
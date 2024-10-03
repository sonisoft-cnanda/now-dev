import { HTTPRequest } from "../../comm/http/HTTPRequest";
import { HttpResponse } from "../../comm/http/HttpResponse";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { ServiceNowTableResponse } from "../../model/types";
import { IServiceNowInstance } from "../IServiceNowInstance";
import { SNRequestBase } from "../SNRequestBase";
import { IUser } from "./model/IUser";


export class UserRequest extends SNRequestBase{

    
    public constructor(instance:IServiceNowInstance){
        super(instance);
    }

    // private async getUser(userId:string):Promise<IUser>{
       
 
    //     const request:HTTPRequest = { path: "/api/now/table/sys_atf_test_result?sysparm_query=sys_id="+userId, headers: null, query: null, body:null};
    //     const resp:HttpResponse<ServiceNowTableResponse<IUser>> = await this.request.get<ServiceNowTableResponse<IUser>>(request);
    //     if(resp.status == 200){
    //         const tableResp:ServiceNowTableResponse<IUser> =  resp.bodyObject;
    //         if(tableResp.result && tableResp.result.length > 0){
    //             return tableResp.result[0];
    //         }
            
    //     }

    //     return null;
    // }

    public async getUser(userId:string) : Promise<IUser>{
       
        const request:TableAPIRequest = new TableAPIRequest( this.snInstance);
        const params:object = {};
        params["sysparm_query"] = "sys_id="+userId; 

        

       const resp:HttpResponse<ServiceNowTableResponse<IUser>> =  await request.get<ServiceNowTableResponse<IUser>>("sys_user", params);
       if(resp.status == 200){
            const tableResp:ServiceNowTableResponse<IUser> =  resp.bodyObject;
            if(tableResp.result && tableResp.result.length > 0){
                return tableResp.result[0];
            }
        
        }
        return null;
    }

}
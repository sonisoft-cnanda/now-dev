import { TableAPIRequest } from "../../comm/http/TableAPIRequest.js";
import { SNRequestBase } from "../SNRequestBase.js";
export class UserRequest extends SNRequestBase {
    constructor(instance) {
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
    async getUser(userId) {
        const request = new TableAPIRequest(this.snInstance);
        const params = {};
        params["sysparm_query"] = "sys_id=" + userId;
        const resp = await request.get("sys_user", params);
        if (resp.status == 200) {
            const tableResp = resp.bodyObject;
            if (tableResp.result && tableResp.result.length > 0) {
                return tableResp.result[0];
            }
        }
        return null;
    }
}
//# sourceMappingURL=UserRequest.js.map
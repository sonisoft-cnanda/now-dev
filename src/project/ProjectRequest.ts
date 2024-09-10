
import { HttpResponse } from "../comm/http/HttpResponse";
import { TableAPIRequest } from "../comm/http/TableAPIRequest";
import { AppUtil } from "../util/AppUtil";
import { Logger } from "../util/Logger";

export type SysMetadata = {

};

export class ProjectRequest{

    private _logger:Logger = new Logger("ProjectRequest");

    public getUrlSearchParamsForMetadata(app_sys_id, classNames,  addtFields="") : URLSearchParams{
        const packageType = AppUtil.isGlobalApp() ? "sys_package" : "sys_scope";
        const params = new URLSearchParams();
        params.set("sysparm_fields", "sys_id,sys_name,sys_class_name,sys_package,sys_package.name,sys_scope,sys_scope.name," + addtFields);
        params.set("sysparm_transaction_scope", app_sys_id);
        params.set("sysparm_query", packageType + "=" + app_sys_id + "^sys_class_nameIN" + classNames);
        params.set(packageType, app_sys_id);
        //e = APP_SYS_ID
        return params;
    }

    private getMetadataRequestParams(app_sys_id, classNames,  addtFields="") : object{
        const packageType = AppUtil.isGlobalApp() ? "sys_package" : "sys_scope";
        let params:object = {};
        params["sysparm_fields"] =  "sys_id,sys_name,sys_class_name,sys_package,sys_package.name,sys_scope,sys_scope.name," + addtFields;
        params["sysparm_transaction_scope"] = app_sys_id;
        params["sysparm_query"] = packageType + "=" + app_sys_id + "^sys_class_nameIN" + classNames;
        params[packageType] =  app_sys_id;

        return params;
    }

    public getScriptIncludeAPI(siName, scope) {
        return `/api/now/table/sys_script_include?sysparm_query=api_name%3D${scope}.${siName}`;
    }
    public getFileContentAPI(table, t, sys_id) {
        return `/api/now/table/${table}?sysparm_query=sys_id=${sys_id}&sysparm_fields=sys_id,${t},sys_name,sys_class_name,sys_package,sys_package.name,sys_scope,sys_scope.name,sys_scope.scope&sysparm_exclude_reference_link=true`;
    }

    public async getSysMetadataObjectsForApplication(appSysId:string, classNames:string[], addtFields:string = "") : Promise<HttpResponse<SysMetadata>>{
       
        const request:TableAPIRequest = new TableAPIRequest();
        let params:object = this.getMetadataRequestParams(appSysId, classNames, addtFields);

        this._logger.debug("Url Search Params", params);

       let resp:HttpResponse<SysMetadata> =  await request.get<SysMetadata>("sys_metadata", params);
        return resp;
    }
}
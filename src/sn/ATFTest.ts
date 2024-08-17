import { HTTPRequest, HttpResponse } from "../comm/http/HTTPRequestHandler";
import { ServiceNowRequest } from "../comm/http/ServiceNowRequest";
import { ReferenceLink } from "../model/types";

export type Test = {
    
        "sys_mod_count": string;
        "active": string;
        "description": string;
        "sys_updated_on":  string;
        "sys_tags":  string;
        "sys_class_name":  string;
        "remember":  string;
        "sys_id":  string;
        "sys_package": ReferenceLink;
        "enable_parameterized_testing":  string;
        "sys_update_name":  string;
        "sys_updated_by":  string;
        "fail_on_server_error":  string;
        "sys_created_on":  string;
        "name":  string;
        "sys_name":  string;
        "sys_scope": ReferenceLink;
        "copied_from":  string;
        "sn_atf_tg_generated":  string;
        "parameters":  string;
        "sys_created_by":  string;
        "sys_policy":  string;
    

}

export class ATFTest{
   
    

}
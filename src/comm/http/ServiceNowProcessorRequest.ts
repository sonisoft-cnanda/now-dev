/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import * as qs from 'qs';

import { XMLParser } from 'fast-xml-parser';
import { HttpResponse } from "./HttpResponse";
import { HTTPRequest } from "./HTTPRequest";
import { XMLHTTP_PROCESSOR_ENDPOINT } from "../../constants/ServiceNow";
import { IServiceNowInstance } from "../../sn/IServiceNowInstance";

// interface IProcessorResponse{

// }

export class ServiceNowProcessorRequest{

    private _instance:IServiceNowInstance;

    public constructor(instance:IServiceNowInstance){
        this._instance = instance;
    }

    private _headers:object = {
        "Content-Type":"application/x-www-form-urlencoded"
    };

    public async execute(processor:string, processorMethod:string, scope:string, processorArgs:object):Promise<string>{
        const retVal:string = null;
        const resp:HttpResponse<unknown> =  await this.doXmlHttpRequest(processor, processorMethod, scope, processorArgs);
        if(resp.status == 200){
            const data:string = resp.data;
            if(typeof data != 'undefined' && data && data.indexOf('answer=') != -1){
               
                const parser:XMLParser = new XMLParser();
                const val:any = parser.parse(data);
                console.log(val);
                // parser.parse(data, function (err, result) {
                //     const answer:string = result.xml.$.answer;
                //     retVal = answer;
                //     //console.log(answer);
                // });
                
            }
        }
        return retVal;
    }

    async doXmlHttpRequest(processor:string, processorMethod:string, scope:string, processorArgs:object) : Promise<HttpResponse<unknown>>{
        let resp:HttpResponse<unknown> = null;

        try{
            const dataObj:Record<string, string> ={};
            dataObj.sysparm_processor = processor;
            dataObj.sysparm_name = processorMethod;
            dataObj.sysparm_scope = scope;

            for(const prop in processorArgs){
                dataObj[prop] = processorArgs[prop];
            }

            const data = qs.stringify(dataObj);

            const req:ServiceNowRequest = new ServiceNowRequest(this._instance);
            const request:HTTPRequest = { path: XMLHTTP_PROCESSOR_ENDPOINT, headers: this._headers, query: null, body:data};
            resp = await req.post(request);
        }catch(err){
            console.log(err);
        }
       

        return resp;
    }
}
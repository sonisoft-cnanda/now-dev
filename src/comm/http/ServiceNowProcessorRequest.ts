import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import * as qs from 'qs';
import { Parser } from 'xml2js';
import { HttpResponse } from "./HttpResponse";
import { HTTPRequest } from "./HTTPRequest";
import { XMLHTTP_PROCESSOR_ENDPOINT } from "../../constants/ServiceNow";

export class ServiceNowProcessorRequest{

    private _headers:object = {
        "Content-Type":"application/x-www-form-urlencoded"
    };

    public async execute(processor:string, processorMethod:string, scope:string, processorArgs:object):Promise<string>{
        let retVal:string = null;
        const resp:HttpResponse<unknown> =  await this.doXmlHttpRequest(processor, processorMethod, scope, processorArgs);
        if(resp.status == 200){
            const data:string = resp.data;
            if(typeof data != 'undefined' && data && data.indexOf('answer=') != -1){
               
                const parser:Parser = new Parser();
                parser.parseString(data, function (err, result) {
                    const answer:string = result.xml.$.answer;
                    retVal = answer;
                    //console.log(answer);
                });
                
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

            const req:ServiceNowRequest = new ServiceNowRequest();
            const request:HTTPRequest = { path: XMLHTTP_PROCESSOR_ENDPOINT, headers: this._headers, query: null, body:data};
            resp = await req.post(request);
        }catch(err){
            console.log(err);
        }
       

        return resp;
    }
}
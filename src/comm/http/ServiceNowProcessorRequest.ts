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
        let resp:HttpResponse<unknown> =  await this.doXmlHttpRequest(processor, processorMethod, scope, processorArgs);
        if(resp.status == 200){
            let data:string = resp.data;
            if(typeof data != 'undefined' && data && data.indexOf('answer=') != -1){
               
                let parser:Parser = new Parser();
                parser.parseString(data, function (err, result) {
                    let answer:string = result.xml.$.answer;
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
            let dataObj:{[key:string]: string} ={};
            dataObj.sysparm_processor = processor;
            dataObj.sysparm_name = processorMethod;
            dataObj.sysparm_scope = scope;

            for(var prop in processorArgs){
                dataObj[prop] = processorArgs[prop];
            }

            let data = qs.stringify(dataObj);

            let req:ServiceNowRequest = new ServiceNowRequest();
            let request:HTTPRequest = { path: XMLHTTP_PROCESSOR_ENDPOINT, headers: this._headers, query: null, body:data};
            resp = await req.post(request);
        }catch(err){
            console.log(err);
        }
       

        return resp;
    }
}
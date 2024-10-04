/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest.js";
import * as qs from 'qs';
import { XMLParser } from 'fast-xml-parser';
import { XMLHTTP_PROCESSOR_ENDPOINT } from "../../constants/ServiceNow.js";
// interface IProcessorResponse{
// }
export class ServiceNowProcessorRequest {
    _instance;
    constructor(instance) {
        this._instance = instance;
    }
    _headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    };
    async execute(processor, processorMethod, scope, processorArgs) {
        let retVal = null;
        const resp = await this.doXmlHttpRequest(processor, processorMethod, scope, processorArgs);
        if (resp.status == 200) {
            const data = resp.data;
            if (typeof data != 'undefined' && data && data.indexOf('answer=') != -1) {
                const options = {
                    ignoreAttributes: false,
                    attributeNamePrefix: "@_",
                    allowBooleanAttributes: true
                };
                const parser = new XMLParser(options);
                const val = parser.parse(data);
                console.log(val);
                if (val.xml) {
                    const answer = val.xml["@_answer"];
                    retVal = answer;
                }
            }
        }
        return retVal;
    }
    async doXmlHttpRequest(processor, processorMethod, scope, processorArgs) {
        let resp = null;
        try {
            const dataObj = {};
            dataObj.sysparm_processor = processor;
            dataObj.sysparm_name = processorMethod;
            dataObj.sysparm_scope = scope;
            for (const prop in processorArgs) {
                dataObj[prop] = processorArgs[prop];
            }
            const data = qs.stringify(dataObj);
            const req = new ServiceNowRequest(this._instance);
            const request = { path: XMLHTTP_PROCESSOR_ENDPOINT, headers: this._headers, query: null, body: data };
            resp = await req.post(request);
        }
        catch (err) {
            console.log(err);
        }
        return resp;
    }
}
//# sourceMappingURL=ServiceNowProcessorRequest.js.map
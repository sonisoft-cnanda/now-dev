/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ServiceNowInstance } from "./ServiceNowInstance";

import { ServiceNowRequest } from "../comm/http/ServiceNowRequest";
//import { XMLParser } from "../utils";
import { XMLParser } from 'fast-xml-parser';
import { Logger } from "../util/Logger";
import { isNil } from "../amb/Helper";
import { HTTPRequest } from "../comm/http/HTTPRequest";
import { BG_SCRIPT_ENDPOINT } from "../constants/ServiceNow";
import { IHttpResponse } from "../comm/http/IHttpResponse";


export class BackgroundScriptExecutor {
    snRequest: ServiceNowRequest;
    instance: ServiceNowInstance;
    scope: string;

    _logger:Logger = new Logger("BackgroundScriptExecutor");

    public constructor( instance:ServiceNowInstance, scope:string  ) {
       
            this.instance = instance;
            this.scope = scope;
            this.snRequest = new ServiceNowRequest(this.instance);
    }

    public async executeScript(script: string, scope: string = this.scope, instance:ServiceNowInstance = this.instance): Promise<BackgroundScriptExecutionResult> {
        if (!instance || !(instance instanceof ServiceNowInstance)) {
            throw new Error("instance must be a ServiceNowInstance");
        }
        if (!scope || typeof scope != "string") {
            throw new Error("scope must be a string");
        }
        if (!script || typeof script != "string") {
            throw new Error("script must be a string");
        }

       
        try {

           const gck:string =  await this.getBackgroundScriptCSRFToken();
           const fd:FormData = new FormData();
           fd.append("script", script);
           fd.append("sysparm_ck", gck);
           fd.append("runscript",  "Run script");
           fd.append("sys_scope", scope);
           fd.append("record_for_rollback", "off");
           fd.append("quota_managed_transaction", "off");
        

           
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const params:URLSearchParams = new URLSearchParams(fd as any );
            const request: HTTPRequest = {
                path: BG_SCRIPT_ENDPOINT,
                headers: {"Content-Type":"application/x-www-form-urlencoded"},
                query: null,
                body: params
            };
            this._logger.debug("Execute Background Script Request.", {request:request, formData:fd})
            const response: IHttpResponse<string> = await this.snRequest.post<string>(request);
            if (response.status == 200) {
                const bodyXml:string = response?.data as string;
                if(bodyXml){
                    const resultObj:BackgroundScriptExecutionResult = this.parseScriptResult(bodyXml);
                    return resultObj;
                }else{
                    throw new Error("Body not XML String");
                }
               
            } else {
                throw new Error(`Script Execution Request resulted in ${response.status}`);
            }
        } catch (error) {
            const err:Error = error as Error;
            throw new Error(`Error executing script: ${err.message}`);
        }
    }

    public parseScriptResult(responseXML: string) : BackgroundScriptExecutionResult {
        const parser = new XMLParser();
        const strippedResponseXML:string = responseXML.replace(/^\[[0-9:.]+\]/g, "");
        const jObj:ScriptExecutionXMLResult = parser.parse(strippedResponseXML) as ScriptExecutionXMLResult;
        // const parser = new XMLParser({
        //     explicitArray: false,
        //     ignoreAttrs: true,
        // });
         
        // return await parser.parseStringPromise(strippedResponseXML)
        //     .then((result) => {
        //         return {
        //             raw: responseXML,
        //             result: this._parseBGScriptResult(result),
        //             affectedRecords: this._parseAffectedRecords(result)
        //         }
        //     })


        const scriptResult:BackgroundScriptExecutionResult = {
            raw: responseXML,
            result: this._parseBGScriptResult(jObj),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            affectedRecords: this._parseAffectedRecords(jObj)
        };

        this._logger.debug("parseScriptResult return value.", scriptResult);

        return scriptResult;
    }

    public async getBackgroundScriptCSRFToken() : Promise<string> {
        let csrfToken:string = null;

        const request: HTTPRequest = {
            path: BG_SCRIPT_ENDPOINT,
            headers: null,
            query: null,
            body: null
        };
        const response: IHttpResponse<string> = await this.snRequest.get<string>(request);
        const isLoggedIn:boolean = response.headers["x-is-logged-in"] === "true" ? true : false
        if(response.status == 200 && isLoggedIn && !isNil(response.data)){
            
            const e =  response.data as string;
            const t = "<input name=\"sysparm_ck\" type=\"hidden\" value=\"";
           
            const n = e.substring(e.indexOf(t));
            csrfToken =  n.substring(0, n.indexOf("\">")).replace(t, "");
            this._logger.debug("CSRF Token Received: " + csrfToken, {csrfToken:csrfToken});
        }else{
            this._logger.error("getBackgroundScriptCSRFToken: Invalid response. Status not 200, not logged in, or response data is empty.", {response:response});
        }
          

        return csrfToken;
      }

    private _parseBGScriptResult(parsedXMLObj: ScriptExecutionXMLResult) : string {
        this._logger.debug("_parseBGScriptResult enter", parsedXMLObj);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        let result:string = parsedXMLObj.HTML.BODY.PRE["#text"] as string;
        result =  result.replace("<BR/>", "\n")
        return result?.replace("*** Script: ", "").trim()
    }
    private _parseAffectedRecords(parsedXMLObj: ScriptExecutionXMLResult) {
        return parsedXMLObj?.HTML?.BODY?.div
    }
}

interface ScriptExecutionXMLResult{
    HTML:{
        BODY: {
            PRE: {
                "#text";
            },
            div:string;
        }
    }
}

export type BackgroundScriptExecutionResult = {
    raw: string;
    result: string;
    affectedRecords: string;
};

export interface BackgroundScriptExecutorOptions {
    instance?: ServiceNowInstance;
    scope?: string;
}
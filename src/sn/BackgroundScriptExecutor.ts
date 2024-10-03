/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ServiceNowInstance } from "./ServiceNowInstance";

import { ServiceNowRequest } from "../comm/http/ServiceNowRequest";
//import { XMLParser } from "../utils";
import { X2jOptions, XMLParser } from 'fast-xml-parser';
import { Logger } from "../util/Logger";

import { HTTPRequest } from "../comm/http/HTTPRequest";
import { BG_SCRIPT_ENDPOINT } from "../constants/ServiceNow";
import { IHttpResponse } from "../comm/http/IHttpResponse";
import { isNil } from "../util/utils";


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
        const options: X2jOptions = {
            ignoreAttributes: false,
            unpairedTags: ["hr", "br", "link", "meta"],
            stopNodes: ["*.pre", "*.script"],
            processEntities: true,
            htmlEntities: true,
            tagValueProcessor: (tagName: string, tagValue: any) => {
                if (tagName === "PRE") {
                    return tagValue + "\n";
                }
                return tagValue;
            }
        };
        const parser: XMLParser = new XMLParser(options);
        const strippedResponseXML:string = responseXML.replace(/^\[[0-9:.]+\]/g, "");
        const jObj:ScriptExecutionXMLResult = parser.parse(strippedResponseXML) as ScriptExecutionXMLResult;
        
        const compositeResult:CompositeScriptExecutionResult =  this._parseBGScriptResult(jObj);
        const affectedRecords = this._parseAffectedRecords(jObj);

        const scriptResult:BackgroundScriptExecutionResult = {
            raw: responseXML,
            result: compositeResult.rawResult,
            consoleResult: compositeResult.consoleResult,
            rawResult: compositeResult.rawResult,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            affectedRecords: affectedRecords
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

    private _parseBGScriptResult(parsedXMLObj: ScriptExecutionXMLResult) : CompositeScriptExecutionResult {
        this._logger.debug("_parseBGScriptResult enter", parsedXMLObj);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const result:string = parsedXMLObj.HTML.BODY.PRE["#text"] as string;
        const spl:string[] = result.split("\n");
        spl.forEach((line: string, index:number   ) => {
            if(line.trim().length == 0)
                spl[index] = null;
            else
                spl[index] = line.replace("*** Script: ", "").trim();
        });

        const filteredSpl = spl.filter(line => line !== null);
        
        return {rawResult: result, consoleResult: filteredSpl} as CompositeScriptExecutionResult;
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

export type CompositeScriptExecutionResult = {
    consoleResult: string[];
    rawResult: string;
}

export type BackgroundScriptExecutionResult = {
    raw: string;
    result: string;
    affectedRecords: string;
    consoleResult: string[];
    rawResult:string;
};

export interface BackgroundScriptExecutorOptions {
    instance?: ServiceNowInstance;
    scope?: string;
}
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
           if (isNil(gck)) {
               throw new Error(
                   "Failed to obtain CSRF token from the ServiceNow instance. " +
                   "This may indicate an authentication failure or that the user " +
                   "does not have permission to access Scripts - Background."
               );
           }
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
                const bodyXml:string = response?.data;
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
            throw new Error(`Error executing script: ${err.message}`, { cause: error });
        }
    }

    public parseScriptResult(responseXML: string) : BackgroundScriptExecutionResult {
        const options: X2jOptions = {
            ignoreAttributes: false,
            unpairedTags: ["hr", "br", "link", "meta", "img", "input", "HR", "BR", "LINK", "META", "IMG", "INPUT"],
            stopNodes: ["*.pre", "*.script", "*.PRE", "*.SCRIPT"],
            processEntities: true,
            htmlEntities: true,
            tagValueProcessor: (tagName: string, tagValue: any) => {
                if (tagName === "PRE" || tagName === "pre") {
                    return tagValue + "\n";
                }
                return tagValue;
            }
        };
        const parser: XMLParser = new XMLParser(options);
        let strippedResponseXML:string = responseXML.replace(/^\[[0-9:.]+\]/g, "");
        strippedResponseXML = this.fixMalformedHTML(strippedResponseXML);
        const jObj:ScriptExecutionXMLResult = parser.parse(strippedResponseXML) as ScriptExecutionXMLResult;
        
        const compositeResult:CompositeScriptExecutionResult =  this._parseBGScriptResult(jObj);
        const affectedRecords = this._parseAffectedRecords(jObj);

        const scriptResult:BackgroundScriptExecutionResult = {
            raw: responseXML,
            result: compositeResult.rawResult,
            consoleResult: compositeResult.consoleResult,
            rawResult: compositeResult.rawResult,
            scriptResults: compositeResult.scriptResults,
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
            
            const e =  response.data;
            const t = "<input name=\"sysparm_ck\" type=\"hidden\" value=\"";
           
            const n = e.substring(e.indexOf(t));
            csrfToken =  n.substring(0, n.indexOf("\">")).replace(t, "");
            this._logger.debug("CSRF Token Received: " + csrfToken, {csrfToken:csrfToken});
        }else{
            this._logger.error("getBackgroundScriptCSRFToken: Invalid response. Status not 200, not logged in, or response data is empty.", {response:response});
        }
          

        return csrfToken;
      }

    /**
     * Strips closing tags for HTML void elements that fast-xml-parser cannot handle.
     * ServiceNow's /sys.scripts.do returns malformed HTML with closing tags for
     * void elements like </meta>, </link>, </br>, </hr>, </img>, etc.
     */
    private fixMalformedHTML(html: string): string {
        const voidElements = [
            "area", "base", "br", "col", "embed", "hr", "img", "input",
            "link", "meta", "param", "source", "track", "wbr"
        ];
        const pattern = new RegExp(`</(${voidElements.join("|")})\\s*>`, "gi");
        return html.replace(pattern, "");
    }

    private _parseBGScriptResult(parsedXMLObj: ScriptExecutionXMLResult) : CompositeScriptExecutionResult {
        this._logger.debug("_parseBGScriptResult enter", parsedXMLObj);

        const scriptResults:ScriptExecutionOutputLine[] = [];

        // Null-safe navigation — PRE or #text may be absent when script produces no output.
        // fast-xml-parser stores text in #text when the element has attributes (e.g. <PRE class="outputtext">),
        // but stores it directly as a string when the element has no attributes (e.g. <PRE>).
        const pre = parsedXMLObj?.HTML?.BODY?.PRE;
        const result:string | undefined = (typeof pre === "string" ? pre : pre?.["#text"]) as string | undefined;

        if (isNil(result) || result.trim().length === 0) {
            return { rawResult: "", consoleResult: [], scriptResults: [] } as CompositeScriptExecutionResult;
        }

        const spl:string[] = result.split("\n");
        spl.forEach((line: string, index:number) => {
            if(isNil(line) )
                spl[index] = null;
            else{
                line = line.trim();
                //If the output does not have a "*** Script: " before it, then it is system output
                if(line.indexOf("*** Script: ") == -1){

                    scriptResults.push(new ScriptExecutionOutputLine(line).asSystemLine());
                //If the output does have a  "*** Script: " prefixing it, it is output from this script or a script being called
                }else if(line.indexOf("*** Script: ") !== -1){
                    line = line.replace("*** Script: ", "");
                    if(line.indexOf("[DEBUG]") !== -1){
                        scriptResults.push(new ScriptExecutionOutputLine(line).asDebugLine());
                    }else{
                        scriptResults.push(new ScriptExecutionOutputLine(line).asScriptLine());
                    }
                }
                //Keep the original array intact in order to preserve the order with system outputs.
                spl[index] = line;
            }

        });

        const filteredSpl = spl.filter(line => line !== null);

        return {rawResult: result, consoleResult: filteredSpl, scriptResults:scriptResults} as CompositeScriptExecutionResult;
    }
    private _parseAffectedRecords(parsedXMLObj: ScriptExecutionXMLResult) {
        return parsedXMLObj?.HTML?.BODY?.div
    }
}

interface ScriptExecutionXMLResult{
    HTML?: {
        BODY?: {
            PRE?: string | {
                "#text"?: string;
            };
            div?: string;
        };
    };
}

export type CompositeScriptExecutionResult = {
    consoleResult: string[];
    rawResult: string;
    scriptResults:ScriptExecutionOutputLine[];
}

export type BackgroundScriptExecutionResult = {
    raw: string;
    result: string;
    affectedRecords: string;
    consoleResult: string[];
    rawResult:string;
    scriptResults:ScriptExecutionOutputLine[];
};

export class ScriptExecutionOutputLine{
    private _line:string;
    private _isDebug:boolean = false;
    private _isSystem:boolean = false;
    private _isScript:boolean = false;

    public constructor(line:string){
        this._line = line;
    }

    public get line():string{
        return this._line;
    }

    public set line(val:string){
        this._line = val;
    }

    public asDebugLine(isDebugLine:boolean = true):ScriptExecutionOutputLine{
        this._isDebug = isDebugLine;

        return this;
    }

    public asSystemLine(isSystemLine:boolean = true):ScriptExecutionOutputLine{
        this._isSystem = isSystemLine;

        return this;
    }

    public asScriptLine(isScriptLine:boolean = true):ScriptExecutionOutputLine{
        this._isScript = isScriptLine;

        return this;
    }
}

// export type ScriptExecutionOutputLine = {
//     line:string;
//     isDebug:boolean;
//     isSystem:boolean;
//     isScript:boolean;
// };

export interface BackgroundScriptExecutorOptions {
    instance?: ServiceNowInstance;
    scope?: string;
}
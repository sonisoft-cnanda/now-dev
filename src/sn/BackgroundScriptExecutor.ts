import { ServiceNowInstance } from "./ServiceNowInstance";
import { HTTPRequest, HttpResponse } from "../comm/http/HTTPRequestHandler";
import { ServiceNowRequest } from "../comm/http/ServiceNowRequest";
//import { XMLParser } from "../utils";
import { BG_SCRIPT_ENDPOINT } from "../constants";
import { Logger } from "../util/Logger";
import { isNil } from "../amb/Helper";


export class BackgroundScriptExecutor {
    snRequest: ServiceNowRequest = new ServiceNowRequest();
    instance: ServiceNowInstance;
    scope: string;

    _logger:Logger = new Logger("BackgroundScriptExecutor");

    public constructor({ instance, scope }: BackgroundScriptExecutorOptions = {}) {
        if (instance && instance instanceof ServiceNowInstance) {
            this.instance = instance;
        }
        if (typeof scope == "string") {
            this.scope = scope;
        }
    }

    public async executeScript({
        script,
        scope = this.scope,
        instance = this.instance
    }: { script: string, scope: string, instance: ServiceNowInstance }): Promise<any> {
        if (!instance || !(instance instanceof ServiceNowInstance)) {
            throw new Error("instance must be a ServiceNowInstance");
        }
        if (!scope || typeof scope != "string") {
            throw new Error("scope must be a string");
        }
        if (!script || typeof script != "string") {
            throw new Error("script must be a string");
        }
        const endpoint = "/sys.scripts.do";

        try {
            const request: HTTPRequest = {
                path: BG_SCRIPT_ENDPOINT,
                headers: null,
                query: null,
                body: {
                    script: script,
                    sys_scope: scope,
                    runscript: 'Run script'
                }
            };

            const response: HttpResponse<string> = await this.snRequest.post<string>(request);
            if (response.status == 200) {
                const resultObj = await this.parseScriptResult(response?.bodyObject);
                return resultObj?.result;
            } else {
                throw new Error(`Script Execution Request resulted in ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Error executing script: ${error.message}`);
        }
    }

    public async parseScriptResult(responseXML: string) {
        // const parser = new XMLParser({
        //     explicitArray: false,
        //     ignoreAttrs: true,
        // });
        // const strippedResponseXML = responseXML.replace(/^\[[0-9:.]+\]/g, "");
        // return await parser.parseStringPromise(strippedResponseXML)
        //     .then((result) => {
        //         return {
        //             raw: responseXML,
        //             result: this._parseBGScriptResult(result),
        //             affectedRecords: this._parseAffectedRecords(result)
        //         }
        //     })

        return {
                        raw: null,
                        result: null,
                        affectedRecords: null
                    }
    }

    public async getBackgroundScriptCSRFToken() : Promise<string> {
        let csrfToken:string = null;

        const request: HTTPRequest = {
            path: BG_SCRIPT_ENDPOINT,
            headers: null,
            query: null,
            body: null
        };
        const response: HttpResponse<string> = await this.snRequest.get<string>(request);
        let isLoggedIn:boolean = response.headers["x-is-logged-in"] === "true" ? true : false
        if(response.status == 200 && isLoggedIn && !isNil(response.data)){
            
            const e =  response.data as String;
            let t = "<input name=\"sysparm_ck\" type=\"hidden\" value=\"";
           
            let n = e.substring(e.indexOf(t));
            csrfToken =  n.substring(0, n.indexOf("\">")).replace(t, "");
            this._logger.debug("CSRF Token Received: " + csrfToken, {csrfToken:csrfToken});
        }else{
            this._logger.error("getBackgroundScriptCSRFToken: Invalid response. Status not 200, not logged in, or response data is empty.", {response:response});
        }
          

        return csrfToken;
      }

    private _parseBGScriptResult(parsedXMLObj: any) {
        const result = parsedXMLObj?.HTML.BODY?.PRE?._?.replace("<BR/>", "\n")
        return result?.replace("*** Script: ", "").trim()
    }
    private _parseAffectedRecords(parsedXMLObj: any) {
        return parsedXMLObj?.HTML?.BODY?.div
    }
}

export interface BackgroundScriptExecutorOptions {
    instance?: ServiceNowInstance;
    scope?: string;
}
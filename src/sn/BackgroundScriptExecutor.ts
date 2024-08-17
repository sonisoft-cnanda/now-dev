import { ServiceNowInstance } from "./ServiceNowInstance";
import { HTTPRequest, HttpResponse } from "../comm/http/HTTPRequestHandler";
import { ServiceNowRequest } from "../comm/http/ServiceNowRequest";
import { XMLParser } from "../utils";
import { BG_SCRIPT_ENDPOINT } from "../constants";


export class BackgroundScriptExecutor {
    snRequest: ServiceNowRequest = new ServiceNowRequest();
    instance: ServiceNowInstance;
    scope: string;

    constructor({ instance, scope }: BackgroundScriptExecutorOptions = {}) {
        if (instance && instance instanceof ServiceNowInstance) {
            this.instance = instance;
        }
        if (typeof scope == "string") {
            this.scope = scope;
        }
    }

    async executeScript({
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

    async parseScriptResult(responseXML: string) {
        const parser = new XMLParser({
            explicitArray: false,
            ignoreAttrs: true,
        });
        const strippedResponseXML = responseXML.replace(/^\[[0-9:.]+\]/g, "");
        return await parser.parseStringPromise(strippedResponseXML)
            .then((result) => {
                return {
                    raw: responseXML,
                    result: this._parseBGScriptResult(result),
                    affectedRecords: this._parseAffectedRecords(result)
                }
            })
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
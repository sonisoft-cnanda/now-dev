/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ServiceNowInstance } from "./ServiceNowInstance.js";
import { ServiceNowRequest } from "../comm/http/ServiceNowRequest.js";
//import { XMLParser } from "../utils";
import { XMLParser } from 'fast-xml-parser';
import { Logger } from "../util/Logger.js";
import { BG_SCRIPT_ENDPOINT } from "../constants/ServiceNow.js";
import { isNil } from "../util/utils.js";
export class BackgroundScriptExecutor {
    snRequest;
    instance;
    scope;
    _logger = new Logger("BackgroundScriptExecutor");
    constructor(instance, scope) {
        this.instance = instance;
        this.scope = scope;
        this.snRequest = new ServiceNowRequest(this.instance);
    }
    async executeScript(script, scope = this.scope, instance = this.instance) {
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
            const gck = await this.getBackgroundScriptCSRFToken();
            const fd = new FormData();
            fd.append("script", script);
            fd.append("sysparm_ck", gck);
            fd.append("runscript", "Run script");
            fd.append("sys_scope", scope);
            fd.append("record_for_rollback", "off");
            fd.append("quota_managed_transaction", "off");
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const params = new URLSearchParams(fd);
            const request = {
                path: BG_SCRIPT_ENDPOINT,
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                query: null,
                body: params
            };
            this._logger.debug("Execute Background Script Request.", { request: request, formData: fd });
            const response = await this.snRequest.post(request);
            if (response.status == 200) {
                const bodyXml = response?.data;
                if (bodyXml) {
                    const resultObj = this.parseScriptResult(bodyXml);
                    return resultObj;
                }
                else {
                    throw new Error("Body not XML String");
                }
            }
            else {
                throw new Error(`Script Execution Request resulted in ${response.status}`);
            }
        }
        catch (error) {
            const err = error;
            throw new Error(`Error executing script: ${err.message}`);
        }
    }
    parseScriptResult(responseXML) {
        const options = {
            ignoreAttributes: false,
            unpairedTags: ["hr", "br", "link", "meta"],
            stopNodes: ["*.pre", "*.script"],
            processEntities: true,
            htmlEntities: true,
            tagValueProcessor: (tagName, tagValue) => {
                if (tagName === "PRE") {
                    return tagValue + "\n";
                }
                return tagValue;
            }
        };
        const parser = new XMLParser(options);
        const strippedResponseXML = responseXML.replace(/^\[[0-9:.]+\]/g, "");
        const jObj = parser.parse(strippedResponseXML);
        const compositeResult = this._parseBGScriptResult(jObj);
        const affectedRecords = this._parseAffectedRecords(jObj);
        const scriptResult = {
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
    async getBackgroundScriptCSRFToken() {
        let csrfToken = null;
        const request = {
            path: BG_SCRIPT_ENDPOINT,
            headers: null,
            query: null,
            body: null
        };
        const response = await this.snRequest.get(request);
        const isLoggedIn = response.headers["x-is-logged-in"] === "true" ? true : false;
        if (response.status == 200 && isLoggedIn && !isNil(response.data)) {
            const e = response.data;
            const t = "<input name=\"sysparm_ck\" type=\"hidden\" value=\"";
            const n = e.substring(e.indexOf(t));
            csrfToken = n.substring(0, n.indexOf("\">")).replace(t, "");
            this._logger.debug("CSRF Token Received: " + csrfToken, { csrfToken: csrfToken });
        }
        else {
            this._logger.error("getBackgroundScriptCSRFToken: Invalid response. Status not 200, not logged in, or response data is empty.", { response: response });
        }
        return csrfToken;
    }
    _parseBGScriptResult(parsedXMLObj) {
        this._logger.debug("_parseBGScriptResult enter", parsedXMLObj);
        const scriptResults = [];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const result = parsedXMLObj.HTML.BODY.PRE["#text"];
        const spl = result.split("\n");
        spl.forEach((line, index) => {
            if (isNil(line))
                spl[index] = null;
            else {
                line = line.trim();
                //If the output does not have a "*** Script: " before it, then it is system output
                if (line.indexOf("*** Script: ") == -1) {
                    scriptResults.push(new ScriptExecutionOutputLine(line).asSystemLine());
                    //If the output does have a  "*** Script: " prefixing it, it is output from this script or a script being called   
                }
                else if (line.indexOf("*** Script: ") !== -1) {
                    line = line.replace("*** Script: ", "");
                    if (line.indexOf("[DEBUG]") !== -1) {
                        scriptResults.push(new ScriptExecutionOutputLine(line).asDebugLine());
                    }
                    else {
                        scriptResults.push(new ScriptExecutionOutputLine(line).asScriptLine());
                    }
                }
                //Keep the original array intact in order to preserve the order with system outputs.
                spl[index] = line;
            }
        });
        const filteredSpl = spl.filter(line => line !== null);
        return { rawResult: result, consoleResult: filteredSpl, scriptResults: scriptResults };
    }
    _parseAffectedRecords(parsedXMLObj) {
        return parsedXMLObj?.HTML?.BODY?.div;
    }
}
export class ScriptExecutionOutputLine {
    _line;
    _isDebug = false;
    _isSystem = false;
    _isScript = false;
    constructor(line) {
        this._line = line;
    }
    get line() {
        return this._line;
    }
    set line(val) {
        this._line = val;
    }
    asDebugLine(isDebugLine = true) {
        this._isDebug = isDebugLine;
        return this;
    }
    asSystemLine(isSystemLine = true) {
        this._isDebug = isSystemLine;
        return this;
    }
    asScriptLine(isScriptLine = true) {
        this._isDebug = isScriptLine;
        return this;
    }
}
//# sourceMappingURL=BackgroundScriptExecutor.js.map
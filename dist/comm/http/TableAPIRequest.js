import { ServiceNowRequest } from "./ServiceNowRequest.js";
export class TableAPIRequest {
    _headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };
    _apiBase = "/api/now/table/{table_name}";
    _snInstance;
    get snInstance() {
        return this._snInstance;
    }
    set snInstance(value) {
        this._snInstance = value;
    }
    constructor(instance) {
        this.snInstance = instance;
    }
    async get(tableName, query) {
        const uri = this.replaceVar(this._apiBase, { table_name: tableName });
        return await this._doRequest(uri, "get", query, null);
    }
    async post(tableName, query, body) {
        const uri = this.replaceVar(this._apiBase, { table_name: tableName });
        return await this._doRequest(uri, "post", query, body);
    }
    async _doRequest(uri, httpMethod, query, bodyData) {
        let resp = null;
        try {
            const req = new ServiceNowRequest(this.snInstance);
            const request = { path: uri, method: httpMethod, headers: this._headers, query: query, body: bodyData };
            resp = await req.executeRequest(request);
        }
        catch (err) {
            console.log(err);
        }
        return resp;
    }
    replaceVar(strBaseString, variables) {
        let strNewString = strBaseString;
        for (const prop in variables) {
            strNewString = strNewString.replace("{" + prop + "}", variables[prop]);
        }
        return strNewString;
    }
}
//# sourceMappingURL=TableAPIRequest.js.map
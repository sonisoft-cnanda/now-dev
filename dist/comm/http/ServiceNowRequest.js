import { AuthenticationHandlerFactory } from "../../auth/AuthenticationHandlerFactory.js";
import { RequestHandlerFactory } from "./RequestHandlerFactory.js";
export class ServiceNowRequest {
    _instance;
    _requestHandler;
    auth;
    _session = null;
    constructor(instance) {
        this.auth = AuthenticationHandlerFactory.createAuthHandler();
        this._requestHandler = RequestHandlerFactory.createRequestHandler(instance, this.auth);
        this._instance = instance;
    }
    async executeRequest(request) {
        let httpMethod = request.method;
        let resp = null;
        if (typeof httpMethod != "undefined" && httpMethod) {
            httpMethod = httpMethod.trim().toLowerCase();
            switch (httpMethod) {
                case "post":
                    resp = await this.post(request);
                    break;
                case "put":
                    resp = await this.put(request);
                    break;
                case "get":
                    resp = await this.get(request);
                    break;
                case "delete":
                    resp = await this.delete(request);
                    break;
            }
        }
        else {
            throw new Error("Method must be populated on HTTPRequest object in order to utlize executeRequest.");
        }
        return resp;
    }
    async put(request) {
        if (!this.isLoggedIn())
            await this.ensureLoggedIn();
        return await this._requestHandler.put(request);
    }
    async post(request) {
        if (!this.isLoggedIn())
            await this.ensureLoggedIn();
        return await this._requestHandler.post(request);
    }
    async get(request) {
        if (!this.isLoggedIn())
            await this.ensureLoggedIn();
        return await this._requestHandler.get(request);
    }
    async delete(request) {
        if (!this.isLoggedIn())
            await this.ensureLoggedIn();
        return await this._requestHandler.delete(request);
    }
    async ensureLoggedIn() {
        //if(!this.isLoggedIn()){
        this._session = await this.auth.doLogin(this._instance.getHost(), this._instance.getUserName(), this._instance.getPassword());
        if (!this.auth.isLoggedIn()) {
            throw new Error("Unable to login.");
        }
        this._requestHandler.setRequestToken(this.auth.getToken());
        //this._requestHandler._defaultHeaders["cookie"] = this.auth.getCookies();
        //}
    }
    isLoggedIn() {
        return this.getAuth().isLoggedIn();
    }
    getAuth() {
        return this.auth;
    }
}
//# sourceMappingURL=ServiceNowRequest.js.map
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { Logger } from '../../util/Logger.js';
import { isNil } from '../../util/utils.js';
axios.defaults.withCredentials = true;
export class RequestHandler {
    _logger = new Logger("RequestHandler");
    _defaultHeaders;
    httpClient;
    _cookies;
    _cookieStore;
    _authHandler;
    _snInstance;
    get snInstance() {
        return this._snInstance;
    }
    set snInstance(value) {
        this._snInstance = value;
    }
    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    constructor(snInstance, authHandler) {
        this.snInstance = snInstance;
        this._defaultHeaders = {};
        this._authHandler = authHandler;
        //Need to get the config from the extension info
        //baseURL should be instance URL that was added to settings
        //todo: Updated with settings config
        this.httpClient = axios.create({
            withCredentials: true,
            baseURL: this.snInstance.getHost(),
        });
        this.httpClient.defaults.maxRedirects = 0;
    }
    getHttpClient() {
        return this.httpClient;
    }
    //FIXME: This should pull a more variable instance url
    async getCookies() {
        return await this._authHandler.getCookies().getCookies(this.snInstance.getHost());
    }
    async getCookieString() {
        return await this._authHandler.getCookies().getCookieString(this.snInstance.getHost());
    }
    setRequestToken(token) {
        this._defaultHeaders["X-Usertoken"] = token;
    }
    async request(config) {
        for (const prop in this._defaultHeaders) {
            if (typeof this._defaultHeaders[prop] != 'undefined' && this._defaultHeaders[prop])
                config.headers[prop] = this._defaultHeaders[prop];
        }
        config.headers["Cookie"] = await this.getCookieString();
        return this.httpClient.request(config);
    }
    async post(request) {
        const { config, url } = await this.getRequestConfig(request);
        this._logger.debug("Retrieved Configuration", { config: config, url: url });
        let response = null;
        try {
            response = await this.httpClient.post(url, request.body, config);
            this._logger.debug("Http  POST Response Received", response);
            try {
                if (!((response.data) instanceof String)) {
                    const rpObj = response.data;
                    response.bodyObject = rpObj;
                }
            }
            catch (ex) {
                this._logger.error("Error setting response.bodyObject.", { error: ex, response: response, request: request });
            }
            return response;
        }
        catch (ex) {
            const err = ex;
            this._logger.error("Error during POST request.", { error: err, response: response, request: request });
            throw err;
        }
        return null;
    }
    async put(request) {
        const { config, url } = await this.getRequestConfig(request);
        this._logger.debug("Retrieved Configuration", { config: config, url: url });
        let response = null;
        try {
            response = await this.httpClient.put(url, request.body, config);
            this._logger.debug("Http PUT Response Received", response);
            try {
                if (!((response.data) instanceof String)) {
                    const rpObj = response.data;
                    response.bodyObject = rpObj;
                }
            }
            catch (ex) {
                const err = ex;
                this._logger.error("Error during PUT request.", { err, request });
                throw err;
                //console.log(ex);
            }
            return response;
        }
        catch (ex) {
            const err = ex;
            this._logger.error("Error during PUT request.", { err, request });
            throw err;
        }
    }
    async get(request) {
        this._logger.debug("get", request);
        const { config, url } = await this.getRequestConfig(request);
        this._logger.debug("Retrieved Configuration", { config: config, url: url });
        let response = null;
        try {
            response = await this.httpClient.get(url, config);
            this._logger.debug("Http Response Received", response);
            try {
                if (!((response.data) instanceof String)) {
                    const rpObj = response.data;
                    response.bodyObject = rpObj;
                }
            }
            catch (ex) {
                const err = ex;
                this._logger.error("Error setting response.bodyObject.", { error: err, response: response, request: request });
                throw err;
            }
            return response;
        }
        catch (ex) {
            const err = ex;
            this._logger.error("Error setting response.bodyObject.", { error: err, response: response, request: request });
            throw err;
        }
    }
    async delete(request) {
        const { config, url } = await this.getRequestConfig(request);
        try {
            const response = await this.httpClient.delete(url, config);
            try {
                if (!((response.data) instanceof String)) {
                    const rpObj = response.data;
                    response.bodyObject = rpObj;
                }
            }
            catch (ex) {
                const err = ex;
                this._logger.error("Error setting response.bodyObject.", { error: err, response: response, request: request });
                throw err;
            }
            return response;
        }
        catch (ex) {
            const err = ex;
            this._logger.error("Error setting response.bodyObject.", { error: err, request: request });
            throw err;
        }
    }
    async getRequestConfig(request) {
        const config = {
            withCredentials: true,
            headers: this._defaultHeaders
        };
        let url = request.path;
        if (request.headers != null) {
            for (const prop in request.headers) {
                if (!isNil(request.headers[prop])) {
                    const val = request.headers[prop];
                    config.headers[prop] = val;
                }
            }
        }
        config.headers["Cookie"] = await this.getCookieString();
        if (request.query != null) {
            const strQuery = this.getQueryString(request.query);
            if (url.indexOf("?") == -1) {
                url += "?" + strQuery;
            }
            else {
                url += "&" + strQuery;
            }
        }
        return { config: config, url: url };
    }
    getQueryString(queryObj) {
        const params = new URLSearchParams();
        for (const prop in queryObj) {
            params.set(prop, queryObj[prop]);
        }
        return params.toString();
        ;
    }
}
//# sourceMappingURL=RequestHandler.js.map
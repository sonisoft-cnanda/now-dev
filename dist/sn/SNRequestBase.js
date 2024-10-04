import { ServiceNowRequest } from "../comm/http/ServiceNowRequest.js";
import { Logger } from "../util/Logger.js";
export class SNRequestBase {
    _snInstance;
    _req;
    _logger = new Logger("ATFTestExecutor");
    constructor(instance) {
        this._snInstance = instance;
        this._req = new ServiceNowRequest(this._snInstance);
    }
    get request() {
        return this._req;
    }
    set request(value) {
        this._req = value;
    }
    get snInstance() {
        return this._snInstance;
    }
    set snInstance(value) {
        this._snInstance = value;
    }
}
//# sourceMappingURL=SNRequestBase.js.map
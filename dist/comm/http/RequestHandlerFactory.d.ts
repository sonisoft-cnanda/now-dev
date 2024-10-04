import { IAuthenticationHandler } from "../../auth/IAuthenticationHandler.js";
import { IServiceNowInstance } from "../../sn/IServiceNowInstance.js";
import { IRequestHandler } from "./IRequestHandler.js";
export declare class RequestHandlerFactory {
    static createRequestHandler(snInstance: IServiceNowInstance, authHandler: IAuthenticationHandler): IRequestHandler;
}

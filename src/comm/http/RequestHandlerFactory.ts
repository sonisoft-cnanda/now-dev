import { IAuthenticationHandler } from "../../auth/IAuthenticationHandler";
import { IServiceNowInstance } from "../../sn/IServiceNowInstance";
import { IRequestHandler } from "./IRequestHandler";
import { RequestHandler } from "./RequestHandler";

export class RequestHandlerFactory{

    public static createRequestHandler( authHandler:IAuthenticationHandler):IRequestHandler{
        return new RequestHandler( authHandler);
    }
}
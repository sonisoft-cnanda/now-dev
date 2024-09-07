import { IAuthenticationHandler } from "../../auth/IAuthenticationHandler";
import { ICookieStore } from "./ICookieStore";
import { IRequestHandler } from "./IRequestHandler";
import { RequestHandler } from "./RequestHandler";
import { Cookie } from 'tough-cookie';

export class RequestHandlerFactory{

    public static createRequestHandler(authHandler:IAuthenticationHandler):IRequestHandler{
        return new RequestHandler(authHandler);
    }
}
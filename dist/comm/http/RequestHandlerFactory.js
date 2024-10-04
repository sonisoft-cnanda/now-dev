import { RequestHandler } from "./RequestHandler.js";
export class RequestHandlerFactory {
    static createRequestHandler(snInstance, authHandler) {
        return new RequestHandler(snInstance, authHandler);
    }
}
//# sourceMappingURL=RequestHandlerFactory.js.map

import { IHttpResponse } from "./IHttpResponse";
export class HttpResponse<T> implements IHttpResponse<T>{

    constructor(bodyObject: T){
        this.bodyObject = bodyObject;
    }

    bodyObject?: T;
    data: T;
    body: string;
    status: number;
    statusText: string;
    headers: object;
    config: object;
    request?: any;
    cookies: any[];
}
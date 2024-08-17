import { AxiosResponse } from "axios";


export interface HttpResponse<T> extends AxiosResponse {
    bodyObject?: T;
}

export interface IHttpResponse<T> extends AxiosResponse {
    bodyObject?: T;
}
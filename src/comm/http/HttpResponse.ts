import { AxiosHeaderValue, AxiosResponse, AxiosResponseHeaders, InternalAxiosRequestConfig } from "axios";

import { RawAxiosRequestHeaders } from 'axios';
import { IHttpResponse } from "./IHttpResponse";

export class HttpResponse<T> implements IHttpResponse<T> {
    data: any;
    status: number;
    statusText: string;
    headers: AxiosResponseHeaders | Partial<RawAxiosRequestHeaders & { "Content-Type": AxiosHeaderValue; "Content-Length": AxiosHeaderValue; "Content-Encoding": AxiosHeaderValue; Server: AxiosHeaderValue; "Cache-Control": AxiosHeaderValue; } & { "set-cookie": string[]; }>;
    config: InternalAxiosRequestConfig<any>;
    request?: any;
    bodyObject?: T;
}
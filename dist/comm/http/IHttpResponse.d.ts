import { AxiosResponse } from "axios";
export interface IHttpResponse<T> extends AxiosResponse {
    bodyObject?: T;
}

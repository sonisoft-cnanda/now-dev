
export interface IHttpResponse<T> {
    bodyObject?: T;
    data: T;
    status: number;
    statusText: string;
    headers: object;
    config: object;
    request?: any;
}


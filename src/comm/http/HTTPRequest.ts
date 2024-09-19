/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-explicit-any */


export interface HTTPRequest {
    path:string;
    headers:object | null;
    body:any | null;
    query:object | null;
    method?:string | null;
    
}


export interface HTTPRequest {
    path:string;
    headers:object | null;
    body:any | null;
    query:object | null;
    method?:string | null;
    
}
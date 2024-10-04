export interface ReferenceLink {
    "link": string;
    "value": string;
}
export interface ServiceNowResponse<T> {
    "result": T;
}
export interface ServiceNowTableResponse<T> {
    "result": T[];
}

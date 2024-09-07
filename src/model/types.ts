export type ReferenceLink = {
    "link":string ;
    "value":string;
}


export type ServiceNowResponse<T> = {
    "result":T;
}

export type ServiceNowTableResponse<T> = {
    "result":T[];
}
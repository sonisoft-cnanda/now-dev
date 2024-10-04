export declare class InvalidParameterException extends Error {
    private _data;
    constructor(errorMessage: string, data?: any);
    getData(): any;
}

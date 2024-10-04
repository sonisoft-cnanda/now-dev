export declare class FileException extends Error {
    private _innerException;
    get innerException(): Error;
    set innerException(value: Error);
    constructor(errorMessage: string, innerException?: Error);
}

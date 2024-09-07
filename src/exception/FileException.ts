

export class FileException extends Error{
    
    private _innerException: Error;
    public get innerException(): Error {
        return this._innerException;
    }
    public set innerException(value: Error) {
        this._innerException = value;
    }

    public constructor(errorMessage:string, innerException?:Error){
        super(errorMessage);

        if(innerException)
            this.innerException = innerException;
        

    }
}
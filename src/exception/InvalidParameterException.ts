

export class InvalidParameterException extends Error{

    private _data:any;
    public constructor(errorMessage:string, data?:any){
        super(errorMessage);
        if(data)
            this._data = data;
    }

    public getData() : any{
        return this._data;
    }

}
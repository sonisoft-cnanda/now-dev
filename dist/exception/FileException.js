export class FileException extends Error {
    _innerException;
    get innerException() {
        return this._innerException;
    }
    set innerException(value) {
        this._innerException = value;
    }
    constructor(errorMessage, innerException) {
        super(errorMessage);
        if (innerException)
            this.innerException = innerException;
    }
}
//# sourceMappingURL=FileException.js.map
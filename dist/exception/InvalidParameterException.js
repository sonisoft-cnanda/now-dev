export class InvalidParameterException extends Error {
    _data;
    constructor(errorMessage, data) {
        super(errorMessage);
        if (data)
            this._data = data;
    }
    getData() {
        return this._data;
    }
}
//# sourceMappingURL=InvalidParameterException.js.map
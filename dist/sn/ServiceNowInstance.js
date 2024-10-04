export class ServiceNowInstance {
    _isDefault;
    _host;
    _username;
    _alias;
    _password;
    constructor(snInstanceSettingsObj) {
        if (typeof snInstanceSettingsObj != 'undefined' && snInstanceSettingsObj != null) {
            if (snInstanceSettingsObj.host) {
                this._host = snInstanceSettingsObj.host;
            }
            if (snInstanceSettingsObj.alias) {
                this._alias = snInstanceSettingsObj.alias;
            }
            if (snInstanceSettingsObj.username) {
                this._username = snInstanceSettingsObj.username;
            }
            if (snInstanceSettingsObj.isDefault) {
                this._isDefault = snInstanceSettingsObj.isDefault;
            }
            if (snInstanceSettingsObj.password) {
                this._password = snInstanceSettingsObj.password;
            }
        }
    }
    isDefault() {
        return this._isDefault;
    }
    getHost() {
        return this._host;
    }
    getUserName() {
        return this._username;
    }
    getAlias() {
        return this._alias;
    }
    //todo: Do we store the password in Secrets or the entire SN Instance? Can we store the entire array of SN Instances in secrets?
    getPassword() {
        return this._password;
    }
}
//# sourceMappingURL=ServiceNowInstance.js.map
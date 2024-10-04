import { IServiceNowInstance } from "./IServiceNowInstance.js";
export interface ServiceNowSettingsInstance {
    host?: string;
    username?: string;
    alias?: string;
    isDefault?: boolean;
    password?: string;
}
export declare class ServiceNowInstance implements IServiceNowInstance {
    private _isDefault;
    private _host;
    private _username;
    private _alias;
    private _password;
    constructor(snInstanceSettingsObj?: ServiceNowSettingsInstance | null);
    isDefault(): boolean;
    getHost(): string;
    getUserName(): string;
    getAlias(): string;
    getPassword(): string;
}

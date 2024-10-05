import { Creds, UISession } from '@servicenow/sdk-cli-core';
import * as sdk_auth from '@servicenow/sdk-cli/dist/auth/index.js';
export interface CredentialArg extends sdk_auth.StoredCredential {
    isDefault: boolean;
    alias: string;
    auth: string;
}
export interface NowAuthArgument {
    _: string | number[];
    alias: string;
    auth: string;
}
/***
 * Wraps the functions exposed in @servicenow/sdk-cli/auth/index.ts
 */
export declare class CredentialWrapper {
    private _logger;
    private keychain;
    private DEFAULT_ALIAS;
    constructor();
    getStoredCredentials(alias?: string): Promise<Creds>;
    testCredential(username: null, password: null, host: null): Promise<Creds>;
    getStoredCredentialsByAlias(alias?: string): Promise<Creds | null>;
    getCredentialsTestWrapper(username: null, password: null, host: null): Promise<Creds>;
    validateCredentials(alias: string): Promise<ValidateCredentialsResult>;
    storeCredentials(alias: string, isDefault: boolean, host: string, username: string, password: string): Promise<void>;
    updateDefaultCredential(alias: string, defaultCreds?: sdk_auth.StoredCredential): Promise<void>;
    getDefaultCredentials(): Promise<sdk_auth.StoredCredential | undefined>;
    removeCredentials(alias: string): Promise<void>;
    listCredentials(alias: string): Promise<void>;
}
export type ValidateCredentialsResult = {
    instanceUrl: string | null;
    isSuccess: boolean;
    session: UISession | null;
};

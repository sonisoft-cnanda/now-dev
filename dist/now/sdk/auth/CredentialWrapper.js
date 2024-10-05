import * as sdk_auth from '@servicenow/sdk-cli/dist/auth/index.js';
import { NowStringUtil } from '../../../util/NowStringUtil.js';
import { KeyChain } from '@servicenow/sdk-cli/dist/auth/keychain/index.js';
import { Logger } from '../../../util/Logger.js';
/***
 * Wraps the functions exposed in @servicenow/sdk-cli/auth/index.ts
 */
export class CredentialWrapper {
    _logger = new Logger("CredentialWrapper");
    keychain;
    DEFAULT_ALIAS = 'fluent-default';
    constructor() {
        this.keychain = new KeyChain(sdk_auth.SERVICE);
    }
    async getStoredCredentials(alias) {
        return await this.getStoredCredentialsByAlias(alias);
    }
    async testCredential(username, password, host) {
        return await this.getCredentialsTestWrapper(username, password, host);
    }
    async getStoredCredentialsByAlias(alias) {
        //let credArgs:ArgumentsCamelCase<Arguments> = {alias: alias};
        let credentialResult = null;
        const credentialArgs = { _: [], alias: null, auth: null };
        if (!NowStringUtil.isStringEmpty(alias)) {
            credentialArgs.auth = alias;
            credentialArgs.alias = alias;
        }
        try {
            credentialResult = await sdk_auth.getCredentials(credentialArgs);
        }
        catch (e) {
            const err = e;
            this._logger.error("Error occurred retrieving credential for alias: " + alias + ". Error message:" + err.message, err);
            if (err.message.indexOf("Could not find stored credentials for alias") !== -1) {
                credentialResult = null;
            }
            else
                throw err;
        }
        return credentialResult;
    }
    async getCredentialsTestWrapper(username, password, host) {
        const credentialArgs = { command: "test", alias: null, auth: null, username: username, password: password, host: host, isDefault: false };
        return await sdk_auth.getCredentials(credentialArgs);
    }
    async validateCredentials(alias) {
        const { login: loginService } = await import('@servicenow/sdk-cli-core/dist/command/login/index.js');
        const result = { instanceUrl: null, isSuccess: false, session: null };
        try {
            const creds = await this.getStoredCredentials(alias);
            const session = await loginService(creds, this._logger);
            if (!session) {
                result.isSuccess = false;
                return result;
            }
            const { instanceUrl } = session;
            result.session = session;
            result.instanceUrl = instanceUrl;
            result.isSuccess = true;
            this._logger.successful(`Successfully validated creds with instance ${instanceUrl}.`);
        }
        catch (error) {
            result.isSuccess = false;
            this._logger.error(error instanceof Error ? error.message : error, error);
        }
        return result;
    }
    async storeCredentials(alias, isDefault, host, username, password) {
        const { login: loginService } = await import('@servicenow/sdk-cli-core/dist/command/login/index.js');
        try {
            const credential = { host, username, password };
            const session = await loginService(credential, this._logger);
            if (!session) {
                return;
            }
            const { instanceUrl } = session;
            this._logger.successful(`Successfully authenticated to instance ${instanceUrl}.`);
            this._logger.info(`Storing credentials for instance "${instanceUrl}" with alias ${alias}.`);
            await sdk_auth.storeCredentials(alias, instanceUrl, username, password, isDefault);
            this._logger.successful(`Successfully stored credentials for instance "${instanceUrl}" with alias ${alias}.`);
        }
        catch (error) {
            this._logger.error(error instanceof Error ? error.message : error, error);
        }
    }
    async updateDefaultCredential(alias, defaultCreds) {
        if (defaultCreds) {
            await sdk_auth.updateDefaultCredential(alias, defaultCreds);
        }
        else {
            await sdk_auth.updateDefaultCredential(alias);
        }
    }
    async getDefaultCredentials() {
        const keyStore = await this.keychain.getPassword(this.DEFAULT_ALIAS);
        if (!keyStore) {
            return;
        }
        return JSON.parse(keyStore);
    }
    async removeCredentials(alias) {
        await sdk_auth.removeCredentials(alias);
    }
    async listCredentials(alias) {
        await sdk_auth.listCredentials(alias);
    }
}
//# sourceMappingURL=CredentialWrapper.js.map
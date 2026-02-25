import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { HTTPRequest } from "../../comm/http/HTTPRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import {
    ApplicationRecord,
    ApplicationResponse,
    ApplicationSingleResponse,
    CurrentApplicationResponse,
    SetCurrentApplicationResult,
    ListApplicationsOptions
} from './ScopeModels';

/**
 * ScopeManager provides operations for managing ServiceNow application scopes.
 * Supports setting/getting the current application, listing applications,
 * and retrieving application details.
 */
export class ScopeManager {
    private static readonly UI_APP_PATH = '/api/now/ui/concoursepicker/application';
    private static readonly UI_PREF_APP_PATH = '/api/now/ui/preferences/apps.current';
    private static readonly SYS_APP_TABLE = 'sys_app';

    private _logger: Logger = new Logger("ScopeManager");
    private _req: ServiceNowRequest;
    private _tableAPI: TableAPIRequest;
    private _instance: ServiceNowInstance;

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
        this._tableAPI = new TableAPIRequest(instance);
    }

    /**
     * Set the current application scope.
     * Validates the sys_id, retrieves the previous scope, performs the PUT,
     * and verifies the change.
     *
     * @param appSysId The sys_id of the application to set as current (32-char hex)
     * @returns Result of the operation including previous scope and verification
     * @throws Error if appSysId is invalid or the application is not found
     */
    public async setCurrentApplication(appSysId: string): Promise<SetCurrentApplicationResult> {
        if (!appSysId || appSysId.trim().length === 0) {
            throw new Error('Application sys_id is required');
        }

        // Validate 32-character hexadecimal sys_id
        const hexPattern = /^[0-9a-fA-F]{32}$/;
        if (!hexPattern.test(appSysId.trim())) {
            throw new Error('Application sys_id must be a 32-character hexadecimal string');
        }

        this._logger.info(`Setting current application to: ${appSysId}`);

        const warnings: string[] = [];

        // Get the target application details
        const appQuery: Record<string, string | number> = {
            sysparm_query: `sys_id=${appSysId}`,
            sysparm_limit: 1
        };

        const appResp: IHttpResponse<ApplicationResponse> = await this._tableAPI.get<ApplicationResponse>(
            ScopeManager.SYS_APP_TABLE,
            appQuery
        );

        if (!appResp || appResp.status !== 200 || !appResp.bodyObject?.result || appResp.bodyObject.result.length === 0) {
            throw new Error(`Application '${appSysId}' not found`);
        }

        const targetApp = appResp.bodyObject.result[0];

        // Get the current application (previous scope)
        let previousScope: { sys_id?: string; name?: string } | undefined;
        try {
            const currentApp = await this.getCurrentApplication();
            if (currentApp) {
                previousScope = {
                    sys_id: currentApp.sys_id,
                    name: currentApp.name
                };
            }
        } catch (err) {
            warnings.push(`Could not retrieve previous scope: ${err instanceof Error ? err.message : String(err)}`);
        }

        // PUT to concoursepicker to change the application
        const putRequest: HTTPRequest = {
            method: 'PUT',
            path: ScopeManager.UI_APP_PATH,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            query: null,
            body: null,
            json: { app_id: appSysId }
        };

        const putResp: IHttpResponse<unknown> = await this._req.put<unknown>(putRequest);

        if (putResp.status !== 200) {
            throw new Error(`Failed to set current application. Status: ${putResp.status}`);
        }

        // Verify the change by getting the current application again
        let verified = false;
        try {
            const verifyApp = await this.getCurrentApplication();
            if (verifyApp && verifyApp.sys_id === appSysId) {
                verified = true;
            } else {
                warnings.push('Scope change could not be verified — current app does not match target');
            }
        } catch (err) {
            warnings.push(`Verification failed: ${err instanceof Error ? err.message : String(err)}`);
        }

        this._logger.info(`Set current application to: ${targetApp.name} (${targetApp.scope || 'unknown scope'})`);

        return {
            success: true,
            application: targetApp.name,
            scope: (targetApp.scope || '') as string,
            sysId: appSysId,
            previousScope,
            verified,
            warnings
        };
    }

    /**
     * Get the current application from session preferences.
     * Uses GET /api/now/ui/preferences/apps.current
     *
     * @returns The current ApplicationRecord or null
     */
    public async getCurrentApplication(): Promise<ApplicationRecord | null> {
        this._logger.info('Getting current application');

        const request: HTTPRequest = {
            method: 'GET',
            path: ScopeManager.UI_PREF_APP_PATH,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            query: null,
            body: null
        };

        const resp: IHttpResponse<CurrentApplicationResponse> = await this._req.get<CurrentApplicationResponse>(request);

        if (resp.status === 200 && resp.bodyObject?.result) {
            this._logger.info(`Current application: ${resp.bodyObject.result.name}`);
            return resp.bodyObject.result;
        }

        throw new Error(`Failed to get current application. Status: ${resp.status}`);
    }

    /**
     * List applications from the sys_app table.
     * Uses Table API GET on sys_app.
     *
     * @param options Optional query and limit options
     * @returns Array of ApplicationRecord
     */
    public async listApplications(options: ListApplicationsOptions = {}): Promise<ApplicationRecord[]> {
        const { encodedQuery, limit = 100 } = options;

        this._logger.info(`Listing applications with query: ${encodedQuery || 'none'}`);

        const query: Record<string, string | number> = {
            sysparm_limit: limit
        };

        if (encodedQuery) {
            query.sysparm_query = encodedQuery;
        }

        const response: IHttpResponse<ApplicationResponse> = await this._tableAPI.get<ApplicationResponse>(
            ScopeManager.SYS_APP_TABLE,
            query
        );

        if (response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Retrieved ${response.bodyObject.result.length} applications`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to list applications. Status: ${response.status}`);
    }

    /**
     * Get a specific application by sys_id.
     * Uses Table API GET on sys_app with sys_id filter.
     *
     * @param sysId The sys_id of the application to retrieve
     * @returns The ApplicationRecord or null if not found
     * @throws Error if sysId is empty or the API call fails
     */
    public async getApplication(sysId: string): Promise<ApplicationRecord | null> {
        if (!sysId || sysId.trim().length === 0) {
            throw new Error('Application sys_id is required');
        }

        this._logger.info(`Getting application: ${sysId}`);

        const query: Record<string, string | number> = {
            sysparm_query: `sys_id=${sysId}`,
            sysparm_limit: 1
        };

        const response: IHttpResponse<ApplicationResponse> = await this._tableAPI.get<ApplicationResponse>(
            ScopeManager.SYS_APP_TABLE,
            query
        );

        if (response.status === 200 && response.bodyObject?.result) {
            if (response.bodyObject.result.length > 0) {
                this._logger.info(`Found application: ${response.bodyObject.result[0].name}`);
                return response.bodyObject.result[0];
            }
            return null;
        }

        throw new Error(`Failed to get application '${sysId}'. Status: ${response.status}`);
    }
}

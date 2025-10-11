import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { HTTPRequest } from "../../comm/http/HTTPRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";

/**
 * CompanyApplications class for retrieving company application information
 * Provides methods to get applications shared internally within the company
 */
export class CompanyApplications {
    private readonly COMPANY_APPS_API_URL = "/sn_appclient_api_v1.do";
    
    private _logger: Logger = new Logger("CompanyApplications");
    private _req: ServiceNowRequest;
    private _instance: ServiceNowInstance;

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
    }

    /**
     * Gets the list of company applications shared internally
     * @param sharedInternally Filter for internally shared applications (default: true)
     * @param isFirstLoad Indicates if this is the first load (default: true)
     * @returns Promise<CompanyApplicationsResponse> Response containing list of applications
     */
    public async getCompanyApplications(
        sharedInternally: boolean = true,
        isFirstLoad: boolean = true
    ): Promise<CompanyApplicationsResponse> {
        const queryParams: Record<string, string | boolean> = {
            app_request_type: 'list_apps_versions',
            shared_internally: sharedInternally,
            isFirstLoad: isFirstLoad,
            uniq_param: Date.now().toString()
        };

        const httpRequest: HTTPRequest = {
            method: 'GET',
            path: this.COMPANY_APPS_API_URL,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            query: queryParams,
            body: null
        };

        this._logger.info(`Fetching company applications (shared_internally: ${sharedInternally})`);
        
        const resp: IHttpResponse<CompanyApplicationsResponse> = await this._req.get<CompanyApplicationsResponse>(httpRequest);
        
        if (resp.status === 200 && resp.bodyObject) {
            this._logger.info(`Successfully retrieved ${resp.bodyObject.data?.length || 0} company applications`);
            return resp.bodyObject;
        }

        throw new Error(`Failed to get company applications. Status: ${resp.status}, Response: ${JSON.stringify(resp.bodyObject)}`);
    }

    /**
     * Gets a specific company application by scope
     * @param scope The application scope to search for
     * @param sharedInternally Filter for internally shared applications (default: true)
     * @returns Promise<CompanyApplication | null> The application if found, null otherwise
     */
    public async getCompanyApplicationByScope(
        scope: string,
        sharedInternally: boolean = true
    ): Promise<CompanyApplication | null> {
        const response = await this.getCompanyApplications(sharedInternally);
        
        const application = response.data?.find(app => app.scope === scope);
        
        if (application) {
            this._logger.info(`Found application: ${application.name} (${scope})`);
            return application;
        }
        
        this._logger.warn(`Application with scope '${scope}' not found`);
        return null;
    }

    /**
     * Gets a specific company application by sys_id
     * @param sysId The application sys_id to search for
     * @param sharedInternally Filter for internally shared applications (default: true)
     * @returns Promise<CompanyApplication | null> The application if found, null otherwise
     */
    public async getCompanyApplicationBySysId(
        sysId: string,
        sharedInternally: boolean = true
    ): Promise<CompanyApplication | null> {
        const response = await this.getCompanyApplications(sharedInternally);
        
        const application = response.data?.find(app => app.sys_id === sysId);
        
        if (application) {
            this._logger.info(`Found application: ${application.name} (${sysId})`);
            return application;
        }
        
        this._logger.warn(`Application with sys_id '${sysId}' not found`);
        return null;
    }

    /**
     * Gets only installed company applications
     * @param sharedInternally Filter for internally shared applications (default: true)
     * @returns Promise<CompanyApplication[]> Array of installed applications
     */
    public async getInstalledCompanyApplications(
        sharedInternally: boolean = true
    ): Promise<CompanyApplication[]> {
        const response = await this.getCompanyApplications(sharedInternally);
        
        const installedApps = response.data?.filter(app => app.isInstalled) || [];
        
        this._logger.info(`Found ${installedApps.length} installed company applications`);
        return installedApps;
    }
}

/**
 * Response from company applications API
 */
export interface CompanyApplicationsResponse {
    /** Application server URL */
    appServer: string;
    
    /** Array of company applications */
    data: CompanyApplication[];
    
    /** Data processing time in milliseconds */
    dataProcessingTime: number;
    
    /** Repository response time in milliseconds */
    reporesponsetime: number;
    
    /** Store URL */
    storeURL: string;
    
    /** Store tracker ID */
    storetrackerId: string;
}

/**
 * Represents a company application
 */
export interface CompanyApplication {
    /** Whether the application is active */
    active: boolean;
    
    /** Application schedule details */
    app_schedule_details: Record<string, unknown>;
    
    /** Assigned version */
    assigned_version: string;
    
    /** Whether installation is blocked */
    block_install: boolean;
    
    /** Block message if installation is blocked */
    block_message: string;
    
    /** Whether the app can be edited in Studio */
    can_edit_in_studio: boolean;
    
    /** Whether the app can be installed or upgraded */
    can_install_or_upgrade: boolean;
    
    /** Whether customization can be installed or upgraded */
    can_install_or_upgrade_customization: boolean;
    
    /** Whether the app can be opened in Studio */
    can_open_in_studio: boolean;
    
    /** Compatibility information */
    compatibilities: string;
    
    /** Whether the app contains plugins */
    contains_plugins: boolean;
    
    /** Custom table count */
    custom_table_count: string;
    
    /** Customized version information */
    customized_version_info: Record<string, unknown>;
    
    /** Demo data status */
    demo_data: string;
    
    /** Application dependencies */
    dependencies: string | null;
    
    /** Display message */
    display_message: string | null;
    
    /** Whether the app has a manifest */
    has_manifest: boolean;
    
    /** Indicators array */
    indicators: unknown[];
    
    /** Installation date */
    install_date: string;
    
    /** Whether installed as a dependency */
    installed_as_dependency: boolean;
    
    /** Whether this is an App Store plugin */
    isAppstorePlugin: boolean;
    
    /** Whether the application is installed */
    isInstalled: boolean;
    
    /** Whether this is a customized app */
    is_customized_app: boolean;
    
    /** Whether this is a store app */
    is_store_app: boolean;
    
    /** Latest version available */
    latest_version: string;
    
    /** Latest version display name */
    latest_version_display: string;
    
    /** Link to the application */
    link: string;
    
    /** Line of business array */
    lob: unknown[];
    
    /** Logo URL */
    logo: string;
    
    /** Application name */
    name: string;
    
    /** Whether App Engine licensing is needed */
    needs_app_engine_licensing: boolean;
    
    /** Whether optional apps are available */
    optional_apps_available: boolean;
    
    /** Price type */
    price_type: string;
    
    /** Products array */
    products: unknown[];
    
    /** Publish date display */
    publish_date_display: string;
    
    /** Application scope */
    scope: string;
    
    /** Whether shared internally */
    shared_internally: string;
    
    /** Short description */
    short_description: string;
    
    /** Source information */
    source: string;
    
    /** Store link URL */
    store_link: string;
    
    /** System code */
    sys_code: string | null;
    
    /** System created on timestamp */
    sys_created_on: string;
    
    /** System created on display */
    sys_created_on_display: string;
    
    /** System ID */
    sys_id: string;
    
    /** System updated on timestamp */
    sys_updated_on: string;
    
    /** System updated on display */
    sys_updated_on_display: string;
    
    /** Whether uninstall is blocked */
    uninstall_blocked: boolean;
    
    /** Update date */
    update_date: string;
    
    /** Upload information */
    upload_info: string;
    
    /** Vendor name */
    vendor: string;
    
    /** Vendor prefix */
    vendor_prefix: string;
    
    /** Current version (if installed) */
    version: string;
    
    /** Array of available versions */
    versions: CompanyApplicationVersion[];
}

/**
 * Represents a version of a company application
 */
export interface CompanyApplicationVersion {
    /** Auto-update flag */
    auto_update: string;
    
    /** Whether installation is blocked for this version */
    block_install: boolean;
    
    /** Block message if installation is blocked */
    block_message: string | null;
    
    /** Compatibility information */
    compatibilities: string;
    
    /** Whether this version contains plugins */
    contains_plugins: boolean;
    
    /** Custom table count */
    custom_table_count: string;
    
    /** Whether this version has demo data */
    demo_data: boolean;
    
    /** Dependencies for this version */
    dependencies: string | null;
    
    /** Display message */
    display_message: string;
    
    /** Whether this version has a manifest */
    has_manifest: boolean;
    
    /** Indicators array */
    indicators: unknown[];
    
    /** Line of business array */
    lob: unknown[];
    
    /** Application name */
    name: string;
    
    /** Whether App Engine licensing is needed */
    needs_app_engine_licensing: boolean;
    
    /** Version number in repository */
    number: string;
    
    /** Price type */
    price_type: string;
    
    /** Publish date timestamp */
    publish_date: string;
    
    /** Publish date display */
    publish_date_display: string;
    
    /** Remote application sys_id */
    remote_application: string;
    
    /** Application scope */
    scope: string;
    
    /** Short description */
    short_description: string | null;
    
    /** Sortable version number */
    sortable_version: number;
    
    /** Source application ID */
    source_app_id: string;
    
    /** Store link URL */
    store_link: string;
    
    /** System ID of this version */
    sys_id: string;
    
    /** Title of this version */
    title: string;
    
    /** Upload information */
    upload_info: string;
    
    /** Vendor name */
    vendor: string;
    
    /** Vendor key */
    vendor_key: string;
    
    /** Version number */
    version: string;
    
    /** Version display name */
    version_display: string;
}


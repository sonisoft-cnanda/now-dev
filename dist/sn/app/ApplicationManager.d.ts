export declare class ApplicationManager {
    constructor();
    installApplications(): void;
    buildInstalledAppsBody(appsArr: string[], loadDemoData?: boolean): string;
}
export type AppInstallMessage = {
    name: string;
    packages: AppInstallPackage[];
};
export type AppInstallPackage = {
    id: string;
    type: string;
    load_demo_data: boolean;
    requested_version: boolean;
    notes: string;
};
export type AppMetadata = {
    sys_id: string;
    short_description: string;
    latest_version: boolean;
    scope: string;
};

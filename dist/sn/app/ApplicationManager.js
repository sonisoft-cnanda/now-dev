/* eslint-disable @typescript-eslint/no-explicit-any */
//import { SN_REST_CICD_APPMANAGER_ENDPOINT } from "../../constants/ServiceNow.js";
export class ApplicationManager {
    constructor() {
    }
    installApplications() {
        /*
        - Take the list of apps to install
        - get list of apps from endpoint
        - check if installed?
        
        */
    }
    buildInstalledAppsBody(appsArr, loadDemoData = false) {
        console.log(appsArr);
        //const endpoint : string = SN_REST_CICD_APPMANAGER_ENDPOINT;
        const appData = [];
        const apps = [];
        console.log(appData);
        const returnObj = {
            "name": "Tanium PDI Setup",
            "packages": []
        };
        returnObj.packages = apps
            .filter((item) => appsArr.includes(item.scope))
            .map((app) => ({
            "id": app.sys_id,
            "type": "application",
            "load_demo_data": loadDemoData,
            "requested_version": app.latest_version,
            "notes": app.short_description
        }));
        return JSON.stringify(returnObj);
    }
}
//# sourceMappingURL=ApplicationManager.js.map
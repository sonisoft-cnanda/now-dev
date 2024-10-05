/* eslint-disable @typescript-eslint/no-explicit-any */
//import { SN_REST_CICD_APPMANAGER_ENDPOINT } from "../../constants/ServiceNow";


export class ApplicationManager{


    public constructor(){

    }

    public installApplications(){
        /*
        - Take the list of apps to install
        - get list of apps from endpoint
        - check if installed?
        
        */
    }



    buildInstalledAppsBody(appsArr: string[],loadDemoData=false) {
        console.log(appsArr);
          //const endpoint : string = SN_REST_CICD_APPMANAGER_ENDPOINT;
          const appData = [];
          const apps:any[] = [];
            console.log(appData);
          const returnObj:AppInstallMessage = {
              "name": "Tanium PDI Setup",
              "packages" : []
          }
          returnObj.packages = apps
                                  .filter((item: AppMetadata) => appsArr.includes(item.scope))
                                  .map((app: AppMetadata) : AppInstallPackage => ({
                                      "id": app.sys_id, 
                                      "type": "application",
                                      "load_demo_data":loadDemoData,
                                      "requested_version": app.latest_version,
                                      "notes": app.short_description
                                  } as AppInstallPackage));
          return JSON.stringify(returnObj);
      
      
      }
}

export type AppInstallMessage = {
    name:string;
    packages:AppInstallPackage[];
}

export type AppInstallPackage = {
    id: string; 
    type: string;
    load_demo_data:boolean;
    requested_version: boolean;
    notes: string;
}

export type AppMetadata = {
    sys_id:string;
    short_description:string;
    latest_version:boolean;
    scope:string;
}
import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { HTTPRequest } from "../../comm/http/HTTPRequest";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import * as fs from 'fs';
import { ProgressStatus, ProgressWorker } from "../ProgressWorker";
import { ApplicationDetailModel, ApplicationDetailModelResponse } from "./ApplicationDetailModel";
import { BatchInstallation } from "./BatchInstallation";
import { BatchDefinition } from "./BatchDefinition";

export class ApplicationManager {
    BATCH_API_URL = "/api/sn_cicd/app/batch/install";
    APP_DETAILS_API_URL = "/api/sn_appclient/appmanager/app/{appID}";
    APP_UPDATES_LIST_API_URL = "/api/sn_appclient/appmanager/apps?search_key={searchKey}&sysparm_limit={limit}&tab_context=updates";

    BATCH_INSTALL_TIMEOUT = 1000 * 60 * 30 ;
    _logger:Logger = new Logger("ApplicationManager");

    _req:ServiceNowRequest;



    public constructor(instance:ServiceNowInstance){
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
    }

    private _instance:ServiceNowInstance;

   public async installBatch(batchDefinitionPath:string) : Promise<boolean> {

    let batchDefinitionRequest = fs.readFileSync(batchDefinitionPath, 'utf8');
    console.log(batchDefinitionRequest);
    const batchInstall = JSON.parse(batchDefinitionRequest) as BatchInstallation;

    //let installablePackages = await this.getInstallableApplicationPackages(batchInstall);
   // console.log(installablePackages);
    //batchInstall.packages = installablePackages;
    let batchDefinitionJson = JSON.stringify(batchInstall);
    console.log(batchDefinitionJson);
    let result = await this.executeBatchInstallRequest(batchInstall);
    console.log(result);
    console.log(result.result.links);

    if(result.result.links.progress){
        await this.waitForBatchInstallCompletion(result.result);
    }


    return true;
   }

   private async getInstallableApplicationPackages(batchInstall:BatchInstallation):Promise<BatchDefinition[]>{
    batchInstall.packages.forEach(async (appPackage) => {
        let appDetails = await this.getApplicationDetails(appPackage.id);
        console.log(appDetails);
        if(appDetails.version == appPackage.requested_version){
            batchInstall.packages.splice(batchInstall.packages.indexOf(appPackage), 1);
        }
    });
    return batchInstall.packages;
   }



   public async getApplicationDetails(appID:string):Promise<ApplicationDetailModel>{
    let request:HTTPRequest = { method: 'GET', path: this.APP_DETAILS_API_URL.replace("{appID}", appID), headers: null, query: null, body:null};
    let resp:IHttpResponse<ApplicationDetailModelResponse> = await this._req.get<ApplicationDetailModelResponse>(request);
    if(resp.status == 200){
        return resp.bodyObject.result.app_info_on_instance;
    }
    return null;
   }

   private async waitForBatchInstallCompletion(batchInstallResult:BatchInstallResult){
    let startTime = Date.now();
    let progressResult = await this.getBatchProgress(batchInstallResult);
    console.log(progressResult);
    
    while(progressResult.percent_complete < 100 && (Date.now() - startTime) < this.BATCH_INSTALL_TIMEOUT){
        await new Promise(resolve => setTimeout(resolve, 5000));
        progressResult = await this.getBatchProgress(batchInstallResult);
        console.log(progressResult);
    }

    if(progressResult.percent_complete < 100){
        throw new Error("Batch install timed out");
    }

    if(progressResult.error){
        throw new Error(progressResult.error);
    }

    if(progressResult.status == ProgressStatus.FAILED){
        throw new Error(progressResult.status_label + " : " + progressResult.status_message);
    }

    return true;
   }


   private async executeBatchInstallRequest(batchDefinitionRequest:object) {
    
    let request:HTTPRequest = { method: 'POST', path: this.BATCH_API_URL, headers: { 'Content-Type': 'application/json' }, query: null, json:batchDefinitionRequest, body:null};
    let resp:IHttpResponse<BatchInstallResultResponse> = await this._req.post<BatchInstallResultResponse>(request);
    if(resp.status == 200){
        return resp.bodyObject;
    }
    return null;
   }

   private async getBatchProgress(batchInstallResult:BatchInstallResult){
    let progressWorker = new ProgressWorker(this._instance);
    let progressResult = await progressWorker.getProgress(batchInstallResult.links.progress.id);
    return progressResult;
   }
}

export class BatchInstallResultResponse{
    result:BatchInstallResult;
}

export class BatchInstallResult{
    links:any;
}
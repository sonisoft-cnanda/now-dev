import { HTTPRequest, HttpResponse } from "../comm/http/HTTPRequestHandler";
import { ServiceNowProcessorRequest } from "../comm/http/ServiceNowProcessorRequest";
import { ServiceNowRequest } from "../comm/http/ServiceNowRequest";
import * as qs from 'qs';
import { ReferenceLink, ServiceNowTableResponse } from "../model/types";

export class ATFTestExecutor{

    _req:ServiceNowRequest = new ServiceNowRequest();

    async executeTest(testId:string):Promise<TestResult>{

        let dataObj = {
           
            'sysparm_want_session_messages':'true',
            'sysparm_ajax_processor_ut_test_id':testId,
            'sysparm_ajax_processor_test_runner_session_id':'',
            'sysparm_ajax_processor_is_pausing_enabled':'',
            'sysparm_ajax_processor_pause_before_rollback':'',
            'sysparm_ajax_processor_use_cloud_runner':'',
            'sysparm_ajax_processor_performance_run':'',
            'ni.nolog.x_referer':'ignore',
            'x_referer':'sys_atf_test.do%3Fsys_id%3D817a3214835b4210a9f8aec0deaad3f4%26sysparm_view%3D%26sysparm_domain%3Dnull%26sysparm_domain_scope%3Dnull'
        };

        let proc:ServiceNowProcessorRequest = new ServiceNowProcessorRequest();
        let result:string =  await proc.execute("TestExecutorAjax", "start", "global", dataObj);

        //In this case, result is the progress worker id.
        if(result != null){
          let resultId:string =  await this.waitForTestCompletion(result);
          if(resultId){
            let testResult:TestResult = await this.getTestResult(resultId);
            if(testResult)
                return testResult;
          }
          
        }

        return null;
    }

    private async waitForTestCompletion(progressId:string):Promise<string>{
        let pr:ProgressResult = await this.doGetTestProgress(progressId);
        //console.log("Percent Complete: " + pr.percent_complete);
      
        while(pr.percent_complete != null && pr.percent_complete < 100){
            await new Promise(resolve => setTimeout(resolve, 500));
            pr = await this.doGetTestProgress(progressId);
            //console.log("Percent Complete: " + pr.percent_complete);
        }
        
        if(pr && pr.percent_complete == 100 && pr.links.results && pr.links.results.id){
            return pr.links.results.id;
        }

        return null;
    }

   private async  doGetTestProgress(progressId:string):Promise<ProgressResult>{
        let data:ProgressResultResponse = await this.getTestProgress(progressId);
      
        try{
            if(data.result ){
               
                return data.result;
            }
                
        }catch(err){
            return null;
        }
      
        return null;
    }



    private async getTestProgress(progressId:string):Promise<ProgressResultResponse>{
       
 
        let request:HTTPRequest = { path: "/api/sn_cicd/progress/"+progressId, headers: null, query: null, body:null};
        let resp:HttpResponse<ProgressResultResponse> = await this._req.get<ProgressResultResponse>(request);
        if(resp.status == 200){
            return resp.bodyObject;
        }

        return null;
    }

    private async getTestResult(testResultId:string):Promise<TestResult>{
       
 
        let request:HTTPRequest = { path: "/api/now/table/sys_atf_test_result?sysparm_query=sys_id="+testResultId, headers: null, query: null, body:null};
        let resp:HttpResponse<ServiceNowTableResponse<TestResult>> = await this._req.get<ServiceNowTableResponse<TestResult>>(request);
        if(resp.status == 200){
            let tableResp:ServiceNowTableResponse<TestResult> =  resp.bodyObject;
            if(tableResp.result && tableResp.result.length > 0){
                return tableResp.result[0];
            }
            
        }

        return null;
    }

    // private async getTestStepResults(){

    // }

}

export type TestResult = {
    "end_time_millis":string;
    "execution_tracker":ReferenceLink;
    "test_name":string;
    "test":ReferenceLink;
    "rollback_context":ReferenceLink;
    "root_tracker_id":ReferenceLink;
    "output":string;
    "sys_id":string;
    "run_time":string;
    "status":string;

}



export type ProgressResultResponse = {
    "result":ProgressResult;
}

export type ProgressLinks = {
    "progress": ProgressLink;
    "results":ProgressLink;
}

export type ProgressLink = {
    "id":string ;
    "url":string;
}

export type ProgressResult = {
        "links": ProgressLinks ;
        "status":string;
        "status_label": string;
        "status_message": string;
        "status_detail":string;
        "error":string;
        "percent_complete": number;
      
}

import { ServiceNowProcessorRequest } from "../../comm/http/ServiceNowProcessorRequest";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";

import { ReferenceLink, ServiceNowTableResponse } from "../../model/types";
import { HTTPRequest } from "../../comm/http/HTTPRequest";
import { HttpResponse } from "../../comm/http/HttpResponse";
import { Logger } from "../../util/Logger";
import { IServiceNowInstance } from "./../IServiceNowInstance";
import { log } from 'console';
export class ATFTestExecutor{

    _req:ServiceNowRequest;

    private _snInstance:IServiceNowInstance;

    _logger:Logger = new Logger("ATFTestExecutor");

    public constructor(instance:IServiceNowInstance){
        this._snInstance = instance;
        this._req  = new ServiceNowRequest(this._snInstance);
    }

    async executeTest(testId:string):Promise<TestResult>{

        const dataObj = {
           
            'sysparm_want_session_messages':true,
            'sysparm_ajax_processor_ut_test_id':testId,
            'sysparm_ajax_processor_test_runner_session_id':'',
            'sysparm_ajax_processor_is_pausing_enabled':'',
            'sysparm_ajax_processor_pause_before_rollback':'',
            'sysparm_ajax_processor_use_cloud_runner':'',
            'sysparm_ajax_processor_performance_run':'',
            'ni.nolog.x_referer':'ignore',
            //'x_referer':'sys_atf_test.do?sys_id=dea365cd93309a100aec3a718bba1020&sysparm_view=&sysparm_domain=null&sysparm_domain_scope=null&sysparm_record_row=1&sysparm_record_rows=246&sysparm_record_list=ORDERBYDESCsys_updated_on'
        };

        const proc:ServiceNowProcessorRequest = new ServiceNowProcessorRequest( this._snInstance);
        const result:string =  await proc.execute("TestExecutorAjax", "start", "global", dataObj);
        log(result);
        //In this case, result is the progress worker id.
        if(result != null){
          const resultId:string =  await this.waitForTestCompletion(result);
          if(resultId){
            const testResult:TestResult = await this.getTestResult(resultId);
            if(testResult)
                return testResult;
          }
          
        }

        return null;
    }

    private async waitForTestCompletion(progressId:string):Promise<string>{
        let pr:ProgressResult = await this.doGetTestProgress(progressId);
        log("Percent Complete: " + pr.percent_complete);
       
        while(pr.percent_complete != null && pr.percent_complete < 100){
            await new Promise(resolve => setTimeout(resolve, 500));
            pr = await this.doGetTestProgress(progressId);
            this._logger.debug("Percent Complete: " + pr.percent_complete, pr);
            await this.sleep(100);
        }
        // TODO: Change this so if we are at 100% use the AJAXProgressStatusChecker processor to pull results.
        //Not sure if this is a change or a difference of how results are returned for parameterized tests. Need to check
        /* AJAXProgressStatusChecker Request
        sysparm_processor: AJAXProgressStatusChecker
sysparm_scope: global
sysparm_want_session_messages: true
sysparm_name: getStatus
sysparm_execution_id: 2022ebf393301a500aec3a718bba1094
ni.nolog.x_referer: ignore
x_referer: sys_atf_test.do?sys_id=dea365cd93309a100aec3a718bba1020&sysparm_view=&sysparm_domain=null&sysparm_domain_scope=null&sysparm_record_row=1&sysparm_record_rows=246&sysparm_record_list=ORDERBYDESCsys_updated_on
*/

/* Result:
<?xml version="1.0" encoding="UTF-8"?><xml answer="{&quot;children&quot;:[{&quot;children&quot;:[{&quot;children&quot;:[],&quot;detail_message&quot;:&quot;All steps passed&quot;,&quot;duration&quot;:&quot;38 Seconds&quot;,&quot;message&quot;:&quot;All steps passed&quot;,&quot;name&quot;:&quot;Executing Server - Independent steps with order 1 - 1&quot;,&quot;percent_complete&quot;:&quot;100&quot;,&quot;result&quot;:null,&quot;results&quot;:[],&quot;state&quot;:&quot;2&quot;,&quot;sys_id&quot;:&quot;f422eff393301a500aec3a718bba1085&quot;,&quot;updated_on&quot;:&quot;2024-09-29 15:31:47&quot;},{&quot;children&quot;:[],&quot;detail_message&quot;:&quot;Rolling back test data&quot;,&quot;duration&quot;:&quot;0 Seconds&quot;,&quot;message&quot;:&quot;Rollback completed successfully&quot;,&quot;name&quot;:&quot;Rollback&quot;,&quot;percent_complete&quot;:&quot;100&quot;,&quot;result&quot;:null,&quot;results&quot;:[],&quot;state&quot;:&quot;2&quot;,&quot;sys_id&quot;:&quot;7822eff393301a500aec3a718bba1085&quot;,&quot;updated_on&quot;:&quot;2024-09-29 15:31:47&quot;}],&quot;detail_message&quot;:&quot;Test passed&quot;,&quot;duration&quot;:&quot;38 Seconds&quot;,&quot;message&quot;:&quot;Test passed&quot;,&quot;name&quot;:&quot;Parameterized Test 'TaniumPatchUtil_IT' with order 1 started by Chris Nanda on 09/29/24 08:31:09.346&quot;,&quot;percent_complete&quot;:&quot;100&quot;,&quot;result&quot;:{&quot;result_id&quot;:&quot;3022eff393301a500aec3a718bba1083&quot;,&quot;useCloudRunner&quot;:false},&quot;results&quot;:[],&quot;state&quot;:&quot;2&quot;,&quot;sys_id&quot;:&quot;bc22eff393301a500aec3a718bba1081&quot;,&quot;updated_on&quot;:&quot;2024-09-29 15:31:47&quot;}],&quot;detail_message&quot;:&quot;Test passed&quot;,&quot;duration&quot;:&quot;38 Seconds&quot;,&quot;message&quot;:&quot;Test passed&quot;,&quot;name&quot;:&quot;Test 'TaniumPatchUtil_IT' started by Chris Nanda on 09/29/24 08:31:09.057&quot;,&quot;percent_complete&quot;:&quot;100&quot;,&quot;result&quot;:{&quot;parameter_result&quot;:&quot;b422aff393301a500aec3a718bba10ec&quot;,&quot;parameter_set_to_tracker_id_map&quot;:{&quot;160950b79330d6500aec3a718bba10bd&quot;:&quot;bc22eff393301a500aec3a718bba1081&quot;},&quot;result_ids&quot;:[&quot;3022eff393301a500aec3a718bba1083&quot;]},&quot;results&quot;:[],&quot;state&quot;:&quot;2&quot;,&quot;sys_id&quot;:&quot;2022ebf393301a500aec3a718bba1094&quot;,&quot;updated_on&quot;:&quot;2024-09-29 15:31:47&quot;}" sysparm_max="15" sysparm_name="getStatus" sysparm_processor="AJAXProgressStatusChecker"/>
{"children":[{"children":[{"children":[],"detail_message":"All steps passed","duration":"38 Seconds","message":"All steps passed","name":"Executing Server - Independent steps with order 1 - 1","percent_complete":"100","result":null,"results":[],"state":"2","sys_id":"f422eff393301a500aec3a718bba1085","updated_on":"2024-09-29 15:31:47"},{"children":[],"detail_message":"Rolling back test data","duration":"0 Seconds","message":"Rollback completed successfully","name":"Rollback","percent_complete":"100","result":null,"results":[],"state":"2","sys_id":"7822eff393301a500aec3a718bba1085","updated_on":"2024-09-29 15:31:47"}],"detail_message":"Test passed","duration":"38 Seconds","message":"Test passed","name":"Parameterized Test 'TaniumPatchUtil_IT' with order 1 started by Chris Nanda on 09/29/24 08:31:09.346","percent_complete":"100","result":{"result_id":"3022eff393301a500aec3a718bba1083","useCloudRunner":false},"results":[],"state":"2","sys_id":"bc22eff393301a500aec3a718bba1081","updated_on":"2024-09-29 15:31:47"}],"detail_message":"Test passed","duration":"38 Seconds","message":"Test passed","name":"Test 'TaniumPatchUtil_IT' started by Chris Nanda on 09/29/24 08:31:09.057","percent_complete":"100","result":{"parameter_result":"b422aff393301a500aec3a718bba10ec","parameter_set_to_tracker_id_map":{"160950b79330d6500aec3a718bba10bd":"bc22eff393301a500aec3a718bba1081"},"result_ids":["3022eff393301a500aec3a718bba1083"]},"results":[],"state":"2","sys_id":"2022ebf393301a500aec3a718bba1094","updated_on":"2024-09-29 15:31:47"}
*/
        if(pr && pr.percent_complete == 100 && pr.links.results && pr.links.results.id){
            this._logger.debug("100% Complete. Returning result ID.", pr);
            return pr.links.results.id;
        }
        
        return null;
    }

   private async  doGetTestProgress(progressId:string):Promise<ProgressResult>{
        const data:ProgressResultResponse = await this.getTestProgress(progressId);
      
        try{
            if(data.result ){
               
                return data.result;
            }
                
        }catch(err){
            this._logger.error("Error occurred while getting progress", err);
            return null;
        }
      
        return null;
    }



    private async getTestProgress(progressId:string):Promise<ProgressResultResponse>{
       
 
        const request:HTTPRequest = { path: "/api/sn_cicd/progress/"+progressId, headers: null, query: null, body:null};
        const resp:HttpResponse<ProgressResultResponse> = await this._req.get<ProgressResultResponse>(request);
        if(resp.status == 200){
            return resp.bodyObject;
        }

        return null;
    }

    private async getTestResult(testResultId:string):Promise<TestResult>{
       
 
        const request:HTTPRequest = { path: "/api/now/table/sys_atf_test_result?sysparm_query=sys_id="+testResultId, headers: null, query: null, body:null};
        const resp:HttpResponse<ServiceNowTableResponse<TestResult>> = await this._req.get<ServiceNowTableResponse<TestResult>>(request);
        if(resp.status == 200){
            const tableResp:ServiceNowTableResponse<TestResult> =  resp.bodyObject;
            if(tableResp.result && tableResp.result.length > 0){
                return tableResp.result[0];
            }
            
        }

        return null;
    }

    // private async getTestStepResults(){

    // }

    private sleep(ms:number) : Promise<void> {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
      }

}

export interface TestResult {
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



export interface ProgressResultResponse {
    "result":ProgressResult;
}

export interface ProgressLinks {
    "progress": ProgressLink;
    "results":ProgressLink;
}

export interface ProgressLink {
    "id":string ;
    "url":string;
}

export interface ProgressResult {
        "links": ProgressLinks ;
        "status":string;
        "status_label": string;
        "status_message": string;
        "status_detail":string;
        "error":string;
        "percent_complete": number;
      
}
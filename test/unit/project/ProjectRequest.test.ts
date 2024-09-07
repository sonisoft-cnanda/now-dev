
import { IHttpResponse } from '../../../src/comm/http/IHttpResponse';
import { ProjectRequest, SysMetadata } from './../../../src/project/ProjectRequest';

describe('ProjectRequest', () => {
    


    beforeEach(async () => {
      
    });
     
    describe('getSysMetadataObjectsForApplication', () => {
        it('should return metadata', async () => {
            let pReq:ProjectRequest = new ProjectRequest();
            let resp: IHttpResponse<SysMetadata> =  await pReq.getSysMetadataObjectsForApplication("7717da92dbd41510495d70f339961943", ['sys_script_include', 'sys_script'], "sys_scope.scope");
       
            expect(resp).not.toBeNull();
            expect(resp.status).toBe(200);
            
        }, 100000);
    });


    describe('getUrlSearchParamsForMetadata', () => {
        it('should return URL Search params', async () => {
            let pReq:ProjectRequest = new ProjectRequest();
            let searchParams:URLSearchParams = pReq.getUrlSearchParamsForMetadata("test", ['sys_script_include', 'sys_script'], "sys_scope.scope");

            expect(searchParams.size).toBe(4);
            expect(searchParams.toString()).toBe("sysparm_fields=sys_id%2Csys_name%2Csys_class_name%2Csys_package%2Csys_package.name%2Csys_scope%2Csys_scope.name%2Csys_scope.scope&sysparm_transaction_scope=test&sysparm_query=sys_class_nameINsys_script_include%2Csys_script&sys_scope=test");
        });
    });

    afterEach(async () => {

    });
});

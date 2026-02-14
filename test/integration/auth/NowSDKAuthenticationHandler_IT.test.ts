import { UISession } from "@servicenow/sdk-cli-core";
import { NowSDKAuthenticationHandler } from "../../../src/auth/NowSDKAuthenticationHandler";
import { IAuthenticationHandler } from "../../../src/auth/IAuthenticationHandler";
import { ServiceNowInstance, ServiceNowSettingsInstance } from "../../../src/sn/ServiceNowInstance";
import { getCredentials } from "@servicenow/sdk-cli/dist/auth";
import { SN_INSTANCE_ALIAS } from '../../test_utils/test_config';



describe("NowSDKAuthenticationHandler", () => {

	let instance: ServiceNowInstance;
    let credential:any;

    beforeEach(async () => {

        credential = await getCredentials(SN_INSTANCE_ALIAS);

         if(credential){
            const snSettings:ServiceNowSettingsInstance = {
            alias: SN_INSTANCE_ALIAS,
            credential: credential
            }
            instance = new ServiceNowInstance(snSettings);
        }
         
       
        
    });

	

	it("login should return session", async () => {
		const auth:IAuthenticationHandler = new NowSDKAuthenticationHandler(instance);
        const session:IUserSession =  await auth.doLogin();

        expect(session).not.toBeNull();
        expect(session.getCookies()).not.toBeNull();
        expect((await session.getCookies().getCookies(ExtensionConfiguration.instance.getServiceNowInstanceURL())).length).toBeGreaterThan(0);

	}, 30000);

});

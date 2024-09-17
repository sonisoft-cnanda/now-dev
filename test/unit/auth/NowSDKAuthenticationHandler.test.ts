import { UISession } from "@servicenow/sdk-cli-core";
import { NowSDKAuthenticationHandler } from "../../../src/auth/NowSDKAuthenticationHandler";
import { IAuthenticationHandler } from "../../../src/auth/IAuthenticationHandler";
import { IUserSession } from "../../../src/comm/http/IUserSession";
import { ExtensionConfiguration } from "../../../src/conf/ExtensionConfiguration";



describe("NowSDKAuthenticationHandler", () => {
	
	beforeEach(() => {
		
	});

	

	it("login should return session", async () => {
		const auth:IAuthenticationHandler = new NowSDKAuthenticationHandler();
        const session:IUserSession =  await auth.doLogin(ExtensionConfiguration.instance.getServiceNowInstanceURL(), "chris.nanda", "D$adP00l$G$$k0ut");

        expect(session).not.toBeNull();
        expect(session.getCookies()).not.toBeNull();
        expect((await session.getCookies().getCookies(ExtensionConfiguration.instance.getServiceNowInstanceURL())).length).toBeGreaterThan(0);

	}, 30000);

});

//import { UISession } from "@servicenow/sdk-cli-core";
// import { NowSDKAuthenticationHandler } from "../../../src/auth/NowSDKAuthenticationHandler";
// import { IAuthenticationHandler } from "../../../src/auth/IAuthenticationHandler";
// import { IUserSession } from "../../../src/comm/http/IUserSession";
// import { ExtensionConfiguration } from "../../../src/conf/ExtensionConfiguration";
 import { getCredentials } from "@servicenow/sdk-cli/dist/auth";
//import { describe, it } from "node:test";
import { makeRequest } from "@servicenow/sdk-cli-core/dist/util/http";
import { getSafeSessionToken } from "@servicenow/sdk-cli-core/dist/util/sessionToken";
import { logger } from "@servicenow/sdk-cli/dist/logger";
import { SessionOrToken } from "@servicenow/sdk-cli-core/dist/auth";

// type SessionAuthArguments = OneOf<{
//     credentials: Creds
//     session: SessionOrToken
// }>

// type UserSessionAuthArguments = OneOf<{
//     credentials: Creds
//     session: UserSession
// }>

describe("NowSDKAuthenticationHandler", () => {
	

	it("should authenticate using now-sdk", async () => {
		let args ={auth: "ven05195", _: ""};
		const cred = await getCredentials(args);
	    expect(cred).not.toBeNull();
		expect(cred.instanceUrl).not.toBeNull();
		expect(cred.instanceUrl).toBe("https://ven05195.service-now.com");
		
   });

   it("should get session using now-sdk", async () => {
		let args ={auth: "ven05195", _: ""};
		const cred = await getCredentials(args);
		//let sessionSafeArgs:SessionAuthArguments;
		let sessionArgs = {credentials: cred};
		let session = await getSafeSessionToken(sessionArgs, logger)

		expect(session).not.toBeNull();
		
	});

   it("should authenticate and be able to connect and download data from an instance", async () => {
		let args ={auth: "ven05195", _: ""};
		const cred = await getCredentials(args);

		let sessionArgs = {credentials: cred};
		let session:SessionOrToken = await getSafeSessionToken(sessionArgs, logger) as SessionOrToken;
		let url:string = "https://ven05195.service-now.com/api/now/table/sys_user?sysparm_limit=1";
		const r = await makeRequest({
			auth: session,
			path: url,
			method: 'GET',
		});
		expect(r.status).toBe(200);

		// const response = await makeRequest({
		// 	auth,
		// 	path: `/api/fluent/download/${scope}`,
		// 	method: 'GET',
		// 	...(mode === FetchMode.INCREMENTAL && {
		// 		params: {
		// 			sysparam_mode: FetchMode.INCREMENTAL,
		// 		},
		// 	}),
		// })
	

		// const response = await makeRequest({
			
		// });
		//expect(response.status).toBe(200);
		expect(cred).not.toBeNull();
		expect(cred.instanceUrl).not.toBeNull();
		expect(cred.instanceUrl).toBe("https://ven05195.service-now.com");
		
	});

	// beforeEach(() => {
		
	// });

	

	// xit("login should return session", async () => {
	// 	// let auth:IAuthenticationHandler = new NowSDKAuthenticationHandler();
    //     // let session:IUserSession =  await auth.doLogin(ExtensionConfiguration.instance.getServiceNowInstanceURL(), "chris.nanda", "D$adP00l$G$$k0ut");

    //     // expect(session).not.toBeNull();
    //     // expect(session.getCookies()).not.toBeNull();
    //     // expect((await session.getCookies().getCookies(ExtensionConfiguration.instance.getServiceNowInstanceURL())).length).toBeGreaterThan(0);

	// }, 30000);


});

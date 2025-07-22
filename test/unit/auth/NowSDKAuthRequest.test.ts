

import { getCredentials } from "@servicenow/sdk-cli/dist/auth";
import { getSafeUserSession } from "@servicenow/sdk-cli-core/dist/util/sessionToken";
import { makeRequest } from "@servicenow/sdk-cli-core/dist/http";


describe("NowSDKAuthRequest",  () => {
    it("should be able to get a credential", async () => {
        let args = {};
        args["_"] = ["get-credentials"];
        args["auth"] = "dev323211";
        const credentials = await getCredentials(args);
        expect(credentials).toBeDefined();
    });


    it("should be able to get a credential", async () => {
        let args = {};
        args["_"] = ["get-credentials"];
        args["auth"] = "sstdev";
        const credentials = await getCredentials(args);
        expect(credentials).toBeDefined();


        let auth = {credentials: credentials};
        let logger = {info: () => {}, warn: () => {}, error: () => {}, debug: () => {}, log: () => {}};
        let session = await getSafeUserSession(auth, logger);
        expect(session).toBeDefined();
    });

    it("should be able to make a request", async () => {
        let args = {};
        args["_"] = ["get-credentials"];
        args["auth"] = "sstdev";
        const credentials = await getCredentials(args);
        expect(credentials).toBeDefined();

        let auth = {credentials: credentials};
        let logger = {info: () => {}, warn: () => {}, error: () => {}, debug: () => {}, log: () => {}};
        let session = await getSafeUserSession(auth, logger);
        expect(session).toBeDefined();


        let opts = {
            auth: session,
            path: "xmlstats.do",
            rest: { method: "GET" }
        }
        
        let resp = await makeRequest(opts);
        expect(resp).toBeDefined();
        expect(resp.status).toBe(200);
        
    });
});
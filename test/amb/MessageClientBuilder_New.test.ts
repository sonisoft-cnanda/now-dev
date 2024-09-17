// import amb from "./amb.js"
// import { adapt } from "cometd-nodejs-client";
// import Logger from "../../../build/src/sn/amb/Logger"
// const LOGGER = new Logger('index');

import { AMBClient } from "../../src/amb/AMBClient";
import { MessageClientBuilder } from "../../src/amb/MessageClientBuilder"



describe('MessageClientBuilder', () => {
   
    describe('execute test', () => {
       

        xit('should return client', async () => {
            const builder:MessageClientBuilder = new MessageClientBuilder();
            const client:AMBClient = builder.createClient();
        })
    })
})
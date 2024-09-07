



import { AMBClient } from "../../../src/sn/amb/AMBClient.js";
import { adapt } from "../../../src/sn/amb/cometd-nodejs-client.js";
import { SubscriptionConfig } from "../../../src/sn/amb/MessageClient.js";

import { MessageClientBuilder } from "../../../src/sn/amb/MessageClientBuilder.js";
import { Logger } from "../../../src/sn/amb/Logger.js";
import { JSDOM } from 'jsdom'
const { window } = new JSDOM();


describe('AMBClient', () => {
   
    describe('execute test', () => {
       

        it('can run client', async () => {
            const logger = new Logger('AMBClient.test');
            let window:any = adapt();
            global.window = window;
          
            const mb:MessageClientBuilder = new MessageClientBuilder();

            const clientSubscriptions = mb.buildClientSubscriptions();
            let client:AMBClient =  new AMBClient (clientSubscriptions);

            client.connect();


            let subConfig:SubscriptionConfig = {};
            subConfig.subscriptionCallback = function(message:any){
                logger.debug("subscriptionCallback", message);
            }

            subConfig.subscribeOptionsCallback = function(){
                logger.debug("subscribeOptionsCallback");
            }



            let rwChannel = client.getRecordWatcherChannel("sys_metadata", "sys_scope=c4134c50db6ec910495d70f339961931", null, subConfig);
            console.log(rwChannel);

            // rwChannel.subscribe(function(message){
            //     LOGGER.debug("subscriptionCallback", message);
            // });
        })

        
    })
})




import { adapt } from "../../../src/sn/amb/cometd-nodejs-client";
import { SubscriptionConfig } from "../../../src/sn/amb/MessageClient";

import { MessageClientBuilder } from "../../../src/sn/amb/MessageClientBuilder";
import { Logger } from "../../../src/util/Logger";
import { JSDOM } from 'jsdom'
import { AMBClient } from "../../../src/sn/amb/AMBClient";
import { ServiceNowInstance, ServiceNowSettingsInstance } from "../../../src/sn/ServiceNowInstance";
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";

const { window } = new JSDOM();


describe('AMBClient', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;
    const INSTANCE_ALIAS = 'tanengdev012';
    const SECONDS = 1000;
   
    beforeEach(async () => {
        credential = await getCredentials(INSTANCE_ALIAS);
        
        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
        }
    });

    describe('execute test', () => {
       

        it('can run client', async () => {
            const logger = new Logger('AMBClient.test');
            
            // Initialize window FIRST (CometD needs it)
            const windowOptions: any = { cookies: null };
            const window:any = adapt(windowOptions);
            global.window = window;
            
            const mb:MessageClientBuilder = new MessageClientBuilder();
            const clientSubscriptions = mb.buildClientSubscriptions();
            
            // Pass ServiceNowInstance to AMBClient
            const client:AMBClient = new AMBClient(clientSubscriptions, instance);
            
            // Authenticate first to get session cookies
            console.log('\n🔐 Authenticating...');
            await client.authenticate();
            console.log('✅ Authentication complete\n');
            
            // Get the cookies that were set and update window options
            const serverConn: any = client.getServerConnection();
            const cookies = serverConn._sessionCookies;
            console.log('📋 Cookies obtained:', cookies ? `${cookies.substring(0, 80)}...` : 'none');
            
            // Update window options with cookies for WebSocket
            if (window._wsOptions && cookies) {
                window._wsOptions.cookies = cookies;
                console.log('✅ WebSocket configured with cookies\n');
            }

            // Now connect to AMB with authenticated WebSocket
            console.log('🔌 Connecting to AMB...');
            client.connect();

            // Wait for connection to establish
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('✅ AMB Connected\n');
            console.log('📡 Setting up Record Watcher...\n');

            //expect(client._serverConnection.connected).toBe(true);
            const subConfig:SubscriptionConfig = {};
            subConfig.subscriptionCallback = function(message:any){
                console.log('\n🎉 RECEIVED MESSAGE via subscriptionCallback!');
                console.log(JSON.stringify(message, null, 2));
                logger.debug("subscriptionCallback", message);
            }

            subConfig.subscribeOptionsCallback = function(){
                console.log('✅ Subscription options callback triggered');
                logger.debug("subscribeOptionsCallback");
            }



            const rwChannel = client.getRecordWatcherChannel("syslog", 'level=2', null, subConfig);
            console.log('📋 Record Watcher Channel Created:', rwChannel.getName());

            rwChannel.subscribe(function(message){
                console.log('\n🎉 RECEIVED MESSAGE via channel subscribe callback!');
                console.log(JSON.stringify(message, null, 2));
                logger.debug("Channel subscription callback", message);
            });

            console.log('\n👀 Waiting for messages (30 seconds)...');
            console.log('   Update incident 7eaeca2093ef39100c8a30118bba1067 in another browser to test\n');
            
            // Wait longer to allow time for manual testing
            await new Promise(resolve => setTimeout(resolve, 30000));

            console.log('\n⏹️  Test complete, disconnecting...');
            client.disconnect();

            //expect(client._serverConnection.connected).toBe(false);
        }, 60 * SECONDS)


        it('can run client to watch syslog', async () => {
            const logger = new Logger('AMBClient.test');
            
            // Initialize window FIRST (CometD needs it)
            const windowOptions: any = { cookies: null };
            const window:any = adapt(windowOptions);
            global.window = window;
            
            const mb:MessageClientBuilder = new MessageClientBuilder();
            const clientSubscriptions = mb.buildClientSubscriptions();
            
            // Pass ServiceNowInstance to AMBClient
            const client:AMBClient = new AMBClient(clientSubscriptions, instance);
            
            // Authenticate first to get session cookies
            console.log('\n🔐 Authenticating...');
            await client.authenticate();
            console.log('✅ Authentication complete\n');
            
            // Get the cookies that were set and update window options
            const serverConn: any = client.getServerConnection();
            const cookies = serverConn._sessionCookies;
            console.log('📋 Cookies obtained:', cookies ? `${cookies.substring(0, 80)}...` : 'none');
            
            // Update window options with cookies for WebSocket
            if (window._wsOptions && cookies) {
                window._wsOptions.cookies = cookies;
                console.log('✅ WebSocket configured with cookies\n');
            }

            // Now connect to AMB with authenticated WebSocket
            console.log('🔌 Connecting to AMB...');
            client.connect();

            // Wait for connection to establish
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('✅ AMB Connected\n');
            console.log('📡 Setting up Record Watcher...\n');

            //expect(client._serverConnection.connected).toBe(true);
            const subConfig:SubscriptionConfig = {};
            subConfig.subscriptionCallback = function(message:any){
                console.log('\n🎉 RECEIVED MESSAGE via subscriptionCallback!');
                console.log(JSON.stringify(message, null, 2));
                logger.debug("subscriptionCallback", message);
            }

            subConfig.subscribeOptionsCallback = function(){
                console.log('✅ Subscription options callback triggered');
                logger.debug("subscribeOptionsCallback");
            }



            const rwChannel = client.getRecordWatcherChannel("syslog", "", null, subConfig);
            console.log('📋 Record Watcher Channel Created:', rwChannel.getName());

            rwChannel.subscribe(function(message){
                console.log('\n🎉 RECEIVED MESSAGE via channel subscribe callback!');
                console.log(JSON.stringify(message, null, 2));
                logger.debug("Channel subscription callback", message);
            });

            console.log('\n👀 Waiting for messages (60 seconds)...');
            console.log('   Update incident 7eaeca2093ef39100c8a30118bba1067 in another browser to test\n');
            
            // Wait longer to allow time for manual testing
            await new Promise(resolve => setTimeout(resolve, 60000));

            console.log('\n⏹️  Test complete, disconnecting...');
            client.disconnect();

            //expect(client._serverConnection.connected).toBe(false);
        }, 120 * SECONDS)
        
    })
})
/* eslint-disable @typescript-eslint/ban-types */
import {MessageClient, SubscriptionConfig} from "./MessageClient.js";
import Base64 from "crypto-js/enc-base64.js";
import Utf8 from "crypto-js/enc-utf8.js";
import {Logger} from "../util/Logger.js";
import { ServerConnection } from "./ServerConnection.js";
import { ChannelListener } from "./ChannelListener.js";


export class AMBClient{

    _clientSubscriptions:any;
    _logger:Logger;
    _ambClient:MessageClient;
    _serverConnection:ServerConnection;
    initiatedConnection = false;

    constructor(clientSubscriptions:any){
        this._logger = new Logger("MessageClientBuilder");
		this._ambClient = new MessageClient();
		this._clientSubscriptions = clientSubscriptions;

		this._serverConnection = this._ambClient.getServerConnection();
        this._serverConnection.setLoginWindowEnabled(false);
		

    }

    getServerConnection() {
        return this._serverConnection;
    }

    connect() {
        this._ambClient.connect();
    }

    abort() {
        this._ambClient.abort();
    }

    disconnect() {
        this._ambClient.disconnect();
    }

    getConnectionState() {
        return this._ambClient.getConnectionState();
    }

    getState() {
        return this._ambClient.getConnectionState();
    }

    getClientId() {
        return this._ambClient.getClientId();
    }

    getChannel(channelName:string, subscriptionConfig:any) : ChannelListener  {
        //const client:AMBClient = this;
        this._logger.debug("buildClient.getChannel: channelName = " + channelName);
        const channel = this._ambClient.getChannel(channelName, subscriptionConfig);
        const originalSubscribe = channel.subscribe;
        const originalUnsubscribe = channel.unsubscribe;

        channel.subscribe = (listener: any) => {
            this._clientSubscriptions.add(channel, listener, function () {
                channel.unsubscribe(listener);
            });

            // windowContext.addEventListener('unload', function() {
            // 	ambClient.removeChannel(channelName);
            // });
            originalSubscribe.call(channel, listener);
            return channel;
        };

        channel.unsubscribe = (listener: any) => {
            this._clientSubscriptions.remove(channel, listener);
            const call = originalUnsubscribe.call(channel, listener);
            if (this._serverConnection.getChannel(channelName).getChannelListeners().length === 0) {
                this._ambClient.removeChannel(channelName);
            }
            return call;
        };

        return channel;
    }

    getChannel0(channelName:string, subscriptionCallback:Function) : ChannelListener {
        const config:SubscriptionConfig = {subscriptionCallback:subscriptionCallback};
        return this._ambClient.getChannel(channelName, config);
    }

    /**
     * Creates a channel with a properly encoded name required for Record Watcher. Returns a channel listener.
     *
     * @param {string} table
     * @param {string} query
     * @param {string} actionPrefix
     * @param {Object<*>} subscriptionConfig
     * @param {Object<*>} windowContext
     * @returns {*|amb.ChannelListener}
     */
    getRecordWatcherChannel(table:string, query:string, actionPrefix:string | null, subscriptionConfig:SubscriptionConfig) {
        // replace base64 padding character due to '=' is invalid channel name
        const base64EncodedQuery = Base64.stringify(Utf8.parse(query)).replace(/=/g, "-");
        actionPrefix = actionPrefix || "default";

        return this.getChannel("/rw/" + actionPrefix + "/" + table + "/" + base64EncodedQuery, subscriptionConfig);
    }

    registerExtension(/*String*/ extensionName:string, /*Object*/ extension:any) {
        this._ambClient.registerExtension(extensionName, extension);
    }

    unregisterExtension(extensionName:string) {
        this._ambClient.unregisterExtension(extensionName);
    }

    batch(block:Function) {
        this._ambClient.batch(block);
    }

    subscribeToEvent(event:string, callback:Function) {
       
        const id =  this._ambClient.subscribeToEvent(event, callback);
        this._clientSubscriptions.add(id, true, () => {
                this._ambClient.unsubscribeFromEvent(id);
            });
        return id;
    }

    unsubscribeFromEvent(id:number, windowContext:any) {
        this._clientSubscriptions.remove(id, true);
        this._ambClient.unsubscribeFromEvent(id);
    }

    isLoggedIn():boolean {
        return this._ambClient.isLoggedIn();
    }

    getConnectionEvents() {
        return this._ambClient.getConnectionEvents();
    }

    getEvents() {
        return this._ambClient.getConnectionEvents();
    }

    reestablishSession() {
        this._ambClient.reestablishSession();
    }

    loginComplete() {
        this._ambClient.loginComplete();
    }

    getChannels() {
        return this._ambClient.getChannels();
    }

    extendSession() {
        return this._ambClient.extendSession();
    }

    getTokenManagementExtension() {
        return this._ambClient.getTokenManagementExtension();
    }

    public onProcessEnd(...args: any[]){
        this.disconnect();
    }


}
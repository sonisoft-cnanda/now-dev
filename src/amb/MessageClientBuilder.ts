/* eslint-disable @typescript-eslint/ban-types */

//import {Logger} from "../util/Logger.js";

import { AMBClient } from "./AMBClient.js";

"use strict";

export type SubscriptionCollection = {
	add:Function;
	remove:Function;
}

export type Context = {
	onUnload:Function,
	unloading:boolean,
	subscriptions:any[]
}

export class MessageClientBuilder{


	// constructor(){

	// }

	public createClient() : AMBClient{
		const client:AMBClient = this.buildClient();
		// set it for reuse
		this._initClient(client);
	
		return client;
	}

	private _initClient(client:AMBClient){
		this.registerOnProcessEnd(client);
		
		//client.connect();

	}

	private registerOnProcessEnd(client:AMBClient){
		process.on("exit", client.onProcessEnd);
	}


	/**
	 * Shallow object clone
	 * @param {Object} dest
	 * @param {Object} source
	 * @return {Object}
	 */
	clone(dest:any, source:any) : any {
		for (const prop in source) {
			if (Object.prototype.hasOwnProperty.call(source, prop))
					dest[prop] = source[prop];
		}
		return dest;
	}

	private buildClient() : AMBClient {
		const clientSubscriptions = this.buildClientSubscriptions();
		return new AMBClient (clientSubscriptions);
	
	}


	public buildClientSubscriptions():SubscriptionCollection {

		

		const context:any = createContext();
	
		function addSubscription( id:any, callback:Function, unsubscribe:any) {
			if (!callback || !unsubscribe)
				return;
	
			removeSubscription(id, callback);
	
			const context = getContext();
			
	
			if (context.unloading)
				return;
	
			context.subscriptions.push({
				id: id,
				callback: callback,
				unsubscribe: unsubscribe
			});
		}
	
		function removeSubscription(id:any, callback:Function) {
			if (!callback)
				return;
	
			const context = getContext();
			if (!context)
				return;
	
			const subscriptions = context.subscriptions;
			for (let i = subscriptions.length - 1; i >= 0; i--) {
				if (subscriptions[i].id === id && subscriptions[i].callback === callback)
					subscriptions.splice(i, 1);
			}
		}
	
		function getContext() {
			
			return context;
		}
	
		function createContext() {
			const context = {
				onUnload: function() {
					context.unloading = true;
					const subscriptions = context.subscriptions;
					let subscription:any;
					while (subscription = subscriptions.pop()) {
						subscription.unsubscribe();
					}
					destroyContext(context);
				},
				unloading: false,
				subscriptions: []
			} as Context;
			
			return context;
		}
	
		function destroyContext(context:any) : void {
			
			context.subscriptions = [];
			context.onUnload = null;
			context.window = null;
		}
	
		return {
			add: addSubscription,
			remove: removeSubscription
		};
	}

	
}

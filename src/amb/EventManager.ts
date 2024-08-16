/* eslint-disable @typescript-eslint/ban-types */
import {Logger} from "../util/Logger.js";

export class EventManager {
     _logger:Logger = new Logger("EventManager");
     _subscriptions:any[] = [];
     _idCounter = 0;
     _events:any;

    public constructor(events:any){
        this._events = events;
    }

    public getEvents():any {
        return this._events;
    }

    public subscribe(event:string, callback:Function):number {
        this._logger.debug("Subscribed", {event: event, callback:callback});
        const id:number = this._idCounter++;
        this._subscriptions.push({ event: event, callback: callback,  id: id});
        return id;
    }

    public unsubscribe(id:number) : void{
        for (let i = 0; i < this._subscriptions.length; i++)
            if (id === this._subscriptions[i].id)
                this._subscriptions.splice(i, 1);
    }

    public publish(event:any, args?:any) : void {
        this._logger.debug("event published: " + event);
        const subscriptions = this._getSubscriptions(event);
        for (let i = 0; i < subscriptions.length; i++)
            subscriptions[i].callback.apply(null, args);
    }

   private  _getSubscriptions(event:string) {
        const subscriptions = [];
        for (let i = 0; i < this._subscriptions.length; i++) {
            if (this._subscriptions[i].event === event)
                subscriptions.push(this._subscriptions[i]);
        }
        return subscriptions;
    }
}
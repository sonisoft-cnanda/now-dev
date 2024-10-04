import { spawn } from "child_process";
import { SN_OAUTH_ENDPOINT } from '../../constants/ServiceNow';


export class OAuth{

    private _callbackPort:number;
    private _protocol:string = "http";
    private _callbackPath:string;

    private _snInstanceUrl: string;
    public get snInstanceUrl (): string {
        return this._snInstanceUrl;
    }
    public set snInstanceUrl ( value: string ) {
        this._snInstanceUrl = value;
    }
    private _clientId: string;
    public get clientId (): string {
        return this._clientId;
    }
    public set clientId ( value: string ) {
        this._clientId = value;
    }
    private _clientSecret: string;
    public get clientSecret (): string {
        return this._clientSecret;
    }
    public set clientSecret ( value: string ) {
        this._clientSecret = value;
    }

    public constructor(snInstanceUrl:string, clientId:string, clientSecret:string){
        this.snInstanceUrl = snInstanceUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    private constructAuthCodeFlowUrl():string{
        //https://dev256787.service-now.com/oauth_auth.do?response_type=code&redirect_uri=http://localhost:80/oauth_redirect.do&client_id=56d32e4783d04a319cbf5df37ef09429&state=123
       
    
    }

    public openBrowserForAuth():void{
      
        // open default browser
        spawn('open', ['http://localhost:9000']);
    }
}
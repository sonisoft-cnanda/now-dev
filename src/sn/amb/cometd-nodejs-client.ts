/* eslint-disable @typescript-eslint/ban-types */
/*
 * Copyright (c) 2017 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {XMLHttpRequest} from "./XMLHttpRequest.js";
import * as ws from "ws";
import { Logger } from "../../util/Logger";

export function adapt(options?:any) : any {
    const logger:Logger = new Logger("cometd");
    const p:any = global;
    let window:any = p["window"];
    if (!window) {
        window = {
            location: {
                pathname: "",
                protocol: "",
                host: ""
            },
            self: window
        };
            
    }
    window.cometdLogger = logger;
    //window.self = {};
    window.addEventListener =  function(name:string, callback:Function){
        window.cometdLogger.info("Event Fired: " + name, {name:name, callback:callback});
    };

    window.setTimeout = setTimeout;
    window.clearTimeout = clearTimeout;

    window.console = {};
    window.console.warn = function(...args:any[]){
        window.cometdLogger.addWarnMessage("COMETD", args);
    };
    window.console.debug = function(...args:any[]){
        window.cometdLogger.debug("COMETD", args);
    };
    window.console.info = function(...args:any[]){
        window.cometdLogger.addErrorMessage("COMETD", args);
    };
    window.console.error = function(...args:any[]){
        window.cometdLogger.addInfoMessage("COMETD", args);
    };

    options = options || {};
    options.globalCookies = {};

    window.XMLHttpRequest = class extends XMLHttpRequest {
        constructor() {
            super(options);
        }
    };

    // Create a WebSocket class that supports cookies
    // Store cookies globally so WebSocket constructor can access them
    window._wsOptions = options;
    
    window.WebSocket = class extends ws.WebSocket {
        constructor(url: string, protocols?: string | string[]) {
            const wsOptions: ws.ClientOptions = {};
            
            // Get cookies from window options if available
            if (window._wsOptions && window._wsOptions.cookies) {
                wsOptions.headers = {
                    'Cookie': window._wsOptions.cookies,
                    'Origin': url.replace(/^wss?:\/\//, 'https://').replace(/\/amb.*$/, '')
                };
                window.cometdLogger.debug("WebSocket connecting with cookies", {
                    url,
                    cookieLength: window._wsOptions.cookies.length
                });
            }
            
            super(url, protocols, wsOptions);
        }
    };
   
    p["window"] = window;

    return window;
}
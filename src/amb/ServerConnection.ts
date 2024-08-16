/* eslint-disable @typescript-eslint/ban-types */
import {EventManager} from "./EventManager.js";
import {Logger} from "../util/Logger.js";

import { isNil, isObject } from "./Helper.js";
import { AMBConstants } from "./AMBConstants.js";
import { XMLHttpRequest } from "./XMLHttpRequest.js";
import {Properties as properties} from "./Properties.js";
import {ChannelRedirect} from "./ChannelRedirect.js";
import {Channel} from "./Channel.js";
import {CrossClientChannel} from "./CrossClientChannel.js";
import {FunctionQueue} from "./FunctionQueue.js";
import {SubscriptionCommandSender} from "./SubscriptionCommandSender.js";

export class ServerConnection {

	connected = false;
	disconnecting = false;
	eventManager:EventManager = new EventManager({
		CONNECTION_INITIALIZED: "connection.initialized",
		CONNECTION_OPENED: "connection.opened",
		CONNECTION_CLOSED: "connection.closed",
		CONNECTION_BROKEN: "connection.broken",
		SESSION_LOGGED_IN: "session.logged.in",
		SESSION_LOGGED_OUT: "session.logged.out",
		SESSION_INVALIDATED: "session.invalidated",
		SESSION_REESTABLISHED: "session.reestablished"
	});
	static sessionStates:any = {
		SESSION_LOGGED_IN: "session.logged.in",
		SESSION_LOGGED_OUT: "session.logged.out",
		SESSION_INVALIDATED: "session.invalidated"
	};
	state = "closed";
	channels:any = {};
	 _logger:Logger = new Logger("ServerConnection");

	sessionStatus:string;
	loginWindow:any = null;
	loginWindowEnabled = false;
	lastError:any = null;
	errorMessages:any = {"UNKNOWN_CLIENT": "402::Unknown client"};
	loginWindowOverride = false;
	//ambServerConnection:ServerConnection = {};
	needToReestablishSession = false;
	channelRedirect:ChannelRedirect;
	initialized = false;
	
	tokenManagementExtension:any; 
	_cometd:any;
	_crossClientChannel:CrossClientChannel;
	subscriptionCommandSender:SubscriptionCommandSender | null = null;
	



	constructor(cometd:any, crossClientChannel = new CrossClientChannel()) {
		this._cometd = cometd;
		this._crossClientChannel = crossClientChannel;

		this._initializeMetaChannelListeners();
		this.sessionStatus = ServerConnection.sessionStates.SESSION_INVALIDATED;
		this.channelRedirect = new ChannelRedirect(cometd, this);

		this.tokenManagementExtension = cometd.getExtension(AMBConstants.TOKEN_MANAGEMENT_EXTENSION);
	}

	private _initializeMetaChannelListeners() {
		this._cometd.addListener("/meta/handshake", this, this._metaHandshake);
		this._cometd.addListener("/meta/connect", this, this._metaConnect);
		this._cometd.addListener("/meta/subscribe", this, this.applyAMBProperties);
		this._cometd.addListener("/meta/unsubscribe", this, this.applyAMBProperties);
	}

	public connect() {
		//let conn:ServerConnection = this;
		// Protection against anyone who things they should be calling connect
		if (this.connected) {
			this._logger.debug(">>> connection exists, request satisfied");
			return;
		}

		this._logger.debug("Connecting to glide amb server", properties);
		const configParameters:any = {
			url: this.getURL(properties.instance["servletPath"]),
			logLevel: properties.instance.logLevel,
			connectTimeout: properties.instance["wsConnectTimeout"],
			requestHeaders: {
				"cookie":"_gcl_au=1.1.1571932408.1717610613; notice_behavior=implied,us; AMCVS_2A2A138653C66CB60A490D45%40AdobeOrg=1; s_cc=true; _mkto_trk=id:089-ANS-673&token:_mch-service-now.com-1721668147070-89880; notice_preferences=2:; notice_gdpr_prefs=0,1,2:; cmapi_gtm_bl=; cmapi_cookie_privacy=permit 1,2,3; s_sq=%5B%5BB%5D%5D; _ga_P9KGG3X95Y=GS1.2.1722280897.2.1.1722280964.60.0.0; BIGipServerpool_ven01280=3445056da0c21a63eafde16f46fb3fc9; glide_user_route=glide.4d76fa4900b6466620daf5d917a0598f; glide_node_id_for_js=ad393699f9e9d344fa49b14e0c8275c8cebbefb64a20613047b7955d49a5a08b; s_vnum=1725166800562%26vn%3D2; s_lv=1722869593935; kndctr_2A2A138653C66CB60A490D45_AdobeOrg_identity=CiYxNTkwNzQyNjY2NjQ0MDc1ODAzMTE1NDAxNDYzMzgzOTE5NzQ1OFIQCLCurNuNMhgBKgNWQTYwA_AB8O6emJIy; _ga=GA1.2.1911638415.1717611404; AMCV_2A2A138653C66CB60A490D45%40AdobeOrg=359503849%7CMCIDTS%7C19941%7CMCMID%7C15907426666440758031154014633839197458%7CMCAAMLH-1723474393%7C7%7CMCAAMB-1723474393%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1722876793s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C5.0.1%7CMCSYNCSOP%7C411-19948; _ga_KDXJ3VL7DN=GS1.1.1722875114.8.0.1722875114.60.0.0; BAYEUX_BROWSER=2sjhfq52u4d413cf; JSESSIONID=7C489DA2F13E60409995655754C236FE; glide_user_activity=U0N2M18xOmd5RVg3RitQblBuMVU1ZVdCaHQ5U29CNWZ3aVdYNWxoQ3RPZ0NkR1lCaG89Om10WmdIbkNoMVh5UWVDcEU3YUwwV3NjQ0x5UVJxRlVQT1BQSm0vNlhQdzA9; glide_session_store=9EBA246F1BFF4A1073ED84415B4BCB57; __CJ_tabs2_list_sys_script_include=%221%22; __CJ_g_startTime=%221723223540097%22"
			}
		};
		this._logger.debug("Configuration Parameters", configParameters);
		this._cometd.configure(configParameters);
		this._cometd.handshake((h:any) => {
			this._logger.debug("Handshake response", h);
			if (h.successful) {
				this._logger.debug("cometd.handshake: Connection Successful.", h);
				
			}else{
				this._logger.debug("cometd.handshake: Connection Failed.", h);
			}
		});
		// this._crossClientChannel.on(AMBConstants.REESTABLISH_SESSION, function() {
		// 	conn._reestablishSession(false);
		// });
	}

	public reload() {
		this._cometd.reload();
	}

	public abort() {
		this._cometd.getTransport().abort();
	}

	public disconnect() {
		this._logger.debug("Disconnecting from glide amb server..");
		this.disconnecting = true;
		this._cometd.disconnect();
	}

	public getURL(ambServletPath:string) {
		//return window.location.protocol + '//' + window.location.host + '/' + ambServletPath;
		return  this.getBaseUrl() + "/" + ambServletPath;
	}

	public getBaseUrl():string{
		return "https://ven01280.service-now.com";
	}

	public getUserToken(){
		return "deba246f1bff4a1073ed84415b4bcb5722123d8f94b5c83572b2219a0b632b9e1525930a";
	}




	/**
	 * Connection event listeners
	 */
	 _metaHandshake(message:any) {
		//let conn:ServerConnection = this;
		this._logger.debug("_metaHandshake: message = ", message);
		const logoutOverlayStyle = this.getExt(message, AMBConstants.SESSION_LOGOUT_OVERLAY_STYLE);
		if (logoutOverlayStyle) {
			properties.instance.overlayStyle = logoutOverlayStyle;
		}
		this.sessionStatus = this.getExt(message, AMBConstants.GLIDE_SESSION_STATUS);

		this.applySubscriptionCommandFlowProperties(message);

		setTimeout(() => {
			if (message["successful"])
				this._connectionInitialized();
		}, 0);

	}

	 getExt(message:any, extensionName:string) {
		if (isObject(message.ext))
			return message.ext[extensionName];
	}

	 _getChannel(channelName:string, subscriptionOptionsCallback:any) : Channel{
		if (channelName in this.channels)
			return this.channels[channelName];

		const channel = new Channel(this, this._cometd, channelName, this.initialized, subscriptionOptionsCallback);
		this.channels[channelName] = channel;
		return channel;
	}

	 _removeChannel(channelName:any) : void{
		delete this.channels[channelName];
	}

	 applyAMBProperties(message:any) {
		this._logger.debug("applyAMBProperties: message", message);
		if (message.ext) {
			if (message.ext["glide.amb.active"] === false) {
				this.disconnect();
			}
			const logLevel = this.getExt(message, "glide.amb.client.log.level");
			if (logLevel) {
				properties.instance.logLevel = logLevel;
				this._cometd.setLogLevel(properties.instance.logLevel);
			}
		}
	}

	 _getIntMessageExtProperty(valueStr:string, defaultVal:any) {
		let propValue = Math.floor(parseInt(valueStr));
		if (isNaN(propValue) || (propValue < 0))
			propValue = defaultVal;
		return propValue;
	}

	 _getBooleanMessageExtProperty(valueStr:string, defaultVal:any) {
		let propValue = defaultVal;
		if (!isNil(valueStr)) propValue = (valueStr) ? true : false;
		return propValue;
	}

	 applySubscriptionCommandFlowProperties(message:any) {
		if (!message.ext)
			return;

		const glideAMBSubscribeCommandsFlow = message.ext["subscribeCommandsFlow"];
		if (!glideAMBSubscribeCommandsFlow)
			return;

		const subCommandFlowDefault = properties.instance.subscribeCommandsFlow;
		properties.instance.subscribeCommandsFlow.enable =
			this._getBooleanMessageExtProperty(glideAMBSubscribeCommandsFlow["enable"], subCommandFlowDefault.enable);

		if (properties.instance.subscribeCommandsFlow.enable) {
			properties.instance.subscribeCommandsFlow.retries =
				this._getIntMessageExtProperty(glideAMBSubscribeCommandsFlow["retries"], subCommandFlowDefault.retries);
			properties.instance.subscribeCommandsFlow.maxInflight =
				this._getIntMessageExtProperty(glideAMBSubscribeCommandsFlow["maxInflight"], subCommandFlowDefault.maxInflight);
			properties.instance.subscribeCommandsFlow.maxWait =
				this._getIntMessageExtProperty(glideAMBSubscribeCommandsFlow["maxWait"], subCommandFlowDefault.maxWait);

			const glideAMBRetryDelay = glideAMBSubscribeCommandsFlow["retryDelay"];
			if (glideAMBRetryDelay) {
				const retryDelayDefault = properties.instance.subscribeCommandsFlow.retryDelay;
				properties.instance.subscribeCommandsFlow.retryDelay.min =
					this._getIntMessageExtProperty(glideAMBRetryDelay["min"], retryDelayDefault.min);
				properties.instance.subscribeCommandsFlow.retryDelay.max =
					this._getIntMessageExtProperty(glideAMBRetryDelay["max"], retryDelayDefault.max);
				properties.instance.subscribeCommandsFlow.retryDelay.increaseFactor =
					this._getIntMessageExtProperty(glideAMBRetryDelay["increaseFactor"], retryDelayDefault.increaseFactor);
			}	
		}
		this._initializeSubscriptionCommandSender();
	}
	
	 _initializeSubscriptionCommandSender() {
		if (properties.instance.subscribeCommandsFlow.enable) {
			this._logger.addInfoMessage("_initializeSubscriptionCommandSender: SubscriptionCommandSender is enabled");
			if (this.tokenManagementExtension != null)
				this.tokenManagementExtension.updateTokenCount(properties.instance.subscribeCommandsFlow.maxInflight);

			if (this.subscriptionCommandSender)
				this.subscriptionCommandSender.stop();

			this.subscriptionCommandSender = new SubscriptionCommandSender(new FunctionQueue(10000), this.tokenManagementExtension);
		}

	}

	 _resubscribeAll() {
		this._logger.debug("Resubscribing to all!");
		for (const name in this.channels) {
			const channel = this.channels[name];
			try{
				
				channel && channel.resubscribeToCometD();
			}catch(err){
				this._logger.addErrorMessage("Error re-subscribing channel to cometd", {err: err, channel: channel});
			}
			
		}
	}

	 _unsubscribeAll() {
		this._logger.debug("Unsubscribing from all!");
		for (const channelName in this.channels) {
			const channel = this.channels[channelName];
			channel && channel.unsubscribeFromCometD();
		}
	}

	 _metaConnect(/*Hash*/ message:any) {
		//const conn:ServerConnection = this;
		this._logger.debug("_metaConnect: begin", message);
		this.applyAMBProperties(message);

		if (this.disconnecting) {
			setTimeout(() => {
				this.connected = false;
				this._connectionClosed();

			}, 0);
			return;
		}

		//todo: See if we need this
		const shouldTouchHttpSession = this.getExt(message, AMBConstants.TOUCH_HTTP_SESSION);
		if (this.isWebsocketTransport() && shouldTouchHttpSession === true){
			this._logger.debug("Websocket connection, calling _touchHttpSession");
			this._touchHttpSession();
		}else{
			this._logger.debug("Not websocket connection, skipping http touch session");
		}
		 	

		const error = message["error"];
		if (error){
			this._logger.addErrorMessage("Error in message.", {error: error, message: message});
			this.lastError = error;
		}
			

		this._sessionStatus(message);
		const wasConnected = this.connected;
		this.connected = (message["successful"] === true);
		if (!wasConnected && this.connected)
			this._connectionOpened();
		else if (wasConnected && !this.connected)
			this._connectionBroken();
	}

	 isWebsocketTransport() {
		return AMBConstants.WEBSOCKET_TYPE_NAME === this._cometd.getTransport().type;
	}

	 _touchHttpSession() {
		const request = new XMLHttpRequest();
		request.open("POST", this.getURL("amb"));
		request.setRequestHeader("Content-type", "application/json");
		request.send();
		this._logger.debug("_touchHttpSession", request);
	}

	 _connectionInitialized() {
		this._logger.debug("Connection initialized");
		this.initialized = true;
		this.state = "initialized";
		this._publishEvent(this.eventManager.getEvents().CONNECTION_INITIALIZED);
	}


	 _connectionOpened() {
		this._logger.debug("_connectionOpened: Connection opened", {needToReestablishSession:this.needToReestablishSession});

		if (this.needToReestablishSession) {
			this._setupSession();
		} else {
			this.channelRedirect.initialize(this._onChannelRedirectSubscriptionComplete);
			this._onChannelRedirectSubscriptionComplete();
		}

	}

	 _onChannelRedirectSubscriptionComplete() {
		this._resubscribeAll();
		this.state = "opened";
		this._publishEvent(this.eventManager.getEvents().CONNECTION_OPENED);
	}

	 _setupSession() {
		this._logger.debug("_setupSession: ", {ambServerConnection:this});
		if (this.getLastError() !== this.getErrorMessages().UNKNOWN_CLIENT)
			return;

		this.setLastError(null);
		this._sendRequestToSetUpGlideSession((status:any) =>{
			this._logger.debug("ambServerConnection._sendSessionSetupRequest callback", {status:status});
			if (status !== 200)
				return;

			this.needToReestablishSession = false;
			this.channelRedirect.initialize(this._onChannelRedirectSubscriptionComplete);
		});
	}
	private _defaultCallback(status:any):void { this._logger.warn("Empty callback.", status); }

	 _sendRequestToSetUpGlideSession(callback:Function = this._defaultCallback) : void {
		// We are reconnected, but the GlideSession may not have been set up. We currently do not support
		// re-establishing a connection from an AMB message (CometD 2.X does not support asynchronous
		// request handling).
		const xhr = this._buildSetUpSessionRequest();
		xhr.onload = () => callback(xhr);
		xhr.send();
	}

	 _buildSetUpSessionRequest():any {
		this._logger.debug("sending /amb_session_setup.do!");

		const request = new XMLHttpRequest();
		const url:string = this.getBaseUrl() + "/" + "/amb_session_setup.do";
		request.open("POST", url);
		request.setRequestHeader("Content-type", "application/json;charset=UTF-8");
		//todo: Setup getting g_ck if we need it? We are going to handle the session elsewhere
		request.setRequestHeader("X-UserToken",this.getUserToken());
		request.setRequestHeader("X-CometD_SessionID", this._cometd.getClientId());

		return request;
	}

	 _connectionClosed() {
		this._logger.debug("Connection closed");
		this.state = "closed";
		this._publishEvent(this.eventManager.getEvents().CONNECTION_CLOSED);
	}

	 _connectionBroken() {
		this._logger.addErrorMessage("Connection broken");
		this.state = "broken";
		this.needToReestablishSession = true;
		this._publishEvent(this.eventManager.getEvents().CONNECTION_BROKEN);
		this._stopSubscriptionCommandSender();
	}
	
	 _stopSubscriptionCommandSender() {
		if (this.subscriptionCommandSender) {
			this.subscriptionCommandSender.stop();
			this.subscriptionCommandSender = null;
		}
	}


	
/**
	 * Session management/maintenance
	 */

	_sessionStatus(/*Hash*/ message:any) {
		const newSessionStatus = this.getExt(message, AMBConstants.GLIDE_SESSION_STATUS);
		if (!newSessionStatus || newSessionStatus === this.sessionStatus)
			return;

		this.loginWindowOverride = this.getExt(message, "glide.amb.login.window.override") === true;
		this._processSessionStatus(newSessionStatus);
	}

	_processSessionStatus(newSessionStatus:any) {
		this._logger.debug("session.status - " + newSessionStatus);
		if (this.isSessionInvalidated(newSessionStatus)) {
			this._invalidated();
		} else if (this.isLoggedOut(newSessionStatus)) {
			this._loggedOut();
		} else if (this.isReestablished(newSessionStatus)) {
			this._reestablished();
		} else if (this._isLoggedIn(newSessionStatus)) {
			this._loggedIn();
		}
		this.sessionStatus = newSessionStatus;
	}

	 _isLoggedIn(newSessionStatus:any) {
		return (this.sessionStatus === ServerConnection.sessionStates.SESSION_INVALIDATED || this.sessionStatus === ServerConnection.sessionStates.SESSION_LOGGED_OUT)
			&& newSessionStatus === ServerConnection.sessionStates.SESSION_LOGGED_IN;
	}

	 isLoggedOut(newSessionStatus:any) {
		return this.sessionStatus === ServerConnection.sessionStates.SESSION_LOGGED_IN && newSessionStatus === ServerConnection.sessionStates.SESSION_LOGGED_OUT;
	}

	 isReestablished(newSessionStatus:any) {
		return this.sessionStatus === ServerConnection.sessionStates.SESSION_INVALIDATED && newSessionStatus === ServerConnection.sessionStates.SESSION_LOGGED_OUT;
	}

	/**
	 * For logged in users session invalidation happens instead of being logged out when they have remember me on
	 */
	 isSessionInvalidated(newSessionStatus:any) {
		return (this.sessionStatus === ServerConnection.sessionStates.SESSION_LOGGED_IN || this.sessionStatus === ServerConnection.sessionStates.SESSION_LOGGED_OUT)
			&& newSessionStatus === ServerConnection.sessionStates.SESSION_INVALIDATED;
	}

	 _loggedIn() {
		this._logger.debug("LOGGED_IN event fire!");
		this._resubscribeAll();
		this._publishEvent(this.eventManager.getEvents().SESSION_LOGGED_IN);
		this.loginHide();
	}

	 _loggedOut() {
		this._logger.debug("LOGGED_OUT event fire!");
		this._unsubscribeAll();
		this._publishEvent(this.eventManager.getEvents().SESSION_LOGGED_OUT);

		if (this.loginWindowEnabled && !this.loginWindowOverride) {
			this.loginShow();
		}
	}

	 _reestablished() {
		this._logger.debug("REESTABLISHED event fire!");
		this._resubscribeAll();
		this._publishEvent(this.eventManager.getEvents().SESSION_REESTABLISHED);
	}

	 _invalidated() {
		this._logger.debug("INVALIDATED event fire!");
		this._unsubscribeAll();
		this._publishEvent(this.eventManager.getEvents().SESSION_INVALIDATED);
	}

	 _publishEvent(event:any) {
		try {
			this.eventManager.publish(event);
		} catch (e) {
			this._logger.addErrorMessage("error publishing '" + event + "' - " + e);
		}
	}

	 _emitReestablishSession() {
		this._crossClientChannel.emit(AMBConstants.REESTABLISH_SESSION, AMBConstants.REESTABLISH_SESSION);
	}

	/**
	 * Channel management
	 */
	unsubscribeAll() {
		this._unsubscribeAll();
	}

	resubscribeAll() {
		this._resubscribeAll();
	}

	removeChannel(/*String*/channelName:any) {
		this._removeChannel(channelName);
	}

	/**
	 * Connection event management
	 */

	getEvents() {
		return this.eventManager.getEvents();
	}

	getConnectionState() {
		return this.state;
	}

	getLastError() {
		return this.lastError;
	}

	setLastError(/*String*/error:any) {
		this.lastError = error;
	}

	getErrorMessages() {
		return this.errorMessages;
	}

	isLoggedIn() {
		return this.sessionStatus === ServerConnection.sessionStates.SESSION_LOGGED_IN;
	}

	isSessionActive() {
		return this.sessionStatus !== ServerConnection.sessionStates.SESSION_INVALIDATED;
	}

	getChannelRedirect() {
		return this.channelRedirect;
	}

	public getChannel(channelName:string, subscriptionOptionsCallback?:Function) : Channel{
		return this._getChannel(channelName, subscriptionOptionsCallback);
	}

	getChannels() {
		return this.channels;
	}

	getState() {
		return this.state;
	}

	getLoginWindowOverlayStyle() {
		return properties.instance.overlayStyle;
	}

	loginShow() {
		this._logger.debug("Show login window");
		// noinspection HtmlUnknownTarget
		const modalContent = "<iframe src=\"/amb_login.do\" frameborder=\"0\" height=\"400px\" width=\"405px\" scrolling=\"no\"></iframe>";

		const modalTemplate =
			`<div id="amb_disconnect_modal" tabindex="-1" aria-hidden="true" class="modal" role="dialog" style="${properties.instance.overlayStyle}">
				<div class="modal-dialog small-modal" style="width:450px">
				   <div class="modal-content">
					  <header class="modal-header">
						 <h4 id="small_modal1_title" class="modal-title">Login</h4>
					  </header>
					  <div class="modal-body">
					  </div>
				   </div>
				</div>
			</div>`;

		// Protect against GlideModal not being defined
		try {
			// const dialog = new GlideModal('amb_disconnect_modal');
			// // on older browsers the class has a different api
			// if (dialog['renderWithContent']) {
			// 	dialog.template = modalTemplate;
			// 	dialog.renderWithContent(modalContent);
			// } else {
			// 	dialog.setBody(modalContent);
			// 	dialog.render();
			// }
			// loginWindow = dialog;
		} catch (e) {
			//this._logger.debug(e);
		}
	}

	loginHide() {
		// if (!loginWindow)
		// 	return;

		// loginWindow.destroy();
		// loginWindow = null;
	}

	loginComplete() {
		//ambServerConnection.reestablishSession();
	}

	_reestablishSession(emit:boolean) {
		this._sendRequestToSetUpGlideSession((response:any) =>{
			if (!response)
				return;

			const status = JSON.parse(response)["glide.session.status"];
			this._processSessionStatus(status);
		});

		// if (emit)
		// 	this._emitReestablishSession();
	}

	reestablishSession() {
		this._reestablishSession(true);
	}

	subscribeToEvent(/*String*/ event:any, /*Function*/ callback:any) : number{
		// If we're already connected, and someone subscribes to the connection opened
		// event, just fire their callback
		if (this.eventManager.getEvents().CONNECTION_OPENED === event && this.connected)
			callback();

		return this.eventManager.subscribe(event, callback);
	}

	unsubscribeFromEvent(/*Number*/ id:number) {
		this.eventManager.unsubscribe(id);
	}

	isLoginWindowEnabled() : boolean {
		return this.loginWindowEnabled;
	}

	setLoginWindowEnabled(enableLoginWindow:boolean) {
		this.loginWindowEnabled = enableLoginWindow;
	}

	isLoginWindowOverride() {
		return this.loginWindowOverride;
	}

	getSubscriptionCommandSender() {
		return this.subscriptionCommandSender;	
	}

	// /* These are for testing, do not use. */
	// ambServerConnection._metaConnect = _metaConnect;
	// ambServerConnection._metaHandshake = _metaHandshake;
	// ambServerConnection._sendSessionSetupRequest = _sendRequestToSetUpGlideSession;
	// ambServerConnection._onChannelRedirectSubscriptionComplete = _onChannelRedirectSubscriptionComplete;
	// ambServerConnection._getChannel = _getChannel;
	// ambServerConnection._removeChannel = _removeChannel;
	// ambServerConnection._connectionInitialized = _connectionInitialized;
	// ambServerConnection._connectionOpened = _connectionOpened;
	// ambServerConnection._reestablishSession = _reestablishSession;
	// ambServerConnection._touchHttpSession = _touchHttpSession;

}

// import {ServerConnection} from "../../src/amb/ServerConnection.js";
// import properties, {WEBSOCKET_TYPE_NAME} from "../../src/amb/Properties.js";
// import {EventManager} from "../../src/amb/EventManager.js";
// import {Channel} from "../../src/amb/Channel.js";
// import {ChannelRedirect} from "../../src/amb/ChannelRedirect.js";

// delete global.window.location;
// global.window = Object.create(window);
// window.location = {
// 	pathname: "amb",
// 	protocol: "http:",
// 	host: "somehost.com"
// };
// window.self = window;

// jest.useFakeTimers();




// jest.mock("../../src/amb/EventManager.js");
// const events = {
// 	CONNECTION_INITIALIZED: "connection.initialized",
// 	CONNECTION_OPENED: "connection.opened",
// 	CONNECTION_CLOSED: "connection.closed",
// 	CONNECTION_BROKEN: "connection.broken",
// 	SESSION_LOGGED_IN: "session.logged.in",
// 	SESSION_LOGGED_OUT: "session.logged.out",
// 	SESSION_INVALIDATED: "session.invalidated"
// };

// const publish = jest.fn();
// const subscribe = jest.fn();
// const unsubscribe = jest.fn();
// EventManager.mockImplementation(() => {
// 	return {
// 		publish: publish,
// 		subscribe: subscribe,
// 		unsubscribe: unsubscribe,
// 		getEvents: jest.fn().mockImplementation(() => {
// 			return events;
// 		})
// 	};
// });

// const unsubscribeFromCometD = jest.fn();
// const resubscribeToCometD = jest.fn();
// jest.mock("../amb.Channel");
// Channel.mockImplementation((cometd, channelName) => {
// 	return {
// 		subscribe: subscribe,
// 		getName: jest.fn().mockImplementation(() => {
// 			return channelName;
// 		}),
// 		resubscribeToCometD : resubscribeToCometD,
// 		unsubscribeFromCometD : unsubscribeFromCometD
// 	};
// });

// const initialize = jest.fn();
// jest.mock("../amb.ChannelRedirect");
// ChannelRedirect.mockImplementation(() => {
// 	return {
// 		initialize : initialize
// 	};
// });

// let renderWithContent = jest.fn();
// const setBody = jest.fn();
// const render = jest.fn();
// const destroy = jest.fn();
// global.GlideModal = jest.fn().mockImplementation(() => {
// 	return  {
// 		renderWithContent : renderWithContent,
// 		setBody : setBody,
// 		render : render,
// 		destroy : destroy
// 	};
// });


// const open = jest.fn();
// const send = jest.fn();
// const setRequestHeader = jest.fn();
// const mockXHR = jest.fn().mockImplementation(() => {
//     return {
//         open: open,
//         send: send,
//         readyState: 4,
//         setRequestHeader: setRequestHeader
//     };
// });

// const oldXMLHttpRequest = window.XMLHttpRequest;

// let mockCometD = {};
// let mockCrossClientChannel = {};
// let testServerConnection;

// beforeEach(() => {
// 	jest.clearAllMocks();
// 	mockCometD = {
// 		subscribe : jest.fn(),
// 		unsubscribe : jest.fn(),
// 		publish : jest.fn(),
// 		getStatus : jest.fn(),
// 		handshake : jest.fn(),
// 		addListener : jest.fn(),
// 		configure : jest.fn(),
// 		reload : jest.fn(),
// 		disconnect : jest.fn(),
// 		getClientId : jest.fn(),
// 		getTransport : jest.fn().mockImplementation(() => {
// 			return {abort : () => {return "success";}, getType: () => {return WEBSOCKET_TYPE_NAME;}};
// 		}),
// 		getExtension : jest.fn()
// 	};
// 	mockCrossClientChannel ={
// 		on: jest.fn(),
// 		emit: jest.fn()
// 	};
//     window.XMLHttpRequest = mockXHR;
// 	testServerConnection = new ServerConnection(mockCometD, mockCrossClientChannel);
// });

// afterEach(() => {
//     window.XMLHttpRequest = oldXMLHttpRequest;
// });

// function handshakeWithStatus(serverConnection, status){
// 	const handshakeMessage =	{
// 		"minimumVersion": "1.0",
// 		"clientId": "1uptuqy1hf4xt5z3mqxxjn48nr",
// 		"supportedConnectionTypes": ["long-polling"],
// 		"channel": "/meta/handshake",
// 		"id": "1",
// 		"version": "1.0",
// 		"successful": true,
// 		"ext": {
// 			"glide.amb.active": true,
// 			"glide.session.status": status
// 		},
// 	};

// 	serverConnection._metaHandshake(handshakeMessage);
// }

// describe("ServerConnection", () => {

// 	describe("constructor", () => {
// 		it("sets up meta listeners", () => {
// 			expect(mockCometD.addListener).toHaveBeenCalledWith("/meta/handshake", undefined, jasmine.any(Function));
// 			expect(mockCometD.addListener).toHaveBeenCalledWith("/meta/connect", undefined, jasmine.any(Function));
// 		});
// 	});

// 	describe("connect", () => {
// 		it("configures and does a cometd handshake", () => {
// 			testServerConnection.connect();
// 			expect(mockCometD.configure).toHaveBeenCalledWith({ url: "http://somehost.com/amb", logLevel: "info", connectTimeout: 10000});
// 			expect(mockCometD.handshake).toHaveBeenCalled();
// 		});
// 	});

// 	describe("getURL", () => {
// 		it("returns the URL for the amb resource", () => {
// 			expect(testServerConnection.getURL("amb")).toBe("http://somehost.com/amb");
// 		});
// 	});

// 	describe("reload", () => {
// 		it("calls cometd reload", () => {
// 			testServerConnection.reload();
// 			expect(mockCometD.reload).toHaveBeenCalled();
// 		});
// 	});

// 	describe("abort", () => {
// 		it("calls cometd transport abort", () => {
// 			testServerConnection.abort();
// 			expect(mockCometD.getTransport().abort()).toBe("success");
// 		});
// 	});

// 	describe("disconnect", () => {
// 		it("calls cometd disconnect", () => {
// 			testServerConnection.disconnect();
// 			expect(mockCometD.disconnect).toHaveBeenCalled();
// 		});
// 	});

// 	describe("getEvents", () => {
// 		const expectedEvents = {
// 			CONNECTION_INITIALIZED: "connection.initialized",
// 			CONNECTION_OPENED: "connection.opened",
// 			CONNECTION_CLOSED: "connection.closed",
// 			CONNECTION_BROKEN: "connection.broken",
// 			SESSION_LOGGED_IN: "session.logged.in",
// 			SESSION_LOGGED_OUT: "session.logged.out",
// 			SESSION_INVALIDATED: "session.invalidated"
// 		};

// 		it("returns event manager events", () => {
// 			expect(testServerConnection.getEvents()).toEqual(expectedEvents);
// 		});
// 	});

// 	// Add tests here for different connection states
// 	describe("getConnectionState", () => {
// 		it("initial state is closed", () => {
// 			expect(testServerConnection.getConnectionState()).toBe("closed");
// 		});
// 	});

// 	describe("setLastError and getLastError", () => {
// 		it("sets and gets the last error message", () => {
// 			testServerConnection.setLastError("error message");
// 			expect(testServerConnection.getLastError()).toBe("error message");
// 		});
// 	});

// 	describe("getErrorMessages", () => {
// 		it("returns connection error messages", () => {
// 			const errorMessages = {"UNKNOWN_CLIENT": "402::Unknown client"};
// 			testServerConnection.getLastError("error message");
// 			expect(testServerConnection.getErrorMessages()).toEqual(errorMessages);
// 		});
// 	});

// 	describe("loginShow", () => {
// 		const modalContent = "<iframe src=\"/amb_login.do\" frameborder=\"0\" height=\"400px\" width=\"405px\" scrolling=\"no\"></iframe>";

// 		afterEach(() => {
// 			properties["loginWindow"] = "true";
// 			renderWithContent = jest.fn();
// 		});

// 		it("displays login modal window via renderWithContent", () => {
// 			testServerConnection.loginShow();
// 			expect(renderWithContent).toHaveBeenCalledWith(modalContent);
// 		});

// 		it("displays login modal window via setBody", () => {
// 			renderWithContent = undefined;
// 			testServerConnection.loginShow();
// 			expect(setBody).toHaveBeenCalledWith(modalContent);
// 			expect(render).toHaveBeenCalled();
// 		});

// 		it("does not display if login window is not enabled", () => {
// 			properties["loginWindow"] = "false";
// 			const connectMessage =	{
// 				"ext": {
// 					"glide.amb.active": true,
// 					"glide.session.status": "session.logged.out",
// 					"glide.amb.login.window.override": false
// 				},
// 				"channel": "/meta/connect",
// 				"id": "1",
// 				"successful": true
// 			};

// 			const testLoginServerConnection = new ServerConnection(mockCometD);
// 			testLoginServerConnection._metaConnect(connectMessage);
// 			expect(renderWithContent).toHaveBeenCalledTimes(0);
// 			expect(setBody).toHaveBeenCalledTimes(0);
// 			expect(render).toHaveBeenCalledTimes(0);
// 		});
// 	});

// 	describe("loginHide", () => {
// 		it("destroys login window", () => {
// 			testServerConnection.loginShow();
// 			testServerConnection.loginHide();
// 			expect(renderWithContent).toHaveBeenCalled();
// 			expect(destroy).toHaveBeenCalled();
// 		});

// 		it("only destroys login window if it exists", () => {
// 			testServerConnection.loginHide();
// 			expect(destroy).toHaveBeenCalledTimes(0);
// 		});
// 	});

// 	describe("loginComplete", () => {
// 		it("Calls session setup", () => {
// 			handshakeWithStatus(testServerConnection, "session.logged.out");
// 			const reestablishSpy = jest.spyOn(testServerConnection, "reestablishSession");
// 			testServerConnection.loginComplete();
// 			expect(reestablishSpy).toHaveBeenCalled();
// 		});
// 	});

// 	describe("subscribeToEvent", () => {
// 		it("subscribes to an event via event manager", () => {
// 			const callback = jest.fn();
// 			testServerConnection.subscribeToEvent("connection.closed", callback);
// 			expect(subscribe).toHaveBeenCalledWith("connection.closed", callback);
// 		});

// 		it("if connected already call callback", () => {
// 			const callback = jest.fn();
// 			const connectMessage = {
// 				"successful": true
// 			};
// 			testServerConnection._metaConnect(connectMessage);
// 			testServerConnection.subscribeToEvent("connection.opened", callback);
// 			expect(callback).toHaveBeenCalled();
// 		});
// 	});

// 	describe("unsubscribeFromEvent", () => {
// 		it("unsubscribes to an event via event manager", () => {
// 			testServerConnection.unsubscribeFromEvent(1);
// 			expect(unsubscribe).toHaveBeenCalledWith(1);
// 		});
// 	});

// 	describe("isLoginWindowEnabled", () => {
// 		afterEach(() => {
// 			properties["loginWindow"] = "true";
// 		});

// 		it("returns true if loginWindow property is true", () => {
// 			properties["loginWindow"] = "true";
// 			const testLoginServerConnection = new ServerConnection(mockCometD);
// 			expect(testLoginServerConnection.isLoginWindowEnabled()).toBe(true);
// 		});

// 		it("returns false if loginWindow property is false", () => {
// 			properties["loginWindow"] = "false";
// 			const testLoginServerConnection = new ServerConnection(mockCometD);
// 			expect(testLoginServerConnection.isLoginWindowEnabled()).toBe(false);
// 		});

// 		it("returns false if loginWindowEnabled set to false", () => {
// 			properties["loginWindow"] = "true";
// 			const testLoginServerConnection = new ServerConnection(mockCometD);
// 			testLoginServerConnection.setLoginWindowEnabled(false);
// 			expect(testLoginServerConnection.isLoginWindowEnabled()).toBe(false);
// 		});
// 	});

// 	describe("isLoginWindowOverride", () => {
// 		beforeEach(() => {
// 			properties["loginWindow"] = "true";
// 		});
// 		it("returns default login window override state", () => {
// 			expect(testServerConnection.isLoginWindowOverride()).toBe(false);
// 		});

// 		it("login window overrode if received in ext message", () => {
// 			const connectMessage =	{
// 				"ext": {
// 					"glide.amb.active": true,
// 					"glide.session.status": "session.logged.out",
// 					"glide.amb.login.window.override": true
// 				},
// 				"channel": "/meta/connect",
// 				"id": "1",
// 				"successful": true
// 			};
// 			testServerConnection._metaConnect(connectMessage);

// 			expect(renderWithContent).toHaveBeenCalledTimes(0);
// 			expect(setBody).toHaveBeenCalledTimes(0);
// 			expect(render).toHaveBeenCalledTimes(0);
// 			expect(testServerConnection.isLoginWindowOverride()).toBe(true);
// 		});
// 	});

// 	describe("getLoginWindowOverlayStyle", () => {
// 		it("returns default blackout overlay enabled state", () => {
// 			expect(testServerConnection.getLoginWindowOverlayStyle()).toBe("");
// 		});

// 		it("blackout overlay enabled is set when ext message", () => {
// 			const connectMessage =	{
// 				"ext": {
// 					"glide.amb.active": true,
// 					"glide.amb.session.logout.overlay.style": "background-color: #D9D9D9; opacity: 1"
// 				},
// 				"channel": "/meta/handshake",
// 				"id": "1",
// 				"successful": true
// 			};
// 			testServerConnection._metaHandshake(connectMessage);
// 			expect(testServerConnection.getLoginWindowOverlayStyle()).toBe("background-color: #D9D9D9; opacity: 1");
// 		});
// 	});

// 	describe("_metaConnect", () => {
// 		it("should logout", () => {
// 			const connectMessage =	{
// 				"ext": {
// 					"glide.amb.active": true,
// 					"glide.session.status": "session.logged.out"
// 				},
// 				"channel": "/meta/connect",
// 				"id": "1",
// 				"successful": true
// 			};

// 			testServerConnection._metaConnect(connectMessage);
// 			expect(testServerConnection.isLoggedIn()).toBe(false);
// 		});

// 		it("should login", () => {
// 			const connectMessage =	{
// 				"ext": {
// 					"glide.amb.active": true,
// 					"glide.session.status": "session.logged.out"
// 				},
// 				"channel": "/meta/connect",
// 				"id": "1",
// 				"successful": true
// 			};

// 			const spyLoginHide = jest.spyOn(testServerConnection, "loginHide");

// 			testServerConnection._metaConnect(connectMessage);
// 			expect(testServerConnection.isLoggedIn()).toBe(false);
// 			connectMessage.ext["glide.session.status"] = "session.logged.in";
// 			testServerConnection._metaConnect(connectMessage);

// 			expect(publish).toHaveBeenCalledWith("session.logged.in");
// 			expect(testServerConnection.isLoggedIn()).toBe(true);
// 			expect(spyLoginHide).toHaveBeenCalled();
// 		});

// 		it("should invalidate session", () => {
// 			const connectMessage =	{
// 				"ext": {
// 					"glide.amb.active": true,
// 					"glide.session.status": "session.invalidated"
// 				},
// 				"channel": "/meta/connect",
// 				"id": "1",
// 				"successful": true
// 			};
// 			handshakeWithStatus(testServerConnection, "session.logged.in");
// 			testServerConnection._metaConnect(connectMessage);
// 			expect(testServerConnection.isLoggedIn()).toBe(false);
// 			expect(publish).toHaveBeenCalledWith("session.invalidated");
// 		});

// 		it("should disconnect if amb is not active", () => {
// 			const connectMessage =	{
// 				"ext": {
// 					"glide.amb.active": false,
// 				},
// 				"channel": "/meta/connect",
// 				"id": "1",
// 				"successful": true
// 			};

// 			const spyDisconnect = jest.spyOn(testServerConnection, "disconnect");
// 			testServerConnection._metaConnect(connectMessage);
// 			jest.runAllTimers();
// 			expect(spyDisconnect).toHaveBeenCalled();
// 			expect(publish).toHaveBeenCalledWith("connection.closed");
// 		});

// 		it("recovered connection re-establishes the session", () => {
// 			const connectMessage = {
// 				"successful": true
// 			};

// 			const disconnectMessage = {
// 				"successful": false,
// 				"error": "402::Unknown client"
// 			};

// 			const reconnectMessage = {
// 				"successful": true
// 			};

// 			testServerConnection._metaConnect(connectMessage);
// 			testServerConnection._metaConnect(disconnectMessage);
// 			testServerConnection._metaConnect(reconnectMessage);
// 			jest.runAllTimers();

// 			expect(open).toHaveBeenCalledWith("POST", "/amb_session_setup.do", true);
// 			expect(setRequestHeader).toHaveBeenCalledWith("Content-type", "application/json;charset=UTF-8");
// 			expect(setRequestHeader).toHaveBeenCalledWith("X-UserToken", window.g_ck);
// 			expect(send).toHaveBeenCalled();
// 			testServerConnection._onChannelRedirectSubscriptionComplete();
// 			expect(publish).toHaveBeenCalledWith("connection.opened");
// 			expect(testServerConnection.getLastError()).toBeNull();
// 		});
// 	});

// 	it("remove channel deletes a channel", () => {
// 		testServerConnection.getChannel("channel name");
// 		expect(testServerConnection.getChannels()["channel name"]).toBeDefined();
// 		testServerConnection.removeChannel("channel name");
// 		expect(testServerConnection.getChannels()["channel name"]).toBeUndefined();
// 	});

// 	describe("_metaHandshake", () => {
// 		it("should initialize connection if successful", () => {
// 			const handshakeMessage =	{
// 				"minimumVersion": "1.0",
// 				"clientId": "1uptuqy1hf4xt5z3mqxxjn48nr",
// 				"supportedConnectionTypes": ["long-polling"],
// 				"channel": "/meta/handshake",
// 				"id": "1",
// 				"version": "1.0",
// 				"successful": true
// 			};

// 			testServerConnection._metaHandshake(handshakeMessage);
// 			jest.runAllTimers();
// 			expect(publish).toBeCalledWith("connection.initialized");
// 		});
// 	});

// 	describe("server connection events", () => {
// 		it("connection initialized sends event", () => {
// 			testServerConnection._connectionInitialized();
// 			expect(testServerConnection.getState()).toBe("initialized");
// 		});

// 		it("_connectionOpened inits channel redirect and subscribes on redirect complete", () => {
// 			expect(ChannelRedirect).toHaveBeenCalledWith(mockCometD, testServerConnection);

// 			testServerConnection.getChannel("channel name");
// 			testServerConnection.getChannel("channel name2");

// 			testServerConnection._connectionOpened();
// 			expect(subscribe).toHaveBeenCalledTimes(0);
// 			expect(initialize).toHaveBeenCalledWith(testServerConnection._onChannelRedirectSubscriptionComplete);

// 			testServerConnection._onChannelRedirectSubscriptionComplete();
// 			expect(resubscribeToCometD).toHaveBeenCalledTimes(2);

// 		});

// 		it("_unsubscribeall triggers channel unsubscribeFromCometd for each channel", () => {
// 			testServerConnection.getChannel("channel name");
// 			testServerConnection.getChannel("channel name2");
// 			testServerConnection._onChannelRedirectSubscriptionComplete();
// 			expect(resubscribeToCometD).toHaveBeenCalledTimes(2);
// 			testServerConnection.unsubscribeAll();
// 			expect(unsubscribeFromCometD).toHaveBeenCalledTimes(2);
// 		});

// 		it("_resubscribeall triggers channel resubscribeFromCometd for each channel", () => {
// 			const channel1 = testServerConnection.getChannel("channel name");
// 			const channel2 = testServerConnection.getChannel("channel name2");

// 			expect(channel1.getName()).toBe("channel name");
// 			expect(channel2.getName()).toBe("channel name2");

// 			testServerConnection.resubscribeAll();

// 			expect(resubscribeToCometD).toHaveBeenCalledTimes(2);
// 		});
// 	});

// 	describe("touch http session messages", () => {
// 		const connectMessageWithTouch = {
// 			"ext": {
// 				"glide.amb.active": true,
// 				"glide.session.status": "session.logged.out",
// 				"glide.amb.login.window.override": false,
// 				"session.touch.http": true
// 			},
// 			"channel": "/meta/connect",
// 			"id": "1",
// 			"successful": true,
// 		};
// 		const connectMessageWithoutTouch = {
// 			"ext": {
// 				"glide.amb.active": true,
// 				"glide.session.status": "session.logged.out",
// 				"glide.amb.login.window.override": false,
// 			},
// 			"channel": "/meta/connect",
// 			"id": "1",
// 			"successful": true,
// 		};

// 		it("test websocket transport and no touch message is recv should not touch", () => {
// 			const touchHttpSession = jest.spyOn(testServerConnection, "_touchHttpSession");
// 			testServerConnection._metaConnect(connectMessageWithoutTouch);
// 			expect(touchHttpSession).toHaveBeenCalledTimes(0);
// 		});
// 		it("test websocket transport and touch message is recv should touch", () => {
// 			const touchHttpSession = jest.spyOn(testServerConnection, "_touchHttpSession");
// 			testServerConnection._metaConnect(connectMessageWithTouch);
// 			expect(touchHttpSession).toHaveBeenCalled();
// 		});
// 		it("test long polling transport and touch is sent should not touch", () => {
// 			mockCometD.getTransport = jest.fn().mockImplementation(() => {
// 				return {abort : () => {return "success";}, getType: () => {return "long polling";}};
// 			});
// 			const touchHttpSession = jest.spyOn(testServerConnection, "_touchHttpSession");
// 			testServerConnection._metaConnect(connectMessageWithTouch);
// 			expect(touchHttpSession).toHaveBeenCalledTimes(0);
// 		});
// 	});
// });

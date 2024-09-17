/* eslint-disable @typescript-eslint/no-empty-function */
import { mock } from "ts-jest-mocker";
import {Channel} from "../../src/amb/Channel.js";
import {ServerConnection} from "../../src/amb/ServerConnection.js";
import { isNull } from "../../src/amb/Helper.js";
import  { Callback, CometD, Status, SubscriptionHandle } from "cometd";
import { ChannelListener } from "../../src/amb/ChannelListener.js";


const serverConnectionMock = mock(ServerConnection);

// const events = {
// 	CONNECTION_INITIALIZED: "connection.initialized",
// 	CONNECTION_OPENED: "connection.opened",
// 	SESSION_LOGGED_IN: "session.logged.in",
// 	SESSION_LOGGED_OUT: "session.logged.out",
// 	SESSION_INVALIDATED: "session.invalidated"
// };




describe("Channel", () => {
	//const cometd:CometD = cometdMock;
	//const mockCometD:CometD = cometd;
	const conn:ServerConnection = serverConnectionMock;
	let outputMessage = "";
	

	
	beforeEach(() => {
		outputMessage = "";
		// mockCometD = {
		// 	subscribe: jest.fn(),
		// 	unsubscribe: jest.fn(),
		// 	publish: jest.fn(),
		// 	getStatus: jest.fn()
		// };
	});

	function getMockCometD(){
		const cometdMock = mock(CometD); 
		return cometdMock;
	}

	function testSubscribe(subscribeOptionsCallback, sendToCometD, testResubscribe) {
		const cometdMock =getMockCometD(); 

		const mockChannelListener = mock(ChannelListener);
			mockChannelListener.getCallback.mockReturnValue(() => {
				return "Llama";
			});

		let testChannel;
		if (isNull(subscribeOptionsCallback))
			testChannel = new Channel(conn ,cometdMock, "testChannelName", true);
		else
			testChannel = new Channel(conn, cometdMock, "testChannelName", true, subscribeOptionsCallback);

		testChannel.subscribe(mockChannelListener);
		expect(cometdMock.subscribe).toHaveBeenCalledTimes(1);

		if (testResubscribe) {
			testChannel.resubscribe();
			expect(mockChannelListener.resubscribe).toHaveBeenCalledTimes(1);
		}

		if (sendToCometD) {
			const subOptionsWrapper = { "subscribeOptions": subscribeOptionsCallback() };
			expect(cometdMock.subscribe).toHaveBeenCalledWith("testChannelName",null, expect.any(Function), subOptionsWrapper, expect.any(Function));
		} else
			expect(cometdMock.subscribe).toHaveBeenCalledWith("testChannelName",null, expect.any(Function),null, expect.any(Function));
	}

	it("returns the channel name", () => {
		const testChannel = new Channel(conn, getMockCometD(), "testChannelName", false);
		expect(testChannel.getName()).toBe("testChannelName");
	});

	describe("subscribe", () => {
		it("calls cometd subscribe with subscribe options when subscribe options is not an empty object", () => {
			const subscribeOptionsCallback = function() { return {"blah": "blah"}; };
			testSubscribe(subscribeOptionsCallback, true, false);
		});

		it("calls cometd subscribe without subscribe options when subscribe options is an empty object", () => {
			const subscribeOptionsCallback = (() => { return {}; });
			testSubscribe(subscribeOptionsCallback, false, false);
		});

		it("calls cometd subscribe without subscribe options when subscribe options is missing", () => {
			testSubscribe(null, false, false);
		});

		it("calls cometd subscribe without subscribe options when subscribe options callback is an empty function", () => {
			const subscribeOptionsCallback = (() => {});
			testSubscribe(subscribeOptionsCallback, false, false);
		});

		it("does not call cometd subscribe to channel if disconnected but does create listener", () => {

			// const mockChannelListener = {
				// getCallback: jest.fn().mockImplementation(() => {
				// 	return "poop";
				// }),
				// getSubscriptionCallback: jest.fn()

			// };
			
			const mockCometD = getMockCometD();
			const mockChannelListener = mock(ChannelListener);
			mockChannelListener.getCallback.mockReturnValue(() => {
				return "poop";
			});

			mockChannelListener.getSubscriptionCallback.mockReturnValue(() => {});

			const testChannel = new Channel(conn, mockCometD, "testChannelName", false);
			const listenerCount = testChannel.subscribe(mockChannelListener);

			expect(listenerCount).toBe(1);
			expect(mockCometD.subscribe).toHaveBeenCalledTimes(0);

		});

		it("does not subscribe to channel if listener callback undefined", () => {
			const mockCometD = getMockCometD();

			const mockChannelListener = mock(ChannelListener);
			mockChannelListener.getCallback.mockReturnValue(null);
			mockChannelListener.getSubscriptionCallback.mockReturnValue(() => {});

			const testChannel = new Channel(conn, mockCometD, "testChannelName", false);
			const listenerCount = testChannel.subscribe(mockChannelListener);

			expect(listenerCount).toBe(null);
			//expect(outputMessage).toBe("amb.Channel [ERROR] Cannot subscribe to channel: testChannelName, callback not provided");
		});

		it("subscribes to a channel if subscription does not already exist", () => {
			const mockCometD = getMockCometD();

			const mockChannelListener = mock(ChannelListener);
			mockChannelListener.getCallback.mockReturnValue(() => {
				 true;
			});
			mockChannelListener.getSubscriptionCallback.mockReturnValue(() => {});

			const testChannel = new Channel(conn, mockCometD, "testChannelName", true);
			const listenerCount = testChannel.subscribe(mockChannelListener);

			expect(listenerCount).toBe(1);
			expect(mockCometD.subscribe).toHaveBeenCalledTimes(1);
			expect(mockCometD.subscribe).toHaveBeenCalledWith("testChannelName",null, expect.any(Function), null, expect.any(Function));
		});

		it("does not subscribe if not initialized", () => {
			const mockCometD = getMockCometD();
			const mockChannelListener = mock(ChannelListener);
			mockChannelListener.getCallback.mockReturnValue(() => {
				true;
			});
			mockChannelListener.getSubscriptionCallback.mockReturnValue(() => {});

			const testChannel = new Channel(conn, mockCometD, "testChannelName", false);
			const idCounter = testChannel.subscribe(mockChannelListener);

			expect(idCounter).toBe(1);
			expect(mockCometD.subscribe).toHaveBeenCalledTimes(0);
		});

		it("does not add duplicate listeners", () => {
			const mockCometD = getMockCometD();

			const mockChannelListener = mock(ChannelListener);
			mockChannelListener.getCallback.mockReturnValue(() => {
				true;
			});
			mockChannelListener.getSubscriptionCallback.mockReturnValue(() => {});
			mockChannelListener.getID.mockReturnValue(1);

			const testChannel = new Channel(conn, mockCometD, "testChannelName", false);
			testChannel.subscribe(mockChannelListener);

			// Add the same listener
			testChannel.subscribe(mockChannelListener);

			expect(testChannel.getChannelListeners().length).toBe(1);
		});

		it("adds multiple listeners", () => {
			const mockCometD = getMockCometD();

			const mockChannelListener1 = mock(ChannelListener);
			mockChannelListener1.getCallback.mockReturnValue(() => {
				true;
			});
			mockChannelListener1.getSubscriptionCallback.mockReturnValue(() => { true;});
			mockChannelListener1.getID.mockReturnValue(1);


			const mockChannelListener2 = mock(ChannelListener);
			mockChannelListener2.getCallback.mockReturnValue(() => {
				true;
			});
			mockChannelListener2.getSubscriptionCallback.mockReturnValue(() => {true; });
			mockChannelListener2.getID.mockReturnValue(2);


			const testChannel = new Channel(conn, mockCometD, "testChannelName", false);
			testChannel.subscribe(mockChannelListener1);
			testChannel.subscribe(mockChannelListener2);

			expect(testChannel.getChannelListeners().length).toBe(2);
		});

		it("queues listener subscription callbacks", () => {
			const mockCometD = getMockCometD();

			const mockChannelListener1 = mock(ChannelListener);
			mockChannelListener1.getCallback.mockReturnValue(() => {
				true;
			});
			mockChannelListener1.getSubscriptionCallback.mockReturnValue(() => { 
				console.log("sub callback 2 called");
			});
			mockChannelListener1.getID.mockReturnValue(1);


			const mockChannelListener2 = mock(ChannelListener);
			mockChannelListener2.getCallback.mockReturnValue(() => {
				true;
			});
			mockChannelListener2.getSubscriptionCallback.mockReturnValue(() => {
				console.log("sub callback 2 called");
			});
			mockChannelListener2.getID.mockReturnValue(2);

			const testChannel = new Channel(conn, mockCometD, "testChannelName", false);
			testChannel.subscribe(mockChannelListener1);
			testChannel.subscribe(mockChannelListener2);

			expect(testChannel.getListenerCallbackQueue().length).toBe(2);
			testChannel.subscriptionCallback({status: "successful"});
			expect(testChannel.getListenerCallbackQueue().length).toBe(0);
		});

		it("listener subscription callback is called", () => {
			const mockCometD = getMockCometD();

			const mockChannelListener1 = mock(ChannelListener);
			mockChannelListener1.getCallback.mockReturnValue(() => {
				true;
			});
			mockChannelListener1.getSubscriptionCallback.mockReturnValue(() => { 
				console.log("sub callback called");
			});
			mockChannelListener1.getID.mockReturnValue(1);


			const testChannel = new Channel(conn, mockCometD, "testChannelName", true);
			testChannel.setSubscriptionCallbackResponse("response");
			testChannel.subscribe(mockChannelListener1);

			expect(testChannel.getChannelListeners().length).toBe(1);
			//expect(outputMessage).toBe("sub callback called");
		});

		it("returns undefined if cometd subscribe throws exception", () => {
			const fnCometMock = mock(CometD); 
			fnCometMock.subscribe.mockReturnValue(() => {
				throw "Error";
			});
			fnCometMock.subscribe.mockImplementation((channel: string, messageCallback: Callback, subscribeProps: object, subscribeCallback?: Callback | undefined) : SubscriptionHandle => {
				throw new Error("Error");
			})

			const mockChannelListener = mock(ChannelListener);
			mockChannelListener.getCallback.mockReturnValue(() => {
				true;
			});
			
		

			const testChannel = new Channel(conn, fnCometMock, "testChannelName", true);
			const listenerId = testChannel.subscribe(mockChannelListener);

			expect(listenerId).toBe(null);
			//expect(outputMessage).toBe("amb.Channel [ERROR] Error");
		});
	});

	describe("resubscribe", () => {
		it("should resubscribe listeners", () => {
			const mockCometD = getMockCometD();
			const mockChannelListener1 = mock(ChannelListener);
			mockChannelListener1.getCallback.mockReturnValue(() => {
				true;
			});
			
			mockChannelListener1.getID.mockReturnValue(1);


			const mockChannelListener2 = mock(ChannelListener);
			mockChannelListener2.getCallback.mockReturnValue(() => {
				true;
			});
		
			mockChannelListener2.getID.mockReturnValue(2);

			
			const testChannel = new Channel(conn, mockCometD, "testChannelName", true);
			testChannel.subscribe(mockChannelListener1);
			testChannel.subscribe(mockChannelListener2);

			testChannel.resubscribe();

			expect(mockCometD.subscribe).toHaveBeenCalledTimes(2);
			expect(mockChannelListener1.resubscribe).toHaveBeenCalledTimes(1);
			expect(mockChannelListener2.resubscribe).toHaveBeenCalledTimes(1);
		});

		it("resubscribes listener with subscribe options", () => {
			const subscribeOptionsCallback = function() { return {"blah": "blah"}; };
			testSubscribe(subscribeOptionsCallback, true, true);
		});
	});

	describe("unsubscribe", () => {
		xit("requires a listener argument", () => {
			//With TS this isn't really needed
			const mockCometD = getMockCometD();
			const mockChannelListener1 = mock(ChannelListener);
			mockChannelListener1.getCallback.mockReturnValue(() => {
				true;
			});
			
			mockChannelListener1.getID.mockReturnValue(1);


		
			const testChannel = new Channel(conn, mockCometD, "testChannelName", true);
			const subRet:any = testChannel.subscribe(mockChannelListener1);

			testChannel.unsubscribe(mockChannelListener1);


			//expect(outputMessage).toBe("amb.Channel [ERROR] Cannot unsubscribe from channel: testChannelName, listener argument does not exist");
		});

		it("should unsubscribe a listener", () => {
			
			const mockCometD = getMockCometD();
			const mockChannelListener1 = mock(ChannelListener);
			mockChannelListener1.getCallback.mockReturnValue(() => {
				true;
			});
			mockChannelListener1.getID.mockReturnValue(1);

			const mockChannelListener2 = mock(ChannelListener);
			mockChannelListener2.getCallback.mockReturnValue(() => {
				true;
			});
			mockChannelListener2.getID.mockReturnValue(2);

			const testChannel = new Channel(conn, mockCometD, "testChannelName", true);
			testChannel.subscribe(mockChannelListener1);
			testChannel.subscribe(mockChannelListener2);


			expect(testChannel.getChannelListeners().length).toBe(2);
			testChannel.unsubscribe(mockChannelListener1);

			expect(testChannel.getChannelListeners().length).toBe(1);
		});

		it("should unsubscribe from channel on last listener removal", () => {
			const mockCometD = getMockCometD();
			const subObject = {
				status: "successful"
			};

			
			mockCometD.subscribe.mockReturnValue(subObject);
			mockCometD.getStatus.mockReturnValue( "connected" as Status);

			const mockChannelListener1 = mock(ChannelListener);
			mockChannelListener1.getCallback.mockReturnValue(() => {
				true;
			});
			mockChannelListener1.getID.mockReturnValue(1);
		
			
			const testChannel = new Channel(conn, mockCometD, "testChannelName", true);
			testChannel.subscribe(mockChannelListener1);
			expect(mockCometD.subscribe).toHaveBeenCalledTimes(1);

			expect(testChannel.getChannelListeners().length).toBe(1);
			testChannel.unsubscribe(mockChannelListener1);

			expect(testChannel.getChannelListeners().length).toBe(0);
			expect(mockCometD.unsubscribe).toHaveBeenCalledTimes(1);
			expect(mockCometD.unsubscribe).toHaveBeenCalledWith(subObject);
		});

		it("should not unsubscribe from cometd if already unsubscribed", () => {
			const mockCometD = getMockCometD();
			const subObject = {
				status: "successful"
			};

			
			mockCometD.subscribe.mockReturnValue (subObject);
			mockCometD.getStatus.mockReturnValue( "connected" as Status);

			const mockChannelListener1 = mock(ChannelListener);
			mockChannelListener1.getCallback.mockReturnValue(() => {
				true;
			});
			mockChannelListener1.getID.mockReturnValue(1);

			const testChannel = new Channel(conn, mockCometD, "testChannelName", true);
			testChannel.subscribe(mockChannelListener1);
			expect(mockCometD.subscribe).toHaveBeenCalledTimes(1);

			expect(testChannel.getChannelListeners().length).toBe(1);
			testChannel.unsubscribe(mockChannelListener1);
			testChannel.unsubscribeFromCometD();

			expect(testChannel.getChannelListeners().length).toBe(0);
			expect(mockCometD.unsubscribe).toHaveBeenCalledTimes(1);
			expect(mockCometD.unsubscribe).toHaveBeenCalledWith(subObject);
		});
	});

	describe("_handleResponse", () => {
		it("calls registered listener callbacks", () => {
			const mockCometD = getMockCometD();
			let isCalled = false;
			let sentMessage = "";
			const mockChannelListener1 = mock(ChannelListener);
			mockChannelListener1.getCallback.mockReturnValue((m) => {
				isCalled = true;
				sentMessage = m;
			});
			mockChannelListener1.getID.mockReturnValue(1);

			const testChannel = new Channel(conn, mockCometD, "testChannelName", true);
			testChannel.subscribe(mockChannelListener1);
			testChannel._handleResponse("test message");

			expect(isCalled).toBe(true);
			expect(sentMessage).toBe("test message");
		});
	});

	describe("publish", () => {
		it("publishes a message", () => {
			const mockCometD = getMockCometD();
			const mockChannelListener1 = mock(ChannelListener);
			mockChannelListener1.getCallback.mockReturnValue(() => {
				true;
			});
			mockChannelListener1.getID.mockReturnValue(1);

			const testChannel = new Channel(conn, mockCometD, "testChannelName", true);
			testChannel.subscribe(mockChannelListener1);
			testChannel.publish("test message");
			expect(mockCometD.publish).toHaveBeenCalledWith("testChannelName", "test message");
		});
	});

	describe("resubscribeToCometD", () => {
		it("resubscribes to CometD", () => {
			const mockCometD = getMockCometD();
			const testChannel = new Channel(conn, mockCometD, "testChannelName", true);
			testChannel.resubscribeToCometD();
			expect(mockCometD.subscribe).toHaveBeenCalledTimes(1);
			expect(mockCometD.subscribe).toHaveBeenCalledWith("testChannelName",null, expect.any(Function), null, expect.any(Function));
		});
	});

});
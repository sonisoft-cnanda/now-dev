
import { mock } from "ts-jest-mocker";
import {ChannelListener} from '../../src/amb/ChannelListener.js';
import {ChannelRedirect} from '../../src/amb/ChannelRedirect.js';
import {Channel} from "../../src/amb/Channel.js";
import {ServerConnection} from "../../src/amb/ServerConnection.js";
import { CometD } from "cometd";


let channels:any = {};

let testChannelRedirect;
describe('ChannelRedirect', () => {
	let mockChannel:any = null;
	let mockChannelListener:any = null;
	let mockServerConnection:any =null;
	let mockCometD:any = null;
	
	

	beforeEach(() => {
		channels = {};
		mockChannelListener = getMockChannelListener();

		mockCometD = mock(CometD);
		mockCometD.getClientId.mockReturnValue('cometDClientId');

		mockChannel = mock(Channel);
		//mockChannel.getClientId.mockReturnValue('cometDClientId');
		mockChannel.getChannelListeners.mockImplementation(() => {
			const arr:any = [
				 mockChannelListener, mockChannelListener
			];
			return arr; //[new ChannelListener(null, null, null)];
		});
		mockChannel.subscribe.mockImplementation(() => {

		});
		//mockChannel.getName.mockReturnValue("")

	 	
		mockServerConnection = getMockServerConnection();

		//channelListenerSubscribe = jest.fn();
	});

	function getMockChannelListener(){
		const mockL:any = mock(ChannelListener);
		mockL.setNewChannel.mockImplementation((newChannel) => {});
		mockL.subscribe.mockImplementation(() => {

		});

		return mockL;
	}

	function getMockServerConnection(){
		const mockSrvConn = mock(ServerConnection);

	 	
		mockSrvConn.getChannel.mockImplementation((channelName) => {
			if (channelName in channels)
				return channels[channelName];

			const channel = getMockChannel(channelName);//new Channel(mockServerConnection, mockCometD, channelName, false);
			channels[channelName] = channel;
			return channel;
		});

		mockSrvConn.removeChannel.mockImplementation((channelName) => {
			delete channels[channelName];
		});
		return mockSrvConn;
	}

	function getMockChannel(channelName){
		const channelMock = mock(Channel);
		channelMock.getName.mockReturnValue(channelName);


		return channelMock;
	}

	describe('initialize', () => {
		it('initializes channel redirect listener', () => {
			const testChannelRedirect = new ChannelRedirect(mockCometD, mockServerConnection);
			testChannelRedirect.initialize(() => {});

			expect(mockServerConnection.getChannel).toHaveBeenCalledWith('/sn/meta/channel_redirect/cometDClientId')
		});

		xit('calls resubscribe if already initialized', () => {
			// getChannelListeners = jest.fn().mockImplementation(() => {
			// 	let arr:any = [
			// 		 new ChannelListener(mockChannel, mockServerConnection, null)
			// 	];
			// 	return arr; //[new ChannelListener(null, null, null)];
			// });
			const testChannelRedirect = new ChannelRedirect(mockCometD, mockServerConnection);

			// expect(channelSubscribe).toHaveBeenCalledTimes(0);
			// expect(subscribeToCometD).toHaveBeenCalledTimes(0);
			// expect(channelListenerSubscribe).toHaveBeenCalledTimes(0);

			// testChannelRedirect.initialize();
			// expect(channelListenerSubscribe).toHaveBeenCalledTimes(1);
			// expect(mockServerConnection.getChannel).toHaveBeenCalledTimes(1);
			// expect(subscribeToCometD).toHaveBeenCalledTimes(0);

			// testChannelRedirect.initialize();
			// expect(mockServerConnection.getChannel).toHaveBeenCalledTimes(2);
			// expect(channelListenerSubscribe).toHaveBeenCalledTimes(1);
			// expect(subscribeToCometD).toHaveBeenCalledTimes(1);
		});
		
		it('initializes again if new redirect channel', () => {
			let clientID = "firstClientId";
			const firstClientChannelName = "/sn/meta/channel_redirect/firstClientId";
			const secondClientChannelName = "/sn/meta/channel_redirect/secondClientId";

			const firstChannel = getMockChannel(firstClientChannelName);
			const secondChannel =  getMockChannel(secondClientChannelName); 

			const mockCometDWithDifferentClientIDs = mock(CometD);
			mockCometDWithDifferentClientIDs.getClientId.mockImplementation(() => {
				return clientID;
			})
			mockServerConnection = getMockServerConnection();
			mockServerConnection.getChannel.mockImplementation((channelName) => {
				return channelName === firstClientChannelName ? firstChannel : secondChannel;
			});

			const testChannelRedirect = new ChannelRedirect(mockCometDWithDifferentClientIDs, mockServerConnection);
			testChannelRedirect.initialize(() => {});
			expect(firstChannel.subscribe).toHaveBeenCalledTimes(1);
			expect(mockServerConnection.getChannel).toHaveBeenCalledWith(firstClientChannelName);

			clientID = "secondClientId";
			testChannelRedirect.initialize(() => {});
			expect(secondChannel.subscribe).toHaveBeenCalledTimes(1);
			expect(mockServerConnection.getChannel).toHaveBeenCalledWith(secondClientChannelName);
		})
	});


	// Callback for channel redirect message
	describe('_onAdvice', () => {
		it('triggers channel redirect event', () => {
			let channelResult:any = null;
			mockServerConnection = getMockServerConnection();
			const mockListener = getMockChannelListener();
			mockListener.setNewChannel.mockImplementation((channel) => {
				channelResult = channel;
			});
			const toChannel = getMockChannel("toChannel");//new Channel(mockServerConnection, null, 'toChannel', false);
			const fromChannel =  getMockChannel("fromChannel"); //new Channel(mockServerConnection, null, 'fromChannel', false);

			fromChannel.getChannelListeners.mockReturnValue([mockListener, mockListener]);

			mockServerConnection.getChannel.mockImplementation((channelName) => {
				return channelName === 'toChannel' ? toChannel : fromChannel;
			});

			const advice = {
				data : {
					fromChannel : 'fromChannel',
					toChannel : 'toChannel'
				}
			};

			testChannelRedirect = new ChannelRedirect(mockCometD, mockServerConnection);
			testChannelRedirect._onAdvice(advice);

			expect(mockServerConnection.getChannel).toHaveBeenCalledTimes(2);
			expect(mockServerConnection.getChannel).toHaveBeenLastCalledWith('toChannel');

			expect(fromChannel.getChannelListeners).toHaveBeenCalledTimes(1);
			expect(mockListener.setNewChannel).toHaveBeenCalledTimes(2);
			expect(mockListener.setNewChannel).toHaveBeenLastCalledWith(toChannel);
			expect(channelResult).toBe(toChannel);
		});
	});
});

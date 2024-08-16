import ChannelRedirect from '../amb.ChannelRedirect';
import EventManager from '../amb.EventManager';
import Channel from '../amb.Channel';
import ChannelListener from '../amb.ChannelListener';

jest.mock('../amb.EventManager');
const events = {
	CONNECTION_INITIALIZED: 'connection.initialized',
	CONNECTION_OPENED: 'connection.opened',
	CONNECTION_CLOSED: 'connection.closed',
	CONNECTION_BROKEN: 'connection.broken',
	SESSION_LOGGED_IN: 'session.logged.in',
	SESSION_LOGGED_OUT: 'session.logged.out',
	SESSION_INVALIDATED: 'session.invalidated'
};

const publish = jest.fn();
let channelListenerSubscribe;
const unsubscribe = jest.fn();

EventManager.mockImplementation(() => {
	return {
		publish: publish,
		subscribe: channelListenerSubscribe,
		unsubscribe: unsubscribe,
		getEvents: jest.fn().mockImplementation(() => {
			return events;
		})
	}
});

jest.mock('../amb.ChannelListener');
const setNewChannel = jest.fn();
ChannelListener.mockImplementation(() => {
	return {
		setNewChannel : setNewChannel.mockImplementation((newChannel) => {}),
		subscribe : channelListenerSubscribe
	}
});

let getChannelListeners;


const channelSubscribe = jest.fn();
const subscribeToCometD = jest.fn();
jest.mock('../amb.Channel');
Channel.mockImplementation((cometD, channelName) => {
	return {
		getChannelListeners : getChannelListeners,
		getName : jest.fn().mockImplementation(() => {
			return channelName;
		}),
		subscribe : channelSubscribe,
		subscribeToCometD : subscribeToCometD
	}
});

let testChannelRedirect;
describe('ChannelRedirect', () => {
	let mockChannel = {};
	let mockServerConnection = {};
	let mockCometD = {
		getClientId : jest.fn().mockImplementation(() => {return 'cometDClientId'})
	};

	beforeEach(() => {
		mockChannel = {
			subscribe : jest.fn(),
			unsubscribe : jest.fn(),
			publish : jest.fn(),
			getStatus : jest.fn(),
			getClientId : jest.fn().mockImplementation(() => {return 'cometDClientId'})
		};
		const channels = {};
		mockServerConnection = {
			subscribeToEvent : jest.fn(),
			unsubscribeFromEvent : jest.fn(),
			getEvents : jest.fn().mockImplementation(() => {
				return {
					CONNECTION_OPENED: true,
					CHANNEL_REDIRECT: true
				}
			}),
			getChannel : jest.fn().mockImplementation((channelName) => {
				if (channelName in channels)
					return channels[channelName];

				const channel = new Channel(mockCometD, channelName, false);
				channels[channelName] = channel;
				return channel;
			}),
			removeChannel : jest.fn().mockImplementation((channelName) => {
				delete channels[channelName];
			}),
			_onChannelRedirectSubscriptionComplete : jest.fn()
		};

		channelListenerSubscribe = jest.fn();
	});

	describe('initialize', () => {
		it('initializes channel redirect listener', () => {
			const testChannelRedirect = new ChannelRedirect(mockCometD, mockServerConnection);
			testChannelRedirect.initialize();

			expect(mockServerConnection.getChannel).toHaveBeenCalledWith('/sn/meta/channel_redirect/cometDClientId')
		});

		it('calls resubscribe if already initialized', () => {
			getChannelListeners = jest.fn().mockImplementation(() => {
				return [new ChannelListener(null, null, null)];
			});
			const testChannelRedirect = new ChannelRedirect(mockCometD, mockServerConnection);

			expect(channelSubscribe).toHaveBeenCalledTimes(0);
			expect(subscribeToCometD).toHaveBeenCalledTimes(0);
			expect(channelListenerSubscribe).toHaveBeenCalledTimes(0);

			testChannelRedirect.initialize();
			expect(channelListenerSubscribe).toHaveBeenCalledTimes(1);
			expect(mockServerConnection.getChannel).toHaveBeenCalledTimes(1);
			expect(subscribeToCometD).toHaveBeenCalledTimes(0);

			testChannelRedirect.initialize();
			expect(mockServerConnection.getChannel).toHaveBeenCalledTimes(2);
			expect(channelListenerSubscribe).toHaveBeenCalledTimes(1);
			expect(subscribeToCometD).toHaveBeenCalledTimes(1);
		});
		
		it('initializes again if new redirect channel', () => {
			let clientID = "firstClientId";
			let mockCometDWithDifferentClientIDs = {
				getClientId : jest.fn().mockImplementation(() => {return clientID})
			};

			const testChannelRedirect = new ChannelRedirect(mockCometDWithDifferentClientIDs, mockServerConnection);
			testChannelRedirect.initialize();
			expect(channelListenerSubscribe).toHaveBeenCalledTimes(1);
			expect(mockServerConnection.getChannel).toHaveBeenCalledWith('/sn/meta/channel_redirect/firstClientId')

			clientID = "secondClientId";
			testChannelRedirect.initialize();
			expect(channelListenerSubscribe).toHaveBeenCalledTimes(2);
			expect(mockServerConnection.getChannel).toHaveBeenCalledWith('/sn/meta/channel_redirect/secondClientId')
		})
	});


	// Callback for channel redirect message
	describe('_onAdvice', () => {
		it('triggers channel redirect event', () => {

			getChannelListeners = jest.fn().mockImplementation(() => {
				return [new ChannelListener(null, null, null), new ChannelListener(null, null, null)]
			});

			const toChannel = new Channel(null, 'toChannel', null);
			const fromChannel =  new Channel(null, 'fromChannel', null);

			mockServerConnection.getChannel = jest.fn().mockImplementation((channelName) => {
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

			expect(getChannelListeners).toHaveBeenCalledTimes(1);
			expect(setNewChannel).toHaveBeenCalledTimes(2);
			expect(setNewChannel).toHaveBeenLastCalledWith(toChannel);

		});
	});
});

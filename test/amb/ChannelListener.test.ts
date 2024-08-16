import ChannelListener from '../amb.ChannelListener';

describe('ChannelListener', () => {
	let mockChannel = {};
	let mockServerConnection = {};
	let mockChannelRedirect = {};

	beforeEach(() => {
		mockChannel = {
			subscribe : jest.fn(),
			unsubscribe : jest.fn(),
			publish : jest.fn(),
			getStatus : jest.fn(),
			getName : jest.fn()
		};

		mockChannelRedirect = {
			getEvents : jest.fn().mockImplementation(() => {
				return {
					CHANNEL_REDIRECT: true
				}
			}),
			subscribeToEvent : jest.fn(),
			unsubscribeToEvent : jest.fn(),
		};

		mockServerConnection = {
			subscribeToEvent : jest.fn(),
			unsubscribeFromEvent : jest.fn(),
			getEvents : jest.fn().mockImplementation(() => {
				return {
					CONNECTION_OPENED: true,
					CHANNEL_REDIRECT: true
				}
			})
		}
	});

	it('returns the channel listener id on subscribe', () => {
		mockChannel.subscribe.mockImplementation(() => {return 1});

		const testChannelListener = new ChannelListener(mockChannel, mockServerConnection, null);
		testChannelListener.subscribe();
		expect(testChannelListener.getID()).toBe(1);
	});

	it('returns the channel listener name', () => {
		mockChannel.getName.mockImplementation(() => {return 'test channel'});

		const testChannelListener = new ChannelListener(mockChannel, mockServerConnection, null);
		expect(testChannelListener.getName()).toBe('test channel');
	});

	it('returns the subscription callback', () => {
		mockChannel.subscribe.mockImplementation(() => {return 1});

		const subCallback = function() {
			return 'sub callback';
		};

		const testChannelListener = new ChannelListener(mockChannel, mockServerConnection, subCallback);
		expect(testChannelListener.getSubscriptionCallback()).toBe(subCallback)
	});

	it('publishes to a channel', () => {
		mockChannel.subscribe.mockImplementation(() => {return 1});

		const testChannelListener = new ChannelListener(mockChannel, mockServerConnection, null);
		testChannelListener.publish('a message');
		expect(mockChannel.publish).toHaveBeenCalledWith('a message');
	});

	describe('subscribe', () => {
		it('subscribes with message callback', () => {
			mockChannel.subscribe.mockImplementation(() => {return 1});

			const messageCallback = function() {
				return 'message callback';
			};

			const testChannelListener = new ChannelListener(mockChannel, mockServerConnection, null);
			expect(testChannelListener.subscribe(messageCallback).getID()).toBe(1);
			expect(testChannelListener.getCallback()).toBe(messageCallback);
		});
	});

	describe('resubscribe', () => {
		it('resubscribes calls subscribe', () => {
			mockChannel.subscribe.mockImplementation(() => {return 1});

			const messageCallback = function() {
				return 'message callback';
			};

			const testChannelListener = new ChannelListener(mockChannel, mockServerConnection, null);
			testChannelListener.subscribe(messageCallback);
			testChannelListener.resubscribe();
			expect(mockChannel.subscribe).toHaveBeenCalledTimes(2);
		});
	});


	describe('unsubscribe', () => {
		it('unregisters listener from channel with channel redirect', () => {
			mockChannel.subscribe.mockImplementation(() => {return 1});

			const messageCallback = function() {
				return 'message callback';
			};

			const testChannelListener = new ChannelListener(mockChannel, mockServerConnection, mockChannelRedirect);
			testChannelListener.subscribe(messageCallback);
			testChannelListener.unsubscribe();
			expect(mockChannel.unsubscribe).toHaveBeenCalledWith(testChannelListener);
		});

		it('unregisters listener from channel without channel redirect', () => {
			mockChannel.subscribe.mockImplementation(() => {return 1});

			const messageCallback = function() {
				return 'message callback';
			};

			const testChannelListener = new ChannelListener(mockChannel, mockServerConnection);
			testChannelListener.subscribe(messageCallback);
			testChannelListener.unsubscribe();
			expect(mockChannel.unsubscribe).toHaveBeenCalledWith(testChannelListener);
		});
	});
});
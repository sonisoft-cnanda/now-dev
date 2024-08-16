import EventManager from "../amb.EventManager";

describe('EventManager', () => {
	const events = {
		CONNECTION_INITIALIZED: 'connection.initialized',
		CONNECTION_OPENED: 'connection.opened',
		CONNECTION_CLOSED: 'connection.closed',
		CONNECTION_BROKEN: 'connection.broken',
		SESSION_LOGGED_IN: 'session.logged.in',
		SESSION_LOGGED_OUT: 'session.logged.out',
		SESSION_INVALIDATED: 'session.invalidated'
	};

	const callback1 = jest.fn();
	const callback2 = jest.fn();

	describe('subscribe', () => {
		it('registers callbacks for an event', () => {
			const testEventManager = new EventManager(events);
			expect(testEventManager.subscribe(events.CONNECTION_INITIALIZED, callback1)).toBe(0);
			expect(testEventManager.subscribe(events.CONNECTION_INITIALIZED, callback2)).toBe(1);
			expect(testEventManager._getSubscriptions(events.CONNECTION_INITIALIZED,).length).toBe(2);
		});
	});

	describe('unsubscribe', () => {
		it('removes a callback for an event', () => {
			const testEventManager = new EventManager(events);
			expect(testEventManager.subscribe(events.CONNECTION_INITIALIZED, callback1)).toBe(0);
			expect(testEventManager.subscribe(events.CONNECTION_INITIALIZED, callback2)).toBe(1);

			testEventManager.unsubscribe(1);

			expect(testEventManager._getSubscriptions(events.CONNECTION_INITIALIZED,).length).toBe(1);
		});
	});

	describe('publish', () => {
		it('calls registered callback for event', () => {
			const testEventManager = new EventManager(events);
			expect(testEventManager.subscribe(events.CONNECTION_INITIALIZED, callback1)).toBe(0);
			expect(testEventManager.subscribe(events.CONNECTION_OPENED, callback2)).toBe(1);

			testEventManager.publish(events.CONNECTION_INITIALIZED, ['success']);

			expect(callback1).toHaveBeenCalledWith('success');
			expect(callback2).toHaveBeenCalledTimes(0);
		});
	});

	describe('getEvents', () => {
		it('returns events', () => {
			const testEventManager = new EventManager(events);
			expect(testEventManager.getEvents()).toEqual(events);
		});
	});
});
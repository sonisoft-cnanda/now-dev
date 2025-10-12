/**
 * Unit tests for EventManager
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EventManager } from '../../../src/sn/amb/EventManager';

// Mock Logger
jest.mock('../../../src/util/Logger', () => ({
    Logger: jest.fn().mockImplementation(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

describe('EventManager - Unit Tests', () => {
    let eventManager: EventManager;
    const mockEvents = {
        CONNECTION_OPENED: 'connection.opened',
        CONNECTION_CLOSED: 'connection.closed',
        MESSAGE_RECEIVED: 'message.received'
    };

    beforeEach(() => {
        eventManager = new EventManager(mockEvents);
    });

    describe('Constructor', () => {
        it('should create instance with events', () => {
            expect(eventManager).toBeInstanceOf(EventManager);
        });

        it('should store events', () => {
            expect(eventManager.getEvents()).toBe(mockEvents);
        });

        it('should initialize with empty subscriptions', () => {
            expect((eventManager as unknown as {_subscriptions: unknown[]})._subscriptions).toEqual([]);
        });

        it('should initialize ID counter at 0', () => {
            expect((eventManager as unknown as {_idCounter: number})._idCounter).toBe(0);
        });
    });

    describe('getEvents', () => {
        it('should return events object', () => {
            expect(eventManager.getEvents()).toEqual(mockEvents);
        });

        it('should return same object reference', () => {
            const events1 = eventManager.getEvents();
            const events2 = eventManager.getEvents();
            
            expect(events1).toBe(events2);
        });
    });

    describe('subscribe', () => {
        it('should subscribe to event with callback', () => {
            const callback = jest.fn();
            const id = eventManager.subscribe('connection.opened', callback);
            
            expect(id).toBe(0);
            expect(typeof id).toBe('number');
        });

        it('should increment ID for each subscription', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            const callback3 = jest.fn();
            
            const id1 = eventManager.subscribe('event1', callback1);
            const id2 = eventManager.subscribe('event2', callback2);
            const id3 = eventManager.subscribe('event3', callback3);
            
            expect(id1).toBe(0);
            expect(id2).toBe(1);
            expect(id3).toBe(2);
        });

        it('should allow multiple subscriptions to same event', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            
            eventManager.subscribe('connection.opened', callback1);
            eventManager.subscribe('connection.opened', callback2);
            
            const subscriptions = (eventManager as unknown as {_subscriptions: unknown[]})._subscriptions;
            expect(subscriptions).toHaveLength(2);
        });

        it('should store event, callback, and ID', () => {
            const callback = jest.fn();
            const id = eventManager.subscribe('test.event', callback);
            
            const subscriptions = (eventManager as unknown as {_subscriptions: {event: string, callback: Function, id: number}[]})._subscriptions;
            expect(subscriptions[0]).toEqual({
                event: 'test.event',
                callback: callback,
                id: id
            });
        });
    });

    describe('unsubscribe', () => {
        it('should remove subscription by ID', () => {
            const callback = jest.fn();
            const id = eventManager.subscribe('event', callback);
            
            eventManager.unsubscribe(id);
            
            const subscriptions = (eventManager as unknown as {_subscriptions: unknown[]})._subscriptions;
            expect(subscriptions).toHaveLength(0);
        });

        it('should only remove specified subscription', () => {
            const id1 = eventManager.subscribe('event1', jest.fn());
            const id2 = eventManager.subscribe('event2', jest.fn());
            const id3 = eventManager.subscribe('event3', jest.fn());
            
            eventManager.unsubscribe(id2);
            
            const subscriptions = (eventManager as unknown as {_subscriptions: unknown[]})._subscriptions;
            expect(subscriptions).toHaveLength(2);
        });

        it('should handle unsubscribe of non-existent ID', () => {
            eventManager.subscribe('event', jest.fn());
            
            expect(() => eventManager.unsubscribe(999)).not.toThrow();
        });

        it('should handle unsubscribe from empty manager', () => {
            expect(() => eventManager.unsubscribe(0)).not.toThrow();
        });
    });

    describe('publish', () => {
        it('should call all subscribed callbacks for event', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            
            eventManager.subscribe('test.event', callback1);
            eventManager.subscribe('test.event', callback2);
            
            eventManager.publish('test.event');
            
            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });

        it('should pass arguments to callbacks', () => {
            const callback = jest.fn();
            eventManager.subscribe('test.event', callback);
            
            const args = [{ data: 'test' }, 123, 'string'];
            eventManager.publish('test.event', args);
            
            expect(callback).toHaveBeenCalledWith({ data: 'test' }, 123, 'string');
        });

        it('should not call callbacks for different events', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            
            eventManager.subscribe('event1', callback1);
            eventManager.subscribe('event2', callback2);
            
            eventManager.publish('event1');
            
            expect(callback1).toHaveBeenCalled();
            expect(callback2).not.toHaveBeenCalled();
        });

        it('should handle publishing event with no subscribers', () => {
            expect(() => eventManager.publish('unknown.event')).not.toThrow();
        });

        it('should handle publish with no arguments', () => {
            const callback = jest.fn();
            eventManager.subscribe('event', callback);
            
            eventManager.publish('event');
            
            expect(callback).toHaveBeenCalled();
        });

        it('should call callbacks in subscription order', () => {
            const callOrder: number[] = [];
            const callback1 = jest.fn(() => callOrder.push(1));
            const callback2 = jest.fn(() => callOrder.push(2));
            const callback3 = jest.fn(() => callOrder.push(3));
            
            eventManager.subscribe('event', callback1);
            eventManager.subscribe('event', callback2);
            eventManager.subscribe('event', callback3);
            
            eventManager.publish('event');
            
            expect(callOrder).toEqual([1, 2, 3]);
        });
    });

    describe('Complex scenarios', () => {
        it('should handle subscribe, publish, unsubscribe, publish cycle', () => {
            const callback = jest.fn();
            const id = eventManager.subscribe('event', callback);
            
            eventManager.publish('event');
            expect(callback).toHaveBeenCalledTimes(1);
            
            eventManager.unsubscribe(id);
            eventManager.publish('event');
            expect(callback).toHaveBeenCalledTimes(1); // Not called again
        });

        it('should handle multiple events and subscriptions', () => {
            const event1Callback1 = jest.fn();
            const event1Callback2 = jest.fn();
            const event2Callback = jest.fn();
            
            eventManager.subscribe('event1', event1Callback1);
            eventManager.subscribe('event1', event1Callback2);
            eventManager.subscribe('event2', event2Callback);
            
            eventManager.publish('event1');
            
            expect(event1Callback1).toHaveBeenCalledTimes(1);
            expect(event1Callback2).toHaveBeenCalledTimes(1);
            expect(event2Callback).not.toHaveBeenCalled();
        });

        it('should handle rapid subscribe/unsubscribe', () => {
            const ids: number[] = [];
            
            for (let i = 0; i < 10; i++) {
                ids.push(eventManager.subscribe('event', jest.fn()));
            }
            
            for (let i = 0; i < 5; i++) {
                eventManager.unsubscribe(ids[i]);
            }
            
            const subscriptions = (eventManager as unknown as {_subscriptions: unknown[]})._subscriptions;
            expect(subscriptions).toHaveLength(5);
        });
    });
});


/**
 * Unit tests for ChannelListener
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ChannelListener } from '../../../src/sn/amb/ChannelListener';
import { Channel } from '../../../src/sn/amb/Channel';
import { ServerConnection } from '../../../src/sn/amb/ServerConnection';

// Mock Logger
jest.mock('../../../src/util/Logger', () => ({
    Logger: jest.fn().mockImplementation(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

describe('ChannelListener - Unit Tests', () => {
    let mockChannel: {
        subscribe: jest.Mock;
        unsubscribe: jest.Mock;
        publish: jest.Mock;
        getName: jest.Mock;
    };
    let mockServerConnection: {
        getSubscriptionCommandSender: jest.Mock;
    };
    let channelListener: ChannelListener;
    let subscriptionCallback: jest.Mock;

    beforeEach(() => {
        // Create mock channel
        mockChannel = {
            subscribe: jest.fn().mockReturnValue(1),
            unsubscribe: jest.fn(),
            publish: jest.fn(),
            getName: jest.fn().mockReturnValue('test-channel')
        };

        // Create mock server connection
        mockServerConnection = {
            getSubscriptionCommandSender: jest.fn().mockReturnValue(null)
        };

        // Create subscription callback
        subscriptionCallback = jest.fn();

        // Create channel listener
        channelListener = new ChannelListener(
            mockChannel as unknown as Channel,
            mockServerConnection as unknown as ServerConnection,
            subscriptionCallback
        );
    });

    describe('Constructor', () => {
        it('should create instance with channel and connection', () => {
            expect(channelListener).toBeInstanceOf(ChannelListener);
        });

        it('should store channel reference', () => {
            expect((channelListener as unknown as {_channel: unknown})._channel).toBe(mockChannel);
        });

        it('should store server connection reference', () => {
            expect((channelListener as unknown as {_serverConnection: unknown})._serverConnection).toBe(mockServerConnection);
        });

        it('should store subscription callback', () => {
            expect((channelListener as unknown as {_subscriptionCallback: unknown})._subscriptionCallback).toBe(subscriptionCallback);
        });

        it('should initialize message callback as null', () => {
            expect(channelListener.getCallback()).toBeNull();
        });

        it('should initialize ID as -1', () => {
            expect(channelListener.getID()).toBe(-1);
        });

        it('should accept null subscription callback', () => {
            const listenerWithoutCallback = new ChannelListener(
                mockChannel as unknown as Channel,
                mockServerConnection as unknown as ServerConnection,
                null
            );
            
            expect(listenerWithoutCallback.getSubscriptionCallback()).toBeNull();
        });
    });

    describe('getCallback', () => {
        it('should return message callback', () => {
            const callback = jest.fn();
            channelListener.subscribe(callback);
            
            expect(channelListener.getCallback()).toBe(callback);
        });

        it('should return null before subscription', () => {
            expect(channelListener.getCallback()).toBeNull();
        });
    });

    describe('getSubscriptionCallback', () => {
        it('should return subscription callback', () => {
            expect(channelListener.getSubscriptionCallback()).toBe(subscriptionCallback);
        });

        it('should return null when no subscription callback provided', () => {
            const listener = new ChannelListener(
                mockChannel as unknown as Channel,
                mockServerConnection as unknown as ServerConnection,
                null
            );
            
            expect(listener.getSubscriptionCallback()).toBeNull();
        });
    });

    describe('getID', () => {
        it('should return -1 before subscription', () => {
            expect(channelListener.getID()).toBe(-1);
        });

        it('should return ID after subscription', () => {
            const callback = jest.fn();
            channelListener.subscribe(callback);
            
            expect(channelListener.getID()).toBe(1);
        });
    });

    describe('subscribe', () => {
        it('should subscribe with callback', () => {
            const callback = jest.fn();
            const result = channelListener.subscribe(callback);
            
            expect(result).toBe(channelListener);
            expect(mockChannel.subscribe).toHaveBeenCalledWith(channelListener);
        });

        it('should store message callback', () => {
            const callback = jest.fn();
            channelListener.subscribe(callback);
            
            expect(channelListener.getCallback()).toBe(callback);
        });

        it('should update ID from channel subscription', () => {
            mockChannel.subscribe.mockReturnValue(42);
            const callback = jest.fn();
            
            channelListener.subscribe(callback);
            
            expect(channelListener.getID()).toBe(42);
        });

        it('should return itself for chaining', () => {
            const callback = jest.fn();
            const result = channelListener.subscribe(callback);
            
            expect(result).toBe(channelListener);
        });
    });

    describe('resubscribe', () => {
        it('should resubscribe with same callback', () => {
            const callback = jest.fn();
            channelListener.subscribe(callback);
            
            mockChannel.subscribe.mockClear();
            channelListener.resubscribe();
            
            expect(mockChannel.subscribe).toHaveBeenCalledWith(channelListener);
        });

        it('should work when callback is null', () => {
            expect(() => channelListener.resubscribe()).not.toThrow();
        });

        it('should return itself for chaining', () => {
            const callback = jest.fn();
            channelListener.subscribe(callback);
            const result = channelListener.resubscribe();
            
            expect(result).toBe(channelListener);
        });
    });

    describe('unsubscribe', () => {
        it('should unsubscribe from channel', () => {
            channelListener.unsubscribe();
            
            expect(mockChannel.unsubscribe).toHaveBeenCalledWith(channelListener);
        });

        it('should return itself for chaining', () => {
            const result = channelListener.unsubscribe();
            
            expect(result).toBe(channelListener);
        });

        it('should work with optional listener parameter', () => {
            const optionalCallback = jest.fn();
            
            expect(() => channelListener.unsubscribe(optionalCallback)).not.toThrow();
            expect(mockChannel.unsubscribe).toHaveBeenCalledWith(channelListener);
        });
    });

    describe('publish', () => {
        it('should publish message to channel', () => {
            const message = { data: 'test message' };
            
            channelListener.publish(message);
            
            expect(mockChannel.publish).toHaveBeenCalledWith(message);
        });

        it('should handle different message types', () => {
            const messages = [
                { type: 'update' },
                { type: 'delete', id: '123' },
                'string message',
                null
            ];
            
            messages.forEach(msg => {
                channelListener.publish(msg);
            });
            
            expect(mockChannel.publish).toHaveBeenCalledTimes(4);
        });
    });

    describe('getName', () => {
        it('should return channel name', () => {
            expect(channelListener.getName()).toBe('test-channel');
        });

        it('should delegate to channel', () => {
            channelListener.getName();
            
            expect(mockChannel.getName).toHaveBeenCalled();
        });
    });

    describe('setNewChannel', () => {
        it('should unsubscribe from old channel', () => {
            const callback = jest.fn();
            channelListener.subscribe(callback);
            
            const newMockChannel = {
                subscribe: jest.fn().mockReturnValue(2),
                unsubscribe: jest.fn(),
                publish: jest.fn(),
                getName: jest.fn().mockReturnValue('new-channel')
            };
            
            channelListener.setNewChannel(newMockChannel as unknown as Channel);
            
            expect(mockChannel.unsubscribe).toHaveBeenCalledWith(channelListener);
        });

        it('should subscribe to new channel', () => {
            const callback = jest.fn();
            channelListener.subscribe(callback);
            
            const newMockChannel = {
                subscribe: jest.fn().mockReturnValue(2),
                unsubscribe: jest.fn(),
                publish: jest.fn(),
                getName: jest.fn().mockReturnValue('new-channel')
            };
            
            channelListener.setNewChannel(newMockChannel as unknown as Channel);
            
            expect(newMockChannel.subscribe).toHaveBeenCalled();
        });

        it('should preserve message callback when changing channels', () => {
            const callback = jest.fn();
            channelListener.subscribe(callback);
            
            const newMockChannel = {
                subscribe: jest.fn().mockReturnValue(2),
                unsubscribe: jest.fn(),
                publish: jest.fn(),
                getName: jest.fn().mockReturnValue('new-channel')
            };
            
            channelListener.setNewChannel(newMockChannel as unknown as Channel);
            
            // Callback should still be accessible
            expect(channelListener.getCallback()).toBe(callback);
        });
    });

    describe('Method chaining', () => {
        it('should support subscribe-publish chain', () => {
            const callback = jest.fn();
            
            channelListener
                .subscribe(callback)
                .publish({ data: 'test' });
            
            expect(mockChannel.subscribe).toHaveBeenCalled();
            expect(mockChannel.publish).toHaveBeenCalled();
        });

        it('should support subscribe-unsubscribe chain', () => {
            const callback = jest.fn();
            
            channelListener
                .subscribe(callback)
                .unsubscribe();
            
            expect(mockChannel.subscribe).toHaveBeenCalled();
            expect(mockChannel.unsubscribe).toHaveBeenCalled();
        });
    });
});

/**
 * Unit tests for Channel class
 * Uses Jest mocks - properly typed
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Channel } from '../../../src/sn/amb/Channel';
import { ServerConnection } from '../../../src/sn/amb/ServerConnection';
import { ChannelListener } from '../../../src/sn/amb/ChannelListener';

// Mock Logger
jest.mock('../../../src/util/Logger', () => ({
    Logger: jest.fn().mockImplementation(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        addErrorMessage: jest.fn(),
        addWarnMessage: jest.fn()
    }))
}));

type MockCometD = {
    subscribe: jest.Mock;
    unsubscribe: jest.Mock;
    publish: jest.Mock;
    getStatus: jest.Mock;
    batch: jest.Mock;
};

type MockListener = {
    getCallback: jest.Mock;
    getSubscriptionCallback: jest.Mock;
    getID: jest.Mock;
    resubscribe: jest.Mock;
};

describe('Channel - Unit Tests', () => {
    let mockCometD: MockCometD;
    let mockServerConnection: {
        getSubscriptionCommandSender: jest.Mock;
        getCometD: jest.Mock;
        isConnected: jest.Mock;
    };
    let channel: Channel;
    const channelName = 'testChannelName';

    beforeEach(() => {
        // Create mock CometD
        mockCometD = {
            subscribe: jest.fn().mockReturnValue({ id: 'sub-123' }),
            unsubscribe: jest.fn(),
            publish: jest.fn(),
            getStatus: jest.fn().mockReturnValue('connected'),
            batch: jest.fn((callback: () => void) => callback())
        };

        // Create mock ServerConnection
        mockServerConnection = {
            getSubscriptionCommandSender: jest.fn().mockReturnValue(null),
            getCometD: jest.fn().mockReturnValue(mockCometD),
            isConnected: jest.fn().mockReturnValue(true)
        };

        // Create channel instance
        channel = new Channel(
            mockServerConnection as unknown as ServerConnection,
            mockCometD,
            channelName,
            true
        );
    });

    function createMockListener(id: number = 1): MockListener {
        return {
            getCallback: jest.fn().mockReturnValue(() => 'listener callback'),
            getSubscriptionCallback: jest.fn().mockReturnValue(null),
            getID: jest.fn().mockReturnValue(id),
            resubscribe: jest.fn()
        };
    }

    describe('Constructor', () => {
        it('should create channel with name', () => {
            expect(channel).toBeInstanceOf(Channel);
            expect(channel.getName()).toBe(channelName);
        });

        it('should store server connection', () => {
            expect(channel.getServerConnection()).toBe(mockServerConnection);
        });

        it('should store cometd instance', () => {
            expect((channel as unknown as {_cometd: unknown})._cometd).toBe(mockCometD);
        });

        it('should initialize with initialized flag', () => {
            expect((channel as unknown as {_initialized: boolean})._initialized).toBe(true);
        });

        it('should accept custom subscribe options callback', () => {
            const customCallback = () => ({ custom: 'options' });
            const customChannel = new Channel(
                mockServerConnection as unknown as ServerConnection,
                mockCometD,
                'custom-channel',
                true,
                customCallback
            );
            expect(typeof (customChannel as unknown as {_subscribeOptionsCallback: unknown})._subscribeOptionsCallback).toBe('function');
        });
    });

    describe('getName', () => {
        it('should return channel name', () => {
            expect(channel.getName()).toBe(channelName);
        });

        it('should return correct name for different channels', () => {
            const channel1 = new Channel(mockServerConnection as unknown as ServerConnection, mockCometD, 'channel1', true);
            const channel2 = new Channel(mockServerConnection as unknown as ServerConnection, mockCometD, 'channel2', true);
            
            expect(channel1.getName()).toBe('channel1');
            expect(channel2.getName()).toBe('channel2');
        });
    });

    describe('getServerConnection', () => {
        it('should return server connection', () => {
            expect(channel.getServerConnection()).toBe(mockServerConnection);
        });
    });

    describe('subscribe', () => {
        it('should subscribe with channel listener', () => {
            const mockListener = createMockListener();
            
            const listenerId = channel.subscribe(mockListener as unknown as ChannelListener);
            
            expect(listenerId).toBe(1);
            expect(mockCometD.subscribe).toHaveBeenCalledTimes(1);
        });

        it('should call cometd subscribe with channel name', () => {
            const mockListener = createMockListener();
            
            channel.subscribe(mockListener as unknown as ChannelListener);
            
            expect(mockCometD.subscribe).toHaveBeenCalledWith(
                channelName,
                expect.anything(),
                expect.any(Function),
                expect.anything()
            );
        });

        it('should return null when listener has no callback', () => {
            const mockListener = createMockListener();
            mockListener.getCallback.mockReturnValue(null);
            
            const listenerId = channel.subscribe(mockListener as unknown as ChannelListener);
            
            expect(listenerId).toBeNull();
            expect(mockCometD.subscribe).not.toHaveBeenCalled();
        });

        it('should not subscribe twice with same listener', () => {
            const mockListener = createMockListener();
            
            const listenerId1 = channel.subscribe(mockListener as unknown as ChannelListener);
            const listenerId2 = channel.subscribe(mockListener as unknown as ChannelListener);
            
            expect(listenerId1).toBe(listenerId2);
            expect(mockCometD.subscribe).toHaveBeenCalledTimes(1);
        });

        it('should call subscription callback immediately if response exists', () => {
            const subscriptionCallback = jest.fn();
            const mockListener = createMockListener();
            mockListener.getSubscriptionCallback.mockReturnValue(subscriptionCallback);
            
            // Set existing subscription response
            (channel as unknown as {subscriptionCallbackResponse: unknown}).subscriptionCallbackResponse = { data: 'existing' };
            
            channel.subscribe(mockListener as unknown as ChannelListener);
            
            expect(subscriptionCallback).toHaveBeenCalledWith({ data: 'existing' });
        });

        it('should queue subscription callback when no response yet', () => {
            const subscriptionCallback = jest.fn();
            const mockListener = createMockListener();
            mockListener.getSubscriptionCallback.mockReturnValue(subscriptionCallback);
            
            channel.subscribe(mockListener as unknown as ChannelListener);
            
            expect((channel as unknown as {listenerCallbackQueue: unknown[]}).listenerCallbackQueue).toContain(subscriptionCallback);
        });

        it('should not subscribe to cometd when not initialized', () => {
            const uninitializedChannel = new Channel(
                mockServerConnection as unknown as ServerConnection,
                mockCometD,
                'uninitialized',
                false
            );
            const mockListener = createMockListener();
            
            uninitializedChannel.subscribe(mockListener as unknown as ChannelListener);
            
            expect(mockCometD.subscribe).not.toHaveBeenCalled();
        });

        it('should send subscribe options when callback returns non-empty object', () => {
            const subscribeOptionsCallback = () => ({ option1: 'value1' });
            const channelWithOptions = new Channel(
                mockServerConnection as unknown as ServerConnection,
                mockCometD,
                'options-channel',
                true,
                subscribeOptionsCallback
            );
            const mockListener = createMockListener();
            
            channelWithOptions.subscribe(mockListener as unknown as ChannelListener);
            
            const callArgs = mockCometD.subscribe.mock.calls[0];
            expect(callArgs[3]).toEqual({ subscribeOptions: { option1: 'value1' } });
        });

        it('should not send subscribe options when callback returns empty object', () => {
            const subscribeOptionsCallback = () => ({});
            const channelWithEmptyOptions = new Channel(
                mockServerConnection as unknown as ServerConnection,
                mockCometD,
                'empty-options',
                true,
                subscribeOptionsCallback
            );
            const mockListener = createMockListener();
            
            channelWithEmptyOptions.subscribe(mockListener as unknown as ChannelListener);
            
            const callArgs = mockCometD.subscribe.mock.calls[0];
            expect(callArgs[3]).toBeNull();
        });

        it('should increment ID for each new listener', () => {
            const listener1 = createMockListener(1);
            const listener2 = createMockListener(2);
            
            // Force different listeners
            listener1.getCallback.mockReturnValue(() => 'cb1');
            listener2.getCallback.mockReturnValue(() => 'cb2');
            
            const id1 = channel.subscribe(listener1 as unknown as ChannelListener);
            const id2 = channel.subscribe(listener2 as unknown as ChannelListener);
            
            expect(id1).toBe(1);
            expect(id2).toBe(2);
        });
    });

    describe('resubscribe', () => {
        it('should reset subscription', () => {
            (channel as unknown as {subscription: unknown}).subscription = { id: 'old-sub' };
            
            channel.resubscribe();
            
            expect((channel as unknown as {subscription: unknown}).subscription).toBeNull();
        });

        it('should call resubscribe on all listeners', () => {
            const mockListener1 = createMockListener(1);
            const mockListener2 = createMockListener(2);
            
            mockListener1.getCallback.mockReturnValue(() => 'cb1');
            mockListener2.getCallback.mockReturnValue(() => 'cb2');
            
            channel.subscribe(mockListener1 as unknown as ChannelListener);
            channel.subscribe(mockListener2 as unknown as ChannelListener);
            
            channel.resubscribe();
            
            expect(mockListener1.resubscribe).toHaveBeenCalledTimes(1);
            expect(mockListener2.resubscribe).toHaveBeenCalledTimes(1);
        });
    });

    describe('unsubscribe', () => {
        it('should unsubscribe listener', () => {
            const mockListener = createMockListener();
            
            channel.subscribe(mockListener as unknown as ChannelListener);
            channel.unsubscribe(mockListener as unknown as ChannelListener);
            
            expect((channel as unknown as {listeners: unknown[]}).listeners).toHaveLength(0);
        });

        it('should call cometd unsubscribe when last listener removed', () => {
            const mockListener = createMockListener();
            (channel as unknown as {subscription: unknown}).subscription = { id: 'sub-123' };
            
            channel.subscribe(mockListener as unknown as ChannelListener);
            channel.unsubscribe(mockListener as unknown as ChannelListener);
            
            expect(mockCometD.unsubscribe).toHaveBeenCalledWith({ id: 'sub-123' });
        });

        it('should not call cometd unsubscribe when other listeners remain', () => {
            const mockListener1 = createMockListener(1);
            const mockListener2 = createMockListener(2);
            
            mockListener1.getCallback.mockReturnValue(() => 'cb1');
            mockListener2.getCallback.mockReturnValue(() => 'cb2');
            
            (channel as unknown as {subscription: unknown}).subscription = { id: 'sub-123' };
            
            channel.subscribe(mockListener1 as unknown as ChannelListener);
            channel.subscribe(mockListener2 as unknown as ChannelListener);
            
            channel.unsubscribe(mockListener1 as unknown as ChannelListener);
            
            expect(mockCometD.unsubscribe).not.toHaveBeenCalled();
            expect((channel as unknown as {listeners: unknown[]}).listeners).toHaveLength(1);
        });

        it('should handle unsubscribe with null listener', () => {
            expect(() => channel.unsubscribe(null as unknown as ChannelListener)).not.toThrow();
        });
    });

    describe('publish', () => {
        it('should publish message via cometd', () => {
            const message = { data: 'test message' };
            
            channel.publish(message);
            
            expect(mockCometD.publish).toHaveBeenCalledWith(channelName, message);
        });

        it('should handle different message types', () => {
            const messages = [
                { type: 'update', data: 'test' },
                { type: 'delete', id: '123' },
                { type: 'create', record: {} }
            ];
            
            messages.forEach(msg => {
                channel.publish(msg);
            });
            
            expect(mockCometD.publish).toHaveBeenCalledTimes(3);
        });
    });

    describe('_handleResponse (private)', () => {
        it('should call all listener callbacks', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            
            const mockListener1 = createMockListener(1);
            const mockListener2 = createMockListener(2);
            
            mockListener1.getCallback.mockReturnValue(callback1);
            mockListener2.getCallback.mockReturnValue(callback2);
            
            channel.subscribe(mockListener1 as unknown as ChannelListener);
            channel.subscribe(mockListener2 as unknown as ChannelListener);
            
            const message = { data: 'test' };
            (channel as unknown as {_handleResponse: (msg: unknown) => void})._handleResponse(message);
            
            expect(callback1).toHaveBeenCalledWith(message);
            expect(callback2).toHaveBeenCalledWith(message);
        });

        it('should handle listener with null callback', () => {
            const mockListener = createMockListener();
            mockListener.getCallback.mockReturnValue(null);
            
            // Force add listener
            (channel as unknown as {listeners: unknown[]}).listeners.push(mockListener);
            
            const message = { data: 'test' };
            
            // Should not throw
            expect(() => 
                (channel as unknown as {_handleResponse: (msg: unknown) => void})._handleResponse(message)
            ).not.toThrow();
        });
    });

    describe('_disconnected (private)', () => {
        it('should return true when status is disconnecting', () => {
            mockCometD.getStatus.mockReturnValue('disconnecting');
            
            const result = (channel as unknown as {_disconnected: () => boolean})._disconnected();
            
            expect(result).toBe(true);
        });

        it('should return true when status is disconnected', () => {
            mockCometD.getStatus.mockReturnValue('disconnected');
            
            const result = (channel as unknown as {_disconnected: () => boolean})._disconnected();
            
            expect(result).toBe(true);
        });

        it('should return false when status is connected', () => {
            mockCometD.getStatus.mockReturnValue('connected');
            
            const result = (channel as unknown as {_disconnected: () => boolean})._disconnected();
            
            expect(result).toBe(false);
        });

        it('should return false for other statuses', () => {
            mockCometD.getStatus.mockReturnValue('connecting');
            
            const result = (channel as unknown as {_disconnected: () => boolean})._disconnected();
            
            expect(result).toBe(false);
        });
    });

    describe('Listener management', () => {
        it('should track multiple listeners', () => {
            const mockListener1 = createMockListener(1);
            const mockListener2 = createMockListener(2);
            
            mockListener1.getCallback.mockReturnValue(() => 'cb1');
            mockListener2.getCallback.mockReturnValue(() => 'cb2');
            
            channel.subscribe(mockListener1 as unknown as ChannelListener);
            channel.subscribe(mockListener2 as unknown as ChannelListener);
            
            expect((channel as unknown as {listeners: unknown[]}).listeners).toHaveLength(2);
        });

        it('should maintain listener order', () => {
            const mockListener1 = createMockListener(1);
            const mockListener2 = createMockListener(2);
            
            mockListener1.getCallback.mockReturnValue(() => 'cb1');
            mockListener2.getCallback.mockReturnValue(() => 'cb2');
            
            channel.subscribe(mockListener1 as unknown as ChannelListener);
            channel.subscribe(mockListener2 as unknown as ChannelListener);
            
            const listeners = (channel as unknown as {listeners: unknown[]}).listeners;
            expect(listeners[0]).toBe(mockListener1);
            expect(listeners[1]).toBe(mockListener2);
        });

        it('should remove listeners on unsubscribe', () => {
            const mockListener = createMockListener();
            
            channel.subscribe(mockListener as unknown as ChannelListener);
            expect((channel as unknown as {listeners: unknown[]}).listeners).toHaveLength(1);
            
            channel.unsubscribe(mockListener as unknown as ChannelListener);
            expect((channel as unknown as {listeners: unknown[]}).listeners).toHaveLength(0);
        });

        it('should remove correct listener when multiple exist', () => {
            const mockListener1 = createMockListener(1);
            const mockListener2 = createMockListener(2);
            const mockListener3 = createMockListener(3);
            
            mockListener1.getCallback.mockReturnValue(() => 'cb1');
            mockListener2.getCallback.mockReturnValue(() => 'cb2');
            mockListener3.getCallback.mockReturnValue(() => 'cb3');
            
            channel.subscribe(mockListener1 as unknown as ChannelListener);
            channel.subscribe(mockListener2 as unknown as ChannelListener);
            channel.subscribe(mockListener3 as unknown as ChannelListener);
            
            channel.unsubscribe(mockListener2 as unknown as ChannelListener);
            
            const listeners = (channel as unknown as {listeners: MockListener[]}).listeners;
            expect(listeners).toHaveLength(2);
            expect(listeners[0]).toBe(mockListener1);
            expect(listeners[1]).toBe(mockListener3);
        });
    });

    describe('Subscribe options handling', () => {
        it('should send subscribe options when callback returns non-empty object', () => {
            const subscribeOptionsCallback = () => ({ option1: 'value1', option2: 'value2' });
            const channelWithOptions = new Channel(
                mockServerConnection as unknown as ServerConnection,
                mockCometD,
                'test-channel',
                true,
                subscribeOptionsCallback
            );
            const mockListener = createMockListener();
            
            channelWithOptions.subscribe(mockListener as unknown as ChannelListener);
            
            const callArgs = mockCometD.subscribe.mock.calls[0];
            expect(callArgs[3]).toEqual({ subscribeOptions: { option1: 'value1', option2: 'value2' } });
        });

        it('should not send subscribe options when callback returns empty object', () => {
            const subscribeOptionsCallback = () => ({});
            const channelWithEmptyOptions = new Channel(
                mockServerConnection as unknown as ServerConnection,
                mockCometD,
                'test-channel',
                true,
                subscribeOptionsCallback
            );
            const mockListener = createMockListener();
            
            channelWithEmptyOptions.subscribe(mockListener as unknown as ChannelListener);
            
            const callArgs = mockCometD.subscribe.mock.calls[0];
            expect(callArgs[3]).toBeNull();
        });

        it('should handle null from subscribe options callback', () => {
            const subscribeOptionsCallback = () => null;
            const channelWithNullOptions = new Channel(
                mockServerConnection as unknown as ServerConnection,
                mockCometD,
                'test-channel',
                true,
                subscribeOptionsCallback as unknown as () => Record<string, unknown>
            );
            const mockListener = createMockListener();
            
            channelWithNullOptions.subscribe(mockListener as unknown as ChannelListener);
            
            const callArgs = mockCometD.subscribe.mock.calls[0];
            expect(callArgs[3]).toBeNull();
        });

        it('should handle undefined from subscribe options callback', () => {
            const subscribeOptionsCallback = () => undefined;
            const channelWithUndefinedOptions = new Channel(
                mockServerConnection as unknown as ServerConnection,
                mockCometD,
                'test-channel',
                true,
                subscribeOptionsCallback as unknown as () => Record<string, unknown>
            );
            const mockListener = createMockListener();
            
            channelWithUndefinedOptions.subscribe(mockListener as unknown as ChannelListener);
            
            const callArgs = mockCometD.subscribe.mock.calls[0];
            expect(callArgs[3]).toBeNull();
        });
    });

    describe('Subscription callback queue', () => {
        it('should queue callbacks when no response', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            
            const listener1 = createMockListener(1);
            const listener2 = createMockListener(2);
            
            listener1.getCallback.mockReturnValue(() => 'cb1');
            listener1.getSubscriptionCallback.mockReturnValue(callback1);
            listener2.getCallback.mockReturnValue(() => 'cb2');
            listener2.getSubscriptionCallback.mockReturnValue(callback2);
            
            channel.subscribe(listener1 as unknown as ChannelListener);
            channel.subscribe(listener2 as unknown as ChannelListener);
            
            const queue = (channel as unknown as {listenerCallbackQueue: unknown[]}).listenerCallbackQueue;
            expect(queue).toHaveLength(2);
            expect(queue).toContain(callback1);
            expect(queue).toContain(callback2);
        });
    });

    describe('Edge cases', () => {
        it('should handle subscription when cometd throws error', () => {
            mockCometD.subscribe.mockImplementation(() => {
                throw new Error('Subscribe failed');
            });
            
            const mockListener = createMockListener();
            const result = channel.subscribe(mockListener as unknown as ChannelListener);
            
            expect(result).toBeNull();
        });

        it('should handle multiple subscribe/unsubscribe cycles', () => {
            const mockListener = createMockListener();
            
            channel.subscribe(mockListener as unknown as ChannelListener);
            channel.unsubscribe(mockListener as unknown as ChannelListener);
            channel.subscribe(mockListener as unknown as ChannelListener);
            channel.unsubscribe(mockListener as unknown as ChannelListener);
            
            expect((channel as unknown as {listeners: unknown[]}).listeners).toHaveLength(0);
        });

        it('should handle resubscribe with no listeners', () => {
            expect(() => channel.resubscribe()).not.toThrow();
        });
    });

    // Note: Complex CometD integration scenarios are tested in integration tests
    // These unit tests focus on Channel logic and state management
});

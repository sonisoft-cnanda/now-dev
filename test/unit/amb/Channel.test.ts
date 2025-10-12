/**
 * Unit tests for Channel class
 * Focuses on logic and state management
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

describe('Channel - Unit Tests', () => {
    let mockCometD: {
        subscribe: jest.Mock;
        unsubscribe: jest.Mock;
        publish: jest.Mock;
        getStatus: jest.Mock;
    };
    let mockServerConnection: {
        getSubscriptionCommandSender: jest.Mock;
    };
    let channel: Channel;
    const channelName = 'testChannelName';
	
	beforeEach(() => {
        // Create mock CometD
        mockCometD = {
            subscribe: jest.fn().mockReturnValue({ id: 'sub-123' }),
            unsubscribe: jest.fn(),
            publish: jest.fn(),
            getStatus: jest.fn().mockReturnValue('connected')
        };

        // Create mock ServerConnection
        mockServerConnection = {
            getSubscriptionCommandSender: jest.fn().mockReturnValue(null)
        };

        // Create channel instance
        channel = new Channel(
            mockServerConnection as unknown as ServerConnection,
            mockCometD,
            channelName,
            true
        );
    });

    function createMockListener(id: number = 1) {
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
	});

    describe('getName', () => {
        it('should return channel name', () => {
            expect(channel.getName()).toBe(channelName);
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
	});

    describe('unsubscribe', () => {
        it('should unsubscribe listener', () => {
            const mockListener = createMockListener();
            
            channel.subscribe(mockListener as unknown as ChannelListener);
            channel.unsubscribe(mockListener as unknown as ChannelListener);
            
            const listeners = (channel as unknown as {listeners: unknown[]}).listeners;
            expect(listeners).toHaveLength(0);
		});
	});

    describe('publish', () => {
        it('should publish message via cometd', () => {
            const message = { data: 'test message' };
            
            channel.publish(message);
            
            expect(mockCometD.publish).toHaveBeenCalledWith(channelName, message);
		});
	});

    describe('resubscribe', () => {
        it('should reset subscription', () => {
            (channel as unknown as {subscription: unknown}).subscription = { id: 'old-sub' };
            
            channel.resubscribe();
            
            expect((channel as unknown as {subscription: unknown}).subscription).toBeNull();
		});
	});

    // Note: Full AMB functionality tests are in integration tests
    // These unit tests focus on basic Channel operations
});

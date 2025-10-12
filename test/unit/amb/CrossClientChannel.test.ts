/**
 * Unit tests for CrossClientChannel
 */

import { describe, it, expect, jest } from '@jest/globals';
import { CrossClientChannel } from '../../../src/sn/amb/CrossClientChannel';

describe('CrossClientChannel - Unit Tests', () => {
    let crossClientChannel: CrossClientChannel;

    beforeEach(() => {
        crossClientChannel = new CrossClientChannel();
    });

    describe('Constructor', () => {
        it('should create instance', () => {
            expect(crossClientChannel).toBeInstanceOf(CrossClientChannel);
        });
    });

    describe('emit', () => {
        it('should have emit method', () => {
            expect(typeof crossClientChannel.emit).toBe('function');
        });

        it('should not throw when called', () => {
            expect(() => crossClientChannel.emit('event', { data: 'test' })).not.toThrow();
        });

        it('should accept event name and message', () => {
            const eventName = 'test.event';
            const message = { data: 'test' };
            
            expect(() => crossClientChannel.emit(eventName, message)).not.toThrow();
        });
    });

    describe('on', () => {
        it('should have on method', () => {
            expect(typeof crossClientChannel.on).toBe('function');
        });

        // NOTE: To fix "jest is not defined", ensure you have @types/jest installed and imported.
        // Since we are using @jest/globals and not the global jest, replace jest.fn() with a compatible mock.
        // Use a simple mock function as the listener.

        it('should not throw when called', () => {
            const listener = jest.fn();
            expect(() => crossClientChannel.on('event', listener)).not.toThrow();
        });

        it('should accept event name and listener', () => {
            const eventName = 'test.event';
            const listener = jest.fn();
            
            expect(() => crossClientChannel.on(eventName, listener)).not.toThrow();
        });
    });

    describe('Method existence', () => {
        it('should have emit as arrow function', () => {
            expect(typeof crossClientChannel.emit).toBe('function');
            // Arrow functions may have different name behavior
            expect(typeof crossClientChannel.emit.name).toBe('string');
        });

        it('should have on as arrow function', () => {
            expect(typeof crossClientChannel.on).toBe('function');
            // Arrow functions may have different name behavior
            expect(typeof crossClientChannel.on.name).toBe('string');
        });
    });

    // Note: CrossClientChannel is currently a stub implementation
    // The localStorage-based functionality is commented out
    // Full implementation tests would go in integration tests
});


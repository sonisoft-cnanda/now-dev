/**
 * Unit tests for SessionExtension
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SessionExtension } from '../../../src/sn/amb/SessionExtension';

// Mock Logger
jest.mock('../../../src/util/Logger', () => ({
    Logger: jest.fn().mockImplementation(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

describe('SessionExtension - Unit Tests', () => {
    let sessionExtension: SessionExtension;

    beforeEach(() => {
        sessionExtension = new SessionExtension();
    });

    describe('Constructor', () => {
        it('should create instance', () => {
            expect(sessionExtension).toBeInstanceOf(SessionExtension);
        });

        it('should initialize _extendSession as false', () => {
            expect((sessionExtension as unknown as {_extendSession: boolean})._extendSession).toBe(false);
        });

        it('should have logger', () => {
            expect((sessionExtension as unknown as {_logger: unknown})._logger).toBeDefined();
        });
    });

    describe('Constants', () => {
        it('should have META_CONNECT constant', () => {
            expect(SessionExtension.META_CONNECT).toBe('/meta/connect');
        });
    });

    describe('extendSession', () => {
        it('should set _extendSession to true', () => {
            sessionExtension.extendSession();
            
            expect((sessionExtension as unknown as {_extendSession: boolean})._extendSession).toBe(true);
        });

        it('should work when called multiple times', () => {
            sessionExtension.extendSession();
            sessionExtension.extendSession();
            
            expect((sessionExtension as unknown as {_extendSession: boolean})._extendSession).toBe(true);
        });
    });

    describe('outgoing', () => {
        it('should return message unchanged when channel is not META_CONNECT', () => {
            const message = { channel: '/some/other/channel', data: 'test' };
            
            const result = sessionExtension.outgoing(message);
            
            expect(result).toEqual(message);
            expect(result.ext).toBeUndefined();
        });

        it('should return message unchanged when _extendSession is false', () => {
            const message = { channel: '/meta/connect', data: 'test' };
            
            const result = sessionExtension.outgoing(message);
            
            expect(result).toEqual(message);
            expect(result.ext).toBeUndefined();
        });

        it('should add ext.extendSession when conditions met', () => {
            const message = { channel: '/meta/connect', data: 'test' };
            
            sessionExtension.extendSession();
            const result = sessionExtension.outgoing(message);
            
            expect(result.ext).toBeDefined();
            expect(result.ext.extendSession).toBe(true);
        });

        it('should create ext object if it does not exist', () => {
            const message = { channel: '/meta/connect' };
            
            sessionExtension.extendSession();
            const result = sessionExtension.outgoing(message);
            
            expect(result.ext).toBeDefined();
            expect(result.ext.extendSession).toBe(true);
        });

        it('should not overwrite existing ext properties', () => {
            const message = { 
                channel: '/meta/connect', 
                ext: { customProp: 'value' } 
            };
            
            sessionExtension.extendSession();
            const result = sessionExtension.outgoing(message);
            
            expect(result.ext.customProp).toBe('value');
            expect(result.ext.extendSession).toBe(true);
        });

        it('should reset _extendSession after adding to message', () => {
            const message = { channel: '/meta/connect' };
            
            sessionExtension.extendSession();
            expect((sessionExtension as unknown as {_extendSession: boolean})._extendSession).toBe(true);
            
            sessionExtension.outgoing(message);
            
            expect((sessionExtension as unknown as {_extendSession: boolean})._extendSession).toBe(false);
        });

        it('should only extend once per extendSession call', () => {
            const message1 = { channel: '/meta/connect' };
            const message2 = { channel: '/meta/connect' };
            
            sessionExtension.extendSession();
            sessionExtension.outgoing(message1);
            const result2 = sessionExtension.outgoing(message2);
            
            expect(message1.ext.extendSession).toBe(true);
            expect(result2.ext).toBeUndefined(); // Not extended second time
        });

        it('should handle multiple extend cycles', () => {
            const message1 = { channel: '/meta/connect' };
            const message2 = { channel: '/meta/connect' };
            
            sessionExtension.extendSession();
            sessionExtension.outgoing(message1);
            
            sessionExtension.extendSession();
            sessionExtension.outgoing(message2);
            
            expect(message1.ext.extendSession).toBe(true);
            expect(message2.ext.extendSession).toBe(true);
        });
    });

    describe('CometD extension integration', () => {
        it('should work as CometD outgoing extension', () => {
            // This simulates how CometD would call the extension
            const message = { channel: '/meta/connect' };
            
            sessionExtension.extendSession();
            const modifiedMessage = sessionExtension.outgoing(message);
            
            expect(modifiedMessage).toBe(message); // Same object, modified in place
            expect(modifiedMessage.ext?.extendSession).toBe(true);
        });

        it('should handle array of messages', () => {
            const messages = [
                { channel: '/some/channel' },
                { channel: '/meta/connect' },
                { channel: '/another/channel' }
            ];
            
            sessionExtension.extendSession();
            
            const results = messages.map(msg => sessionExtension.outgoing(msg));
            
            expect(results[0].ext).toBeUndefined();
            expect(results[1].ext?.extendSession).toBe(true);
            expect(results[2].ext).toBeUndefined();
        });
    });
});


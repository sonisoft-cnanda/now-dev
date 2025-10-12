/**
 * Unit tests for Properties singleton
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Properties } from '../../../src/sn/amb/Properties';

describe('Properties - Unit Tests', () => {
    describe('Singleton pattern', () => {
        it('should return same instance', () => {
            const instance1 = Properties.instance;
            const instance2 = Properties.instance;
            
            expect(instance1).toBe(instance2);
        });

        it('should be an instance of Properties', () => {
            const instance = Properties.instance;
            expect(instance).toBeInstanceOf(Properties);
        });
    });

    describe('Default properties', () => {
        let props: Properties;

        beforeEach(() => {
            props = Properties.instance;
        });

        it('should have servletPath property', () => {
            expect(props.servletPath).toBe('amb');
        });

        it('should have logLevel property', () => {
            expect(props.logLevel).toBe('debug');
        });

        it('should have loginWindow property', () => {
            expect(props.loginWindow).toBe('false');
        });

        it('should have wsConnectTimeout property', () => {
            expect(props.wsConnectTimeout).toBe(10000);
        });

        it('should have overlayStyle property', () => {
            expect(props.overlayStyle).toBe('');
        });

        it('should have subscribeCommandsFlow property', () => {
            expect(props.subscribeCommandsFlow).toBeDefined();
            expect(typeof props.subscribeCommandsFlow).toBe('object');
        });
    });

    describe('subscribeCommandsFlow configuration', () => {
        it('should have enable property set to false', () => {
            const props = Properties.instance;
            expect(props.subscribeCommandsFlow.enable).toBe(false);
        });

        it('should have maxInflight property', () => {
            const props = Properties.instance;
            expect(props.subscribeCommandsFlow.maxInflight).toBe(1);
        });

        it('should have maxWait property', () => {
            const props = Properties.instance;
            expect(props.subscribeCommandsFlow.maxWait).toBe(10000);
        });

        it('should have retries property', () => {
            const props = Properties.instance;
            expect(props.subscribeCommandsFlow.retries).toBe(3);
        });

        it('should have retryDelay configuration', () => {
            const props = Properties.instance;
            const retryDelay = props.subscribeCommandsFlow.retryDelay;
            
            expect(retryDelay.min).toBe(2000);
            expect(retryDelay.max).toBe(300000);
            expect(retryDelay.increaseFactor).toBe(2);
        });
    });

    describe('Property modification', () => {
        it('should allow modification of properties', () => {
            const props = Properties.instance;
            const originalPath = props.servletPath;
            
            props.servletPath = 'custom/amb';
            expect(props.servletPath).toBe('custom/amb');
            
            // Restore original
            props.servletPath = originalPath;
        });

        it('should persist modifications across instance calls', () => {
            const props1 = Properties.instance;
            props1.logLevel = 'info';
            
            const props2 = Properties.instance;
            expect(props2.logLevel).toBe('info');
            
            // Restore original
            props1.logLevel = 'debug';
        });
    });
});


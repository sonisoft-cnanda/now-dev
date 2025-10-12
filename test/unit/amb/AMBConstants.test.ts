/**
 * Unit tests for AMBConstants
 */

import { describe, it, expect } from '@jest/globals';
import { AMBConstants } from '../../../src/sn/amb/AMBConstants';

describe('AMBConstants - Unit Tests', () => {
    describe('Constants', () => {
        it('should have WEBSOCKET_TYPE_NAME constant', () => {
            expect(AMBConstants.WEBSOCKET_TYPE_NAME).toBe('websocket');
        });

        it('should have TOKEN_MANAGEMENT_EXTENSION constant', () => {
            expect(AMBConstants.TOKEN_MANAGEMENT_EXTENSION).toBe('tokenManagementExtension');
        });

        it('should have SESSION_LOGOUT_OVERLAY_STYLE constant', () => {
            expect(AMBConstants.SESSION_LOGOUT_OVERLAY_STYLE).toBe('glide.amb.session.logout.overlay.style');
        });

        it('should have GLIDE_SESSION_STATUS constant', () => {
            expect(AMBConstants.GLIDE_SESSION_STATUS).toBe('glide.session.status');
        });

        it('should have TOUCH_HTTP_SESSION constant', () => {
            expect(AMBConstants.TOUCH_HTTP_SESSION).toBe('session.touch.http');
        });

        it('should have REESTABLISH_SESSION constant', () => {
            expect(AMBConstants.REESTABLISH_SESSION).toBe('amb.ServerConnection.reestablish.session');
        });
    });

    describe('Constant immutability', () => {
        it('should be static constants', () => {
            expect(typeof AMBConstants.WEBSOCKET_TYPE_NAME).toBe('string');
            expect(typeof AMBConstants.TOKEN_MANAGEMENT_EXTENSION).toBe('string');
        });

        it('should not be able to create instance of AMBConstants', () => {
            // AMBConstants is a class with only static members
            const instance = new AMBConstants();
            expect(instance).toBeInstanceOf(AMBConstants);
        });
    });
});


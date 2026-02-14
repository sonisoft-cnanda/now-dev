import { describe, it, expect } from '@jest/globals';
import { NowStringUtil } from '../../../src/util/NowStringUtil';

describe('NowStringUtil', () => {
    describe('isStringEmpty', () => {
        it('should return true for undefined', () => {
            expect(NowStringUtil.isStringEmpty(undefined)).toBe(true);
        });

        it('should return true for null', () => {
            expect(NowStringUtil.isStringEmpty(null)).toBe(true);
        });

        it('should return true for empty string', () => {
            expect(NowStringUtil.isStringEmpty('')).toBe(true);
        });

        it('should return true for whitespace-only string', () => {
            expect(NowStringUtil.isStringEmpty('   ')).toBe(true);
        });

        it('should return true for tab-only string', () => {
            expect(NowStringUtil.isStringEmpty('\t')).toBe(true);
        });

        it('should return false for non-empty string', () => {
            expect(NowStringUtil.isStringEmpty('hello')).toBe(false);
        });

        it('should return false for string with whitespace padding', () => {
            expect(NowStringUtil.isStringEmpty('  hello  ')).toBe(false);
        });

        it('should return false for number 0', () => {
            expect(NowStringUtil.isStringEmpty(0)).toBe(false);
        });

        it('should return false for boolean false', () => {
            expect(NowStringUtil.isStringEmpty(false)).toBe(false);
        });
    });
});

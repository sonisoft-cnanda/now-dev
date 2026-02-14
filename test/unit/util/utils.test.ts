import { describe, it, expect } from '@jest/globals';
import { isUndefined, isNull, isNil, isObject, isEmptyObject } from '../../../src/util/utils';

describe('utils', () => {
    describe('isUndefined', () => {
        it('should return true for undefined', () => {
            expect(isUndefined(undefined)).toBe(true);
        });

        it('should return false for null', () => {
            expect(isUndefined(null)).toBe(false);
        });

        it('should return false for 0', () => {
            expect(isUndefined(0)).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isUndefined('')).toBe(false);
        });

        it('should return false for false', () => {
            expect(isUndefined(false)).toBe(false);
        });

        it('should return false for an object', () => {
            expect(isUndefined({})).toBe(false);
        });
    });

    describe('isNull', () => {
        it('should return true for null', () => {
            expect(isNull(null)).toBe(true);
        });

        it('should return false for undefined', () => {
            expect(isNull(undefined)).toBe(false);
        });

        it('should return false for 0', () => {
            expect(isNull(0)).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isNull('')).toBe(false);
        });
    });

    describe('isNil', () => {
        it('should return true for null', () => {
            expect(isNil(null)).toBe(true);
        });

        it('should return true for undefined', () => {
            expect(isNil(undefined)).toBe(true);
        });

        it('should return false for 0', () => {
            expect(isNil(0)).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isNil('')).toBe(false);
        });

        it('should return false for false', () => {
            expect(isNil(false)).toBe(false);
        });
    });

    describe('isObject', () => {
        it('should return true for plain object', () => {
            expect(isObject({})).toBe(true);
        });

        it('should return true for object with properties', () => {
            expect(isObject({ key: 'value' })).toBe(true);
        });

        it('should return true for array', () => {
            expect(isObject([])).toBe(true);
        });

        it('should return false for null', () => {
            expect(isObject(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isObject(undefined)).toBe(false);
        });

        it('should return false for string', () => {
            expect(isObject('hello')).toBe(false);
        });

        it('should return false for number', () => {
            expect(isObject(42)).toBe(false);
        });

        it('should return false for boolean', () => {
            expect(isObject(true)).toBe(false);
        });
    });

    describe('isEmptyObject', () => {
        it('should return true for empty object', () => {
            expect(isEmptyObject({})).toBe(true);
        });

        it('should return false for object with properties', () => {
            expect(isEmptyObject({ key: 'value' })).toBe(false);
        });

        it('should return false for null', () => {
            expect(isEmptyObject(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isEmptyObject(undefined)).toBe(false);
        });

        it('should return true for empty array', () => {
            expect(isEmptyObject([])).toBe(true);
        });

        it('should return false for non-empty array', () => {
            expect(isEmptyObject([1])).toBe(false);
        });

        it('should return false for string', () => {
            expect(isEmptyObject('hello')).toBe(false);
        });

        it('should return false for number', () => {
            expect(isEmptyObject(42)).toBe(false);
        });
    });
});

/**
 * Unit tests for Helper utility functions
 */

import { describe, it, expect } from '@jest/globals';
import { isUndefined, isNull, isNil, isObject, isEmptyObject } from '../../../src/sn/amb/Helper';

describe('Helper - Unit Tests', () => {
    describe('isUndefined', () => {
        it('should return true for undefined', () => {
            expect(isUndefined(undefined)).toBe(true);
        });

        it('should return false for null', () => {
            expect(isUndefined(null)).toBe(false);
        });

        it('should return false for values', () => {
            expect(isUndefined(0)).toBe(false);
            expect(isUndefined('')).toBe(false);
            expect(isUndefined(false)).toBe(false);
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

        it('should return false for values', () => {
            expect(isNull(0)).toBe(false);
            expect(isNull('')).toBe(false);
            expect(isNull(false)).toBe(false);
            expect(isNull({})).toBe(false);
        });
    });

    describe('isNil', () => {
        it('should return true for null', () => {
            expect(isNil(null)).toBe(true);
        });

        it('should return true for undefined', () => {
            expect(isNil(undefined)).toBe(true);
        });

        it('should return false for values', () => {
            expect(isNil(0)).toBe(false);
            expect(isNil('')).toBe(false);
            expect(isNil(false)).toBe(false);
            expect(isNil({})).toBe(false);
            expect(isNil([])).toBe(false);
        });
    });

    describe('isObject', () => {
        it('should return true for objects', () => {
            expect(isObject({})).toBe(true);
            expect(isObject({ key: 'value' })).toBe(true);
            expect(isObject([])).toBe(true);
            expect(isObject(new Date())).toBe(true);
        });

        it('should return false for null', () => {
            expect(isObject(null)).toBe(false);
        });

        it('should return false for primitives', () => {
            expect(isObject(undefined)).toBe(false);
            expect(isObject(123)).toBe(false);
            expect(isObject('string')).toBe(false);
            expect(isObject(true)).toBe(false);
        });
    });

    describe('isEmptyObject', () => {
        it('should return true for empty object', () => {
            expect(isEmptyObject({})).toBe(true);
        });

        it('should return false for object with properties', () => {
            expect(isEmptyObject({ key: 'value' })).toBe(false);
            expect(isEmptyObject({ a: 1 })).toBe(false);
        });

        it('should return true for empty arrays', () => {
            // Empty array is technically an empty object
            expect(isEmptyObject([])).toBe(true);
        });

        it('should return false for non-empty arrays', () => {
            expect(isEmptyObject([1, 2, 3])).toBe(false);
        });

        it('should return false for null', () => {
            expect(isEmptyObject(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isEmptyObject(undefined)).toBe(false);
        });

        it('should return false for primitives', () => {
            expect(isEmptyObject(123)).toBe(false);
            expect(isEmptyObject('string')).toBe(false);
        });
    });

    describe('Combined usage', () => {
        it('should correctly identify nil values', () => {
            const testValues = [null, undefined, 0, '', false, {}, []];
            const nilValues = testValues.filter(isNil);
            
            expect(nilValues).toHaveLength(2);
            expect(nilValues).toContain(null);
            expect(nilValues).toContain(undefined);
        });

        it('should correctly identify empty objects', () => {
            const testObjects = [{}, { a: 1 }, [], { nested: {} }];
            const emptyObjects = testObjects.filter(isEmptyObject);
            
            // Both {} and [] are considered empty objects
            expect(emptyObjects).toHaveLength(2);
            expect(emptyObjects).toContainEqual({});
            expect(emptyObjects).toContainEqual([]);
        });
    });
});


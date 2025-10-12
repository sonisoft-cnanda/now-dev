/**
 * Unit tests for FunctionQueue
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { FunctionQueue } from '../../../src/sn/amb/FunctionQueue';

describe('FunctionQueue - Unit Tests', () => {
    let queue: FunctionQueue;

    beforeEach(() => {
        queue = new FunctionQueue();
    });

    describe('Constructor', () => {
        it('should create queue with default max size', () => {
            expect(queue).toBeInstanceOf(FunctionQueue);
            expect(queue.getCapacity()).toBe(0x7ffffff);
        });

        it('should create queue with custom size', () => {
            const customQueue = new FunctionQueue(100);
            expect(customQueue.getCapacity()).toBe(100);
        });

        it('should enforce minimum size of 1', () => {
            const smallQueue = new FunctionQueue(0);
            expect(smallQueue.getCapacity()).toBe(1);
        });

        it('should floor fractional sizes', () => {
            const fractionalQueue = new FunctionQueue(10.7);
            expect(fractionalQueue.getCapacity()).toBe(10);
        });

        it('should handle negative sizes as 1', () => {
            const negativeQueue = new FunctionQueue(-5);
            expect(negativeQueue.getCapacity()).toBe(1);
        });
    });

    describe('enqueue', () => {
        it('should add item to queue', () => {
            const item = { data: 'test' };
            const result = queue.enqueue(item);
            
            expect(result).toBe(true);
            expect(queue.getSize()).toBe(1);
        });

        it('should add multiple items', () => {
            queue.enqueue('item1');
            queue.enqueue('item2');
            queue.enqueue('item3');
            
            expect(queue.getSize()).toBe(3);
        });

        it('should return false when queue is full', () => {
            const smallQueue = new FunctionQueue(2);
            
            expect(smallQueue.enqueue('item1')).toBe(true);
            expect(smallQueue.enqueue('item2')).toBe(true);
            expect(smallQueue.enqueue('item3')).toBe(false);
            expect(smallQueue.getSize()).toBe(2);
        });

        it('should handle different item types', () => {
            queue.enqueue(123);
            queue.enqueue('string');
            queue.enqueue({ key: 'value' });
            queue.enqueue([1, 2, 3]);
            queue.enqueue(null);
            
            expect(queue.getSize()).toBe(5);
        });
    });

    describe('dequeue', () => {
        it('should remove and return first item', () => {
            queue.enqueue('first');
            queue.enqueue('second');
            
            const item = queue.dequeue();
            
            expect(item).toBe('first');
            expect(queue.getSize()).toBe(1);
        });

        it('should return items in FIFO order', () => {
            queue.enqueue('item1');
            queue.enqueue('item2');
            queue.enqueue('item3');
            
            expect(queue.dequeue()).toBe('item1');
            expect(queue.dequeue()).toBe('item2');
            expect(queue.dequeue()).toBe('item3');
        });

        it('should return undefined when queue is empty', () => {
            const item = queue.dequeue();
            expect(item).toBeUndefined();
        });

        it('should handle dequeue until empty', () => {
            queue.enqueue('item1');
            queue.enqueue('item2');
            
            queue.dequeue();
            queue.dequeue();
            
            expect(queue.getSize()).toBe(0);
            expect(queue.dequeue()).toBeUndefined();
        });
    });

    describe('enqueueMultiple', () => {
        it('should add multiple items at once', () => {
            const items = ['item1', 'item2', 'item3'];
            const result = queue.enqueueMultiple(items);
            
            expect(result).toBe(true);
            expect(queue.getSize()).toBe(3);
        });

        it('should return false when insufficient space', () => {
            const smallQueue = new FunctionQueue(5);
            smallQueue.enqueue('existing1');
            smallQueue.enqueue('existing2');
            
            const items = ['new1', 'new2', 'new3', 'new4'];
            const result = smallQueue.enqueueMultiple(items);
            
            expect(result).toBe(false);
            expect(smallQueue.getSize()).toBe(2); // Original items remain
        });

        it('should add all items or none', () => {
            const smallQueue = new FunctionQueue(3);
            smallQueue.enqueue('item1');
            
            const items = ['item2', 'item3', 'item4'];
            smallQueue.enqueueMultiple(items);
            
            expect(smallQueue.getSize()).toBe(1); // Only original item
        });

        it('should handle empty array', () => {
            const result = queue.enqueueMultiple([]);
            expect(result).toBe(true);
            expect(queue.getSize()).toBe(0);
        });
    });

    describe('dequeueMultiple', () => {
        it('should remove and return multiple items', () => {
            queue.enqueue('item1');
            queue.enqueue('item2');
            queue.enqueue('item3');
            
            const items = queue.dequeueMultiple(2);
            
            expect(items).toEqual(['item1', 'item2']);
            expect(queue.getSize()).toBe(1);
        });

        it('should return undefined when count is negative', () => {
            queue.enqueue('item1');
            const items = queue.dequeueMultiple(-1);
            
            expect(items).toBeUndefined();
        });

        it('should return undefined when count exceeds queue size', () => {
            queue.enqueue('item1');
            const items = queue.dequeueMultiple(5);
            
            expect(items).toBeUndefined();
            expect(queue.getSize()).toBe(1); // Items remain
        });

        it('should return empty array when count is 0', () => {
            queue.enqueue('item1');
            const items = queue.dequeueMultiple(0);
            
            expect(items).toEqual([]);
            expect(queue.getSize()).toBe(1);
        });

        it('should remove all items when count equals size', () => {
            queue.enqueue('item1');
            queue.enqueue('item2');
            
            const items = queue.dequeueMultiple(2);
            
            expect(items).toEqual(['item1', 'item2']);
            expect(queue.getSize()).toBe(0);
        });
    });

    describe('clear', () => {
        it('should remove all items', () => {
            queue.enqueue('item1');
            queue.enqueue('item2');
            queue.enqueue('item3');
            
            queue.clear();
            
            expect(queue.getSize()).toBe(0);
        });

        it('should work on empty queue', () => {
            queue.clear();
            expect(queue.getSize()).toBe(0);
        });
    });

    describe('getSize', () => {
        it('should return 0 for empty queue', () => {
            expect(queue.getSize()).toBe(0);
        });

        it('should return correct size', () => {
            queue.enqueue('item1');
            expect(queue.getSize()).toBe(1);
            
            queue.enqueue('item2');
            expect(queue.getSize()).toBe(2);
        });

        it('should decrease on dequeue', () => {
            queue.enqueue('item1');
            queue.enqueue('item2');
            
            queue.dequeue();
            expect(queue.getSize()).toBe(1);
        });
    });

    describe('getCapacity', () => {
        it('should return max queue size', () => {
            expect(queue.getCapacity()).toBe(0x7ffffff);
        });

        it('should return custom capacity', () => {
            const customQueue = new FunctionQueue(50);
            expect(customQueue.getCapacity()).toBe(50);
        });
    });

    describe('getAvailableSpace', () => {
        it('should return full capacity when empty', () => {
            const smallQueue = new FunctionQueue(10);
            expect(smallQueue.getAvailableSpace()).toBe(10);
        });

        it('should decrease as items are added', () => {
            const smallQueue = new FunctionQueue(5);
            
            smallQueue.enqueue('item1');
            expect(smallQueue.getAvailableSpace()).toBe(4);
            
            smallQueue.enqueue('item2');
            expect(smallQueue.getAvailableSpace()).toBe(3);
        });

        it('should return 0 when full', () => {
            const smallQueue = new FunctionQueue(2);
            smallQueue.enqueue('item1');
            smallQueue.enqueue('item2');
            
            expect(smallQueue.getAvailableSpace()).toBe(0);
        });

        it('should increase on dequeue', () => {
            const smallQueue = new FunctionQueue(5);
            smallQueue.enqueue('item1');
            smallQueue.enqueue('item2');
            
            smallQueue.dequeue();
            expect(smallQueue.getAvailableSpace()).toBe(4);
        });
    });

    describe('getQueueBuffer', () => {
        it('should return queue buffer array', () => {
            queue.enqueue('item1');
            queue.enqueue('item2');
            
            const buffer = queue.getQueueBuffer();
            
            expect(buffer).toEqual(['item1', 'item2']);
        });

        it('should return empty array for empty queue', () => {
            const buffer = queue.getQueueBuffer();
            expect(buffer).toEqual([]);
        });
    });

    describe('Edge cases', () => {
        it('should handle rapid enqueue/dequeue', () => {
            for (let i = 0; i < 100; i++) {
                queue.enqueue(`item${i}`);
            }
            
            for (let i = 0; i < 50; i++) {
                queue.dequeue();
            }
            
            expect(queue.getSize()).toBe(50);
        });

        it('should maintain queue integrity', () => {
            queue.enqueue('first');
            queue.enqueue('second');
            queue.dequeue();
            queue.enqueue('third');
            
            expect(queue.dequeue()).toBe('second');
            expect(queue.dequeue()).toBe('third');
        });

        it('should handle clear and re-use', () => {
            queue.enqueue('item1');
            queue.clear();
            queue.enqueue('item2');
            
            expect(queue.getSize()).toBe(1);
            expect(queue.dequeue()).toBe('item2');
        });
    });
});


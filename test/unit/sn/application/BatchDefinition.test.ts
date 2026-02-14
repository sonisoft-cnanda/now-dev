import { describe, it, expect } from '@jest/globals';
import { BatchDefinition } from '../../../../src/sn/application/BatchDefinition';

describe('BatchDefinition', () => {
    describe('Constructor', () => {
        it('should set all fields via constructor', () => {
            const bd = new BatchDefinition('app123', true, 'test notes', '1.0.0', '2.0.0', 'application');

            expect(bd.id).toBe('app123');
            expect(bd.load_demo_data).toBe(true);
            expect(bd.notes).toBe('test notes');
            expect(bd.requested_customization_version).toBe('1.0.0');
            expect(bd.requested_version).toBe('2.0.0');
            expect(bd.type).toBe('application');
        });

        it('should handle empty string values', () => {
            const bd = new BatchDefinition('', false, '', '', '', '');

            expect(bd.id).toBe('');
            expect(bd.load_demo_data).toBe(false);
            expect(bd.notes).toBe('');
        });
    });

    describe('Getters and Setters', () => {
        it('should update values via setters', () => {
            const bd = new BatchDefinition('orig', true, 'orig', '1.0', '1.0', 'orig');

            bd.id = 'updated';
            bd.load_demo_data = false;
            bd.notes = 'updated notes';
            bd.requested_customization_version = '2.0';
            bd.requested_version = '3.0';

            expect(bd.id).toBe('updated');
            expect(bd.load_demo_data).toBe(false);
            expect(bd.notes).toBe('updated notes');
            expect(bd.requested_customization_version).toBe('2.0');
            expect(bd.requested_version).toBe('3.0');
        });
    });

    describe('toJSON', () => {
        it('should serialize to a plain object with all fields', () => {
            const bd = new BatchDefinition('app123', true, 'notes', '1.0.0', '2.0.0', 'application');
            const json = bd.toJSON();

            expect(json).toEqual({
                id: 'app123',
                load_demo_data: true,
                notes: 'notes',
                requested_customization_version: '1.0.0',
                requested_version: '2.0.0',
                type: 'application'
            });
        });

        it('should produce valid JSON when stringified', () => {
            const bd = new BatchDefinition('app123', true, 'notes', '1.0.0', '2.0.0', 'application');
            const jsonStr = JSON.stringify(bd);
            const parsed = JSON.parse(jsonStr);

            expect(parsed.id).toBe('app123');
            expect(parsed.load_demo_data).toBe(true);
            expect(parsed.requested_version).toBe('2.0.0');
        });

        it('should reflect setter changes in toJSON output', () => {
            const bd = new BatchDefinition('orig', true, 'orig', '1.0', '1.0', 'orig');
            bd.id = 'changed';
            bd.requested_version = '9.9.9';

            const json = bd.toJSON();
            expect(json).toHaveProperty('id', 'changed');
            expect(json).toHaveProperty('requested_version', '9.9.9');
        });
    });
});

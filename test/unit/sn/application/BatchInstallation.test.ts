import { describe, it, expect } from '@jest/globals';
import { BatchInstallation } from '../../../../src/sn/application/BatchInstallation';
import { BatchDefinition } from '../../../../src/sn/application/BatchDefinition';

describe('BatchInstallation', () => {
    describe('packages getter and setter', () => {
        it('should allow setting and getting packages', () => {
            const bi = new (BatchInstallation as any)();
            const packages = [
                new BatchDefinition('app1', true, 'notes1', '1.0', '1.0', 'application'),
                new BatchDefinition('app2', false, 'notes2', '2.0', '2.0', 'application')
            ];
            bi.packages = packages;

            expect(bi.packages).toBe(packages);
            expect(bi.packages.length).toBe(2);
        });

        it('should handle empty packages array', () => {
            const bi = new (BatchInstallation as any)();
            bi.packages = [];

            expect(bi.packages).toEqual([]);
            expect(bi.packages.length).toBe(0);
        });
    });

    describe('toJSON', () => {
        it('should serialize with name and packages', () => {
            const bi = new (BatchInstallation as any)();
            bi.packages = [
                new BatchDefinition('app1', true, 'notes', '1.0', '2.0', 'application')
            ];

            const json = bi.toJSON();

            expect(json).toHaveProperty('packages');
            expect(Array.isArray((json as any).packages)).toBe(true);
            expect((json as any).packages[0]).toEqual({
                id: 'app1',
                load_demo_data: true,
                notes: 'notes',
                requested_customization_version: '1.0',
                requested_version: '2.0',
                type: 'application'
            });
        });

        it('should serialize with empty packages array', () => {
            const bi = new (BatchInstallation as any)();
            bi.packages = [];

            const json = bi.toJSON();
            expect((json as any).packages).toEqual([]);
        });
    });
});

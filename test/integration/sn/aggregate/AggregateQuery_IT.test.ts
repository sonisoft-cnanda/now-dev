import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';
import { AggregateQuery } from '../../../../src/sn/aggregate/AggregateQuery';

const SECONDS = 1000;

describe('AggregateQuery - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let aggregateQuery: AggregateQuery;

    beforeAll(async () => {
        const credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            aggregateQuery = new AggregateQuery(instance);
        }

        if (!instance) throw new Error("Could not get credentials.");
    }, 300 * SECONDS);

    describe('count', () => {
        it('should count all incidents', async () => {
            const count = await aggregateQuery.count({ table: 'incident' });

            console.log(`\nTotal incidents: ${count}`);
            expect(typeof count).toBe('number');
            expect(count).toBeGreaterThanOrEqual(0);
        }, 60 * SECONDS);

        it('should count active incidents', async () => {
            const totalCount = await aggregateQuery.count({ table: 'incident' });
            const activeCount = await aggregateQuery.count({
                table: 'incident',
                query: 'active=true'
            });

            console.log(`\nTotal incidents: ${totalCount}, Active: ${activeCount}`);
            expect(activeCount).toBeGreaterThanOrEqual(0);
            expect(activeCount).toBeLessThanOrEqual(totalCount);
        }, 60 * SECONDS);

        it('should count records on sys_user table', async () => {
            const count = await aggregateQuery.count({ table: 'sys_user' });

            console.log(`\nTotal users: ${count}`);
            expect(count).toBeGreaterThan(0);
        }, 60 * SECONDS);
    });

    describe('aggregate', () => {
        it('should compute avg on incident priority', async () => {
            const result = await aggregateQuery.aggregate({
                table: 'incident',
                count: true,
                avgFields: ['priority']
            });

            console.log('\nAggregate result:', JSON.stringify(result, null, 2));
            expect(result).toBeDefined();
            expect(result.stats).toBeDefined();
            expect(result.stats.count).toBeDefined();
        }, 60 * SECONDS);
    });

    describe('groupBy', () => {
        it('should group incidents by priority', async () => {
            const result = await aggregateQuery.groupBy({
                table: 'incident',
                count: true,
                groupBy: ['priority']
            });

            console.log(`\nGrouped by priority: ${result.groups.length} groups`);
            result.groups.forEach(group => {
                const priority = group.groupby_fields[0];
                console.log(`  Priority ${priority.value}: ${group.stats.count} incidents`);
            });

            expect(result).toBeDefined();
            expect(result.groups).toBeDefined();
            expect(Array.isArray(result.groups)).toBe(true);
        }, 60 * SECONDS);

        it('should group incidents by priority and state', async () => {
            const result = await aggregateQuery.groupBy({
                table: 'incident',
                count: true,
                groupBy: ['priority', 'state'],
                query: 'active=true'
            });

            console.log(`\nGrouped by priority+state: ${result.groups.length} groups`);
            if (result.groups.length > 0) {
                console.log('  Sample group:', JSON.stringify(result.groups[0], null, 2));
            }

            expect(result.groups).toBeDefined();
            expect(Array.isArray(result.groups)).toBe(true);
        }, 60 * SECONDS);
    });
});

import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';
import { InstanceDiscovery } from '../../../../src/sn/discovery/InstanceDiscovery';

const SECONDS = 1000;

describe('InstanceDiscovery - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let discovery: InstanceDiscovery;

    beforeAll(async () => {
        const credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            discovery = new InstanceDiscovery(instance);
        }

        if (!instance) throw new Error("Could not get credentials.");
    }, 300 * SECONDS);

    describe('listTables', () => {
        it('should list tables with defaults', async () => {
            const tables = await discovery.listTables({ limit: 10 });

            console.log(`\nFound ${tables.length} tables`);
            tables.slice(0, 5).forEach(t => {
                console.log(`  - ${t.name} (${t.label || 'no label'})`);
            });

            expect(tables).toBeDefined();
            expect(Array.isArray(tables)).toBe(true);
            expect(tables.length).toBeGreaterThan(0);
        }, 60 * SECONDS);

        it('should filter tables by name prefix', async () => {
            const tables = await discovery.listTables({ namePrefix: 'sys_', limit: 10 });

            console.log(`\nFound ${tables.length} tables starting with sys_`);

            expect(tables).toBeDefined();
            tables.forEach(t => {
                expect(t.name).toMatch(/^sys_/);
            });
        }, 60 * SECONDS);

        it('should respect limit', async () => {
            const tables = await discovery.listTables({ limit: 5 });
            expect(tables.length).toBeLessThanOrEqual(5);
        }, 60 * SECONDS);
    });

    describe('listScopedApps', () => {
        it('should list scoped applications', async () => {
            const apps = await discovery.listScopedApps({ limit: 10 });

            console.log(`\nFound ${apps.length} scoped applications`);
            apps.slice(0, 5).forEach(a => {
                console.log(`  - ${a.name} (scope: ${a.scope || 'N/A'}, version: ${a.version || 'N/A'})`);
            });

            expect(apps).toBeDefined();
            expect(Array.isArray(apps)).toBe(true);
        }, 60 * SECONDS);
    });

    describe('listStoreApps', () => {
        it('should list store applications', async () => {
            const apps = await discovery.listStoreApps({ limit: 10 });

            console.log(`\nFound ${apps.length} store applications`);
            apps.slice(0, 5).forEach(a => {
                console.log(`  - ${a.name} (version: ${a.version || 'N/A'})`);
            });

            expect(apps).toBeDefined();
            expect(Array.isArray(apps)).toBe(true);
        }, 60 * SECONDS);
    });

    describe('listPlugins', () => {
        it('should list plugins', async () => {
            const plugins = await discovery.listPlugins({ limit: 10 });

            console.log(`\nFound ${plugins.length} plugins`);
            plugins.slice(0, 5).forEach(p => {
                console.log(`  - ${p.id || p.name} (active: ${p.active || 'N/A'})`);
            });

            expect(plugins).toBeDefined();
            expect(Array.isArray(plugins)).toBe(true);
            expect(plugins.length).toBeGreaterThan(0);
        }, 60 * SECONDS);

        it('should respect limit', async () => {
            const plugins = await discovery.listPlugins({ limit: 5 });
            expect(plugins.length).toBeLessThanOrEqual(5);
        }, 60 * SECONDS);
    });
});

import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';
import { SchemaDiscovery } from '../../../../src/sn/schema/SchemaDiscovery';
import { TableAPIRequest } from '../../../../src/comm/http/TableAPIRequest';

const SECONDS = 1000;

describe('SchemaDiscovery', () => {
    let instance: ServiceNowInstance;
    let schemaDiscovery: SchemaDiscovery;

    beforeEach(async () => {
        const credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            schemaDiscovery = new SchemaDiscovery(instance);
        }

        if (!schemaDiscovery) {
            throw new Error('Could not get credentials.');
        }
    });

    describe('discoverTableSchema', () => {

        it('should discover the incident table schema with fields', async () => {
            const schema = await schemaDiscovery.discoverTableSchema('incident');

            expect(schema).toBeDefined();
            expect(schema.table).toBe('incident');
            expect(Array.isArray(schema.fields)).toBe(true);
            expect(schema.fields.length).toBeGreaterThan(0);
        }, 30 * SECONDS);

        it('should include relationships when requested', async () => {
            const schema = await schemaDiscovery.discoverTableSchema('incident', { includeRelationships: true });

            expect(schema).toBeDefined();
            expect(schema.table).toBe('incident');
            expect(Array.isArray(schema.relationships)).toBe(true);
        }, 30 * SECONDS);

        it('should include UI policies when requested', async () => {
            const schema = await schemaDiscovery.discoverTableSchema('incident', { includeUIPolicies: true });

            expect(schema).toBeDefined();
            expect(schema.table).toBe('incident');
            expect(Array.isArray(schema.uiPolicies)).toBe(true);
        }, 30 * SECONDS);

        it('should include business rules when requested', async () => {
            const schema = await schemaDiscovery.discoverTableSchema('incident', { includeBusinessRules: true });

            expect(schema).toBeDefined();
            expect(schema.table).toBe('incident');
            expect(Array.isArray(schema.businessRules)).toBe(true);
        }, 30 * SECONDS);

    });

    describe('explainField', () => {

        // Note: short_description, priority, assigned_to are defined on the parent 'task' table,
        // not directly on 'incident'. The sys_dictionary stores them under name=task.
        it('should explain the short_description field as a string type with maxLength', async () => {
            const explanation = await schemaDiscovery.explainField('task', 'short_description');

            expect(explanation).toBeDefined();
            expect(explanation.field).toBe('short_description');
            expect(explanation.table).toBe('task');
            expect(explanation.type).toBe('string');
            expect(typeof explanation.maxLength).toBe('number');
            expect(explanation.maxLength).toBeGreaterThan(0);
        }, 30 * SECONDS);

        it('should explain the priority field with populated choices', async () => {
            const explanation = await schemaDiscovery.explainField('task', 'priority');

            expect(explanation).toBeDefined();
            expect(explanation.field).toBe('priority');
            expect(explanation.table).toBe('task');
            expect(Array.isArray(explanation.choices)).toBe(true);
            expect(explanation.choices!.length).toBeGreaterThan(0);

            for (const choice of explanation.choices!) {
                expect(choice.label).toBeDefined();
                expect(typeof choice.label).toBe('string');
                expect(choice.value).toBeDefined();
                expect(typeof choice.value).toBe('string');
            }
        }, 30 * SECONDS);

        it('should explain the assigned_to field as a reference type', async () => {
            const explanation = await schemaDiscovery.explainField('task', 'assigned_to');

            expect(explanation).toBeDefined();
            expect(explanation.field).toBe('assigned_to');
            expect(explanation.table).toBe('task');
            expect(explanation.type).toBe('reference');
        }, 30 * SECONDS);

    });

    describe('validateCatalogConfiguration', () => {

        it('should validate a catalog item configuration if one exists', async () => {
            const tableAPI = new TableAPIRequest(instance);

            // Query sc_cat_item for any available catalog item
            const catResp = await tableAPI.get<{ result: Array<{ sys_id: string; name?: string }> }>(
                'sc_cat_item',
                { sysparm_limit: 1 }
            );

            if (!catResp || catResp.status !== 200 || !catResp.bodyObject?.result || catResp.bodyObject.result.length === 0) {
                console.log('No catalog items found on this instance; skipping validateCatalogConfiguration test.');
                return;
            }

            const catalogItemSysId = catResp.bodyObject.result[0].sys_id;
            console.log(`Validating catalog item: ${catalogItemSysId} (${catResp.bodyObject.result[0].name || 'unnamed'})`);

            const result = await schemaDiscovery.validateCatalogConfiguration(catalogItemSysId);

            expect(result).toBeDefined();
            expect(typeof result.valid).toBe('boolean');
            expect(Array.isArray(result.issues)).toBe(true);
            expect(typeof result.warnings).toBe('number');
            expect(typeof result.errors).toBe('number');
        }, 60 * SECONDS);

    });

});

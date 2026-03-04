import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';

import { CatalogManager, getVariableTypeName } from '../../../../src/sn/catalog/CatalogManager';
import { CatalogItemRecord, CatalogCategoryRecord, CatalogVariableRecord } from '../../../../src/sn/catalog/CatalogModels';

const SECONDS = 1000;

describe('CatalogManager - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let catalogMgr: CatalogManager;

    // Track catalog items and categories discovered during tests for reuse
    let discoveredItemSysId: string;
    let discoveredCategorySysId: string;

    beforeAll(async () => {
        const credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            catalogMgr = new CatalogManager(instance);
        }

        if (!catalogMgr) {
            throw new Error('Could not get credentials.');
        }
    }, 60 * SECONDS);

    // ============================================================
    // listCatalogItems
    // ============================================================

    describe('listCatalogItems', () => {
        it('should list catalog items with default options', async () => {
            const items: CatalogItemRecord[] = await catalogMgr.listCatalogItems();

            console.log('\n=== listCatalogItems (default) ===');
            console.log('Total items returned:', items.length);
            if (items.length > 0) {
                console.log('First item:', JSON.stringify({
                    sys_id: items[0].sys_id,
                    name: items[0].name,
                    active: items[0].active,
                    category: items[0].category
                }, null, 2));
            }

            expect(items).toBeDefined();
            expect(Array.isArray(items)).toBe(true);
            expect(items.length).toBeGreaterThan(0);
            expect(items[0].sys_id).toBeDefined();
            expect(items[0].name).toBeDefined();

            // Save for later tests
            discoveredItemSysId = items[0].sys_id;
        }, 60 * SECONDS);

        it('should list catalog items with limit and offset', async () => {
            const items: CatalogItemRecord[] = await catalogMgr.listCatalogItems({
                limit: 5,
                offset: 0
            });

            console.log('\n=== listCatalogItems (limit=5) ===');
            console.log('Items returned:', items.length);

            expect(items).toBeDefined();
            expect(items.length).toBeLessThanOrEqual(5);
        }, 60 * SECONDS);

        it('should filter catalog items by active status', async () => {
            const items: CatalogItemRecord[] = await catalogMgr.listCatalogItems({
                active: true,
                limit: 10
            });

            console.log('\n=== listCatalogItems (active=true) ===');
            console.log('Active items returned:', items.length);

            expect(items).toBeDefined();
            // All returned items should be active
            for (const item of items) {
                expect(item.active).toBe('true');
            }
        }, 60 * SECONDS);

        it('should search catalog items by text', async () => {
            const items: CatalogItemRecord[] = await catalogMgr.listCatalogItems({
                textSearch: 'Laptop',
                limit: 10
            });

            console.log('\n=== listCatalogItems (textSearch=Laptop) ===');
            console.log('Matching items:', items.length);
            items.forEach(item => {
                console.log(`  - ${item.name}: ${item.short_description}`);
            });

            expect(items).toBeDefined();
            expect(Array.isArray(items)).toBe(true);
        }, 60 * SECONDS);
    });

    // ============================================================
    // getCatalogItem
    // ============================================================

    describe('getCatalogItem', () => {
        it('should get catalog item detail with variables', async () => {
            // Use the discovered item from the list test, or fetch one
            if (!discoveredItemSysId) {
                const items = await catalogMgr.listCatalogItems({ limit: 1 });
                discoveredItemSysId = items[0].sys_id;
            }

            const detail = await catalogMgr.getCatalogItem(discoveredItemSysId);

            console.log('\n=== getCatalogItem ===');
            console.log('Item:', JSON.stringify({
                sys_id: detail.item.sys_id,
                name: detail.item.name,
                active: detail.item.active,
                category: detail.item.category
            }, null, 2));
            console.log('Variables count:', detail.variables.length);
            detail.variables.forEach(v => {
                console.log(`  - ${v.name} (${v.friendly_type}): mandatory=${v.mandatory}, order=${v.order}`);
            });

            expect(detail).toBeDefined();
            expect(detail.item).toBeDefined();
            expect(detail.item.sys_id).toBe(discoveredItemSysId);
            expect(detail.item.name).toBeDefined();
            expect(Array.isArray(detail.variables)).toBe(true);

            // Verify variables have friendly_type enrichment
            for (const v of detail.variables) {
                expect(v.sys_id).toBeDefined();
                expect(v.friendly_type).toBeDefined();
                expect(v.friendly_type).not.toBe('');
            }
        }, 60 * SECONDS);

        it('should get catalog item without variables when includeVariables=false', async () => {
            if (!discoveredItemSysId) {
                const items = await catalogMgr.listCatalogItems({ limit: 1 });
                discoveredItemSysId = items[0].sys_id;
            }

            const detail = await catalogMgr.getCatalogItem(discoveredItemSysId, false);

            console.log('\n=== getCatalogItem (no variables) ===');
            console.log('Item:', detail.item.name);
            console.log('Variables count:', detail.variables.length);

            expect(detail.item.sys_id).toBe(discoveredItemSysId);
            expect(detail.variables).toHaveLength(0);
        }, 60 * SECONDS);

        it('should throw error for non-existent item', async () => {
            await expect(catalogMgr.getCatalogItem('nonexistent_sys_id_12345'))
                .rejects.toThrow();
        }, 60 * SECONDS);
    });

    // ============================================================
    // listCatalogCategories
    // ============================================================

    describe('listCatalogCategories', () => {
        it('should list catalog categories', async () => {
            const categories: CatalogCategoryRecord[] = await catalogMgr.listCatalogCategories();

            console.log('\n=== listCatalogCategories (default) ===');
            console.log('Categories returned:', categories.length);
            if (categories.length > 0) {
                console.log('First category:', JSON.stringify({
                    sys_id: categories[0].sys_id,
                    title: categories[0].title,
                    active: categories[0].active,
                    parent: categories[0].parent
                }, null, 2));
            }

            expect(categories).toBeDefined();
            expect(Array.isArray(categories)).toBe(true);
            expect(categories.length).toBeGreaterThan(0);
            expect(categories[0].sys_id).toBeDefined();
            expect(categories[0].title).toBeDefined();

            // Save for later tests
            discoveredCategorySysId = categories[0].sys_id;
        }, 60 * SECONDS);

        it('should filter categories by active status', async () => {
            const categories: CatalogCategoryRecord[] = await catalogMgr.listCatalogCategories({
                active: true,
                limit: 10
            });

            console.log('\n=== listCatalogCategories (active=true) ===');
            console.log('Active categories:', categories.length);

            expect(categories).toBeDefined();
            for (const cat of categories) {
                expect(cat.active).toBe('true');
            }
        }, 60 * SECONDS);

        it('should limit results', async () => {
            const categories: CatalogCategoryRecord[] = await catalogMgr.listCatalogCategories({
                limit: 3
            });

            console.log('\n=== listCatalogCategories (limit=3) ===');
            console.log('Categories returned:', categories.length);

            expect(categories.length).toBeLessThanOrEqual(3);
        }, 60 * SECONDS);
    });

    // ============================================================
    // getCatalogCategory
    // ============================================================

    describe('getCatalogCategory', () => {
        it('should get category detail with item count', async () => {
            if (!discoveredCategorySysId) {
                const categories = await catalogMgr.listCatalogCategories({ limit: 1 });
                discoveredCategorySysId = categories[0].sys_id;
            }

            const detail = await catalogMgr.getCatalogCategory(discoveredCategorySysId);

            console.log('\n=== getCatalogCategory ===');
            console.log('Category:', JSON.stringify({
                sys_id: detail.category.sys_id,
                title: detail.category.title,
                active: detail.category.active
            }, null, 2));
            console.log('Item count:', detail.itemCount);

            expect(detail).toBeDefined();
            expect(detail.category).toBeDefined();
            expect(detail.category.sys_id).toBe(discoveredCategorySysId);
            expect(detail.category.title).toBeDefined();
            expect(typeof detail.itemCount).toBe('number');
            expect(detail.itemCount).toBeGreaterThanOrEqual(0);
        }, 60 * SECONDS);

        it('should throw error for non-existent category', async () => {
            await expect(catalogMgr.getCatalogCategory('nonexistent_sys_id_12345'))
                .rejects.toThrow();
        }, 60 * SECONDS);
    });

    // ============================================================
    // listCatalogItemVariables
    // ============================================================

    describe('listCatalogItemVariables', () => {
        it('should list variables for a catalog item', async () => {
            // Find a catalog item that has variables
            if (!discoveredItemSysId) {
                const items = await catalogMgr.listCatalogItems({ limit: 1 });
                discoveredItemSysId = items[0].sys_id;
            }

            const variables: CatalogVariableRecord[] = await catalogMgr.listCatalogItemVariables({
                catalogItemSysId: discoveredItemSysId
            });

            console.log('\n=== listCatalogItemVariables ===');
            console.log('Item sys_id:', discoveredItemSysId);
            console.log('Variables returned:', variables.length);
            variables.forEach(v => {
                console.log(`  - ${v.name}: type=${v.type} (${v.friendly_type}), mandatory=${v.mandatory}, order=${v.order}`);
            });

            expect(variables).toBeDefined();
            expect(Array.isArray(variables)).toBe(true);

            // Verify enrichment
            for (const v of variables) {
                expect(v.sys_id).toBeDefined();
                expect(v.name).toBeDefined();
                expect(v.friendly_type).toBeDefined();
            }

            // Verify sorted by order
            for (let i = 1; i < variables.length; i++) {
                const prevOrder = parseInt(variables[i - 1].order || '0', 10);
                const currOrder = parseInt(variables[i].order || '0', 10);
                expect(currOrder).toBeGreaterThanOrEqual(prevOrder);
            }
        }, 60 * SECONDS);

        it('should list only direct variables when includeVariableSets is false', async () => {
            if (!discoveredItemSysId) {
                const items = await catalogMgr.listCatalogItems({ limit: 1 });
                discoveredItemSysId = items[0].sys_id;
            }

            const directOnly: CatalogVariableRecord[] = await catalogMgr.listCatalogItemVariables({
                catalogItemSysId: discoveredItemSysId,
                includeVariableSets: false
            });

            const allVars: CatalogVariableRecord[] = await catalogMgr.listCatalogItemVariables({
                catalogItemSysId: discoveredItemSysId,
                includeVariableSets: true
            });

            console.log('\n=== listCatalogItemVariables (direct vs all) ===');
            console.log('Direct-only variables:', directOnly.length);
            console.log('All variables (with sets):', allVars.length);

            expect(directOnly.length).toBeLessThanOrEqual(allVars.length);
        }, 120 * SECONDS);
    });

    // ============================================================
    // submitCatalogRequest
    // ============================================================

    describe('submitCatalogRequest', () => {
        it('should submit a catalog request and return REQ + RITM', async () => {
            // Find an active, orderable catalog item
            // "Standard Laptop" is a known OOTB item on ServiceNow instances
            const items = await catalogMgr.listCatalogItems({
                textSearch: 'Standard Laptop',
                active: true,
                limit: 1
            });

            if (items.length === 0) {
                console.log('No "Standard Laptop" found, skipping submitCatalogRequest test');
                return;
            }

            const itemSysId = items[0].sys_id;
            console.log('\n=== submitCatalogRequest ===');
            console.log('Ordering item:', items[0].name, `(${itemSysId})`);

            const result = await catalogMgr.submitCatalogRequest({
                catalogItemSysId: itemSysId,
                quantity: 1,
                variables: {}
            });

            console.log('Request number:', result.requestNumber);
            console.log('Request sys_id:', result.requestSysId);
            console.log('RITM number:', result.requestItemNumber);
            console.log('RITM sys_id:', result.requestItemSysId);

            expect(result).toBeDefined();
            expect(result.requestNumber).toBeDefined();
            expect(result.requestNumber).toMatch(/^REQ/);
            expect(result.requestSysId).toBeDefined();
            expect(result.requestSysId.length).toBeGreaterThan(0);

            // RITM may or may not be available immediately
            if (result.requestItemNumber) {
                expect(result.requestItemNumber).toMatch(/^RITM/);
                expect(result.requestItemSysId).toBeDefined();
            }
        }, 120 * SECONDS);
    });
});

import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';

import { CodeSearch } from '../../../../src/sn/codesearch/CodeSearch';
import { CodeSearchResult, CodeSearchRecordTypeResult, CodeSearchGroup, CodeSearchTable, CodeSearchTableRecord } from '../../../../src/sn/codesearch/CodeSearchModels';

describe('CodeSearch - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;
    let codeSearch: CodeSearch;
    const SECONDS = 1000;

    beforeEach(async () => {
        credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            codeSearch = new CodeSearch(instance);
        }

        if (!instance) throw new Error("Could not get credentials.");
    });

    describe('getSearchGroups', () => {
        it('should retrieve code search groups from the instance', async () => {
            const groups: CodeSearchGroup[] = await codeSearch.getSearchGroups();

            console.log(`\nRetrieved ${groups.length} code search groups`);

            expect(groups).toBeDefined();
            expect(Array.isArray(groups)).toBe(true);
            expect(groups.length).toBeGreaterThan(0);

            if (groups.length > 0) {
                const firstGroup = groups[0];
                expect(firstGroup.sys_id).toBeDefined();
                expect(firstGroup.name).toBeDefined();

                console.log('\nSearch groups:');
                groups.forEach(group => {
                    console.log(`  - ${group.name} (sys_id: ${group.sys_id})`);
                });
            }
        }, 60 * SECONDS);

        it('should respect limit option', async () => {
            const groups: CodeSearchGroup[] = await codeSearch.getSearchGroups({ limit: 2 });

            console.log(`\nRetrieved ${groups.length} groups with limit=2`);

            expect(groups).toBeDefined();
            expect(Array.isArray(groups)).toBe(true);
            expect(groups.length).toBeLessThanOrEqual(2);
        }, 60 * SECONDS);
    });

    describe('getTablesForSearchGroup', () => {
        it('should list tables for a known search group', async () => {
            // First get the available search groups to find a valid group name
            const groups: CodeSearchGroup[] = await codeSearch.getSearchGroups({ limit: 1 });

            if (groups.length === 0) {
                console.log('\nSkipping: No search groups found on instance');
                return;
            }

            const groupName = groups[0].name;
            console.log(`\nUsing search group: ${groupName}`);

            const tables: CodeSearchTable[] = await codeSearch.getTablesForSearchGroup(groupName);

            console.log(`\nFound ${tables.length} tables in search group '${groupName}':`);
            tables.forEach(table => {
                console.log(`  - ${table.name} (${table.label || 'no label'})`);
            });

            expect(tables).toBeDefined();
            expect(Array.isArray(tables)).toBe(true);
            expect(tables.length).toBeGreaterThan(0);

            if (tables.length > 0) {
                expect(tables[0].name).toBeDefined();
            }
        }, 60 * SECONDS);
    });

    describe('searchRaw', () => {
        it('should return raw hierarchical results', async () => {
            const rawResults: CodeSearchRecordTypeResult[] = await codeSearch.searchRaw({ term: 'GlideRecord' });

            console.log(`\nRaw search for "GlideRecord" returned ${rawResults.length} record type groups`);

            expect(rawResults).toBeDefined();
            expect(Array.isArray(rawResults)).toBe(true);
            expect(rawResults.length).toBeGreaterThan(0);

            if (rawResults.length > 0) {
                const firstGroup = rawResults[0];
                expect(firstGroup.recordType).toBeDefined();

                // Find a group with actual hits
                const groupWithHits = rawResults.find(g => g.hits && g.hits.length > 0);
                if (groupWithHits) {
                    console.log(`\nGroup with hits: ${groupWithHits.recordType} (${groupWithHits.tableLabel})`);
                    console.log(`  Hits: ${groupWithHits.hits.length}`);

                    const firstHit = groupWithHits.hits[0];
                    expect(firstHit.name).toBeDefined();
                    expect(firstHit.className).toBeDefined();
                    expect(firstHit.matches).toBeDefined();

                    console.log(`  First hit: ${firstHit.name} (${firstHit.className})`);
                    if (firstHit.matches.length > 0) {
                        console.log(`  First match field: ${firstHit.matches[0].field}`);
                        console.log(`  Line matches: ${firstHit.matches[0].lineMatches?.length}`);
                    }
                }
            }
        }, 60 * SECONDS);
    });

    describe('search (flattened)', () => {
        it('should return flattened results for a common term', async () => {
            const results: CodeSearchResult[] = await codeSearch.search({ term: 'GlideRecord' });

            console.log(`\nFlattened search for "GlideRecord" returned ${results.length} results`);

            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);

            if (results.length > 0) {
                const first = results[0];
                expect(first.table).toBeDefined();
                expect(first.name).toBeDefined();
                expect(first.field).toBeDefined();
                expect(first.fieldLabel).toBeDefined();
                expect(first.matchCount).toBeGreaterThan(0);

                console.log('\nSample flattened results:');
                results.slice(0, 5).forEach(r => {
                    console.log(`  ${r.tableLabel} > ${r.name} > ${r.fieldLabel} (${r.matchCount} matches, first at L${r.firstMatchLine})`);
                });
            }
        }, 60 * SECONDS);

        it('should search with a search group', async () => {
            const groups = await codeSearch.getSearchGroups({ limit: 1 });
            if (groups.length === 0) {
                console.log('\nSkipping: No search groups found');
                return;
            }

            const groupName = groups[0].name;
            console.log(`\nSearching with search group: ${groupName}`);

            const results = await codeSearch.search({
                term: 'GlideRecord',
                search_group: groupName
            });

            console.log(`Search with group '${groupName}' returned ${results.length} results`);

            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
        }, 60 * SECONDS);
    });

    describe('searchInApp', () => {
        it('should search within global scope', async () => {
            const results = await codeSearch.searchInApp('GlideRecord', 'global');

            console.log(`\nSearch in app scope "global" returned ${results.length} results`);

            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);

            if (results.length > 0) {
                console.log('\nSample results:');
                results.slice(0, 3).forEach(r => {
                    console.log(`  - ${r.name} (table: ${r.table}, field: ${r.field})`);
                });
            }
        }, 60 * SECONDS);
    });

    describe('searchInTable', () => {
        it('should search within a specific table', async () => {
            const groups = await codeSearch.getSearchGroups({ limit: 1 });
            if (groups.length === 0) {
                console.log('\nSkipping: No search groups found');
                return;
            }

            const groupName = groups[0].name;
            const tables = await codeSearch.getTablesForSearchGroup(groupName);
            if (tables.length === 0) {
                console.log('\nSkipping: No tables in search group');
                return;
            }

            const tableName = tables[0].name;
            console.log(`\nSearching table '${tableName}' in group '${groupName}'`);

            const results = await codeSearch.searchInTable('GlideRecord', tableName, groupName);

            console.log(`Search in table '${tableName}' returned ${results.length} results`);

            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
        }, 60 * SECONDS);
    });

    describe('formatResultsAsText', () => {
        it('should format search results as readable text', async () => {
            const results = await codeSearch.search({ term: 'GlideRecord' });
            const formatted = CodeSearch.formatResultsAsText(results);

            console.log('\n=== Formatted Text Output ===');
            console.log(formatted.substring(0, 2000));

            expect(formatted).toBeDefined();
            expect(formatted.length).toBeGreaterThan(0);
            expect(formatted).toContain('Found');
        }, 60 * SECONDS);
    });

    describe('addTableToSearchGroup', () => {
        it('should add a table to a search group and return the created record', async () => {
            // First, get a valid search group
            const groups: CodeSearchGroup[] = await codeSearch.getSearchGroups({ limit: 1 });
            if (groups.length === 0) {
                console.log('\nSkipping: No search groups found on instance');
                return;
            }

            const groupSysId = groups[0].sys_id;
            const groupName = groups[0].name;
            console.log(`\nUsing search group: ${groupName} (sys_id: ${groupSysId})`);

            // Add a test table entry
            const result: CodeSearchTableRecord = await codeSearch.addTableToSearchGroup({
                table: 'sys_ui_script',
                search_fields: 'script',
                search_group: groupSysId
            });

            console.log(`\nCreated table record: sys_id=${result.sys_id}, table=${result.table}`);

            expect(result).toBeDefined();
            expect(result.sys_id).toBeDefined();
            expect(result.sys_id.length).toBeGreaterThan(0);
            expect(result.table).toBe('sys_ui_script');
            expect(result.search_fields).toBe('script');
        }, 60 * SECONDS);

        it('should throw when table name is empty', async () => {
            await expect(codeSearch.addTableToSearchGroup({
                table: '',
                search_fields: 'script',
                search_group: 'any-sys-id'
            })).rejects.toThrow('Table name is required');
        }, 30 * SECONDS);

        it('should throw when search_fields is empty', async () => {
            await expect(codeSearch.addTableToSearchGroup({
                table: 'sys_script',
                search_fields: '',
                search_group: 'any-sys-id'
            })).rejects.toThrow('Search fields are required');
        }, 30 * SECONDS);

        it('should throw when search_group is empty', async () => {
            await expect(codeSearch.addTableToSearchGroup({
                table: 'sys_script',
                search_fields: 'script',
                search_group: ''
            })).rejects.toThrow('Search group sys_id is required');
        }, 30 * SECONDS);
    });

    describe('getTableRecordsForSearchGroup', () => {
        it('should list table records for a search group with sys_id fields', async () => {
            const groups: CodeSearchGroup[] = await codeSearch.getSearchGroups({ limit: 1 });
            if (groups.length === 0) {
                console.log('\nSkipping: No search groups found on instance');
                return;
            }

            const groupSysId = groups[0].sys_id;
            console.log(`\nQuerying table records for group: ${groups[0].name} (sys_id: ${groupSysId})`);

            const records: CodeSearchTableRecord[] = await codeSearch.getTableRecordsForSearchGroup(groupSysId);

            console.log(`\nFound ${records.length} table records:`);
            records.forEach(rec => {
                console.log(`  - ${rec.table} (sys_id: ${rec.sys_id}, fields: ${rec.search_fields})`);
            });

            expect(records).toBeDefined();
            expect(Array.isArray(records)).toBe(true);
            expect(records.length).toBeGreaterThan(0);

            if (records.length > 0) {
                expect(records[0].sys_id).toBeDefined();
                expect(records[0].table).toBeDefined();
                expect(records[0].search_fields).toBeDefined();
            }
        }, 60 * SECONDS);

        it('should throw when searchGroupSysId is empty', async () => {
            await expect(codeSearch.getTableRecordsForSearchGroup(''))
                .rejects.toThrow('Search group sys_id is required');
        }, 30 * SECONDS);
    });

    describe('validation', () => {
        it('should throw when term is empty', async () => {
            await expect(codeSearch.search({ term: '' }))
                .rejects.toThrow('Search term is required');
        }, 30 * SECONDS);

        it('should throw when table is provided without search_group', async () => {
            await expect(codeSearch.search({ term: 'test', table: 'sys_script_include' }))
                .rejects.toThrow('search_group is required when searching a specific table');
        }, 30 * SECONDS);

        it('should throw when search group name is empty for getTablesForSearchGroup', async () => {
            await expect(codeSearch.getTablesForSearchGroup(''))
                .rejects.toThrow('Search group name is required');
        }, 30 * SECONDS);
    });
});

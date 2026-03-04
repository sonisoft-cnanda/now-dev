import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';

import { XMLRecordManager } from '../../../../src/sn/xml/XMLRecordManager';
import { TableAPIRequest } from '../../../../src/comm/http/TableAPIRequest';
import { ServiceNowRequest } from '../../../../src/comm/http/ServiceNowRequest';

const SECONDS = 1000;

describe('XMLRecordManager - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let xmlMgr: XMLRecordManager;
    let tableAPI: TableAPIRequest;
    let snRequest: ServiceNowRequest;

    beforeAll(async () => {
        const credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            xmlMgr = new XMLRecordManager(instance);
            tableAPI = new TableAPIRequest(instance);
            snRequest = new ServiceNowRequest(instance);
        }

        if (!xmlMgr) {
            throw new Error('Could not get credentials.');
        }
    }, 60 * SECONDS);

    // ============================================================
    // exportRecord
    // ============================================================

    describe('exportRecord', () => {
        it('should export an incident record as valid XML', async () => {
            // First, find an incident to export
            const response = await tableAPI.get<any>('incident', {
                sysparm_limit: 1,
                sysparm_fields: 'sys_id,number,short_description'
            });

            expect(response.status).toBe(200);
            const incidents = response.bodyObject?.result;
            expect(incidents).toBeDefined();
            expect(incidents.length).toBeGreaterThan(0);

            const incidentSysId = incidents[0].sys_id;
            console.log(`\n=== exportRecord (incident) ===`);
            console.log(`Exporting incident: ${incidents[0].number} (${incidentSysId})`);

            const result = await xmlMgr.exportRecord({
                table: 'incident',
                sysId: incidentSysId
            });

            console.log(`XML length: ${result.xml.length} chars`);
            console.log(`Table: ${result.table}`);
            console.log(`SysId: ${result.sysId}`);
            console.log(`Unload date: ${result.unloadDate}`);

            expect(result.xml).toBeDefined();
            expect(result.xml.length).toBeGreaterThan(0);
            expect(result.xml).toContain('<?xml');
            expect(result.xml).toContain('<unload');
            expect(result.xml).toContain('<incident');
            expect(result.xml).toContain(incidentSysId);
            expect(result.table).toBe('incident');
            expect(result.sysId).toBe(incidentSysId);
            expect(result.unloadDate).toBeDefined();
        }, 60 * SECONDS);

        it('should return empty unload XML for non-existent record', async () => {
            // ServiceNow returns 200 with an empty <unload/> element for non-existent records
            const result = await xmlMgr.exportRecord({
                table: 'incident',
                sysId: 'nonexistent_sys_id_99999'
            });

            console.log('\n=== exportRecord (non-existent) ===');
            console.log('XML:', result.xml);

            expect(result.xml).toContain('<unload');
            // The XML should not contain an <incident> record element
            expect(result.xml).not.toContain('<incident');
        }, 60 * SECONDS);
    });

    // ============================================================
    // importRecords (round-trip)
    // ============================================================

    describe('importRecords (round-trip)', () => {
        it('should export a record, modify it, and import it back', async () => {
            // Step 1: Create a temporary incident
            const createResponse = await tableAPI.post<any>('incident', {}, {
                short_description: `XMLRecordManager IT - ${Date.now()}`,
                description: 'Original description for round-trip test'
            });

            expect(createResponse.status === 200 || createResponse.status === 201).toBe(true);
            const createdIncident = createResponse.bodyObject?.result;
            const sysId = createdIncident.sys_id;
            const number = createdIncident.number;

            console.log(`\n=== importRecords (round-trip) ===`);
            console.log(`Created incident: ${number} (${sysId})`);

            try {
                // Step 2: Export it
                const exported = await xmlMgr.exportRecord({
                    table: 'incident',
                    sysId: sysId
                });

                expect(exported.xml).toContain(sysId);
                console.log(`Exported XML length: ${exported.xml.length}`);

                // Step 3: Modify the description in the XML
                const newDescription = `Round-trip test updated at ${new Date().toISOString()}`;
                const modifiedXml = exported.xml.replace(
                    /<description>[^<]*<\/description>/,
                    `<description>${newDescription}</description>`
                );

                expect(modifiedXml).toContain(newDescription);
                console.log(`Modified XML with new description`);

                // Step 4: Import the modified XML
                const importResult = await xmlMgr.importRecords({
                    xmlContent: modifiedXml,
                    targetTable: 'incident'
                });

                expect(importResult.success).toBe(true);
                expect(importResult.targetTable).toBe('incident');
                console.log(`Import successful`);

                // Step 5: Verify the update took effect
                const verifyResponse = await tableAPI.get<any>('incident', {
                    sysparm_query: `sys_id=${sysId}`,
                    sysparm_fields: 'sys_id,description'
                });

                expect(verifyResponse.status).toBe(200);
                const updatedRecord = verifyResponse.bodyObject?.result?.[0];
                expect(updatedRecord).toBeDefined();
                expect(updatedRecord.description).toBe(newDescription);
                console.log(`Verified: description updated successfully`);

            } finally {
                // Cleanup: delete the temporary incident
                await snRequest.delete<any>({
                    path: `/api/now/table/incident/${sysId}`,
                    headers: null,
                    query: null,
                    body: null
                });
                console.log(`Cleaned up incident ${number}`);
            }
        }, 120 * SECONDS);
    });
});

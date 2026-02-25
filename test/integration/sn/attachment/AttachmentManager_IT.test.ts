import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';
import { AttachmentManager } from '../../../../src/sn/attachment/AttachmentManager';
import { TableAPIRequest } from '../../../../src/comm/http/TableAPIRequest';

describe('AttachmentManager', () => {
    let instance: ServiceNowInstance;
    let attachmentManager: AttachmentManager;
    let tableAPI: TableAPIRequest;

    beforeEach(async () => {
        const credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            attachmentManager = new AttachmentManager(instance);
            tableAPI = new TableAPIRequest(instance);
        }

        if (!attachmentManager) {
            throw new Error('Could not get credentials.');
        }
    });

    async function createIncident(): Promise<string> {
        const result = await tableAPI.post<{ result: { sys_id: string } }>(
            'incident',
            {},
            { short_description: 'AttachmentManager_IT_' + Date.now() }
        );

        expect(result).toBeDefined();
        expect(result.status).toBe(201);
        return result.bodyObject.result.sys_id;
    }

    async function deleteIncident(sysId: string): Promise<void> {
        const { ServiceNowRequest } = await import('../../../../src/comm/http/ServiceNowRequest');
        const snReq = new ServiceNowRequest(instance);
        await snReq.delete({
            path: `/api/now/table/incident/${sysId}`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            query: null,
            body: null
        });
    }

    describe('listAttachments - empty', () => {
        it('should return an empty array when no attachments exist on a new incident', async () => {
            let incidentSysId: string | null = null;

            try {
                incidentSysId = await createIncident();
                console.log('\n=== listAttachments empty ===');
                console.log('Created incident:', incidentSysId);

                const attachments = await attachmentManager.listAttachments({
                    tableName: 'incident',
                    recordSysId: incidentSysId
                });

                console.log('Attachments:', JSON.stringify(attachments, null, 2));

                expect(attachments).toBeDefined();
                expect(Array.isArray(attachments)).toBe(true);
                expect(attachments.length).toBe(0);
            } finally {
                if (incidentSysId) {
                    await deleteIncident(incidentSysId);
                    console.log('Cleaned up incident:', incidentSysId);
                }
            }
        }, 100000);
    });

    describe('uploadAttachment', () => {
        it('should upload a text file attachment and return a valid record', async () => {
            let incidentSysId: string | null = null;

            try {
                incidentSysId = await createIncident();
                console.log('\n=== uploadAttachment ===');
                console.log('Created incident:', incidentSysId);

                const record = await attachmentManager.uploadAttachment({
                    tableName: 'incident',
                    recordSysId: incidentSysId,
                    fileName: 'test_file.txt',
                    contentType: 'text/plain',
                    data: 'Hello IT Test'
                });

                console.log('Upload result:', JSON.stringify(record, null, 2));

                expect(record).toBeDefined();
                expect(record.sys_id).toBeDefined();
                expect(record.sys_id.length).toBeGreaterThan(0);
                expect(record.file_name).toBe('test_file.txt');
            } finally {
                if (incidentSysId) {
                    await deleteIncident(incidentSysId);
                    console.log('Cleaned up incident:', incidentSysId);
                }
            }
        }, 100000);
    });

    describe('upload + list + get', () => {
        it('should upload an attachment, list it, and get it by sys_id', async () => {
            let incidentSysId: string | null = null;

            try {
                incidentSysId = await createIncident();
                console.log('\n=== upload + list + get ===');
                console.log('Created incident:', incidentSysId);

                // Upload
                const uploaded = await attachmentManager.uploadAttachment({
                    tableName: 'incident',
                    recordSysId: incidentSysId,
                    fileName: 'test_file.txt',
                    contentType: 'text/plain',
                    data: 'Hello IT Test'
                });

                console.log('Uploaded:', JSON.stringify(uploaded, null, 2));
                expect(uploaded).toBeDefined();
                expect(uploaded.sys_id).toBeDefined();

                // List
                const attachments = await attachmentManager.listAttachments({
                    tableName: 'incident',
                    recordSysId: incidentSysId
                });

                console.log('List result:', JSON.stringify(attachments, null, 2));
                expect(attachments).toBeDefined();
                expect(Array.isArray(attachments)).toBe(true);
                expect(attachments.length).toBe(1);

                // Get
                const fetched = await attachmentManager.getAttachment(uploaded.sys_id);

                console.log('Get result:', JSON.stringify(fetched, null, 2));
                expect(fetched).toBeDefined();
                expect(fetched.file_name).toBe('test_file.txt');
            } finally {
                if (incidentSysId) {
                    await deleteIncident(incidentSysId);
                    console.log('Cleaned up incident:', incidentSysId);
                }
            }
        }, 100000);
    });
});

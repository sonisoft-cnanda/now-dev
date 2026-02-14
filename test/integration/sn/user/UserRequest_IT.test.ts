import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';
import { UserRequest } from '../../../../src/sn/user/UserRequest';
import { TableAPIRequest } from '../../../../src/comm/http/TableAPIRequest';
import { IUser } from '../../../../src/sn/user/model/IUser';

const SECONDS = 1000;

describe('UserRequest Integration Tests', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;

    beforeEach(async () => {
        credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
        }

        if (!instance) throw new Error("Could not get credentials.");
    });

    describe('getUser', () => {
        it('should get admin user by sys_id', async () => {
            // First, find the admin user's sys_id via TableAPI
            const tableAPI = new TableAPIRequest(instance);
            const lookupResp = await tableAPI.get<any>('sys_user', {
                sysparm_query: 'user_name=admin',
                sysparm_limit: '1',
                sysparm_fields: 'sys_id'
            });

            expect(lookupResp.status).toBe(200);
            const adminSysId = lookupResp.bodyObject?.result?.[0]?.sys_id;
            expect(adminSysId).toBeDefined();

            console.log('\nAdmin sys_id:', adminSysId);

            // Now use UserRequest to get the user
            const userReq = new UserRequest(instance);
            const user: IUser = await userReq.getUser(adminSysId);

            console.log('\n=== UserRequest getUser response ===');
            console.log('User:', JSON.stringify(user, null, 2));

            expect(user).toBeDefined();
            expect(user).not.toBeNull();

            if (user) {
                console.log('\nUser record keys:', Object.keys(user).join(', '));
            }
        }, 60 * SECONDS);

        it('should return null for non-existent user sys_id', async () => {
            const userReq = new UserRequest(instance);
            const user: IUser = await userReq.getUser('nonexistent_sys_id_12345678901234');

            console.log('\n=== UserRequest getUser non-existent response ===');
            console.log('User:', user);

            expect(user).toBeNull();
        }, 60 * SECONDS);

        it('should capture full user record shape with all fields', async () => {
            // Get admin with all fields to capture the full payload shape
            const tableAPI = new TableAPIRequest(instance);
            const resp = await tableAPI.get<any>('sys_user', {
                sysparm_query: 'user_name=admin',
                sysparm_limit: '1',
                sysparm_display_value: 'true'
            });

            console.log('\n=== Full sys_user record (via TableAPI for payload capture) ===');
            console.log('Status:', resp.status);

            if (resp.bodyObject?.result?.length > 0) {
                const fullUser = resp.bodyObject.result[0];
                console.log('Full user payload:', JSON.stringify(fullUser, null, 2));
                console.log('\nAll field names:', Object.keys(fullUser).sort().join(', '));
                console.log('Total fields:', Object.keys(fullUser).length);
            }

            expect(resp.status).toBe(200);
        }, 60 * SECONDS);
    });
});

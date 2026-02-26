import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';
import { QueryBatchOperations } from '../../../../src/sn/batch/QueryBatchOperations';

const SECONDS = 1000;

describe('QueryBatchOperations - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let queryBatch: QueryBatchOperations;

    beforeAll(async () => {
        const credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            queryBatch = new QueryBatchOperations(instance);
        }

        if (!instance) throw new Error("Could not get credentials.");
    }, 300 * SECONDS);

    describe('queryUpdate - dry run', () => {
        it('should return match count without updating', async () => {
            const result = await queryBatch.queryUpdate({
                table: 'incident',
                query: 'active=true',
                data: { urgency: '3' },
                confirm: false,
                limit: 10
            });

            console.log(`\nDry run update result: ${result.matchCount} matches, ${result.updatedCount} updated`);

            expect(result.dryRun).toBe(true);
            expect(result.matchCount).toBeGreaterThanOrEqual(0);
            expect(result.updatedCount).toBe(0);
            expect(result.success).toBe(true);
        }, 30 * SECONDS);
    });

    describe('queryDelete - dry run', () => {
        it('should return match count without deleting', async () => {
            const result = await queryBatch.queryDelete({
                table: 'incident',
                query: 'short_descriptionLIKE[IT_TEST_QUERYBATCH_DELETE]',
                confirm: false,
                limit: 10
            });

            console.log(`\nDry run delete result: ${result.matchCount} matches, ${result.deletedCount} deleted`);

            expect(result.dryRun).toBe(true);
            expect(result.matchCount).toBeGreaterThanOrEqual(0);
            expect(result.deletedCount).toBe(0);
            expect(result.success).toBe(true);
        }, 30 * SECONDS);
    });
});

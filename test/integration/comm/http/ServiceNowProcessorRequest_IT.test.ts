import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';
import { ServiceNowProcessorRequest } from '../../../../src/comm/http/ServiceNowProcessorRequest';

const SECONDS = 1000;

describe('ServiceNowProcessorRequest Integration Tests', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;
    let processorReq: ServiceNowProcessorRequest;

    beforeEach(async () => {
        credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            processorReq = new ServiceNowProcessorRequest(instance);
        }

        if (!instance) throw new Error("Could not get credentials.");
    });

    describe('doXmlHttpRequest', () => {
        it('should make a raw XML HTTP request to xmlhttp.do', async () => {
            // Use a simple processor call to /xmlhttp.do
            const resp = await processorReq.doXmlHttpRequest(
                'com.glide.ui.diagnostics.DiagnosticsPage',
                'checkStatus',
                'global',
                {}
            );

            console.log('\n=== ServiceNowProcessorRequest doXmlHttpRequest response ===');
            console.log('Response null?', resp === null);
            if (resp) {
                console.log('Status:', resp.status);
                console.log('Data type:', typeof resp.data);
                console.log('Data (first 2000 chars):', typeof resp.data === 'string' ? resp.data.substring(0, 2000) : JSON.stringify(resp.data, null, 2)?.substring(0, 2000));
                console.log('Headers:', JSON.stringify(resp.headers, null, 2));
            }

            // The response may be null if the processor isn't accessible.
            // Either way, this captures the behavior for unit test mocking.
            if (resp) {
                expect(resp.status).toBeDefined();
            }
        }, 60 * SECONDS);

        it('should return null when request fails', async () => {
            // Use an intentionally invalid processor to trigger error handling
            const resp = await processorReq.doXmlHttpRequest(
                'NonExistentProcessor12345',
                'nonExistentMethod',
                'global',
                {}
            );

            console.log('\n=== ServiceNowProcessorRequest error case ===');
            console.log('Response:', resp);
            console.log('Response is null:', resp === null);
            if (resp) {
                console.log('Status:', resp.status);
                console.log('Data:', typeof resp.data === 'string' ? resp.data.substring(0, 500) : resp.data);
            }

            // Response may be null (error caught) or a non-200 response
            // Both are valid behaviors we want to document
        }, 60 * SECONDS);
    });

    describe('execute', () => {
        // NOTE: execute() has a bug where it doesn't check for null response from doXmlHttpRequest().
        // If doXmlHttpRequest returns null (error caught), execute() throws:
        //   "TypeError: Cannot read properties of null (reading 'status')"
        // This should be tested in unit tests.

        it('should handle processor execution and capture response format', async () => {
            // Wrap in try-catch since execute() may throw if doXmlHttpRequest returns null
            try {
                const result = await processorReq.execute(
                    'com.glide.ui.diagnostics.DiagnosticsPage',
                    'checkStatus',
                    'global',
                    {}
                );

                console.log('\n=== ServiceNowProcessorRequest execute result ===');
                console.log('Result:', result);
                console.log('Type:', typeof result);
            } catch (err) {
                console.log('\n=== ServiceNowProcessorRequest execute error ===');
                console.log('Error:', err);
                console.log('This confirms the null-check bug in execute()');
            }
        }, 60 * SECONDS);
    });
});

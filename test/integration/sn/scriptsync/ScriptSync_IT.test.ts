import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth/index.js';
import { SN_INSTANCE_ALIAS } from '../../../test_utils/test_config';

import { ScriptSync } from '../../../../src/sn/scriptsync/ScriptSync';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const SECONDS = 1000;

describe('ScriptSync - Integration Tests', () => {
    let instance: ServiceNowInstance;
    let credential: unknown;
    let scriptSync: ScriptSync;

    beforeEach(async () => {
        credential = await getCredentials(SN_INSTANCE_ALIAS);

        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: SN_INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            scriptSync = new ScriptSync(instance);
        }

        if (!instance) throw new Error('Could not get credentials.');
    });

    it('should pull a script include to a local file', async () => {
        const timestamp = Date.now();
        const tempFile = `/tmp/it_test_scriptsync_${timestamp}.js`;

        try {
            const result = await scriptSync.pullScript({
                scriptName: 'TableUtils',
                scriptType: 'sys_script_include',
                filePath: tempFile
            });

            console.log('\n=== pullScript ===');
            console.log('success:', result.success);
            console.log('sysId:', result.sysId);
            console.log('message:', result.message);
            console.log('filePath:', result.filePath);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.sysId).toBeDefined();
            expect(typeof result.sysId).toBe('string');

            // Verify the file was written and has content
            expect(fs.existsSync(tempFile)).toBe(true);
            const content = fs.readFileSync(tempFile, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            console.log('File size (bytes):', Buffer.byteLength(content, 'utf-8'));
        } finally {
            // Cleanup: delete temp file
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
                console.log(`Cleaned up temp file: ${tempFile}`);
            }
        }
    }, 120 * SECONDS);

    it('should push a script and verify round-trip', async () => {
        const timestamp = Date.now();
        const pullFile1 = `/tmp/it_test_scriptsync_pull1_${timestamp}.js`;
        const pullFile2 = `/tmp/it_test_scriptsync_pull2_${timestamp}.js`;
        let originalContent: string | null = null;

        try {
            // Step 1: Pull the original script
            const pullResult1 = await scriptSync.pullScript({
                scriptName: 'TableUtils',
                scriptType: 'sys_script_include',
                filePath: pullFile1
            });

            expect(pullResult1.success).toBe(true);
            originalContent = fs.readFileSync(pullFile1, 'utf-8');

            // Step 2: Append a test comment
            const testComment = `\n// IT_TEST comment ${timestamp}`;
            const modifiedContent = originalContent + testComment;
            fs.writeFileSync(pullFile1, modifiedContent, 'utf-8');

            // Step 3: Push the modified script back
            const pushResult = await scriptSync.pushScript({
                scriptName: 'TableUtils',
                scriptType: 'sys_script_include',
                filePath: pullFile1
            });

            console.log('\n=== pushScript round-trip ===');
            console.log('push success:', pushResult.success);
            console.log('push message:', pushResult.message);

            expect(pushResult.success).toBe(true);

            // Step 4: Pull again to verify the comment is present
            const pullResult2 = await scriptSync.pullScript({
                scriptName: 'TableUtils',
                scriptType: 'sys_script_include',
                filePath: pullFile2
            });

            expect(pullResult2.success).toBe(true);
            const pulledContent = fs.readFileSync(pullFile2, 'utf-8');
            expect(pulledContent).toContain(`// IT_TEST comment ${timestamp}`);
            console.log('Round-trip verification: comment found in re-pulled script');
        } finally {
            // ALWAYS restore original content, even if assertions fail
            if (originalContent !== null) {
                try {
                    // Write original content back to the first temp file and push
                    fs.writeFileSync(pullFile1, originalContent, 'utf-8');
                    const restoreResult = await scriptSync.pushScript({
                        scriptName: 'TableUtils',
                        scriptType: 'sys_script_include',
                        filePath: pullFile1
                    });
                    console.log('Restored original content, success:', restoreResult.success);
                } catch (restoreErr) {
                    console.error('CRITICAL: Failed to restore original script content:', restoreErr);
                }
            }

            // Cleanup: delete temp files
            if (fs.existsSync(pullFile1)) {
                fs.unlinkSync(pullFile1);
                console.log(`Cleaned up temp file: ${pullFile1}`);
            }
            if (fs.existsSync(pullFile2)) {
                fs.unlinkSync(pullFile2);
                console.log(`Cleaned up temp file: ${pullFile2}`);
            }
        }
    }, 120 * SECONDS);

    it('should sync all scripts in a directory', async () => {
        const timestamp = Date.now();
        const tempDir = path.join(os.tmpdir(), `it_test_scriptsync_dir_${timestamp}`);

        try {
            // Create temp directory with a test file
            fs.mkdirSync(tempDir, { recursive: true });

            const testFileName = 'TableUtils.sys_script_include.js';
            const testFilePath = path.join(tempDir, testFileName);
            fs.writeFileSync(testFilePath, '// IT_TEST syncAllScripts content', 'utf-8');

            const result = await scriptSync.syncAllScripts({
                directory: tempDir
            });

            console.log('\n=== syncAllScripts ===');
            console.log('totalFiles:', result.totalFiles);
            console.log('synced:', result.synced);
            console.log('failed:', result.failed);
            console.log('scripts:', JSON.stringify(result.scripts, null, 2));

            expect(result).toBeDefined();
            expect(result.totalFiles).toBeGreaterThanOrEqual(1);
        } finally {
            // Cleanup: remove temp dir and files
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                console.log(`Cleaned up temp directory: ${tempDir}`);
            }
        }
    }, 120 * SECONDS);

    it('should parse a valid file name', () => {
        const parsed = ScriptSync.parseFileName('MyScript.sys_script_include.js');

        console.log('\n=== parseFileName ===');
        console.log('parsed:', JSON.stringify(parsed, null, 2));

        expect(parsed).toBeDefined();
        expect(parsed.isValid).toBe(true);
        expect(parsed.scriptName).toBe('MyScript');
        expect(parsed.scriptType).toBe('sys_script_include');
    }, 60 * SECONDS);

    it('should generate a valid file name', () => {
        const fileName = ScriptSync.generateFileName('MyScript', 'sys_script_include');

        console.log('\n=== generateFileName ===');
        console.log('fileName:', fileName);

        expect(fileName).toBe('MyScript.sys_script_include.js');
    }, 60 * SECONDS);
});

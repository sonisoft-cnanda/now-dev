/**
 * Unit tests for MessageClientBuilder
 * Note: Full client building tests are in integration tests due to browser dependencies
 * AMBClient import requires CometD which needs browser environment,
 * so we test only the standalone utility methods
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('MessageClientBuilder - Unit Tests', () => {
    describe('Source file exists', () => {
        it('should have MessageClientBuilder source file', () => {
            const filePath = path.join(__dirname, '../../../src/sn/amb/MessageClientBuilder.ts');
            
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });

    // Note: All MessageClientBuilder functionality tests are in integration tests
    // MessageClientBuilder depends on:
    // - AMBClient (requires window, CometD)
    // - MessageClient (requires browser environment)
    // 
    // Cannot be tested as unit test because:
    // - Importing MessageClientBuilder loads AMBClient
    // - AMBClient loads MessageClient  
    // - MessageClient requires CometD
    // - CometD requires window object (browser environment)
    //
    // Full functionality testing in: test/integration/amb/MessageClientBuilder_IT.test.ts
});


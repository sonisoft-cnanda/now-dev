/**
 * Unit tests for AMBClient
 * Basic structural tests - full AMB tests are in integration tests
 * Note: AMBClient requires browser-like environment (window, WebSocket)
 * so full functionality testing is done in integration tests
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
describe('AMBClient - Unit Tests', () => {
    describe('Source files exist', () => {
        it('should have AMBClient source file', () => {
           
            const filePath = path.join(__dirname, '../../../src/sn/amb/AMBClient.ts');
            
            expect(fs.existsSync(filePath)).toBe(true);
        });

        it('should have MessageClient source file', () => {
          
            const filePath = path.join(__dirname, '../../../src/sn/amb/MessageClient.ts');
            
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });

    // Note: AMBClient cannot be unit tested without browser environment
    // AMBClient requires:
    // - window object (for CometD)
    // - WebSocket support
    // - MessageClient (which loads CometD)
    //
    // Cannot be imported in Node.js test environment because:
    // - MessageClient imports CometD
    // - CometD requires window.document
    // - No window in Node.js
    //
    // Full functionality testing in: test/integration/amb/AMBClient_updated_IT.test.ts
});

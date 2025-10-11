#!/usr/bin/env node
/**
 * ServiceNow Syslog Tail - Simple JavaScript Version
 * 
 * This is a pure JavaScript (ES Module) version that runs directly with Node.js
 * without needing TypeScript compilation or tsx.
 * 
 * Usage:
 *   node syslog-tail.mjs tanengdev012
 *   node syslog-tail.mjs tanengdev012 error
 *   node syslog-tail.mjs tanengdev012 error ./logs/tail.log
 *   node syslog-tail.mjs tanengdev012 all ./logs/all.log 3000
 * 
 * Arguments:
 *   1. Instance alias (required)
 *   2. Log level filter: error, warn, info, debug, or "all" (default: all)
 *   3. Output file path (optional)
 *   4. Poll interval in ms (default: 5000)
 */

import { SyslogReader, ServiceNowInstance } from '../../dist/index.js';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth/index.js';

// Parse command line arguments
const [,, instanceAlias, logLevel, outputFile, pollInterval] = process.argv;

if (!instanceAlias) {
    console.error('❌ Error: Instance alias is required');
    console.error('Usage: node syslog-tail.mjs <instance-alias> [level] [output-file] [interval]');
    console.error('Example: node syslog-tail.mjs tanengdev012 error ./logs/errors.log 3000');
    process.exit(1);
}

const level = logLevel && logLevel !== 'all' ? logLevel : null;
const interval = parseInt(pollInterval) || 5000;

async function main() {
    try {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  ServiceNow Syslog Tail');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        // Get credentials
        console.log(`🔌 Connecting to: ${instanceAlias}...`);
        const credential = await getCredentials(instanceAlias);
        
        if (!credential) {
            console.error(`❌ No credentials found for: ${instanceAlias}`);
            console.error('   Configure with: snc configure profile set');
            process.exit(1);
        }
        
        // Create instance
        const instance = new ServiceNowInstance({
            alias: instanceAlias,
            credential: credential
        });
        
        const syslogReader = new SyslogReader(instance);
        console.log('✅ Connected\n');
        
        // Build query
        let query = 'ORDERBYDESCsys_created_on';
        if (level) {
            query = `level=${level}^${query}`;
        }
        
        // Display configuration
        console.log('📋 Configuration:');
        console.log(`   Instance:       ${instanceAlias}`);
        console.log(`   Table:          syslog`);
        console.log(`   Poll Interval:  ${interval}ms`);
        if (level) {
            console.log(`   Log Level:      ${level}`);
        } else {
            console.log(`   Log Level:      all`);
        }
        if (outputFile) {
            console.log(`   Output File:    ${outputFile}`);
        }
        console.log('');
        
        // Handle Ctrl+C gracefully
        process.on('SIGINT', () => {
            console.log('\n\n⏹️  Stopping tail...');
            syslogReader.stopTailing();
            console.log('✅ Stopped. Goodbye!\n');
            process.exit(0);
        });
        
        // Start tailing
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  Tailing logs... (Press Ctrl+C to stop)');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        let logCount = 0;
        
        await syslogReader.startTailing('syslog', {
            interval: interval,
            initialLimit: 10,
            query: query,
            onLog: (log) => {
                logCount++;
                
                // Format timestamp
                const timestamp = new Date(log.sys_created_on).toLocaleString();
                
                // Color codes
                const colors = {
                    'error': '\x1b[31m',   // Red
                    'warn': '\x1b[33m',    // Yellow
                    'info': '\x1b[32m',    // Green
                    'debug': '\x1b[36m'    // Cyan
                };
                const reset = '\x1b[0m';
                const color = colors[log.level.toLowerCase()] || '';
                
                // Print formatted log
                console.log('─────────────────────────────────────────────────────────────');
                console.log(`⏰ ${timestamp}`);
                console.log(`📊 ${color}${log.level.toUpperCase()}${reset}`);
                console.log(`📁 ${log.source}`);
                console.log(`💬 ${log.message}`);
                console.log(`#${logCount}\n`);
            },
            outputFile: outputFile,
            append: true,
            formatOptions: {
                fields: ['sys_created_on', 'level', 'source', 'message'],
                maxMessageWidth: 80,
                dateFormat: 'locale'
            }
        });
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Run
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});


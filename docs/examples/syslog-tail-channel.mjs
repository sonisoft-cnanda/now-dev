#!/usr/bin/env node
/**
 * ServiceNow Log Tail using ChannelAjax - More efficient real-time log tailing
 * 
 * This version uses the ChannelAjax processor which is more efficient than 
 * polling the Table API as it uses sequence numbers to track log position.
 * 
 * Usage:
 *   node syslog-tail-channel.mjs tanengdev012
 *   node syslog-tail-channel.mjs tanengdev012 ./logs/tail.log
 *   node syslog-tail-channel.mjs tanengdev012 ./logs/tail.log 1000
 * 
 * Arguments:
 *   1. Instance alias (required)
 *   2. Output file path (optional)
 *   3. Poll interval in ms (default: 1000)
 */

import { SyslogReader, ServiceNowInstance } from '../../dist/index.js';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth/index.js';

// Parse command line arguments
const [,, instanceAlias, outputFile, pollInterval] = process.argv;

if (!instanceAlias) {
    console.error('❌ Error: Instance alias is required');
    console.error('Usage: node syslog-tail-channel.mjs <instance-alias> [output-file] [interval]');
    console.error('Example: node syslog-tail-channel.mjs tanengdev012 ./logs/tail.log 1000');
    process.exit(1);
}

const interval = parseInt(pollInterval) || 1000;

async function main() {
    try {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  ServiceNow Log Tail (ChannelAjax)');
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
        
        // Display configuration
        console.log('📋 Configuration:');
        console.log(`   Instance:       ${instanceAlias}`);
        console.log(`   Method:         ChannelAjax logtail`);
        console.log(`   Poll Interval:  ${interval}ms`);
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
        
        await syslogReader.startTailingWithChannelAjax({
            interval: interval,
            onLog: (log) => {
                logCount++;
                
                // Format timestamp
                const timestamp = new Date(log.sys_created_on).toLocaleString();
                
                // Print formatted log with sequence number
                console.log('─────────────────────────────────────────────────────────────');
                console.log(`⏰ ${timestamp}`);
                console.log(`🔢 Sequence: ${log.sequence || 'N/A'}`);
                console.log(`💬 ${log.message}`);
                console.log(`#${logCount}\n`);
            },
            outputFile: outputFile,
            append: true
        });
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});


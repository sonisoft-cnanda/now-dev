#!/usr/bin/env node
/**
 * ServiceNow Syslog Tail CLI Tool
 * 
 * This example demonstrates how to create a CLI tool that tails ServiceNow
 * syslog tables in real-time, similar to the Unix 'tail -f' command.
 * 
 * Usage:
 *   tsx syslog-tail-cli.ts --instance tanengdev012
 *   tsx syslog-tail-cli.ts --instance tanengdev012 --level error
 *   tsx syslog-tail-cli.ts --instance tanengdev012 --output ./logs/tail.log
 *   tsx syslog-tail-cli.ts --instance tanengdev012 --table syslog_app_scope --query "app_scope=x_my_app"
 * 
 * Alternative (after building):
 *   node --loader ts-node/esm syslog-tail-cli.ts --instance tanengdev012
 */

import { SyslogReader, ServiceNowInstance, ServiceNowSettingsInstance } from '../../src';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";

// Parse command line arguments
const args = process.argv.slice(2);
const options: Record<string, string> = {};

for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    if (value && !value.startsWith('--')) {
        options[key] = value;
    }
}

// Configuration
const instanceAlias = options.instance || 'tanengdev012';
const tableName = (options.table || 'syslog') as 'syslog' | 'syslog_app_scope';
const logLevel = options.level;
const outputFile = options.output;
const pollInterval = parseInt(options.interval || '5000');
const initialLimit = parseInt(options.limit || '10');

async function main() {
    try {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  ServiceNow Syslog Tail - Real-time Log Monitoring');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        // Get credentials and create instance
        console.log(`🔌 Connecting to instance: ${instanceAlias}...`);
        const credential = await getCredentials(instanceAlias);
        
        if (!credential) {
            console.error(`❌ No credentials found for instance alias: ${instanceAlias}`);
            console.error('   Configure credentials using: snc configure profile set');
            process.exit(1);
        }
        
        const snSettings: ServiceNowSettingsInstance = {
            alias: instanceAlias,
            credential: credential
        };
        const instance = new ServiceNowInstance(snSettings);
        const syslogReader = new SyslogReader(instance);
        
        console.log('✅ Connected successfully\n');
        
        // Build query
        let query = options.query || 'ORDERBYDESCsys_created_on';
        if (logLevel) {
            query = `level=${logLevel}^${query}`;
        }
        
        // Display configuration
        console.log('📋 Configuration:');
        console.log(`   Table:          ${tableName}`);
        console.log(`   Poll Interval:  ${pollInterval}ms`);
        console.log(`   Initial Limit:  ${initialLimit}`);
        if (logLevel) {
            console.log(`   Log Level:      ${logLevel}`);
        }
        if (outputFile) {
            console.log(`   Output File:    ${outputFile}`);
        }
        if (options.query) {
            console.log(`   Custom Query:   ${options.query}`);
        }
        console.log('');
        
        // Handle Ctrl+C gracefully
        process.on('SIGINT', () => {
            console.log('\n\n⏹️  Stopping tail...');
            syslogReader.stopTailing();
            console.log('✅ Tail stopped. Goodbye!\n');
            process.exit(0);
        });
        
        // Start tailing
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  Tailing logs... (Press Ctrl+C to stop)');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        let logCount = 0;
        
        await syslogReader.startTailing(tableName, {
            interval: pollInterval,
            initialLimit: initialLimit,
            query: query,
            onLog: (log) => {
                logCount++;
                
                // Format timestamp
                const timestamp = new Date(log.sys_created_on).toLocaleString();
                
                // Color code based on level
                const levelColors: Record<string, string> = {
                    'error': '\x1b[31m',   // Red
                    'warn': '\x1b[33m',    // Yellow
                    'info': '\x1b[32m',    // Green
                    'debug': '\x1b[36m'    // Cyan
                };
                const reset = '\x1b[0m';
                const color = levelColors[log.level.toLowerCase()] || '';
                
                // Print log entry
                console.log(`─────────────────────────────────────────────────────────────`);
                console.log(`⏰ ${timestamp}`);
                console.log(`📊 ${color}${log.level.toUpperCase()}${reset}`);
                console.log(`📁 ${log.source}`);
                console.log(`💬 ${log.message}`);
                
                if ('app_scope' in log) {
                    console.log(`📦 App: ${(log as any).app_scope}`);
                }
                
                console.log(`#${logCount}\n`);
            },
            formatOptions: {
                fields: tableName === 'syslog_app_scope' 
                    ? ['sys_created_on', 'level', 'app_scope', 'source', 'message']
                    : ['sys_created_on', 'level', 'source', 'message'],
                maxMessageWidth: 80,
                dateFormat: 'locale'
            },
            outputFile: outputFile,
            append: true
        });
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

// Run the CLI tool
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});


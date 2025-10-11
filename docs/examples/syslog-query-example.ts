/**
 * ServiceNow Syslog Query Examples
 * 
 * This file demonstrates various ways to query ServiceNow syslog tables
 * using the SyslogReader class with encoded query strings.
 */

import { SyslogReader, ServiceNowInstance, ServiceNowSettingsInstance } from '../../src';
import { getCredentials } from "@servicenow/sdk-cli/dist/auth/index.js";

async function queryExamples() {
    // Setup instance
    const instanceAlias = 'tanengdev012';
    const credential = await getCredentials(instanceAlias);
    
    const snSettings: ServiceNowSettingsInstance = {
        alias: instanceAlias,
        credential: credential!
    };
    const instance = new ServiceNowInstance(snSettings);
    const syslogReader = new SyslogReader(instance);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ServiceNow Syslog Query Examples');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Example 1: Get recent error logs
    console.log('1️⃣  Recent Error Logs');
    console.log('─────────────────────────────────────────────────────────────');
    const errorLogs = await syslogReader.querySyslog(
        'level=error^ORDERBYDESCsys_created_on',
        10
    );
    console.log(`Found ${errorLogs.length} error logs:\n`);
    syslogReader.printTable(errorLogs, {
        fields: ['sys_created_on', 'level', 'source', 'message'],
        maxMessageWidth: 60,
        dateFormat: 'relative'
    });
    
    // Example 2: Get logs from last hour
    console.log('\n\n2️⃣  Logs from Last Hour');
    console.log('─────────────────────────────────────────────────────────────');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentLogs = await syslogReader.querySyslog(
        `sys_created_on>${oneHourAgo}^ORDERBYDESCsys_created_on`,
        20
    );
    console.log(`Found ${recentLogs.length} logs in last hour\n`);
    if (recentLogs.length > 0) {
        syslogReader.printTable(recentLogs.slice(0, 5), {
            fields: ['sys_created_on', 'level', 'message'],
            maxMessageWidth: 70,
            dateFormat: 'locale'
        });
    }
    
    // Example 3: Errors or warnings from specific source
    console.log('\n\n3️⃣  Errors/Warnings from Security Sources');
    console.log('─────────────────────────────────────────────────────────────');
    const securityLogs = await syslogReader.querySyslog(
        'level=error^ORlevel=warn^sourceSTARTSWITHsecurity^ORDERBYDESCsys_created_on',
        15
    );
    console.log(`Found ${securityLogs.length} security-related warnings/errors\n`);
    if (securityLogs.length > 0) {
        syslogReader.printTable(securityLogs.slice(0, 3), {
            fields: ['sys_created_on', 'level', 'source', 'message'],
            maxMessageWidth: 60
        });
    }
    
    // Example 4: App scope logs for custom applications
    console.log('\n\n4️⃣  Custom Application Logs');
    console.log('─────────────────────────────────────────────────────────────');
    const appLogs = await syslogReader.querySyslogAppScope(
        'app_scopeSTARTSWITHx_^ORDERBYDESCsys_created_on',
        10
    );
    console.log(`Found ${appLogs.length} custom app logs\n`);
    if (appLogs.length > 0) {
        syslogReader.printTable(appLogs, {
            fields: ['sys_created_on', 'level', 'app_scope', 'message'],
            maxMessageWidth: 50
        });
    }
    
    // Example 5: Export logs to different formats
    console.log('\n\n5️⃣  Export Logs');
    console.log('─────────────────────────────────────────────────────────────');
    const logsToExport = await syslogReader.querySyslog(
        'level=error^ORlevel=warn^ORDERBYDESCsys_created_on',
        50
    );
    
    const exportDir = './tmp/syslog-exports';
    await syslogReader.saveToFile(logsToExport, `${exportDir}/errors-warnings.json`, 'json');
    await syslogReader.saveToFile(logsToExport, `${exportDir}/errors-warnings.csv`, 'csv');
    await syslogReader.saveToFile(logsToExport, `${exportDir}/errors-warnings.txt`, 'table');
    
    console.log(`✅ Exported ${logsToExport.length} logs to:`);
    console.log(`   📄 ${exportDir}/errors-warnings.json`);
    console.log(`   📊 ${exportDir}/errors-warnings.csv`);
    console.log(`   📝 ${exportDir}/errors-warnings.txt`);
    
    // Example 6: Complex query with multiple conditions
    console.log('\n\n6️⃣  Complex Query Example');
    console.log('─────────────────────────────────────────────────────────────');
    const complexQuery = [
        'level=error',                          // Error level
        'messageSTARTSWITHFailed',             // Message starts with "Failed"
        `sys_created_on>${oneHourAgo}`,        // From last hour
        'ORDERBYDESCsys_created_on'            // Order by newest first
    ].join('^');
    
    const complexResults = await syslogReader.querySyslog(complexQuery, 10);
    console.log(`Query: ${complexQuery}`);
    console.log(`\nFound ${complexResults.length} matching logs\n`);
    if (complexResults.length > 0) {
        syslogReader.printTable(complexResults, {
            fields: ['sys_created_on', 'level', 'message'],
            maxMessageWidth: 70,
            dateFormat: 'relative'
        });
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Examples Complete!');
    console.log('═══════════════════════════════════════════════════════════\n');
}

// Common Encoded Query Patterns
function printEncodedQueryReference() {
    console.log('\n📚 Encoded Query String Reference:\n');
    console.log('Basic Operators:');
    console.log('  =              Equals:           level=error');
    console.log('  !=             Not equals:       level!=info');
    console.log('  >              Greater than:     sys_created_on>2025-01-01');
    console.log('  <              Less than:        sys_created_on<2025-12-31');
    console.log('  STARTSWITH     Starts with:      sourceSTARTSWITHsecurity');
    console.log('  CONTAINS       Contains:         messageCONTAINSfailed');
    console.log('  IN             In list:          levelINerror,warn');
    console.log('  NOT IN         Not in list:      levelNOT INdebug,info\n');
    
    console.log('Logical Operators:');
    console.log('  ^              AND:              level=error^sourceSTARTSWITHauth');
    console.log('  ^OR            OR:               level=error^ORlevel=warn');
    console.log('  ^NQ            New Query (OR):   level=error^NQlevel=warn\n');
    
    console.log('Ordering:');
    console.log('  ORDERBY        Ascending:        ORDERBYsys_created_on');
    console.log('  ORDERBYDESC    Descending:       ORDERBYDESCsys_created_on\n');
}

// Run examples
if (require.main === module) {
    printEncodedQueryReference();
    queryExamples().catch(console.error);
}

export { queryExamples, printEncodedQueryReference };


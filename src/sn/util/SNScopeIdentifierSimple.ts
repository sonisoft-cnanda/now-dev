/**
 * Simple ServiceNow Sys ID Detection
 * 
 * Quick utility functions to identify ServiceNow sys_id values vs application scope names
 */

// Regex pattern for ServiceNow sys_id (32 hex characters, lowercase)
var SYS_ID_PATTERN = /^[0-9a-f]{32}$/;

/**
 * Checks if a string is a ServiceNow sys_id
 * @param {string} value - String to check
 * @returns {boolean} - True if it's a sys_id
 */
function isSysId(value) {
    return value && typeof value === 'string' && SYS_ID_PATTERN.test(value);
}

/**
 * Checks if a string is likely an application scope name
 * @param {string} value - String to check  
 * @returns {boolean} - True if likely a scope name
 */
function isApplicationScope(value) {
    if (!value || typeof value !== 'string') {
        return false;
    }
    
    // Scope names: start with letter, contain letters/numbers/underscores/hyphens, not 32 hex chars
    return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value) && 
           value.length !== 32 && 
           !isSysId(value);
}

/**
 * Determines the type of ServiceNow identifier
 * @param {string} value - String to analyze
 * @returns {string} - 'sys_id', 'scope', or 'other'
 */
function getIdentifierType(value) {
    if (isSysId(value)) {
        return 'sys_id';
    }
    if (isApplicationScope(value)) {
        return 'scope';
    }
    return 'other';
}

// Test the functions
function testIdentifierDetection() {
    gs.info('=== Testing ServiceNow Identifier Detection ===');
    
    var testValues = [
        'c4134c50db6ec910495d70f339961931',  // sys_id
        'x_taniu_tan_core',                   // scope
        'sn_incident',                        // scope
        'This is a display name',             // other
        'c4134c50db6ec910495d70f33996193g',  // invalid (contains 'g')
        'c4134c50db6ec910495d70f33996193',   // invalid (31 chars)
        '1234567890abcdef1234567890abcdef'   // sys_id
    ];
    
    testValues.forEach(function(value) {
        var type = getIdentifierType(value);
        gs.info('Value: "' + value + '" -> Type: ' + type);
    });
}

// Run tests
testIdentifierDetection();
/**
 * ServiceNow Sys ID Detection Utility
 * 
 * This script provides functions to reliably identify ServiceNow sys_id values
 * vs application scope names or other strings.
 * 
 * ServiceNow sys_id characteristics:
 * - Always exactly 32 characters long
 * - Contains only hexadecimal characters (0-9, a-f)
 * - No uppercase letters (ServiceNow stores them in lowercase)
 * - Specific pattern that distinguishes it from other 32-char strings
 */

(function() {
    'use strict';
    
    /**
     * Regular expression to match ServiceNow sys_id pattern
     * Pattern: exactly 32 hexadecimal characters (lowercase)
     */
    const SYS_ID_REGEX = /^[0-9a-f]{32}$/;
    
    /**
     * Alternative regex for case-insensitive matching (if needed)
     * Pattern: exactly 32 hexadecimal characters (case insensitive)
     */
    const SYS_ID_REGEX_CASE_INSENSITIVE = /^[0-9a-fA-F]{32}$/i;
    
    /**
     * Checks if a string is a valid ServiceNow sys_id
     * @param {string} value - The string to check
     * @param {boolean} caseSensitive - Whether to enforce lowercase (default: true)
     * @returns {boolean} - True if the string is a sys_id, false otherwise
     */
    function isSysId(value, caseSensitive = true) {
        if (!value || typeof value !== 'string') {
            return false;
        }
        
        const regex = caseSensitive ? SYS_ID_REGEX : SYS_ID_REGEX_CASE_INSENSITIVE;
        return regex.test(value);
    }
    
    /**
     * Checks if a string is likely an application scope name
     * @param {string} value - The string to check
     * @returns {boolean} - True if likely an application scope name
     */
    function isApplicationScope(value) {
        if (!value || typeof value !== 'string') {
            return false;
        }
        
        // Application scope names typically:
        // - Start with a letter
        // - Contain letters, numbers, underscores, and hyphens
        // - Are not exactly 32 characters of hex
        // - Often contain underscores or hyphens
        const scopeRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
        
        return scopeRegex.test(value) && 
               value.length !== 32 && 
               !isSysId(value);
    }
    
    /**
     * Determines the type of ServiceNow identifier
     * @param {string} value - The string to analyze
     * @returns {string} - 'sys_id', 'scope', 'other', or 'invalid'
     */
    function identifyServiceNowValue(value) {
        if (!value || typeof value !== 'string') {
            return 'invalid';
        }
        
        if (isSysId(value)) {
            return 'sys_id';
        }
        
        if (isApplicationScope(value)) {
            return 'scope';
        }
        
        return 'other';
    }
    
    /**
     * Validates and provides detailed information about a ServiceNow identifier
     * @param {string} value - The string to analyze
     * @returns {object} - Detailed analysis object
     */
    function analyzeServiceNowValue(value) {
        const result = {
            value: value,
            type: identifyServiceNowValue(value),
            isValid: false,
            length: value ? value.length : 0,
            isHex: false,
            isLowercase: false,
            details: {}
        };
        
        if (!value || typeof value !== 'string') {
            result.details.error = 'Value is not a valid string';
            return result;
        }
        
        result.isValid = result.type !== 'invalid';
        result.isHex = /^[0-9a-fA-F]+$/.test(value);
        result.isLowercase = value === value.toLowerCase();
        
        switch (result.type) {
            case 'sys_id':
                result.details = {
                    description: 'Valid ServiceNow sys_id',
                    characteristics: [
                        'Exactly 32 characters',
                        'Hexadecimal characters only',
                        'Lowercase format',
                        'Unique identifier for ServiceNow records'
                    ]
                };
                break;
                
            case 'scope':
                result.details = {
                    description: 'Likely ServiceNow application scope',
                    characteristics: [
                        'Starts with letter',
                        'Contains letters, numbers, underscores, hyphens',
                        'Not exactly 32 hex characters',
                        'Application identifier'
                    ]
                };
                break;
                
            case 'other':
                result.details = {
                    description: 'Other string value',
                    characteristics: [
                        'Does not match sys_id pattern',
                        'Does not match scope pattern',
                        'Could be display name, description, etc.'
                    ]
                };
                break;
                
            default:
                result.details = {
                    description: 'Invalid value',
                    characteristics: ['Not a valid string']
                };
        }
        
        return result;
    }
    
    // Test cases and examples
    function runTests() {
        gs.info('=== ServiceNow Sys ID Detection Tests ===');
        
        const testCases = [
            // Valid sys_id values
            'c4134c50db6ec910495d70f339961931',
            'a1b2c3d4e5f6789012345678901234ab',
            '1234567890abcdef1234567890abcdef',
            '00000000000000000000000000000000',
            'ffffffffffffffffffffffffffffffff',
            
            // Invalid sys_id values (wrong length)
            'c4134c50db6ec910495d70f33996193',  // 31 chars
            'c4134c50db6ec910495d70f3399619310', // 33 chars
            
            // Invalid sys_id values (wrong characters)
            'c4134c50db6ec910495d70f33996193g',  // contains 'g'
            'c4134c50db6ec910495d70f33996193G',  // uppercase
            'c4134c50db6ec910495d70f33996193-',  // contains hyphen
            
            // Application scope names
            'x_taniu_tan_core',
            'sn_incident',
            'sys_user',
            'global',
            'my_custom_app',
            'test-scope-name',
            
            // Other strings
            'This is a display name',
            'Description with spaces',
            'Mixed123Case',
            'special@chars#here',
            
            // Edge cases
            '',
            null,
            undefined,
            12345,
            {}
        ];
        
        testCases.forEach(function(testValue, index) {
            const analysis = analyzeServiceNowValue(testValue);
            gs.info('Test ' + (index + 1) + ': "' + testValue + '"');
            gs.info('  Type: ' + analysis.type);
            gs.info('  Valid: ' + analysis.isValid);
            gs.info('  Length: ' + analysis.length);
            gs.info('  Description: ' + analysis.details.description);
            gs.info('---');
        });
        
        gs.info('=== Test Summary ===');
        gs.info('Total tests: ' + testCases.length);
        
        const sysIdCount = testCases.filter(function(value) {
            return isSysId(value);
        }).length;
        
        const scopeCount = testCases.filter(function(value) {
            return isApplicationScope(value);
        }).length;
        
        gs.info('Sys ID matches: ' + sysIdCount);
        gs.info('Scope matches: ' + scopeCount);
    }
    
    // Export functions for use in other scripts
    window.ServiceNowIdentifierUtils = {
        isSysId: isSysId,
        isApplicationScope: isApplicationScope,
        identifyServiceNowValue: identifyServiceNowValue,
        analyzeServiceNowValue: analyzeServiceNowValue,
        runTests: runTests
    };
    
    // Run tests automatically
    runTests();
    
})();

// Usage examples:
/*
// Basic usage
if (ServiceNowIdentifierUtils.isSysId('c4134c50db6ec910495d70f339961931')) {
    gs.info('This is a sys_id');
}

// Check if it's an application scope
if (ServiceNowIdentifierUtils.isApplicationScope('x_taniu_tan_core')) {
    gs.info('This is an application scope');
}

// Get detailed analysis
var analysis = ServiceNowIdentifierUtils.analyzeServiceNowValue('c4134c50db6ec910495d70f339961931');
gs.info('Type: ' + analysis.type);
gs.info('Description: ' + analysis.details.description);

// In a business rule or script
var inputValue = 'c4134c50db6ec910495d70f339961931';
var identifierType = ServiceNowIdentifierUtils.identifyServiceNowValue(inputValue);

switch (identifierType) {
    case 'sys_id':
        // Handle as sys_id
        var gr = new GlideRecord('sys_user');
        gr.get(inputValue);
        break;
        
    case 'scope':
        // Handle as application scope
        var appScope = inputValue;
        break;
        
    case 'other':
        // Handle as other string (maybe display name)
        var displayName = inputValue;
        break;
        
    default:
        gs.error('Invalid identifier: ' + inputValue);
}
*/
/**
 * Unit tests for SyslogReader
 * Uses mocks instead of real credentials
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';
import { createGetCredentialsMock } from '../../__mocks__/servicenow-sdk-mocks';
import { SyslogReader } from '../../../../src/sn/syslog/SyslogReader';

// Mock getCredentials
const mockGetCredentials = createGetCredentialsMock();
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: mockGetCredentials
}));

describe('SyslogReader - Unit Tests', () => {
    let instance: ServiceNowInstance;
    let syslogReader: SyslogReader;
    const INSTANCE_ALIAS = 'test-instance';

    beforeEach(async () => {
        jest.clearAllMocks();
        
        const credential = await mockGetCredentials(INSTANCE_ALIAS);
        
        if (credential) {
            const snSettings: ServiceNowSettingsInstance = {
                alias: INSTANCE_ALIAS,
                credential: credential
            };
            instance = new ServiceNowInstance(snSettings);
            syslogReader = new SyslogReader(instance);
        }
    });

    describe('Constructor', () => {
        it('should create instance with ServiceNow instance', () => {
            expect(syslogReader).toBeInstanceOf(SyslogReader);
            expect((syslogReader as any)._instance).toBe(instance);
        });

        it('should initialize TableAPIRequest', () => {
            expect((syslogReader as any)._tableAPI).toBeDefined();
        });

        it('should initialize ServiceNowProcessorRequest', () => {
            expect((syslogReader as any)._processorRequest).toBeDefined();
        });

        it('should initialize logger', () => {
            expect((syslogReader as any)._logger).toBeDefined();
        });

        it('should not be tailing initially', () => {
            expect(syslogReader.isTailing).toBe(false);
        });
    });

    describe('Properties', () => {
        it('should have SYSLOG_TABLE constant', () => {
            expect((syslogReader as any).SYSLOG_TABLE).toBe('syslog');
        });

        it('should have SYSLOG_APP_SCOPE_TABLE constant', () => {
            expect((syslogReader as any).SYSLOG_APP_SCOPE_TABLE).toBe('syslog_app_scope');
        });

        it('should track tailing state', () => {
            expect(syslogReader.isTailing).toBe(false);
            (syslogReader as any)._isTailing = true;
            expect(syslogReader.isTailing).toBe(true);
        });
    });

    describe('Method existence', () => {
        it('should have querySyslog method', () => {
            expect(typeof syslogReader.querySyslog).toBe('function');
        });

        it('should have querySyslogAppScope method', () => {
            expect(typeof syslogReader.querySyslogAppScope).toBe('function');
        });

        it('should have formatAsTable method', () => {
            expect(typeof syslogReader.formatAsTable).toBe('function');
        });

        it('should have printTable method', () => {
            expect(typeof syslogReader.printTable).toBe('function');
        });

        it('should have saveToFile method', () => {
            expect(typeof syslogReader.saveToFile).toBe('function');
        });

        it('should have startTailing method', () => {
            expect(typeof syslogReader.startTailing).toBe('function');
        });

        it('should have startTailingWithChannelAjax method', () => {
            expect(typeof syslogReader.startTailingWithChannelAjax).toBe('function');
        });

        it('should have stopTailing method', () => {
            expect(typeof syslogReader.stopTailing).toBe('function');
        });
    });

    describe('stopTailing', () => {
        it('should clear interval when stopping', () => {
            (syslogReader as any)._tailInterval = setInterval(() => {}, 1000);
            (syslogReader as any)._isTailing = true;
            
            syslogReader.stopTailing();
            
            expect((syslogReader as any)._tailInterval).toBeUndefined();
            expect((syslogReader as any)._isTailing).toBe(false);
        });

        it('should reset sequence when stopping', () => {
            (syslogReader as any)._lastSequence = '12345';
            (syslogReader as any)._isTailing = true;
            
            syslogReader.stopTailing();
            
            expect((syslogReader as any)._lastSequence).toBeUndefined();
        });

        it('should reset lastFetchedSysId when stopping', () => {
            (syslogReader as any)._lastFetchedSysId = 'abc123';
            (syslogReader as any)._isTailing = true;
            
            syslogReader.stopTailing();
            
            expect((syslogReader as any)._lastFetchedSysId).toBeUndefined();
        });

        it('should handle stopping when not tailing', () => {
            expect(() => syslogReader.stopTailing()).not.toThrow();
        });
    });

    describe('Tailing state', () => {
        it('should prevent starting tail when already tailing', async () => {
            (syslogReader as any)._isTailing = true;
            
            await expect(syslogReader.startTailing('syslog', {})).rejects.toThrow(
                'Already tailing logs'
            );
        });

        it('should prevent starting ChannelAjax tail when already tailing', async () => {
            (syslogReader as any)._isTailing = true;
            
            await expect(syslogReader.startTailingWithChannelAjax({})).rejects.toThrow(
                'Already tailing logs'
            );
        });
    });

    describe('formatAsTable', () => {
        it('should handle empty records', () => {
            const result = syslogReader.formatAsTable([]);
            expect(result).toBe('No records found.');
        });

        it('should format records with default options', () => {
            const records = [
                {
                    sys_id: '123',
                    sys_created_on: '2024-01-01T10:00:00',
                    level: 'error',
                    message: 'Test message',
                    source: 'test'
                }
            ];
            
            const result = syslogReader.formatAsTable(records as any);
            expect(result).toContain('┌');
            expect(result).toContain('└');
            // Check for table structure and content (level may be colorized/truncated)
            expect(result).toContain('LEVEL');
            expect(result).toContain('MESSAGE');
            expect(result.toUpperCase()).toContain('TEST MESSAGE');
        });
    });

    // Note: Actual API call tests (querySyslog, startTailing, etc.) are in integration tests
    // These unit tests focus on logic, state management, and initialization
});

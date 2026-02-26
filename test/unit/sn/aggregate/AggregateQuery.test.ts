/**
 * Unit tests for AggregateQuery
 * Tests aggregate operations against the ServiceNow Stats API
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AggregateQuery } from '../../../../src/sn/aggregate/AggregateQuery';
import { IHttpResponse } from '../../../../src/comm/http/IHttpResponse';
import { MockAuthenticationHandler, createGetCredentialsMock } from '../../__mocks__/servicenow-sdk-mocks';
import { AuthenticationHandlerFactory } from '../../../../src/auth/AuthenticationHandlerFactory';
import { RequestHandlerFactory } from '../../../../src/comm/http/RequestHandlerFactory';
import { ServiceNowInstance, ServiceNowSettingsInstance } from '../../../../src/sn/ServiceNowInstance';

// Mock dependencies
jest.mock('../../../../src/auth/AuthenticationHandlerFactory');
jest.mock('../../../../src/comm/http/RequestHandlerFactory');
jest.mock('@servicenow/sdk-cli/dist/auth/index.js', () => ({
    getCredentials: createGetCredentialsMock()
}));

const mockGetCredentials = createGetCredentialsMock();

// Mock request handler
class MockRequestHandler {
    get = jest.fn<() => Promise<IHttpResponse<unknown>>>();
    post = jest.fn<() => Promise<IHttpResponse<unknown>>>();
    put = jest.fn<() => Promise<IHttpResponse<unknown>>>();
    delete = jest.fn<() => Promise<IHttpResponse<unknown>>>();
}

function createMockResponse(data: unknown, status: number = 200): IHttpResponse<unknown> {
    return {
        data,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        headers: {},
        config: {},
        bodyObject: data
    };
}

describe('AggregateQuery - Unit Tests', () => {
    let instance: ServiceNowInstance;
    let aggregateQuery: AggregateQuery;
    let mockAuthHandler: MockAuthenticationHandler;
    let mockRequestHandler: MockRequestHandler;

    beforeEach(async () => {
        jest.clearAllMocks();

        mockAuthHandler = new MockAuthenticationHandler();
        mockAuthHandler.isLoggedIn = jest.fn().mockReturnValue(true);
        mockRequestHandler = new MockRequestHandler();

        jest.spyOn(AuthenticationHandlerFactory, 'createAuthHandler')
            .mockReturnValue(mockAuthHandler as unknown as ReturnType<typeof AuthenticationHandlerFactory.createAuthHandler>);
        jest.spyOn(RequestHandlerFactory, 'createRequestHandler')
            .mockReturnValue(mockRequestHandler as unknown as ReturnType<typeof RequestHandlerFactory.createRequestHandler>);

        const credential = await mockGetCredentials('test-instance');
        const snSettings: ServiceNowSettingsInstance = {
            alias: 'test-instance',
            credential: credential
        };
        instance = new ServiceNowInstance(snSettings);
        aggregateQuery = new AggregateQuery(instance);
    });

    describe('Constructor', () => {
        it('should create instance with ServiceNow instance', () => {
            expect(aggregateQuery).toBeInstanceOf(AggregateQuery);
        });
    });

    describe('count', () => {
        it('should return count as integer', async () => {
            mockRequestHandler.get.mockResolvedValue(
                createMockResponse({ result: { stats: { count: '42' } } })
            );

            const count = await aggregateQuery.count({ table: 'incident' });

            expect(count).toBe(42);
            expect(mockRequestHandler.get).toHaveBeenCalledTimes(1);
        });

        it('should use correct stats API path', async () => {
            mockRequestHandler.get.mockResolvedValue(
                createMockResponse({ result: { stats: { count: '10' } } })
            );

            await aggregateQuery.count({ table: 'incident' });

            const callArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(callArgs.path).toBe('/api/now/stats/incident');
            expect(callArgs.path).not.toContain('/api/now/table/');
        });

        it('should pass sysparm_count=true', async () => {
            mockRequestHandler.get.mockResolvedValue(
                createMockResponse({ result: { stats: { count: '5' } } })
            );

            await aggregateQuery.count({ table: 'sys_user' });

            const callArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(callArgs.query.sysparm_count).toBe('true');
        });

        it('should pass sysparm_query when query is provided', async () => {
            mockRequestHandler.get.mockResolvedValue(
                createMockResponse({ result: { stats: { count: '3' } } })
            );

            await aggregateQuery.count({ table: 'incident', query: 'active=true^priority=1' });

            const callArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(callArgs.query.sysparm_query).toBe('active=true^priority=1');
        });

        it('should return 0 when count is missing', async () => {
            mockRequestHandler.get.mockResolvedValue(
                createMockResponse({ result: { stats: {} } })
            );

            const count = await aggregateQuery.count({ table: 'incident' });
            expect(count).toBe(0);
        });

        it('should throw on empty table name', async () => {
            await expect(aggregateQuery.count({ table: '' })).rejects.toThrow('Table name is required');
        });

        it('should throw on API error', async () => {
            mockRequestHandler.get.mockResolvedValue(
                createMockResponse(null, 500)
            );

            await expect(aggregateQuery.count({ table: 'incident' })).rejects.toThrow('Failed to count');
        });
    });

    describe('aggregate', () => {
        it('should return stats from non-grouped aggregate', async () => {
            const mockStats = { count: '100', 'avg.priority': '2.5', 'min.priority': '1', 'max.priority': '5' };
            mockRequestHandler.get.mockResolvedValue(
                createMockResponse({ result: { stats: mockStats } })
            );

            const result = await aggregateQuery.aggregate({
                table: 'incident',
                count: true,
                avgFields: ['priority'],
                minFields: ['priority'],
                maxFields: ['priority']
            });

            expect(result.stats).toEqual(mockStats);
        });

        it('should build correct query params for all field types', async () => {
            mockRequestHandler.get.mockResolvedValue(
                createMockResponse({ result: { stats: { count: '10' } } })
            );

            await aggregateQuery.aggregate({
                table: 'incident',
                count: true,
                avgFields: ['priority', 'urgency'],
                minFields: ['sys_created_on'],
                maxFields: ['sys_created_on'],
                sumFields: ['reassignment_count'],
                query: 'active=true',
                displayValue: 'true'
            });

            const callArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(callArgs.query.sysparm_count).toBe('true');
            expect(callArgs.query.sysparm_avg_fields).toBe('priority,urgency');
            expect(callArgs.query.sysparm_min_fields).toBe('sys_created_on');
            expect(callArgs.query.sysparm_max_fields).toBe('sys_created_on');
            expect(callArgs.query.sysparm_sum_fields).toBe('reassignment_count');
            expect(callArgs.query.sysparm_query).toBe('active=true');
            expect(callArgs.query.sysparm_display_value).toBe('true');
        });

        it('should throw on empty table name', async () => {
            await expect(aggregateQuery.aggregate({ table: '' })).rejects.toThrow('Table name is required');
        });

        it('should throw on API error', async () => {
            mockRequestHandler.get.mockResolvedValue(createMockResponse(null, 500));

            await expect(aggregateQuery.aggregate({ table: 'incident', count: true }))
                .rejects.toThrow('Failed to run aggregate');
        });
    });

    describe('groupBy', () => {
        it('should return grouped results', async () => {
            const mockGroups = [
                {
                    groupby_fields: [{ field: 'priority', value: '1', display_value: 'Critical' }],
                    stats: { count: '5' }
                },
                {
                    groupby_fields: [{ field: 'priority', value: '2', display_value: 'High' }],
                    stats: { count: '15' }
                }
            ];

            mockRequestHandler.get.mockResolvedValue(
                createMockResponse({ result: mockGroups })
            );

            const result = await aggregateQuery.groupBy({
                table: 'incident',
                count: true,
                groupBy: ['priority']
            });

            expect(result.groups).toHaveLength(2);
            expect(result.groups[0].groupby_fields[0].field).toBe('priority');
            expect(result.groups[0].stats.count).toBe('5');
        });

        it('should pass sysparm_group_by', async () => {
            mockRequestHandler.get.mockResolvedValue(
                createMockResponse({ result: [] })
            );

            await aggregateQuery.groupBy({
                table: 'incident',
                count: true,
                groupBy: ['priority', 'assignment_group']
            });

            const callArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(callArgs.query.sysparm_group_by).toBe('priority,assignment_group');
        });

        it('should pass sysparm_having when provided', async () => {
            mockRequestHandler.get.mockResolvedValue(
                createMockResponse({ result: [] })
            );

            await aggregateQuery.groupBy({
                table: 'incident',
                count: true,
                groupBy: ['priority'],
                having: 'count>5'
            });

            const callArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(callArgs.query.sysparm_having).toBe('count>5');
        });

        it('should throw when groupBy is missing', async () => {
            await expect(aggregateQuery.groupBy({
                table: 'incident',
                count: true
            })).rejects.toThrow('groupBy fields are required');
        });

        it('should throw when groupBy is empty array', async () => {
            await expect(aggregateQuery.groupBy({
                table: 'incident',
                count: true,
                groupBy: []
            })).rejects.toThrow('groupBy fields are required');
        });

        it('should throw on empty table name', async () => {
            await expect(aggregateQuery.groupBy({
                table: '',
                groupBy: ['priority']
            })).rejects.toThrow('Table name is required');
        });

        it('should handle empty result array', async () => {
            mockRequestHandler.get.mockResolvedValue(
                createMockResponse({ result: [] })
            );

            const result = await aggregateQuery.groupBy({
                table: 'incident',
                count: true,
                groupBy: ['priority']
            });

            expect(result.groups).toHaveLength(0);
        });
    });

    describe('Headers', () => {
        it('should set Content-Type and Accept headers to application/json', async () => {
            mockRequestHandler.get.mockResolvedValue(
                createMockResponse({ result: { stats: { count: '1' } } })
            );

            await aggregateQuery.count({ table: 'incident' });

            const callArgs = mockRequestHandler.get.mock.calls[0][0] as any;
            expect(callArgs.headers).toEqual({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            });
        });
    });
});

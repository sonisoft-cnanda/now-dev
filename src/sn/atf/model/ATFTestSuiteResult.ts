import { ReferenceLink } from "../../../model/types";
import { IATFTestSuiteResult } from "../interfaces/IATFTestSuiteResult";

export class ATFTestSuiteResult implements IATFTestSuiteResult {
    private _rolled_up_test_canceled_count: number;
  
    private _sys_id: string;
    private _sys_updated_by: string;
    private _sys_updated_on: Date;
    private _sys_created_by: string;
    private _sys_created_on: Date;
    private _sys_mod_count: number;
    private _number: string;
    private _rolled_up_test_success_with_warnings_count: number;
    private _error_count: number;
    private _failure_count: number;
    private _skip_count: number;
    private _success_count: number;
    private _rolled_up_test_error_count: number;
    private _rolled_up_test_failure_count: number;
    private _rolled_up_test_skip_count: number;
    private _rolled_up_test_success_count: number;
    private _start_time: Date;
    private _end_time: Date;
    private _success: boolean;
    private _run_time: string;
    private _status: string;
    private _test_suite: ReferenceLink;
    private _base_suite_result: ReferenceLink;
    private _parent: ReferenceLink;
    private _pin: boolean;
    private _execution_tracker: ReferenceLink;
    private _previous_suite_result: ReferenceLink;
    private _schedule_run: ReferenceLink;
    private _agent_id: ReferenceLink;
    private _sys_class_name: string;


    get rolledUpTestCanceledCount(): number {
        return this._rolled_up_test_canceled_count;
    }

    set rolledUpTestCanceledCount(value: number) {
        this._rolled_up_test_canceled_count = value;
    }

  
    get sysId(): string {
        return this._sys_id;
    }

    set sysId(value: string) {
        this._sys_id = value;
    }

    get sysUpdatedBy(): string {
        return this._sys_updated_by;
    }

    set sysUpdatedBy(value: string) {
        this._sys_updated_by = value;
    }

    get sysUpdatedOn(): Date {
        return this._sys_updated_on;
    }

    set sysUpdatedOn(value: Date) {
        this._sys_updated_on = value;
    }

    get sysCreatedBy(): string {
        return this._sys_created_by;
    }

    set sysCreatedBy(value: string) {
        this._sys_created_by = value;
    }

    get sysCreatedOn(): Date {
        return this._sys_created_on;
    }

    set sysCreatedOn(value: Date) {
        this._sys_created_on = value;
    }

    get sysModCount(): number {
        return this._sys_mod_count;
    }

    set sysModCount(value: number) {
        this._sys_mod_count = value;
    }

    get number(): string {
        return this._number;
    }

    set number(value: string) {
        this._number = value;
    }

    get rolledUpTestSuccessWithWarningsCount(): number {
        return this._rolled_up_test_success_with_warnings_count;
    }

    set rolledUpTestSuccessWithWarningsCount(value: number) {
        this._rolled_up_test_success_with_warnings_count = value;
    }

    get errorCount(): number {
        return this._error_count;
    }

    set errorCount(value: number) {
        this._error_count = value;
    }

    get failureCount(): number {
        return this._failure_count;
    }

    set failureCount(value: number) {
        this._failure_count = value;
    }

    get skipCount(): number {
        return this._skip_count;
    }

    set skipCount(value: number) {
        this._skip_count = value;
    }

    get successCount(): number {
        return this._success_count;
    }

    set successCount(value: number) {
        this._success_count = value;
    }

    get rolledUpTestErrorCount(): number {
        return this._rolled_up_test_error_count;
    }

    set rolledUpTestErrorCount(value: number) {
        this._rolled_up_test_error_count = value;
    }

    get rolledUpTestFailureCount(): number {
        return this._rolled_up_test_failure_count;
    }

    set rolledUpTestFailureCount(value: number) {
        this._rolled_up_test_failure_count = value;
    }

    get rolledUpTestSkipCount(): number {
        return this._rolled_up_test_skip_count;
    }

    set rolledUpTestSkipCount(value: number) {
        this._rolled_up_test_skip_count = value;
    }

    get rolledUpTestSuccessCount(): number {
        return this._rolled_up_test_success_count;
    }

    set rolledUpTestSuccessCount(value: number) {
        this._rolled_up_test_success_count = value;
    }

    get startTime(): Date {
        return this._start_time;
    }

    set startTime(value: Date) {
        this._start_time = value;
    }

    get endTime(): Date {
        return this._end_time;
    }

    set endTime(value: Date) {
        this._end_time = value;
    }

    get success(): boolean {
        return this._success;
    }

    set success(value: boolean) {
        this._success = value;
    }

    get runTime(): string {
        return this._run_time;
    }

    set runTime(value: string) {
        this._run_time = value;
    }

    get status(): string {
        return this._status;
    }

    set status(value: string) {
        this._status = value;
    }

    get testSuite(): ReferenceLink {
        return this._test_suite;
    }

    set testSuite(value: ReferenceLink) {
        this._test_suite = value;
    }

    get baseSuiteResult(): ReferenceLink {
        return this._base_suite_result;
    }

    set baseSuiteResult(value: ReferenceLink) {
        this._base_suite_result = value;
    }

    get parent(): ReferenceLink {
        return this._parent;
    }

    set parent(value: ReferenceLink) {
        this._parent = value;
    }

    get pin(): boolean {
        return this._pin;
    }

    set pin(value: boolean) {
        this._pin = value;
    }

    get executionTracker(): ReferenceLink {
        return this._execution_tracker;
    }

    set executionTracker(value: ReferenceLink) {
        this._execution_tracker = value;
    }

    get previousSuiteResult(): ReferenceLink {
        return this._previous_suite_result;
    }

    set previousSuiteResult(value: ReferenceLink) {
        this._previous_suite_result = value;
    }

    get scheduleRun(): ReferenceLink {
        return this._schedule_run;
    }

    set scheduleRun(value: ReferenceLink) {
        this._schedule_run = value;
    }

    get agentId(): ReferenceLink {
        return this._agent_id;
    }

    set agentId(value: ReferenceLink) {
        this._agent_id = value;
    }

    get sysClassName(): string {
        return this._sys_class_name;
    }

    set sysClassName(value: string) {
        this._sys_class_name = value;
    }
}

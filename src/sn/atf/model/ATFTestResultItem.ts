import { ReferenceLink } from "../../../model/types";
import { IATFTestResultItem } from "../interfaces/IATFTestResultItem";

export class ATFTestResultItem implements IATFTestResultItem {
    private _performance_run: ReferenceLink;
    private _run_time_millis: number;
   
    private _sys_id: string;
    private _sys_updated_by: string;
    private _sys_updated_on: Date;
    private _sys_created_by: string;
    private _sys_created_on: Date;
    private _sys_mod_count: number;
    private _test_result: ReferenceLink;
    private _description: string;
    private _test_case_json: string;
    private _output: string;
    private _summary: string;
    private _type: string;
    private _status: string;
    private _start_time: Date;
    private _end_time: Date;
    private _run_time: string;
    private _recorded_at: number;
    private _step: ReferenceLink;
    private _end_time_millis: string;
    private _whitelisted_client_error: ReferenceLink;
    private _start_time_millis: string;


    get performanceRun(): ReferenceLink {
        return this._performance_run;
    }

    set performanceRun(value: ReferenceLink) {
        this._performance_run = value;
    }

    get runTimeMillis(): number {
        return this._run_time_millis;
    }

    set runTimeMillis(value: number) {
        this._run_time_millis = value;
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

    get testResult(): ReferenceLink {
        return this._test_result;
    }

    set testResult(value: ReferenceLink) {
        this._test_result = value;
    }

    get description(): string {
        return this._description;
    }

    set description(value: string) {
        this._description = value;
    }

    get testCaseJson(): string {
        return this._test_case_json;
    }

    set testCaseJson(value: string) {
        this._test_case_json = value;
    }

    get output(): string {
        return this._output;
    }

    set output(value: string) {
        this._output = value;
    }

    get summary(): string {
        return this._summary;
    }

    set summary(value: string) {
        this._summary = value;
    }

    get type(): string {
        return this._type;
    }

    set type(value: string) {
        this._type = value;
    }

    get status(): string {
        return this._status;
    }

    set status(value: string) {
        this._status = value;
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

    get runTime(): string {
        return this._run_time;
    }

    set runTime(value: string) {
        this._run_time = value;
    }

    get recordedAt(): number {
        return this._recorded_at;
    }

    set recordedAt(value: number) {
        this._recorded_at = value;
    }

    get step(): ReferenceLink {
        return this._step;
    }

    set step(value: ReferenceLink) {
        this._step = value;
    }

    get endTimeMillis(): string {
        return this._end_time_millis;
    }

    set endTimeMillis(value: string) {
        this._end_time_millis = value;
    }

    get whitelistedClientError(): ReferenceLink {
        return this._whitelisted_client_error;
    }

    set whitelistedClientError(value: ReferenceLink) {
        this._whitelisted_client_error = value;
    }

    get startTimeMillis(): string {
        return this._start_time_millis;
    }

    set startTimeMillis(value: string) {
        this._start_time_millis = value;
    }
}

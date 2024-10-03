import { ReferenceLink } from "../../../model/types";
import { IATFTestResult } from "../interfaces/IATFTestResult";

export class ATFTestResult implements IATFTestResult {
    private _is_test_generation_waiting_for_cloud_runner: boolean;
    private _test: ReferenceLink;
    private _parameters: string;
    private _continue_test: boolean;
    private _pause_time_left: number;
    private _start_time: Date;
    private _start_time_millis: number;
    private _end_time: Date;
    private _end_time_millis: number;
    private _status: string;
    private _parent: ReferenceLink;
    private _started_pending_time: Date;
    private _pending_time: string;
    private _run_time: string;
    private _test_name: string;
    private _test_description: string;
    private _rollback_context: ReferenceLink;
    private _test_case_json: string;
    private _test_result_json: string;
    private _message_reference: string;
    private _first_failing_step: ReferenceLink;
    private _first_failing_step_screenshot: ReferenceLink;
    private _first_failing_client_error: ReferenceLink;
    private _output: string;
    private _pin: boolean;
    private _user_agents: string;
    private _execution_tracker: ReferenceLink;
    private _session_id: string;
    private _previous_test_result: ReferenceLink;
    private _sys_class_name: string;
    private _parameter_test_result: ReferenceLink;
    private _retrieved_components: boolean;
    private _is_test_generation: boolean;
    private _root_tracker_id: ReferenceLink;
    private _step_over: boolean;
    
    private _sys_id: string;
    private _sys_updated_by: string;
    private _sys_updated_on: Date;
    private _sys_created_by: string;
    private _sys_created_on: Date;
    private _sys_mod_count: number;
    private _parameter_set_run: ReferenceLink;


    get isTestGenerationWaitingForCloudRunner(): boolean {
        return this._is_test_generation_waiting_for_cloud_runner;
    }

    set isTestGenerationWaitingForCloudRunner(value: boolean) {
        this._is_test_generation_waiting_for_cloud_runner = value;
    }

    get test(): ReferenceLink {
        return this._test;
    }

    set test(value: ReferenceLink) {
        this._test = value;
    }

    get parameters(): string {
        return this._parameters;
    }

    set parameters(value: string) {
        this._parameters = value;
    }

    get continueTest(): boolean {
        return this._continue_test;
    }

    set continueTest(value: boolean) {
        this._continue_test = value;
    }

    get pauseTimeLeft(): number {
        return this._pause_time_left;
    }

    set pauseTimeLeft(value: number) {
        this._pause_time_left = value;
    }

    get startTime(): Date {
        return this._start_time;
    }

    set startTime(value: Date) {
        this._start_time = value;
    }

    get startTimeMillis(): number {
        return this._start_time_millis;
    }

    set startTimeMillis(value: number) {
        this._start_time_millis = value;
    }

    get endTime(): Date {
        return this._end_time;
    }

    set endTime(value: Date) {
        this._end_time = value;
    }

    get endTimeMillis(): number {
        return this._end_time_millis;
    }

    set endTimeMillis(value: number) {
        this._end_time_millis = value;
    }

    get status(): string {
        return this._status;
    }

    set status(value: string) {
        this._status = value;
    }

    get parent(): ReferenceLink {
        return this._parent;
    }

    set parent(value: ReferenceLink) {
        this._parent = value;
    }

    get startedPendingTime(): Date {
        return this._started_pending_time;
    }

    set startedPendingTime(value: Date) {
        this._started_pending_time = value;
    }

    get pendingTime(): string {
        return this._pending_time;
    }

    set pendingTime(value: string) {
        this._pending_time = value;
    }

    get runTime(): string {
        return this._run_time;
    }

    set runTime(value: string) {
        this._run_time = value;
    }

    get testName(): string {
        return this._test_name;
    }

    set testName(value: string) {
        this._test_name = value;
    }

    get testDescription(): string {
        return this._test_description;
    }

    set testDescription(value: string) {
        this._test_description = value;
    }

    get rollbackContext(): ReferenceLink {
        return this._rollback_context;
    }

    set rollbackContext(value: ReferenceLink) {
        this._rollback_context = value;
    }

    get testCaseJson(): string {
        return this._test_case_json;
    }

    set testCaseJson(value: string) {
        this._test_case_json = value;
    }

    get testResultJson(): string {
        return this._test_result_json;
    }

    set testResultJson(value: string) {
        this._test_result_json = value;
    }

    get messageReference(): string {
        return this._message_reference;
    }

    set messageReference(value: string) {
        this._message_reference = value;
    }

    get firstFailingStep(): ReferenceLink {
        return this._first_failing_step;
    }

    set firstFailingStep(value: ReferenceLink) {
        this._first_failing_step = value;
    }

    get firstFailingStepScreenshot(): ReferenceLink {
        return this._first_failing_step_screenshot;
    }

    set firstFailingStepScreenshot(value: ReferenceLink) {
        this._first_failing_step_screenshot = value;
    }

    get firstFailingClientError(): ReferenceLink {
        return this._first_failing_client_error;
    }

    set firstFailingClientError(value: ReferenceLink) {
        this._first_failing_client_error = value;
    }

    get output(): string {
        return this._output;
    }

    set output(value: string) {
        this._output = value;
    }

    get pin(): boolean {
        return this._pin;
    }

    set pin(value: boolean) {
        this._pin = value;
    }

    get userAgents(): string {
        return this._user_agents;
    }

    set userAgents(value: string) {
        this._user_agents = value;
    }

    get executionTracker(): ReferenceLink {
        return this._execution_tracker;
    }

    set executionTracker(value: ReferenceLink) {
        this._execution_tracker = value;
    }

    get sessionId(): string {
        return this._session_id;
    }

    set sessionId(value: string) {
        this._session_id = value;
    }

    get previousTestResult(): ReferenceLink {
        return this._previous_test_result;
    }

    set previousTestResult(value: ReferenceLink) {
        this._previous_test_result = value;
    }

    get sysClassName(): string {
        return this._sys_class_name;
    }

    set sysClassName(value: string) {
        this._sys_class_name = value;
    }

    get parameterTestResult(): ReferenceLink {
        return this._parameter_test_result;
    }

    set parameterTestResult(value: ReferenceLink) {
        this._parameter_test_result = value;
    }

    get retrievedComponents(): boolean {
        return this._retrieved_components;
    }

    set retrievedComponents(value: boolean) {
        this._retrieved_components = value;
    }

    get isTestGeneration(): boolean {
        return this._is_test_generation;
    }

    set isTestGeneration(value: boolean) {
        this._is_test_generation = value;
    }

    get rootTrackerId(): ReferenceLink {
        return this._root_tracker_id;
    }

    set rootTrackerId(value: ReferenceLink) {
        this._root_tracker_id = value;
    }

    get stepOver(): boolean {
        return this._step_over;
    }

    set stepOver(value: boolean) {
        this._step_over = value;
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

    get parameterSetRun(): ReferenceLink {
        return this._parameter_set_run;
    }

    set parameterSetRun(value: ReferenceLink) {
        this._parameter_set_run = value;
    }
}


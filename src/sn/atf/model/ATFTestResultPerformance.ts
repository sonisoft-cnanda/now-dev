import { ReferenceLink } from "../../../model/types";
import { IATFTestResultPerformance } from "../interfaces/IATFTestResultPerformance";

export class ATFTestResultPerformance implements IATFTestResultPerformance {
   
    private _performance_run: ReferenceLink;
    private _is_warmup: boolean;
    private _sys_id: string;


    

    get performanceRun(): ReferenceLink {
        return this._performance_run;
    }

    set performanceRun(value: ReferenceLink) {
        this._performance_run = value;
    }

    get isWarmup(): boolean {
        return this._is_warmup;
    }

    set isWarmup(value: boolean) {
        this._is_warmup = value;
    }

    get sysId(): string {
        return this._sys_id;
    }

    set sysId(value: string) {
        this._sys_id = value;
    }
}

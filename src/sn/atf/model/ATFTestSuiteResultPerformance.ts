import { ReferenceLink } from "../../../model/types";
import { IATFTestSuiteResultPerformance } from "../interfaces/IATFTestSuiteResultPerformance";

export class ATFTestSuiteResultPerformance implements IATFTestSuiteResultPerformance {
    private _performance_run: ReferenceLink;
    private _sys_id: string;
  

    get performanceRun(): ReferenceLink {
        return this._performance_run;
    }

    set performanceRun(value: ReferenceLink) {
        this._performance_run = value;
    }

    get sysId(): string {
        return this._sys_id;
    }

    set sysId(value: string) {
        this._sys_id = value;
    }

   
}



import { ReferenceLink } from "../../../model/types";

export interface IATFTestSuiteResultPerformance {
    get performanceRun(): ReferenceLink;
    set performanceRun(value: ReferenceLink);
    get sysId(): string;
    set sysId(value: string);
   
}

import { ReferenceLink } from "../../../model/types";

export interface IATFTestResultPerformance {
    
    get performanceRun(): ReferenceLink;
    set performanceRun(value: ReferenceLink);
    get isWarmup(): boolean;
    set isWarmup(value: boolean);
    get sysId(): string;
    set sysId(value: string);
}

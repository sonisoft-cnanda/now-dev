import { ReferenceLink } from "../../../model/types";

export interface IATFTestSuiteTest {
    get test(): ReferenceLink;
    set test(value: ReferenceLink);
    get order(): number;
    set order(value: number);
    get sysId(): string;
    set sysId(value: string);
    get testSuite(): ReferenceLink;
    set testSuite(value: ReferenceLink);
    get abortOnFailure(): boolean;
    set abortOnFailure(value: boolean);
}

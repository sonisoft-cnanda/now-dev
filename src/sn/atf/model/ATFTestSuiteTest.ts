import { ReferenceLink } from "../../../model/types";
import { IATFTestSuiteTest } from "../interfaces/IATFTestSuiteTest";

export class ATFTestSuiteTest implements IATFTestSuiteTest {
    
    private _test: ReferenceLink;
    private _order: number;
    private _sys_id: string;
    private _test_suite: ReferenceLink;
    private _abort_on_failure: boolean;


   
    get test(): ReferenceLink {
        return this._test;
    }

    set test(value: ReferenceLink) {
        this._test = value;
    }

    get order(): number {
        return this._order;
    }

    set order(value: number) {
        this._order = value;
    }

    get sysId(): string {
        return this._sys_id;
    }

    set sysId(value: string) {
        this._sys_id = value;
    }

    get testSuite(): ReferenceLink {
        return this._test_suite;
    }

    set testSuite(value: ReferenceLink) {
        this._test_suite = value;
    }

    get abortOnFailure(): boolean {
        return this._abort_on_failure;
    }

    set abortOnFailure(value: boolean) {
        this._abort_on_failure = value;
    }
}





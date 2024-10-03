/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReferenceLink } from "../../../model/types";
import { IATFTestSuite } from "../interfaces/IATFTestSuite";


export class ATFTestSuite implements IATFTestSuite {
   
    private _description: string;
    private _parent: ReferenceLink;
    private _active: boolean;
    private _name: string;
    private _sn_atf_tg_generated: boolean;
    private _input_filter: any;
    private _sys_id: string;



    get description(): string {
        return this._description;
    }

    set description(value: string) {
        this._description = value;
    }

    get parent(): ReferenceLink {
        return this._parent;
    }

    set parent(value: ReferenceLink) {
        this._parent = value;
    }

    get active(): boolean {
        return this._active;
    }

    set active(value: boolean) {
        this._active = value;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get snAtfTgGenerated(): boolean {
        return this._sn_atf_tg_generated;
    }

    set snAtfTgGenerated(value: boolean) {
        this._sn_atf_tg_generated = value;
    }

    get inputFilter(): any {
        return this._input_filter;
    }

    set inputFilter(value: any) {
        this._input_filter = value;
    }

    get sysId(): string {
        return this._sys_id;
    }

    set sysId(value: string) {
        this._sys_id = value;
    }
}

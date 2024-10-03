/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { IATFTestTemplate } from "../interfaces/IATFTestTemplate";

export class ATFTestTemplate implements IATFTestTemplate {
    private _template: any;
    private _name: string;
    private _description: string;
    
    private _sys_id: string;


    get template(): any {
        return this._template;
    }

    set template(value: any) {
        this._template = value;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get description(): string {
        return this._description;
    }

    set description(value: string) {
        this._description = value;
    }

   

    get sysId(): string {
        return this._sys_id;
    }

    set sysId(value: string) {
        this._sys_id = value;
    }
}

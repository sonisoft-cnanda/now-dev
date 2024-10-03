/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IATFTestTemplate {
    get template(): any;
    set template(value: any);
    get name(): string;
    set name(value: string);
    get description(): string;
    set description(value: string);
    get sysId(): string;
    set sysId(value: string);
}

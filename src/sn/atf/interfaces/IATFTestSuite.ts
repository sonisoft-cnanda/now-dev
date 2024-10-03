/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReferenceLink } from "../../../model/types";

export interface IATFTestSuite {
   
    get description(): string;
    set description(value: string);
    get parent(): ReferenceLink;
    set parent(value: ReferenceLink);
    get active(): boolean;
    set active(value: boolean);
    get name(): string;
    set name(value: string);
    get snAtfTgGenerated(): boolean;
    set snAtfTgGenerated(value: boolean);
    get inputFilter(): any;
    set inputFilter(value: any);
    get sysId(): string;
    set sysId(value: string);
}
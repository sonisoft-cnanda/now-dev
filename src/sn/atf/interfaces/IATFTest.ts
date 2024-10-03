import { ReferenceLink } from "../../../model/types";
import { IMetadataBase } from "./IMetadataBase";

export interface IATFTest extends IMetadataBase {
    get sysModCount(): string;
    set sysModCount(value: string);

    get active(): string;
    set active(value: string);

    get description(): string;
    set description(value: string);

    get sysUpdatedOn(): string;
    set sysUpdatedOn(value: string);

    get sysTags(): string;
    set sysTags(value: string);

    get sysClassName(): string;
    set sysClassName(value: string);

    get remember(): string;
    set remember(value: string);

    get sysId(): string;
    set sysId(value: string);

    get sysPackage(): ReferenceLink;
    set sysPackage(value: ReferenceLink);

    get enableParameterizedTesting(): string;
    set enableParameterizedTesting(value: string);

    get sysUpdateName(): string;
    set sysUpdateName(value: string);

    get sysUpdatedBy(): string;
    set sysUpdatedBy(value: string);

    get failOnServerError(): string;
    set failOnServerError(value: string);

    get sysCreatedOn(): string;
    set sysCreatedOn(value: string);

    get name(): string;
    set name(value: string);

    get sysName(): string;
    set sysName(value: string);

    get sysScope(): ReferenceLink;
    set sysScope(value: ReferenceLink);

    get copiedFrom(): string;
    set copiedFrom(value: string);

    get snAtfTgGenerated(): string;
    set snAtfTgGenerated(value: string);

    get parameters(): string;
    set parameters(value: string);

    get sysCreatedBy(): string;
    set sysCreatedBy(value: string);

    get sysPolicy(): string;
    set sysPolicy(value: string);
}


/*

export interface IATFTest {
    get enableParameterizedTesting(): boolean;
    set enableParameterizedTesting(value: boolean);
   
    get remember(): string;
    set remember(value: string);
    get snAtfTgGenerated(): boolean;
    set snAtfTgGenerated(value: boolean);
    get parameters(): string;
    set parameters(value: string);
    get copiedFrom(): ReferenceLink;
    set copiedFrom(value: ReferenceLink);
    get failOnServerError(): boolean;
    set failOnServerError(value: boolean);
    get name(): string;
    set name(value: string);
    get active(): boolean;
    set active(value: boolean);
    get description(): string;
    set description(value: string);
    get sysId(): string;
    set sysId(value: string);
}

*/
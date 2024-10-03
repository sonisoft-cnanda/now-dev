import { ReferenceLink } from "../../../model/types";
import { MetadataBase } from "../base/MetadataBase";
import { IATFTest } from "../interfaces/IATFTest";


export class ATFTest extends MetadataBase implements IATFTest {
        private _sys_mod_count: string;
        private _active: string;
        private _description: string;
        private _sys_updated_on: string;
        private _sys_tags: string;
        private _sys_class_name: string;
        private _remember: string;
        private _sys_id: string;
        private _sys_package: ReferenceLink;
        private _enable_parameterized_testing: string;
        private _sys_update_name: string;
        private _sys_updated_by: string;
        private _fail_on_server_error: string;
        private _sys_created_on: string;
        private _name: string;
        private _sys_name: string;
        private _sys_scope: ReferenceLink;
        private _copied_from: string;
        private _sn_atf_tg_generated: string;
        private _parameters: string;
        private _sys_created_by: string;
        private _sys_policy: string;
    
        get sysModCount(): string {
            return this._sys_mod_count;
        }
    
        set sysModCount(value: string) {
            this._sys_mod_count = value;
        }
    
        get active(): string {
            return this._active;
        }
    
        set active(value: string) {
            this._active = value;
        }
    
        get description(): string {
            return this._description;
        }
    
        set description(value: string) {
            this._description = value;
        }
    
        get sysUpdatedOn(): string {
            return this._sys_updated_on;
        }
    
        set sysUpdatedOn(value: string) {
            this._sys_updated_on = value;
        }
    
        get sysTags(): string {
            return this._sys_tags;
        }
    
        set sysTags(value: string) {
            this._sys_tags = value;
        }
    
        get sysClassName(): string {
            return this._sys_class_name;
        }
    
        set sysClassName(value: string) {
            this._sys_class_name = value;
        }
    
        get remember(): string {
            return this._remember;
        }
    
        set remember(value: string) {
            this._remember = value;
        }
    
        get sysId(): string {
            return this._sys_id;
        }
    
        set sysId(value: string) {
            this._sys_id = value;
        }
    
        get sysPackage(): ReferenceLink {
            return this._sys_package;
        }
    
        set sysPackage(value: ReferenceLink) {
            this._sys_package = value;
        }
    
        get enableParameterizedTesting(): string {
            return this._enable_parameterized_testing;
        }
    
        set enableParameterizedTesting(value: string) {
            this._enable_parameterized_testing = value;
        }
    
        get sysUpdateName(): string {
            return this._sys_update_name;
        }
    
        set sysUpdateName(value: string) {
            this._sys_update_name = value;
        }
    
        get sysUpdatedBy(): string {
            return this._sys_updated_by;
        }
    
        set sysUpdatedBy(value: string) {
            this._sys_updated_by = value;
        }
    
        get failOnServerError(): string {
            return this._fail_on_server_error;
        }
    
        set failOnServerError(value: string) {
            this._fail_on_server_error = value;
        }
    
        get sysCreatedOn(): string {
            return this._sys_created_on;
        }
    
        set sysCreatedOn(value: string) {
            this._sys_created_on = value;
        }
    
        get name(): string {
            return this._name;
        }
    
        set name(value: string) {
            this._name = value;
        }
    
        get sysName(): string {
            return this._sys_name;
        }
    
        set sysName(value: string) {
            this._sys_name = value;
        }
    
        get sysScope(): ReferenceLink {
            return this._sys_scope;
        }
    
        set sysScope(value: ReferenceLink) {
            this._sys_scope = value;
        }
    
        get copiedFrom(): string {
            return this._copied_from;
        }
    
        set copiedFrom(value: string) {
            this._copied_from = value;
        }
    
        get snAtfTgGenerated(): string {
            return this._sn_atf_tg_generated;
        }
    
        set snAtfTgGenerated(value: string) {
            this._sn_atf_tg_generated = value;
        }
    
        get parameters(): string {
            return this._parameters;
        }
    
        set parameters(value: string) {
            this._parameters = value;
        }
    
        get sysCreatedBy(): string {
            return this._sys_created_by;
        }
    
        set sysCreatedBy(value: string) {
            this._sys_created_by = value;
        }
    
        get sysPolicy(): string {
            return this._sys_policy;
        }
    
        set sysPolicy(value: string) {
            this._sys_policy = value;
        }

        public constructor(){
            super();
            
        }
    }



    /*

export class ATFTest implements IATFTest {
    private _enable_parameterized_testing: boolean;
   
    private _remember: string;
    private _sn_atf_tg_generated: boolean;
    private _parameters: string;
    private _copied_from: ReferenceLink;
    private _fail_on_server_error: boolean;
    private _name: string;
    private _active: boolean;
    private _description: string;
    private _sys_id: string;


    get enableParameterizedTesting(): boolean {
        return this._enable_parameterized_testing;
    }

    set enableParameterizedTesting(value: boolean) {
        this._enable_parameterized_testing = value;
    }

   
    get remember(): string {
        return this._remember;
    }

    set remember(value: string) {
        this._remember = value;
    }

    get snAtfTgGenerated(): boolean {
        return this._sn_atf_tg_generated;
    }

    set snAtfTgGenerated(value: boolean) {
        this._sn_atf_tg_generated = value;
    }

    get parameters(): string {
        return this._parameters;
    }

    set parameters(value: string) {
        this._parameters = value;
    }

    get copiedFrom(): ReferenceLink {
        return this._copied_from;
    }

    set copiedFrom(value: ReferenceLink) {
        this._copied_from = value;
    }

    get failOnServerError(): boolean {
        return this._fail_on_server_error;
    }

    set failOnServerError(value: boolean) {
        this._fail_on_server_error = value;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get active(): boolean {
        return this._active;
    }

    set active(value: boolean) {
        this._active = value;
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


    */
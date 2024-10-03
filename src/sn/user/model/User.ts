import { ReferenceLink } from "../../../model/types";
import { IUser } from "./IUser";


export class User implements IUser {
    private _calendar_integration: string;
    private _country: string;
    private _last_position_update: string;
    private _user_password: string;
    private _last_login_time: string;
    private _source: string;
    private _sys_updated_on: string;
    private _building: string;
    private _web_service_access_only: string;
    private _notification: string;
    private _enable_multifactor_authn: string;
    private _sys_updated_by: string;
    private _sys_created_on: string;
    private _agent_status: string;
    private _sys_domain: ReferenceLink;
    private _state: string;
    private _vip: string;
    private _sys_created_by: string;
    private _longitude: string;
    private _zip: string;
    private _home_phone: string;
    private _time_format: string;
    private _last_login: string;
    private _default_perspective: string;
    private _geolocation_tracked: string;
    private _active: string;
    private _sys_domain_path: string;
    private _cost_center: string;
    private _phone: string;
    private _name: string;
    private _employee_number: string;
    private _password_needs_reset: string;
    private _gender: string;
    private _city: string;
    private _failed_attempts: string;
    private _user_name: string;
    private _latitude: string;
    private _roles: string;
    private _title: string;
    private _sys_class_name: string;
    private _sys_id: string;
    private _federated_id: string;
    private _internal_integration_user: string;
    private _ldap_server: string;
    private _mobile_phone: string;
    private _street: string;
    private _company: string;
    private _department: string;
    private _first_name: string;
    private _email: string;
    private _introduction: string;
    private _preferred_language: string;
    private _manager: string;
    private _business_criticality: string;
    private _locked_out: string;
    private _sys_mod_count: string;
    private _last_name: string;
    private _photo: string;
    private _avatar: string;
    private _middle_name: string;
    private _sys_tags: string;
    private _time_zone: string;
    private _schedule: string;
    private _on_schedule: string;
    private _date_format: string;
    private _location: string;

    get calendarIntegration(): string {
        return this._calendar_integration;
    }

    set calendarIntegration(value: string) {
        this._calendar_integration = value;
    }

    get country(): string {
        return this._country;
    }

    set country(value: string) {
        this._country = value;
    }

    get lastPositionUpdate(): string {
        return this._last_position_update;
    }

    set lastPositionUpdate(value: string) {
        this._last_position_update = value;
    }

    get userPassword(): string {
        return this._user_password;
    }

    set userPassword(value: string) {
        this._user_password = value;
    }

    get lastLoginTime(): string {
        return this._last_login_time;
    }

    set lastLoginTime(value: string) {
        this._last_login_time = value;
    }

    get source(): string {
        return this._source;
    }

    set source(value: string) {
        this._source = value;
    }

    get sysUpdatedOn(): string {
        return this._sys_updated_on;
    }

    set sysUpdatedOn(value: string) {
        this._sys_updated_on = value;
    }

    get building(): string {
        return this._building;
    }

    set building(value: string) {
        this._building = value;
    }

    get webServiceAccessOnly(): string {
        return this._web_service_access_only;
    }

    set webServiceAccessOnly(value: string) {
        this._web_service_access_only = value;
    }

    get notification(): string {
        return this._notification;
    }

    set notification(value: string) {
        this._notification = value;
    }

    get enableMultifactorAuthn(): string {
        return this._enable_multifactor_authn;
    }

    set enableMultifactorAuthn(value: string) {
        this._enable_multifactor_authn = value;
    }

    get sysUpdatedBy(): string {
        return this._sys_updated_by;
    }

    set sysUpdatedBy(value: string) {
        this._sys_updated_by = value;
    }

    get sysCreatedOn(): string {
        return this._sys_created_on;
    }

    set sysCreatedOn(value: string) {
        this._sys_created_on = value;
    }

    get agentStatus(): string {
        return this._agent_status;
    }

    set agentStatus(value: string) {
        this._agent_status = value;
    }

    get sysDomain(): ReferenceLink {
        return this._sys_domain;
    }

    set sysDomain(value: ReferenceLink) {
        this._sys_domain = value;
    }

    get state(): string {
        return this._state;
    }

    set state(value: string) {
        this._state = value;
    }

    get vip(): string {
        return this._vip;
    }

    set vip(value: string) {
        this._vip = value;
    }

    get sysCreatedBy(): string {
        return this._sys_created_by;
    }

    set sysCreatedBy(value: string) {
        this._sys_created_by = value;
    }

    get longitude(): string {
        return this._longitude;
    }

    set longitude(value: string) {
        this._longitude = value;
    }

    get zip(): string {
        return this._zip;
    }

    set zip(value: string) {
        this._zip = value;
    }

    get homePhone(): string {
        return this._home_phone;
    }

    set homePhone(value: string) {
        this._home_phone = value;
    }

    get timeFormat(): string {
        return this._time_format;
    }

    set timeFormat(value: string) {
        this._time_format = value;
    }

    get lastLogin(): string {
        return this._last_login;
    }

    set lastLogin(value: string) {
        this._last_login = value;
    }

    get defaultPerspective(): string {
        return this._default_perspective;
    }

    set defaultPerspective(value: string) {
        this._default_perspective = value;
    }

    get geolocationTracked(): string {
        return this._geolocation_tracked;
    }

    set geolocationTracked(value: string) {
        this._geolocation_tracked = value;
    }

    get active(): string {
        return this._active;
    }

    set active(value: string) {
        this._active = value;
    }

    get sysDomainPath(): string {
        return this._sys_domain_path;
    }

    set sysDomainPath(value: string) {
        this._sys_domain_path = value;
    }

    get costCenter(): string {
        return this._cost_center;
    }

    set costCenter(value: string) {
        this._cost_center = value;
    }

    get phone(): string {
        return this._phone;
    }

    set phone(value: string) {
        this._phone = value;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get employeeNumber(): string {
        return this._employee_number;
    }

    set employeeNumber(value: string) {
        this._employee_number = value;
    }

    get passwordNeedsReset(): string {
        return this._password_needs_reset;
    }

    set passwordNeedsReset(value: string) {
        this._password_needs_reset = value;
    }

    get gender(): string {
        return this._gender;
    }

    set gender(value: string) {
        this._gender = value;
    }

    get city(): string {
        return this._city;
    }

    set city(value: string) {
        this._city = value;
    }

    get failedAttempts(): string {
        return this._failed_attempts;
    }

    set failedAttempts(value: string) {
        this._failed_attempts = value;
    }

    get userName(): string {
        return this._user_name;
    }

    set userName(value: string) {
        this._user_name = value;
    }

    get latitude(): string {
        return this._latitude;
    }

    set latitude(value: string) {
        this._latitude = value;
    }

    get roles(): string {
        return this._roles;
    }

    set roles(value: string) {
        this._roles = value;
    }

    get title(): string {
        return this._title;
    }

    set title(value: string) {
        this._title = value;
    }

    get sysClassName(): string {
        return this._sys_class_name;
    }

    set sysClassName(value: string) {
        this._sys_class_name = value;
    }

    get sysId(): string {
        return this._sys_id;
    }

    set sysId(value: string) {
        this._sys_id = value;
    }

    get federatedId(): string {
        return this._federated_id;
    }

    set federatedId(value: string) {
        this._federated_id = value;
    }

    get internalIntegrationUser(): string {
        return this._internal_integration_user;
    }

    set internalIntegrationUser(value: string) {
        this._internal_integration_user = value;
    }

    get ldapServer(): string {
        return this._ldap_server;
    }

    set ldapServer(value: string) {
        this._ldap_server = value;
    }

    get mobilePhone(): string {
        return this._mobile_phone;
    }

    set mobilePhone(value: string) {
        this._mobile_phone = value;
    }

    get street(): string {
        return this._street;
    }

    set street(value: string) {
        this._street = value;
    }

    get company(): string {
        return this._company;
    }

    set company(value: string) {
        this._company = value;
    }

    get department(): string {
        return this._department;
    }

    set department(value: string) {
        this._department = value;
    }

    get firstName(): string {
        return this._first_name;
    }

    set firstName(value: string) {
        this._first_name = value;
    }

    get email(): string {
        return this._email;
    }

    set email(value: string) {
        this._email = value;
    }

    get introduction(): string {
        return this._introduction;
    }

    set introduction(value: string) {
        this._introduction = value;
    }

    get preferredLanguage(): string {
        return this._preferred_language;
    }

    set preferredLanguage(value: string) {
        this._preferred_language = value;
    }

    get manager(): string {
        return this._manager;
    }

    set manager(value: string) {
        this._manager = value;
    }

    get businessCriticality(): string {
        return this._business_criticality;
    }

    set businessCriticality(value: string) {
        this._business_criticality = value;
    }

    get lockedOut(): string {
        return this._locked_out;
    }

    set lockedOut(value: string) {
        this._locked_out = value;
    }

    get sysModCount(): string {
        return this._sys_mod_count;
    }

    set sysModCount(value: string) {
        this._sys_mod_count = value;
    }

    get lastName(): string {
        return this._last_name;
    }

    set lastName(value: string) {
        this._last_name = value;
    }

    get photo(): string {
        return this._photo;
    }

    set photo(value: string) {
        this._photo = value;
    }

    get avatar(): string {
        return this._avatar;
    }

    set avatar(value: string) {
        this._avatar = value;
    }

    get middleName(): string {
        return this._middle_name;
    }

    set middleName(value: string) {
        this._middle_name = value;
    }

    get sysTags(): string {
        return this._sys_tags;
    }

    set sysTags(value: string) {
        this._sys_tags = value;
    }

    get timeZone(): string {
        return this._time_zone;
    }

    set timeZone(value: string) {
        this._time_zone = value;
    }

    get schedule(): string {
        return this._schedule;
    }

    set schedule(value: string) {
        this._schedule = value;
    }

    get onSchedule(): string {
        return this._on_schedule;
    }

    set onSchedule(value: string) {
        this._on_schedule = value;
    }

    get dateFormat(): string {
        return this._date_format;
    }

    set dateFormat(value: string) {
        this._date_format = value;
    }

    get location(): string {
        return this._location;
    }

    set location(value: string) {
        this._location = value;
    }
}
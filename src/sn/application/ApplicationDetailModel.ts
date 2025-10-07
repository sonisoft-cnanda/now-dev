export class ApplicationDetailModelResponse {
    result:ApplicationInstanceDetailModel;
}

export class ApplicationInstanceDetailModel {
    app_info_on_instance:ApplicationDetailModel;
}


export class ApplicationDetailModel {

    logo:string;
    short_description:string;
    needs_app_engine_licensing:boolean;
    custom_table_count:string;
    name:string;
    vendor:string;
    vendor_prefix:string;
    link:string;
    scope:string;
    compatibilities:string;
    active:boolean;
    price_type:string;
    lob:string[];
    source:string;
   
    shared_internally:boolean;
    indicators:string[];
    display_message:string;
    upload_info:string;
    products:string[];
    install_date:string;
    update_date:string;
    version:string;
    version_display:string;
    assigned_version:string;
    latest_version:string;
    latest_version_display:string;
    demo_data:string;
    sys_id:string;
    sys_updated_on:string;
    sys_created_on:string;

    can_edit_in_studio:boolean;
    can_open_in_studio:boolean;
    is_customized_app:boolean;
    can_install_or_upgrade_customization:boolean;
    customized_version_info:unknown;
    is_store_app:boolean;
    store_link:string;

    isSubscriptionApplicable:boolean;
    publish_date_display:string;
    isAppstorePlugin:boolean;
    uninstall_blocked:boolean;
    sys_code:string;
    can_install_or_upgrade:boolean;
    isInstalled:boolean;

    isInstalledAndUpdateAvailable:boolean;
    isCustomizationUpdateAvailable:boolean;
    installed_as_dependency:boolean;
    app_schedule_details:unknown;
    dependencies:unknown;
    contains_plugins:boolean;
    optional_apps_available:boolean;
    install_tracker_id:string;
    versions:unknown[];
    new_guided_setup_id:string;
    upgradeHistoryId:string;
    upgradeDetailsInfo:unknown;
    installationInfo:unknown;
    installedFilesQuery:unknown;
    customizedFilesQuery:unknown;
    userDateFormat:string;
    time_taken:number;

    sys_created_on_display:string;
    sys_updated_on_display:string;  

    






    /*
{
      "logo": "https://store.servicenow.com/a324d99887c55a507ffc87fc0ebb35c0.iix",
      "short_description": "A visual, no-code configuration tool for card, UI rule, card template, and legacy card native mobile components",
      "needs_app_engine_licensing": false,
      "custom_table_count": "0",
      "name": "Mobile Card Builder",
      "vendor": "",
      "vendor_prefix": "",
      "link": "/sys_store_app.do?sys_id=012fa9ad7367ad6393ae5dea97af6f65",
      "scope": "sn_mobile_card_bui",
      "compatibilities": "Washington DC,Xanadu",
      "active": true,
      "price_type": "free",
      "lob": [
        {
          "lob_id": "3142d78553c633008941ddeeff7b1291",
          "lob_label": "Other"
        }
      ],
      "source": "sys_store_app",
      "shared_internally": "0",
      "indicators": [],
      "display_message": null,
      "upload_info": "",
      "products": [],
      "install_date": "Feb 5, 2022",
      "update_date": "Jul 26, 2025",
      "version": "25.10.0",
      "version_display": "25.10",
      "assigned_version": "25.10.0",
      "latest_version": "25.10.0",
      "latest_version_display": "25.10",
      "demo_data": "no_demo_data",
      "sys_id": "012fa9ad7367ad6393ae5dea97af6f65",
      "sys_updated_on": "2025-07-26 16:48:57",
      "sys_created_on": "2024-09-30 10:45:42",
      "can_edit_in_studio": false,
      "can_open_in_studio": false,
      "is_customized_app": false,
      "can_install_or_upgrade_customization": true,
      "customized_version_info": {
        "latest_customized_version": null
      },
      "is_store_app": true,
      "store_link": "https://store.servicenow.com/sn_appstore_store.do#!/store/application/012fa9ad7367ad6393ae5dea97af6f65/25.10.0",
      "sys_created_on_display": "Sep 30, 2024",
      "sys_updated_on_display": "Jul 26, 2025",
      "isSubscriptionApplicable": false,
      "publish_date_display": "Jul 26, 2025",
      "isAppstorePlugin": true,
      "uninstall_blocked": true,
      "sys_code": "com.sn_mobile_studio_itemview_builder",
      "can_install_or_upgrade": true,
      "isInstalled": true,
      "isInstalledAndUpdateAvailable": false,
      "isCustomizationUpdateAvailable": false,
      "installed_as_dependency": false,
      "app_schedule_details": {},
      "dependencies": null,
      "contains_plugins": false,
      "optional_apps_available": false,
      "install_tracker_id": null,
      "versions": [],
      "new_guided_setup_id": null,
      "upgradeHistoryId": "",
      "upgradeDetailsInfo": {
        "changes_skipped": {
          "count": 0,
          "query": "dispositionIN4,104,9,10^changed=true^ORdisposition=9^resolution_status=not_reviewed^ORresolution_status=^upgrade_history.sys_idIN"
        },
        "changes_applied": {
          "count": 0,
          "query": "dispositionIN1,2,3,101,102,103^changed=true^upgrade_history.sys_idIN"
        },
        "changes_processed": {
          "count": 0,
          "query": "dispositionIN4,5,104,105,9,10^changed=true^ORdispositionIN9,5,105^resolution_status!=not_reviewed^resolution_status!=^upgrade_history.sys_idIN"
        },
        "copies_to_review": {
          "count": 0,
          "query": "dispositionIN201,202,203^resolution_status=not_reviewed^ORresolution_status=^upgrade_history.sys_idIN"
        },
        "customized_unchanged": {
          "count": 0,
          "query": "dispositionIN4,104^changed=false^upgrade_history.sys_idIN"
        },
        "upgrade_details": {
          "count": 0,
          "query": "upgrade_history.sys_idIN"
        }
      },
      "installationInfo": {
        "installation_log": {
          "count": 228,
          "query": "plugin=sn_mobile_card_bui"
        },
        "installed_files": {
          "count": 233,
          "query": "/upgrade_info.do?sysparm_tiny=Sv0b5mjz8nqlYjxHmVT0eqIdX9XnOf8k"
        },
        "customized_files": {
          "count": 0,
          "query": "/upgrade_info.do?sysparm_tiny=aRyRCF8npI3pudZa73zteLNosOxR7qee"
        }
      },
      "installedFilesQuery": {
        "count": 233,
        "query": "/upgrade_info.do?sysparm_tiny=Sv0b5mjz8nqlYjxHmVT0eqIdX9XnOf8k"
      },
      "customizedFilesQuery": {
        "count": 0,
        "query": "/upgrade_info.do?sysparm_tiny=aRyRCF8npI3pudZa73zteLNosOxR7qee"
      },
      "userDateFormat": "yyyy-MM-dd"
    },

    */

}



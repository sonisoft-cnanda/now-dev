/**
 * Copyright (C) 2020 ServiceNow, Inc. All rights reserved.
**/

(function ($, undefined) {
    $.jstree.plugins.noclose = function () {
        this.close_node = $.noop;
    };
})(jQuery);

const MessageCommands = {
    RELOAD: 'reload',
    ALERT: 'alert',
    SYNC_CANCEL: 'sync_cancel',
    SYNC_SUBMIT: 'SYNC_SUBMIT',
    OPEN_SETTINGS: 'OPEN_SETTINGS'
    /*     
    SYNC_SCRATCH: 'SYNC_SCRATCH',
	SYNC_SRC: 'SYNC_SRC',
    SYNC_ALL: 'SYNC_ALL'
    */
};

const ONLY_ONE_UPDATE_SET_EXISTS_MESSAGE = 'Only default update set found for this scope. Please create update set to start syncing.';
const DEFAULT_UPDATE_SET_SELECTED_MESSAGE = 'Changes are not allowed in default update set. Please change the update set to proceed.';

// Message will be send to the vscode when the webview window is loaded
const onwindowLoad = () => vscode.postMessage(MessageCommands.RELOAD, "Webview window loaded");

// Listener for the message events from vscode
window.addEventListener('message', event => {
    vscode.postMessage(MessageCommands.ALERT, "[Webview] Loading Selective Sync view");
    WebViewBuilder.build(event.data);
});

const vscode = (function () {
    // Acquire VS Code api, webview will use it to communicate with extension
    const _vscode = acquireVsCodeApi();

    // Send message from the webview to the extension
    function postMessage(command, data) {
        _vscode.postMessage({ command, data });
    }

    return { postMessage };
})();

// This piece of code handles rendering the Selective Sync GUI
const WebViewBuilder = (function ($) {
    const UPDATE_SET_CHANGED = 'update_set_changed';
    const UPDATE_SET_PICKER_ACTIVE = 'update_set_picker_active';

    let gAffectedScopesMap = new Map();
    let gUpdateSetMap = new Map();
    let gUpdateSetsStatusMap = new Map();
    const gUserSelectionForUpdateSets = new Map();

    return { build };

    function build(data) {
        const transformedData = transformData(data);
        const {
            affectedScopesMap,
            affectedFilesMap,
            updateSetsMap,
            currentUpdateSetsMap,
            updateSetsStatusMap
        } = transformedData;

        gUpdateSetsStatusMap = updateSetsStatusMap;
        gAffectedScopesMap = affectedScopesMap;
        gUpdateSetMap = updateSetsMap;

        initStaticContent(data);
        initAppContainers();
        initJSTreeInstances(affectedFilesMap);
        initUpdateSetPickers(updateSetsMap, currentUpdateSetsMap);
    }


    /* Private methods start here */

    function initStaticContent(data) {
        const src_sync = data['SYNC_STATUS']['SRC_SYNC'];
        const scratch_sync = data['SYNC_STATUS']['SRC_SYNC'];

        const static_content = document.getElementById("static-content");

        if (!src_sync){
            static_content.innerHTML = `
            <div class="app-container">
                <div class="app-header">
                    <div class="app-title"><i class="codicon codicon-files"></i>&nbsp;Scratch Files</div>
                    <div class="select-all-container">
                    <div class="custom-control custom-switch">
                        <input type="checkbox" checked="true" class="custom-control-input" id="selectAllSwitch">
                        <label class="custom-control-label" for="selectAllSwitch">Select all</label>
                    </div>
                </div>
                </div>
            </div>`;

        // $('.sync-actions').html('<button  class="sync-action sync-submit btn btn-info  mr-0 ml-1">Submit</button>');

        }

        static_content.style.display = "block";
    }

    // Create a container for each affected scope and add them to the webview
    function initAppContainers() {
        const appsContainer = new DocumentFragment();
        const appTemplate = document.getElementById('app-template').innerHTML;

        gAffectedScopesMap.forEach((scope) => {
            appsContainer.appendChild(getAppContainer(scope, appTemplate));
        });

        $('#main').append(appsContainer);

        attachEventHandlers();
    }

    function initJSTreeInstances(affectedFilesMap) {
        gAffectedScopesMap.forEach((scope) => {
            const { scopeId } = scope;
            const data = affectedFilesMap.get(scopeId);
            const config = getJSTreeConfig(data);
            const jstreeContainer = $(`#files-tree-${scopeId}`);
            jstreeContainer.jstree(config);
            jstreeContainer.on('ready.jstree', () => {
                updateJSTreeState(scopeId);
            });
        });
    }

    function initUpdateSetPickers(updateSetsMap, currentUpdateSetsMap) {
        $('.updateset-picker').updatesetpicker({ updateSetsMap, currentUpdateSetsMap });
    }

    function attachEventHandlers() {
        window.addEventListener(UPDATE_SET_CHANGED, function (e) {
            const { scopeId, oldUpdateSetId, newUpdateSetId } = e.detail;
            toggleAlert(scopeId, newUpdateSetId);
        });

        window.addEventListener(UPDATE_SET_PICKER_ACTIVE, function (e) {
            const { scopeId, updateSetId } = e.detail;
            toggleAlert(scopeId, updateSetId);
        });

        window.onscroll = () => {
            const scrollTop = document.documentElement.scrollTop;
            const btn = $('#goto-top-btn');
            scrollTop > 50 ? btn.show() : btn.hide();
        };

        $('.app-container').on('click', appContainerClickHandler);
        $('#main .navbar').on('click', navbarActionsHandler);
        // $('.skip-button').on('click', navbarActionsHandler);
        $('#goto-top-btn').on('click', (e) => $("html, body").animate({ scrollTop: 0 }));

        /* $('.command-dropdown-button').focusout(() => {
            $('#command-selection-dropdown').slideUp();
        });

        $('.command-dropdown-button').click(() => {
            $('#command-selection-dropdown').slideToggle();
        }); */

        $('#selectAllSwitch').change(function() {
            setAllTreesState(this.checked);
        });
    }

    function setAllTreesState(status){
        gAffectedScopesMap.forEach((scope) => {
            const { scopeId } = scope;
            const jstreeContainer = $(`#files-tree-${scopeId}`);
            const updateSetId = gUserSelectionForUpdateSets.get(scopeId);
            const isUpdateSetDefault = isDefaultUpdateSet(updateSetId);
            if(!isUpdateSetDefault){
                if(status){
                    jstreeContainer.jstree().select_all(true);	
                } else {
                    jstreeContainer.jstree().deselect_all(true);	
                }
                
            }
        });
    }

    function appContainerClickHandler(e) {
        const target = $(e.target);

        if (target.hasClass('toggle-view')) {
            const filesTree = $(e.currentTarget).find('.app-files');
            target.hasClass('collapsed') ? filesTree.slideDown(200) : filesTree.slideUp(200);
            target.toggleClass('collapsed');
        } else if (target.closest('.jstree-children').length === 1) {
            // This is a fix for scroll jump issue
            e.stopImmediatePropagation();

            // Ensure event handlers on document and above will work as it is.
            $(document).trigger('click');
        }
    }

    function navbarActionsHandler(e) {
        const target = $(e.target);

        if (target.hasClass('sync-action')) {
            if (target.hasClass('sync-cancel')) {
                modal.show({
                    modalTitle: 'Scratch Sync',
                    modalBody: 'Do you want to skip syncing scratch files?',
                    modalOkBtnText: 'Yes',
                    modalCancelBtnText: 'No',
                    onSuccess() {
                        vscode.postMessage(MessageCommands.SYNC_CANCEL, 'Sync cancelled by user');
                    }
                });
            } else {
                const scopesToSync = [];
                gAffectedScopesMap.forEach((app, scopeId) => {
                    if (!isScopeHasDefaultUpdateSet(scopeId)) scopesToSync.push(scopeId);
                });

                // There are no scopes with non default UpdateSet, show alert
                if (scopesToSync.length === 0) {
                    modal.show({
                        modalTitle: 'Scratch Sync',
                        modalBody: 'No files selected in scratch folder. Do you want to proceed?',
                        modalOkBtnText: 'Yes',
                        modalCancelBtnText: 'No',
                        onSuccess() {
                            vscode.postMessage(MessageCommands.SYNC_CANCEL, 'Sync cancelled by user');
                        }
                    });
                } else {
                    submit(scopesToSync);
                }
            }
        }
    }

    function submit(scopesToSync) {
        const selectedFilesMap = new Map();
        scopesToSync.forEach(scopeId => {
            const list = $(`#app-${scopeId}`).find('a.jstree-clicked[name=file]');
            if (list.length === 0) return;

            const sysIdList = [];
            $.each(list, (idx, el) => {
                sysIdList.push(el.getAttribute('sysid'));
            });
            selectedFilesMap.set(scopeId, sysIdList);
        });

        if (selectedFilesMap.size === 0) {
            // Show alert to user that no files are selected
            modal.show({
                modalTitle: 'Scratch Sync',
                modalBody: 'No files selected in scratch folder. Do you want to proceed?',
                modalOkBtnText: 'Yes',
                modalCancelBtnText: 'No',
                onSuccess() {
                    vscode.postMessage(MessageCommands.SYNC_CANCEL, 'Sync cancelled by user');
                }
            });
        } else {
            const updateSetsMap = new Map();
            selectedFilesMap.forEach((value, scopeId) => {
                updateSetsMap.set(scopeId, gUserSelectionForUpdateSets.get(scopeId));
            });

            // Pass data to vscode and close webview
            const finalData = {
                files: Object.fromEntries(selectedFilesMap),
                updateSets: Object.fromEntries(updateSetsMap)
            };
            vscode.postMessage(MessageCommands.SYNC_SUBMIT, finalData);
        }
    }

    function toggleAlert(scopeId, updateSetId) {
        gUserSelectionForUpdateSets.set(scopeId, updateSetId);
        const alertNode = $(`#app-${scopeId} > .alert`);
        const isUpdateSetDefault = isDefaultUpdateSet(updateSetId);

        if (isUpdateSetDefault) {
            // Check if current scope has only one updateset
            let message = (gUpdateSetMap.get(scopeId).length === 1 ? ONLY_ONE_UPDATE_SET_EXISTS_MESSAGE : DEFAULT_UPDATE_SET_SELECTED_MESSAGE);
            // alert.text(message).show();
            message = '<i class="codicon codicon-warning codicon-spacing" ></i>' + message;
            alertNode.html(message).show();
        } else {
            alertNode.hide();
        }

        if (!$(`#files-tree-${scopeId}`).hasClass('jstree-loading')) {
            updateJSTreeState(scopeId, isUpdateSetDefault);
        }
    }

    function updateJSTreeState(scopeId, isUpdateSetDefault) {
        const jstreeContainer = $(`#files-tree-${scopeId}`);
        const jstreeInstance = jstreeContainer.jstree();

        if (!isUpdateSetDefault) {
            isUpdateSetDefault = $(`#app-${scopeId} > .alert`).is(':visible');
        }

        const treeNodes = jstreeContainer.find('li.jstree-node');
        const nodeIds = $.map(treeNodes, (node) => node.id);

        // If updateset is default then unslect all node and disable tree
        if (isUpdateSetDefault) {
            jstreeInstance.deselect_all(true);
            jstreeInstance.disable_node(nodeIds);
        } else {
            jstreeInstance.select_all(true);
            jstreeInstance.enable_node(nodeIds);
        }
    }

    // Convert plain Object to ES6 Map
    function transformData(data) {
        const affectedScopesMap = new Map(Object.entries(data.affectedScopes));
        const affectedFilesMap = new Map(Object.entries(data.affectedFiles));
        const updateSetsMap = new Map(Object.entries(data.updateSets));
        const updateSetsStatusMap = new Map(Object.entries(data.updateSetsStatus));
        const currentUpdateSetsMap = new Map(Object.entries(data.currentUpdateSets));

        return {
            affectedScopesMap,
            affectedFilesMap,
            updateSetsMap,
            updateSetsStatusMap,
            currentUpdateSetsMap
        };
    }

    function getAppContainer(scope, appTemplate) {
        const appContainer = document.createElement('div');
        appContainer.className = 'app-container';
        appContainer.id = `app-${scope.scopeId}`;
        appContainer.innerHTML = appTemplate.replace(/{{scopeId}}/g, scope.scopeId).replace(/{{scopeName}}/g, scope.scopeName);

        return appContainer;
    }

    function isScopeHasDefaultUpdateSet(scopeId) {
        const updateSetId = gUserSelectionForUpdateSets.get(scopeId);
        return isDefaultUpdateSet(updateSetId);
    }

    function isDefaultUpdateSet(updateSetId) {
        const isDefault = gUpdateSetsStatusMap.get(updateSetId);
        return isDefault;
    }

    function getJSTreeConfig(data) {
        return {
            'plugins': ['wholerow', 'checkbox', 'sort'],
            'core': {
                'themes': {
                    'xstripes': true
                },
                'data': data
            },
            'checkbox': {
                'keep_selected_style': false
            }
        };
    }
})(jQuery);


// This piece of code handles modals on webview. Responsible for showing and closing the modal.
const modal = (function ($) {
    let modalTemplate;

    return { show };

    function show(options) {
        const {
            modalTitle,
            modalBody,
            modalOkBtnText = 'Proceed',
            modalCancelBtnText = 'Cancel',
            onSuccess,
            onCancel
        } = options;

        const template = getModalTemplate({ modalTitle, modalBody, modalOkBtnText, modalCancelBtnText });

        $('body').append(template);
        addEventHandlers(onSuccess, onCancel);
    }

    function getModalTemplate(options) {
        if (!modalTemplate) {
            modalTemplate = document.getElementById('modal-template').innerHTML;
        }

        return processTemplate(modalTemplate, options);
    }

    function processTemplate(template, options) {
        Object.keys(options).forEach(key => {
            const regEx = new RegExp(`{{${key}}}`);
            template = template.replace(regEx, options[key]);
        });

        return template;
    }

    function addEventHandlers(onSuccess, onCancel) {
        $('#modal').on('click', (e) => {
            e.stopPropagation();

            switch (e.target.id) {
                case 'okBtn':
                    $(e.currentTarget).remove();
                    onSuccess && onSuccess();
                    break;
                case 'modal':
                case 'cancelBtn':
                case 'closeIcon':
                    $(e.currentTarget).remove();
                    onCancel && onCancel();
                    break;
                default: void 0;

            }
        });
    }
})(jQuery);
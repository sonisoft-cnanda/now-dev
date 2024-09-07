/**
 * Copyright (C) 2020 ServiceNow, Inc. All rights reserved.
**/

(function( $ ){
    const UPDATE_SET_CHANGED = 'update_set_changed';
    const UPDATE_SET_PICKER_ACTIVE = 'update_set_picker_active';

    $.fn.updatesetpicker = function({updateSetsMap, currentUpdateSetsMap}) {
        return this.each(function() {
            const ele = $(this);
            const scopeId = ele.data('id');
            const updateSetPicker = new DocumentFragment();
            
            const currentUpdateSet = currentUpdateSetsMap.get(scopeId);
            const updateSets = updateSetsMap.get(scopeId);

            addHeader(scopeId, updateSetPicker, currentUpdateSet);
            addDropdown(updateSetPicker, updateSets);
            ele.append(updateSetPicker);
            registerEventHandlers(ele);

            dispatchEvent(UPDATE_SET_PICKER_ACTIVE, {scopeId, updateSetId: currentUpdateSet.sysId});
        });
    };

    function addHeader(scopeId, updateSetPicker, currentUpdateSet) {
        const dropdownHeader = document.createElement('button');
        dropdownHeader.className = 'dropdown-header'; 
        dropdownHeader.innerHTML = `
            <span class="selected-updateset" data-scope-id="${scopeId}" data-update-set-id="${currentUpdateSet.sysId}">${currentUpdateSet.name}</span>
            <i class="icon-toggle toggle-down"></i>`;

        updateSetPicker.appendChild(dropdownHeader);
    }

    function addDropdown(updateSetPicker, updateSets) {
        const dropdown = document.createElement('ul');
        dropdown.className = 'dropdown-menu';

        updateSets.forEach(updateSet => {
            const li = document.createElement('li');
            li.className = 'menu-item';
            li.textContent = updateSet.name;
            li.setAttribute('data-sys-id', updateSet.sysId);
            dropdown.appendChild(li);
        });

        updateSetPicker.appendChild(dropdown);
    }

    function registerEventHandlers(ele) {
        ele.on('click', '.dropdown-header', (e) => {
            toggleDropdown(ele);
        });

        ele.on('click', '.menu-item', (e) => {
            const currentTarget = $(e.currentTarget);
            const updateSetEl = ele.find('.selected-updateset');

            const scopeId = updateSetEl.data('scopeId');
            const oldUpdateSetId = updateSetEl.data('updateSetId');
            const newUpdateSetId = currentTarget.data('sysId');

            if (oldUpdateSetId !== newUpdateSetId) {
                updateSetEl
                    .text(currentTarget.text())
                    .data('updateSetId', newUpdateSetId);

                dispatchEvent(UPDATE_SET_CHANGED, {
                    scopeId,
                    oldUpdateSetId,
                    newUpdateSetId
                });
            }

            toggleDropdown(ele);
        });

        // If users press Esc button then close dropdown if already opened.
        $(document).on('keydown', function(event) {
            if (event.key === "Escape") { 
                closeDropdownIfOpened(ele);
            }
        });

        // If users click outside the dropdown then close it if already opened.
        $(document).on('click', function(event) { 
            if (!ele[0].contains(event.target)) {
                closeDropdownIfOpened(ele);
            }
        });
    }

    function toggleDropdown(ele) {
        ele.find('.dropdown-menu').slideToggle(100);
        const toggleIcon = ele.find('.icon-toggle');

        if (toggleIcon.hasClass('toggle-down')) {
            toggleIcon.removeClass('toggle-down').addClass('toggle-up');
        } else {
            toggleIcon.removeClass('toggle-up').addClass('toggle-down');
        }
    }

    function closeDropdownIfOpened(ele) {
        const toggleIcon = ele.find('.icon-toggle');

        if (toggleIcon.hasClass('toggle-up')) {
        	ele.find('.dropdown-menu').slideUp(100);
        	toggleIcon.removeClass('toggle-up').addClass('toggle-down');
        }
    }

    function dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }
})(jQuery);
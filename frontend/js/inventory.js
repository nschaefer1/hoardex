// =====================================================
// ENTRY POINT
// =====================================================

window.addEventListener('pywebviewready', () => {
    let api = window.pywebview.api;
    init(api);
});

async function init(api) {
    // Placeholder
    wire_buttons(api);
    wire_icon_drop_zone(api);
}

function wire_buttons(api) {
    on_click('log-out-btn', () => go('pg1'));

    // Inventory grid event listening wiring
    document.getElementById('inventory-grid').addEventListener('click', (e) => {
        const item = e.target.closest('.inv-item');
        if (!item) {
            close_item_drawer();
            return;
        }
        
        const isSelected = item.classList.contains('selected');
        document.querySelectorAll('.inv-item').forEach(i => i.classList.remove('selected'));
        if (!isSelected) {
            item.classList.add('selected');
            open_item_drawer(item);
        } else {
            close_item_drawer();
        }
    });

    // Add item to inventory button
    on_click('add-item-btn', () => open_sheet(api));
    on_click('add-item-overlay', () => close_sheet());

    // New item rendering in the HTML
    on_click('item-creation-btn', () => show_create_form());
    on_click('close-sheet-layout', () => close_sheet());

    // Item details button handling
    on_click('add-stat-btn', () => add_stat_row());
    on_click('sheet-submit-create', () => sheet_submit_handle(api));
    on_click('item-edit-btn', () => show_edit_form_populated());

    // Sheet search bar
    document.getElementById('sheet-search').addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        document.querySelectorAll('#sheet-item-list .inv-item').forEach(item => {
            const name = item.querySelector('.inv-item-name').textContent.toLowerCase();
            item.style.display = name.includes(query) ? '' : 'none';
        });
    });

    // Apply changes to item
    on_click('sheet-apply-changes', () => sheet_apply_changes_handle(api));

}


function open_item_drawer(item) {
    document.getElementById('item-drawer').classList.add('active');
}
function close_item_drawer() {
    document.querySelectorAll('.inv-item').forEach(i => i.classList.remove('selected'));
    document.getElementById('item-drawer').classList.remove('active');
}

function open_sheet(api) {
    document.getElementById('add-item-overlay').classList.add('active');
    document.getElementById('add-item-sheet').classList.add('active');
    load_icon_grid(api);
    load_sheet_item_list(api);
}
function close_sheet() {
    document.getElementById('add-item-overlay').classList.remove('active');
    document.getElementById('add-item-sheet').classList.remove('active');
    
    // Disable edit capabilities
    document.getElementById('item-edit-btn').classList.add('disabled');

    // Remove detail views
    document.getElementById('sheet-item-title').textContent = 'Select an item'
    document.getElementById('sheet-detail-view').innerHTML = ''

    // Show the details
    show_detail_form();
}

function show_create_form() {
    document.querySelectorAll('#sheet-item-list .inv-item').forEach(i => i.classList.remove('selected'));
    document.getElementById('sheet-item-title').textContent = 'New Item';

    document.getElementById('sheet-detail-view').style.display = 'none';
    document.getElementById('sheet-create-form').style.display = 'block';

    document.getElementById('sheet-detail-default').style.display = 'none';
    document.getElementById('sheet-detail-edit-footer').style.display = 'none';
    document.getElementById('sheet-detail-add-footer').style.display = 'block';

    document.getElementById('item-edit-btn').classList.add('disabled');
}
function show_edit_form() {
    document.getElementById('sheet-detail-view').style.display = 'none';
    document.getElementById('sheet-create-form').style.display = 'block';

    document.getElementById('sheet-detail-default').style.display = 'none';
    document.getElementById('sheet-detail-edit-footer').style.display = 'flex';
    document.getElementById('sheet-detail-add-footer').style.display = 'none';
}
function show_detail_form() {
    document.getElementById('sheet-detail-view').style.display = 'block';
    document.getElementById('sheet-create-form').style.display = 'none';

    document.getElementById('sheet-detail-default').style.display = 'block';
    document.getElementById('sheet-detail-edit-footer').style.display = 'none';
    document.getElementById('sheet-detail-add-footer').style.display = 'none';
}

async function sheet_submit_handle(api) {
    const ele = document.getElementById('sheet-submit-create')
    ele.classList.add('disabled');

    // Validate inventory name
    const inv_name = document.getElementById('create-inv-name').value.trim();
    if (!inv_name) {
        toast('Item name cannot be blank');
        ele.classList.remove('disabled');
        return;
    }

    // Validate weight_lbs
    const weight_lbs = document.getElementById('create-weight-lbs').value.trim() || null;
    if (weight_lbs !== null && isNaN(parseFloat(weight_lbs))) {
        toast('Weight must be a number');
        ele.classList.remove('disabled');
        return;
    }

    // Validate icon_stats
    const stats = get_stats();
    for (const [key, val] of Object.entries(stats)) {
        if (isNaN(parseFloat(val))) {
            toast(`Stat "${key}" must be a number`);
            ele.classList.remove('disabled');
            return;
        }
    }
    
    const inv_desc = document.getElementById('create-inv-desc').value.trim() || null;
    const inv_type = document.getElementById('create-inv-type').value.trim() || null;
    const equip_location = document.getElementById('create-equip-location').value.trim() || null;
    const child_ind = document.getElementById('create-child-ind').checked ? 1 : 0;
    const icon_path = document.querySelector('.icon-option.selected')?.dataset.path || null;

    const response = await api.post_inventory_item(
        inv_name, inv_desc, child_ind, inv_type, equip_location,
        icon_path, weight_lbs, stats
    );

    if (!response.success) {
        toast('Failed to create item');
        console.error('Item creation failed:', response.message);
        ele.classList.remove('disabled');
        return;
    }

    console.log('Item created successfully.');
    ele.classList.remove('disabled');
    reset_create_form();        // clear out the create form
    await load_sheet_item_list(api);  // load the sheet detail again

    // Auto-select the newly created item
    const items = document.querySelectorAll('#sheet-item-list .inv-item');
    items.forEach(ele => {
        if (ele.querySelector('.inv-item-name').textContent === inv_name) {
            ele.click();
        }
    });

    show_detail_form();         // show the detail form
}

function add_stat_row() {
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `
        <input type="text" placeholder="Stat name">
        <input type="text" placeholder="Value">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-btn sm"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
    `;
    row.querySelector('svg').addEventListener('click', () => row.remove());
    document.getElementById('stat-rows').appendChild(row);
}

function get_stats() {
    const stats = {};
    document.querySelectorAll('.stat-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        const key = inputs[0].value.trim();
        const val = inputs[1].value.trim();
        if (key) stats[key] = val;
    });
    return stats;
}

function reset_create_form() {
    document.getElementById('create-inv-name').value = '';
    document.getElementById('create-inv-desc').value = '';
    document.getElementById('create-inv-type').value = '';
    document.getElementById('create-equip-location').value = '';
    document.getElementById('create-weight-lbs').value = '';
    document.getElementById('create-child-ind').checked = false;
    document.getElementById('stat-rows').innerHTML = '';
    document.querySelectorAll('.icon-option').forEach(i => i.classList.remove('selected'));
}

function wire_icon_drop_zone(api) {
    const drop_zone = document.getElementById('icon-panel');

    drop_zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        drop_zone.classList.add('dragover');
    });

    drop_zone.addEventListener('dragleave', () => {
        drop_zone.classList.remove('dragover');
    });

    drop_zone.addEventListener('drop', async (e) => {
        e.preventDefault();
        drop_zone.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (!file) return;

        if (file.type !== 'image/png') {
            toast('Only PNG files are supported');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result.split(',')[1];
            const response = await api.post_icon(file.name, base64);
            if (!response.success) {
                toast('Icon upload failed.');
                return;
            }
            add_icon_to_grid(api, response.data.icon_path, true);
        };
        reader.readAsDataURL(file);
    });
}

function add_icon_to_grid(api, icon_path, auto_select = false) {
    const grid = document.getElementById('icon-grid');

    let option = grid.querySelector(`[data-path="${icon_path}"]`);

    if (!option) {
        option = document.createElement('div');
        option.className = 'icon-option';
        option.dataset.path = icon_path;
        option.innerHTML = `<img src="../../${icon_path}" alt="">`;
        option.addEventListener('click', () => {
            document.querySelectorAll('.icon-option').forEach(i => i.classList.remove('selected'));
            option.classList.add('selected');
        });

        option.addEventListener('contextmenu', async (e) => {
            e.preventDefault();
            if (await confirm_dialog('Delete this icon? This cannot be undone.')) {
                const response = await api.delete_icon(icon_path);
                if (!response.success) {
                    toast('Failed to delete icon.');
                    return;
                }
                option.remove();
                await load_sheet_item_list(api);
            }
        });
        grid.appendChild(option);
    }

    if (auto_select) {
        document.querySelectorAll('.icon-option').forEach(i => i.classList.remove('selected'));
        option.classList.add('selected');
    }
}

function toast(message, duration = 2500) {
    let t = document.getElementById('toast');
    t.innerText = message;
    t.classList.add('active');
    setTimeout(() => t.classList.remove('active'), duration);
}

async function load_icon_grid(api) {
    const response = await api.get_all_icons();
    console.log(response);
    if (!response.success) {
        toast('Could not load icons')
        return;
    }

    const grid = document.getElementById('icon-grid');
    grid.innerHTML = '';
    response.data.forEach(icon_path => add_icon_to_grid(api, icon_path, false));
}

async function load_sheet_item_list(api) {
    const response = await api.get_all_inventory_items();

    if (!response.success) {
        toast('Could not load items')
        console.error('Could not load items')
        return;
    }

    const list = document.getElementById('sheet-item-list');
    list.innerHTML = '';
    response.data.forEach(item => {
        const ele = document.createElement('div');
        ele.className = 'inv-item';
        ele.dataset.invCk = item.inv_ck;
        ele._item_data = item;
        ele.innerHTML = `
            <div class="inv-item-icon">
                <img src="../../${item.icon_path}" alt="">
            </div>
            <div class="inv-item-body">
                <div class="inv-item-name">${item.inv_name}</div>
                <div class="inv-item-meta">${item.inv_type || ''}</div>
            </div>
        `;
        ele.addEventListener('click', () => {
            document.querySelectorAll('#sheet-item-list .inv-item').forEach(i => i.classList.remove('selected'));
            ele.classList.add('selected');
            load_item_details(api, item.inv_ck);
        });
        
        ele.addEventListener('contextmenu', async (e) => {
            e.preventDefault();
            if (await confirm_dialog(`Remove "${item.inv_name}" from the item library? This cannot be undone.`)) {
                const response = await api.delete_inventory_item(item.inv_ck);
                if (!response.success) {
                    toast('Failed to delete item.');
                    return;
                }
                ele.remove();
                document.getElementById('sheet-detail-view').innerHTML = '';
                document.getElementById('sheet-item-title').textContent = 'Select an item';
                show_detail_form();
            }
        });

        list.appendChild(ele);
    });
}

async function load_item_details(api, inv_ck) {
    const response = await api.get_inventory_item(inv_ck);
    if (!response.success) {
        toast('Could not load item details.');
        return;
    }

    const item = response.data;
    document.getElementById('sheet-item-title').textContent = item.inv_name;
    document.getElementById('sheet-detail-view').innerHTML = `
        <div class="form-group">
            <span class="sidebar-label">Type</span>
            <span class="sidebar-value">${item.inv_type || '—'}</span>
        </div>
        <div class="form-group">
            <span class="sidebar-label">Description</span>
            <span class="sidebar-value">${item.inv_desc || '—'}</span>
        </div>
        <div class="form-group">
            <span class="sidebar-label">Equip Location</span>
            <span class="sidebar-value">${item.equip_location || '—'}</span>
        </div>
        <div class="form-group">
            <span class="sidebar-label">Weight</span>
            <span class="sidebar-value">${item.weight_lbs != null ? item.weight_lbs + ' lbs' : '—'}</span>
        </div>
        <div class="form-group">
            <span class="sidebar-label">Sub-Inventory</span>
            <span class="sidebar-value">${item.child_ind ? 'Yes' : 'No'}</span>
        </div>
    `;

    show_detail_form();
    document.getElementById('item-edit-btn').classList.remove('disabled');
}

function show_edit_form_populated() {
    const selected = document.querySelector('#sheet-item-list .inv-item.selected');
    if (!selected) return;

    const inv_ck = selected.dataset.invCk;

    // Grab current values from the detail view
    const title = document.getElementById('sheet-item-title').textContent;

    // We need the full item data — store it on the element
    const item = selected._item_data;
    if (!item) return;

    document.getElementById('create-inv-name').value = item.inv_name || '';
    document.getElementById('create-inv-desc').value = item.inv_desc || '';
    document.getElementById('create-inv-type').value = item.inv_type || '';
    document.getElementById('create-equip-location').value = item.equip_location || '';
    document.getElementById('create-weight-lbs').value = item.weight_lbs || '';
    document.getElementById('create-child-ind').checked = item.child_ind === 1;
    document.getElementById('stat-rows').innerHTML = '';

    if (item.inv_stats) {
        const stats = typeof item.inv_stats === 'string' ? JSON.parse(item.inv_stats) : item.inv_stats;
        Object.entries(stats).forEach(([key, val]) => {
            add_stat_row_populated(key, val);
        });
    }

    show_edit_form();
}

function add_stat_row_populated(key = '', val = '') {
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `
        <input type="text" placeholder="Stat name" value="${key}">
        <input type="text" placeholder="Value" value="${val}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-btn sm"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
    `;
    row.querySelector('svg').addEventListener('click', () => row.remove());
    document.getElementById('stat-rows').appendChild(row);
}

async function sheet_apply_changes_handle(api) {
    const ele = document.getElementById('sheet-apply-changes');
    ele.classList.add('disabled');

    const selected = document.querySelector('#sheet-item-list .inv-item.selected');
    if (!selected) return;
    const inv_ck = parseInt(selected.dataset.invCk);

    const inv_name = document.getElementById('create-inv-name').value.trim();
    if (!inv_name) {
        toast('Item name cannot be blank');
        ele.classList.remove('disabled');
        return;
    }

    const weight_lbs = document.getElementById('create-weight-lbs').value.trim() || null;
    if (weight_lbs !== null && isNaN(parseFloat(weight_lbs))) {
        toast('Weight must be a number');
        ele.classList.remove('disabled');
        return;
    }

    const stats = get_stats();
    for (const [key, val] of Object.entries(stats)) {
        if (isNaN(parseFloat(val))) {
            toast(`Stat "${key}" must be a number`);
            ele.classList.remove('disabled');
            return;
        }
    }

    const response = await api.put_inventory_item(inv_ck, {
        inv_name,
        inv_desc: document.getElementById('create-inv-desc').value.trim() || null,
        inv_type: document.getElementById('create-inv-type').value.trim() || null,
        equip_location: document.getElementById('create-equip-location').value.trim() || null,
        weight_lbs: weight_lbs ? parseFloat(weight_lbs) : null,
        child_ind: document.getElementById('create-child-ind').checked ? 1 : 0,
        inv_stats: stats,
        icon_path: document.querySelector('.icon-option.selected')?.dataset.path || null,
    });

    if (!response.success) {
        toast('Failed to apply changes');
        console.error('Apply changes failed:', response.message);
        ele.classList.remove('disabled');
        return;
    }

    ele.classList.remove('disabled');
    await load_sheet_item_list(api);
    await load_item_details(api, inv_ck);
}
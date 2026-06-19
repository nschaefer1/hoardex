let qty = 1;        // quantity variable tied to the counter
let pending_inc = {};   // prevents conflicts with button spams on the inventory panel screen
let inc_timers = {};

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
    await load_character_inventory(api);
    wire_inventory_buttons(api);
}

function wire_buttons(api) {
    on_click('log-out-btn', () => go('pg1'));

    // Inventory grid event listening wiring
    document.getElementById('inventory-grid').addEventListener('click', (e) => {
        if (e.target.closest('.increment-btn, .decrement-btn, .drop-btn')) return;
        const item = e.target.closest('.inv-item');
        if (!item) {
            close_item_drawer();
            return;
        }
        
        const isSelected = item.classList.contains('selected');
        document.querySelectorAll('.inv-item').forEach(i => i.classList.remove('selected'));
        if (!isSelected) {
            item.classList.add('selected');
            open_item_drawer(api, item);
        } else {
            close_item_drawer();
        }
    });

    // Add item to inventory button
    on_click('add-item-btn', () => open_sheet(api));
    on_click('add-item-overlay', () => close_sheet(api));

    // New item rendering in the HTML
    on_click('item-creation-btn', () => show_create_form());
    on_click('close-sheet-layout', () => close_sheet(api));

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

    // Add item to inventory button
    on_click('sheet-add-btn', () => sheet_add_to_inventory_handle(api));
    on_click('qty-up', () => {
        qty = parseInt(document.getElementById('add-qty-input').textContent) || 1;
        qty = Math.min(qty + 1, 99999);
        document.getElementById('add-qty-input').textContent = qty;
    });

    on_click('qty-down', () => {
        qty = parseInt(document.getElementById('add-qty-input').textContent) || 1;
        qty = Math.max(qty - 1, 1);
        document.getElementById('add-qty-input').textContent = qty;
    });

    document.getElementById('add-qty-input').addEventListener('dblclick', () => {
        const ele = document.getElementById('add-qty-input');
        ele.contentEditable = 'true';
        ele.focus();
        document.execCommand('selectAll');
    });

    document.getElementById('add-qty-input').addEventListener('blur', () => {
        const ele = document.getElementById('add-qty-input');
        ele.contentEditable = 'false';
        const val = parseInt(ele.textContent);
        qty = isNaN(val) || val < 1 ? 1 : Math.min(val, 99999);
        ele.textContent = qty;
    });

    document.getElementById('add-qty-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('add-qty-input').blur();
        }
    });

}


async function open_item_drawer(api, item) {

    const response = await api.get_inventory_item(parseInt(item.dataset.invCk));
    if (!response.success) {
        toast('Could not load item details.');
        return;
    }

    const data = response.data;
    const stats = data.inv_stats ? 
        (typeof data.inv_stats === 'string' ? JSON.parse(data.inv_stats) : data.inv_stats) 
        : {};

    const stats_html = Object.keys(stats).length > 0
        ? Object.entries(stats).map(([k, v]) => `
            <div class="stat-row">
                <span style="flex:1; font-size:13px; color:var(--text-secondary);">${k}</span>
                <span style="font-size:13px; color:var(--text-primary);">${v}</span>
            </div>`).join('')
        : `<span class="sidebar-label">No stats defined</span>`;

    document.getElementById('item-drawer-content').innerHTML = `
        <div style="display:flex; gap:16px;">
            <div class="inv-item-icon" style="width:60px; height:60px; flex-shrink:0;">
                <img src="../../${data.icon_path}" alt="">
            </div>
            <div>
                <div style="font-size:16px; color:var(--text-primary); margin-bottom:4px;">${data.inv_name}</div>
                <div style="font-size:12px; color:var(--text-secondary);">${data.inv_type || '—'} ${data.equip_location ? '· ' + data.equip_location : ''}</div>
            </div>
        </div>
        <div class="create-section-divider"></div>
        <div style="display:flex; gap:24px; margin-bottom:12px;">
            <div>
                <span class="sidebar-label">Weight</span>
                <span class="sidebar-value">${data.weight_lbs != null ? data.weight_lbs + ' lbs' : '—'}</span>
            </div>
            <div>
                <span class="sidebar-label">Sub-Inventory</span>
                <span class="sidebar-value">${data.child_ind ? 'Yes' : 'No'}</span>
            </div>
        </div>
        ${data.inv_desc ? `
        <div style="margin-bottom:12px;">
            <span class="sidebar-label">Description</span>
            <span class="sidebar-value">${data.inv_desc}</span>
        </div>` : ''}
        <span class="create-section-label">Stats</span>
        ${stats_html}
    `;

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
function close_sheet(api) {
    document.getElementById('add-item-overlay').classList.remove('active');
    document.getElementById('add-item-sheet').classList.remove('active');
    qty = 1;
    document.getElementById('add-qty-input').textContent = 1;
    
    // Disable edit capabilities
    document.getElementById('item-edit-btn').classList.add('disabled');

    // Remove detail views
    document.getElementById('sheet-item-title').textContent = 'Select an item'
    document.getElementById('sheet-detail-view').innerHTML = ''

    // Show the details
    show_detail_form();
    document.getElementById('sheet-add-btn').classList.add('disabled');

    // Update the inventory
    load_character_inventory(api);
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
    document.getElementById('sheet-add-btn').classList.add('disabled');
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

    document.getElementById('sheet-detail-default').style.display = 'flex';
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
    const icon_path = document.querySelector('.icon-option.selected')?.dataset.path || 'frontend/icons/default.png';

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

    const stats = item.inv_stats ?
        (typeof item.inv_stats === 'string' ? JSON.parse(item.inv_stats) : item.inv_stats)
        : {};

    const stats_html = Object.keys(stats).length > 0
        ? Object.entries(stats).map(([k, v]) => `
            <div class="stat-row">
                <span style="flex:1; font-size:13px; color:var(--text-secondary);">${k}</span>
                <span style="font-size:13px; color:var(--text-primary);">${v}</span>
            </div>`).join('')
        : '<span class="sidebar-label">No stats defined</span>';

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
        <div class="form-group">
            <span class="sidebar-label">Stats</span>
            ${stats_html}
        </div>
    `;

    show_detail_form();
    document.getElementById('item-edit-btn').classList.remove('disabled');
    document.getElementById('sheet-add-btn').classList.remove('disabled');
}

function show_edit_form_populated() {
    const selected = document.querySelector('#sheet-item-list .inv-item.selected');
    if (!selected) return;

    const inv_ck = selected.dataset.invCk;

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
        icon_path: document.querySelector('.icon-option.selected')?.dataset.path || 'frontend/icons/default.png',
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

async function sheet_add_to_inventory_handle(api) {
    const selected = document.querySelector('#sheet-item-list .inv-item.selected');
    if (!selected) return;

    const inv_ck = parseInt(selected.dataset.invCk);
    const qty = parseInt(document.getElementById('add-qty-input').textContent) || 1;

    const ele = document.getElementById('sheet-add-btn');
    ele.classList.add('disabled');

    const character_ck = await api.get_session('character_ck');
    if (!character_ck.success || !character_ck.data) {
        toast("No character selected");
        ele.classList.remove('disabled');
        return;
    }

    const response = await api.post_inventory_transaction(inv_ck, character_ck.data, qty);
    if (!response.success) {
        toast('Failed to add item to inventory.');
        ele.classList.remove('disabled');
        return;
    }

    toast(`Added ${qty}x to inventory.`);
    ele.classList.remove('disabled');
    // close_sheet();
}

async function load_character_inventory(api) {
    const grid = document.getElementById('inventory-grid');
    grid.classList.add('reloading');

    const session = await api.get_session('character_ck');
    if (!session.success || !session.data) {
        toast('No character selected.');
        return;
    }
    const character_ck = session.data;

    const response = await api.get_character_inventory(character_ck);
    if (!response.success) {
        toast('Could not load inventory.');
        return;
    }

    grid.innerHTML = '';
    
    response.data.forEach(item => {
        const ele = document.createElement('div');
        ele.className = 'inv-item';
        ele.dataset.invCk = item.inv_ck;
        ele.innerHTML = `
            <div class="inv-item-icon">
                <img src="../../${item.icon_path}" alt="">
            </div>
            <div class="inv-item-body">
                <div class="inv-item-name">${item.inv_name}</div>
                <div class="inv-item-meta">${item.inv_type || ''}</div>
            </div>
            <div class="inv-item-right">
                <div class="inv-item-qty">x${item.quantity}</div>
                <div class="toolbar-sep"></div>
                <div style="display:flex; gap:6px;">
                    <svg class="icon-btn sm increment-btn" data-inv-ck="${item.inv_ck}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    <svg class="icon-btn sm decrement-btn" data-inv-ck="${item.inv_ck}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>
                    <svg class="icon-btn sm drop-btn" data-inv-ck="${item.inv_ck}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </div>
            </div>
        `;
        grid.appendChild(ele);
    });

    grid.classList.remove('reloading');
}

async function wire_inventory_buttons(api) {
    const session = await api.get_session('character_ck');
    if (!session.success || !session.data) return;
    const character_ck = session.data;

    document.getElementById('inventory-grid').addEventListener('click', async (e) => {
        const inc  = e.target.closest('.increment-btn');
        const dec  = e.target.closest('.decrement-btn');
        const drop = e.target.closest('.drop-btn');

        if (!inc && !dec && !drop) return;

        const inv_ck = parseInt((inc || dec || drop).dataset.invCk);

        if (inc) {
            const qty_ele = inc.closest('.inv-item').querySelector('.inv-item-qty');
            qty_ele.textContent = `x${parseInt(qty_ele.textContent.replace('x', '')) + 1}`;
            debounced_transaction(api, inv_ck, character_ck, 1);
        } else if (dec) {
            const qty_ele = dec.closest('.inv-item').querySelector('.inv-item-qty');
            const displayed = parseInt(qty_ele.textContent.replace('x', ''));
            const pending = pending_inc[inv_ck] || 0;
            
            // displayed + pending = what we'll end up with after debounce fires
            if (displayed + pending < 1) return;
            
            if (displayed > 1) {
                qty_ele.textContent = `x${displayed - 1}`;
            }
            debounced_transaction(api, inv_ck, character_ck, -1);
        } else if (drop) {
            const max_qty = parseInt(drop.closest('.inv-item').querySelector('.inv-item-qty').textContent.replace('x', ''));
            
            const confirmed = await drop_dialog(max_qty);
            if (confirmed === null) return;

            await api.post_inventory_transaction(inv_ck, character_ck, -confirmed);
            await load_character_inventory(api);
        }

    });
}

function drop_dialog(max_qty) {
    return new Promise((resolve) => {
        let drop_qty = 1;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.innerHTML = `
            <div class="modal">
                <p style="margin:0 0 16px 0;">How many would you like to drop?</p>
                <div style="display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:20px;">
                    <div class="qty-stepper">
                        <div class="qty-btn" id="_drop-down">−</div>
                        <span class="qty-value" id="_drop-qty">1</span>
                        <div class="qty-btn" id="_drop-up">+</div>
                    </div>
                    <span style="font-size:12px; color:var(--text-secondary);">/ ${max_qty}</span>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <div class="btn norm-size" id="_drop-confirm">Drop</div>
                    <div class="btn norm-size" style="background:var(--color-ghost); border:1px solid var(--color-ghost-border); color:var(--text-on-ghost);" id="_drop-cancel">Cancel</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#_drop-up').addEventListener('click', () => {
            drop_qty = Math.min(drop_qty + 1, max_qty);
            overlay.querySelector('#_drop-qty').textContent = drop_qty;
        });
        overlay.querySelector('#_drop-down').addEventListener('click', () => {
            drop_qty = Math.max(drop_qty - 1, 1);
            overlay.querySelector('#_drop-qty').textContent = drop_qty;
        });

        overlay.querySelector('#_drop-qty').addEventListener('dblclick', () => {
            const ele = overlay.querySelector('#_drop-qty');
            ele.contentEditable = 'true';
            ele.focus();
            document.execCommand('selectAll');
        });
        overlay.querySelector('#_drop-qty').addEventListener('blur', () => {
            const ele = overlay.querySelector('#_drop-qty');
            ele.contentEditable = 'false';
            const val = parseInt(ele.textContent);
            drop_qty = isNaN(val) || val < 1 ? 1 : Math.min(val, max_qty);
            ele.textContent = drop_qty;
        });
        overlay.querySelector('#_drop-qty').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); overlay.querySelector('#_drop-qty').blur(); }
        });

        overlay.querySelector('#_drop-confirm').addEventListener('click', () => {
            overlay.remove();
            resolve(drop_qty);
        });
        overlay.querySelector('#_drop-cancel').addEventListener('click', () => {
            overlay.remove();
            resolve(null);
        });
    });
}

function debounced_transaction(api, inv_ck, character_ck, delta) {
    pending_inc[inv_ck] = (pending_inc[inv_ck] || 0) + delta;
    
    clearTimeout(inc_timers[inv_ck]);
    inc_timers[inv_ck] = setTimeout(async () => {
        const total = pending_inc[inv_ck];
        delete pending_inc[inv_ck];
        delete inc_timers[inv_ck];
        await api.post_inventory_transaction(inv_ck, character_ck, total);
        await load_character_inventory(api);
    }, 300);
}
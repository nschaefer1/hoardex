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
    on_click('add-item-btn', () => open_sheet());

    // Sheet closing functionality
    on_click('add-item-overlay', () => close_sheet());

}


function open_item_drawer(item) {
    document.getElementById('item-drawer').classList.add('active');
}

function close_item_drawer() {
    document.querySelectorAll('.inv-item').forEach(i => i.classList.remove('selected'));
    document.getElementById('item-drawer').classList.remove('active');
}

function open_sheet() {
    document.getElementById('add-item-overlay').classList.add('active');
    document.getElementById('add-item-sheet').classList.add('active');
}

function close_sheet() {
    document.getElementById('add-item-overlay').classList.remove('active');
    document.getElementById('add-item-sheet').classList.remove('active');
}
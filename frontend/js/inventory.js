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
        if (!item) return;
        
        const isSelected = item.classList.contains('selected');
        document.querySelectorAll('.inv-item').forEach(i => i.classList.remove('selected'));
        if (!isSelected) item.classList.add('selected');
    });


}
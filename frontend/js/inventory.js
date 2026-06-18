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
}


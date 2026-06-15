
// =====================================================
// ENTRY POINT
// =====================================================

window.addEventListener('pywebviewready', () => {
    let api = window.pywebview.api;
    init(api);
});

async function init(api) {
    wire_buttons(api);
}

function wire_buttons(api) {
    on_click('theme-btn', toggle_theme);
}
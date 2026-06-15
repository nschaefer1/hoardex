
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

    document.querySelectorAll('.char-bust').forEach(bust => {
        bust.addEventListener('click', () => {
            const isSelected = bust.classList.contains('selected')
            document.querySelectorAll('.char-bust').forEach(b => b.classList.remove('selected'));
            if (!isSelected) bust.classList.add('selected');  
            sync_buttons();
        });
    });
}

function sync_buttons() {
    const anySelected = document.querySelector('.char-bust.selected') !== null;
    document.querySelectorAll('.btn[data-requires-selection]').forEach(btn => {
        btn.classList.toggle('disabled', !anySelected)
    })
}



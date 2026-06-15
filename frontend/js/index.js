
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

    on_click('new-char-btn', () => open_modal('new-char-modal'));
    on_click('close-modal-btn', () => close_modal('new-char-modal'));

    on_click('submit-new-char', () => {
        console.log('New character submitted to database')
        // TODO -- need to add the insert into the database
        close_modal('new-char-modal')
    });
}

function sync_buttons() {
    const anySelected = document.querySelector('.char-bust.selected') !== null;
    document.querySelectorAll('.btn[data-requires-selection]').forEach(btn => {
        btn.classList.toggle('disabled', !anySelected)
    })
}

function open_modal(id) { document.getElementById(id).classList.add('active'); }
function close_modal(id) { document.getElementById(id).classList.remove('active'); }
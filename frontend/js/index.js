
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

    on_click('submit-new-char', async () => {
        const submit_btn = document.getElementById('submit-new-char');
        submit_btn.classList.add('disabled');
        const char_name = document.getElementById('new-char-name').value.trim();
        if (!char_name) {
            toast('Character name cannot be blank');
            console.log('Character name identified as blank.');
            submit_btn.classList.remove('disabled');
            return;
        }
        const response = await api.post_character(char_name);
        if (!response.success) {
            toast('Character name failed to be submitted to database');
            console.error('Character name submission failed. DB error: ', response.message);
            submit_btn.classList.remove('disabled');
            return;
        }
        console.log('Character name added to database successfully');
        location.reload();
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

function toast(message, duration = 2500) {
    let t = document.getElementById('toast');
    t.innerText = message;
    t.classList.add('active');
    setTimeout(() => t.classList.remove('active'), duration);
}

// =====================================================
// ENTRY POINT
// =====================================================

window.addEventListener('pywebviewready', () => {
    let api = window.pywebview.api;
    init(api);
});

async function init(api) {
    load_characters(api);
    wire_buttons(api);
}

async function load_characters(api) {

    // Retrieve list of characters from API
    const response = await api.get_all_characters();
    if (!response.success) {
        toast('Characters could not be retrieved from database');
        console.error('Characters could not be retrieved from database.');
        return;
    }
    // Check  response validitiy
    const data = response.data;
    if (!data || data.length === 0) {
        toast('No characters found in database');
        console.log('No characters found in database.');
        return;
    }
    // Document elements
    const top = document.getElementById('top-level-container');
    const others = document.getElementById('other-char-container');
    // Add the busts to the document
    top.innerHTML = build_bust(data[0], true);
    others.innerHTML = data.slice(1).map(c => build_bust(c, false)).join('');
    // Wire them to work
    wire_busts();
}

function build_bust(character, large) {
    const sizeClass = large ? 'char-bust large' : 'char-bust';
    const icon = character.icon_path ? `../../../../${character.icon_path}` : '../icons/default_bust.png';
    console.log(sizeClass)
    return `
        <div class="${sizeClass}" data-ck="${character.character_ck}">
            <img class="bust-icon" src="'${icon}" width="100%" height="100%" style="object-fit:cover;">
            <div class="bust-name">
                ${character.character_name}
            </div>
        </div>
    `
}

function wire_busts() {
    document.querySelectorAll('.char-bust').forEach(bust => {
        bust.addEventListener('click', () => {
            const isSelected = bust.classList.contains('selected')
            document.querySelectorAll('.char-bust').forEach(b => b.classList.remove('selected'));
            if (!isSelected) bust.classList.add('selected');  
            sync_buttons();
        });
    });
}

function wire_buttons(api) {
    on_click('theme-btn', toggle_theme);

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
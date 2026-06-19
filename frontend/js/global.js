if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light');
}

function set_theme(mode) {
    if (mode === 'light') {
        document.documentElement.classList.add('light');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.remove('light');
        localStorage.setItem('theme', 'dark');
    }
}

function toggle_theme() {
    const is_light = document.documentElement.classList.contains('light');
    set_theme(is_light ? 'dark' : 'light');
}

function get_colors() {
    const styles = getComputedStyle(document.documentElement);

    const colors = {
        primary:    styles.getPropertyValue('--color-primary').trim(),
        danger:     styles.getPropertyValue('--color-danger').trim(),
        success:    styles.getPropertyValue('--color-success').trim(),
        text:       styles.getPropertyValue('--text-primary').trim(),
        textMuted:  styles.getPropertyValue('--text-secondary').trim(),
        border:     styles.getPropertyValue('--border').trim(),
    };

    return colors;
};

function on_click(id, handler) {
    const ele = document.getElementById(id);
    ele.addEventListener('click', handler);
    return ele;
}

// Zoom controls
let zoom = 1.0;

function zoomIn()    { zoom = Math.min(zoom + 0.1, 3.0); _applyZoom(); }
function zoomOut()   { zoom = Math.max(zoom - 0.1, 0.3); _applyZoom(); }
function resetZoom() { zoom = 1.0; _applyZoom(); }

function _applyZoom() {
    document.body.style.zoom = zoom;
}

document.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
}, { passive: false });

document.addEventListener('keydown', (e) => {
    if (!e.ctrlKey) return;
    if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
    else if (e.key === '-')             { e.preventDefault(); zoomOut(); }
    else if (e.key === '0')             { e.preventDefault(); resetZoom(); }
});

// Boilerplate Confirm Dialog Box -- assumes variables are built in the CSS
function confirm_dialog(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.innerHTML = `
            <div class="modal">
                <p style="margin:0 0 20px 0;">${message}</p>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <div class="btn norm-size" id="_confirm-yes">Confirm</div>
                    <div class="btn norm-size" style="background:var(--color-danger);" id="_confirm-no">Cancel</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#_confirm-yes').addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });
        overlay.querySelector('#_confirm-no').addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });
    });
}
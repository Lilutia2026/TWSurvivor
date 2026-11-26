// 登入選角的預覽狀態，確認進村時才套用角色與測試型態。
const LOGIN_ROSTER_PAGE_SIZE = 8;
let loginRosterPage = 0;
let loginCharacterId = null;
let loginVariantId = null;
let loginPreviewFrame = null;
let loginPreviewVersion = 0;

function openLoginSelectScreen() {
    if (typeof leaveTownClad === 'function') leaveTownClad();
    const stageView = document.getElementById('stage-select-view');
    if (stageView) stageView.style.display = 'none';

    const loginView = document.getElementById('login-select-view');
    if (!loginView) return;
    loginView.style.display = 'flex';
    selectLoginCharacter(CHARACTERS[saveData.charId]?.playable ? saveData.charId : 'lucien');
    if (typeof AudioManager !== 'undefined') AudioManager.play('char_select');
}

function logoutToCharacterSelect() {
    if (typeof saveGame === 'function') saveGame();
    openLoginSelectScreen();
}

function renderLoginCharacterCards() {
    const roster = Object.entries(CHARACTERS);
    const pageCount = Math.max(1, Math.ceil(roster.length / LOGIN_ROSTER_PAGE_SIZE));
    loginRosterPage = Math.max(0, Math.min(pageCount - 1, loginRosterPage));
    const start = loginRosterPage * LOGIN_ROSTER_PAGE_SIZE;
    document.getElementById('login-char-grid').innerHTML = roster.slice(start, start + LOGIN_ROSTER_PAGE_SIZE).map(([id, character]) => `
        <button class="login-roster-button" type="button" data-character-id="${id}" data-locked="${!character.playable}"
            aria-pressed="${id === loginCharacterId}" aria-label="${character.name}${character.playable ? '' : '，尚未開放'}"
            style="--roster-accent:${character.color || '#60a5fa'}" onclick="selectLoginCharacter('${id}', true)">
            <span class="login-avatar" aria-hidden="true">
                ${character.name.charAt(0)}
                ${character.portraitImage ? `<img src="assets/characters/${character.portraitImage}" alt="" onerror="this.hidden = true">` : ''}
            </span>
            <span class="login-roster-name">${character.name.split('．')[0]}</span>
        </button>
    `).join('');
    document.getElementById('login-pagination').hidden = pageCount === 1;
    document.getElementById('login-page-number').textContent = `第 ${loginRosterPage + 1}／${pageCount} 頁`;
    document.getElementById('login-prev-page').disabled = loginRosterPage === 0;
    document.getElementById('login-next-page').disabled = loginRosterPage === pageCount - 1;
}

function changeLoginRosterPage(offset) {
    loginRosterPage += offset;
    renderLoginCharacterCards();
}

function renderLoginVariants(character) {
    document.getElementById('login-variant-label').textContent = character.playable ? '武器型態（測試）' : '尚未開放';
    document.getElementById('login-variants').innerHTML = character.playable
        ? Object.entries(character.variants).map(([id, variant]) => `
            <button class="login-variant" type="button" data-variant-id="${id}" aria-pressed="${id === loginVariantId}"
                onclick="selectLoginVariant('${id}')">${variant.wName}</button>
          `).join('')
        : '';
}

function selectLoginCharacter(charId, restoreFocus = false) {
    const character = CHARACTERS[charId];
    if (!character) return;
    loginCharacterId = charId;
    const savedVariant = getSavedTrialVariant(charId);
    loginVariantId = character.variants?.[savedVariant] ? savedVariant : character.defaultVariant;
    loginRosterPage = Math.floor(Object.keys(CHARACTERS).indexOf(charId) / LOGIN_ROSTER_PAGE_SIZE);
    renderLoginCharacterCards();
    document.getElementById('login-showcase').style.setProperty('--character-accent', character.color || '#60a5fa');
    document.getElementById('login-character-name').textContent = character.name;
    document.getElementById('login-character-title').textContent = character.title;
    document.getElementById('login-enter-town').disabled = !character.playable;
    renderLoginVariants(character);
    renderLoginPreview(character);
    if (restoreFocus) document.querySelector(`[data-character-id="${charId}"]`)?.focus({ preventScroll: true });
}

function selectLoginVariant(variantId) {
    const character = CHARACTERS[loginCharacterId];
    if (!character?.playable || !character.variants[variantId]) return;
    loginVariantId = variantId;
    renderLoginVariants(character);
    document.querySelector(`[data-variant-id="${variantId}"]`)?.focus({ preventScroll: true });
}

function stopLoginPreview() {
    loginPreviewVersion++;
    if (loginPreviewFrame !== null) cancelAnimationFrame(loginPreviewFrame);
    loginPreviewFrame = null;
}

function renderLoginPreview(character) {
    stopLoginPreview();
    const version = loginPreviewVersion;
    const view = document.getElementById('login-select-view');
    const canvas = document.getElementById('login-preview-canvas');
    const image = document.getElementById('login-preview-image');
    const placeholder = document.getElementById('login-preview-placeholder');
    const message = document.getElementById('login-preview-message');
    document.getElementById('login-preview-symbol').textContent = character.name.charAt(0);
    message.textContent = '角色圖像準備中';
    canvas.hidden = image.hidden = true;
    placeholder.hidden = false;

    // 角色資料可選填 portraitImage 與 previewImage，兩者皆為 assets/characters 下的檔名。
    if (character.previewImage) {
        const still = new Image();
        still.onload = () => {
            if (version !== loginPreviewVersion || !canvas.hidden) return;
            image.src = still.src;
            image.hidden = false;
            placeholder.hidden = true;
        };
        still.src = `assets/characters/${character.previewImage}`;
    }

    const meta = window.CHAR_ANIM_REGISTRY[character.id];
    const idle = meta?.animations?.idle;
    const base = ['down', 'downLeft', 'left', 'upLeft', 'up'].find(direction => idle?.[direction]?.length);
    if (!base) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const frames = idle[base].map(label => meta.frames?.[label]).filter(Boolean);
    if (frames.length === 0) return;
    const scale = Math.min(
        canvas.width * .58 / Math.max(...frames.map(frame => frame.w)),
        canvas.height * .63 / Math.max(...frames.map(frame => frame.h))
    );
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const atlas = SpriteAnimManager.ensureLoaded(character.id);
    if (!atlas) return;
    const draw = now => {
        loginPreviewFrame = null;
        if (version !== loginPreviewVersion || view.style.display !== 'flex') return;
        if (atlas.loading) {
            loginPreviewFrame = requestAnimationFrame(draw);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const drawn = SpriteAnimManager.drawCharacter(ctx, character.id, canvas.width / 2, canvas.height * .78, {
            dirInfo: { base, mirror: false },
            timeSec: reducedMotion ? Number.EPSILON : now / 1000,
            scale,
            footSink: 0
        });
        if (!drawn) return;
        canvas.hidden = false;
        image.hidden = placeholder.hidden = true;
        if (!reducedMotion) loginPreviewFrame = requestAnimationFrame(draw);
    };
    loginPreviewFrame = requestAnimationFrame(draw);
}

function confirmEnterTownFromLogin() {
    const character = CHARACTERS[loginCharacterId];
    if (!character?.playable) return;
    if (!switchCharacterVariant(loginCharacterId, loginVariantId)) return;
    stopLoginPreview();
    if (typeof saveGame === 'function') saveGame();
    recordDevPlayCount('sessions');
    if (typeof enterTownClad === 'function') enterTownClad();
}

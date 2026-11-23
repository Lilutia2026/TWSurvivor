// ============================================================================
// 《TW倖存者》登入與角色選擇大廳模組 (core/login.js)
// ============================================================================

function openLoginSelectScreen() {
    if (typeof leaveTownClad === 'function') leaveTownClad();
    const stageView = document.getElementById('stage-select-view');
    const lobbyPanel = document.getElementById('lobby');
    if (stageView) stageView.style.display = 'none';
    if (lobbyPanel) lobbyPanel.style.display = 'none';

    const loginView = document.getElementById('login-select-view');
    if (!loginView) return;
    loginView.style.display = 'flex';
if (typeof AudioManager !== 'undefined') AudioManager.play('char_select');
renderLoginCharacterCards();
}

function logoutToCharacterSelect() {
    if (typeof saveGame === 'function') saveGame();
    openLoginSelectScreen();
}

function renderLoginCharacterCards() {
    const grid = document.getElementById('login-char-grid');
    if (!grid || typeof CHARACTERS === 'undefined') return;

    const currentId = (typeof saveData !== 'undefined' && saveData.charId) ? saveData.charId : 'lucien';
    let html = '';

    Object.entries(CHARACTERS).forEach(([cid, c]) => {
        const isSelected = cid === currentId;
        const isImplemented = !!c.playable;
        const themeCol = c.color || '#60a5fa';
        const varKeys = c.variants ? Object.keys(c.variants) : [];
        const activeVid = isSelected ? (saveData.variantId || varKeys[0]) : (c.variants?.[c.defaultVariant] ? c.defaultVariant : varKeys[0]);
        const vName = c.variants?.[activeVid]?.wName || '標準型態';
        const varPicker = (isSelected && varKeys.length > 0)
            ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;" onclick="event.stopPropagation();">${varKeys.map(vk => {
                const vObj = c.variants[vk];
                const vAct = vk === activeVid;
                return `<button onclick="switchCharacterVariant('${cid}','${vk}');renderLoginCharacterCards();" style="padding:2px 6px;font-size:11px;border-radius:4px;cursor:pointer;border:1px solid ${vAct ? themeCol : '#475569'};background:${vAct ? themeCol : '#0f172a'};color:${vAct ? '#0f172a' : '#cbd5e1'};font-weight:${vAct ? 'bold' : 'normal'};">${vObj.wName}</button>`;
            }).join('')}</div>`
            : `<div style="font-size:12px;color:#cbd5e1;margin-top:8px;">預設型態：${vName}</div>`;

        html += `
            <div onclick="selectLoginCharacter('${cid}')" style="
                width:220px;padding:14px;border-radius:10px;cursor:pointer;
                background:${isSelected ? 'rgba(59,130,246,0.22)' : '#1e293b'};
                border:2px solid ${isSelected ? themeCol : '#334155'};
                box-shadow:${isSelected ? `0 0 12px ${themeCol}55` : 'none'};
                opacity:${isImplemented ? '1' : '0.55'};transition:0.15s;">
                <div style="font-size:16px;font-weight:bold;color:${isSelected ? themeCol : '#f8fafc'};">${c.name} ${isImplemented ? '' : '(籌備中)'}</div>
                <div style="font-size:12px;color:#94a3b8;margin-top:4px;">武器系：${(c.equipTags || []).join(' / ')}</div>
                ${varPicker}
                <div style="margin-top:10px;text-align:center;font-size:12px;font-weight:bold;color:${isSelected ? themeCol : '#64748b'};">
                    ${isSelected ? '✔ 已選定此角色' : (isImplemented ? '點擊選定' : '尚未開放')}
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function selectLoginCharacter(charId) {
    if (typeof saveData === 'undefined') return;
    const ch = (typeof CHARACTERS !== 'undefined') ? CHARACTERS[charId] : null;
    if (!ch || !ch.playable) {
        alert('此角色目前尚在籌備中，請先選擇路西安或蒂琪愛兒！');
        return;
    }
    if (typeof switchCharacterVariant === 'function') {
        switchCharacterVariant(charId);
    } else {
        saveData.charId = charId;
        saveData.charName = ch.name;
    }
    renderLoginCharacterCards();
}

function confirmEnterTownFromLogin() {
    if (typeof saveGame === 'function') saveGame();
    if (typeof enterTownClad === 'function') enterTownClad();
}

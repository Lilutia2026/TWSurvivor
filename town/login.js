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
    renderLoginCharacterCards();
}

function logoutToCharacterSelect() {
    if (typeof saveGame === 'function') saveGame();
    openLoginSelectScreen();
}

function renderLoginCharacterCards() {
    const grid = document.getElementById('login-char-grid');
    if (!grid || typeof CHARACTERS === 'undefined') return;

    const currentId = (typeof saveData !== 'undefined' && saveData.selectedChar) ? saveData.selectedChar : 'lucien';
    let html = '';

    Object.entries(CHARACTERS).forEach(([cid, c]) => {
        const isSelected = cid === currentId;
        const isImplemented = (cid === 'lucien' || cid === 'tichiel');
        html += `
            <div onclick="selectLoginCharacter('${cid}')" style="
                width:210px;padding:14px;border-radius:10px;cursor:pointer;
                background:${isSelected ? 'rgba(59,130,246,0.25)' : '#1e293b'};
                border:2px solid ${isSelected ? '#60a5fa' : '#334155'};
                opacity:${isImplemented ? '1' : '0.6'};transition:0.15s;">
                <div style="font-size:16px;font-weight:bold;color:#f8fafc;">${c.name} ${isImplemented ? '' : '(籌備中)'}</div>
                <div style="font-size:12px;color:#94a3b8;margin-top:4px;">武器系：${(c.equipTags || []).join(' / ')}</div>
                <div style="font-size:12px;color:#cbd5e1;margin-top:8px;">初始 HP：${c.baseHp || 100}</div>
                <div style="margin-top:10px;text-align:center;font-size:12px;font-weight:bold;color:${isSelected ? '#93c5fd' : '#64748b'};">
                    ${isSelected ? '✔ 已選定此角色' : '點擊選定'}
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function selectLoginCharacter(charId) {
    if (typeof saveData === 'undefined') return;
    saveData.selectedChar = charId;
    if (typeof switchCharacter === 'function') switchCharacter(charId);
    renderLoginCharacterCards();
}

function confirmEnterTownFromLogin() {
    if (typeof saveGame === 'function') saveGame();
    if (typeof enterTownClad === 'function') enterTownClad();
}

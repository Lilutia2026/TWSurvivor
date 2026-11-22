// ============================================================================
// 《TW倖存者》NPC 獨立模組：卡麗帕（角色倉庫 & 帳號共通倉庫）(npc/npc_kalipa.js)
// ============================================================================

let KALIPA_ACTIVE_TAB = 'char'; // 'char' 角色專屬倉庫 | 'account' 帳號共通倉庫

function openNpcKalipa(tab) {
    if (tab === 'char' || tab === 'account') KALIPA_ACTIVE_TAB = tab;
    if (!saveData.charStash) saveData.charStash = {};
    const cid = saveData.selectedChar || 'lucien';
    if (!saveData.charStash[cid]) saveData.charStash[cid] = [];
    if (!saveData.accountStash) saveData.accountStash = [];

    const stashList = KALIPA_ACTIVE_TAB === 'char' ? saveData.charStash[cid] : saveData.accountStash;
    const bagList = saveData.inventory || [];

    const html = `
        <div style="display:flex;gap:8px;margin-bottom:10px;">
            <button onclick="openNpcKalipa('char')" style="padding:6px 14px;border-radius:6px;cursor:pointer;border:1px solid #4ade80;background:${KALIPA_ACTIVE_TAB === 'char' ? '#166534' : '#1e293b'};color:#fff;">👤 角色專屬倉庫 (${saveData.charStash[cid].length}/40)</button>
            <button onclick="openNpcKalipa('account')" style="padding:6px 14px;border-radius:6px;cursor:pointer;border:1px solid #38bdf8;background:${KALIPA_ACTIVE_TAB === 'account' ? '#075985' : '#1e293b'};color:#fff;">🌐 帳號共通倉庫 (${saveData.accountStash.length}/40)</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="background:#1e293b;padding:10px;border-radius:8px;max-height:260px;overflow-y:auto;">
                <div style="font-size:13px;font-weight:bold;color:#cbd5e1;margin-bottom:6px;">🎒 隨身背包（點擊存入倉庫）</div>
                ${bagList.length === 0 ? '<div style="color:#64748b;font-size:12px;">背包空無一物</div>' : bagList.map((it, idx) => `
                    <div onclick="kalipaDeposit(${idx})" style="padding:5px 8px;background:#0f172a;border-radius:5px;margin-bottom:5px;cursor:pointer;font-size:12px;color:#e2e8f0;display:flex;justify-content:space-between;">
                        <span>${it.name} (LV.${it.lv || 1}) ${it.tradable === false ? '🔒' : ''}</span><span style="color:#4ade80;">存入 ➔</span>
                    </div>`).join('')}
            </div>
            <div style="background:#1e293b;padding:10px;border-radius:8px;max-height:260px;overflow-y:auto;">
                <div style="font-size:13px;font-weight:bold;color:#cbd5e1;margin-bottom:6px;">📦 ${KALIPA_ACTIVE_TAB === 'char' ? '角色專屬倉庫' : '帳號共通倉庫'}（點擊領出）</div>
                ${stashList.length === 0 ? '<div style="color:#64748b;font-size:12px;">倉庫目前為空</div>' : stashList.map((it, idx) => `
                    <div onclick="kalipaWithdraw(${idx})" style="padding:5px 8px;background:#0f172a;border-radius:5px;margin-bottom:5px;cursor:pointer;font-size:12px;color:#e2e8f0;display:flex;justify-content:space-between;">
                        <span style="color:#38bdf8;">⬅ 領出</span><span>${it.name} (LV.${it.lv || 1}) ${it.tradable === false ? '🔒' : ''}</span>
                    </div>`).join('')}
            </div>
        </div>
    `;
    openNpcModalShell('🏦 卡麗帕', '雙倉銀行管理員', '#4ade80', html);
}

function kalipaDeposit(bagIdx) {
    const cid = saveData.selectedChar || 'lucien';
    const target = KALIPA_ACTIVE_TAB === 'char' ? saveData.charStash[cid] : saveData.accountStash;
    if (target.length >= 40) return alert('此倉庫已滿！');
    const [item] = saveData.inventory.splice(bagIdx, 1);
    if (item) target.push(item);
    if (typeof saveGame === 'function') saveGame();
    openNpcKalipa();
}

function kalipaWithdraw(stashIdx) {
    const cid = saveData.selectedChar || 'lucien';
    const target = KALIPA_ACTIVE_TAB === 'char' ? saveData.charStash[cid] : saveData.accountStash;
    const [item] = target.splice(stashIdx, 1);
    if (item) saveData.inventory.push(item);
    if (typeof saveGame === 'function') saveGame();
    openNpcKalipa();
}

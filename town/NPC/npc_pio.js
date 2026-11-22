// ============================================================================
// 《TW倖存者》NPC 獨立模組：皮奧（裝備鑑定 & 每日限量部位賭博）(npc/npc_pio.js)
// ============================================================================

function openNpcModalShell(title, subtitle, accentColor, bodyHtml) {
    const overlay = document.getElementById('npc-modal-overlay');
    const box = document.getElementById('npc-modal-box');
    if (!overlay || !box) return;
    box.style.borderColor = accentColor || '#facc15';
    box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:10px;margin-bottom:12px;">
            <div>
                <span style="font-size:18px;font-weight:bold;color:${accentColor};">${title}</span>
                <span style="font-size:12px;color:#94a3b8;margin-left:8px;">${subtitle}</span>
            </div>
            <button onclick="closeNpcModalShell()" style="background:#334155;color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;">✕ 關閉 (ESC)</button>
        </div>
        <div id="npc-modal-body">${bodyHtml}</div>
    `;
    overlay.style.display = 'flex';
}

function closeNpcModalShell() {
    const overlay = document.getElementById('npc-modal-overlay');
    if (overlay) overlay.style.display = 'none';
    if (typeof updateTownHeaderInfo === 'function') updateTownHeaderInfo();
}

function getTodayDateStr() {
    return new Date().toISOString().slice(0, 10);
}

function ensurePioDailyState() {
    if (!saveData.pioGamble) saveData.pioGamble = { date: '', count: 0 };
    const today = getTodayDateStr();
    if (saveData.pioGamble.date !== today) {
        saveData.pioGamble.date = today;
        saveData.pioGamble.count = 0;
    }
}

// 靠近皮奧按 F 觸發此入口函式
function openNpcPio() {
    ensurePioDailyState();
    const used = saveData.pioGamble.count;
    const max = TOWN_ECONOMY_CONFIG.gambleDailyMax;
    const unidList = (saveData.inventory || []).filter(it => it && it.unidentified);

    const html = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div style="background:#1e293b;padding:12px;border-radius:8px;border:1px solid #334155;">
                <div style="font-weight:bold;color:#e2e8f0;margin-bottom:6px;">🔍 未知裝備鑑定（單價：${TOWN_ECONOMY_CONFIG.identifyCostBase} Seed）</div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">鑑定後的關卡裝備保有「可交易」資格</div>
                <div style="max-height:220px;overflow-y:auto;">
                    ${unidList.length === 0 ? '<div style="color:#64748b;font-size:13px;">背包內目前無未鑑定裝備</div>' :
                    unidList.map(it => `
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px;background:#0f172a;border-radius:6px;margin-bottom:6px;">
                            <span style="font-size:13px;color:#c084fc;">❓ ${it.name || '神秘裝備'} (LV.${it.lv || 1})</span>
                            <button onclick="pioIdentifyItem('${it.uid}')" style="padding:3px 8px;background:#7e22ce;color:#fff;border:none;border-radius:4px;cursor:pointer;">鑑定</button>
                        </div>`).join('')}
                </div>
            </div>
            <div style="background:#1e293b;padding:12px;border-radius:8px;border:1px solid #334155;">
                <div style="font-weight:bold;color:#e2e8f0;margin-bottom:4px;">🎲 神秘部位賭博（今日剩餘：${Math.max(0, max - used)} / ${max} 次）</div>
                <div style="font-size:12px;color:#fca5a5;margin-bottom:10px;">⚠️ 賭博獲得之裝備強制標記【🔒 不可交易】</div>
                <button onclick="pioGambleSlot('weapon')" style="width:100%;padding:8px;margin-bottom:8px;background:#312e81;color:#fff;border:1px solid #6366f1;border-radius:6px;cursor:pointer;">⚔️ 抽取角色專屬武器 (${TOWN_ECONOMY_CONFIG.gambleWeaponCost} Seed)</button>
                <button onclick="pioGambleSlot('armor')" style="width:100%;padding:8px;margin-bottom:8px;background:#1e3a8a;color:#fff;border:1px solid #3b82f6;border-radius:6px;cursor:pointer;">🛡️ 抽取隨機防具 (${TOWN_ECONOMY_CONFIG.gambleArmorCost} Seed)</button>
                <button onclick="pioGambleSlot('acc')" style="width:100%;padding:8px;background:#064e3b;color:#fff;border:1px solid #10b981;border-radius:6px;cursor:pointer;">💍 抽取副手與飾品 (${TOWN_ECONOMY_CONFIG.gambleAccCost} Seed)</button>
            </div>
        </div>
    `;
    openNpcModalShell('🔮 皮奧', '神秘鑑定與部位賭博', '#c084fc', html);
}

function pioIdentifyItem(uid) {
    const cost = TOWN_ECONOMY_CONFIG.identifyCostBase;
    if ((saveData.gold || 0) < cost) return alert('Seed 不足！');
    const item = (saveData.inventory || []).find(i => i.uid === uid);
    if (!item) return;
    saveData.gold -= cost;
    item.unidentified = false;
    if (typeof saveGame === 'function') saveGame();
    openNpcPio();
}

function pioGambleSlot(category) {
    ensurePioDailyState();
    if (saveData.pioGamble.count >= TOWN_ECONOMY_CONFIG.gambleDailyMax) return alert('今日皮奧賭博次數已達上限！');
    const cost = category === 'weapon' ? TOWN_ECONOMY_CONFIG.gambleWeaponCost :
                 category === 'armor' ? TOWN_ECONOMY_CONFIG.gambleArmorCost : TOWN_ECONOMY_CONFIG.gambleAccCost;
    if ((saveData.gold || 0) < cost) return alert('Seed 不足！');

    saveData.gold -= cost;
    saveData.pioGamble.count += 1;
    // 產出未鑑定裝備並強制標記 tradable: false（不可交易）
    const newItem = (typeof rollEquipDrop === 'function')
        ? rollEquipDrop(saveData.lv || 1, { category })
        : { uid: 'g_' + Date.now(), name: '神秘賭博裝備', lv: saveData.lv || 1, slot: category };
    if (newItem) {
        newItem.unidentified = true;
        newItem.tradable = false; // 嚴格鎖定不可交易
        saveData.inventory = saveData.inventory || [];
        saveData.inventory.push(newItem);
    }
    if (typeof saveGame === 'function') saveGame();
    openNpcPio();
}

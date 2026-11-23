// ============================================================================
// 《TW倖存者》NPC 獨立模組：挈德羅（雷蒂亞武器店：強化/洗煉/鑲嵌/合成/裝備回收）(town/NPC/npc_qiedeluo.js)
// ============================================================================

let QIEDELUO_TAB = 'enhance'; // enhance | reroll | socket | craft | sell
let QIEDELUO_SELL_FILTER = {
    unfitClass: true,   // 不可穿戴（職業／武器不符）
    unidentified: false,// 未鑑定裝備
    white: true,        // 普通（白裝）
    green: true,        // 優良（綠裝）
    blue: false         // 稀有（藍裝）
};

function openNpcQiedeluo(tab) {
    if (typeof tab === 'string') QIEDELUO_TAB = tab;
    const allBag = saveData.bag || [];
    const idBag = allBag.filter(it => it && it.identified !== false);
    const tabs = [
        { id: 'enhance', label: '🔨 白字強化 (上限3次)' },
        { id: 'reroll',  label: '✨ 四色副詞條洗煉' },
        { id: 'socket',  label: '💎 技能刻印 / 魔晶石' },
        { id: 'craft',   label: '🔥 LV.105+ 高階合成' },
        { id: 'sell',    label: '💰 裝備回收販賣' }
    ];

    let contentHtml = '';
    if (QIEDELUO_TAB === 'craft') {
        const craftList = (typeof getCraftableEquipTemplates === 'function') ? getCraftableEquipTemplates() : [];
        contentHtml = `<div style="font-size:13px;color:#cbd5e1;margin-bottom:8px;">LV.105 以上神兵與翅膀專屬鍛造工坊（可鍛造圖紙數：${craftList.length}）</div>
            <div style="color:#94a3b8;font-size:12px;">※ 收集對應高階結晶與怪物素材即可在此鍛造高階裝備（素材表將於消費品模組實裝後連動）。</div>`;
    } else if (QIEDELUO_TAB === 'sell') {
        const slotNames = typeof SLOT_NAMES !== 'undefined' ? SLOT_NAMES : { weapon: '武器', sub: '手飾', head: '頭盔', armor: '衣服', gloves: '手部', shoes: '腳部', back: '翅膀', relic: '面具' };
        const matchedItems = getQiedeluoFilteredSellItems();
        const totalBulkSeed = matchedItems.reduce((sum, it) => sum + (typeof getEquipSellPrice === 'function' ? getEquipSellPrice(it) : 15), 0);

        const chkBox = (key, label, col) => `
            <label style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:#0f172a;border:1px solid #334155;border-radius:5px;cursor:pointer;font-size:12px;color:${col};">
                <input type="checkbox" ${QIEDELUO_SELL_FILTER[key] ? 'checked' : ''} onchange="toggleQiedeluoSellFilter('${key}', this.checked)"> ${label}
            </label>`;

        contentHtml = `
            <div style="background:#0f172a;padding:8px 10px;border-radius:6px;border:1px solid #334155;margin-bottom:8px;">
                <div style="font-size:12px;color:#cbd5e1;margin-bottom:6px;font-weight:bold;">🧹 批量清倉過濾器（自動排除史詩紫裝與傳說金裝）：</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        ${chkBox('unfitClass', '不可穿戴(別職)', '#94a3b8')}
                        ${chkBox('unidentified', '未鑑定裝備', '#c084fc')}
                        ${chkBox('white', '普通(白)', '#f8fafc')}
                        ${chkBox('green', '優良(綠)', '#4ade80')}
                        ${chkBox('blue', '稀有(藍)', '#38bdf8')}
                    </div>
                    <button onclick="qiedeluoBulkSell()" ${matchedItems.length === 0 ? 'disabled' : ''} style="padding:5px 12px;background:${matchedItems.length > 0 ? '#eab308' : '#334155'};color:${matchedItems.length > 0 ? '#0f172a' : '#64748b'};font-weight:bold;border:none;border-radius:5px;cursor:${matchedItems.length > 0 ? 'pointer' : 'not-allowed'};font-size:12px;">
                        ⚡ 一鍵出售 (${matchedItems.length} 件 / +${totalBulkSeed.toLocaleString()} Seed)
                    </button>
                </div>
            </div>
            <div style="max-height:220px;overflow-y:auto;">
                ${allBag.length === 0 ? '<div style="color:#64748b;font-size:13px;">背包目前為空</div>' : allBag.map(it => {
                    const rCol = (typeof RARITIES !== 'undefined' && RARITIES[it.rarity]) ? RARITIES[it.rarity].color : '#f8fafc';
                    const sLabel = slotNames[it.slot] || '神秘';
                    const price = typeof getEquipSellPrice === 'function' ? getEquipSellPrice(it) : 15;
                    const title = it.identified === false
                        ? `❓ [未鑑定] 神秘${sLabel}`
                        : `${it.name || '未知裝備'} (LV.${it.reqLv || 1})${it.tradable === false ? ' 🔒' : ''}`;
                    return `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:#0f172a;border-left:3px solid ${rCol};border-radius:6px;margin-bottom:5px;">
                        <span style="font-size:12px;color:${rCol};">${title}</span>
                        <button onclick="qiedeluoSellSingle(${it.uid})" style="padding:3px 10px;background:#78350f;color:#fde047;border:1px solid #b45309;border-radius:5px;font-size:12px;cursor:pointer;">出售 (+${price} Seed)</button>
                    </div>`;
                }).join('')}
            </div>`;
    } else {
        const cost = QIEDELUO_TAB === 'reroll' ? (TOWN_ECONOMY_CONFIG?.rerollBaseCost || 100) : (TOWN_ECONOMY_CONFIG?.enhanceBaseCost || 100);
        contentHtml = `<div style="font-size:12px;color:#facc15;margin-bottom:8px;">當前工藝基礎費用：${cost} Seed（已鑑定裝備清單）</div>
            <div style="max-height:240px;overflow-y:auto;">
                ${idBag.length === 0 ? '<div style="color:#64748b;font-size:13px;">背包內無已鑑定裝備</div>' : idBag.map(it => {
                    const rCol = (typeof RARITIES !== 'undefined' && RARITIES[it.rarity]) ? RARITIES[it.rarity].color : '#f8fafc';
                    return `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:#0f172a;border-left:3px solid ${rCol};border-radius:6px;margin-bottom:6px;">
                        <span style="font-size:13px;color:${rCol};">${it.name} (LV.${it.reqLv || 1}) [強化+${it.enhanceCount || 0}/3]</span>
                        <button onclick="qiedeluoProcessItem(${it.uid})" style="padding:4px 10px;background:#c2410c;color:#fff;border:none;border-radius:5px;cursor:pointer;">執行工藝</button>
                    </div>`;
                }).join('')}
            </div>`;
    }

    const html = `
        <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">
            ${tabs.map(t => `<button onclick="openNpcQiedeluo('${t.id}')" style="padding:6px 10px;border-radius:6px;cursor:pointer;border:1px solid #fb923c;background:${QIEDELUO_TAB === t.id ? '#9a3412' : '#1e293b'};color:#fff;font-size:12px;">${t.label}</button>`).join('')}
        </div>
        <div style="background:#1e293b;padding:12px;border-radius:8px;">${contentHtml}</div>
    `;
    openNpcModalShell('⚒️ 挈德羅', '雷蒂亞武器店', '#fb923c', html);
    const box = document.getElementById('npc-modal-box');
    if (box) box.style.maxWidth = '820px';
}

function toggleQiedeluoSellFilter(key, checked) {
    QIEDELUO_SELL_FILTER[key] = !!checked;
    openNpcQiedeluo('sell');
}

function getQiedeluoFilteredSellItems() {
    const bag = saveData.bag || [];
    return bag.filter(it => {
        if (!it) return false;
        // 永遠保護史詩(purple)與傳說(gold)（含未鑑定紫/金裝）不被批量誤賣
        if (it.rarity === 'purple' || it.rarity === 'gold') return false;

        if (it.identified === false && QIEDELUO_SELL_FILTER.unidentified) return true;
        if (it.identified !== false && QIEDELUO_SELL_FILTER.unfitClass && typeof canEquipItem === 'function') {
            const chk = canEquipItem(it);
            if (!chk.ok && chk.reason && !chk.reason.includes('需要角色等級')) return true;
        }
        if (it.rarity === 'white' && QIEDELUO_SELL_FILTER.white) return true;
        if (it.rarity === 'green' && QIEDELUO_SELL_FILTER.green) return true;
        if (it.rarity === 'blue' && QIEDELUO_SELL_FILTER.blue) return true;
        return false;
    });
}

function qiedeluoSellSingle(uid) {
    const idx = (saveData.bag || []).findIndex(i => i && i.uid === uid);
    if (idx === -1) return;
    const it = saveData.bag[idx];
    if (it.rarity === 'gold' && it.identified !== false) {
        if (!confirm(`確定要出售金色傳說裝備【${it.name}】嗎？`)) return;
    }
    const gain = typeof getEquipSellPrice === 'function' ? getEquipSellPrice(it) : 15;
    saveData.bag.splice(idx, 1);
    saveData.seed = (saveData.seed || 0) + gain;
    if (typeof writeSave === 'function') writeSave();
    if (typeof updateTownHeaderInfo === 'function') updateTownHeaderInfo();
    openNpcQiedeluo('sell');
}

function qiedeluoBulkSell() {
    const targets = getQiedeluoFilteredSellItems();
    if (targets.length === 0) return;
    const totalGain = targets.reduce((sum, it) => sum + (typeof getEquipSellPrice === 'function' ? getEquipSellPrice(it) : 15), 0);
    const targetUids = new Set(targets.map(it => it.uid));
    saveData.bag = (saveData.bag || []).filter(it => !it || !targetUids.has(it.uid));
    saveData.seed = (saveData.seed || 0) + totalGain;
    if (typeof writeSave === 'function') writeSave();
    if (typeof updateTownHeaderInfo === 'function') updateTownHeaderInfo();
    openNpcQiedeluo('sell');
}

function qiedeluoProcessItem(uid) {
    const item = (saveData.bag || []).find(i => i && i.uid === uid);
    if (!item) return;
    const cost = QIEDELUO_TAB === 'reroll' ? (TOWN_ECONOMY_CONFIG?.rerollBaseCost || 100) : (TOWN_ECONOMY_CONFIG?.enhanceBaseCost || 100);
    if ((saveData.seed || 0) < cost) return alert('Seed 不足！');

    if (QIEDELUO_TAB === 'enhance') {
        if ((item.enhanceCount || 0) >= 3) return alert('此裝備白字強化已達上限（3次）！');
        saveData.seed -= cost;
        item.enhanceCount = (item.enhanceCount || 0) + 1;
        if (typeof enhanceEquipWhiteStat === 'function') enhanceEquipWhiteStat(item);
    } else if (QIEDELUO_TAB === 'reroll') {
        saveData.seed -= cost;
        if (typeof rerollEquipAffixes === 'function') rerollEquipAffixes(item);
    } else if (QIEDELUO_TAB === 'socket') {
        alert('請放入對應之「技能刻印石（LV.15+劍類）」或「元素魔晶石（LV.15+法杖）」進行鑲嵌。');
        return;
    }
    if (typeof writeSave === 'function') writeSave();
    openNpcQiedeluo();
    }
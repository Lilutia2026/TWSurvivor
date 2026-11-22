// ============================================================================
// 《TW倖存者》NPC 獨立模組：巴哈里（全能鐵匠鋪：強化/洗煉/鑲嵌/高階合成）(npc/npc_bahari.js)
// ============================================================================

let BAHARI_TAB = 'enhance'; // enhance | reroll | socket | craft

function openNpcBahari(tab) {
    if (typeof tab === 'string') BAHARI_TAB = tab;
    const bag = (saveData.inventory || []).filter(it => it && !it.unidentified);
    const tabs = [
        { id: 'enhance', label: '🔨 白字強化 (上限3次)' },
        { id: 'reroll',  label: '✨ 四色副詞條洗煉' },
        { id: 'socket',  label: '💎 技能刻印 / 魔晶石' },
        { id: 'craft',   label: '🔥 LV.105+ 高階合成' }
    ];

    let contentHtml = '';
    if (BAHARI_TAB === 'craft') {
        const craftList = (typeof getCraftableEquipTemplates === 'function') ? getCraftableEquipTemplates() : [];
        contentHtml = `<div style="font-size:13px;color:#cbd5e1;margin-bottom:8px;">LV.105 以上神兵與翅膀專屬鍛造工坊（可鍛造圖紙數：${craftList.length}）</div>
            <div style="color:#94a3b8;font-size:12px;">※ 收集對應高階結晶與怪物素材即可在此鍛造高階裝備（素材表將於消費品模組實裝後連動）。</div>`;
    } else {
        const cost = BAHARI_TAB === 'reroll' ? TOWN_ECONOMY_CONFIG.rerollBaseCost : TOWN_ECONOMY_CONFIG.enhanceBaseCost;
        contentHtml = `<div style="font-size:12px;color:#facc15;margin-bottom:8px;">當前工藝基礎費用：${cost} Seed（已鑑定裝備清單）</div>
            <div style="max-height:240px;overflow-y:auto;">
                ${bag.length === 0 ? '<div style="color:#64748b;font-size:13px;">背包內無已鑑定裝備</div>' : bag.map(it => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:#0f172a;border-radius:6px;margin-bottom:6px;">
                        <span style="font-size:13px;color:#f8fafc;">${it.name} (LV.${it.lv || 1}) [強化+${it.enhanceCount || 0}/3]</span>
                        <button onclick="bahariProcessItem('${it.uid}')" style="padding:4px 10px;background:#c2410c;color:#fff;border:none;border-radius:5px;cursor:pointer;">執行工藝</button>
                    </div>`).join('')}
            </div>`;
    }

    const html = `
        <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">
            ${tabs.map(t => `<button onclick="openNpcBahari('${t.id}')" style="padding:6px 10px;border-radius:6px;cursor:pointer;border:1px solid #fb923c;background:${BAHARI_TAB === t.id ? '#9a3412' : '#1e293b'};color:#fff;font-size:12px;">${t.label}</button>`).join('')}
        </div>
        <div style="background:#1e293b;padding:12px;border-radius:8px;">${contentHtml}</div>
    `;
    openNpcModalShell('⚒️ 巴哈里', '全能鐵匠鋪', '#fb923c', html);
}

function bahariProcessItem(uid) {
    const item = (saveData.inventory || []).find(i => i.uid === uid);
    if (!item) return;
    const cost = BAHARI_TAB === 'reroll' ? TOWN_ECONOMY_CONFIG.rerollBaseCost : TOWN_ECONOMY_CONFIG.enhanceBaseCost;
    if ((saveData.gold || 0) < cost) return alert('Seed 不足！');

    if (BAHARI_TAB === 'enhance') {
        if ((item.enhanceCount || 0) >= 3) return alert('此裝備白字強化已達上限（3次）！');
        saveData.gold -= cost;
        item.enhanceCount = (item.enhanceCount || 0) + 1;
        if (typeof enhanceEquipWhiteStat === 'function') enhanceEquipWhiteStat(item);
    } else if (BAHARI_TAB === 'reroll') {
        saveData.gold -= cost;
        if (typeof rerollEquipAffixes === 'function') rerollEquipAffixes(item);
    } else if (BAHARI_TAB === 'socket') {
        alert('請放入對應之「技能刻印石（LV.15+劍類）」或「元素魔晶石（LV.15+法杖）」進行鑲嵌。');
        return;
    }
    if (typeof saveGame === 'function') saveGame();
    openNpcBahari();
}

// ============================================================================
// 《TW倖存者》NPC 獨立模組：愛祖文（裝備鑑定 & 每日限量部位賭博）(town/NPC/npc_aizuwen.js)
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

function ensureAizuwenDailyState() {
    if (!saveData.aizuwenGamble) {
        saveData.aizuwenGamble = saveData.pioGamble || { date: '', count: 0 };
    }
    const today = getTodayDateStr();
    if (saveData.aizuwenGamble.date !== today) {
        saveData.aizuwenGamble.date = today;
        saveData.aizuwenGamble.count = 0;
    }
}

// 救援函式：自動修復先前未展開屬性而顯示為 undefined 的已鑑定裝備
function repairBrokenIdentifiedItems() {
    if (!Array.isArray(saveData.bag) || typeof identifyEquipItem !== 'function') return;
    let repaired = false;
    for (let i = 0; i < saveData.bag.length; i++) {
        const it = saveData.bag[i];
        if (it && it.identified === true && !it.name && it.tplId) {
            const wasTradable = it.tradable;
            const fullItem = identifyEquipItem(it);
            if (wasTradable === false) fullItem.tradable = false;
            saveData.bag[i] = fullItem;
            repaired = true;
        }
    }
    if (repaired && typeof writeSave === 'function') writeSave();
}

// 靠近愛祖文按 F 觸發此入口函式
function openNpcAizuwen() {
    ensureAizuwenDailyState();
    repairBrokenIdentifiedItems();

    const used = saveData.aizuwenGamble.count;
    const max = (typeof TOWN_ECONOMY_CONFIG !== 'undefined' ? TOWN_ECONOMY_CONFIG.gambleDailyMax : 10);
    const idCost = (typeof TOWN_ECONOMY_CONFIG !== 'undefined' ? TOWN_ECONOMY_CONFIG.identifyCostBase : 50);
    const wCost = (typeof TOWN_ECONOMY_CONFIG !== 'undefined' ? TOWN_ECONOMY_CONFIG.gambleWeaponCost : 100);
    const aCost = (typeof TOWN_ECONOMY_CONFIG !== 'undefined' ? TOWN_ECONOMY_CONFIG.gambleArmorCost : 100);
    const accCost = (typeof TOWN_ECONOMY_CONFIG !== 'undefined' ? TOWN_ECONOMY_CONFIG.gambleAccCost : 100);

    const bag = saveData.bag || [];
    const unidList = bag.filter(it => it && it.identified === false);
    const totalCost = unidList.length * idCost;
    const slotNames = typeof SLOT_NAMES !== 'undefined' ? SLOT_NAMES : { weapon: '武器', sub: '手飾', head: '頭盔', armor: '衣服', gloves: '手部', shoes: '腳部', back: '翅膀', relic: '面具' };

    const html = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div style="background:#1e293b;padding:12px;border-radius:8px;border:1px solid #334155;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="font-weight:bold;color:#e2e8f0;">🔍 未知裝備鑑定（單價：${idCost} Seed）</div>
                    ${unidList.length > 0 ? `<button onclick="aizuwenIdentifyAllItems()" style="padding:3px 8px;background:#eab308;color:#0f172a;font-weight:bold;font-size:11px;border:none;border-radius:5px;cursor:pointer;">✨ 全部鑑定 (${totalCost})</button>` : ''}
                </div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">鑑定後的關卡裝備保有「可交易」資格</div>
                <div style="max-height:220px;overflow-y:auto;">
                    ${unidList.length === 0 ? '<div style="color:#64748b;font-size:13px;">背包內目前無未鑑定裝備</div>' :
                    unidList.map(it => {
                        const rCol = (typeof RARITIES !== 'undefined' && RARITIES[it.rarity]) ? RARITIES[it.rarity].color : '#c084fc';
                        const sLabel = slotNames[it.slot] || '神秘';
                        return `
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px;background:#0f172a;border-left:3px solid ${rCol};border-radius:6px;margin-bottom:6px;">
                            <span style="font-size:13px;color:${rCol};">❓ [未鑑定] 神秘${sLabel}</span>
                            <button onclick="aizuwenIdentifyItem(${it.uid})" style="padding:3px 8px;background:#7e22ce;color:#fff;border:none;border-radius:4px;cursor:pointer;">鑑定</button>
                        </div>`;
                    }).join('')}
                </div>
            </div>
            <div style="background:#1e293b;padding:12px;border-radius:8px;border:1px solid #334155;">
                <div style="font-weight:bold;color:#e2e8f0;margin-bottom:4px;">🎲 神秘部位賭博（今日剩餘：${Math.max(0, max - used)} / ${max} 次）</div>
                <div style="font-size:12px;color:#fca5a5;margin-bottom:10px;">⚠️ 賭博獲得之裝備強制標記【🔒 不可交易】</div>
                <button onclick="aizuwenGambleSlot('weapon')" style="width:100%;padding:8px;margin-bottom:8px;background:#312e81;color:#fff;border:1px solid #6366f1;border-radius:6px;cursor:pointer;">⚔️ 抽取角色專屬武器 (${wCost} Seed)</button>
                <button onclick="aizuwenGambleSlot('armor')" style="width:100%;padding:8px;margin-bottom:8px;background:#1e3a8a;color:#fff;border:1px solid #3b82f6;border-radius:6px;cursor:pointer;">🛡️ 抽取隨機防具 (${aCost} Seed)</button>
                <button onclick="aizuwenGambleSlot('acc')" style="width:100%;padding:8px;background:#064e3b;color:#fff;border:1px solid #10b981;border-radius:6px;cursor:pointer;">💍 抽取副手與飾品 (${accCost} Seed)</button>
            </div>
        </div>
    `;
    const selfChance = Math.round(SELF_EQUIPMENT_APPRAISAL_CHANCE * 100);
    openNpcModalShell('🔮 愛祖文', '青木魔法店・神秘鑑定與部位抽獎', '#c084fc',
        `<p style="margin-bottom:8px;font-size:12px;color:#cbd5e1;">一般戰鬥裝備袋鑑定時有 ${selfChance}% 機率抽到目前角色適用的裝備類型。</p>${html}`);
}

function aizuwenIdentifyItem(uid) {
    const cost = (typeof TOWN_ECONOMY_CONFIG !== 'undefined' ? TOWN_ECONOMY_CONFIG.identifyCostBase : 50);
    if ((saveData.seed || 0) < cost) return alert('Seed 不足！');
    const idx = (saveData.bag || []).findIndex(i => i && i.uid === uid && i.identified === false);
    if (idx === -1) return;

    const unidItem = saveData.bag[idx];
    const wasTradable = unidItem.tradable;
    saveData.seed -= cost;

    if (typeof identifyEquipItem === 'function') {
        const identifiedObj = identifyEquipItem(unidItem);
        if (wasTradable === false) identifiedObj.tradable = false;
        saveData.bag[idx] = identifiedObj;
    } else {
        unidItem.identified = true;
    }

    if (typeof writeSave === 'function') writeSave();
    openNpcAizuwen();
}

function aizuwenIdentifyAllItems() {
    const cost = (typeof TOWN_ECONOMY_CONFIG !== 'undefined' ? TOWN_ECONOMY_CONFIG.identifyCostBase : 50);
    const bag = saveData.bag || [];
    const unidIndices = [];
    for (let i = 0; i < bag.length; i++) {
        if (bag[i] && bag[i].identified === false) unidIndices.push(i);
    }
    if (unidIndices.length === 0) return;

    const totalCost = unidIndices.length * cost;
    if ((saveData.seed || 0) < totalCost) return alert(`Seed 不足！全部鑑定需要 ${totalCost.toLocaleString()} Seed。`);

    saveData.seed -= totalCost;
    for (const idx of unidIndices) {
        const unidItem = bag[idx];
        const wasTradable = unidItem.tradable;
        if (typeof identifyEquipItem === 'function') {
            const identifiedObj = identifyEquipItem(unidItem);
            if (wasTradable === false) identifiedObj.tradable = false;
            bag[idx] = identifiedObj;
        } else {
            unidItem.identified = true;
        }
    }

    if (typeof writeSave === 'function') writeSave();
    openNpcAizuwen();
}

function aizuwenGambleSlot(category) {
    ensureAizuwenDailyState();
    const max = (typeof TOWN_ECONOMY_CONFIG !== 'undefined' ? TOWN_ECONOMY_CONFIG.gambleDailyMax : 10);
    if (saveData.aizuwenGamble.count >= max) return alert('今日愛祖文的神秘抽獎次數已達上限！');
    const cost = category === 'weapon' ? (TOWN_ECONOMY_CONFIG?.gambleWeaponCost || 100) :
                 category === 'armor' ? (TOWN_ECONOMY_CONFIG?.gambleArmorCost || 100) : (TOWN_ECONOMY_CONFIG?.gambleAccCost || 100);
    if ((saveData.seed || 0) < cost) return alert('Seed 不足！');

    const slotPool = category === 'weapon' ? ['weapon'] :
                     category === 'armor' ? ['head', 'armor', 'gloves', 'shoes'] : ['sub', 'relic'];
    const pickedSlot = slotPool[Math.floor(Math.random() * slotPool.length)];
    const rRoll = Math.random();
    const rar = rRoll < 0.04 ? 'gold' : (rRoll < 0.16 ? 'purple' : (rRoll < 0.42 ? 'blue' : (rRoll < 0.75 ? 'green' : 'white')));
    const maxLv = Math.max(1, saveData.outLv || 1);

      // 嚴格鎖定角色專屬武器池（確保只會抽出當前角色可裝備的武器種類）
      const cObj = (typeof CHARACTERS !== 'undefined' && saveData?.charId) ? CHARACTERS[saveData.charId] : null;
      const charTags = (cObj && Array.isArray(cObj.equipTags)) ? cObj.equipTags : [];
      let newItem = null;
  
      if (category === 'weapon' && typeof EQUIP_TEMPLATES !== 'undefined' && charTags.length > 0) {
          const fitWeapons = EQUIP_TEMPLATES.filter(t =>
              t.slot === 'weapon' &&
              t.reqLv <= maxLv &&
              !t.isWing && !t.isEvent && (!t.obtain || t.obtain === 'drop') &&
              charTags.includes(t.subType || t.type || t.equipTag)
          );
          if (fitWeapons.length > 0) {
              const tpl = fitWeapons[Math.floor(Math.random() * fitWeapons.length)];
              const uid = typeof generateEquipUid === 'function' ? generateEquipUid() : (Date.now() + Math.floor(Math.random() * 10000));
              newItem = { uid, tplId: tpl.tplId, slot: 'weapon', rarity: rar, identified: false };
          }
      }
      if (!newItem && typeof createUnidentifiedDrop === 'function') {
          newItem = createUnidentifiedDrop(rar, maxLv, [pickedSlot], true, 0);
      }  
    if (!newItem) return alert('抽獎箱暫時沒有符合條件的裝備！');

    saveData.seed -= cost;
    saveData.aizuwenGamble.count += 1;
    newItem.identified = false;
    newItem.tradable = false; // 嚴格鎖定不可交易
    saveData.bag = saveData.bag || [];
    saveData.bag.unshift(newItem); // 新抽出的裝備直接置頂於背包第一格
    if (typeof writeSave === 'function') writeSave();
    openNpcAizuwen();
}

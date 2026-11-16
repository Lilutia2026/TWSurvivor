const SAVE_KEY = 'tw_survivor_save_v2';

const DEFAULT_SAVE = {
  charId: 'lucien',
  charName: '路西安．卡爾茲',
  outLv: 1, outExp: 0, seed: 500, freePts: 0,
  baseStats: { S: 4, H: 3, I: 1, DEF: 2, MR: 1, DEX: 2, AGI: 2 },
  allocated: { S: 0, H: 0, I: 0, DEF: 0, MR: 0, DEX: 0, AGI: 0 },
  equip: {
    weapon: { tplId: 'w_long_1', slot: 'weapon', type: 'longsword', name: '學徒長劍', rarity: 'white', reqLv: 1, reqStats: {}, startSkill: 'enbu', H: 4, S: 4, identified: true, affixes: [] },
    sub: null, head: null, armor: null, gloves: null, shoes: null, back: null, relic: null
  },
  bag: []
};

let saveData = loadSave();
let pendingAlloc = null;
let pendingFreePts = null;
let bagSortMode = 'char';

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SAVE, ...parsed, equip: { ...DEFAULT_SAVE.equip, ...(parsed.equip || {}) }, bag: parsed.bag || [] };
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}

function writeSave() { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); }
function getNextOutExp(lv) { return Math.round(100 * Math.pow(1.12, lv - 1)); }
function getLevelPts(lv) { return lv <= 20 ? 4 : (lv <= 40 ? 5 : 7); }
function getStatCost(curVal) { return curVal < 50 ? 1 : 2; }
function addOutExpAndSeed(expGain, seedGain) {
  saveData.seed += seedGain;
  saveData.outExp += expGain;
  while (saveData.outLv < 62 && saveData.outExp >= getNextOutExp(saveData.outLv)) {
    saveData.outExp -= getNextOutExp(saveData.outLv);
    saveData.outLv++;
    saveData.freePts += getLevelPts(saveData.outLv);
  }
  writeSave();
}
const ID_COST = { white: 10, green: 25, blue: 60, purple: 150, gold: 400 };

function identifySingle(uid) {
  const idx = saveData.bag.findIndex(i => i.uid === uid);
  if (idx === -1 || saveData.bag[idx].identified) return;
  const cost = ID_COST[saveData.bag[idx].rarity] || 10;
  if (saveData.seed < cost) { alert(`Seed 不足！需要 ${cost} Seed 購買放大鏡`); return; }
  saveData.seed -= cost;
  saveData.bag[idx] = identifyEquipItem(saveData.bag[idx]);
  writeSave(); renderLobby();
}

function identifyAllItems() {
  const unids = saveData.bag.filter(i => !i.identified);
  if (unids.length === 0) return;
  let count = 0;
  for (let i = 0; i < saveData.bag.length; i++) {
    if (!saveData.bag[i].identified) {
      const cost = ID_COST[saveData.bag[i].rarity] || 10;
      if (saveData.seed >= cost) {
        saveData.seed -= cost;
        saveData.bag[i] = identifyEquipItem(saveData.bag[i]);
        count++;
      }
    }
  }
  writeSave(); renderLobby();
  if (count === 0) alert('Seed 不足，無法鑑定任何裝備！');
}

function equipFromBag(uid) {
  if (pendingAlloc) { alert('請先按下「✅ 確認配點」或「↩️ 取消微調」後再更換裝備！'); return; }
  const idx = saveData.bag.findIndex(i => i.uid === uid);
  if (idx === -1) return;
  const item = saveData.bag[idx];
  if (!item.identified) { identifySingle(uid); return; }
  const check = canEquipItem(item);
  if (!check.ok) {
    if (typeof showBanner === 'function') showBanner(`❌ 無法穿戴：${check.reason}`);
    alert(`無法穿戴：${check.reason}`);
    return;
  }
  const oldEquip = saveData.equip[item.slot];
  saveData.equip[item.slot] = item;
  saveData.bag.splice(idx, 1);
  if (oldEquip) saveData.bag.push(oldEquip);
  writeSave(); renderLobby();
}
function unequipSlot(slotKey) {
  if (pendingAlloc) { alert('請先按下「✅ 確認配點」或「↩️ 取消微調」後再卸下裝備！'); return; }
  const item = saveData.equip[slotKey];
  if (!item) return;
  saveData.bag.push(item);
  saveData.equip[slotKey] = null;
  writeSave(); renderLobby();
}

function setBagSort(mode) {
  bagSortMode = (bagSortMode === mode) ? 'char' : mode;
  renderLobby();
}

function debugDropLoot() {
  const pool = ['white', 'white', 'green', 'blue', 'purple', 'gold'];
  for (let i = 0; i < 5; i++) {
    const r = pool[Math.floor(Math.random() * pool.length)];
    saveData.bag.push(createUnidentifiedDrop(r, Math.min(62, Math.max(15, saveData.outLv + 10))));
  }
  writeSave(); renderLobby();
}

function hardResetSave() { localStorage.removeItem(SAVE_KEY); location.reload(); }
function getWorkingAlloc() { return pendingAlloc || saveData.allocated; }
function getWorkingFreePts() { return pendingFreePts !== null ? pendingFreePts : saveData.freePts; }
function ensurePendingStats() { if (!pendingAlloc) { pendingAlloc = { ...saveData.allocated }; pendingFreePts = saveData.freePts; } }

function getTotalStats() {
  const total = { S: 0, H: 0, I: 0, DEF: 0, MR: 0, DEX: 0, AGI: 0, hp: 0, spd: 0, critRate: 0, critDmg: 0, dmgReduce: 0 };
  const alloc = getWorkingAlloc();
  for (const k of ['S', 'H', 'I', 'DEF', 'MR', 'DEX', 'AGI']) {
    total[k] = (saveData.baseStats[k] || 0) + (alloc[k] || 0);
  }
  for (const slot of Object.values(saveData.equip)) {
    if (!slot) continue;
    for (const k of Object.keys(total)) { if (slot[k]) total[k] += slot[k]; }
  }
  return total;
}

function getDerivedCombatStats() {
  const st = getTotalStats();
  const sCol = Math.min(99, st.S), hCol = Math.min(99, st.H), mrCol = Math.min(99, st.MR), agiCol = Math.min(99, st.AGI);
  return {
    st, cdReduce: 0.30 * (sCol / (sCol + 60)), areaBonus: 0.25 * (hCol / (hCol + 60)),
    extraProj: st.I >= 60 ? 3 : (st.I >= 35 ? 2 : (st.I >= 15 ? 1 : 0)),
    defReduce: Math.floor(st.DEF / 2), maxHp: 120 + st.DEF * 5 + st.hp,
    regen: Math.floor(st.MR / 5) * 0.2, statusDurMult: 1 + st.MR * 0.015, statusCritMult: 1.5 + 0.5 * (mrCol / 99),
    critRate: 0.05 + Math.min(0.35, st.DEX * 0.0025) + st.critRate / 100,
    critDmg: 1.50 + 0.70 * (agiCol / 99) + st.critDmg / 100,
    moveSpeed: 235 + Math.min(150, st.AGI * 2) + st.spd, pickupRange: 115 + st.DEX * 1.5
  };
}
function getLobbyDmgReducePct(d) {
  const defFactor = Math.max(0.45, 1 - (d.defReduce || 0) * 0.008);
  const eqReduce = (d.st && d.st.dmgReduce) ? Math.min(0.4, d.st.dmgReduce / 100) : 0;
  return Math.min(70, Math.round((1 - defFactor * (1 - eqReduce)) * 100));
}

function addStat(key) {
  ensurePendingStats();
  const nakedCur = saveData.baseStats[key] + pendingAlloc[key], cost = getStatCost(nakedCur);
  if (nakedCur >= 99 || pendingFreePts < cost) return;
  pendingFreePts -= cost; pendingAlloc[key]++; renderLobby();
}

function subStat(key) {
  ensurePendingStats();
  if (pendingAlloc[key] <= 0) return;
  pendingAlloc[key]--;
  pendingFreePts += getStatCost(saveData.baseStats[key] + pendingAlloc[key]);
  renderLobby();
}

function maxOutStat(key) {
  ensurePendingStats();
  while (true) {
    const nakedCur = saveData.baseStats[key] + pendingAlloc[key], cost = getStatCost(nakedCur);
    if (nakedCur >= 99 || pendingFreePts < cost) break;
    pendingFreePts -= cost; pendingAlloc[key]++;
  }
  renderLobby();
}

function confirmStats() {
  if (!pendingAlloc) return;
  saveData.allocated = { ...pendingAlloc }; saveData.freePts = pendingFreePts;
  pendingAlloc = null; pendingFreePts = null;
  writeSave(); renderLobby();
}

function cancelStats() { pendingAlloc = null; pendingFreePts = null; renderLobby(); }

function resetStats() {
  ensurePendingStats();
  let refund = 0;
  for (const k of Object.keys(pendingAlloc)) {
    while (pendingAlloc[k] > 0) { pendingAlloc[k]--; refund += getStatCost(saveData.baseStats[k] + pendingAlloc[k]); }
  }
  pendingFreePts += refund; renderLobby();
}

function debugAddExp() { addOutExpAndSeed(getNextOutExp(saveData.outLv), 500); renderLobby(); }

function debugMaxLv60() {
  while (saveData.outLv < 62) { saveData.outLv++; saveData.freePts += getLevelPts(saveData.outLv); }
  saveData.seed += 80000; writeSave(); renderLobby();
}
function getLobbyTooltipEl() {
  let tip = document.getElementById('lobbyTooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'lobbyTooltip';
    tip.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;background:rgba(15,23,42,0.97);border:1.5px solid #facc15;border-radius:8px;padding:10px 12px;color:#f8fafc;font-size:12px;line-height:1.55;max-width:290px;box-shadow:0 8px 24px rgba(0,0,0,0.75);display:none;';
    document.body.appendChild(tip);
  }
  return tip;
}

function showLobbyStatTooltip(e, key) {
  const tip = getLobbyTooltipEl();
  const st = getTotalStats(), alloc = getWorkingAlloc();
  const nakedVal = (saveData.baseStats[key] || 0) + (alloc[key] || 0);
  const eqVal = (st[key] || 0) - nakedVal;
  const eqStr = eqVal > 0 ? ` ＋ 裝備 <strong style="color:#4ade80;">+${eqVal}</strong>` : '';
  const sourceHtml = `<div style="background:rgba(30,41,59,0.9);border:1px solid #475569;border-radius:5px;padding:4px 8px;margin-bottom:6px;font-size:11px;color:#cbd5e1;">📊 總計 <strong style="color:#fde047;">${st[key]}</strong> ＝ 本體 <strong style="color:#f8fafc;">${nakedVal}</strong>${eqStr}</div>`;
  const meta = {
    S:   { title: '⚔️ STAB（突刺 / 冷卻）', desc: '• 提升細劍系（極光刺）與突刺招式主屬性傷害。<br>• 提供全技能冷卻縮減（基礎最高 -30%）。' },
    H:   { title: '🗡️ HACK（砍劈 / 範圍）', desc: '• 提升彎刀（連犽斬）與長劍（圓月斬）主屬性傷害。<br>• 擴大所有物理招式的攻擊半徑（基礎最高 +25%）。' },
    I:   { title: '🔮 INT（魔法 / 彈幕）', desc: '• 提升所有元素魔法技能的主屬性傷害。<br>• 達 15 / 35 / 60 點時，元素魔法額外彈幕 +1 / +2 / +3 發。' },
    DEF: { title: '🛡️ DEF（防禦 / 生命）', desc: '• 每 1 點提升最大生命值 +5 HP。<br>• 提供物理與碰撞減傷比例（上限 70%）。' },
    MR:  { title: '✨ MR（精神 / 異常）', desc: '• 每 5 點提升每秒自然回血 +0.2。<br>• 延長元素異常持續時間，並放大異常狀態暴擊倍率。' },
    DEX: { title: '🎯 DEX（靈巧 / 暴擊）', desc: '• 每 1 點提升暴擊率 +0.25%（DEX 來源上限 35%）。<br>• 每 1 點擴大經驗寶石與掉落物磁吸拾取半徑 +1.5。' },
    AGI: { title: '👟 AGI（敏捷 / 暴傷）', desc: '• 提升基礎移動速度（上限 +150）。<br>• 大幅提升黃字暴擊傷害倍率（基礎最高 +70%）。' }
  }[key];
  if (!meta) return;
  tip.style.borderColor = '#facc15';
  tip.innerHTML = `<div style="font-weight:bold;color:#fde047;font-size:13px;margin-bottom:4px;">${meta.title}</div>${sourceHtml}<div style="color:#e2e8f0;">${meta.desc}</div>`;
  tip.style.display = 'block';
  moveLobbyTooltip(e);
}

function showLobbyEquipTooltip(e, source, keyOrUid) {
  const tip = getLobbyTooltipEl();
  const it = source === 'equip' ? saveData.equip[keyOrUid] : saveData.bag.find(i => i.uid === Number(keyOrUid));
  if (!it || !it.identified) return;
  const r = RARITIES[it.rarity] || RARITIES.white, enhStr = it.enhanceLv ? ` +${it.enhanceLv}` : '';
  const statMap = { S: 'STAB', H: 'HACK', I: 'INT', DEF: 'DEF', MR: 'MR', DEX: 'DEX', AGI: 'AGI' };
  const baseLines = Object.entries(it.baseRolled || {}).map(([k, v]) => `<span style="color:#93c5fd;">${statMap[k] || k} +${it[k] || v}</span>`).join(' ｜ ');
  const reqStatsStr = Object.entries(it.reqStats || {}).map(([k, v]) => `${statMap[k] || k}≥${v}`).join('、');
  const charTag = (it.allowChars && !it.allowChars.includes('all')) ? ` ｜ 限定：${it.allowChars.join('/')}` : '';
  const reqLine = `<div style="color:#94a3b8;font-size:11px;margin-top:2px;">需求：LV.${it.reqLv || 1}${reqStatsStr ? ' ｜ ' + reqStatsStr : ''}${charTag}</div>`;
  const affixLines = (it.affixes && it.affixes.length > 0) ? `<div style="margin-top:5px;padding-top:4px;border-top:1px solid #334155;color:#4ade80;">${it.affixes.map(a => `• ${a}`).join('<br>')}</div>` : `<div style="margin-top:4px;color:#64748b;font-size:11px;">無額外魔法詞綴</div>`;
  const legLine = it.legendEffect ? `<div style="margin-top:5px;padding-top:4px;border-top:1px dashed #ca8a04;color:#fde047;font-weight:bold;">${it.legendEffect.desc}</div>` : '';
  tip.style.borderColor = r.color;
  tip.innerHTML = `<div style="font-weight:bold;color:${r.color};font-size:13px;">[${r.name}・${SLOT_NAMES[it.slot]}] ${it.name}${enhStr}</div>${reqLine}${baseLines ? `<div style="margin-top:4px;font-weight:bold;">${baseLines}</div>` : ''}${affixLines}${legLine}`;
  tip.style.display = 'block';
  moveLobbyTooltip(e);
}
function moveLobbyTooltip(e) {
  const tip = document.getElementById('lobbyTooltip');
  if (!tip || tip.style.display === 'none') return;
  tip.style.left = `${Math.max(10, Math.min(window.innerWidth - tip.offsetWidth - 14, e.clientX + 14))}px`;
  tip.style.top = `${Math.max(10, Math.min(window.innerHeight - tip.offsetHeight - 14, e.clientY + 14))}px`;
}

function hideLobbyTooltip() {
  const tip = document.getElementById('lobbyTooltip');
  if (tip) tip.style.display = 'none';
}

function toggleCharDetailModal(show) {
  const modal = document.getElementById('charDetailModal');
  if (!modal) return;
  if (!show) { modal.style.display = 'none'; return; }
  const d = getDerivedCombatStats(), st = d.st, charInfo = getCurrentCharData(), alloc = getWorkingAlloc();
  const fullNames = { S: 'STAB', H: 'HACK', I: 'INT', DEF: 'DEF', MR: 'MR', DEX: 'DEX', AGI: 'AGI' };
  const statLines = Object.keys(fullNames).map(k => {
    const naked = (saveData.baseStats[k] || 0) + (alloc[k] || 0), eq = st[k] - naked;
    return `<div>• <strong>${fullNames[k]}</strong>：總計 <strong style="color:#fde047;">${st[k]}</strong>（本體 <strong>${naked}</strong> + 裝備 <strong style="color:#4ade80;">+${eq}</strong>）</div>`;
  }).join('');
  document.getElementById('charDetailContent').innerHTML = `
    <div class="status-sec"><h3 style="color:#38bdf8;margin-bottom:6px;">👤 基本與七大素質明細</h3><div>角色：<strong>${charInfo.name}</strong>（${charInfo.title}）</div><div>局外等級：<strong>LV.${saveData.outLv} / 62</strong> ｜ 剩餘配點：<strong>${getWorkingFreePts()}</strong></div><hr style="border-color:#334155;margin:6px 0;">${statLines}</div>
    <div class="status-sec"><h3 style="color:#4ade80;margin-bottom:6px;">⚔️ 衍生戰鬥數值面板</h3><div>❤️ 最大生命：<strong>${d.maxHp}</strong> ｜ 🛡️ 減傷率：<strong>${getLobbyDmgReducePct(d)}%</strong></div><div>💚 每秒回血：<strong>+${d.regen.toFixed(1)}/秒</strong></div><div>⚡ 冷卻縮減：<strong>-${(d.cdReduce * 100).toFixed(1)}%</strong> ｜ 範圍擴大：<strong>+${(d.areaBonus * 100).toFixed(1)}%</strong></div><div>💥 基礎暴擊率：<strong>${(d.critRate * 100).toFixed(1)}%</strong> ｜ 暴擊傷害：<strong>${Math.round(d.critDmg * 100)}%</strong></div><div>✨ 魔法額外彈幕：<strong>+${d.extraProj} 發</strong> ｜ 🔮 異常倍率：<strong>${d.statusCritMult.toFixed(2)}x</strong></div><div>👟 移動速度：<strong>${Math.round(d.moveSpeed)}</strong> ｜ 拾取範圍：<strong>${Math.round(d.pickupRange)}</strong></div></div>`;
  modal.style.display = 'flex';
}

function renderPaperDoll() {
  const cv = document.getElementById('paperDollCanvas');
  if (!cv) return;
  const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height);
  const cx = cv.width / 2, cy = cv.height / 2 + 12;
  if (saveData.equip.back) {
    c.fillStyle = RARITIES[saveData.equip.back.rarity].color;
    c.beginPath(); c.moveTo(cx, cy - 10); c.lineTo(cx - 38, cy - 34); c.lineTo(cx - 24, cy + 8); c.fill();
    c.beginPath(); c.moveTo(cx, cy - 10); c.lineTo(cx + 38, cy - 34); c.lineTo(cx + 24, cy + 8); c.fill();
  }
  c.fillStyle = saveData.equip.armor ? RARITIES[saveData.equip.armor.rarity].color : '#3b82f6';
  c.fillRect(cx - 12, cy - 16, 24, 30);
  c.fillStyle = '#fde047'; c.beginPath(); c.arc(cx, cy - 24, 11, 0, Math.PI * 2); c.fill();
  if (saveData.equip.head) { c.fillStyle = RARITIES[saveData.equip.head.rarity].color; c.fillRect(cx - 12, cy - 36, 24, 6); }
  if (saveData.equip.weapon) { c.strokeStyle = RARITIES[saveData.equip.weapon.rarity].color; c.lineWidth = 4; c.beginPath(); c.moveTo(cx + 12, cy); c.lineTo(cx + 32, cy - 16); c.stroke(); }
}
function renderLobby() {
  hideLobbyTooltip();
  document.querySelectorAll('#lobbyModal button').forEach(b => {
    if (b.textContent.includes('開始出征')) b.innerHTML = '🔥 出發冒險';
    if (b.textContent.includes('一鍵60等')) b.innerHTML = '⚡ [測試]一鍵62等';
  });
  const d = getDerivedCombatStats(), st = d.st;
  const curFree = getWorkingFreePts(), alloc = getWorkingAlloc();
  const pendingTag = pendingAlloc ? ' <span style="color:#fde047;">(預覽微調中)</span>' : '';
  document.getElementById('lobbyHeader').innerHTML = `${saveData.charName} ｜ 局外等級：LV.${saveData.outLv}/62 ｜ 剩餘配點：<strong>${curFree}</strong>${pendingTag} ｜ 持有 Seed：${saveData.seed}`;

  const fullLabels = { S: 'STAB', H: 'HACK', I: 'INT', DEF: 'DEF', MR: 'MR', DEX: 'DEX', AGI: 'AGI' };
  const rowsHtml = Object.keys(fullLabels).map(k => {
    const nakedVal = (saveData.baseStats[k] || 0) + (alloc[k] || 0);
    const totalVal = st[k], cost = getStatCost(nakedVal);
    const disPlus = (nakedVal >= 99 || curFree < cost) ? 'disabled' : '';
    const disMinus = (alloc[k] || 0) <= 0 ? 'disabled' : '';
    return `<div class="stat-row">
      <span style="cursor:help;border-bottom:1px dashed #64748b;" onmouseenter="showLobbyStatTooltip(event,'${k}')" onmousemove="moveLobbyTooltip(event)" onmouseleave="hideLobbyTooltip()"><strong>${fullLabels[k]}</strong>：<strong>${totalVal}</strong></span>
      <span style="display:flex;align-items:center;gap:3px;">
        <span style="font-size:11px;color:#94a3b8;">(${cost}點)</span>
        <button class="stat-btn" style="background:#64748b;color:#fff;" ${disMinus} onclick="subStat('${k}')">-</button>
        <button class="stat-btn" ${disPlus} onclick="addStat('${k}')">+</button>
        <button class="stat-btn" style="width:auto;padding:0 5px;background:#facc15;font-size:11px;" ${disPlus} onclick="maxOutStat('${k}')">MAX</button>
      </span>
    </div>`;
  }).join('');

  const confirmBarHtml = pendingAlloc
    ? `<div style="display:flex;gap:6px;margin-top:8px;padding-top:8px;border-top:1px dashed #ca8a04;">
        <button class="stat-btn" style="flex:1;padding:6px;background:#22c55e;color:#052e16;font-weight:bold;font-size:12px;" onclick="confirmStats()">✅ 確認配點</button>
        <button class="stat-btn" style="flex:1;padding:6px;background:#475569;color:#f8fafc;font-size:12px;" onclick="cancelStats()">↩️ 取消微調</button>
      </div>` : '';
  document.getElementById('statRows').innerHTML = rowsHtml + confirmBarHtml;

  const slotsHtml = Object.entries(SLOT_NAMES).map(([sk, sName]) => {
    const it = saveData.equip[sk];
    if (!it) return `<div class="eq-slot"><span>[${sName}]</span> <span style="color:#64748b;">未裝備</span></div>`;
    const r = RARITIES[it.rarity] || RARITIES.white, enhTag = it.enhanceLv ? ` +${it.enhanceLv}` : '';
    return `<div class="eq-slot" style="border-left:3px solid ${r.color};display:flex;justify-content:space-between;align-items:center;cursor:help;" onmouseenter="showLobbyEquipTooltip(event,'equip','${sk}')" onmousemove="moveLobbyTooltip(event)" onmouseleave="hideLobbyTooltip()">
      <span style="color:${r.color};font-weight:bold;">[${sName}] ${it.name}${enhTag} <span style="font-size:11px;color:#94a3b8;font-weight:normal;">(LV.${it.reqLv || 1})</span></span>
      <button class="stat-btn" style="width:auto;padding:1px 7px;background:#475569;color:#f8fafc;font-size:11px;" onclick="event.stopPropagation();unequipSlot('${sk}')">卸下</button>
    </div>`;
  }).join('');

  const dmgRedPct = getLobbyDmgReducePct(d);
  const miniBox = 'background:rgba(15,23,42,0.75);border:1px solid #334155;border-radius:4px;padding:3px 6px;display:flex;justify-content:space-between;align-items:center;white-space:nowrap;';
  document.getElementById('lobbyPreview').innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
      <canvas id="paperDollCanvas" width="76" height="92" style="background:#0f172a;border:1px solid #475569;border-radius:8px;flex-shrink:0;"></canvas>
      <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;">
        <div style="${miniBox}"><span style="color:#94a3b8;">❤️ 生命</span><strong>${d.maxHp}</strong></div>
        <div style="${miniBox}"><span style="color:#94a3b8;">🛡️ 減傷</span><strong style="color:#4ade80;">${dmgRedPct}%</strong></div>
        <div style="${miniBox}"><span style="color:#94a3b8;">⚡ 冷卻</span><strong style="color:#38bdf8;">-${(d.cdReduce * 100).toFixed(1)}%</strong></div>
        <div style="${miniBox}"><span style="color:#94a3b8;">🌐 範圍</span><strong>+${(d.areaBonus * 100).toFixed(1)}%</strong></div>
        <div style="${miniBox}"><span style="color:#94a3b8;">💥 暴率</span><strong>${(d.critRate * 100).toFixed(1)}%</strong></div>
        <div style="${miniBox}"><span style="color:#94a3b8;">🔥 暴傷</span><strong>${Math.round(d.critDmg * 100)}%</strong></div>
        <div style="${miniBox}"><span style="color:#94a3b8;">✨ 彈幕</span><strong>+${d.extraProj}</strong></div>
        <div style="${miniBox}"><span style="color:#94a3b8;">🔮 異常</span><strong style="color:#4ade80;">${d.statusCritMult.toFixed(2)}x</strong></div>
      </div>
    </div>
    <div>${slotsHtml}</div>`;
  renderPaperDoll();

  const bagEl = document.getElementById('bagList');
  if (bagEl) {
    const sortBtns = [
      { id: 'rarity', label: '⭐ 品級' }, { id: 'lv', label: '📊 等級' }, { id: 'slot', label: '📦 部位' }
    ].map(b => `<button class="stat-btn" style="flex:1;padding:4px 6px;font-size:11px;white-space:nowrap;background:${bagSortMode === b.id ? '#eab308' : '#334155'};color:${bagSortMode === b.id ? '#0f172a' : '#e2e8f0'};font-weight:${bagSortMode === b.id ? 'bold' : 'normal'};" onclick="setBagSort('${b.id}')">${b.label}</button>`).join('');
    const sortBarHtml = `<div style="display:flex;gap:5px;margin-bottom:6px;">${sortBtns}</div>`;

    const rarOrder = { gold: 5, purple: 4, blue: 3, green: 2, white: 1 };
    const slotOrder = { weapon: 1, sub: 2, head: 3, armor: 4, gloves: 5, shoes: 6, back: 7, relic: 8 };
    const isCharFit = (it) => !it.allowChars || it.allowChars.includes('all') || it.allowChars.includes(saveData.charId);

    const sortedBag = [...saveData.bag].sort((a, b) => {
      if (!a.identified !== !b.identified) return a.identified ? 1 : -1;
      if (bagSortMode === 'rarity') return ((rarOrder[b.rarity] || 0) - (rarOrder[a.rarity] || 0)) || ((b.reqLv || 1) - (a.reqLv || 1));
      if (bagSortMode === 'lv') return ((b.reqLv || 1) - (a.reqLv || 1)) || ((rarOrder[b.rarity] || 0) - (rarOrder[a.rarity] || 0));
      if (bagSortMode === 'slot') return ((slotOrder[a.slot] || 9) - (slotOrder[b.slot] || 9)) || ((rarOrder[b.rarity] || 0) - (rarOrder[a.rarity] || 0));
      const fitA = isCharFit(a) ? 1 : 0, fitB = isCharFit(b) ? 1 : 0;
      if (fitA !== fitB) return fitB - fitA;
      return (rarOrder[b.rarity] || 0) - (rarOrder[a.rarity] || 0);
    });

    const itemsHtml = sortedBag.length === 0
      ? '<div style="color:#64748b;font-size:13px;">背包空空如也（可按上方測試掉落裝備）</div>'
      : sortedBag.map(it => {
          const r = RARITIES[it.rarity] || RARITIES.white;
          if (!it.identified) {
            const cost = ID_COST[it.rarity] || 10;
            return `<div class="bag-item" style="border-left:3px solid ${r.color};"><span style="color:${r.color};">❓ [未鑑定] ${r.name}${SLOT_NAMES[it.slot]}袋</span><button class="stat-btn" style="width:auto;padding:2px 8px;" onclick="identifySingle(${it.uid})">🔍 鑑定 (${cost} Seed)</button></div>`;
          }
          const enhTag = it.enhanceLv ? ` +${it.enhanceLv}` : '', fit = isCharFit(it);
          const opacityStyle = fit ? '' : 'opacity:0.55;', unfitTag = fit ? '' : '<span style="font-size:10px;color:#f87171;margin-left:4px;">[他職]</span>';
          return `<div class="bag-item" style="border-left:3px solid ${r.color};cursor:help;${opacityStyle}" onmouseenter="showLobbyEquipTooltip(event,'bag','${it.uid}')" onmousemove="moveLobbyTooltip(event)" onmouseleave="hideLobbyTooltip()"><div><strong style="color:${r.color};">${it.name}${enhTag}</strong> <span style="font-size:11px;color:#94a3b8;">(LV.${it.reqLv || 1})</span>${unfitTag}</div><button class="stat-btn" style="width:auto;padding:2px 10px;background:${fit ? '#22c55e' : '#475569'};color:${fit ? '#052e16' : '#cbd5e1'};" onclick="event.stopPropagation();equipFromBag(${it.uid})">穿戴</button></div>`;
        }).join('');
    bagEl.innerHTML = sortBarHtml + itemsHtml;
  }
}

function startBattle() {
  if (pendingAlloc) { alert('請先按下「✅ 確認配點」或「↩️ 取消微調」後再出發冒險！'); return; }
  const d = getDerivedCombatStats(), w = saveData.equip.weapon || { name: '徒手', startSkill: 'renga' };
  if (typeof EQUIPPED_WEAPON !== 'undefined') { EQUIPPED_WEAPON.name = w.name; EQUIPPED_WEAPON.startSkill = w.startSkill; }
  if (typeof player !== 'undefined') {
    player.maxHp = d.maxHp; player.hp = player.maxHp; player.regen = d.regen;
    player.baseSpeed = d.moveSpeed; player.pickupRange = d.pickupRange;
    player.cdMult = 1 - d.cdReduce; player.areaMult = 1 + d.areaBonus;
  }
  if (typeof ownedSkills !== 'undefined') {
    for (const k of Object.keys(ownedSkills)) delete ownedSkills[k];
    const startLv = (w.legendEffect && w.legendEffect.id === 'startLv2') ? 2 : 1;
    ownedSkills[w.startSkill] = { lv: startLv, evolved: false };
  }
  document.getElementById('lobbyModal').style.display = 'none';
  if (typeof isPaused !== 'undefined') isPaused = false;
}

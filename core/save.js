const LEGACY_SAVE_KEY = 'tw_survivor_save_v2_4';
const SAVE_KEY = 'tw_survivor_trial_profiles';
const MAX_OUT_LV = 255;
const DEV_ONLY = true;
const DEV_PLAY_COUNTS_KEY = 'tw_survivor_dev_play_counts';
let countedDevSession = false;
let devPlayCounts = { sessions: 0, runs: 0, clears: 0 };

function getDevPlayCounts() {
  if (!DEV_ONLY) return null;
  try {
    const stored = JSON.parse(localStorage.getItem(DEV_PLAY_COUNTS_KEY));
    for (const key of Object.keys(devPlayCounts)) {
      if (Number.isSafeInteger(stored?.[key]) && stored[key] > devPlayCounts[key]) devPlayCounts[key] = stored[key];
    }
  } catch (e) { /* 統計仍可在本次遊戲中使用 */ }
  return devPlayCounts;
}

function recordDevPlayCount(key) {
  if (!DEV_ONLY) return;
  if (key === 'sessions') {
    if (countedDevSession) return;
    countedDevSession = true;
  }
  const counts = getDevPlayCounts();
  counts[key]++;
  try { localStorage.setItem(DEV_PLAY_COUNTS_KEY, JSON.stringify(counts)); }
  catch (e) { /* 統計不影響遊戲存檔 */ }
}

const DEFAULT_SAVE = {
  charId: 'lucien',
  variantId: 'longsword',
  charName: '路西安．卡爾茲',
  jobTier: 1,
  outLv: 1, outExp: 0, seed: 500, freePts: 0,
  baseStats: { S: 4, H: 3, I: 1, DEF: 2, MR: 1, DEX: 2, AGI: 1 },
  autoStats: { S: 0, H: 0, I: 0, DEF: 0, MR: 0, DEX: 0, AGI: 0 },
  allocated: { S: 0, H: 0, I: 0, DEF: 0, MR: 0, DEX: 0, AGI: 0 },
  equip: {
    weapon: null,
    sub: null, head: null, armor: null, gloves: null, shoes: null, back: null, relic: null, cape: null
  },
  bag: []
};

// 目前角色維持原有欄位供各模組讀取，其餘試玩角色獨立保存在 trialCharacters。
const TRIAL_CHARACTER_FIELDS = ['charId', 'variantId', 'charName', 'jobTier', 'outLv', 'outExp', 'freePts',
  'baseStats', 'autoStats', 'allocated', 'equip', 'bag', 'wingQuestDone', 'trialStarterKitGranted'];
let saveLoadError = false;
let saveData = loadSave();
let pendingAlloc = null;
let pendingFreePts = null;

function loadSave() {
  const defaults = JSON.parse(JSON.stringify(DEFAULT_SAVE));
  let save = defaults;
  let migrated = false;
  try {
    const current = localStorage.getItem(SAVE_KEY);
    const legacy = current === null ? localStorage.getItem(LEGACY_SAVE_KEY) : null;
    if (current !== null || legacy !== null) {
      const parsed = JSON.parse(current ?? legacy);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('存檔格式錯誤');
      const character = CHARACTERS[parsed.charId || parsed.selectedChar] || CHARACTERS.lucien;
      const variantId = character.variants[parsed.variantId] ? parsed.variantId : character.defaultVariant;
      save = {
        ...defaults, ...parsed,
        charId: character.id, charName: parsed.charName || character.name, variantId,
        baseStats: { ...character.variants[variantId].baseStats, ...(parsed.baseStats || {}) },
        autoStats: { ...defaults.autoStats, ...(parsed.autoStats || {}) },
        allocated: { ...defaults.allocated, ...(parsed.allocated || {}) },
        equip: { ...defaults.equip, ...(parsed.equip || {}) },
        bag: Array.isArray(parsed.bag) ? parsed.bag : []
      };
      if (legacy !== null) {
        save.legacyBag = save.bag;
        save.bag = [];
        migrated = true;
      }
    }
  } catch (e) {
    saveLoadError = true;
    console.warn('無法讀取存檔，已保留原資料', e);
  }
  const pendingRewards = Object.values(save.pendingFirstClearRewards || {});
  const mailItems = Array.isArray(save.mailbox) ? save.mailbox.map(mail => mail?.item) : [];
  const inactiveItems = Object.values(save.trialCharacters || {}).filter(Boolean).flatMap(character => [
    Object.values(character.equip || {}), character.bag
  ]);
  const itemLists = [Object.values(save.equip), save.bag, save.legacyBag, save.accountStash,
    ...Object.values(save.charStash || {}), ...inactiveItems, pendingRewards, mailItems];
  const items = itemLists.filter(Array.isArray).flat().filter(item => item && typeof item === 'object');
  save.nextEquipUid = Number.isSafeInteger(save.nextEquipUid) && save.nextEquipUid > 0 ? save.nextEquipUid : 1;
  for (const item of items) {
    if (Number.isSafeInteger(item.uid)) save.nextEquipUid = Math.max(save.nextEquipUid, item.uid + 1);
  }
  for (const item of items) {
    if (item.uid == null) item.uid = generateEquipUid(save);
  }
  for (const clearKey of Object.keys(save.pendingFirstClearRewards || {})) deliverFirstClearReward(save, clearKey);
  if (migrated || pendingRewards.length) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
    catch (e) { console.warn('無法寫入遷移或首通補發資料，原存檔已保留', e); }
  }
  return save;
}

function deliverFirstClearReward(save, clearKey) {
  const item = save.pendingFirstClearRewards?.[clearKey];
  if (!item) return null;
  if (!save.bag.some(entry => entry?.uid === item.uid)) save.bag.push(markEquipAcquired(item));
  (save.stageFirstClears ||= {})[clearKey] = true;
  delete save.pendingFirstClearRewards[clearKey];
  return item;
}

function writeSave() {
  if (saveLoadError) throw new Error('原存檔無法讀取');
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function claimLegacyBagItem(index, uid) {
  const source = saveData.legacyBag;
  if (!Number.isInteger(index) || index < 0 || !source?.[index] || String(source[index].uid) !== String(uid)) return false;
  const [item] = source.splice(index, 1);
  saveData.bag.push(item);
  try {
    writeSave();
  } catch (e) {
    saveData.bag.pop();
    source.splice(index, 0, item);
    alert('無法保存領取結果，道具仍在舊背包領取區。');
    return false;
  }
  return true;
}
function getNextOutExp(lv) { return Math.round(100 * Math.pow(1.065, Math.min(180, lv - 1))); }
// V2.4 收斂配點：配合自動升級+凹點(約350點)，每級給 1 pt（逢10級額外+1 pt），255滿級總自由點數約 279 pt，專精約可練滿 2 項 255
function getLevelPts(lv) { return (lv % 10 === 0) ? 2 : 1; }
function getStatCost(key) { return typeof getStatPointCost === 'function' ? getStatPointCost(key) : 1; }
// 升級時執行：100% 必升 autoStat +1，並以 40% 機率凹點 bonusStat +1（絕不含第二輸出核心）
function applyAutoLevelGrowth() {
  if (typeof getCurrentArchetypeRule !== 'function') return;
  const rule = getCurrentArchetypeRule();
  if (rule.autoStat && (saveData.baseStats[rule.autoStat] + saveData.autoStats[rule.autoStat] + saveData.allocated[rule.autoStat]) < 255) {
    saveData.autoStats[rule.autoStat] = (saveData.autoStats[rule.autoStat] || 0) + 1;
  }
  if (rule.bonusStat && Math.random() < 0.40 && (saveData.baseStats[rule.bonusStat] + saveData.autoStats[rule.bonusStat] + saveData.allocated[rule.bonusStat]) < 255) {
    saveData.autoStats[rule.bonusStat] = (saveData.autoStats[rule.bonusStat] || 0) + 1;
  }
}

function checkLv15WingQuest() {
  if (saveData.outLv < 15 || saveData.wingQuestDone) return;
  saveData.wingQuestDone = true;
  if (typeof identifyEquipItem === 'function' && typeof EQUIP_TEMPLATES !== 'undefined' && Array.isArray(EQUIP_TEMPLATES)) {
    const wingTpl = EQUIP_TEMPLATES.find(t => t.tplId === 'bk_15') || EQUIP_TEMPLATES.find(t => t.slot === 'back');
    if (wingTpl) {
      const wingItem = identifyEquipItem({ uid: generateEquipUid(), tplId: wingTpl.tplId, slot: 'back', rarity: 'green' });
      if (wingItem) saveData.bag.push(markEquipAcquired(wingItem));
    }
  }
}

function addOutExpAndSeed(expGain, seedGain) {
  saveData.seed += seedGain;
  saveData.outExp += expGain;
  while (saveData.outLv < MAX_OUT_LV && saveData.outExp >= getNextOutExp(saveData.outLv)) {
    saveData.outExp -= getNextOutExp(saveData.outLv);
    saveData.outLv++;
    applyAutoLevelGrowth();
    saveData.freePts += getLevelPts(saveData.outLv);
  }
  checkLv15WingQuest();
  writeSave();
}

function getSavedTrialVariant(charId) {
  return saveData.charId === charId ? saveData.variantId : saveData.trialCharacters?.[charId]?.variantId;
}

function switchCharacterVariant(charId, variantId) {
  const character = CHARACTERS[charId];
  if (!character?.playable) return false;
  const savedVariant = getSavedTrialVariant(charId);
  const preferredVariant = variantId ?? savedVariant;
  const vid = character.variants[preferredVariant] ? preferredVariant : character.defaultVariant;
  if (saveLoadError) { alert('目前無法讀取存檔，原資料已保留。'); return false; }
  if (saveData.charId === charId && saveData.variantId === vid && saveData.trialStarterKitGranted) return true;
  if (pendingAlloc) { alert('請先確認或取消配點，再切換角色或測試型態。'); return false; }

  const previousSave = saveData;
  saveData = JSON.parse(JSON.stringify(saveData));
  try {
    if (saveData.charId !== charId) {
      const profiles = (saveData.trialCharacters ||= {});
      profiles[saveData.charId] = Object.fromEntries(TRIAL_CHARACTER_FIELDS.map(key => [key, saveData[key]]));
      const profile = profiles[charId];
      const defaults = JSON.parse(JSON.stringify(DEFAULT_SAVE));
      for (const key of TRIAL_CHARACTER_FIELDS) saveData[key] = profile?.[key] ?? defaults[key];
      if (profile) delete profiles[charId];
      else {
        saveData.charId = charId;
        saveData.charName = character.name;
        saveData.variantId = vid;
        saveData.baseStats = { ...character.variants[vid].baseStats };
      }
    }
    const changedVariant = saveData.variantId !== vid;
    if (changedVariant) {
      saveData.variantId = vid;
      saveData.baseStats = { ...character.variants[vid].baseStats };
      saveData.autoStats = { ...DEFAULT_SAVE.autoStats };
      saveData.allocated = { ...DEFAULT_SAVE.allocated };
      saveData.freePts = 0;
      for (let lv = 2; lv <= saveData.outLv; lv++) {
        applyAutoLevelGrowth();
        saveData.freePts += getLevelPts(lv);
      }
    }
    const needsStarterKit = !saveData.trialStarterKitGranted;
    if (needsStarterKit) grantTrialStarterKit(character);
    const weapon = saveData.equip.weapon;
    if ((needsStarterKit && !weapon) || (changedVariant && (!weapon || weapon.trialStarter))) {
      const starterId = character.variants[vid].defaultTpl;
      const index = saveData.bag.findIndex(item => item?.trialStarter && item.tplId === starterId);
      if (index >= 0) {
        const [starter] = saveData.bag.splice(index, 1);
        if (weapon) saveData.bag.push(markEquipAcquired(weapon));
        saveData.equip.weapon = starter;
      }
    }
    writeSave();
  } catch (error) {
    saveData = previousSave;
    console.warn('無法保存角色切換', error);
    alert('無法保存角色資料，已保留切換前的角色與道具。');
    return false;
  }
  return true;
}

function grantTrialStarterKit(character) {
  const templateIds = new Set(Object.values(character.variants).map(variant => variant.defaultTpl));
  for (const tplId of templateIds) {
    if (!ITEM_WEAPONS.some(template => template.tplId === tplId)) throw new Error('找不到試玩武器模板 ' + tplId);
    const item = identifyEquipItem({ uid: generateEquipUid(), tplId, rarity: 'white' });
    item.startSkill = getWeaponSignatureSkill(item);
    item.trialStarter = true;
    saveData.bag.push(markEquipAcquired(item));
  }
  saveData.trialStarterKitGranted = true;
}
const ID_COST = { white: 10, green: 25, blue: 60, purple: 150, gold: 400 };

function identifySingle(uid) {
  const idx = saveData.bag.findIndex(i => i.uid === uid);
  if (idx === -1 || saveData.bag[idx].identified) return;
  const cost = ID_COST[saveData.bag[idx].rarity] || 10;
  if (saveData.seed < cost) { alert(`Seed 不足！需要 ${cost} Seed 購買放大鏡`); return; }
  saveData.seed -= cost;
  saveData.bag[idx] = identifyEquipItem(saveData.bag[idx]);
  writeSave();
}

function equipFromBag(uid) {
  if (pendingAlloc) { alert('請先按下「✅ 確認配點」或「↩️ 取消微調」後再更換裝備！'); return; }
  const idx = saveData.bag.findIndex(i => i.uid === uid);
  if (idx === -1) return;
  const item = saveData.bag[idx];
  if (!item.identified) { identifySingle(uid); return; }
  const check = canEquipItem(item);
  if (!check.ok) { alert(`無法穿戴：${check.reason}`); return; }
  const oldEquip = saveData.equip[item.slot];
  saveData.equip[item.slot] = item;
  saveData.bag.splice(idx, 1);
  if (oldEquip) saveData.bag.push(oldEquip);
  writeSave();
}
function unequipSlot(slotKey) {
  if (pendingAlloc) { alert('請先按下「✅ 確認配點」或「↩️ 取消微調」後再卸下裝備！'); return; }
  const item = saveData.equip[slotKey];
  if (!item) return;
  saveData.bag.push(item);
  saveData.equip[slotKey] = null;
  writeSave();
}

function getWorkingAlloc() { return pendingAlloc || saveData.allocated; }
function getWorkingFreePts() { return pendingFreePts !== null ? pendingFreePts : saveData.freePts; }
function ensurePendingStats() { if (!pendingAlloc) { pendingAlloc = { ...saveData.allocated }; pendingFreePts = saveData.freePts; } }

function getNakedStat(key) {
  const alloc = getWorkingAlloc();
  return (saveData.baseStats[key] || 0) + ((saveData.autoStats && saveData.autoStats[key]) || 0) + (alloc[key] || 0);
}

function getTotalStats() {
  const total = { S: 0, H: 0, I: 0, DEF: 0, MR: 0, DEX: 0, AGI: 0, hp: 0, spd: 0, moveSpd: 0, cdr: 0, statusChance: 0, critRate: 0, critDmg: 0, dmgReduce: 0, magReduce: 0, physDmgPct: 0, magDmgPct: 0, extraProj: 0 };
  for (const k of ['S', 'H', 'I', 'DEF', 'MR', 'DEX', 'AGI']) total[k] = getNakedStat(k);
  for (const slot of Object.values(saveData.equip)) {
    if (!slot) continue;
    for (const k of Object.keys(total)) { if (slot[k]) total[k] += slot[k]; }
  }
  return total;
}

function getDerivedCombatStats() {
  const st = getTotalStats();
  const variant = typeof getCurrentCharVariant === 'function' ? getCurrentCharVariant() : { initHp: 200 };
  const sCap = Math.min(255, st.S), hCap = Math.min(255, st.H), iCap = Math.min(255, st.I);
  const mrCap = Math.min(255, st.MR), defCap = Math.min(255, st.DEF), dexCap = Math.min(255, st.DEX), agiCap = Math.min(255, st.AGI);

  const eqPhysRed = Math.min(0.40, (st.dmgReduce || 0) / 100);
  const eqMagRed = Math.min(0.40, (st.magReduce || 0) / 100);
  const physReducePct = Math.min(70, Math.round((1 - (1 - 0.50 * (defCap / 255)) * (1 - eqPhysRed)) * 100));
  const magReducePct = Math.min(70, Math.round((1 - (1 - 0.50 * (mrCap / 255)) * (1 - eqMagRed)) * 100));
  const passiveDoubleHit = (typeof player !== 'undefined' && player.bonusDoubleHit) ? player.bonusDoubleHit : 0;
  const pCrestLv = (typeof ownedPassives !== 'undefined' && ownedPassives.powerCrest) || 0;
  const bBodyLv = (typeof ownedPassives !== 'undefined' && ownedPassives.bronzeBody) || 0;
  const finalPhysRed = Math.max(0, Math.min(70, physReducePct - pCrestLv * 4 + bBodyLv * 3));
  const finalMagRed = Math.max(0, Math.min(70, magReducePct - pCrestLv * 3));

  return {
    st,
    doubleHitChance: Math.min(0.45, sCap * 0.0015 + passiveDoubleHit),
    knockbackMult: 1 + hCap * 0.004,
    statusDurMult: 1 + iCap * 0.003,
    statusChanceBonus: Math.min(0.45, mrCap * 0.0012 + (st.statusChance || 0) / 100),
    maxHp: (variant.initHp || 200) + st.DEF * 3 + st.hp,
    physReducePct: finalPhysRed, magReducePct: finalMagRed,
    defThornsDmg: Math.round(st.DEF * 0.8),
    critRate: 0.05 + dexCap * 0.001 + (st.critRate || 0) / 100,
    expBonusMult: 1 + dexCap * 0.001,
    critDmg: 1.50 + agiCap * 0.006 + (st.critDmg || 0) / 100,
    pickupRange: Math.round(115 * (1 + agiCap * 0.0015)),
    moveSpeed: Math.round((235 + (st.spd || 0)) * (1 + (st.moveSpd || 0) / 100)),
    physDmgMult: 1 + (st.physDmgPct || 0) / 100,
    magDmgMult: 1 + (st.magDmgPct || 0) / 100,
    extraProj: st.extraProj || 0,
    cdReduce: Math.min(0.40, (st.cdr || 0) / 100), areaBonus: 0, regen: 0
  };
}

function addStat(key) {
  ensurePendingStats();
  const nakedCur = getNakedStat(key), cost = getStatCost(key);
  if (nakedCur >= 255 || pendingFreePts < cost) return;
  pendingFreePts -= cost; pendingAlloc[key]++;
}

function subStat(key) {
  ensurePendingStats();
  if (pendingAlloc[key] <= 0) return;
  pendingAlloc[key]--; pendingFreePts += getStatCost(key);
}

function maxOutStat(key) {
  ensurePendingStats();
  while (true) {
    const nakedCur = getNakedStat(key), cost = getStatCost(key);
    if (nakedCur >= 255 || pendingFreePts < cost) break;
    pendingFreePts -= cost; pendingAlloc[key]++;
  }
}

function confirmStats() {
  if (!pendingAlloc) return;
  saveData.allocated = { ...pendingAlloc }; saveData.freePts = pendingFreePts;
  pendingAlloc = null; pendingFreePts = null;
  writeSave();
}

function cancelStats() { pendingAlloc = null; pendingFreePts = null; }
function resetStats() {
  ensurePendingStats();
  let refund = 0;
  for (const k of Object.keys(pendingAlloc)) {
    while (pendingAlloc[k] > 0) { pendingAlloc[k]--; refund += getStatCost(k); }
  }
  pendingFreePts += refund;
}

function getLobbyTooltipEl() {
  let tip = document.getElementById('lobbyTooltip');
  if (!tip) {
    tip = document.createElement('div'); tip.id = 'lobbyTooltip';
    tip.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;background:rgba(15,23,42,0.97);border:1.5px solid #facc15;border-radius:8px;padding:10px 12px;color:#f8fafc;font-size:12px;line-height:1.55;max-width:295px;box-shadow:0 8px 24px rgba(0,0,0,0.75);display:none;';
    document.body.appendChild(tip);
  }
  return tip;
}

function showLobbyStatTooltip(e, key) {
  const tip = getLobbyTooltipEl(), st = getTotalStats(), nakedVal = getNakedStat(key), eqVal = (st[key] || 0) - nakedVal;
  const eqStr = eqVal > 0 ? ` ＋ 裝備 <strong style="color:#4ade80;">+${eqVal}</strong>` : '';
  const sourceHtml = `<div style="background:rgba(30,41,59,0.9);border:1px solid #475569;border-radius:5px;padding:4px 8px;margin-bottom:6px;font-size:11px;color:#cbd5e1;">📊 總計 <strong style="color:#fde047;">${st[key]}</strong> ＝ 本體 <strong style="color:#f8fafc;">${nakedVal}</strong>${eqStr}</div>`;
  const meta = {
    S:   { title: '⚔️ STAB（刺擊 / 連擊）', desc: '• 主能力：刺擊系技能基數（STAB×1.0 + HACK×0.3）與跨系武器物理底力。<br>• 副能力：連擊觸發機率（攻擊時有機率打出兩次傷害）。' },
    H:   { title: '🗡️ HACK（劈砍 / 擊退）', desc: '• 主能力：劈砍系技能基數（HACK×1.0 + STAB×0.3）與跨系武器物理底力。<br>• 副能力：技能擊退力道（強化揮砍震退怪群壓制力）。' },
    I:   { title: '🔮 INT（元素 / 異常時長）', desc: '• 主能力：元素法術基數（INT×1.0 + MR×0.3）與魔劍複合基數。<br>• 副能力：異常狀態持續時間延長（點燃、凍結、感電、聖印留存更久）。' },
    MR:  { title: '✨ MR（白魔 / 異常率＆魔減）', desc: '• 主能力：白魔術技能基數 ＋ 元素法術副係數（MR×0.3）。<br>• 副能力：異常狀態觸發機率提升 ＋ 魔法（投射物）減傷率（上限 70%）。' },
    DEF: { title: '🛡️ DEF（防禦 / 生命＆物減）', desc: '• 主能力：最大 HP（每點 +3）＋ 物理（碰撞）減傷率（上限 70%）。<br>• 副能力：防禦轉傷（護甲按比例轉為近戰附加輸出）。' },
    DEX: { title: '🎯 DEX（技巧 / 暴率＆經驗）', desc: '• 主能力：暴擊率（每 10 點 +1%，255 點滿值 +25.5%）。<br>• 副能力：局內經驗獲取加成（每 10 點 +1%，255 點滿值 +25.5%）。' },
    AGI: { title: '👟 AGI（敏捷 / 暴傷＆拾取）', desc: '• 主能力：暴擊傷害（每 1 點 +0.6%，255 點滿值 +153%）。<br>• 副能力：拾取磁鐵範圍（每 10 點 +1.5%，255 點滿值 +38.25%）。' }
  }[key];
  if (!meta) return;
  tip.style.borderColor = '#facc15';
  tip.innerHTML = `<div style="font-weight:bold;color:#fde047;font-size:13px;margin-bottom:4px;">${meta.title}</div>${sourceHtml}<div style="color:#e2e8f0;">${meta.desc}</div>`;
  tip.style.display = 'block'; moveLobbyTooltip(e);
}
function getSkillDisplayName(skillId) {
  if (!skillId) return '';
  if (typeof COMMON_SKILLS !== 'undefined' && COMMON_SKILLS[skillId]) return COMMON_SKILLS[skillId].name;
  if (typeof CHAR_SKILL_REGISTRY !== 'undefined') {
    for (const ch of Object.values(CHAR_SKILL_REGISTRY)) {
      if (ch.skills && ch.skills[skillId]) return ch.skills[skillId].name;
    }
  }
  return skillId;
}

function showLobbyEquipTooltip(e, source, keyOrUid) {
  const tip = getLobbyTooltipEl();
  const it = source === 'equip' ? saveData.equip[keyOrUid] : saveData.bag.find(i => i && String(i.uid) === String(keyOrUid));
  if (!it || !it.identified) return;
  const r = RARITIES[it.rarity] || RARITIES.white;
  const wTypeMap = { longsword: '長劍', blade: '彎刀', rapier: '細劍', tachi: '太刀', greatsword: '巨劍', spear: '槍', polearm: '棍', dagger: '短劍', dual_blade: '雙斧', axe: '戰斧', whip: '鞭', flail: '鏈錘', wand: '魔杖', staff: '權杖', mace: '釘錘' };
  const tagMap = { heavy: '重鎧', robe: '法袍', ninja: '忍服', shield: '盾牌', knuckle: '指虎', crystal: '魔導手鐲' };
  const inferredType = (it.tplId && it.tplId.startsWith('w_wand_')) ? 'wand' : ((it.tplId && it.tplId.startsWith('w_stf_')) ? 'staff' : ((it.tplId && it.tplId.startsWith('w_mace_')) ? 'mace' : null));
  const realWType = (it.subType && it.subType !== 'weapon') ? it.subType : ((it.type && it.type !== 'weapon') ? it.type : (it.equipTag && it.equipTag !== 'all' ? it.equipTag : inferredType));
  const typeLabel = it.slot === 'weapon' ? (wTypeMap[realWType] || '武器') : (tagMap[it.equipTag] || SLOT_NAMES[it.slot]);
  const statMap = { S: 'STAB', H: 'HACK', I: 'INT', DEF: 'DEF', MR: 'MR', DEX: 'DEX', AGI: 'AGI' };
  const baseLines = Object.entries(it.baseRolled || {}).map(([k, v]) => `<span style="color:#93c5fd;">${statMap[k] || k} +${it[k] || v}</span>`).join(' ｜ ');
  const reqStatsStr = Object.entries(it.reqStats || {}).map(([k, v]) => `${statMap[k] || k}≥${v}`).join('、');
  const maxS = it.maxSynth ?? 3, remS = Math.max(0, maxS - (it.synthCount ?? 0));
  const elemMap = { fire: '🔥 火系元素', ice: '❄️ 冰系元素', thunder: '⚡ 雷系元素' };
  const isWand = realWType === 'wand';
  const dispElem = it.wandElem || (isWand ? 'fire' : null);
  const sigSkillId = (!isWand && it.slot === 'weapon' && typeof getWeaponSignatureSkill === 'function') ? getWeaponSignatureSkill(it) : (!isWand ? it.startSkill : null);
  const sigBadge = it.customStartSkill ? '（已改造）' : '';
  const startSkTag = (!isWand && it.slot === 'weapon' && sigSkillId) ? `<div style="color:#38bdf8;font-size:11px;margin-top:2px;">⚔️ 初始技能：【${getSkillDisplayName(sigSkillId)}】${sigBadge}</div>` : '';
  const elemTag = dispElem ? `<div style="color:#fde047;font-size:11px;margin-top:2px;">🔮 魔杖屬性：${elemMap[dispElem] || dispElem}</div>` : '';
  const reqLine = `<div style="color:#94a3b8;font-size:11px;margin-top:2px;">需求：LV.${it.reqLv || 1}${reqStatsStr ? ' ｜ ' + reqStatsStr : ''} ｜ 🔨 剩餘合成：${remS}/${maxS}</div>`;
  const affixLines = (it.affixes && it.affixes.length > 0)
    ? `<div style="margin-top:5px;padding-top:4px;border-top:1px solid #334155;">${it.affixes.map(a => typeof a === 'object' ? `<span style="color:${a.color || '#4ade80'};">• ${a.label} +${a.val}${a.unit || ''}</span>` : `<span style="color:#4ade80;">• ${a}</span>`).join('<br>')}</div>`
    : `<div style="margin-top:4px;color:#64748b;font-size:11px;">無額外魔法詞綴</div>`;
  const legLine = it.legendEffect ? `<div style="margin-top:5px;padding-top:4px;border-top:1px dashed #ca8a04;color:#fde047;font-weight:bold;">${it.legendEffect.desc}</div>` : '';
  tip.style.borderColor = r.color;
  tip.innerHTML = `<div style="font-weight:bold;color:${r.color};font-size:13px;">[${r.name}・${typeLabel}] ${it.name}</div>${reqLine}${startSkTag}${elemTag}${baseLines ? `<div style="margin-top:4px;font-weight:bold;">${baseLines}</div>` : ''}${affixLines}${legLine}`;
  tip.style.display = 'block'; moveLobbyTooltip(e);
}
function moveLobbyTooltip(e) { const tip = getLobbyTooltipEl(); tip.style.left = Math.min(window.innerWidth - 310, e.clientX + 14) + 'px'; tip.style.top = Math.min(window.innerHeight - 160, e.clientY + 14) + 'px'; }
function hideLobbyTooltip() { const tip = document.getElementById('lobbyTooltip'); if (tip) tip.style.display = 'none'; }

// 片段 C：startBattle() 內讀取武器初始技能並綁定所選關卡與 4 階難度倍率
function startBattle(stageId, diffKey, { sandbox = false, deferScene = false } = {}) {
  if (pendingAlloc) { alert('請先按下「✅ 確認配點」或「↩️ 取消微調」後再出發冒險！'); return false; }
  resetBattleRun();
  const stList = (typeof STAGE_SELECT_LIST !== 'undefined' && Array.isArray(STAGE_SELECT_LIST)) ? STAGE_SELECT_LIST : [];
  const diffMap = (typeof DIFFICULTY_MODIFIERS !== 'undefined') ? DIFFICULTY_MODIFIERS : {};
  const chosenStage = stList.find(s => s.id === (stageId || saveData.currentStageId)) || stList[0] || { id: 'penine_forest', tier: 1, name: '貝那茵森林', minLv: 1, maxLv: 16, baseExpMult: 1.0, boss: { name: '果凍雞王' }, elites: ['【菁英】食人花', '【菁英】多多熊'], monsters: ['小花貓', '綠葉果凍雞', '葉精', '香菇', '食人花', '多多熊'] };
  const chosenDiff = diffMap[diffKey || saveData.currentDifficultyKey] || diffMap.normal || { key: 'normal', name: '🟢 普通', hpMult: 1.0, dmgMult: 1.0, spawnMult: 1.0, expMult: 1.0, dropMult: 1.0 };
  window.ACTIVE_STAGE_RUN = { stage: chosenStage, diff: chosenDiff, charId: saveData.charId, variantId: saveData.variantId, sandbox };

  const d = getDerivedCombatStats(), w = saveData.equip.weapon || { name: '徒手', type: 'longsword', startSkill: 'senku' }, ch = getCurrentCharData();

  // 從 EQUIP_TEMPLATES 反查並補齊真實武器子類型（解決舊存檔 w.type === 'weapon' 的問題）
  if (typeof EQUIP_TEMPLATES !== 'undefined') {
    const tpl = EQUIP_TEMPLATES.find(t => (w.tplId && t.tplId === w.tplId) || t.name === w.name);
    if (tpl && tpl.subType) { w.subType = tpl.subType; w.type = tpl.subType; }
  }
  const realWType = (w.subType && w.subType !== 'weapon') ? w.subType : ((w.type && w.type !== 'weapon') ? w.type : 'longsword');
  w.type = realWType;

  let sigSkill = typeof getWeaponSignatureSkill === 'function' ? getWeaponSignatureSkill(w) : w.startSkill;
  if (saveData.charId === 'tichiel') {
    if (realWType === 'mace' && !w.customStartSkill) sigSkill = 'armorbreak';
    else if (realWType === 'staff' && !w.customStartSkill) sigSkill = 'holylight';
    else if (realWType === 'wand' && !w.customStartSkill) {
      sigSkill = w.wandElem === 'ice' ? 'ice1' : (w.wandElem === 'thunder' ? 'thunder1' : 'fire1');
    }
  }
  if (!sigSkill) sigSkill = 'senku';
  if (typeof EQUIPPED_WEAPON !== 'undefined') { EQUIPPED_WEAPON.name = w.name; EQUIPPED_WEAPON.startSkill = sigSkill; }
  if (typeof ACTIVE_SKILLS !== 'undefined' && typeof getActiveSkillPool === 'function') {
    for (const k of Object.keys(ACTIVE_SKILLS)) delete ACTIVE_SKILLS[k];
    const nextPool = getActiveSkillPool();
    if (typeof GLOBAL_SKILL_POOL !== 'undefined' && GLOBAL_SKILL_POOL[sigSkill] && !nextPool[sigSkill]) {
      nextPool[sigSkill] = { ...GLOBAL_SKILL_POOL[sigSkill], timer: 0.2 };
    }
    Object.assign(ACTIVE_SKILLS, nextPool);
  }

  const hudName = document.getElementById('hudCharName'), hudWep = document.getElementById('weaponText');
  if (hudName) hudName.textContent = sandbox ? `${ch.name}｜木樁修鍊場` : `${ch.name}｜${chosenStage.name}(${chosenDiff.name.replace(/^[^\s]+\s/, '')})`;
  if (hudWep) hudWep.textContent = w.name;
  if (typeof player !== 'undefined') {
    player.maxHp = d.maxHp; player.hp = player.maxHp; player.regen = d.regen; player.baseSpeed = d.moveSpeed; player.pickupRange = d.pickupRange;
    player.cdMult = Math.max(0.35, 1 - (d.cdReduce || 0)); player.areaMult = 1.0; player.speedMult = 1.0; player.dmgMult = 1.0;
    player.bonusCritRate = 0; player.bonusDoubleHit = 0; player.superCritMult = 1.5; player.resonanceDmgMult = 1.0;
    player.dropRateMult = 1.0; player.expMult = d.expBonusMult; player.curseMult = 1.0; player.seedMult = 1.0; player.angelUsed = false;
  }
  if (typeof ownedSkills !== 'undefined') {
    for (const k of Object.keys(ownedSkills)) delete ownedSkills[k];
    const startLv = (w.legendEffect && w.legendEffect.id === 'startLv2') ? 2 : 1;
    ownedSkills[sigSkill] = { lv: startLv, evolved: false, disabled: false };
  }
  if (typeof ownedPassives !== 'undefined') { for (const k of Object.keys(ownedPassives)) delete ownedPassives[k]; }
  if (!sandbox && !deferScene) {
    enterBattleScene();
    recordDevPlayCount('runs');
  }
  return true;
}

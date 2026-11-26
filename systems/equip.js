const RARITIES = {
  white:  { name: '普通', color: '#f8fafc', mult: 1.00, affixes: 0, price: 30 },
  green:  { name: '優良', color: '#4ade80', mult: 1.15, affixes: 1, price: 80 },
  blue:   { name: '稀有', color: '#38bdf8', mult: 1.30, affixes: 2, price: 200 },
  purple: { name: '史詩', color: '#c084fc', mult: 1.50, affixes: 3, price: 500 },
  gold:   { name: '傳說', color: '#facc15', mult: 1.75, affixes: 3, price: 1500, hasLegend: true }
};

const SLOT_NAMES = {
  weapon: '武器', sub: '手飾', head: '頭盔', armor: '衣服',
  gloves: '手部', shoes: '腳部', back: '翅膀', relic: '面具'
};

const EQUIP_TEMPLATES = [
  ...(typeof ITEM_WEAPONS !== 'undefined' ? ITEM_WEAPONS : []),
  ...(typeof ITEM_ARMORS !== 'undefined' ? ITEM_ARMORS : []),
  ...(typeof EVENT_ITEMS !== 'undefined' ? EVENT_ITEMS : [])
];

const PHYS_WEAPON_AFFIXES = [{ key: 'physDmgPct', label: '物理傷害', min: 6, max: 18, unit: '%' }, { key: 'critRate', label: '暴擊率', min: 4, max: 12, unit: '%' }, { key: 'critDmg', label: '暴擊傷害', min: 10, max: 25, unit: '%' }, { key: 'cdr', label: '冷卻縮減', min: 3, max: 8, unit: '%' }];
const MAG_WEAPON_AFFIXES  = [{ key: 'magDmgPct',  label: '魔法傷害', min: 6, max: 18, unit: '%' }, { key: 'critRate', label: '暴擊率', min: 4, max: 12, unit: '%' }, { key: 'critDmg', label: '暴擊傷害', min: 10, max: 25, unit: '%' }, { key: 'cdr', label: '冷卻縮減', min: 3, max: 8, unit: '%' }];

const SLOT_AFFIX_POOLS = {
  longsword:  PHYS_WEAPON_AFFIXES,
  blade:      PHYS_WEAPON_AFFIXES,
  rapier:     PHYS_WEAPON_AFFIXES,
  tachi:      PHYS_WEAPON_AFFIXES,
  greatsword: PHYS_WEAPON_AFFIXES,
  spear:      PHYS_WEAPON_AFFIXES,
  polearm:    PHYS_WEAPON_AFFIXES,
  dagger:     PHYS_WEAPON_AFFIXES,
  dual_blade: PHYS_WEAPON_AFFIXES,
  axe:        PHYS_WEAPON_AFFIXES,
  whip:       PHYS_WEAPON_AFFIXES,
  flail:      PHYS_WEAPON_AFFIXES,
  mace:       PHYS_WEAPON_AFFIXES,
  weapon:    [...PHYS_WEAPON_AFFIXES.slice(0, 1), ...MAG_WEAPON_AFFIXES],
  shield:    [{ key: 'thorns', label: '反傷荊棘', min: 15, max: 35, unit: '%' }, { key: 'hp', label: '最大HP', min: 30, max: 70, unit: '' }, { key: 'physDmgPct', label: '物理傷害', min: 4, max: 12, unit: '%' }],
  ring:      [{ key: 'physDmgPct', label: '物理傷害', min: 5, max: 14, unit: '%' }, { key: 'magDmgPct', label: '魔法傷害', min: 5, max: 14, unit: '%' }, { key: 'critRate', label: '暴擊率', min: 5, max: 14, unit: '%' }, { key: 'critDmg', label: '暴擊傷害', min: 12, max: 28, unit: '%' }],
  crystal:   [{ key: 'magDmgPct', label: '魔法傷害', min: 6, max: 16, unit: '%' }, { key: 'statusChance', label: '異常機率', min: 5, max: 15, unit: '%' }, { key: 'critDmg', label: '暴擊傷害', min: 8, max: 20, unit: '%' }, { key: 'cdr', label: '冷卻縮減', min: 3, max: 7, unit: '%' }],
  default:   [{ key: 'hp', label: '最大HP', min: 20, max: 60, unit: '' }, { key: 'moveSpd', label: '移動速度', min: 5, max: 15, unit: '%' }, { key: 'cdr', label: '冷卻縮減', min: 2, max: 6, unit: '%' }, { key: 'statusChance', label: '異常機率', min: 4, max: 12, unit: '%' }, { key: 'critDmg', label: '暴擊傷害', min: 6, max: 18, unit: '%' }]
};

const SLOT_LEGEND_EFFECTS = {
  weapon:  { id: 'startLv2', desc: '★傳說特效：進入戰鬥時起始技能直接 LV.2' },
  shield:  { id: 'thorns',   desc: '★傳說特效：受到碰撞時反彈 DEF×2.5 傷害' },
  crystal: { id: 'extraProj',desc: '★傳說特效：元素魔法投射物/落雷數量 +1 發' },
  shoes:   { id: 'dodge',    desc: '★傳說特效：獲得 15% 完全閃避率 (MISS)' },
  default: { id: 'vamp',     desc: '★傳說特效：暴擊擊殺敵人時回復 2 點生命' }
};

function getAffixTierColor(val, min, max) {
  if (max <= min) return '#facc15';
  const ratio = (val - min) / (max - min);
  if (ratio >= 0.90) return '#facc15'; // 金色（頂尖滿值）
  if (ratio >= 0.65) return '#38bdf8'; // 藍色（高階）
  if (ratio >= 0.35) return '#4ade80'; // 綠色（中階）
  return '#f8fafc';                    // 白色（低階）
}

function rollSingleAffix(af, mult = 1.0) {
  const realMin = Math.max(1, Math.round(af.min * mult));
  const realMax = Math.max(realMin, Math.round(af.max * mult));
  const val = realMin + Math.floor(Math.random() * (realMax - realMin + 1));
  return { key: af.key, label: af.label, val, unit: af.unit, min: realMin, max: realMax, color: getAffixTierColor(val, realMin, realMax) };
}
function generateEquipUid(save = saveData) {
  return save.nextEquipUid++;
}

// 全域一般關卡掉落等級上限（當前版本開放至 LV.62；LV.75+ 暫不掉落，LV.90+ 走合成系統）
const CURRENT_DROP_MAX_LV = 62;

// 輔助：取得裝備的真實種類標籤（武器取 subType/type/equipTag，防具取 equipTag）
function getItemCategoryTag(it) {
  if (!it) return 'all';
  if (it.slot === 'weapon') {
    const wSub = (it.subType && it.subType !== 'weapon') ? it.subType : ((it.type && it.type !== 'weapon') ? it.type : it.equipTag);
    return wSub || 'all';
  }
  return it.equipTag || 'all';
}

// 關卡與難度稀有度權重抽籤（日常最終 BOSS 金裝 20% 起跳；並套用防炸魚最高稀有度上限）
const RARITY_ORDER = new Array('white', 'green', 'blue', 'purple', 'gold');
const STAGE_RARITY_TABLES = {
  normal: {
    mob:   new Array(58, 33, 8, 1, 0),
    elite: new Array(0, 35, 52, 12, 1),
    mega:  new Array(0, 0, 55, 40, 5),
    final: new Array(0, 0, 20, 60, 20)
  },
  hard: {
    mob:   new Array(45, 38, 14, 3, 0),
    elite: new Array(0, 20, 55, 22, 3),
    mega:  new Array(0, 0, 40, 50, 10),
    final: new Array(0, 0, 10, 65, 25)
  },
  nightmare: {
    mob:   new Array(32, 42, 20, 5.5, 0.5),
    elite: new Array(0, 10, 45, 38, 7),
    mega:  new Array(0, 0, 25, 60, 15),
    final: new Array(0, 0, 0, 70, 30)
  },
  hell: {
    mob:   new Array(20, 40, 30, 9, 1),
    elite: new Array(0, 0, 38, 50, 12),
    mega:  new Array(0, 0, 15, 65, 20),
    final: new Array(0, 0, 0, 65, 35)
  }
};

function rollStageDropRarity(enemyTier = 'mob', diffKey = 'normal', maxRarIdx = 4) {
  const table = STAGE_RARITY_TABLES[diffKey] || STAGE_RARITY_TABLES.normal;
  const weights = table[enemyTier] || table.mob;
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let pickedIdx = 0;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) { pickedIdx = i; break; }
  }
  const cappedIdx = Math.min(pickedIdx, Math.max(0, maxRarIdx));
  return RARITY_ORDER[cappedIdx] || 'white';
}

// 生成未鑑定裝備（支援 minLv ~ maxLv 關卡區間鎖，嚴格排除翅膀、活動裝與合成專屬裝）
function createUnidentifiedDrop(rarity = 'white', maxLv = CURRENT_DROP_MAX_LV, targetSlots = null, forceSelfChar = false, minLv = 0) {
  const curCharData = typeof getCurrentCharData === 'function' ? getCurrentCharData() : { id: 'lucien', equipTags: ['all'] };
  const charTags = curCharData.equipTags || ['all'];
  const effectiveMaxLv = Math.min(maxLv || CURRENT_DROP_MAX_LV, CURRENT_DROP_MAX_LV);
  const effectiveMinLv = Math.max(0, Math.min(minLv || 0, effectiveMaxLv));
  let candidates = EQUIP_TEMPLATES.filter(t =>
    t.reqLv >= effectiveMinLv &&
    t.reqLv <= effectiveMaxLv &&
    !t.isWing &&
    !t.isEvent &&
    (!t.obtain || t.obtain === 'drop')
  );
  if (candidates.length === 0) {
    candidates = EQUIP_TEMPLATES.filter(t =>
      t.reqLv <= effectiveMaxLv && !t.isWing && !t.isEvent && (!t.obtain || t.obtain === 'drop')
    );
  }
  if (targetSlots && targetSlots.length > 0) {
    const f = candidates.filter(t => targetSlots.includes(t.slot));
    if (f.length > 0) candidates = f;
  }
  const isFitChar = (t) => {
    const tag = getItemCategoryTag(t);
    return tag === 'all' || charTags.includes('all') || charTags.includes(tag);
  };
  const wantSelf = forceSelfChar || (Math.random() < 0.65);
  const selfPool = candidates.filter(isFitChar);
  const otherPool = candidates.filter(t => !isFitChar(t));
  const finalPool = (wantSelf && selfPool.length > 0) ? selfPool : (otherPool.length > 0 ? otherPool : candidates);
  const tpl = finalPool[Math.floor(Math.random() * finalPool.length)];
  return { uid: generateEquipUid(), tplId: tpl.tplId, slot: tpl.slot, rarity, identified: false };
}

function createFirstClearWeapon(charId, variantId, { minLv, maxLv }) {
  const character = CHARACTERS[charId];
  const allowed = ITEM_WEAPONS.filter(tpl => character.equipTags.includes(getItemCategoryTag(tpl)));
  const dropWeapons = allowed.filter(tpl => tpl.reqLv <= maxLv && !tpl.isEvent && (!tpl.obtain || tpl.obtain === 'drop'));
  const inRange = dropWeapons.filter(tpl => tpl.reqLv >= minLv);
  const pool = inRange.length ? inRange : dropWeapons;
  const starterId = character.variants[variantId]?.defaultTpl || character.variants[character.defaultVariant].defaultTpl;
  const starter = allowed.find(item => item.tplId === starterId);
  const lowest = [...allowed].sort((a, b) => a.reqLv - b.reqLv);
  const tpl = pool[Math.floor(Math.random() * pool.length)]
    || starter
    || lowest.find(item => getItemCategoryTag(item) === variantId)
    || lowest[0];
  return { uid: generateEquipUid(), tplId: tpl.tplId, slot: 'weapon', rarity: 'gold', identified: false };
}

// 鑑定裝備並生成浮動基礎數值、魔杖元素詞條、純戰鬥四色副詞條與傳說特效
function identifyEquipItem(unidItem) {
  const tpl = EQUIP_TEMPLATES.find(t => t.tplId === unidItem.tplId);
  const rar = RARITIES[unidItem.rarity] || RARITIES.white;
  const realSub = tpl.subType || tpl.type || tpl.equipTag || tpl.slot;
  let assignedElem = tpl.wandElem || null;
  let assignedStartSkill = tpl.startSkill || null;
  if (realSub === 'wand' && !assignedElem) {
    const elems = ['fire', 'ice', 'thunder'];
    assignedElem = elems[Math.floor(Math.random() * elems.length)];
    assignedStartSkill = `${assignedElem}1`;
  }
  const item = {
    uid: unidItem.uid, tplId: tpl.tplId, slot: tpl.slot, subType: realSub, type: realSub,
    equipTag: tpl.equipTag || realSub || 'all', wandElem: assignedElem, name: tpl.name, rarity: unidItem.rarity, reqLv: tpl.reqLv,
    reqStats: { ...(tpl.reqStats || {}) }, startSkill: assignedStartSkill,
    engraved: false, elemRecast: false, synthCount: 0, maxSynth: 3,
    baseRolled: {}, identified: true, affixes: [], legendEffect: null
  };
  for (const [stat, range] of Object.entries(tpl.base || {})) {
    const roll = Math.round((range.min + Math.floor(Math.random() * (range.max - range.min + 1))) * rar.mult);
    item.baseRolled[stat] = roll; item[stat] = roll;
  }
  const poolKey = SLOT_AFFIX_POOLS[realSub] ? realSub : (SLOT_AFFIX_POOLS[tpl.slot] ? tpl.slot : 'default');
  const pool = [...SLOT_AFFIX_POOLS[poolKey]].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(rar.affixes, pool.length); i++) {
    const afObj = rollSingleAffix(pool[i], rar.mult * 0.85);
    item[afObj.key] = (item[afObj.key] || 0) + afObj.val;
    item.affixes.push(afObj);
  }
  if (rar.hasLegend) item.legendEffect = SLOT_LEGEND_EFFECTS[realSub] || SLOT_LEGEND_EFFECTS[tpl.slot] || SLOT_LEGEND_EFFECTS.default;
  return item;
}

// 穿戴門檻與職業驗證標籤名稱對照
const EQUIP_TAG_NAMES = {
  all: '全職業通用', heavy: '重鎧系', robe: '法袍系', ninja: '忍服系',
  shield: '盾牌類', knuckle: '指虎類', crystal: '魔導手鐲類',
  longsword: '長劍類', blade: '彎刀類', rapier: '細劍類', tachi: '太刀類', greatsword: '巨劍類',
  spear: '槍類', polearm: '棍類', dagger: '短劍類', dual_blade: '雙斧類', axe: '戰斧類',
  whip: '鞭類', flail: '鏈錘類', wand: '魔杖類', staff: '權杖類', mace: '釘錘類'
};

// 穿戴門檻、類別標籤（equipTags）與素質要求驗證（統一由角色挑選裝備種類標籤）
function canEquipItem(item) {
  if (!item || !item.identified) return { ok: false, reason: '裝備尚未鑑定' };
  const curCharData = typeof getCurrentCharData === 'function' ? getCurrentCharData() : { id: 'lucien', equipTags: ['all'] };
  const charTags = curCharData.equipTags || ['all'];

   // 1. 統一由角色 equipTags 比對武器種類與防具類別標籤（僅 tag === 'all' 的通用飾品全職業皆可穿）
   const tag = getItemCategoryTag(item);
   if (tag !== 'all' && !charTags.includes(tag)) {
     return { ok: false, reason: `角色武器／防具適性不符（需要【${EQUIP_TAG_NAMES[tag] || tag}】標籤）` };
   }
 
  // 2. 檢查等級與七大素質門檻（點高對應素質即可跨型態穿戴）
  const curLv = (typeof saveData !== 'undefined' && saveData.outLv) ? saveData.outLv : 1;
  if (item.reqLv && curLv < item.reqLv) return { ok: false, reason: `需要角色等級 LV.${item.reqLv}（目前 LV.${curLv}）` };
  if (item.reqStats && typeof getTotalStats === 'function') {
    const curStats = getTotalStats();
    for (const [statKey, reqVal] of Object.entries(item.reqStats)) {
      if ((curStats[statKey] || 0) < reqVal) return { ok: false, reason: `${statKey} 素質不足（需要 ${reqVal}，目前 ${curStats[statKey] || 0}）` };
    }
  }
  return { ok: true };
}

// 1. 消耗 1 次合成次數（上限 3 次），對裝備自帶的 SHIM 基礎屬性浮動提升 +1~+3
function synthEquipBaseStat(item, statKey) {
  if (!item || !item.identified) return { ok: false, msg: '裝備尚未鑑定！' };
  if (!['S', 'H', 'I', 'MR'].includes(statKey)) return { ok: false, msg: '僅限針對 STAB / HACK / INT / MR 進行屬性合成！' };
  const maxS = item.maxSynth ?? 3, curS = item.synthCount ?? 0;
  if (curS >= maxS) return { ok: false, msg: '此裝備的合成次數已達上限（3/3）！' };
  if (!item.baseRolled || !item.baseRolled[statKey]) return { ok: false, msg: `此裝備本身不具備 ${statKey} 基礎屬性！` };

  const gain = 1 + Math.floor(Math.random() * 3); // 浮動增加 +1 ~ +3
  item.baseRolled[statKey] += gain;
  item[statKey] = (item[statKey] || 0) + gain;
  item.synthCount = curS + 1;
  return { ok: true, gain, msg: `🔨 合成成功！${statKey} 提升了 +${gain} 點（剩餘合成次數 ${maxS - item.synthCount}/${maxS}）` };
}

// 2. 計算洗煉所需洗煉石顆數（LV.1~24: 1顆 / LV.25~44: 2顆 / LV.45+: 3顆）
function getRecastStoneCost(item) {
  const lv = item.reqLv || 1;
  return lv >= 45 ? 3 : (lv >= 25 ? 2 : 1);
}

// 3. 無限次刷新裝備魔法副詞條（不扣合成次數，依稀有度適配同品級洗煉石，四色分級）
function recastEquipAffixes(item) {
  if (!item || !item.identified) return { ok: false, msg: '裝備尚未鑑定！' };
  const rar = RARITIES[item.rarity];
  if (!rar || rar.affixes <= 0) return { ok: false, msg: '普通（白色）裝備沒有魔法副詞條可洗煉！' };

  if (Array.isArray(item.affixes)) {
    for (const oldAf of item.affixes) {
      if (oldAf && typeof oldAf === 'object' && oldAf.key) item[oldAf.key] = Math.max(0, (item[oldAf.key] || 0) - oldAf.val);
    }
  }
  item.affixes = [];
  const poolKey = SLOT_AFFIX_POOLS[item.subType] ? item.subType : (SLOT_AFFIX_POOLS[item.slot] ? item.slot : 'default');
  const pool = [...SLOT_AFFIX_POOLS[poolKey]].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(rar.affixes, pool.length); i++) {
    const afObj = rollSingleAffix(pool[i], rar.mult * 0.85);
    item[afObj.key] = (item[afObj.key] || 0) + afObj.val;
    item.affixes.push(afObj);
  }
  return { ok: true, msg: `✨ 洗煉完成！${item.name} 的魔法副詞條已重新賦予！` };
}

// 三層優先級讀取武器初始技能（1. customStartSkill 轉換石改造 ➔ 2. startSkill 武器預設 ➔ 3. 型態預設映射）
function getWeaponSignatureSkill(weapon) {
  if (!weapon) return 'senku';
  if (weapon.customStartSkill) return weapon.customStartSkill;
  if (weapon.startSkill) return weapon.startSkill;
  if (weapon.wandElem) return `${weapon.wandElem}1`;
  const map = typeof DEFAULT_START_SKILL_MAP !== 'undefined' ? DEFAULT_START_SKILL_MAP : {};
  return map[weapon.type] || 'senku';
}

// 4. 消耗【技能刻印石】自選覆寫劍類武器初始技能（限 LV.15 以上劍類 1 次；法杖/釘錘/魔杖禁用）
function engraveWeaponSkill(weaponItem, newSkillId) {
  if (!weaponItem || weaponItem.slot !== 'weapon' || !weaponItem.identified) return { ok: false, msg: '請選擇一把已鑑定的武器！' };
  if (!['longsword', 'blade', 'rapier'].includes(weaponItem.type)) return { ok: false, msg: '僅限物理劍類武器可使用技能刻印石（法杖、釘錘與魔杖不可使用）！' };
  if (weaponItem.reqLv < 15) return { ok: false, msg: '僅限需求 LV.15 以上的武器可使用技能刻印石！' };
  if (weaponItem.engraved) return { ok: false, msg: '此武器已經進行過技能刻印，每把武器限改寫 1 次！' };
  const skillPool = typeof getActiveSkillPool === 'function' ? getActiveSkillPool() : {};
  const targetSk = skillPool[newSkillId];
  if (!targetSk) return { ok: false, msg: '無效的目標技能 ID！' };
  weaponItem.customStartSkill = newSkillId;
  weaponItem.startSkill = newSkillId;
  weaponItem.engraved = true;
  return { ok: true, msg: `🔮 刻印成功！${weaponItem.name} 的初始技能已改造為【${targetSk.name}】！` };
}

// 5. 消耗【元素魔晶石】改寫元素魔杖的屬性詞條與對應卡池（限 LV.15 以上魔杖 1 次，不扣合成次數）
function recastWandElement(weaponItem, newElem) {
  if (!weaponItem || weaponItem.type !== 'wand' || !weaponItem.identified) return { ok: false, msg: '僅限已鑑定的元素魔杖可使用元素魔晶石！' };
  if (weaponItem.reqLv < 15) return { ok: false, msg: '僅限需求 LV.15 以上的元素魔杖可使用元素魔晶石！' };
  if (weaponItem.elemRecast) return { ok: false, msg: '此魔杖已經進行過元素轉換，每把魔杖限轉換 1 次！' };
  const elemMap = { fire: { name: '火系', startSkill: 'fire1' }, ice: { name: '冰系', startSkill: 'ice1' }, thunder: { name: '雷系', startSkill: 'thunder1' } };
  if (!elemMap[newElem]) return { ok: false, msg: '無效的元素屬性（僅限火／冰／雷）！' };
  weaponItem.wandElem = newElem;
  weaponItem.startSkill = elemMap[newElem].startSkill;
  weaponItem.elemRecast = true;
  return { ok: true, msg: `🌈 元素轉換成功！${weaponItem.name} 已轉換為【${elemMap[newElem].name}卡池】！` };
}

// ==================================================================
// 6. 【預留介面】LV.90 以上高階裝備合成系統（待素材與配方定案後啟用）
// ==================================================================
function getCraftableEquipTemplates(slotFilter = null) {
  return EQUIP_TEMPLATES.filter(t =>
    t.obtain === 'craft' &&
    !t.isEvent &&
    (!slotFilter || t.slot === slotFilter)
  );
}

function craftHighTierEquip(tplId, targetRarity = 'blue') {
  const tpl = EQUIP_TEMPLATES.find(t => t.tplId === tplId && t.obtain === 'craft');
  if (!tpl) return { ok: false, msg: '找不到對應的高階合成裝備配方！' };
  if (!tpl.craftRecipe) return { ok: false, msg: `【${tpl.name}】的合成系統尚未開放，敬請期待！` };
  // TODO：後續實裝扣除素材／金幣並呼叫 identifyEquipItem({ uid: generateEquipUid(), tplId, slot: tpl.slot, rarity: targetRarity, identified: false })
  return { ok: false, msg: '合成功能建置中' };
}

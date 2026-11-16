const RARITIES = {
  white:  { name: '普通', color: '#f8fafc', mult: 1.00, affixes: 0, price: 30 },
  green:  { name: '優良', color: '#4ade80', mult: 1.15, affixes: 1, price: 80 },
  blue:   { name: '稀有', color: '#38bdf8', mult: 1.30, affixes: 2, price: 200 },
  purple: { name: '史詩', color: '#c084fc', mult: 1.50, affixes: 3, price: 500 },
  gold:   { name: '傳說', color: '#facc15', mult: 1.75, affixes: 3, price: 1500, hasLegend: true }
};

const SLOT_NAMES = {
  weapon: '武器', sub: '手飾', head: '頭盔', armor: '衣服',
  gloves: '手部', shoes: '腳部', back: '翅膀', relic: '文物'
};

// 初代 8 大主角裝備模板（長劍=圓月斬 / 彎刀=連犽斬 / 細劍=極光刺）
const EQUIP_TEMPLATES = [
  ...(typeof ITEM_WEAPONS !== 'undefined' ? ITEM_WEAPONS : []),
  ...(typeof ITEM_ARMORS !== 'undefined' ? ITEM_ARMORS : [])
];

const SLOT_AFFIX_POOLS = {
  weapon:  [{ key: 'critRate', label: '暴擊率', min: 4, max: 12, unit: '%' }, { key: 'critDmg', label: '暴擊傷害', min: 10, max: 25, unit: '%' }, { key: 'H', label: 'HACK', min: 2, max: 7, unit: '' }, { key: 'S', label: 'STAB', min: 2, max: 7, unit: '' }],
  shield:  [{ key: 'thorns', label: '反傷荊棘', min: 15, max: 35, unit: '%' }, { key: 'DEF', label: 'DEF', min: 3, max: 8, unit: '' }, { key: 'hp', label: '最大HP', min: 30, max: 70, unit: '' }],
  ring:    [{ key: 'critRate', label: '暴擊率', min: 5, max: 14, unit: '%' }, { key: 'critDmg', label: '暴擊傷害', min: 12, max: 28, unit: '%' }, { key: 'DEX', label: 'DEX', min: 2, max: 6, unit: '' }],
  crystal: [{ key: 'I', label: 'INT', min: 3, max: 8, unit: '' }, { key: 'MR', label: 'MR', min: 3, max: 8, unit: '' }, { key: 'critDmg', label: '暴擊傷害', min: 8, max: 20, unit: '%' }],
  default: [{ key: 'hp', label: '最大HP', min: 20, max: 60, unit: '' }, { key: 'DEF', label: 'DEF', min: 2, max: 6, unit: '' }, { key: 'MR', label: 'MR', min: 2, max: 6, unit: '' }, { key: 'AGI', label: 'AGI', min: 2, max: 6, unit: '' }, { key: 'critDmg', label: '暴擊傷害', min: 6, max: 18, unit: '%' }]
};

const SLOT_LEGEND_EFFECTS = {
  weapon:  { id: 'startLv2', desc: '★傳說特效：進入戰鬥時起始技能直接 LV.2' },
  shield:  { id: 'thorns',   desc: '★傳說特效：受到碰撞時反彈 DEF×2.5 傷害' },
  crystal: { id: 'extraProj',desc: '★傳說特效：元素魔法投射物/落雷數量 +1 發' },
  shoes:   { id: 'dodge',    desc: '★傳說特效：獲得 15% 完全閃避率 (MISS)' },
  default: { id: 'vamp',     desc: '★傳說特效：暴擊擊殺敵人時回復 2 點生命' }
};

let _uidSeq = 1;
function generateEquipUid() {
  return Number(`${Date.now().toString().slice(-8)}${(_uidSeq++ % 9000) + 1000}`);
}

// 生成未鑑定裝備（65% 本職優先，關尾 Boss 可設 forceSelfChar = true 必出本職）
function createUnidentifiedDrop(rarity = 'white', maxLv = 60, targetSlots = null, forceSelfChar = false) {
  const curChar = (typeof saveData !== 'undefined' && saveData.charId) ? saveData.charId : 'lucien';
  let candidates = EQUIP_TEMPLATES.filter(t => t.reqLv <= maxLv);
  if (targetSlots && targetSlots.length > 0) {
    const f = candidates.filter(t => targetSlots.includes(t.slot));
    if (f.length > 0) candidates = f;
  }
  const wantSelf = forceSelfChar || (Math.random() < 0.65);
  const selfPool = candidates.filter(t => t.allowChars.includes('all') || t.allowChars.includes(curChar));
  const otherPool = candidates.filter(t => !t.allowChars.includes('all') && !t.allowChars.includes(curChar));
  const finalPool = (wantSelf && selfPool.length > 0) ? selfPool : (otherPool.length > 0 ? otherPool : candidates);
  const tpl = finalPool[Math.floor(Math.random() * finalPool.length)];
  return { uid: generateEquipUid(), tplId: tpl.tplId, slot: tpl.slot, rarity, identified: false };
}

// 鑑定裝備並生成浮動數值、詞綴與傳說特效
function identifyEquipItem(unidItem) {
  const tpl = EQUIP_TEMPLATES.find(t => t.tplId === unidItem.tplId);
  const rar = RARITIES[unidItem.rarity] || RARITIES.white;
  const item = {
    uid: unidItem.uid, tplId: tpl.tplId, slot: tpl.slot, subType: tpl.subType, type: tpl.subType,
    name: tpl.name, rarity: unidItem.rarity, reqLv: tpl.reqLv, reqStats: { ...tpl.reqStats },
    allowChars: [...tpl.allowChars], startSkill: tpl.startSkill || null, engraved: false,
    enhanceLv: 0, baseRolled: {}, identified: true, affixes: [], legendEffect: null
  };
  for (const [stat, range] of Object.entries(tpl.base)) {
    const roll = Math.round((range.min + Math.floor(Math.random() * (range.max - range.min + 1))) * rar.mult);
    item.baseRolled[stat] = roll; item[stat] = roll;
  }
  const poolKey = SLOT_AFFIX_POOLS[tpl.subType] ? tpl.subType : (SLOT_AFFIX_POOLS[tpl.slot] ? tpl.slot : 'default');
  const pool = [...SLOT_AFFIX_POOLS[poolKey]].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(rar.affixes, pool.length); i++) {
    const af = pool[i];
    const val = Math.round((af.min + Math.floor(Math.random() * (af.max - af.min + 1))) * (rar.mult * 0.85));
    item[af.key] = (item[af.key] || 0) + val;
    item.affixes.push(`${af.label} +${val}${af.unit}`);
  }
  if (rar.hasLegend) item.legendEffect = SLOT_LEGEND_EFFECTS[tpl.subType] || SLOT_LEGEND_EFFECTS[tpl.slot] || SLOT_LEGEND_EFFECTS.default;
  return item;
}

// 穿戴門檻與職業驗證（修復大廳穿戴按鈕缺失的關鍵函式）
function canEquipItem(item) {
  if (!item || !item.identified) return { ok: false, reason: '裝備尚未鑑定' };
  const curChar = (typeof saveData !== 'undefined' && saveData.charId) ? saveData.charId : 'lucien';

  // 1. 檢查角色職業限制
  if (item.allowChars && !item.allowChars.includes('all') && !item.allowChars.includes(curChar)) {
    return { ok: false, reason: `職業不符（限定：${item.allowChars.join('/')}）` };
  }

  // 2. 檢查局外等級需求
  const curLv = (typeof saveData !== 'undefined' && saveData.outLv) ? saveData.outLv : 1;
  if (item.reqLv && curLv < item.reqLv) {
    return { ok: false, reason: `需要角色等級 LV.${item.reqLv}（目前 LV.${curLv}）` };
  }

  // 3. 檢查七大素質門檻（以當前總素質判定）
  if (item.reqStats && typeof getTotalStats === 'function') {
    const curStats = getTotalStats();
    for (const [statKey, reqVal] of Object.entries(item.reqStats)) {
      if ((curStats[statKey] || 0) < reqVal) {
        return { ok: false, reason: `${statKey} 素質不足（需要 ${reqVal}，目前 ${curStats[statKey] || 0}）` };
      }
    }
  }

  return { ok: true };
}

// LV.15 以上裝備精煉強化（+1 ~ +10，每次基礎屬性 +10%，無合成次數限制）
function enhanceEquipItem(item) {
  if (!item.identified || item.reqLv < 15) return { ok: false, msg: '僅限需求 LV.15 以上已鑑定裝備強化！' };
  if ((item.enhanceLv || 0) >= 10) return { ok: false, msg: '已達最高精煉等級 +10！' };
  const lv = item.enhanceLv || 0;
  const cost = (lv + 1) * 150;
  if (saveData.seed < cost) return { ok: false, msg: `Seed 不足（需要 ${cost} Seed）` };
  saveData.seed -= cost;
  const rates = [1, 1, 1, 1, 0.75, 0.65, 0.5, 0.35, 0.25, 0.15];
  if (Math.random() <= rates[lv]) {
    item.enhanceLv = lv + 1;
    for (const [stat, bVal] of Object.entries(item.baseRolled)) {
      const diff = Math.round(bVal * (item.enhanceLv * 0.1)) - Math.round(bVal * (lv * 0.1));
      item[stat] = (item[stat] || 0) + diff;
    }
    return { ok: true, msg: `✨ 精煉成功！${item.name} 提升至 +${item.enhanceLv}！` };
  }
  if (lv >= 7) { item.enhanceLv = lv - 1; return { ok: false, msg: `💥 高階精煉失敗，倒退為 +${item.enhanceLv}` }; }
  return { ok: false, msg: '💨 精煉失敗，裝備等級維持不變' };
}

// 消耗【技能刻印石】自選覆寫武器起始技能（每把武器限 1 次）
function engraveWeaponSkill(weaponItem, newSkillId) {
  if (!weaponItem || weaponItem.slot !== 'weapon' || !weaponItem.identified) {
    return { ok: false, msg: '請選擇一把已鑑定的武器！' };
  }
  if (weaponItem.reqLv < 15) {
    return { ok: false, msg: '僅限需求 LV.15 以上的武器可使用技能刻印石！' };
  }
  if (weaponItem.engraved) {
    return { ok: false, msg: '此武器已經進行過技能刻印，每把武器限改寫 1 次！' };
  }
  const skillPool = typeof getActiveSkillPool === 'function' ? getActiveSkillPool() : {};
  const targetSk = skillPool[newSkillId];
  if (!targetSk) {
    return { ok: false, msg: '無效的目標技能 ID！' };
  }
  weaponItem.startSkill = newSkillId;
  weaponItem.engraved = true;
  weaponItem.affixes.push(`🔮 刻印技能：${targetSk.name}`);
  return { ok: true, msg: `✨ 刻印成功！${weaponItem.name} 的起始招式已覆寫為【${targetSk.name}】！` };
}

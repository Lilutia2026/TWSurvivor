/**
 * ==================================================================
 * 《TW倖存者》V2.7 全武器總彙整與本命技能映射庫 (data/item_weapons.js)
 * 職責：合併各系武器資料表、補齊預設本命技能與七大素質浮動區間
 * ==================================================================
 */

// 各武器型態預設本命技能對照總表（當武器未指定 customStartSkill 與 startSkill 時啟用）
const DEFAULT_START_SKILL_MAP = {
  longsword: 'senku',
  blade:     'renga',
  rapier:    'aurorathrust',
  staff:     'holylight',
  mace:      'armorbreak',
  wand:      'fire1'
};

// 武器總彙整檔（自動合併劍類與魔法武器資料表）
const WEAPON_TEMPLATES = [
  ...(typeof WEAPON_SWORD_ITEMS !== 'undefined' ? WEAPON_SWORD_ITEMS : []),
  ...(typeof WEAPON_MAGIC_ITEMS !== 'undefined' ? WEAPON_MAGIC_ITEMS : [])
];

// 自動補齊武器類別標籤、預設本命技能與 ±15% 基礎素質浮動區間
WEAPON_TEMPLATES.forEach(w => {
  if (!w.allowChars) w.allowChars = ['all'];
  if (!w.equipTag) w.equipTag = w.type || 'all';
  if (!w.type) w.type = w.equipTag;
  if (!w.startSkill) {
    w.startSkill = w.wandElem ? `${w.wandElem}1` : (DEFAULT_START_SKILL_MAP[w.type] || 'senku');
  }
  w.subType = w.type;
  w.base = {};
  for (const k of ['S', 'H', 'I', 'DEF', 'MR', 'DEX', 'AGI']) {
    if (w[k]) {
      const v = w[k];
      w.base[k] = { min: Math.max(1, Math.floor(v * 0.85)), max: Math.ceil(v * 1.15) };
    }
  }
});

const ITEM_WEAPONS = WEAPON_TEMPLATES;
const EQUIPPED_WEAPON = { ...(ITEM_WEAPONS || { tplId: 'w_long_1', name: '學徒長劍', type: 'longsword', startSkill: 'senku' }) };

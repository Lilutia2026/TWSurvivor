// 武器總彙整檔（自動合併各系武器資料表；活動武器獨立存於 data/item_event.js）
const WEAPON_TEMPLATES = [
  ...(typeof WEAPON_SWORD_ITEMS !== 'undefined' ? WEAPON_SWORD_ITEMS : []),
  ...(typeof WEAPON_HEAVY_ITEMS !== 'undefined' ? WEAPON_HEAVY_ITEMS : []),
  ...(typeof WEAPON_LIGHT_ITEMS !== 'undefined' ? WEAPON_LIGHT_ITEMS : []),
  ...(typeof WEAPON_MAGIC_ITEMS !== 'undefined' ? WEAPON_MAGIC_ITEMS : [])
];

// 自動補齊武器部位、類別標籤、預設本命技能與 ±15% 基礎素質浮動區間
WEAPON_TEMPLATES.forEach(w => {
  if (!w.slot) w.slot = 'weapon';
  if (!w.allowChars) w.allowChars = ['all'];
  if (!w.equipTag) {
    if (w.tplId.startsWith('w_long')) w.equipTag = 'longsword';
    else if (w.tplId.startsWith('w_bld')) w.equipTag = 'blade';
    else if (w.tplId.startsWith('w_rap')) w.equipTag = 'rapier';
    else if (w.tplId.startsWith('w_tach')) w.equipTag = 'tachi';
    else if (w.tplId.startsWith('w_gs')) w.equipTag = 'greatsword';
    else if (w.tplId.startsWith('w_spr')) w.equipTag = 'spear';
    else if (w.tplId.startsWith('w_pole')) w.equipTag = 'polearm';
    else if (w.tplId.startsWith('w_dag')) w.equipTag = 'dagger';
    else if (w.tplId.startsWith('w_db')) w.equipTag = 'dual_blade';
    else if (w.tplId.startsWith('w_axe')) w.equipTag = 'axe';
    else if (w.tplId.startsWith('w_whip')) w.equipTag = 'whip';
    else if (w.tplId.startsWith('w_flail')) w.equipTag = 'flail';
    else if (w.tplId.startsWith('w_wand')) w.equipTag = 'wand';
    else if (w.tplId.startsWith('w_stf')) w.equipTag = 'staff';
    else if (w.tplId.startsWith('w_mace')) w.equipTag = 'mace';
  }
  if (!w.subType) w.subType = w.equipTag;
  if (!w.base) {
    w.base = {};
    ['S', 'H', 'I', 'DEF', 'MR', 'DEX', 'AGI'].forEach(k => {
      if (w[k] && w[k] > 0) {
        w.base[k] = { min: Math.max(1, Math.floor(w[k] * 0.85)), max: Math.max(w[k], Math.ceil(w[k] * 1.15)) };
      }
    });
  }
  if (!w.statRange) {
    w.statRange = {};
    for (const [k, r] of Object.entries(w.base)) w.statRange[k] = [r.min, r.max];
  }
});

// 武器預設本命技能對照表（全 15 種武器類型）
const DEFAULT_START_SKILL_MAP = {
  longsword: 'senku',
  blade: 'renga',
  rapier: 'aurorathrust',
  tachi: 'earth_slash',
  greatsword: 'senku',
  spear: 'sky_whirl_spear',
  polearm: 'shining_spear',
  dagger: 'aurorathrust',
  dual_blade: 'renga',
  axe: 'renga',
  whip: 'renga',
  flail: 'senku',
  wand: 'fire1',
  staff: 'holylight',
  mace: 'armorbreak'
};

// 角色專屬武器起始本命技能覆寫表（優先於 DEFAULT_START_SKILL_MAP）
const CHAR_WEAPON_START_SKILL_MAP = {
  boris: {
    tachi: 'earth_slash',
    greatsword: 'ice_strike',
    blade: 'renga'
  }
};

function getCharWeaponStartSkill(charId, weaponType) {
  if (charId && CHAR_WEAPON_START_SKILL_MAP[charId] && CHAR_WEAPON_START_SKILL_MAP[charId][weaponType]) {
    return CHAR_WEAPON_START_SKILL_MAP[charId][weaponType];
  }
  return DEFAULT_START_SKILL_MAP[weaponType] || 'senku';
}

// 全 15 種武器與防具類型中文譯名字典
const EQUIP_TYPE_NAMES = {
  longsword: '長劍', blade: '彎刀', rapier: '細劍',
  tachi: '太刀', greatsword: '巨劍', spear: '槍', polearm: '棍',
  dagger: '短劍', dual_blade: '短刀', axe: '雙斧', whip: '鞭', flail: '鏈錘',
  wand: '法杖', staff: '權杖', mace: '釘錘',
  heavy: '重鎧', robe: '法袍', ninja: '忍服',
  shield: '盾牌', knuckle: '指虎', crystal: '魔法手鐲',
  all: '全職業通用'
};

const ITEM_WEAPONS = WEAPON_TEMPLATES;

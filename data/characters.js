// 七大類型定位「自動必升 +1 ＋ 凹點機率 +1」與自由配點規則（V2.4 定案）
const ARCHETYPE_RULES = {
  S:       { name: '刺擊型',   autoStat: 'S',   bonusStat: 'DEX', primaryStats: ['S'] },
  H:       { name: '劈砍型',   autoStat: 'H',   bonusStat: 'DEF', primaryStats: ['H'] },
  'S+H':   { name: '複合型',   autoStat: 'S',   bonusStat: 'DEX', primaryStats: ['S', 'H'] },
  'H+I':   { name: '魔劍型',   autoStat: 'H',   bonusStat: 'AGI', primaryStats: ['H', 'I'] },
  I:       { name: '攻擊型',   autoStat: 'I',   bonusStat: 'DEX', primaryStats: ['I'] },
  MR:      { name: '輔助型',   autoStat: 'MR',  bonusStat: 'AGI', primaryStats: ['MR'] },
  'DEF+H': { name: '戰鬥型',   autoStat: 'DEF', bonusStat: 'H',   primaryStats: ['DEF', 'H'] }
};

// 全 8 位經典角色台版正統類型與初始數值總表（共 22 筆資料，初始 AGI 皆為 1）
const CHARACTERS = {
  lucien: {
    id: 'lucien', name: '路西安．卡爾茲', title: '卡雷德的貴公子', color: '#3b82f6', playable: true,
    defaultVariant: 'longsword',
    equipTags: ['all', 'heavy', 'shield', 'longsword', 'blade', 'rapier'],
    variants: {
      longsword: { wName: '長劍', archetype: 'S+H', initHp: 220, defaultTpl: 'w_long_1', baseStats: { S: 4, H: 3, I: 1, DEF: 2, MR: 1, DEX: 2, AGI: 1 } },
      blade:     { wName: '彎刀', archetype: 'H',   initHp: 240, defaultTpl: 'w_bld_1',  baseStats: { S: 3, H: 4, I: 1, DEF: 2, MR: 1, DEX: 2, AGI: 1 } },
      rapier:    { wName: '細劍', archetype: 'S',   initHp: 200, defaultTpl: 'w_rap_1',  baseStats: { S: 4, H: 3, I: 1, DEF: 3, MR: 1, DEX: 1, AGI: 1 } }
    }
  },

  tichiel: {
    id: 'tichiel', name: '蒂琪愛兒．朱斯彼昂', title: '天真爛漫的聖女', color: '#f472b6', playable: true,
    defaultVariant: 'wand_fire',
    equipTags: ['all', 'robe', 'crystal', 'wand', 'staff', 'mace'],
    resonances: {
      fire:      { mult: [1.50, 1.80, 2.15, 2.50, 2.90], radius: 115 },
      ice:       { mult: [2.80, 3.40, 4.10, 4.80, 5.60] },
      lightning: { mult: [1.80, 2.20, 2.65], jumps: 3, icd: 0.25 },
      holy:      { polyMult: [2.60, 3.20, 3.90, 4.60, 5.40], hammerMult: [3.00, 3.70, 4.50, 5.20, 6.00], waveRadiusBonus: [0, 0.10, 0.20, 0.30, 0.40] }
    },
    variants: {
      wand_fire:    { wName: '火魔杖', archetype: 'I',     initHp: 160, defaultTpl: 'w_wnd_f_1', baseStats: { S: 1, H: 2, I: 4, DEF: 1, MR: 3, DEX: 2, AGI: 1 } },
      wand_ice:     { wName: '冰魔杖', archetype: 'I',     initHp: 160, defaultTpl: 'w_wnd_i_1', baseStats: { S: 1, H: 2, I: 4, DEF: 1, MR: 3, DEX: 2, AGI: 1 } },
      wand_thunder: { wName: '雷魔杖', archetype: 'I',     initHp: 160, defaultTpl: 'w_wnd_t_1', baseStats: { S: 1, H: 2, I: 4, DEF: 1, MR: 3, DEX: 2, AGI: 1 } },
      staff:        { wName: '法杖',   archetype: 'MR',    initHp: 170, defaultTpl: 'w_stf_1',   baseStats: { S: 2, H: 2, I: 2, DEF: 2, MR: 3, DEX: 2, AGI: 1 } },
      mace:         { wName: '釘錘',   archetype: 'DEF+H', initHp: 180, defaultTpl: 'w_mac_1',   baseStats: { S: 2, H: 3, I: 1, DEF: 3, MR: 2, DEX: 2, AGI: 1 } }
    }
  },

  boris: {
    id: 'boris', name: '波里斯．貞奈曼', title: '冷徹的冬霜劍士', color: '#60a5fa', playable: false,
    defaultVariant: 'tachi',
    equipTags: ['all', 'heavy', 'knuckle', 'tachi', 'greatsword', 'longsword'],
    variants: {
      tachi:      { wName: '太刀',   archetype: 'S+H', initHp: 200, defaultTpl: 'w_long_1', baseStats: { S: 3, H: 4, I: 1, DEF: 2, MR: 2, DEX: 1, AGI: 1 } },
      greatsword: { wName: '雙手劍', archetype: 'H+I', initHp: 185, defaultTpl: 'w_bld_1',  baseStats: { S: 2, H: 4, I: 2, DEF: 2, MR: 2, DEX: 1, AGI: 1 } },
      blade:      { wName: '彎刀',   archetype: 'H',   initHp: 220, defaultTpl: 'w_bld_1',  baseStats: { S: 2, H: 5, I: 1, DEF: 2, MR: 2, DEX: 1, AGI: 1 } }
    }
  },

  maximin: {
    id: 'maximin', name: '麥克斯明．里伯克列', title: '叛逆的疾風劍士', color: '#a855f7', playable: false,
    defaultVariant: 'tachi',
    equipTags: ['all', 'heavy', 'shield', 'knuckle', 'tachi', 'blade'],
    variants: {
      tachi:      { wName: '太刀',   archetype: 'S+H', initHp: 190, defaultTpl: 'w_long_1', baseStats: { S: 4, H: 4, I: 1, DEF: 1, MR: 1, DEX: 2, AGI: 1 } },
      greatsword: { wName: '雙手劍', archetype: 'H+I', initHp: 175, defaultTpl: 'w_bld_1',  baseStats: { S: 2, H: 4, I: 2, DEF: 1, MR: 2, DEX: 2, AGI: 1 } },
      blade:      { wName: '彎刀',   archetype: 'H',   initHp: 210, defaultTpl: 'w_bld_1',  baseStats: { S: 3, H: 5, I: 1, DEF: 1, MR: 1, DEX: 2, AGI: 1 } }
    }
  },

  naya: {
    id: 'naya', name: '娜雅特蕾依', title: '沉默的暗影忍姬', color: '#ef4444', playable: false,
    defaultVariant: 'dagger',
    equipTags: ['all', 'heavy', 'ninja', 'dagger', 'dual_blade', 'axe'],
    variants: {
      dagger: { wName: '短劍', archetype: 'S',   initHp: 185, defaultTpl: 'w_rap_1', baseStats: { S: 4, H: 2, I: 1, DEF: 1, MR: 1, DEX: 4, AGI: 1 } },
      knife:  { wName: '短刀', archetype: 'S+H', initHp: 205, defaultTpl: 'w_rap_1', baseStats: { S: 4, H: 3, I: 1, DEF: 1, MR: 1, DEX: 3, AGI: 1 } },
      axe:    { wName: '斧頭', archetype: 'H',   initHp: 225, defaultTpl: 'w_bld_1', baseStats: { S: 2, H: 4, I: 1, DEF: 1, MR: 1, DEX: 4, AGI: 1 } }
    }
  },

  sivelin: {
    id: 'sivelin', name: '希培林．武', title: '失憶的紅蓮槍豪', color: '#f97316', playable: false,
    defaultVariant: 'spear',
    equipTags: ['all', 'heavy', 'knuckle', 'spear', 'polearm'],
    variants: {
      spear: { wName: '槍', archetype: 'S',   initHp: 220, defaultTpl: 'w_rap_1',  baseStats: { S: 5, H: 2, I: 1, DEF: 2, MR: 1, DEX: 2, AGI: 1 } },
      rod:   { wName: '棍', archetype: 'S+H', initHp: 240, defaultTpl: 'w_long_1', baseStats: { S: 4, H: 4, I: 1, DEF: 2, MR: 1, DEX: 1, AGI: 1 } }
    }
  },

  mila: {
    id: 'mila', name: '美菈．奈伯拉斯卡', title: '紅海的狂野女船長', color: '#ec4899', playable: false,
    defaultVariant: 'whip',
    equipTags: ['all', 'heavy', 'ninja', 'whip', 'flail'],
    variants: {
      whip:  { wName: '鞭',   archetype: 'H',   initHp: 210, defaultTpl: 'w_bld_1',  baseStats: { S: 2, H: 4, I: 1, DEF: 1, MR: 2, DEX: 3, AGI: 1 } },
      flail: { wName: '鏈錘', archetype: 'S+H', initHp: 190, defaultTpl: 'w_long_1', baseStats: { S: 4, H: 4, I: 1, DEF: 1, MR: 1, DEX: 2, AGI: 1 } }
    }
  },

  ispin: {
    id: 'ispin', name: '伊絲萍．查爾斯', title: '男裝的王國公主', color: '#eab308', playable: false,
    defaultVariant: 'longsword',
    equipTags: ['all', 'heavy', 'shield', 'longsword', 'blade', 'rapier'],
    variants: {
      longsword: { wName: '長劍', archetype: 'S+H', initHp: 200, defaultTpl: 'w_long_1', baseStats: { S: 4, H: 3, I: 1, DEF: 2, MR: 1, DEX: 2, AGI: 1 } },
      blade:     { wName: '彎刀', archetype: 'H',   initHp: 220, defaultTpl: 'w_bld_1',  baseStats: { S: 3, H: 4, I: 1, DEF: 2, MR: 1, DEX: 2, AGI: 1 } },
      rapier:    { wName: '細劍', archetype: 'S',   initHp: 185, defaultTpl: 'w_rap_1',  baseStats: { S: 4, H: 3, I: 1, DEF: 2, MR: 1, DEX: 2, AGI: 1 } }
    }
  }
};
function getCurrentCharData() {
  const cid = (typeof saveData !== 'undefined' && saveData.charId) ? saveData.charId : 'lucien';
  return CHARACTERS[cid] || CHARACTERS.lucien;
}

function getCurrentCharVariant() {
  const ch = getCurrentCharData();
  const vid = (typeof saveData !== 'undefined' && saveData.variantId && ch.variants[saveData.variantId])
    ? saveData.variantId : ch.defaultVariant;
  return { id: vid, ...ch.variants[vid] };
}

function getCurrentArchetypeRule() {
  const v = getCurrentCharVariant();
  return ARCHETYPE_RULES[v.archetype] || ARCHETYPE_RULES['S+H'];
}

// 自由配點消耗：本職專長屬性與機能屬性 (DEF/DEX/AGI) 固定 1 pt，跨系輸出屬性 2 pt
function getStatPointCost(statKey) {
  if (['DEF', 'DEX', 'AGI'].includes(statKey)) return 1;
  const rule = getCurrentArchetypeRule();
  return rule.primaryStats.includes(statKey) ? 1 : 2;
}

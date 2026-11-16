// 初代 7 大防具與飾品資料庫（衣服、手飾、頭盔、手部、腳部、翅膀、文物）
const ITEM_ARMORS = [
    // 衣服（armor）：輕鎧All / 重鎧非小愛 / 忍服美拉娜雅 / 法袍小愛 / 魔鎧波里斯麥克斯明
    { tplId: 'a_light_4',   slot: 'armor',  subType: 'light',     name: '光耀輕鎧',   reqLv: 4,  reqStats: { DEF: 4 },  allowChars: ['all'], base: { DEF: { min: 3, max: 6 }, AGI: { min: 2, max: 4 }, hp: { min: 20, max: 40 } } },
    { tplId: 'a_heavy_15',  slot: 'armor',  subType: 'heavy',     name: '精鋼鱗甲',   reqLv: 15, reqStats: { DEF: 16 }, allowChars: ['lucien', 'boris', 'maximin', 'mila', 'naya', 'sivelin', 'ispin'], base: { DEF: { min: 9, max: 15 }, hp: { min: 50, max: 90 } } },
    { tplId: 'a_heavy_30',  slot: 'armor',  subType: 'heavy',     name: '皇家板甲',   reqLv: 30, reqStats: { DEF: 35 }, allowChars: ['lucien', 'boris', 'maximin', 'mila', 'naya', 'sivelin', 'ispin'], base: { DEF: { min: 18, max: 28 }, hp: { min: 100, max: 160 } } },
    { tplId: 'a_ninja_15',  slot: 'armor',  subType: 'ninja',     name: '疾風忍服',   reqLv: 15, reqStats: { DEX: 14, DEF: 8 }, allowChars: ['mila', 'naya'], base: { AGI: { min: 7, max: 12 }, DEX: { min: 5, max: 9 } } },
    { tplId: 'a_robe_15',   slot: 'armor',  subType: 'robe',      name: '星辰法師袍', reqLv: 15, reqStats: { MR: 14 }, allowChars: ['tichiel'], base: { I: { min: 7, max: 12 }, MR: { min: 7, max: 12 } } },
    { tplId: 'a_magic_15',  slot: 'armor',  subType: 'magicarmor',name: '符文魔鎧',   reqLv: 15, reqStats: { DEF: 12, I: 12 }, allowChars: ['boris', 'maximin'], base: { DEF: { min: 6, max: 10 }, I: { min: 6, max: 10 }, MR: { min: 5, max: 9 } } },
  
    // 手飾/副手（sub）：盾牌、水晶石、白金戒指、指虎、護腕
    { tplId: 's_shield_15', slot: 'sub',    subType: 'shield',    name: '騎士圓盾',   reqLv: 15, reqStats: { DEF: 16 }, allowChars: ['lucien', 'boris', 'maximin', 'ispin'], base: { DEF: { min: 8, max: 13 }, hp: { min: 40, max: 75 } } },
    { tplId: 's_crystal_15',slot: 'sub',    subType: 'crystal',   name: '元素水晶石', reqLv: 15, reqStats: { I: 12 },   allowChars: ['all'], base: { I: { min: 6, max: 11 }, MR: { min: 5, max: 9 }, critRate: { min: 4, max: 9 } } },
    { tplId: 's_ring_20',   slot: 'sub',    subType: 'ring',      name: '白金戒指',   reqLv: 20, reqStats: {},          allowChars: ['all'], base: { S: { min: 3, max: 6 }, H: { min: 3, max: 6 }, DEX: { min: 4, max: 7 }, AGI: { min: 4, max: 7 } } },
    { tplId: 's_knuckle_15',slot: 'sub',    subType: 'knuckle',   name: '暗黑指虎',   reqLv: 15, reqStats: { H: 15 },   allowChars: ['boris', 'maximin', 'sivelin'], base: { S: { min: 5, max: 9 }, H: { min: 5, max: 9 }, critRate: { min: 5, max: 10 } } },
    { tplId: 's_bracer_15', slot: 'sub',    subType: 'bracer',    name: '運動護腕',   reqLv: 15, reqStats: { AGI: 15 }, allowChars: ['mila', 'naya'], base: { AGI: { min: 6, max: 11 }, DEX: { min: 5, max: 9 } } },
  
    // 頭盔、手部、腳部、翅膀、文物（全角色通用）
    { tplId: 'h_helm_10',   slot: 'head',   subType: 'helm',      name: '青銅戰盔',   reqLv: 10, reqStats: { DEF: 8 },  allowChars: ['all'], base: { hp: { min: 25, max: 50 }, MR: { min: 3, max: 6 } } },
    { tplId: 'g_glove_10',  slot: 'gloves', subType: 'gloves',    name: '獵人皮手套', reqLv: 10, reqStats: { DEX: 10 }, allowChars: ['all'], base: { DEX: { min: 4, max: 7 }, S: { min: 2, max: 4 }, H: { min: 2, max: 4 } } },
    { tplId: 'sh_boot_10',  slot: 'shoes',  subType: 'shoes',     name: '疾風長靴',   reqLv: 10, reqStats: { AGI: 10 }, allowChars: ['all'], base: { AGI: { min: 5, max: 9 }, spd: { min: 10, max: 18 } } },
    { tplId: 'b_wing_20',   slot: 'back',   subType: 'wing',      name: '惡魔之翼',   reqLv: 20, reqStats: {},          allowChars: ['all'], base: { S: { min: 4, max: 8 }, H: { min: 4, max: 8 }, I: { min: 4, max: 8 }, AGI: { min: 4, max: 8 } } },
    { tplId: 'r_relic_15',  slot: 'relic',  subType: 'relic',     name: '古文明懷錶', reqLv: 15, reqStats: {},          allowChars: ['all'], base: { MR: { min: 4, max: 8 }, critDmg: { min: 12, max: 22 } } }
  ];
  
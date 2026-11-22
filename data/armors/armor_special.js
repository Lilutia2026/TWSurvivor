// 特殊面具與一般背部飾品資料庫（面具 relic / 一般背部 back；LV.3 ～ LV.190）
const ARMOR_SPECIAL_ITEMS = [
  // === 面具／頭飾／聖物（slot: 'relic'，全職業通用） ===
  { tplId: 'r_mask_4',      slot: 'relic', equipTag: 'all', name: '防菌口罩',   reqLv: 4,  reqStats: {}, DEF: 1,                      obtain: 'drop' },
  { tplId: 'r_cat_w_8',     slot: 'relic', equipTag: 'all', name: '貓鬍鬚',     reqLv: 8,  reqStats: {}, DEF: 2, MR: 1, I: 2,           obtain: 'drop' },
  { tplId: 'r_rednose_8',   slot: 'relic', equipTag: 'all', name: '紅色鼻子',   reqLv: 8,  reqStats: {}, S: 1, H: 1,                  obtain: 'drop' },
  { tplId: 'r_ghost_8',     slot: 'relic', equipTag: 'all', name: '鬼魅面具',   reqLv: 8,  reqStats: {}, S: 1, H: 1, DEF: 1,          obtain: 'drop' },
  { tplId: 'r_earmuff_8',   slot: 'relic', equipTag: 'all', name: '耳罩',       reqLv: 8,  reqStats: {}, H: 1, DEF: 4,                  obtain: 'drop' },
  { tplId: 'r_scarf_12',    slot: 'relic', equipTag: 'all', name: '圍巾',       reqLv: 12, reqStats: {}, DEF: 1, MR: 1,                 obtain: 'drop' },
  { tplId: 'r_fox_15',      slot: 'relic', equipTag: 'all', name: '狐狸面具',   reqLv: 15, reqStats: {}, S: 3, DEF: 1,                  obtain: 'drop' },
  { tplId: 'r_wolf_15',     slot: 'relic', equipTag: 'all', name: '狼面具',     reqLv: 15, reqStats: {}, H: 3, DEF: 1,                  obtain: 'drop' },
  { tplId: 'r_cat_15',      slot: 'relic', equipTag: 'all', name: '貓面具',     reqLv: 15, reqStats: {}, H: 2, I: 2,                    obtain: 'drop' },
  { tplId: 'r_angel_ear_18',slot: 'relic', equipTag: 'all', name: '天使耳環',   reqLv: 18, reqStats: {}, S: 1, H: 1, I: 1, DEF: 1, MR: 1, obtain: 'drop' },
  { tplId: 'r_glasses_20',  slot: 'relic', equipTag: 'all', name: '轉轉眼鏡',   reqLv: 20, reqStats: {}, I: 2, MR: 1,                   obtain: 'drop' },
  { tplId: 'r_eyepatch_22', slot: 'relic', equipTag: 'all', name: '獨眼龍眼罩', reqLv: 22, reqStats: {}, DEF: 1, MR: 1,                 obtain: 'drop' },
{ tplId: 'r_zorro_25',    slot: 'relic', equipTag: 'all', name: '佐羅假面',     reqLv: 25,  reqStats: {}, S: 1, H: 1, I: 1,               obtain: 'drop' },
{ tplId: 'r_bat_28',      slot: 'relic', equipTag: 'all', name: '蝙蝠面罩',     reqLv: 28,  reqStats: {}, S: 2, H: 2,                     obtain: 'drop' },
{ tplId: 'r_mp3_30',      slot: 'relic', equipTag: 'all', name: 'MP3耳機',      reqLv: 30,  reqStats: {}, MR: 3, I: 2,                    obtain: 'drop' },
{ tplId: 'r_star_35',     slot: 'relic', equipTag: 'all', name: '星沙耳環',     reqLv: 35,  reqStats: {}, I: 3,                           obtain: 'drop' },
{ tplId: 'r_hairpin_35',  slot: 'relic', equipTag: 'all', name: '古代髮簪',     reqLv: 35,  reqStats: {}, S: 3,                           obtain: 'drop' },
{ tplId: 'r_wingear_42',  slot: 'relic', equipTag: 'all', name: '羽翼耳套',     reqLv: 42,  reqStats: {}, H: 3, I: 2,                     obtain: 'drop' },
{ tplId: 'r_phantom_55',  slot: 'relic', equipTag: 'all', name: '怪俠面罩',     reqLv: 55,  reqStats: {}, S: 3, H: 3, DEF: 1,             obtain: 'drop' },
{ tplId: 'r_cyclops_87',  slot: 'relic', equipTag: 'all', name: '獨眼精靈假面', reqLv: 87,  reqStats: {}, S: 1, H: 1, MR: 8, I: 2,        obtain: 'drop' },
{ tplId: 'r_valhalla_135',slot: 'relic', equipTag: 'all', name: '巴爾哈拉假面', reqLv: 135, reqStats: {}, S: 5, H: 5, I: 5, DEF: 4, MR: 4,  obtain: 'craft', craftRecipe: null },
{ tplId: 'r_holy_190',    slot: 'relic', equipTag: 'all', name: '真・神聖假面', reqLv: 190, reqStats: {}, S: 8, H: 8, I: 8, DEF: 7, MR: 7,  obtain: 'craft', craftRecipe: null },

// === 一般背部飾品（slot: 'back'；非翅膀，全數開放掉落 obtain: 'drop'） ===
{ tplId: 'b_rabbit_3',  slot: 'back', equipTag: 'all', name: '兔子尾巴', reqLv: 3,   reqStats: {}, DEF: 1,              obtain: 'drop' },
{ tplId: 'b_pig_4',     slot: 'back', equipTag: 'all', name: '豬尾巴',   reqLv: 4,   reqStats: {}, DEF: 1, MR: 1,       obtain: 'drop' },
{ tplId: 'b_bag_8',     slot: 'back', equipTag: 'all', name: '輔助背包', reqLv: 8,   reqStats: {}, DEF: 4, MR: 1,       obtain: 'drop' },
{ tplId: 'b_xmas_35',   slot: 'back', equipTag: 'all', name: '聖誕背包', reqLv: 35,  reqStats: {}, DEF: 4, MR: 2,       obtain: 'drop' },
{ tplId: 'b_pouch_39',  slot: 'back', equipTag: 'all', name: '包囊',     reqLv: 39,  reqStats: {}, DEF: 4, MR: 1, I: 1, obtain: 'drop' },
{ tplId: 'b_seal_80',   slot: 'back', equipTag: 'all', name: '封印之劍', reqLv: 80,  reqStats: {}, S: 1, H: 1, I: 1,    obtain: 'drop' },
{ tplId: 'b_wingbag_101',slot: 'back',equipTag: 'all', name: '翅膀背包', reqLv: 101, reqStats: {}, DEF: 8, MR: 5,       obtain: 'drop' }
];

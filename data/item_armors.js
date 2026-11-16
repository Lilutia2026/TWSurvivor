// 《天翼之鍊》原作 7 部位防具與飾品資料庫（LV.1 ～ LV.62 畢業里程碑）
const ARMOR_TEMPLATES = [
  // === 副手（盾牌 / 指虎 / 護腕 / 手鐲） ===
  { tplId: 'sub_sh_1',  slot: 'sub', name: '木製圓盾',       reqLv: 1,  reqStats: {},              allowChars: ['all'], DEF: 2, hp: 10 },
  { tplId: 'sub_sh_12', slot: 'sub', name: '銅製圓盾',       reqLv: 12, reqStats: {},              allowChars: ['all'], DEF: 4, MR: 1, hp: 20 },
  { tplId: 'sub_sh_20', slot: 'sub', name: '鋼鐵圓盾',       reqLv: 20, reqStats: {},              allowChars: ['all'], DEF: 6, MR: 2, dmgReduce: 2 },
  { tplId: 'sub_sh_28', slot: 'sub', name: '龍鱗圓盾',       reqLv: 28, reqStats: {},              allowChars: ['all'], DEF: 10, MR: 3, dmgReduce: 3 },
  { tplId: 'sub_sh_35', slot: 'sub', name: '騎士之盾',       reqLv: 35, reqStats: { DEF: 5 },      allowChars: ['all'], DEF: 16, MR: 4, dmgReduce: 4 },
  { tplId: 'sub_sh_42', slot: 'sub', name: '紋章盾',         reqLv: 42, reqStats: { DEF: 5, MR: 5 }, allowChars: ['all'], DEF: 19, MR: 8, dmgReduce: 5 },
  { tplId: 'sub_sh_52', slot: 'sub', name: '普雷斯特之盾',   reqLv: 52, reqStats: { DEF: 7 },      allowChars: ['all'], DEF: 23, MR: 12, dmgReduce: 6 },
  { tplId: 'sub_sh_62', slot: 'sub', name: '🛡️ 凡泰克之盾', reqLv: 62, reqStats: { DEF: 10 },     allowChars: ['all'], DEF: 28, MR: 16, dmgReduce: 8, hp: 60 },
  { tplId: 'sub_kn_24', slot: 'sub', name: '浴血指虎',       reqLv: 24, reqStats: {},              allowChars: ['all'], S: 3, H: 3, critRate: 2 },
  { tplId: 'sub_kn_42', slot: 'sub', name: '傳說指虎',       reqLv: 42, reqStats: {},              allowChars: ['all'], S: 5, H: 5, critRate: 4 },
  { tplId: 'sub_kn_62', slot: 'sub', name: '🥊 冥符指虎',   reqLv: 62, reqStats: {},              allowChars: ['all'], S: 7, H: 7, critRate: 5, critDmg: 15 },
  { tplId: 'sub_br_35', slot: 'sub', name: '疾風手鏈',       reqLv: 35, reqStats: {},              allowChars: ['all'], AGI: 4, spd: 12 },
  { tplId: 'sub_br_62', slot: 'sub', name: '🌿 古符護腕',   reqLv: 62, reqStats: {},              allowChars: ['all'], AGI: 8, DEX: 4, spd: 20 },
  { tplId: 'sub_ba_35', slot: 'sub', name: '魔法師手鐲',     reqLv: 35, reqStats: {},              allowChars: ['all'], I: 7, MR: 6 },
  { tplId: 'sub_ba_62', slot: 'sub', name: '🔮 公主手鐲',   reqLv: 62, reqStats: {},              allowChars: ['all'], I: 10, MR: 9, critDmg: 12 },

  // === 身體鎧甲（輕鎧 / 重鎧 / 紅焰＆冰寒套裝鎧甲） ===
  { tplId: 'arm_4',     slot: 'armor', name: '光耀布衣',     reqLv: 4,  reqStats: {},          allowChars: ['all'], DEF: 3, hp: 15 },
  { tplId: 'arm_12',    slot: 'armor', name: '光耀緊身衣',   reqLv: 12, reqStats: { DEF: 3 },  allowChars: ['all'], DEF: 8, MR: 3, hp: 30 },
  { tplId: 'arm_20',    slot: 'armor', name: '光耀金屬鎧甲', reqLv: 20, reqStats: { DEF: 4 },  allowChars: ['all'], DEF: 16, MR: 5, hp: 50 },
  { tplId: 'arm_28',    slot: 'armor', name: '光耀魔晶甲',   reqLv: 28, reqStats: { DEF: 5 },  allowChars: ['all'], DEF: 22, MR: 6, AGI: 2, hp: 70 },
  { tplId: 'arm_35',    slot: 'armor', name: '天鷹戰甲',     reqLv: 35, reqStats: { DEF: 10 }, allowChars: ['all'], DEF: 25, MR: 12, AGI: 3, hp: 95 },
  { tplId: 'arm_42',    slot: 'armor', name: '聖石鎧甲',     reqLv: 42, reqStats: { DEF: 14 }, allowChars: ['all'], DEF: 28, MR: 16, AGI: 4, hp: 120 },
  { tplId: 'arm_52',    slot: 'armor', name: '聖騎士之鎧',   reqLv: 52, reqStats: { DEF: 18 }, allowChars: ['all'], DEF: 32, MR: 20, AGI: 5, hp: 150 },
  { tplId: 'arm_61_f',  slot: 'armor', name: '🔥 紅焰鎧甲',  reqLv: 61, reqStats: { DEF: 20 }, allowChars: ['all'], DEF: 40, MR: 28, critRate: 5, hp: 200, dmgReduce: 6 },
  { tplId: 'arm_61_i',  slot: 'armor', name: '❄️ 冰寒鎧甲',  reqLv: 61, reqStats: { DEF: 20 }, allowChars: ['all'], DEF: 40, MR: 32, critRate: 5, hp: 200, dmgReduce: 6 },
  { tplId: 'arm_62',    slot: 'armor', name: '⚡ 極速戰甲',  reqLv: 62, reqStats: { DEF: 22 }, allowChars: ['all'], DEF: 36, MR: 24, AGI: 8, spd: 18, hp: 180 },
  // === 頭部（頭盔 / 帽子） ===
  { tplId: 'hd_8',      slot: 'head', name: '爆炸頭',        reqLv: 8,  reqStats: {}, allowChars: ['all'], DEF: 4, MR: 4, DEX: 2 },
  { tplId: 'hd_18',     slot: 'head', name: '礦工帽',        reqLv: 18, reqStats: {}, allowChars: ['all'], DEF: 8, AGI: 2 },
  { tplId: 'hd_24',     slot: 'head', name: '牛魔王角盔',    reqLv: 24, reqStats: {}, allowChars: ['all'], DEF: 9, H: 3 },
  { tplId: 'hd_35',     slot: 'head', name: '金角頭盔',      reqLv: 35, reqStats: {}, allowChars: ['all'], DEF: 14, MR: 11 },
  { tplId: 'hd_55',     slot: 'head', name: '竹編帽',        reqLv: 55, reqStats: {}, allowChars: ['all'], DEF: 14, MR: 14, DEX: 3, critRate: 2 },
  { tplId: 'hd_61_f',   slot: 'head', name: '🔥 紅焰頭盔',   reqLv: 61, reqStats: {}, allowChars: ['all'], DEF: 18, MR: 14, S: 4, H: 4, critRate: 4 },
  { tplId: 'hd_61_i',   slot: 'head', name: '❄️ 冰寒頭盔',   reqLv: 61, reqStats: {}, allowChars: ['all'], DEF: 18, MR: 16, S: 4, H: 4, critRate: 4 },

  // === 手部（手套 / 手環） ===
  { tplId: 'gl_4',      slot: 'gloves', name: '棉製手套',    reqLv: 4,  reqStats: {}, allowChars: ['all'], DEX: 1 },
  { tplId: 'gl_12',     slot: 'gloves', name: '戰爭手套',    reqLv: 12, reqStats: {}, allowChars: ['all'], DEF: 2, DEX: 2, critRate: 1 },
  { tplId: 'gl_24',     slot: 'gloves', name: '能量手套',    reqLv: 24, reqStats: {}, allowChars: ['all'], S: 2, H: 2, DEF: 3, critRate: 2 },
  { tplId: 'gl_45',     slot: 'gloves', name: '明庫護手',    reqLv: 45, reqStats: {}, allowChars: ['all'], S: 3, H: 3, DEX: 4, critRate: 3 },
  { tplId: 'gl_52',     slot: 'gloves', name: '無痕手套',    reqLv: 52, reqStats: {}, allowChars: ['all'], S: 4, H: 4, I: 3, DEX: 5 },
  { tplId: 'gl_61_f',   slot: 'gloves', name: '🔥 紅焰手鐲', reqLv: 61, reqStats: {}, allowChars: ['all'], S: 5, H: 5, MR: 5, DEX: 6, critRate: 5 },
  { tplId: 'gl_61_i',   slot: 'gloves', name: '❄️ 冰寒手鐲', reqLv: 61, reqStats: {}, allowChars: ['all'], S: 5, H: 5, MR: 6, DEX: 6, critRate: 5 },

  // === 腳部（鞋子 / 戰靴） ===
  { tplId: 'sh_4',      slot: 'shoes', name: '涼鞋',         reqLv: 4,  reqStats: {}, allowChars: ['all'], spd: 8 },
  { tplId: 'sh_20',     slot: 'shoes', name: '敏捷之鞋',     reqLv: 20, reqStats: {}, allowChars: ['all'], AGI: 3, spd: 16 },
  { tplId: 'sh_28',     slot: 'shoes', name: '風之靴',       reqLv: 28, reqStats: {}, allowChars: ['all'], DEF: 3, AGI: 4, spd: 24 },
  { tplId: 'sh_45',     slot: 'shoes', name: '明庫之靴',     reqLv: 45, reqStats: {}, allowChars: ['all'], DEF: 4, MR: 4, AGI: 6, spd: 32, critRate: 2 },
  { tplId: 'sh_61_f',   slot: 'shoes', name: '🔥 紅焰之靴',  reqLv: 61, reqStats: {}, allowChars: ['all'], AGI: 8, DEX: 5, spd: 42, critRate: 4 },
  { tplId: 'sh_61_i',   slot: 'shoes', name: '❄️ 冰寒之靴',  reqLv: 61, reqStats: {}, allowChars: ['all'], AGI: 8, DEX: 5, spd: 42, critRate: 4 },

  // === 背部（書包 / 翅膀） ===
  { tplId: 'bk_15',     slot: 'back', name: '幼兒園書包',    reqLv: 15, reqStats: {}, allowChars: ['all'], DEF: 6, MR: 3, hp: 25 },
  { tplId: 'bk_30_a',   slot: 'back', name: '天使翅膀(S)',   reqLv: 30, reqStats: {}, allowChars: ['all'], DEF: 5, MR: 5, AGI: 3, spd: 12 },
  { tplId: 'bk_30_d',   slot: 'back', name: '惡魔翅膀(S)',   reqLv: 30, reqStats: {}, allowChars: ['all'], S: 4, H: 4, I: 3, critRate: 3 },
  { tplId: 'bk_52',     slot: 'back', name: '金銀角的葫蘆',  reqLv: 52, reqStats: {}, allowChars: ['all'], S: 5, H: 5, DEF: 8, hp: 80 },
  { tplId: 'bk_61_f',   slot: 'back', name: '🔥 紅焰翅膀',   reqLv: 61, reqStats: {}, allowChars: ['all'], S: 6, H: 6, I: 5, AGI: 6, spd: 20, critDmg: 18 },
  { tplId: 'bk_61_i',   slot: 'back', name: '❄️ 冰寒翅膀',   reqLv: 61, reqStats: {}, allowChars: ['all'], S: 6, H: 6, I: 6, MR: 6, AGI: 6, critDmg: 18 },

  // === 聖物（面具 / 耳環 / 頭飾） ===
  { tplId: 'rel_4',     slot: 'relic', name: '防菌口罩',     reqLv: 4,  reqStats: {}, allowChars: ['all'], DEX: 1, hp: 10 },
  { tplId: 'rel_18',    slot: 'relic', name: '天使耳環',     reqLv: 18, reqStats: {}, allowChars: ['all'], S: 2, H: 2, I: 2, DEF: 2, MR: 2, critRate: 2 },
  { tplId: 'rel_28',    slot: 'relic', name: '蝙蝠面罩',     reqLv: 28, reqStats: {}, allowChars: ['all'], DEX: 5, critRate: 3 },
  { tplId: 'rel_35',    slot: 'relic', name: '妖精之耳',     reqLv: 35, reqStats: {}, allowChars: ['all'], S: 3, I: 4, AGI: 5, critDmg: 12 },
  { tplId: 'rel_52',    slot: 'relic', name: '怪俠面罩',     reqLv: 52, reqStats: {}, allowChars: ['all'], S: 6, H: 6, DEF: 4, AGI: 4, critRate: 4, critDmg: 15 }
];

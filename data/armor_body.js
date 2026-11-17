// 身體鎧甲資料庫（白字僅保留原版七大素質：S / H / I / DEF / MR / DEX / AGI，其餘詞條全數捨棄）
const ARMOR_BODY_ITEMS = [
    // === 輕鎧＆套裝鎧甲（equipTag: 'all'） ===
    { tplId: 'arm_4',    slot: 'armor', equipTag: 'all', name: '光耀布衣',     reqLv: 4,  reqStats: {},          DEF: 3 },
    { tplId: 'arm_12',   slot: 'armor', equipTag: 'all', name: '光耀緊身衣',   reqLv: 12, reqStats: { DEF: 3 },  DEF: 8, MR: 3 },
    { tplId: 'arm_20',   slot: 'armor', equipTag: 'all', name: '光耀金屬鎧甲', reqLv: 20, reqStats: { DEF: 4 },  DEF: 16, MR: 5 },
    { tplId: 'arm_28',   slot: 'armor', equipTag: 'all', name: '光耀魔晶甲',   reqLv: 28, reqStats: { DEF: 5 },  DEF: 22, MR: 6, AGI: 2 },
    { tplId: 'arm_35',   slot: 'armor', equipTag: 'all', name: '天鷹戰甲',     reqLv: 35, reqStats: { DEF: 10 }, DEF: 25, MR: 12, AGI: 3 },
    { tplId: 'arm_42',   slot: 'armor', equipTag: 'all', name: '聖石鎧甲',     reqLv: 42, reqStats: { DEF: 14 }, DEF: 28, MR: 16, AGI: 4 },
    { tplId: 'arm_52',   slot: 'armor', equipTag: 'all', name: '聖騎士之鎧',   reqLv: 52, reqStats: { DEF: 18 }, DEF: 32, MR: 20, AGI: 5 },
    { tplId: 'arm_61_f', slot: 'armor', equipTag: 'all', name: '紅焰鎧甲',     reqLv: 61, reqStats: { DEF: 20 }, DEF: 40, MR: 28 },
    { tplId: 'arm_61_i', slot: 'armor', equipTag: 'all', name: '冰寒鎧甲',     reqLv: 61, reqStats: { DEF: 20 }, DEF: 40, MR: 32 },
    { tplId: 'arm_62',   slot: 'armor', equipTag: 'all', name: '極速戰甲',     reqLv: 62, reqStats: { DEF: 22 }, DEF: 36, MR: 24, AGI: 8 },
  
    // === 重鎧（equipTag: 'heavy'） ===
    { tplId: 'hv_16',    slot: 'armor', equipTag: 'heavy', name: '魔晶甲',     reqLv: 16, reqStats: { DEF: 4 },  DEF: 15 },
    { tplId: 'hv_28',    slot: 'armor', equipTag: 'heavy', name: '飛雲甲',     reqLv: 28, reqStats: { DEF: 7 },  DEF: 26 },
    { tplId: 'hv_42',    slot: 'armor', equipTag: 'heavy', name: '金屬環甲',   reqLv: 42, reqStats: { DEF: 9 },  DEF: 32 },
    { tplId: 'hv_62',    slot: 'armor', equipTag: 'heavy', name: '鏈鎖鎧甲',   reqLv: 62, reqStats: { DEF: 20 }, DEF: 42 },
  
    // === 法袍（equipTag: 'robe'） ===
    { tplId: 'rb_16',    slot: 'armor', equipTag: 'robe', name: '學徒長袍',    reqLv: 16, reqStats: { MR: 4 },   DEF: 5, MR: 8, I: 4 },
    { tplId: 'rb_28',    slot: 'armor', equipTag: 'robe', name: '蜥皮長袍',    reqLv: 28, reqStats: { MR: 7 },   DEF: 8, MR: 12, I: 8 },
    { tplId: 'rb_42',    slot: 'armor', equipTag: 'robe', name: '魔導袍',      reqLv: 42, reqStats: { MR: 9 },   DEF: 12, MR: 15, I: 14 },
    { tplId: 'rb_62',    slot: 'armor', equipTag: 'robe', name: '魔斗之袍',    reqLv: 62, reqStats: { MR: 18 },  DEF: 18, MR: 22, I: 22 },
  
    // === 忍服（equipTag: 'ninja'） ===
    { tplId: 'nj_28',    slot: 'armor', equipTag: 'ninja', name: '風之禮讚',   reqLv: 28, reqStats: { DEX: 14 }, DEF: 19, AGI: 7 },
    { tplId: 'nj_62',    slot: 'armor', equipTag: 'ninja', name: '天忍之服',   reqLv: 62, reqStats: { DEX: 22 }, DEF: 28, AGI: 13 }
  ];
  
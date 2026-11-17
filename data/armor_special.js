// 背部翅膀（任務／合成專屬）、面具與未來活動限定裝備資料庫（白字僅保留七大素質）
const ARMOR_SPECIAL_ITEMS = [
    // === 背部翅膀（back，不進一般關卡掉落，LV.15 任務取得並透過合成升級） ===
    { tplId: 'bk_15',   slot: 'back', equipTag: 'all', name: '幼兒園書包',   reqLv: 15, reqStats: {}, DEF: 6, MR: 3 },
    { tplId: 'bk_30_a', slot: 'back', equipTag: 'all', name: '天使翅膀(S)',  reqLv: 30, reqStats: {}, DEF: 4, MR: 4, AGI: 3 },
    { tplId: 'bk_30_d', slot: 'back', equipTag: 'all', name: '惡魔翅膀(S)',  reqLv: 30, reqStats: {}, S: 4, H: 4, I: 3, DEX: 3 },
    { tplId: 'bk_52',   slot: 'back', equipTag: 'all', name: '金銀角的葫蘆', reqLv: 52, reqStats: {}, S: 5, H: 5, DEF: 8 },
    { tplId: 'bk_61_f', slot: 'back', equipTag: 'all', name: '紅焰翅膀',     reqLv: 61, reqStats: {}, S: 6, H: 6, I: 6, DEF: 6, MR: 6, AGI: 6, DEX: 5 },
    { tplId: 'bk_61_i', slot: 'back', equipTag: 'all', name: '冰寒翅膀',     reqLv: 61, reqStats: {}, S: 6, H: 6, I: 6, DEF: 6, MR: 7, AGI: 6, DEX: 5 },
  
    // === 面具（relic） ===
    { tplId: 'rel_4',   slot: 'relic', equipTag: 'all', name: '防菌口罩',    reqLv: 4,  reqStats: {}, DEX: 1 },
    { tplId: 'rel_8',   slot: 'relic', equipTag: 'all', name: '貓鬍鬚',      reqLv: 8,  reqStats: {}, I: 3, DEF: 3, MR: 2 },
    { tplId: 'rel_18',  slot: 'relic', equipTag: 'all', name: '天使耳環',    reqLv: 18, reqStats: {}, S: 3, H: 3, I: 3, DEF: 3, MR: 3, DEX: 3 },
    { tplId: 'rel_28',  slot: 'relic', equipTag: 'all', name: '蝙蝠面罩',    reqLv: 28, reqStats: {}, DEX: 5 },
    { tplId: 'rel_35',  slot: 'relic', equipTag: 'all', name: '妖精之耳',    reqLv: 35, reqStats: {}, I: 5, DEF: 3, AGI: 5 },
    { tplId: 'rel_55',  slot: 'relic', equipTag: 'all', name: '怪俠面罩',    reqLv: 55, reqStats: {}, S: 6, H: 6, DEF: 4, AGI: 4, DEX: 4 }
  ];
  
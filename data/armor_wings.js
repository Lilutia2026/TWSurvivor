// 純粹翅膀專屬資料庫（slot: 'back', isWing: true；絕不進一般關卡掉落池，走任務與合成進化線）
const ARMOR_WINGS_ITEMS = [
    { tplId: 'w_wing_lover_15',     slot: 'back', equipTag: 'all', isWing: true, obtain: 'wing_quest', name: '戀人翅膀',           reqLv: 15,  reqStats: {}, DEF: 1,  MR: 1 },
    { tplId: 'w_wing_devil_30',     slot: 'back', equipTag: 'all', isWing: true, obtain: 'wing_quest', name: '惡魔翅膀(S)',        reqLv: 30,  reqStats: {}, S: 2,    H: 2,  I: 1 },
    { tplId: 'w_wing_angel_30',     slot: 'back', equipTag: 'all', isWing: true, obtain: 'wing_quest', name: '天使翅膀(S)',        reqLv: 30,  reqStats: {}, DEF: 2,  MR: 2 },
    { tplId: 'w_wing_dragonfly_60', slot: 'back', equipTag: 'all', isWing: true, obtain: 'wing_quest', name: '蜻蜓翅膀',           reqLv: 60,  reqStats: {}, DEF: 5,  MR: 3 },
    { tplId: 'w_wing_butterfly_60', slot: 'back', equipTag: 'all', isWing: true, obtain: 'wing_quest', name: '蝴蝶翅膀',           reqLv: 60,  reqStats: {}, DEF: 3,  MR: 5 },
    { tplId: 'w_wing_inkbird_75',   slot: 'back', equipTag: 'all', isWing: true, obtain: 'wing_quest', name: '墨鳥之翼',           reqLv: 75,  reqStats: {}, S: 3,    H: 2,  DEF: 4, MR: 1, I: 1 },
    { tplId: 'w_wing_phoenix_75',   slot: 'back', equipTag: 'all', isWing: true, obtain: 'wing_quest', name: '鳳凰之翼',           reqLv: 75,  reqStats: {}, S: 1,    H: 1,  DEF: 3, I: 5 },
    { tplId: 'w_wing_platinum_100', slot: 'back', equipTag: 'all', isWing: true, obtain: 'craft',      name: '白金翅膀',           reqLv: 100, reqStats: {}, S: 7,    H: 7,  DEF: 15, MR: 6, I: 7, craftRecipe: null },
    { tplId: 'w_wing_keltia_100',   slot: 'back', equipTag: 'all', isWing: true, obtain: 'craft',      name: '凱爾特亞翅膀',       reqLv: 100, reqStats: {}, S: 7,    H: 7,  DEF: 15, MR: 6, I: 7, craftRecipe: null },
    { tplId: 'w_wing_holy_190',     slot: 'back', equipTag: 'all', isWing: true, obtain: 'craft',      name: '真・神聖熾天使之翼', reqLv: 190, reqStats: {}, S: 12,   H: 12, DEF: 22, MR: 14, I: 12, craftRecipe: null }
  ];
  
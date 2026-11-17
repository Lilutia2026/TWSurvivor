// 副手／手飾資料庫（白字僅保留原版七大素質：S / H / I / DEF / MR / DEX / AGI，其餘戰鬥詞條全數捨棄）
const ARMOR_SUB_ITEMS = [
    // === 盾牌（equipTag: 'shield'） ===
    { tplId: 'sub_sh_1',  slot: 'sub', equipTag: 'shield', name: '木製圓盾',     reqLv: 1,  reqStats: {},              DEF: 2 },
    { tplId: 'sub_sh_12', slot: 'sub', equipTag: 'shield', name: '銅製圓盾',     reqLv: 12, reqStats: {},              DEF: 4, MR: 1 },
    { tplId: 'sub_sh_20', slot: 'sub', equipTag: 'shield', name: '鋼鐵圓盾',     reqLv: 20, reqStats: {},              DEF: 6, MR: 2 },
    { tplId: 'sub_sh_28', slot: 'sub', equipTag: 'shield', name: '龍鱗圓盾',     reqLv: 28, reqStats: {},              DEF: 10, MR: 3 },
    { tplId: 'sub_sh_35', slot: 'sub', equipTag: 'shield', name: '騎士之盾',     reqLv: 35, reqStats: { DEF: 5 },      DEF: 16, MR: 4 },
    { tplId: 'sub_sh_42', slot: 'sub', equipTag: 'shield', name: '紋章盾',       reqLv: 42, reqStats: { DEF: 5, MR: 5 }, DEF: 19, MR: 8 },
    { tplId: 'sub_sh_52', slot: 'sub', equipTag: 'shield', name: '普雷斯特之盾', reqLv: 52, reqStats: { DEF: 7 },      DEF: 23, MR: 12 },
    { tplId: 'sub_sh_62', slot: 'sub', equipTag: 'shield', name: '凡泰克之盾',   reqLv: 62, reqStats: { DEF: 10 },     DEF: 28, MR: 16 },
  
    // === 指虎（equipTag: 'knuckle'） ===
    { tplId: 'sub_kn_24', slot: 'sub', equipTag: 'knuckle', name: '浴血指虎',    reqLv: 24, reqStats: {}, S: 3, H: 3 },
    { tplId: 'sub_kn_42', slot: 'sub', equipTag: 'knuckle', name: '傳說指虎',    reqLv: 42, reqStats: {}, S: 5, H: 5 },
    { tplId: 'sub_kn_62', slot: 'sub', equipTag: 'knuckle', name: '冥符指虎',    reqLv: 62, reqStats: {}, S: 7, H: 7 },
  
    // === 通用護腕（equipTag: 'all'） ===
    { tplId: 'sub_br_35', slot: 'sub', equipTag: 'all', name: '疾風手鏈',        reqLv: 35, reqStats: {}, AGI: 4 },
    { tplId: 'sub_br_62', slot: 'sub', equipTag: 'all', name: '古符護腕',        reqLv: 62, reqStats: {}, AGI: 8, DEX: 4 },
  
    // === 魔法手鐲（equipTag: 'crystal'） ===
    { tplId: 'sub_ba_35', slot: 'sub', equipTag: 'crystal', name: '魔法師手鐲',  reqLv: 35, reqStats: {}, I: 7, MR: 6 },
    { tplId: 'sub_ba_62', slot: 'sub', equipTag: 'crystal', name: '公主手鐲',    reqLv: 62, reqStats: {}, I: 10, MR: 9 }
  ];
  
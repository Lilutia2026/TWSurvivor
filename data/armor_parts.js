// 頭部、手部、腳部防具資料庫（白字僅保留原版七大素質：S / H / I / DEF / MR / DEX / AGI，其餘詞條全數捨棄）
const ARMOR_PARTS_ITEMS = [
    // === 頭部（head） ===
    { tplId: 'hd_8',    slot: 'head', equipTag: 'all', name: '爆炸頭',     reqLv: 8,  reqStats: {}, DEF: 3, MR: 3, DEX: 2 },
    { tplId: 'hd_18',   slot: 'head', equipTag: 'all', name: '礦工帽',     reqLv: 18, reqStats: {}, DEF: 8, MR: 2 },
    { tplId: 'hd_24',   slot: 'head', equipTag: 'all', name: '牛魔王角盔', reqLv: 24, reqStats: {}, DEF: 10, MR: 4, H: 3 },
    { tplId: 'hd_28',   slot: 'head', equipTag: 'all', name: '沙漠頭巾',   reqLv: 28, reqStats: {}, DEF: 12, AGI: 3 },
    { tplId: 'hd_35',   slot: 'head', equipTag: 'all', name: '金角頭盔',   reqLv: 35, reqStats: {}, DEF: 15, MR: 12 },
    { tplId: 'hd_55',   slot: 'head', equipTag: 'all', name: '竹編帽',     reqLv: 55, reqStats: {}, DEF: 16, MR: 16, DEX: 4 },
    { tplId: 'hd_61_f', slot: 'head', equipTag: 'all', name: '紅焰頭盔',   reqLv: 61, reqStats: {}, S: 4, H: 4, I: 4, DEF: 18, MR: 14 },
    { tplId: 'hd_61_i', slot: 'head', equipTag: 'all', name: '冰寒頭盔',   reqLv: 61, reqStats: {}, S: 4, H: 4, I: 4, DEF: 18, MR: 16 },
  
    // === 手部（gloves） ===
    { tplId: 'gl_4',    slot: 'gloves', equipTag: 'all', name: '棉製手套', reqLv: 4,  reqStats: {}, DEX: 2 },
    { tplId: 'gl_12',   slot: 'gloves', equipTag: 'all', name: '戰爭手套', reqLv: 12, reqStats: {}, DEF: 2, DEX: 3 },
    { tplId: 'gl_24',   slot: 'gloves', equipTag: 'all', name: '能量手套', reqLv: 24, reqStats: {}, S: 2, H: 2, DEF: 3, DEX: 3 },
    { tplId: 'gl_45',   slot: 'gloves', equipTag: 'all', name: '明庫護手', reqLv: 45, reqStats: {}, S: 3, H: 3, DEF: 3, DEX: 5 },
    { tplId: 'gl_52',   slot: 'gloves', equipTag: 'all', name: '無痕手套', reqLv: 52, reqStats: {}, S: 4, H: 4, I: 3, DEX: 6 },
    { tplId: 'gl_61_f', slot: 'gloves', equipTag: 'all', name: '紅焰手鐲', reqLv: 61, reqStats: {}, S: 5, H: 5, I: 6, MR: 6, DEX: 6 },
    { tplId: 'gl_61_i', slot: 'gloves', equipTag: 'all', name: '冰寒手鐲', reqLv: 61, reqStats: {}, S: 5, H: 5, I: 6, MR: 6, DEX: 6 },
  
    // === 腳部（shoes） ===
    { tplId: 'sh_4',    slot: 'shoes', equipTag: 'all', name: '涼鞋',      reqLv: 4,  reqStats: {}, AGI: 1 },
    { tplId: 'sh_12',   slot: 'shoes', equipTag: 'all', name: '木屐',      reqLv: 12, reqStats: {}, DEF: 2, AGI: 2 },
    { tplId: 'sh_20',   slot: 'shoes', equipTag: 'all', name: '敏捷之鞋',  reqLv: 20, reqStats: {}, AGI: 3 },
    { tplId: 'sh_28',   slot: 'shoes', equipTag: 'all', name: '風之靴',    reqLv: 28, reqStats: {}, DEF: 2, AGI: 4 },
    { tplId: 'sh_45',   slot: 'shoes', equipTag: 'all', name: '明庫之靴',  reqLv: 45, reqStats: {}, DEF: 4, MR: 4, AGI: 5 },
    { tplId: 'sh_61_f', slot: 'shoes', equipTag: 'all', name: '紅焰之靴',  reqLv: 61, reqStats: {}, AGI: 7, DEX: 6 },
    { tplId: 'sh_61_i', slot: 'shoes', equipTag: 'all', name: '冰寒之靴',  reqLv: 61, reqStats: {}, AGI: 7, DEX: 6 }
  ];
  
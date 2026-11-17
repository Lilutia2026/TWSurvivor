// 劍類武器資料庫（長劍 longsword / 彎刀 blade / 細劍 rapier；未來可擴充太刀 tachi / 巨劍 greatsword）
const WEAPON_SWORD_ITEMS = [
    // === 長劍（equipTag: 'longsword'，S + H 平衡型） ===
    { tplId: 'w_long_1',  slot: 'weapon', equipTag: 'longsword', name: '學徒長劍',   reqLv: 1,  reqStats: {},             startSkill: 'enbu',   S: 4,  H: 4 },
    { tplId: 'w_long_8',  slot: 'weapon', equipTag: 'longsword', name: '士兵之劍',   reqLv: 8,  reqStats: {},             startSkill: 'renga',  S: 10, H: 10 },
    { tplId: 'w_long_16', slot: 'weapon', equipTag: 'longsword', name: '銳利長劍',   reqLv: 16, reqStats: { S: 12, H: 12 }, startSkill: 'enbu',   S: 20, H: 20 },
    { tplId: 'w_long_28', slot: 'weapon', equipTag: 'longsword', name: '騎士長劍',   reqLv: 28, reqStats: { S: 24, H: 24 }, startSkill: 'aurora', S: 36, H: 36 },
    { tplId: 'w_long_42', slot: 'weapon', equipTag: 'longsword', name: '白金聖劍',   reqLv: 42, reqStats: { S: 38, H: 38 }, startSkill: 'enbu',   S: 56, H: 56 },
    { tplId: 'w_long_52', slot: 'weapon', equipTag: 'longsword', name: '名劍・紅晶', reqLv: 52, reqStats: { S: 48, H: 48 }, startSkill: 'renga',  S: 72, H: 72 },
    { tplId: 'w_long_62', slot: 'weapon', equipTag: 'longsword', name: '聖靈長劍',   reqLv: 62, reqStats: { S: 60, H: 60 }, startSkill: 'aurora', S: 92, H: 92 },
  
    // === 彎刀（equipTag: 'blade'，HACK 斬擊主導型） ===
    { tplId: 'w_bld_1',   slot: 'weapon', equipTag: 'blade',     name: '學徒彎刀',   reqLv: 1,  reqStats: {},             startSkill: 'enbu',   H: 7,  S: 2 },
    { tplId: 'w_bld_16',  slot: 'weapon', equipTag: 'blade',     name: '海賊彎刀',   reqLv: 16, reqStats: { H: 18 },        startSkill: 'enbu',   H: 28, S: 8 },
    { tplId: 'w_bld_35',  slot: 'weapon', equipTag: 'blade',     name: '月牙彎刀',   reqLv: 35, reqStats: { H: 40 },        startSkill: 'enbu',   H: 60, S: 16 },
    { tplId: 'w_bld_52',  slot: 'weapon', equipTag: 'blade',     name: '咒血劍',     reqLv: 52, reqStats: { H: 62 },        startSkill: 'enbu',   H: 92, S: 24 },
    { tplId: 'w_bld_62',  slot: 'weapon', equipTag: 'blade',     name: '聖靈彎刀',   reqLv: 62, reqStats: { H: 76 },        startSkill: 'enbu',   H: 118, S: 30 },
  
    // === 細劍（equipTag: 'rapier'，STAB 刺擊主導型） ===
    { tplId: 'w_rap_1',   slot: 'weapon', equipTag: 'rapier',    name: '學徒細劍',   reqLv: 1,  reqStats: {},             startSkill: 'renga',  S: 7,  H: 2 },
    { tplId: 'w_rap_16',  slot: 'weapon', equipTag: 'rapier',    name: '決鬥細劍',   reqLv: 16, reqStats: { S: 18 },        startSkill: 'renga',  S: 28, H: 8 },
    { tplId: 'w_rap_35',  slot: 'weapon', equipTag: 'rapier',    name: '流水劍',     reqLv: 35, reqStats: { S: 40 },        startSkill: 'aurora', S: 60, H: 16 },
    { tplId: 'w_rap_52',  slot: 'weapon', equipTag: 'rapier',    name: '白銀刺劍',   reqLv: 52, reqStats: { S: 62 },        startSkill: 'aurora', S: 92, H: 24 },
    { tplId: 'w_rap_62',  slot: 'weapon', equipTag: 'rapier',    name: '聖靈細劍',   reqLv: 62, reqStats: { S: 76 },        startSkill: 'aurora', S: 118, S: 30 }
  ];
  
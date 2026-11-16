// 初代主角武器資料庫（未來擴充至 LV.255 只需在此陣列繼續往下新增）
const ITEM_WEAPONS = [
    // 路西安（Lucian）專屬武器：長劍=圓月斬 / 彎刀=連犽斬 / 細劍=極光刺
    { tplId: 'w_long_1',    slot: 'weapon', subType: 'longsword', name: '學徒長劍',   reqLv: 1,  reqStats: {}, allowChars: ['lucien'], startSkill: 'enbu',   base: { H: { min: 3, max: 6 },   S: { min: 3, max: 6 } } },
    { tplId: 'w_long_20',   slot: 'weapon', subType: 'longsword', name: '騎士闊劍',   reqLv: 20, reqStats: { H: 22, S: 22 }, allowChars: ['lucien'], startSkill: 'enbu', base: { H: { min: 11, max: 18 }, S: { min: 11, max: 18 } } },
    { tplId: 'w_blade_15',  slot: 'weapon', subType: 'blade',     name: '精鋼彎刀',   reqLv: 15, reqStats: { H: 18 }, allowChars: ['lucien'], startSkill: 'renga',  base: { H: { min: 9, max: 16 },  S: { min: 2, max: 5 } } },
    { tplId: 'w_blade_30',  slot: 'weapon', subType: 'blade',     name: '克里撒彎刀', reqLv: 30, reqStats: { H: 45, DEF: 15 }, allowChars: ['lucien'], startSkill: 'renga', base: { H: { min: 20, max: 30 }, S: { min: 4, max: 8 } } },
    { tplId: 'w_rapier_15', slot: 'weapon', subType: 'rapier',    name: '銀光細劍',   reqLv: 15, reqStats: { S: 18 }, allowChars: ['lucien'], startSkill: 'aurora', base: { S: { min: 9, max: 16 },  H: { min: 2, max: 5 } } },
    { tplId: 'w_rapier_30', slot: 'weapon', subType: 'rapier',    name: '星辰細劍',   reqLv: 30, reqStats: { S: 45, DEX: 15 }, allowChars: ['lucien'], startSkill: 'aurora', base: { S: { min: 20, max: 30 }, H: { min: 4, max: 8 } } },
  
    // 初代其他主角武器（路西安打到可放進卡雷德擺攤市集高價賣出）
    { tplId: 'w_gsword_18', slot: 'weapon', subType: 'greatsword',name: '破曉巨劍',   reqLv: 18, reqStats: { H: 24 }, allowChars: ['boris'], startSkill: 'enbu', base: { H: { min: 14, max: 22 }, I: { min: 5, max: 10 } } },
    { tplId: 'w_staff_18',  slot: 'weapon', subType: 'staff',     name: '賢者法杖',   reqLv: 18, reqStats: { I: 24 }, allowChars: ['tichiel'], startSkill: 'firearrow', base: { I: { min: 15, max: 24 }, MR: { min: 8, max: 14 } } },
    { tplId: 'w_whip_18',   slot: 'weapon', subType: 'whip',      name: '烈焰長鞭',   reqLv: 18, reqStats: { H: 20, DEX: 15 }, allowChars: ['mila'], startSkill: 'renga', base: { H: { min: 12, max: 19 }, DEX: { min: 6, max: 11 } } }
  ];
  
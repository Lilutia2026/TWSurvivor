// 魔導武器資料庫（元素魔杖 wand / 法杖 staff / 釘錘 mace；未來可擴充雙槍 dual_pistol / 魔術杖 magic_staff / 拳套 gauntlet）
const WEAPON_MAGIC_ITEMS = [
    // === 元素魔杖（equipTag: 'wand'，鑑定隨機賦予火／冰／雷屬性詞條，INT 攻擊型） ===
    { tplId: 'w_wnd_f_1', slot: 'weapon', equipTag: 'wand', wandElem: 'fire',    name: '學徒魔杖',     reqLv: 1,  reqStats: {},        startSkill: 'fire1',    I: 11,  MR: 5 },
    { tplId: 'w_wnd_i_1', slot: 'weapon', equipTag: 'wand', wandElem: 'ice',     name: '學徒魔杖',     reqLv: 1,  reqStats: {},        startSkill: 'ice1',     I: 11,  MR: 5 },
    { tplId: 'w_wnd_t_1', slot: 'weapon', equipTag: 'wand', wandElem: 'thunder', name: '學徒魔杖',     reqLv: 1,  reqStats: {},        startSkill: 'thunder1', I: 11,  MR: 5 },
    { tplId: 'w_wnd_28',  slot: 'weapon', equipTag: 'wand',                      name: '星光水晶魔杖', reqLv: 28, reqStats: { I: 36 }, startSkill: 'fire1',    I: 46,  MR: 22 },
    { tplId: 'w_wnd_62',  slot: 'weapon', equipTag: 'wand',                      name: '聖靈魔杖',     reqLv: 62, reqStats: { I: 76 }, startSkill: 'fire1',    I: 105, MR: 52 },
  
    // === 法杖（equipTag: 'staff'，白魔法 MR 輔助型） ===
    { tplId: 'w_stf_1',   slot: 'weapon', equipTag: 'staff',                     name: '木製短杖',     reqLv: 1,  reqStats: {},        startSkill: 'holylight', MR: 9,  I: 5,  DEF: 2 },
    { tplId: 'w_stf_28',  slot: 'weapon', equipTag: 'staff',                     name: '聖光牧杖',     reqLv: 28, reqStats: { MR: 36 }, startSkill: 'holylight', MR: 38, I: 18, DEF: 10 },
    { tplId: 'w_stf_62',  slot: 'weapon', equipTag: 'staff',                     name: '燭天使聖柱',   reqLv: 62, reqStats: { MR: 76 }, startSkill: 'holylight', MR: 85, I: 42, DEF: 26 },
  
    // === 釘錘（equipTag: 'mace'，DEF + H 近戰防衛型） ===
    { tplId: 'w_mac_1',   slot: 'weapon', equipTag: 'mace',                      name: '見習釘錘',     reqLv: 1,  reqStats: {},        startSkill: 'armorbreak', H: 6,  S: 3,  DEF: 6,  MR: 4 },
    { tplId: 'w_mac_28',  slot: 'weapon', equipTag: 'mace',                      name: '神聖戰錘',     reqLv: 28, reqStats: { DEF: 32 }, startSkill: 'armorbreak', H: 28, S: 14, DEF: 28, MR: 16 },
    { tplId: 'w_mac_62',  slot: 'weapon', equipTag: 'mace',                      name: '聖裁碎星錘',   reqLv: 62, reqStats: { DEF: 68 }, startSkill: 'armorbreak', H: 65, S: 32, DEF: 64, MR: 38 }
  ];
  
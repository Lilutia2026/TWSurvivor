// 武器總彙整檔（自動合併各系武器資料表並初始化類別標籤與純七大素質浮動區間）
const WEAPON_TEMPLATES = [
  ...(typeof WEAPON_SWORD_ITEMS !== 'undefined' ? WEAPON_SWORD_ITEMS : []),
  ...(typeof WEAPON_MAGIC_ITEMS !== 'undefined' ? WEAPON_MAGIC_ITEMS : [])
];

WEAPON_TEMPLATES.forEach(w => {
  if (!w.allowChars) w.allowChars = ['all'];
  if (!w.equipTag) w.equipTag = w.type || 'all';
  if (!w.type) w.type = w.equipTag;
  w.subType = w.type;
  w.base = {};
  for (const k of ['S', 'H', 'I', 'DEF', 'MR', 'DEX', 'AGI']) {
    if (w[k]) {
      const v = w[k];
      w.base[k] = { min: Math.max(1, Math.floor(v * 0.85)), max: Math.ceil(v * 1.15) };
    }
  }
});

const ITEM_WEAPONS = WEAPON_TEMPLATES;

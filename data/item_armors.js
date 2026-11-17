// 防具與飾品總彙整檔（自動合併四大模組資料表並初始化類別標籤與浮動區間）
const ARMOR_TEMPLATES = [
  ...(typeof ARMOR_SUB_ITEMS !== 'undefined' ? ARMOR_SUB_ITEMS : []),
  ...(typeof ARMOR_BODY_ITEMS !== 'undefined' ? ARMOR_BODY_ITEMS : []),
  ...(typeof ARMOR_PARTS_ITEMS !== 'undefined' ? ARMOR_PARTS_ITEMS : []),
  ...(typeof ARMOR_SPECIAL_ITEMS !== 'undefined' ? ARMOR_SPECIAL_ITEMS : [])
];

ARMOR_TEMPLATES.forEach(a => {
  if (!a.allowChars) a.allowChars = ['all'];
  if (!a.equipTag) a.equipTag = 'all';
  if (!a.subType) {
    a.subType = a.equipTag === 'shield' ? 'shield'
              : (a.equipTag === 'knuckle' ? 'ring'
              : (a.equipTag === 'crystal' ? 'crystal' : a.slot));
  }
  if (!a.base) {
    a.base = {};
    for (const k of ['S', 'H', 'I', 'DEF', 'MR', 'DEX', 'AGI', 'hp', 'spd', 'critRate', 'critDmg', 'dmgReduce']) {
      if (a[k]) {
        const v = a[k];
        a.base[k] = { min: Math.max(1, Math.floor(v * 0.88)), max: Math.ceil(v * 1.12) };
      }
    }
  }
});

const ITEM_ARMORS = ARMOR_TEMPLATES;
const ARMOR_POOL = ARMOR_TEMPLATES;

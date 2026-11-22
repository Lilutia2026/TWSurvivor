// 防具與飾品總彙整檔（自動合併手飾、身體防具、頭手腳、特殊面具與獨立翅膀庫）
const ARMOR_TEMPLATES = [
  ...(typeof ARMOR_SUB_ITEMS !== 'undefined' ? ARMOR_SUB_ITEMS : []),
  ...(typeof ARMOR_BODY_ITEMS !== 'undefined' ? ARMOR_BODY_ITEMS : []),
  ...(typeof ARMOR_PARTS_ITEMS !== 'undefined' ? ARMOR_PARTS_ITEMS : []),
  ...(typeof ARMOR_SPECIAL_ITEMS !== 'undefined' ? ARMOR_SPECIAL_ITEMS : []),
  ...(typeof ARMOR_WINGS_ITEMS !== 'undefined' ? ARMOR_WINGS_ITEMS : [])
];

// 自動補齊防具職業限制、副類型標籤與 ±15% 基礎素質浮動區間
ARMOR_TEMPLATES.forEach(a => {
  if (!a.slot) a.slot = 'armor';
  if (!a.allowChars) a.allowChars = ['all'];
  if (!a.equipTag) a.equipTag = 'all';
  if (!a.subType) a.subType = (a.equipTag && a.equipTag !== 'all') ? a.equipTag : a.slot;
  if (!a.base) {
    a.base = {};
    ['S', 'H', 'I', 'DEF', 'MR', 'DEX', 'AGI'].forEach(k => {
      if (a[k] && a[k] > 0) {
        a.base[k] = { min: Math.max(1, Math.floor(a[k] * 0.85)), max: Math.max(a[k], Math.ceil(a[k] * 1.15)) };
      }
    });
  }
  if (!a.statRange) {
    a.statRange = {};
    for (const [k, r] of Object.entries(a.base)) a.statRange[k] = [r.min, r.max];
  }
});

const ITEM_ARMORS = ARMOR_TEMPLATES;

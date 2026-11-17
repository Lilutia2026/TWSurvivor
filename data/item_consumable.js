// 特殊改造道具、原版 SHIM 屬性合成劑與分品級洗煉石資料庫
const CONSUMABLE_ITEMS = {
  // === 武器改造石（每把武器限 1 次，不消耗合成次數） ===
  engraveStone: {
    id: 'engraveStone', category: 'weaponMod', name: '🔮 技能刻印石', rarity: 'purple', buyPrice: 1200,
    desc: '可對 LV.15 以上劍類武器使用（限 1 次），自選覆寫起始招式（法杖、釘錘與魔杖不可使用）。'
  },
  elemStone: {
    id: 'elemStone', category: 'weaponMod', name: '🌈 元素魔晶石', rarity: 'purple', buyPrice: 1200,
    desc: '可對 LV.15 以上元素魔杖使用（限 1 次），改寫魔杖的元素屬性詞條（火／冰／雷）與對應卡池。'
  },

  // === 原版《天翼之鍊》SHIM 四大屬性合成劑（消耗裝備 1 次合成次數，提升對應白字屬性 +1~+3） ===
  synth_S:  { id: 'synth_S',  category: 'synth', targetStat: 'S',  name: '🗡️ 砥石',       rarity: 'blue', buyPrice: 280, desc: '消耗 1 次合成次數，使裝備自帶的 STAB 刺擊屬性浮動提升 +1～+3。' },
  synth_H:  { id: 'synth_H',  category: 'synth', targetStat: 'H',  name: '⚔️ 磨刀石',     rarity: 'blue', buyPrice: 280, desc: '消耗 1 次合成次數，使裝備自帶的 HACK 劈砍屬性浮動提升 +1～+3。' },
  synth_I:  { id: 'synth_I',  category: 'synth', targetStat: 'I',  name: '🔮 魔力強化劑', rarity: 'blue', buyPrice: 280, desc: '消耗 1 次合成次數，使裝備自帶的 INT 魔攻屬性浮動提升 +1～+3。' },
  synth_MR: { id: 'synth_MR', category: 'synth', targetStat: 'MR', name: '✨ 女神的加護', rarity: 'blue', buyPrice: 280, desc: '消耗 1 次合成次數，使裝備自帶的 MR 魔防／白魔屬性浮動提升 +1～+3。' },

  // === 分品級詞綴洗煉石（無限次洗煉、不扣合成次數；支援 5 合 1 升階合成） ===
  recast_green: {
    id: 'recast_green', category: 'recast', targetRarity: 'green', name: '🟢 優良洗煉石', rarity: 'green', buyPrice: 120,
    desc: '刷新【優良（綠色）】裝備的魔法副詞條；集滿 5 顆可合成 1 顆稀有洗煉石。'
  },
  recast_blue: {
    id: 'recast_blue', category: 'recast', targetRarity: 'blue', name: '🔵 稀有洗煉石', rarity: 'blue', buyPrice: 350,
    craftFrom: { id: 'recast_green', count: 5 },
    desc: '刷新【稀有（藍色）】裝備的魔法副詞條；集滿 5 顆可合成 1 顆史詩洗煉石。'
  },
  recast_purple: {
    id: 'recast_purple', category: 'recast', targetRarity: 'purple', name: '🟣 史詩洗煉石', rarity: 'purple', buyPrice: 900,
    craftFrom: { id: 'recast_blue', count: 5 },
    desc: '刷新【史詩（紫色）】裝備的魔法副詞條；集滿 5 顆可合成 1 顆傳說洗煉石。'
  },
  recast_gold: {
    id: 'recast_gold', category: 'recast', targetRarity: 'gold', name: '🟡 傳說洗煉石', rarity: 'gold', buyPrice: 2400,
    craftFrom: { id: 'recast_purple', count: 5 },
    desc: '刷新【傳說（金色）】裝備的魔法副詞條（LV.25 以上消耗 2 顆、LV.45 以上消耗 3 顆）。'
  }
};

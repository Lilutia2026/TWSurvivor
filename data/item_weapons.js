// 《天翼之鍊》原作主武器資料庫（LV.1 ～ LV.62 血武里程碑，含路西安與蒂琪愛兒全系）
const WEAPON_TEMPLATES = [
  // === 細劍系（STAB 突刺主導・起始技：極光刺 aurora） ===
  { tplId: 'w_rap_1',  slot: 'weapon', type: 'rapier',    name: '刺擊劍',       reqLv: 1,  reqStats: {},               allowChars: ['lucien', 'ispin'], startSkill: 'aurora', S: 6,  H: 2,  critRate: 2 },
  { tplId: 'w_rap_8',  slot: 'weapon', type: 'rapier',    name: '士兵之劍',     reqLv: 8,  reqStats: { S: 12 },        allowChars: ['lucien', 'ispin'], startSkill: 'aurora', S: 14, H: 4,  critRate: 3 },
  { tplId: 'w_rap_16', slot: 'weapon', type: 'rapier',    name: '光芒劍',       reqLv: 16, reqStats: { S: 24 },        allowChars: ['lucien', 'ispin'], startSkill: 'aurora', S: 26, H: 8,  critRate: 5 },
  { tplId: 'w_rap_24', slot: 'weapon', type: 'rapier',    name: '波刃劍',       reqLv: 24, reqStats: { S: 36 },        allowChars: ['lucien', 'ispin'], startSkill: 'aurora', S: 36, H: 13, critRate: 6 },
  { tplId: 'w_rap_35', slot: 'weapon', type: 'rapier',    name: '流水劍',       reqLv: 35, reqStats: { S: 48 },        allowChars: ['lucien', 'ispin'], startSkill: 'aurora', S: 48, H: 17, critRate: 8,  AGI: 4 },
  { tplId: 'w_rap_42', slot: 'weapon', type: 'rapier',    name: '破壞者',       reqLv: 42, reqStats: { S: 54 },        allowChars: ['lucien', 'ispin'], startSkill: 'aurora', S: 56, H: 21, critRate: 10, DEX: 5 },
  { tplId: 'w_rap_52', slot: 'weapon', type: 'rapier',    name: '名劍・紅晶',   reqLv: 52, reqStats: { S: 70 },        allowChars: ['lucien', 'ispin'], startSkill: 'aurora', S: 64, H: 24, critRate: 12, DEX: 8, AGI: 5 },
  { tplId: 'w_rap_62', slot: 'weapon', type: 'rapier',    name: '🩸 伏魔劍',    reqLv: 62, reqStats: { S: 83 },        allowChars: ['lucien', 'ispin'], startSkill: 'aurora', S: 76, H: 30, critRate: 16, critDmg: 25, DEX: 12, AGI: 8 },

  // === 長劍系（STAB/HACK 雙修均衡・起始技：圓月斬 enbu） ===
  { tplId: 'w_long_1',  slot: 'weapon', type: 'longsword', name: '學徒長劍',     reqLv: 1,  reqStats: {},               allowChars: ['lucien', 'ispin'], startSkill: 'enbu',   H: 4,  S: 4 },
  { tplId: 'w_long_8',  slot: 'weapon', type: 'longsword', name: '飛虎長劍',     reqLv: 8,  reqStats: { S: 8, H: 8 },   allowChars: ['lucien', 'ispin'], startSkill: 'enbu',   H: 11, S: 11, DEF: 2 },
  { tplId: 'w_long_16', slot: 'weapon', type: 'longsword', name: '鋒利長劍',     reqLv: 16, reqStats: { S: 16, H: 16 }, allowChars: ['lucien', 'ispin'], startSkill: 'enbu',   H: 22, S: 22, critRate: 4 },
  { tplId: 'w_long_24', slot: 'weapon', type: 'longsword', name: '破邪劍',       reqLv: 24, reqStats: { S: 24, H: 24 }, allowChars: ['lucien', 'ispin'], startSkill: 'enbu',   H: 34, S: 32, critRate: 6 },
  { tplId: 'w_long_35', slot: 'weapon', type: 'longsword', name: '巨闕',         reqLv: 35, reqStats: { S: 32, H: 32 }, allowChars: ['lucien', 'ispin'], startSkill: 'enbu',   H: 46, S: 46, DEF: 4, hp: 30 },
  { tplId: 'w_long_42', slot: 'weapon', type: 'longsword', name: '閃・龍牙',     reqLv: 42, reqStats: { S: 36, H: 36 }, allowChars: ['lucien', 'ispin'], startSkill: 'enbu',   H: 54, S: 54, critRate: 8,  critDmg: 15 },
  { tplId: 'w_long_52', slot: 'weapon', type: 'longsword', name: '咒血劍',       reqLv: 52, reqStats: { S: 40, H: 40 }, allowChars: ['lucien', 'ispin'], startSkill: 'enbu',   H: 60, S: 58, critRate: 10, I: 8 },
  { tplId: 'w_long_62', slot: 'weapon', type: 'longsword', name: '🩸 紫焰',      reqLv: 62, reqStats: { S: 44, H: 44 }, allowChars: ['lucien', 'ispin'], startSkill: 'enbu',   H: 68, S: 66, critRate: 14, critDmg: 30, DEF: 6, MR: 6 },

  // === 彎刀系（HACK 砍劈主導・起始技：連犽斬 renga） ===
  { tplId: 'w_bld_1',  slot: 'weapon', type: 'blade',     name: '銳刀',         reqLv: 1,  reqStats: {},               allowChars: ['lucien', 'boris', 'maximin', 'ispin'], startSkill: 'renga', H: 7,  S: 3,  critRate: 2 },
  { tplId: 'w_bld_8',  slot: 'weapon', type: 'blade',     name: '鋼刀',         reqLv: 8,  reqStats: { H: 12 },        allowChars: ['lucien', 'boris', 'maximin', 'ispin'], startSkill: 'renga', H: 15, S: 7,  critRate: 3 },
  { tplId: 'w_bld_16', slot: 'weapon', type: 'blade',     name: '海賊彎刀',     reqLv: 16, reqStats: { H: 24 },        allowChars: ['lucien', 'boris', 'maximin', 'ispin'], startSkill: 'renga', H: 26, S: 11, critRate: 4,  AGI: 3 },
  { tplId: 'w_bld_24', slot: 'weapon', type: 'blade',     name: '漆黑魔刃',     reqLv: 24, reqStats: { H: 36 },        allowChars: ['lucien', 'boris', 'maximin', 'ispin'], startSkill: 'renga', H: 36, S: 15, critRate: 6,  I: 5 },
  { tplId: 'w_bld_35', slot: 'weapon', type: 'blade',     name: '藍月',         reqLv: 35, reqStats: { H: 48 },        allowChars: ['lucien', 'boris', 'maximin', 'ispin'], startSkill: 'renga', H: 50, S: 19, critRate: 7,  MR: 5 },
  { tplId: 'w_bld_42', slot: 'weapon', type: 'blade',     name: '雁翎',         reqLv: 42, reqStats: { H: 54 },        allowChars: ['lucien', 'boris', 'maximin', 'ispin'], startSkill: 'renga', H: 56, S: 22, critRate: 9,  AGI: 6 },
  { tplId: 'w_bld_52', slot: 'weapon', type: 'blade',     name: '一臻文字',     reqLv: 52, reqStats: { H: 70 },        allowChars: ['lucien', 'boris', 'maximin', 'ispin'], startSkill: 'renga', H: 64, S: 25, critRate: 11, DEX: 8 },
  { tplId: 'w_bld_62', slot: 'weapon', type: 'blade',     name: '🩸 炎風',      reqLv: 62, reqStats: { H: 83 },        allowChars: ['lucien', 'boris', 'maximin', 'ispin'], startSkill: 'renga', H: 76, S: 30, critRate: 15, critDmg: 25, AGI: 12 },

  // === 蒂琪愛兒：元素魔杖（火／冰／雷純化卡池，INT 攻擊型） ===
  { tplId: 'w_wnd_f_1',  slot: 'weapon', type: 'wand', wandElem: 'fire',    name: '紅玉火魔杖',     reqLv: 1,  reqStats: {},         allowChars: ['tichiel'], startSkill: 'fire1',    I: 7,  MR: 4, critRate: 2 },
  { tplId: 'w_wnd_f_28', slot: 'weapon', type: 'wand', wandElem: 'fire',    name: '烈焰寶石魔杖',   reqLv: 28, reqStats: { I: 34 },  allowChars: ['tichiel'], startSkill: 'fire1',    I: 38, MR: 18, critRate: 6 },
  { tplId: 'w_wnd_f_62', slot: 'weapon', type: 'wand', wandElem: 'fire',    name: '🔥 紅蓮業火魔杖', reqLv: 62, reqStats: { I: 76 }, allowChars: ['tichiel'], startSkill: 'fire1',    I: 74, MR: 36, critRate: 14, critDmg: 25 },
  { tplId: 'w_wnd_i_1',  slot: 'weapon', type: 'wand', wandElem: 'ice',     name: '藍晶冰魔杖',     reqLv: 1,  reqStats: {},         allowChars: ['tichiel'], startSkill: 'ice1',     I: 7,  MR: 4, critRate: 2 },
  { tplId: 'w_wnd_i_28', slot: 'weapon', type: 'wand', wandElem: 'ice',     name: '寒霜寶石魔杖',   reqLv: 28, reqStats: { I: 34 },  allowChars: ['tichiel'], startSkill: 'ice1',     I: 38, MR: 18, critRate: 6 },
  { tplId: 'w_wnd_i_62', slot: 'weapon', type: 'wand', wandElem: 'ice',     name: '❄️ 永凍星河魔杖', reqLv: 62, reqStats: { I: 76 }, allowChars: ['tichiel'], startSkill: 'ice1',     I: 74, MR: 36, critRate: 14, critDmg: 25 },
  { tplId: 'w_wnd_t_1',  slot: 'weapon', type: 'wand', wandElem: 'thunder', name: '黃玉雷魔杖',     reqLv: 1,  reqStats: {},         allowChars: ['tichiel'], startSkill: 'thunder1', I: 7,  MR: 4, critRate: 2 },
  { tplId: 'w_wnd_t_28', slot: 'weapon', type: 'wand', wandElem: 'thunder', name: '閃電寶石魔杖',   reqLv: 28, reqStats: { I: 34 },  allowChars: ['tichiel'], startSkill: 'thunder1', I: 38, MR: 18, critRate: 6 },
  { tplId: 'w_wnd_t_62', slot: 'weapon', type: 'wand', wandElem: 'thunder', name: '⚡ 九霄天劫魔杖', reqLv: 62, reqStats: { I: 76 }, allowChars: ['tichiel'], startSkill: 'thunder1', I: 74, MR: 36, critRate: 14, critDmg: 25 },
  // === 蒂琪愛兒：法杖（輔助型 MR，起始技：神聖之光 holylight） ===
  { tplId: 'w_stf_1',  slot: 'weapon', type: 'staff', name: '白樺法杖',       reqLv: 1,  reqStats: {},          allowChars: ['tichiel'], startSkill: 'holylight', MR: 7,  I: 3, DEF: 2 },
  { tplId: 'w_stf_28', slot: 'weapon', type: 'staff', name: '聖潔月光法杖',   reqLv: 28, reqStats: { MR: 34 },  allowChars: ['tichiel'], startSkill: 'holylight', MR: 38, I: 16, DEF: 10, hp: 40 },
  { tplId: 'w_stf_62', slot: 'weapon', type: 'staff', name: '✨ 熾天使聖杖',   reqLv: 62, reqStats: { MR: 76 },  allowChars: ['tichiel'], startSkill: 'holylight', MR: 74, I: 32, DEF: 22, hp: 110, critRate: 12 },

  // === 蒂琪愛兒：權杖／釘錘（戰鬥型 DEF+H，起始技：破壞盔甲 armorbreak） ===
  { tplId: 'w_mac_1',  slot: 'weapon', type: 'mace',  name: '青銅釘錘',       reqLv: 1,  reqStats: {},          allowChars: ['tichiel'], startSkill: 'armorbreak', H: 6, S: 4, DEF: 4 },
  { tplId: 'w_mac_28', slot: 'weapon', type: 'mace',  name: '審判戰錘',       reqLv: 28, reqStats: { H: 32 },   allowChars: ['tichiel'], startSkill: 'armorbreak', H: 36, S: 22, DEF: 18, hp: 60 },
  { tplId: 'w_mac_62', slot: 'weapon', type: 'mace',  name: '🔨 聖裁碎星錘',   reqLv: 62, reqStats: { H: 72 },   allowChars: ['tichiel'], startSkill: 'armorbreak', H: 72, S: 44, DEF: 34, hp: 150, critRate: 12 }
];

WEAPON_TEMPLATES.forEach(w => {
  if (!w.subType) w.subType = w.type || 'weapon';
  if (!w.base) {
    w.base = {};
    for (const k of ['S', 'H', 'I', 'DEF', 'MR', 'DEX', 'AGI', 'hp', 'spd', 'critRate', 'critDmg', 'dmgReduce']) {
      if (w[k]) {
        const v = w[k];
        w.base[k] = { min: Math.max(1, Math.floor(v * 0.88)), max: Math.ceil(v * 1.12) };
      }
    }
  }
});
const ITEM_WEAPONS = WEAPON_TEMPLATES;
const WEAPON_POOL = WEAPON_TEMPLATES;

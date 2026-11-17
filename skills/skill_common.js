// 全角色技能註冊總表
const CHAR_SKILL_REGISTRY = {};

// 武器類型對物理/魔法屬性的動態發揮倍率（含 V2.4 路西安與蒂琪愛兒全武器）
const WEAPON_MOD = {
  blade:     { H: 1.15, S: 0.75, I: 1.0,  MR: 1.0 },
  rapier:    { H: 0.75, S: 1.15, I: 1.0,  MR: 1.0 },
  longsword: { H: 1.00, S: 1.00, I: 1.0,  MR: 1.0 },
  wand:      { H: 0.85, S: 0.85, I: 1.15, MR: 1.0 },
  staff:     { H: 0.85, S: 0.85, I: 1.0,  MR: 1.15 },
  mace:      { H: 1.10, S: 1.00, I: 0.9,  MR: 1.0 }
};

// 全角色共通輔助技能池（V2.4 更新：拔除純物理/純魔法減傷被動，僅保留共通魔力護盾）
const COMMON_PASSIVES = {
  might:      { name: '⚔️ 鬥志增幅',     maxLv: 5, desc: '每級全技能最終傷害 +8%（滿級 +40%）' },
  cdr:        { name: '⏳ 迅捷詠唱',     maxLv: 5, desc: '每級全技能冷卻縮減 +6%（總冷卻縮減上限 65%）' },
  area:       { name: '🌐 領域擴張',     maxLv: 5, desc: '每級全技能攻擊範圍 +10%（滿級 +50%）' },
  crit:       { name: '🎯 弱點洞察',     maxLv: 5, desc: '每級全技能暴擊率 +4%（滿級 +20%）' },
  resonance:  { name: '🔮 元素共鳴增幅', maxLv: 5, desc: '每級元素異常與共鳴觸發傷害 +12%（滿級 +60%）' },
  lucky:      { name: '🍀 幸運女神微笑', maxLv: 5, desc: '每級裝備袋與寶箱掉落率 +20%（滿級 +100%）' },
  windBoot:   { name: '👟 疾風之祝福',   maxLv: 5, desc: '每級移動速度 +9%（滿級 +45%）' },
  heal:       { name: '💚 治癒之光',     maxLv: 5, desc: '每級每秒自然回復 +1.2 生命（滿級 +6.0/秒）' },
  manaShield: { name: '💠 魔力護盾',     maxLv: 5, desc: '每 12 秒生成 15% 最大生命護盾（每級護盾 +5%、冷卻 -1 秒）' },
  thorns:     { name: '🌵 荊棘反甲',     maxLv: 5, desc: '受碰撞時對該敵人反彈 DEF×150% 傷害並擊退（每級 +50%）' }
};

function getActiveSkillPool() {
  const cid = (typeof saveData !== 'undefined' && saveData.charId) ? saveData.charId : 'lucien';
  const entry = CHAR_SKILL_REGISTRY[cid] || CHAR_SKILL_REGISTRY.lucien;
  const pool = {};
  if (!entry || !entry.skills) return pool;
  const w = (typeof saveData !== 'undefined' && saveData.equip) ? saveData.equip.weapon : null;
  for (const [id, sk] of Object.entries(entry.skills)) {
    if (sk.weaponGroup) {
      const wType = w ? w.type : 'longsword';
      if (sk.weaponGroup === 'wand' && wType !== 'wand') continue;
      if (sk.weaponGroup === 'staff_mace' && wType !== 'staff' && wType !== 'mace') continue;
      if (sk.wandElem && (!w || w.wandElem !== sk.wandElem)) continue;
    }
    pool[id] = { ...sk, timer: 0.2 };
  }
  return pool;
}

function getActivePassivePool() {
  const cid = (typeof saveData !== 'undefined' && saveData.charId) ? saveData.charId : 'lucien';
  const entry = CHAR_SKILL_REGISTRY[cid] || CHAR_SKILL_REGISTRY.lucien;
  return { ...(entry ? entry.passives : {}), ...COMMON_PASSIVES };
}

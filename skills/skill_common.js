// 全角色技能註冊總表
const CHAR_SKILL_REGISTRY = {};

// 全角色共通輔助技能池（V2.5 擴充至 12 張：新增貪婪祝福與暗黑詛咒）
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
  thorns:     { name: '🌵 荊棘反甲',     maxLv: 5, desc: '受碰撞時對該敵人反彈 DEF×150% 傷害並擊退（每級 +50%）' },
  greed:      { name: '💰 貪婪祝福',     maxLv: 5, desc: '每級結算獲得 Seed 貨幣 +15%（滿級 +75%）' },
  curse:      { name: '💀 暗黑詛咒',     maxLv: 5, desc: '每級怪物生命、移速與刷怪頻率 +10%（滿級 +50%）' }
};

function getActiveSkillPool() {
  const cid = (typeof saveData !== 'undefined' && saveData.charId) ? saveData.charId : 'lucien';
  const curJobTier = (typeof saveData !== 'undefined' && saveData.jobTier) ? saveData.jobTier : 1;
  const entry = CHAR_SKILL_REGISTRY[cid] || CHAR_SKILL_REGISTRY.lucien;
  const pool = {};
  if (!entry || !entry.skills) return pool;
  const w = (typeof saveData !== 'undefined' && saveData.equip) ? saveData.equip.weapon : null;
  for (const [id, sk] of Object.entries(entry.skills)) {
    if (sk.reqJobTier && curJobTier < sk.reqJobTier) continue;
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
  const curJobTier = (typeof saveData !== 'undefined' && saveData.jobTier) ? saveData.jobTier : 1;
  const entry = CHAR_SKILL_REGISTRY[cid] || CHAR_SKILL_REGISTRY.lucien;
  const charPassives = {};
  if (entry && entry.passives) {
    for (const [id, p] of Object.entries(entry.passives)) {
      if (p.reqJobTier && curJobTier < p.reqJobTier) continue;
      charPassives[id] = p;
    }
  }
  return { ...charPassives, ...COMMON_PASSIVES };
}

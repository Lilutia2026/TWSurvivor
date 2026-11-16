// 全角色技能註冊總表
const CHAR_SKILL_REGISTRY = {};

// 武器類型對物理/魔法屬性的動態發揮倍率
const WEAPON_MOD = {
  blade:     { H: 1.15, S: 0.75, I: 1.0 },
  rapier:    { H: 0.75, S: 1.15, I: 1.0 },
  longsword: { H: 1.00, S: 1.00, I: 1.0 }
};

// 全角色共通輔助技能池（每張卡皆配置獨立不重複圖示）
const COMMON_PASSIVES = {
  might:      { name: '⚔️ 鬥志增幅',     maxLv: 5, desc: '每級全技能最終傷害 +8%（滿級 +40%）' },
  cdr:        { name: '⏳ 迅捷詠唱',     maxLv: 5, desc: '每級全技能冷卻縮減 +6%（總冷卻縮減上限 65%）' },
  area:       { name: '🌐 領域擴張',     maxLv: 5, desc: '每級全技能攻擊範圍 +10%（滿級 +50%）' },
  crit:       { name: '🎯 弱點洞察',     maxLv: 5, desc: '每級全技能暴擊率 +4%（滿級 +20%）' },
  resonance:  { name: '🔮 元素共鳴增幅', maxLv: 5, desc: '每級元素異常與共鳴觸發傷害 +12%（滿級 +60%）' },
  lucky:      { name: '🍀 幸運女神微笑', maxLv: 5, desc: '每級裝備袋與寶箱掉落率 +20%（滿級 +100%）' },
  windBoot:   { name: '👟 疾風之祝福',   maxLv: 5, desc: '每級移動速度 +9%（滿級 +45%）' },
  heal:       { name: '💚 治癒之光',     maxLv: 5, desc: '每級每秒自然回復 +1.2 生命（滿級 +6.0/秒）' },
  barrier:    { name: '🛡️ 聖光守護結界', maxLv: 5, desc: '每級獲得 6% 獨立乘算減傷（與防禦共用 70% 硬上限）' },
  manaShield: { name: '💠 魔力護盾',     maxLv: 5, desc: '每 12 秒生成 15% 最大生命護盾（每級護盾 +5%、冷卻 -1 秒）' },
  thorns:     { name: '🌵 荊棘反甲',     maxLv: 5, desc: '受碰撞時對該敵人反彈 DEF×150% 傷害並擊退（每級 +50%）' }
};

function getActiveSkillPool() {
  const cid = (typeof saveData !== 'undefined' && saveData.charId) ? saveData.charId : 'lucien';
  const entry = CHAR_SKILL_REGISTRY[cid] || CHAR_SKILL_REGISTRY.lucien;
  const pool = {};
  if (entry && entry.skills) {
    for (const [id, sk] of Object.entries(entry.skills)) {
      pool[id] = { ...sk, timer: 0.2 };
    }
  }
  return pool;
}

function getActivePassivePool() {
  const cid = (typeof saveData !== 'undefined' && saveData.charId) ? saveData.charId : 'lucien';
  const entry = CHAR_SKILL_REGISTRY[cid] || CHAR_SKILL_REGISTRY.lucien;
  return { ...(entry ? entry.passives : {}), ...COMMON_PASSIVES };
}

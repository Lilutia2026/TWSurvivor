// 全域統一技能大卡池與被動池（V2.8 單一大卡池 ＋ 雙向標籤篩選架構）
const GLOBAL_SKILL_POOL = {};
const GLOBAL_PASSIVE_POOL = {};
const CHAR_SKILL_REGISTRY = {};

function registerGlobalSkills(skillsObj) {
  if (!skillsObj) return;
  for (const [id, sk] of Object.entries(skillsObj)) {
    GLOBAL_SKILL_POOL[id] = { ...sk };
  }
}

function registerGlobalPassives(passivesObj) {
  if (!passivesObj) return;
  for (const [id, p] of Object.entries(passivesObj)) {
    GLOBAL_PASSIVE_POOL[id] = { ...p };
  }
}

// 全角色共通輔助技能池（共 12 張，上限 LV.5）
const COMMON_PASSIVES = {
  might:      { name: '⚔️ 鬥志增幅',     skillTags: ['common'], maxLv: 5, desc: '每級全技能最終傷害 +8%（滿級 +40%）' },
  cdr:        { name: '⏳ 迅捷詠唱',     skillTags: ['common'], maxLv: 5, desc: '每級全技能冷卻縮減 +6%（總冷卻縮減上限 65%）' },
  area:       { name: '🌐 領域擴張',     skillTags: ['common'], maxLv: 5, desc: '每級全技能攻擊範圍 +6%（滿級 +30%）' },
  crit:       { name: '🎯 弱點洞察',     skillTags: ['common'], maxLv: 5, desc: '每級全技能暴擊率 +4%（滿級 +20%）' },
  resonance:  { name: '🔮 元素共鳴增幅', skillTags: ['common'], maxLv: 5, desc: '每級元素異常與共鳴觸發傷害 +12%（滿級 +60%）' },
  lucky:      { name: '🍀 幸運女神微笑', skillTags: ['common'], maxLv: 5, desc: '每級裝備袋與寶箱掉落率 +20%（滿級 +100%）' },
  windBoot:   { name: '👟 疾風之祝福',   skillTags: ['common'], maxLv: 5, desc: '每級移動速度 +9%（滿級 +45%）' },
  heal:       { name: '💚 治癒之光',     skillTags: ['common'], maxLv: 5, desc: '每級每秒自然回復 +1.2 生命（滿級 +6.0/秒）' },
  manaShield: { name: '💠 魔力護盾',     skillTags: ['common'], maxLv: 5, desc: '每 12 秒生成 15% 最大生命護盾（每級護盾 +5%、冷卻 -1 秒）' },
  thorns:     { name: '🌵 荊棘反甲',     skillTags: ['common'], maxLv: 5, desc: '受碰撞時對該敵人反彈 DEF×150% 傷害並擊退（每級 +50%）' },
  greed:      { name: '💰 貪婪祝福',     skillTags: ['common'], maxLv: 5, desc: '每級結算獲得 Seed 貨幣 +15%（滿級 +75%）' },
  curse:      { name: '💀 暗黑詛咒',     skillTags: ['common'], maxLv: 5, desc: '每級怪物生命、移速與刷怪頻率 +10%（滿級 +50%）' },
  magnet:     { name: '🧲 強力磁鐵',     skillTags: ['common'], maxLv: 5, desc: '每級拾取範圍 +20%（滿級 +100%）' }
};
registerGlobalPassives(COMMON_PASSIVES);

// 雙向標籤篩選：依角色 skillTags、reqChar、reqWeaponTypes 與元素詞條過濾出本局可選主動池
function getActiveSkillPool() {
  const ch = typeof getCurrentCharData === 'function' ? getCurrentCharData() : { id: 'lucien', skillTags: ['sword_art', 'common_elem', 'lucien_unique'] };
  const cid = ch.id || 'lucien';
  const charTags = ch.skillTags || [];
  const curJobTier = (typeof saveData !== 'undefined' && saveData.jobTier) ? saveData.jobTier : 1;
  const w = (typeof saveData !== 'undefined' && saveData.equip) ? saveData.equip.weapon : null;
  if (w && !w.subType && !w.type && typeof EQUIP_TEMPLATES !== 'undefined') {
    const tpl = EQUIP_TEMPLATES.find(t => (w.tplId && t.tplId === w.tplId) || t.name === w.name);
    if (tpl && tpl.subType) { w.subType = tpl.subType; w.type = tpl.subType; }
  }
  const wType = w ? (w.subType || w.type || 'longsword') : 'longsword';
  const pool = {};

  for (const [id, sk] of Object.entries(GLOBAL_SKILL_POOL)) {
    if (sk.reqJobTier && curJobTier < sk.reqJobTier) continue;
    if (Array.isArray(sk.reqChar) && !sk.reqChar.includes(cid)) continue;
    if (Array.isArray(sk.skillTags) && sk.skillTags.length > 0) {
      if (!sk.skillTags.some(t => charTags.includes(t))) continue;
    }
    if (Array.isArray(sk.reqWeaponTypes) && sk.reqWeaponTypes.length > 0) {
      if (!sk.reqWeaponTypes.includes(wType)) continue;
    }
    // 嚴格純化隔離：
    // 1. 小愛拿「魔杖 (wand)」時，禁用白魔/戰錘技能 (staff_mace)，且僅開放與魔杖元素一致的單系元素池
    if (cid === 'tichiel' && wType === 'wand') {
      if (Array.isArray(sk.skillTags) && sk.skillTags.includes('staff_mace')) continue;
      if (sk.wandElem && (!w || w.wandElem !== sk.wandElem)) continue;
    }
    // 2. 小愛拿「權杖 (staff) 或 釘錘 (mace)」時，禁用元素魔杖卡池 (tichiel_magic)
    if (cid === 'tichiel' && (wType === 'staff' || wType === 'mace')) {
      if (Array.isArray(sk.skillTags) && sk.skillTags.includes('tichiel_magic')) continue;
    }
    pool[id] = { ...sk, timer: 0.2 };
  }
  return pool;
}
// 雙向標籤篩選：過濾出本局可選被動池（共通被動 ＋ 符合角色標籤的專屬被動）
function getActivePassivePool() {
  const ch = typeof getCurrentCharData === 'function' ? getCurrentCharData() : { id: 'lucien', skillTags: ['sword_art', 'common_elem', 'lucien_unique'] };
  const cid = ch.id || 'lucien';
  const charTags = ch.skillTags || [];
  const curJobTier = (typeof saveData !== 'undefined' && saveData.jobTier) ? saveData.jobTier : 1;
  const pool = {};

  for (const [id, p] of Object.entries(GLOBAL_PASSIVE_POOL)) {
    if (p.reqJobTier && curJobTier < p.reqJobTier) continue;
    if (Array.isArray(p.reqChar) && !p.reqChar.includes(cid)) continue;
    if (Array.isArray(p.skillTags) && p.skillTags.length > 0) {
      const isCommon = p.skillTags.includes('common');
      if (!isCommon && !p.skillTags.some(t => charTags.includes(t))) continue;
    }
    pool[id] = p;
  }
  return pool;
}

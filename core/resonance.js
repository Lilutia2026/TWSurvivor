/**
 * ==================================================================
 * 《TW倖存者》V2.7 核心異常狀態與客製共鳴引擎 (core/resonance.js)
 * 職責：管理七大異常生命週期、聖印滿層雙條件引爆與動態共鳴介面
 * ==================================================================
 */

const STATUS_DB = {
  fire:        { id: 'fire',        name: '🔥 點燃' },
  ice:         { id: 'ice',         name: '❄️ 凍結' },
  lightning:   { id: 'lightning',   name: '⚡ 感電' },
  wind:        { id: 'wind',        name: '🌪️ 鎌鼬' },
  holy:        { id: 'holy',        name: '✨ 聖印' },
  armor_break: { id: 'armor_break', name: '🔨 破甲' },
  dark:        { id: 'dark',        name: '🌑 暗蝕' }
};

const BASE_STATUS_DUR = 3.0; // 所有基礎異常統一持續 3.0 秒（受 INT 異常時長加成）
const DARK_ZONE_DUR = 2.0;   // 暗蝕擊殺留下的暗影腐蝕領域固定持續 2.0 秒

function normalizeStatusTag(tag) {
  if (tag === 'thunder') return 'lightning';
  if (tag === 'light') return 'holy';
  return tag;
}

// 初始化敵人身上所有異常狀態計時器與疊層數值
function initEnemyStatus(enemy) {
  enemy.burnTimer = 0; enemy.burnTick = 0; enemy.burnDps = 0;
  enemy.chillStacks = 0; enemy.freezeTimer = 0;
  enemy.shockTimer = 0; enemy.chainIcd = 0;
  enemy.windTimer = 0; enemy.windTick = 0; enemy.windDps = 0;
  enemy.holySeal = 0; enemy.holySealTimer = 0;
  enemy.armorBreakTimer = 0;
  enemy.darkTimer = 0; enemy.darkDps = 0;
  enemy.stunTimer = 0;
}

// 動態掃描角色當前持有的昇華技能／客製共鳴等級（0 = 未昇華）
function getAwakenedTier(elem) {
  const tag = normalizeStatusTag(elem);
  if (typeof ownedSkills === 'undefined' || typeof ACTIVE_SKILLS === 'undefined') return 0;
  let maxTier = 0;
  for (const [id, st] of Object.entries(ownedSkills)) {
    if (!st || st.disabled) continue;
    const sk = ACTIVE_SKILLS[id];
    if (!sk) continue;
    if (sk.isSuperWeapon) {
      const skElems = Array.isArray(sk.statusTags) ? sk.statusTags.map(normalizeStatusTag) : [normalizeStatusTag(sk.resonanceElem || sk.element)];
      if (skElems.includes(tag)) maxTier = Math.max(maxTier, st.lv || 1);
    }
    if (st.evolved || sk.isSuperWeapon) {
      const resElem = normalizeStatusTag(sk.resonanceElem || '');
      const partnerId = sk.resonancePartner || sk.resonanceSkill;
      if (resElem === tag && (!partnerId || (ownedSkills[partnerId] && !ownedSkills[partnerId].disabled))) {
        maxTier = Math.max(maxTier, st.lv || 1);
      }
    }
  }
  return maxTier;
}

// 寒氣疊層控制（1～2 層純累積，滿 3 層轉為完全凍結硬控場）
function applyChillOrFreeze(enemy, stacks = 1, durMult = 1.0) {
  if (!enemy || enemy.freezeTimer > 0) return;
  enemy.chillStacks = (enemy.chillStacks || 0) + stacks;
  if (enemy.chillStacks >= 3) {
    enemy.chillStacks = 0;
    const isBoss = enemy.isElite || enemy.isMegaBoss || enemy.isFinalBoss;
    enemy.freezeTimer = (isBoss ? BASE_STATUS_DUR * 0.5 : BASE_STATUS_DUR) * durMult;
  }
}

// 聖印疊層控制（上限 3 層，每次疊印刷新 3.0s 倒數計時器）
function applyHolySeal(enemy, addStacks = 1, durMult = 1.0) {
  if (!enemy) return;
  enemy.holySeal = Math.min(3, (enemy.holySeal || 0) + addStacks);
  enemy.holySealTimer = BASE_STATUS_DUR * durMult;
}

// 聖印雙條件引爆判定：必須嚴格疊滿 3 層，且同時滿足造成實際傷害 ＋ 通過 V2.6 異常率公式
function tryTriggerHolyResonance(enemy, dealtDamage, mrChanceBonus = 0) {
  if (!enemy || (enemy.holySeal || 0) < 3) return false;
  if (!dealtDamage) return false;
  if (!rollStatusChance(mrChanceBonus)) return false;
  enemy.holySeal = 0;
  enemy.holySealTimer = 0;
  return true;
}

// 計算受擊端異常易傷乘區（聖印提供光／打擊 +20%，破甲提供末端獨立 ×1.25）
function calcStatusDamageMods(enemy, element, isStrikeOrLight) {
  const tag = normalizeStatusTag(element);
  let addBonus = 0;
  let endMult = 1.0;
  if ((enemy.holySeal || 0) >= 1 && (tag === 'holy' || isStrikeOrLight)) addBonus += 0.20;
  if (enemy.armorBreakTimer > 0) endMult *= 1.25;
  return { addMult: 1 + addBonus, endMult };
}

// V2.6 統一異常狀態觸發率檢定（全技能統一：基礎 10% ＋ MR × 0.2% ＋ 詞綴加成，全域硬上限 85%）
function rollStatusChance(mrChanceBonus = 0) {
  let ok = false;
  if (typeof SANDBOX_STATE !== 'undefined' && SANDBOX_STATE.active && SANDBOX_STATE.forceStatusMode) {
    ok = true;
  } else {
    ok = Math.random() < Math.min(0.85, 0.10 + (mrChanceBonus || 0));
  }
  if (ok && typeof SANDBOX_STATE !== 'undefined' && SANDBOX_STATE.active) {
    SANDBOX_STATE.statusProcs = (SANDBOX_STATE.statusProcs || 0) + 1;
  }
  return ok;
}

// 依據技能卡 statusTags 標籤陣列統一掛載七大異常狀態（全數採用 V2.6 統一異常機率公式）
function applyStatusTagsOnHit(enemy, statusTags, spellBase, stats = {}, options = {}) {
  if (!enemy || enemy.isDead || !statusTags) return;
  if ((enemy.statusImmuneTimer || 0) > 0) return; // 【碎冰處決】後 2 秒內免疫所有異常狀態疊加
  const tagList = Array.isArray(statusTags) ? statusTags : [statusTags];
  const durMult = (stats && stats.statusDurMult) || 1.0;
  const mrChance = (stats && stats.statusChanceBonus) || 0;

  for (const rawTag of tagList) {
    const tag = normalizeStatusTag(rawTag);
    if (!tag || tag === 'none') continue;
    if (!rollStatusChance(mrChance)) continue;
    const resMult = (typeof player !== 'undefined' && player.resonanceDmgMult) ? player.resonanceDmgMult : 1.0;
    if (tag === 'armor_break') {
      enemy.armorBreakTimer = Math.max(enemy.armorBreakTimer || 0, BASE_STATUS_DUR * durMult);
    } else if (tag === 'fire') {
      enemy.burnTimer = Math.max(enemy.burnTimer || 0, BASE_STATUS_DUR * durMult);
      enemy.burnDps = Math.max(enemy.burnDps || 0, spellBase * 0.90 * resMult);
    } else if (tag === 'ice') {
      applyChillOrFreeze(enemy, options.chillStacks || 1, durMult);
    } else if (tag === 'lightning') {
      enemy.shockTimer = Math.max(enemy.shockTimer || 0, BASE_STATUS_DUR * durMult);
    } else if (tag === 'wind') {
      enemy.windTimer = Math.max(enemy.windTimer || 0, BASE_STATUS_DUR * durMult);
      enemy.windDps = Math.max(enemy.windDps || 0, spellBase * 0.36);
    } else if (tag === 'holy') {
      applyHolySeal(enemy, options.sealStacks ?? (options.isMelee ? 2 : 1), durMult);
    } else if (tag === 'dark') {
      enemy.darkTimer = Math.max(enemy.darkTimer || 0, BASE_STATUS_DUR * durMult);
      enemy.darkDps = Math.max(enemy.darkDps || 0, spellBase * 0.32 * resMult);
    }
  }
}

function applyBaseStatusOnHit(enemy, element, spellBase, stats, options = {}) {
  applyStatusTagsOnHit(enemy, element, spellBase, stats, options);
}

// 計算異常狀態對敵人移動速度的影響（凍結定身 0x、感電緩速 15%／首領減半）
function getEnemySpeedFactor(enemy) {
  if (!enemy) return 1.0;
  if (enemy.freezeTimer > 0 || enemy.stunTimer > 0) return 0;
  let factor = 1.0;
  const isBoss = enemy.isElite || enemy.isMegaBoss || enemy.isFinalBoss;
  if (enemy.shockTimer > 0) {
    const pen = 0.15 * (isBoss ? 0.5 : 1.0);
    factor *= (1 - pen);
  }
  return Math.max(0.15, factor);
}

// 計算異常狀態對敵人攻擊力的影響（聖印 ≥ 1 層降攻至 0.85x）
function getEnemyAtkFactor(enemy) {
  if (!enemy) return 1.0;
  return (enemy.holySeal || 0) >= 1 ? 0.85 : 1.0;
}

// 動態讀取當前出戰角色設定檔 CHARACTERS[charId].resonances 的客製共鳴參數
function getResonanceParams(elem) {
  const tag = normalizeStatusTag(elem);
  const tier = getAwakenedTier(tag);
  if (tier <= 0) return null;
  const ch = typeof getCurrentCharData === 'function' ? getCurrentCharData() : null;
  const resDef = (ch && ch.resonances) ? ch.resonances[tag] : null;
  if (!resDef) return null;
  const idx = Math.min(4, Math.max(0, tier - 1));
  const out = { tier };
  for (const [k, v] of Object.entries(resDef)) {
    out[k] = Array.isArray(v) ? v[Math.min(v.length - 1, idx)] : v;
  }
  return out;
}

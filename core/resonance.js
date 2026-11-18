```javascript
/**
 * ------------------------------------------------------------------
 * 《TW倖存者》V2.5 核心共鳴與狀態引擎 (core/resonance.js)
 * ------------------------------------------------------------------
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

const BASE_STATUS_DUR = 3.0; // 所有基礎異常預設持續 3.0 秒（受 INT 異常時長加成）
const DARK_ZONE_DUR = 2.0;   // 暗蝕擊殺留下的暗影腐蝕領域固定持續 2.0 秒

function normalizeStatusTag(tag) {
  if (tag === 'thunder') return 'lightning';
  if (tag === 'light') return 'holy';
  return tag;
}

function initEnemyStatus(enemy) {
  enemy.burnTimer = 0; enemy.burnTick = 0; enemy.burnDps = 0;
  enemy.chillStacks = 0; enemy.freezeTimer = 0;
  enemy.shockTimer = 0; enemy.chainIcd = 0;
  enemy.windTimer = 0; enemy.windTick = 0; enemy.windDps = 0;
  enemy.holySeal = 0;
  enemy.armorBreakTimer = 0;
  enemy.darkTimer = 0; enemy.darkDps = 0;
  enemy.stunTimer = 0;
}

// 動態掃描角色當前持有的超武／客製共鳴等級（0 = 未覺醒，1 ~ 5 = 超武等級）
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

function applyChillOrFreeze(enemy, stacks = 1, durMult = 1.0) {
  if (!enemy || enemy.freezeTimer > 0) return;
  enemy.chillStacks = (enemy.chillStacks || 0) + stacks;
  if (enemy.chillStacks >= 3) {
    enemy.chillStacks = 0;
    const isBoss = enemy.isElite || enemy.isMegaBoss || enemy.isFinalBoss;
    enemy.freezeTimer = (isBoss ? BASE_STATUS_DUR * 0.5 : BASE_STATUS_DUR) * durMult;
  }
}

function applyHolySeal(enemy, addStacks = 1) {
  if (!enemy) return;
  enemy.holySeal = Math.min(3, (enemy.holySeal || 0) + addStacks);
}

/**
 * 判定聖印是否引爆
 * 條件：超武命中時，必須同時符合「造成傷害」且「成功觸發異常」
 * @param {object} enemy - 目標敵人
 * @param {boolean} dealtDamage - 是否成功造成傷害
 * @param {number} baseChance - 基礎異常觸發機率
 * @param {number} mrChanceBonus - 來自 MR 的機率加成
 * @returns {boolean} 是否成功引爆聖印
 */
function tryTriggerHolyResonance(enemy, dealtDamage, baseChance = 0.35, mrChanceBonus = 0) {
  if (!enemy || (enemy.holySeal || 0) <= 0) return false;
  if (!dealtDamage) return false; // 必須同時滿足傷害條件
  
  // 必須同時滿足異常觸發條件
  if (!rollStatusChance(baseChance, mrChanceBonus)) return false;

  // 成功引爆：清除或消耗聖印層數並觸發效果
  enemy.holySeal = 0;
  return true;
}

function calcStatusDamageMods(enemy, element, isStrikeOrLight) {
  const tag = normalizeStatusTag(element);
  let addBonus = 0;
  let endMult = 1.0;
  if ((enemy.holySeal || 0) >= 1 && (tag === 'holy' || isStrikeOrLight)) addBonus += 0.20;
  if (enemy.armorBreakTimer > 0) endMult *= 1.25;
  return { addMult: 1 + addBonus, endMult };
}

/**
 * 判定異常狀態是否成功觸發
 * 裸體且素質為 0 時預設底線為 10% (0.1)，最高上限 85% (0.85)
 */
function rollStatusChance(baseChance, mrChanceBonus = 0) {
  const effectiveBase = (baseChance !== undefined && baseChance !== null) ? baseChance : 0.10;
  return Math.random() < Math.min(0.85, effectiveBase + mrChanceBonus);
}

/**
 * 計算防禦與減傷邏輯（怪物傷害僅分為碰撞與射彈）
 * @param {object} playerStats - 玩家當前素質物件
 * @param {string} damageType - 傷害類型 ('collision' 近身碰撞 | 'projectile' 遠距射彈)
 * @returns {number} 減傷百分配比 (0.0 ~ 0.70)
 */
function calculateMitigation(playerStats, damageType) {
  if (!playerStats) return 0;
  if (damageType === 'collision') {
    // DEF (物理防禦) 專職應對怪物的近身碰撞傷害，上限 70%
    const defValue = playerStats.DEF || 0;
    return Math.min(0.70, defValue * 0.005);
  } else if (damageType === 'projectile') {
    // MR (魔法防禦) 專職應對怪物的遠距射彈傷害，上限 70%
    const mrValue = playerStats.MR || 0;
    return Math.min(0.70, mrValue * 0.005);
  }
  return 0;
}

/**
 * 計算 DEF 帶來的最大生命值加成
 * 每點 DEF 提供 +3 Max HP
 */
function calculateMaxHpBonus(defValue) {
  return (defValue || 0) * 3;
}

function applyStatusTagsOnHit(enemy, statusTags, spellBase, stats, baseChance = 0.35, options = {}) {
  if (!enemy || !statusTags) return;
  const tagList = Array.isArray(statusTags) ? statusTags : [statusTags];
  const durMult = (stats && stats.statusDurMult) || 1.0;
  const mrChance = (stats && stats.statusChanceBonus) || 0;

  for (const rawTag of tagList) {
    const tag = normalizeStatusTag(rawTag);
    if (!tag || tag === 'none') continue;
    if (tag === 'armor_break') {
      const abChance = options.armorBreakChance ?? 0.65;
      if (rollStatusChance(abChance, mrChance)) {
        enemy.armorBreakTimer = Math.max(enemy.armorBreakTimer || 0, BASE_STATUS_DUR * durMult);
      }
      continue;
    }
    if (!rollStatusChance(baseChance, mrChance)) continue;
    if (tag === 'fire') {
      enemy.burnTimer = Math.max(enemy.burnTimer || 0, BASE_STATUS_DUR * durMult);
      enemy.burnDps = Math.max(enemy.burnDps || 0, spellBase * 0.90);
    } else if (tag === 'ice') {
      applyChillOrFreeze(enemy, options.chillStacks || 1, durMult);
    } else if (tag === 'lightning') {
      enemy.shockTimer = Math.max(enemy.shockTimer || 0, BASE_STATUS_DUR * durMult);
    } else if (tag === 'wind') {
      enemy.windTimer = Math.max(enemy.windTimer || 0, BASE_STATUS_DUR * durMult);
      enemy.windDps = Math.max(enemy.windDps || 0, spellBase * 0.36);
    } else if (tag === 'holy') {
      applyHolySeal(enemy, options.sealStacks ?? (options.isMelee ? 2 : 1));
    } else if (tag === 'dark') {
      enemy.darkTimer = Math.max(enemy.darkTimer || 0, BASE_STATUS_DUR * durMult);
      enemy.darkDps = Math.max(enemy.darkDps || 0, spellBase * 0.32);
    }
  }
}

function applyBaseStatusOnHit(enemy, element, spellBase, stats, baseChance = 0.35, options = {}) {
  applyStatusTagsOnHit(enemy, element, spellBase, stats, baseChance, options);
}

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

function getEnemyAtkFactor(enemy) {
  if (!enemy) return 1.0;
  return (enemy.holySeal || 0) >= 1 ? 0.85 : 1.0;
}

function getResonanceParams(elem) {
  const tag = normalizeStatusTag(elem);
  const tier = getAwakenedTier(tag);
  if (tier <= 0) return null;
  const idx = Math.min(4, Math.max(0, tier - 1));
  if (tag === 'fire') return { tier, mult: [1.50, 1.80, 2.15, 2.50, 2.90][idx], radius: 115 };
  if (tag === 'ice') return { tier, mult: [2.80, 3.40, 4.10, 4.80, 5.60][idx] };
  if (tag === 'lightning') return { tier, mult: [1.35, 1.65, 2.00, 2.35, 2.75][idx], jumps: [3, 4, 5, 6, 7][idx], icd: 0.25 };
  if (tag === 'holy') {
    return {
      tier,
      polyMult: [2.60, 3.20, 3.90, 4.60, 5.40][idx],
      hammerMult: [2.50, 3.10, 3.80, 4.50, 5.20][idx],
      waveRadiusBonus: [0, 0.10, 0.20, 0.30, 0.40][idx],
      waveSealChance: [0.35, 0.40, 0.45, 0.50, 0.55][idx]
    };
  }
  return null;
}

```
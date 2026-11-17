// V2.4 全遊戲五大屬性異常與超武覺醒共鳴引擎
const STATUS_DB = {
  ignite:     { id: 'ignite',     name: '🔥 點燃',     evoName: '烈焰殉爆' },
  freeze:     { id: 'freeze',     name: '❄️ 凍結',     evoName: '碎冰處決' },
  shock:      { id: 'shock',      name: '⚡ 感電',     evoName: '九霄連鎖感電' },
  holySeal:   { id: 'holySeal',   name: '✨ 聖印',     evoName: '聖光淨化共鳴' },
  armorBreak: { id: 'armorBreak', name: '🔨 破甲弱化', evoName: '末端獨立易傷乘區' }
};

function initEnemyStatus(enemy) {
  enemy.burnTimer = 0; enemy.burnTick = 0; enemy.burnDps = 0;
  enemy.chillStacks = 0; enemy.freezeTimer = 0;
  enemy.shockTimer = 0; enemy.chainIcd = 0;
  enemy.slowTimer = 0;
  enemy.holySeal = 0;
  enemy.armorBreakTimer = 0;
  enemy.stunTimer = 0;
}

// 判斷對應超武覺醒共鳴等級（0 = 未覺醒，1~3 = 超武等級）
function getAwakenedTier(elem) {
  if (typeof ownedSkills === 'undefined') return 0;
  if (elem === 'fire') {
    if (ownedSkills.fire5) return ownedSkills.fire5.lv || 1;
    if (ownedSkills.renga && ownedSkills.renga.evolved && ownedSkills.firearrow) return 1;
  } else if (elem === 'ice') {
    if (ownedSkills.ice5) return ownedSkills.ice5.lv || 1;
  } else if (elem === 'thunder') {
    if (ownedSkills.thunder5) return ownedSkills.thunder5.lv || 1;
    if (ownedSkills.aurora && ownedSkills.aurora.evolved && ownedSkills.thunder) return 1;
  } else if (elem === 'light') {
    const lvA = ownedSkills.holypoly ? (ownedSkills.holypoly.lv || 1) : 0;
    const lvB = ownedSkills.frenzyhammer ? (ownedSkills.frenzyhammer.lv || 1) : 0;
    return Math.max(lvA, lvB);
  }
  return 0;
}

// 疊加【寒氣】與轉化【凍結】（上限 3 層寒氣轉硬控場凍結）
function applyChillOrFreeze(enemy, stacks = 1, durMult = 1.0) {
  if (!enemy || enemy.freezeTimer > 0) return;
  enemy.chillStacks = (enemy.chillStacks || 0) + stacks;
  if (enemy.chillStacks >= 3) {
    enemy.chillStacks = 0;
    const isBoss = enemy.isElite || enemy.isMegaBoss || enemy.isFinalBoss;
    enemy.freezeTimer = (isBoss ? 1.1 : 2.4) * durMult;
  }
}
// 疊加【聖印】（遠程/領域 +1 層、近戰打擊 +2 層，上限 3 層）
function applyHolySeal(enemy, addStacks = 1) {
  if (!enemy) return;
  enemy.holySeal = Math.min(3, (enemy.holySeal || 0) + addStacks);
}

// 計算異常狀態對「基礎增傷加算區」與「末端破甲獨立乘區」的修正
function calcStatusDamageMods(enemy, element, isStrikeOrLight) {
  let addBonus = 0;
  let endMult = 1.0;

  // 1. 感電：常駐承受所有傷害 +12%（九霄連鎖感電覺醒後 +20%）
  if (enemy.shockTimer > 0) {
    const tTier = getAwakenedTier('thunder');
    addBonus += (tTier > 0 ? 0.20 : 0.12);
  }

  // 2. 聖印：掛上 1 層即生效，受到光／打擊系攻擊承受額外 +20% 傷害
  if ((enemy.holySeal || 0) >= 1 && (element === 'light' || isStrikeOrLight)) {
    addBonus += 0.20;
  }

  // 3. 破甲／弱化：傷害公式最末端提供 ×1.25（+25%）獨立全屬性易傷乘區
  if (enemy.armorBreakTimer > 0) {
    endMult *= 1.25;
  }

  return { addMult: 1 + addBonus, endMult };
}

// 異常觸發機率（基礎率 + MR 精神副能力加成，絕不強制 100% 必中）
function rollStatusChance(baseChance, mrChanceBonus = 0) {
  return Math.random() < Math.min(0.85, baseChance + mrChanceBonus);
}

// 命中時掛載基礎異常狀態（V2.4 鐵則：未合成超武前僅掛載基礎異常）
function applyBaseStatusOnHit(enemy, element, spellBase, stats, baseChance = 0.35, options = {}) {
  if (!enemy) return;
  const durMult = stats.statusDurMult || 1.0;
  const mrChance = stats.statusChanceBonus || 0;
  if (!rollStatusChance(baseChance, mrChance)) return;

  if (element === 'fire') {
    enemy.burnTimer = Math.max(enemy.burnTimer || 0, 3.0 * durMult);
    enemy.burnDps = Math.max(enemy.burnDps || 0, spellBase * 0.45);
  } else if (element === 'ice') {
    applyChillOrFreeze(enemy, options.chillStacks || 1, durMult);
  } else if (element === 'thunder') {
    enemy.shockTimer = Math.max(enemy.shockTimer || 0, 4.0 * durMult);
  } else if (element === 'light') {
    applyHolySeal(enemy, options.sealStacks || 1);
  } else if (element === 'wind') {
    enemy.slowTimer = Math.max(enemy.slowTimer || 0, 2.5 * durMult);
  }
}
// 查詢敵人當前減速倍率（感電 -20% / 超武 -25%，首領減半；凍結/暈眩完全定身）
function getEnemySpeedFactor(enemy) {
  if (!enemy) return 1.0;
  if (enemy.freezeTimer > 0 || enemy.stunTimer > 0) return 0;
  let factor = 1.0;
  const isBoss = enemy.isElite || enemy.isMegaBoss || enemy.isFinalBoss;
  if (enemy.shockTimer > 0) {
    const tTier = getAwakenedTier('thunder');
    const pen = (tTier > 0 ? 0.25 : 0.20) * (isBoss ? 0.5 : 1.0);
    factor *= (1 - pen);
  }
  if (enemy.slowTimer > 0) {
    factor *= (isBoss ? 0.82 : 0.65);
  }
  return Math.max(0.15, factor);
}

// 查詢敵人當前攻擊力修正（聖印掛 1 層即降低敵人碰撞與投射物攻擊力 -15%）
function getEnemyAtkFactor(enemy) {
  if (!enemy) return 1.0;
  return (enemy.holySeal || 0) >= 1 ? 0.85 : 1.0;
}

// 查詢各超武覺醒共鳴數值參數（Lv.1 -> Lv.2 -> Lv.3）
function getResonanceParams(elem) {
  const tier = getAwakenedTier(elem);
  if (tier <= 0) return null;
  const idx = Math.min(2, tier - 1);
  if (elem === 'fire') {
    return { tier, mult: [1.80, 2.15, 2.50][idx], radius: 115 };
  }
  if (elem === 'ice') {
    return { tier, mult: [3.50, 4.30, 5.20][idx] };
  }
  if (elem === 'thunder') {
    return { tier, mult: [1.60, 2.00, 2.40][idx], jumps: [4, 5, 6][idx], icd: 0.25 };
  }
  if (elem === 'light') {
    const polyTier = (typeof ownedSkills !== 'undefined' && ownedSkills.holypoly) ? ownedSkills.holypoly.lv : 0;
    const hamTier = (typeof ownedSkills !== 'undefined' && ownedSkills.frenzyhammer) ? ownedSkills.frenzyhammer.lv : 0;
    const pIdx = Math.min(2, Math.max(0, polyTier - 1));
    const hIdx = Math.min(2, Math.max(0, hamTier - 1));
    return {
      tier,
      polyMult: [3.20, 4.00, 5.00][pIdx],
      hammerMult: [3.00, 3.80, 4.80][hIdx],
      waveRadiusBonus: [0, 0.20, 0.40][pIdx],
      waveSealChance: [0.35, 0.45, 0.55][pIdx]
    };
  }
  return null;
}

// ============================================================================
// core/game.js — 戰鬥狀態、輸入與每幀更新順序
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resize() {
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  if (battleSceneActive) draw();
}
window.addEventListener('resize', resize);

const ACTIVE_SKILLS = getActiveSkillPool();
const MAX_ACTIVE_SKILLS = 5;
const MAX_PASSIVE_SKILLS = 7;

let isPaused = true, gameOver = false, gameTime = 0, kills = 0;
let battleSceneActive = false, battleFrameId = null, lastBattleFrame = null, updatingBattleFrame = false;
let routeUpgradeMisses = 0;
let routeOffer = null;
let bossSpawned = false, currentChoices = [], bannerTimer = 0, spawnTimer = 0.5;
let lastEliteMin = 0, lastMegaBossMin = 0;
let victoryVacuumActive = false, victoryVacuumTimer = 0;
let victorySaveRetryTimer = 0;

function triggerVictoryVacuum() {
  victoryVacuumActive = true;
  victoryVacuumTimer = 0;
  victorySaveRetryTimer = 0;
  showBanner('🎉 討伐成功！全區戰利品自動回收中...');
}

const INITIAL_BATTLE_PLAYER = {
  x: 0, y: 0, size: 28, baseSpeed: 235,
  hp: 200, maxHp: 200, shield: 0, maxShield: 0, shieldTimer: 0, thornsCd: 0,
  regen: 0, lv: 1, exp: 0, nextExp: 5, pickupRange: 115,
  facingAngle: 0, lastMoveAngle: 0, flipX: 1, walkCycle: 0,
  dmgMult: 1.0, cdMult: 1.0, areaMult: 1.0, speedMult: 1.0,
  bonusCritRate: 0, bonusDoubleHit: 0, superCritMult: 1.5, resonanceDmgMult: 1.0,
  dropRateMult: 1.0, expMult: 1.0, curseMult: 1.0, seedMult: 1.0, angelUsed: false
};
const player = { ...INITIAL_BATTLE_PLAYER };

// 計算實際冷卻倍率（套用全域冷卻縮減 65% 硬上限，最低保留 0.35x 冷卻）
function getEffectiveCdMult(extraFactor = 1.0) {
  return Math.max(0.35, player.cdMult * extraFactor);
}

// 計算物理（碰撞）減傷百分比（上限 70%，含小愛光之壁障術、路西安萊格藍治之護、希培林銅體與力量紋章代價）
function getEffectivePhysReducePct(cs) {
  const basePct = (cs && cs.physReducePct) ? cs.physReducePct : 0;
  const wallLv = (typeof ownedPassives !== 'undefined' && ownedPassives.lightWall) ? ownedPassives.lightWall : 0;
  const guardLv = (typeof ownedPassives !== 'undefined' && ownedPassives.guard) ? ownedPassives.guard : 0;
  const bronzeLv = (typeof ownedPassives !== 'undefined' && ownedPassives.bronzeBody) ? ownedPassives.bronzeBody : 0;
  const crestLv = (typeof ownedPassives !== 'undefined' && ownedPassives.powerCrest) ? ownedPassives.powerCrest : 0;
  const rawMult = (1 - basePct / 100) * Math.pow(0.97, wallLv + guardLv + bronzeLv);
  const netPct = Math.round((1 - rawMult) * 100) - crestLv * 4;
  return Math.max(0, Math.min(70, netPct));
}

// 計算魔法（射彈）減傷百分比（上限 70%，含小愛魔法盾牌、路西安萊格藍治之護與力量紋章代價）
function getEffectiveMagReducePct(cs) {
  const basePct = (cs && cs.magReducePct) ? cs.magReducePct : 0;
  const msLv = (typeof ownedPassives !== 'undefined' && ownedPassives.magicShield) ? ownedPassives.magicShield : 0;
  const guardLv = (typeof ownedPassives !== 'undefined' && ownedPassives.guard) ? ownedPassives.guard : 0;
  const crestLv = (typeof ownedPassives !== 'undefined' && ownedPassives.powerCrest) ? ownedPassives.powerCrest : 0;
  const rawMult = (1 - basePct / 100) * Math.pow(0.97, msLv) * Math.pow(0.985, guardLv);
  const netPct = Math.round((1 - rawMult) * 100) - crestLv * 3;
  return Math.max(0, Math.min(70, netPct));
}

// 【前端標籤中文化對照字典】底層使用英文代碼，前端自動渲染為繁體中文
const BEHAVIOR_TAG_CN = {
  melee: '近戰', ranged: '遠程', projectile: '射彈',
  aoe: '範圍', zone: '領域', physical: '物理', magic: '魔法', knockback: '擊退'
};

const ELEMENT_TAG_CN = {
  fire: '火系', ice: '冰系', lightning: '雷系', wind: '風系',
  holy: '聖光', armor_break: '破甲', dark: '暗影', none: '無屬性'
};

function getLocalizedSkillTags(sk) {
  const parts = [];
  if (sk.statTags && sk.statTags.length > 0) parts.push(sk.statTags.join('+'));
  if (sk.type) parts.push(BEHAVIOR_TAG_CN[sk.type] || sk.type);
  if (sk.element && sk.element !== 'none') parts.push(ELEMENT_TAG_CN[sk.element] || sk.element);
  if (sk.behaviorTags && sk.behaviorTags.length > 0) {
    sk.behaviorTags.forEach(bt => parts.push(BEHAVIOR_TAG_CN[bt] || bt));
  }
  return parts.join('・');
}

upgradeClassicHud();

window.EQUIPPED_WEAPON = window.EQUIPPED_WEAPON || { name: '學徒長劍', startSkill: 'senku' };
const ownedSkills = { [EQUIPPED_WEAPON.startSkill]: { lv: 1, evolved: false, disabled: false } };
const ownedPassives = {};
let enemies = [], slashes = [], projectiles = [], enemyProjectiles = [], lightnings = [], zones = [], damageTexts = [], gems = [], chests = [];
let lootBags = [], runLoot = [], seedBags = [], runSeed = 0, rerollCount = 0, delayedActions = [];
let fieldItems = [], fieldMagnetTimer = 0;
const keys = {};
window.addEventListener('keydown', e => {
  if (!battleSceneActive) return;
  keys[e.code] = true;
  if (gameOver && e.code === 'KeyR') { returnFromBattleToTown(); return; }
  if (!gameOver && (e.code === 'Escape' || e.code === 'KeyP') && document.getElementById('levelModal').style.display !== 'flex') {
    togglePause(); return;
  }
  if (isPaused && !gameOver) {
    if (document.getElementById('levelModal').style.display === 'flex') {
      if (e.code === 'Digit1') selectUpgrade(0);
      if (e.code === 'Digit2') selectUpgrade(1);
      if (e.code === 'Digit3') selectUpgrade(2);
    }
    return;
  }
  if (!isPaused && !gameOver) {
    if (e.code === 'KeyL') { player.lv++; levelUp(); }
    if (e.code === 'KeyB') spawnEliteBoss('elite');
    if (e.code === 'KeyG') spawnEliteBoss('mega');
    if (e.code === 'KeyT') gameTime += 60;
  }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

let isMouseMoving = false;
let mouseScreenX = 0, mouseScreenY = 0;
let battleClickTarget = null;

function recordBattleMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  mouseScreenX = e.clientX - rect.left;
  mouseScreenY = e.clientY - rect.top;
  battleClickTarget = {
    x: player.x + (mouseScreenX - canvas.width / 2),
    y: player.y + (mouseScreenY - canvas.height / 2)
  };
}

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0 || !battleSceneActive || isPaused || gameOver) return;
  e.preventDefault();
  isMouseMoving = true;
  recordBattleMousePos(e);
});
window.addEventListener('mousemove', e => {
  if (!isMouseMoving) return;
  if ((e.buttons & 1) === 0 || isPaused || gameOver) { isMouseMoving = false; return; }
  recordBattleMousePos(e);
});
window.addEventListener('mouseup', e => {
  if (e.button === 0) isMouseMoving = false; // 放開左鍵只結束長按追蹤，保留最後點擊位置讓角色走完
});
window.addEventListener('blur', () => { isMouseMoving = false; });

function update(dt) {
  if (isPaused || gameOver) return;
  if (!victoryVacuumActive) gameTime += dt;
  if (bannerTimer > 0 && (bannerTimer -= dt) <= 0) document.getElementById('banner').style.display = 'none';
  if (player.thornsCd > 0) player.thornsCd -= dt;
  if (player.crimsonHeartIcd > 0) player.crimsonHeartIcd -= dt;
  if (player.regen > 0) player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);

  const provokeLv = (typeof ownedPassives !== 'undefined' && ownedPassives.provoke) || 0;
  if (provokeLv > 0 && !victoryVacuumActive && enemies.length > 0) {
    player.provokeTimer = (player.provokeTimer || 0) - dt;
    if (player.provokeTimer <= 0) {
      player.provokeTimer = 0.33;
      const pRad = (130 + provokeLv * 15) * (player.areaMult || 1.0);
      const pChance = provokeLv * 0.06;
      const durMult = (typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats().statusDurMult : 1.0) || 1.0;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e || e.isDead || (e.statusImmuneTimer || 0) > 0) continue;
        if (Math.hypot(e.x - player.x, e.y - player.y) <= pRad + e.radius && Math.random() < pChance) {
          e.armorBreakTimer = Math.max(e.armorBreakTimer || 0, 3.0 * durMult);
        }
      }
    }
  }

  const isSandbox = typeof SANDBOX_STATE !== 'undefined' && SANDBOX_STATE.active;
  if (isSandbox) {
    if (typeof tickSandboxDps === 'function') tickSandboxDps(dt);
  } else if (!victoryVacuumActive) {
    updateBossSpawns();
  }

  let mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let my = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  if (isMouseMoving) {
    battleClickTarget = {
      x: player.x + (mouseScreenX - canvas.width / 2),
      y: player.y + (mouseScreenY - canvas.height / 2)
    };
  }
  if (mx || my) {
    isMouseMoving = false;
    battleClickTarget = null;
    const l = Math.hypot(mx, my);
    player.x += (mx / l) * player.baseSpeed * player.speedMult * dt;
    player.y += (my / l) * player.baseSpeed * player.speedMult * dt;
    player.lastMoveAngle = Math.atan2(my, mx);
    if (!enemies.length) player.facingAngle = player.lastMoveAngle;
    if (mx) player.flipX = mx > 0 ? 1 : -1;
    player.walkCycle += dt * 14;
  } else if (battleClickTarget) {
    const dx = battleClickTarget.x - player.x, dy = battleClickTarget.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 8) {
      const vx = dx / dist, vy = dy / dist;
      player.x += vx * player.baseSpeed * player.speedMult * dt;
      player.y += vy * player.baseSpeed * player.speedMult * dt;
      player.lastMoveAngle = Math.atan2(vy, vx);
      if (!enemies.length) player.facingAngle = player.lastMoveAngle;
      if (Math.abs(vx) > 0.05) player.flipX = vx > 0 ? 1 : -1;
      player.walkCycle += dt * 14;
    } else {
      if (!isMouseMoving) battleClickTarget = null;
      player.walkCycle = 0;
    }
  } else player.walkCycle = 0;

  if (victoryVacuumActive) {
    collectFieldLoot(dt);
    return;
  }

  if (!isSandbox) updateRegularSpawns(dt);

  if (delayedActions.length > 0) {
    delayedActions = delayedActions.filter(act => {
      if ((act.delay -= dt) <= 0) { act.fn(); return false; }
      return true;
    });
  }

  triggerSkills(dt);

  const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { statusDurMult: 1, statusChanceBonus: 0, st: {} };
  const spellBase = getSpellBase();

  updateBattleZones(dt, cs, spellBase);
  updatePlayerProjectiles(dt, cs, spellBase);

  const msLv = ownedPassives.manaShield || 0;
  if (msLv > 0) {
    player.maxShield = Math.round(player.maxHp * (0.10 + msLv * 0.05));
    if ((player.shieldTimer -= dt) <= 0) { player.shield = player.maxShield; player.shieldTimer = Math.max(5, 13 - msLv); }
  }

  const physRedMult = 1 - getEffectivePhysReducePct(cs) / 100;
  const magRedMult = 1 - getEffectiveMagReducePct(cs) / 100;
  if (!updateEnemies(dt, isSandbox, cs, spellBase, physRedMult)) return;
  updateEnemyProjectiles(dt, isSandbox, magRedMult);
  if (battleSceneActive && !gameOver) collectFieldLoot(dt);
}

function isFirstStageBalanceTrial() {
  const run = window.ACTIVE_STAGE_RUN;
  return run?.stage.id === 'penine_forest' && run.diff.key === 'normal' && !run.sandbox;
}

function cancelBattleFrame() {
  if (battleFrameId !== null) cancelAnimationFrame(battleFrameId);
  battleFrameId = null;
  lastBattleFrame = null;
}

function resetBattleRun() {
  cancelBattleFrame();
  battleSceneActive = false;
  isPaused = true;
  gameOver = bossSpawned = victoryVacuumActive = false;
  gameTime = kills = lastEliteMin = lastMegaBossMin = bannerTimer = 0;
  victoryVacuumTimer = victorySaveRetryTimer = fieldMagnetTimer = runSeed = rerollCount = routeUpgradeMisses = 0;
  routeOffer = null;
  spawnTimer = 0.5;
  currentChoices = []; delayedActions = [];
  enemies = []; slashes = []; projectiles = []; enemyProjectiles = [];
  lightnings = []; zones = []; damageTexts = [];
  gems = []; chests = []; lootBags = []; runLoot = []; seedBags = []; fieldItems = [];
  Object.assign(player, INITIAL_BATTLE_PLAYER);
  delete player.dirInfo;
  for (const key of Object.keys(keys)) delete keys[key];
  battleClickTarget = null;
  isMouseMoving = false;
  for (const id of ['banner', 'pauseModal', 'levelModal', 'endModal']) document.getElementById(id).style.display = 'none';
  hideSkillTooltip();
}

function enterBattleScene() {
  battleSceneActive = true;
  draw();
  setBattlePaused(false);
}

function leaveBattleScene() {
  resetBattleRun();
  window.ACTIVE_STAGE_RUN = null;
}

function setBattlePaused(paused) {
  isPaused = paused;
  if (paused || !battleSceneActive || gameOver) {
    cancelBattleFrame();
    if (battleSceneActive && !updatingBattleFrame) draw();
  } else if (battleFrameId === null && !updatingBattleFrame) {
    battleFrameId = requestAnimationFrame(runBattleFrame);
  }
}

function runBattleFrame(now) {
  battleFrameId = null;
  if (!battleSceneActive || isPaused || gameOver) return;
  const dt = lastBattleFrame === null ? 0 : Math.min(0.05, (now - lastBattleFrame) / 1000);
  lastBattleFrame = now;
  updatingBattleFrame = true;
  try {
    update(dt);
    if (battleSceneActive) draw();
  } finally {
    updatingBattleFrame = false;
  }
  if (battleSceneActive && !isPaused && !gameOver) battleFrameId = requestAnimationFrame(runBattleFrame);
}

resize();

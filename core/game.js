// ============================================================================
// core/game.js — 遊戲主迴圈、全域狀態定義與物理刷怪排程（瘦身模組化版）
// ============================================================================

// [第 1 段：畫布初始化、全域狀態、減傷冷卻上限、標籤字典與鍵盤監聽（第 1 ～ 75 行）]
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

const ACTIVE_SKILLS = getActiveSkillPool();
const MAX_ACTIVE_SKILLS = 5;
const MAX_PASSIVE_SKILLS = 7;

let isPaused = true, gameOver = false, gameTime = 0, kills = 0;
let bossSpawned = false, currentChoices = [], bannerTimer = 0, spawnTimer = 0.5;
let lastEliteMin = 0, lastMegaBossMin = 0;
let victoryVacuumActive = false, victoryVacuumTimer = 0;

function triggerVictoryVacuum() {
  victoryVacuumActive = true;
  victoryVacuumTimer = 0;
  showBanner('🎉 討伐成功！全區戰利品自動回收中...');
}

const player = {
  x: 0, y: 0, size: 28, baseSpeed: 235,
  hp: 200, maxHp: 200, shield: 0, maxShield: 0, shieldTimer: 0, thornsCd: 0,
  regen: 0, lv: 1, exp: 0, nextExp: 5, pickupRange: 115,
  facingAngle: 0, lastMoveAngle: 0, flipX: 1, walkCycle: 0,
  dmgMult: 1.0, cdMult: 1.0, areaMult: 1.0, speedMult: 1.0,
  bonusCritRate: 0, bonusDoubleHit: 0, superCritMult: 1.5, resonanceDmgMult: 1.0,
  dropRateMult: 1.0, expMult: 1.0, curseMult: 1.0, seedMult: 1.0, angelUsed: false
};

// 計算實際冷卻倍率（套用全域冷卻縮減 65% 硬上限，最低保留 0.35x 冷卻）
function getEffectiveCdMult(extraFactor = 1.0) {
  return Math.max(0.35, player.cdMult * extraFactor);
}

// 計算物理（碰撞）減傷百分比（上限 70%，含小愛光之壁障術與路西安萊格藍治之護）
function getEffectivePhysReducePct(cs) {
  const basePct = (cs && cs.physReducePct) ? cs.physReducePct : 0;
  const wallLv = (typeof ownedPassives !== 'undefined' && ownedPassives.lightWall) ? ownedPassives.lightWall : 0;
  const guardLv = (typeof ownedPassives !== 'undefined' && ownedPassives.guard) ? ownedPassives.guard : 0;
  const rawMult = (1 - basePct / 100) * Math.pow(0.97, wallLv + guardLv);
  return Math.min(70, Math.round((1 - rawMult) * 100));
}

// 計算魔法（射彈）減傷百分比（上限 70%，含小愛魔法盾牌與路西安萊格藍治之護）
function getEffectiveMagReducePct(cs) {
  const basePct = (cs && cs.magReducePct) ? cs.magReducePct : 0;
  const msLv = (typeof ownedPassives !== 'undefined' && ownedPassives.magicShield) ? ownedPassives.magicShield : 0;
  const guardLv = (typeof ownedPassives !== 'undefined' && ownedPassives.guard) ? ownedPassives.guard : 0;
  const rawMult = (1 - basePct / 100) * Math.pow(0.97, msLv) * Math.pow(0.985, guardLv);
  return Math.min(70, Math.round((1 - rawMult) * 100));
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
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (gameOver && e.code === 'KeyR') location.reload();
  if (!gameOver && (e.code === 'Escape' || e.code === 'KeyP') && document.getElementById('levelModal').style.display !== 'flex' && document.getElementById('lobbyModal').style.display !== 'flex') {
    togglePause(); return;
  }
  if (isPaused && !gameOver) {
    if (e.code === 'Digit1') selectUpgrade(0);
    if (e.code === 'Digit2') selectUpgrade(1);
    if (e.code === 'Digit3') selectUpgrade(2);
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
// [第 2 段：update() 主更新前半段 — 時間軸、移動、領域與玩家射彈（接續第 75 行至第 175 行）]
function update(dt) {
  if (isPaused || gameOver) return;
  gameTime += dt; if (bannerTimer > 0 && (bannerTimer -= dt) <= 0) document.getElementById('banner').style.display = 'none';
  if (player.thornsCd > 0) player.thornsCd -= dt;
  if (player.regen > 0) player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);

  const isSandbox = typeof SANDBOX_STATE !== 'undefined' && SANDBOX_STATE.active;
  if (isSandbox) {
    if (typeof tickSandboxDps === 'function') tickSandboxDps(dt);
  } else {
    const mins = Math.floor(gameTime / 60);
    if (mins >= 20 && !bossSpawned) { bossSpawned = true; spawnEliteBoss('final'); }
    else if (mins > 0 && mins % 5 === 0 && mins !== lastMegaBossMin && mins < 20) { lastMegaBossMin = mins; spawnEliteBoss('mega'); }
    else if (mins > 0 && mins % 2 === 0 && mins % 5 !== 0 && mins !== lastEliteMin && mins < 20) { lastEliteMin = mins; spawnEliteBoss('elite'); }
  }

  let mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let my = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  if (mx || my) {
    const l = Math.hypot(mx, my);
    player.x += (mx / l) * player.baseSpeed * player.speedMult * dt;
    player.y += (my / l) * player.baseSpeed * player.speedMult * dt;
    player.lastMoveAngle = Math.atan2(my, mx);
    if (!enemies.length) player.facingAngle = player.lastMoveAngle;
    if (mx) player.flipX = mx > 0 ? 1 : -1;
    player.walkCycle += dt * 14;
  } else player.walkCycle = 0;

  if (!isSandbox && (spawnTimer -= dt) <= 0) {
    spawnEnemy();
    const curMins = gameTime / 60;
    const baseCd = curMins < 3 ? 0.70 : (curMins < 8 ? 0.55 : (curMins < 15 ? 0.48 : 0.40));
    spawnTimer = Math.max(0.20, baseCd / (player.curseMult || 1.0));
  }

  if (delayedActions.length > 0) {
    delayedActions = delayedActions.filter(act => {
      if ((act.delay -= dt) <= 0) { act.fn(); return false; }
      return true;
    });
  }

  triggerSkills(dt);

  const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { statusDurMult: 1, statusChanceBonus: 0, st: {} };
  const spellBase = getSpellBase();

  zones = zones.filter(z => {
    z.life -= dt; z.tickTimer -= dt;
    if (z.kind === 'spiral_hammer') {
      z.x = player.x;
      z.y = player.y;
      z.spinAngle = (z.spinAngle || 0) + dt * 11.5;
      if (z.tickTimer <= 0) {
        z.tickTimer = 0.30;
        damageArea(z.x, z.y, z.radius, 0, Math.PI * 2, z.dmg, z.kbPower, {
          element: 'none',
          isPhysSkill: true,
          isStrike: true,
          hasKnockback: true,
          onTargetHit: (e) => {
            if (Array.isArray(z.statusTags) && z.statusTags.length > 0) {
              applyStatusTagsOnHit(e, z.statusTags, spellBase, cs, { isMelee: true });
            }
          }
        });
      }
      return z.life > 0;
    }
    if (z.kind === 'thunder2') {
      z.x = player.x; z.y = player.y;
      z.elapsed = (z.elapsed || 0) + dt;
      const isOut = z.elapsed <= 0.70;
      if (isOut) {
        z.radius = 25 + (z.maxRadius - 25) * Math.min(1, z.elapsed / 0.70);
      } else {
        z.radius = z.maxRadius * Math.max(0, 1 - (z.elapsed - 0.70) / 0.30);
      }
      const hitSet = isOut ? z.outHitSet : z.inHitSet;
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e.isDead && !hitSet.has(e) && Math.hypot(e.x - z.x, e.y - z.y) <= z.radius + e.radius) {
          hitSet.add(e);
          applyStatusTagsOnHit(e, 'lightning', spellBase, cs);
          hitEnemy(i, z.dmg * 0.65, { element: 'lightning' });
        }
      }
      return z.life > 0;
    }
    if (z.kind === 'wind_vortex') {
      for (const e of enemies) {
        const dx = z.x - e.x, dy = z.y - e.y, dist = Math.hypot(dx, dy);
        if (dist <= z.radius + e.radius) {
          e.windUnbalanceTimer = Math.max(e.windUnbalanceTimer || 0, 1.0);
          if (!e.isDummy && dist > 14) {
            const pullSpeed = z.pullForce || 62;
            e.x += (dx / dist) * pullSpeed * dt;
            e.y += (dy / dist) * pullSpeed * dt;
          }
        }
      }
      if (z.tickTimer <= 0) {
        z.tickTimer = 0.5;
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (Math.hypot(e.x - z.x, e.y - z.y) <= z.radius + e.radius) {
            hitEnemy(j, z.dmg, { element: 'wind', noCrit: true });
          }
        }
      }
    } else if (z.kind === 'holypoly') {
      for (const e of enemies) {
        const d = Math.hypot(z.x - e.x, z.y - e.y);
        if (d < z.radius && d > 12) { const a = Math.atan2(z.y - e.y, z.x - e.x); e.x += Math.cos(a) * 95 * dt; e.y += Math.sin(a) * 95 * dt; }
      }
    }
    if (z.kind === 'healLight' && Math.hypot(player.x - z.x, player.y - z.y) <= z.radius) {
      const healPct = Math.min(0.020, 0.008 + Math.floor((z.lv - 1) / 2) * 0.003);
      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * healPct * dt);
    }
    if (z.tickTimer <= 0) {
      z.tickTimer = z.kind === 'holypoly' ? 1.0 : 0.5;
      if (z.kind === 'dark_pool') {
        damageArea(z.x, z.y, z.radius, 0, Math.PI * 2, z.dmg, 0, { element: 'dark', isDot: true });
      } else if (z.kind === 'healLight') {
        // 殘留治癒光陣純粹回血，不造成任何傷害
      } else if (z.kind === 'holypoly') {
        // 2 秒牽引階段純聚怪並每秒檢定聖印，完全不造成傷害
        for (const e of enemies) if (Math.hypot(e.x - z.x, e.y - z.y) <= z.radius + e.radius) applyStatusTagsOnHit(e, 'holy', spellBase, cs, { isMelee: false });
      } else if (z.kind !== 'ice5_mist') {
        const zElem = z.kind.startsWith('ice') ? 'ice' : (z.kind.startsWith('thunder') ? 'lightning' : (z.kind === 'fire_sea' ? 'fire' : 'holy'));
        const zBonus = z.kind === 'ice2' ? 0.05 : 0;
        const zCs = zBonus > 0 ? { ...cs, statusChanceBonus: (cs.statusChanceBonus || 0) + zBonus } : cs;
        damageArea(z.x, z.y, z.radius, 0, Math.PI * 2, z.dmg * (z.kind === 'ice2' ? 0.44 : 0.55), 4, {
          element: zElem,
          onTargetHit: (e) => applyStatusTagsOnHit(e, zElem, spellBase, zCs)
        });
      } else {
        for (const e of enemies) if (Math.hypot(e.x - z.x, e.y - z.y) <= z.radius + e.radius) applyStatusTagsOnHit(e, 'ice', spellBase, cs);
      }
    }
    if (z.life <= 0) {
      if (z.kind === 'holypoly') {
        slashes.push({ type: 'holywave', x: z.x, y: z.y, range: z.radius, arc: Math.PI * 2, life: 0.22 });
        damageArea(z.x, z.y, z.radius, 0, Math.PI * 2, z.dmg, 24, {
          element: 'holy',
          consumeSeal: true,
          onAfterHit: (e) => applyStatusTagsOnHit(e, 'holy', spellBase, cs, { isMelee: false })
        });
        // 2 秒引爆結束後，必定向外擴散一圈加粗金色聖光波紋對外圍敵群補印
        spawnHolySealWave(z.x, z.y, z.radius * 1.45);
      }
      return false;
    }
    return true;
  });

  const spawnedProjectiles = [];
  projectiles = projectiles.filter(p => {
    if (p.isDivinePrayer) {
      if (p.hoverTimer > 0) {
        p.hoverTimer -= dt;
        p.offY -= 24 * dt;
        p.x = player.x + p.offX;
        p.y = player.y + p.offY;
        if (p.hoverTimer <= 0) {
          p.startX = p.x;
          p.startY = p.y;
          if (p.targetObj && !p.targetObj.isDead) {
            p.targetX = p.targetObj.x;
            p.targetY = p.targetObj.y;
          }
          const dist = Math.hypot(p.targetX - p.startX, p.targetY - p.startY);
          p.flightDur = Math.max(0.28, Math.min(0.65, dist / 640));
          p.flightTime = 0;
        }
        return true;
      }
      if (p.targetObj && !p.targetObj.isDead) {
        p.targetX = p.targetObj.x;
        p.targetY = p.targetObj.y;
      }
      p.flightTime += dt;
      const t = Math.min(1, p.flightTime / (p.flightDur || 0.4));
      const baseX = p.startX + (p.targetX - p.startX) * t;
      const baseY = p.startY + (p.targetY - p.startY) * t - Math.sin(t * Math.PI) * 58;
      const pathAng = Math.atan2(p.targetY - p.startY, p.targetX - p.startX);
      const perpX = -Math.sin(pathAng), perpY = Math.cos(pathAng);
      const sway = Math.sin(t * Math.PI * 2) * 22 * (1 - t) * (p.waveSign || 1);
      p.x = baseX + perpX * sway;
      p.y = baseY + perpY * sway;
      if (t >= 1) {
        slashes.push({ type: 'holywave', x: p.targetX, y: p.targetY, range: p.boomRadius, arc: Math.PI * 2, life: 0.20, maxLife: 0.20 });
        damageArea(p.targetX, p.targetY, p.boomRadius, 0, Math.PI * 2, p.dmg, 0, {
          element: 'holy',
          onTargetHit: (target) => {
            applyStatusTagsOnHit(target, 'holy', spellBase, cs, { isMelee: false });
          }
        });
        return false;
      }
      return true;
    }
    if (p.isMeteor) {
      p.elapsed += dt;
      const prog = Math.min(1, p.elapsed / p.fallDur);
      const ease = prog * prog;
      p.x = p.startX + (p.targetX - p.startX) * ease;
      p.y = p.startY + (p.targetY - p.startY) * ease;
      if (prog >= 1) {
        const boomR = p.boomRadius || (120 * player.areaMult);
        slashes.push({ type: p.elem === 'ice' ? 'holywave' : 'fireboom', x: p.targetX, y: p.targetY, range: boomR, arc: Math.PI * 2, life: 0.30 });
        damageArea(p.targetX, p.targetY, boomR, 0, Math.PI * 2, p.dmg, 22, {
          element: p.elem,
          onTargetHit: (target) => applyStatusTagsOnHit(target, p.elem, spellBase, cs, { isMelee: false })
        });
        if (p.skillId === 'fire5') zones.push({ kind: 'fire_sea', x: p.targetX, y: p.targetY, radius: 105 * player.areaMult, life: 3.0, tickTimer: 0.5, dmg: p.dmg * 0.35, lv: 1 });
        if (p.skillId === 'ice5') zones.push({ kind: 'ice5_mist', x: p.targetX, y: p.targetY, radius: 135 * player.areaMult, life: 3.0, tickTimer: 0.5, dmg: 0, lv: 1 });
        return false;
      }
      return true;
    }
    if (p.isLob) {
      p.elapsed += dt;
      const prog = Math.min(1, p.elapsed / p.flightDur);
      p.x = p.startX + (p.targetX - p.startX) * prog;
      p.y = p.startY + (p.targetY - p.startY) * prog;
      p.z = 4 * p.arcHeight * prog * (1 - prog);
      if (prog >= 1) {
        if (p.targetObj && !p.targetObj.isDead) {
          const tIdx = enemies.indexOf(p.targetObj);
          if (tIdx !== -1 && Math.hypot(p.targetObj.x - p.targetX, p.targetObj.y - p.targetY) <= p.radius + p.targetObj.radius + 24) {
            applyStatusTagsOnHit(p.targetObj, 'fire', spellBase, cs, { isMelee: false });
            hitEnemy(tIdx, p.dmg * 0.65, { element: 'fire' });
          }
        }
        const boomR = 90 * player.areaMult;
        slashes.push({ type: 'fireboom', x: p.targetX, y: p.targetY, range: boomR, arc: Math.PI * 2, life: 0.22 });
        damageArea(p.targetX, p.targetY, boomR, 0, Math.PI * 2, p.dmg, 14, {
          element: 'fire',
          onTargetHit: (target) => applyStatusTagsOnHit(target, 'fire', spellBase, cs, { isMelee: false })
        });
        return false;
      }
      return true;
    }
    p.x += p.vx * dt; p.y += p.vy * dt; if ((p.life -= dt) <= 0) return false;
    if (p.skillId === 'ice3' && (p.orbShootCd -= dt) <= 0 && enemies.length > 0) {
      p.orbShootCd = 0.60;
      const t = enemies[Math.floor(Math.random() * enemies.length)];
      const a = Math.atan2(t.y - p.y, t.x - p.x);
      const ice1St = ownedSkills.ice1 || { lv: 1, evolved: false };
      const scatterMult = (p.lv || 1) >= 6 ? 0.60 : 0.45;
      const ice1Dmg = getSkillRawDmg('ice1', ice1St.lv, ice1St.evolved) * scatterMult;
      const ice1Pierce = 2 + Math.floor(ice1St.lv / 2);
      spawnedProjectiles.push({
        type: 'ice', elem: 'ice', skillId: 'ice1', isBounce: true, speed: 680,
        x: p.x, y: p.y, vx: Math.cos(a) * 680, vy: Math.sin(a) * 680,
        radius: 10 * player.areaMult, dmg: ice1Dmg, pierce: ice1Pierce,
        life: 1.4, hitSet: new Set()
      });
    }
// [第 3A 段：射彈碰撞、連鎖閃電、彈跳邏輯與魔力護盾更新（約 85 行）]
if (p.crushCds) {
  for (const [enemyObj, cdVal] of p.crushCds.entries()) {
    if (cdVal - dt <= 0) p.crushCds.delete(enemyObj);
    else p.crushCds.set(enemyObj, cdVal - dt);
  }
}
for (let j = enemies.length - 1; j >= 0; j--) {
  const e = enemies[j];
  const alreadyHit = p.skillId === 'ice3' ? (p.crushCds && p.crushCds.has(e)) : p.hitSet.has(e);
  if (!alreadyHit && Math.hypot(e.x - p.x, e.y - p.y) <= p.radius + e.radius) {
    if (p.skillId === 'ice3' && p.crushCds) p.crushCds.set(e, 0.40);
    else p.hitSet.add(e);

    const pTags = (p.statusTags && p.statusTags.length > 0) ? p.statusTags : (p.elem || 'none');
    applyStatusTagsOnHit(e, pTags, spellBase, cs, { isMelee: false });
    const hitDmg = p.skillId === 'ice3' ? (p.dmg * 0.55) : p.dmg;
    hitEnemy(j, hitDmg, { element: p.elem || 'none' });
    if (p.skillId === 'fire3') {
      const orbBoomR = 72 * player.areaMult;
      slashes.push({ type: 'fireboom', x: p.x, y: p.y, range: orbBoomR, arc: Math.PI * 2, life: 0.20 });
      damageArea(p.x, p.y, orbBoomR, 0, Math.PI * 2, p.dmg * 0.65, 8, {
        element: 'fire',
        onTargetHit: (target) => { if (target !== e) applyStatusTagsOnHit(target, 'fire', spellBase, cs, { isMelee: false }); }
      });
    }
    if (p.skillId === 'thunder3') {
      const bLv = p.lv || 1;
      const arcCount = bLv >= 5 ? 2 : 1;
      const arcJumps = bLv >= 9 ? 3 : 2;
      const usedStarts = new Set([e]);
      for (let aIdx = 0; aIdx < arcCount; aIdx++) {
        let firstTarget = null, minFirstD = 240;
        for (const cand of enemies) {
          if (!usedStarts.has(cand) && !cand.isDead) {
            const d = Math.hypot(cand.x - e.x, cand.y - e.y);
            if (d < minFirstD) { minFirstD = d; firstTarget = cand; }
          }
        }
        if (!firstTarget) break;
        usedStarts.add(firstTarget);
        let cur = e, next = firstTarget;
        const chainVisited = new Set([e]);
        for (let jump = 0; jump < arcJumps; jump++) {
          if (!next || next.isDead) break;
          chainVisited.add(next);
          const nIdx = enemies.indexOf(next);
          lightnings.push({ x1: cur.x, y1: cur.y, x2: next.x, y2: next.y, life: 0.22, kind: 'normal' });
          if (nIdx !== -1) {
            applyStatusTagsOnHit(next, 'lightning', spellBase, cs, { isMelee: false });
            hitEnemy(nIdx, p.dmg * 0.28, { element: 'lightning', isChain: true });
          }
          cur = next;
          next = null;
          let minJumpD = 220;
          for (const cand of enemies) {
            if (!chainVisited.has(cand) && !cand.isDead) {
              const d = Math.hypot(cand.x - cur.x, cand.y - cur.y);
              if (d < minJumpD) { minJumpD = d; next = cand; }
            }
          }
        }
      }
    }

    if (--p.pierce <= 0) return false;
    if (p.isBounce) {
      let nextE = null, minD = 300;
      for (const cand of enemies) {
        if (!p.hitSet.has(cand) && !cand.isDead) {
          const d = Math.hypot(cand.x - p.x, cand.y - p.y);
          if (d < minD) { minD = d; nextE = cand; }
        }
      }
      if (nextE) {
        const bAng = Math.atan2(nextE.y - p.y, nextE.x - p.x);
        p.vx = Math.cos(bAng) * (p.speed || 680);
        p.vy = Math.sin(bAng) * (p.speed || 680);
      } else {
        return false; // 周圍已無其他可彈跳目標時立即消散，不空飛出畫面
      }
    }
  }
}
return true;
});

if (spawnedProjectiles.length > 0) projectiles.push(...spawnedProjectiles);
const msLv = ownedPassives.manaShield || 0;
if (msLv > 0) {
player.maxShield = Math.round(player.maxHp * (0.10 + msLv * 0.05));
if ((player.shieldTimer -= dt) <= 0) { player.shield = player.maxShield; player.shieldTimer = Math.max(5, 13 - msLv); }
}
// [第 3B 段：怪物 AI 碰撞、敵方射彈、掉落拾取、刷怪生成器與主迴圈（接續至檔案結尾）]
const physRedMult = 1 - getEffectivePhysReducePct(cs) / 100;
const magRedMult = 1 - getEffectiveMagReducePct(cs) / 100;
const thornsLv = ownedPassives.thorns || 0;
const hasShieldLegend = (typeof saveData !== 'undefined' && saveData.equip && saveData.equip.sub && saveData.equip.sub.legendEffect && saveData.equip.sub.legendEffect.id === 'thorns');
for (let i = enemies.length - 1; i >= 0; i--) {
  const e = enemies[i];
  if (e.freezeTimer > 0) e.freezeTimer -= dt; if (e.stunTimer > 0) e.stunTimer -= dt;
  if (e.statusImmuneTimer > 0) e.statusImmuneTimer -= dt;
  if (e.shockTimer > 0) e.shockTimer -= dt;      if (e.armorBreakTimer > 0) e.armorBreakTimer -= dt;
  if (e.darkTimer > 0) e.darkTimer -= dt;
  if ((e.swordBrandTimer || 0) > 0) e.swordBrandTimer -= dt;
  if ((e.windUnbalanceTimer || 0) > 0) e.windUnbalanceTimer -= dt;
  if (e.holySealTimer > 0 && (e.holySealTimer -= dt) <= 0) { e.holySealTimer = 0; e.holySeal = 0; }
  if (e.hitFlash > 0) e.hitFlash -= dt;

  if (e.burnTimer > 0) {
    e.burnTick = (e.burnTick || 0) + dt;
    if (e.burnTick >= 1.0) {
      e.burnTimer = Math.max(0, e.burnTimer - 1.0);
      e.burnTick = 0;
      const bDmg = Math.max(1, Math.round(e.burnDps || spellBase * 0.90));
      damageTexts.push({ x: e.x, y: e.y - e.radius - 8, txt: `🔥${bDmg}`, color: '#fb923c', fontSize: 13, life: 0.55 });
      hitEnemy(i, bDmg, { element: 'fire', isDot: true, noCrit: true, hideText: true });
      if (!enemies[i]) continue;
    }
  }
  if (e.windTimer > 0) {
    e.windTick = (e.windTick || 0) + dt;
    if (e.windTick >= 0.5) {
      e.windTimer = Math.max(0, e.windTimer - 0.5);
      e.windTick = 0;
      const wDmg = Math.max(1, Math.round(e.windDps || spellBase * 0.36));
      damageTexts.push({ x: e.x - 10, y: e.y - e.radius - 8, txt: `🍃${wDmg}`, color: '#6ee7b7', fontSize: 12, life: 0.50 });
      hitEnemy(i, wDmg, { element: 'wind', isDot: true, noCrit: true, hideText: true });
      if (!enemies[i]) continue;
    }
  }
  if (e.darkTimer > 0 && (e.darkDps || 0) > 0) {
    e.darkTick = (e.darkTick || 0) + dt;
    if (e.darkTick >= 1.0) {
      e.darkTick = 0;
      const dDmg = Math.max(1, Math.round(e.darkDps));
      damageTexts.push({ x: e.x + 10, y: e.y - e.radius - 8, txt: `🌑${dDmg}`, color: '#c084fc', fontSize: 12, life: 0.50 });
      hitEnemy(i, dDmg, { element: 'dark', isDot: true, noCrit: true, hideText: true });
      if (!enemies[i]) continue;
    }
  }

  const canEnemyShoot = (e.isDummy && isSandbox && SANDBOX_STATE.dummyShoot)
    || (!isSandbox && (e.isRanged || e.isElite || e.isMegaBoss || e.isFinalBoss));
  if (canEnemyShoot) {
    e.shootCd = (e.shootCd !== undefined) ? (e.shootCd - dt) : (1.2 + Math.random() * 1.4);
    if (e.shootCd <= 0) {
      e.shootCd = e.isDummy ? 1.6 : (e.isFinalBoss ? 1.8 : (e.isMegaBoss ? 2.2 : 2.8));
      const runCfg = (!isSandbox && window.ACTIVE_STAGE_RUN) ? window.ACTIVE_STAGE_RUN : null;
      const stageDmgScale = runCfg ? (1 + (runCfg.stage.tier - 1) * 0.65) * (runCfg.diff.dmgMult || 1.0) : 1.0;
      const timeScale = isSandbox ? 1.0 : (1 + (gameTime / 60) * 0.12) * (player.curseMult || 1.0) * stageDmgScale;
      const atkMult = typeof getEnemyAtkFactor === 'function' ? getEnemyAtkFactor(e) : 1.0;
      const baseShotDmg = e.isDummy ? (e.isMegaBoss ? 30 : 18) : (e.isFinalBoss ? 55 : (e.isMegaBoss ? 38 : (e.isElite ? 26 : 16)));
      const sAng = Math.atan2(player.y - e.y, player.x - e.x);
      enemyProjectiles.push({
        x: e.x, y: e.y, vx: Math.cos(sAng) * 280, vy: Math.sin(sAng) * 280,
        radius: (e.isMegaBoss || e.isFinalBoss) ? 10 : 8,
        dmg: Math.round(baseShotDmg * timeScale * atkMult),
        life: 3.8
      });
    }
  }

  const baseSpd = (e.isDummy && isSandbox && SANDBOX_STATE.dummyAttack) ? 95 : e.speed;
  const spd = baseSpd * (typeof getEnemySpeedFactor === 'function' ? getEnemySpeedFactor(e) : 1);
  const ang = Math.atan2(player.y - e.y, player.x - e.x);
  e.x += Math.cos(ang) * spd * dt; e.y += Math.sin(ang) * spd * dt;

  if (e.hitPlayerCd > 0) e.hitPlayerCd -= dt;
  if (Math.hypot(player.x - e.x, player.y - e.y) < player.size * 0.75 + e.radius) {
    if ((e.hitPlayerCd || 0) <= 0) {
      e.hitPlayerCd = 0.45;
      const runCfg = (!isSandbox && window.ACTIVE_STAGE_RUN) ? window.ACTIVE_STAGE_RUN : null;
      const stageDmgScale = runCfg ? (1 + (runCfg.stage.tier - 1) * 0.65) * (runCfg.diff.dmgMult || 1.0) : 1.0;
      const atkMult = typeof getEnemyAtkFactor === 'function' ? getEnemyAtkFactor(e) : 1.0;
      const timeScale = isSandbox ? 1.0 : (1 + (gameTime / 60) * 0.12) * (player.curseMult || 1.0) * stageDmgScale;
      const baseCrash = e.isDummy ? 6 : (e.isFinalBoss ? 95 : (e.isMegaBoss ? 65 : (e.isElite ? 38 : 18)));
      let taken = Math.max(1, Math.round(baseCrash * timeScale * atkMult * physRedMult));
      if (player.shield > 0) {
        const abs = Math.min(player.shield, taken);
        player.shield -= abs; taken -= abs;
        if (taken <= 0) damageTexts.push({ x: player.x, y: player.y - 34, txt: `🛡️格擋`, color: '#38bdf8', life: 0.45 });
      }
      if (taken > 0) {
        player.hp -= taken;
        damageTexts.push({ x: player.x, y: player.y - 34, txt: `💥-${taken}`, color: '#f87171', life: 0.55 });
      }
      if (isSandbox && SANDBOX_STATE.godMode && player.hp < 1) player.hp = player.maxHp;
    }

    if ((thornsLv > 0 || hasShieldLegend) && player.thornsCd <= 0) {
      player.thornsCd = 0.45;
      const defVal = (cs.st && cs.st.DEF) || 0;
      const mult = (thornsLv > 0 ? (1.0 + thornsLv * 0.5) : 0) + (hasShieldLegend ? 2.5 : 0);
      const kbAng = Math.atan2(e.y - player.y, e.x - player.x);
      const res = (e.isElite || e.isMegaBoss || e.isFinalBoss) ? 0.15 : 1;
      e.x += Math.cos(kbAng) * 32 * res; e.y += Math.sin(kbAng) * 32 * res;
      hitEnemy(i, Math.max(5, defVal * mult), { element: 'none' });
      if (!enemies[i]) continue;
    }

    if (player.hp <= 0) {
      if (ownedPassives.angelWish && !player.angelUsed) {
        player.angelUsed = true; player.hp = player.maxHp;
        enemies = enemies.filter(m => { if (m.isElite || m.isMegaBoss || m.isFinalBoss) { m.freezeTimer = 3.0; return true; } return false; });
        showBanner('👼 【天使之願】發動！原地滿血復活並觸發全屏淨化爆炸！');
        return;
      }
      endGame(false); return;
    }
  }
}

enemyProjectiles = enemyProjectiles.filter(ep => {
  ep.x += ep.vx * dt; ep.y += ep.vy * dt;
  if ((ep.life -= dt) <= 0) return false;
  if (Math.hypot(player.x - ep.x, player.y - ep.y) <= player.size * 0.65 + ep.radius) {
    let taken = Math.max(1, Math.round(ep.dmg * magRedMult));
    damageTexts.push({ x: player.x, y: player.y - 26, txt: `🔮-${taken}`, color: '#c084fc', life: 0.6 });
    if (player.shield > 0) { const abs = Math.min(player.shield, taken); player.shield -= abs; taken -= abs; }
    if (taken > 0) player.hp -= taken;
    if (isSandbox && SANDBOX_STATE.godMode && player.hp < 1) player.hp = player.maxHp;
    if (player.hp <= 0) { endGame(false); return false; }
    return false;
  }
  return true;
});

const vacSpeed = victoryVacuumActive ? 980 : 420;
const vacRange = victoryVacuumActive ? 99999 : player.pickupRange;

gems = gems.filter(g => {
  const d = Math.hypot(player.x - g.x, player.y - g.y);
  if (d < vacRange) { const a = Math.atan2(player.y - g.y, player.x - g.x); g.x += Math.cos(a) * vacSpeed * dt; g.y += Math.sin(a) * vacSpeed * dt; }
  if (d < 24) {
    if ((player.exp += g.val * (player.expMult || 1)) >= player.nextExp) {
      player.exp -= player.nextExp;
      player.lv++;
      player.nextExp = player.lv <= 10
        ? Math.round(player.nextExp * 1.12 + 3)
        : (player.lv <= 30 ? (player.nextExp + 7) : (player.nextExp + 10));
      levelUp();
    }
    return false;
  }
  return true;
});

chests = chests.filter(c => {
  const d = Math.hypot(player.x - c.x, player.y - c.y);
  if (d < vacRange) { const a = Math.atan2(player.y - c.y, player.x - c.x); c.x += Math.cos(a) * vacSpeed * dt; c.y += Math.sin(a) * vacSpeed * dt; }
  if (d < 36) { openChest(c.kind || 'gold'); return false; }
  return true;
});

seedBags = seedBags.filter(sb => {
  const d = Math.hypot(player.x - sb.x, player.y - sb.y);
  if (d < vacRange) { const a = Math.atan2(player.y - sb.y, player.x - sb.x); sb.x += Math.cos(a) * vacSpeed * dt; sb.y += Math.sin(a) * vacSpeed * dt; }
  if (d < 26) {
    runSeed += sb.val;
    damageTexts.push({ x: player.x, y: player.y - 28, txt: `💰+${sb.val}`, color: '#fde047', fontSize: 12, life: 0.45 });
    return false;
  }
  return true;
});

lootBags = lootBags.filter(b => {
  const d = Math.hypot(player.x - b.x, player.y - b.y);
  if (d < vacRange) { const a = Math.atan2(player.y - b.y, player.x - b.x); b.x += Math.cos(a) * vacSpeed * dt; b.y += Math.sin(a) * vacSpeed * dt; }
  if (d < 36) {
    runLoot.push(b.item);
    showBanner(`📦 獲得 [未鑑定] ${b.rarName}裝備袋！`);
    return false;
  }
  return true;
});

slashes = slashes.filter(s => (s.life -= dt) > 0); lightnings = lightnings.filter(l => (l.life -= dt) > 0); damageTexts = damageTexts.filter(t => { t.y -= 28 * dt; return (t.life -= dt) > 0; });

// 全區磁吸掃場完成判定：確認場上所有寶石、金幣袋、裝備袋與寶箱皆已回收完畢後自動進入結算
if (victoryVacuumActive && !isPaused && !gameOver) {
  victoryVacuumTimer += dt;
  if ((lootBags.length === 0 && gems.length === 0 && chests.length === 0 && seedBags.length === 0) || victoryVacuumTimer >= 6.0) {
    victoryVacuumActive = false;
    endGame(true);
    return;
  }
}
}

const RANGED_MOB_RULES = {
  '食人花': 0.35, // 第 1 階貝那茵森林：僅食人花滿 3 分鐘後有 35% 機率為遠程孢子怪，其餘全為近戰
  '烏賊': 0.85    // 第 2 階耳語海岸：烏賊為遠程噴墨怪，其餘魚劍士兵／寄居蟹／鬼頭鯊／魚槍武士全為近戰
};

function spawnEnemy() {
  if (bossSpawned) return;
  const MAX_ENEMIES_ON_SCREEN = 140;
  if (enemies.length >= MAX_ENEMIES_ON_SCREEN) return;

  const runCfg = window.ACTIVE_STAGE_RUN || null;
  const st = runCfg ? runCfg.stage : null;
  const diff = runCfg ? runCfg.diff : null;
  const stageHpScale = (st ? (1 + (st.tier - 1) * 1.4) : 1.0) * (diff ? (diff.hpMult || 1.0) : 1.0);
  const diffSpawnMult = diff ? (diff.spawnMult || 1.0) : 1.0;

  const mins = gameTime / 60;
  const baseBatch = mins < 3
    ? (2 + Math.floor(Math.random() * 2))   // 0~3分：每次 2~3 隻
    : (mins < 8
      ? (3 + Math.floor(Math.random() * 2)) // 3~8分：每次 3~4 隻
      : (mins < 15
        ? (4 + Math.floor(Math.random() * 3)) // 8~15分：每次 4~6 隻
        : (5 + Math.floor(Math.random() * 4)))); // 15~20分：每次 5~8 隻

  const spawnCount = Math.min(MAX_ENEMIES_ON_SCREEN - enemies.length, Math.max(1, Math.round(baseBatch * diffSpawnMult)));

  const mobPool = (st && Array.isArray(st.monsters) && st.monsters.length > 0) ? st.monsters : new Array('野怪');
  const baseAng = Math.random() * Math.PI * 2;

  for (let n = 0; n < spawnCount; n++) {
    const ang = baseAng + (Math.random() - 0.5) * 0.85;
    const dist = Math.max(canvas.width, canvas.height) * 0.62 + Math.random() * 60;
    const hp = Math.round((20 + mins * 8) * player.curseMult * stageHpScale);
    const mobName = mobPool[Math.floor(Math.random() * mobPool.length)];
    const cleanName = mobName.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '').trim();
    const rangedChance = (mins >= 3 && RANGED_MOB_RULES[cleanName]) ? RANGED_MOB_RULES[cleanName] : 0;
    const isRanged = rangedChance > 0 && Math.random() < rangedChance;

    enemies.push({
      x: player.x + Math.cos(ang) * dist, y: player.y + Math.sin(ang) * dist,
      radius: isRanged ? 14 : 15, hp, maxHp: hp, name: mobName,
      speed: (isRanged ? 75 : 95) * player.curseMult,
      color: isRanged ? '#a855f7' : (mins >= 4 ? '#ef4444' : '#facc15'),
      expValue: (3 + Math.floor(mins / 2)) * (st ? st.tier : 1),
      isRanged, hitFlash: 0
    });
  }
}

  function spawnEliteBoss(tier) {
  const runCfg = window.ACTIVE_STAGE_RUN || null;
  const st = runCfg ? runCfg.stage : null;
  const diff = runCfg ? runCfg.diff : null;
  const stageHpScale = (st ? (1 + (st.tier - 1) * 1.4) : 1.0) * (diff ? (diff.hpMult || 1.0) : 1.0);
  const ang = Math.random() * Math.PI * 2, mins = Math.max(1, gameTime / 60);
  const isFinal = tier === 'final', isMega = tier === 'mega';
  const hpVal = Math.round((isFinal ? 5500 : (isMega ? 950 + mins * 180 : 320 + mins * 110)) * player.curseMult * stageHpScale);
  const finalBossName = st?.boss?.name || '果凍雞王';
const mobCandidates = (st && Array.isArray(st.monsters) && st.monsters.length > 0)
  ? st.monsters.map(m => m.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '').trim()).filter(m => m && m !== finalBossName)
  : ['魔物'];
const pickedMob = mobCandidates[Math.floor(Math.random() * mobCandidates.length)] || '魔物';
const bossName = isFinal ? finalBossName : `【菁英】${pickedMob}`;
enemies.push({ x: player.x + Math.cos(ang) * 380, y: player.y + Math.sin(ang) * 380, radius: isFinal ? 50 : (isMega ? 38 : 28), hp: hpVal, maxHp: hpVal, speed: 82 * (1 + (player.curseMult - 1) * 0.5), color: isFinal ? '#9333ea' : (isMega ? '#dc2626' : '#f97316'), name: bossName, expValue: isMega ? 25 : 12, isElite: tier === 'elite', isMegaBoss: isMega, isFinalBoss: isFinal, hitFlash: 0 });
if (isFinal) showBanner(`⚠️ ${bossName}出現了！`);
}

if (typeof renderLobby === 'function') renderLobby();
let lastT = performance.now();
function loop(now) { const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; update(dt); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

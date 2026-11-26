// 敵人與首領的刷新時程、狀態更新及行動。
function getFirstStageSpawnPhase(minutes) {
  if (!isFirstStageBalanceTrial() || bossSpawned) return null;
  if (minutes >= 12 && minutes < 15) return { interval: 0.55, min: 4, max: 6 };
  if (minutes >= 15 && minutes < 17) return { interval: 0.48, min: 5, max: 6 };
  return null;
}

function updateBossSpawns() {
  const mins = Math.floor(gameTime / 60);
  if (mins >= 20 && !bossSpawned) { bossSpawned = true; spawnTimer = 1.0; spawnEliteBoss('final'); }
  else if (mins > 0 && mins % 5 === 0 && mins !== lastMegaBossMin && mins < 20) { lastMegaBossMin = mins; spawnEliteBoss('mega'); }
  else if (mins > 0 && mins % 2 === 0 && mins % 5 !== 0 && mins !== lastEliteMin && mins < 20) { lastEliteMin = mins; spawnEliteBoss('elite'); }
}

function updateRegularSpawns(dt) {
  if ((spawnTimer -= dt) <= 0) {
    spawnEnemy();
    const curMins = gameTime / 60;
    const baseCd = getFirstStageSpawnPhase(curMins)?.interval
      ?? (curMins < 3 ? 0.70 : (curMins < 8 ? 0.55 : (curMins < 15 ? 0.48 : 0.40)));
    spawnTimer = bossSpawned ? 1.0 : Math.max(0.20, baseCd / (player.curseMult || 1.0));
  }
}

// 回傳 false 時，本幀在玩家陣亡或復活後立即結束。
function updateEnemies(dt, isSandbox, cs, spellBase, physRedMult) {
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
          return false;
        }
        endGame(false); return false;
      }
    }
  }
  return true;
}

const RANGED_MOB_RULES = {
  '食人花': 0.35, // 第 1 階貝那茵森林：僅食人花滿 3 分鐘後有 35% 機率為遠程孢子怪，其餘全為近戰
  '烏賊': 0.85    // 第 2 階耳語海岸：烏賊為遠程噴墨怪，其餘魚劍士兵／寄居蟹／鬼頭鯊／魚槍武士全為近戰
};

function spawnEnemy() {
  if (victoryVacuumActive) return;
  const MAX_ENEMIES_ON_SCREEN = 140;
  const normalCount = bossSpawned ? enemies.filter(e => !e.isElite && !e.isMegaBoss && !e.isFinalBoss && !e.isDummy).length : 0;
  const available = Math.min(MAX_ENEMIES_ON_SCREEN - enemies.length, bossSpawned ? 20 - normalCount : MAX_ENEMIES_ON_SCREEN);
  if (available <= 0) return;

  const runCfg = window.ACTIVE_STAGE_RUN || null;
  const st = runCfg ? runCfg.stage : null;
  const diff = runCfg ? runCfg.diff : null;
  const stageHpScale = (st ? (1 + (st.tier - 1) * 1.4) : 1.0) * (diff ? (diff.hpMult || 1.0) : 1.0);
  const diffSpawnMult = diff ? (diff.spawnMult || 1.0) : 1.0;

  const mins = gameTime / 60;
  const phase = getFirstStageSpawnPhase(mins);
  const baseBatch = phase ? phase.min + Math.floor(Math.random() * (phase.max - phase.min + 1)) : (bossSpawned || mins < 3
    ? (2 + Math.floor(Math.random() * 2))   // 0~3分：每次 2~3 隻
    : (mins < 8
      ? (3 + Math.floor(Math.random() * 2)) // 3~8分：每次 3~4 隻
      : (mins < 15
        ? (4 + Math.floor(Math.random() * 3)) // 8~15分：每次 4~6 隻
        : (5 + Math.floor(Math.random() * 4))))); // 15~20分：每次 5~8 隻

  const spawnCount = Math.min(available, Math.max(1, Math.round(baseBatch * diffSpawnMult)));

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

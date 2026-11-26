// 場上道具、經驗、Seed 與勝利掃場回收。
function collectFieldLoot(dt) {
  if (victoryVacuumActive) victoryVacuumTimer += dt;
  const forcePickup = victoryVacuumActive && victoryVacuumTimer >= 6;
  if (fieldMagnetTimer > 0) fieldMagnetTimer -= dt;
  const isGlobalMagnet = victoryVacuumActive || fieldMagnetTimer > 0;
  const vacSpeed = isGlobalMagnet ? 980 : 420;
  const vacRange = victoryVacuumActive ? Infinity : (isGlobalMagnet ? 99999 : player.pickupRange);

  fieldItems = fieldItems.filter(fi => {
    if (!victoryVacuumActive && (fi.life -= dt) <= 0) return false;
    const dx = player.x - fi.x, dy = player.y - fi.y;
    const dist = Math.hypot(dx, dy);
    if (dist < vacRange && dist > 1) {
      fi.x += (dx / dist) * vacSpeed * dt;
      fi.y += (dy / dist) * vacSpeed * dt;
    }
    if (forcePickup || dist <= 34) {
      if (fi.kind === 'potion') {
        const healAmt = Math.max(1, Math.round(player.maxHp * 0.10));
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
        damageTexts.push({ x: player.x, y: player.y - 34, txt: `🧪+${healAmt} HP`, color: '#4ade80', fontSize: 15, life: 0.75 });
      } else if (fi.kind === 'magnet') {
        fieldMagnetTimer = 4.0;
      } else if (fi.kind === 'goldbag') {
        collectSeed(fi.val);
      } else if (fi.kind === 'bomb') {
        slashes.push({ type: 'fireboom', x: player.x, y: player.y, range: Math.max(canvas.width, canvas.height) * 0.65, arc: Math.PI * 2, life: 0.45 });
        for (let i = enemies.length - 1; i >= 0; i--) {
          const m = enemies[i];
          if (!m || m.isDummy) continue;
          if (Math.hypot(m.x - player.x, m.y - player.y) <= Math.max(canvas.width, canvas.height) * 0.72) {
            const isBossType = m.isElite || m.isMegaBoss || m.isFinalBoss;
            const bombDmg = isBossType ? Math.max(120, Math.round(m.maxHp * 0.25)) : (m.hp + 999);
            hitEnemy(i, bombDmg, { element: 'fire', noCrit: true });
          }
        }
      }
      return false;
    }
    return true;
  });

  gems = gems.filter(g => {
    const d = Math.hypot(player.x - g.x, player.y - g.y);
    if (d < vacRange) { const a = Math.atan2(player.y - g.y, player.x - g.x); g.x += Math.cos(a) * vacSpeed * dt; g.y += Math.sin(a) * vacSpeed * dt; }
    if (forcePickup || d < 24) {
      player.exp += g.val * (player.expMult || 1);
      while (player.exp >= player.nextExp) {
        player.exp -= player.nextExp;
        player.lv++;
        player.nextExp = player.lv <= 10
          ? Math.round(player.nextExp * 1.12 + 3)
          : (player.lv <= 30 ? (player.nextExp + 7) : (player.nextExp + 10));
        if (!victoryVacuumActive) { levelUp(); break; }
      }
      return false;
    }
    return true;
  });

  chests = chests.filter(c => {
    const d = Math.hypot(player.x - c.x, player.y - c.y);
    if (d < vacRange) { const a = Math.atan2(player.y - c.y, player.x - c.x); c.x += Math.cos(a) * vacSpeed * dt; c.y += Math.sin(a) * vacSpeed * dt; }
    if (forcePickup || d < 36) { openChest(c.kind || 'gold'); return false; }
    return true;
  });

  seedBags = seedBags.filter(sb => {
    const d = Math.hypot(player.x - sb.x, player.y - sb.y);
    if (d < vacRange) { const a = Math.atan2(player.y - sb.y, player.x - sb.x); sb.x += Math.cos(a) * vacSpeed * dt; sb.y += Math.sin(a) * vacSpeed * dt; }
    if (forcePickup || d < 26) {
      collectSeed(sb.val);
      return false;
    }
    return true;
  });

  lootBags = lootBags.filter(b => {
    const d = Math.hypot(player.x - b.x, player.y - b.y);
    if (d < vacRange) { const a = Math.atan2(player.y - b.y, player.x - b.x); b.x += Math.cos(a) * vacSpeed * dt; b.y += Math.sin(a) * vacSpeed * dt; }
    if (forcePickup || d < 36) {
      runLoot.push(b.item);
      showBanner(`📦 獲得 [未鑑定] ${b.rarName}裝備袋！`);
      return false;
    }
    return true;
  });

  slashes = slashes.filter(s => (s.life -= dt) > 0); lightnings = lightnings.filter(l => (l.life -= dt) > 0); damageTexts = damageTexts.filter(t => { t.y -= 28 * dt; return (t.life -= dt) > 0; });

  // 只在所有可拾取物都處理完後結算。
  if (victoryVacuumActive && !isPaused && !gameOver && !lootBags.length && !gems.length && !chests.length && !seedBags.length && !fieldItems.length) {
    victorySaveRetryTimer -= dt;
    if (victorySaveRetryTimer <= 0) {
      if (endGame(true)) victoryVacuumActive = false;
      else victorySaveRetryTimer = 1;
    }
  }
}

function collectSeed(amount) {
  runSeed += amount;
  damageTexts.push({ x: player.x, y: player.y - 28, txt: `💰+${amount}`, color: '#fde047', fontSize: 12, life: 0.45 });
}

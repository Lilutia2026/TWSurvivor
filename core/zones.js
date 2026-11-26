// 領域技能的每幀更新與命中處理。
function updateBattleZones(dt, cs, spellBase) {
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
}

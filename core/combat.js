// ============================================================================
// core/combat.js — 戰鬥傷害管線、元素共鳴爆發與統一尋怪引擎
// ============================================================================

function getSkillRawDmg(id, lv, evolved) {
    const sk = ACTIVE_SKILLS[id];
    if (!sk) return 20;
    const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { st: {}, defThornsDmg: 0, physDmgMult: 1, magDmgMult: 1 };
    const st = cs.st || {};
    const w = (typeof saveData !== 'undefined' && saveData.equip) ? saveData.equip.weapon : null;
    const wType = w ? w.type : 'longsword';
  
    const tags = sk.statTags || (sk.mainStat ? [sk.mainStat === 'I' ? 'INT' : sk.mainStat] : ['H']);
    const hasH = tags.includes('H'), hasS = tags.includes('S');
    const hasI = tags.includes('INT') || tags.includes('I'), hasMR = tags.includes('MR');
    const hasPhysTag = hasH || hasS;
    const hasMagTag = hasI || hasMR;
  
    let statPower = 0;
    if (hasPhysTag && hasMagTag) {
      const physPart = hasH ? ((st.H || 0) * 0.60) : ((st.S || 0) * 0.60);
      statPower = ((st.I || 0) * 1.20) + physPart;
    } else if (hasH && hasS) {
      statPower = ((st.H || 0) * 1.00) + ((st.S || 0) * 0.50);
    } else if (hasI && hasMR) {
      statPower = ((st.I || 0) * 1.00) + ((st.MR || 0) * 0.80);
    } else if (hasH) {
      statPower = (st.H || 0) * 1.2 + (st.S || 0) * 0.1;
    } else if (hasS) {
      statPower = (st.S || 0) * 0.9 + (st.H || 0) * 0.2;
    } else if (hasI) {
      statPower = (st.I || 0) * 1.0 + (st.MR || 0) * 0.3;
    } else if (hasMR) {
      statPower = (st.MR || 0) * 1.0 + (st.I || 0) * 0.3;
    }
  
    const isPhysWeapon = ['blade', 'rapier', 'longsword', 'tachi', 'greatsword', 'dagger', 'dual_blade', 'axe', 'spear', 'polearm', 'whip', 'flail', 'mace'].includes(wType);
    const isCrossType = (isPhysWeapon && !hasPhysTag) || (!isPhysWeapon && !hasMagTag);
    if (isCrossType) {
      if (isPhysWeapon) statPower += ((st.S || 0) * 0.65 + (st.H || 0) * 0.65);
      else statPower += ((st.I || 0) * 0.65 + (st.MR || 0) * 0.65);
    }
  
    const isPhysSkill = sk.type === 'physical' || hasPhysTag;
    const dmgTypeMult = isCrossType
      ? Math.max(cs.physDmgMult || 1.0, cs.magDmgMult || 1.0)
      : (isPhysSkill ? (cs.physDmgMult || 1.0) : (cs.magDmgMult || 1.0));
  
    const bTags = sk.behaviorTags || [];
    const isMelee = (bTags.includes('melee') || bTags.includes('近戰') || (!bTags.includes('射彈') && !bTags.includes('projectile') && !bTags.includes('ranged'))) && hasPhysTag;
    const defBonus = isMelee ? (cs.defThornsDmg || 0) : 0;
  
        // 劍刀雙修：同時持有【劍技】與【刀技】主動技能時，物理技能傷害每級額外 +2%
        let dualMasteryMult = 1.0;
        const dualLv = ownedPassives.dualMastery || 0;
        if (dualLv > 0 && isPhysSkill && typeof ownedSkills !== 'undefined') {
          let hasSwordArt = false, hasBladeArt = false;
          for (const [oid, ost] of Object.entries(ownedSkills)) {
            if (!ost || ost.disabled) continue;
            const osk = ACTIVE_SKILLS[oid];
            if (!osk || !osk.desc) continue;
            if (osk.desc.includes('【劍技')) hasSwordArt = true;
            if (osk.desc.includes('【刀技')) hasBladeArt = true;
          }
          if (hasSwordArt && hasBladeArt) dualMasteryMult += dualLv * 0.02;
        }
    
        const powerCrestMult = isPhysSkill ? (1 + (ownedPassives.powerCrest || 0) * 0.08) : 1.0;
        const guardianMult = 1 + (ownedPassives.guardian_warrior || 0) * 0.05;
        const redMoonMult = 1 + (ownedPassives.red_moon_oath || 0) * 0.08;
        const iceSealMult = (sk.element === 'ice') ? (1 + (ownedPassives.ice_seal || 0) * 0.06) : 1.0;
        const blessMult = 1 + (ownedPassives.blessing || 0) * 0.03;
        const angelMult = ownedPassives.angelWish ? 0.90 : 1.0;
        const evoMult = (evolved && !sk.isSuperWeapon) ? 1.45 : 1.0;
        const rawBase = Array.isArray(sk.dmgCurve)
          ? sk.dmgCurve[Math.min(sk.dmgCurve.length - 1, Math.max(0, lv - 1))]
          : (sk.baseDmg + Math.max(0, lv - 1) * sk.perLv);
        return (rawBase + statPower + defBonus) * player.dmgMult * dmgTypeMult * dualMasteryMult * powerCrestMult * guardianMult * redMoonMult * iceSealMult * blessMult * angelMult * evoMult;
      }

  function getSpellBase() {
    const st = typeof getTotalStats === 'function' ? getTotalStats() : {};
    return (st.I || 1) * 1.0 + (st.MR || 1) * 0.3;
  }
  
  function triggerThunderChain(srcEnemy, spellBase) {
    const res = typeof getResonanceParams === 'function' ? getResonanceParams('lightning') : null;
    if (!res || (srcEnemy.chainIcd || 0) > 0) return;
    srcEnemy.chainIcd = res.icd;
    let cur = srcEnemy;
    const visited = new Set([srcEnemy]);
    for (let j = 0; j < res.jumps; j++) {
      let nextIdx = -1, minD = 240;
      for (let i = 0; i < enemies.length; i++) {
        const cand = enemies[i];
        if (!visited.has(cand) && !cand.isDead) {
          const d = Math.hypot(cand.x - cur.x, cand.y - cur.y);
          if (d < minD) { minD = d; nextIdx = i; }
        }
      }
      if (nextIdx === -1) {
        // 周圍無其他可彈跳目標時，全部過載電流聚能劈向本體（2.20x 單體聚能爆發）
        if (j === 0) {
          const selfIdx = enemies.indexOf(srcEnemy);
          if (selfIdx !== -1 && !srcEnemy.isDead) {
            const singleDmg = Math.max(1, Math.round(spellBase * res.mult * 2.20));
            lightnings.push({ x1: srcEnemy.x, y1: srcEnemy.y - 135, x2: srcEnemy.x, y2: srcEnemy.y, life: 0.28, kind: 'overload' });
            damageTexts.push({ x: srcEnemy.x, y: srcEnemy.y - srcEnemy.radius - 18, txt: `⚡過載 ${singleDmg}`, color: '#38bdf8', fontSize: 17, life: 0.75 });
            hitEnemy(selfIdx, singleDmg, { element: 'lightning', isChain: true, hideText: true });
          }
        }
        break;
      }
      const nextE = enemies[nextIdx];
      visited.add(nextE);
      const chainDmg = Math.max(1, Math.round(spellBase * res.mult));
      lightnings.push({ x1: cur.x, y1: cur.y, x2: nextE.x, y2: nextE.y, life: 0.25, kind: 'overload' });
      damageTexts.push({ x: nextE.x, y: nextE.y - nextE.radius - 14, txt: `⚡過載 ${chainDmg}`, color: '#38bdf8', fontSize: 14, life: 0.60 });
      hitEnemy(nextIdx, chainDmg, { element: 'lightning', isChain: true, hideText: true });
      cur = nextE;
    }
  }
  
  function spawnHolySealWave(cx, cy, baseRadius) {
    const r = baseRadius * player.areaMult;
    const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { statusDurMult: 1.0, statusChanceBonus: 0 };
    slashes.push({ type: 'holywave', x: cx, y: cy, range: r, arc: Math.PI * 2, life: 0.35 });
    for (const e of enemies) {
      if (Math.hypot(e.x - cx, e.y - cy) <= r + e.radius && typeof rollStatusChance === 'function' && rollStatusChance(cs.statusChanceBonus || 0)) {
        if (typeof applyHolySeal === 'function') applyHolySeal(e, 1, cs.statusDurMult || 1.0);
      }
    }
  }
  
  function hitEnemy(idx, rawDmg, opts = {}) {
    const e = enemies[idx];
    if (!e) return;
    const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { critRate: 0.1, critDmg: 1.5, doubleHitChance: 0 };
    const elem = typeof normalizeStatusTag === 'function' ? normalizeStatusTag(opts.element || 'none') : (opts.element || 'none');
    const isStrikeOrLight = elem === 'holy' || opts.isStrike;
    const resBonusMult = 1 + (ownedPassives.resonance || 0) * 0.12;
  
    const mod = typeof calcStatusDamageMods === 'function' ? calcStatusDamageMods(e, elem, isStrikeOrLight) : { addMult: 1, endMult: 1 };
    const crimsonWaveIgnore = (opts.isCrimsonWave && (e.armorBreakTimer || 0) > 0) ? 0.40 : 0;
    const skyEarthIgnore = opts.skyEarthIgnore || 0;
    const physIgnore = opts.isPhysSkill ? ((ownedPassives.dualMastery || 0) * 0.03 + crimsonWaveIgnore + skyEarthIgnore) : 0;
    const talentIgnore = Math.min(0.80, (ownedPassives.mageTalent || 0) * 0.03 + physIgnore);
    const bossResist = (e.isFinalBoss ? 0.20 : (e.isMegaBoss ? 0.12 : 0)) * (1 - talentIgnore);
    const weakenLv = (typeof ownedPassives !== 'undefined' && ownedPassives.dark_weaken) || 0;
    const weakenRad = (130 + weakenLv * 15) * (player.areaMult || 1.0);
    const inWeakenAura = (weakenLv > 0 && Math.hypot(e.x - player.x, e.y - player.y) <= weakenRad + e.radius);
    const weakenMult = inWeakenAura ? (1 + weakenLv * 0.04) : 1.0;

    // 劍傷灼印（烈焰連牙斬）與氣流撕裂（閃空翔烈破＋龍捲刃術）
    let lucienBrandMult = 1.0;
    if (opts.isPhysSkill && (e.swordBrandTimer || 0) > 0) {
      const firePartnerOn = typeof ownedSkills !== 'undefined' && !!ownedSkills.fire1;
      const burnExtra = (firePartnerOn && e.burnTimer > 0) ? 0.08 : 0;
      lucienBrandMult += (e.swordBrandBonus || 0.16) + burnExtra;
    }
    if (opts.isPhysSkill && e.windTimer > 0 && typeof ownedSkills !== 'undefined' && ownedSkills.senku_wind && ownedSkills.windblade && !opts.isWindCutProc) {
      e.windTimer += 0.6;
      const windCutDmg = Math.max(1, Math.round(rawDmg * 0.12));
      damageTexts.push({ x: e.x - 14, y: e.y - e.radius - 10, txt: `🍃氣流 ${windCutDmg}`, color: '#6ee7b7', fontSize: 12, life: 0.45 });
      hitEnemy(idx, windCutDmg, { element: 'wind', noCrit: true, isWindCutProc: true, hideText: true });
    }

    let finalDmg = rawDmg * mod.addMult * weakenMult * lucienBrandMult * (1 - bossResist) * mod.endMult * (0.95 + Math.random() * 0.10);
  
    const staticGuideCrit = (opts.isPhysSkill && e.shockTimer > 0 && typeof ownedSkills !== 'undefined' && ownedSkills.aurora_lightning && ownedSkills.thunder1) ? 0.15 : 0;
    const extraCrit = ((typeof opts.bonusCritFn === 'function') ? (opts.bonusCritFn(e) || 0) : 0) + staticGuideCrit;
    const totalCrit = (cs.critRate || 0.05) + (player.bonusCritRate || 0) + extraCrit;
    const isCrit = !opts.noCrit && (Math.random() < Math.min(1.0, totalCrit));
    let isSuperCrit = false;
    if (isCrit) {
      const crimsonWaveCritDmg = (opts.isCrimsonWave && (e.armorBreakTimer || 0) > 0) ? 0.35 : 0;
      const iceMirrorCritDmg = ((e.freezeTimer || 0) > 0 && (ownedPassives.ice_mirror || 0) > 0) ? (ownedPassives.ice_mirror * 0.06) : 0;
      const fnBonusCritDmg = (typeof opts.bonusCritDmgFn === 'function') ? (opts.bonusCritDmgFn(e) || 0) : 0;
      finalDmg *= ((cs.critDmg || 1.5) + (opts.bonusCritDmg || 0) + crimsonWaveCritDmg + iceMirrorCritDmg + fnBonusCritDmg);
      const overflow = Math.max(0, totalCrit - 1.0);
      if (overflow > 0 && Math.random() < overflow) {
        isSuperCrit = true;
        finalDmg *= (player.superCritMult || 1.5);
      }
    }
  
    const isZeroMode = typeof SANDBOX_STATE !== 'undefined' && SANDBOX_STATE.active && SANDBOX_STATE.zeroDmgMode;
    const isDummyLocked = e.isDummy && typeof SANDBOX_STATE !== 'undefined' && SANDBOX_STATE.dummyInvincible;
    const dmgInt = isZeroMode ? 0 : Math.max(1, Math.round(finalDmg));
    e.hp -= dmgInt; e.hitFlash = 0.08;
    if (isDummyLocked) e.hp = e.maxHp;
    if (typeof recordSandboxDamage === 'function') recordSandboxDamage(dmgInt);
    const tagIcon = isZeroMode ? '🛡️' : (isSuperCrit ? '💢' : (isCrit ? '💥' : ''));
    const tagColor = isZeroMode ? '#94a3b8' : (isSuperCrit ? '#ff4d4f' : (isCrit ? '#fde047' : (opts.isDot ? '#fdba74' : '#fff')));
    if (!opts.hideText) {
      damageTexts.push({ x: e.x, y: e.y - e.radius, txt: `${tagIcon}${dmgInt}`, color: tagColor, life: 0.55 });
    }
  
         // 【冰系覺醒共鳴】對已凍結目標造成額外傷害時，觸發【碎冰處決】並解除凍結（之後 2 秒內免疫異常狀態）
    const iceRes = typeof getResonanceParams === 'function' ? getResonanceParams('ice') : null;
    const isBorisChar = (typeof saveData !== 'undefined' && saveData.charId === 'boris');
    const allowIceShatter = !isBorisChar || !!opts.isBorisIceEvo;
    if (iceRes && allowIceShatter && elem === 'ice' && (e.freezeTimer || 0) > 0 && !opts.isShatterProc && !opts.isDot && e.hp > 0) {
      e.freezeTimer = 0;
      e.chillStacks = 0;
      e.statusImmuneTimer = 2.0; // 解凍後 2 秒內免疫任何異常狀態（無法被重新凍結或上狀態）
      const shatterBase = isBorisChar ? Math.max(rawDmg, (cs.st?.I || 0) * 1.2 + (cs.st?.H || 0) * 0.6) : getSpellBase();
          const shatterDmg = Math.max(1, Math.round(shatterBase * iceRes.mult));
          slashes.push({ type: 'iceshatter', x: e.x, y: e.y, range: e.radius + 32, arc: Math.PI * 2, life: 0.28 });
          damageTexts.push({ x: e.x, y: e.y - e.radius - 16, txt: `❄️碎冰處決 ${shatterDmg}`, color: '#7dd3fc', fontSize: 15, life: 0.85 });
          hitEnemy(idx, shatterDmg, { element: 'ice', noCrit: true, isShatterProc: true, hideText: true });
        }
    
        // 【V2.5 聖印雙條件引爆】必須同時滿足：滿 3 層聖印 ＋ 造成傷害 (dmgInt > 0) ＋ 成功觸發異常 (rollStatusChance)
        const dealtDamage = dmgInt > 0;
        if (opts.consumeSeal && typeof tryTriggerHolyResonance === 'function') {
          const effSealBonus = (cs.statusChanceBonus || 0) + (opts.sealBonusChance || 0);
          const triggered = tryTriggerHolyResonance(e, dealtDamage, effSealBonus);   
         if (triggered) {
           const lRes = typeof getResonanceParams === 'function' ? getResonanceParams('holy') : null;
           const mult = opts.sealBurstMult || (lRes ? lRes.polyMult : 3.2);
           const stObj = cs.st || {};
           const burstBase = opts.usePhysSealBase ? ((stObj.H || 0) * 1.0 + Math.round((stObj.DEF || 0) * 0.8)) : getSpellBase();
           const burstDmg = Math.max(1, Math.round(burstBase * mult * resBonusMult * mod.endMult));
           e.hp -= burstDmg;
           if (isDummyLocked) e.hp = e.maxHp;
           if (typeof recordSandboxDamage === 'function') recordSandboxDamage(burstDmg);
           damageTexts.push({ x: e.x, y: e.y - e.radius - 16, txt: `✨聖印引爆 ${burstDmg}`, color: '#fef08a', fontSize: 17, life: 0.70 });
           if (!opts.noSealWave) {
             const wR = 135 * (1 + (lRes ? lRes.waveRadiusBonus : 0));
             spawnHolySealWave(e.x, e.y, wR);
           }
         }
       }  
  
     // 【引爆後疊層不浪費】確保在清空舊聖印後才執行當下這一擊的聖印疊層
     if (opts.onAfterHit && e.hp > 0) {
      opts.onAfterHit(e);
    }

    // 【真紅的死神】攻擊命中時獨立檢定 +5%/級 機率附加【點燃】（滿級 25%），燃燒傷害 +8%/級
    const reaperLv = (typeof ownedPassives !== 'undefined' && ownedPassives.crimsonReaper) || 0;
    if (reaperLv > 0 && !opts.isDot && e.hp > 0 && Math.random() < (reaperLv * 0.05)) {
      const reaperBurnMult = 1 + reaperLv * 0.08;
      const burnBase = Math.max(getSpellBase(), rawDmg * 0.28) * reaperBurnMult;
      if (typeof applyBurn === 'function') applyBurn(e, burnBase, cs.statusDurMult || 1.0);
      else {
        e.burnTimer = Math.max(e.burnTimer || 0, 3.0 * (cs.statusDurMult || 1.0));
        e.burnDps = Math.max(e.burnDps || 0, burnBase * 0.45);
      }
    }

    if (e.shockTimer > 0 && !opts.isShockProc && e.hp > 0) {
      const shockExtra = Math.max(1, Math.round(dmgInt * 0.15 * resBonusMult));
      e.hp -= shockExtra;
      damageTexts.push({ x: e.x + 12, y: e.y - e.radius - 10, txt: `⚡${shockExtra}`, color: '#fde047', life: 0.45 });
    }
  
    if (elem === 'lightning' && !opts.isChain && !opts.isDot && e.shockTimer > 0) {
      const blessMult = 1 + (ownedPassives.blessing || 0) * 0.03;
      const fullResBase = getSpellBase() * resBonusMult * player.dmgMult * (cs.magDmgMult || 1.0) * blessMult;
      triggerThunderChain(e, fullResBase);
    }
  
    if (!opts.isDouble && !opts.isDot && Math.random() < (cs.doubleHitChance || 0)) {
        hitEnemy(idx, rawDmg * 0.75, { ...opts, isDouble: true, consumeSeal: false });
        return;
      }
    
      if (isDummyLocked) e.hp = e.maxHp;
           // 【凝影冰心】所有攻擊命中獨立檢定 +6%/級 機率附加【寒氣】
           const iceMirrorLv = (typeof ownedPassives !== 'undefined' && ownedPassives.ice_mirror) || 0;
           if (iceMirrorLv > 0 && !opts.isDot && e.hp > 0 && Math.random() < (iceMirrorLv * 0.06)) {
             if (typeof applyStatusTagsOnHit === 'function') applyStatusTagsOnHit(e, ['ice'], getSpellBase(), cs, { isMelee: false });
           }
           if (e.hp <= 0 && !e.isDead) {
             e.isDead = true; // 標記已死亡，防止烈焰殉爆 AOE 再次命中同一具屍體造成無窮遞迴
             const cHeartLv = (typeof ownedPassives !== 'undefined' && ownedPassives.crimsonHeart) || 0;
             if (cHeartLv > 0 && ((e.burnTimer || 0) > 0 || (e.armorBreakTimer || 0) > 0) && (player.crimsonHeartIcd || 0) <= 0 && typeof player !== 'undefined') {
               player.crimsonHeartIcd = 0.5;
               const healAmt = Math.max(1, Math.round((player.maxHp || 200) * (cHeartLv * 0.004)));
               player.hp = Math.min(player.maxHp, (player.hp || 0) + healAmt);
               damageTexts.push({ x: player.x, y: player.y - 26, txt: `🐉+${healAmt}`, color: '#4ade80', fontSize: 13, life: 0.55 });
             }
             // 【紅月之誓】擊殺異常狀態敵人無冷卻回復 0.15%×等級 最大生命
             const redMoonLv = (typeof ownedPassives !== 'undefined' && ownedPassives.red_moon_oath) || 0;
             const hasAnyStatus = ((e.freezeTimer || 0) > 0 || (e.chillStacks || 0) > 0 || (e.armorBreakTimer || 0) > 0 || (e.darkTimer || 0) > 0 || (e.burnTimer || 0) > 0 || (e.shockTimer || 0) > 0 || (e.windTimer || 0) > 0);
             if (redMoonLv > 0 && hasAnyStatus && typeof player !== 'undefined') {
               const rmHeal = Math.max(1, Math.round((player.maxHp || 200) * (redMoonLv * 0.0015)));
               player.hp = Math.min(player.maxHp, (player.hp || 0) + rmHeal);
             }
             // 【貞奈曼的倖存者】每擊殺 60 名敵人獲得 1 層【守護披風】（上限 5 層）
             const jinemanLv = (typeof ownedPassives !== 'undefined' && ownedPassives.jineman_survivor) || 0;
             if (jinemanLv > 0 && !e.isDummy && typeof player !== 'undefined') {
               player.cloakKills = (player.cloakKills || 0) + 1;
               if (player.cloakKills >= 60) {
                 player.cloakKills -= 60;
                 if ((player.cloakStacks || 0) < 5) {
                   player.cloakStacks = (player.cloakStacks || 0) + 1;
                   damageTexts.push({ x: player.x, y: player.y - 38, txt: `🧥守護披風 (${player.cloakStacks}/5)`, color: '#60a5fa', fontSize: 13, life: 0.85 });
                 }
               }
             }
     
        const fireRes = (e.burnTimer > 0 && !opts.isMartyrBoom && typeof getResonanceParams === 'function') ? getResonanceParams('fire') : null;
        if (fireRes) {
          const boomR = fireRes.radius * player.areaMult;
          slashes.push({ type: 'fireboom', x: e.x, y: e.y, range: boomR, arc: Math.PI * 2, life: 0.25 });
          damageArea(e.x, e.y, boomR, 0, Math.PI * 2, getSpellBase() * fireRes.mult * resBonusMult, 12, { element: 'fire', isMartyrBoom: true });
        }
        if (e.darkTimer > 0) {
          zones.push({ kind: 'dark_pool', x: e.x, y: e.y, radius: 75 * player.areaMult, life: typeof DARK_ZONE_DUR !== 'undefined' ? DARK_ZONE_DUR : 2.0, tickTimer: 0.5, dmg: e.darkDps || getSpellBase() * 0.32, lv: 1 });
        }
        const nobleLv = ownedPassives.nobleFortune || 0;
        if (nobleLv > 0 && (e.isFinalBoss || e.isMegaBoss || e.isElite) && typeof saveData !== 'undefined') {
          const bonusSeed = Math.round((e.isFinalBoss ? 60 : (e.isMegaBoss ? 30 : 12)) * nobleLv * 0.20);
          if (bonusSeed > 0) {
            saveData.seed = (saveData.seed || 0) + bonusSeed;
            damageTexts.push({ x: e.x, y: e.y - e.radius - 14, txt: `💰+${bonusSeed} Seed`, color: '#fde047', fontSize: 12, life: 0.65 });
          }
        }
               // 技能昇華由升級三選一的金色昇華卡觸發

        // 讀取當前關卡、難度與防炸魚等級補正
        const runCfg = window.ACTIVE_STAGE_RUN || null;
        const st = runCfg ? runCfg.stage : (typeof STAGE_SELECT_LIST !== 'undefined' ? STAGE_SELECT_LIST.at(0) : { id: 'penine_forest', tier: 1, minLv: 1, maxLv: 16, baseDropRate: 0.025 });
        const diff = runCfg ? runCfg.diff : { key: 'normal', name: '🟢 普通', dropMult: 1.0 };
        const playerLv = (typeof saveData !== 'undefined' && saveData.outLv) ? saveData.outLv : 1;
        const gapInfo = typeof getStageLevelGapInfo === 'function' ? getStageLevelGapInfo(playerLv, st) : { dropRateMult: 1.0, maxRarIdx: 4 };
        const lvRange = typeof getStageDropLvRange === 'function' ? getStageDropLvRange(st) : { minLv: 0, maxLv: st.maxLv || 16 };

        const mobDropChance = getMobEquipmentDropChance(st, diff, gapInfo, player.dropRateMult ?? 1);
        const enemyTier = e.isFinalBoss ? 'final' : (e.isMegaBoss ? 'mega' : (e.isElite ? 'elite' : 'mob'));

        if (!e.isDummy && (e.isFinalBoss || e.isMegaBoss || e.isElite || Math.random() < mobDropChance)) {
          const dropCount = e.isFinalBoss ? 3 : (e.isMegaBoss ? 2 : 1);
          for (let d = 0; d < dropCount; d++) {
            const rar = typeof rollStageDropRarity === 'function'
              ? rollStageDropRarity(enemyTier, diff.key, gapInfo.maxRarIdx ?? 4)
              : 'green';
            const forceSelf = (e.isFinalBoss || e.isMegaBoss) && d === 0;
            const dropItem = createBattleEquipmentDrop(rar, lvRange, forceSelf);
            if (dropItem) {
              dropItem.sourceStageName = st.name || '未知領域';
              const ang = (Math.PI * 2 * d) / dropCount + Math.random() * 0.4;
              const spread = dropCount > 1 ? 26 : 0;
              lootBags.push({
                x: e.x + Math.cos(ang) * spread,
                y: e.y + Math.sin(ang) * spread,
                item: dropItem,
                color: RARITIES[rar].color,
                rarName: RARITIES[rar].name
              });
            }
          }
        }

        // 首通武器先記為待發獎勵，掃場結算時再與首通紀錄一起入庫。
        if (e.isFinalBoss && !e.isDummy && runCfg) {
          const clearKey = `${st.id}_${diff.key}`;
          if (!saveData.stageFirstClears?.[clearKey]) {
            const pending = (saveData.pendingFirstClearRewards ||= {});
            const firstClearGold = (pending[clearKey] ||= createFirstClearWeapon(runCfg.charId, runCfg.variantId, lvRange));
            try { writeSave(); }
            catch (e) { console.warn('無法保存待發首通獎勵，將於結算重試', e); }
            lootBags.push({
              x: e.x, y: e.y - 28, item: firstClearGold, color: RARITIES.gold.color, rarName: '首通傳說'
            });
          }

          // 【預留窗口】BOSS 專屬合成素材掉落接口（後續實裝消耗品／素材系統後啟用）
          if (st.boss && Array.isArray(st.boss.exclusiveDrops) && st.boss.exclusiveDrops.length > 0) {
            for (const mat of st.boss.exclusiveDrops) {
              if (Math.random() < (mat.chance || 0)) {
                // TODO：後續串接 saveData.materials 堆疊入庫與飄字提示
              }
            }
          }
        }

                // 局內 Seed 錢袋掉落（普通怪 12% 機率 3~6；菁英/首領/最終 BOSS 100% 必掉）
                if (!e.isDummy && typeof seedBags !== 'undefined') {
                  const tierMult = st.tier || 1;
                  const diffSeedMult = diff.dropMult || 1.0;
                  const playerSeedMult = player.seedMult || 1.0;
                  if (e.isFinalBoss || e.isMegaBoss || e.isElite || Math.random() < 0.12) {
                    const baseSeed = e.isFinalBoss
                      ? (250 + Math.floor(Math.random() * 151))
                      : (e.isMegaBoss ? (80 + Math.floor(Math.random() * 41))
                      : (e.isElite ? (25 + Math.floor(Math.random() * 16))
                      : (3 + Math.floor(Math.random() * 4))));
                    const finalSeedVal = Math.max(1, Math.round(baseSeed * tierMult * diffSeedMult * playerSeedMult));
                    seedBags.push({
                      x: e.x + (Math.random() * 20 - 10),
                      y: e.y + (Math.random() * 20 - 10),
                      val: finalSeedVal,
                      isBig: !!(e.isFinalBoss || e.isMegaBoss || e.isElite)
                    });
                  }
                }
        
                gems.push({ x: e.x, y: e.y, val: e.expValue });
                if (!e.isDummy && typeof fieldItems !== 'undefined' && Math.random() < 0.012) {
                  const itemKinds = ['potion', 'magnet', 'bomb', 'goldbag'];
                  const pickedKind = itemKinds[Math.floor(Math.random() * itemKinds.length)];
                  const item = { x: e.x, y: e.y, kind: pickedKind, life: 45 };
                  if (pickedKind === 'goldbag') {
                    const baseSeed = 3 + Math.floor(Math.random() * 4);
                    item.val = Math.max(1, Math.round(baseSeed * (st.tier || 1) * (diff.dropMult || 1) * (player.seedMult || 1)));
                  }
                  fieldItems.push(item);
                }
                const curIdx = enemies.indexOf(e);
        if (curIdx !== -1) enemies.splice(curIdx, 1);
        if (!e.isDummy) kills++;

        // 擊敗最終 BOSS 後清空場上殘怪，並啟動「全區磁吸掃場 ➔ 自動結算」
        if (e.isFinalBoss) {
          enemies = [];
          enemyProjectiles = [];
          if (typeof triggerVictoryVacuum === 'function') triggerVictoryVacuum();
          else endGame(true);
          return;
        }
      }
    }

    function damageArea(cx, cy, range, facing, arc, baseDmg, kb, opts = {}) {
      const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { knockbackMult: 1 };
      const kbMult = cs.knockbackMult || 1;
      let hitCount = 0;
      const slammedSet = new Set();
      for (let i = enemies.length - 1; i >= 0; i--) {
        if (opts.maxTargets && hitCount >= opts.maxTargets) break;
        const e = enemies[i];
        if (!e || e.isDead) continue;
        const dx = e.x - cx, dy = e.y - cy;
        if (Math.hypot(dx, dy) <= range + e.radius) {
          let diff = Math.atan2(dy, dx) - facing;
          while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
          if (arc >= Math.PI * 1.9 || Math.abs(diff) <= arc / 2) {
            hitCount++;
            let pushDist = 0;
            if (opts.hasKnockback) {
              const rawKb = (typeof opts.kbRange === 'object' && opts.kbRange)
                ? (opts.kbRange.min + Math.random() * (opts.kbRange.max - opts.kbRange.min))
                : kb;
              const kbFinal = rawKb * kbMult;
              const allowDummyKb = e.isDummy && typeof SANDBOX_STATE !== 'undefined' && SANDBOX_STATE.active && SANDBOX_STATE.dummyKnockback;
              const res = (e.isDummy && !allowDummyKb) ? 0 : ((e.isElite || e.isMegaBoss || e.isFinalBoss) ? 0.15 : 1);
              const ang = Math.atan2(dy, dx);
              pushDist = kbFinal * res;
              e.x += Math.cos(ang) * pushDist;
              e.y += Math.sin(ang) * pushDist;
            }
            if (opts.onTargetHit) opts.onTargetHit(e);
            const finalBaseDmg = (typeof opts.dmgModFn === 'function') ? (baseDmg * (opts.dmgModFn(e) || 1)) : baseDmg;
            hitEnemy(i, finalBaseDmg, opts);

            // 擊退物理動能撞擊公式：撞擊傷害 = 本次傷害 × (0.20 + 實際擊退距離 × 0.015)
            if (opts.hasKnockback && pushDist > 2 && !slammedSet.has(e) && enemies[i] === e && !e.isDead) {
              for (let k = enemies.length - 1; k >= 0; k--) {
                const other = enemies[k];
                if (other !== e && !other.isDead && Math.hypot(other.x - e.x, other.y - e.y) <= e.radius + other.radius + 10) {
                  slammedSet.add(e);
                  const slamDmg = finalBaseDmg * (0.20 + pushDist * 0.015);
                  damageTexts.push({ x: other.x, y: other.y - other.radius - 12, txt: `💥撞擊`, color: '#fb923c', fontSize: 12, life: 0.50 });
                  hitEnemy(k, slamDmg, { element: opts.element || 'none', noCrit: true });
                  break;
                }
              }
            }
          }
        }
      }
    }
    
    // 統一尋怪引擎（預設採最近敵人優先 nearest，支援技能卡 targetMode 客製覆寫）
    function findTargetEnemy(maxDist = 900, targetMode = 'nearest', candidates = enemies) {
      if (!candidates || candidates.length === 0) return null;
      const inRange = candidates.filter(e => Math.hypot(e.x - player.x, e.y - player.y) <= maxDist);
      if (inRange.length === 0) return null;
      if (targetMode === 'random') {
        return inRange[Math.floor(Math.random() * inRange.length)];
      }
      if (targetMode === 'highestHp') {
        return inRange.reduce((best, cur) => (cur.hp > best.hp ? cur : best), inRange[0]);
      }
      if (targetMode === 'status') {
        const afflicted = inRange.filter(e => e.burnTimer > 0 || e.freezeTimer > 0 || e.shockTimer > 0 || e.windTimer > 0 || (e.holySeal || 0) > 0 || e.darkTimer > 0);
        const pool = afflicted.length > 0 ? afflicted : inRange;
        return pool.reduce((best, cur) => (Math.hypot(cur.x - player.x, cur.y - player.y) < Math.hypot(best.x - player.x, best.y - player.y) ? cur : best), pool[0]);
      }
      return inRange.reduce((best, cur) => (Math.hypot(cur.x - player.x, cur.y - player.y) < Math.hypot(best.x - player.x, best.y - player.y) ? cur : best), inRange[0]);
    }

    function getVisibleSkillTargets(maxDist) {
      const halfWidth = canvas.width / 2, halfHeight = canvas.height / 2;
      return enemies.filter(e => {
        const dx = e.x - player.x, dy = e.y - player.y;
        return !e.isDead && Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight && Math.hypot(dx, dy) <= maxDist;
      });
    }
    
    function findNearestEnemy(maxDist) {
      return findTargetEnemy(maxDist, 'nearest');
    }

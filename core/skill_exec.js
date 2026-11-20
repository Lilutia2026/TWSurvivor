// ============================================================================
// core/skill_exec.js — 主動技能發射器與技能狀態動態計算
// ============================================================================

// [第 1 段：被動／主動技能升級預覽與目前狀態敘述計算（第 1 ～ 105 行）]
function getPassiveGainText(id, lv) {
    const map = {
      might:      `全技能最終傷害 +${8 * lv}%`,
      cdr:        `全技能冷卻縮減 +${6 * lv}%`,
      area:       `全技能攻擊範圍 +${10 * lv}%`,
      crit:       `全技能暴擊率 +${4 * lv}%`,
      resonance:  `元素異常與共鳴傷害 +${12 * lv}%`,
      lucky:      `裝備袋與寶箱掉落率 +${20 * lv}%`,
      windBoot:   `移動速度 +${9 * lv}%`,
      heal:       `每秒自然回復 +${(1.2 * lv).toFixed(1)} 生命`,
      manaShield: `每 ${Math.max(5, 13 - lv)} 秒生成 ${10 + 5 * lv}% 最大生命護盾`,
      thorns:     `受碰撞反彈 DEF×${100 + 50 * lv}% 傷害並擊退`,
      fastsword:  `全技能冷卻縮減 +${8 * lv}%、移動速度 +${4 * lv}%`,
      guard:      `全技能攻擊範圍 +${10 * lv}%`,
      haste:      `全技能冷卻縮減 +${8 * lv}%`,
      blessing:   `全技能最終傷害 +${3 * lv}%`,
      mageTalent: `無視怪物減傷抗性 +${3 * lv}%`,
      lightWall:  `物理減傷率 +${3 * lv}%`,
      magicShield:`魔法減傷率 +${3 * lv}%`,
      angelWish:  `賦予 1 次原地滿血復活與全屏淨化（代價：傷害 -10%、移速 -10%）`
    };
    return map[id] || '';
  }
  
  function getSkillNextLvGain(id, sk, nextLv) {
    const gains = [`基礎傷害 +${sk.perLv}`, '冷卻時間 -5%'];
    if (nextLv === 4) {
      if (id === 'renga') gains.push('解鎖雙重二連斬');
      if (id === 'aurora') gains.push('突刺距離延長');
      if (id === 'enbu') gains.push('劍氣殘留延長');
      if (id === 'windblade') gains.push('風刃穿透力提升至 2 名敵人');
      if (id === 'firearrow') gains.push('點燃基礎機率與持續傷害提升');
      if (id === 'thunder') gains.push('落雷感電機率提升');
    }
    if ((id === 'fire4' || id === 'ice4') && nextLv % 3 === 0) gains.push('隕石數量 +1 顆');
    if ((id === 'thunder1' || id === 'thunder4') && nextLv % 3 === 0) gains.push('落雷道數 +1 道');
    if (id === 'fire5' || id === 'ice5') gains.push('隕石數量 +1 顆、殘留領域擴大');
    if (id === 'thunder5') gains.push('落雷道數 +1 道、雷擊範圍擴大');
    if (id === 'holypoly') gains.push('聖光漩渦半徑擴大');
    if (id === 'ice2') gains.push('冰霧領域範圍 +6%');
    if (id === 'ice3' && nextLv === 6) gains.push('單次發射巨型寒冰球提升至 2 顆、散射冰彈威力提升至 60%');
    if ((id === 'windblade' || id === 'firearrow' || id === 'thunder') && nextLv % 3 === 0) gains.push('投射／落雷數量 +1');
    if (id === 'armorbreak') {
      gains.push('扇形範圍 +4%');
      if (nextLv === 3) gains.push('扇形角度擴大至 126°、擊退力 +20%');
      if (nextLv === 5) gains.push('撞擊傷害提升至 65%、擊退力再 +20%');
      if (nextLv === 8) gains.push('命中【破甲】目標暴擊率 +20%');
    }
    if (id === 'earthhammer') {
      gains.push('震地範圍 +3%');
      if (nextLv === 3) gains.push('聖印異常觸發率額外 +15%');
      if (nextLv === 6) gains.push('震地冷卻額外縮減 15%');
      if (nextLv === 8) gains.push('震地範圍額外 +10%、本次暴擊率 +15%');
    }
    if (id === 'frenzyhammer') {
      if (nextLv === 2) gains.push('第 3 錘終結範圍擴大 +25%');
      if (nextLv === 3) gains.push('第 3 錘終結傷害提升至 1.35x');
    }
    if (id === 'healLight' && nextLv % 2 === 1) {
      const nextHeal = Math.min(2.0, 0.8 + Math.floor((nextLv - 1) / 2) * 0.3).toFixed(1);
      gains.push(`光陣回血提升至 ${nextHeal}%/秒`);
    }
    if (id === 'radiance' && nextLv % 5 === 0) gains.push('光陣持續時間 +0.5 秒');
    if (['enbu', 'radiance', 'ice2', 'thunder2', 'fire2', 'fire4', 'ice4', 'thunder4'].includes(id)) {
      gains.push('攻擊範圍擴大');
    }
    return gains.join('、');
  }
  
  // 動態計算並彙整主動技能「目前等級」已累積的實際狀態敘述（供 Tooltip 與 ESC 面板顯示）
  function getSkillCurrentStatusText(id, sk, lv, isEvo) {
    const parts = [];
    const cdRedPct = Math.round((1 - Math.pow(0.95, Math.max(0, lv - 1))) * 100);
    if (cdRedPct > 0) parts.push(`技能冷卻 -${cdRedPct}%`);
    if (id === 'holylight' || id === 'fire1') parts.push(`單次發射 ${1 + Math.floor(lv / 2)} 發射彈`);
    if (id === 'radiance') {
      const radBonus = Math.round((lv - 1) * (50 / 9));
      const dur = (3.0 + Math.floor(lv / 5) * 0.5).toFixed(1);
      parts.push(`領域範圍 +${radBonus}%｜持續 ${dur}s（每 0.5s 灼燒並檢定聖印）`);
    }
    if (id === 'fire3') parts.push(`環繞火球 ${4 + Math.floor(lv / 2)} 顆`);
    if (id === 'ice1') parts.push(`單次投射 ${1 + Math.floor(lv / 4)} 發（每發可彈跳 ${1 + Math.floor(lv / 2)} 次）`);
    if (id === 'ice2') parts.push(`領域範圍 +${(lv - 1) * 6}%｜基礎凍結觸發率 15%（受 MR 加成）`);
    if (id === 'fire2') parts.push(`單次投射 ${1 + Math.floor(lv / 3)} 發`);
    if (id === 'ice3') parts.push(`單次投射 ${lv >= 6 ? 2 : 1} 顆巨型寒冰球（每 0.60s 散射 ${lv >= 6 ? 60 : 45}% 威力彈跳冰彈）`);
    if (id === 'fire4' || id === 'ice4') parts.push(`單次召喚 ${1 + Math.floor(lv / 3)} 顆隕石`);
    if (id === 'thunder1') parts.push(`單次落下 ${3 + Math.floor(lv / 2)} 道單體落雷`);
    if (id === 'thunder2') parts.push(`雙段電環極限半徑 +${(lv - 1) * 5}%（0.7s 擴散／0.3s 回縮）`);
    if (id === 'thunder3') {
      const balls = 1 + Math.floor(lv / 4);
      const bounces = 1 + Math.floor(lv / 4);
      const arcs = lv >= 5 ? 2 : 1;
      const jumps = lv >= 9 ? 3 : 2;
      parts.push(`單次投射 ${balls} 顆（彈跳 ${bounces} 次｜撞擊射出 ${arcs} 條連跳 ${jumps} 敵）`);
    }
    if (id === 'thunder4') parts.push(`單次落下 ${4 + Math.floor(lv / 2)} 道神雷`);
    if (id === 'thunder5') parts.push(`單次落下 ${4 + Math.floor(lv / 2)} 道紫霄神雷（附帶二次範圍電環）`);
    if (id === 'fire5') parts.push(`單次召喚 ${1 + Math.floor(lv / 2)} 顆天罰隕石（殘留灼燒火海）`);
    if (id === 'ice5') parts.push(`單次召喚 ${1 + Math.floor(lv / 2)} 顆太陰冰隕（殘留極凍冰霧）`);
    if (id === 'holypoly') parts.push(`漩渦半徑 ${140 + lv * 20}（2 秒無傷牽引聚怪並每秒檢定聖印，結束淨化引爆並擴散外圍補印光波）`); 
    if (id === 'windblade' || id === 'firearrow' || id === 'thunder') parts.push(`單次發動 ${1 + Math.floor(lv / 3)} 道`);
    if (id === 'renga' && lv >= 4) parts.push('已解鎖雙重二連斬');
    if (id === 'windblade' && lv >= 4) parts.push('風刃穿透 2 名敵人');
    if (id === 'armorbreak') {
      const wType = (typeof saveData !== 'undefined' && saveData.equip && saveData.equip.weapon) ? saveData.equip.weapon.type : '';
      const slamPct = lv >= 5 ? 65 : 45;
      const radPct = (lv - 1) * 4;
      parts.push(`扇形範圍 +${radPct}%｜擊退撞擊 ${slamPct}% 傷害${wType === 'staff' ? '（法杖模式：僅疊聖印）' : ''}`);
      if (lv >= 3) parts.push('廣角 126°');
      if (lv >= 8) parts.push('破甲目標暴率 +20%');
    }
    if (id === 'earthhammer') {
      const radPct = (lv - 1) * 3 + (lv >= 8 ? 10 : 0);
      parts.push(`360° 零擊退震波（範圍 +${radPct}%）`);
      if (lv >= 3) parts.push('聖印機率 +15%');
      if (lv >= 6) parts.push('額外冷卻 -15%');
      if (lv >= 8) parts.push('震地暴率 +15%');
    }
    if (id === 'frenzyhammer') {
      const lRes = typeof getResonanceParams === 'function' ? getResonanceParams('holy') : null;
      const bMult = lRes ? lRes.hammerMult : 3.0;
      parts.push(`0.60s 三連重錘（聖印引爆 ${bMult.toFixed(2)}x [H+DEF×0.8]｜第 3 錘聖印率 +25%）`);
      if (lv >= 2) parts.push('第 3 錘範圍 1.25x');
      if (lv >= 3) parts.push('第 3 錘傷害 1.35x');
    }
    if (id === 'healLight') {
      const healPct = Math.min(2.0, 0.8 + Math.floor((lv - 1) / 2) * 0.3).toFixed(1);
      parts.push(`光陣每秒回復 ${healPct}% 最大生命（殘留光陣無傷害）`);
    } 
    if (isEvo && !sk.isSuperWeapon) parts.push('超武昇華增傷 +45%');
  
    return parts.length > 0 ? parts.join(' ｜ ') : '基礎初始狀態（LV.1）';
  }

  // [第 2 段：主動技能發射器 triggerSkills（接續第 105 行至檔案結尾）]
function triggerSkills(dt) {
    const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { statusDurMult: 1, statusChanceBonus: 0, extraProj: 0 };
    const spellBase = getSpellBase();
    for (const [id, st] of Object.entries(ownedSkills)) {
      const sk = ACTIVE_SKILLS[id];
      if (!sk || st.disabled || ((sk.timer = (sk.timer || 0) - dt) > 0)) continue;
      const cdFactor = getEffectiveCdMult(Math.pow(0.95, st.lv - 1));
      const bTags = sk.behaviorTags || [];
      const sTags = Array.isArray(sk.statusTags) ? sk.statusTags : [];
      const isMeleeSkill = bTags.includes('melee') || bTags.includes('近戰');
      const areaFactor = (bTags.includes('範圍') || bTags.includes('aoe')) ? player.areaMult : 1.0;
      const bonusProj = (bTags.includes('射彈') || bTags.includes('projectile')) ? (cs.extraProj || 0) : 0;
      const rawDmg = getSkillRawDmg(id, st.lv, st.evolved);
      const partnerId = sk.resonancePartner || sk.resonanceSkill;
      const hasResonance = (st.evolved || sk.isSuperWeapon) && partnerId && ownedSkills[partnerId] && !ownedSkills[partnerId].disabled;
      const tMode = sk.targetMode || 'nearest';
  
      if (id === 'renga' || id === 'aurora' || id === 'aurorathrust' || id === 'senku' || id === 'enbu') {
        const range = (125 + st.lv * 10) * areaFactor * (st.evolved ? 1.35 : 1);
        if (id !== 'enbu') {
          const target = findTargetEnemy(range + 220, tMode);
          if (target) { player.facingAngle = Math.atan2(target.y - player.y, target.x - player.x); player.flipX = Math.cos(player.facingAngle) >= 0 ? 1 : -1; }
        }
        const isPierce = id === 'aurora' || id === 'aurorathrust';
        const arc = id === 'enbu' ? Math.PI * 2 : (isPierce ? 0.55 : (st.evolved ? Math.PI * 2 : 1.85));
        const swings = (id === 'renga' && st.lv >= 4) ? 2 : 1;
        for (let s = 0; s < swings; s++) {
          slashes.push({ type: hasResonance ? 'fireboom' : (isPierce ? 'aurora' : id), angle: player.facingAngle + (s * 0.3 - 0.15), range, arc, life: 0.18 + s * 0.06, evolved: st.evolved });
          damageArea(player.x, player.y, range, player.facingAngle, arc, rawDmg * (swings === 2 ? 0.72 : 1), id === 'enbu' ? 40 : 16, {
            element: sTags || 'none',
            onTargetHit: (e) => {
              if (sTags.length > 0) applyStatusTagsOnHit(e, sTags, spellBase, cs, { isMelee: isMeleeSkill });
            }
          });
        }
        sk.timer = sk.baseCd * cdFactor;
      } else if (id === 'windblade' || id === 'firearrow' || id === 'thunder') {
        const shots = 1 + Math.floor(st.lv / 3) + bonusProj;
        for (let i = 0; i < shots; i++) {
          const t = enemies[Math.floor(Math.random() * enemies.length)];
          const ang = t ? Math.atan2(t.y - player.y, t.x - player.x) : Math.random() * Math.PI * 2;
          if (id === 'thunder' && t) {
            applyStatusTagsOnHit(t, 'lightning', spellBase, cs);
            lightnings.push({ x1: t.x, y1: t.y - 80, x2: t.x, y2: t.y, life: 0.22 });
            hitEnemy(enemies.indexOf(t), rawDmg, { element: 'lightning' });
          } else {
            projectiles.push({ type: id === 'windblade' ? 'wind' : 'fire', elem: id === 'windblade' ? 'wind' : 'fire', x: player.x, y: player.y, vx: Math.cos(ang) * 560, vy: Math.sin(ang) * 560, radius: 10 * areaFactor, dmg: rawDmg, pierce: (id === 'windblade' && st.lv >= 4) ? 2 : 1, life: 1.4, hitSet: new Set() });
          }
        }
        sk.timer = sk.baseCd * cdFactor;
      } else if (id === 'holylight') {
        const shots = 1 + Math.floor(st.lv / 2) + bonusProj;
        const t = findTargetEnemy(750, tMode);
        const baseAng = t ? Math.atan2(t.y - player.y, t.x - player.x) : player.facingAngle;
        for (let i = 0; i < shots; i++) {
          const ang = baseAng + (i - (shots - 1) / 2) * 0.14;
          projectiles.push({ type: 'holy', elem: 'holy', statusTags: sTags, x: player.x, y: player.y, vx: Math.cos(ang) * 620, vy: Math.sin(ang) * 620, radius: 9 * areaFactor, dmg: rawDmg, pierce: 4, life: 1.3, hitSet: new Set() });
        }
        sk.timer = sk.baseCd * cdFactor;
      } else if (id === 'radiance' || id === 'healLight' || id === 'holypoly') {
        const t = findTargetEnemy(650, tMode);
        const tx = t ? t.x : player.x + (Math.random() - 0.5) * 160, ty = t ? t.y : player.y + (Math.random() - 0.5) * 160;
        const lvScale = id === 'radiance' ? (1 + (st.lv - 1) * (0.50 / 9)) : 1.0;
        const rad = (id === 'holypoly' ? (140 + st.lv * 20) : (110 * lvScale)) * areaFactor;
        if (id === 'healLight') {
          slashes.push({ type: 'holywave', x: tx, y: ty, range: rad, arc: Math.PI * 2, life: 0.25 });
          damageArea(tx, ty, rad, 0, Math.PI * 2, rawDmg, 10, {
            element: 'holy',
            onTargetHit: (e) => applyStatusTagsOnHit(e, 'holy', spellBase, cs, { isMelee: false })
          });
        }
        const dur = id === 'holypoly' ? 2.0 : (3.0 + Math.floor(st.lv / 5) * 0.5);
        zones.push({ kind: id, statusTags: sTags, x: tx, y: ty, radius: rad, life: dur, tickTimer: id === 'holypoly' ? 1.0 : 0.5, dmg: rawDmg, lv: st.lv });
        sk.timer = sk.baseCd * cdFactor;  
      } else if (id === 'armorbreak') {
        const wType = (typeof saveData !== 'undefined' && saveData.equip && saveData.equip.weapon) ? saveData.equip.weapon.type : '';
        const effTags = (wType === 'staff') ? sTags.filter(tag => tag !== 'armor_break') : sTags;
        const range = 145 * (1 + (st.lv - 1) * 0.04) * areaFactor;
        const arc = st.lv >= 3 ? 2.2 : 1.7;
        const kbMult = 1 + (st.lv >= 3 ? 0.20 : 0) + (st.lv >= 5 ? 0.20 : 0);
        const slamRatio = st.lv >= 5 ? 0.65 : 0.45;
        const near = findTargetEnemy(range + 160, tMode);
        if (near) { player.facingAngle = Math.atan2(near.y - player.y, near.x - player.x); player.flipX = Math.cos(player.facingAngle) >= 0 ? 1 : -1; }
        slashes.push({ type: 'holywave', x: player.x, y: player.y, angle: player.facingAngle, range, arc, life: 0.22 });
        damageArea(player.x, player.y, range, player.facingAngle, arc, rawDmg, 18, {
          element: 'holy',
          isStrike: true,
          kbRange: { min: 15 * kbMult, max: 22 * kbMult },
          slamRatio,
          bonusCritFn: (e) => (st.lv >= 8 && (e.armorBreakTimer || 0) > 0) ? 0.20 : 0,
          onTargetHit: (e) => {
            if (effTags.length > 0) applyStatusTagsOnHit(e, effTags, spellBase, cs, { isMelee: isMeleeSkill });
          }
        });
        sk.timer = sk.baseCd * cdFactor;
      } else if (id === 'earthhammer') {
        const range = 135 * (1 + (st.lv - 1) * 0.03 + (st.lv >= 8 ? 0.10 : 0)) * areaFactor;
        const hammerCs = st.lv >= 3 ? { ...cs, statusChanceBonus: (cs.statusChanceBonus || 0) + 0.15 } : cs;
        const extraCd = st.lv >= 6 ? 0.85 : 1.0;
        slashes.push({ type: 'holywave', x: player.x, y: player.y, angle: 0, range, arc: Math.PI * 2, life: 0.24 });
        damageArea(player.x, player.y, range, 0, Math.PI * 2, rawDmg, 0, {
          element: 'holy',
          isStrike: true,
          bonusCritFn: () => (st.lv >= 8 ? 0.15 : 0),
          onTargetHit: (e) => {
            if (sTags.length > 0) applyStatusTagsOnHit(e, sTags, spellBase, hammerCs, { isMelee: isMeleeSkill });
          }
        });
        sk.timer = sk.baseCd * getEffectiveCdMult(Math.pow(0.95, st.lv - 1) * extraCd);
      } else if (id === 'frenzyhammer') {
        const lRes = typeof getResonanceParams === 'function' ? getResonanceParams('holy') : null;
        const burstMult = lRes ? lRes.hammerMult : 3.0;
        const otherTags = sTags.filter(tag => tag !== 'holy');
        for (let hitIdx = 0; hitIdx < 3; hitIdx++) {
          const isLastHit = hitIdx === 2;
          const hitRange = 150 * ((isLastHit && st.lv >= 2) ? 1.25 : 1.0) * areaFactor;
          const hitDmg = rawDmg * ((isLastHit && st.lv >= 3) ? 1.35 : 1.0);
          const lastSealBonus = isLastHit ? 0.25 : 0;
          const strikeCs = isLastHit ? { ...cs, statusChanceBonus: (cs.statusChanceBonus || 0) + 0.25 } : cs;
          const execStrike = () => {
            slashes.push({ type: 'holywave', x: player.x, y: player.y, angle: 0, range: hitRange, arc: Math.PI * 2, life: 0.20 });
            damageArea(player.x, player.y, hitRange, 0, Math.PI * 2, hitDmg, 0, {
              element: 'holy',
              isStrike: true,
              consumeSeal: true,
              usePhysSealBase: true,
              noSealWave: true,
              sealBurstMult: burstMult,
              sealBonusChance: lastSealBonus,
              onTargetHit: (e) => {
                if (otherTags.length > 0) applyStatusTagsOnHit(e, otherTags, spellBase, strikeCs, { isMelee: isMeleeSkill });
              },
              onAfterHit: (e) => {
                applyStatusTagsOnHit(e, ['holy'], spellBase, strikeCs, { isMelee: isMeleeSkill });
              }
            });
          };
          if (hitIdx === 0) execStrike();
          else if (typeof delayedActions !== 'undefined') delayedActions.push({ delay: hitIdx * 0.30, fn: execStrike });
        }
        sk.timer = sk.baseCd * cdFactor;
  
      } else if (id.startsWith('fire') || id.startsWith('ice') || id.startsWith('thunder')) {
        const elem = id.startsWith('fire') ? 'fire' : (id.startsWith('ice') ? 'ice' : 'lightning');
        if (id === 'ice2') {
          const t = findTargetEnemy(650, tMode);
          const tx = t ? t.x : player.x + Math.cos(player.facingAngle) * 140;
          const ty = t ? t.y : player.y + Math.sin(player.facingAngle) * 140;
          const ice2Radius = 110 * (1 + (st.lv - 1) * 0.06) * areaFactor;
          zones.push({ kind: 'ice2', statusTags: sTags, x: tx, y: ty, radius: ice2Radius, life: 3.0 + Math.floor(st.lv / 3) * 0.5, tickTimer: 0.5, dmg: rawDmg, lv: st.lv });
          sk.timer = sk.baseCd * cdFactor;
          continue;
        }
        if (id === 'thunder2') {
          const maxR = 145 * (1 + (st.lv - 1) * 0.05) * areaFactor;
          zones.push({
            kind: 'thunder2', statusTags: sTags, x: player.x, y: player.y,
            radius: 25, maxRadius: maxR, elapsed: 0, life: 1.0,
            dmg: rawDmg, lv: st.lv, outHitSet: new Set(), inHitSet: new Set()
          });
          sk.timer = sk.baseCd * cdFactor;
          continue;
        }
  
        const baseCount = (id === 'fire1' || id === 'fire5' || id === 'ice5') ? (1 + Math.floor(st.lv / 2))
          : (id === 'fire3' ? (4 + Math.floor(st.lv / 2))
          : ((id === 'ice1' || id === 'thunder3') ? (1 + Math.floor(st.lv / 4))
          : (id === 'ice3' ? (st.lv >= 6 ? 2 : 1)
          : (id === 'thunder1' ? (3 + Math.floor(st.lv / 2))
          : ((id === 'thunder4' || id === 'thunder5') ? (4 + Math.floor(st.lv / 2)) : (1 + Math.floor(st.lv / 3)))))));
        const count = baseCount + bonusProj;
        const mainTarget = findTargetEnemy(750, tMode);
        const mainAng = mainTarget ? Math.atan2(mainTarget.y - player.y, mainTarget.x - player.x) : player.facingAngle;
        if (mainTarget) { player.facingAngle = mainAng; player.flipX = Math.cos(mainAng) >= 0 ? 1 : -1; }
  
        const struckTargets = new Set();

        for (let i = 0; i < count; i++) {
          let t = null;
          if (id === 'thunder1' || id === 'thunder4' || id === 'thunder5') {
            if (i === 0 && mainTarget && !mainTarget.isDead) {
              t = mainTarget;
            } else {
              const avail = enemies.filter(cand => !cand.isDead && !struckTargets.has(cand) && Math.hypot(cand.x - player.x, cand.y - player.y) <= 750);
              if (avail.length > 0) t = avail[Math.floor(Math.random() * avail.length)];
            }
            if (t) struckTargets.add(t);
          } else if (id === 'fire1') {
            if (i === 0 && mainTarget && !mainTarget.isDead) {
              t = mainTarget;
            } else {
              const avail = enemies.filter(cand => !cand.isDead && !struckTargets.has(cand) && Math.hypot(cand.x - player.x, cand.y - player.y) <= 750);
              if (avail.length > 0) t = avail[Math.floor(Math.random() * avail.length)];
            }
            if (!t && i > 0) continue; // 一彈一目標：場上無更多獨立目標時，不把多餘火箭灌在同一目標上
            if (t) struckTargets.add(t);
          } else {
            t = (i === 0 && mainTarget) ? mainTarget : (enemies[Math.floor(Math.random() * enemies.length)] || mainTarget);
          }

          const spreadOffset = (i === 0 || (id === 'fire1' && t)) ? 0 : (i - (count - 1) / 2) * 0.16;
          const ang = id === 'fire3' ? ((Math.PI * 2 / count) * i) : (t ? Math.atan2(t.y - player.y, t.x - player.x) + spreadOffset : mainAng + spreadOffset);
          if (id === 'thunder1') {
            if (!t || t.isDead) continue; // 場上敵人少於落雷道數時，同一目標絕不吃第二道雷
            const tIdx = enemies.indexOf(t);
            if (tIdx !== -1) {
              lightnings.push({ x1: t.x, y1: t.y - 115, x2: t.x, y2: t.y, life: 0.22, kind: 'normal' });
              applyStatusTagsOnHit(t, 'lightning', spellBase, cs);
              hitEnemy(tIdx, rawDmg, { element: 'lightning' });
            }
          } else if (id === 'thunder4' || id === 'thunder5') {
            if (!t || t.isDead) continue; // 同一目標本輪最多只鎖定 1 道狂雷／紫霄
            const isSuper = id === 'thunder5';
            const tx = t.x, ty = t.y;
            const hitR = (isSuper ? 105 : 85) * areaFactor;
            lightnings.push({ x1: tx + 16, y1: ty - 150, x2: tx, y2: ty, life: 0.28, kind: isSuper ? 'purple_super' : 'purple' });
            slashes.push({ type: 'thunderwave', x: tx, y: ty, range: hitR, arc: Math.PI * 2, life: 0.22 });
            damageArea(tx, ty, hitR, 0, Math.PI * 2, rawDmg, 12, {
              element: 'lightning', onTargetHit: (e) => applyStatusTagsOnHit(e, 'lightning', spellBase, cs)
            });
            if (isSuper) {
              const ringR = 165 * player.areaMult;
              slashes.push({ type: 'thunderring', x: tx, y: ty, range: ringR, arc: Math.PI * 2, life: 0.32 });
              damageArea(tx, ty, ringR, 0, Math.PI * 2, rawDmg * 0.35, 8, {
                element: 'lightning', onTargetHit: (e) => applyStatusTagsOnHit(e, 'lightning', spellBase, cs)
              });
            }
          } else if (id === 'fire2') {
            const targetObj = (i === 0 && mainTarget) ? mainTarget : (enemies[Math.floor(Math.random() * enemies.length)] || null);
            const spreadAng = mainAng + (i - (count - 1) / 2) * 0.22;
            const destX = targetObj ? targetObj.x + (i > 0 ? (Math.random() - 0.5) * 70 : 0) : player.x + Math.cos(spreadAng) * 260;
            const destY = targetObj ? targetObj.y + (i > 0 ? (Math.random() - 0.5) * 70 : 0) : player.y + Math.sin(spreadAng) * 260;
            const dist = Math.hypot(destX - player.x, destY - player.y);
            const flightDur = Math.max(0.45, Math.min(0.80, dist / 520));
            projectiles.push({
              type: 'fire', elem: 'fire', skillId: 'fire2', isLob: true, targetObj,
              x: player.x, y: player.y, startX: player.x, startY: player.y, targetX: destX, targetY: destY,
              elapsed: 0, flightDur, arcHeight: 95, z: 0,
              radius: 18 * areaFactor, dmg: rawDmg, pierce: 1, life: flightDur + 0.1, hitSet: new Set()
            });
          } else if (id === 'fire4' || id === 'fire5' || id === 'ice4' || id === 'ice5') {
            const targetObj = (i === 0 && mainTarget) ? mainTarget : (enemies[Math.floor(Math.random() * enemies.length)] || null);
            const spreadAng = mainAng + (i - (count - 1) / 2) * 0.35;
            const destX = targetObj ? targetObj.x + (i > 0 ? (Math.random() - 0.5) * 95 : 0) : player.x + Math.cos(spreadAng) * (240 + i * 35);
            const destY = targetObj ? targetObj.y + (i > 0 ? (Math.random() - 0.5) * 95 : 0) : player.y + Math.sin(spreadAng) * (240 + i * 35);
            const fallDur = 0.42 + i * 0.08;
            const isSuper = id.endsWith('5');
            projectiles.push({
              type: elem, elem, skillId: id, isMeteor: true,
              x: destX + 140, y: destY - 420, startX: destX + 140, startY: destY - 420, targetX: destX, targetY: destY,
              elapsed: 0, fallDur, radius: (isSuper ? 32 : 26) * areaFactor,
              boomRadius: (isSuper ? 145 : 120) * areaFactor,
              dmg: rawDmg, pierce: 1, life: fallDur + 0.1, hitSet: new Set()
            });
          } else {
            const isOrb = id === 'ice3', isIceBounce = id === 'ice1', isThunderBall = id === 'thunder3';
            const spd = isIceBounce ? 680 : (isThunderBall ? 620 : (isOrb ? 210 : 520));
            const baseRad = isOrb ? 22 : (isThunderBall ? 14 : (id.endsWith('4') || id.endsWith('5') ? 26 : 11));
            const pierceCount = isOrb ? 99 : (isIceBounce ? (2 + Math.floor(st.lv / 2)) : (isThunderBall ? (2 + Math.floor(st.lv / 4)) : 1));
            projectiles.push({
              type: elem, elem, skillId: id, lv: st.lv, isBounce: isIceBounce || isThunderBall, speed: spd,
              x: player.x, y: player.y,
              vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
              radius: baseRad * areaFactor,
              dmg: rawDmg, pierce: pierceCount,
              life: isOrb ? 2.8 : 1.5, orbShootCd: 0.45,
              hitSet: new Set(), crushCds: new Map()
            });
          }
        }
        sk.timer = sk.baseCd * cdFactor;
      }
    }
  }

  
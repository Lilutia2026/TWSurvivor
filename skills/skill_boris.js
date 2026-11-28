// 波里斯．貞奈曼（小波）專屬技能與輔助庫（V3.2 統一大卡池雙向標籤架構・共 16 張卡片）
const BORIS_PASSIVES = {
    dark_weaken: {
        name: '🌑 衰弱術', reqChar: ['boris'], skillTags: ['boris_unique'], maxLv: 5,
        desc: '周身展開暗黑光環，範圍內敵人承受全傷 +4%/級（滿級 +20%）；每 0.33 秒發動一次獨立檢定（每級 +6%，滿級 30%）附加【暗蝕】，光環半徑每級擴大'
      },   
    guardian_warrior: {
      name: '🛡️ 護衛武士', reqChar: ['boris'], skillTags: ['boris_unique'], maxLv: 5,
      desc: '每級全技能最終傷害 +5%（滿級 +25%），物理減傷 +2%、魔法減傷 +2%（滿級雙減傷各 +10%）'
    },
    ice_mirror: {
      name: '❄️ 凝影冰心', reqChar: ['boris'], skillTags: ['boris_unique'], maxLv: 5,
      desc: '每級冰屬性異常觸發率 +6%（滿級 +30%），所有攻擊命中皆可獨立檢定附加【寒氣】；對【凍結】目標暴擊傷害額外 +6%/級'
    },
    sword_priest: {
      name: '🦁 劍之司祭', reqChar: ['boris'], skillTags: ['boris_unique'], maxLv: 5,
      desc: '師承納烏普利翁的劍術奧義，每級全技能暴擊率 +3%（滿級 +15%）、全技能冷卻縮減 +3%（滿級 +15%）'
    },
    jineman_survivor: {
      name: '🧥 貞奈曼的倖存者', reqChar: ['boris'], skillTags: ['boris_unique'], maxLv: 5,
      desc: '每級最大生命 +5%（滿級 +25%）；每擊殺 60 名敵人獲得 1 層【守護披風】（上限 5 層），滿 5 層時受致命傷消耗全部層數免死一次並回復 35% 生命'
    },
    red_moon_oath: {
      name: '🌕 紅月之誓', reqChar: ['boris'], skillTags: ['boris_unique'], reqJobTier: 2, maxLv: 5,
      desc: '【二轉覺醒】每級全技能最終傷害 +8%、全異常觸發率 +5%；每秒消耗 0.6%/級 當前生命（不致死），擊殺異常狀態敵人無冷卻回復 0.15%/級 最大生命'
    },
    ice_seal: {
      name: '💠 冰花影封', reqChar: ['boris'], skillTags: ['boris_unique'], reqJobTier: 2, maxLv: 5,
      desc: '【二轉覺醒】每級冰屬性技能最終傷害 +6%、寒氣與凍結持續時間 +10%；敵人陷入【凍結】時綻放冰花印記使受擊傷害 +15%，碎冰時濺射周身並傳染寒氣'
    }
  };
  
  const BORIS_SKILLS = {
    // === 一轉專屬主動池（LV.8 / LV.10） ===
    earth_slash: {
      name: '大地裂斬', icon: '⛰️', evoName: '爆怒地烈破', evoIcon: '🌋',
      reqChar: ['boris'], skillTags: ['boris_unique'], reqWeaponTypes: ['tachi', 'greatsword', 'blade'],
      type: 'physical', element: 'physical', statusTags: [], statTags: ['H', 'S'], behaviorTags: ['melee', 'aoe'], maxLv: 8,
      baseDmg: 22, perLv: 8, baseCd: 1.15, canEvolve: true, reqPassive: 'guardian_warrior', evoSkillId: 'earth_quake', disableWhenEvo: true,
      evoDesc: '【劍技・物理・H+S・近戰・範圍】以鎖定目標為中心震出深黃色圓形地裂雙段重擊，檢定附加【破甲】，對【破甲】目標暴擊傷害額外 +15%～25%。',
      desc: '【劍技・物理・H+S・近戰・範圍】鎖定最近敵人落點依序滑出兩刀，在目標腳下交錯震開成 X 型雙段深黃地裂；LV.4 範圍擴大 +25%，LV.8 附帶【破甲】檢定。'
    },
    ice_strike: {
      name: '冰擊斬', icon: '❄️', evoName: '極寒冰擊斬', evoIcon: '💠',
      reqChar: ['boris'], skillTags: ['boris_unique'], reqWeaponTypes: ['tachi', 'greatsword', 'blade'],
      type: 'physical', element: 'ice', statusTags: ['ice'], statTags: ['I', 'H'], behaviorTags: ['melee', 'aoe'], maxLv: 8,
      baseDmg: 18, perLv: 6, baseCd: 1.15, canEvolve: true, reqPassive: 'ice_mirror', evoSkillId: 'ice_strike_evo', disableWhenEvo: true,
      evoDesc: '【刀技・物理・冰・I+H・近戰・範圍】藍色雨刷式雙向橫掃並散射 4～6 枚無傷害追蹤寒霜彈高機率疊加【寒氣】；命中【凍結】目標造成純單體碎冰額外傷害。',
      desc: '【刀技・物理・冰・I+H・近戰・範圍】朝目標方向一刀向左、一刀向右雨刷式來回橫掃藍色寒霜刀光並機率附加【寒氣】；LV.4 範圍擴大 +20%，LV.6 掃擊末端射出 2 枚冰錐。'
    },
    dark_curse: {
      name: '暗咒術', icon: '🌑',
      reqChar: ['boris'], skillTags: ['boris_unique'], reqWeaponTypes: ['tachi', 'greatsword', 'blade'],
      type: 'magic', element: 'dark', statusTags: ['dark'], statTags: ['INT', 'MR'], behaviorTags: ['ranged'], maxLv: 10,
      baseDmg: 26, perLv: 9, baseCd: 1.30, canEvolve: false,
      desc: '【黑魔・魔法・暗・INT+MR・遠程】鎖定 2～4 名敵人降下單體暗黑咒印造成暗屬性傷害並附加【暗蝕】，檢測目標本身已帶異常狀態時額外發動 75% 單體暗影追擊。'
    },
  
    // === 一轉武器專屬超武（方案 A・上限 LV.3） ===
    earth_quake: {
        name: '爆怒地烈破', icon: '🌋', reqChar: ['boris'], skillTags: ['boris_unique'], reqWeaponTypes: ['tachi'],
        isSuperWeapon: true, evoFrom: 'earth_slash',
        type: 'physical', element: 'physical', statusTags: [], resonanceElem: 'armor_break', resonancePartner: 'enbu', statTags: ['H', 'S'], behaviorTags: ['melee', 'aoe'], maxLv: 3,
        baseDmg: 54, perLv: 18, baseCd: 1.25, canEvolve: false,
        resonanceDesc: '同時持有【圓月斬】時啟動：命中【破甲】目標時額外追加 45%～65%【碎甲震盪】物理傷害並無視 30% 抗性。',
        desc: '【劍技・物理・H+S・近戰・範圍】以鎖定目標為中心打出深黃色圓形地裂，總計 2 次範圍物理傷害；每段皆檢定附加【破甲】，對【破甲】目標暴擊傷害額外 +15%／+20%／+25%。'
      },
      ice_strike_evo: {
        name: '極寒冰擊斬', icon: '💠', reqChar: ['boris'], skillTags: ['boris_unique'], reqWeaponTypes: ['greatsword'],
        isSuperWeapon: true, evoFrom: 'ice_strike',
        type: 'physical', element: 'ice', statusTags: [], resonanceElem: 'ice', resonancePartner: 'ice1', statTags: ['I', 'H'], behaviorTags: ['melee', 'aoe'], maxLv: 3,
        baseDmg: 34, perLv: 12, baseCd: 1.20, canEvolve: false,
        resonanceDesc: '同時持有【冰彈術】時啟動：僅【極寒冰擊斬】本身命中【凍結】目標才可觸發純單體【碎冰處決】爆發（140%～220%）。',
        desc: '【刀技・物理・冰・I+H・近戰・範圍】藍色雨刷式雙向橫掃並散射 4～6 枚無傷害追蹤寒霜彈高機率附加【寒氣】。'   
      },
      shadow_sword: {
        name: '殘影劍式', icon: '👥', reqChar: ['boris'], skillTags: ['boris_unique'], reqWeaponTypes: ['blade'],
        isSuperWeapon: true, evoFrom: 'renga',
        type: 'physical', element: 'physical', statusTags: [], resonanceElem: 'dark', resonancePartner: 'dark_curse', statTags: ['H'], behaviorTags: ['melee', 'aoe'], maxLv: 3,
        baseDmg: 36, perLv: 12, baseCd: 1.35, canEvolve: false,
        resonanceDesc: '同時持有【暗咒術】時啟動：暗咒術對已帶異常狀態敵人的單體暗影追擊大幅強化。',
        desc: '【劍技・物理・H・近戰・範圍】據說可以劈砍影子而得名的強力劍術。0.00s 本體左掃 ➔ 0.14s 本體右掃 ➔ 0.28s 本體矩形重斬 ➔ 0.42s 雙暗影分身動態交叉補刀。'
      },
    
      // === 二轉預留超武（reqJobTier: 2・上限 LV.3） ===
      sky_earth_wave: {
        name: '天地震烈波', icon: '☄️', reqChar: ['boris'], skillTags: ['boris_unique'], reqWeaponTypes: ['tachi'],
        isSuperWeapon: true, reqJobTier: 2, evoFrom: 'earth_slash',
        type: 'physical', element: 'physical', statusTags: [], resonanceElem: 'armor_break', resonancePartner: 'enbu', statTags: ['H', 'S'], behaviorTags: ['melee', 'aoe'], maxLv: 3,
        baseDmg: 58, perLv: 18, baseCd: 1.35, canEvolve: false,
        resonanceDesc: '同時持有【圓月斬】時啟動：命中【破甲】目標時額外追加 45%～65%【碎甲震盪】物理傷害並無視 30% 抗性。',
        desc: '【二轉超武・物理・H+S・範圍】以自身為中心打出 3 道半徑遞增的同心圓震盪波（第 3 道 2 段傷），每段皆可檢定【破甲】；僅對受擊前已處於【破甲】的目標觸發破甲增傷與無視抗性。'
      },   
      ice_breaker: {
        name: '冰晶破魔斬', icon: '❄️', reqChar: ['boris'], skillTags: ['boris_unique'], reqWeaponTypes: ['greatsword'],
        isSuperWeapon: true, reqJobTier: 2, evoFrom: 'ice_strike',
        type: 'physical', element: 'ice', statusTags: [], resonanceElem: 'ice', resonancePartner: 'ice1', statTags: ['I', 'H'], behaviorTags: ['melee', 'aoe'], maxLv: 3,
        baseDmg: 68, perLv: 22, baseCd: 1.25, canEvolve: false,
        resonanceDesc: '同時持有【冰彈術】時啟動：冰系技能命中【凍結】目標觸發純單體【碎冰處決】爆發。',
        desc: '【二轉超武・物理・冰・I+H・近戰・範圍】揮動巨劍斬出 3 道交錯藍色破魔冰刃；命中【凍結】目標造成純單體碎冰額外傷，並向外擴散無傷害寒氣波高機率附加【寒氣】。'
      },
    
    inherited_sword: {
      name: '人劍合一', icon: '🐅', reqChar: ['boris'], skillTags: ['boris_unique'], reqWeaponTypes: ['blade'],
      isSuperWeapon: true, reqJobTier: 2, evoFrom: 'renga',
      type: 'physical', element: 'physical', statusTags: [], statTags: ['H'], behaviorTags: ['melee', 'aoe'], maxLv: 3,
      baseDmg: 44, perLv: 15, baseCd: 1.85, canEvolve: false,
      desc: '【二轉超武・物理・H・近戰・範圍】化作猛虎氣勢朝前方扇形發動 5 段高速本能劈砍，每段傷害依序遞增。'
    }
  };
  
  CHAR_SKILL_REGISTRY.boris = { passives: BORIS_PASSIVES, skills: BORIS_SKILLS };
  if (typeof registerGlobalPassives === 'function') registerGlobalPassives(BORIS_PASSIVES);
  if (typeof registerGlobalSkills === 'function') registerGlobalSkills(BORIS_SKILLS);
  
  function triggerBorisSkill(id, st, sk, rawDmg, cdFactor, areaFactor, spellBase, cs, tMode) {
    if (id === 'earth_slash') {
      const lockRange = 240 * areaFactor;
      const target = findTargetEnemy(lockRange, tMode, getVisibleSkillTargets(lockRange));
      if (!target) { sk.timer = 0; return true; }
      const cx = target.x, cy = target.y, baseAng = Math.atan2(cy - player.y, cx - player.x);
      const lvLenScale = 1 + (st.lv - 1) * (0.50 / 7); // LV.1: 1.0x ➔ LV.8: 1.5x
      const len = 148 * lvLenScale * areaFactor, hw = 24 * (st.lv >= 4 ? 1.20 : 1.0) * areaFactor;
      const angs = new Array(baseAng - 0.62, baseAng + 0.62);
      for (let s = 0; s < 2; s++) {
        const fn = () => {
          const a = angs[s], c = Math.cos(a), sn = Math.sin(a);
          slashes.push({ type: 'boris_earth_x', x: cx, y: cy, angle: a, length: len, width: hw * 2, life: 0.50, maxLife: 0.50 });
          for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i]; if (!e || e.isDead) continue;
            const dx = e.x - cx, dy = e.y - cy;
            if (Math.abs(dx * c + dy * sn) <= len * 0.52 + e.radius && Math.abs(-dx * sn + dy * c) <= hw + e.radius) {
              if (st.lv >= 8) applyStatusTagsOnHit(e, ['armor_break'], spellBase, cs, { isMelee: true });
              hitEnemy(i, rawDmg, { element: 'physical', isPhysSkill: true });
            }
          }
        };
        if (s === 0) fn(); else delayedActions.push({ delay: 0.14, fn });
      }
      sk.timer = sk.baseCd * cdFactor; return true;
    }
  
    if (id === 'ice_strike') {
      const range = 148 * (st.lv >= 4 ? 1.20 : 1.0) * areaFactor, arc = 1.95;
      const target = findTargetEnemy(range + 180, tMode);
      const aim = target ? Math.atan2(target.y - player.y, target.x - player.x) : player.facingAngle;
      const iceCs = st.lv >= 4 ? { ...cs, statusChanceBonus: (cs.statusChanceBonus || 0) + 0.10 } : cs;
      for (let s = 0; s < 2; s++) {
        const dir = s === 0 ? -1 : 1;
        const fn = () => {
          slashes.push({ type: 'boris_ice_wiper', angle: aim, range, arc, dir, life: 0.20, maxLife: 0.20 });
          damageArea(player.x, player.y, range, aim, arc, rawDmg, 0, {
            element: 'ice', isPhysSkill: true, isBorisIceEvo: true, onTargetHit: (e) => applyStatusTagsOnHit(e, ['ice'], spellBase, cs, { isMelee: true })
          });
  
          if (st.lv >= 6) {
            const ca = aim + dir * 0.26;
            projectiles.push({ type: 'ice', elem: 'ice', skillId: 'ice_strike_cone', isPhysSkill: true, x: player.x, y: player.y, vx: Math.cos(ca) * 580, vy: Math.sin(ca) * 580, radius: 9 * areaFactor, dmg: rawDmg * 0.65, pierce: 2, life: 0.65, hitSet: new Set() });
          }
        };
        if (s === 0) fn(); else delayedActions.push({ delay: 0.16, fn });
      }
      sk.timer = sk.baseCd * cdFactor; return true;
    }
    if (id === 'dark_curse') {
        const maxLocks = st.lv >= 8 ? 4 : (st.lv >= 4 ? 3 : 2);
        const vis = getVisibleSkillTargets(650);
        if (!vis.length) { sk.timer = 0; return true; }
        const aff = vis.filter(e => e.freezeTimer > 0 || (e.chillStacks || 0) > 0 || e.armorBreakTimer > 0 || e.darkTimer > 0 || e.burnTimer > 0 || e.shockTimer > 0);
        const ordered = [...aff, ...vis.filter(e => !aff.includes(e))].slice(0, maxLocks);
        for (const t of ordered) {
          if (!t || t.isDead) continue;
          const had = (t.freezeTimer > 0 || (t.chillStacks || 0) > 0 || t.armorBreakTimer > 0 || t.darkTimer > 0 || t.burnTimer > 0 || t.shockTimer > 0);
          slashes.push({ type: 'boris_dark_curse', x: t.x, y: t.y, range: t.radius + 26, life: 0.28, maxLife: 0.28 });
          applyStatusTagsOnHit(t, ['dark'], spellBase, cs, { isMelee: false });
          const idx = enemies.indexOf(t); if (idx !== -1) hitEnemy(idx, rawDmg, { element: 'dark' });
          const darkRes = typeof getResonanceParams === 'function' ? getResonanceParams('dark') : null;
          const followMult = darkRes ? (0.75 * darkRes.mult) : 0.75;
          if (had && !t.isDead) delayedActions.push({ delay: 0.12, fn: () => { const i2 = enemies.indexOf(t); if (i2 !== -1 && !t.isDead) { slashes.push({ type: 'boris_dark_follow', x: t.x, y: t.y, range: t.radius + 22, life: 0.22, maxLife: 0.22 }); hitEnemy(i2, rawDmg * followMult, { element: 'dark' }); } } });
        }
        sk.timer = sk.baseCd * cdFactor; return true;
      }
      if (id === 'earth_quake') {
        const lockR = 240 * areaFactor, target = findTargetEnemy(lockR, tMode, getVisibleSkillTargets(lockR));
        if (!target) { sk.timer = 0; return true; }
        const cx = target.x, cy = target.y, boomR = 128 * (1 + (st.lv - 1) * 0.15) * areaFactor, abCrit = 0.10 + st.lv * 0.05;
        const abRes = typeof getResonanceParams === 'function' ? getResonanceParams('armor_break') : null;
        for (let h = 0; h < 2; h++) {
          const fn = () => {
            slashes.push({ type: 'boris_earth_circle', x: cx, y: cy, range: boomR, arc: Math.PI * 2, life: 0.28, maxLife: 0.28 });
            damageArea(cx, cy, boomR, 0, Math.PI * 2, rawDmg, 0, {
              element: 'physical', isPhysSkill: true, skyEarthIgnore: abRes ? 0.30 : 0,
              bonusCritDmgFn: (e) => ((e.armorBreakTimer || 0) > 0 ? abCrit : 0),
              onTargetHit: (e) => {
                const hadAb = (e.armorBreakTimer || 0) > 0;
                applyStatusTagsOnHit(e, ['armor_break'], spellBase, cs, { isMelee: true });
                if (hadAb && abRes && !e.isDead) { const i2 = enemies.indexOf(e); if (i2 !== -1) hitEnemy(i2, rawDmg * abRes.shatterMult, { element: 'physical', isPhysSkill: true, skyEarthIgnore: 0.30 }); }
              }
            });
          };
          if (h === 0) fn(); else delayedActions.push({ delay: 0.18, fn });
        }
        sk.timer = sk.baseCd * cdFactor; return true;
      }
      if (id === 'ice_strike_evo') {
        const range = 180 * (1 + (st.lv - 1) * 0.15) * areaFactor, arc = 2.05, target = findTargetEnemy(range + 200, tMode);
        const aim = target ? Math.atan2(target.y - player.y, target.x - player.x) : player.facingAngle;
        const bolts = 3 + st.lv;
        for (let s = 0; s < 2; s++) {
          const dir = s === 0 ? -1 : 1;
          const fn = () => {
            slashes.push({ type: 'boris_ice_wiper', angle: aim, range, arc, dir, isSuper: true, life: 0.22, maxLife: 0.22 });
            damageArea(player.x, player.y, range, aim, arc, rawDmg, 0, {
              element: 'ice', isPhysSkill: true, isBorisIceEvo: true,
              onAfterHit: (e) => applyStatusTagsOnHit(e, ['ice'], spellBase, cs, { isMelee: true })
            });
          };
          if (s === 0) fn(); else delayedActions.push({ delay: 0.16, fn });
        }
        const cands = enemies.filter(e => !e.isDead && Math.hypot(e.x - player.x, e.y - player.y) <= 460);
        for (let b = 0; b < bolts; b++) {
          const le = cands.length > 0 ? cands[b % cands.length] : null;
          const a = le ? Math.atan2(le.y - player.y, le.x - player.x) : (aim + (b - (bolts - 1) / 2) * 0.24);
          projectiles.push({ type: 'ice', elem: 'ice', skillId: 'boris_frost_stacker', noDamageStackOnly: true, x: player.x, y: player.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, radius: 8 * areaFactor, dmg: 0, pierce: 1, life: 0.95, hitSet: new Set() });
        }
        sk.timer = sk.baseCd * cdFactor; return true;
      }
      if (id === 'shadow_sword') {
        const range = 152 * areaFactor, arc = 1.90, target = findTargetEnemy(range + 220, tMode);
        const aim = target ? Math.atan2(target.y - player.y, target.x - player.x) : player.facingAngle;
        const rLen = range * 1.30 * (1 + (st.lv - 1) * 0.15), rW = 46 * areaFactor, cMult = 0.60 + st.lv * 0.10;
        const lockX = target ? target.x : (player.x + Math.cos(aim) * (rLen * 0.55));
        const lockY = target ? target.y : (player.y + Math.sin(aim) * (rLen * 0.55));
        const cA = Math.cos(aim), sA = Math.sin(aim), pX = -sA, pY = cA;
        const hitRect = (ox, oy, rectAng, mult) => {
          const ca = Math.cos(rectAng), sa = Math.sin(rectAng);
          slashes.push({ type: 'boris_shadow_rect', x: ox, y: oy, angle: rectAng, length: rLen, width: rW, isClone: mult < 1, life: 0.30, maxLife: 0.30 });
          for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i]; if (!e || e.isDead) continue;
            const dx = e.x - ox, dy = e.y - oy;
            if (dx * ca + dy * sa >= -10 && dx * ca + dy * sa <= rLen + e.radius && Math.abs(-dx * sa + dy * ca) <= rW / 2 + e.radius) hitEnemy(i, rawDmg * mult, { element: 'physical', isPhysSkill: true });
          }
        };
        slashes.push({ type: 'boris_shadow_wiper', angle: aim, range, arc, dir: -1, life: 0.18, maxLife: 0.18 });
        damageArea(player.x, player.y, range, aim, arc, rawDmg * 0.85, 0, { element: 'physical', isPhysSkill: true });
        delayedActions.push({ delay: 0.14, fn: () => { slashes.push({ type: 'boris_shadow_wiper', angle: aim, range, arc, dir: 1, life: 0.18, maxLife: 0.18 }); damageArea(player.x, player.y, range, aim, arc, rawDmg * 0.85, 0, { element: 'physical', isPhysSkill: true }); } });
        delayedActions.push({ delay: 0.28, fn: () => hitRect(player.x, player.y, aim, 1.20) });
        delayedActions.push({ delay: 0.42, fn: () => {
          const d = 68 * areaFactor;
          const lx = player.x + pX * d, ly = player.y + pY * d;
          const rx = player.x - pX * d, ry = player.y - pY * d;
          const leftAng = Math.atan2(lockY - ly, lockX - lx);
          const rightAng = Math.atan2(lockY - ry, lockX - rx);
          slashes.push({ type: 'boris_clone_ghost', x: lx, y: ly, dirInfo: player.dirInfo, life: 0.36, maxLife: 0.36 }, { type: 'boris_clone_ghost', x: rx, y: ry, dirInfo: player.dirInfo, life: 0.36, maxLife: 0.36 });
          hitRect(lx, ly, leftAng, cMult);
          hitRect(rx, ry, rightAng, cMult);
        } });
        sk.timer = sk.baseCd * cdFactor; return true;
      }

      if (id === 'sky_earth_wave') {
        const rads = new Array(115 + st.lv * 15, 165 + st.lv * 20, 215 + st.lv * 25), hits = new Array(1, 1, 2);
        for (let w = 0; w < 3; w++) {
          const fn = () => {
            const r = rads[w] * areaFactor; slashes.push({ type: 'boris_earth_circle', x: player.x, y: player.y, range: r, arc: Math.PI * 2, life: 0.30, maxLife: 0.30 });
            for (let seg = 0; seg < hits[w]; seg++) for (let i = enemies.length - 1; i >= 0; i--) {
              const e = enemies[i]; if (!e || e.isDead || Math.hypot(e.x - player.x, e.y - player.y) > r + e.radius) continue;
              const hadAb = (e.armorBreakTimer || 0) > 0;
              hitEnemy(i, rawDmg, { element: 'physical', isPhysSkill: true, bonusCritDmg: hadAb ? (0.30 + st.lv * 0.10) : 0, skyEarthIgnore: hadAb ? (0.30 + st.lv * 0.05) : 0 });
              if (!e.isDead) applyStatusTagsOnHit(e, ['armor_break'], spellBase, cs, { isMelee: true });
            }
          };
          if (w === 0) fn(); else delayedActions.push({ delay: w * 0.16, fn });
        }
        sk.timer = sk.baseCd * cdFactor; return true;
      }
      if (id === 'ice_breaker' || id === 'inherited_sword') {
        const isIce = id === 'ice_breaker', range = (isIce ? 210 : 165) * (1 + (st.lv - 1) * 0.15) * areaFactor;
        const target = findTargetEnemy(range + 200, tMode), aim = target ? Math.atan2(target.y - player.y, target.x - player.x) : player.facingAngle;
        const steps = isIce ? 3 : 5, mults = isIce ? new Array(1, 1, 1) : new Array(0.75, 0.85, 0.95, 1.05, st.lv >= 3 ? 1.50 : (st.lv >= 2 ? 1.35 : 1.20));
        for (let s = 0; s < steps; s++) {
          const fn = () => {
            const ang = aim + (isIce ? (s - 1) * 0.26 : (s - 2) * 0.12), arc = isIce ? 0.85 : 2.05;
            slashes.push({ type: 'boris_ice_wiper', angle: ang, range, arc, dir: s % 2 === 0 ? -1 : 1, isSuper: isIce, isTiger: !isIce, life: 0.22, maxLife: 0.22 });
            damageArea(player.x, player.y, range, ang, arc, rawDmg * mults[s], 0, {
                element: isIce ? 'ice' : 'physical', isPhysSkill: true, isBorisIceEvo: isIce,
                onTargetHit: !isIce ? null : (e) => {     
                const wasF = (e.freezeTimer || 0) > 0; applyStatusTagsOnHit(e, ['ice'], spellBase, cs, { isMelee: true });
                if (wasF && !e.isDead) { const i2 = enemies.indexOf(e); if (i2 !== -1) { slashes.push({ type: 'iceshatter', x: e.x, y: e.y, range: e.radius + 30, arc: Math.PI * 2, life: 0.26 }); hitEnemy(i2, rawDmg * (1.25 + st.lv * 0.25), { element: 'ice', isPhysSkill: true }); } const wR = 135 * areaFactor; slashes.push({ type: 'boris_frost_wave', x: e.x, y: e.y, range: wR, life: 0.28, maxLife: 0.28 }); for (const ne of enemies) if (ne !== e && !ne.isDead && Math.hypot(ne.x - e.x, ne.y - e.y) <= wR + ne.radius) applyStatusTagsOnHit(ne, ['ice'], spellBase, { ...cs, statusChanceBonus: (cs.statusChanceBonus || 0) + 0.45 }, { isMelee: false }); }
              }
            });
          };
          if (s === 0) fn(); else delayedActions.push({ delay: s * 0.08, fn });
        }
        sk.timer = sk.baseCd * cdFactor; return true;
      }
      return false;
    }
    
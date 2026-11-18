const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

const EQUIPPED_WEAPON = { name: '學徒長劍', startSkill: 'enbu' };
const ACTIVE_SKILLS = getActiveSkillPool();
const MAX_ACTIVE_SKILLS = 5;
const MAX_PASSIVE_SKILLS = 7;

let isPaused = true, gameOver = false, gameTime = 0, kills = 0, combo = 0, comboTimer = 0;
let bossSpawned = false, currentChoices = [], bannerTimer = 0, spawnTimer = 0.5;
let lastEliteMin = 0, lastMegaBossMin = 0;

const player = {
  x: 0, y: 0, size: 28, baseSpeed: 235,
  hp: 200, maxHp: 200, shield: 0, maxShield: 0, shieldTimer: 0, thornsCd: 0,
  regen: 0, lv: 1, exp: 0, nextExp: 5, pickupRange: 115,
  facingAngle: 0, lastMoveAngle: 0, flipX: 1, walkCycle: 0,
  dmgMult: 1.0, cdMult: 1.0, areaMult: 1.0, speedMult: 1.0,
  bonusCritRate: 0, bonusDoubleHit: 0, superCritMult: 1.5, resonanceDmgMult: 1.0,
  dropRateMult: 1.0, expMult: 1.0, curseMult: 1.0, seedMult: 1.0, angelUsed: false
};

function getEffectiveCdMult(extraFactor = 1.0) {
  return Math.max(0.35, player.cdMult * extraFactor);
}

function getEffectivePhysReducePct(cs) {
  const basePct = (cs && cs.physReducePct) ? cs.physReducePct : 0;
  const wallLv = (typeof ownedPassives !== 'undefined' && ownedPassives.lightWall) ? ownedPassives.lightWall : 0;
  const rawMult = (1 - basePct / 100) * Math.pow(0.97, wallLv);
  return Math.min(70, Math.round((1 - rawMult) * 100));
}

function getEffectiveMagReducePct(cs) {
  const basePct = (cs && cs.magReducePct) ? cs.magReducePct : 0;
  const msLv = (typeof ownedPassives !== 'undefined' && ownedPassives.magicShield) ? ownedPassives.magicShield : 0;
  const rawMult = (1 - basePct / 100) * Math.pow(0.97, msLv);
  return Math.min(70, Math.round((1 - rawMult) * 100));
}
// 【前端標籤中文化對照字典】底層使用英文代碼，前端自動渲染為繁體中文
const BEHAVIOR_TAG_CN = {
  melee: '近戰',
  ranged: '遠程',
  projectile: '射彈',
  aoe: '範圍',
  zone: '領域',
  physical: '物理',
  magic: '魔法'
};

const ELEMENT_TAG_CN = {
  fire: '火系',
  ice: '冰系',
  lightning: '雷系',
  wind: '風系',
  holy: '聖光',
  armor_break: '破甲',
  dark: '暗影',
  none: '無屬性'
};

// 將英文/代碼標籤陣列自動轉譯為繁體中文標籤字串供 Tooltip 顯示
function getLocalizedSkillTags(sk) {
  const parts = [];
  if (sk.statTags && sk.statTags.length > 0) {
    parts.push(sk.statTags.join('+'));
  }
  if (sk.type) {
    parts.push(BEHAVIOR_TAG_CN[sk.type] || sk.type);
  }
  if (sk.element && sk.element !== 'none') {
    parts.push(ELEMENT_TAG_CN[sk.element] || sk.element);
  }
  if (sk.behaviorTags && sk.behaviorTags.length > 0) {
    sk.behaviorTags.forEach(bt => {
      parts.push(BEHAVIOR_TAG_CN[bt] || bt);
    });
  }
  return parts.join('・');
}

function upgradeClassicHud() {
  const hud = document.getElementById('hud');
  const card = hud ? hud.firstElementChild : null;
  if (!card || card.dataset.classicReady) return;
  card.dataset.classicReady = '1';
  card.style.cssText = 'background:linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.88));border:2px solid #eab308;border-radius:12px;padding:8px 12px;box-shadow:0 4px 16px rgba(0,0,0,0.6),inset 0 0 12px rgba(234,179,8,0.15);width:310px;pointer-events:auto;';
  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="position:relative;width:46px;height:46px;border-radius:10px;background:radial-gradient(circle at 30% 30%,#38bdf8,#1e3a8a);border:2px solid #facc15;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.5);">
        <div style="width:20px;height:20px;border-radius:50%;background:#fde047;border:1px solid #ca8a04;margin-top:-8px;"></div>
        <div style="position:absolute;bottom:4px;width:24px;height:14px;border-radius:6px 6px 0 0;background:#3b82f6;"></div>
        <span id="lvText" style="position:absolute;bottom:-6px;right:-6px;background:#b45309;border:1px solid #fde047;color:#fef08a;font-size:10px;font-weight:bold;padding:1px 5px;border-radius:6px;">LV.1</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:4px;">
          <strong id="hudCharName" style="color:#fef08a;letter-spacing:0.5px;">路西安．卡爾茲</strong>
          <span id="weaponText" style="font-size:11px;color:#93c5fd;background:rgba(30,58,138,0.6);padding:1px 6px;border-radius:4px;border:1px solid #3b82f6;">學徒長劍</span>
        </div>
        <div style="position:relative;height:11px;background:#450a0a;border:1px solid #7f1d1d;border-radius:6px;overflow:hidden;margin-bottom:4px;">
          <div id="hpBar" style="height:100%;width:100%;background:linear-gradient(90deg,#dc2626,#f87171);transition:width 0.15s;"></div>
          <span id="hpNumText" style="position:absolute;inset:0;font-size:9px;line-height:10px;text-align:center;color:#fff;font-weight:bold;text-shadow:0 1px 2px #000;">200/200</span>
        </div>
        <div id="shieldBox" style="display:none;position:relative;height:9px;background:#0c4a6e;border:1px solid #0284c7;border-radius:6px;overflow:hidden;margin-bottom:4px;">
          <div id="shieldBar" style="height:100%;width:100%;background:linear-gradient(90deg,#06b6d4,#67e8f9);transition:width 0.15s;"></div>
          <span id="shieldNumText" style="position:absolute;inset:0;font-size:8px;line-height:8px;text-align:center;color:#f0f9ff;font-weight:bold;text-shadow:0 1px 2px #000;">SHIELD 0/0</span>
        </div>
        <div style="position:relative;height:8px;background:#082f49;border:1px solid #0369a1;border-radius:6px;overflow:hidden;">
          <div id="expBar" style="height:100%;width:0%;background:linear-gradient(90deg,#0284c7,#38bdf8);transition:width 0.15s;"></div>
          <span id="expNumText" style="position:absolute;inset:0;font-size:8px;line-height:7px;text-align:center;color:#e0f2fe;font-weight:bold;text-shadow:0 1px 1px #000;">0%</span>
        </div>
      </div>
    </div>
    <div id="skillList" style="margin-top:7px;padding-top:5px;border-top:1px solid rgba(148,163,184,0.25);display:flex;flex-wrap:wrap;gap:5px;font-size:11px;"></div>`;
}
upgradeClassicHud();

const ownedSkills = { [EQUIPPED_WEAPON.startSkill]: { lv: 1, evolved: false, disabled: false } };
const ownedPassives = {};
let enemies = [], slashes = [], projectiles = [], lightnings = [], zones = [], damageTexts = [], gems = [], chests = [];
let lootBags = [], runLoot = [];
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

function showBanner(text) {
  const b = document.getElementById('banner');
  b.textContent = text; b.style.display = 'block'; bannerTimer = 3.2;
}

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

  const blessMult = 1 + (ownedPassives.blessing || 0) * 0.03;
  const angelMult = ownedPassives.angelWish ? 0.90 : 1.0;
  const evoMult = (evolved && !sk.isSuperWeapon) ? 1.45 : 1.0;
  return ((sk.baseDmg + Math.max(0, lv - 1) * sk.perLv) + statPower + defBonus) * player.dmgMult * dmgTypeMult * blessMult * angelMult * evoMult;
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
      if (!visited.has(cand)) {
        const d = Math.hypot(cand.x - cur.x, cand.y - cur.y);
        if (d < minD) { minD = d; nextIdx = i; }
      }
    }
    if (nextIdx === -1) break;
    const nextE = enemies[nextIdx];
    visited.add(nextE);
    lightnings.push({ x1: cur.x, y1: cur.y, x2: nextE.x, y2: nextE.y, life: 0.22 });
    hitEnemy(nextIdx, spellBase * res.mult, { element: 'lightning', isChain: true });
    cur = nextE;
  }
}

function spawnHolySealWave(cx, cy, baseRadius, sealChance) {
  const r = baseRadius * player.areaMult;
  slashes.push({ type: 'holywave', x: cx, y: cy, range: r, arc: Math.PI * 2, life: 0.35 });
  for (const e of enemies) {
    if (Math.hypot(e.x - cx, e.y - cy) <= r + e.radius && Math.random() < sealChance) {
      if (typeof applyHolySeal === 'function') applyHolySeal(e, 1);
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

  const iceRes = (elem === 'ice' && e.freezeTimer > 0 && typeof getResonanceParams === 'function') ? getResonanceParams('ice') : null;
  if (iceRes) { rawDmg += getSpellBase() * iceRes.mult * resBonusMult; e.freezeTimer = 0; }

  const mod = typeof calcStatusDamageMods === 'function' ? calcStatusDamageMods(e, elem, isStrikeOrLight) : { addMult: 1, endMult: 1 };
  const talentIgnore = (ownedPassives.mageTalent || 0) * 0.03;
  const bossResist = (e.isFinalBoss ? 0.20 : (e.isMegaBoss ? 0.12 : 0)) * (1 - talentIgnore);
  let finalDmg = rawDmg * mod.addMult * (1 - bossResist) * mod.endMult * (0.95 + Math.random() * 0.10);

  const totalCrit = (cs.critRate || 0.05) + (player.bonusCritRate || 0);
  const isCrit = !opts.noCrit && (Math.random() < Math.min(1.0, totalCrit));
  let isSuperCrit = false;
  if (isCrit) {
    finalDmg *= (cs.critDmg || 1.5);
    const overflow = Math.max(0, totalCrit - 1.0);
    if (overflow > 0 && Math.random() < overflow) {
      isSuperCrit = true;
      finalDmg *= (player.superCritMult || 1.5);
    }
  }

  const dmgInt = Math.max(1, Math.round(finalDmg));
  e.hp -= dmgInt; e.hitFlash = 0.08;
  const tagIcon = isSuperCrit ? '💢' : (isCrit ? '💥' : '');
  const tagColor = isSuperCrit ? '#ff4d4f' : (isCrit ? '#fde047' : (opts.isDot ? '#fdba74' : '#fff'));
  damageTexts.push({ x: e.x, y: e.y - e.radius, txt: `${tagIcon}${dmgInt}`, color: tagColor, life: 0.55 });

  // 【V2.5 聖印雙條件引爆】必須同時滿足：滿 3 層聖印 ＋ 造成傷害 (dmgInt > 0) ＋ 成功觸發異常 (rollStatusChance)
  const dealtDamage = dmgInt > 0;
  if (opts.consumeSeal && typeof tryTriggerHolyResonance === 'function') {
    const triggered = tryTriggerHolyResonance(e, dealtDamage, opts.sealBurstChance ?? 0.35, cs.statusChanceBonus || 0);
    if (triggered) {
      const lRes = typeof getResonanceParams === 'function' ? getResonanceParams('holy') : null;
      const mult = opts.sealBurstMult || (lRes ? lRes.polyMult : 3.2);
      const burstDmg = Math.max(1, Math.round(getSpellBase() * mult * resBonusMult * mod.endMult));
      e.hp -= burstDmg;
      damageTexts.push({ x: e.x, y: e.y - e.radius - 16, txt: `✨聖印引爆 ${burstDmg}`, color: '#fef08a', life: 0.65 });
      const wR = 135 * (1 + (lRes ? lRes.waveRadiusBonus : 0));
      spawnHolySealWave(e.x, e.y, wR, lRes ? lRes.waveSealChance : 0.4);
    }
  }

  // 【引爆後疊層不浪費】確保在清空舊聖印後才執行當下這一擊的聖印疊層
  if (opts.onAfterHit && e.hp > 0) {
    opts.onAfterHit(e);
  }

  if (e.shockTimer > 0 && !opts.isShockProc && e.hp > 0) {
    const shockExtra = Math.max(1, Math.round(dmgInt * 0.15 * resBonusMult));
    e.hp -= shockExtra;
    damageTexts.push({ x: e.x + 12, y: e.y - e.radius - 10, txt: `⚡${shockExtra}`, color: '#fde047', life: 0.45 });
  }

  if (elem === 'lightning' && !opts.isChain && !opts.isDot && e.shockTimer > 0) triggerThunderChain(e, getSpellBase() * resBonusMult);

  if (!opts.isDouble && !opts.isDot && Math.random() < (cs.doubleHitChance || 0)) {
    hitEnemy(idx, rawDmg * 0.75, { ...opts, isDouble: true, consumeSeal: false });
    return;
  }

  if (e.hp <= 0) {
    const fireRes = (e.burnTimer > 0 && !opts.isMartyrBoom && typeof getResonanceParams === 'function') ? getResonanceParams('fire') : null;
    if (fireRes) {
      const boomR = fireRes.radius * player.areaMult;
      slashes.push({ type: 'fireboom', x: e.x, y: e.y, range: boomR, arc: Math.PI * 2, life: 0.25 });
      damageArea(e.x, e.y, boomR, 0, Math.PI * 2, getSpellBase() * fireRes.mult * resBonusMult, 12, { element: 'fire', isMartyrBoom: true });
    }
    if (e.darkTimer > 0) {
      zones.push({ kind: 'dark_pool', x: e.x, y: e.y, radius: 75 * player.areaMult, life: typeof DARK_ZONE_DUR !== 'undefined' ? DARK_ZONE_DUR : 2.0, tickTimer: 0.5, dmg: e.darkDps || getSpellBase() * 0.32, lv: 1 });
    }
    if (e.isFinalBoss) { endGame(true); return; }
    if (e.isMegaBoss) chests.push({ x: e.x, y: e.y, kind: 'gold' });
    else if (e.isElite) chests.push({ x: e.x, y: e.y, kind: 'silver' });

    const baseDropChance = 0.015 * (player.dropRateMult || 1.0);
    if (e.isFinalBoss || e.isMegaBoss || e.isElite || Math.random() < baseDropChance) {
      const dropCount = (e.isFinalBoss || e.isMegaBoss) ? 2 : 1;
      for (let d = 0; d < dropCount; d++) {
        const rRoll = Math.random();
        let rar = (e.isFinalBoss || e.isMegaBoss) ? (rRoll < 0.20 ? 'gold' : (rRoll < 0.75 ? 'purple' : 'blue'))
          : (e.isElite ? (rRoll < 0.05 ? 'gold' : (rRoll < 0.30 ? 'purple' : (rRoll < 0.80 ? 'blue' : 'green')))
          : (rRoll < 0.002 ? 'gold' : (rRoll < 0.02 ? 'purple' : (rRoll < 0.10 ? 'blue' : (rRoll < 0.35 ? 'green' : 'white')))));
        const dropItem = typeof createUnidentifiedDrop === 'function' ? createUnidentifiedDrop(rar, saveData.outLv + 10, null, (e.isFinalBoss || e.isMegaBoss) && d === 0) : null;
        if (dropItem) lootBags.push({ x: e.x + (d * 24 - 12), y: e.y, item: dropItem, color: RARITIES[rar].color, rarName: RARITIES[rar].name });
      }
    }
    gems.push({ x: e.x, y: e.y, val: e.expValue });
    enemies.splice(idx, 1); kills++; combo++; comboTimer = 2.5;
  }
}

function damageArea(cx, cy, range, facing, arc, baseDmg, kb, opts = {}) {
  const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { knockbackMult: 1 };
  const kbFinal = kb * (cs.knockbackMult || 1);
  let hitCount = 0;
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (opts.maxTargets && hitCount >= opts.maxTargets) break;
    const e = enemies[i], dx = e.x - cx, dy = e.y - cy;
    if (Math.hypot(dx, dy) <= range + e.radius) {
      let diff = Math.atan2(dy, dx) - facing;
      while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
      if (arc >= Math.PI * 1.9 || Math.abs(diff) <= arc / 2) {
        hitCount++;
        const ang = Math.atan2(dy, dx), res = (e.isElite || e.isMegaBoss || e.isFinalBoss) ? 0.15 : 1;
        e.x += Math.cos(ang) * kbFinal * res; e.y += Math.sin(ang) * kbFinal * res;
        if (opts.onTargetHit) opts.onTargetHit(e);
        hitEnemy(i, baseDmg, opts);
      }
    }
  }
}

function findNearestEnemy(maxDist) {
  let near = null, minD = maxDist;
  for (const e of enemies) {
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d < minD) { minD = d; near = e; }
  }
  return near;
}

function triggerSkills(dt) {
  const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { statusDurMult: 1, statusChanceBonus: 0, extraProj: 0 };
  const spellBase = getSpellBase();
  for (const [id, st] of Object.entries(ownedSkills)) {
    const sk = ACTIVE_SKILLS[id];
    if (!sk || st.disabled || (sk.timer -= dt) > 0) continue;
    const cdFactor = getEffectiveCdMult(Math.pow(0.95, st.lv - 1));
    const bTags = sk.behaviorTags || [];
    const areaFactor = (bTags.includes('範圍') || bTags.includes('aoe')) ? player.areaMult : 1.0;
    const bonusProj = (bTags.includes('射彈') || bTags.includes('projectile')) ? (cs.extraProj || 0) : 0;
    const rawDmg = getSkillRawDmg(id, st.lv, st.evolved);
    const partnerId = sk.resonancePartner || sk.resonanceSkill;
    const hasResonance = (st.evolved || sk.isSuperWeapon) && partnerId && ownedSkills[partnerId] && !ownedSkills[partnerId].disabled;

    if (id === 'renga' || id === 'aurora' || id === 'enbu') {
      const range = (125 + st.lv * 10) * areaFactor * (st.evolved ? 1.35 : 1);
      if (id === 'renga' || id === 'aurora') {
        const target = findNearestEnemy(range + 220);
        if (target) { player.facingAngle = Math.atan2(target.y - player.y, target.x - player.x); player.flipX = Math.cos(player.facingAngle) >= 0 ? 1 : -1; }
      }
      const arc = id === 'enbu' ? Math.PI * 2 : (id === 'aurora' ? 0.55 : (st.evolved ? Math.PI * 2 : 1.85));
      const swings = (id === 'renga' && st.lv >= 4) ? 2 : 1;
      for (let s = 0; s < swings; s++) {
        slashes.push({ type: hasResonance ? 'fireboom' : id, angle: player.facingAngle + (s * 0.3 - 0.15), range, arc, life: 0.18 + s * 0.06, evolved: st.evolved });
        damageArea(player.x, player.y, range, player.facingAngle, arc, rawDmg * (swings === 2 ? 0.72 : 1), id === 'enbu' ? 40 : 16, {
          element: hasResonance ? (sk.resonanceElem || (id === 'renga' ? 'fire' : (id === 'aurora' ? 'lightning' : 'wind'))) : 'none',
          onTargetHit: (e) => {
            if (!hasResonance) return;
            const resEl = sk.resonanceElem || (id === 'renga' ? 'fire' : (id === 'aurora' ? 'lightning' : 'wind'));
            applyStatusTagsOnHit(e, resEl, spellBase, cs, 0.55, { isMelee: true });
            if (resEl === 'lightning') lightnings.push({ x1: e.x, y1: e.y - 60, x2: e.x, y2: e.y, life: 0.2 });
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
          applyStatusTagsOnHit(t, 'lightning', spellBase, cs, 0.45);
          lightnings.push({ x1: t.x, y1: t.y - 80, x2: t.x, y2: t.y, life: 0.22 });
          hitEnemy(enemies.indexOf(t), rawDmg, { element: 'lightning' });
        } else {
          projectiles.push({ type: id === 'windblade' ? 'wind' : 'fire', elem: id === 'windblade' ? 'wind' : 'fire', x: player.x, y: player.y, vx: Math.cos(ang) * 560, vy: Math.sin(ang) * 560, radius: 10 * areaFactor, dmg: rawDmg, pierce: (id === 'windblade' && st.lv >= 4) ? 2 : 1, life: 1.4, hitSet: new Set() });
        }
      }
      sk.timer = sk.baseCd * cdFactor;
    } else if (id === 'holylight') {
      const shots = 1 + Math.floor(st.lv / 2) + bonusProj;
      for (let i = 0; i < shots; i++) {
        const t = enemies[Math.floor(Math.random() * enemies.length)];
        const ang = (t ? Math.atan2(t.y - player.y, t.x - player.x) : Math.random() * Math.PI * 2) + (i - (shots - 1) / 2) * 0.14;
        projectiles.push({ type: 'holy', elem: 'holy', x: player.x, y: player.y, vx: Math.cos(ang) * 620, vy: Math.sin(ang) * 620, radius: 9 * areaFactor, dmg: rawDmg, pierce: 4, life: 1.3, sealChance: 0.30 + st.lv * 0.03, hitSet: new Set() });
      }
      sk.timer = sk.baseCd * cdFactor;
    } else if (id === 'radiance' || id === 'healLight' || id === 'holypoly') {
      const t = enemies[Math.floor(Math.random() * enemies.length)];
      const tx = t ? t.x : player.x + (Math.random() - 0.5) * 160, ty = t ? t.y : player.y + (Math.random() - 0.5) * 160;
      const rad = (id === 'holypoly' ? (140 + st.lv * 20) : 110) * areaFactor;
      zones.push({ kind: id, x: tx, y: ty, radius: rad, life: id === 'holypoly' ? 2.0 : (3.0 + Math.floor(st.lv / 3) * 0.5), tickTimer: 0.5, dmg: rawDmg, lv: st.lv, sealChance: 0.32 + st.lv * 0.03 });
      sk.timer = sk.baseCd * cdFactor;
    } else if (id === 'armorbreak' || id === 'earthhammer' || id === 'frenzyhammer') {
      const is360 = id !== 'armorbreak';
      const range = (is360 ? 135 : 145) * areaFactor;
      const isMeleeSkill = bTags.includes('melee') || bTags.includes('近戰');
      if (!is360) { const near = findNearestEnemy(range + 160); if (near) { player.facingAngle = Math.atan2(near.y - player.y, near.x - player.x); player.flipX = Math.cos(player.facingAngle) >= 0 ? 1 : -1; } }
      const maxT = id === 'armorbreak' ? (3 + (st.lv >= 3 ? 1 : 0) + (st.lv >= 5 ? 1 : 0)) : 999;
      const lRes = typeof getResonanceParams === 'function' ? getResonanceParams('holy') : null;
      slashes.push({ type: 'holywave', x: player.x, y: player.y, angle: player.facingAngle, range, arc: is360 ? Math.PI * 2 : 1.7, life: 0.22 });
      damageArea(player.x, player.y, range, player.facingAngle, is360 ? Math.PI * 2 : 1.7, rawDmg, id === 'earthhammer' ? 42 : 20, {
        element: 'holy',
        isStrike: true,
        maxTargets: maxT,
        consumeSeal: id === 'frenzyhammer',
        sealBurstChance: 0.45,
        sealBurstMult: lRes ? lRes.hammerMult : 2.5,
        onTargetHit: (e) => {
          if (id !== 'frenzyhammer') {
            applyStatusTagsOnHit(e, 'holy', spellBase, cs, 0.45, { isMelee: isMeleeSkill });
          }
          if (id === 'armorbreak') applyStatusTagsOnHit(e, 'armor_break', spellBase, cs, 0.65, { armorBreakChance: 0.65 });
        },
        onAfterHit: (e) => {
          if (id === 'frenzyhammer') {
            applyStatusTagsOnHit(e, 'holy', spellBase, cs, 0.45, { isMelee: isMeleeSkill });
            spawnHolySealWave(e.x, e.y, 120, 0.40);
          }
        }
      });
      sk.timer = sk.baseCd * cdFactor;

    } else if (id.startsWith('fire') || id.startsWith('ice') || id.startsWith('thunder')) {
      const elem = id.startsWith('fire') ? 'fire' : (id.startsWith('ice') ? 'ice' : 'lightning');
      const baseCount = id === 'fire1' ? (1 + Math.floor(st.lv / 2))
        : (id === 'fire3' ? (4 + Math.floor(st.lv / 2))
        : (id === 'thunder1' ? (2 + Math.floor(st.lv / 2))
        : (id === 'thunder4' ? (3 + Math.floor(st.lv / 2)) : (1 + Math.floor(st.lv / 2)))));
      const count = baseCount + bonusProj;
      for (let i = 0; i < count; i++) {
        const t = enemies[Math.floor(Math.random() * enemies.length)];
        const ang = id === 'fire3' ? ((Math.PI * 2 / count) * i) : (t ? Math.atan2(t.y - player.y, t.x - player.x) + (Math.random() - 0.5) * 0.25 : Math.random() * Math.PI * 2);
        if (elem === 'lightning' && (id === 'thunder1' || id === 'thunder4' || id === 'thunder5')) {
          const tx = t ? t.x + (Math.random() - 0.5) * 40 : player.x + (Math.random() - 0.5) * 200;
          const ty = t ? t.y + (Math.random() - 0.5) * 40 : player.y + (Math.random() - 0.5) * 200;
          lightnings.push({ x1: tx, y1: ty - 110, x2: tx, y2: ty, life: 0.24 });
          const r = (id === 'thunder5' ? 125 : (id === 'thunder4' ? 85 : 38)) * areaFactor;
          damageArea(tx, ty, r, 0, Math.PI * 2, rawDmg, 10, {
            element: 'lightning', onTargetHit: (e) => applyStatusTagsOnHit(e, 'lightning', spellBase, cs, 0.45)
          });
        } else if (id === 'ice2' || id === 'thunder2') {
          const tx = (id === 'ice2' && t) ? t.x : player.x;
          const ty = (id === 'ice2' && t) ? t.y : player.y;
          zones.push({ kind: id, x: tx, y: ty, radius: 120 * areaFactor, life: 1.0, tickTimer: 0.35, dmg: rawDmg, lv: st.lv, sealChance: 0.45 });
        } else {
          const isOrb = id === 'ice3', isBounce = id === 'ice1' || id === 'thunder3';
          projectiles.push({
            type: elem, elem, skillId: id, x: player.x, y: player.y,
            vx: Math.cos(ang) * (isOrb ? 210 : 520), vy: Math.sin(ang) * (isOrb ? 210 : 520),
            radius: (isOrb ? 22 : (id.endsWith('4') || id.endsWith('5') ? 26 : 11)) * areaFactor,
            dmg: rawDmg, pierce: isOrb ? 99 : (isBounce ? (2 + Math.floor(st.lv / 2)) : 1),
            life: isOrb ? 2.8 : 1.4, orbShootCd: 0.45, hitSet: new Set()
          });
        }
      }
      sk.timer = sk.baseCd * cdFactor;
    }
  }
}

function update(dt) {
  if (isPaused || gameOver) return;
  gameTime += dt; if (bannerTimer > 0 && (bannerTimer -= dt) <= 0) document.getElementById('banner').style.display = 'none';
  if (comboTimer > 0 && (comboTimer -= dt) <= 0) combo = 0;
  if (player.thornsCd > 0) player.thornsCd -= dt;
  if (player.regen > 0) player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);

  const mins = Math.floor(gameTime / 60);
  if (mins >= 20 && !bossSpawned) { bossSpawned = true; spawnEliteBoss('final'); }
  else if (mins > 0 && mins % 5 === 0 && mins !== lastMegaBossMin && mins < 20) { lastMegaBossMin = mins; spawnEliteBoss('mega'); }
  else if (mins > 0 && mins % 2 === 0 && mins % 5 !== 0 && mins !== lastEliteMin && mins < 20) { lastEliteMin = mins; spawnEliteBoss('elite'); }

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

  if ((spawnTimer -= dt) <= 0) { spawnEnemy(); spawnTimer = Math.max(0.14, (0.85 - (gameTime / 60) * 0.035) / player.curseMult); }
  triggerSkills(dt);

  const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { statusDurMult: 1, statusChanceBonus: 0, st: {} };
  const spellBase = getSpellBase();

  zones = zones.filter(z => {
    z.life -= dt; z.tickTimer -= dt;
    if (z.kind === 'holypoly') {
      for (const e of enemies) {
        const d = Math.hypot(z.x - e.x, z.y - e.y);
        if (d < z.radius && d > 12) { const a = Math.atan2(z.y - e.y, z.x - e.x); e.x += Math.cos(a) * 95 * dt; e.y += Math.sin(a) * 95 * dt; }
      }
    }
    if (z.kind === 'healLight' && Math.hypot(player.x - z.x, player.y - z.y) <= z.radius) {
      const healPct = z.lv >= 5 ? 0.025 : (z.lv >= 3 ? 0.020 : 0.015);
      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * healPct * dt * 2);
    }
    if (z.tickTimer <= 0) {
      z.tickTimer = 0.5;
      if (z.kind === 'dark_pool') {
        damageArea(z.x, z.y, z.radius, 0, Math.PI * 2, z.dmg, 0, { element: 'dark', isDot: true });
      } else if (z.kind !== 'ice5_mist') {
        const zElem = z.kind.startsWith('ice') ? 'ice' : (z.kind.startsWith('thunder') ? 'lightning' : (z.kind === 'fire_sea' ? 'fire' : 'holy'));
        damageArea(z.x, z.y, z.radius, 0, Math.PI * 2, z.dmg * 0.55, 4, {
          element: zElem,
          onTargetHit: (e) => applyStatusTagsOnHit(e, zElem, spellBase, cs, z.sealChance || 0.35)
        });
      } else {
        for (const e of enemies) if (Math.hypot(e.x - z.x, e.y - z.y) <= z.radius + e.radius) applyStatusTagsOnHit(e, 'ice', spellBase, cs, 0.65);
      }
    }
        if (z.life <= 0) {
      if (z.kind === 'holypoly') {
        damageArea(z.x, z.y, z.radius * 1.15, 0, Math.PI * 2, z.dmg, 24, {
          element: 'holy',
          consumeSeal: true,
          sealBurstChance: z.sealChance || 0.45,
          onAfterHit: (e) => applyStatusTagsOnHit(e, 'holy', spellBase, cs, z.sealChance || 0.45, { isMelee: false })
        });
      }
      return false;
    }
    return true;
  });

  projectiles = projectiles.filter(p => {
    p.x += p.vx * dt; p.y += p.vy * dt; if ((p.life -= dt) <= 0) return false;
    if (p.skillId === 'ice3' && (p.orbShootCd -= dt) <= 0 && enemies.length > 0) {
      p.orbShootCd = 0.55;
      const t = enemies[Math.floor(Math.random() * enemies.length)];
      const a = Math.atan2(t.y - p.y, t.x - p.x);
      projectiles.push({ type: 'ice', elem: 'ice', skillId: 'ice1', x: p.x, y: p.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, radius: 9, dmg: p.dmg * 0.55, pierce: 2, life: 1.1, hitSet: new Set() });
    }
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (!p.hitSet.has(e) && Math.hypot(e.x - p.x, e.y - p.y) <= p.radius + e.radius) {
        p.hitSet.add(e);
        applyStatusTagsOnHit(e, p.elem || 'none', spellBase, cs, p.sealChance || 0.38);
        hitEnemy(j, p.dmg, { element: p.elem || 'none' });
        if (p.skillId === 'fire5') zones.push({ kind: 'fire_sea', x: p.x, y: p.y, radius: 95 * player.areaMult, life: 3.0, tickTimer: 0.5, dmg: p.dmg * 0.35, lv: 1, sealChance: 0.3 });
        if (p.skillId === 'ice5') zones.push({ kind: 'ice5_mist', x: p.x, y: p.y, radius: 130 * player.areaMult, life: 3.0, tickTimer: 0.5, dmg: 0, lv: 1 });
        if (--p.pierce <= 0) return false;
      }
    }
    return true;
  });
  const msLv = ownedPassives.manaShield || 0;
  if (msLv > 0) {
    player.maxShield = Math.round(player.maxHp * (0.10 + msLv * 0.05));
    if ((player.shieldTimer -= dt) <= 0) { player.shield = player.maxShield; player.shieldTimer = Math.max(5, 13 - msLv); }
  }
  const physRedMult = 1 - getEffectivePhysReducePct(cs) / 100;
  const thornsLv = ownedPassives.thorns || 0;
  const hasShieldLegend = (typeof saveData !== 'undefined' && saveData.equip && saveData.equip.sub && saveData.equip.sub.legendEffect && saveData.equip.sub.legendEffect.id === 'thorns');
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.freezeTimer > 0) e.freezeTimer -= dt; if (e.stunTimer > 0) e.stunTimer -= dt;
    if (e.shockTimer > 0) e.shockTimer -= dt; if (e.armorBreakTimer > 0) e.armorBreakTimer -= dt;
    if (e.darkTimer > 0) e.darkTimer -= dt; if (e.chainIcd > 0) e.chainIcd -= dt;
    if (e.hitFlash > 0) e.hitFlash -= dt;

    if (e.burnTimer > 0 && (e.burnTick += dt) >= 1.0) {
      e.burnTimer -= 1.0; e.burnTick = 0;
      hitEnemy(i, e.burnDps || spellBase * 0.90, { element: 'fire', isDot: true, noCrit: true });
      if (!enemies[i]) continue;
    }
    if (e.windTimer > 0 && (e.windTick += dt) >= 0.5) {
      e.windTimer -= 0.5; e.windTick = 0;
      hitEnemy(i, e.windDps || spellBase * 0.36, { element: 'wind' });
      if (!enemies[i]) continue;
    }

    const spd = e.speed * (typeof getEnemySpeedFactor === 'function' ? getEnemySpeedFactor(e) : 1);
    const ang = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(ang) * spd * dt; e.y += Math.sin(ang) * spd * dt;
    if (Math.hypot(player.x - e.x, player.y - e.y) < player.size * 0.75 + e.radius) {
      const atkMult = typeof getEnemyAtkFactor === 'function' ? getEnemyAtkFactor(e) : 1.0;
      const rawHurt = (e.isFinalBoss ? 38 : (e.isMegaBoss ? 28 : (e.isElite ? 20 : 12))) * atkMult;
      let taken = Math.max(1, rawHurt * physRedMult) * dt;
      if (player.shield > 0) { const abs = Math.min(player.shield, taken); player.shield -= abs; taken -= abs; }
      if (taken > 0) player.hp -= taken;

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
  gems = gems.filter(g => { const d = Math.hypot(player.x - g.x, player.y - g.y); if (d < player.pickupRange) { const a = Math.atan2(player.y - g.y, player.x - g.x); g.x += Math.cos(a) * 420 * dt; g.y += Math.sin(a) * 420 * dt; } if (d < 24) { if ((player.exp += g.val * (player.expMult || 1)) >= player.nextExp) { player.exp -= player.nextExp; player.lv++; player.nextExp = Math.round(player.nextExp * 1.35 + 3); levelUp(); } return false; } return true; });
  chests = chests.filter(c => Math.hypot(player.x - c.x, player.y - c.y) < 36 ? (openChest(c.kind || 'gold'), false) : true);
  lootBags = lootBags.filter(b => Math.hypot(player.x - b.x, player.y - b.y) < 36 ? (runLoot.push(b.item), showBanner(`📦 獲得 [未鑑定] ${b.rarName}裝備袋！`), false) : true);
  slashes = slashes.filter(s => (s.life -= dt) > 0); lightnings = lightnings.filter(l => (l.life -= dt) > 0); damageTexts = damageTexts.filter(t => { t.y -= 28 * dt; return (t.life -= dt) > 0; });
}

function draw() {
  ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const ox = canvas.width / 2 - player.x, oy = canvas.height / 2 - player.y;
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
  for (let x = ox % 80; x < canvas.width; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  for (let y = oy % 80; y < canvas.height; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  ctx.save(); ctx.translate(ox, oy);
  zones.forEach(z => {
    ctx.save();
    if (z.kind === 'fire_sea') {
      ctx.fillStyle = 'rgba(234,88,12,0.28)'; ctx.strokeStyle = 'rgba(251,146,60,0.75)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (z.kind === 'dark_pool') {
      ctx.fillStyle = 'rgba(88,28,135,0.34)'; ctx.strokeStyle = 'rgba(192,132,252,0.80)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (z.kind.startsWith('ice')) {
      ctx.fillStyle = 'rgba(56,189,248,0.20)'; ctx.strokeStyle = 'rgba(125,211,252,0.65)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (z.kind === 'thunder2') {
      ctx.strokeStyle = 'rgba(250,204,21,0.85)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(z.x, z.y, z.radius * 0.65, 0, Math.PI * 2); ctx.stroke();
    } else {
      const isHeal = z.kind === 'healLight';
      ctx.fillStyle = isHeal ? 'rgba(74,222,128,0.18)' : 'rgba(250,204,21,0.20)';
      ctx.strokeStyle = isHeal ? 'rgba(74,222,128,0.75)' : 'rgba(253,224,71,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(z.x, z.y, z.radius * 0.72, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  });
  gems.forEach(g => { ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(g.x, g.y, 5, 0, Math.PI * 2); ctx.fill(); });
  chests.forEach(c => { const isS = c.kind === 'silver'; ctx.fillStyle = isS ? '#e2e8f0' : '#facc15'; ctx.fillRect(c.x - 14, c.y - 11, 28, 22); ctx.strokeStyle = isS ? '#38bdf8' : '#fff'; ctx.lineWidth = 2; ctx.strokeRect(c.x - 14, c.y - 11, 28, 22); });
  lootBags.forEach(b => { ctx.fillStyle = b.color; ctx.fillRect(b.x - 11, b.y - 11, 22, 22); });
  enemies.forEach(e => {
    ctx.fillStyle = e.hitFlash > 0 ? '#fff' : (e.freezeTimer > 0 ? '#7dd3fc' : e.color);
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = e.shockTimer > 0 ? '#fde047' : (e.burnTimer > 0 ? '#fb923c' : (e.darkTimer > 0 ? '#c084fc' : '#0f172a')); ctx.lineWidth = 2.5; ctx.stroke();
  });
  slashes.forEach(s => {
    ctx.save();
    const sx = s.x || player.x, sy = s.y || player.y, ang = s.angle || 0;
    if (s.type === 'aurora' || (s.arc && s.arc <= 0.65)) {
      const ex = sx + Math.cos(ang) * s.range, ey = sy + Math.sin(ang) * s.range;
      ctx.strokeStyle = s.evolved ? 'rgba(250,204,21,0.9)' : 'rgba(125,211,252,0.85)';
      ctx.lineWidth = s.evolved ? 12 : 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s.evolved ? 4 : 2.5;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    } else {
      ctx.strokeStyle = s.type === 'fireboom' ? 'rgba(251,146,60,0.85)' : (s.type === 'holywave' ? 'rgba(253,224,71,0.85)' : 'rgba(226,232,240,0.8)');
      ctx.lineWidth = s.evolved ? 7 : 4;
      ctx.beginPath(); ctx.arc(sx, sy, s.range, ang - s.arc / 2, ang + s.arc / 2); ctx.stroke();
    }
    ctx.restore();
  });
  projectiles.forEach(p => { ctx.fillStyle = p.elem === 'fire' ? '#f97316' : (p.elem === 'ice' ? '#38bdf8' : (p.elem === 'lightning' ? '#facc15' : '#fef08a')); ctx.beginPath(); ctx.arc(p.x, p.y, p.radius || 8, 0, Math.PI * 2); ctx.fill(); });
  lightnings.forEach(l => { ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke(); });

  const ch = typeof getCurrentCharData === 'function' ? getCurrentCharData() : { color: '#3b82f6' };
  ctx.save(); ctx.translate(player.x, player.y - Math.abs(Math.sin(player.walkCycle)) * 4);
  ctx.fillStyle = ch.color || '#3b82f6'; ctx.fillRect(-12, -16, 24, 30);
  ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(0, -24, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(10 * player.flipX, 0); ctx.lineTo(28 * player.flipX, -12); ctx.stroke();
  ctx.restore();
  if (player.shield > 0) { ctx.strokeStyle = 'rgba(56,189,248,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(player.x, player.y - 6, 26, 0, Math.PI * 2); ctx.stroke(); }
  damageTexts.forEach(t => { ctx.fillStyle = t.color; ctx.font = 'bold 14px sans-serif'; ctx.fillText(t.txt, t.x, t.y); });
  ctx.restore();
  document.getElementById('lvText').textContent = `LV.${player.lv}`;
  document.getElementById('hpBar').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
  document.getElementById('hpNumText').textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
  document.getElementById('expBar').style.width = `${Math.min(100, (player.exp / player.nextExp) * 100)}%`;
  document.getElementById('expNumText').textContent = `EXP ${Math.floor((player.exp / player.nextExp) * 100)}%`;

  const shieldBox = document.getElementById('shieldBox');
  if (shieldBox) {
    if (player.maxShield > 0 || player.shield > 0) {
      shieldBox.style.display = 'block';
      const shPct = player.maxShield > 0 ? Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100)) : 0;
      document.getElementById('shieldBar').style.width = `${shPct}%`;
      const shText = document.getElementById('shieldNumText');
      if (shText) shText.textContent = player.shield > 0 ? `🛡️ 魔力護盾 ${Math.ceil(player.shield)} / ${player.maxShield}` : `⏳ 護盾充能中 (${Math.max(0, player.shieldTimer).toFixed(1)}s)`;
    } else { shieldBox.style.display = 'none'; }
  }

  document.getElementById('timeText').textContent = `${String(Math.floor(gameTime / 60)).padStart(2, '0')}:${String(Math.floor(gameTime % 60)).padStart(2, '0')}`;
  document.getElementById('killText').textContent = kills; document.getElementById('comboText').textContent = combo;

  const skillStateKey = Object.entries(ownedSkills).map(([k, v]) => `${k}:${v.lv}:${v.evolved}:${v.disabled}`).join('|');
  const skillListEl = document.getElementById('skillList');
  if (skillListEl && skillListEl.dataset.state !== skillStateKey) {
    skillListEl.dataset.state = skillStateKey;
    skillListEl.onmouseleave = hideSkillTooltip;
    skillListEl.innerHTML = Object.entries(ownedSkills).map(([k, st]) => {
      const sk = ACTIVE_SKILLS[k] || { name: k };
      const dispName = st.evolved ? (sk.evoName || sk.name) : sk.name;
      const iconChar = (st.evolved && sk.evoIcon) ? sk.evoIcon : (sk.icon || dispName.slice(0, 1));
      const borderCol = st.disabled ? '#475569' : (st.evolved ? '#facc15' : '#38bdf8');
      const bgCol = st.evolved ? 'rgba(180,83,9,0.55)' : 'rgba(15,23,42,0.88)';
      const dim = st.disabled ? 'opacity:0.4;filter:grayscale(1);' : '';
      const isMax = st.lv >= (sk.maxLv || 10);
      const lvLabel = isMax ? 'MAX' : st.lv;
      const lvStyle = isMax ? 'font-size:8px;color:#4ade80;' : 'font-size:9px;color:#fde047;';
      return `<div style="position:relative;width:32px;height:32px;border:1.5px solid ${borderCol};background:${bgCol};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:help;${dim}" onmouseenter="showSkillTooltip(event,'skill','${k}')" onmousemove="moveSkillTooltip(event)" onmouseleave="hideSkillTooltip()">${iconChar}<span style="position:absolute;bottom:-1px;right:1px;${lvStyle}font-weight:bold;text-shadow:0 1px 2px #000;">${lvLabel}</span></div>`;
    }).join('');
  }
}

function spawnEnemy() {
  if (bossSpawned) return;
  const ang = Math.random() * Math.PI * 2, dist = Math.max(canvas.width, canvas.height) * 0.62, mins = gameTime / 60;
  const hp = (20 + mins * 8) * player.curseMult;
  enemies.push({ x: player.x + Math.cos(ang) * dist, y: player.y + Math.sin(ang) * dist, radius: 15, hp, maxHp: hp, speed: 95 * player.curseMult, color: mins >= 4 ? '#ef4444' : '#facc15', expValue: 1 + Math.floor(mins / 3), hitFlash: 0 });
}

function spawnEliteBoss(tier) {
  const ang = Math.random() * Math.PI * 2, mins = Math.max(1, gameTime / 60);
  const isFinal = tier === 'final', isMega = tier === 'mega';
  const hpVal = (isFinal ? 5500 : (isMega ? 950 + mins * 180 : 320 + mins * 110)) * player.curseMult;
  enemies.push({ x: player.x + Math.cos(ang) * 380, y: player.y + Math.sin(ang) * 380, radius: isFinal ? 50 : (isMega ? 38 : 28), hp: hpVal, maxHp: hpVal, speed: 82 * (1 + (player.curseMult - 1) * 0.5), color: isFinal ? '#9333ea' : (isMega ? '#dc2626' : '#f97316'), name: isFinal ? '暗黑魔王' : (isMega ? '狂暴首領' : '精英魔物'), expValue: isMega ? 25 : 12, isElite: tier === 'elite', isMegaBoss: isMega, isFinalBoss: isFinal, hitFlash: 0 });
  showBanner(isFinal ? '⚠️ 20分鐘最終決戰！暗黑魔王降臨！' : (isMega ? '👑 狂暴大首領登場！擊敗掉落【金色超武寶箱】！' : '⚔️ 精英魔物出現！擊敗掉落【白銀幸運寶箱】！'));
}

function renderChoiceModal(subText) {
  const box = document.getElementById('cardContainer'); box.innerHTML = '';
  document.getElementById('modalSub').textContent = subText;
  currentChoices.forEach((c, idx) => {
    const div = document.createElement('div'); div.className = 'card'; div.onclick = () => selectUpgrade(idx);
    div.innerHTML = `<div class="card-key">按鍵 ${idx + 1}</div><div class="card-title">${c.title}</div><div class="card-desc">${c.desc}</div><div class="card-tag">${c.tag}</div>`;
    box.appendChild(div);
  });
  document.getElementById('levelModal').style.display = 'flex';
}

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
  if ((id === 'holylight' || id === 'fire1') && nextLv % 2 === 0) gains.push('射彈數量 +1 發');
  if (id === 'fire3' && (nextLv === 2 || nextLv === 5 || nextLv === 8 || nextLv === 10)) gains.push('環繞火球 +1 顆');
  if ((id === 'fire2' || id === 'ice1' || id === 'ice3' || id === 'thunder3') && nextLv % 3 === 0) gains.push('投射數量 +1 發');
  if ((id === 'fire4' || id === 'ice4') && nextLv % 3 === 0) gains.push('隕石數量 +1 顆');
  if ((id === 'thunder1' || id === 'thunder4') && nextLv % 3 === 0) gains.push('落雷道數 +1 道');
  if ((id === 'windblade' || id === 'firearrow' || id === 'thunder') && nextLv % 3 === 0) gains.push('投射／落雷數量 +1');
  if (id === 'armorbreak' && (nextLv === 5 || nextLv === 8)) gains.push('最大命中目標 +1 名');
  if (id === 'healLight' && (nextLv === 5 || nextLv === 10)) gains.push('光陣回血比例提升');
  if (['enbu', 'radiance', 'healLight', 'ice2', 'thunder2', 'earthhammer', 'fire2', 'fire4', 'ice4', 'thunder4'].includes(id)) {
    gains.push('攻擊範圍擴大');
  }
  return gains.join('、');
}

function levelUp() {
  hideSkillTooltip();
  isPaused = true; const pool = [], activePassives = getActivePassivePool();
  const hasAngel = !!ownedPassives.angelWish;
  const passiveToSkillMap = {};
  for (const skObj of Object.values(ACTIVE_SKILLS)) {
    if (skObj.canEvolve && skObj.reqPassive) passiveToSkillMap[skObj.reqPassive] = skObj.name;
  }

  for (const [k, sk] of Object.entries(ACTIVE_SKILLS)) {
    if (sk.isSuperWeapon) continue;
    if (hasAngel && (k === 'fire4' || k === 'ice4')) continue;
    if (sk.reqSkill && (!ownedSkills[sk.reqSkill] || ownedSkills[sk.reqSkill].lv < (sk.reqSkillLv || 2))) continue;
    const o = ownedSkills[k], maxL = sk.maxLv || 10;
    if (o && !o.disabled && o.lv < maxL) {
      const nextLv = o.lv + 1;
      const gainStr = getSkillNextLvGain(k, sk, nextLv);
      pool.push({ kind: 'skill', id: k, weight: 2.5, title: `${sk.name} LV.${o.lv} → LV.${nextLv}`, desc: `<strong style="color:#4ade80;">▲ 本次升級獲得：${gainStr}</strong>`, tag: '主動技能強化' });
    } else if (!o && Object.keys(ownedSkills).length < MAX_ACTIVE_SKILLS) {
      pool.push({ kind: 'skill', id: k, weight: 1.0, title: `【新技能】${sk.name}（LV.1）`, desc: sk.desc, tag: '習得新主動技' });
    }
  }
  for (const [k, p] of Object.entries(activePassives)) {
    if (k === 'angelWish' && (ownedSkills.fire4 || ownedSkills.fire5 || ownedSkills.ice4 || ownedSkills.ice5)) continue;
    const lv = ownedPassives[k] || 0, maxP = p.maxLv || 5;
    if (lv < maxP && (lv > 0 || Object.keys(ownedPassives).length < MAX_PASSIVE_SKILLS)) {
      const targetSkName = passiveToSkillMap[k];
      const pTag = targetSkName ? `可使【${targetSkName}】技能昇華` : '被動輔助強化';
      const stepText = getPassiveGainText(k, 1) || p.desc;
      const pDesc = lv > 0 ? `<strong style="color:#4ade80;">▲ ${stepText}</strong>` : stepText;
      pool.push({ kind: 'passive', id: k, weight: lv > 0 ? 2.5 : 1.0, title: lv > 0 ? `${p.name} LV.${lv} → LV.${lv + 1}` : `【新輔助】${p.name}`, desc: pDesc, tag: pTag });
    }
  }
  if (!pool.length) {
    currentChoices = [
      { kind: 'heal', title: '💚 女神聖光祝福（回復 40% 生命）', desc: '<strong style="color:#4ade80;">▲ 立即恢復 40% 最大生命值</strong>', tag: '生存補給' },
      { kind: 'seed', title: '💰 黃金種子袋（獲得 +50 Seed）', desc: '<strong style="color:#fde047;">▲ 局外錢包 Seed +50</strong>', tag: '資源農裝' }
    ];
    renderChoiceModal(`目前等級 LV.${player.lv}（全技能滿級突破獎勵）｜ 按 1 / 2 選擇`);
    return;
  }
  currentChoices = []; const tempPool = [...pool];
  while (currentChoices.length < 3 && tempPool.length > 0) {
    const pick = Math.floor(Math.random() * tempPool.length);
    currentChoices.push(tempPool[pick]); tempPool.splice(pick, 1);
  }
  renderChoiceModal(`目前等級 LV.${player.lv} ｜ 技能欄 ${Object.keys(ownedSkills).length}/${MAX_ACTIVE_SKILLS} 主動・${Object.keys(ownedPassives).length}/${MAX_PASSIVE_SKILLS} 被動`);
}

function selectUpgrade(idx) {
  const c = currentChoices[idx]; if (!c) return;
  if (c.kind === 'evolve') {
    const sk = ACTIVE_SKILLS[c.id];
    if (ownedSkills[c.id] && sk) {
      if (sk.disableWhenEvo && sk.evoSkillId) {
        ownedSkills[c.id].disabled = true; ownedSkills[c.id].evolved = true;
        ownedSkills[sk.evoSkillId] = { lv: 1, evolved: true, disabled: false };
      } else { ownedSkills[c.id].evolved = true; }
      showBanner(`🌟 技能昇華！【${sk.name}】昇華為【${sk.evoName}】！`);
    }
  } else if (c.kind === 'skill') {
    ownedSkills[c.id] ? ownedSkills[c.id].lv++ : (ownedSkills[c.id] = { lv: 1, evolved: false, disabled: false });
  } else if (c.kind === 'passive') {
    ownedPassives[c.id] = (ownedPassives[c.id] || 0) + 1;
    if (c.id === 'fastsword' || c.id === 'haste') player.cdMult *= 0.92;
    if (c.id === 'cdr') player.cdMult *= 0.94;
    if (c.id === 'guard' || c.id === 'area') player.areaMult += 0.10;
    if (c.id === 'might') player.dmgMult += 0.08;
    if (c.id === 'crit') player.bonusCritRate += 0.04;
    if (c.id === 'lucky') player.dropRateMult = (player.dropRateMult || 1.0) + 0.20;
    if (c.id === 'windBoot') player.speedMult += 0.09;
    if (c.id === 'angelWish') player.speedMult -= 0.10;
    if (c.id === 'heal') player.regen += 1.2;
    if (c.id === 'greed') player.seedMult = (player.seedMult || 1.0) + 0.15;
    if (c.id === 'curse') player.curseMult = (player.curseMult || 1.0) + 0.10;
  } else if (c.kind === 'seed') {
    if (typeof saveData !== 'undefined') { saveData.seed = (saveData.seed || 0) + 50; writeSave(); }
    showBanner('💰 獲得黃金種子袋！局外錢包 Seed +50！');
  } else { player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.4); }
  document.getElementById('levelModal').style.display = 'none'; isPaused = false;
}

function openChest(kind) {
  if (kind === 'silver') {
    const upgradable = Object.entries(ownedSkills).filter(([k, o]) => !o.disabled && o.lv < (ACTIVE_SKILLS[k]?.maxLv || 10));
    if (upgradable.length > 0) {
      const [id] = upgradable[Math.floor(Math.random() * upgradable.length)];
      ownedSkills[id].lv++; showBanner(`🎁 白銀寶箱！【${ACTIVE_SKILLS[id].name}】提升至 LV.${ownedSkills[id].lv}！`);
    } else { saveData.seed += 50; writeSave(); showBanner('🎁 白銀寶箱！全技能已滿，轉換為 Seed +50！'); }
    return;
  }
  const curWType = (typeof saveData !== 'undefined' && saveData.equip && saveData.equip.weapon) ? saveData.equip.weapon.type : null;
  const ready = Object.entries(ownedSkills).filter(([k, st]) => {
    const sk = ACTIVE_SKILLS[k];
    if (!sk || !sk.canEvolve || st.evolved || st.lv < sk.maxLv) return false;
    if (!sk.reqPassive || !ownedPassives[sk.reqPassive]) return false;
    if (sk.reqWeaponType && curWType !== sk.reqWeaponType) return false;
    return true;
  });
  if (ready.length > 0) {
    hideSkillTooltip(); isPaused = true;
    currentChoices = ready.slice(0, 3).map(([id]) => {
      const sk = ACTIVE_SKILLS[id];
      const evoSk = sk.evoSkillId ? ACTIVE_SKILLS[sk.evoSkillId] : null;
      const cleanDesc = (evoSk && evoSk.desc) ? evoSk.desc : (sk.evoDesc || sk.desc);
      return { kind: 'evolve', id, title: `🌟 技能昇華【${sk.evoName}】`, desc: cleanDesc, tag: '技能昇華' };
    });
    renderChoiceModal('📦 開啟金色昇華寶箱！請選擇要昇華的技能（按 1 / 2 / 3）');
    return;
  }
  player.hp = Math.min(player.maxHp, player.hp + 50);
  showBanner('📦 開啟金色寶箱！生命回復 +50');
}

function getSkillTooltipEl() {
  let tip = document.getElementById('skillTooltip');
  if (!tip) {
    tip = document.createElement('div'); tip.id = 'skillTooltip';
    tip.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;background:rgba(15,23,42,0.96);border:1.5px solid #facc15;border-radius:8px;padding:10px 12px;color:#f8fafc;font-size:12px;line-height:1.55;max-width:295px;box-shadow:0 8px 24px rgba(0,0,0,0.75);display:none;';
    document.body.appendChild(tip);
  }
  return tip;
}

function showSkillTooltip(e, kind, id) {
  const tip = getSkillTooltipEl();
  if (kind === 'skill') {
    const sk = ACTIVE_SKILLS[id], st = ownedSkills[id];
    if (!sk || !st) return;
    const rawDmg = Math.round(getSkillRawDmg(id, st.lv, st.evolved));
    const realCd = (sk.baseCd * getEffectiveCdMult(Math.pow(0.95, st.lv - 1))).toFixed(2);
    const isEvo = !!(st.evolved || sk.isSuperWeapon);
    const partnerId = sk.resonancePartner || sk.resonanceSkill;
    const isResActive = !partnerId || !!ownedSkills[partnerId];
    const resLine = (isEvo && sk.resonanceDesc)
      ? `<div style="margin-top:5px;padding-top:4px;border-top:1px dashed #334155;color:${isResActive ? '#4ade80' : '#64748b'};">${isResActive ? '✨【元素共鳴・已啟動】' : '🔒【元素共鳴・未啟動】'}${sk.resonanceDesc}</div>`
      : '';
    const descText = (isEvo && sk.evoDesc) ? sk.evoDesc : sk.desc;
    tip.innerHTML = `<div style="font-weight:bold;color:#fde047;font-size:13px;margin-bottom:4px;">${isEvo ? (sk.evoName || sk.name) : sk.name}（LV.${st.lv}）</div><div>預估基傷：<strong>${rawDmg}</strong> ｜ 實際冷卻：<strong>${realCd} 秒</strong></div><div style="color:#cbd5e1;margin-top:3px;">${descText}</div>${resLine}`;
  } else if (kind === 'passive') {
    const p = getActivePassivePool()[id], lv = ownedPassives[id] || 0;
    if (!p) return;
    const curTotalText = getPassiveGainText(id, Math.max(1, lv)) || p.desc;
    tip.innerHTML = `<div style="font-weight:bold;color:#38bdf8;font-size:13px;margin-bottom:4px;">${p.name}（LV.${lv}）</div><div style="color:#4ade80;font-weight:bold;">目前效果：${curTotalText}</div>`;
  } else if (kind === 'baseStat') {
    const statDesc = {
      S: '【STAB 刺擊】提升刺擊系技能（STAB×1.0 + HACK×0.3）與物理武器基礎傷害。',
      H: '【HACK 劈砍】提升劈砍系技能（HACK×1.0 + STAB×0.3）與物理武器基礎傷害。',
      I: '【INT 元素法術】提升元素法術（INT×1.0 + MR×0.3）與魔劍複合技能基礎傷害。',
      DEF: '【DEF 物理防禦】提升最大生命值（每點 +3 HP）與物理（碰撞）減傷率。',
      MR: '【MR 白魔／精神】提升白魔術技能基數、元素法術副係數（MR×0.3）與魔法減傷率。',
      DEX: '【DEX 技巧】提升暴擊率（每 10 點 +1%）與局內經驗獲取。',
      AGI: '【AGI 敏捷】提升暴擊傷害倍率（每 1 點 +0.6%）與拾取範圍。'
    }[id];
    if (!statDesc) return;
    tip.innerHTML = `<div style="color:#e2e8f0;">${statDesc}</div>`;
  } else if (kind === 'stat') {
    const statTips = {
      phys: '🛡️ 物理減傷：抵擋怪物碰撞與近戰物理傷害（來自 DEF、光之壁障術與裝備）。',
      mag: '💠 魔法減傷：抵擋怪物魔法射彈與投射物傷害（來自 MR、魔法盾牌與裝備）。',
      cdr: '⏳ 冷卻縮減：降低所有主動技能的冷卻時間。',
      regen: '💚 生命回復：每秒自動恢復的生命值。',
      dmg: '⚔️ 傷害倍率：放大全技能最終基礎傷害。',
      area: '🌐 範圍擴大：放大揮砍、投射與領域半徑。',
      speed: '👟 移動速度：基礎移速（含鞋子詞綴）× 疾風移速倍率。',
      critRate: '🎯 暴擊率：純加算，超過 100% 溢出轉為紅字超暴擊 💢（黃爆再乘 1.5x）。',
      critDmg: '💥 暴擊傷害：黃字暴擊傷害倍率（來自基礎 150%、AGI 與裝備）。',
      doubleHit: '⚔️ 連擊機率：攻擊時有機率額外打出 75% 傷害連擊（上限 45%）。',
      dur: '🔥 異常時長：延長點燃、凍結、感電、鎌鼬、聖印、破甲與暗蝕持續時間。',
      chance: '✨ 異常機率：提升各系技能掛載異常狀態的觸發機率（上限 85%）。',
      exp: '📖 經驗獲取：放大經驗寶石獲取倍率。',
      pickup: '🧲 拾取範圍：擴大經驗寶石與掉落物磁吸半徑。',
      seedMult: '💰 貨幣獲取：放大結算時獲得的局外 Seed 貨幣倍率（來自貪婪祝福）。',
      curseMult: '💀 詛咒倍率：提升怪物生命、移動速度與刷怪頻率的難度倍率（來自暗黑詛咒）。'
    };
    if (!statTips[id]) return;
    tip.innerHTML = `<div style="color:#e2e8f0;">${statTips[id]}</div>`;
  }
  tip.style.display = 'block'; moveSkillTooltip(e);
}

function moveSkillTooltip(e) {
  const tip = document.getElementById('skillTooltip');
  if (!tip || tip.style.display === 'none') return;
  tip.style.left = `${Math.max(10, Math.min(window.innerWidth - tip.offsetWidth - 14, e.clientX + 14))}px`;
  tip.style.top = `${Math.max(10, Math.min(window.innerHeight - tip.offsetHeight - 14, e.clientY + 14))}px`;
}
function hideSkillTooltip() { const tip = document.getElementById('skillTooltip'); if (tip) tip.style.display = 'none'; }

function togglePause() {
  hideSkillTooltip();
  const modal = document.getElementById('pauseModal');
  if (!isPaused) {
    isPaused = true;
    const s = typeof getTotalStats === 'function' ? getTotalStats() : {};
    const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : {};
    const activePassives = getActivePassivePool();
    const twMeta = [{ key: 'S', label: 'STAB', color: '#fb923c' }, { key: 'H', label: 'HACK', color: '#f87171' }, { key: 'I', label: 'INT', color: '#38bdf8' }, { key: 'DEF', label: 'DEF', color: '#4ade80' }, { key: 'MR', label: 'MR', color: '#c084fc' }, { key: 'DEX', label: 'DEX', color: '#facc15' }, { key: 'AGI', label: 'AGI', color: '#2dd4bf' }];
    const statGridHtml = twMeta.map(m => {
      const tot = s[m.key] || 0, bas = typeof getNakedStat === 'function' ? getNakedStat(m.key) : tot, bonus = tot - bas;
      const dStr = bonus > 0 ? `<span style="font-size:11px;color:#94a3b8;margin-right:6px;">(${bas} <span style="color:#4ade80;">+${bonus}</span>)</span>` : '';
      return `<div style="cursor:help;display:flex;justify-content:space-between;align-items:center;background:rgba(15,23,42,0.75);border:1px solid #334155;border-radius:5px;padding:4px 10px;" onmouseenter="showSkillTooltip(event,'baseStat','${m.key}')" onmousemove="moveSkillTooltip(event)" onmouseleave="hideSkillTooltip()"><span style="font-size:12px;font-weight:bold;color:${m.color};">${m.label}</span><div>${dStr}<strong style="font-size:13px;color:#f8fafc;">${tot}</strong></div></div>`;
    }).join('');

    const physPct = getEffectivePhysReducePct(cs), magPct = getEffectiveMagReducePct(cs);
    const curCdrPct = Math.round((1 - getEffectiveCdMult(1.0)) * 100);
    const rawCritVal = ((cs.critRate || 0.05) + (player.bonusCritRate || 0)) * 100;
    const critStr = rawCritVal > 100 ? `100% <span style="color:#ff4d4f;">(紅爆${(rawCritVal - 100).toFixed(0)}%)</span>` : `${rawCritVal.toFixed(1)}%`;
    const cRows = [
      { id: 'phys', l: '物理減傷', v: `${physPct}%`, c: '#4ade80' }, { id: 'mag', l: '魔法減傷', v: `${magPct}%`, c: '#38bdf8' },
      { id: 'cdr', l: '冷卻縮減', v: `${curCdrPct}%`, c: '#38bdf8' }, { id: 'regen', l: '生命回復', v: `+${player.regen.toFixed(1)}/秒`, c: '#4ade80' },
      { id: 'dmg', l: '傷害倍率', v: `${Math.round(player.dmgMult * 100)}%`, c: '#fde047' }, { id: 'area', l: '範圍擴大', v: `+${Math.round((player.areaMult - 1) * 100)}%`, c: '#f8fafc' },
      { id: 'speed', l: '移動速度', v: `${Math.round(player.baseSpeed * player.speedMult)}`, c: '#f8fafc' }, { id: 'critRate', l: '暴擊率', v: critStr, c: rawCritVal > 100 ? '#ff4d4f' : '#f8fafc' },
      { id: 'critDmg', l: '暴擊傷害', v: `${Math.round((cs.critDmg || 1.5) * 100)}%`, c: '#f8fafc' }, { id: 'doubleHit', l: '連擊機率', v: `${((cs.doubleHitChance || 0) * 100).toFixed(1)}%`, c: '#fb923c' },
      { id: 'dur', l: '異常時長', v: `+${Math.round(((cs.statusDurMult || 1) - 1) * 100)}%`, c: '#38bdf8' }, { id: 'chance', l: '異常機率', v: `+${((cs.statusChanceBonus || 0) * 100).toFixed(1)}%`, c: '#c084fc' },
      { id: 'exp', l: '經驗獲取', v: `${Math.round(player.expMult * 100)}%`, c: '#38bdf8' }, { id: 'pickup', l: '拾取範圍', v: `${cs.pickupRange || 115}`, c: '#2dd4bf' },
      { id: 'seedMult', l: '💰 貨幣獲取', v: `${Math.round((player.seedMult || 1.0) * 100)}%`, c: '#facc15' }, { id: 'curseMult', l: '💀 詛咒倍率', v: `${Math.round((player.curseMult || 1.0) * 100)}%`, c: '#f87171' }
    ];
    const combatGridHtml = cRows.map(r => `<div style="cursor:help;display:flex;justify-content:space-between;align-items:center;background:rgba(15,23,42,0.75);border:1px solid #334155;border-radius:5px;padding:4px 8px;" onmouseenter="showSkillTooltip(event,'stat','${r.id}')" onmousemove="moveSkillTooltip(event)" onmouseleave="hideSkillTooltip()"><span style="font-size:11px;color:#94a3b8;">${r.l}</span><strong style="font-size:12px;color:${r.c};">${r.v}</strong></div>`).join('');

    const skillBadges = Object.entries(ownedSkills).map(([k, v]) => {
      const sk = ACTIVE_SKILLS[k] || { name: k };
      const dispName = v.evolved ? (sk.evoName || sk.name) : sk.name;
      const iconChar = (v.evolved && sk.evoIcon) ? sk.evoIcon : (sk.icon || dispName.slice(0, 1));
      const isMax = v.lv >= (sk.maxLv || 10);
      const lvText = v.disabled ? '已進化停用' : (isMax ? 'MAX' : `LV.${v.lv}/${sk.maxLv || 10}`);
      const dim = v.disabled ? 'opacity:0.4;filter:grayscale(1);border-color:#475569;' : (v.evolved ? 'border-color:#facc15;background:rgba(180,83,9,0.35);' : 'border-color:#38bdf8;background:rgba(15,23,42,0.85);');
      return `<div style="cursor:help;display:flex;align-items:center;gap:10px;border:1.5px solid;${dim}border-radius:8px;padding:6px 10px;" onmouseenter="showSkillTooltip(event,'skill','${k}')" onmousemove="moveSkillTooltip(event)" onmouseleave="hideSkillTooltip()">
        <div style="width:36px;height:36px;border-radius:6px;background:rgba(30,41,59,0.95);border:1px solid #475569;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${iconChar}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;"><strong style="font-size:13px;color:#fef08a;">${dispName}</strong><span style="font-size:11px;font-weight:bold;color:${isMax ? '#4ade80' : '#38bdf8'};">${lvText}</span></div>
          <div style="font-size:11px;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">${sk.desc || ''}</div>
        </div>
      </div>`;
    }).join('');

    const passiveBadges = Object.entries(ownedPassives).map(([k, lv]) => {
      const p = activePassives[k] || { name: k, maxLv: 5 };
      const iconChar = p.name.trim().split(' ')[0];
      const cleanName = p.name.replace(iconChar, '').trim() || p.name;
      const isMax = lv >= (p.maxLv || 5);
      const curEffect = getPassiveGainText(k, lv) || p.desc;
      return `<div style="cursor:help;display:flex;align-items:center;gap:10px;border:1px solid #475569;background:rgba(15,23,42,0.85);border-radius:8px;padding:6px 10px;" onmouseenter="showSkillTooltip(event,'passive','${k}')" onmousemove="moveSkillTooltip(event)" onmouseleave="hideSkillTooltip()">
        <div style="width:36px;height:36px;border-radius:6px;background:rgba(30,41,59,0.95);border:1px solid #475569;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${iconChar}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;"><strong style="font-size:13px;color:#e2e8f0;">${cleanName}</strong><span style="font-size:11px;font-weight:bold;color:${isMax ? '#4ade80' : '#94a3b8'};">${isMax ? 'MAX' : 'LV.' + lv + '/' + (p.maxLv || 5)}</span></div>
          <div style="font-size:11px;color:#4ade80;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">${curEffect}</div>
        </div>
      </div>`;
    }).join('') || '<span style="color:#64748b;font-size:12px;">尚未習得輔助</span>';

    document.getElementById('pauseContent').innerHTML = `
      <div class="status-sec" style="border-color:#eab308;"><div style="display:flex;justify-content:space-between;margin-bottom:6px;"><strong style="color:#fef08a;font-size:14px;">${getCurrentCharData().name}</strong><strong style="color:#fde047;">LV.${player.lv} ｜ HP ${Math.ceil(player.hp)}/${player.maxHp}</strong></div><div style="display:flex;flex-direction:column;gap:3px;">${statGridHtml}</div></div>
      <div class="status-sec"><h3>⚔️ 即時戰鬥面板總覽 <span style="font-size:11px;color:#94a3b8;font-weight:normal;">(移上查看說明)</span></h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:6px;">${combatGridHtml}</div></div>
      <div class="status-sec"><h3>🔥 主動技能欄（${Object.keys(ownedSkills).length}/${MAX_ACTIVE_SKILLS}）</h3><div style="display:flex;flex-direction:column;gap:6px;margin-top:6px;">${skillBadges}</div></div>
      <div class="status-sec"><h3>🔮 被動輔助欄（${Object.keys(ownedPassives).length}/${MAX_PASSIVE_SKILLS}）</h3><div style="display:flex;flex-direction:column;gap:6px;margin-top:6px;">${passiveBadges}</div></div>`;
    modal.style.display = 'flex';
  } else { modal.style.display = 'none'; isPaused = false; }
}

function endGame(win) {
  gameOver = true;
  const expGain = kills * 2 + Math.floor(gameTime / 5) + (win ? 250 : 0);
  const seedGain = Math.round((kills * 3 + (win ? 400 : 0)) * (player.seedMult || 1.0));
  if (typeof addOutExpAndSeed === 'function') addOutExpAndSeed(expGain, seedGain);
  if (runLoot.length > 0 && typeof saveData !== 'undefined') { saveData.bag.push(...runLoot); writeSave(); }
  document.getElementById('endTitle').textContent = win ? '🎉 20分鐘天翼覺醒・討伐成功！' : '💀 天翼斷裂';
  document.getElementById('endSummary').innerHTML = `存活時間：${document.getElementById('timeText').textContent} ｜ 總擊殺：${kills} ｜ 最高等級：LV.${player.lv}<br><span style="color:#fde047;">💰 結算獲得：局外經驗 +${expGain} ｜ Seed +${seedGain}（已自動存檔）</span>`;
  document.getElementById('endModal').style.display = 'flex';
}

renderLobby();
let lastT = performance.now();
function loop(now) { const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; update(dt); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

const EQUIPPED_WEAPON = { name: '學徒長劍', startSkill: 'enbu' };
const LUCIEN_SKILLS = getActiveSkillPool();
const MAX_ACTIVE_SKILLS = 5;
const MAX_PASSIVE_SKILLS = 7;

let isPaused = true, gameOver = false, gameTime = 0, kills = 0, combo = 0, comboTimer = 0;
let bossSpawned = false, currentChoices = [], bannerTimer = 0, spawnTimer = 0.5;
let lastEliteMin = 0, lastMegaBossMin = 0;

const player = {
  x: 0, y: 0, size: 28, baseSpeed: 235,
  hp: 120, maxHp: 120, shield: 0, maxShield: 0, shieldTimer: 0, thornsCd: 0,
  regen: 0, lv: 1, exp: 0, nextExp: 5, pickupRange: 115,
  facingAngle: 0, lastMoveAngle: 0, flipX: 1, walkCycle: 0,
  dmgMult: 1.0, cdMult: 1.0, areaMult: 1.0, speedMult: 1.0,
  bonusCritRate: 0, resonanceDmgMult: 1.0, dropRateMult: 1.0,
  expMult: 1.0, curseMult: 1.0
};


function getEffectiveCdMult(extraFactor = 1.0) {
  return Math.max(0.35, player.cdMult * extraFactor);
}

// 升級左上角角色卡片為《天翼之鍊》原作頭像與經典雙層狀態條風格（保留右上時間與擊殺HUD）
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
          <strong style="color:#fef08a;letter-spacing:0.5px;">路西安．卡爾茲</strong>
          <span id="weaponText" style="font-size:11px;color:#93c5fd;background:rgba(30,58,138,0.6);padding:1px 6px;border-radius:4px;border:1px solid #3b82f6;">學徒長劍</span>
        </div>
        <div style="position:relative;height:11px;background:#450a0a;border:1px solid #7f1d1d;border-radius:6px;overflow:hidden;margin-bottom:4px;">
          <div id="hpBar" style="height:100%;width:100%;background:linear-gradient(90deg,#dc2626,#f87171);transition:width 0.15s;"></div>
          <span id="hpNumText" style="position:absolute;inset:0;font-size:9px;line-height:10px;text-align:center;color:#fff;font-weight:bold;text-shadow:0 1px 2px #000;">120/120</span>
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
    <div id="skillList" style="margin-top:7px;padding-top:5px;border-top:1px solid rgba(148,163,184,0.25);display:flex;flex-wrap:wrap;gap:4px;font-size:11px;"></div>`;
}


upgradeClassicHud();

const ownedSkills = { [EQUIPPED_WEAPON.startSkill]: { lv: 1, evolved: false } };
const ownedPassives = {};
let enemies = [], slashes = [], projectiles = [], lightnings = [], gems = [], chests = [], damageTexts = [];
let lootBags = [], runLoot = [];
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (gameOver && e.code === 'KeyR') location.reload();
  if (!gameOver && (e.code === 'Escape' || e.code === 'KeyP') && document.getElementById('levelModal').style.display !== 'flex' && document.getElementById('lobbyModal').style.display !== 'flex') {
    togglePause();
    return;
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
  const sk = LUCIEN_SKILLS[id];
  const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { st: {} };
  const st = cs.st || {};
  const wType = (typeof saveData !== 'undefined' && saveData.equip.weapon) ? saveData.equip.weapon.type : 'longsword';
  const wm = WEAPON_MOD[wType] || WEAPON_MOD.longsword;
  const mainBonus = (st[sk.mainStat] || 0) * (wm[sk.mainStat] || 1.0);
  const subBonus = (st[sk.subStat] || 0) * (wm[sk.subStat] || 1.0) * 0.3;
  return ((sk.baseDmg + lv * sk.perLv) + mainBonus + subBonus) * player.dmgMult * (evolved ? 1.45 : 1.0);
}

function triggerSkills(dt) {
  const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { extraProj: 0, statusDurMult: 1 };
  for (const [id, st] of Object.entries(ownedSkills)) {
    const sk = LUCIEN_SKILLS[id];
    if (!sk || (sk.timer -= dt) > 0) continue;
    const cdFactor = getEffectiveCdMult(Math.pow(0.92, st.lv - 1));
    const rawDmg = getSkillRawDmg(id, st.lv, st.evolved);
    const hasResonance = st.evolved && sk.resonanceSkill && ownedSkills[sk.resonanceSkill];

    if (id === 'renga') {
      const near = enemies.reduce((a, b) => (!a || Math.hypot(b.x - player.x, b.y - player.y) < Math.hypot(a.x - player.x, a.y - player.y)) ? b : a, null);
      if (near && Math.hypot(near.x - player.x, near.y - player.y) < 460) { player.facingAngle = Math.atan2(near.y - player.y, near.x - player.x); player.flipX = Math.cos(player.facingAngle) >= 0 ? 1 : -1; }
      const range = (125 + st.lv * 10) * player.areaMult * (st.evolved ? 1.35 : 1), arc = st.evolved ? Math.PI * 2 : (1.8 + st.lv * 0.1);
      const swings = st.lv >= 4 ? 2 : 1, hitTag = hasResonance ? 'renga_fire' : 'physical';
      for (let s = 0; s < swings; s++) {
        slashes.push({ type: hasResonance ? 'fireboom' : 'renga', angle: player.facingAngle + (s * 0.35 - 0.15), range, arc, life: 0.18 + s * 0.08, evolved: st.evolved });
        damageArea(player.x, player.y, range, player.facingAngle, arc, rawDmg * (swings === 2 ? 0.72 : 1), 16, hitTag);
      }
      sk.timer = Math.max(0.18, sk.baseCd * cdFactor * (st.evolved ? 0.55 : 1));
    } else if (id === 'aurora') {
      const reach = (115 + st.lv * 8) * player.areaMult * (st.evolved ? 1.3 : 1);
      const near = enemies.reduce((a, b) => (!a || Math.hypot(b.x - player.x, b.y - player.y) < Math.hypot(a.x - player.x, a.y - player.y)) ? b : a, null);
      if (near && Math.hypot(near.x - player.x, near.y - player.y) <= reach + 180) { player.facingAngle = Math.atan2(near.y - player.y, near.x - player.x); player.flipX = Math.cos(player.facingAngle) >= 0 ? 1 : -1; }
      const ang = player.facingAngle;
      slashes.push({ type: 'aurora', angle: ang, range: reach, arc: 0.35, life: 0.12, evolved: st.evolved });
      let targetIdx = -1, minD = reach + 25;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i], dx = e.x - player.x, dy = e.y - player.y, d = Math.hypot(dx, dy);
        if (d <= reach + e.radius) { let diff = Math.atan2(dy, dx) - ang; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2; if (Math.abs(diff) <= 0.4 && d < minD) { minD = d; targetIdx = i; } }
      }
      if (targetIdx !== -1) {
        const target = enemies[targetIdx];
        if (hasResonance) { lightnings.push({ x: target.x, y: target.y, life: 0.22 }); target.shockTimer = 2.0 * (cs.statusDurMult || 1); }
        hitEnemy(targetIdx, rawDmg * (st.evolved ? 1.25 : 1), st.lv >= 4 ? 'aurora_crit' : 'aurora');
      }
      sk.timer = Math.max(0.16, sk.baseCd * cdFactor * (st.evolved ? 0.65 : 1));
    } else if (id === 'enbu') {
      const range = (115 + st.lv * 13) * player.areaMult * (st.evolved ? 1.45 : 1);
      slashes.push({ type: 'enbu', angle: 0, range, arc: Math.PI * 2, life: st.lv >= 4 ? 0.55 : 0.28, evolved: st.evolved });
      damageArea(player.x, player.y, range, 0, Math.PI * 2, rawDmg, 45, 'enbu');
      if (hasResonance) {
        for (let k = 0; k < 4; k++) { const a = (Math.PI / 2) * k + gameTime; projectiles.push({ type: 'wind', x: player.x, y: player.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, radius: 11, dmg: rawDmg * 0.45, pierce: 3, life: 0.8, evolved: true, hitSet: new Set() }); }
      }
      sk.timer = Math.max(0.45, sk.baseCd * cdFactor * (st.evolved ? 0.5 : 1));
    } else if (id === 'windblade' || id === 'firearrow') {
      const baseShots = 1 + Math.floor(st.lv / 3) + (cs.extraProj || 0);
      for (let i = 0; i < baseShots; i++) {
        const t = enemies[Math.floor(Math.random() * enemies.length)];
        const ang = (t ? Math.atan2(t.y - player.y, t.x - player.x) : Math.random() * Math.PI * 2) + (Math.random() - 0.5) * 0.24;
        projectiles.push({ type: id === 'windblade' ? 'wind' : 'fire', x: player.x, y: player.y, vx: Math.cos(ang) * 560, vy: Math.sin(ang) * 560, radius: 10 * player.areaMult, dmg: rawDmg, pierce: (id === 'windblade' && st.lv >= 4) ? 2 : 1, life: 1.4, evolved: false, hitSet: new Set() });
      }
      sk.timer = Math.max(0.22, sk.baseCd * cdFactor);
    } else if (id === 'thunder' && enemies.length > 0) {
      const strikes = 1 + Math.floor(st.lv / 3) + (cs.extraProj || 0);
      for (let i = 0; i < strikes; i++) {
        const idx = Math.floor(Math.random() * enemies.length), e = enemies[idx];
        if (e) { e.shockTimer = 2.2 * (cs.statusDurMult || 1); lightnings.push({ x: e.x, y: e.y, life: 0.25 }); hitEnemy(idx, rawDmg, 'magic'); }
      }
      sk.timer = Math.max(0.5, sk.baseCd * cdFactor);
    }
  }
}
function damageArea(cx, cy, range, facing, arc, baseDmg, kb, tag) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i], dx = e.x - cx, dy = e.y - cy;
    if (Math.hypot(dx, dy) <= range + e.radius) {
      let diff = Math.atan2(dy, dx) - facing;
      while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
      if (arc >= Math.PI * 1.9 || Math.abs(diff) <= arc / 2) {
        const ang = Math.atan2(dy, dx), res = (e.isElite || e.isMegaBoss || e.isFinalBoss) ? 0.15 : 1;
        e.x += Math.cos(ang) * kb * res; e.y += Math.sin(ang) * kb * res;
        hitEnemy(i, baseDmg, tag);
      }
    }
  }
}

function hitEnemy(idx, rawDmg, tag = 'magic') {
  const e = enemies[idx]; if (!e) return;
  const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { critRate: 0.1, critDmg: 1.5, statusCritMult: 1.5, statusDurMult: 1 };
  if (tag === 'renga_fire') e.burnTimer = Math.max(e.burnTimer || 0, 3.0 * (cs.statusDurMult || 1));
  const totalCritRate = Math.min(0.95, (cs.critRate || 0.1) + (player.bonusCritRate || 0));
  let mult = 0.94 + Math.random() * 0.12, crit = Math.random() < totalCritRate;
  if (crit) mult *= cs.critDmg;
  if ((tag === 'physical' || tag === 'enbu' || tag === 'renga_fire') && (e.shockTimer > 0 || e.burnTimer > 0)) { mult *= cs.statusCritMult * player.resonanceDmgMult; crit = true; }
  if ((tag === 'aurora' || tag === 'aurora_crit') && (e.slowTimer > 0 || e.shockTimer > 0)) { mult *= cs.statusCritMult * player.resonanceDmgMult; crit = true; }
  if (tag === 'burn') { mult *= player.resonanceDmgMult; }
  const dmg = Math.round(rawDmg * mult); e.hp -= dmg; e.hitFlash = 0.08;
  damageTexts.push({ x: e.x, y: e.y - e.radius, text: crit ? `💥${dmg}` : dmg, color: crit ? '#fde047' : '#fff', life: 0.55 });
  if (e.hp <= 0) {
    if ((tag === 'enbu' || tag === 'renga_fire' || tag === 'fire') && e.burnTimer > 0) {
      slashes.push({ type: 'fireboom', x: e.x, y: e.y, range: 95 * player.areaMult, arc: Math.PI * 2, life: 0.25 });
      damageArea(e.x, e.y, 95 * player.areaMult, 0, Math.PI * 2, rawDmg * 0.75 * player.resonanceDmgMult, 15, 'magic');
    }
    if (e.isFinalBoss) { endGame(true); return; }
    if (e.isMegaBoss) chests.push({ x: e.x, y: e.y, kind: 'gold' });
    else if (e.isElite) chests.push({ x: e.x, y: e.y, kind: 'silver' });
    const baseDropChance = 0.015 * (player.dropRateMult || 1.0);
    if (e.isFinalBoss || e.isMegaBoss || e.isElite || Math.random() < baseDropChance) {
      const dropCount = (e.isFinalBoss || e.isMegaBoss) ? 2 : 1;
      for (let d = 0; d < dropCount; d++) {
        const rRoll = Math.random();
        let rar = (e.isFinalBoss || e.isMegaBoss) ? (rRoll < 0.20 ? 'gold' : (rRoll < 0.75 ? 'purple' : 'blue')) : (e.isElite ? (rRoll < 0.05 ? 'gold' : (rRoll < 0.30 ? 'purple' : (rRoll < 0.80 ? 'blue' : 'green'))) : (rRoll < 0.002 ? 'gold' : (rRoll < 0.02 ? 'purple' : (rRoll < 0.10 ? 'blue' : (rRoll < 0.35 ? 'green' : 'white')))));
        const dropItem = typeof createUnidentifiedDrop === 'function' ? createUnidentifiedDrop(rar, saveData.outLv + 10, null, (e.isFinalBoss || e.isMegaBoss) && d === 0) : null;
        if (dropItem) lootBags.push({ x: e.x + (d * 24 - 12), y: e.y, item: dropItem, color: RARITIES[rar].color, rarName: RARITIES[rar].name });
      }
    }
    gems.push({ x: e.x, y: e.y, val: e.expValue }); enemies.splice(idx, 1); kills++; combo++; comboTimer = 2.5;
  }
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

function levelUp() {
  isPaused = true; const pool = [];
  const activePassives = getActivePassivePool();
  for (const [k, sk] of Object.entries(LUCIEN_SKILLS)) {
    const o = ownedSkills[k], maxL = sk.maxLv || 8;
    if (o && o.lv < maxL) {
      const nextLv = o.lv + 1;
      const note = (sk.lvNotes && sk.lvNotes[nextLv]) ? `<br><strong style="color:#fde047;">${sk.lvNotes[nextLv]}</strong>` : '';
      const tagText = sk.canEvolve ? `LV.${maxL}配【${activePassives[sk.reqPassive]?.name || ''}】覺醒` : '元素異常連鎖技（不可超武進化）';
      pool.push({ kind: 'skill', id: k, weight: 2.5, title: `${sk.name} LV.${o.lv}→${nextLv} (上限${maxL})`, desc: sk.desc + note, tag: tagText });
    } else if (!o && Object.keys(ownedSkills).length < MAX_ACTIVE_SKILLS) {
      pool.push({ kind: 'skill', id: k, weight: 1.0, title: `【新技能】${sk.name}`, desc: sk.desc, tag: sk.canEvolve ? `可進化為 ${sk.evoName}` : '元素異常輔助（MAX LV.10）' });
    }
  }
  for (const [k, p] of Object.entries(activePassives)) {
    const lv = ownedPassives[k] || 0, maxP = p.maxLv || 5;
    if (lv < maxP && (lv > 0 || Object.keys(ownedPassives).length < MAX_PASSIVE_SKILLS)) {
      pool.push({ kind: 'passive', id: k, weight: lv > 0 ? 2.5 : 1.0, title: lv > 0 ? `${p.name} LV.${lv}→${lv + 1}` : `【新輔助】${p.name}`, desc: p.desc, tag: '輔助強化' });
    }
  }
  if (!pool.length) {
    currentChoices = [
      { kind: 'heal', title: '💚 女神聖光祝福（回復 40% 生命）', desc: '全技能已臻巔峰！立即恢復大量生命值維持戰線。', tag: '生存補給' },
      { kind: 'seed', title: '💰 黃金種子袋（獲得 +50 Seed）', desc: '全技能已臻巔峰！立即將 50 Seed 存入局外錢包。', tag: '資源農裝' }
    ];
    renderChoiceModal(`目前等級 LV.${player.lv}（全技能滿級突破獎勵）｜ 按 1 / 2 選擇`);
    return;
  }
  currentChoices = []; const tempPool = [...pool];
  while (currentChoices.length < 3 && tempPool.length > 0) {
    const totalW = tempPool.reduce((sum, item) => sum + (item.weight || 1), 0);
    let r = Math.random() * totalW, pickedIdx = 0;
    for (let i = 0; i < tempPool.length; i++) { r -= (tempPool[i].weight || 1); if (r <= 0) { pickedIdx = i; break; } }
    currentChoices.push(tempPool[pickedIdx]); tempPool.splice(pickedIdx, 1);
  }
  renderChoiceModal(`目前等級 LV.${player.lv} ｜ 技能欄 ${Object.keys(ownedSkills).length}/${MAX_ACTIVE_SKILLS} 主動・${Object.keys(ownedPassives).length}/${MAX_PASSIVE_SKILLS} 被動 ｜ 按 1 / 2 / 3`);
}
function selectUpgrade(idx) {
  const c = currentChoices[idx]; if (!c) return;
  if (c.kind === 'evolve') {
    const sk = LUCIEN_SKILLS[c.id];
    if (ownedSkills[c.id] && sk) {
      ownedSkills[c.id].evolved = true;
      const hasRes = sk.resonanceSkill && ownedSkills[sk.resonanceSkill];
      showBanner(`🌟 超武覺醒！【${sk.name}】進化為【${sk.evoName}】${hasRes ? '（✨觸發元素共鳴！）' : ''}！`);
    }
  } else if (c.kind === 'skill') {
    ownedSkills[c.id] ? ownedSkills[c.id].lv++ : (ownedSkills[c.id] = { lv: 1, evolved: false });
  } else if (c.kind === 'passive') {
    ownedPassives[c.id] = (ownedPassives[c.id] || 0) + 1;
    if (c.id === 'fastsword') { player.cdMult *= 0.92; player.speedMult += 0.04; }
    if (c.id === 'guard') player.areaMult += 0.10;
    if (c.id === 'haste') player.cdMult *= 0.92;
    if (c.id === 'might') player.dmgMult += 0.08;
    if (c.id === 'cdr') player.cdMult *= 0.94;
    if (c.id === 'area') player.areaMult += 0.10;
    if (c.id === 'crit') player.bonusCritRate += 0.04;
    if (c.id === 'resonance') player.resonanceDmgMult += 0.12;
    if (c.id === 'lucky') player.dropRateMult += 0.20;
    if (c.id === 'expGain') player.expMult += 0.12;
    if (c.id === 'curse') player.curseMult += 0.12;
    if (c.id === 'windBoot') player.speedMult += 0.09;
    if (c.id === 'heal') { player.regen += 1.2; }
  } else if (c.kind === 'seed') {
    if (typeof saveData !== 'undefined') { saveData.seed = (saveData.seed || 0) + 50; writeSave(); }
    showBanner('💰 獲得黃金種子袋！局外錢包 Seed +50！');
  } else {
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.4);
  }
  document.getElementById('levelModal').style.display = 'none'; isPaused = false;
}

function openChest(kind) {
  if (kind === 'silver') {
    const roll = Math.random();
    const rolls = roll < 0.15 ? 3 : (roll < 0.50 ? 2 : 1);
    const activePassives = getActivePassivePool();
    const upgradable = [];
    for (const [k, o] of Object.entries(ownedSkills)) { if (o.lv < (LUCIEN_SKILLS[k]?.maxLv || 8)) upgradable.push({ kind: 'skill', id: k, name: LUCIEN_SKILLS[k].name }); }
    for (const [k, lv] of Object.entries(ownedPassives)) { if (lv < (activePassives[k]?.maxLv || 5)) upgradable.push({ kind: 'passive', id: k, name: activePassives[k].name }); }
    if (upgradable.length === 0) {
      const seedBonus = rolls * 35;
      if (typeof saveData !== 'undefined') { saveData.seed = (saveData.seed || 0) + seedBonus; writeSave(); }
      showBanner(`🎁 白銀寶箱（${rolls}連開）！全技能已滿級，轉換為 Seed +${seedBonus}！`);
      return;
    }
    const gained = [];
    for (let r = 0; r < rolls && upgradable.length > 0; r++) {
      const pickIdx = Math.floor(Math.random() * upgradable.length);
      const t = upgradable[pickIdx];
      if (t.kind === 'skill') { ownedSkills[t.id].lv++; gained.push(`${t.name} LV.${ownedSkills[t.id].lv}`); if (ownedSkills[t.id].lv >= (LUCIEN_SKILLS[t.id]?.maxLv || 8)) upgradable.splice(pickIdx, 1); }
      else { ownedPassives[t.id]++; gained.push(`${t.name} LV.${ownedPassives[t.id]}`); if (t.id === 'fastsword') { player.cdMult *= 0.92; player.speedMult += 0.04; } if (t.id === 'guard') player.areaMult += 0.10; if (t.id === 'haste') player.cdMult *= 0.92; if (t.id === 'might') player.dmgMult += 0.08; if (t.id === 'cdr') player.cdMult *= 0.94; if (t.id === 'area') player.areaMult += 0.10; if (t.id === 'crit') player.bonusCritRate += 0.04; if (t.id === 'resonance') player.resonanceDmgMult += 0.12; if (t.id === 'lucky') player.dropRateMult += 0.20; if (t.id === 'expGain') player.expMult += 0.12; if (t.id === 'curse') player.curseMult += 0.12; if (t.id === 'windBoot') player.speedMult += 0.09; if (t.id === 'heal') player.regen += 1.2; if (ownedPassives[t.id] >= (activePassives[t.id]?.maxLv || 5)) upgradable.splice(pickIdx, 1); }
    }
    showBanner(`🎁 白銀幸運寶箱（${rolls}連強化）！提升：${gained.join('、')}`);
    return;
  }
  const readyList = [];
  for (const [k, st] of Object.entries(ownedSkills)) {
    const sk = LUCIEN_SKILLS[k];
    if (sk && sk.canEvolve && !st.evolved && st.lv >= sk.maxLv && sk.reqPassive && ownedPassives[sk.reqPassive]) readyList.push({ id: k, sk });
  }
  if (readyList.length === 1) {
    const { id, sk } = readyList; ownedSkills[id].evolved = true;
    const hasRes = sk.resonanceSkill && ownedSkills[sk.resonanceSkill];
    showBanner(`🌟 超武覺醒！【${sk.name}】進化為【${sk.evoName}】${hasRes ? '（✨觸發元素共鳴！）' : ''}！`);
    return;
  }
  if (readyList.length > 1) {
    isPaused = true;
    currentChoices = readyList.slice(0, 3).map(({ id, sk }) => ({ kind: 'evolve', id, title: `🌟 覺醒【${sk.evoName}】`, desc: `由【${sk.name} LV.${sk.maxLv}】突破覺醒！<br>${sk.resonanceDesc || sk.desc}`, tag: (sk.resonanceSkill && ownedSkills[sk.resonanceSkill]) ? '✨ 已持有共鳴元素・覺醒即觸發共鳴！' : '🔥 巔峰超武覺醒' }));
    renderChoiceModal('📦 開啟金色超武寶箱！多把武器已達覺醒條件，請選擇要優先進化的超武（按 1 / 2 / 3）');
    return;
  }
  player.hp = Math.min(player.maxHp, player.hp + 50);
  showBanner('📦 開啟金色寶箱！生命回復 +50（本系主動滿級+對應輔助可覺醒超武）');
}

function spawnEnemy() {
  if (bossSpawned) return;
  const ang = Math.random() * Math.PI * 2, dist = Math.max(canvas.width, canvas.height) * 0.62, mins = gameTime / 60;
  const type = mins >= 8 && Math.random() < 0.35 ? 'honey' : (mins >= 4 && Math.random() < 0.4 ? 'red' : (mins >= 2 && Math.random() < 0.45 ? 'green' : 'yellow'));
  const sp = { yellow: { r: 14, hp: 18 + mins * 6.5, spd: 95, c: '#facc15', exp: 1 }, green: { r: 15, hp: 30 + mins * 9, spd: 105, c: '#4ade80', exp: 2 }, red: { r: 18, hp: 58 + mins * 15, spd: 90, c: '#ef4444', exp: 3 }, honey: { r: 17, hp: 45 + mins * 11, spd: 145, c: '#d97706', exp: 3 } }[type];
  enemies.push({ x: player.x + Math.cos(ang) * dist, y: player.y + Math.sin(ang) * dist, radius: sp.r, hp: sp.hp * player.curseMult, maxHp: sp.hp * player.curseMult, speed: sp.spd * (1 + (player.curseMult - 1) * 0.5), color: sp.c, expValue: sp.exp, shockTimer: 0, burnTimer: 0, slowTimer: 0, burnTick: 0, hitFlash: 0 });
}

function spawnEliteBoss(tier) {
  const ang = Math.random() * Math.PI * 2, mins = Math.max(1, gameTime / 60);
  const isFinal = tier === 'final', isMega = tier === 'mega', isElite = tier === 'elite';
  const hpVal = (isFinal ? 5500 : (isMega ? 950 + mins * 180 : 320 + mins * 110)) * player.curseMult;
  enemies.push({
    x: player.x + Math.cos(ang) * 380, y: player.y + Math.sin(ang) * 380,
    radius: isFinal ? 50 : (isMega ? 38 : 28), hp: hpVal, maxHp: hpVal,
    speed: isFinal ? 88 : (isMega ? 80 : 84),
    color: isFinal ? '#9333ea' : (isMega ? '#dc2626' : '#f97316'),
    name: isFinal ? '暗黑魔王' : (isMega ? '狂暴首領' : '精英魔物'),
    expValue: isMega ? 25 : 12, isElite, isMegaBoss: isMega, isFinalBoss: isFinal,
    shockTimer: 0, burnTimer: 0, slowTimer: 0, burnTick: 0, hitFlash: 0
  });
  showBanner(isFinal ? '⚠️ 20分鐘最終決戰！暗黑魔王降臨！' : (isMega ? '👑 狂暴大首領登場！擊敗掉落【金色超武寶箱】！' : '⚔️ 精英魔物出現！擊敗掉落【白銀幸運寶箱】！'));
}
function update(dt) {
  if (isPaused || gameOver) return;
  gameTime += dt; if (bannerTimer > 0 && (bannerTimer -= dt) <= 0) document.getElementById('banner').style.display = 'none';
  if (comboTimer > 0 && (comboTimer -= dt) <= 0) combo = 0;
  if (player.regen > 0) player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);

  const mins = Math.floor(gameTime / 60);
  if (mins >= 20 && !bossSpawned) { bossSpawned = true; spawnEliteBoss('final'); }
  else if (mins > 0 && mins % 5 === 0 && mins !== lastMegaBossMin && mins < 20) { lastMegaBossMin = mins; spawnEliteBoss('mega'); }
  else if (mins > 0 && mins % 2 === 0 && mins % 5 !== 0 && mins !== lastEliteMin && mins < 20) { lastEliteMin = mins; spawnEliteBoss('elite'); }

  let mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let my = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  if (mx || my) { const l = Math.hypot(mx, my); player.x += (mx / l) * player.baseSpeed * player.speedMult * dt; player.y += (my / l) * player.baseSpeed * player.speedMult * dt; player.lastMoveAngle = Math.atan2(my, mx); if (mx) player.flipX = mx > 0 ? 1 : -1; player.walkCycle += dt * 14; } else player.walkCycle = 0;

  if ((spawnTimer -= dt) <= 0) { spawnEnemy(); spawnTimer = Math.max(0.14, (0.85 - (gameTime / 60) * 0.035) / player.curseMult); }
  triggerSkills(dt);

  const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { defReduce: 0, statusDurMult: 1 };
  projectiles = projectiles.filter(p => {
    if (p.type === 'wind' && enemies.length > 0) {
      let target = null, minD = 550;
      for (const e of enemies) { if (!p.hitSet.has(e)) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < minD) { minD = d; target = e; } } }
      if (target) {
        const desired = Math.atan2(target.y - p.y, target.x - p.x), cur = Math.atan2(p.vy, p.vx);
        let diff = desired - cur; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
        const nextAng = cur + Math.max(-(p.evolved ? 12 : 8.5) * dt, Math.min((p.evolved ? 12 : 8.5) * dt, diff)), spd = Math.hypot(p.vx, p.vy);
        p.vx = Math.cos(nextAng) * spd; p.vy = Math.sin(nextAng) * spd;
      }
    }
    p.x += p.vx * dt; p.y += p.vy * dt; if ((p.life -= dt) <= 0) return false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (!p.hitSet.has(e) && Math.hypot(e.x - p.x, e.y - p.y) <= p.radius + e.radius) {
        p.hitSet.add(e);
        if (p.type === 'wind') { e.slowTimer = 2.0 * (cs.statusDurMult || 1); e.x += (player.x - e.x) * 0.08; e.y += (player.y - e.y) * 0.08; }
        if (p.type === 'fire') e.burnTimer = 3.0 * (cs.statusDurMult || 1);
        hitEnemy(j, p.dmg, p.type); if (--p.pierce <= 0) return false;
      }
    }
    return true;
  });

  const msLv = ownedPassives.manaShield || 0;
  if (msLv > 0) {
    player.maxShield = Math.round(player.maxHp * (0.10 + msLv * 0.05));
    const msCd = Math.max(5, 13 - msLv);
    if ((player.shieldTimer -= dt) <= 0) {
      player.shield = player.maxShield;
      player.shieldTimer = msCd;
    }
  }
  if (player.thornsCd > 0) player.thornsCd -= dt;

  const dmgRedMult = 1 - getEffectiveDmgReducePct(cs) / 100;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]; if (e.shockTimer > 0) e.shockTimer -= dt; if (e.slowTimer > 0) e.slowTimer -= dt; if (e.hitFlash > 0) e.hitFlash -= dt; if (e.thornsCd > 0) e.thornsCd -= dt;
    if (e.burnTimer > 0 && (e.burnTick += dt) >= 0.5) { e.burnTimer -= 0.5; e.burnTick = 0; hitEnemy(i, 6 + player.lv * 2, 'burn'); if (!enemies[i]) continue; }
    const ang = Math.atan2(player.y - e.y, player.x - e.x), spd = e.speed * (e.shockTimer > 0 ? 0.15 : (e.slowTimer > 0 ? 0.65 : 1));
    e.x += Math.cos(ang) * spd * dt; e.y += Math.sin(ang) * spd * dt;
    if (Math.hypot(player.x - e.x, player.y - e.y) < player.size * 0.75 + e.radius) {
      const rawHurt = e.isFinalBoss ? 38 : (e.isMegaBoss ? 28 : (e.isElite ? 20 : 12));
      let taken = Math.max(1, rawHurt * dmgRedMult) * dt;
      if (player.shield > 0) {
        const absorbed = Math.min(player.shield, taken);
        player.shield -= absorbed; taken -= absorbed;
      }
      if (taken > 0) player.hp -= taken;
      const thLv = ownedPassives.thorns || 0;
      if (thLv > 0 && (e.thornsCd || 0) <= 0) {
        e.thornsCd = 0.45;
        const defVal = (cs.st && cs.st.DEF) ? cs.st.DEF : 2;
        const thDmg = Math.max(8, defVal * (1.0 + thLv * 0.5));
        const kb = e.isFinalBoss ? 4 : (e.isMegaBoss ? 8 : 26);
        e.x -= Math.cos(ang) * kb; e.y -= Math.sin(ang) * kb;
        hitEnemy(i, thDmg, 'physical');
      }
      if (player.hp <= 0) { endGame(false); return; }
    }
  }

  gems = gems.filter(g => { const d = Math.hypot(player.x - g.x, player.y - g.y); if (d < player.pickupRange) { const a = Math.atan2(player.y - g.y, player.x - g.x); g.x += Math.cos(a) * 420 * dt; g.y += Math.sin(a) * 420 * dt; } if (d < 24) { if ((player.exp += g.val * (player.expMult || 1)) >= player.nextExp) { player.exp -= player.nextExp; player.lv++; player.nextExp = Math.round(player.nextExp * 1.35 + 3); levelUp(); } return false; } return true; });
  chests = chests.filter(c => Math.hypot(player.x - c.x, player.y - c.y) < 36 ? (openChest(c.kind || 'gold'), false) : true);
  lootBags = lootBags.filter(b => Math.hypot(player.x - b.x, player.y - b.y) < 36 ? (runLoot.push(b.item), showBanner(`📦 獲得 [未鑑定] ${b.rarName}裝備袋！（累計 ${runLoot.length} 件）`), false) : true);
  slashes = slashes.filter(s => (s.life -= dt) > 0); lightnings = lightnings.filter(l => (l.life -= dt) > 0); damageTexts = damageTexts.filter(t => { t.y -= 28 * dt; return (t.life -= dt) > 0; });
}
function draw() {
  ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const ox = canvas.width / 2 - player.x, oy = canvas.height / 2 - player.y;
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
  for (let x = ox % 80; x < canvas.width; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  for (let y = oy % 80; y < canvas.height; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  ctx.save(); ctx.translate(ox, oy);
  gems.forEach(g => { ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(g.x, g.y, 5, 0, Math.PI * 2); ctx.fill(); });
  chests.forEach(c => {
    const isSilver = c.kind === 'silver';
    ctx.fillStyle = isSilver ? '#e2e8f0' : '#facc15';
    ctx.fillRect(c.x - 14, c.y - 11, 28, 22);
    ctx.strokeStyle = isSilver ? '#38bdf8' : '#fff'; ctx.lineWidth = 2.5;
    ctx.strokeRect(c.x - 14, c.y - 11, 28, 22);
  });
  lootBags.forEach(b => { ctx.fillStyle = b.color; ctx.fillRect(b.x - 11, b.y - 11, 22, 22); });
  enemies.forEach(e => {
    if (e.isElite || e.isMegaBoss || e.isFinalBoss) {
      ctx.strokeStyle = e.isFinalBoss ? 'rgba(168,85,247,0.55)' : (e.isMegaBoss ? 'rgba(239,68,68,0.45)' : 'rgba(250,204,21,0.45)');
      ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 7, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = e.hitFlash > 0 ? '#fff' : e.color; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = e.shockTimer > 0 ? '#fde047' : (e.burnTimer > 0 ? '#fb923c' : '#0f172a'); ctx.lineWidth = 2.5; ctx.stroke();
    if (e.isElite || e.isMegaBoss || e.isFinalBoss) {
      const bw = e.radius * 2.2, bh = 5, bx = e.x - bw / 2, by = e.y - e.radius - 14;
      ctx.fillStyle = '#0f172a'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = e.isFinalBoss ? '#c084fc' : (e.isMegaBoss ? '#ef4444' : '#facc15');
      ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), bh);
      ctx.fillStyle = '#fef08a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(e.bossName || e.name || '精英魔物', e.x, by - 4); ctx.textAlign = 'left';
    }
  });
  slashes.forEach(s => { ctx.strokeStyle = s.type === 'fireboom' ? 'rgba(251,146,60,0.85)' : 'rgba(226,232,240,0.75)'; ctx.lineWidth = s.evolved ? 7 : 4; ctx.beginPath(); ctx.arc(player.x, player.y, s.range, s.angle - s.arc / 2, s.angle + s.arc / 2); ctx.stroke(); });
  projectiles.forEach(p => { ctx.fillStyle = p.type === 'fire' ? '#f97316' : (p.type === 'wind' ? '#4ade80' : '#38bdf8'); ctx.beginPath(); ctx.arc(p.x, p.y, p.radius || 7, 0, Math.PI * 2); ctx.fill(); });
  lightnings.forEach(l => { ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke(); });
  ctx.save(); ctx.translate(player.x, player.y - Math.abs(Math.sin(player.walkCycle)) * 4);
  ctx.fillStyle = '#3b82f6'; ctx.fillRect(-12, -16, 24, 30); ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(0, -24, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(28, -12); ctx.stroke();
  ctx.restore();
  if (player.shield > 0) {
    ctx.strokeStyle = 'rgba(56,189,248,0.85)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(player.x, player.y - 6, 26, 0, Math.PI * 2); ctx.stroke();
  }
  damageTexts.forEach(t => { ctx.fillStyle = t.color; ctx.font = 'bold 14px sans-serif'; ctx.fillText(t.txt, t.x, t.y); });
  ctx.restore();
  const lvEl = document.getElementById('lvText'); if (lvEl) lvEl.textContent = `LV.${player.lv}`;
  const hpPct = Math.max(0, (player.hp / player.maxHp) * 100), expPct = Math.min(100, (player.exp / player.nextExp) * 100);
  const hpBarEl = document.getElementById('hpBar'), expBarEl = document.getElementById('expBar');
  if (hpBarEl) hpBarEl.style.width = `${hpPct}%`;
  if (expBarEl) expBarEl.style.width = `${expPct}%`;
  const hpNum = document.getElementById('hpNumText'), expNum = document.getElementById('expNumText');
  if (hpNum) hpNum.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
  if (expNum) expNum.textContent = `EXP ${Math.floor(expPct)}%`;
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
  const timeEl = document.getElementById('timeText'), killEl = document.getElementById('killText'), comboEl = document.getElementById('comboText');
  if (timeEl) timeEl.textContent = `${String(Math.floor(gameTime / 60)).padStart(2, '0')}:${String(Math.floor(gameTime % 60)).padStart(2, '0')}`;
  if (killEl) killEl.textContent = kills;
  if (comboEl) comboEl.textContent = combo;
  const skillStateKey = Object.entries(ownedSkills).map(([k, v]) => `${k}:${v.lv}:${v.evolved}`).join('|');
  const skillListEl = document.getElementById('skillList');
  if (skillListEl && skillListEl.dataset.state !== skillStateKey) {
    skillListEl.dataset.state = skillStateKey;
    const skPool = typeof getActiveSkillPool === 'function' ? getActiveSkillPool() : {};
    skillListEl.innerHTML = Object.keys(ownedSkills).map(k => {
      const sk = skPool[k] || { name: k }, st = ownedSkills[k];
      const bg = st.evolved ? 'background:rgba(180,83,9,0.55);border-color:#facc15;color:#fef08a;' : 'background:rgba(30,41,59,0.85);border-color:#475569;color:#e2e8f0;';
      return `<span style="cursor:help;border:1px solid;border-radius:5px;padding:1px 6px;${bg}" onmouseenter="showSkillTooltip(event,'${k}')" onmousemove="moveSkillTooltip(event)" onmouseleave="hideSkillTooltip()">${st.evolved ? (sk.evoName || sk.name) : sk.name} LV.${st.lv}</span>`;
    }).join('');
  }
}

function getSkillTooltipEl() {
  let tip = document.getElementById('skillTooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'skillTooltip';
    tip.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;background:rgba(15,23,42,0.96);border:1px solid #facc15;border-radius:8px;padding:10px 12px;color:#f8fafc;font-size:12px;line-height:1.55;max-width:290px;box-shadow:0 8px 24px rgba(0,0,0,0.65);display:none;';
    document.body.appendChild(tip);
  }
  return tip;
}

function showSkillTooltip(e, kind, id) {
  const tip = getSkillTooltipEl();
  if (kind === 'skill') {
    const sk = LUCIEN_SKILLS[id], st = ownedSkills[id];
    if (!sk || !st) return;
    const rawDmg = Math.round(getSkillRawDmg(id, st.lv, st.evolved));
    const cdFactor = getEffectiveCdMult(Math.pow(0.92, st.lv - 1));
    const realCd = (sk.baseCd * cdFactor * (st.evolved ? 0.6 : 1)).toFixed(2);
    const hasRes = st.evolved && sk.resonanceSkill && ownedSkills[sk.resonanceSkill];
    const resLine = sk.resonanceDesc ? `<div style="margin-top:4px;color:${hasRes ? '#4ade80' : '#94a3b8'};">${hasRes ? '✨【共鳴已啟動】' : '🔒【共鳴條件】'}${sk.resonanceDesc}</div>` : '';
    const noteLine = (sk.lvNotes && st.lv >= 4 && sk.lvNotes) ? `<div style="color:#fde047;margin-top:3px;">${sk.lvNotes}</div>` : '';
    tip.innerHTML = `<div style="font-weight:bold;color:#fde047;font-size:13px;margin-bottom:4px;">${st.evolved ? sk.evoName : sk.name}（LV.${st.lv}/${sk.maxLv || 8}）</div><div>基礎預估傷害：<strong>${rawDmg}</strong> ｜ 實際冷卻：<strong>${realCd} 秒</strong></div><div style="color:#cbd5e1;margin-top:3px;">${sk.desc}</div>${noteLine}${resLine}`;
  } else if (kind === 'passive') {
    const activePassives = getActivePassivePool();
    const p = activePassives[id], lv = ownedPassives[id] || 0;
    if (!p) return;
    tip.innerHTML = `<div style="font-weight:bold;color:#38bdf8;font-size:13px;margin-bottom:4px;">${p.name}（LV.${lv}/${p.maxLv || 5}）</div><div style="color:#e2e8f0;">${p.desc}</div>`;
  } else if (kind === 'stat') {
    const sPct = Math.round((player.superCritMult || 1.5) * 100);
    const statTips = {
      cdr: { title: '⏳ 冷卻縮減（上限 65%）', desc: '縮短技能間隔（跨系統乘算）。<br>• 來源：STAB、裝備、迅捷詠唱。' },
      dmgReduce: { title: '🛡️ 減傷率（上限 70%）', desc: '降低碰撞與首領傷害（乘算）。<br>• 來源：DEF/MR、裝備、萊格藍治之護。' },
      regen: { title: '💚 生命回復', desc: '每秒自動恢復的生命值。<br>• 來源：體質、裝備、治癒之光。' },
      dmg: { title: '⚔️ 傷害倍率', desc: '放大全技能最終基礎傷害。<br>• 來源：裝備、鬥志增幅、超武覺醒。' },
      area: { title: '🌐 範圍擴大', desc: '放大揮砍、投射與爆破範圍。<br>• 來源：裝備、領域擴張、萊格藍治之護。' },
      speed: { title: '👟 移動速度', desc: '提升角色走位閃避移動速度。<br>• 來源：AGI、裝備、疾風之祝福。' },
      critRate: { title: '🎯 暴擊率（上限 100% ＋ 紅爆）', desc: `溢暴轉紅爆 💢（黃爆再乘 ${sPct}%）。<br>• 來源：DEX、裝備、弱點洞察。` },
      critDmg: { title: '💥 暴擊傷害', desc: '黃字暴擊傷害倍率（紅爆在此基礎再乘）。<br>• 來源：基礎 150%、AGI、裝備。' },
      resonance: { title: '🔮 異常共鳴倍率', desc: '放大元素異常與共鳴連鎖傷害。<br>• 來源：INT/MR、裝備、元素共鳴增幅。' },
      proj: { title: '✨ 額外彈幕', desc: '增加法術投射物與落雷數量。<br>• 來源：傳說水晶與裝備詞綴。' },
      drop: { title: '🍀 掉寶倍率', desc: '提升未鑑定裝備袋掉落機率。<br>• 來源：裝備、幸運女神微笑。' },
      exp: { title: '📖 經驗獲取', desc: '放大經驗寶石獲取倍率。<br>• 來源：裝備、賢者之書。' },
      curse: { title: '💀 混沌詛咒（上限 160%）', desc: '提高怪物血量、移速與刷新密度。<br>• 來源：裝備、混沌契約。' }
    };
    const info = statTips[id];
    if (!info) return;
    tip.innerHTML = `<div style="font-weight:bold;color:#fde047;font-size:13px;margin-bottom:4px;">${info.title}</div><div style="color:#e2e8f0;">${info.desc}</div>`;
  }
  tip.style.display = 'block';
  moveSkillTooltip(e);
}

function moveSkillTooltip(e) {
  const tip = document.getElementById('skillTooltip');
  if (!tip || tip.style.display === 'none') return;
  tip.style.left = `${Math.max(10, Math.min(window.innerWidth - tip.offsetWidth - 14, e.clientX + 14))}px`;
  tip.style.top = `${Math.max(10, Math.min(window.innerHeight - tip.offsetHeight - 14, e.clientY + 14))}px`;
}

function hideSkillTooltip() {
  const tip = document.getElementById('skillTooltip');
  if (tip) tip.style.display = 'none';
}


function hideSkillTooltip() {
  const tip = document.getElementById('skillTooltip');
  if (tip) tip.style.display = 'none';
}
// 跨系統乘算減傷率（硬上限 70%，與冷卻縮減共用防崩壞乘算公式）
function getEffectiveDmgReducePct(cs) {
  const defVal = (cs && cs.defReduce) ? cs.defReduce : 0;
  const defFactor = Math.max(0.45, 1 - defVal * 0.008);
  const guardLv = (typeof ownedPassives !== 'undefined' && ownedPassives.guard) ? ownedPassives.guard : 0;
  const guardFactor = Math.pow(0.95, guardLv);
  const barrierLv = (typeof ownedPassives !== 'undefined' && ownedPassives.barrier) ? ownedPassives.barrier : 0;
  const barrierFactor = Math.pow(0.94, barrierLv);
  const eqReduce = (cs && cs.st && cs.st.dmgReduce) ? Math.min(0.4, cs.st.dmgReduce / 100) : 0;
  const rawMult = defFactor * guardFactor * barrierFactor * (1 - eqReduce);
  return Math.min(70, Math.round((1 - rawMult) * 100));
}

function togglePause() {
  hideSkillTooltip();
  const modal = document.getElementById('pauseModal');
  if (!isPaused) {
    isPaused = true;
    const s = getTotalStats();
    const charBase = (typeof getCurrentCharData === 'function' ? getCurrentCharData().baseStats : {}) || {};
    const alloc = (typeof saveData !== 'undefined' && saveData.allocated) ? saveData.allocated : {};
    const baseS = {};
    ['S', 'H', 'I', 'DEF', 'MR', 'DEX', 'AGI'].forEach(k => baseS[k] = (charBase[k] || 0) + (alloc[k] || 0));
    const cs = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : {};
    const activePassives = getActivePassivePool();

    const curCdrPct = Math.round((1 - getEffectiveCdMult(1.0)) * 100);
    const totalDmgReducePct = getEffectiveDmgReducePct(cs);
    const rawCritVal = ((cs.critRate || 0.05) + (player.bonusCritRate || 0)) * 100;
    const totalCritPct = rawCritVal > 100
      ? `100% <span style="color:#ff4d4f;">(紅爆${(rawCritVal - 100).toFixed(0)}%)</span>`
      : `${rawCritVal.toFixed(1)}%`;
    const totalCritDmgPct = Math.round((cs.critDmg || 1.5) * 100);
    const totalAreaPct = Math.round((player.areaMult - 1) * 100);
    const totalRegen = ((cs.regen || 0) + (player.regen || 0)).toFixed(1);
    const resMultPct = Math.round((cs.statusCritMult || 1.5) * (player.resonanceDmgMult || 1) * 100);
    const hpPct = Math.max(0, Math.round((player.hp / player.maxHp) * 100));

    const twStatMeta = [
      { key: 'S', label: 'STAB', color: '#fb923c' }, { key: 'H', label: 'HACK', color: '#f87171' },
      { key: 'I', label: 'INT', color: '#38bdf8' }, { key: 'DEF', label: 'DEF', color: '#4ade80' },
      { key: 'MR', label: 'MR', color: '#c084fc' }, { key: 'DEX', label: 'DEX', color: '#facc15' },
      { key: 'AGI', label: 'AGI', color: '#2dd4bf' }
    ];
    const statGridHtml = twStatMeta.map(m => {
      const tot = s[m.key] || 0, bas = baseS[m.key] || 0, bonus = tot - bas;
      const detailStr = bonus > 0 ? `<span style="font-size:11px;color:#94a3b8;margin-right:6px;">(${bas} <span style="color:#4ade80;">+${bonus}</span>)</span>` : '';
      return `<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(15,23,42,0.75);border:1px solid #334155;border-radius:5px;padding:4px 10px;"><span style="font-size:12px;font-weight:bold;color:${m.color};letter-spacing:0.8px;">${m.label}</span><div>${detailStr}<span style="font-size:13px;font-weight:bold;color:#f8fafc;">${tot}</span></div></div>`;
    }).join('');
    const combatRows = [
      { id: 'cdr', label: '冷卻縮減', val: `${curCdrPct}%`, color: '#38bdf8' },
      { id: 'dmgReduce', label: '減傷率', val: `${totalDmgReducePct}%`, color: '#4ade80' },
      { id: 'regen', label: '生命回復', val: `+${totalRegen}/秒`, color: '#4ade80' },
      { id: 'dmg', label: '傷害倍率', val: `${Math.round(player.dmgMult * 100)}%`, color: '#fde047' },
      { id: 'area', label: '範圍擴大', val: `+${totalAreaPct}%`, color: '#f8fafc' },
      { id: 'speed', label: '移動速度', val: `${Math.round(player.baseSpeed * player.speedMult)}`, color: '#f8fafc' },
      { id: 'critRate', label: '暴擊率', val: totalCritPct, color: rawCritVal > 100 ? '#ff4d4f' : '#f8fafc' },
      { id: 'critDmg', label: '暴擊傷害', val: `${totalCritDmgPct}%`, color: '#f8fafc' },
      { id: 'resonance', label: '異常共鳴', val: `${resMultPct}%`, color: '#4ade80' },
      { id: 'proj', label: '額外彈幕', val: `+${cs.extraProj || 0}`, color: '#f8fafc' },
      { id: 'drop', label: '掉寶倍率', val: `${Math.round(player.dropRateMult * 100)}%`, color: '#f8fafc' },
      { id: 'exp', label: '經驗獲取', val: `${Math.round(player.expMult * 100)}%`, color: '#38bdf8' },
      { id: 'curse', label: '混沌詛咒', val: `${Math.round(player.curseMult * 100)}%`, color: '#f87171' }
    ];
    const combatGridHtml = combatRows.map(r =>
      `<div style="cursor:help;display:flex;justify-content:space-between;align-items:center;background:rgba(15,23,42,0.75);border:1px solid #334155;border-radius:5px;padding:4px 8px;" onmouseenter="showSkillTooltip(event, 'stat', '${r.id}')" onmousemove="moveSkillTooltip(event)" onmouseleave="hideSkillTooltip()"><span style="font-size:11px;color:#94a3b8;">${r.label}</span><strong style="font-size:12px;color:${r.color};">${r.val}</strong></div>`
    ).join('');

    const activeResonances = [];
    for (const [k, st] of Object.entries(ownedSkills)) {
      const sk = LUCIEN_SKILLS[k];
      if (st.evolved && sk && sk.resonanceSkill && ownedSkills[sk.resonanceSkill]) {
        activeResonances.push(`<div style="color:#4ade80;font-size:12px;margin-top:3px;">✨ <strong>${sk.evoName} ＋ ${LUCIEN_SKILLS[sk.resonanceSkill].name}</strong>：${sk.resonanceDesc}</div>`);
      }
    }
    const resSection = activeResonances.length > 0 ? `<div class="status-sec" style="grid-column:1 / -1;border-color:#4ade80;background:rgba(20,83,45,0.25);"><h3>🌟 已啟動元素共鳴</h3>${activeResonances.join('')}</div>` : '';

    const skillIconsHtml = Object.entries(ownedSkills).map(([k, v]) => {
      const sk = LUCIEN_SKILLS[k];
      const border = v.evolved ? '#facc15' : (sk.element === 'fire' ? '#f97316' : (sk.element === 'thunder' ? '#eab308' : (sk.element === 'wind' ? '#34d399' : '#64748b')));
      const bg = v.evolved ? 'linear-gradient(135deg,rgba(180,83,9,0.55),rgba(120,53,15,0.8))' : 'rgba(15,23,42,0.85)';
      return `<div style="cursor:help;border:1.5px solid ${border};background:${bg};border-radius:8px;padding:6px 8px;min-width:86px;text-align:center;" onmouseenter="showSkillTooltip(event, 'skill', '${k}')" onmousemove="moveSkillTooltip(event)" onmouseleave="hideSkillTooltip()"><div style="font-size:12px;font-weight:bold;color:${v.evolved ? '#fef08a' : '#f8fafc'};">${v.evolved ? sk.evoName : sk.name}</div><div style="font-size:10px;color:${v.evolved ? '#fde047' : '#38bdf8'};margin-top:2px;">${v.evolved ? '★超武' : 'LV.' + v.lv + '/' + (sk.maxLv || 8)}</div></div>`;
    }).join('') || '<span style="color:#64748b;font-size:12px;">尚未習得技能</span>';

    const passiveIconsHtml = Object.entries(ownedPassives).map(([k, lv]) => {
      const p = activePassives[k], isMax = lv >= (p?.maxLv || 5);
      return `<div style="cursor:help;border:1px solid ${isMax ? '#38bdf8' : '#475569'};background:rgba(15,23,42,0.85);border-radius:8px;padding:5px 8px;min-width:84px;text-align:center;" onmouseenter="showSkillTooltip(event, 'passive', '${k}')" onmousemove="moveSkillTooltip(event)" onmouseleave="hideSkillTooltip()"><div style="font-size:11px;font-weight:bold;color:#e2e8f0;">${p?.name || k}</div><div style="font-size:10px;color:${isMax ? '#38bdf8' : '#94a3b8'};margin-top:2px;">LV.${lv}/${p?.maxLv || 5}</div></div>`;
    }).join('') || '<span style="color:#64748b;font-size:12px;">尚未習得輔助</span>';

    document.getElementById('pauseContent').innerHTML = `
      <div class="status-sec" style="border-color:#eab308;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
          <div style="position:relative;width:40px;height:40px;border-radius:9px;background:radial-gradient(circle at 30% 30%,#38bdf8,#1e3a8a);border:2px solid #facc15;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <div style="width:17px;height:17px;border-radius:50%;background:#fde047;margin-top:-7px;"></div>
            <div style="position:absolute;bottom:3px;width:21px;height:11px;border-radius:5px 5px 0 0;background:#3b82f6;"></div>
          </div>
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;align-items:center;"><strong style="color:#fef08a;font-size:14px;">${getCurrentCharData().name}</strong><strong style="color:#fde047;font-size:13px;">LV.${player.lv}</strong></div>
            <div style="position:relative;height:9px;background:#450a0a;border:1px solid #7f1d1d;border-radius:5px;overflow:hidden;margin-top:3px;"><div style="height:100%;width:${hpPct}%;background:linear-gradient(90deg,#dc2626,#f87171);"></div><span style="position:absolute;inset:0;font-size:8px;line-height:8px;text-align:center;color:#fff;font-weight:bold;">HP ${Math.ceil(player.hp)} / ${player.maxHp}</span></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:3px;">${statGridHtml}</div>
      </div>
      <div class="status-sec"><h3>⚔️ 即時戰鬥面板總覽 <span style="font-size:11px;color:#94a3b8;font-weight:normal;">(移上查看來源與上限)</span></h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:6px;">${combatGridHtml}</div></div>
      ${resSection}
      <div class="status-sec"><h3>🔥 主動技能徽章（${Object.keys(ownedSkills).length}/${MAX_ACTIVE_SKILLS}，移上查看詳情）</h3><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">${skillIconsHtml}</div></div>
      <div class="status-sec"><h3>🔮 被動強化徽章（${Object.keys(ownedPassives).length}/${MAX_PASSIVE_SKILLS}，移上查看詳情）</h3><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">${passiveIconsHtml}</div></div>`;
    modal.style.display = 'flex';
  } else { modal.style.display = 'none'; isPaused = false; }
}

function endGame(win) {
  gameOver = true;
  const expGain = kills * 2 + Math.floor(gameTime / 5) + (win ? 250 : 0), seedGain = kills * 3 + (win ? 400 : 0);
  if (typeof addOutExpAndSeed === 'function') addOutExpAndSeed(expGain, seedGain);
  let lootMsg = '';
  if (runLoot.length > 0 && typeof saveData !== 'undefined') {
    const kept = runLoot.sort(() => Math.random() - 0.5).slice(0, win ? runLoot.length : Math.max(1, Math.ceil(runLoot.length * 0.5)));
    saveData.bag.push(...kept); writeSave();
    lootMsg = `<br><span style="color:#4ade80;">🎒 帶回戰利品：${kept.length} 件未鑑定裝備（返回大廳即可一鍵鑑定！）</span>`;
  }
  document.getElementById('endTitle').textContent = win ? '🎉 20分鐘天翼覺醒・討伐成功！' : '💀 天翼斷裂';
  document.getElementById('endSummary').innerHTML = `存活時間：${document.getElementById('timeText').textContent} ｜ 總擊殺：${kills} ｜ 最高等級：LV.${player.lv}<br><span style="color:#fde047;">💰 結算獲得：局外經驗 +${expGain} ｜ Seed +${seedGain}（已自動存檔）</span>${lootMsg}`;
  document.getElementById('endModal').style.display = 'flex';
}

renderLobby();
let lastT = performance.now();
function loop(now) { const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; update(dt); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

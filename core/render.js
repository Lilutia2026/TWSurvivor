// ============================================================================
// core/render.js — Canvas 2D 畫面渲染引擎與頂部 HUD 數值同步
// ============================================================================

// [第 1 段：背景網格、領域、掉落物、怪物與射彈渲染（第 1 ～ 80 行）]
function draw() {
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const ox = canvas.width / 2 - player.x, oy = canvas.height / 2 - player.y;
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
    for (let x = ox % 80; x < canvas.width; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = oy % 80; y < canvas.height; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    ctx.save(); ctx.translate(ox, oy);
    zones.forEach(z => {
      ctx.save();
      if (z.kind === 'spiral_hammer') {
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.72)';
        ctx.fillStyle = 'rgba(250, 204, 21, 0.10)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // 繪製旋轉光錘殘影與錘頭
        const ang = z.spinAngle || 0;
        const hx = z.x + Math.cos(ang) * (z.radius * 0.85);
        const hy = z.y + Math.sin(ang) * (z.radius * 0.85);
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
        ctx.fillStyle = '#fef08a'; ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 2.5;
        ctx.fillRect(-10, -20, 20, 40); ctx.strokeRect(-10, -20, 20, 40);
        ctx.restore();
      } else if (z.kind === 'wind_vortex') {
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.80)';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius * 0.62, gameTime * 5, gameTime * 5 + Math.PI * 1.4); ctx.stroke();
      } else if (z.kind === 'fire_sea') {
        ctx.fillStyle = 'rgba(234,88,12,0.28)'; ctx.strokeStyle = 'rgba(251,146,60,0.75)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (z.kind === 'dark_pool') {
        ctx.fillStyle = 'rgba(88,28,135,0.34)'; ctx.strokeStyle = 'rgba(192,132,252,0.80)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (z.kind.startsWith('ice')) {
        const floatY = Math.sin(gameTime * 4) * 3;
        ctx.fillStyle = 'rgba(15,23,42,0.42)';
        ctx.beginPath(); ctx.ellipse(z.x, z.y + 8, z.radius * 0.94, z.radius * 0.78, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(56,189,248,0.24)'; ctx.strokeStyle = 'rgba(186,230,253,0.75)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(z.x, z.y - 5 + floatY, z.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(224,242,254,0.45)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(z.x, z.y - 5 + floatY, z.radius * 0.68, 0, Math.PI * 2); ctx.stroke();
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
      if (e.isDummy) {
        const bw = 64, bh = 6, pct = Math.max(0, Math.min(1, e.hp / (e.maxHp || 1)));
        const by = e.y + e.radius + 22;
        ctx.fillStyle = '#0f172a'; ctx.fillRect(e.x - bw / 2, by, bw, bh);
        ctx.fillStyle = '#22c55e'; ctx.fillRect(e.x - bw / 2, by, bw * pct, bh);
        ctx.fillStyle = '#e2e8f0'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${Math.max(0, Math.ceil(e.hp)).toLocaleString()} / ${e.maxHp.toLocaleString()}`, e.x, by + 16);
        ctx.textAlign = 'left';
      }
    });
    if (typeof drawSandboxDummyOverlays === 'function') drawSandboxDummyOverlays(ctx);
    projectiles.forEach(p => {
      if (p.isDivinePrayer) {
        ctx.save();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.38)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 1.7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        return;
      }
      if (p.isMeteor) {
        ctx.save();
        const grad = ctx.createLinearGradient(p.x, p.y, p.x + 45, p.y - 135);
        grad.addColorStop(0, p.elem === 'ice' ? 'rgba(125,211,252,0.85)' : 'rgba(251,146,60,0.9)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad; ctx.lineWidth = p.radius * 1.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 45, p.y - 135); ctx.stroke();
        ctx.fillStyle = p.elem === 'ice' ? '#0284c7' : '#7c2d12';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = p.elem === 'ice' ? '#bae6fd' : '#fde047';
        ctx.lineWidth = 3.5; ctx.stroke();
        ctx.restore();
        return;
      }
  // [第 2 段：射彈後半段、斬擊閃電特效、玩家紙片人與 HUD 數值同步（接續第 80 行至檔案結尾）]
  if (p.isLob) {
    const shadowScale = Math.max(0.45, 1 - (p.z || 0) / 180);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.radius * 0.85 * shadowScale, p.radius * 0.45 * shadowScale, 0, 0, Math.PI * 2); ctx.fill();
    const airScale = 1 + (p.z || 0) / 240;
    ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.arc(p.x, p.y - (p.z || 0), p.radius * airScale, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2; ctx.stroke();
    return;
  }
  if (p.type === 'lightning') {
    ctx.save();
    ctx.fillStyle = 'rgba(250,204,21,0.32)';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 1.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  if (p.skillId === 'senku') {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    const r = p.radius * 1.35;
    ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(-r * 0.25, 0, r, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.arc(-r * 0.65, 0, r * 0.88, Math.PI * 0.42, -Math.PI * 0.42, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }
  const col = p.type === 'fire' ? '#fb923c' : (p.type === 'ice' ? '#38bdf8' : (p.type === 'holy' ? '#fef08a' : '#4ade80'));
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
});
enemyProjectiles.forEach(ep => {
  ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(ep.x, ep.y, ep.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f3e8ff'; ctx.lineWidth = 2; ctx.stroke();
});

slashes.forEach(s => {
  ctx.save();
  const sx = (s.x !== undefined) ? s.x : player.x, sy = (s.y !== undefined) ? s.y : player.y, ang = s.angle || 0;
  if (s.type === 'aurora_needle') {
    const maxLife = s.maxLife || 0.20;
    ctx.globalAlpha = Math.max(0, Math.min(1, s.life / maxLife));
    ctx.translate(sx, sy);
    ctx.rotate(ang);
    const halfW = s.baseW || 16;
    const len = s.range;
    const grad = ctx.createLinearGradient(0, 0, len, 0);
    if (s.isThunder) {
      grad.addColorStop(0, s.isOverload ? 'rgba(250, 204, 21, 0.35)' : 'rgba(56, 189, 248, 0.30)');
      grad.addColorStop(1, s.isOverload ? 'rgba(254, 240, 138, 0.95)' : 'rgba(224, 242, 254, 0.95)');
    } else {
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
      grad.addColorStop(1, 'rgba(224, 242, 254, 0.92)');
    }
    ctx.fillStyle = grad;
    ctx.strokeStyle = s.isOverload ? '#fef08a' : '#bae6fd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, -halfW);
    ctx.lineTo(len, 0);
    ctx.lineTo(14, halfW);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 65% 處標示尖針 100% 滿額傷害甜區分界線
    const sweetX = len * 0.65;
    const sweetW = halfW * (1 - 0.65);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sweetX, -sweetW);
    ctx.lineTo(sweetX, sweetW);
    ctx.stroke();
  } else if (s.type === 'senku_pillars') {
    const maxLife = s.maxLife || 0.32;
    ctx.globalAlpha = Math.max(0, Math.min(1, s.life / maxLife));
    const arcSpan = s.arc || 0.58;
    ctx.fillStyle = 'rgba(253, 224, 71, 0.14)';
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.arc(sx, sy, s.range, ang - arcSpan / 2, ang + arcSpan / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 沿扇形區域繪製多道金白色垂直衝擊光柱
    const steps = [0.30, 0.55, 0.78, 0.94];
    const sideAngles = [-arcSpan * 0.30, 0, arcSpan * 0.30];
    steps.forEach((stPct, idx) => {
      sideAngles.forEach(aOff => {
        const px = sx + Math.cos(ang + aOff) * (s.range * stPct);
        const py = sy + Math.sin(ang + aOff) * (s.range * stPct);
        const colW = 10 + idx * 4;
        const colH = 55 + idx * 18;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
        ctx.fillRect(px - colW / 2, py - colH, colW, colH);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(px - colW * 0.22, py - colH * 0.92, colW * 0.44, colH * 0.92);
      });
    });
  } else if (s.type === 'renga' || s.type === 'renga_fire') {
    const isFire = s.type === 'renga_fire';
    ctx.globalAlpha = Math.max(0, Math.min(1, s.life / 0.20));
    const arcSpan = s.arc || 1.85;
    ctx.fillStyle = isFire ? 'rgba(249, 115, 22, 0.26)' : 'rgba(148, 163, 184, 0.24)';
    ctx.strokeStyle = isFire ? '#fdba74' : '#f8fafc';
    ctx.lineWidth = isFire ? 4 : 3.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.arc(sx, sy, s.range, ang - arcSpan / 2, ang + arcSpan / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (s.type === 'aurora' || (s.arc && s.arc <= 0.65)) {
    const ex = sx + Math.cos(ang) * s.range, ey = sy + Math.sin(ang) * s.range;
    ctx.strokeStyle = s.evolved ? 'rgba(250,204,21,0.9)' : 'rgba(125,211,252,0.85)';
    ctx.lineWidth = s.evolved ? 12 : 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s.evolved ? 4 : 2.5;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  } else if (s.type === 'holywave') {
    const maxLife = s.maxLife || 0.35;
    const alpha = Math.max(0, Math.min(1, s.life / maxLife));
    const arcSpan = s.arc || (Math.PI * 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(253,224,71,0.16)';
    ctx.strokeStyle = 'rgba(253,224,71,0.92)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (arcSpan < Math.PI * 1.9) {
      ctx.moveTo(sx, sy);
      ctx.arc(sx, sy, s.range, ang - arcSpan / 2, ang + arcSpan / 2);
      ctx.closePath();
    } else {
      ctx.arc(sx, sy, s.range, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
   } else {
    ctx.strokeStyle = s.type === 'fireboom' ? 'rgba(251,146,60,0.85)' : (s.type === 'iceshatter' ? 'rgba(56,189,248,0.95)' : (s.type === 'thunderring' ? 'rgba(192,132,252,0.92)' : (s.type === 'thunderwave' ? 'rgba(250,204,21,0.85)' : 'rgba(226,232,240,0.8)')));
    ctx.lineWidth = (s.type === 'iceshatter' || s.type === 'thunderring') ? 6 : (s.evolved ? 7 : 4);
    ctx.beginPath(); ctx.arc(sx, sy, s.range, ang - s.arc / 2, ang + s.arc / 2); ctx.stroke();
  }
  ctx.restore();
});
lightnings.forEach(l => {
  ctx.save();
  ctx.lineCap = 'round';
  if (l.kind === 'overload') {
    ctx.strokeStyle = 'rgba(56,189,248,0.55)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
  } else if (l.kind === 'purple' || l.kind === 'purple_super') {
    const isSuper = l.kind === 'purple_super';
    ctx.strokeStyle = isSuper ? 'rgba(168,85,247,0.75)' : 'rgba(192,132,252,0.65)';
    ctx.lineWidth = isSuper ? 14 : 10;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    ctx.strokeStyle = '#fef08a'; ctx.lineWidth = isSuper ? 5 : 3.5;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
  } else {
    ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
  }
  ctx.restore();
});

const ch = typeof getCurrentCharData === 'function' ? getCurrentCharData() : { color: '#3b82f6' };
ctx.save(); ctx.translate(player.x, player.y - Math.abs(Math.sin(player.walkCycle)) * 4);
ctx.fillStyle = ch.color || '#3b82f6'; ctx.fillRect(-12, -16, 24, 30);
ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(0, -24, 11, 0, Math.PI * 2); ctx.fill();
ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(10 * player.flipX, 0); ctx.lineTo(28 * player.flipX, -12); ctx.stroke();
ctx.restore();
if (player.shield > 0) { ctx.strokeStyle = 'rgba(56,189,248,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(player.x, player.y - 6, 26, 0, Math.PI * 2); ctx.stroke(); }
damageTexts.forEach(t => { ctx.fillStyle = t.color; ctx.font = `bold ${t.fontSize || 14}px sans-serif`; ctx.fillText(t.txt, t.x, t.y); });
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
document.getElementById('killText').textContent = kills;

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
    const dim = st.disabled ? 'opacity:0.45;filter:grayscale(1);' : '';
    const banBadge = (st.disabled && sk.disableWhenEvo)
      ? `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px;color:#ef4444;text-shadow:0 0 4px #000;pointer-events:none;">🚫</span>`
      : '';
    const isMax = st.lv >= (sk.maxLv || 10);
    const lvLabel = isMax ? 'MAX' : st.lv;
    const lvStyle = isMax ? 'font-size:8px;color:#4ade80;' : 'font-size:9px;color:#fde047;';
    return `<div style="position:relative;width:32px;height:32px;border:1.5px solid ${borderCol};background:${bgCol};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:help;${dim}" onmouseenter="showSkillTooltip(event,'skill','${k}')" onmousemove="moveSkillTooltip(event)" onmouseleave="hideSkillTooltip()">${iconChar}${banBadge}<span style="position:absolute;bottom:-1px;right:1px;${lvStyle}font-weight:bold;text-shadow:0 1px 2px #000;">${lvLabel}</span></div>`;
  }).join('');
}
}

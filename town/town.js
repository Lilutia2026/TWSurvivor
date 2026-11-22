// ============================================================================
// 《TW倖存者》卡雷德自由市場：空間行走與 F 鍵互動分發引擎 (core/town.js) [1/2]
// ============================================================================

const TOWN_STATE = {
    active: false,
    canvas: null,
    ctx: null,
    rafId: null,
    lastTime: 0,
    player: { x: 640, y: 430, speed: 240, flipX: false, walkTime: 0, targetX: null, targetY: null },
    keys: {},
    activeTarget: null,
    bgImg: null,
    bgLoaded: false,
    roomCode: 'CLAD-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    roomMembers: [] // 預留私人房主世界（1~4 人）同步接口
};

// 初始化並進入卡雷德自由市場
function enterTownClad() {
    const townView = document.getElementById('town-clad-view');
    if (!townView) return;

    ['login-select-view', 'stage-select-view', 'lobby'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    townView.style.display = 'flex';
    TOWN_STATE.active = true;
    TOWN_STATE.player.x = TOWN_CLAD_MAP.spawnPoint.x;
    TOWN_STATE.player.y = TOWN_CLAD_MAP.spawnPoint.y;
    TOWN_STATE.player.targetX = null;
    TOWN_STATE.player.targetY = null;

    if (!TOWN_STATE.canvas) {
        TOWN_STATE.canvas = document.getElementById('town-canvas');
        TOWN_STATE.ctx = TOWN_STATE.canvas.getContext('2d');
        bindTownEvents();
    }

    if (!TOWN_STATE.bgImg && TOWN_CLAD_MAP.bgImage) {
        const img = new Image();
        img.onload = () => { TOWN_STATE.bgLoaded = true; };
        img.onerror = () => { TOWN_STATE.bgLoaded = false; };
        img.src = TOWN_CLAD_MAP.bgImage;
        TOWN_STATE.bgImg = img;
    }

    if (typeof updateTownHeaderInfo === 'function') updateTownHeaderInfo();
    if (TOWN_STATE.rafId) cancelAnimationFrame(TOWN_STATE.rafId);
    TOWN_STATE.lastTime = performance.now();
    TOWN_STATE.rafId = requestAnimationFrame(townLoop);
}

// 離開卡雷德市集
function leaveTownClad() {
    TOWN_STATE.active = false;
    if (TOWN_STATE.rafId) {
        cancelAnimationFrame(TOWN_STATE.rafId);
        TOWN_STATE.rafId = null;
    }
    const townView = document.getElementById('town-clad-view');
    if (townView) townView.style.display = 'none';
}

function isAnyTownModalOpen() {
    const modal = document.getElementById('npc-modal-overlay');
    return modal && modal.style.display === 'flex';
}

// 分發呼叫對應的獨立 NPC 功能檔案或傳送門新頁面
function triggerTownInteractable(target) {
    if (!target || !target.handler) return;
    if (typeof window[target.handler] === 'function') {
        window[target.handler](target);
    } else {
        console.warn(`[Town] 尚未掛載互動模組: ${target.handler}`);
    }
}
// ============================================================================
// 《TW倖存者》卡雷德自由市場 (core/town.js) [2/2] - 銜接於 triggerTownInteractable 之後
// ============================================================================

function bindTownEvents() {
    window.addEventListener('keydown', (e) => {
        if (!TOWN_STATE.active || isAnyTownModalOpen()) return;
        const key = e.key.toLowerCase();
        TOWN_STATE.keys[key] = true;
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            TOWN_STATE.player.targetX = null;
            TOWN_STATE.player.targetY = null;
        }
        if (key === 'f' && TOWN_STATE.activeTarget) {
            e.preventDefault();
            triggerTownInteractable(TOWN_STATE.activeTarget);
        }
    });

    window.addEventListener('keyup', (e) => { TOWN_STATE.keys[e.key.toLowerCase()] = false; });

    TOWN_STATE.canvas.addEventListener('click', (e) => {
        if (!TOWN_STATE.active || isAnyTownModalOpen()) return;
        const rect = TOWN_STATE.canvas.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) * (TOWN_CLAD_MAP.width / rect.width);
        const clickY = (e.clientY - rect.top) * (TOWN_CLAD_MAP.height / rect.height);

        for (const item of TOWN_CLAD_MAP.interactables) {
            if (Math.hypot(clickX - item.x, clickY - item.y) <= 45 &&
                Math.hypot(TOWN_STATE.player.x - item.x, TOWN_STATE.player.y - item.y) <= item.radius) {
                triggerTownInteractable(item);
                return;
            }
        }
        const b = TOWN_CLAD_MAP.walkBounds;
        TOWN_STATE.player.targetX = Math.max(b.minX, Math.min(b.maxX, clickX));
        TOWN_STATE.player.targetY = Math.max(b.minY, Math.min(b.maxY, clickY));
    });
}

function townLoop(now) {
    if (!TOWN_STATE.active) return;
    const dt = Math.min(0.05, (now - TOWN_STATE.lastTime) / 1000);
    TOWN_STATE.lastTime = now;
    updateTownPlayer(dt);
    drawTownScene();
    TOWN_STATE.rafId = requestAnimationFrame(townLoop);
}

function updateTownPlayer(dt) {
    if (isAnyTownModalOpen()) return;
    const p = TOWN_STATE.player, k = TOWN_STATE.keys;
    let dx = (k['d'] || k['arrowright'] ? 1 : 0) - (k['a'] || k['arrowleft'] ? 1 : 0);
    let dy = (k['s'] || k['arrowdown'] ? 1 : 0) - (k['w'] || k['arrowup'] ? 1 : 0);

    if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        p.x += (dx / len) * p.speed * dt;
        p.y += (dy / len) * p.speed * dt;
        if (dx !== 0) p.flipX = dx < 0;
        p.walkTime += dt * 10;
    } else if (p.targetX !== null && p.targetY !== null) {
        const dist = Math.hypot(p.targetX - p.x, p.targetY - p.y);
        if (dist > 6) {
            const vx = (p.targetX - p.x) / dist;
            p.x += vx * p.speed * dt;
            p.y += ((p.targetY - p.y) / dist) * p.speed * dt;
            if (Math.abs(vx) > 0.05) p.flipX = vx < 0;
            p.walkTime += dt * 10;
        } else { p.targetX = p.targetY = null; p.walkTime = 0; }
    } else { p.walkTime = 0; }

    const b = TOWN_CLAD_MAP.walkBounds;
    p.x = Math.max(b.minX, Math.min(b.maxX, p.x));
    p.y = Math.max(b.minY, Math.min(b.maxY, p.y));

    let nearest = null, minDist = Infinity;
    for (const item of TOWN_CLAD_MAP.interactables) {
        const d = Math.hypot(p.x - item.x, p.y - item.y);
        if (d <= item.radius && d < minDist) { minDist = d; nearest = item; }
    }
    TOWN_STATE.activeTarget = nearest;
}

function drawTownScene() {
    const ctx = TOWN_STATE.ctx, W = TOWN_CLAD_MAP.width, H = TOWN_CLAD_MAP.height;
    ctx.clearRect(0, 0, W, H);
    if (TOWN_STATE.bgLoaded && TOWN_STATE.bgImg) ctx.drawImage(TOWN_STATE.bgImg, 0, 0, W, H);
    else {
        ctx.fillStyle = '#2d3748'; ctx.fillRect(0, 0, W, H);
        const b = TOWN_CLAD_MAP.walkBounds;
        ctx.fillStyle = '#d6b87c'; ctx.beginPath();
        ctx.roundRect(b.minX - 30, b.minY - 30, (b.maxX - b.minX) + 60, (b.maxY - b.minY) + 60, 28);
        ctx.fill(); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 6; ctx.stroke();
        ctx.fillStyle = 'rgba(120,53,15,0.28)'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('卡雷德自由市場（WASD/點擊移動 ｜ 靠近 NPC 或傳送門按 [F] 互動）', W / 2, H / 2);
    }

    const list = TOWN_CLAD_MAP.interactables.map(d => ({ kind: 'item', y: d.y, data: d }));
    list.push({ kind: 'player', y: TOWN_STATE.player.y, data: TOWN_STATE.player });
    list.sort((a, b) => a.y - b.y);

    for (const ent of list) {
        if (ent.kind === 'player') {
            const p = ent.data, bob = Math.abs(Math.sin(p.walkTime)) * 4;
            ctx.fillStyle = '#3b82f6'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(p.x - 15, p.y - 44 - bob, 30, 44, 8); ctx.fill(); ctx.stroke();
            ctx.textAlign = 'center'; ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#93c5fd';
            ctx.fillText((typeof CHARACTERS !== 'undefined' && saveData?.selectedChar && CHARACTERS[saveData.selectedChar]?.name) || '冒險者', p.x, p.y - 54 - bob);
        } else {
            const it = ent.data, hi = TOWN_STATE.activeTarget?.id === it.id;
            ctx.beginPath(); ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);
            ctx.fillStyle = hi ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.06)'; ctx.fill();
            ctx.strokeStyle = hi ? '#facc15' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = hi ? 2.5 : 1; ctx.stroke();
            ctx.fillStyle = it.color; ctx.beginPath(); ctx.roundRect(it.x - 16, it.y - 44, 32, 46, 8); ctx.fill();
            ctx.textAlign = 'center'; ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#fef08a';
            ctx.fillText(it.subtitle, it.x, it.y - 68);
            ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(it.name, it.x, it.y - 52);
            if (hi) {
                ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.roundRect(it.x - 52, it.y - 102, 104, 22, 6); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#facc15'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('[F] 互動開啟', it.x, it.y - 87);
            }
        }
    }
}

function updateTownHeaderInfo() {
    const el = document.getElementById('town-header-status');
    if (!el || typeof saveData === 'undefined') return;
    const cName = (typeof CHARACTERS !== 'undefined' && CHARACTERS[saveData.selectedChar]?.name) || '冒險者';
    const mailLen = Array.isArray(saveData.mailbox) ? saveData.mailbox.length : 0;
    el.innerHTML = `<span>👤 <b>${cName}</b> (LV.${saveData.lv || 1})</span>` +
        `<span style="margin-left:14px;">💰 Seed：<b>${(saveData.gold || 0).toLocaleString()}</b></span>` +
        `<span style="margin-left:14px;">🏠 房間碼：<b>${TOWN_STATE.roomCode}</b></span>` +
        `<button onclick="openTownMailbox()" style="margin-left:14px;padding:4px 10px;border-radius:6px;background:#1e293b;color:#facc15;border:1px solid #facc15;cursor:pointer;">📬 信箱 (${mailLen})</button>` +
        `<button onclick="logoutToCharacterSelect()" style="margin-left:10px;padding:4px 10px;border-radius:6px;background:#334155;color:#e2e8f0;border:1px solid #64748b;cursor:pointer;">🚪 切換角色</button>`;
}

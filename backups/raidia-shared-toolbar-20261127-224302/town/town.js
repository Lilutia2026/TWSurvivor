// ============================================================================
// 《TW倖存者》雷蒂亞村莊的移動與互動
// ============================================================================

const TOWN_STATE = {
    active: false,
    canvas: null,
    ctx: null,
    rafId: null,
    lastTime: 0,
    player: { x: 996, y: 586, speed: 240, flipX: false, walkTime: 0, targetX: null, targetY: null },
    camX: 356,
    camY: 176,
    zoom: 1,
    keys: {},
    isMouseDown: false,
    activeTarget: null,
    bgImg: null,
    bgLoaded: false,
    bgLoadFailed: false,
    npcImages: new Map(),
    mobileToolbarCollapsed: false,
    localPlayerId: null,
    roomCode: 'RAID-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    roomMembers: [], // 預留私人房主世界（1~4 人）同步接口
    isNight: null,   // null = 自動同步真實時間（18:00~05:59 為星夜）；true/false = 手動切換
    hasSpawned: false
};

// 取得目前雷蒂亞是否為星夜狀態
function getRaidiaNightMode() {
    if (typeof TOWN_STATE.isNight === 'boolean') return TOWN_STATE.isNight;
    const h = new Date().getHours();
    return h >= 18 || h < 6;
}

// 切換雷蒂亞白晝／星夜光影與對應 BGM（彩蛋互動）
function toggleTownDayNight() {
    TOWN_STATE.isNight = !getRaidiaNightMode();
    applyRaidiaBgm();
    if (typeof updateTownHeaderInfo === 'function') updateTownHeaderInfo();
}

// 依目前日夜狀態播放雷蒂亞專屬配樂
function applyRaidiaBgm() {
    if (typeof AudioManager === 'undefined') return;
    const night = getRaidiaNightMode();
    AudioManager.play(night ? 'raidia_night' : 'raidia_day');
}

// 初始化並進入樹上精靈村・雷蒂亞（keepPos = true 時保留按 F 互動當下座標）
function enterTownClad(keepPos = false) {
    const townView = document.getElementById('town-clad-view');
    if (!townView) return;

    ['login-select-view', 'stage-select-view'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    townView.style.display = 'flex';
    TOWN_STATE.active = true;
    if (!TOWN_STATE.canvas) {
        TOWN_STATE.canvas = document.getElementById('town-canvas');
        TOWN_STATE.ctx = TOWN_STATE.canvas.getContext('2d');
        bindTownEvents();
    }

       // 1. 滿版無邊框容器設定
       const wrap = TOWN_STATE.canvas.parentElement;
       if (wrap) {
           wrap.style.flex = '1';
           wrap.style.minHeight = '0';
           wrap.style.width = '100%';
           wrap.style.overflow = 'hidden';
       }
       TOWN_STATE.canvas.style.width = '100%';
       TOWN_STATE.canvas.style.height = '100%';
       TOWN_STATE.canvas.style.maxWidth = 'none';
       TOWN_STATE.canvas.style.maxHeight = 'none';
       TOWN_STATE.canvas.style.border = 'none';
       TOWN_STATE.canvas.style.borderRadius = '0';
   
       // 2. 動態貼合視窗實際像素 ＋ 維持原版 640px 視野距離感
       syncTownViewportSize();
       if (!TOWN_STATE._resizeBound) {
           TOWN_STATE._resizeBound = true;
           window.addEventListener('resize', () => { if (TOWN_STATE.active) syncTownViewportSize(); });
       }
   
       if (!keepPos || !TOWN_STATE.hasSpawned) {
           TOWN_STATE.player.x = TOWN_CLAD_MAP.spawnPoint.x;
           TOWN_STATE.player.y = TOWN_CLAD_MAP.spawnPoint.y;
           TOWN_STATE.hasSpawned = true;
           const visW = TOWN_STATE.canvas.width / TOWN_STATE.zoom;
           const visH = TOWN_STATE.canvas.height / TOWN_STATE.zoom;
           TOWN_STATE.camX = Math.max(0, Math.min(TOWN_CLAD_MAP.width - visW, TOWN_STATE.player.x - visW / 2));
           TOWN_STATE.camY = Math.max(0, Math.min(TOWN_CLAD_MAP.height - visH, TOWN_STATE.player.y - visH / 2));
       }
   
    TOWN_STATE.player.targetX = null;
    TOWN_STATE.player.targetY = null; 
    TOWN_STATE.player.walkTime = 0;
    TOWN_STATE.player.spriteAnimation = {};
    TOWN_STATE.activeTarget = null;
    MobileControls.setTownTarget(null);

    if (!TOWN_STATE.bgImg && TOWN_CLAD_MAP.bgImage) {
        const img = new Image();
        img.onload = () => { TOWN_STATE.bgLoaded = true; };
        img.onerror = () => { TOWN_STATE.bgLoadFailed = true; };
        img.src = TOWN_CLAD_MAP.bgImage;
        TOWN_STATE.bgImg = img;
    }
    for (const item of TOWN_CLAD_MAP.interactables) {
        const src = item.sprite?.src;
        if (!src || TOWN_STATE.npcImages.has(src)) continue;
        const image = new Image();
        image.src = src;
        TOWN_STATE.npcImages.set(src, image);
    }

    applyRaidiaBgm();
    if (typeof updateTownHeaderInfo === 'function') updateTownHeaderInfo();
    if (TOWN_STATE.rafId) cancelAnimationFrame(TOWN_STATE.rafId);
    TOWN_STATE.lastTime = performance.now();
    TOWN_STATE.rafId = requestAnimationFrame(townLoop);
}

// 離開雷蒂亞村莊
function leaveTownClad() {
    TOWN_STATE.active = false;
    MobileControls.clear(true);
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

function getTownSpriteBounds(item) {
    if (!item.sprite) return null;
    const { src, scale, anchorX } = item.sprite;
    const image = TOWN_STATE.npcImages.get(src);
    if (!image?.complete || !image.naturalWidth) return null;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    return { image, x: item.x - (anchorX ?? image.naturalWidth / 2) * scale, y: item.y - height, width, height };
}
// ============================================================================
// 雷蒂亞畫布與操作
// ============================================================================
function syncTownViewportSize() {
    if (!TOWN_STATE.canvas) return;
    const header = document.getElementById('town-header-status')?.parentElement;
    if (header) header.style.flexShrink = '0';
    const rect = TOWN_STATE.canvas.getBoundingClientRect();
    const w = Math.round(rect.width) || window.innerWidth;
    const h = Math.round(rect.height) || (window.innerHeight - 52);
    TOWN_STATE.canvas.width = w;
    TOWN_STATE.canvas.height = h;
    // 手機橫向保留廣場上下視野，讓櫃台和傳送門能同時進入畫面。
    TOWN_STATE.zoom = MobileControls.enabled ? Math.max(0.55, h / 550) : Math.max(1, h / 650);
}

function bindTownEvents() {
    window.addEventListener('keydown', (e) => {
        if (!TOWN_STATE.active || MobileControls.portrait) return;
        const key = e.key.toLowerCase();

        // ESC 預設關閉所有市集對話視窗
        if (key === 'escape') {
            if (isAnyTownModalOpen() && typeof closeNpcModalShell === 'function') {
                e.preventDefault();
                closeNpcModalShell();
            }
            return;
        }

        // 快捷鍵 I（背包）、C（素質配點）、P（組隊與世界成員列表）
        if (key === 'i') { e.preventDefault(); toggleTownShortcutModal('bag'); return; }
        if (key === 'c') { e.preventDefault(); toggleTownShortcutModal('stats'); return; }
        if (key === 'p') { e.preventDefault(); toggleTownShortcutModal('party'); return; }

        if (isAnyTownModalOpen()) return;
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

    const recordTownMousePos = (e) => {
        const rect = TOWN_STATE.canvas.getBoundingClientRect();
        TOWN_STATE.mouseScreenX = e.clientX - rect.left;
        TOWN_STATE.mouseScreenY = e.clientY - rect.top;
        const z = TOWN_STATE.zoom || 1;
        const mx = TOWN_STATE.mouseScreenX / z + TOWN_STATE.camX;
        const my = TOWN_STATE.mouseScreenY / z + TOWN_STATE.camY;
        const b = TOWN_CLAD_MAP.walkBounds;
        TOWN_STATE.player.targetX = Math.max(b.minX, Math.min(b.maxX, mx));
        TOWN_STATE.player.targetY = Math.max(b.minY, Math.min(b.maxY, my));
        return { mx, my };
    };

    TOWN_STATE.canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || e.sourceCapabilities?.firesTouchEvents || !TOWN_STATE.active || MobileControls.portrait || isAnyTownModalOpen()) return;
        e.preventDefault();
        const { mx, my } = recordTownMousePos(e);
        for (const item of TOWN_CLAD_MAP.interactables) {
            if (Math.hypot(TOWN_STATE.player.x - item.x, TOWN_STATE.player.y - item.y) > item.radius) continue;
            const sprite = getTownSpriteBounds(item);
            const clickedSprite = sprite && mx >= sprite.x && mx <= sprite.x + sprite.width &&
                my >= sprite.y && my <= sprite.y + sprite.height;
            if (clickedSprite || Math.hypot(mx - item.x, my - item.y) <= 45) {
                TOWN_STATE.isMouseDown = false;
                TOWN_STATE.player.targetX = null;
                TOWN_STATE.player.targetY = null;
                triggerTownInteractable(item);
                return;
            }
        }
        TOWN_STATE.isMouseDown = true;
    });

    window.addEventListener('mousemove', (e) => {
        if (!TOWN_STATE.isMouseDown) return;
        if ((e.buttons & 1) === 0 || !TOWN_STATE.active || isAnyTownModalOpen()) {
            TOWN_STATE.isMouseDown = false;
            return;
        }
        recordTownMousePos(e);
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) TOWN_STATE.isMouseDown = false;
    });

    window.addEventListener('blur', () => { TOWN_STATE.isMouseDown = false; });
}

function townLoop(now) {
    if (!TOWN_STATE.active) return;
    const dt = Math.min(0.05, (now - TOWN_STATE.lastTime) / 1000);
    TOWN_STATE.lastTime = now;
    if (TOWN_STATE.bgLoaded && !MobileControls.portrait) updateTownPlayer(dt);
    drawTownScene();
    TOWN_STATE.rafId = requestAnimationFrame(townLoop);
}

function updateTownPlayer(dt) {
    if (isAnyTownModalOpen()) return;
    const p = TOWN_STATE.player, k = TOWN_STATE.keys;
    let dx = (k['d'] || k['arrowright'] ? 1 : 0) - (k['a'] || k['arrowleft'] ? 1 : 0);
    let dy = (k['s'] || k['arrowdown'] ? 1 : 0) - (k['w'] || k['arrowup'] ? 1 : 0);
    const touch = MobileControls.movement;
    if (touch.active) {
        dx = touch.x; dy = touch.y;
        TOWN_STATE.isMouseDown = false;
        p.targetX = p.targetY = null;
    }

    let nextX = p.x, nextY = p.y;
    p.vx = 0; p.vy = 0;
    if (TOWN_STATE.isMouseDown && TOWN_STATE.mouseScreenX !== undefined) {
        const z = TOWN_STATE.zoom || 1;
        const b = TOWN_CLAD_MAP.walkBounds;
        p.targetX = Math.max(b.minX, Math.min(b.maxX, TOWN_STATE.mouseScreenX / z + TOWN_STATE.camX));
        p.targetY = Math.max(b.minY, Math.min(b.maxY, TOWN_STATE.mouseScreenY / z + TOWN_STATE.camY));
    }
    if (dx !== 0 || dy !== 0) {
        TOWN_STATE.isMouseDown = false;
        const len = touch.active ? 1 : Math.hypot(dx, dy);
        p.vx = dx / len; p.vy = dy / len;
        nextX += p.vx * p.speed * dt;
        nextY += p.vy * p.speed * dt;
        if (dx !== 0) p.flipX = dx < 0;
        p.walkTime += dt * 10;
    } else if (p.targetX !== null && p.targetY !== null) {
        const dist = Math.hypot(p.targetX - p.x, p.targetY - p.y);
        if (dist > 6) {
            p.vx = (p.targetX - p.x) / dist;
            p.vy = (p.targetY - p.y) / dist;
            nextX += p.vx * p.speed * dt;
            nextY += p.vy * p.speed * dt;
            if (Math.abs(p.vx) > 0.05) p.flipX = p.vx < 0;
            p.walkTime += dt * 10;
        } else {
            if (!TOWN_STATE.isMouseDown) { p.targetX = p.targetY = null; }
            p.walkTime = 0;
        }
    } else { p.walkTime = 0; }

           // 樹上精靈村・雷蒂亞 15 頂點多邊形木棧道碰撞 ＋ 中央雕像圓形障礙判定
    const isPointInRaidiaPoly = (px, py) => {
        const poly = TOWN_CLAD_MAP.walkablePolygon;
        if (!Array.isArray(poly) || poly.length < 3) return true;
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].x, yi = poly[i].y;
            const xj = poly[j].x, yj = poly[j].y;
            const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi + 0.00001) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    const resolveRaidiaCollision = (nx, ny) => {
        let fx = p.x, fy = p.y;
        // 分軸滑動檢測：沿木棧道懸崖邊緣移動時可平滑滑行不卡死
        if (isPointInRaidiaPoly(nx, fy)) fx = nx;
        if (isPointInRaidiaPoly(fx, ny)) fy = ny;

        // 中央精靈雕像圓形碰撞推開
        if (Array.isArray(TOWN_CLAD_MAP.obstacles)) {
            for (const ob of TOWN_CLAD_MAP.obstacles) {
                const dist = Math.hypot(fx - ob.x, fy - ob.y);
                if (dist < ob.radius && dist > 0.001) {
                    const pushX = ob.x + ((fx - ob.x) / dist) * ob.radius;
                    const pushY = ob.y + ((fy - ob.y) / dist) * ob.radius;
                    if (isPointInRaidiaPoly(pushX, pushY)) { fx = pushX; fy = pushY; }
                }
            }
        }
        return { x: fx, y: fy };
    };

    const resolvedPos = resolveRaidiaCollision(nextX, nextY);
    if (isPointInRaidiaPoly(resolvedPos.x, resolvedPos.y)) {
        p.x = resolvedPos.x;
        p.y = resolvedPos.y;
    } else {
        // 萬一因視窗卡頓或誤點出界，自動拉回最近的安全出生點
        p.x = TOWN_CLAD_MAP.spawnPoint.x;
        p.y = TOWN_CLAD_MAP.spawnPoint.y;
        p.targetX = null;
        p.targetY = null;
    }

    // 原版平滑鏡頭跟隨角色（含縮放倍率換算 ＋ 地圖四邊界夾緊）
    const z = TOWN_STATE.zoom || 1;
    const viewW = (TOWN_STATE.canvas ? TOWN_STATE.canvas.width : 960) / z;
    const viewH = (TOWN_STATE.canvas ? TOWN_STATE.canvas.height : 640) / z;
    const maxCamX = Math.max(0, TOWN_CLAD_MAP.width - viewW);
    const maxCamY = Math.max(0, TOWN_CLAD_MAP.height - viewH);
    const targetCamX = Math.max(0, Math.min(maxCamX, p.x - viewW / 2));
    const targetCamY = Math.max(0, Math.min(maxCamY, p.y - viewH / 2));
    TOWN_STATE.camX += (targetCamX - TOWN_STATE.camX) * Math.min(1, dt * 10);
    TOWN_STATE.camY += (targetCamY - TOWN_STATE.camY) * Math.min(1, dt * 10);

    let nearest = null, minDist = Infinity;
    for (const item of TOWN_CLAD_MAP.interactables) {
        const d = Math.hypot(p.x - item.x, p.y - item.y);
        if (d <= item.radius && d < minDist) { minDist = d; nearest = item; }
    }
    TOWN_STATE.activeTarget = nearest;
    if (MobileControls.enabled) MobileControls.setTownTarget(nearest);
}

function drawTownScene() {
    const ctx = TOWN_STATE.ctx, W = TOWN_CLAD_MAP.width, H = TOWN_CLAD_MAP.height;
    const viewW = TOWN_STATE.canvas.width, viewH = TOWN_STATE.canvas.height;
    const z = TOWN_STATE.zoom || 1;
    const isNight = getRaidiaNightMode();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, viewW, viewH);
    if (!TOWN_STATE.bgLoaded) {
        ctx.save();
        ctx.fillStyle = '#0b1120';
        ctx.fillRect(0, 0, viewW, viewH);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(TOWN_STATE.bgLoadFailed ? '雷蒂亞地圖載入失敗' : '雷蒂亞地圖載入中…', viewW / 2, viewH / 2);
        ctx.restore();
        return;
    }
    ctx.save();
    ctx.scale(z, z);
    ctx.translate(-TOWN_STATE.camX, -TOWN_STATE.camY);

    ctx.drawImage(TOWN_STATE.bgImg, 0, 0, W, H);

    const list = TOWN_CLAD_MAP.interactables.map(d => ({ kind: 'item', y: d.y, data: d }));
    list.push({ kind: 'player', y: TOWN_STATE.player.y, data: TOWN_STATE.player });
    list.sort((a, b) => a.y - b.y);

    for (const ent of list) {
        if (ent.kind === 'player') {
            const p = ent.data, bob = Math.abs(Math.sin(p.walkTime)) * 4;
            const charId = saveData?.charId || 'lucien';
            const cObj = (typeof CHARACTERS !== 'undefined') ? CHARACTERS[charId] : null;
            const charColor = (cObj && cObj.color) ? cObj.color : '#3b82f6';
            const isMoving = p.walkTime > 0;

            if (typeof SpriteAnimManager !== 'undefined') {
                p.dirInfo = SpriteAnimManager.resolveDir8(isMoving ? p.vx : 0, isMoving ? p.vy : 0, p.dirInfo?.dir8 || 'down');
            }
            const drewSprite = (typeof SpriteAnimManager !== 'undefined') &&
                SpriteAnimManager.drawCharacter(ctx, charId, p.x, p.y, {
                    isMoving, dirInfo: p.dirInfo, animationState: p.spriteAnimation, scale: 0.92
                });

            if (!drewSprite) {
                ctx.fillStyle = charColor; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.roundRect(p.x - 15, p.y - 44 - bob, 30, 44, 8); ctx.fill(); ctx.stroke();
            }
            const nameOffsetY = drewSprite ? 82 : (54 + bob);
            ctx.textAlign = 'center'; ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = charColor;
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)'; ctx.lineWidth = 3;
            const pName = saveData?.charName || (cObj && cObj.name) || '冒險者';
            ctx.strokeText(pName, p.x, p.y - nameOffsetY);
            ctx.fillText(pName, p.x, p.y - nameOffsetY);
        } else {
            const it = ent.data, hi = TOWN_STATE.activeTarget?.id === it.id;
            const sprite = getTownSpriteBounds(it);
            if (sprite || MobileControls.enabled) {
                drawTownMapMarker(ctx, it, hi, sprite);
                continue;
            }
            ctx.beginPath(); ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);
            ctx.fillStyle = hi ? 'rgba(250,204,21,0.22)' : 'rgba(255,255,255,0.06)'; ctx.fill();
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

    // 5. 【星夜光影與暖色精靈光暈】讀取 TOWN_CLAD_MAP.lanternCoords 渲染 1600×1200 精靈燈籠暖光
    if (isNight) {
        ctx.save();
        ctx.fillStyle = 'rgba(8, 15, 38, 0.48)';
        ctx.fillRect(0, 0, W, H);

        ctx.globalCompositeOperation = 'lighter';
        const lanterns = Array.isArray(TOWN_CLAD_MAP.lanternCoords) ? TOWN_CLAD_MAP.lanternCoords : [];
        const lights = [
            { x: TOWN_STATE.player.x, y: TOWN_STATE.player.y - 20, r: 145, c: 'rgba(253, 224, 71, 0.22)' },
            ...lanterns.flatMap(lt => [
                { x: lt.x, y: lt.y, r: lt.radius || 130, c: 'rgba(251, 191, 36, 0.36)' },
                { x: lt.x, y: lt.y, r: Math.round((lt.radius || 130) * 0.38), c: 'rgba(254, 249, 195, 0.50)' }
            ]),
            ...TOWN_CLAD_MAP.interactables.map(it => ({
                x: it.x, y: it.y - 20,
                r: it.type === 'portal' ? 165 : 120,
                c: it.type === 'portal' ? 'rgba(56, 189, 248, 0.26)' : 'rgba(253, 224, 71, 0.16)'
            }))
        ];
        for (const lt of lights) {
            const grad = ctx.createRadialGradient(lt.x, lt.y, 8, lt.x, lt.y, lt.r);
            grad.addColorStop(0, lt.c);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(lt.x, lt.y, lt.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
    ctx.restore();
}

function drawTownMapMarker(ctx, item, nearby, sprite) {
    const { x, y } = item;
    ctx.save();
    ctx.strokeStyle = nearby ? '#ffe29c' : '#a99063';
    ctx.lineWidth = nearby ? 2 : 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (sprite) {
        ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.width, sprite.height);
        if (!MobileControls.enabled) {
            ctx.font = 'bold 12px sans-serif';
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#20271e';
            ctx.strokeText(item.subtitle, x, sprite.y - 34);
            ctx.fillStyle = '#fef08a';
            ctx.fillText(item.subtitle, x, sprite.y - 34);
            ctx.strokeStyle = nearby ? '#ffe29c' : '#a99063';
            ctx.lineWidth = nearby ? 2 : 1;
        }
    } else {
        ctx.beginPath();
        ctx.ellipse(x, y, 22, 9, 0, 0, Math.PI * 2);
        ctx.fillStyle = nearby ? '#efc6787a' : '#20271eb0';
        ctx.fill();
        ctx.stroke();
        ctx.font = '23px sans-serif';
        ctx.fillStyle = item.color;
        ctx.fillText(item.subtitle.split(' ')[0], x, y - 21);
    }
    const name = sprite && nearby && !MobileControls.enabled ? `[F] ${item.name}` : item.name;
    const labelY = sprite ? sprite.y - 14 : y - 43;
    ctx.font = 'bold 13px sans-serif';
    const width = ctx.measureText(name).width + 16;
    ctx.beginPath();
    ctx.roundRect(x - width / 2, labelY - 11, width, 21, 6);
    ctx.fillStyle = nearby ? '#554029' : '#26352dea';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff4d6';
    ctx.fillText(name, x, labelY);
    ctx.restore();
}

function getTownPlayerId() {
    if (saveData.accountId) return String(saveData.accountId);
    if (!TOWN_STATE.localPlayerId) {
        const key = 'tws_local_player_id';
        const digits = crypto.getRandomValues(new Uint32Array(1))[0].toString(16).padStart(8, '0').toUpperCase();
        TOWN_STATE.localPlayerId = `TW-${digits}`;
        try {
            const stored = localStorage.getItem(key);
            if (stored) TOWN_STATE.localPlayerId = stored;
            else localStorage.setItem(key, TOWN_STATE.localPlayerId);
        } catch (e) { /* 本次遊戲仍可顯示本機 ID */ }
    }
    return TOWN_STATE.localPlayerId;
}

function toggleTownMobileToolbar() {
    const fold = document.getElementById('town-mobile-fold');
    const actions = document.getElementById('town-mobile-actions');
    if (!fold || !actions) return;
    TOWN_STATE.mobileToolbarCollapsed = !TOWN_STATE.mobileToolbarCollapsed;
    const collapsed = TOWN_STATE.mobileToolbarCollapsed;
    if (collapsed && actions.contains(document.activeElement)) fold.focus();
    fold.setAttribute('aria-expanded', String(!collapsed));
    fold.setAttribute('aria-label', collapsed ? '展開城鎮功能' : '收起城鎮功能');
    actions.inert = collapsed;
}

function openTownMobileSettings() {
    const stats = DEV_ONLY ? getDevPlayCounts() : null;
    openNpcModalShell('設定', '', '#c7aee9', `
        <div class="town-settings-actions">
            <button type="button" class="music-toggle" data-music-toggle onclick="AudioManager.toggle()">背景音樂</button>
            <button type="button" onclick="toggleTownDayNight();openTownMobileSettings()">城鎮時段 · ${getRaidiaNightMode() ? '星夜' : '白晝'}</button>
            <button type="button" onclick="closeNpcModalShell();logoutToCharacterSelect()">登出</button>
        </div>
        ${stats ? `<div class="town-settings-dev">
            <button type="button" onclick="closeNpcModalShell();enterSandboxArena()">木樁修鍊場</button>
            <small>本機試玩 ${stats.sessions} 人次・出征 ${stats.runs} 場・通關 ${stats.clears} 場</small>
        </div>` : ''}`);
    AudioManager.syncToggleButtons(document.getElementById('npc-modal-box'));
}

function updateTownHeaderInfo() {
    const el = document.getElementById('town-header-status');
    if (!el || typeof saveData === 'undefined') return;
    const cName = saveData.charName || (typeof CHARACTERS !== 'undefined' && CHARACTERS[saveData.charId]?.name) || '冒險者';
    const lv = saveData.outLv || 1;
    const seedVal = saveData.seed ?? 0;
    const mailLen = Array.isArray(saveData.mailbox) ? saveData.mailbox.length : 0;
    const isNight = getRaidiaNightMode();
    const stats = DEV_ONLY ? getDevPlayCounts() : null;
    const collapsed = TOWN_STATE.mobileToolbarCollapsed;
    const btnCss = 'margin-left:6px;padding:4px 9px;border-radius:6px;background:#0f172a;color:#e2e8f0;border:1px solid #475569;cursor:pointer;font-size:12px;';
    el.innerHTML = `<div class="town-summary"><span>👤 <b>${cName}</b> (LV.${lv})</span>` +
        `<span style="margin-left:10px;">💰 <b>${seedVal.toLocaleString()}</b></span></div>` +
        '<nav class="town-actions" aria-label="城鎮功能">' +
        `<button onclick="toggleTownDayNight()" title="點擊切換雷蒂亞白晝／星夜光影與BGM" style="${btnCss}border-color:${isNight ? '#818cf8' : '#facc15'};color:${isNight ? '#c7d2fe' : '#fde047'};">${isNight ? '🌙' : '☀️'} <span class="town-label-long">雷蒂亞・</span>${isNight ? '星夜' : '白晝'}</button>` +
        '<button type="button" class="music-toggle" data-music-toggle onclick="AudioManager.toggle()" style="margin-left:6px;">🔊 音樂開</button>' +
        `<button onclick="toggleTownShortcutModal('bag')" style="${btnCss}border-color:#38bdf8;color:#38bdf8;">🎒 背包<span class="town-label-long"> [I]</span></button>` +
        `<button onclick="toggleTownShortcutModal('stats')" style="${btnCss}border-color:#facc15;color:#facc15;">📊 素質<span class="town-label-long"> [C]</span></button>` +
        `<button onclick="toggleTownShortcutModal('party')" style="${btnCss}border-color:#4ade80;color:#4ade80;">👥 組隊<span class="town-label-long"> [P]</span></button>` +
        `<button onclick="openTownMailbox()" style="${btnCss}border-color:#f59e0b;color:#fbbf24;">📬 信箱 (${mailLen})</button>` +
        `<button onclick="openTownCardPoolModal()" style="${btnCss}border-color:#a855f7;background:#581c87;color:#f3e8ff;">🃏 卡池</button>` +
        `<button class="town-training" onclick="enterSandboxArena()" style="${btnCss}border-color:#0284c7;background:#0369a1;color:#fff;">🧪 <span class="town-label-long">木樁</span>修鍊場</button>` +
        `<button onclick="logoutToCharacterSelect()" style="${btnCss}">🚪 登出</button>` +
        '</nav>' +
        (stats ? `<span class="town-session"><span class="town-label-long">本機</span>試玩 ${stats.sessions} 人次・出征 ${stats.runs} 場・通關 ${stats.clears} 場</span>` : '') +
        `<div class="town-mobile-profile">
            <img alt="" width="36" height="40">
            <div><strong></strong><span></span></div>
        </div>
        <nav class="town-mobile-rail" aria-label="城鎮功能">
            <button type="button" id="town-mobile-fold" class="town-mobile-fold" aria-controls="town-mobile-actions"
                aria-expanded="${!collapsed}" aria-label="${collapsed ? '展開城鎮功能' : '收起城鎮功能'}" onclick="toggleTownMobileToolbar()">
                <i aria-hidden="true"></i>
            </button>
            <div id="town-mobile-actions" ${collapsed ? 'inert' : ''}>
                <button type="button" onclick="openTownStatsModal()"><span>角色</span></button>
                <button type="button" onclick="openTownBagModal()"><span>背包</span></button>
                <button type="button" onclick="openTownCardPoolModal()"><span>技能</span></button>
                <button type="button" onclick="openNpcQiedeluo('enhance')"><span>強化</span></button>
                <button type="button" onclick="openTownPartyModal(true)"><span>社交</span></button>
                <button type="button" onclick="openTownMailbox()"><span>信箱</span></button>
                <button type="button" onclick="openTownMobileSettings()"><span>設定</span></button>
            </div>
        </nav>`;
    const profile = el.querySelector('.town-mobile-profile');
    const portrait = profile.querySelector('img');
    const character = CHARACTERS[saveData.charId] || CHARACTERS.lucien;
    portrait.addEventListener('error', () => { portrait.hidden = true; }, { once: true });
    portrait.src = `assets/characters/portraits/${character.id}.png`;
    profile.querySelector('strong').textContent = getTownPlayerId();
    profile.querySelector('span').textContent = cName;
    AudioManager.syncToggleButtons(el);
}

// 臨時功能：預覽當前角色與武器配置在局內可抽到的完整主動／被動卡池
function openTownCardPoolModal() {
    const actPool = typeof getActiveSkillPool === 'function' ? getActiveSkillPool() : {};
    const pasPool = typeof getActivePassivePool === 'function' ? getActivePassivePool() : {};
    const w = saveData?.equip?.weapon;
    const wTypeNames = { longsword: '長劍', blade: '彎刀', rapier: '細劍', tachi: '太刀', greatsword: '巨劍', spear: '槍', polearm: '棍', dagger: '短劍', dual_blade: '雙斧', axe: '戰斧', whip: '鞭', flail: '鏈錘', wand: '魔杖', staff: '權杖', mace: '釘錘' };
    const rawType = w ? (w.subType || w.type) : '';
    const typeLabel = wTypeNames[rawType] || rawType || '未知';
    const wName = w ? `${w.name} (${typeLabel}${w.wandElem ? '・' + w.wandElem : ''})` : '徒手';

    const evolutionRoutes = getSkillEvolutionRoutes(actPool, pasPool);
    const actEntries = Object.entries(actPool).filter(([, sk]) => !sk.isSuperWeapon);
    const pasEntries = Object.entries(pasPool);

    const actHtml = actEntries.map(([id, sk]) => {
        const evolution = evolutionRoutes[id];
        const badge = evolution ? '<span style="color:#38bdf8;font-size:11px;">[可昇華]</span>' : '';
        return `<div style="padding:6px 8px;background:#0f172a;border-radius:6px;margin-bottom:5px;border-left:3px solid #38bdf8;">
            <div style="font-size:13px;font-weight:bold;color:#f8fafc;">${sk.icon || '✨'} ${sk.name} ${badge}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${sk.desc || ''}</div>
            ${evolution ? `<div style="font-size:11px;color:#facc15;margin-top:3px;">[昇華] ${evolution.name}</div>` : ''}
        </div>`;
    }).join('') || '<div style="color:#64748b;font-size:12px;">無可用主動技能</div>';

    const pasHtml = pasEntries.map(([id, p]) => {
        const isUnique = Array.isArray(p.reqChar) && p.reqChar.length > 0;
        const evolves = actEntries.filter(([skillId, skill]) => evolutionRoutes[skillId] && skill.reqPassive === id).map(([, skill]) => skill.name);
        return `<div style="padding:6px 8px;background:#0f172a;border-radius:6px;margin-bottom:5px;border-left:3px solid ${isUnique ? '#c084fc' : '#4ade80'};">
            <div style="font-size:13px;font-weight:bold;color:${isUnique ? '#e9d5ff' : '#f8fafc'};">${p.name} ${isUnique ? '<span style="color:#c084fc;font-size:11px;">[專屬]</span>' : ''}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${p.desc || ''}</div>
            ${evolves.length ? `<div style="font-size:11px;color:#facc15;margin-top:3px;">昇華前置｜${evolves.join('、')}</div>` : ''}
        </div>`;
    }).join('') || '<div style="color:#64748b;font-size:12px;">無可用被動卡片</div>';

    const title = MobileControls.enabled ? '技能・當前卡池' : '🃏 當前配置局內卡池預覽（測試工具）';
    openNpcModalShell(title, `角色：${saveData.charName || '冒險者'} ｜ 武器：${wName}`, '#c084fc', `
        <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:12px;">
            <div style="background:#1e293b;padding:10px;border-radius:8px;max-height:360px;overflow-y:auto;">
                <div style="font-weight:bold;color:#38bdf8;margin-bottom:6px;">🔥 可選主動技能池 (${actEntries.length} 張)</div>
                ${actHtml}
            </div>
            <div style="background:#1e293b;padding:10px;border-radius:8px;max-height:360px;overflow-y:auto;">
                <div style="font-weight:bold;color:#4ade80;margin-bottom:6px;">🔮 可選被動輔助池 (${pasEntries.length} 張)</div>
                ${pasHtml}
            </div>
        </div>`);
    const box = document.getElementById('npc-modal-box');
    if (box) box.style.maxWidth = '880px';
}

        let TOWN_ACTIVE_SHORTCUT = null;

        function toggleTownShortcutModal(mode) {
            if (isAnyTownModalOpen() && TOWN_ACTIVE_SHORTCUT === mode) {
                TOWN_ACTIVE_SHORTCUT = null;
                if (typeof closeNpcModalShell === 'function') closeNpcModalShell();
                return;
            }
            TOWN_ACTIVE_SHORTCUT = mode;
            if (mode === 'bag') openTownBagModal();
            else if (mode === 'stats') openTownStatsModal();
            else if (mode === 'party') openTownPartyModal();
        }
        
        // [I] 隨身背包與八格裝備視窗（含即時紙娃娃預覽與裝備 Tooltip）
function openTownBagModal() {
    const eq = saveData.equip || {};
    const bag = saveData.bag || [];
    const d = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { maxHp: 200, moveSpeed: 235, physReducePct: 0, magReducePct: 0 };
    const slotNames = typeof SLOT_NAMES !== 'undefined' ? SLOT_NAMES : { weapon: '武器', sub: '副手', head: '頭部', armor: '身體', gloves: '護手', shoes: '鞋靴', back: '背部', relic: '飾品' };
    const eqHtml = Object.entries(slotNames).map(([sk, label]) => {
        const it = eq[sk];
        const rCol = (it && typeof RARITIES !== 'undefined' && RARITIES[it.rarity]) ? RARITIES[it.rarity].color : '#38bdf8';
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:#0f172a;border-left:3px solid ${it ? rCol : '#334155'};border-radius:5px;margin-bottom:4px;font-size:12px;"
            ${it ? `onmouseenter="if(typeof showLobbyEquipTooltip==='function')showLobbyEquipTooltip(event,'equip','${sk}')" onmousemove="if(typeof moveLobbyTooltip==='function')moveLobbyTooltip(event)" onmouseleave="if(typeof hideLobbyTooltip==='function')hideLobbyTooltip()"` : ''}>
            <span>[${label}] <b style="color:${it ? rCol : '#64748b'};">${it ? it.name : '未裝備'}</b></span>
            ${it ? `<button onclick="if(typeof hideLobbyTooltip==='function')hideLobbyTooltip();unequipSlot('${sk}');openTownBagModal();" style="padding:2px 6px;background:#475569;color:#fff;border:none;border-radius:4px;cursor:pointer;">卸下</button>` : ''}
        </div>`;
    }).join('');
    if (typeof repairBrokenIdentifiedItems === 'function') repairBrokenIdentifiedItems();

    const rarRank = { gold: 5, purple: 4, blue: 3, green: 2, white: 1 };
    const getSortPriority = (it) => {
        if (!it || it.identified === false) return 3; // 第三順位：未鑑定
        const chk = typeof canEquipItem === 'function' ? canEquipItem(it) : { ok: true };
        if (chk.ok) return 1; // 第一順位：自己可穿戴置頂
        if (chk.reason && chk.reason.includes('需要角色等級')) return 2; // 第二順位：本職但等級未到
        return 4; // 第四順位：別職不可穿戴
    };
    const sortedBag = [...bag].sort((a, b) => {
        const pa = getSortPriority(a), pb = getSortPriority(b);
        if (pa !== pb) return pa - pb;
        const lvDiff = (b.reqLv || 0) - (a.reqLv || 0);
        if (lvDiff !== 0) return lvDiff;
        return (rarRank[b.rarity] || 0) - (rarRank[a.rarity] || 0);
    });

    const bagHtml = sortedBag.length === 0 ? '<div style="color:#64748b;font-size:12px;">背包目前為空</div>' : sortedBag.map(it => {
        const rCol = (typeof RARITIES !== 'undefined' && RARITIES[it.rarity]) ? RARITIES[it.rarity].color : '#f8fafc';
        const sLabel = slotNames[it.slot] || '神秘';
        const wearCheck = (it.identified !== false && typeof canEquipItem === 'function')
            ? canEquipItem(it)
            : { ok: it.identified !== false, reason: '' };

            const sellPrice = typeof getEquipSellPrice === 'function' ? getEquipSellPrice(it) : 15;
            const sellBtnHtml = `<button onclick="sellBagItemByUid(${it.uid})" title="直接商店回收換取 ${sellPrice} Seed" style="padding:2px 6px;background:#78350f;color:#fde047;border:1px solid #b45309;border-radius:4px;font-size:11px;cursor:pointer;">賣 ${sellPrice}</button>`;
    
            let primaryBtnHtml = '';
            if (it.identified === false) {
                primaryBtnHtml = '<span style="color:#c084fc;font-size:11px;margin-right:2px;">需鑑定</span>';
            } else if (wearCheck.ok) {
                primaryBtnHtml = `<button onclick="if(typeof hideLobbyTooltip==='function')hideLobbyTooltip();equipFromBag(${it.uid});openTownBagModal();" style="padding:2px 8px;background:#22c55e;color:#052e16;font-weight:bold;border:none;border-radius:4px;cursor:pointer;">穿戴</button>`;
            } else if (wearCheck.reason && wearCheck.reason.includes('需要角色等級')) {
                primaryBtnHtml = `<button disabled title="${wearCheck.reason}" style="padding:2px 6px;background:#334155;color:#fca5a5;border:1px solid #475569;border-radius:4px;font-size:11px;cursor:not-allowed;">LV.${it.reqLv || 1}可穿</button>`;
            } else {
                primaryBtnHtml = `<button disabled title="${wearCheck.reason || '不可穿戴'}" style="padding:2px 6px;background:#1e293b;color:#64748b;border:1px solid #334155;border-radius:4px;font-size:11px;cursor:not-allowed;">不可穿戴</button>`;
            }
            const actionHtml = `<div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">${primaryBtnHtml}${sellBtnHtml}</div>`;   
        const itemTitle = it.identified === false
            ? `❓ [未鑑定] 神秘${sLabel}`
            : `${it.name || '未知裝備'} (LV.${it.reqLv || 1})${it.tradable === false ? ' 🔒' : ''}`;

        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:#0f172a;border-left:3px solid ${rCol};border-radius:5px;margin-bottom:4px;font-size:12px;${(!wearCheck.ok && it.identified !== false) ? 'opacity:0.78;' : ''}"
            ${it.identified !== false ? `onmouseenter="if(typeof showLobbyEquipTooltip==='function')showLobbyEquipTooltip(event,'bag','${it.uid}')" onmousemove="if(typeof moveLobbyTooltip==='function')moveLobbyTooltip(event)" onmouseleave="if(typeof hideLobbyTooltip==='function')hideLobbyTooltip()"` : ''}>
            <span style="color:${rCol};">${itemTitle}</span>
            ${actionHtml}
        </div>`;
    }).join('');

    openNpcModalShell('🎒 隨身背包與即時紙娃娃 [I]', '按 I 或 ESC 關閉（移上裝備可查看屬性）', '#38bdf8', `
        ${saveData.legacyBag?.length ? `<button type="button" onclick="openLegacyBagRecoveryModal()" style="padding:6px 10px;margin-bottom:10px;border:1px solid #38bdf8;border-radius:5px;background:#0f172a;color:#bae6fd;cursor:pointer;">舊背包領取區（${saveData.legacyBag.length}）</button>` : ''}
        <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:12px;align-items:stretch;">
            <div style="background:#1e293b;padding:10px;border-radius:8px;">
                <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #334155;">
                    <canvas id="paperDollCanvas" width="76" height="92" style="background:#0f172a;border:1.5px solid #38bdf8;border-radius:8px;flex-shrink:0;"></canvas>
                    <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;">
                        <div style="background:#0f172a;padding:4px 6px;border-radius:4px;">❤️ 生命：<b>${d.maxHp}</b></div>
                        <div style="background:#0f172a;padding:4px 6px;border-radius:4px;">👟 移速：<b>${Math.round(d.moveSpeed)}</b></div>
                        <div style="background:#0f172a;padding:4px 6px;border-radius:4px;">🛡️ 物減：<b style="color:#4ade80;">${d.physReducePct}%</b></div>
                        <div style="background:#0f172a;padding:4px 6px;border-radius:4px;">💠 魔減：<b style="color:#38bdf8;">${d.magReducePct}%</b></div>
                    </div>
                </div>
                ${eqHtml}
            </div>
            <div style="background:#1e293b;padding:10px;border-radius:8px;max-height:426px;overflow-y:auto;"><div style="font-weight:bold;color:#4ade80;margin-bottom:6px;">📦 背包清單 (${bag.length})</div>${bagHtml}</div>
        </div>`);
    const box = document.getElementById('npc-modal-box');
    if (box) box.style.maxWidth = '860px';
    if (typeof renderPaperDoll === 'function') renderPaperDoll();
}

function openLegacyBagRecoveryModal() {
    const items = saveData.legacyBag || [];
    const rows = items.map((item, index) => {
        if (!item) return '';
        const slot = SLOT_NAMES[item.slot] || '裝備';
        const rarity = RARITIES[item.rarity];
        const title = item.identified === false ? `[未鑑定] ${rarity?.name || ''}${slot}` : (item.name || slot);
        const safeTitle = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
        return `<div class="bag-item">
            <span style="color:${rarity?.color || '#f8fafc'};">${safeTitle}${Number(item.reqLv) > 0 ? '（LV.' + Number(item.reqLv) + '）' : ''}</span>
            <button type="button" class="stat-btn" style="width:auto;padding:0 8px;" data-item-uid="${encodeURIComponent(String(item.uid))}"
                onclick="if(claimLegacyBagItem(${index}, decodeURIComponent(this.dataset.itemUid))) openLegacyBagRecoveryModal()">領取</button>
        </div>`;
    }).join('');
    openNpcModalShell('舊背包領取區', `目前領取角色為 ${saveData.charName}`, '#38bdf8', `
        <p style="font-size:13px;color:#cbd5e1;margin-bottom:10px;">道具會移入目前角色的背包。切換角色後，可以分配剩餘的道具。</p>
        <div style="max-height:360px;overflow-y:auto;">${rows || '<p>所有舊背包道具已領取。</p>'}</div>
        <button type="button" class="stat-btn" style="width:auto;padding:0 8px;margin-top:10px;" onclick="openTownBagModal()">返回背包</button>`);
}

// 隨身背包單件商店回收出售（支援已鑑定與未鑑定裝備）
function sellBagItemByUid(uid) {
    if (!Array.isArray(saveData.bag)) return;
    const idx = saveData.bag.findIndex(it => it && it.uid === uid);
    if (idx === -1) return;
    const target = saveData.bag[idx];
    if (target.rarity === 'gold' && target.identified !== false) {
        if (!confirm(`確定要出售金色傳說裝備【${target.name}】嗎？`)) return;
    }
    const gain = typeof getEquipSellPrice === 'function' ? getEquipSellPrice(target) : 15;
    saveData.bag.splice(idx, 1);
    saveData.seed = (saveData.seed || 0) + gain;
    if (typeof hideLobbyTooltip === 'function') hideLobbyTooltip();
    if (typeof writeSave === 'function') writeSave();
    if (typeof updateTownHeaderInfo === 'function') updateTownHeaderInfo();
    openTownBagModal();
}

// [C] 角色素質與配點視窗（右側同步顯示完整即時戰鬥面板總覽）
function openTownStatsModal() {
    const labels = { S: 'STAB', H: 'HACK', I: 'INT', DEF: 'DEF', MR: 'MR', DEX: 'DEX', AGI: 'AGI' };
    const freePts = typeof getWorkingFreePts === 'function' ? getWorkingFreePts() : (saveData.freePts || 0);
    const alloc = typeof getWorkingAlloc === 'function' ? getWorkingAlloc() : (saveData.allocated || {});
    const d = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : {};
    const st = d.st || {};
    const rows = Object.entries(labels).map(([k, name]) => {
        const totalVal = st[k] ?? (typeof getNakedStat === 'function' ? getNakedStat(k) : (saveData.baseStats[k] || 0));
        const cost = typeof getStatCost === 'function' ? getStatCost(k) : 1;
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:#0f172a;border-radius:6px;margin-bottom:4px;font-size:13px;"
            onmouseenter="if(typeof showLobbyStatTooltip==='function')showLobbyStatTooltip(event,'${k}')" onmousemove="if(typeof moveLobbyTooltip==='function')moveLobbyTooltip(event)" onmouseleave="if(typeof hideLobbyTooltip==='function')hideLobbyTooltip()">
            <span style="cursor:help;border-bottom:1px dashed #64748b;"><b>${name}</b>：<span style="color:#fde047;font-weight:bold;">${totalVal}</span> <span style="font-size:11px;color:#94a3b8;">(${cost}pt)</span></span>
            <div style="display:flex;gap:3px;">
                <button onclick="subStat('${k}');openTownStatsModal();" ${(alloc[k] || 0) <= 0 ? 'disabled' : ''} style="padding:2px 7px;background:#475569;color:#fff;border:none;border-radius:4px;cursor:pointer;">-</button>
                <button onclick="addStat('${k}');openTownStatsModal();" ${freePts < cost ? 'disabled' : ''} style="padding:2px 7px;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer;">+</button>
                <button onclick="maxOutStat('${k}');openTownStatsModal();" ${freePts < cost ? 'disabled' : ''} style="padding:2px 5px;background:#eab308;color:#0f172a;font-weight:bold;font-size:11px;border:none;border-radius:4px;cursor:pointer;">MAX</button>
            </div>
        </div>`;
    }).join('');
    const bar = (typeof pendingAlloc !== 'undefined' && pendingAlloc) ? `<div style="display:flex;gap:6px;margin-top:8px;">
        <button onclick="confirmStats();openTownStatsModal();" style="flex:1;padding:6px;background:#22c55e;color:#052e16;font-weight:bold;border:none;border-radius:6px;cursor:pointer;">✅ 確認配點</button>
        <button onclick="cancelStats();openTownStatsModal();" style="flex:1;padding:6px;background:#475569;color:#fff;border:none;border-radius:6px;cursor:pointer;">↩️ 取消微調</button>
    </div>` : '<button type="button" class="stat-btn" style="width:auto;padding:0 8px;margin-top:8px;" onclick="resetStats();openTownStatsModal()">洗點</button>';

    const detailItems = [
        ['物理減傷', `${d.physReducePct || 0}%`, '#4ade80'], ['魔法減傷', `${d.magReducePct || 0}%`, '#38bdf8'],
        ['冷卻縮減', `${Math.round((d.cdReduce || 0) * 100)}%`, '#38bdf8'], ['生命回復', `+${(d.regen || 0).toFixed(1)}/秒`, '#4ade80'],
        ['傷害倍率', `${Math.round(Math.max(d.physDmgMult || 1, d.magDmgMult || 1) * 100)}%`, '#facc15'], ['範圍擴大', `+${Math.round((d.areaBonus || 0) * 100)}%`, '#e2e8f0'],
        ['移動速度', `${Math.round(d.moveSpeed || 235)}`, '#f8fafc'], ['暴擊率', `${((d.critRate || 0.05) * 100).toFixed(1)}%`, '#fb923c'],
        ['暴擊傷害', `${Math.round((d.critDmg || 1.5) * 100)}%`, '#f87171'], ['連擊機率', `${((d.doubleHitChance || 0) * 100).toFixed(1)}%`, '#fb923c'],
        ['異常時長', `+${Math.round(((d.statusDurMult || 1) - 1) * 100)}%`, '#c084fc'], ['異常機率', `${(10 + (d.statusChanceBonus || 0) * 100).toFixed(1)}%`, '#38bdf8'],
        ['經驗獲取', `${Math.round((d.expBonusMult || 1) * 100)}%`, '#38bdf8'], ['拾取範圍', `${d.pickupRange || 115}`, '#f8fafc'],
        ['射彈增加', `+${d.extraProj || 0} 發`, '#f87171'], ['❤️ 最大生命', `${d.maxHp || 200}`, '#4ade80']
    ];
    const detailHtml = detailItems.map(([k, v, col]) => `<div style="display:flex;justify-content:space-between;padding:4px 8px;background:#0f172a;border-radius:5px;font-size:12px;"><span style="color:#94a3b8;">${k}</span><b style="color:${col};">${v}</b></div>`).join('');

    openNpcModalShell('📊 角色素質與配點 [C]', `LV.${saveData.outLv || 1} ｜ 剩餘自由點數：${freePts}`, '#facc15', `
        <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:12px;">
            <div style="background:#1e293b;padding:10px;border-radius:8px;">${rows}${bar}</div>
            <div style="background:#1e293b;padding:10px;border-radius:8px;">
                <div style="font-weight:bold;color:#cbd5e1;font-size:13px;margin-bottom:6px;">⚔️ 即時戰鬥面板總覽（加點即時預覽）</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">${detailHtml}</div>
            </div>
        </div>`);
    const box = document.getElementById('npc-modal-box');
    if (box) box.style.maxWidth = '880px';
}
        
        // [P] 組隊與我的世界成員列表視窗
        function openTownPartyModal(fromSocial = false) {
            const hostName = saveData.charName || '冒險者';
            const members = TOWN_STATE.roomMembers || [];
            const listHtml = `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#0f172a;border:1px solid #38bdf8;border-radius:6px;margin-bottom:6px;">
                    <span>👑 <b>${hostName}</b> (房主 /LV.${saveData.outLv || 1})</span>
                    <span style="font-size:12px;color:#38bdf8;">我的世界</span>
                </div>
                ${members.length === 0 ? '<div style="color:#94a3b8;font-size:12px;padding:10px;text-align:center;">目前無其他受邀玩家在你的世界中（上限 4 人）</div>' : members.map(m => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#0f172a;border-radius:6px;margin-bottom:6px;">
                        <span>👤 <b>${m.name}</b> (LV.${m.lv || 1})</span>
                        <button onclick="alert('發起與 ${m.name} 的面對面直接交易（連線接口就緒）')" style="padding:3px 10px;background:#eab308;color:#0f172a;font-weight:bold;border:none;border-radius:5px;cursor:pointer;">🤝 直接交易</button>
                    </div>`).join('')}
            `;
            openNpcModalShell(fromSocial ? '社交・組隊與世界成員' : '👥 組隊與世界成員列表 [P]', `當前人數：${1 + members.length} / 4 ｜ 房間碼：${TOWN_STATE.roomCode}`, '#4ade80', `
                <div style="background:#1e293b;padding:12px;border-radius:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:12px;color:#cbd5e1;">
                        <span>分享房間邀請碼即可讓好友加入你的雷蒂亞村莊：</span>
                        <button onclick="navigator.clipboard?.writeText('${TOWN_STATE.roomCode}');alert('已複製房間邀請碼：${TOWN_STATE.roomCode}');" style="padding:4px 10px;background:#2563eb;color:#fff;border:none;border-radius:5px;cursor:pointer;">📋 複製邀請碼</button>
                    </div>
                    ${listHtml}
                </div>`);
        }

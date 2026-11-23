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
    isMouseDown: false,
    activeTarget: null,
    bgImg: null,
    bgLoaded: false,
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

    ['login-select-view', 'stage-select-view', 'lobby'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    townView.style.display = 'flex';
    TOWN_STATE.active = true;
    if (!keepPos || !TOWN_STATE.hasSpawned) {
        TOWN_STATE.player.x = TOWN_CLAD_MAP.spawnPoint.x;
        TOWN_STATE.player.y = TOWN_CLAD_MAP.spawnPoint.y;
        TOWN_STATE.hasSpawned = true;
    }
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

    applyRaidiaBgm();
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
        if (!TOWN_STATE.active) return;
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

    const setMoveTargetFromMouse = (e) => {
        const rect = TOWN_STATE.canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (TOWN_CLAD_MAP.width / rect.width);
        const my = (e.clientY - rect.top) * (TOWN_CLAD_MAP.height / rect.height);
        const b = TOWN_CLAD_MAP.walkBounds;
        TOWN_STATE.player.targetX = Math.max(b.minX, Math.min(b.maxX, mx));
        TOWN_STATE.player.targetY = Math.max(b.minY, Math.min(b.maxY, my));
        return { mx, my };
    };

    TOWN_STATE.canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || !TOWN_STATE.active || isAnyTownModalOpen()) return;
        const { mx, my } = setMoveTargetFromMouse(e);
        // 若直接點擊距離內之 NPC 或傳送門則立即開啟互動
        for (const item of TOWN_CLAD_MAP.interactables) {
            if (Math.hypot(mx - item.x, my - item.y) <= 45 &&
                Math.hypot(TOWN_STATE.player.x - item.x, TOWN_STATE.player.y - item.y) <= item.radius) {
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
        if (!TOWN_STATE.isMouseDown || !TOWN_STATE.active || isAnyTownModalOpen()) return;
        setMoveTargetFromMouse(e);
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) TOWN_STATE.isMouseDown = false;
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

        // 樹上精靈村・雷蒂亞四段式精準行走區域判定（左廣場 ＋ 中央木橋 ＋ 右傳送高台 ＋ 北橋 ＋ 北側慶典高台）
        const clampToRaidiaPlatforms = (px, py) => {
            const zones = [
                { minX: 110, maxX: 565,  minY: 165, maxY: 680 }, // 左區巨樹生活廣場
                { minX: 545, maxX: 820,  minY: 345, maxY: 495 }, // 中央木棧道橋樑
                { minX: 800, maxX: 1170, minY: 335, maxY: 675 }, // 右區冒險傳送高台
                { minX: 950, maxX: 1050, minY: 220, maxY: 350 }, // 北側垂直木棧道
                { minX: 785, maxX: 1195, minY: 75,  maxY: 225 }  // 北側樹冠慶典高台（活動NPC預留區）
            ];   
        // 若座標已在任一木頭平台內則直接允許通行
        for (const z of zones) {
            if (px >= z.minX && px <= z.maxX && py >= z.minY && py <= z.maxY) {
                return { x: px, y: py };
            }
        }
        // 若超出邊界（如橋樑上下方樹海），自動吸附回最近的有效木棧道邊緣
        let best = { x: px, y: py }, minD = Infinity;
        for (const z of zones) {
            const cx = Math.max(z.minX, Math.min(z.maxX, px));
            const cy = Math.max(z.minY, Math.min(z.maxY, py));
            const d = Math.hypot(px - cx, py - cy);
            if (d < minD) { minD = d; best = { x: cx, y: cy }; }
        }
        return best;
    };
    const clampedPos = clampToRaidiaPlatforms(p.x, p.y);
    p.x = clampedPos.x;
    p.y = clampedPos.y;

    let nearest = null, minDist = Infinity;
    for (const item of TOWN_CLAD_MAP.interactables) {
        const d = Math.hypot(p.x - item.x, p.y - item.y);
        if (d <= item.radius && d < minDist) { minDist = d; nearest = item; }
    }
    TOWN_STATE.activeTarget = nearest;
}

function drawTownScene() {
    const ctx = TOWN_STATE.ctx, W = TOWN_CLAD_MAP.width, H = TOWN_CLAD_MAP.height;
    const isNight = getRaidiaNightMode();
    ctx.clearRect(0, 0, W, H);

    if (TOWN_STATE.bgLoaded && TOWN_STATE.bgImg) {
        ctx.drawImage(TOWN_STATE.bgImg, 0, 0, W, H);
    } else {
        // 1. 樹海背景底色
        ctx.fillStyle = isNight ? '#071318' : '#143322';
        ctx.fillRect(0, 0, W, H);

        // 2. 左區巨樹生活廣場平台
        ctx.fillStyle = isNight ? '#5c3a21' : '#9a6338';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(80, 130, 500, 580, 48);
        ctx.fill();
        ctx.stroke();

        // 3. 中央連接木棧道橋樑
        ctx.fillStyle = isNight ? '#6b4426' : '#b47846';
        ctx.beginPath();
        ctx.roundRect(560, 320, 260, 190, 12);
        ctx.fill();
        ctx.stroke();
        // 木板紋路
        ctx.strokeStyle = 'rgba(69,26,3,0.45)';
        ctx.lineWidth = 2;
        for (let bx = 585; bx <= 800; bx += 28) {
            ctx.beginPath(); ctx.moveTo(bx, 324); ctx.lineTo(bx, 506); ctx.stroke();
        }

                       // 4. 右區冒險傳送高台（下移讓出上方空間給慶典高台）
        ctx.fillStyle = isNight ? '#5c3a21' : '#9a6338';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(800, 310, 400, 390, 44);
        ctx.fill();
        ctx.stroke();

        // 4.1 北側連接垂直木棧道（連接右區傳送高台與上方慶典高台）
        ctx.fillStyle = isNight ? '#6b4426' : '#b47846';
        ctx.beginPath();
        ctx.roundRect(930, 225, 140, 100, 10);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(69,26,3,0.45)';
        ctx.lineWidth = 2;
        for (let by = 242; by <= 310; by += 22) {
            ctx.beginPath(); ctx.moveTo(934, by); ctx.lineTo(1066, by); ctx.stroke();
        }

        // 4.2 北側「樹冠慶典高台」（未來活動 NPC、任務告示牌與公會使者專區）
        ctx.fillStyle = isNight ? '#5c3a21' : '#9a6338';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(760, 48, 460, 190, 36);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isNight ? 'rgba(254,240,138,0.28)' : 'rgba(255,255,255,0.32)';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎪 樹冠慶典高台（活動 NPC・任務・公會預留區）', 990, 145);

        // 4.5 橋頭兩端「雷蒂亞精靈燈籠」（橫橋兩端＋北橋兩端共 4 盞）
        const lanterns = [
            { x: 822, y: 345 },
            { x: 822, y: 515 },
            { x: 915, y: 230 },
            { x: 1085, y: 230 }
        ];
        for (const ln of lanterns) {
            ctx.fillStyle = '#451a03';
            ctx.fillRect(ln.x - 3, ln.y - 34, 6, 34);
            ctx.beginPath(); ctx.arc(ln.x, ln.y, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = isNight ? '#fef08a' : '#f59e0b';
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(ln.x - 8, ln.y - 46, 16, 18, 5); ctx.fill(); ctx.stroke();
        }

              // 頂部操作提示文字（靠左上方樹海空白處避免遮擋慶典高台）
              ctx.fillStyle = isNight ? 'rgba(254,240,138,0.28)' : 'rgba(255,255,255,0.32)';
              ctx.font = 'bold 14px sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText('🌿 樹上精靈村・雷蒂亞（WASD／左鍵移動 ｜ 靠近 NPC、水晶或傳送門按 [F] 互動）', 88, 95);     
    }

    const list = TOWN_CLAD_MAP.interactables.map(d => ({ kind: 'item', y: d.y, data: d }));
    list.push({ kind: 'player', y: TOWN_STATE.player.y, data: TOWN_STATE.player });
    list.sort((a, b) => a.y - b.y);

    for (const ent of list) {
        if (ent.kind === 'player') {
            const p = ent.data, bob = Math.abs(Math.sin(p.walkTime)) * 4;
            const cObj = (typeof CHARACTERS !== 'undefined' && saveData?.charId) ? CHARACTERS[saveData.charId] : null;
            const charColor = (cObj && cObj.color) ? cObj.color : '#3b82f6';
            ctx.fillStyle = charColor; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(p.x - 15, p.y - 44 - bob, 30, 44, 8); ctx.fill(); ctx.stroke();
            ctx.textAlign = 'center'; ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = charColor;
            const pName = saveData?.charName || (cObj && cObj.name) || '冒險者';
            ctx.fillText(pName, p.x, p.y - 54 - bob);
        } else {
            const it = ent.data, hi = TOWN_STATE.activeTarget?.id === it.id;
            ctx.beginPath(); ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);
            ctx.fillStyle = hi ? 'rgba(250,204,21,0.22)' : 'rgba(255,255,255,0.06)'; ctx.fill();
            ctx.strokeStyle = hi ? '#facc15' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = hi ? 2.5 : 1; ctx.stroke();

            if (it.type === 'crystal') {
                // 時間精靈水晶菱形外觀
                ctx.fillStyle = isNight ? '#38bdf8' : '#fde047';
                ctx.beginPath();
                ctx.moveTo(it.x, it.y - 48); ctx.lineTo(it.x + 16, it.y - 24);
                ctx.lineTo(it.x, it.y); ctx.lineTo(it.x - 16, it.y - 24);
                ctx.closePath(); ctx.fill();
            } else {
                ctx.fillStyle = it.color; ctx.beginPath(); ctx.roundRect(it.x - 16, it.y - 44, 32, 46, 8); ctx.fill();
            }

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

      // 5. 【星夜光影與暖色精靈光暈】夜晚蓋上柔和靛藍夜幕，並為玩家、NPC、水晶與傳送門點亮暖光
      if (isNight) {
        ctx.save();
        ctx.fillStyle = 'rgba(8, 15, 38, 0.42)';
        ctx.fillRect(0, 0, W, H);

        ctx.globalCompositeOperation = 'lighter';
        const lanternCoords = [
            { x: 822, y: 308 }, { x: 822, y: 478 },
            { x: 915, y: 193 }, { x: 1085, y: 193 }
        ];
        const lights = [
            { x: TOWN_STATE.player.x, y: TOWN_STATE.player.y - 20, r: 145, c: 'rgba(253, 224, 71, 0.22)' },
            ...lanternCoords.flatMap(lt => [
                { x: lt.x, y: lt.y, r: 135, c: 'rgba(251, 191, 36, 0.38)' },
                { x: lt.x, y: lt.y, r: 50,  c: 'rgba(254, 249, 195, 0.52)' }
            ]),
            ...TOWN_CLAD_MAP.interactables.map(it => ({
                x: it.x, y: it.y - 20,
                r: it.type === 'portal' ? 170 : 130,
                c: it.type === 'portal' ? 'rgba(56, 189, 248, 0.26)' : 'rgba(253, 224, 71, 0.20)'
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
}

function updateTownHeaderInfo() {
    const el = document.getElementById('town-header-status');
    if (!el || typeof saveData === 'undefined') return;
    const cName = saveData.charName || (typeof CHARACTERS !== 'undefined' && CHARACTERS[saveData.charId]?.name) || '冒險者';
    const lv = saveData.outLv || 1;
    const seedVal = saveData.seed ?? 0;
    const mailLen = Array.isArray(saveData.mailbox) ? saveData.mailbox.length : 0;
    const isNight = getRaidiaNightMode();
    const bgmOn = typeof AudioManager !== 'undefined' ? AudioManager.enabled : true;
    const btnCss = 'margin-left:6px;padding:4px 9px;border-radius:6px;background:#0f172a;color:#e2e8f0;border:1px solid #475569;cursor:pointer;font-size:12px;';
    el.innerHTML = `<span>👤 <b>${cName}</b> (LV.${lv})</span>` +
        `<span style="margin-left:10px;">💰 <b>${seedVal.toLocaleString()}</b></span>` +
        `<button onclick="toggleTownDayNight()" title="點擊切換雷蒂亞白晝／星夜光影與BGM" style="${btnCss}border-color:${isNight ? '#818cf8' : '#facc15'};color:${isNight ? '#c7d2fe' : '#fde047'};">${isNight ? '🌙 雷蒂亞・星夜' : '☀️ 雷蒂亞・白晝'}</button>` +
        `<button onclick="if(typeof AudioManager!=='undefined'){AudioManager.toggle();updateTownHeaderInfo();}" style="${btnCss}border-color:#34d399;color:${bgmOn ? '#6ee7b7' : '#94a3b8'};">${bgmOn ? '🔊 BGM:開' : '🔇 BGM:關'}</button>` +
        `<button onclick="toggleTownShortcutModal('bag')" style="${btnCss}border-color:#38bdf8;color:#38bdf8;">🎒 背包 [I]</button>` +
        `<button onclick="toggleTownShortcutModal('stats')" style="${btnCss}border-color:#facc15;color:#facc15;">📊 素質 [C]</button>` +
        `<button onclick="toggleTownShortcutModal('party')" style="${btnCss}border-color:#4ade80;color:#4ade80;">👥 組隊 [P]</button>` +
        `<button onclick="openTownMailbox()" style="${btnCss}border-color:#f59e0b;color:#fbbf24;">📬 信箱 (${mailLen})</button>` +
        `<button onclick="openTownCardPoolModal()" style="${btnCss}border-color:#a855f7;background:#581c87;color:#f3e8ff;">🃏 卡池</button>` +
        `<button onclick="openDevLobbyModal()" style="${btnCss}border-color:#0284c7;background:#0369a1;color:#fff;">🧪 測試</button>` +
        `<button onclick="logoutToCharacterSelect()" style="${btnCss}">🚪 登出</button>`;
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

    const actEntries = Object.entries(actPool);
    const pasEntries = Object.entries(pasPool);

    const actHtml = actEntries.map(([id, sk]) => {
        const badge = sk.isSuperWeapon ? '<span style="color:#facc15;font-size:11px;">[超武]</span>' : (sk.canEvolve ? '<span style="color:#38bdf8;font-size:11px;">[可昇華]</span>' : '');
        return `<div style="padding:6px 8px;background:#0f172a;border-radius:6px;margin-bottom:5px;border-left:3px solid ${sk.isSuperWeapon ? '#facc15' : '#38bdf8'};">
            <div style="font-size:13px;font-weight:bold;color:#f8fafc;">${sk.icon || '✨'} ${sk.name} ${badge}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${sk.desc || ''}</div>
        </div>`;
    }).join('') || '<div style="color:#64748b;font-size:12px;">無可用主動技能</div>';

    const pasHtml = pasEntries.map(([id, p]) => {
        const isUnique = Array.isArray(p.reqChar) && p.reqChar.length > 0;
        return `<div style="padding:6px 8px;background:#0f172a;border-radius:6px;margin-bottom:5px;border-left:3px solid ${isUnique ? '#c084fc' : '#4ade80'};">
            <div style="font-size:13px;font-weight:bold;color:${isUnique ? '#e9d5ff' : '#f8fafc'};">${p.name} ${isUnique ? '<span style="color:#c084fc;font-size:11px;">[專屬]</span>' : ''}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${p.desc || ''}</div>
        </div>`;
    }).join('') || '<div style="color:#64748b;font-size:12px;">無可用被動卡片</div>';

    openNpcModalShell('🃏 當前配置局內卡池預覽（測試工具）', `角色：${saveData.charName || '冒險者'} ｜ 武器：${wName}`, '#c084fc', `
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
    </div>` : '';

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
        function openTownPartyModal() {
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
            openNpcModalShell('👥 組隊與世界成員列表 [P]', `當前人數：${1 + members.length} / 4 ｜ 房間碼：${TOWN_STATE.roomCode}`, '#4ade80', `
                <div style="background:#1e293b;padding:12px;border-radius:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:12px;color:#cbd5e1;">
                        <span>分享房間邀請碼即可讓好友加入你的卡雷德市集：</span>
                        <button onclick="navigator.clipboard?.writeText('${TOWN_STATE.roomCode}');alert('已複製房間邀請碼：${TOWN_STATE.roomCode}');" style="padding:4px 10px;background:#2563eb;color:#fff;border:none;border-radius:5px;cursor:pointer;">📋 複製邀請碼</button>
                    </div>
                    ${listHtml}
                </div>`);
        }
        function openDevLobbyModal() {
            const lobby = document.getElementById('lobbyModal');
            if (!lobby) return;
            lobby.style.zIndex = '920';
            lobby.style.display = 'flex';
            if (typeof renderLobby === 'function') renderLobby();
            const sbBtn = document.getElementById('btnEnterSandbox');
            if (sbBtn) sbBtn.style.display = 'inline-block';
        
            const header = document.getElementById('lobbyHeader');
            if (header && !document.getElementById('btnBackToTownClad')) {
                const backBtn = document.createElement('button');
                backBtn.id = 'btnBackToTownClad';
                backBtn.textContent = '⬅ 返回卡雷德自由市場';
                backBtn.style.cssText = 'margin-top:6px;padding:4px 12px;background:#334155;color:#facc15;border:1px solid #facc15;border-radius:6px;cursor:pointer;font-size:12px;';
                backBtn.onclick = () => {
                    lobby.style.display = 'none';
                    if (typeof updateTownHeaderInfo === 'function') updateTownHeaderInfo();
                };
                header.appendChild(backBtn);
            }
        }
        
    

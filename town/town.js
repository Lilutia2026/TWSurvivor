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
    const cName = saveData.charName || (typeof CHARACTERS !== 'undefined' && CHARACTERS[saveData.charId]?.name) || '冒險者';
    const lv = saveData.outLv || 1;
    const seedVal = saveData.seed ?? 0;
    const mailLen = Array.isArray(saveData.mailbox) ? saveData.mailbox.length : 0;
    const btnCss = 'margin-left:8px;padding:4px 10px;border-radius:6px;background:#0f172a;color:#e2e8f0;border:1px solid #475569;cursor:pointer;font-size:13px;';
    el.innerHTML = `<span>👤 <b>${cName}</b> (LV.${lv})</span>` +
        `<span style="margin-left:12px;">💰 Seed：<b>${seedVal.toLocaleString()}</b></span>` +
        `<span style="margin-left:12px;">🏠 房間碼：<b>${TOWN_STATE.roomCode}</b></span>` +
        `<button onclick="toggleTownShortcutModal('bag')" style="${btnCss}border-color:#38bdf8;color:#38bdf8;">🎒 背包 [I]</button>` +
        `<button onclick="toggleTownShortcutModal('stats')" style="${btnCss}border-color:#facc15;color:#facc15;">📊 素質 [C]</button>` +
        `<button onclick="toggleTownShortcutModal('party')" style="${btnCss}border-color:#4ade80;color:#4ade80;">👥 組隊 [P]</button>` +
        `<button onclick="openTownMailbox()" style="${btnCss}border-color:#f59e0b;color:#fbbf24;">📬 信箱 (${mailLen})</button>` +
        `<button onclick="openTownCardPoolModal()" style="${btnCss}border-color:#a855f7;background:#581c87;color:#f3e8ff;">🃏 卡池預覽</button>` +
        `<button onclick="openDevLobbyModal()" style="${btnCss}border-color:#0284c7;background:#0369a1;color:#fff;">🧪 測試大廳</button>` +
        `<button onclick="logoutToCharacterSelect()" style="${btnCss}">🚪 切換角色</button>`;
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
    const bagHtml = bag.length === 0 ? '<div style="color:#64748b;font-size:12px;">背包目前為空</div>' : bag.map(it => {
        const rCol = (typeof RARITIES !== 'undefined' && RARITIES[it.rarity]) ? RARITIES[it.rarity].color : '#f8fafc';
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:#0f172a;border-left:3px solid ${rCol};border-radius:5px;margin-bottom:4px;font-size:12px;"
            ${it.identified !== false ? `onmouseenter="if(typeof showLobbyEquipTooltip==='function')showLobbyEquipTooltip(event,'bag','${it.uid}')" onmousemove="if(typeof moveLobbyTooltip==='function')moveLobbyTooltip(event)" onmouseleave="if(typeof hideLobbyTooltip==='function')hideLobbyTooltip()"` : ''}>
            <span style="color:${rCol};">${it.identified === false ? '❓ [未鑑定] 神秘裝備' : `${it.name} (LV.${it.reqLv || 1})`}</span>
            ${it.identified !== false ? `<button onclick="if(typeof hideLobbyTooltip==='function')hideLobbyTooltip();equipFromBag(${it.uid});openTownBagModal();" style="padding:2px 8px;background:#22c55e;color:#052e16;font-weight:bold;border:none;border-radius:4px;cursor:pointer;">穿戴</button>` : '<span style="color:#c084fc;">請找皮奧鑑定</span>'}
        </div>`;
    }).join('');
    openNpcModalShell('🎒 隨身背包與即時紙娃娃 [I]', '按 I 或 ESC 關閉（移上裝備可查看屬性）', '#38bdf8', `
        <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:12px;">
            <div style="background:#1e293b;padding:10px;border-radius:8px;max-height:360px;overflow-y:auto;">
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
            <div style="background:#1e293b;padding:10px;border-radius:8px;max-height:360px;overflow-y:auto;"><div style="font-weight:bold;color:#4ade80;margin-bottom:6px;">📦 背包清單 (${bag.length})</div>${bagHtml}</div>
        </div>`);
    const box = document.getElementById('npc-modal-box');
    if (box) box.style.maxWidth = '860px';
    if (typeof renderPaperDoll === 'function') renderPaperDoll();
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
        
    

// ============================================================================
// 《TW倖存者》雷蒂亞傳送門：雙欄關卡情報與 4 階通用難度選擇系統 (town/stage_select.js)
// ============================================================================

let selectedStageId = 'penine_forest';
let selectedDifficultyKey = 'normal';

function openStageSelectPage() {
    if (typeof leaveTownClad === 'function') leaveTownClad();
    const stageView = document.getElementById('stage-select-view');
    if (!stageView) return;
    stageView.style.display = 'flex';
    if (!STAGE_SELECT_LIST.some(s => s.id === selectedStageId)) {
        selectedStageId = STAGE_SELECT_LIST[0].id;
    }
    renderStageSelectCards();
}

function closeStageSelectPage() {
    const stageView = document.getElementById('stage-select-view');
    if (stageView) stageView.style.display = 'none';
    if (typeof enterTownClad === 'function') enterTownClad(true);
}

function selectStageCard(stageId) {
    selectedStageId = stageId;
    renderStageSelectCards();
}

function selectStageDifficulty(diffKey) {
    if (DIFFICULTY_MODIFIERS[diffKey]) {
        selectedDifficultyKey = diffKey;
        renderStageSelectCards();
    }
}

function renderStageSelectCards() {
    const summaryEl = document.getElementById('stage-player-summary');
    const listEl = document.getElementById('stage-cards-container');
    const detailEl = document.getElementById('stage-detail-panel');
    if (!listEl || !detailEl || typeof saveData === 'undefined') return;

    const cObj = (typeof CHARACTERS !== 'undefined' && saveData.charId) ? CHARACTERS[saveData.charId] : null;
    const cName = saveData.charName || (cObj && cObj.name) || '冒險者';
    const playerLv = saveData.outLv || 1;

    if (summaryEl) {
        summaryEl.innerHTML = `出戰角色：<b style="color:#facc15;">${cName}</b>（LV.${playerLv}）`;
    }

    // 1. 渲染左側關卡列表
    listEl.innerHTML = STAGE_SELECT_LIST.map(st => {
        const isSel = st.id === selectedStageId;
        const isUnder = playerLv < st.minLv;
        const gap = getStageLevelGapInfo(playerLv, st);
        return `
        <div onclick="selectStageCard('${st.id}')" style="padding:12px;border-radius:10px;border:2px solid ${isSel ? '#38bdf8' : '#334155'};background:${isSel ? '#172554' : '#0f172a'};cursor:pointer;transition:0.15s;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="font-size:15px;font-weight:bold;color:#f8fafc;">${st.name}</span>
                <span style="font-size:11px;padding:2px 8px;border-radius:99px;background:${isUnder ? '#7f1d1d' : '#14532d'};color:${isUnder ? '#fecaca' : '#bbf7d0'};font-weight:bold;">
                    LV.${st.minLv}~${st.maxLv}
                </span>
            </div>
            <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">最終頭目：${st.boss.icon} ${st.boss.name}</div>
            <div style="font-size:11px;color:${gap.color};font-weight:bold;">${gap.label}</div>
        </div>`;
    }).join('');

    // 2. 渲染右側詳細情報與 4 階難度按鈕
    const st = STAGE_SELECT_LIST.find(s => s.id === selectedStageId) || STAGE_SELECT_LIST[0];
    const diff = DIFFICULTY_MODIFIERS[selectedDifficultyKey] || DIFFICULTY_MODIFIERS.normal;
    const gap = getStageLevelGapInfo(playerLv, st);
    const totalExpMult = (st.baseExpMult * diff.expMult * gap.mult).toFixed(2);
    const totalDropPct = (getMobEquipmentDropChance(st, diff, gap) * 100).toFixed(1);
    const isUnder = playerLv < st.minLv;
    const firstClears = saveData.stageFirstClears || {};

    const diffButtonsHtml = Object.values(DIFFICULTY_MODIFIERS).map(d => {
        const active = d.key === diff.key;
        const cleared = !!firstClears[`${st.id}_${d.key}`];
        const chestStyle = cleared
            ? 'opacity:0.28;filter:grayscale(1);'
            : 'filter:drop-shadow(0 0 4px rgba(250,204,21,0.85));';
        const chestTitle = cleared ? '已領取首通金色傳說寶箱' : '首次通關必得金色傳說寶箱！';
        return `<button onclick="selectStageDifficulty('${d.key}')" title="${chestTitle}" style="flex:1;padding:8px 6px;border-radius:8px;border:2px solid ${active ? d.color : '#334155'};background:${active ? '#1e293b' : '#0b1120'};color:${active ? d.color : '#94a3b8'};font-weight:bold;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">
            <span>${d.name}</span>
            <span style="font-size:14px;${chestStyle}">🎁</span>
        </button>`;
    }).join('');

    detailEl.innerHTML = `
        <div>
            <!-- 頂部風景橫幅 -->
            <div style="background:${st.bannerGradient};border:1px solid #334155;border-radius:10px;padding:14px 16px;margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(15,23,42,0.75);color:#38bdf8;font-weight:bold;">第 ${st.tier} 階獵場 ｜ 建議 LV.${st.minLv}~${st.maxLv}</span>
                    <span style="font-size:12px;color:${gap.color};font-weight:bold;">${gap.label}</span>
                </div>
                <h3 style="margin:6px 0 2px;font-size:20px;color:#fff;">${st.name}</h3>
                <div style="font-size:12px;color:#cbd5e1;">${st.subtitle}</div>
            </div>

                    <!-- 最終頭目情報 -->
            <div style="background:#1e293b;border-radius:8px;padding:10px 12px;margin-bottom:10px;">
                <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">關卡最終首領（中途菁英將從本區魔物中隨機現身）</div>
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <span style="padding:4px 12px;border-radius:6px;background:#451a03;border:1px solid #f59e0b;color:#fde047;font-weight:bold;font-size:13px;">
                        ${st.boss.icon} 最終 BOSS：${st.boss.name}（${st.boss.time}）
                    </span>
                </div>
            </div>

            <!-- 登場普通怪物與掉落情報 -->
            <div style="background:#1e293b;border-radius:8px;padding:10px 12px;margin-bottom:10px;">
                <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">出沒魔物生態</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                    ${st.monsters.map(m => `<span style="padding:3px 8px;border-radius:6px;background:#0f172a;border:1px solid #334155;font-size:12px;color:#e2e8f0;">${m}</span>`).join('')}
                </div>
                <div style="font-size:12px;color:#fbbf24;">💎 戰利品掉落：${st.dropHint}</div>
            </div>

            <!-- 4 階難度切換按鈕與即時倍率計算 -->
            <div style="background:#1e293b;border-radius:8px;padding:10px 12px;margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#94a3b8;margin-bottom:6px;">
                    <span>選擇挑戰難度（以本關卡基礎強度為 1.0x 基準）</span>
                    <span style="color:#facc15;font-size:11px;">🎁 亮起表示尚可領取該難度首通金裝</span>
                </div>
                <div style="display:flex;gap:8px;margin-bottom:8px;">${diffButtonsHtml}</div>
                <div style="display:flex;justify-content:space-between;font-size:12px;color:#cbd5e1;background:#0f172a;padding:6px 10px;border-radius:6px;">
                    <span>怪物血量 <b>×${diff.hpMult}</b> ｜ 傷害 <b>×${diff.dmgMult}</b> ｜ 怪量 <b>×${diff.spawnMult}</b></span>
                    <span>總經驗 <b style="color:#4ade80;">×${totalExpMult}</b> ｜ 掉寶率 <b style="color:#fbbf24;">${totalDropPct}%</b></span>
                </div>
            </div>
        </div>

        <!-- 底部出發操作列 -->
        <div>
            ${isUnder ? `<div style="font-size:12px;color:#fca5a5;margin-bottom:6px;text-align:center;">⚠️ 警告：當前等級低於本關建議等級（LV.${st.minLv}），強行出征將面臨極高風險！</div>` : ''}
            <button onclick="launchSelectedStage()" style="width:100%;padding:12px;font-size:16px;font-weight:bold;background:#0284c7;color:#fff;border:none;border-radius:10px;cursor:pointer;box-shadow:0 4px 12px rgba(2,132,199,0.4);">
                ⚔️ 踏入傳送陣・出發前往【${st.name}（${diff.name}）】
            </button>
        </div>
    `;
}

function launchSelectedStage() {
    const st = STAGE_SELECT_LIST.find(s => s.id === selectedStageId) || STAGE_SELECT_LIST[0];
    const diff = DIFFICULTY_MODIFIERS[selectedDifficultyKey] || DIFFICULTY_MODIFIERS.normal;
    if (!startBattle(st.id, diff.key)) return;

    const stageView = document.getElementById('stage-select-view');
    if (stageView) stageView.style.display = 'none';
    if (typeof saveData !== 'undefined') {
        saveData.currentStageId = st.id;
        saveData.currentDifficultyKey = diff.key;
    }
    if (typeof AudioManager !== 'undefined') {
        if (Array.isArray(st.bgmList) && st.bgmList.length > 0 && typeof AudioManager.playPlaylist === 'function') {
            AudioManager.playPlaylist(st.bgmList, true);
        } else {
            AudioManager.play('battle');
        }
    }
}

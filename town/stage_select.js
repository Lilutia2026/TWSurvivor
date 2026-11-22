// ============================================================================
// 《TW倖存者》卡雷德傳送門：獨立關卡出征選擇頁面 (core/stage_select.js)
// ============================================================================

const STAGE_SELECT_STATE = {
    selectedStageId: 'selbas_plain',
    difficulty: 'normal' // normal | hard | hell
};

// 由卡雷德自由市場傳送門按 F 觸發開啟此新頁面
function openStageSelectPage() {
    if (typeof leaveTownClad === 'function') leaveTownClad();
    const stageView = document.getElementById('stage-select-view');
    if (!stageView) return;
    stageView.style.display = 'flex';
    renderStageSelectUI();
}

function closeStageSelectPage() {
    const stageView = document.getElementById('stage-select-view');
    if (stageView) stageView.style.display = 'none';
    if (typeof enterTownClad === 'function') enterTownClad();
}

function renderStageSelectUI() {
    const listEl = document.getElementById('stage-cards-container');
    const infoEl = document.getElementById('stage-player-summary');
    if (!listEl) return;

    const pLv = (typeof saveData !== 'undefined' && saveData.outLv) ? saveData.outLv : 1;
    const cName = saveData?.charName || (typeof CHARACTERS !== 'undefined' && saveData?.charId && CHARACTERS[saveData.charId]?.name) || '冒險者';
    if (infoEl) {
        infoEl.innerHTML = `出戰角色：<b>${cName}</b> (LV.${pLv}) ｜ 房間人數：<b>${1 + (TOWN_STATE?.roomMembers?.length || 0)} / 4</b>`;
    }

    let html = '';
    STAGE_SELECT_LIST.forEach(st => {
        const isSel = st.id === STAGE_SELECT_STATE.selectedStageId;
        const isUnderLv = pLv < st.recLv;
        html += `
            <div onclick="selectStageOption('${st.id}')" style="
                padding:14px 16px;border-radius:10px;cursor:pointer;margin-bottom:10px;
                background:${isSel ? 'rgba(56,189,248,0.2)' : '#1e293b'};
                border:2px solid ${isSel ? '#38bdf8' : '#334155'};">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:16px;font-weight:bold;color:#f8fafc;">🗺️ ${st.name}</span>
                    <span style="font-size:12px;padding:2px 8px;border-radius:6px;background:${isUnderLv ? '#7f1d1d' : '#14532d'};color:${isUnderLv ? '#fca5a5' : '#86efac'};">
                        建議等級鎖：LV.${st.recLv} ${isUnderLv ? '(⚠️ 越級挑戰)' : '(✔ 符合)'}
                    </span>
                </div>
                <div style="font-size:13px;color:#cbd5e1;margin-top:6px;">${st.desc}</div>
                <div style="font-size:12px;color:#facc15;margin-top:4px;">🎁 主要掉落：${st.dropHint}</div>
            </div>
        `;
    });
    listEl.innerHTML = html;
}

function selectStageOption(stageId) {
    STAGE_SELECT_STATE.selectedStageId = stageId;
    renderStageSelectUI();
}

function launchSelectedStage() {
    const stageView = document.getElementById('stage-select-view');
    if (stageView) stageView.style.display = 'none';
    window.CURRENT_STAGE_ID = STAGE_SELECT_STATE.selectedStageId;

    const oldLobby = document.getElementById('lobbyModal');
    if (oldLobby) oldLobby.style.display = 'none';

    if (typeof startBattle === 'function') {
        startBattle();
    }
}

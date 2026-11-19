/**
 * ==================================================================
 * 《TW倖存者》木樁測試場獨立模組 (core/sandbox.js) - Part 1/2
 * 鐵則：所有設定皆封裝於 SANDBOX_STATE，絕不污染正式關卡與存檔
 * ==================================================================
 */

const SANDBOX_STATE = {
    active: false,          // 是否處於木樁測試場中（雙重隔離總開關）
    zeroDmgMode: false,      // 零輸出模式（傷害強制為 0，純測異常與技能演出）
    forceStatusMode: false,  // 必定觸發異常模式（100% 無視機率強制掛載異常）
    godMode: true,           // 玩家無敵鎖血（測試場預設開啟，防止測試時暴斃）
    dummyInvincible: false,  // 木樁不死鎖血（預設關閉：木樁可被擊殺觸發殉爆；開啟後木樁無敵）
    dummyAttack: false,      // 木樁主動移動碰撞（測試物理碰撞減傷與反傷）
    dummyShoot: false,       // 木樁遠程魔法射擊（測試魔法射彈減傷）
    panelCollapsed: false,

    // 即時 DPS 統計數據
    totalDmg: 0,
    maxHit: 0,
    elapsedTime: 0,
    isTrackingDps: false
  };
  
    // 進入或退出測試場時的絕對重置（確保對正式關卡零污染）
    function resetSandboxState(keepActive = false) {
      SANDBOX_STATE.active = keepActive;
      SANDBOX_STATE.zeroDmgMode = false;
      SANDBOX_STATE.forceStatusMode = false;
      SANDBOX_STATE.godMode = true;
      SANDBOX_STATE.dummyInvincible = false;
      SANDBOX_STATE.dummyAttack = false;
      SANDBOX_STATE.dummyShoot = false;
      SANDBOX_STATE.totalDmg = 0;
      SANDBOX_STATE.maxHit = 0;
      SANDBOX_STATE.elapsedTime = 0;
      SANDBOX_STATE.isTrackingDps = false;
      SANDBOX_STATE.hitCount = 0;
      SANDBOX_STATE.statusProcs = 0;
  
    const uiWrap = document.getElementById('sandboxUiLayer');
    if (uiWrap) uiWrap.style.display = keepActive ? 'block' : 'none';
  }
  
  function resetSandboxDps() {
    SANDBOX_STATE.totalDmg = 0;
    SANDBOX_STATE.maxHit = 0;
    SANDBOX_STATE.elapsedTime = 0;
    SANDBOX_STATE.isTrackingDps = false;
    SANDBOX_STATE.hitCount = 0;
    SANDBOX_STATE.statusProcs = 0;
    updateSandboxHud();
  }
  
  // 紀錄測試場內的有效傷害（由 core/game.js 的 hitEnemy 呼叫）
  function recordSandboxDamage(dmgInt) {
    if (!SANDBOX_STATE.active) return;
    SANDBOX_STATE.hitCount = (SANDBOX_STATE.hitCount || 0) + 1;
    if (dmgInt <= 0) return;
    SANDBOX_STATE.isTrackingDps = true;
    SANDBOX_STATE.totalDmg += dmgInt;
    if (dmgInt > SANDBOX_STATE.maxHit) SANDBOX_STATE.maxHit = dmgInt;
  }
  
   // 生成單隻指定類型木樁（普通木樁 1,000 HP，首領木樁 10,000 HP）
   function spawnSandboxDummy(kind = 'normal', offsetX = 160, offsetY = 0) {
    if (!SANDBOX_STATE.active || typeof enemies === 'undefined') return;
    const isBoss = kind === 'boss';
    const hpVal = isBoss ? 10000 : 1000;
    const dummy = {
      x: player.x + offsetX,
      y: player.y + offsetY,
      radius: isBoss ? 36 : 20,
      hp: hpVal,
      maxHp: hpVal,
      speed: 0,
      color: isBoss ? '#dc2626' : '#d97706',
      name: isBoss ? '首領測試木樁' : '普通測試木樁',
      expValue: 0,
      isDummy: true,
      isElite: false,
      isMegaBoss: isBoss,
      isFinalBoss: false,
      hitFlash: 0
    };
    if (typeof initEnemyStatus === 'function') initEnemyStatus(dummy);
    enemies.push(dummy);
    if (typeof showBanner === 'function') {
      showBanner(isBoss ? '👑 已生成【首領測試木樁】（含首領抗性與減半凍結）' : '🎯 已生成【普通測試木樁】');
    }
  }
  
  // 生成 3x3 群怪木樁陣（測試 AOE、連鎖閃電、殉爆與聖印擴散）
  function spawnSandboxDummyGrid() {
    if (!SANDBOX_STATE.active) return;
    const spacing = 85;
    for (let row = -1; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        spawnSandboxDummy('normal', 190 + col * spacing, row * spacing);
      }
    }
    if (typeof showBanner === 'function') showBanner('🎯 已生成【3×3 群怪木樁陣】！');
  }
  
  function clearSandboxDummies() {
    if (typeof enemies !== 'undefined') enemies.length = 0;
    if (typeof zones !== 'undefined') zones.length = 0;
    if (typeof projectiles !== 'undefined') projectiles.length = 0;
    if (typeof showBanner === 'function') showBanner('🧹 已清空場上所有木樁與殘留領域！');
  }
  
  // 清除木樁身上所有異常狀態（方便重複測疊層）
  function clearDummyStatuses() {
    if (typeof enemies === 'undefined') return;
    for (const e of enemies) {
      if (typeof initEnemyStatus === 'function') initEnemyStatus(e);
    }
    if (typeof showBanner === 'function') showBanner('✨ 已清除場上所有木樁的異常狀態！');
  }
  
  // 啟動木樁測試場（從大廳按鈕進入）
  function enterSandboxArena() {
    if (typeof pendingAlloc !== 'undefined' && pendingAlloc) {
      alert('請先按下「✅ 確認配點」或「↩️ 取消微調」後再進入測試場！');
      return;
    }
    // 先借用 startBattle 初始化角色素質、裝備與起始技能，再切換為純淨沙盒狀態
    if (typeof startBattle === 'function') startBattle();
    resetSandboxState(true);
  
    if (typeof enemies !== 'undefined') enemies.length = 0;
    if (typeof gems !== 'undefined') gems.length = 0;
    if (typeof chests !== 'undefined') chests.length = 0;
    if (typeof lootBags !== 'undefined') lootBags.length = 0;
    if (typeof runLoot !== 'undefined') runLoot.length = 0;
    if (typeof gameTime !== 'undefined') gameTime = 0;
  
    player.x = 0;
    player.y = 0;
    spawnSandboxDummy('normal', 160, 0);
    renderSandboxPanel();
    updateSandboxHud();
    if (typeof showBanner === 'function') showBanner('🎯 已進入【木樁測試場】！本模式不影響存檔與掉落');
  }
  
  // 恢復預設（一鍵還原所有開關、技能等級與標準木樁）
  function restoreSandboxDefaults() {
    if (!SANDBOX_STATE.active) return;
    resetSandboxState(true);
  
    if (typeof enemies !== 'undefined') enemies.length = 0;
    if (typeof slashes !== 'undefined') slashes.length = 0;
    if (typeof projectiles !== 'undefined') projectiles.length = 0;
    if (typeof lightnings !== 'undefined') lightnings.length = 0;
    if (typeof zones !== 'undefined') zones.length = 0;
  
    // 重置技能與被動回初始武器狀態
    const w = (typeof saveData !== 'undefined' && saveData.equip && saveData.equip.weapon)
      ? saveData.equip.weapon : { startSkill: 'enbu' };
    if (typeof ownedSkills !== 'undefined') {
      for (const k of Object.keys(ownedSkills)) delete ownedSkills[k];
      const startLv = (w.legendEffect && w.legendEffect.id === 'startLv2') ? 2 : 1;
      ownedSkills[w.startSkill] = { lv: startLv, evolved: false, disabled: false };
    }
    if (typeof ownedPassives !== 'undefined') {
      for (const k of Object.keys(ownedPassives)) delete ownedPassives[k];
    }
    if (typeof startBattle === 'function') {
      // 重新套用乾淨的角色面板倍率
      const d = typeof getDerivedCombatStats === 'function' ? getDerivedCombatStats() : { maxHp: 200, moveSpeed: 235, pickupRange: 115, cdReduce: 0, expBonusMult: 1 };
      player.maxHp = d.maxHp; player.hp = player.maxHp; player.regen = 0;
      player.baseSpeed = d.moveSpeed; player.pickupRange = d.pickupRange;
      player.cdMult = Math.max(0.35, 1 - (d.cdReduce || 0));
      player.areaMult = 1.0; player.speedMult = 1.0; player.dmgMult = 1.0;
      player.bonusCritRate = 0; player.bonusDoubleHit = 0;
      player.dropRateMult = 1.0; player.expMult = d.expBonusMult;
      player.curseMult = 1.0; player.seedMult = 1.0;
    }
  
    player.x = 0;
    player.y = 0;
    spawnSandboxDummy('normal', 160, 0);
    renderSandboxPanel();
    updateSandboxHud();
    if (typeof showBanner === 'function') showBanner('🔄 已恢復測試場預設狀態！');
  }
/**
 * ==================================================================
 * 《TW倖存者》木樁測試場獨立模組 (core/sandbox.js) - Part 2/2
 * ==================================================================
 */

// 讓目前已持有的主動技全部直衝滿級
function maxAllOwnedSandboxSkills() {
    if (!SANDBOX_STATE.active || typeof ownedSkills === 'undefined') return;
    for (const [id, st] of Object.entries(ownedSkills)) {
      const sk = ACTIVE_SKILLS[id];
      if (sk && !st.disabled) st.lv = sk.maxLv || 10;
    }
    if (typeof showBanner === 'function') showBanner('📈 已將所有已持有主動技提升至滿級！');
  }
  
  // 一鍵觸發所有可昇華技能的超武昇華
  function evolveAllSandboxSkills() {
    if (!SANDBOX_STATE.active || typeof ownedSkills === 'undefined') return;
    let count = 0;
    for (const [id, st] of Object.entries(ownedSkills)) {
      const sk = ACTIVE_SKILLS[id];
      if (!sk || !sk.canEvolve || st.evolved || st.disabled) continue;
      st.lv = sk.maxLv || 10;
      if (sk.disableWhenEvo && sk.evoSkillId) {
        st.disabled = true; st.evolved = true;
        ownedSkills[sk.evoSkillId] = { lv: 1, evolved: true, disabled: false };
      } else {
        st.evolved = true;
      }
      count++;
    }
    if (typeof showBanner === 'function') {
      showBanner(count > 0 ? `🌟 已強制完成 ${count} 項超武昇華！` : '⚠️ 目前沒有可昇華的基礎技能（請先從下方選單添加）');
    }
  }
  
  // 測試場專用：任意添加或升級指定主動技 / 被動技
  function getAllSandboxTestableSkills() {
    const map = {};
    if (typeof ACTIVE_SKILLS !== 'undefined') Object.assign(map, ACTIVE_SKILLS);
    if (typeof CHAR_SKILL_REGISTRY !== 'undefined') {
      for (const entry of Object.values(CHAR_SKILL_REGISTRY)) {
        if (entry && entry.skills) Object.assign(map, entry.skills);
      }
    }
    return map;
  }
  
  function addSandboxSkillOrPassive(kind, id) {
    if (!SANDBOX_STATE.active || !id) return;
    if (kind === 'skill') {
      const allSk = getAllSandboxTestableSkills();
      const sk = allSk[id];
      if (!sk) return;
      if (typeof ACTIVE_SKILLS !== 'undefined' && typeof getActiveSkillPool === 'function') {
        for (const k of Object.keys(ACTIVE_SKILLS)) delete ACTIVE_SKILLS[k];
        Object.assign(ACTIVE_SKILLS, getActiveSkillPool());
      } 
      if (ownedSkills[id]) {
        ownedSkills[id].disabled = false;
        ownedSkills[id].lv = Math.min(sk.maxLv || 10, ownedSkills[id].lv + 1);
      } else {
        ownedSkills[id] = { lv: 1, evolved: false, disabled: false };
      }
      if (typeof showBanner === 'function') showBanner(`➕ 已添加/強化主動技：【${sk.name}】LV.${ownedSkills[id].lv}`);
    } else if (kind === 'passive') {
      const pPool = typeof getActivePassivePool === 'function' ? getActivePassivePool() : {};
      const p = pPool[id];
      if (!p) return;
      const cur = ownedPassives[id] || 0;
      if (cur < (p.maxLv || 5)) {
        ownedPassives[id] = cur + 1;
        if (id === 'fastsword' || id === 'haste') player.cdMult *= 0.92;
        if (id === 'cdr') player.cdMult *= 0.94;
        if (id === 'guard' || id === 'area') player.areaMult += 0.10;
        if (id === 'might') player.dmgMult += 0.08;
        if (id === 'crit') player.bonusCritRate += 0.04;
        if (id === 'windBoot') player.speedMult += 0.09;
        if (id === 'heal') player.regen += 1.2;
      }
      if (typeof showBanner === 'function') showBanner(`➕ 已添加/強化被動：【${p.name}】LV.${ownedPassives[id]}`);
    }
  }

  // 測試場專用：移除指定已持有的主動技或被動技（同步還原被動屬性倍率）
  function removeSandboxSkillOrPassive(kind, id) {
    if (!SANDBOX_STATE.active || !id) return;
    if (kind === 'skill') {
      if (!ownedSkills[id]) {
        if (typeof showBanner === 'function') showBanner('⚠️ 目前並未持有此主動技！');
        return;
      }
      const skName = (ACTIVE_SKILLS[id] && ACTIVE_SKILLS[id].name) || id;
      delete ownedSkills[id];
      if (typeof showBanner === 'function') showBanner(`🗑️ 已移除主動技：【${skName}】`);
    } else if (kind === 'passive') {
      const lv = ownedPassives[id] || 0;
      if (lv <= 0) {
        if (typeof showBanner === 'function') showBanner('⚠️ 目前並未持有此被動技！');
        return;
      }
      const pPool = typeof getActivePassivePool === 'function' ? getActivePassivePool() : {};
      const pName = (pPool[id] && pPool[id].name) || id;
      // 依原有等級反向還原被動屬性倍率
      for (let i = 0; i < lv; i++) {
        if (id === 'fastsword' || id === 'haste') player.cdMult /= 0.92;
        if (id === 'cdr') player.cdMult /= 0.94;
        if (id === 'guard' || id === 'area') player.areaMult -= 0.10;
        if (id === 'might') player.dmgMult -= 0.08;
        if (id === 'crit') player.bonusCritRate -= 0.04;
        if (id === 'windBoot') player.speedMult -= 0.09;
        if (id === 'heal') player.regen = Math.max(0, player.regen - 1.2);
      }
      delete ownedPassives[id];
      if (typeof showBanner === 'function') showBanner(`🗑️ 已移除被動技：【${pName}】`);
    }
  }
   
    // 在 Canvas 上繪製木樁名稱與頭頂即時異常標籤（由 core/game.js draw() 呼叫）
    function drawSandboxDummyOverlays(ctx) {
      if (!SANDBOX_STATE.active || typeof enemies === 'undefined') return;
      ctx.save();
      ctx.textAlign = 'center';
      for (const e of enemies) {
        if (e.isDummy) {
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(e.name || '測試木樁', e.x, e.y + e.radius + 16);
        }
        const tags = [];
        if (e.burnTimer > 0) tags.push('🔥點燃');
        if (e.freezeTimer > 0) tags.push('🧊凍結');
        else if ((e.chillStacks || 0) > 0) tags.push(`❄️寒氣 ${e.chillStacks}/3`);
        if (e.shockTimer > 0) tags.push('⚡感電');
        if (e.windTimer > 0) tags.push('🌪️鎌鼬');
        if ((e.holySeal || 0) > 0) tags.push(`✨聖印 ${e.holySeal}/3`);
        if (e.armorBreakTimer > 0) tags.push('🔨破甲');
        if (e.darkTimer > 0) tags.push('🌑暗蝕');
    
        if (tags.length > 0) {
          const txt = tags.join(' '); 
        ctx.font = 'bold 11px sans-serif';
        const w = ctx.measureText(txt).width + 12;
        const boxY = e.y - e.radius - 26;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(e.x - w / 2, boxY - 12, w, 17);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(e.x - w / 2, boxY - 12, w, 17);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(txt, e.x, boxY);
      }
    }
    ctx.restore();
  }
  
  // 更新即時 DPS 統計數據
  function tickSandboxDps(dt) {
    if (!SANDBOX_STATE.active || isPaused) return;
    if (SANDBOX_STATE.isTrackingDps) {
      SANDBOX_STATE.elapsedTime += dt;
    }
    updateSandboxHud();
  }
  
  function updateSandboxHud() {
    const box = document.getElementById('sandboxDpsBox');
    if (!box || !SANDBOX_STATE.active) return;
    if (!document.getElementById('sbDpsTotal')) {
      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <strong style="color:#facc15;font-size:12px;">🎯 木樁即時傷害統計</strong>
          <button onclick="resetSandboxDps()" style="background:#334155;color:#f8fafc;border:1px solid #64748b;border-radius:4px;padding:1px 6px;font-size:10px;cursor:pointer;">重置DPS</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;color:#e2e8f0;">
          <div>累計傷害：<strong id="sbDpsTotal" style="color:#4ade80;">0</strong></div>
          <div>即時秒傷：<strong id="sbDpsAvg" style="color:#38bdf8;">0/s</strong></div>
          <div>最高單發：<strong id="sbDpsMax" style="color:#f87171;">0</strong></div>
          <div>計時秒數：<strong id="sbDpsTime">0.0s</strong></div>
          <div>異常觸發：<strong id="sbStatusProcs" style="color:#c084fc;">0 次</strong></div>
          <div>命中次數：<strong id="sbHitCount" style="color:#fde047;">0 次</strong></div>
        </div>`;
    }
    const dps = SANDBOX_STATE.elapsedTime > 0.1
      ? Math.round(SANDBOX_STATE.totalDmg / SANDBOX_STATE.elapsedTime) : 0;
    document.getElementById('sbDpsTotal').textContent = SANDBOX_STATE.totalDmg.toLocaleString();
    document.getElementById('sbDpsAvg').textContent = `${dps.toLocaleString()}/s`;
    document.getElementById('sbDpsMax').textContent = SANDBOX_STATE.maxHit.toLocaleString();
    document.getElementById('sbDpsTime').textContent = `${SANDBOX_STATE.elapsedTime.toFixed(1)}s`;
    document.getElementById('sbStatusProcs').textContent = `${SANDBOX_STATE.statusProcs || 0} 次`;
    document.getElementById('sbHitCount').textContent = `${SANDBOX_STATE.hitCount || 0} 次`;
  }
  
  function toggleSandboxFlag(key) {
    if (!SANDBOX_STATE.active) return;
    SANDBOX_STATE[key] = !SANDBOX_STATE[key];
    renderSandboxPanel();
  }
  
  function renderSandboxPanel() {
    const panel = document.getElementById('sandboxControlPanel');
    if (!panel) return;
    if (SANDBOX_STATE.panelCollapsed) {
      panel.innerHTML = `<button onclick="toggleSandboxFlag('panelCollapsed')" style="background:#eab308;color:#0f172a;font-weight:bold;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.6);">🎯 展開測試面板</button>`;
      return;
    }
  
    const mkToggle = (key, label, activeColor) => {
      const on = !!SANDBOX_STATE[key];
      return `<button onclick="toggleSandboxFlag('${key}')" style="width:100%;text-align:left;padding:5px 8px;border-radius:6px;border:1px solid ${on ? activeColor : '#475569'};background:${on ? activeColor : 'rgba(30,41,59,0.9)'};color:${on ? '#0f172a' : '#e2e8f0'};font-weight:bold;font-size:11px;cursor:pointer;">${on ? '✅' : '⬜'} ${label}</button>`;
    };
  
    const allSk = getAllSandboxTestableSkills();
    const skOpts = Object.entries(allSk).map(([id, sk]) => `<option value="${id}">${sk.name}</option>`).join('');
    const pPool = typeof getActivePassivePool === 'function' ? getActivePassivePool() : {};
    const pOpts = Object.entries(pPool).map(([id, p]) => `<option value="${id}">${p.name}</option>`).join('');
  
    panel.innerHTML = `
      <div style="background:rgba(15,23,42,0.94);border:1.5px solid #eab308;border-radius:10px;padding:10px;width:250px;max-height:calc(100vh - 120px);overflow-y:auto;color:#f8fafc;font-size:11px;box-shadow:0 8px 24px rgba(0,0,0,0.75);display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:5px;">
          <strong style="color:#fde047;font-size:12px;">🎯 木樁測試控制台</strong>
          <button onclick="toggleSandboxFlag('panelCollapsed')" style="background:#334155;color:#cbd5e1;border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;">收合</button>
        </div>
        ${mkToggle('zeroDmgMode', '🚫 零輸出模式 (純測異常)', '#f87171')}
        ${mkToggle('forceStatusMode', '✨ 必定觸發異常 (100%)', '#c084fc')}
        ${mkToggle('godMode', '🛡️ 玩家無敵鎖血', '#4ade80')}
        ${mkToggle('dummyInvincible', '🎯 木樁不死鎖血', '#38bdf8')}
        ${mkToggle('dummyAttack', '⚔️ 木樁移動碰撞 (測物減)', '#fb923c')}
        ${mkToggle('dummyShoot', '🔮 木樁魔法射擊 (測魔減)', '#c084fc')}

          <div style="border-top:1px solid #334155;padding-top:5px;display:grid;grid-template-columns:1fr 1fr;gap:4px;">
          <button onclick="spawnSandboxDummy('normal')" style="padding:5px;background:#1e293b;color:#fde047;border:1px solid #475569;border-radius:5px;cursor:pointer;">+ 普通木樁</button>
          <button onclick="spawnSandboxDummy('boss')" style="padding:5px;background:#1e293b;color:#f87171;border:1px solid #475569;border-radius:5px;cursor:pointer;">+ 首領木樁</button>
          <button onclick="spawnSandboxDummyGrid()" style="padding:5px;background:#1e293b;color:#38bdf8;border:1px solid #475569;border-radius:5px;cursor:pointer;">+ 3×3 陣列</button>
          <button onclick="clearDummyStatuses()" style="padding:5px;background:#1e293b;color:#c084fc;border:1px solid #475569;border-radius:5px;cursor:pointer;">清除異常</button>
        </div>
        <button onclick="clearSandboxDummies()" style="padding:4px;background:#334155;color:#e2e8f0;border:none;border-radius:5px;cursor:pointer;">🧹 清空場上木樁</button>
  
        <div style="border-top:1px solid #334155;padding-top:5px;display:grid;grid-template-columns:1fr 1fr;gap:4px;">
          <button onclick="maxAllOwnedSandboxSkills()" style="padding:5px;background:#0369a1;color:#fff;border:none;border-radius:5px;font-weight:bold;cursor:pointer;">📈 技能滿級</button>
          <button onclick="evolveAllSandboxSkills()" style="padding:5px;background:#b45309;color:#fef08a;border:none;border-radius:5px;font-weight:bold;cursor:pointer;">🌟 超武昇華</button>
        </div>
  
                <div style="border-top:1px solid #334155;padding-top:5px;">
          <div style="color:#94a3b8;font-size:10px;margin-bottom:2px;">⚔️ 自由添加／升級／移除主動技：</div>
          <div style="display:flex;gap:3px;">
            <select id="sbSkillSel" style="flex:1;min-width:0;background:#1e293b;color:#f8fafc;border:1px solid #475569;border-radius:4px;padding:4px;font-size:11px;">${skOpts}</select>
            <button onclick="addSandboxSkillOrPassive('skill', document.getElementById('sbSkillSel').value)" style="background:#22c55e;color:#052e16;font-weight:bold;border:none;border-radius:4px;padding:4px 6px;cursor:pointer;white-space:nowrap;">+主動</button>
            <button onclick="removeSandboxSkillOrPassive('skill', document.getElementById('sbSkillSel').value)" style="background:#ef4444;color:#fff;font-weight:bold;border:none;border-radius:4px;padding:4px 6px;cursor:pointer;white-space:nowrap;">-移除</button>
          </div>
        </div>
  
        <div>
          <div style="color:#94a3b8;font-size:10px;margin-bottom:2px;">🔮 自由添加／升級／移除被動技：</div>
          <div style="display:flex;gap:3px;">
            <select id="sbPassiveSel" style="flex:1;min-width:0;background:#1e293b;color:#f8fafc;border:1px solid #475569;border-radius:4px;padding:4px;font-size:11px;">${pOpts}</select>
            <button onclick="addSandboxSkillOrPassive('passive', document.getElementById('sbPassiveSel').value)" style="background:#38bdf8;color:#0f172a;font-weight:bold;border:none;border-radius:4px;padding:4px 6px;cursor:pointer;white-space:nowrap;">+被動</button>
            <button onclick="removeSandboxSkillOrPassive('passive', document.getElementById('sbPassiveSel').value)" style="background:#ef4444;color:#fff;font-weight:bold;border:none;border-radius:4px;padding:4px 6px;cursor:pointer;white-space:nowrap;">-移除</button>
          </div>
        </div>
  
        <div style="border-top:1px solid #334155;padding-top:6px;display:flex;gap:4px;">
          <button onclick="restoreSandboxDefaults()" style="flex:1;padding:6px;background:#eab308;color:#0f172a;font-weight:bold;border:none;border-radius:6px;cursor:pointer;">🔄 恢復預設</button>
          <button onclick="exitSandboxToLobby()" style="padding:6px 8px;background:#dc2626;color:#fff;font-weight:bold;border:none;border-radius:6px;cursor:pointer;">🚪 離開</button>
        </div>
      </div>`;
  }
 
  function exitSandboxToLobby() {
    resetSandboxState(false);
    isPaused = true;
    if (typeof enemies !== 'undefined') enemies.length = 0;
    if (typeof zones !== 'undefined') zones.length = 0;
    if (typeof projectiles !== 'undefined') projectiles.length = 0;
    const lobby = document.getElementById('lobbyModal');
    if (lobby) lobby.style.display = 'flex';
    if (typeof renderLobby === 'function') renderLobby();
  }

  (function initSandboxDom() {
    if (!document.getElementById('sandboxUiLayer')) {
      const layer = document.createElement('div');
      layer.id = 'sandboxUiLayer';
      layer.style.display = 'none';
      layer.innerHTML = `
      <div id="sandboxDpsBox" style="position:fixed;top:135px;left:16px;z-index:5;background:rgba(15,23,42,0.92);border:1.5px solid #38bdf8;border-radius:10px;padding:8px 12px;width:265px;box-shadow:0 4px 16px rgba(0,0,0,0.6);"></div>
      <div id="sandboxControlPanel" style="position:fixed;top:135px;right:16px;z-index:5;"></div>`;
      document.body.appendChild(layer);
    }

    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent && btn.textContent.includes('出發冒險') && !document.getElementById('btnEnterSandbox')) {
        const sbBtn = document.createElement('button');
        sbBtn.id = 'btnEnterSandbox';
        sbBtn.type = 'button';
        sbBtn.textContent = '🎯 木樁測試場';
        sbBtn.style.cssText = btn.style.cssText || 'padding:10px 20px;font-size:15px;font-weight:bold;border-radius:8px;cursor:pointer;';
        sbBtn.style.background = 'linear-gradient(135deg,#0284c7,#0369a1)';
        sbBtn.style.color = '#f0f9ff';
        sbBtn.style.border = '1.5px solid #38bdf8';
        sbBtn.style.marginLeft = '10px';
        sbBtn.onclick = enterSandboxArena;
        btn.parentElement.appendChild(sbBtn);
        break;
      }
    }
  })();

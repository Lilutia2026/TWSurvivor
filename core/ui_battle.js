// ============================================================================
// core/ui_battle.js — 局內 HUD、升級三選一、寶箱超武昇華、ESC 面板與 Tooltip
// ============================================================================

// [第 1 段：戰鬥 HUD 初始化、升級三選一與寶箱昇華（第 1 ～ 165 行）]
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
  
  function showBanner(text) {
    const b = document.getElementById('banner');
    b.textContent = text; b.style.display = 'block'; bannerTimer = 3.2;
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
          ownedSkills[c.evoSkillId] = { lv: 1, evolved: true, disabled: false };
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
    const curW = (typeof saveData !== 'undefined' && saveData.equip) ? saveData.equip.weapon : null;
    const curWType = curW ? curW.type : null;
    const curCharId = (typeof saveData !== 'undefined' && saveData.charId) ? saveData.charId : 'lucien';
    const sigSkill = typeof getWeaponSignatureSkill === 'function' ? getWeaponSignatureSkill(curW) : (curW ? curW.startSkill : null);
    const isSwordType = ['longsword', 'blade', 'rapier', 'tachi', 'greatsword'].includes(curWType);

    const ready = Object.entries(ownedSkills).filter(([k, st]) => {
      const sk = ACTIVE_SKILLS[k];
      if (!sk || !sk.canEvolve || st.evolved || st.disabled || st.lv < sk.maxLv) return false;
      if (!sk.reqPassive || !ownedPassives[sk.reqPassive]) return false;
      if (sk.reqWeaponType && curWType !== sk.reqWeaponType) return false;
      // 戰士劍類鐵則：唯有綁定當前武器本命技能的招式才具備超武昇華資格
      if (isSwordType && sigSkill && k !== sigSkill) return false;
      return true;
    });
    if (ready.length > 0) {
      hideSkillTooltip(); isPaused = true;
      currentChoices = ready.slice(0, 3).map(([id]) => {
        const sk = ACTIVE_SKILLS[id];
        const charEvo = (sk.evoByChar && sk.evoByChar[curCharId]) ? sk.evoByChar[curCharId] : null;
        const targetEvoId = charEvo ? charEvo.evoSkillId : sk.evoSkillId;
        const evoSk = targetEvoId ? ACTIVE_SKILLS[targetEvoId] : null;
        const titleName = charEvo ? charEvo.evoName : (sk.evoName || sk.name);
        const cleanDesc = (evoSk && evoSk.desc) ? evoSk.desc : (sk.evoDesc || sk.desc);
        return { kind: 'evolve', id, targetEvoId, title: `🌟 技能昇華【${titleName}】`, desc: cleanDesc, tag: '唯一超武昇華' };
      });
      renderChoiceModal('📦 開啟金色昇華寶箱！請選擇要昇華的技能（按 1 / 2 / 3）');
      return;
    }
    player.hp = Math.min(player.maxHp, player.hp + 50);
    showBanner('📦 開啟金色寶箱！生命回復 +50');
  }

// [第 2 段：戰鬥與面板懸浮說明氣泡 Tooltip（接續第 165 行至第 238 行）]
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
      const curStatusText = getSkillCurrentStatusText(id, sk, st.lv, isEvo);
      const partnerId = sk.resonancePartner || sk.resonanceSkill;
      const isResActive = !partnerId || !!ownedSkills[partnerId];
      const resLine = (isEvo && sk.resonanceDesc)
        ? `<div style="margin-top:5px;padding-top:4px;border-top:1px dashed #334155;color:${isResActive ? '#4ade80' : '#64748b'};">${isResActive ? '✨【元素共鳴・已啟動】' : '🔒【元素共鳴・未啟動】'}${sk.resonanceDesc}</div>`
        : '';
      const descText = (isEvo && sk.evoDesc) ? sk.evoDesc : sk.desc;
      tip.innerHTML = `<div style="font-weight:bold;color:#fde047;font-size:13px;margin-bottom:4px;">${isEvo ? (sk.evoName || sk.name) : sk.name}（LV.${st.lv}）</div><div>預估基傷：<strong>${rawDmg}</strong> ｜ 實際冷卻：<strong>${realCd} 秒</strong></div><div style="color:#4ade80;font-weight:bold;margin-top:3px;">目前狀態：${curStatusText}</div><div style="color:#cbd5e1;margin-top:3px;">${descText}</div>${resLine}`;
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
        extraProj: '🚀 射彈增加：所有帶有【射彈】標籤的技能額外增加發射數量（來自裝備詞綴）。',
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
  // [第 3 段：ESC 即時狀態面板 togglePause 與遊戲結算 endGame（接續第 238 行至檔案結尾）]
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
        { id: 'dur', l: '異常時長', v: `+${Math.round(((cs.statusDurMult || 1) - 1) * 100)}%`, c: '#38bdf8' },
        { id: 'chance', l: '異常機率', v: `${Math.min(85, 10 + (cs.statusChanceBonus || 0) * 100).toFixed(1)}%`, c: '#c084fc' },
        { id: 'exp', l: '經驗獲取', v: `${Math.round(player.expMult * 100)}%`, c: '#38bdf8' }, { id: 'pickup', l: '拾取範圍', v: `${cs.pickupRange || 115}`, c: '#2dd4bf' },
        { id: 'extraProj', l: '射彈增加', v: `+${cs.extraProj || 0} 發`, c: '#fbbf24' }, { id: 'seedMult', l: '💰 貨幣獲取', v: `${Math.round((player.seedMult || 1.0) * 100)}%`, c: '#facc15' },
        { id: 'curseMult', l: '💀 詛咒倍率', v: `${Math.round((player.curseMult || 1.0) * 100)}%`, c: '#f87171' }
      ];
      const combatGridHtml = cRows.map(r => `<div style="cursor:help;display:flex;justify-content:space-between;align-items:center;background:rgba(15,23,42,0.75);border:1px solid #334155;border-radius:5px;padding:4px 8px;" onmouseenter="showSkillTooltip(event,'stat','${r.id}')" onmousemove="moveSkillTooltip(event)" onmouseleave="hideSkillTooltip()"><span style="font-size:11px;color:#94a3b8;">${r.l}</span><strong style="font-size:12px;color:${r.c};">${r.v}</strong></div>`).join('');
  
      const skillBadges = Object.entries(ownedSkills).map(([k, v]) => {
        const sk = ACTIVE_SKILLS[k] || { name: k };
        const dispName = v.evolved ? (sk.evoName || sk.name) : sk.name;
        const iconChar = (v.evolved && sk.evoIcon) ? sk.evoIcon : (sk.icon || dispName.slice(0, 1));
        const isMax = v.lv >= (sk.maxLv || 10);
        const isEvo = !!(v.evolved || sk.isSuperWeapon);
        const lvText = v.disabled ? '已進化停用' : (isMax ? 'MAX' : `LV.${v.lv}/${sk.maxLv || 10}`);
        const curStatus = getSkillCurrentStatusText(k, sk, v.lv, isEvo);
        const dim = v.disabled ? 'opacity:0.4;filter:grayscale(1);border-color:#475569;' : (v.evolved ? 'border-color:#facc15;background:rgba(180,83,9,0.35);' : 'border-color:#38bdf8;background:rgba(15,23,42,0.85);');
        return `<div style="cursor:help;display:flex;align-items:center;gap:10px;border:1.5px solid;${dim}border-radius:8px;padding:6px 10px;" onmouseenter="showSkillTooltip(event,'skill','${k}')" onmousemove="moveSkillTooltip(event)" onmouseleave="hideSkillTooltip()">
          <div style="width:36px;height:36px;border-radius:6px;background:rgba(30,41,59,0.95);border:1px solid #475569;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${iconChar}</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;"><strong style="font-size:13px;color:#fef08a;">${dispName}</strong><span style="font-size:11px;font-weight:bold;color:${isMax ? '#4ade80' : '#38bdf8'};">${lvText}</span></div>
            <div style="font-size:11px;color:#4ade80;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">目前狀態：${curStatus}</div>
            <div style="font-size:11px;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;">${sk.desc || ''}</div>
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
  
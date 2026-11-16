// 八大元素共鳴底層規則資料庫（每系嚴格限定 2 種核心表現，零重疊）
const ELEMENT_RESONANCE_DB = {
    fire:    { id: 'fire',    name: '🔥 火系共鳴', p1: '【點燃】每0.5秒持續灼燒扣血', p2: '【爆破擴散】擊殺點燃敵人引發範圍爆炸並傳染' },
    ice:     { id: 'ice',     name: '❄️ 冰系共鳴', p1: '【凍結】完全冰封定身在原地', p2: '【碎冰衝擊】攻擊凍結目標觸發高額碎冰傷與濺射' },
    thunder: { id: 'thunder', name: '⚡ 雷系共鳴', p1: '【感電】物理技能命中時必定觸發暴擊', p2: '【連鎖電弧】命中時向附近敵人彈跳連鎖閃電' },
    wind:    { id: 'wind',    name: '🌀 風系共鳴', p1: '【遲緩】純粹降低目標移動速度', p2: '【真空風刃延伸】快刀命中額外射出穿透風刃延伸連擊' },
    dark:    { id: 'dark',    name: '🌑 黑魔法共鳴', p1: '【詛咒破防】削弱目標防禦抗性，承受全傷害提高', p2: '【暗影吸血】攻擊受詛咒敵人時回復自身生命' },
    light:   { id: 'light',   name: '✨ 白魔法共鳴', p1: '【神聖庇護】生成減傷護盾降低受擊傷害', p2: '【聖光淨化】對精英怪與首領造成額外神聖增傷' },
    earth:   { id: 'earth',   name: '🪨 大地系共鳴', p1: '【震盪眩暈】超強擊退與短暫眩暈打斷衝鋒', p2: '【岩刺余震】重擊落地產生尖銳岩刺二次範圍傷害' },
    none:    { id: 'none',    name: '⚪ 無屬性共鳴', p1: '【無雙連斬】賦予招式額外連擊段數', p2: '【破勢暴傷】暴擊傷害倍率額外突破上限' }
  };
  
  // 初始化怪物身上的八大元素異常狀態欄位
  function initEnemyStatus(enemy) {
    enemy.burnTimer = 0; enemy.burnTick = 0;     // 火系：點燃
    enemy.freezeTimer = 0;                       // 冰系：凍結
    enemy.shockTimer = 0;                        // 雷系：感電
    enemy.slowTimer = 0;                         // 風系：遲緩
    enemy.curseTimer = 0;                        // 黑魔法：詛咒破防
    enemy.stunTimer = 0;                         // 大地系：震盪眩暈
  }
  
  // 1. 攻擊命中前：計算元素共鳴對「傷害倍率、暴擊、破防、無屬性暴傷突破」的修正
  function calcResonanceHitMods(enemy, element, isPhysical, baseCritRate, baseCritDmg, statusCritMult) {
    let dmgMult = 1.0;
    let forceCrit = false;
    let critDmgBonus = 0;
  
    // 雷系表現1：【感電】物理技命中必暴擊
    if (isPhysical && enemy.shockTimer > 0) {
      forceCrit = true;
      dmgMult *= statusCritMult;
    }
    // 冰系表現2：【碎冰衝擊】攻擊凍結敵人觸發額外高額碎冰傷
    if (enemy.freezeTimer > 0) {
      dmgMult *= 1.45;
    }
    // 黑魔法表現1：【詛咒破防】承受全傷害提高 25%
    if (enemy.curseTimer > 0) {
      dmgMult *= 1.25;
    }
    // 白魔法表現2：【聖光淨化】對精英與首領額外增傷 30%
    if (element === 'light' && (enemy.isElite || enemy.isFinalBoss)) {
      dmgMult *= 1.30;
    }
    // 無屬性表現2：【破勢暴傷】暴擊傷害倍率額外 +40%（可突破上限）
    if (element === 'none') {
      critDmgBonus += 0.40;
    }
  
    const isCrit = forceCrit || (Math.random() < baseCritRate);
    if (isCrit) dmgMult *= (baseCritDmg + critDmgBonus);
    return { dmgMult, isCrit };
  }
  
  // 2. 攻擊命中後：賦予對應異常狀態與觸發第 2 種延伸表現（彈跳、延伸風刃、吸血、岩刺等）
  function applyResonanceOnHit(enemy, element, rawDmg, durMult = 1.0, callbacks = {}) {
    if (!enemy) return;
  
    if (element === 'fire') {
      enemy.burnTimer = Math.max(enemy.burnTimer, 3.0 * durMult); // 火系表現1：點燃
    } else if (element === 'ice') {
      enemy.freezeTimer = Math.max(enemy.freezeTimer, 1.8 * durMult); // 冰系表現1：凍結
      if (callbacks.onIceShatter && enemy.freezeTimer > 0) callbacks.onIceShatter(enemy, rawDmg * 0.4); // 冰系表現2：碎冰濺射
    } else if (element === 'thunder') {
      enemy.shockTimer = Math.max(enemy.shockTimer, 2.2 * durMult); // 雷系表現1：感電
      if (callbacks.onChainArc) callbacks.onChainArc(enemy, rawDmg * 0.55); // 雷系表現2：連鎖電弧彈跳
    } else if (element === 'wind') {
      enemy.slowTimer = Math.max(enemy.slowTimer, 2.5 * durMult); // 風系表現1：遲緩降速
      if (callbacks.onWindExtend) callbacks.onWindExtend(enemy, rawDmg * 0.5); // 風系表現2：真空風刃延伸
    } else if (element === 'dark') {
      enemy.curseTimer = Math.max(enemy.curseTimer, 4.0 * durMult); // 黑魔法表現1：詛咒破防
      if (callbacks.onDarkVamp) callbacks.onDarkVamp(2); // 黑魔法表現2：暗影吸血
    } else if (element === 'earth') {
      enemy.stunTimer = Math.max(enemy.stunTimer, 1.2 * durMult); // 大地表現1：震盪眩暈
      if (callbacks.onEarthSpike) callbacks.onEarthSpike(enemy, rawDmg * 0.5); // 大地表現2：岩刺余震
    }
  }
  
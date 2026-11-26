// 全 8 位經典角色《天翼之鍊》原版完整技能查閱母檔
const RAW_TW_SKILLS_DB = {
    lucien: {
      flame_burn:    { name: '燃焰術',       xien: '火焰系', stat: 'MR',        req: '無',                   sharedBy: ['ispin', 'tichiel'], tags: ['shared'] },
      fire_arrow:    { name: '火箭術',       xien: '火焰系', stat: 'INT',       req: '燃焰術(1)',            sharedBy: ['ispin', 'tichiel'], tags: ['shared', 'selected'] },
      speed_up:      { name: '疾速術',       xien: '風系',   stat: 'MR',        req: '無',                   sharedBy: ['maximin'],          tags: ['shared'] },
      slow_down:     { name: '遲緩術',       xien: '風系',   stat: 'MR',        req: '無',                   sharedBy: ['maximin'],          tags: ['shared'] },
      wind_blade:    { name: '龍捲刃術',     xien: '風系',   stat: 'INT',       req: '無',                   sharedBy: ['maximin'],          tags: ['shared'] },
      gravity:       { name: '重力術',       xien: '風系',   stat: '-',         req: '無',                   sharedBy: [],                   tags: ['二轉'] },
      electric:      { name: '電擊術',       xien: '電擊系', stat: 'MR',        req: '無',                   sharedBy: ['maximin', 'naya', 'tichiel'], tags: ['shared'] },
      paralyze:      { name: '麻痺術',       xien: '電擊系', stat: 'MR',        req: '無',                   sharedBy: ['maximin', 'naya', 'tichiel'], tags: ['shared'] },
      thunder_bolt:  { name: '落雷術',       xien: '電擊系', stat: 'INT',       req: '無',                   sharedBy: ['maximin', 'naya', 'tichiel'], tags: ['shared', 'selected'] },
      zeni_throw:    { name: '金錢鏢',       xien: '共通系', stat: 'SEED',      req: '無',                   sharedBy: ['ispin', 'maximin', 'naya', 'sivelin', 'boris', 'mila', 'tichiel'], tags: ['shared'] },
      lagrange_fast: { name: '萊格藍治快劍術', xien: '共通系', stat: 'MR',      req: '無',                   sharedBy: [],                   tags: [] },
      lagrange_guard:{ name: '萊格藍治之護', xien: '共通系', stat: '-',         req: '萊格藍治快劍術(5)',    sharedBy: [],                   tags: [] },
      thrust_basic:  { name: '@刺劍式',      xien: '劍技系', stat: 'STAB',      req: '無',                   sharedBy: [],                   tags: ['basic_atk'] },
      aurora_thrust: { name: '極光刺刃',     xien: '劍技系', stat: 'STAB',      req: '無',                   sharedBy: ['ispin'],            tags: ['shared'] },
      senku:         { name: '閃空烈破',     xien: '劍技系', stat: 'HACK+STAB', req: '無',                   sharedBy: ['ispin'],            tags: ['shared'] },
      senku_fire:    { name: '閃空翔烈破',   xien: '劍技系', stat: 'HACK+STAB', req: '無',                   sharedBy: [],                   tags: [] },
      wind_storm:    { name: '狂風暴襲',     xien: '劍技系', stat: 'HACK+STAB', req: '龍捲刃術(15)+閃空翔烈破(1)', sharedBy: [],             tags: ['二轉'] },
      raijin:        { name: '衝雷',         xien: '劍技系', stat: 'STAB',      req: '電擊術(5)+極光刺刃(30)', sharedBy: [],                 tags: ['二轉'] },
      slash_h_basic: { name: '@橫切斬',      xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: ['boris'],            tags: ['basic_atk', 'shared'] },
      slash_v_basic: { name: '@縱切斬',      xien: '刀技系', stat: 'STAB+HACK', req: '無',                   sharedBy: ['boris'],            tags: ['basic_atk', 'shared'] },
      renga:         { name: '連牙斬',       xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: ['ispin', 'maximin', 'naya', 'boris'], tags: ['shared'] },
      enbu:          { name: '圓月斬',       xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: ['boris'],            tags: ['shared'] },
      enbu_dance:    { name: '圓舞',         xien: '刀技系', stat: 'HACK',      req: '連牙斬(30)+圓月斬(1)', sharedBy: [],                   tags: ['二轉'] }
    },
    
    tichiel: {
        flash_strike:  { name: '閃光擊',       xien: '無屬性', stat: 'INT',       req: '無',                   sharedBy: [],                   tags: [] },
        teleport:      { name: '傳送術',       xien: '無屬性', stat: '-',         req: '無',                   sharedBy: [],                   tags: ['二轉'] },
        spirit_kiss:   { name: '精靈之吻',     xien: '無屬性', stat: '-',         req: '無',                   sharedBy: [],                   tags: ['二轉'] },
        flame_burn:    { name: '燃焰術',       xien: '火焰系', stat: 'MR',        req: '無',                   sharedBy: ['lucien', 'ispin'],  tags: ['shared'] },
        fire1:         { name: '火箭術',       xien: '火焰系', stat: 'INT',       req: '燃焰術(1)',            sharedBy: ['lucien', 'ispin'],  tags: ['shared', 'selected'] },
        fire2:         { name: '火球術',       xien: '火焰系', stat: 'INT',       req: '火箭術(5)',            sharedBy: [],                   tags: ['selected'] },
        fire3:         { name: '火炎之玉',     xien: '火焰系', stat: 'INT',       req: '火箭術(10)+火球術(8)', sharedBy: [],                   tags: ['selected'] },
        fire4:         { name: '火炎隕石術',   xien: '火焰系', stat: 'INT',       req: '火箭術(15)+火球術(10)+火炎之玉(8)', sharedBy: [],       tags: ['selected'] },
        ice_freeze:    { name: '冰凍術',       xien: '冰結系', stat: 'MR',        req: '無',                   sharedBy: ['naya', 'boris'],    tags: ['shared'] },
        ice1:          { name: '冰彈術',       xien: '冰結系', stat: 'INT',       req: '冰凍術(1)',            sharedBy: ['naya', 'boris'],    tags: ['shared', 'selected'] },
        ice2:          { name: '冰霧術',       xien: '冰結系', stat: 'INT',       req: '冰彈術(5)',            sharedBy: ['boris'],            tags: ['shared', 'selected'] },
        ice3:          { name: '冰晶術',       xien: '冰結系', stat: 'INT',       req: '冰彈術(10)+冰霧術(8)', sharedBy: ['boris'],            tags: ['shared', 'selected'] },
        ice4:          { name: '冰之散晶術',   xien: '冰結系', stat: 'INT',       req: '冰彈術(15)+冰霧術(10)+冰晶術(8)', sharedBy: [],        tags: ['selected'] },
        electric:      { name: '電擊術',       xien: '電擊系', stat: 'MR',        req: '無',                   sharedBy: ['lucien', 'maximin', 'naya'], tags: ['shared'] },
        paralyze:      { name: '麻痺術',       xien: '電擊系', stat: 'MR',        req: '無',                   sharedBy: ['lucien', 'maximin', 'naya'], tags: ['shared'] },
        thunder2:      { name: '環電術',       xien: '電擊系', stat: 'MR',        req: '無',                   sharedBy: ['maximin'],          tags: ['shared', 'selected'] },
        thunder1:      { name: '落雷術',       xien: '電擊系', stat: 'INT',       req: '無',                   sharedBy: ['lucien', 'maximin', 'naya'], tags: ['shared', 'selected'] },
        thunder4:      { name: '狂雷術',       xien: '電擊系', stat: 'INT',       req: '落雷術(5)',            sharedBy: ['maximin'],          tags: ['shared', 'selected'] },
        thunder3:      { name: '雷球術',       xien: '電擊系', stat: 'INT',       req: '落雷術(10)',           sharedBy: ['maximin'],          tags: ['shared', 'selected'] },
        blessing:      { name: '祝福',         xien: '白魔系', stat: 'MR',        req: '無',                   sharedBy: ['ispin'],            tags: ['shared', 'selected'] },
        heal_ally:     { name: '治療術',       xien: '白魔系', stat: 'MR',        req: '祝福(1)',              sharedBy: [],                   tags: [] },
        healLight:     { name: '治癒術',       xien: '白魔系', stat: 'MR',        req: '治療術(1)',            sharedBy: [],                   tags: ['selected'] },
        holylight:     { name: '神聖之光',     xien: '白魔系', stat: 'MR',        req: '治癒術(1)',            sharedBy: [],                   tags: ['selected'] },
        divine_prayer: { name: '神之祈禱',     xien: '白魔系', stat: 'MR',        req: '祝福(5)+光耀術(1)',    sharedBy: [],                   tags: [] },
        holypoly:      { name: '光之聚咒',     xien: '白魔系', stat: 'MR',        req: '神聖之光(20)+光輝紋章(10)', sharedBy: [],          tags: ['selected'] },
        cure_status:   { name: '痊愈術',       xien: '白魔系', stat: '-',         req: '無',                   sharedBy: ['ispin'],            tags: ['shared'] },
        shining_aura:  { name: '光耀術',       xien: '白魔系', stat: 'MR',        req: '治癒術(4)',            sharedBy: [],                   tags: [] },
        lightWall:     { name: '光之壁障術',   xien: '白魔系', stat: 'MR',        req: '無',                   sharedBy: [],                   tags: ['selected'] },
        angelWish:     { name: '天使之願',     xien: '白魔系', stat: 'MR',        req: '光耀術(4)',            sharedBy: [],                   tags: ['selected'] },
        magicShield:   { name: '魔法盾牌',     xien: '白魔系', stat: 'MR',        req: '治癒術(1)',            sharedBy: [],                   tags: ['selected'] },
        radiance:      { name: '光輝紋章',     xien: '白魔系', stat: 'MR',        req: '光耀術(8)',            sharedBy: [],                   tags: ['selected'] },
        zeni_throw:    { name: '金錢鏢',       xien: '共通系', stat: 'SEED',      req: '無',                   sharedBy: ['lucien', 'ispin', 'maximin', 'naya', 'sivelin', 'boris', 'mila'], tags: ['shared'] },
        ignore_def:    { name: '防禦無視',     xien: '共通系', stat: '-',         req: '無',                   sharedBy: [],                   tags: ['二轉'] },
        ignore_eva:    { name: '迴避無視',     xien: '共通系', stat: '-',         req: '無',                   sharedBy: [],                   tags: ['二轉'] },
        mace_basic:    { name: '擊槌',         xien: '打擊系', stat: 'STAB+HACK', req: '無',                   sharedBy: [],                   tags: ['basic_atk'] },
        armorbreak:    { name: '破壞盔甲',     xien: '打擊系', stat: 'STAB+HACK', req: '無',                   sharedBy: [],                   tags: ['selected'] },
        frenzyhammer:  { name: '失意狂擊',     xien: '打擊系', stat: 'STAB+HACK', req: '破壞盔甲(10)',         sharedBy: [],                   tags: ['selected'] }
      },
    
      ispin: {
        flame_burn:    { name: '燃焰術',       xien: '火焰系', stat: 'MR',        req: '無',                   sharedBy: ['lucien', 'tichiel'], tags: ['shared'] },
        fire_arrow:    { name: '火箭術',       xien: '火焰系', stat: 'INT',       req: '燃焰術(1)',            sharedBy: ['lucien', 'tichiel'], tags: ['shared', 'selected'] },
        stone_blade:   { name: '石刃術',       xien: '地系',   stat: 'INT',       req: '無',                   sharedBy: ['boris'],             tags: ['shared'] },
        blessing:      { name: '祝福',         xien: '白魔系', stat: 'MR',        req: '無',                   sharedBy: ['tichiel'],           tags: ['shared', 'selected'] },
        orlanne_guard: { name: '奧蘭尼的加護', xien: '白魔系', stat: 'MR',        req: '無',                   sharedBy: [],                    tags: [] },
        self_heal:     { name: '自療術',       xien: '白魔系', stat: 'MR',        req: '無',                   sharedBy: [],                    tags: [] },
        magic_wall:    { name: '魔法光壁',     xien: '白魔系', stat: 'MR',        req: '奧蘭尼的加護(5)',      sharedBy: [],                    tags: [] },
        cure_status:   { name: '痊愈術',       xien: '白魔系', stat: '-',         req: '無',                   sharedBy: ['tichiel'],           tags: ['shared'] },
        zeni_throw:    { name: '金錢鏢',       xien: '共通系', stat: 'SEED',      req: '無',                   sharedBy: ['lucien', 'maximin', 'naya', 'sivelin', 'boris', 'mila', 'tichiel'], tags: ['shared'] },
        sword_control: { name: '御劍術',       xien: '共通系', stat: '-',         req: '奧蘭尼的加護(5)',      sharedBy: [],                    tags: [] },
        v_slash:       { name: '@V字斬',       xien: '劍技系', stat: 'STAB+HACK', req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        point_thrust:  { name: '@點刺劍式',    xien: '劍技系', stat: 'STAB',      req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        aurora_thrust: { name: '極光刺刃',     xien: '劍技系', stat: 'STAB',      req: '無',                   sharedBy: ['lucien'],            tags: ['shared'] },
        counter_spear: { name: '逆矛',         xien: '劍技系', stat: 'STAB',      req: '極光刺刃(30)',         sharedBy: [],                    tags: [] },
        cross_slash:   { name: '十字斬',       xien: '劍技系', stat: 'STAB+HACK', req: '無',                   sharedBy: [],                    tags: [] },
        senku:         { name: '閃空烈破',     xien: '劍技系', stat: 'HACK+STAB', req: '無',                   sharedBy: ['lucien'],            tags: ['shared'] },
        holy_cross:    { name: '聖十字斬',     xien: '劍技系', stat: 'STAB+HACK', req: '十字斬(10)',           sharedBy: [],                    tags: [] },
        gale_shot:     { name: '疾風射',       xien: '劍技系', stat: 'STAB',      req: '極光刺刃(30)+逆矛(1)', sharedBy: [],                    tags: ['二轉'] },
        tri_slash:     { name: '@三角斬',      xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        renga:         { name: '連牙斬',       xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: ['lucien', 'maximin', 'naya', 'boris'], tags: ['shared'] },
        flame_pillar:  { name: '火炎之柱',     xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: [],                    tags: [] },
        petal_dance:   { name: '散花舞',       xien: '刀技系', stat: 'HACK',      req: '連牙斬(30)',           sharedBy: [],                    tags: ['二轉'] }
      },
    
      boris: {
        ice_slash_v:   { name: '@冰切斬',      xien: '冰結系', stat: 'INT+HACK',  req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        ice_slash_h:   { name: '@冰結斬',      xien: '冰結系', stat: 'INT+HACK+STAB', req: '無',               sharedBy: [],                    tags: ['basic_atk'] },
        ice_freeze:    { name: '冰凍術',       xien: '冰結系', stat: 'MR',        req: '無',                   sharedBy: ['naya', 'tichiel'],   tags: ['shared'] },
        ice1:          { name: '冰彈術',       xien: '冰結系', stat: 'INT',       req: '無',                   sharedBy: ['naya', 'tichiel'],   tags: ['shared', 'selected'] },
        ice2:          { name: '冰霧術',       xien: '冰結系', stat: 'INT',       req: '冰彈術(5)',            sharedBy: ['tichiel'],           tags: ['shared', 'selected'] },
        ice3:          { name: '冰晶術',       xien: '冰結系', stat: 'INT',       req: '冰彈術(10)+冰霧術(8)', sharedBy: ['tichiel'],           tags: ['shared', 'selected'] },
        ice_mirror:    { name: '凝影冰心',     xien: '冰結系', stat: 'INT',       req: '冰凍術(5)',            sharedBy: [],                    tags: [] },
        ice_seal:      { name: '冰花影封',     xien: '冰結系', stat: 'HACK+INT',  req: '冰凍術(5)+冰擊斬(5)',  sharedBy: [],                    tags: ['二轉'] },
        stone_blade:   { name: '石刃術',       xien: '地系',   stat: 'INT',       req: '無',                   sharedBy: ['ispin'],             tags: ['shared'] },
        earth_wall:    { name: '大地之壁',     xien: '地系',   stat: '-',         req: '無',                   sharedBy: [],                    tags: [] },
        dark_blind:    { name: '暗黑術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['maximin', 'naya'],   tags: ['shared'] },
        dark_curse:    { name: '暗咒術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['maximin', 'naya'],   tags: ['shared'] },
        dark_poison:   { name: '暗毒術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['maximin', 'naya'],   tags: ['shared'] },
        dark_undead:   { name: '不死術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['maximin', 'naya'],   tags: ['shared'] },
        dark_weaken:   { name: '衰弱術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['maximin'],           tags: ['shared'] },
        red_moon_oath: { name: '紅月之誓',     xien: '黑魔系', stat: '-',         req: '無',                   sharedBy: [],                    tags: ['二轉'] },
        zeni_throw:    { name: '金錢鏢',       xien: '共通系', stat: 'SEED',      req: '無',                   sharedBy: ['lucien', 'ispin', 'maximin', 'naya', 'sivelin', 'mila', 'tichiel'], tags: ['shared'] },
        counter_atk:   { name: '反擊',         xien: '共通系', stat: '-',         req: '無',                   sharedBy: [],                    tags: [] },
        slash_h_basic: { name: '@橫切斬',      xien: '劍技系', stat: 'HACK+STAB', req: '無',                   sharedBy: ['lucien'],            tags: ['basic_atk', 'shared'] },
        crit_sword:    { name: '暴擊劍式',     xien: '劍技系', stat: 'HACK+STAB', req: '無',                   sharedBy: ['maximin'],           tags: ['shared'] },
        earth_quake:   { name: '爆怒地烈破',   xien: '劍技系', stat: 'HACK+STAB', req: '暴擊劍式(30)',         sharedBy: [],                    tags: [] },
        shadow_sword:  { name: '殘影劍式',     xien: '劍技系', stat: 'HACK+STAB+INT', req: '無',               sharedBy: [],                    tags: [] },
        sky_earth_wave:{ name: '天地震烈波',   xien: '劍技系', stat: 'HACK+STAB', req: '暴擊劍式(30)+爆怒地烈破(1)', sharedBy: [],          tags: [] },
        slash_v_basic: { name: '@縱切斬',      xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: ['lucien'],            tags: ['basic_atk', 'shared'] },
        renga:         { name: '連牙斬',       xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: ['lucien', 'ispin', 'maximin', 'naya'], tags: ['shared'] },
        enbu:          { name: '圓月斬',       xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: ['lucien'],            tags: ['shared'] },
        ice_strike:    { name: '冰擊斬',       xien: '刀技系', stat: 'INT+HACK',  req: '無',                   sharedBy: [],                    tags: [] },
        ice_breaker:   { name: '冰晶破魔斬',   xien: '刀技系', stat: 'INT+HACK',  req: '連牙斬(30)+冰擊斬(1)', sharedBy: [],                    tags: ['二轉'] }
      },
    
      maximin: {
        wind_slash_v:  { name: '@風裂斬',      xien: '風系',   stat: 'INT+HACK',  req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        wind_slash_h:  { name: '@風切斬',      xien: '風系',   stat: 'INT+HACK+STAB', req: '無',               sharedBy: [],                    tags: ['basic_atk'] },
        speed_up:      { name: '疾速術',       xien: '風系',   stat: 'MR',        req: '無',                   sharedBy: ['lucien'],            tags: ['shared'] },
        slow_down:     { name: '遲緩術',       xien: '風系',   stat: 'MR',        req: '無',                   sharedBy: ['lucien'],            tags: ['shared'] },
        wind_spirit:   { name: '風精召喚術',   xien: '風系',   stat: 'MR',        req: '無',                   sharedBy: [],                    tags: [] },
        wind_blade:    { name: '龍捲刃術',     xien: '風系',   stat: 'INT',       req: '無',                   sharedBy: ['lucien'],            tags: ['shared'] },
        yin_yang:      { name: '倒轉陰陽',     xien: '風系',   stat: 'MR',        req: '無',                   sharedBy: [],                    tags: [] },
        electric:      { name: '電擊術',       xien: '電擊系', stat: 'MR',        req: '無',                   sharedBy: ['lucien', 'naya', 'tichiel'], tags: ['shared'] },
        paralyze:      { name: '麻痺術',       xien: '電擊系', stat: 'MR',        req: '無',                   sharedBy: ['lucien', 'naya', 'tichiel'], tags: ['shared'] },
        thunder2:      { name: '環電術',       xien: '電擊系', stat: 'MR',        req: '無',                   sharedBy: ['tichiel'],           tags: ['shared', 'selected'] },
        thunder1:      { name: '落雷術',       xien: '電擊系', stat: 'INT',       req: '無',                   sharedBy: ['lucien', 'naya', 'tichiel'], tags: ['shared', 'selected'] },
        thunder4:      { name: '狂雷術',       xien: '電擊系', stat: 'INT',       req: '落雷術(5)',            sharedBy: ['tichiel'],           tags: ['shared', 'selected'] },
        thunder3:      { name: '雷球術',       xien: '電擊系', stat: 'INT',       req: '落雷術(10)',           sharedBy: ['tichiel'],           tags: ['shared', 'selected'] },
        dark_blind:    { name: '暗黑術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['naya', 'boris'],     tags: ['shared'] },
        dark_curse:    { name: '暗咒術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['naya', 'boris'],     tags: ['shared'] },
        dark_poison:   { name: '暗毒術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['naya', 'boris'],     tags: ['shared'] },
        dark_undead:   { name: '不死術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['naya', 'boris'],     tags: ['shared'] },
        dark_weaken:   { name: '衰弱術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['boris'],             tags: ['shared'] },
        ghoul_bind:    { name: '怨靈之縛',     xien: '黑魔系', stat: 'MR',        req: '暗毒術(5)+不死術(5)',  sharedBy: [],                    tags: ['二轉'] },
        zeni_throw:    { name: '金錢鏢',       xien: '共通系', stat: 'SEED',      req: '無',                   sharedBy: ['lucien', 'ispin', 'naya', 'sivelin', 'boris', 'mila', 'tichiel'], tags: ['shared'] },
        focus_hit:     { name: '集中',         xien: '共通系', stat: 'MR',        req: '無',                   sharedBy: [],                    tags: [] },
        wild_sleep:    { name: '露宿荒野',     xien: '共通系', stat: 'MR',        req: '無',                   sharedBy: [],                    tags: ['二轉'] },
        taunt:         { name: '嘲諷',         xien: '共通系', stat: 'MR',        req: '無',                   sharedBy: [],                    tags: [] },
        swift_sword:   { name: '@激劍式',      xien: '劍技系', stat: 'STAB+HACK', req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        crit_sword:    { name: '暴擊劍式',     xien: '劍技系', stat: 'STAB+HACK', req: '無',                   sharedBy: ['boris'],             tags: ['shared'] },
        azure_dragon:  { name: '青龍怒哮',     xien: '劍技系', stat: 'STAB+HACK', req: '暴擊劍式(30)+風輪斬(1)', sharedBy: [],                  tags: ['二轉'] },
        poison_slash:  { name: '毒斬',         xien: '劍技系', stat: 'HACK+INT+STAB', req: '無',               sharedBy: [],                    tags: [] },
        thunder_sword: { name: '雷電劍',       xien: '劍技系', stat: 'HACK+INT+STAB', req: '無',               sharedBy: [],                    tags: [] },
        heavy_chop:    { name: '劈砍',         xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        renga:         { name: '連牙斬',       xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: ['lucien', 'ispin', 'naya', 'boris'], tags: ['shared'] },
        petal_vortex:  { name: '氣漩飛花',     xien: '刀技系', stat: 'HACK',      req: '連牙斬(30)+風輪斬(1)', sharedBy: [],                    tags: [] },
        charge_slash:  { name: '聚氣斬',       xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: [],                    tags: [] },
        full_moon:     { name: '滿月斬',       xien: '刀技系', stat: 'INT+HACK',  req: '聚氣斬(30)',           sharedBy: [],                    tags: [] },
        wind_wheel:    { name: '風輪斬',       xien: '刀技系', stat: 'INT+HACK',  req: '無',                   sharedBy: [],                    tags: [] }
      },
    
      naya: {
        ice_freeze:    { name: '冰凍術',       xien: '冰結系', stat: 'MR',        req: '無',                   sharedBy: ['boris', 'tichiel'],  tags: ['shared'] },
        ice1:          { name: '冰彈術',       xien: '冰結系', stat: 'INT',       req: '無',                   sharedBy: ['boris', 'tichiel'],  tags: ['shared', 'selected'] },
        electric:      { name: '電擊術',       xien: '電擊系', stat: 'MR',        req: '無',                   sharedBy: ['lucien', 'maximin', 'tichiel'], tags: ['shared'] },
        paralyze:      { name: '麻痺術',       xien: '電擊系', stat: 'MR',        req: '無',                   sharedBy: ['lucien', 'maximin', 'tichiel'], tags: ['shared'] },
        thunder1:      { name: '落雷術',       xien: '電擊系', stat: 'INT',       req: '無',                   sharedBy: ['lucien', 'maximin', 'tichiel'], tags: ['shared', 'selected'] },
        dark_blind:    { name: '暗黑術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['maximin', 'boris'],  tags: ['shared'] },
        dark_curse:    { name: '暗咒術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['maximin', 'boris'],  tags: ['shared'] },
        dark_poison:   { name: '暗毒術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['maximin', 'boris'],  tags: ['shared'] },
        dark_undead:   { name: '不死術',       xien: '黑魔系', stat: 'MR',        req: '無',                   sharedBy: ['maximin', 'boris'],  tags: ['shared'] },
        zeni_throw:    { name: '金錢鏢',       xien: '共通系', stat: 'SEED',      req: '無',                   sharedBy: ['lucien', 'ispin', 'maximin', 'sivelin', 'boris', 'mila', 'tichiel'], tags: ['shared'] },
        leaf_ninja:    { name: '@木葉隱忍術',  xien: '共通系', stat: '-',         req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        ghost_bind:    { name: '幽靈縛搏術',   xien: '共通系', stat: 'MR',        req: '無',                   sharedBy: [],                    tags: [] },
        ninja_trap:    { name: '忍術・隱爆',   xien: '共通系', stat: '-',         req: '忍術・投爆(1)',        sharedBy: [],                    tags: ['二轉'] },
        ninja_quake:   { name: '忍術・震',     xien: '共通系', stat: 'STAB+HACK', req: '無',                   sharedBy: [],                    tags: [] },
        swallow_dual:  { name: '@双燕訣',      xien: '劍技系', stat: 'HACK+STAB', req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        twin_dragon:   { name: '@双龍閃',      xien: '劍技系', stat: 'STAB',      req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        sword_qi:      { name: '劍氣',         xien: '劍技系', stat: 'STAB',      req: '無',                   sharedBy: [],                    tags: [] },
        pierce_qi:     { name: '貫氣劍式',     xien: '劍技系', stat: 'STAB',      req: '劍氣(30)',             sharedBy: [],                    tags: [] },
        ninja_flash:   { name: '忍術・經',     xien: '劍技系', stat: 'STAB',      req: '劍氣(30)',             sharedBy: [],                    tags: [] },
        chop_blade:    { name: '@砍刀術',      xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        renga:         { name: '連牙斬',       xien: '刀技系', stat: 'HACK',      req: '無',                   sharedBy: ['lucien', 'ispin', 'maximin', 'boris'], tags: ['shared'] },
        ninja_burst:   { name: '忍術・爆',     xien: '刀技系', stat: 'HACK',      req: '手裡劍(10)',       sharedBy: [],                    tags: ['二轉'] },
        ninja_firebomb:{ name: '忍術・投爆',   xien: '打擊系', stat: '-',         req: '無',                   sharedBy: [],                    tags: ['二轉'] },
        shadow_clone:  { name: '影',           xien: '打擊系', stat: 'HACK+STAB', req: '無',                   sharedBy: [],                    tags: [] },
        heart_aim:     { name: '心',           xien: '打擊系', stat: 'HACK+STAB', req: '無',                   sharedBy: [],                    tags: [] },
        shuriken_throw:{ name: '手裡劍',   xien: '打擊系', stat: 'HACK+STAB', req: '無',                   sharedBy: [],                    tags: [] }
      },
    
        sivelin: {
          zeni_throw:       { name: '金錢鏢',       xien: '共通系', stat: 'SEED',      req: '無',                   sharedBy: ['lucien', 'ispin', 'maximin', 'naya', 'boris', 'mila', 'tichiel'], tags: ['shared'] },
          power_crest:      { name: '力量紋章',     xien: '共通系', stat: 'MR',        req: '無',                   sharedBy: [],                    tags: ['selected'] },
          provoke:          { name: '挑釁',         xien: '共通系', stat: '-',         req: '無',                   sharedBy: [],                    tags: ['selected'] },
          bronze_body:      { name: '銅體',         xien: '任務系', stat: 'DEF',       req: '力量紋章(5)',          sharedBy: [],                    tags: ['二轉'] },
          sky_fire_dragon:  { name: '舞天火龍閃',   xien: '任務系', stat: 'HACK',      req: '力量紋章(5)',          sharedBy: [],                    tags: ['selected'] },
          spear_basic:      { name: '@刺槍術',      xien: '槍技系', stat: 'STAB',      req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
          sky_whirl_spear:  { name: '迴天槍舞',     xien: '槍技系', stat: 'STAB',      req: '無',                   sharedBy: [],                    tags: ['selected'] },
          eight_whirl:      { name: '八旋舞槍訣',   xien: '槍技系', stat: 'STAB',      req: '無',                   sharedBy: [],                    tags: ['selected'] },
          flame_spear_dance:{ name: '烈燄舞槍訣',   xien: '槍技系', stat: 'STAB+HACK', req: '無',                   sharedBy: [],                    tags: ['selected'] },
          crimson_wave:     { name: '紅龍破嶽',     xien: '槍技系', stat: 'STAB',      req: '迴天槍舞(20)+烈燄舞槍訣(10)', sharedBy: [],          tags: ['selected'] },
          round_thrust:     { name: '@迴旋槍',      xien: '打擊系', stat: 'STAB+HACK', req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
          back_spear:       { name: '@回馬槍',      xien: '打擊系', stat: 'STAB+HACK', req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
          sweep_army:       { name: '橫掃千軍',     xien: '打擊系', stat: 'HACK',      req: '無',                   sharedBy: [],                    tags: [] },
          shining_spear:    { name: '閃耀刺槍訣',   xien: '打擊系', stat: 'HACK',      req: '無',                   sharedBy: [],                    tags: ['selected'] },
          swallow_spear:    { name: '飛燕連槍訣',   xien: '打擊系', stat: 'HACK',      req: '無',                   sharedBy: [],                    tags: ['selected'] },
          red_dragon_sky:   { name: '紅龍登天',     xien: '槍技系', stat: 'STAB+HACK', req: '閃耀刺槍訣(10)+烈燄舞槍訣(20)', sharedBy: [],        tags: ['二轉'] }
        }, 
    
      mila: {
        zeni_throw:    { name: '金錢鏢',       xien: '共通系', stat: 'SEED',      req: '無',                   sharedBy: ['lucien', 'ispin', 'maximin', 'naya', 'sivelin', 'boris', 'tichiel'], tags: ['shared'] },
        spirit_focus:  { name: '氣合',         xien: '共通系', stat: 'MR',        req: '無',                   sharedBy: [],                    tags: [] },
        red_shooter:   { name: '赤色射手的炮擊', xien: '共通系', stat: 'STAB+HACK', req: '怒目凝視(1)',          sharedBy: [],                    tags: ['二轉'] },
        glare_stare:   { name: '怒目凝視',     xien: '共通系', stat: '-',         req: '氣合(5)',              sharedBy: [],                    tags: ['二轉'] },
        back_whip:     { name: '@返手揮鞭術',  xien: '鞭系',   stat: 'STAB+HACK', req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        three_whip:    { name: '@三節鞭術',    xien: '鞭系',   stat: 'HACK',      req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        up_whip:       { name: '@上揚回鞭術',  xien: '鞭系',   stat: 'HACK',      req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        heat_wave:     { name: '@炎熱波',      xien: '鞭系',   stat: 'STAB',      req: '無',                   sharedBy: [],                    tags: ['basic_atk'] },
        thorn_whip:    { name: '刺鞭術',       xien: '鞭系',   stat: 'HACK',      req: '無',                   sharedBy: [],                    tags: [] },
        wind_whip_dnc: { name: '風輪回旋舞',   xien: '鞭系',   stat: 'STAB+HACK', req: '無',                   sharedBy: [],                    tags: [] },
        dice_whip:     { name: '骰子鞭',       xien: '鞭系',   stat: 'RANDOM',    req: '無',                   sharedBy: [],                    tags: [] },
        whirl_whip:    { name: '回旋鞭舞斬',   xien: '鞭系',   stat: 'HACK',      req: '無',                   sharedBy: [],                    tags: [] },
        crazy_whip:    { name: '狂鞭・虐',     xien: '鞭系',   stat: 'HACK',      req: '風輪回旋舞(10)+回旋鞭舞斬(30)', sharedBy: [],        tags: [] },
        heart_chain:   { name: '心鏈之舞',     xien: '打擊系', stat: 'STAB+HACK', req: '刺鞭術(30)',           sharedBy: [],                    tags: [] },
        card_dance:    { name: '卡片飛舞',     xien: '打擊系', stat: 'HACK+STAB', req: '無',                   sharedBy: [],                    tags: [] }
      }
    };
    
    // 批次新增自訂標籤（例如：addRawSkillTags('lucien', ['senku', 'renga'], ['selected'])）
    function addRawSkillTags(charId, skillKeys, newTags) {
      const charDb = RAW_TW_SKILLS_DB[charId];
      if (!charDb) return;
      for (const k of skillKeys) {
        if (charDb[k]) {
          for (const t of newTags) {
            if (!charDb[k].tags.includes(t)) charDb[k].tags.push(t);
          }
        }
      }
    }
    
    // 依條件篩選原版技能（支援指定角色、包含標籤、排除標籤）
    function queryRawSkills(charId = null, requiredTags = [], excludeTags = ['basic_atk']) {
      const targets = charId ? { [charId]: RAW_TW_SKILLS_DB[charId] } : RAW_TW_SKILLS_DB;
      const res = [];
      for (const [cid, skills] of Object.entries(targets)) {
        if (!skills) continue;
        for (const [key, sk] of Object.entries(skills)) {
          if (requiredTags.length > 0 && !requiredTags.every(t => sk.tags.includes(t))) continue;
          if (excludeTags.length > 0 && excludeTags.some(t => sk.tags.includes(t))) continue;
          res.push({ charId: cid, key, ...sk });
        }
      }
      return res;
    }
    
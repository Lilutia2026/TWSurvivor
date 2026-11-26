// 希培林．武（小武）專屬技能與被動庫（V3.1 統一大卡池雙向標籤定案版・共 14 張卡片）
const SIVELIN_PASSIVES = {
    powerCrest: {
      name: '🔥 力量紋章', reqChar: ['sivelin'], skillTags: ['sivelin_unique'], maxLv: 5,
      desc: '每級全物理技能最終傷害 +8%（獨立乘區，滿級 +40%）；代價：物理減傷 -4%、魔法減傷 -3%（最低降至 0%）（槍超武昇華鑰匙）'
    },
    crimsonHeart: {
      name: '🐉 紅蓮鬥氣', reqChar: ['sivelin'], skillTags: ['sivelin_unique'], maxLv: 5,
      desc: '每級連擊觸發率 +2.5%；擊殺帶有【點燃】或【破甲】的敵人回復最大生命 0.4%（冷卻 0.5 秒）（棍超武昇華鑰匙）'
    },
    crimsonReaper: {
      name: '💀 真紅的死神', reqChar: ['sivelin'], skillTags: ['sivelin_unique'], maxLv: 5,
      desc: '攻擊命中時獨立檢定 +5% 機率附加【點燃】（滿級 25%），【點燃】持續傷害 +8%'
    },
    provoke: {
      name: '💢 挑釁', reqChar: ['sivelin'], skillTags: ['sivelin_unique'], maxLv: 5,
      desc: '周身展開挑釁光圈，每 0.33 秒發動一次獨立機率檢定（每級 +6%，滿級 30%）附加【破甲】，光圈半徑每級擴大'
    },
    lanceCharge: {
      name: '⚡ 突進槍勢', reqChar: ['sivelin'], skillTags: ['sivelin_unique'], maxLv: 5,
      desc: '每級移動速度 +6%、近戰攻擊範圍 +5%、遠程槍氣射彈速度與距離 +8%'
    },
    bronzeBody: {
      name: '🛡️ 銅體', reqChar: ['sivelin'], skillTags: ['sivelin_unique'], reqJobTier: 2, maxLv: 5,
      desc: '【二轉技能】每級物理（碰撞）減傷 +3%、最大生命值 +5%（二轉超武昇華鑰匙）'
    }
  };
  
  const SIVELIN_SKILLS = {
    // === 希培林一轉基礎主動池（槍 spear / 棍 polearm 雙武器通用，超武依武器型態唯一鎖定） ===
    sky_whirl_spear: {
      name: '迴天槍舞', icon: '🐉', evoName: '紅龍破嶽', evoIcon: '🐲',
      reqChar: ['sivelin'], skillTags: ['spear_art'], reqWeaponTypes: ['spear', 'polearm'],
      type: 'physical', element: 'physical', statusTags: [], statTags: ['S'], behaviorTags: ['melee', 'aoe'], maxLv: 8,
      baseDmg: 25, perLv: 9, baseCd: 0.90, canEvolve: true, reqPassive: 'powerCrest', evoSkillId: 'crimson_wave', disableWhenEvo: true,
      evoDesc: '【槍技・物理・S・遠程・範圍】朝前方轟出中距離赤紅龍頭矩形衝擊波造成 3 段連擊；命中【破甲】敵人無視抗性並大幅提升暴傷。',
      desc: '【槍技・物理・S・近戰・範圍】高速舞槍連揮前方扇形敵群。'
    },
    shining_spear: {
        name: '閃耀刺槍訣', icon: '✨', evoName: '舞天火龍閃', evoIcon: '🌋',
        reqChar: ['sivelin'], skillTags: ['spear_art'], reqWeaponTypes: ['spear', 'polearm'],
        type: 'physical', element: 'physical', statusTags: [], statTags: ['H'], behaviorTags: ['melee', 'aoe'], maxLv: 8,
        baseDmg: 18, perLv: 6, baseCd: 1.25, canEvolve: true, reqPassive: 'crimsonHeart', evoSkillId: 'sky_fire_dragon', disableWhenEvo: true,
        evoDesc: '【打擊技・物理・火・H・近戰・範圍】以自身為中心 360° 捲起赤蓮火龍多段重擊周身敵群並附加【點燃】，擊殺【點燃】敵人引爆紅蓮爆碎。',
        desc: '【打擊技・物理・H・近戰・範圍】向前突刺出 3 道交錯閃耀槍陣。'
      },
      swallow_spear: {
        name: '飛燕連槍訣', icon: '🦅',
        reqChar: ['sivelin'], skillTags: ['spear_art'], reqWeaponTypes: ['spear', 'polearm'],
        type: 'physical', element: 'physical', statusTags: [], statTags: ['H'], behaviorTags: ['ranged', 'projectile'], maxLv: 8,
        baseDmg: 14, perLv: 4, dmgCurve: new Array(14, 18, 22, 26, 30, 34, 38, 44), baseCd: 1.25, canEvolve: false,
        desc: '【打擊技・物理・H・遠程・射彈】鎖定多名敵人發射燕影槍氣，擊中後分裂出 2 顆 50% 傷害的小型槍氣。'
      }, 
    flame_spear_dance: {
      name: '烈燄舞槍訣', icon: '🔥', evoName: '紅龍登天', evoIcon: '☄️',
      reqChar: ['sivelin'], skillTags: ['spear_art'], reqWeaponTypes: ['spear', 'polearm'],
      type: 'physical', element: 'fire', statusTags: ['fire'], statTags: ['S', 'H'], behaviorTags: ['melee', 'aoe'], maxLv: 8,
      baseDmg: 24, perLv: 8, baseCd: 1.35, canEvolve: true, reqPassive: 'bronzeBody', reqJobTier: 1, evoSkillId: 'red_dragon_sky', disableWhenEvo: true,
      evoDesc: '【二轉超武・物理・火・S+H・近戰・範圍】喚出赤蓮神龍騰空衝擊大範圍敵群並引發全屏烈焰震爆。',
      desc: '【槍技・物理・火・S+H・近戰・範圍】近距離鎖定單一目標打出直擊，同時在目標周邊引發小範圍烈焰爆破，機率附加【點燃】。'
    },
    eight_whirl: {
      name: '八旋舞槍訣', icon: '🌪️',
      reqChar: ['sivelin'], skillTags: ['spear_art'], reqWeaponTypes: ['spear', 'polearm'],
      type: 'physical', element: 'physical', statusTags: [], statTags: ['S'], behaviorTags: ['melee', 'aoe'], maxLv: 8,
      baseDmg: 21, perLv: 7, baseCd: 1.25, canEvolve: false,
      desc: '【槍技・物理・S・近戰・範圍】以自身為中心 360° 旋轉長槍橫掃周身圓形範圍內所有敵人。'
    },
  
    // === 希培林專屬超武（一轉槍／棍各一 ＋ 二轉預留一招） ===
    crimson_wave: {
      name: '紅龍破嶽', icon: '🐲', reqChar: ['sivelin'], skillTags: ['spear_art'], reqWeaponTypes: ['spear'],
      isSuperWeapon: true, evoFrom: 'sky_whirl_spear',
      type: 'physical', element: 'physical', statusTags: [], statTags: ['S'], behaviorTags: ['ranged', 'aoe'], maxLv: 3,
      baseDmg: 85, perLv: 25, baseCd: 1.00, canEvolve: false,
      resonanceDesc: '命中【破甲】目標觸發【龍牙貫穿】：無視敵人 40% 減傷抗性，且暴擊傷害倍率額外 +35%。',
      desc: '【槍技・物理・S・遠程・範圍】朝前方轟出赤紅龍頭，對直線矩形範圍內敵人造成 3 段連擊傷害。'
    },
    sky_fire_dragon: {
      name: '舞天火龍閃', icon: '🌋', reqChar: ['sivelin'], skillTags: ['spear_art'], reqWeaponTypes: ['polearm'],
      isSuperWeapon: true, evoFrom: 'shining_spear',
      type: 'physical', element: 'fire', statusTags: ['fire'], statTags: ['H'], behaviorTags: ['melee', 'aoe'], maxLv: 3,
      baseDmg: 46, perLv: 15, baseCd: 1.45, canEvolve: false,
      resonanceDesc: '擊殺【點燃】敵人時觸發【紅蓮爆碎】，對周圍敵群造成高額範圍火焰炸裂。',
      desc: '【打擊技・物理・火・H・近戰・範圍】以自身為中心 360° 捲起赤蓮火龍造成 3 段範圍重擊，機率附加【點燃】。'
    },
    red_dragon_sky: {
      name: '紅龍登天', icon: '☄️', reqChar: ['sivelin'], skillTags: ['spear_art'], reqWeaponTypes: ['spear', 'polearm'],
      reqJobTier: 2, isSuperWeapon: true, evoFrom: 'flame_spear_dance',
      type: 'physical', element: 'fire', statusTags: ['fire'], statTags: ['S', 'H'], behaviorTags: ['melee', 'aoe'], maxLv: 3,
      baseDmg: 68, perLv: 22, baseCd: 1.80, canEvolve: false,
      desc: '【二轉超武・物理・火・S+H・近戰・範圍】喚出雙重赤蓮神龍騰空衝擊大範圍敵群並引發全屏烈焰震爆，機率附加【點燃】。'
    }
  };
  
  CHAR_SKILL_REGISTRY.sivelin = { passives: SIVELIN_PASSIVES, skills: SIVELIN_SKILLS };
  if (typeof registerGlobalPassives === 'function') registerGlobalPassives(SIVELIN_PASSIVES);
  if (typeof registerGlobalSkills === 'function') registerGlobalSkills(SIVELIN_SKILLS);
  
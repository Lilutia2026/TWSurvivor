// 路西安．卡爾茲（小陸）專屬技能與輔助庫（V2.8 統一大卡池雙向標籤定案版・共 13 張卡片）
const LUCIEN_PASSIVES = {
  fastsword: {
    name: '⚡ 萊格藍治快劍術', reqChar: ['lucien'], skillTags: ['lucien_unique'], maxLv: 5,
    desc: '每級連擊觸發率 +2.5%、全技能冷卻縮減 +3%（可昇華極光刺刃）'
  },
  guard: {
    name: '🛡️ 萊格藍治之護', reqChar: ['lucien'], skillTags: ['lucien_unique'], maxLv: 5,
    desc: '每級物理（碰撞）減傷 +3%、魔法（射彈）減傷 +1.5%（可昇華連牙斬）'
  },
  dualMastery: {
    name: '⚔️ 劍刀雙修', reqChar: ['lucien'], skillTags: ['lucien_unique'], maxLv: 5,
    desc: '每級物理技能無視抗性 +3%；同時持有劍技與刀技時物理傷害 +2%（可昇華閃空烈破）'
  },
  speedUp: {
    name: '🌪️ 疾速術', reqChar: ['lucien'], skillTags: ['lucien_unique'], maxLv: 5,
    desc: '每級移動速度 +7%、全技能暴擊率 +2%'
  },
  nobleFortune: {
    name: '💰 富豪之道', reqChar: ['lucien'], skillTags: ['lucien_unique'], maxLv: 5,
    desc: '每級經驗獲取 +6%、拾取範圍 +12%、精英與首領額外掉落 Seed +20%'
  }
};

const LUCIEN_SKILLS = {
  // === 物理劍刀基礎主動池（全劍可選，超武依武器型態唯一鎖定） ===
  aurorathrust: {
    name: '極光刺刃', icon: '🗡️', evoName: '極光雷閃刺', evoIcon: '⚡',
    reqChar: ['lucien'], skillTags: ['sword_art'], reqWeaponTypes: ['rapier', 'blade', 'longsword'],
    type: 'physical', element: 'physical', statusTags: [], statTags: ['S'], behaviorTags: ['melee', 'aoe'], maxLv: 8,
    baseDmg: 28, perLv: 10, baseCd: 0.75, canEvolve: true, reqPassive: 'fastsword', evoSkillId: 'aurora_lightning', disableWhenEvo: true,
    evoDesc: '【劍技・物理・雷・S・近戰・範圍】瞬間刺出 3 道交錯極光雷閃錐光，累計命中觸發【雷電超載】延長距離並放大暴擊傷害。',
    desc: '【劍技・物理・S・近戰・範圍】向前方突刺出窄圓錐極光劍芒，劍尖末端（65% 射程外）造成 100% 傷害，前端造成 70% 傷害。'
  },
  renga: {
    name: '連牙斬', icon: '⚔️', evoName: '烈焰連牙斬', evoIcon: '🔥',
    reqChar: ['lucien'], skillTags: ['sword_art'], reqWeaponTypes: ['rapier', 'blade', 'longsword'],
    type: 'physical', element: 'physical', statusTags: [], statTags: ['H'], behaviorTags: ['melee', 'aoe'], maxLv: 8,
    baseDmg: 24, perLv: 8, baseCd: 1.30, canEvolve: true, reqPassive: 'guard', evoSkillId: 'renga_fire', disableWhenEvo: true,
    evoDesc: '【刀技・物理・火・H・近戰・範圍】前方大扇形 4 連狂暴烈焰劈砍，高機率引爆火花並附加【劍傷灼印】放大物理連斬傷害。',
    desc: '【刀技・物理・H・近戰・範圍】高速揮刀連續劈砍前方扇形敵群，LV.4 升級為 3 連斬。'
  },
  senku: {
    name: '閃空烈破', icon: '🌙', evoName: '閃空翔烈破', evoIcon: '🌪️',
    reqChar: ['lucien'], skillTags: ['sword_art'], reqWeaponTypes: ['rapier', 'blade', 'longsword'],
    type: 'physical', element: 'physical', statusTags: [], statTags: ['S', 'H'], behaviorTags: ['ranged', 'projectile'], maxLv: 8,
    baseDmg: 25, perLv: 9, baseCd: 1.15, canEvolve: true, reqPassive: 'dualMastery', evoSkillId: 'senku_wind', disableWhenEvo: true,
    evoDesc: '【劍技・物理・風・S+H・遠程・範圍】向前方扇形轟出多道金白色衝擊光柱，每 3 次施放捲起 2.0s【真空風渦】聚怪並擴寬光柱。',
    desc: '【劍技・物理・S+H・遠程・射彈】揮劍斬出高速穿透新月劍氣投射物貫穿直線敵群，LV.8 雙發齊射。'
  },
  enbu: {
    name: '圓月斬', icon: '🌀',
    reqChar: ['lucien'], skillTags: ['sword_art'], reqWeaponTypes: ['rapier', 'blade', 'longsword'],
    type: 'physical', element: 'physical', statusTags: [], statTags: ['H'], behaviorTags: ['melee', 'aoe'], maxLv: 8,
    baseDmg: 20, perLv: 7, baseCd: 1.45, canEvolve: false,
    desc: '【刀技・物理・H・近戰・範圍】以自身為中心 360° 迴旋揮斬橫掃周身敵群。'
  },
    // === 路西安一轉元素超武（一武器類型 ＝ 每局唯一超武；本質為物理劍刀技，需持有對應元素法術卡才啟動元素共鳴） ===
    aurora_lightning: {
      name: '極光雷閃刺', icon: '⚡', reqChar: ['lucien'], skillTags: ['sword_art'], reqWeaponTypes: ['rapier'],
      isSuperWeapon: true, evoFrom: 'aurorathrust', resonancePartner: 'thunder1',
      type: 'physical', element: 'lightning', statusTags: [], statTags: ['S'], behaviorTags: ['melee', 'aoe'], maxLv: 3,
      baseDmg: 34, perLv: 12, baseCd: 0.85, canEvolve: false,
      resonanceDesc: '需同時持有【⚡ 落雷術】啟動：命中【感電】目標觸發【靜電導引】。',
      desc: '【劍技・物理・雷・S・近戰・範圍】瞬間刺出 3 道交錯極光雷閃尖刺，觸發【雷電超載】延長距離並放大暴傷。'
    },
    renga_fire: {
      name: '烈焰連牙斬', icon: '🔥', reqChar: ['lucien'], skillTags: ['sword_art'], reqWeaponTypes: ['blade'],
      isSuperWeapon: true, evoFrom: 'renga', resonancePartner: 'fire1',
      type: 'physical', element: 'fire', statusTags: [], statTags: ['H'], behaviorTags: ['melee', 'aoe'], maxLv: 3,
      baseDmg: 30, perLv: 10, baseCd: 1.40, canEvolve: false,
      resonanceDesc: '需同時持有【🔥 火箭術】啟動：命中【點燃】目標觸發【助燃劍氣】，使【劍傷灼印】物理增傷額外再 +8%。',
      desc: '【刀技・物理・火・H・近戰・範圍】大扇形 4 連狂暴烈焰劈砍（LV.3 第 4 斬 1.35x），機率引爆火花並附加 2 秒【劍傷灼印】使物理劍技增傷。'
    },
    senku_wind: {
      name: '閃空翔烈破', icon: '🌪️', reqChar: ['lucien'], skillTags: ['sword_art'], reqWeaponTypes: ['longsword'],
      isSuperWeapon: true, evoFrom: 'senku', resonancePartner: 'windblade',
      type: 'physical', element: 'wind', statusTags: [], statTags: ['S', 'H'], behaviorTags: ['ranged', 'aoe'], maxLv: 3,
      baseDmg: 56, perLv: 19, baseCd: 1.25, canEvolve: false,
      resonanceDesc: '需同時持有【🍃 龍捲刃術】啟動：命中【鎌鼬】目標觸發【氣流撕裂】，延長鎌鼬時間並追加微幅風壓切割。',
      desc: '【劍技・物理・風・S+H・遠程・範圍】向前方遠距離轟出多道金白色衝擊光柱，每 3 次施放捲起 2.0s【真空風渦】與 1.0s 失衡。'
    }, 

  // === 跨角色共用元素法術（common_elem） ===
  windblade: {
    name: '龍捲刃術', icon: '🍃', skillTags: ['common_elem'], reqWeaponTypes: ['longsword', 'blade', 'rapier', 'tachi', 'greatsword'],
    type: 'magic', element: 'wind', statusTags: ['wind'], statTags: ['INT'], behaviorTags: ['ranged', 'projectile'], maxLv: 10,
    baseDmg: 21, perLv: 6, baseCd: 1.15, canEvolve: false,
    desc: '【風系魔法・魔法・INT・遠程・射彈】凝聚疾風魔力發射高速穿透風刃，機率附加【鎌鼬】。'
  }
};

CHAR_SKILL_REGISTRY.lucien = { passives: LUCIEN_PASSIVES, skills: LUCIEN_SKILLS };
if (typeof registerGlobalPassives === 'function') registerGlobalPassives(LUCIEN_PASSIVES);
if (typeof registerGlobalSkills === 'function') registerGlobalSkills(LUCIEN_SKILLS);

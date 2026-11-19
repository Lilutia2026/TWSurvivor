// 蒂琪愛兒．朱斯彼昂（小愛）專屬技能與輔助庫（V2.5 雙軌純英文標籤定案版・共 27 張卡片）
CHAR_SKILL_REGISTRY.tichiel = {
  passives: {
    blessing: {
      name: '✨ 祝福', maxLv: 5,
      desc: '全技能最終傷害 +3%（末段獨立乘區）'
    },
    mageTalent: {
      name: '🔮 魔法師的才能', maxLv: 5,
      desc: '無視怪物減傷抗性 +3%'
    },
    lightWall: {
      name: '🛡️ 光之壁障術', maxLv: 5,
      desc: '物理（碰撞）減傷率 +3%'
    },
    magicShield: {
      name: '💠 魔法盾牌', maxLv: 5,
      desc: '魔法（射彈）減傷率 +3%'
    },
    angelWish: {
      name: '👼 天使之願', maxLv: 1,
      desc: '賦予 1 次原地滿血復活與全屏淨化（代價：傷害 -10%、移速 -10%，且鎖死火／冰高階大招）'
    }
  },
  skills: {
    // === 法杖（MR）＆ 權杖／釘錘（DEF+H）共用主動池（共 7 招） ===
    holylight: {
      name: '神聖之光', icon: '✨', weaponGroup: 'staff_mace', reqWeaponType: 'staff',
      type: 'magic', element: 'holy', statusTags: ['holy'], statTags: ['MR'], behaviorTags: ['ranged', 'projectile'], maxLv: 10,
      baseDmg: 24, perLv: 7, baseCd: 1.40, canEvolve: false,
      desc: '【白魔術・魔法・MR・遠程・射彈】召喚純淨聖光化作高速穿透光矢射向敵群，機率附加【聖印】。'
    },
    radiance: {
      name: '光輝紋章', icon: '🔯', evoName: '光之聚咒', evoIcon: '🌟', weaponGroup: 'staff_mace', reqWeaponType: 'staff',
      type: 'magic', element: 'holy', statusTags: ['holy'], statTags: ['MR'], behaviorTags: ['aoe', 'zone'], maxLv: 10,
      baseDmg: 16, perLv: 5, baseCd: 4.50, canEvolve: true, reqPassive: 'mageTalent', evoSkillId: 'holypoly', disableWhenEvo: true,
      evoDesc: '【白魔術・魔法・MR・範圍・領域】遠處生成持續 2 秒的聖光漩渦牽引聚怪並每秒附加【聖印】，2 秒後引爆漩渦並向外發射無傷害聖光波紋補印。',
      resonanceDesc: '目標疊滿 3 層【聖印】時雙條件引爆聖光淨化並擴散補印波紋。',
      desc: '【白魔術・魔法・MR・範圍・領域】在地面展開神聖六芒星光陣持續灼燒敵人，機率附加【聖印】。'
    },
    healLight: {
      name: '治癒聖光', icon: '💖', weaponGroup: 'staff_mace',
      type: 'magic', element: 'holy', statusTags: ['holy'], statTags: ['MR'], behaviorTags: ['aoe', 'zone'], maxLv: 10,
      baseDmg: 28, perLv: 8, baseCd: 5.50, canEvolve: false,
      desc: '【白魔術・魔法・MR・範圍・領域】引導天界聖光柱轟擊並留下治癒光陣回復生命，機率附加【聖印】。'
    },
    holypoly: {
      name: '光之聚咒', icon: '🌟', weaponGroup: 'staff_mace', reqWeaponType: 'staff', isSuperWeapon: true, evoFrom: 'radiance',
      type: 'magic', element: 'holy', statusTags: ['holy'], statTags: ['MR'], behaviorTags: ['aoe', 'zone'], maxLv: 3,
      baseDmg: 55, perLv: 22, baseCd: 6.00, canEvolve: false,
      resonanceDesc: '引爆目標身上的 3 層【聖印】造成巨額淨化傷害，並向周圍擴散補印波紋。',
      desc: '【白魔術・魔法・MR・範圍・領域】遠處生成持續 2 秒的聖光漩渦牽引聚怪並每秒附加【聖印】，2 秒後引爆漩渦並向外發射無傷害聖光波紋補印。'
    },
    armorbreak: {
      name: '破壞盔甲', icon: '🔨', evoName: '失意狂擊', evoIcon: '💥', weaponGroup: 'staff_mace', reqWeaponType: 'mace',
      type: 'physical', element: 'holy', statusTags: ['holy', 'armor_break'], statTags: ['S', 'H'], behaviorTags: ['melee', 'aoe'], maxLv: 8,
      baseDmg: 30, perLv: 10, baseCd: 2.20, canEvolve: true, reqPassive: 'lightWall', evoSkillId: 'frenzyhammer',
      evoDesc: '【戰錘技・物理・S+H・近戰・範圍】傾注全力發動近身連環重錘砸地，機率附加【聖印】並引爆擴散補印波紋。',
      resonanceDesc: '重擊雙條件引爆目標身上的 3 層【聖印】造成高額爆發並擴散補印波紋。',
      desc: '【戰錘技・物理・S+H・近戰・範圍】奮力揮動戰錘掃出半月重擊氣勁，機率附加【破甲】與【聖印】。'
    },
    earthhammer: {
      name: '神聖震地錘', icon: '🌋', weaponGroup: 'staff_mace',
      type: 'physical', element: 'holy', statusTags: ['holy'], statTags: ['S', 'H'], behaviorTags: ['melee', 'aoe'], maxLv: 8,
      baseDmg: 26, perLv: 9, baseCd: 3.00, canEvolve: false,
      desc: '【戰錘技・物理・S+H・近戰・範圍】重錘猛擊大地激起 360° 環形地震波震退敵群，機率附加【聖印】。'
    },
    frenzyhammer: {
      name: '失意狂擊', icon: '💥', weaponGroup: 'staff_mace', reqWeaponType: 'mace', isSuperWeapon: true, evoFrom: 'armorbreak',
      type: 'physical', element: 'holy', statusTags: ['holy'], statTags: ['S', 'H'], behaviorTags: ['melee', 'aoe'], maxLv: 3,
      baseDmg: 48, perLv: 18, baseCd: 4.80, canEvolve: false,
      resonanceDesc: '狂暴連錘雙條件引爆目標身上的 3 層【聖印】造成高額爆發，並向周圍擴散補印波紋。',
      desc: '【戰錘技・物理・S+H・近戰・範圍】傾注全力發動近身連環重錘砸地，機率附加【聖印】並擴散補印波紋。'
    },

    // === 🔥 火焰系魔杖五階純化卡池（前置階梯 2 -> 5 -> 8 -> 10） ===
    fire1: {
      name: '火箭術', icon: '🔥', weaponGroup: 'wand', wandElem: 'fire', tier: 1,
      type: 'magic', element: 'fire', statusTags: ['fire'], statTags: ['INT'], behaviorTags: ['ranged', 'projectile'], maxLv: 10,
      baseDmg: 22, perLv: 6, baseCd: 1.20, canEvolve: false,
      desc: '【火系魔法・魔法・INT・遠程・射彈】凝聚熾熱魔力射出高速直線火焰箭矢，機率附加【點燃】。'
    },
    fire2: {
      name: '火球術', icon: '☄️', weaponGroup: 'wand', wandElem: 'fire', tier: 2, reqSkill: 'fire1', reqSkillLv: 2,
      type: 'magic', element: 'fire', statusTags: ['fire'], statTags: ['INT'], behaviorTags: ['ranged', 'projectile', 'aoe'], maxLv: 10,
      baseDmg: 30, perLv: 9, baseCd: 2.40, canEvolve: false,
      desc: '【火系魔法・魔法・INT・遠程・射彈・範圍】拋射高爆火焰榴彈在敵群中炸裂擴散，機率附加【點燃】。'
    },
    fire3: {
      name: '火炎之玉', icon: '🔮', weaponGroup: 'wand', wandElem: 'fire', tier: 3, reqSkill: 'fire2', reqSkillLv: 5,
      type: 'magic', element: 'fire', statusTags: ['fire'], statTags: ['INT'], behaviorTags: ['projectile', 'aoe'], maxLv: 10,
      baseDmg: 28, perLv: 8, baseCd: 3.80, canEvolve: false,
      desc: '【火系魔法・魔法・INT・射彈・範圍】在周身喚出多顆烈焰寶玉迴旋後向四方放射爆裂，機率附加【點燃】。'
    },
    fire4: {
      name: '火炎隕石術', icon: '🌋', evoName: '紅蓮業火・天罰', evoIcon: '🔥', weaponGroup: 'wand', reqWeaponType: 'wand', wandElem: 'fire', tier: 4, reqSkill: 'fire3', reqSkillLv: 8,
      type: 'magic', element: 'fire', statusTags: ['fire'], statTags: ['INT'], behaviorTags: ['projectile', 'aoe'], maxLv: 10,
      baseDmg: 52, perLv: 15, baseCd: 5.20, canEvolve: true, reqPassive: 'mageTalent', evoSkillId: 'fire5', disableWhenEvo: true,
      evoDesc: '【火系魔法・魔法・INT・射彈・範圍】天罰業火隕石引發二次烈焰爆發並殘留燃燒火海，機率附加【點燃】。',
      resonanceDesc: '擊殺【點燃】敵人時觸發【烈焰殉爆】，對周圍敵群造成範圍火焰連環炸裂。',
      desc: '【火系魔法・魔法・INT・射彈・範圍】撕裂蒼穹召喚巨型火焰隕石墜落轟炸，機率附加【點燃】。'
    },
    fire5: {
      name: '紅蓮業火・天罰', icon: '🔥', weaponGroup: 'wand', wandElem: 'fire', tier: 5, isSuperWeapon: true, evoFrom: 'fire4',
      type: 'magic', element: 'fire', statusTags: ['fire'], statTags: ['INT'], behaviorTags: ['projectile', 'aoe', 'zone'], maxLv: 3,
      baseDmg: 85, perLv: 28, baseCd: 5.50, canEvolve: false,
      resonanceDesc: '擊殺【點燃】敵人時觸發【烈焰殉爆】，對周圍敵群造成範圍火焰連環炸裂。',
      desc: '【火系魔法・魔法・INT・射彈・範圍・領域】天罰業火隕石引發二次烈焰爆發並殘留燃燒火海，機率附加【點燃】。'
    },

    // === ❄️ 冰結系魔杖五階純化卡池（前置階梯 2 -> 5 -> 8 -> 10） ===
    ice1: {
      name: '冰彈術', icon: '❄️', weaponGroup: 'wand', wandElem: 'ice', tier: 1,
      type: 'magic', element: 'ice', statusTags: ['ice'], statTags: ['INT'], behaviorTags: ['ranged', 'projectile'], maxLv: 10,
      baseDmg: 20, perLv: 6, baseCd: 1.30, canEvolve: false,
      desc: '【冰系魔法・魔法・INT・遠程・射彈】射出高速彈跳的銳利冰晶箭彈，機率附加【凍結】。'
    },
    ice2: {
      name: '冰霧術', icon: '🌫️', weaponGroup: 'wand', wandElem: 'ice', tier: 2, reqSkill: 'ice1', reqSkillLv: 2,
      type: 'magic', element: 'ice', statusTags: ['ice'], statTags: ['INT'], behaviorTags: ['aoe', 'zone'], maxLv: 10,
      baseDmg: 15, perLv: 5, baseCd: 4.20, canEvolve: false,
      desc: '【冰系魔法・魔法・INT・範圍・領域】在指定區域凝聚刺骨極寒冰霧領域持續侵蝕，機率附加【凍結】。'
    },
    ice3: {
      name: '冰晶術', icon: '💠', weaponGroup: 'wand', wandElem: 'ice', tier: 3, reqSkill: 'ice2', reqSkillLv: 5,
      type: 'magic', element: 'ice', statusTags: ['ice'], statTags: ['INT'], behaviorTags: ['projectile', 'aoe'], maxLv: 10,
      baseDmg: 34, perLv: 10, baseCd: 4.80, canEvolve: false,
      desc: '【冰系魔法・魔法・INT・射彈・範圍】推出緩慢前進的巨型寒冰球碾壓並自動散射冰彈，機率附加【凍結】。'
    },
    ice4: {
      name: '冰之散晶術', icon: '🏔️', evoName: '極凍冰土・太陰', evoIcon: '❄️', weaponGroup: 'wand', reqWeaponType: 'wand', wandElem: 'ice', tier: 4, reqSkill: 'ice3', reqSkillLv: 8,
      type: 'magic', element: 'ice', statusTags: ['ice'], statTags: ['INT'], behaviorTags: ['projectile', 'aoe'], maxLv: 10,
      baseDmg: 48, perLv: 14, baseCd: 5.60, canEvolve: true, reqPassive: 'mageTalent', evoSkillId: 'ice5', disableWhenEvo: true,
      evoDesc: '【冰系魔法・魔法・INT・射彈・範圍】太陰極寒巨冰重擊大地後擴散無傷極寒冰霧，機率附加【凍結】。',
      resonanceDesc: '冰系技能命中【凍結】目標時觸發【碎冰處決】，引爆巨額額外冰傷。',
      desc: '【冰系魔法・魔法・INT・射彈・範圍】凝聚高空寒氣降下大範圍巨型冰晶重砸，機率附加【凍結】。'
    },
    ice5: {
      name: '極凍冰土・太陰', icon: '❄️', weaponGroup: 'wand', wandElem: 'ice', tier: 5, isSuperWeapon: true, evoFrom: 'ice4',
      type: 'magic', element: 'ice', statusTags: ['ice'], statTags: ['INT'], behaviorTags: ['projectile', 'aoe', 'zone'], maxLv: 3,
      baseDmg: 80, perLv: 26, baseCd: 6.00, canEvolve: false,
      resonanceDesc: '冰系技能命中【凍結】目標時觸發【碎冰處決】，引爆巨額額外冰傷。',
      desc: '【冰系魔法・魔法・INT・射彈・範圍・領域】太陰極寒巨冰重擊大地後擴散無傷極寒冰霧，機率附加【凍結】。'
    },

        // === ⚡ 電擊系魔杖五階純化卡池（前置階梯 2 -> 5 -> 8 -> 10） ===
        thunder1: {
          name: '落雷術', icon: '⚡', weaponGroup: 'wand', wandElem: 'thunder', tier: 1,
          type: 'magic', element: 'lightning', statusTags: ['lightning'], statTags: ['INT'], behaviorTags: ['ranged', 'projectile'], maxLv: 10,
          baseDmg: 14, perLv: 4, baseCd: 0.90, canEvolve: false,
          desc: '【雷系魔法・魔法・INT・遠程・射彈】引導天際雷光化作多道單體落雷分別劈擊不同敵人，機率附加【感電】。'
        },
        thunder2: {
          name: '環電術', icon: '🌀', weaponGroup: 'wand', wandElem: 'thunder', tier: 2, reqSkill: 'thunder1', reqSkillLv: 2,
          type: 'magic', element: 'lightning', statusTags: ['lightning'], statTags: ['INT'], behaviorTags: ['aoe', 'zone'], maxLv: 10,
          baseDmg: 20, perLv: 6, baseCd: 3.00, canEvolve: false,
          desc: '【雷系魔法・魔法・INT・範圍・領域】以自身為中心釋放向外擴散再迅速回縮的雙段高壓電環，機率附加【感電】。'
        },
        thunder3: {
          name: '雷球術', icon: '🔮', weaponGroup: 'wand', wandElem: 'thunder', tier: 3, reqSkill: 'thunder2', reqSkillLv: 5,
          type: 'magic', element: 'lightning', statusTags: ['lightning'], statTags: ['INT'], behaviorTags: ['ranged', 'projectile'], maxLv: 10,
          baseDmg: 16, perLv: 5, baseCd: 3.40, canEvolve: false,
          desc: '【雷系魔法・魔法・INT・遠程・射彈】發射高速敵間彈跳的高壓雷電球，每次撞擊皆引動連鎖電弧彈跳，機率附加【感電】。'
        },
        thunder4: {
          name: '狂雷術', icon: '⛈️', evoName: '雷道降臨・紫霄', evoIcon: '⚡', weaponGroup: 'wand', reqWeaponType: 'wand', wandElem: 'thunder', tier: 4, reqSkill: 'thunder3', reqSkillLv: 8,
          type: 'magic', element: 'lightning', statusTags: ['lightning'], statTags: ['INT'], behaviorTags: ['projectile', 'aoe'], maxLv: 10,
          baseDmg: 30, perLv: 9, baseCd: 3.60, canEvolve: true, reqPassive: 'mageTalent', evoSkillId: 'thunder5', disableWhenEvo: true,
          evoDesc: '【雷系魔法・魔法・INT・射彈・範圍】紫霄神雷重擊並擴散高壓雷環造成二次電擊，機率附加【感電】。',
          desc: '【雷系魔法・魔法・INT・射彈・範圍】喚來狂暴雷雲降下多道高壓範圍神雷轟擊，機率附加【感電】。'
        },   
        thunder5: {
          name: '雷道降臨・紫霄', icon: '⚡', weaponGroup: 'wand', wandElem: 'thunder', tier: 5, isSuperWeapon: true, evoFrom: 'thunder4',
          type: 'magic', element: 'lightning', statusTags: ['lightning'], statTags: ['INT'], behaviorTags: ['projectile', 'aoe'], maxLv: 3,
          baseDmg: 45, perLv: 14, baseCd: 3.80, canEvolve: false,
          resonanceDesc: '雷系技能命中【感電】敵人時觸發【雷殛過載】，引爆青藍色高壓電弧在敵群間連續彈射（周圍無其他敵人時直接劈擊本體）。',
          desc: '【雷系魔法・魔法・INT・射彈・範圍】紫霄神雷重擊並擴散高壓雷環造成二次電擊，機率附加【感電】。'
        }
      }
    };
    
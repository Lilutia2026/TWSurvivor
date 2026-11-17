// 蒂琪愛兒．朱斯彼昂（小愛）完整定案規格書（V2.4 共 27 張卡片）
CHAR_SKILL_REGISTRY.tichiel = {
    passives: {
      blessing: {
        name: '✨ 祝福', maxLv: 5,
        desc: '【專屬輔助】傷害結算末段獨立乘區，全技能最終傷害 +3%／級（滿級 +15%），兼作失意狂擊進化鑰匙。'
      },
      mageTalent: {
        name: '🔮 魔法師的才能', maxLv: 5,
        desc: '【專屬輔助】無視怪物減傷抗性 +3%／級（滿級 +15%），兼作各系終極超武進化鑰匙。'
      },
      lightWall: {
        name: '🛡️ 光之壁障術', maxLv: 5,
        desc: '【專屬輔助】物理（碰撞）減傷率 +3%／級（滿級 +15%），受 70% 乘算硬上限控管。'
      },
      magicShield: {
        name: '💠 魔法盾牌', maxLv: 5,
        desc: '【專屬輔助】魔法（投射物）減傷率 +3%／級（滿級 +15%），受 70% 乘算硬上限控管。'
      },
      angelWish: {
        name: '👼 天使之願', maxLv: 1,
        desc: '【終極互斥被動】賦予 1 次原地滿血復活（觸發全屏淨化爆炸清空小怪並暈眩首領）；代價：全技能傷害 -10%、移速 -10%，且本局鎖死火／冰第 4～5 階大招。'
      }
    },
    skills: {
      // === 法杖（MR）＆ 權杖／釘錘（DEF+H）共用主動池（共 7 招） ===
      holylight: {
        name: '神聖之光', evoName: '🌟 光之聚咒', weaponGroup: 'staff_mace',
        element: 'light', statTags: ['MR'], behaviorTags: ['射彈'], maxLv: 10,
        baseDmg: 24, perLv: 7, baseCd: 1.40, canEvolve: true, reqPassive: 'mageTalent', evoSkillId: 'holypoly',
        desc: '【法杖起始・MR・射彈】高速穿透光矢，機率疊加 +1 層【聖印】（Lv.2/4/6/8/10 射彈 +1，滿級 6 發；Lv.3/5/7/9 傷害 +15%、CD -4%）。'
      },
      radiance: {
        name: '光輝紋章', weaponGroup: 'staff_mace',
        element: 'light', statTags: ['MR'], behaviorTags: ['範圍'], maxLv: 10,
        baseDmg: 16, perLv: 5, baseCd: 4.50, canEvolve: false,
        desc: '【白魔主動・MR・範圍】展開六芒星聖光陣持續跳傷，機率疊加 +1 層【聖印】（Lv.3/6/9 半徑 +12%；Lv.5/10 持續 +0.5s）。'
      },
      healLight: {
        name: '治癒聖光', weaponGroup: 'staff_mace',
        element: 'light', statTags: ['MR'], behaviorTags: ['範圍'], maxLv: 10,
        baseDmg: 28, perLv: 8, baseCd: 5.50, canEvolve: false,
        desc: '【白魔主動・MR・範圍】天降聖光柱轟擊（機率疊 +1 層聖印），殘留 3.0s 治癒光陣每秒回血 1.5%（Lv.5/10 升至 2.0%/2.5%）。'
      },
      holypoly: {
        name: '🌟 光之聚咒', weaponGroup: 'staff_mace', isSuperWeapon: true, evoFrom: 'holylight',
        element: 'light', statTags: ['MR'], behaviorTags: ['範圍'], maxLv: 3,
        baseDmg: 55, perLv: 22, baseCd: 6.00, canEvolve: false,
        desc: '【超武・MAX3】遠處生成聖光漩渦聚怪 2.0s（2次掛印判定）後引爆，滿 3 層聖印目標結算 320%→400%→500% 淨化共鳴，並擴散無傷波紋補印。'
      },
      armorbreak: {
        name: '破壞盔甲', evoName: '🔨 失意狂擊', weaponGroup: 'staff_mace',
        element: 'light', statTags: ['S', 'H'], behaviorTags: ['範圍'], maxLv: 8,
        baseDmg: 30, perLv: 10, baseCd: 2.20, canEvolve: true, reqPassive: 'blessing', evoSkillId: 'frenzyhammer',
        desc: '【釘錘起始・S+H・範圍】揮出半月重擊氣勁（最多命中 3～5 名），高機率掛載【破甲（×1.25 易傷）】並機率疊加 +2 層【聖印】。'
      },
      earthhammer: {
        name: '神聖震地錘', weaponGroup: 'staff_mace',
        element: 'light', statTags: ['S', 'H'], behaviorTags: ['範圍'], maxLv: 8,
        baseDmg: 26, perLv: 9, baseCd: 3.00, canEvolve: false,
        desc: '【打擊主動・S+H・範圍】原地 360° 環形地震波擊退貼身怪群，機率疊加 +2 層【聖印】（Lv.2/4/6/8 半徑 +10%、擊退 +12%）。'
      },
      frenzyhammer: {
        name: '🔨 失意狂擊', weaponGroup: 'staff_mace', isSuperWeapon: true, evoFrom: 'armorbreak',
        element: 'light', statTags: ['S', 'H'], behaviorTags: ['範圍'], maxLv: 3,
        baseDmg: 48, perLv: 18, baseCd: 4.80, canEvolve: false,
        desc: '【超武・MAX3】近身連環重錘砸地（3→4→5 次）、暈眩並引爆滿 3 層【聖印】（300%→380%→480% 共鳴倍率），附帶無傷擴散波紋補印。'
      },
  
      // === 🔥 火焰系魔杖五階純化卡池（前置階梯 2 -> 5 -> 8 -> 10） ===
      fire1: {
        name: '火箭術', weaponGroup: 'wand', wandElem: 'fire', tier: 1,
        element: 'fire', statTags: ['INT'], behaviorTags: ['射彈'], maxLv: 10,
        baseDmg: 22, perLv: 6, baseCd: 1.20, canEvolve: false,
        desc: '【火1起始・INT・射彈】高速直線普通火矢，機率掛載【點燃】（Lv.2/4/6/8/10 射彈 +1，滿級 6 發；Lv.3/5/7/9 傷害 +15%、點燃率 +3%）。'
      },
      fire2: {
        name: '火球術', weaponGroup: 'wand', wandElem: 'fire', tier: 2, reqSkill: 'fire1', reqSkillLv: 2,
        element: 'fire', statTags: ['INT'], behaviorTags: ['射彈', '範圍'], maxLv: 10,
        baseDmg: 30, perLv: 9, baseCd: 2.40, canEvolve: false,
        desc: '【火2・前置火1 LV.2】榴彈砲式定點小範圍爆炸（Lv.3/6/9 半徑 +15%；Lv.4/8/10 連發 +1，滿級 4 發）。'
      },
      fire3: {
        name: '火炎之玉', weaponGroup: 'wand', wandElem: 'fire', tier: 3, reqSkill: 'fire2', reqSkillLv: 5,
        element: 'fire', statTags: ['INT'], behaviorTags: ['射彈', '範圍'], maxLv: 10,
        baseDmg: 28, perLv: 8, baseCd: 3.80, canEvolve: false,
        desc: '【火3・前置火2 LV.5】周身升起火球旋轉一圈後往四方無追尾直線分散爆炸（Lv.1 為 4 顆，Lv.2/5/8/10 顆數 +1，滿級 8 顆）。'
      },
      fire4: {
        name: '火炎隕石術', evoName: '🔥 紅蓮業火・天罰', weaponGroup: 'wand', wandElem: 'fire', tier: 4, reqSkill: 'fire3', reqSkillLv: 8,
        element: 'fire', statTags: ['INT'], behaviorTags: ['射彈', '範圍'], maxLv: 10,
        baseDmg: 52, perLv: 15, baseCd: 5.20, canEvolve: true, reqPassive: 'mageTalent', evoSkillId: 'fire5', disableWhenEvo: true,
        desc: '【火4・前置火3 LV.8】天降巨型隕石大範圍轟炸（Lv.1 為 2 顆，Lv.3/6/9 顆數 +1，滿級 5 顆；受天使之願互斥限制）。'
      },
      fire5: {
        name: '🔥 紅蓮業火・天罰', weaponGroup: 'wand', wandElem: 'fire', tier: 5, isSuperWeapon: true, evoFrom: 'fire4',
        element: 'fire', statTags: ['INT'], behaviorTags: ['射彈', '範圍'], maxLv: 3,
        baseDmg: 85, perLv: 28, baseCd: 5.50, canEvolve: false,
        desc: '【火5超武・MAX3】合成後火 4 停用調暗；強化隕石追加二次爆炸（150%→200%→260%）＋殘留燃燒火海，並解鎖【烈焰殉爆】。'
      },
  
      // === ❄️ 冰結系魔杖五階純化卡池（前置階梯 2 -> 5 -> 8 -> 10） ===
      ice1: {
        name: '冰彈術', weaponGroup: 'wand', wandElem: 'ice', tier: 1,
        element: 'ice', statTags: ['INT'], behaviorTags: ['射彈'], maxLv: 10,
        baseDmg: 20, perLv: 6, baseCd: 1.30, canEvolve: false,
        desc: '【冰1起始・INT・射彈】高速彈跳冰彈，機率疊加 +1 層【寒氣】（Lv.1 彈跳 1 次，Lv.2/5/8 彈跳 +1，滿級 4 次；Lv.4/9 射彈 +1）。'
      },
      ice2: {
        name: '冰霧術', weaponGroup: 'wand', wandElem: 'ice', tier: 2, reqSkill: 'ice1', reqSkillLv: 2,
        element: 'ice', statTags: ['INT'], behaviorTags: ['範圍'], maxLv: 10,
        baseDmg: 15, perLv: 5, baseCd: 4.20, canEvolve: false,
        desc: '【冰2・前置冰1 LV.2】製造極寒霧氣領域持續跳傷，高機率疊加【寒氣】（Lv.3/6/9 半徑 +15%；Lv.5/10 持續 +1.0s）。'
      },
      ice3: {
        name: '冰晶術', weaponGroup: 'wand', wandElem: 'ice', tier: 3, reqSkill: 'ice2', reqSkillLv: 5,
        element: 'ice', statTags: ['INT'], behaviorTags: ['射彈', '範圍'], maxLv: 10,
        baseDmg: 34, perLv: 10, baseCd: 4.80, canEvolve: false,
        desc: '【冰3・前置冰2 LV.5】丟出大型冰球推進（具撞擊傷），飛行中自動施放「冰1 彈跳冰彈」，時間到消失。'
      },
      ice4: {
        name: '冰之散晶術', evoName: '❄️ 絕對零度・永凍星河', weaponGroup: 'wand', wandElem: 'ice', tier: 4, reqSkill: 'ice3', reqSkillLv: 8,
        element: 'ice', statTags: ['INT'], behaviorTags: ['射彈', '範圍'], maxLv: 10,
        baseDmg: 48, perLv: 14, baseCd: 5.60, canEvolve: true, reqPassive: 'mageTalent', evoSkillId: 'ice5', disableWhenEvo: true,
        desc: '【冰4・前置冰3 LV.8】天降巨冰砸落，覆蓋範圍比火系隕石更大（Lv.1 為 2 顆，Lv.3/6/9 顆數 +1；受天使之願互斥限制）。'
      },
      ice5: {
        name: '❄️ 絕對零度・永凍星河', weaponGroup: 'wand', wandElem: 'ice', tier: 5, isSuperWeapon: true, evoFrom: 'ice4',
        element: 'ice', statTags: ['INT'], behaviorTags: ['射彈', '範圍'], maxLv: 3,
        baseDmg: 80, perLv: 26, baseCd: 6.00, canEvolve: false,
        desc: '【冰5超武・MAX3】合成後冰 4 停用調暗；星河冰隕重擊後擴散無傷極寒冰霧高機率疊寒氣，並解鎖【碎冰處決】（350%→430%→520%）。'
      },
      // === ⚡ 電擊系魔杖五階純化卡池（前置階梯 2 -> 5 -> 8 -> 10） ===
      thunder1: {
        name: '落雷術', weaponGroup: 'wand', wandElem: 'thunder', tier: 1,
        element: 'thunder', statTags: ['INT'], behaviorTags: ['射彈'], maxLv: 10,
        baseDmg: 18, perLv: 5, baseCd: 1.00, canEvolve: false,
        desc: '【電1起始・INT・射彈】天降單體落雷，基礎彈數天生 +1（開局 2 發，Lv.3/6/9 +1，滿級 5 道），機率掛載【感電】。'
      },
      thunder2: {
        name: '環電術', weaponGroup: 'wand', wandElem: 'thunder', tier: 2, reqSkill: 'thunder1', reqSkillLv: 2,
        element: 'thunder', statTags: ['INT'], behaviorTags: ['範圍'], maxLv: 10,
        baseDmg: 22, perLv: 6, baseCd: 2.80, canEvolve: false,
        desc: '【電2・前置電1 LV.2】自身為中心施放電環，擴散 0.7s ＋ 收回 0.3s（共兩段傷害），擴散大小與「範圍」掛勾。'
      },
      thunder3: {
        name: '雷球術', weaponGroup: 'wand', wandElem: 'thunder', tier: 3, reqSkill: 'thunder2', reqSkillLv: 5,
        element: 'thunder', statTags: ['INT'], behaviorTags: ['射彈'], maxLv: 10,
        baseDmg: 26, perLv: 8, baseCd: 3.40, canEvolve: false,
        desc: '【電3・前置電2 LV.5】高速彈跳電球（具撞擊傷），每次命中附帶連鎖閃電彈跳 4 次（造成電球本體 70% 傷害）。'
      },
      thunder4: {
        name: '狂雷術', evoName: '⚡ 雷神降臨・九霄天劫', weaponGroup: 'wand', wandElem: 'thunder', tier: 4, reqSkill: 'thunder3', reqSkillLv: 8,
        element: 'thunder', statTags: ['INT'], behaviorTags: ['射彈', '範圍'], maxLv: 10,
        baseDmg: 42, perLv: 12, baseCd: 4.20, canEvolve: true, reqPassive: 'mageTalent', evoSkillId: 'thunder5', disableWhenEvo: true,
        desc: '【電4・前置電3 LV.8】天降雷隕型態，數量天生 +1（開局 3 道，Lv.3/6/9 +1，滿級 6 道）且冷卻更短。'
      },
      thunder5: {
        name: '⚡ 雷神降臨・九霄天劫', weaponGroup: 'wand', wandElem: 'thunder', tier: 5, isSuperWeapon: true, evoFrom: 'thunder4',
        element: 'thunder', statTags: ['INT'], behaviorTags: ['射彈', '範圍'], maxLv: 3,
        baseDmg: 75, perLv: 24, baseCd: 4.50, canEvolve: false,
        desc: '【電5超武・MAX3】合成後電 4 停用調暗；大範圍九霄神雷主體轟擊＋落點擴散高壓電環二次電擊，並解鎖【九霄連鎖感電】。'
      }
    }
  };
  
// 路西安．卡爾茲 專屬技能與輔助庫（物理上限 LV.8 / 元素魔法上限 LV.10）
CHAR_SKILL_REGISTRY.lucien = {
    skills: {
      renga: {
        name: '連犽斬', evoName: '⚔️ 疾風連犽斬', type: 'physical', element: 'none', maxLv: 8,
        mainStat: 'H', subStat: 'S', baseDmg: 22, perLv: 8, baseCd: 0.90,
        canEvolve: true, reqPassive: 'fastsword',
        resonanceSkill: 'firearrow',
        resonanceDesc: '【火系共鳴】疾風連犽斬揮砍附加【點燃】灼燒，擊殺點燃敵人引發烈焰爆破！',
        lvNotes: { 4: '★LV.4 質變：解鎖雙重二連斬！', 8: '★LV.8 巔峰：可配快劍術覺醒【疾風連犽斬】' },
        desc: '【刀技・MAX8】向前方扇形揮出高速斬擊（LV.4解鎖二連斬，配萊格藍治快劍術覺醒）'
      },
      aurora: {
        name: '極光刺', evoName: '⚡ 衝雷劍', type: 'physical', element: 'none', maxLv: 8,
        mainStat: 'S', subStat: 'H', baseDmg: 30, perLv: 11, baseCd: 0.65,
        canEvolve: true, reqPassive: 'haste',
        resonanceSkill: 'thunder',
        resonanceDesc: '【雷系共鳴】衝雷劍突刺命中引爆落雷，附加【感電】必暴並彈跳電弧！',
        lvNotes: { 4: '★LV.4 質變：突刺距離大幅延長！', 8: '★LV.8 巔峰：可配疾風之舞覺醒【衝雷劍】' },
        desc: '【劍技・MAX8】超高速直線突刺單體（LV.4突刺距離延長，配疾風連斬之舞覺醒）'
      },
      enbu: {
        name: '圓月斬', evoName: '🌪️ 狂風暴襲', type: 'physical', element: 'none', maxLv: 8,
        mainStat: 'H', subStat: 'S', baseDmg: 20, perLv: 7, baseCd: 1.45,
        canEvolve: true, reqPassive: 'guard',
        resonanceSkill: 'windblade',
        resonanceDesc: '【風系共鳴】狂風暴襲旋轉時附加【遲緩】並向周圍射出穿透真空風刃！',
        lvNotes: { 4: '★LV.4 質變：解鎖劍氣殘留延長！', 8: '★LV.8 巔峰：可配萊格藍治之護覺醒【狂風暴襲】' },
        desc: '【刀技・MAX8】周身360°刀氣震波（LV.4解鎖劍氣殘留，配萊格藍治之護覺醒）'
      },
      windblade: {
        name: '龍捲刃', type: 'magic', element: 'wind', maxLv: 10,
        mainStat: 'I', subStat: 'S', baseDmg: 15, perLv: 5, baseCd: 1.15,
        canEvolve: false,
        lvNotes: { 4: '★LV.4 質變：風刃穿透力提升至 2 名敵人！' },
        desc: '【風系魔法・MAX10】追蹤風刃並附加【遲緩】，可與圓月斬超武觸發風系共鳴'
      },
      firearrow: {
        name: '火箭術', type: 'magic', element: 'fire', maxLv: 10,
        mainStat: 'I', subStat: 'H', baseDmg: 22, perLv: 7, baseCd: 1.30,
        canEvolve: false,
        lvNotes: { 4: '★LV.4 質變：灼燒持續時間大幅延長！' },
        desc: '【火系魔法・MAX10】點燃敵人持續灼燒，可與連犽斬超武觸發火系共鳴爆破'
      },
      thunder: {
        name: '電擊術', type: 'magic', element: 'thunder', maxLv: 10,
        mainStat: 'I', subStat: 'H', baseDmg: 28, perLv: 9, baseCd: 1.65,
        canEvolve: false,
        lvNotes: { 4: '★LV.4 質變：落雷感電範圍與傷害提升！' },
        desc: '【雷系魔法・MAX10】落雷使敵人【感電】必受暴擊，可與極光刺超武觸發雷系共鳴'
      }
    },
    passives: {
      fastsword: { name: '⚡ 萊格藍治快劍術', maxLv: 5, desc: '【專屬輔助】物理冷卻 -8%、移速 +4%（連犽斬超武覺醒鑰匙）' },
      guard:     { name: '🛡️ 萊格藍治之護',   maxLv: 5, desc: '【專屬輔助】物理範圍 +10%、減傷 +1（圓月斬超武覺醒鑰匙）' },
      haste:     { name: '🌪️ 疾風連斬之舞',   maxLv: 5, desc: '【專屬輔助】全技能冷卻 -8%（極光刺超武覺醒鑰匙）' }
    }
  };
  
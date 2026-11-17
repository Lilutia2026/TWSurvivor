// 路西安．卡爾茲 專屬技能與輔助庫（V2.4 標籤規則基準版）
CHAR_SKILL_REGISTRY.lucien = {
  skills: {
    renga: {
      name: '連犽斬', icon: '🗡️', evoName: '疾風連犽斬', evoIcon: '⚔️', type: 'physical', element: 'none', maxLv: 8,
      statTags: ['H'], behaviorTags: ['範圍'], baseDmg: 22, perLv: 8, baseCd: 0.90,
      canEvolve: true, reqPassive: 'fastsword',
      resonancePartner: 'firearrow',
      resonanceDesc: '持有【火箭術】時，疾風連犽斬揮砍機率附加【點燃】，擊殺點燃敵人引發【烈焰殉爆】。',
      evoDesc: '【刀技・物理・H・範圍】刀勢化作無盡疾風連斬，攻擊範圍與傷害大幅躍升。',
      desc: '【刀技・物理・H・範圍】如疾風驟雨般向前方扇形揮出凌厲連斬。'
    },
    aurora: {
      name: '極光刺', icon: '🤺', evoName: '衝雷劍', evoIcon: '⚡', type: 'physical', element: 'none', maxLv: 8,
      statTags: ['S'], behaviorTags: ['範圍'], baseDmg: 30, perLv: 11, baseCd: 0.65,
      canEvolve: true, reqPassive: 'haste',
      resonancePartner: 'thunder',
      resonanceDesc: '持有【電擊術】時，衝雷劍突刺機率附加【感電】並自動彈射連鎖閃電。',
      evoDesc: '【劍技・物理・S・範圍】劍鋒凝聚狂暴雷光，化作貫穿戰場的極速閃電突刺。',
      desc: '【劍技・物理・S・範圍】將劍氣凝聚於一點，化作極光鎖敵直線突刺。'
    },
    enbu: {
      name: '圓月斬', icon: '🌙', evoName: '狂風暴襲', evoIcon: '🌪️', type: 'physical', element: 'none', maxLv: 8,
      statTags: ['H'], behaviorTags: ['範圍'], baseDmg: 20, perLv: 7, baseCd: 1.45,
      canEvolve: true, reqPassive: 'guard',
      resonancePartner: 'windblade',
      resonanceDesc: '持有【龍捲刃】時，狂風暴襲旋轉機率附加【遲緩】並向四周射出穿透風刃。',
      evoDesc: '【刀技・物理・H・範圍】迴旋刀氣化為席捲全場的毀滅風暴，範圍與威力全面解放。',
      desc: '【刀技・物理・H・範圍】以自身為軸心高速迴旋，斬出圓月般的 360° 刀氣波。'
    },
    windblade: {
      name: '龍捲刃', icon: '🍃', type: 'magic', element: 'wind', maxLv: 10,
      statTags: ['INT'], behaviorTags: ['射彈'], baseDmg: 15, perLv: 5, baseCd: 1.15,
      canEvolve: false,
      desc: '【風系魔法・INT・射彈】喚出呼嘯旋轉的青色風刃追蹤敵人，機率附加【遲緩】。'
    },
    firearrow: {
      name: '火箭術', icon: '🔥', type: 'magic', element: 'fire', maxLv: 10,
      statTags: ['INT'], behaviorTags: ['射彈'], baseDmg: 22, perLv: 7, baseCd: 1.30,
      canEvolve: false,
      desc: '【火系魔法・INT・射彈】凝聚熾熱魔力射出烈焰箭矢貫穿敵陣，機率附加【點燃】。'
    },
    thunder: {
      name: '電擊術', icon: '🌩️', type: 'magic', element: 'thunder', maxLv: 10,
      statTags: ['INT'], behaviorTags: ['射彈'], baseDmg: 28, perLv: 9, baseCd: 1.65,
      canEvolve: false,
      desc: '【雷系魔法・INT・射彈】引動天際雷雲降下高壓落雷劈擊敵群，機率附加【感電】。'
    }
  },
  passives: {
    fastsword: { name: '⚡ 萊格藍治快劍術', maxLv: 5, desc: '全技能冷卻縮減 +8%、移動速度 +4%' },
    guard:     { name: '🛡️ 萊格藍治之護',   maxLv: 5, desc: '【範圍】技能攻擊範圍 +10%' },
    haste:     { name: '🌪️ 疾風連斬之舞',   maxLv: 5, desc: '全技能冷卻縮減 +8%' }
  }
};

// 套裝效果獨立資料庫（以各部件 tplId 或名稱作為標籤映射，完全不侵入裝備本體資料）
const ITEM_SETS = [
    {
      setId: 'flame',
      name: '🔥 紅焰套裝',
      // 填入組成此套裝的裝備 tplId（支援武器、頭、衣、手、腳、翅膀等任意部位組合）
      pieces: ['h_flame_61', 'g_flame_61', 's_flame_61', 'b_flame_61'],
      // 預留件數加成效果（待套裝數值平衡時填入）
      bonuses: {
        2: { desc: '（2件套）預留物理／火傷加成', stats: {} },
        4: { desc: '（4件套）預留紅焰完整套裝特效', stats: {} }
      }
    },
    {
      setId: 'ice',
      name: '❄️ 冰寒套裝',
      pieces: ['h_ice_61', 'g_ice_61', 's_ice_61', 'b_ice_61'],
      bonuses: {
        2: { desc: '（2件套）預留魔攻／冰傷加成', stats: {} },
        4: { desc: '（4件套）預留冰寒完整套裝特效', stats: {} }
      }
    }
  ];
  
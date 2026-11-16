// 初代角色資料庫（未來擴充波里斯、蒂琪愛兒等只需在此新增）
const CHARACTERS = {
    lucien: {
      id: 'lucien',
      name: '路西安．卡爾茲',
      title: '卡雷德的貴公子',
      defaultWeaponType: 'longsword',
      baseStats: { S: 4, H: 3, I: 1, DEF: 2, MR: 1, DEX: 2, AGI: 2 },
      color: '#3b82f6'
    }
  };
  
  function getCurrentCharData() {
    const cid = (typeof saveData !== 'undefined' && saveData.charId) ? saveData.charId : 'lucien';
    return CHARACTERS[cid] || CHARACTERS.lucien;
  }
  
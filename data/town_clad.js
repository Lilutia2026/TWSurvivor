// ============================================================================
// 《TW倖存者》卡雷德自由市場：空間地圖配置、NPC 連動註冊與經濟參數接口 (data/town_clad.js)
// ============================================================================

// 【集中式經濟參數配置區】後續全遊戲 Seed 經濟體系定案後，僅需調整此處即可全站同步
const TOWN_ECONOMY_CONFIG = {
    identifyCostBase: 50,       // 未知裝備基礎鑑定費用（待經濟平衡校準）
    gambleWeaponCost: 100,      // 皮奧：武器神秘箱費用（待經濟平衡校準）
    gambleArmorCost: 100,       // 皮奧：防具神秘箱費用（待經濟平衡校準）
    gambleAccCost: 100,         // 皮奧：副手與飾品箱費用（待經濟平衡校準）
    gambleDailyMax: 10,         // 皮奧：每日賭博總次數上限
    enhanceBaseCost: 100,       // 巴哈里：白字強化基礎費用（待經濟平衡校準）
    rerollBaseCost: 100,        // 巴哈里：副詞條洗煉基礎費用（待經濟平衡校準）
    auctionFeeRate: 0.05        // 漢娜：拍賣場成交手續費率（預設 5%）
};

// 卡雷德自由市場：邏輯畫布與空間互動配置（無美術圖期間自動渲染幾何佔位）
const TOWN_CLAD_MAP = {
    id: 'clad_flea_market',
    name: '卡雷德自由市場',
    width: 1280,
    height: 820,
    bgImage: '', // 待地圖美術定案後填入圖片路徑
    spawnPoint: { x: 640, y: 430 },  // 玩家進入市集的預設出生點
    // 可行走矩形邊界（後續替換精細地圖美術時可微調）
    walkBounds: { minX: 160, maxX: 1120, minY: 160, maxY: 680 },
    // 互動目標清單（靠近互動半徑內按 F 鍵，自動分發呼叫對應獨立模組）
    interactables: [
        {
            id: 'portal_stage',
            type: 'portal',
            name: '卡雷德自由市場傳送門',
            subtitle: '🌌 關卡入口',
            x: 260,
            y: 590,
            radius: 75,
            color: '#38bdf8',
            handler: 'openStageSelectPage' // 連動至 core/stage_select.js
        },
        {
            id: 'npc_pio',
            type: 'npc',
            name: '皮奧',
            subtitle: '🔮 鑑定師',
            x: 340,
            y: 310,
            radius: 70,
            color: '#c084fc',
            handler: 'openNpcPio' // 連動至 npc/npc_pio.js
        },
        {
            id: 'npc_bahari',
            type: 'npc',
            name: '巴哈里',
            subtitle: '⚒️ 鐵匠鋪',
            x: 940,
            y: 350,
            radius: 70,
            color: '#fb923c',
            handler: 'openNpcBahari' // 連動至 npc/npc_bahari.js
        },
        {
            id: 'npc_hannah',
            type: 'npc',
            name: '漢娜',
            subtitle: '⚖️ 拍賣場',
            x: 840,
            y: 230,
            radius: 70,
            color: '#facc15',
            handler: 'openNpcHannah' // 連動至 npc/npc_hannah.js
        },
        {
            id: 'npc_kalipa',
            type: 'npc',
            name: '卡麗帕',
            subtitle: '🏦 銀行',
            x: 640,
            y: 610,
            radius: 70,
            color: '#4ade80',
            handler: 'openNpcKalipa' // 連動至 npc/npc_kalipa.js
        }
    ]
};

// 關卡出征清單與「建議等級鎖」配置
const STAGE_SELECT_LIST = [
    {
        id: 'selbas_plain',
        name: '塞爾巴斯平原 (1)',
        recLv: 1,
        desc: '適合新手冒險者的起點草原，怪物強度溫和。',
        dropHint: 'LV.0 ~ LV.20 基礎裝備與結晶'
    },
    {
        id: 'penine_forest',
        name: '貝那茵森林 (3)',
        recLv: 20,
        desc: '林間魔物密度高且具備遠程攻擊，建議角色 LV.20 以上挑戰。',
        dropHint: 'LV.20 ~ LV.42 進階武器與防具'
    },
    {
        id: 'palencia_coast',
        name: '帕倫西亞海岸 (1)',
        recLv: 42,
        desc: '高階海濱獵場，首領攻勢猛烈，建議整頓好強化裝備再行出征。',
        dropHint: 'LV.42 ~ LV.62 精良裝備與高階素材'
    }
];

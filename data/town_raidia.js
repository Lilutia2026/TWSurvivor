// ============================================================================
// 《TW倖存者》樹上精靈村・雷蒂亞：空間地圖配置、NPC 連動註冊與經濟參數接口 (data/town_raidia.js)
// ============================================================================

// 【集中式經濟參數配置區】後續全遊戲 Seed 經濟體系定案後，僅需調整此處即可全站同步
const TOWN_ECONOMY_CONFIG = {
    identifyCostBase: 45,       // 未知裝備基礎鑑定係數（LV.1 起 47 Seed ➔ LV.90 封頂 1,674 Seed）
    gambleWeaponCost: 500,      // 愛祖文：武器神秘箱費用
    gambleArmorCost: 500,       // 愛祖文：防具神秘箱費用
    gambleAccCost: 500,         // 愛祖文：副手與飾品箱費用
    gambleDailyMax: 10,         // 愛祖文：每日賭博總次數上限
    enhanceBaseCost: 100,       // 挈德羅：白字強化基礎費用
    rerollBaseCost: 100,        // 挈德羅：副詞條洗煉基礎費用
    auctionFeeRate: 0.05,       // 菲雅：拍賣場成交手續費率（預設 5%）
    // 裝備商店回收基準價格表（LV.0 基準價，套用 Math.pow(1.0285, effLv) 逐級平滑成長至 LV.90 最高 12.55x）
    sellPrices: {
        white: 100,
        green: 300,
        blue: 800,
        purple: 2500,
        gold: 8000
    },
        // 局外強化（帳號共用 Seed 回收池・每項上限 LV.10・全滿共計 2,633,600 Seed）
        metaUpgradeCosts: new Array(500, 1200, 2500, 5000, 10000, 20000, 35000, 55000, 80000, 120000),
        metaUpgrades: [   
        { id: 'atk',   icon: '⚔️', name: '攻擊強化', maxLv: 10, perVal: 4,   unit: '%', perLvText: '全技能最終傷害 +4%/級' },
        { id: 'hp',    icon: '❤️', name: '生命強化', maxLv: 10, perVal: 40,  unit: '',  perLvText: '基礎最大生命 +40/級' },
        { id: 'def',   icon: '🛡️', name: '堅韌護體', maxLv: 10, perVal: 1.5, unit: '%', perLvText: '物理與魔法減傷各 +1.5%/級' },
        { id: 'cdr',   icon: '⚡', name: '迅捷詠唱', maxLv: 10, perVal: 2,   unit: '%', perLvText: '全技能冷卻縮減 +2%/級' },
        { id: 'crit',  icon: '💥', name: '致命本能', maxLv: 10, perVal: 1.5, unit: '%', perLvText: '暴擊率 +1.5%/級、暴擊傷害 +6%/級' },
        { id: 'move',  icon: '👟', name: '疾風步法', maxLv: 10, perVal: 3,   unit: '%', perLvText: '移動速度 +3%/級、拾取範圍 +8%/級' },
        { id: 'exp',   icon: '📚', name: '博學多聞', maxLv: 10, perVal: 5,   unit: '%', perLvText: '局內經驗獲取 +5%/級' },
        { id: 'greed', icon: '💰', name: '貪婪祝福', maxLv: 10, perVal: 8,   unit: '%', perLvText: '局內 Seed 獲取 +8%/級' }
    ]
};

// 取得裝備有效經濟等級（LV.1～LV.90 逐級對應，90 級後屬於合成裝不再依掉落曲線計價）
function getEquipEconLevel(it) {
    if (!it) return 1;
    let lv = Number(it.reqLv);
    if (!Number.isFinite(lv) && it.tplId && typeof EQUIP_TEMPLATES !== 'undefined') {
        const tpl = EQUIP_TEMPLATES.find(t => t.tplId === it.tplId);
        if (tpl && Number.isFinite(Number(tpl.reqLv))) lv = Number(tpl.reqLv);
    }
    return Math.min(90, Math.max(0, Number.isFinite(lv) ? lv : 1));
}

// 全域共用：依裝備等級（LV.0～LV.90 逐級曲線）計算單件鑑定費用
function getEquipIdentifyCost(it) {
    const base = TOWN_ECONOMY_CONFIG.identifyCostBase ?? 45;
    const effLv = getEquipEconLevel(it);
    return Math.round(base * Math.pow(1.041, effLv));
}

// 全域共用：依稀有度 × 裝備等級（LV.0～LV.90 逐級曲線）計算單件裝備商店回收價格
function getEquipSellPrice(it) {
    if (!it) return 0;
    const prices = TOWN_ECONOMY_CONFIG.sellPrices || { white: 100, green: 300, blue: 800, purple: 2500, gold: 8000 };
    const base = prices[it.rarity] ?? 100;
    const effLv = getEquipEconLevel(it);
    return Math.round(base * Math.pow(1.0285, effLv));
}

// 樹上精靈村・雷蒂亞：原版 DTX_1312 (1600×1200) 精靈村木棧道無縫配置
const TOWN_CLAD_MAP = {
    id: 'raidia_tree_village',
    name: '樹上精靈村・雷蒂亞',
    width: 1600,
    height: 1200,
    bgImage: 'assets/maps/raidia_day.png', // 對應原版 DTX_1312 完整底圖
    spawnPoint: { x: 980, y: 569 },        // 玩家進入雷蒂亞中央廣場的預設出生點
    walkBounds: { minX: 0, maxX: 1590, minY: 241, maxY: 916 },
    walkablePolygon: [
        {x:937,y:247},{x:1032,y:342},{x:1074,y:340},{x:1125,y:371},{x:1172,y:398},{x:1256,y:413},{x:1294,y:432},{x:1360,y:448},{x:1380,y:452},{x:1468,y:484},
        {x:1590,y:515},{x:1577,y:549},{x:1561,y:571},{x:1548,y:589},{x:1532,y:614},{x:1521,y:635},{x:1502,y:656},{x:1483,y:685},{x:1465,y:711},{x:1444,y:729},
        {x:1424,y:754},{x:1399,y:776},{x:1379,y:795},{x:1362,y:816},{x:1335,y:831},{x:1304,y:841},{x:1282,y:852},{x:1252,y:862},{x:1224,y:875},{x:1188,y:883},
        {x:1151,y:895},{x:1113,y:906},{x:1078,y:911},{x:1041,y:915},{x:1005,y:916},{x:974,y:916},{x:938,y:909},{x:903,y:905},{x:867,y:895},{x:830,y:878},
        {x:813,y:865},{x:743,y:909},{x:602,y:835},{x:575,y:852},{x:543,y:859},{x:521,y:865},{x:495,y:871},{x:466,y:880},{x:436,y:877},{x:407,y:877},
        {x:370,y:870},{x:342,y:866},{x:305,y:860},{x:284,y:851},{x:261,y:841},{x:230,y:831},{x:198,y:822},{x:174,y:808},{x:149,y:795},{x:128,y:783},
        {x:103,y:767},{x:80,y:752},{x:55,y:736},{x:32,y:725},{x:19,y:714},{x:10,y:693},{x:8,y:664},{x:20,y:625},{x:57,y:591},{x:67,y:580},
        {x:43,y:558},{x:16,y:544},{x:0,y:520},{x:0,y:482},{x:0,y:462},{x:8,y:427},{x:41,y:414},{x:87,y:401},{x:137,y:440},{x:169,y:467},
        {x:189,y:488},{x:216,y:473},{x:235,y:473},{x:251,y:473},{x:270,y:471},{x:281,y:470},{x:292,y:466},{x:308,y:465},{x:318,y:462},{x:335,y:461},
        {x:348,y:455},{x:368,y:452},{x:384,y:440},{x:409,y:431},{x:418,y:423},{x:426,y:412},{x:444,y:401},{x:452,y:392},{x:464,y:398},{x:483,y:411},
        {x:497,y:419},{x:512,y:427},{x:531,y:436},{x:542,y:445},{x:540,y:463},{x:537,y:478},{x:527,y:493},{x:519,y:498},{x:507,y:509},{x:494,y:520},
        {x:475,y:538},{x:461,y:541},{x:437,y:547},{x:415,y:550},{x:400,y:556},{x:393,y:566},{x:382,y:573},{x:367,y:582},{x:348,y:591},{x:334,y:594},
        {x:308,y:594},{x:284,y:594},{x:268,y:593},{x:250,y:594},{x:252,y:602},{x:249,y:621},{x:246,y:644},{x:248,y:660},{x:255,y:674},{x:258,y:679},
        {x:266,y:677},{x:268,y:675},{x:271,y:665},{x:272,y:660},{x:269,y:655},{x:287,y:654},{x:300,y:655},{x:309,y:656},{x:317,y:655},{x:329,y:654},
        {x:366,y:651},{x:384,y:638},{x:399,y:630},{x:411,y:620},{x:430,y:612},{x:449,y:607},{x:478,y:599},{x:506,y:592},{x:525,y:579},{x:542,y:573},
        {x:563,y:561},{x:590,y:541},{x:591,y:523},{x:591,y:508},{x:590,y:489},{x:587,y:471},{x:579,y:457},{x:603,y:437},{x:616,y:423},{x:620,y:406},
        {x:620,y:383},{x:637,y:379},{x:653,y:369},{x:666,y:359},{x:673,y:347},{x:681,y:328},{x:677,y:314},{x:700,y:310},{x:725,y:300},{x:732,y:290},
        {x:747,y:277},{x:758,y:267},{x:766,y:248},{x:769,y:241},{x:778,y:246},{x:793,y:250},{x:800,y:252},{x:815,y:254},{x:844,y:252},{x:850,y:248},
        {x:857,y:246},{x:861,y:246},{x:868,y:249},{x:878,y:250},{x:887,y:253},{x:902,y:254},{x:903,y:255},{x:920,y:257},{x:929,y:254}
    ],

    // 中央精靈雕像圓形障礙（已精準對齊右側雕像底座中心）
    obstacles: [
        { x: 1085, y: 475, radius: 62 }
    ],

    // 星夜精靈燈籠暖光光暈座標
    lanternCoords: [
        { x: 870, y: 406, radius: 130 },
        { x: 784, y: 582, radius: 130 },
        { x: 1063, y: 730, radius: 130 },
        { x: 1215, y: 599, radius: 130 },
        { x: 738, y: 830, radius: 130 }
    ],

    // 互動目標清單（靠近互動半徑內按 F 鍵或滑鼠點擊互動）
    interactables: [
        { id: 'npc_aizuwen', type: 'npc', name: '愛祖文', subtitle: '🔮 青木魔法店・鑑定', x: 726, y: 544, radius: 80, color: '#c084fc', handler: 'openNpcAizuwen',
          sprite: { src: 'assets/npcs/raidia/aizuwen.png', scale: 0.82, anchorX: 65 } },
        { id: 'npc_feiya', type: 'npc', name: '菲雅', subtitle: '⚖️ 青木魔法店・拍賣', x: 1128, y: 618, radius: 72, color: '#facc15', handler: 'openNpcFeiya',
          sprite: { src: 'assets/npcs/raidia/feiya.png', scale: 0.92 } },
        { id: 'npc_qiedeluo', type: 'npc', name: '挈德羅', subtitle: '⚒️ 雷蒂亞武器店', x: 946, y: 465, radius: 80, color: '#fb923c', handler: 'openNpcQiedeluo',
          sprite: { src: 'assets/npcs/raidia/qiedeluo.png', scale: 0.82, anchorX: 134 } },
        { id: 'npc_kalipa', type: 'npc', name: '卡麗帕', subtitle: '🏦 庫洛集散銀行', x: 993, y: 737, radius: 72, color: '#4ade80', handler: 'openNpcKalipa',
          sprite: { src: 'assets/npcs/raidia/kalipa.png', scale: 0.92 } },
        { id: 'portal_stage', type: 'portal', name: '雷蒂亞精靈傳送門', subtitle: '🌌 冒險關卡出征', x: 719, y: 804, radius: 85, color: '#38bdf8', handler: 'openStageSelectPage' }
    ]
};

// 【通用難度乘算模板】以關卡基礎設定為 1.0x 基底，終點地獄難度：HP ×5、傷害 ×2.5、經驗 ×2.0
const DIFFICULTY_MODIFIERS = {
    normal:    { key: 'normal',    name: '🟢 普通', color: '#4ade80', hpMult: 1.0, dmgMult: 1.0, spawnMult: 1.0,  expMult: 1.0,  dropMult: 1.0,  mobEquipDropMult: 1 },
    hard:      { key: 'hard',      name: '🟡 困難', color: '#facc15', hpMult: 1.8, dmgMult: 1.4, spawnMult: 1.2,  expMult: 1.25, dropMult: 1.25, mobEquipDropMult: 5 / 3 },
    nightmare: { key: 'nightmare', name: '🟠 噩夢', color: '#fb923c', hpMult: 3.0, dmgMult: 1.9, spawnMult: 1.45, expMult: 1.6,  dropMult: 1.6,  mobEquipDropMult: 7 / 3 },
    hell:      { key: 'hell',      name: '🔴 地獄', color: '#f87171', hpMult: 5.0, dmgMult: 2.5, spawnMult: 1.75, expMult: 2.0,  dropMult: 2.0,  mobEquipDropMult: 3 }
};

function getMobEquipmentDropChance(stage, difficulty, gap, playerMultiplier = 1) {
    return (stage.baseDropRate ?? 0.025) * (difficulty.mobEquipDropMult ?? 1) * (gap.dropRateMult ?? 1) * playerMultiplier;
}

// 【關卡出征清單】目前開放前 2 階原版經典地圖（貝那茵森林、耳語海岸）
const STAGE_SELECT_LIST = [
    {
        id: 'penine_forest',
        tier: 1,
        chapter: 1,
        name: '貝那茵森林',
        subtitle: '雷蒂亞樹屋村莊外圍・新手冒險起點',
        minLv: 1,
        maxLv: 16,
        recLv: 1,
        baseExpMult: 1.0,
        baseDropRate: 0.025,
        bgmList: ['battle_penine_1', 'battle_penine_2', 'battle_penine_3'],
        bannerGradient: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #0f172a 100%)',
        boss: {
            name: '果凍雞王',
            icon: '👑',
            time: '遊戲時間 20 分鐘',
            desc: '統御森林果凍雞群的巨大王者，擅長彈跳震盪衝擊。',
            exclusiveDrops: [] // 【預留窗口】後續實裝合成素材時可填入 { itemId, name, chance }
        },
        elites: ['【菁英】食人花', '【菁英】多多熊'],
        monsters: ['🐱 小花貓', '🟢 綠葉果凍雞', '🍃 葉精', '🍄 香菇', '🌺 食人花', '🐻 多多熊'],
        desc: '圍繞著樹上精靈村雷蒂亞的翠綠森林，棲息著溫和的小花貓與綠葉果凍雞，適合剛踏出村莊的冒險者。',
        dropHint: 'LV.0 ～ LV.16 基礎武器防具、果凍結晶、初階強化石'
    },
    {
        id: 'whisper_coast',
        tier: 2,
        chapter: 1,
        name: '耳語海岸',
        subtitle: '海風輕拂的古老岩岸・進階狩獵場',
        minLv: 17,
        maxLv: 35,
        recLv: 17,
        baseExpMult: 1.3,
        baseDropRate: 0.035,
        bgmList: ['battle_coast_1', 'battle_coast_2', 'battle_coast_3'],
        bannerGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0f172a 100%)',
        boss: {
            name: '龜王安皮理爾',
            icon: '🐢',
            time: '遊戲時間 20 分鐘',
            desc: '盤踞耳語海岸的遠古巨龜霸主，擅長範圍水系魔法與近距離暈眩重擊。',
            exclusiveDrops: [] // 【預留窗口】後續實裝合成素材時可填入 { itemId, name, chance }
        },
        elites: ['【菁英】鬼頭鯊', '【菁英】魚槍武士'],
        monsters: ['🐟 魚劍士兵', '🐚 寄居蟹', '🦑 烏賊', '🦈 鬼頭鯊', '🔱 魚槍武士'],
        desc: '海浪拍打著礁石的海岸線，成群魚劍士兵、鬼頭鯊與魚槍武士在此徘徊，深處沉睡著傳說中的龜王安皮理爾。',
        dropHint: 'LV.0 ～ LV.35 進階武器防具（神聖系／波刃劍／戰神巨劍等）、中階強化石'
    }
];

// 【關卡裝備池等級區間鎖】當前關卡 ＋ 低一階關卡，防止高階關卡被低等新手裝過度稀釋
function getStageDropLvRange(targetStage) {
    if (!targetStage) return { minLv: 0, maxLv: 16 };
    const prevStage = STAGE_SELECT_LIST.find(s => s.tier === targetStage.tier - 1);
    const minLv = prevStage ? (prevStage.tier === 1 ? 0 : prevStage.minLv) : 0;
    const maxLv = targetStage.maxLv || 16;
    return { minLv, maxLv };
}

// 低一階與適性關卡均給正常經驗與掉落。低兩階起套用防炸魚。
function getStageLevelGapInfo(playerLv, targetStage) {
    const lv = Math.max(1, Number(playerLv) || 1);
    let currentTier = 1;
    for (const st of STAGE_SELECT_LIST) {
        if (lv >= st.minLv && lv <= st.maxLv) { currentTier = st.tier; break; }
        if (lv > st.maxLv) currentTier = st.tier;
    }
    const diff = targetStage.tier - currentTier;
    if (diff >= 1)  return { tierDiff: diff, mult: 1.2, dropRateMult: 1.2, maxRarIdx: 4, label: '🔥 越級挑戰 EXP 120%', color: '#fbbf24' };
    if (diff >= -1) return { tierDiff: diff, mult: 1.0, dropRateMult: 1.0, maxRarIdx: 4, label: '✅ 正常關卡 EXP 100%', color: '#4ade80' };
    return { tierDiff: diff, mult: 0.2, dropRateMult: 0.1, maxRarIdx: 2, label: '🔻 EXP 20%，掉寶率下降', color: '#f87171' };
}


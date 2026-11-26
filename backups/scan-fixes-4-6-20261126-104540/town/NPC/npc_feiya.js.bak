// ============================================================================
// 《TW倖存者》NPC 獨立模組：菲雅（拍賣場掌櫃 & 信箱發放系統）(town/NPC/npc_feiya.js)
// ============================================================================

let FEIYA_TAB = 'buy'; // buy | sell
const AUCTION_MOCK_MARKET = [
    { auctionId: 'auc_1', name: '精良細劍 (LV.20)', lv: 20, price: 300, seller: '雷蒂亞商人', item: { uid: Date.now() + 101, name: '精良細劍', reqLv: 20, slot: 'weapon', subType: 'rapier', rarity: 'blue', identified: true, tradable: true } },
    { auctionId: 'auc_2', name: '高階魔力法杖 (LV.35)', lv: 35, price: 500, seller: '魔法公會委託', item: { uid: Date.now() + 102, name: '高階魔力法杖', reqLv: 35, slot: 'weapon', subType: 'wand', rarity: 'purple', identified: true, tradable: true } }
];

function openNpcFeiya(tab) {
    if (typeof tab === 'string') FEIYA_TAB = tab;
    const tradableBag = (saveData.bag || []).filter(it => it && it.identified !== false && it.tradable !== false);

    let bodyHtml = '';
    if (FEIYA_TAB === 'buy') {
        bodyHtml = `<div style="font-size:12px;color:#facc15;margin-bottom:8px;">※ 得標商品將統一寄送至您的【📬 信箱】領取</div>
            ${AUCTION_MOCK_MARKET.map(a => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:#0f172a;border-radius:6px;margin-bottom:6px;">
                    <div><b style="color:#f8fafc;">${a.name}</b> <span style="font-size:12px;color:#94a3b8;">(賣家：${a.seller})</span></div>
                    <button onclick="feiyaBuyAuction('${a.auctionId}')" style="padding:4px 12px;background:#ca8a04;color:#000;font-weight:bold;border:none;border-radius:5px;cursor:pointer;">直購 ${a.price} Seed</button>
                </div>`).join('')}`;
    } else {
        bodyHtml = `<div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">※ 僅顯示「已鑑定」且「可交易」裝備（愛祖文賭博裝 🔒 自動排除）；售出 Seed 將寄至【📬 信箱】</div>
            ${tradableBag.length === 0 ? '<div style="color:#64748b;font-size:13px;">無可上架拍賣之裝備</div>' : tradableBag.map(it => {
                const rCol = (typeof RARITIES !== 'undefined' && RARITIES[it.rarity]) ? RARITIES[it.rarity].color : '#e2e8f0';
                return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:#0f172a;border-left:3px solid ${rCol};border-radius:6px;margin-bottom:6px;">
                    <span style="color:${rCol};font-size:13px;">${it.name} (LV.${it.reqLv || 1})</span>
                    <button onclick="feiyaSellItem(${it.uid})" style="padding:4px 10px;background:#15803d;color:#fff;border:none;border-radius:5px;cursor:pointer;">上架出售 (測試直售 200 Seed)</button>
                </div>`;
            }).join('')}`;
    }

    const html = `
        <div style="display:flex;gap:8px;margin-bottom:10px;">
            <button onclick="openNpcFeiya('buy')" style="padding:6px 14px;border-radius:6px;cursor:pointer;border:1px solid #facc15;background:${FEIYA_TAB === 'buy' ? '#854d0e' : '#1e293b'};color:#fff;">🛒 拍賣場標購</button>
            <button onclick="openNpcFeiya('sell')" style="padding:6px 14px;border-radius:6px;cursor:pointer;border:1px solid #4ade80;background:${FEIYA_TAB === 'sell' ? '#166534' : '#1e293b'};color:#fff;">💰 上架出售</button>
            <button onclick="openTownMailbox()" style="margin-left:auto;padding:6px 12px;border-radius:6px;cursor:pointer;border:1px solid #38bdf8;background:#0f172a;color:#38bdf8;">📬 開啟信箱 (${(saveData.mailbox || []).length})</button>
        </div>
        <div style="background:#1e293b;padding:12px;border-radius:8px;max-height:250px;overflow-y:auto;">${bodyHtml}</div>
    `;
    openNpcModalShell('⚖️ 菲雅', '青木魔法店・雷蒂亞拍賣行（統一信箱發放）', '#facc15', html);
}

function sendToMailbox(title, seedAmount, itemObj) {
    if (!Array.isArray(saveData.mailbox)) saveData.mailbox = [];
    saveData.mailbox.push({
        mailId: 'mail_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
        title,
        seed: seedAmount || 0,
        item: itemObj || null,
        time: new Date().toLocaleTimeString()
    });
    if (typeof writeSave === 'function') writeSave();
    if (typeof updateTownHeaderInfo === 'function') updateTownHeaderInfo();
}

function feiyaBuyAuction(auctionId) {
    const entry = AUCTION_MOCK_MARKET.find(a => a.auctionId === auctionId);
    if (!entry) return;
    if ((saveData.seed || 0) < entry.price) return alert('Seed 不足！');
    saveData.seed -= entry.price;
    const copyItem = JSON.parse(JSON.stringify(entry.item));
    copyItem.uid = Date.now() + Math.floor(Math.random() * 1000);
    sendToMailbox(`【拍賣得標】${entry.name}`, 0, copyItem);
    alert('得標成功！物品已寄送至【📬 信箱】。');
    openNpcFeiya();
}

function feiyaSellItem(uid) {
    const idx = (saveData.bag || []).findIndex(i => i && i.uid === uid);
    if (idx === -1) return;
    const [item] = saveData.bag.splice(idx, 1);
    const feeRate = (typeof TOWN_ECONOMY_CONFIG !== 'undefined' ? TOWN_ECONOMY_CONFIG.auctionFeeRate : 0.05);
    const netSeed = Math.round(200 * (1 - feeRate));
    sendToMailbox(`【拍賣售出貨款】${item.name}`, netSeed, null);
    alert(`已售出！扣除手續費後 ${netSeed} Seed 已寄送至【📬 信箱】。`);
    openNpcFeiya();
}

function openTownMailbox() {
    const mails = saveData.mailbox || [];
    const html = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-size:13px;color:#cbd5e1;">拍賣得標物品與貨款皆匯集於此</span>
            ${mails.length > 0 ? `<button onclick="claimAllMailbox()" style="padding:5px 12px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;">📥 一鍵全部領取</button>` : ''}
        </div>
        <div style="max-height:250px;overflow-y:auto;">
            ${mails.length === 0 ? '<div style="color:#64748b;text-align:center;padding:20px;">信箱目前空空如也</div>' : mails.map((m, i) => {
                const sAmt = m.seed || m.gold || 0;
                return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:#1e293b;border-radius:6px;margin-bottom:6px;">
                    <div>
                        <div style="color:#f8fafc;font-size:13px;font-weight:bold;">${m.title}</div>
                        <div style="color:#facc15;font-size:12px;">附件：${sAmt > 0 ? sAmt + ' Seed ' : ''}${m.item ? '📦 ' + m.item.name : ''}</div>
                    </div>
                    <button onclick="claimSingleMail(${i})" style="padding:4px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;cursor:pointer;">領取</button>
                </div>`;
            }).join('')}
        </div>
    `;
    openNpcModalShell('📬 冒險者信箱', '拍賣場與系統發放中心', '#38bdf8', html);
}

function claimSingleMail(idx) {
    const [m] = (saveData.mailbox || []).splice(idx, 1);
    if (!m) return;
    const sAmt = m.seed || m.gold || 0;
    if (sAmt) saveData.seed = (saveData.seed || 0) + sAmt;
    if (m.item) { saveData.bag = saveData.bag || []; saveData.bag.push(m.item); }
    if (typeof writeSave === 'function') writeSave();
    openTownMailbox();
}

function claimAllMailbox() {
    while (saveData.mailbox && saveData.mailbox.length > 0) {
        const m = saveData.mailbox.shift();
        const sAmt = m.seed || m.gold || 0;
        if (sAmt) saveData.seed = (saveData.seed || 0) + sAmt;
        if (m.item) { saveData.bag = saveData.bag || []; saveData.bag.push(m.item); }
    }
    if (typeof writeSave === 'function') writeSave();
    openTownMailbox();
}

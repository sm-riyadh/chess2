// --- Game Database ---
const UNIT_DB = {
    'ringo':  { id: 'ringo', name: 'Ringo', cost: 1, powerSystem: 'Weapon', maxHp: 500, ad: 65, special: 20, def: 20, sDef: 10, as: 1.2, agility: 0.2, range: 3.5, walk: 2.0, maxMana: 60, traits: ['Weapon', 'Striker'], color: '#ef4444' },
    'koshka': { id: 'koshka', name: 'Koshka', cost: 1, powerSystem: 'Crystal', maxHp: 550, ad: 40, special: 90, def: 25, sDef: 25, as: 1.4, agility: 0.5, range: 1, walk: 2.4, maxMana: 50, traits: ['Crystal', 'Striker'], color: '#ec4899' },
    'catherine':{ id: 'catherine', name: 'Catherine', cost: 1, powerSystem: 'Technology', maxHp: 750, ad: 30, special: 60, def: 45, sDef: 45, as: 0.8, agility: 0.3, range: 1, walk: 1.8, maxMana: 80, traits: ['Technology', 'Brawler'], color: '#94a3b8' },
    'glaive': { id: 'glaive', name: 'Glaive', cost: 2, powerSystem: 'Weapon', maxHp: 800, ad: 55, special: 40, def: 40, sDef: 20, as: 0.8, agility: 0.4, range: 1, walk: 1.8, maxMana: 80, traits: ['Weapon', 'Brawler'], color: '#fb923c' },
    'skaarf': { id: 'skaarf', name: 'Skaarf', cost: 2, powerSystem: 'Crystal', maxHp: 550, ad: 35, special: 120, def: 20, sDef: 30, as: 0.75, agility: 0.3, range: 3.5, walk: 1.5, maxMana: 80, traits: ['Crystal', 'Mage'], color: '#3b82f6' },
    'celeste':{ id: 'celeste', name: 'Celeste', cost: 3, powerSystem: 'Crystal', maxHp: 450, ad: 30, special: 150, def: 15, sDef: 30, as: 0.7, agility: 0.3, range: 4, walk: 1.6, maxMana: 100, traits: ['Crystal', 'Mage'], color: '#a855f7' },
    'joule':  { id: 'joule', name: 'Joule', cost: 3, powerSystem: 'Technology', maxHp: 900, ad: 50, special: 200, def: 60, sDef: 40, as: 0.6, agility: 0.5, range: 1, walk: 1.5, maxMana: 120, traits: ['Technology', 'Mech'], color: '#10b981' },
    'alpha':  { id: 'alpha', name: 'Alpha', cost: 4, powerSystem: 'Technology', maxHp: 850, ad: 70, special: 100, def: 40, sDef: 30, as: 0.9, agility: 0.3, range: 1, walk: 2.2, maxMana: 90, traits: ['Technology', 'Mech'], color: '#facc15' },
    'krul':   { id: 'krul', name: 'Krul', cost: 5, powerSystem: 'Weapon', maxHp: 1200, ad: 80, special: 200, def: 60, sDef: 60, as: 0.9, agility: 0.4, range: 1, walk: 1.6, maxMana: 100, traits: ['Weapon', 'Brawler'], color: '#7c3aed' }
};

const TIER_POOL_SIZES = { 1: 29, 2: 22, 3: 18, 4: 12, 5: 10 };

const SHOP_ODDS = {
    1: [100, 0, 0, 0, 0],
    2: [100, 0, 0, 0, 0],
    3: [75, 25, 0, 0, 0],
    4: [55, 30, 15, 0, 0],
    5: [45, 33, 20, 2, 0],
    6: [25, 40, 30, 5, 0],
    7: [19, 30, 35, 15, 1],
    8: [16, 20, 35, 25, 4]
};

const SYNERGY_THRESHOLDS = {
    'Weapon': [2, 3],
    'Crystal': [2, 3],
    'Technology': [2, 3],
    'Striker': [2],
    'Brawler': [2, 3],
    'Mage': [2],
    'Mech': [2]
};

const LEVEL_XP = [0, 2, 6, 10, 20, 36, 56, 80, 100];

// --- Game State ---
let state = {
    gold: 10,
    level: 1,
    xp: 0,
    playerHp: 100,
    enemyHp: 100,
    round: 1,
    phase: 'planning', // planning | combat
    streakCount: 0,
    streakType: 'none',
    shop: [],
    globalPool: {},
    bench: [null, null, null, null, null],
    overflowBench: [null, null, null, null, null],
    board: Array(8).fill(null).map(() => Array(5).fill(null)),
    entities: [], // active units in combat
    draggedUnit: null
};

// --- DOM Elements ---
const DOM = {
    enemyHp: document.getElementById('enemy-hp-val'),
    playerHp: document.getElementById('player-hp-val'),
    round: document.getElementById('round-val'),
    board: document.getElementById('board'),
    bench: document.getElementById('bench'),
    overflowBench: document.getElementById('overflow-bench'),
    level: document.getElementById('level-val'),
    xpText: document.getElementById('xp-text'),
    xpFill: document.getElementById('xp-fill'),
    gold: document.getElementById('gold-val'),
    shopCards: document.getElementById('shop-cards'),
    btnBuyXp: document.getElementById('btn-buy-xp'),
    btnFastForward: document.getElementById('btn-fast-forward'),
    btnRefresh: document.getElementById('btn-refresh'),
    btnStart: document.getElementById('btn-start-combat'),
    tooltip: document.getElementById('tooltip'),
    synergyHud: document.getElementById('synergy-hud'),
    sellZone: document.getElementById('sell-zone'),
    sellValue: document.getElementById('sell-value'),
    btnToggleStore: document.getElementById('btn-toggle-store'),
    uiContainer: document.getElementById('bottom-ui-container'),
    capacityVal: document.getElementById('capacity-val'),
    capacityBox: document.querySelector('.stat-box.capacity')
};

// --- Initialization ---
let timeScale = 1;

function init() {
    createBoard();
    createBench();
    
    const unitKeys = Object.keys(UNIT_DB);
    unitKeys.forEach(key => {
        state.globalPool[key] = TIER_POOL_SIZES[UNIT_DB[key].cost];
    });
    
    // Grant 3 random starting heroes
    for(let i=0; i<3; i++) {
        const tier1Keys = unitKeys.filter(k => UNIT_DB[k].cost === 1);
        const randomKey = tier1Keys[Math.floor(Math.random() * tier1Keys.length)];
        const unit = UNIT_DB[randomKey];
        state.globalPool[randomKey]--;
        
        state.bench[i] = {
            ...unit,
            id: Math.random().toString(36).substr(2, 9),
            baseId: unit.id,
            stars: 1,
            hp: unit.maxHp,
            mana: 0
        };
    }
    renderUnits();
    
    refreshShop(true);
    updateUI();
    updateSynergies();
    
    DOM.btnBuyXp.addEventListener('click', buyXp);
    DOM.btnRefresh.addEventListener('click', () => refreshShop(false));
    DOM.btnStart.addEventListener('click', startCombat);
    
    DOM.btnFastForward.addEventListener('click', () => {
        timeScale = timeScale === 1 ? 5 : 1;
        DOM.btnFastForward.style.background = timeScale === 5 ? '#eab308' : '';
    });
    
    DOM.btnToggleStore.addEventListener('click', () => {
        DOM.uiContainer.classList.toggle('open');
        const isOpen = DOM.uiContainer.classList.contains('open');
        const shopIcon = '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>';
        const closeIcon = '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        DOM.btnToggleStore.innerHTML = isOpen ? `${closeIcon} Close Store` : `${shopIcon} Open Store`;
    });
    
    // Sell Zone Events
    DOM.sellZone.addEventListener('dragover', e => {
        e.preventDefault();
        DOM.sellZone.classList.add('drag-over');
    });
    DOM.sellZone.addEventListener('dragleave', () => DOM.sellZone.classList.remove('drag-over'));
    DOM.sellZone.addEventListener('drop', handleSellDrop);
}

function createBoard() {
    DOM.board.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell ' + (r < 4 ? 'enemy-territory' : 'player-territory');
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            cell.addEventListener('dragover', e => e.preventDefault());
            cell.addEventListener('drop', e => handleDrop(e, 'board', r, c));
            
            DOM.board.appendChild(cell);
        }
    }
    
    document.addEventListener('click', (e) => {
        if (state.phase === 'combat' && DOM.uiContainer.classList.contains('open')) {
            if (!DOM.uiContainer.contains(e.target) && e.target !== DOM.btnToggleStore) {
                DOM.uiContainer.classList.remove('open');
                DOM.btnToggleStore.innerText = '🛒 Open Store';
            }
        }
    });
}

function createBench() {
    DOM.bench.innerHTML = '';
    DOM.overflowBench.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const slot = document.createElement('div');
        slot.className = 'bench-slot';
        slot.dataset.index = i;
        slot.addEventListener('dragover', e => e.preventDefault());
        slot.addEventListener('drop', e => handleDrop(e, 'bench', i));
        DOM.bench.appendChild(slot);
        
        const oSlot = document.createElement('div');
        oSlot.className = 'bench-slot';
        oSlot.dataset.index = i;
        oSlot.addEventListener('dragover', e => e.preventDefault());
        oSlot.addEventListener('drop', e => handleDrop(e, 'overflow', i));
        DOM.overflowBench.appendChild(oSlot);
    }
}

// --- Logic: Synergies ---
function updateSynergies() {
    const traitCounts = {};
    const uniqueUnits = new Set();
    
    for(let r=4; r<8; r++) {
        for(let c=0; c<5; c++) {
            const unit = state.board[r][c];
            if (unit && !uniqueUnits.has(unit.baseId)) {
                uniqueUnits.add(unit.baseId);
                unit.traits.forEach(t => {
                    traitCounts[t] = (traitCounts[t] || 0) + 1;
                });
            }
        }
    }
    
    DOM.synergyHud.innerHTML = '';
    for (const [trait, count] of Object.entries(traitCounts)) {
        const thresholds = SYNERGY_THRESHOLDS[trait] || [2, 3];
        let target = thresholds.find(t => t > count);
        
        if (thresholds.includes(count)) {
            let nextIndex = thresholds.indexOf(count) + 1;
            if (nextIndex < thresholds.length) target = thresholds[nextIndex];
            else target = count;
        }
        if (!target) target = thresholds[thresholds.length - 1];
        
        const isActive = thresholds.some(t => count >= t);
        const el = document.createElement('div');
        el.className = 'synergy-item';
        el.innerHTML = `<span class="count">${count}/${target}</span> <span>${trait}</span>`;
        if (isActive) {
            el.style.color = 'var(--accent-gold)';
            el.querySelector('.count').style.background = 'rgba(250, 204, 21, 0.2)';
            el.querySelector('.count').style.color = 'var(--accent-gold)';
        }
        DOM.synergyHud.appendChild(el);
    }
}

// --- Logic: Shop & Economy ---
function refreshShop(free = false) {
    if (!free) {
        if (state.gold < 2) return;
        state.gold -= 2;
    }
    
    // Return unbought to pool
    state.shop.forEach(u => {
        if (u) state.globalPool[u.id]++;
    });
    
    state.shop = [];
    const odds = SHOP_ODDS[Math.min(8, Math.max(1, state.level))];
    const unitKeys = Object.keys(UNIT_DB);
    
    for (let i = 0; i < 5; i++) {
        const roll = Math.random() * 100;
        let cumulative = 0;
        let targetCost = 1;
        for (let c = 0; c < 5; c++) {
            cumulative += odds[c];
            if (roll <= cumulative) {
                targetCost = c + 1;
                break;
            }
        }
        
        const validKeys = unitKeys.filter(k => UNIT_DB[k].cost === targetCost && state.globalPool[k] > 0);
        
        if (validKeys.length > 0) {
            const randomKey = validKeys[Math.floor(Math.random() * validKeys.length)];
            state.globalPool[randomKey]--; // Temporarily deduct
            state.shop.push(UNIT_DB[randomKey]);
        } else {
            state.shop.push(null);
        }
    }
    renderShop();
    updateUI();
}

function renderShop() {
    DOM.shopCards.innerHTML = '';
    state.shop.forEach((unit, index) => {
        const card = document.createElement('div');
        if (!unit) {
            card.className = 'shop-card empty';
        } else {
            card.className = `shop-card cost-${unit.cost}`;
            card.innerHTML = `
                <img class="card-img" src="vainglory-assets/hero_portrait/${unit.name}_Portrait.png" alt="${unit.name}">
                <div class="card-info">
                    <div class="card-name">${unit.name}</div>
                    <div class="card-traits">${unit.traits.join(', ')}</div>
                    <div class="card-cost"><img src="assets/gold_coin.png" class="coin-icon" alt="Gold"> ${unit.cost}</div>
                </div>
            `;
            card.addEventListener('click', () => buyUnit(index));
        }
        DOM.shopCards.appendChild(card);
    });
}

function buyUnit(shopIndex) {
    const unit = state.shop[shopIndex];
    if (!unit || state.gold < unit.cost) return;
    
    let benchIndex = state.bench.indexOf(null);
    let isOverflow = false;
    
    if (benchIndex === -1) {
        benchIndex = state.overflowBench.indexOf(null);
        isOverflow = true;
        if (benchIndex === -1) return; // Completely full
    }
    
    state.gold -= unit.cost;
    state.shop[shopIndex] = null;
    
    const unitInstance = {
        ...unit,
        id: Math.random().toString(36).substr(2, 9),
        baseId: unit.id,
        stars: 1,
        hp: unit.maxHp,
        mana: 0,
        flaggedForSell: false
    };
    
    if (isOverflow) state.overflowBench[benchIndex] = unitInstance;
    else state.bench[benchIndex] = unitInstance;
    
    checkMerge(unit.id);
    renderShop();
    renderUnits();
    updateSynergies();
    updateUI();
}

function buyXp() {
    if (state.level >= 8) return;
    const xpReq = LEVEL_XP[state.level];
    const cost = xpReq - state.xp;
    
    if (state.gold < cost) return;
    state.gold -= cost;
    state.xp = 0;
    state.level++;
    
    updateUI();
}

// --- Logic: Drag, Drop & Sell ---
let dragSource = null;

function handleDragStart(e, source) {
    // During combat, block dragging from board OR overflow bench
    if (state.phase === 'combat' && (source.type === 'board' || source.type === 'overflow')) {
        e.preventDefault();
        return; 
    }
    
    dragSource = source;
    
    if (e.dataTransfer) {
        e.dataTransfer.setDragImage(e.target, e.target.clientWidth / 2, e.target.clientHeight / 2);
    }
    
    setTimeout(() => e.target.classList.add('dragging'), 0);
    hideTooltip();
    
    let unit = source.type === 'bench' ? state.bench[source.i] : 
               source.type === 'overflow' ? state.overflowBench[source.i] : 
               state.board[source.r][source.c];
               
    if (unit && !unit.isEnemy) {
        DOM.sellZone.classList.add('active');
        let refund = unit.cost * Math.pow(3, unit.stars - 1);
        DOM.sellValue.innerText = refund;
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    dragSource = null;
    DOM.sellZone.classList.remove('active');
    DOM.sellZone.classList.remove('drag-over');
}

function handleSellDrop(e) {
    e.preventDefault();
    DOM.sellZone.classList.remove('drag-over');
    DOM.sellZone.classList.remove('active');
    
    if (!dragSource) return;
    let unit = dragSource.type === 'bench' ? state.bench[dragSource.i] : 
               dragSource.type === 'overflow' ? state.overflowBench[dragSource.i] : 
               state.board[dragSource.r][dragSource.c];
               
    if (!unit) return;
    
    let copies = Math.pow(3, unit.stars - 1);
    let refund = unit.cost * copies;
    state.gold += refund;
    state.globalPool[unit.baseId] += copies;
    
    if (dragSource.type === 'bench') state.bench[dragSource.i] = null;
    if (dragSource.type === 'overflow') state.overflowBench[dragSource.i] = null;
    if (dragSource.type === 'board') state.board[dragSource.r][dragSource.c] = null;
    
    dragSource = null;
    hideTooltip();
    renderUnits();
    updateSynergies();
    updateUI();
}

function handleDrop(e, targetType, targetR, targetC) {
    if (!dragSource) return;
    
    // Combat blocking
    if (state.phase === 'combat') {
        if (targetType === 'board' || dragSource.type === 'board') return;
        if (targetType === 'overflow' || dragSource.type === 'overflow') return;
    }
    
    let unit = null;
    if (dragSource.type === 'bench') { unit = state.bench[dragSource.i]; state.bench[dragSource.i] = null; }
    else if (dragSource.type === 'overflow') { unit = state.overflowBench[dragSource.i]; state.overflowBench[dragSource.i] = null; }
    else if (dragSource.type === 'board') { unit = state.board[dragSource.r][dragSource.c]; state.board[dragSource.r][dragSource.c] = null; }
    
    if (!unit) return;
    
    // Reset grace period flag when moved
    unit.flaggedForSell = false;
    
    if (targetType === 'bench') {
        const existing = state.bench[targetR];
        state.bench[targetR] = unit;
        if (existing) returnToSource(existing, dragSource);
    } else if (targetType === 'overflow') {
        const existing = state.overflowBench[targetR];
        state.overflowBench[targetR] = unit;
        if (existing) returnToSource(existing, dragSource);
    } else if (targetType === 'board') {
        if (targetR < 4) {
            returnToSource(unit, dragSource);
            return;
        }
        if ((dragSource.type === 'bench' || dragSource.type === 'overflow') && getPlayerBoardCount() >= state.level + 2) {
            returnToSource(unit, dragSource);
            return;
        }

        const existing = state.board[targetR][targetC];
        state.board[targetR][targetC] = unit;
        if (existing) returnToSource(existing, dragSource);
    }
    
    renderUnits();
    updateSynergies();
    updateUI();
}

function returnToSource(unit, source) {
    if (source.type === 'bench') state.bench[source.i] = unit;
    if (source.type === 'overflow') state.overflowBench[source.i] = unit;
    if (source.type === 'board') state.board[source.r][source.c] = unit;
    renderUnits();
    updateUI();
}

function getPlayerBoardCount() {
    let count = 0;
    for(let r=4; r<8; r++) {
        for(let c=0; c<5; c++) {
            if (state.board[r][c]) count++;
        }
    }
    return count;
}

// --- Logic: Merging ---
function checkMerge(baseId) {
    let mergedAtAll = false;
    
    const attemptMerge = (starLevel) => {
        let matches = [];
        const scan = (type, unit, r, c) => {
            if (unit && unit.baseId === baseId && unit.stars === starLevel) {
                matches.push({type, r, c, unit});
            }
        };
        
        for(let i=0; i<5; i++) scan('bench', state.bench[i], i, 0);
        for(let i=0; i<5; i++) scan('overflow', state.overflowBench[i], i, 0);
        for(let r=3; r<6; r++) {
            for(let c=0; c<6; c++) scan('board', state.board[r][c], r, c);
        }
        
        if (matches.length >= 3) {
            // Prioritize board locations for the upgrade, then bench, then overflow
            matches.sort((a, b) => {
                const rank = { 'board': 1, 'bench': 2, 'overflow': 3 };
                return rank[a.type] - rank[b.type];
            });
            
            for(let k=0; k<3; k++) {
                const loc = matches[k];
                if (loc.type === 'bench') state.bench[loc.r] = null;
                if (loc.type === 'overflow') state.overflowBench[loc.r] = null;
                if (loc.type === 'board') state.board[loc.r][loc.c] = null;
            }
            
            const targetLoc = matches[0];
            const newUnit = {
                ...matches[0].unit, 
                stars: starLevel + 1, 
                maxHp: matches[0].unit.maxHp * 1.8, 
                hp: matches[0].unit.maxHp * 1.8, 
                ad: matches[0].unit.ad * 1.5,
                special: matches[0].unit.special * 1.5,
                def: matches[0].unit.def * 1.2,
                sDef: matches[0].unit.sDef * 1.2,
                flaggedForSell: false
            };
            
            if (targetLoc.type === 'bench') state.bench[targetLoc.r] = newUnit;
            if (targetLoc.type === 'overflow') state.overflowBench[targetLoc.r] = newUnit;
            if (targetLoc.type === 'board') state.board[targetLoc.r][targetLoc.c] = newUnit;
            
            mergedAtAll = true;
            return true;
        }
        return false;
    };
    
    if (attemptMerge(1)) {
        attemptMerge(2);
    } else {
        attemptMerge(2);
    }
    
    if (mergedAtAll) updateSynergies();
}

// --- Rendering ---
function renderUnits() {
    // Clear units based on phase
    if (state.phase === 'planning') {
        document.querySelectorAll('.unit').forEach(el => el.remove());
    } else {
        document.querySelectorAll('.bench-area .unit').forEach(el => el.remove());
    }
    
    if (state.phase === 'planning') {
        const cells = DOM.board.children;
        for(let r=0; r<8; r++) {
            for(let c=0; c<5; c++) {
                const unit = state.board[r][c];
                if (unit) {
                    const el = createUnitElement(unit, {type: 'board', r, c});
                    cells[r * 5 + c].appendChild(el);
                }
            }
        }
    }
    
    const slots = DOM.bench.children;
    const oSlots = DOM.overflowBench.children;
    
    for(let i=0; i<5; i++) {
        let unit = state.bench[i];
        if (unit) {
            const el = createUnitElement(unit, {type: 'bench', i});
            slots[i].appendChild(el);
        }
        
        unit = state.overflowBench[i];
        if (unit) {
            const el = createUnitElement(unit, {type: 'overflow', i});
            oSlots[i].appendChild(el);
        }
    }
}

function createUnitElement(unit, source) {
    const el = document.createElement('div');
    el.className = 'unit' + (unit.isEnemy ? ' enemy' : '');
    el.id = 'ent-' + unit.id; // give it an id for updating during combat
    el.draggable = !unit.isEnemy; // draggable logic managed in handleDragStart now
    
    updateUnitDOM(el, unit);
    
    el.addEventListener('dragstart', e => handleDragStart(e, source));
    el.addEventListener('dragend', handleDragEnd);
    
    el.addEventListener('mouseenter', e => showTooltip(e, unit));
    el.addEventListener('mousemove', e => {
        if (DOM.tooltip.style.display === 'flex') {
            DOM.tooltip.style.left = e.pageX + 10 + 'px';
            DOM.tooltip.style.top = e.pageY + 10 + 'px';
        }
    });
    el.addEventListener('mouseleave', hideTooltip);
    
    return el;
}

function showTooltip(e, unit) {
    DOM.tooltip.style.display = 'flex';
    DOM.tooltip.innerHTML = `
        <div class="title">${unit.name} (${unit.stars}★)</div>
        <div style="color:var(--text-muted); font-size:10px; margin-bottom:6px; text-align:center;">${unit.traits.join(' / ')}</div>
        <div class="stat"><span>HP</span> <span class="val">${Math.round(unit.hp)}/${unit.maxHp}</span></div>
        <div class="stat"><span>Mana</span> <span class="val">${Math.round(unit.mana)}/${unit.maxMana}</span></div>
        <div class="stat"><span>Attack</span> <span class="val">${unit.ad}</span></div>
        <div class="stat"><span>Special</span> <span class="val">${unit.special}</span></div>
        <div class="stat"><span>Defense</span> <span class="val">${unit.def}</span></div>
        <div class="stat"><span>S. Defense</span> <span class="val">${unit.sDef}</span></div>
        <div class="stat"><span>Atk Speed</span> <span class="val">${unit.as}/s</span></div>
    `;
    DOM.tooltip.style.left = e.pageX + 10 + 'px';
    DOM.tooltip.style.top = e.pageY + 10 + 'px';
}

function hideTooltip() {
    DOM.tooltip.style.display = 'none';
}

function updateUnitDOM(el, unit) {
    let starsStr = '';
    for(let i=0; i<unit.stars; i++) starsStr += '★';
    
    const hpPct = Math.max(0, (unit.hp / unit.maxHp) * 100);
    const manaPct = Math.min(100, (unit.mana / unit.maxMana) * 100);
    
    const hpClass = unit.isEnemy ? 'enemy-hp-fill' : 'player-hp-fill';
    const manaClass = unit.isEnemy ? 'enemy-mana-fill' : 'player-mana-fill';
    
    el.innerHTML = `
        <img class="unit-model" src="vainglory-assets/hero_assets/${unit.name}/${unit.name}_Model.png" alt="${unit.name}">
        <div class="unit-stars" style="z-index:2;">${starsStr}</div>
        <div class="unit-hp-bar" style="z-index:2;"><div class="unit-hp-fill ${hpClass}" style="width: ${hpPct}%"></div></div>
        ${unit.maxMana > 0 ? `<div class="unit-mana-bar" style="z-index:2;"><div class="unit-mana-fill ${manaClass}" style="width: ${manaPct}%"></div></div>` : ''}
        ${unit.flaggedForSell ? `<div style="position:absolute; top:-6px; right:-6px; background:#ef4444; border:1px solid #fff; border-radius:50%; width:16px; height:16px; display:flex; justify-content:center; align-items:center; z-index:10; box-shadow:0 0 5px #000;"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:10px; height:10px;"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></div>` : ''}
    `;
}

function updateUI() {
    DOM.gold.innerText = state.gold;
    DOM.level.innerText = state.level;
    DOM.round.innerText = state.round;
    DOM.playerHp.innerText = state.playerHp;
    DOM.enemyHp.innerText = state.enemyHp;
    
    const boardCount = getPlayerBoardCount();
    const maxCapacity = state.level + 2;
    DOM.capacityVal.innerText = `${boardCount}/${maxCapacity}`;
    if (boardCount < maxCapacity && state.phase === 'planning') {
        DOM.capacityBox.classList.add('glow');
    } else {
        DOM.capacityBox.classList.remove('glow');
    }
    
    const xpReq = LEVEL_XP[state.level] || 999;
    DOM.xpText.innerText = `${state.xp}/${xpReq}`;
    DOM.xpFill.style.width = state.level >= 8 ? '100%' : `${(state.xp / xpReq) * 100}%`;
    
    if (state.level >= 8) {
        DOM.btnBuyXp.innerText = 'Max Level';
        DOM.btnBuyXp.disabled = true;
    } else {
        const cost = xpReq - state.xp;
        DOM.btnBuyXp.innerHTML = `Level Up <span class="cost-badge">${cost} <img src="assets/gold_coin.png" class="coin-icon" alt="Gold"></span>`;
        DOM.btnBuyXp.disabled = state.gold < cost;
    }
}

// --- Advanced Combat System ---
let combatFrameId;
let lastTime = 0;
let combatGrid = [];

function startCombat() {
    if (state.phase === 'combat') return;
    if (getPlayerBoardCount() === 0) return;
    
    // Execute auto-sell of overflow bench (1 round grace period)
    let autoSellGold = 0;
    for(let i=0; i<5; i++) {
        const unit = state.overflowBench[i];
        if (unit) {
            if (unit.flaggedForSell) {
                let copies = Math.pow(3, unit.stars - 1);
                autoSellGold += unit.cost * copies;
                state.globalPool[unit.baseId] += copies;
                state.overflowBench[i] = null;
            } else {
                unit.flaggedForSell = true;
            }
        }
    }
    state.gold += autoSellGold;
    updateUI();
    renderUnits(); // update visuals to remove overflow units
    
    state.phase = 'combat';
    document.body.className = 'phase-combat';
    DOM.btnStart.innerText = 'Combat in Progress...';
    DOM.btnStart.classList.add('combat-active');
    
    DOM.uiContainer.classList.remove('open');
    DOM.btnToggleStore.style.display = 'flex';
    DOM.btnToggleStore.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> Open Store';
    DOM.btnFastForward.style.display = 'flex';
    timeScale = 1;
    DOM.btnFastForward.style.background = '';
    
    spawnEnemies();
    
    // Clear units from board ONLY
    document.querySelectorAll('.board-area .unit').forEach(el => el.remove());
    
    state.entities = [];
    
    for(let r=0; r<8; r++) {
        for(let c=0; c<5; c++) {
            const unit = state.board[r][c];
            if (unit) {
                const ent = {
                    ...unit,
                    x: c,
                    y: r,
                    target: null,
                    attackTimer: 1 / unit.as,
                    agilityTimer: 0,
                    domElement: createUnitElement(unit, null)
                };
                ent.domElement.classList.add('combat-active');
                DOM.board.appendChild(ent.domElement);
                state.entities.push(ent);
            }
        }
    }
    
    lastTime = performance.now();
    combatFrameId = requestAnimationFrame(combatLoop);
}

function spawnEnemies() {
    for(let r=0; r<4; r++) {
        for(let c=0; c<5; c++) state.board[r][c] = null;
    }
    
    const enemyCount = Math.min(state.level + 2, 8);
    for(let i=0; i<enemyCount; i++) {
        const unitKeys = Object.keys(UNIT_DB);
        const randomKey = unitKeys[Math.floor(Math.random() * unitKeys.length)];
        const unit = UNIT_DB[randomKey];
        
        let x = Math.floor(Math.random() * 5);
        let y = Math.floor(Math.random() * 4);
        if (!state.board[y][x]) {
            state.board[y][x] = {
                ...unit,
                id: 'enemy_' + Math.random().toString(36).substr(2, 9),
                baseId: randomKey,
                stars: 1,
                hp: unit.maxHp,
                mana: 0,
                isEnemy: true
            };
        } else {
            i--; // try again
        }
    }
}

function combatLoop(time) {
    const dt = ((time - lastTime) / 1000) * timeScale;
    lastTime = time;
    
    updateEntities(dt);
    
    const playerAlive = state.entities.some(e => !e.isEnemy && e.hp > 0);
    const enemyAlive = state.entities.some(e => e.isEnemy && e.hp > 0);
    
    if (!playerAlive || !enemyAlive) {
        endCombat(playerAlive && !enemyAlive);
    } else {
        combatFrameId = requestAnimationFrame(combatLoop);
    }
}

function updateEntities(dt) {
    const activeEntities = state.entities.filter(e => e.hp > 0);
    
    // Target acquisition & Attack State check
    activeEntities.forEach(ent => {
        ent.isAttacking = false;
        if (!ent.target || ent.target.hp <= 0) {
            ent.target = findNearestEnemy(ent, activeEntities);
            ent.agilityTimer = ent.agility;
        }
        if (ent.target) {
            const dist = Math.hypot(ent.target.x - ent.x, ent.target.y - ent.y);
            if (dist <= ent.range + 0.1) {
                ent.isAttacking = true;
            }
        }
    });
    
    // Separation force (soft collision)
    activeEntities.forEach(ent => {
        if (ent.isAttacking) return; // Do not move if actively attacking
        
        let pushX = 0, pushY = 0;
        activeEntities.forEach(other => {
            if (ent === other) return;
            const dx = ent.x - other.x;
            const dy = ent.y - other.y;
            const dist = Math.hypot(dx, dy);
            
            // Units overlap if they are within 0.7 tiles of each other
            if (dist > 0 && dist < 0.7) {
                const force = (0.7 - dist) * 2; // push strength
                pushX += (dx / dist) * force * dt;
                pushY += (dy / dist) * force * dt;
            }
        });
        
        ent.x += pushX;
        ent.y += pushY;
        
        // Clamp to board bounds (0 to 4 for x, 0 to 7 for y)
        ent.x = Math.max(0, Math.min(4, ent.x));
        ent.y = Math.max(0, Math.min(7, ent.y));
    });

    activeEntities.forEach(ent => {
        if (ent.target) {
            if (!ent.isAttacking) {
                // Continuous floating-point movement
                const dist = Math.hypot(ent.target.x - ent.x, ent.target.y - ent.y);
                const dx = ent.target.x - ent.x;
                const dy = ent.target.y - ent.y;
                const walkStep = ent.walk * dt;
                
                ent.x += (dx / dist) * walkStep;
                ent.y += (dy / dist) * walkStep;
                
                if (ent.attackTimer > 0) ent.attackTimer -= dt;
            } else {
                if (ent.agilityTimer > 0) {
                    ent.agilityTimer -= dt;
                } else {
                    ent.attackTimer -= dt;
                    if (ent.attackTimer <= 0) {
                        performAttack(ent, ent.target);
                        ent.attackTimer = 1 / ent.as;
                    }
                }
            }
        }
        
        ent.domElement.style.left = `calc(100% / 5 * ${ent.x})`;
        ent.domElement.style.top = `calc(100% / 8 * ${ent.y})`;
        updateUnitDOM(ent.domElement, ent);
    });
    
    state.entities.filter(e => e.hp <= 0).forEach(e => {
        if (e.domElement.parentNode) e.domElement.remove();
    });
}

function findNearestEnemy(ent, activeEntities) {
    let nearest = null;
    let minDist = Infinity;
    activeEntities.forEach(other => {
        if (other.isEnemy !== ent.isEnemy) {
            const dist = Math.hypot(other.x - ent.x, other.y - ent.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = other;
            }
        }
    });
    return nearest;
}

function showDamage(target, damage, isTrueDmg) {
    const el = document.createElement('div');
    el.className = 'damage-text';
    el.innerText = Math.round(damage);
    if (isTrueDmg) {
        el.style.color = 'white';
        el.style.textShadow = '0 0 5px gold';
    }
    
    el.style.left = `calc(100% / 5 * ${target.x} + 10%)`;
    el.style.top = `calc(100% / 8 * ${target.y} + 6%)`;
    
    DOM.board.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function performAttack(attacker, target) {
    if (attacker.mana >= attacker.maxMana) {
        castUlt(attacker, target);
        attacker.mana = 0;
        return;
    }
    
    const mitigation = 100 / (100 + target.def);
    const damage = attacker.ad * mitigation;
    
    target.hp -= damage;
    attacker.mana = Math.min(attacker.maxMana, attacker.mana + 10);
    target.mana = Math.min(target.maxMana, target.mana + 2);
    
    showDamage(target, damage, false);
    
    attacker.domElement.classList.add('anim-attack');
    setTimeout(() => attacker.domElement.classList.remove('anim-attack'), 150);
}

function castUlt(attacker, target) {
    let damage = 0;
    let isTrue = false;
    
    if (attacker.powerSystem === 'Technology' && attacker.baseId === 'joule') {
        damage = attacker.special;
        isTrue = true;
    } else {
        const mitigation = 100 / (100 + target.def + target.sDef);
        damage = (attacker.ad + attacker.special) * mitigation;
    }
    
    target.hp -= damage;
    showDamage(target, damage, isTrue);
    
    attacker.domElement.style.transform = 'scale(1.4)';
    attacker.domElement.style.boxShadow = '0 0 20px yellow';
    setTimeout(() => {
        attacker.domElement.style.transform = '';
        attacker.domElement.style.boxShadow = '';
    }, 200);
}

function endCombat(playerWon) {
    cancelAnimationFrame(combatFrameId);
    state.phase = 'planning';
    document.body.className = 'phase-planning';
    DOM.btnStart.innerText = 'Start Combat Phase';
    DOM.btnStart.classList.remove('combat-active');
    
    DOM.btnToggleStore.style.display = 'none';
    DOM.btnFastForward.style.display = 'none';
    timeScale = 1;
    
    if (playerWon) {
        let remainingUnits = state.entities.filter(e => !e.isEnemy && e.hp > 0).length;
        state.enemyHp -= (5 + remainingUnits);
    } else {
        let remainingEnemies = state.entities.filter(e => e.isEnemy && e.hp > 0).length;
        state.playerHp -= (5 + remainingEnemies);
    }
    
    let gainedGold = 5;
    let interest = Math.floor(state.gold / 10) * 2;
    if (interest > 4) interest = 4;
    gainedGold += interest;
    if (playerWon) gainedGold += 1;
    
    if (playerWon) {
        if (state.streakType === 'win') state.streakCount++;
        else { state.streakType = 'win'; state.streakCount = 1; }
    } else {
        if (state.streakType === 'loss') state.streakCount++;
        else { state.streakType = 'loss'; state.streakCount = 1; }
    }
    
    if (state.streakType === 'win') {
        if (state.streakCount >= 2 && state.streakCount <= 3) gainedGold += 1;
        else if (state.streakCount >= 4) gainedGold += 2;
    }
    
    state.gold += gainedGold;
    
    state.xp += 2;
    if (state.xp >= LEVEL_XP[state.level] && state.level < 8) {
        state.xp -= LEVEL_XP[state.level];
        state.level++;
    }
    
    state.round++;
    
    for(let r=0; r<3; r++) {
        for(let c=0; c<6; c++) state.board[r][c] = null;
    }
    
    for(let r=3; r<6; r++) {
        for(let c=0; c<6; c++) {
            if (state.board[r][c]) {
                state.board[r][c].hp = state.board[r][c].maxHp;
                state.board[r][c].mana = 0;
            }
        }
    }
    
    document.querySelectorAll('.board-area .unit').forEach(el => el.remove());
    renderUnits();
    refreshShop(true);
    updateSynergies();
    updateUI();
}

// Start
init();

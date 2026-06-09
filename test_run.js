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

const LEVEL_XP
let state = {
    level: 1,
    board: Array(8).fill(null).map(() => Array(5).fill(null))
};
function spawnEnemies() {
    for(let r=0; r<4; r++) {
        for(let c=0; c<5; c++) state.board[r][c] = null;
    }

spawnEnemies();
console.log(state.board.map(row => row.map(c => c ? 'E' : '.').join(' ')).join('\n'));

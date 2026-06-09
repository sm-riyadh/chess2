const fs = require('fs');

const code = fs.readFileSync('main.js', 'utf8');

// We can just eval the state and UNIT_DB to test
const domMock = `
const document = {
    getElementById: () => ({ style: {}, classList: { add: ()=>{}, remove: ()=>{} }, addEventListener: ()=>{}, appendChild: ()=>{} }),
    createElement: () => ({ style: {}, classList: { add: ()=>{}, remove: ()=>{} }, addEventListener: ()=>{}, appendChild: ()=>{}, remove: ()=>{} }),
    querySelectorAll: () => [],
    body: { className: '' }
};
const DOM = new Proxy({}, { get: () => document.getElementById() });
`;

// Extract state and spawnEnemies logic to test
const script = code.match(/const UNIT_DB = \{[\s\S]*?const LEVEL_XP/)[0] + 
`
let state = {
    level: 1,
    board: Array(8).fill(null).map(() => Array(5).fill(null))
};
` +
code.match(/function spawnEnemies\(\) \{[\s\S]*?\}\n/)[0] +
`
spawnEnemies();
console.log(state.board.map(row => row.map(c => c ? 'E' : '.').join(' ')).join('\\n'));
`;

fs.writeFileSync('test_run.js', script);

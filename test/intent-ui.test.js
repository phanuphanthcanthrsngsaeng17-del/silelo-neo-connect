const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('public/chat.html', 'utf8');
const script = fs.readFileSync('public/intent-mode.js', 'utf8');
assert.match(html, /<script src="\/intent-mode\.js" defer><\/script>/);
assert.match(script, /\/api\/intent/);
assert.match(script, /data-mode="understand"/);
assert.match(script, /data-mode="execute"/);
assert.match(script, /needsConfirmation/);
console.log('intent mode UI tests passed');

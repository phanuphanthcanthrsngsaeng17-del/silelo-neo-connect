const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('public/chat.html', 'utf8');
assert.match(html, /fetch\('\/api\/chat'/);
assert.match(html, /const responseText = await r\.text\(\)/);
assert.match(html, /if \(!r\.ok\) throw new Error/);
assert.match(html, /หมดเวลารอเซิร์ฟเวอร์/);
assert.match(html, /\.img-msg \{ display: block;/);
const server = fs.readFileSync('server.js', 'utf8');
assert.match(server, /Cache-Control.*no-store/);
assert.match(server, /app\.use\(express\.static\([^\n]+/);
assert.doesNotMatch(html, /ได้เลยค่ะที่รัก!.*พร้อมรับฟังเสมอ/, 'chat must not use the canned mock response from pasted content');
console.log('chat send regression tests passed');

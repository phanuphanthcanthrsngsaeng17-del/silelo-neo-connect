const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const chat = fs.readFileSync(path.join(__dirname, '..', 'public', 'chat.html'), 'utf8');

test('provider failure is explicit and not a mock answer', () => {
  assert.match(server, /NO_PROVIDER_AVAILABLE/);
  assert.match(server, /provider unavailable \(ไม่ใช้ mock\)/);
  assert.doesNotMatch(server, /provider: 'mock', model: 'offline'/);
});

test('ZIP upload has authenticated bounded inspection route', () => {
  assert.match(server, /app\.post\('\/api\/files\/unzip', requireAuth/);
  assert.match(server, /ZIP_MAX_ENTRIES/);
  assert.match(server, /ZIP_UNSAFE_PATH/);
  assert.match(chat, /application\/zip/);
});

test('long chat content uses the expanded bounded limit', () => {
  assert.match(server, /const MAX_CHAT_TEXT = 50000/);
  assert.match(server, /String\(question\)\.slice\(0, MAX_CHAT_TEXT\)/);
});

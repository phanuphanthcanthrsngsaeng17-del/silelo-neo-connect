const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const chat = fs.readFileSync(path.join(__dirname, '..', 'public', 'chat.html'), 'utf8');

test('Puter adapter reads token only from server environment', () => {
  assert.match(server, /process\.env\.PUTER_API_KEY \|\| process\.env\.PUTER_AUTH_TOKEN/);
  assert.match(server, /require\('@heyputer\/puter\.js\/src\/init\.cjs'\)/);
  assert.doesNotMatch(chat, /PUTER_API_KEY|PUTER_AUTH_TOKEN/);
});

test('Puter adapter passes a selected model and preserves provider metadata', () => {
  assert.match(server, /puter\.ai\.chat\(messages, \{ model, stream: false, compaction: true \}\)/);
  assert.match(server, /provider: 'puter', model/);
  assert.match(server, /requestedModel = 'auto'/);
});

test('Puter model catalog is not falsely hardcoded as all available models', () => {
  assert.match(server, /PUTER_MODEL/);
  assert.doesNotMatch(server, /70 โมเดลพร้อมใช้/);
});

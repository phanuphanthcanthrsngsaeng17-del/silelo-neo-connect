const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public', 'call.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'public', 'call.js'), 'utf8');

test('WebRTC call page exposes in-room chat controls', () => {
  for (const marker of ['chat-messages', 'chat-form', 'chat-input', 'chat-send']) assert.match(html, new RegExp(marker));
  assert.match(js, /createDataChannel\(['"]room-chat['"]/);
  assert.match(js, /ondatachannel/);
  assert.match(js, /type: 'chat'/);
  assert.match(js, /addMessage/);
});

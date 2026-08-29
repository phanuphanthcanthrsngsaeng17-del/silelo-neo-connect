const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const chat = fs.readFileSync(path.join(root, 'public', 'chat.html'), 'utf8');
const callCss = fs.readFileSync(path.join(root, 'public', 'call.css'), 'utf8');

test('voice selection persists and new replies interrupt old speech immediately', () => {
  assert.match(chat, /localStorage\.setItem\('nc_voice', voice\)/);
  assert.match(chat, /function syncVoiceUi\(\)/);
  assert.match(chat, /คำตอบใหม่ต้องเริ่มทันที/);
  assert.match(chat, /audio\.pause\(\); audio\.currentTime = 0/);
  assert.match(chat, /speechSynthesis\.cancel\(\)/);
});

test('concise replies, ten extra voices and mobile compact mode are wired', () => {
  assert.match(server, /ตอบให้สั้นและได้ใจความ/);
  for (const voice of ['coral','marin','cedar','alloy','ash','echo','fable','nova','onyx','sage']) {
    assert.match(server, new RegExp(`\\b${voice}:`));
    assert.match(chat, new RegExp(`data-voice="${voice}"`));
  }
  assert.match(server, /parseFloat\(rate\)/);
  assert.match(chat, /id="vRate"/);
  assert.match(chat, /\.msg\.bot\s*\{[\s\S]*max-width:\s*86%/);
  assert.match(callCss, /\.chat-messages\{height:125px/);
});

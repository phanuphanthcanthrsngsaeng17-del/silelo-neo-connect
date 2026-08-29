const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const chat = fs.readFileSync(path.join(__dirname, '..', 'public', 'chat.html'), 'utf8');
const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

test('mobile audio unlock is wired to user gestures and retries pending speech', () => {
  assert.match(chat, /function unlockAudio\(\)/);
  assert.match(chat, /pointerdown.*unlockAudio/);
  assert.match(chat, /touchend.*unlockAudio/);
  assert.match(chat, /keydown.*unlockAudio/);
  assert.match(chat, /pendingSpeak/);
  assert.match(chat, /NotAllowedError/);
});

test('mobile TTS handles network failure with Thai Web Speech fallback', () => {
  assert.match(chat, /fetch\('\/api\/tts'/);
  assert.match(chat, /speechSynthesis\.getVoices\(\)/);
  assert.match(chat, /startsWith\('th'\)/);
  assert.match(chat, /u\.onend = res; u\.onerror = res/);
});

test('new speech cancels previous audio and synthesis instead of overlapping', () => {
  assert.match(chat, /audio\.pause\(\); audio\.currentTime = 0/);
  assert.match(chat, /speechSynthesis\.cancel\(\)/);
  assert.match(chat, /const myToken = speakToken/);
  assert.match(chat, /token !== speakToken/);
});

test('mobile audio elements use inline playback and bounded sentence chunks', () => {
  assert.match(chat, /audio\.preload = 'auto'/);
  assert.match(chat, /setAttribute\('playsinline', ''\)/);
  assert.match(chat, /m\.length <= 800/);
  assert.match(chat, /parts\[i \+ 1\]/);
});

test('server TTS validates text, voice, and rate with fallback provider', () => {
  assert.match(server, /app\.post\('\/api\/tts'/);
  assert.match(server, /const \{ text, voice, rate \}/);
  assert.match(server, /ttsBuffer\(String\(text\), voice, rate\)/);
  assert.match(server, /msedgeTtsOnce/);
});

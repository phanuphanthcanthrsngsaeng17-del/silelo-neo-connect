const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const chat = fs.readFileSync(path.join(__dirname, '..', 'public', 'chat.html'), 'utf8');
const editor = fs.readFileSync(path.join(__dirname, '..', 'public', 'file-editor.html'), 'utf8');

test('large files use authenticated sequential chunk upload up to 3GB', () => {
  assert.match(server, /const UPLOAD_MAX_BYTES = 3 \* 1024 \* 1024 \* 1024/);
  assert.match(server, /app\.post\('\/api\/files\/init', requireAuth/);
  assert.match(server, /app\.put\('\/api\/files\/chunk\/:id', requireAuth, express\.raw/);
  assert.match(server, /const UPLOAD_CHUNK_BYTES = 8 \* 1024 \* 1024/);
  assert.match(server, /INVALID_CHUNK/);
  assert.match(server, /app\.post\('\/api\/files\/complete\/:id', requireAuth/);
  assert.match(server, /FILE_TOO_LARGE/);
});

test('file access and edit links are signed, expiring, and owner-scoped', () => {
  assert.match(server, /app\.post\('\/api\/files\/:id\/share', requireAuth/);
  assert.match(server, /typ: 'file-share'/);
  assert.match(server, /app\.get\('\/api\/files\/share\/:id'/);
  assert.match(server, /app\.patch\('\/api\/files\/share\/:id'/);
  assert.match(server, /FILE_NOT_EDITABLE/);
  assert.match(server, /EDIT_TOO_LARGE/);
  assert.match(editor, /X-Share-Token/);
  assert.match(editor, /บันทึกการแก้ไข/);
});

test('voice call permissions and ten latest TTS presets are present', () => {
  assert.match(server, /microphone=\(self\)/);
  assert.match(server, /OPENAI_TTS_VOICES/);
  for (const voice of ['coral', 'marin', 'cedar', 'alloy', 'ash', 'echo', 'fable', 'nova', 'onyx', 'sage']) assert.match(server, new RegExp(`\\b${voice}:`));
  assert.match(server, /gpt-4o-mini-tts/);
  for (const voice of ['coral', 'marin', 'cedar', 'alloy', 'ash', 'echo', 'fable', 'nova', 'onyx', 'sage']) assert.match(chat, new RegExp(`data-voice="${voice}"`));
});

test('chat upload no longer uses whole-file FileReader and spacing is compact', () => {
  assert.match(chat, /fetch\('\/api\/files\/init'/);
  assert.match(chat, /file\.slice\(offset/);
  assert.match(chat, /async function readFilePreview/);
  assert.match(chat, /f\.size > 25 \* 1024 \* 1024/);
  assert.doesNotMatch(chat, /reader\.readAsDataURL\(file\)/);
  assert.match(chat, /#msgs \{ padding: 18px/);
  assert.match(chat, /\.bubble \{ padding: 10px 13px/);
});

test('large image binary upload remains bounded', () => {
  assert.match(server, /app\.post\('\/api\/images\/upload', requireAuth, express\.raw/);
  assert.match(server, /limit: '50mb'/);
  assert.match(chat, /request\.open\('POST', '\/api\/images\/upload'\)/);
});

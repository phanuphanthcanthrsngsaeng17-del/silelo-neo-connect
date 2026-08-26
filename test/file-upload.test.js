const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const chat = fs.readFileSync(path.join(__dirname, '..', 'public', 'chat.html'), 'utf8');

test('file and image upload is authenticated and bounded', () => {
  assert.match(server, /app\.post\('\/api\/files\/upload', requireAuth/);
  assert.match(server, /const UPLOAD_MAX_BYTES = 3 \* 1024 \* 1024/);
  assert.match(server, /UNSUPPORTED_MIME/);
  assert.match(server, /FILE_TOO_LARGE/);
  assert.match(server, /app\.get\('\/api\/files\/:id', requireAuth/);
});

test('chat file and image controls call the real upload endpoint', () => {
  assert.match(chat, /fetch\('\/api\/files\/upload'/);
  assert.match(chat, /อัปโหลดรูปแล้ว/);
  assert.match(chat, /อัปโหลดไฟล์แล้ว/);
  assert.match(chat, /ไฟล์เกิน 3MB/);
});

test('large images use authenticated binary upload with a 50MB boundary', () => {
  assert.match(server, /app\.post\('\/api\/images\/upload', requireAuth, express\.raw/);
  assert.match(server, /limit: '50mb'/);
  assert.match(server, /IMAGE_TOO_LARGE/);
  assert.match(chat, /request\.open\('POST', '\/api\/images\/upload'\)/);
  assert.match(chat, /กำลังอัปโหลดรูป/);
  assert.match(chat, /รูปเกิน 50MB/);
});

test('add-to-chat menu binds available actions to real routes or existing tools', () => {
  assert.match(server, /app\.get\('\/api\/files\/recent', requireAuth/);
  assert.match(chat, /fetch\('\/api\/files\/recent'\)/);
  assert.match(chat, /if \(id === 'audio'\).*speak\(text\)/);
  assert.match(chat, /if \(id === 'slides'\) return putPrompt/);
  assert.match(chat, /if \(id === 'research'\)/);
  assert.match(chat, /if \(id === 'skills'\)/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const chat = fs.readFileSync(path.join(__dirname, '..', 'public', 'chat.html'), 'utf8');

const max3GB = 3 * 1024 * 1024 * 1024;
const chunk8MB = 8 * 1024 * 1024;

test('accepts exactly 3GB and rejects any byte above the cap', () => {
  assert.match(server, /if \(!Number\.isSafeInteger\(size\) \|\| size <= 0 \|\| size > UPLOAD_MAX_BYTES\)/);
  assert.equal(max3GB, 3221225472);
  assert.ok(max3GB + 1 > max3GB);
  assert.match(server, /const UPLOAD_MAX_BYTES = 3 \* 1024 \* 1024 \* 1024/);
  assert.match(server, /error: 'FILE_TOO_LARGE'/);
});

test('rejects zero, negative, fractional, and unsafe sizes before creating a session', () => {
  assert.match(server, /Number\.isSafeInteger\(size\)/);
  assert.match(server, /size <= 0/);
  assert.match(server, /const id = crypto\.randomBytes\(18\)\.toString\('hex'\)/);
  assert.match(server, /fileUploadSessions\.set\(id/);
  assert.ok(!Number.isSafeInteger(1.5));
  assert.ok(!Number.isSafeInteger(Number.MAX_SAFE_INTEGER + 1));
});

test('bounds each request to 8MB and writes only the received buffer', () => {
  assert.match(server, /const CHUNK_UPLOAD_LIMIT = '8mb'/);
  assert.match(server, /const UPLOAD_CHUNK_BYTES = 8 \* 1024 \* 1024/);
  assert.match(server, /bytes\.length > UPLOAD_CHUNK_BYTES/);
  assert.match(server, /offset \+ bytes\.length > session\.size/);
  assert.match(server, /fs\.appendFileSync\(session\.filePath, bytes/);
  assert.equal(chunk8MB, 8388608);
});

test('requires sequential offsets and reports the expected offset on failure', () => {
  assert.match(server, /const offset = Number\(req\.headers\['x-upload-offset'\]\)/);
  assert.match(server, /offset !== session\.received/);
  assert.match(server, /error: 'INVALID_CHUNK', expectedOffset: session\.received/);
  assert.match(server, /session\.received \+= bytes\.length/);
});

test('prevents cross-user access to upload sessions and completed files', () => {
  assert.match(server, /session\.owner !== String\(req\.authUser\.u \|\| ''\)/);
  assert.match(server, /file\.owner !== String\(req\.authUser\.u \|\| ''\)/);
  assert.match(server, /error: 'UPLOAD_NOT_FOUND'/);
  assert.match(server, /app\.get\('\/api\/files\/:id', requireAuth/);
});

test('does not finalize a partial upload and atomically renames a complete file', () => {
  assert.match(server, /session\.received !== session\.size/);
  assert.match(server, /error: 'UPLOAD_INCOMPLETE'/);
  assert.match(server, /const finalPath = session\.filePath\.slice\(0, -5\)/);
  assert.match(server, /fs\.renameSync\(session\.filePath, finalPath\)/);
  assert.match(server, /fileUploadSessions\.delete\(id\)/);
});

test('sanitizes uploaded names and isolates storage by hashed owner directory', () => {
  assert.match(server, /path\.basename\(String\(body\.name \|\| 'upload\.bin'\)\)/);
  assert.match(server, /\.slice\(0, 180\)/);
  assert.match(server, /crypto\.createHash\('sha256'\)\.update\(owner \|\| 'user'\)/);
  assert.match(server, /fs\.closeSync\(fs\.openSync\(filePath, 'wx', 0o600\)\)/);
});

test('client sends chunks sequentially and exposes progress without whole-file buffering', () => {
  assert.match(chat, /fetch\('\/api\/files\/init'/);
  assert.match(chat, /for \(let offset = 0; offset < file\.size; offset \+= chunk\)/);
  assert.match(chat, /'X-Upload-Offset': String\(offset\)/);
  assert.match(chat, /file\.slice\(offset, Math\.min\(offset \+ chunk, file\.size\)\)/);
  assert.match(chat, /fetch\('\/api\/files\/complete\//);
  assert.doesNotMatch(chat, /readAsDataURL\(file\)/);
});

test('client rejects files above 3GB before upload begins', () => {
  assert.match(chat, /const max = 3 \* 1024 \* 1024 \* 1024/);
  assert.match(chat, /if \(file\.size > max\) throw new Error\('ไฟล์เกิน 3GB'\)/);
});

test('large-file preview reads a bounded slice instead of the complete file', () => {
  assert.match(chat, /const previewBytes = 128 \* 1024/);
  assert.match(chat, /f\.slice\(0, previewBytes\)\.text\(\)/);
  assert.match(chat, /if \(f\.size > 25 \* 1024 \* 1024\) text = await readFilePreview\(f\)/);
});

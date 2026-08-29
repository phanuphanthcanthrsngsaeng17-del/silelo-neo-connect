const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const media = require('../lib/media-pipeline');
const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

test('media pipeline exposes real fetch, archive, and video actions', () => {
  assert.match(server, /app\.post\('\/api\/media', requireAuth, requireOwner/);
  for (const action of ['fetch', 'inventory', 'extract', 'video']) assert.match(server, new RegExp("action === '" + action + "'"));
  assert.match(server, /mediaPipeline\.fetchRemote/);
  assert.match(server, /mediaPipeline\.extractArchive/);
  assert.match(server, /mediaPipeline\.renderVideo/);
});

test('archive entries reject traversal and absolute paths', () => {
  assert.equal(media.safeArchiveEntry('images/a.png'), true);
  assert.equal(media.safeArchiveEntry('../secret.txt'), false);
  assert.equal(media.safeArchiveEntry('/etc/passwd'), false);
  assert.equal(media.safeArchiveEntry('a/../../secret'), false);
  assert.equal(media.safeArchiveEntry('a\u0000b'), false);
});

test('archive and remote limits are bounded', () => {
  assert.equal(media.MAX_REMOTE_BYTES, 512 * 1024 * 1024);
  assert.equal(media.MAX_ARCHIVE_ENTRIES, 20000);
  assert.equal(media.MAX_VIDEO_INPUTS, 300);
  assert.equal(media.archiveKind('x.zip'), 'zip');
  assert.equal(media.archiveKind('x.tar.gz'), 'tar');
  assert.equal(media.archiveKind('x.exe'), null);
});

test('remote fetch accepts only HTTP(S)', () => {
  assert.throws(() => media.remoteUrl('file:///tmp/a'), /รองรับเฉพาะ URL http\/https/);
});

test('video renderer uses ffmpeg without shell interpolation', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'lib', 'media-pipeline.js'), 'utf8');
  assert.match(source, /spawn\(bin, args, \{[^}]*shell: false/);
  assert.match(source, /process\.env\.FFMPEG_BIN \|\| 'ffmpeg'/);
  assert.match(source, /-f', 'concat'/);
  assert.match(source, /format=yuv420p/);
});

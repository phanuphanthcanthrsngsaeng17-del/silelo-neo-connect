const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'chat.html'), 'utf8');

test('reference chat UI has a fluid mobile-first shell', () => {
  assert.match(html, /id="manus-reference-ui"/);
  assert.match(html, /width:min\(100%, 760px\)/);
  assert.match(html, /min-height:100dvh/);
  assert.match(html, /position:sticky; top:0/);
  assert.match(html, /backdrop-filter:blur\(18px\)/);
});

test('reference chat UI styles user and assistant message surfaces', () => {
  assert.match(html, /\.msg\.user \{ display:flex; justify-content:flex-end; \}/);
  assert.match(html, /border-radius:21px 21px 6px 21px/);
  assert.match(html, /\.msg\.bot \.bubble \{ max-width:100%/);
  assert.match(html, /background:#292c35/);
});

test('reference chat UI keeps composer fixed, rounded, and safe-area aware', () => {
  assert.match(html, /\.inputbar \{ position:fixed/);
  assert.match(html, /bottom:max\(12px, env\(safe-area-inset-bottom\)/);
  assert.match(html, /width:min\(calc\(100% - 32px\), 700px\)/);
  assert.match(html, /border-radius:28px/);
  assert.match(html, /@media \(min-width: 761px\)/);
});

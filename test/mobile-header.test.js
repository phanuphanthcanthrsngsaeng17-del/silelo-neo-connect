const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'chat.html'), 'utf8');

test('mobile header uses a horizontally scrollable tab strip', () => {
  assert.match(css, /\.hbtns\s*\{[\s\S]*overflow-x:\s*auto/);
  assert.match(css, /\.hbtns\s*\{[\s\S]*flex:\s*0 0 100%/);
  assert.match(css, /\.hbtns > button\s*\{\s*scroll-snap-align:\s*start/);
  assert.match(css, /@media \(max-width: 560px\)/);
});

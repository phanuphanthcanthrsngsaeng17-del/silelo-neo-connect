const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const browser = fs.readFileSync(path.join(root, 'lib', 'computer-browser.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'public', 'computer.html'), 'utf8');
const client = fs.readFileSync(path.join(root, 'public', 'computer.js'), 'utf8');

test('Computer 2569 exposes real browser controls with safety boundaries', () => {
  for (const route of ['/api/computer/status', '/api/computer/action', '/api/computer/stop']) assert.match(server, new RegExp(route.replaceAll('/', '\\/')));
  assert.match(server, /requireAuth, requireOwner/);
  assert.match(server, /CONFIRMATION_REQUIRED/);
  assert.match(browser, /Page\.captureScreenshot/);
  assert.match(browser, /Runtime\.evaluate/);
  for (const marker of ['screen', 'selector', 'click', 'type', 'action log']) assert.match(page + client, new RegExp(marker, 'i'));
});

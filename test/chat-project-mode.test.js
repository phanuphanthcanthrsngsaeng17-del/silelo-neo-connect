const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const chat = fs.readFileSync(path.join(__dirname, '..', 'public', 'chat.html'), 'utf8');

test('chat explicitly disables simulation and local code execution routes', () => {
  assert.match(server, /CHAT_DISABLED_SIMULATION_PATHS/);
  for (const route of ['/api/run', '/api/code', '/api/codetool', '/api/install', '/api/sandbox', '/api/db', '/db', '/preview']) {
    assert.match(server, new RegExp(`['"]${route.replace('/', '\\/')}['"]`));
  }
  assert.match(server, /status\(410\)/);
  assert.match(server, /SANDBOX_DISABLED/);
  assert.match(server, /Git\/IDE/);
});

test('chat API rejects code blocks and /db commands without executing them', () => {
  assert.match(server, /ห้องแชทนี้ไม่รันหรือจำลองโค้ด/);
  assert.ok(server.includes("const dm = /^\\/db"));
  assert.match(server, /คำสั่ง \/db ถูกปิดจากห้องแชทแล้ว/);
  assert.doesNotMatch(server, /provider: 'chat-code', model: 'bounded-exec'/);
});

test('simulation controls are hidden while IDE remains available', () => {
  assert.match(chat, /#superBtn, #coderBtn, #previewBtn, #codeBtn/);
  assert.match(chat, /id="ideBtn" title="🐙 GitHub Editor/);
  assert.match(chat, /'ideBtn': 'github'/);
  assert.match(chat, /ghEditor/);
  assert.match(chat, /ghSaveFile/);
  assert.match(chat, /ยืนยันเขียนไฟล์จริงและสร้าง commit บน GitHub/);
  assert.match(chat, /fetch\('\/api\/github\/file'/);
  assert.doesNotMatch(chat, /'ideBtn': 'ide'/);
  assert.match(chat, /Git\/IDE only/);
  assert.match(chat, /ปิดการจำลองและการรันโค้ดจากห้องแชท/);
  assert.doesNotMatch(chat, /<span class="screen-help-key">🛠️ Code Tools<\/span>/);
  assert.doesNotMatch(chat, /<span class="screen-help-key">🗄️ DB Sandbox<\/span>/);
  assert.doesNotMatch(chat, /'previewBtn': 'preview'/);
});

test('chat never asks the server to run code for a normal message', () => {
  assert.match(chat, /const requestedCodeRun = false/);
});

test('project agent exposes a broad real-project skill registry', () => {
  const agent = require('../lib/project-agent');
  assert.equal(agent.PROJECT_SKILLS.length, 20);
  for (const id of ['repo-status', 'file-read', 'file-search', 'project-plan', 'multi-file-edit', 'backend-api', 'database', 'authentication', 'testing', 'debugging', 'security-review', 'performance', 'git-diff-review', 'commit']) {
    assert.ok(agent.PROJECT_SKILLS.some(skill => skill.id === id), id);
  }
  assert.match(server, /action === 'skills'/);
  assert.match(server, /\/project skills/);
});

test('project agent is wired to real GitHub actions and keeps owner confirmation', () => {
  assert.match(server, /app\.post\('\/api\/project-agent', requireAuth, requireOwner, requireGithubToken/);
  assert.match(server, /action === 'status'/);
  assert.match(server, /action === 'read'/);
  assert.match(server, /action === 'plan'/);
  assert.match(server, /action === 'apply'/);
  assert.match(server, /body\.confirm !== true/);
  assert.match(server, /githubRepo\.writeFile/);
  assert.match(server, /const pm = \/\^\\\/project/);
});

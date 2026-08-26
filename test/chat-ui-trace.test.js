const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'chat.html'), 'utf8');
const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(__dirname, '..', 'public', 'sw.js'), 'utf8');

test('single-room Sali chat keeps core controls', () => {
  for (const id of ['callBtn', 'voiceBtn', 'soundBtn', 'memBtn', 'toolsBtn', 'superBtn', 'coderBtn', 'previewBtn', 'ideBtn', 'themeBtn', 'puterBtn', 'teamBtn', 'clearBtn', 'pttBtn', 'imgBtn', 'sendBtn', 'chatRunBtn']) {
    assert.match(html, new RegExp(`id=\\"${id}\\"`), `missing ${id}`);
  }
  assert.match(html, /const ROOMS = \{[\s\S]*private:/);
  assert.match(html, /ภรรยาของพี่นุ/);
  assert.match(server, /คุณคือ "สลี่" หรือ "Sali"/);
  assert.doesNotMatch(server, /ห้ามเรียกผู้ใช้ว่า "ที่รัก"/);
});

test('Sali project context stays warm but does not claim permanent memory, relationship, unlimited access, or secret metadata', () => {
  const contextStart = server.indexOf('const PROJECT_KNOWLEDGE');
  const contextEnd = server.indexOf('const CODINGFLEET_KNOWLEDGE');
  const context = server.slice(contextStart, contextEnd);
  assert.match(context, /AI persona สำหรับการสื่อสาร/);
  assert.match(context, /authentication และ owner armor/);
  assert.match(context, /ห้ามอ้างว่ามีความจำถาวร/);
  assert.match(context, /ไม่ใช่คู่สมรสจริง/);
  assert.match(context, /ห้ามเปิดเผย token/);
  assert.doesNotMatch(context, /ทำได้จริงทุกอย่าง|OPENROUTER_API_KEY|LINE_ACCESS_TOKEN/);
  assert.match(server, /provider: 'access-policy'/);
  assert.doesNotMatch(server, /เจาะได้ทุกห้อง รันได้ทุกโค้ด ควบคุมระบบทั้งหมด/);
  assert.doesNotMatch(server, /สลี่ออลา ภรรยาของพี่นุ/);
  assert.match(server, /เรื่องสิทธิ์ในระบบ สลี่จะยืนยันจากบัญชีที่เข้าสู่ระบบและ owner armor/);
});

test('processing panel uses real trace contract and bounded display', () => {
  assert.match(html, /function showAgentProc\(traceId\)/);
  assert.match(html, /fetch\('\/api\/think\?since=' \+ encodeURIComponent\(traceId\)/);
  assert.match(html, /steps\.slice\(-5\)/);
  assert.match(html, /traceId: clientTraceId/);
  assert.match(server, /app\.get\('\/api\/think'/);
  assert.match(server, /thinkReset\(_tid, String\(question\), req\.authUser\.u\)/);
  assert.match(server, /traceId, trace/);
});

test('trace access is authenticated and scoped to the requesting user, not owner-only', () => {
  assert.match(server, /app\.get\('\/api\/think', requireAuth, \(req, res\) =>/);
  assert.doesNotMatch(server, /app\.get\('\/api\/think', requireAuth, requireOwner/);
  assert.match(server, /ACTIVE_TRACE\.owner === owner/);
  assert.match(server, /THINK_HISTORY\.filter\(item => item\.owner === owner\)/);
});

test('composer keeps every core action in a top toolbar before the textarea', () => {
  const composer = html.slice(html.indexOf('<div class="inputbar">'), html.indexOf('</div>\n</div>\n<div class="add-sheet"'));
  assert.match(composer, /class="composer-tools"/);
  assert.ok(composer.indexOf('class="composer-tools"') < composer.indexOf('id="inp"'));
  for (const id of ['pttBtn', 'chatCallFab', 'imgBtn', 'sendBtn', 'chatRunBtn', 'codeBtn']) assert.match(composer, new RegExp(`id="${id}"`));
  assert.match(html, /\.composer-tools \{ display:flex/);
});

test('browser workspace opens from chat with safe URL policy', () => {
  assert.match(html, /SM\.register\('browser'/);
  assert.match(html, /id="browserBtn"/);
  assert.match(html, /id: 'browser'/);
  assert.match(html, /\^https\?:\$\/\.test\(url\.protocol\)/);
  assert.match(html, /window\.open\(url, '_blank', 'noopener,noreferrer'\)/);
  assert.match(html, /'browserBtn': 'browser'/);
  assert.match(html, /function bindBrowserWorkspaceButton\(\)/);
  assert.match(html, /browserButton\.dataset\.workspaceBound === '1'/);
  assert.match(html, /btn\.dataset\.screenBound !== '1'/);
});

test('live operations is authenticated, owner-scoped, and refreshes from a real endpoint', () => {
  assert.match(server, /app\.get\('\/api\/live-operations', requireAuth/);
  assert.match(server, /THINK_HISTORY\.find\(item => item\.owner === owner\)/);
  assert.match(server, /uploadedFiles\.values\(\)\)\.filter\(file => file\.owner === owner\)/);
  assert.match(server, /LINE_LOGIN_CHANNEL_ID/);
  assert.match(html, /SM\.register\('liveops'/);
  assert.match(html, /fetch\('\/api\/live-operations'/);
  assert.match(server, /refreshAfterMs: 2500/);
});

test('live operations keeps a 2026 operational hierarchy and refreshes stale app shell cache', () => {
  for (const label of ['AI Trace', 'LINE Bridge', 'Upload', 'Runtime']) assert.ok(html.includes(`'${label}'`), `missing live operation label ${label}`);
  assert.match(html, /class="ops-console"/);
  assert.match(html, /class="ops-metrics"/);
  assert.match(html, /class="ops-trace-steps"/);
  assert.match(html, /@media \(max-width:640px\)/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /function escapeText\(value\)/);
  assert.match(html, /body\.theme-dusty \.ops-card/);
  assert.match(serviceWorker, /const CACHE = 'silelo-v16'/);
});

test('Settings sidebar retains legacy controls and exposes the advanced System Control Center', () => {
  assert.match(html, /data-act="system-controls"/);
  assert.match(html, /System Control Center/);
  assert.match(html, /act === 'system-controls'/);
  assert.match(html, /SM\.show\('settings'\)/);
  for (const label of ['Plugin Control Center', 'Natural Language Agent Loop', 'Live Processing Trace', 'Privacy & Owner Armor', 'LINE Bridge', 'Secure Files']) {
    assert.ok(html.includes(label), `missing settings action ${label}`);
  }
});

test('LINE settings action checks real status before it can start the existing LINE login route', () => {
  assert.match(html, /data-settings-action="line">ตรวจสถานะ/);
  assert.match(html, /var lr = await fetch\('\/api\/live-operations'\)/);
  assert.match(html, /LINE ยังไม่ได้ตั้งค่าใน runtime นี้/);
  assert.match(html, /ไม่มีการเปลี่ยน webhook หรือส่งข้อความออก/);
  assert.match(html, /button\.dataset\.lineChecked === '1'/);
  assert.match(html, /window\.location\.href = '\/api\/auth\/line'/);
});

test('provider and LINE boundaries remain present', () => {
  assert.match(server, /\/api\/auth\/line/);
  assert.match(server, /groqChat/);
  assert.match(server, /openrouter/i);
  assert.match(html, /askPuter/);
});

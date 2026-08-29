'use strict';

const PROJECT_SKILLS = [
  ['repo-status', 'ตรวจสถานะ repository, branch และ commit'],
  ['file-read', 'อ่านไฟล์จริงจาก GitHub และแยกไฟล์ binary'],
  ['file-search', 'ค้นหาไฟล์และสัญลักษณ์ใน repository'],
  ['project-plan', 'วิเคราะห์งานและวางแผนแก้ไขพร้อมรายการทดสอบ'],
  ['multi-file-edit', 'จัดชุดแก้ไขหลายไฟล์และสร้าง diff'],
  ['frontend-ui', 'แก้ HTML, CSS, JavaScript และ responsive UI'],
  ['backend-api', 'วิเคราะห์และแก้ REST/API route, validation และ error handling'],
  ['database', 'วิเคราะห์ schema, migration, query และ data contract'],
  ['authentication', 'ตรวจ auth, session, owner permission และ access boundary'],
  ['integration', 'ตรวจการเชื่อมต่อ API, webhook และ service configuration'],
  ['testing', 'ออกแบบ unit, integration และ regression tests'],
  ['debugging', 'วิเคราะห์ error log และหาสาเหตุจาก source จริง'],
  ['security-review', 'ตรวจ secret, path traversal, injection และ permission'],
  ['performance', 'ตรวจ bottleneck, caching, payload และ memory usage'],
  ['accessibility', 'ตรวจ semantic HTML, keyboard flow และ contrast'],
  ['documentation', 'ปรับ README, API docs และ change notes'],
  ['refactor', 'จัดโครงสร้างโค้ดโดยคง behavior เดิม'],
  ['git-diff-review', 'สรุป diff และผลกระทบก่อน commit'],
  ['branch-workflow', 'อ่านและจัดการ branch ที่ได้รับอนุญาต'],
  ['commit', 'เขียนไฟล์จริงและ commit ผ่าน GitHub หลังยืนยัน'],
  ['data-fetch', 'ดึงข้อมูลจริงจาก URL และบันทึกเป็นไฟล์ของเจ้าของ'],
  ['archive-inventory', 'ตรวจรายการไฟล์ใน ZIP/TAR และป้องกัน path traversal'],
  ['archive-extract', 'แตกไฟล์ ZIP/TAR ลงพื้นที่งานของเจ้าของ'],
  ['media-prepare', 'เตรียมภาพและ metadata สำหรับงานสื่อ'],
  ['video-render', 'สร้างวิดีโอ MP4 จริงจากภาพด้วย FFmpeg'],
  ['media-status', 'รายงานสถานะไฟล์และผลลัพธ์งานสื่อ']
].map(([id, description]) => ({ id, description }));

function cleanPath(value) {
  const p = String(value || '').trim().replace(/^\/+/, '');
  if (!p || p.length > 300 || p.includes('..') || /[\r\n]/.test(p)) throw new Error('invalid project path');
  return p;
}

function buildPlanPrompt(task, files) {
  const source = files.map(f => `FILE: ${f.path}\n${String(f.content || '').slice(0, 16000)}`).join('\n\n');
  return [
    'คุณคือ project-agent ที่แก้ repository จริงผ่าน GitHub เท่านั้น ห้ามรันโค้ด ห้ามใช้ sandbox และห้ามอ้างว่าทดสอบสำเร็จถ้ายังไม่ได้ทดสอบจริง',
    'วิเคราะห์งานและไฟล์ที่ให้มา แล้วตอบ JSON เท่านั้นในรูปแบบ:',
    '{"summary":"...","tests":["..."],"files":[{"path":"...","content":"เนื้อหาไฟล์เต็มที่แก้แล้ว","reason":"..."}]}',
    'ห้ามส่ง patch แบบย่อ ห้ามตัดเนื้อหาไฟล์ และห้ามแก้ไฟล์นอกข้อมูลที่ให้มา',
    `งานของผู้ใช้: ${String(task || '').slice(0, 4000)}`,
    source
  ].join('\n\n');
}

function parsePlan(reply) {
  const text = String(reply || '').trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('agent did not return JSON plan');
  const plan = JSON.parse(text.slice(start, end + 1));
  if (!plan || !Array.isArray(plan.files) || plan.files.length > 12) throw new Error('invalid project plan');
  plan.files = plan.files.map(f => ({ path: cleanPath(f.path), content: String(f.content || ''), reason: String(f.reason || '').slice(0, 500) }));
  return { summary: String(plan.summary || '').slice(0, 1200), tests: Array.isArray(plan.tests) ? plan.tests.map(x => String(x).slice(0, 300)).slice(0, 20) : [], files: plan.files };
}

module.exports = { PROJECT_SKILLS, cleanPath, buildPlanPrompt, parsePlan };

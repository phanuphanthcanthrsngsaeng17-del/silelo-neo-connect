'use strict';

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

module.exports = { cleanPath, buildPlanPrompt, parsePlan };

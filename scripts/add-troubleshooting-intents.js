const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const library = path.join(root, 'skills', 'intent-library');
const registryPath = path.join(library, 'registry.json');

const groups = [
  ['dependency', 'Dependencies', [
    'แก้ dependency ติดตั้งไม่ผ่าน', 'แก้แพ็กเกจเวอร์ชันชนกัน', 'แก้ lockfile ไม่ตรงระบบ', 'แก้ native module คอมไพล์ไม่ผ่าน', 'แก้ package registry ใช้งานไม่ได้', 'แก้ peer dependency warning', 'แก้ dependency หายหลัง deploy', 'แก้ circular dependency', 'แก้ import package ไม่พบ', 'แก้ dependency vulnerability'
  ]],
  ['configuration', 'Configuration', [
    'แก้ค่า environment ไม่ถูกโหลด', 'แก้ config ต่างกันระหว่างเครื่อง', 'แก้ feature flag ไม่ทำงาน', 'แก้ค่า default configuration ผิด', 'แก้ config schema ไม่ผ่าน', 'แก้การอ่านไฟล์ config ผิด path', 'แก้ timezone configuration', 'แก้ locale configuration', 'แก้ CORS configuration', 'แก้การ reload configuration'
  ]],
  ['database', 'Database', [
    'แก้ database connection pool เต็ม', 'แก้ migration ล้มเหลว', 'แก้ schema ไม่ตรงกับโค้ด', 'แก้ query ช้า', 'แก้ deadlock ในฐานข้อมูล', 'แก้ transaction rollback ผิดพลาด', 'แก้ข้อมูลซ้ำจาก constraint', 'แก้ index ไม่ถูกใช้', 'แก้ database timeout', 'แก้ replica lag'
  ]],
  ['api', 'API', [
    'แก้ API response status ผิด', 'แก้ request validation ล้มเหลว', 'แก้ JSON response format ผิด', 'แก้ pagination ไม่ครบ', 'แก้ API rate limit', 'แก้ webhook signature ไม่ผ่าน', 'แก้ idempotency ของ API', 'แก้ API version compatibility', 'แก้ streaming response ขาดช่วง', 'แก้ API error mapping'
  ]],
  ['authentication', 'Authentication', [
    'แก้ session หมดอายุเร็วเกินไป', 'แก้ refresh token ใช้ไม่ได้', 'แก้ OAuth callback ผิด', 'แก้ cookie ไม่ถูกส่ง', 'แก้ login สำเร็จแต่เข้าไม่ได้', 'แก้ logout ไม่ล้าง session', 'แก้สิทธิ์ role ไม่อัปเดต', 'แก้การเชื่อมบัญชีซ้ำ', 'แก้ password reset ไม่ถึงผู้ใช้', 'แก้ MFA verification ล้มเหลว'
  ]],
  ['frontend', 'Frontend', [
    'แก้หน้าจอโหลดค้าง', 'แก้ state ไม่อัปเดต', 'แก้ฟอร์มส่งข้อมูลไม่ได้', 'แก้ปุ่มกดซ้ำแล้วเกิดรายการซ้ำ', 'แก้ route เปลี่ยนหน้าแล้วข้อมูลหาย', 'แก้ modal ปิดไม่ได้', 'แก้ error message ไม่แสดง', 'แก้ hydration mismatch', 'แก้ browser console error', 'แก้ responsive layout ล้นจอ'
  ]],
  ['mobile', 'Mobile', [
    'แก้แอปมือถือเปิดแล้วเด้ง', 'แก้ deep link ไม่เปิดหน้าที่ถูกต้อง', 'แก้ push notification ไม่เข้า', 'แก้ permission กล้อง', 'แก้ permission ไมโครโฟน', 'แก้ keyboard บังฟอร์ม', 'แก้แอปทำงานต่างกันระหว่าง iOS กับ Android', 'แก้ background task ไม่ทำงาน', 'แก้ mobile offline sync', 'แก้แอปค้างเมื่อกลับจาก background'
  ]],
  ['network', 'Network', [
    'แก้ DNS resolve ไม่ได้', 'แก้ TLS certificate error', 'แก้ connection reset', 'แก้ proxy ทำให้ request ผิดพลาด', 'แก้ timeout ระหว่างบริการ', 'แก้ retry ทำให้โหลดซ้ำ', 'แก้ websocket หลุด', 'แก้ IPv6 connectivity', 'แก้ network request ถูกบล็อก', 'แก้ latency สูงเฉพาะบางภูมิภาค'
  ]],
  ['performance', 'Performance', [
    'แก้ memory leak', 'แก้ CPU สูงผิดปกติ', 'แก้ response time p95 สูง', 'แก้หน้าเว็บโหลดช้า', 'แก้ bundle ใหญ่เกินไป', 'แก้ image ทำให้โหลดช้า', 'แก้ cache hit ต่ำ', 'แก้ queue backlog', 'แก้ concurrent request มากเกินไป', 'แก้ performance แย่ลงหลัง release'
  ]],
  ['testing', 'Testing', [
    'แก้ unit test flaky', 'แก้ integration test เชื่อม service ไม่ได้', 'แก้ end-to-end test timeout', 'แก้ test fixture ไม่ตรง schema', 'แก้ mock ไม่เหมือน production', 'แก้ test isolation', 'แก้ coverage ลดลง', 'แก้ snapshot test เปลี่ยนโดยไม่ตั้งใจ', 'แก้ test parallel race condition', 'แก้ CI test environment'
  ]],
  ['deployment', 'Deployment', [
    'แก้ build ใน CI ล้มเหลว', 'แก้ deploy แล้วไม่อัปเดตเวอร์ชัน', 'แก้ rolling deployment ค้าง', 'แก้ blue-green switch ผิด', 'แก้ container health check fail', 'แก้ image tag ผิด', 'แก้ startup command บน platform', 'แก้ secret ใน deployment ไม่ถูกส่ง', 'แก้ rollback release', 'แก้ deploy ต่าง environment'
  ]],
  ['observability', 'Observability', [
    'แก้ log ไม่ปรากฏ', 'แก้ log แยก trace ไม่ได้', 'แก้ metric ไม่ส่ง', 'แก้ dashboard แสดงค่าผิด', 'แก้ alert ยิงถี่เกินไป', 'แก้ alert ไม่ยิงเมื่อระบบล่ม', 'แก้ trace sampling สูงเกินไป', 'แก้ correlation id หาย', 'แก้ error reporting ซ้ำซ้อน', 'แก้ incident timeline ไม่ครบ'
  ]],
  ['storage', 'Storage', [
    'แก้อัปโหลดไฟล์ล้มเหลว', 'แก้ดาวน์โหลดไฟล์หมดอายุ', 'แก้ไฟล์ถูกลบผิดรายการ', 'แก้ไฟล์ชื่อภาษาไทยผิด', 'แก้ MIME type ไม่ถูกต้อง', 'แก้ขนาดไฟล์เกิน limit', 'แก้ signed URL ใช้ไม่ได้', 'แก้ object storage permission', 'แก้ไฟล์ซ้ำจาก retry', 'แก้พื้นที่จัดเก็บเต็ม'
  ]],
  ['messaging', 'Messaging', [
    'แก้คิวข้อความค้าง', 'แก้ส่งข้อความซ้ำ', 'แก้ข้อความหายจาก queue', 'แก้ consumer ไม่รับงาน', 'แก้ dead letter queue โตขึ้น', 'แก้ลำดับข้อความสลับ', 'แก้ message acknowledgement', 'แก้ broker connection', 'แก้ notification ส่งช้า', 'แก้ template ข้อความผิด'
  ]],
  ['payments', 'Payments', [
    'แก้ชำระเงินไม่สำเร็จ', 'แก้ webhook การชำระเงินซ้ำ', 'แก้ยอดชำระไม่ตรง', 'แก้ refund ไม่เข้า', 'แก้สถานะ order ค้างชำระ', 'แก้บัตรถูกปฏิเสธ', 'แก้สกุลเงินผิด', 'แก้ใบเสร็จไม่ถูกสร้าง', 'แก้ subscription ต่ออายุไม่ได้', 'แก้ payment reconciliation'
  ]],
  ['security', 'Security', [
    'แก้ CSRF validation', 'แก้ XSS ในข้อมูลผู้ใช้', 'แก้ SQL injection finding', 'แก้ security header หาย', 'แก้สิทธิ์เข้าถึงข้อมูลเกินขอบเขต', 'แก้ brute force protection', 'แก้ audit log ไม่ครบ', 'แก้ token leakage ใน log', 'แก้ dependency security scan', 'แก้ข้อมูลส่วนตัวแสดงผิดผู้ใช้'
  ]],
  ['data-pipeline', 'Data Pipeline', [
    'แก้ไฟล์นำเข้าข้อมูลผิดรูปแบบ', 'แก้ encoding ข้อมูลเพี้ยน', 'แก้ ETL job ล้มเหลว', 'แก้ข้อมูลซ้ำใน pipeline', 'แก้ข้อมูลหายระหว่างแปลง', 'แก้ schema drift', 'แก้ batch job ทำงานช้า', 'แก้ข้อมูลปลายทางไม่สดใหม่', 'แก้ validation ของข้อมูล', 'แก้ backfill ข้อมูล'
  ]],
  ['integration', 'Integration', [
    'แก้เชื่อมต่อบริการภายนอกไม่ได้', 'แก้ API key ของ provider ใช้ไม่ได้', 'แก้ provider response เปลี่ยนรูปแบบ', 'แก้ sync ข้อมูลไม่ครบ', 'แก้ integration timeout', 'แก้ quota ของ provider', 'แก้การแมปฟิลด์ระหว่างระบบ', 'แก้ callback จาก provider ไม่เข้า', 'แก้ fallback provider', 'แก้การยกเลิกการเชื่อมต่อ'
  ]],
  ['accessibility-content', 'Accessibility and Content', [
    'แก้ keyboard navigation', 'แก้ screen reader อ่านไม่ครบ', 'แก้สี contrast ไม่ผ่าน', 'แก้ focus หายหลังเปิด dialog', 'แก้ label ฟอร์มไม่สัมพันธ์', 'แก้ภาษาแปลไม่ครบ', 'แก้ข้อความแจ้งเตือนไม่ชัดเจน', 'แก้วันที่และตัวเลขตาม locale', 'แก้เนื้อหาซ้ำในหน้าเว็บ', 'แก้ rich text แสดงผลผิด'
  ]],
  ['reliability-recovery', 'Reliability and Recovery', [
    'แก้ระบบล่มเป็นช่วง ๆ', 'แก้ failover ไม่ทำงาน', 'แก้ backup สร้างไม่สำเร็จ', 'แก้ restore backup', 'แก้ข้อมูลเสียหายหลังไฟดับ', 'แก้ graceful shutdown', 'แก้ cascading failure', 'แก้ circuit breaker เปิดค้าง', 'แก้ capacity ไม่พอช่วงพีค', 'แก้ disaster recovery drill'
  ]]
];

const constraints = [
  'ใช้เฉพาะเครื่องมือและไฟล์ที่ได้รับอนุญาตในแผนงาน',
  'ห้ามอ่านหรือคัดลอก secret, API key, token หรือข้อมูลส่วนตัว',
  'ห้ามรันคำสั่งอิสระหรือแก้ไฟล์นอกขอบเขตโดยไม่ได้รับการยืนยัน',
  'ต้องตรวจผลลัพธ์จริงก่อนรายงานว่าสำเร็จ',
  'งานที่มีผลภายนอกต้องแสดงแผนและขอการยืนยันก่อนดำเนินการ'
];

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-|-$/g, '').replace(/-+/g, '-');
}
function skillMarkdown(mode, id, title) {
  const isUnderstand = mode === 'understand';
  const heading = `${isUnderstand ? 'Intent Understand' : 'Intent Execute'}: ${title}`;
  const description = isUnderstand
    ? `แยกเจตนาและข้อมูลสำคัญสำหรับงาน Troubleshooting เรื่อง${title} ใช้เมื่อผู้ใช้ขอวิเคราะห์ความต้องการ เลือก skill หรือขอแผนงาน โดยยังไม่ลงมือเปลี่ยนแปลงระบบ`
    : `ดำเนินงาน Troubleshooting เรื่อง${title} ตามแผนที่ยืนยันแล้ว ใช้เมื่อมี input ครบและคำสั่งอยู่ใน allowlist พร้อมตรวจผลลัพธ์และรายงานสถานะจริง`;
  const useWhen = isUnderstand
    ? `ใช้เมื่อคำสั่งเกี่ยวข้องกับ Troubleshooting เรื่อง${title} และต้องแยกเจตนาก่อนลงมือทำ`
    : `ใช้เมื่อ Intent Understand ยืนยันเจตนา${title} และ input ผ่าน validation แล้ว`;
  const steps = isUnderstand
    ? ['อ่านคำสั่งและบริบทโดยไม่สันนิษฐานข้อมูลที่ไม่มีหลักฐาน', 'สกัดเจตนา ข้อมูลนำเข้า ข้อจำกัด และผลลัพธ์ที่ผู้ใช้คาดหวัง', 'ตรวจความกำกวมและทำเครื่องหมายสิ่งที่ต้องถามเพิ่ม', `แนะนำ Skill Execute ที่ตรงกันจาก registry โดยเลือกเฉพาะ ${id.replace('understand-', 'execute-')}`, 'กำหนดว่าเรื่องนี้ต้องขอการยืนยันก่อนหรือไม่']
    : ['ตรวจว่า intent ตรงกับ skill นี้และ input อยู่ใน schema ที่กำหนด', 'สร้างแผนสั้น ๆ ที่มีขอบเขตและจุดตรวจผลลัพธ์', 'ขอการยืนยันก่อนงานที่มีผลต่อข้อมูล บัญชี การเผยแพร่ หรือบริการภายนอก', 'ดำเนินการเฉพาะเครื่องมือใน allowlist และหยุดเมื่อเกินจำนวนรอบหรือ timeout', 'ตรวจหลักฐานผลลัพธ์ แยก completed, failed, blocked และ requires_confirmation อย่างตรงไปตรงมา'];
  const outputs = isUnderstand ? 'คืน intent, entities, ambiguities, recommendedSkillIds และ needsConfirmation เป็นข้อมูลที่ตรวจสอบต่อได้ ห้ามลงมือแก้ไฟล์ ส่งข้อมูล หรือเรียกบริการภายนอกในโหมดนี้' : 'คืน steps, result, evidence, warnings และ nextAction ห้ามอ้างว่าสำเร็จหากไม่มีหลักฐาน และห้ามเปิดช่องให้รันโค้ดอิสระ';
  return `---\nname: ${id}\ndescription: ${description}\n---\n\n# ${heading}\n\n## ใช้เมื่อ\n${useWhen}\n\n## ขั้นตอน\n${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\n## ผลลัพธ์ที่ต้องคืน\n${outputs}\n\n## ข้อจำกัด\n${constraints.map((item) => `- ${item}`).join('\n')}\n`;
}

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const existingIds = new Set(registry.skills.map((skill) => skill.id));
let added = 0;
let setNumber = 11;
for (const [group, categoryTitle, titles] of groups) {
  for (const title of titles) {
    const suffix = `${String(setNumber).padStart(3, '0')}-${group}`;
    const understandId = `understand-troubleshooting-${suffix}`;
    const executeId = `execute-troubleshooting-${suffix}`;
    if (existingIds.has(understandId) || existingIds.has(executeId)) throw new Error(`Duplicate intent id: ${suffix}`);
    const baseIntents = [title, title.replace(/^แก้/, 'วิเคราะห์'), `Troubleshooting ${categoryTitle}`, 'วิเคราะห์เจตนาแก้ปัญหา'];
    const understand = {
      id: understandId, mode: 'understand', category: 'troubleshooting', categoryTitle: 'Troubleshooting',
      title: `Intent Understand: ${title}`, description: `แยกเจตนาและข้อมูลสำคัญสำหรับงาน Troubleshooting เรื่อง${title} ใช้เมื่อผู้ใช้ขอวิเคราะห์ความต้องการ เลือก skill หรือขอแผนงาน โดยยังไม่ลงมือเปลี่ยนแปลงระบบ`, intents: baseIntents,
      inputs: ['คำสั่งผู้ใช้', 'บริบทที่เกี่ยวข้อง', 'ข้อจำกัด'], outputs: ['intent', 'entities', 'ambiguities', 'recommendedSkillIds', 'needsConfirmation'], constraints, path: `skills/intent-library/${understandId}/SKILL.md`
    };
    const execute = {
      id: executeId, mode: 'execute', category: 'troubleshooting', categoryTitle: 'Troubleshooting',
      title: `Intent Execute: ${title}`, description: `ดำเนินงาน Troubleshooting เรื่อง${title} ตามแผนที่ยืนยันแล้ว ใช้เมื่อมี input ครบและคำสั่งอยู่ใน allowlist พร้อมตรวจผลลัพธ์และรายงานสถานะจริง`, intents: baseIntents,
      inputs: ['intent ที่ยืนยันแล้ว', 'input ที่ผ่าน validation', 'แผนและสิทธิ์'], outputs: ['steps', 'result', 'evidence', 'warnings', 'nextAction'], constraints, path: `skills/intent-library/${executeId}/SKILL.md`
    };
    for (const skill of [understand, execute]) {
      const dir = path.join(library, skill.id);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'SKILL.md'), skillMarkdown(skill.mode, skill.id, title), 'utf8');
      registry.skills.push(skill);
    }
    setNumber += 1;
    added += 1;
  }
}
registry.total = registry.skills.length;
registry.modes = {
  understand: registry.skills.filter((skill) => skill.mode === 'understand').length,
  execute: registry.skills.filter((skill) => skill.mode === 'execute').length
};
fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
console.log(`Added ${added} troubleshooting intent sets (${added * 2} skills). Registry total: ${registry.total}.`);

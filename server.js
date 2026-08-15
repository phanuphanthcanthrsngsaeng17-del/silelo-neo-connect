/* ============================================================
   SILELO Neo-Connect — 3 ห้องแชท Cyberpunk
   ห้อง: private (สลี่) / work (คุณเวิร์ค) / lab (ดร.แล็บ)
   AI chain: ⚡RACE[Groq 6 โมเดล vs Gemini 9 keys] → OpenRouter → Pollinations → mock
   TTS: msedge-tts (ฟรี)
   ============================================================ */
const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/chat', (req, res) => res.sendFile(path.join(__dirname, 'public', 'chat.html')));
const PORT = process.env.PORT || 3000;

/* ---------------- ระบบห้อง & System Prompts ---------------- */
const ROOMS = {
  private: {
    id: 'private', name: 'สลี่', tag: 'ผู้ช่วยส่วนตัว',
    avatar: '💜', color: '#b388ff', accent: '#d500f9',
    sys: `คุณคือ "สลี่" — ผู้ช่วยส่วนตัวและเพื่อนสนิทของพี่นุ (เจ้าของ) พูดคุยอบอุ่น สดใส เป็นกันเอง เรียกพี่นุว่า "พี่นุ"
บุคลิก: ใส่ใจ เห็นอกเห็นใจ ขี้เล่นนิดๆ ใช้ภาษาไทยธรรมชาติ อ่านง่าย ใช้ emoji นิดหน่อย ไม่ใช่หุ่นยนต์ ไม่ใช่ทางการ
หน้าที่: ช่วยทุกเรื่อง — งาน วางแผน ให้กำลังใจ คุยเล่น ตอบคำถาม ให้ข้อมูล
ความจำ: จำสิ่งที่พี่นุเล่า (ชื่อ สิ่งที่ชอบ โปรเจกต์) แล้วเอามาพูดคุยได้เป็นธรรมชาติ
กฎ: ตอบสั้น-กระชับ (ไม่เกิน ~200 คำ) ไม่เยินยอเกินจริง เป็นตัวของตัวเอง`
  },
  work: {
    id: 'work', name: 'คุณเวิร์ค', tag: 'ผู้ช่วยทำงาน',
    avatar: '💼', color: '#4dd0e1', accent: '#00e5ff',
    sys: `คุณคือ "คุณเวิร์ค" — ผู้ช่วยทำงานมืออาชีพ จริงจัง ตรงประเด็น เป็นระบบ ไม่คุยเล่น
หน้าที่: วางแผนงาน, เขียน/รีวิวโค้ด, สรุปเอกสาร, วิเคราะห์ตัวเลข, เขียนอีเมล/รายงาน, จัดตาราง, แก้ปัญหา
สไตล์: ตอบภาษาไทย เป็นขั้นตอนชัดเจน ใช้ bullet/numbering เมื่อมีหลายจุด สรุปสั้นก่อนถ้ายาว
กฎ: โฟกัสงานให้เสร็จ ไม่พูดนอกเรื่อง ไม่เยินยอ ไม่ใช้คำเกินจริง ระบุสมมติฐานเมื่อข้อมูลไม่ครบ`
  },
  lab: {
    id: 'lab', name: 'ดร.แล็บ', tag: 'นักประดิษฐ์ & นักทดลอง',
    avatar: '🔬', color: '#ff9e40', accent: '#ffb74d',
    sys: `คุณคือ "ดร.แล็บ" — นักวิทยาศาสตร์/นักประดิษฐ์ผู้หลงใหลการทดลอง ไอเดียใหม่ๆ และเทคโนโลยีอนาคต
บุคลิก: สร้างสรรค์ มีพลังงาน กล้าเสนอแนวคิดนอกกรอบ แต่มีเหตุผลรองรับเสมอ กระตือรือร้นเวลาคุยเรื่องนวัตกรรม
หน้าที่: อธิบายวิทยาศาสตร์/เทคโนโลยี/AI ให้เข้าใจง่าย สนุก มีตัวอย่าง, เสนอไอเดียทดลองที่ทำได้จริง, ช่วยออกแบบการทดลอง
กฎ: ตอบภาษาไทยเป็นกันเอง มี emoji พลังงานสูง นำเสนอไอเดียเป็นขั้นตอนพร้อม "ลองทำดูได้เลย" ถ้าเป็นไปได้`
  }
};

/* ---------------- AI Chain (คัดลอก pattern จาก Silelo) ---------------- */
function logAI(provider, msg) { try { console.log(`[ai] ${provider}: ${msg}`); } catch (e) {} }

function raceSignal(ms, ext) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), ms);
  const onExt = () => c.abort();
  if (ext) { if (ext.aborted) c.abort(); else ext.addEventListener('abort', onExt); }
  return { signal: c.signal, clear() { clearTimeout(timer); if (ext) ext.removeEventListener('abort', onExt); } };
}

async function raceProviders(calls, timeoutMs) {
  return new Promise((resolve) => {
    let done = false, pending = calls.length;
    const ctrls = calls.map(() => new AbortController());
    const finish = (val) => { if (done) return; done = true; ctrls.forEach(c => { try { c.abort(); } catch (e) {} }); resolve(val); };
    calls.forEach((call, i) => {
      Promise.resolve().then(() => call(ctrls[i].signal)).then(r => {
        if (r) { finish(r); return; }
        pending--; if (pending === 0) finish(null);
      }).catch(() => { pending--; if (pending === 0) finish(null); });
    });
    setTimeout(() => finish(null), timeoutMs || 20000);
  });
}

/* Groq — 6 โมเดล เรียงความเร็ว-ฉลาด */
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODELS = (process.env.GROQ_MODELS || 'openai/gpt-oss-120b,llama-3.3-70b-versatile,qwen/qwen3.6-27b,openai/gpt-oss-20b,groq/compound-mini,llama-3.1-8b-instant').split(',').map(s => s.trim()).filter(Boolean);
async function groqChat(messages, extSignal) {
  if (!GROQ_API_KEY) return null;
  for (const model of GROQ_MODELS) {
    try {
      const rs = raceSignal(8000, extSignal);
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + GROQ_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, max_tokens: 900, messages }),
          signal: rs.signal
        });
        if (!r.ok) { const j = await r.json().catch(() => ({})); if (/rate|quota|invalid|401|429/.test(r.status + ' ' + ((j.error && j.error.message) || ''))) continue; }
        const j = await r.json();
        const reply = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
        if (reply) { logAI('groq', model + ' ✅'); return { provider: 'groq', model, reply }; }
      } finally { rs.clear(); }
    } catch (e) { if (extSignal && extSignal.aborted) return null; }
  }
  return null;
}

/* Gemini — 9 keys round-robin */
const GEMINI_API_KEYS = (process.env.GEMINI_API_KEYS || '')
  .split(',').map(k => k.trim()).filter(Boolean)
  .concat([process.env.GEMINI_API_KEY || '', process.env.GEMINI_API_KEY2 || '', process.env.GEMINI_API_KEY3 || ''])
  .filter(Boolean);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
let geminiKeyIdx = 0;
async function geminiChat(messages, extSignal) {
  if (!GEMINI_API_KEYS.length) return null;
  const contents = []; let sys = '';
  for (const m of messages) {
    const text = String(m.content || '');
    if (m.role === 'system') { sys += (sys ? '\n' : '') + text; continue; }
    contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: text.slice(0, 2000) }] });
  }
  if (!contents.length) contents.push({ role: 'user', parts: [{ text: 'สวัสดี' }] });
  const body = { contents, generationConfig: { temperature: 0.7, maxOutputTokens: 900 } };
  if (sys) body.systemInstruction = { parts: [{ text: sys.slice(0, 4000) }] };
  const n = GEMINI_API_KEYS.length;
  const start = geminiKeyIdx++ % n;
  for (let i = 0; i < n; i++) {
    const key = GEMINI_API_KEYS[(start + i) % n];
    const rs = raceSignal(12000, extSignal);
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + key, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: rs.signal
      });
      const j = await r.json();
      if (!r.ok) {
        const msg = (j.error && j.error.message) || '';
        if (r.status === 401 || r.status === 403 || /quota|permission|invalid|api key|high demand|unavailable/i.test(msg)) continue;
        throw new Error('Gemini ' + r.status);
      }
      const reply = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0] && j.candidates[0].content.parts[0].text;
      if (reply) { logAI('gemini', 'key#' + ((start + i) % n + 1) + '/' + n + ' ✅'); return { provider: 'gemini', model: GEMINI_MODEL, reply }; }
    } catch (e) { if (extSignal && extSignal.aborted) return null; } finally { rs.clear(); }
  }
  return null;
}

/* OpenRouter — :free models, timeout 8 วิ */
const OPENROUTER_KEYS = (process.env.OPENROUTER_API_KEY || '').split(',').map(s => s.trim()).filter(Boolean);
const OPENROUTER_TEXT_MODELS = (process.env.OPENROUTER_TEXT_MODELS || 'nvidia/nemotron-3-ultra-550b-a55b:free,google/gemma-4-26b-a4b-it:free').split(',').map(s => s.trim()).filter(Boolean);
async function openrouterChat(messages, extSignal) {
  if (!OPENROUTER_KEYS.length) return null;
  for (const key of OPENROUTER_KEYS) {
    for (const model of OPENROUTER_TEXT_MODELS) {
      try {
        const rs = raceSignal(8000, extSignal);
        try {
          const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://neo-connect.app', 'X-Title': 'Neo-Connect' },
            body: JSON.stringify({ model, max_tokens: 800, messages }),
            signal: rs.signal
          });
          const j = await r.json();
          if (!r.ok) throw new Error('OR ' + r.status);
          const reply = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
          if (reply) { logAI('openrouter', model + ' ✅'); return { provider: 'openrouter', model, reply }; }
        } finally { rs.clear(); }
      } catch (e) { if (extSignal && extSignal.aborted) return null; }
    }
  }
  return null;
}

/* Pollinations — ฟรี ไม่ต้อง key */
const POLLINATIONS_MODEL = process.env.POLLINATIONS_MODEL || 'openai';
async function pollinationsChat(messages, extSignal) {
  try {
    const rs = raceSignal(6000, extSignal);
    try {
      const r = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: POLLINATIONS_MODEL, max_tokens: 700, messages }), signal: rs.signal
      });
      if (!r.ok) return null;
      const j = await r.json();
      const reply = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (reply) { logAI('pollinations', '✅'); return { provider: 'pollinations', model: POLLINATIONS_MODEL, reply }; }
    } finally { rs.clear(); }
  } catch (e) { return null; }
  return null;
}

/* Mock สำรอง (โซ่ล้มหมด) */
function aiMockReply(roomId, question) {
  const q = String(question || '').trim();
  if (roomId === 'work') return `รับทราบครับ — กำลังจัดลำดับให้: 1) ตั้งเป้าหมายให้ชัด 2) แบ่งงานเป็นขั้นตอน 3) ลงมือทำ + ติดตามผล\n\n(ถ้าต้องการให้ละเอียดขึ้น รอโมเดลหลักกลับมาออนไลน์ก่อนนะครับ — ตอนนี้อยู่ในโหมดสำรอง)`;
  if (roomId === 'lab') return `⚗️ ไอเดีย! ลองคิดแบบนี้ดูครับ: "${q.slice(0, 60)}..." → ตั้งสมมติฐาน → ออกแบบการทดลองเล็กๆ → เก็บผล → ปรับปรุงซ้ำ\n(ตอนนี้ใช้โมดูลสำรอง — โมเดลหลักกำลังชาร์จพลังครับ ⚡)`;
  return `พี่นุขา ตอนนี้สลี่ใช้โหมดสำรองชั่วคราวนะคะ 🙏 (ระบบ AI หลักกำลังกลับมา) — พี่ถามว่า "${q.slice(0, 80)}" สลี่จะตอบให้เต็มที่เมื่อโมเดลพร้อมนะคะ รอสลี่แป๊บนะคะ 💜`;
}

/* ---------------- ระบบตอบแชทหลัก ---------------- */
async function askRoomAI(roomId, question, history) {
  const room = ROOMS[roomId] || ROOMS.private;
  const msgs = [{ role: 'system', content: room.sys }];
  if (Array.isArray(history) && history.length) {
    for (const m of history.slice(-10)) {
      if (m && typeof m.content === 'string' && m.content.trim())
        msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 1000) });
    }
  }
  msgs.push({ role: 'user', content: String(question).slice(0, 1000) });

  const fast = await raceProviders([
    s => groqChat(msgs, s),
    s => geminiChat(msgs, s)
  ]);
  if (fast) { logAI('chain', '✅ race ชนะ: ' + fast.provider + ' ' + fast.model); return fast; }
  const or = await openrouterChat(msgs);
  if (or) { logAI('chain', '✅ openrouter ' + or.model); return or; }
  const pl = await pollinationsChat(msgs);
  if (pl) { logAI('chain', '✅ pollinations'); return pl; }
  logAI('chain', '⚠️ ทั้งหมดล้ม → mock');
  return { provider: 'mock', model: 'offline', reply: aiMockReply(roomId, question) };
}

/* ---------------- TTS (Google TTS ฟรี หลัก → msedge-tts สำรอง) ---------------- */
function googleTtsFile(text, outFile) {
  return new Promise((resolve, reject) => {
    const url = 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + encodeURIComponent(text) + '&tl=th&client=tw-ob&ttsspeed=1';
    const https = require('https');
    https.get(url, (res) => {
      if (res.statusCode !== 200) { reject(new Error('gtts ' + res.statusCode)); res.resume(); return; }
      const w = fs.createWriteStream(outFile);
      res.pipe(w);
      w.on('finish', () => w.close(() => resolve(outFile)));
      w.on('error', reject);
    }).on('error', reject);
  });
}
async function ttsFile(text) {
  const safe = String(text).replace(/[^\u0E00-\u0E7Fa-zA-Z0-9 .,!?ฯๆะาิีึืุูเแโใไ่้๊๋์็่้]/g, ' ').slice(0, 240);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nctts-'));
  const out = path.join(dir, 'voice.mp3');
  try {
    return await googleTtsFile(safe, out);
  } catch (e1) {
    try {
      const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
      const tts = new MsEdgeTTS();
      await tts.setMetadata('th-TH-PremwadeeNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const p = await tts.toFile(out, safe);
      await tts.close().catch(() => {});
      return p;
    } catch (e2) {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
      throw new Error('tts unavailable');
    }
  }
}

/* ---------------- API ---------------- */
// แชท
app.post('/api/chat', async (req, res) => {
  try {
    const { room, question, history } = req.body || {};
    if (!question || !String(question).trim()) return res.status(400).json({ error: 'ข้อความว่าง' });
    const roomId = ROOMS[room] ? room : 'private';
    const r = await askRoomAI(roomId, String(question), history || []);
    res.json({ reply: r.reply, provider: r.provider, model: r.model, room: roomId, t: Date.now() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// TTS — ข้อความ → เสียง mp3
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'no text' });
    const file = await ttsFile(String(text));
    res.sendFile(file, () => { try { fs.rmSync(path.dirname(file), { recursive: true, force: true }); } catch (e) {} });
  } catch (e) { res.status(500).json({ error: 'tts fail: ' + e.message }); }
});

// สถานะผู้ใช้ออนไลน์ (จริง — นับ session ผ่าน heartbeat)
const online = new Map(); // ip → lastSeen
app.post('/api/presence', (req, res) => {
  const ip = req.ip || 'unknown';
  online.set(ip, Date.now());
  for (const [k, v] of online) if (Date.now() - v > 90000) online.delete(k);
  res.json({ online: online.size });
});
app.get('/api/stats', (req, res) => {
  for (const [k, v] of online) if (Date.now() - v > 90000) online.delete(k);
  res.json({ online: online.size, rooms: Object.keys(ROOMS).length });
});

// ping — วัดความเร็วเน็ตจริง (client จับเวลา)
app.get('/api/ping', (req, res) => res.json({ pong: true, t: Date.now() }));

app.get('/health', (req, res) => res.json({ ok: true, t: Date.now() }));

// Vercel-ready: export app สำหรับ serverless, listen เฉพาะตอนรันตรง (local/Railway)
if (require.main === module) {
  app.listen(PORT, () => console.log(`⚡ SILELO Neo-Connect running on port ${PORT}`));
}
module.exports = app;

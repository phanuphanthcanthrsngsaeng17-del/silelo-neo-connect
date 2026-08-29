'use strict';
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const WebSocket = require('ws');

const sessions = new Map();
const MAX_SESSIONS = 3;
const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1']);
function assertUrl(raw) {
  let u; try { u = new URL(String(raw || '')); } catch (_) { throw new Error('URL ไม่ถูกต้อง'); }
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('อนุญาตเฉพาะ http และ https');
  if (u.username || u.password) throw new Error('ไม่อนุญาต URL ที่ฝัง username/password');
  const h = u.hostname.toLowerCase();
  const ip = net.isIP(h);
  const privateIp = ip === 4 && (/^10\./.test(h) || /^127\./.test(h) || /^169\.254\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h));
  if (h === 'localhost' || h === 'metadata.google.internal' || h.endsWith('.internal') || h === '0.0.0.0' || h === '::' || privateIp) throw new Error('ไม่อนุญาต host ภายในหรือ private network');
  return u.href;
}
function freePort() { return new Promise((resolve, reject) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); s.on('error', reject); }); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
class CdpClient {
  constructor(url) { this.url = url; this.next = 0; this.pending = new Map(); this.ws = null; }
  async connect() { this.ws = new WebSocket(this.url); this.ws.on('message', raw => { let m; try { m = JSON.parse(String(raw)); } catch (_) { return; } const p = this.pending.get(m.id); if (!p) return; this.pending.delete(m.id); if (m.error) p.reject(new Error(m.error.message || 'CDP error')); else p.resolve(m.result || {}); }); await new Promise((resolve, reject) => { this.ws.once('open', resolve); this.ws.once('error', reject); }); }
  command(method, params = {}) { const id = ++this.next; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  close() { try { this.ws?.close(); } catch (_) {} }
}
async function waitJson(url, tries = 50) { for (let i = 0; i < tries; i++) { try { const r = await fetch(url); if (r.ok) return await r.json(); } catch (_) {} await sleep(100); } throw new Error('Chromium เปิดไม่สำเร็จ'); }
async function createSession(owner) {
  if (sessions.has(owner)) return sessions.get(owner);
  if (sessions.size >= MAX_SESSIONS) throw new Error('ถึงจำนวน Computer session สูงสุดแล้ว');
  const chrome = process.env.CHROME_PATH || '/usr/bin/chromium';
  if (!fs.existsSync(chrome)) throw new Error('ไม่พบ Chromium ใน runtime นี้');
  const port = await freePort(); const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'silelo-computer-'));
  const proc = childProcess.spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars', '--window-size=1280,800', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  try { const targets = await waitJson(`http://127.0.0.1:${port}/json`); const page = Array.isArray(targets) ? targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl) : null; if (!page) throw new Error('ไม่พบ Chromium page target'); const cdp = new CdpClient(page.webSocketDebuggerUrl); await cdp.connect(); await cdp.command('Page.enable'); await cdp.command('Runtime.enable'); const session = { owner, proc, cdp, profile, createdAt: Date.now(), last: 'พร้อมใช้งาน', log: [] }; sessions.set(owner, session); return session; } catch (e) { try { proc.kill('SIGKILL'); } catch (_) {} try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {} throw e; }
}
function log(s, action, detail, ok = true) { s.last = detail; s.log.unshift({ at: new Date().toISOString(), action, detail, ok }); s.log = s.log.slice(0, 30); }
async function execute(owner, action, params = {}) {
  const s = await createSession(owner); const c = s.cdp;
  if (action === 'navigate') { const url = assertUrl(params.url); await c.command('Page.navigate', { url }); await sleep(800); log(s, action, `เปิด ${url}`); return { url, title: await title(c), log: s.log }; }
  if (action === 'read') { const result = await c.command('Runtime.evaluate', { expression: 'JSON.stringify({title:document.title,url:location.href,text:(document.body?.innerText||"").slice(0,20000)})', returnByValue: true }); const data = JSON.parse(result.result?.value || '{}'); log(s, action, `อ่านหน้า ${data.title || data.url || ''}`); return { ...data, log: s.log }; }
  if (action === 'screenshot') { const result = await c.command('Page.captureScreenshot', { format: 'png' }); log(s, action, 'ถ่ายภาพหน้าจอจริง'); return { data: `data:image/png;base64,${result.data}`, log: s.log }; }
  if (action === 'click') { if (params.confirmed !== true) throw new Error('ต้องยืนยันก่อนคลิก'); const selector = String(params.selector || '').slice(0, 300); const expr = `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('ไม่พบ element');e.click();return e.tagName})()`; const result = await c.command('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); log(s, action, `คลิก ${selector}`); return { result: result.result?.value, log: s.log }; }
  if (action === 'type') { if (params.confirmed !== true) throw new Error('ต้องยืนยันก่อนกรอกข้อมูล'); const selector = String(params.selector || '').slice(0, 300); const text = String(params.text || '').slice(0, 2000); const expr = `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('ไม่พบ input');e.focus();e.value=${JSON.stringify(text)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return e.tagName})()`; const result = await c.command('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); log(s, action, `กรอกข้อมูลที่ ${selector}`); return { result: result.result?.value, log: s.log }; }
  throw new Error('ไม่รู้จัก computer action');
}
async function title(c) { const r = await c.command('Runtime.evaluate', { expression: 'document.title', returnByValue: true }); return r.result?.value || ''; }
function status(owner) { const s = sessions.get(owner); return s ? { active: true, createdAt: s.createdAt, last: s.last, log: s.log } : { active: false, log: [] }; }
function stop(owner) { const s = sessions.get(owner); if (!s) return false; s.cdp.close(); try { s.proc.kill('SIGTERM'); } catch (_) {} try { fs.rmSync(s.profile, { recursive: true, force: true }); } catch (_) {} sessions.delete(owner); return true; }
module.exports = { execute, status, stop, assertUrl };

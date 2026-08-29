'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const MAX_REMOTE_BYTES = 512 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 20000;
const MAX_VIDEO_INPUTS = 300;

function run(bin, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('process timeout')); }, options.timeoutMs || 120000);
    child.stdout.on('data', d => { stdout += d.toString(); if (stdout.length > 200000) stdout = stdout.slice(-200000); });
    child.stderr.on('data', d => { stderr += d.toString(); if (stderr.length > 200000) stderr = stderr.slice(-200000); });
    child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('close', code => { clearTimeout(timer); if (code === 0) resolve({ stdout, stderr }); else reject(new Error(`${bin} exited ${code}: ${stderr.slice(-1000)}`)); });
  });
}

function safeArchiveEntry(name) {
  const value = String(name || '').replace(/\\/g, '/');
  return value && !value.startsWith('/') && !value.split('/').includes('..') && !/[\0\r\n]/.test(value);
}

function archiveKind(filePath) {
  const lower = String(filePath).toLowerCase();
  if (/\.zip$/.test(lower)) return 'zip';
  if (/\.(tar|tgz|tar\.gz|tar\.bz2|tbz2)$/.test(lower)) return 'tar';
  return null;
}

async function listArchive(filePath) {
  const kind = archiveKind(filePath);
  if (!kind) throw new Error('รองรับเฉพาะ ZIP/TAR/TGZ/TAR.GZ');
  const r = kind === 'zip' ? await run('unzip', ['-Z1', filePath]) : await run('tar', ['-tf', filePath]);
  const entries = r.stdout.split(/\r?\n/).filter(Boolean);
  if (entries.length > MAX_ARCHIVE_ENTRIES) throw new Error('archive มีจำนวนไฟล์เกินกำหนด');
  if (entries.some(e => !safeArchiveEntry(e))) throw new Error('archive มี path ที่ไม่ปลอดภัย');
  return { kind, entries };
}

async function extractArchive(filePath, destination) {
  const listing = await listArchive(filePath);
  fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
  if (listing.kind === 'zip') await run('unzip', ['-q', '-o', filePath, '-d', destination], { timeoutMs: 180000 });
  else await run('tar', ['--no-same-owner', '--no-same-permissions', '-xf', filePath, '-C', destination], { timeoutMs: 180000 });
  return { kind: listing.kind, entries: listing.entries.length, destination };
}

function remoteUrl(value) {
  const u = new URL(String(value || ''));
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('รองรับเฉพาะ URL http/https');
  return u;
}

async function fetchRemote(url, destination) {
  const u = remoteUrl(url);
  await run('curl', ['-fL', '--retry', '2', '--connect-timeout', '15', '--max-time', '180', '--max-filesize', String(MAX_REMOTE_BYTES), '-o', destination, u.toString()], { timeoutMs: 200000 });
  const stat = fs.statSync(destination);
  if (!stat.size) throw new Error('ดาวน์โหลดได้ไฟล์ว่าง');
  return { url: u.toString(), path: destination, size: stat.size };
}

async function renderVideo(imagePaths, output, options = {}) {
  if (!Array.isArray(imagePaths) || !imagePaths.length || imagePaths.length > MAX_VIDEO_INPUTS) throw new Error('จำนวนภาพไม่ถูกต้อง');
  const fps = Math.min(Math.max(Number(options.fps) || 1, 0.2), 30);
  const duration = Math.min(Math.max(Number(options.duration) || 3, 0.2), 30);
  const listPath = path.join(path.dirname(output), `frames-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`);
  const lines = imagePaths.map(p => `file '${String(p).replace(/'/g, "'\\''")}'\nduration ${duration}`).join('\n') + `\nfile '${String(imagePaths[imagePaths.length - 1]).replace(/'/g, "'\\''")}'`;
  fs.writeFileSync(listPath, lines, { mode: 0o600 });
  try {
    await run(process.env.FFMPEG_BIN || 'ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-vf', `fps=${fps},format=yuv420p`, '-movflags', '+faststart', '-c:v', 'libx264', output], { timeoutMs: 300000 });
    const stat = fs.statSync(output);
    return { path: output, size: stat.size, fps, durationPerImage: duration, frames: imagePaths.length };
  } finally { try { fs.unlinkSync(listPath); } catch (_) {} }
}

function tempDir(prefix = 'silelo-media-') { return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }
module.exports = { MAX_REMOTE_BYTES, MAX_ARCHIVE_ENTRIES, MAX_VIDEO_INPUTS, safeArchiveEntry, archiveKind, remoteUrl, listArchive, extractArchive, fetchRemote, renderVideo, tempDir };

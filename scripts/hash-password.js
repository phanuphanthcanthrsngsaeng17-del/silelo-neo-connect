#!/usr/bin/env node
'use strict';
const crypto = require('crypto');

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: node scripts/hash-password.js "password with at least 12 characters"');
  process.exit(1);
}

const N = 16384;
const r = 8;
const p = 1;
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 64, {
  N,
  r,
  p,
  maxmem: 32 * 1024 * 1024,
});
console.log(`scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${hash.toString('base64url')}`);
console.error('นำค่านี้ไปตั้งใน ADMIN_PASSWORD_HASH ของ environment เท่านั้น ห้าม commit รหัสผ่านหรือ .env');

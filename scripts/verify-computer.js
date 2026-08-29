'use strict';
const computer = require('../lib/computer-browser');
(async () => {
  const owner = 'local-verification';
  try {
    const nav = await computer.execute(owner, 'navigate', { url: 'https://example.com' });
    const read = await computer.execute(owner, 'read');
    const shot = await computer.execute(owner, 'screenshot');
    console.log(JSON.stringify({ ok: true, url: nav.url, title: read.title, text: read.text.slice(0, 80), screenshotBytes: Buffer.byteLength(shot.data), status: computer.status(owner) }, null, 2));
  } finally { computer.stop(owner); }
})().catch(err => { console.error(err.message); process.exitCode = 1; });

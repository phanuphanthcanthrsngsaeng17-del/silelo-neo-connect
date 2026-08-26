const assert = require('assert');
const fs = require('fs');

const source = fs.readFileSync(require.resolve('../server.js'), 'utf8');
const openaiAt = source.indexOf('const oa0 = await openaiChat');
const groqAt = source.indexOf('const g0 = await groqChat');
const openrouterAt = source.indexOf('const or = await openrouterChat');
assert(openaiAt >= 0, 'GPT primary call is missing');
assert(groqAt > openaiAt, 'Groq must follow GPT primary');
assert(openrouterAt > groqAt, 'OpenRouter fallback must follow Groq');

const match = source.match(/const OPENROUTER_TEXT_MODELS = \(process\.env\.OPENROUTER_TEXT_MODELS \|\| '([^']+)'\)/);
assert(match, 'OpenRouter model allowlist is missing');
const models = match[1].split(',').map((model) => model.trim()).filter(Boolean);
assert.strictEqual(models.length, 16, 'expected 16 verified free OpenRouter fallback models');
assert(models.every((model) => model.endsWith(':free')), 'fallback allowlist must remain free-only');
assert(source.includes("app.get('/api/auth/line'"), 'LINE Login route must remain in server');
assert(source.includes("app.get('/api/auth/line/callback'"), 'LINE callback route must remain in server');
assert(source.includes('LINE_LOGIN_CHANNEL_SECRET'), 'LINE secret handling must remain in server');

console.log('provider order and preservation tests passed');

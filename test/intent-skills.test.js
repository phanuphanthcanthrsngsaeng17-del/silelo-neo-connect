const assert = require('node:assert/strict');
const { loadRegistry, registryStats, suggestIntentSkills, intentSnapshot } = require('../lib/intent-skills');

const registry = loadRegistry();
assert.equal(registry.total, 500);
assert.equal(registry.skills.length, 500);
assert.equal(new Set(registry.skills.map((skill) => skill.id)).size, 500);
assert.equal(registry.skills.filter((skill) => skill.mode === 'understand').length, 250);
assert.equal(registry.skills.filter((skill) => skill.mode === 'execute').length, 250);
assert.deepEqual(registryStats(), { total: 500, understand: 250, execute: 250, categories: 25 });

const understand = suggestIntentSkills('ออกแบบ responsive layout สำหรับมือถือ', 'understand');
assert.ok(understand.length > 0);
assert.ok(understand.every((skill) => skill.mode === 'understand'));
assert.ok(understand.every((skill) => registry.skills.some((registered) => registered.id === skill.id)));

const execute = intentSnapshot('สร้าง manifest สำหรับ PWA', 'execute');
assert.equal(execute.mode, 'execute');
assert.equal(execute.needsConfirmation, true);
assert.match(execute.executionPolicy, /allowlist-only/);
console.log('intent skill registry tests passed');

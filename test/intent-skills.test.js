const assert = require('node:assert/strict');
const { loadRegistry, registryStats, suggestIntentSkills, intentSnapshot } = require('../lib/intent-skills');

const registry = loadRegistry();
assert.equal(registry.total, 900);
assert.equal(registry.skills.length, 900);
assert.equal(new Set(registry.skills.map((skill) => skill.id)).size, 900);
assert.equal(registry.skills.filter((skill) => skill.mode === 'understand').length, 450);
assert.equal(registry.skills.filter((skill) => skill.mode === 'execute').length, 450);
assert.deepEqual(registryStats(), { total: 900, understand: 450, execute: 450, categories: 25 });

const addedTroubleshooting = registry.skills.filter((skill) => /^understand-troubleshooting-(?:0(?:1[1-9]|[2-9][0-9])|1[0-9]{2}|2(?:0[0-9]|10))-/.test(skill.id));
assert.equal(addedTroubleshooting.length, 200);
assert.equal(new Set(addedTroubleshooting.map((skill) => skill.intents[0])).size, 200);

const understand = suggestIntentSkills('ออกแบบ responsive layout สำหรับมือถือ', 'understand');
assert.ok(understand.length > 0);
assert.ok(understand.every((skill) => skill.mode === 'understand'));
assert.ok(understand.every((skill) => registry.skills.some((registered) => registered.id === skill.id)));

const execute = intentSnapshot('สร้าง manifest สำหรับ PWA', 'execute');
assert.equal(execute.mode, 'execute');
assert.equal(execute.needsConfirmation, true);
assert.match(execute.executionPolicy, /allowlist-only/);
console.log('intent skill registry tests passed');

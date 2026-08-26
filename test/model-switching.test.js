const assert = require("assert");
const { getOpenRouterMode, normalizeChatModelMode } = require("../lib/model-switching");

assert.strictEqual(normalizeChatModelMode("openrouter_fast"), "openrouter_fast");
assert.strictEqual(normalizeChatModelMode("../../server"), "auto");
assert.strictEqual(normalizeChatModelMode(undefined), "auto");

const fast = getOpenRouterMode("openrouter_fast", 7_000);
assert.deepStrictEqual(fast.models, ["openrouter/free"]);
assert.strictEqual(fast.timeoutMs, 7_000);
assert.strictEqual(fast.provider.sort, "throughput");
assert.strictEqual(fast.provider.allow_fallbacks, true);

const balanced = getOpenRouterMode("openrouter_balanced");
assert.strictEqual(balanced.models, null);
assert.strictEqual(balanced.provider, null);
assert.strictEqual(getOpenRouterMode("unknown"), null);

console.log("model switching tests passed");

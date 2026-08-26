const CHAT_MODEL_MODES = Object.freeze({
  auto: Object.freeze({ id: "auto", label: "อัตโนมัติ (โซ่เต็ม)" }),
  openrouter_fast: Object.freeze({ id: "openrouter_fast", label: "OpenRouter · เน้นความเร็ว" }),
  openrouter_balanced: Object.freeze({ id: "openrouter_balanced", label: "OpenRouter · สมดุล/สำรอง" }),
});

function normalizeChatModelMode(value) {
  const requested = typeof value === "string" ? value.trim() : "";
  return Object.prototype.hasOwnProperty.call(CHAT_MODEL_MODES, requested) ? requested : "auto";
}

function getOpenRouterMode(mode, fastTimeoutMs = 8_000) {
  const normalized = normalizeChatModelMode(mode);
  if (normalized === "openrouter_fast") {
    return {
      label: CHAT_MODEL_MODES[normalized].label,
      models: ["openrouter/free"],
      timeoutMs: fastTimeoutMs,
      provider: { sort: "throughput", preferred_max_latency: { p90: 3 }, allow_fallbacks: true },
    };
  }
  if (normalized === "openrouter_balanced") {
    return { label: CHAT_MODEL_MODES[normalized].label, models: null, timeoutMs: 6_000, provider: null };
  }
  return null;
}

module.exports = { CHAT_MODEL_MODES, normalizeChatModelMode, getOpenRouterMode };

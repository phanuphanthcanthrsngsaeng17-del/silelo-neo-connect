/* SILELO Neo-Connect — fast AI network guard
 * Keeps slow/dead AI providers from making /api/chat look frozen.
 * Only applies to known AI completion endpoints; normal app fetches are untouched.
 */
const nativeFetch = global.fetch;
const AI_HOSTS = [
  'api.groq.com',
  'api.openai.com',
  'api.cerebras.ai',
  'ollama.com',
  'api.z.ai',
  'open.bigmodel.cn',
  'openrouter.ai',
  'generativelanguage.googleapis.com',
  'text.pollinations.ai',
  'api-inference.huggingface.co',
  'router.huggingface.co'
];
const AI_PATH_HINTS = ['/chat/completions', '/v1beta/models/', '/generateContent'];
const AI_TIMEOUT_MS = Math.max(2000, Number(process.env.AI_PROVIDER_TIMEOUT_MS || 4500));

function isAiRequest(input) {
  try {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const u = new URL(url);
    return AI_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h)) &&
      AI_PATH_HINTS.some(p => u.pathname.includes(p));
  } catch (_) { return false; }
}

global.fetch = function fastAiFetch(input, init = {}) {
  if (!isAiRequest(input)) return nativeFetch(input, init);

  const controller = new AbortController();
  const external = init && init.signal;
  let externalAbort;
  if (external) {
    if (external.aborted) controller.abort(external.reason);
    else {
      externalAbort = () => controller.abort(external.reason);
      external.addEventListener('abort', externalAbort, { once: true });
    }
  }
  const timer = setTimeout(() => controller.abort(new Error('AI_PROVIDER_TIMEOUT')), AI_TIMEOUT_MS);
  const nextInit = Object.assign({}, init, { signal: controller.signal });
  return nativeFetch(input, nextInit).finally(() => {
    clearTimeout(timer);
    if (external && externalAbort) external.removeEventListener('abort', externalAbort);
  });
};

console.log(`[FastGuard] AI provider timeout = ${AI_TIMEOUT_MS}ms`);

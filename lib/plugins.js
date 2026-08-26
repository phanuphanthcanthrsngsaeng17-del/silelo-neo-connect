/* SILELO Neo-Connect — owner-controlled plugin catalog.
 * Metadata is shared by API and UI. Plugins are built-in allowlisted capabilities;
 * this module never evaluates uploaded JavaScript or grants permissions from OAuth alone.
 */
const PLUGINS = Object.freeze([
  { id: 'agent-loop', name: 'SILELO Agent Loop', description: 'คำสั่งภาษาคนและ trace สูงสุด 5 รอบ', status: 'ready', scope: 'chat, think', access: 'authenticated' },
  { id: 'model-routing', name: 'Model Routing', description: 'GPT → Groq → OpenRouter ตาม provider ที่พร้อมใช้', status: 'ready', scope: 'chat', access: 'server-only' },
  { id: 'puter', name: 'Puter Fast Path', description: 'เส้นทางตอบเร็วเดิมจากปุ่มปลาโลมา', status: 'ready', scope: 'browser-session', access: 'authenticated' },
  { id: 'web-search', name: 'Live Sources', description: 'ค้นเว็บและคืนลิงก์ต้นทาง', status: 'ready', scope: 'websearch', access: 'authenticated' },
  { id: 'image-studio', name: 'Image Studio', description: 'สร้างภาพผ่าน endpoint ที่ allowlist', status: 'ready', scope: 'draw', access: 'owner-guarded' },
  { id: 'secure-attachments', name: 'Secure Attachments', description: 'แนบไฟล์ตาม MIME/size policy ของระบบ', status: 'configured', scope: 'chat-upload', access: 'authenticated' },
  { id: 'boss-vision', name: 'BOSS Vision', description: 'จำแนกภาพใน browser-local model', status: 'ready', scope: 'vision', access: 'authenticated' },
  { id: 'video-plan', name: 'Video Planner', description: 'วางแผนฉากวิดีโอ ไม่อ้างว่า render เสร็จ', status: 'ready', scope: 'chat-plan', access: 'authenticated' },
  { id: 'voice', name: 'Voice Mode', description: 'TTS/STT ตาม integration ที่ตั้งค่าไว้', status: 'configured', scope: 'tts, stt', access: 'authenticated' },
  { id: 'knowledge', name: 'Knowledge Library', description: 'คลังความรู้ต้องมี index backend ก่อนเปิดใช้', status: 'unavailable', scope: 'retrieval', access: 'disabled' },
  { id: 'code-sandbox', name: 'Sandbox Code', description: 'รันโค้ดเฉพาะ endpoint ที่ owner guard อนุญาต', status: 'owner', scope: 'run, sandbox', access: 'owner-confirmation' },
  { id: 'line-bridge', name: 'LINE Bridge', description: 'คง webhook และ LINE login เดิมของเจ้าของระบบ', status: 'preserved', scope: 'line-webhook, line-login', access: 'server-only' },
]);

const enabledByUser = new Map();
const defaultEnabled = new Set(PLUGINS.filter((plugin) => ['ready', 'preserved'].includes(plugin.status)).map((plugin) => plugin.id));

function userKey(user) {
  return String(user?.u || user?.e || user?.openId || 'anonymous').slice(0, 200);
}
function isOwner(user) { return Boolean(user?.owner || user?.isOwner); }
function canUsePlugin(plugin, user) {
  if (!plugin) return false;
  if (plugin.status === 'unavailable') return false;
  if (plugin.access === 'owner-guarded' || plugin.access === 'owner-confirmation') return isOwner(user);
  return Boolean(user);
}
function isEnabled(pluginId, user) {
  const plugin = PLUGINS.find((item) => item.id === pluginId);
  if (!plugin || !canUsePlugin(plugin, user)) return false;
  const key = userKey(user);
  const state = enabledByUser.get(key);
  return state ? state.has(pluginId) : defaultEnabled.has(pluginId);
}
function setEnabled(pluginId, user, enabled) {
  const plugin = PLUGINS.find((item) => item.id === pluginId);
  if (!plugin) return { ok: false, error: 'PLUGIN_NOT_FOUND' };
  if (!canUsePlugin(plugin, user)) return { ok: false, error: 'PLUGIN_FORBIDDEN' };
  const key = userKey(user);
  const state = new Set(enabledByUser.get(key) || defaultEnabled);
  if (enabled) state.add(pluginId); else state.delete(pluginId);
  enabledByUser.set(key, state);
  return { ok: true, pluginId, enabled: state.has(pluginId) };
}
function listForUser(user) {
  return PLUGINS.map((plugin) => ({ ...plugin, enabled: isEnabled(plugin.id, user), usable: canUsePlugin(plugin, user) }));
}

module.exports = { PLUGINS, canUsePlugin, listForUser, setEnabled };

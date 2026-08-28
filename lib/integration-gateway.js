const DEFAULT_TIMEOUT_MS = 15000;

const SERVICE_OPERATIONS = Object.freeze({
  gmail: { read: ['search_messages', 'read_threads'], write: ['send_messages', 'manage_labels'] },
  google_calendar: { read: ['list_events', 'get_event'], write: ['create_event', 'update_event', 'delete_event'] },
  google_drive: { read: ['search_files', 'read_file'], write: ['create_file', 'update_file', 'delete_file'] },
  google_docs: { read: ['read_document', 'search_documents'], write: ['create_document', 'update_document'] },
  google_sheets: { read: ['read_sheet', 'search_spreadsheets'], write: ['create_spreadsheet', 'update_sheet'] },
  google_slides: { read: ['read_presentation', 'search_presentations'], write: ['create_presentation', 'update_presentation'] },
  line: { read: ['list_profile', 'read_messages'], write: ['send_message', 'reply_message'] },
  messenger: { read: ['read_messages'], write: ['send_message', 'reply_message'] },
  whatsapp: { read: ['read_messages'], write: ['send_message', 'reply_message'] },
  instagram: { read: ['read_messages', 'read_media'], write: ['send_message', 'publish_media'] },
  reddit: { read: ['search', 'read_post', 'read_comments'], write: ['create_post', 'reply_comment'] },
  shopify: { read: ['list_products', 'read_orders', 'read_customers'], write: ['create_product', 'update_product', 'update_order'] },
});

const WRITE_ACTIONS = new Set(Object.values(SERVICE_OPERATIONS).flatMap((ops) => ops.write));

function clean(value, max = 120) {
  return String(value || '').trim().slice(0, max);
}

function configFrom(env = process.env) {
  const baseUrl = clean(env.CONNECTOR_GATEWAY_URL, 500).replace(/\/+$/, '');
  const token = clean(env.CONNECTOR_GATEWAY_TOKEN, 2000);
  const timeoutMs = Math.max(1000, Math.min(60000, Number(env.CONNECTOR_GATEWAY_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS));
  return { baseUrl, token, timeoutMs, configured: Boolean(baseUrl && token) };
}

function operationAllowed(service, action) {
  const ops = SERVICE_OPERATIONS[clean(service, 60)];
  if (!ops) return false;
  return [...ops.read, ...ops.write].includes(clean(action, 80));
}

function operationNeedsConfirmation(action) {
  return WRITE_ACTIONS.has(clean(action, 80));
}

async function requestGateway({ service, action, payload = {}, user, confirmed = false, env = process.env }) {
  const cfg = configFrom(env);
  const normalizedService = clean(service, 60);
  const normalizedAction = clean(action, 80);
  if (!operationAllowed(normalizedService, normalizedAction)) {
    return { ok: false, status: 400, error: 'UNSUPPORTED_OPERATION' };
  }
  if (operationNeedsConfirmation(normalizedAction) && confirmed !== true) {
    return { ok: false, status: 428, error: 'CONFIRMATION_REQUIRED', service: normalizedService, action: normalizedAction };
  }
  if (!cfg.configured) {
    return { ok: false, status: 503, error: 'GATEWAY_NOT_CONFIGURED', message: 'ยังไม่ได้ตั้งค่า CONNECTOR_GATEWAY_URL และ CONNECTOR_GATEWAY_TOKEN' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
  try {
    const response = await fetch(`${cfg.baseUrl}/v1/integrations/${encodeURIComponent(normalizedService)}/${encodeURIComponent(normalizedAction)}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${cfg.token}`,
        'content-type': 'application/json',
        'x-neo-connect-user': clean(user, 160),
      },
      body: JSON.stringify({ payload }),
      signal: controller.signal,
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = { raw: text.slice(0, 2000) }; }
    if (!response.ok) return { ok: false, status: response.status, error: data?.error || 'GATEWAY_REQUEST_FAILED', data };
    return { ok: true, status: response.status, data };
  } catch (error) {
    return { ok: false, status: error?.name === 'AbortError' ? 504 : 502, error: error?.name === 'AbortError' ? 'GATEWAY_TIMEOUT' : 'GATEWAY_UNREACHABLE' };
  } finally {
    clearTimeout(timer);
  }
}

async function gatewayStatus(env = process.env) {
  const cfg = configFrom(env);
  if (!cfg.configured) return { configured: false, state: 'needs_configuration', services: SERVICE_OPERATIONS };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
  try {
    const response = await fetch(`${cfg.baseUrl}/v1/status`, { headers: { authorization: `Bearer ${cfg.token}` }, signal: controller.signal });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }
    return { configured: true, state: response.ok ? 'online' : 'error', status: response.status, data };
  } catch (error) {
    return { configured: true, state: error?.name === 'AbortError' ? 'timeout' : 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { SERVICE_OPERATIONS, configFrom, operationAllowed, operationNeedsConfirmation, requestGateway, gatewayStatus };

// No mock provider is intentionally included. Missing configuration and upstream failures remain explicit.

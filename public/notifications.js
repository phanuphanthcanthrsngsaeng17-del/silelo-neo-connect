(() => {
  const style = document.createElement('style');
  style.textContent = `
    #customNotifyDock{position:fixed;left:14px;bottom:88px;z-index:31;font:13px system-ui,sans-serif;color:var(--txt,#fff)}
    #customNotifyBell{border:1px solid color-mix(in srgb,var(--accent,#00e5ff) 45%,transparent);background:var(--panel,rgba(10,20,42,.9));color:var(--txt,#fff);border-radius:999px;padding:10px 13px;cursor:pointer;box-shadow:0 8px 24px #0005}
    #customNotifyPanel{display:none;width:min(350px,calc(100vw - 28px));margin-bottom:8px;padding:12px;border:1px solid color-mix(in srgb,var(--accent,#00e5ff) 40%,transparent);border-radius:15px;background:var(--panel,rgba(10,20,42,.96));box-shadow:0 14px 40px #0008}
    #customNotifyPanel.open{display:block}.notify-form{display:grid;gap:7px;margin-top:9px}.notify-form input,.notify-form textarea,.notify-form select{width:100%;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--accent,#00e5ff) 35%,transparent);border-radius:8px;padding:8px;background:rgba(0,0,0,.22);color:inherit}.notify-form textarea{resize:vertical;min-height:60px}.notify-form button{border:0;border-radius:8px;padding:8px;background:var(--accent,#00e5ff);color:#071018;cursor:pointer;font-weight:700}.notify-list{max-height:170px;overflow:auto;margin-top:9px}.notify-item{padding:8px 0;border-top:1px solid rgba(255,255,255,.12)}.notify-item small{opacity:.7}.notify-item button{margin-left:5px;border:0;background:transparent;color:inherit;cursor:pointer}
    @media(max-width:600px){#customNotifyDock{left:10px;bottom:76px}}
  `;
  document.head.appendChild(style);
  const dock = document.createElement('div');
  dock.id = 'customNotifyDock';
  dock.innerHTML = `<section id="customNotifyPanel" aria-label="การแจ้งเตือนแบบกำหนดเอง"><strong>การแจ้งเตือน</strong><div class="notify-list" id="customNotifyList">กำลังโหลด…</div><form class="notify-form" id="customNotifyForm"><input name="title" maxlength="120" placeholder="หัวข้อ" required><textarea name="message" maxlength="500" placeholder="ข้อความแจ้งเตือน" required></textarea><select name="level"><option value="info">ข้อมูล</option><option value="success">สำเร็จ</option><option value="warning">คำเตือน</option><option value="error">ข้อผิดพลาด</option></select><button type="submit">สร้างแจ้งเตือน</button></form></section><button id="customNotifyBell" type="button">🔔 แจ้งเตือน</button>`;
  document.body.appendChild(dock);
  const panel = dock.querySelector('#customNotifyPanel');
  const list = dock.querySelector('#customNotifyList');
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  async function refresh() {
    try {
      const response = await fetch('/api/notifications');
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'โหลดไม่สำเร็จ');
      list.innerHTML = payload.notifications.length ? payload.notifications.map((item) => `<div class="notify-item" data-id="${escapeHtml(item.id)}"><b>${escapeHtml(item.title)}</b> <small>${escapeHtml(item.level)}</small><br>${escapeHtml(item.message)}<br><button type="button" data-read>อ่านแล้ว</button><button type="button" data-delete>ลบ</button></div>`).join('') : '<small>ยังไม่มีแจ้งเตือน</small>';
    } catch (error) { list.textContent = `โหลดไม่ได้: ${error.message}`; }
  }
  dock.querySelector('#customNotifyBell').addEventListener('click', () => { panel.classList.toggle('open'); if (panel.classList.contains('open')) refresh(); });
  dock.querySelector('#customNotifyForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) });
    const payload = await response.json();
    if (!response.ok || !payload.ok) { list.textContent = payload.error || 'สร้างแจ้งเตือนไม่สำเร็จ'; return; }
    event.currentTarget.reset(); refresh();
  });
  list.addEventListener('click', async (event) => {
    const item = event.target.closest('.notify-item');
    if (!item) return;
    const id = item.dataset.id;
    const action = event.target.hasAttribute('data-delete') ? 'DELETE' : 'POST';
    const url = action === 'DELETE' ? `/api/notifications/${encodeURIComponent(id)}` : `/api/notifications/${encodeURIComponent(id)}/read`;
    await fetch(url, { method: action });
    refresh();
  });
})();

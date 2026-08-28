(() => {
  const style = document.createElement('style');
  style.textContent = `
    #intentModeDock{position:fixed;right:16px;bottom:88px;z-index:30;font:14px system-ui,sans-serif}
    #intentModeToggle{border:1px solid #7c5cff;background:#171426;color:#fff;border-radius:999px;padding:10px 14px;cursor:pointer;box-shadow:0 8px 24px #0004}
    #intentModePanel{display:none;width:min(360px,calc(100vw - 32px));margin-top:8px;padding:14px;border:1px solid #6f5cc2;border-radius:16px;background:#11101b;color:#f5f2ff;box-shadow:0 14px 40px #0008}
    #intentModePanel.open{display:block}.intent-mode-row{display:flex;gap:6px;margin:10px 0}.intent-mode-row button{flex:1;border:1px solid #504276;border-radius:9px;background:#201a35;color:#ddd5ff;padding:8px;cursor:pointer}.intent-mode-row button.active{background:#7c5cff;color:#fff}.intent-mode-query{width:100%;box-sizing:border-box;border:1px solid #504276;border-radius:9px;background:#0b0a12;color:#fff;padding:9px}.intent-mode-submit{margin-top:8px;width:100%;border:0;border-radius:9px;background:#b18cff;color:#100b1d;padding:9px;cursor:pointer}.intent-mode-result{margin-top:10px;max-height:180px;overflow:auto;font-size:12px;color:#d6cef0}.intent-mode-result div{padding:7px 0;border-bottom:1px solid #2a2440}.intent-mode-note{font-size:11px;color:#aaa1c6;margin-top:6px}
    @media(max-width:600px){#intentModeDock{right:10px;bottom:76px}#intentModeToggle{padding:9px 12px}}
  `;
  document.head.appendChild(style);

  const dock = document.createElement('div');
  dock.id = 'intentModeDock';
  dock.innerHTML = `<button id="intentModeToggle" type="button">🧭 Intent</button><section id="intentModePanel" aria-label="AI Intent Mode"><strong>AI Intent Mode</strong><div class="intent-mode-note">เลือกโหมดเพื่อวิเคราะห์เจตนาหรือเตรียมแผนดำเนินการแบบ allowlist</div><div class="intent-mode-row"><button type="button" data-mode="understand" class="active">Understand</button><button type="button" data-mode="execute">Execute</button></div><input id="intentModeQuery" class="intent-mode-query" maxlength="1600" placeholder="พิมพ์สิ่งที่ต้องการให้ SILELO ช่วย…"><button id="intentModeSubmit" class="intent-mode-submit" type="button">วิเคราะห์เจตนา</button><div id="intentModeResult" class="intent-mode-result" role="status"></div></section>`;
  document.body.appendChild(dock);

  let mode = 'understand';
  const panel = dock.querySelector('#intentModePanel');
  const result = dock.querySelector('#intentModeResult');
  dock.querySelector('#intentModeToggle').addEventListener('click', () => panel.classList.toggle('open'));
  dock.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
    mode = button.dataset.mode === 'execute' ? 'execute' : 'understand';
    dock.querySelectorAll('[data-mode]').forEach((item) => item.classList.toggle('active', item === button));
    dock.querySelector('#intentModeSubmit').textContent = mode === 'execute' ? 'เตรียมแผน Execute' : 'วิเคราะห์เจตนา';
  }));
  dock.querySelector('#intentModeSubmit').addEventListener('click', async () => {
    const command = dock.querySelector('#intentModeQuery').value.trim();
    if (command.length < 3) { result.textContent = 'โปรดระบุคำสั่งอย่างน้อย 3 ตัวอักษร'; return; }
    result.textContent = 'กำลังเลือก Skill จาก registry…';
    try {
      const response = await fetch('/api/intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command, mode }) });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'intent request failed');
      result.innerHTML = `<div><b>${payload.mode === 'execute' ? 'Intent Execute' : 'Intent Understand'}</b> · ${payload.needsConfirmation ? 'ต้องยืนยันก่อนดำเนินการ' : 'ยังไม่ดำเนินการ'}</div>` + (payload.skills || []).map((skill) => `<div><b>${skill.title}</b><br>${skill.description}</div>`).join('');
    } catch (error) { result.textContent = `ไม่สามารถวิเคราะห์ได้: ${error.message}`; }
  });
})();

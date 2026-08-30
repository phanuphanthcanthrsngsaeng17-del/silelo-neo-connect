(() => {
  const style = document.createElement('style');
  style.textContent = `
    #intentModeDock{position:fixed;right:16px;bottom:88px;z-index:30;font:14px system-ui,sans-serif}
    #intentModeToggle{border:1px solid #7c5cff;background:#171426;color:#fff;border-radius:999px;padding:10px 14px;cursor:pointer;box-shadow:0 8px 24px #0004}
    #intentModePanel{display:none;width:min(380px,calc(100vw - 32px));margin-top:8px;padding:14px;border:1px solid #6f5cc2;border-radius:16px;background:#11101b;color:#f5f2ff;box-shadow:0 14px 40px #0008}
    #intentModePanel.open{display:block}.intent-mode-row{display:flex;gap:6px;margin:10px 0}.intent-mode-row button{flex:1;border:1px solid #504276;border-radius:9px;background:#201a35;color:#ddd5ff;padding:8px;cursor:pointer}.intent-mode-row button.active{background:#7c5cff;color:#fff}.intent-mode-query{width:100%;box-sizing:border-box;border:1px solid #504276;border-radius:9px;background:#0b0a12;color:#fff;padding:9px}.intent-mode-submit{margin-top:8px;width:100%;border:0;border-radius:9px;background:#b18cff;color:#100b1d;padding:9px;cursor:pointer}.intent-mode-result{margin-top:10px;max-height:180px;overflow:auto;font-size:12px;color:#d6cef0}.intent-mode-result div{padding:7px 0;border-bottom:1px solid #2a2440}.intent-mode-note{font-size:11px;color:#aaa1c6;margin-top:6px}
    #agentTrace{margin-top:12px;border:1px solid #30303a;border-radius:13px;background:#19191d;overflow:hidden}#agentTrace[hidden]{display:none}#agentTraceHead{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #2c2c33;font-size:12px}#agentTraceHead strong{flex:1}#agentTraceState{color:#54d13d;font-size:10px}#agentTraceList{padding:8px 12px;max-height:190px;overflow:auto}.agent-trace-step{display:flex;gap:8px;align-items:flex-start;padding:7px 0;color:#b8b8c1;font-size:11px;border-bottom:1px solid #25252b}.agent-trace-step:last-child{border-bottom:0}.agent-trace-icon{width:18px;text-align:center}.agent-trace-step.ok{color:#d7f7d0}.agent-trace-step.run{color:#e8e1ff}.agent-trace-step.err{color:#ff9b9b}.agent-trace-foot{padding:8px 12px;border-top:1px solid #2c2c33;color:#85858f;font-size:10px}.agent-confirm{margin-top:9px;display:flex;gap:6px}.agent-confirm button{border:1px solid #51456f;border-radius:8px;padding:6px 10px;background:#211b31;color:#fff;cursor:pointer;font-size:11px}.agent-confirm .approve{background:#315f36;border-color:#4f9d59}
    @media(max-width:600px){#intentModeDock{right:10px;bottom:76px}#intentModeToggle{padding:9px 12px}}
  `;
  document.head.appendChild(style);

  const dock = document.createElement('div');
  dock.id = 'intentModeDock';
  dock.innerHTML = `<button id="intentModeToggle" type="button">🧭 Agent</button><section id="intentModePanel" aria-label="AI Agent Mode"><strong>AI Agent</strong><div class="intent-mode-note">วางแผนงานและแสดงขั้นตอนการทำงานแบบเบา ๆ ในห้องแชต</div><div class="intent-mode-row"><button type="button" data-mode="understand" class="active">Understand</button><button type="button" data-mode="execute">Execute</button></div><input id="intentModeQuery" class="intent-mode-query" maxlength="1600" placeholder="พิมพ์สิ่งที่ต้องการให้ SILELO ทำ…"><button id="intentModeSubmit" class="intent-mode-submit" type="button">วิเคราะห์เจตนา</button><div id="intentModeResult" class="intent-mode-result" role="status"></div><div id="agentTrace" hidden><div id="agentTraceHead"><strong>⚡ Agent Process</strong><span id="agentTraceState">กำลังทำงาน</span></div><div id="agentTraceList"></div><div class="agent-trace-foot">แสดงเฉพาะสถานะการทำงาน ไม่เปิดเผยข้อมูลลับ</div></div></section>`;
  document.body.appendChild(dock);

  let mode = 'understand';
  const panel = dock.querySelector('#intentModePanel');
  const result = dock.querySelector('#intentModeResult');
  const trace = dock.querySelector('#agentTrace');
  const traceList = dock.querySelector('#agentTraceList');
  const traceState = dock.querySelector('#agentTraceState');
  dock.querySelector('#intentModeToggle').addEventListener('click', () => panel.classList.toggle('open'));
  dock.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
    mode = button.dataset.mode === 'execute' ? 'execute' : 'understand';
    dock.querySelectorAll('[data-mode]').forEach((item) => item.classList.toggle('active', item === button));
    dock.querySelector('#intentModeSubmit').textContent = mode === 'execute' ? 'เริ่มงาน Agent' : 'วิเคราะห์เจตนา';
  }));

  function esc(value){return String(value == null ? '' : value).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]||c));}
  function showTrace(){trace.hidden=false;traceList.innerHTML='';traceState.textContent='กำลังทำงาน';traceState.style.color='#54d13d';}
  function addStep(text,state='run'){const row=document.createElement('div');row.className='agent-trace-step '+state;row.innerHTML='<span class="agent-trace-icon">'+(state==='ok'?'✓':state==='err'?'!':'⟳')+'</span><span>'+esc(text)+'</span>';traceList.appendChild(row);traceList.scrollTop=traceList.scrollHeight;}
  function finishTrace(ok=true){traceState.textContent=ok?'เสร็จสิ้น':'ล้มเหลว';traceState.style.color=ok?'#54d13d':'#ff7b7b';}

  dock.querySelector('#intentModeSubmit').addEventListener('click', async () => {
    const command = dock.querySelector('#intentModeQuery').value.trim();
    if (command.length < 3) { result.textContent = 'โปรดระบุคำสั่งอย่างน้อย 3 ตัวอักษร'; return; }
    result.textContent = mode === 'execute' ? 'กำลังเตรียม Agent…' : 'กำลังเลือก Skill จาก registry…';
    showTrace();
    addStep('รับคำสั่งจากผู้ใช้','ok');
    addStep('ตรวจสอบเจตนาและเลือก Skill','run');
    try {
      const response = await fetch('/api/intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command, mode }) });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'intent request failed');
      addStep('พบ Skill ที่ตรงกับงาน','ok');
      if (payload.needsConfirmation) addStep('งานนี้ต้องได้รับการยืนยันก่อน Execute','run');
      else addStep(mode === 'execute' ? 'พร้อมเข้าสู่ขั้นตอน Execute' : 'สร้างแผน Understand แล้ว','ok');
      result.innerHTML = `<div><b>${payload.mode === 'execute' ? 'Intent Execute' : 'Intent Understand'}</b> · ${payload.needsConfirmation ? 'ต้องยืนยันก่อนดำเนินการ' : 'ยังไม่ดำเนินการ'}</div>` + (payload.skills || []).map((skill) => `<div><b>${esc(skill.title)}</b><br>${esc(skill.description)}</div>`).join('');
      if (payload.needsConfirmation && mode === 'execute') {
        const confirm = document.createElement('div'); confirm.className='agent-confirm';
        const yes=document.createElement('button'); yes.className='approve'; yes.textContent='ยืนยัน';
        const no=document.createElement('button'); no.textContent='ยกเลิก';
        yes.onclick=()=>{addStep('ผู้ใช้ยืนยันแล้ว — ส่งต่อให้ runtime','ok');finishTrace(true);result.insertAdjacentHTML('beforeend','<div>✓ ยืนยันแล้ว</div>');confirm.remove();};
        no.onclick=()=>{addStep('ผู้ใช้ยกเลิกการดำเนินการ','err');finishTrace(false);confirm.remove();};
        confirm.append(yes,no); result.appendChild(confirm);
      } else finishTrace(true);
    } catch (error) {
      addStep('ไม่สามารถเรียก Intent runtime: '+error.message,'err');
      result.textContent = `ไม่สามารถวิเคราะห์ได้: ${error.message}`;
      finishTrace(false);
    }
  });
})();

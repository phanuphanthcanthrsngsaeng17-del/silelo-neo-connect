(() => {
  const $ = id => document.getElementById(id);
  const state = { room: '', id: '', ws: null, stream: null, screen: null, peers: new Map(), joined: false };
  const status = (text, bad = false) => { $('status').textContent = text; $('status').style.color = bad ? '#fca5a5' : ''; };
  const roomId = () => ($('room').value || '').trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  const randomRoom = () => 'SILELO-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  function videoCard(id, label, stream, local = false) {
    let card = document.querySelector(`[data-peer="${id}"]`);
    if (!card) { card = document.createElement('div'); card.className = 'video-card'; card.dataset.peer = id; $('videos').appendChild(card); }
    card.innerHTML = '';
    const video = document.createElement('video'); video.autoplay = true; video.playsInline = true; video.muted = local; video.srcObject = stream;
    const name = document.createElement('div'); name.className = 'video-label'; name.textContent = label;
    card.append(video, name); return video;
  }
  function removePeer(id) { const card = document.querySelector(`[data-peer="${id}"]`); if (card) card.remove(); const pc = state.peers.get(id); if (pc) pc.close(); state.peers.delete(id); }
  function send(type, to, data) { if (state.ws && state.ws.readyState === WebSocket.OPEN) state.ws.send(JSON.stringify({ type, to, data })); }
  async function ensureMedia() {
    if (state.stream) return state.stream;
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } });
    videoCard('local', 'คุณ', state.stream, true); return state.stream;
  }
  function peerConnection(id) {
    if (state.peers.has(id)) return state.peers.get(id);
    const pc = new RTCPeerConnection({ iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }
    ] });
    state.stream.getTracks().forEach(track => pc.addTrack(track, state.stream));
    pc.ontrack = e => videoCard(id, `ผู้ร่วมสาย ${id}`, e.streams[0]);
    pc.onicecandidate = e => { if (e.candidate) send('ice', id, e.candidate); };
    pc.onconnectionstatechange = () => { if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) removePeer(id); };
    state.peers.set(id, pc); return pc;
  }
  async function offerTo(id) { const pc = peerConnection(id); const offer = await pc.createOffer(); await pc.setLocalDescription(offer); send('offer', id, pc.localDescription); }
  async function join() {
    if (state.joined) return;
    state.room = roomId() || randomRoom(); $('room').value = state.room;
    try { await ensureMedia(); } catch (e) { status('ไม่สามารถใช้กล้อง/ไมค์: ' + e.message, true); return; }
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    state.ws = new WebSocket(`${proto}//${location.host}/ws/call`);
    state.ws.onopen = () => state.ws.send(JSON.stringify({ type: 'join', roomId: state.room }));
    state.ws.onmessage = async event => {
      let msg; try { msg = JSON.parse(event.data); } catch (_) { return; }
      if (msg.type === 'joined') { state.id = msg.peerId; state.joined = true; msg.peers.forEach(offerTo); status(`อยู่ในห้อง ${state.room} · ${msg.peers.length + 1} คน`); enable(true); history.replaceState({}, '', `?room=${encodeURIComponent(state.room)}`); }
      else if (msg.type === 'peer-joined') status(`มีผู้เข้าร่วมใหม่ · ห้อง ${state.room}`);
      else if (msg.type === 'offer') { const pc = peerConnection(msg.from); await pc.setRemoteDescription(msg.data); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); send('answer', msg.from, pc.localDescription); }
      else if (msg.type === 'answer') { const pc = peerConnection(msg.from); if (pc.signalingState !== 'stable') await pc.setRemoteDescription(msg.data); }
      else if (msg.type === 'ice') { const pc = peerConnection(msg.from); try { await pc.addIceCandidate(msg.data); } catch (_) {} }
      else if (msg.type === 'peer-left') removePeer(msg.peerId);
      else if (msg.type === 'error') status('ผิดพลาด: ' + msg.error, true);
    };
    state.ws.onerror = () => status('เชื่อมต่อ signaling ไม่สำเร็จ', true);
    state.ws.onclose = () => { if (state.joined) status('การเชื่อมต่อ signaling ปิดแล้ว', true); };
  }
  function enable(on) { ['mic', 'camera', 'screen', 'hangup', 'copy'].forEach(id => $(id).disabled = !on); }
  $('create').onclick = () => { $('room').value = randomRoom(); join(); };
  $('join').onclick = join;
  $('copy').onclick = async () => { const url = `${location.origin}/call.html?room=${encodeURIComponent(state.room)}`; await navigator.clipboard.writeText(url); status('คัดลอกลิงก์ห้องแล้ว'); };
  $('mic').onclick = () => { const t = state.stream?.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; $('mic').textContent = t.enabled ? '🎤 ไมค์' : '🔇 ปิดไมค์'; } };
  $('camera').onclick = () => { const t = state.stream?.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; $('camera').textContent = t.enabled ? '📷 กล้อง' : '🚫 ปิดกล้อง'; } };
  $('screen').onclick = async () => {
    if (!state.stream || !state.peers.size) { status('ต้องมีผู้ร่วมสายก่อนแชร์หน้าจอ'); return; }
    if (!state.screen) { try { state.screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); } catch (_) { return; } }
    const track = state.screen.getVideoTracks()[0]; state.peers.forEach(pc => { const sender = pc.getSenders().find(s => s.track?.kind === 'video'); if (sender) sender.replaceTrack(track); });
    track.onended = () => { const cam = state.stream.getVideoTracks()[0]; state.peers.forEach(pc => { const sender = pc.getSenders().find(s => s.track?.kind === 'video'); if (sender) sender.replaceTrack(cam); }); state.screen = null; };
    status('กำลังแชร์หน้าจอ');
  };
  $('hangup').onclick = () => { state.peers.forEach(pc => pc.close()); state.peers.clear(); state.ws?.close(); state.stream?.getTracks().forEach(t => t.stop()); state.screen?.getTracks().forEach(t => t.stop()); state.stream = state.screen = null; state.joined = false; $('videos').innerHTML = ''; enable(false); status('วางสายแล้ว'); };
  const prefill = new URLSearchParams(location.search).get('room'); if (prefill) $('room').value = prefill;
})();

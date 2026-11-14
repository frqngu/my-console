/* v821: Tools — Files, media viewer, live performance, clock & timers, calculator, calendar, Windows shortcuts.
   Shares app.js's globals (SCREENS, show, note, ICON, ico, settings ...). No inline styles anywhere: the page's security policy blocks them. */
(() => {
  const api = window.consoleApi;
  const E = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  Object.assign(ICON, {
    tools: ico('<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'),
    folder: ico('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    file: ico('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>'),
    image: ico('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/>'),
    film: ico('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>'),
    music: ico('<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>'),
    chip: ico('<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>'),
    clock: ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>'),
    calc: ico('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'),
    calendar: ico('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    up: ico('<path d="M12 19V6M6 12l6-6 6 6"/>'),
    hdd: ico('<rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M3 13l3-8h12l3 8M7 16.5h.01"/>'),
    bt: ico('<path d="M7 7l10 10-5 4V3l5 4L7 17"/>'),
    monitor: ico('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
    net: ico('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/>'),
    refresh: ico('<path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5"/>'),
    list: ico('<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>'),
  });
  const TCATS = [['apps', 'Switch apps'], ['getapps', 'Get apps'], ['storage', 'Storage'], ['wifi', 'Network'], ['dev', 'Devices & screens'], ['win', 'Display & sound'], ['upd', 'Updates'], ['care', 'Backup & restore'], ['media', 'Pictures & videos']];
  const TGROUP = { apps: 'Apps', wifi: 'Connect', upd: 'System', media: 'Media' };
  let tcat = 'apps';
  const tile = (icon, label, attrs, small) => `<button class="st-t" data-nav ${attrs}>${ICON[icon] || ''}<span class="st-l">${E(label)}${small ? `<small>${E(small)}</small>` : ''}</span></button>`;
  const kt = (label, attrs, cls) => `<button class="st-t kc ${cls || ''}" data-nav ${attrs}><span class="st-l">${label}</span></button>`;
  const fmtSize = (n) => (n >= 1073741824 ? (n / 1073741824).toFixed(1) + ' GB' : n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : n >= 1024 ? Math.round(n / 1024) + ' KB' : n + ' B');
  const gb = (n) => { const g = n / 1073741824; return (g >= 100 ? Math.round(g) : g.toFixed(1)) + ' GB'; };
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmtT = (s) => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ':' + pad2(m) : m) + ':' + pad2(s % 60); };

  /* ================= Files ================= */
  const FS = { path: '', data: null, places: null, busy: false, err: '', limit: 300 };
  const filesLoad = (p) => {
    FS.busy = true; FS.err = ''; FS.limit = 300; if (!FS.data) paintPane();
    const done = (r) => { FS.busy = false; if (r && r.ok) { FS.path = r.path || ''; FS.data = r; if (!r.path) FS.places = r.places; } else FS.err = (r && r.error) || 'Could not open this folder.'; paintPane(false); if (screen === 'tools' && tcat === 'files') { const f = document.querySelector('#tpane .tl [data-nav]:not([data-fi="up"])') || document.querySelector('#tpane [data-nav]'); if (f && !(document.activeElement && document.activeElement.closest('.st-s'))) f.focus({ preventScroll: true }); } };
    if (!p) api.fsPlaces().then((pl) => done({ ok: true, path: '', places: pl, rows: [], parent: '' })).catch(() => done(null));
    else api.fsList(p).then(done).catch(() => done(null));
  };
  const filesPane = () => {
    if (!FS.data && !FS.busy && !FS.err) { setTimeout(() => filesLoad(''), 0); }
    const head = `<h2 class="st-h">Files</h2>`;
    if (FS.busy && !FS.data) return head + '<p class="tnote"><i class="spin"></i>Opening...</p>';
    if (FS.err && !FS.data) return head + `<p class="tnote">${E(FS.err)}</p><div class="st-g">${tile('refresh', 'Try again', 'data-tact="filesroot"')}</div>`;
    const d = FS.data; if (!d) return head;
    if (!d.path) { const fav = favGet(), rec = recGet(); return `${head}<div class="tl">${fav.map((p, i) => tile('folder', p.name, `data-fv="${i}"`, 'Pinned \u00b7 X to unpin')).join('')}${(FS.places || []).map((p, i) => tile(p.kind === 'drive' ? 'hdd' : 'folder', p.name, `data-fp="${i}"`, p.kind === 'drive' ? (p.space || p.path) : '')).join('')}${rec.map((r, i) => tile(r.kind === 'image' ? 'image' : r.kind === 'video' ? 'film' : r.kind === 'audio' ? 'music' : 'file', r.name, `data-fr="${i}"`, 'Recently opened')).join('')}</div>`; }
    const rows = d.rows.slice(0, FS.limit);
    const t = rows.map((r, i) => tile(r.dir ? 'folder' : r.kind === 'image' ? 'image' : r.kind === 'video' ? 'film' : r.kind === 'audio' ? 'music' : 'file', r.name, `data-fi="${i}"`, r.dir ? 'Folder' : fmtSize(r.size))).join('');
    return `${head}<p class="tpath">${E(d.path)}${FS.err ? ' · ' + E(FS.err) : ''}</p><div class="tl">${tile('up', 'Up one level', 'data-fi="up"')}${FC ? tile('file', (FC.move ? 'Move ' : 'Copy ') + FC.name + ' here', 'data-fi="paste"', 'Paste into this folder') : ''}${t}${d.rows.length > FS.limit ? tile('list', 'Show more', 'data-fi="more"', (d.rows.length - FS.limit) + ' more') : ''}${!d.rows.length ? '<p class="tnote">This folder is empty.</p>' : ''}</div>`;
  };
  const lsj = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
  const favGet = () => lsj('consoleFav', []), recGet = () => lsj('consoleRecent', []);
  const favSet = (a) => { try { localStorage.setItem('consoleFav', JSON.stringify(a.slice(0, 12))); } catch {} };
  const recAdd = (r) => { try { const a = recGet().filter((x) => x.path !== r.path); a.unshift({ name: r.name, path: r.path, kind: r.kind || '' }); localStorage.setItem('consoleRecent', JSON.stringify(a.slice(0, 6))); } catch {} };
  let FC = null;
  const filesAct = (el) => {
    const d = el.dataset;
    if (d.fv !== undefined) { const p = favGet()[Number(d.fv)]; if (p) filesLoad(p.path); return true; }
    if (d.fr !== undefined) { const r = recGet()[Number(d.fr)]; if (r) { if (r.kind) openViewer([{ name: r.name, kind: r.kind, path: r.path }], 0); else api.fsOpen(r.path).then((x) => note(x && x.ok ? 'Opening ' + r.name + '...' : 'That file is gone or Windows could not open it.')); } return true; }
    if (d.fi === 'paste' && FC) { const c = FC; api.fsPaste(c.path, FS.path, c.move).then((x) => { note(x && x.ok ? (x.same ? 'It is already here.' : (c.move ? 'Moved.' : 'Copied.') + (x.note ? ' ' + x.note : '')) : (x && x.error) || 'Could not do that.'); if (x && x.ok && c.move && !x.same) FC = null; filesLoad(FS.path); }); return true; }
    if (d.fp !== undefined) { const p = (FS.places || [])[Number(d.fp)]; if (p) filesLoad(p.path); return true; }
    if (d.fi !== undefined) {
      if (d.fi === 'up') { filesLoad((FS.data && FS.data.parent) || ''); return true; }
      if (d.fi === 'more') { FS.limit += 300; paintPane(true); return true; }
      const r = FS.data && FS.data.rows[Number(d.fi)]; if (!r) return true;
      const full = FS.data.path.replace(/[\\/]+$/, '') + '\\' + r.name;
      if (r.dir) filesLoad(full);
      else if (r.kind) { recAdd({ name: r.name, path: full, kind: r.kind }); const same = FS.data.rows.filter((x) => !x.dir && x.kind === r.kind).map((x) => ({ name: x.name, kind: x.kind, path: FS.data.path.replace(/[\\/]+$/, '') + '\\' + x.name })); openViewer(same, Math.max(0, same.findIndex((x) => x.name === r.name))); }
      else api.fsOpen(full).then((x) => note(x && x.ok ? 'Opening ' + r.name + '...' : 'Windows could not open this file.')).catch(() => note('Windows could not open this file.'));
      return true;
    }
    if (d.tact === 'filesroot') { filesLoad(''); return true; }
    return false;
  };


  /* ================= music that keeps playing in the background ================= */
  let MP = null;
  const mpBar = () => { let b = document.getElementById('minip'); if (!b) { b = document.createElement('div'); b.id = 'minip'; b.innerHTML = '<span class="mp-i"></span><b></b><em></em>'; b.querySelector('.mp-i').innerHTML = ICON.music; document.body.appendChild(b); } return b; };
  function mpPaint() { const b = document.getElementById('minip'); if (!MP) { if (b) b.classList.remove('on'); return; } const x = mpBar(); x.querySelector('b').textContent = MP.list[MP.i].name.replace(/\.[^.]+$/, ''); x.querySelector('em').textContent = MP.a.paused ? 'Paused' : 'Playing'; x.classList.add('on'); }
  function mpAdopt(v) {
    const a = v.m; MP = { a, list: v.list, i: v.i, vol: v.vol };
    a.onended = () => mpStep(1); a.onerror = () => mpStep(1); a.ontimeupdate = null; mpPaint();
  }
  function mpStep(d) {
    if (!MP) return; if (MP.list.length < 2 && d > 0) return mpStop(); MP.i = (MP.i + d + MP.list.length) % MP.list.length;
    const it = MP.list[MP.i]; api.fsMedia(it.path).then((u) => { if (!MP || !u) return; MP.a.src = u; MP.a.play().catch(() => {}); mpPaint(); }).catch(() => {});
  }
  function mpStop(quiet) { if (!MP) return; try { MP.a.pause(); MP.a.removeAttribute('src'); MP.a.load(); } catch {} MP = null; mpPaint(); if (!quiet) { try { SND.hush(false); } catch {} } }
  const mpAct = (el) => {
    const k = el.dataset.tmp; if (!k) return false;
    if (!MP) return true;
    if (k === 'toggle') { if (MP.a.paused) MP.a.play().catch(() => {}); else MP.a.pause(); mpPaint(); }
    else if (k === 'next') mpStep(1); else if (k === 'prev') mpStep(-1); else if (k === 'stop') mpStop();
    paintPane(true); return true;
  };
  const mpTiles = () => MP ? tile('music', 'Now playing: ' + MP.list[MP.i].name.replace(/\.[^.]+$/, ''), 'data-tmp="toggle"', MP.a.paused ? 'Paused. A to play' : 'A to pause') + tile('up', 'Next song', 'data-tmp="next"') + tile('up', 'Previous song', 'data-tmp="prev"') + tile('refresh', 'Stop the music', 'data-tmp="stop"') : '';
  /* ================= Media ================= */
  const mediaPane = () => `<h2 class="st-h">Media</h2><div class="tl">${mpTiles()}${tile('image', 'Screensaver photos: ' + (ssOn() ? 'On' : 'Off'), 'data-tact="ssp"', 'Show your Pictures when the console is idle')}${tile('image', 'Pictures', 'data-tmed="pictures"', 'View your photos')}${tile('film', 'Videos', 'data-tmed="videos"', 'Play your videos')}${tile('music', 'Music', 'data-tmed="music"', 'Play your songs')}${tile('folder', 'Downloads', 'data-tmed="downloads"', 'Everything you downloaded')}${tile('folder', 'Documents', 'data-tmed="documents"')}${tile('folder', 'Desktop', 'data-tmed="desktop"')}</div><p class="tnote">Pictures, videos and music open right here in the console. Press B to close the viewer.</p>`;
  const mediaAct = (el) => {
    const k = el.dataset.tmed; if (!k) return false;
    const go = (places) => { const p = (places || []).find((x) => x.key === k); if (!p) return note('That folder was not found.'); tcat = 'files'; FS.data = null; FS.err = ''; paintRail(); paintPane(); filesLoad(p.path); setTimeout(() => { const f = document.querySelector('.st-r [data-nav]'); if (f) f.focus({ preventScroll: true }); }, 350); };
    if (FS.places) go(FS.places); else api.fsPlaces().then((pl) => { FS.places = pl; go(pl); }).catch(() => note('That folder was not found.'));
    return true;
  };

  /* ================= Performance ================= */
  const PF = { cpu: [], ram: [], gpu: [], timer: 0, last: null };
  const spark = (a) => { if (a.length < 2) return ''; const w = 100, h = 30, n = 60; return a.map((v, i) => ((w * i / (n - 1)).toFixed(1) + ',' + (h - h * Math.max(0, Math.min(100, v)) / 100).toFixed(1))).join(' '); };
  const perfPane = () => `<h2 class="st-h">Performance</h2><div class="pf">
    <div class="pfc"><b>Processor</b><span id="pf-cpuname">Reading...</span><em id="pf-cpu">0%</em><svg viewBox="0 0 100 30" preserveAspectRatio="none"><polyline id="pf-cpug" points=""/></svg><div class="pfcores" id="pf-cores"></div></div>
    <div class="pfc"><b>Memory</b><span id="pf-ramtxt">&nbsp;</span><em id="pf-ram">0%</em><svg viewBox="0 0 100 30" preserveAspectRatio="none"><polyline id="pf-ramg" points=""/></svg></div>
    <div class="pfc" id="pf-gpubox"><b>Graphics card</b><span id="pf-gpuname">Looking...</span><em id="pf-gpu">-</em><svg viewBox="0 0 100 30" preserveAspectRatio="none"><polyline id="pf-gpug" points=""/></svg><small id="pf-gpumeta"></small></div>
    <div class="pfc"><b>PC</b><span id="pf-up">&nbsp;</span><small>Live numbers, refreshed every second while this page is open.</small></div></div><div class="tl">${tile('net', 'Test my internet speed', 'data-tact="speed"', PF.speed || 'Downloads a test file, about 25 MB')}</div>`;
  const perfTick = () => {
    if (screen !== 'tools' || tcat !== 'perf') { PF.timer = 0; return; }
    api.perfSample().then((s) => {
      if (!s || screen !== 'tools' || tcat !== 'perf') return;
      const $i = (id) => document.getElementById(id); if (!$i('pf-cpu')) return;
      PF.cpu.push(s.cpu); PF.cpu = PF.cpu.slice(-60);
      const ramU = s.ram - s.ramFree, ramP = Math.round(ramU / s.ram * 100); PF.ram.push(ramP); PF.ram = PF.ram.slice(-60);
      $i('pf-cpuname').textContent = s.cpuName || 'Processor'; $i('pf-cpu').textContent = s.cpu + '%'; $i('pf-cpug').setAttribute('points', spark(PF.cpu));
      const cores = $i('pf-cores'); if (cores.children.length !== s.cores.length) { cores.replaceChildren(); for (let i = 0; i < s.cores.length; i++) { const b = document.createElement('i'), u = document.createElement('u'); b.appendChild(u); cores.appendChild(b); } }
      s.cores.forEach((v, i) => { cores.children[i].firstChild.style.height = Math.max(3, v) + '%'; });
      $i('pf-ramtxt').textContent = gb(ramU) + ' used of ' + gb(s.ram); $i('pf-ram').textContent = ramP + '%'; $i('pf-ramg').setAttribute('points', spark(PF.ram));
      if (s.gpu) { PF.gpu.push(s.gpu.util); PF.gpu = PF.gpu.slice(-60); $i('pf-gpuname').textContent = s.gpu.name; $i('pf-gpu').textContent = s.gpu.util + '%'; $i('pf-gpug').setAttribute('points', spark(PF.gpu)); $i('pf-gpumeta').textContent = s.gpu.temp + '°C · ' + Math.round(s.gpu.mem / 1024 * 10) / 10 + ' of ' + Math.round(s.gpu.memTot / 1024 * 10) / 10 + ' GB video memory' + (s.gpu.power ? ' · ' + Math.round(s.gpu.power) + ' W' : ''); }
      else { $i('pf-gpuname').textContent = 'Not available'; $i('pf-gpu').textContent = '-'; $i('pf-gpumeta').textContent = 'Live graphics numbers need an NVIDIA card (nvidia-smi).'; }
      const up = Math.floor(s.up / 60); $i('pf-up').textContent = 'On for ' + (up >= 1440 ? Math.floor(up / 1440) + ' d ' + Math.floor(up % 1440 / 60) + ' h' : up >= 60 ? Math.floor(up / 60) + ' h ' + (up % 60) + ' min' : up + ' min');
    }).catch(() => {}).finally(() => { if (screen === 'tools' && tcat === 'perf') PF.timer = setTimeout(perfTick, 1000); else PF.timer = 0; });
  };

  /* ================= Clock, stopwatch, timer, sleep timer ================= */
  const WC = [['New York', 'America/New_York'], ['London', 'Europe/London'], ['Tokyo', 'Asia/Tokyo'], ['Sydney', 'Australia/Sydney']], wcT = (z) => { try { return new Date().toLocaleTimeString(undefined, { timeZone: z, hour: 'numeric', minute: '2-digit' }); } catch { return ''; } };
  const CK = { sw: { run: false, t0: 0, acc: 0 }, tm: { set: 300, end: 0, run: false, left: 0 }, sl: { at: 0 } };
  const swNow = () => CK.sw.acc + (CK.sw.run ? Date.now() - CK.sw.t0 : 0);
  const tmLeft = () => (CK.tm.run ? Math.max(0, Math.ceil((CK.tm.end - Date.now()) / 1000)) : CK.tm.left || CK.tm.set);
  const beep = () => { try { const ac = new (window.AudioContext || window.webkitAudioContext)(), t = ac.currentTime; for (let i = 0; i < 4; i++) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(0, t + i * .35); g.gain.linearRampToValueAtTime(.35, t + i * .35 + .03); g.gain.linearRampToValueAtTime(0, t + i * .35 + .25); o.connect(g); g.connect(ac.destination); o.start(t + i * .35); o.stop(t + i * .35 + .3); } setTimeout(() => ac.close(), 2500); } catch {} };
  const clockPane = () => {
    const d = new Date();
    return `<h2 class="st-h">Clock &amp; timers</h2><div class="ck">
      <div class="ckbig"><b id="ck-now">${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</b><span>${E(d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))}</span></div>
      <div class="ckrow"><div class="cks"><b>Stopwatch</b><em id="ck-sw">${fmtT(swNow() / 1000)}</em></div>${kt(CK.sw.run ? 'Stop' : 'Start', 'data-tclk="swgo" id="ck-swgo"')}${kt('Reset', 'data-tclk="swreset"')}</div>
      <div class="ckrow"><div class="cks"><b>Timer</b><em id="ck-tm">${fmtT(tmLeft())}</em></div>${kt(CK.tm.run ? 'Pause' : 'Start', 'data-tclk="tmgo" id="ck-tmgo"')}${kt('− 1 min', 'data-tclk="tm-1"')}${kt('+ 1 min', 'data-tclk="tm+1"')}${kt('+ 5 min', 'data-tclk="tm+5"')}${kt('Focus 25 min', 'data-tclk="focus"')}${kt('Reset', 'data-tclk="tmreset"')}</div>
      <div class="ckrow"><div class="cks"><b>Sleep timer</b><em id="ck-sl">${CK.sl.at ? 'Sleep in ' + fmtT((CK.sl.at - Date.now()) / 1000) : 'Off'}</em></div>${kt('30 min', 'data-tclk="sl30"')}${kt('60 min', 'data-tclk="sl60"')}${kt('90 min', 'data-tclk="sl90"')}${kt('Off', 'data-tclk="sloff"')}</div>
      <div class="wcrow">${WC.map(([c, z], i) => `<div class="wc"><b>${c}</b><em id="wc-${i}">${E(wcT(z))}</em></div>`).join('')}</div>
      <div class="ckrow"><div class="cks"><b>Bedtime</b><em>${E(bedTxt(lsGet('consoleBed', '')))}</em></div>${kt('Change bedtime', 'data-tbed="bed"')}<div class="cks"><b>Calm mode</b><em>${E(lsGet('consoleCalm', 'off'))}</em></div>${kt('Change calm mode', 'data-tbed="calm"')}</div></div>`;
  };
  const clockAct = (el) => {
    const k = el.dataset.tclk; if (!k) return false;
    const S = CK.sw, T = CK.tm;
    if (k === 'swgo') { if (S.run) { S.acc += Date.now() - S.t0; S.run = false; } else { S.t0 = Date.now(); S.run = true; } }
    else if (k === 'swreset') { S.run = false; S.acc = 0; }
    else if (k === 'tmgo') { if (T.run) { T.left = Math.max(1, Math.ceil((T.end - Date.now()) / 1000)); T.run = false; } else { const l = T.left || T.set; T.end = Date.now() + l * 1000; T.run = true; } }
    else if (k === 'tm+1' || k === 'tm-1' || k === 'tm+5') { const dlt = k === 'tm+5' ? 300 : k === 'tm+1' ? 60 : -60; if (T.run) T.end += dlt * 1000; else { T.set = Math.max(60, (T.left || T.set) + dlt); T.left = 0; } }
    else if (k === 'focus') { T.set = 1500; T.left = 0; T.end = Date.now() + 1500000; T.run = true; note('Focus timer: 25 minutes.'); }
    else if (k === 'tmreset') { T.run = false; T.left = 0; }
    else if (/^sl\d+$/.test(k)) { CK.sl.at = Date.now() + Number(k.slice(2)) * 60000; note('The console will put the PC to sleep in ' + k.slice(2) + ' minutes.'); }
    else if (k === 'sloff') { CK.sl.at = 0; note('Sleep timer off.'); }
    clockPaint(); const b = document.getElementById('ck-swgo'); if (b) b.querySelector('.st-l').textContent = CK.sw.run ? 'Stop' : 'Start';
    const c = document.getElementById('ck-tmgo'); if (c) c.querySelector('.st-l').textContent = CK.tm.run ? 'Pause' : 'Start';
    return true;
  };
  const clockPaint = () => {
    const $i = (id) => document.getElementById(id);
    if ($i('ck-now')) { const d = new Date(); $i('ck-now').textContent = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }); }
    if ($i('ck-sw')) $i('ck-sw').textContent = fmtT(swNow() / 1000) + '.' + Math.floor(swNow() % 1000 / 100);
    if ($i('ck-tm')) $i('ck-tm').textContent = fmtT(tmLeft());
    WC.forEach(([c, z], i) => { const w = $i('wc-' + i); if (w) w.textContent = wcT(z); });
    if ($i('ck-sl')) $i('ck-sl').textContent = CK.sl.at ? 'Sleep in ' + fmtT((CK.sl.at - Date.now()) / 1000) : 'Off';
  };
  setInterval(() => {   // the timers keep running whatever page you are on
    if (CK.tm.run && Date.now() >= CK.tm.end) { CK.tm.run = false; CK.tm.left = 0; beep(); note('Timer finished.'); try { document.body.classList.add('tmflash'); setTimeout(() => document.body.classList.remove('tmflash'), 1500); } catch {} }
    if (CK.sl.at && Date.now() >= CK.sl.at) { CK.sl.at = 0; note('Going to sleep...'); setTimeout(() => { try { api.sleep(); } catch {} }, 2500); }
    if (screen === 'tools' && tcat === 'clock') clockPaint();
  }, 250);

  /* ================= Calculator ================= */
  const CA = { cur: '0', acc: null, op: null, fresh: true, expr: '' };
  const cfmt = (n) => { if (!Number.isFinite(n)) return 'Error'; let s = String(parseFloat(n.toPrecision(12))); if (s.length > 14) s = n.toExponential(6); return s; };
  const calcKey = (k) => {
    const C = CA;
    if (C.cur === 'Error' && k !== 'C') return;
    if (/^\d$/.test(k)) { if (C.fresh) { C.cur = k; C.fresh = false; } else C.cur = C.cur === '0' ? k : (C.cur.length < 14 ? C.cur + k : C.cur); }
    else if (k === '.') { if (C.fresh) { C.cur = '0.'; C.fresh = false; } else if (!C.cur.includes('.')) C.cur += '.'; }
    else if (k === 'C') { CA.cur = '0'; CA.acc = null; CA.op = null; CA.fresh = true; CA.expr = ''; }
    else if (k === 'bs') { if (!C.fresh) C.cur = C.cur.length > 1 ? C.cur.slice(0, -1) : '0'; }
    else if (k === 'neg') { if (C.cur !== '0') C.cur = C.cur.startsWith('-') ? C.cur.slice(1) : '-' + C.cur; }
    else if (k === '%') { C.cur = cfmt(parseFloat(C.cur) / 100); C.fresh = true; }
    else if (['+', '-', '*', '/'].includes(k)) { if (C.op && !C.fresh) { C.acc = apply(C.acc, parseFloat(C.cur), C.op); C.cur = cfmt(C.acc); } else C.acc = parseFloat(C.cur); C.op = k; C.fresh = true; C.expr = cfmt(C.acc) + ' ' + OPS[k]; }
    else if (k === '=') { if (C.op != null) { const r = apply(C.acc, parseFloat(C.cur), C.op); C.expr = cfmt(C.acc) + ' ' + OPS[C.op] + ' ' + C.cur + ' ='; C.cur = cfmt(r); C.acc = null; C.op = null; C.fresh = true; } }
    const d = document.getElementById('ca-d'), x = document.getElementById('ca-x'); if (d) { d.textContent = C.cur; x.textContent = C.expr || ' '; }
  };
  const OPS = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  const apply = (a, b, op) => (op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : b === 0 ? NaN : a / b);
  const calcPane = () => `<h2 class="st-h">Calculator</h2><div class="ca"><div class="cadisp"><small id="ca-x">${E(CA.expr || ' ')}</small><b id="ca-d">${E(CA.cur)}</b></div><div class="cagrid">
    ${[['C', 'C', 'fn'], ['neg', '±', 'fn'], ['%', '%', 'fn'], ['/', '÷', 'op'], ['7', '7'], ['8', '8'], ['9', '9'], ['*', '×', 'op'], ['4', '4'], ['5', '5'], ['6', '6'], ['-', '−', 'op'], ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+', 'op'], ['0', '0'], ['.', '.'], ['bs', '⌫', 'fn'], ['=', '=', 'eq']].map(([k, l, c]) => kt(l, `data-tk="${k}"`, c)).join('')}</div></div>`;
  const calcAct = (el) => { if (el.dataset.tk === undefined) return false; calcKey(el.dataset.tk); return true; };

  /* ================= Calendar ================= */
  const CL = { y: new Date().getFullYear(), m: new Date().getMonth() };
  const calPane = () => {
    const first = new Date(CL.y, CL.m, 1), start = first.getDay(), days = new Date(CL.y, CL.m + 1, 0).getDate(), today = new Date();
    const isT = (d) => today.getFullYear() === CL.y && today.getMonth() === CL.m && today.getDate() === d;
    let cells = ''; for (let i = 0; i < 42; i++) { const d = i - start + 1; cells += d >= 1 && d <= days ? `<i class="cd${isT(d) ? ' now' : ''}">${d}</i>` : '<i class="cd off"></i>'; }
    const wk = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => `<i class="cw">${w}</i>`).join('');
    return `<h2 class="st-h">Calendar</h2><div class="cal"><div class="calbar">${kt('‹', 'data-tcal="prev"')}<b>${E(first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))}</b>${kt('›', 'data-tcal="next"')}${kt('Today', 'data-tcal="today"')}</div><div class="calg">${wk}${cells}</div></div>`;
  };
  const calAct = (el) => {
    const k = el.dataset.tcal; if (!k) return false;
    if (k === 'prev') { CL.m--; if (CL.m < 0) { CL.m = 11; CL.y--; } } else if (k === 'next') { CL.m++; if (CL.m > 11) { CL.m = 0; CL.y++; } } else { CL.y = new Date().getFullYear(); CL.m = new Date().getMonth(); }
    paintPane(true); const b = document.querySelector('.st-r [data-tcal="' + k + '"]'); if (b) b.focus({ preventScroll: true }); return true;
  };

  /* ================= Windows & devices ================= */
  const WIN = [['bt', 'Bluetooth & devices', 'ms-settings:bluetooth', 'Pair controllers, headsets'], ['monitor', 'Display', 'ms-settings:display', 'Resolution, refresh rate, HDR'], ['vol', 'Sound', 'ms-settings:sound', 'Output and input devices'], ['net', 'Network & internet', 'ms-settings:network', 'Wi-Fi, Ethernet, VPN'], ['power', 'Power & sleep', 'ms-settings:powersleep', 'Screen and sleep times'], ['gear', 'Personalization', 'ms-settings:personalization', 'Colors, wallpaper, taskbar']];
  const WTOOLS = [['chip', 'Task Manager', 'taskmgr', 'Close a stuck program'], ['folder', 'File Explorer', 'explorer', 'The normal Windows file window'], ['gear', 'Device Manager', 'devmgmt', 'Drivers and hardware'], ['hdd', 'Disk Management', 'diskmgmt', 'Drives and partitions'], ['gear', 'Control Panel', 'control', 'The classic settings']];
  const PW = { list: null }, AU = { list: null, busy: false };
  const audTiles = () => (AU.list || []).map((d, i) => tile('vol', 'Sound output: ' + d.name, `data-au="${i}"`, d.def ? 'In use now' : 'Switch to this')).join('');
  const pwrTiles = () => (PW.list || []).map((p, i) => tile('chip', 'Power mode: ' + p.name, `data-pw="${i}"`, p.active ? 'In use now' : 'Switch to this')).join('');
  const DM = { list: null, busy: false, undo: null, kept: true, timer: 0 }, SL = { v: null, busy: false }, SN = { v: null, m: null, ins: null, busy: false }, TZ = { d: null, busy: false }, HD = { list: null, busy: false };
  const pctLbl = (x) => x && x.ok ? (x.mute ? 'Muted' : x.vol + '%') : '...';
  const slLbl = (m) => m < 0 ? 'Unknown' : m === 0 ? 'Never' : m < 60 ? m + ' minutes' : (m / 60) + (m === 60 ? ' hour' : ' hours');
  const dmN = (d, i) => (DM.list.length > 1 ? ' ' + (i + 1) + (d.primary ? ' (main)' : '') : '');
  const dmTiles = () => (DM.list || []).map((d, i) => tile('monitor', 'Resolution' + dmN(d, i), `data-dm="res:${i}"`, d.w + ' \u00d7 ' + d.h + ' \u00b7 A to change') + tile('monitor', 'Refresh rate' + dmN(d, i), `data-dm="hz:${i}"`, d.hz + ' Hz \u00b7 A to change')).join('');
  const winPane = () => {
    const rd = () => { if (screen === 'tools' && tcat === 'win') paintPane(true); };
    if (!AU.list && !AU.busy) { AU.busy = true; api.audList().then((l) => { AU.list = l || []; AU.busy = false; rd(); }).catch(() => { AU.list = []; AU.busy = false; }); }
    if (!PW.list && !PW.busy) { PW.busy = true; api.pwrList().then((l) => { PW.list = l || []; PW.busy = false; rd(); }).catch(() => { PW.list = []; PW.busy = false; }); }
    if (!DM.list && !DM.busy) { DM.busy = true; api.dispModes().then((l) => { DM.list = l || []; DM.busy = false; rd(); }).catch(() => { DM.list = []; DM.busy = false; }); }
    if (!SN.busy && !SN.v) { SN.busy = true; Promise.all([api.volGet().catch(() => ({ ok: false })), api.micGet().catch(() => ({ ok: false })), api.audListIn().catch(() => [])]).then(([v, m, i]) => { SN.v = v || { ok: false }; SN.m = m || { ok: false }; SN.ins = i || []; SN.busy = false; rd(); }); }
    if (!HD.list && !HD.busy) { HD.busy = true; api.hdrList().then((l) => { HD.list = l || []; HD.busy = false; rd(); }).catch(() => { HD.list = []; HD.busy = false; }); }
    if (!TZ.d && !TZ.busy) { TZ.busy = true; api.tzGet().then((d) => { TZ.d = d || { cur: '', list: [] }; TZ.busy = false; rd(); }).catch(() => { TZ.d = { cur: '', list: [] }; TZ.busy = false; }); }
    if (!SL.v && !SL.busy) { SL.busy = true; api.sleepGet().then((v) => { SL.v = v || { screen: -1, sleep: -1 }; SL.busy = false; rd(); }).catch(() => { SL.v = { screen: -1, sleep: -1 }; SL.busy = false; }); }
    return winPane0();
  };
  const snTiles = () => {
    if (!SN.v) return '';
    const inn = (SN.ins || []).find((d) => d.def);
    return (SN.v.ok ? tile('vol', 'Volume', 'data-snd="vol"', pctLbl(SN.v) + ' \u00b7 A to change') + tile('vol', 'Sound: ' + (SN.v.mute ? 'Muted' : 'On'), 'data-snd="mute"', 'A to ' + (SN.v.mute ? 'unmute' : 'mute')) : '')
      + ((SN.ins || []).length ? tile('headset', 'Microphone' + (inn ? ': ' + inn.name : ''), 'data-snd="micdev"', 'A to change') : '')
      + (SN.m && SN.m.ok ? tile('headset', 'Microphone volume', 'data-snd="micv"', pctLbl(SN.m) + ' \u00b7 A to change') + tile('headset', 'Microphone: ' + (SN.m.mute ? 'Muted' : 'On'), 'data-snd="micm"', 'A to ' + (SN.m.mute ? 'unmute' : 'mute')) : '');
  };
  const tzTile = () => { const l = (TZ.d && TZ.d.list) || []; if (!l.length) return ''; const c = l.find((x) => x.id === TZ.d.cur); return tile('clock', 'Time zone', 'data-tz="1"', (c ? c.name : TZ.d.cur) + ' \u00b7 A to change'); };
  const hdTiles = () => (HD.list || []).filter((h) => h.supported).map((h) => { const i = (DM.list || []).findIndex((d) => d.dev === h.dev); return tile('monitor', 'HDR' + (DM.list && DM.list.length > 1 && i >= 0 ? ' ' + (i + 1) : ''), `data-hdr="${E(h.dev)}"`, (h.on ? 'On' : 'Off') + ' \u00b7 A to turn ' + (h.on ? 'off' : 'on')); }).join('');
  const winPane0 = () => { const cur = (PW.list || []).find((p) => p.active); const sv = SL.v || { screen: -1, sleep: -1 }; return `<h2 class="st-h">Display &amp; sound</h2><div class="tl">${dmTiles()}${audTiles()}${snTiles()}${(PW.list || []).length ? tile('chip', 'Power mode', 'data-pwmenu="1"', (cur ? cur.name : 'Unknown') + ' \u00b7 A to change') : ''}${tile('power', 'Turn screen off after', 'data-sl="screen"', slLbl(sv.screen) + ' \u00b7 A to change')}${tile('power', 'Sleep after', 'data-sl="sleep"', slLbl(sv.sleep) + ' \u00b7 A to change')}${hdTiles()}${tzTile()}</div>`; };
  const dmApply = (d, w, h, hz) => {
    const prev = { dev: d.dev, w: d.w, h: d.h, hz: d.hz };
    api.dispSet(d.dev, w, h, hz).then((ok) => {
      if (!ok) { note('This screen would not use that setting.'); return; }
      DM.undo = prev; DM.kept = false; clearTimeout(DM.timer);
      DM.timer = setTimeout(() => { if (!DM.kept) dmUndo(true); }, 14000); note('Going back by itself in 14 seconds unless you keep it.');
      setTimeout(() => { const t = document.querySelector('.st-r [data-dm]') || document.activeElement; if (!DM.kept) popMenu(t, 'Keep this setting?', [['dm:keep', 'Keep it'], ['dm:undo', 'Go back']], { xt: { kind: 'dmk' } }); }, 1500);
    });
  };
  const dmUndo = (auto) => {
    clearTimeout(DM.timer); const p = DM.undo; DM.kept = true; DM.undo = null; if (document.getElementById('menu')) closeMenu(true);
    if (p) api.dispSet(p.dev, p.w, p.h, p.hz).then(() => { DM.list = null; note(auto ? 'No answer, so the screen went back to how it was.' : 'Went back to the previous setting.'); if (screen === 'tools' && tcat === 'win') paintPane(true); });
  };
  const winAct = (el) => {
    const d = el.dataset;
    if (d.au !== undefined) { const x = (AU.list || [])[Number(d.au)]; if (x) api.audSet(x.id).then((ok) => { note(ok ? 'Sound now plays through ' + x.name + '.' : 'Could not switch the sound output.'); AU.list = null; setTimeout(() => paintPane(true), 400); }); return true; }
    if (d.pw !== undefined) { const p = (PW.list || [])[Number(d.pw)]; if (p) api.pwrSet(p.guid).then((ok) => { note(ok ? 'Power mode: ' + p.name : 'Could not change the power mode.'); if (ok) { PW.list = null; paintPane(true); } }); return true; }
    if (d.hdr) { const h = (HD.list || []).find((x) => x.dev === d.hdr); if (h) api.hdrSet(h.dev, !h.on).then((ok) => { note(ok ? 'HDR is now ' + (h.on ? 'off.' : 'on.') : 'This screen would not change HDR.'); HD.list = null; setTimeout(() => paintPane(true), 700); }); return true; }
    if (d.tz) { popMenu(el, 'Time zone', TZ.d.list.map((x, i) => ['z:' + i, (x.id === TZ.d.cur ? '\u2713  ' : '') + x.name]), { xt: { kind: 'tz' } }); return true; }
    if (d.snd) {
      const lv = (cur) => [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((n) => ['n:' + n, (cur === n ? '\u2713  ' : '') + n + '%']);
      if (d.snd === 'vol' && SN.v) { popMenu(el, 'Volume', lv(SN.v.vol), { xt: { kind: 'snd', w: 'vol' } }); return true; }
      if (d.snd === 'micv' && SN.m) { popMenu(el, 'Microphone volume', lv(SN.m.vol), { xt: { kind: 'snd', w: 'mic' } }); return true; }
      if (d.snd === 'mute' && SN.v) { api.volSet(SN.v.vol, !SN.v.mute).then(() => { SN.v = null; paintPane(true); }); return true; }
      if (d.snd === 'micm' && SN.m) { api.micSet(SN.m.vol, !SN.m.mute).then(() => { SN.v = null; paintPane(true); }); return true; }
      if (d.snd === 'micdev') { popMenu(el, 'Microphone', (SN.ins || []).map((x, i) => ['i:' + i, (x.def ? '\u2713  ' : '') + x.name]), { xt: { kind: 'snd', w: 'in' } }); return true; }
    }
    if (d.dm) {
      const [k, i] = d.dm.split(':'); const x = (DM.list || [])[Number(i)]; if (!x) return true;
      if (k === 'res') { const seen = []; for (const m of x.modes) if (!seen.some((q) => q.w === m.w && q.h === m.h)) seen.push(m); popMenu(el, 'Resolution', seen.map((m) => ['m:' + i + ':' + m.w + ':' + m.h, (m.w === x.w && m.h === x.h ? '\u2713  ' : '') + m.w + ' \u00d7 ' + m.h]), { xt: { kind: 'dm' } }); }
      else popMenu(el, 'Refresh rate', x.modes.filter((m) => m.w === x.w && m.h === x.h).map((m) => ['h:' + i + ':' + m.hz, (m.hz === x.hz ? '\u2713  ' : '') + m.hz + ' Hz']), { xt: { kind: 'dm' } });
      return true;
    }
    if (d.sl) { popMenu(el, d.sl === 'screen' ? 'Turn screen off after' : 'Sleep after', [0, 5, 10, 15, 30, 60, 120, 180].map((m) => ['sl:' + d.sl + ':' + m, ((SL.v || {})[d.sl] === m ? '\u2713  ' : '') + slLbl(m)]), { xt: { kind: 'sl' } }); return true; }
    if (d.pwmenu) { popMenu(el, 'Power mode', (PW.list || []).map((p, i) => ['pw:' + i, (p.active ? '\u2713  ' : '') + p.name]), { xt: { kind: 'pw' } }); return true; }
    if (d.bin) { popMenu(el, 'Empty the Recycle Bin? This cannot be undone.', [['b:no', 'No, keep it'], ['b:yes', 'Yes, empty it']], { xt: { kind: 'bin' } }); return true; }
    if (d.win) { api.winSettings(d.win).then((ok) => note(ok ? 'Opening Windows settings...' : 'Could not open that page.')); return true; }
    if (d.wtool) { api.winTool(d.wtool).then((ok) => note(ok ? 'Opening...' : 'Could not open that tool.')); return true; }
    return false;
  };


  /* ================= Running apps ================= */
  const AP = { list: null, busy: false };
  const appsLoad = () => { AP.busy = true; paintPane(true); api.winList().then((l) => { AP.list = l || []; AP.busy = false; paintPane(true); }).catch(() => { AP.list = []; AP.busy = false; paintPane(true); }); };
  function appsPane() {
    if (!AP.list && !AP.busy) setTimeout(appsLoad, 0);
    const head = `<h2 class="st-h">Switch apps</h2>`;
    if (!AP.list) return head + '<p class="tnote"><i class="spin"></i>Looking at what is open...</p>';
    const t = AP.list.map((a, i) => tile('monitor', a.title, `data-ap="${i}"`, a.name)).join('');
    return `${head}<div class="tl">${tile('refresh', AP.busy ? 'Refreshing...' : 'Refresh the list', 'data-tact="apref"')}${t}</div>${AP.list.length ? '<p class="tnote">A switches to it · X for more (close, force quit)</p>' : '<p class="tnote">Nothing else is open. Games and apps you start from the console show up here.</p>'}`;
  }
  const appsAct = (el) => {
    const d = el.dataset;
    if (d.tact === 'apref') { appsLoad(); return true; }
    if (d.ap === undefined) return false;
    const a = (AP.list || [])[Number(d.ap)]; if (!a) return true;
    api.winFocus(a.id).then((ok) => note(ok ? 'Switched to ' + a.name + '.' : 'That window is gone. Refreshing...')).then(() => setTimeout(appsLoad, 600)).catch(() => {});
    return true;
  };
  const xtMenu = async (a, st) => {
    if (st.kind === 'mr') { mrMenu(a, st); return; }
    if (st.kind === 'tz') { const x = TZ.d.list[Number(a.slice(2))]; if (x) api.tzSet(x.id).then((ok) => { note(ok ? 'Time zone: ' + x.name : 'Windows would not change the time zone.'); TZ.d = null; paintPane(true); }); return; }
    if (st.kind === 'snd') {
      if (st.w === 'in') { const x = (SN.ins || [])[Number(a.slice(2))]; if (x) api.audSet(x.id).then((ok) => { note(ok ? 'Microphone: ' + x.name : 'Could not switch the microphone.'); SN.v = null; paintPane(true); }); return; }
      const n = Number(a.slice(2)); const cur = st.w === 'vol' ? SN.v : SN.m; if (!cur) return;
      (st.w === 'vol' ? api.volSet(n, false) : api.micSet(n, false)).then(() => { SN.v = null; paintPane(true); }); return;
    }
    if (st.kind === 'btd') { const x = st.x; if (a === 'bt:rm') api.btAct(x.id, 'unpair').then((r) => { note(r && r.ok ? x.name + ' was removed.' : 'Could not remove it (' + (r && r.status) + ').'); DV.bt = null; paintPane(true); }); return; }
    if (st.kind === 'dm') {
      const p = a.split(':'), x = (DM.list || [])[Number(p[1])]; if (!x) return;
      if (p[0] === 'm') { const w = +p[2], h = +p[3]; const ms = x.modes.filter((m) => m.w === w && m.h === h); const best = ms.find((m) => m.hz === x.hz) || ms.slice().sort((q, r) => r.hz - q.hz)[0]; if (best && !(w === x.w && h === x.h)) dmApply(x, w, h, best.hz); }
      else if (+p[2] !== x.hz) dmApply(x, x.w, x.h, +p[2]);
      return;
    }
    if (st.kind === 'dmk') { if (a === 'dm:keep') { clearTimeout(DM.timer); DM.kept = true; DM.undo = null; DM.list = null; note('Saved.'); paintPane(true); } else dmUndo(false); return; }
    if (st.kind === 'sl') { const [, k, m] = a.split(':'); api.sleepSet(k, +m).then((ok) => { note(ok ? 'Saved.' : 'Could not change that.'); SL.v = null; paintPane(true); }); return; }
    if (st.kind === 'pw') { const p = (PW.list || [])[Number(a.slice(3))]; if (p) api.pwrSet(p.guid).then((ok) => { note(ok ? 'Power mode: ' + p.name : 'Could not change the power mode.'); PW.list = null; paintPane(true); }); return; }
    if (st.kind === 'reset') { if (a === 'r:yes') api.sysReset(); return; }
    if (st.kind === 'ga') { if (a === 'ga:in') return gaRun(api.wgInstall(st.x.id), 'Installing ' + st.x.name + '...', st.x.name + ' was installed.'); if (a === 'ga:rm') return gaRun(api.wgUninstall(st.x.id), 'Removing ' + st.x.name + '...', st.x.name + ' was removed.'); return; }
    if (st.kind === 'stg') { if (a === 's:folder') return api.gameAction(st.g.id, 'folder').then((r) => { if (!r || !r.ok) note('Could not open the folder.'); }); if (a === 's:unins') return api.gameAction(st.g.id, 'uninstall').then((r) => { note((r && r.note) || (r && r.ok ? 'Uninstall started.' : 'Could not uninstall it from here.')); ST.list = null; }); return; }
    if (st.kind === 'app') {
      const x = st.app;
      if (a === 'a:focus') return api.winFocus(x.id).then((ok) => note(ok ? 'Switched to ' + x.name + '.' : 'Could not switch to it.'));
      if (a === 'a:close') { const ok = await api.winClose(x.id, false); note(ok ? 'Asked ' + x.name + ' to close.' : 'Could not close it.'); return setTimeout(appsLoad, 1500); }
      if (a === 'a:kill') return popMenu(st.tile, 'Force quit ' + x.name + '? Unsaved work is lost.', [['a:no', 'No, leave it'], ['a:kill2', 'Yes, force quit']], { xt: st });
      if (a === 'a:kill2') { const ok = await api.winClose(x.id, true); note(ok ? x.name + ' was closed.' : 'Could not force quit it.'); return setTimeout(appsLoad, 1000); }
      return;
    }
    if (st.kind === 'note') { if (a.startsWith('n:del:')) { const n = noteGet(); n.splice(Number(a.slice(6)), 1); noteSet(n); paintPane(true); note('Deleted.'); } return; }
    if (st.kind === 'disp') { const m = a.slice(2); if (m !== 'no') { const ok = await api.dispMode(m); note(ok ? 'Changing the screens...' : 'Could not change the screens.'); } return; }
    if (st.kind === 'care') { if (a === 'c:upd') { note('Installing...'); const ok = await api.updApply(); if (!ok) note('The update could not be installed.'); } else if (a.startsWith('c:rst:')) { const ok = await api.bakRestore(a.slice(6)); note(ok ? 'Restored. Restarting...' : 'Could not restore that backup.'); } return; }
    if (st.kind === 'bin') { if (a === 'b:yes') { const ok = await api.binEmpty(); note(ok ? 'Recycle Bin emptied.' : 'Could not empty the Recycle Bin.'); } return; }
    if (st.kind === 'file') {
      const r = st.row, full = st.full;
      if (a === 'f:open') return api.fsOpen(full).then((x) => note(x && x.ok ? 'Opening ' + r.name + '...' : 'Windows could not open this.'));
      if (a === 'f:reveal') return api.fsReveal(full).then((ok) => note(ok ? 'Showing it in Explorer...' : 'Could not show it.'));
      if (a === 'f:copy') { try { await navigator.clipboard.writeText(full); note('Path copied.'); } catch { note('Could not copy the path.'); } return; }
      if (a === 'f:rename') { const n = await openOsk('Rename', r.name, { done: 'Rename' }); if (n === null || n === r.name) return; const x = await api.fsRename(full, n); note(x.ok ? 'Renamed.' : x.error); return filesLoad(FS.path); }
      if (a === 'f:trash') return popMenu(st.tile, 'Move ' + (r.name.length > 34 ? r.name.slice(0, 31) + '...' : r.name) + ' to the Recycle Bin?', [['f:no', 'No, keep it'], ['f:trash2', 'Yes, move it']], { xt: st });
      if (a === 'f:trash2') { const x = await api.fsTrash(full); note(x.ok ? 'Moved to the Recycle Bin.' : x.error); return filesLoad(FS.path); }
      if (a === 'f:cp' || a === 'f:cut') { FC = { path: full, name: r.name, move: a === 'f:cut' }; paintPane(true); return note((a === 'f:cut' ? 'Cut ' : 'Copied ') + r.name + '. Open the folder you want and choose Paste there.'); }
      if (a === 'f:pin') { const f = favGet().filter((x) => x.path !== full); f.unshift({ name: r.name, path: full }); favSet(f); return note('Pinned ' + r.name + ' to Files home.'); }
      if (a === 'f:unpin') { favSet(favGet().filter((x) => x.path !== full)); note('Unpinned.'); return filesLoad(''); }
      if (a === 'f:new') return newFolder();
    }
  };
  const newFolder = async () => { if (!FS.path) return; const n = await openOsk('New folder name', 'New folder', { done: 'Create' }); if (n === null) return; const x = await api.fsMkdir(FS.path, n); note(x.ok ? 'Folder created.' : x.error); filesLoad(FS.path); };
  const mA0 = window.menuAction;
  window.menuAction = function (a) { if (menu && menu.xt) { const st = { ...menu.xt, tile: menu.tile }; closeMenu(false); return xtMenu(a, st); } return mA0.apply(this, arguments); };
  window.xtraRemove = () => { if (window.wsRemove && window.wsRemove()) return true; if (window.coRemove && window.coRemove()) return true;   // X
    if (screen !== 'tools') return false;
    const f = document.activeElement, d = f && f.dataset; if (!d) return true;
    if (d.tnote !== undefined && d.tnote !== 'new') { const n = noteGet(), i = Number(d.tnote); if (n[i] !== undefined) popMenu(f, 'Delete this note?', [['n:no', 'No, keep it'], ['n:del:' + i, 'Yes, delete it']], { xt: { kind: 'note' } }); return true; }
    if (d.ap !== undefined) { const a = (AP.list || [])[Number(d.ap)]; if (a) popMenu(f, a.title.length > 40 ? a.title.slice(0, 37) + '...' : a.title, [['a:focus', 'Switch to it'], ['a:close', 'Close it'], ['a:kill', 'Force quit'], ['a:no', 'Cancel']], { xt: { kind: 'app', app: a } }); return true; }
    if (d.fv !== undefined) { const p = favGet()[Number(d.fv)]; if (p) popMenu(f, p.name, [['f:unpin', 'Unpin from Files home'], ['f:no', 'Cancel']], { xt: { kind: 'file', row: { name: p.name, dir: true }, full: p.path } }); return true; }
    if (d.fi !== undefined && d.fi !== 'up' && d.fi !== 'more' && d.fi !== 'paste' && FS.data) { const r = FS.data.rows[Number(d.fi)]; if (r) { const full = FS.data.path.replace(/[\\/]+$/, '') + '\\' + r.name; popMenu(f, r.name.length > 40 ? r.name.slice(0, 37) + '...' : r.name, [['f:open', 'Open in Windows'], ['f:cp', 'Copy'], ['f:cut', 'Cut (move)'], ...(r.dir ? [['f:pin', 'Pin to Files home']] : []), ['f:copy', 'Copy path'], ['f:rename', 'Rename'], ['f:trash', 'Move to Recycle Bin'], ['f:no', 'Cancel']], { xt: { kind: 'file', row: r, full } }); } return true; }
    return true;
  };
  window.xtraSearch = () => {   // Y
    if (screen !== 'tools') return false;
    if (tcat === 'files' && FS.path) { newFolder(); return true; }
    if (tcat === 'apps') { appsLoad(); return true; }
    if (tcat === 'search') { const b = document.querySelector('#tpane [data-tsrch]'); if (b) searchAct(b); return true; }
    if (tcat === 'files') { filesLoad(''); return true; }
    return true;
  };


  const webUrl = (q) => (/^https?:\/\//i.test(q) ? q : /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(q) ? 'https://' + q : 'https://www.google.com/search?q=' + encodeURIComponent(q));
  /* ================= Search everything ================= */
  const SR = { q: '', res: null, busy: false };
  const TOOLBITS = () => [...TCATS.filter((c) => c[0] !== 'home' && c[0] !== 'search').map(([k, l]) => ({ t: 'cat', k, label: l, sub: 'Tools' }))];
  const doSearch = async (q) => {
    SR.q = q; SR.busy = true; SR.res = null; paintPane(true);
    const lq = q.toLowerCase(), res = [];
    try { for (const g of (games || [])) if ((g.title || '').toLowerCase().includes(lq)) res.push({ t: 'game', id: g.id, label: g.title, sub: 'Game' }); } catch {}
    try { for (const a of (settings.webApps || [])) if ((a.name || '').toLowerCase().includes(lq)) res.push({ t: 'app', id: a.id, label: a.name, sub: 'App' }); } catch {}
    for (const b of TOOLBITS()) if (b.label.toLowerCase().includes(lq) || (b.sub || '').toLowerCase().includes(lq)) res.push(b);
    SR.res = res.slice(0, 30); SR.busy = false; paintPane(true);
    let files = []; try { files = await api.fsFind(q); } catch {}
    if (SR.q !== q) return;
    for (const f of files) SR.res.push({ t: 'file', f, label: f.name, sub: f.dir ? 'Folder' : 'File' });
    SR.files = true; if (screen === 'tools' && tcat === 'search') paintPane(true);
  };
  function searchPane() {
    const head = `<h2 class="st-h">Search</h2>`;
    const go = `<div class="tl">${tile('search', SR.q ? 'Search again' : 'Type to search', 'data-tsrch="go"', SR.q ? 'Last search: ' + SR.q : 'Games, apps, files, settings and tools')}`;
    if (!SR.q) return head + go + '</div>';
    if (SR.busy) return head + go + '</div><p class="tnote"><i class="spin"></i>Searching...</p>';
    const icon = { web: 'net', game: 'library', app: 'apps', cat: 'tools', win: 'gear', wtool: 'chip', file: 'file' };
    const t = (SR.res || []).map((r, i) => tile(r.t === 'file' ? (r.f.dir ? 'folder' : r.f.kind === 'image' ? 'image' : r.f.kind === 'video' ? 'film' : r.f.kind === 'audio' ? 'music' : 'file') : icon[r.t] || 'file', r.label, `data-sr="${i}"`, r.sub)).join('');
    return head + go + t + '</div>' + (!(SR.res || []).length ? '<p class="tnote">Nothing found yet. Files are still being looked through...</p>' : '');
  }
  const searchAct = (el) => {
    const d = el.dataset;
    if (d.tsrch) { openOsk('Search everything', SR.q, { done: 'Search' }).then((q) => { if (q && q.trim().length > 0) doSearch(q.trim()); }); return true; }
    if (d.sr === undefined) return false;
    const r = (SR.res || [])[Number(d.sr)]; if (!r) return true;
    if (r.t === 'web') { brOpen(r.url); return true; }
    if (r.t === 'game') { openGame(r.id); return true; }
    if (r.t === 'app') { openApp(r.id); return true; }
    if (r.t === 'cat') { toolsCat(r.k); setTimeout(() => { const f = document.querySelector('.st-r [data-nav]'); if (f) f.focus({ preventScroll: true }); }, 60); return true; }
    if (r.t === 'win') { api.winSettings(r.k).then((ok) => note(ok ? 'Opening Windows settings...' : 'Could not open that page.')); return true; }
    if (r.t === 'wtool') { api.winTool(r.k).then((ok) => note(ok ? 'Opening...' : 'Could not open that tool.')); return true; }
    if (r.t === 'file') {
      const f = r.f;
      if (f.dir) { tcat = 'files'; FS.data = null; paintRail(); paintPane(); filesLoad(f.path); return true; }
      if (f.kind) { openViewer([{ name: f.name, kind: f.kind, path: f.path }], 0); return true; }
      api.fsOpen(f.path).then((x) => note(x && x.ok ? 'Opening ' + f.name + '...' : 'Windows could not open this file.')); return true;
    }
    return true;
  };

  /* ================= screensaver photos ================= */
  const ssOn = () => { try { return localStorage.consoleSaverPics === '1'; } catch { return false; } };
  const ssAct = (el) => { if (el.dataset.tact !== 'ssp') return false; try { localStorage.consoleSaverPics = ssOn() ? '0' : '1'; } catch {} note('Screensaver photos ' + (ssOn() ? 'on.' : 'off.')); ssList = null; paintPane(true); return true; };
  let ssList = null, ssT = 0, ssTok = 0;
  const ssShow = async () => {
    const tok = ssTok; const amb = document.getElementById('ambient'); if (!amb || !document.body.classList.contains('ambient') || !ssOn()) return;
    if (!ssList) { try { const pl = FS.places || await api.fsPlaces(); FS.places = pl; const pic = pl.find((x) => x.key === 'pictures'); const r = pic && await api.fsList(pic.path); ssList = r && r.ok ? r.rows.filter((x) => x.kind === 'image').map((x) => pic.path.replace(/[\\/]+$/, '') + '\\' + x.name).slice(0, 80) : []; } catch { ssList = []; } }
    if (tok !== ssTok || !ssList.length) return;
    let box = document.getElementById('ssp'); if (!box) { box = document.createElement('div'); box.id = 'ssp'; amb.insertBefore(box, amb.firstChild); }
    const pick = ssList[Math.floor(Math.random() * ssList.length)], u = await api.fsMedia(pick).catch(() => ''); if (tok !== ssTok || !u) { if (tok === ssTok) ssT = setTimeout(ssShow, 4000); return; }
    const im = new Image(); im.onload = () => { if (tok !== ssTok) return; box.appendChild(im); void im.offsetWidth; im.classList.add('on'); [...box.children].slice(0, -1).forEach((o) => { o.classList.remove('on'); setTimeout(() => o.remove(), 2200); }); ssT = setTimeout(ssShow, 12000); }; im.onerror = () => { ssT = setTimeout(ssShow, 3000); }; im.src = u;
  };
  new MutationObserver(() => { const on = document.body.classList.contains('ambient'); if (on && !ssT) { ssTok++; ssT = setTimeout(ssShow, 600); } else if (!on && ssT) { clearTimeout(ssT); ssT = 0; ssTok++; const b = document.getElementById('ssp'); if (b) { b.style.transition = 'opacity .6s ease'; b.style.opacity = '0'; setTimeout(() => b.remove(), 700); } } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ================= bedtime and calm mode ================= */
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } }, lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const BEDS = ['', '22:00', '23:00', '00:00', '01:00', '02:00'], bedTxt = (b) => (b ? new Date(2000, 0, 1, +b.slice(0, 2), +b.slice(3)).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : 'Off');
  const calmOn = () => { const m = lsGet('consoleCalm', 'off'), h = new Date().getHours(); return m === 'on' || (m === 'auto' && (h >= 21 || h < 6)); };
  const calmApply = () => document.body.classList.toggle('calm', calmOn());
  setInterval(calmApply, 30000); setTimeout(calmApply, 500);
  let bedDay = '', bedWarn = '';
  setInterval(() => {
    const b = lsGet('consoleBed', ''); if (!b) return; const d = new Date(), day = d.toDateString(), mins = d.getHours() * 60 + d.getMinutes(), tgt = +b.slice(0, 2) * 60 + +b.slice(3);
    let diff = tgt - mins; if (diff < -600) diff += 1440;   // a bedtime after midnight still works when it is 23:58
    if (diff === 5 && bedWarn !== day + b) { bedWarn = day + b; note('Bedtime in 5 minutes. The PC will go to sleep.'); }
    if (diff <= 0 && diff > -2 && bedDay !== day + b) { bedDay = day + b; note('Bedtime. Going to sleep...'); setTimeout(() => { try { api.sleep(); } catch {} }, 3000); }
  }, 20000);
  const bedAct = (el) => {
    const k = el.dataset.tbed; if (!k) return false;
    if (k === 'bed') { const i = BEDS.indexOf(lsGet('consoleBed', '')); lsSet('consoleBed', BEDS[(i + 1) % BEDS.length]); note('Bedtime: ' + bedTxt(lsGet('consoleBed', ''))); }
    else { const m = ['off', 'auto', 'on'], i = m.indexOf(lsGet('consoleCalm', 'off')); lsSet('consoleCalm', m[(i + 1) % 3]); calmApply(); note('Calm mode: ' + lsGet('consoleCalm', 'off')); }
    paintPane(true); return true;
  };

  /* ================= screen recording ================= */
  let REC = null;
  window.recToggle = async () => {
    if (REC) { try { REC.mr.stop(); } catch {} return; }
    let id = ''; try { id = await api.recSource(); } catch {} if (!id) return note('Could not find the screen to record.');
    let stream = null;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'desktop' } }, video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: id, maxFrameRate: 60 } } }); }
    catch { try { stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: id, maxFrameRate: 60 } } }); } catch { return note('Screen recording is not available here.'); } }
    const name = await api.recStart(); if (!name) { stream.getTracks().forEach((t) => t.stop()); return note('Could not start the recording file.'); }
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } });
    const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
    mr.ondataavailable = async (e) => { if (e.data && e.data.size) { try { await api.recChunk(await e.data.arrayBuffer()); } catch {} } };
    mr.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); await new Promise((r) => setTimeout(r, 300)); await api.recEnd(); REC = null; document.body.classList.remove('recording'); note('Recording saved to Captures.'); };
    mr.start(1000); REC = { mr }; document.body.classList.add('recording'); note('Recording started. Open the Xbox menu and choose Record screen to stop.');
  };

  /* ================= Devices & screens ================= */
  const DV = { bt: null, disp: null, busy: false };
  const devLoad = () => { DV.busy = true; Promise.all([api.btScan().then((l) => (l && l.length ? l : api.devBt().then((x) => (x || []).map((d) => ({ id: '', name: d.name, paired: true, connected: d.ok, can: false }))))).catch(() => []), api.dispInfo().catch(() => [])]).then(([b, d]) => { DV.bt = b || []; DV.disp = d || []; DV.busy = false; if (screen === 'tools' && tcat === 'dev') paintPane(true); }); };
  function devPane() {
    if (!DV.bt && !DV.busy) setTimeout(devLoad, 0);
    const head = '<h2 class="st-h">Devices &amp; screens</h2>';
    if (!DV.bt) return head + '<p class="tnote"><i class="spin"></i>Looking for devices... this takes a few seconds.</p>';
    const paired = DV.bt.map((d, i) => [d, i]).filter(([d]) => d.paired), near = DV.bt.map((d, i) => [d, i]).filter(([d]) => !d.paired && d.can);
    const bt = paired.map(([d, i]) => tile('bt', d.name, `data-btd="${i}"`, (d.connected ? 'Connected' : 'Paired, not connected') + (d.id ? ' \u00b7 A to remove' : ''))).join('');
    const nb = near.map(([d, i]) => tile('bt', d.name, `data-btp="${i}"`, 'Nearby \u00b7 A to pair')).join('');
    const sc = DV.disp.map((d) => tile('monitor', 'Screen ' + d.n + (d.primary ? ' (main)' : ''), 'data-tool="win"', d.w + ' \u00d7 ' + d.h + (d.hz ? ' \u00b7 ' + d.hz + ' Hz' : '') + (d.hdr ? ' \u00b7 HDR' : '') + ' \u00b7 A to change')).join('');
    return head + `<div class="tl">${bt}${nb}${tile('bt', 'Search for devices', 'data-tact="devref"', 'Put the controller or headset in pairing mode first')}${sc}${tile('monitor', 'Main screen only', 'data-dmode="internal"', 'Turns the second screen off')}${tile('monitor', 'Extend to both screens', 'data-dmode="extend"', 'The normal setup')}${tile('monitor', 'Show the same on both', 'data-dmode="clone"')}${tile('monitor', 'Second screen only', 'data-dmode="external"')}</div>`;
  }
  const devAct = (el) => {
    const d = el.dataset;
    if (d.tact === 'devref') { DV.bt = null; paintPane(true); return true; }
    if (d.btd !== undefined) { const x = DV.bt[Number(d.btd)]; if (x && x.id) popMenu(el, x.name, [['bt:rm', 'Remove this device'], ['bt:no', 'Keep it']], { xt: { kind: 'btd', x } }); return true; }
    if (d.btp !== undefined) { const x = DV.bt[Number(d.btp)]; if (x) { note('Pairing with ' + x.name + '...'); api.btAct(x.id, 'pair').then((r) => { note(r && r.ok ? 'Paired with ' + x.name + '.' : 'Could not pair (' + ((r && r.status) || 'no answer') + '). Check it is in pairing mode and try again.'); DV.bt = null; paintPane(true); }); } return true; }
    if (d.dmode) { popMenu(el, 'Change how the screens are used?', [['d:no', 'No, leave it'], ['d:' + d.dmode, 'Yes, change it']], { xt: { kind: 'disp' } }); return true; }
    return false;
  };

  /* ================= Console care: backup, diagnostics, updates ================= */
  const CR = { ver: '', bak: null, diag: null, upd: null, busy: '' };
  const careLoad = () => { api.appVersion().then((v) => { CR.ver = v; }).catch(() => {}); api.bakList().then((l) => { CR.bak = l || []; paintPane(true); }).catch(() => { CR.bak = []; }); api.diagGet().then((d) => { CR.diag = d; paintPane(true); }).catch(() => {}); };
  function carePane() {
    if (!CR.bak && !CR.busy) { CR.busy = 'x'; setTimeout(() => { CR.busy = ''; careLoad(); }, 0); }
    const head = '<h2 class="st-h">Backup &amp; restore</h2>';
    const baks = (CR.bak || []).slice(0, 4).map((b, i) => tile('file', 'Restore ' + b.name.replace(/^console-backup-/, '').replace(/\.zip$/, ''), `data-bak="${i}"`, Math.round(b.size / 1024) + ' KB \u00b7 restarts the console')).join('');
    const u = CR.upd; const updT = u && u.ok ? tile('down', u.version === u.current ? 'Reinstall ' + u.version : 'Install ' + u.version + ' (now ' + u.current + ')', 'data-cact="updgo"', 'From ' + u.zip + ' \u00b7 restarts the console') : '';
    const lines = ((CR.diag && CR.diag.lines) || []).slice(-8).map((l) => '<li>' + E(l.replace(/^\[[^\]]*T(\d\d:\d\d:\d\d)[^\]]*\]/, '$1')) + '</li>').join('');
    return head + `<div class="tl">${tile('info', 'Version ' + (CR.ver || (CR.diag && CR.diag.version) || '...'), 'data-cact="none"', CR.diag && CR.diag.electron ? 'Electron ' + CR.diag.electron : '')}${tile('down', 'Check for an update', 'data-cact="updchk"', 'Looks for a my-console zip in Downloads or Desktop')}${updT}${tile('file', 'Back up my settings now', 'data-cact="bak"', 'Saved in Documents \\ Console backups')}${baks}${tile('gear', 'Reset console settings', 'data-cact="reset"', 'Back to factory look; games stay; a backup is kept')}${tile('file', 'Export diagnostics', 'data-cact="diagx"', 'Saves a file you can send for help')}</div>${CR.upd && !CR.upd.ok ? '<p class="tnote">' + E(CR.upd.error) + '</p>' : ''}${lines ? '<ul class="dlog">' + lines + '</ul>' : ''}`;
  }
  const careAct = (el) => {
    if (el.dataset && el.dataset.cact === 'reset') { popMenu(el, 'Reset all console settings? Your games and files stay. The console restarts.', [['r:no', 'No, keep my settings'], ['r:yes', 'Yes, reset']], { xt: { kind: 'reset' } }); return true; }
    const d = el.dataset;
    if (d.bak !== undefined) { const b = (CR.bak || [])[Number(d.bak)]; if (b) popMenu(el, 'Put back the settings from this backup? The console restarts.', [['c:no', 'No, keep what I have'], ['c:rst:' + b.name, 'Yes, restore it']], { xt: { kind: 'care' } }); return true; }
    const k = d.cact; if (!k) return false;
    if (k === 'none') return true;
    if (k === 'careref') { CR.bak = null; CR.diag = null; paintPane(true); return true; }
    if (k === 'bak') { note('Backing up...'); api.bakMake().then((r) => { note(r && r.ok ? 'Backup saved: ' + r.name : 'Could not make the backup.'); CR.bak = null; paintPane(true); }); return true; }
    if (k === 'brclear') { api.brClear().then((ok) => note(ok ? 'Browser data cleared.' : 'Could not clear it.')); return true; }
    if (k === 'diagx') { api.diagExport().then((p) => note(p ? 'Saved to Documents \\ console-diagnostics.txt' : 'Could not save diagnostics.')); return true; }
    if (k === 'diagl') { api.diagLog(); return true; }
    if (k === 'updchk') { note('Looking for an update...'); api.updCheck().then((r) => { CR.upd = r; note(r && r.ok ? 'Found ' + r.version + ' in ' + r.zip : (r && r.error) || 'No update found.'); paintPane(true); }); return true; }
    if (k === 'updgo') { popMenu(el, 'Install ' + (CR.upd && CR.upd.version) + ' and restart the console?', [['c:no', 'No, not now'], ['c:upd', 'Yes, install it']], { xt: { kind: 'care' } }); return true; }
    return false;
  };

  /* ================= Notes ================= */
  const noteGet = () => lsj('consoleNotes2', []), noteSet = (a) => { try { localStorage.setItem('consoleNotes2', JSON.stringify(a.slice(0, 60))); } catch {} };
  function notesPane() {
    const n = noteGet();
    return `<h2 class="st-h">Notes</h2><div class="tl">${tile('file', 'New note', 'data-tnote="new"', 'Type with the on-screen keyboard')}${n.map((x, i) => tile('file', x.length > 60 ? x.slice(0, 57) + '...' : x, `data-tnote="${i}"`, 'A to edit · X to delete')).join('')}</div>${!n.length ? '<p class="tnote">Nothing yet. Notes stay on this PC.</p>' : ''}`;
  }
  const notesAct = (el) => {
    const k = el.dataset.tnote; if (k === undefined) return false;
    const n = noteGet();
    if (k === 'new') { openOsk('New note', '', { done: 'Save' }).then((t) => { if (t && t.trim()) { n.unshift(t.trim()); noteSet(n); paintPane(true); } }); return true; }
    const i = Number(k); if (n[i] === undefined) return true;
    openOsk('Edit note', n[i], { done: 'Save' }).then((t) => { if (t === null) return; if (!t.trim()) n.splice(i, 1); else n[i] = t.trim(); noteSet(n); paintPane(true); });
    return true;
  };

  /* ================= Unit converter ================= */
  const CVT = { Length: { m: 1, km: 1000, cm: .01, mm: .001, mile: 1609.344, yard: .9144, foot: .3048, inch: .0254 }, Weight: { kg: 1, g: .001, lb: .45359237, oz: .028349523 }, Speed: { 'km/h': 1, mph: 1.609344, 'm/s': 3.6, knot: 1.852 }, Data: { MB: 1, GB: 1024, TB: 1048576, KB: 1 / 1024 }, Temperature: { '°C': 1, '°F': 1, K: 1 } };
  const CV = { cat: 'Length', from: 0, to: 1, v: '1' };
  const cvUnits = () => Object.keys(CVT[CV.cat]);
  const cvCalc = () => {
    const u = cvUnits(), f = u[CV.from % u.length], t = u[CV.to % u.length], x = parseFloat(CV.v); if (!Number.isFinite(x)) return 'Enter a number';
    let r; if (CV.cat === 'Temperature') { const c = f === '°C' ? x : f === '°F' ? (x - 32) * 5 / 9 : x - 273.15; r = t === '°C' ? c : t === '°F' ? c * 9 / 5 + 32 : c + 273.15; } else r = x * CVT[CV.cat][f] / CVT[CV.cat][t];
    return parseFloat(r.toPrecision(8)) + ' ' + t;
  };
  function convPane() {
    const u = cvUnits();
    return `<h2 class="st-h">Unit converter</h2><div class="ckbig"><b>${E(cvCalc())}</b><span>${E(CV.v)} ${E(u[CV.from % u.length])} equals</span></div><div class="tl">${tile('calc', 'Type: ' + CV.cat, 'data-tcv="cat"', 'A to change')}${tile('calc', 'From: ' + u[CV.from % u.length], 'data-tcv="from"', 'A to change')}${tile('calc', 'To: ' + u[CV.to % u.length], 'data-tcv="to"', 'A to change')}${tile('calc', 'Value: ' + CV.v, 'data-tcv="v"', 'A to type a number')}</div>`;
  }
  const convAct = (el) => {
    const k = el.dataset.tcv; if (!k) return false;
    if (k === 'cat') { const c = Object.keys(CVT); CV.cat = c[(c.indexOf(CV.cat) + 1) % c.length]; CV.from = 0; CV.to = 1; }
    else if (k === 'from') CV.from = (CV.from + 1) % cvUnits().length; else if (k === 'to') CV.to = (CV.to + 1) % cvUnits().length;
    else if (k === 'v') { openOsk('Number to convert', CV.v, { done: 'Convert' }).then((t) => { if (t !== null && t.trim()) { CV.v = t.trim(); paintPane(true); } }); return true; }
    paintPane(true); return true;
  };

  /* ================= Controls help ================= */
  const HELP = [['A', 'Select what is highlighted'], ['B', 'Go back (inside a picture, video or song it closes the viewer)'], ['X', 'Options: remove a game, or in Files copy, rename, delete and more'], ['Y', 'Search your library; inside Tools it makes a new folder or refreshes'], ['LB / RB', 'Switch sections or tabs, or previous / next in the viewer'], ['Xbox button', 'The quick menu: Tools, Switch apps, Screenshot, Record screen, Power'], ['Both sticks pressed', 'Mouse mode, for websites and Windows programs'], ['Viewer: left / right', 'Browse pictures, or skip 10 seconds in videos and songs'], ['Viewer: up / down', 'Volume for videos and songs'], ['Music', 'Press B on a song to keep it playing. The top-right bar shows what is on']];
  const helpPane = () => `<h2 class="st-h">Controls help</h2><div class="tl">${HELP.map(([k, v]) => `<button class="st-t" data-nav><span class="st-l"><b class="hk">${E(k)}</b>${E(v)}</span></button>`).join('')}</div>`;

  /* ================= Browser inside the console + Console Search ================= */
  const BS = { url: '', title: '', back: false, fwd: false, loading: false, zoom: 125, shown: false, typing: false };
  const WS = { d: { bookmarks: [], history: [], engine: 'duckduckgo', engines: {} } };
  const isUrl = (q) => /^https?:\/\//i.test(q) || /^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(q) || /^(localhost|127\.0\.0\.1)(:\d+)?/i.test(q);
  window.brOpenMini = (u) => {
    u = String(u || '').trim();
    if (!u) return wsGo();
    return api.brOpen(u).then((r) => { if (r && r.ok) { if (screen !== 'browser') show('browser'); } else note('The browser could not open.'); }).catch(() => note('The browser could not open.'));
  };
  /* The Browser is real Google Chrome, opened full-screen on the console's monitor with the controller as the mouse (Xbox button to come back). If Chrome is not installed, the built-in mini browser opens instead. */
  window.brOpen = (u) => {
    u = String(u || '').trim();
    const url = !u ? 'https://www.google.com/' : /^https?:\/\//i.test(u) ? u : isUrl(u) ? 'https://' + u : 'https://www.google.com/search?q=' + encodeURIComponent(u);
    return api.openWeb(url).then((r) => { if (r && r.chrome) { note('Google Chrome is opening. Both sticks pressed toggles the mouse, Xbox button comes back to the console.'); return; } note('Google Chrome was not found, so the built-in mini browser opened.'); return window.brOpenMini(u); }).catch(() => note('The browser could not open.'));
  };
  const wsLoad = () => Promise.all([api.brData(), api.brHide()]).then(([d]) => { if (d) WS.d = d; if (screen === 'websearch') wsPaint(); }).catch(() => {});
  const wsGo = () => { show('websearch'); return wsLoad(); };
  const wsAsk = (initial) => openOsk('Search the web or type an address', initial || '', { done: 'Go' }).then((t) => { t = t && t.trim(); if (t) return window.brOpenMini(t); });
  const tabsOf = () => (BS.tabs || []);
  const wsTile = (cls, attrs, a, b, c) => `<button class="ws-res ${cls}" data-nav ${attrs}><b>${E(a)}</b>${b ? `<small>${E(b)}</small>` : ''}${c ? `<span>${E(c)}</span>` : ''}</button>`;
  const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
  const wsInner = () => {
    const d = WS.d, eng = (d.engines && d.engines[d.engine]) || 'DuckDuckGo', tabs = tabsOf();
    let h = `<button class="ws-box" data-nav data-ws="box"><span class="ws-ic">${ICON.search || ''}</span><span class="ws-q">Search ${E(eng)} or type an address</span><small>Press A to type</small></button>`;
    h += `<div class="ws-sec">Quick</div><div class="ws-grid">${wsTile('', 'data-ws="newtab"', 'New tab', 'Start a fresh page')}${wsTile('', 'data-ws="engine"', 'Search engine', eng + ' • press A to change')}${wsTile('', 'data-ws="chrome"', 'Open in Chrome', 'For Google sign-in and logins')}${wsTile('', 'data-ws="close"', 'Close browser', 'Back to the console')}</div>`;
    if (tabs.length) h += `<div class="ws-sec">Open tabs</div><div class="ws-grid">${tabs.map((t, i) => wsTile(t.active ? 'on' : '', `data-ws="tab" data-i="${i}"`, t.title.slice(0, 60), hostOf(t.url), t.active ? 'Showing now • X closes' : 'X closes')).join('')}</div>`;
    if (d.bookmarks.length) h += `<div class="ws-sec">Bookmarks</div><div class="ws-grid">${d.bookmarks.map((b, i) => wsTile('', `data-ws="bm" data-i="${i}"`, b.title.slice(0, 60), hostOf(b.url), 'X removes')).join('')}</div>`;
    if (d.history.length) h += `<div class="ws-sec">Recent</div><div class="ws-grid">${d.history.slice(0, 12).map((x, i) => wsTile('', `data-ws="hist" data-i="${i}"`, x.title.slice(0, 60), hostOf(x.url))).join('')}${wsTile('', 'data-ws="clearhist"', 'Clear history', '')}</div>`;
    return h;
  };
  const wsHtml = () => `<div class="ws"><div class="ws-top"><h2 class="st-h">Browser</h2></div><div class="ws-list" id="ws-list">${wsInner()}</div></div>`;
  SCREENS.websearch = { focus: '.ws-box', hints: '', html: wsHtml };
  const wsPaint = () => { const l = document.getElementById('ws-list'); if (!l || screen !== 'websearch') return; const f = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset : {}; const key = f.ws ? `[data-ws="${f.ws}"]${f.i !== undefined ? `[data-i="${f.i}"]` : ''}` : ''; l.innerHTML = wsInner(); const e = (key && l.querySelector(key)) || l.querySelector('.ws-box'); if (e) e.focus({ preventScroll: true }); };
  window.wsRemove = () => { const el = document.activeElement, k = el && el.dataset && el.dataset.ws; if (screen !== 'websearch' || !k) return false; const i = Number(el.dataset.i); if (k === 'tab') { api.brTab('close', i).then(() => setTimeout(() => { if (screen === 'websearch') wsLoad(); }, 120)); return true; } if (k === 'bm') { api.brBm('remove', i).then(() => api.brData()).then((d) => { if (d) WS.d = d; wsPaint(); }); return true; } return false; };
  const wsAct = (el) => {
    const k = el.dataset.ws; if (!k) return false; const i = Number(el.dataset.i);
    if (k === 'box') { wsAsk(''); return true; }
    if (k === 'close') { api.brHide(); show('home'); return true; }
    if (k === 'chrome') { api.openWeb(BS.url || 'https://duckduckgo.com/'); note('Opened in Chrome on the main screen.'); return true; }
    if (k === 'newtab') { api.brTab('new').then(() => wsLoad()).then(() => note('New tab.')); return true; }
    if (k === 'engine') { const ks = Object.keys(WS.d.engines || {}); if (!ks.length) return true; const n = ks[(ks.indexOf(WS.d.engine) + 1) % ks.length]; api.brBm('engine', n).then(() => { WS.d.engine = n; wsPaint(); note('Search engine: ' + WS.d.engines[n]); }); return true; }
    if (k === 'tab') { api.brTab('go', i).then(() => api.brOpen('')).then(() => show('browser')); return true; }
    if (k === 'bm') { const b = WS.d.bookmarks[i]; if (b) window.brOpenMini(b.url); return true; }
    if (k === 'hist') { const b = WS.d.history[i]; if (b) window.brOpenMini(b.url); return true; }
    if (k === 'clearhist') { api.brBm('clearhist').then(() => { WS.d.history = []; wsPaint(); note('History cleared.'); }); return true; }
    return false;
  };
  const brBtn = (k, label, extra) => `<button class="brb${extra ? ' ' + extra : ''}" data-nav data-br="${k}" aria-label="${E(label)}">${label}</button>`;
  const brHtml = () => `<div class="brbar">${brBtn('back', '‹', BS.back ? '' : 'dim')}${brBtn('fwd', '›', BS.fwd ? '' : 'dim')}${brBtn('reload', BS.loading ? '✕' : '↻')}${brBtn('home', '⌂')}${brBtn('star', BS.marked ? '★' : '☆')}${brBtn('ntab', '+')}${brBtn('tabs', 'Tabs ' + ((BS.tabs || []).length || 1))}<button class="bradd" data-nav data-br="addr"><span id="br-t">${E(BS.title || 'New page')}</span><small id="br-u">${E(BS.url || 'Type an address or search')}</small></button>${brBtn('zout', 'A−')}<em id="br-z">${BS.zoom}%</em>${brBtn('zin', 'A+')}${brBtn('close', 'Close')}</div><div class="brhint">${ICON.net || ''}<span>Sticks move the pointer · A click · X right-click · B back · Y page down · LB reload · RB forward · Click a text box for the keyboard · Xbox button for the menu</span></div>`;
  SCREENS.browser = { focus: '.bradd', hints: '', html: brHtml };
  const brPaint = () => { if (screen !== 'browser') return; const $i = (id) => document.getElementById(id); if (!$i('br-t')) return; $i('br-t').textContent = BS.title || 'New page'; $i('br-u').textContent = BS.url || 'Type an address or search'; $i('br-z').textContent = BS.zoom + '%'; const q = (k) => document.querySelector('[data-br="' + k + '"]'); if (q('back')) q('back').classList.toggle('dim', !BS.back); if (q('fwd')) q('fwd').classList.toggle('dim', !BS.fwd); if (q('reload')) q('reload').textContent = BS.loading ? '✕' : '↻'; if (q('star')) q('star').textContent = BS.marked ? '★' : '☆'; if (q('tabs')) q('tabs').textContent = 'Tabs ' + ((BS.tabs || []).length || 1); };
  if (api.onBrState) api.onBrState((st) => { Object.assign(BS, st); window.__brOn = !!st.shown; if (screen === 'browser' && !st.shown && !BS.typing && !window.__acctBusy) show('home'); else brPaint(); });
  if (api.onBrNote) api.onBrNote((t) => note(t));
  /* safety: the page snapshot behind the keyboard never outlives the keyboard */
  setInterval(() => { try { const e = document.getElementById('brshot'); if (!e) return; if (!e.__t) e.__t = Date.now(); if (!osk && Date.now() - e.__t > 900) e.remove(); } catch {} }, 300);
  /* a text box was clicked inside a web page: the console's own keyboard opens, the text goes into the box */
  if (api.onBrText) api.onBrText((info) => {
    BS.typing = true;
    let bgEl = null; try { if (info.shot && info.bb) { bgEl = document.createElement('div'); bgEl.id = 'brshot'; bgEl.style.cssText = 'position:fixed;z-index:125;pointer-events:none;background:#000 url(' + info.shot + ') 0 0/100% 100% no-repeat;left:' + info.bb.x + 'px;top:' + info.bb.y + 'px;width:' + info.bb.width + 'px;height:' + info.bb.height + 'px'; document.body.appendChild(bgEl); } } catch {}
    let fld = null;
    try { if (bgEl && info.r && info.r.w > 0) { const R = info.r, z = info.z || 1; fld = document.createElement('div'); fld.style.cssText = 'position:absolute;box-sizing:border-box;overflow:hidden;white-space:pre;display:flex;align-items:center;left:' + (R.x * z) + 'px;top:' + (R.y * z) + 'px;width:' + (R.w * z) + 'px;height:' + (R.h * z) + 'px;background:' + (R.bg && !/rgba\(0, 0, 0, 0\)/.test(R.bg) ? R.bg : '#fff') + ';color:' + (R.fg || '#000') + ';font:' + (parseFloat(R.fs) * z) + 'px ' + (R.ff || 'sans-serif') + ';padding-left:' + (parseFloat(R.pl || 0) * z) + 'px;outline:2px solid #9bf04a'; bgEl.appendChild(fld); } } catch {}
    window.__oskLive = (txt) => { if (fld) fld.textContent = info.pw ? '\u2022'.repeat(txt.length) : txt; };
    window.__oskLive(info.pw ? '' : (info.v || ''));
    window.__brShotOff = () => { window.__oskLive = null; try { if (bgEl) bgEl.remove(); } catch {} bgEl = null; };
    const label = info.pw ? 'Password' : (info.p || (info.s ? 'Search' : 'Type here'));
    openOsk(label, info.pw ? '' : info.v, { done: info.s ? 'Search' : 'Done' }).then((t) => { BS.typing = false; setTimeout(() => window.__brShotOff && window.__brShotOff(), 500); if (t === null || t === undefined) return api.brResume().then(() => { if (screen !== 'browser') show('browser'); }); return api.brText(t, info.s).then(() => { if (screen !== 'browser') show('browser'); }); }).catch(() => { BS.typing = false; api.brResume(); });
  });
  const brAct = (el) => {
    const k = el.dataset.br; if (!k) return false;
    if (k === 'close') { api.brHide(); return true; }
    if (k === 'star') { api.brBm('toggle').then((on) => note(on ? 'Bookmarked.' : 'Bookmark removed.')); return true; }
    if (k === 'ntab') { api.brTab('new').then(() => { BS.typing = true; return api.brHide(); }).then(() => { BS.typing = false; return wsGo(); }); return true; }
    if (k === 'tabs' || k === 'home') { BS.typing = true; api.brHide().then(() => { BS.typing = false; wsGo(); }); return true; }
    if (k === 'home') { BS.typing = true; api.brHide().then(() => { BS.typing = false; show('websearch'); }); return true; }
    if (k === 'addr') { BS.typing = true; api.brHide().then(() => openOsk('Web address or search', BS.url || '', { done: 'Go' })).then((t) => { BS.typing = false; t = t && t.trim(); if (t) return window.brOpen(t); return api.brOpen('').then(() => { if (screen !== 'browser') show('browser'); }); }); return true; }
    api.brNav(k).then((ok) => { if (!ok && k === 'back') note('Nothing to go back to.'); });
    return true;
  };
  /* ================= v832: Storage, Family, Accessibility, Game hubs ================= */
  const fmtDur = (sec) => { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60); return h ? h + 'h ' + m + 'm' : m ? m + ' min' : sec + ' s'; };
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const ST = { list: null, busy: false, drives: [] };
  const stgLoad = () => { if (ST.busy) return; ST.busy = true; Promise.all([api.fsPlaces().catch(() => []), api.storeSizes().catch(() => [])]).then(([pl, li]) => { ST.drives = (pl || []).filter((p) => p.kind === 'drive'); ST.list = li || []; ST.busy = false; if (screen === 'tools' && tcat === 'storage') paintPane(true); }); };
  const storagePane = () => {
    if (!ST.list && !ST.busy) stgLoad();
    const list = ST.list || [], total = list.reduce((a, g) => a + g.bytes, 0), big = list.length ? list[0].bytes || 1 : 1;
    const drives = ST.drives.map((d) => { const m = /([\d.]+) GB free of ([\d.]+) GB/.exec(d.space || ''); if (!m || !(Number(m[2]) > 0)) return ''; const free = Number(m[1]), all = Number(m[2]), used = Math.max(0, Math.min(100, Math.round((all - free) / all * 100))); return `<div class="stg-d"><b>${E(d.name)}</b><span>${E(d.space)}</span><i class="stg-b"><i data-w="${used}"></i></i></div>`; }).join('');
    const info = ST.busy ? 'Measuring your games... this can take a minute' : list.length ? fmtSize(total) + ' used by ' + list.length + ' installed games' : 'No installed games found';
    return `<h2 class="st-h">Storage</h2><div class="tl"><div class="stg-dr">${drives}</div><p class="stg-i">${E(info)}</p>${list.map((g, i) => `<button class="st-t stg-g" data-nav data-tact="stg:${i}">${ICON.library || ''}<span class="st-l">${E(g.title)}<small>${fmtSize(g.bytes)}${g.partial ? '+' : ''}${g.note ? ' · ' + E(g.note) : ''}</small><i class="stg-b"><i data-w="${Math.max(2, Math.round(g.bytes / big * 100))}"></i></i></span></button>`).join('')}${list.length ? tile('view', 'Measure again', 'data-tact="stg:again"', 'Sizes are saved for 10 minutes') : ''}</div>`;
  };
  const FM = { d: null, busy: false };
  const famLoad = () => { if (FM.busy) return; FM.busy = true; api.famGet().then((r) => { FM.d = r; FM.busy = false; if (screen === 'tools' && tcat === 'family') paintPane(true); }).catch(() => { FM.busy = false; }); };
  const LIMITS = [0, 30, 60, 90, 120, 180, 240];
  const familyPane = () => {
    if (!FM.d && !FM.busy) famLoad();
    const d = FM.d || { days: [], limit: 0, playing: '' }, today = d.days.length ? d.days[d.days.length - 1].sec : 0, week = d.days.reduce((a, x) => a + x.sec, 0);
    return `<h2 class="st-h">Family & screen time</h2><div class="tl">${tile('clock', 'Played today', 'data-nav', fmtDur(today) + (d.playing ? ' · playing ' + d.playing : ''))}${tile('clock', 'Daily limit', 'data-tact="fam:lim"', (d.limit ? fmtDur(d.limit * 60) + ' · reminder 5 minutes before' : 'Off') + ' · A changes')}${tile('info', 'This week', 'data-nav', fmtDur(week) + ' in 7 days')}${d.days.slice().reverse().map((x) => tile('clock', (x.d === d.days[d.days.length - 1].d ? 'Today' : DOW[x.dow]) + ', ' + x.d.slice(5), 'data-nav', x.sec ? fmtDur(x.sec) : 'No play')).join('')}${tile('info', 'How it works', 'data-nav', 'Counts games started from the console. At the limit you get a Windows notification; no game is closed.')}</div>`;
  };
  const AC = (() => { try { return JSON.parse(localStorage.getItem('cn-access') || '{}'); } catch { return {}; } })();
  const FILT = [['', 'Off'], ['grayscale(1)', 'Grayscale'], ['invert(1) hue-rotate(180deg)', 'Inverted'], ['sepia(.5) saturate(1.3)', 'Warm'], ['hue-rotate(-20deg) saturate(1.4)', 'Color boost']];
  const acApply = () => {
    const b = document.body; b.classList.toggle('a-hc', !!AC.hc); b.classList.toggle('a-still', !!AC.still); const sc = document.getElementById('screen'); if (sc) sc.classList.toggle('a-big', !!AC.big);
    const f = [AC.hc ? 'contrast(1.2)' : '', FILT[AC.f || 0][0]].filter(Boolean).join(' '); b.style.filter = f;
    try { localStorage.setItem('cn-access', JSON.stringify(AC)); } catch {}
  };
  const acSpeak = (t) => { try { if (!AC.speak || !window.speechSynthesis) return; t = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 180); if (!t) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.rate = 1; speechSynthesis.speak(u); } catch {} };
  document.addEventListener('focusin', (e) => { if (AC.speak && e.target && e.target.matches && e.target.matches('[data-nav]')) acSpeak(e.target.getAttribute('aria-label') || e.target.innerText); }, true);
  setTimeout(acApply, 400);
  const accessPane = () => `<h2 class="st-h">Ease of access</h2><div class="tl">${tile('view', 'High contrast', 'data-tact="ac:hc"', AC.hc ? 'On: stronger contrast and focus outline' : 'Off')}${tile('view', 'Larger text', 'data-tact="ac:big"', AC.big ? 'On' : 'Off')}${tile('view', 'Color filter', 'data-tact="ac:f"', FILT[AC.f || 0][1] + ' · A changes')}${tile('view', 'Reduce motion', 'data-tact="ac:still"', AC.still ? 'On: animations are almost instant' : 'Off')}${tile('vol', 'Read aloud', 'data-tact="ac:speak"', AC.speak ? 'On: reads what is highlighted' : 'Off')}${tile('gear', 'Turn all off', 'data-tact="ac:off"', 'Back to normal')}</div>`;
  const HB = { sel: null };
  const hubList = () => (games || []).filter((g) => g.installed !== false).sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
  const hubsPane = () => {
    const l = hubList();
    if (HB.sel !== null && l[HB.sel]) {
      const g = l[HB.sel];
      return `<h2 class="st-h">${E(g.title)}</h2><div class="tl">${tile('play', 'Play', 'data-tact="hub:play"', 'Start the game')}${tile('clock', 'Time played', 'data-nav', g.playSeconds ? fmtDur(g.playSeconds) : 'Not tracked yet')}${tile('clock', 'Last played', 'data-nav', g.lastPlayed ? new Date(g.lastPlayed).toLocaleDateString() : 'Never')}${tile('library', 'Source', 'data-nav', g.source || (g.steamId ? 'Steam' : 'This PC'))}${tile('folder', 'Open install folder', 'data-tact="hub:folder"', '')}${tile('info', 'Back to all games', 'data-tact="hub:back"', '')}</div>`;
    }
    return `<h2 class="st-h">Game hubs</h2><div class="tl">${l.map((g, i) => tile('library', g.title, 'data-tact="hub:' + i + '"', (g.playSeconds ? fmtDur(g.playSeconds) + ' played' : 'Not played yet') + (g.lastPlayed ? ' · ' + new Date(g.lastPlayed).toLocaleDateString() : ''))).join('') || tile('info', 'No installed games yet', 'data-nav', '')}</div>`;
  };
  const v832Act = (el) => {
    const t = el.dataset.tact; if (!t) return false;
    if (t.startsWith('ac:')) { const k = t.slice(3); if (k === 'off') { for (const x of Object.keys(AC)) delete AC[x]; } else if (k === 'f') AC.f = ((AC.f || 0) + 1) % FILT.length; else { AC[k] = !AC[k]; if (k === 'speak' && AC.speak) acSpeak('Read aloud is on'); } acApply(); paintPane(true); return true; }
    if (t === 'fam:lim') { const d = FM.d || { limit: 0 }; const n = LIMITS[(Math.max(0, LIMITS.indexOf(d.limit)) + 1) % LIMITS.length]; api.famLimit(n).then(() => { famLoad(); note(n ? 'Daily limit: ' + fmtDur(n * 60) : 'Daily limit off'); }); return true; }
    if (t === 'stg:again') { ST.list = null; stgLoad(); paintPane(true); return true; }
    if (t.startsWith('stg:')) { const g = (ST.list || [])[Number(t.slice(4))]; if (g) popMenu(el, g.title + ' (' + fmtSize(g.bytes) + ')', [['s:folder', 'Open folder'], ['s:unins', 'Uninstall...'], ['s:no', 'Cancel']], { xt: { kind: 'stg', g } }); return true; }
    if (t === 'hub:back') { HB.sel = null; paintPane(false); return true; }
    if (t === 'hub:play') { const g = hubList()[HB.sel]; if (g) openGame(g.id); return true; }
    if (t === 'hub:folder') { const g = hubList()[HB.sel]; if (g) api.gameAction(g.id, 'folder').then((r) => { if (!r || !r.ok) note('No folder known for this game.'); }); return true; }
    if (t.startsWith('hub:')) { HB.sel = Number(t.slice(4)); paintPane(false); setTimeout(() => { const f = document.querySelector('.st-r [data-nav]'); if (f) f.focus({ preventScroll: true }); }, 60); return true; }
    return false;
  };
  /* ================= v833: console passcode (lock screen) ================= */
  const PINK = 'cn-pin', PINS = 'cn-pinstart';
  const lget = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  const lset = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch {} };
  const hashPin = async (p) => { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cn:' + p)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); };
  let locked = false;
  const lockInert = (on) => { for (const e of document.body.children) { if (e.id === 'lockscr' || e.id === 'osk' || e.tagName === 'SCRIPT') continue; try { e.inert = on; } catch {} } };
  window.lockNow = () => {
    if (!lget(PINK)) { note('Set a passcode first: Tools, Security.'); return; }
    if (locked) return; locked = true;
    const d = document.createElement('div'); d.id = 'lockscr';
    d.innerHTML = `<div class="lk"><div class="lk-i">${ICON.power || ''}</div><h1>Console locked</h1><p>Enter your passcode to continue</p><button class="lk-b" data-nav data-lock="enter">Enter passcode</button></div>`;
    document.body.appendChild(d); lockInert(true); try { d.querySelector('.lk-b').focus(); } catch {}
  };
  const unlockTry = async () => {
    const t = await openOsk('Passcode', '', { done: 'Unlock' }); if (t === null || t === undefined) return;
    if ((await hashPin(t)) === lget(PINK)) { locked = false; lockInert(false); const d = document.getElementById('lockscr'); if (d) d.remove(); try { const f = document.querySelector('.xn, .xbig, .xq, .bigtile, [data-nav]'); if (f) f.focus({ preventScroll: true }); } catch {} }
    else { note('Wrong passcode.'); const b = document.querySelector('#lockscr .lk-b'); if (b) { b.focus(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); } }
  };
  const setPin = async () => {
    if (lget(PINK)) { const o = await openOsk('Current passcode', '', { done: 'Next' }); if (o === null || (await hashPin(o)) !== lget(PINK)) { note(o === null ? 'Cancelled.' : 'Wrong passcode.'); return; } }
    const a = await openOsk('New passcode (4 or more characters)', '', { done: 'Next' }); if (!a) return; if (a.length < 4) { note('Use at least 4 characters.'); return; }
    const b = await openOsk('Type it again', '', { done: 'Save' }); if (b === null) return; if (b !== a) { note('They did not match.'); return; }
    lset(PINK, await hashPin(a)); note('Passcode saved.'); paintPane(true);
  };
  const securityPane = () => `<h2 class="st-h">Security</h2><div class="tl">${tile('power', 'Lock console now', 'data-tact="sec:lock"', lget(PINK) ? 'Needs your passcode to open again' : 'Set a passcode first')}${tile('gear', lget(PINK) ? 'Change passcode' : 'Set a passcode', 'data-tact="sec:set"', lget(PINK) ? 'Passcode is on' : 'Off')}${tile('gear', 'Lock when the console starts', 'data-tact="sec:start"', lget(PINS) ? 'On' : 'Off')}${lget(PINK) ? tile('gear', 'Remove passcode', 'data-tact="sec:rm"', 'Asks for the passcode first') : ''}${tile('info', 'Good to know', 'data-nav', 'This keeps people out of the console screen. It does not lock Windows or stop someone using the PC directly.')}</div>`;
  const secAct = (el) => {
    const t = el.dataset.tact, l = el.dataset.lock;
    if (l === 'enter') { unlockTry(); return true; }
    if (!t || !t.startsWith('sec:')) return false;
    if (t === 'sec:lock') { window.lockNow(); return true; }
    if (t === 'sec:set') { setPin(); return true; }
    if (t === 'sec:start') { if (!lget(PINK)) { note('Set a passcode first.'); return true; } lset(PINS, lget(PINS) ? '' : '1'); paintPane(true); return true; }
    if (t === 'sec:rm') { openOsk('Current passcode', '', { done: 'Remove' }).then(async (o) => { if (o === null) return; if ((await hashPin(o)) === lget(PINK)) { lset(PINK, ''); lset(PINS, ''); note('Passcode removed.'); paintPane(true); } else note('Wrong passcode.'); }); return true; }
    return false;
  };
  if (lget(PINK) && lget(PINS)) setTimeout(() => window.lockNow(), 50);
  /* ================= v834: Get apps (winget) and Wi-Fi ================= */
  const FEAT = [['Google Chrome', 'Google.Chrome'], ['Discord', 'Discord.Discord'], ['Spotify', 'Spotify.Spotify'], ['VLC media player', 'VideoLAN.VLC'], ['OBS Studio', 'OBSProject.OBSStudio'], ['Steam', 'Valve.Steam'], ['Epic Games Launcher', 'EpicGames.EpicGamesLauncher'], ['GOG Galaxy', 'GOG.Galaxy']];
  const GA = { res: null, inst: null, busy: '', msg: '' };
  const gaPane = () => `<h2 class="st-h">Get apps</h2><div class="tl">${tile('search', 'Search for an app', 'data-tact="ga:search"', 'Type a name, installs from the Windows Package Manager')}${tile('library', 'Installed apps', 'data-tact="ga:list"', 'See and remove programs')}${GA.busy ? tile('info', GA.busy, 'data-nav', 'Please wait, this can take a few minutes') : ''}${GA.msg ? tile('info', GA.msg, 'data-nav', '') : ''}${(GA.res ? GA.res.map((x, i) => tile('bag', x.name, 'data-tact="ga:r:' + i + '"', x.id + (x.ver ? ' · ' + x.ver : ''))) : []).join('')}${(GA.inst ? GA.inst.map((x, i) => tile('library', x.name, 'data-tact="ga:i:' + i + '"', 'Installed · A to remove')) : []).join('')}${GA.res || GA.inst ? '' : FEAT.map(([n, id], i) => tile('bag', n, 'data-tact="ga:f:' + i + '"', 'Popular · A to install')).join('')}</div>`;
  const gaRun = (p, busyText, okText) => { if (GA.busy) { note('Wait for the current job to finish.'); return; } GA.busy = busyText; GA.msg = ''; paintPane(true); p.then((r) => { GA.busy = ''; GA.msg = r && r.ok ? okText : ((r && r.error) || 'It did not finish.'); if (screen === 'tools' && tcat === 'getapps') paintPane(true); note(GA.msg); }).catch(() => { GA.busy = ''; GA.msg = 'It did not finish.'; paintPane(true); }); };
  const gaAct = (el) => {
    const t = el.dataset.tact; if (!t || !t.startsWith('ga:')) return false; const [, k, i] = t.split(':');
    if (k === 'search') { openOsk('Search for an app', '', { done: 'Search' }).then((q) => { if (!q || !q.trim()) return; GA.busy = 'Searching...'; GA.inst = null; paintPane(true); api.wgSearch(q.trim()).then((r) => { GA.busy = ''; if (r && r.ok) { GA.res = r.items; GA.msg = r.items.length ? '' : 'Nothing found for ' + q; } else GA.msg = (r && r.error) || 'Search failed.'; paintPane(true); }); }); return true; }
    if (k === 'list') { GA.busy = 'Reading installed apps...'; GA.res = null; paintPane(true); api.wgList().then((r) => { GA.busy = ''; GA.inst = r && r.items ? r.items : []; GA.msg = GA.inst.length ? '' : 'Could not read the list.'; paintPane(true); }); return true; }
    const x = k === 'f' ? { name: FEAT[i][0], id: FEAT[i][1] } : k === 'r' ? (GA.res || [])[i] : (GA.inst || [])[i]; if (!x) return true;
    if (k === 'i') popMenu(el, 'Remove ' + x.name + '?', [['ga:no', 'No, keep it'], ['ga:rm', 'Yes, remove it']], { xt: { kind: 'ga', x } });
    else popMenu(el, 'Install ' + x.name + '?', [['ga:no', 'Cancel'], ['ga:in', 'Install']], { xt: { kind: 'ga', x } });
    return true;
  };
  const WF = { d: null, busy: false, st: null, T: null };
  const wfLoad = () => { if (WF.busy) return; WF.busy = true; api.netStatus().then((s) => { WF.st = s; }).catch(() => {}); api.wifiList().then((r) => { WF.d = r; WF.busy = false; if (screen === 'tools' && tcat === 'wifi') paintPane(true); }).catch(() => { WF.busy = false; }); };
  const wfRd = () => { if (screen === 'tools' && tcat === 'wifi') paintPane(true); };
  const wfTest = async () => {
    const T = WF.T = { phase: 'ping' }; wfRd();
    const r1 = await api.netTest('ping'); if (r1 && r1.ok) { T.ping = r1.ping; T.jitter = r1.jitter; } T.phase = 'down'; wfRd();
    const r2 = await api.netTest('down'); if (r2 && r2.ok) T.down = r2.down; T.phase = 'up'; wfRd();
    const r3 = await api.netTest('up'); if (r3 && r3.ok) T.up = r3.up; T.phase = 'done'; T.fail = !(T.down || T.up || T.ping); wfRd();
  };
  const wifiPane = () => {
    if (!WF.d && !WF.busy) wfLoad(); const d = WF.d, s = WF.st, T = WF.T;
    const conn = s && s.kind === 'lan' ? tile('net', 'Connected by LAN cable', 'data-nav', (s.name || 'Ethernet') + (s.speed ? ' \u00b7 ' + s.speed : '') + (s.both ? ' \u00b7 Wi-Fi is also on' : ''))
      : s && s.kind === 'wifi' ? tile('net', 'Connected by Wi-Fi' + (s.ssid ? ': ' + s.ssid : ''), 'data-nav', s.speed ? 'Link speed ' + s.speed : '')
      : tile('net', d && d.current ? 'Connected to ' + d.current : (WF.busy ? 'Looking for networks...' : 'Not connected'), 'data-nav', '');
    const ph = { ping: 'Testing response time...', down: 'Testing download...', up: 'Testing upload...' };
    const sub = !T ? 'Download, upload and ping' : T.phase !== 'done' ? ph[T.phase] : T.fail ? 'The test could not finish.' : (T.down != null ? T.down + ' Mbps down' : 'Download failed') + ' \u00b7 ' + (T.up != null ? T.up + ' Mbps up' : 'Upload failed') + ' \u00b7 ' + (T.ping != null ? T.ping + ' ms ping' : 'Ping failed');
    return `<h2 class="st-h">Network</h2><div class="tl">${conn}${tile('net', T && T.phase === 'done' ? 'Test again' : 'Test internet speed', 'data-tact="wf:speed"', sub)}${T && T.phase === 'done' && !T.fail ? tile('info', 'Jitter ' + (T.jitter != null ? T.jitter : '?') + ' ms', 'data-nav', 'Lower is steadier for online games') : ''}${tile('view', 'Scan Wi-Fi again', 'data-tact="wf:again"', '')}${d && d.nets ? d.nets.map((n, i) => tile('net', n.ssid, 'data-tact="wf:' + i + '"', (n.sig ? n.sig + '% signal \u00b7 ' : '') + (n.open ? 'Open' : 'Needs password'))).join('') : ''}${d && d.ok === false && !(d.nets || []).length ? tile('info', 'No Wi-Fi adapter found', 'data-nav', 'A wired connection does not need this page') : ''}</div>`;
  };
  const wfAct = (el) => {
    const t = el.dataset.tact; if (!t || !t.startsWith('wf:')) return false; const k = t.slice(3);
    if (k === 'again') { WF.d = null; WF.st = null; wfLoad(); paintPane(true); return true; }
    if (k === 'speed') { if (!WF.T || WF.T.phase === 'done') wfTest(); return true; }
    const n = ((WF.d && WF.d.nets) || [])[Number(k)]; if (!n) return true;
    const go = (pw) => { note('Connecting to ' + n.ssid + '...'); api.wifiConnect(n.ssid, pw).then((r) => { note(r && r.ok ? 'Asked Windows to join ' + n.ssid + '.' : (r && r.error) || 'Could not connect.'); setTimeout(() => { WF.d = null; wfLoad(); }, 4500); }); };
    if (n.open) go(''); else openOsk('Password for ' + n.ssid, '', { done: 'Connect' }).then((pw) => { if (pw !== null && pw !== undefined) go(pw); });
    return true;
  };
  /* ================= v835: Cleanup, Updates, Achievements, Wishlist, Collections, Notification history ================= */
  const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
  const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  /* notification history: every message shown in the hint bar is kept */
  const NH = jget('cn-nh', []);
  { const n0 = window.note; if (typeof n0 === 'function') window.note = function (t) { try { if (t) { NH.unshift({ t: String(t).slice(0, 120), at: Date.now() }); if (NH.length > 40) NH.length = 40; jset('cn-nh', NH); } } catch {} return n0.apply(this, arguments); }; }
  const nhPane = () => `<h2 class="st-h">Notification history</h2><div class="tl">${tile('gear', 'Clear history', 'data-tact="nh:clear"', NH.length + ' saved')}${NH.map((x) => tile('bell', x.t, 'data-nav', new Date(x.at).toLocaleString())).join('') || tile('info', 'Nothing yet', 'data-nav', 'Messages from the console show up here')}</div>`;
  const CLN = { sc: null, busy: false, msg: '' };
  const cleanPane = () => { if (!CLN.sc && !CLN.busy) { CLN.busy = true; api.cleanScan().then((r) => { CLN.sc = r; CLN.busy = false; if (screen === 'tools' && tcat === 'clean') paintPane(true); }); }
    return `<h2 class="st-h">Clean up</h2><div class="tl">${tile('hdd', 'Old temporary files', 'data-nav', CLN.busy ? 'Measuring...' : CLN.sc && CLN.sc.ok ? fmtSize(CLN.sc.bytes) + ' in ' + CLN.sc.files + ' files older than a day' : 'Could not measure')}${tile('hdd', 'Clean up now', 'data-tact="cl:run"', 'Deletes only old temp files, never your documents')}${tile('trash', 'Empty Recycle Bin', 'data-tact="cl:bin"', 'Cannot be undone')}${CLN.msg ? tile('info', CLN.msg, 'data-nav', '') : ''}</div>`; };
  const UP = { d: null, busy: false };
  const updPane = () => `<h2 class="st-h">Updates</h2><div class="tl">${tile('down', 'Check for updates', 'data-tact="up:check"', UP.busy ? 'Checking... this can take a minute' : UP.d ? (UP.d.ok ? (UP.d.items.length ? UP.d.items.length + ' waiting' : 'Windows is up to date') : 'Could not check') : 'Press A')}${tile('down', 'Open Windows Update', 'data-tact="up:go"', 'Download and install')}${UP.d && UP.d.ok ? UP.d.items.map((x) => tile('info', x, 'data-nav', 'Update')).join('') : ''}</div>`;
  /* achievements: local, earned by playing on this console */
  const MIL = [['First steps', 'Play any game', 10, (c) => c.played >= 1], ['Regular', 'Play 5 different games', 20, (c) => c.played >= 5], ['Collector', 'Have 25 games installed', 25, (c) => c.inst >= 25], ['Big library', 'Have 100 games', 50, (c) => c.total >= 100], ['Warm up', '1 hour played in total', 10, (c) => c.sec >= 3600], ['Dedicated', '10 hours in total', 30, (c) => c.sec >= 36000], ['Veteran', '100 hours in total', 100, (c) => c.sec >= 360000], ['Marathon', 'Play 3 hours in one day', 40, (c) => c.best >= 10800], ['Streak', 'Play on 5 days of the last 7', 30, (c) => c.days >= 5], ['Night owl', 'Play a game after midnight', 15, (c) => c.owl], ['Wishful', 'Add 3 games to your wishlist', 10, () => jget('cn-wish', []).length >= 3], ['Organized', 'Make a collection', 10, () => Object.keys(jget('cn-coll', {})).length >= 1]];
  const AS = { fam: null };
  const achCtx = () => { const g = games || [], pl = g.filter((x) => x.playSeconds > 0), d = (AS.fam && AS.fam.days) || []; return { played: pl.length, inst: g.filter((x) => x.installed !== false).length, total: g.length, sec: g.reduce((a, x) => a + (x.playSeconds || 0), 0), best: Math.max(0, ...d.map((x) => x.sec)), days: d.filter((x) => x.sec > 0).length, owl: g.some((x) => { if (!x.lastPlayed) return false; const h = new Date(x.lastPlayed).getHours(); return h >= 0 && h < 5; }) }; };
  const achPane = () => {
    if (!AS.fam) api.famGet().then((r) => { AS.fam = r || { days: [] }; if (screen === 'tools' && tcat === 'ach2') paintPane(true); }).catch(() => { AS.fam = { days: [] }; });
    const c = achCtx(), got = MIL.filter((m) => { try { return m[3](c); } catch { return false; } }), score = got.reduce((a, m) => a + m[2], 0) + Math.floor(c.sec / 600), lvl = 1 + Math.floor(Math.sqrt(score / 25));
    const top = (games || []).filter((x) => x.playSeconds > 0).sort((a, b) => b.playSeconds - a.playSeconds).slice(0, 8);
    return `<h2 class="st-h">Gamerscore</h2><div class="tl">${tile('star', score + ' G · Level ' + lvl, 'data-nav', got.length + ' of ' + MIL.length + ' achievements · earned on this console')}${MIL.map((m) => { const ok = (() => { try { return m[3](c); } catch { return false; } })(); return tile(ok ? 'star' : 'info', (ok ? '✓ ' : '') + m[0], 'data-nav', m[1] + ' · ' + m[2] + ' G'); }).join('')}${top.length ? tile('library', 'Most played', 'data-nav', 'Your top games by time') : ''}${top.map((x, i) => tile('library', (i + 1) + '. ' + x.title, 'data-nav', fmtDur(x.playSeconds))).join('')}</div>`;
  };
  /* wishlist */
  const wishPane = () => { const w = jget('cn-wish', []); return `<h2 class="st-h">Wishlist</h2><div class="tl">${tile('star', 'Add a game', 'data-tact="ws:add"', 'Type a name')}${w.map((x, i) => tile('star', x, 'data-tact="ws:' + i + '"', 'A to remove')).join('') || tile('info', 'Your wishlist is empty', 'data-nav', 'Add games you want to get')}</div>`; };
  /* collections */
  const CO = { sel: null, pick: false };
  const collPane = () => {
    const c = jget('cn-coll', {}), names = Object.keys(c);
    if (CO.sel && c[CO.sel]) {
      const ids = c[CO.sel], list = ids.map((id) => (games || []).find((g) => String(g.id) === String(id))).filter(Boolean);
      if (CO.pick) { const rest = (games || []).filter((g) => g.installed !== false && !ids.includes(String(g.id))); return `<h2 class="st-h">Add to ${E(CO.sel)}</h2><div class="tl">${tile('info', 'Done adding', 'data-tact="co:done"', '')}${rest.map((g) => tile('library', g.title, 'data-tact="co:add:' + String(g.id).replace(/"/g, '') + '"', 'A adds it')).join('')}</div>`; }
      return `<h2 class="st-h">${E(CO.sel)}</h2><div class="tl">${tile('library', 'Add games', 'data-tact="co:pick"', '')}${list.map((g, i) => tile('play', g.title, 'data-tact="co:play:' + i + '"', 'A plays · X removes')).join('')}${tile('gear', 'Delete this collection', 'data-tact="co:del"', '')}${tile('info', 'Back', 'data-tact="co:back"', '')}</div>`;
    }
    return `<h2 class="st-h">Collections</h2><div class="tl">${tile('library', 'New collection', 'data-tact="co:new"', 'Group games your way')}${names.map((n, i) => tile('library', n, 'data-tact="co:open:' + i + '"', c[n].length + ' games')).join('')}</div>`;
  };
  const jsAct = (el) => {
    const t = el.dataset.tact; if (!t) return false;
    if (t === 'nh:clear') { NH.length = 0; jset('cn-nh', NH); paintPane(true); return true; }
    if (t === 'cl:run') { CLN.msg = 'Cleaning...'; paintPane(true); api.cleanRun().then((r) => { CLN.msg = r && r.ok ? 'Freed ' + fmtSize(r.bytes) + ' (' + r.files + ' files).' : 'Could not clean.'; CLN.sc = null; if (screen === 'tools' && tcat === 'clean') paintPane(true); note(CLN.msg); }); return true; }
    if (t === 'cl:bin') { popMenu(el, 'Empty the Recycle Bin? This cannot be undone.', [['b:no', 'No, keep it'], ['b:yes', 'Yes, empty it']], { xt: { kind: 'bin' } }); return true; }
    if (t === 'up:check') { UP.busy = true; UP.d = null; paintPane(true); api.wuCheck().then((r) => { UP.busy = false; UP.d = r; if (screen === 'tools' && tcat === 'upd') paintPane(true); }); return true; }
    if (t === 'up:go') { api.wuStart().then(() => note('Windows Update is opening.')); return true; }
    if (t === 'ws:add') { openOsk('Game to wish for', '', { done: 'Add' }).then((q) => { if (q && q.trim()) { const w = jget('cn-wish', []); w.push(q.trim().slice(0, 60)); jset('cn-wish', w); paintPane(true); } }); return true; }
    if (t.startsWith('ws:')) { const w = jget('cn-wish', []); w.splice(Number(t.slice(3)), 1); jset('cn-wish', w); paintPane(true); note('Removed from wishlist.'); return true; }
    if (t.startsWith('co:')) {
      const c = jget('cn-coll', {}), [, k, v] = t.split(':');
      if (k === 'new') { openOsk('Collection name', '', { done: 'Create' }).then((n) => { n = n && n.trim().slice(0, 30); if (!n) return; if (!c[n]) c[n] = []; jset('cn-coll', c); CO.sel = n; CO.pick = false; paintPane(false); }); return true; }
      if (k === 'open') { CO.sel = Object.keys(c)[Number(v)]; CO.pick = false; paintPane(false); return true; }
      if (k === 'back') { CO.sel = null; paintPane(false); return true; }
      if (k === 'pick') { CO.pick = true; paintPane(false); return true; }
      if (k === 'done') { CO.pick = false; paintPane(false); return true; }
      if (k === 'del') { delete c[CO.sel]; jset('cn-coll', c); CO.sel = null; paintPane(false); note('Collection deleted.'); return true; }
      if (k === 'add') { const id = t.slice(7); if (c[CO.sel] && !c[CO.sel].includes(id)) { c[CO.sel].push(id); jset('cn-coll', c); paintPane(true); note('Added.'); } return true; }
      if (k === 'play') { const g = c[CO.sel].map((id) => (games || []).find((x) => String(x.id) === String(id))).filter(Boolean)[Number(v)]; if (g) openGame(g.id); return true; }
    }
    return false;
  };
  window.coRemove = () => { const el = document.activeElement, t = el && el.dataset && el.dataset.tact; if (screen !== 'tools' || tcat !== 'coll' || !CO.sel || !t || !t.startsWith('co:play:')) return false; const c = jget('cn-coll', {}), g = c[CO.sel].map((id) => (games || []).find((x) => String(x.id) === String(id))).filter(Boolean)[Number(t.slice(8))]; if (g) { c[CO.sel] = c[CO.sel].filter((id) => String(id) !== String(g.id)); jset('cn-coll', c); paintPane(true); note('Removed from the collection.'); } return true; };
  /* ================= Overview ================= */
  const homePane = () => {
    const mpt = mpTiles().split('</button>')[0] ? mpTiles().split('</button>')[0] + '</button>' : '';
    const sec = (title, inner) => `<h3 class="st-sec">${title}</h3>${inner}`;
    return `<h2 class="st-h">Tools</h2><div class="tl">`
      + sec('Quick', tile('search', 'Search', 'data-tcatgo="search"', 'Games, apps, settings') + mpt + tile('view', 'Next wallpaper', 'data-tact="wp"', 'Changes the whole look') + tile('sun', 'Weather', 'data-tact="wx"') + tile('vol', 'Volume & Wi-Fi', 'data-tact="quick"'))
      + sec('Capture', tile('cam', 'Take screenshot', 'data-tact="shot"') + tile('film', REC ? 'Stop recording' : 'Record screen', 'data-tact="rec"', 'Saved in Captures') + tile('view', 'Captures', 'data-tact="caps"', 'Your screenshots') + tile('image', 'Pictures & videos', 'data-tcatgo="media"', 'Photos, videos, music'))
      + sec('Apps & storage', tile('monitor', 'Switch apps', 'data-tcatgo="apps"', 'Switch or close what is open') + tile('bag', 'Get apps', 'data-tcatgo="getapps"', 'Install and remove programs') + tile('drive', 'Storage', 'data-tcatgo="storage"', 'Drives and game sizes'))
      + sec('Connect', tile('net', 'Network', 'data-tcatgo="wifi"', 'LAN, Wi-Fi and speed test') + tile('bt', 'Devices & screens', 'data-tcatgo="dev"', 'Bluetooth, screen modes') + tile('gear', 'Display & sound', 'data-tcatgo="win"', 'Sound, display, power mode'))
      + sec('System', tile('down', 'Updates', 'data-tcatgo="upd"', 'Windows and console') + tile('gear', 'Backup & restore', 'data-tcatgo="care"', 'Backup, restore, reset') + tile('power', 'Security & lock', 'data-tcatgo="security"', 'Passcode and lock screen') + tile('view', 'Ease of access', 'data-tcatgo="access"', 'Contrast, text size, read aloud') + tile('info', 'System info', 'data-tact="sys"') + tile('bell', 'Notifications', 'data-tact="notifs"'))
      + sec('Help', tile('info', 'Controls help', 'data-tcatgo="help"', 'Every button, explained'))
      + `</div>`;
  };

  const homeAct = (el) => {
    const d = el.dataset;
    if (d.tcatgo) { toolsCat(d.tcatgo); setTimeout(() => { const f = document.querySelector('.st-r [data-nav]'); if (f) f.focus({ preventScroll: true }); }, 60); return true; }
    if (d.tact === 'speed') { PF.speed = 'Testing...'; paintPane(true); api.netSpeed().then((r) => { PF.speed = r && r.ok ? r.down + ' Mbps download \u00b7 ' + (r.ping || '?') + ' ms response' : 'The test could not finish.'; if (screen === 'tools' && tcat === 'perf') paintPane(true); }); return true; }
    if (d.tact === 'browser') { brOpen(''); return true; }
    if (d.tact === 'mini') { brOpenMini(''); return true; }
    if (d.tact === 'web') { openOsk('Web address or search', '', { done: 'Open' }).then((q) => { if (q && q.trim()) brOpen(q.trim()); }); return true; }
    if (d.tact === 'coin') { note('Coin flip: ' + (Math.random() < .5 ? 'Heads' : 'Tails')); return true; }
    if (d.tact === 'dice') { const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6); note('Dice: ' + a + ' and ' + b + ' = ' + (a + b)); return true; }
    if (d.tact === 'rand') { const ok = (games || []).filter((g) => g.installed !== false); if (!ok.length) { note('No installed games found.'); return true; } openGame(ok[Math.floor(Math.random() * ok.length)].id); return true; }
    if (d.tact === 'wp') { change({ theme: nextTheme(settings.theme, 1) }).then(() => note('Wallpaper: ' + themeName(settings.theme))); return true; }
    if (d.tact === 'rec') { recToggle(); setTimeout(() => paintPane(true), 400); return true; }
    if (d.tact === 'shot') { takeShot(); return true; }
    if (d.tact === 'caps') { capsOpen(true); return true; }
    if (d.tact === 'notifs') { notifsOpen(true); return true; }
    if (d.tact === 'wx') { weatherOpen(true); return true; }
    if (d.tact === 'quick') { quickOpen(true); return true; }
    if (d.tact === 'sys') { sysInfoOpen(true); return true; }
    return false;
  };

  /* ================= the Tools screen: the same layout as Settings ================= */
  /* ================= Minecraft mods (Modrinth) ================= */
  const MRT = { mod: 'Mods', modpack: 'Modpacks', resourcepack: 'Resource packs', shader: 'Shaders' }, MRS = { relevance: 'Best match', downloads: 'Most downloaded', follows: 'Most followed', updated: 'Recently updated' }, MRL = { '': 'Any', fabric: 'Fabric', forge: 'Forge', neoforge: 'NeoForge', quilt: 'Quilt' };
  const MR = Object.assign({ type: 'mod', ver: '', loader: 'fabric', sort: 'downloads', q: '', target: '' }, (() => { try { return JSON.parse(localStorage.getItem('cn-mr') || '{}'); } catch { return {}; } })(), { hits: null, busy: '', targets: null, detected: [], vers: [], list: null, view: 'browse', msg: '' });
  const mrSave = () => { try { localStorage.setItem('cn-mr', JSON.stringify({ type: MR.type, ver: MR.ver, loader: MR.loader, sort: MR.sort, q: MR.q, target: MR.target })); } catch {} };
  const mrNum = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n || 0);
  const mrRd = () => { if (screen === 'tools' && tcat === 'mc') paintPane(true); };
  const mrTname = () => { const t = (MR.targets || []).find((x) => x.id === MR.target); return t ? t.name : ''; };
  const mrSearch = () => { MR.busy = 'Searching Modrinth...'; MR.hits = null; mrRd(); api.mrSearch({ q: MR.q, type: MR.type, ver: MR.ver, loader: MR.loader, sort: MR.sort }).then((r) => { MR.busy = ''; MR.hits = r && r.ok ? r.hits : []; MR.msg = r && r.ok ? (r.hits.length ? '' : 'Nothing found. Try another word, or set the version to Any.') : 'Could not reach Modrinth. Check your internet connection.'; mrRd(); }).catch(() => { MR.busy = ''; MR.hits = []; MR.msg = 'Could not reach Modrinth.'; mrRd(); }); };
  const mcPane = () => {
    if (!MR.targets) { MR.targets = []; api.mrTargets().then((r) => { MR.targets = r.targets || []; MR.detected = r.detected || []; if (!MR.target || !MR.targets.some((t) => t.id === MR.target)) MR.target = MR.targets[0] ? MR.targets[0].id : ''; const d = MR.detected[0]; if (d && !MR.ver) { MR.ver = d.ver; if (d.loader) MR.loader = d.loader; } mrSave(); mrRd(); if (!MR.hits && !MR.busy) mrSearch(); }).catch(() => {}); }
    else if (!MR.hits && !MR.busy && MR.view === 'browse') mrSearch();
    if (MR.view === 'installed') {
      if (!MR.list) { MR.list = []; api.mrList(MR.target).then((l) => { MR.list = l || []; MR.listed = true; mrRd(); }); }
      const L = MR.list || [];
      return `<h2 class="st-h">Installed in ${E(mrTname() || 'Minecraft')}</h2><div class="tl">${tile('library', 'Back to browsing', 'data-tact="mr:view:browse"', '')}${L.map((f, i) => tile('bag', f.name.replace(/\.(jar|zip)$/i, ''), `data-tact="mr:rm:${i}"`, MRT[f.type] + ' · ' + Math.max(1, Math.round(f.size / 1024)) + ' KB · A to remove')).join('')}${MR.listed && !L.length ? '<p class="tnote">Nothing installed yet.</p>' : ''}</div>`;
    }
    const top = tile('search', 'Search Modrinth', 'data-tact="mr:q"', MR.q ? '“' + MR.q + '”' : 'Type a name or topic')
      + tile('library', 'Showing', 'data-tact="mr:type"', MRT[MR.type] + ' · ' + MRS[MR.sort])
      + tile('sliders', 'Minecraft version', 'data-tact="mr:ver"', (MR.ver || 'Any') + (MR.type === 'mod' || MR.type === 'modpack' ? ' · ' + MRL[MR.loader] : ''))
      + tile('drive', 'Install to', 'data-tact="mr:target"', mrTname() || 'No Minecraft folder found')
      + tile('library', 'Installed here', 'data-tact="mr:view:installed"', 'See and remove what you added')
      + tile('pad', 'Open Minecraft launcher', 'data-tact="mr:launch"', 'Modrinth App or the Minecraft Launcher');
    const res = MR.busy ? `<p class="tnote"><i class="spin"></i>${E(MR.busy)}</p>` : (MR.hits || []).map((h, i) => tile('bag', h.title, `data-tact="mr:p:${i}"`, h.author + ' · ' + mrNum(h.downloads) + ' downloads · ' + (h.desc || '').slice(0, 60))).join('');
    return `<h2 class="st-h">Minecraft mods</h2><div class="tl">${top}${res}</div>${MR.msg ? `<p class="tnote">${E(MR.msg)}</p>` : ''}`;
  };
  const mrAct = (el) => {
    const t = el.dataset.tact; if (!t || !t.startsWith('mr:')) return false; const [, k, a] = t.split(':');
    if (k === 'q') { openOsk('Search Modrinth', MR.q, { done: 'Search' }).then((q) => { if (q === null || q === undefined) return; MR.q = q.trim(); mrSave(); mrSearch(); }); return true; }
    if (k === 'type') { popMenu(el, 'Show', [...Object.entries(MRT).map(([v, l]) => ['t:' + v, (MR.type === v ? '✓  ' : '') + l]), ...Object.entries(MRS).map(([v, l]) => ['s:' + v, (MR.sort === v ? '✓  ' : '') + 'Sort: ' + l])], { xt: { kind: 'mr' } }); return true; }
    if (k === 'ver') {
      const go = (vs) => popMenu(el, 'Minecraft version', [...MR.detected.filter((d) => d.ver).slice(0, 4).map((d, i) => ['d:' + i, 'Installed: ' + d.name]), ['v:', (MR.ver ? '' : '✓  ') + 'Any version'], ...vs.slice(0, 14).map((v) => ['v:' + v, (MR.ver === v ? '✓  ' : '') + v]), ...Object.entries(MRL).filter(([v]) => v).map(([v, l]) => ['l:' + v, (MR.loader === v ? '✓  ' : '') + 'Loader: ' + l])], { xt: { kind: 'mr' } });
      if (MR.vers.length) go(MR.vers); else api.mrVersions().then((v) => { MR.vers = v && v.length ? v : ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5']; go(MR.vers); });
      return true;
    }
    if (k === 'target') { if (!(MR.targets || []).length) { note('No Minecraft folder was found. Start the Minecraft Launcher or Modrinth App once, then come back.'); return true; } popMenu(el, 'Install to', MR.targets.map((x, i) => ['f:' + i, (x.id === MR.target ? '✓  ' : '') + x.name]), { xt: { kind: 'mr' } }); return true; }
    if (k === 'view') { MR.view = a; MR.list = null; MR.listed = false; paintPane(); return true; }
    if (k === 'launch') { api.mcLauncher().then((r) => note(r && r.ok ? r.name + ' is opening.' : 'Neither the Modrinth App nor the Minecraft Launcher was found.')); return true; }
    if (k === 'p') { const h = (MR.hits || [])[Number(a)]; if (!h) return true; popMenu(el, h.title, [['i', h.type === 'modpack' ? 'Modpacks need the Modrinth App' : 'Install to ' + (mrTname() || 'Minecraft')], ['c', 'Cancel']], { xt: { kind: 'mr', h } }); return true; }
    if (k === 'rm') { const f = (MR.list || [])[Number(a)]; if (f) popMenu(el, 'Remove ' + f.name.replace(/\.(jar|zip)$/i, '') + '?', [['rm', 'Move to Recycle Bin'], ['c', 'Keep it']], { xt: { kind: 'mr', f } }); return true; }
    return true;
  };
  const mrMenu = (a, st) => {
    const [k, v] = [a.split(':')[0], a.slice(a.indexOf(':') + 1)];
    if (k === 't') { MR.type = v; mrSave(); mrSearch(); return; }
    if (k === 's') { MR.sort = v; mrSave(); mrSearch(); return; }
    if (k === 'd') { const d = MR.detected.filter((x) => x.ver)[Number(v)]; if (d) { MR.ver = d.ver; if (d.loader) MR.loader = d.loader; mrSave(); mrSearch(); } return; }
    if (k === 'v') { MR.ver = v; mrSave(); mrSearch(); return; }
    if (k === 'l') { MR.loader = v; mrSave(); mrSearch(); return; }
    if (k === 'f') { const x = MR.targets[Number(v)]; if (x) { MR.target = x.id; MR.list = null; mrSave(); mrRd(); } return; }
    if (a === 'i' && st.h) { const h = st.h; if (h.type === 'modpack') { note('Modpacks are easiest in the Modrinth App. Open it from here.'); return; } if (MR.busy) return; MR.busy = 'Installing ' + h.title + '...'; mrRd(); api.mrInstall(h.id, h.type, MR.ver, MR.loader, MR.target).then((r) => { MR.busy = ''; MR.msg = r && r.ok ? 'Installed: ' + r.files.join(', ') : (r && r.error) || 'Install failed.'; note(r && r.ok ? h.title + ' installed.' : 'Could not install.'); mrRd(); }); return; }
    if (a === 'rm' && st.f) { api.mrRemove(MR.target, st.f.sub, st.f.name).then((ok) => { note(ok ? 'Removed.' : 'Could not remove it.'); MR.list = null; mrRd(); }); }
  };
  const PANES = { mc: mcPane, notes: notesPane, conv: convPane, help: helpPane, dev: devPane, care: carePane, home: homePane, search: searchPane, apps: appsPane, files: filesPane, media: mediaPane, perf: perfPane, clock: clockPane, calc: calcPane, cal: calPane, win: winPane, storage: storagePane, family: familyPane, hubs: hubsPane, access: accessPane, security: securityPane, getapps: gaPane, clean: cleanPane, upd: updPane, ach2: achPane, wish: wishPane, coll: collPane, nh: nhPane, wifi: wifiPane };
  const toolsHtml = () => `<div class="st"><div class="st-s"><div class="st-top">${ICON.tools}<b>Tools</b></div>${TCATS.map(([k, l]) => (TGROUP[k] ? `<div class="st-gh">${TGROUP[k]}</div>` : '') + `<button class="st-c${k === tcat ? ' cur' : ''}" data-nav data-tcat="${k}">${l}</button>`).join('')}</div><div class="st-r" id="tpane">${(PANES[tcat] || homePane)()}</div></div>`;
  SCREENS.tools = { focus: '.st-c.cur', hints: 'A: Select    B: Back    LB / RB: Section', html: toolsHtml };
  const paintRail = () => { document.querySelectorAll('.st-c[data-tcat]').forEach((c) => c.classList.toggle('cur', c.dataset.tcat === tcat)); };
  function paintPane(keepFocus) {
    const p = document.getElementById('tpane'); if (!p || screen !== 'tools') return;
    const f = document.activeElement, fi = f && p.contains(f) ? [...p.querySelectorAll('[data-nav]')].indexOf(f) : -1, sc = p.querySelector('.tl'), st = sc ? sc.scrollTop : 0;
    p.innerHTML = (PANES[tcat] || homePane)();
    try { applyDynamic(false); } catch {}
    if (keepFocus && fi >= 0) { const all = [...p.querySelectorAll('[data-nav]')], t = all[Math.min(fi, all.length - 1)]; if (t) t.focus({ preventScroll: true }); const sc2 = p.querySelector('.tl'); if (sc2) sc2.scrollTop = st; }
    if (tcat === 'perf' && !PF.timer) perfTick();
  }
  function toolsCat(k) {
    if (!PANES[k] || (k === tcat && document.getElementById('tpane').innerHTML)) return;
    tcat = k; paintRail(); paintPane(false);
    try { animateIn('#tpane .st-t, #tpane .st-h'); } catch {}
  }
  window.toolsTab = (dir) => { const i = TCATS.findIndex((c) => c[0] === tcat), n = TCATS[(i + dir + TCATS.length) % TCATS.length][0]; const b = document.querySelector(`.st-c[data-tcat="${n}"]`); if (b) { toolsCat(n); b.focus({ preventScroll: true }); } };
  window.toolsBack = () => {
    if (screen !== 'tools') return false;
    if (tcat === 'files' && FS.path) { filesLoad((FS.data && FS.data.parent) || ''); return true; }
    const onRail = document.activeElement && document.activeElement.closest && document.activeElement.closest('.st-s');
    if (onRail) { show('home'); return true; }   // B on the section list leaves the Tools
    const c = document.querySelector('.st-c.cur'); if (c) c.focus({ preventScroll: true }); return true;   // B inside a page goes back to the section list
  };
  document.addEventListener('focusin', (e) => { const c = e.target.closest && e.target.closest('.st-c'); if (c && c.dataset.tcat && screen === 'tools') toolsCat(c.dataset.tcat); });
  window.toolsOpen = (k) => { if (k && PANES[k]) tcat = k; show('tools'); };

  /* ================= the viewer: pictures, videos and music inside the console ================= */
  let V = null, vOsdT = 0, vSlideT = 0;
  const vEl = () => document.getElementById('viewer');
  async function openViewer(list, i) {
    if (!list || !list.length) return;
    V = { list, i, slide: false };
    let el = vEl();
    if (!el) { el = document.createElement('div'); el.id = 'viewer'; el.innerHTML = '<div class="vw-stage"></div><div class="vw-top"><b class="vw-t"></b><span class="vw-n"></span></div><div class="vw-osd"></div><div class="vw-bot"><i class="vw-pr"><u></u></i><span class="vw-h"></span></div>'; document.body.appendChild(el); }
    el.hidden = false; document.body.classList.add('viewing'); void el.offsetWidth; el.classList.add('on');
    try { SND.play('open'); } catch {}
    await vShow();
  }
  async function vShow() {
    if (!V) return;
    const it = V.list[V.i], el = vEl(), st = el.querySelector('.vw-stage'), tok = ++vShow.n;
    const url = it.kind === 'text' ? 'text' : await api.fsMedia(it.path).catch(() => ''); if (!V || tok !== vShow.n) return;
    if (!url) { note('Could not open ' + it.name + '.'); if (V.list.length > 1) return vStep(1); return vClose(); }
    clearTimeout(vSlideT); st.replaceChildren(); el.dataset.kind = it.kind;
    el.querySelector('.vw-t').textContent = it.name.replace(/\.[^.]+$/, ''); el.querySelector('.vw-n').textContent = (V.i + 1) + ' of ' + V.list.length;
    el.querySelector('.vw-pr u').style.width = '0%';
    el.querySelector('.vw-h').textContent = it.kind === 'text' ? 'Up / Down: scroll     LB / RB: previous / next     B: close' : it.kind === 'audio' ? 'Left / Right: skip 10 s     Up / Down: volume     LB / RB: previous / next     A: play / pause     B: keep playing in the background' : it.kind === 'image' ? 'Left / Right: browse     A: slideshow     B: close' : 'Left / Right: skip 10 s     Up / Down: volume     LB / RB: previous / next     A: play / pause     B: close';
    try { SND.hush((it.kind !== 'image' && it.kind !== 'text') || !!MP); } catch {}
    if (it.kind === 'text') {
      const pre = document.createElement('pre'); pre.className = 'vw-txt'; pre.textContent = 'Loading...'; st.appendChild(pre); V.txt = pre;
      api.fsText(it.path).then((r) => { if (!V || V.list[V.i] !== it) return; pre.textContent = r ? r.text + (r.cut ? '\n\n... the rest of this file is not shown' : '') : 'This file could not be read.'; }).catch(() => { pre.textContent = 'This file could not be read.'; });
    } else if (it.kind === 'image') {
      const im = document.createElement('img'); im.alt = ''; im.draggable = false; im.decoding = 'async'; im.src = url; st.appendChild(im);
      im.addEventListener('error', () => { note('This picture could not be shown.'); });
      if (V.slide) vSlideT = setTimeout(() => vStep(1), 5000);
    } else {
      if (it.kind === 'audio') mpStop(true); const m = it.kind === 'video' ? document.createElement('video') : new Audio(); m.src = url; m.autoplay = true; m.controls = false; m.volume = V.vol == null ? 0.8 : V.vol; V.m = m;
      if (it.kind === 'audio') { const card = document.createElement('div'); card.className = 'vw-aud'; card.innerHTML = `${ICON.music}<b></b><span></span>`; card.querySelector('b').textContent = it.name.replace(/\.[^.]+$/, ''); card.querySelector('span').textContent = 'Music'; st.appendChild(card); }
      else st.appendChild(m);
      m.addEventListener('timeupdate', () => { if (m.duration > 0) el.querySelector('.vw-pr u').style.width = (100 * m.currentTime / m.duration).toFixed(1) + '%'; });
      m.addEventListener('ended', () => { if (V && V.m === m) { if (V.list.length > 1) vStep(1); else vOsd('Finished'); } });
      m.addEventListener('error', () => { if (!V || V.m !== m) return; note('The console cannot play this file, so Windows will open it.'); const p = it.path; vClose(); api.fsOpen(p).catch(() => {}); });
      m.play().catch(() => {});
    }
  }
  vShow.n = 0; window.xtraOpenViewer = openViewer; window.xtraViewerMove = (d) => vMove(d);
  function vStep(d) { if (!V || V.list.length < 2) return vOsd(V && V.list.length < 2 ? 'This is the only one' : ''); V.i = (V.i + d + V.list.length) % V.list.length; vShow(); }
  function vOsd(t) { const o = vEl() && vEl().querySelector('.vw-osd'); if (!o) return; o.textContent = t; o.classList.add('on'); clearTimeout(vOsdT); vOsdT = setTimeout(() => o.classList.remove('on'), 1400); }
  function vClose() {
    if (!V) return; clearTimeout(vSlideT);
    try { if (V.m && V.list[V.i].kind === 'audio' && !V.m.paused) { mpAdopt(V); } else if (V.m) { V.m.pause(); V.m.removeAttribute('src'); V.m.load(); } } catch {}
    V = null; const el = vEl(); if (el) { el.classList.remove('on'); el.querySelector('.vw-stage').replaceChildren(); setTimeout(() => { if (!V) el.hidden = true; }, 350); }
    document.body.classList.remove('viewing'); try { SND.hush(!!MP); SND.play('back'); } catch {}
  }
  const vMove = (dir) => {
    const it = V.list[V.i];
    if (it.kind === 'text') { if (V.txt && (dir === 'up' || dir === 'down')) V.txt.scrollBy({ top: dir === 'down' ? 260 : -260 }); else if (dir === 'left') vStep(-1); else if (dir === 'right') vStep(1); return; }
    if (it.kind === 'image') { if (dir === 'left') vStep(-1); else if (dir === 'right') vStep(1); return; }
    const m = V.m; if (!m) return;
    if (dir === 'left' || dir === 'right') { m.currentTime = Math.max(0, Math.min(m.duration || 1e9, m.currentTime + (dir === 'right' ? 10 : -10))); vOsd((dir === 'right' ? '+10' : '−10') + ' s   ' + fmtT(m.currentTime)); }
    else { V.vol = Math.max(0, Math.min(1, Math.round((m.volume + (dir === 'up' ? .1 : -.1)) * 10) / 10)); m.volume = V.vol; vOsd('Volume ' + Math.round(V.vol * 100) + '%'); }
  };
  const vAct = () => {
    const it = V.list[V.i];
    if (it.kind === 'text') return;
    if (it.kind === 'image') { V.slide = !V.slide; clearTimeout(vSlideT); if (V.slide) vSlideT = setTimeout(() => vStep(1), 1500); vOsd(V.slide ? 'Slideshow on' : 'Slideshow off'); return; }
    const m = V.m; if (!m) return; if (m.paused) { m.play().catch(() => {}); vOsd('Play'); } else { m.pause(); vOsd('Paused'); }
  };
  { const move0 = window.move, act0 = window.activate, back0 = window.back, tab0 = window.tab;   // while the viewer is open it owns the controller and keyboard
    window.move = function (d) { if (V) return vMove(d); return move0.apply(this, arguments); };
    window.activate = function (el) { if (V) return vAct(); return act0.apply(this, arguments); };
    window.back = function () { if (V) return vClose(); return back0.apply(this, arguments); };
    window.tab = function (d) { if (V) return vStep(d); return tab0.apply(this, arguments); }; }

  /* ================= clicks ================= */
  const act1 = window.xtraAct;
  window.xtraAct = (el) => {
    const d = el.dataset;
    if (d.tool && window.toolsOpen) { window.toolsOpen(d.tool); return true; }
    if (d.br && brAct(el)) return true;
    if (d.ws && wsAct(el)) return true;
    if (d.tcat) { toolsCat(d.tcat); const t = document.querySelector('.st-r [data-nav]'); if (t) t.focus({ preventScroll: true }); return true; }
    if (screen === 'tools') { if (notesAct(el) || convAct(el) || bedAct(el) || devAct(el) || careAct(el) || mpAct(el) || ssAct(el) || searchAct(el) || appsAct(el) || filesAct(el) || mediaAct(el) || clockAct(el) || calcAct(el) || calAct(el) || winAct(el) || v832Act(el) || secAct(el) || gaAct(el) || wfAct(el) || jsAct(el) || mrAct(el) || homeAct(el)) return true; }
    if (el.dataset && el.dataset.lock === 'enter') { secAct(el); return true; }
    return act1 ? act1(el) : false;
  };
  { const xb0 = window.xtraBack; window.xtraBack = () => { if (screen === 'browser') { api.brHide(); return true; } if (screen === 'websearch') { show('home'); return true; } return xb0 ? xb0() : false; }; }
  window.toolsPerfStop = () => { clearTimeout(PF.timer); PF.timer = 0; };
})();

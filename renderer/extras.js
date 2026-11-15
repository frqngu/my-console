/* v813: Captures gallery, System info, screensaver. Shares app.js's globals (SCREENS, settings, show, note, change ...). */
(() => {
  const api = window.consoleApi, esc2 = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  ICON.cam = ico('<rect x="3" y="7" width="18" height="12" rx="2.5"/><circle cx="12" cy="13" r="3.2"/><path d="M8.5 7l1.2-2h4.6l1.2 2"/>');
  ICON.info = ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".6"/>');
  ICON.moon = ico('<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>');
  const gb = (n) => { const g = n / 1073741824; return (g >= 100 ? Math.round(g) : g.toFixed(1)) + ' GB'; };
  // ---------------- Captures ----------------
  let caps = [], capView = -1, delArm = 0;
  window.capsOpen = async () => { try { caps = await api.capList(); } catch { caps = []; } capView = -1; show('caps'); };
  window.takeShot = async () => { let r = null; try { r = await api.capShot(); } catch {} try { if (r && r.ok) SND.play('select'); } catch {} note(r && r.ok ? 'Screenshot saved to Captures.' : 'Could not take a screenshot.'); if (r && r.ok && screen === 'caps') capsOpen(); return r; };
  const when = (t) => { const d = new Date(t); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + '  ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); };
  SCREENS.caps = {
    focus: '.capt, .capb',
    hints: 'A: Select    B: Back',
    html: () => {
      if (capView >= 0 && caps[capView]) {
        const c = caps[capView];
        return `<div class="cappg v"><div class="capvw">${c.video ? `<video src="${c.url}" controls autoplay></video>` : `<img src="${c.url}" alt="" draggable="false">`}</div>
          <div class="capbar"><button class="xt capb" data-nav data-capx="close">Back</button>${capView > 0 ? '<button class="xt capb" data-nav data-capx="prev">Previous</button>' : ''}${capView < caps.length - 1 ? '<button class="xt capb" data-nav data-capx="next">Next</button>' : ''}<button class="xt capb del" data-nav data-capx="del">Delete</button><span class="capmeta">${esc2(when(caps[capView].t))} · ${capView + 1} of ${caps.length}</span></div></div>`;
      }
      const tiles = caps.map((c, i) => `<button class="xt capt" data-nav data-cap="${i}">${c.video ? '<i class="capvid">▶</i>' : `<img src="${c.url}" alt="" loading="lazy" draggable="false">`}<span>${esc2(when(c.t))}</span></button>`).join('');
      return `<div class="cappg"><h1>Captures</h1><p class="apsub">${caps.length ? caps.length + ' capture' + (caps.length === 1 ? '' : 's') + ' · saved in Videos \\ Console captures' : 'Nothing here yet. Open the Xbox menu and choose Screenshot to take one.'}</p>
        <div class="capgrid">${tiles}</div><div class="capact"><button class="xt capb" data-nav data-capx="shot">Take screenshot</button><button class="xt capb" data-nav data-capx="folder">Open folder</button></div></div>`;
    },
  };
  // ---------------- System info ----------------
  let sys = null;
  window.sysInfoOpen = () => { sys = null; show('sysinfo'); };
  SCREENS.sysinfo = {
    focus: '.sysb', hints: 'B: Back',
    html: () => {
      if (!sys) { api.sysInfo().then((d) => { sys = d || { drives: [], net: [] }; if (screen === 'sysinfo') show('sysinfo'); }).catch(() => { sys = { drives: [], net: [] }; if (screen === 'sysinfo') show('sysinfo'); }); return '<div class="syspg"><h1>System info</h1><p class="apsub"><i class="spin"></i>Reading your PC...</p><button class="xt sysb" data-nav data-capx="sysback">Back</button></div>'; }
      const up = Math.floor(sys.up / 60), ut = up >= 1440 ? Math.floor(up / 1440) + ' d ' + Math.floor(up % 1440 / 60) + ' h' : up >= 60 ? Math.floor(up / 60) + ' h ' + (up % 60) + ' min' : up + ' min';
      const bar = (u, t) => `<i class="sysbar"><u data-w="${Math.max(2, Math.min(100, Math.round(u / t * 100)))}"></u></i>`;
      const row = (k, v, x) => `<div class="sysr"><b>${esc2(k)}</b><span>${v}</span>${x || ''}</div>`;
      const ramU = sys.ram - sys.ramFree;
      return `<div class="syspg"><h1>System info</h1><p class="apsub">${esc2(sys.host)}</p><div class="sysg">
        ${row('Processor', esc2(sys.cpu || 'Unknown') + ' · ' + sys.cores + ' threads')}${row('Memory', gb(ramU) + ' used of ' + gb(sys.ram), bar(ramU, sys.ram))}
        ${(sys.drives || []).map((d) => row('Drive ' + d.name, gb(d.total - d.free) + ' used of ' + gb(d.total) + ' · ' + gb(d.free) + ' free', bar(d.total - d.free, d.total))).join('')}
        ${row('Network', (sys.net || []).length ? sys.net.map((n) => esc2(n.name) + ' ' + esc2(n.ip)).join('<br>') : 'Not connected')}${row('Windows', esc2(sys.os))}${row('Time since restart', ut)}</div>
        <button class="xt sysb" data-nav data-capx="sysback">Back</button></div>`;
    },
  };
  // ---------------- clicks ----------------
  window.xtraAct = (el) => {
    const d = el.dataset;
    if (d.cap !== undefined) { capView = Number(d.cap); show('caps', 0); return true; }
    if (d.capx) {
      const k = d.capx;
      if (k === 'close') { capView = -1; show('caps', 0); }
      else if (k === 'prev') { capView = Math.max(0, capView - 1); show('caps', 0); }
      else if (k === 'next') { capView = Math.min(caps.length - 1, capView + 1); show('caps', 0); }
      else if (k === 'del') {
        if (Date.now() - delArm < 3000) { delArm = 0; const c = caps[capView]; api.capDel(c.name).then(() => { caps.splice(capView, 1); capView = -1; show('caps', 0); note('Deleted (moved to the Recycle Bin).'); }); }
        else { delArm = Date.now(); el.textContent = 'Press again to delete'; }
      }
      else if (k === 'shot') takeShot();
      else if (k === 'folder') api.capOpen();
      else if (k === 'sysback') show('settings');
      return true;
    }
    if (d.act === 'sysinfo') { sysInfoOpen(); return true; }
    if (d.act === 'capsopen') { capsOpen(); return true; }
    if (d.act === 'saver') { const L = [0, 3, 5, 10, 20, 30], i = L.indexOf(settings.saver == null ? 10 : settings.saver); change({ saver: L[(i + 1) % L.length] }); return true; }
    return false;
  };
  window.xtraBack = () => {
    if (screen === 'caps') { if (capView >= 0) { capView = -1; show('caps', 0); } else show('home'); return true; }
    if (screen === 'sysinfo') { show('settings'); return true; }
    return false;
  };

  // ================= v814: notifications, weather, quick settings =================
  ICON.bell = ico('<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/>');
  ICON.sun = ico('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>');
  ICON.vol = ico('<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>');
  ICON.wifi = ico('<path d="M3 9a14 14 0 0 1 18 0M6 12.5a9.5 9.5 0 0 1 12 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r=".8"/>');
  // ---- notification history: everything the hint bar says is kept here ----
  const LK = 'consoleNotes', DK = 'consoleDnd';
  let notes = [], dnd = false, unread = 0;
  try { notes = JSON.parse(localStorage.getItem(LK) || '[]').filter((n) => n && typeof n.t === 'string').slice(0, 60); dnd = localStorage.getItem(DK) === '1'; } catch {}
  const saveNotes = () => { try { localStorage.setItem(LK, JSON.stringify(notes.slice(0, 60))); } catch {} };
  const note0 = window.note;
  window.note = function (t) { try { if (typeof t === 'string' && t.trim()) { notes.unshift({ t: t.slice(0, 200), at: Date.now() }); notes = notes.slice(0, 60); unread++; saveNotes(); } } catch {} if (!dnd) return note0(t); };
  SCREENS.notifs = {
    focus: '.ntb', hints: 'A: Select    B: Back',
    html: () => `<div class="cappg"><h1>Notifications</h1><p class="apsub">${notes.length ? notes.length + ' recent' : 'Nothing yet. Messages like "Screenshot saved" will show up here.'}${dnd ? ' · Do not disturb is on' : ''}</p>
      <div class="ntl">${notes.map((n) => `<div class="nti"><span>${esc2(n.t)}</span><i>${esc2(when(n.at))}</i></div>`).join('')}</div>
      <div class="capact"><button class="xt capb ntb" data-nav data-capx="dnd">${dnd ? 'Turn off Do not disturb' : 'Do not disturb'}</button><button class="xt capb ntb" data-nav data-capx="nclear">Clear all</button></div></div>`,
  };
  window.notifsOpen = () => { unread = 0; show('notifs'); };
  // ---- weather ----
  let wx = null, wxBusy = false;
  const WC = (c) => c === 0 ? 'Clear' : c <= 2 ? 'Partly cloudy' : c === 3 ? 'Overcast' : c <= 48 ? 'Fog' : c <= 57 ? 'Drizzle' : c <= 67 ? 'Rain' : c <= 77 ? 'Snow' : c <= 82 ? 'Showers' : c <= 86 ? 'Snow showers' : 'Thunderstorms';
  const loadWx = (force) => { if (wxBusy) return; wxBusy = true; api.wxGet(force).then((d) => { wx = d || { ok: false, error: 'No answer.' }; }).catch(() => { wx = { ok: false, error: 'No answer.' }; }).finally(() => { wxBusy = false; if (screen === 'weather') show('weather', 0); }); };
  window.weatherOpen = () => { wx = null; show('weather'); loadWx(false); };
  SCREENS.weather = {
    focus: '.wxb', hints: 'A: Select    B: Back',
    html: () => {
      const back = '<div class="capact"><button class="xt capb wxb" data-nav data-capx="wxref">Refresh</button><button class="xt capb wxb" data-nav data-capx="home">Back</button></div>';
      if (!wx) return `<div class="cappg"><h1>Weather</h1><p class="apsub"><i class="spin"></i>Checking the forecast...</p>${back}</div>`;
      if (!wx.ok) return `<div class="cappg"><h1>Weather</h1><p class="apsub">${esc2(wx.error || 'Not available right now.')}</p>${back}</div>`;
      const c = wx.cur, d = wx.daily, day = (s) => new Date(s + 'T12:00').toLocaleDateString(undefined, { weekday: 'short' });
      return `<div class="cappg"><h1>Weather</h1><p class="apsub">${esc2(wx.city || 'Your area')}</p>
        <div class="wxnow"><b>${Math.round(c.temperature_2m)}°</b><span>${WC(c.weather_code)}<br><i>Feels like ${Math.round(c.apparent_temperature)}° · Wind ${Math.round(c.wind_speed_10m)} mph · Humidity ${Math.round(c.relative_humidity_2m)}%</i></span></div>
        <div class="wxd">${d.time.slice(1, 6).map((t, i) => `<div><b>${day(t)}</b><span>${WC(d.weather_code[i + 1])}</span><i>${Math.round(d.temperature_2m_max[i + 1])}° / ${Math.round(d.temperature_2m_min[i + 1])}°</i><u>${d.precipitation_probability_max[i + 1] ?? 0}% rain</u></div>`).join('')}</div>${back}</div>`;
    },
  };
  // ---- quick settings: volume + Wi-Fi ----
  let vol = null, wifi = null, qBusy = false;
  const loadQ = () => { Promise.all([api.volGet().catch(() => ({ ok: false })), api.wifiGet().catch(() => ({ ok: false }))]).then(([v, w]) => { vol = v; wifi = w; qBusy = false; if (screen === 'quick') show('quick', 0); }); };
  window.quickOpen = () => { vol = null; wifi = null; show('quick'); loadQ(); };
  SCREENS.quick = {
    focus: '.qkb', hints: 'A: Select    B: Back',
    html: () => {
      if (!vol || !wifi) return '<div class="cappg"><h1>Quick settings</h1><p class="apsub"><i class="spin"></i>Reading your PC...</p><div class="capact"><button class="xt capb qkb" data-nav data-capx="home">Back</button></div></div>';
      const v = vol.ok ? `<div class="sysr"><b>Volume</b><span>${vol.mute ? 'Muted' : vol.vol + '%'}</span><i class="sysbar"><u data-w="${vol.mute ? 2 : Math.max(2, vol.vol)}"></u></i></div>
        <div class="capact"><button class="xt capb qkb" data-nav data-capx="vdn">− 10</button><button class="xt capb qkb" data-nav data-capx="vup">+ 10</button><button class="xt capb qkb" data-nav data-capx="vmute">${vol.mute ? 'Unmute' : 'Mute'}</button></div>` : '<div class="sysr"><b>Volume</b><span>Could not read the Windows volume.</span></div>';
      const w = wifi.ok && (wifi.profiles.length || wifi.ssid) ? `<div class="sysr"><b>Wi-Fi</b><span>${wifi.ssid ? 'Connected to ' + esc2(wifi.ssid) + (wifi.signal ? ' · ' + esc2(wifi.signal) : '') : 'Not connected'}</span></div>
        <div class="capact wrap">${wifi.profiles.slice(0, 8).map((p) => `<button class="xt capb qkb" data-nav data-wifi="${esc2(p)}">${p === wifi.ssid ? '✓ ' : ''}${esc2(p)}</button>`).join('')}${wifi.ssid ? '<button class="xt capb qkb" data-nav data-capx="woff">Disconnect</button>' : ''}</div>` : '<div class="sysr"><b>Wi-Fi</b><span>No Wi-Fi adapter found (a wired connection is fine).</span></div>';
      return `<div class="cappg"><h1>Quick settings</h1><p class="apsub">Tap a saved network to connect. New networks need to be added in Windows once.</p><div class="sysg">${v}${w}</div><div class="capact"><button class="xt capb qkb" data-nav data-capx="home">Back</button></div></div>`;
    },
  };
  const qAct = (el) => {
    const d = el.dataset;
    if (d.wifi) { note('Connecting to ' + d.wifi + '...'); api.wifiConnect(d.wifi).then((ok) => { note(ok ? 'Asked Windows to connect to ' + d.wifi + '.' : 'Could not connect to ' + d.wifi + '.'); setTimeout(() => { if (screen === 'quick') loadQ(); }, 3500); }); return true; }
    const k = d.capx;
    if (k === 'vdn' || k === 'vup' || k === 'vmute') { if (!vol || !vol.ok) return true; const n = k === 'vmute' ? vol.vol : Math.max(0, Math.min(100, vol.vol + (k === 'vup' ? 10 : -10))), m = k === 'vmute' ? !vol.mute : (k === 'vup' ? false : vol.mute); vol = { ok: true, vol: n, mute: m }; show('quick', k === 'vdn' ? 0 : k === 'vup' ? 1 : 2); api.volSet(n, m); return true; }
    if (k === 'woff') { api.wifiOff().then(() => setTimeout(loadQ, 1500)); return true; }
    if (k === 'dnd') { dnd = !dnd; try { localStorage.setItem(DK, dnd ? '1' : '0'); } catch {} show('notifs', 0); return true; }
    if (k === 'nclear') { notes = []; saveNotes(); show('notifs', 0); return true; }
    if (k === 'wxref') { wx = null; show('weather', 0); loadWx(true); return true; }
    if (k === 'home') { show('home'); return true; }
    return false;
  };
  const act0 = window.xtraAct;
  window.xtraAct = (el) => { const d = el.dataset; if (d.act === 'notifs') { notifsOpen(); return true; } if (d.act === 'weather') { weatherOpen(); return true; } if (d.act === 'quick') { quickOpen(); return true; } return qAct(el) || act0(el); };
  const back0 = window.xtraBack;
  window.xtraBack = () => { if (screen === 'notifs' || screen === 'weather' || screen === 'quick') { show('home'); return true; } return back0(); };
  window.xtraGuide = (k) => { if (k === 'notifs') { closeGuide(true); notifsOpen(); return true; } if (k === 'weather') { closeGuide(true); weatherOpen(); return true; } if (k === 'quick') { closeGuide(true); quickOpen(); return true; } return false; };
  window.xtraUnread = () => unread;

  // ---------------- screensaver: the live wallpaper alone, with a big clock, after a while with no input ----------------
  const amb = document.createElement('div'); amb.id = 'ambient'; amb.innerHTML = '<div class="amc"></div><div class="amd"></div><div class="amn"></div>'; document.body.appendChild(amb);
  const paintAmb = () => {   // v1018: big light clock with a blinking colon, the weekday and date under a thin accent line, and the music in a glass pill; it drifts a little each minute so nothing burns in
    const d = new Date(), parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).formatToParts(d), P = (t) => (parts.find((x) => x.type === t) || {}).value || '';
    const tm = P('hour') + '|' + P('minute') + '|' + P('dayPeriod');
    if (amb._tm !== tm) {
      amb._tm = tm;
      amb.children[0].innerHTML = '<span class="h">' + P('hour') + '</span><span class="co">:</span><span class="mi">' + P('minute') + '</span>' + (P('dayPeriod') ? '<span class="ap">' + P('dayPeriod').toUpperCase() + '</span>' : '');
      amb.children[1].innerHTML = '<b>' + d.toLocaleDateString(undefined, { weekday: 'long' }) + '</b><span>' + d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) + '</span>';
      const m = d.getHours() * 60 + d.getMinutes(); amb.style.setProperty('--dx', (Math.sin(m / 9) * 2.2).toFixed(2) + 'vw'); amb.style.setProperty('--dy', (Math.cos(m / 11) * 2.6).toFixed(2) + 'vh');
    }
    try { const np = homeNp; amb.children[2].textContent = np && np.on && np.title ? '\u266a  ' + np.title + (np.artist ? '  \u00b7  ' + np.artist : '') : ''; } catch { amb.children[2].textContent = ''; }
    amb.children[2].style.display = amb.children[2].textContent ? '' : 'none';
  };
  let idleAt = Date.now(), on = false;
  let outT = 0;
  const wake = () => { idleAt = Date.now(); if (on) { on = false; const b = document.body; b.classList.add('ambient-out'); b.classList.remove('ambient'); clearTimeout(outT); outT = setTimeout(() => b.classList.remove('ambient-out'), 700); } };   // v1024: the console is usable the instant you touch anything, and the clock screen fades away over half a second
  const sleepy = () => { try { return introOn || launching || guideOn || osk || menu || document.hidden || dash || document.body.classList.contains('viewing') || screen === 'spotify' || screen === 'ytube' || document.body.classList.contains('gdgame'); } catch { return true; } };
  for (const ev of ['keydown', 'mousemove', 'mousedown', 'wheel', 'touchstart']) addEventListener(ev, (e) => { if (on) { if (ev !== 'mousemove') e.stopPropagation(); wake(); } else idleAt = Date.now(); }, true);
  if (api.onPadNav) api.onPadNav(wake);
  addEventListener('ambwake', wake);
  let pads = '';
  setInterval(() => {
    try { const g = [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter(Boolean).map((p) => p.buttons.map((b) => (b.pressed ? 1 : 0)).join('') + p.axes.map((a) => (Math.abs(a) > .4 ? 1 : 0)).join('')).join('|'); if (g !== pads && /1/.test(g)) wake(); pads = g; } catch {}
    const m = settings && settings.saver != null ? settings.saver : 10;
    if (on) paintAmb();
    if (!m || on || sleepy()) return;
    if (Date.now() - idleAt > m * 60000) { on = true; paintAmb(); document.body.classList.add('ambient'); }
    else if (on) paintAmb();
  }, 1000);
})();

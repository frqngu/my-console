const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage, protocol, net, nativeImage } = require('electron');
const { pathToFileURL } = require('url');
protocol.registerSchemesAsPrivileged([{ scheme: 'ctheme', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }]);   // lets the console show your own background pictures
const crypto = require('crypto');
const path = require('path');
const { spawn, spawnSync, execFile } = require('child_process');
const fs = require('fs');
// Smoothness: draw with the graphics card, and never let Windows treat the console as hidden or background work.
for (const sw of ['disable-renderer-backgrounding', 'disable-background-timer-throttling', 'disable-backgrounding-occluded-windows']) app.commandLine.appendSwitch(sw);
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-accelerated-video-decode');   // v788 test: the graphics process has been dying about 5 s after start, when the startup video begins; videos are decoded on the processor instead of through the graphics driver

// BINDS-START
const BTN_OK = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'BACK', 'START'];
const DEF_BINDS = { confirm: 'A', back: 'B', search: 'Y', remove: 'X' };   // LB and RB always switch tabs, so they are not offered here
const CONSOLE_OK = ['A', 'B', 'X', 'Y', 'BACK', 'START'];
const DEF_MBINDS = { left: 'A', right: 'B', kbd: 'Y', enter: 'START', esc: 'RB', back: 'LB' };
const PAD_TARGETS = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'L3', 'R3', 'DU', 'DD', 'DL', 'DR', 'BACK', 'START'];
function cleanPaddles(p) { p = p && typeof p === 'object' ? p : {}; const o = {}; for (const k of ['P1', 'P2', 'P3', 'P4']) o[k] = PAD_TARGETS.includes(p[k]) ? p[k] : ''; return o; }
function cleanPadProf(p) {   // one of the three controller profiles
  if (!p || typeof p !== 'object') return null;
  return { binds: cleanBinds(p.binds, DEF_BINDS, CONSOLE_OK), mbinds: cleanBinds(p.mbinds, DEF_MBINDS), paddles: cleanPaddles(p.paddles), deadzone: clamp(p.deadzone, 0.05, 0.6, 0.25), mouseSpeed: clamp(p.mouseSpeed, 300, 3000, 1200), mouseCurve: clamp(p.mouseCurve, 1, 3, 1.6) };
}
function cleanBinds(b, def, ok) {
  ok = ok || BTN_OK;
  b = b && typeof b === 'object' ? b : {};
  const out = {}, used = new Set();
  for (const k of Object.keys(def)) {
    let v = ok.includes(b[k]) ? b[k] : def[k];
    if (used.has(v)) v = ok.find((x) => !used.has(x));
    out[k] = v; used.add(v);
  }
  return out;
}
// BINDS-END
const DEFAULTS = { accent: '#7cc4ff', theme: 'winter', scale: 1, deadzone: 0.25, fullscreen: true, mouseSpeed: 1200, mouseCurve: 1.6, steamKey: '', rawgKey: '', sgdbKey: '', igdbId: '', igdbSecret: '', binds: DEF_BINDS, mbinds: DEF_MBINDS, motion: true, sfx: true, music: true, musicVol: 0.3, sfxVol: 0.7, intro: true, profileName: 'Frankie', avatarFile: '', introVideo: '', trailerSound: true, trailerSoundV: 2, widgets: null, profiles: [] };
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const logFile = () => path.join(app.getPath('userData'), 'console.log');
let win;

let logQ = [], logTimer = null, logTrimmed = false;
function flushLog(sync) {   // the log is written in the background, in batches: a disk write on the main thread used to stall every controller press
  logTimer = null; if (!logQ.length) return;
  const t = logQ.join(''); logQ = [];
  try { if (sync) fs.appendFileSync(logFile(), t); else fs.appendFile(logFile(), t, () => {}); } catch {}
}
function log(msg) {
  if (!logTrimmed) { logTrimmed = true; try { const f = logFile(), st = fs.statSync(f); if (st.size > 1500000) { const b = fs.readFileSync(f); fs.writeFileSync(f, b.subarray(b.length - 400000)); } } catch {} }   // an old log never grows past about 1.5 MB
  logQ.push(`[${new Date().toISOString()}] ${msg}\n`);
  if (!logTimer) logTimer = setTimeout(() => flushLog(false), 400);
}
process.on('exit', () => flushLog(true));
function clamp(v, lo, hi, d) { return typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
// ---- Home widgets and extra users ----
const W_TYPES = ['library', 'recent', 'featured', 'apps', 'game', 'web', 'app', 'controller', 'settings', 'search', 'find', 'customize', 'clock', 'stats'];
const APP_ICON = /^appicon-[a-f0-9]{12}\.png$/;
const APP_ID = /^[\w.\-!{}\\:()+ ]{2,300}$/;
const DEF_APPS = () => [['YouTube', 'https://www.youtube.com', '#e62117'], ['Netflix', 'https://www.netflix.com', '#b20710'], ['Spotify', 'https://open.spotify.com', '#1db954'], ['Twitch', 'https://www.twitch.tv', '#8a4bef'], ['Disney+', 'https://www.disneyplus.com', '#1b3fa8'], ['Prime Video', 'https://www.primevideo.com', '#0e9ad6'], ['Google', 'https://www.google.com', '#3b7de8']].map(([name, url, color], i) => ({ id: 'a' + i, name, kind: 'web', url, appId: '', icon: '', color }));
function cleanApps(a) {
  if (!Array.isArray(a)) return DEF_APPS();
  const out = [], ids = new Set();
  for (const x of a.slice(0, 40)) {
    if (!x || typeof x !== 'object' || typeof x.name !== 'string' || !x.name.trim()) continue;
    const kind = x.kind === 'app' ? 'app' : 'web';
    let url = '', appId = '';
    if (kind === 'app') { appId = typeof x.appId === 'string' && APP_ID.test(x.appId) ? x.appId : ''; if (!appId) continue; }
    else {
      url = typeof x.url === 'string' ? x.url.trim().slice(0, 400) : ''; if (!url) continue;
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');
      try { new URL(url); } catch { continue; }
    }
    let id = /^[a-z0-9]{2,16}$/.test(x.id || '') && !ids.has(x.id) ? x.id : 'a' + Math.random().toString(36).slice(2, 8); ids.add(id);
    out.push({ id, name: x.name.trim().slice(0, 40), kind, url, appId, icon: APP_ICON.test(x.icon || '') ? x.icon : '', color: /^#[0-9a-fA-F]{6}$/.test(x.color || '') ? x.color : '#3b4a7a' });
  }
  if (!out.some((x) => x.kind === 'web' && /(^|\.)youtube\.com/i.test(x.url))) out.unshift({ id: ids.has('a0') ? 'ayt' + Math.random().toString(36).slice(2, 5) : 'a0', name: 'YouTube', kind: 'web', url: 'https://www.youtube.com', appId: '', icon: '', color: '#e62117' });   // YouTube always has its place
  return out;
}
const wid = () => 'w' + Math.random().toString(36).slice(2, 8);
const DEF_WIDGETS = () => [['wlib', 'library'], ['wcus', 'customize'], ['wapps', 'apps'], ['wctl', 'controller']].map(([id, type]) => ({ id, type, title: '', color: '', size: 'wide', target: '', img: '' }));
function cleanWidgets(a) {
  if (!Array.isArray(a)) return DEF_WIDGETS();
  const out = [], ids = new Set();
  for (let w of a.slice(0, 12)) {
    if (w && w.type === 'featured' && w.id === 'wfeat') w = { ...w, type: 'apps', id: 'wapps' };   // the old default "Ready to install" widget became "Browse your apps"
    if (!w || typeof w !== 'object' || !W_TYPES.includes(w.type)) continue;
    let id = /^[a-z0-9]{2,16}$/.test(w.id || '') && !ids.has(w.id) ? w.id : wid(); ids.add(id);
    let target = typeof w.target === 'string' ? w.target.trim().slice(0, 400) : '';
    if (w.type === 'web') target = /^https?:\/\//i.test(target) ? target : 'https://' + (target.replace(/^\/+/, '') || 'www.google.com');
    out.push({ id, type: w.type, title: typeof w.title === 'string' ? w.title.trim().slice(0, 40) : '', color: /^#[0-9a-fA-F]{6}$/.test(w.color || '') ? w.color : '', size: w.size === 'half' ? 'half' : 'wide', target, img: /^widget-[a-z0-9]+\.jpg$/.test(w.img || '') ? w.img : '' });
  }
  if (!out.some((w) => w.type === 'customize')) out.splice(Math.min(1, out.length), 0, { id: wid(), type: 'customize', title: '', color: '', size: 'wide', target: '', img: '' });   // the editor must always stay reachable
  return out;
}
function cleanProfiles(a) {
  if (!Array.isArray(a)) return [];
  return a.slice(0, 5).filter((p) => p && typeof p.name === 'string' && p.name.trim()).map((p) => ({ id: /^[a-z0-9]{2,16}$/.test(p.id || '') ? p.id : wid(), name: p.name.trim().slice(0, 24), avatarFile: /^avatar-[a-z0-9]+\.jpg$/.test(p.avatarFile || '') ? p.avatarFile : '' }));
}
function sanitize(s) {
  s = s || {};
  return {
    accent: /^#[0-9a-fA-F]{6}$/.test(s.accent) ? s.accent : DEFAULTS.accent,
    theme: /^[a-z][a-z0-9]{1,23}$/.test(s.theme || '') ? s.theme : 'winter',
    scale: clamp(s.scale, 0.7, 1.6, DEFAULTS.scale),
    deadzone: clamp(s.deadzone, 0.05, 0.6, DEFAULTS.deadzone),
    fullscreen: s.fullscreen !== false,
    homeStyle: s.homeStyle === 'classic' ? 'classic' : 'new',
    mouseSpeed: clamp(s.mouseSpeed, 300, 3000, DEFAULTS.mouseSpeed),
    mouseCurve: clamp(s.mouseCurve, 1, 3, DEFAULTS.mouseCurve),
    steamKey: /^[0-9a-fA-F]{32}$/.test(s.steamKey || '') ? s.steamKey : '',
    rawgKey: /^[0-9a-fA-F]{32}$/.test(s.rawgKey || '') ? s.rawgKey : '',
    sgdbKey: /^[0-9a-fA-F]{32}$/.test(s.sgdbKey || '') ? s.sgdbKey : '',
    igdbId: /^[a-z0-9]{10,40}$/i.test(s.igdbId || '') ? s.igdbId : '',
    igdbSecret: /^[a-z0-9]{10,60}$/i.test(s.igdbSecret || '') ? s.igdbSecret : '',
    binds: cleanBinds(s.binds, DEF_BINDS, CONSOLE_OK),
    mbinds: cleanBinds(s.mbinds && s.mbinds.enter === 'X' ? { ...s.mbinds, enter: 'START' } : s.mbinds, DEF_MBINDS),
    motion: s.motion !== false,
    wholeFit: Array.isArray(s.wholeFit) ? s.wholeFit.filter((x) => typeof x === 'string' && x.length < 80).slice(0, 300) : [],
    kbGames: Array.isArray(s.kbGames) ? s.kbGames.filter((x) => typeof x === 'string' && x.length < 80).slice(0, 300) : [],
    sfx: s.sfx !== false,
    musicVol: clamp(s.musicVol, 0, 1, DEFAULTS.musicVol),
    sfxVol: clamp(s.sfxVol, 0, 1, DEFAULTS.sfxVol),
    music: s.music !== false,
    intro: s.intro !== false,
    saver: [0, 3, 5, 10, 20, 30].includes(s.saver) ? s.saver : 10,
    introEnhance: s.introEnhance === true,
    profileSet: s.profileSet === true || /^avatar-[a-z0-9]+\.jpg$/.test(s.avatarFile || '') || (typeof s.profileName === 'string' && s.profileName.trim() !== ''),   // false only on a brand-new install: the console then asks for a name and picture first
    profileName: typeof s.profileName === 'string' && s.profileName.trim() ? s.profileName.trim().slice(0, 24) : 'Frankie',
    introVideo: /^startup-[a-z0-9]+\.(mp4|webm)$/.test(s.introVideo || '') ? s.introVideo : '',
    avatarFile: /^avatar-[a-z0-9]+\.jpg$/.test(s.avatarFile || '') ? s.avatarFile : '',
    trailerSound: s.trailerSoundV === 2 ? s.trailerSound === true : true, trailerSoundV: 2,
    paddles: cleanPaddles(s.paddles),
    padProfile: [0, 1, 2].includes(s.padProfile) ? s.padProfile : 0,
    padProfiles: [0, 1, 2].map((i) => cleanPadProf(Array.isArray(s.padProfiles) ? s.padProfiles[i] : null)),
    widgets: cleanWidgets(s.widgets),
    webApps: cleanApps(s.webApps),
    appsMatched: s.appsMatched === true,
    profiles: cleanProfiles(s.profiles),
  };
}
function loadSettings() {
  try { return sanitize(JSON.parse(fs.readFileSync(settingsFile(), 'utf8'))); }
  catch { return sanitize({}); }   // missing or corrupt file -> safe defaults
}
let settingsFrozen = false;
function saveSettings(s) {
  if (settingsFrozen) return s;
  const clean = sanitize(s);
  try {
    if (fs.existsSync(settingsFile())) fs.copyFileSync(settingsFile(), settingsFile() + '.bak');
    fs.writeFileSync(settingsFile(), JSON.stringify(clean, null, 2));
  } catch (e) { log('save failed: ' + e.message); }
  return clean;
}

const gotLock = app.requestSingleInstanceLock(); if (!gotLock) app.quit();   // starting twice (autostart + by hand) never opens a second console
let fadeI = null;
function fadeWin(to, ms, cb) {   // the whole console window eases in or out instead of popping on and off
  try { clearInterval(fadeI); if (!win || win.isDestroyed()) { if (cb) cb(); return; } const from = win.getOpacity(), t0 = Date.now();
    fadeI = setInterval(() => { try { const k = Math.min(1, (Date.now() - t0) / ms), e = k * k * k * (k * (6 * k - 15) + 10); win.setOpacity(from + (to - from) * e); if (k >= 1) { clearInterval(fadeI); fadeI = null; if (cb) cb(); } } catch { clearInterval(fadeI); if (cb) cb(); } }, 16);
  } catch { if (cb) cb(); }
}
let homeCover = null;
function coverHomeEarly() {   // v816: a black window on the console's monitor the instant the program starts, so nothing grey/white can show before the console's own first picture; it fades away in step with the console fading in
  try {
    if (process.platform !== 'win32') return;
    const { screen } = require('electron'), pb = screen.getPrimaryDisplay().bounds, b = { x: pb.x - 4, y: pb.y - 4, width: pb.width + 8, height: pb.height + 8 };   // bigger than the monitor so Windows 11's thin window outline is off-screen
    homeCover = new BrowserWindow({ x: b.x, y: b.y, width: b.width, height: b.height, frame: false, backgroundColor: '#000000', alwaysOnTop: true, skipTaskbar: true, focusable: false, resizable: false, movable: false, hasShadow: false, show: true, webPreferences: { sandbox: true } });
    homeCover.setIgnoreMouseEvents(true); try { homeCover.setAlwaysOnTop(true, 'screen-saver'); } catch {}
    homeCover.loadURL('data:text/html,<body style="margin:0;background:%23000000"></body>');
    log('cover: black cover on the console monitor from the first moment');
    setTimeout(dropHomeCover, 12000);   // never stays if something goes wrong
  } catch (e) { log('cover: ' + e.message); }
}
function dropHomeCover(ms) {
  const w = homeCover; homeCover = null; if (!w) return;
  try { if (w.isDestroyed()) return; const t0 = Date.now(), d = ms || 1;
    const iv = setInterval(() => { try { const k = Math.min(1, (Date.now() - t0) / d); w.setOpacity(1 - k); if (k >= 1) { clearInterval(iv); w.destroy(); } } catch { clearInterval(iv); try { w.destroy(); } catch {} } }, 33);
  } catch {}
}
function createWindow() {
  // v820: no cover window of any kind (Windows 11 draws a thin outline around any extra window)
  const s = loadSettings();
  win = new BrowserWindow({
    fullscreen: true, autoHideMenuBar: true, backgroundColor: '#000000', alwaysOnTop: true, show: false,   // it appears above whatever was open the moment its window exists
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required',
    },
  });
  // v819: no cover on the other monitor any more: your own Windows wallpaper shows there normally (the desktop colour behind it is pure black, set by blackDesktop() / console-boot-black.bat)
  startExplorerIfShell();   // as early as possible: when the console is the Windows shell, the desktop/taskbar and the startup programs are started from here
  win.setMenu(null);
  try { win.setOpacity(0); } catch {}
  let shown = false;
  const showSoft = () => { if (shown || !win || win.isDestroyed()) return; shown = true; try { win.setOpacity(0); } catch {} try { const { screen } = require('electron'); const d = screen.getPrimaryDisplay(); win.setBounds(d.bounds); win.setFullScreen(true); } catch {} try { win.show(); win.moveTop(); } catch {} setTimeout(() => { fadeWin(1, 1400); dropHomeCover(1400); }, 280); setTimeout(() => { try { if (win && !win.isDestroyed()) { win.focus(); win.webContents.focus(); } } catch {} }, 900); };   // it is already full screen (and black) before it becomes visible, then fades in: it never shows up small or pops on
  win.once('closed', () => { try { log('console window closed: quitting, so it can start fresh next time'); } catch {} setTimeout(() => app.quit(), 200); });   // never leave the program running with no window (the controller-wake would think it is already up)
  win.once('ready-to-show', () => setTimeout(showSoft, 60)); setTimeout(showSoft, 3500);
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\/rawg\.io(\/|$)/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  const stayFull = () => { try { if (win && !win.isDestroyed() && !win.isFullScreen()) { if (win.isMaximized()) win.unmaximize(); win.setFullScreen(true); } } catch {} };   // this replaces the Windows desktop: it never leaves fullscreen
  win.on('leave-full-screen', () => setTimeout(stayFull, 50)); win.on('unmaximize', () => setTimeout(stayFull, 50)); win.on('restore', stayFull); win.on('show', stayFull); win.on('resize', () => { if (!win.isFullScreen()) setTimeout(stayFull, 150); });
  win.on('focus', () => { try { log('console took focus; last helper line "' + lastHL + '" ' + (Date.now() - lastHLAt) + ' ms ago'); } catch {} try { win.webContents.setAudioMuted(false); } catch {} stayFull(); if (mouseState && !extActive && !launching && !dcWinShown && !spShown && Date.now() > storeGrace) setMouse(false, true); });   // the console has the focus, so the controller belongs to it   // you came back to the dashboard yourself
  win.on('blur', () => { if (instStarted.size) instAway = true; });
  win.on('focus', () => { try { if (!kbMenuOpen) { setTimeout(() => { try { if (!kbMenuOpen) sendHelper('unclip'); } catch {} }, 250); } } catch {} });
  win.on('focus', () => { if (instAway && instStarted.size) { instAway = false; const t = Date.now() + 2200; for (const k of instStarted.keys()) if (!uiaSeen.has(k)) instCancelAt.set(k, t); } });   // back from the launcher: if no install started within a few seconds, the page goes back to Install
  win.on('resize', () => { dcFit(); spFit(); ytFit(); ypFit(); });
  win.on('restore', () => { if (mouseState && !extActive && !dcWinShown && Date.now() > storeGrace) setMouse(false, true); });   // you brought the console back yourself: give the controller back to it
  app.on('child-process-gone', (_e, d) => { if (d && d.type === 'GPU') { log('gpu process gone: ' + d.reason + ' (exit code ' + d.exitCode + ', ' + (d.serviceName || d.name || '') + ')'); try { win.setBackgroundColor('#000000'); win.webContents.invalidate(); } catch (e) {} try { win.webContents.executeJavaScript('window.__gpuGone&&window.__gpuGone()').catch(() => {}); } catch (e) {} } });
  win.webContents.on('render-process-gone', (_e, d) => log('renderer gone: ' + d.reason));
}

ipcMain.handle('settings:get', () => loadSettings());
// Windows may refuse to give focus to a background app, so briefly pin the window on top.
function bringToFront(soft, since) {
  try { if (win) win.webContents.setAudioMuted(false); } catch {}   // show the console AND give it keyboard/controller focus (a plain focus() is usually refused while a game has the foreground)
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.setAlwaysOnTop(true, 'screen-saver');
  if (soft && helper) { sendHelper('frontq ' + consoleHwnd() + ' ' + (Date.now() - since)); return; }   // a background re-check: never takes the focus from something you clicked
  win.show(); win.moveTop();
  if (helper) sendHelper('front ' + consoleHwnd()); else win.focus();
  holdTop(7000);   // above the taskbar until the console really has the screen back
  const t0 = Date.now();
  for (const t of [350, 900, 1800, 3000]) setTimeout(() => { if (win && !win.isFocused()) { if (helper) sendHelper('frontq ' + consoleHwnd() + ' ' + (Date.now() - t0)); else win.focus(); } }, t);   // retried only while you have not touched the mouse or keyboard since
  setTimeout(() => { if (win && !launching && win.isFocused()) win.setAlwaysOnTop(false); }, 7200);
}

// ---- running game: track it, and let the Xbox button open a dashboard where it can be closed ----
let running = null, trackTimer = null;
function procsIn(folder, detailed) {   // process ids whose program file is inside the game's folder
  return new Promise((resolve) => {
    const ps = '$d = $env:GAME_DIR; Get-Process | Where-Object { $_.Path -and $_.Path.StartsWith($d, [StringComparison]::OrdinalIgnoreCase) } | ForEach-Object { "$($_.Id):$($_.MainWindowHandle.ToInt64())" }';
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { env: { ...process.env, GAME_DIR: folder.endsWith('\\') ? folder : folder + '\\' }, windowsHide: true, timeout: 15000 },
      (err, out) => {
        const items = err ? [] : String(out).split(/\s+/).filter(Boolean).map((x) => { const [p, w] = x.split(':'); return { pid: Number(p), win: !!w && w !== '0', hwnd: w }; }).filter((o) => Number.isInteger(o.pid) && o.pid > 4);
        resolve(detailed ? items : items.map((o) => o.pid));
      });
  });
}
function bigWindow(folder) {   // the game's real, big window (not a launcher splash or a small pop-up): its handle, or ''
  return new Promise((resolve) => {
    const ps = "Add-Type -AssemblyName System.Windows.Forms; Add-Type 'using System;using System.Runtime.InteropServices;public class BW{[StructLayout(LayoutKind.Sequential)]public struct R{public int l,t,r,b;}[DllImport(\"user32.dll\")]public static extern bool GetWindowRect(IntPtr h,out R r);[DllImport(\"user32.dll\")]public static extern bool IsWindowVisible(IntPtr h);}'; $d=$env:GAME_DIR; $s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; Get-Process | Where-Object { $_.Path -and $_.Path.StartsWith($d,[StringComparison]::OrdinalIgnoreCase) -and $_.MainWindowHandle -ne 0 } | ForEach-Object { $h=$_.MainWindowHandle; $r=New-Object BW+R; if([BW]::IsWindowVisible($h) -and [BW]::GetWindowRect($h,[ref]$r)){ $w=$r.r-$r.l; $t=$r.b-$r.t; if($w -ge $s.Width*0.6 -and $t -ge $s.Height*0.6){ $h.ToInt64() } } } | Select-Object -First 1";
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { env: { ...process.env, GAME_DIR: folder.endsWith('\\') ? folder : folder + '\\' }, windowsHide: true, timeout: 15000 }, (err, out) => resolve(err ? '' : (String(out).trim().match(/^\d+$/) || [''])[0]));
  });
}
const ANTICHEAT = /easyanticheat|_eac|\beac\b|battleye|beservice|vanguard|vgc|xigncode|gameguard/i;
const NOT_GAMES = /(^|\\)(snippingtool|screenclippinghost|screensketch|gamebar|gamebarftserver|xboxgamebar|nvidia share|nvcontainer|obs64|medal|streamlabs|epicgameslauncher|epicwebhelper|epicgames|ubisoftconnect|ubisoftgamelauncher|upc|uplay|uplaywebcore|explorer|chrome|msedge|firefox|brave|opera|cmd|conhost|windowsterminal|powershell|pwsh|applicationframehost|searchhost|startmenuexperiencehost|shellexperiencehost|textinputhost|steam|steamwebhelper|discord|code|node|electron|taskmgr|systemsettings|eadesktop|origin|battle\.net|galaxyclient|crashreportclient|unrealcefsubprocess)\.exe$/i;
function newBigWindow(sinceMs) {   // a program that opened a big window after the launch, wherever its files live (when the game's folder is not what the launcher says)
  return new Promise((resolve) => {
    const ps = "Add-Type -AssemblyName System.Windows.Forms; Add-Type 'using System;using System.Runtime.InteropServices;public class NB{[StructLayout(LayoutKind.Sequential)]public struct R{public int l,t,r,b;}[DllImport(\"user32.dll\")]public static extern bool GetWindowRect(IntPtr h,out R r);[DllImport(\"user32.dll\")]public static extern bool IsWindowVisible(IntPtr h);}'; $s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $since=[DateTimeOffset]::FromUnixTimeMilliseconds([int64]$env:SINCE).LocalDateTime; Get-Process | Where-Object { $_.Path -and $_.MainWindowHandle -ne 0 } | ForEach-Object { try { if($_.StartTime -gt $since){ $h=$_.MainWindowHandle; $r=New-Object NB+R; if([NB]::IsWindowVisible($h) -and [NB]::GetWindowRect($h,[ref]$r)){ if(($r.r-$r.l) -ge $s.Width*0.6 -and ($r.b-$r.t) -ge $s.Height*0.6){ \"$($_.Id)|$($h.ToInt64())|$($_.Path)\" } } } } catch {} }";
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { env: { ...process.env, SINCE: String(sinceMs) }, windowsHide: true, timeout: 20000 }, (err, out) => {
      if (err) return resolve(null);
      for (const l of String(out).split(/\r?\n/)) { const m = l.trim().match(/^(\d+)\|(\d+)\|(.+)$/); if (m && Number(m[1]) !== process.pid && m[3].toLowerCase() !== process.execPath.toLowerCase() && !NOT_GAMES.test(m[3])) return resolve({ pid: Number(m[1]), hwnd: m[2], exe: m[3] }); }
      resolve(null);
    });
  });
}
function fgInfo() {   // the window in front right now: its handle, program file and size
  return new Promise((resolve) => {
    const ps = "Add-Type -AssemblyName System.Windows.Forms; Add-Type 'using System;using System.Runtime.InteropServices;public class FI{[StructLayout(LayoutKind.Sequential)]public struct R{public int l,t,r,b;}[DllImport(\"user32.dll\")]public static extern IntPtr GetForegroundWindow();[DllImport(\"user32.dll\")]public static extern bool GetWindowRect(IntPtr h,out R r);[DllImport(\"user32.dll\")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'; $h=[FI]::GetForegroundWindow(); $r=New-Object FI+R; [void][FI]::GetWindowRect($h,[ref]$r); $p=[uint32]0; [void][FI]::GetWindowThreadProcessId($h,[ref]$p); $s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $path=''; try{ $path=(Get-Process -Id $p).Path }catch{}; \"$($h.ToInt64())|$p|$($r.r-$r.l)|$($r.b-$r.t)|$($s.Width)|$($s.Height)|$path\"";
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { windowsHide: true, timeout: 15000 }, (err, out) => {
      if (err) return resolve(null);
      const m = String(out).trim().match(/^(\d+)\|(\d+)\|(-?\d+)\|(-?\d+)\|(\d+)\|(\d+)\|(.*)$/); if (!m) return resolve(null);
      resolve({ hwnd: m[1], pid: Number(m[2]), w: Number(m[3]), h: Number(m[4]), sw: Number(m[5]), sh: Number(m[6]), exe: m[7] });
    });
  });
}
function probe(folder, sinceMs, title) {   // one look at every program that has a window: where it lives, how big it is, whether it is new, in front, or named like the game
  return new Promise((resolve) => {
    const ps = "Add-Type -AssemblyName System.Windows.Forms; Add-Type 'using System;using System.Runtime.InteropServices;public class PB{[StructLayout(LayoutKind.Sequential)]public struct R{public int l,t,r,b;}[DllImport(\"user32.dll\")]public static extern bool GetWindowRect(IntPtr h,out R r);[DllImport(\"user32.dll\")]public static extern bool IsWindowVisible(IntPtr h);[DllImport(\"user32.dll\")]public static extern IntPtr GetForegroundWindow();}'; $s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $dir=$env:GAME_DIR; $ttl=$env:GAME_TITLE; $sq=$env:GAME_SQ; $since=[DateTimeOffset]::FromUnixTimeMilliseconds([int64]$env:SINCE).LocalDateTime; $fg=[PB]::GetForegroundWindow().ToInt64(); $wd=$env:GAME_WORD; if($wd){ Get-Process | Where-Object { $_.ProcessName.ToLower().Contains($wd) } | ForEach-Object { \"P|$($_.Id)|$($_.ProcessName)|$($_.MainWindowHandle.ToInt64())\" } }; \"S|$($s.Width)|$($s.Height)\"; Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object { try { $h=$_.MainWindowHandle; $r=New-Object PB+R; if(-not ([PB]::IsWindowVisible($h) -and [PB]::GetWindowRect($h,[ref]$r))){ return }; $p=''; try{$p=$_.Path}catch{}; $inDir=0; if($p -and $dir -and $p.StartsWith($dir,[StringComparison]::OrdinalIgnoreCase)){$inDir=1}; $isNew=0; try{ if($_.StartTime -gt $since){$isNew=1} }catch{}; $tm=0; if($ttl -and $_.MainWindowTitle -and $_.MainWindowTitle.ToLower().Contains($ttl)){$tm=1}; if($sq){ $nm=($_.ProcessName.ToLower() -replace '[^a-z0-9]',''); $tt=($_.MainWindowTitle.ToLower() -replace '[^a-z0-9]',''); if($nm.Contains($sq) -or $tt.Contains($sq)){$tm=1} }; $f=0; if($h.ToInt64() -eq $fg){$f=1}; \"W|$($_.Id)|$($h.ToInt64())|$($r.r-$r.l)|$($r.b-$r.t)|$inDir|$isNew|$tm|$f|$($_.ProcessName)|$p\" } catch {} }";
    const dir = folder ? (folder.endsWith('\\') ? folder : folder + '\\') : '';
    const pch = execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { env: { ...process.env, GAME_DIR: dir, GAME_TITLE: String(title || '').toLowerCase().replace(/[™®©]/g, '').trim(), GAME_SQ: String(title || '').toLowerCase().replace(/[^a-z0-9]/g, ''), GAME_WORD: (String(title || '').toLowerCase().match(/[a-z0-9]{4,}/) || [''])[0], SINCE: String(sinceMs) }, windowsHide: true, timeout: 20000 }, (err, out) => {
      let sw = 1920, sh = 1080; const list = [], procs = [];
      if (!err) for (const l of String(out).split(/\r?\n/)) {
        const p = l.trim().split('|');
        if (p[0] === 'S') { sw = Number(p[1]) || sw; sh = Number(p[2]) || sh; }
        else if (p[0] === 'P' && p.length >= 4) procs.push({ pid: Number(p[1]), name: p[2], hwnd: p[3] });
        else if (p[0] === 'W' && p.length >= 11) list.push({ pid: Number(p[1]), hwnd: p[2], w: Number(p[3]), h: Number(p[4]), inDir: p[5] === '1', isNew: p[6] === '1', title: p[7] === '1', fg: p[8] === '1', name: p[9], exe: p.slice(10).join('|') });
      }
      resolve({ ok: !err, sw, sh, procs, list: list.filter((x) => x.pid !== process.pid && x.exe.toLowerCase() !== process.execPath.toLowerCase() && !NOT_GAMES.test(x.exe || ('\\' + x.name + '.exe'))) });
    });
    try { require('os').setPriority(pch.pid, require('os').constants.priority.PRIORITY_BELOW_NORMAL); } catch {}   // the look-around never competes with the loading animation for the processor
  });
}
function bringWindow(hwnd) {   // restore the window if it is minimized and give it the screen and the keyboard focus (Windows is strict about that, so the usual Alt trick is used)
  return new Promise((resolve) => {
    if (!/^\d+$/.test(String(hwnd || ''))) return resolve(false);
    if (helper && helperReady) { sendHelper('front ' + hwnd); return resolve(true); }   // the helper does exactly this, instantly
    const ps = "Add-Type 'using System;using System.Runtime.InteropServices;public class BR{[DllImport(\"user32.dll\")]public static extern bool IsIconic(IntPtr h);[DllImport(\"user32.dll\")]public static extern bool ShowWindow(IntPtr h,int c);[DllImport(\"user32.dll\")]public static extern bool SetForegroundWindow(IntPtr h);[DllImport(\"user32.dll\")]public static extern bool BringWindowToTop(IntPtr h);[DllImport(\"user32.dll\")]public static extern void keybd_event(byte k,byte s,int f,int e);[DllImport(\"user32.dll\")]public static extern bool SetWindowPos(IntPtr h,IntPtr a,int x,int y,int cx,int cy,uint f);}'; $h=[IntPtr][long]$env:HWND; if([BR]::IsIconic($h)){[void][BR]::ShowWindow($h,9)} else {[void][BR]::ShowWindow($h,5)}; [BR]::keybd_event(0x12,0,0,0); [void][BR]::SetForegroundWindow($h); [BR]::keybd_event(0x12,0,2,0); [void][BR]::BringWindowToTop($h); [void][BR]::SetWindowPos($h,[IntPtr](-1),0,0,0,0,0x43); [void][BR]::SetWindowPos($h,[IntPtr](-2),0,0,0,0,0x43)";
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { env: { ...process.env, HWND: String(hwnd) }, windowsHide: true, timeout: 15000 }, (err) => resolve(!err));
  });
}
// DETECT-START
const parseProcs = (out) => String(out).split(/\r?\n/).map((x) => { const i = x.indexOf('|'), j = x.indexOf('|', i + 1); return { pid: Number(x.slice(0, i)), win: x.slice(i + 1, j) !== '0', path: x.slice(j + 1).trim() }; })
  .filter((o) => o.path && Number.isInteger(o.pid) && o.pid > 4);
function matchGame(procs, cands, sep) {   // which library game owns a running window? (longest folder match wins)
  let best = null;
  for (const p of procs) {
    if (!p.win) continue;
    const pl = p.path.toLowerCase();
    for (const c of cands) { const f = c.folder.toLowerCase().replace(/[\\/]+$/, '') + sep; if (pl.startsWith(f) && (!best || f.length > best.len)) best = { c, len: f.length }; }
  }
  return best && best.c;
}
// DETECT-END
function steamInstallDir(appid) {
  if (!/^\d+$/.test(appid || '')) return null;
  for (const d of steamDirs([])) {
    try { const i = (fs.readFileSync(path.join(d, `appmanifest_${appid}.acf`), 'utf8').match(/"installdir"\s+"([^"]+)"/) || [])[1]; if (i) return path.join(d, 'common', i); } catch {}
  }
  return null;
}
const gameFolder = (g) => g.folder || (g.exe && path.dirname(g.exe)) || steamInstallDir(g.steamId);
function allProcs() {
  return new Promise((resolve) => {
    const ps = 'Get-Process | Where-Object { $_.Path } | ForEach-Object { "$($_.Id)|$($_.MainWindowHandle.ToInt64())|$($_.Path)" }';
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { windowsHide: true, timeout: 15000, maxBuffer: 8 * 1024 * 1024 }, (err, out) => resolve(err ? '' : out));
  });
}
function lowPower(on) {   // while a game runs the console and all its helper processes drop to below-normal priority and the page is throttled, so the game always wins the processor
  try { const os = require('os'), P = os.constants.priority; for (const mt of app.getAppMetrics()) { try { os.setPriority(mt.pid, on ? P.PRIORITY_BELOW_NORMAL : P.PRIORITY_NORMAL); } catch {} } } catch {}
  try { if (win && win.webContents) win.webContents.setBackgroundThrottling(!!on); } catch {}
  try { log('low-power mode ' + (on ? 'on' : 'off')); } catch {}
}
function setRunning(obj) { clearInterval(trackTimer); const first = !running; running = obj; trackTimer = setInterval(checkRunning, 10000); if (first) setTimeout(() => { if (running) lowPower(true); }, 4000); }
async function detectRunning() {   // finds a game that was started outside the console (for example from Steam)
  if (running) return;
  const cands = loadLib().games.filter((g) => g.installed !== false).map((g) => ({ id: g.id, title: g.title, folder: gameFolder(g) })).filter((c) => c.folder).map((c) => ({ ...c, folder: path.resolve(c.folder) }));
  if (!cands.length) return;
  const hit = matchGame(parseProcs(await allProcs()), cands, path.sep);
  if (hit && !running) setRunning({ id: hit.id, title: hit.title, folder: hit.folder, t0: Date.now(), seen: true, misses: 0 });
}
function stopTracking() { kbMenuOpen = false; kbMenuAt = Date.now();
  try {   // add this session to the game's total time played
    if (running && running.seen) { const l = loadLib(), m = l.meta[running.id] || {}, secs = Math.round((Date.now() - running.t0) / 1000); l.meta[running.id] = { ...m, playSeconds: (m.playSeconds || 0) + secs }; saveLib(l); try { addPlayDay(secs); } catch {} }
  } catch {}
  clearInterval(trackTimer); trackTimer = null; running = null; lowPower(false);
  try { sendHelper('unpark'); } catch {}   // windows hidden during the launch go back now that the game is over
  try { if (extActive) { extHwnd = ''; extActive = false; extResume = false; setAway(false); } } catch {}   // the game is gone, so the console is no longer "away" (the wallpaper and titles stayed frozen until the Xbox button was pressed)
  try { setTimeout(() => { try { fxSync(); } catch {} }, 400); setTimeout(() => { try { fxSync(); } catch {} }, 2500); } catch {}
  try { kbMode = false; clipOff(); sendHelper('unclip'); setTimeout(() => { try { sendHelper('unclip'); } catch {} }, 1500); } catch {}   // the mouse is free again: it can go to the second monitor
}
function startTracking(g) {
  const folder = gameFolder(g) || (g.uri ? 'C:\\__unknown__' : '');   // a store game whose folder is not known is still tracked, by the window it opens
  if (!folder) return;
  setRunning({ id: g.id, title: g.title, folder: path.resolve(folder), t0: Date.now(), seen: false, misses: 0 });
}
async function checkRunning() {
  if (!running) return;
  if (running.pid && running.seen && pidAlive(running.pid) && Date.now() - (running.lastScan || 0) < 60000) { running.misses = 0; return; }   // the game's own process is still there: no need to list every program on the PC (that scan costs real processor time)
  running.lastScan = Date.now();
  const pids = await procsIn(running.folder);
  if (!running) return;
  if (running.pid && pidAlive(running.pid) && !pids.includes(running.pid)) pids.push(running.pid);   // anti-cheat hides a game's file path, so the program is also followed by its own id
  if (pids.length) gamePids = pids;
  if (pids.length) { running.seen = true; running.misses = 0; return; }
  running.misses++;
  if ((running.seen && running.misses >= 2) || (!running.seen && Date.now() - running.t0 > 900000)) {   // a game whose program cannot be seen (anti-cheat, launcher) is kept as running for 15 minutes, not 2.5
    const title = running.title, seen = running.seen, rid = running.id; log('tracking ended: ' + title + (seen ? '' : ' (never seen)'));
    const kbGame = !!(running && (loadSettings().kbGames || []).includes(String(running.id)));
    stopTracking();
    if (seen) { bringToFront(); if (win) win.webContents.send('game:exited', title, rid); }
    // v719: the console stays open when a keyboard-and-mouse game ends (it used to close with the game)
  }
}
let exitBusy = false;
setInterval(async () => {   // a game closed by you inside it, or that crashed: the console notices within a second, not after 20
  try {
    if (!running || !running.seen || exitBusy || launching) return;
    const ps = new Set([...(gamePids || []), running.pid].filter(Boolean));
    if (!ps.size || [...ps].some(pidAlive)) return;
    exitBusy = true;
    const pids = await procsIn(running.folder);
    if (!running) return;
    if (pids.length) { gamePids = pids; return; }
    const title = running.title, rid = running.id; log('game exited (fast): ' + title);
    stopTracking(); gamePids = []; bringToFront(); if (win) win.webContents.send('game:exited', title, rid);
  } catch {} finally { exitBusy = false; }
}, 700);
async function pidOfWindow(hwnd) {   // the program that owns a window, even when its file lives outside the game's folder
  if (/^\d+$/.test(String(hwnd || ''))) { const r = await helperAsk('pidof ' + hwnd, 'pidof ' + hwnd + ' ', 800); if (r !== null && /^\d+$/.test(r.trim())) return Number(r.trim()); }
  return new Promise((resolve) => {
    if (!/^\d+$/.test(String(hwnd || ''))) return resolve(0);
    const ps = "Add-Type 'using System;using System.Runtime.InteropServices;public class WP{[DllImport(\"user32.dll\")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'; $p=[uint32]0; [void][WP]::GetWindowThreadProcessId([IntPtr][long]$env:HWND,[ref]$p); $p";
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { env: { ...process.env, HWND: String(hwnd) }, windowsHide: true, timeout: 15000 }, (err, out) => { const n = Number(String(out).trim()); resolve(!err && Number.isInteger(n) && n > 4 ? n : 0); });
  });
}
async function fgHwnd() {   // the window that has the keyboard focus right now
  const r = await helperAsk('fg', 'fg ', 800); if (r !== null && /^\d+$/.test(r.trim())) return r.trim();
  return new Promise((resolve) => {
    const ps = "Add-Type 'using System;using System.Runtime.InteropServices;public class FG{[DllImport(\"user32.dll\")]public static extern IntPtr GetForegroundWindow();}'; [FG]::GetForegroundWindow().ToInt64()";
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { windowsHide: true, timeout: 15000 }, (err, out) => resolve(err ? '' : String(out).trim()));
  });
}
function pidAlive(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } }
async function gamePidSet() {   // everything that belongs to the running game: by folder, by its window, and every id seen earlier
  const set = new Set(running ? await procsIn(running.folder) : []);
  if (running && running.pid && pidAlive(running.pid)) set.add(running.pid);
  if (running && running.allp) for (const p of running.allp) if (pidAlive(p)) set.add(p);   // every program named like the game: its sound may come from any of them
  if (running && running.hwnd) { const p = await pidOfWindow(running.hwnd); if (p) set.add(p); }
  for (const p of gamePids) if (pidAlive(p)) set.add(p);
  return [...set].filter((p) => p !== process.pid);
}
async function closeGame(force) {
  if (!running) return { ok: false, error: 'No game is running.' };
  const kill = (pids, hard) => { for (const pid of pids) spawn('taskkill', ['/PID', String(pid), '/T'].concat(hard ? ['/F'] : []), { windowsHide: true, stdio: 'ignore' }).on('error', () => {}); };
  const id = running.id, title0 = running.title;
  const finish = () => { if (!running || running.id !== id) return; stopTracking(); gamePids = []; bringToFront(); if (win) win.webContents.send('game:exited', title0, id); };
  // fast path: the game's program ids are already known, so nothing has to be searched for (searching costs about a second)
  const quick = () => { const s = new Set(); if (running && running.pid) s.add(running.pid); if (running && running.allp) for (const p of running.allp) s.add(p); for (const p of gamePids) s.add(p); return [...s].filter((p) => p && p !== process.pid && pidAlive(p)); };
  let pids = quick();
  if (!pids.length) { pids = await gamePidSet(); if (!pids.length) { finish(); return { ok: true }; } }
  bringToFront();   // the console must really be the foreground window (not just on top) before the game goes, or Windows shows the taskbar for a moment
  for (let i = 0; i < 20; i++) { try { if (win && win.isFocused()) break; } catch {} await sleep(40); if (i % 5 === 4 && helper) sendHelper('front ' + consoleHwnd()); }
  kill(pids, !!force);
  const t0 = Date.now(); let gone = false;
  const wait = setInterval(() => {   // the page flips back to Play the moment the game's programs are gone
    if (!running || running.id !== id) { clearInterval(wait); return; }
    if (!pids.some(pidAlive)) { clearInterval(wait); gone = true; finish(); sweep(0); }
    else if (Date.now() - t0 > 2500 && !gone) { kill(pids.filter(pidAlive), true); if (Date.now() - t0 > 6000) { clearInterval(wait); finish(); sweep(0); } }
  }, 50);
  const sweep = async (n) => {   // afterwards, quietly: anything of the game that is still alive is shut down for good
    try { await sleep(1200); const left = (await procsIn(title0 && running ? running.folder : '')).filter((p) => p !== process.pid); if (left.length && n < 3) { kill(left, true); sweep(n + 1); } } catch {}
  };
  return { ok: true };
}
// ---- loading screen: keep the console in front while the game starts, then fade it out into the game ----
let dlgOpen = 0;   // a file or message box is open: do not pull the console in front of it
for (const fn of ['showOpenDialog', 'showSaveDialog', 'showMessageBox']) { const orig = dialog[fn]; if (orig) dialog[fn] = async (...a) => { dlgOpen++; try { return await orig.apply(dialog, a); } finally { dlgOpen--; } }; }
let launching = null;
function markPlayed(id) { const l = loadLib(); l.meta[id] = { ...(l.meta[id] || {}), lastPlayed: Date.now() }; saveLib(l); }
function afterLaunch(g) {
  markPlayed(g.id);
  startTracking(g);
  if (running && win) beginLaunch(); else if (win) { try { win.webContents.setAudioMuted(true); } catch {} gameAudio(false); win.minimize(); }
}
function endLaunch() {
  clearInterval(topT); topT = null; setPin('0');
  if (launching) { clearInterval(launching.timer); clearTimeout(launching.hard); launching = null; }
  if (win) { try { win.setAlwaysOnTop(false); win.setOpacity(1); } catch {} }
}
function beginLaunch() {
  endLaunch();
  win.setAlwaysOnTop(true, 'screen-saver'); win.show(); win.focus(); holdTop(310000, true);
  const L = (launching = { t0: Date.now(), busy: false, strict: !!running });   // every game waits for its real, big window: anti-cheat splash screens and launchers never count
  const handoffNow = () => { if (launching !== L) return; const rep = L.last || 'no window information at all'; endLaunch(); try { if (false) win.webContents.send('launch:report', 'Could not find ' + (running ? running.title : 'the game') + '. ' + rep); } catch {} log('launch gave up: ' + rep); if (win) { consoleToBack(); win.webContents.send('game:handoff'); if (running) lateFront(running.id); } };   // taking long: step aside so a launcher prompt is visible, and keep looking for the game
  L.hard = setTimeout(handoffNow, L.strict ? 90000 : 90000);   // whatever happens below, the loading screen can never stay longer than this
  L.timer = setInterval(async () => {
    if (launching !== L || L.busy) return;
    L.busy = true;
    try {
      if (L.strict) {
        const pr = await probe(running ? running.folder : '', L.t0 - 2000, running ? coverTitle(running.title) : '');
        if (launching !== L || !running) return;
        const big = (x) => x.w >= pr.sw * 0.6 && x.h >= pr.sh * 0.6;
        const mine = pr.list.filter((x) => x.inDir || x.title);
        if (!mine.length) { const gp = (pr.procs || []).find((x) => x.hwnd && x.hwnd !== '0' && !NOT_GAMES.test('\\' + x.name + '.exe')); if (gp) mine.push({ pid: gp.pid, hwnd: gp.hwnd, name: gp.name, w: 0, h: 0, inDir: false, title: true, exe: '' }); }   // a program named like the game that owns a window, even a hidden one
        const hit = mine.find((x) => big(x) && !ANTICHEAT.test(x.name + ' ' + x.exe));   // only the game's own big window: never a screenshot tool, overlay or anti-cheat splash
        const tiny = (x) => x.w <= 200 || x.h <= 200;   // minimized or hidden: still the game, it just has to be brought back   // the game's big window: by its folder, its title, or because it is new / in front
        if (running) running.allp = (pr.procs || []).map((x) => x.pid);
        L.n = (L.n || 0) + 1; try { if (win) win.webContents.send('launch:dbg', L.last = 'looking for ' + running.title + ' · ' + (pr.ok ? pr.list.length + ' windows' : 'could not read windows') + ' · programs named like it: ' + ((pr.procs || []).map((x) => x.name + '#' + x.pid + (x.hwnd && x.hwnd !== '0' ? ' (has window)' : ' (no window)')).join(', ') || 'none') + (pr.list.length ? ': ' + pr.list.slice(0, 4).map((x) => (x.name || path.basename(x.exe)) + ' ' + x.w + 'x' + x.h + (x.inDir ? ' dir' : '') + (x.title ? ' title' : '')).join(', ') : '')); } catch {}
        if (L.n % 4 === 1) log('launch watch: folder=' + running.folder + ' windows=' + pr.list.map((x) => path.basename(x.exe) + ' ' + x.w + 'x' + x.h + (x.inDir ? ' dir' : '') + (x.title ? ' title' : '') + (x.isNew ? ' new' : '') + (x.fg ? ' fg' : '')).join('; '));
        if (hit) { L.hits = (L.hits || 0) + 1; if (L.hits >= 2 || hit.fg) { if (!hit.inDir && hit.exe) { running.folder = path.dirname(hit.exe); } log('launch: game found: ' + (hit.exe || hit.name) + ' pid ' + hit.pid); running.hwnd = hit.hwnd; try { gameToHome(hit.hwnd); } catch {} running.pid = hit.pid; running.pname = hit.name; return finishLaunch(L); } } else L.hits = 0;
        if (!hit && !mine.length && !L.retried && Date.now() - L.t0 > 14000) { L.retried = true; const gg = loadLib().games.find((x) => x.id === running.id); if (gg && gg.uri && /^(com\.epicgames\.launcher|uplay):\/\//.test(gg.uri)) { log('launch: nothing opened yet, asking the launcher again'); shell.openExternal(String(gg.uri).replace(/&silent=true/, '')).catch(() => {}); } }   // a launcher that was still starting up can ignore the first request
        const sm = mine.find((x) => !ANTICHEAT.test(x.name + ' ' + x.exe) && x.w > 200); if (sm) { if (!L.anyAt) L.anyAt = Date.now(); if (Date.now() - L.anyAt > 25000) { running.hwnd = sm.hwnd; running.pid = sm.pid; running.pname = sm.name; return finishLaunch(L); } } else L.anyAt = 0;   // the game's small start-up window is waited out (it grows to full size by itself); only a game that stays small for 25 seconds is handed over as it is
      } else {
        const procs = running ? await procsIn(running.folder, true) : [];
        if (launching !== L) return;
        if (procs.some((p) => p.win)) return finishLaunch(L);
      }
    } catch (e) { log('launch tick: ' + e.message); } finally { L.busy = false; }
  }, 1500);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function consoleHwnd() { const b = win.getNativeWindowHandle(); return b.length >= 8 ? b.readBigUInt64LE(0).toString() : String(b.readUInt32LE(0)); }
function consoleToBack() {
  try { win.webContents.send('away', 'snap'); } catch {}   // the dashboard is hidden before it goes behind, so it can fade in softly next time
  clearInterval(topT); topT = null; setPin('0');   // the game has the screen now
  gameAudio(false);   // the dashboard stays open, just underneath the game
  try { win.webContents.setAudioMuted(true); } catch {}   // nothing from the dashboard may be heard over a game
  try { win.setAlwaysOnTop(false); } catch {}
  if (helper) sendHelper('back ' + consoleHwnd()); else win.minimize();
}

// Games must stay fullscreen: shortly after one opens (and again a bit later) we check its window covers the whole screen, and if it opened windowed we press Alt+Enter once
function winIsFull(hwnd) {
  return new Promise((resolve) => {
    const ps = "Add-Type -AssemblyName System.Windows.Forms; Add-Type 'using System;using System.Runtime.InteropServices;public class WR{[StructLayout(LayoutKind.Sequential)]public struct R{public int l,t,r,b;}[DllImport(\"user32.dll\")]public static extern bool GetWindowRect(IntPtr h,out R r);}'; $r=New-Object WR+R; if(-not [WR]::GetWindowRect([IntPtr][long]$env:HWND,[ref]$r)){'gone';exit}; $s=[System.Windows.Forms.Screen]::FromPoint((New-Object System.Drawing.Point(([int](($r.l+$r.r)/2)),([int](($r.t+$r.b)/2))))).Bounds; if(($r.r-$r.l) -ge ($s.Width-8) -and ($r.b-$r.t) -ge ($s.Height-8)){'full'}else{'win'}";
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { env: { ...process.env, HWND: String(hwnd) }, windowsHide: true, timeout: 15000 }, (err, out) => resolve(err ? 'err' : String(out).trim()));
  });
}
async function keepFullscreen(L) {
  if (process.platform !== 'win32' || !running || !helper) return;
  const id = running.id;
  for (const wait of [2500, 6000, 10000]) {
    await sleep(wait);
    if (!running || running.id !== id) return;
    const bw = await bigWindow(running.folder), ws = (await procsIn(running.folder, true)).filter((p) => p.win), hw = bw || (ws[0] && ws[0].hwnd); if (!hw) continue;
    running.hwnd = hw; gameToHome(hw);
    if (bw) continue;   // big enough already: it is fullscreen or borderless
    if ((await winIsFull(hw)) === 'win' && (await fgHwnd()) === String(hw)) { await sleep(300); sendHelper('key altenter'); return; }   // Alt+Enter only when the game itself has the focus, so it can never go to the console
  }
}
async function ensureFront(id) {   // for a few seconds after the handoff the game keeps the screen, even if its launcher pops up over it
  if (process.platform !== 'win32' || !id) return;
  for (let i = 0; i < 8; i++) {
    await sleep(1500);
    if (!running || running.id !== id || !win || win.isFocused() || mouseState || extActive) return;
    const hw = running.hwnd; if (!hw) continue;
    if ((await fgHwnd()) !== String(hw)) { sendHelper('front ' + hw); await bringWindow(hw); }
  }
}
async function lateFront(id) {   // a launcher took longer than the loading screen waited: when the game finally opens it still gets the screen
  if (process.platform !== 'win32') return;
  const end = Date.now() + 240000;
  while (Date.now() < end) {
    await sleep(3000);
    if (!running || running.id !== id) return;
    let g = (await procsIn(running.folder, true)).find((p) => p.win);
    if (!g) { const nb = await newBigWindow(Date.now() - 120000); if (nb) { running.folder = path.dirname(nb.exe); g = { hwnd: nb.hwnd }; log('late launch: game found by its window: ' + nb.exe); } }
    if (!g) { const pr = await probe(running.folder, Date.now() - 300000, coverTitle(running.title)), m = pr.list.find((x) => x.inDir || x.title); if (m) { g = { hwnd: m.hwnd }; running.pid = m.pid; running.pname = m.name; if (!m.inDir && m.exe) running.folder = path.dirname(m.exe); log('late launch: game found by probe: ' + m.exe + ' ' + m.w + 'x' + m.h); } }
    if (g && helper) { running.hwnd = g.hwnd; gameToHome(g.hwnd); if (win && !win.isFocused() && !mouseState && !extActive) { sendHelper('front ' + g.hwnd); await bringWindow(g.hwnd); } keepFullscreen(); return; }
  }
}
let launchFullRes = null;
ipcMain.on('launch:full', () => { try { if (launchFullRes) launchFullRes(); } catch {} });
async function finishLaunch(L) {
  clearInterval(L.timer); clearTimeout(L.hard);
  if (false) try { if (win) win.webContents.send('launch:report', 'Handing over to ' + ((running && (running.pname || running.folder)) || '?') + ' · ' + (L.last || '')); } catch {}
  if (!win) return;
  win.webContents.send('game:ready');
  await Promise.race([new Promise((r) => { launchFullRes = r; }), sleep(3200)]); launchFullRes = null; await sleep(450);   // the percentage fills smoothly to 100% and rests there for a moment; only then does the game take over
  if (launching !== L || !win) return;
  let hw = running && running.hwnd; if (!hw) { const bw = running ? await bigWindow(running.folder) : ''; if (bw) hw = bw; else { const g = (running ? await procsIn(running.folder, true) : []).find((p) => p.win); if (g) hw = g.hwnd; } }   // the game's current window (a launcher splash may be gone by now)
  if (hw && running) running.hwnd = hw;
  if (hw) gameToHome(hw);
  if (hw && helper) { for (let i = 0; i < 8; i++) { sendHelper('front ' + hw); await sleep(100); if ((await fgHwnd()) === String(hw)) break; if (launching !== L || !win) return; } }   // the game window goes on top, still hidden under the loading screen, and has the focus before the loading screen leaves
  await sleep(60);
  for (let o = 1; o > 0; o -= 0.14) { try { win.setOpacity(Math.max(o, 0)); } catch {} await sleep(24); }
  if (launching !== L || !win) return;
  launching = null;
  consoleToBack();
  await sleep(80);
  try { win.setOpacity(1); } catch {}
  win.webContents.send('game:handoff');
  keepFullscreen();
  ensureFront(running && running.id);
  audioKick(running && running.id);
}
ipcMain.handle('launch:cancel', () => { endLaunch(); if (win) { consoleToBack(); try { win.webContents.setAudioMuted(false); } catch {} } return true; });

let gamePids = [];
function gameAudio(mute) {   // the game's own sound: muted the instant you are on the dashboard, on again the instant you are back in the game (the helper is always running, so this takes a few milliseconds)
  if (!running) return;
  if (gamePids.length && helper) sendHelper(`gmute ${gamePids.join(',')} ${mute ? 1 : 0}`);
  gamePidSet().then((ids) => { if (!running) return; const fresh = ids.filter((x) => !gamePids.includes(x)); gamePids = [...new Set([...gamePids.filter(pidAlive), ...ids])]; if (fresh.length && helper) sendHelper(`gmute ${fresh.join(',')} ${mute ? 1 : 0}`); });
}
async function audioKick(id) {   // a game that opens behind the loading screen can start without sound: its sound is switched off and on again a few times while it starts up
  for (const wait of [1500, 4000, 8000]) {
    await sleep(wait);
    if (!running || running.id !== id || !win || win.isFocused() || mouseState) return;
    const ids = await gamePidSet(); if (!ids.length || !helper) continue;
    sendHelper(`gmute ${ids.join(',')} 1`); await sleep(200); sendHelper(`gmute ${ids.join(',')} 0`);
  }
}
let quitT = null, holdT = null, holdOn = false;
let guideT = null, guideDownAt = 0, padSeen = false, padOffT = null;
async function onHomeButton() {   // a quick press of the Xbox button goes Home / back to where you were, and a second press goes back in
  if (!win) return;
  if (extResume && !extActive) { try { win.webContents.send('away', 'fade'); } catch {} await sleep(260); if (await resumeExternal()) return; }
  if (extActive) { extActive = false; extResume = true; }
  endLaunch();
  gameAudio(true);
  if (mouseState) setMouse(false, true); else bringToFront();   // even from the web browser or Windows mode
  win.webContents.send('homebtn');
}
let ghostOn = false, leaving = false;
function leaveApps() {   // the app is hidden at once; the console shows only the app card, which then settles away
  const which = spShown ? 'spotify' : ytShown ? 'youtube' : ypShown ? 'player' : '';
  if (!which) return;
  ghostOn = true; setTimeout(() => { ghostOn = false; }, 800);
  try { win.webContents.send('app:ghost', '', which); } catch {}
}
async function gameSnap() {   // holding the button inside a game: a picture of the game (taken before the console comes forward) becomes the blurred backdrop of the menu
  try {
    const { desktopCapturer } = require('electron'), d = homeDisplay();
    const src = await Promise.race([desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1280, height: 720 } }), new Promise((r) => setTimeout(() => r([]), 600))]);
    const sc = (d && src.find((x) => String(x.display_id) === String(d.id))) || src[0]; if (!sc || sc.thumbnail.isEmpty()) return;
    const jp = sc.thumbnail.toJPEG(70); if (jp.length < 4000) return;   // an all-black picture (a fullscreen game that cannot be captured) is not used
    win.webContents.send('game:snap', 'data:image/jpeg;base64,' + jp.toString('base64'));
  } catch (e) { log('game snapshot: ' + e.message); }
}
function onGuide(asHome) { openWithUntil = Date.now() + 12000;
  if (!win) return;
  if (spShown || ytShown || ypShown) leaveApps();
  if (asHome === false && (running || launching) && (!win.isFocused() || win.isMinimized()) && !spShown && !ytShown && !ypShown) { if (leaving) return; leaving = true; gameSnap().then(() => { leaving = false; onGuide2(asHome); }, () => { leaving = false; onGuide2(asHome); }); return; }
  onGuide2(asHome);
}
function onGuide2(asHome) {
  if (!win) return;
  dcWantCursor = false;   // the menu gets the controller back (the Share button gives it to Discord again)
  if (spShown || ytShown || ypShown) { try { win.webContents.send('app:back'); } catch {} }
  if (spShown) spHide();
  if (brShown) brHide();
  if (ytShown) ytHide();
  if (ypShown) ypHide();
  setTimeout(fxSync, 350);   // the console's own animation starts again once the app has left the screen
  if (dcShown) dcHide();   // Discord steps aside (the call keeps going) and the Xbox menu opens
  const wasAway = extActive || ((running || launching) && (!win.isFocused() || win.isMinimized()));   // you were inside an app, a web page or a game
  if (extActive) { extActive = false; extResume = true; }   // the console is in front now, so it is no longer "away"
  endLaunch();
  if (mouseState) setMouse(false, true); else if (!win.isFocused() || win.isMinimized()) bringToFront();
  { const t0 = Date.now(), mode = String(asHome); setTimeout(async () => { try { if (!win) return; const f = win.isFocused(); log('menu check (' + mode + ') after ' + (Date.now() - t0) + ' ms: console focused=' + f + ' visible=' + win.isVisible() + ' running=' + (running ? running.title : '-') + ' launching=' + !!launching); } catch {} }, 1300); }   // for the log: did the console really come forward?
  if (asHome === 'xb' || asHome === true) { kbMenuOpen = false; kbMenuAt = Date.now(); }
  if (asHome === 'xb') { if (wasAway) { gameAudio(true); win.webContents.send('homebtn'); } else win.webContents.send('gohome'); return; }   // the Xbox button, tapped: inside a game it brings back that game's page, anywhere else the home page
  if (asHome === true) { if (wasAway) gameAudio(true); win.webContents.send('gohome'); return; }   // Share, tapped: straight to the console's home page
  if (wasAway) { if (asHome === false && running) { kbMenuOpen = true; kbMenuAt = Date.now(); } gameAudio(true); win.webContents.send(asHome === false ? 'guide' : 'homebtn', asHome === false); return; }   // holding Share inside a game opens the Xbox menu itself (B goes back into the game)   // coming back from an app, a web page or a game: the console comes back and shows where you were (the game's page says Running, the picture and trailer return); the Xbox menu opens on the next tap
  win.webContents.send('guide');
}
let detectAt = 0;
ipcMain.handle('game:status', () => { if (!running && Date.now() - detectAt > 20000) { detectAt = Date.now(); detectRunning().catch(() => {}); } return running ? { title: running.title } : null; });   // answers at once; the search for a game started elsewhere runs in the background
ipcMain.handle('win:keyboard', () => { try { const cp = require('child_process'); cp.spawn('cmd.exe', ['/c', 'start', '', 'osk.exe'], { windowsHide: true, detached: true, stdio: 'ignore' }).unref(); try { if (win) win.minimize(); } catch {} log('windows on-screen keyboard opened'); return { ok: true }; } catch (e) { log('windows keyboard failed: ' + e.message); return { ok: false }; } });   // the game's own sign-in boxes can't use the console keyboard, so Windows' keyboard opens over the game
ipcMain.handle('game:close', () => closeGame(true));   // Close game always closes it right away
process.on('uncaughtException', (e) => { try { log('uncaught: ' + (e && e.stack || e)); } catch {} });   // a window that is already gone must never show an error box
let xpad = false, lastBatt = { type: 0, level: 0 }, lastChg = { chg: false, pct: -1 }, chgProc = null;
const battNow = () => Object.assign({}, lastBatt, lastChg);
function startChargeWatch() {   // is the controller charging? (Windows knows; XInput does not)
  if (process.platform !== 'win32' || chgProc) return;
  try {
    chgProc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'native', 'charge.ps1')], { windowsHide: true });
    let b = ''; chgProc.stdout.on('data', (d) => { b += d; let i; while ((i = b.indexOf('\n')) >= 0) { const l = b.slice(0, i).trim(); b = b.slice(i + 1); const m = /^chg (\w+) (-?\d+)$/.exec(l); if (m) { lastChg = { chg: m[1] === 'Charging', pct: +m[2] }; try { if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) win.webContents.send('cbatt', battNow()); } catch {} } } });
    chgProc.on('exit', () => { chgProc = null; }); chgProc.on('error', () => { chgProc = null; }); chgProc.stderr.on('data', () => {});
  } catch { chgProc = null; }
}
ipcMain.handle('pad:status', () => xpad);
ipcMain.handle('app:user', () => { try { return require('os').userInfo().username; } catch { return ''; } });
async function resumeGame(fix) {   // the game's real window is found again (it may differ from the one seen at launch), restored and given the screen
  if (!win || !running) return false;
  if (running.hwnd && helper) {   // instant: the window seen before is brought forward at once, and checked a moment later
    const q = String(running.hwnd); consoleToBack(); sendHelper('front ' + q);
    setTimeout(async () => { try { if (!running || !win || win.isFocused()) return; if ((await fgHwnd()) !== q) { running.hwnd = ''; await resumeGame(fix); } } catch {} }, 900);
    return true;
  }
  let hw = '';
  try {
    const pr = await probe(running.folder, 0, coverTitle(running.title));
    const m = pr.list.filter((x) => x.inDir || x.title).sort((a, b) => b.w * b.h - a.w * a.h)[0];
    if (m) { hw = m.hwnd; running.pid = m.pid; running.pname = m.name; }
    else { const gp = (pr.procs || []).find((x) => x.hwnd && x.hwnd !== '0'); if (gp) { hw = gp.hwnd; running.pid = gp.pid; } }
  } catch {}
  if (!hw) { const g = (await procsIn(running.folder, true)).find((p) => p.win); if (g) hw = g.hwnd; }
  if (!hw) hw = running.hwnd || '';
  if (!hw) return false;
  running.hwnd = hw;
  consoleToBack(); sendHelper('front ' + hw); await bringWindow(hw);
  if (fix) { await sleep(900); sendHelper('key altenter'); }
  return true;
}
ipcMain.handle('game:resume', async (_e, fix) => {
  if (!win) return true;
  kbMenuOpen = false; kbMenuAt = Date.now();   // back in the game by any route: the Pause key's menu state starts again
  if (!(await resumeGame(fix))) { try { win.webContents.setAudioMuted(true); } catch {} gameAudio(false); win.minimize(); }
  return true;
});
// ---- the Xbox button toggles: console <-> the app, web page or game you were in ----
let extKind = '', extHwnd = '', extActive = false, extResume = false, awayT = null, awayOn = false;
let watcher = null;
function watchSend(s) { try { if (watcher && watcher.stdin.writable) watcher.stdin.write(s + '\n'); } catch {} }
let reclaimUntil = 0, reclaimT = null;
function reclaimFocus() {   // after a page or app closes, make sure the console really has the focus again (otherwise the controller does nothing)
  reclaimUntil = Date.now() + 9000; clearInterval(reclaimT);
  reclaimT = setInterval(() => { if (!win || Date.now() > reclaimUntil || mouseState || extActive || launching || running) { clearInterval(reclaimT); return; } if (!win.isFocused() || win.isMinimized()) bringToFront(true, reclaimUntil - 9000); else clearInterval(reclaimT); }, 600);
}
function takeBack() {   // the page/app you opened is gone: the console gets the screen, the focus AND the controller back, in one go
  extHwnd = ''; extActive = false; extResume = false; setAway(false);
  setMouse(false, true);   // always: helper off, console told, console in front (even if it thought it was already off)
  if (win) { win.webContents.send('homebtn'); reclaimFocus(); }
}
function awayIdle() {   // the app, page or game was closed and nothing is in front: bring the console back so the controller never gets stuck
  if (running || launching) return;   // a game that is running or starting is never mistaken for a closed page
  if (!(extActive && !launching && win && !win.isFocused())) return;
  takeBack();
}
function startWatcher() {   // its own little process, so it can never get in the way of the controller helper
  if (watcher || process.platform !== 'win32') return;
  try {
    watcher = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'native', 'watch.ps1')], { windowsHide: true });
    let buf = ''; watcher.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (l === 'idle' || l === 'gone') awayIdle(); } });
    watcher.stderr.on('data', (d) => log('watcher: ' + d)); watcher.on('exit', () => { watcher = null; }); watcher.stdin.on('error', () => {});
  } catch (e) { log('watcher: ' + e.message); watcher = null; }
}
function setAway(on) {
  clearInterval(awayT); awayT = null; awayOn = !!on;
  if (!on) { watchSend('off'); return; }
  startWatcher();
  let lastHB = '';
  const homeBox = () => { try { const { screen } = require('electron'); if (win && !win.isMinimized()) { const d = screen.getDisplayMatching(win.getBounds()), r = screen.dipToScreenRect ? screen.dipToScreenRect(null, d.bounds) : d.bounds; lastHB = Math.round(r.x) + ' ' + Math.round(r.y) + ' ' + Math.round(r.width) + ' ' + Math.round(r.height); } } catch {} return lastHB; };
  homeBox();
  awayT = setInterval(() => { if (awayOn && extActive && win && !launching) watchSend('on ' + consoleHwnd() + ' ' + (/^\d+$/.test(extHwnd) ? extHwnd : '0') + (homeBox() ? ' ' + lastHB : '')); }, 3000);
}
ipcMain.handle('ext:set', (_e, kind) => { extKind = kind === 'game' ? 'game' : 'web'; extHwnd = kind === 'game' ? '' : ''; extActive = true; extResume = false; setAway(true); return true; });
ipcMain.handle('ext:close', async (_e, mode) => {   // close the open tab (Ctrl+W) or the whole window of the web page / app you launched from the console
  const h = extHwnd;
  if (mode !== 'tab') {
    if (extKind === 'game') return { ok: false, error: 'Use Close game for games.' };
    if (!extHwnd || !helper) return { ok: false, error: 'Nothing is open right now.' };
  }
  if (mode === 'tab' && findChrome()) {   // works any time, even if you never opened a page from the console: Chrome windows that were already open are closed too   // "close all tabs": Chrome is asked to close every window it has (including ones that were already open before), the same as closing it by hand
    try {   // Chrome's windows are closed one after another (the way you would click each X), until none is left; closing one window never closes the others, so it repeats
      const ps = "1..14 | ForEach-Object { $w = @(Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }); if ($w.Count -eq 0) { return }; foreach ($p in $w) { [void]$p.CloseMainWindow() }; Start-Sleep -Milliseconds 350 }";
      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', ps], { windowsHide: true, timeout: 20000 }, (err) => { if (err) log('close all tabs: ' + err.message); });
    } catch (e) { log('close all tabs: ' + e.message); }
    setTimeout(() => { extHwnd = ''; extActive = false; extResume = false; try { bringToFront(); } catch {} }, 900);
  }
  else if (mode === 'tab') { if (!h || !helper) return { ok: false, error: 'Chrome is not installed here, and nothing is open.' }; setMouse(true, true, 700); sendHelper('front ' + h); setTimeout(() => sendHelper('key ctrlw'), 500); setTimeout(() => { try { bringToFront(); } catch {} }, 1200); }
  else { sendHelper('closewin ' + h); setTimeout(() => { extHwnd = ''; extActive = false; extResume = false; }, 800); }
  return { ok: true };
});
async function resumeExternal() {
  if (!extKind || !win) return false;
  if (extKind === 'game') { const ok = await resumeGame(false); if (ok) { extActive = true; extResume = false; win.webContents.send('ext:resumed'); } return ok; }
  if (!extHwnd || !helper) return false;
  extActive = true; extResume = false;
  setMouse(true, true, 700); sendHelper('front ' + extHwnd);
  win.webContents.send('ext:resumed');
  return true;
}

// ---- per-game menu: install / uninstall / folder / store (nothing is ever deleted by this app) ----
const pf = process.env.ProgramFiles || 'C:\\Program Files', pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
const STORE_SEARCH = { 'Steam': 'https://store.steampowered.com/search/?term=', 'Epic Games': 'https://store.epicgames.com/en-US/browse?q=', 'GOG': 'https://www.gog.com/en/games?query=',
  'Ubisoft Connect': 'https://store.ubisoft.com/us/search?q=', 'EA app': 'https://www.ea.com/search?q=', 'Xbox': 'https://www.xbox.com/en-US/search?q=' };
const LAUNCHER_EXE = {
  'Ubisoft Connect': [path.join(pf86, 'Ubisoft', 'Ubisoft Game Launcher', 'UbisoftConnect.exe')],
  'EA app': [path.join(pf, 'Electronic Arts', 'EA Desktop', 'EA Desktop', 'EADesktop.exe')],
  'Epic Games': [path.join(pf86, 'Epic Games', 'Launcher', 'Portal', 'Binaries', 'Win64', 'EpicGamesLauncher.exe'), path.join(pf86, 'Epic Games', 'Launcher', 'Portal', 'Binaries', 'Win32', 'EpicGamesLauncher.exe')],
  'GOG': [path.join(pf86, 'GOG Galaxy', 'GalaxyClient.exe')],
  'Rockstar': [path.join(pf, 'Rockstar Games', 'Launcher', 'Launcher.exe')],
};
function openLauncher(source) {
  const p = (LAUNCHER_EXE[source] || []).find((x) => fs.existsSync(x));
  if (!p) return false;
  spawn(p, [], { detached: true, stdio: 'ignore' }).unref(); return true;
}
const LAUNCHER_PROC = { 'Steam': ['steam.exe', 'steamwebhelper.exe'], 'Ubisoft Connect': ['UbisoftConnect.exe', 'upc.exe'], 'EA app': ['EADesktop.exe'], 'Epic Games': ['EpicGamesLauncher.exe'], 'GOG': ['GalaxyClient.exe'] };
function procRunning(names) {
  return new Promise((res) => execFile('tasklist', ['/FO', 'CSV', '/NH'], { windowsHide: true, timeout: 8000 }, (err, out) => { const t = String(out || '').toLowerCase(); res(!err && names.some((n) => t.includes('"' + n.toLowerCase() + '"'))); }));
}
async function ensureLauncher(source) {   // open the store app if it is closed and wait until it is really up, so a link sent next is not lost
  const names = LAUNCHER_PROC[source]; if (!names) return true;
  if (await procRunning(names)) return true;
  if (!openLauncher(source)) return false;
  const end = Date.now() + 40000;
  while (Date.now() < end) { await sleep(1000); if (await procRunning(names)) { await sleep(source === 'Ubisoft Connect' ? 7000 : 4000); return true; } }
  return true;
}
const UBI_KNOWN = { assassinscreedodyssey: '5059', watchdogs: '274', watchdogs2: '2688', ghostreconwildlands: '1771', farcry5: '1803' };   // ids confirmed by hand; everything else is looked up
const ubiNorm = (t) => String(t || '').toLowerCase().replace(/[™®©]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
async function ubisoftIdFor(title) {   // best effort: this PC's own Ubisoft Connect list first, then a public list of Ubisoft game ids (kept for a month)
  const want = ubiNorm(title).replace(/^tomclancys?/, ''); if (!want) return null;
  if (UBI_KNOWN[want]) return UBI_KNOWN[want];
  try {
    const f = path.join(process.env.LOCALAPPDATA || '', 'Ubisoft Game Launcher', 'cache', 'configuration', 'configurations');
    const txt = fs.readFileSync(f).toString('latin1'), low = txt.toLowerCase(), t = String(title).toLowerCase().replace(/[™®©]/g, '').trim();
    let i = low.indexOf('name: ' + t); if (i < 0) i = low.indexOf('name: "' + t + '"'); if (i < 0) i = low.indexOf(t);
    if (i >= 0) { const seg = txt.slice(Math.max(0, i - 2500), i + 2500); const m = seg.match(/\b(?:uplay_id|app_id|launch_id|installer_id)\W{1,4}(\d{2,6})\b/); if (m) { log('ubisoft id (local) for ' + title + ': ' + m[1]); return m[1]; } }
  } catch {}
  try {
    const cf = path.join(themeDir(), 'ubi-ids.txt'); let list = '';
    try { if (Date.now() - fs.statSync(cf).mtimeMs < 30 * 86400000) list = fs.readFileSync(cf, 'utf8'); } catch {}
    if (!list) { const r = await fetch('https://raw.githubusercontent.com/iArtorias/ubisoft_game_ids/main/UBI_GAMES.txt', { signal: AbortSignal.timeout(15000) }); if (r.ok) { list = await r.text(); if (list.length > 2000) fs.writeFileSync(cf, list); } else log('ubisoft id list: http ' + r.status); }
    let best = null;
    for (const ln of list.split(/\r?\n/)) {
      const m = ln.match(/\b(\d{1,6})\b/); if (!m) continue; const name = ubiNorm(ln.replace(/\b\d+\b/g, ' ').replace(/\|/g, ' ')).replace(/^tomclancys?/, ''); if (!name) continue;
      if (name === want) { best = { id: m[1], len: 0 }; break; }
      if (name.startsWith(want) && (!best || name.length < best.len)) best = { id: m[1], len: name.length };
    }
    if (best) { log('ubisoft id (list) for ' + title + ': ' + best.id); return best.id; }
    log('ubisoft id not found for ' + title + ' (list ' + list.length + ' chars; sample: ' + JSON.stringify(list.slice(0, 160)) + ')');
  } catch (e) { log('ubisoft id lookup failed: ' + (e && e.message)); }
  return null;
}
async function gameAction(g, act) {
  const web = (u) => shell.openExternal(u);
  if (act === 'folder') {
    try { if (g.folder && fs.statSync(g.folder).isDirectory()) { await shell.openPath(g.folder); return { ok: true }; } } catch {}
    return { ok: false, error: 'The install folder was not found.' };
  }
  if (act === 'store') {
    if (g.steamId && /^\d+$/.test(g.steamId)) await web('https://store.steampowered.com/app/' + g.steamId);
    else if (g.slug) await web('https://www.gog.com/game/' + g.slug);
    else if (STORE_SEARCH[g.source]) await web(STORE_SEARCH[g.source] + encodeURIComponent(g.title));
    else await web('https://www.google.com/search?q=' + encodeURIComponent(g.title + ' game'));
    return { ok: true, note: 'Opened in your browser.' };
  }
  if (act === 'install') {
    if (g.steamId && /^\d+$/.test(g.steamId)) { await web('steam://install/' + g.steamId); return { ok: true, note: 'Steam is opening its install window.' }; }
    if (g.uri && /^com\.epicgames\.launcher:\/\//.test(g.uri)) { await ensureLauncher('Epic Games'); await web(g.uri); return { ok: true, note: 'The Epic launcher should start the install.' }; }
    if (g.slug) { await web('https://www.gog.com/game/' + g.slug); return { ok: true, note: 'Opened the GOG page. Install it from there.' }; }
    if (g.source === 'Ubisoft Connect') {
      const ready = await ensureLauncher('Ubisoft Connect'), uid = g.ubiId || await ubisoftIdFor(g.title);
      if (uid) { await web('uplay://install/' + uid); return { ok: true, note: 'Ubisoft Connect is opening its install window.' }; }
      return { ok: ready, note: 'Opened Ubisoft Connect. Find the game in your library there and press Install.' };
    }
    if (g.source === 'EA app' || g.source === 'GOG') { await ensureLauncher(g.source); return { ok: true, note: 'Opened ' + g.source + '. Find the game in your library there and press Install.' }; }
    if (openLauncher(g.source)) return { ok: true, note: 'Opened ' + g.source + '. Find the game in your library there and press Install.' };
    return gameAction(g, 'store');
  }
  if (act === 'uninstall') {
    if (g.steamId && /^\d+$/.test(g.steamId)) { await web('steam://uninstall/' + g.steamId); return { ok: true, note: 'Steam is asking you to confirm the uninstall.' }; }
    try {
      if (g.folder && fs.statSync(g.folder).isDirectory()) {
        const u = fs.readdirSync(g.folder).find((x) => /^(unins\d*|uninstall)\.exe$/i.test(x));
        if (u) { spawn(path.join(g.folder, u), /^unins\d*\.exe$/i.test(u) ? ['/VERYSILENT', '/NORESTART'] : [], { cwd: g.folder, detached: true, stdio: 'ignore' }).unref(); return { ok: true, note: /^unins\d*\.exe$/i.test(u) ? 'Removing the game in the background. Rescan your library in a minute.' : "Opened the game's own uninstaller. Follow its steps." }; }
      }
    } catch {}
    await web('ms-settings:appsfeatures');
    return { ok: true, note: 'Opened Windows Installed apps. Find the game and choose Uninstall (or uninstall it inside its launcher).' };
  }
  return { ok: false, error: 'Unknown action.' };
}
const instStarted = new Map(), instSamples = new Map(), instSize = new Map();
const sizeMemo = new Map();
async function sizeEstimate(title) {   // these launchers never say how big a game is: the Steam store's "storage needed" figure for the same game is the best stand-in
  const key = ubiNorm(title); if (sizeMemo.has(key)) return sizeMemo.get(key);
  const f = path.join(themeDir(), 'sizes.json'); let db = {}; try { db = JSON.parse(fs.readFileSync(f, 'utf8')) || {}; } catch {}
  const hit = db[key]; if (hit && (hit.b || Date.now() - (hit.t || 0) < 3 * 86400000)) { sizeMemo.set(key, hit.b || 0); return hit.b || 0; }
  let bytes = 0;
  try {
    const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' };
    const sr = await (await fetch('https://store.steampowered.com/api/storesearch/?term=' + encodeURIComponent(String(title).replace(/[™®©]/g, '')) + '&l=english&cc=US', { headers: H, signal: AbortSignal.timeout(12000) })).json();
    const want = ubiNorm(title).replace(/^tomclancys?/, ''), it = (sr.items || []).find((x) => ubiNorm(x.name).replace(/^tomclancys?/, '') === want) || (sr.items || []).find((x) => ubiNorm(x.name).replace(/^tomclancys?/, '').startsWith(want));
    if (it && it.id) {
      const d = await (await fetch('https://store.steampowered.com/api/appdetails?appids=' + it.id + '&filters=pc_requirements&cc=US&l=english', { headers: H, signal: AbortSignal.timeout(12000) })).json();
      const rq = (((d || {})[it.id] || {}).data || {}).pc_requirements || {}, txt = String((rq.minimum || '') + ' ' + (rq.recommended || '')).replace(/<[^>]+>/g, ' ');
      const m = txt.match(/(\d+(?:[.,]\d+)?)\s*(GB|MB)\s*(?:of\s*)?(?:available\s*)?(?:space|storage|HD|hard)/i) || txt.match(/(?:storage|hard drive|disk space)[^0-9]{0,40}(\d+(?:[.,]\d+)?)\s*(GB|MB)/i);
      if (m) bytes = Math.round(parseFloat(m[1].replace(',', '.')) * (/gb/i.test(m[2]) ? 1073741824 : 1048576));
    }
  } catch (e) { log('size estimate failed for ' + title + ': ' + (e && e.message)); }
  db[key] = { b: bytes, t: Date.now() }; try { fs.writeFileSync(f, JSON.stringify(db)); } catch {}
  sizeMemo.set(key, bytes); log('size estimate for ' + title + ': ' + (bytes ? (bytes / 1073741824).toFixed(1) + ' GB' : 'none')); return bytes;
}
const uiaWatch = new Map(), uiaSeen = new Set(), uiaConfirmed = new Set();
let lastBack = 0;
function backToConsole() {   // you pressed Confirm or Cancel in a launcher's install box: the console takes the screen straight back (the only time it does so without you using the controller)
  if (Date.now() - lastBack < 600) return; lastBack = Date.now(); try { bringToFront(false); } catch {}
}
function watchInstallDialog(gid, source, title) {   // reads the launcher's own window (Windows UI Automation) to see its install confirm box open and close
  const procs = LAUNCHER_PROC[source]; if (!procs || process.platform !== 'win32') return;
  try { const old = uiaWatch.get(gid); if (old) old.kill(); } catch {}
  uiaSeen.delete(gid); uiaConfirmed.delete(gid);
  let ch; try { ch = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'native', 'dialog.ps1'), '-Procs', procs.map((x) => x.replace(/\.exe$/i, '')).join(','), '-Title', title], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { log('dialog watch failed: ' + e.message); return; }
  uiaWatch.set(gid, ch); let buf = '';
  ch.stdout.on('data', (d) => {
    buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const ln = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (ln.startsWith('dbg ')) log('install dialog scan (' + source + '): ' + ln.slice(4));
      else if (ln === 'open') { uiaSeen.add(gid); log('install dialog open: ' + title); }
      else if (ln === 'precancel') { instStarted.delete(gid); instCancelAt.delete(gid); uiaConfirmed.delete(gid); try { win.webContents.send('inst', gid); } catch {} }   // the very moment Cancel is pressed the page goes back to Install; the screen comes back once the button is let go
      else if (ln === 'cancel') { log('install cancelled in the launcher: ' + title); instStarted.delete(gid); instCancelAt.delete(gid); uiaConfirmed.delete(gid); try { win.webContents.send('inst', gid); } catch {} backToConsole(); }
      else if (ln === 'confirm') { uiaConfirmed.add(gid); instCancelAt.delete(gid); backToConsole(); }
      else if (ln === 'closed' && instStarted.has(gid) && !uiaConfirmed.has(gid)) {
        log('install dialog closed: ' + title);
        if (source === 'Steam') setTimeout(() => { try {   // Steam writes its install file within a moment of Install being pressed: no file means the box was cancelled
          if (!instStarted.has(gid) || uiaConfirmed.has(gid)) return;
          const gg = loadLib().games.find((x) => x.id === gid), started = gg && gg.steamId && steamDirs(loadLib().folders).some((d) => fs.existsSync(path.join(d, 'appmanifest_' + gg.steamId + '.acf')));
          if (!started) { log('steam install declined: ' + title); instStarted.delete(gid); instCancelAt.delete(gid); try { win.webContents.send('inst', gid); } catch {} backToConsole(); }
        } catch {} }, 900);
        instCancelAt.set(gid, Date.now() + (source === 'Epic Games' ? 3500 : source === 'Steam' ? 4000 : 7000)); }
    }
  });
  ch.on('exit', () => { if (uiaWatch.get(gid) === ch) uiaWatch.delete(gid); });
}
const steamDlg = new Map();   // game id -> true once Steam's own "Install - <game>" window has been seen
function steamWindowTitles() {
  return new Promise((res) => execFile('tasklist', ['/V', '/FO', 'CSV', '/NH', '/FI', 'IMAGENAME eq steamwebhelper.exe'], { windowsHide: true, timeout: 8000, maxBuffer: 4e6 }, (err, out) => {
    const t = []; if (!err) for (const ln of String(out || '').split(/\r?\n/)) { const m = ln.match(/,"([^"]*)"\s*$/); if (m && m[1] && m[1] !== 'N/A') t.push(m[1]); }
    res(t);
  }));
}
const instGrow = new Map();
function launcherGameDir(source, title) {   // where Ubisoft Connect / the EA app put a game while it downloads
  const roots = source === 'Ubisoft Connect' ? [path.join(pf86, 'Ubisoft', 'Ubisoft Game Launcher', 'games'), path.join(pf, 'Ubisoft', 'Ubisoft Game Launcher', 'games')]
    : source === 'EA app' ? [path.join(pf, 'EA Games'), path.join(pf86, 'EA Games'), path.join(pf, 'Electronic Arts'), path.join(pf86, 'Origin Games')] : [];
  const want = ubiNorm(title).replace(/^tomclancys?/, ''); if (!want) return null;
  for (const r of roots) { let ents; try { ents = fs.readdirSync(r, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) { if (!e.isDirectory()) continue; const n = ubiNorm(e.name).replace(/^tomclancys?/, ''); if (n && (n === want || n.startsWith(want) || want.startsWith(n))) return path.join(r, e.name); } }
  return null;
}
const instCancelAt = new Map(); let instAway = false;   // you pressed Install, went to the other monitor, then came back with nothing started: the install was cancelled
async function dirSizeAsync(dir, depth) {
  let n = 0; if (depth < 0) return 0;
  let ents; try { ents = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return 0; }
  for (const e of ents) { const p = path.join(dir, e.name); if (e.isDirectory()) n += await dirSizeAsync(p, depth - 1); else { try { n += (await fs.promises.stat(p)).size; } catch {} } }
  return n;
}
async function installStatus(gid) {   // is this game being installed right now, how far along, and how long is left
  const l = loadLib(), g = l.games.find((x) => x.id === gid); if (!g) return { state: 'none' };
  let state = 'idle', total = 0, done = 0, approx = false;
  try {
    if (g.steamId && /^\d+$/.test(g.steamId)) {
      for (const d of steamDirs(l.folders)) {
        const f = path.join(d, 'appmanifest_' + g.steamId + '.acf'); if (!fs.existsSync(f)) continue;
        const txt = fs.readFileSync(f, 'utf8'), num = (k) => parseInt((txt.match(new RegExp('"' + k + '"\\s+"(\\d+)"')) || [])[1] || '0', 10);
        if (num('StateFlags') & 4) { state = 'done'; break; }
        total = num('BytesToDownload') + num('BytesToStage'); done = num('BytesDownloaded') + num('BytesStaged');
        state = total > 0 ? 'installing' : 'waiting'; break;
      }
    } else if (g.uri && /^com\.epicgames\.launcher:\/\//.test(g.uri)) {
      const app = decodeURIComponent((g.uri.match(/apps\/([^?]+)/) || [])[1] || '').split(':').pop();
      const dir = path.join(process.env.ProgramData || 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests');
      for (const f of fs.readdirSync(dir).filter((x) => /\.item$/i.test(x))) {
        let mm; try { mm = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
        if (mm.AppName !== app) continue;
        if (!mm.bIsIncompleteInstall && mm.InstallLocation && fs.existsSync(mm.InstallLocation)) { state = 'done'; break; }
        total = Number(mm.InstallSize) || Number(mm.DownloadSize) || 0;
        const c = instSize.get(gid), now = Date.now();
        if (c && now - c.t < 4000) done = c.n; else { done = mm.InstallLocation ? await dirSizeAsync(mm.InstallLocation, 8) : 0; instSize.set(gid, { t: now, n: done }); }
        state = 'installing'; break;
      }
    }
  } catch {}
  if (state === 'idle' && (g.source === 'Ubisoft Connect' || g.source === 'EA app') && (instStarted.has(gid) || instGrow.has(gid) || launcherGameDir(g.source, g.title))) {   // these launchers give no progress file: watch the game's folder grow instead
    try {
      const dir = launcherGameDir(g.source, g.title);
      if (dir) {
        const c = instSize.get(gid), now = Date.now(); let n;
        if (c && now - c.t < 2500) n = c.n; else { n = await dirSizeAsync(dir, 8); instSize.set(gid, { t: now, n }); }
        let gr = instGrow.get(gid); if (!gr) { gr = { n: instStarted.has(gid) ? 0 : n, at: 0 }; instGrow.set(gid, gr); }   // an old folder that is not growing is not an install
        if (n > gr.n) { gr.n = n; gr.at = now; }
        if (gr.at && now - gr.at < 40000) { state = 'installing'; done = n; total = await sizeEstimate(g.title); if (total && done > total * 0.985) total = Math.round(done / 0.985); instCancelAt.delete(gid); approx = true; }
        else if (gr.at && now - gr.at >= 40000 && n > 0) { state = 'done'; instGrow.delete(gid); }
      }
    } catch {}
  }
  if (state === 'idle' && instStarted.has(gid) && g.steamId && /^\d+$/.test(g.steamId)) {   // Steam's confirm window is a real window: when it closes with nothing started, the install was declined
    try {
      const nm = ubiNorm(g.title), tl = await steamWindowTitles(), open = tl.some((x) => /^install\b/i.test(x) && ubiNorm(x).includes(nm));
      if (open) steamDlg.set(gid, true);
      else if (steamDlg.get(gid) && Date.now() - instStarted.get(gid) > 3000) { await sleep(1500); const f = path.join(steamDirs(l.folders)[0] || '', 'appmanifest_' + g.steamId + '.acf'); if (!fs.existsSync(f)) { instStarted.delete(gid); steamDlg.delete(gid); } }
    } catch {}
  }
  { const ca = instCancelAt.get(gid); if (state === 'idle' && ca && Date.now() > ca) { instStarted.delete(gid); instCancelAt.delete(gid); } }
  if (state === 'idle' && instStarted.has(gid) && Date.now() - instStarted.get(gid) < 180000) state = 'waiting';
  if (state === 'done' || state === 'idle') { instSamples.delete(gid); if (state === 'done') instStarted.delete(gid); return { state }; }
  let eta = null, speed = 0;
  if (state === 'installing' && total > 0) {
    const now = Date.now(), s = instSamples.get(gid) || []; s.push({ t: now, d: done }); while (s.length > 2 && now - s[0].t > 90000) s.shift(); instSamples.set(gid, s);
    const a = s[0], dt = (now - a.t) / 1000; if (dt >= 6 && done > a.d) { speed = (done - a.d) / dt; eta = Math.round((total - done) / speed); }
  }
  return { state, pct: total > 0 ? Math.max(0, Math.min(1, done / total)) : 0, eta, speed, total, done, approx };
}
ipcMain.handle('install:status', (_e, gid) => installStatus(String(gid || '')));
const updSeen = new Map();   // game id -> { t, n, at }: last folder size and when it last grew
async function launcherUpdateInfo(g) {   // Epic, Ubisoft, EA, GOG...: they publish no "update needed" file, but an update in progress always writes into the game's folder
  try {
    const dir = g.folder; if (!dir || !fs.statSync(dir).isDirectory()) return null;
    try { if (fs.readdirSync(path.join(dir, '.egstore', 'bps')).length) return { needsUpdate: true, updating: true, updatePct: 0 }; } catch {}   // Epic keeps its download pieces here while updating
    const now = Date.now(); let c = updSeen.get(g.id);
    if (!c || now - c.t > 12000) { const n = await dirSizeAsync(dir, 3); if (!c) c = { t: now, n, at: 0 }; else { if (n > c.n) c.at = now; c.n = n; c.t = now; } updSeen.set(g.id, c); }
    return c.at && now - c.at < 25000 ? { needsUpdate: true, updating: true, updatePct: 0 } : { needsUpdate: false };
  } catch { return null; }
}
ipcMain.handle('game:updinfo', async (_e, gid) => { try { const l = loadLib(), g = l.games.find((x) => x.id === gid); if (!g || g.installed === false) return null; return g.steamId ? steamUpdateInfo(g, steamDirs(l.folders)) : await launcherUpdateInfo(g); } catch { return null; } });
ipcMain.handle('game:update', async (_e, gid) => {   // Steam starts the update itself when the game is started; the console stays on top and the launcher windows stay hidden
  try {
    const g = loadLib().games.find((x) => x.id === gid);
    if (!g) return { ok: false, error: 'Game not found.' };
    if (!g.steamId || !/^\d+$/.test(String(g.steamId))) return { ok: true, note: g.title + ' is updating in ' + (g.source || 'its launcher') + '. It will say Play when it is done.' };
    hideLaunchers(60); holdTop(8000, true);
    await shell.openExternal('steam://rungameid/' + g.steamId);
    return { ok: true, note: 'Steam is updating ' + g.title + '.' };
  } catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('game:action', async (_e, gid, act) => {
  const g = loadLib().games.find((x) => x.id === gid);
  if (!g || !['install', 'uninstall', 'folder', 'store'].includes(act)) return { ok: false, error: 'Unknown action.' };
  if (act === 'install') { instStarted.set(gid, Date.now()); instCancelAt.delete(gid); steamDlg.delete(gid); sideLaunchers(40); }
  if (act === 'uninstall') sideLaunchers(60);   // the launcher's confirmation window opens on the other monitor
  try { const r = await gameAction(g, act); if (act === 'install') watchInstallDialog(gid, g.steamId ? 'Steam' : g.source, g.title); return r; } catch (e) { return { ok: false, error: e.message }; }
});

// ---- game library (never modifies or deletes game files) ----
const libFile = () => path.join(app.getPath('userData'), 'library.json');
function loadLib() {
  try {
    const l = JSON.parse(fs.readFileSync(libFile(), 'utf8'));
    return { folders: (l.folders || []).filter((f) => typeof f === 'string'), games: Array.isArray(l.games) ? l.games.map((g) => (g && /^ROBLOXCorporation\./i.test(g.pfn || '') ? { ...g, title: 'Roblox' } : g)).filter((g) => !(g && /^Microsoft\.[0-9A-F]{8,}/i.test(g.title || ''))) : [], excluded: Array.isArray(l.excluded) ? l.excluded : [], owned: l.owned && typeof l.owned === 'object' ? l.owned : {}, manual: Array.isArray(l.manual) ? l.manual : [], meta: l.meta && typeof l.meta === 'object' ? l.meta : {} };
  } catch { return { folders: [], games: [], excluded: [], owned: {}, manual: [], meta: {} }; }
}
function saveLib(l) { try { fs.writeFileSync(libFile(), JSON.stringify(l, null, 2)); } catch (e) { log('lib save failed: ' + e.message); } }
const hid = (s) => crypto.createHash('sha1').update(s.toLowerCase()).digest('hex').slice(0, 12);
const SKIP_EXE = /(unins|setup|redist|vcredist|dxsetup|dotnet|crash|helper|updater|installer|config|benchmark|oalinst|physx|easyanticheat|eac_|notification)/i;
const SKIP_DIR = /^(_?commonredist|redist|__installer|directx|vcredist|\$|node_modules|_redist)/i;
function cleanTitle(n) {
  return n.replace(/\[[^\]]*\]|\([^)]*\)/g, ' ').replace(/fitgirl.*$/i, ' ').replace(/[-_. ]*steamrip\b/ig, ' ')
    .replace(/\bv?\d+(\.\d+){1,}\b.*$/, ' ').replace(/[_.]+/g, ' ').replace(/\s+/g, ' ').trim() || n;
}
function findExes(dir, depth, out) {
  if (depth < 0 || out.length > 300) return out;
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIR.test(e.name)) findExes(p, depth - 1, out); }
    else if (/\.exe$/i.test(e.name) && !SKIP_EXE.test(e.name)) { try { out.push({ p, size: fs.statSync(p).size }); } catch {} }
  }
  return out;
}
function steamDirs(roots) {
  const dirs = new Set(), add = (d) => { if (d && fs.existsSync(d)) dirs.add(d); };
  const base = path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Steam', 'steamapps');
  add(base);
  try {
    const vdf = fs.readFileSync(path.join(base, 'libraryfolders.vdf'), 'utf8');
    for (const m of vdf.matchAll(/"path"\s+"([^"]+)"/g)) add(path.join(m[1].replace(/\\\\/g, '\\'), 'steamapps'));
  } catch {}
  for (const r of roots) { if (/steamapps$/i.test(r)) add(r); else add(path.join(r, 'steamapps')); }
  return [...dirs];
}
// ---- other launchers: installed games, read from each launcher's own local files ----
function regQuery(key) {
  let out = '';
  try { out = spawnSync('reg', ['query', key, '/s'], { encoding: 'utf8', windowsHide: true }).stdout || ''; } catch { return []; }
  const secs = []; let cur = null;
  for (const line of out.split(/\r?\n/)) {
    if (/^HKEY_/i.test(line)) { cur = { key: line.trim(), v: {} }; secs.push(cur); }
    else if (cur) { const m = line.match(/^\s+(.+?)\s+REG_\w+\s*(.*)$/); if (m) cur.v[m[1]] = m[2]; }
  }
  return secs;
}
function launcherScan() {
  const out = [], safe = (x) => /^[\w.-]+$/.test(x || '');
  try {   // Roblox (the Windows player from roblox.com, or the Microsoft Store one): added as a game that opens Roblox
    const rv = path.join(process.env.LOCALAPPDATA || '', 'Roblox', 'Versions');
    let rb = '', appx = false; try { for (const d of fs.readdirSync(rv)) { if (fs.existsSync(path.join(rv, d, 'RobloxPlayerBeta.exe'))) rb = path.join(rv, d); } } catch {}
    if (!rb) { try { const pk = path.join(process.env.LOCALAPPDATA || '', 'Packages'); for (const d of fs.readdirSync(pk)) { if (/^ROBLOXCORPORATION\.ROBLOX/i.test(d)) { rb = path.join(pk, d); appx = true; } } } catch {} }
    if (rb) out.push({ id: 'roblox', title: 'Roblox', source: 'Roblox', uri: 'roblox://', appx, folder: rb });   // the Microsoft Store version is already found by the Xbox/Game Pass scan (one card, not two)
  } catch {}
  try {   // Epic Games
    const dir = path.join(process.env.ProgramData || 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests');
    for (const f of fs.readdirSync(dir).filter((x) => /\.item$/i.test(x))) {
      try {
        const m = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        if (!m.DisplayName || !safe(m.AppName)) continue;
        if (m.MainGameAppName && m.MainGameAppName !== m.AppName) continue;
        const ref = safe(m.CatalogNamespace) && safe(m.CatalogItemId) ? `${m.CatalogNamespace}%3A${m.CatalogItemId}%3A${m.AppName}` : m.AppName;
        out.push({ id: 'epic' + m.AppName, title: m.DisplayName, source: 'Epic Games', folder: m.InstallLocation, uri: `com.epicgames.launcher://apps/${ref}?action=launch&silent=true` });
      } catch {}
    }
  } catch {}
  for (const s of regQuery('HKLM\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs')) {   // Ubisoft Connect
    const id = s.key.split('\\').pop(), dir = s.v.InstallDir;
    if (/^\d+$/.test(id) && dir) out.push({ id: 'ubi' + id, title: path.basename(path.resolve(dir)), source: 'Ubisoft Connect', folder: dir, uri: `uplay://launch/${id}/0` });
  }
  for (const s of regQuery('HKLM\\SOFTWARE\\WOW6432Node\\GOG.com\\Games')) {   // GOG
    const v = s.v;
    if (v.gameName && v.exe && /^\d+$/.test(v.gameID || '')) out.push({ id: 'gog' + v.gameID, title: v.gameName, source: 'GOG', folder: v.path, exe: v.exe });
  }
  const bestExe = (dir) => { try { const e = findExes(dir, 1, []).sort((a, b) => b.size - a.size)[0]; return e && e.p; } catch { return null; } };
  const addFolderGame = (prefix, source, title, dir) => {
    if (!dir || !title) return;
    const exe = bestExe(dir);
    if (exe) out.push({ id: prefix + hid(path.resolve(dir)), title, source, folder: dir, exe });
  };
  for (const s of regQuery('HKLM\\SOFTWARE\\WOW6432Node\\Rockstar Games')) {   // Rockstar
    const name = s.key.split('\\').pop();
    if (!/launcher|social club|^rockstar games$/i.test(name)) addFolderGame('rock', 'Rockstar', name, s.v.InstallFolder);
  }
  for (const s of regQuery('HKLM\\SOFTWARE\\WOW6432Node\\EA Games')) addFolderGame('ea', 'EA app', s.key.split('\\').pop(), s.v['Install Dir']);   // EA
  try {
    const eaRoot = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'EA Games');
    for (const e of fs.readdirSync(eaRoot, { withFileTypes: true })) if (e.isDirectory()) addFolderGame('ea', 'EA app', e.name, path.join(eaRoot, e.name));
  } catch {}
  return out.concat(xboxScan());
}
let xboxCache = null, xboxAsked = false;
const XBOX_PS = "Get-AppxPackage | Where-Object { $_.InstallLocation -and (Test-Path (Join-Path $_.InstallLocation 'MicrosoftGame.config')) } | ForEach-Object { $m = Get-AppxPackageManifest $_; [pscustomobject]@{ n=$_.Name; f=$_.PackageFamilyName; l=$_.InstallLocation; a=@($m.Package.Applications.Application)[0].Id } } | ConvertTo-Json -Compress";
function xboxRefresh() {   // v795: the Game Pass scan takes about 5 seconds; it used to run inside the main process and froze the whole console at startup. Now it runs in the background and the result is remembered.
  execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', XBOX_PS], { encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 8 * 1024 * 1024 }, (err, out) => {
    try { const j = JSON.parse(out || '[]'); const l = Array.isArray(j) ? j : [j]; if (!err && JSON.stringify(l) !== JSON.stringify(xboxCache || [])) { xboxCache = l; fs.writeFileSync(path.join(app.getPath('userData'), 'xbox-cache.json'), JSON.stringify(l)); log('xbox scan: ' + l.length + ' apps (saved for the next library scan)'); } } catch {}
  });
}
function xboxScan() {   // Xbox / Game Pass games (apps that contain a MicrosoftGame.config)
  if (xboxCache === null) { try { xboxCache = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'xbox-cache.json'), 'utf8')); } catch { xboxCache = []; } }
  if (!xboxAsked) { xboxAsked = true; setTimeout(xboxRefresh, 20000); }
  const list = xboxCache;
  return list.filter((p) => p && /^[\w.-]+_[a-z0-9]+$/i.test(p.f || '') && /^[\w.-]+$/.test(p.a || '') && !/^Microsoft\.[0-9A-F]{8,}/i.test(p.n || '') && !/^ROBLOXCorporation\./i.test(p.n || p.f || '')).map((p) => {   // store packages without a real game name (like Microsoft.4297127D64EC6) are not shown
    const m = (p.l || '').match(/XboxGames\\([^\\]+)/i);
    return { id: 'xbox' + p.f, title: /^ROBLOXCorporation\.Roblox/i.test(p.n || '') ? 'Roblox' : (m ? m[1] : p.n), source: 'Xbox', pfn: p.f + '!' + p.a, folder: p.l };
  });
}
function steamId64() {
  const sec = regQuery('HKCU\\Software\\Valve\\Steam')[0], sp = sec && sec.v.SteamPath;
  const files = [sp && path.join(sp, 'config', 'loginusers.vdf'), path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Steam', 'config', 'loginusers.vdf')];
  for (const f of files) {
    if (!f) continue;
    try {
      let first = null;
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/"(\d{17})"\s*\{([^}]*)\}/g)) { first = first || m[1]; if (/"MostRecent"\s+"1"/.test(m[2])) return m[1]; }
      if (first) return first;
    } catch {}
  }
  return null;
}
async function steamOwned() {   // official Steam Web API, using your own free key; your game list must be public
  const key = loadSettings().steamKey, id = steamId64();
  if (!key || !id) return [];
  try {
    const r = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${id}&include_appinfo=1&include_played_free_games=1&format=json`, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    return ((j.response && j.response.games) || []).filter((g) => g.name).map((g) => ({ id: 'steam' + g.appid, title: g.name, source: 'Steam', steamId: String(g.appid), installed: false }));
  } catch (e) { log('steam owned failed: ' + e.message); return []; }
}

async function scanAll(l) {
  const found = [];
  for (const d of steamDirs(l.folders)) {
    let files = []; try { files = fs.readdirSync(d).filter((f) => /^appmanifest_\d+\.acf$/.test(f)); } catch {}
    for (const f of files) {
      try {
        const txt = fs.readFileSync(path.join(d, f), 'utf8'), name = (txt.match(/"name"\s+"([^"]+)"/) || [])[1];
        const appid = f.match(/\d+/)[0];
        const fl = parseInt((txt.match(/"StateFlags"\s+"(\d+)"/) || [])[1] || '4', 10), idir = (txt.match(/"installdir"\s+"([^"]+)"/) || [])[1];
        if ((fl & 4) === 0 || (idir && !fs.existsSync(path.join(d, 'common', idir)))) continue;   // a leftover or half-finished download is not an installed game
        if (name && !/redistributable|steamworks|proton|runtime/i.test(name)) found.push({ id: 'steam' + appid, title: name, source: 'Steam', steamId: appid, folder: (() => { const i = (txt.match(/"installdir"\s+"([^"]+)"/) || [])[1]; return i ? path.join(d, 'common', i) : undefined; })() });
      } catch {}
    }
  }
  const claimed = new Set();
  for (const g of launcherScan()) { found.push(g); if (g.folder) claimed.add(path.resolve(g.folder).toLowerCase()); }
  for (const root of l.folders) {
    if (/steamapps/i.test(root)) continue;
    let subs = []; try { subs = fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory() && !SKIP_DIR.test(e.name)); } catch { continue; }
    for (const s of subs) {
      const folder = path.join(root, s.name);
      if (claimed.has(path.resolve(folder).toLowerCase())) continue;
      const exes = findExes(folder, 2, []).sort((a, b) => b.size - a.size);
      if (exes.length) found.push({ id: hid(folder), title: cleanTitle(s.name), source: 'Standalone', folder, exe: exes[0].p });
    }
  }
  const have = new Set(found.map((g) => g.id));
  for (const g of await steamOwned()) if (!have.has(g.id)) { found.push(g); have.add(g.id); }
  const owned = await accountGames(l);
  for (const g of owned) { const f = found.find((x) => x.id === g.id); if (f && g.source === 'Ubisoft Connect' && g.title) f.title = g.title; }   // installed Ubisoft games get their real name
  for (const g of owned) {
    if (g.ubiSpace) { const f = found.find((x) => x.source === 'Ubisoft Connect' && x.id !== g.id && ubiNorm(x.title).replace(/^tomclancys?/, '') === ubiNorm(g.title).replace(/^tomclancys?/, '')); if (f) continue; }   // already there as an installed game
    if (!have.has(g.id)) { found.push(g); have.add(g.id); }
  }
  mergeManual(l, found);
  const old = new Map(l.games.map((g) => [g.id, g]));
  l.games = [...new Map(found.map((g) => [g.id, g])).values()].filter((g) => !l.excluded.includes(g.id)).map((g) => (old.has(g.id) && !/^ROBLOXCorporation\./i.test(g.pfn || '') ? { ...g, title: old.get(g.id).title } : g)).map((g) => ({ ...g, installed: g.installed !== false, addedAt: (old.get(g.id) || {}).addedAt || Date.now() }))
    .sort((a, b) => a.title.localeCompare(b.title));
  saveLib(l);
  return decorate(l);
}

function launchStoreRoblox() {   // starts the Microsoft Store Roblox the way Windows does, and writes down exactly what happened
  const ps = "$ErrorActionPreference='Stop'; try { $p = Get-AppxPackage -Name 'ROBLOXCorporation.*' | Select-Object -First 1; if (-not $p) { 'no package'; exit }; $ids = @((Get-AppxPackageManifest $p).Package.Applications.Application | ForEach-Object { $_.Id }); 'package ' + $p.PackageFamilyName + ' apps ' + ($ids -join ','); $app = $ids | Select-Object -First 1; Start-Process explorer.exe -ArgumentList ('shell:AppsFolder\\' + $p.PackageFamilyName + '!' + $app); 'started' } catch { 'error ' + $_.Exception.Message; try { $a=(Get-StartApps | Where-Object { $_.Name -like 'Roblox*' } | Select-Object -First 1).AppID; if ($a) { Start-Process explorer.exe -ArgumentList ('shell:AppsFolder\\' + $a); 'started via start menu ' + $a } else { Start-Process 'roblox://'; 'started via roblox://' } } catch { 'fallback failed ' + $_.Exception.Message } }";
  try { require('child_process').execFile('powershell.exe', ['-NoProfile', '-Command', ps], { windowsHide: true, timeout: 30000 }, (e, o, er) => log('roblox launch: ' + String(o || '').replace(/\s+/g, ' ').trim() + (er ? ' | err ' + String(er).slice(0, 200) : '') + (e ? ' | ' + e.message : ''))); } catch (e) { log('roblox launch failed: ' + e.message); shell.openExternal('roblox://'); }
}
async function launchGame(gid) {
  const g = loadLib().games.find((x) => x.id === gid);
  if (!g) return { ok: false, error: 'Game not found. Rescan your library.' };
  if (g.manual && g.installed === false) return { ok: false, error: 'Not installed. Install it from ' + g.source + ', then press Rescan.' };
  if (running && g.installed !== false) return { ok: false, error: running.title + ' is running. Press the Xbox button, then choose Close game.' };
  if (g.installed === false && g.slug) {
    if (!/^[\w-]+$/.test(g.slug)) return { ok: false, error: 'Invalid store link.' };
    await shell.openExternal('https://www.gog.com/game/' + g.slug);
    return { ok: true };
  }
  if (g.pfn && /^ROBLOXCorporation\./i.test(g.pfn)) {
    launchStoreRoblox();
    afterLaunch(g);
    return { ok: true };
  }
  if (g.pfn) {
    if (!/^[\w.-]+_[a-z0-9]+![\w.-]+$/i.test(g.pfn)) return { ok: false, error: 'Invalid Xbox app.' };
    spawn('explorer.exe', ['shell:AppsFolder\\' + g.pfn], { detached: true, stdio: 'ignore' }).unref();
    afterLaunch(g);
    return { ok: true };
  }
  if (g.steamId) {
    if (!/^\d+$/.test(g.steamId)) return { ok: false, error: 'Invalid Steam ID.' };
    await shell.openExternal((g.installed === false ? 'steam://install/' : 'steam://rungameid/') + g.steamId);
    if (g.installed !== false) afterLaunch(g);
    return { ok: true };
  }
  if (g.uri) {
    if (!/^(com\.epicgames\.launcher|uplay|roblox):\/\//.test(g.uri)) return { ok: false, error: 'Unsupported launch link.' };
    if (g.id === 'roblox' && g.appx) launchStoreRoblox();
    else await shell.openExternal(g.uri);
    if (g.installed !== false) afterLaunch(g);
    return { ok: true };
  }
  try {
    if (typeof g.exe !== 'string' || !path.isAbsolute(g.exe) || !/\.exe$/i.test(g.exe) || !fs.statSync(g.exe).isFile()) throw new Error('missing');
  } catch { return { ok: false, error: 'The game file is missing or moved. Rescan your library.' }; }
  return new Promise((resolve) => {
    const c = spawn(g.exe, [], { cwd: path.dirname(g.exe), detached: true, stdio: 'ignore' });
    c.on('error', (e) => resolve({ ok: false, error: 'Could not start: ' + e.message }));
    c.on('spawn', () => { resolve({ ok: true }); afterLaunch(g); });
    c.on('exit', () => { if (!running) bringToFront(); });
    c.unref();
  });
}
let achCache = { t: 0, v: null };
function steamIds64() {   // every Steam account that has signed in on this PC, the most recent first
  const sec = regQuery('HKCU\\Software\\Valve\\Steam')[0], sp = sec && sec.v.SteamPath;
  const files = [sp && path.join(sp, 'config', 'loginusers.vdf'), path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Steam', 'config', 'loginusers.vdf')];
  const out = [];
  for (const f of files) {
    if (!f) continue;
    try { for (const m of fs.readFileSync(f, 'utf8').matchAll(/"(\d{17})"\s*\{([^}]*)\}/g)) { if (!out.includes(m[1])) { if (/"MostRecent"\s+"1"/.test(m[2])) out.unshift(m[1]); else out.push(m[1]); } } } catch {}
  }
  return out;
}
ipcMain.handle('ach:summary', async (_e, force) => {   // Steam achievements across your library (needs your Steam key and public game details)
  try {
    const key = loadSettings().steamKey, ids = steamIds64();
    if (!key) return { ok: false, why: 'nokey' };
    if (!ids.length) return { ok: false, why: 'noid' };
    if (!force && achCache.v && achCache.v.ok && Date.now() - achCache.t < 15 * 60000) return achCache.v;
    let owned = [], id = '';
    for (const c of ids) {   // the first account whose game list Steam will share
      try {
        const r = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${c}&include_appinfo=1&include_played_free_games=1&format=json`, { signal: AbortSignal.timeout(20000) });
        if (r.status === 403 || r.status === 401) { log('achievements: Steam rejected the key (' + r.status + ')'); return { ok: false, why: 'badkey' }; }
        const j = await r.json(), list = (j.response && j.response.games) || [];
        log('achievements: account ' + c + ' shares ' + list.length + ' games');
        if (list.length) { owned = list; id = c; break; }
      } catch (e) { log('achievements owned: ' + e.message); }
    }
    if (!id) return { ok: false, why: 'private' };
    setPlay(owned);
    const libIds = new Set(decorate(loadLib()).filter((g) => g.steamId && g.installed !== false).map((g) => String(g.steamId)));
    const cand = owned.filter((g) => (g.playtime_forever || 0) > 0 || libIds.has(String(g.appid))).sort((x, y) => (y.playtime_forever || 0) - (x.playtime_forever || 0)).slice(0, 90);
    let got = 0, total = 0, perfect = 0, counted = 0, top = null, errs = {}; const per = [];
    const one = async (g) => {
      try {
        const r = await fetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${key}&steamid=${id}&appid=${g.appid}`, { signal: AbortSignal.timeout(12000) });
        const j = await r.json(), ps = j && j.playerstats;
        if (!ps) { errs['http ' + r.status] = (errs['http ' + r.status] || 0) + 1; return; }
        if (ps.success === false) { const k = String(ps.error || 'failed').slice(0, 40); errs[k] = (errs[k] || 0) + 1; return; }
        const list = ps.achievements || []; if (!list.length) return;
        const d = list.filter((x) => x.achieved).length;
        got += d; total += list.length; counted++; per.push({ appid: g.appid, title: g.name || '', got: d, total: list.length }); if (d === list.length) perfect++;
        if (!top || d / list.length > top.got / top.total) top = { title: g.name || '', got: d, total: list.length };
      } catch (e) { errs[e.message.slice(0, 30)] = (errs[e.message.slice(0, 30)] || 0) + 1; }
    };
    for (let i = 0; i < cand.length; i += 8) await Promise.all(cand.slice(i, i + 8).map(one));
    log('achievements: checked ' + cand.length + ', ' + counted + ' have achievements (' + got + '/' + total + '); skipped: ' + JSON.stringify(errs));
    per.sort((a, b) => (b.got / b.total) - (a.got / a.total) || b.total - a.total);
    const v = { ok: true, got, total, perfect, games: counted, top, list: per };
    achCache = { t: Date.now(), v, id }; return v;
  } catch (e) { log('achievements: ' + e.message); return { ok: false, why: 'error' }; }
});
let steamPlay = (() => { try { return JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'steam-play.json'), 'utf8')); } catch { return {}; } })();
let steamPlayT = 0, steamPlayBusy = null;
function setPlay(list) {   // your real Steam play time and last-played dates, from your public profile
  const m = {}; for (const g of list) m[String(g.appid)] = { m: g.playtime_forever || 0, t: g.rtime_last_played || 0 };
  steamPlay = m; steamPlayT = Date.now();
  try { fs.writeFileSync(path.join(app.getPath('userData'), 'steam-play.json'), JSON.stringify(m)); } catch {}
}
function refreshSteamPlay() {
  if (steamPlayBusy) return steamPlayBusy;
  steamPlayBusy = (async () => {
    try {
      const key = loadSettings().steamKey; if (!key) return;
      for (const c of steamIds64()) {
        try {
          const r = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${c}&include_appinfo=1&include_played_free_games=1&format=json`, { signal: AbortSignal.timeout(15000) });
          const list = ((await r.json()).response || {}).games || [];
          if (list.length) { setPlay(list); log('steam play time: ' + list.length + ' games from account ' + c); return; }
        } catch (e) { log('steam play time: ' + e.message); }
      }
      log('steam play time: Steam shared no games (is Game details public, and is the key right?)');
    } finally { steamPlayBusy = null; }
  })();
  return steamPlayBusy;
}
let deadlockClean = false;
ipcMain.handle('lib:get', async () => {
  if (!deadlockClean) { deadlockClean = true; try { const l = loadLib(); for (const g of l.games) { if (/^deadlock$/i.test(String(coverTitle(g.title) || g.title).trim())) { const x = l.meta[g.id]; if (x && x.trailer) { dropTrailer(x.trailer); dropTrailer(x.trailerAudio); for (const f of ['trailer', 'trailerAudio', 'trailerV', 'trailerA', 'trailerQ', 'trailerH', 'trailerSrc', 'trailerYt']) delete x[f]; saveLib(l); } } } } catch {} }
  if (Date.now() - steamPlayT > 2 * 60000) await Promise.race([refreshSteamPlay(), new Promise((r) => setTimeout(r, 4000))]);
  return decorate(loadLib());
});
const achImgCache = new Map();
async function steamPortraitUrls(id) {   // newer Steam games keep their tall cover under a hashed address (the plain library_600x900 one does not exist): ask the store for the real file names
  const urls = [];
  try {
    const r = await fetch('https://api.steampowered.com/IStoreBrowseService/GetItems/v1?input_json=' + encodeURIComponent(JSON.stringify({ ids: [{ appid: Number(id) }], context: { language: 'english', country_code: 'US' }, data_request: { include_assets: true } })), { signal: AbortSignal.timeout(15000) });
    if (r.ok) { const it = ((await r.json()).response || {}).store_items, a = it && it[0] && it[0].assets, base = 'https://shared.steamstatic.com/store_item_assets/'; if (a && a.asset_url_format) { const fm = (n) => base + String(a.asset_url_format).replace('${FILENAME}', n); if (a.library_capsule_2x) urls.push(fm(a.library_capsule_2x)); if (a.library_capsule) urls.push(fm(a.library_capsule)); } }
  } catch {}
  return urls;
}
async function steamImg(url) {   // a small Steam picture, returned as a data: URI the page can show
  if (achImgCache.has(url)) return achImgCache.get(url);
  try { const r = await fetch(url, { signal: AbortSignal.timeout(10000) }); if (!r.ok) { achImgCache.set(url, ''); return ''; } const b = Buffer.from(await r.arrayBuffer()); if (b.length > 600000) return ''; const u = 'data:image/' + (/\.png/.test(url) ? 'png' : 'jpeg') + ';base64,' + b.toString('base64'); achImgCache.set(url, u); return u; } catch { return ''; }
}
ipcMain.handle('ach:art', async (_e, ids) => {   // the real Steam cover for games that are not in the library list
  const out = {}; const list = (Array.isArray(ids) ? ids : []).filter((x) => /^\d{1,9}$/.test(String(x))).slice(0, 120);
  for (let i = 0; i < list.length; i += 6) await Promise.all(list.slice(i, i + 6).map(async (id) => { out[id] = (await steamImg(`https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/library_600x900.jpg`)) || (await steamImg(`https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`)); }));
  return out;
});
ipcMain.handle('ach:detail', async (_e, appid) => {   // every achievement of one game: name, description, Steam badge, how rare, unlocked or not
  try {
    const key = loadSettings().steamKey, id = achCache.id || steamIds64()[0];
    if (!key || !id || !/^\d{1,9}$/.test(String(appid))) return { ok: false };
    const [pr, sr, gr] = await Promise.all([
      fetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${key}&steamid=${id}&appid=${appid}&l=english`, { signal: AbortSignal.timeout(15000) }),
      fetch(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${key}&appid=${appid}&l=english`, { signal: AbortSignal.timeout(15000) }).catch(() => null),
      fetch(`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appid}`, { signal: AbortSignal.timeout(15000) }).catch(() => null),
    ]);
    const ps = (await pr.json()).playerstats;
    if (!ps || ps.success === false) return { ok: false };
    const schema = {}; try { const j = sr && await sr.json(); for (const x of ((j && j.game && j.game.availableGameStats && j.game.availableGameStats.achievements) || [])) schema[x.name] = x; } catch {}
    const pct = {}; try { const j = gr && await gr.json(); for (const x of ((j && j.achievementpercentages && j.achievementpercentages.achievements) || [])) pct[x.name] = Number(x.percent); } catch {}
    const list = (ps.achievements || []).map((a) => { const sc = schema[a.apiname] || {}; return { k: a.apiname, n: a.name || sc.displayName || a.apiname, d: a.description || sc.description || '', a: !!a.achieved, t: a.unlocktime || 0, p: pct[a.apiname] != null ? pct[a.apiname] : -1, ic: a.achieved ? sc.icon : (sc.icongray || sc.icon) }; });
    list.sort((x, y) => (y.a - x.a) || (y.t - x.t) || (y.p - x.p));
    const shown = list.slice(0, 160);
    for (let i = 0; i < shown.length; i += 10) await Promise.all(shown.slice(i, i + 10).map(async (x) => { x.i = x.ic && /^https:\/\/([a-z0-9.-]+\.)?(steamstatic\.com|akamaihd\.net|steampowered\.com)\//.test(x.ic) ? await steamImg(x.ic) : ''; }));
    for (const x of list) delete x.ic;
    return { ok: true, title: ps.gameName || '', list };
  } catch { return { ok: false }; }
});
ipcMain.handle('lib:scan', () => scanAll(loadLib()));
ipcMain.handle('lib:addFolder', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Choose a folder that contains your games', properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths[0]) return null;
  const l = loadLib(); if (!l.folders.includes(r.filePaths[0])) l.folders.push(r.filePaths[0]);
  return scanAll(l);
});
ipcMain.handle('lib:remove', (_e, gid) => {
  const l = loadLib(); if (typeof gid !== 'string') return decorate(l);
  l.excluded.push(gid); l.manual = l.manual.filter((m) => m.id !== gid); l.games = l.games.filter((g) => g.id !== gid); saveLib(l); return decorate(l);
});
ipcMain.handle('lib:rename', (_e, gid, title) => {
  const l = loadLib(), g = l.games.find((x) => x.id === gid);
  if (g && typeof title === 'string' && title.trim() && title.length <= 120) { g.title = title.trim(); saveLib(l); }
  return decorate(l);
});
let topT = null;
let genHoldUntil = 0, ftSent = '';
let pinNow = '0', regainNow = false, padLogAt = 0, meSent = '', sgNow = '';
function setPin(v, idle) { const k = v + (idle && v !== '0' ? ' idle' : ''); if (k === pinNow) return; pinNow = k; sendHelper('pin ' + k); }
function pinTick() {   // whenever the console is the thing on screen (no game, no app in front, no keyboard) it stays above the taskbar and everything else, so nothing can show around it
  try {
    if (!win || win.isDestroyed() || !helper || topT) return;
    const osk = oskWin && !oskWin.isDestroyed() && oskWin.isVisible();
    const want = win.isVisible() && !win.isMinimized() && !running && !launching && !extActive && !dlgOpen && !osk;
    setPin(want ? consoleHwnd() : '0', true);   // resting on Home etc.: a window you open yourself on this monitor (a screenshot tool, Alt+Tab) is allowed to come up
    const rg = win.isVisible() && !win.isMinimized() && !running && !launching && !mouseState && !dlgOpen && !osk;
    const sg = rg && !extActive && !appFade && Date.now() > genHoldUntil ? sideArgs() : '';   // not while a game is starting: its window must stay where it opens
    if (sg !== sgNow) { sgNow = sg; sendHelper(sg ? 'sidegen on ' + sg : 'sidegen off'); }   // pop-ups that open on the console's monitor are sent to the other one
    if (meSent !== consoleHwnd()) { meSent = consoleHwnd(); sendHelper('me ' + meSent); }
    const gh = running && running.hwnd && !launching && !mouseState ? String(running.hwnd) : '';   // while a game runs, the controller pulls the focus back to the GAME when you were on the other monitor
    if (gh !== ftSent) { ftSent = gh; sendHelper('ftarget ' + (gh || '0')); }
    const fw = rg || !!gh;
    if (fw !== regainNow) { regainNow = fw; sendHelper('fwd ' + (fw ? 'on' : 'off')); }   // the console never takes the focus by itself any more: only when you use the controller
  } catch {}
}
setInterval(pinTick, 250);
let blurHook = false;
let topAct = false;
function holdTop(ms, act) {
  topAct = !!act;   // act: a game is starting, so the console also keeps re-raising itself like before
  if (!blurHook && win) { blurHook = true; win.on('blur', () => { if (topT) { try { if (!win.isAlwaysOnTop()) win.setAlwaysOnTop(true, 'screen-saver'); if (launching || topAct) win.moveTop(); } catch {} } }); }   // while a game opens the console keeps itself above everything (taskbar included) so Windows never shows the desktop around it
  clearInterval(topT); const end = Date.now() + ms;
  const go = () => { if (!win || Date.now() > end) { clearInterval(topT); topT = null; setPin('0'); return; } try { if (!win.isFullScreen()) win.setFullScreen(true); { const wb = win.getBounds(), db = require('electron').screen.getDisplayMatching(wb).bounds; if (wb.x !== db.x || wb.y !== db.y || wb.width !== db.width || wb.height !== db.height) win.setBounds(db); } if (!win.isAlwaysOnTop()) win.setAlwaysOnTop(true, 'screen-saver'); if ((launching || topAct) && !win.isFocused()) win.moveTop(); } catch {} };   // moveTop activates the window, so it is only used while a game is opening; only re-asserts when something took the top, so it never flickers against a window that is opening
  setPin(consoleHwnd());
  go(); topT = setInterval(go, 100);
}
ipcMain.handle('lib:launch', (_e, gid) => { genHoldUntil = Date.now() + 150000; openWithUntil = Date.now() + 150000; try { win.setAlwaysOnTop(true, 'screen-saver'); win.moveTop(); } catch {} holdTop(20000, true); hideLaunchers(150); pointerHome(); const r = launchGame(gid); Promise.resolve(r).then((x) => { if (!x || x.ok === false) { clearInterval(topT); topT = null; setPin('0'); try { sendHelper('unpark'); } catch {} } }).catch(() => {}); return r; });

// ---- per-game themes: your own background picture and color for each game ----
const THEME_FILE = /^[a-f0-9]{12}-[a-z0-9]+\.jpg$/;
const themeDir = () => { const d = path.join(app.getPath('userData'), 'themes'); fs.mkdirSync(d, { recursive: true }); return d; };
function dropThemeFile(name) { if (typeof name === 'string' && THEME_FILE.test(name)) { try { fs.unlinkSync(path.join(themeDir(), name)); } catch {} } }
ipcMain.handle('theme:pick', async (_e, gid) => {
  const l = loadLib();
  if (!l.games.some((g) => g.id === gid)) return null;
  const r = await dialog.showOpenDialog(win, { title: 'Choose a background picture', properties: ['openFile'], filters: [{ name: 'Pictures', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  try {
    if (fs.statSync(r.filePaths[0]).size > 40 * 1024 * 1024) throw new Error('file too large');
    let img = nativeImage.createFromPath(r.filePaths[0]);
    if (img.isEmpty()) throw new Error('unreadable picture');
    if (img.getSize().width > 3840) img = img.resize({ width: 3840, quality: 'best' });
    const name = hid(gid) + '-' + Date.now().toString(36) + '.jpg';
    fs.writeFileSync(path.join(themeDir(), name), img.toJPEG(94));
    const old = (l.meta[gid] || {}).theme || {};
    dropThemeFile(old.bgFile);
    l.meta[gid] = { ...(l.meta[gid] || {}), theme: { ...old, bgFile: name } };
    saveLib(l); return decorate(l);
  } catch (e) { log('theme pick failed: ' + e.message); return { error: 'Could not use that picture.' }; }
});
ipcMain.handle('theme:set', (_e, gid, patch) => {
  const l = loadLib();
  if (!l.games.some((g) => g.id === gid)) return null;
  const old = (l.meta[gid] || {}).theme || {}, m = { ...(l.meta[gid] || {}) };
  if (patch && typeof patch === 'object') {
    const t = { ...old };
    if (typeof patch.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(patch.color)) t.color = patch.color;
    m.theme = t;
  } else { dropThemeFile(old.bgFile); delete m.theme; }
  l.meta[gid] = m; saveLib(l); return decorate(l);
});

// ---- profile picture and startup screen ----
const AVATAR_RE = /^avatar-[a-z0-9]+\.jpg$/;
function dropAvatar(name) { if (AVATAR_RE.test(name || '')) { try { fs.unlinkSync(path.join(themeDir(), name)); } catch {} } }
ipcMain.handle('avatar:pick', async () => {
  const r = await openFileMouse({ title: 'Choose a profile picture', properties: ['openFile'], filters: [{ name: 'Pictures', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  try {
    if (fs.statSync(r.filePaths[0]).size > 40 * 1024 * 1024) throw new Error('file too large');
    let img = nativeImage.createFromPath(r.filePaths[0]);
    if (img.isEmpty()) throw new Error('unreadable picture');
    const { width, height } = img.getSize(), side = Math.min(width, height);
    img = img.crop({ x: Math.floor((width - side) / 2), y: Math.floor((height - side) / 2), width: side, height: side }).resize({ width: 256, height: 256, quality: 'best' });
    const name = 'avatar-' + Date.now().toString(36) + '.jpg', cur = loadSettings();
    fs.writeFileSync(path.join(themeDir(), name), img.toJPEG(90));
    dropAvatar(cur.avatarFile);
    return { settings: saveSettings({ ...cur, avatarFile: name }) };
  } catch (e) { log('avatar failed: ' + e.message); return { error: 'Could not use that picture.' }; }
});
async function openFileMouse(opts) {   // the Windows file picker on the desktop, driven by the controller as a mouse (the console steps aside while it is open)
  const was = mouseState;
  try { setMouse(true, true); await new Promise((r) => setTimeout(r, 900)); } catch {}
  try { return await dialog.showOpenDialog(opts); } finally { try { if (!was) setMouse(false, true); } catch {} }
}
ipcMain.handle('avatar:open', async () => {   // choose a picture; it goes to the on-screen cropper (move and zoom inside a circle)
  const r = await dialog.showOpenDialog(win, { title: 'Choose a profile picture', properties: ['openFile'], filters: [{ name: 'Pictures', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'webp'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  try {
    if (fs.statSync(r.filePaths[0]).size > 40 * 1024 * 1024) throw new Error('file too large');
    let img = nativeImage.createFromPath(r.filePaths[0]);
    if (img.isEmpty()) throw new Error('unreadable picture');
    const { width, height } = img.getSize(), big = Math.max(width, height);
    if (big > 1200) img = img.resize(width >= height ? { width: 1200 } : { height: 1200 }, { quality: 'best' });
    const sz = img.getSize();
    return { src: 'data:image/jpeg;base64,' + img.toJPEG(92).toString('base64'), w: sz.width, h: sz.height };
  } catch (e) { log('avatar open failed: ' + e.message); return { error: 'Could not use that picture.' }; }
});
ipcMain.handle('avatar:save', (_e, dataUrl) => {
  try {
    const mm = /^data:image\/jpeg;base64,([A-Za-z0-9+\/=]+)$/.exec(String(dataUrl || '')); if (!mm || mm[1].length > 2000000) throw new Error('bad picture');
    const img = nativeImage.createFromBuffer(Buffer.from(mm[1], 'base64')); if (img.isEmpty()) throw new Error('unreadable picture');
    const name = 'avatar-' + Date.now().toString(36) + '.jpg', cur = loadSettings();
    fs.writeFileSync(path.join(themeDir(), name), img.resize({ width: 256, height: 256, quality: 'best' }).toJPEG(90));
    dropAvatar(cur.avatarFile);
    return { settings: saveSettings({ ...cur, avatarFile: name }) };
  } catch (e) { log('avatar save failed: ' + e.message); return { error: 'Could not save that picture.' }; }
});
ipcMain.handle('avatar:clear', () => { const cur = loadSettings(); dropAvatar(cur.avatarFile); return saveSettings({ ...cur, avatarFile: '' }); });
const VIDEO_RE = /^startup-[a-z0-9]+\.(mp4|webm)$/;
function dropVideo(name) { if (VIDEO_RE.test(name || '')) { try { fs.unlinkSync(path.join(themeDir(), name)); } catch {} } }
ipcMain.handle('introvideo:pick', async () => {   // your own video file, copied next to the console's other data; nothing is downloaded or bundled
  const r = await dialog.showOpenDialog(win, { title: 'Choose a startup video', properties: ['openFile'], filters: [{ name: 'Video', extensions: ['mp4', 'webm'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  try {
    if (fs.statSync(r.filePaths[0]).size > 300 * 1024 * 1024) return { error: 'That video is larger than 300 MB.' };
    const ext = path.extname(r.filePaths[0]).toLowerCase() === '.webm' ? 'webm' : 'mp4';
    const name = 'startup-' + Date.now().toString(36) + '.' + ext, cur = loadSettings();
    await fs.promises.copyFile(r.filePaths[0], path.join(themeDir(), name));
    dropVideo(cur.introVideo);
    return { settings: saveSettings({ ...cur, introVideo: name }) };
  } catch (e) { log('intro video failed: ' + e.message); return { error: 'Could not use that video.' }; }
});
ipcMain.handle('introvideo:clear', () => { const cur = loadSettings(); dropVideo(cur.introVideo); return saveSettings({ ...cur, introVideo: '' }); });
// ---- trailers: a video file you add yourself for each game (copied next to the other console data) ----
const TRAILER_RE = /^trailer-[a-z0-9]+\.(mp4|webm)$/;
function dropTrailer(name) { if (TRAILER_RE.test(name || '')) { try { fs.unlinkSync(path.join(themeDir(), name)); } catch {} } }
ipcMain.handle('trailer:pick', async (_e, gid) => {
  const l = loadLib();
  if (typeof gid !== 'string' || !l.games.some((g) => g.id === gid)) return { error: 'Unknown game.' };
  const r = await dialog.showOpenDialog(win, { title: 'Choose a trailer video (mp4 or webm)', properties: ['openFile'], filters: [{ name: 'Video', extensions: ['mp4', 'webm'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  try {
    if (fs.statSync(r.filePaths[0]).size > 800 * 1024 * 1024) return { error: 'That video is larger than 800 MB.' };
    const ext = path.extname(r.filePaths[0]).toLowerCase() === '.webm' ? 'webm' : 'mp4', name = 'trailer-' + Date.now().toString(36) + '.' + ext;
    await fs.promises.copyFile(r.filePaths[0], path.join(themeDir(), name));
    const l2 = loadLib(), m = l2.meta[gid] || {};
    dropTrailer(m.trailer); dropTrailer(m.trailerAudio);
    l2.meta[gid] = { ...m, trailer: name, trailerAudio: '' }; saveLib(l2);
    return { games: decorate(l2) };
  } catch (e) { log('trailer failed: ' + e.message); return { error: 'Could not use that video.' }; }
});
let trAutoBusy = false;
async function steamAppFor(g) {
  if (g.steamId && /^\d+$/.test(g.steamId)) return g.steamId;
  try {
    const r = await fetch('https://store.steampowered.com/api/storesearch/?term=' + encodeURIComponent(coverTitle(g.title)) + '&l=english&cc=US', { signal: AbortSignal.timeout(12000) });
    const j = await r.json(), want = norm(coverTitle(g.title));
    const hit = (j.items || []).find((x) => norm(coverTitle(x.name)) === want);
    return hit ? String(hit.id) : '';
  } catch { return ''; }
}
async function steamMovie(appid) {
  try {
    const r = await fetch('https://store.steampowered.com/api/appdetails?appids=' + appid + '&filters=movies&cc=us&l=english', { signal: AbortSignal.timeout(14000) });
    const j = await r.json(), mv = (j[appid] && j[appid].data && j[appid].data.movies) || [];
    for (const m of mv) { const u = (m.mp4 && (m.mp4.max || m.mp4['480'])) ? { url: m.mp4.max || m.mp4['480'], ext: 'mp4' } : (m.webm && (m.webm.max || m.webm['480'])) ? { url: m.webm.max || m.webm['480'], ext: 'webm' } : null; if (u) return u; }
    for (const m of mv) { const h = https(m.hls_h264 || ''); if (STEAM_HLS.test(h)) return { hls: h }; }   // Steam now only streams trailers (HLS): we download the pieces and join them
  } catch {}
  return null;
}
ipcMain.handle('trailers:auto', async (_e, gid) => {   // download Steam's own trailer for one game, or for every game that has none
  if (trAutoBusy) return { ok: false, error: 'Trailers are already downloading.' };
  trAutoBusy = true;
  const send = (d) => { try { win && win.webContents.send('trailers:progress', d); } catch {} };
  try {
    const l0 = loadLib();
    const bg = gid === 'bg'; if (bg) gid = undefined;
    const missAt = (id) => Number((loadLib().meta[id] || {}).trailerMissAt || 0), recentMiss = (id) => Date.now() - missAt(id) < 3 * 864e5;
    let list = decorate(l0).filter((g) => g.title && !/^deadlock$/i.test(String(coverTitle(g.title) || g.title).trim()) && (bg ? !(typeof g.trailer === 'string' && TRAILER_RE.test(g.trailer)) && !recentMiss(g.id) : true) && (typeof gid === 'string' || !(typeof g.trailer === 'string' && TRAILER_RE.test(g.trailer) && ((loadLib().meta[g.id] || {}).trailerQ === 2))));   // older (720p) downloads get replaced by the sharpest version
    if (typeof gid === 'string') list = list.filter((g) => g.id === gid);
    let done = 0, ok = 0, miss = 0; const total = list.length;
    for (const g of list) {
      send({ done, total, title: g.title });
      try {
        const app = await steamAppFor(g), mv = app ? await steamMovie(app) : null;
        if (!mv) { log('trailer auto: no trailer found on Steam for ' + g.title); if (bg) { const lm = loadLib(); lm.meta[g.id] = { ...(lm.meta[g.id] || {}), trailerMissAt: Date.now() }; saveLib(lm); } miss++; done++; continue; }
        if (mv.hls) {
          const nm = 'trailer-' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), out = await hlsTrailer({ hls: mv.hls }, path.join(themeDir(), nm));
          const l = loadLib(), m0 = l.meta[g.id] || {}; const oldV = m0.trailer, oldA = m0.trailerAudio; l.meta[g.id] = { ...m0, trailer: out.file, trailerAudio: out.audio || '', trailerV: out.vcodec, trailerA: out.acodec, trailerQ: 2, trailerH: out.h, trailerSrc: 'steam', trailerYt: '' }; saveLib(l);
          for (const f of [oldV, oldA]) { if (f && f !== out.file && f !== out.audio && /^trailer-[a-z0-9]+\.mp4$/.test(f)) { try { fs.unlinkSync(path.join(themeDir(), f)); } catch {} } }
          send({ upd: decorate(loadLib()).find((x) => x.id === g.id), done, total, title: g.title });
          ok++; done++; continue;
        }
        const r = await fetch(mv.url, { signal: AbortSignal.timeout(180000) });
        if (!r.ok) { miss++; done++; continue; }
        const len = Number(r.headers.get('content-length') || 0);
        if (len > 250 * 1024 * 1024) { miss++; done++; continue; }
        const buf = Buffer.from(await r.arrayBuffer()); if (buf.length > 250 * 1024 * 1024 || buf.length < 50 * 1024) { miss++; done++; continue; }
        const name = 'trailer-' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36) + '.' + mv.ext;
        await fs.promises.writeFile(path.join(themeDir(), name), buf);
        const l = loadLib(), m = l.meta[g.id] || {}; l.meta[g.id] = { ...m, trailer: name, trailerAudio: '' }; saveLib(l);
        send({ upd: decorate(loadLib()).find((x) => x.id === g.id), done, total, title: g.title });
        ok++;
      } catch (e) { log('trailer auto ' + g.title + ': ' + e.message); miss++; }
      done++;
    }
    send({ done: total, total, finished: true, ok, miss });
    return { ok: true, count: ok, missing: miss, games: decorate(loadLib()) };
  } catch (e) { return { ok: false, error: e.message }; }
  finally { trAutoBusy = false; }
});

// ---- trailers from YouTube (like Playnite): the newest OFFICIAL trailer of each game, downloaded with yt-dlp (fetched once into the console's own folder) ----
const BIN_DIR = () => path.join(app.getPath('userData'), 'bin');
const YT_EXE = () => path.join(BIN_DIR(), 'yt-dlp.exe'), DENO_EXE = () => path.join(BIN_DIR(), 'deno.exe');
async function fetchTo(url, dest, timeout) {
  const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(timeout || 180000) }); if (!r.ok) throw new Error('HTTP ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer()); const tmp = dest + '.part'; await fs.promises.writeFile(tmp, buf); await fs.promises.rename(tmp, dest); return buf.length;
}
async function ensureYtTools(send) {
  fs.mkdirSync(BIN_DIR(), { recursive: true });
  const fresh = (f, days) => { try { const s = fs.statSync(f); return s.size > 1e6 && Date.now() - s.mtimeMs < days * 86400000; } catch { return false; } };
  if (!fresh(YT_EXE(), 10)) { send({ done: 0, total: 1, title: 'getting the YouTube downloader (one time)' }); try { await fetchTo('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe', YT_EXE()); } catch (e) { log('yt-dlp download: ' + e.message); } }
  if (!fs.existsSync(YT_EXE())) throw new Error('Could not get the YouTube downloader (yt-dlp). Check your internet connection.');
  if (!fs.existsSync(DENO_EXE())) {   // YouTube needs a small JavaScript runtime to give out the HD streams
    try {
      const z = path.join(BIN_DIR(), 'deno.zip'); await fetchTo('https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip', z, 240000);
      await new Promise((res) => { const c = spawn('tar.exe', ['-xf', z, '-C', BIN_DIR()], { windowsHide: true }); c.on('exit', res); c.on('error', res); });
      try { fs.unlinkSync(z); } catch {}
    } catch (e) { log('deno download: ' + e.message); }
  }
}
function runYt(args, timeout) {
  return new Promise((resolve) => {
    const a = ['--no-warnings', '--no-color', '--ignore-config'].concat(fs.existsSync(DENO_EXE()) ? ['--js-runtimes', 'deno:' + DENO_EXE()] : [], args);
    let out = '', err = '', done = false;
    const c = spawn(YT_EXE(), a, { windowsHide: true }), t = setTimeout(() => { try { c.kill(); } catch {} }, timeout || 60000);
    c.stdout.on('data', (d) => { out += d; }); c.stderr.on('data', (d) => { err += d; });
    const fin = (code) => { if (done) return; done = true; clearTimeout(t); resolve({ code, out, err }); };
    c.on('exit', fin); c.on('error', (e) => { err += e.message; fin(-1); });
  });
}
const YT_PS_TITLE = /\bps[345]\b|playstation|state of play/i, YT_PS_GAME = /ghost of tsushima|detroit|last of us|god of war|horizon (zero|forbidden|dawn)|spider-?man|uncharted|returnal|ratchet|days gone|helldivers|until dawn|gran turismo|death stranding|bloodborne|astro bot|stellar blade|infamous|killzone|demon'?s souls/i, YT_PS_DEV = /sony|playstation|naughty dog|sucker punch|guerrilla|insomniac|santa monica|bend studio|housemarque|nixxes|firesprite|polyphony/i;
const YT_FLUFF = new Set(['official', 'trailer', 'launch', 'gameplay', 'reveal', 'cinematic', 'teaser', 'announcement', 'announce', 'announcing', 'new', 'season', 'chapter', 'update', 'live', 'story', 'world', 'release', 'date', 'e3', 'remastered', 'remake', 'definitive', 'edition', 'complete', 'ultimate', 'deluxe', 'goty', 'collection', 'pc', '4k', 'hd', 'uhd', '2k', '1080p', '60fps', 'x', 'overview', 'full', 'extended', 'final', 'story', 'accolades', 'preview', 'early', 'access', 'beta', 'free', 'play', 'now', 'out', 'available', 'coming', 'soon', 'cgi', 'first', 'second', 'third']);
const YT_MOVIE_CH = /pictures|movie|film|cinema|searchlight|lionsgate|universal|paramount|a24|netflix|hbo|disney|trailers?$|\b(ign|gamespot|kotaku|polygon|gamesradar|eurogamer|pcgamer|pc gamer|rotten tomatoes|fandango|jeuxvideo|gametrailers|gameranx|clevver|cinemablend|collider)\b/;   // film studios and news / reupload channels are not a game's own channel
const YT_EDITION = new Set(['edition', 'remastered', 'definitive', 'goty', 'complete', 'deluxe', 'ultimate', 'standard', 'gold', 'the', 'of', 'and', 'a']);
const ytWords = (t) => String(coverTitle(t) || t).toLowerCase().replace(/[®™]/g, '').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w && (w.length > 1 || /\d/.test(w)) && !YT_EDITION.has(w));
const YT_BAD = /reaction|review|walkthrough|let'?s play|tutorial|how to|\bvs\.?\b|fan[- ]?made|concept|parody|breakdown|analysis|explained|tier list|top \d|speedrun|montage|\bost\b|soundtrack|first look|impressions|ranking|mod\b|cheat|leak|xbox|nintendo|\bswitch\b|showcase|live action|red band|\bmovie\b|\bfilm\b|netflix|tv series|tour dates|\btour\b|concert|symphony|orchestra|merch|plush|album|\bseries\b|documentary|game awards|summer game fest|\bdirect\b|livestream|stream/i;   // no console-branded trailers (they start with a PlayStation / Xbox logo)
function ytNameOk(title, words, strict) {   // the video must be about THIS game and not a sequel / spin-off that starts with the same words (Watch Dogs vs Watch Dogs Legion)
  const raw = (String(title).toLowerCase().replace(/[®™']/g, '').match(/[a-z0-9]+|[:\-–—|•×(\[]/g)) || [];
  const al = []; raw.forEach((t, i) => { if (/^[a-z0-9]+$/.test(t) && (t.length > 1 || /\d/.test(t)) && !YT_EDITION.has(t)) al.push({ t, i }); });
  const variants = [words]; if (words.length >= 3) variants.push(words.slice(1)); if (words.length >= 4) variants.push(words.slice(2));
  for (const w of variants) {
    for (let s = 0; s + w.length <= al.length; s++) {
      if (!w.every((x, k) => al[s + k].t === x)) continue;
      if (!strict) return true;
      const endI = al[s + w.length - 1].i; let n = raw[endI + 1]; let q = endI + 1;
      while (n && /^(the|of|and|a)$/.test(n)) { q++; n = raw[q]; }
      if (!n) return true;
      if (!/^[a-z0-9]+$/.test(n)) {   // a subtitle after ":" or "-": only fine when it is about the trailer / season, not another game ("Watch Dogs: Legion")
        const seg = []; for (let z = q + 1; z < raw.length && /^[a-z0-9]+$/.test(raw[z]); z++) seg.push(raw[z]);
        return seg.length === 0 || seg.some((t) => YT_FLUFF.has(t) || /^season$|^chapter$/.test(t)) || seg.length === 0;
      }
      if (YT_FLUFF.has(n)) return true;
      if (/^20[12]\d$/.test(n) && !words.some((x) => /\d/.test(x))) return true;
      return false;
    }
  }
  return false;
}
async function ytPickFan(g) {   // games with no official trailer: the best community-made trailer (most watched, sharp picture)
  const outs = await Promise.all([runYt(['--flat-playlist', '--dump-json', 'ytsearch15:Deadlock Valve fan made trailer'], 70000), runYt(['--flat-playlist', '--dump-json', 'ytsearch15:Deadlock Valve game cinematic trailer'], 70000), runYt(['--flat-playlist', '--dump-json', 'ytsearch10:Deadlock Valve official trailer'], 70000)]);
  const seen = new Set(), cand = [], BADF = /reaction|review|walkthrough|tutorial|how to|tier list|top \d|leak|stream|guide|patch|update notes|build|ranking|\bvs\b/i;
  for (const o of outs) for (const ln of o.out.split(/\r?\n/)) {
    let j; try { j = JSON.parse(ln); } catch { continue; }
    if (!j.id || seen.has(j.id)) continue; seen.add(j.id);
    const title = String(j.title || ''), dur = Number(j.duration || 0);
    if (!/deadlock/i.test(title) || !/trailer|cinematic|teaser|montage|short film|animation/i.test(title) || BADF.test(title) || /playstation|xbox|nintendo/i.test(title)) continue;
    if (!/valve|game|gameplay|hero|steam|moba|shooter|\bdl\b/i.test(title + ' ' + String(j.channel || ''))) continue;
    if (dur && (dur < 20 || dur > 420)) continue;
    cand.push({ id: j.id, title, views: Number(j.view_count || 0), date: String(j.upload_date || ''), sc: 0 });
  }
  cand.sort((a, b) => b.views - a.views); const good = cand.slice(0, 6); if (!good.length) return null;
  for (let i = 0; i < good.length; i += 3) await Promise.all(good.slice(i, i + 3).map(async (c) => {
    const r = await runYt(['--dump-json', '--no-playlist', '--skip-download', 'https://www.youtube.com/watch?v=' + c.id], 70000);
    try { const j = JSON.parse(r.out.split(/\r?\n/).find((x) => x.trim().startsWith('{'))); c.date = String(j.upload_date || c.date || ''); c.h = Math.max(0, ...(j.formats || []).filter((f) => /^(vp0?9|av01|avc1)/.test(f.vcodec || '')).map((f) => f.height || 0)); } catch { c.h = c.h || 0; }
  }));
  const pick = good.find((c) => c.h >= 1440) || good[0]; log('youtube trailer (community-made, no official one exists) for ' + g.title + ': "' + pick.title + '"'); return pick;
}
const LOWTR = (x) => !!x && (x.trailerH || 1080) < 1440 && (!x.trailerLowAt || Date.now() - x.trailerLowAt > 30 * 864e5);   // a trailer below 1440p is looked at again only once a month
const CIN_RE = /cinematic|\bcgi\b|launch trailer|reveal trailer|announce(ment)? trailer|story trailer|world premiere|official trailer|live action/i, CIN_NOT = /gameplay|walkthrough|dev(eloper)? (diary|update)|patch|season \d|update|\bplaytest|beta|showcase/i;
async function ytPickTrailer(g) {

  if (ytWords(g.title).join(' ') === 'deadlock') return null;   // no official trailer exists: Deadlock stays without one
  const words = ytWords(g.title); if (!words.length) return null;
  const others = decorate(loadLib()).map((x) => ytWords(x.title)).filter((w) => w.length > words.length && words.every((x, i) => w[i] === x));   // other games in your library that start with this name (Watch Dogs 2, Watch Dogs Legion): their trailers are not this game's
  const pubWords = (String(g.publisher || '') + ' ' + String(g.developer || '')).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !/^(games|game|entertainment|studios|studio|interactive|publishing|software|limited|inc|corp|corporation|digital|international|company)$/.test(w));
  const ps = YT_PS_GAME.test(g.title) || YT_PS_DEV.test(String(g.publisher || '') + ' ' + String(g.developer || ''));   // PlayStation exclusives may keep their PlayStation intro
  const nm = String(coverTitle(g.title) || g.title).replace(/[®™]/g, '');
  const [s1, s2, s3, s4] = await Promise.all([runYt(['--flat-playlist', '--dump-json', 'ytsearch15:' + nm + ' official trailer'], 70000), runYt(['--flat-playlist', '--dump-json', 'ytsearchdate25:' + nm + ' trailer'], 70000), runYt(['--flat-playlist', '--dump-json', 'ytsearchdate20:' + nm + ' official gameplay trailer'], 70000), runYt(['--flat-playlist', '--dump-json', 'ytsearch15:' + nm + ' official cinematic trailer'], 70000)]);   // best matches AND the newest uploads: the latest trailer is often not the most "relevant" one
  const seen = new Set(), cand = [];
  for (const ln of (s1.out + '\n' + s2.out + '\n' + s3.out + '\n' + s4.out).split(/\r?\n/)) {
    let j; try { j = JSON.parse(ln); } catch { continue; }
    if (!j.id || seen.has(j.id)) continue; seen.add(j.id);
    const title = String(j.title || ''), tl = title.toLowerCase().replace(/[®™]/g, '').replace(/[^a-z0-9 ]+/g, ' '), ch = String(j.channel || j.uploader || '').toLowerCase();
    if (YT_MOVIE_CH.test(ch) || /xbox|nintendo/.test(ch) || (!ps && (/playstation/.test(ch) || YT_PS_TITLE.test(title))) || YT_BAD.test(title) || !/trailer|launch|reveal|announce|cinematic|teaser|gameplay|season|chapter|update|collab|crossover|live action/i.test(title)) continue;   // official trailers, gameplay trailers, season / collab trailers
    if (others.some((o) => ytNameOk(title, o, false))) continue;
    const exact = ytNameOk(title, words, true), loose = exact || ytNameOk(title, words, false);
    if (!loose) continue;
    const dur = Number(j.duration || 0); if (dur && (dur < 20 || dur > 420)) continue;
    let sc = 0; if (/official/i.test(title)) sc += 3; if (j.channel_is_verified) sc += 4;
    if (words.some((w) => w.length > 3 && ch.includes(w))) sc += 3;
    if (/bethesda|ubisoft|electronic arts|\bea\b|epic games|rockstar|2k|activision|blizzard|valve|steam|capcom|sega|bandai|square enix|warner|cd projekt|bungie|riot|psyonix|mediatonic|fortnite|konami|paradox|devolver|annapurna|team17|focus|thq|gearbox|embracer|krafton|netease|tencent|mojang|innersloth|supergiant|respawn|apex/.test(ch)) sc += 2;
    if (/launch|release date|gameplay trailer|cinematic|story trailer|season|update|new/i.test(title)) sc += 1;
    let date = String(j.upload_date || ''); if (!date && j.timestamp) { const d = new Date(Number(j.timestamp) * 1000); date = d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0'); }
    if (ps && /playstation/.test(ch)) sc += 3;
    const chOk = words.some((w) => w.length > 3 && ch.replace(/[^a-z0-9]/g, '').includes(w)) || pubWords.some((w) => ch.includes(w)) || (ps && /playstation/.test(ch)) || /^(bethesda|ubisoft|electronic arts|ea|epic games|fortnite|rockstar games|2k|activision|call of duty|blizzard|valve|steam|capcom|sega|bandai namco|square enix|warner bros|cd projekt red|bungie|riot games|psyonix|mediatonic|konami|paradox interactive|devolver digital|annapurna|team17|gearbox|krafton|mojang|innersloth|supergiant games|respawn|apex legends)/.test(ch);
    cand.push({ id: j.id, title, cin: CIN_RE.test(title) && !CIN_NOT.test(title), sc, date, exact, chOk, offTitle: /official/i.test(title), ver: !!j.channel_is_verified });
  }
  const strictPool = cand.filter((c) => c.exact && c.sc >= 3), pool = strictPool.length ? strictPool : cand.filter((c) => c.sc >= 3);   // exact-name videos first; sequels only if the game has no video of its own
  const good = pool.sort((a, b) => (b.cin ? 1 : 0) - (a.cin ? 1 : 0) || (b.date || '').localeCompare(a.date || '') || b.sc - a.sc).slice(0, 12);   // cinematic trailers first, then the newest   // only official-looking ones, newest first
  if (!good.length) return null;
  for (let i = 0; i < good.length; i += 4) await Promise.all(good.slice(i, i + 4).map(async (c) => {   // the upload date and the sharpest picture YouTube has for each candidate
    const r = await runYt(['--dump-json', '--no-playlist', '--skip-download', 'https://www.youtube.com/watch?v=' + c.id], 70000);
    try { const j = JSON.parse(r.out.split(/\r?\n/).find((x) => x.trim().startsWith('{'))); c.date = String(j.upload_date || c.date || ''); c.ver = c.ver || !!j.channel_is_verified; c.subs = Number(j.channel_follower_count || 0); c.h = Math.max(0, ...(j.formats || []).filter((f) => /^(vp0?9|av01|avc1)/.test(f.vcodec || '')).map((f) => f.height || 0)); } catch { c.h = c.h || 0; }
  }));
  const collab = (c) => /\bx\b|×|collab|crossover/i.test(c.title);   // a "Game x Other game" trailer must come from THIS game's own channel
  let offi = good.filter((c) => c.chOk || ((c.ver || (c.offTitle && c.subs >= 300000)) && !collab(c)));
  if (!offi.length) offi = good.filter((c) => c.offTitle && c.subs >= 50000 && !collab(c) && c.exact);   // smaller studios: a mid-size channel with "Official" in the title, exact game name   // a REAL official source: verified channel, the game's / its publisher's own channel, or a big channel that says "official"
  if (!offi.length) { log('youtube trailer: no official channel found for ' + g.title); return null; }
  offi.sort((a, b) => (b.date || '0').localeCompare(a.date || '0') || (b.h || 0) - (a.h || 0) || b.sc - a.sc);
  offi = [...offi.filter((c) => c.cin), ...offi.filter((c) => !c.cin)];   // an official CINEMATIC trailer wins over a gameplay one (each group newest first)   // the NEWEST official trailer...
  const toD = (s) => new Date(String(s).slice(0, 4) + '-' + String(s).slice(4, 6) + '-' + String(s).slice(6, 8)).getTime() || 0;
  const newest = offi[0], sharp = offi.find((c) => c.h >= 1440);   // v1015: only 1440p / 4K official trailers are accepted: the newest one that is that sharp
  if (!sharp) {   // v1019: nothing is that sharp: still a trailer, the sharpest official cinematic one there is (a game never goes without)
    const grp = offi.some((c) => c.cin) ? offi.filter((c) => c.cin) : offi, best = [...grp].sort((a, b) => (b.h || 0) - (a.h || 0) || (b.date || '0').localeCompare(a.date || '0'))[0];
    log('youtube trailer: no official 1440p or 4K trailer for ' + g.title + ' - using the sharpest one (' + (best.h || '?') + 'p)'); return best;
  }
  return sharp;
}
async function ytDownload(id, base) {
  const url = 'https://www.youtube.com/watch?v=' + id, common = ['--no-playlist', '--no-part', '--no-mtime', '--no-progress'];
  const ALT = ['--extractor-args', 'youtube:player_client=tv,web_safari,android_vr'];   // v1019: when YouTube answers 403 for one way of asking, ask the other ways
  let rv = await runYt(['-f', 'bv*', '-S', 'res:2160,vcodec:vp9,fps', ...common, '-o', base + '.%(ext)s', '--print', 'after_move:%(filepath)s\t%(vcodec)s\t%(height)s', url], 900000);
  if (!/\t/.test(rv.out || '') || /403|Forbidden/i.test(String(rv.err))) { const r2 = await runYt(['-f', 'bv*', '-S', 'res:2160,vcodec:vp9,fps', ...ALT, ...common, '-o', base + '.%(ext)s', '--print', 'after_move:%(filepath)s\t%(vcodec)s\t%(height)s', url], 900000); if (/\t/.test(r2.out || '')) rv = r2; }
  const row = rv.out.split(/\r?\n/).map((x) => x.trim()).filter(Boolean).pop() || '', [vf0, vcodec0, hh] = row.split('\t');
  let vf = vf0; if (!vf || !fs.existsSync(vf)) throw new Error('no picture: ' + String(rv.err).slice(-160));
  const ext = /\.webm$/i.test(vf) ? 'webm' : 'mp4'; if (!vf.toLowerCase().endsWith('.' + ext) || !/\.(mp4|webm)$/i.test(vf)) { const nv = base + '.' + ext; fs.renameSync(vf, nv); vf = nv; }
  const na = base + 'a.mp4'; let audio = '';
  for (const [fmt, extra] of [['ba[ext=m4a][format_note*=original]/ba[ext=m4a][format_note*=default]/ba[ext=m4a]', []], ['ba[acodec^=mp4a]/ba', []], ['ba[ext=m4a]/ba[acodec^=mp4a]/ba', ALT]]) {   // the ORIGINAL language track (never an automatic dub), taken from the very same video
    const ra = await runYt(['-f', fmt, ...extra, ...common, '-o', base + 'a.%(ext)s', '--print', 'after_move:%(filepath)s', url], 300000);
    const af = ra.out.split(/\r?\n/).map((x) => x.trim()).filter(Boolean).pop();
    if (af && fs.existsSync(af) && fs.statSync(af).size > 20000) { if (af !== na) fs.renameSync(af, na); audio = path.basename(na); break; }
  }
  if (!audio) { try { fs.unlinkSync(vf); } catch {} throw new Error('no sound track could be downloaded'); }   // a silent trailer would be wrong: skip it
  const vc = /vp0?9/.test(vcodec0 || '') ? 'vp09.00.51.08' : /av01/.test(vcodec0 || '') ? 'av01.0.13M.08' : 'avc1.640028';
  log('youtube trailer picture: ' + (Number(hh) || '?') + 'p ' + (vcodec0 || ''));
  return { file: path.basename(vf), audio, vcodec: vc, h: Number(hh) || 0 };
}
// Your own picks: lines like  Game name = https://youtu.be/xxxxxxxxxxx  in trailer-links.txt (next to main.js, or in the my-console data folder). They beat the automatic pick.
function myTrailerLinks() {
  const out = {};
  for (const f of [path.join(__dirname, 'trailer-links.txt'), path.join(app.getPath('userData'), 'trailer-links.txt')]) {
    let t = ''; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
    for (const ln of t.split(/\r?\n/)) {
      const k = ln.indexOf('='); if (k < 1 || /^\s*#/.test(ln)) continue;
      const val = ln.slice(k + 1).trim().toLowerCase();
      if (val === 'steam') { out[String(ln.slice(0, k)).toLowerCase().replace(/[^a-z0-9]/g, '')] = 'steam'; continue; }
      const id = (ln.slice(k + 1).match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/) || [])[1];
      if (id) out[String(ln.slice(0, k)).toLowerCase().replace(/[^a-z0-9]/g, '')] = id;
    }
  }
  return out;
}
const myLinkFor = (links, g) => links[String(g.title).toLowerCase().replace(/[^a-z0-9]/g, '')] || links[String(coverTitle(g.title) || '').toLowerCase().replace(/[^a-z0-9]/g, '')];
ipcMain.handle('trailers:yt', async (_e, gid) => {
  if (trAutoBusy) return { ok: false, error: 'Trailers are already downloading.' };
  trAutoBusy = true;
  const send = (d) => { try { win && win.webContents.send('trailers:progress', d); } catch {} };
  try {
    await ensureYtTools(send);
    const links = myTrailerLinks();
    const bgy = gid === 'bg'; if (bgy) gid = undefined;
    let list = decorate(loadLib()).filter((g) => g.title && myLinkFor(links, g) !== 'steam' && (bgy ? (!(typeof g.trailer === 'string' && TRAILER_RE.test(g.trailer)) || LOWTR(loadLib().meta[g.id])) && !((loadLib().meta[g.id] || {}).trailerMissAt && Date.now() - (loadLib().meta[g.id] || {}).trailerMissAt < 3 * 864e5 && (loadLib().meta[g.id] || {}).trailerYtTried) : typeof gid === 'string' ? g.id === gid : ((loadLib().meta[g.id] || {}).trailerSrc !== 'youtube' || LOWTR(loadLib().meta[g.id]) || ((myLinkFor(links, g)) && myLinkFor(links, g) !== (loadLib().meta[g.id] || {}).trailerYt))));
    let done = 0, ok = 0, miss = 0; const total = list.length;
    for (const g of list) {
      send({ done, total, title: g.title });
      try {
        const mine = myLinkFor(links, g);
        const pick = mine ? { id: mine, title: 'your link', date: '', h: 0 } : await ytPickTrailer(g);
        if (!pick) { log('youtube trailer: no official trailer found for ' + g.title); if (bgy) { const lm = loadLib(); lm.meta[g.id] = { ...(lm.meta[g.id] || {}), trailerMissAt: Date.now(), trailerYtTried: 1 }; saveLib(lm); } miss++; done++; continue; }
        const nm = 'trailer-' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
        let out;
        try { out = await ytDownload(pick.id, path.join(themeDir(), nm)); }
        catch (e1) {
          if (!mine) throw e1;
          log('youtube trailer: your link failed for ' + g.title + ' (' + e1.message + '), searching instead');
          const alt = await ytPickTrailer(g); if (!alt) throw e1;
          pick.id = alt.id; pick.title = alt.title; pick.date = alt.date; pick.h = alt.h;
          out = await ytDownload(pick.id, path.join(themeDir(), nm + 'b'));
        }
        const l = loadLib(), m0 = l.meta[g.id] || {}, oldV = m0.trailer, oldA = m0.trailerAudio;
        l.meta[g.id] = { ...m0, trailer: out.file, trailerAudio: out.audio, trailerV: out.vcodec, trailerA: 'mp4a.40.2', trailerQ: 2, trailerH: out.h || pick.h || 1080, trailerLowAt: (out.h || pick.h || 1080) < 1440 ? Date.now() : 0, trailerSrc: 'youtube', trailerYt: pick.id }; saveLib(l);
        for (const f of [oldV, oldA]) if (f && f !== out.file && f !== out.audio) dropTrailer(f);
        log('youtube trailer for ' + g.title + ': "' + pick.title + '" (' + pick.date + ')'); ok++;
        send({ upd: decorate(loadLib()).find((x) => x.id === g.id), done, total, title: g.title });
      } catch (e) { log('youtube trailer ' + g.title + ': ' + e.message); if (bgy) { const lm = loadLib(); lm.meta[g.id] = { ...(lm.meta[g.id] || {}), trailerMissAt: Date.now(), trailerYtTried: 1 }; saveLib(lm); } miss++; }
      done++;
    }
    send({ done: total, total, finished: true, ok, miss });
    return { ok: true, count: ok, missing: miss, games: decorate(loadLib()) };
  } catch (e) { return { ok: false, error: e.message }; }
  finally { trAutoBusy = false; }
});
ipcMain.handle('trailers:clearAll', () => {   // remove every trailer the console saved for your games, so they can be downloaded fresh
  const l = loadLib(); let n = 0;
  for (const id of Object.keys(l.meta || {})) { const x = l.meta[id]; if (x && (x.trailer || x.trailerAudio)) { dropTrailer(x.trailer); dropTrailer(x.trailerAudio); for (const f of ['trailer', 'trailerAudio', 'trailerV', 'trailerA', 'trailerQ', 'trailerH', 'trailerSrc', 'trailerYt']) delete x[f]; n++; } }
  saveLib(l);
  try { for (const f of fs.readdirSync(themeDir())) if (TRAILER_RE.test(f) && !/^trailer-st/.test(f)) { try { fs.unlinkSync(path.join(themeDir(), f)); } catch {} } } catch {}
  return { ok: true, count: n, games: decorate(loadLib()) };
});
ipcMain.handle('trailer:clear', (_e, gid) => {
  const l = loadLib(), m = l.meta[gid];
  if (m && m.trailer) { dropTrailer(m.trailer); dropTrailer(m.trailerAudio); delete m.trailer; delete m.trailerAudio; delete m.trailerV; delete m.trailerA; saveLib(l); }
  return decorate(l);
});
ipcMain.handle('intro:wait', (_e, v) => { sendHelper(v ? 'intro on' : 'intro off'); return true; });

// ---- catalog (RAWG): search, bulk add, artwork. Free plan: 20,000 requests/month; RAWG must be credited with a link. ----
const PLATFORMS = ['Steam', 'Epic Games', 'Ubisoft Connect', 'EA app', 'Xbox', 'GOG', 'Other'];
// CATALOG-HELPERS-START
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const rawgImg = (u) => (typeof u === 'string' && /^https:\/\/media\.rawg\.io\//.test(u) ? u : undefined);
function bestMatch(res, title) {
  const n = norm(title);
  return res.find((r) => norm(r.title) === n) || res.find((r) => n.length > 3 && (norm(r.title).includes(n) || n.includes(norm(r.title))));
}
const RELEASE_OVERRIDE = { fortnite: '2017-07-25' };
const COMPANY_OVERRIDE = { fortnite: { developers: ['Epic Games'], publishers: ['Epic Games'] } };
const DESC_OVERRIDE = {
  fortnite: 'Fortnite is a free-to-play online game where you and your friends can create, play and battle. Be the last player standing in Battle Royale and Zero Build, experience a concert or live event, or discover over a million creator-made games, including racing, parkour, zombie survival and more.', deadlock: 'EARLY DEVELOPMENT BUILD\nDeadlock is still in early development stages with lots of temporary art and experimental gameplay.\nLIMITED ACCESS\nAccess to Deadlock is currently limited to friend invites via our playtesters.' };
function steamStillInstalled(g, dirs) {   // a Steam game whose install record is gone, half-finished or has no folder is not installed, even if an old scan said so
  try {
    if (g.source !== 'Steam' || !g.steamId) return true;
    for (const d of dirs) {
      const mf = path.join(d, 'appmanifest_' + g.steamId + '.acf'); if (!fs.existsSync(mf)) continue;
      const txt = readManifest(mf); if (txt == null) continue; const fl = parseInt(((txt.match(/"StateFlags"\s+"(\d+)"/) || [])[1]) || '4', 10), idir = (txt.match(/"installdir"\s+"([^"]+)"/) || [])[1];
      if ((fl & 4) === 0) return false;
      if (!idir || !fs.existsSync(path.join(d, 'common', idir))) return false;
      return true;
    }
    return false;
  } catch { return true; }
}
const mfCache = new Map();   // appmanifest text for 3 s, so opening the library never re-reads every game's file twice
function readManifest(mf) { const c = mfCache.get(mf), n = Date.now(); if (c && n - c.t < 3000) return c.txt; let txt = null; try { txt = fs.readFileSync(mf, 'utf8'); } catch {} mfCache.set(mf, { t: n, txt }); return txt; }
function steamUpdateInfo(g, dirs) {   // Steam writes "update needed / updating" into the game's install record: read it so the console can say Update instead of Play
  try {
    if (g.source !== 'Steam' || !g.steamId || !/^\d+$/.test(String(g.steamId))) return null;
    for (const d of dirs) {
      const mf = path.join(d, 'appmanifest_' + g.steamId + '.acf'); if (!fs.existsSync(mf)) continue;
      const txt = readManifest(mf); if (txt == null) continue; const num = (k) => parseInt(((txt.match(new RegExp('"' + k + '"\\s+"(\\d+)"')) || [])[1]) || '0', 10);
      const fl = num('StateFlags'), build = num('buildid'), target = num('TargetBuildID');
      const busy = (fl & (256 | 1024)) !== 0, paused = (fl & 512) !== 0, req = (fl & 2) !== 0 || (target > 0 && build > 0 && target !== build);
      if (!busy && !paused && !req) return { needsUpdate: false };
      const total = num('BytesToDownload'), done = num('BytesDownloaded');
      return { needsUpdate: true, updating: busy && !paused, updatePct: total > 0 ? Math.min(99, Math.round(done / total * 100)) : 0 };
    }
  } catch {}
  return null;
}
function decorate(l) { let sd = null; try { sd = steamDirs(l.folders); } catch {} return l.games.map((g) => { const m = (l.meta || {})[g.id] || {}; const o = { ...m, ...g, image: g.image || m.image }; if (o.installed !== false && sd && sd.length && !steamStillInstalled(g, sd)) o.installed = false; if (o.installed !== false && sd && sd.length) { const u = steamUpdateInfo(g, sd); if (u) Object.assign(o, u); } const d = DESC_OVERRIDE[norm(coverTitle ? coverTitle(g.title) : g.title)]; if (d) o.description = d; { const co = COMPANY_OVERRIDE[norm(coverTitle ? coverTitle(g.title) : g.title)]; if (co) Object.assign(o, co); } if (RELEASE_OVERRIDE[norm(coverTitle ? coverTitle(g.title) : g.title)]) o.released = RELEASE_OVERRIDE[norm(coverTitle ? coverTitle(g.title) : g.title)]; const sp = (typeof steamPlay !== 'undefined' && g.steamId) ? steamPlay[String(g.steamId)] : null; if (sp) { if (sp.m) o.playSeconds = Math.max(o.playSeconds || 0, sp.m * 60); if (sp.t) o.lastPlayed = Math.max(o.lastPlayed || 0, sp.t * 1000); } return o; }); }
function mergeManual(l, list) {
  const ids = new Set(list.map((g) => g.id)), titles = new Set(list.filter((g) => !g.manual).map((g) => norm(g.title)));
  for (const m of l.manual || []) if (!ids.has(m.id) && !titles.has(norm(m.title))) list.push({ ...m });
  return list;
}
// CATALOG-HELPERS-END
const rawgCacheFile = () => path.join(app.getPath('userData'), 'rawg-cache.json');
function cacheGet(k) { try { return JSON.parse(fs.readFileSync(rawgCacheFile(), 'utf8'))[k]; } catch { return undefined; } }
function cacheSet(k, v) {
  let c = {}; try { c = JSON.parse(fs.readFileSync(rawgCacheFile(), 'utf8')); } catch {}
  c[k] = v; const keys = Object.keys(c); if (keys.length > 3000) delete c[keys[0]];
  try { fs.writeFileSync(rawgCacheFile(), JSON.stringify(c)); } catch {}
}
async function rawgSearch(q, size) {
  const key = loadSettings().rawgKey;
  if (!key) throw new Error('Add your free RAWG key in Settings first.');
  const r = await fetch('https://api.rawg.io/api/games?' + new URLSearchParams({ key, search: q, search_precise: 'true', page_size: String(size) }), { signal: AbortSignal.timeout(20000) });
  if (r.status === 401 || r.status === 403) throw new Error('RAWG rejected the key. Check it in Settings.');
  if (r.status === 429) throw new Error('RAWG limit reached (free plan: 20,000 requests a month).');
  if (!r.ok) throw new Error('RAWG request failed (' + r.status + ')');
  return ((await r.json()).results || []).map((g) => ({ rawgId: g.id, title: g.name, released: g.released || '', image: rawgImg(g.background_image), genres: (g.genres || []).map((x) => x.name).slice(0, 4) }));
}
async function rawgCached(q, size) {
  const k = size + ':' + norm(q), hit = cacheGet(k);
  if (hit) return hit;
  const res = await rawgSearch(q, size); cacheSet(k, res); return res;
}
function addManual(l, e, platform) {
  if (!PLATFORMS.includes(platform) || !e || !Number.isInteger(e.rawgId)) return false;
  const id = 'cat' + e.rawgId + '-' + norm(platform);
  if (!l.manual.some((m) => m.id === id)) l.manual.push({ id, title: String(e.title).slice(0, 120), source: platform, installed: false, manual: true, addedAt: Date.now(), image: rawgImg(e.image), released: String(e.released || '').slice(0, 10), genres: Array.isArray(e.genres) ? e.genres.slice(0, 4).map(String) : [], rawgId: e.rawgId });
  l.excluded = l.excluded.filter((x) => x !== id);
  return true;
}
ipcMain.handle('cat:search', async (_e, q) => {
  if (typeof q !== 'string' || !q.trim() || q.length > 100) return { ok: false, error: 'Type a game name.' };
  try { return { ok: true, results: await rawgCached(q.trim(), 12) }; } catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('cat:add', (_e, entry, platform) => {
  const l = loadLib(); addManual(l, entry, platform);
  l.games = mergeManual(l, l.games.slice()); saveLib(l); return decorate(l);
});
ipcMain.handle('cat:openList', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Choose a .txt file with one game title per line', properties: ['openFile'], filters: [{ name: 'Text', extensions: ['txt'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  try {
    if (fs.statSync(r.filePaths[0]).size > 200000) return { error: 'That file is too large.' };
    return { titles: fs.readFileSync(r.filePaths[0], 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean) };
  } catch { return { error: 'Could not read that file.' }; }
});
ipcMain.handle('cat:bulk', async (_e, titles, platform) => {
  if (!Array.isArray(titles) || !PLATFORMS.includes(platform)) return null;
  const l = loadLib(), unmatched = []; let added = 0, firstError = null;
  const list = [...new Set(titles.map((t) => String(t).trim()).filter((t) => t && t.length <= 100))].slice(0, 300);
  await pool(list, 3, async (t) => {
    try { const hit = bestMatch(await rawgCached(t, 3), t); if (hit && addManual(l, hit, platform)) added++; else unmatched.push(t); }
    catch (e) { firstError = firstError || e.message; unmatched.push(t); }
  });
  l.games = mergeManual(l, l.games.slice()); saveLib(l);
  if (unmatched.length) log('bulk not matched: ' + unmatched.join(' | '));
  return { games: decorate(l), added, unmatched, error: firstError };
});
ipcMain.handle('cat:art', async () => {
  const l = loadLib(); let done = 0, firstError = null;
  const needsArt = (g) => !g.image && !(l.meta[g.id] && (l.meta[g.id].image || l.meta[g.id].tried));
  const todo = l.games.filter(needsArt).slice(0, 60);
  await pool(todo, 3, async (g) => {
    try { const h = bestMatch(await rawgCached(g.title, 3), g.title); l.meta[g.id] = { ...(l.meta[g.id] || {}), ...(h ? { image: h.image, released: h.released, genres: h.genres, rawgId: h.rawgId, tried: true } : { tried: true }) }; if (h && h.image) done++; }
    catch (e) { firstError = firstError || e.message; }
  });
  saveLib(l);
  return { games: decorate(l), done, more: l.games.some(needsArt), error: firstError };
});

// ---- account sign-in: Epic Games and GOG ----
// UNOFFICIAL: these platforms have no public API for reading your library. You sign in on the platform's own web page,
// so this app never sees your password; it only keeps the token the platform returns, encrypted by Windows (safeStorage).
const EPIC_ID = '34a02cf8f4414e29b15921876da36f9a', EPIC_SECRET = 'daafbccc737745039dffe53d94fc76cf';
const EPIC_UA = 'UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit';
const EPIC_OAUTH = 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token';
const EPIC_LOGIN = 'https://www.epicgames.com/id/login?redirectUrl=' + encodeURIComponent(`https://www.epicgames.com/id/api/redirect?clientId=${EPIC_ID}&responseType=code`);
const GOG_ID = '46899977096215655', GOG_SECRET = '9d85c43b1482497dbbce61f6e4aa173a433796eeae2ca8c5f6129f2dc4de46d9';
const GOG_REDIRECT = 'https://embed.gog.com/on_login_success?origin=client';
const GOG_LOGIN = 'https://auth.gog.com/auth?' + new URLSearchParams({ client_id: GOG_ID, redirect_uri: GOG_REDIRECT, response_type: 'code', layout: 'client2' });
let lastErrors = [];
const T = () => AbortSignal.timeout(20000);
const accFile = () => path.join(app.getPath('userData'), 'accounts.json');
function readAcc() { try { return JSON.parse(fs.readFileSync(accFile(), 'utf8')); } catch { return {}; } }
function getTok(p) {
  try { const e = readAcc()[p]; return e && safeStorage.isEncryptionAvailable() ? JSON.parse(safeStorage.decryptString(Buffer.from(e, 'base64'))) : null; } catch { return null; }
}
function setTok(p, t) {
  const a = readAcc();
  if (t === null) delete a[p];
  else { if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows secure storage is not available.'); a[p] = safeStorage.encryptString(JSON.stringify(t)).toString('base64'); }
  fs.writeFileSync(accFile(), JSON.stringify(a));
}
// Opens the platform's own sign-in page; onUrl(url, window) returns a value once sign-in has finished.


// v978: web sign-ins (Steam, Epic) open in the console's own browser view, on top of the console in Settings; the controller moves the pointer and clicking a box opens the console's Xbox keyboard
let loginWatch = null;
function webLogin(url, onUrl) {
  return new Promise((resolve, reject) => {
    if (!win) return reject(new Error('The console window is not ready.'));
    const view = brEnsure(), wc = view.webContents; let finished = false; const hs = [];
    const end = () => { finished = true; for (const [ev, fn] of hs) { try { wc.removeListener(ev, fn); } catch {} } loginWatch = null; };
    const check = async (u) => {
      if (finished || !u) return;
      try { const r = await onUrl(u, { webContents: wc }); if (r !== undefined) { end(); try { brHide(); } catch {} resolve(r); } }
      catch (e) { end(); try { brHide(); } catch {} reject(e); }
    };
    for (const ev of ['did-navigate', 'did-navigate-in-page', 'did-redirect-navigation', 'will-redirect']) { const fn = (a, b) => check(typeof b === 'string' ? b : (a && a.url)); hs.push([ev, fn]); wc.on(ev, fn); }
    const fl = () => check(wc.getURL()); hs.push(['did-finish-load', fl]); wc.on('did-finish-load', fl);
    const to = setTimeout(() => { if (!finished) { end(); try { brHide(); } catch {} reject(new Error('Sign-in timed out.')); } }, 600000);
    loginWatch = { cancel: () => { if (finished) return; clearTimeout(to); end(); reject(new Error('Sign-in cancelled.')); } };
    try { win.webContents.send('acct:web'); } catch {}
    brShow(url);
  });
}
function loginFlow(url, onUrl) {
  return new Promise((resolve, reject) => {
    const w = new BrowserWindow({ width: 520, height: 780, autoHideMenuBar: true, alwaysOnTop: true, title: 'Sign in',
      webPreferences: { partition: 'login-' + Date.now(), sandbox: true, contextIsolation: true, nodeIntegration: false } });
    let finished = false;
    const check = async (u) => {
      if (finished || !u) return;
      try { const r = await onUrl(u, w); if (r !== undefined) { finished = true; resolve(r); w.destroy(); } }
      catch (e) { finished = true; reject(e); w.destroy(); }
    };
    for (const ev of ['did-navigate', 'will-redirect', 'did-redirect-navigation', 'will-navigate'])
      w.webContents.on(ev, (e, u) => check(u || (e && e.url)));
    w.webContents.on('did-finish-load', () => check(w.webContents.getURL()));
    w.on('closed', () => { if (!finished) { finished = true; reject(new Error('The sign-in window was closed.')); } });
    w.loadURL(url).catch(() => {});
  });
}
const epicCodeFromPage = async (u, w) => {
  if (!u.startsWith('https://www.epicgames.com/id/api/redirect')) return undefined;
  try { const j = JSON.parse(await w.webContents.executeJavaScript('document.body.innerText')); return j.authorizationCode || undefined; } catch { return undefined; }
};
const UBI_LOGIN = 'https://connect.ubisoft.com/login?appId=b8fde481-327d-4031-85ce-7c10a202a700&genomeId=fbd6791c-a6c6-4206-a75e-77234080b87b&lang=en-US&nextUrl=https:%2F%2Fconnect.ubisoft.com%2Fready';
const ubiLoginRead = async (u, w) => {   // Ubisoft's own login page; once it lands on /ready the site has saved your sign-in in its page storage, which is read here
  if (/^https:\/\/connect\.ubisoft\.com\/login/.test(u)) {   // Ubisoft's bot protection can block a network for a while: say so instead of leaving a blank page
    try { const t = await w.webContents.executeJavaScript('document.body ? document.body.innerText.slice(0, 600) : ""'); if (/temporarily restricted|unusual activity/i.test(t)) throw new Error('Ubisoft is blocking this network for a while ("Access is temporarily restricted"). Try again later, or from another network.'); } catch (e) { if (/Ubisoft is blocking/.test(e.message)) throw e; }
    return undefined;
  }
  if (!/^https:\/\/connect\.ubisoft\.com\/(ready|change_domain)/.test(u)) return undefined;
  const wc = w.webContents;
  let raw = null; try { raw = await wc.executeJavaScript("JSON.stringify({a:localStorage.getItem('PRODloginData'),b:localStorage.getItem('PRODrememberMe'),c:localStorage.getItem('PRODlastProfile')})"); } catch {}
  let o = null; try { const r = JSON.parse(raw || '{}'); const a = JSON.parse(r.a || 'null') || {}, c = JSON.parse(r.c || 'null') || {}, b = r.b ? String(r.b).replace(/^"|"$/g, '') : ''; o = { ticket: a.ticket, sessionId: a.sessionId, userId: a.userId || c.userId, rememberMeTicket: a.rememberMeTicket || b }; } catch {}
  if (o && (o.rememberMeTicket || o.ticket)) return o;
  if (/\/ready/.test(u)) { try { wc.loadURL('https://connect.ubisoft.com/change_domain/'); } catch {} }
  return undefined;
};
const gogCodeFromUrl = async (u) => (u.startsWith('https://embed.gog.com/on_login_success') ? (new URL(u).searchParams.get('code') || undefined) : undefined);

async function epicToken(params) {
  const r = await fetch(EPIC_OAUTH, { method: 'POST', signal: T(), body: new URLSearchParams({ ...params, token_type: 'eg1' }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'basic ' + Buffer.from(EPIC_ID + ':' + EPIC_SECRET).toString('base64'), 'User-Agent': EPIC_UA } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('Epic sign-in failed (' + r.status + (j.errorCode ? ' ' + j.errorCode : '') + ')');
  return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.parse(j.expires_at) || Date.now() + 7200000 };
}
async function gogToken(params) {
  const r = await fetch('https://auth.gog.com/token?' + new URLSearchParams({ client_id: GOG_ID, client_secret: GOG_SECRET, ...params }), { signal: T() });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('GOG sign-in failed (' + r.status + ')');
  return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000 };
}
async function access(p, refresh) {
  const t = getTok(p); if (!t) return null;
  if (t.expires_at - 60000 > Date.now()) return t;
  const n = await refresh(t); setTok(p, n); return n;
}
const epicAccess = () => access('epic', (t) => epicToken({ grant_type: 'refresh_token', refresh_token: t.refresh_token }));
const gogAccess = () => access('gog', (t) => gogToken({ grant_type: 'refresh_token', refresh_token: t.refresh_token }));
async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]).catch(() => null); } }));
  return out;
}
async function epicOwned() {
  const tok = await epicAccess(); if (!tok) throw new Error('Signed out. Sign in again.');
  const h = { Authorization: 'bearer ' + tok.access_token, 'User-Agent': EPIC_UA };
  const r = await fetch('https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/Windows?label=Live', { headers: h, signal: T() });
  if (!r.ok) throw new Error('Epic library request failed (' + r.status + ')');
  const safe = (x) => /^[\w.-]+$/.test(x || '');
  const assets = (await r.json()).filter((a) => safe(a.appName) && safe(a.namespace) && safe(a.catalogItemId) && !/^UE_/.test(a.appName));
  const res = await pool(assets, 8, async (a) => {
    const u = `https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/namespace/${a.namespace}/bulk/items?id=${a.catalogItemId}&includeDLCDetails=true&includeMainGameDetails=true&country=US&locale=en`;
    const it = (await (await fetch(u, { headers: h, signal: T() })).json())[a.catalogItemId];
    if (!it || !it.title || it.mainGameItem || (it.categories || []).some((c) => /^(addons|digitalextras)/.test(c.path))) return null;
    const ki = Array.isArray(it.keyImages) ? it.keyImages : [], kp = (t) => (ki.find((k) => k && k.type === t && /^https:\/\//.test(k.url || '')) || {}).url, art = kp('DieselGameBoxTall') || kp('OfferImageTall') || kp('Thumbnail') || kp('DieselGameBox') || '';   // Epic's own cover art for the game
    return { id: 'epic' + a.appName, title: it.title, source: 'Epic Games', image: art || undefined, installed: false, uri: `com.epicgames.launcher://apps/${a.namespace}%3A${a.catalogItemId}%3A${a.appName}?action=install` };
  });
  if (assets.length && !res.some(Boolean)) throw new Error('Epic returned games but no titles could be read.');
  return res.filter(Boolean);
}
async function gogOwned() {
  const tok = await gogAccess(); if (!tok) throw new Error('Signed out. Sign in again.');
  const out = []; let pages = 1;
  for (let p = 1; p <= pages && p <= 60; p++) {
    const r = await fetch('https://embed.gog.com/account/getFilteredProducts?mediaType=1&page=' + p, { headers: { Authorization: 'Bearer ' + tok.access_token }, signal: T() });
    if (!r.ok) throw new Error('GOG library request failed (' + r.status + ')');
    const j = await r.json(); pages = j.totalPages || 1;
    for (const x of j.products || []) if (/^\d+$/.test(String(x.id)) && x.title) out.push({ id: 'gog' + x.id, title: x.title, source: 'GOG', installed: false, slug: /^[\w-]+$/.test(x.slug || '') ? x.slug : undefined });
  }
  return out;
}

// ---- Steam: sign in on Steam's own page inside the console, then read every game you own (installed or not) from your logged-in game list. No API key. ----
const STEAM_PART = 'persist:browser';   // the console's own browser session: the Steam sign-in happens there, inside the console
const STEAM_GAMES_URL = 'https://steamcommunity.com/my/games/?tab=all';
const STEAM_LOGIN = 'https://steamcommunity.com/login/home/?goto=' + encodeURIComponent('/my/games/?tab=all');
const steamLogin = () => webLogin(STEAM_LOGIN, async (u) => (/^https:\/\/steamcommunity\.com\/(id|profiles)\/[^/]+\/games/.test(u) ? true : undefined));
async function steamWebOwned() {
  const w = new BrowserWindow({ show: false, width: 1200, height: 900, webPreferences: { partition: STEAM_PART, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
  try {
    await Promise.race([w.loadURL(STEAM_GAMES_URL), sleep(25000).then(() => { throw new Error('Steam did not answer'); })]).catch((e) => { if (!/ERR_ABORTED/.test(e.message)) throw e; });
    if (/\/login/.test(w.webContents.getURL())) { setTok('steam', null); throw new Error('Signed out. Sign in again.'); }
    let raw = null;
    for (let i = 0; i < 30 && !raw; i++) {
      raw = await w.webContents.executeJavaScript(`(() => { const e = document.querySelector('#gameslist_config'); return e ? e.getAttribute('data-profile-gameslist') : null; })()`).catch(() => null);
      if (!raw) await sleep(500);
    }
    let list = [];
    if (!raw) {
      // fallback: ask the store for the ids you own (works whatever your profile privacy is), then look the names up
      try { log('steam: no #gameslist_config on ' + w.webContents.getURL() + ' ("' + String(w.webContents.getTitle()).slice(0, 60) + '"), trying the store list'); } catch {}
      let ids = [];
      try {
        await Promise.race([w.loadURL('https://store.steampowered.com/dynamicstore/userdata/'), sleep(20000)]).catch(() => {});
        const t = await w.webContents.executeJavaScript('document.body ? document.body.innerText : ""').catch(() => '');
        const u = JSON.parse(t); ids = (u.rgOwnedApps || []).map(String);
        log('steam: store list has ' + ids.length + ' apps');
      } catch (e) { log('steam: store list failed: ' + e.message); }
      if (!ids.length) throw new Error('Steam returned no game list (sign in again, or check Steam is not asking for a code)');
      for (let i = 0; i < ids.length; i += 150) {
        const chunk = ids.slice(i, i + 150);
        try {
          const q = encodeURIComponent(JSON.stringify({ ids: chunk.map((a) => ({ appid: Number(a) })), context: { language: 'english', country_code: 'US' }, data_request: {} }));
          const r = await fetch('https://api.steampowered.com/IStoreBrowseService/GetItems/v1?input_json=' + q, { signal: T() });
          const j2 = await r.json();
          for (const it of (j2.response && j2.response.store_items) || []) if (it.name && (it.type === 0 || it.type === undefined || it.type === 'game')) list.push({ appid: it.appid || it.id, name: it.name });
        } catch (e) { log('steam: name lookup failed: ' + e.message); }
      }
    } else { const j = JSON.parse(raw); list = j.rgGames || j.games || []; }
    const out = [];
    for (const g of list) {
      const id = String(g.appid || g.app_id || ''), name = g.name || g.title;
      if (!/^\d+$/.test(id) || !name || /redistributable|steamworks|proton|runtime|dedicated server|\bsdk\b/i.test(name)) continue;
      out.push({ id: 'steam' + id, title: name, source: 'Steam', steamId: id, installed: false });
    }
    if (!out.length) throw new Error('Steam list was empty');
    return out;
  } finally { try { w.destroy(); } catch {} }
}

// ---- Ubisoft Connect: sign in with your Ubisoft account inside the console, then read every game you own from Ubisoft's ownership service ----
// UNOFFICIAL: this is the same service the Ubisoft Connect app talks to. Your password is sent only to Ubisoft and is never stored; the console keeps Ubisoft's own "remember me" ticket (encrypted by Windows).
const UBI_APP = 'f68a4bb5-608a-4ff2-8123-be8ef797e0a6', UBI_SESS = 'https://public-ubiservices.ubi.com/v3/profiles/sessions';
const pbVar = (n) => { const o = []; n = Number(n); while (n > 127) { o.push((n % 128) | 128); n = Math.floor(n / 128); } o.push(n); return Buffer.from(o); };
const pbTag = (f, w) => pbVar(f * 8 + w);
const pbMsg = (f, b) => Buffer.concat([pbTag(f, 2), pbVar(b.length), b]);
const pbStr = (f, str) => pbMsg(f, Buffer.from(String(str), 'utf8'));
const pbNum = (f, n) => Buffer.concat([pbTag(f, 0), pbVar(n)]);
function pbDecode(buf) {   // field number -> list of values (varints as numbers, everything length-delimited as Buffers)
  const out = {}; let i = 0;
  const rd = () => { let r = 0, m = 1, b; do { if (i >= buf.length) throw new Error('short'); b = buf[i++]; r += (b & 127) * m; m *= 128; } while (b & 128); return r; };
  while (i < buf.length) {
    const k = rd(), f = Math.floor(k / 8), w = k & 7; let v;
    if (w === 0) v = rd(); else if (w === 2) { const n = rd(); if (i + n > buf.length) throw new Error('short'); v = buf.subarray(i, i + n); i += n; }
    else if (w === 1) { i += 8; continue; } else if (w === 5) { i += 4; continue; } else throw new Error('bad wire');
    (out[f] = out[f] || []).push(v);
  }
  return out;
}
async function ubiPost(headers, body) {
  const r = await fetch(UBI_SESS, { method: 'POST', signal: T(), body: JSON.stringify(body || { rememberMe: true }),
    headers: headers && headers['Ubi-AppId'] === UBI_CLUB ? { 'Content-Type': 'application/json', Accept: '*/*', ...headers } : { 'Content-Type': 'application/json', 'User-Agent': 'Massgate', 'Ubi-RequestedPlatformType': 'uplay', 'Ubi-AppId': UBI_APP, ...headers } });
  const j = await r.json().catch(() => ({}));
  if (r.status === 429) throw new Error('Ubisoft says too many attempts. Try again in a while.');
  if (r.status === 401 || r.status === 403 || (!r.ok && !j.twoFactorAuthenticationTicket)) throw new Error(r.status === 401 ? 'Wrong email or password.' : 'Ubisoft sign-in failed (' + r.status + (j.message ? ': ' + String(j.message).slice(0, 80) : '') + ')');
  return j;
}
let ubiPending = null;   // the 2-step code ticket while the sign-in window waits for the code
function ubiStore(j) { setTok('ubisoft', { rm: j.rememberMeTicket, uid: j.userId || j.profileId || '', club: 1 }); }
const ubiClubH = () => ({ 'Ubi-AppId': UBI_CLUB, 'User-Agent': UBI_CHROME, Origin: 'https://connect.ubisoft.com', Referer: 'https://connect.ubisoft.com' });
ipcMain.handle('ubi:signin', async (_e, email, pw) => {   // the console's own form (Xbox keyboard) sends the email and password; they go only to Ubisoft
  try {
    if (typeof email !== 'string' || typeof pw !== 'string' || !email.includes('@') || !pw) return { error: 'Enter your email and password.' };
    const j = await ubiPost({ ...ubiClubH(), Authorization: 'Basic ' + Buffer.from(email.trim() + ':' + pw).toString('base64') });
    if (j.twoFactorAuthenticationTicket && !j.ticket) { ubiPending = j.twoFactorAuthenticationTicket; return { need2fa: true }; }
    if (!j.rememberMeTicket) return { error: 'Ubisoft did not return a sign-in ticket.' };
    ubiStore(j); return { ok: true };
  } catch (e) { log('ubisoft sign-in: ' + e.message); return { error: e.message }; }
});
ipcMain.handle('ubi:code', async (_e, code) => {
  try {
    if (!ubiPending || typeof code !== 'string' || !/^\d{4,8}$/.test(code.trim())) return { error: 'Enter the code Ubisoft sent you.' };
    const j = await ubiPost({ ...ubiClubH(), Authorization: 'ubi_2fa_v1 t=' + ubiPending, 'Ubi-2FACode': code.trim() });
    ubiPending = null; if (!j.rememberMeTicket) return { error: 'Ubisoft did not return a sign-in ticket.' };
    ubiStore(j); return { ok: true };
  } catch (e) { log('ubisoft code: ' + e.message); return { error: e.message }; }
});
async function ubiTicket() {
  const t = getTok('ubisoft'); if (!t || !t.rm) throw new Error('Signed out. Sign in again.');
  let j; try { j = await ubiPost({ Authorization: 'rm_v1 t=' + t.rm }); } catch (e) { if (/Wrong email|failed \(40[13]/.test(e.message)) { setTok('ubisoft', null); throw new Error('Signed out. Sign in again.'); } throw e; }
  if (!j.ticket) throw new Error('Ubisoft gave no session ticket.');
  if (j.rememberMeTicket) setTok('ubisoft', { rm: j.rememberMeTicket, uid: j.userId || t.uid });
  return j.ticket;
}
function ubiConfigName(yaml) {   // a game's name from its configuration text: the root "name:", looked up in the localizations when it is a key like l1234
  const y = String(yaml || ''), m = /^[ \t]{1,4}name:[ \t]*"?([^"\r\n]+?)"?[ \t]*$/m.exec(y); if (!m) return '';
  let n = m[1].trim();
  if (/^l\d+$/.test(n)) { const l = new RegExp('^[ \\t]+' + n + ':[ \\t]*"?([^\\r\\n]*?)"?[ \\t]*$', 'm').exec(y.slice(Math.max(0, y.indexOf('localizations')))); n = l ? l[1].trim().replace(/\\(.)/g, '$1') : ''; }
  return n.replace(/[™®©]/g, '').trim();
}
function ubiDemux(ticket, variant) {   // talks to Ubisoft's connection service and returns the owned products
  const tls = require('tls');
  return new Promise((resolve, reject) => {
    const sock = tls.connect({ host: 'dmx.upc.ubisoft.com', port: 443, servername: 'dmx.upc.ubisoft.com' });
    let rxBytes = 0, buf = Buffer.alloc(0), inner = Buffer.alloc(0), step = 0, conn = 0, settled = false, retried = false, timer = null;
    const fail = (e) => { if (settled) return; settled = true; clearTimeout(timer); try { sock.destroy(); } catch {} reject(e instanceof Error ? e : new Error(String(e))); };
    const ok = (v) => { if (settled) return; settled = true; clearTimeout(timer); try { sock.destroy(); } catch {} resolve(v); };
    timer = setTimeout(() => fail(new Error('Ubisoft did not answer in time (step ' + step + ')')), 60000);
    const sendFrame = (b) => { const h = Buffer.alloc(4); h.writeUInt32BE(b.length); sock.write(Buffer.concat([h, b])); };
    const upReq = (reqBody) => pbMsg(1, reqBody);
    const sendOwnership = (prefixed) => {
      const req = pbMsg(1, Buffer.concat([pbNum(1, 1), pbMsg(2, Buffer.concat([pbNum(2, 1), pbNum(3, 7)])), pbStr(30, ticket)]));
      let data = req; if (prefixed) { const h = Buffer.alloc(4); h.writeUInt32BE(req.length); data = Buffer.concat([h, req]); }
      sendFrame(pbMsg(2, pbMsg(1, Buffer.concat([pbNum(1, conn), pbMsg(2, data)]))));
    };
    const parseOwnership = (payload) => {
      const d = pbDecode(payload), rsp = d[1] && pbDecode(d[1][0]); if (!rsp || !rsp[2]) return null;
      const init = pbDecode(rsp[2][0]); if (!init[1] || !init[1][0]) throw new Error('Ubisoft refused the ownership request.');
      const out = []; const og = init[2] && init[2][0] && pbDecode(init[2][0]);
      for (const b of (og && og[1]) || []) { try { const g = pbDecode(b); out.push({ pid: (g[1] || [0])[0], type: g[8] ? g[8][0] : 0, state: g[13] ? g[13][0] : 0, uplay: g[19] ? g[19][0] : 0, owned: g[20] ? g[20][0] : 1, cfg: g[17] ? g[17][0].toString('utf8') : '' }); } catch {} }
      return out;
    };
    const tryInner = () => {
      if (inner.length < 4) return;
      const n = inner.readUInt32BE(0);
      if (n + 4 <= inner.length && n > 0) { const r = parseOwnership(inner.subarray(4, 4 + n)); if (r) return ok(r); }
      else if (n + 4 > inner.length) { try { const r = parseOwnership(inner); if (r) ok(r); } catch {} return; }   // the rest is still on its way (or the answer has no length prefix)
      try { const r = parseOwnership(inner); if (r) ok(r); } catch {}
    };
    const onFrame = (p) => {
      let d; try { d = pbDecode(p); } catch { return; }
      if (d[1]) {   // a response to one of our requests
        const rsp = pbDecode(d[1][0]), id = (rsp[1] || [0])[0];
        if (id === 1 && step === 1) { const a = rsp[2] && pbDecode(rsp[2][0]); if (!a || a[1][0] !== 1) return fail(new Error('Ubisoft refused the session' + (a && a[2] ? ' (expired)' : ''))); step = 2; sendFrame(upReq(Buffer.concat([pbNum(1, 2), pbMsg(3, pbStr(2, 'ownership_service'))]))); }
        else if (id === 2 && step === 2) { const o = rsp[3] && pbDecode(rsp[3][0]); if (!o || o[2][0] !== 1) return fail(new Error('Ubisoft would not open the ownership service')); conn = o[1][0]; step = 3; sendOwnership(true); setTimeout(() => { if (!settled && !inner.length && !retried) { retried = true; sendOwnership(false); } }, 12000); }
      } else if (d[2]) {   // data pushed from a service
        const push = pbDecode(d[2][0]); if (!push[1]) return;
        const dm = pbDecode(push[1][0]); if (dm[1] && dm[1][0] !== conn) return;
        if (dm[2]) { inner = Buffer.concat([inner, dm[2][0]]); try { tryInner(); } catch (e) { fail(e); } }
      }
    };
    sock.on('secureConnect', () => { step = 1; const tk = pbMsg(1, pbStr(3, ticket)); const auth = variant === 1 ? Buffer.concat([tk, pbStr(2, 'uplay_pc'), pbNum(4, 0)]) : variant === 2 ? tk : Buffer.concat([tk, pbNum(4, 0)]); sendFrame(upReq(Buffer.concat([pbNum(1, 1), pbMsg(2, auth)]))); });
    sock.on('data', (c) => { rxBytes += c.length; buf = Buffer.concat([buf, c]); while (buf.length >= 4) { const n = buf.readUInt32BE(0); if (buf.length < n + 4) break; const p = buf.subarray(4, 4 + n); buf = buf.subarray(4 + n); try { onFrame(p); } catch (e) { fail(e); } } });
    sock.on('error', fail); sock.on('close', () => { const e = new Error('Ubisoft closed the connection'); e.step = step; e.rx = rxBytes; fail(e); });
  });
}
const UBI_CLUB = 'b8fde481-327d-4031-85ce-7c10a202a700', UBI_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
async function ubiClubOwned() {   // the Ubisoft Club's own game list (the same web service connect.ubisoft.com uses): every game on the account, installed or not
  const t = getTok('ubisoft'); if (!t || (!t.rm && !t.tk)) throw new Error('Signed out. Sign in again.');
  const H = { 'Content-Type': 'application/json', Accept: '*/*', 'User-Agent': UBI_CHROME, 'Ubi-AppId': UBI_CLUB, Origin: 'https://connect.ubisoft.com', Referer: 'https://connect.ubisoft.com' };
  let r1 = { ok: false, status: 0 }, j = {};
  if (t.rm) { r1 = await fetch(UBI_SESS, { method: 'POST', signal: T(), headers: { ...H, Authorization: 'rm_v1 t=' + t.rm }, body: JSON.stringify({ rememberMe: true }) }); j = await r1.json().catch(() => ({})); }
  if ((!r1.ok || !j.ticket) && t.tk) { r1 = { ok: true, status: 200 }; j = { ticket: t.tk, sessionId: t.sid || '' }; log('ubisoft club: using the ticket from the sign-in page'); }
  if (!r1.ok || !j.ticket) throw new Error('Ubisoft Club session failed (' + r1.status + (j.message ? ': ' + String(j.message).slice(0, 80) : '') + ')' + (t.club ? '' : ' - sign out of Ubisoft and sign in again'));
  if (j.rememberMeTicket) setTok('ubisoft', { rm: j.rememberMeTicket, uid: j.userId || t.uid, club: 1 });
  const q = 'query AllGames { viewer { id ...ownedGamesList } } fragment gameProps on Game { id spaceId name } fragment ownedGameProps on Game { ...gameProps viewer { meta { id ownedPlatformGroups { id name type } } } } fragment ownedGamesList on User { ownedGames: games(filterBy: {isOwned: true}) { totalCount nodes { ...ownedGameProps } } }';
  const r2 = await fetch('https://public-ubiservices.ubi.com/v1/profiles/me/uplay/graphql', { method: 'POST', signal: T(), headers: { ...H, Authorization: 'Ubi_v1 t=' + j.ticket, 'Ubi-SessionId': j.sessionId || '' }, body: JSON.stringify({ operationName: 'AllGames', variables: { owned: true }, query: q }) });
  const d = await r2.json().catch(() => ({}));
  if (!r2.ok) throw new Error('Ubisoft Club list failed (' + r2.status + (d.message ? ': ' + String(d.message).slice(0, 80) : '') + ')');
  const nodes = (((d.data || {}).viewer || {}).ownedGames || {}).nodes;
  if (!Array.isArray(nodes)) throw new Error('Ubisoft Club returned no game list');
  const out = [], seen = new Set();
  for (const g of nodes) {
    try {
      const plats = ((((g.viewer || {}).meta || {}).ownedPlatformGroups) || []).flat().map((p) => p && p.type || '');
      if (plats.length && !plats.includes('PC')) continue;
      const name = String(g.name || '').replace(/[™®©]/g, '').trim(), sid = String(g.spaceId || g.id || ''); if (!name || !sid || seen.has(sid)) continue; seen.add(sid);
      out.push({ id: 'ubi' + sid, title: name, source: 'Ubisoft Connect', ubiId: '', ubiSpace: sid, installed: false });
    } catch {}
  }
  log('ubisoft club list: ' + out.length + ' PC games (of ' + nodes.length + ')');
  return out;
}
let ubiFailAt = 0, ubiFailMsg = '';
async function ubisoftOwned() {
  if (Date.now() - ubiFailAt < 10 * 60000) throw new Error(ubiFailMsg);   // after a refusal Ubisoft is left alone for ten minutes (hammering it makes its bot protection block this PC)
  try { const c = await ubiClubOwned(); if (c.length) return c; throw new Error('Ubisoft Club listed no PC games'); } catch (e) { log('ubisoft club list failed: ' + e.message); ubiFailAt = Date.now(); ubiFailMsg = e.message; throw e; }
  const ticket = await ubiTicket();
  let list = null, lastE = null;
  for (const v of [0, 1, 2]) {   // the same request in a few spellings, in case Ubisoft is strict about one of them
    try { list = await ubiDemux(ticket, v); log('ubisoft demux ok with variant ' + v); break; } catch (e) { lastE = e; log('ubisoft demux variant ' + v + ' failed: ' + e.message + ' (step ' + e.step + ', ' + e.rx + ' bytes received)'); if (!/closed the connection/.test(e.message)) break; }
  }
  if (!list) throw new Error((lastE && lastE.message || 'Ubisoft did not answer') + ' (step ' + (lastE && lastE.step) + ', ' + (lastE && lastE.rx) + ' bytes)');
  const seen = new Set(), out = [];
  for (const g of list) {
    if (g.type !== 0 || g.owned === 0 || !g.cfg) continue;
    const name = ubiConfigName(g.cfg), id = String(g.uplay || g.pid || ''); if (!name || !/^\d+$/.test(id) || /\b(test|beta|trial)\b/i.test(name)) continue;
    const k = id + '|' + name.toLowerCase(); if (seen.has(k)) continue; seen.add(k);
    out.push({ id: 'ubi' + id, title: name, source: 'Ubisoft Connect', ubiId: id, installed: false, uri: 'uplay://install/' + id });
  }
  if (list.length && !out.length) throw new Error('Ubisoft returned ' + list.length + ' products but no game names could be read.');
  log('ubisoft owned: ' + out.length + ' games');
  return out;
}
async function accountGames(l) {
  l.owned = l.owned || {}; lastErrors = [];
  for (const [name, fn] of [['steam', steamWebOwned], ['epic', epicOwned], ['ubisoft', ubisoftOwned]]) {
    if (!getTok(name)) { delete l.owned[name]; continue; }
    try { l.owned[name] = await fn(); } catch (e) { log(name + ' library failed: ' + e.message); lastErrors.push(name + ': ' + e.message); }   // keeps the last good list
  }
  return [].concat(l.owned.steam || [], l.owned.epic || [], l.owned.ubisoft || []);
}
ipcMain.handle('acct:status', () => ({ steam: !!getTok('steam'), ubisoft: !!getTok('ubisoft'), epic: !!getTok('epic'), errors: lastErrors }));
ipcMain.handle('acct:login', async (_e, p) => {
  try {
    if (p === 'steam') { await steamLogin(); setTok('steam', { at: Date.now() }); }
    else if (p === 'epic') setTok('epic', await epicToken({ grant_type: 'authorization_code', code: await webLogin(EPIC_LOGIN, epicCodeFromPage) }));
    else if (p === 'ubisoft') { const d = await webLogin(UBI_LOGIN, ubiLoginRead); setTok('ubisoft', { rm: d.rememberMeTicket || '', tk: d.ticket || '', sid: d.sessionId || '', uid: d.userId || '', club: 1 }); }
    else if (p === 'gog') setTok('gog', await gogToken({ grant_type: 'authorization_code', redirect_uri: GOG_REDIRECT, code: await loginFlow(GOG_LOGIN, gogCodeFromUrl) }));
    else return { ok: false, error: 'Unknown platform.' };
    return { ok: true };
  } catch (e) { log('login ' + p + ' failed: ' + e.message); return { ok: false, error: e.message }; }
});
ipcMain.handle('acct:logout', (_e, p) => {
  if (p !== 'steam' && p !== 'epic' && p !== 'ubisoft') return false;
  try { setTok(p, null); } catch {}
  if (p === 'steam') { try { require('electron').session.fromPartition(STEAM_PART).clearStorageData(); } catch {} }
  const l = loadLib(); delete l.owned[p]; l.games = l.games.filter((g) => !(g.installed === false && g.id.startsWith(p))); saveLib(l);
  return true;
});

// ---- mouse helper (PowerShell + XInput) ----
let helper = null;
function sendHelper(line) { try { helper && helper.stdin.write(line + '\n'); } catch {} }
function pushCfg(s) {
  sendHelper(`cfg ${s.mouseSpeed} ${s.deadzone} ${s.mouseCurve}`);
  const m = s.mbinds; sendHelper(`binds ${m.left} ${m.right} ${m.kbd} ${m.enter} ${m.esc} ${m.back}`);
}
// ---- typing keyboard for the Windows desktop (an overlay that never takes focus; keys are sent to the app you were using) ----
let oskWin = null;
const okb = { r: 1, c: 0, shift: false, typed: '' };
const KROWS = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm.', '-_@/:;\'"!?'].map((r) => [...r]);
const KSPECIAL = ['Shift', 'Space', 'Delete', 'Enter', 'Tab', 'Close'];
const oskRows = () => KROWS.map((r) => r.map((ch) => (okb.shift ? ch.toUpperCase() : ch))).concat([KSPECIAL]);
function pushOsk() { if (oskWin) oskWin.webContents.send('osk:state', { rows: oskRows(), r: okb.r, c: okb.c, shift: okb.shift, typed: okb.typed.slice(-50) }); }
function showOsk() {
  if (oskWin) return;
  Object.assign(okb, { r: 1, c: 0, shift: false, typed: '' });
  const wa = require('electron').screen.getPrimaryDisplay().workArea, w = Math.min(1000, wa.width - 40), h = 400;
  oskWin = new BrowserWindow({ width: w, height: h, x: wa.x + Math.round((wa.width - w) / 2), y: wa.y + wa.height - h - 10, frame: false, backgroundColor: '#161a2b',
    alwaysOnTop: true, focusable: false, skipTaskbar: true, resizable: false, show: false,
    webPreferences: { preload: path.join(__dirname, 'osk-preload.js'), sandbox: true, contextIsolation: true, nodeIntegration: false } });
  oskWin.setAlwaysOnTop(true, 'screen-saver');
  oskWin.loadFile(path.join(__dirname, 'renderer', 'osk.html'));
  oskWin.once('ready-to-show', () => { if (oskWin) { oskWin.showInactive(); pushOsk(); } });
  oskWin.on('closed', () => { oskWin = null; });
}
function hideOsk() { if (oskWin) { const w = oskWin; oskWin = null; try { w.destroy(); } catch {} } try { if (brShown && brView && !brView.webContents.isDestroyed()) brView.webContents.focus(); } catch {} try { if (spShown && spView && !spView.webContents.isDestroyed()) { spView.webContents.executeJavaScript('window.__cnPause=false').catch(() => {}); spView.webContents.focus(); } } catch {} }
function closeKb() { hideOsk(); sendHelper('kb off'); if (brShown && !mouseState) { sendHelper('on'); mouseState = true; } if (spShown && !mouseState) { sendHelper('off'); try { spView.webContents.executeJavaScript('window.__cnPause=false').catch(() => {}); spView.webContents.focus(); } catch {} } }
function handleK(c) {
  if (!oskWin) return;
  const rows = oskRows();
  if (c === 'up') okb.r = Math.max(0, okb.r - 1);
  else if (c === 'down') okb.r = Math.min(rows.length - 1, okb.r + 1);
  else if (c === 'left') okb.c = Math.max(0, okb.c - 1);
  else if (c === 'right') okb.c = Math.min(rows[okb.r].length - 1, okb.c + 1);
  else if (c === 'a') {
    const k = rows[okb.r][Math.min(okb.c, rows[okb.r].length - 1)];
    if (k === 'Shift') okb.shift = !okb.shift;
    else if (k === 'Space') { sendHelper('type 32'); okb.typed += ' '; }
    else if (k === 'Delete') { sendHelper('key backspace'); okb.typed = okb.typed.slice(0, -1); }
    else if (k === 'Enter') sendHelper('key enter');
    else if (k === 'Tab') sendHelper('key tab');
    else if (k === 'Close') return closeKb();
    else { sendHelper('type ' + k.charCodeAt(0)); okb.typed += k; okb.shift = false; }
  }
  else if (c === 'b') return closeKb();
  else if (c === 'x') { sendHelper('key backspace'); okb.typed = okb.typed.slice(0, -1); }
  else if (c === 'y') { sendHelper('type 32'); okb.typed += ' '; }
  else if (c === 'lb') okb.shift = !okb.shift;
  else if (c === 'start') sendHelper('key enter');
  okb.c = Math.min(okb.c, oskRows()[okb.r].length - 1);
  pushOsk();
}
let mouseState = false, storeGrace = 0;   // storeGrace: while the Microsoft Store is still starting, the console briefly has the focus - that must not hand the controller back
let minT = null;
function setMouse(on, tell, delayMin) {
  if (dcWinShown) { try { log('setMouse ' + on + ' from ' + String(new Error().stack).split('\n').slice(2, 4).map((x) => x.trim().replace(/^at /, '')).join(' < ')); } catch {} }
  mouseState = on;
  if (tell) sendHelper(on ? 'on' : 'off');
  if (!win) return;
  if (!on) hideOsk();
  win.webContents.send('mouse:mode', on);
  clearTimeout(minT);
  if (on) { if (delayMin) minT = setTimeout(() => { if (mouseState && win) win.minimize(); }, delayMin); else win.minimize(); } else bringToFront();
}

let sideCovers = [];
function coverOtherDisplays() {   // v815: black, click-through windows on every monitor except the console's; they fade away ~14 s after start (or when the console quits)
  try {
    if (process.platform !== 'win32') return;
    const { screen } = require('electron'), home = homeDisplay() || screen.getPrimaryDisplay();
    for (const d of screen.getAllDisplays()) {
      if (d.id === home.id) continue;
      const b = { x: d.bounds.x - 4, y: d.bounds.y - 4, width: d.bounds.width + 8, height: d.bounds.height + 8 }, w = new BrowserWindow({ x: b.x, y: b.y, width: b.width, height: b.height,   // 4 px bigger than the monitor on every side so Windows 11's thin window outline falls off-screen
  frame: false, backgroundColor: '#000000', alwaysOnTop: true, skipTaskbar: true, focusable: false, resizable: false, movable: false, hasShadow: false, show: false, webPreferences: { sandbox: true } });
      w.setIgnoreMouseEvents(true); try { w.setAlwaysOnTop(true, 'screen-saver'); } catch {}
      w.loadURL('data:text/html,<body style="margin:0;background:%23000000"></body>'); w.once('ready-to-show', () => { try { w.showInactive(); w.setBounds(b); } catch {} });
      sideCovers.push(w);
    }
    log('cover: black cover on ' + sideCovers.length + ' other monitor(s)');
    setTimeout(() => { for (const w of sideCovers) { try { if (w.isDestroyed()) continue; const t0 = Date.now(), iv = setInterval(() => { try { const k = Math.min(1, (Date.now() - t0) / 1200); w.setOpacity(1 - k); if (k >= 1) { clearInterval(iv); w.destroy(); } } catch { clearInterval(iv); } }, 33); } catch {} } sideCovers = []; }, 14000);
  } catch (e) { log('cover: ' + e.message); }
}
function blackDesktop() {   // v815: Windows' desktop colour (shown where there is no wallpaper picture) becomes the console's near-black right now, without waiting for the next sign-in
  try {
    execFile('reg', ['add', 'HKCU\\Control Panel\\Colors', '/v', 'Background', '/t', 'REG_SZ', '/d', '0 0 0', '/f'], { windowsHide: true, timeout: 5000 }, () => {});
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', "Add-Type -Name W -Namespace N -MemberDefinition '[DllImport(\"user32.dll\")] public static extern bool SetSysColors(int n,int[] i,int[] c);'; [N.W]::SetSysColors(1,@(1),@(0x000000)) | Out-Null"], { windowsHide: true, timeout: 15000 }, () => {});
  } catch {}
}
let shellChecked = false;
function startExplorerIfShell() {   // when the console IS the Windows shell (console-shell-on.bat), nothing draws the taskbar and desktop until this starts them; the taskbar stays hidden on the console's monitor
  if (shellChecked || process.platform !== 'win32') return; shellChecked = true;
  const running = () => { try { const r = spawnSync('tasklist', ['/FI', 'IMAGENAME eq explorer.exe', '/NH'], { encoding: 'utf8', windowsHide: true, timeout: 5000 }); return /explorer\.exe/i.test(r.stdout || ''); } catch { return true; } };
  const start = () => { try { log('shell: starting explorer.exe (the console is the Windows shell)'); const c = spawn('explorer.exe', [], { detached: true, stdio: 'ignore', windowsHide: false }); c.on('error', (e) => log('shell: explorer failed: ' + e.message)); c.unref(); } catch (e) { log('shell: ' + e.message); } };
  const startup = () => { try { const f = path.join(__dirname, 'native', 'startup.ps1'); if (!fs.existsSync(f)) return; log('shell: running the Windows startup programs (Armoury Crate etc.)'); const c = spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', f], { windowsHide: true, stdio: 'ignore' }); c.on('error', (e) => log('startup: ' + e.message)); c.unref(); } catch (e) { log('startup: ' + e.message); } };
  setTimeout(() => { if (!running()) { blackDesktop(); startup(); start(); setTimeout(() => { if (!running()) start(); }, 7000); } }, 200);   // only when the console really is the shell (no explorer yet): Windows' own startup programs are run here, because only the normal shell starts them
}
function startTaskbarHide() {   // the taskbar on the console's monitor is hidden while the console runs, and comes back when it quits
  try {
    const f = path.join(app.getPath('userData'), 'taskbar-orig.txt');
    if (fs.existsSync(f)) { const n = parseInt(fs.readFileSync(f, 'utf8'), 10); if (Number.isInteger(n)) sendHelper('tbset ' + n); fs.unlinkSync(f); }
    if (!fs.existsSync(path.join(__dirname, 'keeptaskbar.txt')) && win) sendHelper('tray hide ' + consoleHwnd());
  } catch {}
}
let xbDownAt = 0, xbT = null, xbQ = null, xbQ2 = null, xbFired = false, xbShown = false, xbClosing = false;
let lastHL = '', lastHLAt = 0;
const hq = [];   // questions waiting for an answer from the controller helper (it already has everything loaded, so it answers in a millisecond; a new PowerShell takes about a second)
function helperAsk(cmd, prefix, ms) {
  return new Promise((resolve) => {
    if (!helper || !helperReady) return resolve(null);
    const q = { prefix, resolve }; hq.push(q);
    q.t = setTimeout(() => { const i = hq.indexOf(q); if (i >= 0) hq.splice(i, 1); resolve(null); }, ms || 800);
    sendHelper(cmd);
  });
}
function onHelperLine(l) {
  for (let i = 0; i < hq.length; i++) if (l.startsWith(hq[i].prefix)) { const q = hq.splice(i, 1)[0]; clearTimeout(q.t); q.resolve(l.slice(q.prefix.length)); return; }
  if (!/^[pk] /.test(l)) { lastHL = l; lastHLAt = Date.now(); }
  if (!/^[pk] /.test(l) && (l !== 'pad press' && l !== 'pad press other' || Date.now() - (hlogAt || 0) > 2000)) { if (/^pad press/.test(l)) hlogAt = Date.now(); log('helper: ' + l); }
  if (l === 'ready') { helperReady = true; ftSent = ''; pinNow = '0'; regainNow = false; meSent = ''; sgNow = ''; pushCfg(loadSettings()); startTaskbarHide(); startExplorerIfShell(); if (!firstFront) { firstFront = true; setTimeout(() => { try { bringToFront(false); } catch {} }, 300); } }
  else if (l.startsWith('tbstate ')) { try { const f = path.join(app.getPath('userData'), 'taskbar-orig.txt'); if (!fs.existsSync(f)) fs.writeFileSync(f, l.slice(8).trim()); } catch {} }
  else if (l.startsWith('p ')) { try {   // controller input while the console is not the active window: handed to the page directly, so it never freezes
    if (win && win.isVisible() && !win.isMinimized() && win.isFocused() && !win.webContents.isFocused() && !brShown && !spShown && !ytShown && !ypShown && !dcShown && !running && !launching && !mouseState && !dlgOpen) win.webContents.focus(); if (win && win.isVisible() && !win.isMinimized() && !win.isFocused() && !running && !launching && !mouseState && !dlgOpen) { /* forwarded moves are ignored: the first push only returns the focus */ if (Date.now() - (padLogAt || 0) > 5000) { padLogAt = Date.now(); log('pad forwarded: ' + l.slice(2)); } }
  } catch {} }
  else if (l === 'pad press' || l === 'pad press other') { try { if (win && win.isVisible() && !win.isMinimized() && !win.isFocused() && !running && !launching && !mouseState && !dlgOpen && (l === 'pad press other' || !extActive) && !(oskWin && !oskWin.isDestroyed() && oskWin.isVisible())) { win.focus(); sendHelper('front ' + consoleHwnd()); } } catch {} }   // you are working on another monitor: any controller press or stick movement hands the focus back to the console
  else if (l === 'mode on') setMouse(true, false);
  else if (l === 'mode off') setMouse(false, false);
  else if (l === 'guide') onGuide();
  else if (l === 'guide down') { xbDownAt = Date.now(); xbFired = false; clearTimeout(xbT); clearTimeout(xbQ); 
    xbT = setTimeout(() => { xbFired = true; log('xbox button held: opening the menu'); try { onGuide(false); } catch {} }, 450); }
  else if (l === 'guide up') { clearTimeout(xbT); if (!xbFired) { log('xbox button tapped'); try { onGuide('xb'); } catch {} } xbFired = false; }   // the Xbox (Nexus) button works like Share: tap = home (inside a game: the game's page), hold = the menu
  else if (l.startsWith('ext ')) { const v = l.slice(4); if (v === 'gone') { if (win) takeBack(); } else if (/^\d+$/.test(v)) { extHwnd = v; appHandoff(); } }
  else if (l === 'btn a') { if (win) win.webContents.send('intro:a'); }
  else if (l === 'pad 1' || l === 'pad 0') { xpad = l === 'pad 1'; if (win && !win.isDestroyed()) win.webContents.send('pad', xpad);
    if (xpad) { padSeen = true; clearTimeout(padOffT); padOffT = null; if (quitT) { clearTimeout(quitT); quitT = null; fadeWin(1, 400); if (win) win.webContents.send('poweroff', 0); } }
    // (the controller switching off no longer closes the console: it is closed from the Xbox menu, Power > Exit)
  }
  else if (l.startsWith('batt ')) { const m = l.split(' '); lastBatt = { type: +m[1] || 0, level: +m[2] || 0 }; if (win) win.webContents.send('cbatt', battNow()); }
  else if (l.startsWith('shield ')) log('helper: ' + l);
  else if (l === 'kb on') showOsk();
  else if (l === 'kb off') hideOsk();
  else if (l.startsWith('k ')) handleK(l.slice(2));
}
let helperRestarts = 0, hlogAt = 0, helperReady = false;
let firstFront = false;   // right after it starts (for example woken by the controller) the console takes the screen over whatever was open, the same way it does when you come back from a game
function startHelper() {
  if (process.platform !== 'win32') return;
  startChargeWatch(); startShareHid();
  helper = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', path.join(__dirname, 'native', 'mouse.ps1')], { windowsHide: true });
  let buf = '';
  helper.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { onHelperLine(buf.slice(0, i).trim()); buf = buf.slice(i + 1); } });
  helper.stderr.on('data', (d) => log('helper: ' + d));
  const t0h = Date.now(); helper.on('exit', (c) => { log('helper exit ' + c); helper = null; if (Date.now() - t0h > 30000) helperRestarts = 0; if (!app.isQuitting && helperRestarts++ < 20) setTimeout(() => { try { startHelper(); } catch {} }, 800); });   // the controller helper is restarted if it ever stops
  helper.stdin.on('error', () => {});
  const hh = helper; helperReady = false; setTimeout(() => { if (helper === hh && !helperReady) log('helper: no ready signal after 20 s (the controller helper may have failed to compile)'); }, 20000);
}
ipcMain.handle('cbatt:get', () => battNow());
// ---- Discord: the real Discord web app (unmodified) runs inside the console window; voice keeps going when it is hidden ----
let dcView = null, dcShown = false, dcShareAt = 0, dcShareT = null;
const DC_HOST = /^https:\/\/([a-z0-9-]+\.)?(discord\.com|discordapp\.com|discord\.gg)(\/|$)/i;
function dcEnsure() {
  if (dcView && !dcView.webContents.isDestroyed()) return dcView;
  const { WebContentsView, session, desktopCapturer } = require('electron');
  const ses = session.fromPartition('persist:discord');
  try { ses.setUserAgent(ses.getUserAgent().replace(/\s*(my-console|Electron)\/\S+/g, '')); } catch {}
  ses.setPermissionRequestHandler((_wc, perm, cb, det) => cb(DC_HOST.test((det && det.requestingUrl) || '') && ['media', 'display-capture', 'notifications', 'fullscreen', 'clipboard-sanitized-write', 'mediaKeySystem'].includes(perm)));
  ses.setPermissionCheckHandler((_wc, perm, origin) => DC_HOST.test(String(origin || '') + '/') && ['media', 'display-capture', 'notifications', 'fullscreen', 'clipboard-sanitized-write'].includes(perm));
  ses.setDisplayMediaRequestHandler((_req, cb) => { dcShareAt = Date.now(); try { log('discord: screen share started - wallpaper becomes a light still picture for the next 90 minutes'); clearTimeout(dcShareT); dcShareT = setTimeout(() => { try { log('discord: share mode over - live wallpaper back'); win.webContents.executeJavaScript('window.__shareMode&&window.__shareMode(false)').catch(() => {}); } catch {} }, 90 * 60e3); win.webContents.executeJavaScript('window.__shareMode&&window.__shareMode(true)').catch(() => {}); } catch {}   // "Share your screen": the screen the console is on (no sound, so the people watching never hear themselves)
    desktopCapturer.getSources({ types: ['screen'] }).then((src) => { const d = homeDisplay(); const sc = (d && src.find((x) => String(x.display_id) === String(d.id))) || src[0]; cb(sc ? { video: sc } : {}); }).catch(() => cb({}));
  }, { useSystemPicker: false });
  dcView = new WebContentsView({ webPreferences: { session: ses, sandbox: true, contextIsolation: true, nodeIntegration: false } });
  dcView.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//i.test(url)) { if (DC_HOST.test(url)) dcView.webContents.loadURL(url); else shell.openExternal(url).catch(() => {}); } return { action: 'deny' }; });
  dcView.webContents.on('will-navigate', (e, url) => { if (!DC_HOST.test(url)) { e.preventDefault(); if (/^https:\/\//i.test(url)) shell.openExternal(url).catch(() => {}); } });
  dcView.webContents.on('did-finish-load', () => { try { dcView.webContents.setZoomFactor(1.4); } catch {} });
  dcView.webContents.loadURL('https://discord.com/app').catch((er) => log('discord: ' + er.message));
  return dcView;
}
function dcFit() { try { if (dcView && dcShown && win) { const b = win.getContentBounds(); dcView.setBounds({ x: 0, y: 0, width: b.width, height: b.height }); } } catch {} }
function dcShow() {
  if (!win) return { ok: false };
  try {
    const v = dcEnsure();
    if (!dcShown) { win.contentView.addChildView(v); dcShown = true; }
    dcFit(); try { v.webContents.setZoomFactor(1.4); } catch {}   // bigger, readable from the couch
    v.webContents.focus();
    sendHelper('on');   // the sticks move the cursor and A clicks, like in a web page
    log('discord: shown');
    return { ok: true };
  } catch (e) { log('discord open: ' + e.message); return { ok: false, error: e.message }; }
}
function dcHide() {
  try { if (dcShown && dcView && win) { win.contentView.removeChildView(dcView); } } catch {}
  if (dcShown) { dcShown = false; if (!mouseState) sendHelper('off'); try { if (win) win.webContents.focus(); } catch {} log('discord: hidden (voice keeps running)'); }
}
function dcKey(k) {   // Discord's own shortcuts: Ctrl+Shift+M mutes, Ctrl+Shift+D deafens
  try {
    if (!dcView || dcView.webContents.isDestroyed()) return false;
    const wc = dcView.webContents, kc = k.toUpperCase();
    wc.sendInputEvent({ type: 'keyDown', keyCode: kc, modifiers: ['control', 'shift'] }); wc.sendInputEvent({ type: 'char', keyCode: kc, modifiers: ['control', 'shift'] }); wc.sendInputEvent({ type: 'keyUp', keyCode: kc, modifiers: ['control', 'shift'] });
    return true;
  } catch { return false; }
}
// ---- Party: voice channel members, mute / deafen / leave / join through the Discord app's local connection (discord-rpc.js) ----
function dcLaunchHidden() {   // Discord is not running: start it minimized to the tray, so no window ever shows
  if (process.platform !== 'win32') return;
  execFile('tasklist', ['/FI', 'IMAGENAME eq Discord.exe', '/NH'], { windowsHide: true, timeout: 8000 }, (err, out) => {
    if (!err && /Discord\.exe/i.test(String(out))) { log('discord: already running, not starting it'); return; }
    const upd = path.join(process.env.LOCALAPPDATA || '', 'Discord', 'Update.exe');
    if (!fs.existsSync(upd)) { log('discord: Update.exe not found'); return; }
    log('discord: starting it minimized to the tray');
    const ch = spawn(upd, ['--processStart', 'Discord.exe', '--process-start-args', '--start-minimized'], { detached: true, stdio: 'ignore', windowsHide: true }); ch.on('error', (e) => log('discord start: ' + e.message)); ch.unref();
  });
}
let dcRpc = null;
function rpcGet() {
  if (!dcRpc) { try { dcRpc = require('./discord-rpc').create({ dir: app.getPath('userData'), log, onState: (st) => { try { if (win) win.webContents.send('party:state', st); } catch {} dcPartyHook(st); }, launch: dcLaunchHidden }); } catch (e) { log('discord rpc: ' + e.message); } }
  return dcRpc;
}
ipcMain.handle('party:start', () => { const r = rpcGet(); if (!r) return null; r.start(); return r.state(); });
ipcMain.handle('party:act', async (_e, cmd, arg) => { try { const r = rpcGet(); if (!r || !['mute', 'deaf', 'leave', 'join'].includes(cmd)) return { ok: false, error: 'not available' }; await r[cmd](arg); return { ok: true }; } catch (e) { log('party ' + cmd + ': ' + e.message); return { ok: false, error: e.message }; } });
ipcMain.handle('party:list', async () => { try { const r = rpcGet(); return { ok: true, list: await r.list() }; } catch (e) { log('party list: ' + e.message); return { ok: false, error: e.message }; } });
// ---- Spotify: built into the console (spotify.js). A hidden player inside the console is a Spotify device; the screens are the console's own ----
let spApi = null, spPlayerWin = null, spDevice = '', spErr = '';
function spGet() {
  if (!spApi) {
    try {
      const enc = safeStorage.isEncryptionAvailable() ? { enc: (s) => safeStorage.encryptString(s), dec: (b) => safeStorage.decryptString(b) } : null;
      spApi = require('./spotify').create({ dir: app.getPath('userData'), log, enc, openAuth: spAuthWindow });
    } catch (e) { log('spotify: ' + e.message); }
  }
  return spApi;
}
function spAuthWindow(url, redirect) {   // Spotify's own sign-in page, in its own small window, only for the sign-in
  return new Promise((resolve) => {
    const { BrowserWindow, session } = require('electron');
    const ses = session.fromPartition('persist:spotify-auth');
    let done = false; const fin = (v) => { if (done) return; done = true; try { sendHelper('off'); } catch {} try { aw.destroy(); } catch {} resolve(v); };
    const aw = new BrowserWindow({ width: 1100, height: 780, parent: win || undefined, modal: false, autoHideMenuBar: true, title: 'Spotify sign-in', webPreferences: { session: ses, sandbox: true, contextIsolation: true } });
    const check = (u) => { if (u.startsWith(redirect)) { try { const q = new URL(u).searchParams; fin({ code: q.get('code'), state: q.get('state') }); } catch { fin(null); } return true; } return false; };
    aw.webContents.on('will-redirect', (e, u) => { if (check(u)) e.preventDefault(); });
    aw.webContents.on('will-navigate', (e, u) => { if (check(u)) e.preventDefault(); });
    aw.on('closed', () => fin(null));
    aw.loadURL(url).catch(() => fin(null));
    try { sendHelper('on'); } catch {}   // the sticks move the cursor and A clicks while you sign in
  });
}
function spEnsurePlayer() {
  if (spPlayerWin && !spPlayerWin.isDestroyed()) return;
  const { BrowserWindow } = require('electron');
  spPlayerWin = new BrowserWindow({ show: false, width: 300, height: 200, skipTaskbar: true, webPreferences: { preload: path.join(__dirname, 'sp-preload.js'), autoplayPolicy: 'no-user-gesture-required', backgroundThrottling: false, contextIsolation: true, sandbox: false } });
  spPlayerWin.loadFile(path.join(__dirname, 'renderer', 'spotify-player.html')).catch((e) => log('spotify player: ' + e.message));
  try {
    const wc = spPlayerWin.webContents;
    wc.on('console-message', (...a) => { const o = a[0] && typeof a[0] === 'object' && a[0].message !== undefined ? a[0] : { level: a[1], message: a[2] }; const t = String(o.message || ''); if (/EME|licen[cs]e|widevine|drm|MediaKey|decrypt|encrypted|key system|key session/i.test(t) || o.level === 'error' || o.level === 3) log('spotify player page: ' + t.slice(0, 260)); });
    wc.session.webRequest.onCompleted({ urls: ['*://*/*licen*', '*://*/*widevine*', '*://*/*drm*'] }, (d) => log('spotify license: ' + d.statusCode + ' ' + d.method + ' ' + String(d.url).slice(0, 140)));
    wc.session.webRequest.onErrorOccurred({ urls: ['*://*/*licen*', '*://*/*widevine*', '*://*/*drm*'] }, (d) => log('spotify license error: ' + d.error + ' ' + String(d.url).slice(0, 140)));
  } catch (e) { log('spotify player diagnostics: ' + e.message); }
  spPlayerWin.on('closed', () => { spPlayerWin = null; spDevice = ''; });
}
ipcMain.handle('sp:token', async () => { const a = spGet(); return a ? a.token() : ''; });
ipcMain.on('sp:report', (_e, o) => {
  if (o && typeof o.note === 'string') { log('spotify player note: ' + o.note.slice(0, 260)); return; }
  if (o && typeof o.device === 'string') { spDevice = o.device; if (o.device) spErr = ''; log('spotify player: device ' + (o.device ? 'ready' : 'gone')); }
  if (o && typeof o.error === 'string') { spErr = o.error.slice(0, 200); log('spotify player: ' + spErr); }
  try { if (win) win.webContents.send('sp:player', { device: spDevice, error: spErr }); } catch {}
});
ipcMain.handle('sp:status', () => { const a = spGet(); const s = a ? a.status() : { hasId: false, signedIn: false }; if (s.signedIn) spEnsurePlayer(); return { ...s, device: spDevice, error: spErr }; });
ipcMain.handle('sp:setid', (_e, v) => { const a = spGet(); return !!(a && a.setId(v)); });
ipcMain.handle('sp:signin', async () => { try { const a = spGet(); await a.signIn(); spEnsurePlayer(); return { ok: true }; } catch (e) { log('spotify sign-in: ' + e.message); return { ok: false, error: e.message }; } });
ipcMain.handle('sp:signout', () => { const a = spGet(); if (a) a.signOut(); try { if (spPlayerWin) spPlayerWin.destroy(); } catch {} return true; });
ipcMain.handle('sp:call', async (_e, method, p, body) => {   // only Spotify's own music endpoints; the sign-in token never leaves the main process
  try {
    const a = spGet(); if (!a) return { ok: false, error: 'Spotify is not available.' };
    method = String(method || 'GET').toUpperCase(); p = String(p || '');
    const okGet = /^\/(me|search|playlists|albums|artists|browse|tracks|recommendations)(\/|\?|$)/.test(p), okPlayer = /^\/me\/(player|tracks)(\/|\?|$)/.test(p);
    if (method === 'GET' ? !okGet : !(okPlayer && (method === 'PUT' || method === 'POST' || method === 'DELETE'))) return { ok: false, error: 'not allowed' };
    return { ok: true, data: await a.call(method, p, body) };
  } catch (e) { log('spotify api ' + method + ' ' + String(p).slice(0, 90) + ' -> ' + (e.status || '') + ' ' + e.message); return { ok: false, error: e.message, status: e.status || 0 }; }
});
// ---- Discord's own window, only when you share or watch a screen: it comes up on your second monitor and goes back to the tray when you are done ----
let dcWinShown = false, dcHadChan = false, dcHiddenOnce = false, dcWantCursor = false, dcKeepT = null;
function dcWinNote() { try { if (win) win.webContents.send('dc:win', dcWinShown); } catch {} }
let dcProc = null;
function dcSend(line) {   // a small helper that stays running, so showing and hiding Discord's window is instant
  if (process.platform !== 'win32') return;
  try {
    if (!dcProc || dcProc.killed || dcProc.exitCode !== null) {
      dcProc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'native', 'dcwin.ps1')], { windowsHide: true });
      dcProc.stdout.on('data', (d) => { const t = String(d).trim(); if (t && t !== 'ready') log('discord window: ' + t.replace(/\s+/g, ' ')); });
      dcProc.on('error', (e) => log('discord window helper: ' + e.message));
    }
    dcProc.stdin.write(line + '\n');
  } catch (e) { log('discord window helper: ' + e.message); }
}
function dcPs(mode, rect) { if (mode === 'hide') return dcSend('hide'); const r = rect || { x: 0, y: 0 }; dcSend('show ' + Math.round(r.x) + ' ' + Math.round(r.y) + ' ' + Math.round(r.width || 1920) + ' ' + Math.round(r.height || 1080)); }
function dcSecondRect() {
  try { const { screen } = require('electron'); const home = homeDisplay(), other = screen.getAllDisplays().find((d) => !home || d.id !== home.id) || home; try { return screen.dipToScreenRect(null, other.bounds); } catch { return other.bounds; } } catch { return { x: 0, y: 0 }; }
}
function dcRaise() {
  if (process.platform !== 'win32' || !win) return { ok: false };
  const upd = path.join(process.env.LOCALAPPDATA || '', 'Discord', 'Update.exe');
  if (!fs.existsSync(upd)) return { ok: false, error: 'Discord is not installed.' };
  dcPs('show', dcSecondRect());   // the helper waits for Discord's window and puts it on the second monitor the moment it exists
  const cs = dcRpc && dcRpc.state().channel; const hasLink = !!(cs && /^\d+$/.test(String(cs.id)));
  if (!hasLink) { const ch = spawn(upd, ['--processStart', 'Discord.exe'], { detached: true, stdio: 'ignore', windowsHide: true }); ch.on('error', () => {}); ch.unref(); }   // an already running Discord just shows its window
  try {   // open the call's own page (server, voice channel) so the Share screen button and the streams are right there
    const ch = dcRpc && dcRpc.state().channel;
    if (ch && /^\d+$/.test(String(ch.id))) { const g = /^\d+$/.test(String(ch.guild)) ? ch.guild : '@me'; shell.openExternal('discord://-/channels/' + g + '/' + ch.id).catch((e) => log('discord link: ' + e.message)); log('discord: opening the call page'); }
  } catch {}
  dcWinShown = true; dcHadChan = !!(dcRpc && dcRpc.state().channel);
  dcWantCursor = true; mouseState = true; sendHelper('on');   // the sticks move the cursor and A clicks; the Xbox button gives the menu back
  clearInterval(dcKeepT); dcKeepT = setInterval(() => { if (!dcWinShown || !dcWantCursor) { clearInterval(dcKeepT); return; } if (!mouseState) { log('discord: cursor mode was switched off, putting it back'); mouseState = true; } sendHelper('on'); }, 1000);
  log('discord: window shown on the second monitor'); dcWinNote();
  return { ok: true };
}
function dcHideWin() {
  if (!dcWinShown) return;
  dcWinShown = false; dcHadChan = false; dcWantCursor = false; clearInterval(dcKeepT); dcPs('hide');
  if (mouseState) setMouse(false, true); else sendHelper('off');
  log('discord: window hidden again'); dcWinNote();
}
function dcPartyHook(st) {   // runs on every Party update
  try {
    if (st.auth === 'ok' && !dcHiddenOnce) { dcHiddenOnce = true; if (!dcWinShown) dcSend('hide'); }   // Discord is kept out of sight from the start
    if (dcWinShown) { if (st.channel) dcHadChan = true; else if (dcHadChan) dcHideWin(); }   // you left the call: the share or watch is over
  } catch {}
}
app.on('will-quit', () => { try { if (dcProc) dcProc.kill(); } catch {} });
ipcMain.handle('discord:raise', () => dcRaise());
ipcMain.handle('discord:hidewin', () => { dcHideWin(); return true; });
// ---- Spotify: Spotify's own web player runs inside the console window (the real app look); the sticks move the cursor ----
let spView = null, spShown = false;
const SP_HOST = /^https:\/\/([a-z0-9-]+\.)?(spotify\.com|scdn\.co|spotifycdn\.com|spotify\.link)(\/|$)/i;
function spEnsure() {
  if (spView && !spView.webContents.isDestroyed()) return spView;
  const { WebContentsView, session } = require('electron');
  const ses = session.fromPartition('persist:spotifyweb');
  try { ses.setUserAgent(ses.getUserAgent().replace(/\s*(my-console|Electron)\/\S+/g, '')); } catch {}
  ses.setPermissionRequestHandler((_wc, perm, cb, det) => cb(SP_HOST.test((det && det.requestingUrl) || '') && ['mediaKeySystem', 'fullscreen', 'clipboard-sanitized-write', 'media'].includes(perm)));
  ses.setPermissionCheckHandler((_wc, perm, origin) => SP_HOST.test(String(origin || '') + '/') && ['mediaKeySystem', 'fullscreen', 'clipboard-sanitized-write'].includes(perm));
  spView = new WebContentsView({ webPreferences: { session: ses, sandbox: true, contextIsolation: true, nodeIntegration: false } });
  spView.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//i.test(url)) { if (SP_HOST.test(url)) spView.webContents.loadURL(url); else shell.openExternal(url).catch(() => {}); } return { action: 'deny' }; });
  spView.webContents.on('will-navigate', (e, url) => { if (!SP_HOST.test(url)) { e.preventDefault(); if (/^https:\/\//i.test(url)) shell.openExternal(url).catch(() => {}); } });
  const SP_CSS = '::-webkit-scrollbar{display:none!important} html{scroll-behavior:auto!important} *,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:.001s!important;animation-delay:0s!important;backdrop-filter:none!important;scroll-behavior:auto!important}';
  const inject = () => { try { const wc = spView.webContents; wc.setZoomFactor(1.4); wc.executeJavaScript("if(!window.__cnTx){window.__cnTx=1;document.addEventListener('focusin',function(e){var t=e.target;if(t&&t.matches&&t.matches('input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]),textarea,[contenteditable=true]'))console.log('__cn__osk');},true);}").catch(() => {}); wc.insertCSS(SP_CSS).catch(() => {}); if (spShown) wc.focus(); } catch (e) { log('spotify web inject: ' + e.message); } };
  spView.webContents.on('before-input-event', (e, inp) => { if (inp.type === 'keyDown' && inp.alt && inp.key === 'ArrowLeft') { e.preventDefault(); spBack(); } else if (inp.type === 'keyDown' && (inp.code === 'F13' || inp.key === 'F13')) { e.preventDefault(); spPrev(); } else if (inp.type === 'keyDown' && (inp.code === 'F14' || inp.key === 'F14')) { e.preventDefault(); spNext(); } });
  spView.webContents.on('did-finish-load', () => { spLoaded = true; inject(); }); spView.webContents.on('did-navigate', () => setTimeout(inject, 300));
  spView.webContents.on('console-message', (...a) => { const msg = a[0] && typeof a[0] === 'object' && a[0].message !== undefined ? a[0].message : a[3] === undefined ? a[2] : a[2]; if (msg === '__cn__osk') spKeyboard(); else if (msg === '__cn__exit') spHide(); else if (msg === '__cn__ready' || msg === '__cn__pad') log('spotify web: ' + msg.slice(6)); else if (/^__cn__dbg/.test(msg)) log('spotify web: ' + msg.slice(7)); });
  spView.webContents.loadURL('https://open.spotify.com/').catch((er) => log('spotify web: ' + er.message));
  return spView;
}
function spFit() { try { if (spView && spShown && win) { const b = win.getContentBounds(); spView.setBounds({ x: 0, y: 0, width: b.width, height: b.height }); } } catch {} }
let spPrevAt = 0;
const spClick = (sel) => { try { spView.webContents.executeJavaScript(`(function(){var b=document.querySelector('${sel}');if(b)b.click();})()`).catch(() => {}); } catch {} };
function spNext() { spClick('[data-testid=control-button-skip-forward]'); }
async function spPrev() {   // LB: restart the song; pressing it again soon after goes to the previous one
  const now = Date.now(), again = now - spPrevAt < 2800; spPrevAt = now;
  if (again) { spClick('[data-testid=control-button-skip-back]'); return; }
  try { const a = spGet(); if (a) { await a.call('PUT', '/me/player/seek?position_ms=0'); return; } } catch {}
  spClick('[data-testid=control-button-skip-back]');
}
ipcMain.handle('sp:ctl', (_e, k) => {   // the Xbox menu's Spotify card presses the same buttons as the Spotify page, so it answers at once
  try {
    if (typeof k === 'string' && k.startsWith('vol:')) {   // volume: whichever player is really playing (the hidden console player or the Spotify web page) is set at once, with no web round trip
      const kp = k.split(':'), where = kp[2] || 'all'; const v = Math.max(0, Math.min(100, parseInt(kp[1], 10) || 0)) / 100; let did = false;
      if (where !== 'page' && spPlayerWin && !spPlayerWin.isDestroyed()) { spPlayerWin.webContents.executeJavaScript('window.__sp && window.__sp.setVolume(' + v + ')').catch(() => {}); did = true; }
      if (where !== 'sdk' && spView && spLoaded && !spView.webContents.isDestroyed()) {   // the Spotify page: its own volume slider is moved (the page then changes its sound itself, at once)
        spView.webContents.executeJavaScript('(function(v){var i=document.querySelector("[data-testid=volume-bar] input[type=range]")||document.querySelector("input[type=range][aria-label*=olume]");if(i){var mn=parseFloat(i.min||0),mx=parseFloat(i.max||1);var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;set.call(i,String(mn+v*(mx-mn)));i.dispatchEvent(new Event("input",{bubbles:true}));i.dispatchEvent(new Event("change",{bubbles:true}));return "slider"}document.querySelectorAll("audio,video").forEach(function(m){try{m.volume=v}catch(e){}});return "elements"})(' + v + ')').then((r) => { if (r !== spVolHow) { spVolHow = r; log('volume: Spotify page controlled through its ' + r); } }).catch(() => {}); did = true;
      }
      log('volume ' + Math.round(v * 100) + ' (' + where + ') -> console player: ' + !!(spPlayerWin && !spPlayerWin.isDestroyed()) + ', web page: ' + !!(spView && spLoaded));
      return { ok: did };
    }
    if (!spView || !spLoaded || spView.webContents.isDestroyed()) return { ok: false };
    if (k === 'next') spNext(); else if (k === 'prev') spPrev(); else if (k === 'pp') spClick('[data-testid=control-button-playpause]'); else return { ok: false };
    return { ok: true };
  } catch { return { ok: false }; }
});
function spBack() {   // B: close an open menu first, else go back a page, and leave Spotify from its home page
  try {
    const wc = spView.webContents;
    wc.executeJavaScript("!!document.querySelector('[role=menu],[role=dialog][aria-modal=true]')").then((open) => {
      if (open) { wc.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' }); wc.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' }); return; }
      const nh = wc.navigationHistory, can = nh ? nh.canGoBack() : wc.canGoBack(), u = new URL(wc.getURL());
      if (can && u.pathname !== '/') { if (nh) nh.goBack(); else wc.goBack(); } else spHide();
    }).catch(() => spHide());
  } catch { spHide(); }
}
let spMouseT = null;
function spBinds(on) {   // on the Spotify page: A clicks, X = right-click menu, B = back, Y = play/pause
  try { const m = loadSettings().mbinds; sendHelper(on ? `binds ${m.left} X NONE ${m.enter} NONE B Y LB RB` : `binds ${m.left} ${m.right} ${m.kbd} ${m.enter} ${m.esc} ${m.back}`); } catch {}
}
function spMouseOn() {   // the web page is steered like a mouse: sticks move the cursor, A clicks, the Xbox button gives the menu back
  mouseState = true; sendHelper('on'); spBinds(true);
  clearInterval(spMouseT); spMouseT = setInterval(() => { if (!spShown) { clearInterval(spMouseT); return; } mouseState = true; sendHelper('on'); }, 1000);
}
let spVolHow = '', spLoaded = false, spWait = false, spAnimT = null;
// the app steps back (shrinks a little) as the console comes up, then is taken off the screen
function viewOut(v) {   // the app slides down and away (moved only, never resized, so a playing video is not redrawn)
  try {
    if (!v || !win) return; clearInterval(v.__outT);
    if (ghostOn) { try { win.contentView.removeChildView(v); } catch {} return; }
    const b = win.getContentBounds(), t0 = Date.now(), D = 220;
    v.__outT = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / D), e = k * k, oy = Math.round(b.height * .12 * e);
      try { v.setBounds({ x: 0, y: oy, width: b.width, height: b.height }); } catch {}
      if (k >= 1) { clearInterval(v.__outT); v.__outT = null; try { win.contentView.removeChildView(v); } catch {} try { v.setBounds({ x: 0, y: 0, width: b.width, height: b.height }); } catch {} }
    }, 20);
  } catch {}
}
let spDiagT = null;
function spDiag() {   // a few lines in the log about what the PC is doing while Spotify is up, so lag can be traced
  try {
    let n = 0; clearInterval(spDiagT);
    try { log('gpu: ' + JSON.stringify(app.getGPUFeatureStatus())); } catch {}
    try { app.getGPUInfo('basic').then((i) => log('gpu adapter: ' + JSON.stringify((i.gpuDevice || []).map((g) => ({ vendor: g.vendorId, device: g.deviceId, driver: g.driverVendor + ' ' + g.driverVersion, active: g.active }))) + ' ' + JSON.stringify(i.auxAttributes && { glRenderer: i.auxAttributes.glRenderer, angle: i.auxAttributes.glImplementationParts || i.auxAttributes.angle }))).catch(() => {}); } catch {}
    spDiagT = setInterval(() => { try { if (!spShown || ++n > 6) { clearInterval(spDiagT); return; } log('cpu while Spotify is up: ' + app.getAppMetrics().filter((m) => m.cpu.percentCPUUsage > 1).map((m) => m.type + ' ' + m.cpu.percentCPUUsage.toFixed(0) + '%').join(', ')); } catch {} }, 4000);
  } catch {}
}
function spReveal() {   // the page is painted: it comes up with a short grow-in, never a white screen
  try {
    if (!win || spShown) return; const v = spEnsure();
    try { v.setBackgroundColor('#000000'); } catch {}
    const b = win.getContentBounds(); const t0 = Date.now(), D = 1;
    const put = (k) => { const ix = Math.round(b.width * .03 * (1 - k)), iy = Math.round(b.height * .03 * (1 - k)); v.setBounds({ x: ix, y: iy, width: b.width - ix * 2, height: b.height - iy * 2 }); };
    clearInterval(v.__outT); put(1); win.contentView.addChildView(v); spShown = true;
    clearInterval(spAnimT); spAnimT = setInterval(() => { const k = Math.min(1, (Date.now() - t0) / D), e = 1 - Math.pow(1 - k, 3); if (!spShown) { clearInterval(spAnimT); return; } put(e); if (k >= 1) { clearInterval(spAnimT); spFit(); } }, 16);
    v.webContents.setZoomFactor(1.4); v.webContents.focus(); spMouseOn(); spDiag(); try { win.webContents.executeJavaScript("document.body.classList.add('nofx')").catch(() => {}); } catch {} log('spotify web: shown (controller is the mouse)');
  } catch (e) { log('spotify web reveal: ' + e.message); }
}
function spShow() {
  if (!win) return { ok: false };
  try {
    const v = spEnsure(); try { v.setBackgroundColor('#000000'); } catch {}
    if (spShown) return { ok: true };
    if (spLoaded) { spReveal(); return { ok: true }; }
    if (!spWait) {   // first time: the page loads out of sight, and comes up once it has painted
      spWait = true; let done = false;
      const go = () => { if (done) return; done = true; if (spWait) { spWait = false; spReveal(); } };
      v.webContents.once('did-finish-load', () => setTimeout(go, 900)); setTimeout(go, 8000);
    }
    return { ok: true };
  } catch (e) { log('spotify web open: ' + e.message); return { ok: false, error: e.message }; }
}
function spKeyboard() {   // a text box was chosen:
  if (oskWin) return;   // a text box was chosen: the typing keyboard opens, and what you type goes into the page
  try { if (!spShown) return; spView.webContents.executeJavaScript('window.__cnPause=true').catch(() => {}); sendHelper('on'); sendHelper('kb on'); showOsk(); } catch {}
}
function spHide() {
  try { if (spView && !spView.webContents.isDestroyed()) spView.webContents.executeJavaScript('window.__cnPause=false').catch(() => {}); } catch {}
  try { if (spShown && spView && win) viewOut(spView); } catch {}
  spWait = false; clearInterval(spAnimT); clearInterval(spMouseT); if (spShown) { spShown = false; hideOsk(); mouseState = false; sendHelper('off'); spBinds(false); try { win.webContents.executeJavaScript("document.body.classList.remove('nofx')").catch(() => {}); } catch {} try { if (win) win.webContents.focus(); } catch {} log('spotify web: hidden (music keeps playing)'); }
}
// ---- sound engine for Spotify (go-librespot, see install-sound-engine.bat): the console starts it by itself, Spotify then plays through this PC ----
let lsProc = null, lsTries = 0, lsCode = '', lsPaired = false;
const lsDir = () => path.join(process.env.APPDATA || app.getPath('appData'), 'go-librespot');
function lsStart() {
  if (process.platform !== 'win32' || lsProc) return;
  if (!fs.existsSync(path.join(app.getPath('userData'), 'use-sound-engine.txt'))) return;   // off: Spotify refuses its audio keys right now (create this file to try it again)
  const exe = path.join(lsDir(), 'go-librespot.exe');
  if (!fs.existsSync(exe)) { log('sound engine: not installed (run tools\\install-sound-engine.bat)'); return; }
  try {
    lsProc = spawn(exe, [], { cwd: lsDir(), windowsHide: true });
    const pipeL = (d) => String(d).split(/\r?\n/).filter(Boolean).slice(0, 8).forEach((l) => { log('sound engine: ' + l.slice(0, 220)); const c = /enter code ([A-Z0-9]{4,10})/.exec(l); if (c) { lsCode = c[1]; lsPaired = false; } else if (/authenticat|logged in|signed in|welcome/i.test(l) && !/to complete authentication/i.test(l)) { lsPaired = true; } });
    lsProc.stdout.on('data', pipeL); lsProc.stderr.on('data', pipeL);
    lsProc.on('error', (e) => { log('sound engine: ' + e.message); lsProc = null; });
    lsProc.on('exit', (c) => { log('sound engine exit ' + c); lsProc = null; if (!app.isQuitting && lsTries++ < 5) setTimeout(lsStart, 4000); });
    log('sound engine: started');
  } catch (e) { log('sound engine start: ' + e.message); lsProc = null; }
}
app.on('will-quit', () => { try { if (lsProc) lsProc.kill(); } catch {} });
ipcMain.handle('ls:info', async () => {
  const out = { installed: fs.existsSync(path.join(lsDir(), 'go-librespot.exe')), running: !!lsProc, code: lsPaired ? '' : lsCode };
  try { const r = await fetch('http://127.0.0.1:3678/auth/code', { signal: AbortSignal.timeout(2500) }); out.auth = (await r.text()).slice(0, 400); out.authOk = r.ok; } catch {}
  try { const r = await fetch('http://127.0.0.1:3678/status', { signal: AbortSignal.timeout(2500) }); out.status = r.ok; } catch {}
  return out;
});
// ---- YouTube: YouTube's own TV screen (the same one game consoles show) runs inside the console window; the controller sends it the keys it expects ----
let ytView = null, ytShown = false;
const YT_HOST = /^https:\/\/([a-z0-9-]+\.)?(youtube\.com|youtube-nocookie\.com|google\.com|gstatic\.com|googlevideo\.com|ytimg\.com|ggpht\.com|googleusercontent\.com|googleapis\.com)(\/|$)/i;
function ytEnsure() {
  if (ytView && ytView.webContents && !ytView.webContents.isDestroyed()) return ytView;
  ytView = null;
  const { WebContentsView, session } = require('electron');
  const ses = session.fromPartition('persist:youtube');
  ses.setUserAgent(fs.existsSync(path.join(app.getPath('userData'), 'yt-ps5.txt')) ? 'Mozilla/5.0 (PlayStation; PlayStation 5/2.26) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15' : 'Mozilla/5.0 (PS4; Leanback Shell) Cobalt/26.lts.0-qa; compatible;');   // the identity YouTube's own TV player expects (it then offers the full quality formats)
  ses.setPermissionRequestHandler((_wc, perm, cb) => cb(['fullscreen', 'clipboard-sanitized-write', 'mediaKeySystem'].includes(perm)));
  // covers: swap YouTube's small thumbnails for the 1280px version when it exists (checked once per video, cached)
  const hqOk = new Map();
  const THUMB = /^(https:\/\/i\d?\.ytimg\.com\/(?:vi|vi_webp)\/[\w-]{11}\/)(?:default|mqdefault|hqdefault|sddefault)\.(jpg|webp)(?:\?.*)?$/i;
  ses.webRequest.onBeforeRequest({ urls: ['https://i.ytimg.com/vi/*', 'https://i.ytimg.com/vi_webp/*', 'https://i1.ytimg.com/vi/*', 'https://i9.ytimg.com/vi/*'] }, async (d, cb) => {
    const t = THUMB.exec(d.url); if (!t) return cb({});
    const hq = t[1] + 'hq720.' + t[2];
    try {
      if (!hqOk.has(hq)) hqOk.set(hq, require('electron').net.fetch(hq, { method: 'HEAD' }).then((r) => r.ok).catch(() => false));
      return cb(await hqOk.get(hq) ? { redirectURL: hq } : {});
    } catch { return cb({}); }
  });
  ytView = new WebContentsView({ webPreferences: { session: ses, sandbox: true, contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'yt-preload.js'), autoplayPolicy: 'no-user-gesture-required' } });
  const wc = ytView.webContents;
  wc.once('destroyed', () => { log('youtube: the page closed itself; it will be rebuilt next time'); ytView = null; ytLoaded = false; if (ytShown) { ytShown = false; try { if (win) win.webContents.focus(); } catch {} } });
  wc.setWindowOpenHandler(({ url }) => { if (YT_HOST.test(url)) wc.loadURL(url); return { action: 'deny' }; });
  wc.on('did-navigate', (_e, url) => { try { if (!/^https:\/\/www\.youtube\.com\/tv/i.test(url) && !/accounts\.google\.com/i.test(url) && ytShown) wc.loadURL('https://www.youtube.com/tv'); } catch {} });
  wc.on('will-navigate', (e, url) => { if (!YT_HOST.test(url)) e.preventDefault(); });
  const js = () => { try { return fs.readFileSync(path.join(__dirname, 'renderer', 'ytnav.js'), 'utf8'); } catch { return ''; } };
  const css = () => { try { wc.insertCSS('*{cursor:none!important} ::-webkit-scrollbar{display:none!important}').catch(() => {}); } catch {} };
  wc.on('did-finish-load', () => { ytLoaded = true; }); wc.on('dom-ready', css); wc.on('did-finish-load', css); wc.on('did-navigate', css); wc.on('did-navigate-in-page', css);
  const inject = () => { try { wc.executeJavaScript(js()).catch((e) => log('youtube nav: ' + e.message)); if (ytShown) wc.focus(); } catch {} };
  wc.on('did-finish-load', inject); wc.on('did-navigate', () => setTimeout(inject, 300));
  wc.on('console-message', (...a) => {
    const msg = a[0] && typeof a[0] === 'object' && a[0].message !== undefined ? a[0].message : a[2];
    if (typeof msg !== 'string') return;
    const k = /^__cn__key:(Left|Right|Up|Down|Return|Escape|Space)$/.exec(msg);
    if (k) { try { const kc = k[1] === 'Return' ? 'Enter' : k[1]; wc.sendInputEvent({ type: 'keyDown', keyCode: kc }); if (kc === 'Enter' || kc === 'Space') wc.sendInputEvent({ type: 'char', keyCode: kc }); wc.sendInputEvent({ type: 'keyUp', keyCode: kc }); } catch {} }
    else if (msg === '__cn__ready' || msg === '__cn__pad') log('youtube: ' + msg.slice(6));
    else if (msg.startsWith('__cn__yt ')) log('youtube caps: ' + msg.slice(9));
  });
    const zf = (() => { try { const v = parseFloat(fs.readFileSync(path.join(app.getPath('userData'), 'yt-zoom.txt'), 'utf8')); return v >= 0.4 && v <= 1.5 ? v : 1; } catch { return 1; } })();   // 1 = normal; a smaller number makes YouTube think the screen is bigger
  const z1 = () => { try { wc.setZoomFactor(zf); wc.setVisualZoomLevelLimits(1, 1); } catch {} };
  z1(); wc.on('did-finish-load', z1); wc.on('did-navigate', z1); wc.on('dom-ready', z1);
  wc.loadURL('https://www.youtube.com/tv').catch((er) => log('youtube: ' + er.message));
  return ytView;
}
function ytFit() { try { if (ytView && ytShown && win) { const b = win.getContentBounds(); ytView.setBounds({ x: 0, y: 0, width: b.width, height: b.height }); } } catch {} }

// ---- while an app, YouTube, Spotify, Discord or a game is in front, the console underneath stops animating (no wasted work, no lag) ----
let clipProc = null, clipTimer = null, kbMode = false, kbPauseAt = 0, kbMenuOpen = false, kbMenuAt = 0;
const clipFlag = () => path.join(require('os').tmpdir(), 'my-console-clip.txt');
function clipOn(r) {   // the mouse stays inside the Xbox menu (keyboard-and-mouse games); native/clip.ps1 lets go by itself when the flag file stops being refreshed
  try {
    fs.writeFileSync(clipFlag(), r.l + ' ' + r.t + ' ' + r.r + ' ' + r.b);
    if (!clipProc) { clipProc = spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'native', 'clip.ps1'), '-Flag', clipFlag()], { windowsHide: true }); clipProc.on('exit', () => { clipProc = null; }); }
    if (!clipTimer) clipTimer = setInterval(() => { try { if (!kbMode || (!kbMenuOpen && !running)) { clipOff(); sendHelper('unclip'); return; } const t = new Date(); fs.utimesSync(clipFlag(), t, t); } catch {} }, 1000);
  } catch (e) { log('mouse lock: ' + e.message); }
}
function clipOff() { try { clearInterval(clipTimer); clipTimer = null; fs.unlinkSync(clipFlag()); } catch {} }
ipcMain.handle('guide:clip', (_e, r) => {
  try {
    if (!r || !kbMode || !win) { clipOff(); if (!r) kbMode = false; return; }
    const z = win.webContents.getZoomFactor(), cb = win.getContentBounds();
    const p = require('electron').screen.dipToScreenRect(win, { x: Math.round(cb.x + r.l * z), y: Math.round(cb.y + r.t * z), width: Math.round((r.r - r.l) * z), height: Math.round((r.b - r.t) * z) });
    clipOn({ l: p.x, t: p.y, r: p.x + p.width, b: p.y + p.height });
  } catch (e) { log('mouse lock: ' + e.message); }
});
app.on('will-quit', clipOff);
let fxPaused = false;
function fxSync() {
  try {
    if (!win || win.isDestroyed() || win.webContents.isDestroyed()) return;
    const sharing = Date.now() - dcShareAt < 12 * 3600e3;   // v954: once you have shared your screen, Discord never pauses the console's wallpaper behind it
    const why = [brShown && 'browser', spShown && 'spotify', ytShown && 'youtube', ypShown && 'ytplayer', !sharing && dcShown && 'discord', !sharing && dcWinShown && 'discordwin', extActive && 'ext', launching && 'launching', win.isMinimized() && 'minimized', !win.isVisible() && 'hidden'].filter(Boolean);
    const pause = why.length > 0;
    if (pause === fxPaused) return; fxPaused = pause; try { log('fx: ' + (pause ? 'wallpaper paused because ' + why.join(',') : 'wallpaper running')); } catch {}
    const want = pause;
    win.webContents.executeJavaScript(pause
      ? "(function(){document.body.classList.add('bgpause');document.querySelectorAll('.ns-wl,.ns-bat,.ns-sh').forEach(function(e){e.remove();});document.getAnimations().forEach(function(a){if(!(window.CSSAnimation&&a instanceof CSSAnimation)&&!(window.CSSTransition&&a instanceof CSSTransition)&&a.playState==='running'){a.__bp=1;a.pause();}});document.querySelectorAll('video').forEach(function(v){if(!v.paused){v.dataset.bp='1';v.pause();}});})()"
      : "(function(){document.body.classList.remove('bgpause');document.getAnimations().forEach(function(a){if(a.__bp){a.__bp=0;try{a.play();}catch(e){}}});document.querySelectorAll('video[data-bp]').forEach(function(v){delete v.dataset.bp;try{v.play().catch(function(){});}catch(e){}});})()").catch(() => { if (fxPaused === want) fxPaused = !want; });
  } catch {}
}
setInterval(fxSync, 400);
let ytLoaded = false, ytWait = false;
function ytReveal() {
  try { if (!win || ytShown) return; const v = ytEnsure(); try { v.setBackgroundColor('#000000'); } catch {} clearInterval(v.__outT); win.contentView.addChildView(v); ytShown = true; ytFit(); v.webContents.focus(); ytKeep(); try { v.webContents.executeJavaScript("(function(){var v=document.querySelector('video');if(v&&v.__cnp){v.__cnp=0;v.play().catch(function(){});}})()").catch(() => {}); } catch {} log('youtube: shown'); } catch (e) { log('youtube reveal: ' + e.message); }
}
function ytShow() {   // the first time the page loads out of sight and comes up once painted; the app card covers the wait
  if (!win) return { ok: false };
  try {
    const v = ytEnsure(); try { v.setBackgroundColor('#000000'); } catch {}
    if (ytShown) return { ok: true };
    if (ytLoaded) { ytReveal(); return { ok: true }; }
    if (!ytWait) { ytWait = true; let done = false; const go = () => { if (done) return; done = true; if (ytWait) { ytWait = false; ytReveal(); } }; v.webContents.once('did-finish-load', () => setTimeout(go, 900)); setTimeout(go, 9000); }
    return { ok: true };
  } catch (e) { log('youtube open: ' + e.message); return { ok: false, error: e.message }; }
}
function ytHide() {
  ytWait = false;
  try { if (ytShown && ytView && !ytView.webContents.isDestroyed()) { const yv = ytView; setTimeout(() => { try { if (!ytShown && yv.webContents && !yv.webContents.isDestroyed()) yv.webContents.executeJavaScript("(function(){var v=document.querySelector('video');if(v&&!v.paused){v.__cnp=1;v.pause();}})()").catch(() => {}); } catch {} }, 700); } } catch {}
  try { if (ytShown && ytView && win) viewOut(ytView); } catch {}
  if (ytShown) { ytShown = false; try { if (win) win.webContents.focus(); } catch {} log('youtube: hidden (it keeps playing)'); }
}
// while YouTube is up it keeps the controller: the console underneath must not hear the buttons
let ytKeepT = null;
function ytKeep() { clearInterval(ytKeepT); ytKeepT = setInterval(() => { try { if (!ytShown || !ytView || ytView.webContents.isDestroyed()) { clearInterval(ytKeepT); return; } if (win && win.isFocused() && !ytView.webContents.isFocused()) ytView.webContents.focus(); } catch {} }, 250); }
ipcMain.handle('yt:open', () => ytShow());

// "Close app" for the apps built into the console: the page is really closed, so nothing keeps running behind
ipcMain.handle('app:close', async (_e, which) => {
  try {
    if (which === 'youtube') {
      ytWait = false; ytHide(); clearInterval(ytKeepT);
      const v = ytView; ytView = null; ytLoaded = false;
      if (v && v.webContents && !v.webContents.isDestroyed()) { try { v.webContents.setAudioMuted(true); } catch {} setTimeout(() => { try { v.webContents.close(); } catch {} }, 260); }
      log('youtube: closed'); return { ok: true };
    }
    if (which === 'spotify') {
      try { const a = spGet(); if (a) await a.call('PUT', '/me/player/pause'); } catch {}
      spWait = false; spHide();
      const v = spView; spView = null; spLoaded = false;
      if (v && v.webContents && !v.webContents.isDestroyed()) { try { v.webContents.setAudioMuted(true); } catch {} setTimeout(() => { try { v.webContents.close(); } catch {} }, 260); }
      log('spotify: closed (music stopped)'); return { ok: true };
    }
  } catch (e) { log('app close: ' + e.message); return { ok: false, error: e.message }; }
  return { ok: false, error: 'unknown app' };
});

// ---- Share button read straight from the controller's own reports (works when Game Bar is gone) ----
let shareProc = null, shareT = null, shareFired = false;
function startShareHid() {   // Share: a tap goes back to the console's home page, holding it opens the Xbox menu
  if (process.platform !== 'win32' || shareProc) return;
  try {
    let spec = [16, 12, 3];   // the Share button's place in the Scuf Valor Pro's reports
    try { const w = fs.readFileSync(path.join(app.getPath('userData'), 'share-hid.txt'), 'utf8').trim().split(/\s+/).map(Number); if (w.length === 3 && w.every((n) => Number.isInteger(n) && n >= 0)) spec = w; } catch {}
    shareProc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'native', 'share.ps1'), '-Len', String(spec[0]), '-ByteAt', String(spec[1]), '-BitAt', String(spec[2])], { windowsHide: true });
    let b = '', errs = 0;
    shareProc.stdout.on('data', (d) => { b += d; let i; while ((i = b.indexOf('\n')) >= 0) { const l = b.slice(0, i).trim(); b = b.slice(i + 1);
      if (l === 'pausekey 1') {
        try {
          if (win && !win.isDestroyed()) {
            const on = !!(running && (loadSettings().kbGames || []).includes(String(running.id))), now = Date.now();
            if (now - kbPauseAt < 750) { log('pause key: ignored (still switching)'); }   // a second press in the middle of a switch (or a key repeat) must not start another one
            else if (on) {   // inside a ticked keyboard-and-mouse game: Pause toggles the menu; the state is kept here, not guessed from which window has the focus (that is wrong while the windows are switching)
              kbPauseAt = now;
              const open = kbMenuOpen;   // only the remembered state counts (which window has the focus is wrong while switching, and a game that did not give the focus back made the next press go Home)
              if (open) { kbMenuOpen = false; kbMenuAt = now; log('pause key: back to the game'); win.webContents.send('gohome'); }
              else { kbMenuOpen = true; kbMenuAt = now; log('pause key: menu'); kbMode = true; win.webContents.send('kbmode', true); onGuide(false); }
            } else if (!running && win.isFocused() && !brShown && !spShown && !ytShown && !ypShown) { kbPauseAt = now; log('pause key: home'); win.webContents.send('gohome'); }   // no game running: Pause goes home
          }
        } catch {}
      }
      else if (l === 'share 1') { shareFired = false; clearTimeout(shareT); shareT = setTimeout(() => { shareFired = true; kbMode = false; log('share: held, opening the menu'); try { onGuide(false); } catch {} }, 450); }
      else if (l === 'share 0') { clearTimeout(shareT); if (!shareFired) { log('share: tapped, going home'); try { onGuide(true); } catch {} } shareFired = false; }
      else if (/^hid /.test(l)) { /* raw controller reports: not logged any more (thousands of lines, each one a disk write) */ }
      else if (l) log('share helper: ' + l); } });
    shareProc.stderr.on('data', (d) => { if (errs++ < 6) log('share helper error: ' + String(d).slice(0, 400)); });
    shareProc.on('exit', () => { shareProc = null; }); shareProc.on('error', () => { shareProc = null; });
  } catch { shareProc = null; }
}
ipcMain.handle('guide:share', () => { log('share button seen by the page: opening the menu'); onGuide(); return true; });
ipcMain.handle('yt:state', () => ({ shown: !!ytShown, open: !!(ytView && ytView.webContents && !ytView.webContents.isDestroyed()) }));
ipcMain.handle('yt:hide', () => { ytHide(); return true; });
// ---- YouTube in the console's own screen: search results come from YouTube's search, the video plays full quality in a player that fills the screen ----
let ypView = null, ypShown = false, ypKeepT = null;
const YP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';
const YP_CSS = 'html,body{overflow:hidden!important;background:#000!important} ytd-masthead,#masthead-container,#secondary,#below,#related,#comments,ytd-watch-metadata,tp-yt-app-drawer,#chips-wrapper,ytd-miniplayer{display:none!important} #movie_player{position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;z-index:2147483000!important} #movie_player .html5-video-container{width:100%!important;height:100%!important} #movie_player video{width:100vw!important;height:100vh!important;left:0!important;top:0!important;object-fit:contain!important} *{cursor:none!important} ::-webkit-scrollbar{display:none!important}';
function ypEnsure() {
  if (ypView && !ypView.webContents.isDestroyed()) return ypView;
  const { WebContentsView, session } = require('electron');
  const ses = session.fromPartition('persist:youtube-player');
  ses.setUserAgent(YP_UA);
  ses.setPermissionRequestHandler((_wc, perm, cb) => cb(['fullscreen', 'clipboard-sanitized-write', 'mediaKeySystem'].includes(perm)));
  ypView = new WebContentsView({ webPreferences: { session: ses, sandbox: true, contextIsolation: true, nodeIntegration: false, autoplayPolicy: 'no-user-gesture-required' } });
  const wc = ypView.webContents;
  wc.setZoomFactor(1);
  wc.setWindowOpenHandler(() => ({ action: 'deny' }));
  wc.on('will-navigate', (e, url) => { if (!YT_HOST.test(url)) e.preventDefault(); });
  const js = () => { try { return fs.readFileSync(path.join(__dirname, 'renderer', 'ypnav.js'), 'utf8'); } catch { return ''; } };
  const prep = () => {
    try {
      wc.setZoomFactor(1); wc.insertCSS(YP_CSS).catch(() => {}); wc.executeJavaScript(js()).catch((e) => log('youtube player nav: ' + e.message));
      let n = 0; const t = setInterval(() => { if (++n > 14 || wc.isDestroyed()) return clearInterval(t); wc.executeJavaScript("(() => { window.dispatchEvent(new Event('resize')); const p = document.getElementById('movie_player'); if (p) { try { p.setPlaybackQualityRange && p.setPlaybackQualityRange('hd1440', 'hd1440'); } catch (e) {} } })()").catch(() => {}); }, 700);
      if (ypShown) wc.focus();
    } catch {}
  };
  wc.on('did-finish-load', prep); wc.on('did-navigate-in-page', () => { try { wc.insertCSS(YP_CSS).catch(() => {}); } catch {} });
  wc.on('console-message', (...a) => {
    const msg = a[0] && typeof a[0] === 'object' && a[0].message !== undefined ? a[0].message : a[2];
    const k = typeof msg === 'string' ? /^__cn__key:(Left|Right|Up|Down|K|J|L|C|Esc|Skip)$/.exec(msg) : null; if (!k) return;
    const n = k[1];
    if (n === 'Esc') return ypHide();
    if (n === 'Skip') { wc.executeJavaScript("(() => { const b = document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button'); if (b) b.click(); })()").catch(() => {}); return; }
    try { const kc = n.length === 1 ? n.toLowerCase() : n; wc.sendInputEvent({ type: 'keyDown', keyCode: kc }); if (n.length === 1) wc.sendInputEvent({ type: 'char', keyCode: kc }); wc.sendInputEvent({ type: 'keyUp', keyCode: kc }); } catch {}
  });
  return ypView;
}
function ypFit() { try { if (ypView && ypShown && win) { const b = win.getContentBounds(); ypView.setBounds({ x: 0, y: 0, width: b.width, height: b.height }); } } catch {} }
function ypPlay(id) {
  if (!win || !/^[\w-]{11}$/.test(String(id))) return { ok: false };
  try {
    const v = ypEnsure(); if (!ypShown) { win.contentView.addChildView(v); ypShown = true; } ypFit();
    v.webContents.loadURL('https://www.youtube.com/watch?v=' + id).catch((er) => log('youtube player: ' + er.message));
    v.webContents.focus(); log('youtube player: ' + id);
    clearInterval(ypKeepT); ypKeepT = setInterval(() => { try { if (!ypShown || !ypView || ypView.webContents.isDestroyed()) return clearInterval(ypKeepT); if (win && win.isFocused() && !ypView.webContents.isFocused()) ypView.webContents.focus(); } catch {} }, 250);
    return { ok: true };
  } catch (e) { log('youtube player open: ' + e.message); return { ok: false, error: e.message }; }
}
function ypHide() {
  try { if (ypShown && ypView && win) { win.contentView.removeChildView(ypView); ypView.webContents.loadURL('about:blank').catch(() => {}); } } catch {}
  if (ypShown) { ypShown = false; clearInterval(ypKeepT); try { if (win) win.webContents.focus(); } catch {} log('youtube player: closed'); }
}
ipcMain.handle('yp:play', (_e, id) => ypPlay(id));
ipcMain.handle('yp:hide', () => { ypHide(); return true; });
ipcMain.handle('yt:search', async (_e, q) => {
  try {
    q = String(q || '').slice(0, 120); if (!q.trim()) return { ok: false, error: 'empty' };
    const r = await require('electron').net.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': YP_UA, 'accept-language': 'en-US,en;q=0.9' }, body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: '2.20260101.00.00', hl: 'en', gl: 'US' } }, query: q }) });
    if (!r.ok) { log('youtube search: HTTP ' + r.status); return { ok: false, error: 'HTTP ' + r.status }; }
    const j = await r.json(), out = [], seen = new Set();
    const txt = (o) => !o ? '' : (o.simpleText || (o.runs || []).map((x) => x.text).join('') || '');
    (function walk(o, d) {
      if (!o || typeof o !== 'object' || d > 14 || out.length >= 40) return;
      if (Array.isArray(o)) { for (const x of o) walk(x, d + 1); return; }
      const v = o.videoRenderer;
      if (v && v.videoId && !seen.has(v.videoId)) { seen.add(v.videoId); const live = (v.badges || []).some((b) => /live/i.test(JSON.stringify(b))) || !!v.upcomingEventData; out.push({ id: v.videoId, title: txt(v.title), by: txt(v.ownerText || v.longBylineText), len: txt(v.lengthText) || (live ? 'LIVE' : ''), views: txt(v.shortViewCountText || v.viewCountText), ago: txt(v.publishedTimeText) }); }
      for (const k in o) if (k !== 'videoRenderer') walk(o[k], d + 1);
    })(j, 0);
    log('youtube search: "' + q + '" -> ' + out.length);
    return { ok: true, items: out };
  } catch (e) { log('youtube search: ' + e.message); return { ok: false, error: e.message }; }
});
ipcMain.handle('spweb:open', () => spShow());
ipcMain.handle('sp:state', () => { try { if (spView && spView.webContents && !spView.webContents.isDestroyed()) return { open: true, shown: !!spShown, title: spView.webContents.getTitle() || '' }; } catch {} return { open: false, title: '' }; });
ipcMain.handle('sp:native', () => fs.existsSync(path.join(app.getPath('userData'), 'spotify-native.txt')));   // an empty file with this name brings the console's own Spotify screen back
ipcMain.handle('spweb:hide', () => { spHide(); return true; });
ipcMain.handle('discord:open', () => dcShow());
ipcMain.handle('discord:hide', () => { dcHide(); return true; });
ipcMain.handle('discord:key', (_e, k) => (k === 'm' || k === 'd') ? dcKey(k) : false);
ipcMain.handle('discord:state', () => ({ shown: dcShown, loaded: !!(dcView && !dcView.webContents.isDestroyed()) }));
ipcMain.handle('mouse:set', (_e, on) => setMouse(!!on, true));
// ---- web browser widget: opens Google Chrome (or the default browser) and switches the controller to mouse mode ----
function findChrome() {
  const e = process.env, c = [];
  for (const b of [e.ProgramFiles, e['ProgramFiles(x86)'], e.LOCALAPPDATA]) if (b) c.push(path.join(b, 'Google', 'Chrome', 'Application', 'chrome.exe'));
  return c.find((p) => { try { return fs.statSync(p).isFile(); } catch { return false; } }) || null;
}
function gameToHome(hw) {   // a game that came up on the other monitor is moved onto the console's monitor
  try {
    const { screen } = require('electron'), d = homeDisplay(); if (!d || !hw || !helper) return;
    const r = screen.dipToScreenRect ? screen.dipToScreenRect(null, d.bounds) : d.bounds;
    sendHelper('movehome ' + hw + ' ' + Math.round(r.x) + ' ' + Math.round(r.y) + ' ' + Math.round(r.width) + ' ' + Math.round(r.height));
    if (Date.now() - (gameToHome.kh || 0) > 40000) { gameToHome.kh = Date.now(); sendHelper('keephome ' + hw + ' ' + Math.round(r.x) + ' ' + Math.round(r.y) + ' ' + Math.round(r.width) + ' ' + Math.round(r.height) + ' 90'); }
  } catch (e) { log('movehome: ' + e.message); }
}
function pointerHome() { try { const { screen } = require('electron'), d = homeDisplay(); if (!d || !helper) return; const r = screen.dipToScreenRect ? screen.dipToScreenRect(null, d.bounds) : d.bounds; sendHelper('cursor ' + Math.round(r.x + r.width / 2) + ' ' + Math.round(r.y + r.height / 2)); } catch {} }
function placeOnHomeScreen() {   // after Chrome or an app opens, make sure it is on the same monitor as the console
  try {
    const { screen } = require('electron'), d = homeDisplay(); if (!d || !win || !helper) return;
    const r = screen.dipToScreenRect ? screen.dipToScreenRect(null, d.bounds) : d.bounds;
    sendHelper('place ' + Math.round(r.x) + ' ' + Math.round(r.y) + ' ' + Math.round(r.width) + ' ' + Math.round(r.height) + ' ' + consoleHwnd());
    sendHelper('cursor ' + Math.round(r.x + r.width / 2) + ' ' + Math.round(r.y + r.height / 2));   // the pointer belongs on this monitor too, not on the second one
  } catch (e) { log('place: ' + e.message); }
}
function sideArgs() {
  try {
    const { screen } = require('electron'), home = homeDisplay(); if (!home || !win) return '';
    const other = screen.getAllDisplays().find((d) => d.id !== home.id); if (!other) return '';
    const cv = (b) => { const r = screen.dipToScreenRect ? screen.dipToScreenRect(null, b) : b; return [r.x, r.y, r.width, r.height].map(Math.round); };
    return cv(other.bounds).join(' ') + ' ' + cv(home.bounds).join(' ') + ' ' + consoleHwnd();
  } catch { return ''; }
}
let openWithUntil = 0;   // Windows' "Select an app to open this 'ms-gamingoverlay' link" box is closed the moment it appears while a game starts or runs (the Game Bar is not used here)
setInterval(() => { try { if (process.platform === 'win32' && Date.now() < openWithUntil) execFile('taskkill', ['/F', '/IM', 'OpenWith.exe'], { windowsHide: true, timeout: 4000 }, () => {}); } catch {} }, 1500);
function hideLaunchers(secs) {   // while a game starts, windows a launcher opens stay on the console's monitor, underneath the console (nothing shows on the other monitor)
  try {
    const { screen } = require('electron'), home = homeDisplay(); if (!home || !win || !helper) return;
    const other = screen.getAllDisplays().find((d) => d.id !== home.id); if (!other) return;
    const cv = (b) => { const r = screen.dipToScreenRect ? screen.dipToScreenRect(null, b) : b; return [r.x, r.y, r.width, r.height].map(Math.round); };
    sendHelper('hidelaunch ' + cv(other.bounds).join(' ') + ' ' + cv(home.bounds).join(' ') + ' ' + consoleHwnd() + ' ' + secs); log('hidelaunch: watching for ' + secs + ' s, other monitor ' + cv(other.bounds).join(',') + ', console monitor ' + cv(home.bounds).join(','));
  } catch (e) { log('hidelaunch: ' + e.message); }
}
function sideLaunchers(secs) {   // anything a launcher opens on the console's monitor is moved to the other monitor so it can be seen
  try {
    const { screen } = require('electron'), home = homeDisplay(); if (!home || !win || !helper) return;
    const other = screen.getAllDisplays().find((d) => d.id !== home.id); if (!other) return;
    const cv = (b) => { const r = screen.dipToScreenRect ? screen.dipToScreenRect(null, b) : b; return [r.x, r.y, r.width, r.height].map(Math.round); };
    sendHelper('side ' + cv(other.bounds).join(' ') + ' ' + cv(home.bounds).join(' ') + ' ' + consoleHwnd() + ' ' + secs);
  } catch (e) { log('side: ' + e.message); }
}
function homeDisplay() { try { const { screen } = require('electron'); return screen.getDisplayMatching(win && !win.isMinimized() ? win.getBounds() : screen.getPrimaryDisplay().bounds); } catch { return null; } }
let appFade = false;
async function appHandoff() {
  if (!appFade || !win) return; appFade = false;
  try {
    for (let o = 1; o > 0; o -= 0.06) { win.setOpacity(Math.max(o, 0)); await sleep(26); }
    clearInterval(topT); topT = null; setPin('0');
    win.setAlwaysOnTop(false); sendHelper('back ' + consoleHwnd());
    await sleep(120); win.setOpacity(1);
  } catch {}
}
async function openWeb(url) {
  try {
    if (!/^https?:\/\//i.test(url || '')) url = 'https://www.google.com';
    const exe = findChrome(), d = homeDisplay();
    if (exe) {   // open on the same screen the console is on, filling it, so no other monitor or the desktop shows
      const args = ['--new-window'];
      if (d) { const b = d.bounds; args.push('--window-position=' + b.x + ',' + b.y, '--window-size=' + b.width + ',' + b.height); }
      args.push(url);
      const ch = spawn(exe, args, { detached: true, stdio: 'ignore' }); ch.on('error', (er) => log('chrome: ' + er.message)); ch.unref();
    } else await shell.openExternal(url);
    appFade = !!exe; if (appFade) { holdTop(10000); setTimeout(() => { if (appFade) appHandoff(); }, 9000); }   // the console stays on top while the browser opens underneath it, then fades away to reveal it
    placeOnHomeScreen();
    setMouse(true, true, 3000);   // the console stays behind the browser for a moment, so the desktop never shows
    return { ok: true, chrome: !!exe };
  } catch (e) { return { ok: false, error: e.message }; }
}
// ---- news: Steam news for your games + gaming headlines (fetched on your PC, cached for 20 minutes) ----
const NEWS_IMG = /^news-[a-f0-9]{12}\.jpg$/;
const POSTER_RE = /^(poster-\d{1,12}x?|hero-\d{1,12}|bg-\d{1,12}|cover-[a-f0-9]{12})\.jpg$/;
let trailCache = { t: 0, items: [] }, trailNote = '';
const STEAM_VID = /^https:\/\/[a-z0-9.-]*(steamstatic\.com|akamaihd\.net|steamcontent\.com)\/.+\.(mp4|webm)(\?.*)?$/i;
const STEAM_HLS = /^https:\/\/[a-z0-9.-]*(steamstatic\.com|akamaihd\.net|steamcontent\.com)\/.+\.m3u8(\?.*)?$/i;
const https = (u) => String(u || '').replace(/^http:\/\//i, 'https://');
const vidUrl = (mv) => https((mv.mp4 && (mv.mp4['480'] || mv.mp4.max)) || (mv.webm && (mv.webm['480'] || mv.webm.max)) || '');
const vidSrc = (mv) => { const mp4 = mv ? vidUrl(mv) : '', hls = mv ? https(mv.hls_h264 || '') : ''; return { mp4: STEAM_VID.test(mp4) ? mp4 : '', hls: STEAM_HLS.test(hls) ? hls : '' }; };
const vidThumb = async (mv, id) => (await newsImg(https(mv && mv.thumbnail || ''))) || (await newsImg('https://cdn.cloudflare.steamstatic.com/steam/apps/' + id + '/header.jpg'));
let newsCache = { t: 0, items: [] };
async function newsImg(url, wd = 560) {
  try {
    if (!/^https:\/\//i.test(url || '')) return '';
    const name = 'news-' + crypto.createHash('sha1').update(url + (wd === 560 ? '' : '#' + wd)).digest('hex').slice(0, 12) + '.jpg', f = path.join(themeDir(), name);
    if (fs.existsSync(f)) return name;
    const r = await fetch(url, { signal: AbortSignal.timeout(9000) }); if (!r.ok) return '';
    const img = nativeImage.createFromBuffer(Buffer.from(await r.arrayBuffer())); if (img.isEmpty()) return '';
    fs.writeFileSync(f, (img.getSize().width > wd ? img.resize({ width: wd, quality: 'good' }) : img).toJPEG(wd > 560 ? 92 : 82)); return name;
  } catch { return ''; }
}
const xmlTag = (x, t) => { const mm = x.match(new RegExp('<' + t + '[^>]*>([\\s\\S]*?)</' + t + '>', 'i')); return mm ? mm[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''; };
const unHtml = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&#8217;|&rsquo;/g, "'").replace(/&#8211;|&ndash;/g, '-').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
async function rssNews(url, src, n) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { 'user-agent': 'Mozilla/5.0 MyConsole' } }); if (!r.ok) return [];
    const x = await r.text(), out = [];
    for (const it of (x.match(/<item[\s>][\s\S]*?<\/item>/gi) || []).slice(0, n)) {
      const title = unHtml(xmlTag(it, 'title')), link = unHtml(xmlTag(it, 'link')) || (it.match(/<link[^>]*href="([^"]+)"/i) || [])[1];
      const img = (it.match(/<media:(?:thumbnail|content)[^>]*url="([^"]+)"/i) || it.match(/<enclosure[^>]*url="([^"]+)"/i) || it.match(/<img[^>]*src="([^"]+)"/i) || [])[1] || '';
      const ts = Date.parse(xmlTag(it, 'pubDate') || xmlTag(it, 'dc:date')) || Date.now();
      const sum = unHtml(xmlTag(it, 'description') || xmlTag(it, 'summary') || xmlTag(it, 'content:encoded')).slice(0, 420);
      if (title && /^https?:\/\//i.test(link || '')) out.push({ title, url: link, src, img, ts, sum });
    }
    return out;
  } catch (e) { log('rss ' + src + ': ' + e.message); return []; }
}
async function steamNews(g) {
  try {
    const r = await fetch('https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + g.steamId + '&count=2&maxlength=500&format=json', { signal: AbortSignal.timeout(12000) }); if (!r.ok) return [];
    const j = await r.json();
    return ((j.appnews && j.appnews.newsitems) || []).map((n) => ({ title: unHtml(n.title), url: n.url, src: g.title, img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + g.steamId + '/header.jpg', ts: (n.date || 0) * 1000, sum: unHtml(String(n.contents || '').replace(/\[[^\]]*\]/g, ' ').replace(/https?:\/\/\S+/g, ' ')).slice(0, 420) })).filter((n) => n.title && /^https?:\/\//i.test(n.url || ''));
  } catch { return []; }
}
const POPULAR = /\b(deadlock|marvel rivals|arc raiders|battlefield 6|delta force|the finals|rematch|hytale|clair obscur|expedition 33|split fiction|monster hunter wilds|borderlands 4|mario kart|ghost of y[oō]tei|death stranding 2|gta|grand theft auto|call of duty|warzone|black ops|modern warfare|fortnite|minecraft|roblox|zelda|mario|pok[eé]mon|nintendo switch 2|switch 2|elden ring|dark souls|fromsoftware|final fantasy|fallout|elder scrolls|skyrim|oblivion|starfield|bethesda|cyberpunk|witcher|baldur'?s gate|larian|hades|hollow knight|silksong|marvel|spider-?man|batman|battlefield|apex legends|valorant|league of legends|overwatch|blizzard|diablo|world of warcraft|destiny|halo|forza|xbox|playstation|ps5|ps6|sony|steam deck|valve|half-life|counter-strike|cs2|dota|rocket league|palworld|stardew|assassin'?s creed|far cry|ubisoft|resident evil|silent hill|capcom|monster hunter|street fighter|tekken|mortal kombat|god of war|last of us|horizon|ghost of|death stranding|metal gear|kojima|persona|atlus|dragon quest|kingdom hearts|square enix|sea of thieves|star wars|red dead|rockstar|ea sports|fc 2\d|madden|nba 2k|fifa|the sims|apex|rainbow six|helldivers|lethal company|peak|ark:|rust|pubg|genshin|honkai|zenless|wuthering|lol|warframe|path of exile|borderlands|bioshock|mass effect|dragon age|dying light|lies of p|black myth|wukong|doom|quake|wolfenstein|indiana jones|gears of war|fable|hogwarts|stranger than heaven|yakuza|like a dragon|sonic|crash bandicoot|tomb raider|hitman|nier|bayonetta|metroid|smash bros|animal crossing|splatoon|kirby|donkey kong|gta 6|gta vi)\b/i;
const latinOnly = (s) => { s = String(s || ''); const bad = (s.match(/[^\x00-\x7F -ɏ‐-‟…™®]/g) || []).length; return s.length > 0 && bad / s.length < 0.04; };
ipcMain.handle('news:get', async (_e, force) => {
  if (!force && Date.now() - newsCache.t < 8 * 60 * 1000 && newsCache.items.length) return newsCache;
  try {
    const lists = await Promise.all([
      rssNews('https://www.pcgamer.com/rss/', 'PC Gamer', 25),
      rssNews('https://feeds.feedburner.com/ign/games-all', 'IGN', 25),
      rssNews('https://www.eurogamer.net/feed', 'Eurogamer', 25),
      rssNews('https://www.gamespot.com/feeds/game-news/', 'GameSpot', 25),
    ]);
    const chart = await chartTop();
    const extra = new Set(popNames); chart.forEach((x) => extra.add(normName(x.name)));
    const isPop = (x) => POPULAR.test(x.title) || [...extra].some((n) => n.length > 4 && normName(x.title).includes(n));
    let all = [].concat(...lists).filter((x) => x && x.title && latinOnly(x.title) && latinOnly(x.sum));
    const seen = new Set(); all = all.filter((x) => { const k = normName(x.title).slice(0, 40); if (seen.has(k)) return false; seen.add(k); return true; });
    all.sort((a, b) => b.ts - a.ts);
    const pop = all.filter(isPop);
    // official news from the games being played most right now (patches, seasons, events), newest first
    let off = [];
    try { off = [].concat(...await Promise.all(chart.slice(0, 14).map((g) => steamNews({ steamId: g.id, title: g.name })))).filter((x) => x.title && latinOnly(x.title) && Date.now() - x.ts < 21 * 86400000 && x.ts <= Date.now() + 3600000); } catch {}
    off.sort((a, b) => b.ts - a.ts);
    const pick = [], per = {};
    const offPick = []; for (const x of off) { if (offPick.filter((o) => o.src === x.src).length < 1 && offPick.length < 4) offPick.push(x); }
    for (const x of pop) { per[x.src] = (per[x.src] || 0) + 1; if (per[x.src] <= 3 && pick.length < 6) pick.push(x); }
    pick.push(...offPick);
    for (const x of off) { if (pick.length >= 10) break; if (!pick.includes(x)) pick.push(x); }
    for (const x of pop) { if (pick.length >= 10) break; if (!pick.includes(x)) pick.push(x); }
    pick.sort((a, b) => b.ts - a.ts);
    await Promise.all(pick.map(async (x) => { x.img = x.img ? await newsImg(https(x.img)) : ''; }));
    log('news: ' + pick.length + ' stories (' + pop.length + ' press, ' + off.length + ' official, ' + all.length + ' checked)');
    if (pick.length) newsCache = { t: Date.now(), items: pick };
    return { t: newsCache.t, items: newsCache.items };
  } catch (e) { log('news: ' + e.message); return { t: 0, items: newsCache.items }; }
});
ipcMain.handle('trailers:get', async () => {
  if (Date.now() - trailCache.t < 6 * 3600 * 1000 && trailCache.items.length) return { ...trailCache, note: '' };
  try {
    const cand = [], ids = new Set();
    const add = (id, tag) => { id = String(id); if (id && !ids.has(id)) { ids.add(id); cand.push({ steamId: id, tag }); } };
    try { const fr = await fetch('https://store.steampowered.com/api/featuredcategories?cc=us&l=en', { signal: AbortSignal.timeout(12000) }); const fj = await fr.json(); for (const [cat, tag] of [['top_sellers', 'Trending'], ['new_releases', 'New'], ['coming_soon', 'Coming soon']]) ((fj[cat] && fj[cat].items) || []).filter((x) => x && x.id && x.type !== 1).slice(0, 14).forEach((x) => add(x.id, tag)); } catch (e) { log('trailers featured: ' + e.message); }
    try { const mr = await fetch('https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/', { signal: AbortSignal.timeout(12000) }); const mj = await mr.json(); ((mj.response && mj.response.ranks) || []).slice(0, 30).forEach((x) => add(x.appid, 'Popular')); } catch (e) { log('trailers charts: ' + e.message); }
    const picked = [], fmts = new Set(), seenN = new Set(); let idx = 0, rejected = 0;
    const work = async () => {
      while (idx < cand.length && picked.length < 30) {
        const c = cand[idx++];
        try {
          const r = await fetch('https://store.steampowered.com/api/appdetails?appids=' + c.steamId + '&cc=us&l=english', { signal: AbortSignal.timeout(14000) }); if (!r.ok) continue;
          const j = await r.json(), d = j && j[c.steamId] && j[c.steamId].data; if (!d || d.type !== 'game' || HW_NAME.test(d.name || '')) continue;
          const reviews = (d.recommendations && d.recommendations.total) || 0;
          if (c.tag === 'Popular' || reviews >= 40000) popNames.add(normName(d.name));
          if (reviews < 40000 && c.tag !== 'Popular') { rejected++; continue; }   // only well-known games: lots of players have reviewed them
          const mv = d.movies && d.movies[0]; if (!mv) continue;
          const vs = vidSrc(mv); if (!vs.mp4 && !vs.hls) { fmts.add(Object.keys(mv).filter((k) => /mp4|webm|hls|dash/.test(k)).join('+') || 'none'); continue; }
          const k = normName(d.name); if (seenN.has(k)) continue; seenN.add(k);
          picked.push({ steamId: c.steamId, title: d.name, tag: c.tag, mp4: vs.mp4, hls: vs.hls, desc: unHtml(d.short_description || '').slice(0, 480), genres: (d.genres || []).map((g) => g.description).slice(0, 3), date: (d.release_date && d.release_date.date) || '', dev: (d.developers || []).slice(0, 1).join(''), reviews, _mv: mv });
        } catch {}
      }
    };
    await Promise.all([work(), work(), work(), work(), work()]);
    // the biggest games first
    picked.sort((a, b) => b.reviews - a.reviews);
    const items = picked.slice(0, 10);
    await Promise.all(items.map(async (it) => { it.thumb = await vidThumb(it._mv, it.steamId); delete it._mv; }));
    log('trailers: ' + items.length + ' well-known games with video from ' + idx + ' checked (' + rejected + ' skipped as too obscure); other formats: ' + [...fmts].join(' | '));
    trailNote = items.length ? '' : 'No playable trailers found (' + ([...fmts].join(', ') || 'no video data') + ')';
    if (items.length) trailCache = { t: Date.now(), items };
    return { t: trailCache.t, items: trailCache.items, note: trailNote };
  } catch (e) { log('trailers: ' + e.message); return { t: 0, items: trailCache.items, note: 'Could not reach Steam (' + e.message + ')' }; }
});
// ---- Store: Steam top sellers, new releases and sales, in-app search, and a bridge to the Microsoft Store ----
let storeCache = { t: 0, data: null };
const trailExtra = new Map();
const posterMiss = new Set();
ipcMain.handle('posters:get', async (_e, ids) => {   // tall Steam box art (600x900) for the library: sharper than the wide pictures
  const out = {}; const list = (Array.isArray(ids) ? ids : []).map(String).filter((x) => /^\d{1,12}$/.test(x)).slice(0, 60); let i = 0;
  const upgradeLogo = async (id) => {   // some logo files are tiny and look blurry when enlarged: once per game, look for a bigger version (Steam's 2x logo) and keep the widest
    const mk = path.join(themeDir(), 'wq-' + id + '.txt'); if (fs.existsSync(mk)) return;
    try {
      const lf = path.join(themeDir(), 'wl-' + id + '.png');
      const r = await fetch('https://api.steampowered.com/IStoreBrowseService/GetItems/v1?input_json=' + encodeURIComponent(JSON.stringify({ ids: [{ appid: Number(id) }], context: { language: 'english', country_code: 'US' }, data_request: { include_assets: true } })), { signal: AbortSignal.timeout(15000) });
      if (!r.ok) return;
      const it = ((await r.json()).response || {}).store_items, a = it && it[0] && it[0].assets, base = 'https://shared.steamstatic.com/store_item_assets/', cdn = 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + id + '/';
      const urls = [];
      if (a && a.asset_url_format) { const fm = (n) => base + (a.asset_url_format || '').replace('${FILENAME}', n); if (a.library_logo_2x) urls.push(fm(a.library_logo_2x)); if (a.library_logo) urls.push(fm(a.library_logo)); }
      urls.push(cdn + 'logo_2x.png', cdn + 'logo.png');
      let best = null, bw = fs.existsSync(lf) ? (nativeImage.createFromPath(lf).getSize().width || 0) : 0;
      for (const u of urls) { const b = await img(u, true); if (!b) continue; const w = nativeImage.createFromBuffer(b).getSize().width; if (w > bw) { best = b; bw = w; } }
      if (best) { fs.writeFileSync(lf, best); try { fs.unlinkSync(path.join(themeDir(), 'wt-' + id + '.png')); } catch {} }
      fs.writeFileSync(mk, String(bw));
    } catch {}
  };
  const work = async () => { while (i < list.length) { const id = list[i++]; await upgradeLogo(id); const name = 'poster-' + id + 'x.jpg', f = path.join(themeDir(), name);
    try {
      if (fs.existsSync(f)) { out[id] = name; continue; } if (posterMiss.has(id)) continue;
      let r = await fetch('https://cdn.cloudflare.steamstatic.com/steam/apps/' + id + '/library_600x900_2x.jpg', { signal: AbortSignal.timeout(12000) }).catch(() => null);   // the sharp 1200x1800 art first
      if (!r || !r.ok) r = await fetch('https://cdn.cloudflare.steamstatic.com/steam/apps/' + id + '/library_600x900.jpg', { signal: AbortSignal.timeout(12000) });
      if (!r.ok) { for (const u of await steamPortraitUrls(id)) { r = await fetch(u, { signal: AbortSignal.timeout(15000) }).catch(() => null); if (r && r.ok) break; } }
      if (!r || !r.ok) { posterMiss.add(id); continue; }
      const b = Buffer.from(await r.arrayBuffer()); if (b.length < 2000 || b[0] !== 0xff || b[1] !== 0xd8) { posterMiss.add(id); continue; }
      fs.writeFileSync(f, b); out[id] = name;
    } catch {} } };
  await Promise.all([work(), work(), work(), work(), work()]);
  return out;
});

const heroMiss = new Set();
function makeTrimmedLogo(id, ln) {   // the real lettering only: Steam's logo files have lots of empty space around it (and one says "Overwatch 2"), so each is cut down to size once and saved as wt-<id>.png
  const tn = 'wt-' + id + '.png', tf = path.join(themeDir(), tn);
  try {
    const mk = path.join(themeDir(), 'wv-' + id + '.txt');
    if (fs.existsSync(tf) && fs.existsSync(mk) && fs.readFileSync(mk, 'utf8') === '2') return tn;
    const im = nativeImage.createFromBuffer(fs.readFileSync(path.join(themeDir(), ln))); if (im.isEmpty()) return ln;
    const { width: w, height: h } = im.getSize(), d = im.toBitmap(); if (!w || !h || d.length < w * h * 4) return ln;
    let lim = w;
    if (id === '2357570') {   // Overwatch: drop the orange "2" at the right
      let minX = -1;
      for (let cx = w - 1; cx > w * 0.7; cx--) { let hit = false; for (let cy = 0; cy < h && !hit; cy += 2) { const k = (cy * w + cx) * 4; if (d[k + 3] > 200 && d[k + 2] > 200 && d[k + 1] < 170 && d[k] < 90) hit = true; } if (hit) minX = cx; }
      lim = minX > 0 ? Math.max(Math.round(w * 0.6), Math.round(minX - Math.max(2, w * 0.004))) : Math.round(w * 0.88);
    }
    let x0 = lim, x1 = -1, y0 = h, y1 = -1;
    for (let cy = 0; cy < h; cy++) for (let cx = 0; cx < lim; cx++) if (d[(cy * w + cx) * 4 + 3] > 24) { if (cx < x0) x0 = cx; if (cx > x1) x1 = cx; if (cy < y0) y0 = cy; if (cy > y1) y1 = cy; }
    if (x1 < 0) return ln;
    const r = { x: Math.max(0, x0 - 2), y: Math.max(0, y0 - 2) }; r.width = Math.min(lim, x1 + 3) - r.x; r.height = Math.min(h, y1 + 3) - r.y;
    let out = im.crop(r); const cs = out.getSize();
    if (cs.width < 1000) {   // a small file: enlarge it smoothly, then sharpen the edges so it does not look soft
      const nw = 1000, nh = Math.max(1, Math.round(cs.height * nw / cs.width)); out = out.resize({ width: nw, height: nh, quality: 'best' });
      const sz = out.getSize(), b = Buffer.from(out.toBitmap()), src = Buffer.from(b), W = sz.width, H = sz.height, A = 1.1;
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const k = (y * W + x) * 4; if (src[k + 3] < 8) continue;
        for (let c = 0; c < 3; c++) { const v = src[k + c] * (1 + 4 * A) - A * (src[k - 4 + c] + src[k + 4 + c] + src[k - W * 4 + c] + src[k + W * 4 + c]); b[k + c] = v < 0 ? 0 : v > 255 ? 255 : v; } }
      out = nativeImage.createFromBitmap(b, { width: W, height: H });
    }
    fs.writeFileSync(tf, out.toPNG()); fs.writeFileSync(mk, '2'); return tn;
  } catch { return ln; }
}
function makeSquare(id, hn, ln) {   // an Xbox-style SQUARE cover: the game's wide art cut to a square and dimmed, with its real logo sitting on it (saved once as ws-<id>.jpg)
  const sn = 'ws-' + id + '.jpg', sf = path.join(themeDir(), sn), mk = path.join(themeDir(), 'wu-' + id + '.txt');
  try {
    if (fs.existsSync(sf) && fs.existsSync(mk)) return sn;
    const hi = nativeImage.createFromBuffer(fs.readFileSync(path.join(themeDir(), hn))), li = nativeImage.createFromBuffer(fs.readFileSync(path.join(themeDir(), ln)));
    if (hi.isEmpty() || li.isEmpty()) return null;
    const hs = hi.getSize(), side = Math.min(hs.width, hs.height), S = 512;
    let sq = hi.crop({ x: Math.round((hs.width - side) * 0.62), y: Math.round((hs.height - side) / 2), width: side, height: side }).resize({ width: S, height: S, quality: 'best' });
    const b = Buffer.from(sq.toBitmap());
    for (let y = 0; y < S; y++) { const g = 0.62 - 0.22 * (y / S); for (let x = 0; x < S; x++) { const k = (y * S + x) * 4; b[k] *= g; b[k + 1] *= g; b[k + 2] *= g; } }   // dim it, a little more toward the bottom, so the logo stands out
    const ls = li.getSize(), mw = Math.round(S * 0.8), mh = Math.round(S * 0.42), sc = Math.min(mw / ls.width, mh / ls.height), lw = Math.max(1, Math.round(ls.width * sc)), lh = Math.max(1, Math.round(ls.height * sc));
    const lg = li.resize({ width: lw, height: lh, quality: 'best' }), lb = lg.toBitmap(), ox = Math.round((S - lw) / 2), oy = Math.round(S * 0.5 - lh / 2);
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) { const q = (y * lw + x) * 4, a = lb[q + 3] / 255; if (!a) continue; const k = ((oy + y) * S + ox + x) * 4; if (k < 0 || k + 3 >= b.length) continue; for (let c = 0; c < 3; c++) b[k + c] = lb[q + c] * a + b[k + c] * (1 - a); b[k + 3] = 255; }
    fs.writeFileSync(sf, nativeImage.createFromBitmap(b, { width: S, height: S }).toJPEG(92)); fs.writeFileSync(mk, '1'); return sn;
  } catch { return null; }
}
let XB_MAP = null;
const xbNorm = (s) => String(s || '').toLowerCase().replace(/[®™©]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
ipcMain.handle('covers:xbox', async (_e, items) => {   // the real Xbox / Microsoft Store square cover (BoxArt, 1:1) for each game, found by searching the Store by title; results are remembered on disk
  const out = {}; const list = (Array.isArray(items) ? items : []).slice(0, 40);
  const mapF = path.join(themeDir(), 'xbmap5.json'); if (!XB_MAP) { try { XB_MAP = JSON.parse(fs.readFileSync(mapF, 'utf8')) || {}; } catch { XB_MAP = {}; } } const map = XB_MAP;
  const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', Accept: 'application/json' };
  const jget = async (u) => { const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error('http ' + r.status); return r.json(); };
  let dirty = false;
  for (const it of list) {
    try {
      if (!it || typeof it.id !== 'string' || typeof it.title !== 'string' || !it.title.trim()) continue;
      const key0 = xbNorm(it.title); if (!key0) continue; const key = ({ overwatch2: 'overwatch' })[key0] || key0;
      const known = map[key];
      if (known && known.f && /^ws-\d{1,12}\.jpg$/.test(known.f) && fs.existsSync(path.join(themeDir(), known.f)) && !(key === 'fortnite' && !map.fnv3)) { out[it.id] = known.f; continue; }   // Fortnite's square is fetched once more (its Xbox art changed)
      if (known && !known.f && Date.now() - (known.t || 0) < 7 * 86400000) continue;   // not on Xbox: do not ask again for a week
      let pid = '', icon = '', rawT = '';
      const extraOk = (s) => { let t = s; for (const w of ['standardedition', 'deluxeedition', 'ultimateedition', 'premiumedition', 'definitiveedition', 'completeedition', 'goldedition', 'gameoftheyearedition', 'gameoftheyear', 'goty', 'remastered', 'enhanced', 'edition', 'digital', 'forxboxseriesxs', 'forxboxone', 'xboxseriesxs', 'xboxone', 'forwindows', 'windows', 'pc', 'thegame', 'game']) t = t.split(w).join(''); return t === ''; };
      const t0 = it.title.replace(/[®™]/g, '').trim();
      const queries = [...new Set([t0, t0.replace(/\s+/g, '_'), t0.replace(/\s+\d+$/, '').trim(), t0.split(/[:–-]/)[0].trim(), t0.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).slice(0, 2).join(' ')].filter((s) => s && s.length > 1))];   // the Store's search is picky (it knows "WATCH_DOGS" but not always "Watch Dogs 2"), so a few spellings are tried
      for (const plat of ['Windows.Xbox', 'Windows.Desktop']) {   // answer shape (checked live): { Results: [ { Products: [ { ProductId, Title, Type, Width, Height, ImageType, Icon } ] } ] }
        let best = null;
        for (const qq of queries) {
          const q = new URLSearchParams({ query: qq, platformdependencyname: plat, productFamilyNames: 'Games,Apps', topProducts: '8', languages: 'en-US', market: 'US' });
          let cand = []; try { const j = await jget('https://displaycatalog.mp.microsoft.com/v7.0/productFamilies/autosuggest?' + q.toString()); cand = ((j && j.Results) || []).flatMap((r) => r.Products || []).filter((p) => p && p.ProductId && (it.exact ? p.Type === 'Application' : p.Type === 'Game')).map((p) => ({ id: p.ProductId, raw: String(p.Title || ''), n: xbNorm(p.Title), icon: ((p.Width || 0) >= 600 && Math.abs((p.Width || 1) / (p.Height || 1) - 1) < 0.06) ? p.Icon : '' })).filter((c) => c.n); } catch (e) { log('xbox search failed for ' + it.title + ': ' + (e && e.message)); }
          best = cand.find((c) => c.n === key);
          if (!best) { const near = cand.filter((c) => it.exact ? c.n.startsWith(key) : ((c.n.startsWith(key) && extraOk(c.n.slice(key.length))) || (key.startsWith(c.n) && extraOk(key.slice(c.n.length))))).sort((a, b) => a.n.length - b.n.length); best = near[0]; }
          if (best) break;
        }
        if (best) { pid = best.id; icon = best.icon; rawT = best.raw; break; }
      }
      if (pid) {   // the game's own listing has the big square BoxArt even when the quick search only shows a small logo
        try {
          const d = await jget('https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=' + pid + '&market=US&languages=en-US&MS-CV=DGU1mcuYo0WMMp%2BF.1');
          const arr = ((((d.Products || [])[0] || {}).LocalizedProperties || [])[0] || {}).Images || [];
          const sq = (p, min) => arr.filter((x) => x.ImagePurpose === p && x.Uri && (x.Width || 0) >= min && Math.abs((x.Width || 1) / (x.Height || 1) - 1) < 0.06).sort((a, b) => b.Width - a.Width)[0];
          const pk = sq('BoxArt', 600) || (it.exact ? (sq('Tile', 150) || sq('Logo', 150)) : null) || sq('FeaturePromotionalSquareArt', 600);
          if (pk) icon = pk.Uri;
          if (key === 'fortnite') {   // the tall cover (the one on the loading screen) in the Store's own big size, so it is sharp
            try {
              const po = arr.filter((x) => x.ImagePurpose === 'Poster' && x.Uri && (x.Width || 0) >= 500 && Math.abs((x.Width || 1) / (x.Height || 1) - 2 / 3) < 0.05).sort((a, b) => b.Width - a.Width)[0];
              if (po) {
                let pu = String(po.Uri); if (pu.startsWith('//')) pu = 'https:' + pu;
                if (/^https:\/\/store-images\.s-microsoft\.com\//.test(pu)) {
                  const rr = await fetch(pu + (pu.includes('?') ? '&' : '?') + 'w=1000&h=1500&q=92', { headers: H, signal: AbortSignal.timeout(20000) });
                  if (rr.ok) { const pim = nativeImage.createFromBuffer(Buffer.from(await rr.arrayBuffer())); if (!pim.isEmpty() && pim.getSize().width >= 400) { const pn = 'cover-' + crypto.createHash('sha1').update(norm(it.title)).digest('hex').slice(0, 12) + '.jpg'; fs.writeFileSync(path.join(themeDir(), pn), pim.toJPEG(92)); fs.writeFileSync(path.join(themeDir(), pn + '.hq'), '1'); log('fortnite tall cover: Store poster ' + pim.getSize().width + 'x' + pim.getSize().height); } }
                }
              }
            } catch (e) { log('fortnite poster failed: ' + (e && e.message)); }
          }
        } catch (e) { log('xbox details failed for ' + it.title + ': ' + (e && e.message)); }
      }
      let file = null;
      if (pid && icon) {
        let u = String(icon); if (u.startsWith('//')) u = 'https:' + u;
        if (/^https:\/\/store-images\.s-microsoft\.com\//.test(u)) {
          let r = await fetch(u + (u.includes('?') ? '&' : '?') + 'w=640&h=640&q=90', { headers: H, signal: AbortSignal.timeout(20000) }); if (!r.ok) r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000) });
          if (r.ok) { const im = nativeImage.createFromBuffer(Buffer.from(await r.arrayBuffer())); if (!im.isEmpty()) { let hsh = 11; for (const ch of 'xb|' + key) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0; const sn = 'ws-' + hsh + '.jpg'; fs.writeFileSync(path.join(themeDir(), sn), im.resize({ width: 512, height: 512, quality: 'best' }).toJPEG(92)); file = sn; } }
        }
      }
      log('xbox cover for "' + it.title + '": ' + (file ? 'ok -> "' + rawT + '"' : pid ? 'matched "' + rawT + '" but the image would not load' : 'no good match on Xbox'));
      if (!file && known && known.f) file = known.f; if (key === 'fortnite') map.fnv3 = 1;
      map[key] = { f: file, t: Date.now() }; dirty = true; if (file) out[it.id] = file;
    } catch {}
  }
  if (dirty) { try { fs.writeFileSync(mapF, JSON.stringify(map)); } catch {} }
  return out;
});
let XH_MAP = null;

// ---- a picture of each web app's own home page, used as the background while you point at it ----
let appShotBusy = Promise.resolve();
ipcMain.handle('appshot:get', (_e, id) => {
  const job = appShotBusy.then(async () => {
    const a = (loadSettings().webApps || []).find((x) => x.id === id);
    if (!a || a.kind !== 'web' || !/^https?:\/\//i.test(a.url || '')) return '';
    const name = 'as-' + require('crypto').createHash('sha1').update(a.url).digest('hex').slice(0, 12) + '.jpg', file = path.join(themeDir(), name);
    try { const st = fs.statSync(file); if (Date.now() - st.mtimeMs < 7 * 86400000) return name; } catch {}
    let w = null;
    try {
      w = new BrowserWindow({ show: false, width: 1600, height: 900, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, partition: 'appshot', backgroundThrottling: false } });
      w.webContents.setAudioMuted(true); w.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      await Promise.race([w.loadURL(a.url), new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 20000))]);
      await new Promise((r) => setTimeout(r, 3500));
      const img = await w.webContents.capturePage();
      if (img.isEmpty()) return '';
      fs.writeFileSync(file, img.toJPEG(82)); log('app picture saved for ' + a.name);
      return name;
    } catch (e) { log('app picture ' + a.name + ': ' + e.message); try { return fs.existsSync(file) ? name : ''; } catch { return ''; } }
    finally { try { w && !w.isDestroyed() && w.destroy(); } catch {} }
  }).catch(() => '');
  appShotBusy = job;
  return job;
});

// ---- the real logo of a web app: the main logo picture of its Wikipedia article (transparent), saved once ----
const WIKI_TITLES = { youtube: 'YouTube', netflix: 'Netflix', spotify: 'Spotify', twitch: 'Twitch (service)', google: 'Google', disney: 'Disney+', hulu: 'Hulu', primevideo: 'Prime Video', amazon: 'Amazon (company)', discord: 'Discord', reddit: 'Reddit', twitter: 'Twitter', x: 'X (social network)', facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', github: 'GitHub', steam: 'Steam (service)' };
ipcMain.handle('applogo:get', async (_e, id) => {
  const a = (loadSettings().webApps || []).find((x) => x.id === id); if (!a || a.kind !== 'web') return '';
  let host = ''; try { host = new URL(a.url).hostname.replace(/^(www|open|m|app|play|music)\./, '').split('.')[0]; } catch {}
  const slug = (host || String(a.name).toLowerCase().replace(/[^a-z0-9]/g, '')).replace(/[^a-z0-9]/g, '').slice(0, 30); if (!slug) return '';
  const name = 'al-' + slug + '.png', file = path.join(themeDir(), name);
  try { if (fs.statSync(file).size > 800) return name; } catch {}
  const titles = [WIKI_TITLES[slug], a.name, host && host.charAt(0).toUpperCase() + host.slice(1)].filter(Boolean);
  for (const t of [...new Set(titles)]) {
    try {
      const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(t.replace(/ /g, '_')), { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'my-console/1.0' } }); if (!r.ok) continue;
      const j = await r.json(); if (j.type === 'disambiguation') continue;
      const th = j.thumbnail && j.thumbnail.source; if (!th || !/^https:\/\/upload\.wikimedia\.org\//.test(th)) continue;
      const big = th.replace(/\/(\d+)px-/, '/1000px-');
      const ir = await fetch(big, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'my-console/1.0' } }); if (!ir.ok) continue;
      const b = Buffer.from(await ir.arrayBuffer()); if (b.length < 800 || b[0] !== 0x89 || b[1] !== 0x50) continue;   // a transparent PNG only
      fs.writeFileSync(file, b); log('app logo saved for ' + a.name + ' (' + t + ')'); return name;
    } catch (e) { log('app logo ' + a.name + ': ' + e.message); }
  }
  return '';
});
const steamIdCache = new Map();
ipcMain.handle('steam:appid', async (_e, title) => {   // the Steam page of a game that is not installed through Steam, found by its name (used for its logo)
  const t = String(title || '').slice(0, 120); if (!t) return '';
  if (steamIdCache.has(t)) return steamIdCache.get(t);
  const id = await steamAppFor({ title: t }); steamIdCache.set(t, id || ''); return id || '';
});

// ---- Epic Games: the store's own transparent logo ("ProductLogo") for a game, found by its title ----
const epicLogoCache = new Map();
ipcMain.handle('logo:epic', async (_e, arg) => {
  const title = arg && typeof arg === 'object' ? arg.title : arg, uri = arg && typeof arg === 'object' ? String(arg.uri || '') : '';
  const t = String(title || '').slice(0, 120); if (!t) return '';
  if (epicLogoCache.has(t)) return epicLogoCache.get(t);
  const num = String(parseInt(require('crypto').createHash('sha1').update('epic:' + norm(coverTitle(t))).digest('hex').slice(0, 8), 16));   // a number stands in for the game id so the logo uses the same file naming as Steam's
  const id = '9' + num, ln = 'wl-' + id + '.png', lf = path.join(themeDir(), ln);
  try { if (fs.existsSync(lf)) { const r = makeTrimmedLogo(id, ln); epicLogoCache.set(t, r); return r; } } catch {}
  let out = '';
  const saveImg = async (u) => { const ir = await fetch(u, { signal: AbortSignal.timeout(20000) }), b = Buffer.from(await ir.arrayBuffer()); if (ir.ok && b.length > 800 && b[0] === 0x89 && b[1] === 0x50) { fs.writeFileSync(lf, b); return makeTrimmedLogo(id, ln); } return ''; };
  try {   // the launcher's own catalog entry (namespace and item are in the game's launch link): its "DieselGameBoxLogo" is the logo the Epic launcher shows on the game's page
    const mm = /apps\/([0-9a-f]{32})(?:%3A|:)([0-9a-f]{32})/i.exec(uri);
    if (mm) {
      const r = await fetch('https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/namespace/' + mm[1] + '/bulk/items?id=' + mm[2] + '&country=US&locale=en-US&includeMainGameDetails=true', { signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'my-console/1.0' } });
      const j = await r.json(), it = j[mm[2]] || Object.values(j)[0], ki = (it && it.keyImages) || [];
      const li = ki.find((k) => /^DieselGameBoxLogo$/i.test(k.type)) || ki.find((k) => /^ProductLogo$/i.test(k.type));
      if (li && /^https:\/\//.test(li.url)) { out = await saveImg(li.url); if (out) { log('epic logo saved for ' + t + ' (launcher catalog)'); epicLogoCache.set(t, out); return out; } }
      else log('epic catalog: no logo image for ' + t + ' (types: ' + ki.map((k) => k.type).join(',') + ')');
    }
  } catch (e) { log('epic catalog ' + t + ': ' + e.message); }
  try {
    const q = 'query s($k:String,$c:String!,$l:String){Catalog{searchStore(keywords:$k,country:$c,locale:$l,count:12,allowCountries:$c){elements{title keyImages{type url}}}}}';
    const r = await fetch('https://store.epicgames.com/graphql', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', accept: 'application/json' }, body: JSON.stringify({ query: q, variables: { k: coverTitle(t), c: 'US', l: 'en-US' } }), signal: AbortSignal.timeout(15000) });
    const j = await r.json(), els = (((j.data || {}).Catalog || {}).searchStore || {}).elements || [], want = norm(coverTitle(t));
    const hit = els.find((x) => norm(coverTitle(x.title || '')) === want);
    const li = hit && (hit.keyImages || []).find((k) => /^ProductLogo$/i.test(k.type)) ;
    if (li && /^https:\/\//.test(li.url)) {
      const ir = await fetch(li.url, { signal: AbortSignal.timeout(20000) }), b = Buffer.from(await ir.arrayBuffer());
      if (ir.ok && b.length > 800 && b[0] === 0x89 && b[1] === 0x50) { fs.writeFileSync(lf, b); out = makeTrimmedLogo(id, ln); log('epic logo saved for ' + t); }
    } else log('epic logo: none found for ' + t + (hit ? ' (no ProductLogo)' : ' (no match)'));
  } catch (e) { log('epic logo ' + t + ': ' + e.message); }
  epicLogoCache.set(t, out); return out;
});


// ---- GOG: the store's own transparent logo for a game, found by its GOG product id (no name guessing) ----
const gogLogoCache = new Map();
ipcMain.handle('logo:gog', async (_e, pid) => {
  const k = String(pid || ''); if (!/^\d{1,12}$/.test(k)) return '';
  if (gogLogoCache.has(k)) return gogLogoCache.get(k);
  const id = '8' + k, ln = 'wl-' + id + '.png', lf = path.join(themeDir(), ln);
  try { if (fs.existsSync(lf)) { const r = makeTrimmedLogo(id, ln); gogLogoCache.set(k, r); return r; } } catch {}
  let out = '';
  try {
    const r = await fetch('https://api.gog.com/products/' + k, { signal: AbortSignal.timeout(15000) });
    const j = await r.json(), im = j.images || {};
    let u = im.logo2x || im.logo || ''; if (/^\/\//.test(u)) u = 'https:' + u;
    if (/^https:\/\/images[\w.-]*\.gog(-statics)?\.com\//.test(u)) {
      const ir = await fetch(u, { signal: AbortSignal.timeout(20000) }), b = Buffer.from(await ir.arrayBuffer());
      if (ir.ok && b.length > 800 && b[0] === 0x89 && b[1] === 0x50) { fs.writeFileSync(lf, b); out = makeTrimmedLogo(id, ln); log('gog logo saved for ' + k); }
    } else log('gog logo: none for ' + k);
  } catch (e) { log('gog logo ' + k + ': ' + e.message); }
  gogLogoCache.set(k, out); return out;
});

// ---- logos that ship with the console (logos folder): exact picks for games whose store logo is missing or wrong ----
const SGDB_LOGOS = {"apexlegends":[8300,"e0f6f3501955603077f0167f62a7c830.png",1],"arenabreakoutinfinite":[8101,"99b6a29382bdc2ec1433315051021ed6.png"],"callofduty":[8302,"82704fa1c2dbdb928bf4eed0667260dd.png"],"counterstrike2":[8103,"fca9c2a1ff3396b6a71747379b38c0de.png"],"darkanddarker":[8104,"9f4daa9161444515136a7907f77a2acd.png"],"dayz":[8105,"686684686c10fb28b76058e75c6978e2.png"],"deadisland2":[8306,"1186e32eafd3f43812d9157b9f82d5f7.png"],"deadlock":[8107,"8978fb15cf795be8978df408e57c7172.png"],"detroitbecomehuman":[8109,"68197667db0818801a9bb210793be9c9.png"],"efootball":[8110,"fd098afddb210c2520d858d80e39d538.png"],"fishingplanet":[8311,"6fd64f021ffaa5c4bb1fe396ec7e5c00.png"],"fivenightsatfreddysintothepit":[8112,"b55f1671bcd3083bd48d10809685b4b6.png"],"fragpunk":[8113,"c7a274845656c1f01ed6f52598d6e81a.png"],"ghostrunner2":[8114,"9ce82245e0ee99385295206eb010a1cf.png"],"hellletloose":[8115,"f5176a0931381e5dfea2d839d4aec707.png"],"hitmanworldofassassination":[8116,"c3fd43e210c1eb5f306e86be3b7a445c.png"],"hogwartslegacy":[8117,"22349c1a34658f958b6e7b311be105dd.png"],"huntshowdown1896":[8118,"c63617a9a72525823735487489f14ac5.png"],"ittakestwo":[8405,"34aa54ea9abbb1073d2ff4a687f72243.png"],"liarsbar":[8120,"dd931bffe4f69d97eb0f21d6120a3598.png"],"lifeisstrange2":[8121,"0f2c9a93eea6f38fabb3acb1c31488c6.png"],"lifeisstrangeremastered":[8122,"9d061b39b1038f907cdcc1c856796feb.png"],"lifeisstrangebeforethestormremastered":[8323,"20f7fe70d7b7286a98b0df1d4e94bc4e.png"],"marvelrivals":[8124,"c89aa37c5cb237192c993b0905c032fc.png"],"mortalshell":[8125,"ca4966a567dfbc60cf214dbae7e711f6.png"],"multiversus":[8326,"1a2fb84f960b73f9ad83e6b7ca46f6b1.png"],"overwatch":[8327,"74b4ec7df6e385eb94a64e7722a9444f.png"],"readyornot":[8128,"450db76511affed7e9bd573ef4b10515.png"],"residentevil2":[8402,"4a7f1b60519e435d909decd58f9e0858.png",4],"residentevil3":[8406,"5600b64cdafc93e021fae013593bc51c.png",4],"sifu":[8132,"ead27dafa1cb657828fcd2ab0c9cf347.png"],"sniperelite5":[8133,"292b424e4dc9f3caa7150167c9928b23.png"],"stardewvalley":[8134,"8c5e6142ffd6bab2cf97772c9b0f5d18.png"],"steep":[8135,"d6f4e43887622e2955730d553ef02612.png"],"theawesomeadventuresofcaptainspirit":[8136,"4e93d88ff84a3ec8eaf62c84f277e4c4.png"],"theescapists2":[8137,"49f3964a40121e8b424ea3861432a77b.png"],"thefinals":[8138,"3521d15aee68c527a2faae2e262101cb.png"],"thelastofuspartiiremastered":[8139,"124597f1f3c4d6d2be79dc1d3504fb25.png"],"theoutlasttrials":[8140,"6508b9695e892c2466bad6b9bf04de8f.png"],"thesims4":[8141,"cfb8d2b839c4453d97b99a83e54a0e7b.png"],"thehuntercallofthewild":[8142,"248421c7b93047f8ce8fc2fedb0134f9.png"],"tomclancysrainbowsixsiege":[8343,"54528d2a0c7d9b81435466681f8a8ff5.png"],"worldwarz":[8404,"0912d0f15f1394268c66639e39b26215.png",2],"wwe2k25":[8145,"0b40b06dd23a1e977ff561fddbdefd6e.png"],"assassinscreedodyssey":[8146,"ce79c5d65cde64e3a000b1359f4a858b.png"],"tomclancysghostreconwildlands":[8147,"62b5d8b623f50406b39826c825d13d89.png"],"tomclancysghostreconbreakpoint":[8148,"97155727d3d4db116c4c31f867e0a6f4.png"],"farcry5":[8149,"684aef11e5e0721443825788bb26d1b2.png"],"watchdogs2":[8150,"d4a5ac54d126012e7d0fca5c7a8d5907.png"],"watchdogs":[8151,"aa805d29c362dc6abce309d35387fe69.png"],"youtube":[8900,"036e926bedc57192fa6c096e18ba51fc.png",2],"netflix":[8153,"93b208bc330026ebf29cd9b56f346f5e.png"],"spotify":[8154,"420f3ca6df79b3b1f13983532d9cb825.png"],"twitch":[8155,"8ac898ad7c8213f44209d4438d902c3d.png"]};   // official transparent logos from SteamGridDB, picked one by one: key = title (letters+numbers only) -> [file id, file on cdn2.steamgriddb.com/logo/]
const BUNDLED_BACKUP = { fallguys: ['fallguys.png', 8003] };   // used only when the sharp download below fails
const BUNDLED_LOGOS = { roblox: ['roblox.png', 8010], fortnite: ['fortnite.png', 8001], rocketleague: ['rocketleague.png', 8002], efootball: ['efootball.png', 8004], google: ['google.png', 8200] };
const REMOTE_LOGOS = { fallguys: { id: 8007, url: 'https://cdn2.steamgriddb.com/logo/8c2b7c5f9176bd359d4d42f4e9f9f15d.png', white: false }, watchdogs: { id: 8005, url: 'https://logos-world.net/wp-content/uploads/2023/05/Watch-Dogs-Logo-2014.png', white: true },
  nba2k26: { id: 8006, url: 'https://assets.2k.com/1a6ngf98576c/6xQBoCja0siKf52geOwgVH/e669e1d0a0fceeb875e8cc12b2ff3c02/NBA26-STD-METADATA-PRE_ORDER-LOGO_ARTWORK-STATIC-ENUS-NO_RATING-SONY-2778x592-FINALpng.png', white: false } };   // NBA 2K26: 2K's own official logo artwork (transparent), in its real colours   // a transparent logo picture found online, downloaded once and turned white for the dark background
ipcMain.handle('logo:bundled', async (_e, title) => {
  let useBackup = () => '';
  try {
    const key = norm(coverTitle(String(title || '')));
    const hit = BUNDLED_LOGOS[key];
    if (hit) {
      const dst = 'wt-' + hit[1] + '.png', src = path.join(__dirname, 'logos', hit[0]), df = path.join(themeDir(), dst);
      if (!fs.existsSync(src)) return '';
      let need = true; try { need = fs.statSync(df).size !== fs.statSync(src).size; } catch {}
      if (need) fs.copyFileSync(src, df);
      return dst;
    }
    const bk = BUNDLED_BACKUP[key]; useBackup = () => { if (!bk) return ''; const dst = 'wt-' + bk[1] + '.png', src = path.join(__dirname, 'logos', bk[0]), df = path.join(themeDir(), dst); try { if (!fs.existsSync(src)) return ''; let need = true; try { need = fs.statSync(df).size !== fs.statSync(src).size; } catch {} if (need) fs.copyFileSync(src, df); return dst; } catch { return ''; } };
    const sg = SGDB_LOGOS[key], rm = sg ? { id: sg[0], url: 'https://cdn2.steamgriddb.com/logo/' + sg[1], white: sg[2] === 1, keepRed: sg[2] === 2, first: sg[2] === 4 } : REMOTE_LOGOS[key];
    if (rm) {
      const dst = 'wt-' + rm.id + '.png', df = path.join(themeDir(), dst);
      if (fs.existsSync(df)) return dst;
      const r = await fetch(rm.url, { signal: AbortSignal.timeout(25000) }); if (!r.ok) { log('remote logo ' + key + ': HTTP ' + r.status); return useBackup(); }
      let im = nativeImage.createFromBuffer(Buffer.from(await r.arrayBuffer())); if (im.isEmpty()) return useBackup(); if (im.getSize().width > 2400) im = im.resize({ width: 2400, quality: 'best' });
      const { width: w, height: h } = im.getSize(), bm = im.toBitmap(); let x0 = w, y0 = h, x1 = 0, y1 = 0; const rowOn = new Uint8Array(h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4; if (bm[k + 3] > 16) { rowOn[y] = 1; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (rm.white) { bm[k] = 255; bm[k + 1] = 255; bm[k + 2] = 255; } else if (rm.keepRed) { const b = bm[k], g = bm[k + 1], r = bm[k + 2]; if (!(r > g + 60 && r > b + 60)) { bm[k] = 255; bm[k + 1] = 255; bm[k + 2] = 255; } } } }
      if (rm.first) { let ys = -1, ye = -1; for (let y = 0; y < h; y++) { if (rowOn[y]) { if (ys < 0) ys = y; ye = y; } else if (ys >= 0) break; } if (ys >= 0) { y0 = ys; y1 = ye; } }   // keep only the first block of lines (drops a small subtitle line under the logo)
      if (x1 <= x0 || y1 <= y0) return useBackup();
      const out = nativeImage.createFromBitmap(bm, { width: w, height: h }).crop({ x: Math.max(0, x0 - 8), y: Math.max(0, y0 - 8), width: Math.min(w, x1 + 8) - Math.max(0, x0 - 8), height: Math.min(h, y1 + 8) - Math.max(0, y0 - 8) });
      let png = out.toPNG(); const sz = out.getSize(); if (sz.width > 2000) png = out.resize({ width: 2000, quality: 'best' }).toPNG();
      fs.writeFileSync(df, png); log('remote logo saved for ' + key); return dst;
    }
    return '';
  } catch (e) { log('bundled logo: ' + e.message); try { return useBackup(); } catch { return ''; } }
});
ipcMain.handle('heroes:store', async (_e, items) => {   // games that are not on Steam (Ubisoft, Epic, EA...): the Microsoft Store's wide hero picture for the background, found by title
  const out = {}; const list = (Array.isArray(items) ? items : []).slice(0, 12);
  const mapF = path.join(themeDir(), 'xhmap6.json'); if (!XH_MAP) { try { XH_MAP = JSON.parse(fs.readFileSync(mapF, 'utf8')) || {}; } catch { XH_MAP = {}; } } const map = XH_MAP; if (map.roblox && !map.roblox.f) delete map.roblox;   // Roblox's Store title is "Roblox - Windows": look again now that it can match
  const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', Accept: 'application/json' };
  const jget = async (u) => { const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error('http ' + r.status); return r.json(); };
  let dirty = false;
  for (const it of list) {
    try {
      if (!it || typeof it.id !== 'string' || typeof it.title !== 'string' || !it.title.trim()) continue;
      const key = xbNorm(it.title); if (!key) continue;
      if (key === 'roblox') {   // the bundled Roblox background (a game with no wide art of its own anywhere)
        try { const src = path.join(__dirname, 'logos', 'roblox-hero.jpg'), dst = path.join(themeDir(), 'wh-8010.jpg'); if (fs.existsSync(src)) { let need = true; try { need = fs.statSync(dst).size !== fs.statSync(src).size; } catch {} if (need) fs.copyFileSync(src, dst); out[it.id] = 'wh-8010.jpg'; continue; } } catch {}
      }
      const known = map[key];
      if (known && known.f && /^wh-\d{1,12}\.jpg$/.test(known.f) && fs.existsSync(path.join(themeDir(), known.f))) { out[it.id] = known.f; continue; }
      if (known && !known.f && Date.now() - (known.t || 0) < 7 * 86400000) continue;
      const t0 = it.title.replace(/[®™]/g, '').trim();
      const queries = [...new Set([t0, t0.replace(/\s+/g, '_'), t0.replace(/\s+/g, '_').toUpperCase(), t0.replace(/(\D)\s*(\d)$/, '$1®$2'), t0.split(/[:–-]/)[0].trim()].filter((s) => s && s.length > 1))];
      let pid = '', rawT = '';
      for (const plat of ['Windows.Xbox', 'Windows.Desktop']) {
        for (const qq of queries) {
          const q = new URLSearchParams({ query: qq, platformdependencyname: plat, productFamilyNames: 'Games', topProducts: '8', languages: 'en-US', market: 'US' });
          let cand = []; try { const j = await jget('https://displaycatalog.mp.microsoft.com/v7.0/productFamilies/autosuggest?' + q.toString()); cand = ((j && j.Results) || []).flatMap((r) => r.Products || []).filter((p) => p && p.ProductId && p.Type === 'Game').map((p) => ({ id: p.ProductId, raw: p.Title || '', n: xbNorm(p.Title || '') })); } catch {}
          const best = cand.find((c) => c.n === key) || cand.filter((c) => c.n.startsWith(key) && c.n.length - key.length <= 22 && /^(standard|gold|deluxe|ultimate|complete|digital|premium|special|collectors?|definitive|remastered|remaster|goty|gameoftheyear|edition|bundle|and|the|windows|xbox|pc|for)+$/.test(c.n.slice(key.length))).sort((a, b) => a.n.length - b.n.length)[0];   // only another edition of the SAME game (never a sequel: Watch Dogs is not Watch Dogs 2)
          if (best) { pid = best.id; rawT = best.raw; break; }
        }
        if (pid) break;
      }
      let file = null;
      if (pid) {
        const d = await jget('https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=' + pid + '&market=US&languages=en-US&MS-CV=DGU1mcuYo0WMMp%2BF.1');
        const arr = ((((d.Products || [])[0] || {}).LocalizedProperties || [])[0] || {}).Images || [];
        const wide = (p) => arr.filter((x) => x.ImagePurpose === p && x.Uri && (x.Width || 0) >= 1280 && (x.Width / (x.Height || 1)) > 1.5 && (x.Width / (x.Height || 1)) < 2.1).sort((a, b) => b.Width - a.Width)[0];
        const pk = wide('SuperHeroArt') || wide('TitledHeroArt') || wide('BrandedKeyArt') || wide('Screenshot');
        if (pk) {
          let u = String(pk.Uri); if (u.startsWith('//')) u = 'https:' + u;
          if (/^https:\/\/store-images\.s-microsoft\.com\//.test(u)) {
            let r = await fetch(u + (u.includes('?') ? '&' : '?') + 'w=3840&q=95', { headers: H, signal: AbortSignal.timeout(25000) }); if (!r.ok) r = await fetch(u, { headers: H, signal: AbortSignal.timeout(25000) });
            if (r.ok) { let im = nativeImage.createFromBuffer(Buffer.from(await r.arrayBuffer())); if (!im.isEmpty()) { const sz = im.getSize(); if (sz.width > 3840) im = im.resize({ width: 3840, quality: 'best' }); let hsh = 17; for (const ch of 'xh|' + key) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0; const sn = 'wh-' + hsh + '.jpg'; fs.writeFileSync(path.join(themeDir(), sn), im.toJPEG(92)); file = sn; } }
          }
        }
      }
      log('store hero for "' + it.title + '": ' + (file ? 'ok -> "' + rawT + '"' : pid ? 'matched "' + rawT + '" but no wide picture' : 'no match'));
      map[key] = { f: file, t: Date.now() }; dirty = true; if (file) out[it.id] = file;
    } catch {}
  }
  if (dirty) { try { fs.writeFileSync(mapF, JSON.stringify(map)); } catch {} }
  return out;
});
ipcMain.handle('covers:appsq', async (_e, items) => {   // an app the Microsoft Store does not have: its own icon, centred on a full square like the Store's tiles (white, or the icon's own corner colour)
  const out = {};
  for (const it of (Array.isArray(items) ? items : []).slice(0, 40)) {
    try {
      if (!it || typeof it.id !== 'string' || !/^appicon-[a-f0-9]{12}\.png$/.test(it.icon || '')) continue;
      let hsh = 13; for (const ch of 'ap|' + it.icon) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
      const sn = 'ws-' + hsh + '.jpg', sf = path.join(themeDir(), sn);
      if (fs.existsSync(sf)) { out[it.id] = sn; continue; }
      const ip = path.join(themeDir(), it.icon); if (!fs.existsSync(ip)) continue;
      const im = nativeImage.createFromPath(ip); if (im.isEmpty()) continue;
      const S = 512, { width: w, height: h } = im.getSize(), src = im.toBitmap();
      const px = (x, y) => { const k = (y * w + x) * 4; return [src[k], src[k + 1], src[k + 2], src[k + 3]]; };
      const cs = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
      let bg = [255, 255, 255];   // B, G, R order is irrelevant for white
      if (cs.every((c) => c[3] > 250)) bg = [0, 1, 2].map((i) => Math.round(cs.reduce((s, c) => s + c[i], 0) / 4));
      const full = cs.every((c) => c[3] > 250), box = Math.round(S * (full ? 1 : 0.62)), sc = Math.min(box / w, box / h), iw = Math.max(1, Math.round(w * sc)), ih = Math.max(1, Math.round(h * sc));
      const sm = im.resize({ width: iw, height: ih, quality: 'best' }), sb = sm.toBitmap(), b = Buffer.alloc(S * S * 4);
      for (let k = 0; k < b.length; k += 4) { b[k] = bg[0]; b[k + 1] = bg[1]; b[k + 2] = bg[2]; b[k + 3] = 255; }
      const ox = Math.round((S - iw) / 2), oy = Math.round((S - ih) / 2);
      for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) { const q = (y * iw + x) * 4, a = sb[q + 3] / 255, k = ((oy + y) * S + ox + x) * 4; for (let c = 0; c < 3; c++) b[k + c] = sb[q + c] * a + b[k + c] * (1 - a); }
      fs.writeFileSync(sf, nativeImage.createFromBitmap(b, { width: S, height: S }).toJPEG(94)); out[it.id] = sn;
    } catch {}
  }
  return out;
});
ipcMain.handle('covers:saveSquare', (_e, id, url) => {   // a square the page drew itself (wide art + the game's name): saved once as ws-<hash>.jpg
  try {
    if (typeof id !== 'string' || id.length > 80 || typeof url !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(url) || url.length > 3e6) return '';
    let hsh = 5; for (const ch of 'ts|' + id) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
    const sn = 'ws-' + hsh + '.jpg'; fs.writeFileSync(path.join(themeDir(), sn), Buffer.from(url.split(',')[1], 'base64')); return sn;
  } catch { return ''; }
});
ipcMain.handle('covers:square', async (_e, items) => {   // a game with no wide art/logo to build from: its own cover, shown WHOLE inside a square on a soft blurred copy of itself (nothing cut off)
  const out = {}; const list = (Array.isArray(items) ? items : []).slice(0, 60);
  for (const it of list) {
    try {
      if (!it || typeof it.id !== 'string' || typeof it.url !== 'string') continue;
      const cropIt = /^ctheme:\/\/img\/cover-[a-f0-9]{12}\.jpg$/.test(it.url) && SHIPPED_COVERS.has((/cover-[a-f0-9]{12}\.jpg/.exec(it.url) || [''])[0]);   // v1025: only the covers shipped with the console are centre-cropped; every other cover is shown WHOLE (nothing cut off)   // the covers you shipped yourself (Deadlock...) are designed to be centred: fill the square like the Recents list does
      let hsh = 7; for (const ch of it.id + '|' + it.url + (cropIt ? '|crop' : '|v6')) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
      const sn = 'ws-' + hsh + '.jpg', sf = path.join(themeDir(), sn);
      if (fs.existsSync(sf)) { out[it.id] = sn; continue; }
      let buf = null; const mt = /^ctheme:\/\/img\/([A-Za-z0-9._-]{1,80})$/.exec(it.url);
      if (mt) { const p = path.join(themeDir(), mt[1]); if (p.startsWith(themeDir()) && fs.existsSync(p)) buf = fs.readFileSync(p); }
      else if (/^https:\/\/(media\.rawg\.io|cdn[0-9]?\.(epicgames|unrealengine)\.com|[a-z0-9-]+\.epicgames\.com)\//.test(it.url)) { const r = await fetch(it.url, { signal: AbortSignal.timeout(15000) }); if (r.ok) buf = Buffer.from(await r.arrayBuffer()); }
      else { const sm = /^https:\/\/cdn\.cloudflare\.steamstatic\.com\/steam\/apps\/(\d{1,9})\/library_600x900\.jpg$/.exec(it.url);
        if (sm) for (const nm of ['library_600x900_2x.jpg', 'library_600x900.jpg', 'header.jpg']) { const r = await fetch('https://cdn.cloudflare.steamstatic.com/steam/apps/' + sm[1] + '/' + nm, { signal: AbortSignal.timeout(15000) }).catch(() => null); if (r && r.ok) { buf = Buffer.from(await r.arrayBuffer()); break; } } }   // Steam's own portrait cover, shown whole
      if (!buf) continue;
      const im = nativeImage.createFromBuffer(buf); if (im.isEmpty()) continue;
      const { width: w, height: h } = im.getSize(), S = 512;
      let outImg;
      if (w / h > 0.92 && w / h < 1.08) outImg = im.resize({ width: S, height: S, quality: 'best' });
      else if (true) {   // v1032: fill the square (zoomed to the full width/height), sliding the crop window to the busiest band (title/logo/faces) instead of the dead centre, so the title stays in and the art is centred on its content
        const side = Math.min(w, h), tall = h > w, bm = im.resize({ width: tall ? 96 : Math.max(8, Math.round(96 * w / h)), height: tall ? Math.max(8, Math.round(96 * h / w)) : 96, quality: 'good' }), bw = bm.getSize().width, bh = bm.getSize().height, bp = bm.toBitmap(), lum = (x, y) => { const q = (y * bw + x) * 4; return 0.3 * bp[q + 2] + 0.59 * bp[q + 1] + 0.11 * bp[q]; };
        const L = tall ? bh : bw, win = tall ? bw : bh, en = new Float64Array(L);
        for (let a = 0; a < L - 1; a++) { let s = 0; for (let b2 = 0; b2 < win - 1; b2++) { const x = tall ? b2 : a, y = tall ? a : b2, x2 = tall ? b2 + 1 : a, y2 = tall ? a : b2 + 1, x3 = tall ? b2 : a + 1, y3 = tall ? a + 1 : b2; s += Math.abs(lum(x, y) - lum(x2, y2)) + Math.abs(lum(x, y) - lum(x3, y3)); } en[a] = s; }
        let best = 0, bs = -1; for (let o = 0; o + win <= L; o++) { let s = 0; for (let k = 0; k < win; k++) s += en[o + k] || 0; const cd = Math.abs(o + win / 2 - L / 2) / L; s *= (1 - 0.25 * cd); if (s > bs) { bs = s; best = o; } }
        const off = Math.round(best / L * (tall ? h : w)), cx = tall ? 0 : Math.max(0, Math.min(w - side, off)), cy = tall ? Math.max(0, Math.min(h - side, off)) : 0;
        outImg = im.crop({ x: cx, y: cy, width: side, height: side }).resize({ width: S, height: S, quality: 'best' }); }
      else if (cropIt) { const side = Math.min(w, h); outImg = im.crop({ x: Math.round((w - side) / 2), y: Math.round((h - side) / 2), width: side, height: side }).resize({ width: S, height: S, quality: 'best' }); }
      else {   // v1028: the WHOLE cover, centred and sharp inside the Xbox-size square (title and all); the leftover space is one clean colour taken from the cover's own edge, with the seam faded so there is no hard line
        const sc = Math.min(S / w, S / h), fw = Math.max(1, Math.round(w * sc)), fh = Math.max(1, Math.round(h * sc)), fg = im.resize({ width: fw, height: fh, quality: 'best' }), fb = fg.toBitmap(), ox = Math.round((S - fw) / 2), oy = Math.round((S - fh) / 2);
        const horiz = fw < S, n = horiz ? fh : fw, bar = horiz ? ox : oy, FADE = 20, R = 34;
        const edge = (side) => { const a = new Float64Array(n * 3); for (let k = 0; k < n; k++) { let t0 = 0, t1 = 0, t2 = 0; for (let e = 0; e < 4; e++) { const x = horiz ? (side ? fw - 1 - e : e) : k, y = horiz ? k : (side ? fh - 1 - e : e), q = (y * fw + x) * 4; t0 += fb[q]; t1 += fb[q + 1]; t2 += fb[q + 2]; } a[k * 3] = t0 / 4; a[k * 3 + 1] = t1 / 4; a[k * 3 + 2] = t2 / 4; }
          for (let pass = 0; pass < 3; pass++) { const o = new Float64Array(n * 3); for (let k = 0; k < n; k++) for (let c = 0; c < 3; c++) { let t = 0, cnt = 0; for (let d = -R; d <= R; d++) { const kk = k + d; if (kk < 0 || kk >= n) continue; t += a[kk * 3 + c]; cnt++; } o[k * 3 + c] = t / cnt; } a.set(o); }
          return a; };   // the colour of the cover's own edge, smoothed along it: a soft glow that follows the art, no streaks
        const E0 = edge(0), E1 = edge(1), b = Buffer.alloc(S * S * 4);
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
          const k = (y * S + x) * 4, ix = x - ox, iy = y - oy, inside = ix >= 0 && ix < fw && iy >= 0 && iy < fh;
          const pos = horiz ? Math.max(0, Math.min(fh - 1, iy)) : Math.max(0, Math.min(fw - 1, ix)), first = horiz ? ix < fw / 2 : iy < fh / 2, E = first ? E0 : E1;
          const d = horiz ? (ix < 0 ? -ix : ix >= fw ? ix - fw + 1 : 0) : (iy < 0 ? -iy : iy >= fh ? iy - fh + 1 : 0), t = bar > 0 ? Math.min(1, d / bar) : 0, f = 1 - 0.28 * t;
          let c;
          if (inside) { const q = (iy * fw + ix) * 4, a = fb[q + 3] / 255, de = horiz ? Math.min(ix, fw - 1 - ix) : Math.min(iy, fh - 1 - iy), wgt = Math.min(1, de / FADE), mix = 0.5 * (1 - wgt); c = [0, 1, 2].map((z) => fb[q + z] * a * (1 - mix) + E[pos * 3 + z] * mix); }
          else c = [E[pos * 3] * f, E[pos * 3 + 1] * f, E[pos * 3 + 2] * f];
          b[k] = c[0]; b[k + 1] = c[1]; b[k + 2] = c[2]; b[k + 3] = 255;
        }
        outImg = nativeImage.createFromBitmap(b, { width: S, height: S });
      }
      fs.writeFileSync(sf, outImg.toJPEG(92)); out[it.id] = sn;
    } catch {}
  }
  return out;
});
ipcMain.handle('heroes:get', async (_e, ids) => {   // the game's CURRENT wide hero art + logo from Steam (like the Xbox / Playnite fullscreen look)
  const out = {}; const list = (Array.isArray(ids) ? ids : []).map(String).filter((x) => /^\d{1,12}$/.test(x)).slice(0, 40); let i = 0;
  const img = async (u, png) => { try { if (!/^https:\/\//.test(u)) return null; const r = await fetch(u, { signal: AbortSignal.timeout(20000) }); if (!r.ok) return null; const b = Buffer.from(await r.arrayBuffer());
    if (png) return (b.length > 800 && b[0] === 0x89 && b[1] === 0x50) ? b : null; return (b.length > 20000 && b[0] === 0xff && b[1] === 0xd8) ? b : null; } catch { return null; } };
  const work = async () => { while (i < list.length) { const id = list[i++]; const hn = 'wh-' + id + '.jpg', ln = 'wl-' + id + '.png', hf = path.join(themeDir(), hn), lf = path.join(themeDir(), ln);
    try {
      const okf = hf + '.ok';   // v1037: art saved by v1035/1036 may be an old copy (Steam's legacy 2x file); anything without this mark is downloaded again from the store's current asset list
      if (fs.existsSync(hf) && !fs.existsSync(okf)) { try { fs.unlinkSync(hf); } catch {} }
      const haveH = fs.existsSync(hf), haveL = fs.existsSync(lf);
      if (haveH) out[id] = hn; if (haveL) out[id + 'l'] = makeTrimmedLogo(id, ln); if ((haveH && haveL) || heroMiss.has(id)) continue;
      let hu = '', lu = '', base = 'https://shared.steamstatic.com/store_item_assets/';   // the store's current asset list (always the newest art)
      try {
        const r = await fetch('https://api.steampowered.com/IStoreBrowseService/GetItems/v1?input_json=' + encodeURIComponent(JSON.stringify({ ids: [{ appid: Number(id) }], context: { language: 'english', country_code: 'US' }, data_request: { include_assets: true } })), { signal: AbortSignal.timeout(15000) });
        const it = r.ok ? ((await r.json()).response || {}).store_items : null, a = it && it[0] && it[0].assets;
        if (a && a.asset_url_format) { const fm = (n) => (a.asset_url_format || '').replace('${FILENAME}', n);
          if (a.library_hero) hu = base + fm(a.library_hero); if (a.library_logo) lu = base + fm(a.library_logo); }
      } catch {}
      const cdn = 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + id + '/';
      if (!haveH) { const b = (hu && await img(hu)) || await img(cdn + 'library_hero.jpg'); if (b) { fs.writeFileSync(hf, b); fs.writeFileSync(okf, '1'); out[id] = hn; } }
      if (!haveL) { const b = (lu && await img(lu, true)) || await img(cdn + 'logo.png', true); if (b) { fs.writeFileSync(lf, b); out[id + 'l'] = ln; } }
      if (out[id + 'l']) out[id + 'l'] = makeTrimmedLogo(id, out[id + 'l']);
      if (!out[id] && !out[id + 'l']) heroMiss.add(id);
    } catch {} } };
  await Promise.all([work(), work(), work(), work()]);
  for (const id of list) if (out[id] && out[id + 'l']) { const s = makeSquare(id, out[id], out[id + 'l']); if (s) out[id + 's'] = s; }
  return out;
});

// ---- real box art for every game (like Playnite): SteamGridDB if you add a free key, otherwise the Steam store's own poster for the same title ----

// ---- IGDB (what Playnite uses by default): covers, descriptions, genres, companies, ratings, artwork. Needs a free Twitch developer app. ----
let igdbTok = { t: '', exp: 0 };
async function igdbToken() {
  const st = loadSettings(); if (!st.igdbId || !st.igdbSecret) return '';
  if (igdbTok.t && Date.now() < igdbTok.exp) return igdbTok.t;
  const r = await fetch('https://id.twitch.tv/oauth2/token?' + new URLSearchParams({ client_id: st.igdbId, client_secret: st.igdbSecret, grant_type: 'client_credentials' }), { method: 'POST', signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('Twitch rejected the IGDB client ID or secret (' + r.status + ').');
  const j = await r.json(); igdbTok = { t: j.access_token, exp: Date.now() + (j.expires_in - 600) * 1000 }; return igdbTok.t;
}
async function igdbFind(title) {   // best match for a title, with everything we show
  const tok = await igdbToken(); if (!tok) return null;
  const k = 'igdb:' + norm(title), hit = cacheGet(k); if (hit !== undefined) return hit;
  const q = `search "${String(title).replace(/["\\]/g, ' ')}"; fields name,summary,storyline,first_release_date,genres.name,involved_companies.developer,involved_companies.publisher,involved_companies.company.name,total_rating,aggregated_rating,cover.image_id,artworks.image_id,screenshots.image_id; limit 6;`;
  const r = await fetch('https://api.igdb.com/v4/games', { method: 'POST', headers: { 'Client-ID': loadSettings().igdbId, Authorization: 'Bearer ' + tok, Accept: 'application/json' }, body: q, signal: AbortSignal.timeout(15000) });
  if (r.status === 401) { igdbTok = { t: '', exp: 0 }; throw new Error('IGDB refused the login. Check the client ID and secret in Settings.'); }
  if (!r.ok) throw new Error('IGDB request failed (' + r.status + ')');
  const list = await r.json(), want = normName(title);
  const g = (Array.isArray(list) ? list : []).find((x) => normName(x.name) === want) || null;
  const img = (o, size) => (o && /^[a-z0-9]+$/.test(o.image_id || '') ? 'https://images.igdb.com/igdb/image/upload/t_' + size + '/' + o.image_id + '.jpg' : '');
  const comp = (flag) => (g && g.involved_companies || []).filter((c) => c[flag] && c.company).map((c) => String(c.company.name)).slice(0, 3);
  const d = g ? {
    name: g.name, description: String(g.summary || '').trim().slice(0, 3000) + (g.storyline ? '\n\n' + String(g.storyline).trim().slice(0, 1500) : ''),
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString().slice(0, 10) : '',
    genres: (g.genres || []).map((x) => String(x.name)).slice(0, 4), developers: comp('developer'), publishers: comp('publisher'),
    rating: g.total_rating ? Math.round(g.total_rating) / 20 : 0, metacritic: g.aggregated_rating ? Math.round(g.aggregated_rating) : 0,
    cover: img(g.cover, 'original'), wide: img((g.artworks || [])[0] || (g.screenshots || [])[0], '1080p'),
  } : null;
  cacheSet(k, d); return d;
}
async function gogFind(title) {   // GOG's public catalogue: no account or key
  const r = await fetch('https://catalog.gog.com/v1/catalog?limit=5&productType=in:game,pack&query=like:' + encodeURIComponent(title), { signal: AbortSignal.timeout(15000) });
  if (!r.ok) return null;
  const want = normName(title), p = ((await r.json()).products || []).find((x) => normName(x.title) === want); if (!p) return null;
  const cover = typeof p.coverVerticalImage === 'string' && /^https:\/\/images\.gog-statics\.com\//.test(p.coverVerticalImage) ? p.coverVerticalImage : '';
  let description = '';
  try { const d = await fetch('https://api.gog.com/products/' + encodeURIComponent(p.id) + '?expand=description', { signal: AbortSignal.timeout(15000) }); if (d.ok) { const j = await d.json(); description = unHtml((j.description && (j.description.full || j.description.lead)) || '').slice(0, 3000); } } catch {}
  return { cover, description, genres: (p.genres || []).map((x) => String(x.name || x)).slice(0, 4), developers: (p.developers || []).map(String).slice(0, 3), publishers: (p.publishers || []).map(String).slice(0, 3), released: String(p.releaseDate || '').slice(0, 10) };
}
const coverMissFile = () => path.join(app.getPath('userData'), 'cover-miss2.json');
let coverMiss = null;
const loadMiss = () => { if (!coverMiss) { try { coverMiss = JSON.parse(fs.readFileSync(coverMissFile(), 'utf8')); } catch { coverMiss = {}; } } return coverMiss; };
const saveMiss = () => { try { fs.writeFileSync(coverMissFile(), JSON.stringify(coverMiss || {})); } catch {} };
async function getJpg(url, f) {
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) }); if (!r.ok) return false;
  const b = Buffer.from(await r.arrayBuffer()); const png = b[0] === 0x89 && b[1] === 0x50, jpg = b[0] === 0xff && b[1] === 0xd8;
  if (b.length < 2000 || (!png && !jpg)) return false;
  if (png) { const im = nativeImage.createFromBuffer(b); if (im.isEmpty()) return false; fs.writeFileSync(f, (im.getSize().width > 1200 ? im.resize({ width: 1200, quality: 'best' }) : im).toJPEG(94)); }
  else fs.writeFileSync(f, b);
  return true;
}
let coverErr = '';
const coverTitle = (t) => String(t || '').replace(/[™®©]/g, '').replace(/\s*[\(\[][^)\]]*[\)\]]/g, '').replace(/\s+-\s+(deluxe|ultimate|standard|premium|gold|complete|definitive|goty|game of the year|digital).*$/i, '').replace(/\s+/g, ' ').trim();
const coverTried = new Set();
async function coverFetch(title, f) {
  const key = loadSettings().sgdbKey; let ok = false;
  try {
    if (key) {
      const H = { Authorization: 'Bearer ' + key };
      const sr = await fetch('https://www.steamgriddb.com/api/v2/search/autocomplete/' + encodeURIComponent(title), { headers: H, signal: AbortSignal.timeout(15000) });
      if (sr.status === 401 || sr.status === 403) { coverErr = 'SteamGridDB rejected the key. Check it in Settings > System.'; throw new Error(coverErr); }
      const list = sr.ok ? ((await sr.json()).data || []) : [];
      const hit = list.find((x) => norm(x.name) === norm(title)) || list.find((x) => normName(x.name) === normName(title)) || list.find((x) => norm(x.name).startsWith(norm(title)) || norm(title).startsWith(norm(x.name)));
      const id = hit && hit.id;
      if (id) {
        const gr = await fetch('https://www.steamgriddb.com/api/v2/grids/game/' + id + '?dimensions=600x900,660x930,342x482&types=static&nsfw=false&humor=false', { headers: H, signal: AbortSignal.timeout(15000) });
        const g = gr.ok ? ((await gr.json()).data || []).sort((p, q) => (q.width || 0) - (p.width || 0))[0] : null;   // the biggest, sharpest picture
        if (g && /^https:\/\/cdn2?\.steamgriddb\.com\//.test(g.url)) ok = await getJpg(g.url, f);
      }
    }
    if (!ok) { const d = await igdbFind(title).catch((e) => { log('igdb: ' + e.message); return null; }); if (d && d.cover) ok = await getJpg(d.cover, f); }
    if (!ok) {   // the Steam store's own poster for the same game (Ubisoft and EA games are mostly on Steam too): exact name first, then a close name
      const want = normName(title), strip = (s) => normName(s).replace(/^tom clancys? /, '').replace(/\b(year \d+|season \d+|the )\b/g, ' ').replace(/\s+/g, ' ').trim();
      const terms = [title, title.replace(/^tom clancy'?s\s+/i, ''), title.split(/\s+/).slice(0, 3).join(' ')].filter((x, i, a) => x && a.indexOf(x) === i);
      for (const term of terms) {
        if (ok) break;
        const r = await fetch('https://store.steampowered.com/api/storesearch/?l=english&cc=us&term=' + encodeURIComponent(term), { signal: AbortSignal.timeout(15000) });
        const items = (r.ok ? ((await r.json()).items || []) : []).filter((x) => x.type === 'app');
        const near = (x) => { const a = strip(x.name), b = strip(title); return a === b || (a.length >= 6 && b.length >= 6 && (a.startsWith(b) || b.startsWith(a))) && !/\b(soundtrack|dlc|demo|beta|dedicated server|season pass|artbook)\b/i.test(x.name); };
        const m2 = items.find((x) => normName(x.name) === want) || items.filter(near).sort((p, q) => p.name.length - q.name.length)[0];
        if (m2 && /^\d+$/.test(String(m2.id))) ok = (await getJpg('https://cdn.cloudflare.steamstatic.com/steam/apps/' + m2.id + '/library_600x900_2x.jpg', f)) || (await getJpg('https://cdn.cloudflare.steamstatic.com/steam/apps/' + m2.id + '/library_600x900.jpg', f)) || (await getJpg('https://cdn.cloudflare.steamstatic.com/steam/apps/' + m2.id + '/portrait.png', f));
      }
    }
    if (!ok) { const d = await gogFind(title).catch(() => null); if (d && d.cover) ok = await getJpg(d.cover, f); }
  } catch (e) { log('cover: ' + e.message); if (/rejected the key/.test(e.message)) throw e; return false; }
  return ok;
}
async function coverFor(rawTitle, force) {
  const title = coverTitle(rawTitle) || rawTitle;
  const h = crypto.createHash('sha1').update(norm(rawTitle)).digest('hex').slice(0, 12), name = 'cover-' + h + '.jpg', f = path.join(themeDir(), name);
  if (fs.existsSync(f)) {
    let wd = 9999; try { wd = nativeImage.createFromPath(f).getSize().width; } catch {}
    if (wd >= 900 || coverTried.has(h)) return name;   // a small old cover gets one try at a sharper one
    coverTried.add(h);
    const tmp = f + '.new';
    try { const got = await coverFetch(title, tmp); if (got && fs.existsSync(tmp) && nativeImage.createFromPath(tmp).getSize().width > wd) fs.renameSync(tmp, f); } catch {}
    try { fs.unlinkSync(tmp); } catch {}
    return name;
  }
  const miss = loadMiss(); if (!force && miss[h] && Date.now() - miss[h] < 7 * 864e5) return '';
  let ok = false;
  try { ok = await coverFetch(title, f); } catch { return ''; }
  if (!ok) { miss[h] = Date.now(); saveMiss(); return ''; }
  return name;
}
// ---- covers you picked yourself (pictures in the covers folder, named after the game with only letters and numbers: fortnite.jpg, rocketleague.jpg) ----
const EPIC_HQ = new Set(['rocketleague']);   // games whose bundled cover is small: a sharp tall cover is fetched from the Epic store (once) on this PC
async function epicTallCover(title, dst) {
  try {
    const q = 'query($k:String){Catalog{searchStore(keywords:$k,country:"US",locale:"en-US",count:6){elements{title keyImages{type url}}}}}';
    const r = await fetch('https://store.epicgames.com/graphql', { method: 'POST', headers: { 'content-type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' }, body: JSON.stringify({ query: q, variables: { k: title } }), signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error('graphql ' + r.status);
    const els = ((((await r.json()).data || {}).Catalog || {}).searchStore || {}).elements || [], want = norm(title);
    const el = els.find((e) => norm(e.title) === want) || els.find((e) => norm(e.title).startsWith(want)); if (!el) throw new Error('not found on Epic');
    const ki = (t) => (el.keyImages || []).find((k) => k.type === t && k.url);
    const img = ki('OfferImageTall') || ki('DieselStoreFrontTall') || ki('Thumbnail'); if (!img) throw new Error('no tall image');
    let u = String(img.url); const rr = await fetch(u + (u.includes('?') ? '&' : '?') + 'h=1600&resize=1&w=1200', { signal: AbortSignal.timeout(20000) }); if (!rr.ok) throw new Error('image ' + rr.status);
    const im = nativeImage.createFromBuffer(Buffer.from(await rr.arrayBuffer())); if (im.isEmpty() || im.getSize().width < 500) throw new Error('image too small');
    fs.writeFileSync(dst, im.toJPEG(92)); fs.writeFileSync(dst + '.hq', '1'); log('epic tall cover for ' + title + ': ' + im.getSize().width + 'x' + im.getSize().height); return true;
  } catch (e) { log('epic cover failed for ' + title + ': ' + (e && e.message)); try { fs.writeFileSync(dst + '.try', String(Date.now())); } catch {} return false; }
}
const SHIPPED_COVERS = new Set();
ipcMain.handle('covers:custom', async (_e, list) => {
  const out = {}, dir = path.join(__dirname, 'covers');
  let have = []; try { have = fs.readdirSync(dir).filter((f) => /^[a-z0-9]+\.(jpg|png)$/.test(f)); } catch { return out; }
  for (const x of (Array.isArray(list) ? list : [])) {
    if (!x || typeof x.id !== 'string' || typeof x.title !== 'string') continue;
    const k = norm(coverTitle(x.title) || x.title), src = have.find((f) => f.replace(/\.\w+$/, '') === k); if (!src) continue;
    try {
      const h = crypto.createHash('sha1').update(norm(x.title)).digest('hex').slice(0, 12), name = 'cover-' + h + '.jpg', dst = path.join(themeDir(), name), s = path.join(dir, src); SHIPPED_COVERS.add(name);
      if (EPIC_HQ.has(k) && !fs.existsSync(dst + '.hq')) { let tried = 0; try { tried = Number(fs.readFileSync(dst + '.try', 'utf8')) || 0; } catch {} if (Date.now() - tried > 3 * 86400000) await Promise.race([epicTallCover(coverTitle(x.title) || x.title, dst), new Promise((res) => setTimeout(res, 9000))]); }
      if (fs.existsSync(dst + '.hq')) { out[x.id] = name; continue; }   // a sharper cover was fetched from the Store
      if (!fs.existsSync(dst) || fs.statSync(dst).size !== fs.statSync(s).size || /\.png$/.test(src)) { if (/\.png$/.test(src)) fs.writeFileSync(dst, nativeImage.createFromPath(s).toJPEG(93)); else fs.copyFileSync(s, dst); }
      out[x.id] = name;
    } catch (e) { log('custom cover: ' + e.message); }
  }
  return out;
});
ipcMain.handle('covers:get', async (_e, list, force) => {
  coverErr = ''; const out = {}; const todo = (Array.isArray(list) ? list : []).filter((x) => x && typeof x.id === 'string' && typeof x.title === 'string').slice(0, 24);
  await pool(todo, 3, async (x) => {
    if (/^\d{3,10}$/.test(String(x.steamId || ''))) {   // a Steam game: Steam's own cover for this exact app (a title search can find an older game with the same name, like the 2007 skate)
      const nm = 'cover-s' + x.steamId + '.jpg', fp = path.join(themeDir(), nm);
      if (fs.existsSync(fp)) { out[x.id] = nm; return; }
      const base = 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + x.steamId + '/';
      try {
        if ((await getJpg(base + 'library_600x900_2x.jpg', fp).catch(() => false)) || (await getJpg(base + 'library_600x900.jpg', fp).catch(() => false))) { out[x.id] = nm; return; }
        for (const u of await steamPortraitUrls(x.steamId)) { if (await getJpg(u, fp).catch(() => false)) { out[x.id] = nm; return; } }
      } catch {}
    }
    const n = await coverFor(x.title.slice(0, 120), !!force); if (n) out[x.id] = n;
  });
  if (coverErr) out.__err = coverErr;
  out.__miss = todo.filter((x) => !out[x.id]).map((x) => x.title.slice(0, 40));
  return out;
});
let friendsCache = { t: 0, data: null };
ipcMain.handle('friends:get', async (_e, force) => {   // your Steam friends and whether they are online (official Steam Web API, with your own key)
  const key = loadSettings().steamKey, id = steamId64();
  if (!key) return { ok: false, error: 'Add your Steam API key in Settings > Accounts to see your friends.' };
  if (!id) return { ok: false, error: 'Steam is not signed in on this PC, so your friends cannot be found.' };
  if (!force && friendsCache.data && Date.now() - friendsCache.t < 45 * 1000) return friendsCache.data;
  try {
    const fr = await fetch(`https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${key}&steamid=${id}&relationship=friend`, { signal: AbortSignal.timeout(15000) });
    if (fr.status === 401 || fr.status === 403) return { ok: false, error: 'Steam says your friends list is private. In Steam: Profile > Edit Profile > Privacy Settings > Friends List > Public.' };
    if (!fr.ok) throw new Error('HTTP ' + fr.status);
    const ids = (((await fr.json()).friendslist || {}).friends || []).map((x) => String(x.steamid)).filter((x) => /^\d+$/.test(x));
    const list = [];
    for (let i = 0; i < ids.length && i < 300; i += 100) {
      const pr = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${ids.slice(i, i + 100).join(',')}`, { signal: AbortSignal.timeout(15000) }); if (!pr.ok) continue;
      for (const p of ((await pr.json()).response || {}).players || []) list.push({ id: String(p.steamid), name: String(p.personaname || 'Friend').slice(0, 40), state: Number(p.personastate) || 0, game: String(p.gameextrainfo || '').slice(0, 60), last: (Number(p.lastlogoff) || 0) * 1000, av: https(p.avatarfull || p.avatarmedium || '') });
    }
    const rank = (f) => (f.game ? 0 : f.state === 1 ? 1 : f.state === 2 ? 2 : f.state >= 3 ? 3 : 9);
    list.sort((a, b) => rank(a) - rank(b) || b.last - a.last || a.name.localeCompare(b.name));
    const top = list.slice(0, 80);
    await Promise.all(top.map(async (f) => { f.img = f.av ? await newsImg(f.av, 96) : ''; delete f.av; }));
    const data = { ok: true, friends: top, online: list.filter((f) => f.state > 0 || f.game).length, total: list.length };
    friendsCache = { t: Date.now(), data }; return data;
  } catch (e) { log('friends: ' + e.message); return friendsCache.data || { ok: false, error: 'Could not reach Steam (' + e.message + ').' }; }
});
ipcMain.handle('friends:open', async (_e, id) => { if (!/^\d{5,20}$/.test(String(id))) return false; try { await shell.openExternal('steam://friends/message/' + id); return true; } catch { return false; } });
let chartCache = { t: 0, items: [] };
async function chartTop() {   // the most-played games on Steam right now (Counter-Strike, Dota, PUBG, Apex, ...) with name, price and picture
  if (Date.now() - chartCache.t < 30 * 60 * 1000 && chartCache.items.length) return chartCache.items;
  try {
    const mr = await fetch('https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/', { signal: AbortSignal.timeout(12000) }); const mj = await mr.json();
    const ids = ((mj.response && mj.response.ranks) || []).slice(0, 60).map((x) => String(x.appid)), got = {}; let idx = 0;
    const work = async () => { while (idx < ids.length) { const id = ids[idx++]; try {
      const r = await fetch('https://store.steampowered.com/api/appdetails?appids=' + id + '&cc=us&l=english&filters=basic,price_overview', { signal: AbortSignal.timeout(14000) }); if (!r.ok) continue;
      const j = await r.json(), d = j && j[id] && j[id].data; if (!d || d.type !== 'game' || HW_NAME.test(d.name || '')) continue;
      const po = d.price_overview; got[id] = { id, name: d.name, price: po ? money(po.final, po.currency) : 'Free', disc: po ? po.discount_percent || 0 : 0, hdr: d.header_image || '' };
    } catch {} } };
    await Promise.all([work(), work(), work(), work(), work(), work()]);
    const items = ids.map((i) => got[i]).filter(Boolean).slice(0, 30);
    items.forEach((x) => popNames.add(normName(x.name)));
    if (items.length) chartCache = { t: Date.now(), items };
    return items;
  } catch (e) { log('chart: ' + e.message); return chartCache.items; }
}
const money = (cents, cur) => !cents ? 'Free' : ((cur === 'USD' || !cur ? '$' : cur + ' ') + (cents / 100).toFixed(2));
const popNames = new Set();   // names of the games people are playing right now (filled from Steam's most-played chart)
const HW_NAME = /^(steam (deck|frame|controller|link|machine)|valve index|steamvr)/i;
const normName = (s) => String(s || '').toLowerCase().replace(/[™®©:]/g, ' ').replace(/\b(deluxe|ultimate|standard|premium|gold|complete|definitive|goty|game of the year|bundle|edition|remastered|collection|pack|digital)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
async function heroImg(id) {   // the sharpest wide picture we can find: library art first, then the game's own screenshot
  for (const u of ['https://shared.steamstatic.com/store_item_assets/steam/apps/' + id + '/library_hero.jpg', 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + id + '/library_hero.jpg']) { const n = await newsImg(u, 1920); if (n) return n; }
  try {
    const r = await fetch('https://store.steampowered.com/api/appdetails?appids=' + id + '&filters=screenshots,background_raw', { signal: AbortSignal.timeout(12000) }); if (!r.ok) return '';
    const j = await r.json(), d = j && j[id] && j[id].data; if (!d) return '';
    const sh = d.screenshots && d.screenshots[0] && d.screenshots[0].path_full;
    return (sh && await newsImg(https(sh), 1920)) || (d.background_raw && await newsImg(https(d.background_raw), 1920)) || '';
  } catch { return ''; }
}
ipcMain.handle('store:feed', async () => {
  if (storeCache.data && Date.now() - storeCache.t < 30 * 60 * 1000) return storeCache.data;
  try {
    const fr = await fetch('https://store.steampowered.com/api/featuredcategories?cc=us&l=en', { signal: AbortSignal.timeout(12000) }); if (!fr.ok) throw new Error('featured ' + fr.status);
    const fj = await fr.json(), seen = new Set(), lists = {}; let spotC = [];
    try {   // the big banner games on the Steam front page (kept apart from the top-sellers list so nothing repeats)
      const sr = await fetch('https://store.steampowered.com/api/featured/?cc=us&l=en', { signal: AbortSignal.timeout(12000) }); const sj = sr.ok ? await sr.json() : {};
      for (const x of [].concat(sj.large_capsules || [], sj.featured_win || [])) {
        if (!x || !x.id || x.type === 1 || spotC.length >= 9) continue; const nm = x.name || '', k = normName(nm);
        if (!nm || HW_NAME.test(nm) || !k || seen.has(k) || seen.has('#' + x.id)) continue; seen.add(k); seen.add('#' + x.id);
        spotC.push({ id: String(x.id), name: nm, price: money(x.final_price, x.currency), disc: x.discount_percent || 0, hdr: x.header_image || x.large_capsule_image || '' });
      }
    } catch (e) { log('store featured: ' + e.message); }
    for (const [cat, key, n] of [['top_sellers', 'top', 20], ['new_releases', 'new', 10], ['specials', 'sale', 12], ['coming_soon', 'soon', 10]]) {   // nothing may appear twice, in any row
      const out = [];
      for (const x of ((fj[cat] && fj[cat].items) || [])) {
        if (!x || !x.id || x.type === 1 || out.length >= n) continue;
        const nm = x.name || ''; const k = normName(nm); if (!nm || HW_NAME.test(nm) || !k || seen.has(k) || seen.has('#' + x.id)) continue;
        seen.add(k); seen.add('#' + x.id);
        out.push({ id: String(x.id), name: nm, price: cat === 'coming_soon' ? 'Coming soon' : money(x.final_price, x.currency), disc: x.discount_percent || 0, hdr: x.header_image || x.large_capsule_image || '' });
      }
      lists[key] = out;
    }
    try {   // "Top sellers" = what most people are playing on Steam right now, not random store picks
      const used = new Set(spotC.map((o) => o.id).concat(['new', 'sale', 'soon'].flatMap((k) => lists[k].map((o) => o.id)))), usedN = new Set(spotC.map((o) => normName(o.name)).concat(['new', 'sale', 'soon'].flatMap((k) => lists[k].map((o) => normName(o.name)))));
      const pl = (await chartTop()).filter((x) => !used.has(x.id) && !usedN.has(normName(x.name))).slice(0, 20).map((x) => ({ ...x }));
      if (pl.length >= 6) lists.top = pl;
    } catch (e) { log('store popular: ' + e.message); }
    await Promise.all(Object.values(lists).flat().map(async (o) => { o.img = await newsImg(https(o.hdr) || ('https://cdn.cloudflare.steamstatic.com/steam/apps/' + o.id + '/header.jpg')); delete o.hdr; }));
    for (const k of Object.keys(lists)) lists[k] = lists[k].filter((o) => o.img);
    const top = lists.top;
    await Promise.all(spotC.map(async (o) => { o.img = await newsImg(https(o.hdr) || ('https://cdn.cloudflare.steamstatic.com/steam/apps/' + o.id + '/header.jpg')); delete o.hdr; o.hero = await heroImg(o.id); }));
    let spot = spotC.filter((o) => o.hero).slice(0, 5);
    if (spot.length < 3) {   // the front-page list was not available: use the best sellers instead
      await Promise.all(top.slice(0, 9).map(async (o) => { o.hero = await heroImg(o.id); }));
      spot = top.filter((o) => o.hero).slice(0, 5); const ids = new Set(spot.map((o) => o.id)); lists.top = top.filter((o) => !ids.has(o.id));
    }
    const data = { spot, top: lists.top, new: lists.new, sale: lists.sale, soon: lists.soon };
    if (data.top.length || data.spot.length) storeCache = { t: Date.now(), data };
    return data;
  } catch (e) { log('store: ' + e.message); return storeCache.data || { spot: [], top: [], new: [], sale: [], soon: [] }; }
});
ipcMain.handle('store:search', async (_e, term) => {
  try {
    term = String(term || '').trim().slice(0, 80); if (!term) return { items: [] };
    const r = await fetch('https://store.steampowered.com/api/storesearch/?term=' + encodeURIComponent(term) + '&l=english&cc=US', { signal: AbortSignal.timeout(12000) }); if (!r.ok) throw new Error('search ' + r.status);
    const j = await r.json(), seenS = new Set(), items = [];
    for (const x of ((j && j.items) || [])) {
      if (!x || !x.id || x.type === 'dlc') continue; const k = normName(x.name); if (seenS.has(k) || HW_NAME.test(x.name || '')) continue; seenS.add(k);
      items.push({ id: String(x.id), name: x.name, price: x.price ? money(x.price.final, x.price.currency) : 'Free', disc: (x.price && x.price.initial && x.price.final < x.price.initial) ? Math.round(100 - x.price.final * 100 / x.price.initial) : 0 });
      if (items.length >= 15) break;
    }
    await Promise.all(items.map(async (o) => { o.img = await newsImg('https://cdn.cloudflare.steamstatic.com/steam/apps/' + o.id + '/header.jpg'); }));
    return { items };
  } catch (e) { log('store search: ' + e.message); return { items: [], error: 'Could not reach the Store. Check your internet.' }; }
});
ipcMain.handle('store:detail', async (_e, id) => {
  try {
    id = String(id || '').replace(/\D/g, ''); if (!id) return { ok: false };
    const r = await fetch('https://store.steampowered.com/api/appdetails?appids=' + id + '&cc=us&l=english', { signal: AbortSignal.timeout(12000) }); if (!r.ok) throw new Error('detail ' + r.status);
    const j = await r.json(), d = j && j[id] && j[id].data; if (!d) return { ok: false };
    const po = d.price_overview, mv = d.movies && d.movies[0], vs = vidSrc(mv);
    let trailer = null;
    if (vs.mp4 || vs.hls) { trailer = { steamId: id, title: d.name, tag: 'Trailer', mp4: vs.mp4, hls: vs.hls, desc: unHtml(d.short_description || '').slice(0, 480), genres: (d.genres || []).map((g) => g.description).slice(0, 3), date: (d.release_date && d.release_date.date) || '', dev: (d.developers || []).slice(0, 1).join(''), thumb: await vidThumb(mv, id) }; trailExtra.set(id, trailer); }
    const shot = d.screenshots && d.screenshots[0] && d.screenshots[0].path_full;
    return { ok: true, id, name: d.name, desc: unHtml(d.short_description || '').slice(0, 520), genres: (d.genres || []).map((g) => g.description).slice(0, 4), dev: (d.developers || []).slice(0, 2).join(', '), date: (d.release_date && d.release_date.date) || '', price: d.is_free ? 'Free' : po ? po.final_formatted : '', disc: po ? po.discount_percent : 0, img: await newsImg(https(d.header_image || '')), shot: shot ? await newsImg(https(shot), 1280) : '', trailer };
  } catch (e) { log('store detail: ' + e.message); return { ok: false }; }
});
ipcMain.handle('msstore:open', async (_e, term) => {
  try {
    term = String(term || '').replace(/[^\w .,'+-]/g, ' ').trim().slice(0, 60);
    const uri = term === '__apps' ? 'ms-windows-store://home' : term ? 'ms-windows-store://search/?query=' + encodeURIComponent(term) : 'ms-windows-store://home';
    spawn('explorer.exe', [uri], { detached: true, stdio: 'ignore' }).on('error', (er) => log('msstore: ' + er.message)).unref();
    storeGrace = Date.now() + 12000; placeOnHomeScreen(); setMouse(true, true, 6000);
    setTimeout(() => { try { if (extActive && win && !mouseState && !win.isFocused()) setMouse(true, true, 0); } catch {} }, 12500);
    setTimeout(() => { try { if (extActive && mouseState) sendHelper('shield on'); } catch {} }, 5000);   // by now the Store is in front: keep the controller away from it, the mouse mode drives it
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});
// Steam now serves trailers as streaming playlists (HLS). We download the pieces once and join them into a normal file the player can open.
const absUrl = (base, u) => new URL(u, base).toString();
async function getText(u) { const r = await fetch(u, { signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + u.slice(-40)); return r.text(); }
async function hlsMedia(plUrl, outFile) {
  const txt = await getText(plUrl), lines = txt.split(/\r?\n/);
  let init = '', segs = [];
  for (const ln of lines) {
    const mp = ln.match(/^#EXT-X-MAP:.*URI="([^"]+)"/); if (mp) init = absUrl(plUrl, mp[1]);
    else if (ln && !ln.startsWith('#')) segs.push(absUrl(plUrl, ln.trim()));
  }
  if (!segs.length) throw new Error('empty playlist');
  if (!init && /\.ts(\?|$)/i.test(segs[0])) throw new Error('transport-stream trailers are not supported');
  const parts = new Array(segs.length + (init ? 1 : 0)), all = (init ? [init] : []).concat(segs); let total = 0, next = 0;
  const worker = async () => { while (next < all.length) { const i = next++; const r = await fetch(all[i], { signal: AbortSignal.timeout(60000) }); if (!r.ok) throw new Error('segment ' + r.status); const b = Buffer.from(await r.arrayBuffer()); total += b.length; if (total > 220 * 1024 * 1024) throw new Error('too large'); parts[i] = b; } };
  await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
  fs.writeFileSync(outFile, Buffer.concat(parts));
}
async function hlsTrailer(it, base) {
  const master = it.hls, txt = await getText(master), lines = txt.split(/\r?\n/);
  const vars = [], auds = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.startsWith('#EXT-X-STREAM-INF')) { const h = +((ln.match(/RESOLUTION=\d+x(\d+)/) || [])[1] || 0), bw = +((ln.match(/BANDWIDTH=(\d+)/) || [])[1] || 0); let j = i + 1; while (j < lines.length && (!lines[j] || lines[j].startsWith('#'))) j++; if (lines[j]) vars.push({ h, bw, codecs: (ln.match(/CODECS="([^"]+)"/) || [])[1] || '', url: absUrl(master, lines[j].trim()) }); }
    else if (ln.startsWith('#EXT-X-MEDIA') && /TYPE=AUDIO/.test(ln)) { const u = (ln.match(/URI="([^"]+)"/) || [])[1]; if (u) auds.push({ def: /DEFAULT=YES/.test(ln), url: absUrl(master, u) }); }
  }
  if (!vars.length) { if (/#EXTINF/.test(txt)) vars.push({ h: 0, bw: 0, url: master }); else throw new Error('no video streams in playlist'); }
  vars.sort((a, b) => (a.h || a.bw) - (b.h || b.bw));
  const ok = vars.filter((v) => v.h <= 2160 && v.h > 0), v = ok.length ? ok[ok.length - 1] : vars[vars.length - 1];   // the sharpest version Steam has (up to 4K)
  await hlsMedia(v.url, base + '.mp4');
  let audio = '';
  const a = auds.find((x) => x.def) || auds[0];
  if (a) { try { await hlsMedia(a.url, base + 'a.mp4'); audio = path.basename(base) + 'a.mp4'; } catch (e) { log('trailer audio: ' + e.message); } }
  const cs = String(v.codecs || '').split(',').map((s) => s.trim()), vcodec = cs.find((c) => /^(avc|hvc|hev|av01|vp0?9)/i.test(c)) || 'avc1.640028', acodec = cs.find((c) => /^(mp4a|ec-3|ac-3|opus|flac)/i.test(c)) || 'mp4a.40.2';
  const out = { file: path.basename(base) + '.mp4', audio, vcodec, acodec, h: v.h || 0 };
  try { fs.writeFileSync(base + '.json', JSON.stringify(out)); } catch {}
  return out;
}
ipcMain.handle('trailer:fetch', async (_e, steamId) => {
  try {
    const it = trailCache.items.find((x) => x.steamId === String(steamId)) || trailExtra.get(String(steamId)); if (!it) return { ok: false, error: 'Trailer not found.' };
    const id = String(it.steamId).replace(/\D/g, ''), base = path.join(themeDir(), 'trailer-st' + id);
    if (it.mp4) {
      const name = 'trailer-st' + id + (/\.webm/i.test(it.mp4) ? '.webm' : '.mp4'), f = path.join(themeDir(), name);
      if (fs.existsSync(f) && fs.statSync(f).size > 100000) return { ok: true, file: name };
      const r = await fetch(it.mp4, { signal: AbortSignal.timeout(120000) }); if (!r.ok) return { ok: false, error: 'Could not download the trailer.' };
      const buf = Buffer.from(await r.arrayBuffer()); if (buf.length > 150 * 1024 * 1024) return { ok: false, error: 'That trailer is too large.' };
      fs.writeFileSync(f, buf); return { ok: true, file: name };
    }
    if (it.hls) {
      if (fs.existsSync(base + '.mp4') && fs.statSync(base + '.mp4').size > 100000) { let side = {}; try { side = JSON.parse(fs.readFileSync(base + '.json', 'utf8')); } catch {} return { ok: true, file: path.basename(base) + '.mp4', audio: fs.existsSync(base + 'a.mp4') ? path.basename(base) + 'a.mp4' : '', vcodec: side.vcodec || 'avc1.640028', acodec: side.acodec || 'mp4a.40.2' }; }
      const r = await hlsTrailer(it, base); return { ok: true, ...r };
    }
    return { ok: false, error: 'No playable video for this trailer.' };
  } catch (e) { log('trailer fetch: ' + e.message); return { ok: false, error: 'Could not download the trailer (' + String(e.message).slice(0, 60) + ').' }; }
});
// ---- real Windows apps (Microsoft Store and Start menu), with their own icons ----
let appCache = null;
const APPS_PS = `
$ErrorActionPreference='SilentlyContinue'
$pk=@{}; Get-AppxPackage | ForEach-Object { $pk[$_.PackageFamilyName]=$_ }
$out=@()
foreach($a in Get-StartApps){
  $icon=''
  if($a.AppID -like '*!*'){
    $p=$pk[$a.AppID.Split('!')[0]]
    if($p){
      $m=[xml](Get-Content -LiteralPath (Join-Path $p.InstallLocation 'AppxManifest.xml'))
      $n=$m.Package.Applications.Application | Where-Object { $_.Id -eq $a.AppID.Split('!')[1] } | Select-Object -First 1
      $v=$n.VisualElements; $l=$v.Square150x150Logo; if(-not $l){$l=$v.Square44x44Logo}
      if($l){
        $full=Join-Path $p.InstallLocation $l; $dir=Split-Path $full; $base=[IO.Path]::GetFileNameWithoutExtension($full)
        $c=Get-ChildItem -LiteralPath $dir -Filter ($base+'*.png') | Where-Object { $_.Name -notmatch 'contrast|altform-lightunplated' } | Sort-Object Length -Descending | Select-Object -First 1
        if($c){$icon=$c.FullName}
      }
    }
  } elseif(Test-Path -LiteralPath $a.AppID){ $icon=$a.AppID }
  $out+=[pscustomobject]@{name=$a.Name;id=$a.AppID;icon=$icon}
}
$out | ConvertTo-Json -Compress`;
const iconName = (key) => 'appicon-' + crypto.createHash('sha1').update(key).digest('hex').slice(0, 12) + '.png';
async function saveIcon(key, getImg) {
  const name = iconName(key), f = path.join(themeDir(), name);
  try { if (fs.existsSync(f)) return name; const img = await getImg(); if (!img || img.isEmpty()) return ''; const sz = img.getSize(); fs.writeFileSync(f, (sz.width > 256 ? img.resize({ width: 256, quality: 'best' }) : img).toPNG()); return name; } catch { return ''; }
}
async function loadAppCache() {
  if (!appCache) {
    appCache = await new Promise((res) => execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', APPS_PS], { windowsHide: true, timeout: 60000, maxBuffer: 16 * 1024 * 1024 }, (err, out) => {
      if (err) { log('apps list: ' + err.message); return res(null); }
      try { let j = JSON.parse(out); if (!Array.isArray(j)) j = [j]; res(j.filter((x) => x && x.name && APP_ID.test(x.id || ''))); } catch (e) { log('apps parse: ' + e.message); res(null); }
    }));
  }
  return appCache;
}
const MS_PS = `
$ErrorActionPreference='SilentlyContinue'
$out=@()
$pk = Get-AppxPackage -Name Microsoft.WindowsStore
if(-not $pk){ $pk = Get-AppxPackage | Where-Object { $_.PackageFamilyName -like 'Microsoft.WindowsStore_*' } }
foreach($p in @($pk)){
  $loc = $p.InstallLocation
  $out += 'LOC ' + $loc
  $m = [xml](Get-Content -LiteralPath (Join-Path $loc 'AppxManifest.xml'))
  $v = $m.Package.Applications.Application | Select-Object -First 1 | ForEach-Object { $_.VisualElements }
  foreach($name in @($v.Square44x44Logo, $v.Square150x150Logo, $v.Square71x71Logo, $v.Logo)){
    if(-not $name){ continue }
    $full = Join-Path $loc $name; $dir = Split-Path $full; $base = [IO.Path]::GetFileNameWithoutExtension($full)
    $c = Get-ChildItem -LiteralPath $dir -Filter ($base + '*.png') | Where-Object { $_.Name -notmatch 'contrast|lightunplated' } | Sort-Object Length -Descending | Select-Object -First 1
    if($c){ $out += 'PNG ' + $c.FullName }
  }
  $all = Get-ChildItem -LiteralPath $loc -Recurse -Include *.png -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '(Square44x44Logo|Square150x150Logo|StoreLogo|AppList|Logo)' -and $_.Name -notmatch 'contrast|lightunplated' } | Sort-Object Length -Descending | Select-Object -First 3
  foreach($c in @($all)){ $out += 'PNG ' + $c.FullName }
}
$out`;
let msIconBusy = null;
ipcMain.handle('msstore:icon', async () => {   // the Store's own icon, taken straight from the Store app installed on this PC
  try {
    if (process.platform !== 'win32') return '';
    const name = iconName('msstore2'), f = path.join(themeDir(), name);
    if (fs.existsSync(f)) return name;
    if (!msIconBusy) msIconBusy = new Promise((res) => execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', MS_PS], { windowsHide: true, timeout: 60000, maxBuffer: 4 * 1024 * 1024 }, (err, out) => { if (err) log('store icon ps: ' + err.message); res(String(out || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)); })).finally(() => { setTimeout(() => { msIconBusy = null; }, 3000); });
    const lines = await msIconBusy; log('store icon candidates: ' + (lines.join(' | ') || 'none'));
    for (const ln of lines.filter((s) => s.startsWith('PNG '))) { const src = ln.slice(4); const n = await saveIcon('msstore2', async () => nativeImage.createFromPath(src)); if (n) return n; }
    const c = await loadAppCache(); const x = (c || []).find((a) => /^Microsoft\.WindowsStore_/i.test(a.id || '') && a.icon);
    if (x) { const n = await saveIcon('msstore2', async () => nativeImage.createFromPath(x.icon)); if (n) return n; }
    const loc = (lines.find((s) => s.startsWith('LOC ')) || '').slice(4);   // last resort: the icon of the Store program itself
    if (loc) { const n = await saveIcon('msstore2', async () => app.getFileIcon(path.join(loc, 'WinStore.App.exe'), { size: 'large' })); if (n) return n; }
    log('store icon: nothing found'); return '';
  } catch (e) { log('store icon: ' + e.message); return ''; }
});
ipcMain.handle('apps:list', async () => {
  if (process.platform !== 'win32') return { ok: false, error: 'Windows only.', apps: [] };
  await loadAppCache();
  if (!appCache) return { ok: false, error: 'Could not read your installed apps.', apps: [] };
  const seen = new Set(), list = [];
  for (const x of appCache) { const k = x.id; if (seen.has(k)) continue; seen.add(k); list.push(x); }
  list.sort((a, b) => a.name.localeCompare(b.name));
  const out = [];
  for (const x of list) {
    let icon = '';
    if (x.icon && /\.png$/i.test(x.icon)) icon = await saveIcon(x.id, async () => nativeImage.createFromPath(x.icon));
    else if (x.icon) icon = await saveIcon(x.id, async () => app.getFileIcon(x.icon, { size: 'large' }));
    out.push({ name: x.name, appId: x.id, icon });
  }
  return { ok: true, apps: out };
});
async function hqIcon(url) {   // the site's own big app icon (apple-touch / manifest), not a tiny favicon
  let base; try { base = new URL(url); } catch { return null; }
  const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'accept-language': 'en-US,en;q=0.9' };
  const cands = [], abs = (h) => { try { return new URL(h, base).href; } catch { return ''; } };
  const size = (s) => { const mm = /(\d+)x(\d+)/.exec(s || ''); return mm ? Math.min(+mm[1], +mm[2]) : 0; };
  try {
    const r = await fetch(base.origin + '/', { headers: UA, signal: AbortSignal.timeout(9000), redirect: 'follow' });
    const html = (await r.text()).slice(0, 600000), root = r.url || base.href; try { base = new URL(root); } catch {}
    let man = '';
    for (const t of html.match(/<link\b[^>]*>/gi) || []) {
      const rel = (/rel=["']([^"']+)["']/i.exec(t) || [])[1] || '', href = (/href=["']([^"']+)["']/i.exec(t) || [])[1] || '', sz = size((/sizes=["']([^"']+)["']/i.exec(t) || [])[1]);
      if (/manifest/i.test(rel) && href) man = abs(href);
      else if (/apple-touch-icon/i.test(rel) && href) cands.push({ u: abs(href), s: (sz || 180) + 400 });
      else if (/icon/i.test(rel) && href && !/\.svg(\?|$)/i.test(href)) cands.push({ u: abs(href), s: sz || 32 });
    }
    if (man) {
      try { const j = await (await fetch(man, { headers: UA, signal: AbortSignal.timeout(8000) })).json(); for (const ic of j.icons || []) if (ic.src && !/svg/i.test(ic.type || '')) cands.push({ u: new URL(ic.src, man).href, s: size(ic.sizes) + 300 }); } catch {}
    }
  } catch {}
  cands.push({ u: base.origin + '/apple-touch-icon.png', s: 500 });
  cands.push({ u: 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(base.hostname) + '&sz=256', s: 1 });
  cands.sort((x, y) => y.s - x.s);
  let best = null;
  for (const c of cands.filter((x, i, arr) => x.u && arr.findIndex((y) => y.u === x.u) === i).slice(0, 8)) {
    try {
      const r = await fetch(c.u, { headers: UA, signal: AbortSignal.timeout(9000) }); if (!r.ok) continue;
      const img = nativeImage.createFromBuffer(Buffer.from(await r.arrayBuffer())); if (img.isEmpty()) continue;
      const sz = img.getSize(), mn = Math.min(sz.width, sz.height);
      if (mn >= 120) return img;
      if (!best || mn > Math.min(best.getSize().width, best.getSize().height)) best = img;
    } catch {}
  }
  return best;
}
ipcMain.handle('apps:webicon', async (_e, url, redo) => {
  try {
    const host = new URL(url).hostname; if (!host) return '';
    if (/(^|\.)twitch\.tv$/i.test(host)) { const bundled = path.join(__dirname, 'icons', 'twitch.png'); if (fs.existsSync(bundled)) { const n = await saveIcon('web3:twitch', async () => nativeImage.createFromPath(bundled)); if (n) return n; } }   // Twitch's current logo ships with the app
    const key = 'web2:' + host, f = path.join(themeDir(), iconName(key)); if (redo) { try { fs.unlinkSync(f); } catch {} }
    return await saveIcon(key, async () => hqIcon(url));
  } catch { return ''; }
});
ipcMain.handle('apps:launch', async (_e, id) => {
  try {
    if (!APP_ID.test(String(id || ''))) return { ok: false, error: 'Unknown app.' };
    spawn('explorer.exe', ['shell:AppsFolder\\' + id], { detached: true, stdio: 'ignore' }).on('error', (er) => log('app launch: ' + er.message)).unref();
    placeOnHomeScreen();
    setMouse(true, true, 3500);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('app:browser', () => openWeb('https://www.google.com'));
ipcMain.handle('app:openweb', (_e, url) => openWeb(String(url || '')));
// ---- game info (description, rating, and so on) from RAWG ----
async function rawgDetails(id) {
  const key = loadSettings().rawgKey;
  if (!key) throw new Error('Add your free RAWG key in Settings first.');
  const k = 'd:' + id, hit = cacheGet(k);
  if (hit) return hit;
  const r = await fetch('https://api.rawg.io/api/games/' + encodeURIComponent(id) + '?' + new URLSearchParams({ key }), { signal: AbortSignal.timeout(20000) });
  if (r.status === 401 || r.status === 403) throw new Error('RAWG rejected the key. Check it in Settings.');
  if (r.status === 429) throw new Error('RAWG limit reached (free plan: 20,000 requests a month).');
  if (!r.ok) throw new Error('RAWG request failed (' + r.status + ')');
  const g = await r.json(), names = (a) => (Array.isArray(a) ? a.map((x) => String(x.name)).slice(0, 4) : []);
  const d = {
    description: String(g.description_raw || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim().slice(0, 3000),
    rating: typeof g.rating === 'number' ? Math.round(g.rating * 10) / 10 : 0,
    metacritic: Number.isInteger(g.metacritic) ? g.metacritic : 0,
    released: String(g.released || '').slice(0, 10),
    genres: names(g.genres), developers: names(g.developers), publishers: names(g.publishers),
    esrb: g.esrb_rating && g.esrb_rating.name ? String(g.esrb_rating.name) : '',
    playtime: Number.isInteger(g.playtime) ? g.playtime : 0,
    image: rawgImg(g.background_image),
  };
  cacheSet(k, d); return d;
}
async function steamRating(id) {   // Steam user reviews as a 0-5 score (share of positive reviews)
  try {
    const r = await fetch('https://store.steampowered.com/appreviews/' + encodeURIComponent(id) + '?json=1&language=all&purchase_type=all&num_per_page=0', { signal: AbortSignal.timeout(12000) });
    const q = ((await r.json()) || {}).query_summary || {}, p = q.total_positive || 0, n = q.total_negative || 0;
    return p + n >= 10 ? Math.round(p / (p + n) * 50) / 10 : 0;
  } catch { return 0; }
}
async function steamInfo(id) {   // description, genres, developer and date straight from the Steam store page (no key needed)
  const r = await fetch('https://store.steampowered.com/api/appdetails?l=english&appids=' + encodeURIComponent(id), { signal: AbortSignal.timeout(20000) });
  if (!r.ok) return null;
  const j = await r.json(), e = j && j[id]; if (!e || !e.success || !e.data) return null;
  const d = e.data, names = (a) => (Array.isArray(a) ? a.map((x) => String(x.description || x)).slice(0, 4) : []);
  return {
    description: unHtml(d.about_the_game || d.short_description || '').replace(/\s*\n\s*/g, '\n\n').slice(0, 3000) || unHtml(d.short_description || ''),
    rating: await steamRating(id), metacritic: d.metacritic && Number.isInteger(d.metacritic.score) ? d.metacritic.score : 0,
    released: d.release_date && d.release_date.date ? String(d.release_date.date).slice(0, 20) : '',
    genres: names(d.genres), developers: (d.developers || []).slice(0, 4).map(String), publishers: (d.publishers || []).slice(0, 4).map(String),
    esrb: '', playtime: 0,
  };
}

// v974: built-in game info with no keys: each store's own page by the game's own id, then the Microsoft Store listing by title
const MS_H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', Accept: 'application/json' };
async function epicInfo(g) {
  const mm = /apps\/([0-9a-f]{32})(?:%3A|:)([0-9a-f]{32})/i.exec(String(g.uri || '')); if (!mm) return null;
  const r = await fetch('https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/namespace/' + mm[1] + '/bulk/items?id=' + mm[2] + '&country=US&locale=en-US&includeMainGameDetails=true', { signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'my-console/1.0' } });
  if (!r.ok) return null;
  const j = await r.json(), it = j[mm[2]] || Object.values(j)[0]; if (!it) return null;
  const d = unHtml(it.description || '').trim(); if (!d) return null;
  const rel = (Array.isArray(it.releaseInfo) && it.releaseInfo[0] && it.releaseInfo[0].dateAdded) || it.creationDate || '';
  return { description: d.slice(0, 3000), released: String(rel).slice(0, 10), genres: (it.categories || []).map((c) => String(c.path || '')).filter((x) => x && !/^(games|applications|addons|digitalextras|editors|software)/i.test(x)).slice(0, 4), developers: it.developer ? [String(it.developer)] : [], publishers: it.developerDisplayName ? [String(it.developerDisplayName)] : [] };
}
async function gogInfoById(g) {
  const id = /^gog(\d+)$/.exec(String(g.id || '')); if (!id) return null;
  const r = await fetch('https://api.gog.com/products/' + id[1] + '?expand=description', { signal: AbortSignal.timeout(15000) });
  if (!r.ok) return null;
  const j = await r.json(), d = unHtml((j.description && (j.description.full || j.description.lead)) || '').trim(); if (!d) return null;
  let extra = null; try { extra = await gogFind(g.title); } catch {}
  return { description: d.slice(0, 3000), released: String(j.release_date || (extra && extra.released) || '').slice(0, 10), genres: (extra && extra.genres) || [], developers: (extra && extra.developers) || [], publishers: (extra && extra.publishers) || [] };
}
async function msInfo(title) {   // Microsoft Store listing found by exact name: description, developer, publisher, release date
  const t0 = String(title || '').replace(/[®™]/g, '').trim(), want = xbNorm(t0); if (!want) return null;
  const jget = async (u) => { const r = await fetch(u, { headers: MS_H, signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error('http ' + r.status); return r.json(); };
  let pid = '';
  for (const plat of ['Windows.Desktop', 'Windows.Xbox']) {
    try {
      const q = new URLSearchParams({ query: t0, platformdependencyname: plat, productFamilyNames: 'Games', topProducts: '8', languages: 'en-US', market: 'US' });
      const j = await jget('https://displaycatalog.mp.microsoft.com/v7.0/productFamilies/autosuggest?' + q.toString());
      const c = ((j && j.Results) || []).flatMap((x) => x.Products || []).filter((p) => p && p.ProductId && p.Type === 'Game');
      const hit = c.find((p) => xbNorm(p.Title) === want); if (hit) { pid = hit.ProductId; break; }
    } catch {}
  }
  if (!pid) return null;
  const d = await jget('https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=' + pid + '&market=US&languages=en-US&MS-CV=DGU1mcuYo0WMMp%2BF.1');
  const P = (d.Products || [])[0]; if (!P) return null;
  const L = (P.LocalizedProperties || [])[0] || {}, M = (P.MarketProperties || [])[0] || {}, desc = unHtml(L.ProductDescription || L.ShortDescription || '').trim(); if (!desc) return null;
  const cats = (P.Properties && (P.Properties.Categories || (P.Properties.Category ? [P.Properties.Category] : []))) || [];
  return { description: desc.slice(0, 3000), released: String(M.OriginalReleaseDate || '').slice(0, 10), genres: cats.map(String).slice(0, 4), developers: L.DeveloperName ? [String(L.DeveloperName)] : [], publishers: L.PublisherName ? [String(L.PublisherName)] : [] };
}
async function fetchInfo(l, g) {
  if (g.steamId && /^\d+$/.test(String(g.steamId))) {   // Steam games: official store info first
    try { const d = await steamInfo(String(g.steamId)); if (d && d.description) { const m0 = l.meta[g.id] || {}; l.meta[g.id] = { ...m0, ...d, infoTried: true, tried: true }; return true; } } catch (e) { log('steam info: ' + e.message); }
  }
  for (const fn of [() => (g.source === 'Epic Games' ? epicInfo(g) : null), () => (g.source === 'GOG' ? gogInfoById(g) : null), () => msInfo(g.title)]) {   // v974: the store's own page by id, then the Microsoft Store: no keys
    try { const d = await fn(); if (d && d.description) { const m0 = l.meta[g.id] || {}; l.meta[g.id] = { ...m0, ...d, rating: m0.rating || 0, metacritic: m0.metacritic || 0, esrb: m0.esrb || '', playtime: m0.playtime || 0, infoTried: true, tried: true }; return true; } } catch (e) { log('game info: ' + e.message); }
  }
  { const st = loadSettings();   // IGDB first (like Playnite), then GOG's catalogue, then RAWG
    let d = null; if (st.igdbId && st.igdbSecret) { try { d = await igdbFind(g.title); } catch (e) { if (!st.rawgKey) throw e; } }
    if (d && d.description) { const m0 = l.meta[g.id] || {}; l.meta[g.id] = { ...m0, description: d.description, released: d.released, genres: d.genres, developers: d.developers, publishers: d.publishers, rating: d.rating, metacritic: d.metacritic, image: m0.image || d.wide || '', infoTried: true, tried: true }; return true; }
    if (!st.rawgKey) { let o = null; try { o = await gogFind(g.title); } catch {} if (o && o.description) { l.meta[g.id] = { ...(l.meta[g.id] || {}), description: o.description, released: o.released, genres: o.genres, developers: o.developers, publishers: o.publishers, infoTried: true, tried: true }; return true; } l.meta[g.id] = { ...(l.meta[g.id] || {}), infoTried: true }; return false; }
  }   // find the game on RAWG (if needed), then store its details next to the game
  const m = l.meta[g.id] || {};
  let rid = g.rawgId || m.rawgId;
  if (!rid) { const h = bestMatch(await rawgCached(g.title, 3), g.title); if (h) { rid = h.rawgId; m.image = m.image || h.image; } }
  if (!rid) { l.meta[g.id] = { ...m, infoTried: true }; return false; }
  const d = await rawgDetails(rid);
  l.meta[g.id] = { ...m, ...d, image: m.image || d.image, rawgId: rid, infoTried: true, tried: true };
  return !!d.description || !!d.rating;
}
ipcMain.handle('cat:rate', async (_e, gid) => {   // fill in a missing rating: Steam reviews for Steam games, otherwise the usual game info lookup
  if (typeof gid !== 'string') return { ok: false };
  const l = loadLib(), g = decorate(l).find((x) => x.id === gid); if (!g) return { ok: false };
  try {
    let r = 0;
    if (g.steamId && /^\d+$/.test(String(g.steamId))) r = await steamRating(String(g.steamId));
    else if (!g.infoTried) { await fetchInfo(l, g); saveLib(l); return { ok: true, games: decorate(l) }; }
    const m0 = l.meta[g.id] || {}; l.meta[g.id] = { ...m0, ...(r ? { rating: r } : {}), ratingTried: true }; saveLib(l);
    return { ok: true, games: decorate(l) };
  } catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('cat:info', async (_e, gid) => {
  if (typeof gid !== 'string') return { ok: false, error: 'Unknown game.' };
  const l = loadLib(), g = decorate(l).find((x) => x.id === gid);
  if (!g) return { ok: false, error: 'Unknown game.' };
  try { const found = await fetchInfo(l, g); saveLib(l); return { ok: true, found, games: decorate(l) }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('cat:infoAll', async () => {   // up to 25 games per press, to stay well inside the free RAWG limit
  const l = loadLib(); let done = 0, firstError = null;
  const todo = decorate(l).filter((g) => !g.infoTried && !g.description).slice(0, 25);
  await pool(todo, 2, async (g) => { try { if (await fetchInfo(l, g)) done++; } catch (e) { firstError = firstError || e.message; } });
  saveLib(l);
  return { games: decorate(l), done, more: decorate(l).some((g) => !g.infoTried && !g.description), error: firstError };
});
ipcMain.handle('settings:set', (_e, s) => {
  const old = loadSettings(), c = saveSettings(s); pushCfg(c);
  for (const w of old.widgets) if (w.img && !c.widgets.some((x) => x.img === w.img)) dropWidgetImg(w.img);   // pictures of removed widgets
  return c;
});
// ---- widgets: picture, app/folder, opening ----
const WIDGET_IMG = /^widget-[a-z0-9]+\.jpg$/;
function dropWidgetImg(name) { if (WIDGET_IMG.test(name || '')) { try { fs.unlinkSync(path.join(themeDir(), name)); } catch {} } }
ipcMain.handle('widget:pickimg', async (_e, id) => {
  const cur = loadSettings(), w = cur.widgets.find((x) => x.id === id);
  if (!w) return { error: 'Unknown widget.' };
  const r = await dialog.showOpenDialog(win, { title: 'Choose a picture for this widget', properties: ['openFile'], filters: [{ name: 'Pictures', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  try {
    if (fs.statSync(r.filePaths[0]).size > 40 * 1024 * 1024) throw new Error('file too large');
    let img = nativeImage.createFromPath(r.filePaths[0]);
    if (img.isEmpty()) throw new Error('unreadable picture');
    if (img.getSize().width > 1280) img = img.resize({ width: 1280, quality: 'best' });
    const name = 'widget-' + Date.now().toString(36) + '.jpg';
    fs.writeFileSync(path.join(themeDir(), name), img.toJPEG(88));
    dropWidgetImg(w.img); w.img = name;
    return { settings: saveSettings(cur) };
  } catch (e) { log('widget picture failed: ' + e.message); return { error: 'Could not use that picture.' }; }
});
ipcMain.handle('widget:pickapp', async (_e, id, folder) => {
  const cur = loadSettings(), w = cur.widgets.find((x) => x.id === id);
  if (!w) return { error: 'Unknown widget.' };
  const r = await dialog.showOpenDialog(win, folder
    ? { title: 'Choose a folder to open', properties: ['openDirectory'] }
    : { title: 'Choose an app or file to open', properties: ['openFile'], filters: [{ name: 'Programs and shortcuts', extensions: ['exe', 'lnk', 'bat', 'cmd', 'url'] }, { name: 'All files', extensions: ['*'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  w.target = r.filePaths[0].slice(0, 400);
  if (!w.title) w.title = path.basename(w.target, path.extname(w.target)).slice(0, 40);
  return { settings: saveSettings(cur) };
});
ipcMain.handle('widget:open', async (_e, id) => {
  const w = loadSettings().widgets.find((x) => x.id === id);
  if (!w) return { ok: false, error: 'Unknown widget.' };
  try {
    if (w.type === 'web') return await openWeb(w.target);
    if (w.type === 'app') {
      if (!w.target) return { ok: false, error: 'Choose an app, file or folder for this widget first.' };
      const err = await shell.openPath(w.target);
      if (err) return { ok: false, error: err };
      await sleep(1500); setMouse(true, true);   // desktop apps need the mouse
      return { ok: true };
    }
    return { ok: false, error: 'Nothing to open.' };
  } catch (e) { return { ok: false, error: e.message }; }
});
// ---- extra users on the sign-in screen (the current user is profileName/avatarFile; these are the others) ----
ipcMain.handle('profiles:add', (_e, name, dataUrl) => {
  const cur = loadSettings(), n = String(name || '').trim().slice(0, 24);
  if (n && cur.profiles.length < 5) {
    let af = '';
    try { const mm = /^data:image\/jpeg;base64,([A-Za-z0-9+\/=]+)$/.exec(String(dataUrl || '')); if (mm && mm[1].length < 2000000) { const img = nativeImage.createFromBuffer(Buffer.from(mm[1], 'base64')); if (!img.isEmpty()) { af = 'avatar-' + Date.now().toString(36) + '.jpg'; fs.writeFileSync(path.join(themeDir(), af), img.resize({ width: 256, height: 256, quality: 'best' }).toJPEG(90)); } } } catch { af = ''; }
    cur.profiles.push({ id: wid(), name: n, avatarFile: af });
  }
  return saveSettings(cur);
});
ipcMain.handle('profiles:select', (_e, id) => {
  const cur = loadSettings(), i = cur.profiles.findIndex((p) => p.id === id);
  if (i < 0) return cur;
  const u = cur.profiles[i];
  cur.profiles[i] = { id: u.id, name: cur.profileName, avatarFile: cur.avatarFile };
  cur.profileName = u.name; cur.avatarFile = u.avatarFile;
  return saveSettings(cur);
});
ipcMain.handle('profiles:rename', (_e, id, name) => {
  const cur = loadSettings(), p = cur.profiles.find((x) => x.id === id), n = String(name || '').trim().slice(0, 24);
  if (p && n) p.name = n;
  return saveSettings(cur);
});
ipcMain.handle('profiles:remove', (_e, id) => {
  const cur = loadSettings(), p = cur.profiles.find((x) => x.id === id);
  if (p) { dropAvatar(p.avatarFile); cur.profiles = cur.profiles.filter((x) => x.id !== id); }
  return saveSettings(cur);
});
let quitFading = false;
function fadeQuit() {   // closing the console: the whole window (native views included) fades out, then it quits
  if (quitFading) return true; quitFading = true;
  try {
    if (!win || win.isDestroyed()) return app.quit();
    const t0 = Date.now(), D = 340;
    const tm = setInterval(() => {
      try { const k = Math.min(1, (Date.now() - t0) / D), e = k * k * (3 - 2 * k); win.setOpacity(1 - e); if (k >= 1) { clearInterval(tm); app.quit(); } }
      catch { clearInterval(tm); app.quit(); }
    }, 16);
    setTimeout(() => { try { app.quit(); } catch {} }, 1500);   // safety: never stay open
    try { win.webContents.executeJavaScript("document.body.classList.add('quit-out')").catch(() => {}); } catch {}
  } catch { app.quit(); }
  return true;
}
ipcMain.handle('app:quit', () => fadeQuit());
ipcMain.handle('app:calibrate', async () => { try { spawn('control.exe', ['joy.cpl'], { detached: true, stdio: 'ignore' }).unref(); await sleep(1200); setMouse(true, true); } catch {} return true; });   // Windows game controller calibration
ipcMain.handle('app:restart', () => { try { execFile('shutdown', ['/r', '/t', '0'], { windowsHide: true }, () => {}); } catch {} return true; });   // v813: restarts the computer
ipcMain.handle('app:sleep', () => { try { execFile('rundll32.exe', ['powrprof.dll,SetSuspendState', '0,1,0'], { windowsHide: true }, () => {}); } catch {} return true; });   // v813: puts the computer to sleep
ipcMain.handle('app:lock', () => { try { execFile('rundll32.exe', ['user32.dll,LockWorkStation'], { windowsHide: true }, () => {}); } catch {} return true; });   // v813: locks Windows
// ---- v813: screenshots and the Captures gallery (saved in Videos\Console captures) ----
const capDir = () => { const d = path.join(app.getPath('videos'), 'Console captures'); try { fs.mkdirSync(d, { recursive: true }); } catch {} return d; };
ipcMain.handle('cap:shot', async () => {
  try {
    const { desktopCapturer } = require('electron'), d = homeDisplay(); if (!d) return { ok: false };
    const sz = d.size, sf = d.scaleFactor || 1;
    try { win.setOpacity(0); } catch {}   // the console steps aside for a moment so the game or app underneath is what gets captured
    await sleep(320);
    let src = [];
    try { src = await Promise.race([desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: Math.round(sz.width * sf), height: Math.round(sz.height * sf) } }), new Promise((r) => setTimeout(() => r([]), 3000))]); } finally { try { win.setOpacity(1); } catch {} }
    const sc = src.find((x) => String(x.display_id) === String(d.id)) || src[0]; if (!sc || sc.thumbnail.isEmpty()) return { ok: false };
    const n = new Date(), p2 = (x) => String(x).padStart(2, '0');
    const name = 'Screenshot ' + n.getFullYear() + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()) + ' ' + p2(n.getHours()) + '-' + p2(n.getMinutes()) + '-' + p2(n.getSeconds()) + '.png';
    fs.writeFileSync(path.join(capDir(), name), sc.thumbnail.toPNG()); log('capture: saved ' + name);
    return { ok: true, name };
  } catch (e) { try { win.setOpacity(1); } catch {} log('capture: ' + e.message); return { ok: false }; }
});
ipcMain.handle('cap:list', () => {
  try { const d = capDir(); return fs.readdirSync(d).filter((f) => /\.(png|jpg|jpeg|mp4|webm)$/i.test(f)).map((f) => { const st = fs.statSync(path.join(d, f)); return { name: f, url: 'ctheme://cap/' + encodeURIComponent(f), t: st.mtimeMs, size: st.size, video: /\.(mp4|webm)$/i.test(f) }; }).sort((a, b) => b.t - a.t).slice(0, 400); } catch { return []; }
});
ipcMain.handle('cap:del', async (_e, name) => { try { if (typeof name !== 'string' || /[\\/]/.test(name)) return false; await shell.trashItem(path.join(capDir(), name)); return true; } catch { return false; } });
ipcMain.handle('cap:open', () => { try { shell.openPath(capDir()); } catch {} return true; });
// ---- v813: System info (drives, memory, network) ----
ipcMain.handle('sys:info', async () => {
  const os = require('os'), out = { host: os.hostname(), cpu: ((os.cpus()[0] || {}).model || '').replace(/\s+/g, ' ').trim(), cores: os.cpus().length, ram: os.totalmem(), ramFree: os.freemem(), up: os.uptime(), os: os.release(), drives: [], net: [] };
  try { for (const [k, v] of Object.entries(os.networkInterfaces())) for (const a of v || []) if (a.family === 'IPv4' && !a.internal) out.net.push({ name: k, ip: a.address }); } catch {}
  try { for (const l of 'CDEFGHIJKLMNOPQRSTUVWXYZ') { const r = l + ':\\'; if (!fs.existsSync(r)) continue; try { const s = await Promise.race([fs.promises.statfs(r), new Promise((res) => setTimeout(() => res(null), 1500))]); if (s) out.drives.push({ name: l + ':', total: s.blocks * s.bsize, free: s.bavail * s.bsize }); } catch {} } } catch {}
  return out;
});
ipcMain.handle('app:shutdown', () => { try { execFile('shutdown', ['/s', '/t', '0'], { windowsHide: true }, () => {}); } catch {} return true; });   // turns the computer off
ipcMain.handle('app:toggleFullscreen', () => { if (!win.isFullScreen()) win.setFullScreen(true); });   // the console never leaves fullscreen

let lagT = Date.now(), lagLogAt = 0;
setInterval(() => { const n = Date.now(), d = n - lagT - 200; lagT = n; if (d > 80 && n - lagLogAt > 500) { lagLogAt = n; log('lag: the main program stalled for ' + d + ' ms'); } }, 200);   // a stall here delays every controller press
let rLagAt = 0;
// v958: after every wallpaper change the screen is looked at (a real picture of it): if the wallpaper area is black it is rebuilt, then replaced by a still picture, and the log says exactly what happened
let wpChkT = null;
ipcMain.on('wp:changed', (_e, id) => {
  clearTimeout(wpChkT);
  const look = async (stage) => {
    try {
      if (!win || win.isDestroyed()) return;
      const b = win.getContentBounds(), img = await win.webContents.capturePage({ x: Math.round(b.width * .3), y: Math.round(b.height * .08), width: Math.round(b.width * .4), height: Math.round(b.height * .4) });
      const bm = img.toBitmap(); let s = 0, n = 0; for (let i = 0; i < bm.length - 3; i += 4 * 211) { s += (bm[i] + bm[i + 1] + bm[i + 2]) / 3; n++; }
      const lum = n ? s / n : 0; log('wallpaper: ' + id + ' check ' + stage + ': brightness ' + lum.toFixed(1) + (lum < 4 ? ' = BLACK' : ' = ok'));
      if (lum < 4 && stage < 3) { await win.webContents.executeJavaScript('window.__wpRecover&&window.__wpRecover(' + stage + ')').catch(() => {}); wpChkT = setTimeout(() => look(stage + 1), 2500); }
    } catch (e) { log('wallpaper: check failed: ' + e.message); }
  };
  wpChkT = setTimeout(() => look(1), 2200);
});
ipcMain.on('lag:log', (_e, t) => { if (/^wallpaper:/.test(String(t))) { log(String(t).slice(0, 300)); return; } const n = Date.now(); if (n - rLagAt < 800) return; rLagAt = n; log('lag: ' + String(t).slice(0, 300)); });   // slow screen frames reported by the page
app.whenReady().then(() => {
  // v823: rescue. If the console fails to stay up three starts in a row, it steps aside and opens the normal Windows desktop so you are never locked out
  try {
    const bsf = path.join(app.getPath('userData'), 'boot-state.json'); let prev = null; try { prev = JSON.parse(fs.readFileSync(bsf, 'utf8')); } catch {}
    const n = prev && !prev.ok && Date.now() - prev.t < 15 * 60000 ? (prev.n || 0) + 1 : 1;
    const wr = (o) => { try { fs.writeFileSync(bsf, JSON.stringify(o)); } catch {} };
    if (n >= 4) {
      log('RESCUE: the console did not stay up for ' + (n - 1) + ' starts in a row, so it is stepping aside and opening the normal Windows desktop. Start the console again to try it once more.');
      wr({ n: 0, t: Date.now(), ok: true });
      try { const c = spawn('explorer.exe', [], { detached: true, stdio: 'ignore' }); c.on('error', () => {}); c.unref(); } catch {}
      setTimeout(() => app.exit(0), 1500); return;
    }
    wr({ n, t: Date.now(), ok: false }); bootStateFile = bsf;
    setTimeout(() => wr({ n: 0, t: Date.now(), ok: true }), 60000);
  } catch (e) { log('rescue check: ' + e.message); }
  protocol.handle('ctheme', (req) => {   // serves only the pictures this app saved itself
    { const u0 = new URL(req.url); if (u0.hostname === 'file') {   // v821: a file the person opened from Files in the console's own viewer (a one-time token, never a path)
      const tk = /^\/([a-f0-9]{16})\.[a-z0-9]{2,5}$/.exec(u0.pathname), fp = tk && mediaTok.get(tk[1]); if (!fp) return new Response('', { status: 404 });
      const rg = req.headers.get('range'); return net.fetch(pathToFileURL(fp).toString(), rg ? { headers: { range: rg } } : undefined).then((r) => { const h = new Headers(r.headers); h.set('Access-Control-Allow-Origin', '*'); return new Response(r.body, { status: r.status, headers: h }); }).catch(() => new Response('', { status: 404 })); } }
    { const u = new URL(req.url); if (u.hostname === 'cap') {   // v813: your own screenshots (Videos\Console captures), read-only
      const cf = decodeURIComponent(u.pathname.replace(/^\//, '')); if (!/^[A-Za-z0-9 ._()-]{1,80}\.(png|jpg|jpeg|mp4|webm)$/i.test(cf)) return new Response('', { status: 404 });
      const cr = req.headers.get('range'); return net.fetch(pathToFileURL(path.join(capDir(), cf)).toString(), cr ? { headers: { range: cr } } : undefined).then((r) => { const h = new Headers(r.headers); h.set('Access-Control-Allow-Origin', '*'); return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h }); }).catch(() => new Response('', { status: 404 })); } }
    const f = decodeURIComponent(new URL(req.url).pathname.replace(/^\//, ''));
    if (!THEME_FILE.test(f) && !AVATAR_RE.test(f) && !VIDEO_RE.test(f) && !TRAILER_RE.test(f) && !WIDGET_IMG.test(f) && !APP_ICON.test(f) && !NEWS_IMG.test(f) && !POSTER_RE.test(f) && !/^w[hlts]-\d{1,12}\.(jpg|png)$/.test(f) && !/^as-[a-z0-9]{6,16}\.jpg$/.test(f) && !/^al-[a-z0-9]{1,30}\.png$/.test(f)) return new Response('', { status: 404 });
    const rng = req.headers.get('range');   // lets videos play and skip around
    let f2 = f; { const hm = /^(startup-[a-z0-9]+)\.(mp4|webm)$/.exec(f); if (hm) { try { if (fs.existsSync(path.join(themeDir(), hm[1] + '.hd.mp4'))) f2 = hm[1] + '.hd.mp4'; } catch {} } }   // a 1080p copy of the startup video, if there is one next to it, plays smoothly where a 4K 60 fps file stutters
    return net.fetch(pathToFileURL(path.join(themeDir(), f2)).toString(), rng ? { headers: { range: rng } } : undefined).then((r) => { const h = new Headers(r.headers); h.set('Access-Control-Allow-Origin', '*'); return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h }); });   // 'anonymous' access lets the startup video be drawn through the sharpening/upscaling shader
  });
  log('start');
  // the Widevine build of Electron (see install-widevine.bat) downloads Google's copy-protection module once; Spotify needs it to play sound inside the console
  const go = () => { createWindow(); startHelper(); lsStart(); };
  try {
    const { components } = require('electron');
    if (components && components.whenReady) { Promise.race([components.whenReady(), new Promise((r) => setTimeout(r, 20000))]).then(() => { try { log('widevine: ' + JSON.stringify(components.status())); } catch { log('widevine ready'); } }, (e) => log('widevine: ' + (e && e.message))).finally(go); return; }
  } catch (e) { log('widevine check: ' + e.message); }
  log('widevine: not installed (plain Electron)'); go();
});
let bootStateFile = '';
app.on('before-quit', () => { try { if (bootStateFile) fs.writeFileSync(bootStateFile, JSON.stringify({ n: 0, t: Date.now(), ok: true })); } catch {} app.isQuitting = true; try { sendHelper('unpark'); } catch {} try { log('quitting: padoff.on=' + fs.existsSync(path.join(__dirname, 'padoff.on')) + ' gotLock=' + gotLock); } catch {}  try { sendHelper('tray show'); fs.unlinkSync(path.join(app.getPath('userData'), 'taskbar-orig.txt')); } catch {} try { chgProc && chgProc.kill(); } catch {} try { watcher && watcher.kill(); } catch {} sendHelper('quit'); try { setTimeout(() => { helper && helper.kill(); }, 400); } catch {} });
app.on('window-all-closed', () => app.quit());
// ---- v814: weather, volume, Wi-Fi ----
const psRun = (ps, ms = 15000) => new Promise((res) => { try { execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { windowsHide: true, timeout: ms, maxBuffer: 1 << 20 }, (e, so) => res(e ? '' : String(so || ''))); } catch { res(''); } });
const jget = async (u, ms = 9000) => { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await net.fetch(u, { signal: c.signal }); return r.ok ? await r.json() : null; } catch { return null; } finally { clearTimeout(t); } };
let wxCache = { at: 0, d: null };
ipcMain.handle('wx:get', async (_e, force) => {
  if (!force && wxCache.d && Date.now() - wxCache.at < 600000) return wxCache.d;
  const loc = (await jget('https://ipapi.co/json/')) || (await jget('http://ip-api.com/json/'));
  const lat = loc && (loc.latitude ?? loc.lat), lon = loc && (loc.longitude ?? loc.lon);
  if (typeof lat !== 'number' || typeof lon !== 'number') return wxCache.d || { ok: false, error: 'Could not work out your location.' };
  const f = await jget(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=6`);
  if (!f || !f.current) return wxCache.d || { ok: false, error: 'Weather service did not answer.' };
  wxCache = { at: Date.now(), d: { ok: true, city: [loc.city, loc.region_code || loc.region].filter(Boolean).join(', '), cur: f.current, daily: f.daily } };
  return wxCache.d;
});
// Windows master volume through the Core Audio COM interfaces (the vtable order below is the real one; Guid arguments go by ref)
const VOL_CS = `using System;using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume{int RegisterControlChangeNotify(IntPtr p);int UnregisterControlChangeNotify(IntPtr p);int GetChannelCount(out uint c);int SetMasterVolumeLevel(float l,ref Guid g);int SetMasterVolumeLevelScalar(float l,ref Guid g);int GetMasterVolumeLevel(out float l);int GetMasterVolumeLevelScalar(out float l);int SetChannelVolumeLevel(uint n,float l,ref Guid g);int SetChannelVolumeLevelScalar(uint n,float l,ref Guid g);int GetChannelVolumeLevel(uint n,out float l);int GetChannelVolumeLevelScalar(uint n,out float l);int SetMute([MarshalAs(UnmanagedType.Bool)]bool b,ref Guid g);int GetMute([MarshalAs(UnmanagedType.Bool)]out bool b);}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice{int Activate(ref Guid iid,uint ctx,IntPtr p,[MarshalAs(UnmanagedType.IUnknown)]out object o);}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator{int EnumAudioEndpoints(int f,int s,out IntPtr d);int GetDefaultAudioEndpoint(int f,int r,out IMMDevice d);}
[ComImport,Guid("BCDE0395-E52F-49B9-9E15-6C6E2A2B0A24")]class MMDeviceEnumeratorCom{}
public static class VolCtl{
 static IAudioEndpointVolume Ep(){var e=(IMMDeviceEnumerator)new MMDeviceEnumeratorCom();IMMDevice d;e.GetDefaultAudioEndpoint(0,1,out d);Guid g=typeof(IAudioEndpointVolume).GUID;object o;d.Activate(ref g,23,IntPtr.Zero,out o);return (IAudioEndpointVolume)o;}
 static IAudioEndpointVolume EpF(int f){var e=(IMMDeviceEnumerator)new MMDeviceEnumeratorCom();IMMDevice d;e.GetDefaultAudioEndpoint(f,1,out d);Guid g=typeof(IAudioEndpointVolume).GUID;object o;d.Activate(ref g,23,IntPtr.Zero,out o);return (IAudioEndpointVolume)o;}
 public static string GetF(int f){var ep=EpF(f);float v;bool m;ep.GetMasterVolumeLevelScalar(out v);ep.GetMute(out m);return Math.Round(v*100)+" "+(m?"1":"0");}
 public static void SetF(int f,float v,bool m){var ep=EpF(f);Guid z=Guid.Empty;ep.SetMasterVolumeLevelScalar(v,ref z);ep.SetMute(m,ref z);}
 public static string Get(){var ep=Ep();float v;bool m;ep.GetMasterVolumeLevelScalar(out v);ep.GetMute(out m);return Math.Round(v*100)+" "+(m?"1":"0");}
 public static void Set(float v,bool m){var ep=Ep();Guid z=Guid.Empty;ep.SetMasterVolumeLevelScalar(v,ref z);ep.SetMute(m,ref z);}
}`;
const volScript = (body) => {   // written to a file (never passed on the command line, where Windows would mangle the quotes) and run with -File
  const f = path.join(app.getPath('userData'), 'vol-helper.ps1');
  fs.writeFileSync(f, "$ErrorActionPreference='Stop'\r\n$src=@'\r\n" + VOL_CS + "\r\n'@\r\nAdd-Type -TypeDefinition $src\r\n" + body + "\r\n");
  return f;
};
const psFile = (f, ms = 20000) => new Promise((res) => { try { execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', f], { windowsHide: true, timeout: ms, maxBuffer: 1 << 20 }, (e, so, se) => { if (e) log('volume: ' + String(se || e.message).replace(/\s+/g, ' ').slice(0, 200)); res(e ? '' : String(so || '')); }); } catch { res(''); } });
ipcMain.handle('vol:get', async () => { try { const o = (await psFile(volScript('[VolCtl]::Get()'))).trim().split(/\s+/); return o.length >= 2 && Number.isFinite(Number(o[0])) ? { ok: true, vol: Number(o[0]), mute: o[1] === '1' } : { ok: false }; } catch { return { ok: false }; } });
ipcMain.handle('vol:set', async (_e, v, m) => { try { const n = Math.max(0, Math.min(100, Math.round(Number(v)))); if (!Number.isFinite(n)) return { ok: false }; await psFile(volScript('[VolCtl]::Set([single]' + (n / 100).toFixed(2) + ',$' + (m ? 'true' : 'false') + ')')); return { ok: true, vol: n, mute: !!m }; } catch { return { ok: false }; } });
ipcMain.handle('wifi:get', async () => {
  const run = (a) => new Promise((res) => { try { execFile('netsh', a, { windowsHide: true, timeout: 8000 }, (e, so) => res(e ? '' : String(so || ''))); } catch { res(''); } });
  const cur = await run(['wlan', 'show', 'interfaces']), prof = await run(['wlan', 'show', 'profiles']);
  const g = (k) => { const m = cur.match(new RegExp('^\\s*' + k + '\\s*:\\s*(.+)$', 'mi')); return m ? m[1].trim() : ''; };
  const profiles = [...prof.matchAll(/:\s*(.+)$/gm)].map((m) => m[1].trim()).filter((x) => x && !/^(All User Profile)$/i.test(x));
  return { ok: !!cur, ssid: /^connected$/i.test(g('State')) ? g('SSID') : '', signal: g('Signal'), state: g('State'), profiles: [...new Set(profiles)].slice(0, 40) };
});
ipcMain.handle('wifi:off', async () => new Promise((res) => execFile('netsh', ['wlan', 'disconnect'], { windowsHide: true, timeout: 8000 }, (e) => res(!e))));
// ---- v821: Tools (files, media, performance, Windows settings) ----
const MEDIA_EXT = { image: /\.(jpe?g|png|webp|gif|bmp|avif)$/i, video: /\.(mp4|webm|m4v|mov|ogv)$/i, audio: /\.(mp3|wav|ogg|oga|flac|m4a|aac|opus)$/i, text: /\.(txt|log|md|json|ini|cfg|conf|csv|xml|yml|yaml|nfo|bat|js|css|html?)$/i };
const mediaKind = (n) => (MEDIA_EXT.image.test(n) ? 'image' : MEDIA_EXT.video.test(n) ? 'video' : MEDIA_EXT.audio.test(n) ? 'audio' : MEDIA_EXT.text.test(n) ? 'text' : '');
const goodPath = (p) => typeof p === 'string' && p.length > 0 && p.length < 1000 && !/[\0<>|"?*]/.test(p.replace(/^[A-Za-z]:/, '')) && path.isAbsolute(p);
ipcMain.handle('fs:places', () => {
  const out = [];
  for (const [k, n] of [['desktop', 'Desktop'], ['documents', 'Documents'], ['downloads', 'Downloads'], ['pictures', 'Pictures'], ['videos', 'Videos'], ['music', 'Music']]) { try { const p = app.getPath(k); if (fs.existsSync(p)) out.push({ name: n, path: p, kind: 'place', key: k }); } catch {} }
  for (const l of 'CDEFGHIJKLMNOPQRSTUVWXYZ') { const r = l + ':\\'; try { if (fs.existsSync(r)) { let sp = ''; try { const st = fs.statfsSync(r); const fr = st.bavail * st.bsize, tt = st.blocks * st.bsize; sp = (fr / 1073741824 >= 100 ? Math.round(fr / 1073741824) : (fr / 1073741824).toFixed(1)) + ' GB free of ' + Math.round(tt / 1073741824) + ' GB'; } catch {} out.push({ name: 'Drive ' + l + ':', path: r, kind: 'drive', space: sp }); } } catch {} }
  return out;
});
ipcMain.handle('fs:list', async (_e, dir) => {
  try {
    if (!goodPath(dir)) return { ok: false, error: 'Not a folder.' };
    const ents = await fs.promises.readdir(dir, { withFileTypes: true });
    const rows = [];
    for (const d of ents) {
      if (rows.length >= 1500) break;
      const n = d.name; if (/^(\$|System Volume Information|desktop\.ini|thumbs\.db)/i.test(n)) continue;
      let dir2 = d.isDirectory(), size = 0, mt = 0;
      try { const st = await fs.promises.stat(path.join(dir, n)); dir2 = st.isDirectory(); size = dir2 ? 0 : st.size; mt = st.mtimeMs; } catch { continue; }
      rows.push({ name: n, dir: dir2, size, mt, kind: dir2 ? '' : mediaKind(n) });
    }
    rows.sort((a, b) => (a.dir !== b.dir ? (a.dir ? -1 : 1) : a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })));
    const par = path.dirname(dir);
    return { ok: true, path: dir, parent: par !== dir ? par : '', rows };
  } catch (e) { return { ok: false, error: e.code === 'EACCES' || e.code === 'EPERM' ? 'No permission to open this folder.' : 'Could not open this folder.' }; }
});
ipcMain.handle('fs:open', async (_e, p) => {
  try {
    if (!goodPath(p) || !fs.existsSync(p)) return { ok: false };
    const r = await shell.openPath(p);
    if (r) return { ok: false, error: r };
    placeOnHomeScreen(); setMouse(true, true, 3500);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});
const mediaTok = new Map();   // token -> file the person picked in Files; nothing else is ever served
ipcMain.handle('fs:media', (_e, p) => {
  try {
    if (!goodPath(p) || !mediaKind(p) || !fs.existsSync(p)) return '';
    const crypto2 = require('crypto'); let tok = [...mediaTok.entries()].find(([, v]) => v === p);
    tok = tok ? tok[0] : crypto2.randomBytes(8).toString('hex');
    mediaTok.set(tok, p); if (mediaTok.size > 400) mediaTok.delete(mediaTok.keys().next().value);
    return 'ctheme://file/' + tok + path.extname(p).toLowerCase();
  } catch { return ''; }
});
let perfPrev = null, perfNet = null;
ipcMain.handle('perf:sample', async () => {
  const os = require('os'), cp = os.cpus(), now = cp.map((c) => ({ idle: c.times.idle, tot: Object.values(c.times).reduce((a, b) => a + b, 0) }));
  let cores = cp.map(() => 0), cpu = 0;
  if (perfPrev && perfPrev.length === now.length) { cores = now.map((n, i) => { const dt = n.tot - perfPrev[i].tot, di = n.idle - perfPrev[i].idle; return dt > 0 ? Math.max(0, Math.min(100, Math.round(100 * (1 - di / dt)))) : 0; }); cpu = Math.round(cores.reduce((a, b) => a + b, 0) / Math.max(1, cores.length)); }
  perfPrev = now;
  const out = { cpu, cores, ram: os.totalmem(), ramFree: os.freemem(), up: os.uptime(), cpuName: ((cp[0] || {}).model || '').replace(/\s+/g, ' ').trim() };
  if (!perfGpuAt || Date.now() - perfGpuAt > 2500) {
    perfGpuAt = Date.now();
    perfGpu = await new Promise((res) => { try { execFile('nvidia-smi', ['--query-gpu=name,utilization.gpu,temperature.gpu,memory.used,memory.total,power.draw', '--format=csv,noheader,nounits'], { windowsHide: true, timeout: 2500 }, (e, so) => { if (e) return res(null); const p = String(so).trim().split('\n')[0].split(',').map((x) => x.trim()); res(p.length >= 5 ? { name: p[0], util: Number(p[1]), temp: Number(p[2]), mem: Number(p[3]), memTot: Number(p[4]), power: Number(p[5]) || 0 } : null); }); } catch { res(null); } });
  }
  out.gpu = perfGpu; return out;
});
let perfGpuAt = 0, perfGpu = null;
const WIN_SETTINGS = /^ms-settings:[a-z0-9-]{3,40}$/;
ipcMain.handle('win:settings', (_e, uri) => {
  try { if (!WIN_SETTINGS.test(String(uri))) return false; shell.openExternal(uri); placeOnHomeScreen(); setMouse(true, true, 3500); return true; } catch { return false; }
});

const WIN_TOOLS = { taskmgr: ['taskmgr.exe'], explorer: ['explorer.exe'], devmgmt: ['mmc.exe', 'devmgmt.msc'], diskmgmt: ['mmc.exe', 'diskmgmt.msc'], control: ['control.exe'] };
ipcMain.handle('win:tool', (_e, k) => {
  try { const a = WIN_TOOLS[String(k)]; if (!a) return false; const c = spawn(a[0], a.slice(1), { detached: true, stdio: 'ignore' }); c.on('error', () => {}); c.unref(); placeOnHomeScreen(); setMouse(true, true, 3500); return true; } catch { return false; }
});

// ---- v822: running apps, file actions, power plans, recycle bin ----
const psScript = (name, body) => { const f = path.join(app.getPath('userData'), name + '.ps1'); fs.writeFileSync(f, "$ErrorActionPreference='Stop'\r\n" + body + "\r\n"); return f; };
ipcMain.handle('win:list', async () => {
  try {
    const f = psScript('apps-list', "Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -ne '' } | ForEach-Object { [pscustomobject]@{ id = $_.Id; name = $_.ProcessName; title = $_.MainWindowTitle } } | ConvertTo-Json -Compress");
    const o = (await psFile(f, 12000)).trim(); if (!o) return [];
    let j = JSON.parse(o); if (!Array.isArray(j)) j = [j];
    const hide = /^(textinputhost|systemsettings|searchhost|startmenuexperiencehost|shellexperiencehost|lockapp|widgets|nvidia overlay|nvcontainer)$/i;
    return j.filter((x) => x && Number.isInteger(x.id) && x.id !== process.pid && !hide.test(x.name) && !/^(Program Manager|Settings)$/.test(x.title)).slice(0, 60);
  } catch { return []; }
});
ipcMain.handle('win:focus', async (_e, pid) => {
  try {
    if (!Number.isInteger(pid) || pid <= 4) return false;
    const f = psScript('apps-focus', "Add-Type -Name W -Namespace N -MemberDefinition '[DllImport(\"user32.dll\")] public static extern bool ShowWindowAsync(IntPtr h,int c); [DllImport(\"user32.dll\")] public static extern bool SetForegroundWindow(IntPtr h); [DllImport(\"user32.dll\")] public static extern bool IsIconic(IntPtr h); [DllImport(\"user32.dll\")] public static extern void keybd_event(byte a,byte b,uint c,UIntPtr d);'\r\n$p = Get-Process -Id " + pid + "\r\n$h = $p.MainWindowHandle\r\nif ([N.W]::IsIconic($h)) { [N.W]::ShowWindowAsync($h, 9) | Out-Null }\r\n[N.W]::keybd_event(0x12,0,0,[UIntPtr]::Zero); [N.W]::keybd_event(0x12,0,2,[UIntPtr]::Zero)\r\n[N.W]::SetForegroundWindow($h) | Out-Null\r\n'ok'");
    const r = (await psFile(f, 8000)).trim(); if (r === 'ok') setMouse(true, true, 3500); return r === 'ok';
  } catch { return false; }
});
ipcMain.handle('win:close', async (_e, pid, force) => {
  try {
    if (!Number.isInteger(pid) || pid <= 4 || pid === process.pid) return false;
    const f = psScript('apps-close', force ? "Stop-Process -Id " + pid + " -Force\r\n'ok'" : "$p = Get-Process -Id " + pid + "\r\n[void]$p.CloseMainWindow()\r\n'ok'");
    return (await psFile(f, 8000)).trim() === 'ok';
  } catch { return false; }
});
ipcMain.handle('fs:reveal', (_e, p) => { try { if (!goodPath(p) || !fs.existsSync(p)) return false; shell.showItemInFolder(p); placeOnHomeScreen(); setMouse(true, true, 3500); return true; } catch { return false; } });
ipcMain.handle('fs:trash', async (_e, p) => { try { if (!goodPath(p) || !fs.existsSync(p) || path.dirname(p) === p) return { ok: false, error: 'That cannot be moved.' }; await shell.trashItem(p); return { ok: true }; } catch (e) { return { ok: false, error: 'Windows would not move it to the Recycle Bin.' }; } });
const goodName = (n) => typeof n === 'string' && n.length > 0 && n.length < 120 && !/[\\/:*?"<>|\0]/.test(n) && !/^\.+$/.test(n) && !/[. ]$/.test(n) && !/^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i.test(n);
ipcMain.handle('fs:rename', (_e, p, name) => { try { if (!goodPath(p) || !goodName(name) || !fs.existsSync(p)) return { ok: false, error: 'That name cannot be used.' }; const to = path.join(path.dirname(p), name); if (fs.existsSync(to)) return { ok: false, error: 'Something with that name is already there.' }; fs.renameSync(p, to); return { ok: true }; } catch { return { ok: false, error: 'Could not rename it.' }; } });
ipcMain.handle('fs:mkdir', (_e, dir, name) => { try { if (!goodPath(dir) || !goodName(name) || !fs.existsSync(dir)) return { ok: false, error: 'That name cannot be used.' }; const to = path.join(dir, name); if (fs.existsSync(to)) return { ok: false, error: 'Something with that name is already there.' }; fs.mkdirSync(to); return { ok: true }; } catch { return { ok: false, error: 'Could not make the folder.' }; } });
ipcMain.handle('pwr:list', async () => {
  try {
    const o = await new Promise((res) => execFile('powercfg.exe', ['/list'], { windowsHide: true, timeout: 6000 }, (e, so) => res(e ? '' : String(so))));
    const plans = [...o.matchAll(/GUID:\s*([0-9a-f-]{36})\s+\((.+?)\)(\s*\*)?/gi)].map((m) => ({ guid: m[1].toLowerCase(), name: m[2], active: !!m[3] }));
    return plans;
  } catch { return []; }
});
ipcMain.handle('pwr:set', async (_e, guid) => {
  try { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(guid))) return false; return await new Promise((res) => execFile('powercfg.exe', ['/setactive', guid], { windowsHide: true, timeout: 6000 }, (e) => res(!e))); } catch { return false; }
});
ipcMain.handle('bin:empty', async () => { try { const f = psScript('bin-empty', "Clear-RecycleBin -Force -ErrorAction SilentlyContinue\r\n'ok'"); return (await psFile(f, 30000)).trim() === 'ok'; } catch { return false; } });

// ---- v823: sound output devices (list + switch the Windows default) ----
const AUD_CS = `using System;using System.Runtime.InteropServices;using System.Text;
[StructLayout(LayoutKind.Sequential)] public struct PKEY{public Guid fmtid;public uint pid;}
[StructLayout(LayoutKind.Sequential)] public struct PVAR{public ushort vt;public ushort r1;public ushort r2;public ushort r3;public IntPtr p;public IntPtr p2;}
[Guid("886d8eeb-8cf2-4446-8d02-cdba1dbdcf99"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IPropertyStore{int GetCount(out uint c);int GetAt(uint i,out PKEY k);int GetValue(ref PKEY k,out PVAR v);int SetValue(ref PKEY k,ref PVAR v);int Commit();}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice{int Activate(ref Guid iid,uint ctx,IntPtr p,[MarshalAs(UnmanagedType.IUnknown)]out object o);int OpenPropertyStore(int access,out IPropertyStore ps);int GetId([MarshalAs(UnmanagedType.LPWStr)]out string id);int GetState(out int s);}
[Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceCollection{int GetCount(out uint c);int Item(uint i,out IMMDevice d);}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator{int EnumAudioEndpoints(int flow,int state,out IMMDeviceCollection c);int GetDefaultAudioEndpoint(int flow,int role,out IMMDevice d);}
[ComImport,Guid("BCDE0395-E52F-49B9-9E15-6C6E2A2B0A24")]class MMDeviceEnumeratorCom{}
[Guid("f8679f50-850a-41cf-9c72-430f290290c8"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IPolicyConfig{int m1();int m2();int m3();int m4();int m5();int m6();int m7();int m8();int m9();int m10();int SetDefaultEndpoint([MarshalAs(UnmanagedType.LPWStr)]string id,int role);int m12();}
[ComImport,Guid("870af99c-171d-4f9e-af0d-e63df40c2bc9")]class PolicyConfigCom{}
public static class Aud{
 [DllImport("ole32.dll")] static extern int PropVariantClear(ref PVAR v);
 static string Name(IMMDevice d){IPropertyStore ps;d.OpenPropertyStore(0,out ps);PKEY k=new PKEY();k.fmtid=new Guid("a45c254e-df1c-4efd-8020-67d146a850e0");k.pid=14;PVAR v;ps.GetValue(ref k,out v);string s=v.vt==31?Marshal.PtrToStringUni(v.p):"Device";PropVariantClear(ref v);return s;}
 static string J(string s){return s.Replace("\\\","\\\\\\\").Replace("\"","\\\\\"");}
 public static string List(){return ListF(0);}
 public static string ListF(int fl){var e=(IMMDeviceEnumerator)new MMDeviceEnumeratorCom();IMMDevice def;string did="";try{e.GetDefaultAudioEndpoint(fl,1,out def);def.GetId(out did);}catch{}
  IMMDeviceCollection c;e.EnumAudioEndpoints(fl,1,out c);uint n;c.GetCount(out n);var sb=new StringBuilder("[");
  for(uint i=0;i<n;i++){IMMDevice d;c.Item(i,out d);string id;d.GetId(out id);if(i>0)sb.Append(",");sb.Append("{\"id\":\""+J(id)+"\",\"name\":\""+J(Name(d))+"\",\"def\":"+(id==did?"true":"false")+"}");}
  return sb.Append("]").ToString();}
 public static void Set(string id){var p=(IPolicyConfig)new PolicyConfigCom();for(int r=0;r<3;r++)p.SetDefaultEndpoint(id,r);}
}`;
const audScript = (body) => { const f = path.join(app.getPath('userData'), 'aud-helper.ps1'); fs.writeFileSync(f, "$ErrorActionPreference='Stop'\r\n$src=@'\r\n" + AUD_CS + "\r\n'@\r\nAdd-Type -TypeDefinition $src\r\n" + body + "\r\n"); return f; };
ipcMain.handle('aud:list', async () => {
  try { const o = (await psFile(audScript('[Aud]::List()'), 25000)).trim(); const j = JSON.parse(o); return Array.isArray(j) ? j : []; } catch (e) { log('audio list: ' + e.message); return []; }
});
ipcMain.handle('aud:set', async (_e, id) => {
  try { if (!/^\{[0-9a-f.]+\}\.\{[0-9a-f-]{36}\}$/i.test(String(id))) return false; const f = audScript("[Aud]::Set('" + id + "')\r\n'ok'"); return (await psFile(f, 25000)).trim() === 'ok'; } catch { return false; }
});

// ---- v823: file search for "Search everything" (only your own folders, shallow, never reads file contents) ----
ipcMain.handle('fs:find', async (_e, q) => {
  try {
    q = String(q || '').trim().toLowerCase(); if (q.length < 2 || q.length > 60) return [];
    const roots = []; for (const k of ['desktop', 'documents', 'downloads', 'pictures', 'videos', 'music']) { try { roots.push(app.getPath(k)); } catch {} }
    const out = [], skip = /^(node_modules|\.git|appdata|\$recycle\.bin|system volume information)$/i; let seen = 0; const t0 = Date.now();
    const walk = async (dir, depth) => {
      if (out.length >= 40 || seen > 6000 || Date.now() - t0 > 2500) return;
      let ents; try { ents = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return; }
      const subs = [];
      for (const d of ents) {
        seen++; const nm = d.name; if (nm.toLowerCase().includes(q)) { out.push({ name: nm, path: path.join(dir, nm), dir: d.isDirectory(), kind: d.isDirectory() ? '' : mediaKind(path.join(dir, nm)) || '' }); if (out.length >= 40) return; }
        if (d.isDirectory() && depth < 4 && !skip.test(nm)) subs.push(path.join(dir, nm));
      }
      for (const s of subs) await walk(s, depth + 1);
    };
    for (const r of roots) await walk(r, 0);
    return out;
  } catch { return []; }
});

// ================= v827: browser inside the console (the controller is the mouse; the typing keyboard opens by itself on text boxes) =================
let brView = null, brShown = false, brMouseT = null, brZoom = 1.25, brHooked = false;
const brTabs = [];   // every open tab; brView is the one on screen
const BR_ENG = { duckduckgo: ['DuckDuckGo', 'https://duckduckgo.com/?q=', 'https://duckduckgo.com/'], google: ['Google', 'https://www.google.com/search?q=', 'https://www.google.com/'], bing: ['Bing', 'https://www.bing.com/search?q=', 'https://www.bing.com/'], brave: ['Brave Search', 'https://search.brave.com/search?q=', 'https://search.brave.com/'], startpage: ['Startpage', 'https://www.startpage.com/do/search?q=', 'https://www.startpage.com/'] };
const brDataFile = () => path.join(app.getPath('userData'), 'browser-data.json');
let brData = null;
function brLoad() { if (brData) return brData; try { brData = JSON.parse(fs.readFileSync(brDataFile(), 'utf8')); } catch { brData = {}; } brData.bookmarks = Array.isArray(brData.bookmarks) ? brData.bookmarks : []; brData.history = Array.isArray(brData.history) ? brData.history : []; if (!BR_ENG[brData.engine]) brData.engine = 'duckduckgo'; return brData; }
let brSaveT = null; function brSave() { clearTimeout(brSaveT); brSaveT = setTimeout(() => { try { fs.writeFileSync(brDataFile(), JSON.stringify(brLoad())); } catch {} }, 800); }
function brRecord(wc) { try { const u = wc.getURL(), t = wc.getTitle(); if (!/^https?:/i.test(u)) return; const d = brLoad(); const i = d.history.findIndex((h) => h.url === u); if (i >= 0) d.history.splice(i, 1); d.history.unshift({ url: u, title: t || u, t: Date.now() }); if (d.history.length > 300) d.history.length = 300; brSave(); } catch {} }
const BR_BAR = 76;   // the console's own toolbar at the top (CSS pixels)
const brWc = () => { try { return brView && !brView.webContents.isDestroyed() ? brView.webContents : null; } catch { return null; } };
const brHist = (wc, d) => { try { const h = wc.navigationHistory; if (d === 'canBack') return h ? h.canGoBack() : wc.canGoBack(); if (d === 'canFwd') return h ? h.canGoForward() : wc.canGoForward(); if (d === 'back') return h ? h.goBack() : wc.goBack(); if (d === 'fwd') return h ? h.goForward() : wc.goForward(); } catch {} return false; };
function brBounds() { const b = win.getContentBounds(); let z = 1; try { z = win.webContents.getZoomFactor(); } catch {} const top = Math.round(BR_BAR * z); return { x: 0, y: top, width: b.width, height: Math.max(100, b.height - top) }; }
function brFit() { try { if (brShown && win && brView) brView.setBounds(brBounds()); } catch {} }
function brState() {
  try { const wc = brWc(); if (!wc || !win || win.isDestroyed()) return; win.webContents.send('br:state', { url: wc.getURL(), title: wc.getTitle(), back: !!brHist(wc, 'canBack'), fwd: !!brHist(wc, 'canFwd'), loading: wc.isLoading(), shown: brShown, zoom: Math.round(brZoom * 100), tabs: brTabs.filter((v) => { try { return !v.webContents.isDestroyed(); } catch { return false; } }).map((v) => ({ title: v.webContents.getTitle() || v.webContents.getURL() || 'New tab', url: v.webContents.getURL(), active: v === brView })), marked: brLoad().bookmarks.some((b) => b.url === wc.getURL()), engine: brLoad().engine }); } catch {}
}
function brNorm(input) {
  const q = String(input || '').trim(); if (!q || q.length > 1000) return '';
  if (/^https?:\/\//i.test(q)) return q;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(q)) return 'https://' + q;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/\S*)?$/i.test(q)) return 'http://' + q;
  return BR_ENG[brLoad().engine][1] + encodeURIComponent(q);
}
function brEnsure() {
  const ex = brWc(); if (ex) return brView;
  return brMake();
}
function brMake() {
  const { WebContentsView, session } = require('electron');
  const ses = session.fromPartition('persist:browser');
  try { ses.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + (process.versions.chrome || '130.0.0.0') + ' Safari/537.36'); } catch {}
  const VOICE_OK = /(^|\.)(discord\.com|twitch\.tv)$/i, hostOf = (u) => { try { return new URL(u).hostname; } catch { return ''; } };
  ses.setPermissionRequestHandler((_w, perm, cb, det) => cb(['fullscreen', 'clipboard-sanitized-write'].includes(perm) || (['media', 'notifications'].includes(perm) && VOICE_OK.test(hostOf(det && det.requestingUrl)))));
  ses.setPermissionCheckHandler((_w, perm, origin) => ['fullscreen', 'clipboard-sanitized-write'].includes(perm) || (['media', 'notifications'].includes(perm) && VOICE_OK.test(hostOf(origin))));
  if (!ses.__cnDl) { ses.__cnDl = true; ses.on('will-download', (_e, item) => { try { const f = path.join(app.getPath('downloads'), path.basename(item.getFilename()).replace(/[<>:"/\\|?*\0]/g, '_')); item.setSavePath(f); item.once('done', (_ev, st) => { try { if (win) win.webContents.send('br:note', st === 'completed' ? 'Downloaded ' + path.basename(f) + ' to Downloads.' : 'The download did not finish.'); } catch {} }); } catch {} }); }
  const view = new WebContentsView({ webPreferences: { session: ses, sandbox: true, contextIsolation: true, nodeIntegration: false } }); brTabs.push(view); brView = view;
  const wc = view.webContents;
  wc.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//i.test(url)) wc.loadURL(url).catch(() => {}); return { action: 'deny' }; });   // pop-ups and "new tab" links open in this same page
  wc.on('will-navigate', (e, url) => { if (!/^(https?:|about:blank)/i.test(url)) e.preventDefault(); });
  for (const ev of ['did-navigate', 'did-navigate-in-page', 'page-title-updated', 'did-start-loading', 'did-stop-loading']) wc.on(ev, () => { if (view === brView) brState(); });
  wc.on('did-stop-loading', () => brRecord(wc));
  const CSS = '::-webkit-scrollbar{display:none!important}';
  const FOCUS_JS = "if(!window.__cnTx){window.__cnTx=1;var SEL='input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]):not([type=file]):not([type=image]):not([type=color]),textarea,[contenteditable=true],[contenteditable=\"\"],[role=textbox],[role=searchbox],[role=combobox]';var last=0;var fire=function(t){if(!t||!t.matches||!t.matches(SEL))return;var n=Date.now();if(n<(window.__cnSkip||0))return;if(n-last<600)return;last=n;window.__cnLast=t;var s=t.type==='search'||/search|query|^q$/i.test((t.name||'')+' '+(t.id||'')+' '+(t.placeholder||'')+' '+(t.getAttribute('aria-label')||''))||t.getAttribute('role')==='searchbox'||t.getAttribute('role')==='combobox';var v=t.isContentEditable?(t.textContent||''):(t.value||'');console.log('__cn__osk:'+JSON.stringify({v:String(v).slice(0,2000),p:String(t.placeholder||t.getAttribute('aria-label')||(t.id&&document.querySelector('label[for=\"'+t.id+'\"]')?document.querySelector('label[for=\"'+t.id+'\"]').textContent:'')||(t.previousElementSibling&&t.previousElementSibling.textContent&&t.previousElementSibling.textContent.length<40?t.previousElementSibling.textContent:'')||t.name||'').trim().slice(0,60),s:!!s,pw:t.type==='password',r:(function(){var b=t.getBoundingClientRect(),c=getComputedStyle(t);var bg=c.backgroundColor;if(!bg||bg==='rgba(0, 0, 0, 0)'){var q=t.parentElement;while(q&&(!bg||bg==='rgba(0, 0, 0, 0)')){bg=getComputedStyle(q).backgroundColor;q=q.parentElement;}}return {x:b.left,y:b.top,w:b.width,h:b.height,bg:bg,fg:c.color,fs:c.fontSize,ff:c.fontFamily,pl:c.paddingLeft};})()}));};document.addEventListener('focusin',function(e){fire(e.target);},true);document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('input,textarea,[contenteditable],[role=textbox],[role=searchbox],[role=combobox]'):null;fire(t);},true);}";
  const inject = () => { try { wc.insertCSS(CSS).catch(() => {}); wc.setZoomFactor(brZoom); wc.executeJavaScript(FOCUS_JS).catch(() => {}); } catch {} };
  wc.on('dom-ready', inject); wc.on('did-finish-load', inject); wc.on('did-navigate', () => setTimeout(inject, 300));
  wc.on('console-message', (...a) => { const msg = a[0] && typeof a[0] === 'object' && a[0].message !== undefined ? a[0].message : a[2]; if (typeof msg === 'string' && msg.startsWith('__cn__osk:')) brTextRequest(msg.slice(10)); });
  wc.on('before-input-event', (e, inp) => {
    if (inp.type !== 'keyDown') return;
    if (inp.alt && inp.key === 'ArrowLeft') { e.preventDefault(); if (!brHist(wc, 'canBack')) { try { win.webContents.send('br:note', 'Nothing to go back to.'); } catch {} } else brHist(wc, 'back'); }
    else if (inp.code === 'F13' || inp.key === 'F13') { e.preventDefault(); wc.reload(); }
    else if (inp.code === 'F14' || inp.key === 'F14') { e.preventDefault(); if (brHist(wc, 'canFwd')) brHist(wc, 'fwd'); }
  });
  wc.on('render-process-gone', (_e, d) => { log('browser: page process ended (' + d.reason + ')'); try { if (win) win.webContents.send('br:note', 'The page crashed. Reload it.'); } catch {} });
  wc.on('did-fail-load', (_e, code, desc, url, main) => { if (main && code !== -3) { try { win.webContents.send('br:note', 'Could not open that page (' + desc + ').'); } catch {} } });
  if (!brHooked) { brHooked = true; win.on('resize', brFit); }
  return view;
}
function brBinds(on) { try { const m = loadSettings().mbinds; sendHelper(on ? `binds ${m.left} X NONE ${m.enter} NONE B Y LB RB` : `binds ${m.left} ${m.right} ${m.kbd} ${m.enter} ${m.esc} ${m.back}`); } catch {} }   // A clicks, X right-click, B back, Y page down, LB reload, RB forward, Start = Enter
let brTextBlock = 0;
function brTextRequest(json) {   // a text box was clicked
  if (Date.now() < brTextBlock) { try { log('browser text box ignored (just closed)'); } catch {} return; }
  try { log('browser text box opened: ' + String(json).slice(0, 120).replace(/"v":"[^"]*"/, '"v":"..."')); } catch {}   // page steps aside, console keyboard opens
  try { if (!brShown || !win) return; let o = {}; try { o = JSON.parse(json); } catch {} if (typeof o.v !== 'string') o.v = ''; let shot = '', bb = null; const wc0 = brWc(); const done = () => { try { if (!brShown || !win) return; brHide(); win.webContents.send('br:text', { v: o.v, p: String(o.p || ''), s: !!o.s, pw: !!o.pw, shot, bb, r: o.r || null, z: brZoom }); } catch (e) { log('browser text: ' + e.message); } }; try { bb = brView && brView.getBounds(); wc0.capturePage().then((im) => { shot = im.toDataURL(); done(); }).catch(done); } catch { done(); } return; } catch (e) { log('browser text: ' + e.message); }
}
ipcMain.handle('br:text', (_e, text, submit) => {
  brTextBlock = Date.now() + 2500;
  try {
    const wc = brWc(); if (!wc) return false;
    text = String(text == null ? '' : text); log('browser text applied (' + text.length + ' chars)');
    const js = "(function(t,sub){var e=window.__cnLast||document.activeElement;if(!e)return;window.__cnSkip=Date.now()+2500;try{e.focus();}catch(x){}var set=function(v){if(e.isContentEditable){e.textContent=v;}else{var proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;var d=Object.getOwnPropertyDescriptor(proto,'value');if(d&&d.set)d.set.call(e,v);else e.value=v;}e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};set(t);if(sub){var f=e.form;if(f&&f.requestSubmit){try{f.requestSubmit();return;}catch(x){}}['keydown','keypress','keyup'].forEach(function(k){e.dispatchEvent(new KeyboardEvent(k,{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true}));});}})(" + JSON.stringify(String(text || '').slice(0, 4000)) + "," + (submit ? 'true' : 'false') + ")";
    try { wc.executeJavaScript('window.__cnSkip=Date.now()+2500').catch(() => {}); } catch {}
    brShow('');   // bring the page back first so its inputs are live
    const run = async () => {
      try { wc.focus(); } catch {}
      // 1) focus the remembered box and select its contents
      try { await wc.executeJavaScript("(function(){var e=window.__cnLast||document.activeElement;if(!e)return;window.__cnSkip=Date.now()+2500;try{e.focus();}catch(x){}try{if(e.select)e.select();else document.execCommand('selectAll');}catch(x){}})()"); } catch {}
      // 2) real typing (works with React/Steam inputs); fall back to value setter
      let ok = false;
      try { if (text) { await wc.insertText(text); ok = true; } else { wc.sendInputEvent({ type: 'keyDown', keyCode: 'Backspace' }); wc.sendInputEvent({ type: 'keyUp', keyCode: 'Backspace' }); ok = true; } } catch {}
      try { await wc.executeJavaScript(js); } catch {}
    };
    setTimeout(run, 250);
    return true;
  } catch { return false; }
});
ipcMain.handle('br:resume', () => {
  brTextBlock = Date.now() + 2500;
  try { const wc = brWc(); if (wc) wc.executeJavaScript("window.__cnSkip=Date.now()+2500;try{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}catch(x){}").catch(() => {}); } catch {}
  brShow(''); return true;
});
function brShow(input) {
  if (!win) return { ok: false };
  try {
    const v = brEnsure(), wc = v.webContents, u = input ? brNorm(input) : '';
    if (!brShown) { win.contentView.addChildView(v); brShown = true; mouseState = true; sendHelper('on'); brBinds(true); clearInterval(brMouseT); brMouseT = setInterval(() => { if (!brShown) { clearInterval(brMouseT); return; } mouseState = true; sendHelper('on'); }, 1000); try { win.webContents.executeJavaScript("document.body.classList.add('nofx')").catch(() => {}); } catch {} log('browser: shown (controller is the mouse)'); }
    brFit(); try { wc.setZoomFactor(brZoom); } catch {}
    if (u) wc.loadURL(u).catch((er) => log('browser: ' + er.message)); else if (!wc.getURL()) wc.loadURL(BR_ENG[brLoad().engine][2]).catch(() => {});
    wc.focus(); brState(); return { ok: true };
  } catch (e) { log('browser open: ' + e.message); return { ok: false, error: e.message }; }
}
function brHide() {
  if (!brShown) return; brShown = false; clearInterval(brMouseT);
  try { if (brView && win) win.contentView.removeChildView(brView); } catch {}
  hideOsk(); mouseState = false; sendHelper('off'); brBinds(false);
  try { win.webContents.executeJavaScript("document.body.classList.remove('nofx')").catch(() => {}); } catch {}
  try { win.webContents.focus(); } catch {} brState(); log('browser: hidden (the page stays open)');
}
ipcMain.handle('br:open', (_e, url) => brShow(url));
ipcMain.handle('br:hide', () => { if (loginWatch) { const lw = loginWatch; loginWatch = null; try { lw.cancel(); } catch {} }   // closing the page yourself cancels a sign-in; the page stepping aside for the keyboard does not
  brHide(); return true; });
ipcMain.handle('br:nav', (_e, c) => {
  const wc = brWc(); if (!wc) return false;
  try { if (c === 'back') { if (!brHist(wc, 'canBack')) return false; brHist(wc, 'back'); } else if (c === 'fwd') { if (!brHist(wc, 'canFwd')) return false; brHist(wc, 'fwd'); } else if (c === 'reload') wc.isLoading() ? wc.stop() : wc.reload(); else if (c === 'home') wc.loadURL(BR_ENG[brLoad().engine][2]); else if (c === 'zin' || c === 'zout') { brZoom = Math.max(.5, Math.min(2.5, Math.round((brZoom + (c === 'zin' ? .1 : -.1)) * 10) / 10)); wc.setZoomFactor(brZoom); brState(); } else return false; if (brShown) wc.focus(); return true; } catch { return false; }
});
ipcMain.handle('br:go', (_e, text) => { const wc = brWc(), u = brNorm(text); if (!u) return false; if (!wc) return brShow(u).ok; wc.loadURL(u).catch(() => {}); if (brShown) wc.focus(); return true; });
ipcMain.handle('br:clear', async () => { try { const { session } = require('electron'); const ses = session.fromPartition('persist:browser'); await ses.clearStorageData(); await ses.clearCache(); return true; } catch { return false; } });

// ================= v825 =================
const VERSION = 'v1067';
ipcMain.handle('app:version', () => VERSION);
const psEnv = (f, env, ms = 60000) => new Promise((res) => { try { execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', f], { windowsHide: true, timeout: ms, maxBuffer: 1 << 20, env: { ...process.env, ...env } }, (e, so, se) => { if (e) log('powershell: ' + String(se || e.message).replace(/\s+/g, ' ').slice(0, 200)); res(e ? '' : String(so || '')); }); } catch { res(''); } });

// ---- Bluetooth list, screen modes ----
ipcMain.handle('dev:bt', async () => {
  try {
    const f = psScript('bt-list', "Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -and $_.FriendlyName -notmatch 'Enumerator|Adapter|Radio|Generic|Transport|RFCOMM|Service|Protocol|Microsoft|Intel|Realtek|MediaTek|Qualcomm|Broadcom|Wireless' } | ForEach-Object { [pscustomobject]@{ name = $_.FriendlyName; ok = ($_.Status -eq 'OK') } } | ConvertTo-Json -Compress");
    const o = (await psFile(f, 15000)).trim(); if (!o) return [];
    let j = JSON.parse(o); if (!Array.isArray(j)) j = [j];
    const seen = new Set(); return j.filter((x) => x && x.name && !seen.has(x.name) && seen.add(x.name)).slice(0, 30);
  } catch { return []; }
});
ipcMain.handle('disp:mode', (_e, m) => { try { const ok = { internal: '/internal', extend: '/extend', clone: '/clone', external: '/external' }[String(m)]; if (!ok) return false; execFile(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'DisplaySwitch.exe'), [ok], { windowsHide: true }, () => {}); return true; } catch { return false; } });
ipcMain.handle('disp:info', () => { try { const { screen } = require('electron'); return screen.getAllDisplays().map((d, i) => ({ n: i + 1, w: Math.round(d.size.width * d.scaleFactor), h: Math.round(d.size.height * d.scaleFactor), hz: d.displayFrequency || 0, scale: d.scaleFactor, primary: d.bounds.x === 0 && d.bounds.y === 0, hdr: !!(d.colorSpace && /hdr|pq|2020/i.test(String(d.colorSpace))) })); } catch { return []; } });

// ---- screen recording (the picture and the sound that is playing; saved next to your screenshots) ----
let recFd = null;
ipcMain.handle('rec:source', async () => { try { const { desktopCapturer } = require('electron'), d = homeDisplay(); const src = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 } }); const sc = (d && src.find((x) => String(x.display_id) === String(d.id))) || src[0]; return sc ? sc.id : ''; } catch { return ''; } });
ipcMain.handle('rec:start', () => { try { const t = new Date(), p2 = (n) => String(n).padStart(2, '0'); const name = `Recording ${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())} ${p2(t.getHours())}-${p2(t.getMinutes())}-${p2(t.getSeconds())}.webm`; if (recFd != null) { try { fs.closeSync(recFd); } catch {} } recFd = fs.openSync(path.join(capDir(), name), 'w'); log('recording: started ' + name); return name; } catch (e) { log('recording: ' + e.message); return ''; } });
ipcMain.handle('rec:chunk', (_e, buf) => { try { if (recFd != null && buf) fs.writeSync(recFd, Buffer.from(buf)); return true; } catch { return false; } });
ipcMain.handle('rec:end', () => { try { if (recFd != null) { fs.closeSync(recFd); recFd = null; log('recording: saved'); } return true; } catch { return false; } });

// ---- backup / restore of the console's own settings ----
const BAK_FILES = ['settings.json', 'library.json', 'accounts.json', 'spotify.json'];
const bakDir = () => { const d = path.join(app.getPath('documents'), 'Console backups'); try { fs.mkdirSync(d, { recursive: true }); } catch {} return d; };
ipcMain.handle('bak:list', () => { try { return fs.readdirSync(bakDir()).filter((f) => /^console-backup-[\d-]+\.zip$/.test(f)).map((f) => ({ name: f, size: fs.statSync(path.join(bakDir(), f)).size })).sort((a, b) => b.name.localeCompare(a.name)).slice(0, 12); } catch { return []; } });
ipcMain.handle('bak:make', async () => {
  try {
    const ud = app.getPath('userData'), tmp = path.join(app.getPath('temp'), 'console-bak-' + Date.now()); fs.mkdirSync(tmp, { recursive: true });
    for (const f of BAK_FILES) { try { fs.copyFileSync(path.join(ud, f), path.join(tmp, f)); } catch {} }
    const t = new Date(), p2 = (n) => String(n).padStart(2, '0'), name = `console-backup-${t.getFullYear()}${p2(t.getMonth() + 1)}${p2(t.getDate())}-${p2(t.getHours())}${p2(t.getMinutes())}.zip`;
    const f = psScript('bak-make', "Compress-Archive -Path (Join-Path $env:BAK_SRC '*') -DestinationPath $env:BAK_DST -Force\r\n'ok'");
    const r = (await psEnv(f, { BAK_SRC: tmp, BAK_DST: path.join(bakDir(), name) }, 60000)).trim(); try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
    log('backup: ' + (r === 'ok' ? 'saved ' + name : 'failed')); return r === 'ok' ? { ok: true, name } : { ok: false };
  } catch { return { ok: false }; }
});
ipcMain.handle('bak:restore', async (_e, name) => {
  try {
    if (!/^console-backup-[\d-]+\.zip$/.test(String(name))) return false; const z = path.join(bakDir(), name); if (!fs.existsSync(z)) return false;
    const ud = app.getPath('userData'), tmp = path.join(app.getPath('temp'), 'console-rst-' + Date.now());
    const f = psScript('bak-restore', "Expand-Archive -Path $env:BAK_SRC -DestinationPath $env:BAK_DST -Force\r\n'ok'");
    const r = (await psEnv(f, { BAK_SRC: z, BAK_DST: tmp }, 60000)).trim(); if (r !== 'ok') return false;
    for (const x of BAK_FILES) { const s = path.join(tmp, x); if (fs.existsSync(s)) { try { fs.copyFileSync(path.join(ud, x), path.join(ud, x + '.before-restore')); } catch {} fs.copyFileSync(s, path.join(ud, x)); } }
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
    log('backup: restored ' + name); setTimeout(() => { app.relaunch(); app.exit(0); }, 1200); return true;
  } catch { return false; }
});

// ---- diagnostics ----
const diagLines = (n) => { try { const t = fs.readFileSync(logFile(), 'utf8').split('\n'); return t.filter((l) => l && !/lag: frame|helper: (pad|batt)|finished on the graphics card/.test(l)).slice(-n); } catch { return []; } };
ipcMain.handle('diag:get', () => { try { const os = require('os'); return { version: VERSION, electron: process.versions.electron, os: os.release(), ramGb: Math.round(os.totalmem() / 1073741824), up: Math.round(process.uptime()), lines: diagLines(40).map((l) => l.slice(0, 220)), logPath: logFile() }; } catch { return { version: VERSION, lines: [] }; } });
ipcMain.handle('diag:export', () => { try { const out = path.join(app.getPath('documents'), 'console-diagnostics.txt'); const s = loadSettings(), safe = {}; for (const k of ['theme', 'scale', 'homeStyle', 'motion', 'intro', 'saver', 'fullscreen', 'introEnhance']) safe[k] = s[k]; fs.writeFileSync(out, `Console ${VERSION}\r\nElectron ${process.versions.electron}\r\nSettings ${JSON.stringify(safe)}\r\n\r\n` + diagLines(500).join('\r\n')); shell.showItemInFolder(out); return out; } catch { return ''; } });
ipcMain.handle('diag:openlog', () => { try { shell.showItemInFolder(logFile()); return true; } catch { return false; } });

// ---- update from a downloaded zip (Downloads / Desktop) ----
let updTmp = '';
ipcMain.handle('upd:check', async () => {
  try {
    const cands = []; for (const k of ['downloads', 'desktop']) { try { const d = app.getPath(k); for (const f of fs.readdirSync(d)) if (/^my-console.*\.zip$/i.test(f)) { const p = path.join(d, f); cands.push({ p, t: fs.statSync(p).mtimeMs }); } } catch {} }
    if (!cands.length) return { ok: false, error: 'No my-console zip found in Downloads or Desktop.' };
    cands.sort((a, b) => b.t - a.t); const z = cands[0].p; updTmp = path.join(app.getPath('temp'), 'console-upd-' + Date.now());
    const f = psScript('upd-expand', "Expand-Archive -Path $env:UPD_ZIP -DestinationPath $env:UPD_DST -Force\r\n'ok'");
    if ((await psEnv(f, { UPD_ZIP: z, UPD_DST: updTmp }, 180000)).trim() !== 'ok') return { ok: false, error: 'Could not open that zip.' };
    const mj = path.join(updTmp, 'console', 'main.js'); if (!fs.existsSync(mj)) return { ok: false, error: 'That zip is not a console build.' };
    const m = /const VERSION = '(v\d+)'/.exec(fs.readFileSync(mj, 'utf8')); return { ok: true, zip: path.basename(z), version: m ? m[1] : 'unknown', current: VERSION };
  } catch (e) { return { ok: false, error: 'Could not read the update.' }; }
});
ipcMain.handle('upd:apply', async () => {
  try {
    if (!updTmp || !fs.existsSync(path.join(updTmp, 'console', 'main.js'))) return false;
    const prev = path.join(app.getPath('userData'), 'code-prev'); const rb = (src, dst) => new Promise((res) => execFile('robocopy.exe', [src, dst, '/E', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/XD', 'node_modules'], { windowsHide: true, timeout: 180000 }, (e) => res(!e || (e.code != null && e.code < 8))));
    await rb(__dirname, prev);   // the current version is kept so it can be put back by hand
    if (!(await rb(path.join(updTmp, 'console'), __dirname))) return false;
    log('update: installed ' + VERSION + ' -> new files copied, restarting'); setTimeout(() => { app.relaunch(); app.exit(0); }, 1200); return true;
  } catch { return false; }
});

// ---- v826: copy / move, internet speed ----
ipcMain.handle('fs:paste', async (_e, src, destDir, move) => {
  try {
    if (!goodPath(src) || !goodPath(destDir) || !fs.existsSync(src) || !fs.existsSync(destDir) || path.dirname(src) === src) return { ok: false, error: 'That cannot be copied here.' };
    const st = fs.statSync(src); if (st.isDirectory() && (destDir + path.sep).toLowerCase().startsWith((src + path.sep).toLowerCase())) return { ok: false, error: 'A folder cannot go inside itself.' };
    const ext = st.isDirectory() ? '' : path.extname(src), base = path.basename(src, ext); let to = path.join(destDir, base + ext), i = 2;
    if (move && path.dirname(src).toLowerCase() === destDir.replace(/[\\/]+$/, '').toLowerCase()) return { ok: true, same: true };
    while (fs.existsSync(to)) { to = path.join(destDir, base + ' (' + i + ')' + ext); i++; if (i > 99) return { ok: false, error: 'Too many copies with that name.' }; }
    if (move) { try { fs.renameSync(src, to); return { ok: true }; } catch {} }
    await fs.promises.cp(src, to, { recursive: true, errorOnExist: true });
    if (move) { try { await shell.trashItem(src); } catch { return { ok: true, note: 'Copied, but the original could not be removed.' }; } }
    return { ok: true };
  } catch (e) { return { ok: false, error: 'Could not do that.' }; }
});
ipcMain.handle('net:speed', async () => {
  try {
    const c = new AbortController(), to = setTimeout(() => c.abort(), 14000); let ping = 0;
    try { const t = Date.now(); const r0 = await net.fetch('https://speed.cloudflare.com/__down?bytes=0', { signal: c.signal }); await r0.arrayBuffer(); ping = Date.now() - t; } catch {}
    const t0 = Date.now(); const r = await net.fetch('https://speed.cloudflare.com/__down?bytes=25000000', { signal: c.signal }); const rd = r.body.getReader(); let n = 0;
    for (;;) { const { done, value } = await rd.read(); if (done) break; n += value.length; }
    clearTimeout(to); const s = (Date.now() - t0) / 1000; return { ok: true, down: Math.round(n * 8 / 1e6 / Math.max(.2, s)), ping };
  } catch { return { ok: false }; }
});

// ---- v1065: connection type (LAN / Wi-Fi) and a three-step speed test ----
ipcMain.handle('net:status', async () => {
  try {
    const w = await runNetsh(['wlan', 'show', 'interfaces']); const wc = /^\s*State\s*:\s*connected/mi.test(w.out);
    const ssid = (/^\s*SSID\s*:\s*(.+)$/m.exec(w.out) || [])[1]; const rate = (/Receive rate \(Mbps\)\s*:\s*([\d.]+)/i.exec(w.out) || [])[1];
    const ifs = require('os').networkInterfaces(); let lan = null;
    for (const [name, arr] of Object.entries(ifs)) { if (/vEthernet|VirtualBox|VMware|Bluetooth|Loopback|Hyper-V|WSL|Tailscale|VPN|TAP|Wi-?Fi|Wireless|WLAN/i.test(name)) continue; if ((arr || []).some((a) => a.family === 'IPv4' && !a.internal && !/^169\.254\./.test(a.address))) { lan = name; break; } }
    let speed = '';
    if (lan) { const r = await new Promise((res) => { try { execFile('powershell.exe', ['-NoProfile', '-Command', "(Get-NetAdapter -Name '" + lan.replace(/'/g, '') + "' -ErrorAction SilentlyContinue).LinkSpeed"], { windowsHide: true, timeout: 6000, encoding: 'utf8' }, (e, so) => res(String(so || '').trim())); } catch { res(''); } }); speed = r; }
    const kind = lan ? 'lan' : (wc ? 'wifi' : 'none');
    return { ok: true, kind, name: lan || '', ssid: ssid ? ssid.trim() : '', speed: kind === 'lan' ? speed : (rate ? rate + ' Mbps' : ''), both: !!(lan && wc) };
  } catch { return { ok: false, kind: 'none' }; }
});
ipcMain.handle('net:test', async (_e, phase) => {
  const c = new AbortController(), to = setTimeout(() => c.abort(), 16000);
  try {
    if (phase === 'ping') {
      const ts = []; for (let i = 0; i < 6; i++) { const t = process.hrtime.bigint(); const r = await net.fetch('https://speed.cloudflare.com/__down?bytes=0', { signal: c.signal, cache: 'no-store' }); await r.arrayBuffer(); ts.push(Number(process.hrtime.bigint() - t) / 1e6); }
      ts.shift(); ts.sort((a, b) => a - b); return { ok: true, ping: Math.round(ts[0]), jitter: Math.round(ts[ts.length - 1] - ts[0]) };
    }
    if (phase === 'down') {
      const t0 = Date.now(); const r = await net.fetch('https://speed.cloudflare.com/__down?bytes=40000000', { signal: c.signal, cache: 'no-store' }); const rd = r.body.getReader(); let n = 0;
      for (;;) { const { done, value } = await rd.read(); if (done) break; n += value.length; if (Date.now() - t0 > 9000) { try { c.abort(); } catch {} break; } }
      const s = (Date.now() - t0) / 1000; return { ok: n > 0, down: Math.round(n * 80 / 1e7 / Math.max(.2, s)) / 10 };
    }
    if (phase === 'up') {
      const body = Buffer.alloc(12000000, 97); const t0 = Date.now();
      const r = await net.fetch('https://speed.cloudflare.com/__up', { method: 'POST', body, signal: c.signal, headers: { 'Content-Type': 'application/octet-stream' } }); await r.arrayBuffer();
      const s = (Date.now() - t0) / 1000; return { ok: true, up: Math.round(body.length * 80 / 1e7 / Math.max(.2, s)) / 10 };
    }
    return { ok: false };
  } catch { return { ok: false }; } finally { clearTimeout(to); }
});

// ================= v828: Console Search (results from DuckDuckGo + Wikipedia, shown in the console's own pages) =================
const htmlText = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#x2F;/g, '/').replace(/&hellip;/g, '…').replace(/\s+/g, ' ').trim();
const ddgLink = (h) => { try { h = String(h || '').replace(/&amp;/g, '&'); if (h.startsWith('//')) h = 'https:' + h; const u = new URL(h); if (/duckduckgo\.com$/i.test(u.hostname) && u.pathname === '/l/') { const t = u.searchParams.get('uddg'); return t && /^https?:\/\//i.test(t) ? t : ''; } return /^https?:\/\//i.test(h) && !/duckduckgo\.com/i.test(u.hostname) ? h : ''; } catch { return ''; } };
const parseDdg = (html) => {
  const out = [], seen = new Set();
  const re = /<a\b[^>]*\bclass=["'][^"']*(?:result__a|result-link)[^"']*["'][^>]*>[\s\S]*?<\/a>/gi; let m;
  const snips = [...html.matchAll(/<(?:a|td|div)\b[^>]*class=["'][^"']*(?:result__snippet|result-snippet)[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|td|div)>/gi)].map((x) => htmlText(x[1]));
  let i = 0;
  while ((m = re.exec(html)) && out.length < 14) {
    const tag = m[0], hr = /href=["']([^"']+)["']/i.exec(tag); const url = ddgLink(hr && hr[1]); const title = htmlText(tag);
    if (!url || !title || seen.has(url)) { i++; continue; } seen.add(url);
    let host = ''; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch {}
    out.push({ title: title.slice(0, 140), url, host, snippet: (snips[i] || '').slice(0, 260) }); i++;
  }
  return out;
};
const CHROME_UA = () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + (process.versions.chrome || '130.0.0.0') + ' Safari/537.36';
const wget = async (u, opt = {}, ms = 9000) => { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await net.fetch(u, { ...opt, signal: c.signal, headers: { 'User-Agent': CHROME_UA(), 'Accept-Language': 'en-US,en;q=0.9', ...(opt.headers || {}) } }); return r.ok ? await r.text() : ''; } catch { return ''; } finally { clearTimeout(t); } };
const searchCache = new Map();
ipcMain.handle('search:web', async (_e, q) => {
  try {
    q = String(q || '').trim(); if (q.length < 1 || q.length > 200) return { ok: false, error: 'Type something to search for.' };
    const hit = searchCache.get(q.toLowerCase()); if (hit && Date.now() - hit.t < 600000) return hit.v;
    const enc = encodeURIComponent(q);
    const [ddg, wiki] = await Promise.all([
      (async () => { let r = parseDdg(await wget('https://html.duckduckgo.com/html/?q=' + enc)); if (!r.length) r = parseDdg(await wget('https://lite.duckduckgo.com/lite/?q=' + enc)); return r; })(),
      (async () => {
        try {
          const j = JSON.parse(await wget('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + enc + '&srlimit=1&format=json', {}, 6000) || '{}'); const t = j.query && j.query.search && j.query.search[0] && j.query.search[0].title; if (!t) return null;
          const lq = q.toLowerCase(), lt = t.toLowerCase(); if (!(lq.includes(lt) || lt.includes(lq) || lt.split(/\s+/).every((w) => lq.includes(w)))) return null;
          const s = JSON.parse(await wget('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(t.replace(/ /g, '_')), {}, 6000) || '{}');
          return s.extract ? { title: s.title || t, extract: String(s.extract).slice(0, 420), url: (s.content_urls && s.content_urls.desktop && s.content_urls.desktop.page) || 'https://en.wikipedia.org/wiki/' + encodeURIComponent(t.replace(/ /g, '_')), desc: s.description || '' } : null;
        } catch { return null; }
      })(),
    ]);
    if (!ddg.length && !wiki) { log('search: no results for "' + q.slice(0, 40) + '" (offline, or DuckDuckGo asked for a check)'); return { ok: false, error: 'No results came back. Check the internet connection, or open the page in the browser.' }; }
    const v = { ok: true, q, results: ddg, answer: wiki }; searchCache.set(q.toLowerCase(), { t: Date.now(), v }); if (searchCache.size > 40) searchCache.delete(searchCache.keys().next().value);
    return v;
  } catch (e) { log('search: ' + e.message); return { ok: false, error: 'The search could not run.' }; }
});

// ---- v829: tabs, bookmarks, history, search engine choice ----
function brSwap(view) { try { if (brShown && brView && brView !== view) win.contentView.removeChildView(brView); brView = view; if (brShown) { win.contentView.addChildView(view); brFit(); view.webContents.focus(); } brState(); } catch (e) { log('browser tab: ' + e.message); } }
ipcMain.handle('br:tab', (_e, op, arg) => {
  try {
    const live = () => brTabs.filter((v) => { try { return !v.webContents.isDestroyed(); } catch { return false; } });
    if (op === 'new') { const prev = brView; const v = brMake(); brView = prev; brSwap(v); const u = arg ? brNorm(arg) : ''; if (u) v.webContents.loadURL(u).catch(() => {}); return true; }
    const L = live(); if (op === 'go') { const v = L[Number(arg)]; if (!v) return false; brSwap(v); return true; }
    if (op === 'close') { const i = Number(arg), v = L[i]; if (!v) return false; const wasActive = v === brView; try { if (wasActive && brShown) win.contentView.removeChildView(v); } catch {} brTabs.splice(brTabs.indexOf(v), 1); try { v.webContents.close(); } catch {} if (wasActive) { const n = live(); if (n.length) { brView = null; brSwap(n[Math.min(i, n.length - 1)]); } else { brView = null; brState(); } } else brState(); return true; }
  } catch (e) { log('browser tab: ' + e.message); } return false;
});
ipcMain.handle('br:data', () => { const d = brLoad(); return { bookmarks: d.bookmarks, history: d.history.slice(0, 40), engine: d.engine, engines: Object.fromEntries(Object.entries(BR_ENG).map(([k, v]) => [k, v[0]])) }; });
ipcMain.handle('br:bm', (_e, op, arg) => {
  const d = brLoad(), wc = brWc();
  if (op === 'toggle') { if (!wc) return false; const u = wc.getURL(); if (!/^https?:/i.test(u)) return false; const i = d.bookmarks.findIndex((b) => b.url === u); if (i >= 0) d.bookmarks.splice(i, 1); else d.bookmarks.unshift({ url: u, title: (wc.getTitle() || u).slice(0, 80) }); brSave(); brState(); return i < 0; }
  if (op === 'remove') { d.bookmarks.splice(Number(arg), 1); brSave(); brState(); return true; }
  if (op === 'engine') { if (BR_ENG[arg]) { d.engine = arg; brSave(); brState(); return true; } return false; }
  if (op === 'clearhist') { d.history = []; brSave(); return true; }
  return false;
});

// ================= v832: storage manager sizes, family screen time =================
const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const dayFile = () => path.join(app.getPath('userData'), 'playdays.json');
let dayData = null;
function dayLoad() { if (dayData) return dayData; try { dayData = JSON.parse(fs.readFileSync(dayFile(), 'utf8')); } catch { dayData = {}; } if (!dayData.days || typeof dayData.days !== 'object') dayData.days = {}; dayData.limit = Number.isFinite(dayData.limit) ? dayData.limit : 0; return dayData; }
function daySave() { try { fs.writeFileSync(dayFile(), JSON.stringify(dayData)); } catch {} }
function addPlayDay(secs) { if (!(secs > 0)) return; const d = dayLoad(), k = dayKey(); d.days[k] = (d.days[k] || 0) + secs; const keys = Object.keys(d.days).sort(); while (keys.length > 60) delete d.days[keys.shift()]; daySave(); }
const liveSecs = () => (running && running.seen ? Math.round((Date.now() - running.t0) / 1000) : 0);
ipcMain.handle('fam:get', () => {
  const d = dayLoad(), out = [];
  for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); const k = dayKey(dt); out.push({ d: k, sec: (d.days[k] || 0) + (i === 0 ? liveSecs() : 0), dow: dt.getDay() }); }
  return { days: out, limit: d.limit, playing: running && running.seen ? running.title : '' };
});
ipcMain.handle('fam:limit', (_e, mins) => { const d = dayLoad(); mins = Math.max(0, Math.min(720, Math.round(Number(mins) || 0))); d.limit = mins; daySave(); famWarned = {}; return mins; });
let famWarned = {};
setInterval(() => {   // a gentle reminder (a Windows notification) 5 minutes before the daily limit and when it is reached; it never closes a game
  try {
    if (!running || !running.seen) return; const d = dayLoad(); if (!d.limit) return;
    const k = dayKey(), left = d.limit * 60 - ((d.days[k] || 0) + liveSecs()); const { Notification } = require('electron');
    if (left <= 0 && famWarned[k] !== 2) { famWarned[k] = 2; new Notification({ title: 'Play time is up', body: 'You have used today’s ' + d.limit + ' minutes.' }).show(); }
    else if (left <= 300 && left > 0 && !famWarned[k]) { famWarned[k] = 1; new Notification({ title: '5 minutes left', body: 'Today’s play time is almost used up.' }).show(); }
  } catch {}
}, 30000);
const sizeCache = new Map();
async function dirSize(p, deadline) {
  let total = 0; const stack = [p];
  while (stack.length) {
    if (Date.now() > deadline) return { bytes: total, partial: true };
    const d = stack.pop(); let ents; try { ents = await fs.promises.readdir(d, { withFileTypes: true }); } catch { continue; }
    await Promise.all(ents.map(async (e) => { const f = path.join(d, e.name); if (e.isDirectory()) stack.push(f); else if (e.isFile()) { try { total += (await fs.promises.stat(f)).size; } catch {} } }));
  }
  return { bytes: total };
}
function steamSize(g) {   // what Steam itself reports for the game (its appmanifest), which is the number you see in Steam
  try {
    if (!g.steamId || !g.folder) return null; const f = path.join(path.resolve(g.folder, '..', '..'), 'appmanifest_' + g.steamId + '.acf'); const t = fs.readFileSync(f, 'utf8');
    const sz = /"SizeOnDisk"\s+"(\d+)"/.exec(t), fl = /"StateFlags"\s+"(\d+)"/.exec(t); if (!sz) return null;
    const flags = fl ? Number(fl[1]) : 4; return { bytes: Number(sz[1]), note: flags === 4 ? '' : 'Not fully installed or updating' };
  } catch { return null; }
}
let epicMap = null, epicAt = 0;
function epicSize(g) {   // Epic's own install manifests list the real install size
  try {
    if (!epicMap || Date.now() - epicAt > 600000) {
      epicMap = new Map(); epicAt = Date.now(); const dir = path.join(process.env.ProgramData || 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests');
      for (const n of fs.readdirSync(dir)) { if (!/\.item$/i.test(n)) continue; try { const j = JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')); if (j.InstallLocation && j.InstallSize) epicMap.set(path.resolve(j.InstallLocation).toLowerCase(), Number(j.InstallSize)); } catch {} }
    }
    const v = g.folder ? epicMap.get(path.resolve(g.folder).toLowerCase()) : 0; return v ? { bytes: v, note: '' } : null;
  } catch { return null; }
}
ipcMain.handle('store:sizes', async () => {
  try {
    const out = [], deadline = Date.now() + 60000;
    for (const g of loadLib().games.filter((x) => x.installed !== false)) {
      const f = gameFolder(g); if (!f) continue; const gg = { ...g, folder: f };
      const known = steamSize(gg) || epicSize(gg);
      if (known) { out.push({ id: g.id, title: g.title, bytes: known.bytes, note: known.note, partial: false }); continue; }
      const c = sizeCache.get(f); let r;
      if (c && Date.now() - c.t < 600000) r = c.v; else { r = await dirSize(f, deadline); if (!r.partial) sizeCache.set(f, { t: Date.now(), v: r }); }
      out.push({ id: g.id, title: g.title, bytes: r.bytes, note: '', partial: !!r.partial });
    }
    return out.sort((a, b) => b.bytes - a.bytes);
  } catch (e) { log('storage sizes: ' + e.message); return []; }
});

// ================= v834: Get apps (winget) and Wi-Fi, so the Windows desktop is not needed =================
const wingetRun = (args, ms) => new Promise((res) => { try { execFile('winget.exe', args, { windowsHide: true, timeout: ms, maxBuffer: 8 << 20, encoding: 'utf8' }, (e, so, se) => res({ ok: !e, out: String(so || ''), err: String(se || '') + (e && e.killed ? ' (timed out)' : ''), code: e ? e.code : 0 })); } catch (e) { res({ ok: false, out: '', err: e.message }); } });
const WG_ID = /^[A-Za-z0-9][A-Za-z0-9.\-+_]{1,90}$/;
function parseWinget(out) {
  const L = String(out || '').replace(/\r/g, '').split('\n'); const hi = L.findIndex((l) => /^\s*Name\s+Id\s+Version/.test(l)); if (hi < 0) return [];
  const h = L[hi], iId = h.indexOf('Id'), iVer = h.indexOf('Version'), rows = [];
  for (const l of L.slice(hi + 2)) { if (!l.trim() || l.length < iVer) continue; const name = l.slice(0, iId).trim(), id = l.slice(iId, iVer).trim(); if (name && WG_ID.test(id)) rows.push({ name, id, ver: l.slice(iVer).trim().split(/\s+/)[0] || '' }); if (rows.length >= 30) break; }
  return rows;
}
ipcMain.handle('wg:search', async (_e, q) => {
  q = String(q || '').trim().slice(0, 60); if (q.length < 2) return { ok: false, error: 'Type at least 2 letters.' };
  const r = await wingetRun(['search', '--source', 'winget', '--accept-source-agreements', '--disable-interactivity', '--count', '25', q], 60000);
  if (!r.ok && !r.out) return { ok: false, error: 'Windows Package Manager (winget) is not available on this PC.' };
  return { ok: true, items: parseWinget(r.out) };
});
ipcMain.handle('wg:install', async (_e, id) => {
  if (!WG_ID.test(String(id))) return { ok: false, error: 'Bad id.' }; log('apps: installing ' + id);
  const r = await wingetRun(['install', '--id', String(id), '-e', '--source', 'winget', '--silent', '--accept-package-agreements', '--accept-source-agreements', '--disable-interactivity'], 1200000);
  log('apps: install ' + id + ' -> ' + (r.ok ? 'ok' : 'failed ' + r.code)); return { ok: r.ok, error: r.ok ? '' : (/already installed/i.test(r.out) ? 'Already installed.' : 'The install did not finish.') };
});
ipcMain.handle('wg:uninstall', async (_e, id) => {
  if (!WG_ID.test(String(id))) return { ok: false, error: 'Bad id.' }; log('apps: uninstalling ' + id);
  const r = await wingetRun(['uninstall', '--id', String(id), '-e', '--silent', '--accept-source-agreements', '--disable-interactivity'], 600000);
  return { ok: r.ok, error: r.ok ? '' : 'The uninstall did not finish.' };
});
ipcMain.handle('wg:list', async () => {
  const r = await wingetRun(['list', '--accept-source-agreements', '--disable-interactivity'], 90000);
  const items = parseWinget(r.out).filter((x) => !/^(MSIX|ARP)\\/.test(x.id)); return { ok: r.ok || !!r.out, items: items.slice(0, 30) };
});
const xmlEsc = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
const runNetsh = (args) => new Promise((res) => { try { execFile('netsh.exe', args, { windowsHide: true, timeout: 25000, maxBuffer: 1 << 20, encoding: 'utf8' }, (e, so) => res({ ok: !e, out: String(so || '') })); } catch { res({ ok: false, out: '' }); } });
ipcMain.handle('wifi:list', async () => {
  const [a, c] = await Promise.all([runNetsh(['wlan', 'show', 'networks', 'mode=bssid']), runNetsh(['wlan', 'show', 'interfaces'])]);
  const cur = /^\s*SSID\s*:\s*(.+)$/m.exec(c.out); const nets = new Map();
  let ssid = '', auth = '';
  for (const l of a.out.split(/\r?\n/)) {
    let mm; if ((mm = /^SSID \d+ : (.*)$/.exec(l))) { ssid = mm[1].trim(); auth = ''; if (ssid && !nets.has(ssid)) nets.set(ssid, { ssid, open: false, sig: 0 }); }
    else if ((mm = /Authentication\s*:\s*(.+)$/.exec(l)) && ssid && nets.has(ssid)) nets.get(ssid).open = /^open$/i.test(mm[1].trim());
    else if ((mm = /Signal\s*:\s*(\d+)%/.exec(l)) && ssid && nets.has(ssid)) nets.get(ssid).sig = Math.max(nets.get(ssid).sig, Number(mm[1]));
  }
  return { ok: a.ok || nets.size > 0, current: cur ? cur[1].trim() : '', nets: [...nets.values()].sort((x, y) => y.sig - x.sig).slice(0, 25) };
});
ipcMain.handle('wifi:connect', async (_e, ssid, pass) => {
  try {
    ssid = String(ssid || '').slice(0, 32); pass = String(pass || ''); if (!ssid) return { ok: false, error: 'No network.' };
    const have = await runNetsh(['wlan', 'show', 'profiles']);
    const known = have.out.split(/\r?\n/).some((l) => /:\s*(.+)$/.exec(l) && l.split(':').slice(1).join(':').trim() === ssid);
    if (pass || !known) {
      const sec = pass ? `<authEncryption><authentication>WPA2PSK</authentication><encryption>AES</encryption><useOneX>false</useOneX></authEncryption><sharedKey><keyType>passPhrase</keyType><protected>false</protected><keyMaterial>${xmlEsc(pass)}</keyMaterial></sharedKey>` : `<authEncryption><authentication>open</authentication><encryption>none</encryption><useOneX>false</useOneX></authEncryption>`;
      const xml = `<?xml version="1.0"?><WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1"><name>${xmlEsc(ssid)}</name><SSIDConfig><SSID><name>${xmlEsc(ssid)}</name></SSID></SSIDConfig><connectionType>ESS</connectionType><connectionMode>auto</connectionMode><MSM><security>${sec}</security></MSM></WLANProfile>`;
      const f = path.join(app.getPath('userData'), 'wifi-profile.xml'); fs.writeFileSync(f, xml);
      try { await runNetsh(['wlan', 'add', 'profile', 'filename=' + f]); } finally { try { fs.unlinkSync(f); } catch {} }
    }
    const r = await runNetsh(['wlan', 'connect', 'name=' + ssid]); log('wifi: connect ' + ssid.slice(0, 3) + '*** -> ' + (r.ok ? 'asked' : 'failed')); return { ok: r.ok, error: r.ok ? '' : 'Could not start the connection.' };
  } catch (e) { return { ok: false, error: 'Could not connect.' }; }
});

// ================= v835: clean up, Windows Update check =================
async function tmpScan(del) {
  const dir = require('os').tmpdir(); let bytes = 0, n = 0; const cut = Date.now() - 86400000; const t0 = Date.now();
  const walk = async (d, depth) => {
    if (Date.now() - t0 > 20000) return; let ents; try { ents = await fs.promises.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const f = path.join(d, e.name);
      try {
        if (e.isDirectory()) { if (depth < 6) await walk(f, depth + 1); if (del) { try { await fs.promises.rmdir(f); } catch {} } }
        else if (e.isFile()) { const st = await fs.promises.stat(f); if (st.mtimeMs < cut && st.atimeMs < cut) { bytes += st.size; n++; if (del) { try { await fs.promises.unlink(f); } catch { bytes -= st.size; n--; } } } }
      } catch {}
    }
  };
  await walk(dir, 0); return { bytes, files: n };
}
ipcMain.handle('clean:scan', async () => { try { return { ok: true, ...(await tmpScan(false)) }; } catch { return { ok: false }; } });
ipcMain.handle('clean:run', async () => { try { const r = await tmpScan(true); log('cleanup: removed ' + r.files + ' old temp files'); return { ok: true, ...r }; } catch { return { ok: false }; } });
ipcMain.handle('wu:check', async () => {
  try {
    const f = psScript('wu-check', "$s=New-Object -ComObject Microsoft.Update.Session\r\n$r=$s.CreateUpdateSearcher().Search(\"IsInstalled=0 and IsHidden=0\")\r\n$o=@(); foreach($u in $r.Updates){ $o += $u.Title }\r\n($o | ConvertTo-Json -Compress)\r\nif($o.Count -eq 0){'[]'}");
    const out = (await psFile(f, 120000)).trim().split(/\r?\n/).filter(Boolean)[0] || '[]'; let j; try { j = JSON.parse(out); } catch { return { ok: false }; }
    return { ok: true, items: (Array.isArray(j) ? j : [j]).filter((x) => typeof x === 'string').slice(0, 25) };
  } catch (e) { log('wu: ' + e.message); return { ok: false }; }
});
ipcMain.handle('wu:start', () => { try { const c = spawn('UsoClient.exe', ['StartInteractiveScan'], { detached: true, stdio: 'ignore', windowsHide: true }); c.on('error', () => {}); c.unref(); shell.openExternal('ms-settings:windowsupdate'); placeOnHomeScreen(); setMouse(true, true, 3500); return true; } catch { return false; } });

// ---- v840: reset console settings (keeps games and files; the old settings are saved beside it) ----
ipcMain.handle('sys:reset', () => {
  try {
    const f = path.join(app.getPath('userData'), 'settings.json'); if (fs.existsSync(f)) fs.copyFileSync(f, path.join(app.getPath('userData'), 'settings.before-reset.json'));
    try { fs.unlinkSync(f); } catch {} try { fs.unlinkSync(f + '.bak'); } catch {}
    settingsFrozen = true; log('settings reset by the user'); setTimeout(() => { app.relaunch(); app.exit(0); }, 400); return true;
  } catch (e) { log('reset: ' + e.message); return false; }
});

// ---- v847: screen resolution / refresh rate and sleep timers, changed inside the console (no Windows Settings window) ----
const DM_CS = `using System;using System.Runtime.InteropServices;using System.Text;
[StructLayout(LayoutKind.Sequential,CharSet=CharSet.Ansi)] public struct DEVMODE{
 [MarshalAs(UnmanagedType.ByValTStr,SizeConst=32)] public string dmDeviceName;
 public short dmSpecVersion,dmDriverVersion,dmSize,dmDriverExtra; public int dmFields; public int dmPositionX,dmPositionY,dmDisplayOrientation,dmDisplayFixedOutput;
 public short dmColor,dmDuplex,dmYResolution,dmTTOption,dmCollate;
 [MarshalAs(UnmanagedType.ByValTStr,SizeConst=32)] public string dmFormName;
 public short dmLogPixels; public int dmBitsPerPel,dmPelsWidth,dmPelsHeight,dmDisplayFlags,dmDisplayFrequency,dmICMMethod,dmICMIntent,dmMediaType,dmDitherType,dmReserved1,dmReserved2,dmPanningWidth,dmPanningHeight;}
[StructLayout(LayoutKind.Sequential,CharSet=CharSet.Ansi)] public struct DDEV{public int cb;[MarshalAs(UnmanagedType.ByValTStr,SizeConst=32)] public string DeviceName;[MarshalAs(UnmanagedType.ByValTStr,SizeConst=128)] public string DeviceString;public int StateFlags;[MarshalAs(UnmanagedType.ByValTStr,SizeConst=128)] public string DeviceID;[MarshalAs(UnmanagedType.ByValTStr,SizeConst=128)] public string DeviceKey;}
public static class Dm{
 [DllImport("user32.dll",CharSet=CharSet.Ansi)] static extern bool EnumDisplayDevicesA(string d,int i,ref DDEV dd,int f);
 [DllImport("user32.dll",CharSet=CharSet.Ansi)] static extern bool EnumDisplaySettingsA(string d,int m,ref DEVMODE dm);
 [DllImport("user32.dll",CharSet=CharSet.Ansi)] static extern int ChangeDisplaySettingsExA(string d,ref DEVMODE dm,IntPtr h,int f,IntPtr p);
 public static string List(){var sb=new StringBuilder();for(int i=0;i<16;i++){var dd=new DDEV();dd.cb=Marshal.SizeOf(dd);if(!EnumDisplayDevicesA(null,i,ref dd,0))break;if((dd.StateFlags&1)==0)continue;
  var cur=new DEVMODE();cur.dmSize=(short)Marshal.SizeOf(cur);if(!EnumDisplaySettingsA(dd.DeviceName,-1,ref cur))continue;
  sb.AppendLine("dev|"+dd.DeviceName+"|"+((dd.StateFlags&4)!=0?1:0)+"|"+cur.dmPelsWidth+"|"+cur.dmPelsHeight+"|"+cur.dmDisplayFrequency);
  var seen=new System.Collections.Generic.HashSet<string>();for(int m=0;m<2000;m++){var dm=new DEVMODE();dm.dmSize=(short)Marshal.SizeOf(dm);if(!EnumDisplaySettingsA(dd.DeviceName,m,ref dm))break;
   if(dm.dmBitsPerPel!=32||dm.dmPelsWidth<1024||dm.dmDisplayFrequency<30||dm.dmDisplayOrientation!=cur.dmDisplayOrientation)continue;var k=dm.dmPelsWidth+"|"+dm.dmPelsHeight+"|"+dm.dmDisplayFrequency;if(seen.Add(k))sb.AppendLine("mode|"+k);}}
  return sb.ToString();}
 public static int Set(string dev,int w,int h,int hz){var dm=new DEVMODE();dm.dmSize=(short)Marshal.SizeOf(dm);if(!EnumDisplaySettingsA(dev,-1,ref dm))return -100;dm.dmPelsWidth=w;dm.dmPelsHeight=h;dm.dmDisplayFrequency=hz;dm.dmFields=0x80000|0x100000|0x400000;
  int t=ChangeDisplaySettingsExA(dev,ref dm,IntPtr.Zero,2,IntPtr.Zero);if(t!=0)return t;return ChangeDisplaySettingsExA(dev,ref dm,IntPtr.Zero,1,IntPtr.Zero);}
}`;
ipcMain.handle('disp:modes', async () => {
  try {
    const f = psScript('disp-modes', "Add-Type -TypeDefinition @'\r\n" + DM_CS + "\r\n'@\r\n[Dm]::List()");
    const out = String(await psFile(f, 20000)); const devs = []; let cur = null;
    for (const ln of out.split(/\r?\n/)) {
      const p = ln.trim().split('|');
      if (p[0] === 'dev') { cur = { dev: p[1], primary: p[2] === '1', w: +p[3], h: +p[4], hz: +p[5], modes: [] }; devs.push(cur); }
      else if (p[0] === 'mode' && cur) cur.modes.push({ w: +p[1], h: +p[2], hz: +p[3] });
    }
    for (const d of devs) d.modes.sort((a, b) => b.w - a.w || b.h - a.h || b.hz - a.hz);
    return devs;
  } catch { return []; }
});
ipcMain.handle('disp:set', async (_e, dev, w, h, hz) => {
  try {
    if (!/^\\\\\.\\DISPLAY\d{1,2}$/.test(String(dev)) || ![w, h, hz].every((n) => Number.isInteger(n) && n > 0 && n < 20000)) return false;
    const f = psScript('disp-set', "Add-Type -TypeDefinition @'\r\n" + DM_CS + "\r\n'@\r\n[Dm]::Set('" + dev + "'," + w + "," + h + "," + hz + ")");
    return String(await psFile(f, 20000)).trim() === '0';
  } catch { return false; }
});
const SLEEP_KEYS = { screen: ['SUB_VIDEO', 'VIDEOIDLE', 'monitor-timeout'], sleep: ['SUB_SLEEP', 'STANDBYIDLE', 'standby-timeout'] };
ipcMain.handle('sleep:get', async () => {
  try {
    const out = {};
    for (const [k, [sub, set]] of Object.entries(SLEEP_KEYS)) {
      const o = await new Promise((res) => execFile('powercfg.exe', ['/q', 'SCHEME_CURRENT', sub, set], { windowsHide: true, timeout: 6000 }, (e, so) => res(e ? '' : String(so))));
      const ac = /Current AC Power Setting Index:\s*0x([0-9a-f]+)/i.exec(o); out[k] = ac ? Math.round(parseInt(ac[1], 16) / 60) : -1;
    }
    return out;
  } catch { return { screen: -1, sleep: -1 }; }
});
ipcMain.handle('sleep:set', async (_e, which, minutes) => {
  try {
    const k = SLEEP_KEYS[String(which)]; if (!k || !Number.isInteger(minutes) || minutes < 0 || minutes > 1440) return false;
    return await new Promise((res) => execFile('powercfg.exe', ['/change', k[2] + '-ac', String(minutes)], { windowsHide: true, timeout: 6000 }, (e) => res(!e)));
  } catch { return false; }
});


// ---- v848: microphone, Bluetooth pairing and HDR, all inside the console ----
ipcMain.handle('aud:listin', async () => { try { const j = JSON.parse((await psFile(audScript('[Aud]::ListF(1)'), 25000)).trim()); return Array.isArray(j) ? j : []; } catch { return []; } });
ipcMain.handle('mic:get', async () => { try { const o = (await psFile(volScript('[VolCtl]::GetF(1)'))).trim().split(/\s+/); return o.length >= 2 && Number.isFinite(Number(o[0])) ? { ok: true, vol: Number(o[0]), mute: o[1] === '1' } : { ok: false }; } catch { return { ok: false }; } });
ipcMain.handle('mic:set', async (_e, v, m) => { try { const n = Math.max(0, Math.min(100, Math.round(Number(v)))); if (!Number.isFinite(n)) return { ok: false }; await psFile(volScript('[VolCtl]::SetF(1,[single]' + (n / 100).toFixed(2) + ',$' + (m ? 'true' : 'false') + ')')); return { ok: true, vol: n, mute: !!m }; } catch { return { ok: false }; } });
const BT_HEAD = "Add-Type -AssemblyName System.Runtime.WindowsRuntime\r\n$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]\r\nfunction Await($op, $type) { $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op)); [void]$t.Wait(-1); $t.Result }\r\n[void][Windows.Devices.Enumeration.DeviceInformation, Windows.Devices.Enumeration, ContentType = WindowsRuntime]\r\n$props = @('System.Devices.Aep.IsPaired', 'System.Devices.Aep.IsConnected', 'System.Devices.Aep.CanPair')\r\n$kind = [Windows.Devices.Enumeration.DeviceInformationKind]::AssociationEndpoint\r\n";
const BT_SEL = "'System.Devices.Aep.ProtocolId:=\"{e0cbf06c-cd8b-4647-bb8a-263b43f0f974}\" OR System.Devices.Aep.ProtocolId:=\"{bb7bb05e-5972-42b5-94fc-76eaa7084d49}\"'";
const BT_ID = /^[\w#&:.\-{}]{5,220}$/;
ipcMain.handle('bt:scan', async () => {
  try {
    const f = psScript('bt-scan', BT_HEAD + "$col = Await ([Windows.Devices.Enumeration.DeviceInformation]::FindAllAsync(" + BT_SEL + ", $props, $kind)) ([Windows.Devices.Enumeration.DeviceInformationCollection])\r\n$o = foreach ($d in $col) { if ($d.Name) { [pscustomobject]@{ id = $d.Id; name = $d.Name; paired = [bool]$d.Pairing.IsPaired; connected = [bool]$d.Properties['System.Devices.Aep.IsConnected']; can = [bool]$d.Pairing.CanPair } } }\r\nif ($o) { ConvertTo-Json -Compress -InputObject @($o) } else { '[]' }");
    const j = JSON.parse((await psFile(f, 40000)).trim() || '[]'); return Array.isArray(j) ? j.filter((x) => x && BT_ID.test(String(x.id))).slice(0, 40) : [];
  } catch (e) { log('bt scan: ' + e.message); return []; }
});
ipcMain.handle('bt:act', async (_e, id, what) => {
  try {
    if (!BT_ID.test(String(id)) || !['pair', 'unpair'].includes(what)) return { ok: false, status: 'Bad request' };
    const call = what === 'pair' ? '$di.Pairing.PairAsync()) ([Windows.Devices.Enumeration.DevicePairingResult])' : '$di.Pairing.UnpairAsync()) ([Windows.Devices.Enumeration.DeviceUnpairingResult])';
    const f = psScript('bt-act', BT_HEAD + "$di = Await ([Windows.Devices.Enumeration.DeviceInformation]::CreateFromIdAsync('" + id + "', $props, $kind)) ([Windows.Devices.Enumeration.DeviceInformation])\r\n$r = Await (" + call + "\r\n[string]$r.Status");
    const st = (await psFile(f, 60000)).trim(); return { ok: /^(Paired|AlreadyPaired|Unpaired|AlreadyUnpaired)$/i.test(st) || st === 'Paired', status: st || 'No answer' };
  } catch { return { ok: false, status: 'Failed' }; }
});
const HDR_CS = `using System;using System.Runtime.InteropServices;using System.Text;
[StructLayout(LayoutKind.Sequential)] public struct HG{public int type;public uint size;public uint aLow;public int aHigh;public uint id;public uint value;public uint enc;public uint bits;}
[StructLayout(LayoutKind.Sequential)] public struct HS{public int type;public uint size;public uint aLow;public int aHigh;public uint id;public uint enable;}
[StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] public struct SN{public int type;public uint size;public uint aLow;public int aHigh;public uint id;[MarshalAs(UnmanagedType.ByValTStr,SizeConst=32)] public string name;}
public static class Hdr{
 [DllImport("user32.dll")] static extern int GetDisplayConfigBufferSizes(uint f,out uint p,out uint m);
 [DllImport("user32.dll")] static extern int QueryDisplayConfig(uint f,ref uint p,IntPtr paths,ref uint m,IntPtr modes,IntPtr t);
 [DllImport("user32.dll",EntryPoint="DisplayConfigGetDeviceInfo")] static extern int GetHG(ref HG h);
 [DllImport("user32.dll",EntryPoint="DisplayConfigGetDeviceInfo")] static extern int GetSN(ref SN h);
 [DllImport("user32.dll",EntryPoint="DisplayConfigSetDeviceInfo")] static extern int SetHS(ref HS h);
 public static string List(string only,int set){var sb=new StringBuilder();uint pc,mc;if(GetDisplayConfigBufferSizes(2,out pc,out mc)!=0)return "";
  IntPtr P=Marshal.AllocHGlobal((int)pc*72),M=Marshal.AllocHGlobal((int)mc*64);if(QueryDisplayConfig(2,ref pc,P,ref mc,M,IntPtr.Zero)!=0)return "";
  for(int i=0;i<pc;i++){int o=i*72;uint sLow=(uint)Marshal.ReadInt32(P,o),sId=(uint)Marshal.ReadInt32(P,o+8);int sHigh=Marshal.ReadInt32(P,o+4);uint tLow=(uint)Marshal.ReadInt32(P,o+20),tId=(uint)Marshal.ReadInt32(P,o+28);int tHigh=Marshal.ReadInt32(P,o+24);
   var sn=new SN();sn.type=2;sn.size=(uint)Marshal.SizeOf(sn);sn.aLow=sLow;sn.aHigh=sHigh;sn.id=sId;if(GetSN(ref sn)!=0)continue;
   var g=new HG();g.type=9;g.size=(uint)Marshal.SizeOf(g);g.aLow=tLow;g.aHigh=tHigh;g.id=tId;if(GetHG(ref g)!=0)continue;
   bool sup=(g.value&1)!=0,en=(g.value&2)!=0;
   if(only!=null&&only==sn.name){var s=new HS();s.type=10;s.size=(uint)Marshal.SizeOf(s);s.aLow=tLow;s.aHigh=tHigh;s.id=tId;s.enable=(uint)set;return SetHS(ref s)==0?"ok":"fail";}
   sb.AppendLine(sn.name+"|"+(sup?1:0)+"|"+(en?1:0));}
  return sb.ToString();}
}`;
const hdrScript = (body) => psScript('hdr', "$src=@'\r\n" + HDR_CS + "\r\n'@\r\nAdd-Type -TypeDefinition $src\r\n" + body);
ipcMain.handle('hdr:list', async () => { try { return String(await psFile(hdrScript('[Hdr]::List($null,0)'), 15000)).split(/\r?\n/).map((l) => l.trim().split('|')).filter((p) => p.length === 3).map((p) => ({ dev: p[0], supported: p[1] === '1', on: p[2] === '1' })); } catch { return []; } });
ipcMain.handle('hdr:set', async (_e, dev, on) => { try { if (!/^\\\\\.\\DISPLAY\d{1,2}$/.test(String(dev))) return false; return String(await psFile(hdrScript("[Hdr]::List('" + dev + "'," + (on ? 1 : 0) + ")"), 15000)).trim() === 'ok'; } catch { return false; } });

// ---- v849: text files open inside the console, time zone ----
ipcMain.handle('fs:text', async (_e, p) => { try { if (!goodPath(p) || mediaKind(p) !== 'text') return null; const st = await fs.promises.stat(p); const fh = await fs.promises.open(p, 'r'); try { const b = Buffer.alloc(Math.min(st.size, 300000)); await fh.read(b, 0, b.length, 0); return { text: b.toString('utf8'), cut: st.size > b.length }; } finally { await fh.close(); } } catch { return null; } });
ipcMain.handle('tz:get', async () => { try { const f = psScript('tz-get', "$c = (Get-TimeZone).Id\r\n$l = Get-TimeZone -ListAvailable | ForEach-Object { [pscustomobject]@{ id = $_.Id; name = $_.DisplayName; off = $_.BaseUtcOffset.TotalMinutes } }\r\n[pscustomobject]@{ cur = $c; list = @($l) } | ConvertTo-Json -Compress -Depth 4"); const j = JSON.parse((await psFile(f, 20000)).trim()); return j && j.cur ? { cur: j.cur, list: (Array.isArray(j.list) ? j.list : [j.list]).filter((x) => x && x.id).sort((a, b) => a.off - b.off || String(a.name).localeCompare(String(b.name))) } : null; } catch { return null; } });
ipcMain.handle('tz:set', async (_e, id) => { try { if (!/^[A-Za-z0-9 .,()&'+\-]{2,60}$/.test(String(id))) return false; const f = psScript('tz-set', "Set-TimeZone -Id '" + String(id).replace(/'/g, "''") + "'\r\n'ok'"); return (await psFile(f, 15000)).trim() === 'ok'; } catch { return false; } });


// ---- v852: Modrinth (Minecraft mods, resource packs, shaders) inside the console ----
const MR_UA = 'frankies-console/1.0 (personal use, no public release)';
const MR_SUB = { mod: 'mods', resourcepack: 'resourcepacks', shader: 'shaderpacks' };
const MR_TYPES = ['mod', 'modpack', 'resourcepack', 'shader'], MR_LOADERS = ['fabric', 'forge', 'neoforge', 'quilt'], MR_SORTS = ['relevance', 'downloads', 'follows', 'updated'];
const MR_VER = /^[\w.\-]{1,24}$/;
async function mrGet(p, ms = 20000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { const r = await require('electron').net.fetch('https://api.modrinth.com/v2' + p, { headers: { 'user-agent': MR_UA }, signal: c.signal }); if (!r.ok) throw new Error('Modrinth answered ' + r.status); return await r.json(); } finally { clearTimeout(t); }
}
function mrTargets() {
  const out = [], roaming = app.getPath('appData');
  try { const mc = path.join(roaming, '.minecraft'); if (fs.existsSync(mc)) out.push({ id: 'mc', name: 'Minecraft (default folder)', dir: mc }); } catch {}
  try { const pr = path.join(roaming, 'ModrinthApp', 'profiles'); for (const d of fs.readdirSync(pr, { withFileTypes: true })) if (d.isDirectory()) out.push({ id: 'mr:' + d.name, name: 'Modrinth App: ' + d.name, dir: path.join(pr, d.name) }); } catch {}
  return out;
}
function mcDetect() {
  const out = [];
  try {
    const vd = path.join(app.getPath('appData'), '.minecraft', 'versions');
    for (const d of fs.readdirSync(vd, { withFileTypes: true })) {
      if (!d.isDirectory()) continue; const n = d.name; let m, loader = '', ver = '';
      if ((m = /^(fabric|quilt)-loader-[\d.]+-(\d+\.\d+(?:\.\d+)?)$/.exec(n))) { loader = m[1]; ver = m[2]; }
      else if ((m = /^(\d+\.\d+(?:\.\d+)?)-forge-/.exec(n))) { loader = 'forge'; ver = m[1]; }
      else if (/^neoforge-/i.test(n)) { loader = 'neoforge'; ver = ''; }
      else if (/^\d+\.\d+(?:\.\d+)?$/.test(n)) { ver = n; }
      else continue;
      let t = 0; try { t = fs.statSync(path.join(vd, n)).mtimeMs; } catch {}
      out.push({ name: n, ver, loader, t });
    }
  } catch {}
  return out.sort((a, b) => b.t - a.t).slice(0, 12);
}
ipcMain.handle('mr:targets', () => ({ targets: mrTargets().map(({ id, name }) => ({ id, name })), detected: mcDetect() }));
ipcMain.handle('mr:versions', async () => { try { const v = await mrGet('/tag/game_version'); return (Array.isArray(v) ? v : []).filter((x) => x.version_type === 'release').map((x) => x.version).slice(0, 30); } catch { return []; } });
ipcMain.handle('mr:search', async (_e, o) => {
  try {
    o = o || {}; const type = MR_TYPES.includes(o.type) ? o.type : 'mod', sort = MR_SORTS.includes(o.sort) ? o.sort : 'relevance';
    const facets = [['project_type:' + type]];
    if (o.ver && MR_VER.test(o.ver)) facets.push(['versions:' + o.ver]);
    if (o.loader && MR_LOADERS.includes(o.loader) && (type === 'mod' || type === 'modpack')) facets.push(['categories:' + o.loader]);
    const q = new URLSearchParams({ query: String(o.q || '').slice(0, 100), facets: JSON.stringify(facets), limit: '24', index: sort });
    const j = await mrGet('/search?' + q.toString());
    return { ok: true, hits: (j.hits || []).map((h) => ({ id: h.project_id, title: h.title, desc: h.description, author: h.author, downloads: h.downloads, type: h.project_type })) };
  } catch (e) { log('modrinth search: ' + e.message); return { ok: false, hits: [] }; }
});
ipcMain.handle('mr:install', async (_e, pid, type, ver, loader, targetId) => {
  try {
    const sub = MR_SUB[type]; if (!sub) return { ok: false, error: 'Modpacks need the Modrinth App. Mods, resource packs and shaders install here.' };
    const target = mrTargets().find((t) => t.id === targetId); if (!target) return { ok: false, error: 'Pick a Minecraft folder first.' };
    if (!/^[A-Za-z0-9]{6,12}$/.test(String(pid))) return { ok: false, error: 'Bad project.' };
    if (ver && !MR_VER.test(ver)) return { ok: false, error: 'Bad version.' };
    const dir = path.join(target.dir, sub); await fs.promises.mkdir(dir, { recursive: true });
    const seen = new Set(), got = [];
    const one = async (id, depth) => {
      if (seen.has(id) || depth > 3) return; seen.add(id);
      const q = new URLSearchParams(); if (ver) q.set('game_versions', JSON.stringify([ver])); if (loader && MR_LOADERS.includes(loader) && type === 'mod') q.set('loaders', JSON.stringify([loader]));
      const vs = await mrGet('/project/' + id + '/version?' + q.toString());
      if (!Array.isArray(vs) || !vs.length) { if (depth === 0) throw new Error('No version of this for ' + (ver || 'any version') + (loader && type === 'mod' ? ' on ' + loader : '') + '.'); return; }
      const v = vs.find((x) => x.version_type === 'release') || vs[0], f = (v.files || []).find((x) => x.primary) || (v.files || [])[0];
      if (!f) return;
      const fn = path.basename(String(f.filename || '')); if (!/^[\w.+\-() \[\]]{3,150}\.(jar|zip)$/i.test(fn)) throw new Error('Unexpected file name.');
      let host = ''; try { host = new URL(f.url).hostname; } catch {} if (!/(^|\.)modrinth\.com$/i.test(host)) throw new Error('Unexpected download address.');
      const dest = path.join(dir, fn);
      if (!fs.existsSync(dest)) {
        const r = await require('electron').net.fetch(f.url, { headers: { 'user-agent': MR_UA } }); if (!r.ok) throw new Error('Download failed (' + r.status + ').');
        const buf = Buffer.from(await r.arrayBuffer()); if (buf.length > 400 * 1024 * 1024) throw new Error('File too large.');
        const want = f.hashes && f.hashes.sha512; if (want && require('crypto').createHash('sha512').update(buf).digest('hex') !== want) throw new Error('The download was damaged. Try again.');
        const tmp = dest + '.part'; await fs.promises.writeFile(tmp, buf); await fs.promises.rename(tmp, dest);
      }
      got.push(fn);
      for (const d of v.dependencies || []) {
        if (d.dependency_type !== 'required') continue; let dp = d.project_id;
        if (!dp && d.version_id) { try { dp = (await mrGet('/version/' + encodeURIComponent(d.version_id))).project_id; } catch {} }
        if (dp && /^[A-Za-z0-9]{6,12}$/.test(dp)) await one(dp, depth + 1);
      }
    };
    await one(String(pid), 0); log('modrinth: installed ' + got.join(', ') + ' -> ' + target.name);
    return { ok: true, files: got };
  } catch (e) { log('modrinth install: ' + e.message); return { ok: false, error: e && e.message ? String(e.message).slice(0, 140) : 'Install failed.' }; }
});
ipcMain.handle('mr:list', async (_e, targetId) => {
  try {
    const target = mrTargets().find((t) => t.id === targetId); if (!target) return [];
    const out = [];
    for (const [type, sub] of Object.entries(MR_SUB)) { try { for (const n of await fs.promises.readdir(path.join(target.dir, sub))) if (/\.(jar|zip)$/i.test(n)) { const st = await fs.promises.stat(path.join(target.dir, sub, n)); out.push({ type, sub, name: n, size: st.size }); } } catch {} }
    return out;
  } catch { return []; }
});
ipcMain.handle('mr:remove', async (_e, targetId, sub, name) => {
  try {
    const target = mrTargets().find((t) => t.id === targetId); if (!target || !Object.values(MR_SUB).includes(sub)) return false;
    const n = path.basename(String(name)); if (n !== name || !/\.(jar|zip)$/i.test(n)) return false;
    const f = path.join(target.dir, sub, n); if (!fs.existsSync(f)) return false;
    await require('electron').shell.trashItem(f); return true;
  } catch { return false; }
});
ipcMain.handle('mc:launcher', async () => {
  try {
    const la = process.env.LOCALAPPDATA || '', pf = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', p64 = process.env.ProgramFiles || 'C:\\Program Files';
    const cands = [[path.join(la, 'Modrinth App', 'Modrinth App.exe'), 'Modrinth App'], [path.join(pf, 'Minecraft Launcher', 'MinecraftLauncher.exe'), 'Minecraft Launcher'], [path.join(p64, 'Minecraft Launcher', 'MinecraftLauncher.exe'), 'Minecraft Launcher']];
    const hit = cands.find(([p]) => fs.existsSync(p)); if (!hit) return { ok: false };
    spawn(hit[0], [], { detached: true, stdio: 'ignore' }).unref(); return { ok: true, name: hit[1] };
  } catch { return { ok: false }; }
});

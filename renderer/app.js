'use strict';
const ACCENTS = ['#7cc4ff', '#ff8fab', '#b8f27c', '#ffc857', '#c3a6ff'];
// STEP-START
const SLIDERS = {
  scale: { label: 'Interface size', min: 0.7, max: 1.6, step: 0.1, fmt: (v) => Math.round(v * 100) + '%' },
  deadzone: { label: 'Stick dead zone', min: 0.05, max: 0.6, step: 0.05, fmt: (v) => Math.round(v * 100) + '%' },
  mouseSpeed: { label: 'Mouse speed', min: 300, max: 3000, step: 100, fmt: (v) => String(v) },
  musicVol: { label: 'Music volume', min: 0, max: 1, step: 0.05, fmt: (v) => Math.round((v ?? 0.3) * 100) + '%' },
  sfxVol: { label: 'Sound effects volume', min: 0, max: 1, step: 0.05, fmt: (v) => Math.round((v ?? 0.7) * 100) + '%' },
  mouseCurve: { label: 'Mouse acceleration', min: 1, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) },
};
function stepValue(c, v, dir, wrap) {
  let n = +(Math.round((v + dir * c.step) / c.step) * c.step).toFixed(4);
  if (n > c.max + 1e-9) n = wrap ? c.min : c.max;
  if (n < c.min - 1e-9) n = wrap ? c.max : c.min;
  return n;
}
// STEP-END
const ico = (d) => `<svg class="ico" viewBox="0 0 24 24">${d}</svg>`;
const ICON = {
  people: ico('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c3 0 5 2 5 5"/>'),
  recent: ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  view: ico('<rect x="4" y="6" width="12" height="10" rx="2"/><rect x="8" y="9" width="12" height="10" rx="2"/>'),
  bag: ico('<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  library: ico('<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>'),
  mouse: ico('<rect x="6" y="2.5" width="12" height="19" rx="6"/><path d="M12 2.5v6.5"/>'),
  pad: ico('<path transform="translate(0 4)" fill="currentColor" stroke="none" fill-rule="evenodd" d="M2.7 2.7 L1.5 6.0 L0.9 7.9 L0.3 9.9 L0.0 11.6 L0.0 13.1 L0.2 14.2 L0.4 14.6 L0.8 15.1 L1.5 15.7 L2.3 16.0 L2.6 16.0 L3.2 15.5 L5.4 13.3 L6.6 12.3 L6.9 12.1 L7.3 12.0 L8.1 11.9 L15.9 11.9 L16.7 12.0 L17.2 12.2 L17.9 12.7 L18.6 13.4 L20.4 15.2 L21.1 15.8 L21.5 16.0 L21.7 16.0 L22.1 15.9 L22.7 15.6 L23.2 15.1 L23.5 14.7 L23.7 14.3 L23.9 13.7 L24.0 13.0 L24.0 12.0 L23.8 10.5 L23.5 9.1 L22.7 6.6 L21.3 2.7 L21.0 2.3 L20.5 2.0 L20.4 1.7 L20.2 1.2 L18.6 0.4 L17.7 0.1 L17.0 0.0 L16.3 0.0 L15.3 0.5 L15.0 0.6 L13.5 0.6 L9.0 0.6 L8.6 0.5 L7.7 0.0 L7.0 0.0 L6.3 0.1 L5.7 0.3 L3.9 1.1 L3.8 1.3 L3.6 1.7 L3.5 2.0 L3.1 2.2Z M8.5 6.9 L9.4 6.9 L9.5 7.0 L9.5 7.9 L10.4 8.0 L10.6 8.2 L10.6 9.0 L10.4 9.1 L9.5 9.2 L9.5 10.1 L9.3 10.3 L8.5 10.3 L8.3 10.1 L8.3 9.1 L7.4 9.1 L7.2 8.9 L7.2 8.1 L7.3 8.0 L8.3 8.0 L8.3 7.0Z M14.9 6.6 L15.6 6.7 L16.2 7.0 L16.7 7.6 L17.0 8.2 L16.9 9.0 L16.6 9.6 L16.0 10.1 L15.4 10.3 L14.6 10.2 L14.0 10.0 L13.5 9.4 L13.3 8.7 L13.3 7.9 L13.6 7.4 L14.2 6.8Z M18.0 5.6 L18.3 5.6 L18.6 5.7 L18.9 6.0 L19.0 6.3 L19.0 6.6 L18.9 6.9 L18.6 7.1 L18.3 7.3 L18.0 7.3 L17.7 7.1 L17.5 6.9 L17.3 6.6 L17.3 6.3 L17.5 6.0 L17.7 5.7Z M16.4 4.0 L16.7 4.0 L17.0 4.1 L17.2 4.4 L17.3 4.7 L17.3 5.0 L17.2 5.3 L17.0 5.5 L16.7 5.6 L16.4 5.6 L16.1 5.5 L15.8 5.3 L15.7 5.0 L15.7 4.7 L15.8 4.4 L16.1 4.1Z M19.7 4.0 L19.9 4.0 L20.2 4.1 L20.5 4.4 L20.6 4.6 L20.6 5.0 L20.5 5.2 L20.2 5.5 L20.0 5.6 L19.6 5.6 L19.4 5.5 L19.1 5.2 L19.0 5.0 L19.0 4.6 L19.1 4.4 L19.4 4.1Z M5.6 3.0 L6.4 3.1 L7.0 3.3 L7.5 3.9 L7.7 4.6 L7.7 5.4 L7.4 5.9 L6.8 6.5 L6.1 6.7 L5.4 6.6 L4.8 6.3 L4.3 5.7 L4.0 5.1 L4.1 4.3 L4.4 3.8 L5.0 3.2Z M18.1 2.4 L18.3 2.4 L18.6 2.5 L18.9 2.8 L19.0 3.1 L19.0 3.4 L18.9 3.7 L18.6 3.9 L18.4 4.0 L18.0 4.0 L17.8 3.9 L17.5 3.7 L17.4 3.4 L17.4 3.1 L17.5 2.8 L17.8 2.5Z"/>'),
  sliders: ico('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  headset: ico('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>'),
  power: ico('<path d="M12 3v8"/><path d="M6.3 6.6a8 8 0 1011.4 0"/>'),
};
ICON.bars = ico('<path d="M5 4v16M9 4v16M13 4v16"/><path d="M17.2 5.2l3 13.8"/>');
ICON.gear = ico('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>');
ICON.globe = ico('<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7.5h14M5 16.5h14"/>');
ICON.down = ico('<path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/>');
ICON.clock = ico('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>');
ICON.timer = ico('<path d="M9 2.5h6"/><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5"/>');
ICON.star = ico('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>');
const XI = {   // top-bar icons drawn after the Xbox dashboard's
  lib: ico('<path d="M4.5 5v14M8.5 5v14M12.5 5v14" stroke-width="2.2"/><path d="M16 6l4 13" stroke-width="2.2"/>'),
  apps: ico('<rect x="3.5" y="6.5" width="17" height="14" rx="3.2" stroke-width="2"/><path d="M8.5 6.5V4.8h7v1.7" stroke-width="2"/><g fill="#fff" stroke="none"><rect x="7.6" y="10.2" width="3.4" height="3.4" rx=".8"/><rect x="13" y="10.2" width="3.4" height="3.4" rx=".8"/><rect x="7.6" y="14.8" width="3.4" height="3.4" rx=".8"/><rect x="13" y="14.8" width="3.4" height="3.4" rx=".8"/></g>'),
  store: ico('<path d="M5.2 8.2h13.6l-.9 11.6c-.1.7-.6 1.2-1.3 1.2H7.4c-.7 0-1.2-.5-1.3-1.2z" stroke-width="2"/><path d="M8.8 8.2V7a3.2 3.2 0 016.4 0v1.2" stroke-width="2"/><g fill="#fff" stroke="none"><rect x="8.6" y="11.4" width="3" height="3" rx=".5"/><rect x="12.4" y="11.4" width="3" height="3" rx=".5"/><rect x="8.6" y="15.2" width="3" height="3" rx=".5"/><rect x="12.4" y="15.2" width="3" height="3" rx=".5"/></g>'),
  search: ico('<circle cx="10.5" cy="10.5" r="6.3" stroke-width="2.2"/><path d="M15.2 15.2l5 5" stroke-width="2.4"/>'),
};
ICON.trophy = ico('<path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 6H4.5a3.5 3.5 0 003.5 4M16 6h3.5a3.5 3.5 0 01-3.5 4"/><path d="M12 13v4M8.5 20h7"/>');
ICON.drive = ico('<path d="M4 14l2.4-7.2A2 2 0 018.3 5.5h7.4a2 2 0 011.9 1.3L20 14"/><rect x="4" y="14" width="16" height="5" rx="1.5"/><circle cx="16.5" cy="16.5" r=".6"/>');
ICON.shield = ico('<path d="M12 3l7 2.6v5.6c0 4.4-3 7.6-7 9.3-4-1.7-7-4.9-7-9.3V5.6z"/><path d="M9 12l2.2 2.2L15.4 10"/>');
ICON.dots = ico('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>');
ICON.caret = ico('<path d="M6 14.5l6-6 6 6"/>');
ICON.play = ico('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>');
ICON.apps = ico('<rect x="3.5" y="4" width="17" height="16.5" rx="3"/><path d="M8.5 4V2.8M15.5 4V2.8"/><rect x="7.6" y="8.4" width="3.4" height="3.4" rx=".7"/><rect x="13" y="8.4" width="3.4" height="3.4" rx=".7"/><rect x="7.6" y="13.6" width="3.4" height="3.4" rx=".7"/><rect x="13" y="13.6" width="3.4" height="3.4" rx=".7"/>');
ICON.paint = ico('<rect x="3" y="4" width="18" height="12.5" rx="1.6"/><path d="M9 20.5h6M12 16.5v4"/><path d="M10.2 12.8l6.2-6.2 1.9 1.9-6.2 6.2-2.6.7z"/>');
ICON.filter = ico('<path d="M4 5h16l-6 7.5V19l-4-2v-4.5z"/>');
ICON.search = ico('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>');
// HOME-START
const profileName = () => { const n = (settings && settings.profileName) || userName || 'Player'; return n.charAt(0).toUpperCase() + n.slice(1); };
const avatarSpan = (cls) => `<span class="av ${cls || ''}" data-av>${esc(profileName()[0].toUpperCase())}</span>`;
let newsData = null, newsBusy = false, newsIdx = 0, headT = 0;
function newsStep(d) { if (!newsData || !newsData.length) return; newsIdx = (newsIdx + d + newsData.length) % newsData.length; show('news'); }
function rotateHeadline() {
  const el = document.querySelector('.nh span'); if (!el || !newsData || !newsData.length || screen !== 'home') return;
  headT = (headT + 1) % newsData.length; el.classList.add('out');
  setTimeout(() => { if (el.isConnected) { el.textContent = newsData[headT].title; el.classList.remove('out'); } }, 450);
}
setInterval(rotateHeadline, 6500);
const ago = (t) => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? m + 'm ago' : m < 1440 ? Math.round(m / 60) + 'h ago' : Math.round(m / 1440) + 'd ago'; };
let trailData = null, trailBusy = false, trFile = '', trIdx = 0, trErr = '';
function jumpHtml(order) {
  const rg = order.filter((g) => g && g.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed).slice(0, 5);
  if (!rg.length) return '';
  return `<div class="r3wrap"><div class="nh"><i class="live"></i><b>Jump back in</b><span>Recently played</span></div><div class="r3 ng">${rg.map((g) => `<button class="xt ncard" data-nav data-game="${esc(g.id)}">${g.image ? `<img src="${esc(g.image)}" alt="" draggable="false">` : '<i class="nnoimg"></i>'}<span class="nsrc">${esc(g.source || 'Game')} \u00b7 ${ago(g.lastPlayed)}</span><span class="nt">${esc(g.title)}</span><i class="shine"></i></button>`).join('')}</div></div>`;
}
function trailHtml() {
  if (!trailData || !trailData.length) return [0, 1, 2, 3, 4].map(() => '<span class="tcard nsk"></span>').join('');
  return trailData.map((t, i) => `<button class="xt tcard" data-nav data-trail="${i}">${t.thumb ? `<img src="ctheme://img/${esc(t.thumb)}" alt="" draggable="false">` : '<i class="nnoimg"></i>'}<span class="tplay">${ICON.play}</span><span class="nsrc">${esc(t.tag || "Trailer")}</span><span class="nt">${esc(t.title)}</span><i class="shine"></i></button>`).join('');
}
async function loadTrailers() {
  if (trailBusy) return; trailBusy = true;
  try { const r = await api.trailers(); trailNote = (r && r.note) || ''; const nt = document.getElementById('trailnote'); if (nt) nt.textContent = trailNote || 'Top sellers, new releases and more'; if (r && r.items && r.items.length) { trailData = r.items; const row = document.getElementById('trailrow'); if (row && screen === 'home') { const fi = focusIdx(); row.innerHTML = trailHtml(); if (fi >= 0) { const l = [...document.querySelectorAll('[data-nav]')]; if (l[fi]) l[fi].focus({ preventScroll: true }); } } } } catch {}
  trailBusy = false;
}
async function openTrailer(i) {
  const t = trailData && trailData[i]; if (!t) return;
  trIdx = i; trCur = t; trBack = 'home'; trFile = ''; trAudio = ''; trErr = ''; show('trailer');
  const r = await api.trailerFetch(t.steamId);
  if (screen !== 'trailer' || trIdx !== i) return;
  if (r && r.ok) { trFile = r.file; trAudio = r.audio || ''; trV = r.vcodec || ''; trA = r.acodec || ''; } else trErr = (r && r.error) || 'Could not load the trailer.';
  show('trailer');
}
function newsHtml() {
  if (!newsData || !newsData.length) return [0, 1, 2, 3, 4].map(() => '<span class="ncard nsk"></span>').join('');
  return newsData.map((n, i) => `<button class="xt ncard" data-nav data-news="${i}">${n.img ? `<img src="ctheme://img/${esc(n.img)}" alt="" draggable="false">` : '<i class="nnoimg"></i>'}<span class="nsrc">${esc(n.src)} \u00b7 ${ago(n.ts)}</span><span class="nt">${esc(n.title)}</span><i class="shine"></i></button>`).join('');
}
async function loadNews(force) {
  if (newsBusy) return; newsBusy = true;
  try { const r = await api.news(force); if (r && r.items && r.items.length) { newsData = r.items; const row = document.getElementById('newsrow'); if (row && screen === 'home') { const fi = focusIdx(); row.innerHTML = newsHtml(); if (fi >= 0) { const l = [...document.querySelectorAll('[data-nav]')]; if (l[fi]) l[fi].focus({ preventScroll: true }); } } } } catch {}
  newsBusy = false;
}

let trailNote = '', trAudio = '', trV = '', trA = '', storeData = null, storeBusy = false, spotI = 0, storeQ = '', storeRes = null, storeErr = '', storeCur = null, trCur = null, trBack = 'home';
const sprice = (x) => x.disc ? `<s class="sdisc">-${x.disc}%</s><b>${esc(x.price)}</b>` : `<b>${esc(x.price)}</b>`;
const scard = (x) => `<button class="xt tcard scard" data-nav data-store="${esc(x.id)}"><img src="ctheme://img/${esc(x.img)}" alt="" draggable="false"><span class="sbadge">${sprice(x)}</span><span class="nt">${esc(x.name)}</span><i class="shine"></i></button>`;
const sskel = () => [0, 1, 2, 3, 4].map(() => '<span class="tcard nsk"></span>').join('');
const shelfHtml = (k, n) => { const sp = new Set(spotItems().map((x) => x.id)), l = storeData && storeData[k] ? storeData[k].filter((x) => !sp.has(x.id)) : []; return l.length ? l.slice(0, n).map(scard).join('') : (storeData ? '' : sskel()); };
function spotItems() { return storeData ? (storeData.spot && storeData.spot.length ? storeData.spot : storeData.top.filter((x) => x.hero)).slice(0, 5) : []; }
function spotHtml() {
  const it = spotItems(); if (!it.length) return '<span class="spot nsk"></span>';
  const x = it[spotI % it.length];
  return `<button class="xt spot" data-nav data-store="${esc(x.id)}">${it.map((y, i) => `<img class="sp${i === spotI % it.length ? ' on' : ''}" src="ctheme://img/${esc(y.hero)}" alt="" draggable="false">`).join('')}<i class="spshade"></i><span class="sptag">#${(spotI % it.length) + 1} on the Store</span><span class="spt">${esc(x.name)}</span><span class="spp">${sprice(x)}<em>Press A to view</em></span><span class="spdots">${it.map((_, i) => `<i${i === spotI % it.length ? ' class="on"' : ''}></i>`).join('')}</span></button>`;
}
function spotStep(d) {
  const it = spotItems(); const sp = document.querySelector('.spot[data-store]'); if (!sp || it.length < 2) return;
  spotI = (spotI + d + it.length) % it.length; const x = it[spotI];
  sp.dataset.store = x.id;
  sp.querySelectorAll('.sp').forEach((im, i) => im.classList.toggle('on', i === spotI));
  sp.querySelectorAll('.spdots i').forEach((im, i) => im.classList.toggle('on', i === spotI));
  sp.querySelector('.spt').textContent = x.name; sp.querySelector('.sptag').textContent = '#' + (spotI + 1) + ' on the Store';
  sp.querySelector('.spp').innerHTML = sprice(x) + '<em>Press A to view</em>';
}
async function loadStore() {
  if (storeBusy) return; storeBusy = true;
  try {
    const r = await api.storeFeed();
    if (r && ((r.top && r.top.length) || (r.spot && r.spot.length))) {
      storeData = r;
      if (screen === 'home') {
        const fi = focusIdx();
        const put = (id, h) => { const e = document.getElementById(id); if (e) { e.innerHTML = h; const w = e.closest('.r3wrap'); if (w && e.classList.contains('r3')) w.hidden = !h; } };
        put('spotbox', spotHtml()); put('srow-top', shelfHtml('top', 10)); put('srow-sale', shelfHtml('sale', 10));
        if (fi >= 0) { const l = [...document.querySelectorAll('[data-nav]')]; if (l[fi]) l[fi].focus({ preventScroll: true }); }
      } else if (screen === 'store') show('store');
    }
  } catch {}
  storeBusy = false;
}
const findStore = (id) => { const all = []; if (storeRes) all.push(...storeRes); if (storeData) all.push(...storeData.top, ...storeData.new, ...storeData.sale, ...storeData.soon); return all.find((x) => x.id === String(id)); };
let storeFrom = 'home';
async function openStore(id) {
  const base = findStore(id); storeFrom = screen === 'store' ? 'store' : 'home';
  storeCur = { id: String(id), name: base ? base.name : 'Loading...', price: base ? base.price : '', disc: base ? base.disc : 0, img: base ? base.img : '', loading: true };
  show('storeitem');
  const d = await api.storeDetail(id);
  if (screen !== 'storeitem' || !storeCur || storeCur.id !== String(id)) return;
  storeCur = d && d.ok ? { ...d, loading: false } : { ...storeCur, loading: false, fail: true };
  show('storeitem');
}
async function storeSearch() {
  const q = await openOsk('Search the Store', storeQ || '', { done: 'Search' }); if (q === null || q === undefined || !q.trim()) return;
  storeQ = q.trim(); storeRes = []; storeErr = ''; show('store');
  const r = await api.storeSearch(storeQ);
  storeRes = (r && r.items) || []; storeErr = (r && r.error) || ''; if (screen === 'store') show('store');
}
let msIconFile = (() => { try { return localStorage.getItem('msIconFile') || null; } catch { return null; } })();
(function () {   // whenever the Home row is drawn again, put the Store icon straight back (it used to vanish after a redraw)
  const run = () => { if (msIconFile && document.querySelector('.msimg[hidden]')) applyMsIcon(); if (achData && document.querySelector('[data-achpct]')?.textContent === '\u2013') applyAch(); };
  try { new MutationObserver(run).observe(document.body, { childList: true, subtree: true }); } catch {}
})();
function applyMsIcon() {   // the real Microsoft Store icon, read from this PC's own Store app
  const f = msIconFile; if (!f) return;
  document.querySelectorAll('.msimg').forEach((im) => { im.onerror = () => { if (msTries++ > 40) return; msIconFile = ''; try { localStorage.removeItem('msIconFile'); } catch {} im.hidden = true; setTimeout(loadMsIcon, 500); }; im.src = 'ctheme://img/' + f; im.hidden = false; im.closest('.xms2')?.classList.add('hasimg'); });
}
let msTries = 0;
function loadMsIcon() { if (!api.msIcon) return; if (msIconFile) return applyMsIcon(); if (msIconFile === null || msIconFile === '') { if (msBusy) return; msBusy = true; api.msIcon().then((f) => { msBusy = false; if (f) { msIconFile = f; try { localStorage.setItem('msIconFile', f); } catch {} applyMsIcon(); } else { msIconFile = ''; if (msTries++ < 40) setTimeout(loadMsIcon, Math.min(60000, 4000 * msTries)); } }).catch(() => { msBusy = false; }); } }
let msBusy = false;
async function msStore(term) {
  rememberReturn(); note('Opening the Microsoft Store. Press the Xbox button to come back.');
  const r = await api.msOpen(term || ''); if (r && !r.ok) note('Could not open the Microsoft Store.');
}
function openTrailerObj(t, back) { trCur = t; trBack = back || 'home'; trFile = ''; trAudio = ''; trErr = ''; show('trailer'); api.trailerFetch(t.steamId).then((r) => { if (screen !== 'trailer' || trCur !== t) return; if (r && r.ok) { trFile = r.file; trAudio = r.audio || ''; trV = r.vcodec || ''; trA = r.acodec || ''; } else trErr = (r && r.error) || 'Could not load the trailer.'; show('trailer'); }); }
/* ---------- the little player on Home: cover, song, shuffle, previous, pause, skip ---------- */
const homeNp = { rep: 'off', pos: 0, dur: 0, at: 0, recent: null, recentAt: 0, on: false, title: '', artist: '', img: '', playing: false, shuf: false, vol: -1 };
let npHoldUntil = 0, npVolHoldUntil = 0, npVolT = null, npVolSent = -1, npVolLast = 0, npVolStart = 0, npVolDir = 0, npVolUser = false;
function npPaint() { const c = document.getElementById('xnpc'); if (c && /^https:\/\/[a-z0-9.-]*(scdn\.co|spotifycdn\.com)\//i.test(homeNp.img)) c.style.backgroundImage = `url("${homeNp.img}")`; }
function npTile() {
  return '';   // the player lives in the Xbox-button menu now
  if (!homeNp.on) return '';
  const b = (k, ic, cur) => `<button class="xt xnb${cur ? ' cur' : ''}" data-nav data-act="npc:${k}" id="xnb-${k}">${SPI[ic]}</button>`;
  return `<div class="xnp" id="xnp"><div class="xnpi"><i class="xnpc" id="xnpc"></i><span class="xnpt"><small>Spotify</small><b id="xnpb">${esc(homeNp.title)}</b><small id="xnps">${esc(homeNp.artist)}</small></span></div><div class="xnpr">${b('shuf', 'shuffle', homeNp.shuf)}${b('prev', 'prev')}${b('pp', homeNp.playing ? 'pause' : 'play')}${b('next', 'next')}</div></div>`;
}
let npBusy = false;
function npVol(d) {   // left/right on the Volume row of the Spotify card
  { const t = performance.now(); if (t - npVolLast > 400 || Math.sign(d) !== npVolDir) npVolStart = t; npVolLast = t; npVolDir = Math.sign(d); d = npVolDir * (1 + Math.floor((t - npVolStart) / 450)); }   // held: 1, then 2, 3 ... per step, so a long hold sweeps fast while a tap stays exact
  if (homeNp.vol < 0) homeNp.vol = 50;
  homeNp.vol = Math.max(0, Math.min(100, homeNp.vol + d)); npVolHoldUntil = performance.now() + 3000; npGuidePatch();
  // instant: the player inside the console is set right now; if that player is not open (the music plays on another device) Spotify's own volume is set instead, sent every ~150 ms
  const vv = homeNp.vol;
  // the volume is set where the sound really plays, and only there: the console's own player, the Spotify page, or (another device) Spotify's web service.
  // Setting several of them made them disagree, which was heard as a delay after the movement.
  const dev = homeNp.dev || '', where = dev === 'Frankie Console' ? 'sdk' : /web player/i.test(dev) ? 'page' : 'all';
  try { api.spCtl('vol:' + vv + ':' + where); } catch {}
  if (where === 'all') { clearTimeout(npVolT); npVolT = setTimeout(() => { npVolT = null; try { spCall('PUT', '/me/player/volume?volume_percent=' + homeNp.vol); } catch {} }, 450); }   // another device: only Spotify's web service can reach it, so once you stop
  npVolUser = true;   // the console's own volume is now the one that counts (it is kept applied to the player; Spotify's account volume is left alone so nothing jumps)
}
async function npRecent() {
  if (homeNp.recent && performance.now() - homeNp.recentAt < 60000) return; homeNp.recentAt = performance.now();
  const d = await spQ('/me/player/recently-played?limit=30'); if (!d) return;
  const seen = new Set(), out = [];
  for (const i of d.items || []) { const t = i && i.track; if (!t || !t.album || seen.has(t.album.id)) continue; seen.add(t.album.id); out.push({ uri: t.uri, name: t.name, sub: spArtists(t), img: spPick(t.album.images) }); if (out.length >= 6) break; }
  homeNp.recent = out; if (guideOn && guidePage === 'main') renderGuide();
}
const fmtT = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
function npBarTick() {
  if (!guideOn || !homeNp.on) return;
  const pos = Math.min(homeNp.dur, homeNp.pos + (homeNp.playing ? performance.now() - homeNp.at : 0));
  const f = document.getElementById('gnbar'), a = document.getElementById('gnt0'), b = document.getElementById('gnt1');
  if (f) f.style.width = (homeNp.dur ? (pos / homeNp.dur * 100).toFixed(2) : 0) + '%';
  if (a) a.textContent = fmtT(pos); if (b) b.textContent = fmtT(homeNp.dur);
}
setInterval(npBarTick, 250);
function npGuidePatch() {
  try { SND.spot(homeNp.playing || spTitlePlaying); } catch {}   // Spotify playing = no ambient music
  if (!guideOn || !homeNp.on) return;
  const set = (id, v) => { const e = document.getElementById(id); if (e && e.textContent !== v) e.textContent = v; };
  set('gnpb', homeNp.title); set('gnps', homeNp.artist);
  const pp = document.getElementById('gnb-pp'); if (pp) { const ic = homeNp.playing ? 'pause' : 'play'; if (pp.dataset.ic !== ic) { pp.dataset.ic = ic; pp.innerHTML = SPI[ic]; } }
  { const vb = document.getElementById('gvbar'), vn = document.getElementById('gvn'); if (vb && homeNp.vol >= 0) vb.style.width = homeNp.vol + '%'; if (vn) vn.textContent = homeNp.vol >= 0 ? String(homeNp.vol) : '\u2013'; }
  const sh = document.getElementById('gnb-shuf'); if (sh) sh.classList.toggle('cur', homeNp.shuf);
  const rp = document.getElementById('gnb-rep'); if (rp) rp.classList.toggle('cur', homeNp.rep !== 'off');
  const c = document.getElementById('gnpc'); if (c && c.dataset.u !== homeNp.img) { c.dataset.u = homeNp.img; if (/^https:\/\/[a-z0-9.-]*(scdn\.co|spotifycdn\.com)\//i.test(homeNp.img)) c.style.backgroundImage = `url("${homeNp.img}")`; }
}
async function npPoll() {
  if (npBusy || document.hidden || document.body.classList.contains('introplay')) return; npBusy = true;   // the Spotify player starts after the startup video, not during it
  try {
    if (!sp.init) spInit();
    if (!sp.st || !sp.st.signedIn) { if (homeNp.on) { homeNp.on = false; if (screen === 'home' && !guideOn) show('home'); } return; }
    const d = await spQ('/me/player'), t = d && d.item;
    const was = homeNp.on;
    if (!t) { homeNp.on = false; }
    else {
      homeNp.on = true; homeNp.title = t.name || ''; homeNp.artist = spArtists(t) || (t.show && t.show.name) || ''; homeNp.img = spPick((t.album || t.show || t).images); if (performance.now() > npHoldUntil) homeNp.playing = !!d.is_playing; try { SND.spot(homeNp.playing); } catch {} homeNp.dev = (d.device && d.device.name) || ''; if (!npVolUser && performance.now() > npVolHoldUntil && d.device && typeof d.device.volume_percent === 'number') homeNp.vol = d.device.volume_percent; homeNp.shuf = !!d.shuffle_state; homeNp.rep = d.repeat_state || 'off'; homeNp.pos = d.progress_ms || 0; homeNp.dur = t.duration_ms || 0; homeNp.at = performance.now();
    }
    npGuidePatch();
    if (screen !== 'home' || guideOn) return;
    if (was !== homeNp.on && !document.activeElement?.closest?.('.xnp')) { if (!osk && !menu) show('home'); return; }   // it appears or goes away only while nothing on Home is being used
    const set = (id, v) => { const e = document.getElementById(id); if (e && e.textContent !== v) e.textContent = v; };
    set('xnpb', homeNp.title); set('xnps', homeNp.artist);
    const pp = document.getElementById('xnb-pp'); if (pp) { const ic = homeNp.playing ? 'pause' : 'play'; if (pp.dataset.ic !== ic) { pp.dataset.ic = ic; pp.innerHTML = SPI[ic]; } }
    const sh = document.getElementById('xnb-shuf'); if (sh) sh.classList.toggle('cur', homeNp.shuf);
    const c = document.getElementById('xnpc'); if (c && c.dataset.u !== homeNp.img) { c.dataset.u = homeNp.img; npPaint(); }
  } catch {} finally { npBusy = false; }
}
setInterval(npPoll, 4000); setTimeout(npPoll, 2500);
const npFast = async (k) => {   // the Spotify page does it at once; the Web API is the fallback when the page is not open
  const want = !homeNp.playing;
  const flip = () => { homeNp.playing = want; npHoldUntil = performance.now() + 3500; try { SND.spot(want); } catch {} npGuidePatch(); const pp = document.getElementById('xnb-pp'); if (pp) { pp.dataset.ic = want ? 'pause' : 'play'; pp.innerHTML = SPI[pp.dataset.ic]; } };
  let r = null; try { r = await api.spCtl(k); } catch {}
  if (r && r.ok) { if (k === 'pp') flip(); npBusy = false; setTimeout(npPoll, 450); setTimeout(() => { npBusy = false; npPoll(); }, 3700); return true; }
  return false;
};
async function npRestartPrev() { if (await npFast('prev')) return; npAct('prev'); }
async function npAct(k) {
  if ((k === 'pp' || k === 'next' || k === 'prev') && await npFast(k)) return;
  if (k === 'pp') { const r = await spCall('PUT', '/me/player/' + (homeNp.playing ? 'pause' : 'play')); if (r) { homeNp.playing = !homeNp.playing; npGuidePatch(); const pp = document.getElementById('xnb-pp'); if (pp) { pp.dataset.ic = homeNp.playing ? 'pause' : 'play'; pp.innerHTML = SPI[pp.dataset.ic]; } } }
  else if (k === 'next' || k === 'prev') { await spCall('POST', '/me/player/' + (k === 'next' ? 'next' : 'previous')); setTimeout(npPoll, 700); }
  else if (k === 'rep') { const nx = homeNp.rep === 'off' ? 'context' : homeNp.rep === 'context' ? 'track' : 'off'; const r = await spCall('PUT', '/me/player/repeat?state=' + nx); if (r) { homeNp.rep = nx; npGuidePatch(); } }
  else if (k === 'shuf') { const on = !homeNp.shuf; const r = await spCall('PUT', '/me/player/shuffle?state=' + on); if (r) { homeNp.shuf = on; npGuidePatch(); const sh = document.getElementById('xnb-shuf'); if (sh) sh.classList.toggle('cur', on); } }
}
function homeHtml() { setTimeout(loadSquares, 400); return settings.homeStyle === 'classic' ? homeClassic() : homeNew(); }
function homeClassic() {   // the same arrangement as a console dashboard: profile and icon bar on top, a row of games, a row of shortcut cards
  const g = games.filter((x) => x.title);
  const played = g.filter((x) => x.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed);
  const inst = g.filter((x) => x.installed !== false), away = g.filter((x) => x.installed === false);
  const order = played.concat(inst.filter((x) => !x.lastPlayed), away.filter((x) => !x.lastPlayed));
  const gt = (x, cls) => `<button class="xt ${cls}${x.image ? '' : ' noart'}" data-nav data-game="${esc(x.id)}" data-img="${esc(x.image || '')}"${x.image ? '' : ` data-hue="${hue(x.title)}"`}><span class="xtl">${esc(x.title)}</span></button>`;
  const th = (x) => `<i class="th"${x ? ` data-g="${esc(x.id)}"` : ''} data-img="${esc(x ? (sqMap.has(x.id) ? 'ctheme://img/' + sqMap.get(x.id) : gImg(x) || x.image || '') : '')}"></i>`;
  const lastG = order[0], nextG = order[1];
  const tile = (x, cls) => `<button class="xt ${cls}${gImg(x) ? '' : ' noart'}" data-nav data-game="${esc(x.id)}" data-img="${esc(gImg(x))}"${gImg(x) ? '' : ` data-hue="${hue(x.title)}"`}><span class="xql">${esc(x.title)}</span></button>`;
  const appT = (settings.webApps || []).map((x) => `<button class="xt xs xapp" data-nav data-app="${esc(x.id)}"${/^#[0-9a-f]{6}$/i.test(x.color || '') ? ` style="--ac:${x.color}"` : ''}${x.icon ? '' : ` data-wc="${esc(x.color)}"`}>${x.icon ? `<img src="ctheme://img/${esc(x.icon)}" alt="" draggable="false">` : `<b>${esc((x.name || '?').charAt(0))}</b>`}<span class="xql">${esc(x.name)}</span></button>`);
  const storeT = `<button class="xt xs xblue" data-nav data-act="msopen"><b class="xi">${ICON.bag}</b><span class="xql">Microsoft Store</span></button>`;
  const setT = `<button class="xt xs xblue" data-nav data-go="settings"><b class="xi">${ICON.gear}</b><span class="xql">Settings</span></button>`;
  const big = lastG ? tile(lastG, 'xbig') : `<button class="xt xbig xblue" data-nav data-go="settings"><b class="xi">${ICON.gear}</b><span class="xql">Settings</span></button>`;
  const smalls = order.slice(1, 7).map((x) => tile(x, 'xs')).concat(appT, [setT]).concat(order.slice(7, 20).map((x) => tile(x, 'xs')));
  const strips = [order[2], order[3], order[4], order[5]].filter(Boolean).map((x) => `<i class="xstrip" data-img="${esc(gImg(x))}"></i>`).join('');
  const nOn = friendsData && friendsData.ok ? friendsData.online : -1;
  const frT = `<button class="xt xwide xfr" data-nav data-act="friends"${nextG ? ` data-img="${esc(nextG.image || '')}"` : ''}><span class="xwt">${nOn > 0 ? nOn + (nOn === 1 ? ' friend online' : ' friends online') : nOn === 0 ? 'No friends online' : 'Steam friends'}<small>${nOn >= 0 ? 'See what\u2019s happening' : 'Set up in Settings'}</small></span></button>`;
  const playT = lastG ? `<button class="xt xwide xpl${lastG.image ? '' : ' noart'}" data-nav data-game="${esc(lastG.id)}" data-img="${esc(lastG.image || '')}"${lastG.image ? '' : ` data-hue="${hue(lastG.title)}"`}><span class="xwt">${dash && dash.id === lastG.id ? 'Resume' : 'Play'} ${esc(lastG.title)} now</span></button>` : '';
  const wid = settings.widgets.filter((w) => w.type !== 'library' && w.type !== 'recent').map((w) => widgetHtml(w, true));
  const pins = (list) => list.map((x) => tile(x, 'xp')).join('');
  const instAll = order.filter((x) => x.installed !== false), awayAll = order.filter((x) => x.installed === false).sort(alpha);
  const pinsHtml = `<div class="xsec"><h3 class="xh">Pins <i class="xdot"></i></h3><div class="r3 xr3 hscroll"><button class="xt xp xblue xfirst" data-nav data-go="library"><b class="xi">${ICON.library}</b><span class="xql">Library</span></button>${pins(instAll)}</div></div>`;
  const awayHtml = awayAll.length ? `<div class="xsec"><h3 class="xh">Ready to install</h3><div class="r3 xr3 hscroll">${pins(awayAll)}</div></div>` : '';
  const g2 = games.filter((x) => x.title).length;
  return `<div class="topbar">
      <button class="xt prof" data-nav data-go="profile">${avatarSpan()}<span class="pn">${esc(profileName())}<small>${ICON.pad}<b>${g2}</b></small></span></button></div>
    <div class="dash xhome xold"><div class="rows"><div class="fold">
      <div class="r1 xb1">${big}<div class="xsm">${smalls.join('')}</div></div>
      <div class="r2 xb2"><button class="xt xlibt" data-nav data-go="library"><span class="xstrips">${strips}</span><b class="xi">${ICON.library}</b><span class="xql">My games &amp; apps</span></button>${npTile()}${frT}${playT}${wid.join('')}</div></div>
      ${pinsHtml}${awayHtml}
</div></div>
    <div class="xpill"><span>${ICON.view}<em>Achievements</em></span><span>${padGlyph(settings.binds.search)}<em>Search</em></span></div>`;
}
const apFanHtml = () => (settings.webApps || []).slice(0, 5).map((x) => { const a = appArt.get(x.id), src = a ? 'ctheme://img/' + a : (x.icon ? 'ctheme://img/' + x.icon : ''); return src ? `<i class="xac${a ? ' full' : ''}"><img src="${esc(src)}" alt="" draggable="false"></i>` : `<i class="xac" data-bg="${esc(x.color)}"><b>${esc((x.name || '?').charAt(0))}</b></i>`; }).join('');
const apFanRefresh = () => document.querySelectorAll('.xab').forEach((el) => { el.innerHTML = apFanHtml(); el.querySelectorAll('[data-bg]').forEach((n) => { if (/^#[0-9a-f]{6}$/i.test(n.dataset.bg)) n.style.background = n.dataset.bg; }); });
const alpha = (a, b) => String(a.title || '').replace(/^(the|a|an)\s+/i, '').localeCompare(String(b.title || '').replace(/^(the|a|an)\s+/i, ''), undefined, { sensitivity: 'base', numeric: true });
const appArt = new Map(), sqMap = new Map(), sqAsked = new Set(), coverAsked = new Set(), xbAsked = new Set(), sqPr = new Map(); let sqBusy = false;
function refreshThumbs() {   // the little pictures in the "Your games" widget: always the best art we have for that game (Xbox square, else the real cover)
  let ch = false;
  document.querySelectorAll('.th[data-g]').forEach((el) => { const g = games.find((x) => x.id === el.dataset.g); if (!g) return; const u = sqMap.has(g.id) ? 'ctheme://img/' + sqMap.get(g.id) : gImg(g); if (u && el.dataset.img !== u) { el.dataset.img = u; ch = true; } });
  if (ch) applyCovers();
}
const artTry = new Map(), wholeDone = new Set();
const wholeOn = (x) => (settings.wholeFit || []).includes(String(x.id));
function retryArt(x, set) { const k = (set === xbAsked ? 'x' : 's') + x.id, n = (artTry.get(k) || 0) + 1; artTry.set(k, n); if (n <= 3) set.delete(x.id); }   // a lookup that came back empty (slow network) is tried again a few times
async function titleSquare(x, heroFile) {   // a game whose art has no logo: its wide art cut to a square and dimmed (like every other tile) with the game's name set on it, so nothing is cut off and the title is always there
  try {
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'ctheme://img/' + heroFile; });
    const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), side = Math.min(im.naturalWidth, im.naturalHeight);
    g.drawImage(im, Math.round((im.naturalWidth - side) * 0.62), Math.round((im.naturalHeight - side) / 2), side, side, 0, 0, S, S);
    const gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, 'rgba(0,0,0,.38)'); gr.addColorStop(1, 'rgba(0,0,0,.62)'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    const title = String(x.title || '').replace(/[\u00ae\u2122]/g, '').trim(), fam = getComputedStyle(document.body).fontFamily || 'sans-serif', words = title.split(/\s+/), maxW = S * 0.8;
    let fs = 96, lines = [];
    for (; fs >= 28; fs -= 4) {
      g.font = '800 ' + fs + 'px ' + fam; lines = []; let cur = '';
      for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
      if (cur) lines.push(cur);
      if (lines.length <= 4 && lines.every((l) => g.measureText(l).width <= maxW) && lines.length * fs * 1.08 <= S * 0.7) break;
    }
    g.font = '800 ' + fs + 'px ' + fam; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 18; g.shadowOffsetY = 3;
    const lh = fs * 1.08, y0 = S / 2 - (lines.length - 1) * lh / 2; lines.forEach((l, k) => g.fillText(l, S / 2, y0 + k * lh));
    return await api.saveSquare(x.id, c.toDataURL('image/jpeg', 0.92));
  } catch { return ''; }
}
function loadSquares() {   // square covers, best wins: 3) the real Xbox cover, 2) built from the game's wide art + logo, 1) its own cover fitted WHOLE into a square. All three run at once, so tiles are never left cut off while a slow lookup finishes
  if (sqBusy || !api.heroes) return; sqBusy = true;
  const apply = (x, s, pr) => { if ((customIds.has(x.id) && pr === 2) || (sqPr.get(x.id) || 0) >= pr) return; sqPr.set(x.id, pr); sqMap.set(x.id, s); setTimeout(refreshThumbs, 0); setTimeout(refreshGxArt, 0); { const pc = document.querySelector('#hero .pc'); if (pc && lastHero && lastHero.id === x.id) { pc.style.backgroundImage = `url("ctheme://img/${s}")`; pc.classList.add('sqc'); } } document.querySelectorAll('.xn[data-game], .lt[data-game]').forEach((el) => { if (el.dataset.game !== x.id) return; const u = 'ctheme://img/' + s; el.dataset.img = u; el.dataset.sq = u; el.classList.remove('noart'); el.classList.add('sq'); el.style.backgroundImage = `linear-gradient(to top, rgba(8,10,20,.9) 12%, rgba(8,10,20,.04) 70%), url("${u}")`; el.style.setProperty('--art', `url("${u}")`); }); };
  const ok = (s) => typeof s === 'string' && /^ws-\d{1,12}\.jpg$/.test(s);
  const all = games.filter((x) => x.title);
  const fit = async () => { const rest = all.filter((x) => !coverAsked.has(x.id) && /^(https:\/\/(media\.rawg\.io|cdn[0-9]?\.(epicgames|unrealengine)\.com|[a-z0-9-]+\.epicgames\.com)\/|ctheme:\/\/img\/)/.test(gImg(x))); rest.forEach((x) => coverAsked.add(x.id));
    for (let i = 0; i < rest.length; i += 8) { const part = rest.slice(i, i + 8); try { const r = await api.coverSquares(part.map((x) => ({ id: x.id, url: gImg(x) }))); if (r) for (const x of part) if (ok(r[x.id])) apply(x, r[x.id], 1); } catch {} } };
  const wide = async () => { const nologo = []; const st = all.filter((x) => x.steamId && /^\d+$/.test(String(x.steamId)) && !sqAsked.has(x.id)); st.forEach((x) => sqAsked.add(x.id));
    for (let i = 0; i < st.length; i += 6) { const part = st.slice(i, i + 6);
      try { const r = await api.heroes(part.map((x) => String(x.steamId))); if (!r) continue;
        for (const x of part) { const k = String(x.steamId), s = r[k + 's'], n = r[k], l = r[k + 'l']; if (n && /^wh-\d+\.jpg$/.test(n)) heroMap.set(x.id, n); if (l && /^w[lt]-\d+\.png$/.test(l)) logoMap.set(x.id, l); if (ok(s)) apply(x, s, 2); else retryArt(x, sqAsked); if (!l && !customIds.has(x.id)) nologo.push(x); } } catch { part.forEach((x) => retryArt(x, sqAsked)); } }
    for (let i = 0; i < nologo.length; i += 8) { const part = nologo.slice(i, i + 8); try { const r = await api.coverSquares(part.map((x) => ({ id: x.id, url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + x.steamId + '/library_600x900.jpg' }))); if (r) for (const x of part) if (ok(r[x.id])) apply(x, r[x.id], 2.5); } catch {} } };   // only where no logo could be added to the wide art (it would be a bare crop): Steam's own portrait cover, shown whole
  const xbox = async () => { if (!api.xboxCovers) return; const todo = all.filter((x) => !xbAsked.has(x.id)); todo.forEach((x) => xbAsked.add(x.id));
    const batches = []; for (let i = 0; i < todo.length; i += 3) batches.push(todo.slice(i, i + 3));
    const worker = async () => { while (batches.length) { const part = batches.shift();
      try { const r = await api.xboxCovers(part.map((x) => ({ id: x.id, title: x.title }))); if (r) for (const x of part) { if (ok(r[x.id])) apply(x, r[x.id], 3); else retryArt(x, xbAsked); } } catch { part.forEach((x) => retryArt(x, xbAsked)); } } };
    await Promise.all([worker(), worker(), worker(), worker()]); };   // four lookups at a time, so a big library is done in seconds, not minutes
  const appsX = async () => { if (!api.xboxCovers) return; const ap = (settings.webApps || []).filter((x) => x.name && !xbAsked.has('app' + x.id)); if (!ap.length) return; ap.forEach((x) => xbAsked.add('app' + x.id));
    for (let i = 0; i < ap.length; i += 4) { const part = ap.slice(i, i + 4);
      try { const r = await api.xboxCovers(part.map((x) => ({ id: x.id, title: x.name, exact: true }))); if (r) for (const x of part) if (ok(r[x.id])) { appArt.set(x.id, r[x.id]); document.querySelectorAll('.xnapp[data-app], .atile[data-app]').forEach((el) => { if (el.dataset.app !== x.id) return; el.querySelectorAll('img, b').forEach((n) => n.remove()); el.classList.add('xsq', 'asq'); el.removeAttribute('data-wc'); const im = document.createElement('img'); im.className = 'axb'; im.alt = ''; im.draggable = false; im.src = 'ctheme://img/' + r[x.id]; el.insertBefore(im, el.firstChild); }); } } catch {} }
    const miss = ap.filter((x) => !appArt.has(x.id) && /^appicon-[a-f0-9]{12}\.png$/.test(x.icon || ''));   // not in the Store: its own icon centred on a full square, so it matches the others
    if (miss.length && api.appSquares) { try { const r = await api.appSquares(miss.map((x) => ({ id: x.id, icon: x.icon }))); if (r) for (const x of miss) if (ok(r[x.id])) { appArt.set(x.id, r[x.id]); document.querySelectorAll('.xnapp[data-app], .atile[data-app]').forEach((el) => { if (el.dataset.app !== x.id) return; el.querySelectorAll('img, b').forEach((n) => n.remove()); el.classList.add('xsq', 'asq'); el.removeAttribute('data-wc'); const im = document.createElement('img'); im.className = 'axb'; im.alt = ''; im.draggable = false; im.src = 'ctheme://img/' + r[x.id]; el.insertBefore(im, el.firstChild); }); } } catch {} } };   // the apps too: their real Microsoft Store art, when the Store has the exact same app
  const whole = async () => { const w = all.filter((x) => wholeOn(x) && !wholeDone.has(x.id)); w.forEach((x) => wholeDone.add(x.id));
    for (const x of w) { const url = x.steamId && /^\d+$/.test(String(x.steamId)) ? 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + x.steamId + '/library_600x900.jpg' : gImg(x); try { const r = await api.coverSquares([{ id: x.id, url }]); if (r && ok(r[x.id])) apply(x, r[x.id], 4); } catch {} } };   // covers set to "fit whole" (or known to be cut off): the full picture inside the square
  Promise.all([fit(), wide(), xbox(), appsX(), whole()]).finally(() => { sqBusy = false; apFanRefresh(); if (all.some((x) => (x.steamId && !sqAsked.has(x.id)) || !xbAsked.has(x.id)) || games.filter((x) => x.title).length !== all.length) setTimeout(loadSquares, 4000); });
}
function homeNew() {   // the 2026 console Home: search + settings on top, Jump back in, Store row, then shelves, over the art of the selected game
  const g = games.filter((x) => x.title);
  const played = g.filter((x) => x.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed);
  const inst = g.filter((x) => x.installed !== false), away = g.filter((x) => x.installed === false);
  const order = played.concat(inst.filter((x) => !x.lastPlayed), away.filter((x) => !x.lastPlayed));
  const tile = (x) => `<button class="xt xn${gImg(x) ? '' : ' noart'}${sqMap.has(x.id) ? ' sq' : ''}" data-nav data-game="${esc(x.id)}" data-img="${esc(sqMap.has(x.id) ? 'ctheme://img/' + sqMap.get(x.id) : gImg(x))}"${sqMap.has(x.id) ? ` data-sq="ctheme://img/${esc(sqMap.get(x.id))}"` : ''}${gImg(x) ? '' : ` data-hue="${hue(x.title)}"`}><span class="xnl">${esc(x.title)}</span></button>`;
  const apps = (settings.webApps || []).map((x) => appArt.has(x.id) ? `<button class="xt xn xnapp xsq" data-nav data-app="${esc(x.id)}"><img class="axb" src="ctheme://img/${esc(appArt.get(x.id))}" alt="" draggable="false"><span class="xnl">${esc(x.name)}</span></button>` : `<button class="xt xn xnapp" data-nav data-app="${esc(x.id)}"${x.icon ? '' : ` data-wc="${esc(x.color)}"`}>${x.icon ? `<img src="ctheme://img/${esc(x.icon)}" alt="" draggable="false">` : `<b>${esc((x.name || '?').charAt(0))}</b>`}<span class="xnl">${esc(x.name)}</span></button>`);
  const jump = order.filter((x) => x.installed !== false).slice(0, 7).map(tile).concat(apps);   // only games that are installed
  const lastG = order[0], nextG = order[1];
  const nOn = frAny() ? frOnline() : -1;
  const libT = widgetHtml({ type: 'library', title: 'Your games' }, true);
  const wTypes = settings.widgets.map((w) => w.type);
  const extraT = '';   // Achievements now live in the Xbox-button guide
  const wid = settings.widgets.filter((w) => w.type !== 'library' && w.type !== 'recent' && w.type !== 'stats').sort((a, b) => (b.type === 'apps') - (a.type === 'apps')).slice(0, 3).map((w) => widgetHtml(w, true));
  const shelf = (title, list) => list.length ? `<div class="xsec"><h3 class="xnh">${title}</h3><div class="r3 xr3n hscroll">${list.map(tile).join('')}</div></div>` : '';
  const instAll = order.filter((x) => x.installed !== false).slice(7);
  const dotNeeded = !settings.rawgKey;
  return `<div class="topbar">
      <button class="xt prof" data-nav data-go="profile">${avatarSpan()}<span class="pn">${esc(profileName())}<small><i class="gbadge">G</i>${g.length}</small></span></button>
      <div class="tnav">
        <button class="xt ti" data-nav data-go="library">${XI.lib}</button>
        <button class="xt ti feat" data-nav data-go="apps">${XI.apps}</button>
        <button class="xt ti" data-nav data-go="tools">${ICON.tools || ''}</button>
        <button class="xt ti" data-nav data-act="search">${XI.search}</button>
        <button class="xt ti" data-nav data-go="settings">${ICON.gear}${dotNeeded ? '<i class="ndot"></i>' : ''}</button></div></div>
    <div class="dash xnew"><div class="rows"><div class="fold">
      <h3 class="xnh xjb">Jump back in</h3>
      <div class="r1 xr1n">${jump.length ? jump.join('') : `<button class="xt xn xnapp" data-nav data-go="library"><b class="xi">${ICON.library}</b><span class="xnl">Add games</span></button>`}</div>
      <div class="r2 xr2n">${npTile()}${libT}${extraT}${wid.join('')}</div></div>
      ${shelf('Install next', order.filter((x) => x.installed === false).sort(alpha))}
</div></div>`;
}
const WTYPES = { library: 'Browse your games', recent: 'Continue playing', featured: 'Ready to install', apps: 'Browse your apps', game: 'Pinned game', web: 'Web page', app: 'App or folder', controller: 'Controller', settings: 'Settings', search: 'Search', find: 'Find a new game', customize: 'Customize your Home', clock: 'Clock', stats: 'Achievements' };
let achData = null, achBusy = false;
function applyAch() {
  const d = achData, set = (s, t) => document.querySelectorAll(s).forEach((e) => { e.textContent = t; });
  if (!document.querySelector('[data-achring]')) return;
  if (!d) return;
  if (!d.ok) { const m = { nokey: 'Add your Steam key in Settings to track achievements', noid: 'Sign in to Steam on this PC to track achievements', private: 'Steam would not share this account\u2019s games. Check the Steam key and that game details are public', badkey: 'Steam rejected your Steam key. Check it in Settings', error: 'Could not reach Steam right now' }[d.why] || 'No achievements yet'; set('[data-achnote]', m); set('[data-achpct]', '0%'); set('[data-achgot]', '0'); set('[data-achperf]', '0'); return; }
  const pc = d.total ? Math.round(d.got / d.total * 100) : 0, C = 2 * Math.PI * 42;
  document.querySelectorAll('[data-achring]').forEach((e) => e.setAttribute('stroke-dasharray', (pc / 100 * C).toFixed(1) + ' ' + C.toFixed(1)));
  set('[data-achpct]', pc + '%'); set('[data-achgot]', d.got + ' / ' + d.total); set('[data-achperf]', String(d.perfect));
  set('[data-achnote]', d.top ? 'Closest to done: ' + d.top.title + ' ' + d.top.got + '/' + d.top.total : 'Across ' + d.games + ' games');
}
async function loadAch() { if (!api.achievements) return; applyAch(); if (achBusy || document.body.classList.contains('introplay')) return;   // the achievements count waits for the startup video to end
  achBusy = true; try { const r = await api.achievements(); if (r) achData = r; } catch {} achBusy = false; applyAch(); }
const WADD = ['library', 'recent', 'apps', 'web', 'app', 'controller', 'settings', 'search', 'find', 'clock', 'stats'];
const WCOLORS = ['', '#2f6fed', '#d2475f', '#2fa66a', '#e0a030', '#8a5cf0', '#16a5b8', '#e06a2c', '#c23fa3', '#3a3d46'];
function widgetHtml(w, nav) {   // one widget; nav=false draws a non-clickable preview for the editor
  const g = games.filter((x) => x.title), inst = g.filter((x) => x.installed !== false), away = g.filter((x) => x.installed === false);
  const played = g.filter((x) => x.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed);
  const th = (x) => `<i class="th"${x ? ` data-g="${esc(x.id)}"` : ''} data-img="${esc(x ? (sqMap.has(x.id) ? 'ctheme://img/' + sqMap.get(x.id) : gImg(x) || x.image || '') : '')}"></i>`;
  const own = w.img && /^widget-[a-z0-9]+\.jpg$/.test(w.img) ? 'ctheme://img/' + w.img : '';
  const label = (def, sub) => `<span class="wl">${esc(w.title || def)}${sub ? `<small>${esc(sub)}</small>` : ''}</span><i class="shine"></i>`;
  const act = (a) => (nav ? ` data-nav ${a}` : ' tabindex="-1"');
  const KICK = { library: 'Library', stats: 'Achievements', clock: 'Now', apps: 'Apps', controller: 'Controller', settings: 'Settings', search: 'Search', find: 'Discover', web: 'Web', app: 'Launch', customize: 'Home', recent: 'Continue', featured: 'New', game: 'Pinned' };
  const head = (extra) => `<button class="xt w2 w-${w.type}${w.size === 'half' ? ' half' : ''}${own ? ' hasimg' : ''}"${act(extra.act || '')}${w.color ? ` data-wc="${esc(w.color)}"` : ''}${own || extra.img ? ` data-img="${esc(own || extra.img)}"` : ''}${extra.hue !== undefined && !own && !extra.img ? ` data-hue="${extra.hue}"` : ''}><span class="wxk"><i></i>${KICK[w.type] || ''}</span>`;
  const art = (x) => ({ act: nav ? `data-game="${esc(x.id)}"` : '', img: x.image || '', hue: hue(x.title) });
  const fx = '<i class="orb o1"></i><i class="orb o2"></i><i class="shine"></i>';
  const ttl = (def, sub) => `<span class="wxt"><b>${esc(w.title || def)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>`;
  const gico = (svg, def, sub) => `${head({ act: '@' })}${fx}<span class="wxi"><i class="ring r1"></i><i class="ring r2"></i><span class="gl">${svg}</span></span>${ttl(def, sub)}</button>`;
  const wxh = (extra) => head(extra).replace('class="xt w2 ', 'class="xt w2 wx ');
  switch (w.type) {
    case 'library': return `${wxh({ act: 'data-go="library"' })}<span class="xlb">${[0, 1, 2, 3, 4].map((i) => th(inst[i] || g[i])).join('')}</span><i class="xlbi">${ICON.pad}</i><span class="xlbl">${esc(w.title || 'Browse your games')}</span></button>`;
    case 'stats': return `${wxh({ act: 'data-go="ach"' })}${fx}<span class="wxsring"><svg viewBox="0 0 100 100"><circle class="tr" cx="50" cy="50" r="42"/><circle class="pg" cx="50" cy="50" r="42" data-achring stroke-dasharray="0 264"/></svg><b data-achpct>\u2013</b><small>complete</small></span>
        <span class="wxsrows"><span><b data-achgot>\u2013</b><small>unlocked</small></span><span><b data-achperf>\u2013</b><small>perfect games</small></span></span>
        <span class="wxsleg" data-achnote>Counting your achievements\u2026</span></button>`;
    case 'clock': { const h = new Date().getHours(), ph = h < 5 || h >= 21 ? 'night' : h < 8 ? 'dawn' : h < 17 ? 'day' : 'dusk'; return `${wxh({})}${fx}<i class="sky ${ph}"><i class="orbc"></i></i><span class="wclock" data-clock></span><span class="wdate" data-date></span><span class="wgreet">${greet()}${w.title ? ' \u00b7 ' + esc(w.title) : ''}</span></button>`; }
    case 'apps': return `${wxh({ act: 'data-go="apps"' })}<span class="xab">${apFanHtml()}</span><i class="xlbi">${ICON.apps || ICON.globe}</i><span class="xlbl">${esc(w.title || 'Browse your apps')}</span></button>`;
    case 'controller': return `${wxh({ act: 'data-go="controller"' })}${fx}<i class="padglow"></i><img class="wpad wp-xb" src="scuf.png" alt="" draggable="false"><img class="wpad wp-ps" src="omega.png" alt="" draggable="false">${ttl('Customize your controller', 'Buttons, sticks and profiles')}</button>`;
    case 'settings': return gico(ICON.gear, 'Settings', 'Make it yours').replace('@', 'data-go="settings"').replace('w2 w-', 'w2 wx w-');
    case 'search': return gico(ICON.search, 'Search your games', 'Find anything fast').replace('@', 'data-act="search"').replace('w2 w-', 'w2 wx w-');
    case 'find': return gico(ICON.search, 'Find a new game', 'Browse the catalog').replace('@', 'data-act="find"').replace('w2 w-', 'w2 wx w-');
    case 'web': { let host = ''; try { host = new URL(w.target).hostname.replace(/^www\./, ''); } catch {} return gico(ICON.globe, 'Web page', host).replace('@', `data-act="widget" data-wid="${esc(w.id)}"`).replace('w2 w-', 'w2 wx w-'); }
    case 'app': return gico(ICON.apps, 'App or folder', w.target ? '' : 'Choose one in Customize your Home').replace('@', `data-act="widget" data-wid="${esc(w.id)}"`).replace('w2 w-', 'w2 wx w-');
    case 'customize': return `${wxh({ act: 'data-go="widgets"' })}<span class="xcz"><i class="xc1"><svg viewBox="0 0 120 40" preserveAspectRatio="none"><path d="M6 40 Q6 27 20 27 Q24 12 42 14 Q54 3 70 14 Q94 9 96 28 Q116 28 116 40 Z"/></svg></i><i class="xc2"><svg viewBox="0 0 120 40" preserveAspectRatio="none"><path d="M6 40 Q6 27 20 27 Q24 12 42 14 Q54 3 70 14 Q94 9 96 28 Q116 28 116 40 Z"/></svg></i><i class="xc3"><svg viewBox="0 0 120 40" preserveAspectRatio="none"><path d="M6 40 Q6 27 20 27 Q24 12 42 14 Q54 3 70 14 Q94 9 96 28 Q116 28 116 40 Z"/></svg></i><i class="xcs"></i></span><i class="xczi"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M8 20.5h8M12 16.5v4"/><path d="M9.5 13.2l.9-3 6.2-6.2 2.1 2.1-6.2 6.2z"/></svg></i><span class="xczl">${esc(w.title || 'Customize your Home')}</span></button>`;
    case 'recent': { const x = played[0] || inst[0]; return x ? `${wxh(art(x))}<span class="wbadge">${ICON.play}Continue</span>${label(x.title)}</button>` : `${wxh({ act: 'data-go="library"' })}${ICON.pad}${label('Continue playing', 'Nothing played yet')}</button>`; }
    case 'featured': { const x = away[0] || [...g].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))[0]; return x ? `${wxh(art(x))}<span class="wbadge">${ICON.down}${x.installed === false ? 'Ready to install' : 'Newest'}</span>${label(x.title)}</button>` : `${wxh({ act: 'data-act="find"' })}${ICON.search}${label('Find a new game')}</button>`; }
    case 'game': { const x = g.find((y) => y.id === w.target); return x ? `${wxh(art(x))}<span class="wbadge">${ICON.star}Pinned</span>${label(x.title)}</button>` : `${wxh({ act: 'data-go="library"' })}${ICON.star}${label('Pinned game', 'No longer in your library')}</button>`; }
  }
  return '';
}
// HOME-END
const greet = () => { const h = new Date().getHours(); return h < 5 ? 'Late night gaming' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
const DEPTH = { ach: 1, achgame: 2, store: 1, storeitem: 2, trailer: 1, news: 1, apppick: 2, apps: 1, home: 0, library: 1, settings: 1, binds: 1, controller: 1, profile: 1, widgets: 1, catalog: 2, game: 2, platform: 3, spotify: 2, ytube: 2, caps: 3, sysinfo: 3, notifs: 3, weather: 3, quick: 3, tools: 1 };
const pct = (k) => { const c = SLIDERS[k]; return Math.round(((settings[k] - c.min) / (c.max - c.min)) * 1000) / 10; };
const sliderRow = (k) => `<button class="item slider" data-nav data-adjust="${k}"><span class="lbl">${SLIDERS[k].label}</span><span class="track"><i class="fill" data-slider="${k}"></i></span><span class="val" data-val="${k}">${SLIDERS[k].fmt(settings[k])}</span></button>`;
const $ = (s) => document.querySelector(s);
let trailMsg = '', trailIv = 0;
let settings, screen = 'home', mouseOn = false, games = [], osk = null, noteT = 0, acct = { steam: false, ubisoft: false, epic: false, gog: false, errors: [] };
let libBack = null, descOpen = false, gameId = '', prevScreen = 'library', prevIdx = 0, catResults = [], catQuery = '', pending = null, capture = null, libFilter = '', dash = null, launching = false, menu = null, xpad = false, cpad = false, dashBusy = false, pickedId = null, lastScope = 0, libScope = 0, userName = '', heroKey = '', lastHero = null, heroTok = 0, heroFlip = false, introOn = false, introStage = 0, introLast = 0;
const sup = new Set();   // buttons whose press already did something, so one press never triggers two actions
const drafts = {};
const api = window.consoleApi;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const focusIdx = () => [...document.querySelectorAll('[data-nav]')].indexOf(document.activeElement);
// HINTS-START
/* ---------- v1091: which controller is in use (PlayStation or Xbox) ---------- */
let padSaving = false, padKindAuto = '', padKindLive = '', padReady = false, padLogged = '';
const padKind = () => (settings && (settings.padType === 'xbox' || settings.padType === 'ps')) ? settings.padType : (padKindLive || padKindAuto || (settings && settings.lastPadKind) || 'xbox');
function setPadKind() {
  const k = padKind(), was = document.body.classList.contains('pad-ps');
  document.body.classList.toggle('pad-ps', k === 'ps'); document.body.classList.toggle('pad-xbox', k !== 'ps');
  if (was !== (k === 'ps')) { try { if (document.querySelector('.mp-3dslot')) mountPad(undefined, false); } catch {} try { const h = document.getElementById('hints'); if (h && !h.classList.contains('msg') && typeof screen !== 'undefined' && SCREENS[screen]) h.innerHTML = renderHints(SCREENS[screen].hints); } catch {} }
}
async function padKindInit() {
  try { for (const g of (navigator.getGamepads ? navigator.getGamepads() : [])) if (g) padKindFrom(g); } catch {}   // a pad already known to the browser says what it is right away   // asked before the startup video is chosen, so the right video plays
  try { const k = padKindLive || await Promise.race([window.consoleApi.padKind(), new Promise((r) => setTimeout(() => r(''), (settings && settings.lastPadKind) ? 4500 : 10000))]); if (k) padKindAuto = k; } catch {}
  padReady = true; setPadKind();
}
function padKindFrom(p) {   // the controller itself says what it is as soon as it is touched
  if (!p) return;
  const id = String(p.id || ''), k = /054c|dualsense|dualshock|playstation|ps5|ps4|scuf/i.test(id) ? 'ps' : /045e|xbox|xinput/i.test(id) ? 'xbox' : '';
  if (padLogged !== id) { padLogged = id; try { window.consoleApi.lagLog('controller: ' + id + ' | mapping=' + p.mapping + ' buttons=' + p.buttons.length + ' axes=' + p.axes.length + ' | using ' + (k || '(unknown, keeping ' + padKind() + ')')); } catch {} }
  if (k && k !== padKindLive) { padKindLive = k; setPadKind(); }
  if (k && settings && settings.lastPadKind !== k && !padSaving) { padSaving = true; window.consoleApi.setSettings({ ...settings, lastPadKind: k }).then((x) => { if (x) settings.lastPadKind = x.lastPadKind; }).catch(() => {}).finally(() => { padSaving = false; }); }   // remembered, so the next start already knows which controller you use
}
const PSSYM = {
  A: '<svg class="gsv ps-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  B: '<svg class="gsv ps-o" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5"/></svg>',
  X: '<svg class="gsv ps-s" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>',
  Y: '<svg class="gsv ps-t" viewBox="0 0 24 24"><path d="M12 5.5l7 12H5z"/></svg>'
};
const PSTXT = { LB: 'L1', RB: 'R1', LT: 'L2', RT: 'R2', START: 'Options', BACK: 'Create' };
const PADSYM = { START: '<svg class="gsv" viewBox="0 0 24 24"><path d="M6 8h12M6 12h12M6 16h12"/></svg>', BACK: '<svg class="gsv" viewBox="0 0 24 24"><rect x="5" y="8.5" width="9" height="8" rx="1.4"/><path d="M9 8.5V6.5a1.4 1.4 0 011.4-1.4h6.2a1.4 1.4 0 011.4 1.4v6.2a1.4 1.4 0 01-1.4 1.4H14.5"/></svg>', DU: '<svg class=\"gsv\" viewBox=\"0 0 24 24\"><path d=\"M9 3h6v6h6v6h-6v6H9v-6H3V9h6z\" opacity=\".4\"/><path class=\"f\" d=\"M9 3h6v6H9z\"/></svg>', DD: '<svg class=\"gsv\" viewBox=\"0 0 24 24\"><path d=\"M9 3h6v6h6v6h-6v6H9v-6H3V9h6z\" opacity=\".4\"/><path class=\"f\" d=\"M9 15h6v6H9z\"/></svg>', DL: '<svg class=\"gsv\" viewBox=\"0 0 24 24\"><path d=\"M9 3h6v6h6v6h-6v6H9v-6H3V9h6z\" opacity=\".4\"/><path class=\"f\" d=\"M3 9h6v6H3z\"/></svg>', DR: '<svg class=\"gsv\" viewBox=\"0 0 24 24\"><path d=\"M9 3h6v6h6v6h-6v6H9v-6H3V9h6z\" opacity=\".4\"/><path class=\"f\" d=\"M15 9h6v6h-6z\"/></svg>', LS: '<svg class=\"gsv\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"6.5\"/><path d=\"M12 2v3M12 19v3M2 12h3M19 12h3\"/><text x=\"12\" y=\"14.8\" font-size=\"8.5\" font-weight=\"700\" text-anchor=\"middle\" stroke=\"none\" fill=\"currentColor\">L</text></svg>', RS: '<svg class=\"gsv\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"6.5\"/><path d=\"M12 2v3M12 19v3M2 12h3M19 12h3\"/><text x=\"12\" y=\"14.8\" font-size=\"8.5\" font-weight=\"700\" text-anchor=\"middle\" stroke=\"none\" fill=\"currentColor\">R</text></svg>', L3: '<svg class=\"gsv\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"6.5\" fill=\"currentColor\"/><text x=\"12\" y=\"14.8\" font-size=\"8.5\" font-weight=\"700\" text-anchor=\"middle\" stroke=\"none\" fill=\"#16181d\">L</text></svg>', R3: '<svg class=\"gsv\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"6.5\" fill=\"currentColor\"/><text x=\"12\" y=\"14.8\" font-size=\"8.5\" font-weight=\"700\" text-anchor=\"middle\" stroke=\"none\" fill=\"#16181d\">R</text></svg>' };
const XN = { A: 'A', B: 'B', X: 'X', Y: 'Y', LB: 'Left bumper', RB: 'Right bumper', LT: 'Left trigger', RT: 'Right trigger', L3: 'Left stick click', R3: 'Right stick click', DU: 'D-pad up', DD: 'D-pad down', DL: 'D-pad left', DR: 'D-pad right', BACK: 'View', START: 'Menu', GUIDE: 'Xbox button' };
const xn = (k) => XN[k] || k;
const padGlyph = (n) => { if (padKind() === 'ps') { if (PSSYM[n]) return `<b class="gl ps g${String(n).toLowerCase()}">${PSSYM[n]}</b>`; if (PSTXT[n]) return `<b class="gl ps pt g${String(n).toLowerCase()}">${PSTXT[n]}</b>`; } return `<b class="gl g${String(n).toLowerCase()}">${PADSYM[n] || esc(n)}</b>`; };
function renderHints(str) {
  return String(str).split(/\s{2,}/).filter(Boolean).map((seg) => {
    const m = seg.match(/^(A|B|X|Y|LB|RB|LT|RT|START|BACK):\s*(.+)$/);
    if (!m) return `<span class="hp">${esc(seg)}</span>`;
    return `<span class="hp">${padGlyph(m[1])}${esc(m[2])}</span>`;
  }).join('');
}
// HINTS-END
function notifPush(t, gid) { t = String(t || '').trim(); if (!t) return; const f = notifHist[0]; if (f && f.t === t && Date.now() - f.at < 4000) return; notifHist.unshift({ t, at: Date.now(), gid: gid || '' }); if (notifHist.length > 30) notifHist.pop(); notifUnread = true; }
function note(t, keep) { try { if (keep) notifPush(t, keep === true ? '' : keep); } catch {} const h = $('#hints'); h.classList.add('msg'); h.textContent = t; h.classList.remove('bump'); void h.offsetWidth; h.classList.add('bump'); clearTimeout(noteT); noteT = setTimeout(() => { h.classList.remove('msg'); h.innerHTML = renderHints(SCREENS[screen].hints); }, 5000); }
try { window.consoleApi.appVersion().then((v) => { window.__appVer = v; }); } catch {}
let toastQ = [], toastBusy = false;
function notify(title, body, gid, icon) {   // v1266: a real console pop-up (slides in at the top right, chime) and it is also saved in Control Center > Notifications
  try { notifPush(body ? title + ': ' + body : title, gid); } catch {}
  toastQ.push({ title: String(title || ''), body: String(body || ''), icon: icon || 'bell' }); if (toastQ.length > 4) toastQ.shift();
  if (!toastBusy) toastNext();
}
function toastNext() {
  const n = toastQ.shift(); if (!n) { toastBusy = false; return; }
  toastBusy = true;
  let el = document.getElementById('toast2'); if (!el) { el = document.createElement('div'); el.id = 'toast2'; document.body.appendChild(el); }
  el.innerHTML = '<div class="tz-i">' + (ICON[n.icon] || ICON.bell || '') + '</div><div class="tz-t"><b>' + esc(n.title) + '</b>' + (n.body ? '<small>' + esc(n.body) + '</small>' : '') + '</div>';
  el.classList.remove('out'); void el.offsetWidth; el.classList.add('on');
  try { SND.play('on'); } catch {}
  setTimeout(() => { el.classList.add('out'); el.classList.remove('on'); setTimeout(toastNext, 450); }, 5200);
}

/* ---------- controller-only lock: while a controller is connected, mouse and keyboard do nothing here ---------- */
let kbOpen = false;   // true only while the Pause-key menu is open in a keyboard-and-mouse game
const locked = () => !kbOpen;   // the mouse and keyboard do nothing in the console, except to move around that menu
window.addEventListener('DOMContentLoaded', () => updateLock());
function updateLock() { document.body.classList.toggle('padmode', locked()); document.documentElement.classList.toggle('padmode', locked()); }

/* ---------- settings ---------- */
function applySettings() {
  if (settings.musicVol == null) settings.musicVol = 0.3; if (settings.sfxVol == null) settings.sfxVol = 0.7;
  document.documentElement.style.setProperty('--ui', settings.scale);
  document.documentElement.classList.toggle('nomotion', !settings.motion);
  if (typeof SND !== 'undefined') SND.set({ sfx: settings.sfx !== false, music: settings.music !== false, musicVol: settings.musicVol, sfxVol: settings.sfxVol });
  window.__accentUser = !!settings.accent && settings.accent !== '#7cc4ff';   // a chip you picked wins; otherwise the accent comes from the wallpaper's own skin
  document.documentElement.style.setProperty('--accent', settings.accent);
  if (window.setBackdropTheme) setBackdropTheme(settings.theme || 'winter');
  document.documentElement.style.fontSize = (16 * settings.scale) + 'px';
}
async function change(patch) {
  settings = await window.consoleApi.setSettings({ ...settings, ...patch });
  applySettings();
  const idx = [...document.querySelectorAll('[data-nav]')].indexOf(document.activeElement);
  show(screen, idx);
}

/* ---------- screens ---------- */
const SCREENS = {
  home: {
    focus: '.xn, .xbig, .xq',
    get hints() { return `A: Select    ${settings.binds.search}: Search`; },
    html: () => homeHtml(),
  },
  library: {
    hints: 'B: back',
    html: () => `<h1>Library</h1><div class="list"><button class="item" data-nav data-go="home"><span>Your games will appear here in Stage 5</span><span>Back</span></button></div>`,
  },
  settings: {
    hints: 'A: Select    B: Back    LB: Previous    RB: Next',
    focus: '.st-c.cur',
    html: () => settingsHtml(),
  },
};

/* ---------- Settings: a sidebar of sections and a grid of tiles ---------- */
ICON.home = ico('<path d="M3.5 11.2L12 4l8.5 7.2"/><path d="M6 9.8V20h12V9.8"/><path d="M10 20v-5h4v5"/>');
ICON.flask = ico('<path d="M9.5 3h5M10.5 3v6L4.8 18.6A1.6 1.6 0 006.2 21h11.6a1.6 1.6 0 001.4-2.4L13.5 9V3"/><path d="M7.8 15h8.4"/>');
const SET_CATS = [['general', 'General'], ['account', 'Account'], ['library', 'Games & library'], ['devices', 'Devices & connections'], ['audio', 'Audio'], ['prefs', 'Preferences'], ['access', 'Ease of Access'], ['system', 'System']];
const catLabel = (k, l) => l;
let guideTab = 'profile', setCat = 'general', editing = null, ctlFrom = 'home', bindTabK = 'console', guideOn = false, guidePage = 'main', guidePrev = null, lastReal = null;
const stT = (ico2, label, attrs, val) => `<button class="st-t" data-nav ${attrs}>${ICON[ico2]}<span class="st-l">${label}${val === undefined || val === '' ? '' : `<small${val.attr ? '' : ''}>${val}</small>`}</span></button>`;
const stS = (ico2, k) => `<button class="st-t sl" data-nav data-adjust="${k}">${ICON[ico2]}<span class="st-l">${SLIDERS[k].label}<small data-val="${k}">${SLIDERS[k].fmt(settings[k])}</small><span class="track"><i class="fill" data-slider="${k}"></i></span></span></button>`;
const stOnOff = (ico2, label, act, k) => `<button class="st-t" data-nav data-act="${act}">${ICON[ico2]}<span class="st-l">${label}<small data-val="${k}" data-on="${settings[k] !== false ? 1 : 0}">${settings[k] !== false ? 'On' : 'Off'}</small></span></button>`;
let themeOpen = false;
function setTiles(c) {
  if (c === 'general') return stT('home', 'Home style', 'data-act="homestyle"', settings.homeStyle === 'classic' ? 'Classic (2020)' : 'New (2026)') + stT('apps', 'Customize your Home', 'data-go="widgets"') + stT('apps', 'Wallpaper &amp; theme', 'data-act="theme"', window.themeName ? themeName(settings.theme || 'winter') : 'Winter') + (themeOpen ? `<div class="th-dd">${(window.THEMES || []).map((t) => `<button class="th-o${t.id === (settings.theme || 'winter') ? ' on' : ''}" data-nav data-act="settheme" data-id="${t.id}"><img src="backdrops/thumb/${t.id}.jpg" alt="" draggable="false"><span>${esc(t.name)}</span></button>`).join('')}</div>` : '') + stT('library', 'Full screen', 'data-act="fullscreen"');
  if (c === 'account') return stT('pad', 'Name', 'data-act="pname"', esc(profileName())) + stT('star', 'Profile picture', 'data-act="pavatar"', settings.avatarFile ? 'Change' : 'Choose')
    + (settings.avatarFile ? stT('shield', 'Remove picture', 'data-act="pavatarrm"') : '') + stT('library', 'Steam', 'data-act="acct" data-p="steam"', acct.steam ? 'Signed in' : 'Sign in') + stT('library', 'Ubisoft Connect', 'data-act="acct" data-p="ubisoft"', acct.ubisoft ? 'Signed in' : 'Sign in') + stT('library', 'Epic Games', 'data-act="acct" data-p="epic"', acct.epic ? 'Signed in' : 'Sign in') + stT('library', 'Spotify (cover art and controls)', 'data-act="spotifysetup"', 'Set up');
  if (c === 'library') return stT('down', 'Rescan games', 'data-act="scan"') + stT('drive', 'Storage', 'data-tool="storage"', 'Game sizes and drives') + stT('drive', 'Steam API key (achievements and friends)', 'data-act="steamkey"', settings.steamKey ? 'Set' : 'Not set') + stT('library', 'SteamGridDB key (game cover art)', 'data-act="sgdbkey"', settings.sgdbKey ? 'Set' : 'Not set') + stT('search', 'RAWG key (descriptions, year, developer)', 'data-act="rawgkey"', settings.rawgKey ? 'Set' : 'Not set') + stT('library', 'Setup guide (opens on the second monitor)', 'data-act="setupguide"', 'Open');
  if (c === 'system') return stT('info', 'System info', 'data-act="sysinfo"', 'Console ' + (window.__appVer || '')) + stT('down', 'Updates', 'data-tool="upd"', 'Windows and console') + stT('gear', 'Backup & restore', 'data-tool="care"', 'Backup, restore, reset') + stT('power', 'Exit', 'data-act="quit"');
  if (c === 'devices') return stT('pad', 'Controller', 'data-go="controller"') + stS('sliders', 'deadzone') + stS('mouse', 'mouseSpeed') + stS('mouse', 'mouseCurve') + stT('net', 'Network', 'data-tool="wifi"', 'Wi-Fi and speed test') + stT('bt', 'Devices & screens', 'data-tool="dev"', 'Bluetooth and screen modes') + stT('gear', 'Display & sound', 'data-tool="win"', 'Sound, display, power mode');
  if (c === 'audio') return stOnOff('play', 'Music', 'music', 'music') + stS('play', 'musicVol') + stOnOff('play', 'Sounds', 'sfx', 'sfx') + stS('play', 'sfxVol');
  if (c === 'prefs') return stOnOff('play', 'Startup intro', 'intro', 'intro') + stT('play', 'Startup video (Xbox controller)', 'data-act="introvideo"', settings.introVideo ? 'Change' : 'Choose a file') + (settings.introVideo ? stT('shield', 'Remove Xbox startup video', 'data-act="introvideorm"') : '') + stT('play', 'Startup video (PlayStation controller)', 'data-act="introvideops"', settings.introVideoPs ? 'Change' : 'Choose a file') + (settings.introVideoPs ? stT('shield', 'Remove PlayStation startup video', 'data-act="introvideopsrm"') : '') + stT('play', 'Sign-in background video (PlayStation)', 'data-act="signbg"', settings.signBgVideo ? 'Change' : 'Choose a file') + (settings.signBgVideo ? stT('shield', 'Remove sign-in background video', 'data-act="signbgrm"') : '') + stT('pad', 'Controller type', 'data-act="padtype"', ({ auto: 'Automatic (' + (padKind() === 'ps' ? 'PlayStation' : 'Xbox') + ')', xbox: 'Xbox', ps: 'PlayStation' })[settings.padType || 'auto']) + `<button class="st-t" data-nav data-act="introenh">${ICON.play}<span class="st-l">Sharpen startup video (beta)<small>${settings.introEnhance === true ? 'On' : 'Off'}</small></span></button>` + stT('moon', 'Screensaver', 'data-act="saver"', (settings.saver == null ? 10 : settings.saver) ? 'After ' + (settings.saver == null ? 10 : settings.saver) + ' minutes idle' : 'Off');
  return stS('library', 'scale') + stOnOff('star', 'Animations', 'motion', 'motion');
}
const setPane = () => `<h2 class="st-h">${esc(catLabel(setCat, SET_CATS.find((c) => c[0] === setCat)[1]))}</h2><div class="st-g">${setTiles(setCat)}</div>`;
const settingsHtml = () => `<div class="st"><div class="st-s"><div class="st-top">${ICON.gear}${avatarSpan('sm')}<b>${esc(profileName())}</b></div>${SET_CATS.map(([k, l]) => `<button class="st-c${k === setCat ? ' cur' : ''}" data-nav data-cat="${k}">${catLabel(k, l)}</button>`).join('')}</div><div class="st-r">${setPane()}</div></div>`;
function setCatTo(k) {   // the tiles on the right follow the section you are on
  if (screen !== 'settings' || k === setCat || !SET_CATS.some((c) => c[0] === k)) return;
  editing = null; setCat = k;
  document.querySelectorAll('.st-c').forEach((e) => e.classList.toggle('cur', e.dataset.cat === k));
  const r = document.querySelector('.st-r'); if (!r) return;
  r.innerHTML = setPane(); applyDynamic(false); applyAvatars(); animateIn('.st-g > *');
}
function paneRefresh() {   // v807: redraw just the tiles in place (no slide-in, no full screen rebuild) and keep the Wallpaper tile focused
  const r = document.querySelector('.st-r'); if (!r) return;
  const top = document.querySelector('.st-g')?.parentElement?.scrollTop || 0;
  r.innerHTML = setPane(); applyDynamic(false); applyAvatars();
  const t = document.querySelector('[data-act="theme"]'); if (t) t.focus({ preventScroll: true });
}
function toggleEdit(el) {   // A on a slider: left and right change it, A or B again when you are done
  if (editing === el) { el.classList.remove('editing'); editing = null; return; }
  if (editing) editing.classList.remove('editing');
  editing = el; el.classList.add('editing'); note('Left and right to change');
}

/* ---------- Controller page, then the button layout ---------- */
// the controller drawn as a vector, so it stays sharp at any size (600 x 430 picture, top at y = -30)
const padArt = () => `<g stroke-linejoin="round">
  <path d="M95 30C100 -2 150 -22 205 -18L211 8C172 6 132 14 112 36Z M505 30C500 -2 450 -22 395 -18L389 8C428 6 468 14 488 36Z" fill="#1d1d1f" stroke="#3b3b3f" stroke-width="2"/>
  <path d="M200 8C230 2 265 6 300 16C335 6 370 2 400 8C440 12 470 22 495 40C540 80 590 200 598 300C604 350 560 398 520 394C490 390 470 360 440 335C410 305 370 296 300 296C230 296 190 305 160 335C130 360 110 390 80 394C40 398 -4 350 2 300C10 200 60 80 105 40C130 22 160 12 200 8Z" fill="#262626" stroke="#46484d" stroke-width="2.5"/>
  <path d="M176 14L206 62M424 14L394 62" fill="none" stroke="#3a3a3d" stroke-width="2"/>
  <circle cx="147" cy="120" r="48" fill="#2b2b2b" stroke="#3d3d41" stroke-width="2"/><circle cx="147" cy="120" r="36" fill="#1e1e1e" stroke="#3a3a3d"/><circle cx="147" cy="120" r="27" fill="#303030" stroke="#444" stroke-width="1.5"/>
  <circle cx="377" cy="210" r="50" fill="#2b2b2b" stroke="#3d3d41" stroke-width="2"/><circle cx="377" cy="210" r="37" fill="#1e1e1e" stroke="#3a3a3d"/><circle cx="377" cy="210" r="28" fill="#303030" stroke="#444" stroke-width="1.5"/>
  <circle cx="224" cy="217" r="47" fill="#2a2a2a" stroke="#38383c" stroke-width="2"/><path d="M209 187h30v15h15v30h-15v15h-30v-15h-15v-30h15z" fill="#1a1a1a" stroke="#3a3a3d" stroke-width="1.5"/>
  <circle cx="300" cy="52" r="23" fill="#f6f6f6"/><path d="M288 38C293 44 297 49 300 52C303 49 307 44 312 38M288 66C293 60 297 55 300 52C303 55 307 60 312 66" fill="none" stroke="#1c1c1c" stroke-width="5" stroke-linecap="round"/>
  <circle cx="257" cy="123" r="12" fill="#1c1c1c" stroke="#3b3b3f"/><rect x="251" y="120" width="8" height="6" rx="1.2" fill="none" stroke="#8d8d92" stroke-width="1.4"/><rect x="254" y="118" width="8" height="6" rx="1.2" fill="none" stroke="#8d8d92" stroke-width="1.4"/>
  <circle cx="343" cy="121" r="12" fill="#1c1c1c" stroke="#3b3b3f"/><path d="M337 117h12M337 121h12M337 125h12" stroke="#8d8d92" stroke-width="1.6" stroke-linecap="round"/>
  <g fill="#1c1c1c" stroke="#333" stroke-width="1.5"><circle cx="453" cy="82" r="21"/><circle cx="411" cy="123" r="21"/><circle cx="493" cy="123" r="21"/><circle cx="453" cy="162" r="21"/></g>
  <g font-family="Inter,Segoe UI,Arial,sans-serif" font-size="30" font-weight="700" text-anchor="middle"><text x="453" y="93" fill="#e9c53a">Y</text><text x="411" y="134" fill="#2f8fd0">X</text><text x="493" y="134" fill="#c62b30">B</text><text x="453" y="173" fill="#58a845">A</text></g>
  </g>`;
const padPaddles = () => `<g fill="none" stroke="#7d8088" stroke-width="2" stroke-dasharray="5 4"><rect x="-14" y="-36" width="28" height="72" rx="14" transform="translate(130 330) rotate(35)"/><rect x="-14" y="-36" width="28" height="72" rx="14" transform="translate(205 306) rotate(14)"/><rect x="-14" y="-36" width="28" height="72" rx="14" transform="translate(395 306) rotate(-14)"/><rect x="-14" y="-36" width="28" height="72" rx="14" transform="translate(470 330) rotate(-35)"/></g>`;
const padBackArt = () => `<defs><pattern id="gpt" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.3" fill="#3a3b40"/></pattern></defs>
  <path d="M95 30C100 -2 150 -22 205 -18L211 8C172 6 132 14 112 36Z M505 30C500 -2 450 -22 395 -18L389 8C428 6 468 14 488 36Z" fill="#26272a" stroke="#4a4c52" stroke-width="2"/>
  <path d="M118 8L196 -6M122 20L200 6M482 8L404 -6M478 20L400 6" stroke="#3b3c41" stroke-width="2" fill="none"/>
  <path d="M200 8C230 2 265 6 300 16C335 6 370 2 400 8C440 12 470 22 495 40C540 80 590 200 598 300C604 350 560 398 520 394C490 390 470 360 440 335C410 305 370 296 300 296C230 296 190 305 160 335C130 360 110 390 80 394C40 398 -4 350 2 300C10 200 60 80 105 40C130 22 160 12 200 8Z" fill="#1d1e21" stroke="#4a4c52" stroke-width="2.5"/>
  <path d="M60 140C40 200 20 270 30 320C36 350 70 380 100 360C130 335 140 280 120 190Z M540 140C560 200 580 270 570 320C564 350 530 380 500 360C470 335 460 280 480 190Z" fill="url(#gpt)" stroke="#34353a"/>
  <rect x="236" y="90" width="128" height="150" rx="16" fill="#26272b" stroke="#3b3c42" stroke-width="2"/><rect x="274" y="2" width="52" height="12" rx="4" fill="#0f0f11" stroke="#44464b"/>
  <path d="M262 262h76" stroke="#3b3c42" stroke-width="3" stroke-linecap="round"/>
  <g fill="#34363b" stroke="#6a6d74" stroke-width="2.5"><rect x="-17" y="-60" width="34" height="120" rx="17" transform="translate(150 270) rotate(18)"/><rect x="-15" y="-46" width="30" height="92" rx="15" transform="translate(228 236) rotate(7)"/><rect x="-15" y="-46" width="30" height="92" rx="15" transform="translate(372 236) rotate(-7)"/><rect x="-17" y="-60" width="34" height="120" rx="17" transform="translate(450 270) rotate(-18)"/></g>
  <g fill="#8d9097"><circle cx="150" cy="232" r="4"/><circle cx="450" cy="232" r="4"/><circle cx="228" cy="206" r="3.5"/><circle cx="372" cy="206" r="3.5"/></g>`;
const padSvg = () => `<img class="pad-img scuf wp-xb" src="scuf.png" alt="" draggable="false"><img class="pad-img scuf wp-ps" src="omega.png" alt="" draggable="false"><i class="pad-shadow"></i>`;
function padName() {
  const p = typeof pickPad === 'function' ? pickPad() : null;
  if (!p) return 'No controller found';
  if (padKind() === 'ps' && !/xbox|xinput|045e/i.test(p.id)) return 'SCUF Omega';
  return /xbox|xinput|045e/i.test(p.id) ? 'Xbox Wireless Controller' : (p.id.replace(/\(.*$/, '').trim().slice(0, 40) || 'Controller');
}
SCREENS.controller = {
  hints: 'A: Select    B: Back',
  focus: '.ctl-conf',
  html: () => `<div class="ctl"><div class="ctl-h"><span>Controller</span></div>
    <div class="ctl-u">${avatarSpan('md')}<span>${esc(profileName())}</span></div><div class="ctl-n">${esc(padName())}</div>
    <div class="ctl-pad">${padSvg()}</div>
    <button class="ctl-conf" data-nav data-go="binds">CONFIGURE</button>
    <div class="ctl-b"><button class="ctl-sq" data-nav data-act="ctlmore" data-cap="More options">${ICON.dots}</button><button class="ctl-sq" data-nav data-act="ctlsticks" data-cap="Stick and mouse feel">${ICON.flask}</button></div>
    <div class="ctl-cap"></div></div>`,
};
function ctlMenu(tile) { popMenu(tile, 'Controller', [['ctl:reset', 'Restore default buttons'], ['ctl:sticks', 'Stick and mouse feel'], ['ctl:bridge', 'PS5 controller bridge: install or repair']], { ctl: true }); }
function ctlAct(a) {
  if (a === 'ctl:reset') { change({ binds: DEF_BINDS_UI, mbinds: DEF_MBINDS_UI }); note('Buttons restored to default.'); }
  else if (a === 'ctl:sticks') { bindTabK = 'sticks'; show('binds'); }
  else if (a === 'ctl:bridge') { Promise.resolve(api.bridgeInstall()).then((r) => note(r && r.ok ? 'Setup is open in a black window. Say yes to the Windows admin prompt and wait until it says DONE.' : 'Could not open the setup.')).catch(() => {}); }
}
const BIND_TABS = [['console', 'Front'], ['back', 'Back'], ['sticks', 'Sticks'], ['vibration', 'Vibration'], ['test', 'Test']];
const ACT_NAMES = { console: { confirm: 'Select', back: 'Back', search: 'Search with keyboard', remove: 'Remove game' }, desktop: { left: 'Left click', right: 'Right click', kbd: 'Typing keyboard', enter: 'Enter key', esc: 'Escape key', back: 'Browser back' } };
const MODE_BTNS = { console: ['A', 'B', 'X', 'Y', 'BACK'], desktop: ['A', 'B', 'X', 'Y', 'LB', 'RB'] };
const ACT_SHORT = { console: { confirm: 'Select', back: 'Back', search: 'Search', remove: 'Remove' }, desktop: { left: 'Click', right: 'Right click', kbd: 'Keyboard', enter: 'Enter', esc: 'Escape', back: 'Browser back' } };
// the callout boxes: [box x, box y, x and y on the controller picture the line points to] (a 1000 x 600 canvas)
const MP = {LT: [280, 50, 372, 104], LB: [360, 50, 398, 123], BACK: [440, 50, 454, 163], START: [560, 50, 546, 163], RB: [640, 50, 602, 123], RT: [720, 50, 628, 104], L3: [165, 175, 382, 195], DU: [165, 255, 436, 241], DL: [165, 335, 417, 261], DR: [165, 415, 457, 261], DD: [165, 495, 436, 280], Y: [835, 175, 619, 166], B: [835, 255, 650, 195], A: [835, 335, 620, 224], X: [835, 415, 590, 194], R3: [835, 495, 563, 258]};
const MPBACK = {P2: [835, 290, 617, 308], P1: [835, 430, 561, 288], P3: [165, 290, 383, 308], P4: [165, 430, 442, 288]};
let mapView = 'front';
['scuf.png', 'scuf_back.png', 'omega.png', 'omega_back.png'].forEach((f) => { const i = new Image(); i.src = f; if (i.decode) i.decode().catch(() => {}); });
const FIXED = { console: { LB: 'Tabs', RB: 'Tabs', START: 'Switch profile', LT: 'Not used', RT: 'Not used', LS: 'Move', RS: 'Not used', L3: 'Mouse mode', R3: 'Mouse mode', DU: 'Move', DL: 'Move', DR: 'Move', DD: 'Move' },
  desktop: { BACK: 'Not used', START: 'Switch profile', LT: 'Not used', RT: 'Not used', LS: 'Mouse', RS: 'Scroll', L3: 'Mouse mode', R3: 'Mouse mode', DU: 'Arrow keys', DL: 'Arrow keys', DR: 'Arrow keys', DD: 'Arrow keys' } };
function mpLine(x, y, ex, ey) {   // the line stops just short of the control so it stays visible
  const dx = x - ex, dy = y - ey, d = Math.hypot(dx, dy) || 1, sx = ex, sy = ey;
  return `<line class="mp-ln" pathLength="1" x1="${x}" y1="${y}" x2="${sx.toFixed(1)}" y2="${sy.toFixed(1)}"/><circle class="mp-dot" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="3.6"/>`;
}
const mpSvg = () => '<div class="mp-3dslot"></div>';
function mountPad(back, intro = true) { const slot = document.querySelector('.mp-3dslot'); if (slot && window.PAD3D) PAD3D.mount(slot, back === undefined ? mapView === 'back' : back, intro); }
const PAD_SHORT = XN;
function mpBox(b) {
  const mode = bindTabK === 'back' ? 'console' : bindTabK, ok = MODE_BTNS[mode].includes(b), src = mode === 'console' ? settings.binds : settings.mbinds;
  const act = ok ? Object.keys(src).find((k) => src[k] === b) : '';
  const pv = /^P\d$/.test(b) ? (settings.paddles || {})[b] : '';
  const txt = ok ? (act ? (ACT_SHORT[mode][act] || ACT_NAMES[mode][act] || "Set") : 'Not used') : /^P\d$/.test(b) ? (pv ? PAD_SHORT[pv] : 'Not set') : (FIXED[mode][b] || 'Not used');
  return `<button class="mp-b mp-${b}${ok ? '' : ' fx'}${pv ? ' set' : ''}" data-nav data-mpb="${b}"><span class="mp-g">${padGlyph(b)}</span>${/^[ABXY]$/.test(b) ? '' : `<span class="mp-n">${/^P\d$/.test(b) ? 'Paddle ' + b.slice(1) : esc(xn(b))}</span>`}<span class="mp-a">${esc(txt)}</span></button>`;
}
let testing = false, testB = 0, xboxLit = 0, flipping = false, rtWas = false, stWas = false;
const TEST_CHIPS = [['A', 0], ['B', 1], ['X', 2], ['Y', 3], ['Left bumper', 4], ['Right bumper', 5], ['View', 8], ['Menu', 9], ['Left stick click', 10], ['Right stick click', 11], ['D-pad up', 12], ['D-pad down', 13], ['D-pad left', 14], ['D-pad right', 15], ['Xbox button', 99]];
const vibHtml = () => `<div class="mp-st">${stT('pad', 'Test both motors', 'data-vib="both"')}${stT('pad', 'Test the strong motor', 'data-vib="strong"')}${stT('pad', 'Test the weak motor', 'data-vib="weak"')}</div>`;
const testHtml = () => `
  <div class="mp-test${testing ? ' live' : ''}"><div class="tt-row"><div class="tt-box"><i class="tt-dot" data-tt="ls"></i><span>Left stick</span></div><div class="tt-box"><i class="tt-dot" data-tt="rs"></i><span>Right stick</span></div>
  <div class="tt-bars"><div class="tt-bar"><i data-tt="lt"></i><span>Left trigger</span></div><div class="tt-bar"><i data-tt="rt"></i><span>Right trigger</span></div></div></div>
  <div class="tt-btns">${TEST_CHIPS.map(([l, i]) => `<span class="tt-c" data-ti="${i}">${l}</span>`).join('')}</div></div>
  <div class="mp-tact">${stT('play', testing ? 'Hold B to stop' : 'Start test', 'data-act="testgo"')}${stT('sliders', 'Calibration', 'data-act="calibrate"')}</div>`;
function updateTest(pad) {
  document.querySelectorAll('[data-ti]').forEach((e) => { const i = Number(e.dataset.ti); e.classList.toggle('lit', i === 99 ? (pad.buttons.slice(16).some((b) => b.pressed) || performance.now() < xboxLit) : !!(pad.buttons[i] && pad.buttons[i].pressed)); });
  const dot = (k, x, y) => { const e = document.querySelector(`[data-tt="${k}"]`); if (e) { e.style.left = 50 + Math.max(-1, Math.min(1, x)) * 38 + '%'; e.style.top = 50 + Math.max(-1, Math.min(1, y)) * 38 + '%'; } };
  dot('ls', pad.axes[0] || 0, pad.axes[1] || 0); dot('rs', pad.axes[2] || 0, pad.axes[3] || 0);
  const bar = (k, i) => { const e = document.querySelector(`[data-tt="${k}"]`); if (e) e.style.width = Math.round(((pad.buttons[i] && pad.buttons[i].value) || 0) * 100) + '%'; };
  bar('lt', 6); bar('rt', 7);
}
function rumble(kind) {
  const p = pickPad(), a = p && p.vibrationActuator;
  if (!a || !a.playEffect) return note('Windows did not report vibration for this controller.');
  a.playEffect('dual-rumble', { startDelay: 0, duration: 650, strongMagnitude: kind === 'weak' ? 0 : 1, weakMagnitude: kind === 'strong' ? 0 : 1 }).catch(() => note('The vibration did not start.'));
}
const padSnap = () => ({ binds: { ...settings.binds }, mbinds: { ...settings.mbinds }, paddles: { ...(settings.paddles || {}) }, deadzone: settings.deadzone, mouseSpeed: settings.mouseSpeed, mouseCurve: settings.mouseCurve });
async function switchPadProfile(n) {   // three profiles: each keeps its own buttons, paddle notes and stick feel
  const cur = settings.padProfile || 0; if (n === cur) return;
  const navs0 = [...document.querySelectorAll('[data-nav]')], fi = Math.max(0, navs0.indexOf(document.activeElement));
  const list = [0, 1, 2].map((i) => (settings.padProfiles || [])[i] || null);
  list[cur] = padSnap();
  const t = list[n] || padSnap();
  list[n] = t;
  await change({ padProfile: n, padProfiles: list, ...t });
  const navs1 = [...document.querySelectorAll('[data-nav]')]; const nf = navs1[Math.min(fi, navs1.length - 1)]; if (nf) nf.focus({ preventScroll: true });
  note('Profile ' + (n + 1));
}
SCREENS.binds = {
  hints: 'A: Change button    B: Back    LB: Previous    RB: Next    START: Profile',
  focus: '.mp-b, .mp-st .st-t, .mp-tact .st-t',
  html: () => {
    mapView = bindTabK === 'back' ? 'back' : 'front';
    const body = bindTabK === 'sticks' ? `<div class="mp-st">${stS('sliders', 'deadzone')}${stS('mouse', 'mouseSpeed')}${stS('mouse', 'mouseCurve')}</div>`
      : bindTabK === 'vibration' ? vibHtml() : bindTabK === 'test' ? testHtml()
      : `<div class="mp-d${mapView === 'back' ? ' back' : ''}">${mpSvg()}${Object.keys(mapView === 'back' ? MPBACK : MP).map(mpBox).join('')}</div><button class="mp-rs" data-nav data-act="resetbinds">Restore to default</button>`;
    return `<div class="mp"><h1 class="mp-t">Button layout</h1>
    <div class="mp-tabs">${BIND_TABS.map(([k, l]) => `<button class="mp-tb${k === bindTabK ? ' cur' : ''}" tabindex="-1" data-btab="${k}">${l}</button>`).join('')}</div>
    <div class="mp-prof"><span>Profile</span>${[0, 1, 2].map((i) => `<button class="mp-vb${i === (settings.padProfile || 0) ? ' cur' : ''}" tabindex="-1" data-prof="${i}">${i + 1}</button>`).join('')}</div>${body}</div>`;
  },
};
function mapPick(el) {
  const b = el.dataset.mpb, mode = bindTabK === 'back' ? 'console' : bindTabK;
  if (/^P\d$/.test(b)) { const cur = (settings.paddles || {})[b] || ''; return popMenu(el, 'Paddle ' + b.slice(1) + ' is set to', [['pd:', (cur ? '' : '\u2713  ') + 'Not set'], ...Object.entries(PAD_SHORT).map(([k, l]) => ['pd:' + k, (cur === k ? '\u2713  ' : '') + l])], { padBtn: b }); }
  if (!MODE_BTNS[mode].includes(b)) return note( b === 'L3' || b === 'R3' ? 'Click both sticks in to turn mouse mode on or off.' : b === 'LB' || b === 'RB' ? 'Bumpers always switch tabs and sections.' : 'This control can\'t be changed here.');
  const src = mode === 'console' ? settings.binds : settings.mbinds;
  popMenu(el, xn(b), Object.entries(ACT_NAMES[mode]).map(([k, l]) => ['bd:' + k, (src[k] === b ? '✓  ' : '') + l]), { bindBtn: b, bmode: mode });
}
function assignBind(mode, act, name) {
  const key = mode === 'console' ? 'binds' : 'mbinds', cur = { ...settings[key] };
  if (cur[act] === name) return;
  const other = Object.keys(cur).find((x) => x !== act && cur[x] === name);
  if (other) cur[other] = cur[act];
  cur[act] = name;
  change({ [key]: cur });
  note(other ? '“' + ACT_NAMES[mode][other] + '” moved to ' + xn(cur[other]) + '.' : 'Saved.');
}

/* ---------- the guide: a panel that slides in from the left on the Xbox button ---------- */
/* Spotify in the Xbox-button menu: the song that is playing and a way back in */
let spLive = { open: false, title: '' };
let spTitlePlaying = false;   // v1264: Spotify is playing in the console's own player (its title shows the song), even when the Spotify account is not signed in for the controls
function spTitleOf(s) { if (!s || !s.open) return ''; const t = String(s.title || '').replace(/\s*[\u2022\-\u2013|]\s*Spotify\s*$/i, '').trim(); return (t && !/^spotify(\s*[\u2013\-]\s*web player.*)?$/i.test(t) && !/web player/i.test(t)) ? t : ''; }
setInterval(() => { try { window.consoleApi.spState().then((s) => { if (s) { spLive = s; try { spTitlePlaying = typeof s.playing === 'boolean' ? s.playing : !!spTitleOf(s); if (!homeNp.on) SND.spot(spTitlePlaying); } catch {} } }).catch(() => {}); } catch {} }, 3000);
function spPlayingNow() {
  let title = '';
  if (spLive.open) { const t = String(spLive.title || '').replace(/\s*[\u2022\-\u2013|]\s*Spotify\s*$/i, '').trim(); if (t && !/^spotify(\s*[\u2013\-]\s*web player.*)?$/i.test(t) && !/web player/i.test(t)) title = t; }
  if (!title && sp.now && sp.now.item && sp.now.is_playing) title = sp.now.item.name + (spArtists(sp.now.item) ? ' \u00b7 ' + spArtists(sp.now.item) : '');
  if (!title && !spLive.open) return '';
  if (!npBusy) setTimeout(npPoll, 60); npRecent();
  const gb = (k, ic, cur, big) => `<button class="gd-nb${cur ? ' cur' : ''}${big ? ' big' : ''}" data-nav data-gd="npc:${k}" id="gnb-${k}">${SPI[ic]}</button>`;
  if (homeNp.on) {
    const rec = (homeNp.recent || []).map((r) => `<button class="gd-rc" data-nav data-gd="npplay:${esc(r.uri)}"><i class="gd-rci" data-gimg="${esc(r.img)}"></i><span><b>${esc(r.name)}</b><small>${esc(r.sub)}</small></span></button>`).join('');
    setTimeout(() => document.querySelectorAll('[data-gimg]').forEach((e) => { const u = e.dataset.gimg; if (/^https:\/\/[a-z0-9.-]*(scdn\.co|spotifycdn\.com)\//i.test(u)) e.style.backgroundImage = `url("${u}")`; }), 0);
    return `<div class="gd-pl">Spotify</div><div class="gd-np"><div class="gd-npi"><i class="gd-npc" id="gnpc"></i><span class="gd-npt"><b id="gnpb">${esc(homeNp.title)}</b><small id="gnps">${esc(homeNp.artist)}</small></span></div><div class="gd-npr">${gb('prev', 'prev')}${gb('rep', 'repeat', homeNp.rep !== 'off')}${gb('pp', homeNp.playing ? 'pause' : 'play', false, true)}${gb('shuf', 'shuffle', homeNp.shuf)}${gb('next', 'next')}</div><div class="gd-npbar"><i id="gnbar"></i></div><div class="gd-npts"><span id="gnt0">0:00</span><span id="gnt1">0:00</span></div><button class="gd-vol" id="gvol" data-nav data-gd="vol"><span>Volume</span><span class="gd-vb"><i id="gvbar" style="width:${Math.max(0, homeNp.vol)}%"></i></span><b id="gvn">${homeNp.vol >= 0 ? homeNp.vol : '\u2013'}</b></button></div>${gdI('', 'Launch Spotify', 'data-gd="spresume"')}${rec ? `<div class="gd-pl">Recently played</div>${rec ? psSec('Recently played') + rec : ''}` : ''}<div class="gd-sep"></div>`;
  }
  const sg = (spLive.song || '').trim(), ar = (spLive.artist || '').trim();
  if (spLive.open && sg) {   // v1265: transport buttons that press the web player's own controls, no Spotify account sign-in needed
    const wb = (k, ic, big) => `<button class="gd-nb${big ? ' big' : ''}" data-nav data-gd="spw:${k}" id="gspw-${k}">${SPI[ic]}</button>`;
    return `<div class="gd-pl">Spotify</div><div class="gd-np"><div class="gd-npi"><span class="gd-npt"><b>${esc(sg)}</b><small>${esc(ar)}</small></span></div><div class="gd-npr">${wb('prev', 'prev')}${wb('pp', spLive.playing ? 'pause' : 'play', true)}${wb('next', 'next')}</div></div>${gdI('play', 'Open Spotify', 'data-gd="spresume"')}<div class="gd-sep"></div>`;
  }
  return `<div class="gd-pl">Spotify</div>${title ? `<p class="gd-t">\u266a ${esc(title)}</p>` : '<p class="gd-t">Open in the background</p>'}${gdI('play', 'Resume Spotify', 'data-gd="spresume"')}<div class="gd-sep"></div>`;
}
let gdRow = false, psClockT = null, cbattPct = -1, notifHist = [], notifUnread = false, gbTab = 'parties';
const psOn = () => guideOn && document.body.classList.contains('gd-ps');
function psEnterRow() { const f = document.querySelector('#guide .gd-body [data-nav]'); if (!f) return; gdRow = true; document.body.classList.add('gd-row'); f.focus({ preventScroll: true }); SND.play('move'); }
function psLeaveRow() { psHintSet(null); try { $('#hints').innerHTML = renderHints('A: Open    B: Close    LB: Previous    RB: Next'); } catch {} gdRow = false; document.body.classList.remove('gd-row'); const c = document.activeElement; if (c && c.blur && c.closest && c.closest('#guide')) c.blur(); }
const psTime = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const psClock = () => `<b>${psTime()}</b><small>${new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</small>`;
function psExtras() {   // the clock and the Customize hint, like the PS5 Control Center
  return `<div class="gd-clock">${psClock()}</div><button class="gd-cust" tabindex="-1" data-gd="pscust"><svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14"/></svg>Customize</button>`;
}
const gdI = (ico2, label, attrs) => `<button class="gd-i" data-nav ${attrs}>${ico2 ? ICON[ico2] : '<i class="gd-s"></i>'}<span>${label}</span></button>`;
ICON.bell = ico('<path d="M6 16V11a6 6 0 0112 0v5l1.6 2H4.4z"/><path d="M10 20.5a2.2 2.2 0 004 0"/>');
ICON.speaker = ico('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 010 6M18 6.8a7.5 7.5 0 010 10.4"/>');
ICON.mic = ico('<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3"/>');
ICON.music = ico('<path d="M9 17.5V5.5l10-2v12"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>');
ICON.switcher = ico('<rect x="4" y="7" width="13" height="10" rx="1.6"/><path d="M8 4h12v10"/>');
const GD_TABS_X = [['profile', 'profile'], ['notifs', 'bell'], ['friends', 'people'], ['library', 'library'], ['settings', 'gear']];
const GD_TABS_PS = [['home', 'home', 'Home'], ['capture', 'cam', 'Capture'], ['notifs', 'bell', 'Notifications'], ['friends', 'gamebase', 'Game Base'], ['music', 'music', 'Music'], ['volume', 'speaker', 'Sound'], ['party', 'mic', 'Mic'], ['controller', 'pad', 'Accessories'], ['profile', 'profile', 'Profile'], ['power', 'power', 'Power']];
let psCust = false, psGrab = false;
const psFixed = (k) => k === 'home' || k === 'power';
function psTabsAll() {   // your order and your hidden icons (Home and Power always stay)
  const base = GD_TABS_PS.filter((t) => t[0] !== 'party' || psIn()), ord = (settings && settings.psOrder) || [];
  if (!ord.length) return base;
  const pos = (t) => { const k = t[0], i = ord.indexOf(k); if (i >= 0) return i; let d = GD_TABS_PS.findIndex((x) => x[0] === k) - 1; while (d >= 0 && ord.indexOf(GD_TABS_PS[d][0]) < 0) d--; return d < 0 ? -1 : ord.indexOf(GD_TABS_PS[d][0]) + 0.5; };
  return base.map((t) => [t, pos(t)]).sort((x, y) => x[1] - y[1]).map((x) => x[0]);
}
const psHidden = (k) => !psFixed(k) && ((settings && settings.psHide) || []).includes(k);
const gdTabs = () => padKind() === 'ps' ? psTabsAll().filter((t) => psCust || !psHidden(t[0])) : GD_TABS_X;   // four tabs: you, friends and party, games, settings
let frOff = false;
const gdStrip = () => gdTabs().map(([k, ic, lb]) => {
  let inner = k === 'profile' ? avatarSpan('sm') : (padKind() === 'ps' ? pci(ic) : ICON[ic]), bd = '';
  if (padKind() === 'ps') {
    if (k === 'library') { const g = dash ? games.find((x) => x.title === dash.title) : (rcList()[0] || null), u = g ? (sqMap.has(g.id) ? 'ctheme://img/' + sqMap.get(g.id) : gImg(g)) : '';  }
    if (k === 'friends' && frAny() && frOnline()) bd = `<em class="gd-bd on">${frOnline()}</em>`;
    if (k === 'notifs' && notifUnread) bd = '<em class="gd-bd dot"></em>';
    if (k === 'controller' && cbattPct >= 0) bd = `<em class="gd-bd bat">${cbattPct}%</em>`;
    if (k === 'profile') bd = '<em class="gd-bd dot on"></em>';
  }
  if (padKind() !== 'ps' && k === 'notifs' && notifUnread) bd = '<em class="gd-bd dot"></em>';
  const ck = padKind() === 'ps' && psCust ? `<i class="gd-ck${psHidden(k) ? '' : ' on'}${psFixed(k) ? ' fx' : ''}"></i>` : '';
  return `<button class="gd-tb${k === (guideTab === 'recents' ? 'library' : guideTab) ? ' cur' : ''}${psCust && psGrab && k === guideTab ? ' grab' : ''}${padKind() === 'ps' && psHidden(k) ? ' hid' : ''}" tabindex="-1" data-l="${lb || ''}" data-gd="tab:${k}">${inner}${bd}${ck}</button>`;
}).join('');
const customIds = new Set();
async function loadPosters() {
  try {   // covers you chose yourself come first and always win
    const cu = api.coversCustom ? await api.coversCustom(games.map((g) => ({ id: g.id, title: g.title }))) : null;
    if (cu) { for (const gid of Object.keys(cu)) { customIds.add(gid); posterMap.set(gid, cu[gid]); document.querySelectorAll(`.lt[data-game="${CSS.escape(gid)}"], .xq[data-game="${CSS.escape(gid)}"], .xn[data-game="${CSS.escape(gid)}"]`).forEach((el) => { el.dataset.img = 'ctheme://img/' + cu[gid]; el.classList.remove('noart'); el.removeAttribute('data-hue'); }); } applyCovers(); refreshThumbs(); }
  } catch {}
  const ids = games.filter((g) => g.steamId && /^\d+$/.test(String(g.steamId)) && !posterMap.has(g.id)).map((g) => [g.id, String(g.steamId)]);
  for (let k = 0; k < ids.length; k += 20) {
    const chunk = ids.slice(k, k + 20); let r = null;
    try { r = await api.posters(chunk.map((c) => c[1])); } catch {}
    if (!r) continue;
    let any = false;
    for (const [gid, sid] of chunk) if (r[sid]) { posterMap.set(gid, r[sid]); any = true; document.querySelectorAll(`.lt[data-game="${CSS.escape(gid)}"], .xq[data-game="${CSS.escape(gid)}"], .xn[data-game="${CSS.escape(gid)}"]`).forEach((el) => { el.dataset.img = 'ctheme://img/' + r[sid]; el.classList.remove('noart'); el.removeAttribute('data-hue'); }); }
    if (any) { applyCovers(); refreshGxArt(); refreshLpArt(); refreshThumbs(); }
  }
  if (api.covers) {   // everything that is not on Steam: look the title up for real box art (SteamGridDB with your key, or the Steam store)
    const rest = games.filter((g) => !posterMap.has(g.id) && !coverTried.has(g.id)).map((g) => ({ id: g.id, title: g.title, steamId: g.steamId ? String(g.steamId) : '' }));
    for (let k = 0; k < rest.length; k += 12) {
      const chunk = rest.slice(k, k + 12); chunk.forEach((c) => coverTried.add(c.id)); let r = null;
      try { r = await api.covers(chunk); } catch {}
      if (!r) continue; let any = false;
      for (const c of chunk) if (r[c.id]) { posterMap.set(c.id, r[c.id]); any = true; document.querySelectorAll(`.lt[data-game="${CSS.escape(c.id)}"], .xq[data-game="${CSS.escape(c.id)}"], .xn[data-game="${CSS.escape(c.id)}"]`).forEach((el) => { el.dataset.img = 'ctheme://img/' + r[c.id]; el.classList.remove('noart'); el.removeAttribute('data-hue'); }); }
      if (any) { applyCovers(); refreshGxArt(); refreshLpArt(); refreshThumbs(); }
    }
  }
}
function refreshLpArt() { const p = $('#lpanel'); if (!p || !p.dataset.gid) return; const g = games.find((x) => x.id === p.dataset.gid), u = g ? gImg(g) : ''; if (!u) return; p.querySelectorAll('.lpbg, .lpfg').forEach((e) => { e.dataset.img = u; }); applyCovers(); }
function refreshGxArt() { const el = document.querySelector('.gxart'); if (!el || screen !== 'game') return; if (sqMap.has(gameId)) { el.dataset.sq = 'ctheme://img/' + sqMap.get(gameId); el.classList.remove('noart'); el.removeAttribute('data-hue'); applyCovers(); } else if (posterMap.has(gameId)) { el.dataset.img = 'ctheme://img/' + posterMap.get(gameId); el.classList.remove('noart'); el.removeAttribute('data-hue'); applyCovers(); } }
const frList = () => (friendsData && friendsData.ok ? friendsData.friends : []);
const frOnline = () => (friendsData && friendsData.ok ? friendsData.online : 0);
const frAny = () => !!(friendsData && friendsData.ok);
let vwWas = false, friendsData = null, friendsBusy = false, friendsSig = '';
const frStatus = (f) => f.game ? (f.x ? f.game : 'Playing ' + f.game) : f.state === 1 || f.state >= 5 ? 'Online' : f.state === 2 ? 'Busy' : f.state === 3 ? 'Away' : f.state === 4 ? 'Snoozing' : 'Offline' + (f.last ? ' \u00b7 ' + ago(f.last) : '');
const frCls = (f) => f.game ? 'game' : f.state === 1 || f.state >= 5 ? 'on' : f.state >= 2 ? 'away' : 'off';
const frAv = (f) => `<span class="gd-fa ${frCls(f)}">${f.img ? `<img src="ctheme://img/${esc(f.img)}" alt="" draggable="false">` : esc((f.name || '?').charAt(0).toUpperCase())}<i></i></span>`;
const frRow = (f) => `<button class="gd-fr" data-nav data-gd="friend:${f.x ? 'x' : ''}${esc(f.id)}">${frAv(f)}<span class="gd-ft"><b>${esc(f.name)}</b><small>${esc(frStatus(f))}</small></span></button>`;
const rcList = () => games.filter((g) => g.title && g.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed);
const rcRow = (g) => `<button class="gd-rc" data-nav data-gd="game:${esc(g.id)}"><i class="th${gImg(g) ? '' : ' noart'}" data-img="${esc(sqMap.has(g.id) ? 'ctheme://img/' + sqMap.get(g.id) : gImg(g))}"${sqMap.has(g.id) ? ` data-sq="ctheme://img/${esc(sqMap.get(g.id))}"` : ''}${gImg(g) ? '' : ` data-hue="${hue(g.title)}"`}></i><span class="gd-ft"><b>${esc(g.title)}</b><small>${esc(g.source || 'Game')}${g.lastPlayed ? ' \u00b7 ' + ago(g.lastPlayed) : ''}</small></span></button>`;
async function loadFriends(force) {
  if (friendsBusy) return; friendsBusy = true;
  try {
    const r = await api.friends(!!force); if (!r) return;
    const sig = JSON.stringify(r); if (sig === friendsSig) return; friendsSig = sig; friendsData = r;
    if (guideOn && guidePage === 'main' && (guideTab === 'friends' || guideTab === 'profile')) {
      const els = [...document.querySelectorAll('#guide .gd-body [data-nav]')], k = els.indexOf(document.activeElement);
      renderGuide(k >= 0 ? k : undefined, true);
    }
  } catch {} finally { friendsBusy = false; }
}
setInterval(() => { if (guideOn) loadFriends(); }, 60 * 1000);
function gdSide() {   // Home, Library, Friends and Recents, laid out like the Xbox sidebar
  const fr = frList();
  const frHtml = !friendsData ? '<p class="gd-t">Looking for your friends\u2026</p>' : !frAny() ? `<button class="gd-i" data-nav data-gd="tab:friends">${ICON.people}<span>Set up Xbox / Steam friends</span></button>`
    : `<button class="gd-frs" data-nav data-gd="tab:friends"><span class="gd-fav">${fr.slice(0, 4).map(frAv).join('')}</span><span class="gd-fc">${frOnline()} of ${fr.length} friends online</span></button>`;
  const rc = rcList().slice(0, 3);
  return `${gdI('home', 'Home', 'data-gd="home"')}${gdI('bars', 'Library', 'data-gd="openlib"')}<div class="gd-sep"></div>
    <div class="gd-pl gd-sec">${ICON.people}Friends</div>${frHtml}<div class="gd-sep"></div>
    <div class="gd-pl gd-sec">${ICON.recent}Recents</div>${rc.length ? rc.map(rcRow).join('') + `<button class="gd-i gd-more" data-nav data-gd="tab:recents"><span>See all recents</span></button>` : '<p class="gd-t">Games you play will show up here.</p>'}<div class="gd-sep"></div>`;
}

let partyState = null, partyList = null, partyBusy = false, dcWin = false;
const ptDot = (m) => `<span class="gd-fa ${m.speaking ? 'game' : 'on'}" data-pt="${esc(m.id)}">${esc((m.name || '?').charAt(0).toUpperCase())}<i></i></span>`;
const ptOnlyMine = (l) => (l || []).filter((g) => /frqngu/i.test((g.name || '').replace(/[^a-z]/gi, '')));   // only the frqngus server, never another one
function partyJoinPage() {
  if (!partyList) { api.partyList().then((x) => { partyList = x && x.ok ? ptOnlyMine(x.list) : []; if (guideOn && guidePage === 'ptjoin') renderGuide(); }).catch(() => { partyList = []; }); return '<h2 class="gd-h">Join a voice channel</h2><p class="gd-t">Looking at your servers…</p>'; }
  return `<h2 class="gd-h">Join a voice channel</h2>${partyList.length ? partyList.map((g) => `<div class="gd-pl">${esc(g.name)}</div>${g.channels.map((c) => gdI('headset', esc(c.name), `data-gd="pt:join:${esc(c.id)}"`)).join('')}`).join('') : '<p class="gd-t">No voice channels found.</p>'}${gdI(null, 'Back', 'data-gd="pt:back"')}`;
}
function partyInline() {   // the Party block on the first tab of the Xbox menu, like on Xbox
  const s = partyState, open = gdI('headset', dcWin ? 'Use Discord with the controller cursor' : 'Share or watch a screen', 'data-gd="dc:raise"') + (dcWin ? gdI(null, 'Done, hide Discord', 'data-gd="dc:hide"') : '');
  const head = `<div class="gd-pl gd-sec">${ICON.headset}Party</div>`;
  const join = gdI('people', 'Join voice channel', 'data-gd="pt:quick"');   // always there, even while Discord is still connecting
  if (!s || !s.connected) return `${head}${join}<div class="gd-sep"></div>`;
  if (s.auth === 'approve') return `${head}<p class="gd-t">Discord is asking to connect. Click Authorize in the Discord window.</p>${open}<div class="gd-sep"></div>`;
  if (s.auth !== 'ok') return `${head}${join}<div class="gd-sep"></div>`;
  if (!s.channel) return `${head}${join}<div class="gd-sep"></div>`;
  const row = (m) => `<div class="gd-fr" data-pt-row>${ptDot(m)}<span class="gd-ft"><b>${esc(m.name)}</b><small>${m.deaf ? 'Deafened' : m.mute ? 'Muted' : 'Connected'}</small></span></div>`;
  return `${head}<p class="gd-t">${esc(s.channel.name)} · ${s.members.length} in the channel</p>${s.members.slice(0, 8).map(row).join('')}${gdI('headset', s.me.mute ? 'Unmute' : 'Mute', 'data-gd="pt:mute"')}${gdI('headset', s.me.deaf ? 'Undeafen' : 'Deafen', 'data-gd="pt:deaf"')}${open}${gdI(null, 'Leave voice channel', 'data-gd="pt:leave"')}<div class="gd-sep"></div>`;
}


const fi = (d) => `<svg class="ico pcf" viewBox="0 0 24 24">${d}</svg>`;
const PSICO = {
  home: fi('<path d="M12 2.9 2.6 11.3a1 1 0 0 0 .7 1.7H5v7a1 1 0 0 0 1 1h3.4v-5.4h5.2V22H18a1 1 0 0 0 1-1v-8h1.7a1 1 0 0 0 .7-1.7z"/>'),
  library: fi('<path fill-rule="evenodd" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm3.2 5.2v7.6l6.2-3.8z"/>'),
  bell: fi('<path d="M12 2.6a1.4 1.4 0 0 1 1.4 1.4v.4A6.2 6.2 0 0 1 18.2 10.5v3.8l2 2.5v1.2H3.8v-1.2l2-2.5v-3.8A6.2 6.2 0 0 1 10.6 4.4V4A1.4 1.4 0 0 1 12 2.6z"/><path d="M9.5 19.6h5a2.5 2.5 0 0 1-5 0z"/>'),
  gamebase: fi('<circle cx="12" cy="6.9" r="3"/><path d="M6.6 14.6c.3-2.9 2.4-4.7 5.4-4.7s5.1 1.8 5.4 4.7z"/><path ' + 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M3.2 16.4c0 2.2 4.2 3.9 8.8 3.9s8.8-1.7 8.8-3.9"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M3.2 16.4c0-1.3 1.7-2.4 3.8-3M20.8 16.4c0-1.3-1.7-2.4-3.8-3"/>'),
  music: fi('<path d="M8.6 4.4 20 2.2v13.4a3.2 3.2 0 1 1-2.2-3V7.1L10.8 8.5v9.1A3.2 3.2 0 1 1 8.6 14.6z"/>'),
  speaker: fi('<path d="M3 9.4h3.9L12.4 4.6v14.8l-5.5-4.8H3z"/><path ' + 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M15.8 9a4.3 4.3 0 0 1 0 6M18.7 6.2a8.2 8.2 0 0 1 0 11.6"/>'),
  mic: fi('<rect x="8.6" y="2.6" width="6.8" height="11.6" rx="3.4"/><path ' + 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M5.6 11.2a6.4 6.4 0 0 0 12.8 0M12 17.6v3.2M8.6 20.8h6.8"/>'),
  pad: fi('<path fill-rule="evenodd" d="M7.7 7.6h8.6c2.4 0 4.1 1.7 4.6 4.1l1 4.5c.3 1.7-.6 3-2.2 3-1 0-1.7-.5-2.3-1.4l-1-1.5a1.8 1.8 0 0 0-1.5-.8H9.4a1.8 1.8 0 0 0-1.5.8l-1 1.5c-.6.9-1.3 1.4-2.3 1.4-1.6 0-2.5-1.3-2.2-3l1-4.5c.5-2.4 2.2-4.1 4.6-4.1zM7.9 10v1.1H6.8v1.3h1.1v1.1h1.3v-1.1h1.1v-1.3H9.2V10zM15.6 10.7a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8zm2.2 2.2a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8z"/>'),
  power: fi('<path ' + 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 3v8.4M7 6.2a8.2 8.2 0 1 0 10 0"/>'),
  bars: fi('<rect x="3" y="4" width="4.6" height="16" rx="1.2"/><rect x="9.2" y="4" width="4.6" height="16" rx="1.2"/><path d="m15.8 5.8 4-1.1 2.2 14.7-4 1.1z"/>'),
  apps: fi('<rect x="3.5" y="3.5" width="7.2" height="7.2" rx="2"/><rect x="13.3" y="3.5" width="7.2" height="7.2" rx="2"/><rect x="3.5" y="13.3" width="7.2" height="7.2" rx="2"/><rect x="13.3" y="13.3" width="7.2" height="7.2" rx="2"/>'),
  trophy: fi('<path d="M7 3.5h10v6.2a5 5 0 0 1-10 0z"/><path ' + 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M7 5.5H3.8c0 3.3 1.2 5 3.6 5.4M17 5.5h3.2c0 3.3-1.2 5-3.6 5.4M12 14.7v3.2"/><path d="M7.6 19.4h8.8V21H7.6z"/>'),
  cam: fi('<path fill-rule="evenodd" d="M8.6 4.8 7.6 6.5H5.3A2.3 2.3 0 0 0 3 8.8v9A2.3 2.3 0 0 0 5.3 20h13.4a2.3 2.3 0 0 0 2.3-2.3v-9a2.3 2.3 0 0 0-2.3-2.3h-2.3l-1-1.7zM12 17.2a3.8 3.8 0 1 1 0-7.6 3.8 3.8 0 0 1 0 7.6z"/>'),
  film: fi('<path fill-rule="evenodd" d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm6 5.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zm0 2.4a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z"/>'),
  view: fi('<path d="M5.4 8.4h9.4a2.4 2.4 0 0 1 2.4 2.4v8.4a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 19.2v-8.4a2.4 2.4 0 0 1 2.4-2.4z"/><path ' + 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8 5h9.6A2.4 2.4 0 0 1 20 7.4V16"/>'),
  monitor: fi('<path d="M5.2 3.8h13.6a2.2 2.2 0 0 1 2.2 2.2v9a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 15V6a2.2 2.2 0 0 1 2.2-2.2z"/><path ' + 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 17.2v3.4M8.2 20.6h7.6"/>'),
  paint: fi('<path ' + 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/>'),
  tools: fi('<path d="M15.2 3.6a5 5 0 0 0-5.3 6.6l-6 6a2.3 2.3 0 0 0 3.2 3.3l6-6A5 5 0 0 0 20.6 8l-3 3-2.8-.8-.8-2.8 3-3a5 5 0 0 0-1.8-.8z"/>'),
  play: fi('<path fill-rule="evenodd" d="M12 2.8a9.2 9.2 0 1 1 0 18.4 9.2 9.2 0 0 1 0-18.4zM10 8v8l6.2-4z"/>'),
  info: fi('<path fill-rule="evenodd" d="M12 2.8a9.2 9.2 0 1 1 0 18.4 9.2 9.2 0 0 1 0-18.4zm-.9 8.4v5.6h1.8v-5.6zM12 7.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"/>'),
  people: fi('<circle cx="9" cy="8" r="3.4"/><path d="M2.8 19.6c.3-3.6 2.8-5.8 6.2-5.8s5.9 2.2 6.2 5.8z"/><circle cx="17.4" cy="9" r="2.6"/><path d="M16.6 13.9c3.1-.1 5.2 1.7 5.5 4.8h-5.1c-.1-1.8-.6-3.3-1.7-4.4z"/>'),
  headset: fi('<path ' + 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M4.4 14.4v-2.2a7.6 7.6 0 0 1 15.2 0v2.2"/><rect x="3" y="13.2" width="4" height="6.6" rx="1.6"/><rect x="17" y="13.2" width="4" height="6.6" rx="1.6"/>'),
  moon: fi('<path d="M20 14.8A8.6 8.6 0 0 1 9.2 4a8.6 8.6 0 1 0 10.8 10.8z"/>'),
  sliders: fi('<path ' + 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M4 7h9M18 7h2M4 12h2M11 12h9M4 17h10M19 17h1"/><circle cx="15.5" cy="7" r="2.6"/><circle cx="8.5" cy="12" r="2.6"/><circle cx="16.5" cy="17" r="2.6"/>'),
  mouse: fi('<path fill-rule="evenodd" d="M12 2.8a5.6 5.6 0 0 0-5.6 5.6v7.2a5.6 5.6 0 0 0 11.2 0V8.4A5.6 5.6 0 0 0 12 2.8zm-.9 2.2v4.4H7.9V8.4a4 4 0 0 1 3.2-3.4z"/>'),
  gear: fi('<path fill-rule="evenodd" d="M10.3 2.6h3.4l.5 2.4c.5.2 1 .5 1.5.8l2.3-.8 1.7 2.9-1.8 1.6c.1.5.1 1 0 1.5l1.8 1.6-1.7 2.9-2.3-.8c-.5.3-1 .6-1.5.8l-.5 2.4h-3.4l-.5-2.4c-.5-.2-1-.5-1.5-.8l-2.3.8-1.7-2.9 1.8-1.6a5 5 0 0 1 0-1.5L4.3 7.9 6 5l2.3.8c.5-.3 1-.6 1.5-.8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" transform="translate(0 .3)"/>'),
  switcher: fi('<path d="M5 8h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"/><path ' + 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8 4.8h11a2 2 0 0 1 2 2V16"/>'),
};
const pci = (n) => PSICO[n] || ICON[n] || '';
const psSec = (t) => `<div class="pc-sec">${t}</div>`;
const psI = (ic, title, sub, act, tone, cls) => `<button class="gd-i pc pc-act t-${tone || 'blue'}${cls ? ' ' + cls : ''}" data-nav data-gd="${act}"><span class="pc-ic">${pci(ic)}</span><span class="pc-wm">${pci(ic)}</span><span class="pc-tx"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span></button>`;
const psV = (ic, title, pct, act, tone) => `<button class="gd-i pc pc-stat t-${tone || 'blue'}" data-nav data-gd="${act}"><span class="pc-ic">${ICON[ic] || ''}</span><em class="pc-num">${pct}<i>%</i></em><span class="pc-tx"><b>${title}</b><small>Left / right to change</small></span><span class="pc-bar" data-pct="${pct}"><i></i></span></button>`;
const psGame = (g, tag, act, tone) => `<button class="gd-i pc pc-game t-${tone || 'blue'}" data-nav data-gd="${act}"><i class="th${gImg(g) ? '' : ' noart'}" data-img="${esc(sqMap.has(g.id) ? 'ctheme://img/' + sqMap.get(g.id) : gImg(g))}"${gImg(g) ? '' : ` data-hue="${hue(g.title)}"`}></i><span class="pc-tx"><b>${esc(g.title)}</b>${tag ? `<small>${esc(tag)}</small>` : ''}</span></button>`;
const psEmpty = (t) => `<div class="pc pc-empty"><span class="pc-tx"><b>${t}</b></span></div>`;
const psSw = (ic, label, on, act) => `<button class="gd-i pc pc-act pc-row" data-nav data-gd="${act}"><span class="pc-ic">${pci(ic)}</span><span class="pc-wm">${pci(ic)}</span><span class="pc-tx"><b>${label}</b></span><span class="pc-sw${on ? ' on' : ''}"><i></i></span></button>`;
const psMem = (m) => `<div class="gd-fr pc pc-mem" data-pt-row>${ptDot(m)}<span class="pc-tx"><b>${esc(m.name)}</b><small>${m.deaf ? 'Deafened' : m.mute ? 'Muted' : m.speaking ? 'Speaking' : 'Connected'}</small></span></div>`;
const psIn = () => { const s = partyState; return !!(s && s.connected && s.auth === 'ok' && s.channel); };
function psMic() {   // only shown while you are in a voice channel
  const s = partyState, me = (s && s.me) || {}, I = psI;
  return psSw('mic', 'Mute', !!me.mute, 'pt:mute') + psSw('headset', 'Deafen', !!me.deaf, 'pt:deaf')
    + I('headset', dcWin ? 'Done, hide Discord' : 'Share or watch a screen', dcWin ? 'Back to the console' : 'Discord with the cursor', dcWin ? 'dc:hide' : 'dc:raise', 'purple')
    + I('power', 'Leave voice channel', s && s.channel ? esc(s.channel.name) : '', 'pt:leave', 'red');
}
function psChannels() {   // every voice channel on your server, as rows
  if (!partyList) { api.partyList().then((x) => { partyList = x && x.ok ? ptOnlyMine(x.list) : []; if (guideOn && guideTab === 'friends') renderGuide(undefined, true); }).catch(() => { partyList = []; if (guideOn && guideTab === 'friends') renderGuide(undefined, true); }); return psEmpty('Looking at your servers…'); }
  const ch = partyList.flatMap((g) => g.channels.map((c) => psI('headset', esc(c.name), esc(g.name), 'pt:join:' + esc(c.id), 'teal')));
  return ch.length ? ch.join('') : psEmpty('No voice channels found');
}
function psGameBase() {   // Game Base: Parties and Friends, like the real one (L1 / R1 or left / right switch)
  const I = psI, nfr = frAny() ? frOnline() : 0, s = partyState;
  const tabs = `<div class="pc-gbt"><span class="${gbTab === 'parties' ? 'on' : ''}">Parties</span><span class="${gbTab === 'friends' ? 'on' : ''}">Friends${nfr ? `<i>${nfr}</i>` : ''}</span></div>`;
  if (gbTab === 'parties') {
    const me = (s && s.me) || {}, vb = (ic, lab, on, act) => `<button class="gd-i pc pc-act pc-vb${on ? ' on' : ''}" data-nav data-gd="${act}" title="${lab}" aria-label="${lab}"><span class="pc-ic">${pci(ic)}</span><small>${lab}</small></button>`;
    let h = tabs + (psIn() ? `<div class="pc-vbar">${vb('mic', me.mute ? 'Unmute' : 'Mute', !!me.mute, 'pt:mute')}${vb('headset', me.deaf ? 'Undeafen' : 'Deafen', !!me.deaf, 'pt:deaf')}${vb('monitor', dcWin ? 'Hide' : 'Share screen', !!dcWin, dcWin ? 'dc:hide' : 'dc:raise')}</div>` : I('people', 'Join voice channel', '', 'pt:quick', 'blue', 'pc-pilld'));
    if (psIn()) h += psSec('Your party') + `<button class="gd-i pc pc-act pc-party" data-nav data-gd="pt:list"><span class="pc-ic">${ICON.headset}</span><span class="pc-tx"><b>${esc(s.channel.name)}</b><small>Discord voice</small></span><i class="pc-ct">${s.members.length}</i></button>` + psSec('In voice chat: ' + s.members.length) + s.members.slice(0, 8).map(psMem).join('') + I('power', 'Leave voice channel', 'Disconnect', 'pt:leave', 'red');
    else h += psSec('Voice channels') + psChannels();
    return h;
  }
  if (!friendsData) return tabs + psEmpty('Looking for your friends…');
  if (!friendsData.ok) return tabs + psEmpty(esc(friendsData.error || 'Could not load your friends.')) + I('gear', 'Open Settings', 'Set up friends', 'settings', 'blue');
  const on = friendsData.friends.filter((f) => f.game || f.state > 0), off = friendsData.friends.filter((f) => !f.game && !f.state);
  return tabs + psSec('Online: ' + on.length) + (on.length ? on.map(frRow).join('') : psEmpty('Nobody is online right now')) + (off.length ? (frOff ? psSec('Offline: ' + off.length) + off.map(frRow).join('') : '') + I('people', frOff ? 'Hide offline' : 'Show offline', off.length + ' offline', 'fr:off', 'purple') : '');
}
function psCustToggle() { psCust = !psCust; psGrab = false; if (psCust) psLeaveRow(); renderGuide(); }
function psMoveTab(d) { const keys = gdTabs().map((t) => t[0]), i = keys.indexOf(guideTab), j = i + d; if (i < 0 || j < 0 || j >= keys.length) return; [keys[i], keys[j]] = [keys[j], keys[i]]; setLocal({ psOrder: keys }); SND.play('tab'); renderGuide(); }
function psToggleHide() { const k = guideTab; if (psFixed(k)) { note('Home and Power always stay.'); return; } const h = new Set((settings && settings.psHide) || []); if (h.has(k)) h.delete(k); else h.add(k); setLocal({ psHide: [...h], psOrder: gdTabs().map((t) => t[0]) }); SND.play('select'); renderGuide(); }
function psGbToggle() { gbTab = gbTab === 'parties' ? 'friends' : 'parties'; SND.play('tab'); renderGuide(0); }
const psVoiceCard = () => { const s = partyState; return `<button class="gd-i pc pc-act pc-vc" data-nav data-gd="tab:friends"><span class="pc-ic">${pci('headset')}</span><span class="pc-faces">${s.members.slice(0, 4).map(ptDot).join('')}</span><span class="pc-tx"><b>${esc(s.channel.name)}</b><small>${s.members.length} in voice chat</small></span></button>`; };
const psMediaCard = () => `<button class="gd-i pc pc-act pc-md" data-nav data-gd="tab:music"><span class="pc-ic">${pci('music')}</span><span class="pc-wm">${pci('music')}</span><span class="pc-tx"><b>${esc(homeNp.title)}</b><small>${esc(homeNp.artist || 'Spotify')}</small></span></button>`;
const psProg = (e) => { const g = games.find((x) => x.title && x.title.toLowerCase() === String(e.title).toLowerCase()), pc = e.total ? Math.round(e.got / e.total * 100) : 0, u = g ? (sqMap.has(g.id) ? 'ctheme://img/' + sqMap.get(g.id) : gImg(g)) : '';
  return `<button class="gd-i pc pc-prog" data-nav data-gd="${g ? 'game:' + esc(g.id) : 'ach'}"><i class="th${u ? '' : ' noart'}" data-img="${esc(u)}"${u ? '' : ` data-hue="${(e.appid || 0) % 360}"`}></i><em class="pc-pct">${pc}<i>%</i></em><span class="pc-chip">${pc >= 100 ? 'Completed' : 'In progress'}</span><span class="pc-tx"><b>${esc(e.title)}</b><small>Trophies · ${e.got} of ${e.total}</small></span></button>`; };
function psJoin() {   // the channel picker, as tiles
  const I = psI;
  if (!partyList) { api.partyList().then((x) => { partyList = x && x.ok ? ptOnlyMine(x.list) : []; if (guideOn && guidePage === 'ptjoin') renderGuide(); }).catch(() => { partyList = []; if (guideOn && guidePage === 'ptjoin') renderGuide(); }); return psEmpty('Looking at your servers\u2026'); }
  const ch = partyList.flatMap((g) => g.channels.map((c) => I('headset', esc(c.name), esc(g.name), 'pt:join:' + esc(c.id), 'teal')));
  return (ch.length ? ch.join('') : psEmpty('No voice channels found')) + I('info', 'Back', 'Voice chat', 'pt:back', 'blue');
}
function psBody() {   // the PlayStation Control Center, tab by tab (null = use the shared page below)
  const t = guideTab, I = psI;
  if (guidePage === 'restart') return I('power', 'Restart now', 'Windows restarts right away', 'dorestart', 'red') + I('info', 'Cancel', 'Save your work in other apps first', 'poback', 'blue');
  if (guidePage === 'off') return I('power', 'Turn off now', 'Windows shuts down right away', 'shutdown', 'red') + I('info', 'Cancel', 'Save your work in other apps first', 'poback', 'blue');
  if (guidePage === 'power' || t === 'power') return (dash ? I('info', 'Close game', 'Quit ' + esc(dash.title), 'closegame', 'red') : '') + I('apps', 'Exit console', 'Close My Console', 'exit', 'blue') + I('moon', 'Sleep', 'Put the PC to sleep', 'sleep', 'purple') + I('power', 'Restart PC', 'Windows restarts', 'restart', 'amber') + I('info', 'Lock Windows', 'Back to the sign-in screen', 'lock', 'teal') + I('power', 'Turn off PC', 'Shut Windows down', 'off', 'red');
  if (psCust) return '<div class="pc-cust"><b>Customize Control Center</b><small>Pick an icon with A, then move it with Left and Right. Press Up to show or hide it. Press B when you are done.</small></div>';
  const g = dash ? games.find((x) => x.title === dash.title) : null;
  const playing = dash ? (g ? psGame(g, 'Resume', 'resume', 'green') : I('play', 'Resume ' + esc(dash.title), 'Running now', 'resume', 'green')) : '';
  if (t === 'home') return '';
  if (t === 'library') {
    if (!achData) loadAch().then(() => { if (guideOn && guideTab === 'library') renderGuide(undefined, true); });
    const L = achData && achData.ok ? (achData.list || []).slice().sort((x, y) => ((x.got >= x.total) - (y.got >= y.total)) || (y.got / y.total - x.got / x.total)).slice(0, 6) : [];
    const rc = rcList().slice(0, 6);
    const lead = (!dash && rc[0]) ? psGame(rc[0], 'Jump back in', 'game:' + rc[0].id) : '';
    return (dash ? playing : lead) + (dash ? I('info', 'Close game', 'Quit ' + esc(dash.title), 'closegame', 'red') : '') + (psIn() ? psVoiceCard() : '') + L.slice(0, 3).map(psProg).join('')
      + I('cam', 'New screenshot', 'Save what is on screen', 'shot', 'amber') + I('film', 'Record screen', 'Start a recording', 'rec', 'red') + I('view', 'Captures', 'Recently created', 'caps', 'purple')
      + rc.slice(dash ? 0 : 1, dash ? 4 : 5).map((x) => psGame(x, (x.lastPlayed ? 'Played ' + ago(x.lastPlayed) : ''), 'game:' + x.id)).join('')
      + I('switcher', 'Switch apps', 'See what is open', 'runapps', 'teal');
  }
  if (t === 'notifs') { notifUnread = false; return (notifHist.length ? notifHist.slice(0, 12).map((n) => I('bell', esc(n.t), ago(n.at), n.gid ? 'game:' + esc(n.gid) : 'profile', 'blue')).join('') + I('info', 'Clear all', '', 'notif:clear', 'red', 'pc-pilld') : psEmpty('No new notifications')); }
  if (t === 'friends') return psGameBase();
  if (t === 'music') { const np = spPlayingNow(); return (np || '') + (np ? '' : I('music', 'Open Spotify', 'Play music in the console', 'openspotify', 'green')); }
  if (t === 'volume') { const pc = (k, d) => Math.round((settings[k] ?? d) * 100); return psSec('Volume') + psV('speaker', 'Menu sounds', pc('sfxVol', 0.7), 'vol:sfxVol', 'blue') + psV('music', 'Console music', pc('musicVol', 0.3), 'vol:musicVol', 'purple') + psSw('speaker', 'Menu sounds on', settings.sfx !== false, 'tgl:sfx'); }
  if (t === 'party') return psMic();
  if (t === 'controller') return I('pad', esc(padName()), (/no controller/i.test(padName()) ? 'Plug in or turn on a controller' : (cbattPct >= 0 ? 'Battery ' + cbattPct + '%' : 'Connected')), 'controller', 'green') + I('apps', 'Button layout', 'Remap every button', 'btns', 'blue') + I('sliders', 'Stick and mouse feel', 'Dead zone and cursor speed', 'sticks', 'teal') + I('info', 'Restore default buttons', 'Undo your remaps', 'resetbtns', 'red');
  if (t === 'profile') return `<div class="pc-prof"><span class="pc-av">${avatarSpan('md')}</span><span class="pc-tx"><b>${esc(profileName())}</b><small>${games.length} games · online</small></span></div>` + I('apps', 'Trophies', achData && achData.ok ? achData.got + ' of ' + achData.total : 'Your progress', 'ach', 'amber') + I('people', 'Switch user', 'Use another profile', 'switch', 'purple') + I('power', 'Sign out', 'Back to the sign-in screen', 'signout', 'red');
  if (t === 'capture') return I('cam', 'Screenshot', 'Save the screen', 'shot', 'amber') + I('film', 'Record screen', 'Start recording', 'rec', 'red') + I('view', 'Captures', 'Recently created', 'caps', 'purple');
  return null;
}
function guideBody() {
  if (guidePage === 'ptjoin') return padKind() === 'ps' ? psJoin() : partyJoinPage();
  if (padKind() === 'ps') { const r = psBody(); if (r != null) return r; }
  if (guideTab === 'notifs') { notifUnread = false; setTimeout(() => { try { const st = document.querySelector('#guide .gd-tabs'); if (st) st.innerHTML = gdStrip(); } catch {} }, 0); return '<h2 class="gd-h">Notifications</h2>' + (notifHist.length ? notifHist.slice(0, 15).map((n) => `<button class="gd-i" data-nav data-gd="${n.gid ? 'game:' + esc(n.gid) : 'notif:none'}">${ICON.bell}<span>${esc(n.t)}<small style="display:block;opacity:.6;font-size:.8em">${ago(n.at)}</small></span></button>`).join('') + '<div class="gd-sep"></div>' + gdI(null, 'Clear all', 'data-gd="notif:clear"') : '<p class="gd-t">No new notifications.</p>'); }
  if (guideTab === 'friends') {
    const party = partyInline();
    if (!friendsData) return `<h2 class="gd-h">Friends &amp; party</h2>${party}<p class="gd-t">Looking for your friends\u2026</p>`;
    if (!friendsData.ok) return `<h2 class="gd-h">Friends &amp; party</h2>${party}<p class="gd-t">${esc(friendsData.error || 'Could not load your friends.')}</p>${gdI('gear', 'Open Settings', 'data-gd="settings"')}`;
    const on = friendsData.friends.filter((f) => f.game || f.state > 0), off = friendsData.friends.filter((f) => !f.game && !f.state);
    return `<h2 class="gd-h">Friends &amp; party</h2>${party}<div class="gd-pl">Online \u2014 ${on.length}</div>${on.length ? on.map(frRow).join('') : '<p class="gd-t">Nobody is online right now.</p>'}${off.length ? (frOff ? `<div class="gd-pl">Offline \u2014 ${off.length}</div>${off.map(frRow).join('')}` : '') + gdI(null, frOff ? 'Hide offline friends' : 'Show ' + off.length + ' offline', 'data-gd="fr:off"') : ''}`;
  }
  if (guideTab === 'recents') { const rc = rcList().slice(0, 30); return `<h2 class="gd-h">Recents</h2>${rc.length ? rc.map(rcRow).join('') : '<p class="gd-t">Nothing played yet. Games you play will show up here.</p>'}`; }
  if (guideTab === 'library') {
    const rc = rcList().slice(0, 4);
    return `<h2 class="gd-h">Games</h2>${gdI('bars', 'Browse your games', 'data-gd="openlib"')}${gdI('library', 'Browse apps', 'data-gd="openapps"')}${gdI('trophy', 'Achievements', 'data-gd="ach"')}${rc.length ? `<div class="gd-sep"></div><div class="gd-pl">Recent</div>${rc.map(rcRow).join('')}${rcList().length > 4 ? gdI(null, 'See all recents', 'data-gd="tab:recents"') : ''}` : ''}`;
  }
  if (guideTab === 'achievements') {
    const d = achData; if (!d) { loadAch().then(() => { if (guideOn && guideTab === 'achievements') renderGuide(); }); return '<h2 class="gd-h">Achievements</h2><p class="gd-t">Counting your achievements\u2026</p>'; }
    if (!d.ok) return `<h2 class="gd-h">Achievements</h2><p class="gd-t">${esc(achWhy[d.why] || 'No achievements yet.')}</p>`;
    const pc = d.total ? Math.round(d.got / d.total * 100) : 0;
    return `<h2 class="gd-h">Achievements</h2><div class="gd-ach"><b>${d.got} / ${d.total}</b><small>unlocked \u00b7 ${pc}% \u00b7 ${d.perfect} perfect game${d.perfect === 1 ? '' : 's'}</small><div class="gd-bar"><i style="width:${pc}%"></i></div></div>${gdI('trophy', 'See all achievements', 'data-gd="ach"')}${d.top ? `<p class="gd-t">Closest to done: ${esc(d.top.title)} ${d.top.got}/${d.top.total}</p>` : ''}`;
  }
  if (guideTab === 'music') { const np = spPlayingNow(); return '<h2 class="gd-h">Music</h2>' + (np || '') + gdI('music', 'Open Spotify', 'data-gd="openspotify"'); }
  if (guideTab === 'volume') { const pc = (k, d) => Math.round((settings[k] ?? d) * 100) + '%'; return `<h2 class="gd-h">Volume</h2>${spPlayingNow()}${gdI('speaker', 'Menu sounds ' + pc('sfxVol', 0.7), 'data-gd="vol:sfxVol"')}${gdI('music', 'Music ' + pc('musicVol', 0.3), 'data-gd="vol:musicVol"')}${gdI('speaker', settings.sfx === false ? 'Turn menu sounds on' : 'Turn menu sounds off', 'data-gd="tgl:sfx"')}`; }
  if (guideTab === 'party') return `<h2 class="gd-h">Voice chat</h2>${partyInline()}`;
  if (guideTab === 'home') return `<h2 class="gd-h">Home</h2>${gdI('home', 'Go to Home', 'data-gd="home"')}${gdI('paint', 'Customize Home', 'data-gd="widgets"')}`;
  if (guideTab === 'controller') return `<h2 class="gd-h">Controller</h2><p class="gd-t">${esc(padName())}</p>${gdI('pad', 'Controller', 'data-gd="controller"')}${gdI('apps', 'Button layout', 'data-gd="btns"')}${gdI('sliders', 'Stick and mouse feel', 'data-gd="sticks"')}${gdI(null, 'Restore default buttons', 'data-gd="resetbtns"')}`;
  if (guideTab === 'settings') return `<h2 class="gd-h">Settings</h2>${gdI('gear', 'Open Settings', 'data-gd="settings"')}${gdI('pad', 'Controller', 'data-gd="controller"')}${gdI('paint', 'Customize Home', 'data-gd="widgets"')}${dash ? gdI(null, 'Restore game fullscreen', 'data-gd="resumefix"') : ''}<div class="gd-sep"></div>${gdI(null, 'Add or switch', 'data-gd="switch"')}${gdI(null, 'Sign out', 'data-gd="signout"')}`;
  if (guidePage === 'power') return `<h2 class="gd-h">Power</h2>${gdI('apps', 'Exit', 'data-gd="exit"')}${gdI('moon', 'Sleep', 'data-gd="sleep"')}${gdI('power', 'Restart PC', 'data-gd="restart"')}${gdI('info', 'Lock Windows', 'data-gd="lock"')}${gdI('power', 'Turn off PC', 'data-gd="off"')}<div class="gd-sep"></div>${gdI(null, 'Back', 'data-gd="pback"')}`;
  if (guidePage === 'restart') return `<h2 class="gd-h">Restart this PC?</h2><p class="gd-t">Windows will restart right away. Save anything open in other apps first.</p>${gdI('power', 'Restart now', 'data-gd="dorestart"')}${gdI(null, 'Cancel', 'data-gd="poback"')}`;
  if (guidePage === 'off') return `<h2 class="gd-h">Turn off this PC?</h2><p class="gd-t">Windows will shut down right away. Save anything open in other apps first.</p>${gdI('power', 'Turn off now', 'data-gd="shutdown"')}${gdI(null, 'Cancel', 'data-gd="poback"')}`;
  const playing = dash ? `${gdI('play', 'Resume ' + esc(dash.title), 'data-gd="resume"')}${gdI(null, 'Close game', 'data-gd="closegame"')}${gdI(null, 'Windows keyboard', 'data-gd="winkbd"')}<div class="gd-sep"></div>` : '';
  return `<div class="gd-u"><span class="gd-ur">${avatarSpan('md')}<span class="gd-un"><b>${esc(profileName())}</b><small>${games.length} games</small></span></span></div>
    ${playing}${partyInline()}${spPlayingNow()}${(() => { const rc = rcList().slice(0, 2); return rc.length ? `<div class="gd-pl">Recent games</div>${rc.map(rcRow).join('')}` : ''; })()}<div class="gd-sep"></div>${gdI('home', 'Home', 'data-gd="home"')}${gdI('bars', 'Library', 'data-gd="openlib"')}${gdI('tools', 'Tools', 'data-gd="tools"')}${gdI('monitor', 'Switch apps', 'data-gd="runapps"')}<div class="gd-sep"></div>${gdI('cam', 'Screenshot', 'data-gd="shot"')}${gdI('film', 'Record screen', 'data-gd="rec"')}${gdI('view', 'Captures', 'data-gd="caps"')}<div class="gd-sep"></div>${gdI('power', 'Power', 'data-gd="power"')}`;
}
const PS_ACC = { capture: '#ffb648', home: '#5aa0ff', library: '#a78bff', achievements: '#ffb648', friends: '#4fe0a0', music: '#3fd87a', volume: '#3fd8d0', party: '#7a8cff', controller: '#5aa0ff', settings: '#9fb0d0', profile: '#ff7ab8', power: '#ff6b6b' };
function psHintSet(el) {
  const gp = document.querySelector('#guide .gd-p'); if (!gp) return; let h = gp.querySelector('.pc-hint');
  if (!h) { h = document.createElement('div'); h.className = 'pc-hint'; gp.appendChild(h); }
  if (!el || !gdRow) { h.classList.remove('on'); return; }
  const X = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8"/></svg>', O = '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 12h10M7 15h10"/></svg>';
  const menu = document.body.classList.contains('gd-menu'), a = (el.dataset && el.dataset.gd) || '';
  if (menu) h.innerHTML = (guideTab === 'friends' && guidePage === 'main' ? '<b>L1 / R1</b> Switch Tabs&nbsp;&nbsp;&nbsp;' : '') + O + 'Options';
  else { const t = a === 'resume' ? 'Resume' : a === 'pt:quick' ? 'Join' : a.startsWith('game:') ? 'Play' : 'Select'; h.innerHTML = X + t; }
  setTimeout(() => { try { const b = menu ? el.closest('#guide .gd-body') : el, r = b.getBoundingClientRect(); h.style.setProperty('--hx', (menu ? r.left + r.width * (guideTab === 'friends' ? .5 : .72) : r.left + r.width / 2) + 'px'); h.classList.add('on'); } catch {} }, 330);
}
function psHead() {
  const t = guideTab, s = partyState, lab = ((gdTabs().find((x) => x[0] === t)) || [])[2] || '';
  if (guidePage === 'ptjoin') return ['Join a voice channel', 'Pick where to hang out'];
  if (guidePage === 'restart') return ['Restart this PC?', 'Windows restarts right away'];
  if (guidePage === 'off') return ['Turn off this PC?', 'Windows shuts down right away'];
  const sub = { home: dash ? 'Playing ' + dash.title : 'Welcome back, ' + profileName(), library: games.length + ' games in your library', notifs: notifHist.length ? notifHist.length + ' recent' : 'Nothing new', friends: gbTab === 'parties' ? 'Parties' : 'Friends', music: 'Spotify', volume: 'Spotify, menu sounds and music', party: 'Discord voice', controller: padName(), profile: profileName(), power: 'Sleep, restart or turn off' };
  return [t === 'profile' ? profileName() : lab, sub[t] || ''];
}
function renderGuide(keep, still) {
  if (psOn() && guideTab === 'party' && !psIn()) guideTab = 'friends';
  const b = document.querySelector('#guide .gd-body'); if (!b) return;
  const st = document.querySelector('#guide .gd-tabs'); if (st) st.innerHTML = gdStrip();
  { const gi = gdTabs().findIndex((t) => t[0] === (guideTab === 'recents' ? 'library' : guideTab)), gp = document.querySelector('#guide .gd-p'); if (gp) gp.style.setProperty('--ti', String(Math.max(0, gi))); }
  if (psOn()) { const gp = document.querySelector('#guide .gd-p'); if (gp) { gp.style.setProperty('--sheet', PS_ACC[guidePage === 'ptjoin' ? 'party' : guideTab] || '#5aa0ff'); let h = gp.querySelector('.pc-hd'); if (!h) { h = document.createElement('div'); h.className = 'pc-hd'; gp.insertBefore(h, gp.querySelector('.gd-tabs')); } const [ht, hs] = psHead(); h.innerHTML = `<i></i><h2>${esc(ht)}</h2><p>${esc(hs)}</p>`; } }
  if (psOn()) { const menu = guidePage !== 'main' || ['notifs', 'capture', 'friends', 'music', 'volume', 'party', 'controller', 'profile', 'power'].includes(guideTab); document.body.classList.toggle('gd-menu', menu); const cur = document.querySelector('#guide .gd-tb.cur'), gb = document.querySelector('#guide .gd-body'); if (cur && gb) { const r = cur.getBoundingClientRect(); gb.style.setProperty('--mx', (r.left + r.width / 2) + 'px'); gb.dataset.t = psHead()[0]; } }
  const keepRow = psOn() && gdRow && typeof keep === 'number'; b.innerHTML = guideBody(); if (!keepRow) { b.scrollLeft = 0; b._gt = 0; } gdRow = keepRow; document.body.classList.toggle('gd-row', keepRow); b.querySelectorAll('[data-pct]').forEach((e) => e.style.setProperty('--psv', e.dataset.pct + '%')); b.querySelectorAll('[data-pc]').forEach((e) => e.style.setProperty('--pc', e.dataset.pc));   // set from script (inline style attributes are not always honoured)
  if (psOn() && guideTab === 'notifs') { const s2 = document.querySelector('#guide .gd-tabs'); if (s2) s2.innerHTML = gdStrip(); }
  applyAvatars(); applyCovers(); if (!still) animateIn('#guide .gd-body > *');
  const els = [...document.querySelectorAll('#guide .gd-body [data-nav]')];
  const first = els[0];
  if (psOn() && !keepRow) psHintSet(null);
  if (psOn() && !keepRow) { const c = document.activeElement; if (c && c.blur && c.closest && c.closest('#guide')) c.blur(); }   // the bar is selected, not a card
  else (typeof keep === 'number' && keep >= 0 ? els[Math.min(keep, els.length - 1)] : first || els[0])?.focus({ preventScroll: true });
  $('#hints').innerHTML = psOn() ? renderHints(psCust ? 'A: Pick up / Put down    Left / Right: Move    Up: Show or hide    B: Done' : gdRow ? 'A: Select    B: Back    Down: Icon bar' : 'A: Open    B: Close    LB: Previous    RB: Next') : renderHints(guidePage === 'main' && dash ? 'A: Select    Share: Back to the game    LB: Previous    RB: Next' : 'A: Select    B: ' + (guidePage !== 'main' ? 'Back' : 'Close') + '    LB: Previous    RB: Next');
}
function openGuide() {
  if (guideOn) return;
  psCust = false; psGrab = false;
  SND.play('open', (gameMute || dash || document.body.classList.contains('ingame')) ? 0.2 : undefined);   // over a running game the sound is quiet
  closeMenu(true); if (osk) oskClose(null); hideLaunch(true);
  document.body.classList.toggle('gd-ps', padKind() === 'ps'); document.body.classList.add('gd-on'); guideOn = true; guidePage = 'main'; guideTab = padKind() === 'ps' ? 'home' : 'profile'; guidePrev = (lastReal && document.body.contains(lastReal) && (screen === 'home' || screen === 'library')) ? lastReal : document.activeElement; try { if (padKind() === 'ps' && document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch {}   // the game you were really on, not where the window focus happened to land
  document.querySelectorAll('#guide.gd-leaving').forEach((o) => o.remove());
  const g = document.createElement('div'); g.id = 'guide';
  g.innerHTML = `<div class="gd-dim"></div><div class="gd-p"><div class="gd-sky"></div>${padKind() === 'ps' ? psExtras() : ''}<div class="gd-tabs"></div><div class="gd-body"></div></div>`; gdRow = false; document.body.classList.remove('gd-row');
  if (padKind() === 'ps') { clearInterval(psClockT); psClockT = setInterval(() => { const c = document.querySelector('#guide .gd-clock'); if (!c || !guideOn) return clearInterval(psClockT); c.innerHTML = psClock(); }, 15000); }
  document.getElementById('guide-out')?.remove();
  document.body.appendChild(g);
  setTimeout(() => { try { if (guideOn) { const q = document.querySelector('#guide .gd-p').getBoundingClientRect(); api.guideClip({ l: Math.max(0, q.left), t: Math.max(0, q.top), r: q.right, b: q.bottom }); } } catch {} }, 450);   // keyboard-game menu: the mouse is kept inside the panel
  renderGuide(); animateIn('#guide .gd-tb'); loadFriends(true); api.partyStart().then((s) => { if (s && !partyState) { partyState = s; if (guideOn && (guideTab === 'friends' || guideTab === 'profile' || guideTab === 'party') && guidePage === 'main') renderGuide(undefined, true); } }).catch(() => {});
  requestAnimationFrame(() => g.classList.add('on'));
}
function closeGuide(silent) {
  document.body.classList.remove('gdgame');
  try { api.guideClip(null); } catch {}
  if (kbOpen) { kbOpen = false; updateLock(); }
  lockHero(0); { const gs = document.getElementById('gamesnap'); if (gs) { gs.classList.remove('on'); } }
  if (!silent && guideOn) SND.play('close');
  const g = $('#guide'); if (g) { if (silent) g.remove(); else if (document.body.classList.contains('gd-ps')) { g.classList.remove('on'); g.classList.add('gd-leaving'); g.style.pointerEvents = 'none'; setTimeout(() => g.remove(), 560); } else { g.id = 'guide-out'; g.classList.remove('on'); setTimeout(() => g.remove(), 560); } }
  setTimeout(() => { if (!guideOn) document.body.classList.remove('gd-ps'); }, silent ? 0 : 600);
  document.body.classList.remove('gd-on'); const was = guideOn; guideOn = false; guidePage = 'main';
  if (!was) return;
  if (screen === 'home' || screen === 'library') { const el0 = guidePrev && document.body.contains(guidePrev) && !guidePrev.closest('#guide') ? guidePrev : null, g0 = el0 && gameOf(el0); if (g0) { try { setHero(g0, true); } catch {} } }   // the logo matches the game you were on the very moment the menu closes
  if (screen && SCREENS[screen]) $('#hints').innerHTML = renderHints(SCREENS[screen].hints);
  if ((!silent || screen === 'home' || screen === 'library') && guidePrev && document.body.contains(guidePrev) && !guidePrev.closest('#guide')) guidePrev.focus({ preventScroll: true });
}
function openSignIn() {   // Add or switch / Sign out: the same profile page you see after the startup video
  document.body.classList.add('intro-on'); try { appMidnight(false); } catch {}
  introOn = true; introStage = 1; introLast = Date.now(); introEnd = Date.now();
  const el = $('#intro'); el.className = 'press-on'; el.hidden = false; void el.offsetWidth;
  signRender(); try { window.__signDirect = true; signBg(true); } catch {}
}
function guideTabStep(dir) {
  if (psOn() && gdRow && guideTab === 'friends' && guidePage === 'main') return psGbToggle();
  const GT = gdTabs(), i = GT.findIndex((t) => t[0] === guideTab);
  guideTab = GT[(i + dir + GT.length) % GT.length][0]; guidePage = guideTab === 'power' ? 'power' : 'main'; renderGuide();
  const first = document.querySelector('#guide .gd-body [data-nav]'); if (first && !psOn()) first.focus({ preventScroll: true });
}
async function guideAct(a) {
  if (a.startsWith('spw:')) { const k = a.slice(4); return api.spWebCmd(k).then(() => setTimeout(() => { try { api.spState().then((st) => { if (st) { spLive = st; const b = document.getElementById('gspw-pp'); if (b && typeof st.playing === 'boolean') b.innerHTML = SPI[st.playing ? 'pause' : 'play']; } }); } catch {} }, 500)); }
  if (a.startsWith('npc:')) return npAct(a.slice(4));
  if (a.startsWith('npplay:')) { await spPlay({ uris: [a.slice(7)] }); setTimeout(npPoll, 900); return; }
  if (a.startsWith('vol:')) { const k = a.slice(4); const cur = Math.round((settings[k] ?? (k === 'sfxVol' ? 0.7 : 0.3)) * 10); setLocal({ [k]: ((cur + 1) % 11) / 10 }); SND.play('select'); return renderGuide(undefined, true); }
  if (a === 'pscust') return psCustToggle();
  if (a === 'notif:none') return;
  if (a === 'notif:clear') { notifHist = []; return renderGuide(undefined, true); }
  if (a === 'tgl:sfx') { setLocal({ sfx: settings.sfx === false }); if (settings.sfx !== false) SND.play('on'); return renderGuide(undefined, true); }
  if (a === 'tgl:music') { setLocal({ music: settings.music === false }); SND.unlock(); return renderGuide(undefined, true); }
  if (a === 'fr:off') { frOff = !frOff; return renderGuide(undefined, true); }
  if (a.startsWith('tab:')) { const k = a.slice(4); if (k === 'recents' || gdTabs().some((t) => t[0] === k)) { guideTab = k; guidePage = k === 'power' ? 'power' : 'main'; renderGuide(); } return; }
  if (a.startsWith('friend:')) { if (!a.startsWith('friend:x')) api.friendOpen(a.slice(7)); return; }
  if (a.startsWith('game:')) { const id = a.slice(5); closeGuide(true); return openGame(id); }
  const go = (s) => { closeGuide(true); show(s); };
  if (a === 'pt:list') { partyList = null; guidePage = 'ptjoin'; return renderGuide(); }
  if (a === 'pt:quick') {
    note('Joining\u2026');
    const l = await api.partyList().catch(() => null), g = l && l.ok ? ptOnlyMine(l.list) : [], cl = (g[0] && g[0].channels) || [], ch = cl.find((c) => /general/i.test(c.name)) || cl[0];
    if (!ch) return note(g.length ? 'No voice channel in that server.' : 'No server named frqngus. Your servers: ' + ((l && l.ok ? l.list : []).map((x) => x.name).join(', ') || 'none found'));
    const x = await api.partyAct('join', ch.id); return note(x && x.ok ? 'Joining ' + ch.name + '\u2026' : 'Could not join: ' + ((x && x.error) || 'Discord said no.'));
  }
  if (a === 'pt:back') { guidePage = 'main'; return renderGuide(); }
  if (a.startsWith('pt:')) { const c = a.slice(3); if (c.startsWith('join:')) { guidePage = 'main'; renderGuide(); const x = await api.partyAct('join', c.slice(5)); return note(x && x.ok ? 'Joining\u2026' : 'Could not join: ' + ((x && x.error) || 'Discord said no.')); } const x = await api.partyAct(c); if (!x || !x.ok) note('Discord: ' + ((x && x.error) || 'no answer')); return; }
  if (a === 'dc:raise') { closeGuide(true); const x = await api.discordRaise(); if (!x || !x.ok) note((x && x.error) || 'Could not open Discord.'); else note('Discord is on your second monitor. Press Xbox to come back.'); return; }
  if (a === 'dc:hide') { await api.discordHideWin(); return; }
  if (a === 'dc:open') { closeGuide(true); return api.discordOpen().then((r) => { if (!r || !r.ok) note('Could not open Discord.'); }); }
  if (a === 'dc:m' || a === 'dc:d') { const ok = await api.discordKey(a.slice(3)); return note(ok ? (a === 'dc:m' ? 'Sent mute / unmute to Discord.' : 'Sent deafen / undeafen to Discord.') : 'Open Discord first.'); }
  switch (a) {
    case 'profile': return;
    case 'library': closeGuide(true); return api.libGet().then((g) => { games = g; show('library'); });
    case 'home': case 'controller': case 'settings': case 'widgets': return go(a);
    case 'search': closeGuide(true); return padSearch();
    case 'openapps': closeGuide(true); return show('apps');
    case 'openspotify': { const sp = (settings.webApps || []).find((y) => /^spotify$/i.test(String(y.name).trim())); closeGuide(true); return sp ? openApp(sp.id) : show('apps'); }
    case 'ach': closeGuide(true); return show('ach');
    case 'news': closeGuide(true); return show('news');
    case 'openlib': closeGuide(true); return api.libGet().then((g) => { games = g; show('library'); });
    case 'find': closeGuide(true); return findGame();
    case 'btns': bindTabK = 'console'; return go('binds');
    case 'sticks': bindTabK = 'sticks'; return go('binds');
    case 'resetbtns': closeGuide(true); change({ binds: DEF_BINDS_UI, mbinds: DEF_MBINDS_UI }); return note('Buttons restored to default.');
    case 'switch': case 'signout': closeGuide(true); return openSignIn();
    case 'spresume': closeGuide(true); return api.spwebOpen();
    case 'resume': silenceAll(true); closeGuide(true); return resumeSmooth();
    case 'resumefix': silenceAll(true); closeGuide(true); return resumeSmooth(true);
    case 'closegame': closeGuide(true); return closeRunning();
    case 'winkbd': closeGuide(true); return api.winKeyboard && api.winKeyboard();
    case 'power': guidePage = 'power'; return renderGuide();
    case 'off': guidePage = 'off'; return renderGuide();
    case 'pback': guidePage = 'main'; return renderGuide();
    case 'poback': guidePage = 'power'; return renderGuide();
    case 'exit': return quitConsole();
    case 'shutdown': try { SND.play('poweroff', 1); } catch {} return api.shutdown();
    case 'sleep': return api.sleep();
    case 'restart': guidePage = 'restart'; return renderGuide();
    case 'dorestart': return api.restart();
    case 'lock': return api.lock();
    case 'shot': return takeShot();
    case 'caps': closeGuide(true); return capsOpen();
    case 'tools': closeGuide(true); return show('tools');
    case 'rec': closeGuide(true); return window.recToggle && window.recToggle();
    case 'runapps': closeGuide(true); return window.toolsOpen ? window.toolsOpen('apps') : show('tools');
    case 'notifs': case 'weather': case 'quick': return xtraGuide(a);
  }
}

/* ---------- Customize your Home: make and edit your own widgets ---------- */
SCREENS.widgets = {
  hints: 'A: Edit widget    B: Back',
  focus: '.wlist .item',
  html: () => {
    const ws = settings.widgets;
    const rows = ws.map((w, i) => `<button class="item" data-nav data-wedit="${esc(w.id)}"><span>${i + 1}.  ${esc(w.title || WTYPES[w.type])}</span><span>${w.title ? esc(WTYPES[w.type]) : ''}${w.title && w.size === 'half' ? '  ·  ' : ''}${w.size === 'half' ? 'half size' : ''}</span></button>`).join('');
    return `<h1>Customize your Home</h1><div class="wprev" inert><div class="wrow">${ws.map((w) => widgetHtml(w, false)).join('')}</div></div>
      <div class="list wlist">${rows}
      ${ws.length < 12 ? '<button class="item" data-nav data-act="wadd"><span>Add a widget</span><span></span></button>' : ''}
      <button class="item" data-nav data-act="wreset"><span>Reset to default widgets</span><span></span></button>
      <button class="item" data-nav data-go="home"><span>Back</span><span></span></button></div>`;
  },
};
const widgetById = (id) => settings.widgets.find((w) => w.id === id);
async function saveWidgets(list, focus) {
  settings = await api.setSettings({ ...settings, widgets: list });
  show('widgets', focus === undefined ? focusIdx() : focus);
}
function openWidgetMenu(anchor, id) {
  const w = widgetById(id); if (!w) return;
  const only = settings.widgets.filter((x) => x.type === 'customize').length < 2 && w.type === 'customize';
  const items = [['w:type', 'Change type...'], ['w:title', 'Title...'], ['w:color', 'Color: ' + (w.color ? 'custom (next)' : 'default (next)')], ['w:img', 'Background picture...']];
  if (w.img) items.push(['w:imgrm', 'Remove picture']);
  items.push(['w:size', 'Size: ' + (w.size === 'half' ? 'Half (change to wide)' : 'Wide (change to half)')]);
  if (w.type === 'web') items.push(['w:url', 'Web address...']);
  if (w.type === 'app') items.push(['w:app', 'Choose app or file...'], ['w:folder', 'Choose folder...']);
  items.push(['w:left', 'Move left'], ['w:right', 'Move right']);
  if (!only) items.push(['w:remove', 'Remove widget']);
  popMenu(anchor, w.title || WTYPES[w.type], items, { wid: id });
}
function openAddMenu(anchor) { popMenu(anchor, 'Add a widget', WADD.map((t) => ['wa:' + t, WTYPES[t]]), { wadd: true }); }
async function widgetAct(a, id) {
  const idx = focusIdx(), list = settings.widgets.map((w) => ({ ...w })), i = list.findIndex((w) => w.id === id), w = list[i];
  if (a === 'wreset') { settings = await api.setSettings({ ...settings, widgets: undefined }); show('widgets', 0); return note('Widgets reset.'); }
  if (a.startsWith('wa:')) {
    const type = a.slice(3), nw = { id: 'w' + Math.random().toString(36).slice(2, 8), type, title: '', color: '', size: 'wide', target: type === 'web' ? 'https://www.google.com' : '', img: '' };
    list.push(nw); await saveWidgets(list, list.length - 1);
    if (type === 'app') { const r = await api.widgetPickApp(nw.id, false); if (r && r.settings) { settings = r.settings; show('widgets', list.length - 1); } }
    return note('Widget added. Select it to change its title, color or picture.');
  }
  if (!w) return;
  if (a === 'w:type') return popMenu(document.querySelector(`[data-wedit="${id}"]`) || document.activeElement, 'Widget type', WADD.map((t) => ['wt:' + t, WTYPES[t]]), { wid: id, types: true });
  if (a.startsWith('wt:')) { w.type = a.slice(3); if (w.type === 'web' && !w.target) w.target = 'https://www.google.com'; await saveWidgets(list, idx); if (w.type === 'app' && !w.target) { const r = await api.widgetPickApp(id, false); if (r && r.settings) { settings = r.settings; show('widgets', idx); } } return; }
  if (a === 'w:title') { const t = await openOsk('Widget title (empty = default)', w.title, { done: 'Save' }); if (t !== null) { w.title = t.trim().slice(0, 40); await saveWidgets(list, idx); } return; }
  if (a === 'w:color') { w.color = WCOLORS[(WCOLORS.indexOf(w.color) + 1) % WCOLORS.length]; await saveWidgets(list, idx); return; }
  if (a === 'w:img') { const r = await api.widgetPickImg(id); if (r && r.settings) { settings = r.settings; show('widgets', idx); } else if (r && r.error) note(r.error); return; }
  if (a === 'w:imgrm') { w.img = ''; await saveWidgets(list, idx); return; }
  if (a === 'w:size') { w.size = w.size === 'half' ? 'wide' : 'half'; await saveWidgets(list, idx); return; }
  if (a === 'w:url') { const t = await openOsk('Web address', w.target, { done: 'Save' }); if (t !== null && t.trim()) { w.target = t.trim(); await saveWidgets(list, idx); } return; }
  if (a === 'w:app' || a === 'w:folder') { const r = await api.widgetPickApp(id, a === 'w:folder'); if (r && r.settings) { settings = r.settings; show('widgets', idx); } return; }
  if (a === 'w:left' && i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; await saveWidgets(list, idx - 1); return; }
  if (a === 'w:right' && i < list.length - 1) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; await saveWidgets(list, idx + 1); return; }
  if (a === 'w:remove') { list.splice(i, 1); await saveWidgets(list, Math.max(0, idx - 1)); return; }
}
let extReturn = null, extT = 0, lastReturn = null;
const rememberReturn = () => { extReturn = { screen, idx: Math.max(0, focusIdx()) }; lastReturn = extReturn; clearTimeout(extT); api.extSet('web'); };   // where the Xbox button should bring you back to after an app or web page
async function openWidget(id) {
  rememberReturn();
  const w = widgetById(id);
  note(w && w.type === 'web' ? 'Opening the web page. Mouse mode is on. Click both sticks, or press the Xbox button, to come back.' : 'Opening... Mouse mode is on. Click both sticks, or press the Xbox button, to come back.');
  const r = await api.widgetOpen(id);
  if (r && !r.ok) note(r.error);
}
async function pinGame(id) {
  if (settings.widgets.some((w) => w.type === 'game' && w.target === id)) return note('This game is already pinned to Home.');
  if (settings.widgets.length >= 12) return note('Home already has 12 widgets. Remove one in Customize your Home first.');
  settings = await api.setSettings({ ...settings, widgets: [...settings.widgets, { id: 'w' + Math.random().toString(36).slice(2, 8), type: 'game', title: '', color: '', size: 'wide', target: id, img: '' }] });
  note('Pinned to Home.');
}
const posterMap = new Map(), coverTried = new Set();
const gImg = (g) => (posterMap.has(g.id) ? 'ctheme://img/' + posterMap.get(g.id) : g.image || '');
const lcover = (g) => `<button class="lt${gImg(g) ? '' : ' noart'}${sqMap.has(g.id) ? ' sq' : ''}" data-nav data-game="${esc(g.id)}" data-img="${esc(sqMap.has(g.id) ? 'ctheme://img/' + sqMap.get(g.id) : gImg(g))}"${sqMap.has(g.id) ? ` data-sq="ctheme://img/${esc(sqMap.get(g.id))}"` : ''}${gImg(g) ? '' : ` data-hue="${hue(g.title)}"`}>${g.installed === false ? '<em class="bdg">↓</em>' : ''}<span class="ltl">${esc(g.title)}<small>${esc(g.source || '')}</small></span></button>`;
function lpanelHtml(g) {
  if (!g) return '<div class="lpv"><div class="lpart"></div></div><p class="lpempty">No games to show. Open the menu at the top to add a game folder or find a game.</p>';
  const list = (a) => (Array.isArray(a) ? a.filter(Boolean).join(', ') : '');
  const box = (k, v) => `<div><small>${k}</small><b>${esc(v || '—')}</b></div>`;
  const hasT = typeof g.trailer === 'string' && TRAILER_OK.test(g.trailer);
  const stars = g.rating ? `<span class="stars"><span class="sb">★★★★★</span><span class="sf" data-w="${Math.max(0, Math.min(100, Math.round(g.rating / 5 * 100)))}">★★★★★</span></span>` : '';
  const status = g.installed === false ? 'Not installed' : g.playSeconds || g.lastPlayed ? 'Played' : 'Not Played';
  return `<div class="lpv"><div class="lpart xart lpbg" data-img="${esc(gImg(g))}"></div><div class="lpart xart lpfg" data-img="${esc(gImg(g))}"></div>${hasT ? `<video class="lvid" data-trailer="${esc(g.trailer)}"${trAttrs(g)} loop playsinline></video>` : ''}</div>
    <div class="lbox">${box('Time Played', g.playSeconds ? fmtDur(g.playSeconds) : 'Not Played')}${box('Last Played', g.lastPlayed ? new Date(g.lastPlayed).toLocaleDateString() : 'Never')}${box('Completion Status', status)}
      ${box('Release Year', (String(g.released || '').match(/(19|20)\d\d/) || [''])[0])}${box('Developer', list(g.developers))}${box('Publisher', list(g.publishers))}</div>
    <div class="lrate">${g.metacritic ? `<span class="mcb">${g.metacritic}</span>` : ''}${stars}<span class="lsrc">${esc(g.source || '')}</span></div>
    <div class="ldesc">${g.description ? String(g.description).split(/\n+/).filter(Boolean).slice(0, 2).map((t) => `<p>${esc(t)}</p>`).join('') : ''}</div>
    <div class="lgen">${(g.genres || []).slice(0, 4).map((x) => `<em>${esc(x)}</em>`).join('')}</div>
    <div class="lhints">${renderHints(SCREENS.library.hints)}</div>`;
}
let achSc = 0, achIdx = 0, achCur = null, achDet = null;
const achWhy = { nokey: 'Add your Steam key in Settings to see your achievements.', noid: 'Sign in to Steam on this PC to see your achievements.', private: 'Steam would not share your games. Check the Steam key, and that Game details are public.', badkey: 'Steam rejected your Steam key. Check it in Settings.', error: 'Could not reach Steam right now.' };
const achArtMap = new Map(); let achArtBusy = false;
const ring = (p, cls = '') => { const r = 15.9155; return `<svg class="aring ${cls}" viewBox="0 0 36 36"><circle class="art" cx="18" cy="18" r="${r}"/><circle class="arf" cx="18" cy="18" r="${r}" stroke-dasharray="${Math.max(0, Math.min(100, p)).toFixed(1)} 100"/></svg>`; };
const achGameOf = (appid) => games.find((x) => String(x.steamId) === String(appid));
const achCoverUrl = (appid) => { const g = achGameOf(appid); if (g) return sqMap.has(g.id) ? 'ctheme://img/' + sqMap.get(g.id) : gImg(g); return achArtMap.get(String(appid)) || ''; };
function loadAchArt() {   // the real Steam cover for the games that are not in your library list
  if (achArtBusy || !api.achArt || !achData || !achData.ok) return;
  const need = (achData.list || []).map((a) => String(a.appid)).filter((id) => !achGameOf(id) && !achArtMap.has(id)); if (!need.length) return;
  achArtBusy = true; api.achArt(need).then((r) => { for (const id of need) achArtMap.set(id, (r && r[id]) || ''); }).catch(() => {}).finally(() => { achArtBusy = false; applyAchBg(); });
}
function applyAchBg() { document.querySelectorAll('[data-ab]').forEach((el) => { const u = achCoverUrl(el.dataset.ab); if (u && el.dataset.abu !== u) { el.dataset.abu = u; el.style.backgroundImage = `url("${u}")`; el.classList.add('has'); if (el.parentElement && el.parentElement.classList.contains('avart')) el.parentElement.style.setProperty('--cov', `url("${u}")`); } }); }
const achView = (l) => (l || []).slice().sort((x, y) => (y.a ? 1 : 0) - (x.a ? 1 : 0) || (x.a ? (y.t || 0) - (x.t || 0) : (y.p >= 0 ? y.p : -1) - (x.p >= 0 ? x.p : -1)));
const rarity = (p) => p < 0 ? '' : p < 5 ? 'Ultra rare' : p < 15 ? 'Rare' : p < 40 ? 'Uncommon' : 'Common';
SCREENS.ach = {
  focus: '.avc',
  hints: 'A: Open    B: Back',
  html: () => {
    let d = achData;
    if (!d) return '<div class="achpg v2"><h1>Achievements</h1><p class="apsub"><i class="spin"></i>Counting your achievements...</p></div>';
    if (!d.ok) return `<div class="achpg v2"><h1>Achievements</h1><p class="apsub">${esc(achWhy[d.why] || 'No achievements yet.')}</p><button class="xt acard" data-nav data-go="home"><span class="ainf"><b>Back to Home</b></span></button></div>`;
    const mine = (d.list || []).map((a, i) => Object.assign({ i }, a)).filter((a) => achGameOf(a.appid));   // only the games that are in your library
    const tg = mine.reduce((n, a) => n + a.got, 0), tt = mine.reduce((n, a) => n + a.total, 0), perf = mine.filter((a) => a.got >= a.total).length;
    d = { got: tg, total: tt, perfect: perf, games: mine.length, list: mine };
    const pc = d.total ? Math.round(d.got / d.total * 100) : 0, nf = (n) => Number(n).toLocaleString();
    const rank = pc < 10 ? 'Rookie' : pc < 25 ? 'Challenger' : pc < 50 ? 'Veteran' : pc < 75 ? 'Elite' : 'Legend';
    const card = (a) => { const p = Math.round(a.got / a.total * 100); return `<button class="xt avc${p >= 100 ? ' done' : ''}" data-nav data-ach="${a.i}"><span class="avart"><i class="acov" data-ab="${esc(a.appid)}"></i>${p >= 100 ? '<b class="avperf">Perfect</b>' : ''}<em class="avpct">${p >= 100 ? '✓' : p + '%'}</em></span><span class="avcap"><b>${esc(a.title)}</b><small>${a.got} of ${a.total}${p < 100 ? ` · ${a.total - a.got} to go` : ' · complete'}</small><i class="achbar"><u data-w="${p}"></u></i></span></button>`; };
    const sec = d.list.slice().sort((x, y) => (y.got / y.total) - (x.got / x.total) || y.total - x.total).map(card).join('');
    const trophy = '<svg class="atro" viewBox="0 0 24 24"><path d="M7 3h10v5a5 5 0 0 1-10 0V3Zm-3 1h3v2H5v1a3 3 0 0 0 2.4 2.9l.4 1.9A5 5 0 0 1 3 7V4h1Zm16 0h1v3a5 5 0 0 1-4.8 4.8l.4-1.9A3 3 0 0 0 19 7V6h-2V4h3ZM11 14h2v3h3v2H8v-2h3v-3Z" fill="currentColor"/></svg>';
    const tile = (n, l) => `<div class="avt"><b>${n}</b><small>${l}</small></div>`;
    return `<div class="achpg v2 v3"><div class="ahd"><div class="aringbig">${ring(pc, 'big')}<b>${pc}<small>%</small></b></div><div class="ahl"><span class="akick">${trophy}${rank}</span><h1>Achievements</h1><p class="apsub">${nf(d.got)} of ${nf(d.total)} unlocked across ${d.games} game${d.games === 1 ? '' : 's'}</p></div><div class="avstats">${tile(nf(d.got), 'unlocked')}${tile(nf(d.total - d.got), 'to go')}${tile(d.perfect, 'perfect')}</div></div>
      <div class="ascr" data-aclip="${(setTimeout(() => { const q = document.querySelector('.ascr'); if (q) achFit(q); }, 60), '')}"><div class="avgrid">${sec || '<p class="apsub">None of your library games have achievements yet.</p>'}</div></div></div>`;
  },
};
SCREENS.achgame = {
  focus: '.aitem',
  hints: 'B: Back',
  html: () => {
    const c = achCur || {}, d = achDet, p = c.total ? Math.round(c.got / c.total * 100) : 0;
    const body = !d ? '<p class="apsub"><i class="spin"></i>Loading achievements...</p>' : !d.ok ? '<p class="apsub">Steam would not share the achievements for this game.</p>'
      : achView(d.list).map((a) => { const r = a.a ? '' : rarity(a.p), rr = rarity(a.p); return `<div class="aitem${a.a ? ' got' : ''}" data-nav tabindex="0"><i class="abadge${a.i ? '' : ' none'}">${a.i ? `<img src="${a.i}" alt="" draggable="false">` : (a.a ? '✓' : '')}</i><span class="ait"><b>${esc(a.n)}</b><small>${esc(a.d || (a.a ? '' : 'Hidden achievement'))}</small></span><span class="aside">${a.a && a.t ? `<em>${new Date(a.t * 1000).toLocaleDateString()}</em>` : '<em>Locked</em>'}${a.p >= 0 ? `<small class="rar rz${a.p < 5 ? 3 : a.p < 15 ? 2 : a.p < 40 ? 1 : 0}">${rr} · ${a.p < 10 ? a.p.toFixed(1) : Math.round(a.p)}%</small>` : ''}</span></div>`; }).join('');
const top = d && d.ok ? d.list.filter((x) => x.a && x.p >= 0 && x.i).sort((x, y) => x.p - y.p).slice(0, 4) : [];
    const strip = top.length ? `<div class="arare"><small>Rarest unlocked</small><div>${top.map((x) => `<i class="abadge big" title="${esc(x.n)}"><img src="${x.i}" alt="" draggable="false"></i>`).join('')}</div></div>` : '';
    return `<div class="achpg v2 v3"><div class="ahd ahero"><span class="avart hero"><i class="acov" data-ab="${esc(c.appid || '')}"></i></span><div class="ahl"><h1>${esc(c.title || 'Achievements')}</h1><p class="apsub">${c.got} of ${c.total} unlocked · ${p}%</p><i class="achbar wide"><u data-w="${p}"></u></i></div>${strip}<div class="aringbig sm">${ring(p, 'big')}<b>${p}<small>%</small></b></div></div><div class="ascr"><div class="agrid one">${body}</div></div></div>`;
  },
};

SCREENS.news = {
  focus: '.nread, .item',
  hints: 'B: Back    LB: Previous    RB: Next',
  html: () => { const n = newsData && newsData[newsIdx]; if (!n) return '<h1>News</h1><p class="apsub">Nothing here yet.</p><div class="list"><button class="item" data-nav data-go="home"><span>Back to Home</span><span></span></button></div>';
    return `<div class="nread" data-nav tabindex="0">${n.img ? `<img class="nri" src="ctheme://img/${esc(n.img)}" alt="" draggable="false">` : ''}<div class="nrt"><span class="nsrc2">${esc(n.src)} \u00b7 ${ago(n.ts)}</span><h1>${esc(n.title)}</h1><p>${esc(n.sum || 'No summary was provided for this story.')}</p><span class="nrc">${newsIdx + 1} of ${newsData.length}</span></div></div>`; },
};
SCREENS.trailer = {
  focus: '.trview',
  hints: 'B: Back',
  html: () => {
    const t = trCur || (trailData && trailData[trIdx]);
    const side = t ? `<div class="trside"><span class="trtag">${esc(t.tag || 'Trailer')}</span><h2>${esc(t.title)}</h2>${t.genres && t.genres.length ? `<div class="sigen">${t.genres.map((g) => `<i>${esc(g)}</i>`).join('')}</div>` : ''}<div class="trmeta">${[t.date, t.dev].filter(Boolean).map(esc).join(' \u00b7 ')}</div><p>${esc(t.desc || 'No description was provided.')}</p></div>` : '';
    return `<div class="trview" data-nav tabindex="0"><div class="trrow"><div class="trbox">${trFile ? `<video class="trvid" data-trailer="${esc(trFile)}" playsinline${trAudio ? ' muted' : ''}></video>${trAudio ? `<audio class="tra" data-trailer="${esc(trAudio)}"></audio>` : ''}` : `<div class="trwait">${trErr ? esc(trErr) : '<i class="spin"></i>Loading the trailer... the first time can take a minute'}</div>`}</div>${side}</div></div>`;
  },
};

SCREENS.store = {
  focus: '.storepg [data-nav]',
  get hints() { const b = settings.binds; return `${b.confirm}: Open    ${b.back}: Back`; },
  html: () => {
    const sec = (t, k) => storeData && storeData[k] && storeData[k].length ? `<div class="nh"><b>${t}</b></div><div class="r3 tg">${storeData[k].slice(0, 10).map(scard).join('')}</div>` : '';
    const body = storeRes ? (storeRes.length ? `<div class="nh"><b>Results for “${esc(storeQ)}”</b><span>${storeRes.length} found</span></div><div class="r3 tg">${storeRes.map(scard).join('')}</div>` : `<p class="apsub">${storeErr ? esc(storeErr) : (storeQ && storeRes.length === 0 && !storeErr ? 'Searching...' : 'Nothing found.')}</p>`)
      : (storeData ? (sec('Most played on Steam', 'top') + sec('New releases', 'new') + sec('On sale', 'sale') + sec('Coming soon', 'soon')) : '<p class="apsub">Loading the Store...</p>');
    return `<div class="storepg"><h1>Store</h1><div class="strow"><button class="xt sbtn" data-nav data-act="storesearch">${ICON.search}<span>Search the Store</span></button>${storeRes ? '<button class="xt sbtn" data-nav data-act="storeclear"><span>Clear search</span></button>' : ''}</div>${body}</div>`;
  },
};
SCREENS.storeitem = {
  focus: '.sibtn',
  get hints() { const b = settings.binds; return `${b.confirm}: Select    ${b.back}: Back`; },
  html: () => {
    const x = storeCur || {};
    return `<div class="sipg"><div class="sihero">${x.shot ? `<img class="sishot" src="ctheme://img/${esc(x.shot)}" alt="" draggable="false">` : ''}<i class="sishade"></i></div>
      <div class="sibody"><div class="siart">${x.img ? `<img src="ctheme://img/${esc(x.img)}" alt="" draggable="false">` : ''}</div>
      <div class="sitext"><h1>${esc(x.name || '')}</h1><div class="sipr">${x.disc ? `<s class="sdisc">-${x.disc}%</s>` : ''}<b>${esc(x.price || '')}</b>${x.date ? `<span>${esc(x.date)}</span>` : ''}${x.dev ? `<span>${esc(x.dev)}</span>` : ''}</div>
      ${x.genres && x.genres.length ? `<div class="sigen">${x.genres.map((g) => `<i>${esc(g)}</i>`).join('')}</div>` : ''}
      <p>${x.loading ? 'Loading details...' : x.fail ? 'Could not load the details. You can still open it on Steam or search the Microsoft Store.' : esc(x.desc || 'No description was provided.')}</p>
      <div class="sibtns">${x.trailer ? `<button class="xt sibtn" data-nav data-act="sitrailer">${ICON.play}<span>Watch trailer</span></button>` : ''}<button class="xt sibtn" data-nav data-act="sisteam">${ICON.globe}<span>View on Steam</span></button><button class="xt sibtn" data-nav data-act="sims">${ICON.bag}<span>Search Microsoft Store</span></button></div></div></div></div>`;
  },
};

/* ---------- Spotify, built into the console ---------- */
const sp = { st: null, init: false, view: 'home', hist: [], home: null, pls: null, liked: null, lib: 'pl', libData: {}, list: null, listTitle: '', listSub: '', listArt: '', listCtx: '', ar: null, res: null, now: null, player: {}, vol: 80, tick: null, likeId: '', likeOn: false, queue: null };
const spPick = (a) => (a && a.length ? a[Math.min(1, a.length - 1)].url : '');
const spDur = (ms) => { const s = Math.round((ms || 0) / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const spArtists = (t) => ((t && t.artists) || []).map((a) => a.name).join(', ');
function quitConsole() { document.body.classList.add('quit-out'); return api.quit(); }   // the page eases out while the window fades
async function spCall(m, p, b) { const r = await api.spCall(m, p, b); if (!r || !r.ok) { note('Spotify: ' + ((r && r.error) || 'no answer')); return null; } return r.data || {}; }
async function spQ(p) { try { const r = await api.spCall('GET', p); return r && r.ok ? (r.data || {}) : null; } catch { return null; } }   // quiet: a shelf that Spotify will not give is simply left out
function spInit() {
  if (sp.init) return; sp.init = true;
  api.onSpPlayer((s) => { sp.player = s || {}; });
  api.spStatus().then((s) => { sp.st = s; sp.player = { device: s.device, error: s.error }; if (screen === 'spotify') show('spotify'); if (s.signedIn) spLoadHome(); });
}
const SPS = (d, extra) => `<svg viewBox="0 0 24 24" ${extra || 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'}>${d}</svg>`;
const SPI = {
  play: SPS('<path d="M8 5v14l11-7z"/>', 'fill="currentColor"'), pause: SPS('<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>', 'fill="currentColor"'),
  next: SPS('<path d="M6 18l8.5-6L6 6zM16 6h2v12h-2z"/>', 'fill="currentColor"'), prev: SPS('<path d="M16 6l-8.5 6 8.5 6zM6 6h2v12H6z"/>', 'fill="currentColor"'),
  shuffle: SPS('<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'), repeat: SPS('<path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"/>'),
  heart: SPS('<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>'), heartf: SPS('<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>', 'fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"'),
  vol: SPS('<path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'), minus: SPS('<path d="M5 12h14"/>'), plus: SPS('<path d="M12 5v14M5 12h14"/>'),
  home: SPS('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/>'), search: SPS('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  lib: SPS('<path d="M16 6l4 14M12 6v14M8 8v12M4 4v16"/>'), music: SPS('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'), out: SPS('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
};
let SPF = 7;   // number of menu buttons on the left, so the first thing on the page is the next one
const spCard = (act, img, title, sub, round) => `<button class="xt spcard${round ? ' rd' : ''}" data-nav data-sp="${esc(act)}"><i class="spimg sq" data-spimg="${esc(img || '')}"></i><span class="spti"><b>${esc(title || '')}</b><small>${esc(sub || '')}</small></span></button>`;
const spPlC = (p) => p ? spCard('pl:' + p.id, spPick(p.images), p.name, 'Playlist' + (p.tracks && p.tracks.total != null ? ' · ' + p.tracks.total + ' songs' : ''), false) : '';
const spAlC = (a) => a && a.id ? spCard('al:' + a.id, spPick(a.images), a.name, (a.release_date ? a.release_date.slice(0, 4) + ' · ' : '') + (a.album_type === 'single' ? 'Single' : 'Album') + ((a.artists && a.artists[0]) ? ' · ' + a.artists[0].name : ''), false) : '';
const spArC = (a) => a && a.id ? spCard('ar:' + a.id, spPick(a.images), a.name, 'Artist', true) : '';
const spShC = (s) => s && s.id ? spCard('sh:' + s.id, spPick(s.images), s.name, s.publisher || 'Podcast', false) : '';
const spTrC = (t) => t && t.uri ? spCard('play:' + t.uri + '|', spPick(t.album && t.album.images), t.name, spArtists(t), false) : '';
const spShelf = (title, items, more) => { const l = (items || []).filter(Boolean); return l.length ? `<section class="spshelf"><h2 class="agh"><b>${esc(title)}</b>${more ? `<button class="xt spmore" data-nav data-sp="${esc(more)}">Show all</button>` : ''}</h2><div class="spgrid">${l.join('')}</div></section>` : ''; };
const spTrackRow = (t, ctx, n) => t && t.uri ? `<button class="xt sprow${n ? ' num' : ''}" data-nav data-sp="play:${esc(t.uri)}|${esc(ctx || '')}">${n ? `<em class="spn">${n}</em>` : ''}<i class="spimg" data-spimg="${esc(spPick(t.album && t.album.images))}"></i><span class="spti"><b>${esc(t.name)}</b><small>${esc(spArtists(t))}</small></span><em>${spDur(t.duration_ms)}</em></button>` : '';
const spEpRow = (e) => e && e.uri ? `<button class="xt sprow" data-nav data-sp="play:${esc(e.uri)}|"><i class="spimg" data-spimg="${esc(spPick(e.images))}"></i><span class="spti"><b>${esc(e.name)}</b><small>${esc((e.release_date || '') + (e.description ? ' · ' + e.description.slice(0, 90) : ''))}</small></span><em>${spDur(e.duration_ms)}</em></button>` : '';
function spNowHtml() {
  const n = sp.now, t = n && n.item, sh = n && n.shuffle_state, rp = n && n.repeat_state, pr = n ? n.progress_ms || 0 : 0, du = t ? t.duration_ms || 0 : 0;
  return `<div class="spl"><button class="xt spnpb" data-nav data-sp="np"><i class="spimg" id="spnc" data-spimg="${esc(t ? spPick((t.album || t.show || t).images) : '')}"></i><span class="spti"><b id="spnt">${esc(t ? t.name : 'Nothing playing')}</b><small id="spna">${esc(t ? (spArtists(t) || (t.show && t.show.name) || '') : 'Pick something to play')}</small></span></button><button class="xt spib${sp.likeOn ? ' cur' : ''}" data-nav data-sp="like" id="splk">${sp.likeOn ? SPI.heartf : SPI.heart}</button></div>
    <div class="spc"><div class="spctl"><button class="xt spib${sh ? ' cur' : ''}" data-nav data-sp="shuf" id="spsh">${SPI.shuffle}</button><button class="xt spib" data-nav data-sp="prev">${SPI.prev}</button><button class="xt spib big" data-nav data-sp="toggle" id="spnb">${n && n.is_playing ? SPI.pause : SPI.play}</button><button class="xt spib" data-nav data-sp="next">${SPI.next}</button><button class="xt spib${rp && rp !== 'off' ? ' cur' : ''}" data-nav data-sp="rep" id="sprp">${SPI.repeat}</button></div>
    <div class="sptm"><span id="spel">${spDur(pr)}</span><div class="spbar"><div class="spfill" id="spnp" style="width:${du ? Math.min(100, pr / du * 100) : 0}%"></div></div><span id="spdu">${spDur(du)}</span></div></div>
    <div class="spr"><button class="xt spib" data-nav data-sp="vd">${SPI.minus}</button>${SPI.vol}<button class="xt spib" data-nav data-sp="vu">${SPI.plus}</button></div>`;
}
function spPaint() {   // the cover pictures come from Spotify; they are set after the page is drawn
  document.querySelectorAll('#screen [data-spimg]').forEach((e) => { const u = e.dataset.spimg; if (u && /^https:\/\/[a-z0-9.-]*(scdn\.co|spotifycdn\.com)\//i.test(u)) e.style.backgroundImage = `url("${u}")`; });
}
function spSmooth() {   // between the 3-second checks the bar and the time keep moving on their own, so they stay accurate
  const n = sp.now, t = n && n.item; if (!t || !t.duration_ms) return;
  const pr = Math.min(t.duration_ms, (n.progress_ms || 0) + (n.is_playing && sp.nowAt ? performance.now() - sp.nowAt : 0));
  const bar = document.getElementById('spnp'); if (bar) bar.style.width = (pr / t.duration_ms * 100).toFixed(2) + '%';
  const e = document.getElementById('spel'), s = spDur(pr); if (e && e.textContent !== s) e.textContent = s;
}
async function spTick() {
  if (screen !== 'spotify') { clearInterval(sp.tick); sp.tick = null; clearInterval(sp.sm); sp.sm = null; return; }
    const r = await api.spCall('GET', '/me/player'); if (!r || !r.ok || screen !== 'spotify') return;
  const n = r.data && r.data.item ? r.data : null; sp.now = n; sp.nowAt = performance.now();
  const t = n && n.item, set = (id, v) => { const e = document.getElementById(id); if (e && e.textContent !== v) e.textContent = v; };
  const ic = (id, name) => { const e = document.getElementById(id); if (e && e.dataset.ic !== name) { e.dataset.ic = name; e.innerHTML = SPI[name]; } };
  set('spnt', t ? t.name : 'Nothing playing'); set('spna', t ? (spArtists(t) || (t.show && t.show.name) || '') : 'Pick something to play'); ic('spnb', n && n.is_playing ? 'pause' : 'play');
  const sh = document.getElementById('spsh'); if (sh) sh.classList.toggle('cur', !!(n && n.shuffle_state));
  const rp = document.getElementById('sprp'); if (rp) rp.classList.toggle('cur', !!(n && n.repeat_state && n.repeat_state !== 'off'));
  spSmooth(); set('spdu', spDur(t ? t.duration_ms : 0));
  const c = document.getElementById('spnc'); if (c && t) { const u = spPick((t.album || t.show || t).images); if (c.dataset.spimg !== u) { c.dataset.spimg = u; spPaint(); } }
  if (n && n.device && typeof n.device.volume_percent === 'number' && performance.now() > (sp.volHold || 0)) sp.vol = n.device.volume_percent;   // right after you change it, Spotify still reports the old value for a moment
  if (t && t.id && t.type === 'track' && sp.likeId !== t.id) { sp.likeId = t.id; const d = await spQ('/me/tracks/contains?ids=' + t.id); sp.likeOn = !!(d && d[0]); const lk = document.getElementById('splk'); if (lk) { lk.innerHTML = sp.likeOn ? SPI.heartf : SPI.heart; lk.classList.toggle('cur', sp.likeOn); } }
}
async function spEngine() {   // the sound engine: installed? does it need the one-time code?
  try { sp.eng = await api.lsInfo(); } catch { sp.eng = null; }
  if (screen === 'spotify' && sp.view === 'home') { const w = document.getElementById('spwarn'); if (w) w.outerHTML = spWarnHtml(); }
}
function spWarnHtml() {
  const p = sp.player || {}; let t = '';
  if (p.error) t = 'Sound: the console cannot play music itself yet. Run tools\\install-widevine.bat once (in the console folder), then restart the console.';
  return t ? `<p class="apsub spwarn" id="spwarn">${esc(t)}</p>` : '<i id="spwarn"></i>';
}
async function spLoadHome() {
  const [rec, pls, ta, tt, al, sh] = await Promise.all([spQ('/me/player/recently-played?limit=50'), spQ('/me/playlists?limit=50'), spQ('/me/top/artists?limit=12&time_range=medium_term'), spQ('/me/top/tracks?limit=12&time_range=short_term'), spQ('/me/albums?limit=12'), spQ('/me/shows?limit=12')]);
  sp.pls = ((pls && pls.items) || []).filter(Boolean);
  const seen = new Set(), recent = [];
  for (const i of ((rec && rec.items) || [])) { const a = i && i.track && i.track.album; if (a && a.id && !seen.has(a.id)) { seen.add(a.id); recent.push(a); } }
  sp.home = { recent, ta: ((ta && ta.items) || []).filter(Boolean), tt: ((tt && tt.items) || []).filter(Boolean), al: ((al && al.items) || []).map((i) => i && i.album).filter(Boolean), sh: ((sh && sh.items) || []).map((i) => i && i.show).filter(Boolean) };
  if (screen === 'spotify' && sp.view === 'home') show('spotify', SPF);
}
const spSnap = () => ({ view: sp.view, list: sp.list, listTitle: sp.listTitle, listSub: sp.listSub, listArt: sp.listArt, listCtx: sp.listCtx, ar: sp.ar, lib: sp.lib, res: sp.res });
function spGo(view, idx) { sp.hist.push(spSnap()); sp.view = view; show('spotify', idx === undefined ? SPF : idx); }
function spBack() {
  if (sp.hist.length) { Object.assign(sp, sp.hist.pop()); return show('spotify', SPF); }
  if (sp.view !== 'home') { sp.view = 'home'; return show('spotify'); }
  return show('apps');
}
SCREENS.spotify = {
  focus: '.sprow, .spb, .sprl, .acard, .spcard, .spq, .spnpb, .spmore, .spib, .spplay',
  get hints() { return 'A: Select    B: Back'; },
  html: () => {
    const s = sp.st, wrap = (inner) => `<div class="achpg v2 sppg"><h1>Spotify</h1>${inner}</div>`, btn = (a, l) => `<button class="xt acard" data-nav data-sp="${a}"><span class="ainf"><b>${l}</b></span></button>`;
    const shell = (rail, inner, now) => `<div class="achpg v2 sppg on"><nav class="sprail"><h1>Spotify</h1>${rail}${libHtml}</nav><main class="spmain">${inner}</main>${now}</div>`;
    if (!s) { spInit(); return wrap('<p class="apsub"><i class="spin"></i>Loading...</p>'); }
    if (!s.hasId) return wrap('<p class="apsub">Spotify needs a Client ID. Make a free app at developer.spotify.com/dashboard (redirect address http://127.0.0.1:8888/callback, tick Web API and Web Playback SDK), then enter its Client ID here.</p>' + btn('id', 'Enter Client ID'));
    if (!s.signedIn) return wrap('<p class="apsub">Sign in to your Spotify Premium account once. A small sign-in window opens; the sticks move the cursor and A clicks.</p>' + btn('signin', 'Sign in to Spotify') + btn('id', 'Change Client ID'));
    if (!sp.tick) { sp.tick = setInterval(spTick, 3000); setTimeout(spTick, 300); }
    if (!sp.sm) sp.sm = setInterval(spSmooth, 250);
    const root = ['home', 'search', 'lib', 'liked', 'np'].includes(sp.view) ? sp.view : (sp.hist[0] ? sp.hist[0].view : 'home');
    const rail = [['home', 'Home', 'home'], ['search', 'Search', 'search'], ['np', 'Now playing', 'music'], ['lib', 'All of your library', 'lib'], ['web', 'Full Spotify', 'search'], ['out', 'Sign out', 'out']].map(([x, l, i]) => `<button class="xt sprl${root === x ? ' cur' : ''}" data-nav data-sp="v:${x}">${SPI[i]}<span>${l}</span></button>`).join('') + '';
    const libRows = (sp.pls || []).slice(0, 24).map((p) => `<button class="xt sprl splib" data-nav data-sp="pl:${esc(p.id)}"><i class="spimg" data-spimg="${esc(spPick(p.images))}"></i><span class="spti"><b>${esc(p.name)}</b><small>Playlist${p.tracks && p.tracks.total != null ? ' · ' + p.tracks.total + ' songs' : ''}</small></span></button>`).join('');
    const libHtml = `<h2 class="spph">Your library</h2><button class="xt sprl splib${sp.view === 'liked' ? ' cur' : ''}" data-nav data-sp="v:liked"><i class="spimg likedcv">${SPI.heartf}</i><span class="spti"><b>Liked songs</b><small>Playlist</small></span></button>${libRows}`;
    SPF = 6 + 1 + (sp.pls || []).slice(0, 24).length;
    const warn = sp.view === 'home' ? spWarnHtml() : '';
    const head = (art, kind, title, sub, ctx, round) => `<div class="sphead"><i class="spimg sq big${round ? ' rd' : ''}" data-spimg="${esc(art || '')}"></i><span class="spti"><small>${esc(kind)}</small><b>${esc(title)}</b><small>${esc(sub || '')}</small>${ctx ? `<span class="spbtns"><button class="xt spplay" data-nav data-sp="ctx:${esc(ctx)}">${SPI.play}</button><button class="xt spib" data-nav data-sp="ctxs:${esc(ctx)}">${SPI.shuffle}</button></span>` : ''}</span></div>`;
    let body = '';
    const v = sp.view;
    if (v === 'home') {
      const h = sp.home, hr = new Date().getHours(), hi = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
      const qk = (act, img, title, cv) => `<button class="xt spq" data-nav data-sp="${esc(act)}"><i class="spimg${cv ? ' likedcv' : ''}" data-spimg="${esc(img || '')}">${cv ? SPI.heartf : ''}</i><span class="spti"><b>${esc(title)}</b></span></button>`;
      const quick = h ? [qk('v:liked', '', 'Liked songs', true)].concat((sp.pls || []).slice(0, 3).map((p) => qk('pl:' + p.id, spPick(p.images), p.name)), (h.recent || []).slice(0, 4).map((x) => qk('al:' + x.id, spPick(x.images), x.name))).join('') : '';
      body = `<h1 class="sphi">${hi}, Frankie</h1>` + (quick ? `<div class="spqk">${quick}</div>` : '') + (h ? (
        spShelf('Recently played', h.recent.slice(0, 10).map(spAlC), '') + spShelf('Your playlists', (sp.pls || []).slice(0, 10).map(spPlC), 'v:lib') +
        spShelf('Your top artists', h.ta.slice(0, 10).map(spArC), 'lib:ar') + spShelf('On repeat lately', h.tt.slice(0, 10).map(spTrC), '') +
        spShelf('Your albums', h.al.slice(0, 10).map(spAlC), 'lib:al') + spShelf('Your podcasts', h.sh.slice(0, 10).map(spShC), 'lib:sh')
      ) || '<p class="apsub">Play something on Spotify and your shelves will fill up here.</p>' : '<p class="apsub"><i class="spin"></i>Loading your Spotify...</p>');
    } else if (v === 'lib') {
      const tabs = [['pl', 'Playlists'], ['al', 'Albums'], ['ar', 'Top artists'], ['sh', 'Podcasts']].map(([x, l]) => `<button class="xt spb${sp.lib === x ? ' cur' : ''}" data-nav data-sp="lib:${x}">${l}</button>`).join('');
      const d = sp.lib === 'pl' ? (sp.pls || []).map(spPlC) : sp.libData[sp.lib] ? sp.libData[sp.lib].map(sp.lib === 'al' ? spAlC : sp.lib === 'ar' ? spArC : spShC) : null;
      body = `<h1 class="sphi">Your library</h1><div class="sptabs">${tabs}</div>` + (d ? (d.length ? `<div class="spgrid">${d.join('')}</div>` : '<p class="apsub">Nothing here yet.</p>') : '<p class="apsub"><i class="spin"></i>Loading...</p>');
    } else if (v === 'liked') {
      body = head('', 'Playlist', 'Liked songs', sp.liked ? sp.liked.length + ' songs' : '', '') + (sp.liked ? `<div class="splist">${sp.liked.map((t, i) => spTrackRow(t, '', i + 1)).join('') || '<p class="apsub">No liked songs yet.</p>'}</div>` : '<p class="apsub"><i class="spin"></i>Loading...</p>');
    } else if (v === 'list') {
      body = head(sp.listArt, sp.listCtx.includes(':album:') ? 'Album' : sp.listCtx.includes(':show:') ? 'Podcast' : sp.listCtx.includes(':playlist:') ? 'Playlist' : 'Songs', sp.listTitle, sp.listSub, sp.listCtx) + `<div class="splist">${(sp.list || []).map((t, i) => t.type === 'episode' ? spEpRow(t) : spTrackRow(t, sp.listCtx, i + 1)).join('') || '<p class="apsub">Nothing here.</p>'}</div>`;
    } else if (v === 'artist' && sp.ar) {
      const a = sp.ar;
      body = head(spPick(a.info.images), 'Artist', a.info.name, a.info.followers ? a.info.followers.total.toLocaleString() + ' followers' : '', a.info.uri, true) + (a.top.length ? `<h2 class="agh"><b>Popular</b></h2><div class="splist">${a.top.slice(0, 5).map((t, i) => spTrackRow(t, '', i + 1)).join('')}</div>` : '') + spShelf('Albums and singles', a.albums.slice(0, 12).map(spAlC), '');
    } else if (v === 'search') {
      const r = sp.res;
      body = `<h1 class="sphi">Search</h1>` + btn('dosearch', r ? 'Search again' : 'What do you want to play?') + (r ? (
        (r.tracks.length ? `<h2 class="agh"><b>Songs</b></h2><div class="splist">${r.tracks.slice(0, 6).map((t) => spTrackRow(t, '')).join('')}</div>` : '') + spShelf('Artists', r.ar.slice(0, 6).map(spArC), '') + spShelf('Albums', r.al.slice(0, 6).map(spAlC), '') + spShelf('Playlists', r.pl.slice(0, 6).map(spPlC), '') + spShelf('Podcasts', r.sh.slice(0, 6).map(spShC), '') || '<p class="apsub">Nothing found.</p>') : '');
    } else if (v === 'np') {
      const n = sp.now, t = n && n.item;
      body = t ? `<div class="sphead np"><i class="spimg sq huge" data-spimg="${esc(spPick((t.album || t.show || t).images))}"></i><span class="spti"><small>Now playing</small><b>${esc(t.name)}</b><small>${esc(spArtists(t) || (t.show && t.show.name) || '')}</small><small>${esc(t.album ? t.album.name : '')}</small></span></div><h2 class="agh"><b>Next in queue</b></h2><div class="splist">${sp.queue ? (sp.queue.slice(0, 8).map((q) => q.type === 'episode' ? spEpRow(q) : spTrackRow(q, '')).join('') || '<p class="apsub">The queue is empty.</p>') : '<p class="apsub"><i class="spin"></i>Loading...</p>'}</div>` : '<h1 class="sphi">Nothing playing</h1><p class="apsub">Pick a song, album, playlist or podcast and it starts here.</p>';
    } else body = '<p class="apsub"><i class="spin"></i>Loading...</p>';
    return shell(rail, `${warn}${body}`, `<div class="spnow">${spNowHtml()}</div>`);
  },
};
async function spOpenList(title, items, ctx, sub, art) { sp.listTitle = title; sp.list = items; sp.listCtx = ctx || ''; sp.listSub = sub || ''; sp.listArt = art || ''; spGo('list'); }
async function spDevice() {
  if (sp.player && sp.player.device) return sp.player.device;
  const d = await spCall('GET', '/me/player/devices'); const l = (d && d.devices) || [];
  const x = l.find((y) => /frankie console/i.test(y.name)) || l.find((y) => y.is_active) || l[0]; if (!x) { note('Spotify: no sound player yet. Run tools\\install-widevine.bat once, then restart the console.'); return ''; }
  return x.id;
}
async function spPlay(body) { const dev = await spDevice(); if (!dev) return; const r = await spCall('PUT', '/me/player/play?device_id=' + dev, body); if (r) setTimeout(spTick, 800); return r; }
async function spAct(a) {
  if (a === 'id') { const v = await openOsk('Spotify Client ID (32 letters and numbers)', '', { done: 'Save' }); if (v === null || v === undefined || !String(v).trim()) return; const ok = await api.spSetId(v); if (!ok) return note('That is not a Client ID (it has 32 letters and numbers).'); sp.st = await api.spStatus(); return show('spotify'); }
  if (a === 'signin') { note('Signing in...'); const r = await api.spSignIn(); if (!r || !r.ok) return note('Spotify: ' + ((r && r.error) || 'sign-in failed')); sp.st = await api.spStatus(); sp.pls = sp.home = null; show('spotify'); return spLoadHome(); }
  if (a === 'v:web') return api.spwebOpen();
  if (a === 'v:out') { await api.spSignOut(); sp.st = await api.spStatus(); sp.pls = sp.liked = sp.home = sp.now = null; sp.libData = {}; sp.hist = []; sp.view = 'home'; return show('spotify'); }
  if (a.startsWith('v:')) {   // the menu on the left
    const x = a.slice(2); sp.hist = []; sp.view = x; const idx = ({ home: 0, search: 1, np: 2, lib: 3, liked: 6 })[x] ?? 0;
    show('spotify', idx);
    if (x === 'home' && !sp.home) spLoadHome();
    if (x === 'liked' && !sp.liked) { const d = await spQ('/me/tracks?limit=50'); sp.liked = ((d && d.items) || []).map((i) => i && i.track).filter(Boolean); if (sp.view === 'liked') show('spotify', idx); }
    if (x === 'np') { const d = await spQ('/me/player/queue'); sp.queue = (d && d.queue) || []; if (sp.view === 'np') show('spotify', idx); }
    return;
  }
  if (a.startsWith('lib:')) {
    const x = a.slice(4); sp.lib = x; sp.view = 'lib'; show('spotify', SPF);
    if (x !== 'pl' && !sp.libData[x]) { const p = x === 'al' ? '/me/albums?limit=50' : x === 'ar' ? '/me/top/artists?limit=50&time_range=long_term' : '/me/shows?limit=50'; const d = await spQ(p); sp.libData[x] = ((d && d.items) || []).map((i) => (i && (i.album || i.show)) || i).filter(Boolean); if (sp.view === 'lib' && sp.lib === x) show('spotify', SPF); }
    return;
  }
  if (a === 'dosearch') {
    const q = await openOsk('Search Spotify', '', { done: 'Search' }); if (!q || !String(q).trim()) return;
    const d = await spQ('/search?type=track,artist,album,playlist,show&limit=8&q=' + encodeURIComponent(String(q).trim())); if (!d) return note('Spotify: the search did not work.');
    const g = (k) => ((d[k] && d[k].items) || []).filter(Boolean);
    sp.res = { tracks: g('tracks'), ar: g('artists'), al: g('albums'), pl: g('playlists'), sh: g('shows') }; sp.view = 'search'; return show('spotify', SPF);
  }
  if (a.startsWith('pl:')) { const id = a.slice(3); const pl = (sp.pls || []).concat(sp.res ? sp.res.pl : []).find((p) => p && p.id === id); let d = await api.spCall('GET', '/playlists/' + id + '/tracks?limit=100'); if (!d || !d.ok) d = await api.spCall('GET', '/playlists/' + id + '/items?limit=100'); if (!d || !d.ok) { if (pl && pl.uri) { note('Spotify will not show the songs of this playlist, so it is playing directly.'); return spPlay({ context_uri: pl.uri }); } return note('Spotify: ' + ((d && d.error) || 'could not open the playlist')); } return spOpenList(pl ? pl.name : 'Playlist', ((d.data && d.data.items) || []).map((i) => i && (i.track || i.item)).filter((t) => t && t.uri), pl ? pl.uri : '', pl && pl.owner ? 'By ' + (pl.owner.display_name || '') : '', pl ? spPick(pl.images) : ''); }
  if (a.startsWith('al:')) { const d = await spQ('/albums/' + a.slice(3)); if (!d) return note('Spotify: could not open the album'); const tr = ((d.tracks && d.tracks.items) || []).map((t) => ({ ...t, album: { name: d.name, images: d.images } })); return spOpenList(d.name, tr, d.uri, (d.artists || []).map((x) => x.name).join(', ') + (d.release_date ? ' · ' + d.release_date.slice(0, 4) : ''), spPick(d.images)); }
  if (a.startsWith('sh:')) { const id = a.slice(3); const [d, e] = await Promise.all([spQ('/shows/' + id), spQ('/shows/' + id + '/episodes?limit=30')]); if (!d) return note('Spotify: could not open the podcast'); return spOpenList(d.name, ((e && e.items) || []).filter(Boolean).map((x) => ({ ...x, type: 'episode' })), d.uri, d.publisher || '', spPick(d.images)); }
  if (a.startsWith('ar:')) {
    const id = a.slice(3); const [info, top, albums] = await Promise.all([spQ('/artists/' + id), spQ('/artists/' + id + '/top-tracks?market=from_token'), spQ('/artists/' + id + '/albums?include_groups=album,single&limit=12')]);
    if (!info) return note('Spotify: could not open the artist');
    let tt = ((top && top.tracks) || []).filter(Boolean);
    if (!tt.length) { const s = await spQ('/search?type=track&limit=8&q=' + encodeURIComponent('artist:"' + info.name + '"')); tt = ((s && s.tracks && s.tracks.items) || []).filter((t) => t && (t.artists || []).some((x) => x.id === id)); }
    sp.ar = { info, top: tt, albums: ((albums && albums.items) || []).filter(Boolean) }; return spGo('artist');
  }
  if (a.startsWith('ctx:') || a.startsWith('ctxs:')) { const sh = a.startsWith('ctxs:'); const ctx = a.slice(sh ? 5 : 4); if (sh) await spCall('PUT', '/me/player/shuffle?state=true'); return spPlay({ context_uri: ctx }); }
  if (a.startsWith('play:')) { const [uri, ctx] = a.slice(5).split('|'); return spPlay(ctx && ctx.indexOf(':') > 0 ? { context_uri: ctx, offset: { uri } } : { uris: [uri] }); }
  if (a === 'np') { sp.queue = null; sp.view = 'np'; spGo('np'); const d = await spQ('/me/player/queue'); sp.queue = (d && d.queue) || []; if (sp.view === 'np') show('spotify', SPF); return; }
  if (a === 'toggle') { const dev = await spDevice(); const r = await spCall('PUT', (sp.now && sp.now.is_playing ? '/me/player/pause' : '/me/player/play') + (dev ? '?device_id=' + dev : '')); if (r) setTimeout(spTick, 600); return; }
  if (a === 'next' || a === 'prev') { const r = await spCall('POST', '/me/player/' + (a === 'next' ? 'next' : 'previous')); if (r) setTimeout(spTick, 700); return; }
  if (a === 'shuf') { const on = !(sp.now && sp.now.shuffle_state); const r = await spCall('PUT', '/me/player/shuffle?state=' + on); if (r) setTimeout(spTick, 500); return; }
  if (a === 'rep') { const c = sp.now ? sp.now.repeat_state : 'off'; const nx = c === 'off' ? 'context' : c === 'context' ? 'track' : 'off'; const r = await spCall('PUT', '/me/player/repeat?state=' + nx); if (r) setTimeout(spTick, 500); return; }
  if (a === 'like') { const t = sp.now && sp.now.item; if (!t || !t.id || t.type !== 'track') return note('Spotify: nothing to like right now.'); const r = await spCall(sp.likeOn ? 'DELETE' : 'PUT', '/me/tracks?ids=' + t.id); if (r) { sp.likeOn = !sp.likeOn; sp.liked = null; const lk = document.getElementById('splk'); if (lk) { lk.innerHTML = sp.likeOn ? SPI.heartf : SPI.heart; lk.classList.toggle('cur', sp.likeOn); } note(sp.likeOn ? 'Added to Liked songs' : 'Removed from Liked songs'); } return; }
  if (a === 'vu' || a === 'vd') { sp.vol = Math.max(0, Math.min(100, sp.vol + (a === 'vu' ? 10 : -10))); sp.volHold = performance.now() + 5000; await spCall('PUT', '/me/player/volume?volume_percent=' + sp.vol); return note('Volume ' + sp.vol + '%'); }
}
/* ---------- YouTube (v625): the console's own YouTube screen: search, pick, full-quality player ---------- */
const yt = { res: null, busy: false, title: 'Popular right now', err: '' };
const YTP = [['Popular right now', 'trending today'], ['Music', 'new music videos'], ['Gaming', 'gaming highlights'], ['Movie trailers', 'official movie trailers'], ['Live', 'live now'], ['Sports', 'sports highlights today']];
const YTF = 8;   // number of menu buttons on the left
const ytCard = (v) => `<button class="xt spcard ytc" data-nav data-yt="play:${esc(v.id)}"><i class="spimg yimg" data-ytimg="${esc(v.id)}"></i><span class="spti"><b>${esc(v.title)}</b><small>${esc(v.by)}${v.views ? ' · ' + esc(v.views) : ''}${v.ago ? ' · ' + esc(v.ago) : ''}</small></span>${v.len ? `<em class="ylen">${esc(v.len)}</em>` : ''}</button>`;
function ytPaint() { document.querySelectorAll('#screen [data-ytimg]').forEach((e) => { const id = e.dataset.ytimg; if (/^[\w-]{11}$/.test(id)) e.style.backgroundImage = `url("https://i.ytimg.com/vi/${id}/hqdefault.jpg")`; }); }
async function ytRun(q, title) {
  yt.busy = true; yt.res = null; yt.err = ''; yt.title = title; show('ytube', 1);
  const r = await api.ytSearch(q); yt.busy = false;
  yt.res = r && r.ok ? r.items : []; if (!r || !r.ok) yt.err = 'YouTube did not answer. Check the internet and try again.';
  if (screen === 'ytube') show('ytube', yt.res.length ? YTF : 1);
}
SCREENS.ytube = {
  focus: '.sprl, .spcard',
  get hints() { return 'A: Select    B: Back'; },
  html: () => {
    const rail = [['search', 'Search'], ...YTP.map((p, i) => ['p' + i, p[0]]), ['tv', 'YouTube TV screen']].map(([x, l]) => `<button class="xt sprl${x === 'search' ? '' : ''}" data-nav data-yt="v:${x}"><span>${l}</span></button>`).join('');
    let body;
    if (!yt.res && !yt.busy) { setTimeout(() => ytRun(YTP[0][1], YTP[0][0]), 0); yt.busy = true; }
    if (!yt.res) body = '<p class="apsub"><i class="spin"></i>Loading...</p>';
    else if (!yt.res.length) body = `<p class="apsub">${esc(yt.err || 'Nothing found. Try another search.')}</p>`;
    else body = `<section class="spshelf"><div class="spgrid ytgrid">${yt.res.map(ytCard).join('')}</div></section>`;
    return `<div class="achpg v2 sppg ytpg on"><nav class="sprail"><h1>YouTube</h1>${rail}</nav><main class="spmain"><h1 class="sphi">${esc(yt.title)}</h1>${body}</main></div>`;
  },
};
async function ytAct(a) {
  if (a === 'v:search') { const q = await openOsk('Search YouTube', '', { done: 'Search' }); if (!q || !String(q).trim()) return; return ytRun(String(q).trim(), 'Results for ' + String(q).trim()); }
  if (a === 'v:tv') return api.ytOpen();
  if (a.startsWith('v:p')) { const p = YTP[+a.slice(3)]; if (p) ytRun(p[1], p[0]); return; }
  if (a.startsWith('play:')) { const r = await api.ypPlay(a.slice(5)); if (!r || !r.ok) note('YouTube: could not start the video.'); }
}
let pickApps = null, pickBusy = false, appsBg = false;
const appTile = (x) => appArt.has(x.id) ? `<button class="xt atile asq" data-nav data-app="${esc(x.id)}"><img class="axb" src="ctheme://img/${esc(appArt.get(x.id))}" alt="" draggable="false"><span>${esc(x.name)}</span></button>` : `<button class="xt atile" data-nav data-app="${esc(x.id)}">${x.icon ? `<img class="aimg" src="ctheme://img/${esc(x.icon)}" alt="" draggable="false">` : `<b data-bg="${esc(x.color)}">${esc(x.name.charAt(0))}</b>`}<span>${esc(x.name)}</span></button>`;
SCREENS.apps = {
  focus: '.atile',
  get hints() { const b = settings.binds; return `${b.confirm}: Open    ${b.back}: Back`; },
  html: () => `<h1 data-sqload="${(setTimeout(loadSquares, 300), '')}">Apps</h1><p class="apsub">Opens full screen on this monitor. Press the Xbox button to come back here.</p><div class="agrid">${(settings.webApps || []).map(appTile).join('')}</div>`,
};
SCREENS.apppick = {
  focus: '.atile',
  hints: 'A: Add    B: Back',
  html: () => `<h1>Installed apps</h1><p class="apsub">${pickApps ? 'Pick an app to add to your Apps screen.' : (pickBusy ? 'Reading your installed apps...' : 'Could not read your installed apps.')}</p><div class="agrid">${pickApps ? pickApps.map((x, i) => `<button class="xt atile" data-nav data-pick="${i}">${x.icon ? `<img class="aimg" src="ctheme://img/${esc(x.icon)}" alt="" draggable="false">` : '<b>' + esc(x.name.charAt(0)) + '</b>'}<span>${esc(x.name)}</span></button>`).join('') : '<button class="xt atile aadd" data-nav data-go="apps"><b>&lt;</b><span>Back</span></button>'}</div>`,
};
async function loadPick() {
  if (pickApps) return show('apppick');
  pickBusy = true; show('apppick'); note('Reading your installed apps. This can take a few seconds.');
  const r = await api.listApps(); pickBusy = false;
  pickApps = r && r.ok ? r.apps : null;
  if (!pickApps) note((r && r.error) || 'Could not read your installed apps.');
  if (screen === 'apppick') show('apppick');
}
async function pickAdd(i) {
  const x = pickApps && pickApps[i]; if (!x) return;
  const list = [...(settings.webApps || [])];
  if (list.some((y) => y.appId === x.appId)) return note(x.name + ' is already added.');
  list.push({ id: '', name: x.name, kind: 'app', url: '', appId: x.appId, icon: x.icon || '', color: APP_COLORS[list.length % APP_COLORS.length] });
  await change({ webApps: list }); note(x.name + ' added.');
}
async function appsBackground() {   // once per run: give websites their real icons, and swap in the installed app when one exists
  if (appsBg) return; appsBg = true;
  let list = [...(settings.webApps || [])], dirty = false;
  let v = ''; try { v = localStorage.getItem('iconsV4') || ''; } catch {}
  if (!v) {   // one time: replace the old small, blurry website icons with the sites' own full-size app icons
    const URLS = { YouTube: 'https://www.youtube.com', Netflix: 'https://www.netflix.com', Spotify: 'https://open.spotify.com', Twitch: 'https://www.twitch.tv', Google: 'https://www.google.com' };
    for (const x of list) { const u = x.kind === 'web' ? x.url : (/^a\d$/.test(x.id) ? URLS[x.name] : ''); if (!u) continue; const ic = await api.webIcon(u, true); if (ic) { x.icon = ic; dirty = true; } }
    try { localStorage.setItem('iconsV4', '1'); } catch {}
    if (dirty) { await change({ webApps: list }); if (screen === 'apps' || screen === 'home') show(screen, focusIdx()); dirty = false; }
  }
  for (const x of list) if (x.kind === 'web' && !x.icon) { const ic = await api.webIcon(x.url); if (ic) { x.icon = ic; dirty = true; } }
  if (!settings.appsMatched) {
    const r = await api.listApps();
    if (r && r.ok) {
      pickApps = r.apps;
      list = list.map((x) => { if (x.kind !== 'web' || !/^a\d$/.test(x.id) || x.name === 'Google' || x.name === 'Twitch') return x; const hit = r.apps.find((y) => y.name.toLowerCase() === x.name.toLowerCase() || y.name.toLowerCase().startsWith(x.name.toLowerCase())); return hit ? { ...x, kind: 'app', appId: hit.appId, icon: hit.icon || x.icon } : x; });
      dirty = true; await change({ webApps: list, appsMatched: true }); if (screen === 'apps') show('apps', focusIdx()); return;
    }
  }
  if (dirty) { await change({ webApps: list }); if (screen === 'apps') show('apps', focusIdx()); }
}
const APP_COLORS = ['#e62117', '#1db954', '#8a4bef', '#0e9ad6', '#e0a030', '#d2475f', '#16a5b8', '#e06a2c', '#c23fa3', '#2fa66a'];
let appOpenT = 0;
function showAppOpen(x) {   // the page softens and an app card rises over it while the app opens; it fades away once the app has taken the screen
  let el = document.getElementById('appopen');
  if (!el) { el = document.createElement('div'); el.id = 'appopen'; document.body.appendChild(el); }
  const art = appArt.has(x.id) ? 'ctheme://img/' + appArt.get(x.id) : '';
  const ic = art ? `<img class="aofull" src="${art}" alt="" draggable="false">` : x.icon ? `<img src="ctheme://img/${esc(x.icon)}" alt="" draggable="false">` : `<span>${esc((x.name || '?').slice(0, 1).toUpperCase())}</span>`;
  el.innerHTML = `<div class="aoc"><div class="aoi${art ? ' full' : ''}">${ic}</div><div class="aon">${esc(x.name || '')}</div><div class="aob"><i></i></div></div>`;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); document.body.classList.add('appopening');
  let blurred = false; const done = () => { el.classList.remove('on'); document.body.classList.remove('appopening'); window.removeEventListener('blur', onB); window.removeEventListener('focus', onF); clearTimeout(appOpenT); };
  const onB = () => { blurred = true; }, onF = () => { if (blurred) setTimeout(done, 150); };
  window.__aoDone = done; window.addEventListener('blur', onB); window.addEventListener('focus', onF); clearTimeout(appOpenT); appOpenT = setTimeout(done, 20000);
}
const openedApps = new Set();
async function openApp(id) {
  openedApps.add(id);
  const sx = (settings.webApps || []).find((y) => y.id === id); if (sx && /^spotify$/i.test(String(sx.name).trim())) { showAppOpen(sx); const r = await api.spwebOpen(); const t0 = Date.now(); const iv = setInterval(async () => { try { const st = await api.spState(); if ((st && st.shown) || Date.now() - t0 > 12000) { clearInterval(iv); setTimeout(() => { if (window.__aoDone) window.__aoDone(); }, 250); } } catch { clearInterval(iv); if (window.__aoDone) window.__aoDone(); } }, 150); return r; }   if (sx && /^youtube$/i.test(String(sx.name).trim())) { showAppOpen(sx); const r = await api.ytOpen(); const t0 = Date.now(); const iv = setInterval(async () => { try { const st = await api.ytState(); if ((st && st.shown) || Date.now() - t0 > 14000) { clearInterval(iv); setTimeout(() => { if (window.__aoDone) window.__aoDone(); }, 250); } } catch { clearInterval(iv); if (window.__aoDone) window.__aoDone(); } }, 150); return r; }   // Spotify is built into the console: no Store app, no web page
  rememberReturn();
  const x = (settings.webApps || []).find((y) => y.id === id); if (!x) return;
  showAppOpen(x);
  note('Opening ' + x.name + '. Press the Xbox button to come back.');
  const r = x.kind === 'app' ? await api.launchApp(x.appId) : await api.openWeb(x.url);
  if (r && !r.ok) note('Could not open ' + x.name + ': ' + r.error);
}
async function addApp() {
  const name = await openOsk('Website name', '', { done: 'Next' }); if (!name || !name.trim()) return;
  const url = await openOsk('Web address (for example hulu.com)', '', { done: 'Add' }); if (!url || !url.trim()) return;
  const list = [...(settings.webApps || [])];
  const full = /^https?:\/\//i.test(url.trim()) ? url.trim() : 'https://' + url.trim();
  const icon = await api.webIcon(full);
  list.push({ id: '', name: name.trim(), kind: 'web', url: full, appId: '', icon: icon || '', color: APP_COLORS[list.length % APP_COLORS.length] });
  await change({ webApps: list }); show('apps', list.length - 1); note(name.trim() + ' added.');
}
async function removeApp(id) { return note('Removing apps is turned off.'); await change({ webApps: (settings.webApps || []).filter((x) => x.id !== id) }); show('apps', 0); note('Removed.'); }
SCREENS.library = {
  get hints() { const b = settings.binds; return `${b.confirm}: Open game    BACK: Filters    START: Options    ${b.search}: Search    ${b.back}: Back`; },
  focus: '.lgrid [data-game]',
  html: () => {
    const list = shownGames();
    return `<div class="ltop"><span class="av" data-av>${esc(profileName()[0].toUpperCase())}</span><span class="lname">${esc(profileName())}</span>${libFilter ? `<span class="lq">“${esc(libFilter)}”</span>` : ''}${libSort !== 'recent' || libSrc ? `<span class="lq">${esc([libSort !== 'recent' ? SORTS[libSort] : '', libSrc].filter(Boolean).join(' · '))}</span>` : ''}
        <span class="lr"><button class="lopt" tabindex="-1" data-act="libmenu">${ICON.filter}<b>${list.length}</b></button><span class="lclk"></span></span></div>
      <div class="lgrid" data-sqload="${(setTimeout(loadSquares, 300), '')}">${list.length ? list.map(lcover).join('') : `<p class="empty">${games.length ? 'No games match.' : 'No games yet. Open the menu at the top to add a game folder.'}</p>`}</div>
      <div class="lpanel" id="lpanel">${lpanelHtml(list[0])}</div>
      <div class="lbot">${ICON.bars}<span>Library</span></div>`;
  },
};
let lpTimer = 0;
function updateLibPanel(g) {   // the panel on the right follows the game you have selected; its trailer starts a moment later
  const p = $('#lpanel'); if (!p || !g) return;
  if (p.dataset.gid === g.id) return;
  SND.hush(false); p.dataset.gid = g.id;
  {   // v1266: patch the panel in place (only what differs) instead of rebuilding it, so nothing blinks while you move between games
    const tmp = document.createElement('div'); tmp.innerHTML = lpanelHtml(g);
    const nk = [...tmp.children], ok = [...p.children];
    if (!ok.length || nk.length !== ok.length || nk.some((e, i) => e.className !== ok[i].className)) p.innerHTML = tmp.innerHTML;
    else nk.forEach((e, i) => {
      const o = ok[i];
      if (o.classList.contains('lpv')) { const a = o.querySelector('video'), b = e.querySelector('video'); if (!a && !b) { o.innerHTML = e.innerHTML; } else if (!(a && b && a.dataset.trailer === b.dataset.trailer)) { o.replaceWith(e); } }
      else if (o.classList.contains('lhints')) { /* never changes */ }
      else if (o.innerHTML !== e.innerHTML) o.innerHTML = e.innerHTML;
    });
  }
  applyCovers(); applyDynamic(false);
  clearTimeout(lpTimer);
  lpTimer = setTimeout(() => startTrailer('.lvid[data-trailer]'), 400);
  clearTimeout(lpRateT);   // no rating yet: look it up once you rest on the game
  if (!g.rating && !g.ratingTried && (g.steamId || settings.rawgKey || settings.igdbId)) lpRateT = setTimeout(() => api.catRate(g.id).then((r) => {
    if (!r || !r.ok) return; games = r.games; const ng = games.find((x) => x.id === g.id), pp = $('#lpanel');
    if (ng && ng.rating && pp && pp.dataset.gid === g.id) { const rt = pp.querySelector('.lrate'); if (rt && !rt.querySelector('.stars')) { rt.insertAdjacentHTML('afterbegin', `<span class="stars"><span class="sb">\u2605\u2605\u2605\u2605\u2605</span><span class="sf" data-w="${Math.round(ng.rating / 5 * 100)}">\u2605\u2605\u2605\u2605\u2605</span></span>`); applyDynamic(false); } }
  }).catch(() => {}), 500);
  clearTimeout(lpInfoT);   // no description yet: fetch it once you rest on the game for a moment
  if (!g.description && !g.infoTried) lpInfoT = setTimeout(() => api.catInfo(g.id).then((r) => {
    if (r && r.ok) { games = r.games; const ng = games.find((x) => x.id === g.id); const pp = $('#lpanel'); if (ng && ng.description && pp && pp.dataset.gid === g.id) { const d = pp.querySelector('.ldesc'); if (d) d.innerHTML = String(ng.description).split(/\n+/).filter(Boolean).slice(0, 2).map((t) => `<p>${esc(t)}</p>`).join(''); } }
  }).catch(() => {}), 700);
}
let lpInfoT = 0, lpRateT = 0;
function libAct(a) {
  if (a === 'scope0' || a === 'scope1' || a === 'scope2') { libScope = Number(a.slice(5)); return show('library'); }
  activate({ dataset: a === 'home' ? { go: 'home' } : { act: a } });
}
function openGame(id) {
  if (!games.some((x) => x.id === id)) return;
  if (screen !== 'game') { prevScreen = screen; prevIdx = focusIdx(); libBack = null; if (screen === 'library') { const lg = document.querySelector('.lgrid'); libBack = { id, top: lg ? lg.scrollTop : 0 }; } }
  gameId = id; descOpen = false; show('game');
  const g = games.find((x) => x.id === id);
  if (g && !g.infoTried && !g.description) api.catInfo(id).then((r) => {   // fill in the description and rating in the background
    if (r && r.ok) { games = r.games; if (screen === 'game' && gameId === id) show('game', focusIdx()); }
  });
}
const fmtDur = (sec) => { const m = Math.round(sec / 60); return m < 1 ? '0 min' : m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min'; };
const PLAT_LOGO = {"steam": "M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.4 3.4 0 0 1 1.912-.59q.094.001.188.006l2.861-4.142V8.91a4.53 4.53 0 0 1 4.524-4.524c2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911q.002.078.004.159a3.39 3.39 0 0 1-3.39 3.396 3.41 3.41 0 0 1-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0M7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25a2.551 2.551 0 0 0 3.337-3.324 2.547 2.547 0 0 0-3.255-1.413l1.523.63a1.878 1.878 0 0 1-1.445 3.467zm11.415-9.303a3.02 3.02 0 0 0-3.015-3.015 3.015 3.015 0 1 0 3.015 3.015m-5.273-.005a2.264 2.264 0 1 1 4.531 0 2.267 2.267 0 0 1-2.266 2.265 2.264 2.264 0 0 1-2.265-2.265", "epic": "M3.537 0C2.165 0 1.66.506 1.66 1.879V18.44a4 4 0 0 0 .02.433c.031.3.037.59.316.92.027.033.311.245.311.245.153.075.258.13.43.2l8.335 3.491c.433.199.614.276.928.27h.002c.314.006.495-.071.928-.27l8.335-3.492c.172-.07.277-.124.43-.2 0 0 .284-.211.311-.243.28-.33.285-.621.316-.92a4 4 0 0 0 .02-.434V1.879c0-1.373-.506-1.88-1.878-1.88zm13.366 3.11h.68c1.138 0 1.688.553 1.688 1.696v1.88h-1.374v-1.8c0-.369-.17-.54-.523-.54h-.235c-.367 0-.537.17-.537.539v5.81c0 .369.17.54.537.54h.262c.353 0 .523-.171.523-.54V8.619h1.373v2.143c0 1.144-.562 1.71-1.7 1.71h-.694c-1.138 0-1.7-.566-1.7-1.71V4.82c0-1.144.562-1.709 1.7-1.709zm-12.186.08h3.114v1.274H6.117v2.603h1.648v1.275H6.117v2.774h1.74v1.275h-3.14zm3.816 0h2.198c1.138 0 1.7.564 1.7 1.708v2.445c0 1.144-.562 1.71-1.7 1.71h-.799v3.338h-1.4zm4.53 0h1.4v9.201h-1.4zm-3.13 1.235v3.392h.575c.354 0 .523-.171.523-.54V4.965c0-.368-.17-.54-.523-.54zm-3.74 10.147a1.7 1.7 0 0 1 .591.108 1.8 1.8 0 0 1 .49.299l-.452.546a1.3 1.3 0 0 0-.308-.195.9.9 0 0 0-.363-.068.7.7 0 0 0-.28.06.7.7 0 0 0-.224.163.8.8 0 0 0-.151.243.8.8 0 0 0-.056.299v.008a.9.9 0 0 0 .056.31.7.7 0 0 0 .157.245.7.7 0 0 0 .238.16.8.8 0 0 0 .303.058.8.8 0 0 0 .445-.116v-.339h-.548v-.565H7.37v1.255a2 2 0 0 1-.524.307 1.8 1.8 0 0 1-.683.123 1.6 1.6 0 0 1-.602-.107 1.5 1.5 0 0 1-.478-.3 1.4 1.4 0 0 1-.318-.455 1.4 1.4 0 0 1-.115-.58v-.008a1.4 1.4 0 0 1 .113-.57 1.5 1.5 0 0 1 .312-.46 1.4 1.4 0 0 1 .474-.309 1.6 1.6 0 0 1 .598-.111h.045zm11.963.008a2 2 0 0 1 .612.094 1.6 1.6 0 0 1 .507.277l-.386.546a1.6 1.6 0 0 0-.39-.205 1.2 1.2 0 0 0-.388-.07.35.35 0 0 0-.208.052.15.15 0 0 0-.07.127v.008a.16.16 0 0 0 .022.084.2.2 0 0 0 .076.066 1 1 0 0 0 .147.06q.093.03.236.061a3 3 0 0 1 .43.122 1.3 1.3 0 0 1 .328.17.7.7 0 0 1 .207.24.74.74 0 0 1 .071.337v.008a.9.9 0 0 1-.081.382.8.8 0 0 1-.229.285 1 1 0 0 1-.353.18 1.6 1.6 0 0 1-.46.061 2.2 2.2 0 0 1-.71-.116 1.7 1.7 0 0 1-.593-.346l.43-.514q.416.335.9.335a.46.46 0 0 0 .236-.05.16.16 0 0 0 .082-.142v-.008a.15.15 0 0 0-.02-.077.2.2 0 0 0-.073-.066.8.8 0 0 0-.143-.062 3 3 0 0 0-.233-.062 5 5 0 0 1-.413-.113 1.3 1.3 0 0 1-.331-.16.7.7 0 0 1-.222-.243.73.73 0 0 1-.082-.36v-.008a.9.9 0 0 1 .074-.359.8.8 0 0 1 .214-.283 1 1 0 0 1 .34-.185 1.4 1.4 0 0 1 .448-.066zm-9.358.025h.742l1.183 2.81h-.825l-.203-.499H8.623l-.198.498h-.81zm2.197.02h.814l.663 1.08.663-1.08h.814v2.79h-.766v-1.602l-.711 1.091h-.016l-.707-1.083v1.593h-.754zm3.469 0h2.235v.658h-1.473v.422h1.334v.61h-1.334v.442h1.493v.658h-2.255zm-5.3.897-.315.793h.624zm-1.145 5.19h8.014l-4.09 1.348z", "gog": "M7.15 15.24H4.36a.4.4 0 0 0-.4.4v2c0 .21.18.4.4.4h2.8v1.32h-3.5c-.56 0-1.02-.46-1.02-1.03v-3.39c0-.56.46-1.02 1.03-1.02h3.48zm1.01-3.7c0 .58-.47 1.05-1.05 1.05H2.63v-1.35h3.78a.4.4 0 0 0 .4-.4V6.39a.4.4 0 0 0-.4-.4H4.39a.4.4 0 0 0-.41.4v2.02c0 .23.18.4.4.4H6v1.35H3.68c-.58 0-1.05-.46-1.05-1.04V5.68c0-.57.47-1.04 1.05-1.04H7.1c.58 0 1.05.47 1.05 1.04v5.86zm13.2 7.82h-1.32v-4.12h-.93a.4.4 0 0 0-.4.4v3.72h-1.33v-4.12h-.93a.4.4 0 0 0-.4.4v3.72h-1.33v-4.42c0-.56.46-1.02 1.03-1.02h5.61zm.01-7.82c0 .58-.47 1.05-1.05 1.05h-4.48v-1.35h3.78a.4.4 0 0 0 .4-.4V6.39a.4.4 0 0 0-.4-.4h-2.03a.4.4 0 0 0-.4.4v2.02c0 .23.18.4.4.4h1.62v1.35H16.9c-.58 0-1.05-.46-1.05-1.04V5.68c0-.57.47-1.04 1.05-1.04h3.43c.58 0 1.05.47 1.05 1.04v5.86zm-7.65-6.9h-3.44c-.58 0-1.04.47-1.04 1.04v3.44c0 .58.46 1.04 1.04 1.04h3.44c.57 0 1.04-.46 1.04-1.04V5.68c0-.57-.47-1.04-1.04-1.04m-.3 1.75v2.02a.4.4 0 0 1-.4.4h-2.03a.4.4 0 0 1-.4-.4V6.4c0-.22.17-.4.4-.4H13c.23 0 .4.18.4.4zm-.79 7.53H9.24c-.57 0-1.03.46-1.03 1.02v3.39c0 .57.46 1.03 1.03 1.03h3.39c.57 0 1.03-.46 1.03-1.03v-3.39c0-.56-.46-1.02-1.03-1.02m-.3 1.72v2a.4.4 0 0 1-.4.4v-.01H9.94a.4.4 0 0 1-.4-.4v-1.99c0-.22.18-.4.4-.4h2c.22 0 .4.18.4.4zM23.49 1.1a1.74 1.74 0 0 0-1.24-.52H1.75A1.74 1.74 0 0 0 0 2.33v19.34a1.74 1.74 0 0 0 1.75 1.75h20.5A1.74 1.74 0 0 0 24 21.67V2.33c0-.48-.2-.92-.51-1.24m0 20.58a1.23 1.23 0 0 1-1.24 1.24H1.75A1.23 1.23 0 0 1 .5 21.67V2.33a1.23 1.23 0 0 1 1.24-1.24h20.5a1.24 1.24 0 0 1 1.24 1.24v19.34z", "ubisoft": "M23.561 11.988C23.301-.304 6.954-4.89.656 6.634c.282.206.661.477.943.672a11.8 11.8 0 0 0-.976 3.067 12 12 0 0 0-.184 2.071C.439 18.818 5.621 24 12.005 24s11.556-5.17 11.556-11.556v-.455zm-20.27 2.06c-.152 1.246-.054 1.636-.054 1.788l-.282.098c-.108-.206-.37-.932-.488-1.908C2.163 10.308 4.7 6.96 8.57 6.33c3.544-.52 6.937 1.68 7.728 4.758l-.282.098c-.087-.087-.228-.336-.77-.878-4.281-4.281-11.002-2.32-11.956 3.74zm11.002 2.081a3.15 3.15 0 0 1-2.59 1.355 3.15 3.15 0 0 1-3.155-3.155 3.16 3.16 0 0 1 2.927-3.144c1.018-.043 1.972.51 2.416 1.398a2.58 2.58 0 0 1-.455 2.95c.293.205.575.4.856.595zm6.58.12c-1.669 3.782-5.106 5.766-8.77 5.712-7.034-.347-9.083-8.466-4.38-11.393l.207.206c-.076.108-.358.325-.791 1.182-.51 1.041-.672 2.081-.607 2.732.369 5.67 8.314 6.83 11.045 1.214C21.057 8.217 11.822.401 3.626 6.374l-.184-.184C5.599 2.808 9.816 1.3 13.837 2.309c6.147 1.55 9.453 7.956 7.035 13.94z", "ea": "m16.635 6.162-5.928 9.377H4.24l1.508-2.3h4.024l1.474-2.335H2.264L.79 13.239h2.156L0 17.84h12.072l4.563-7.259 1.652 2.66h-1.401l-1.473 2.299h4.347l1.473 2.3H24zm-11.461.107L3.7 8.604l9.52-.035 1.474-2.3z"};
function platLogo(src) { const s = String(src || '').toLowerCase(); const k = s.includes('steam') ? 'steam' : s.includes('epic') ? 'epic' : s.includes('gog') ? 'gog' : s.includes('ubisoft') || s.includes('uplay') ? 'ubisoft' : /\bea\b|origin/.test(s) ? 'ea' : ''; return k ? `<svg viewBox="0 0 24 24" aria-label="${esc(src)}"><path fill="currentColor" d="${PLAT_LOGO[k]}"/></svg>` : esc(src || ''); }
const TRAILER_OK = /^trailer-[a-z0-9]+\.(mp4|webm)$/;
SCREENS.game = {
  get hints() { const b = settings.binds; return `${b.confirm}: Select    ${b.back}: Back`; },
  focus: '.gxplayb',
  html: () => {
    const g = games.find((x) => x.id === gameId);
    if (!g) return '<h1>Game not found</h1><div class="list"><button class="item" data-nav data-go="library"><span>Back to library</span><span></span></button></div>';
    const inst = g.installed !== false, list = (a) => (Array.isArray(a) ? a.filter(Boolean) : []);
    const year = (String(g.released || '').match(/(19|20)\d\d/) || [''])[0], dev = list(g.developers)[0] || '';
    const stars = g.rating ? `<span class="stars"><span class="sb">\u2605\u2605\u2605\u2605\u2605</span><span class="sf" data-w="${Math.max(0, Math.min(100, Math.round(g.rating / 5 * 100)))}">\u2605\u2605\u2605\u2605\u2605</span></span>` : '';
    const stat = (k, v) => `<div><small>${k}</small><b>${esc(v)}</b></div>`;
    const paras = (g.description ? String(g.description).split(/\n+/) : [settings.rawgKey ? 'No description yet. Open the ... menu and choose Get game info.' : 'Add your free RAWG key in Settings to fill in the description, rating and cover art.']).map((p) => `<p>${esc(p)}</p>`).join('');
    const video = typeof g.trailer === 'string' && TRAILER_OK.test(g.trailer)
      ? `<video class="gxvid" data-trailer="${esc(g.trailer)}"${trAttrs(g)} loop playsinline></video>`
      : '';
    const status = !inst ? 'Not installed' : g.needsUpdate ? (g.updating ? 'Updating' + (g.updatePct ? ' ' + g.updatePct + '%' : '') : 'Update needed') : g.playSeconds || g.lastPlayed ? 'Played' : 'Not Played';
    const hrs = g.playSeconds ? g.playSeconds / 3600 : 0, bar = Math.max(hrs ? 4 : 0, Math.min(100, Math.round(hrs / 100 * 100)));
    const tease = g.description ? (String(g.description).replace(/\s+/g, ' ').match(/^.{40,260}?[.!?](\s|$)/) || [String(g.description).replace(/\s+/g, ' ').slice(0, 230)])[0] : '';
    const ach = achData && achData.ok && g.steamId ? (achData.list || []).find((a) => String(a.appid) === String(g.steamId)) : null;
    const stat2 = (k, v, ex) => `<div><small>${k}</small><b>${esc(v)}</b>${ex || ''}</div>`;
    const stats6 = [
      stat2('Time played', g.playSeconds ? fmtDur(g.playSeconds) : 'Not played', `<span class="gxbar"><i data-w="${bar}"></i></span>`),
      stat('Last played', g.lastPlayed ? new Date(g.lastPlayed).toLocaleDateString() : 'Never'),
      stat2('Status', status, `<span class="gxdot ${status === 'Played' ? 'on' : status === 'Not installed' ? 'off' : ''}"></span>`),
      stat('Platform', g.source || 'PC'),
      stat('Released', (g.released ? (isNaN(new Date(g.released)) ? String(g.released) : new Date(g.released).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })) : 'Unknown')),
      ach ? stat2('Achievements', ach.got + ' / ' + ach.total, `<span class="gxbar"><i data-w="${ach.total ? Math.round(ach.got / ach.total * 100) : 0}"></i></span>`) : g.metacritic ? stat2('Critic score', g.metacritic + ' / 100', `<span class="gxbar"><i data-w="${Math.min(100, g.metacritic)}"></i></span>`) : stat('Publisher', list(g.publishers)[0] || dev || 'Unknown'),
    ].join('');
    const chips = `${g.metacritic ? `<span class="gv-mc">${g.metacritic}</span>` : ''}${stars}${list(g.genres).slice(0, 3).map((x) => `<em>${esc(x)}</em>`).join('')}`;
    const plbl = inst ? (g.needsUpdate ? (g.updating ? 'Updating' + (g.updatePct ? ' ' + g.updatePct + '%' : '') : 'Update') : 'Play') : 'Install';
    return `<div class="gxp${descOpen ? ' open' : ''}">
      <div class="gxv${video ? '' : ' empty'}">${video}</div>
      <div class="gv-sheet">
        <div class="gv-head">
          <div class="gv-cover" data-sqload="${(setTimeout(loadSquares, 300), '')}"><div class="gxart${gImg(g) ? '' : ' noart'}" data-img="${esc(sqMap.has(g.id) ? 'ctheme://img/' + sqMap.get(g.id) : gImg(g))}"${sqMap.has(g.id) ? ` data-sq="ctheme://img/${esc(sqMap.get(g.id))}"` : ''}${gImg(g) ? '' : ` data-hue="${hue(g.title)}"`}></div></div>
          <div class="gv-id">
            <div class="gv-eye"><span class="gv-plat">${platLogo(g.source)}</span>${year ? `<b>${year}</b>` : ''}${dev ? `<span>${esc(dev)}</span>` : ''}</div>
            <div class="gv-title">${esc(g.title)}</div>
          </div>
        </div>
        ${chips ? `<div class="gv-chips">${chips}</div>` : ''}
        ${tease ? `<p class="gv-tease">${esc(tease)}</p>` : ''}
        <div class="gxdesc">${paras}</div>
        <div class="gv-stats">${stats6}</div>
        <div class="gxbtns"><button class="item gxplayb" data-nav data-gact="${inst ? (g.needsUpdate ? 'update' : 'play') : 'install'}"><i>${ICON.play}</i><span>${plbl}</span></button><button class="item gv-b gxb" data-nav data-gact="dots">${ICON.dots}</button><button class="item gv-b gxb gxcaret" data-nav data-gact="desc">${ICON.caret}</button></div>
      </div>
    </div>`;
  },
};
const trAttrs = (g) => (typeof g.trailerAudio === 'string' && TRAILER_OK.test(g.trailerAudio) ? ` data-audio="${esc(g.trailerAudio)}" data-vc="${esc(g.trailerV || '')}" data-ac="${esc(g.trailerA || '')}"` : '');
const TR_VOL = 0.07;   // normal trailer loudness
function fadeIn(el, to = TR_VOL) {   // no fade: the sound simply starts together with the picture
  el._fadeId = (el._fadeId || 0) + 1; try { el.volume = Math.max(0, Math.min(1, to)); } catch {}
}
let pairTok = 0, pairStop = null;
function playPair(v, file, audio) {
  if (pairStop) { try { pairStop(); } catch {} pairStop = null; }   // never two sound players for one trailer   // picture and sound are two files: the picture plays in the box and the sound plays alongside it, kept in step
  const tok = ++pairTok, url = 'ctheme://img/';
  const alive = () => document.body.contains(v) && v.dataset.trailer === file;
  const au = new Audio(url + audio); au.preload = 'auto'; au.volume = 0; au.muted = !settings.trailerSound;
  v.muted = true; v.volume = 0; v.src = url + file;
  const sound = !au.muted;
  const stop = () => { try { au.pause(); au.removeAttribute('src'); au.load(); } catch {} clearInterval(iv); if (tok === pairTok) SND.hush(false); };
  pairStop = stop; let lastV = -1, still = 0, lastA = 0, bad = 0, lastSeek = 0;
  const seekAu = (t) => { const n = performance.now(); if (n - lastSeek < 2500) return; lastSeek = n; try { au.currentTime = t; } catch {} };   // the sound is moved at most once every 2.5 seconds, so it can never keep jumping back to the start
  const iv = setInterval(() => {
    if (!alive()) return stop();
    const moving = !v.paused && v.readyState >= 3 && Math.abs(v.currentTime - lastV) > 0.02; lastV = v.currentTime;
    if (!moving) { if (++still >= 2 && !au.paused) { try { au.pause(); } catch {} } return; }
    still = 0;
    if (au.paused) { if (au.readyState > 1) { seekAu(v.currentTime); au.play().catch(() => {}); } lastA = au.currentTime; return; }
    if (au.currentTime < lastA - 0.5 && v.currentTime > 1.5) { if (++bad >= 3) { try { au.pause(); au.muted = true; } catch {} return; } }   // the sound keeps falling back to its start: give up on it for this trailer rather than stutter
    lastA = au.currentTime;
    const d = au.currentTime - v.currentTime;
    if (Math.abs(d) > 1.5) seekAu(v.currentTime);
    else au.playbackRate = Math.abs(d) > 0.08 ? (d > 0 ? 0.96 : 1.04) : 1;   // small differences are smoothed out by playing a touch slower or faster, never by jumping
  }, 250);
  v.onplaying = () => { if (au.paused || Math.abs(au.currentTime - v.currentTime) > 1.5) seekAu(v.currentTime); au.play().then(() => { if (tok === pairTok && sound && alive()) { SND.hush(true); if (!au._faded) { au._faded = true; fadeIn(au); } } }).catch(() => {}); };
  v.onpause = () => { try { au.pause(); } catch {} if (tok === pairTok) SND.hush(false); };
  v.onerror = () => { stop(); };
  v.play().catch(() => {});
}
function startTrailer(sel) {
  if (gameMute) return;
  const v = document.querySelector(sel || '.gxvid[data-trailer]');
  if (!v || !TRAILER_OK.test(v.dataset.trailer)) return;
  v.classList.remove('on'); v.addEventListener('playing', () => requestAnimationFrame(() => v.classList.add('on')), { once: true });   // the picture fades in once it is really playing
  v.muted = !settings.trailerSound; v.volume = 0; v.addEventListener('playing', () => { if (!v._faded) { v._faded = true; fadeIn(v); } }, { once: true });
  if (v.classList.contains('lvid')) v.onloadedmetadata = () => { const pv = v.closest('.lpv'); if (pv && v.videoWidth && v.videoHeight) pv.style.aspectRatio = String(Math.max(1.3, Math.min(2.4, v.videoWidth / v.videoHeight)).toFixed(4)); };   // the box takes the trailer's own shape, so nothing is cropped and there are no bars
  v.onplaying = () => SND.hush(!v.muted); v.onerror = v.onpause = v.onended = () => SND.hush(false);   // the ambient music rests while a trailer with sound plays
  if (v.classList.contains('gxvid') && !v.dataset.audio) {   // game page: the trailer fades out before it ends and back in when it restarts, so there is never a hard colour cut
    v.loop = false; v._fo = false;
    v.ontimeupdate = () => { if (!v._fo && v.duration && v.currentTime > v.duration - 3.2) { v._fo = true; v.classList.remove('on'); } };
    v.onended = () => { SND.hush(false); setTimeout(() => { if (!document.contains(v)) return; v._fo = false; v.currentTime = 0; v.addEventListener('playing', () => requestAnimationFrame(() => v.classList.add('on')), { once: true }); v.play().catch(() => {}); }, 1200); };
  }
  if (v.dataset.audio && TRAILER_OK.test(v.dataset.audio)) return playPair(v, v.dataset.trailer, v.dataset.audio);
  v.src = 'ctheme://img/' + v.dataset.trailer;
  v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
}
let runTitle = '';
async function refreshRun() {   // while a game is running, its Play button says Resume
  try { const s = await api.gameStatus(); runTitle = s && s.title ? s.title : ''; } catch { runTitle = ''; }
  if (screen !== 'game') return;
  const g = games.find((x) => x.id === gameId), b = document.querySelector('.gxplayb');
  if (!g || !b || g.installed === false) return;
  const on = !!runTitle && runTitle === g.title;
  let u = null; if (!on) { try { u = await api.gameUpdInfo(g.id); } catch {} }
  const sp = b.querySelector('span');
  if (u && u.needsUpdate) { g.needsUpdate = true; g.updating = u.updating; g.updatePct = u.updatePct; b.dataset.gact = 'update'; if (sp) sp.textContent = u.updating ? 'Updating' + (u.updatePct ? ' ' + u.updatePct + '%' : '') : 'Update'; return; }
  g.needsUpdate = false;
  b.dataset.gact = on ? 'resume' : 'play'; if (sp) sp.textContent = on ? 'Running now' : 'Play';
}
setInterval(() => { if (screen === 'game') refreshRun(); }, 6000);
const updKnown = new Map();   // game id -> 'need' | 'busy' | 'ok': what the last check said, so each change is announced once
async function updWatch() {   // Steam and Epic games: tell me in the notifications (and with a message) when one needs an update, and when it is ready again
  try {
    if (introOn || launching || runTitle) return;
    for (const g of games.slice()) {
      if (!g || g.installed === false || !(g.steamId || g.source === 'Epic Games')) continue;
      let u = null; try { u = await api.gameUpdInfo(g.id); } catch {} if (!u) continue;
      const now = u.needsUpdate ? (u.updating ? 'busy' : 'need') : 'ok', was = updKnown.get(g.id);
      updKnown.set(g.id, now);
      if (now === 'need' && was !== 'need') notify('Update available', g.title, g.id, 'drive');
      else if (now === 'ok' && (was === 'need' || was === 'busy')) notify('Update complete', g.title + ' is ready to play.', g.id, 'play');
      await new Promise((r) => setTimeout(r, 400));
    }
  } catch {}
}
setTimeout(updWatch, 25000); setInterval(updWatch, 300000);
setInterval(async () => { try { if (introOn || launching || runTitle) return; for (const [id, st] of updKnown) { if (st !== 'busy') continue; const g = games.find((x) => x.id === id); if (!g) continue; let u = null; try { u = await api.gameUpdInfo(id); } catch {} if (!u) continue; const now = u.needsUpdate ? (u.updating ? 'busy' : 'need') : 'ok'; updKnown.set(id, now); if (now === 'ok') notify('Update complete', g.title + ' is ready to play.', id, 'play'); } } catch {} }, 30000);   // v1266: a game that is downloading an update is checked every 30 s so the pop-up comes as soon as it finishes
   // keeps Update / Updating % on the game page current
const fmtEta = (s) => (s == null ? 'working out the time left' : s < 60 ? 'less than a minute left' : s < 3600 ? Math.round(s / 60) + ' min left' : Math.floor(s / 3600) + ' h ' + Math.round((s % 3600) / 60) + ' min left');
let instBusy = false;
async function instTick() {   // while a game page shows a game that is not installed: follow its install, then turn the button into Play
  if (screen !== 'game' || instBusy) return;
  const g = games.find((x) => x.id === gameId); if (!g || g.installed !== false) return;
  instBusy = true;
  try {
    const r = await api.installStatus(g.id), b = document.querySelector('.gxplayb'); if (!b || screen !== 'game' || gameId !== g.id) return;
    let info = document.querySelector('.gxinfo');
    if (r.state === 'installing' || r.state === 'waiting') {
      const pct = Math.round((r.pct || 0) * 1000) / 10;
      b.classList.add('gxinst'); b.dataset.gact = 'installing'; b.style.setProperty('--p', (pct || 0) + '%');
      const sp = b.querySelector('span'); if (sp) sp.textContent = r.state === 'waiting' ? 'Confirm install' : (r.total ? 'Installing ' + Math.floor(pct) + '%' : 'Installing\u2026');
      if (r.state === 'waiting') b.dataset.gact = 'install';   // pressing it again brings the launcher's window back
      const isNew = !info;
      if (!info) { info = document.createElement('div'); info.className = 'gxinfo'; const bt = document.querySelector('.gxbtns'); if (bt) bt.insertAdjacentElement('afterend', info); }
      if (info) {   // v1267: a download bar under the button, with  downloaded of total, percent, speed and time left
        if (r.state === 'waiting') info.textContent = 'Confirm the install in the launcher window';
        else {
          const gb = (n) => (n / 1073741824).toFixed(n >= 1e10 ? 0 : 1) + ' GB';
          const spd = r.speed > 0 ? '  \u00b7  ' + (r.speed >= 1048576 ? (r.speed / 1048576).toFixed(r.speed >= 1e7 ? 0 : 1) + ' MB/s' : Math.max(1, Math.round(r.speed / 1024)) + ' KB/s') : '';
          const txt = r.total ? gb(r.done) + ' of ' + (r.approx ? '\u2248 ' : '') + gb(r.total) + '  \u00b7  ' + Math.floor(pct) + '%' + (r.eta != null ? '  \u00b7  ' + fmtEta(r.eta) : '') + spd : gb(r.done) + ' downloaded' + spd;
          if (!info.querySelector('.gxbar')) info.innerHTML = '<div class="gxbar"><i></i></div><div class="gxtxt"></div>';
          const bar = info.querySelector('.gxbar'); bar.classList.toggle('ind', !r.total); bar.firstChild.style.width = (r.total ? Math.min(100, pct) : 100) + '%';
          info.querySelector('.gxtxt').textContent = txt;
        }
      }
      if (isNew) { glowR = null; glowKick(900); }   // the text line shifts the page up; the white outline follows the button again
    } else if (r.state === 'done') {
      games = await api.libScan(); notify('Installation complete', g.title + ' is ready to play.', g.id, 'play'); show('game', 0);
      setTimeout(() => { const pb = document.querySelector('.gxplayb'); if (pb && screen === 'game') pb.focus({ preventScroll: true }); glowR = null; glowKick(1200); }, 150);
    } else if (b.classList.contains('gxinst')) {
      b.classList.remove('gxinst'); b.dataset.gact = 'install'; b.style.removeProperty('--p'); const sp = b.querySelector('span'); if (sp) sp.textContent = 'Install'; if (info) { info.remove(); glowR = null; glowKick(900); }
    }
  } catch {} finally { instBusy = false; }
}
setInterval(instTick, 3000);
const instWatch = new Map();   // v1267: games you pressed Install on: followed in the background too, so the finished install is noticed even when you left the game page
setInterval(async () => { try {
  for (const [id, t0] of [...instWatch]) {
    const g = games.find((x) => x.id === id); if (!g || g.installed !== false || Date.now() - t0 > 6 * 3600e3) { instWatch.delete(id); continue; }
    const r = await api.installStatus(id);
    if (r && r.state === 'done') { instWatch.delete(id); games = await api.libScan(); notify('Installation complete', g.title + ' is ready to play.', id, 'play'); if (screen === 'game' && gameId === id) show('game', 0); else if (screen === 'library' || screen === 'home') show(screen, focusIdx()); }
  }
} catch {} }, 15000);
try { window.consoleApi.onInst((gid) => {   // the install box was cancelled: put the button back this very moment, then let the normal check confirm
  if (screen === 'game' && gid && gameId === gid) { const b = document.querySelector('.gxplayb'), info = document.querySelector('.gxinfo'); if (b && b.classList.contains('gxinst')) { b.classList.remove('gxinst'); b.dataset.gact = 'install'; b.style.removeProperty('--p'); const sp = b.querySelector('span'); if (sp) sp.textContent = 'Install'; if (info) { info.remove(); glowR = null; glowKick(900); } } }
  instTick(); }); } catch {}   // the launcher's confirm box was cancelled: update the page now
async function gameAct(a) {
  if (a === 'installing') return;
  const id = gameId, idx = focusIdx();
  const g = games.find((x) => x.id === id); if (!g) return;
  if (a === 'update') { const r = await api.gameUpdate(id); note(r && r.ok ? r.note : (r && r.error) || 'Could not start the update.'); setTimeout(refreshRun, 2500); return; }
  if (a === 'play') { extReturn = { screen: 'game', idx, gameId: id, game: true }; lastReturn = extReturn; clearTimeout(extT); api.extSet('game'); return launch(id); }
  if (a === 'closegame') { runTitle = ''; await closeRunning(); setTimeout(refreshRun, 1500); return; }
  if (a === 'resume') { silenceAll(true); extReturn = { screen: 'game', idx, gameId: id, game: true }; lastReturn = extReturn; clearTimeout(extT); api.extSet('game'); return resumeSmooth(); }
  if (a === 'dots') return openMenu(document.activeElement, id);
  if (a === 'pin') return pinGame(id);
  if (a === 'desc') { descOpen = !descOpen; const gx = document.querySelector('.gxp'); if (gx) gx.classList.toggle('open', descOpen); glowR = null; glowKick(900); return; }
  if (a === 'trailer') { const r = await api.trailerPick(id); if (r && r.games) { games = r.games; show('game', idx); note('Trailer added.'); } else if (r && r.error) note(r.error); return; }
  if (a === 'traileryt') { note('Finding the latest official trailer on YouTube...'); const r = await api.trailersYoutube(id); if (r && r.games) { games = r.games; if (screen === 'game') show('game', idx); note(r.count ? 'Trailer added.' : 'No official trailer found on YouTube.'); } else if (r && r.error) note(r.error); return; }
  if (a === 'trailerauto') { note('Downloading trailer...'); const r = await api.trailersAuto(id); if (r && r.games) { games = r.games; if (screen === 'game') show('game', idx); note(r.count ? 'Trailer added.' : 'Steam has no trailer for this game.'); } else if (r && r.error) note(r.error); return; }
  if (a === 'trailerrm') { games = await api.trailerClear(id); show(screen, idx); return note('Trailer removed.'); }
  if (a === 'wholefit') { const l = new Set(settings.wholeFit || []), k = String(g.id); if (l.has(k)) l.delete(k); else l.add(k); await change({ wholeFit: [...l] }); sqPr.delete(g.id); sqMap.delete(g.id); wholeDone.delete(g.id); sqAsked.delete(g.id); xbAsked.delete(g.id); coverAsked.delete(g.id); loadSquares(); return note('Cover for ' + g.title + ': ' + (l.has(k) ? 'whole picture fitted in the square.' : 'back to automatic.')); }
  if (a === 'kbmenu') { const l = new Set(settings.kbGames || []), k = String(g.id); if (l.has(k)) l.delete(k); else l.add(k); await change({ kbGames: [...l] }); return note('Pause-key menu ' + (l.has(k) ? 'on' : 'off') + ' for ' + g.title + '.'); }
  if (a === 'sound') { await change({ trailerSound: !settings.trailerSound, trailerSoundV: 2 }); return note('Trailer sound ' + (settings.trailerSound ? 'on.' : 'off.')); }
  if (a === 'remove') return removeGame(id).then(() => show('library'));
  if (a === 'colorcycle') {
    const cur = g.theme && g.theme.color;
    const r = await api.themeSet(id, { color: THEME_COLORS[(THEME_COLORS.indexOf(cur) + 1) % THEME_COLORS.length] });
    if (r) { games = r; refreshHeroFor(id); }
    return;
  }
  if (a === 'bgpick') { const r = await api.themePick(id); if (Array.isArray(r)) { games = r; refreshHeroFor(id); note('Background set.'); } else if (r && r.error) note(r.error); return; }
  if (a === 'themereset') { const r = await api.themeSet(id, null); if (r) { games = r; refreshHeroFor(id); note('Theme reset.'); } return; }
  if (a === 'info') {
    note('Looking up game info...');
    const r = await api.catInfo(id);
    if (!r || !r.ok) return note(r.error);
    games = r.games; show(screen, idx);
    return note(r.found ? 'Game info saved.' : 'No match found on RAWG for this title.');
  }
  const r = await api.gameAction(id, a);
  note(r && r.ok ? (r.note || 'Done.') : r.error);
  if (a === 'install' && r && r.ok) { instWatch.set(id, Date.now()); setTimeout(instTick, 1200); setTimeout(instTick, 4000); }
  if (a === 'uninstall' && r && r.ok) {   // once you confirm it in the launcher, the game page flips back to Install
    let n = 0; const t = setInterval(async () => {
      if (++n > 24) return clearInterval(t);
      try { games = await api.libScan(); const x = games.find((y) => y.id === id); if (x && x.installed === false) { clearInterval(t); if (screen === 'game' && gameId === id) show('game', 0); note(x.title + ' was uninstalled.'); } } catch {}
    }, 5000);
  }
}
async function openBrowser() {
  rememberReturn();
  note('Opening Chrome. Mouse mode is on. Click both sticks, or press the Xbox button, to come back.');
  const r = await api.openBrowser();
  if (r && !r.ok) note('Could not open the browser: ' + r.error);
}
async function getInfoAll() {
  note('Fetching descriptions and ratings (up to 25 games at a time)...');
  const r = await api.catInfoAll();
  games = r.games; show('library');
  if (r.done) notify('Game info ready', r.done + ' games updated with descriptions.', '', 'star');
  note('Info found for ' + r.done + ' games.' + (r.more ? ' Press Get game info again for more.' : '') + (r.error ? ' Problem: ' + r.error : ''));
}
async function refreshLib() { const i = focusIdx(); games = await api.libGet(); show('library', i); }

/* ---------- on-screen keyboard: laid out like the Xbox search screen ---------- */
const SCOPES = ['Search all', 'Installed', 'Not installed'];
// OSK-LAYOUT-START
function oskLayout(sym) {
  const L = [], put = (k, c, r, cs = 1, rs = 1) => L.push({ k, c, r, cs, rs });
  put('__sym', 0, 0); [...'1234567890'].forEach((d, i) => put(d, i + 1, 0)); put('__back', 11, 0);
  put('__left', 0, 1, 1, 2); [...(sym ? '!@#$%^&*()' : 'qwertyuiop')].forEach((ch, i) => put(ch, i + 1, 1)); put('__right', 11, 1, 1, 2);
  [...(sym ? '-_=+[]{}|;' : "asdfghjkl'")].forEach((ch, i) => put(ch, i + 1, 2));
  put('__shift', 0, 3, 1, 2); [...(sym ? ':"<>/~`@#' : 'zxcvbnm.?')].forEach((ch, i) => put(ch, i + 1, 3)); put('__done', 10, 3, 2, 2);
  put('__clear', 1, 4); put('.com', 2, 4); put('__space', 3, 4, 7);
  return L;
}
// OSK-LAYOUT-END
const MAG = '<svg viewBox="0 0 24 24" width="34" height="34"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 15l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function oskFace(k) {
  const sub = (t) => `<small>${t}</small>`;
  if (k === '__sym') return osk.sym ? 'abc' : '#+=';
  if (k === '__back') return '\u232B<b class="bd bx">X</b>';
  if (k === '__left') return '\u2039' + sub('LT');
  if (k === '__right') return '\u203A' + sub('RT');
  if (k === '__shift') return '\u21E7' + sub('LB');
  if (k === '__clear') return 'Clear';
  if (k === '__space') return '<span class="sp"></span><b class="bd by">Y</b>';
  if (k === '__done') return (osk.done === 'Search' ? MAG : '\u2713') + '<small class="mn">\u2630</small>';
  return esc(osk.shift ? k.toUpperCase() : k);
}
function oskRender(focusKey) {
  { const ok = $('#osk'); ok.classList.toggle('still', !osk.first); ok.classList.toggle('osk-bot', !osk.live); osk.first = false; }   // only the first draw animates, so keys don't make the keyboard bounce; sign-in/typing keyboards sit at the bottom middle
  const keys = oskLayout(osk.sym).map(({ k, c, r, cs, rs }) =>
    `<button class="xk${k === '__done' ? ' go' : ''}${k === '__shift' && osk.shift ? ' on' : ''}" data-nav data-key="${esc(k)}" data-gc="${c + 1} / span ${cs}" data-gr="${r + 1} / span ${rs}">${oskFace(k)}</button>`).join('');
  let results = '', sugs = '';
  if (osk.live) {
    const r = osk.live(osk.text, osk.scope);
    results = '<div class="xres">' + Array.from({ length: 5 }, (_, i) => {
      const g = r.items[i];
      return g ? `<button class="xcard" data-nav data-key="${esc('__pick:' + g.id)}"><div class="xart" data-img="${esc(g.image || '')}"></div><b>${esc(g.title)}</b><small>${esc(g.source)}${g.installed === false ? ' \u00B7 not installed' : ''}</small></button>`
        : '<div class="xcard empty"><div class="xart"></div></div>';
    }).join('') + '</div>';
    const tok = (osk.text.slice(0, osk.pos).match(/[A-Za-z0-9']*$/) || [''])[0].toLowerCase();
    if (tok) sugs = osk.vocab.filter((w) => w.startsWith(tok) && w !== tok).slice(0, 8).map((w) => `<button class="xsg" data-nav data-key="${esc('__sug:' + w)}">${esc(w)}</button>`).join('');
  }
  const scope = osk.live ? `<button class="xscope" data-nav data-key="__scope">${SCOPES[osk.scope]}<svg viewBox="0 0 12 8" width="14" height="10"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>` : '';
  const shownT = /password/i.test(osk.label) ? '\u2022'.repeat(osk.text.length) : osk.text, before = shownT.slice(0, osk.pos), after = shownT.slice(osk.pos);   // passwords show as dots
  $('#osk').innerHTML = `<div class="xs"><div class="xtop">${osk.live ? '' : `<div class="xlbl">${esc(osk.label)}</div>`}<div class="xrowtop">${scope}<div class="xfield"><span>${esc(before)}</span><i class="xcaret"></i><span>${esc(after)}</span>${osk.text || !osk.live ? '' : `<span class="ph">${esc(osk.label)}</span>`}</div></div>${results}</div>
    <div class="xkb"><div class="xkbin"><div class="xsug">${sugs}</div><div class="xgrid">${keys}</div></div></div></div>`;
  document.querySelectorAll('#osk [data-gc]').forEach((el) => { el.style.gridColumn = el.dataset.gc; el.style.gridRow = el.dataset.gr; });
  applyCovers();
  try { if (window.__oskLive) window.__oskLive(osk.text); } catch {}
  const all = [...$('#osk').querySelectorAll('[data-nav]')];
  (all.find((e) => e.dataset.key === (focusKey || 'g')) || all.find((e) => e.dataset.key === 'q'))?.focus();
}
let oskOutT = null;
function openOsk(label, initial, opts = {}) {
  return new Promise((res) => {
    const text = drafts[label] !== undefined ? drafts[label] : (initial || '');
    osk = { label, text, pos: text.length, shift: false, sym: false, scope: opts.scope || 0, done: opts.done || 'Done', live: opts.live || null, vocab: [], ready: false, first: true, res, prev: document.activeElement };
    if (osk.live) osk.vocab = [...new Set(games.flatMap((g) => g.title.toLowerCase().split(/[^a-z0-9']+/).filter((w) => w.length > 2)))].sort();
    clearTimeout(oskOutT); $('#osk').classList.remove('osk-out'); $('#osk').hidden = false; oskRender('g');
  });
}
function oskClose(val) {
  const o = osk; osk = null; lastScope = o.scope;
  { const ok = $('#osk'); ok.classList.add('osk-out'); clearTimeout(oskOutT); oskOutT = setTimeout(() => { if (!osk) { ok.hidden = true; ok.innerHTML = ''; } ok.classList.remove('osk-out'); }, 260); }   // the keyboard slides and fades away (it used to disappear at once)
  if (val === null) drafts[o.label] = o.text; else delete drafts[o.label];
  if (o.prev && document.body.contains(o.prev)) o.prev.focus();
  o.res(val);
}
function oskKey(k) {
  if (!osk) return;
  const fk = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.key : 'g';
  if (k === '__done') return oskClose(osk.text.trim());
  if (k === '__cancel') return oskClose(null);
  if (k.startsWith('__pick:')) { pickedId = k.slice(7); return oskClose(osk.text.trim()); }
  const ins = (t) => { osk.text = (osk.text.slice(0, osk.pos) + t + osk.text.slice(osk.pos)).slice(0, 120); osk.pos = Math.min(osk.pos + t.length, osk.text.length); };
  if (k === '__shift') osk.shift = !osk.shift;
  else if (k === '__sym') osk.sym = !osk.sym;
  else if (k === '__scope') osk.scope = (osk.scope + 1) % SCOPES.length;
  else if (k === '__space') ins(' ');
  else if (k === '__back') { if (osk.pos > 0) { osk.text = osk.text.slice(0, osk.pos - 1) + osk.text.slice(osk.pos); osk.pos--; } }
  else if (k === '__left') osk.pos = Math.max(0, osk.pos - 1);
  else if (k === '__right') osk.pos = Math.min(osk.text.length, osk.pos + 1);
  else if (k === '__clear') { osk.text = ''; osk.pos = 0; }
  else if (k.startsWith('__sug:')) {
    const before = osk.text.slice(0, osk.pos), tok = (before.match(/[A-Za-z0-9']*$/) || [''])[0], head = before.slice(0, before.length - tok.length);
    osk.text = head + k.slice(6) + ' ' + osk.text.slice(osk.pos); osk.pos = head.length + k.length - 6 + 1;
  }
  else { ins(osk.shift ? k.toUpperCase() : k); osk.shift = false; }
  oskRender(k.startsWith('__sug:') ? 'g' : fk);
}

/* ---------- library actions ---------- */
SCREENS.profile = {
  hints: 'A: Select    B: Back',
  html: () => `<h1>Profile</h1><div class="pcard">${avatarSpan('xl')}<div class="pname">${esc(profileName())}</div></div><div class="list">
    <button class="item" data-nav data-act="pname"><span>Name</span><span>${esc(profileName())}</span></button>
    <button class="item" data-nav data-act="pavatar"><span>Picture</span><span>${settings.avatarFile ? 'Change' : 'Choose'}</span></button>
    ${settings.avatarFile ? '<button class="item" data-nav data-act="pavatarrm"><span>Remove picture</span><span></span></button>' : ''}
    <button class="item" data-nav data-go="home"><span>Back</span><span></span></button></div>`,
};
async function pickIntroVideo(kind) { const i = focusIdx(); if (kind === 'bg') note('Pick your video. A long file takes a minute to copy.'); const r = await api.introVideoPick(kind); if (r && r.settings) { settings = r.settings; applySettings(); show('settings', i); note(kind === 'bg' ? 'Sign-in background set. It plays on the sign-in page next time the console starts.' : 'Startup video set. It plays next time the console starts.'); } else if (r && r.error) note(r.error); }
async function clearIntroVideo(kind) { const i = focusIdx(); settings = await api.introVideoClear(kind); show('settings', i); note('Startup video removed.'); }
async function editName() { const i = focusIdx(); const t = await openOsk('Your name', profileName(), { done: 'Save' }); if (t) { setLocal({ profileName: t.slice(0, 24) }); show(screen, screen === 'settings' ? i : 0); } }

/* ---------- built-in gamerpics (like a real console's profile picture list): drawn here, nothing to download ---------- */
const GP_TINT = [[255, 255, 255], [190, 215, 255], [255, 190, 190], [200, 255, 240]];   // white, cold blue, faint crimson, pale teal: the same dark, grainy, motion-blurred mood as the default picture
const GP_SETS = [['ghost', 0], ['smoke', 0], ['streak', 0], ['moon', 0], ['orb', 0], ['veil', 0], ['ghost', 1], ['smoke', 1], ['streak', 1], ['moon', 1], ['orb', 1], ['veil', 1],
  ['ghost', 2], ['smoke', 2], ['streak', 2], ['moon', 2], ['orb', 2], ['veil', 2], ['ghost', 3], ['smoke', 3], ['streak', 3], ['moon', 3], ['orb', 3], ['veil', 3]];
function gpDraw(k) {
  const [sc, ti] = GP_SETS[k % GP_SETS.length], T = GP_TINT[ti], S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  let seed = (k + 3) * 7919 + 1013; const R = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const col = (a) => `rgba(${T[0]},${T[1]},${T[2]},${a})`;
  const bg = x.createRadialGradient(256 + (R() - .5) * 120, 230, 20, 256, 256, 420); bg.addColorStop(0, `rgb(${T[0] * .1 | 0},${T[1] * .1 | 0},${T[2] * .12 | 0})`); bg.addColorStop(1, '#000'); x.fillStyle = bg; x.fillRect(0, 0, S, S);
  const ribbon = (pts, w0, a, blur) => { x.save(); x.filter = `blur(${blur}px)`; x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = col(a); x.lineWidth = w0; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let q = 1; q + 2 < pts.length + 1; q += 3) x.bezierCurveTo(...pts[q], ...pts[q + 1], ...pts[q + 2]); x.stroke(); x.restore(); };
  const rp = (n) => Array.from({ length: n }, () => [R() * S, R() * S]);
  if (sc === 'ghost') {   // a veiled figure smeared by motion, like a long exposure: wrapped cloth strokes, fading into black
    const dx = 34 + R() * 20, dy = -10 + R() * 20, tilt = (R() - .5) * .5;
    const fig = (ox, oy, a) => { x.save(); x.translate(256 + ox, 250 + oy); x.rotate(tilt); for (const [ex, ey, rx, ry, k] of [[0, -90, 70, 92, 1], [0, 60, 150, 110, .55]]) { x.save(); x.translate(ex, ey); x.scale(rx, ry); const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col(a * k)); g.addColorStop(.6, col(a * k * .5)); g.addColorStop(1, col(0)); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); } x.restore(); };
    x.save(); x.filter = 'blur(11px)'; x.globalCompositeOperation = 'lighter'; for (let q = 0; q < 34; q++) fig(dx * (q / 33 - .5) * 2, dy * (q / 33 - .5) * 2, .05); x.restore();
    
    for (let q = 0; q < 22; q++) { const a0 = R() * 6.28, rr = 40 + R() * 70, cx = 256 + Math.cos(tilt) * 0, cy = 128; ribbon([[cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr * 1.1], [cx + Math.cos(a0 + 1) * rr * 1.7 + dx, cy + Math.sin(a0 + 1) * rr * 1.5], [cx + Math.cos(a0 + 2) * rr * 1.6 - dx, cy + Math.sin(a0 + 2) * rr * 1.6 + 60], [cx + Math.cos(a0 + 3) * rr * 2.4 + dx * 2, cy + 120 + R() * 190]], 2 + R() * 9, .1 + R() * .12, 1.5 + R() * 4); }
    for (let q = 0; q < 5; q++) ribbon([[40 + R() * 80, 150 + R() * 120], [150, 90 + R() * 200], [330, 90 + R() * 200], [S - 30, 120 + R() * 200]], 14 + R() * 28, .06, 14);
  } else if (sc === 'smoke') { for (let q = 0; q < 16; q++) { const y0 = 60 + R() * 390; ribbon([[-40, y0], [120 + R() * 80, y0 - 160 + R() * 320], [300 + R() * 80, y0 - 160 + R() * 320], [S + 40, y0 + (R() - .5) * 200]], 3 + R() * 26, .09 + R() * .12, 1 + R() * 9); } }
  else if (sc === 'streak') { const ang = -.55 + R() * .3; x.save(); x.translate(256, 256); x.rotate(ang); x.translate(-256, -256); for (let q = 0; q < 26; q++) { const y0 = 40 + R() * 430, len = 160 + R() * 360, x0 = R() * (S - len) - 40; x.save(); x.filter = `blur(${1 + R() * 5}px)`; x.globalCompositeOperation = 'lighter'; const g = x.createLinearGradient(x0, 0, x0 + len, 0); g.addColorStop(0, col(0)); g.addColorStop(.6, col(.1 + R() * .35)); g.addColorStop(1, col(0)); x.strokeStyle = g; x.lineWidth = 1 + R() * 9; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + len, y0); x.stroke(); x.restore(); } x.restore(); }
  else if (sc === 'moon') { const mx = 230 + R() * 60, my = 215 + R() * 40; x.save(); x.globalCompositeOperation = 'lighter'; for (const [rr, a] of [[260, .06], [170, .1], [110, .16]]) { const g = x.createRadialGradient(mx, my, 0, mx, my, rr); g.addColorStop(0, col(a)); g.addColorStop(1, col(0)); x.fillStyle = g; x.fillRect(0, 0, S, S); } x.restore(); x.save(); x.filter = 'blur(1.2px)'; const mg = x.createRadialGradient(mx - 20, my - 20, 10, mx, my, 70); mg.addColorStop(0, col(.95)); mg.addColorStop(1, col(.55)); x.fillStyle = mg; x.beginPath(); x.arc(mx, my, 66, 0, 7); x.fill(); x.restore(); for (let q = 0; q < 7; q++) { const y0 = 150 + R() * 260; ribbon([[-40, y0], [140, y0 - 50 + R() * 100], [330, y0 - 50 + R() * 100], [S + 40, y0 + (R() - .5) * 80]], 8 + R() * 30, .08 + R() * .08, 10 + R() * 8); } }
  else if (sc === 'orb') { const ox = 256 + (R() - .5) * 60, oy = 250 + (R() - .5) * 60; x.save(); x.globalCompositeOperation = 'lighter'; for (let q = 0; q < 6; q++) { x.strokeStyle = col(.5 - q * .07); x.lineWidth = 1.5; x.filter = `blur(${q * .7}px)`; x.beginPath(); x.ellipse(ox, oy, 70 + q * 34, (70 + q * 34) * (.28 + R() * .1), -.5 + q * .08, 0, 7); x.stroke(); } const g = x.createRadialGradient(ox, oy, 0, ox, oy, 120); g.addColorStop(0, col(.95)); g.addColorStop(.25, col(.35)); g.addColorStop(1, col(0)); x.fillStyle = g; x.fillRect(0, 0, S, S); x.restore(); for (let q = 0; q < 4; q++) ribbon(rp(4), 5 + R() * 14, .1, 7); }
  else { for (let q = 0; q < 11; q++) { const x0 = 40 + q * 42 + R() * 20; ribbon([[x0, -30], [x0 + 90 - R() * 180, 150], [x0 - 120 + R() * 240, 330], [x0 + (R() - .5) * 200, S + 30]], 10 + R() * 34, .06 + R() * .09, 3 + R() * 8); } const hg = x.createRadialGradient(256, 150, 0, 256, 150, 230); hg.addColorStop(0, col(.2)); hg.addColorStop(1, col(0)); x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = hg; x.fillRect(0, 0, S, S); x.restore(); }
  const vg = x.createRadialGradient(256, 256, 120, 256, 256, 380); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)'); x.fillStyle = vg; x.fillRect(0, 0, S, S);
  const gr = x.getImageData(0, 0, S, S), d = gr.data; for (let q = 0; q < d.length; q += 4) { const n = (R() - .5) * 26; d[q] += n; d[q + 1] += n; d[q + 2] += n; } x.putImageData(gr, 0, 0);   // film grain
  return c.toDataURL('image/jpeg', 0.92);
}
const gpCache = [];
const gpUrl = (k) => gpCache[k] || (gpCache[k] = gpDraw(k));
let avFrom = 'profile';
SCREENS.avatars = {
  hints: 'A: Choose    B: Back',
  focus: '.avg .avf',
  html: () => `<h1>Profile picture</h1><p class="apsub">Pick a gamerpic, or use your own picture.</p><div class="avg"><button class="avf avown" data-nav data-act="avown"><b>+</b><span>My own picture</span></button>${Array.from({ length: 24 }, (_, k) => `<button class="avf" data-nav data-act="avset" data-k="${k}"><img src="${gpUrl(k)}" alt=""></button>`).join('')}</div>`,
};
async function setGamerpic(k) { const r = await api.avatarSave(gpUrl(k)); if (r && r.settings) { settings = r.settings; applySettings(); } show(avFrom, 0); if (r && r.error) note(r.error); }

async function pickAvatar(src) { const i = focusIdx(); const r = await cropAvatar(src); if (r && r.settings) { settings = r.settings; applySettings(); show(screen, screen === 'settings' ? i : 0); } else if (r && r.error) note(r.error); }
let avc = null;
function cropAvatar(src0, saver) {   // like the Xbox: the picture sits behind a circle; move it with the left stick, zoom with the right stick or triggers, A to save, B to cancel
  return new Promise(async (res) => {
    let src = src0, nw = 0, nh = 0;
    if (!src) { const o = await api.avatarOpen(); if (!o) return res(null); if (o.error) return res(o); src = o.src; }
    const img = new Image(); img.draggable = false;
    try { await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = src; }); } catch { return res({ error: 'Could not use that picture.' }); }
    nw = img.naturalWidth; nh = img.naturalHeight;
    const ov = document.createElement('div'); ov.className = 'avcrop';
    ov.innerHTML = '<h2>Move and resize your picture</h2><div class="avstage"></div><div class="avhint">Left stick: move \u00b7 Right stick or triggers: zoom \u00b7 A: use picture \u00b7 B: cancel</div><div class="avbtns"><button class="xt" data-avb="save" tabindex="-1">Use this picture</button><button class="xt" data-avb="cancel" tabindex="-1">Cancel</button></div>';
    document.body.appendChild(ov);
    const stage = ov.querySelector('.avstage'); stage.appendChild(img);
    avc = true; if (glow) glow.classList.remove('on');
    const S = stage.clientWidth, minZ = S / Math.min(nw, nh); let z = minZ, px = (S - nw * z) / 2, py = (S - nh * z) / 2;
    const clamp = () => { z = Math.max(minZ, Math.min(minZ * 5, z)); px = Math.min(0, Math.max(S - nw * z, px)); py = Math.min(0, Math.max(S - nh * z, py)); };
    const draw = () => { clamp(); img.style.width = nw * z + 'px'; img.style.height = nh * z + 'px'; img.style.transform = `translate(${px}px, ${py}px)`; };
    const zoomAt = (f, cx = S / 2, cy = S / 2) => { const nz = Math.max(minZ, Math.min(minZ * 5, z * f)); px = cx - (cx - px) * (nz / z); py = cy - (cy - py) * (nz / z); z = nz; draw(); };
    draw();
    let done = false, raf = 0, prevB = {}, keys = {};
    const finish = async (ok) => {
      if (done) return; done = true; cancelAnimationFrame(raf);
      document.removeEventListener('keydown', kd, true); document.removeEventListener('keyup', ku, true);
      let out = null;
      if (ok) { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512); x.imageSmoothingQuality = 'high'; x.drawImage(img, -px / z, -py / z, S / z, S / z, 0, 0, 512, 512); out = await (saver || api.avatarSave)(c.toDataURL('image/jpeg', 0.92)); }
      ov.remove(); avc = null; muteUntil = performance.now() + 450; res(out);
    };
    const kd = (e) => { e.stopPropagation(); if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); finish(false); } else if (e.key === 'Enter') { e.preventDefault(); finish(true); } else keys[e.key] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); };
    const ku = (e) => { delete keys[e.key]; };
    document.addEventListener('keydown', kd, true); document.addEventListener('keyup', ku, true);
    ov.addEventListener('click', (e) => { const b = e.target.closest('[data-avb]'); if (b) finish(b.dataset.avb === 'save'); });
    let drag = null;
    stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, px, py }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', (e) => { if (drag) { px = drag.px + (e.clientX - drag.x) * (S / stage.getBoundingClientRect().width); py = drag.py + (e.clientY - drag.y) * (S / stage.getBoundingClientRect().height); draw(); } });
    stage.addEventListener('pointerup', () => { drag = null; });
    stage.addEventListener('wheel', (e) => { e.preventDefault(); const r = stage.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.08 : 1 / 1.08, (e.clientX - r.left) * (S / r.width), (e.clientY - r.top) * (S / r.height)); }, { passive: false });
    let last = performance.now();
    const loop = (now) => {
      if (done) return; const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const pad = pickPad(); let mx = 0, my = 0, zz = 0;
      if (pad) {
        const dz = 0.18, ax = pad.axes[0] || 0, ay = pad.axes[1] || 0, ry = pad.axes[3] || 0;
        if (Math.abs(ax) > dz) mx = ax; if (Math.abs(ay) > dz) my = ay; if (Math.abs(ry) > dz) zz -= ry;
        if (pad.buttons[12] && pad.buttons[12].pressed) zz += 0.7; if (pad.buttons[13] && pad.buttons[13].pressed) zz -= 0.7;
        zz += ((pad.buttons[7] && pad.buttons[7].value) || 0) - ((pad.buttons[6] && pad.buttons[6].value) || 0);
        const bt = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
        if (bt(0) && !prevB[0] && prevB.ready) return finish(true);
        if (bt(1) && !prevB[1] && prevB.ready) return finish(false);
        prevB[0] = bt(0); prevB[1] = bt(1); prevB.ready = true;
      }
      if (keys.ArrowLeft) mx -= 0.8; if (keys.ArrowRight) mx += 0.8; if (keys.ArrowUp) my -= 0.8; if (keys.ArrowDown) my += 0.8;
      if (keys['+'] || keys['=']) zz += 0.8; if (keys['-']) zz -= 0.8;
      if (mx || my) { px -= mx * S * 0.7 * dt; py -= my * S * 0.7 * dt; }
      if (zz) zoomAt(Math.exp(zz * 1.3 * dt)); else if (mx || my) draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });
}
// drop a picture anywhere on the console to use it as your profile picture
window.addEventListener('dragover', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
window.addEventListener('drop', (e) => {
  e.preventDefault(); const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (!f || !/^image\//.test(f.type) || avc) return;
  const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 1200 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); pickAvatar(c.toDataURL('image/jpeg', 0.92)); }; im.src = fr.result; }; fr.readAsDataURL(f);
});
async function clearAvatar() { const i = focusIdx(); settings = await api.avatarClear(); show(screen, screen === 'settings' ? i : 0); }
async function closeRunning() {
  const r = await api.gameClose();
  note(r && r.ok ? 'Closing the game...' : r.error);
}
const IDX = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, BACK: 8, START: 9 };
const DEF_BINDS_UI = { confirm: 'A', back: 'B', search: 'Y', remove: 'X' };
const DEF_MBINDS_UI = { left: 'A', right: 'B', kbd: 'Y', enter: 'START', esc: 'RB', back: 'LB' };
const BIND_ROWS = [['console', 'confirm', 'Select'], ['console', 'back', 'Back'], ['console', 'search', 'Search with keyboard'], ['console', 'remove', 'Remove game from library'],
  ['console', 'home', 'Go to Home'], ['desktop', 'left', 'Left click'], ['desktop', 'right', 'Right click'],
  ['desktop', 'kbd', 'Typing keyboard (any app)'], ['desktop', 'enter', 'Enter key'], ['desktop', 'esc', 'Escape key'], ['desktop', 'back', 'Browser back (Alt+Left)']];
const bindRows = (mode) => BIND_ROWS.filter((r) => r[0] === mode).map(([m, a, label]) =>
  `<button class="item" data-nav data-bind="${m}:${a}"><span>${label}</span><span>${padGlyph((m === 'console' ? settings.binds : settings.mbinds)[a])}</span></button>`).join('');
function startCapture(key) { const [mode, act] = key.split(':'); capture = { mode, act, armed: false, t: Date.now() }; note('Press the new button for this action...'); }
function finishCapture(name) {
  const { mode, act } = capture;
  if (mode === 'console' && (name === 'LB' || name === 'RB')) { capture.armed = false; return note('LB and RB always switch tabs. Press a different button.'); }
  capture = null;
  const key = mode === 'console' ? 'binds' : 'mbinds', cur = { ...settings[key] };
  const other = Object.keys(cur).find((a) => a !== act && cur[a] === name);
  if (other) cur[other] = cur[act];
  cur[act] = name;
  change({ [key]: cur });
  note(other ? 'Saved. "' + other + '" was swapped to ' + cur[other] + '.' : 'Saved.');
}
const scopeOk = (g, sc) => sc === 0 || (sc === 1 ? g.installed !== false : g.installed === false);
const liveLib = (t, sc) => {   // live results shown above the keyboard, like the Xbox search
  const q = t.trim().toLowerCase(), m = games.filter((g) => scopeOk(g, sc) && (!q || g.title.toLowerCase().includes(q)));
  return { count: m.length, items: m.slice(0, 5) };
};
let libSort = (() => { try { return localStorage.getItem('cn-libsort') || 'recent'; } catch { return 'recent'; } })(), libSrc = (() => { try { return localStorage.getItem('cn-libsrc') || ''; } catch { return ''; } })();
const SORTS = { recent: 'Recently played', az: 'A to Z', most: 'Most played', added: 'Not installed last' };
const srcOf = (g) => g.source || (g.steamId ? 'Steam' : 'Other');
const shownGames = () => {
  const q = libFilter.toLowerCase();
  const src = libSrc && games.some((g) => srcOf(g) === libSrc) ? libSrc : '';
  const l = games.filter((g) => scopeOk(g, libScope) && (!src || srcOf(g) === src) && (!q || g.title.toLowerCase().includes(q)));
  const byTitle = (x, y) => x.title.localeCompare(y.title);
  if (libSort === 'az') l.sort(byTitle);
  else if (libSort === 'most') l.sort((x, y) => (y.playSeconds || 0) - (x.playSeconds || 0) || byTitle(x, y));
  else if (libSort === 'added') l.sort((x, y) => ((x.installed === false) - (y.installed === false)) || byTitle(x, y));
  else l.sort((x, y) => (y.lastPlayed || 0) - (x.lastPlayed || 0) || ((x.installed === false) - (y.installed === false)) || byTitle(x, y));
  return l;
};
async function padSearch() {
  if (window.xtraSearch && window.xtraSearch()) return;
  if (screen === 'platform') return;
  games = await api.libGet();
  pickedId = null;
  const q = await openOsk('Search your library', libFilter, { done: 'Search', live: liveLib, scope: libScope });
  if (q === null) return;
  libFilter = q; libScope = lastScope;
  show('library');
  if (pickedId) setTimeout(() => { const t = [...document.querySelectorAll('[data-game]')].find((e) => e.dataset.game === pickedId); if (t) focusEl(t); }, 80);
}

SCREENS.catalog = {
  hints: 'A: Add    B: Back',
  html: () => `<h1>${esc(catQuery)}</h1><div class="grid">${catResults.map((g, i) => `<button class="tile game" data-nav data-res="${i}" data-img="${esc(g.image || '')}">${esc(g.title)}<small>${esc((String(g.released || '').match(/(19|20)\d\d/) || [''])[0])} ${esc(g.genres.join(', '))}</small></button>`).join('')}</div>
    <div class="row bar"><button class="item" data-nav data-act="find"><span>Search again</span><span></span></button><button class="item" data-nav data-go="library"><span>Back to library</span><span></span></button></div>`,
};
SCREENS.platform = {
  hints: 'A: Choose    B: Back',
  html: () => `<h1>Owned on</h1><div class="list">${['Steam', 'Epic Games', 'Ubisoft Connect', 'EA app', 'Xbox', 'Other'].map((p) => `<button class="item" data-nav data-plat="${p}"><span>${p}</span><span></span></button>`).join('')}</div>`,
};
async function findGame() {
  const q = await openOsk('Search for a game', '', { done: 'Search' });
  if (!q) return;
  note('Searching...');
  const r = await api.catSearch(q);
  if (!r || !r.ok) return note(r.error);
  catQuery = q; catResults = r.results; show('catalog');
  note(r.results.length ? 'A: add to your library' : 'No results.');
}
async function importList() {
  const r = await api.catOpenList();
  if (!r) return;
  if (r.error) return note(r.error);
  if (!r.titles.length) return note('That file is empty.');
  pending = { kind: 'bulk', titles: r.titles }; show('platform'); note(r.titles.length + ' titles loaded.');
}
async function choosePlatform(p) {
  if (!pending) return;
  if (pending.kind === 'one') { games = await api.catAdd(pending.entry, p); pending = null; show('library'); return note('Added to your library.'); }
  note('Matching ' + pending.titles.length + ' titles... this can take a few minutes.');
  const r = await api.catBulk(pending.titles, p); pending = null;
  if (!r) return note('Something went wrong.');
  games = r.games; show('library');
  note('Added ' + r.added + '. ' + (r.unmatched.length ? r.unmatched.length + ' not matched: ' + r.unmatched.slice(0, 4).join(', ') + (r.unmatched.length > 4 ? '...' : '') : 'All matched.') + (r.error ? ' Problem: ' + r.error : ''));
}
async function getArt() {   // real box art for every game: Steam posters, then SteamGridDB / IGDB / Steam store / GOG by title
  note('Looking up box art for ' + games.length + ' games. This can take a minute...');
  let found = 0, err = ''; const missed = [];
  const steamIds = games.filter((g) => g.steamId && /^\d+$/.test(String(g.steamId)));
  for (let k = 0; k < steamIds.length; k += 20) {
    const chunk = steamIds.slice(k, k + 20); let r = null; try { r = await api.posters(chunk.map((g) => String(g.steamId))); } catch {}
    if (r) for (const g of chunk) if (r[String(g.steamId)] && !customIds.has(g.id)) { if (!posterMap.has(g.id)) found++; posterMap.set(g.id, r[String(g.steamId)]); }
  }
  const rest = games.filter((g) => !posterMap.has(g.id));
  for (let k = 0; k < rest.length; k += 12) {
    const chunk = rest.slice(k, k + 12).map((g) => ({ id: g.id, title: g.title, steamId: g.steamId ? String(g.steamId) : '' })); let r = null;
    try { r = await api.covers(chunk, true); } catch (e) { err = e.message; }
    if (r && r.__err) err = r.__err;
    if (r && r.__miss) missed.push(...r.__miss);
    if (r) for (const c of chunk) if (r[c.id]) { posterMap.set(c.id, r[c.id]); found++; }
    note('Box art: ' + found + ' found so far (' + Math.min(k + 12, rest.length) + ' of ' + rest.length + ' checked)...');
  }
  show('library');
  notify('Box art ready', found + ' games got cover art.', '', 'star');
  note('Box art found for ' + found + ' games.' + (found === 0 && !settings.sgdbKey && !settings.igdbId ? ' Add a SteamGridDB key in Settings > Games & library for more.' : '') + (err ? ' Problem: ' + err : '') + (missed.length ? ' Not found: ' + missed.slice(0, 6).join(', ') + (missed.length > 6 ? ' and ' + (missed.length - 6) + ' more' : '') + '.' : ''));
}
async function rescan() {
  note('Scanning... this can take a minute.');
  games = await api.libScan(); acct = await api.accountStatus(); if (screen === 'settings') show('settings', focusIdx()); else show('library');
  note('Found ' + games.length + ' games.' + (acct.errors.length ? ' Problem: ' + acct.errors.join('; ') : ''));
  notify('Game library complete', games.length + ' games found.', '', 'play');
}
if (api.onAcctWeb) api.onAcctWeb(() => { if (typeof show === 'function') show('browser'); });   // a web sign-in (Steam, Epic) opened in the console's browser view
async function accountAction(p) {
  if (p !== 'steam' && p !== 'epic' && p !== 'ubisoft') return;
  const idx = focusIdx();
  if (acct[p]) { await api.accountLogout(p); acct = await api.accountStatus(); show('settings', idx); return note('Signed out.'); }
  let r;
  window.__acctBusy = true;
  try {
    if (false) {
      const fm = await ubiForm(); if (!fm) return note('Sign-in cancelled.');
      const email = fm.email, pw = fm.pw;
      note('Signing in to Ubisoft...');
      r = await api.ubiSignIn(email, pw);
      if (r && r.need2fa) { const code = await openOsk('Ubisoft verification code', ''); if (!code) return note('Sign-in cancelled.'); r = await api.ubiCode(code); }
      if (r && r.error) return note('Sign-in failed: ' + r.error);
    } else {
      note('Sign in on the page. Move the pointer with the stick, press A to click, and a text box opens the Xbox keyboard.');
      r = await api.accountLogin(p);
    }
  } finally { window.__acctBusy = false; }
  acct = await api.accountStatus(); show('settings', idx);
  if (!r || (!r.ok && !r.error)) return note('Sign-in failed.');
  if (!r.ok) return note('Sign-in failed: ' + r.error);
  notify('Signed in', 'Loading your library...', '', 'shield');
  await rescan();
  setTimeout(() => { try { window.__autoMedia && window.__autoMedia(); loadSquares(); } catch {} }, 6000);
}
const MI = { play: '<path d="M8 5.5v13l11-6.5z"/>', folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', pin: '<path d="M12 3l2.4 5 5.6.8-4 3.9.9 5.6-4.9-2.6-4.9 2.6.9-5.6-4-3.9 5.6-.8z"/>', store: '<path d="M4 9l1.5-5h13L20 9M4 9v10h16V9M4 9h16M9 19v-5h6v5"/>', trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6"/>', more: '<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>', img: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17l5-4.5 3.5 3L16 13l3 3.5"/>', pad: '<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M8 10v4M6 12h4"/><circle cx="16" cy="11" r=".8"/><circle cx="18" cy="13" r=".8"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>', dot: '<circle cx="12" cy="12" r="3"/>' };
function menuIcon(t) {   // a small line icon chosen from the item's words
  const s = String(t || '').toLowerCase();
  const k = /play|launch|resume|start|open game/.test(s) ? 'play' : /folder|browse|show in/.test(s) ? 'folder' : /pin|favou?rite|home/.test(s) ? 'pin' : /store|shop|buy/.test(s) ? 'store' : /uninstall|remove|delete|clear/.test(s) ? 'trash' : /more|\.\.\./.test(s) ? 'more' : /cover|art|picture|background|image|wallpaper|photo/.test(s) ? 'img' : /pause|keyboard|controller|pad|button|bind/.test(s) ? 'pad' : /rename|name|edit|change/.test(s) ? 'edit' : /user|profile|account|sign/.test(s) ? 'user' : /setting|option|setup/.test(s) ? 'gear' : 'dot';
  return `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${MI[k]}</svg>`;
}
function popMenu(tile, title, items, state) {
  closeMenu(true); SND.play('open');
  const m = document.createElement('div');
  m.id = 'menu';
  const h = document.createElement('div'); h.className = 'mh'; h.textContent = title; m.appendChild(h);
  for (const [k, label] of items) {
    const bt = document.createElement('button');
    bt.className = 'item'; bt.setAttribute('data-nav', ''); bt.dataset.menu = k;
    const mm = /^(.*?):\s*(On|Off)$/i.exec(label), txt = mm ? mm[1] : label;
    const ic = document.createElement('i'); ic.className = 'mi'; ic.innerHTML = menuIcon(txt); bt.appendChild(ic);
    const sp = document.createElement('span'); sp.className = 'ml'; sp.textContent = txt; bt.appendChild(sp);
    if (mm) { const pv = document.createElement('em'); pv.className = 'mv' + (/^on$/i.test(mm[2]) ? ' on' : ''); pv.textContent = mm[2]; bt.appendChild(pv); }
    if (/^(uninstall|remove|delete|sign out|quit|shut down|clear)/i.test(txt)) bt.classList.add('danger');
    m.appendChild(bt);
  }
  document.body.appendChild(m); animateIn('#menu .item');
  const r = tile.getBoundingClientRect(), mh = m.offsetHeight, mw = m.offsetWidth;
  let top = r.bottom + 8; if (top + mh > innerHeight - 8) top = Math.max(8, r.top - mh - 8);
  m.style.top = top + 'px'; m.style.left = Math.max(8, Math.min(r.left, innerWidth - mw - 8)) + 'px';
  menu = { ...state, tile };
  m.querySelector('[data-nav]').focus();
}
function openLibMenu(tile, more) {   // the menu button in the Library's top bar
  const sc = (k, label) => [k, (libScope === Number(k.slice(5)) ? '\u2713  ' : '') + label];
  if (more) return popMenu(tile, 'More', [['lback', 'Back'], ['find', 'Find and add a game'], ['importlist', 'Import list (.txt)'], ['art', 'Get artwork'], ['infoall', 'Get game info'], ['trailersall', 'Download all trailers'], ['trailersdel', 'Delete all trailers']], { lib: true });
  const cnt = (f) => games.filter(f).length;
  const items = [sc('scope0', 'All games (' + games.length + ')'), sc('scope1', 'Installed (' + cnt((g) => g.installed !== false) + ')'), sc('scope2', 'Not installed (' + cnt((g) => g.installed === false) + ')')];
  items.push(['sortmenu', 'Sort: ' + SORTS[libSort]], ['srcmenu', 'Store: ' + (libSrc || 'All')]);
  if (libFilter) items.push(['clearsearch', 'Clear search']);
  items.push(['addfolder', 'Add game folder'], ['scan', 'Rescan'], ['lmore', 'More\u2026']);
  popMenu(tile, 'Filter', items, { lib: true });
}
function openMenu(tile, gid, more) {   // the ... button on a game's page (or Start in the Library) opens this dropdown
  const g = games.find((x) => x.id === (gid || gameId));
  if (!g || !tile) return;
  const inst = g.installed !== false, hasT = typeof g.trailer === 'string' && TRAILER_OK.test(g.trailer);
  const items = [];
  if (more) {
    items.push(['gback', 'Back'], ['info', g.description ? 'Refresh game info' : 'Get game info']);
    if (hasT) items.push(['trailerrm', 'Remove trailer']);
    items.push(['sound', 'Trailer sound: ' + (settings.trailerSound ? 'On' : 'Off')], ['bgpick', 'Background picture']);
    return popMenu(tile, 'More', items, { id: g.id });
  }
  const live = !!runTitle && runTitle === g.title;
  if (live) items.push(['resume', 'Resume game'], ['closegame', 'Close game']);
  else if (inst) items.push(g.needsUpdate ? ['update', g.updating ? 'Updating' + (g.updatePct ? ' ' + g.updatePct + '%' : '') : 'Update'] : ['play', 'Play']); else items.push(['install', 'Install']);
  if (inst) items.push(['kbmenu', 'Pause-key menu (keyboard game): ' + ((settings.kbGames || []).includes(String(g.id)) ? 'On' : 'Off')], ['uninstall', 'Uninstall']);
  if (inst && g.folder) items.push(['folder', 'Open folder']);
  items.push(['pin', 'Pin to Home'], ['store', 'View in store'], ['remove', 'Remove from library'], ['gmore', 'More\u2026']);
  popMenu(tile, g.title, items, { id: g.id });
}
async function appMenu(tile) {   // Start on an app: open it, close its tab or window, or take it off the list
  const id = tile && tile.dataset.app, x = id && (settings.webApps || []).find((y) => y.id === id); if (!x) return;
  const nm = String(x.name).trim().toLowerCase(), sp = nm === 'spotify' || nm === 'youtube';
  let isOpen = openedApps.has(id);
  if (sp) { try { const st = nm === 'spotify' ? await api.spState() : await api.ytState(); isOpen = !!(st && (st.open || st.shown)); } catch { isOpen = false; } }
  const items = [['am:open', 'Open']]; if (isOpen) items.push(sp || x.kind === 'app' ? ['am:close', 'Close app'] : ['am:tab', 'Close app']);
  popMenu(tile, x.name, items, { appId: id });   // a Windows / Store app closes as an app, a website closes as a tab
}
async function appMenuAct(a, id) {
  if (a === 'am:open') return openApp(id);
  if (a === 'am:remove') return removeApp(id);
  { const ap = (settings.webApps || []).find((y) => y.id === id), nm = ap ? String(ap.name).trim().toLowerCase() : ''; if (a === 'am:close' && (nm === 'spotify' || nm === 'youtube')) { const rr = await api.appClose(nm); openedApps.delete(id); return note(rr && rr.ok ? 'Closed.' : ((rr && rr.error) || 'Could not close it.')); } }
  openedApps.delete(id);
  const r = await api.extClose(a === 'am:tab' ? 'tab' : 'window');
  note(r && r.ok ? (a === 'am:tab' ? 'Closing it...' : 'Closing it...') : ((r && r.error) || 'Could not close it.'));
}
let noHero = false;
const liveMenu = () => document.querySelector('#menu:not([data-dying])');
function closeMenu(skipFocus) {
  const m = liveMenu(); if (m) { try { m.dataset.dying = '1'; m.style.animation = 'none'; m.style.pointerEvents = 'none'; m.style.transition = 'opacity .16s ease, transform .18s cubic-bezier(.4,0,.2,1)'; void m.offsetWidth; m.style.opacity = '0'; m.style.transform = 'scale(.96)'; setTimeout(() => m.remove(), 220); } catch { m.remove(); } }   // the menu fades away (it used to vanish at once)
  const t = menu && menu.tile; menu = null;
  if (!skipFocus && t && document.body.contains(t)) { noHero = true; setTimeout(() => { noHero = false; }, 120); t.focus({ preventScroll: true }); }
}
async function menuAction(a) {
  if (menu && menu.appId) { const id = menu.appId; closeMenu(false); return appMenuAct(a, id); }
  if (menu && menu.lib && (a === 'sortmenu' || a === 'srcmenu')) { const t = menu.tile; closeMenu(true); if (a === 'sortmenu') return popMenu(t, 'Sort by', [...Object.entries(SORTS).map(([k, l]) => ['sort:' + k, (libSort === k ? '\u2713  ' : '') + l]), ['lback', 'Back']], { lib: true }); const srcs = [...new Set(games.map(srcOf))].sort(); return popMenu(t, 'Show games from', [['src:', (libSrc === '' ? '\u2713  ' : '') + 'All stores'], ...srcs.map((s) => ['src:' + s, (libSrc === s ? '\u2713  ' : '') + s]), ['lback', 'Back']], { lib: true }); }
  if (menu && menu.lib && (a.startsWith('sort:') || a.startsWith('src:'))) { closeMenu(false); if (a.startsWith('sort:')) { libSort = a.slice(5); try { localStorage.setItem('cn-libsort', libSort); } catch {} } else { libSrc = a.slice(4); try { localStorage.setItem('cn-libsrc', libSrc); } catch {} } return show('library'); }
  if (menu && menu.lib && a === 'trailersdel') { const t = menu.tile; closeMenu(true); return popMenu(t, 'Delete ALL saved trailers?', [['lmore', 'No, go back'], ['trailersdelyes', 'Yes, delete them all']], { lib: true }); }
  if (menu && menu.lib && a === 'trailersall') { closeMenu(true); return downloadAllTrailers(); }   // one button: official cinematic 4K trailers for every game, the rest from Steam
  if (menu && menu.lib) { const t = menu.tile; if (a === 'lmore' || a === 'lback') { closeMenu(true); return openLibMenu(t, a === 'lmore'); } closeMenu(false); return libAct(a); }
  if (menu && menu.bindBtn) { const b = menu.bindBtn, m = menu.bmode; closeMenu(false); return assignBind(m, a.slice(3), b); }
  if (menu && menu.padBtn) { const p = menu.padBtn, v = a.slice(3); closeMenu(false); change({ paddles: { ...(settings.paddles || {}), [p]: v } }); return note(v ? 'Saved. This is only a reminder of what the paddle does in the SCUF software.' : 'Saved.'); }
  if (menu && menu.ctl) { closeMenu(false); return ctlAct(a); }
  if (menu && menu.sg !== undefined) { const id = menu.sg; closeMenu(false); return signAct(a, id); }
  if (menu && (menu.wid || menu.wadd)) {
    const id = menu.wid;
    if (a === 'w:color') { await widgetAct(a, id); const t = document.querySelector(`[data-wedit="${id}"]`); return; }   // the editor redraws, so the menu closes
    closeMenu(false); return widgetAct(a, id);
  }
  if (menu && menu.id) gameId = menu.id;
  if (a === 'gmore' || a === 'gback') { const t = menu.tile, id = menu.id; closeMenu(true); return openMenu(t, id, a === 'gmore'); }
  if (a === 'colorcycle') { await gameAct('colorcycle'); return; }   // stays open so you can keep cycling
  closeMenu(false);
  await gameAct(a);
}
let holdTr = 0, gameMute = false, exitedAt = -1e9, exitRet = null;

let comeT = 0;
function comeIn() {   // the console shows itself again (from behind a game): it fades in softly instead of appearing at once
  const b = document.body; if (!b.classList.contains('away')) return;
  setTimeout(() => { b.classList.add('comein'); b.classList.remove('away', 'fade', 'snap'); clearTimeout(comeT); comeT = setTimeout(() => b.classList.remove('comein'), 800); }, 60);
}
function leaveGameMenu() { silenceAll(true); closeGuide(); resumeSmooth(); }   // inside a game the menu is left with the Share button (not B), so the game never sees a button press for it
function resumeSmooth(fix) {   // going back to the game: the console fades out first, then the game comes forward
  const b = document.body; b.classList.add('away', 'fade'); b.classList.remove('snap');
  setTimeout(() => { if (document.hasFocus() && b.classList.contains('away')) comeIn(); }, 3500);
  return new Promise((res) => setTimeout(() => res(window.consoleApi.gameResume(!!fix)), 260));
}
function quietMedia() { document.querySelectorAll('video,audio').forEach((m) => { try { m.muted = true; m.pause(); } catch {} }); }
/* while the PlayStation Control Center is up, nothing outside it can be focused, clicked or pressed (like the Xbox menu) */
{
  const outside = (e) => guideOn && psOn() && !osk && !menu && e.target && e.target.nodeType === 1 && !e.target.closest('#guide');
  ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'auxclick', 'contextmenu', 'touchstart'].forEach((t) => document.addEventListener(t, (e) => { if (outside(e)) { e.stopImmediatePropagation(); e.preventDefault(); } }, true));
  document.addEventListener('keydown', (e) => { if (outside(e) && /^(Enter|Space| |ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(e.key === ' ' ? ' ' : e.key)) e.preventDefault(); }, true);
  document.addEventListener('focusin', (e) => { if (outside(e)) { try { e.target.blur(); } catch {} } }, true);
}
document.addEventListener('play', (e) => { try { if (guideOn && dash && e.target && /^(VIDEO|AUDIO)$/.test(e.target.tagName)) { e.target.muted = true; e.target.pause(); } } catch {} }, true);   // the game's menu over a running game: no trailer or music starts behind it
function silenceAll(on) {   // while a game starts or runs the console does nothing at all (no sound, no video, no animation) so the game gets everything
  on = !!on; if (on === gameMute) return;
  gameMute = on; if (on) SND.mute(true); document.body.classList.toggle('ingame', on);
  if (on) {
    document.querySelectorAll('video,audio').forEach((m) => { try { m.muted = true; m.pause(); m.removeAttribute('src'); m.load(); } catch {} });
    document.querySelectorAll('.hl').forEach((h) => { h.style.animation = 'none'; });
    if (pairStop) { try { pairStop(); } catch {} pairStop = null; }
  } else {
    document.querySelectorAll('.hl').forEach((h) => { h.style.animation = ''; });
    try { SND.mute(false); } catch {} if (['home', 'library', 'game', 'trailer'].includes(screen)) { heroKey = ''; show(screen, focusIdx()); }   // everything wakes up again at once
  }
}
const logoCache = new Map();
const whiteCache = new Map();
function whitenGrey(src) {   // v764: the YouTube lettering is dark grey in its logo file: every grey / black pixel becomes white, the red icon stays as it is
  if (whiteCache.has(src)) return Promise.resolve(whiteCache.get(src));
  return new Promise((res) => { const im = new Image(); im.onload = () => { try {
    const w = im.naturalWidth, h = im.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const id = x.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] === 0) continue; const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); if (mx - mn < 45 && mx < 200) { d[i] = d[i + 1] = d[i + 2] = 255; } }
    x.putImageData(id, 0, 0); const u = c.toDataURL('image/png'); whiteCache.set(src, u); res(u);
  } catch { res(src); } }; im.onerror = () => res(src); im.src = src; });
}
function trimLogo(src, crop) {   // every logo is cut down to the real lettering (Steam's files often have a lot of empty space around it), so all logos show at the same size and place
  const key = src + (crop ? '#c' : '');
  if (/ctheme:\/\/img\/wt-/.test(src)) return Promise.resolve({ u: src });   // already cut down to the lettering by the app
  if (logoCache.has(key)) return Promise.resolve(logoCache.get(key));
  return new Promise((res) => {
    const done = (r) => { logoCache.set(key, r); res(r); };
    const im = new Image();
    im.onload = () => {
      try {
        const w = im.naturalWidth, h = im.naturalHeight;
        if (!crop && w > 360) {   // v1072: the lettering is found on a small copy (about 25 times less work), then cut from the full picture, so a logo is ready in a few milliseconds
          const s = 320 / w, sw0 = 320, sh0 = Math.max(1, Math.round(h * s)), c0 = document.createElement('canvas'); c0.width = sw0; c0.height = sh0;
          const x0c = c0.getContext('2d', { willReadFrequently: true }); x0c.drawImage(im, 0, 0, sw0, sh0); const d0 = x0c.getImageData(0, 0, sw0, sh0).data;
          let a0 = sw0, a1 = -1, b0 = sh0, b1 = -1;
          for (let cy = 0; cy < sh0; cy++) for (let cx = 0; cx < sw0; cx++) { if (d0[(cy * sw0 + cx) * 4 + 3] > 20) { if (cx < a0) a0 = cx; if (cx > a1) a1 = cx; if (cy < b0) b0 = cy; if (cy > b1) b1 = cy; } }
          if (a1 < 0) return done({ u: src });
          const sx = Math.max(0, Math.floor(a0 / s) - 3), sy = Math.max(0, Math.floor(b0 / s) - 3), ex = Math.min(w, Math.ceil((a1 + 1) / s) + 3), ey = Math.min(h, Math.ceil((b1 + 1) / s) + 3);
          const o0 = document.createElement('canvas'); o0.width = ex - sx; o0.height = ey - sy; o0.getContext('2d').drawImage(im, sx, sy, ex - sx, ey - sy, 0, 0, ex - sx, ey - sy);
          return done({ u: o0.toDataURL('image/png') });
        }
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, w, h).data;
        let lim = w;
        if (crop) {   // this logo's file says "Overwatch 2": the orange "2" at the right is dropped
          let minX = -1;
          for (let cx = w - 1; cx > w * 0.7; cx--) { let hit = false; for (let cy = 0; cy < h && !hit; cy += 2) { const k = (cy * w + cx) * 4; if (d[k + 3] > 200 && d[k] > 200 && d[k + 1] < 170 && d[k + 2] < 90) hit = true; } if (hit) minX = cx; }
          lim = minX > 0 ? Math.max(Math.round(w * 0.6), Math.round(minX - w * 0.015)) : Math.round(w * 0.9);
        }
        let x0 = lim, x1 = -1, y0 = h, y1 = -1;
        for (let cy = 0; cy < h; cy++) for (let cx = 0; cx < lim; cx++) { if (d[(cy * w + cx) * 4 + 3] > 24) { if (cx < x0) x0 = cx; if (cx > x1) x1 = cx; if (cy < y0) y0 = cy; if (cy > y1) y1 = cy; } }
        if (x1 < 0) return done({ u: src });
        const pad = 2, sx = Math.max(0, x0 - pad), sy = Math.max(0, y0 - pad), sw = Math.min(lim, x1 + pad + 1) - sx, sh = Math.min(h, y1 + pad + 1) - sy;
        const o = document.createElement('canvas'); o.width = sw; o.height = sh; o.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh);
        done({ u: o.toDataURL('image/png') });
      } catch { done({ u: src, clip: crop }); }
    };
    im.onerror = () => done({ u: src, clip: crop }); im.src = src;
  });
}
function showLaunch(g) {
  launching = true; silenceAll(true);
  const el = $('#launch');
  el.classList.remove('ready'); el.hidden = false; void el.offsetWidth;   // it exists (still clear) before it fades in
  const cover = gImg(g), logo = logoMap.has(g.id) ? 'ctheme://img/' + logoMap.get(g.id) : '', wide = heroMap.has(g.id) ? 'ctheme://img/' + heroMap.get(g.id) : '';
  const [c1] = heroColors(g);
  const lt = el.querySelector('.lt'); lt.textContent = logo ? '' : g.title; lt.classList.toggle('lg', !!logo);
  if (logo) { const im = document.createElement('img'); im.alt = g.title; lt.appendChild(im); trimLogo(logo, String(g.steamId) === '2357570').then((r) => { im.src = r.u; if (r.clip) im.style.clipPath = 'inset(0 10% 0 0)'; }); }
  let cv = el.querySelector('.lcv'); if (!cv) { cv = document.createElement('div'); cv.className = 'lcv'; el.insertBefore(cv, el.firstChild); }
  const sqc = sqMap.has(g.id) ? 'ctheme://img/' + sqMap.get(g.id) : cover; cv.style.backgroundImage = sqc ? `url("${sqc}")` : ''; cv.hidden = !sqc; cv.classList.toggle('fit', !sqMap.has(g.id)); el.classList.toggle('hascv', !!sqc);
  el.classList.remove('lgo'); if (logo) { const li = new Image(); li.onload = li.onerror = () => el.classList.add('lgo'); li.src = logo; } else el.classList.add('lgo');
  el.querySelector('.ls').textContent = 'STARTING';
  el.querySelector('.lh').textContent = settings.binds.back + ': hide this screen';
  const art = wide || (/^https:\/\/media\.rawg\.io\//.test(g.image || '') ? g.image : '');
  const bgArt = art || cover;   // never a coloured gradient: the backdrop is the game's own picture, darkened, or plain black
  let lb = el.querySelector('.lbg'); if (!lb) { lb = document.createElement('div'); lb.className = 'lbg'; el.insertBefore(lb, el.firstChild); }
  lb.style.backgroundImage = bgArt ? `url("${bgArt}")` : 'none';
  startBar(el, g.id);
  clearTimeout(el._fu); el.classList.remove('full'); el.classList.add('show'); void el.offsetWidth; el._fu = setTimeout(() => el.classList.add('full'), 720);   // the loading screen fades in softly over the game page, and the page behind is only hidden once it is fully there
}
let barRaf = 0, barReady = false;
const LAUNCH_T = 'launchTimes';
function launchGuess(id) { try { const o = JSON.parse(localStorage.getItem(LAUNCH_T) || '{}'); const v = Number(o[id]); return v > 4 && v < 180 ? v : 22; } catch { return 22; } }
function launchNote(id, secs) { try { const o = JSON.parse(localStorage.getItem(LAUNCH_T) || '{}'); const old = Number(o[id]); o[id] = Math.round((old > 4 ? old * 0.4 + secs * 0.6 : secs) * 10) / 10; localStorage.setItem(LAUNCH_T, JSON.stringify(o)); } catch {} }
function startBar(el, gid) {   // the fill follows this game's own usual start-up time (learned from earlier starts): steady, never jumps; when the game is ready it glides to exactly 100%
  cancelAnimationFrame(barRaf); barReady = false;
  const T = launchGuess(gid), t0 = performance.now(); let p = 0, r0 = -1, p0 = 0, told = false; el._lt0 = t0; el._lgid = gid;
  const i = el.querySelector('.bar i'); i.style.setProperty('--p', 0);
  const step = (now) => {
    if (barReady) { if (r0 < 0) { r0 = now; p0 = p; } const dur = 500 + (1 - p0) * 1100; const s = Math.min(1, (now - r0) / dur); p = p0 + (1 - p0) * (s * s * (3 - 2 * s)); }
    else { const t = (now - t0) / 1000; const target = t < T ? 0.9 * (1 - Math.pow(1 - t / T, 2)) : 0.9 + 0.09 * (1 - Math.exp(-(t - T) / 25)); p = Math.max(p, Math.min(0.99, target)); }
    i.style.setProperty('--p', p.toFixed(4)); el.style.setProperty('--pn', Math.round(p * 100)); el.style.setProperty('--p', p.toFixed(4));
    if (barReady && p >= 1) { if (!told) { told = true; el.classList.add('ready'); el.querySelector('.ls').textContent = 'READY'; try { window.consoleApi.launchFull(); } catch {} } return; }
    barRaf = requestAnimationFrame(step); };
  barRaf = requestAnimationFrame(step);
}
function hideLaunch(fast) {
  cancelAnimationFrame(barRaf); launching = false;
  const el = $('#launch');
  clearTimeout(el._fu); el.classList.remove('show', 'ready', 'full');
  if (fast) el.hidden = true; else setTimeout(() => { if (!launching) el.hidden = true; }, 750);
}
async function launch(id) {
  SND.play('launch');
  const g = games.find((x) => x.id === id);
  if (g && g.installed !== false) showLaunch(g);
  const r = await api.libLaunch(id);
  if (!r || !r.ok) { hideLaunch(false); silenceAll(false); return note(r.error); }
  api.libGet().then((x) => { games = x; });
  if (!(g && g.installed !== false)) note('Opened the launcher. Finish there, then press Rescan.');
}
async function removeGame(id) {
  let keep = null;   // v1266: after removing a game the list stays where it was: the same spot (or the game before it) is selected and the grid does not jump to the top
  try { if (screen === 'library') { const lg = document.querySelector('.lgrid'), items = lg ? [...lg.querySelectorAll('[data-game]')] : [], i = items.findIndex((e) => e.dataset.game === id); if (lg && i >= 0) { const nx = items[i + 1] || items[i - 1]; keep = { top: lg.scrollTop, next: nx ? nx.dataset.game : '', idx: i }; } } } catch {}
  games = await api.libRemove(id);
  if (keep && screen === 'library') { show('library', focusIdx()); try { const lg = document.querySelector('.lgrid'); if (lg) { const put = () => { lg.scrollTop = keep.top; }; put(); requestAnimationFrame(put); const ne = keep.next && [...lg.querySelectorAll('[data-game]')].find((e) => e.dataset.game === keep.next); const items = [...lg.querySelectorAll('[data-game]')], tg = items[Math.min(keep.idx, items.length - 1)] || ne; if (tg) { tg.focus({ preventScroll: true }); put(); const ge = games.find((x) => x.id === tg.dataset.game); if (ge) { setHero(ge, true); updateLibPanel(ge); } glowKick(700); } } } catch {} note('Removed from the library. Your files were not touched.'); return; }
  show(screen === 'home' ? 'home' : 'library', screen === 'game' ? 0 : focusIdx()); note('Removed from the library. Your files were not touched.'); }

// THEME-START
const THEME_COLORS = ['#2f6fed', '#d2475f', '#2fa66a', '#e0a030', '#8a5cf0', '#16a5b8', '#e06a2c', '#c23fa3'];
const hue = (t) => { let h = 0; for (const ch of String(t)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 360; };
const THEME_RE = /^[a-f0-9]{12}-[a-z0-9]+\.jpg$/;
function heroSrc(g) {   // a picture you chose wins, then the downloaded cover art
  if (!g) return '';
  const f = g.theme && g.theme.bgFile;
  if (f && THEME_RE.test(f)) return 'ctheme://img/' + f;
  if (heroMap.has(g.id)) return 'ctheme://img/' + heroMap.get(g.id);   // Steam's current wide hero art for this game
  return '';
}
const logoMap = new Map(), heroMap = new Map(), heroAsked = new Set();
const logoAsked = new Set();
function fetchLogoFor(g) {   // games without a Steam logo: the Epic launcher's own logo for Epic games, otherwise Steam's page for the same title
  if (!g || !g.title || logoMap.has(g.id) || logoAsked.has(g.id) || !api.heroes) return;
  logoAsked.add(g.id);
  const ok = (l) => l && /^w[lt]-\d+\.png$/.test(l);
  const set = (l) => { logoMap.set(g.id, l); if (lastHero && lastHero.id === g.id) refreshHeroFor(g.id); };
  const viaEpic = () => (api.epicLogo ? api.epicLogo({ title: g.title, uri: g.uri || '' }).then((l) => (ok(l) ? l : null)) : Promise.resolve(null));
  const viaSteam = () => (api.steamAppId ? api.steamAppId(g.title).then((sid) => (sid ? api.heroes([String(sid)]).then((r) => (r && r[sid + 'l']) || null) : null)) : Promise.resolve(null));
  const epic = /epic/i.test(g.source || '') || /epicgames/i.test(g.uri || '');
  const viaSgdb = () => (api.sgdbLogo ? api.sgdbLogo(g.title).then((l) => (ok(l) ? l : null)).catch(() => null) : Promise.resolve(null));   // v1265: SteamGridDB's logo (needs the SteamGridDB key) for what is still missing
  const own = () => (api.bundledLogo ? api.bundledLogo(g.title).then((l) => (ok(l) ? l : null)) : Promise.resolve(null));
  const viaGog = () => (/^gog\d+$/.test(String(g.id)) && api.gogLogo ? api.gogLogo(String(g.id).slice(3)).then((l) => (ok(l) ? l : null)).catch(() => null) : Promise.resolve(null));   // v973: GOG games are matched by their GOG id
  own().then((l) => (ok(l) ? l : viaGog())).then((l) => (ok(l) ? l : (epic ? viaEpic() : viaSteam()))).then((l) => (ok(l) ? l : (epic ? viaSteam() : viaEpic()))).then((l) => (ok(l) ? l : viaSgdb())).then((l) => { if (ok(l)) set(l); }).catch(() => {});
}
const ownAsked = new Set(), ownSet = new Set();
function applyOwnLogo(g) {   // logos that ship with the console beat whatever a store offers
  if (!g || !g.title || ownAsked.has(g.id) || !api.bundledLogo) return;
  ownAsked.add(g.id);
  api.bundledLogo(g.title).then((l) => { if (l && /^wt-\d+\.png$/.test(l)) { logoMap.set(g.id, l); ownSet.add(g.id); logoAsked.add(g.id); if (lastHero && lastHero.id === g.id) refreshHeroFor(g.id); } }).catch(() => {});
}
function loadHero(g) {
  applyOwnLogo(g);
  if (g && !g.steamId) fetchLogoFor(g);   // fetch Steam's wide artwork for the game being shown, then redraw the background
  if (g && !g.steamId && g.title && !heroMap.has(g.id) && !heroAsked.has(g.id) && api.storeHeroes) { heroAsked.add(g.id); heroFor([{ id: g.id, title: g.title }]).then((x) => { const n = x && x[g.id]; if (n && /^wh-\d+\.jpg$/.test(n)) { heroMap.set(g.id, n); if (lastHero && lastHero.id === g.id) { heroKey = ''; setHero(lastHero); } } }).catch(() => {}); return; }
  if (!g || !g.steamId || !/^\d+$/.test(String(g.steamId)) || heroMap.has(g.id) || heroAsked.has(g.id) || !api.heroes) return;
  heroAsked.add(g.id);
  api.heroes([String(g.steamId)]).then((r) => { const k = String(g.steamId), n = r && r[k], l = r && r[k + 'l']; let ch = false; if (n && /^wh-\d+\.jpg$/.test(n)) { heroMap.set(g.id, n); ch = true; } if (l && /^w[lt]-\d+\.png$/.test(l) && !ownSet.has(g.id)) { logoMap.set(g.id, l); ch = true; } if (ch && lastHero && lastHero.id === g.id) refreshHeroFor(g.id); if (!logoMap.has(g.id)) fetchLogoFor(g); }).catch(() => { fetchLogoFor(g); });   // Steam has no logo for it (Epic exclusives like Fall Guys): ask the Epic store
}

async function heroFor(items) {   // games that are not on Steam (Ubisoft Connect, Epic...): the Steam page with exactly the same name gives the art (never a sequel's), the Microsoft Store is the fallback
  const out = {}, rest = [];
  for (const it of (items || [])) {
    let n = '';
    try { const sid = api.steamAppId ? await api.steamAppId(it.title) : ''; if (sid && /^\d+$/.test(String(sid))) { const r = await api.heroes([String(sid)]); const f = r && r[String(sid)]; if (f && /^wh-\d+\.jpg$/.test(f)) n = f; } } catch {}
    if (n) out[it.id] = n; else rest.push(it);
  }
  if (rest.length && api.storeHeroes) { try { Object.assign(out, (await api.storeHeroes(rest)) || {}); } catch {} }
  return out;
}
async function prefetchStoreHeroes() {
  if (!api.storeHeroes) return;
  const todo = games.filter((g) => g && !g.steamId && g.title && !heroMap.has(g.id) && !heroAsked.has(g.id));
  todo.forEach((g) => heroAsked.add(g.id));
  for (let i = 0; i < todo.length; i += 6) {
    const part = todo.slice(i, i + 6);
    try { const r = await heroFor(part.map((g) => ({ id: g.id, title: g.title }))); if (r) for (const g of part) { const n = r[g.id]; if (n && /^wh-\d+\.jpg$/.test(n)) { heroMap.set(g.id, n); if (lastHero && lastHero.id === g.id) { heroKey = ''; setHero(lastHero); } } } } catch {}
  }
}
function heroColors(g) {   // every game gets its own color, from your choice or generated from its name
  const col = g && g.theme && /^#[0-9a-f]{6}$/i.test(g.theme.color || '') ? g.theme.color : null;
  const c1 = col || `hsl(${hue((g && g.title) || 'x')} 58% 36%)`;
  return [c1, `color-mix(in srgb, ${c1} 32%, #0d111d)`];
}
// THEME-END
const gameOf = (el) => {
  const t = el.closest && el.closest('[data-game]');
  if (t) return games.find((x) => x.id === t.dataset.game) || null;
  return el.dataset && el.dataset.img ? { image: el.dataset.img } : null;
};
let heroPT = 0, heroLock = 0; const lockHero = (ms = 250) => { heroLock = Math.max(heroLock, performance.now() + ms); };   // pressing the Xbox button, opening the guide or coming back to the window never swaps the background
function setHero(g, force) {   // the background crossfades to the theme of the game you select
  if (!g) return;
  if (!force && (guideOn || performance.now() < heroLock)) {   // blocked for now (menu open / just closed): remember it and apply the game you are really on the moment the block ends
    const apply = () => { if (guideOn) { heroPT = setTimeout(apply, 300); return; } const a = document.activeElement; let n = null; if (a && a.closest && (screen === 'home' || screen === 'library')) n = gameOf(a); setHero(n || g); };
    clearTimeout(heroPT); heroPT = setTimeout(apply, Math.max(60, heroLock - performance.now() + 40));
    return;
  }
  lastHero = g; loadHero(g); { const hh = $('#hero'); if (hh) hh.classList.remove('appmode'); }
  const src = heroSrc(g), [c1, c2] = heroColors(g), key = src + '|' + c1 + '|' + (logoMap.get(g.id) || '');
  if (key === heroKey) return;
  heroKey = key;
  const t = ++heroTok, A = $('#hero .a'), B = $('#hero .b'), on = heroFlip ? A : B, off = heroFlip ? B : A;
  heroFlip = !heroFlip;
  const wash = `linear-gradient(135deg, color-mix(in srgb, ${c1} 12%, transparent), transparent 72%)`;
  const grad = `radial-gradient(120% 95% at 72% 18%, ${c1} 0%, ${c2} 58%, #0d111d 100%)`;
  const fbArt = !src ? (sqMap.has(g.id) ? 'ctheme://img/' + sqMap.get(g.id) : (gImg(g) || '')) : '';   // no wide art for this game: its own cover, blurred, instead of a plain colour
  const isCover = !!src || !!fbArt;
  let pc = $('#hero .pc'); if (!pc) { pc = document.createElement('div'); pc.className = 'pc'; $('#hero').appendChild(pc); }
  let hv = $('#hero .hv'); if (!hv) { hv = document.createElement('video'); hv.className = 'hv'; hv.muted = true; hv.loop = true; hv.playsInline = true; hv.preload = 'auto'; $('#hero').insertBefore(hv, $('#hero .pc')); }
  const tf = typeof g.trailer === 'string' && TRAILER_OK.test(g.trailer) ? g.trailer : '';
  hv.style.transition = 'none'; hv.classList.remove('on'); void hv.offsetWidth; hv.style.transition = ''; clearTimeout(hv._t);
  if (tf && !introOn && !(document.body.classList.contains('is-home') && !document.body.classList.contains('lib'))) { hv._t = setTimeout(() => { if (t !== heroTok || gameMute) return; hv.onplaying = () => { if (t === heroTok) hv.classList.add('on'); }; hv.src = 'ctheme://img/' + tf; hv.play().catch(() => {}); }, Math.max(700, holdTr - Date.now())); } else { hv.pause(); hv.removeAttribute('src'); }
  titleGhost($('#hero .pc'));   // v1070: the game name is swapped the same frame, with no fading copy of the last name left on top of the new one
  { document.querySelectorAll('#hero .hg.hgx').forEach((x) => x.remove()); }
  let hg = $('#hero .hg'); if (!hg) { hg = document.createElement('div'); hg.className = 'hg'; $('#hero').appendChild(hg); }
  const CROP2 = new Set(['2357570']);   // Steam's logo for this one says "Overwatch 2": we trim the "2" off the real logo
  const lsrc = logoMap.has(g.id) ? 'ctheme://img/' + logoMap.get(g.id) : '', crop = lsrc && CROP2.has(String(g.steamId));
  hg.textContent = lsrc || !g.title ? '' : String(g.title).replace(/[®™]/g, '').replace(/\s+2$/, ''); hg.classList.toggle('tx', !lsrc);
  hg.style.transition = 'none'; hg.classList.remove('on'); clearTimeout(hg._t); void hg.offsetWidth;   // v972: no setTimeout and logos are pre-cut, so the title is there the same frame you land on a game
  hg.style.backgroundImage = 'none';
  if (!lsrc) hg.classList.add('on');
  else trimLogo(lsrc, crop).then((r) => { if (t !== heroTok) return; hg.textContent = ''; const el = document.createElement('img'); el.src = r.u; if (r.clip) el.style.clipPath = 'inset(0 10% 0 0)'; hg.appendChild(el); hg.classList.remove('tx'); hg.classList.add('on'); });
  const put = (bg) => { if (t !== heroTok) return; on.style.backgroundImage = bg; on.classList.toggle('pst', isCover); on.classList.toggle('fb', !!fbArt); on.style.backgroundColor = isCover ? c2 : ''; on.classList.add('on'); off.classList.remove('on');
    pc.style.transition = 'none'; pc.classList.remove('on'); if (gImg(g)) setTimeout(() => { if (t === heroTok) { pc.style.backgroundImage = `url("${sqMap.has(g.id) ? 'ctheme://img/' + sqMap.get(g.id) : gImg(g)}")`; pc.classList.toggle('sqc', sqMap.has(g.id)); pc.classList.add('on'); } }, 0); };
  if (src) { const img = new Image(); img.onerror = () => put(grad); img.src = src; (img.decode ? img.decode() : Promise.reject()).then(() => put(`${wash}, url("${src}")`), () => { if (img.complete && img.naturalWidth) put(`${wash}, url("${src}")`); else img.onload = () => put(`${wash}, url("${src}")`); }); }   // decoded before it is swapped in, so changing cards never stalls a frame
  else if (fbArt) { const img = new Image(); img.onload = () => put(`${wash}, url("${fbArt}")`); img.onerror = () => put(grad); img.src = fbArt; }
  else put(grad);
}

const appHue = new Map(), appShots = new Map();   // average brand colour of each app's cover
function appColor(file) {
  if (appHue.has(file)) return Promise.resolve(appHue.get(file));
  return new Promise((res) => {
    const im = new Image(); im.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 24, 24);
        const d = x.getImageData(0, 0, 24, 24).data; let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]), s = mx ? (mx - mn) / mx : 0, k = s * s * (d[i + 3] / 255) + 0.0001; r += d[i] * k; g += d[i + 1] * k; b += d[i + 2] * k; w += k; }
        const col = w > 0.05 ? [Math.round(r / w), Math.round(g / w), Math.round(b / w)] : [90, 96, 110]; appHue.set(file, col); res(col);
      } catch { res([90, 96, 110]); }
    }; im.onerror = () => res([90, 96, 110]); im.src = 'ctheme://img/' + file;
  });
}
function appMidnight(on) {   // the same live midnight sky as the sign-in page: twinkling stars, slow ambient light and a shooting star
  const h = $('#hero'); if (!h) return;
  let m = h.querySelector('.hmid');
  if (!m) {
    m = document.createElement('div'); m.className = 'hmid'; fillBackdrop(m, 220);
    h.insertBefore(m, h.firstChild);
  }
  h.classList.toggle('appmode', !!on);
}
async function setAppHero(id) {   // focus on one of your apps: the background becomes that app's colour with its name and cover, not the last game
  const a = (settings.webApps || []).find((x) => x.id === id); if (!a) return;
  if (heroKey === 'app:' + id) return;
  heroKey = 'app:' + id; lastHero = null;
  const t = ++heroTok, file = appArt.get(id) || '', A = $('#hero .a'), B = $('#hero .b'), on = heroFlip ? A : B, off = heroFlip ? B : A;
  heroFlip = !heroFlip;
  const hv = $('#hero .hv'); if (hv) { clearTimeout(hv._t); hv.classList.remove('on'); try { hv.pause(); } catch {} }
  const hg = $('#hero .hg'), pc = $('#hero .pc'); titleGhost(pc); document.querySelectorAll('#hero .hg.hgx').forEach((x) => x.remove());
  if (hg) { clearTimeout(hg._t); hg.style.transition = 'none'; hg.classList.remove('on'); hg.textContent = ''; hg.classList.remove('tx'); hg.style.backgroundImage = 'none'; void hg.offsetWidth; hg.style.transition = ''; }
  if (pc) { pc.style.transition = 'none'; pc.classList.remove('on'); }
  let col = /^#[0-9a-f]{6}$/i.test(a.color || '') ? [parseInt(a.color.slice(1, 3), 16), parseInt(a.color.slice(3, 5), 16), parseInt(a.color.slice(5, 7), 16)] : null;
  appMidnight(true); on.classList.remove('on'); off.classList.remove('on');
  if (pc && file) setTimeout(() => { if (t === heroTok) { pc.style.backgroundImage = `url("ctheme://img/${file}")`; pc.classList.add('sqc'); pc.classList.add('on'); } }, 0);
  if (hg) {   // the big mark on the left: the app's own logo, cut to its edges, not typed text
    const show = () => { if (t === heroTok) hg.classList.add('on'); };
    const asText = () => { if (t !== heroTok) return; hg.textContent = a.name || ''; hg.classList.add('tx'); show(); };
    const fromCover = () => { if (!file) return asText(); appPlate(file).then((u) => { if (t !== heroTok) return; if (!u) return asText(); const im = document.createElement('img'); im.src = u; hg.textContent = ''; hg.classList.remove('tx'); hg.appendChild(im); show(); }); };
    const mark = (svg) => { if (t !== heroTok) return; if (!/^\s*<svg/i.test(svg || '')) return fromCover(); if (/<title>\s*YouTube/i.test(svg) && !svg.includes('M9.545 15.568V8.432')) svg = svg.replace(/(<\/title>|<svg[^>]*>)/i, (s) => s + '<path fill="#fff" d="M9.545 15.568V8.432L15.818 12z"/>');   // the play triangle is a hole in the logo: fill it white
      const im = document.createElement('img'); im.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))); im.onerror = () => { if (t === heroTok) { hg.textContent = ''; fromCover(); } }; hg.textContent = ''; hg.classList.remove('tx'); hg.appendChild(im); show(); };
    setTimeout(() => { if (t === heroTok && !hg.firstChild && !hg.textContent) asText(); }, 2500);
    const wm = (f) => { if (t !== heroTok) return; if (!/^al-[a-z0-9]{1,30}\.png$/.test(f || '')) return asText(); trimLogo('ctheme://img/' + f).then((r) => (r && r.u && /youtube/i.test(a.name || '') ? whitenGrey(r.u).then((u) => ({ u })) : r)).then((r) => { if (t !== heroTok) return; if (!r || !r.u) return asText(); const im = document.createElement('img'); im.className = 'appl'; im.onerror = () => asText(); im.src = r.u; hg.textContent = ''; hg.classList.remove('tx'); hg.appendChild(im); show(); }).catch(asText); };
    setTimeout(() => { if (t === heroTok && !hg.firstChild && !hg.textContent) asText(); }, 3500);
    const own = () => { if (appMarks.has(id)) wm(appMarks.get(id)); else if (api.appLogo) api.appLogo(id).then((f) => { if (f) appMarks.set(id, f); wm(f); }).catch(asText); else asText(); };
    if (api.bundledLogo && a.name) api.bundledLogo(a.name).then((l) => { if (t !== heroTok) return; if (!l || !/^wt-\d+\.png$/.test(l)) return own(); const im = document.createElement('img'); im.className = 'apps'; im.onerror = () => own(); im.onload = () => { if (t !== heroTok) return; hg.textContent = ''; hg.classList.remove('tx'); hg.appendChild(im); show(); }; im.src = 'ctheme://img/' + l; }).catch(own); else
    if (appMarks.has(id)) wm(appMarks.get(id)); else if (api.appLogo) api.appLogo(id).then((f) => { if (f) appMarks.set(id, f); wm(f); }).catch(asText); else asText();
  }
}
// v959: the big game title / poster fade OUT smoothly: a copy of what is on screen is left behind and dissolves while the new one rises in
function titleGhost(el) {
  try {
    if (!el || introOn || document.body.classList.contains('intro-on') || !el.classList.contains('on') || (!el.firstChild && !el.style.backgroundImage)) return;
    if (parseFloat(getComputedStyle(el).opacity) < 0.2) return;
    const g = el.cloneNode(true); g.classList.add('hgx'); g.removeAttribute('id'); g.style.transition = 'none'; el.parentNode.insertBefore(g, el.nextSibling);
    setTimeout(() => { try { g.remove(); } catch {} }, 650);
  } catch {}
}
const appPlates = new Map(), appMarks = new Map();
function appPlate(file) {   // the app's own logo, cut out of its cover: light covers become a white rounded card, dark or coloured covers lose their background entirely
  if (appPlates.has(file)) return Promise.resolve(appPlates.get(file));
  return new Promise((res) => {
    const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => {
      try {
        const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, S, S);
        const d = x.getImageData(0, 0, S, S).data, px = (i, j) => (j * S + i) * 4, k0 = px(4, 4), bg = [d[k0], d[k0 + 1], d[k0 + 2]];
        const dist = (k) => Math.abs(d[k] - bg[0]) + Math.abs(d[k + 1] - bg[1]) + Math.abs(d[k + 2] - bg[2]);
        let x0 = S, y0 = S, x1 = 0, y1 = 0;
        for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (dist(px(i, j)) > 70) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
        if (x1 <= x0 || y1 <= y0) return res('');
        const light = (bg[0] * 0.3 + bg[1] * 0.59 + bg[2] * 0.11) > 190;
        const pad = Math.round(Math.max(x1 - x0, y1 - y0) * (light ? 0.2 : 0.04)), cx0 = Math.max(0, x0 - pad), cy0 = Math.max(0, y0 - pad), cw = Math.min(S, x1 + pad) - cx0, ch = Math.min(S, y1 + pad) - cy0;
        const o = document.createElement('canvas'); o.width = cw; o.height = ch; const y = o.getContext('2d', { willReadFrequently: true });
        if (light) { y.beginPath(); y.roundRect(0, 0, cw, ch, Math.min(cw, ch) * 0.14); y.clip(); y.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`; y.fillRect(0, 0, cw, ch); y.drawImage(c, cx0, cy0, cw, ch, 0, 0, cw, ch); }
        else {
          y.drawImage(c, cx0, cy0, cw, ch, 0, 0, cw, ch);
          const q = y.getImageData(0, 0, cw, ch), e = q.data;
          for (let i = 0; i < e.length; i += 4) { const dd = Math.abs(e[i] - bg[0]) + Math.abs(e[i + 1] - bg[1]) + Math.abs(e[i + 2] - bg[2]); e[i + 3] = Math.max(0, Math.min(255, Math.round((dd - 24) * 255 / 70))); }
          y.putImageData(q, 0, 0);
        }
        const u = o.toDataURL('image/png'); appPlates.set(file, u); res(u);
      } catch (e) { res(''); }
    }; im.onerror = () => res(''); im.src = 'ctheme://img/' + file;
  });
}
// v972: every game's logo, wide art and cut-down title are fetched in the background so switching never waits
let prewarmRun = 0;
function prewarmHeroes() {
  const run = ++prewarmRun, list = (games || []).slice();
  list.forEach((g, i) => setTimeout(() => { if (run === prewarmRun) try { loadHero(g); } catch {} }, 300 + i * 120));
  const pass = () => { if (run !== prewarmRun) return; for (const g of list) { try {
      const l = logoMap.get(g.id); if (l) trimLogo('ctheme://img/' + l, /^2357570$/.test(String(g.steamId)));
      const h = heroMap.get(g.id); if (h) { const im = new Image(); im.src = 'ctheme://img/' + h; }
      const q = sqMap.get(g.id); if (q) { const im = new Image(); im.src = 'ctheme://img/' + q; } } catch {} } };
  [list.length * 120 + 1200, list.length * 120 + 4000, list.length * 120 + 9000].forEach((d) => setTimeout(pass, d));
}
const refreshHeroFor = (id) => { heroKey = ''; const g = games.find((x) => x.id === id); if (g) setHero(g); };
function applyAvatars() {
  document.querySelectorAll('[data-avf]').forEach((el) => { const f = el.dataset.avf, ok = /^avatar-[a-z0-9]+\.jpg$/.test(f || ''); el.classList.toggle('has', ok); el.style.backgroundImage = ok ? `url("ctheme://img/${f}")` : ''; });
  const f = settings.avatarFile, ok = typeof f === 'string' && /^avatar-[a-z0-9]+\.jpg$/.test(f);
  document.querySelectorAll('[data-av]').forEach((el) => { el.classList.toggle('has', ok); el.style.backgroundImage = ok ? `url("ctheme://img/${f}")` : ''; });
}
function applyCovers() {
  try { applyAchBg(); } catch {}
  document.querySelectorAll('[data-img]').forEach((el) => {
    const u = el.dataset.sq || el.dataset.img;   // a square Xbox cover (data-sq) always wins over the tall Steam poster that arrives later
    if (!/^(https:\/\/(media\.rawg\.io|cdn[12]\.(epicgames|unrealengine)\.com)\/|ctheme:\/\/img\/)/.test(u)) return;
    el.style.backgroundImage = (el.classList.contains('xart') || el.classList.contains('th')) ? `url("${u}")` : `linear-gradient(to top, rgba(8,10,20,.9) 12%, rgba(8,10,20,.04) 70%), url("${u}")`;
    if (!el.dataset.sq && !el.classList.contains('xart') && !el.classList.contains('th') && (el.classList.contains('xn') || el.classList.contains('lcover') || el.classList.contains('lt')) && el.getBoundingClientRect().width > 0) {   // no square cover yet: show the whole picture (never cut off) until the real square arrives
      el.style.backgroundImage = `linear-gradient(to top, rgba(8,10,20,.9) 12%, rgba(8,10,20,.04) 70%), url("${u}")`; el.style.backgroundSize = '100% 100%, contain'; el.style.backgroundRepeat = 'no-repeat'; el.style.backgroundPosition = 'center'; el.style.backgroundColor = '#0b0e18'; el.style.setProperty('--art', `url("${u}")`); return;
    }
    el.style.backgroundSize = 'cover'; el.style.backgroundPosition = 'center'; el.style.setProperty('--art', `url("${u}")`);
  });
  document.querySelectorAll('[data-hue]').forEach((el) => {   // games without art get their own color instead
    const h = Number(el.dataset.hue) || 0;
    el.style.backgroundImage = `linear-gradient(150deg, hsl(${h} 52% 32%), hsl(${h} 50% 15%))`;
  });
}
function animateIn(sel) {   // staggered entrance for a group of elements (skipped when animations are off)
  document.querySelectorAll(sel).forEach((el, i) => { el.style.setProperty('--i', Math.min(i, 26)); el.classList.add('an'); });
}

let trWatch = null, trTry = 0;
async function playTrailer() {
  if (gameMute) return;   // one file: play it. Two files (picture and sound): feed both into a single player so they stay perfectly together
  const v = document.querySelector('.trvid[data-trailer]'), au = document.querySelector('.tra[data-trailer]'); if (!v) return;
  v.onplaying = () => SND.hush(!v.muted); v.onerror = v.onpause = v.onended = () => SND.hush(false);
  clearInterval(trWatch); let lastT = -1, still = 0;   // if the picture or sound ever sticks or loops over the first moments, start the trailer again from the top
  trWatch = setInterval(() => { if (screen !== 'trailer' || gameMute) return clearInterval(trWatch); if (v.paused || v.ended) return; if (Math.abs(v.currentTime - lastT) < 0.05) { if (++still >= 3) { clearInterval(trWatch); trTry++; if (trTry < 4) playTrailer(); } } else { still = 0; lastT = v.currentTime; } }, 600);
  const start = () => { v.volume = 0.8; v.play().catch(() => { v.muted = true; v.play().catch(() => {}); }); };
  if (!au || !TRAILER_OK.test(au.dataset.trailer) || !window.MediaSource) { v.src = 'ctheme://img/' + trFile; if (au) { v.muted = false; } start(); return; }
  const token = trFile; let ms;
  try {
    ms = new MediaSource(); v.muted = false; v.src = URL.createObjectURL(ms);
    await new Promise((res, rej) => { ms.addEventListener('sourceopen', res, { once: true }); setTimeout(() => rej(new Error('open')), 5000); });
    const vt = `video/mp4; codecs="${trV || 'avc1.640028'}"`, at = `audio/mp4; codecs="${trA || 'mp4a.40.2'}"`;
    if (!MediaSource.isTypeSupported(vt) || !MediaSource.isTypeSupported(at)) throw new Error('codec');
    const vsb = ms.addSourceBuffer(vt), asb = ms.addSourceBuffer(at);
    const feed = async (sb, file) => {
      const buf = await (await fetch('ctheme://img/' + file)).arrayBuffer();
      for (let o = 0; o < buf.byteLength; o += 1 << 21) {
        if (screen !== 'trailer' || trFile !== token) return;
        await new Promise((res) => { sb.addEventListener('updateend', res, { once: true }); try { sb.appendBuffer(buf.slice(o, o + (1 << 21))); } catch (e) { res(); } });
        if (o === 0 && sb === vsb) start();
      }
    };
    await Promise.all([feed(vsb, trFile), feed(asb, au.dataset.trailer)]);
    if (screen === 'trailer' && trFile === token && ms.readyState === 'open') ms.endOfStream();
  } catch (e) {   // the player could not take it: fall back to picture only
    if (screen === 'trailer' && trFile === token) { v.removeAttribute('src'); v.muted = true; v.src = 'ctheme://img/' + trFile; start(); }
  }
}
function show(name, focusIndex = 0) {
  SND.quiet(260); SND.hush(false);
  closeMenu(true); editing = null; if (name !== 'binds') testing = false; if (guideOn) closeGuide(true);
  if (name === 'controller' && screen !== 'binds') ctlFrom = screen;
  if (name === 'settings' && screen !== 'settings') setCat = 'general';
  const main = $('#screen'), changed = !shown || name !== screen;
  if (changed && shown) ghostOut(main, name);
  const fwd = !shown || DEPTH[name] >= DEPTH[screen];
  const toFromGame = changed && shown && (name === 'game' || screen === 'game' || ((name === 'ach' || name === 'achgame') && (screen === 'ach' || screen === 'achgame')));
  if (changed && screen === 'library' && name !== 'game' && name !== 'library') { libFilter = ''; libScope = 0; }   // leaving the library clears the search
  screen = name; shown = true;
  main.classList.toggle('xf', !!toFromGame);   // opening or leaving a game page is a quick clean crossfade
  main.classList.toggle('noanim', !changed);
  main.classList.toggle('fsp', name === 'settings' || name === 'controller' || name === 'binds' || name === 'tools');
  document.body.classList.toggle('fsb', name === 'controller' || name === 'binds');   // no game art behind these pages, not even for a moment
  if (changed) { main.classList.remove('enter-fwd', 'enter-back'); void main.offsetWidth; main.classList.add(fwd ? 'enter-fwd' : 'enter-back'); }
  document.body.classList.remove('scrolled');
  const keepSc = !changed ? [...main.querySelectorAll('.r1, .r2, .hrow, .hscroll, .dash, .r3, .storepg, .gpage, .achpg, .ascr, .lgrid, .grid')].map((e) => [e.scrollLeft, e.scrollTop]) : null;
  main.innerHTML = SCREENS[name].html();
  if (keepSc) { const reset = () => main.querySelectorAll('.r1, .r2, .hrow, .hscroll, .dash, .r3, .storepg, .gpage, .achpg, .ascr, .lgrid, .grid').forEach((e, i) => { const s = keepSc[i]; if (s) { e.scrollLeft = s[0]; e.scrollTop = s[1]; } }); reset(); setTimeout(reset, 0); }   // a redraw on the same screen (new cover arrived, a setting changed) never throws you back to the start
  $('#hints').innerHTML = renderHints(SCREENS[name].hints);
  if (name === 'apps' || name === 'home') appsBackground();
  if (name === 'game') refreshRun();
  
  if (name === 'store' && !storeData) loadStore();
  if (name === 'trailer' && trFile) { trTry = 0; setTimeout(() => playTrailer(), 60); }
  if (name === 'spotify') spPaint();
  if (name === 'ytube') ytPaint();
  applyCovers(); applyAvatars(); applyDynamic(changed); if (changed) stagger(); if (toFromGame) document.querySelectorAll('.topbar .an, #screen .an').forEach((e) => e.classList.remove('an')); tick();
  if (name === 'binds') { mountPad(undefined, true); glowKick(2400); }   // the controller picture must be put back every time the tab changes, not just when the screen opens
  if (changed) {
    if (name === 'settings') animateIn('.st-c, .st-g > *');
    else if (name === 'controller') animateIn('.ctl-h, .ctl-u, .ctl-n, .ctl-pad, .ctl-conf, .ctl-b');
    else if (name === 'binds') { animateIn('.mp-tb, .mp-view .mp-vb, .mp-b, .mp-rs, .mp-st .st-t'); document.querySelectorAll('.mp-b').forEach((b, i) => b.style.setProperty('--i', i)); }
    else if (name === 'ach') { if (!achData || !achData.ok) { loadAch().then(() => { if (screen === 'ach') show('ach'); }); } }
    else if (name === 'home') { npPaint(); loadMsIcon(); applyMsIcon(); loadAch(); animateIn('.topbar .prof, .topbar .ti, .xnh, .xn, .xnw, .xr2n > .w2'); }
    else animateIn('#screen h1, #screen .apsub, #screen .agrid > *, #screen .pcard, #screen .wprev, #screen .ltop, #screen .lbot, #screen .lgrid .lt, #screen .gxp > *, #screen .list > *, #screen .grid > *, #screen .bar > *');
  }
  document.body.classList.toggle('is-home', name === 'home');
  if (name !== 'home') document.body.classList.remove('hero-name-off');
  document.body.classList.toggle('hs-classic', settings.homeStyle === 'classic');
  document.body.classList.toggle('hero-on', name === 'home' || name === 'library' || name === 'game');
  document.body.classList.toggle('lib', name === 'library');
  document.body.classList.toggle('is-game', name === 'game');
  document.body.classList.toggle('wp', ['apps', 'library', 'ach', 'achgame', 'profile', 'avatars', 'store', 'storeitem', 'news', 'widgets', 'catalog', 'platform', 'apppick', 'settings', 'caps', 'sysinfo', 'notifs', 'weather', 'quick', 'tools'].includes(name));
  if (name === 'apps' || name === 'library' || name === 'ach' || name === 'achgame') appMidnight(true);   // same wallpaper as the dashboard
  if (name === 'home') appMidnight(false);   // the dashboard is the midnight scene
  if (name === 'home' || name === 'library') { const bt = main.querySelector('.xn[data-game], .xq[data-game], .bigtile'); setHero(bt ? gameOf(bt) : lastHero, true); loadPosters(); }
  if (name === 'game') { setHero(games.find((x) => x.id === gameId) || lastHero, true); const gi = gameId; setTimeout(() => { if (screen === 'game' && gameId === gi) startTrailer(); }, 1800); }   // the art shows first, then the trailer fades in over it
  const els = document.querySelectorAll('[data-nav]');
  let target = els[Math.min(focusIndex, els.length - 1)] || els[0];
  if (!focusIndex && SCREENS[name].focus) target = main.querySelector(SCREENS[name].focus) || target;
  if (name === 'library' && changed && libBack && screen === 'library') {   // back from a game: the same game is selected and the grid is exactly where it was (no jump to the top)
    const lb = libBack; libBack = null; const lg = main.querySelector('.lgrid'), me = lg && [...lg.querySelectorAll('[data-game]')].find((e) => e.dataset.game === lb.id);
    if (me) { target = me; const put = () => { lg.scrollTop = lb.top; }; put(); setTimeout(put, 0); requestAnimationFrame(() => { put(); const ge = games.find((x) => x.id === lb.id); if (ge && screen === 'library') setHero(ge, true); glowKick(700); }); }
  }
  if (name === 'home' && focusIndex && target) { try { target.scrollIntoView({ block: 'nearest', inline: 'center' }); homeScroll(target); } catch {} }   // coming back from a game page: the shelf you were on stays on screen
  if (name === 'ach' && focusIndex) { const c = main.querySelector(`[data-ach="${achIdx}"]`); if (c) target = c; }
  target?.focus({ preventScroll: true });
  if (name === 'ach' && focusIndex && target) { const sc = main.querySelector('.ascr'); if (sc && achSc > 0) sc.scrollTop = achSc; else if (sc) { const cr = sc.getBoundingClientRect(), r = target.getBoundingClientRect(), pv = target.previousElementSibling, top = (pv && pv.classList.contains('agh') ? pv.getBoundingClientRect().top : r.top) - cr.top + sc.scrollTop; sc.scrollTop = Math.max(0, Math.min(sc.scrollHeight - sc.clientHeight, top - sc.clientHeight * 0.3)); } }
}

/* ---------- the glowing highlight: one soft white frame that glides to whatever is selected ---------- */
const glow = document.createElement('div'); glow.id = 'glow'; document.body.appendChild(glow);
let glowV = { x: 0, y: 0, w: 0, h: 0 }, glowR = null, glowUntil = 0, glowRun = false, glowT = null;
function glowTarget() { const a = document.activeElement; return !introOn && !launching && a && a.matches && a.matches('[data-nav]') && document.body.contains(a) && !a.closest('#menu') && !(psOn() && !gdRow && a.closest('#guide')) ? a : null; }
let glowLast = 0;
function glowTick(now = performance.now()) {
  document.body.classList.toggle('glowing', !introOn);
  const t = glowTarget();
  if (!t) { glow.classList.remove('on'); glowRun = false; glowR = null; return; }
  const dt = Math.min(48, now - (glowLast || now)); glowLast = now;
  const r = t.getBoundingClientRect(), tg = { x: r.left, y: r.top, w: r.width, h: r.height };
  if (!glowR || !glow.classList.contains('on') || !settings.motion) { glowR = { ...tg }; glowV = { x: 0, y: 0, w: 0, h: 0 }; }
  else if (screen === 'home') { glowR = { ...tg }; glowV = { x: 0, y: 0, w: 0, h: 0 }; }   // the cards themselves glide here, so the frame sticks to them
  else { const w = 46, ex = Math.exp(-w * dt / 1000), ds = dt / 1000; for (const q of ['x', 'y', 'w', 'h']) { const e = glowR[q] - tg[q], v = glowV[q], j = v + w * e; glowR[q] = tg[q] + (e + j * ds) * ex; glowV[q] = (v - w * j * ds) * ex; } }   // the frame glides between items like a damped spring: it speeds up and settles softly
  if (t !== glowT) { glowT = t; try { glow.style.borderRadius = getComputedStyle(t).borderRadius; } catch {} }
  glow.style.transform = `translate3d(${glowR.x}px, ${glowR.y}px, 0)`; glow.style.width = glowR.w + 'px'; glow.style.height = glowR.h + 'px';
  { let L = Math.max(0, -glowR.x), R = Math.max(0, glowR.x + glowR.w - innerWidth); const bx = t.closest('.r1, .r2, .hrow, .hscroll'); if (bx) { const cb = bx.getBoundingClientRect(); L = Math.max(L, cb.left - glowR.x); R = Math.max(R, glowR.x + glowR.w - cb.right); }
    let T = 0, B = 0; const gx = t.closest('.lgrid, .grid, .agrid, .ascr'); if (gx) { const cb = gx.getBoundingClientRect(), ex = gx.classList.contains('ascr') ? 12 : 0; T = Math.max(0, cb.top - ex - glowR.y); B = Math.max(0, glowR.y + glowR.h - (cb.bottom + ex)); }   // the frame is cut at the grid's edge, so it never floats over the top bar or the Library label while the grid scrolls
    glow.style.clipPath = (L > 0.5 || R > 0.5 || T > 0.5 || B > 0.5) ? `inset(${T}px ${Math.max(0, R)}px ${B}px ${Math.max(0, L)}px)` : 'none'; if (L + R >= glowR.w - 1 || T + B >= glowR.h - 1) glow.style.opacity = '0'; else glow.style.opacity = ''; }   // never draw the frame outside the row or off the screen
  glow.classList.add('on');
  if (Math.abs(tg.x - glowR.x) + Math.abs(tg.y - glowR.y) + Math.abs(tg.w - glowR.w) + Math.abs(tg.h - glowR.h) < 0.6 && performance.now() > glowUntil) { glowRun = false; glowLast = 0; return; }
  requestAnimationFrame(glowTick);
}
function glowKick(ms = 700) { glowUntil = performance.now() + ms; if (!glowRun) { glowRun = true; requestAnimationFrame(glowTick); } }
document.addEventListener('focusin', (e) => { const t = e.target; if (t && t.closest && screen === 'home' && t.matches && t.matches('[data-nav]')) { try { const rs = homeRows(), ri = rs.findIndex((r) => r.includes(t)); if (ri >= 0) homeMem[ri] = rs[ri].indexOf(t); } catch {} } if (t && t.closest && screen === 'home' && t.closest('.topbar, .r1, .r2')) { const d = document.querySelector('.dash'); if (d && d.scrollTop > 0) glideTo(d, null, 0, 150); }
  if (t && t.matches && t.matches('[data-nav]')) { SND.play('move'); glow.style.borderRadius = getComputedStyle(t).borderRadius; glowT = t; glowR = null; glowKick(); } });
document.addEventListener('scroll', () => glowKick(350), true);
window.addEventListener('resize', () => glowKick(300));
let saveT = 0, saveN = 0;
function setLocal(patch) {   // change a setting instantly (bars and values animate), save a moment later
  Object.assign(settings, patch);
  applySettings(); refreshSettingsUI();
  clearTimeout(saveT); const n = ++saveN;
  saveT = setTimeout(async () => { const r = await api.setSettings(settings); if (n === saveN) settings = r; }, 300);
}
function adjust(el, dir, wrap) {
  const k = el.dataset.adjust;
  if (k === 'accent') { const i = ACCENTS.indexOf(settings.accent); return setLocal({ accent: ACCENTS[(i + dir + ACCENTS.length) % ACCENTS.length] }); }
  if (SLIDERS[k]) { setLocal({ [k]: stepValue(SLIDERS[k], settings[k], dir, wrap) }); if (k === 'sfxVol') SND.play('select'); }
}
function refreshSettingsUI() {
  if (screen !== 'settings' && screen !== 'binds') return;
  document.querySelectorAll('[data-slider]').forEach((el) => { el.style.width = pct(el.dataset.slider) + '%'; });
  document.querySelectorAll('[data-val]').forEach((el) => { const k = el.dataset.val; if (el.dataset.on !== undefined) el.dataset.on = settings[k] !== false ? '1' : '0'; el.textContent = k === 'motion' || k === 'intro' || k === 'sfx' || k === 'music' ? (settings[k] !== false ? 'On' : 'Off') : SLIDERS[k].fmt(settings[k]); });
  document.querySelectorAll('.chip').forEach((el) => el.classList.toggle('sel', el.dataset.bg === settings.accent));
}
function applyDynamic(animate) {   // colors and bar widths are set from script (the page's security rules block inline styles)
  document.querySelectorAll('[data-wc]').forEach((el) => { const c = el.dataset.wc; if (/^#[0-9a-f]{6}$/i.test(c) && !el.dataset.img) el.style.backgroundImage = `linear-gradient(155deg, color-mix(in srgb, ${c} 30%, #0b1020), #04060d 90%)`; });
  document.querySelectorAll('[data-ah]').forEach((el) => { el.style.setProperty('--ac', `hsl(${Number(el.dataset.ah) || 0} 72% 58%)`); });
  document.querySelectorAll('[data-w]').forEach((el) => { const v = Number(el.dataset.w); if (v >= 0 && v <= 100) el.style.width = v + '%'; });
  document.querySelectorAll('[data-col]').forEach((el) => { if (/^#[0-9a-f]{6}$/i.test(el.dataset.col)) el.style.background = el.dataset.col; });
  document.querySelectorAll('[data-flex]').forEach((el) => { el.style.flex = String(Number(el.dataset.flex) || 1); });
  document.querySelectorAll('[data-bg]').forEach((el) => { if (/^#[0-9a-f]{6}$/i.test(el.dataset.bg)) el.style.background = el.dataset.bg; });
  const fills = document.querySelectorAll('[data-slider]');
  if (!animate) return fills.forEach((el) => { el.style.width = pct(el.dataset.slider) + '%'; });
  fills.forEach((el) => { el.style.width = '0%'; });
  requestAnimationFrame(() => requestAnimationFrame(() => fills.forEach((el) => { el.style.width = pct(el.dataset.slider) + '%'; })));
}
function stagger() {
  document.querySelectorAll('#screen .row > *, #screen .list > *, #screen .grid > *, #screen .minis > *, #screen .wides > *, #screen .hrow > *, #screen .bigwrap, #screen .sh').forEach((el, i) => { el.style.animationDelay = Math.min(i, 10) * 30 + 'ms'; });
}
function ghostOut(main, name) {   // the old screen fades away while the new one slides in
  const g = main.cloneNode(true);
  g.removeAttribute('id'); g.setAttribute('inert', '');
  g.className = 'ghost ' + (DEPTH[name] >= DEPTH[screen] ? 'out-fwd' : 'out-back') + (name === 'game' || screen === 'game' || ((name === 'ach' || name === 'achgame') && (screen === 'ach' || screen === 'achgame')) ? ' xfo' : '');
  const r = main.getBoundingClientRect();
  g.style.left = r.left + 'px'; g.style.top = r.top + 'px'; g.style.width = r.width + 'px'; g.style.height = r.height + 'px';
  document.body.appendChild(g);
  { const a = main.querySelectorAll('.ascr, .gpage, .storepg, .lgrid'), b = g.querySelectorAll('.ascr, .gpage, .storepg, .lgrid'); a.forEach((e, i) => { if (!b[i]) return; b[i].scrollTop = e.scrollTop; if (e.scrollTop > 0 && Math.abs(b[i].scrollTop - e.scrollTop) > 2) { b[i].style.overflow = 'hidden'; [...b[i].children].forEach((k) => { k.style.transform = `translateY(${-e.scrollTop}px)`; }); } }); }   // the fading copy keeps its scroll position (set once it is in the page, where it can scroll)
  setTimeout(() => g.remove(), 280);
}
let shown = false;
let introEnd = 0;
function activate(el) {
  if (signPressWait) return;
  if (guideOn && psOn() && psCust) { psGrab = !psGrab; SND.play('select'); renderGuide(); return; }
  if (guideOn && psOn() && !gdRow) { if (guideTab === 'home') { guideAct('home'); return; } psEnterRow(); return; }   // on the icon row A opens the tab, never the page behind the menu
  if (guideOn && psOn() && el && !(el.closest && el.closest('#guide'))) return;   // nothing outside the menu can be pressed while it is up
  if (el && el.dataset && el.dataset.rm !== undefined && rm !== null) { SND.play('select'); rmAct(); return; }
  if (el && el.dataset && el.dataset.pc !== undefined && pc) { SND.play('select'); pcAct(el); return; }   // the profile creation page always answers A
  if (el && !(el.closest && el.closest('#osk'))) SND.play('select');
  if (!el || (introOn && !(introStage === 1 && el.closest && (el.closest('#intro') || el.closest('#menu') || el.closest('#osk')))) || Date.now() - introEnd < 700) return;   // the button press that closed the startup screen must not also click something behind it
  if (el.classList) { el.classList.add('pressed'); setTimeout(() => el.classList.remove('pressed'), 170); }
  if (el.dataset.key !== undefined) oskKey(el.dataset.key);
  else if (window.xtraAct && xtraAct(el)) { /* v813 */ }
  else if (el.dataset.go === 'library') api.libGet().then((g) => { games = g; show('library'); });
  else if (el.dataset.ubi && window.__ubiAct) window.__ubiAct(el.dataset.ubi);
  else if (el.dataset.gd) guideAct(el.dataset.gd);
  else if (el.dataset.cat) { setCatTo(el.dataset.cat); const t = document.querySelector('.st-r [data-nav]'); if (t) t.focus({ preventScroll: true }); }
  else if (el.dataset.btab) { bindTabK = el.dataset.btab; show('binds'); const f = document.querySelector('[data-nav]'); if (f) f.focus({ preventScroll: true }); }
  else if (el.dataset.mpb) mapPick(el);
  else if (el.dataset.prof !== undefined) switchPadProfile(Number(el.dataset.prof));
  else if (el.dataset.vib) rumble(el.dataset.vib);
  else if (el.dataset.act === 'testgo') { testing = !testing; show('binds'); const t = document.querySelector('[data-act="testgo"]'); if (t) t.focus({ preventScroll: true }); }
  else if (el.dataset.act === 'calibrate') api.calibrate();
  else if (el.dataset.mview) {
    const to = el.dataset.mview, d = document.querySelector('.mp-d'); if (to === mapView || flipping || !d) return;
    flipping = true;
    document.querySelectorAll('.mp-vb[data-mview]').forEach((e) => e.classList.toggle('cur', e.dataset.mview === to));
    const swap = () => {   // only the labels change; the 3D controller keeps turning on its own
      mapView = to; d.classList.toggle('back', to === 'back'); d.classList.add('swapped');
      const had = d.contains(document.activeElement);
      d.querySelectorAll('.mp-b').forEach((b) => b.remove());
      d.insertAdjacentHTML('beforeend', Object.keys(to === 'back' ? MPBACK : MP).map(mpBox).join(''));
      if (had || !document.activeElement || document.activeElement === document.body) { const f = d.querySelector('[data-nav]') || document.querySelector('[data-nav]'); if (f) f.focus({ preventScroll: true }); }
    };
    if (!settings.motion || !window.PAD3D || !PAD3D.ok) { if (window.PAD3D) { if (PAD3D.ok) PAD3D.set(to === 'back'); else mountPad(to === 'back'); } swap(); flipping = false; }
    else {
      SND.play('page'); d.classList.add('flipping');
      d.querySelectorAll('.mp-b').forEach((b) => b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' }));
      PAD3D.flip(to === 'back', 1500, () => {
        swap();
        d.querySelectorAll('.mp-b').forEach((b) => b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' }));
        flipping = false; d.classList.remove('flipping');
      });
    }
  }
  else if (el.dataset.act && el.dataset.act.startsWith('npc:')) npAct(el.dataset.act.slice(4));
  else if (el.dataset.act === 'ctlmore') ctlMenu(el);
  else if (el.dataset.act === 'ctlsticks') { bindTabK = 'sticks'; show('binds'); }
  else if (el.dataset.sp) spAct(el.dataset.sp);
  else if (el.dataset.yt) ytAct(el.dataset.yt);
  else if (el.dataset.go) { if (el.dataset.go === 'binds') bindTabK = 'console'; show(el.dataset.go); }
  else if (el.dataset.menu) menuAction(el.dataset.menu);
  else if (el.dataset.gact) gameAct(el.dataset.gact);
  else if (el.dataset.game) openGame(el.dataset.game);
  else if (el.dataset.act === 'browser') openBrowser();
  else if (el.dataset.app) openApp(el.dataset.app);
  else if (el.dataset.act === 'addapp') addApp();
  else if (el.dataset.trail !== undefined) openTrailer(Number(el.dataset.trail));
  else if (el.dataset.store !== undefined) openStore(el.dataset.store);
  else if (el.dataset.act === 'storesearch') storeSearch();
  else if (el.dataset.act === 'storeclear') { storeRes = null; storeQ = ''; show('store'); }
  else if (el.dataset.act === 'msstore') msStore(storeQ);
  else if (el.dataset.act === 'msopen') msStore('');
  else if (el.dataset.act === 'sitrailer') { if (storeCur && storeCur.trailer) openTrailerObj(storeCur.trailer, 'storeitem'); }
  else if (el.dataset.act === 'sisteam') { if (storeCur) { rememberReturn(); note('Opening Steam. Press the Xbox button to come back.'); api.openWeb('https://store.steampowered.com/app/' + storeCur.id); } }
  else if (el.dataset.act === 'sims') { if (storeCur) msStore(storeCur.name); }
  else if (el.dataset.ach !== undefined) { { const q = document.querySelector('.ascr'); if (q) achSc = q.scrollTop; } achIdx = Number(el.dataset.ach) || 0; achCur = achData.list[achIdx]; achDet = null; show('achgame'); api.achDetail(achCur.appid).then((r) => { achDet = r || { ok: false }; if (screen === 'achgame') { show('achgame'); document.querySelectorAll('.aitem').forEach((e, i) => { try { e.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: Math.min(i, 12) * 28, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }); } catch {} }); } }).catch(() => {}); }
  else if (el.dataset.news !== undefined) { newsIdx = Number(el.dataset.news) || 0; show('news'); }
  else if (el.dataset.pick !== undefined) pickAdd(Number(el.dataset.pick));
  else if (el.dataset.act === 'libmenu') openLibMenu(document.activeElement);
  else if (el.dataset.wedit) openWidgetMenu(el, el.dataset.wedit);
  else if (el.dataset.act === 'wadd') openAddMenu(el);
  else if (el.dataset.act === 'wreset') widgetAct('wreset');
  else if (el.dataset.act === 'widget') openWidget(el.dataset.wid);
    else if (el.dataset.act === 'friends') { openGuide(); guideTab = 'friends'; guidePage = 'main'; renderGuide(); loadFriends(true); }
  else if (el.dataset.sgu !== undefined) signPick(el.dataset.sgu);
  else if (el.dataset.sgadd !== undefined) signAdd();
  else if (el.dataset.pc !== undefined) pcAct(el);
  else if (el.dataset.sgpower !== undefined) quitConsole();
  else if (el.dataset.act === 'infoall') getInfoAll();
  else if (el.dataset.act === 'trailersdelyes') { api.trailersClearAll().then((x) => { if (x && x.games) { games = x.games; if (screen === 'library' || screen === 'game') show(screen, focusIdx()); note(x.count + ' trailers deleted. You can download them again now.'); } }); }
  else if (el.dataset.act === 'trailersyt') downloadAllTrailers();
  else if (el.dataset.act === 'trailersst') { note('Downloading trailers from Steam...'); api.trailersAuto().then((r) => { if (r && r.games) { games = r.games; if (screen === 'library' || screen === 'game') show(screen, focusIdx()); note(r.count + ' trailers downloaded' + (r.missing ? ', ' + r.missing + ' had none' : '') + '.'); } else if (r && r.error) note(r.error); }); }
  else if (el.dataset.act === 'addfolder') api.libAddFolder().then((g) => { if (g) { games = g; show('library'); note('Found ' + g.length + ' games.'); } });
  else if (el.dataset.act === 'scan') rescan();
  else if (el.dataset.act === 'quit') window.consoleApi.quit();
  else if (el.dataset.act === 'mouse') window.consoleApi.mouseMode(true);
  else if (el.dataset.act === 'motion') setLocal({ motion: !settings.motion });
  else if (el.dataset.act === 'intro') setLocal({ intro: !settings.intro });
  else if (el.dataset.act === 'introenh') { setLocal({ introEnhance: settings.introEnhance !== true }); const sm = el.querySelector('small'); if (sm) sm.textContent = settings.introEnhance === true ? 'On' : 'Off'; note('Sharpening ' + (settings.introEnhance === true ? 'on for the next start.' : 'off.')); }
  else if (el.dataset.act === 'sfx') { setLocal({ sfx: settings.sfx === false }); if (settings.sfx !== false) SND.play('on'); }
  else if (el.dataset.act === 'music') { setLocal({ music: settings.music === false }); SND.unlock(); }
  else if (el.dataset.act === 'introvideo') pickIntroVideo();
  else if (el.dataset.act === 'introvideorm') clearIntroVideo();
  else if (el.dataset.act === 'signbg') pickIntroVideo('bg');
  else if (el.dataset.act === 'signbgrm') clearIntroVideo('bg');
  else if (el.dataset.act === 'introvideops') pickIntroVideo('ps');
  else if (el.dataset.act === 'introvideopsrm') clearIntroVideo('ps');
  else if (el.dataset.act === 'padtype') { const i = focusIdx(), o = ['auto', 'xbox', 'ps'], n = o[(o.indexOf(settings.padType || 'auto') + 1) % 3]; setLocal({ padType: n }); setPadKind(); SND.play('select'); show('settings', i); }
  else if (el.dataset.act === 'pname') editName();
  else if (el.dataset.act === 'pavatar') { avFrom = screen === 'settings' ? 'settings' : 'profile'; show('avatars'); }
  else if (el.dataset.act === 'avown') pickAvatar();
  else if (el.dataset.act === 'avset') setGamerpic(Number(el.dataset.k) || 0);
  else if (el.dataset.act === 'pavatarrm') clearAvatar();
  else if (el.dataset.act === 'search') padSearch();
  else if (el.dataset.act === 'notinstalled') { libFilter = ''; libScope = 2; show('library'); }
  else if (el.dataset.act === 'resumefix') { silenceAll(true); resumeSmooth(true); }
  else if (el.dataset.act === 'resume') { silenceAll(true); resumeSmooth(); }
  else if (el.dataset.act === 'closegame') closeRunning();
  else if (el.dataset.bind) startCapture(el.dataset.bind);
  else if (el.dataset.act === 'resetbinds') { change({ binds: DEF_BINDS_UI, mbinds: DEF_MBINDS_UI }); note('Buttons restored to default.'); }
  else if (el.dataset.act === 'clearsearch') { libFilter = ''; libScope = 0; show('library'); }
  else if (el.dataset.act === 'find') findGame();
  else if (el.dataset.act === 'importlist') importList();
  else if (el.dataset.act === 'art') getArt();
  else if (el.dataset.act === 'igdbid') openOsk('IGDB client ID (from dev.twitch.tv)', '').then((t) => { if (t !== null) change({ igdbId: t.trim() }); });
  else if (el.dataset.act === 'igdbsecret') openOsk('IGDB client secret', '').then((t) => { if (t !== null) change({ igdbSecret: t.trim() }); });
  else if (el.dataset.act === 'sgdbkey') openOsk('SteamGridDB key (32 characters)', '').then((t) => { if (t !== null) change({ sgdbKey: t.trim() }); });
  else if (el.dataset.act === 'rawgkey') openOsk('RAWG key (32 characters)', '').then((t) => { if (t !== null) change({ rawgKey: t.trim() }); });
  else if (el.dataset.res !== undefined) { pending = { kind: 'one', entry: catResults[Number(el.dataset.res)] }; show('platform'); }
  else if (el.dataset.plat) choosePlatform(el.dataset.plat);
  else if (el.dataset.act === 'acct') accountAction(el.dataset.p);
  else if (el.dataset.act === 'setupguide') { try { api.guideOpen(); } catch {} note('The setup guide is on your second monitor.'); }
  else if (el.dataset.act === 'spotifysetup') { sp.view = 'home'; sp.hist = []; show('spotify'); }
  else if (el.dataset.act === 'steamkey') openOsk('Steam API key (32 characters)', '').then((t) => { if (t !== null) change({ steamKey: t.trim() }); });
  else if (el.dataset.act === 'theme') { themeOpen = !themeOpen; paneRefresh(); if (themeOpen) { const o = document.querySelector('.th-o.on') || document.querySelector('.th-o'); if (o) o.focus({ preventScroll: false }); } }
  else if (el.dataset.act === 'settheme') { themeOpen = false; settings = { ...settings, theme: el.dataset.id }; paneRefresh(); window.consoleApi.setSettings(settings).then((s) => { settings = s; applySettings(); }); }
  else if (el.dataset.act === 'homestyle') { change({ homeStyle: settings.homeStyle === 'classic' ? 'new' : 'classic' }).then(() => show('settings')); }
  else if (el.dataset.act === 'fullscreen') window.consoleApi.toggleFullscreen();
  else if (el.dataset.adjust) toggleEdit(el);
}

/* ---------- focus navigation ---------- */
let lastNav = 0;
let glideRaf = 0;
const glMap = new WeakMap();
let scrollBusyT = 0;
function scrollBusy() { if (screen === 'library') return; /* v1266: the Library never switches into 'scrolling' mode, so nothing in it changes shade */ document.body.classList.add('scrolling'); clearTimeout(scrollBusyT); scrollBusyT = setTimeout(() => document.body.classList.remove('scrolling'), 160); }   // while anything glides, the costly see-through blur on the panels is paused so every frame stays fast
function glideTo(c, tx, ty, tau = 120) {   // one smooth glide per scroll box, driven like a critically damped spring: it eases into motion and out of it, and a new target just re-aims it while keeping its speed, so holding a direction never stutters
  if (!c) return;
  if (!settings.motion) { if (tx != null) c.scrollLeft = tx; if (ty != null) c.scrollTop = ty; return; }
  let st = glMap.get(c); if (!st) { st = { raf: 0 }; glMap.set(c, st); }
  if (tx != null) st.tx = Math.max(0, Math.min(c.scrollWidth - c.clientWidth, tx));
  if (ty != null) st.ty = Math.max(0, Math.min(c.scrollHeight - c.clientHeight, ty));
  if (!st.raf && ty != null && tx == null && Math.abs(c.scrollTop - st.ty) < 1) return;   // v1266: already at that spot (top or bottom edge): nothing moves, so nothing is switched into 'scrolling' mode
  st.tau = tau; if (ty != null) scrollBusy(); if (st.raf) return;
  st.px = c.scrollLeft; st.py = c.scrollTop; st.vx = 0; st.vy = 0;
  let last = performance.now();
  const step = (now) => {
    const dt = Math.min(40, now - last) / 1000; last = now; const w = 2 / (st.tau / 1000), ex = Math.exp(-w * dt); let busy = false;
    for (const [key, prop, pk, vk] of [['tx', 'scrollLeft', 'px', 'vx'], ['ty', 'scrollTop', 'py', 'vy']]) {
      if (st[key] == null) continue;
      const mx = key === 'tx' ? c.scrollWidth - c.clientWidth : c.scrollHeight - c.clientHeight; if (st[key] > mx) st[key] = Math.max(0, mx);   // the row can get shorter mid-glide (a card shrinks back): never chase a spot that no longer exists
      if (Math.abs(c[prop] - st[pk]) > 1.6) { st[pk] = c[prop]; st[vk] = 0; }   // something else moved the box (the mouse wheel, for example): carry on from where it really is
      const e = st[pk] - st[key], v = st[vk], j = v + w * e, ne = (e + j * dt) * ex, nv = (v - w * j * dt) * ex;
      if (Math.abs(ne) < 0.45 && Math.abs(nv) < 10) { c[prop] = st[key]; st[pk] = st[key]; st[vk] = 0; st[key] = null; continue; }
      st[pk] = st[key] + ne; st[vk] = nv; c[prop] = st[pk]; busy = true;
    }
    if (busy && st.ty != null) scrollBusy(); st.raf = busy ? requestAnimationFrame(step) : 0;
  };
  st.raf = requestAnimationFrame(step);
}
let rowTrk = 0;
function glideRow(el, fastTau) {   // aims the row at the card, then keeps re-aiming for a moment while the cards finish growing and shrinking, so the target never goes stale
  const ok = glideRow1(el, fastTau); if (!ok || !settings.motion) return ok;
  cancelAnimationFrame(rowTrk); const t0 = performance.now();
  const f = () => { if (document.activeElement !== el || performance.now() - t0 > 380) return; glideRow1(el, fastTau); rowTrk = requestAnimationFrame(f); };
  rowTrk = requestAnimationFrame(f); return ok;
}
function glideRow1(el, fastTau) {   // smooth sideways glide inside a row (aimed from where the row is heading, so fast presses never leave the selected card off-screen)
  const c = el.closest('.r1, .r2, .hrow, .hscroll'); if (!c || !settings.motion) return false;
  const cr = c.getBoundingClientRect(), r = el.getBoundingClientRect(), pad = cr.width * .08, st = glMap.get(c), base = st && st.tx != null ? st.tx : c.scrollLeft, sh = c.scrollLeft - base, left = r.left + sh, right = r.right + sh;
  let to = base;
  if (left < cr.left + pad) to += left - cr.left - pad; else if (right > cr.right - pad) to += right - cr.right + pad; else { if (st && st.tx != null && r.left > cr.left + pad && r.right < cr.right - pad) st.tx = c.scrollLeft; return true; }   // already comfortably on screen right now: stop any old glide instead of letting it drag the row the other way
  glideTo(c, to, null, fastTau || (performance.now() - lastNav < 260 ? 48 : 72)); return true;
}
function focusEl(el) {   // smooth scrolling keeps the selected item in view (instant while you hold a direction, so it never lags behind)
  if (!el) return;
  const now = performance.now(), fast = now - lastNav < 260; lastNav = now;
  el.focus({ preventScroll: true });
  if (glideRow(el)) return;
  const sp = el.closest('.spmain, .sprail, .storepg, .gpage, .ascr, .achpg'); if (sp) { const cr = sp.getBoundingClientRect(), r = el.getBoundingClientRect(), m = cr.height * (sp.classList.contains('spmain') || sp.classList.contains('sprail') ? .05 : .18); if (r.top < cr.top + m) glideTo(sp, null, sp.scrollTop + r.top - cr.top - m, 140); else if (r.bottom > cr.bottom - m) glideTo(sp, null, sp.scrollTop + r.bottom - cr.bottom + m, 140); return; }
  el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: settings.motion && !fast ? 'smooth' : 'auto' });
}
const achPitch = (sc) => { const it = [...sc.querySelectorAll('.avc')]; if (it.length < 2) return 0; const t0 = it[0].offsetTop, n = it.find((x) => x.offsetTop > t0 + 2); return n ? n.offsetTop - t0 : 0; };
function achFit(sc) {   // the list is exactly as tall as the whole rows that fit, so no row is ever half-cut at the top or bottom
  try {
    sc.style.flex = '1 1 0'; sc.style.height = '';
    const pitch = achPitch(sc), it = sc.querySelector('.avc'); if (!pitch || !it) return;
    const gap = pitch - it.offsetHeight, pad = parseFloat(getComputedStyle(sc).paddingTop) + parseFloat(getComputedStyle(sc).paddingBottom);
    const rows = Math.max(1, Math.floor((sc.clientHeight - pad + gap) / pitch));
    sc.style.flex = '0 0 auto'; sc.style.height = Math.round(rows * pitch - gap + pad) + 'px';
    sc.scrollTop = Math.round(sc.scrollTop / pitch) * pitch;
  } catch {}
}
function achMove(cur, dir) {   // exact rows and columns; the list scrolls by whole rows
  const sc = document.querySelector('.ascr'), g = sc && sc.querySelector('.avgrid'), items = [...document.querySelectorAll('.avc')];
  const i = items.indexOf(cur); if (!sc || !g || i < 0) return false;
  const cols = Math.max(1, getComputedStyle(g).gridTemplateColumns.split(' ').length), lastRow = Math.floor((items.length - 1) / cols);
  let n = i;
  if (dir === 'left') n = i % cols ? i - 1 : i;
  else if (dir === 'right') n = i % cols !== cols - 1 && i + 1 < items.length ? i + 1 : i;
  else if (dir === 'up') n = i >= cols ? i - cols : i;
  else n = i + cols < items.length ? i + cols : Math.floor(i / cols) < lastRow ? items.length - 1 : i;
  if (n === i) return true;
  items[n].focus({ preventScroll: true });
  const pitch = achPitch(sc); if (!pitch) return true;
  const st0 = (glMap.get(sc) || {}).ty, cur0 = st0 != null ? st0 : sc.scrollTop, padT = parseFloat(getComputedStyle(sc).paddingTop) || 0;
  const vis = Math.max(1, Math.round((sc.clientHeight - padT) / pitch)), curTop = Math.round(cur0 / pitch), row = Math.floor(n / cols);
  let top = curTop; if (row < curTop) top = row; else if (row > curTop + vis - 1) top = row - vis + 1;
  top = Math.max(0, Math.min(Math.max(0, lastRow + 1 - vis), top));
  if (top !== curTop) glideTo(sc, null, top * pitch, 170);
  return true;
}
function libMove(cur, dir) {   // the cover grid moves by exact rows and columns, so a press never lands on the wrong cover
  const grid = document.querySelector('.lgrid'), opt = document.querySelector('.lopt');
  if (!grid || !cur) return false;
  const items = [...grid.querySelectorAll('[data-game]')];
  if (cur === opt) { if (dir === 'down' && items[0]) focusEl(items[0]); return true; }
  const i = items.indexOf(cur); if (i < 0) return false;
  const cols = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length), lastRow = Math.floor((items.length - 1) / cols);
  let n = i;
  if (dir === 'left') n = i % cols ? i - 1 : i;
  else if (dir === 'right') n = i % cols !== cols - 1 && i + 1 < items.length ? i + 1 : i;
  else if (dir === 'up') { if (i < cols) { glideTo(grid, null, 0, 170); return true; } n = i - cols; }   // the filter button is reached with the View button only
  else n = i + cols < items.length ? i + cols : Math.floor(i / cols) < lastRow ? items.length - 1 : i;
  if (n !== i) {   // glide the grid just far enough to keep the row in view (same smooth spring as the achievements shelves), instead of the browser's jumpy scroll
    const el = items[n]; el.focus({ preventScroll: true });
    const pitch = cols < items.length ? items[cols].getBoundingClientRect().top - items[0].getBoundingClientRect().top : 0;
    if (pitch > 20) {   // whole rows only: the grid always shows complete rows, so no half-cut covers peek out at the top or bottom edge
      const st0 = (glMap.get(grid) || {}).ty, cur0 = st0 != null ? st0 : grid.scrollTop, vis = Math.max(1, Math.floor((grid.clientHeight + 6) / pitch)), curTop = Math.round(cur0 / pitch), row = Math.floor(n / cols);
      let top = curTop; if (row < curTop) top = row; else if (row > curTop + vis - 1) top = row - vis + 1;
      const maxTop = Math.max(0, Math.ceil((grid.scrollHeight - grid.clientHeight) / pitch));
      top = Math.max(0, Math.min(maxTop, top)); if (top !== curTop || Math.abs(grid.scrollTop - top * pitch) > 2) glideTo(grid, null, top * pitch, 170);
    }
  }
  return true;
}
document.addEventListener('scroll', (e) => { const t = e.target; if (t && t.classList && t.classList.contains('dash')) document.body.classList.toggle('scrolled', t.scrollTop > 40); }, true);
let revIO = null;
function revealInit() {
  const els = document.querySelectorAll('.rv'); if (!els.length) return;
  if (revIO) revIO.disconnect();
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  revIO = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revIO.unobserve(en.target); } }), { root: document.querySelector('.dash'), threshold: 0.08 });
  els.forEach((e) => revIO.observe(e)); setTimeout(() => els.forEach((e) => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('in'); }), 900);
}
function homeRows() {   // the Home page as plain rows: games, widgets, then each shelf split into its visual rows
  const rows = [];
  document.querySelectorAll('.r1, .r2, .r3, .spotw').forEach((g) => {
    const it = [...g.querySelectorAll('[data-nav]')]; if (!it.length) return;
    if (!g.classList.contains('r3') || g.classList.contains('hscroll')) { rows.push(it); return; }
    const cols = Math.max(1, getComputedStyle(g).gridTemplateColumns.split(' ').length);
    for (let k = 0; k < it.length; k += cols) rows.push(it.slice(k, k + cols));
  });
  return rows;
}
function homeScroll(el) {
  const d = document.querySelector('.dash'); if (!d) return;
  if (el.closest('.r1, .r2')) { glideTo(d, null, 0, 150); return; }
  const wrap = el.closest('.r3wrap'), g = el.closest('.r3'), cols = g ? Math.max(1, getComputedStyle(g).gridTemplateColumns.split(' ').length) : 1;
  const first = wrap && (!g || g.classList.contains('hscroll') || [...g.querySelectorAll('[data-nav]')].slice(0, cols).includes(el));
  if (first && wrap) { glideTo(d, null, d.scrollTop + wrap.getBoundingClientRect().top - d.getBoundingClientRect().top - innerHeight * 0.14, 150); return; }
  const cr = d.getBoundingClientRect(), r = el.getBoundingClientRect(), m = innerHeight * 0.18;
  if (r.bottom > cr.bottom - m) glideTo(d, null, d.scrollTop + r.bottom - cr.bottom + m, 150); else if (r.top < cr.top + m * 1.6) glideTo(d, null, d.scrollTop + r.top - cr.top - m * 1.6, 150);
}
const homeMem = {};   // the card you were on in each row, so coming back to a row puts you where you left it
function homeMove(cur, dir) {
  const bar = [...document.querySelectorAll('.topbar [data-nav]')];
  const cx = (e) => { const r = e.getBoundingClientRect(); return r.left + r.width / 2; };
  const nearest = (list, x) => list.reduce((b, e) => (!b || Math.abs(cx(e) - x) < Math.abs(cx(b) - x) ? e : b), null);
  if (bar.includes(cur)) {
    if (dir === 'left' || dir === 'right') { const n = bar[bar.indexOf(cur) + (dir === 'right' ? 1 : -1)]; if (n) focusEl(n); return true; }
    if (dir === 'up') return true;
    const rows = homeRows(); if (!rows.length) return true;
    const b = (homeMem[0] != null && rows[0][Math.min(homeMem[0], rows[0].length - 1)]) || nearest(rows[0], cx(cur)); homeScroll(b); b.focus({ preventScroll: true }); return true;
  }
  const rows = homeRows(), ri = rows.findIndex((r) => r.includes(cur)); if (ri < 0) return false;
  const row = rows[ri], ci = row.indexOf(cur);
  if ((dir === 'left' || dir === 'right') && cur.classList.contains('spot')) { spotStep(dir === 'right' ? 1 : -1); return true; }
  if (dir === 'left' || dir === 'right') { const n = row[ci + (dir === 'right' ? 1 : -1)]; if (n) { n.focus({ preventScroll: true }); glideRow(n); homeMem[ri] = ci + (dir === 'right' ? 1 : -1); } return true; }   // sideways only: the page never moves up or down
  homeMem[ri] = ci;
  if (dir === 'up' && ri === 0) { const b = nearest(bar, cx(cur)); if (b) { glideTo(document.querySelector('.dash'), null, 0, 150); b.focus({ preventScroll: true }); } return true; }
  const tr = rows[ri + (dir === 'down' ? 1 : -1)]; if (!tr) return true;   // already on the last row: nothing moves
  const b = tr[Math.min(homeMem[ri + (dir === 'down' ? 1 : -1)] || 0, tr.length - 1)] || tr[0]; b.focus({ preventScroll: true }); glideRow(b); homeScroll(b); return true;   // going up or down always lands on the left-most card of that row
}
function tab(dir) {
  SND.play('tab');   // LB and RB flip through the sections of Settings, the button layout, or the guide
  if (guideOn && !osk && !menu) return guideTabStep(dir);
  if (osk || launching || capture || introOn || menu || guideOn) return;
  if (screen === 'browser' && window.__brOn) return;   // the sticks move the mouse pointer on a web page; they must not also move the console's own selection
  if (screen === 'settings') { const i = SET_CATS.findIndex((c) => c[0] === setCat), n = SET_CATS[(i + dir + SET_CATS.length) % SET_CATS.length][0]; const b = document.querySelector(`.st-c[data-cat="${n}"]`); if (b) b.focus({ preventScroll: true }); return; }
  if (screen === 'tools' && window.toolsTab) return toolsTab(dir);
  if (screen === 'news') return newsStep(dir);
  if (screen === 'home') {   // RB jumps to the last card of the row you're on, LB back to the first
    const cur = document.activeElement, rows = homeRows(), ri = rows.findIndex((r) => r.includes(cur));
    if (ri >= 0) { const row = rows[ri], n = dir > 0 ? row[row.length - 1] : row[0]; if (n && n !== cur) { n.focus({ preventScroll: true }); glideRow(n, 55); homeMem[ri] = row.indexOf(n); } }
    return;
  }
  if (screen === 'binds') { const i = BIND_TABS.findIndex((t) => t[0] === bindTabK); bindTabK = BIND_TABS[(i + dir + BIND_TABS.length) % BIND_TABS.length][0]; show('binds'); const f = document.querySelector('[data-nav]'); if (f) f.focus({ preventScroll: true }); }
}
let gvLast = 0, gvStart = 0, gvDir = 0;
function guideVolStep(el, d) {   // v1265: left/right on a Sound slider changes it in small steps; held, it speeds up (same feel as the Spotify volume)
  const k = String(el.dataset.gd || '').slice(4), def = k === 'sfxVol' ? 0.7 : 0.3;
  const t = performance.now(); if (t - gvLast > 400 || Math.sign(d) !== gvDir) gvStart = t; gvLast = t; gvDir = Math.sign(d);
  const step = gvDir * (1 + Math.floor((t - gvStart) / 450));
  const pct = Math.max(0, Math.min(100, Math.round((settings[k] ?? def) * 100) + step));
  Object.assign(settings, { [k]: pct / 100 }); try { applySettings(); } catch {}
  clearTimeout(saveT); const n = ++saveN; saveT = setTimeout(async () => { const r = await api.setSettings(settings); if (n === saveN) settings = r; }, 300);
  const num = el.querySelector('.pc-num'); if (num) num.innerHTML = pct + '<i>%</i>';
  const bar = el.querySelector('.pc-bar'); if (bar) { bar.dataset.pct = pct; bar.style.setProperty('--psv', pct + '%'); }
  const lab = el.querySelector('.gd-lb, b, span:last-child'); if (!num && lab && /\d+%/.test(lab.textContent)) lab.textContent = lab.textContent.replace(/\d+%/, pct + '%');
  if (k === 'sfxVol' && t - gvStart < 40) SND.play('select');
}
function move(dir) {
  if (signPressWait) return;   // the start screen waits for the PS button: nothing moves behind it
  if (guideOn && (dir === 'left' || dir === 'right') && document.activeElement && document.activeElement.id === 'gvol') return npVol(dir === 'right' ? 1 : -1);
  if (guideOn && (dir === 'left' || dir === 'right') && document.activeElement && /^vol:(sfxVol|musicVol)$/.test(String((document.activeElement.dataset || {}).gd || ''))) return guideVolStep(document.activeElement, dir === 'right' ? 1 : -1);
  if (guideOn && !osk && !menu && document.body.classList.contains('gd-ps')) {   // the Control Center: on the icon bar left/right change icon and up goes to the cards; on the cards left/right move between them and down returns to the bar
    if (psCust) { if (dir === 'left' || dir === 'right') { if (psGrab) psMoveTab(dir === 'right' ? 1 : -1); else { SND.play('tab'); guideTabStep(dir === 'right' ? 1 : -1); } } else if (dir === 'up') psToggleHide(); return; }
    if (!gdRow) { if (dir === 'left' || dir === 'right') { SND.play('tab'); return guideTabStep(dir === 'right' ? 1 : -1); } return; }
    if ((dir === 'left' || dir === 'right') && document.activeElement && document.activeElement.closest && document.activeElement.closest('.pc-vbar')) {   // the small mute / deafen / share buttons sit in a row
      const row = [...document.querySelectorAll('#guide .pc-vbar .pc-vb')], i = row.indexOf(document.activeElement), j = i + (dir === 'right' ? 1 : -1);
      if (i >= 0 && j >= 0 && j < row.length) { row[j].focus({ preventScroll: true }); SND.play('move'); }
      return;
    }
    if ((dir === 'left' || dir === 'right') && guideTab === 'friends' && guidePage === 'main' && document.body.classList.contains('gd-menu')) { psGbToggle(); return; }
    if ((dir === 'left' || dir === 'right') && document.body.classList.contains('gd-menu') && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('.gd-np'))) return;
    if (dir === 'up' || dir === 'down') {   // inside a card (the Spotify card has buttons above its volume row) move to the control above/below first; only when there is none does down go back to the bar
      const c0 = document.activeElement, all = [...document.querySelectorAll('#guide .gd-body [data-nav]')];
      if (c0 && all.includes(c0)) {
        const r = c0.getBoundingClientRect(); let best = null, bs = 1e9;
        for (const e of all) { if (e === c0) continue; const q = e.getBoundingClientRect(), dy = (q.top + q.height / 2) - (r.top + r.height / 2), dx = (q.left + q.width / 2) - (r.left + r.width / 2); if ((dir === 'down' ? dy : -dy) < r.height * .4) continue; const s = Math.abs(dy) + Math.abs(dx) * 2; if (s < bs) { bs = s; best = e; } }
        if (best) { best.focus({ preventScroll: true }); SND.play('move'); return; }
      }
      return;   // down at the last item stays put: only B leaves the tab
    }
  }   // the Control Center: left and right move along the icons   // on the Volume row the stick/D-pad left and right change the volume
  const cur = document.activeElement;
  if (cur?.dataset.adjust && cur === editing && (dir === 'left' || dir === 'right')) {
    const k = cur.dataset.adjust, before = settings[k];
    adjust(cur, dir === 'right' ? 1 : -1);
    if (!(dir === 'left' && SLIDERS[k] && settings[k] === before)) return;   // already at the lowest value: pushing left leaves the slider and goes back to the tab list
    cur.classList.remove('editing'); editing = null;
  }
  if (editing && (dir === 'up' || dir === 'down')) { editing.classList.remove('editing'); editing = null; }
  const els = [...(osk ? $('#osk') : window.__ubiAct && $('#ubiform') ? $('#ubiform') : liveMenu() || (guideOn ? $('#guide') : introOn ? $('#intro') : document)).querySelectorAll('[data-nav]')];
  if (editing && !document.contains(editing)) editing = null;   // the tile was redrawn: never stay stuck in slider mode
  if (!cur || !els.includes(cur)) {   // focus got lost (for example after a redraw): pick it up again instead of doing nothing
    const back = ((screen === 'settings' || screen === 'tools') && document.querySelector('.st-c.cur')) || els.find((e) => e.offsetParent !== null) || els[0];
    return back && focusEl(back);
  }
  let pool = els, inSide = false;
  if ((screen === 'settings' || screen === 'tools') && !osk && !menu && !guideOn) {   // Settings: the sidebar and the tiles are two separate lists
    inSide = !!cur.closest('.st-s');
    if (inSide && (dir === 'right' || dir === 'left')) return;   // the right side is entered with A only (B comes back)
    pool = els.filter((e) => !!e.closest('.st-s') === inSide);
  }
  if (themeOpen && screen === 'settings' && !osk && !menu && !guideOn && document.querySelector('.th-dd')) {   // the wallpaper list is locked: you move only inside it until you pick one (or press B)
    if (!cur.closest('.th-dd')) { const o = document.querySelector('.th-o.on') || document.querySelector('.th-o'); if (o) o.focus({ preventScroll: false }); return; }
    pool = els.filter((e) => !!e.closest('.th-dd'));
  }
  if (introOn && introStage === 1 && !osk && !menu && signMove(cur, dir)) return;
  if (screen === 'home' && !introOn && !osk && !menu && homeMove(cur, dir)) return;
  if (screen === 'library' && !osk && !menu && libMove(cur, dir)) return;
  if (screen === 'ach' && !osk && !menu && achMove(cur, dir)) return;
  if (screen === 'game' && !osk && !menu && !guideOn && (dir === 'up' || dir === 'down')) { const d = document.querySelector('.gxdesc'); if (d) d.scrollBy({ top: dir === 'down' ? 70 : -70, behavior: settings.motion ? 'smooth' : 'auto' }); return; }
  const c = cur.getBoundingClientRect();
  const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
  let best = null, bestScore = Infinity;
  for (const el of pool) {
    if (el === cur) continue;
    const r = el.getBoundingClientRect();
    const dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
    const main = { left: -dx, right: dx, up: -dy, down: dy }[dir];
    const side = (dir === 'left' || dir === 'right') ? Math.abs(dy) : Math.abs(dx);
    if (main <= 1) continue;
    const score = main + side * 2;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  if (!best && cur.closest('.th-dd')) return;   // the end of the wallpaper list stays in the list: it no longer jumps to the next settings tab
  if (!best && screen === 'settings' && !inSide && (dir === 'up' || dir === 'down') && !osk && !menu && !guideOn) {   // past the first or last tile: go to the neighbouring section
    const i = SET_CATS.findIndex((c) => c[0] === setCat), n = SET_CATS[i + (dir === 'down' ? 1 : -1)];
    if (n) { document.querySelector(`.st-c[data-cat="${n[0]}"]`)?.focus({ preventScroll: true }); }
    return;
  }
  if (!best && (screen === 'settings' || screen === 'tools') && dir === 'left' && !inSide && !osk && !menu && !guideOn) best = document.querySelector('.st-c.cur');
  focusEl(best);
}
function back() {
  if (window.__ubiCancel) { window.__ubiCancel(); return; }
  if (!introOn) SND.play('back');
  if (themeOpen) { themeOpen = false; paneRefresh(); return; }
  if (editing) { editing.classList.remove('editing'); editing = null; return; }
  if (guideOn && psOn() && psCust) { psCustToggle(); return; }
  if (psOn() && gdRow) { psLeaveRow(); return; }   // inside the cards B goes back to the icon bar; on the bar it closes the menu
  if (guideOn) { if (guidePage !== 'main') { guidePage = guidePage === 'off' || guidePage === 'restart' ? 'power' : 'main'; return renderGuide(); } if (dash) return; closeGuide(); if (dash) { silenceAll(true); resumeSmooth(); } return; }
  if (launching) { hideLaunch(true); silenceAll(false); return api.launchCancel(); }
  if (osk) return oskClose(null);
  if (menu) return closeMenu(false);
  if (rm !== null) { if (rm > 0) { rm--; rmPaint(); } return; }
  if (pc) { if (!pc.first) { pc = null; signRender(); } return; }
  if (introOn) return;
  if (window.toolsBack && toolsBack()) return;
  if (screen === 'settings' || screen === 'tools') { const c = document.querySelector('.st-c.cur'); if (c && !document.activeElement?.closest('.st-s')) return focusEl(c); }   // B inside a category goes back to the category list first
  if (window.xtraBack && xtraBack()) return;
  if (screen === 'game') return show(prevScreen || 'library', prevIdx);
  if (screen === 'avatars') return show(avFrom || 'profile');
  if (screen === 'binds') return show('controller');
  if (screen === 'controller') return show(ctlFrom && ctlFrom !== 'controller' && ctlFrom !== 'binds' ? ctlFrom : 'home');
  if (screen === 'platform') return show(pending && pending.kind === 'one' ? 'catalog' : 'library');
  if (screen === 'catalog') return show('library');
  if (screen === 'apppick') return show('apps');
  if (screen === 'trailer') return show(trBack || 'home');
  if (screen === 'storeitem') return show(storeFrom === 'store' ? 'store' : 'home');
  if (screen === 'spotify') return spBack();
  if (screen === 'ytube') return show('apps');
  if (screen === 'news') return show('home');
  if (screen === 'achgame') return show('ach', achIdx);
  if (screen === 'ach') return show('home');
  if (screen !== 'home') show('home');
}
let rmArm = { id: '', t: 0 };
const padRemove = () => {
  if (window.xtraRemove && window.xtraRemove()) return;   // removing a game takes two presses, so a stray tap can never delete one
  const ap = document.activeElement?.dataset?.app;
  if (ap && screen === 'apps') {
    if (rmArm.id === ap && Date.now() - rmArm.t < 3000) { rmArm = { id: '', t: 0 }; return removeApp(ap); }
    rmArm = { id: ap, t: Date.now() }; const t = (settings.webApps || []).find((x) => x.id === ap);
    return note('Press ' + settings.binds.remove + ' again to remove ' + (t ? t.name : 'this app') + '.');
  }
  const g = document.activeElement?.dataset?.game;
  if (!g || (screen !== 'library' && screen !== 'game')) return;
  if (rmArm.id === g && Date.now() - rmArm.t < 3000) { rmArm = { id: '', t: 0 }; return removeGame(g); }
  rmArm = { id: g, t: Date.now() };
  const t = games.find((x) => x.id === g);
  note('Press ' + settings.binds.remove + ' again to remove \u201C' + (t ? t.title : 'this game') + '\u201D from your library.');
};

document.addEventListener('paste', (e) => { if (osk && !locked()) { osk.text = (osk.text + e.clipboardData.getData('text')).slice(0, 120); osk.pos = osk.text.length; oskRender('q'); } });
/* ---------- keyboard (for testing without a controller) ---------- */
document.addEventListener('keydown', (e) => {
  if (avc) return;
  if (locked()) return;
  if (introOn && !introStage) return;   // the startup animation cannot be skipped
  const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
  else if (e.key === 'Enter') { e.preventDefault(); activate(document.activeElement); }
  else if (e.key === 'Escape' || e.key === 'Backspace') { if (capture) { capture = null; note('Cancelled.'); } else back(); }
  else if (e.key === 'PageDown') tab(1);
  else if (e.key === 'PageUp') tab(-1);
  else if (e.key === 'F11') { e.preventDefault(); window.consoleApi.toggleFullscreen(); }
});
if (window.consoleApi.onPadNav) window.consoleApi.onPadNav((k) => {   // controller presses that arrive while another monitor has the focus
  if (avc || locked() || (introOn && !introStage)) return;
  if (k === 'up' || k === 'down' || k === 'left' || k === 'right') move(k);
  else if (k === 'a') { if (psOn() && !gdRow) psEnterRow(); else activate(document.activeElement); }
  else if (k === 'b') { if (capture) { capture = null; note('Cancelled.'); } else back(); }
  else if (k === 'lb') tab(-1);
  else if (k === 'rb') tab(1);
});
document.addEventListener('click', (e) => { if (locked()) return; if (introOn && !introStage) return; const tb = e.target.closest('.gd-tb'); if (tb) return guideAct(tb.dataset.gd); const el = e.target.closest('[data-nav]'); if (el) { el.focus(); activate(el); } });
document.addEventListener('mouseover', (e) => { if (locked()) return; const el = e.target.closest('[data-nav]'); if (el) el.focus(); });

/* ---------- controller (Chromium Gamepad API: Xbox layout) ---------- */
const BTN = { A: 0, B: 1, LB: 4, RB: 5, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
const held = {};       // key -> next allowed fire time
function fire(key, now, fn, first = 350, repeat = 130) {
  if (held[key] === undefined) { held[key] = now + first; fn(); }
  else if (now >= held[key]) { held[key] = now + repeat; fn(); }
}
const padDbg = []; let padDbgN = 0;
let psKeyAt = 0, psKeyFired = false, keyDbgN = 0;
window.addEventListener('keydown', (e) => {   // v1093: some controllers send their logo button as a media / browser key instead of a game button
  if (e.repeat) return;
  if (keyDbgN++ < 40) { try { window.consoleApi.lagLog('key down: ' + e.key + ' | ' + e.code + ' | ' + e.keyCode); } catch {} }
  if (padKind() === 'ps' && e.code === 'BrowserHome') { psKeyAt = performance.now(); psKeyFired = false; setTimeout(() => { if (psKeyAt && !psKeyFired) { psKeyFired = true; if (!introOn && !osk && !menu && !launching && !guideOn) openGuide(); } }, 450); e.preventDefault(); }
}, true);
// v1263: way in without the PS button (keyboard Enter/Space or a mouse click on the start screen), in case Windows or Steam keeps the PS button from reaching the console
window.addEventListener('keydown', (e) => { if (!e.repeat && (e.key === 'Enter' || e.key === ' ') && introOn && introStage === 1 && signPressWait) { e.preventDefault(); signReveal(); } }, true);
window.addEventListener('mousedown', () => { if (introOn && introStage === 1 && signPressWait) signReveal(); }, true);
window.addEventListener('keyup', (e) => {
  if (padKind() === 'ps' && e.code === 'BrowserHome' && psKeyAt) { const fired = psKeyFired; psKeyAt = 0; if (!fired && introOn && introStage === 1 && signPressWait) signReveal(); else if (!fired && !introOn && !osk) { try { if (guideOn) closeGuide(); else { if (menu) closeMenu(false); if (screen !== 'home') show('home'); } SND.play('tab'); } catch {} } e.preventDefault(); }
}, true);
let muteUntil = 0, psWas = false, psAt = 0, psFired = false;
function pickPad() {   // prefer a real Xbox/XInput controller over virtual or extra devices, which cause ghost presses
  const all = [...(navigator.getGamepads() || [])].filter((p) => p && p.connected);
  return all.find((p) => /xbox|xinput|045e/i.test(p.id) && p.mapping === 'standard') || all.find((p) => p.mapping === 'standard') || all[0];
}
function poll(now) {
  if (avc) { setTimeout(() => requestAnimationFrame(poll), 60); return; }   // the picture cropper reads the controller itself
  if (mouseOn || !document.hasFocus()) { setTimeout(() => requestAnimationFrame(poll), 200); return; }   // idle while a game has the screen
  const pad = pickPad();
  const el = $('#pad');
  if (pad) {
    el.classList.add('on'); if (!cpad) { cpad = true; updateLock(); }
    padKindFrom(pad);
    if (signPressWait && introOn && introStage === 1) { const ps = !!(pad.buttons[16] && pad.buttons[16].pressed); if (ps && !psRevWas) signReveal(); psRevWas = ps; }   // only the PS button opens the sign-in page; sticks and other buttons do nothing here
    { const n = pad.buttons.length; for (let i = 0; i < n; i++) { const pr = !!(pad.buttons[i] && pad.buttons[i].pressed); if (i >= 10 && pr !== !!padDbg[i] && padDbgN++ < 80) { try { window.consoleApi.lagLog('pad button ' + i + (pr ? ' down' : ' up') + ' (of ' + n + ', ' + pad.mapping + ')'); } catch {} } padDbg[i] = pr; } }   // what the extra buttons (PS / logo / paddles) really send, for the log
    if (padKind() === 'ps' && !xpad && pad.buttons.length > 16) {   // the PS button: hold opens the PlayStation Control Center, a tap goes to the home page
      const psNow = !!(pad.buttons[16] && pad.buttons[16].pressed);
      if (psNow && !psWas) { psAt = now; psFired = false; }
      if (psNow) { sup.add(16); if (!psFired && now - psAt > 450) { psFired = true; if (!introOn && !osk && !menu && !launching) { if (!guideOn) openGuide(); } } }
      else if (psWas && !psFired && introOn && introStage === 1 && signPressWait) signReveal();
      else if (psWas && !psFired && !introOn && !osk) { try { if (guideOn) closeGuide(); else { if (menu) closeMenu(false); if (screen !== 'home') show('home'); } SND.play('tab'); } catch {} }
      psWas = psNow;
    }
    if (document.body.classList.contains('ambient')) {   // the clock page: the first controller input only wakes the console and goes back to the dashboard, it does not press anything
      if (pad.buttons.some((b) => b.pressed) || Math.abs(pad.axes[0] || 0) > .5 || Math.abs(pad.axes[1] || 0) > .5) { pad.buttons.forEach((b, i) => { if (b.pressed) sup.add(i); }); window.dispatchEvent(new Event('ambwake')); }
      requestAnimationFrame(poll); return;
    }
    const idleTest = screen === 'binds' && bindTabK === 'test' && !testing;   // before A is pressed, the sticks do nothing here
    if (screen === 'binds' && bindTabK === 'test') {   // the Test tab
      if (testing) {
        updateTest(pad);   // everything the controller does is only shown, until B is held for a second
        if (pad.buttons[1] && pad.buttons[1].pressed) { testB = testB || now; if (now - testB > 1000) { testing = false; testB = 0; show('binds'); note('Test stopped.'); } } else testB = 0;
        pad.buttons.forEach((b, i) => { if (b.pressed) sup.add(i); });
        for (const d of ['left', 'right', 'up', 'down']) held[d] = now + 1e9;
        requestAnimationFrame(poll); return;
      }
    }
    const stNow = !!(pad.buttons[9] && pad.buttons[9].pressed);
    if (stNow && !stWas && guideOn && psOn() && !menu && !osk) { sup.add(9); psCustToggle(); }
    if (stNow && !stWas && screen === 'binds' && !menu && !osk && !guideOn && !testing) { switchPadProfile(((settings.padProfile || 0) + 1) % 3); SND.play('tab'); sup.add(9); }
    if (stNow && !stWas && !menu && !osk && !guideOn && !launching && !capture && !introOn) {
      if ((screen === 'library' || screen === 'home') && document.activeElement && document.activeElement.dataset.game) { openMenu(document.activeElement, document.activeElement.dataset.game); sup.add(9); }
      else if ((screen === 'apps' || screen === 'home') && document.activeElement && document.activeElement.dataset.app) { appMenu(document.activeElement); sup.add(9); }
      else if (screen === 'game') { const d = document.querySelector('[data-gact="dots"], [data-act="dots"]'); if (d) { d.focus({ preventScroll: true }); activate(d); sup.add(9); } }
    }
    const vwNow = !!(pad.buttons[8] && pad.buttons[8].pressed);
    if (vwNow && !vwWas && screen === 'home' && !menu && !osk && !guideOn && !launching && !capture && !introOn && !testing) { show('ach'); SND.play('open'); sup.add(8); }
    if (vwNow && !vwWas && screen === 'library' && !menu && !osk && !guideOn && !launching && !capture && !introOn && !testing) { const lo = document.querySelector('.lopt'); if (lo) { openLibMenu(lo); SND.play('open'); sup.add(8); } }
    vwWas = vwNow;
    stWas = stNow;
    const rtNow = !!(pad.buttons[7] && pad.buttons[7].value > 0.55);
    rtWas = rtNow;
    const dz = settings.deadzone, ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
    const down = (i) => pad.buttons[i]?.pressed;
    let stick = '';   // the stick counts as ONE direction (the strongest axis), so a diagonal push never fires two moves
    if (Math.max(Math.abs(ax), Math.abs(ay)) > dz) stick = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? 'left' : 'right') : (ay < 0 ? 'up' : 'down');
    const dirs = { left: down(BTN.LEFT) || stick === 'left', right: down(BTN.RIGHT) || stick === 'right', up: down(BTN.UP) || stick === 'up', down: down(BTN.DOWN) || stick === 'down' };
    if ((dirs.left || dirs.right) && (dirs.up || dirs.down)) {   // a diagonal D-pad press: keep the axis that was already being held
      if (held.left !== undefined || held.right !== undefined) dirs.up = dirs.down = false; else dirs.left = dirs.right = false;
    }
    if (dirs.left && dirs.right) dirs.left = dirs.right = false;
    if (dirs.up && dirs.down) dirs.up = dirs.down = false;
    if (now < muteUntil) {   // just came back from a game or another window: ignore whatever is still held down
      for (const d in dirs) { if (dirs[d]) held[d] = now + 1e9; else delete held[d]; }
      pad.buttons.forEach((b, i) => { if (b.pressed) sup.add(i); });
      requestAnimationFrame(poll); return;
    }
    for (const d in dirs) { if (dirs[d] && !(introOn && !introStage)) fire(d, now, () => move(d)); else delete held[d]; }
    for (const i of [...sup]) if (!down(i)) sup.delete(i);
    if (capture) {   // waiting for the new button in the Buttons screen
      const pr = Object.entries(IDX).filter(([, i]) => down(i)).map(([n]) => n);
      if (!capture.armed) { if (!pr.length) capture.armed = true; }
      else if (pr.length) finishCapture(pr[0]);
      else if (Date.now() - capture.t > 10000) { capture = null; note('Cancelled.'); }
      requestAnimationFrame(poll); return;
    }
    if (osk && !osk.ready) {   // wait until the button that opened the keyboard is released
      if (!osk.t0) osk.t0 = Date.now();
      if (!pad.buttons.some((x) => x.pressed) || Date.now() - osk.t0 > 500) osk.ready = true;
      requestAnimationFrame(poll); return;
    }
    const bd = settings.binds, used = new Set();
    const list = [['confirm', IDX[bd.confirm], () => activate(document.activeElement)], ['back', IDX[bd.back], back]];
    if (screen === 'browser' && window.__brOn && !osk) list.splice(0, 2);   // on a live web page A and B belong to the page (the pointer), not to the console's own menus
    if (osk) list.push(['o1', IDX.X, () => oskKey('__back'), 380], ['o2', IDX.Y, () => oskKey('__space'), 380], ['o3', IDX.LB, () => oskKey('__shift')], ['o4', IDX.START, () => oskKey('__done')],
      ['o5', 6, () => oskKey('__left'), 320], ['o6', 7, () => oskKey('__right'), 320]);
    else if (!menu && guideOn) list.push(['npY', IDX.Y, () => npAct('pp')], ['tabL', IDX.LB, () => tab(-1)], ['tabR', IDX.RB, () => tab(1)]);   // in the Xbox menu Y is the only Spotify shortcut; LB/RB switch tabs
    else if (!menu) list.push(['tabL', IDX.LB, () => tab(-1)], ['tabR', IDX.RB, () => tab(1)], ...(guideOn ? [] : [['search', IDX[bd.search], padSearch], ['remove', IDX[bd.remove], padRemove]]));
    if (launching) list.splice(0, list.length, ['back', IDX[bd.back], back]);
    if (introOn && !introStage) list.splice(0, list.length);   // the animation: A skips it
    else if (introOn && !osk) list.splice(0, list.length, ['confirm', IDX[bd.confirm], () => activate(document.activeElement)], ['sgopt', IDX.START, signOptions], ['back', IDX[bd.back], back]);   // the sign-in page
    for (const [id, idx, fn, first] of list) {
      if (idx === undefined || used.has(idx)) { delete held[id]; continue; }
      used.add(idx);
      if (!down(idx)) { delete held[id]; continue; }
      if (held[id] === undefined && sup.has(idx)) continue;   // this press was already used (for example it just closed the keyboard)
      fire(id, now, fn, first || 1e9);
      sup.add(idx);
    }
  } else { el.classList.remove('on'); if (cpad) { cpad = false; updateLock(); } }
  requestAnimationFrame(poll);
}
/* ---------- start ---------- */
function chime() {   // a short synthesized welcome chime (original, not a recording)
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)(), t = ac.currentTime, master = ac.createGain();
    master.gain.setValueAtTime(0, t); master.gain.linearRampToValueAtTime(0.16, t + 1.5); master.gain.linearRampToValueAtTime(0, t + 4.2); master.connect(ac.destination);
    [196, 293.66, 392, 587.33].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; g.gain.value = 0.25; o.connect(g); g.connect(master); o.start(t + i * 0.2); o.stop(t + 4.4); });
    setTimeout(() => ac.close(), 5000);
  } catch {}
}
function openUp() {   // the opening mirrors the closing: the black lifts slowly while the console settles in from a soft blur (the window itself fades in too, from main.js)
  try { SND.play('home'); } catch {}
  const b = document.body, c = document.getElementById('bootcover');
  b.classList.add('opening');
  requestAnimationFrame(() => requestAnimationFrame(() => { b.classList.add('opened'); if (c) c.classList.add('gone'); }));
  setTimeout(() => { if (c) c.remove(); b.classList.remove('opening', 'opened'); }, 1700);
}
let pwrT = null;
function powerOffScreen(on, hold) {
  if (on === true) { try { SND.play('poweroff', 1); } catch {} }
  const p = document.getElementById('pwr'); if (!p) return;
  const av = p.querySelector('.pav'); if (av) { av.innerHTML = avatarSpan('xl'); applyAvatars(); }   // your own profile picture
  const sm = p.querySelector('small'), hi = p.querySelector('em');
  clearTimeout(pwrT);
  const reset = () => { p.classList.remove('on', 'hold', 'go', 'crt'); p.style.removeProperty('--po'); document.body.classList.remove('powering'); };
  if (!on) { reset(); return; }
  if (hold) {   // you are holding the Xbox button: the ring around your picture fills until the controller switches off
    if (p.classList.contains('on')) return;
    reset(); if (sm) sm.textContent = 'Powering off'; if (hi) hi.textContent = 'Keep holding the Xbox button';
    void p.offsetWidth; p.classList.add('on', 'hold'); document.body.classList.add('powering'); return;
  }
  try { SND.play('close'); } catch {}
  const pa = p.querySelector('.pa'), was = p.classList.contains('hold') && pa;
  if (was) p.style.setProperty('--po', getComputedStyle(pa).strokeDashoffset); else { p.style.setProperty('--po', '302'); reset(); if (sm) sm.textContent = 'Powering off'; void p.offsetWidth; p.classList.add('on'); document.body.classList.add('powering'); }
  p.classList.remove('hold'); p.classList.add('go');
  if (sm) sm.textContent = 'See you soon'; if (hi) hi.textContent = '';
  pwrT = setTimeout(() => p.classList.add('crt'), was ? 900 : 1500);   // then everything softly fades to black
}
function dropBootCover(ms) { const c = document.getElementById('bootcover'); if (!c) return; if (!ms) { c.remove(); return; } c.classList.add('gone'); setTimeout(() => c.remove(), ms + 100); }

/* ---- startup video: drawn through a small graphics shader that enlarges it smoothly (bicubic), sharpens it, adds a little contrast and removes the stray light streak on the right ---- */
let igl = null;
function introGLStop() { igl = null; const c = $('#introc'), el = $('#intro'); if (c) c.hidden = true; if (el) el.classList.remove('gl'); }
function introGLStart(v) {
  const c = $('#introc'), el = $('#intro'); if (!c || !el) return;
  const gl = c.getContext('webgl', { alpha: false, antialias: false }); if (!gl) return;
  const sh = (t, src) => { const x = gl.createShader(t); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const fsrc = `precision highp float; uniform sampler2D T; uniform vec2 O, V;
  vec3 S(vec2 u) { return texture2D(T, u).rgb; }
  vec3 cubic(vec2 uv) {   // Catmull-Rom: a clean smooth enlargement instead of the blurry default
    vec2 sp = uv * V, tp = floor(sp - 0.5) + 0.5, f = sp - tp;
    vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f)), w1 = 1.0 + f * f * (-2.5 + 1.5 * f), w2 = f * (0.5 + f * (2.0 - 1.5 * f)), w3 = f * f * (-0.5 + 0.5 * f);
    vec2 w12 = w1 + w2, o12 = w2 / w12, t0 = (tp - 1.0) / V, t3 = (tp + 2.0) / V, t12 = (tp + o12) / V;
    vec3 r = S(vec2(t0.x, t0.y)) * w0.x * w0.y + S(vec2(t12.x, t0.y)) * w12.x * w0.y + S(vec2(t3.x, t0.y)) * w3.x * w0.y
           + S(vec2(t0.x, t12.y)) * w0.x * w12.y + S(vec2(t12.x, t12.y)) * w12.x * w12.y + S(vec2(t3.x, t12.y)) * w3.x * w12.y
           + S(vec2(t0.x, t3.y)) * w0.x * w3.y + S(vec2(t12.x, t3.y)) * w12.x * w3.y + S(vec2(t3.x, t3.y)) * w3.x * w3.y;
    return r;
  }
  void main() {
    float sc = min(O.x / V.x, O.y / V.y); vec2 sz = V * sc; vec2 p = (gl_FragCoord.xy - 0.5 * O) / sz + 0.5; p.y = 1.0 - p.y;
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    vec3 c = cubic(p); vec2 px = 1.0 / V;
    vec3 b = (S(p + vec2(px.x * 1.3, 0.0)) + S(p - vec2(px.x * 1.3, 0.0)) + S(p + vec2(0.0, px.y * 1.3)) + S(p - vec2(0.0, px.y * 1.3))) * 0.25;
    c = c + (c - b) * 1.5;   // sharpen
    c = clamp(c, 0.0, 1.0); c = (c - 0.5) * 1.08 + 0.5; c = pow(clamp(c, 0.0, 1.0), vec3(0.96));
    float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, 1.12);
    float mx = smoothstep(0.630, 0.645, p.x) * (1.0 - smoothstep(0.84, 0.87, p.x)), my = smoothstep(0.35, 0.38, p.y) * (1.0 - smoothstep(0.51, 0.54, p.y));
    c *= 1.0 - mx * my;   // the stray streak of light to the right of the logo is painted out
    gl_FragColor = vec4(c, 1.0);
  }`;
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }')); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fsrc)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link');
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  c.addEventListener('webglcontextlost', () => introGLStop(), { once: true });
  const uO = gl.getUniformLocation(pr, 'O'), uV = gl.getUniformLocation(pr, 'V');
  const me = (igl = { v }); let first = true;
  const draw = () => {
    if (igl !== me) return;
    try {
      if (v.readyState >= 2 && v.videoWidth) {
        const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.min(3840, Math.round(innerWidth * dpr)), H = Math.min(2160, Math.round(innerHeight * dpr));
        if (c.width !== W || c.height !== H) { c.width = W; c.height = H; gl.viewport(0, 0, W, H); }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, v);
        gl.uniform2f(uO, W, H); gl.uniform2f(uV, v.videoWidth, v.videoHeight); gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (first) { first = false; c.hidden = false; el.classList.add('gl'); }
      }
    } catch (e) { introGLStop(); return; }   // the picture could not be read: the normal video simply stays visible
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(draw); else requestAnimationFrame(draw);
  };
  draw();
  v.addEventListener('loadeddata', () => { if (igl === me && first) draw(); }, { once: true });
  v.addEventListener('playing', () => { if (igl === me) draw(); }, { once: true });
}
let introVidPlayed = false;
function runIntro() {
  introVidPlayed = false; try { psSfxLoad(); } catch {}   // startup animation, then the sign-in page
  if (!padReady) { padKindInit().then(() => runIntro()); return; }   // v1091: first find out which controller is in use
  const introFile = padKind() === 'ps' ? settings.introVideoPs : settings.introVideo;
  if (!settings.intro) { SND.hold(false); try { SND.startMusic(); } catch {} openUp(); return; }
  introOn = true; introStage = 0; introLast = Date.now(); SND.hold(true); document.body.classList.add('intro-on'); try { appMidnight(false); } catch {}
  try { if (typeof introFile === 'string' && introFile && window.bdHold) window.bdHold(true); } catch {}   // v812: the moving wallpaper waits until the startup video is done
  const el = $('#intro');
  el.className = ''; el.hidden = false; void el.offsetWidth;   // the screen stays black for a moment, then the video fades in
  api.introWait(true); dropBootCover(0);
  const v = $('#introv'), f = introFile;
  const fallback = () => { v.pause(); v.removeAttribute('src'); if (introOn && !introStage) introNext(true); };
  if (typeof f === 'string' && /^startup-[a-z0-9]+\.(mp4|webm)$/.test(f)) {   // your own startup video
    introVidPlayed = true; el.classList.add('has-video'); document.body.classList.add('introplay'); v.hidden = false; v.volume = 0.8; v.currentTime = 0;
    v.onended = () => { if (introOn && !introStage) introNext(true); };
    v.ontimeupdate = () => { if (introOn && !introStage && v.duration && v.duration - v.currentTime < 2.4 && window.__bdHold && window.bdHold && !v._pre) { v._pre = true; try { window.bdHold(false); } catch {} } if (introOn && !introStage && v.duration && v.duration - v.currentTime < 0.9) introNext(true); };   // v949: the live wallpaper is built during the last 2 seconds of the video (drawing stays paused until it ends), so it is already moving when the sign-in page appears   // start the cross-fade just before the video ends so there is no hard cut
    v._retry = false;
    { let lt = -1, still = 0; const wd = setInterval(() => { if (!introOn || introStage) { clearInterval(wd); return; } const ct = v.currentTime; if (ct === lt) still++; else { still = 0; lt = ct; } if (still >= 9) { clearInterval(wd); try { api.lagLog('wallpaper: startup video stopped moving, skipping it'); } catch {} introNext(true); } }, 1000); }   // if the video ever freezes, the console moves on by itself and the wallpaper is never left paused
    v.onerror = () => {   // if the sharpening path cannot read the file, play it normally rather than skipping the intro
      if (v.crossOrigin && !v._retry) { v._retry = true; v.crossOrigin = null; v.removeAttribute('crossorigin'); introGLStop(); v.src = 'ctheme://img/' + f; v.load(); if (introOn && !introStage) v.play().catch(() => {}); return; }
      if (introOn && !introStage) fallback();
    };
    if (settings.introEnhance === true) v.crossOrigin = 'anonymous'; else { v.crossOrigin = null; v.removeAttribute('crossorigin'); }
    v.src = 'ctheme://img/' + f; v.preload = 'auto'; v.volume = 0; v.load(); if (settings.introEnhance === true) { try { introGLStart(v); } catch (e) { introGLStop(); } }   // load it while the screen is black
    setTimeout(() => {   // the sound begins first, rising out of silence over the black screen; the picture fades in while it swells
      if (!introOn || introStage) return;
      v.play().catch(() => { if (introOn && !introStage) fallback(); });
      const t0 = performance.now(), dur = 5200, mid = 0.7, top = 1;   // a slow swell out of silence (shaped in decibels), then it keeps building until the video ends
      const ramp = () => {
        const el = performance.now() - t0, k = Math.min(1, el / dur), e = Math.min(1, k / 0.35);
        let amp;
        if (k < 1) amp = mid * Math.pow(10, -3.2 * (1 - k)) * (e * e * (3 - 2 * e));
        else { const end = Math.max(dur + 1000, ((v.duration || 30) - 1.4) * 1000), q = Math.min(1, (el - dur) / (end - dur)); amp = mid + (top - mid) * (q * q * (3 - 2 * q)); }
        try { v.volume = Math.max(0, Math.min(1, amp)); } catch {}
        if (introOn && !introStage) requestAnimationFrame(ramp);
      };
      requestAnimationFrame(ramp);
      setTimeout(() => { if (introOn && !introStage) el.classList.add('boot-on'); }, 500);
    }, 60);
    setTimeout(() => { if (introOn && !introStage) introNext(true); }, 60000);
  } else { setTimeout(() => { if (introOn && !introStage) introNext(true); }, 50); }   // no startup video: straight to the sign-in page
}
function signBg(on) {   // the PS5 boot video is the sign-in page's background while a PlayStation controller is in use; its last scene then loops, so the particles keep drifting
  const v = $('#signbgv'), lp = $('#signloop'); if (!v) return;
  const rel = () => { try { if (window.__bdHold && window.bdHold) window.bdHold(false); } catch {} };
  if (!on) { rel(); signPressWait = false; psLoginShow(false); if (v.hidden) return; try { $('#intro').classList.remove('signbg-wait'); } catch {} v.classList.remove('on'); if (lp) lp.classList.remove('on'); const v0 = v.volume, l0 = lp ? lp.volume : 0, t1 = performance.now(), fo = () => { const k = Math.min(1, (performance.now() - t1) / 800); try { v.volume = Math.max(0, v0 * (1 - k)); if (lp) lp.volume = Math.max(0, l0 * (1 - k)); } catch {} if (k < 1) requestAnimationFrame(fo); else { try { v.pause(); if (lp) lp.pause(); } catch {} v.hidden = true; if (lp) lp.hidden = true; } }; requestAnimationFrame(fo); return; }
  if (padKind() !== 'ps' || !v.hidden) { window.__signDirect = false; return; }
  if (settings.signBgVideo && lp) {   // your own video: it loops behind the sign-in page, silent, with no boot sequence
    lp.src = 'ctheme://img/' + settings.signBgVideo; lp.loop = true; lp.muted = true; lp.hidden = false; v.hidden = false; v.classList.add('on');
    try { if (window.__bdHold !== undefined && window.bdHold) window.bdHold(true); } catch {}
    lp.onerror = () => { lp.hidden = true; v.hidden = true; v.classList.remove('on'); rel(); };
    lp.play().then(() => lp.classList.add('on')).catch(() => { lp.hidden = true; v.hidden = true; rel(); }); return;
  }
  const el = $('#intro');
  const direct = !!window.__signDirect; window.__signDirect = false;
  v.hidden = false; v.classList.add('on');
  try { if (window.__bdHold !== undefined && window.bdHold) window.bdHold(true); } catch {}
  psLoginShow(true, !direct && !introVidPlayed);   // a startup video already played: no second logo sequence, straight to the prompt
  signPressWait = !direct; introVidPlayed = false; if (el) { if (direct) el.classList.add('sign-revealed'); else { el.classList.add('signbg-wait'); el.classList.remove('sign-revealed'); } }
}
let psl = null, pslRaf = 0, pslAu = null, pslSfx = null, pslSfxT = 0;
const PSFX = { enter: [0.25, 1.3], select: [1.67, 2.8], home: [3.2, 4.3], tap: [1.67, 2.12], pop: [0.25, 0.95] };   // each starts right at the sound's first moment, so there is no lead-in before it
window.psSfxUi = (n) => psSfxUi(n);
let pslCtx = null, pslBuf = null, pslGain = null;
function psSfxLoad() {   // decoded once into memory so every sound starts the instant it is asked for
  if (pslBuf !== null) return; pslBuf = false;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; pslCtx = new AC({ latencyHint: 'interactive' }); try { pslCtx.resume(); } catch {} pslGain = pslCtx.createGain(); pslGain.gain.value = .13; pslGain.connect(pslCtx.destination);
    fetch('ctheme://img/startup-pssfx.mp4').then((r) => r.arrayBuffer()).then((b) => pslCtx.decodeAudioData(b)).then((d) => { pslBuf = d; }).catch(() => { pslBuf = false; });
  } catch {}
}
function psSfxUi(n) {   // every menu sound on a PlayStation controller: the real PS5 clips where I have them
  const m = { select: 'tap', on: 'tap', open: 'pop' }[n]; if (!m || !pslBuf) return false; psSfx(m); return true;
}
function psSfx(name) {
  try {
    const r = PSFX[name]; if (!r) return; psSfxLoad();
    if (pslBuf && pslCtx) { if (pslCtx.state === 'suspended') pslCtx.resume(); const src = pslCtx.createBufferSource(), g = pslCtx.createGain(), d = r[1] - r[0], t = pslCtx.currentTime; src.buffer = pslBuf; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + .004); g.gain.setValueAtTime(1, t + Math.max(0.01, d - .12)); g.gain.linearRampToValueAtTime(0, t + d); src.connect(g); g.connect(pslGain); src.start(0, r[0], d); return; }
    if (!pslSfx) { pslSfx = new Audio('ctheme://img/startup-pssfx.mp4'); pslSfx.preload = 'auto'; pslSfx.volume = .13; }
    const a = pslSfx; clearTimeout(pslSfxT); a.currentTime = r[0]; a.play().catch(() => {}); pslSfxT = setTimeout(() => { try { a.pause(); } catch {} }, (r[1] - r[0]) * 1000 + 50);
  } catch {}
}
const PSLOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQEAAADGCAYAAADSdjVFAAA2e0lEQVR42u2debBl1XXef+uc+4YeoEE0sxBiFEjgBiGEJBACImuwLc8VJ7HjOBVXnLEqiSv+K07yVxKlnJQdV1K24zhR4thWbEmWLUsylgwCBEaNoIFGzGMzddNNd9PTG+45K3/stbtXb86579433Xvf27vq1X39+g333nP2t9f61re+JeQ1lKWqAlwI/CAwDTwBPAa8KiJz7vsK+1TilwBEpE5/n4hofmfzGnR18lswFAAoRKRW1c3ADwHXAfuB54AXVHW7gcLLwAHgmIjMu58vVXUCqNyvLVW1iiBhQJFBIa8MAiO6JlV1HiiAKYsEtgJnAB8BfhzYB7wEPGnA8DjwBvCsiBzwAGBRRR2jhTRKyCuvDAIjGAzYez8NbExO9Fn7v0uAC4APAvPAUeAF4AlV3QE8A7wC7BaR/QkolAYIauCQo4K8MgiM0hKRWbdZY75fJJ8fcZu4A5wJnArcCBwG9lhksEdVHwVeBLYDrxgonMQpOG4BoM6gkFcGgSGTgrYJYwgfT211YBCvTwfoWoQgwCFgAjiHQCxOArdZ+nAE2KGqfwU8YhzDHhGpXNrQsc9r93dzpJBBIK8hrdIReZpUAXw1oEi+N+b8B+1xA7DZeIUrgE8bKLwJPKCqTwH3A88Yn+DwSAtPJvYJXnllEMhruTKD5JEkKvBf86AQqwATBGIxAsqMfd+p9vXzgesNDJ4FnlTVJ41s3Gmpw7F8GTII5DWEza+q2AmvDaDgV7XA75o3ANho/54jkIg4TuEU4AYDhIOE0uO0gcK3gYeB7xkoaFrOzClDBoG8VnZVfYbj8XsK91jbx7zxBlPGEagDj9qAIUYJU8C7DTQuBD5koLDb+IRHgAcMEGZ8udEAQTKxmEEgL5a9XNiWJrR9f+FSgMIBSYwKIgFYu58R+/85F0FMG59wEXA5cIulDi8Bj6rqfcAOQuXhsIh0E22CANoECJk/yCCQ1+I4AenBC/hVN3x//LybfE0SwPC/P94DhUUKtUUS7wWuIYiWdhE0CfeZPuEJ4C0RORp/hyt1+gih6COVySuDQF4NJ38MuauGDa/J92raU5A8Nv2M/57Kfn9paYI6HmHGvn4FsI1QhtwPPGhcwkPA08DzBgioamERQgSdDAIZBPIaYNUuz6dhczdt/LS0WPf4ufR7fbTRbfiZSAjOWgoxAZxN6HW4iaBJ2Gdpw50EodIuJ4SqLELQtpQhrwwCeZ284dLNWrec7PQ43aUl1dAFeAjtkaaIixo6placBrYA7wS+j6BLeArYrqoPEzQJL8emp0G0CHllEMjpQO+vLQQEvX6/LgNQRW1CYdFBjCROB24mlCAPEXocdqrq7cYhPK+qs9Y5WUYVZFQy5pVBIK/eG7dw6UIqGtLka3XL75AeoMIA1Qu1XB/3qAYI8/Y3NhsYbAN+EngI+AZwv6o+DbzuUgaJ3EFOFzII5NV782pDytDPZtY+IxBd4nMtnVBp1jiGCWATcKtFCS/Zx12q+qBxCHti2TGmDBkMMgisl6UiotbE41l6bUkFFkoBRmXjTNjjpCsRRhHThZxojd5DcFG6W1W/bmKlQyLSdfoDLH3IeoMMAhkwaO4faHosVuCk7/V8mn53dDyqEmmzf05bgY/bx88BdwFfNrXibhGpVFWiQlEDEmSjlAwCGQwawKBXKqHLRAiuVKPUMUKV4XLgXYTS47eAe1T1DuAlETkWI4OoP8hRQQaBtbix049B8nnp0X4MvVWHKyF37vdnapcuHLDPzwH+FvBJgiDpblX9GvC4RRJqrc/ZKSmDQAaOBn7Aq/Rqp9bTRZQTVysqiCKlKGc+5DwXbyOYr37SooM7gYdEZJ+VGOukh4FsrppBgDVeJegXGKoFSoKjltakwqjalRy3EKzUrgE+Bfy5qv4R8Ejc6FmElEFgvXYY9tpQ9QBipFGsLuCaoCpXerwMuNh4g8+p6p8TXJdnkmgg+jTkiIDFy1XzWjvcgi4ABLrCnMEg0U4auVTGA8w4IZISJMr/CvgV4G+r6tZkw2v4ZwaAHAnk1VZJkIYOw1EVSaX+CUogEScIDUzvA35IVT8H3C4ih1W1A9S5cSmDQF69U4Z0s+kIeyw0kZ9d+3wLgUC8CrhBVf8H8LzrppwGKlWtco9CTgfyai4XSp98waimPbUBwhbg54H/DPwo8A47/WcjR+JMT9pmQuZIIK91FQnUY7T5pQ8w69iGv5Xgnfg+Vf1jEdmhkSUMhGFp6UGdS4o5EsiRwGgRg0tVHypBW3CUYLH+T4BfUtVbgNJt8jqf/BkE8lr+EzmG5N2GJqjVBoKOPU4DPwB8Fvikqm4AOiKiIpJdknM6kNcSy3je06BM8vO6x2atVlHAFMuL7wV+mTCI5U844bJ8fC5jbkrKILDWTuaVcBVKDUwmOeEt+JR9HADOI2j/3wucRSjjpWz+agmVomz6EKE56R8DR1X16yIyG8uI1ocg1tJdrudZChkE8lqIRyhdO/AsYS7B7wF/BLxKEPRM2+b/APAzwNV2b21YRjAbJMXtGGDNEtySPwtcpKq/Yf83b4AQuxPXdZqQQSCvfsLreJ88D/wq8CUT50zZBjoIHFTVXQSzkJ+25p8LnPy3WCWpcu3+5gYDr63AzxLalz8PzHonI4sEqkwM5pVXOwiInao7gD8HZlS1NK/ArqpOq+q0hf6PA78J/K7NPSwdYair+Jzn3TCVkuBZ8M+Bn3BTmka1dyKDQF6M4jyEF4D/C+zz48i82aiIdM1mfBfwh8CXElfi1eRLaud3OGVfPx34ReAz9prisBRdz6XDDAJ59cMLzBJGm38vWn+ZRt8PKK1VddIigoLgG3g7wSBE3WSl1RRHla5yMWXP4WzgHxDMTwUorHyoGQTyyqv9ZD0CvEJg2b3NV0moBHQTw1RMr/8o8IirEOiQIpn4vOLcxW3A3yGYn2oyPi2DQF55NZysRwhzCIt4ciaCIXEbv2tRgsQxZcAbQ8y7xYHApIFWh9B89LMWIXTW817IIJBXPxqDLqEUqG4SsbhQW6MAx89JMOLwKeMIiiEDQdqafCrwY8APGjiQQSCvvNrXPKG8NjcAiSaqOmFpxMsj4HNY22uondvxRZYWXAxMOt1ABoG88qK95MYCbbm+EjBhEcTrtulWmxfw1uu1m7DcdSKoDwI/YpHBKHszZhDIa2y7FruEiUOHh3i/xRRgQzJLMfIEtwDvMQAorMKRQSCvvBrIPx3w9I3+gN0h8gGpn0JhH6V7npcCHyK0ItdY+XO9pAYZBPJiAGKtHHDeYuXajashqfPSIS2+AzI+rzOAnwLeZZ2F3aQKkkEgr9xG7D+SzaENTj2Fa9ktXDeh9hi6uprWZN2E35gn9DncrKqb7HtK6zjMIJBXXn10/UlLY5okZcZhAgCJeAinD1D72kcILsaSTHDKIJBXXn3cL156O5dwA+I2nw6Z2yht86dNTVME5+IPWUpQLVQNySCQV15tYUGzY8+oDDppsl+P+2Ar8AFVfZdPazII5JXXoEfu21n1UQCAwkUk6ezD0hGG1xJ6C9aNJXkGgbxWavO3nbrDNrPRBsLTG4qcB1y1npSDGQTyGsVBq6v998WAac64geuB863EWa51QMggMGLltzHnArRlw0kygrwageqGJIBQGwjMEMqFl9vmL8mRQF55LVx/7wEAJPm3DNFbIE0FIk8wbx8xVTmHMM1InCsR2Wg0r7x6nK5x4lcDGMiI1tt9hFIkBOZG4DJ7nF3rIJAjgSFtHAs1JWGu11MXm4wAJ6DJNei4a3E+cIF5ItQ5EshrNerWMs4k3xjq7FMASPfFmcApIx7N5Eggr7xWIDKIOoJTgXfYbIWcDuSVVz8aAefMMwqpjTZ8LGSj5qXN5xsvgHNYziCQVz4t18FriuKhCSsVbiKPIctrJW4+G39VJ1bdukInqCxhg8dNEbsAxZmKNtXbm36+WEU9xFKGr9Zu2MoUsIUwZzGDQF55rZOIJAJW7SYWddY6OZjTgbyGtQllxEevdQg6gdxAlFfe8KxfOff0ekgHMgjk1e8AEh0jUNAlPGdvgHI6cO5aB8QMAnnl1Q4im4DNYyqGyiCQ15qS+Q4r+tlgvEBOB/LKax3xH95uTIAzouvwWhUM5RJhXnm9HQxKA4IJiwSKrBPIK6/2qsFaPB0jOTixHsqEOR3IK6/eXYay1kulGQTyyos8TCKvvPLKIJBXXnmtV7VkJgbzYjGuwtE3oGnakPkNatKj7zsSOyOqaRBnJeYnMZfOFq4fh+UcCeSV1xqKBCbW+j7JIJBXXu2yYTEQyCXCvPJax1LpIoNAXpmUWr9dk3EqUbYcz2vVm3R0HTbtjBIA+2EkM2sdBHIkkFdezaBbEioZ8zkSyCuv9bH5tSESU0sH1BvEZhDIK6+13xAVh5POAG8OcYpyBoG88lplIEht3+eAfXH4yFp1F8qcQF55vT0aiF4CFXCE3DuQV17rdr0B7MsgkFderJtmOu8d0AVedSCQZxHmta6FQYvVLcgY2orFz7vAUUcKaiYG81ry1N4EfCvXoOIVamWiX2cEBEwddzqqey3HP28gzRZ6/qPw+vxcxE4SEVSWDhzK6UBey60GTAdydkY8KvDuu/UAJ7yMoY36vPvaHPC8iLyVQSCvnA4s/XXpiHv1RVEQwCTBXPQ14GELd8q1PHwkpwN5rdZJW4wJ5zELHACeAV5KIqAcCeSV1xJ780f5+eFsxktgB7B7rQ4cySCQ1zCUeDIm+6EDvA48KiJdSw/y8JG88qy/JYbZo55PV46w7QLPAg9aFFCJSJUjgbxWkjDD9bBnM5HhgK7vHjwIPADstyggpwN5raqRSM3aqRjEttthG6Rogy5AGkjL+O/9wP2WCqx5UjCnA6M38kpzWXTVDro6ec+n7d93A89aKtDNIJBXXsuvzFttINBEqOUrAr5PoLTHe4G9cQbBWtYH5HQgr2FFO6MWiVSW+1fAlwwEdK26CGUQyGvcG5JWylRUgSeArxEEQjV5FmFeeS29jBlHlXFy/8Eordp1D34FuNNbiamqZLFQXqu9yhEkB0/q9vMhcp/h8igRnjUnCMHKvec7gT8Rkf3A5HpJA8jE4FDaiNPylLYQZ6NeKeiZL8f/c5FAkQCcJA6/KV+wEq9dCV2Ck5yo/5fAC8BnCRWBEphby36CORIYvo/AOKsGdTHTi607rySU4LTP1yor9NwnXTRQEhqFfp1QFqzWGxeQQWAVx3ivEdVZzJ/7TgnsRO26ceT+5C/7UEsu9X1Lfz5WAY4aOP134PdF5MB6BYCcDqxsBOAda6sxBoKm9KWfqEdEpHYGHSTjvaokTO+VLjAgSNTOMrzjpgkdBTYAh4HPAf9NRA6pauGeawaBvJa9e64SER1Tljme0oWXNS8iZ46efRscRzDjfmedVBB0mSKAwgFO/PsHgd8GflVEDth10fXusJrXyqUBHYsGxr0sWC5ic3py8FngQdv4EQBK71vowGChiEQGiKoiIdkxANgN/Dvg3xsATOY7NUcCfRN7TSdfZL+bQklVPQs4Hziqqi8RHGtYoLdeRrjHXgckPkVVO7bJHwb+I/AI8P3ApQSisLA8vevaeDt9Hk5C+0hxD14l8ArwOPCbwF9aBWDK0gWJhqnrrTSYQaBPAEhvDLvpC0eSxRB5muBNdxPwCXs8jSBF/Q8i4l1qmvrsR/EG1B4GqYOYiSjBqedB4PPAzcDHgIsNEDY43qRyWn6fIvi/P+s6/7r2scmRl7XjAHYCXySIgeZEZNau6+xatxLPILB8IX2qfFNvMqGqW4BrgY8D1wOXAGcSrKpPBaaAvUYUqvEDC6VnNWNQIuyD50j9EkrgGRF5WlW/AFwO3AZ8GDgLuMA2c8cBQkypjjlQmnIAsJGTycfKTv5dwFft5H/eX7f1euJnEFh8KlBYN1ntvn4mcBlwHXCrbf4S2GI3aNeNtBb7+v516HykjhStY2qhqlhZ7jvAd+z9vBS4GviIAelmi6Qqt9Hj2uQA87AB7iHb/Hdb+rEDeDMOE3UcRF4ZBBbe8G7gxny8iVT1VOC9wJUW6n/AgGDabsRZ4C3LcdUx4XNjPNpaktNc00hpoWggplSOha+S9xtgr4i8AdxnEcJ5wBnAVtu8pxmQnmLv5wSBXDxq4LonfojILl+mdc+v6ofnySCwvjc/sVZtp/6cqnZU9SJgm534HyWQfZtss79JmFo74VhodeHsWpktkM7pO7654wZvAoMknapFpDZpbp0OM3Hp0j56DAG1n48/WySpWSQjtSF6kwF7HjIIrGVyrynMtZupstPjfOAa2/Q3Ae+yUylu6FnLUYuEQPP1bhkjo81FcwILKQYHtSW3TT7pyL1JExNVjvGPHAN+00dw6CX8Wc9VgHUFAnaq4Nn7HuRfZPfPtbz0/XbqXwO8w075SQtD513EEG/UbqJNx42zkiX02esab6TSHq9/3kqvXVWNOv8JY/bTUWhVr56EFIj6AYB+gcLuM0krRUvoHWEY0UpnjQ/9LFV1zr+h/gKr6kYL9W80Quq9wOmW50ep6RE79csGa6q6YXhF08CNGDYXDZUBSWSyq60X6Ke3IUY3hW1CScRArTdvwyboZ1BpZVGBeCFRTBlaDEQLn/sngIPdC02AoQ3WY+IOkl7RnL/OmvAfffMt6f3pXntjJLbcANFZK8Kd5OuxDNcUBWxU1SvtxP8k8D7b+BuTGvO8K2tJQ02/qR+gcj+z7rsmHWdQLMJUVXs4BjcJhE4q//l7oUfZVfv4fJDohgFkyNrwO3xkUa+W3Lyz1vL82AySkEIbLa/fRhCpfJTAQE8lJ0jMNycSTXu/NlmySJOLtQ4Kuoi25Kb3VBdK74wj8HLh0q5z7fogOpw8dt03NBWW4s24+yKmfZVtzrnk4NGWNOFteom4sZtOfx8lNYAZKwUInTUU+p9ECpmC712EmvM24FN26k+6PPKYmz9Hg2R1zVtLraaXwgI3tPSz4VV1glB+3WjX7VT7OJ1QtbmQIDzaYh+bLb2bdCPFCkcyFr5N2omQ5jhR3j1A0CEcAQ6ZDHyPAcVBQpnyIIEw3i8i8y38QceIz64hQdWvUUu/Jdl1AwIuxCyBbnwzVbVU1bMJIp7rCEq+9xPqy5K8XnWhvjh2X5N+93o5SbpEMVivY3AoEy+BOh33ZRv+FOBsglbgXQRtxruBi2zjn2qbfGPCD0gLb6Mteb32cHoi6aasXIRwxPFGbwIPqOrjBhIRHN4Ajhg4zMfXZlFLleoYVruk2RmzG0eMnCqtRXfeasNnAVcANxB06RfYjTJlF2fWhfiT7vPKbXhNogBdgldem12WDnkQxyhUbaKGIoJ3BPBJVd1sm/tce7zUNvpl9rjVNn3lOhCx6zvrKjf0IBD7nQaV/nyVgFbl1Itb3H11q0UN+wwADhPGnL+oqq8T7MyeA94QkZlE41Am4IUnSCPHstxlz844kH++acecarqqukFV3w/cYuH+1cA77eQ4bG/mfEME0HWnfu3CP29i4U+CxUQCkvTi9+ISFssnjHqvxUmVD7tu0W4ME2JdSajIbDXQvtgez7eNtdFthpi6HbPrqu7abbCPeXfNqgFmHRR9lnT9feN5htpAaM7+PWFRS2Upw1X2tY5FDTuA5y2t+B7wGPCq5xoMELSlglC457JkMBjVSMCXh0pnUYWqXkbo0vug5fjnW97XdVpyTRh8b3hZN5SVUtZ6qYRfW64rLSy0jJnCUF0zVUqKeR8/dRzNZuNnrrbrdqmd9hck5p+zbhrQmw15e51czwnXeVgnYbUOQNAOGiH4KDKmprW7DysHepX7O5sJJekb7d97CT4Hr6vqk4Teh50i8qonO1U1mtOUvTiExUiiOyN6mvgX0LUGk5sI3WbXcELIU7lW0rIhjEs3cd1QolqpzVclJNQ4WXP3uwpX/utauOpPszNU9QOEBqtttvm3EPoCogCrm5zcdSIAql1UJYlJizZEWovRWugSGqm0B2Bgm56Emyjc/os8R03oPflRYLeq3kvwX9huvRVHvFw6qisdHyapfqNfIOiMaM/+tOVal1qO/ykXJk66rrH4Gjot6rEFS04rODiz7Nebb4zD/0pV6yQNuMA2/CeMnH0Xga2PvExk3Q+4ykyUYse8usmCva2sWi+wCVd7sjQNB09TSuHT02MOHC4xsLzV3qP9wD2q+iXgPhHZ4wVRLjJo2Fr9AUFnGBvehyxJrjNpb8DH7E14r238ynWNzSSmlNoDAAYhgnI5cHFEn1qvxXUWqX3YUrXapWOx7j6XELT+fS97XLNe13UQl6aVAgYdYNSatti3xcejxhuovUcXG1H6I4TKw3eAbwJPA6+4SMCnJMfJxX6AoLOKN0wJTJqMt3KbfpOdFjcRpLsfJZhyTDnGt5t05nnBx7wjhJpO+6IPlj4DwKICAalMiPULwD90vRPdJJyfddevXoRUutf10hGf6yCDmNK6+zo2Tu13/Su3EErePwW8DtyuqncD94vIUWcEO+muUXfokYDz4ass7In133fbxr+ZE735OHKlaxu4aphUU7scq9sQPhZuwIT0IIF0CCO515rZa2k3ade1UZc9/P+kpX9gNYaR6Bj5ONSOdPS8yZRLjbcBPwHcraq3A/cbfzDndDML6g06Kxwqxs2vJoy4gGApdR3wIUO10+2FRfVVZHwnEja4iUBLG3bKJLwaJuOuTWlGg+KrcGA3riCwJTEMHXQjyxiZq6zWvdNtSFXVRb5CEEldCnyfEYo7gS+q6l3As6ajKd29VzdVdTorpQRzIf8Gy/Hf76yjzuaEb9y8O9k3Nai4euXvkkyv0YR40R4Eki7jRq+cs62vDKiz2W56vrjacsocj8uppYm+Qvt47jKGKViRkJJlkt7oMkYfKXmY/v54cMQ0eLcB8W0ETcJjwBdU9c9E5BW3Lws/O2JZQSCx3o5CnssICr4bCCWid9qpf8yh2WQS0veyk6YPRjidbrMap4028BQlJ4wwjiXTdvxjmSD+uJqQVC1h/1oZx64taZuvAHQStV+1hHRPW+53TZSSOP5g1gjFMwmVmQuB61T194wzmLGS4tv6DzrLWOJTVT3dQpNPEcQQVxLUYF3nwSdDatLRFcr3Pcp6H70tdlEOOCfcpjx4ssGTYBxPyaLh5lwLIX7c1HNJ1+FsogGpEtHQSlaepOUaTLoS7JnAD1r0/TlV/QMReTnxZFg8CKQlPtPu32B5yUftxJ9wJQ/vvFusgVMiNRaRZOb9JuA+4HaCz37XyNDacRd1ojgb1ypFqzHHGHgmVj20JJKE5n6Yib+GqR6km4jSVnvNute4yT5+DjhdVf8AeMw14OnAIOB69aM45J2W73/Kbf5ppwQ75vLlzgA54zis+Dpje+p+e71/AdwJ3EGwvO7ae9U1YPTS5SJJCWgYxDkuIKA9AKBpsGjT8NGVXhvsPpxNAKBIKlGHCQ1A+4zTOWBR7Ix7vj4iqAgK1rMIsuiznWS4diq/YYwW7ALnAH+PQMr/F1XdbumB9A0C9s0dTHxAkH3+MPBDhPLeRlcamnF5SqrVlzEfzV24aTmR13gNeBT4NvAA8KiIHPRuOi4H65rj7kTLFN1xlA7LgPLoYZqkHrL7Mg4viW3AB4GngBeNZNsNPEGYY3Ag0T6oAwE/cPY0OwSvJYilruWEdfrmpnbhVRwoi5uOddT28b2RH+gM0NE3b736nwF+klCj3JJYcc25kKkeoxBXelhMVUnZ8hhhus0uO+1vJ5RmimgmYWKNjqUB886vsEzGD0lD9+JakBnrEK9hlfhD+JN7yp3wuwgdfA8SWn1fB3anngZJydtXcbre9MSGqRwgdAd+1biwc+2g/AmLEsoh6UJiR+0m4NMGBHtV9XlgvtMi6S2cDTeqeobV9n+BIO4pnfvuVJInVY5EGYcIQBpuHI+gZ9hpcYgw1PI+4F7CpN0nXWdX1+VZXX+TuPpsmcibdQ3NJ5CGVEb70U4s4XVLEvbGkD86A027SGuvne4PEJpyHrcozoO9+Fw5EddoL/Vd0sAza5Lel1X1OUsvfgx4T8IHrSY4xvt8M2Eo7GvA74jIy50G6yJxzSGnEFj+vwn8uNvw+xxjWicIVzXId0f95u46EItpzQbLA+Omv9dunBdE5Jhr4BA36ooWq3NN0gFpyP/rMU6XenXzkZyg9GinXgpB23XRGm44zKPAQ3bqP2QRwKGk8UydXkXcTIPj9fi2QSYtIHh8KrOI7FPV/2r5+FWL9FtcLjCIlYOzjMv7mqru7rS8sVPWFPIzhEGb11go0XXil0mXB9bJCC8dA5ZYkzxt0vKmg8DLwD2EVs6/BHaZ+irabnfSIRe+BVpV0+5I6dNVqB5D7qROGPc6iaoWY3E+KPiUbj7hmwbWD9imf9wAYN6RsGIbe66PGQFtFuC0gb47TOPXzje+oBoi2KvjMQqCE9engZc7LR54lwO/ZATHRjsRjzg3FUnQXUbcObfpJCrc5u8ALwHftTz/EeB7InLQzbQ73YFgt1dnVsP/9TIrWQsVk6KP3vrF3PjSoEisEwHPKbbBn3GgvcM2/zGXkkm0o3OzBU7y/m/wsqiMC5N+jD+T71OL+s4F/q4RheJapbtDuOZe9RiJwq92nK9ZPOU+CPwLQivvbINWv5dh4yC+8qySnfpRVxqacV/fZxdiJ6E180HgSeCANy51r+OteEMug/Fj05DPcZ06pA0bVpcpj40eA5sshI/S8tiVuBf4op3699o13S0icxatlY6HTZVy2q8110KAb2lh4YCpNpC5HPhHduKeYvffZBI1r/aadO/x+cB5HZfPipF+/8wQYibxyJM+JsfQw0qLIYkmpuOEYXs8SNBW32+n/nPAy/7EcFWRagVJmtzC3PteKo3Eil2lp9q122NR2x3At4zs2x9NO61zrmzpH1kW6/SWKULx71WqerVxaDcYF3CGUxgOu2nKOzRVQNFxVYFLgL9PaEI45urhi+29lyGWpcRuoCjYiHXfu+3UeM5OkYN+IITrf1iJpqo6yRfTG6l2GvRx27DLpXHQxGBkxt6Tw8bTbCfoMR4isO+zDfMn68UeQgPYfMdpyJEDmrLy+dmE8vmNBO2+n1TtXZOG1SdSOwJ0o+3vwzFk2mwA8P1O7LPZeID5ZQgTl7Nrr1fOGev588Crlhc+bKf+/bbp52NO7zZodyUuSDyRLDyVhlQpzXfLNX66NxGImhBX4kL9x4zN/4aB9/PuunVUdZOz5tIkT9dlHqBauO7YykDnVIIPxvUWRb/fnvsG11A24cjI7pD1FHXi0/FyJAZLggDo087pFefh189JrwM6w+gAv1eT3nXcC4kCiDjE4Q13YnyTUB7a5YiaqmH227KOq070FqXlhseHazQ0cIy6y1Hlh4Okk3gXad82aVyNugnPXTt0XiSUZbdb5Pa6r5y4Dd51RB/LPKpLvKbLosMYycXpRjcRuvWuJZTcNAE6Ev2CjoggLqpe9xLk7a92jBy4zR6P2TdOJO2v/ZStdJl93bSlHDTr3IU32nN+1U6K7xC0+y+40eFpH/iynhZNqjL73V3n8DIFzCW5aj8t04yQLLhc4vX0luGH7EYs3cZ/lFCW3Q48LSKHnAtVo4HsCozkkuSjMoZ/0iTAtxDMcKIk+BSnlSkWGF7DiMjeo17gCeNUDnUIRoZX2wWJbGzZoy9/qWOuB/GA14ZQJjrU7iWUhL5pJ8YTZq0UFXxzvpurqWwXhTvLEQU4TqHrCMZLrR79ostZhfHyDYhhbdFjNHjTCC9J3IHFtU5vJCgu7yGUZR8GHhGRt1xJ1t+DugJj7KTBIclHix1gm6q+x8L8DxPEPr4cHoeQ+EEonREs+apLe2uCluIrhMoYMRI4yzbWaW4AxGJPdF3A7VUG+D0TSR/CMSP5tgNfsxtod/Rkt5vnbQq+FrJPFzvnzYX8pZMC14TGjCsJQoxbCCKrr6jqrxkvUIwp6RdfZwTOhWyx1LPPLoo4TCjF7rRT6GER2d1iSUcLkbpo8IzXzK5f108Ptn+Lzbi4AvhrhF789xH6ACYs3Zx3G79skJ6PWtlXHSFZuU7XL8dOwtQUUhLjTl2CU4wuQwh6zAl9XgR+j1APfppQFlJfz29Q8DGAoGfgcVuOJNpAaKW+xXLFK+y022BpSmk33FSD9oIx6gnQBYw3ou/dtLv5XgGetzz/foKQ5zXXbCXO965eyRHc9ntrU8QWLl2bVtWbjeD7OMEL80ynLzlG0In4/eL7RIqE8BylFfmyaOpzF/Dr1tfQAaqOhQaHLCLw3mXDkq+marrIDv+xtekecvVgHGEly0nwLcD4R9b3QrtpPmOfX2jv317LdWOKFXsGZu2xGGPjkF4E4in2+t+yBpWv2In/lKVqb7lUqWiosa8YACTAP6Oqmy3Uv9FC/Y9YJDzl3K6PpBxBEgE0jShbLqJXl+m6Rau7vXY9/qeIPBWl7xElXrOLVlt5cCIZ7jGsNUEQhfwO8IcxbHQ3j7oafzHo1JVFDkbt2EaP03VuJNSGSbont8RSJDAXT72keShNnaoR1QhoOlewIacWFy5/F/hTO/Ufj+WopsapluskywlcyfUr7ZS/2RF8FzuQ25zYiHmOqm6YLLWa7e0yACiriwK6BIHVnwG/ISIvJNOPpWMovdP8AVKL75VwRNE+Qs/SopP/DfxWrMuaq1EMGX1YXieCEV1Cjl+IyLz9e9KijfMIfRQfs8d326nXdfMQi0QVNuEqGCzQvdh28o5CteD4vRCvQfL/c3ba77dQc4eBQenSpZOitAVOe10GC3R/n5xq1+pagufeNtv4HddxqK4FOG35Llr6T9oAS5aRKNeGBqByAS/H2vF68xZJ/x/g8yLyugOH4wRvR0T2q+ofE8Ycne7MQGUIEUHtxElvEbTg85Fk6uOU1yRawKsA3WYvEnVaYSd2vGnjjIQr7NT/MGEkWuE4k5kWY1BNxqJXXjuQRi5j0DfQKPZyADwD/D/78MB6/HU7ff1KtJZLMqW3awTx2UbqxTz/PZyYfFwkY+qLhrC+jZAcRB4vy1Al81b0VUJANj23Odvkh4yE/W3gHhE55rQr835PdOw/vg38LvBPh+xw473bthL0C3eKyHMJD9BIUjmA8GBwUnOHCXe8+qvr5iNstRvn+4zku5igCtvs5Jb92LKlI7g2GTPOmNqqVU1GGAlzP+n68nWpxGwSxkvC8BfO+Kbrvm+jAfeHCA1w77FruslFbIuZRi0LDLZdqf2iLcKylKyvnAiotmjsG8BXReTRRL5OSqB3ojWSqv6WhUwfdkahqy1gETeDbYogY65V9TcIdeTDyU04kYRukmjxT3r+rvRUu41/jt041xP0EtsIsxGPWIhb9iGB7mWuWY/5qDF/UornXZzVfIx8Ft1l2aL8E8eleCFW7fQYpxJKsdcTpvHcZhu/dOnaXDL4VJZx4Gg/fSxLkdwXDfdXnRCVG+3kf91Ssz8EHjSvy9Jdl27T+91xJM+TwGeBX7FNUA1By+4n+swQSk1/wzbmXar6RYIseD+hV7zv3gYLR88maCLOJAxD+aCd9lcQOr06rpRS2s3kPRR1AIMQfwN0W3wFGCP/RRlAfNMapfXqzW8TYDkiC1davJog3rmFIOZ5n33P0SSHLpLekrrPacGrrfHXHq7BTU7N0eXrGME05R7gq4R+i9ftmnQcqdv6GjrJRbkD+NfAvyQ0RuiQugE3OM3CG5af/zzwAwSx0H5gj6q+ROgIfMnetCknbNlgCLnRiKHTgIuMuT/bIoCtzmJ63vWpd1om6yxEBC3naTBqgiHtJbDqZ/rtIiODaM4xDZyrqlfZaf9hI2hPdYdGNzkty4awvxhDnwY/Watr6c1Rgl7mMeALhPL5a04013pNek4gEpFZVf2yvaH/yTbNkQZNtKxwDlq6GX0xH58xlv6dRhTO2HM56gwnpp37URoC4jzoqqRJqk7IoX5JH2nJ3RZy3Bk3EKiXyUxlMdLeCVW9lTDb4iq7B8519vaHnCpxypG34zS7oSm9rBoIy9gi/yih5LfdIvhdBpSxC7M7yLXqJATMhAHD3cBPA/8W+KTbcCSTW8qWjVA0OBH1qnFKS8+z35zdhFwT53W4taHZaSppHIq9B/MNG3Wi4ZTo1/hDezQFxbBt0LB7uZqulirzXvZwOEkL4jWKYqp4P20wUu8TRvJd5gi+OTfnMZ1AXSc2WouJ2pab5RcGr8BMu2a+OLH7LQKB/x37eNoiYg+Y1WLUsp0G1Vd8Ax8jTC35aeAXCeXDrsuRy6TcIskstmoRF6HJnKLqYV2e+hrWLWOkSEZI1Q0TYIsBHX/KxFlZW7zxJkbYe3H1j7yTmf6ZpG/gSjt0Pmo5/jnJgM+jPUbZactosXFKuTa4MqDaxn+I0CR3v238PRaVzbdUaXSxPnw4FjbaEiMib6jqrxHERD9vedgWJ63UhtppWw28Xw36IO216elZ9vkz0tBh1XQK95oL0F1AxaWOnOqyNmYvLrXNOpUIb7C8/mKC9PpWy/E7ycTquWRsmy6C3Bs1zYXfEzEanSO0xb9OKPN9E/grYCZWxqytWRIVpC7Ut9CkgG0dSNrwTZMi8g1VfdAu0g8QOqzOcH+0m4xNLnqILZYys10HrOX2Iuqkh9qqXmTrtLS4Gq+F2YuLOe3LBkOXCTtIriUoMG8mlPZOIzg/bWiYcJy2JxdjWmqdb0ijI3cVB6PcQ2D7d1pPTMd4kQlTskZfijSS1QWqLK1pQqcP9J43ueibwBdU9S8IzRafsXztEhcaR8Ju1s17k5aQf7lz17ohPRk0V0s97vo5DbVPz7xqHQHAcd292/wXEEw3b7L7Z5ubFXDIcuDphBTD5cUk037HDVjnXXQTp3XvInhiPGlh/5PAq+aYNGUA0I3DbpruubT2n6pqU0v0viKBpqEK9sujvPaYiHxdVe8i1Gc/5IYwnmnh3KEkl29riNABQ3/t8XO98nlpEBJ5OWavFKRIeIRepb/afb+XeZbrYOMXzo0n1vI3q+q1hEarmwlKzFMIZduuk15vcumVtpRkR8nNWvo8AMRJlWft/niDwOo/Zo/PErQvOLdiL4DTtO+ilxlOGwD0zQm0TVUx9lGdxLZjeco9wD02YOESQ/cPEEo55xuyx8aaWee6KskGkz6MRNu02/2mDGXi6lu0KQuTULTNcl1a0gGfBnQbTrU1t+zGiyf+pKpeYyTfbXZIXOgk1AcJPSHvcBFSt4UE1gU2/bCAQHv4KNaJ+rUieGG8aqH+fYTuysNuuE1bakqy+XUhe7WGEXdLA4EmQHCliMJcigvCwI4ICKfZRX+fEYnXGPGz1Rk0HHGTfyrX9FA6Ii11Z60WOClkAXlv3fKoLfZYNDgZS8JWd1zpsUNz+VJ6+PNJQg4Nazy59BFBSZpfxq5CG1i7jdBkda2F++cSatozrrQbhWDaYiMny2BUuxoAMOsqP74TccYx/LOccLn+LsH38jUR2Ru5ESP5KkubfOlUG2zr6qRxK50dWidg0LdxTmcJxgwVcNiInklVnRKRWTei+WFV/RNCmedyuzk+SpAkn+tqxIUTeRxyfui1A4OFRjq3+d1pUjrSBuvrNCrp8PYx15oYr2qDzkBa3tv5Veg4G1YKoHb9f5hQRr7AGYjO2+avW3gabSBg+/VfHKYaM3onFJbG+FB/g5369xPaqncSSnr7ou28m2M5P8B+00X+HysCAg1/bD6ynn6suTHCh1X1WRF5RlW/Zhv8HIsSPmCcwiX2tSlHAEVV32RyUjc1UjQRg9Ky8VLWvmg4gbVhOKj0AJi0Pt1xBpTRpWmuYUgGY95UFFuET7frGZ2pjvQI43WFbM9Wu54/4dLcowQLtZ0W8n/dmP03W8xuugOIqVjNeX3LKfXUJHScsNBkzm6QZ4FnVfVPLVy8iNC9d5VFCRfYDXWaA5RO4uKqDTqFTvJ6dAGCr04+pMcg014nkLhehyLRSczbTdJlPPXr9Cma2uDq+ZJERoPMpBi0MWu1NRIT7t7bR7Ds2g58mVDie5MTTWgMMs2q302/0JSkAaYorQwItJB3801GGvYEDxFKJI+4FzFFkIxeZhHCecYxvNNA4wxjmCeSRp9YX55xstImFWCRdJR5P/yygfQrkxu5bghpowHKGwShxyxB7PEKQexRr6LX37DsrDvuPRxEXCRD8t/rJTyrHU9VuFR1nqDbf4xgeHuvEZ1+w8825fJNm9xv0kHC9wEnYq8+CLgNL25qTGoBpokPv78AcyKSAsMW2/gXWqRwHqEUGQ0/NlrksNUeJyyVmHYbe74hfy+T7izffx5vhNikNOtIrmjOOkvoaozs7x6r87ZNb4oh9GI3xyjWxlf7pFZWtlEqbVw7aOC+g2Bz/xihpDfjyN+5Ni+EholTI7c6K1QyqhMr6eNuMNHf3Xelue8VJ4WMA0WPWCnlYFJPTcUpm1x78CbXRrzBnVSlQ3d4+2CTOVfOjMBw1P72W5bOHDUgmG1q1XROuqUb31U3OR/1UDnqGJGFukgBmCxjiU4XGUlpw3yF6D34GqGRbodFc0+6kl7HRZDVIkRkK+asvBij3c4K14/rJL8u/TBQHzEk31up6lsNYpQyyd+Pl+tcVWLVxDGJfNOf9nEQiSzgQVA29FbUC3jcrVQYTA8bq4XC+7TishpzKRbTz5BWfYpkOs/zwDOEOv637NQ/EA8JN2C2db5gMouSpQy4Wcz/jUQ60MRymhVV1xNk3ppqIeWTu3BV2xuSRBOL6VmQPppSNNXCDwiEC/nUSVKKrBcQLDFiFmTVEFR7g7QCVw1uwl2C4/Yf2aZ/2ur5s661uUrs6WhQ8Wlax1+uTT+W6cBiDSWX4fcvKgRbKbOMPn6vtqjOpKWhSUYwXdARmbirfUQMMX8/Zqf+vQRH3scNCOJU7o6L8uqma+ndo1fTbGUsQWBEJa6jsrotHXLSMP9BGkRKo2iDNQpgIA0eF2oNOjs5MQj1WT8VyZWhZxMb877updWYgJVBYO2uwsmQxWkJ6hYGuxyyi7E2jBxfLSa/TbF5zL1v3pnnFUKH3kN28r8C7HFNTlOJpXo9SH1/hA+YDAKMh6dc3cA5FK6ngobOySJRKRYDCHPW4vvoOzVP4UTDzpMEIc+D9rE3sab3XFOdkLnramUQYOhqu4lklFnpwKBMBE3aAhw6RL5gNTgBbZmAHKOA/QTtxmsE/72HLOzfFS3M3MASWej5j2tYn0FgzKgJO3HeImgONrk+gy4nT/NJ/fKLhuamUeAHipZBGcux6SdcV6kHyjnb8A8TSnqPA08ZaTeRVI0KF+5rw0Cak8akrydAyCAwXIHNk8C/Af46of328sRp+agzSJUGN+SFfBj63YyywmOzGNB0tnRhfsdFSpG420Ww4nqY0K33oojsc6PqUsNRNS2JNk06Ssp6S67xZxDIqx8C6bjfnoh8TVW/SejHfz9wA8GB5wKCF9+xhmnR3qOg7mNWXT8ejAxhxmGxwP/FU3+W0Hj2GCe8+HYS5LwTlsuXmH5jqXn9ekoFMggMqQ/f3WS185HbDmxX1c8THHivNWC41v691fU3+HLipCPI6hY5LCNUviOp32ti2BJf0xRhstT3CNLd7Rb67xGRo860tGoI8XU9EnwZBMYTCI6H+AYGAAdFZAeww2YnnkEwYfk4wcfxcoI110bradhv13G6odOxlyWXDLEi4qfozrtZFh3jSJ6yk/6O6MHn6vlFIuSpR0l9l0Egr0FDzcop0rquJyF+zx4R2Q18z4xdzyGYsNxEsH1/N6GT8hQnga1Y3HBNWcV7birZ/JUB2j3AnQSG/2XjRDrO27Jwswklb/wMAmsFEHwnZelGbotvyzZxyy77uFNVfxO4juDr9wmC/8JptsE2OUejxbo7r8QYs8JVPbDW6x2EOv63Ld8/YB4UsfW8GgNPhQwCeS19Go9t+Krh/9SN5y6dGm6viHwd+Lqq/i+CxdetBNu2ayw62OxML6sVmn8gPYRPONcnP2HnAIHV/0sDgUMuz5/0JdHkPaqXMx3L0UMGgWFGAL1uZm1oTqmcC+3xKbzxlLTBMHcDd6vqJuMObrDHawh2bRFEDie2aoOMe2uzXicROEWg2WAb/y3L83dYqP9dEXmq5b2ZW0kGf7FuPmu5pyWDwIjyBf6kcmCgyYCK0urafkMeFZE7gDuMbLzeIoRtBOv3ywjse9c1y5QtjsmDpARdi1ImCeYrM7bpn7SNfxehc68E5rzd3EIbYL0p+DII5PW2dtXUpSnpLHxb56Ft/mlzP7oPuM/mQVxqPMKVFinEeRB+OEzRYwZgGwDE+YJHLa//FqGWfz/wjPXmT3Jy52TfLbgZADII5OjASVrjqZ94FdbOoUlNfxDlyVNGLB6wjfmAqp5qQHAFgVi8nuD4vIUTHvq1Eyp17XdO40g7TvQ/PEeYoHsPgeR7SERediW9tCEqrxEclZwX4zXxt8GfXpKZALXzazyp7yDRy08ZEFxOmBl4I8EG/jQ72ZUg2vll4E8jQLh0ZZJQppwkkJWzrjdfkhZdXWhCbl4ZBPJaghVVMppKUiVd4tdY+KnBDhAus7ThRsLo8IsIZOQvA7/fTx7vhE9927DllUEgr2UAgobo4G0nf0OpUlsm2k4RxElXEaZNf9tMOIv099mm18SDMZ/0Y7L+P3JOF1K5w6/vAAAAAElFTkSuQmCC';
function psLoginShow(on, boot) {   // my own PS5 start screen: the PlayStation logo on black, dark blue bokeh, golden dust, the spotlight, then "Press the PS button on your controller" with the pulsing ring
  if (!on) { if (pslAu) { const au = pslAu; pslAu = null; const v0 = au.volume, t1 = performance.now(), fo = () => { const k = Math.min(1, (performance.now() - t1) / 1400); try { au.volume = Math.max(0, v0 * (1 - k)); } catch {} if (k < 1) requestAnimationFrame(fo); else { try { au.pause(); } catch {} } }; requestAnimationFrame(fo); } if (pslRaf) cancelAnimationFrame(pslRaf); pslRaf = 0; if (psl) { psl.classList.remove('on'); setTimeout(() => { if (psl && !psl.classList.contains('on')) psl.hidden = true; }, 900); } return; }
  const intro = $('#intro'); if (!intro) return;
  if (!psl) {
    psl = document.createElement('div'); psl.id = 'psl'; psl.hidden = true;
    psl.innerHTML = '<canvas></canvas><img class="psl-big" alt=""><div class="psl-warn">PHOTOSENSITIVE EPILEPSY: IF YOU HAVE A HISTORY OF EPILEPSY OR SEIZURES, CONSULT A DOCTOR BEFORE USE.<br>CERTAIN PATTERNS MAY TRIGGER SEIZURES WITH NO PRIOR HISTORY. BEFORE USING THIS PRODUCT, CAREFULLY READ<br>THE INSTRUCTION MANUAL.</div><div class="psl-txt">Press the PS button on your controller.</div><div class="psl-disc"><i></i><u></u><div><img alt=""></div></div>';
    psl.querySelector('.psl-big').src = PSLOGO; psl.querySelector('.psl-disc img').src = PSLOGO;
    intro.insertBefore(psl, $('#sign'));
  }
  psl.hidden = false; void psl.offsetWidth; psl.classList.add('on');
  try { psSfxLoad(); } catch {}
  try {   // the real PS5 startup sound and login-screen music
    if (pslAu) { pslAu.pause(); pslAu = null; }
    SND.hold(true); const au = new Audio('ctheme://img/startup-psaudio.mp4'); pslAu = au; au.preload = 'auto'; au.volume = 0;
    const st0 = boot ? 0 : 8, go = () => { try { au.currentTime = st0; } catch {} au.play().catch(() => {}); const t1 = performance.now(), fi = () => { if (pslAu !== au) return; const k = Math.min(1, (performance.now() - t1) / (boot ? 600 : 1800)); try { au.volume = .14 * k; } catch {} if (k < 1) requestAnimationFrame(fi); }; requestAnimationFrame(fi); };
    if (au.readyState >= 1) go(); else au.onloadedmetadata = go;
    au.onended = () => { try { au.currentTime = 8; au.play(); } catch {} };
  } catch {}
  const warn = psl.querySelector('.psl-warn'), big = psl.querySelector('.psl-big'), txt = psl.querySelector('.psl-txt'), disc = psl.querySelector('.psl-disc');
  const cv = psl.querySelector('canvas'), cx = cv.getContext('2d');
  const W = cv.width = Math.min(2560, Math.round(innerWidth * (devicePixelRatio || 1))), H = cv.height = Math.round(W * innerHeight / innerWidth);
  const rnd = (a, b) => a + Math.random() * (b - a), cl = (x) => Math.max(0, Math.min(1, x)), ss = (a, b, x) => { x = cl((x - a) / (b - a)); return x * x * x * (x * (6 * x - 15) + 10); };
  // golden dust: a band across the lower middle, denser to the right, sizes from pin-pricks to big soft discs
  const dust = Array.from({ length: 260 }, () => { const big = Math.random() < .12, small = Math.random() < .68; const x = rnd(-.05, 1.05) * W; return { x, y: (.62 + (Math.random() + Math.random() + Math.random() - 1.5) * .2 - (x / W) * .1) * H, r: big ? rnd(7, 15) : small ? rnd(.7, 2) : rnd(2.5, 7), vx: rnd(-.12, .12), vy: rnd(-.16, .06), a: big ? rnd(.12, .28) : rnd(.35, 1), ph: rnd(0, 6.28), bk: !small, w: Math.random() < .12 }; });
  const blue = Array.from({ length: 9 }, () => ({ x: rnd(.1, .9) * W, y: rnd(.1, .9) * H, r: rnd(.12, .3) * W, vx: rnd(-.1, .1), vy: rnd(-.08, .08), ph: rnd(0, 6.28) }));
  if (pslRaf) cancelAnimationFrame(pslRaf);
  let beam = null;
  let t0 = performance.now() + (boot ? 1e7 : -14000);   // for the first start the picture waits for the sound to begin, so the two start together
  if (boot) { setTimeout(() => { if (t0 > performance.now()) t0 = performance.now(); }, 2500); try { pslAu.onplaying = () => { if (t0 > performance.now()) t0 = performance.now(); }; } catch {} }
  let dim = 0;
  const frame = (now) => {
    if (!psl || psl.hidden) return; const t = (now - t0) / 1000;
    const logoA = ss(.3, 1.8, t) * (1 - ss(2, 3.8, t)), discA = ss(2, 4, t) * (1 - ss(6.4, 9.6, t)), warnA = ss(2.6, 4.2, t) * (1 - ss(5, 6, t)), blueB = ss(4.8, 6, t), dustA = ss(6, 7.4, t), spotA = ss(6.2, 9.4, t), uiA = ss(9.6, 11.4, t), blueA = discA;
    cx.globalCompositeOperation = 'source-over'; cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
    const bg = cx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, 'rgba(15,17,28,' + (.25 + .75 * spotA) + ')'); bg.addColorStop(1, 'rgba(30,28,36,' + (.2 + .8 * spotA) + ')'); cx.fillStyle = bg; cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = 'lighter';
    for (const b of blue) { b.x += b.vx; b.y += b.vy; const g = cx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); const a = (.05 + .11 * blueB) * blueA * (.8 + .2 * Math.sin(t * .5 + b.ph)); g.addColorStop(0, 'rgba(40,90,190,' + a + ')'); g.addColorStop(.85, 'rgba(40,90,190,' + a * .8 + ')'); g.addColorStop(1, 'rgba(40,90,190,0)'); cx.fillStyle = g; cx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2); }
    // floor glow
    { const g = cx.createRadialGradient(W * .3, H * 1.02, 0, W * .3, H * 1.02, W * .5); g.addColorStop(0, 'rgba(95,112,130,' + .34 * spotA + ')'); g.addColorStop(1, 'rgba(95,112,130,0)'); cx.save(); cx.translate(0, H * 1.02); cx.scale(1, .28); cx.translate(0, -H * 1.02); cx.fillStyle = g; cx.fillRect(0, 0, W, H * 1.3); cx.restore(); }
    // spotlight from the top left: a wide soft cone plus a fainter second beam
    { const sx = W * (.16 + .01 * Math.sin(t * .3)), sy = -H * .06;
      if (!beam) { beam = document.createElement('canvas'); beam.width = W; beam.height = H; const bx = beam.getContext('2d'); bx.filter = 'blur(' + Math.round(W * .02) + 'px)';
        const cone = (x0, ang, spread, len, a) => { bx.save(); bx.translate(x0, sy); bx.rotate(ang); const g = bx.createLinearGradient(0, 0, 0, len); g.addColorStop(0, 'rgba(225,200,185,' + a + ')'); g.addColorStop(.5, 'rgba(190,165,155,' + a * .35 + ')'); g.addColorStop(1, 'rgba(160,140,140,0)'); bx.fillStyle = g; bx.beginPath(); bx.moveTo(-W * .02, 0); bx.lineTo(W * .02, 0); bx.lineTo(spread, len); bx.lineTo(-spread, len); bx.closePath(); bx.fill(); bx.restore(); };
        cone(sx, .03, W * .17, H * 1.2, .26); cone(sx + W * .02, -.5, W * .09, H * 1.3, .1); }
      cx.globalAlpha = spotA; cx.drawImage(beam, 0, 0); cx.globalAlpha = 1;
      const g = cx.createRadialGradient(sx, sy, 0, sx, sy, W * .2); g.addColorStop(0, 'rgba(235,210,195,' + .3 * spotA + ')'); g.addColorStop(1, 'rgba(235,210,195,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W * .5, H * .6); }
    for (const d of dust) { d.x += d.vx + Math.sin(t * .4 + d.ph) * .08; d.y += d.vy + Math.cos(t * .3 + d.ph) * .05; if (d.x < -20) d.x = W + 20; if (d.x > W + 20) d.x = -20; if (d.y < H * .25) d.y = H * .95; if (d.y > H) d.y = H * .3;
      const a = d.a * dustA * (.65 + .35 * Math.sin(t * 1.1 + d.ph)); if (a < .01) continue; const col = d.w ? '255,250,235' : '245,185,110';
      if (d.bk) { const g = cx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r); g.addColorStop(0, 'rgba(' + col + ',' + a * .35 + ')'); g.addColorStop(.8, 'rgba(' + col + ',' + a * .55 + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); cx.fillStyle = g; cx.fillRect(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2); }
      else { cx.fillStyle = 'rgba(' + col + ',' + a + ')'; cx.beginPath(); cx.arc(d.x, d.y, d.r, 0, 6.2832); cx.fill(); } }
    big.style.setProperty('opacity', String(logoA)); warn.style.setProperty('opacity', String(warnA)); txt.style.setProperty('opacity', String(uiA * (.82 + .18 * Math.sin(t * 2.6)))); disc.style.setProperty('opacity', String(uiA));
    pslRaf = requestAnimationFrame(frame);
  };
  pslRaf = requestAnimationFrame(frame);
}
let signPressWait = false, psRevWas = false;
function signReveal() {   // PS button pressed on the login screen: the sign-in page opens over the same background
  if (!signPressWait) return false; signPressWait = false;
  const el = $('#intro'); if (el) { el.classList.remove('signbg-wait'); el.classList.add('sign-revealed'); }
  if (padKind() === 'ps') psSfx('enter'); else { try { SND.play('tab'); } catch {} }
  return true;
}
function introNext(auto) {
  if (!auto) return;   // cannot be skipped by any button   // boot animation/video -> sign-in page (A skips the animation)
  if (!introOn || introStage) return;
  if (!auto && Date.now() - introLast < 450) return;
  introLast = Date.now(); introEnd = Date.now();
  const el = $('#intro'), v = $('#introv');
  introStage = 1; document.body.classList.remove('introplay'); if (padKind() !== 'ps' || (settings.signBgVideo)) { SND.hold(false); try { SND.startMusic(); } catch {} } setTimeout(() => { try { v.pause(); } catch {} v.hidden = true; introGLStop(); }, 2800);
  { const v0 = v.volume, t1 = performance.now(), fo = () => { const k = Math.min(1, (performance.now() - t1) / 1500); try { v.volume = Math.max(0, v0 * (1 + Math.cos(k * Math.PI)) / 2); } catch {} if (k < 1 && !v.hidden) requestAnimationFrame(fo); }; requestAnimationFrame(fo); }   // the sound eases out while the picture cross-fades to sign-in
  signRender(); try { signBg(true); } catch {}
  try { const sv = $('#signbgv'); if (!(sv && !sv.hidden) && window.__bdHold && window.bdHold) window.bdHold(false); } catch {}   // the live wallpaper stays paused while the PS5 video plays, so the video never competes with it   // v916: the live wallpaper starts on the sign-in page as soon as the startup video has finished
  el.classList.remove('boot-on', 'has-video'); el.classList.add('press-on');
}
let homePrepped = false;
function prepHome() { try { prewarmHeroes(); } catch {}   // v948: the dashboard is rebuilt while the 'Signing you in' picture sits still and the dashboard is still invisible, so the heavy work never freezes the fade
  show('home'); document.querySelectorAll('.topbar .an, #screen .an').forEach((e) => e.classList.remove('an')); { const m = $('#screen'); m.classList.add('xf'); m.style.animation = 'none'; }
  { const hv = $('#hero .hv'); if (hv) { hv.classList.remove('on'); try { hv.pause(); } catch {} } if (lastHero) refreshHeroFor(lastHero.id); }   // the first game's trailer starts fresh now, art first
  homePrepped = true;
}
function leaveIntro() {   // you picked a user: fade into the dashboard
  if (!introOn || introStage !== 1) return;
  if (padKind() === 'ps') { psSfx('select'); setTimeout(() => psSfx('home'), 500); }
  try { signBg(false); } catch {}
  try { SND.hold(false); SND.startMusic(); } catch {}
  if (window.__bdHold && window.bdHold) window.bdHold(false);   // safety: the moving wallpaper is always back by the time you are in
  introOn = false; document.body.classList.add('intro-rise'); setTimeout(() => document.body.classList.remove('intro-rise'), 2800); document.body.classList.remove('introplay', 'intro-on'); introEnd = Date.now(); setTimeout(() => { try { api.introWait(false); closeMenu(true); } catch {} }, 250);   // v952: nothing heavy runs in the same moment the dissolve starts
  
  const el = $('#intro');
  el.classList.add('leave');   // 'signing' stays on so the sign-in tiles and title do not pop back while the page fades out
  try { const iv = $('#introv'); if (iv) iv.pause(); } catch {}   // v941: no black any more: the sign-in page fades away over the live wallpaper while the dashboard fades in
  if (!homePrepped) prepHome(); homePrepped = false;
  const unfocus = () => { try { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); } catch {} };   // no selection outline while the black is still fading away
  unfocus(); [100].forEach((t) => setTimeout(unfocus, t));   // v1071: the first game is selected right away, no waiting for the sign-in page to finish fading
  setTimeout(() => { el.hidden = true; introGLStop(); }, 900);
  setTimeout(() => { try { const h = document.getElementById('hero'); api.lagLog('wallpaper check on home (' + Math.round(performance.now()) + ' ms after the page started): hero opacity ' + getComputedStyle(h).opacity + ', body ' + document.body.className + ', ' + (window.bdReport ? window.bdReport() : '')); } catch {} }, 3500);
  setTimeout(() => { const bt = document.querySelector('.xn, .xbig, .xq, .bigtile'); if (bt) bt.focus({ preventScroll: true }); }, 220);
}
/* ---------- sign-in page ---------- */
function signUsers() { return [{ id: '', name: profileName(), av: settings.avatarFile }, ...settings.profiles.map((p) => ({ id: p.id, name: p.name, av: p.avatarFile }))]; }
function signRender(focusSel) {
  if (!settings.profileSet && !pc && !rmDone) { if (rm === null) rm = 0; rmPaint(); return; }   // a brand-new install: the read me first
  if (rm !== null) return;
  if (!settings.profileSet && !pc) { profileCreate(true); return; }   // a brand-new install: the name and picture come first
  if (pc) return;
  const users = signUsers(), psSign = padKind() === 'ps';
  const u = (x) => `<button class="sg-u${x.id === '' ? ' me' : ''}" data-nav data-sgu="${esc(x.id)}" data-sgname="${esc(x.name)}"><span class="sg-pad"></span><span class="sg-av" data-avf="${esc(x.av || '')}">${esc((x.name || '?')[0].toUpperCase())}</span><span class="sg-n">${esc(x.name)}</span><span class="sg-opt">${padGlyph('START')}<b>Options</b></span></button>`;
  $('#sign').innerHTML = `<div class="sg-bg"></div><div class="sg-clk"></div>
    <div class="sg-title">${psSign ? 'Welcome Back to PlayStation' : `Welcome${welcomeFirst ? '' : ' Back'} <b class="sg-tn">${esc(profileName())}</b>`}</div><div class="sg-sub">${psSign ? 'Who\'s using this controller?' : ''}</div>
    <div class="sg-wrap"><div class="sg-row"><button class="sg-u sg-add" data-nav data-sgadd><span class="sg-pad"></span><span class="sg-av plus">+</span><span class="sg-n">${psSign ? 'Add User' : 'Add new'}</span><span class="sg-opt"></span></button>${users.map(u).join('')}</div></div>
    <button class="sg-power" data-nav data-sgpower>${ICON.power}</button><div class="sg-sel">${padGlyph(settings.binds.confirm)}<span>Select</span></div>`;
  $('#sign').classList.toggle('pss', psSign); applyAvatars(); tick();
  const t = (focusSel && $('#sign ' + focusSel)) || $('#sign .sg-u.me');
  if (t) t.focus({ preventScroll: true });
  signCenter();
}
let signLast = null;
function signMove(cur, dir) {   // left and right go between users; down reaches the power button, up comes back
  const tiles = [...document.querySelectorAll('#sign .sg-u')], power = document.querySelector('#sign .sg-power');
  const i = tiles.indexOf(cur);
  if (i >= 0) {
    signLast = cur;
    if (dir === 'down' && power) power.focus({ preventScroll: true });
    else if (dir === 'left' || dir === 'right') { const n = tiles[i + (dir === 'right' ? 1 : -1)]; if (n) n.focus({ preventScroll: true }); }
    return true;
  }
  if (cur === power) { if (dir === 'up') (signLast && document.contains(signLast) ? signLast : tiles[1] || tiles[0]).focus({ preventScroll: true }); return true; }
  return false;
}
function signCenter() {
  const row = $('#sign .sg-row'), t = document.activeElement;
  if (!row || !t || !row.contains(t)) return;
  row.style.transform = `translateX(${Math.round(row.offsetWidth / 2 - (t.offsetLeft + t.offsetWidth / 2))}px)`;
  const tn = $('#sign .sg-tn'); if (tn && t.dataset.sgname) tn.textContent = t.dataset.sgname;
}
function signingIn(id) {   // the black "Signing you in" moment before Home, like the console
  return new Promise((res) => {
    const u = signUsers().find((x) => x.id === id) || signUsers()[0];
    const d = document.createElement('div'); d.id = 'signing';
    d.innerHTML = `<div class="sgn-av"><i class="sgn-ring"></i><span class="av xl" data-avf="${esc(u.av || '')}">${esc((u.name || '?')[0].toUpperCase())}</span></div><b>${esc(u.name)}</b><small>Signing you in</small>`;
    document.body.appendChild(d); applyAvatars(); { const it = $('#intro'); if (it) it.classList.add('signing'); } requestAnimationFrame(() => d.classList.add('on'));
    setTimeout(() => { try { if (introOn) prepHome(); } catch {} }, settings.motion ? 80 : 100);
    setTimeout(() => { holdTr = Date.now() + 3200; res(); setTimeout(() => d.classList.add('co'), 200); setTimeout(() => { d.classList.add('out'); d.classList.remove('on'); }, 800); setTimeout(() => d.remove(), 2600); }, settings.motion ? 600 : 300);   // 1) the picture and text fade out on the black, 2) then the black clears to show the dashboard (which is already there, still, with no trailer yet)   // the dashboard is built under the black first, then the black fades away on its own   // the dashboard is already behind it: the black fades away slowly instead of cutting
  });
}

/* ---------- the profile creation page: name + a gamerpic (or your own picture), shown on the first start and for "Add new" ---------- */

/* ---------- first-boot read me (shown once, right after the startup video, before the profile page) ---------- */
let rm = null, rmDone = false;
const RMI = { lib: '<path d="M5 4v16M10 4v16M15 5l4 15"/>', pad: '<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M8 10v4M6 12h4"/><circle cx="16" cy="11" r=".8"/><circle cx="18" cy="13" r=".8"/>', film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z"/>', app: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>', key: '<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H21M18 12v3M15 12v2"/>', mouse: '<path d="M6 3l12 8-5.5 1.2L10 18z"/>', user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>' };
function rmPages() {
  const ic = (k) => `<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${RMI[k]}</svg></div>`;
  const card = (k, t, s) => `<div class="it">${ic(k)}<b>${t}</b><span>${s}</span></div>`;
  const step = (t, s) => `<div class="rst"><div>${t}<small>${s}</small></div></div>`;
  const key = (g, t) => `<div class="k"><i>${g}</i>${t}</div>`;
  const b = settings.binds || {};
  return [
    { k: 'Welcome', t: 'Welcome to your console', s: 'This short guide shows everything to do once so it all works. It takes about five minutes.', body: `<div class="grid g3">${card('lib', 'All your games, one place', 'Games installed on this PC show up on their own, and you can sign in to your stores to bring in the rest.')}${card('pad', 'Made for a controller', 'Everything works with a controller. Plug it in or pair it over Bluetooth.')}${card('film', 'Art and trailers, automatic', 'Covers, backgrounds, logos and trailers are found for every game by themselves.')}</div>` },
    { k: 'Controller', t: 'Connect your controller', s: 'Use an Xbox or PlayStation controller, wired or over Bluetooth. The console finds it by itself.', body: `<div class="btnrow">${key('A', 'Select')}${key('B', 'Back')}${key(esc(b.remove || 'X'), 'Remove')}${key(esc(b.search || 'Y'), 'Search')}${key('LB', 'Previous tab')}${key('RB', 'Next tab')}${key('Xbox', 'Opens the guide menu')}${key('Start', 'Options')}</div><div class="sub" style="margin-top:2vw">On a PlayStation controller, ✕ is A and ○ is B.</div>` },
    { k: 'Games', t: 'Sign in to your game stores', s: 'Do this once for each store you use. After that the console remembers you and keeps your library up to date.', body: `<div class="steps">${step('Open Settings', 'Choose the gear on the top bar')}${step('Pick a store and choose Sign in', 'A normal login page opens, and the controller moves the cursor')}${step('Repeat for the other stores', 'Your games appear in the Library')}</div><div class="logos"><em>Steam</em><em>Epic Games</em><em>Ubisoft Connect</em></div>` },
    { k: 'Trailers', t: 'Get trailers for every game', s: 'Trailers play on each game page. Download them all in one go so they are ready.', body: `<div class="steps">${step('Open your Library', 'Choose Library on the top bar')}${step('Choose More, then Download all trailers', 'It finds a trailer for every game')}${step('Leave the console open for a while', 'It keeps going in the background, and never while you are in a game')}</div><div class="it" style="margin-top:1.6vw"><span class="tag">GOOD TO KNOW</span><span>Trailers can take a few GB of space.</span></div>` },
    { k: 'Apps', t: 'Apps and music', s: 'Websites and apps like YouTube and Spotify open inside the console. Sign in once in each and they stay signed in.', body: `<div class="grid g3">${card('app', 'Browse your apps', 'On Home, choose Browse your apps to open or add apps as tiles.')}${card('key', 'Sign in once', 'Open an app, log in, and it remembers you next time.')}${card('mouse', 'Controller as a mouse', 'Inside an app the sticks move the cursor and A clicks.')}</div>` },
    { k: 'You', t: 'Make it yours', s: 'Everything about the look and your profile is in Settings. Next you will create your profile.', body: `<div class="grid g3">${card('user', 'Profile', 'Change your name and picture, or add more people on the sign-in screen with Add new.')}${card('gear', 'Wallpaper and sound', 'Pick a wallpaper, music and sound volume in Settings.')}${card('pad', 'While you play', 'The console steps out of the way and uses almost nothing. The Xbox button brings it back.')}</div>` },
  ];
}
function rmPaint() {
  const s = $('#sign'); if (!s || rm === null) return;
  const P = rmPages(), p = P[rm], last = rm === P.length - 1;
  s.innerHTML = `<div class="sg-bg"></div><div class="rm"><div class="rmc"><div class="dots">${P.map((x, i) => `<i class="${i === rm ? 'on' : ''}"></i>`).join('')}</div>
    <div class="kick">${last ? 'Last step · Next: create your profile' : 'Step ' + (rm + 1) + ' of ' + P.length + ' · ' + p.k}</div><h1>${p.t}</h1><div class="sub">${p.s}</div>${p.body}
    <div class="foot"><div class="hint">${rm ? '<span><i>B</i>Back</span>' : ''}<span><i>A</i>${last ? 'OK' : 'Next'}</span></div><button class="btn" data-nav data-rm>${last ? 'OK' : 'Next'}</button></div></div></div>`;
  const t = s.querySelector('.btn'); if (t) t.focus({ preventScroll: true });
}
function rmAct() {
  if (rm === null) return;
  if (rm < rmPages().length - 1) { rm++; rmPaint(); return; }
  rm = null; rmDone = true; profileCreate(true);
}
let pc = null, welcomeFirst = false;
function profileCreate(first, mode) {
  pc = { first: !!first, mode: mode || '', name: mode === 'pic' ? profileName() : '', k: -1, data: '' }; pcPaint('.pc-big');
}
function pcPaint(focusSel) {
  const s = $('#sign'); if (!s || !pc) return;
  const nm = pc.name || '', ready = !!(nm && pc.data);
  s.innerHTML = `<div class="sg-bg"></div><div class="pc"><div class="pc-one">
    <h1>${pc.first ? 'Create your profile' : pc.mode === 'pic' ? 'Change your picture' : 'Add a new user'}</h1>
    <button class="pc-big${pc.data ? ' has' : ''}" data-nav data-pc="own" aria-label="Choose your photo">${pc.data ? `<img src="${pc.data}" alt="">` : `<svg viewBox="0 0 24 24" width="34%" height="34%" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.1-1.6A1 1 0 0 1 9.6 4h4.8a1 1 0 0 1 .8.4L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg><span>Add your photo</span>`}<i class="pc-edit">${pc.data ? 'Change photo' : ''}</i></button>
    <div class="pc-nm">${nm ? esc(nm) : '<em>Your name</em>'}</div>
    <div class="pc-row"><button class="pc-btn pc-name" data-nav data-pc="name">${nm ? 'Change name' : 'Enter your name'}</button>
      <button class="pc-btn pri pc-done${ready ? '' : ' off'}" data-nav data-pc="done">${pc.first ? 'Continue' : pc.mode === 'pic' ? 'Save' : 'Add user'}</button>
      ${pc.first ? '' : '<button class="pc-btn pc-cancel" data-nav data-pc="cancel">Cancel</button>'}</div>
    <div class="pc-note">${pc.data ? '' : 'Choose a picture from your computer'}</div></div>
    <div class="pc-hint"><span><i>A</i>Select</span>${pc.first ? '' : '<span><i>B</i>Back</span>'}</div></div>`;
  const t = (focusSel && s.querySelector(focusSel)); if (t) t.focus({ preventScroll: true });
}
async function pcAct(el) {
  if (!pc) return; const a = el.dataset.pc;
  if (a === 'name') { const t = await openOsk('Your name', pc.name, { done: 'OK' }); if (t !== null && t.trim()) pc.name = t.trim().slice(0, 24); pcPaint('.pc-name'); }
  else if (a === 'pick') { pc.k = Number(el.dataset.k) || 0; pc.data = gpUrl(pc.k); pcPaint(`.pc-av[data-k="${pc.k}"]`); }
  else if (a === 'own') { const r = await cropAvatar(undefined, async (d) => ({ dataUrl: d })); if (r && r.dataUrl) { pc.data = r.dataUrl; pc.k = -1; } else if (r && r.error) note(r.error); pcPaint(pc.data ? '.pc-name' : '.pc-big'); }
  else if (a === 'cancel') { pc = null; signRender(); }
  else if (a === 'done') {
    if (!pc.name) { note('Type your name first'); pcPaint('.pc-name'); return; }
    if (!pc.data && !(pc.mode === 'pic' && settings.avatarFile)) { note('Add your photo first'); pcPaint('.pc-big'); return; }
    const p = pc; pc = null;
    if (p.mode === 'pic') { if (p.name !== profileName()) settings = await api.setSettings({ ...settings, profileName: p.name }); if (p.data) { const rr = await api.avatarSave(p.data); if (rr && rr.settings) settings = rr.settings; } applySettings(); signRender('.sg-u.me'); }
    else if (p.first) { settings = await api.setSettings({ ...settings, profileName: p.name, profileSet: true }); if (p.data) { const r = await api.avatarSave(p.data); if (r && r.settings) settings = r.settings; } applySettings(); welcomeFirst = true; signRender(); }
    else { settings = await api.profilesAdd(p.name, p.data); signRender('.sg-u:last-of-type'); }
  }
}

async function signPick(id) {
  welcomeFirst = false;
  if (id !== '') { settings = await api.profilesSelect(id); }
  applyAvatars(); await signingIn(id); leaveIntro();
}
async function signAdd() { profileCreate(false); }
function signOptions() {
  const t = document.activeElement;
  if (!introOn || introStage !== 1 || !t || t.dataset.sgu === undefined) return;
  const me = t.dataset.sgu === '';
  const items = [['sgrename', 'Rename']];
  if (me) { items.push(['sgpic', 'Change picture']); if (settings.avatarFile) items.push(['sgpicrm', 'Remove picture']); }
  else items.push(['sgremove', 'Remove user']);
  popMenu(t, t.dataset.sgname, items, { sg: t.dataset.sgu });
}
async function signAct(a, id) {
  const idx = [...document.querySelectorAll('#sign .sg-u')].indexOf(document.activeElement);
  const sel = `.sg-u:nth-child(${Math.max(1, idx + 1)})`;
  if (a === 'sgrename') {
    const cur = id === '' ? profileName() : (settings.profiles.find((p) => p.id === id) || {}).name || '';
    const t = await openOsk('Name', cur, { done: 'Save' });
    if (t === null || !t.trim()) return;
    settings = id === '' ? await api.setSettings({ ...settings, profileName: t.trim().slice(0, 24) }) : await api.profilesRename(id, t.trim());
  } else if (a === 'sgpic') { profileCreate(false, 'pic'); return; }
  else if (a === 'sgpicrm') settings = await api.avatarClear();
  else if (a === 'sgremove') { settings = await api.profilesRemove(id); signRender(); return; }
  signRender(sel);
}
let ccSig = '';
function ccSync(force) {   // the Control Center redraws the moment a controller is plugged in, unplugged or its battery changes
  try {
    const sig = padName() + '|' + cbattPct; if (!force && sig === ccSig) return; ccSig = sig;
    if (!guideOn || osk || psCust || typeof renderGuide !== 'function') return;
    const els = [...document.querySelectorAll('#guide .gd-body [data-nav]')], i = els.indexOf(document.activeElement);
    renderGuide(i >= 0 ? i : (gdRow ? 0 : undefined), true);
  } catch {}
}
window.addEventListener('gamepadconnected', () => setTimeout(ccSync, 50));
window.addEventListener('gamepaddisconnected', () => setTimeout(ccSync, 50));
setInterval(() => { if (guideOn) ccSync(); }, 1000);
function applyCbatt(v) {   // the Xbox controller's battery, like the Xbox dashboard (XInput only reports empty / low / medium / full); Windows also says when it is charging
  const el = $('#cbatt'); if (!el) return;
  const chg = !!(v && v.chg), wired = !!v && v.type === 1;
  if (!v || ((v.type < 2 || v.type > 3) && !(chg || (wired && v.pct >= 0)))) { cbattPct = -1; el.hidden = true; setTimeout(ccSync, 0); return; }   // no controller (or a plain wired one with no battery): nothing to show
  const pct = v.pct >= 0 ? Math.max(1, Math.min(100, v.pct)) : [8, 30, 65, 100][Math.max(0, Math.min(3, v.level))];
  cbattPct = pct; el.hidden = false; el.title = chg ? 'Controller charging' : 'Controller battery'; el.classList.toggle('low', !chg && pct <= 30); el.classList.toggle('chg', chg);
  const f = el.querySelector('.cf'); if (f) f.setAttribute('width', String(Math.max(1, Math.round(pct / 100 * 21))));
  const t = el.querySelector('.cp'); if (t) t.textContent = pct + '%';
  setTimeout(ccSync, 0);
}
if (window.consoleApi && window.consoleApi.onCbatt) { window.consoleApi.onCbatt(applyCbatt); window.consoleApi.cbattGet().then(applyCbatt).catch(() => {}); }
let battP = null;
function tickBattery() {   // only shown on a device that reports a battery (laptops)
  const el = $('#batt'); if (!el) return;
  if (!navigator.getBattery) return;
  (battP = battP || navigator.getBattery().catch(() => null)).then((b) => {
    if (!b || (b.charging && b.level >= 0.999 && b.chargingTime === 0)) return;   // a desktop PC reports a permanently full battery, so hide it
    el.hidden = false; el.title = Math.round(b.level * 100) + '%';
    const f = el.querySelector('.bf'); if (f) f.setAttribute('width', String(Math.max(1, Math.round(b.level * 21))));
  });
}
function tick() { tickBattery(); const t = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase(); $('#clock').textContent = t; document.querySelectorAll('.lclk, .sg-clk, [data-clock]').forEach((el) => { el.textContent = t; }); const dt = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); document.querySelectorAll('[data-date]').forEach((el) => { el.textContent = dt; }); }
(async function init() {
  settings = await window.consoleApi.getSettings();
  acct = await window.consoleApi.accountStatus();
  games = await window.consoleApi.libGet(); userName = await window.consoleApi.userName();
  setTimeout(prefetchStoreHeroes, 6000);   // the wide background pictures of the non-Steam games are fetched ahead, so they are already there when you select the game
  xpad = await window.consoleApi.padStatus(); updateLock();
  window.consoleApi.onPad((v) => { xpad = v; updateLock(); });
  window.consoleApi.onPowerOff((v) => powerOffScreen(v));
  window.consoleApi.onPowerHold((v) => powerOffScreen(!!v, true));
  window.consoleApi.onAway((m) => { const b = document.body; b.classList.add('away'); b.classList.toggle('fade', m === 'fade'); b.classList.toggle('snap', m !== 'fade'); });
  window.consoleApi.onExtResumed(() => { if (lastReturn) { extReturn = lastReturn; clearTimeout(extT); } });
  window.consoleApi.onMouseMode((v) => { mouseOn = v; if (!v && extReturn) { clearTimeout(extT); extT = setTimeout(() => { extReturn = null; }, 900); } });
  window.consoleApi.onGameReady(() => { const el = $('#launch'); if (el._lt0) launchNote(el._lgid, (performance.now() - el._lt0) / 1000); barReady = true; });
  window.consoleApi.onTrailersProgress((d) => {   // the progress line stays at the bottom until the whole task is finished
    if (!d) return;
    if (d.upd && d.upd.id) { const i = games.findIndex((x) => x.id === d.upd.id); if (i >= 0) games[i] = d.upd; if (lastHero && lastHero.id === d.upd.id) { heroKey = ''; try { setHero(games[i]); } catch {} } if (screen === 'game' && gameId === d.upd.id) { try { show('game', focusIdx()); } catch {} } return; }   // each trailer works the moment it has been downloaded
    if (d.finished) { trailMsg = ''; clearInterval(trailIv); trailIv = 0; notify('Trailers finished', (d.ok || 0) + ' downloaded.', '', 'star'); note('Trailers finished: ' + (d.ok || 0) + ' downloaded' + (d.miss ? ', ' + d.miss + ' not found' : '') + '.'); return; }
    trailMsg = 'Downloading trailers ' + (d.done + 1 > d.total ? d.total : d.done + 1) + '/' + d.total + ': ' + d.title;
    const h = $('#hints'); clearTimeout(noteT); if (h) { h.classList.add('msg'); h.textContent = trailMsg; }
    if (!trailIv) trailIv = setInterval(() => { const h2 = $('#hints'); if (trailMsg && h2 && h2.textContent !== trailMsg) { h2.classList.add('msg'); h2.textContent = trailMsg; clearTimeout(noteT); } }, 600);
  });
  // (the launch status line was only for diagnosing; the loading screen shows no text at the bottom)
  window.consoleApi.onGameHandoff(() => { hideLaunch(true); silenceAll(true); });
  window.consoleApi.onKbMode((v) => { kbOpen = v === true; updateLock(); });
  window.consoleApi.onGameSnap((u) => {   // inside a game: the game's own picture, blurred, sits behind the Xbox menu (as on an Xbox)
    try {
      if (!/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(u)) return;
      let e = document.getElementById('gamesnap'); if (!e) { e = document.createElement('div'); e.id = 'gamesnap'; document.body.appendChild(e); }
      e.style.backgroundImage = 'url("' + u + '")'; void e.offsetWidth; e.classList.add('on');
      clearTimeout(e._t); e._t = setTimeout(() => { if (!guideOn) { e.classList.remove('on'); } }, 4000);
    } catch {}
  });
  window.consoleApi.onHomeBtn(() => { { const n = performance.now(); if (window.__hbAt && n - window.__hbAt < 800) return; window.__hbAt = n; } lockHero(300); comeIn(); if (introOn) { if (introStage === 1 && signPressWait) signReveal(); return; } silenceAll(false); if (testing) { xboxLit = performance.now() + 700; return; } if (screen === 'home' && !guideOn && !osk && !menu && !(exitRet && performance.now() - exitRet.t < 4000) && !(extReturn && extReturn.game)) { extReturn = null; return; }   // already on the Home dashboard: the Xbox button does nothing there
    closeMenu(true); if (osk) oskClose(null); if (guideOn) closeGuide(true); (async () => {
    const t0 = performance.now(); let r = extReturn;
    const onHomeNow = screen === 'home' && !(exitRet && performance.now() - exitRet.t < 4000);
    if (onHomeNow && r && r.game) { const s0 = await api.gameStatus().catch(() => null); if (!s0) { extReturn = null; return; } }   // a stale "game" note with nothing running: still nothing to do on Home
    SND.play('back');
    if (r && r.game) { const s = await api.gameStatus().catch(() => null); if (!s) r = null; else gameId = r.gameId; }   // only go back to the game page while that game is still running
    if (!r && exitRet && performance.now() - exitRet.t < 4000 && games.find((y) => y.id === exitRet.gid)) { gameId = exitRet.gid; return show('game', exitRet.idx); }   // the game just closed: its page is the right place
    if (r && SCREENS[r.screen]) { if (!r.game) extReturn = null; show(r.screen, r.idx); } else { extReturn = null; if (screen !== 'home' || document.body.classList.contains('idle')) show('home'); }   // already on Home: nothing to redraw
  })(); });
  window.consoleApi.onDcWin((v) => { dcWin = v; if (guideOn && (guideTab === 'friends' || guideTab === 'profile' || guideTab === 'party') && guidePage === 'main') renderGuide(undefined, true); });
  window.consoleApi.onParty((s) => {
    const prev = partyState; partyState = s;
    if (!guideOn || (!psOn() && guideTab !== 'friends' && guideTab !== 'profile') || guidePage !== 'main') return;
    const sig = (x) => x ? JSON.stringify([x.connected, x.auth, x.error, x.channel && x.channel.id, x.me, (x.members || []).map((m) => [m.id, m.name, m.mute, m.deaf])]) : '';
    if (sig(prev) === sig(s)) { (s.members || []).forEach((m) => { const e = document.querySelector(`#guide [data-pt="${CSS.escape(m.id)}"]`); if (e) { e.classList.toggle('game', !!m.speaking); e.classList.toggle('on', !m.speaking); } }); return; }
    const els = [...document.querySelectorAll('#guide .gd-body [data-nav]')], k = els.indexOf(document.activeElement);
    renderGuide(k >= 0 ? k : undefined, true);
  });
  window.consoleApi.onGoHome(() => { try { if (guideOn && dash) { guidePage = 'main'; return leaveGameMenu(); }
    if (!guideOn && dash && document.body.classList.contains('away')) return; lockHero(300); comeIn(); silenceAll(false); if (introOn || testing) return; if (guideOn) closeGuide(true); if (osk) oskClose(null); if (menu) closeMenu(false); if (screen !== 'home') show('home'); } catch {} });
  window.consoleApi.onAppGhost((_url, app) => {   // the app is gone at once: its card (the one from opening) shows over the softened console, then settles away
    try {
      const ax = (settings.webApps || []).find((y) => String(y.name).trim().toLowerCase() === app); if (!ax) return;
      showAppOpen(ax); { const el = document.getElementById('appopen'); el.classList.add('snapbg'); setTimeout(() => el.classList.remove('snapbg'), 60); } setTimeout(() => { if (window.__aoDone) window.__aoDone(); }, 1300);
    } catch {}
  });
  window.consoleApi.onAppBack(() => { const b = document.body; b.classList.remove('appback'); void b.offsetWidth; b.classList.add('appback'); setTimeout(() => b.classList.remove('appback'), 700); });
  window.consoleApi.onGuide(async (hold) => { if (introOn && signPressWait) { signReveal(); return; } if (guideOn && dash && guidePage === 'main' && !hold) return leaveGameMenu(); if (hold) { document.body.classList.add('gdgame'); quietMedia(); setTimeout(quietMedia, 300); setTimeout(quietMedia, 1200); } lockHero(300); comeIn(); silenceAll(false); if (testing) { xboxLit = performance.now() + 700; return; } if (introOn) return; if (!hold && extReturn && extReturn.game && screen === 'game' && !guideOn && !osk && !menu) { const st = await api.gameStatus().catch(() => null); if (st) { silenceAll(true); lastReturn = extReturn; clearTimeout(extT); api.extSet('game'); return resumeSmooth(); } }   // back on a running game's page: tapping Xbox again goes back into the game
  openGuide(); const was = !!dash; dash = await api.gameStatus(); if (guideOn && guidePage === 'main' && was !== !!dash) renderGuide(undefined, true); });
  window.consoleApi.onGameExited((t, rid) => {   // a closed game leaves you on that game's page (Play is back), not on Home
  exitedAt = performance.now(); const ret = lastReturn || extReturn; dash = null; hideLaunch(true);
  const g = games.find((x) => x.title === t), gid = (ret && ret.game && ret.gameId) || rid || (screen === 'game' ? gameId : g && g.id);
  extReturn = null; lastReturn = null; runTitle = ''; exitRet = gid ? { gid, idx: ret && ret.idx >= 0 ? ret.idx : 0, t: performance.now() } : null;
  api.libGet().then((x) => { games = x; if (gid && games.find((y) => y.id === gid)) { gameId = gid; silenceAll(false); show('game', ret && ret.idx >= 0 ? ret.idx : 0); } else { silenceAll(false); show('home'); } note(t + ' closed.'); });
});
  $('#pad').innerHTML = '';
  document.addEventListener('focusin', (e) => { const c = e.target.closest && e.target.closest('.st-c'); if (c && screen === 'settings') setCatTo(c.dataset.cat); });
  document.addEventListener('focusin', (e) => { const c = e.target.closest && e.target.closest('[data-cap]'); const cap = document.querySelector('.ctl-cap'); if (cap) cap.textContent = c && screen === 'controller' ? c.dataset.cap : ''; });
  document.addEventListener('focusin', (e) => { if (introOn && introStage === 1 && e.target.closest && e.target.closest('#sign .sg-u')) signCenter(); });
  document.addEventListener('focusin', (e) => { if (guideOn || (e.target.closest && e.target.closest('#guide'))) return; document.body.classList.toggle('onshelf', !!(e.target.closest && e.target.closest('.xsec, .xr2n'))); });   // logo and cover step aside while you browse the lower shelves
  document.addEventListener('focusin', (e) => { if (noHero) return; if ((screen !== 'home' && screen !== 'library') || !e.target.closest || guideOn || e.target.closest('#guide')) return;   // the guide menu never changes the background
    if (performance.now() >= heroLock) lastReal = e.target;
    { const t0 = e.target; if (screen === 'home' && t0 && t0.matches && t0.matches('[data-nav]')) document.body.classList.toggle('hero-name-off', !gameOf(t0) && !(t0.closest && t0.closest('[data-app]'))); } 
const ap = e.target.closest('[data-app]'); if (ap && screen === 'home' && ap.dataset.app && !e.target.closest('#menu')) { setAppHero(ap.dataset.app); return; } const g = gameOf(e.target); if (g) { setHero(g); if (screen === 'library' && g.id) updateLibPanel(g); }
    else if (screen === 'home' && !e.target.closest('#menu')) {   // on a widget or the top bar: the background goes back to the game picked in the top row, not the shelf game you just left
      try { const r0 = homeRows()[0] || [], t0 = r0[Math.min(homeMem[0] || 0, r0.length - 1)] || r0[0], g0 = t0 && gameOf(t0); if (g0) setHero(g0); } catch {}
    } });
  // v953: screen sharing / chatting / any ordinary app taking focus no longer pauses the wallpaper or snaps the screen. Only a GAME taking the screen counts as being away.
  let blurGame = false;
  window.addEventListener('blur', () => { blurGame = document.body.classList.contains('ingame') || !!gameMute; if (blurGame) document.body.classList.add('idle'); });
  window.addEventListener('focus', () => {
    const away = blurGame || document.body.classList.contains('ingame') || document.body.classList.contains('idle'); blurGame = false;   // v959: the first-tile focus / game title restore always runs; only the animation 'snap' is skipped for a quick look at another app
    lockHero(); document.body.classList.remove('idle'); muteUntil = performance.now() + 300; comeIn();
    if (away) document.body.classList.add('nofx');   // Windows had frozen the animations half-way: snap everything to its final look, then let it move again
    const a = document.activeElement; if (a && a.closest && (screen === 'home' || screen === 'library')) { const g = gameOf(a); if (g) { try { setHero(g); } catch {} } }
    void document.body.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => { document.body.classList.remove('nofx'); document.querySelectorAll('video[data-rp]').forEach((v) => { delete v.dataset.rp; try { v.play(); } catch {} }); }));
  });
  { let liftR = 0;   // the row title follows the selected game: up when that game is the first one visible in its row
    let lfJump = false, lfRow = null, lfIdx = -1, lfDir = 0, lfAt = 0, lfUp = false;   // the title keeps its place while you sweep along a row, so it never flickers up and down
    const edgeFix = () => {};   // v499: rows are clipped at the page edge again, as before
    const liftCheck = () => {
      const d = document.querySelector('.dash.xnew'); if (!d) return; edgeFix();
      const a = document.activeElement, tile = a && a.closest ? a.closest('.xn') : null;
      let jl = false, sec = null; const now = performance.now();
      const row = tile ? tile.closest('.xr1n, .xr3n') : null;
      if (!row) { lfRow = null; lfUp = false; }
      else {
        const items = [...row.querySelectorAll('.xn')], idx = items.indexOf(tile);
        if (row !== lfRow) { lfRow = row; lfIdx = idx; lfDir = 0; lfUp = false; lfAt = 0; }
        else if (idx !== lfIdx) { lfDir = idx < lfIdx ? -1 : 1; lfJump = Math.abs(idx - lfIdx) > 1; lfIdx = idx; lfAt = now; }
        const rr = row.getBoundingClientRect(), tr = tile.getBoundingClientRect();
        const ed = (row._edge || 0); let need = tr.left - rr.left - ed < tr.width * 0.6;
        try { const tl = row.classList.contains('xr1n') ? d.querySelector('.xjb') : row.closest('.xsec').querySelector('.xnh'); const rg = document.createRange(); rg.selectNodeContents(tl); const tb = rg.getBoundingClientRect(); if (tb.width > 0 && tr.left < tb.right - 30 && tr.right > tb.left) need = true; } catch {}
        const moving = now - lfAt < 150;
        if (idx === 0) lfUp = true;                                  // the first game always has it up, or the card would cover it
        else if (!moving) lfUp = false;                              // you stopped: it drops
        else if (lfJump || lfDir > 0) lfUp = need;                   // jumped (RB/LB) or went right: it follows what is really needed, instantly
        else if (lfDir < 0) lfUp = lfUp || need;                     // sweeping left keeps it up
        else if (idx === 1) lfUp = false;
        if (lfUp) { if (row.classList.contains('xr1n')) jl = true; else sec = row.closest('.xsec'); }
      }
      d.querySelectorAll('.xsec').forEach((x) => { if (x !== sec) x.classList.remove('lift'); });
      if (sec) sec.classList.add('lift');
      d.classList.toggle('liftj', jl);
    };
    const kick = () => { if (liftR) return; liftR = requestAnimationFrame(() => { liftR = 0; liftCheck(); }); };
    document.addEventListener('focusin', () => { kick(); setTimeout(liftCheck, 60); setTimeout(liftCheck, 156); setTimeout(liftCheck, 400); });
    document.addEventListener('scroll', kick, true);
  }
  applySettings();
  try { window.consoleApi.onPadKind((k) => { if (k) { padKindAuto = k; setPadKind(); } }); } catch {}
  runIntro();   // v791: the startup video is loaded and started first; the heavy home screen builds right after it is already rolling
  setTimeout(() => { show('home'); tick(); setInterval(tick, 10000); }, document.body.classList.contains('introplay') ? 900 : 0);
  requestAnimationFrame(poll);
})();

(function initStars() {   // slow drifting blue lights behind Home
  const box = document.getElementById('stars'); if (!box) return;
  for (let i = 0; i < 46; i++) {
    const d = document.createElement('i'), sz = 6 + Math.random() * 26, big = Math.random() < .14, s2 = big ? sz * 1.7 : sz * .55 + 4;
    d.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;width:${s2.toFixed(0)}px;height:${s2.toFixed(0)}px;--dx:${(Math.random() * 90 - 45).toFixed(0)};--dy:${(Math.random() * 90 - 45).toFixed(0)};animation-duration:${(30 + Math.random() * 50).toFixed(0)}s, ${(3 + Math.random() * 6).toFixed(1)}s;animation-direction:alternate, normal;animation-delay:${(-Math.random() * 30).toFixed(1)}s, ${(-Math.random() * 6).toFixed(1)}s;`;
    box.appendChild(d);
  }
})();

// Records slow frames in the console log (with what was running) so any stutter can be tracked down; it costs nothing while the screen is smooth.
try { new PerformanceObserver((list) => { for (const e of list.getEntries()) { if (e.duration < 60) continue; const sc = (e.scripts || []).slice(0, 2).map((s) => (s.invoker || '') + ' ' + (s.sourceFunctionName || '') + ' ' + Math.round(s.duration) + 'ms').join(' | '); try { window.consoleApi.lagLog('frame ' + Math.round(e.duration) + ' ms (blocking ' + Math.round(e.blockingDuration || 0) + ') screen=' + screen + ' ' + sc); } catch {} } }).observe({ type: 'long-animation-frame', buffered: false }); } catch {}

/* v988: everything automatic - art, details and trailers are looked up in the background for every game, with no buttons to press */
let allTrBusy = false;
async function downloadAllTrailers() {   // the one "Download all trailers" button
  if (allTrBusy) return note('Trailers are already downloading.'); allTrBusy = true;
  try {
    note('Finding every game\'s official cinematic trailer in the sharpest quality (1440p / 4K when it exists)...');
    const y = api.trailersYoutube ? await api.trailersYoutube() : null;
    if (y && y.error) { note(y.error); }
    if (y && y.games) games = y.games;
    note('Filling any game with no official trailer from Steam...');
    const s = api.trailersAuto ? await api.trailersAuto('bg') : null; if (s && s.games) games = s.games;
    if (screen === 'library' || screen === 'game') show(screen, focusIdx());
    const left = games.filter((g) => g.title && !/^deadlock$/i.test(String(g.title).trim()) && !(typeof g.trailer === 'string' && g.trailer)).length;
    note('Trailers done.' + (left ? ' ' + left + ' game' + (left > 1 ? 's have' : ' has') + ' no trailer anywhere.' : ' Every game has one.'));
  } catch (e) { note('Trailers: ' + (e && e.message ? e.message : 'something went wrong')); }
  allTrBusy = false;
}
let autoMediaBusy = false;
async function autoMedia() {
  if (autoMediaBusy || !api.trailersAuto || introOn || launching || document.body.classList.contains('ingame') || gameMute) return; autoMediaBusy = true;
  try {
    if (games.some((g) => g.title)) {
      if (api.trailersYoutube) { const y = await api.trailersYoutube('bg'); if (y && y.games) games = y.games; }
      { const r2 = await api.trailersAuto('bg'); if (r2 && r2.games) games = r2.games; }   // games YouTube had nothing for still get Steam's own trailer
    }
  } catch {}
  autoMediaBusy = false;
}
setTimeout(autoMedia, 45000); setInterval(autoMedia, 20 * 60000);
window.__autoMedia = autoMedia;

/* v993: the Ubisoft Connect sign-in page, inside the console: fields you fill with the Xbox keyboard (or a real keyboard), then Sign in */
function ubiForm() {
  return new Promise((res) => {
    const st = { email: '', pw: '' }, prevFocus = document.activeElement;
    const root = document.createElement('div'); root.id = 'ubiform';
    const inerted = [];
    const paint = () => {
      root.innerHTML = `<div class="ubibox"><div class="ubihead"><b>Ubisoft Connect</b><span>Sign in with your Ubisoft account</span></div>
        <button class="ubifld" data-nav data-ubi="email"><small>Email</small><span>${esc(st.email) || '<i>Select to type</i>'}</span></button>
        <button class="ubifld" data-nav data-ubi="pw"><small>Password</small><span>${st.pw ? '\u2022'.repeat(st.pw.length) : '<i>Select to type</i>'}</span></button>
        <div class="ubibtns"><button class="ubigo" data-nav data-ubi="go">Sign in</button><button class="ubicx" data-nav data-ubi="cancel">Cancel</button></div>
        <p>Your password goes only to Ubisoft and is never stored. Press A on a box to open the keyboard.</p></div>`;
    };
    const focusKey = (k) => { const e = root.querySelector('[data-ubi="' + k + '"]'); if (e) e.focus({ preventScroll: true }); };
    const done = (v) => { window.__ubiAct = null; window.__ubiCancel = null; inerted.forEach((e) => e.removeAttribute('inert')); root.remove(); try { if (prevFocus && document.body.contains(prevFocus)) prevFocus.focus({ preventScroll: true }); } catch {} res(v); };
    window.__ubiCancel = () => done(null);
    window.__ubiAct = async (k) => {
      if (k === 'cancel') return done(null);
      if (k === 'go') { if (!st.email || !st.pw) { note('Type your email and password first.'); return focusKey(st.email ? 'pw' : 'email'); } return done({ email: st.email.trim(), pw: st.pw }); }
      root.setAttribute('inert', ''); const t = await openOsk(k === 'email' ? 'Ubisoft email' : 'Password', k === 'email' ? st.email : '', {}); root.removeAttribute('inert');
      if (t !== null && t !== undefined) st[k] = k === 'email' ? t.trim() : t;
      paint(); focusKey(k === 'email' ? (st.pw ? 'go' : 'pw') : (st.email ? 'go' : 'email'));
    };
    [...document.body.children].forEach((e) => { if (e.id !== 'osk' && e.tagName !== 'SCRIPT') { e.setAttribute('inert', ''); inerted.push(e); } });
    paint(); document.body.appendChild(root); focusKey('email');
  });
}

/* v1070: every game's logo and wide art is made ready in the background, so selecting a game shows its name and picture at once (nothing is fetched or cut when you land on it) */
(() => {
  const done = new Set(); let busy = false;
  setInterval(() => {
    if (busy || typeof games === 'undefined' || !games || !games.length || document.hidden) return; busy = true;
    try {
      const todo = [];
      { let n = 0; for (const g of games) { if (!g || done.has('f' + g.id)) continue; done.add('f' + g.id); try { loadHero(g); } catch {} if (++n >= 6) break; } }   // each game's logo and wide art are looked up now, not when you first land on it
      for (const g of games) { if (!g) continue; const l = logoMap.get(g.id); if (l && !done.has('l' + g.id + l)) todo.push(['l', g, l]); const s = heroSrc(g); if (s && !done.has('h' + g.id + s)) todo.push(['h', g, s]); if (todo.length >= 4) break; }
      Promise.all(todo.map(([k, g, v]) => { done.add(k + g.id + v); if (k === 'l') return trimLogo('ctheme://img/' + v, false).catch(() => {}); return new Promise((r) => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = v; (i.decode ? i.decode() : Promise.resolve()).then(r, r); }); })).then(() => { busy = false; }, () => { busy = false; });
    } catch { busy = false; }
  }, 120);
})();

document.addEventListener('focusin', (e) => {   // Control Center: the chosen card sits at the left edge, lists keep the chosen row in view
  if (!guideOn || !document.body.classList.contains('gd-ps') || !gdRow) return;
  const el = e.target, b = el && el.closest ? el.closest('#guide .gd-body') : null; if (!b) return;
  psHintSet(el);
  if (document.body.classList.contains('gd-menu')) { el.scrollIntoView({ block: 'nearest', behavior: 'auto' }); return; }
  let card = el; while (card.parentElement && card.parentElement !== b) card = card.parentElement;
  const pl = parseFloat(getComputedStyle(b).paddingLeft) || 0;
  psGlide(b, Math.max(0, card.offsetLeft - pl));
});
function psGlide(b, t) {   // eases the card row toward the chosen card; a new press just moves the target, so it never lags behind
  b._gt = Math.min(t, b.scrollWidth - b.clientWidth); if (b._graf) return;
  b.style.scrollBehavior = 'auto';
  const step = () => { const d = b._gt - b.scrollLeft; if (Math.abs(d) < 1.5) { b.scrollLeft = b._gt; b._graf = 0; return; } b.scrollLeft += d * 0.3; b._graf = requestAnimationFrame(step); };
  b._graf = requestAnimationFrame(step);
}

/* the controller pictures: if a file cannot be loaded, a drawn controller takes its place and the problem is written to the log */
document.addEventListener('error', (e) => {
  const t = e.target; if (!t || t.tagName !== 'IMG' || !(t.classList.contains('wpad') || t.classList.contains('pad-img'))) return;
  try { window.consoleApi.lagLog('controller picture missing: ' + (t.getAttribute('src') || '')); } catch {}
  if (t.dataset.fb) return; t.dataset.fb = '1';
  const w = document.createElement('span'); w.className = t.className + ' padfb'; w.innerHTML = ICON.pad || ''; t.replaceWith(w);
}, true);

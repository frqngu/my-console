/* Animated backgrounds (v749). fillBackdrop(el, n) draws the chosen theme into el; "night" is the original forest scene (sky.js).
   Every other theme is one small canvas (drawn at 800x450 and scaled up) that runs at 30 frames a second, and stops completely
   while a game/app is open, the window is hidden, the console is idle, or "Motion" is off. No styles are written as style="" text. */
(() => {
  const W = 800, H = 450;
  const rr = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  const grad = (c, stops, y0 = 0, y1 = H) => { const g = c.createLinearGradient(0, y0, 0, y1); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
  const glow = (c, x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
  const stars = (n, ymax = H) => Array.from({ length: n }, () => { const big = Math.random() < .12, k = W / 1920, tc = Math.random(); return { x: rr(0, W), y: rr(0, ymax), r: (big ? rr(1.3, 2) : rr(.5, 1.2)) * k, big, p: rr(0, TAU), s: rr(.35, 1.4), col: tc < .2 ? '200,220,255' : tc < .35 ? '255,236,205' : '255,255,255' }; });
  const drawStars = (c, st, t, a = 1) => { for (const s of st) { c.globalAlpha = a * (.35 + .65 * (.5 + .5 * Math.sin(t * s.s + s.p))); c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill(); } c.globalAlpha = 1; };

  // each theme: id, name, init() -> state, draw(c, t, st, dt)
  const T = [];
  const add = (id, name, init, draw) => T.push({ id, name, init, draw });

  add('aurora', 'Aurora', () => ({ st: stars(110, H * .75) }), (c, t, s) => {
    c.fillStyle = grad(c, [[0, '#01030a'], [1, '#07142b']]); c.fillRect(0, 0, W, H);
    drawStars(c, s.st, t);
    c.globalCompositeOperation = 'lighter';
    const L = [['rgba(60,255,160,A)', 0, .30], ['rgba(120,90,255,A)', 2.1, .24], ['rgba(40,220,255,A)', 4.3, .18]];
    L.forEach(([col, ph, al], k) => {
      const g = c.createLinearGradient(0, 0, 0, 190); g.addColorStop(0, col.replace('A', 0)); g.addColorStop(.35, col.replace('A', al)); g.addColorStop(1, col.replace('A', 0));
      c.strokeStyle = g; c.lineWidth = 8;
      for (let x = -8; x < W + 8; x += 6) {
        const y = H * (.28 + k * .07) + Math.sin(x * .006 + t * .22 + ph) * 46 + Math.sin(x * .017 - t * .35 + ph) * 16;
        c.save(); c.translate(x, y - 70); c.globalAlpha = .55 + .45 * Math.sin(x * .02 + t * .6 + ph); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 190); c.stroke(); c.restore();
      }
    });
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#02050b'; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 20) c.lineTo(x, H - 36 - Math.abs(Math.sin(x * .013 + 1)) * 40 - Math.sin(x * .05) * 6); c.lineTo(W, H); c.fill();
  });

  add('ocean', 'Deep ocean', () => ({ b: Array.from({ length: 40 }, () => ({ x: rr(0, W), y: rr(0, H), r: rr(1, 4), v: rr(10, 34), p: rr(0, TAU) })), p: Array.from({ length: 70 }, () => ({ x: rr(0, W), y: rr(0, H), v: rr(2, 8), a: rr(.1, .4) })) }), (c, t, s, dt) => {
    c.fillStyle = grad(c, [[0, '#0a4a74'], [.45, '#04243f'], [1, '#01070f']]); c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const x0 = 80 + i * 130 + Math.sin(t * .2 + i) * 40, w = 28 + 14 * Math.sin(t * .3 + i * 2);
      const g = c.createLinearGradient(x0, 0, x0 + 180, H * .9); g.addColorStop(0, 'rgba(160,230,255,.20)'); g.addColorStop(1, 'rgba(160,230,255,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + w, 0); c.lineTo(x0 + 190 + w, H * .9); c.lineTo(x0 + 140, H * .9); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    for (const p of s.p) { p.y -= p.v * dt; p.x += Math.sin(t + p.y * .02) * .1; if (p.y < -2) { p.y = H + 2; p.x = rr(0, W); } c.fillStyle = `rgba(200,240,255,${p.a})`; c.fillRect(p.x, p.y, 1.4, 1.4); }
    c.strokeStyle = 'rgba(190,235,255,.45)'; c.lineWidth = 1;
    for (const b of s.b) { b.y -= b.v * dt; b.x += Math.sin(t * 1.3 + b.p) * .35; if (b.y < -8) { b.y = H + 8; b.x = rr(0, W); } c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.stroke(); }
    for (let k = 0; k < 3; k++) {
      c.fillStyle = ['#03223a', '#021a2e', '#010f1b'][k]; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 16) c.lineTo(x, H - 40 + k * 14 - Math.sin(x * .012 + k * 2 + t * .15) * (18 - k * 4) - Math.sin(x * .03 + t * .2) * 5);
      c.lineTo(W, H); c.fill();
    }
  });

  add('sunset', 'Sunset', () => ({ st: stars(40, H * .3), cl: Array.from({ length: 7 }, () => ({ x: rr(0, W), y: rr(60, 250), w: rr(120, 300), h: rr(10, 24), v: rr(3, 9), a: rr(.12, .3) })) }), (c, t, s, dt) => {
    c.fillStyle = grad(c, [[0, '#1c0b44'], [.35, '#6a2a78'], [.62, '#ee6a55'], [.78, '#ffb064'], [1, '#ffd58a']], 0, H * .8); c.fillRect(0, 0, W, H);
    drawStars(c, s.st, t, .5);
    const sy = H * .66 + Math.sin(t * .1) * 6; glow(c, W * .5, sy, 260, 'rgba(255,190,110,A)', .55);
    c.fillStyle = '#ffe3a8'; c.beginPath(); c.arc(W * .5, sy, 46, 0, TAU); c.fill();
    for (const k of s.cl) { k.x += k.v * dt; if (k.x - k.w > W) k.x = -k.w; c.fillStyle = `rgba(255,150,170,${k.a})`; c.beginPath(); c.ellipse(k.x, k.y, k.w, k.h, 0, 0, TAU); c.fill(); }
    [['#4a1a52', .66, 70, .008], ['#2d0f3a', .75, 55, .013], ['#170721', .86, 36, .02]].forEach(([col, base, amp, f], i) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 10) c.lineTo(x, H * base - Math.abs(Math.sin(x * f + i * 2.1)) * amp * .5 - Math.sin(x * f * 3) * 6); c.lineTo(W, H); c.fill();
    });
  });

  add('space', 'Deep space', () => ({ s: Array.from({ length: 160 }, () => ({ x: rr(-1, 1), y: rr(-1, 1), z: rr(.05, 1) })), n: [[.25, .35, 260, 'rgba(110,70,220,A)', .22], [.72, .62, 300, 'rgba(40,120,230,A)', .18], [.5, .85, 240, 'rgba(210,70,170,A)', .12]] }), (c, t, s, dt) => {
    c.fillStyle = '#02030a'; c.fillRect(0, 0, W, H);
    for (const [x, y, r, col, a] of s.n) glow(c, x * W + Math.sin(t * .05 + x * 9) * 30, y * H + Math.cos(t * .06 + y * 7) * 20, r, col, a);
    for (const p of s.s) {
      p.z -= .035 * dt; if (p.z <= .02) { p.x = rr(-1, 1); p.y = rr(-1, 1); p.z = 1; }
      const x = W / 2 + p.x / p.z * W * .18, y = H / 2 + p.y / p.z * H * .18; if (x < 0 || x > W || y < 0 || y > H) { p.z = 1; continue; }
      const pz = p.z + .035 * dt * 3, x0 = W / 2 + p.x / pz * W * .18, y0 = H / 2 + p.y / pz * H * .18;
      c.strokeStyle = `rgba(255,255,255,${Math.min(1, (1 - p.z) * 1.4)})`; c.lineWidth = (1 - p.z) * 1.6 + .3; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x, y); c.stroke();
    }
  });

  add('rain', 'Rainy night', () => ({ d: Array.from({ length: 150 }, () => ({ x: rr(0, W), y: rr(0, H), l: rr(10, 24), v: rr(380, 620) })), w: Array.from({ length: 60 }, () => ({ x: rr(10, W - 10), y: rr(H * .5, H * .74), p: rr(0, TAU), s: rr(.3, 1.2), on: Math.random() < .6 })), r: [] }), (c, t, s, dt) => {
    c.fillStyle = grad(c, [[0, '#04070f'], [1, '#101d38']]); c.fillRect(0, 0, W, H);
    c.fillStyle = '#060a14'; for (let i = 0; i < 18; i++) { const x = i * 46 - 10, h = 120 + ((i * 53) % 90); c.fillRect(x, H * .78 - h, 40, h + H * .22); }
    for (const w of s.w) { c.fillStyle = `rgba(255,214,130,${(.15 + .35 * (.5 + .5 * Math.sin(t * w.s + w.p))) * (w.on ? 1 : .35)})`; c.fillRect(w.x, w.y, 4, 5); }
    glow(c, W * .5, H * .95, 420, 'rgba(90,130,210,A)', .22);
    c.strokeStyle = 'rgba(170,200,255,.35)'; c.lineWidth = 1; c.beginPath();
    for (const d of s.d) { d.y += d.v * dt; d.x -= d.v * .12 * dt; if (d.y > H) { d.y = -d.l; d.x = rr(0, W + 80); if (Math.random() < .35 && s.r.length < 24) s.r.push({ x: rr(0, W), y: rr(H * .9, H - 4), a: .5 }); } c.moveTo(d.x, d.y); c.lineTo(d.x - d.l * .12, d.y + d.l); }
    c.stroke();
    for (let i = s.r.length - 1; i >= 0; i--) { const q = s.r[i]; q.a -= dt * .9; if (q.a <= 0) { s.r.splice(i, 1); continue; } c.strokeStyle = `rgba(170,200,255,${q.a * .6})`; c.beginPath(); c.ellipse(q.x, q.y, (.5 - q.a) * 46 + 2, (.5 - q.a) * 9 + 1, 0, 0, TAU); c.stroke(); }
  });

  add('digital', 'Digital rain', () => { const n = Math.floor(W / 14); return { y: Array.from({ length: n }, () => rr(-H, 0)), v: Array.from({ length: n }, () => rr(60, 200)), first: true }; }, (c, t, s, dt) => {
    if (s.first) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); s.first = false; }
    c.fillStyle = 'rgba(0,6,2,.16)'; c.fillRect(0, 0, W, H);
    c.font = '13px monospace';
    for (let i = 0; i < s.y.length; i++) {
      s.y[i] += s.v[i] * dt; if (s.y[i] > H + 20) { s.y[i] = rr(-120, 0); s.v[i] = rr(60, 200); }
      const ch = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 90));
      c.fillStyle = '#c9ffd9'; c.fillText(ch, i * 14, s.y[i]);
      c.fillStyle = 'rgba(40,255,120,.8)'; c.fillText(String.fromCharCode(0x30A0 + Math.floor(Math.random() * 90)), i * 14, s.y[i] - 14);
    }
  });

  add('embers', 'Embers', () => ({ e: Array.from({ length: 90 }, () => ({ x: rr(0, W), y: rr(0, H), v: rr(16, 60), r: rr(.8, 2.6), p: rr(0, TAU) })) }), (c, t, s, dt) => {
    c.fillStyle = grad(c, [[0, '#050101'], [.7, '#140603'], [1, '#3a0e05']]); c.fillRect(0, 0, W, H);
    glow(c, W / 2, H + 40, 520 + Math.sin(t * .8) * 30, 'rgba(255,90,20,A)', .38);
    c.globalCompositeOperation = 'lighter';
    for (const e of s.e) {
      e.y -= e.v * dt; e.x += Math.sin(t * 1.4 + e.p) * 14 * dt; if (e.y < -10) { e.y = H + 10; e.x = rr(0, W); }
      const a = Math.max(0, Math.min(1, e.y / H)) * (.5 + .5 * Math.sin(t * 6 + e.p));
      glow(c, e.x, e.y, e.r * 5, 'rgba(255,150,50,A)', a * .5); c.fillStyle = `rgba(255,220,140,${a})`; c.fillRect(e.x - e.r / 2, e.y - e.r / 2, e.r, e.r);
    }
    c.globalCompositeOperation = 'source-over';
  });

  add('sakura', 'Cherry blossom', () => ({ s: stars(30, H * .5), p: Array.from({ length: 55 }, () => ({ x: rr(0, W), y: rr(0, H), v: rr(18, 44), r: rr(4, 9), a: rr(0, TAU), w: rr(.5, 2), sw: rr(10, 40) })) }), (c, t, s, dt) => {
    c.fillStyle = grad(c, [[0, '#150818'], [1, '#42163c']]); c.fillRect(0, 0, W, H);
    drawStars(c, s.s, t, .45); glow(c, W * .78, H * .22, 200, 'rgba(255,210,230,A)', .3);
    c.fillStyle = '#fbe4ee'; c.beginPath(); c.arc(W * .78, H * .22, 34, 0, TAU); c.fill();
    c.strokeStyle = '#0c040e'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-10, 90); c.quadraticCurveTo(120, 70, 230, 130); c.quadraticCurveTo(300, 150, 340, 120); c.moveTo(120, 76); c.quadraticCurveTo(160, 20, 250, 10); c.stroke();
    for (const p of s.p) {
      p.y += p.v * dt; p.a += p.w * dt; p.x += Math.sin(t * .8 + p.r) * p.sw * dt; if (p.y > H + 12) { p.y = -12; p.x = rr(0, W); }
      c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.scale(1, .55 + .45 * Math.sin(p.a * 1.7)); c.fillStyle = 'rgba(255,170,200,.85)'; c.beginPath(); c.ellipse(0, 0, p.r, p.r * .6, 0, 0, TAU); c.fill(); c.restore();
    }
  });

  add('snow', 'Snowfall', () => ({ f: Array.from({ length: 140 }, () => ({ x: rr(0, W), y: rr(0, H), z: rr(.3, 1), p: rr(0, TAU) })) }), (c, t, s, dt) => {
    c.fillStyle = grad(c, [[0, '#07101e'], [.7, '#16294a'], [1, '#2a4468']]); c.fillRect(0, 0, W, H);
    glow(c, W * .3, H * .2, 220, 'rgba(210,230,255,A)', .2);
    c.fillStyle = '#050b16'; for (let i = 0; i < 16; i++) { const x = i * 56 + (i % 3) * 8, h = 70 + ((i * 37) % 60); c.beginPath(); c.moveTo(x, H); c.lineTo(x + 26, H - h); c.lineTo(x + 52, H); c.fill(); }
    c.fillStyle = '#c6d8f0'; c.fillRect(0, H - 14, W, 14);
    for (const f of s.f) { f.y += (18 + 50 * f.z) * dt; f.x += Math.sin(t * .7 + f.p) * 16 * f.z * dt + 6 * dt; if (f.y > H + 4) { f.y = -4; f.x = rr(0, W); } if (f.x > W + 4) f.x = -4; c.fillStyle = `rgba(255,255,255,${.35 + .6 * f.z})`; c.beginPath(); c.arc(f.x, f.y, .6 + 2 * f.z, 0, TAU); c.fill(); }
  });

  add('synthwave', 'Synthwave', () => ({ st: stars(60, H * .45) }), (c, t, s) => {
    const hz = H * .58;
    c.fillStyle = grad(c, [[0, '#0b0020'], [.55, '#3d0a5e'], [1, '#ff2d95']], 0, hz); c.fillRect(0, 0, W, hz);
    drawStars(c, s.st, t, .7);
    c.save(); c.beginPath(); c.rect(0, 0, W, hz); c.clip();
    c.fillStyle = grad(c, [[0, '#ffe36e'], [1, '#ff2d95']], hz - 140, hz + 10); c.beginPath(); c.arc(W / 2, hz - 10, 120, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(W / 2, hz - 10, 120, 0, TAU); c.clip(); c.fillStyle = '#3d0a5e'; for (let i = 0; i < 6; i++) { const y = hz - 80 + i * 16 + ((t * 6) % 16); c.fillRect(W / 2 - 130, y, 260, 2 + i * .9); } c.restore();
    c.restore();
    c.fillStyle = '#12002b'; c.beginPath(); c.moveTo(0, hz); for (let x = 0; x <= W; x += 20) c.lineTo(x, hz - (Math.abs(Math.sin(x * .011 + .6)) * 70) * (Math.abs(x - W / 2) / (W / 2))); c.lineTo(W, hz); c.fill();
    c.fillStyle = '#10001f'; c.fillRect(0, hz, W, H - hz);
    c.strokeStyle = 'rgba(255,60,200,.8)'; c.lineWidth = 1.2; c.beginPath();
    for (let i = -14; i <= 14; i++) { c.moveTo(W / 2 + i * 14, hz); c.lineTo(W / 2 + i * 130, H); }
    const ph = (t * .5) % 1; for (let i = 0; i < 12; i++) { const d = (i + ph) / 12, y = hz + d * d * (H - hz); c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
  });

  add('green', 'Console green', () => ({}), (c, t) => {
    c.fillStyle = '#010503'; c.fillRect(0, 0, W, H);
    glow(c, W * .5, H * 1.05, 460, 'rgba(16,200,80,A)', .28);
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      c.lineWidth = 26 - k * 3; c.strokeStyle = `rgba(20,${150 + k * 16},${70 + k * 8},.07)`; c.beginPath();
      for (let x = -10; x <= W + 10; x += 12) { const y = H * (.38 + k * .06) + Math.sin(x * .007 + t * .35 + k * .9) * 60 + Math.sin(x * .016 - t * .5 + k) * 22; if (x < 0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
  });

  add('mono', 'Black & white', () => ({ b: Array.from({ length: 7 }, (_, i) => ({ x: rr(0, W), y: rr(0, H), r: rr(140, 320), f: rr(.03, .09), p: rr(0, TAU), a: rr(.05, .12) })) }), (c, t, s) => {
    c.fillStyle = '#030303'; c.fillRect(0, 0, W, H);
    for (const b of s.b) glow(c, b.x + Math.sin(t * b.f + b.p) * 160, b.y + Math.cos(t * b.f * 1.3 + b.p) * 90, b.r, 'rgba(255,255,255,A)', b.a);
  });

  add('lava', 'Lava lamp', () => ({ b: Array.from({ length: 7 }, (_, i) => ({ x: rr(.1, .9), y: rr(.1, .9), r: rr(120, 210), f: rr(.08, .2), p: rr(0, TAU), col: ['rgba(255,110,40,A)', 'rgba(255,60,130,A)', 'rgba(150,70,255,A)', 'rgba(255,170,60,A)'][i % 4] })) }), (c, t, s) => {
    c.fillStyle = grad(c, [[0, '#14041f'], [1, '#2a0a2c']]); c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    for (const b of s.b) glow(c, W * b.x + Math.sin(t * b.f + b.p) * 130, H * (.5 + Math.sin(t * b.f * .8 + b.p * 2) * .38), b.r, b.col, .5);
    c.globalCompositeOperation = 'source-over';
  });

  // ---- picture themes: the painted wallpaper stays exactly as drawn; a small transparent layer on top moves stars, mist, rain, snow, embers ... ----
  const mistBlobs = (n, y0, y1, col) => Array.from({ length: n }, () => ({ x: rr(0, W), y: rr(H * y0, H * y1), rx: rr(110, 260), ry: rr(14, 34), v: rr(4, 11) * (Math.random() < .5 ? 1 : -1), col, a: rr(.05, .11) }));
  const drawMist = (c, list, dt) => { for (const m of list) { m.x += m.v * dt; m.ph = (m.ph == null ? rr(0, TAU) : m.ph) + dt * .12; if (m.x > W + m.rx) m.x = -m.rx; if (m.x < -m.rx) m.x = W + m.rx; const br = .75 + .25 * Math.sin(m.ph), k = W / 1920; c.save(); c.translate(m.x, m.y); c.scale(m.rx / m.ry, 1); const R = m.ry; const g = c.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, m.col.replace('A', m.a * br)); g.addColorStop(.5, m.col.replace('A', m.a * br * .45)); g.addColorStop(1, m.col.replace('A', 0)); c.fillStyle = g; c.fillRect(-R, -R, R * 2, R * 2); c.restore(); } };
  const moonGlow = (c, mx, my, t) => { const k = W / 1920, b = .8 + .2 * Math.sin(t * .4); c.globalCompositeOperation = 'lighter'; glow(c, mx * W, my * H, 420 * k, 'rgba(150,175,235,A)', .05 * b); glow(c, mx * W, my * H, 190 * k, 'rgba(200,218,255,A)', .09 * b); glow(c, mx * W, my * H, 60 * k, 'rgba(240,246,255,A)', .16 * b); c.globalCompositeOperation = 'source-over'; };
  const twinkle = (c, list, t) => { c.save(); c.globalCompositeOperation = 'lighter'; for (const s of list) { const w = .5 + .5 * Math.sin(t * s.s + s.p), a = w * w * (3 - 2 * w) * (s.big ? 1 : .8); if (a < .04) continue; c.globalAlpha = a; c.fillStyle = `rgb(${s.col || '255,255,255'})`; c.beginPath(); c.arc(s.x, s.y, s.r * (.7 + .3 * w), 0, TAU); c.fill(); if (s.big) { const R = s.r * 5, g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, R); g.addColorStop(0, `rgba(${s.col || '255,255,255'},.35)`); g.addColorStop(1, `rgba(${s.col || '255,255,255'},0)`); c.fillStyle = g; c.fillRect(s.x - R, s.y - R, R * 2, R * 2); } } c.restore(); };
  const shooter = (s, c, dt) => { s.sh = s.sh || { t: rr(4, 12), on: 0 }; const q = s.sh, k = W / 1920; q.t -= dt; if (q.t <= 0 && !q.on) { q.on = 1; q.p = 0; q.x = rr(W * .1, W * .8); q.y = rr(10, H * .3); q.ang = rr(.28, .5); q.sp = rr(520, 760) * k; q.len = rr(130, 230) * k; q.t = rr(9, 22); }
    if (q.on) { q.p += dt * 1.25; const d = q.p * q.sp * .8, ca = Math.cos(q.ang), sa = Math.sin(q.ang), x = q.x + d * ca, y = q.y + d * sa, f = Math.sin(Math.min(1, q.p) * Math.PI), L = q.len * (.5 + .5 * f), g = c.createLinearGradient(x, y, x - L * ca, y - L * sa); g.addColorStop(0, `rgba(255,255,255,${.9 * f})`); g.addColorStop(.3, `rgba(190,215,255,${.35 * f})`); g.addColorStop(1, 'rgba(160,190,255,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = g; c.lineWidth = 1.8 * k; c.beginPath(); c.moveTo(x, y); c.lineTo(x - L * ca, y - L * sa); c.stroke(); const hg = c.createRadialGradient(x, y, 0, x, y, 7 * k); hg.addColorStop(0, `rgba(255,255,255,${.8 * f})`); hg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = hg; c.fillRect(x - 7 * k, y - 7 * k, 14 * k, 14 * k); c.restore(); if (q.p >= 1) q.on = 0; } };
  // v803: ONE playback speed for everything (shaders, particles, overlay) like the playback-speed setting of Wallpaper Engine - nothing else about the original motion is changed
  window.WE_SPEED = window.WE_SPEED == null ? 1 : window.WE_SPEED; window.WE_CLOUD = window.WE_CLOUD == null ? .5 : window.WE_CLOUD;   // v808: everything runs at the original speed; only the cloud drift (the flow-map shake) is slowed
  const pic = (id, name, cfg) => {
    if (window.WEP && window.WEP.th && window.WEP.th[id]) cfg = Object.assign({}, cfg, { extra: null, init: null, stars: 0, shoot: false, moon: null, mist: [0, .6, .9] });   // the real particle files drive these (wepart.js)
    const th = { id, name, img: 'backdrops/' + (cfg.file || id) + '.webp', mask: cfg.mask || '', scene: cfg.scene || null, we3: cfg.we3 || null, vid: cfg.vid || '', dat: cfg.file || id, hidden: false, noOv: !!cfg.we3 || !!cfg.vid || !!(window.WEP && window.WEP.th && window.WEP.th[id]) };
    th.init = () => ({ st: stars(cfg.stars || 40, H * (cfg.ymax || .4)), mist: mistBlobs(cfg.mist ? cfg.mist[0] : 5, cfg.mist ? cfg.mist[1] : .62, cfg.mist ? cfg.mist[2] : .9, cfg.mistCol || 'rgba(150,165,215,A)'), x: cfg.init ? cfg.init() : {} });
    th.draw = (c, t, s, dt) => { c.clearRect(0, 0, W, H); if (cfg.stars !== 0) twinkle(c, s.st, t); drawMist(c, s.mist, dt); if (cfg.moon) moonGlow(c, cfg.moon[0], cfg.moon[1], t); if (cfg.shoot !== false) shooter(s, c, dt); if (cfg.extra) cfg.extra(c, t, s.x, dt); };
    T.push(th);
  };
  const flakes = (n) => Array.from({ length: n }, () => ({ x: rr(0, W), y: rr(0, H), z: rr(.3, 1), p: rr(0, TAU) }));

  // v802: the real Wallpaper Engine bird particles (animated sprite sheets) that fly through the Mystical landscape and the Blue hour scenes
  const SPR = {}; const sprite = (f) => SPR[f] || (SPR[f] = Object.assign(new Image(), { src: 'backdrops/' + f }));
  const BIRDS = {
    mystic: { file: 'birds_mystic.webp', cols: 8, rows: 2, frames: 16, n: 30, life: 25, size: [50, 60], sx: 4060, sy: 930, sr: 64, vx: [-50, -20], vy: [-100, -5], gx: -30, gy: 0, drag: .1, fps: 24, alpha: .5, wob: 0 },
    bluehour: { file: 'birds_blue.webp', cols: 8, rows: 3, frames: 24, n: 18, life: 70, size: [16, 16], sx: 4015, sy: 414, sr: 20, vx: [-50, -49], vy: [-3, 3], gx: -40, gy: 0, drag: .5, fps: 10, alpha: 1, wob: 2 },
  };
  const weBirds = (c, t, x, id, dt) => {
    const B = BIRDS[id], im = sprite(B.file); if (!im.complete || !im.naturalWidth) return;
    const k = W / 3840, fw = im.naturalWidth / B.cols, fh = im.naturalHeight / B.rows;
    const spawn = (b, warm) => { b.x = B.sx + rr(-B.sr, B.sr); b.y = B.sy + rr(-B.sr, B.sr); b.vx = rr(B.vx[0], B.vx[1]); b.vy = rr(B.vy[0], B.vy[1]); b.age = warm ? rr(0, B.life) : 0; b.sz = rr(B.size[0], B.size[1]); b.ph = rr(0, TAU); b.fo = rr(0, B.frames); return b; };
    if (!x.bd) { x.bd = Array.from({ length: B.n }, () => spawn({}, true)); for (const b of x.bd) { const s = b.age; b.age = 0; let a = 0; while (a < s) { const d = .5; b.vx += B.gx * d; b.vx *= 1 - B.drag * d; b.x += b.vx * d; b.y += b.vy * d; a += d; } b.age = s; } }
    c.save(); c.globalAlpha = B.alpha;
    for (const b of x.bd) {
      b.age += dt; if (b.age > B.life || b.x < -300) { spawn(b, false); continue; }
      b.vx += B.gx * dt; b.vy += B.gy * dt; b.vx *= 1 - B.drag * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      const wy = B.wob ? Math.sin(t * (.5 + b.ph % 3) + b.ph) * B.wob * 8 : 0;
      const px = b.x * k, py = (b.y + wy) * k; if (px < -40 || px > W + 40 || py < -40 || py > H + 40) continue;
      const fr = Math.floor(b.fo + t * B.fps) % B.frames, sw = b.sz * k, sh = sw * fh / fw;
      let fade = Math.min(1, b.age / 1.5, (B.life - b.age) / 1.5);
      c.globalAlpha = B.alpha * Math.max(0, fade);
      c.save(); c.translate(px, py); c.scale(-1, 1);   // the particles are flipped, so the birds fly to the left
      c.drawImage(im, (fr % B.cols) * fw, Math.floor(fr / B.cols) * fh, fw, fh, -sw / 2, -sh / 2, sw, sh); c.restore();
    }
    c.restore();
  };

  const dust = (first) => ({ x: rr(-10, W * .6), y: rr(H * .18, H * .95), vx: rr(-2, 2), vy: rr(-2, 2), r: rr(.8, 1.6), f: rr(.5, 1), o: rr(3, 7), p: rr(0, TAU), life: rr(3, 10), age: first ? rr(0, 6) : 0 });

  // the Wallpaper Engine coast: leaves blow off the grass, dust motes glitter, warm light drifts across (numbers follow the original particle files)
  pic('coast', 'Chill coast', { file:'coast', stars:0, shoot:false, mist:[0,.6,.9],
    init: () => ({ lv: [], ld: 0, du: Array.from({ length: 70 }, () => dust(true)) }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const d of x.du) { d.age += dt; d.x += d.vx * dt + Math.sin(t * d.f + d.p) * 3 * dt; d.y += d.vy * dt + Math.cos(t * d.f * .8 + d.p) * 3 * dt; if (d.age > d.life) Object.assign(d, dust(false)); const k = Math.min(1, d.age / (d.life * .3), (d.life - d.age) / (d.life * .7)) * (.65 + .35 * Math.sin(t * d.o + d.p)); glow(c, d.x, d.y, d.r * 3.2, 'rgba(255,238,170,A)', .55 * k); }
      c.globalCompositeOperation = 'source-over';
      x.ld -= dt; if (x.ld <= 0 && x.lv.length < 16) { x.ld = rr(.25, .5); x.lv.push({ x: rr(.62, 1) * W, y: rr(.6, .84) * H, vx: -rr(26, 52), vy: rr(6, 46), a: rr(0, TAU), w: rr(-2.4, 2.4), age: 0, life: rr(4, 5.5), p: rr(0, TAU), s: rr(.8, 1.2), g: rr(190, 250) | 0 }); }
      for (let i = x.lv.length - 1; i >= 0; i--) { const l = x.lv[i]; l.age += dt; if (l.age > l.life) { x.lv.splice(i, 1); continue; } l.x += (l.vx + Math.sin(t * 1.7 + l.p) * 10) * dt; l.y += (l.vy + Math.cos(t * 1.3 + l.p) * 8) * dt; l.a += l.w * dt;
        c.save(); c.translate(l.x, l.y); c.rotate(l.a); c.scale(1, .5 + .5 * Math.abs(Math.sin(l.a * .9 + l.p))); c.globalAlpha = Math.min(1, l.age / (l.life * .1), (l.life - l.age) / (l.life * .9)) * .9; c.fillStyle = `rgb(255,${l.g},70)`; c.beginPath(); c.ellipse(0, 0, 3.4 * l.s, 1.7 * l.s, 0, 0, TAU); c.fill(); c.restore(); }
      c.globalAlpha = 1; } });
  T.find((x) => x.id === 'coast').we = true;

  // Wallpaper Engine scene #4 (v761): "Mountains in winter" - the painting with its own cloud drift (three shakes) and lake waves; the clock / weekday text of the original is not drawn
  pic('winter', 'Mountains in winter', { file:'winter', stars:0, shoot:false, mist:[0,.6,.9] });
  { const th = T.find((x) => x.id === 'winter'); th.we2 = true; th.names = ['plate', 'mWater', 'sFlowA', 'sFlowB', 'sFlowC'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [
      { t: 2, a: [1, .1, 1, 1], b: [0, 0, 0, 0], m: 'sFlowA' },
      { t: 2, a: [.78, .091, 1, 1], b: [0, 0, 0, 0], m: 'sFlowB' },
      { t: 2, a: [.62, .076, 1, 1], b: [0, 0, 0, 0], m: 'sFlowC' },
      { t: 1, a: [0, 114.35, 1.05, .07], b: [0, .76, 0, 0], m: 'mWater' }] }]; }

  // Wallpaper Engine scene #6 (v767): "Sunrise Landscape Nature 4K" - the painting with its own flow-map shake (clouds, grass, wheat), god rays from the sun, drifting fog and slow warm light shafts. The rays / fog / shafts are drawn approximately
  pic('sunrise', 'Sunrise landscape', { file:'sunrise', stars:0, shoot:false, mist:[7, .5, .72], mistCol:'rgba(255,214,170,A)',
    init: () => ({ sh: Array.from({ length: 5 }, (_, i) => ({ a: i * 1.26 + rr(-.3, .3), v: rr(.01, .03) * (i % 2 ? 1 : -1), w: rr(.18, .3), p: rr(0, TAU), f: rr(.15, .35) })) }),
    extra: (c, t, x, dt) => {
      const sx = .5 * W, sy = .475 * H, R = W * .9;
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const r of x.sh) {   // god rays: long soft wedges fanning out of the sun, each slowly turning and breathing
        r.a += r.v * dt; const al = (.5 + .5 * Math.sin(t * r.f + r.p)) * .05 + .012;
        c.save(); c.translate(sx, sy); c.rotate(r.a - Math.PI / 2);
        const g = c.createLinearGradient(0, 0, 0, R); g.addColorStop(0, `rgba(255,220,160,${al * 2})`); g.addColorStop(.35, `rgba(255,200,140,${al})`); g.addColorStop(1, 'rgba(255,190,130,0)');
        c.fillStyle = g; for (const k of [1, .75, .5, .3]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(-R * r.w * .55 * k, R); c.lineTo(R * r.w * .55 * k, R); c.closePath(); c.globalAlpha = .4; c.fill(); } c.restore();
      }
      c.restore();
    } });
  { const th = T.find((x) => x.id === 'sunrise'); th.we2 = true; th.names = ['plate', 'sFlow'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [
      { t: 2, a: [1, .1, 1, 1], b: [0, 0, 0, 0], m: 'sFlow' }] }]; }

  // Wallpaper Engine scene #7 (v768): "The Blue Hour [4K]" - three layers (sky, water reflection, land): flowing + rippling water, the nebula and the road / house lights pulse, foliage sways, stars twinkle, shooting stars, glittering road lights. Light rays and mouse parallax are not reproduced; clock / audio bars / music / intro are left out
  pic('bluehour', 'The blue hour', { file:'bluehour', stars:70, ymax:.3, shoot:true, mist:[0,.6,.9],
    init: () => ({ sp: Array.from({ length: 46 }, () => ({ x: rr(.4, .9), y: rr(.5, .66), r: rr(.7, 1.6), f: rr(.6, 1.8), p: rr(0, TAU), c: Math.random() < .7 ? '255,200,110' : '255,236,200' })) }),
    extra: (c, t, x, dt) => {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const s of x.sp) { const a = Math.max(0, Math.sin(t * s.f + s.p)); if (a < .05) continue; const px = s.x * W, py = s.y * H, g = c.createRadialGradient(px, py, 0, px, py, s.r * 3.2); g.addColorStop(0, `rgba(${s.c},${.55 * a})`); g.addColorStop(1, `rgba(${s.c},0)`); c.fillStyle = g; c.fillRect(px - s.r * 3.2, py - s.r * 3.2, s.r * 6.4, s.r * 6.4); }
      c.restore();
      weBirds(c, t, x, 'bluehour', dt);
    } });
  { const th = T.find((x) => x.id === 'bluehour'); th.we2 = true; th.names = ['bg', 'water', 'fg', 'sFlowBg', 'sFlowBg2', 'mRipBg', 'mRipBg2', 'mNeb', 'sFlowW', 'mRipW', 'mSwA', 'mSwB', 'mPulA', 'mPulB'];
    th.lay = () => [
      { k: 'bg', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [   // the real effect list: flow, ripple, flow, nebula pulse, ripple (constants from the scene file)
        { t: 6, a: [.04, .4, .6, 2], m: 'sFlowBg' },
        { t: 7, a: [.07, .6, .06, -1.5707963], b: [1, .05], m: 'mRipBg' },
        { t: 6, a: [.03, .4, 1, 2], m: 'sFlowBg2' },
        { t: 5, a: [1.4, .24, .05, .5], b: [.4, .76, 1, 0], m: 'mNeb' },
        { t: 7, a: [.09, .75, .04, .43633232], b: [1, .04], m: 'mRipBg2' }] },
      { k: 'water', rect: [0, 0, 1, 1], asp: 16 / 9, ops: [
        { t: 6, a: [.03, .4, 1, 2], m: 'sFlowW' },
        { t: 7, a: [.08, 1.1, 0, 0], b: [1, .06], m: 'mRipW', pm: [1, 0, 0, 0, 1 / .69, 0, 0, -.31 / .69, 1] }] },
      { k: 'fg', rect: [0, 0, 1, 1], asp: 16 / 9, ops: [
        { t: 3, a: [0, .33, .5, 1.5], b: [1, 0, 0, 0], m: 'mSwA' },
        { t: 3, a: [-.5236, .25, .5, 1.5], b: [1, 0, 0, 0], m: 'mSwB' },
        { t: 5, a: [2, .4, .45, .4], b: [1, .455, 0, 0], m: 'mPulA' },
        { t: 5, a: [2, .5, 1, .45], b: [1, .455, 0, 0], m: 'mPulB' }] }]; }

  // Wallpaper Engine scene #8 (v769): "Pine forest" - the picture with its two foliage-sway effects (canopy + fluttering needles), plus drifting snow motes, pink petals, green fireflies and a soft pink glare from the top right. Particles and glare are drawn approximately
  pic('pineforest', 'Pine forest', { file:'pineforest', stars:0, shoot:false, mist:[0,.6,.9],
    init: () => {
      const ff = (cx, cy) => Array.from({ length: 10 }, () => ({ cx: cx * W, cy: cy * H, x: rr(-107, 107), y: rr(-60, 60), p: rr(0, TAU), f: rr(.5, 1.2), w: rr(.2, .5), r: rr(2.6, 4) }));
      const pet = () => ({ x: 0, y: 0, vx: -rr(10, 21), vy: rr(3, 21), a: rr(0, TAU), w: rr(-2, 2), s: rr(2, 4.2), life: rr(8, 10), age: 1e9, ox: 0, oy: 0, p: rr(0, TAU), c: Math.random() < .5 ? '255,255,255' : '255,192,248' });
      return { ff: [...ff(.346, .81), ...ff(.67, .82)], sn: Array.from({ length: 110 }, () => ({ x: rr(-208, 208), y: rr(-208, 208), vx: -rr(2, 8), vy: rr(10, 16), r: rr(.4, 1.5), a: rr(.25, .6), p: rr(0, TAU), f: rr(.4, 1.2) })), pt: Array.from({ length: 60 }, (_, i) => Object.assign(pet(), { g: i % 2 })), gl: Array.from({ length: 4 }, (_, i) => ({ a: 1.9 + i * .27, v: rr(.008, .02) * (i % 2 ? 1 : -1), w: rr(.2, .34), p: rr(0, TAU), f: rr(.12, .3) })) };
    },
    extra: (c, t, x, dt) => {
      c.save(); c.globalCompositeOperation = 'lighter';
      const sx = .99 * W, sy = .3 * H, R = W * 1.1;
      for (const r of x.gl) {   // the pink glare: soft wedges out of the top right, slowly turning and breathing
        r.a += r.v * dt; const al = (.5 + .5 * Math.sin(t * r.f + r.p)) * .035 + .008;
        c.save(); c.translate(sx, sy); c.rotate(r.a);
        const g = c.createLinearGradient(0, 0, 0, R); g.addColorStop(0, `rgba(255,150,190,${al * 2})`); g.addColorStop(.4, `rgba(255,130,180,${al})`); g.addColorStop(1, 'rgba(255,120,170,0)');
        c.fillStyle = g; c.globalAlpha = .4; for (const k of [1, .75, .5, .3]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(-R * r.w * .55 * k, R); c.lineTo(R * r.w * .55 * k, R); c.closePath(); c.fill(); } c.restore();
      }
      for (const f of x.ff) {   // fireflies: slow wander, soft pulsing glow
        f.p += f.f * dt; const a = Math.max(0, Math.sin(f.p)); if (a < .03) continue; const px = f.cx + f.x + Math.sin(t * f.w + f.p * 1.7) * 10, py = f.cy + f.y + Math.cos(t * f.w * 1.3 + f.p) * 7;
        const g = c.createRadialGradient(px, py, 0, px, py, f.r * 2.6); g.addColorStop(0, `rgba(190,255,120,${.8 * a})`); g.addColorStop(.35, `rgba(150,255,90,${.22 * a})`); g.addColorStop(1, 'rgba(140,255,80,0)'); c.fillStyle = g; c.fillRect(px - f.r * 2.6, py - f.r * 2.6, f.r * 5.2, f.r * 5.2);
      }
      for (const s of x.sn) {   // snow motes
        s.x += (s.vx + Math.sin(t * s.f + s.p) * 3) * dt; s.y += s.vy * dt; if (s.y > 225) { s.y = -208; s.x = rr(-208, 208); }
        const px = 31 + s.x, py = H * .745 + s.y; if (px < -4 || py < -4 || py > H + 4) continue; c.fillStyle = `rgba(255,255,255,${s.a * (.6 + .4 * Math.sin(t * s.f * 2 + s.p))})`; c.beginPath(); c.arc(px, py, s.r, 0, TAU); c.fill();
      }
      c.restore();
      for (const q of x.pt) {   // pink petals
        q.age += dt; if (q.age > q.life) { const o = q.g ? [543, .535 * H] : [299, .41 * H], d = Math.random() * TAU, rr_ = Math.sqrt(Math.random()) * 156; Object.assign(q, { ox: o[0] + Math.cos(d) * rr_, oy: o[1] + Math.sin(d) * rr_ * .7, age: 0 }); q.x = q.ox; q.y = q.oy; }
        q.x += (q.vx + Math.sin(t * 1.3 + q.p) * 5) * dt; q.y += (q.vy + Math.cos(t * 1.1 + q.p) * 3) * dt; q.a += q.w * dt;
        c.save(); c.translate(q.x, q.y); c.rotate(q.a); c.scale(1, .45 + .55 * Math.abs(Math.sin(q.a * .8 + q.p))); c.globalAlpha = Math.min(1, q.age / (q.life * .15), (q.life - q.age) / (q.life * .25)) * .7; c.fillStyle = `rgb(${q.c})`; c.beginPath(); c.ellipse(0, 0, q.s, q.s * .55, 0, 0, TAU); c.fill(); c.restore();
      }
      c.globalAlpha = 1;
    } });
  { const th = T.find((x) => x.id === 'pineforest'); th.we2 = true; th.names = ['plate', 'mSwA', 'mSwB'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [
      { t: 3, a: [.3883, .28, .5, 3.18], b: [1, 0, 0, 0], m: 'mSwA' },
      { t: 3, a: [.8409, .25, .24, 8.92], b: [1, 0, 0, 0], m: 'mSwB' }] }]; }

  // Wallpaper Engine scene #9 (v770): "Nature in winter" - the picture with its two flow-map shakes (clouds / snow-laden trees) plus falling snow from five emitters (snow is drawn approximately)
  pic('natwinter', 'Nature in winter', { file:'natwinter', stars:0, shoot:false, mist:[0,.6,.9],
    init: () => ({ sn: [[904, 1576], [1010, 592], [2829, 1623], [2717, 529], [1968, 1285]].flatMap(([ox, oy]) => Array.from({ length: 36 }, () => ({ cx: ox / 3840 * W, cy: (2160 - oy) / 2160 * H, x: rr(-208, 208), y: rr(-208, 208), vx: -rr(2, 8), vy: rr(10, 19), r: rr(.4, 1.7), a: rr(.35, .9), p: rr(0, TAU), f: rr(.4, 1.2), age: rr(0, 12), life: rr(8, 20) }))) }),
    extra: (c, t, x, dt) => {
      for (const s of x.sn) {
        s.age += dt; s.x += (s.vx + Math.sin(t * s.f + s.p) * 3) * dt; s.y += s.vy * dt;
        if (s.age > s.life) { s.age = 0; s.x = rr(-208, 208); s.y = rr(-208, 208); s.life = rr(8, 20); }
        const px = s.cx + s.x, py = s.cy + s.y; if (px < -3 || px > W + 3 || py < -3 || py > H + 3) continue;
        c.fillStyle = `rgba(255,255,255,${s.a * Math.min(1, s.age / 1.2, (s.life - s.age) / 1.5)})`; c.beginPath(); c.arc(px, py, s.r, 0, TAU); c.fill();
      }
    } });
  { const th = T.find((x) => x.id === 'natwinter'); th.we2 = true; th.names = ['plate', 'sFlowA', 'sFlowB'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [
      { t: 2, a: [.73, .066, 1, 1], b: [0, 0, 0, 0], m: 'sFlowA' },
      { t: 2, a: [1.09, .089, 1, 1], b: [0, 0, 0, 0], m: 'sFlowB' }] }]; }

  // Wallpaper Engine scene #10 (v771): "Mystical Landscape 4k" - nine layers (sky, moon, water patches, two trees, cliffs): the water flows and ripples, the white trees sway and pulse, with stars, a moon glow, fireflies and rising embers (particles drawn approximately). The moon's lens warp, birds, wind trails, clock / date / music player are left out
  pic('mystic', 'Mystical landscape', { file:'mystic', stars:70, ymax:.42, shoot:false, mist:[0,.6,.9],
    init: () => ({ ff: [[.031, .561], [.831, .718], [.9, .485], [.28, .51]].flatMap(([fx, fy]) => Array.from({ length: 5 }, () => ({ cx: fx * W, cy: fy * H, x: rr(-16, 16), y: rr(-14, 14), p: rr(0, TAU), f: rr(.5, 1.2), w: rr(.2, .5), r: rr(1.6, 2.6) }))),
      em: Array.from({ length: 34 }, () => ({ x: rr(.05, .95) * W, y: rr(.5, 1) * H, vy: -rr(3, 9), vx: rr(-2, 3), r: rr(.7, 1.6), p: rr(0, TAU), f: rr(.5, 1.4), a: rr(.25, .6) })) }),
    extra: (c, t, x, dt) => {
      c.save(); c.globalCompositeOperation = 'lighter';
      { const mx = .627 * W, my = .3766 * H, g = c.createRadialGradient(mx, my, 20, mx, my, 150), a = .05 + .02 * Math.sin(t * .6); g.addColorStop(0, `rgba(255,120,40,${a})`); g.addColorStop(1, 'rgba(255,100,30,0)'); c.fillStyle = g; c.fillRect(mx - 150, my - 150, 300, 300); }
      for (const f of x.ff) { f.p += f.f * dt; const a = Math.max(0, Math.sin(f.p)); if (a < .03) continue; const px = f.cx + f.x + Math.sin(t * f.w + f.p * 1.7) * 5, py = f.cy + f.y + Math.cos(t * f.w * 1.3 + f.p) * 4;
        const g = c.createRadialGradient(px, py, 0, px, py, f.r * 2.6); g.addColorStop(0, `rgba(190,255,120,${.8 * a})`); g.addColorStop(.35, `rgba(150,255,90,${.2 * a})`); g.addColorStop(1, 'rgba(140,255,80,0)'); c.fillStyle = g; c.fillRect(px - f.r * 2.6, py - f.r * 2.6, f.r * 5.2, f.r * 5.2); }
      for (const e of x.em) { e.y += e.vy * dt; e.x += (e.vx + Math.sin(t * e.f + e.p) * 3) * dt; if (e.y < -4) { e.y = H + 4; e.x = rr(.05, .95) * W; } const al = e.a * (.6 + .4 * Math.sin(t * e.f * 2 + e.p));
        const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 3); g.addColorStop(0, `rgba(255,160,70,${al})`); g.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g; c.fillRect(e.x - e.r * 3, e.y - e.r * 3, e.r * 6, e.r * 6); }
      c.restore();
      weBirds(c, t, x, 'mystic', dt);
    } });
  { const th = T.find((x) => x.id === 'mystic'); th.we2 = true; th.names = ['back', 'moon', 'p1', 'p26', 'p2', 'tree2', 'tree', 'cliff', 'sF1', 'sF26a', 'sF26b', 'mR26', 'sF2a', 'sF2b', 'mT2W', 'mT2P', 'mTW1', 'mTW2', 'mTP', 'sTF'];
    const wv = (dir, sc, sp, st, m, ch, ex) => ({ t: 1, a: [dir, sc, sp, st], b: [0, ex || 1, 0, 0], m, ch });
    th.lay = () => [
      { k: 'back', rect: [-0.08, -0.08, 1.08, 1.08], solid: true, asp: 16 / 9 },
      { k: 'moon', rect: [0.4213, 0.0176, 0.832, 0.7356], asp: 1577 / 1551 },
      { k: 'p1', rect: [-0.0646, 0.3403, 1.0536, 0.8773], asp: 3840 / 1160, ops: [{ t: 7, a: [.1, 1.56, .1, 1.6250538], b: [1, .05] }, { t: 6, a: [.1, .4, 1, 2], m: 'sF1' }] },
      { k: 'p26', rect: [0.275, 0.4958, 1.0, 1.0], asp: 2784 / 1089, ops: [
        { t: 7, a: [.15, .83, .4, 2.6757927], b: [1, .05], m: 'mR26', ch: 0 }, { t: 7, a: [.1, .4, .4, -3.0643771], b: [1, .05], m: 'mR26', ch: 1 },
        { t: 6, a: [.54, .5, 1.2, 2], m: 'sF26a' }, { t: 6, a: [.94, .5, 2, 2], m: 'sF26b' }] },
      { k: 'p2', rect: [0.2706, 0.7231, 1.1024, 1.0], asp: 3194 / 598, ops: [{ t: 7, a: [.1, 1.56, .1, 1.1350935], b: [1, .04] }, { t: 6, a: [.08, .4, 1.5, 2], m: 'sF2a' }, { t: 6, a: [.08, .4, 1.3, 2], m: 'sF2b' }] },
      { k: 'tree2', rect: [0.8178, 0.3686, 0.9993, 0.5857], asp: 697 / 469, ops: [wv(-.899, 10, 2, .07, 'mT2W', 0), wv(1.3, 10, 2, .1, 'mT2W', 1), wv(-1.279, 10, 2, .1, 'mT2W', 2), { t: 5, a: [2.5, .3, 0, .5], b: [1, 1, 1, 0], m: 'mT2P' }] },
      { k: 'tree', rect: [0.0928, 0.1135, 0.4618, 0.5894], asp: 1417 / 1028, ops: [wv(-2.93, 3, 1.5, .08, 'mTW1', 0), wv(.4, 3, 1.5, .1, 'mTW1', 1), wv(-2.3, 3, 1.5, .1, 'mTW1', 2), wv(.93, 3, 1.5, .1, 'mTW2', 0), wv(0, 3, .5, .1, 'mTW2', 1),
        { t: 2, a: [.7, .15, 1, 1], b: [0, 0, 0, 0], m: 'sTF' }, { t: 5, a: [2.5, .2, 0, .5], b: [1, 1, 1, 0], m: 'mTP' }] },
      { k: 'cliff', rect: [-0.01, 0.1509, 1.01, 1.0084], asp: 3840 / 1816 }]; }

  // Wallpaper Engine scene #11 (v772): "Japan Nature" - the picture with its water flow, drifting leaves from two spots and soft light shafts (leaves / shafts drawn approximately). The clock, day and date are removed
  pic('japan', 'Japan nature', { file:'japan', stars:0, shoot:false, mist:[0,.6,.9],
    init: () => {
      const lf = (g) => ({ g, x: 0, y: 0, vx: -rr(10, 21), vy: rr(3, 21), a: rr(0, TAU), w: rr(-2, 2), s: rr(1.6, 3.2), life: rr(8, 10), age: 1e9, p: rr(0, TAU), c: g ? ['255,236,40', '255,200,60', '255,255,230'][Math.floor(rr(0, 3))] : ['255,255,255', '255,120,110', '240,80,70'][Math.floor(rr(0, 3))] });
      return { lf: Array.from({ length: 70 }, (_, i) => lf(i % 2)), sh: Array.from({ length: 4 }, (_, i) => ({ a: .15 + i * .22, v: rr(.006, .016) * (i % 2 ? 1 : -1), w: rr(.14, .24), p: rr(0, TAU), f: rr(.15, .3) })) };
    },
    extra: (c, t, x, dt) => {
      c.save(); c.globalCompositeOperation = 'lighter';
      const sx = .45 * W, sy = -.06 * H, R = H * 1.5;
      for (const r of x.sh) {   // light shafts slanting in from the top
        r.a += r.v * dt; const al = (.5 + .5 * Math.sin(t * r.f + r.p)) * .03 + .006;
        c.save(); c.translate(sx, sy); c.rotate(r.a);
        const g = c.createLinearGradient(0, 0, 0, R); g.addColorStop(0, `rgba(255,255,255,${al * 2})`); g.addColorStop(.5, `rgba(190,235,255,${al})`); g.addColorStop(1, 'rgba(160,220,255,0)');
        c.fillStyle = g; c.globalAlpha = .4; for (const k of [1, .75, .5, .3]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(-R * r.w * .55 * k, R); c.lineTo(R * r.w * .55 * k, R); c.closePath(); c.fill(); } c.restore();
      }
      c.restore();
      for (const q of x.lf) {   // drifting leaves, spawned around two spots
        q.age += dt; if (q.age > q.life) { const o = q.g ? [.525 * W, .531 * H, 156] : [.137 * W, .673 * H, 67], d = Math.random() * TAU, r = Math.sqrt(Math.random()) * o[2]; q.x = o[0] + Math.cos(d) * r; q.y = o[1] + Math.sin(d) * r * .7; q.age = 0; }
        q.x += (q.vx + Math.sin(t * 1.3 + q.p) * 5) * dt; q.y += (q.vy + Math.cos(t * 1.1 + q.p) * 3) * dt; q.a += q.w * dt;
        c.save(); c.translate(q.x, q.y); c.rotate(q.a); c.scale(1, .45 + .55 * Math.abs(Math.sin(q.a * .8 + q.p))); c.globalAlpha = Math.min(1, q.age / (q.life * .15), (q.life - q.age) / (q.life * .25)) * .85; c.fillStyle = `rgb(${q.c})`; c.beginPath(); c.ellipse(0, 0, q.s, q.s * .55, 0, 0, TAU); c.fill(); c.restore();
      }
      c.globalAlpha = 1;
    } });
  { const th = T.find((x) => x.id === 'japan'); th.we2 = true; th.names = ['plate', 'sFlow'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [{ t: 6, a: [1, .5, .25, .01], m: 'sFlow' }] }]; }

  // Wallpaper Engine scene #12 (v774): "Arctic lake" - the picture with its own water waves on the lake and a flow-map shake (aurora / sky). The clock, day and date are removed
  pic('arctic', 'Arctic lake', { file:'arctic', stars:0, shoot:false, mist:[0,.6,.9] });
  { const th = T.find((x) => x.id === 'arctic'); th.we2 = true; th.names = ['plate', 'mWater', 'sFlow'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [
      { t: 1, a: [0, 57.18, 1.57, .08], b: [0, .76, 0, 0], m: 'mWater' },
      { t: 2, a: [1.04, .071, 1, 1], b: [0, 0, 0, 0], m: 'sFlow' }] }]; }

  // Wallpaper Engine scene #13 (v775): "Autumn/fall in the city" - the picture with its two flow-map shakes (sky / haze) and two foliage-sway effects (the red trees). The clock, day and date are removed
  pic('autumncity', 'Autumn in the city', { file:'autumncity', stars:0, shoot:false, mist:[0,.6,.9] });
  { const th = T.find((x) => x.id === 'autumncity'); th.we2 = true; th.names = ['plate', 'sFlowA', 'sFlowB', 'mSwA', 'mSwB'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [
      { t: 2, a: [1.77, .086, 1, 1], b: [0, 0, 0, 0], m: 'sFlowA' },
      { t: 2, a: [1.09, .081, 1, 1], b: [0, 0, 0, 0], m: 'sFlowB' },
      { t: 3, a: [0, .34, .5, 4.17], b: [1, 0, 0, 0], m: 'mSwA' },
      { t: 3, a: [0, .4, .5, 2.71], b: [1, 0, 0, 0], m: 'mSwB' }] }]; }

  // Wallpaper Engine scene #14 (v776): "Cave" - the picture with its own water waves and three foliage sways (the glowing trees). The clock, day and date are removed
  pic('cave', 'Cave', { file:'cave', stars:0, shoot:false, mist:[0,.6,.9] });
  { const th = T.find((x) => x.id === 'cave'); th.we2 = true; th.names = ['plate', 'mWater', 'mSwA', 'mSwB', 'mSwC'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [
      { t: 1, a: [0, 109.16, 3.39, .04], b: [0, .84, 0, 0], m: 'mWater' },
      { t: 3, a: [0, .36, .5, 3.96], b: [1, 0, 0, 0], m: 'mSwA' },
      { t: 3, a: [0, .31, .5, 2.71], b: [1, 0, 0, 0], m: 'mSwB' },
      { t: 3, a: [0, .29, .5, 1.88], b: [1, 0, 0, 0], m: 'mSwC' }] }]; }

  // Wallpaper Engine scene #15 (v777): "Snowy city" - the picture with its own water waves, flow-map shake (sky) and foliage sway, plus falling snow from four spots (snow drawn approximately)
  pic('snowcity', 'Snowy city', { file:'snowcity', stars:0, shoot:false, mist:[0,.6,.9],
    init: () => ({ sn: [[891, 1566, 1], [988, 638, 1], [2616, 1581, 1.2], [2681, 687, 1.14]].flatMap(([ox, oy, k]) => Array.from({ length: 40 }, () => ({ k, cx: ox / 3840 * W, cy: (2160 - oy) / 2160 * H, x: rr(-208, 208) * k, y: rr(-208, 208) * k, vx: -rr(2, 8), vy: rr(10, 19), r: rr(.4, 1.7), a: rr(.35, .9), p: rr(0, TAU), f: rr(.4, 1.2), age: rr(0, 12), life: rr(8, 20) }))) }),
    extra: (c, t, x, dt) => {
      for (const s of x.sn) {
        s.age += dt; s.x += (s.vx + Math.sin(t * s.f + s.p) * 3) * dt; s.y += s.vy * dt;
        if (s.age > s.life) { s.age = 0; s.x = rr(-208, 208) * s.k; s.y = rr(-208, 208) * s.k; s.life = rr(8, 20); }
        const px = s.cx + s.x, py = s.cy + s.y; if (px < -3 || px > W + 3 || py < -3 || py > H + 3) continue;
        c.fillStyle = `rgba(255,255,255,${s.a * Math.min(1, s.age / 1.2, (s.life - s.age) / 1.5)})`; c.beginPath(); c.arc(px, py, s.r, 0, TAU); c.fill();
      }
    } });
  { const th = T.find((x) => x.id === 'snowcity'); th.we2 = true; th.names = ['plate', 'mWater', 'sFlow', 'mSw'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [
      { t: 1, a: [0, 83.17, 1.83, .04], b: [0, .73, 0, 0], m: 'mWater' },
      { t: 2, a: [.94, .076, 1, 1], b: [0, 0, 0, 0], m: 'sFlow' },
      { t: 3, a: [0, .27, .5, 1.98], b: [1, 0, 0, 0], m: 'mSw' }] }]; }

  // Wallpaper Engine scene #16 (v778): "Snowy sunrise" - a wide (2:1) picture, centre-cropped to 16:9 like Wallpaper Engine does, with its flow-map shake (sky) and foliage sway (trees), plus falling snow from four spots (snow approximate). The day and date are removed
  pic('snowrise', 'Snowy sunrise', { file:'snowrise', stars:0, shoot:false, mist:[0,.6,.9],
    init: () => ({ sn: [[1423, 2061, 1.39], [4097, 1952, 1.39], [1637, 931, 1.36], [4216, 764, 1.33]].flatMap(([ox, oy, k]) => Array.from({ length: 40 }, () => ({ k: k * .8, cx: (ox - 313) / 5006 * W, cy: (2816 - oy) / 2816 * H, x: rr(-208, 208) * k * .8, y: rr(-208, 208) * k * .8, vx: -rr(2, 8), vy: rr(10, 19), r: rr(.4, 1.7), a: rr(.35, .9), p: rr(0, TAU), f: rr(.4, 1.2), age: rr(0, 12), life: rr(8, 20) }))) }),
    extra: (c, t, x, dt) => {
      for (const s of x.sn) {
        s.age += dt; s.x += (s.vx + Math.sin(t * s.f + s.p) * 3) * dt; s.y += s.vy * dt;
        if (s.age > s.life) { s.age = 0; s.x = rr(-208, 208) * s.k; s.y = rr(-208, 208) * s.k; s.life = rr(8, 20); }
        const px = s.cx + s.x, py = s.cy + s.y; if (px < -3 || px > W + 3 || py < -3 || py > H + 3) continue;
        c.fillStyle = `rgba(255,255,255,${s.a * Math.min(1, s.age / 1.2, (s.life - s.age) / 1.5)})`; c.beginPath(); c.arc(px, py, s.r, 0, TAU); c.fill();
      }
    } });
  { const th = T.find((x) => x.id === 'snowrise'); th.we2 = true; th.names = ['plate', 'sFlow', 'mSw'];
    th.lay = () => [{ k: 'plate', rect: [-.0625, 0, 1.0625, 1], solid: true, asp: 2, ops: [
      { t: 2, a: [.68, .074, 1, 1], b: [0, 0, 0, 0], m: 'sFlow' },
      { t: 3, a: [.01745, .24, .5, 3.02], b: [1, 0, 0, 0], m: 'mSw' }] }]; }

  pic('sunsetmt', 'Sunset in the mountains', { file:'sunsetmt', stars:0, shoot:false, mist:[0,.6,.9] });
  { const th = T.find((x) => x.id === 'sunsetmt'); th.we2 = true; th.names = ['plate', 'sF1', 'sF2', 'sF3', 'sF4', 'mWf'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [
      { t: 2, a: [1.25, .1, 1, 1], b: [0, 0, 0, 0], m: 'sF4' },
      { t: 2, a: [1, .1, 1, 1], b: [0, 0, 0, 0], m: 'sF1' },
      { t: 2, a: [.83, .091, 1, 1], b: [0, 0, 0, 0], m: 'sF3' },
      { t: 2, a: [.62, .069, 1, 1], b: [0, 0, 0, 0], m: 'sF2' },
      { t: 1, a: [-.0349, 77.97, 1.57, .05], b: [0, .69, 0, 0], m: 'mWf', ch: 0 },
      { t: 3, a: [0, .22, .5, 2.3], b: [1, 0, 0, 0], m: 'mWf', ch: 1 }] }]; }
  pic('nightlake', 'Night lake', { file:'nightlake', stars:0, shoot:false, mist:[0,.6,.9] });
  { const th = T.find((x) => x.id === 'nightlake'); th.we2 = true; th.names = ['plate', 'sF1', 'sF2', 'mWa'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [
      { t: 2, a: [1, .1, 1, 1], b: [0, 0, 0, 0], m: 'sF1' },
      { t: 2, a: [.99, .091, 1, 1], b: [0, 0, 0, 0], m: 'sF2' },
      { t: 1, a: [0, 26, 2.35, .04], b: [0, .66, 0, 0], m: 'mWa', ch: 0 }] }]; }
  pic('snowmtn', 'Snowy mountains', { file:'snowmtn', stars:0, shoot:false, mist:[0,.6,.9] });
  { const th = T.find((x) => x.id === 'snowmtn'); th.we2 = true; th.names = ['plate', 'sF1', 'sF2', 'sF3', 'sF4', 'mWf'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [
      { t: 2, a: [1.77, .094, 1, 1], b: [0, 0, 0, 0], m: 'sF1' },
      { t: 2, a: [1.3, .091, 1, 1], b: [0, 0, 0, 0], m: 'sF2' },
      { t: 2, a: [1, .1, 1, 1], b: [0, 0, 0, 0], m: 'sF3' },
      { t: 2, a: [.73, .076, 1, 1], b: [0, 0, 0, 0], m: 'sF4' },
      { t: 3, a: [-.0349, .28, .5, 3.33], b: [1, 0, 0, 0], m: 'mWf', ch: 1 },
      { t: 3, a: [0, .25, .5, 2.4], b: [1, 0, 0, 0], m: 'mWf', ch: 2 },
      { t: 1, a: [0, 62.38, 1.31, .06], b: [0, .69, 0, 0], m: 'mWf', ch: 0 }] }]; }
  pic('icyforest', 'Icy forest', { file:'icyforest', stars:0, shoot:false, mist:[0,.6,.9],
    init: () => ({ sn: [[1405, 2114, 1.57], [3718, 1965, 1.87], [1471, 828, 1.95], [4163, 755, 1.45]].flatMap(([ox, oy, k]) => Array.from({ length: 40 }, () => ({ k: k * .8, cx: ox / 5376 * W, cy: (3072 - oy) / 3072 * H, x: rr(-208, 208) * k * .8, y: rr(-208, 208) * k * .8, vx: -rr(2, 8), vy: rr(10, 19), r: rr(.4, 1.7), a: rr(.35, .9), p: rr(0, TAU), f: rr(.4, 1.2), age: rr(0, 12), life: rr(8, 20) }))) }),
    extra: (c, t, x, dt) => {
      for (const s of x.sn) {
        s.age += dt; s.x += (s.vx + Math.sin(t * s.f + s.p) * 3) * dt; s.y += s.vy * dt;
        if (s.age > s.life) { s.age = 0; s.x = rr(-208, 208) * s.k; s.y = rr(-208, 208) * s.k; s.life = rr(8, 20); }
        const px = s.cx + s.x, py = s.cy + s.y; if (px < -3 || px > W + 3 || py < -3 || py > H + 3) continue;
        c.fillStyle = `rgba(255,255,255,${s.a * Math.min(1, s.age / 1.2, (s.life - s.age) / 1.5)})`; c.beginPath(); c.arc(px, py, s.r, 0, TAU); c.fill();
      }
    } });
  { const th = T.find((x) => x.id === 'icyforest'); th.we2 = true; th.names = ['plate'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [] }]; }

  // Wallpaper Engine scene #21 (v809): "Meteors at Dawn [4K]" - 26 picture layers with the original effects (cloud flow, tree waves, wire sway, traffic-light pulse), stars / meteors / birds / fireflies from its own particle files drawn between the layers, and the real puddle reflection (the finished picture mirrored, rippled, shown where the reflection mask is lit). Clock, day and date are not drawn
  pic('meteors', 'Meteors at Dawn', { file:'meteors', stars:0, shoot:false, mist:[0,.6,.9] });
  { const th = T.find((x) => x.id === 'meteors'); th.we2 = true; th.zpart = true;
    th.names = ['background', 'clouds', 'mountain02', 'trees_far', 'houses', 'houses01', 'tree_close', 'bushes', 'fenceL', 'fenceR', 'wires', 'poles', 'traffic_light', 'land', 'grasses', 'railings', 'betong', 'electrical_cabinet', 'grass_small', 'bush', 'betong02', 'sunlight', 'sun', 'len', 'mWfC', 'mWvT', 'mFsW', 'mPuT', 'mRfl', 'mRpl'];
    const R = [0, 0, 1, 1], Q = (k, z, rect, x) => Object.assign({ k, z, rect, asp: 16 / 9 }, x || {});
    th.lay = () => [
      Q('background', 0, R, { solid: true }),
      Q('clouds', 3, [0, 0, 1, .76667], { ops: [{ t: 6, a: [.02, .4, 1, 1], m: 'mWfC', cl: 1 }] }),
      Q('mountain02', 5, [0, .4912, 1, .80046]), Q('trees_far', 6, [0, .4537, .56458, .77176]), Q('houses', 8, [0, .53287, 1, .76065]), Q('houses01', 9, [0, .53287, 1, .82269]),
      Q('tree_close', 10, [.22604, .06852, 1, .77083], { ops: [{ t: 1, a: [2.0943952, 9, 2.49, .019], b: [0, .9, 0, 0], m: 'mWvT' }] }),
      Q('bushes', 11, [0, .50093, 1, .8037]), Q('fenceL', 12, [.24323, .52315, .55703, .72361]), Q('fenceR', 14, [.60521, .37546, 1, .72407]),
      Q('wires', 16, [0, 0, 1, .60417], { asp: 3840 / 1305, ops: [{ t: 3, a: [1.5707963, .4, .09, 5], b: [1, 0, 0, 0], m: 'mFsW' }] }),
      Q('poles', 18, [.24609, 0, .7263, .73056]),
      Q('traffic_light', 19, [.36458, .26991, .49453, .49815], { ops: [{ t: 5, a: [3, 1.5, 0, .5], b: [1, 1, 1, 0], m: 'mPuT' }] }),
      Q('land', 20, [0, .67176, 1, 1]), Q('grasses', 21, [.02161, .6412, 1, .75139]), Q('railings', 22, [.56224, .50093, 1, .72593]), Q('betong', 23, [.55599, .6662, .97578, .73009]),
      Q('electrical_cabinet', 25, [.69401, .49213, .79427, .73472]), Q('grass_small', 27, [.5513, .65046, 1, .75417]), Q('bush', 29, [.30182, .6125, .41901, .72546]), Q('betong02', 30, [.2901, .66157, .42188, .72731]),
      Q('sunlight', 32, [.01901, .4787, .67786, .67454]),
      Q('sun', 34, [.01068, 0, .51302, .98843], { al: .69, scr: true }),
      Q('refl', 35, R, { fb: true, solid: true, ops: [{ t: 8, a: [-.41, 0, .9], m: 'mRfl' }, { t: 7, a: [.09, 1, 0, 2.1816616], b: [1, .04], m: 'mRpl' }] }),
      Q('len', 41, [.48698, 0, 1, .98843], { scr: true })]; }

  // Wallpaper Engine scene #22 (v810): "Japan Garden" - the picture with its real effect list (leaf sway, shake, water flow, water ripples, branch sway) plus fog, falling leaves, fireflies and light shafts from its own particle files
  pic('garden', 'Japan Garden', { file:'garden', stars:0, shoot:false, mist:[0,.6,.9] });
  { const th = T.find((x) => x.id === 'garden'); th.we2 = true; th.names = ['plate', 'mFsA', 'mFsB', 'sShk', 'sFlw', 'mRpl'];
    th.lay = () => [{ k: 'plate', rect: [0, 0, 1, 1], solid: true, asp: 16 / 9, ops: [
      { t: 3, a: [0, .4, .5, 4.07], b: [1, 0, 0, 0], m: 'mFsA' },
      { t: 2, a: [1, .076, 1, 1], b: [0, 0, 0, 0], m: 'sShk' },
      { t: 6, a: [1, .4, 1, 2], m: 'sFlw' },
      { t: 7, a: [.15, 1, 0, 0], b: [1, .06], m: 'mRpl' },
      { t: 3, a: [-.70928525, .2, .5, 5], b: [1, 0, 0, 0], m: 'mFsB' }] }]; }

  // Wallpaper Engine scene #23 (v811): "4K Nature: Landscape" - the picture with its real water effect chain (three ripple layers, two-wave water waves, flow) plus cyan fireflies and drifting cherry blossom from its own particle files, and the soft vignette. The fog/colour-grade effects, clock, day and date are not drawn
  pic('midaur', 'Midnight Aurora', { file:'midaur', stars:0, shoot:false, mist:[0,.6,.9] });
  { const th = T.find((x) => x.id === 'midaur'); th.we2 = true; th.names = ['plate', 'mRpA', 'mRpB', 'mRpC', 'sFlw'];
    th.lay = () => [{ k: 'plate', rect: [-.01058, -.01058, 1.01058, 1.01058], solid: true, asp: 16 / 9, ops: [
      { t: 7, a: [.09, 2, 0, 0], b: [1, .03], m: 'mRpA' },
      { t: 1, a: [1.0022277, 100, 2, .02], b: [0, 2, 0, 0], m: 'mRpA' },
      { t: 1, a: [-.12217305, 150, 2, .02], b: [0, 1, 0, 0], m: 'mRpA' },
      { t: 7, a: [.04, 3, .04, 3.0968204], b: [3.23, .07], m: 'mRpB' },
      { t: 7, a: [.08, 1.77, .08, 2.8912151], b: [1, .03], m: 'mRpC' },
      { t: 6, a: [.3, .5, .06, 5.5], m: 'sFlw' }] }, { vig: 1 }]; }
  // the drawn-only themes from v749 stay in the code but are not listed; the painted ones are
  for (const th of T) if (!th.img) th.hidden = true;
  // v879: "Abandoned City" (Wallpaper Engine scene by Devins Lee): the 4K picture with falling snow in three depths and drifting teal fog
  pic('abandoned', 'Abandoned City', { file:'abandoned', stars:0, shoot:false, mist:[7,.6,.9], mistCol:'rgba(110,200,200,A)',
    init: () => ({ sn: Array.from({ length: 170 }, () => { const z = rr(.25, 1); return { x: rr(0, W), y: rr(0, H), z, r: .5 + z * 1.9, vy: 14 + z * 46, vx: -(4 + z * 14), p: rr(0, TAU), f: rr(.4, 1.2), a: .25 + z * .6 }; }) }),
    extra: (c, t, x, dt) => {
      for (const s of x.sn) {
        s.y += s.vy * dt; s.x += (s.vx + Math.sin(t * s.f + s.p) * 6 * s.z) * dt;
        if (s.y > H + 4) { s.y = -4; s.x = rr(0, W * 1.15); } if (s.x < -4) s.x = W + 4;
        c.fillStyle = `rgba(235,250,255,${s.a})`; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill();
      }
    } });
  // v880: "Riozinho Picoroso" (Wallpaper Engine scene): the 4K night valley with twinkling stars, a breathing moon glow, drifting mist and a few fireflies by the stream
  pic('riozinho', 'Riozinho Picoroso', { file:'riozinho', stars:110, ymax:.42, shoot:true, mist:[5,.62,.9], mistCol:'rgba(90,140,230,A)', moon:[.48,.515],
    init: () => ({ ff: Array.from({ length: 26 }, () => ({ x: rr(W * .3, W * .7), y: rr(H * .66, H * .92), p: rr(0, TAU), f: rr(.3, .9), r: rr(.7, 1.6), vx: rr(-4, 4), vy: rr(-3, 3) })) }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 5) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < W * .25 || f.x > W * .75) f.vx = -f.vx; if (f.y < H * .6 || f.y > H * .95) f.vy = -f.vy;
        const a = .15 + .5 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(150,200,255,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v881: "Dream View 3" (Wallpaper Engine scene by Northway): purple-orange sunset peaks over a glowing waterfall pool, with twinkling stars, a soft moon glow, drifting mist and fireflies in the pines
  pic('dreamview3', 'Dream View 3', { file:'dreamview3', stars:90, ymax:.4, shoot:true, mist:[6,.6,.9], mistCol:'rgba(120,220,230,A)', moon:[.845,.14],
    init: () => ({ ff: Array.from({ length: 34 }, (_, i) => { const L = i % 2 === 0; return { x: L ? rr(W * .02, W * .3) : rr(W * .72, W * .98), y: rr(H * .62, H * .95), p: rr(0, TAU), f: rr(.3, .9), r: rr(.7, 1.7), vx: rr(-4, 4), vy: rr(-3, 3), L }; }) }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 5) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        const lo = f.L ? W * .0 : W * .7, hi = f.L ? W * .32 : W;
        if (f.x < lo || f.x > hi) f.vx = -f.vx; if (f.y < H * .6 || f.y > H * .96) f.vy = -f.vy;
        const a = .15 + .55 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(190,255,230,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v882: "Dream View 2" (Wallpaper Engine scene by Northway): aurora over snowy peaks, with twinkling stars, shooting stars, drifting mist and glinting snow
  pic('dreamview2', 'Dream View 2', { file:'dreamview2', stars:140, ymax:.5, shoot:true, mist:[5,.55,.9], mistCol:'rgba(150,190,255,A)',
    init: () => ({ sp: Array.from({ length: 40 }, () => ({ x: rr(0, W), y: rr(H * .74, H * .99), p: rr(0, TAU), f: rr(.4, 1.4), r: rr(.6, 1.6) })) }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const f of x.sp) { const a = Math.pow(Math.max(0, Math.sin(t * f.f + f.p)), 6) * .85; if (a < .03) continue; c.fillStyle = `rgba(220,240,255,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
    } });
  // v883: "House of Dreams" (Wallpaper Engine scene by Northway): lilac dusk cottage with drifting blossom petals from the tree, a curl of chimney smoke, glowing fireflies over the flower field and a few faint stars
  pic('houseofdreams', 'House of Dreams', { file:'houseofdreams', stars:40, ymax:.25, shoot:true, mist:[3,.5,.9], mistCol:'rgba(210,170,255,A)',
    init: () => ({
      pe: Array.from({ length: 46 }, () => ({ x: rr(W * .5, W * .85), y: rr(H * .2, H * .72), z: rr(.4, 1), p: rr(0, TAU), f: rr(.5, 1.4) })),
      sm: Array.from({ length: 40 }, (_, i) => ({ t: i / 40 })),
      ff: Array.from({ length: 36 }, () => ({ x: rr(0, W), y: rr(H * .74, H * .98), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.9), vx: rr(-5, 5), vy: rr(-3, 3) }))
    }),
    extra: (c, t, x, dt) => {
      for (const q of x.pe) {
        q.y += (16 + 26 * q.z) * dt; q.x += (-10 - 16 * q.z + Math.sin(t * q.f + q.p) * 14) * dt;
        if (q.y > H * .95 || q.x < -10) { q.x = rr(W * .52, W * .84); q.y = rr(H * .22, H * .5); }
        c.save(); c.translate(q.x, q.y); c.rotate(t * q.f + q.p); c.fillStyle = `rgba(255,${180 + 40 * q.z | 0},235,${.35 + .45 * q.z})`;
        c.beginPath(); c.ellipse(0, 0, 3.2 * q.z + 1, 1.8 * q.z + .6, 0, 0, TAU); c.fill(); c.restore();
      }
      for (const s of x.sm) {
        s.t += dt / 10; if (s.t > 1) s.t -= 1;
        const k = s.t, px = W * .359 + k * W * .035 + Math.sin(k * 7 + t * .5) * W * .005, py = H * .525 - k * H * .27, a = Math.sin(k * Math.PI) * .2, r = 3 + k * 16;
        const g = c.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(240,230,255,${a})`); g.addColorStop(1, 'rgba(240,230,255,0)');
        c.fillStyle = g; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'lighter';
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < 0 || f.x > W) f.vx = -f.vx; if (f.y < H * .72 || f.y > H) f.vy = -f.vy;
        const a = .15 + .6 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(255,225,170,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v884: "Coastal Landscape" (Wallpaper Engine scene): bright daytime cliffs and sea, with sun glints sparkling on the water, drifting pollen over the grass and a faint sea haze
  pic('coastal', 'Coastal Landscape', { file:'coastal', stars:0, shoot:false, mist:[4,.45,.9], mistCol:'rgba(235,248,255,A)',
    init: () => ({
      gl: Array.from({ length: 70 }, () => ({ x: rr(W * .36, W), y: rr(H * .52, H * .98), p: rr(0, TAU), f: rr(.5, 1.8), r: rr(.8, 2.2) })),
      po: Array.from({ length: 34 }, () => ({ x: rr(0, W * .5), y: rr(H * .55, H), p: rr(0, TAU), f: rr(.3, .9), z: rr(.4, 1) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .8; if (a < .03) continue; c.fillStyle = `rgba(255,255,245,${a})`; c.beginPath(); c.arc(g.x, g.y, g.r, 0, TAU); c.fill(); }
      for (const q of x.po) {
        q.x += (10 + Math.sin(t * q.f + q.p) * 8) * q.z * dt; q.y += (-6 + Math.cos(t * q.f * .8 + q.p) * 6) * q.z * dt;
        if (q.x > W * .55 || q.y < H * .5) { q.x = rr(-10, W * .1); q.y = rr(H * .7, H); }
        c.fillStyle = `rgba(255,245,200,${.2 + .35 * q.z})`; c.beginPath(); c.arc(q.x, q.y, 1 + 1.3 * q.z, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v885: "Dream View" (Wallpaper Engine scene by Northway): pink dusk over a mirror lake, with twinkling stars, shooting stars, lake mist, glints on the water and a few fireflies
  pic('dreamview1', 'Dream View', { file:'dreamview1', stars:100, ymax:.42, shoot:true, mist:[5,.58,.9], mistCol:'rgba(120,210,235,A)',
    init: () => ({
      gl: Array.from({ length: 50 }, () => ({ x: rr(W * .05, W * .95), y: rr(H * .68, H * .9), p: rr(0, TAU), f: rr(.4, 1.5), r: rr(.8, 2) })),
      ff: Array.from({ length: 24 }, () => ({ x: rr(0, W), y: rr(H * .86, H * .99), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.7), vx: rr(-5, 5), vy: rr(-3, 3) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(255,225,235,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < 0 || f.x > W) f.vx = -f.vx; if (f.y < H * .85 || f.y > H) f.vy = -f.vy;
        const a = .15 + .55 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(200,240,255,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v886: "Dream View 4" (Wallpaper Engine scene by Northway): pastel pink mountains over a mirror lake, with faint stars, shooting stars, drifting dust motes, glints on the water and fireflies at the shore
  pic('dreamview4', 'Dream View 4', { file:'dreamview4', stars:70, ymax:.3, shoot:true, mist:[4,.5,.9], mistCol:'rgba(255,215,235,A)',
    init: () => ({
      gl: Array.from({ length: 55 }, () => ({ x: rr(W * .02, W * .98), y: rr(H * .68, H * .97), p: rr(0, TAU), f: rr(.4, 1.5), r: rr(.8, 2) })),
      mo: Array.from({ length: 40 }, () => ({ x: rr(0, W), y: rr(0, H), p: rr(0, TAU), f: rr(.2, .7), z: rr(.3, 1) })),
      ff: Array.from({ length: 22 }, () => ({ x: rr(0, W * .45), y: rr(H * .6, H * .72), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.7), vx: rr(-5, 5), vy: rr(-3, 3) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const m of x.mo) {
        m.x += (6 + Math.sin(t * m.f + m.p) * 6) * m.z * dt; m.y += (-4 + Math.cos(t * m.f + m.p) * 4) * m.z * dt;
        if (m.x > W + 5) m.x = -5; if (m.y < -5) m.y = H + 5; if (m.y > H + 5) m.y = -5;
        c.fillStyle = `rgba(255,235,245,${.12 + .25 * m.z * (.6 + .4 * Math.sin(t * m.f * 2 + m.p))})`; c.beginPath(); c.arc(m.x, m.y, 1 + 2 * m.z, 0, TAU); c.fill();
      }
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(255,235,245,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < 0 || f.x > W * .5) f.vx = -f.vx; if (f.y < H * .58 || f.y > H * .74) f.vy = -f.vy;
        const a = .15 + .55 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(255,210,190,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v887: "River Town Night" (Wallpaper Engine scene "Night", art by istomin_denis): a lantern-lit riverside town under a crescent moon, with twinkling stars, shooting stars, warm magic sparkles over the rooftops, fireflies by the water and a light mist
  pic('rivernight', 'River Town Night', { file:'rivernight', stars:80, ymax:.3, shoot:true, mist:[4,.5,.9], mistCol:'rgba(140,160,255,A)',
    init: () => ({
      sp: Array.from({ length: 34 }, () => ({ x: rr(W * .1, W * .95), y: rr(H * .35, H * .62), p: rr(0, TAU), f: rr(.5, 1.6), r: rr(.8, 2) })),
      ff: Array.from({ length: 30 }, () => ({ x: rr(W * .55, W), y: rr(H * .6, H * .95), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.9), vx: rr(-5, 5), vy: rr(-3, 3) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const g of x.sp) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 6) * .7; if (a < .03) continue; c.fillStyle = `rgba(255,222,150,${a})`; c.beginPath(); c.arc(g.x, g.y, g.r, 0, TAU); c.fill(); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < W * .5 || f.x > W) f.vx = -f.vx; if (f.y < H * .58 || f.y > H * .97) f.vy = -f.vy;
        const a = .15 + .6 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(255,235,150,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v888: "Nightfall" (Wallpaper Engine scene, art by Raphael Masalimov): snowy cabin by a fjord under green aurora, with falling snow, shooting stars, a flickering window glow and drifting mist
  pic('nightfall', 'Nightfall', { file:'nightfall', stars:50, ymax:.25, shoot:true, mist:[6,.55,.9], mistCol:'rgba(150,230,210,A)',
    init: () => ({ sn: Array.from({ length: 140 }, () => { const z = rr(.25, 1); return { x: rr(0, W), y: rr(0, H), z, r: .5 + z * 1.8, vy: 12 + z * 40, vx: -(3 + z * 10), p: rr(0, TAU), f: rr(.4, 1.2), a: .25 + z * .55 }; }) }),
    extra: (c, t, x, dt) => {
      const g = c.createRadialGradient(W * .54, H * .535, 0, W * .54, H * .535, W * .07), fl = .55 + .25 * Math.sin(t * 2.3) + .1 * Math.sin(t * 5.7);
      g.addColorStop(0, `rgba(255,170,80,${.38 * fl})`); g.addColorStop(1, 'rgba(255,170,80,0)');
      c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(W * .46, H * .43, W * .16, H * .22); c.globalCompositeOperation = 'source-over';
      for (const s of x.sn) { s.y += s.vy * dt; s.x += (s.vx + Math.sin(t * s.f + s.p) * 6 * s.z) * dt; if (s.y > H + 4) { s.y = -4; s.x = rr(0, W * 1.15); } if (s.x < -4) s.x = W + 4; c.fillStyle = `rgba(240,252,255,${s.a})`; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill(); }
    } });
  // v889: "Quiet Landscape" (Wallpaper Engine scene, art by Uomi): a deep-blue night valley under a big glowing moon, with dense twinkling stars, shooting stars, glittering village lights, drifting mist and fireflies
  pic('quietnight', 'Quiet Landscape', { file:'quietnight', stars:190, ymax:.5, shoot:true, mist:[4,.5,.9], mistCol:'rgba(110,160,255,A)', moon:[.7,.22],
    init: () => ({
      vl: Array.from({ length: 70 }, () => ({ x: rr(W * .14, W * .86), y: rr(H * .66, H * .78), p: rr(0, TAU), f: rr(.6, 2), r: rr(.7, 1.7) })),
      ff: Array.from({ length: 22 }, () => ({ x: rr(W * .02, W * .5), y: rr(H * .78, H * .97), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.7), vx: rr(-4, 4), vy: rr(-3, 3) }))
    }),
    extra: (c, t, x, dt) => {
      { const mx = W * .7, my = H * .22, mr = W * .034, br = .85 + .15 * Math.sin(t * .5);
        c.globalCompositeOperation = 'lighter';
        const hg = c.createRadialGradient(mx, my, mr * .8, mx, my, mr * 5); hg.addColorStop(0, `rgba(170,205,255,${.34 * br})`); hg.addColorStop(1, 'rgba(170,205,255,0)');
        c.fillStyle = hg; c.beginPath(); c.arc(mx, my, mr * 5, 0, TAU); c.fill();
        c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(250,252,255,.98)'; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'lighter';
      for (const g of x.vl) { const a = .2 + .6 * Math.max(0, Math.sin(t * g.f + g.p)); c.fillStyle = `rgba(255,248,210,${a * .8})`; c.beginPath(); c.arc(g.x, g.y, g.r, 0, TAU); c.fill(); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < 0 || f.x > W * .55) f.vx = -f.vx; if (f.y < H * .76 || f.y > H * .98) f.vy = -f.vy;
        const a = .15 + .55 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(190,230,255,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v890: "Starry Sky at Midnight" (Wallpaper Engine scene): Milky Way and glowing clouds over a mirror lake, with twinkling stars, shooting stars, lake mist, warm glints on the water and fireflies
  pic('starrynight', 'Starry Sky at Midnight', { file:'starrynight', stars:120, ymax:.38, shoot:true, mist:[5,.55,.9], mistCol:'rgba(255,200,170,A)',
    init: () => ({
      gl: Array.from({ length: 50 }, () => ({ x: rr(W * .08, W * .92), y: rr(H * .68, H * .92), p: rr(0, TAU), f: rr(.4, 1.5), r: rr(.8, 2) })),
      ff: Array.from({ length: 26 }, () => ({ x: rr(0, W), y: rr(H * .82, H * .99), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.8), vx: rr(-5, 5), vy: rr(-3, 3) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(255,225,190,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < 0 || f.x > W) f.vx = -f.vx; if (f.y < H * .8 || f.y > H) f.vy = -f.vy;
        const a = .15 + .55 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(255,230,150,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v891: "Summer" by Gydwin (Wallpaper Engine scene, 4K): a sunset over a village lake with a cottage and wildflower meadow, with a pulsing sun glow, glints on the water, lots of fireflies and a few early stars
  pic('summerdusk', 'Summer Dusk', { file:'summerdusk', stars:35, ymax:.2, shoot:false, mist:[4,.5,.9], mistCol:'rgba(255,190,200,A)',
    init: () => ({
      gl: Array.from({ length: 36 }, () => ({ x: rr(W * .44, W * .56), y: rr(H * .68, H * .8), p: rr(0, TAU), f: rr(.6, 1.8), r: rr(.8, 2) })),
      ff: Array.from({ length: 60 }, () => ({ x: rr(0, W), y: rr(H * .3, H * .98), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 2), vx: rr(-6, 6), vy: rr(-4, 4) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      { const sx = W * .512, sy = H * .53, br = .8 + .2 * Math.sin(t * .6), g = c.createRadialGradient(sx, sy, 0, sx, sy, W * .09);
        g.addColorStop(0, `rgba(255,190,120,${.35 * br})`); g.addColorStop(1, 'rgba(255,150,120,0)'); c.fillStyle = g; c.fillRect(sx - W * .1, sy - W * .1, W * .2, W * .2); }
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 6) * .8; if (a < .03) continue; c.fillStyle = `rgba(255,225,200,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 7) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 5) * dt;
        if (f.x < 0 || f.x > W) f.vx = -f.vx; if (f.y < H * .3 || f.y > H) f.vy = -f.vy;
        const a = .12 + .6 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(255,240,150,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v892: "Sunset in the Mountains" (Wallpaper Engine scene): a huge sun setting behind a snow peak over a misty lake, with a breathing sun glow, drifting valley mist, glints on the water and floating golden motes
  pic('sunsetpeak', 'Sunset in the Mountains', { file:'sunsetpeak', stars:0, shoot:false, mist:[6,.55,.9], mistCol:'rgba(190,215,240,A)',
    init: () => ({
      gl: Array.from({ length: 55 }, () => ({ x: rr(W * .3, W * .88), y: rr(H * .72, H * .96), p: rr(0, TAU), f: rr(.4, 1.6), r: rr(.8, 2) })),
      mo: Array.from({ length: 36 }, () => ({ x: rr(0, W), y: rr(0, H * .75), p: rr(0, TAU), f: rr(.2, .7), z: rr(.3, 1) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      { const sx = W * .34, sy = H * .31, br = .75 + .25 * Math.sin(t * .5), g = c.createRadialGradient(sx, sy, 0, sx, sy, W * .12);
        g.addColorStop(0, `rgba(255,200,130,${.3 * br})`); g.addColorStop(1, 'rgba(255,150,100,0)'); c.fillStyle = g; c.fillRect(sx - W * .13, sy - W * .13, W * .26, W * .26); }
      for (const m of x.mo) {
        m.x += (7 + Math.sin(t * m.f + m.p) * 6) * m.z * dt; m.y += (-3 + Math.cos(t * m.f + m.p) * 4) * m.z * dt;
        if (m.x > W + 5) m.x = -5; if (m.y < -5) m.y = H * .75; if (m.y > H * .75) m.y = -5;
        c.fillStyle = `rgba(255,215,160,${.1 + .25 * m.z * (.6 + .4 * Math.sin(t * m.f * 2 + m.p))})`; c.beginPath(); c.arc(m.x, m.y, 1 + 1.8 * m.z, 0, TAU); c.fill();
      }
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(255,230,210,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
    } });
  // v893: "VHS" (Wallpaper Engine scene by Blvk_Knxght, art by Anastasia Ermakova): a neon video-store on a rainy night, with falling rain, puddle ripples on the wet street, a flickering neon sign glow and a few stars
  pic('vhsstore', 'VHS Store', { file:'vhsstore', stars:25, ymax:.1, shoot:false, mist:[3,.5,.9], mistCol:'rgba(110,140,255,A)',
    extra: (c, t, x, dt) => {
      const fl = .75 + .15 * Math.sin(t * 3.1) + (Math.sin(t * 13) > .96 ? -.3 : 0), cx = W * .47, cy = H * .35, g = c.createRadialGradient(cx, cy, 0, cx, cy, W * .16);
      g.addColorStop(0, `rgba(90,200,255,${.22 * fl})`); g.addColorStop(1, 'rgba(90,120,255,0)'); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(cx - W * .17, cy - W * .17, W * .34, W * .34); c.globalCompositeOperation = 'source-over';
    } });
  // v894: "Waterfalls in Night Blues" (Wallpaper Engine scene, art by Wertus): moonlit cave view of a waterfall and a lit cabin, with twinkling sparkles, rising waterfall mist, drifting dust motes, fireflies at the pool and a warm flicker in the cabin window
  pic('nightwaterfall', 'Waterfalls in Night Blues', { file:'nightwaterfall', stars:0, shoot:false, mist:[5,.55,.9], mistCol:'rgba(150,200,255,A)',
    init: () => ({
      mo: Array.from({ length: 46 }, () => ({ x: rr(0, W), y: rr(0, H * .85), p: rr(0, TAU), f: rr(.2, .7), z: rr(.3, 1) })),
      sp: Array.from({ length: 30 }, () => ({ x: rr(W * .05, W * .42), y: rr(H * .5, H * .84), p: rr(0, TAU), f: rr(.6, 1.8), r: rr(.8, 2) })),
      ff: Array.from({ length: 22 }, () => ({ x: rr(0, W), y: rr(H * .86, H * .99), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.8), vx: rr(-5, 5), vy: rr(-3, 3) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      { const fl = .75 + .15 * Math.sin(t * 2.6) + .1 * Math.sin(t * 6.3), cx = W * .78, cy = H * .68, g = c.createRadialGradient(cx, cy, 0, cx, cy, W * .08);
        g.addColorStop(0, `rgba(255,170,70,${.28 * fl})`); g.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = g; c.fillRect(cx - W * .09, cy - W * .09, W * .18, W * .18); }
      for (const m of x.mo) {
        m.x += (6 + Math.sin(t * m.f + m.p) * 6) * m.z * dt; m.y += (-4 + Math.cos(t * m.f + m.p) * 4) * m.z * dt;
        if (m.x > W + 5) m.x = -5; if (m.y < -5) m.y = H * .85; if (m.y > H * .85) m.y = -5;
        c.fillStyle = `rgba(190,225,255,${.1 + .25 * m.z * (.6 + .4 * Math.sin(t * m.f * 2 + m.p))})`; c.beginPath(); c.arc(m.x, m.y, 1 + 1.8 * m.z, 0, TAU); c.fill();
      }
      for (const g of x.sp) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .8; if (a < .03) continue; c.fillStyle = `rgba(230,245,255,${a})`; c.beginPath(); c.arc(g.x, g.y, g.r, 0, TAU); c.fill(); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < 0 || f.x > W) f.vx = -f.vx; if (f.y < H * .85 || f.y > H) f.vy = -f.vy;
        const a = .15 + .55 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(230,255,150,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v895: "Winter Landscape Illustration" (Wallpaper Engine scene): a glowing alpine village with string lights at dusk, with softly falling snow, twinkling stars and warm sparkles around the lights
  pic('winterlights', 'Winter Village Lights', { file:'winterlights', stars:60, ymax:.28, shoot:false, mist:[3,.45,.9], mistCol:'rgba(255,225,200,A)',
    init: () => ({
      sn: Array.from({ length: 150 }, () => { const z = rr(.25, 1); return { x: rr(0, W), y: rr(0, H), z, r: .6 + z * 2, vy: 14 + z * 42, vx: -(3 + z * 10), p: rr(0, TAU), f: rr(.4, 1.2), a: .25 + z * .55 }; }),
      sp: Array.from({ length: 46 }, () => ({ x: rr(W * .05, W * .95), y: rr(H * .38, H * .9), p: rr(0, TAU), f: rr(.5, 1.8), r: rr(1, 2.4) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const g of x.sp) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 6) * .75; if (a < .03) continue; c.fillStyle = `rgba(255,220,140,${a})`; c.beginPath(); c.arc(g.x, g.y, g.r, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
      for (const s of x.sn) { s.y += s.vy * dt; s.x += (s.vx + Math.sin(t * s.f + s.p) * 6 * s.z) * dt; if (s.y > H + 4) { s.y = -4; s.x = rr(0, W * 1.15); } if (s.x < -4) s.x = W + 4; c.fillStyle = `rgba(245,250,255,${s.a})`; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill(); }
    } });
  // v896: "Afterglow Corner" (余辉一隅, Wallpaper Engine scene, art by Uomi): a railway viaduct over a flower-lined stream at sunset, with a breathing glow through the arches, glints on the water, fireflies in the flowers and a light mist
  pic('bridgeglow', 'Afterglow Corner', { file:'bridgeglow', stars:0, shoot:false, mist:[4,.5,.9], mistCol:'rgba(255,190,200,A)',
    init: () => ({
      gl: Array.from({ length: 60 }, () => ({ x: rr(W * .25, W * .95), y: rr(H * .68, H * .96), p: rr(0, TAU), f: rr(.4, 1.6), r: rr(.8, 2.2) })),
      ff: Array.from({ length: 40 }, () => ({ x: rr(0, W), y: rr(H * .5, H * .85), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.9), vx: rr(-5, 5), vy: rr(-3, 3) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      { const gx = W * .36, gy = H * .52, br = .75 + .25 * Math.sin(t * .6), g = c.createRadialGradient(gx, gy, 0, gx, gy, W * .1);
        g.addColorStop(0, `rgba(255,190,130,${.28 * br})`); g.addColorStop(1, 'rgba(255,150,130,0)'); c.fillStyle = g; c.fillRect(gx - W * .11, gy - W * .11, W * .22, W * .22); }
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .75; if (a < .03) continue; c.fillStyle = `rgba(255,225,200,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < 0 || f.x > W) f.vx = -f.vx; if (f.y < H * .48 || f.y > H * .87) f.vy = -f.vy;
        const a = .15 + .55 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(230,255,160,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v897: "Beach at Dusk" (余霞成绮 4K, Wallpaper Engine scene): a blue-hour beach with a glowing horizon, twinkling stars, shooting stars, glints on the sea and lit windows among the palms
  pic('beachdusk', 'Beach at Dusk', { file:'beachdusk', stars:70, ymax:.5, shoot:true, mist:[3,.35,.8], mistCol:'rgba(190,215,255,A)',
    init: () => ({
      gl: Array.from({ length: 80 }, () => ({ x: rr(W * .3, W), y: rr(H * .68, H * .97), p: rr(0, TAU), f: rr(.4, 1.8), r: rr(.8, 2.2) })),
      hz: Array.from({ length: 24 }, () => ({ x: rr(W * .34, W * .72), y: rr(H * .665, H * .69), p: rr(0, TAU), f: rr(.6, 1.6), r: rr(.8, 1.8) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      { const gx = W * .52, gy = H * .66, br = .8 + .2 * Math.sin(t * .5), g = c.createRadialGradient(gx, gy, 0, gx, gy, W * .14);
        g.addColorStop(0, `rgba(255,205,140,${.26 * br})`); g.addColorStop(1, 'rgba(255,170,150,0)'); c.fillStyle = g; c.fillRect(gx - W * .15, gy - W * .15, W * .3, W * .3); }
      for (const w of [[.125, .665], [.15, .675], [.075, .68]]) { const a = .35 + .15 * Math.sin(t * 1.3 + w[0] * 40); c.fillStyle = `rgba(255,200,110,${a})`; c.beginPath(); c.arc(W * w[0], H * w[1], 2.2, 0, TAU); c.fill(); }
      for (const g of x.hz.concat(x.gl)) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(220,238,255,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
    } });
  // v898: "Beyond the Mountain" (在山的那边, Wallpaper Engine scene): a wooden pier over a mirror-calm lake toward a snow-capped mountain, with drifting snow sparkles, glints on the water and a breathing sunrise glow
  pic('beyondmtn', 'Beyond the Mountain', { file:'beyondmtn', we3:'beyondmtn',  stars:0, shoot:false, mist:[3,.3,.7], mistCol:'rgba(255,225,215,A)',
    init: () => ({
      sn: Array.from({ length: 90 }, () => { const z = rr(.25, 1); return { x: rr(0, W), y: rr(0, H), z, r: .6 + z * 1.8, vy: 8 + z * 26, vx: -(2 + z * 6), p: rr(0, TAU), f: rr(.4, 1.2), a: .25 + z * .5 }; }),
      gl: Array.from({ length: 70 }, () => ({ x: rr(0, W), y: rr(H * .45, H * .95), p: rr(0, TAU), f: rr(.4, 1.8), r: rr(.8, 2.2) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      { const gx = W * .16, gy = H * .38, br = .8 + .2 * Math.sin(t * .5), g = c.createRadialGradient(gx, gy, 0, gx, gy, W * .14);
        g.addColorStop(0, `rgba(255,215,170,${.3 * br})`); g.addColorStop(1, 'rgba(255,190,170,0)'); c.fillStyle = g; c.fillRect(gx - W * .15, gy - W * .15, W * .3, W * .3); }
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(235,246,255,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
      for (const s of x.sn) { s.y += s.vy * dt; s.x += (s.vx + Math.sin(t * s.f + s.p) * 5 * s.z) * dt; if (s.y > H + 4) { s.y = -4; s.x = rr(0, W * 1.1); } if (s.x < -4) s.x = W + 4; c.fillStyle = `rgba(250,252,255,${s.a * (.7 + .3 * Math.sin(t * 2 + s.p))})`; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill(); }
    } });
  // v899: "Summer Bay" (夏日海滨, Wallpaper Engine scene): a stone stairway through green forest down to a sunlit blue bay, with sparkles on the sea and drifting pollen in the sunbeams
  pic('summerbay', 'Summer Bay', { file:'summerbay', stars:0, shoot:false, mist:[2,.2,.6], mistCol:'rgba(255,255,230,A)',
    init: () => ({
      gl: Array.from({ length: 90 }, () => ({ x: rr(W * .28, W * .72), y: rr(H * .27, H * .55), p: rr(0, TAU), f: rr(.4, 1.8), r: rr(.7, 2) })),
      po: Array.from({ length: 50 }, () => ({ x: rr(0, W), y: rr(H * .1, H * .95), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 2), vx: rr(-4, 6), vy: rr(-4, 2) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .75; if (a < .03) continue; c.fillStyle = `rgba(235,248,255,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      for (const f of x.po) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 5) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < 0) f.x = W; if (f.x > W) f.x = 0; if (f.y < H * .08 || f.y > H * .96) f.vy = -f.vy;
        const a = .15 + .5 * Math.max(0, Math.sin(t * f.f * 1.4 + f.p));
        c.fillStyle = `rgba(255,250,190,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v900: "Summer Sands" (夏日海滩4K, Wallpaper Engine scene, art by panda_newlife): a sunlit turquoise beach under big summer clouds, with sparkles on the sea, drifting leaves and a few gulls
  pic('summersands', 'Summer Sands', { file:'summersands', stars:0, shoot:false, mist:[2,.2,.6], mistCol:'rgba(255,255,255,A)',
    init: () => ({
      gl: Array.from({ length: 100 }, () => ({ x: rr(0, W * .9), y: rr(H * .4, H * .7), p: rr(0, TAU), f: rr(.4, 1.8), r: rr(.7, 2) })),
      lf: Array.from({ length: 14 }, () => ({ x: rr(0, W), y: rr(0, H), p: rr(0, TAU), f: rr(.5, 1.2), r: rr(2, 3.6), vy: rr(10, 22), vx: rr(6, 16), rot: rr(0, TAU) })),
      gu: Array.from({ length: 4 }, (_, i) => ({ x: rr(0, W), y: rr(H * .12, H * .4), p: rr(0, TAU), f: rr(1.2, 2), s: rr(5, 8), vx: (i % 2 ? 1 : -1) * rr(10, 20) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(240,250,255,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
      for (const l of x.lf) { l.y += l.vy * dt; l.x += (l.vx + Math.sin(t * l.f + l.p) * 8) * dt; if (l.y > H + 6) { l.y = -6; l.x = rr(0, W); } if (l.x > W + 6) l.x = -6; c.save(); c.translate(l.x, l.y); c.rotate(l.rot + t * l.f); c.fillStyle = 'rgba(120,150,60,.8)'; c.beginPath(); c.ellipse(0, 0, l.r * 1.6, l.r * .7, 0, 0, TAU); c.fill(); c.restore(); }
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.2; c.lineCap = 'round';
      for (const g of x.gu) { g.x += g.vx * dt; g.y += Math.sin(t * .4 + g.p) * 3 * dt; if (g.x > W + 20) g.x = -20; if (g.x < -20) g.x = W + 20; const w = Math.sin(t * g.f * 3 + g.p) * g.s * .5; c.beginPath(); c.moveTo(g.x - g.s, g.y - g.s * .2 - w); c.quadraticCurveTo(g.x - g.s * .5, g.y - g.s * .45 - w * .3, g.x, g.y); c.quadraticCurveTo(g.x + g.s * .5, g.y - g.s * .45 - w * .3, g.x + g.s, g.y - g.s * .2 - w); c.stroke(); }
    } });
  // v901: "Mountain Stream" (山清水秀4K, Wallpaper Engine scene, art by Uomi): a pine valley with a bright stream between rocks and snowy peaks, with sparkles on the water, fireflies, drifting leaves and pollen in the light
  pic('mtnstream', 'Mountain Stream', { file:'mtnstream', stars:0, shoot:false, mist:[2,.2,.6], mistCol:'rgba(235,255,245,A)',
    init: () => ({
      gl: Array.from({ length: 90 }, () => ({ x: rr(W * .22, W * .85), y: rr(H * .64, H * .95), p: rr(0, TAU), f: rr(.4, 1.8), r: rr(.7, 2) })),
      ff: Array.from({ length: 30 }, (_, i) => ({ x: (i % 2 ? rr(W * .02, W * .25) : rr(W * .75, W * .98)), y: rr(H * .2, H * .5), p: rr(0, TAU), f: rr(.3, .9), r: rr(.9, 2), vx: rr(-5, 5), vy: rr(-3, 3) })),
      lf: Array.from({ length: 12 }, () => ({ x: rr(0, W), y: rr(0, H), p: rr(0, TAU), f: rr(.5, 1.2), r: rr(2, 3.4), vy: rr(10, 22), vx: rr(4, 12), rot: rr(0, TAU) })),
      po: Array.from({ length: 36 }, () => ({ x: rr(W * .3, W * .7), y: rr(H * .1, H * .6), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.8) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(235,250,255,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < 0 || f.x > W) f.vx = -f.vx; if (f.y < H * .15 || f.y > H * .55) f.vy = -f.vy;
        const a = .15 + .55 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(230,255,160,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      for (const f of x.po) { f.x += Math.sin(t * f.f + f.p) * 4 * dt; f.y += Math.cos(t * f.f * .8 + f.p) * 3 * dt; const a = .1 + .4 * Math.max(0, Math.sin(t * f.f * 1.4 + f.p)); c.fillStyle = `rgba(255,252,200,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
      for (const l of x.lf) { l.y += l.vy * dt; l.x += (l.vx + Math.sin(t * l.f + l.p) * 8) * dt; if (l.y > H + 6) { l.y = -6; l.x = rr(0, W); } if (l.x > W + 6) l.x = -6; c.save(); c.translate(l.x, l.y); c.rotate(l.rot + t * l.f); c.fillStyle = 'rgba(140,175,60,.8)'; c.beginPath(); c.ellipse(0, 0, l.r * 1.6, l.r * .7, 0, 0, TAU); c.fill(); c.restore(); }
    } });
  // v902: "Moonlit Field" (布吉岛-月色, Wallpaper Engine scene): a huge full moon over a night meadow with far-off lamps, with a breathing moon halo, twinkling stars, shooting stars, fireflies and drifting dust
  pic('moonfield', 'Moonlit Field', { file:'moonfield', stars:90, ymax:.5, shoot:true, mist:[3,.25,.7], mistCol:'rgba(190,230,220,A)',
    init: () => ({
      ff: Array.from({ length: 40 }, () => ({ x: rr(0, W), y: rr(H * .7, H * .97), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.9), vx: rr(-5, 5), vy: rr(-3, 3) })),
      po: Array.from({ length: 30 }, () => ({ x: rr(0, W), y: rr(H * .45, H * .95), p: rr(0, TAU), f: rr(.3, .8), r: rr(.7, 1.5) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      { const gx = W * .6, gy = H * .27, br = .8 + .2 * Math.sin(t * .5), g = c.createRadialGradient(gx, gy, W * .06, gx, gy, W * .2);
        g.addColorStop(0, `rgba(230,255,190,${.16 * br})`); g.addColorStop(1, 'rgba(200,255,190,0)'); c.fillStyle = g; c.fillRect(gx - W * .21, gy - W * .21, W * .42, W * .42); }
      for (const l of [[.06, .64], [.145, .635], [.21, .655], [.865, .64], [.73, .655]]) { const a = .3 + .15 * Math.sin(t * 1.1 + l[0] * 30); const g = c.createRadialGradient(W * l[0], H * l[1], 0, W * l[0], H * l[1], 16); g.addColorStop(0, `rgba(255,200,100,${a})`); g.addColorStop(1, 'rgba(255,180,80,0)'); c.fillStyle = g; c.fillRect(W * l[0] - 16, H * l[1] - 16, 32, 32); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < 0 || f.x > W) f.vx = -f.vx; if (f.y < H * .68 || f.y > H * .98) f.vy = -f.vy;
        const a = .15 + .6 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(225,255,150,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      for (const f of x.po) { f.x += Math.sin(t * f.f + f.p) * 4 * dt; f.y += Math.cos(t * f.f * .8 + f.p) * 3 * dt; const a = .08 + .3 * Math.max(0, Math.sin(t * f.f * 1.4 + f.p)); c.fillStyle = `rgba(230,245,210,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
    } });
  // v903: "Sea Cliff" (布吉岛-海阔天空, Wallpaper Engine scene): a flower-covered clifftop over a wide blue sea, with sparkles on the water, petals on the breeze and tiny birds in the sky
  pic('seacliff', 'Sea Cliff', { file:'seacliff', stars:0, shoot:false, mist:[2,.15,.6], mistCol:'rgba(255,255,255,A)',
    init: () => ({
      gl: Array.from({ length: 110 }, () => ({ x: rr(W * .42, W), y: rr(H * .45, H * .86), p: rr(0, TAU), f: rr(.4, 1.8), r: rr(.7, 2.1) })),
      pt: Array.from({ length: 26 }, (_, i) => ({ x: rr(0, W * .8), y: rr(H * .5, H * .95), p: rr(0, TAU), f: rr(.5, 1.2), r: rr(1.6, 3), vy: rr(-8, 2), vx: rr(14, 30), rot: rr(0, TAU), red: i % 3 !== 0 })),
      bd: Array.from({ length: 7 }, () => ({ x: rr(0, W), y: rr(H * .06, H * .4), p: rr(0, TAU), f: rr(1.5, 2.4), s: rr(3, 5), vx: rr(8, 18) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(235,248,255,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
      for (const l of x.pt) { l.y += (l.vy + Math.sin(t * l.f + l.p) * 8) * dt; l.x += l.vx * dt; if (l.x > W + 6 || l.y < H * .3 || l.y > H + 6) { l.x = -6; l.y = rr(H * .55, H * .95); } c.save(); c.translate(l.x, l.y); c.rotate(l.rot + t * l.f); c.fillStyle = l.red ? 'rgba(235,90,50,.85)' : 'rgba(250,250,245,.85)'; c.beginPath(); c.ellipse(0, 0, l.r * 1.5, l.r * .7, 0, 0, TAU); c.fill(); c.restore(); }
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1; c.lineCap = 'round';
      for (const g of x.bd) { g.x += g.vx * dt; g.y += Math.sin(t * .4 + g.p) * 3 * dt; if (g.x > W + 12) g.x = -12; const w = Math.sin(t * g.f * 3 + g.p) * g.s * .5; c.beginPath(); c.moveTo(g.x - g.s, g.y - g.s * .2 - w); c.quadraticCurveTo(g.x - g.s * .5, g.y - g.s * .45 - w * .3, g.x, g.y); c.quadraticCurveTo(g.x + g.s * .5, g.y - g.s * .45 - w * .3, g.x + g.s, g.y - g.s * .2 - w); c.stroke(); }
    } });
  // v904: "Sunrise Valley" (日出之时4K, Wallpaper Engine scene, art by Uomi): golden sunrise light on mountains and a still lake, with a breathing sun glow, glints on the water, drifting dust motes and a light mist
  pic('sunrise4k', 'Sunrise Valley', { file:'sunrise4k', stars:0, shoot:false, mist:[4,.35,.8], mistCol:'rgba(255,225,180,A)',
    init: () => ({
      gl: Array.from({ length: 80 }, () => ({ x: rr(0, W * .8), y: rr(H * .72, H * .82), p: rr(0, TAU), f: rr(.4, 1.8), r: rr(.7, 2) })),
      po: Array.from({ length: 44 }, () => ({ x: rr(0, W), y: rr(H * .25, H * .95), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.9), vx: rr(2, 8) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      { const gx = W * .07, gy = H * .46, br = .8 + .2 * Math.sin(t * .45), g = c.createRadialGradient(gx, gy, 0, gx, gy, W * .22);
        g.addColorStop(0, `rgba(255,220,150,${.3 * br})`); g.addColorStop(1, 'rgba(255,190,130,0)'); c.fillStyle = g; c.fillRect(0, gy - W * .22, W * .3, W * .44); }
      { const gx = W * .3, gy = H * .82, br = .75 + .25 * Math.sin(t * .8 + 1), g = c.createRadialGradient(gx, gy, 0, gx, gy, W * .06);
        g.addColorStop(0, `rgba(255,235,190,${.35 * br})`); g.addColorStop(1, 'rgba(255,220,170,0)'); c.fillStyle = g; c.fillRect(gx - W * .06, gy - W * .06, W * .12, W * .12); }
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(255,240,215,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      for (const f of x.po) { f.x += (f.vx + Math.sin(t * f.f + f.p) * 4) * dt; f.y += Math.cos(t * f.f * .8 + f.p) * 3 * dt; if (f.x > W) f.x = 0; const a = .1 + .45 * Math.max(0, Math.sin(t * f.f * 1.4 + f.p)); c.fillStyle = `rgba(255,235,170,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
    } });
  // v905: "Sunset Valley" (日落山谷4K, Wallpaper Engine scene, art by chunliangmmr): a winding river valley at sunset with a village, with a breathing sun glow, glints on the river, twinkling village lights, fireflies and a light mist
  pic('sunsetvalley', 'Sunset Valley', { file:'sunsetvalley', stars:0, shoot:false, mist:[4,.35,.8], mistCol:'rgba(255,200,210,A)',
    init: () => ({
      gl: Array.from({ length: 70 }, () => ({ x: rr(W * .27, W * .52), y: rr(H * .42, H * .72), p: rr(0, TAU), f: rr(.4, 1.8), r: rr(.7, 2) })),
      vl: Array.from({ length: 40 }, () => ({ x: rr(W * .36, W * .62), y: rr(H * .45, H * .6), p: rr(0, TAU), f: rr(.6, 2), r: rr(.8, 1.6) })),
      ff: Array.from({ length: 30 }, () => ({ x: rr(0, W), y: rr(H * .8, H * .95), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.9), vx: rr(-5, 5), vy: rr(-3, 3) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      { const gx = W * .315, gy = H * .31, br = .8 + .2 * Math.sin(t * .45), g = c.createRadialGradient(gx, gy, 0, gx, gy, W * .2);
        g.addColorStop(0, `rgba(255,210,170,${.34 * br})`); g.addColorStop(1, 'rgba(255,170,160,0)'); c.fillStyle = g; c.fillRect(gx - W * .2, gy - W * .2, W * .4, W * .4); }
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(255,235,225,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      for (const g of x.vl) { const a = .15 + .45 * Math.max(0, Math.sin(t * g.f + g.p)); c.fillStyle = `rgba(255,215,130,${a})`; c.beginPath(); c.arc(g.x, g.y, g.r, 0, TAU); c.fill(); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < 0 || f.x > W) f.vx = -f.vx; if (f.y < H * .78 || f.y > H * .97) f.vy = -f.vy;
        const a = .15 + .55 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(255,230,140,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v906: "Bench by the Sea" (碧海山色4K, Wallpaper Engine scene, art by Uomi): a clifftop bench over a deep blue sea under big clouds, with twinkling stars, shooting stars, glints on the sea and fireflies in the bushes
  pic('benchsea', 'Bench by the Sea', { file:'benchsea', stars:60, ymax:.22, shoot:true, mist:[2,.2,.6], mistCol:'rgba(190,210,255,A)',
    init: () => ({
      gl: Array.from({ length: 90 }, () => ({ x: rr(W * .4, W), y: rr(H * .37, H * .62), p: rr(0, TAU), f: rr(.4, 1.8), r: rr(.7, 2) })),
      ff: Array.from({ length: 36 }, () => ({ x: rr(W * .1, W * .85), y: rr(H * .45, H * .85), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.9), vx: rr(-5, 5), vy: rr(-3, 3) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(215,235,255,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < W * .05 || f.x > W * .9) f.vx = -f.vx; if (f.y < H * .42 || f.y > H * .88) f.vy = -f.vy;
        const a = .15 + .55 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(230,255,160,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } });
  // v907: "Blossom Watch" (群樱守望4K, Wallpaper Engine scene, art by Uomi): a flowering hillside over a calm lake at sunset, with a breathing sun glow, glints on the water, drifting sakura petals and fireflies
  pic('sakuraview', 'Blossom Watch', { file:'sakuraview', stars:0, shoot:false, mist:[3,.3,.8], mistCol:'rgba(255,215,215,A)',
    init: () => ({
      gl: Array.from({ length: 80 }, () => ({ x: rr(W * .05, W * .85), y: rr(H * .5, H * .63), p: rr(0, TAU), f: rr(.4, 1.8), r: rr(.7, 2) })),
      pt: Array.from({ length: 30 }, () => ({ x: rr(0, W), y: rr(0, H), p: rr(0, TAU), f: rr(.5, 1.2), r: rr(1.8, 3.4), vy: rr(10, 24), vx: rr(8, 20), rot: rr(0, TAU) })),
      ff: Array.from({ length: 34 }, () => ({ x: rr(0, W), y: rr(H * .68, H * .96), p: rr(0, TAU), f: rr(.3, .9), r: rr(.8, 1.9), vx: rr(-5, 5), vy: rr(-3, 3) }))
    }),
    extra: (c, t, x, dt) => {
      c.globalCompositeOperation = 'lighter';
      { const gx = W * .5, gy = H * .42, br = .8 + .2 * Math.sin(t * .45), g = c.createRadialGradient(gx, gy, 0, gx, gy, W * .2);
        g.addColorStop(0, `rgba(255,225,170,${.3 * br})`); g.addColorStop(1, 'rgba(255,180,170,0)'); c.fillStyle = g; c.fillRect(gx - W * .2, gy - W * .2, W * .4, W * .4); }
      for (const g of x.gl) { const a = Math.pow(Math.max(0, Math.sin(t * g.f + g.p)), 8) * .7; if (a < .03) continue; c.fillStyle = `rgba(255,240,225,${a})`; c.beginPath(); c.ellipse(g.x, g.y, g.r * 3, g.r * .8, 0, 0, TAU); c.fill(); }
      for (const f of x.ff) {
        f.x += (f.vx + Math.sin(t * f.f + f.p) * 6) * dt; f.y += (f.vy + Math.cos(t * f.f * .8 + f.p) * 4) * dt;
        if (f.x < 0 || f.x > W) f.vx = -f.vx; if (f.y < H * .66 || f.y > H * .98) f.vy = -f.vy;
        const a = .15 + .55 * Math.max(0, Math.sin(t * f.f * 1.6 + f.p));
        c.fillStyle = `rgba(255,235,160,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
      for (const l of x.pt) { l.y += l.vy * dt; l.x += (l.vx + Math.sin(t * l.f + l.p) * 8) * dt; if (l.y > H + 6) { l.y = -6; l.x = rr(-W * .1, W); } if (l.x > W + 6) l.x = -6; c.save(); c.translate(l.x, l.y); c.rotate(l.rot + t * l.f); c.fillStyle = 'rgba(255,200,215,.85)'; c.beginPath(); c.ellipse(0, 0, l.r * 1.4, l.r * .8, 0, 0, TAU); c.fill(); c.restore(); }
    } });
  // v925: the original wallpaper ("Vintage Cartoon Forest", the midnight sign-in picture): moon glow, twinkling stars, slow fog in the valley and the odd shooting star
  pic('midnight', 'Midnight Forest', { file:'midnight', stars:90, ymax:.5, shoot:true, moon:[.12,.15], mist:[5,.55,.9], mistCol:'rgba(150,160,190,A)' });
  const ORDER = ['winter', 'coast', 'sunrise', 'bluehour', 'pineforest', 'natwinter', 'mystic', 'japan', 'arctic', 'autumncity', 'cave', 'snowcity', 'snowrise', 'sunsetmt', 'nightlake', 'snowmtn', 'icyforest', 'meteors', 'garden', 'midaur', 'abandoned', 'riozinho', 'dreamview3', 'dreamview2', 'houseofdreams', 'coastal', 'dreamview1', 'dreamview4', 'rivernight', 'nightfall', 'quietnight', 'starrynight', 'summerdusk', 'sunsetpeak', 'vhsstore', 'nightwaterfall', 'winterlights', 'bridgeglow', 'beachdusk', 'beyondmtn', 'summerbay', 'summersands', 'mtnstream', 'moonfield', 'seacliff', 'sunrise4k', 'sunsetvalley', 'benchsea', 'sakuraview', 'midnight'];

  // ---- moving water: the painted picture is drawn by a small shader that shifts the water pixels (never the rocks, land or sky) ----
  const WAVE_FRAG = `precision mediump float; varying vec2 uv; uniform sampler2D tex; uniform sampler2D msk; uniform float t;
  void main() {
    float m = texture2D(msk, uv).r;
    float d = clamp((uv.y - .545) / .455, 0., 1.);
    float k = m * smoothstep(0., .05, d);
    float ph = 9. / (d + .12) + t * 1.5;                                  // waves roll toward you, closer ones bigger and slower
    float sw = sin(ph + sin(uv.x * 7. + t * .25) * 1.6);
    float amp = .0007 + .0026 * d;
    vec2 o = vec2(sin(ph * .9 + uv.x * 20.) * amp * .9, sw * amp * .55) * k;
    float rf = exp(-pow((uv.x - .331) / .045, 2.)) * smoothstep(.54, .6, uv.y) * (1. - smoothstep(.78, .86, uv.y));
    o.x += sin(uv.y * 220. - t * 2.4) * .0016 * rf * k;                   // the moon's reflection ripples
    vec3 col = texture2D(tex, uv + o).rgb;
    col += .03 * sw * d * k * vec3(.4, .6, 1.);                           // crests catch a little light
    col += (hash(gl_FragCoord.xy * .37) - .5) / 200.;   // fixed dither: no banding rings in the glows
    gl_FragColor = vec4(col, 1.);
  }`;
  const glLayer = (el, th) => {
    const cv = document.createElement('canvas'); cv.className = 'thgl'; cv.width = 1920; cv.height = 1081; cv.hidden = true;
    const gl = cv.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' }); if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }'), fs = sh(gl.FRAGMENT_SHADER, WAVE_FRAG);
    if (!vs || !fs) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = (unit, im) => { const x = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, x); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); };
    gl.uniform1i(gl.getUniformLocation(pr, 'tex'), 0); gl.uniform1i(gl.getUniformLocation(pr, 'msk'), 1);
    const ut = gl.getUniformLocation(pr, 't'), L = { cv, ready: false, lost: false };
    const a = new Image(), m = new Image(); let n = 0;
    const go = () => { if (++n < 2) return; try { tex(0, a); tex(1, m); gl.viewport(0, 0, cv.width, cv.height); L.ready = true; L.draw(0); cv.hidden = false; } catch (e) { L.lost = true; } };
    a.onload = go; m.onload = go; a.onerror = m.onerror = () => { L.lost = true; };
    const need = new Promise((res) => { if (window.BDATA && BDATA[th.dat]) return res(); const sc = document.createElement('script'); sc.src = 'backdrops/' + th.dat + '.data.js'; sc.onload = res; sc.onerror = res; document.head.appendChild(sc); });   // pictures go to WebGL as data, because a picture read from a file path would be refused
    need.then(() => { const d = window.BDATA && BDATA[th.dat]; if (!d) { L.lost = true; return; } a.src = d.img; m.src = d.mask; });
    L.draw = (t) => { if (!L.ready || L.lost) return; gl.uniform1f(ut, t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); L.lost = true; cv.hidden = true; });   // the still picture underneath stays
    el.appendChild(cv);
    return L;
  };

  // ---- scene engine (v753): the picture is split into layers (sky without clouds, the clouds, masks for stars / lights / water / trees / mist) and a shader moves the real pieces ----
  const SCENE_FRAG = `precision highp float; varying vec2 uv;
  uniform sampler2D plate; uniform sampler2D cloud; uniform sampler2D mA; uniform sampler2D mB; uniform float t;
  uniform vec4 P1;   // x cloud speed (screen widths per second), y cloud parallax, z sway amount, w mist amount
  uniform vec4 P2;   // x water amount, y light flicker, z star twinkle, w hot glow pulse
  uniform vec3 mistCol; uniform vec3 warmCol; uniform vec3 hotCol; uniform vec3 moonCol; uniform vec3 moon;   // moon: x, y, strength
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
  float fbm(vec2 p) { return vn(p) * .55 + vn(p * 2.03 + 7.1) * .3 + vn(p * 4.1 + 3.3) * .15; }
  void main() {
    vec4 A = texture2D(mA, uv), B = texture2D(mB, uv);
    vec2 o = vec2(0.);
    // wind in trees and branches
    // the sky flows: a very slow, smooth drift of the clouds (fades to nothing at the land, the moon and the stars so nothing tears)
    vec2 q = uv * vec2(1.7, 3.2);
    vec2 fv = vec2(fbm(q + vec2(t * .022, 0.)) - .5, fbm(q + vec2(5.2, 1.3 + t * .017)) - .5);
    o += (fv * 2. + vec2(sin(t * .11 + uv.y * 2.4) * .8, 0.)) * P1.z * A.b;
    // water: waves roll toward you, the moon's reflection ripples
    float d = clamp((uv.y - .545) / .455, 0., 1.), k = B.b * P2.x;
    float ph = 9. / (d + .12) + t * 1.5, sw = sin(ph + sin(uv.x * 7. + t * .25) * 1.6), amp = .0007 + .0026 * d;
    o += vec2(sin(ph * .9 + uv.x * 20.) * amp * .9, sw * amp * .55) * k;
    float rf = exp(-pow((uv.x - moon.x) / .045, 2.)) * smoothstep(.54, .6, uv.y) * (1. - smoothstep(.78, .86, uv.y));
    o.x += sin(uv.y * 220. - t * 2.4) * .0016 * rf * k;
    vec3 col = texture2D(plate, uv + o).rgb;
    col += .03 * sw * d * k * vec3(.4, .6, 1.);
    // clouds drift across the sky (higher ones a little faster); they only show where the sky is, never over land
    float off = t * P1.x * (1. - P1.y * uv.y);
    float cx = fract((uv.x - off) * .5) * 2.; if (cx > 1.) cx = 2. - cx;   // the cloud strip is mirrored end to end, so it loops with no seam
    vec4 cl = texture2D(cloud, vec2(cx, uv.y));
    float cell = hash(floor(uv * vec2(110., 62.)));
    col *= 1. + A.a * P2.z * (sin(t * (1.2 + cell * 2.6) + cell * 40.) * .3 - .05) * (1. - cl.a * A.r);   // stars twinkle, and clouds cover them
    col = col * (1. - cl.a * A.r) + cl.rgb * A.r;   // the cloud layer is premultiplied
    // mist moves
    float f = fbm(vec2(uv.x * 4. - t * .012, uv.y * 11.) + vec2(0., t * .01)) * fbm(vec2(uv.x * 2.2 + t * .008, uv.y * 6.) + 3.7);
    col += mistCol * smoothstep(.12, .34, f) * A.g * P1.w;
    // lit windows and lanterns flicker; neon and lava glow slowly
    float c2 = hash(floor(uv * vec2(96., 54.)));
    float fl = .5 + .5 * sin(t * (.8 + c2 * 2.2) + c2 * 30.) * sin(t * .37 + c2 * 11.);
    col += warmCol * (B.a * (.55 + .45 * fl) - B.a * .7) * P2.y + warmCol * B.r * (fl - .5) * .5 * P2.y;
    col += hotCol * B.g * (.55 + .45 * sin(t * 1.3)) * P2.w;
    // the moon breathes
    vec2 md = (uv - moon.xy) * vec2(1., .5625);
    col += moonCol * exp(-dot(md, md) * 55.) * moon.z * (.55 + .45 * sin(t * .5));
    col += (hash(gl_FragCoord.xy * .37) - .5) / 200.;   // fixed dither: no banding rings in the glows
    gl_FragColor = vec4(col, 1.);
  }`;
  const engineLayer = (el, th) => {
    const cv = document.createElement('canvas'); cv.className = 'thgl'; cv.width = 1920; cv.height = 1081; cv.hidden = true;
    const gl = cv.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'default' }); if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }'), fs = sh(gl.FRAGMENT_SHADER, SCENE_FRAG);
    if (!vs || !fs) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(pr, n), cfg = th.scene;
    ['plate', 'cloud', 'mA', 'mB'].forEach((n, i) => gl.uniform1i(U(n), i));
    gl.uniform4f(U('P1'), cfg.cloud || 0, cfg.par == null ? .45 : cfg.par, cfg.sway || 0, cfg.mist || 0);
    gl.uniform4f(U('P2'), cfg.water || 0, cfg.flicker || 0, cfg.twinkle == null ? 1 : cfg.twinkle, cfg.hot || 0);
    gl.uniform3fv(U('mistCol'), cfg.mistCol || [.05, .06, .1]); gl.uniform3fv(U('warmCol'), cfg.warmCol || [.3, .17, .06]); gl.uniform3fv(U('hotCol'), cfg.hotCol || [.3, .08, .04]);
    gl.uniform3fv(U('moonCol'), cfg.moonCol || [.5, .58, .85]); gl.uniform3fv(U('moon'), cfg.moon || [.3, .4, .05]);
    const ut = U('t'), L = { cv, ready: false, lost: false }; let n = 0;
    const names = ['plate', 'cloud', 'mA', 'mB'], ims = names.map(() => new Image());
    const go = () => { if (++n < 4) return; try { ims.forEach((im, i) => { const x = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, x); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, i === 1); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }); gl.viewport(0, 0, cv.width, cv.height); L.ready = true; L.draw(0); cv.hidden = false; } catch (e) { L.lost = true; } };
    ims.forEach((im) => { im.onload = go; im.onerror = () => { L.lost = true; }; });
    const need = new Promise((res) => { if (window.BDATA && BDATA[th.dat]) return res(); const sc = document.createElement('script'); sc.src = 'backdrops/' + th.dat + '.data.js'; sc.onload = res; sc.onerror = res; document.head.appendChild(sc); });   // pictures go to WebGL as data (a picture read from a file path would be refused)
    need.then(() => { const d = window.BDATA && BDATA[th.dat]; if (!d) { L.lost = true; return; } ims.forEach((im, i) => { im.src = d[names[i]]; }); });
    L.draw = (t) => { if (!L.ready || L.lost) return; gl.uniform1f(ut, t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); L.lost = true; cv.hidden = true; });   // the still picture underneath stays
    el.appendChild(cv);
    return L;
  };

  // ---- Wallpaper Engine scene (v757): the real wallpaper "chill ocean" re-built with its own effects: grass sway, plant sway and water waves, each using the author's hand-painted mask ----
  const WE_FRAG = `precision highp float; varying vec2 uv;
  uniform sampler2D plate; uniform sampler2D masks; uniform sampler2D noise; uniform float t;
  vec2 rot(vec2 v, float r) { vec2 cs = vec2(cos(r), sin(r)); return vec2(v.x * cs.x - v.y * cs.y, v.x * cs.y + v.y * cs.x); }
  // foliage sway: the same maths as Wallpaper Engine's foliagesway effect (UV mode)
  vec2 sway(vec2 p, float mask, float dir, float strength, float phaseK, float speed) {
    float aspect = 16. / 9. * .3;
    vec2 nz = rot(vec2(1. / aspect, aspect), dir);
    float n = texture2D(noise, p * .05).g;
    vec2 pr = rot(p, dir);
    float amp = strength * strength * .005 * mask;
    float ph = (n * 6.2831853 + pr.x * 10. + pr.y * 5.) * phaseK;
    vec4 s = sin(ph + speed * t * vec4(1., -.16161616, .0083333, -.00019841));
    vec4 c = sin(.4 + ph + speed * t * vec4(-.5, .041666666, -.0013888889, .000024801587));
    return vec2(nz.x * dot(s, vec4(amp)), nz.y * dot(c, vec4(amp)));
  }
  void main() {
    // the effects are stacked like in the original: grass first, then plants, then the waves on top, so each one is looked up through the next
    vec2 q = uv;
    float pos = abs(q.y - .5);
    q.x += sin(t + q.y * (200. + .01 * pos)) * (.0016 + .01 * pos) * texture2D(masks, q).b;
    q += sway(q, texture2D(masks, q).g, .7206856, .55, .3, 3.);
    q += sway(q, texture2D(masks, q).r, -.52469391, .55, .3, 3.);
    vec3 col = texture2D(plate, q).rgb;
    // warm light drifting across the scene (the original's "light shafts"): a few big soft glows that slowly fade in and out
    for (int i = 0; i < 4; i++) {
      float fi = float(i), life = 9. + 4.3 * fi, ph = fract(t / life + fi * .27), cyc = floor(t / life + fi * .27);
      vec2 c = vec2(fract(sin(fi * 7.1 + cyc * 3.7) * 43758.5) * .8 + .1, .42 + fract(sin(fi * 3.3 + cyc * 5.9) * 12345.6) * .45);
      c.x -= ph * life * .003;
      vec2 d = (uv - c) * vec2(1., .5625);
      col += vec3(1., .59, .35) * .075 * sin(3.14159 * ph) * exp(-dot(d, d) * 14.);
    }
    col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5) / 255.;
    gl_FragColor = vec4(col, 1.);
  }`;
  const weLayer = (el, th) => {
    const sw = (window.__q ? 2560 : 3840);
    const cv = document.createElement('canvas'); cv.className = 'thgl'; cv.width = sw; cv.height = Math.round(sw * 9 / 16) + 1; cv.hidden = true;
    const gl = cv.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'default' }); if (!gl) return null;
    const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; };
    const vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }'), fs = sh(gl.FRAGMENT_SHADER, WE_FRAG);
    if (!vs || !fs) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(pr, n), ut = U('t'), L = { cv, ready: false, lost: false };
    ['plate', 'masks', 'noise'].forEach((n, i) => gl.uniform1i(U(n), i));
    const tex = (i, src, wrap) => { const x = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, x); if (src instanceof Uint8Array) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, src); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap); };
    const nz = new Uint8Array(256 * 256 * 4); let sd = 12345; for (let i = 0; i < nz.length; i++) { sd = (sd * 1664525 + 1013904223) >>> 0; nz[i] = sd >>> 24; }   // the wallpaper's own noise picture is built in to Wallpaper Engine, so a fixed random one stands in for it
    const ims = [new Image(), new Image()]; let n = 0;
    const go = () => { if (++n < 2) return; try { gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); tex(0, ims[0], gl.CLAMP_TO_EDGE); tex(1, ims[1], gl.CLAMP_TO_EDGE); tex(2, nz, gl.REPEAT); gl.viewport(0, 0, cv.width, cv.height); L.ready = true; L.draw(0); cv.hidden = false; } catch (e) { L.lost = true; } };
    ims.forEach((im) => { im.onload = go; im.onerror = () => { L.lost = true; }; });
    const need = new Promise((res) => { if (window.BDATA && BDATA[th.dat]) return res(); const sc = document.createElement('script'); sc.src = 'backdrops/' + th.dat + '.data.js'; sc.onload = res; sc.onerror = res; document.head.appendChild(sc); });
    need.then(() => { const d = window.BDATA && BDATA[th.dat]; if (!d) { L.lost = true; return; } ims[0].src = d.plate; ims[1].src = d.masks; });
    const PT = window.WEPart ? window.WEPart.make(gl, th.id, cv.width, () => { gl.disable(gl.BLEND); gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); }) : null;
    L.draw = (t) => { if (!L.ready || L.lost) return; gl.uniform1f(ut, t * window.WE_SPEED); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); if (PT) PT.draw(t); };
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); L.lost = true; cv.hidden = true; });
    el.appendChild(cv);
    return L;
  };

  // ---- v911: a screen-recorded loop of the real wallpaper as the backdrop (muted, looping video); falls back to the live scene runner if it cannot play ----
  const videoLayer = (el, th) => {
    const L = { cv: null, ready: false, lost: false, draw: () => {} };
    const v = document.createElement('video'); v.className = 'thgl'; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.preload = 'auto'; v.setAttribute('muted', ''); L.cv = v;
    v.addEventListener('playing', () => { L.ready = true; const im = el.querySelector(':scope > img.thimg'); if (im) setTimeout(() => { im.style.visibility = 'hidden'; }, 300); }, { once: true });
    v.addEventListener('error', () => { L.lost = true; v.remove(); if (th.we3) { const g = sceneLayer(el, th); L.cv = g.cv; L.draw = (t) => g.draw(t); } });
    v.src = th.vid; el.appendChild(v);
    const pl = v.play(); if (pl && pl.catch) pl.catch(() => {});
    return L;
  };

  // ---- v908: the REAL Wallpaper Engine scene runner (wescene.js): the wallpaper's own scene file, textures, masks and effect shaders (water flow, water ripple, foliage sway) plus its snow particle emitter, drawn live in WebGL ----
  const sceneLayer = (el, th) => {
    const L = { cv: null, ready: false, lost: false, draw: () => {} };
    if (!window.WEScene) { L.lost = true; return L; }
    const cv = document.createElement('canvas'); cv.className = 'thgl'; L.cv = cv; cv.style.opacity = '0';
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); L.lost = true; cv.hidden = true; });
    const go = () => {
      const cfg = window.WE_SCENES && window.WE_SCENES[th.we3];
      if (!cfg) { L.lost = true; return; }
      const c2 = Object.assign({}, cfg, { gate: ({ beyondmtn: [.40, .46] })[th.we3] || null }); if (window.__q) { c2.fbw = 1280; c2.fbh = 720; }
      const S = new window.WEScene(cv, c2); L.S = S;
      if (S.err) { L.lost = true; return; }
      S.onready = () => { L.ready = true; el.classList.add('we3on'); cv.style.transition = 'opacity .8s cubic-bezier(.45,.05,.25,1)'; requestAnimationFrame(() => requestAnimationFrame(() => { cv.style.opacity = '1'; })); const im = el.querySelector(':scope > img.thimg'); if (im) setTimeout(() => { im.style.visibility = 'hidden'; }, 1300); };
      // v913: full 4K working size at 60 fps; if the graphics card cannot keep up it steps down to 1440p, then 1080p
      let n = 0, w0 = performance.now(), lvl = 0; const SZ = [[3840, 2160], [2560, 1440], [1920, 1080]];
      L.draw = (t) => {
        if (!L.ready || L.lost) return;
        S.render(t * window.WE_SPEED);
        if (++n === 90) { const ms = (performance.now() - w0) / 90; if (ms > 22 && lvl < 0 && !window.__tOff) { lvl++; S.resize(SZ[lvl][0], SZ[lvl][1]); } n = 0; w0 = performance.now(); }
      };
    };
    if (window.WE_SCENES && window.WE_SCENES[th.we3]) go(); else { const sc = document.createElement('script'); sc.src = 'backdrops/we_' + th.we3 + '.data.js'; sc.onload = go; sc.onerror = () => { L.lost = true; }; document.head.appendChild(sc); }
    el.appendChild(cv);
    return L;
  };

  // ---- v917: EVERY wallpaper is now its real Wallpaper Engine scene: the generic scene runner (wegl.js) draws the wallpaper's own layers, effect shaders, animations and particle systems live in WebGL2 at 4K / 60 fps (it steps down to 1440p / 1080p only if the graphics card cannot keep up) ----
  const WEG_MAP = { summerbay:'wp_sb', riozinho:'wp_rz', dreamview3:'wp_dv', coastal:'wp_co', dreamview1:'wp_d1', dreamview4:'wp_d4', rivernight:'wp_nt', nightfall:'wp_nf', starrynight:'wp_ss', summerdusk:'wp_su', sunsetpeak:'wp_sm', nightwaterfall:'wp_wf', bridgeglow:'wp_yh', beachdusk:'wp_xc', summersands:'wp_sh', mtnstream:'wp_ms', seacliff:'wp_sk', sunrise4k:'wp_sr', sunsetvalley:'wp_vl', benchsea:'wp_bs' };   // v924: only the wallpapers with real water use the full-scene engine (the water is the real animated water); everything else keeps its picture + subtle effects
  for (const k in WEG_MAP) { const th = T.find((x) => x.id === k); if (th) { th.weg = WEG_MAP[k]; th.noOv = true; } }
  const wegLayer = (el, th) => {
    const L = { cv: null, ready: false, lost: false, draw: () => {} };
    if (!window.WEG) { L.lost = true; return L; }
    const SZ = window.__wegTest ? [[960, 540], [960, 540], [960, 540]] : [[3840, 2160], [2560, 1440], [1920, 1080]]; let lvl = window.__q ? 1 : 0;
    const newCv = () => { const cv = document.createElement('canvas'); cv.className = 'thgl'; cv.style.opacity = '0'; cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (L.dead) return; if (cv === L.cv) { if ((L.rb = (L.rb || 0) + 1) <= 3 && !L.busy) {  L.busy = true; setTimeout(() => { if (!L.dead) mk(newCv(), false); else L.busy = false; }, 300); } else giveUp(); } else cv.remove(); }); return cv; };
    const mk = (cv, first) => {
      if (L.dead) return;
      const cfg = window.WEG_SCENES && window.WEG_SCENES[th.weg];
      if (!cfg) { L.lost = true; return; }
      const S = new window.WEG(cv, cfg, { w: SZ[lvl][0], h: SZ[lvl][1] });
      if (S.err) { L.lost = true; return; }
      S.onready = () => {
        if (L.dead) { try { const x = S.gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) {} return; }
        const old = L.cv, oldS = L.S; L.S = S; L.ready = true; el.classList.add('we3on'); L.busy = false; if (first || !old) { cv.style.transition = 'opacity .8s cubic-bezier(.45,.05,.25,1)'; requestAnimationFrame(() => requestAnimationFrame(() => { cv.style.opacity = '1'; })); } else cv.style.opacity = '1';
        if (!first) { el.appendChild(cv); L.cv = cv; if (L.entry) L.entry.cv = cv; if (old) { old.remove(); try { const x = oldS.gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) {} } }
        const im = el.querySelector(':scope > img.thimg'); if (im) setTimeout(() => { im.style.visibility = 'hidden'; }, 1300);
      };
    };
    let n = 0, w0 = 0, last = 0, errs = 0;
    const giveUp = () => { L.lost = true; try { L.cv.hidden = true; const im = el.querySelector(':scope > img.thimg'); if (im) im.style.visibility = ''; } catch (e) {} };
    L.draw = (t) => {
      if (!L.ready || L.lost || !L.S) return;
      const now = performance.now(); if (now - last < 15) return; last = now;   // never faster than ~60 fps, even on a 144 Hz screen
      try { L.S.render(t * window.WE_SPEED); } catch (e) { console.error('weg render', e); if (++errs > 3) giveUp(); return; }
      if (++n === 20) w0 = now;   // the first frames are skipped (they include the graphics card warming up)
      else if (n === 80) { const ms = (now - w0) / 60; n = 20; w0 = now; if (ms > 21 && lvl < 0 && !L.busy && !window.__tOff) { lvl++; L.busy = true; n = 0; mk(newCv(), false); } }
    };
    L.cv = newCv(); el.appendChild(L.cv);
    if (window.WEG_SCENES && window.WEG_SCENES[th.weg]) mk(L.cv, true); else { const sc = document.createElement('script'); sc.src = 'backdrops/weg/data_' + th.weg + '.js'; sc.onload = () => mk(L.cv, true); sc.onerror = () => { L.lost = true; }; document.head.appendChild(sc); }
    return L;
  };

  // ---- Wallpaper Engine scene #2 (v759): "Chill'out Beach" - real separate layers (sky, ocean, boat, rock, palm shadow, palm leaves, foreground) each with the wallpaper's own effects, and flapping gulls ----
  const BE_VS = 'attribute vec2 p; uniform vec4 r; varying vec2 uv; void main(){ uv = p; gl_Position = vec4(mix(r.x, r.z, p.x) * 2. - 1., 1. - mix(r.y, r.w, p.y) * 2., 0., 1.); }';
  const BE_HEAD = `precision highp float; varying vec2 uv;
  uniform sampler2D tex; uniform sampler2D m0; uniform sampler2D m1; uniform sampler2D m2; uniform sampler2D m3; uniform sampler2D m4; uniform sampler2D nz; uniform float t; uniform float asp;
  uniform float opv[8]; uniform vec4 av[8]; uniform vec4 bv[8]; uniform vec2 sc[8];   // up to 8 effects per layer; each reads mask texture sc.x (0-3), channel sc.y (0-2)
  vec2 rot(vec2 v, float r) { vec2 cs = vec2(cos(r), sin(r)); return vec2(v.x * cs.x - v.y * cs.y, v.x * cs.y + v.y * cs.x); }
  vec4 mk(float s, vec2 p) { if (s < .5) return texture2D(m0, p); if (s < 1.5) return texture2D(m1, p); if (s < 2.5) return texture2D(m2, p); if (s < 3.5) return texture2D(m3, p); return texture2D(m4, p); }
  float ch(vec4 v, float c) { return c < .5 ? v.r : (c < 1.5 ? v.g : v.b); }
  // each effect is the same maths as Wallpaper Engine's own shader of that name (1 = water waves, 2 = shake, 3 = foliage sway, 4 = scroll, 5 = pulse)
  vec2 fx(float op, vec4 a, vec4 b, vec2 s, vec2 p) {
    if (op < .5) return p;
    if (op < 1.5) { vec2 d = rot(vec2(0., 1.), a.x); float pos = abs(dot(p - .5, d)); float dist = t * a.z + dot(p, d) * (a.y + b.x * pos); float st = a.w * a.w + b.x * pos; float v = sin(dist); if (b.y > 0.) v = sign(v) * pow(abs(v), b.y);
      return p + v * vec2(d.y, -d.x) * st * ch(mk(s.x, p), s.y); }
    if (op < 2.5) { vec2 fm = (mk(s.x, p).rg - .498) * 2.; float time = a.x * t; float o = sin(fract(time / 6.2831853) * 6.2831853) * .498 + .5; float bs = step(0., cos(time));
      o = mix(1. - pow(1. - o, a.z), pow(o, a.w), bs); return p + (o * 2. - 1.) * a.y * a.y * fm; }
    if (op < 3.5) { float aspect = asp * .3; vec2 nzv = rot(vec2(1. / aspect, aspect), a.x); float n = texture2D(nz, p * .05).g; vec2 pr = rot(p, a.x);
      float amp = a.y * a.y * .005 * (b.x > .5 ? ch(mk(s.x, p), s.y) : 1.); float ph = (n * 6.2831853 + pr.x * 10. + pr.y * 5.) * a.z;
      vec4 sn = sin(ph + a.w * t * vec4(1., -.16161616, .0083333, -.00019841)); vec4 c = sin(.4 + ph + a.w * t * vec4(-.5, .041666666, -.0013888889, .000024801587));
      return p + vec2(nzv.x * dot(sn, vec4(amp)), nzv.y * dot(c, vec4(amp))); }
    if (op > 4.5) return p;   // 5 = pulse works on the colour, below
    return fract((p + sign(a.xy) * a.xy * a.xy * t) * a.zw);
  }
  // 5 = pulse (WE "pulse"): the masked glow breathes; the mask's red / green / blue channels are three separate lights, each with its own phase
  vec4 pu(float op, vec4 a, vec4 b, vec2 s, vec2 p, vec4 c) {
    if (op < 4.5 || op > 5.5) return c;
    vec3 mkv = mk(s.x, p).rgb; float n = texture2D(nz, p * 3. + t * a.w * .05).g;
    vec3 sn = .5 + .5 * sin(t * a.x + vec3(0., 2.094, 4.188) + n * a.z * 6.2831853);
    float k = dot(mkv, sn) * a.y; c.rgb += c.a * k * b.rgb * .55 + c.rgb * k * .5; return c;
  }`;
  const BE_FSN = (n, pulse) => {   // only the effects this layer really has are compiled in: no loops, so the graphics card does just the work that is needed
    let m = '  void main() {\n    vec2 p = uv;\n';
    for (let i = n - 1; i >= 0; i--) m += `    p = fx(opv[${i}], av[${i}], bv[${i}], sc[${i}], p);\n`;
    m += '    vec4 c = texture2D(tex, p);\n';
    if (pulse) for (let i = 0; i < n; i++) m += `    c = pu(opv[${i}], av[${i}], bv[${i}], sc[${i}], uv, c);\n`;
    return BE_HEAD + m + '    gl_FragColor = c;\n  }';
  };

  const BE_BIRD_FS = `precision highp float; varying vec2 uv; uniform sampler2D tex; uniform float f; uniform float al;
  void main() { vec2 c = vec2(mod(f, 4.), floor(f / 4.)); vec4 k = texture2D(tex, (c + .01 + uv * .98) / 4.); gl_FragColor = k * al; }`;
  const BE_BIRD_VS = 'attribute vec2 p; uniform vec4 r; varying vec2 uv; void main(){ uv = p; gl_Position = vec4((r.x + (p.x - .5) * r.z) * 2. - 1., 1. - (r.y + (p.y - .5) * r.w) * 2., 0., 1.); }';
  const BE_VIG_FS = 'precision highp float; varying vec2 uv; void main() { vec2 d = vec2(.5) - uv; gl_FragColor = vec4(0., 0., 0., smoothstep(.2, .3, dot(d, d)) * .1); }';
  const BE_LAYERS = (R) => [
    { k: 'base', rect: [0, 0, 1, 1], solid: true },
    { bird: 1 },
    { k: 'ocean', rect: R.ocean, asp: 3840 / 535, ops: [{ t: 1, a: [0, 77.97, 1.23, .1], b: [0, 0, 0, 0], m: 'mOcean' }, { t: 2, a: [1, .25, 1, 1], b: [0, 0, 0, 0], m: 'sOcean' }] },
    { k: 'boat', rect: R.boat, asp: 3111 / 255, ops: [{ t: 1, a: [-1.5707963, 512, 5, .09], b: [0, 0, 0, 0], m: 'mFlag' }, { t: 1, a: [0, .25, 3, .02], b: [0, 0, 0, 0], m: 'mBoom' }, { t: 4, a: [-.09, 0, 1, 1], b: [0, 0, 0, 0] }] },
    { k: 'rock', rect: R.rock, asp: 1319 / 2145 },
    { k: 'shadow', rect: R.shadow, asp: 16 / 9, ops: [{ t: 3, a: [0, .4, .29, 1.46], b: [0, 0, 0, 0] }] },
    { k: 'leaves', rect: R.leaves, asp: 16 / 9, ops: [{ t: 3, a: [0, .33, .29, 1.46], b: [1, 0, 0, 0], m: 'mLeaves' }, { t: 2, a: [1, .1, 1, 1], b: [0, 0, 0, 0], m: 'sLeaves' }] },
    { k: 'top', rect: [0, 0, 1, 1] },
    { vig: 1 }
  ];
  // v786: each layer gets a tiny shader written for exactly its own effects (numbers and mask channels are baked in, nothing generic is compiled): the previous all-purpose shader was slow enough for the graphics driver to give up on
  const beFs = (ops, slots, fb) => {   // v804: every effect is its own small function working on the picture the effect before it made, exactly like Wallpaper Engine's effect list (so flow, ripples and warps can be stacked in any order)
    const f = (x) => { const v = Number(x) || 0; return Number.isInteger(v) ? v.toFixed(1) : String(v); };
    const mask = (o, p) => `texture2D(m${slots.indexOf(o.m)}, ${p})`, chn = (o) => ['r', 'g', 'b'][o.ch || 0];
    let fn = fb ? 'vec4 s0(vec2 p) { return texture2D(tex, vec2(p.x, 1. - p.y)); }\n' : 'vec4 s0(vec2 p) { return texture2D(tex, p); }\n';
    ops.forEach((o, i) => {
      const a = (o.a || [0, 0, 0, 0]).map(f), b = (o.b || [0, 0, 0, 0]).map(f), P = 's' + i; let body = '';
      if (o.t === 1) body += `    { vec2 d = rot(vec2(0., 1.), ${a[0]}); float pos = abs(dot(p - .5, d)); float dist = t * ${a[2]} + dot(p, d) * (${a[1]} + ${b[0]} * pos); float st = ${f(o.a[3] * o.a[3])} + ${b[0]} * pos; float v = sin(dist);${o.b && o.b[1] > 0 ? ` v = sign(v) * pow(abs(v), ${b[1]});` : ''} p = p + v * vec2(d.y, -d.x) * st * ${mask(o, 'p')}.${chn(o)}; }\n`;
      else if (o.t === 2) body += `    { vec2 fm = (${mask(o, 'p')}.rg - .498) * 2.; float time = ${a[0]} * tc; ${o.m === 'sOcean' ? `float w = sin(fract(time / 6.2831853) * 6.2831853) * .498 + .5; float bs = step(0., cos(time)); w = mix(1. - pow(1. - w, ${a[2]}), pow(w, ${a[3]}), bs); p = p + (w * 2. - 1.) * ${f(o.a[1] * o.a[1])} * fm;` : `p = p + sin(time) * .7 * ${f(o.a[1] * o.a[1])} * fm;`} }\n`;
      else if (o.t === 3) body += `    { float aspect = asp * .3; vec2 nzv = rot(vec2(1. / aspect, aspect), ${a[0]}); float n = texture2D(nz, p * .05).g; vec2 pr = rot(p, ${a[0]}); float amp = ${f(o.a[1] * o.a[1] * .005)}${o.b && o.b[0] > .5 ? ` * ${mask(o, 'p')}.${chn(o)}` : ''}; float ph = (n * 6.2831853 + pr.x * 10. + pr.y * 5.) * ${a[2]};\n      vec4 sn = sin(ph + ${a[3]} * t * vec4(1., -.16161616, .0083333, -.00019841)); vec4 c2 = sin(.4 + ph + ${a[3]} * t * vec4(-.5, .041666666, -.0013888889, .000024801587)); p = p + vec2(nzv.x * dot(sn, vec4(amp)), nzv.y * dot(c2, vec4(amp))); }\n`;
      else if (o.t === 4) body += `    p = fract((p + sign(vec2(${a[0]}, ${a[1]})) * vec2(${a[0]}, ${a[1]}) * vec2(${a[0]}, ${a[1]}) * t) * vec2(${a[2]}, ${a[3]}));\n`;
      else if (o.t === 6) {   // real waterflow: two flow phases blended by waterflowphase, shown only where the flow map points somewhere
        body += `    vec2 fm = (${mask(o, 'p')}.rg - .498) * 2.; float fa = length(fm); if (fa < .002) return ${P}(p);
    float ph = texture2D(wfp, p * ${a[3]}).r; float T = ${o.cl ? 'tc' : 't'} * ${a[0]}; vec4 cy = vec4(fract(T), fract(T + .5), fract(.25 + T), fract(.75 + T)) - .5;
    float b1 = smoothstep(${f(.5 - o.a[1])}, ${f(.5 + o.a[1])}, 2. * abs(cy.x)), b2 = smoothstep(${f(.5 - o.a[1])}, ${f(.5 + o.a[1])}, 2. * abs(cy.z)); vec2 off = fm * ${f(o.a[2] * .1)};
    vec4 f1 = mix(${P}(p + off * cy.x), ${P}(p + off * cy.y), b1), f2 = mix(${P}(p + off * cy.z), ${P}(p + off * cy.w), b2);
    return mix(${P}(p), mix(f1, f2, smoothstep(.2, .8, ph)), fa);\n`;
      } else if (o.t === 8) {   // real reflection: the picture below mirrored about a line (offset), shown where the mask is lit
        body += `    vec2 dl = p - .5; dl.y += ${a[0]}; dl.y = -dl.y; dl = rot(dl, ${a[1]}); float mk = ${mask(o, 'p')}.${chn(o)} * ${a[2]};
    vec4 al0 = ${P}(p), rf = ${P}(.5 + dl); return vec4(mix(al0.rgb, rf.rgb, mk), min(1., al0.a + rf.a * mk));\n`;
      } else if (o.t === 7) {   // real waterripple: two scrolling copies of the ripple normal picture push the picture sideways, only where the mask is lit
        const dir = o.a[3], sc = [-Math.sin(dir) * o.a[2] * o.a[2], Math.cos(dir) * o.a[2] * o.a[2]], pm = o.pm;
        const base = pm ? `{ vec3 q = vec3(${pm.map(f).slice(0, 3).join(', ')}) * p.x + vec3(${[pm[3], pm[4], pm[5]].map(f).join(', ')}) * p.y + vec3(${[pm[6], pm[7], pm[8]].map(f).join(', ')}); cr = q.xy / q.z; }` : 'cr = p;';
        body += `    float mk = ${o.m ? mask(o, 'p') + '.' + chn(o) : '1.'}; vec2 cr; ${base}
    float T2 = t * ${f(o.a[0] * o.a[0])}; vec2 sc = t * vec2(${f(sc[0])}, ${f(sc[1])});
    vec4 rc = vec4(cr + T2 + sc, cr * 1.333 - T2 + sc) * ${a[1]}; rc.xz *= asp; rc.yw *= ${b[0]};
    vec3 n1 = texture2D(rpn, rc.xy).xyz * 2. - 1., n2 = texture2D(rpn, rc.zw).xyz * 2. - 1.; vec3 nr = normalize(vec3(n1.xy + n2.xy, n1.z));
    return ${P}(p + nr.xy * ${f(o.b[1] * o.b[1])} * mk);\n`;
      }
      if (o.t === 5) fn += `vec4 s${i + 1}(vec2 p) {\n    vec2 uv = p; vec4 c = ${P}(p);\n    { vec3 mkv = ${mask(o, 'uv')}.rgb; float n = texture2D(nz, uv * 3. + t * ${a[3]} * .05).g; vec3 sn = .5 + .5 * sin(t * ${a[0]} + vec3(0., 2.094, 4.188) + n * ${a[2]} * 6.2831853); float k = dot(mkv, sn) * ${a[1]}; c.rgb += c.a * k * vec3(${b[0]}, ${b[1]}, ${b[2]}) * .55 + c.rgb * k * .5; }\n    return c;\n}\n`;
      else fn += `vec4 ${'s' + (i + 1)}(vec2 p) {\n${body}${o.t >= 6 ? '' : '    return ' + P + '(p);\n'}}\n`;
    });
    let head = 'precision highp float; varying vec2 uv; uniform sampler2D tex; uniform sampler2D nz; uniform sampler2D wfp; uniform sampler2D rpn; uniform float t; uniform float tc; uniform float asp; uniform float al;\n';
    for (let i = 0; i < slots.length; i++) head += `uniform sampler2D m${i};\n`;
    head += 'vec2 rot(vec2 v, float r) { vec2 cs = vec2(cos(r), sin(r)); return vec2(v.x * cs.x - v.y * cs.y, v.x * cs.y + v.y * cs.x); }\n';
    return head + fn + 'void main() {\n    gl_FragColor = s' + ops.length + '(uv) * al;\n}';
  };
  const beachLayer = (el, th) => {
    const sw = (window.__q ? 2560 : 3840);
    const cv = document.createElement('canvas'); cv.className = 'thgl'; cv.width = sw; cv.height = Math.round(sw * 9 / 16) + 1; cv.hidden = true;
    const gl = cv.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'default' }); if (!gl) return null;
    const mk = (vsrc, fsrc) => { const sh = (ty, src) => { const x = gl.createShader(ty); gl.shaderSource(x, src); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; }; const v = sh(gl.VERTEX_SHADER, vsrc), f = sh(gl.FRAGMENT_SHADER, fsrc); if (!v || !f) return null;
      const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); return gl.getProgramParameter(pr, gl.LINK_STATUS) ? pr : null; };
    const PB = mk(BE_BIRD_VS, BE_BIRD_FS), PV = mk(BE_VS, BE_VIG_FS); if (!PB || !PV) return null;
    const ULC = new Map();   // one small program per layer, made the first time the layer is drawn
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    const uni = (pr) => { const m = {}; return (n) => (n in m ? m[n] : (m[n] = gl.getUniformLocation(pr, n))); };
    const uB = uni(PB), uV = uni(PV);
    const L = { cv, ready: false, lost: false }, TX = {}, names = th.names || ['base', 'top', 'ocean', 'boat', 'rock', 'shadow', 'leaves', 'birds', 'mOcean', 'mFlag', 'mBoom', 'sOcean', 'sLeaves', 'mLeaves'];
    let R = null, lay = null, n = 0, lastT = 0;
    const setup = (pr) => { gl.useProgram(pr); const a = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0); };
    const mkTex = (src, wrap, pm) => { const x = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, x); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, pm);
      if (src instanceof Uint8Array) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, src); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap); return x; };
    // gulls: a flock leader flies across, up to three followers wobble beside it (numbers from the original particle files)
    const flocks = [{ ox: 232, oy: 735, life: 34.5 }, { ox: 14, oy: 681, life: 44.7 }], disc = (a, b) => { const r = rr(a, b), q = rr(0, TAU); return [Math.cos(q) * r, Math.sin(q) * r]; };
    const spawn = (f, first) => { const d = disc(32, 256); f.age = first ? rr(0, 8) : 0; f.x = f.ox + d[0]; f.y = f.oy + d[1]; f.vx = rr(100, 120) * 1.5; f.vy = rr(-10, 10) * 1.5; f.size = rr(100, 150);
      f.kids = [0, 1, 2].filter(() => Math.random() < .5).map(() => { const o = disc(32, 256); return { dx: o[0] * .8, dy: o[1] * .4, size: rr(100, 150), ph: rr(0, TAU), w: rr(.7, 1.6), fr: rr(0, 16) }; }); f.fr = rr(0, 16); f.x += f.vx * f.age; f.y += f.vy * f.age; };
    flocks.forEach((f) => spawn(f, true));
    const bird = (x, y, size, fr, al) => { if (!TX.birds || x < -200 || x > 4040) return; gl.uniform4f(uB('r'), x / 3840, y / 2160, size / 3840, size / 2160); gl.uniform1f(uB('f'), Math.floor(fr) % 16); gl.uniform1f(uB('al'), al); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    const go = () => { if (++n < names.length + 2) return; try {
      names.forEach((k) => { TX[k] = mkTex(L.ims[k], gl.CLAMP_TO_EDGE, !/^[ms][A-Z]/.test(k)); });
      const nz = new Uint8Array(256 * 256 * 4); let sd = 12345; for (let i = 0; i < nz.length; i++) { sd = (sd * 1664525 + 1013904223) >>> 0; nz[i] = sd >>> 24; }   // Wallpaper Engine's own noise picture is built into it, so a fixed random one stands in
      TX.nz = mkTex(nz, gl.REPEAT, false); if (lay0Fb) { const x = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, x); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, cv.width, cv.height, 0, gl.RGB, gl.UNSIGNED_BYTE, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); TX.__fb = x; } TX.wfp = mkTex(L.fx.wfp, gl.REPEAT, false); TX.rpn = mkTex(L.fx.rpn, gl.REPEAT, false);
      gl.viewport(0, 0, cv.width, cv.height); lay = (th.lay || BE_LAYERS)(R); L.ready = true; L.draw(0); cv.hidden = false; } catch (e) { L.lost = true; } };
    const lay0Fb = !!th.zpart; L.ims = {}; const MU = [1, 2, 3, 4, 6, 7];
    const need = new Promise((res) => { if (window.BDATA && BDATA[th.dat]) return res(); const sc = document.createElement('script'); sc.src = 'backdrops/' + th.dat + '.data.js'; sc.onload = res; sc.onerror = res; document.head.appendChild(sc); });
    need.then(() => { const d = window.BDATA && BDATA[th.dat]; if (!d) { L.lost = true; return; } R = d.rects; L.fx = {}; ['wfp', 'rpn'].forEach((k) => { const im = new Image(); L.fx[k] = im; im.onload = go; im.onerror = () => { L.lost = true; }; im.src = window.FXTEX[k]; }); names.forEach((k) => { const im = new Image(); L.ims[k] = im; im.onload = go; im.onerror = () => { L.lost = true; }; im.src = d[k]; }); });
    const bind = (unit, k) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, TX[k]); };
    const PT = window.WEPart ? window.WEPart.make(gl, th.id, cv.width, () => { gl.bindBuffer(gl.ARRAY_BUFFER, buf); }) : null;
    L.draw = (t) => {
      if (!L.ready || L.lost) return;
      const dt = Math.min(.1, Math.max(0, t - lastT)) * window.WE_SPEED; lastT = t; const f0 = performance.now();
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      let pz = -1; if (PT && th.zpart) PT.tick(t);
      for (const l of lay) {
        if (PT && th.zpart && l.z != null) { PT.draw(t, pz, l.z); pz = l.z; gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); }
        if (l.bird) {
          gl.enable(gl.BLEND); setup(PB); gl.uniform1i(uB('tex'), 0); bind(0, 'birds');
          for (const f of flocks) { f.age += dt; if (f.age > f.life) spawn(f, false); f.x += f.vx * dt; f.y += f.vy * dt; const fade = Math.min(1, f.age / 1.5, (f.life - f.age) / 1.5) * .9, fr = f.fr + f.age * 11.6;
            bird(f.x, f.y, f.size, fr, fade); for (const k of f.kids) bird(f.x + k.dx + Math.sin(t * k.w + k.ph) * 14, f.y + k.dy + Math.cos(t * k.w * .8 + k.ph) * 10, k.size, k.fr + f.age * 11.6, fade); }
          continue;
        }
        if (l.vig) { gl.enable(gl.BLEND); setup(PV); gl.uniform4f(uV('r'), 0, 0, 1, 1); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); continue; }
        const ops = (l.ops || []).slice(0, 16);
        if (!l.pr) { l.slots = []; for (const o of ops) if (o.m && !l.slots.includes(o.m)) l.slots.push(o.m); l.slots = l.slots.slice(0, 6); const c0 = performance.now(); l.pr = mk(BE_VS, beFs(ops, l.slots, l.fb)) || 0; try { window.consoleApi.lagLog('wallpaper: ' + th.id + ' layer ' + l.k + ' shader ' + (l.pr ? 'ok' : 'FAILED') + ' in ' + Math.round(performance.now() - c0) + ' ms (' + ops.length + ' effects)'); } catch {} }
        const PL = l.pr; if (!PL) continue;
        setup(PL); let uL = ULC.get(PL); if (!uL) { uL = uni(PL); ULC.set(PL, uL); }
        gl.uniform1i(uL('tex'), 0); gl.uniform1i(uL('nz'), 5); gl.uniform1i(uL('wfp'), 8); gl.uniform1i(uL('rpn'), 9); for (let i = 0; i < l.slots.length; i++) gl.uniform1i(uL('m' + i), MU[i]);
        bind(0, l.fb ? '__fb' : l.k); if (l.fb) gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGB, 0, 0, cv.width, cv.height, 0); bind(5, 'nz'); bind(8, 'wfp'); bind(9, 'rpn'); for (let i = 0; i < l.slots.length; i++) bind(MU[i], l.slots[i]);
        gl.uniform1f(uL('t'), t * window.WE_SPEED); gl.uniform1f(uL('tc'), t * window.WE_SPEED * window.WE_CLOUD); gl.uniform1f(uL('asp'), l.asp || 16 / 9); gl.uniform1f(uL('al'), l.al == null ? 1 : l.al); gl.uniform4fv(uL('r'), l.rect);
        if (l.solid) gl.disable(gl.BLEND); else gl.enable(gl.BLEND);
        if (l.scr) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (l.scr) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      }
      if (PT) { if (th.zpart) PT.draw(t, pz, 1e9); else PT.draw(t); }
      if ((L.nd = (L.nd || 0) + 1) <= 4) { const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); try { window.consoleApi.lagLog('wallpaper: ' + th.id + ' frame ' + L.nd + ' finished on the graphics card ' + Math.round(performance.now() - f0) + ' ms after it started'); } catch {} }   // only the first four frames are timed
    };
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); L.lost = true; cv.hidden = true; });
    el.appendChild(cv);
    return L;
  };
  const NICE = { winter: 'Alpine Frost', coast: 'Turquoise Shore', sunrise: 'Golden Meadow', bluehour: 'Blue Hour', pineforest: 'Violet Pines', natwinter: 'Frozen Road', mystic: 'Crimson Falls', japan: 'Fuji Shrine', arctic: 'Aurora Lake', autumncity: 'Ember City', cave: 'Crystal Cavern', snowcity: 'Snowfall Village', snowrise: 'Rose Dawn', sunsetmt: 'Sunset Ridge', nightlake: 'Moonlit Lake', snowmtn: 'Silver Peaks', icyforest: 'Winter Glow Woods', meteors: 'Meteors at Dawn', garden: 'Jade Garden', abandoned: 'Neon Ruins', riozinho: 'Riozinho Picoroso', dreamview3: 'Ruby Peak Falls', dreamview2: 'Northern Lights Pass', houseofdreams: 'House of Dreams', coastal: 'Chalk Cliff Coast', dreamview1: 'Rosewater Bench', dreamview4: 'Cloudglass Peaks', rivernight: 'Lantern Village', nightfall: 'Aurora Cabin', quietnight: 'Sapphire Valley', starrynight: 'Milky Way Lake', summerdusk: 'Summer Dusk', sunsetpeak: 'Alpenglow Lake', vhsstore: 'VHS Store', nightwaterfall: 'Moonfall Grotto', winterlights: 'Winter Village Lights', bridgeglow: 'Viaduct Afterglow', beachdusk: 'Beach at Dusk', beyondmtn: 'Mirror Pier', summerbay: 'Secret Bay Stairs', summersands: 'Summer Sands', mtnstream: 'Mountain Stream', moonfield: 'Full Moon Meadow', seacliff: 'Wildflower Cliffs', sunrise4k: 'Golden Range', sunsetvalley: 'Riverbend Valley', benchsea: 'Bench by the Sea', sakuraview: 'Blossom Watch', midnight: 'Pale Moon Hills', midaur: 'Midnight Aurora' };
  const INFO = [...ORDER.map((id) => T.find((x) => x.id === id)).filter(Boolean).map((x) => ({ id: x.id, name: NICE[x.id] || x.name }))];
  window.THEMES = INFO;

  let theme = 'winter';
  const targets = new Set();   // { el, n }
  const live = new Set();      // running canvases
  let timer = 0, last = 0, t0 = performance.now(), tick = 0;

  const paused = () => document.hidden || document.documentElement.classList.contains('nomotion') || ['bgpause', 'ingame', 'idle', 'appopening', 'introplay'].some((k) => document.body.classList.contains(k));
  const visible = (cv) => { try { return cv.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return cv.offsetParent !== null; } };

  const loop = () => {
    const now = performance.now();
    timer = requestAnimationFrame(loop);
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (paused()) return;
    tick++;
    for (const o of live) {
      if (!o.cv.isConnected) { live.delete(o); continue; }
      if (tick % 12 === 1) o.vis = visible(o.cv);
      if (o.vis === false) continue;
      if (o.gl && (!window.__q || now - (o.glAt || 0) > 30 || window.__tOff)) { o.glAt = now; o.gl.draw((now - t0) / 1000 + (window.__tOff || 0)); }   // the moving backdrop is drawn about 30 times a second: half the graphics work, and slow water and clouds look the same
      if (o.c) { o.c.setTransform(o.ss, 0, 0, o.ss, 0, 0); o.th.draw(o.c, (now - t0) / 1000 * window.WE_SPEED, o.st, dt * window.WE_SPEED); }   // overlay layers share the same playback speed
    }
    if (!live.size) stop();
  };
  const start = () => { if (!timer) { last = performance.now(); timer = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(timer); timer = 0; };

  function mountTheme(el, th, keepImg) {
    if (window.__share && th.img && el.closest) { if (!el.querySelector(':scope > img.thimg')) swapStill(el, th); return; }
    if (th.img && !(keepImg && el.querySelector(':scope > img.thimg'))) { const im = document.createElement('img'); im.className = 'thimg'; im.alt = ''; im.draggable = false; im.decoding = 'async'; im.onerror = () => { if (!im.__retry) { im.__retry = 1; setTimeout(() => { try { im.src = th.img; } catch {} }, 600); } }; im.src = th.img; el.appendChild(im); }
    if (window.__bdHold || (el.closest && el.closest('#sign') && !th.we3 && !th.weg)) return;   // v831: the profile page only ever shows the still picture, so nothing can glitch on it. v812: while the startup video plays only the still picture is placed; the moving wallpaper (shaders, particles) starts after the video so it cannot make it stutter
    const gl = window.__noGL ? null : th.vid ? videoLayer(el, th) : th.weg ? wegLayer(el, th) : th.we3 ? sceneLayer(el, th) : th.we2 ? beachLayer(el, th) : th.we ? weLayer(el, th) : th.scene ? engineLayer(el, th) : (th.mask ? glLayer(el, th) : null);   // water that moves (falls back to the still picture if WebGL is not available)
    if (th.noOv) { if (gl) { const ent = { cv: gl.cv, c: null, th, gl, st: null, vis: true, ss: 1 }; gl.entry = ent; live.add(ent); start(); } return; }   // v803: nothing is drawn on top any more, the particles are drawn inside the wallpaper's own WebGL canvas
    const SS = window.__q ? 2.4 : 4.8;   // v798: the falling snow / mist layer is drawn at 3840 wide (4K) instead of 800, so the particles are crisp instead of a stretched blur
    const cv = document.createElement('canvas'); cv.width = Math.round(W * SS); cv.height = Math.round(H * SS); cv.className = 'thcv';
    el.appendChild(cv);
    const c = cv.getContext('2d', { alpha: !!th.img }), o = { cv, c, th, gl, st: th.init(), vis: true, ss: SS };
    c.setTransform(SS, 0, 0, SS, 0, 0); th.draw(c, (performance.now() - t0) / 1000, o.st, .033);   // first picture right away, so it never flashes empty
    live.add(o); start();
  }

  window.fillBackdrop = (el, n) => {
    targets.add({ el, n });
    const th = T.find((x) => x.id === theme);
    if (!th) return fillSky(el, n);
    mountTheme(el, th);
  };

  const gpuFree = (o) => { try { if (o.gl) o.gl.dead = true; } catch {} try { if (o.gl && o.gl.cv) { const g = o.gl.cv.getContext('webgl2') || o.gl.cv.getContext('webgl'); const e = g && g.getExtension('WEBGL_lose_context'); if (e) e.loseContext(); } } catch {} };
  // v765: if the graphics process crashes (it did once at start-up, leaving the home page black), the scene is rebuilt from scratch a moment later
  let remTries = 0, remAt = 0;
  const remount = () => {
    if (remTries >= 3) return; remTries++; if (remTries >= 2) window.__noGL = true;   // after a graphics crash the scene comes back lighter (smaller, 30 fps); after a second one it stays on the still picture
    for (const o of [...live]) { gpuFree(o); o.cv.remove(); live.delete(o); }
    for (const tg of [...targets]) {
      if (!tg.el.isConnected) { targets.delete(tg); continue; }
      tg.el.replaceChildren(); const th = T.find((x) => x.id === theme);
      if (th) mountTheme(tg.el, th); else fillSky(tg.el, tg.n);
    }
  };
  // v955: sharing your screen in Discord makes the graphics card encode your 4K screen as well; the wallpaper is rebuilt at a lighter size (1440p, 30 fps) so the graphics memory is not exhausted (which left the wallpaper dead, then black after switching)
  window.__shareMode = (on) => {   // v956: while you share your screen the wallpaper is a plain, light still picture (no WebGL, no big overlay canvases): the graphics card is busy encoding your screen and could not build new big layers, which is why a new wallpaper came up black
    if (on === false) { if (!window.__share) return; window.__share = false; window.__q = 0; window.__noGL = false; remTries = 0; setTimeout(remount, 400); return; }
    window.__share = true; window.__noGL = true;
    for (const o of [...live]) { gpuFree(o); try { o.cv.remove(); } catch {} live.delete(o); }
    for (const tg of [...targets]) { if (!tg.el.isConnected) continue; for (const n of [...tg.el.children]) { if (n.tagName === 'IMG' && n.classList.contains('thimg')) n.style.visibility = ''; else { try { n.remove(); } catch {} } } }
  };
  // a 1080p copy of a wallpaper's still picture, made on the processor (software canvas), so the graphics card only has a small picture to hold
  const lite = {};
  const liteOf = (src) => lite[src] || (lite[src] = new Promise((res) => { const im = new Image(); im.onload = () => { try { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, 1920, 1080); c.toBlob((b) => res(b ? URL.createObjectURL(b) : src), 'image/jpeg', .9); } catch { res(src); } }; im.onerror = () => res(src); im.src = src; }));
  const swapStill = (el, th, tries) => {   // the old picture stays until the new one is fully loaded AND decoded; if that fails it is tried again and the old picture is never taken away
    const tok = el.__swapTok = (el.__swapTok || 0) + 1; tries = tries || 0;
    liteOf(th.img).then((u) => {
      if (el.__swapTok !== tok) return;   // a newer wallpaper was picked meanwhile
      const im = document.createElement('img'); im.className = 'thimg'; im.alt = ''; im.draggable = false; im.style.opacity = '0'; im.style.transition = 'opacity .5s ease'; im.src = u;
      const ok = () => { if (el.__swapTok !== tok) { try { im.remove(); } catch {} return; } const old = [...el.children].filter((n) => n !== im); el.appendChild(im); requestAnimationFrame(() => requestAnimationFrame(() => { im.style.opacity = '1'; })); setTimeout(() => { old.forEach((n) => { try { if (n.tagName === 'IMG') n.src = ''; n.remove(); } catch {} }); }, 600); };
      const bad = () => { try { im.remove(); } catch {} if (tries < 3 && el.__swapTok === tok) setTimeout(() => swapStill(el, th, tries + 1), 700); };
      (im.decode ? im.decode() : new Promise((r, j) => { im.onload = r; im.onerror = j; })).then(ok, bad);
    });
  };
  window.__wpRecover = (stage) => {   // v958: stage 1 = rebuild the live wallpaper, stage 2 = a light still picture, stage 3 = a solid colour so it is never black
    try { window.lagLogSafe && 0; } catch {}
    if (stage <= 1) { window.__noGL = false; remTries = 0; remount(); return; }
    if (stage === 2) { window.__share = true; window.__noGL = true; for (const o of [...live]) { gpuFree(o); try { o.cv.remove(); } catch {} live.delete(o); } for (const tg of [...targets]) { if (!tg.el.isConnected) continue; tg.el.replaceChildren(); const th = T.find((x) => x.id === theme); if (th && th.img) swapStill(tg.el, th); } return; }
    document.documentElement.classList.add('wpfallback');
  };
  window.__gpuGone = () => { setTimeout(remount, 1200); setTimeout(() => { remTries = Math.min(remTries, 2); }, 20000); };
  setInterval(() => { try { if (document.hidden) return; for (const o of live) if (o.gl && o.gl.lost && performance.now() - remAt > 4000 && o.gl.ready) { remAt = performance.now(); setTimeout(remount, 300); break; } } catch {} }, 2500);


  // ---- v783: every wallpaper has its own console skin ----
  // t = the deep tint every dark glass panel / settings page is shifted toward (k = how strongly), a = accent (focus, toggles, progress), g = glow under the selected tile, r = the selection ring
  const SKINS = {
    winter:     { t: [16, 42, 74],  k: .78, a: '#8fd2ff', g: '120,190,255', r: 'rgba(236,247,255,.96)' },   // glacier blue glass, sky-blue accent
    coast:      { t: [8, 44, 52],   k: .80, a: '#5fe6cc', g: '255,170,140', r: 'rgba(232,255,248,.96)' },   // deep sea teal, aqua accent, peach glow from the clouds
    sunrise:    { t: [54, 16, 20],  k: .72, a: '#ffcf4d', g: '255,190,70',  r: 'rgba(255,243,204,.97)' },   // wine red sky, sun-gold accent
    bluehour:   { t: [22, 24, 68],  k: .82, a: '#9db0ff', g: '255,130,190', r: 'rgba(238,232,255,.96)' },   // indigo night, periwinkle accent, pink horizon glow
    pineforest: { t: [40, 22, 66],  k: .80, a: '#e3a6ff', g: '190,130,255', r: 'rgba(246,234,255,.96)' },   // violet pines, orchid accent
    natwinter:  { t: [20, 44, 52],  k: .76, a: '#a5ec8e', g: '255,210,110', r: 'rgba(244,255,236,.96)' },   // spruce green-blue, fresh pine accent, warm road glow
    mystic:     { t: [30, 32, 40],  k: .72, a: '#ff7646', g: '255,100,50',  r: 'rgba(255,232,220,.96)' },   // charcoal fog, burning-sun orange accent
    japan:      { t: [36, 12, 36],  k: .78, a: '#ff5b66', g: '255,225,90',  r: 'rgba(255,240,240,.97)' },   // plum shadow, torii red accent, golden-leaf glow
    arctic:     { t: [6, 34,  50],  k: .82, a: '#62ffc4', g: '90,255,190',  r: 'rgba(230,255,246,.96)' },   // polar night, aurora green accent
    autumncity: { t: [44, 18, 28],  k: .74, a: '#ff8f6b', g: '255,150,100', r: 'rgba(255,234,222,.96)' },   // dusk maroon, ember coral accent
    cave:       { t: [28, 14, 40],  k: .84, a: '#ffa04f', g: '90,215,255',  r: 'rgba(255,240,222,.97)' },   // violet rock, amber glow, cool pool-blue light
    riozinho:   { t: [6, 22, 58],   k: .8, a: '#6fb4ff', g: '90,160,255', r: 'rgba(226,240,255,.96)' },   // deep midnight blue, moonlit sky-blue accent
    dreamview3: { t: [30, 16, 56], k: .76, a: '#ff9a5a', g: '255,150,90', r: 'rgba(255,240,232,.96)' },   // dusk violet, sunset-orange accent
    dreamview2: { t: [12, 20, 60], k: .76, a: '#7fe8d0', g: '110,230,210', r: 'rgba(232,248,255,.96)' },   // deep night blue, aurora-teal accent
    houseofdreams: { t: [44, 24, 84], k: .72, a: '#ff9be0', g: '255,155,225', r: 'rgba(255,238,250,.96)' },   // lilac dusk, blossom-pink accent
    coastal: { t: [10, 52, 92], k: .7, a: '#ffd36a', g: '255,211,106', r: 'rgba(240,250,255,.96)' },   // sea blue, sunlit gold accent
    dreamview1: { t: [22, 30, 72], k: .74, a: '#ff8fa8', g: '255,140,170', r: 'rgba(255,238,244,.96)' },   // dusk navy, coral-pink accent
    dreamview4: { t: [52, 44, 92], k: .72, a: '#ffb3c8', g: '255,179,200', r: 'rgba(255,240,246,.96)' },   // dusky violet, pastel-pink accent
    rivernight: { t: [14, 20, 70], k: .78, a: '#ffc060', g: '255,190,90', r: 'rgba(236,240,255,.96)' },   // deep indigo night, lantern-amber accent
    nightfall: { t: [10, 44, 52], k: .76, a: '#ffb060', g: '120,230,200', r: 'rgba(232,255,248,.96)' },   // deep teal night, cabin-window amber accent
    quietnight: { t: [6, 20, 70], k: .78, a: '#7fb0ff', g: '110,170,255', r: 'rgba(226,238,255,.96)' },   // midnight blue, moonlit sky-blue accent
    starrynight: { t: [20, 18, 52], k: .76, a: '#ffb48a', g: '255,180,140', r: 'rgba(255,240,230,.96)' },   // midnight violet, afterglow-peach accent
    summerdusk: { t: [36, 26, 74], k: .72, a: '#ff9f80', g: '255,150,130', r: 'rgba(255,238,236,.96)' },   // twilight violet, sunset-coral accent
    sunsetpeak: { t: [48, 30, 70], k: .7, a: '#ffa860', g: '255,165,100', r: 'rgba(255,240,228,.96)' },   // dusk plum, sunset-orange accent
    vhsstore: { t: [10, 22, 70], k: .76, a: '#4fd8ff', g: '80,200,255', r: 'rgba(226,240,255,.96)' },   // rainy night blue, neon-cyan accent
    nightwaterfall: { t: [8, 28, 84], k: .78, a: '#ffb050', g: '90,170,255', r: 'rgba(226,240,255,.96)' },   // deep night blue, cabin-lamp amber accent
    winterlights: { t: [34, 40, 96], k: .72, a: '#ffc870', g: '255,200,120', r: 'rgba(255,246,232,.96)' },   // snowy dusk indigo, string-light gold accent
    midnight: { t: [8, 10, 18], k: .8, a: '#b8c4e8', g: '150,170,220', r: 'rgba(232,238,255,.96)' },   // black-blue night forest, pale moonlight accent
    sakuraview: { t: [70, 50, 100], k: .68, a: '#ffaac8', g: '255,170,200', r: 'rgba(255,240,245,.96)' },
    benchsea: { t: [20, 40, 120], k: .7, a: '#8cbeff', g: '140,190,255', r: 'rgba(235,244,255,.96)' },
    sunsetvalley: { t: [56, 56, 120], k: .68, a: '#ff9696', g: '255,150,150', r: 'rgba(255,240,240,.96)' },
    sunrise4k: { t: [40, 60, 100], k: .66, a: '#ffc878', g: '255,200,120', r: 'rgba(255,246,230,.96)' },
    seacliff: { t: [20, 90, 150], k: .6, a: '#ff9678', g: '255,150,120', r: 'rgba(255,245,240,.96)' },
    moonfield: { t: [14, 40, 48], k: .7, a: '#bee9aa', g: '190,235,170', r: 'rgba(240,255,235,.96)' },
    mtnstream: { t: [20, 80, 80], k: .6, a: '#8ce1c8', g: '140,225,200', r: 'rgba(240,255,250,.96)' },
    summersands: { t: [30, 80, 110], k: .6, a: '#78d7d7', g: '120,215,215', r: 'rgba(240,252,255,.96)' },
    summerbay: { t: [10, 70, 60], k: .6, a: '#96ebaa', g: '150,235,170', r: 'rgba(240,255,244,.96)' },
    beyondmtn: { t: [24, 70, 150], k: .6, a: '#ffc59a', g: '255,197,154', r: 'rgba(255,246,238,.96)' },
    beachdusk: { t: [14, 36, 92], k: .72, a: '#7fc0ff', g: '120,190,255', r: 'rgba(232,244,255,.96)' },
    bridgeglow: { t: [26, 24, 76], k: .74, a: '#ffa880', g: '255,170,130', r: 'rgba(255,238,236,.96)' },   // twilight indigo, sunset-peach accent
    abandoned:  { t: [14, 40, 46],  k: .74, a: '#ffd23f', g: '110,230,210', r: 'rgba(236,255,250,.96)' },   // teal night, neon-yellow accent, cold cyan glow
    snowcity:   { t: [34, 42, 86],  k: .76, a: '#ffc46b', g: '255,170,200', r: 'rgba(255,246,236,.96)' },   // twilight blue, lit-window gold accent, blossom-pink glow
    snowrise:   { t: [44, 30, 78],  k: .78, a: '#ff9d6e', g: '255,150,100', r: 'rgba(255,241,232,.96)' },   // dusk purple, sunrise orange accent
    sunsetmt:   { t: [22, 24, 46],  k: .80, a: '#ff9650', g: '255,140,70',  r: 'rgba(255,238,220,.97)' },   // navy peaks, sunset orange accent
    nightlake:  { t: [4, 36, 46],   k: .84, a: '#62e6e2', g: '120,255,245', r: 'rgba(228,255,255,.96)' },   // deep teal night, moonlit cyan accent
    snowmtn:    { t: [16, 34, 94],  k: .80, a: '#b4f0ff', g: '255,160,200', r: 'rgba(240,250,255,.97)' },   // royal moonlit blue, ice-white accent, pink cloud glow
    midaur:     { t: [10, 34, 52],  k: .80, a: '#8af2e2', g: '255,140,210', r: 'rgba(232,255,252,.96)' },   // deep teal night, aurora mint accent, magenta glow
    garden:     { t: [8, 40, 46],   k: .80, a: '#7cf0c4', g: '150,255,210', r: 'rgba(236,255,248,.96)' },   // deep jade water, mint accent, soft green glow
    meteors:    { t: [40, 24, 66],  k: .78, a: '#ff8fb8', g: '255,150,190', r: 'rgba(255,238,246,.96)' },   // violet dawn, rose accent, pink sky glow
    icyforest:  { t: [26, 40, 74],  k: .76, a: '#ff9a82', g: '255,150,120', r: 'rgba(255,240,236,.96)' },   // frozen blue, warm trunk-coral accent
  };
  const SKFM = {"winter": "ring", "coast": "double", "sunrise": "under", "bluehour": "double", "pineforest": "under", "natwinter": "ring", "mystic": "bracket", "japan": "bracket", "arctic": "bracket", "autumncity": "under", "cave": "ring", "snowcity": "double", "abandoned": "double", "riozinho": "ring", "dreamview3": "double", "dreamview2": "bracket", "houseofdreams": "under", "coastal": "ring", "dreamview1": "double", "dreamview4": "ring", "rivernight": "bracket", "nightfall": "ring", "quietnight": "double", "starrynight": "ring", "summerdusk": "under", "sunsetpeak": "bracket", "vhsstore": "ring", "nightwaterfall": "double", "winterlights": "ring", "bridgeglow": "under", "beachdusk": "ring", "beyondmtn": "bracket", "summerbay": "double", "summersands": "under", "mtnstream": "bracket", "moonfield": "double", "seacliff": "ring", "sunrise4k": "under", "sunsetvalley": "bracket", "benchsea": "ring", "sakuraview": "under", "snowrise": "ring", "sunsetmt": "under", "nightlake": "double", "snowmtn": "ring", "icyforest": "under", "meteors": "ring", "garden": "bracket", "midaur": "double"};
  window.skinFor = (id) => SKINS[id] || SKINS.winter;
  window.applySkin = (id) => {
    const k = window.skinFor(id), st = document.documentElement.style;
    { const av = (k.t[0] + k.t[1] + k.t[2]) / 3, cl = (v) => Math.max(0, Math.min(255, Math.round((av + (v - av) * 1.7) * 1.3)));   // v796: richer, more saturated colour so each wallpaper's console reads as its own palette
      st.setProperty('--skr', cl(k.t[0])); st.setProperty('--skg', cl(k.t[1])); st.setProperty('--skb', cl(k.t[2])); st.setProperty('--skk', Math.min(.97, k.k + .14)); }
    st.setProperty('--ring', `color-mix(in srgb, ${k.a} 38%, ${k.r})`); st.setProperty('--skglow', k.g); st.setProperty('--skacc', k.a);
    st.setProperty('--accent', k.a);   // each wallpaper brings its own accent colour
    document.documentElement.dataset.skin = id; document.documentElement.dataset.fm = SKFM[id] || 'ring';
  };

  window.setBackdropTheme = (id) => {
    id = INFO.some((x) => x.id === id) ? id : 'winter';
    window.applySkin(id);
    try { if (typeof SND !== 'undefined' && SND.theme) SND.theme(id); } catch {}
    if (id === theme) return; theme = id; window.__noGL = !!window.__share; try { document.documentElement.classList.remove('wpfallback'); if (window.consoleApi && window.consoleApi.wpChanged) window.consoleApi.wpChanged(id); } catch {}   // picking another wallpaper always tries the moving version again
    if (window.__share) { for (const tg of [...targets]) { if (!tg.el.isConnected) { targets.delete(tg); continue; } const th = T.find((x) => x.id === theme); if (th && th.img) swapStill(tg.el, th); else if (th) { tg.el.replaceChildren(); mountTheme(tg.el, th); } } return; }
    for (const o of [...live]) { gpuFree(o); o.cv.remove(); live.delete(o); }
    for (const tg of [...targets]) {
      if (!tg.el.isConnected) { targets.delete(tg); continue; }
      tg.el.replaceChildren();   // drop the previous scene
      const th = T.find((x) => x.id === theme);
      if (th) mountTheme(tg.el, th); else fillSky(tg.el, tg.n);
    }
  };
  window.bdHold = (on) => {   // true: drop the moving wallpaper and keep only the still picture; false: bring the moving wallpaper back
    window.__bdHold = !!on;
    for (const o of [...live]) { gpuFree(o); o.cv.remove(); live.delete(o); }
    stop();
    for (const tg of [...targets]) {
      if (!tg.el.isConnected) { targets.delete(tg); continue; }
      const th = T.find((x) => x.id === theme);
      if (on || !th) { tg.el.replaceChildren(); if (th) mountTheme(tg.el, th); else fillSky(tg.el, tg.n); continue; }
      // v820: bringing the moving wallpaper back never empties the screen: the still picture stays underneath while the live layers are built on top of it, and only then is it taken away (this was the flash after the startup video)
      for (const n of [...tg.el.children]) { if (!(n.tagName === 'IMG' && n.classList.contains('thimg'))) { try { n.remove(); } catch {} } }   // v822: the still picture is never removed or duplicated, the live layers are simply built on top of it
      mountTheme(tg.el, th, true);
    }
  };
  window.bdReport = () => { try { return [...targets].filter((t) => t.el.isConnected).map((t) => { const im = t.el.querySelector('img.thimg'); const r = t.el.getBoundingClientRect(); return (t.el.className || t.el.id) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' img=' + (im ? (im.naturalWidth ? 'ok' : 'notloaded') : 'none') + ' kids=' + t.el.children.length; }).join(' | '); } catch (e) { return 'err ' + e.message; } };
  window.nextTheme = (cur, dir = 1) => { const i = Math.max(0, INFO.findIndex((x) => x.id === cur)); return INFO[(i + dir + INFO.length) % INFO.length].id; };
  window.themeName = (id) => (INFO.find((x) => x.id === id) || INFO[0]).name;
})();

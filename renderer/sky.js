/* The wallpaper (v349): the exact picture you chose ("Vintage Cartoon Forest", saved as wallpaper.png next to this file),
   untouched, with live animation laid over it: stars twinkle, clouds slide across the sky,
   mist drifts through the valley, fireflies float and shooting stars
   streak by now and then. The moon itself never changes size. To use a sharper copy of the picture, just replace wallpaper.png
   with a bigger image of the same shape (16:9). Styles are set with element.style, never style="" text, because the console's
   security policy blocks that. fillSky(el, n, { compact }) puts one scene inside el; compact is the small version used behind the guide menu. */
(() => {
  // one fixed seed for the LAYOUT, so the sign-in page and the dashboard are the same picture; things that happen over time use true randomness
  let seed = 20261105;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const R = (a, b) => a + rnd() * (b - a), RR = (a, b) => a + Math.random() * (b - a);
  const mk = (tag, cls, st, par) => { const e = document.createElement(tag); if (cls) e.className = cls; if (st) for (const k in st) { if (k[0] === '-') e.style.setProperty(k, st[k]); else e.style[k] = st[k]; } if (par) par.appendChild(e); return e; };
  const pct = (v, d = 1) => v.toFixed(d) + '%';
  const IMG = 'url("wallpaper.png")';
  // the three clouds that were cut out of the picture so they can drift (x, y, width, height are percentages of the picture)
  const ST = [[16.33, 1.54, 2], [50.46, 2.27, 3], [93.52, 2.16, 3], [87.52, 3.9, 3], [58.61, 4.46, 5], [19.61, 4.55, 6], [29.83, 4.66, 6], [77.06, 4.73, 4], [69.62, 5.39, 7], [80.54, 6.9, 65], [65.71, 6.41, 3], [40.47, 7.46, 68], [97.73, 8.55, 8], [89.73, 8.61, 7], [47.6, 9.18, 7], [56.82, 9.83, 8], [73.82, 9.64, 3], [62.29, 10.47, 4], [31.38, 11.04, 10], [62.5, 14.56, 5], [83.42, 14.65, 6], [49.82, 15.2, 13], [88.27, 15.33, 11], [32.98, 16.42, 4], [39.55, 16.73, 5], [26.0, 16.96, 5], [55.85, 17.02, 6], [65.89, 17.41, 46], [44.65, 17.32, 2], [85.17, 20.72, 1], [76.85, 21.25, 1], [2.03, 21.89, 1], [36.24, 22.85, 1], [68.34, 22.92, 3], [59.36, 23.38, 2], [31.53, 25.39, 37], [73.49, 25.54, 10], [8.28, 27.95, 2], [36.24, 30.82, 5], [65.87, 34.5, 32], [40.49, 35.39, 5], [79.11, 37.12, 3]];   // where the picture's own stars are (x%, y%, size)
  const GL = [[16.27, 32.2], [65.91, 34.86], [66.03, 34.64], [16.33, 31.99], [65.73, 34.64], [16.15, 32.31], [65.91, 34.75], [65.73, 34.33], [40.37, 35.28], [65.55, 34.43], [65.67, 34.54], [15.19, 33.26], [65.67, 34.64], [65.91, 33.9], [65.91, 34.96], [15.79, 32.62], [66.03, 34.75], [65.91, 35.18], [36.24, 30.92], [65.85, 34.96], [69.44, 32.52], [65.79, 34.75], [65.73, 34.54], [65.79, 34.22], [59.21, 37.09], [36.18, 30.92], [40.55, 35.49], [65.85, 33.9], [65.85, 34.64], [65.67, 34.43], [51.02, 37.19], [65.85, 35.18], [16.51, 31.99], [36.24, 31.03], [65.91, 34.11], [40.61, 35.49], [65.91, 35.07], [40.61, 35.39], [40.55, 35.6], [16.03, 32.41], [65.85, 35.07], [65.85, 34.22], [65.49, 34.43], [59.15, 36.98], [65.79, 34.54], [16.27, 32.09], [69.44, 32.62], [69.38, 32.62], [66.03, 34.33], [65.85, 33.79], [36.3, 30.92], [65.73, 34.43], [66.03, 34.54], [50.96, 37.09], [16.33, 32.09], [65.85, 34.11], [66.03, 34.43], [65.85, 35.28], [69.38, 32.52], [79.13, 37.19], [16.75, 31.56], [65.79, 34.43], [65.97, 34.96], [65.79, 34.33], [65.91, 33.79], [66.09, 34.64], [65.85, 34.86], [16.57, 31.77], [65.79, 34.64], [79.07, 37.09], [15.91, 32.52], [79.07, 37.19], [65.85, 34.01], [65.85, 34.33], [65.85, 34.75], [65.97, 34.33], [15.13, 33.26], [40.43, 35.49], [66.09, 34.43], [65.61, 34.43], [16.09, 32.31], [66.09, 34.54], [40.55, 35.28], [40.55, 35.39], [40.43, 35.6], [40.49, 35.49], [50.96, 37.19], [65.91, 34.01], [79.13, 37.09], [66.21, 34.54], [65.97, 34.86], [40.43, 35.28], [16.45, 31.88], [16.15, 32.2], [65.97, 34.64], [40.49, 35.18], [15.31, 33.16], [40.49, 35.28], [40.43, 35.39], [66.15, 34.43], [79.19, 37.09], [40.49, 35.6], [15.37, 33.05], [16.39, 31.99], [66.27, 34.43], [16.81, 31.56], [40.37, 35.39], [16.63, 31.67], [65.97, 34.11], [40.61, 35.28], [65.55, 34.54], [40.37, 35.49], [65.61, 34.54], [65.91, 35.28], [66.15, 34.54], [15.97, 32.41], [16.57, 31.88], [65.49, 34.54], [40.55, 35.18], [16.69, 31.67], [59.15, 37.09], [66.21, 34.43], [16.63, 31.77], [15.85, 32.52], [16.75, 31.67], [65.91, 34.22], [65.67, 34.33], [16.39, 32.09], [16.51, 31.77], [65.97, 34.22], [51.02, 37.09], [16.51, 31.88], [65.97, 34.75], [16.21, 32.2], [16.45, 31.99], [16.69, 31.77], [85.17, 34.96], [15.25, 33.16], [66.27, 34.54]];   // bright edge points along the mountain ridges, where moonlight can glint

  // anything that fades in and out re-appears somewhere new each time, so it never repeats in the same spot
  const again = (e, fn) => e.addEventListener('animationiteration', fn);

  // ---- trees that bend in the wind: the picture is drawn by a small shader that shifts each pixel sideways by (how high it sits on a tree) x (a gust that travels across the scene); mountains and sky have weight 0 so they never move ----
  const SKYTEX = (() => { let p = null; const need = () => new Promise((res) => { if (window.SKYIMG) return res(); const sc = document.createElement('script'); sc.src = 'skydata.js'; sc.onload = sc.onerror = () => res(); document.head.appendChild(sc); }); return () => (p = p || need().then(() => Promise.all([window.SKYIMG && window.SKYIMG.wp, window.SKYIMG && window.SKYIMG.w].map((u) => new Promise((res) => { if (!u) return res(null); const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = u; }))))); })();
  // where the open night sky is (dark pixels in the upper half of the picture), read once from the picture so stars never land on clouds, mountains or the moon
  setTimeout(() => SKYTEX().then((im) => { try { const c = document.createElement('canvas'); c.width = 384; c.height = 216; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im[0], 0, 0, 384, 216); const d = x.getImageData(0, 0, 384, 216).data, A = [];
    for (let j = 1; j < 112; j++) for (let i = 1; i < 383; i++) { let ok = true; for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) { const q = ((j + dy) * 384 + i + dx) * 4; if (d[q] + d[q + 1] + d[q + 2] > 34) { ok = false; break; } } if (ok) A.push([i / 3.84, j / 2.16]); }
    window.__skyOK = A; } catch (e) {} }), 3000);
  function treeSway(fit) {
    let gl = null, cv = null;
    try { cv = document.createElement('canvas'); gl = cv.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: false }); } catch {}
    if (!gl) return null;
    const VS = '#version 300 es\nin vec2 p; out vec2 uv; void main(){ uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }';
    const FS = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D tp, tw; uniform float t, g0, dir, amp, dur, trav, fq;
void main(){
  float w = texture(tw, uv).r;
  vec2 u = uv;
  if (w > .003 && g0 > 0.) {
    float x = dir > 0. ? uv.x : 1. - uv.x;
    float tau = t - g0 - x * trav;
    float env = tau > 0. && tau < dur ? pow(sin(3.14159 * tau / dur), 2.) : 0.;
    float tr = .85 + .3 * sin(uv.x * 71. + 1.7) * sin(uv.x * 23. + .4);
    float lag = tau - .3 * w - .45 * sin(uv.x * 29. + uv.y * 11.);
    float sw = .62 + .38 * sin(6.28318 * fq * lag);
    u.x -= amp * dir * w * env * tr * sw;
  }
  o = vec4(texture(tp, u).rgb, 1.);
}`;
    const sh = (ty, src) => { const s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['tp', 'tw', 't', 'g0', 'dir', 'amp', 'dur', 'trav', 'fq'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
    const st = { g0: 0, dir: 1, amp: 0, dur: 4, trav: 2, fq: .8, ready: false, raf: 0, dead: false };
    cv.className = 'ns-gl3'; fit.appendChild(cv);
    const tex = (unit, img, mip) => { const T = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, T);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      if (mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); };
    const draw = () => { if (st.dead || !st.ready) return; const r = fit.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(2, Math.min(2560, Math.round(r.width * dpr))), H = Math.max(2, Math.round(W * 9 / 16));
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      gl.viewport(0, 0, W, H); gl.uniform1f(U.t, performance.now() / 1000); gl.uniform1f(U.g0, st.g0); gl.uniform1f(U.dir, st.dir); gl.uniform1f(U.amp, st.amp); gl.uniform1f(U.dur, st.dur); gl.uniform1f(U.trav, st.trav); gl.uniform1f(U.fq, st.fq);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    const loop = () => { st.raf = 0; if (st.dead || !fit.isConnected) return; draw(); const now = performance.now() / 1000; if (st.g0 > 0 && now < st.g0 + st.dur + st.trav + .2) st.raf = requestAnimationFrame(loop); else { st.g0 = 0; draw(); } };
    SKYTEX().then(([a, w]) => { if (!a || !w || st.dead) { cv.remove(); st.dead = true; return; }
      try { gl.useProgram(pr); tex(0, a, true); tex(1, w, false); gl.uniform1i(U.tp, 0); gl.uniform1i(U.tw, 1); st.ready = true; draw(); } catch { cv.remove(); st.dead = true; } });
    try { new ResizeObserver(() => { if (!st.raf) draw(); }).observe(fit); } catch {}
    st.gust = (k = 1) => { if (!st.ready || st.dead) return; st.dir = Math.random() < 0.75 ? 1 : -1; st.amp = 0.0022 * k * (0.7 + Math.random() * 0.45); st.dur = 5 + Math.random() * 2; st.trav = 1.8 + Math.random() * 1.2; st.fq = 0.45 + Math.random() * 0.25; st.g0 = performance.now() / 1000; if (!st.raf) st.raf = requestAnimationFrame(loop); };
    return st;
  }
  window.fillSky = function fillSky(el, n = 220, opts = {}) {
    if (!el || el.querySelector('.ns')) return;
    seed = 20261105;
    const compact = !!opts.compact;
    const root = mk('div', 'ns' + (compact ? ' cp' : ''));
    const fit = mk('div', 'ns-fit', null, root);   // a box with the picture's shape that always covers the screen, so every overlay lines up with the picture
    mk('div', 'ns-wp', { backgroundImage: IMG }, fit);
    if (!compact) {
      // wind in the trees (see treeSway): a gust now and then, travelling across the picture
      const sway = treeSway(fit); (window.__skySway = window.__skySway || []).push(sway);
      const gust = () => { if (!root.isConnected) return; if (sway && !sway.dead && vis() && !compact) sway.gust(); setTimeout(gust, RR(6500, 15000)); };
      setTimeout(gust, RR(2500, 4500));
      // the picture's own stars gently flash (placed exactly on them), and a few extra faint ones fade in and out; each reappears somewhere new, always while invisible
      // every particle lives by a small loop of its own: it picks a brand-new spot, size, speed and pause while invisible, plays one short life, then does it all again
      // smooth lives: opacity follows a soft bell (sin squared) sampled finely, so things melt in and out instead of snapping
      const bell = (t) => Math.pow(Math.sin(Math.PI * t), 2), sm = (t) => t * t * (3 - 2 * t), K = (f) => Array.from({ length: 13 }, (_, i) => Object.assign({ offset: i / 12 }, f(i / 12)));
      const live = (el, make) => { const go = () => { if (!root.isConnected) return; if (!vis()) { setTimeout(go, 1500); return; } const m = make(); const a = el.animate(K(m.f), { duration: m.dur, delay: m.delay || 0, easing: 'linear' }); a.onfinish = go; }; setTimeout(go, RR(0, 9000)); };
      { const big = ST.filter((q) => q[2] > 25);
        for (let i = 0; i < 0; i++) { const sv = mk('div', 'ns-sp', {}, fit);
          live(sv, () => { const q = big[Math.floor(Math.random() * big.length)], sz = (q[2] > 60 ? 3.4 : 2.6) * RR(0.8, 1.2), rt = RR(-10, 10); sv.style.left = pct(q[0], 2); sv.style.top = pct(q[1], 2); sv.style.width = sv.style.height = sz.toFixed(2) + 'cqw'; return { dur: RR(3500, 7500), delay: RR(0, 6000), f: (u) => ({ opacity: Math.pow(bell(u), 2.4), transform: 'translate(-50%,-50%) scale(' + (0.2 + 0.85 * Math.pow(bell(u), 1.5)).toFixed(3) + ') rotate(' + (rt * u).toFixed(1) + 'deg)' }) }; }); } }
      // every star in the sky is made here, random: each one picks a fresh dark-sky spot, size, brightness and life time every time
      for (let k = 0; k < 100; k++) { const t = mk('i', 'ns-tw', {}, fit);
        live(t, () => { const A = window.__skyOK; let tx, ty; if (A && A.length) { const p = A[Math.floor(Math.random() * A.length)]; tx = p[0] + RR(-0.25, 0.25); ty = p[1] + RR(-0.4, 0.4); } else { tx = RR(2, 98); ty = RR(1, 40); }
          t.style.left = pct(tx, 2); t.style.top = pct(ty, 2); const r = rnd(), sz = r < 0.55 ? 2 : r < 0.85 ? 2.6 : 3.4, o = RR(0.35, 0.95), n = RR(1, 3), ph = RR(0, 6.28); t.style.width = t.style.height = sz + 'px';
          return { dur: RR(14000, 30000), delay: RR(0, 6000), f: (u) => ({ opacity: o * Math.pow(bell(u), 1.6) * (0.88 + 0.12 * Math.sin(u * 6.28 * n + ph)) }) }; }); }
      // mist drifting through the valley
      for (let k = 0; k < 8; k++) mk('div', 'ns-mi', { top: pct(R(60, 86)), left: pct(R(5, 50)), width: pct(R(30, 50)), '--dx': R(-14, 14).toFixed(0) + '%', animationDuration: R(40, 80).toFixed(0) + 's', animationDelay: '-' + R(0, 50).toFixed(0) + 's' }, fit);
      // the moon's glow: a soft, steady halo with a wider glow that breathes in brightness only (the moon itself never changes)
      mk('div', 'ns-halo', null, fit); mk('div', 'ns-halo2', null, fit);
      // light passing over the hills like wind through the trees, and little dust specks floating in the moonlight
      for (let k = 0; k < 22; k++) { const m = mk('i', 'ns-mote', {}, fit);
        live(m, () => { let mx, my, mt = 0; do { mx = RR(0, 100); my = RR(5, 95); mt++; } while (mt < 30 && ST.some((q) => q[2] > 25 && Math.abs(q[0] - mx) < 10 && Math.abs(q[1] - my) < 18)); m.style.left = pct(mx); m.style.top = pct(my); const dx = RR(-90, 90), dy = RR(-70, 45), o = RR(0.18, 0.42), ph = RR(0, 6.28); return { dur: RR(32000, 62000), delay: RR(0, 4000), f: (u) => ({ opacity: o * Math.pow(bell(u), 1.2), transform: 'translate(' + (dx * u + 6 * Math.sin(u * 9 + ph)).toFixed(1) + 'px,' + (dy * u + 5 * Math.sin(u * 7 + ph)).toFixed(1) + 'px)' }) }; }); }
      // soft grey light ribbons slowly weaving through the sky, and heat-lightning glow that flickers inside the clouds
      for (let k = 0; k < 3; k++) mk('div', 'ns-aur', { top: pct(6 + k * 8), left: pct(R(10, 40)), width: pct(R(55, 80)), '--dx': R(8, 18).toFixed(0) + '%', animationDuration: R(38, 70).toFixed(0) + 's', animationDelay: '-' + R(0, 40).toFixed(0) + 's' }, fit);
      // low fog banks rolling through the trees
      for (let k = 0; k < 4; k++) mk('div', 'ns-fog', { top: pct(66 + k * 8), left: pct(R(-30, 20)), width: pct(R(60, 90)), '--dx': R(10, 25).toFixed(0) + '%', animationDuration: R(30, 60).toFixed(0) + 's', animationDelay: '-' + R(0, 40).toFixed(0) + 's' }, fit);
      // leaves blowing across on the night wind
      for (let k = 0; k < 20; k++) { const lf = mk('i', 'ns-leaf', {}, fit);
        live(lf, () => { lf.style.top = pct(RR(15, 98)); lf.style.left = pct(RR(-6, 10)); lf.style.width = RR(5, 9).toFixed(0) + 'px'; lf.style.height = RR(2, 4).toFixed(0) + 'px'; const dy = RR(-20, 24), rt = RR(300, 900) * (rnd() < 0.5 ? 1 : -1), ph = RR(0, 6.28); return { dur: RR(36000, 70000), delay: RR(0, 6000), f: (u) => ({ opacity: 0.55 * sm(Math.min(1, u / 0.12)) * sm(Math.min(1, (1 - u) / 0.12)), transform: 'translate(' + (108 * u).toFixed(2) + 'vw,' + (dy * u + 2.5 * Math.sin(u * 14 + ph)).toFixed(2) + 'vh) rotate(' + (rt * u).toFixed(0) + 'deg)' }) }; }); }
      // moonlight glinting off the mountain ridges, in a different place every time
      for (let k = 0; k < 8; k++) { const g = mk('i', 'ns-gl', {}, fit); live(g, () => { const p = GL[Math.floor(Math.random() * GL.length)]; g.style.left = pct(p[0], 2); g.style.top = pct(p[1], 2); return { dur: RR(2600, 5200), delay: RR(0, 5000), f: (u) => ({ opacity: 0.95 * Math.pow(bell(u), 1.3), transform: 'scale(' + (0.4 + 0.6 * bell(u)).toFixed(3) + ')' }) }; }); }
      // moths fluttering around the moon
      for (let k = 0; k < 5; k++) { const o = mk('div', 'ns-moth', { animationDuration: R(5, 12).toFixed(1) + 's', animationDelay: '-' + R(0, 10).toFixed(1) + 's', animationDirection: rnd() < 0.5 ? 'normal' : 'reverse', '--r': R(55, 190).toFixed(0) + 'px' }, fit); mk('i', null, { animationDuration: R(0.6, 1.4).toFixed(2) + 's' }, o); again(o, () => { o.style.setProperty('--r', RR(55, 200).toFixed(0) + 'px'); o.style.animationDuration = RR(5, 13).toFixed(1) + 's'; o.style.animationDirection = Math.random() < 0.5 ? 'normal' : 'reverse'; }); }
      // fireflies low in the forest
      for (let k = 0; k < 30; k++) { const ff = mk('span', 'ns-ff', {}, fit);
        live(ff, () => { ff.style.left = pct(RR(3, 97)); ff.style.top = pct(RR(55, 96)); const dx = RR(-60, 60), dy = RR(-55, 30), sc = RR(0.8, 1.2), ph = RR(0, 6.28), p2 = RR(0, 6.28), nb = RR(2, 4.5); return { dur: RR(8000, 19000), delay: RR(0, 4000), f: (u) => ({ opacity: bell(u) * (0.12 + 0.88 * Math.pow(Math.sin(Math.PI * nb * u + ph), 2)) * 0.9, transform: 'translate(' + (dx * sm(u) + 9 * Math.sin(u * 9 + ph)).toFixed(1) + 'px,' + (dy * sm(u) + 7 * Math.sin(u * 11 + p2)).toFixed(1) + 'px) scale(' + (sc * (0.75 + 0.25 * bell(u))).toFixed(3) + ')' }) }; }); }
    }
    el.insertBefore(root, el.firstChild);

    // only the scene that is actually on screen does anything
    const vis = () => {
      if (!root.isConnected || document.hidden || document.body.classList.contains('nofx') || document.body.classList.contains('bgpause') || document.body.classList.contains('introplay') || root.offsetParent === null || root.closest('[hidden]')) return false;
      const intro = document.getElementById('intro'), hero = root.closest('#hero'), b = document.body;
      if (intro && !intro.hidden && !intro.contains(root)) return false;   // the sign-in page is covering the dashboard
      if (hero && !b.classList.contains('wp') && !hero.classList.contains('appmode') && (!b.classList.contains('is-home') || b.classList.contains('lib'))) return false;
      return true;
    };
    // ---- a shooting star, now and then, across the sky ----
    const shoot = () => {
      if (!root.isConnected) return;
      if (vis() && !compact && root.querySelectorAll('.ns-sh').length < 2) {
        const len = RR(100, 200), u = mk('u', 'ns-sh', { left: pct(RR(30, 90)), top: pct(RR(2, 22)), '--a': RR(12, 36).toFixed(0) + 'deg', '--l': len.toFixed(0) + 'px', '--d': RR(0.7, 1.1).toFixed(2) + 's', '--t': (len * 1.9).toFixed(0) + 'px' }, root);
        u.addEventListener('animationend', () => u.remove());
      }
      setTimeout(shoot, RR(3500, 8000));
    };
    // ---- bats flapping across the moonlit sky, and an occasional flicker of lightning in the clouds ----
    const bat = () => {
      if (!root.isConnected) return;
      if (vis() && !compact && root.querySelectorAll('.ns-bat').length < 2) {
        const fl = root.querySelector('.ns-fit'), dur = RR(9, 15), sz = RR(18, 34), top = RR(6, 40), rev = Math.random() < 0.5;
        const w = mk('div', 'ns-bat', { top: pct(top), width: sz.toFixed(0) + 'px', '--dur': dur.toFixed(1) + 's', '--dir': rev ? '-1' : '1', animationDuration: dur.toFixed(1) + 's' }, fl);
        const NS = 'http://www.w3.org/2000/svg', sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 40 20'); sv.setAttribute('class', 'ns-bsv');
        const p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'M20 6 C17 2 11 0 2 2 C7 4 8 8 10 12 C13 8 16 8 18 12 L20 16 L22 12 C24 8 27 8 30 12 C32 8 33 4 38 2 C29 0 23 2 20 6 Z'); p.setAttribute('fill', '#07070a'); p.setAttribute('stroke', 'rgba(255,255,255,.18)'); p.setAttribute('stroke-width', '.6'); sv.appendChild(p); w.appendChild(sv);
        w.addEventListener('animationend', () => w.remove());
      }
      setTimeout(bat, RR(7000, 18000));
    };
    // wind: small, far-away curved wisps; a faint bright stretch travels along each curve and fades, always in a new place
    const WP = ['M0 14 C14 4 30 2 44 9 S72 20 86 10 C92 6 99 7 98 12 C97 15 93 14 94 11', 'M0 10 C16 16 28 18 42 11 S68 0 84 7 C92 11 98 8 96 4 C95 2 92 3 93 5', 'M0 12 C10 6 22 5 34 10 S58 18 70 12 S92 3 100 8'];
    const wind = () => {
      if (!root.isConnected) return;
      if (vis() && !compact && root.querySelectorAll('.ns-wl').length < 5) {
        const fl = root.querySelector('.ns-fit'), n = 2 + Math.floor(Math.random() * 2), flip = Math.random() < 0.5, mir = Math.random() < 0.25, bx = RR(8, 68), by = RR(8, 52), pi = Math.floor(Math.random() * WP.length);
        for (let i = 0; i < n; i++) {
          const d = RR(11, 16), w = RR(6, 11), l = mk('span', 'ns-wl', { left: pct(bx + i * RR(2, 5), 2), top: pct(by + i * RR(1.2, 2.6), 2), width: pct(w, 1), '--o': RR(0.28, 0.5).toFixed(2), '--d': d.toFixed(1) + 's', '--tx': RR(4, 9).toFixed(1) + 'cqw', animationDelay: (i * RR(0.6, 1.6)).toFixed(2) + 's' }, fl);
          l.innerHTML = '<svg viewBox="0 0 100 22" preserveAspectRatio="none"><g transform="' + (mir ? 'translate(100 0) scale(-1 1) ' : '') + (flip ? 'translate(0 22) scale(1 -1)' : '') + '"><path pathLength="1" fill="none" stroke="#e6ebff" stroke-width="1.1" stroke-linecap="round" vector-effect="non-scaling-stroke" d="' + WP[(pi + i) % WP.length] + '"/></g></svg>';
          l.addEventListener('animationend', (e) => { if (e.target === l) l.remove(); });
        }
      }
      setTimeout(wind, RR(4000, 9000));
    };
    const eyes = () => {
      if (!root.isConnected) return;
      // removed
      setTimeout(eyes, RR(9000, 24000));
    };
    if (!compact) { setTimeout(wind, RR(1500, 3500)); setTimeout(bat, RR(3000, 6000)); }
    setTimeout(shoot, RR(2500, 5000));
  };
})();

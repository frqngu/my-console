// v803: a small player for Wallpaper Engine's own particle files.
// Everything here is read from the wallpaper's real particle json (emitters, initializers, operators, renderers, children, instance overrides,
// object transforms) and the sprite images are Wallpaper Engine's own built-in textures. The only thing that is changed is ONE playback speed
// (window.WE_SPEED) that scales the clock of every system alike, like the playback-speed setting in Wallpaper Engine.
(() => {
  const TAU = Math.PI * 2, rnd = Math.random;
  const lerp = (a, b, t) => a + (b - a) * t;
  const num = (v, d) => (v == null ? d : typeof v === 'object' && !Array.isArray(v) ? (v.value == null ? d : +v.value) : +v);
  const vec = (v, d) => {   // "x y z", a number, an array or nothing -> [x, y, z]
    if (v == null) return d ? d.slice() : null;
    if (Array.isArray(v)) return [v[0] || 0, v[1] || 0, v[2] || 0];
    if (typeof v === 'number') return [v, v, v];
    const a = String(v).trim().split(/\s+/).map(Number); return [a[0] || 0, a[1] == null ? a[0] || 0 : a[1] || 0, a[2] == null ? 0 : a[2] || 0];
  };
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v) * 2 - 1; };

  const VS = 'attribute vec2 wp; attribute vec4 wu; attribute vec4 wc; attribute float wb; varying vec4 vu; varying vec4 vc; varying float vb; void main(){ vu = wu; vc = wc; vb = wb; gl_Position = vec4(wp, 0., 1.); }';
  const FS = 'precision mediump float; varying vec4 vu; varying vec4 vc; varying float vb; uniform sampler2D tx; uniform float ob; void main(){ vec4 c = texture2D(tx, vu.xy); if (vb > .001) c = mix(c, texture2D(tx, vu.zw), vb); float a = c.a * vc.a; gl_FragColor = vec4(c.rgb * vc.rgb * ob * a, a); }';   // genericparticle.frag: colour * texture, sprite-sheet frames blended

  // ---- one particle system (a particle json) living in one scene object ----
  const makeSys = (po, o, follow) => {
    const ov = o.ov, S = { po, o, follow: follow || null, ps: [], acc: po.em.map(() => 0), subs: [], done: false };
    S.max = Math.max(0, Math.round((po.cmax || po.max || 100) * (ov.count == null ? 1 : ov.count)));
    S.ops = po.op.map((op) => ({ op, n: op.name }));
    S.ini = po.in;
    S.rope = po.rd.some((r) => r.name === 'ropetrail');
    S.trail = po.rd.find((r) => r.name === 'spritetrail') || null;
    S.ropeLen = (po.rd.find((r) => r.name === 'ropetrail') || {}).length || .2;
    return S;
  };
  const toWorld = (o, lx, ly) => { const x = lx * o.sx, y = ly * o.sy; return [o.ca * x - o.sa * y, o.sa * x + o.ca * y]; };

  const spawn = (S, ei, e) => {
    const po = S.po, o = S.o, ov = o.ov, p = { alive: true, age: 0 };
    // ---- emitter: where the particle appears (in the system's own space) ----
    const org = vec(e.origin, [0, 0, 0]);
    let lx = org[0], ly = org[1], ex = 0, ey = 0;
    const nm = e.name, dir = vec(e.directions, [1, 1, 1]);
    if (nm === 'boxrandom') {
      const mx = vec(e.distancemax, [0, 0, 0]), mn = e.distancemin == null ? [-mx[0], -mx[1], -mx[2]] : vec(e.distancemin);
      lx += lerp(mn[0], mx[0], rnd()); ly += lerp(mn[1], mx[1], rnd());
    } else {
      const dm = vec(e.distancemax, [0, 0, 0])[0], dn = vec(e.distancemin, [0, 0, 0])[0], r = lerp(dn, dm, rnd()), a = rnd() * TAU;
      ex = Math.cos(a) * dir[0]; ey = Math.sin(a) * dir[1]; lx += ex * r; ly += ey * r;
    }
    let lvx = 0, lvy = 0;
    if (e.speedmax != null || e.speedmin != null) { const sp = lerp(+e.speedmin || 0, +e.speedmax || 0, rnd()); const a = rnd() * TAU; lvx += Math.cos(a) * sp * dir[0]; lvy += Math.sin(a) * sp * dir[1]; }
    p.size = 20; p.life = 5; p.cr = p.cg = p.cb = 1; p.al = 1; p.rx = 0; p.ry = 0; p.rz = 0; p.ax = 0; p.ay = 0; p.az = 0; p.fr0 = Math.floor(rnd() * 1000); p.q = [];
    let rotSet = false, sizeBase = 20;
    for (const it of S.ini) {
      const n = it.name, mn = it.min, mx = it.max;
      if (n === 'lifetimerandom') p.life = lerp(num(mn, 1), num(mx, num(mn, 1)), Math.pow(rnd(), it.exponent || 1)) * (ov.lifetime == null ? 1 : ov.lifetime);
      else if (n === 'sizerandom') sizeBase = lerp(num(mn, 20), num(mx, num(mn, 20)), Math.pow(rnd(), it.exponent || 1));
      else if (n === 'colorrandom') { const a = vec(mn, [255, 255, 255]), b = mx == null ? a : vec(mx), t = rnd(); p.cr = lerp(a[0], b[0], t) / 255; p.cg = lerp(a[1], b[1], t) / 255; p.cb = lerp(a[2], b[2], t) / 255; }
      else if (n === 'alpharandom') p.al = lerp(num(mn, 0), num(mx, num(mn, 0)), rnd());
      else if (n === 'velocityrandom') { const a = vec(mn, [0, 0, 0]), b = mx == null ? a : vec(mx); lvx += lerp(a[0], b[0], rnd()); lvy += lerp(a[1], b[1], rnd()); }
      else if (n === 'rotationrandom') { rotSet = true; if (mn == null && mx == null) p.rz = rnd() * TAU; else { const a = vec(mn, [0, 0, 0]), b = mx == null ? a : vec(mx); p.rx = lerp(a[0], b[0], rnd()); p.ry = lerp(a[1], b[1], rnd()); p.rz = lerp(a[2], b[2], rnd()); } }
      else if (n === 'angularvelocityrandom') { const a = vec(mn, [0, 0, 0]), b = mx == null ? a : vec(mx); p.ax += lerp(a[0], b[0], rnd()); p.ay += lerp(a[1], b[1], rnd()); p.az += lerp(a[2], b[2], rnd()); }
      else if (n === 'turbulentvelocityrandom') { const sp = lerp(it.speedmin == null ? 100 : it.speedmin, it.speedmax == null ? 250 : it.speedmax, rnd()), sc = it.scale == null ? 1 : it.scale, off = it.offset || 0, a = (noise((o.x + lx) * sc * .01 + off * 7.1 + rnd() * 40, (o.y + ly) * sc * .01 + rnd() * 40) * .5 + .5) * TAU * 2; lvx += Math.cos(a) * sp; lvy += Math.sin(a) * sp; }
    }
    if (ov.speed != null) { lvx *= ov.speed; lvy *= ov.speed; }
    p.size = sizeBase * (ov.size == null ? 1 : ov.size);
    // object transform (origin, scale, angle); child systems that follow stay glued to their parent particle
    const w = toWorld(o, lx, ly), v = toWorld(o, lvx, lvy);
    if (S.follow && e.instantaneous) { p.att = S.follow; p.ox = w[0]; p.oy = w[1]; p.x = S.follow.x + w[0]; p.y = S.follow.y + w[1]; }
    else if (S.follow) { p.x = S.follow.x + w[0]; p.y = S.follow.y + w[1]; }
    else { p.x = o.x + w[0]; p.y = o.y + w[1]; }
    p.vx = v[0]; p.vy = v[1];
    // random numbers for the operators that oscillate
    p.q = S.ops.map(({ op, n }) => {
      if (n === 'oscillatealpha' || n === 'oscillatesize' || n === 'oscillateposition') {
        const f0 = op.frequencymin == null ? 0 : op.frequencymin, f1 = op.frequencymax == null ? Math.max(f0, 1) : op.frequencymax;
        return { f: lerp(f0, f1, rnd()), s: lerp(op.scalemin == null ? 0 : op.scalemin, op.scalemax == null ? 1 : op.scalemax, rnd()), ph: lerp(op.phasemin || 0, op.phasemax == null ? TAU : op.phasemax, rnd()) };
      }
      if (n === 'turbulence') return { sp: lerp(op.speedmin == null ? 0 : op.speedmin, op.speedmax == null ? 100 : op.speedmax, rnd()), ph: rnd() * 50 };
      return null;
    });
    p.alive = true; p.hist = S.rope ? [] : null; p.px = 0; p.py = 0;
    S.ps.push(p);
    // children that follow this particle
    for (const c of po.ch || []) {
      if (c.type !== 'eventfollow') continue;
      if (c.prob != null && rnd() > c.prob) continue;
      const cs = makeSys(c, o, p); S.subs.push(cs);
      for (let i = 0; i < c.em.length; i++) if (c.em[i].instantaneous) for (let k = 0; k < Math.max(1, Math.round(c.em[i].instantaneous)); k++) if (cs.ps.length < cs.max) spawn(cs, i, c.em[i]);
    }
    return p;
  };

  const step = (S, dt, t) => {
    const po = S.po, o = S.o, ov = o.ov;
    // emit
    if (!S.follow || !S.follow.dead) for (let i = 0; i < po.em.length; i++) {
      const e = po.em[i]; if (e.instantaneous) continue;
      S.acc[i] += (+e.rate || 0) * (ov.rate == null ? 1 : ov.rate) * dt;
      while (S.acc[i] >= 1) { S.acc[i] -= 1; if (S.ps.length < S.max) spawn(S, i, e); else S.acc[i] = Math.min(S.acc[i], 1); }
    }
    for (const sub of S.subs) step(sub, dt, t);
    const ps = S.ps;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]; p.age += dt;
      if (p.age >= p.life) { p.dead = true; ps.splice(i, 1); continue; }
      const f = p.age / p.life; p.fa = 1; p.sm = 1; p.dx = 0; p.dy = 0;
      for (let k = 0; k < S.ops.length; k++) {
        const { op, n } = S.ops[k], q = p.q[k];
        if (n === 'movement') {
          const g = vec(op.gravity, [0, 0, 0]); if (g[0] || g[1]) { const w = toWorld(o, g[0], g[1]); p.vx += w[0] * dt; p.vy += w[1] * dt; }
          if (op.drag) { const d = Math.exp(-op.drag * dt); p.vx *= d; p.vy *= d; }
        } else if (n === 'alphafade') {
          const fi = op.fadeintime == null ? .5 : op.fadeintime, fo = op.fadeouttime == null ? .5 : op.fadeouttime;
          let a = 1; if (fi > 0 && f < fi) a = f / fi; if (fo > 0 && f > 1 - fo) a = Math.min(a, (1 - f) / fo); p.fa *= a;
        } else if (n === 'oscillatealpha') {
          const lo = op.scalemin == null ? 0 : op.scalemin, hi = op.scalemax == null ? 1 : op.scalemax; p.fa *= lerp(lo, hi, .5 + .5 * Math.sin(q.f * p.age + q.ph));
        } else if (n === 'oscillatesize') {
          const lo = op.scalemin == null ? 0 : op.scalemin, hi = op.scalemax == null ? 1 : op.scalemax; p.sm *= lerp(lo, hi, .5 + .5 * Math.sin(q.f * p.age + q.ph));
        } else if (n === 'oscillateposition') {
          const m = vec(op.mask, [1, 1, 0]), a = Math.sin(q.f * p.age + q.ph) * q.s, w = toWorld(o, m[0] * a, m[1] * a); p.dx += w[0]; p.dy += w[1];
        } else if (n === 'sizechange') {
          const s0 = op.starttime == null ? 0 : op.starttime, s1 = op.endtime == null ? 1 : op.endtime, v0 = op.startvalue == null ? 1 : op.startvalue, v1 = op.endvalue == null ? 0 : op.endvalue;
          p.sm *= f <= s0 ? v0 : f >= s1 ? v1 : lerp(v0, v1, (f - s0) / Math.max(1e-6, s1 - s0));
        } else if (n === 'turbulence') {
          const m = vec(op.mask, [1, 1, 1]), sc = op.scale == null ? 1 : op.scale, tt = t * (op.timescale == null ? 1 : op.timescale) * .3 + q.ph;
          const nx = noise(p.x * sc + tt, p.y * sc), ny = noise(p.x * sc + 31.7, p.y * sc + tt);
          p.vx += nx * q.sp * m[0] * dt * 2; p.vy += ny * q.sp * m[1] * dt * 2;
        } else if (n === 'angularmovement') {
          const fr = vec(op.force, [0, 0, 0]); p.ax += fr[0] * dt; p.ay += fr[1] * dt; p.az += fr[2] * dt; if (op.drag) { const d = Math.exp(-op.drag * dt); p.ax *= d; p.ay *= d; p.az *= d; }
        } else if (n === 'controlpointattract') {
          const cp = ov['controlpoint' + op.controlpoint];
          if (cp) { const ox = cp[0] - p.x, oy = cp[1] - p.y, d = Math.hypot(ox, oy); if (d > 1 && d < (op.threshold || 512)) { const s = (op.scale || 0) * dt / d; p.vx += ox * s; p.vy += oy * s; } }
        }
      }
      p.rx += p.ax * dt; p.ry += p.ay * dt; p.rz += p.az * dt;
      if (p.att) { if (p.att.dead) { p.x = p.att.x + p.ox; p.y = p.att.y + p.oy; p.att = null; } else { p.ox += p.vx * dt; p.oy += p.vy * dt; p.x = p.att.x + p.ox; p.y = p.att.y + p.oy; } }
      else { p.x += p.vx * dt; p.y += p.vy * dt; }
      if (p.hist) { const h = p.hist; const lx = h.length ? h[h.length - 1] : null; if (!lx || Math.hypot(lx.x - p.x, lx.y - p.y) > 1.5) h.push({ x: p.x, y: p.y, t: p.age }); while (h.length > 2 && p.age - h[0].t > S.ropeLen) h.shift(); }
    }
    for (let i = S.subs.length - 1; i >= 0; i--) { const s = S.subs[i]; if (s.follow && s.follow.dead && !s.ps.length && !s.subs.length) S.subs.splice(i, 1); }
  };

  // ---- the layer: reads window.WEP, draws every system of one theme into the wallpaper's own WebGL canvas ----
  const UNIT = 7;   // texture unit that the wallpaper's own layers never use
  window.WEPart = {
    make(gl, id, size, restore) {
      const D = window.WEP && window.WEP.th && window.WEP.th[id]; if (!D) return null;
      const mk = (ty, src) => { const x = gl.createShader(ty); gl.shaderSource(x, src); gl.compileShader(x); return x; };
      const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FS));
      gl.bindAttribLocation(pr, 0, 'wp'); gl.bindAttribLocation(pr, 1, 'wu'); gl.bindAttribLocation(pr, 2, 'wc'); gl.bindAttribLocation(pr, 3, 'wb'); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
      const uTx = gl.getUniformLocation(pr, 'tx'), uOb = gl.getUniformLocation(pr, 'ob'), buf = gl.createBuffer();
      const P = { ready: false, lost: false }, TX = {};
      let loaded = 0, want = 0, last = null, clock = 0, vbuf = new Float32Array(11 * 6 * 2048);
      const pow2 = (n) => (n & (n - 1)) === 0;
      const keys = new Set(); for (const o of D.objs) { const walk = (p) => { keys.add(p.tex); (p.ch || []).forEach(walk); }; walk(o.p); }
      want = keys.size;
      keys.forEach((k) => {
        const T = window.WEP.tex[k], im = new Image();
        im.onload = () => {
          const x = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + UNIT); gl.bindTexture(gl.TEXTURE_2D, x); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
          const mip = pow2(im.naturalWidth) && pow2(im.naturalHeight) && !(T.frames > 1);
          if (mip) gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          TX[k] = x; if (++loaded === want) boot();
        };
        im.onerror = () => { want--; if (loaded === want && want >= 0) boot(); };
        im.src = T.d;
      });
      const objs = D.objs.map((d) => {
        const a = (d.a || 0) * Math.PI / 180;
        const o = { x: d.o[0], y: d.o[1], sx: d.s[0], sy: d.s[1], ca: Math.cos(a), sa: Math.sin(a), ov: d.ov || {}, d };
        if (o.ov.alpha == null) o.ov.alpha = (d.p && /light_shafts/.test(d.p.tex || '')) ? .4 : 1;
        o.sys = makeSys(d.p, o); return o;
      });
      const boot = () => {
        // like the player, a system that has a start time is already running when the wallpaper opens
        for (const o of objs) {
          const st = Math.min(40, o.d.p.st || 0), dt = st > 12 ? 1 / 12 : 1 / 20;
          for (let t = 0; t < st; t += dt) step(o.sys, dt, t);
        }
        P.ready = true;
      };
      const STR = 11;   // floats per vertex: x y | u v u2 v2 | r g b a | frame blend
      const grow = (n) => { if ((n + 6) * STR > vbuf.length) { const nb = new Float32Array(vbuf.length * 2); nb.set(vbuf); vbuf = nb; } };
      const put = (n, x, y, u, v, u2, v2, cr, cg, cb, al, bl) => { const b = n * STR, V = D; vbuf[b] = (x - V.vx) / V.vw * 2 - 1; vbuf[b + 1] = (y - V.vy) / V.vh * 2 - 1; vbuf[b + 2] = u; vbuf[b + 3] = v; vbuf[b + 4] = u2; vbuf[b + 5] = v2; vbuf[b + 6] = cr; vbuf[b + 7] = cg; vbuf[b + 8] = cb; vbuf[b + 9] = al; vbuf[b + 10] = bl; };
      const spr = (S, n, T) => {
        const o = S.o, V = D, ov = o.ov, bri = ov.brightness == null ? 1 : ov.brightness, cm = ov.col || [1, 1, 1];
        const fwid = (T.w || 1) / T.cols, fhei = (T.h || 1) / T.rows, ratio = T.w ? fhei / fwid : 1;   // genericparticle.vert: width = size, height = size * texture ratio
        const tr = S.trail, trl = tr ? (tr.length == null ? .05 : tr.length) : 0, trmax = tr ? (tr.maxlength == null ? 10 : tr.maxlength) : 0, trmin = tr ? (tr.minlength || 0) : 0;
        for (const p of S.ps) {
          const f = p.age / p.life;
          const a = p.fa * p.al * ov.alpha; if (a <= .002) continue;
          const sz = p.size * p.sm * Math.abs(o.sx); if (sz <= 0) continue;
          const x = p.x + p.dx, y = p.y + p.dy;
          let rx, ry, ux, uy;   // the quad's right and up vectors (ComputeParticleTangents / ComputeParticleTrailTangents)
          if (tr) { const sp = Math.hypot(p.vx, p.vy) || 1, ln = Math.max(trmin, Math.min(sp * trl, trmax)); ux = p.vx / sp * ln; uy = p.vy / sp * ln; rx = -p.vy / sp; ry = p.vx / sp; }
          else {
            const cx = Math.cos(p.rx), sx = Math.sin(p.rx), cy = Math.cos(p.ry), sy = Math.sin(p.ry), cz = Math.cos(p.rz), sz2 = Math.sin(p.rz);
            // M = Rz * Rx * Ry, right = first row, up = second row (xy parts, the picture is seen from the front)
            rx = cz * cy - sz2 * sx * sy; ry = -sz2 * cx; ux = sz2 * cy + cz * sx * sy; uy = cz * cx;
          }
          const ext = Math.max(sz, sz * ratio) * (tr ? 1 + Math.hypot(ux, uy) : 1);
          if (x < V.vx - ext || x > V.vx + V.vw + ext || y < V.vy - ext || y > V.vy + V.vh + ext) continue;
          let fr = 0, fr2 = 0, bl = 0;
          if (T.frames > 1) {
            if (S.po.anim === 'randomframe') fr = fr2 = p.fr0 % T.frames;
            else { const lt = (f * (S.po.seqm || 1)) % 1, ff = lt * T.frames; fr = Math.floor(ff); fr2 = Math.min(T.frames - 1, fr + 1); bl = ff - fr; }
          }
          const c0 = fr % T.cols, r0 = Math.floor(fr / T.cols), c1 = fr2 % T.cols, r1 = Math.floor(fr2 / T.cols), iw = 1 / T.cols, ih = 1 / T.rows;
          const mir = o.sx < 0 ? -1 : 1, mirY = o.sy < 0 ? -1 : 1;
          const cr = p.cr * cm[0] * bri, cg = p.cg * cm[1] * bri, cb = p.cb * cm[2] * bri;
          grow(n);
          const cu = [0, 1, 0, 0, 1, 1], cv = [0, 0, 1, 1, 0, 1];   // two triangles of the quad (u, v with v = 0 at the top of the picture)
          for (let k = 0; k < 6; k++) {
            const u = cu[k], v = cv[k], du = (u - .5) * mir, dv = (v - .5);
            const px = x + sz * rx * du - sz * ratio * ux * dv * mirY, py = y + sz * ry * du - sz * ratio * uy * dv * mirY;
            put(n++, px, py, (c0 + u) * iw, (r0 + v) * ih, (c1 + u) * iw, (r1 + v) * ih, cr, cg, cb, a, bl);
          }
        }
        return n;
      };
      const rope = (S, n, T) => {   // a ribbon along the particle's recent path (the streaks of light)
        const o = S.o, ov = o.ov, cm = ov.col || [1, 1, 1];
        for (const p of S.ps) {
          const h = p.hist; if (!h || h.length < 2) continue;
          const a = p.fa * p.al * ov.alpha; if (a <= .002) continue;
          const w = p.size * Math.abs(o.sx) / 2;
          const cr = p.cr * cm[0], cg = p.cg * cm[1], cb = p.cb * cm[2];
          const pts = h.filter((q) => p.age - q.t <= S.ropeLen).concat([{ x: p.x, y: p.y, t: p.age }]); if (pts.length < 2) continue;
          const tot = pts.length - 1; let prev = null;
          for (let i = 0; i < pts.length; i++) {
            const q = pts[i], nx = pts[Math.min(pts.length - 1, i + 1)], pv = pts[Math.max(0, i - 1)];
            let dx = nx.x - pv.x, dy = nx.y - pv.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
            const cur = { l: [q.x - dy * w, q.y + dx * w], r: [q.x + dy * w, q.y - dx * w], v: 1 - i / tot, al: a * (i / tot) };
            if (prev) {
              grow(n);
              for (const [pt, u, v, al] of [[prev.l, 0, prev.v, prev.al], [prev.r, 1, prev.v, prev.al], [cur.l, 0, cur.v, cur.al], [cur.l, 0, cur.v, cur.al], [prev.r, 1, prev.v, prev.al], [cur.r, 1, cur.v, cur.al]]) put(n++, pt[0], pt[1], u, v, u, v, cr, cg, cb, al, 0);
            }
            prev = cur;
          }
        }
        return n;
      };
      P.tick = (t) => {   // one time step for all systems (when the particles are drawn in several slices between the picture layers)
        const speed = window.WE_SPEED == null ? 1 : window.WE_SPEED;
        const dt = last == null ? 0 : Math.min(.1, Math.max(0, t - last)) * speed; last = t; clock += dt;
        if (dt > 0) for (const o of objs) step(o.sys, dt, clock);
      };
      P.draw = (t, lo, hi) => {   // lo/hi: only the systems whose place in the scene's object list lies in [lo, hi) are drawn, so stars sit behind the houses and fireflies in front
        if (!P.ready || P.lost) return;
        if (lo === undefined) P.tick(t);
        gl.useProgram(pr); gl.enable(gl.BLEND); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2); gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 44, 0); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 44, 8); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 44, 24); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 44, 40);
        gl.activeTexture(gl.TEXTURE0 + UNIT); gl.uniform1i(uTx, UNIT);
        const run = (S) => {
          const T = window.WEP.tex[S.po.tex]; if (TX[S.po.tex] && (S.ps.length)) {
            const n = S.rope ? rope(S, 0, T) : spr(S, 0, T);
            if (n) {
              gl.uniform1f(uOb, S.po.ob == null ? 1 : S.po.ob); gl.bindTexture(gl.TEXTURE_2D, TX[S.po.tex]);
              if (S.po.add) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
              gl.bufferData(gl.ARRAY_BUFFER, vbuf.subarray(0, n * 11), gl.STREAM_DRAW); gl.drawArrays(gl.TRIANGLES, 0, n);
            }
          }
          for (const s of S.subs) run(s);
        };
        for (const o of objs) if (lo === undefined || (o.d.z >= lo && o.d.z < hi)) run(o.sys);
        gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.activeTexture(gl.TEXTURE0);
        if (restore) restore();
      };
      return P;
    },
  };
})();

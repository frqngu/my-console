// wegl.js - generic Wallpaper Engine scene runner for the console.
// Runs the wallpaper's own layers, effect shaders and particle systems (converted by convert.py) in WebGL.
(function (root) {
  'use strict';
  const PRE = `
#define mul(x, y) ((y) * (x))
#define frac fract
#define saturate(x) clamp(x, 0.0, 1.0)
#define lerp mix
#define atan2 atan
#define rsqrt inversesqrt
#define CAST2(x) vec2(x)
#define CAST3(x) vec3(x)
#define CAST4(x) vec4(x)
#define CAST3X3(x) mat3(x)
#define texSample2D texture2D
#define texSample2DLod(t, uv, l) texture2D(t, uv)
#define ddx dFdx
#define ddy dFdy
#define fmod(x, y) mod(x, y)
#define sample weSample



`;
  const T = ['float', 'vec2', 'vec3', 'vec4'];
  const OVL = (() => {
    let s = '';
    for (const t of T) {
      s += `${t} wePow(${t} a, ${t} b) { return pow(a, b); }\n`; if (t !== 'float') s += `${t} wePow(${t} a, float b) { return pow(a, ${t}(b)); }\n`;
      s += `${t} weMix(${t} a, ${t} b, ${t} c) { return mix(a, b, c); }\n`; if (t !== 'float') { s += `${t} weMix(${t} a, ${t} b, float c) { return mix(a, b, ${t}(c)); }\n${t} weMix(float a, ${t} b, float c) { return mix(${t}(a), b, ${t}(c)); }\n${t} weMix(${t} a, float b, float c) { return mix(a, ${t}(b), ${t}(c)); }\n`; }
      s += `${t} weMax(${t} a, ${t} b) { return max(a, b); }\n${t} weMin(${t} a, ${t} b) { return min(a, b); }\n`; if (t !== 'float') s += `${t} weMax(${t} a, float b) { return max(a, ${t}(b)); }\n${t} weMin(${t} a, float b) { return min(a, ${t}(b)); }\n${t} weMax(float a, ${t} b) { return max(${t}(a), b); }\n${t} weMin(float a, ${t} b) { return min(${t}(a), b); }\n`;
    }
    s += 'float log10(float x) { return log(x) / 2.302585; }\nvec3 log10(vec3 x) { return log(x) / 2.302585; }\n';
    return s + '#define pow wePow\n#define mix weMix\n#define max weMax\n#define min weMin\n';
  })();
  const VS_PRE = '#version 300 es\nprecision highp float;\n#define attribute in\n#define varying out\n#define texture2D texture\n' + PRE + OVL;
  const FS_PRE = '#version 300 es\nprecision highp float;\nout vec4 weFragColor;\n#define varying in\n#define gl_FragColor weFragColor\n#define texture2D texture\n' + PRE + OVL;

  const IMG_VS = `attribute vec2 p; attribute vec2 uv; varying vec2 v; void main(){ gl_Position = vec4(p, 0.0, 1.0); v = uv; }`;
  const IMG_FS = `precision highp float; varying vec2 v; uniform sampler2D t; uniform vec4 col; void main(){ vec4 c = texture2D(t, v); gl_FragColor = vec4(c.rgb * col.rgb, c.a * col.a); }`;
  const PT_VS = `attribute vec2 p; attribute vec2 uv; attribute vec4 c; varying vec2 v; varying vec4 vc; void main(){ gl_Position = vec4(p, 0.0, 1.0); v = uv; vc = c; }`;
  const PT_FS = `precision highp float; varying vec2 v; varying vec4 vc; uniform sampler2D t; uniform vec2 ef; void main(){ vec4 c = texture2D(t, v); float f = 1.0; if (ef.x > 0.0) f *= smoothstep(0.0, ef.x, v.x) * smoothstep(1.0, 1.0 - ef.x, v.x); if (ef.y > 0.0) f *= smoothstep(0.0, ef.y, v.y) * smoothstep(1.0, 1.0 - ef.y, v.y); gl_FragColor = vec4(c.rgb * vc.rgb, c.a * vc.a * f); }`;
  const BLIT_FS = `precision highp float; varying vec2 v; uniform sampler2D t; void main(){ gl_FragColor = vec4(texture2D(t, v).rgb, 1.0); }`;

  const rad = (d) => d * Math.PI / 180;
  function mul3(a, b) { // 3x3 affine (col-major [a c e; b d f]) as [a,b,c,d,e,f]
    return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  }
  function local(o) { // T * R * S, y up
    const c = Math.cos(o.angles[2]), s = Math.sin(o.angles[2]), sx = o.scale[0], sy = o.scale[1];
    return [c * sx, s * sx, -s * sy, c * sy, o.origin[0], o.origin[1]];
  }
  const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

  function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function WEG(cv, data, opt) {
    opt = opt || {};
    if (!data._pristine) data._pristine = JSON.stringify(data.scene); this.cv = cv; this.B = JSON.parse(data._pristine);   // every start works on its own copy: a wallpaper that was shown before must come back exactly as the first time
    this.B0 = true; this.cv = cv; this.imgs = data.tex; this.opt = opt; this.err = null; this.ok = false;
    const B = this.B, W = B.W, H = B.H;
    const sc = opt.scale || 1;
    this.sw = Math.round(opt.w || W * sc); this.sh = Math.round(opt.h || H * sc);
    cv.width = this.sw; cv.height = this.sh;
    const gl = this.gl = cv.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: !!opt.preserve });
    if (!gl) { this.err = 'no webgl'; return; }
    this.progs = new Map(); this.texs = new Map();
    this.qbuf = gl.createBuffer(); this.dbuf = gl.createBuffer();
    this.rtPool = new Map();
    this.t = 0; this.last = null; this.objs = []; this.logs = [];
    this._load();
  }
  WEG.prototype.log = function (m) { if (this.logs.length < 60) this.logs.push(m); if (this.opt.debug) console.log('weg', m); };

  WEG.prototype._img = function (f) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img ' + f)); i.src = this.imgs[f]; });
  };
  WEG.prototype._tex = function (img, clamp) {
    const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    const big = img.width >= 256 && img.height >= 256;
    if (big) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, big ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const w = clamp ? gl.MIRRORED_REPEAT : gl.REPEAT;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, w); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, w);
    return { t, w: img.width, h: img.height };
  };
  WEG.prototype._rt = function (w, h) {
    const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { t, fb, w, h };
  };

  WEG.BOOST = { wp_xc: 2.0 };
WEG.DROP = { wp_d4: [107] };
  WEG.GATE = { wp_rz: [.55, .62], wp_co: [.45, .50], wp_d1: [.64, .69], wp_d4: [.66, .70], wp_nt: [.60, .65], wp_nf: [.44, .50], wp_ss: [.60, .65], wp_su: [.73, .78], wp_sm: [.62, .68], wp_yh: [.60, .66], wp_xc: [.64, .68], wp_sh: [.30, .34], wp_ms: [.50, .55], wp_sk: [.30, .34], wp_sr: [.60, .65], wp_vl: [.42, .46], wp_bs: [.34, .38] };
  WEG.prototype._load = function () {
    const B = this.B, jobs = [];
    { const DR = WEG.DROP[B.id]; if (DR) for (const o of B.objects) if (DR.indexOf(o.id) >= 0 && o.effects) o.effects = []; }
    // water only: the flow / ripple effects are limited to the water area of each wallpaper (horizon fraction from the top), so clouds, mountains and sky never get dragged around
          { if (WEG.GATE[B.id]) for (const o of B.objects) for (const e of (o.effects || [])) for (const p of e.passes) if (p.c && p.c.noisespeed != null) p.c.noisespeed = 0; }
      { const GT = WEG.GATE[B.id]; if (GT) for (const k in B.shaders) { const sh = B.shaders[k]; if (!sh.fs || sh._gate2) continue; sh._gate2 = 1; const ge = 'smoothstep(' + GT[0].toFixed(3) + ', ' + GT[1].toFixed(3) + ', v_TexCoord.y)';
      if (sh.fs.indexOf('g_FlowAmp') >= 0) { sh._gate = 1; sh.fs = sh.fs.replace(/gl_FragColor\s*=\s*mix\(\s*albedo\s*,\s*flowAlbedo\s*,\s*flowAmount\s*\)\s*;/, 'gl_FragColor = mix(albedo, flowAlbedo, flowAmount * ' + ge + ');'); }
      else if (sh.fs.indexOf('sines') >= 0 && sh.fs.indexOf('texCoordOffset') >= 0) { sh._gate = 1; sh.fs = sh.fs.replace(/gl_FragColor\s*=\s*mix\(\s*texSample2D\(g_Texture0,\s*v_TexCoord\.xy\)\s*,\s*gl_FragColor\s*,\s*mask\s*\)\s*;/, 'gl_FragColor = mix(texSample2D(g_Texture0, v_TexCoord.xy), gl_FragColor, mask * ' + ge + ');'); }
      else if (sh.fs.indexOf('g_Exponent') >= 0 && sh.fs.indexOf('float strength = g_Strength * g_Strength;') >= 0) { sh._gate = 1; sh.fs = sh.fs.replace('float strength = g_Strength * g_Strength;', 'float strength = g_Strength * g_Strength * ' + (WEG.BOOST[B.id] || 1).toFixed(2) + ' * ' + ge + ';'); }
      else if (sh.fs.indexOf('texCoord.xy += normal.xy * g_Strength * g_Strength * mask;') >= 0) { sh._gate = 1; sh.fs = sh.fs.replace('texCoord.xy += normal.xy * g_Strength * g_Strength * mask;', 'texCoord.xy += normal.xy * g_Strength * g_Strength * mask * ' + ge + ';'); }
      if (sh.fs.indexOf('sin(') >= 0) { const m2 = /gl_FragColor\s*=\s*texSample2D\(\s*g_Texture0\s*,\s*([^;]*?)\)\s*;/.exec(sh.fs); if (m2 && m2[1] !== 'v_TexCoord.xy') { sh._gate = 1; sh.fs = sh.fs.replace(m2[0], 'gl_FragColor = mix(texSample2D(g_Texture0, v_TexCoord.xy), texSample2D(g_Texture0, ' + m2[1] + '), ' + ge + ');'); } }
      if (sh.fs.indexOf('void main') >= 0 && sh.fs.indexOf('g_Texture0') >= 0 && sh.fs.indexOf('v_TexCoord') >= 0 && sh.fs.indexOf('g_Time') >= 0 && !sh._gateU) { const e = sh.fs.lastIndexOf('}'); if (e > 0) { sh._gateU = 1; sh.fs = sh.fs.slice(0, e) + '  gl_FragColor = mix(texSample2D(g_Texture0, v_TexCoord.xy), gl_FragColor, ' + ge + ');\n' + sh.fs.slice(e); } } } }
    // smooth sway instead of the two-copy cross-fade flow (which ghosts and smears at the edges)
    for (const k in B.shaders) { const sh = B.shaders[k]; if (!window.WEG_SOFT || !sh.fs || sh._soft || sh.fs.indexOf('g_FlowAmp') < 0) continue; sh._soft = 1;
      const cyc = sh.fs.indexOf('v_Cycles') >= 0 ? 'v_Cycles.x' : 'cycles.x';
      sh.fs = sh.fs.replace(/gl_FragColor\s*=\s*mix\(\s*albedo\s*,\s*flowAlbedo\s*,\s*flowAmount\s*\)\s*;/, 'gl_FragColor = mix(albedo, texSample2D(g_Texture0, v_TexCoord.xy + flowMask * g_FlowAmp * 0.011 * sin(6.2831853 * (' + cyc + ') + flowPhase * 6.2831853)), flowAmount);'); }
    const need = new Set();
    const pset = new Set(); const mir = new Set(); const clampOf = {}; const addTex = (x) => { if (x && x.f) { need.add(x.f); clampOf[x.f] = !!(x.tj && x.tj.clampuvs); } };
    for (const o of B.objects) {
      if (o.t === 'image') { addTex(o.tex); for (const e of o.effects) for (const p of e.passes) p.tex.forEach(addTex); if (o.tex && o.tex.f && o.effects.length) mir.add(o.tex.f); }
      else if (o.t === 'particle') { const walk = (p) => { addTex(p.tex); if (p.tex && p.tex.f) pset.add(p.tex.f); (p.children || []).forEach((c) => walk(c.p)); }; walk(o.p); }
    }
    this.names = {};
    for (const f of need) jobs.push(this._img(f).then((im) => { const tx = this._tex(im, clampOf[f] || mir.has(f)); if (pset.has(f)) { try { const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height; const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, w, h).data; let ex = 0, ey = 0; const al = (x, y) => { const i = (y * w + x) * 4; return d[i + 3] > 24 && Math.max(d[i], d[i + 1], d[i + 2]) > 40 ? 255 : 0; }; for (let x = 0; x < w; x++) if (al(x, 0) > 24 || al(x, h - 1) > 24) ey = 1; for (let y = 0; y < h; y++) if (al(0, y) > 24 || al(w - 1, y) > 24) ex = 1; if (ex || ey) tx.ef = [ex ? .3 : 0, ey ? .35 : 0]; } catch (e) {} } this.texs.set(f, tx); }).catch((e) => this.log('tex ' + f)));
    Promise.all(jobs).then(() => {
      try { this._setup(); this._precompile(() => { this.ok = true; if (this.onready) this.onready(); }); } catch (e) { this.err = String(e && e.stack || e); console.error('weg', this.err); }
    });
  };

  WEG.prototype._prog = function (key, vs, fs) {
    if (this.progs.has(key)) return this.progs.get(key);
    const gl = this.gl;
    const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const e = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error((type === gl.VERTEX_SHADER ? 'vs: ' : 'fs: ') + e); } return s; };
    let o = null;
    try {
      const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, 'a_Position'); gl.bindAttribLocation(p, 1, 'a_TexCoord');
      gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
      o = { p, u: {} };
    } catch (e) { this.log((this.B.shaders[key] ? this.B.shaders[key].name : key) + ' ' + String(e.message).split('\n')[0]); o = null; }
    this.progs.set(key, o); return o;
  };
  // compile + link every effect shader in the background (KHR_parallel_shader_compile) so the picture never stalls on the graphics driver's compiler; the wallpaper starts once all are done
  WEG.prototype._precompile = function (cb) {
    const gl = this.gl, B = this.B, ext = gl.getExtension('KHR_parallel_shader_compile');
    const pend = [];
    for (const key of Object.keys(B.shaders || {})) {
      const sh = B.shaders[key]; if (!sh || this.progs.has(key)) continue;
      try {
        const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
        const vsS = mk(gl.VERTEX_SHADER, VS_PRE + sh.vs), fsS = mk(gl.FRAGMENT_SHADER, FS_PRE + sh.fs);
        const p = gl.createProgram(); gl.attachShader(p, vsS); gl.attachShader(p, fsS);
        gl.bindAttribLocation(p, 0, 'a_Position'); gl.bindAttribLocation(p, 1, 'a_TexCoord'); gl.linkProgram(p);
        pend.push({ key, p, vsS, fsS });
      } catch (e) { this.log('precompile ' + key + ' ' + e); }
    }
    const fin = () => {
      for (const q of pend) {
        let o = null;
        if (gl.getProgramParameter(q.p, gl.LINK_STATUS)) o = { p: q.p, u: {} };
        else { const nm = B.shaders[q.key] ? B.shaders[q.key].name : q.key; const il = (gl.getShaderInfoLog(q.vsS) || '') + (gl.getShaderInfoLog(q.fsS) || '') + (gl.getProgramInfoLog(q.p) || ''); this.log(nm + ' ' + il.split('\n')[0]); }
        this.progs.set(q.key, o);
      }
      cb();
    };
    if (!ext || !pend.length) return fin();
    const t0 = performance.now();
    const poll = () => {
      if (pend.every((q) => gl.getProgramParameter(q.p, ext.COMPLETION_STATUS_KHR)) || performance.now() - t0 > 90000) return fin();
      setTimeout(poll, 40);
    };
    poll();
  };

  WEG.prototype._U = function (pr, n) { if (!(n in pr.u)) pr.u[n] = this.gl.getUniformLocation(pr.p, n); return pr.u[n]; };

  WEG.prototype._setup = function () {
    const gl = this.gl, B = this.B;
    // simple programs
    const simple = (vs, fs, attrs) => { const p = gl.createProgram(); const mk = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; }; gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p); return { p, u: {} }; };
    this.pImg = simple(IMG_VS, IMG_FS, ['p', 'uv']);
    this.pPt = simple(PT_VS, PT_FS, ['p', 'uv', 'c']);
    this.pBlit = simple(IMG_VS, BLIT_FS, ['p', 'uv']);
    // fullscreen quad data for effect passes: pos(x,y,z) uv ; y-flipped copy for FBO targets
    this.quad = new Float32Array([-1, -1, 0, 0, 1, 1, -1, 0, 1, 1, -1, 1, 0, 0, 0, 1, 1, 0, 1, 0]);
    this.quadF = new Float32Array([-1, 1, 0, 0, 1, 1, 1, 0, 1, 1, -1, -1, 0, 0, 0, 1, -1, 0, 1, 0]);
    this.qbufA = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.qbufA); gl.bufferData(gl.ARRAY_BUFFER, this.quad, gl.STATIC_DRAW);
    this.qbufF = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.qbufF); gl.bufferData(gl.ARRAY_BUFFER, this.quadF, gl.STATIC_DRAW);
    // scene target
    this.scene = this._rt(this.sw, this.sh);
    // world matrices
    const byId = new Map(B.objects.map((o) => [o.id, o]));
    const world = (o) => { if (o._w) return o._w; const l = local(o); const par = o.parent != null ? byId.get(o.parent) : null; o._w = par ? mul3(world(par), l) : l; return o._w; };
    for (const o of B.objects) { world(o); }
    // visibility inherits from parents
    const vis = (o) => o.vis && (o.parent == null || !byId.get(o.parent) || vis(byId.get(o.parent)));
    this.objs = B.objects.filter(vis);
    this.byId = byId; this.anims = B.objects.filter((o) => o.anim); this.world = world;
    for (const o of this.anims) { o._base = { origin: o.origin.slice(), scale: o.scale.slice(), angles: o.angles.slice(), alpha: o.alpha, color: o.color && o.color.slice() }; }
    for (const o of this.objs) {
      if (o.t === 'particle') o.sys = this._mkParticles(o);
      if (o.t === 'image') this._prepImage(o);
    }
  };

  WEG.prototype._prepImage = function (o) {
    const ow = Math.max(8, Math.round(o.size[0] * (this.sw / this.B.W) * (Math.abs(o._w[0]) + Math.abs(o._w[1])) ));
    const oh = Math.max(8, Math.round(o.size[1] * (this.sh / this.B.H) * (Math.abs(o._w[3]) + Math.abs(o._w[2])) ));
    // working size of the effect chain: the layer's own pixels, never more than its texture
    const tw = o.tex ? o.tex.w : ow, th = o.tex ? o.tex.h : oh;
    o.fw = Math.min(tw, Math.max(8, ow)); o.fh = Math.min(th, Math.max(8, oh));
    if (o.fullscreen || o.compose) { o.fw = this.sw; o.fh = this.sh; }
    if (o.effects.length) { o.ping = [this._rt(o.fw, o.fh), this._rt(o.fw, o.fh)]; o.named = {}; }
  };

  // ---------------- drawing helpers
  WEG.prototype._bindTarget = function (rt) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, rt ? rt.fb : null);
    gl.viewport(0, 0, rt ? rt.w : this.sw, rt ? rt.h : this.sh);
  };
  WEG.prototype._blend = function (mode) {
    const gl = this.gl;
    if (mode === 'additive') { gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE); }
    else if (mode === 'screen') { gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE); }
    else if (mode === 'multiply') { gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE); }
    else if (mode === 'opaque' || mode === 'none') gl.disable(gl.BLEND);
    else { gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); }
  };

  WEG.prototype._drawImage = function (o, tex, tw, th, w, a, extra) {
    // draw a layer quad (world matrix w) with texture into the scene target
    const gl = this.gl, B = this.B, pr = this.pImg;
    const hw = o.size[0] / 2, hh = o.size[1] / 2;
    const cs = [[-hw, hh, 0, 0], [hw, hh, 1, 0], [-hw, -hh, 0, 1], [hw, -hh, 1, 1]];   // (x, y up, u, v): top row first
    const d = new Float32Array(16);
    cs.forEach((c, i) => { const p = ap(w, c[0], c[1]); d[i * 4] = p[0] / B.W * 2 - 1; d[i * 4 + 1] = -(p[1] / B.H * 2 - 1); d[i * 4 + 2] = c[2]; d[i * 4 + 3] = c[3]; });   // flipped: the scene target keeps v=0 at the top
    gl.useProgram(pr.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dbuf); gl.bufferData(gl.ARRAY_BUFFER, d, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.disableVertexAttribArray(2);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(this._U(pr, 't'), 0);
    const br = o.bright;
    gl.uniform4f(this._U(pr, 'col'), o.color[0] * br, o.color[1] * br, o.color[2] * br, a);
    this._blend(extra || o.blend);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  WEG.prototype._runShader = function (ps, o, inputs, target, pass) {
    // draw one effect pass: inputs = array of {t,w,h} for samplers 0..n
    const gl = this.gl, sh = this.B.shaders[ps.sh];
    if (!sh) return false;
    const key = ps.sh;
    const pr = this._prog(key, VS_PRE + sh.vs, FS_PRE + sh.fs);
    if (!pr) return false;
    gl.useProgram(pr.p);
    if (target) for (let i = 0; i < 8; i++) if (inputs[i] && inputs[i].t === target.t) { this.log('feedback in pass ' + (ps.cmd || '') + ' slot ' + i + ' ' + key); inputs[i] = null; }
    this._bindTarget(target); gl.disable(gl.BLEND);
    gl.bindBuffer(gl.ARRAY_BUFFER, target ? this.qbufF : this.qbufA);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
    gl.disableVertexAttribArray(2);
    // samplers
    for (let i = 0; i < 8; i++) {
      const tx = inputs[i];
      gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tx ? tx.t : this.white());
      const loc = this._U(pr, 'g_Texture' + i); if (loc == null) continue;
      gl.uniform1i(loc, i);
      const rl = this._U(pr, 'g_Texture' + i + 'Resolution');
      if (rl != null) gl.uniform4f(rl, tx ? tx.w : 1, tx ? tx.h : 1, tx ? tx.w : 1, tx ? tx.h : 1);
    }
    let l;
    if ((l = this._U(pr, 'g_ModelViewProjectionMatrix')) != null) gl.uniformMatrix4fv(l, false, this.I4);
    if ((l = this._U(pr, 'g_EffectModelViewProjectionMatrix')) != null) gl.uniformMatrix4fv(l, false, this.I4);
    if ((l = this._U(pr, 'g_EffectTextureProjectionMatrix')) != null) gl.uniformMatrix4fv(l, false, this.I4);
    if ((l = this._U(pr, 'g_EffectTextureProjectionMatrixInverse')) != null) gl.uniformMatrix4fv(l, false, this.I4);
    if ((l = this._U(pr, 'g_Time')) != null) gl.uniform1f(l, this.t);
    if ((l = this._U(pr, 'g_Frametime')) != null) gl.uniform1f(l, this.dt || 0.016);
    if ((l = this._U(pr, 'g_ParallaxPosition')) != null) gl.uniform2f(l, 0.5, 0.5);
    if ((l = this._U(pr, 'g_PointerPosition')) != null) gl.uniform2f(l, 0.5, 0.5);
    if ((l = this._U(pr, 'g_PointerPositionLast')) != null) gl.uniform2f(l, 0.5, 0.5);
    if ((l = this._U(pr, 'g_Screen')) != null) gl.uniform3f(l, this.B.W, this.B.H, this.B.W / this.B.H);
    if ((l = this._U(pr, 'g_TexelSize')) != null) { const t0 = inputs[0]; gl.uniform2f(l, 1 / (t0 ? t0.w : 1), 1 / (t0 ? t0.h : 1)); }
    for (const u of sh.u) {
      if (!u.m) continue;
      const loc = this._U(pr, u.n); if (loc == null) continue;
      let v = ps.c[u.m]; if (v === undefined || v === null) v = u.d; if (v === undefined || v === null) continue;
      const n = u.t === 'float' || u.t === 'int' || u.t === 'bool' ? 1 : +u.t.slice(-1);
      const arr = Array.isArray(v) ? v : [v];
      if (n === 1) gl.uniform1f(loc, arr[0]);
      else { const a = []; for (let i = 0; i < n; i++) a.push(arr[i] !== undefined ? arr[i] : arr[arr.length - 1]); (n === 2 ? gl.uniform2fv : n === 3 ? gl.uniform3fv : gl.uniform4fv).call(gl, loc, a); }
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return true;
  };
  WEG.prototype.I4 = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  WEG.prototype.white = function () {
    if (this._white) return this._white;
    const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return (this._white = t);
  };

  // run an object's effect chain; returns the texture holding the result
  WEG.prototype._effects = function (o, src) {
    let cur = src, flip = 0;
    for (const e of o.effects) {
      if (e.skip) continue;
      const named = e.named || (e.named = {});
      let last = cur;
      for (const ps of e.passes) {
        const inputs = [];
        const texsel = ps.tex || [];
        // bindings by name (previous = running result)
        for (let i = 0; i < 8; i++) {
          const tf = texsel[i];
          if (tf && this.texs.get(tf.f)) inputs[i] = this.texs.get(tf.f);
        }
        inputs[0] = last;
        if (ps.bind) for (const b of ps.bind) inputs[b.index] = b.name === 'previous' ? last : (named[b.name] || last);
        let target;
        if (ps.target) {
          if (!named['__rt_' + ps.target]) { const f = (e.fbos || []).find((x) => x.name === ps.target); const sc = f && f.scale ? f.scale : 1; named['__rt_' + ps.target] = this._rt(Math.max(4, Math.round(o.fw / sc)), Math.max(4, Math.round(o.fh / sc))); }
          target = named['__rt_' + ps.target];
        } else { target = (last === o.ping[0]) ? o.ping[1] : o.ping[0]; }
        const ok = this._runShader(ps, o, inputs, target, ps);
        if (!ok) { continue; }
        if (ps.target) named[ps.target] = target; else last = target;
      }
      cur = last;
    }
    return cur;
  };

  // ---------------- particles
  WEG.prototype._mkParticles = function (o) {
    const P = o.p, J = P.j, io = o.io || {};
    const sys = { o, P, J, rnd: mulberry(o.id * 7919 + 13), parts: [], acc: 0, io, ch: [] };
    const em = (J.emitter && J.emitter[0]) || {};
    sys.em = em; sys.max = Math.max(1, Math.round((J.maxcount || 100) * (io.count || 1)));
    sys.rate = (em.rate || 0) * (io.rate || 1);
    const vec = (v, d) => { if (v == null) return d; if (typeof v === 'object' && v.value != null) v = v.value; if (typeof v === 'number') return [v, v, v]; if (typeof v === 'string') return v.split(' ').map(Number); return v; };
    sys.vec = vec;
    sys.init = J.initializer || []; sys.ops = J.operator || [];
    sys.sizeMul = io.size == null ? 1 : (typeof io.size === 'object' ? io.size.value : io.size);
    sys.alphaMul = io.alpha == null ? 1 : (typeof io.alpha === 'object' ? io.alpha.value : io.alpha);
    sys.speedMul = io.speed == null ? 1 : (typeof io.speed === 'object' ? io.speed.value : io.speed);
    sys.lifeMul = io.lifetime == null ? 1 : (typeof io.lifetime === 'object' ? io.lifetime.value : io.lifetime);
    sys.brMul = io.brightness == null ? 1 : (typeof io.brightness === 'object' ? io.brightness.value : io.brightness);
    sys.colorn = io.colorn ? vec(io.colorn) : null;
    const rend = (J.renderer && J.renderer[0]) || { name: 'sprite' };
    sys.rend = rend;
    sys.cp = (J.controlpoint || []).map((c) => vec(c.offset, [0, 0, 0]));
    sys.t = 0; sys.dtAcc = 0;
    // pre-warm
    const warm = J.starttime || 0;
    for (let s = 0; s < warm; s += 0.05) this._stepP(sys, 0.05);
    sys.children = (P.children || []).map((c) => ({ c, sys: this._mkParticles({ id: o.id + 101, t: 'particle', p: c.p, io: c.io, origin: c.origin, scale: c.scale, angles: c.angles, _w: o._w }) }));
    return sys;
  };
  const rr = (r, a, b) => a + r() * (b - a);
  WEG.prototype._spawn = function (sys) {
    const r = sys.rnd, em = sys.em, vec = sys.vec;
    const pt = { age: 0, vx: 0, vy: 0, x: 0, y: 0, rot: 0, av: 0, size: 20, a: 1, col: [1, 1, 1], life: 1, f: [0, 0, 0], cs: 1 };
    // emitter
    const org = vec(em.origin, [0, 0, 0]), dmax = vec(em.distancemax, [0, 0, 0]), dmin = vec(em.distancemin, [0, 0, 0]);
    const dir = vec(em.directions, [1, 1, 1]);
    if (em.name === 'boxrandom') {
      pt.x = org[0] + rr(r, -dmax[0], dmax[0]); pt.y = org[1] + rr(r, -dmax[1], dmax[1]);
    } else {
      let x, y; do { x = rr(r, -1, 1); y = rr(r, -1, 1); } while (x * x + y * y > 1 || x * x + y * y < 1e-6);
      const len = Math.sqrt(x * x + y * y), rad = rr(r, dmin[0], dmax[0]);
      pt.x = org[0] + x / len * rad * dir[0]; pt.y = org[1] + y / len * rad * dir[1];
    }
    for (const I of sys.init) {
      const n = I.name;
      if (n === 'lifetimerandom') pt.life = rr(r, vec(I.min, [1])[0], vec(I.max, [I.min || 1])[0]) * sys.lifeMul;
      else if (n === 'sizerandom') pt.size = rr(r, vec(I.min, [20])[0], vec(I.max, [I.min || 20])[0]) * sys.sizeMul;
      else if (n === 'alpharandom') pt.a = rr(r, vec(I.min, [1])[0], vec(I.max, [1])[0]);
      else if (n === 'colorrandom') {
        const a = vec(I.min, [255, 255, 255]), b = vec(I.max, a), k = r();
        pt.col = [0, 1, 2].map((i) => (a[i] + (b[i] - a[i]) * k) / 255);
      } else if (n === 'velocityrandom') {
        const a = vec(I.min, [0, 0, 0]), b = vec(I.max, [0, 0, 0]);
        pt.vx = rr(r, a[0], b[0]) * sys.speedMul; pt.vy = rr(r, a[1], b[1]) * sys.speedMul;
      } else if (n === 'rotationrandom') { const a = vec(I.min, [0, 0, 0]), b = vec(I.max, [0, 0, 0]); pt.rot = rr(r, a[2], b[2]); }
      else if (n === 'angularvelocityrandom') { const a = vec(I.min, [0, 0, 0]), b = vec(I.max, [0, 0, 0]); pt.av = rr(r, a[2], b[2]); }
      else if (n === 'turbulentvelocityrandom') {
        const sp = rr(r, I.speedmin == null ? 0 : I.speedmin, I.speedmax == null ? 0 : I.speedmax), an = r() * 6.2832;
        pt.vx += Math.cos(an) * sp * sys.speedMul; pt.vy += Math.sin(an) * sp * sys.speedMul;
      }
    }
    if (sys.colorn) pt.col = [sys.colorn[0], sys.colorn[1], sys.colorn[2]];
    pt.ph = r(); pt.ph2 = r(); pt.px0 = pt.x; pt.py0 = pt.y;
    // per-operator random frequency/scale/phase
    pt.ops = sys.ops.map((op) => ({ fq: rr(r, op.frequencymin == null ? 1 : op.frequencymin, op.frequencymax == null ? (op.frequencymin == null ? 1 : op.frequencymin) : op.frequencymax), sc: rr(r, op.scalemin == null ? 1 : op.scalemin, op.scalemax == null ? (op.scalemin == null ? 1 : op.scalemin) : op.scalemax), ph: rr(r, op.phasemin == null ? 0 : op.phasemin, op.phasemax == null ? 1 : op.phasemax) * 6.2832 }));
    pt.frame = Math.floor(r() * 1000);
    return pt;
  };
  WEG.prototype._stepP = function (sys, dt) {
    if (dt <= 0) return;
    const P = sys.parts, vec = sys.vec;
    sys.t += dt;
    sys.acc += sys.rate * dt;
    while (sys.acc >= 1) { sys.acc -= 1; if (P.length < sys.max) P.push(this._spawn(sys)); }
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.age += dt;
      if (p.age >= p.life) { P[i] = P[P.length - 1]; P.pop(); continue; }
      const f = p.age / p.life;
      p.cur = { a: p.a * sys.alphaMul, size: p.size, col: p.col.slice(), ox: 0, oy: 0 };
      let drag = 0, gx = 0, gy = 0;
      for (let k = 0; k < sys.ops.length; k++) {
        const op = sys.ops[k], o = p.ops[k], n = op.name;
        if (n === 'movement') { const g = vec(op.gravity, [0, 0, 0]); gx += g[0]; gy += g[1]; drag += op.drag || 0; }
        else if (n === 'angularmovement') { p.rot += (p.av || 0) * dt; }
        else if (n === 'alphafade') {
          const fi = op.fadeintime == null ? .5 : op.fadeintime, fo = op.fadeouttime == null ? .5 : op.fadeouttime;
          let m = 1; if (f < fi && fi > 0) m = f / fi; if (f > 1 - fo && fo > 0) m = Math.min(m, (1 - f) / fo);
          p.cur.a *= Math.max(0, Math.min(1, m));
        } else if (n === 'oscillatealpha') {
          const s = Math.sin(p.age * o.fq * 6.2832 + o.ph) * .5 + .5, mn = op.scalemin == null ? 0 : op.scalemin, mx = op.scalemax == null ? 1 : op.scalemax;
          p.cur.a *= mn + (mx - mn) * s;
        } else if (n === 'oscillatesize') {
          const s = Math.sin(p.age * o.fq * 6.2832 + o.ph) * .5 + .5, mn = op.scalemin == null ? .5 : op.scalemin, mx = op.scalemax == null ? 1 : op.scalemax;
          p.cur.size *= mn + (mx - mn) * s;
        } else if (n === 'oscillateposition') {
          const m = vec(op.mask, [1, 1, 0]);
          p.cur.ox += Math.sin(p.age * o.fq * 6.2832 + o.ph) * o.sc * m[0] * (sys.speedMul || 1); p.cur.oy += Math.sin(p.age * o.fq * 6.2832 + o.ph + 1.7) * o.sc * m[1] * (sys.speedMul || 1);
        } else if (n === 'sizechange') {
          const s0 = op.startvalue == null ? 1 : op.startvalue, e0 = op.endvalue == null ? 0 : op.endvalue, ts = op.starttime == null ? 0 : op.starttime, te = op.endtime == null ? 1 : op.endtime;
          const k2 = Math.max(0, Math.min(1, (f - ts) / Math.max(1e-4, te - ts)));
          p.cur.size *= s0 + (e0 - s0) * k2;
        } else if (n === 'alphachange') {
          const s0 = op.startvalue == null ? 1 : op.startvalue, e0 = op.endvalue == null ? 0 : op.endvalue, ts = op.starttime == null ? 0 : op.starttime, te = op.endtime == null ? 1 : op.endtime;
          p.cur.a *= s0 + (e0 - s0) * Math.max(0, Math.min(1, (f - ts) / Math.max(1e-4, te - ts)));
        } else if (n === 'colorchange') {
          const a = vec(op.startvalue, [1, 1, 1]), b = vec(op.endvalue, [1, 1, 1]), ts = op.starttime == null ? 0 : op.starttime, te = op.endtime == null ? 1 : op.endtime, k2 = Math.max(0, Math.min(1, (f - ts) / Math.max(1e-4, te - ts)));
          p.cur.col = [0, 1, 2].map((i) => p.col[i] * (a[i] + (b[i] - a[i]) * k2));
        } else if (n === 'turbulence') {
          const sp = ((op.speedmin || 0) + (op.speedmax || 0)) * .5 * (sys.speedMul || 1), sc = op.scale || 1, tt = sys.t * (op.timescale || 1);
          p.vx += Math.sin((p.py0 * .01 * sc) + tt) * sp * dt * 3; p.vy += Math.cos((p.px0 * .01 * sc) + tt * 1.3) * sp * dt * 3;
        } else if (n === 'vortex') {
          const c = sys.cp[0] || [0, 0, 0]; const dx = p.x - c[0], dy = p.y - c[1], d = Math.sqrt(dx * dx + dy * dy) + 1e-3;
          const sp = (op.speedinner == null ? 0 : op.speedinner) * dt; p.vx += -dy / d * sp; p.vy += dx / d * sp;
        } else if (n === 'controlpointattract') {
          const c = sys.cp[op.controlpoint || 0] || [0, 0, 0]; const dx = c[0] - p.x, dy = c[1] - p.y, d = Math.sqrt(dx * dx + dy * dy) + 1e-3;
          const sc = (op.scale == null ? 1 : op.scale), th = op.threshold == null ? 100 : op.threshold; if (d < th) { p.vx += dx / d * sc * dt; p.vy += dy / d * sc * dt; }
        }
      }
      if (drag) { const k = Math.max(0, 1 - drag * dt); p.vx *= k; p.vy *= k; }
      p.vx += gx * dt; p.vy += gy * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.av || 0) * dt;
    }
  };

  WEG.prototype._drawParticles = function (sys) {
    const gl = this.gl, B = this.B, o = sys.o, P = sys.parts;
    if (!P.length) return;
    const tex = sys.P.tex && this.texs.get(sys.P.tex.f); if (!tex) return;
    const w = o._w;
    const rend = sys.rend, trail = rend.name === 'spritetrail' || rend.name === 'ropetrail';
    const verts = new Float32Array(P.length * 6 * 8);
    let n = 0;
    const sx = Math.hypot(w[0], w[1]);
    const ss = sys.P.tex.tj && sys.P.tex.tj.spritesheetsequences && sys.P.tex.tj.spritesheetsequences[0];
    const mode = sys.P.j.animationmode, smul = sys.P.j.sequencemultiplier || 1;
    let fcols = 1, fw = 1, fh = 1;
    if (ss) { fcols = Math.max(1, Math.floor(tex.w / ss.width + 1e-3)); fw = ss.width / tex.w; fh = ss.height / tex.h; }
    for (const p of P) {
      if (!p.cur) continue;
      const wp = ap(w, p.x + p.cur.ox, p.y + p.cur.oy);
      const half = p.cur.size * sx * .5;
      let hx = half, hy = half, ang = rad(p.rot) + Math.atan2(w[1], w[0]);
      if (trail) {
        const len = (rend.length == null ? 1 : rend.length) * Math.hypot(p.vx, p.vy) * sx; hy = Math.max(half, len * .5); ang = Math.atan2(-p.vx, p.vy) + Math.atan2(w[1], w[0]);
      }
      const cs = Math.cos(ang), sn = Math.sin(ang);
      const col = p.cur.col, br = sys.brMul, a = p.cur.a;
      let u0 = 0, v0 = 0, u1 = 1, v1 = 1;
      if (ss) {
        const nf = ss.frames; let idx = mode === 'randomframe' ? (p.frame % nf) : Math.floor(((p.age / p.life) * smul) * nf) % nf;
        u0 = (idx % fcols) * fw; v0 = Math.floor(idx / fcols) * fh; u1 = u0 + fw; v1 = v0 + fh;
      }
      const C = [[-hx, -hy, u0, v1], [hx, -hy, u1, v1], [hx, hy, u1, v0], [-hx, hy, u0, v0]];
      const V = C.map((c) => { const x = wp[0] + c[0] * cs - c[1] * sn, y = wp[1] + c[0] * sn + c[1] * cs; return [x / B.W * 2 - 1, -(y / B.H * 2 - 1), c[2], c[3]]; });
      for (const idx of [0, 1, 2, 0, 2, 3]) { const v = V[idx]; verts.set([v[0], v[1], v[2], v[3], col[0] * br, col[1] * br, col[2] * br, a], n); n += 8; }
    }
    if (!n) return;
    const pr = this.pPt; gl.useProgram(pr.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dbuf); gl.bufferData(gl.ARRAY_BUFFER, verts.subarray(0, n), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32, 8);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex.t); gl.uniform1i(this._U(pr, 't'), 0);
    const ef = (!ss && tex.ef) || [0, 0]; gl.uniform2f(this._U(pr, 'ef'), ef[0], ef[1]);
    this._blend(sys.P.blend);
    gl.drawArrays(gl.TRIANGLES, 0, n / 8);
    gl.disableVertexAttribArray(2);
  };

  // ---------------- frame
  function sampleCh(ks, f) {
    if (!ks.length) return 0; if (f <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) if (f <= ks[i][0]) { const a = ks[i - 1], b = ks[i]; const u = (f - a[0]) / Math.max(1e-6, b[0] - a[0]); const s = u * u * (3 - 2 * u); return a[1] + (b[1] - a[1]) * (u * .5 + s * .5); }
    return ks[ks.length - 1][1];
  }
  WEG.prototype._animate = function (t) {
    for (const o of this.anims) {
      for (const p in o.anim) {
        const A = o.anim[p]; let f = t * A.fps; const L = A.len || (A.ch[0].length ? A.ch[0][A.ch[0].length - 1][0] : 1);
        if (A.mode === 'loop') f = f % L; else if (A.mode === 'mirror') { const m = f % (2 * L); f = m > L ? 2 * L - m : m; } else f = Math.min(f, L);
        const base = o._base[p];
        if (p === 'alpha') { const v = sampleCh(A.ch[0], f); o.alpha = A.rel ? base + v : v; }
        else { const arr = (base || [0, 0, 0]).slice(); for (let c = 0; c < A.ch.length; c++) { const v = sampleCh(A.ch[c], f); arr[c] = A.rel ? base[c] + v : v; } o[p] = arr; }
      }
    }
    for (const o of this.anims) { if (o.anim.origin || o.anim.scale || o.anim.angles) { for (const q of this.objs) q._w = null; for (const q of this.objs) this.world(q); break; } }
  };
  // a composition layer that only covers part of the screen: its effects run on that part of the picture and only that part is written back
  WEG.prototype._partial = function (o) {
    const B = this.B; if (o.fullscreen || !o.size) return false;
    const m = o._w, sx = Math.hypot(m[0], m[1]), sy = Math.hypot(m[2], m[3]);
    return (o.size[0] * sx < B.W - 2 || o.size[1] * sy < B.H - 2) && Math.abs(m[1]) < 1e-3;
  };
  WEG.prototype._partialDraw = function (o) {
    const gl = this.gl, B = this.B, m = o._w;
    const hw = o.size[0] * Math.hypot(m[0], m[1]) / 2, hh = o.size[1] * Math.hypot(m[2], m[3]) / 2, cx = m[4], cy = m[5];
    const rw = Math.max(8, Math.round(hw * 2 * this.sw / B.W)), rh = Math.max(8, Math.round(hh * 2 * this.sh / B.H));
    if (!o._crt || o._crt.w !== rw || o._crt.h !== rh) o._crt = this._rt(rw, rh);
    const u0 = (cx - hw) / B.W, u1 = (cx + hw) / B.W, vA = (B.H - (cy + hh)) / B.H, vB = (B.H - (cy - hh)) / B.H;
    const d = new Float32Array([-1, 1, 0, u0, vB, 1, 1, 0, u1, vB, -1, -1, 0, u0, vA, 1, -1, 0, u1, vA]);
    this._bindTarget(o._crt); const pr = this.pBlit; gl.useProgram(pr.p); gl.disable(gl.BLEND);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dbuf); gl.bufferData(gl.ARRAY_BUFFER, d, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12); gl.disableVertexAttribArray(2);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.scene.t); gl.uniform1i(this._U(pr, 't'), 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const res = this._effects(o, { t: o._crt.t, w: rw, h: rh });
    this._bindTarget(this.scene);
    const sv = o.color, sb = o.bright; o.color = [1, 1, 1]; o.bright = 1;
    this._drawImage(o, res.t, res.w, res.h, o._w, 1, 'opaque');
    o.color = sv; o.bright = sb;
  };
  WEG.prototype.render = function (tsec) {
    if (!this.ok || this.gl.isContextLost()) return;
    const gl = this.gl, B = this.B;
    const dt = this.last == null ? 0 : Math.min(.1, Math.max(0, tsec - this.last)); this.last = tsec; this.t = tsec; this.dt = dt;
    if (this.anims.length) this._animate(tsec);
    this._bindTarget(this.scene);
    gl.disable(gl.BLEND);
    gl.clearColor(B.clear[0], B.clear[1], B.clear[2], 1); gl.clear(gl.COLOR_BUFFER_BIT);
    for (const o of this.objs) {
      if (o.t === 'image') {
        if (o.fullscreen || o.compose) {
          if (!o.effects.length) continue;
          if (this._partial(o)) { this._partialDraw(o); continue; }
          // everything drawn so far goes through this layer's effects
          const res = this._effects(o, { t: this.scene.t, w: this.scene.w, h: this.scene.h });
          this._bindTarget(this.scene); gl.useProgram(this.pBlit.p);
          // copy result back (never draw into the texture being read)
          this._copyTo(res);
          continue;
        }
        if (!o.tex) continue;
        const src = this.texs.get(o.tex.f); if (!src) continue;
        let tex = src;
        if (o.effects.length) {
          // the layer's own picture goes through its effect chain
          tex = this._effects(o, src);
          this._bindTarget(this.scene);
        }
        this._drawImage(o, tex.t, tex.w, tex.h, o._w, o.alpha);
      } else if (o.t === 'particle') {
        this._stepP(o.sys, dt);
        this._bindTarget(this.scene);
        this._drawParticles(o.sys);
        for (const c of o.sys.children) { this._stepP(c.sys, dt); this._drawParticles(c.sys); }
      }
    }
    // to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.sw, this.sh); gl.disable(gl.BLEND);
    const pr = this.pBlit; gl.useProgram(pr.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.qbufA);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12); gl.disableVertexAttribArray(2);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.scene.t); gl.uniform1i(this._U(pr, 't'), 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  WEG.prototype._copyTo = function (res) {
    const gl = this.gl, pr = this.pBlit; gl.useProgram(pr.p); gl.disable(gl.BLEND);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.qbufF);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12); gl.disableVertexAttribArray(2);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, res.t); gl.uniform1i(this._U(pr, 't'), 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  root.WEG = WEG;
})(typeof window !== 'undefined' ? window : this);

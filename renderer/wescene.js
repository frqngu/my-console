/* wescene.js - tiny Wallpaper Engine scene runner (WebGL1).
 * Runs the real WE effect shaders (foliagesway UV mode, waterflow, waterripple) on a
 * full-scene image layer, plus a CPU snow/dust particle emitter. Shader code below is
 * a straight port of the originals shipped inside the wallpaper packages
 * (texSample2D->texture2D, frac->fract, CAST->vec, mul() folded into clip-space quad).
 */
(function (root) {
  'use strict';
  const QUAD = new Float32Array([-1, 1, 0, 0, 1, 1, 1, 0, -1, -1, 0, 1, 1, -1, 1, 1]); // pos.xy, uv (v=0 at top)

  const COMMON = `
precision highp float;
#define M_PI 3.14159265359
uniform float u_Flip;
vec2 rotateVec2(vec2 v, float r){ vec2 cs = vec2(cos(r), sin(r)); return vec2(v.x*cs.x - v.y*cs.y, v.x*cs.y + v.y*cs.x); }
`;

  const SHADERS = {
    foliagesway: {
      vs: COMMON + `
attribute vec2 a_Position; attribute vec2 a_TexCoord;
uniform vec4 g_Texture0Resolution; uniform float g_Ratio, g_NoiseScale, g_Direction, g_Strength;
varying vec4 v_TexCoord; varying vec4 v_TexCoordNoise; varying vec3 v_Params;
void main(){
  gl_Position = vec4(a_Position.x, a_Position.y * u_Flip, 0.0, 1.0);
  v_TexCoord = vec4(a_TexCoord, a_TexCoord);
  float aspect = g_Texture0Resolution.z / g_Texture0Resolution.w * g_Ratio;
  v_TexCoordNoise.zw = rotateVec2(vec2(1.0/aspect, aspect), g_Direction);
  v_TexCoordNoise.xy = a_TexCoord * g_NoiseScale;
  v_Params.xy = rotateVec2(a_TexCoord, g_Direction);
  v_Params.z = g_Strength * g_Strength * 0.005;
}`,
      fs: COMMON + `
uniform sampler2D g_Texture0, g_Texture1, g_Texture2;
uniform float g_Speed, g_Power, g_Phase, g_Time;
varying vec4 v_TexCoord; varying vec4 v_TexCoordNoise; varying vec3 v_Params;
void main(){
  vec3 noise = texture2D(g_Texture2, v_TexCoordNoise.xy).rgb;
  float amp = v_Params.z * texture2D(g_Texture1, v_TexCoord.zw).r;
  float phase = (noise.g * M_PI * 2.0 + v_Params.x * 10.0 + v_Params.y * 5.0) * g_Phase;
  vec4 sines = vec4(phase) + g_Speed * g_Time * vec4(1.0, -0.16161616, 0.0083333, -0.00019841);
  sines = sin(sines);
  vec4 csines = vec4(0.4 + phase) + g_Speed * g_Time * vec4(-0.5, 0.041666666, -0.0013888889, 0.000024801587);
  csines = sin(csines);
  sines = pow(abs(sines), vec4(g_Power)) * sign(sines);
  csines = pow(abs(csines), vec4(g_Power)) * sign(csines);
  vec2 off;
  off.x = v_TexCoordNoise.z * dot(sines, vec4(amp));
  off.y = v_TexCoordNoise.w * dot(csines, vec4(amp));
  gl_FragColor = texture2D(g_Texture0, off + v_TexCoord.xy);
}`
    },
    waterflow: {
      vs: COMMON + `
attribute vec2 a_Position; attribute vec2 a_TexCoord; varying vec4 v_TexCoord;
void main(){ gl_Position = vec4(a_Position.x, a_Position.y * u_Flip, 0.0, 1.0); v_TexCoord = vec4(a_TexCoord, a_TexCoord); }`,
      fs: COMMON + `
varying vec4 v_TexCoord;
uniform sampler2D g_Texture0, g_Texture1, g_Texture2;
uniform float g_Time, g_FlowSpeed, g_FlowAmp, g_FlowPhaseScale; uniform vec2 g_Gate;
void main(){
  float flowPhase = texture2D(g_Texture2, v_TexCoord.xy * g_FlowPhaseScale).r;
  vec2 flowColors = texture2D(g_Texture1, v_TexCoord.zw).rg;
  vec2 flowMask = (flowColors - vec2(0.498)) * 2.0;
  float flowAmount = length(flowMask);
  vec4 cycles = vec4(fract(g_Time*g_FlowSpeed), fract(g_Time*g_FlowSpeed+0.5), fract(0.25+g_Time*g_FlowSpeed), fract(0.25+g_Time*g_FlowSpeed+0.5));
  float blend = 2.0 * abs(cycles.x - 0.5);
  float blend2 = 2.0 * abs(cycles.z - 0.5);
  cycles = cycles - vec4(0.5);
  vec4 fo  = vec4(flowMask.xyxy * g_FlowAmp * 0.1) * cycles.xxyy;
  vec4 fo2 = vec4(flowMask.xyxy * g_FlowAmp * 0.1) * cycles.zzww;
  vec4 albedo = texture2D(g_Texture0, v_TexCoord.xy);
  vec4 fa  = mix(texture2D(g_Texture0, v_TexCoord.xy + fo.xy),  texture2D(g_Texture0, v_TexCoord.xy + fo.zw),  blend);
  vec4 fa2 = mix(texture2D(g_Texture0, v_TexCoord.xy + fo2.xy), texture2D(g_Texture0, v_TexCoord.xy + fo2.zw), blend2);
  fa = mix(fa, fa2, smoothstep(0.2, 0.8, flowPhase));
  gl_FragColor = mix(albedo, fa, flowAmount * (g_Gate.x < 0.0 ? 1.0 : smoothstep(g_Gate.x, g_Gate.y, v_TexCoord.y)));
}`
    },
    waterripple: {
      vs: COMMON + `
attribute vec2 a_Position; attribute vec2 a_TexCoord;
uniform vec4 g_Texture0Resolution; uniform float g_Time, g_AnimationSpeed, g_Scale, g_ScrollSpeed, g_Direction, g_Ratio;
varying vec4 v_TexCoord; varying vec4 v_TexCoordRipple;
void main(){
  gl_Position = vec4(a_Position.x, a_Position.y * u_Flip, 0.0, 1.0);
  v_TexCoord = vec4(a_TexCoord, a_TexCoord);
  vec2 c1 = a_TexCoord, c2 = a_TexCoord * 1.333;
  vec2 scroll = rotateVec2(vec2(0.0, 1.0), g_Direction) * g_ScrollSpeed * g_ScrollSpeed * g_Time;
  v_TexCoordRipple.xy = c1 + g_Time * g_AnimationSpeed * g_AnimationSpeed + scroll;
  v_TexCoordRipple.zw = c2 - g_Time * g_AnimationSpeed * g_AnimationSpeed + scroll;
  v_TexCoordRipple *= g_Scale;
  float adj = g_Texture0Resolution.x / g_Texture0Resolution.y;
  v_TexCoordRipple.xz *= adj;
  v_TexCoordRipple.yw *= g_Ratio;
}`,
      fs: COMMON + `
varying vec4 v_TexCoord; varying vec4 v_TexCoordRipple;
uniform sampler2D g_Texture0, g_Texture1, g_Texture2;
uniform float g_Strength;
void main(){
  vec2 texCoord = v_TexCoord.xy;
  float mask = texture2D(g_Texture1, v_TexCoord.zw).r;
  vec3 n1 = texture2D(g_Texture2, v_TexCoordRipple.xy).xyz * 2.0 - 1.0;
  vec3 n2 = texture2D(g_Texture2, v_TexCoordRipple.zw).xyz * 2.0 - 1.0;
  vec3 normal = normalize(vec3(n1.xy + n2.xy, n1.z));
  texCoord += normal.xy * g_Strength * g_Strength * mask;
  gl_FragColor = texture2D(g_Texture0, texCoord);
}`
    },
    blit: {
      vs: COMMON + `attribute vec2 a_Position; attribute vec2 a_TexCoord; varying vec2 v_Uv;
void main(){ gl_Position = vec4(a_Position.x, a_Position.y * u_Flip, 0.0, 1.0); v_Uv = a_TexCoord; }`,
      fs: COMMON + `varying vec2 v_Uv; uniform sampler2D g_Texture0; void main(){ gl_FragColor = texture2D(g_Texture0, v_Uv); }`
    }
  };

  // uniform name map from scene.json constantshadervalues -> GLSL uniforms
  const UMAP = {
    foliagesway: { speeduv: 'g_Speed', power: 'g_Power', phase: 'g_Phase', ratio: 'g_Ratio', scale: 'g_NoiseScale', scrolldirection: 'g_Direction', strength: 'g_Strength' },
    waterflow: { speed: 'g_FlowSpeed', strength: 'g_FlowAmp', phasescale: 'g_FlowPhaseScale' },
    waterripple: { animationspeed: 'g_AnimationSpeed', ratio: 'g_Ratio', ripplestrength: 'g_Strength', scale: 'g_Scale', scrolldirection: 'g_Direction', scrollspeed: 'g_ScrollSpeed' }
  };

  const PART_VS = `attribute vec3 a_P; // x,y,size
attribute float a_A; uniform vec2 u_Res; varying float v_A;
void main(){ gl_Position = vec4(a_P.x / u_Res.x * 2.0 - 1.0, 1.0 - a_P.y / u_Res.y * 2.0, 0.0, 1.0); gl_PointSize = a_P.z; v_A = a_A; }`;
  const PART_FS = `precision mediump float; varying float v_A;
void main(){ vec2 d = gl_PointCoord - vec2(0.5); float r = length(d) * 2.0; float a = 1.0 - smoothstep(0.35, 1.0, r); gl_FragColor = vec4(vec3(1.0), 1.0) * a * v_A; }`;

  function rr(a, b) { return a + Math.random() * (b - a); }

  function WEScene(canvas, cfg) {
    this.cv = canvas; this.cfg = cfg; this.ok = false; this.t0 = performance.now(); this.t = 0;
    const gl = this.gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
    if (!gl) { this.err = 'no webgl'; return; }
    this.progs = {};
    this.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buf); gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
    const W = this.W = cfg.fbw || 1920, H = this.H = cfg.fbh || 1080;
    canvas.width = W; canvas.height = H;
    this.fbs = [0, 1].map(() => this._fb(W, H));
    this._load();
  }

  WEScene.prototype._prog = function (name, vs, fs) {
    const gl = this.gl; if (this.progs[name]) return this.progs[name];
    const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(name + ': ' + gl.getShaderInfoLog(sh)); return sh; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(name + ' link: ' + gl.getProgramInfoLog(p));
    const o = { p, u: {} }; return (this.progs[name] = o);
  };
  WEScene.prototype._u = function (pr, n) { if (!(n in pr.u)) pr.u[n] = this.gl.getUniformLocation(pr.p, n); return pr.u[n]; };

  WEScene.prototype._fb = function (w, h) {
    const gl = this.gl, tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fb };
  };

  WEScene.prototype._img = function (url) {
    url = (this.cfg.data && this.cfg.data[url]) || ((this.cfg.dir || '') + url);   // packaged app: textures come as data: URIs (file paths are refused by WebGL)
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img ' + url)); i.src = url; });
  };
  WEScene.prototype._tex = function (img, repeat) {
    const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const w = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, w); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, w);
    return { tex: t, w: img.width, h: img.height };
  };

  WEScene.prototype._load = function () {
    const cfg = this.cfg;
    const jobs = [this._img(cfg.base).then(i => (this.base = this._tex(i, false)))];
    this.passes = [];
    cfg.effects.forEach((e) => {
      const p = { type: e.type, params: e.params, tex: [] };
      this.passes.push(p);
      (e.textures || []).forEach((t, k) => { jobs.push(this._img(t.file).then(i => { p.tex[k] = this._tex(i, !!t.repeat); })); });
    });
    this.err = null;
    Promise.all(jobs).then(() => {
      try {
        for (const k of Object.keys(SHADERS)) this._prog(k, SHADERS[k].vs, SHADERS[k].fs);
        this._prog('part', PART_VS, PART_FS);
        this.partBuf = this.gl.createBuffer(); this.partA = this.gl.createBuffer();
        this._initParticles();
        this.ok = true;
        if (this.onready) this.onready();
      } catch (e) { this.err = String(e.message || e); console.error('wescene', this.err); }
    }).catch((e) => { this.err = String(e.message || e); console.error('wescene', this.err); });
  };

  // --- snow / dust emitter (port of snowperspective: sphererandom emitter, velocity, oscillateposition, alphafade)
  WEScene.prototype._initParticles = function () {
    const c = this.cfg.particles; this.parts = [];
    if (!c) return;
    this.pc = c; this.pacc = 0; this.pN = 0;
    const warm = c.prewarm || 15;
    for (let s = 0; s < warm; s += 0.1) this._stepParticles(0.1, true);
  };
  WEScene.prototype._spawn = function () {
    const c = this.pc, sp = c.speed || 1, sz = c.size || 1;
    const life = rr(c.life[0], c.life[1]);
    // sphererandom: random point in a sphere, stretched by directions
    let x, y; do { x = rr(-1, 1); y = rr(-1, 1); } while (x * x + y * y > 1);
    const o = c.origin;
    this.parts.push({ x0: o[0] + x * c.spread[0], y0: o[1] + y * c.spread[1], age: 0, life, vx: rr(c.vx[0], c.vx[1]) * sp, vy: rr(c.vy[0], c.vy[1]) * sp,
      size: rr(c.sizeRange[0], c.sizeRange[1]) * sz, ph: rr(0, 1), ph2: rr(0, 1), fr: rr(.8, 1) * sp, sc: rr(c.osc[0], c.osc[1]), br: rr(c.bright[0], c.bright[1]), px: 0, py: 0 });
  };
  WEScene.prototype._stepParticles = function (dt, quiet) {
    const c = this.pc; if (!c) return;
    this.pacc += c.rate * dt;
    while (this.pacc >= 1 && this.parts.length < c.max) { this.pacc -= 1; this._spawn(); }
    if (this.pacc > 1) this.pacc = 0;
    const P = this.parts;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.age += dt; if (p.age >= p.life) { P[i] = P[P.length - 1]; P.pop(); continue; }
      const t = p.age;
      const ox = Math.sin((p.ph + t * p.fr) * Math.PI * 2) * p.sc, oy = Math.sin((p.ph2 + t * p.fr) * Math.PI * 2) * p.sc * .5;
      p.px = p.x0 + p.vx * t + ox; p.py = p.y0 + p.vy * t + oy; // scene px, y-up
    }
  };
  WEScene.prototype._drawParticles = function () {
    const gl = this.gl, P = this.parts, c = this.pc; if (!c || !P.length) return;
    const SW = this.cfg.sceneW || 3840, SH = this.cfg.sceneH || 2160, sc = this.W / SW;
    const d = new Float32Array(P.length * 3), a = new Float32Array(P.length);
    for (let i = 0; i < P.length; i++) {
      const p = P[i], f = p.age / p.life;
      d[i * 3] = p.px * sc; d[i * 3 + 1] = (SH - p.py) * sc; d[i * 3 + 2] = Math.max(1.5, p.size * sc);   // sprite edge length in scene px
      const fi = Math.min(1, f / .1), fo = Math.min(1, (1 - f) / .3);
      a[i] = fi * fo * p.br * c.alpha;
    }
    const pr = this.progs.part; gl.useProgram(pr.p);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.uniform2f(this._u(pr, 'u_Res'), this.W, this.H);
    const lp = gl.getAttribLocation(pr.p, 'a_P'), la = gl.getAttribLocation(pr.p, 'a_A');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.partBuf); gl.bufferData(gl.ARRAY_BUFFER, d, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.partA); gl.bufferData(gl.ARRAY_BUFFER, a, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(la); gl.vertexAttribPointer(la, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, P.length);
    gl.disableVertexAttribArray(lp); gl.disableVertexAttribArray(la); gl.disable(gl.BLEND);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
  };

  WEScene.prototype._quad = function (pr) {
    const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    const lp = gl.getAttribLocation(pr.p, 'a_Position'), lt = gl.getAttribLocation(pr.p, 'a_TexCoord');
    gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(lt); gl.vertexAttribPointer(lt, 2, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(lp); gl.disableVertexAttribArray(lt);
  };
  WEScene.prototype._bind = function (unit, tex) { const gl = this.gl; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); };


  // change the working resolution (used to step down on slower graphics cards)
  WEScene.prototype.resize = function (w, h) {
    const gl = this.gl; for (const f of this.fbs) { gl.deleteTexture(f.tex); gl.deleteFramebuffer(f.fb); }
    this.W = w; this.H = h; this.cv.width = w; this.cv.height = h; this.fbs = [0, 1].map(() => this._fb(w, h));
  };

  WEScene.prototype.frame = function (now) { this.render((now - this.t0) / 1000); };
  WEScene.prototype.render = function (tsec) {
    if (!this.ok || this.gl.isContextLost()) return;
    const gl = this.gl, dt = Math.min(.1, this._last != null ? Math.max(0, tsec - this._last) : 0); this._last = tsec;
    this.t = tsec + (this.cfg.timeOffset || 0);
    this._stepParticles(dt);
    gl.disable(gl.BLEND); gl.viewport(0, 0, this.W, this.H);
    let src = this.base.tex, cur = 0;
    const baseRes = [this.base.w, this.base.h, this.base.w, this.base.h];
    for (const p of this.passes) {
      const pr = this.progs[p.type]; gl.useProgram(pr.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbs[cur].fb);
      this._bind(0, src); gl.uniform1i(this._u(pr, 'g_Texture0'), 0);
      p.tex.forEach((t, k) => { this._bind(k + 1, t.tex); gl.uniform1i(this._u(pr, 'g_Texture' + (k + 1)), k + 1); });
      gl.uniform1f(this._u(pr, 'u_Flip'), -1);
      gl.uniform1f(this._u(pr, 'g_Time'), this.t);
      const l = this._u(pr, 'g_Texture0Resolution'); if (l) gl.uniform4f(l, baseRes[0], baseRes[1], baseRes[2], baseRes[3]);
      if (p.type === 'waterflow') { const gu = this._u(pr, 'g_Gate'), gg = this.cfg.gate || [-1, -1]; if (gu) gl.uniform2f(gu, gg[0], gg[1]); }
      const map = UMAP[p.type];
      for (const k of Object.keys(p.params)) if (map[k]) { const u = this._u(pr, map[k]); if (u) gl.uniform1f(u, p.params[k]); }
      this._quad(pr);
      src = this.fbs[cur].tex; cur ^= 1;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const pb = this.progs.blit; gl.useProgram(pb.p); gl.uniform1f(this._u(pb, 'u_Flip'), 1); this._bind(0, src); gl.uniform1i(this._u(pb, 'g_Texture0'), 0); this._quad(pb);
    this._drawParticles();
  };

  WEScene.prototype.start = function () {
    const loop = (now) => { if (this.stopped) return; this.frame(now); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  };
  WEScene.prototype.stop = function () { this.stopped = true; cancelAnimationFrame(this.raf); };

  root.WEScene = WEScene;
})(typeof window !== 'undefined' ? window : this);

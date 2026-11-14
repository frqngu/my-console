/* Sounds and ambient music, all made live with the Web Audio API (nothing to download, nothing copyrighted). */
const SND = (() => {
  let ctx = null, master = null, sfxBus = null, musBus = null, reverb = null, started = false;
  const st = { muted: false, hush: false, hold: true, sfx: true, music: true, musicVol: 0.3, sfxVol: 0.7, quiet: 0, spot: false, last: {} };
  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = st.sfxVol * 0.8; sfxBus.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = 0; musBus.connect(master);
    // a soft room: noise that fades away, used as reverb for the music
    const len = Math.floor(ctx.sampleRate * 6), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); let y = 0; for (let i = 0; i < len; i++) { const t = i / len, k = 0.55 * Math.pow(1 - t, 1.6) + 0.04; y += ((Math.random() * 2 - 1) - y) * k; d[i] = y * Math.pow(1 - t, 2.2) * (i < 900 ? i / 900 : 1) * 1.6; } }
    reverb = ctx.createConvolver(); reverb.buffer = buf; const rg = ctx.createGain(); rg.gain.value = 0.7; reverb.connect(rg); rg.connect(musBus);
    return ctx;
  }
  const t0 = () => ctx.currentTime;
  let sfxRev = null;
  function room() {
    if (sfxRev) return sfxRev;
    const len = Math.floor(ctx.sampleRate * 1.1), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    sfxRev = ctx.createConvolver(); sfxRev.buffer = buf; const g = ctx.createGain(); g.gain.value = 0.5; sfxRev.connect(g); g.connect(sfxBus); return sfxRev;
  }
  // a soft, round note: sine with a gentle attack, low-passed, with a little room around it
  function tone(f, dur, o = {}) {
    if (!st.sfx || !init()) return;
    const t = t0() + (o.at || 0), osc = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t); if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur * 0.9);
    lp.type = 'lowpass'; lp.frequency.value = o.lp || 2200; lp.Q.value = 0.3;
    const v = o.v || 0.16, a = o.a || 0.006;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(lp); lp.connect(g); g.connect(sfxBus); if (o.wet) { const w = ctx.createGain(); w.gain.value = o.wet; g.connect(w); w.connect(room()); }
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function whoosh(dur, from, to, v = 0.08) {
    if (!st.sfx || !init()) return;
    const t = t0(), n = ctx.createBufferSource(), b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(sfxBus); n.start(t);
  }
  const SOUNDS = {
    move: () => tone(700, 0.07, { v: 0.1, lp: 1300, to: 560, wet: 0.2 }),
    tab: () => { tone(620, 0.09, { v: 0.09, lp: 1500, wet: 0.25 }); tone(830, 0.12, { v: 0.08, lp: 1700, at: 0.045, wet: 0.3 }); },
    select: () => { tone(440, 0.2, { v: 0.15, lp: 1800, to: 520, wet: 0.35 }); tone(660, 0.26, { v: 0.1, lp: 2000, at: 0.03, wet: 0.4 }); },
    back: () => { tone(520, 0.18, { v: 0.13, lp: 1500, to: 380, wet: 0.35 }); tone(390, 0.22, { v: 0.08, lp: 1400, at: 0.04, wet: 0.35 }); },
    open: () => { whoosh(0.4, 400, 2600, 0.07); tone(392, 0.4, { v: 0.1, lp: 1800, to: 523, wet: 0.5, a: 0.05 }); tone(587, 0.45, { v: 0.07, lp: 1800, at: 0.05, wet: 0.5, a: 0.06 }); },
    close: () => { whoosh(0.32, 2400, 360, 0.06); tone(523, 0.3, { v: 0.09, lp: 1700, to: 392, wet: 0.5 }); },
    on: () => { tone(494, 0.14, { v: 0.12, lp: 1800, wet: 0.35 }); tone(740, 0.2, { v: 0.1, lp: 2000, at: 0.06, wet: 0.4 }); },
    off: () => { tone(740, 0.14, { v: 0.1, lp: 1800, wet: 0.35 }); tone(494, 0.2, { v: 0.1, lp: 1800, at: 0.06, wet: 0.4 }); },
    denied: () => { tone(220, 0.16, { v: 0.1, lp: 800, wet: 0.2 }); tone(196, 0.2, { v: 0.09, lp: 800, at: 0.1, wet: 0.2 }); },
    launch: () => { [262, 330, 392, 523].forEach((f, i) => tone(f, 0.9, { v: 0.09, lp: 1800, at: i * 0.09, wet: 0.6, a: 0.04 })); whoosh(0.9, 250, 2400, 0.06); },
    startup: () => { [196, 247, 294, 392, 494].forEach((f, i) => tone(f, 2.2, { v: 0.07, lp: 1600, at: i * 0.14, wet: 0.7, a: 0.12 })); whoosh(1.6, 200, 2200, 0.05); },
    page: () => whoosh(0.3, 500, 1600, 0.05),
    home: () => { whoosh(0.5, 400, 1800, 0.022); [[392, 0], [523, 0.07], [659, 0.14], [784, 0.21]].forEach(([f, at], k) => { tone(f, 1.6 - k * 0.2, { v: 0.05 - k * 0.006, lp: 2400, at, a: 0.02, wet: 0.85 }); tone(f * 2, 0.9, { v: 0.012, lp: 3200, at: at + 0.01, a: 0.01, wet: 0.9 }); }); tone(196, 1.4, { v: 0.05, lp: 700, a: 0.08, wet: 0.7 }); },   // the Xbox button: a soft, rising bell-like chime over a warm low note
  };
  function play(name, vol) {
    if (st.muted) return;
    if (vol == null && performance.now() < (st.soft || 0)) vol = 0.22;   // just back from a game: the first sounds are soft so they never startle you over the game's own audio
    if (vol != null && vol < 1 && sfxBus && ctx) { const g = sfxBus.gain, base = st.sfxVol * 0.8; try { g.cancelScheduledValues(ctx.currentTime); g.setValueAtTime(base * vol, ctx.currentTime); setTimeout(() => { try { g.setValueAtTime(st.sfxVol * 0.8, ctx.currentTime); } catch {} }, 1100); } catch {} }
    if (!st.sfx || !SOUNDS[name]) return;
    const now = performance.now(); if (now < st.quiet && name === 'move') return;
    if (st.last[name] && now - st.last[name] < (name === 'move' ? 55 : 30)) return; st.last[name] = now;
    try { init(); if (ctx.state === 'suspended') ctx.resume(); SOUNDS[name](); } catch (e) { /* no sound device */ }
  }
  // ambient music, v790: every wallpaper has its own generative score (key, mode, chords, instrument, and the sounds of that place).
  // Everything is made live with Web Audio. A scene fades in over the old one when the wallpaper changes.
  const MF = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const MODES = { major: [0, 2, 4, 5, 7, 9, 11], lyd: [0, 2, 4, 6, 7, 9, 11], mix: [0, 2, 4, 5, 7, 9, 10], dor: [0, 2, 3, 5, 7, 9, 10], min: [0, 2, 3, 5, 7, 8, 10], phr: [0, 1, 3, 5, 7, 8, 10], hira: [0, 2, 3, 7, 8], pent: [0, 2, 4, 7, 9], hmin: [0, 2, 3, 5, 7, 8, 11], whole: [0, 2, 4, 6, 8, 10], mpent: [0, 3, 5, 7, 10], insen: [0, 1, 5, 7, 10], loc: [0, 1, 3, 5, 6, 8, 10] };
  // r = root note (midi), m = mode, prog = chord roots (scale degrees), pt = pad waves, plp/plv/atk = pad brightness, level and attack, voice = the "key" instrument,
  // every = seconds between phrases, nn = notes per phrase, gap = seconds between notes, arp = play the notes as a quick run, wind = [filter Hz, Q, level], lay = sounds of the place
  const D = { pt: ['sine', 'triangle'], plp: 900, plv: .03, atk: 5, every: [8, 13], nn: [2, 4], gap: [.7, 1.3], wind: [380, .8, .01], ed: .7, efb: .4, cp: 26 };
  const Z = (o) => Object.assign({}, D, o);
  const SCENES = {
    winter:     Z({ r: 50, m: 'lyd',   prog: [0, 4, 5, 3], plp: 900, plv: .032, voice: 'bell',    every: [11, 18], nn: [1, 3], gap: [1.3, 2.4], wind: [520, .8, .02],  lay: ['ice'], ed: .85, efb: .42 }),
    coast:      Z({ r: 55, m: 'pent',  prog: [0, 2, 3, 1], plp: 1300, atk: 4, voice: 'marimba', every: [7, 12], nn: [2, 4], gap: [.5, .9], wind: [380, .7, .008], lay: ['waves', 'gulls'], ed: .38, efb: .3 }),
    sunrise:    Z({ r: 57, m: 'mix',   prog: [0, 6, 3, 0], plp: 1500, atk: 4, voice: 'harp',    every: [8, 14], nn: [2, 4], gap: [.6, 1.1], wind: [420, .7, .008], lay: ['birds'], ed: .5, efb: .32 }),
    bluehour:   Z({ r: 54, m: 'min',   prog: [0, 5, 2, 6], pt: ['sawtooth', 'triangle'], plp: 800, plv: .018, atk: 4.5, voice: 'epiano', every: [7, 11], nn: [4, 6], gap: [.32, .34], arp: 1, wind: [300, .8, .006], lay: ['crickets'], ed: .45, efb: .45 }),
    pineforest: Z({ r: 52, m: 'dor',   prog: [0, 3, 6, 4], pt: ['triangle', 'sine'], plp: 700, plv: .034, voice: 'flute', every: [10, 16], nn: [2, 3], gap: [1.6, 2.6], wind: [350, .9, .02], lay: ['owl'], ed: .8, efb: .4 }),
    natwinter:  Z({ r: 47, m: 'mpent', prog: [0, 3, 4, 3], pt: ['triangle', 'sine'], plp: 1000, atk: 4, voice: 'pluck', every: [8, 13], nn: [2, 4], gap: [.7, 1.2], wind: [460, .8, .022], lay: ['ice', 'wind'], ed: .6, efb: .35 }),
    mystic:     Z({ r: 38, m: 'phr',   prog: [0, 1, 0, 6], pt: ['sawtooth', 'sine'], plp: 380, atk: 6, voice: 'bowl', every: [16, 26], nn: [1, 2], gap: [2.5, 4], wind: [260, 1.1, .018], lay: ['hum'], ed: 1.1, efb: .5 }),
    japan:      Z({ r: 50, m: 'hira',  prog: [0, 2, 4, 2], plp: 800, plv: .028, voice: 'koto', every: [8, 13], nn: [3, 5], gap: [.55, 1.1], wind: [500, .8, .01], lay: ['bell'], ed: .55, efb: .38 }),
    arctic:     Z({ r: 52, m: 'lyd',   prog: [0, 2, 4, 1], pt: ['sine', 'sine'], plp: 1400, atk: 6, voice: 'chime', every: [9, 15], nn: [2, 3], gap: [1, 1.8], wind: [900, .7, .012], lay: ['shimmer'], ed: .9, efb: .5 }),
    autumncity: Z({ r: 48, m: 'dor',   prog: [1, 4, 0, 3], pt: ['triangle', 'sine'], atk: 3.5, voice: 'vibes', every: [7, 11], nn: [3, 5], gap: [.45, .9], sev: 1, wind: [300, .8, .004], lay: ['rain', 'city'], ed: .42, efb: .3 }),
    cave:       Z({ r: 43, m: 'min',   prog: [0, 5, 3, 4], pt: ['sine', 'sine'], plp: 420, plv: .034, atk: 6, voice: 'glass', every: [14, 22], nn: [1, 2], gap: [2, 3.5], wind: [240, 1, .012], lay: ['drip'], ed: 1.3, efb: .55 }),
    snowcity:   Z({ r: 53, m: 'major', prog: [0, 5, 3, 4], plp: 1100, atk: 4, voice: 'music', every: [6, 10], nn: [3, 5], gap: [.5, .9], wind: [420, .8, .01], lay: ['bell', 'fire'], ed: .5, efb: .35 }),
    snowrise:   Z({ r: 46, m: 'lyd',   prog: [0, 5, 4, 2], pt: ['sawtooth', 'triangle'], plp: 720, plv: .02, atk: 7, voice: 'cello', every: [9, 14], nn: [2, 3], gap: [1.1, 1.8], wind: [480, .8, .014], lay: ['birds', 'leaves'], ed: .6, efb: .35 }),
    sunsetmt:   Z({ r: 43, m: 'mix',   prog: [0, 4, 3, 0], pt: ['sawtooth', 'sawtooth'], plp: 520, plv: .016, atk: 7, voice: 'horn', every: [14, 22], nn: [1, 2], gap: [2.2, 3.4], wind: [330, .8, .018], lay: [], ed: .9, efb: .42 }),
    nightlake:  Z({ r: 60, m: 'min',   prog: [0, 3, 5, 2], voice: 'harp', wind: [280, .8, .008], lay: ['crickets', 'waves', 'owl'], ed: .75, efb: .45 }),
    snowmtn:    Z({ r: 48, m: 'lyd',   prog: [0, 4, 0, 5], pt: ['sine', 'sine'], plp: 700, atk: 6, voice: 'organ', every: [13, 20], nn: [1, 2], gap: [2, 3.5], wind: [620, .8, .018], lay: ['shimmer', 'wind'], ed: 1, efb: .5 }),
    icyforest:  Z({ r: 59, m: 'pent',  prog: [0, 5, 3, 4], plp: 1500, plv: .026, voice: 'kalimba', every: [7, 12], nn: [2, 4], gap: [.5, 1.1], wind: [700, .8, .014], lay: ['leaves', 'chimes'], ed: .7, efb: .45 }),
    meteors:    Z({ r: 60, m: 'whole', prog: [0, 2, 4, 1], plp: 1250, atk: 4.5, voice: 'glass', every: [7, 12], nn: [3, 5], gap: [.55, 1], wind: [360, .8, .008], lay: ['crickets', 'chimes'], ed: .6, efb: .4 }),
    garden:     Z({ r: 56, m: 'hira',  prog: [0, 3, 4, 2], voice: 'zither', every: [9, 15], nn: [3, 4], gap: [.7, 1.2], wind: [440, .8, .01], lay: ['drip', 'frogs'], ed: .65, efb: .4 }),
    midaur:     Z({ r: 55, m: 'hmin',  prog: [0, 3, 5, 2], pt: ['sine', 'sine'], plp: 1200, atk: 6, voice: 'celesta', every: [9, 15], nn: [2, 4], gap: [.9, 1.6], wind: [700, .8, .012], lay: ['shimmer', 'waves'], ed: .85, efb: .48 }),
    abandoned:  Z({ r: 41, m: 'loc',   prog: [0, 1, 4, 3], pt: ['sawtooth', 'triangle'], plp: 600, plv: .022, atk: 4, voice: 'synth', every: [7, 12], nn: [2, 5], gap: [.4, .8], wind: [260, 1, .01], lay: ['city', 'buzz', 'drip'], ed: .55, efb: .5 }),
    riozinho:   Z({ r: 49, m: 'insen', prog: [0, 2, 3, 1], pt: ['triangle', 'sine'], plp: 700, atk: 5, voice: 'shaku', every: [11, 18], nn: [2, 3], gap: [1.3, 2.2], wind: [300, .9, .012], lay: ['stream', 'owl', 'frogs'], ed: .8, efb: .4 }),
    dreamview1: Z({ r: 60, m: 'major', prog: [0, 3, 4, 5], plp: 1300, voice: 'kalimba', every: [8, 13], nn: [3, 4], gap: [.6, 1], wind: [340, .8, .008], lay: ['waves', 'birds'], ed: .6, efb: .38 }),
    dreamview2: Z({ r: 62, m: 'lyd',   prog: [0, 1, 4, 2], pt: ['sine', 'sine'], plp: 1600, atk: 6, voice: 'glass', every: [8, 14], nn: [2, 4], gap: [.8, 1.5], wind: [800, .8, .014], lay: ['ice', 'wind', 'shimmer'], ed: .95, efb: .5 }),
    dreamview3: Z({ r: 40, m: 'hmin',  prog: [0, 5, 1, 4], pt: ['sawtooth', 'triangle'], plp: 500, plv: .024, atk: 6, voice: 'cello', every: [10, 16], nn: [1, 3], gap: [1.4, 2.6], wind: [260, 1, .016], lay: ['fall', 'wind'], ed: 1, efb: .45 }),
    dreamview4: Z({ r: 65, m: 'mix',   prog: [0, 4, 2, 5], plp: 1700, plv: .026, atk: 4, voice: 'zither', every: [8, 12], nn: [2, 4], gap: [.5, 1], wind: [560, .7, .01], lay: ['leaves', 'birds', 'wind'], ed: .5, efb: .35 }),
    houseofdreams: Z({ r: 64, m: 'dor', prog: [0, 3, 6, 2], plp: 1400, plv: .028, voice: 'music', every: [6, 11], nn: [3, 6], gap: [.3, .6], arp: 1, wind: [400, .7, .006], lay: ['chimes', 'crickets', 'hiss'], ed: .45, efb: .5 }),
    coastal:    Z({ r: 59, m: 'major', prog: [0, 4, 1, 3], plp: 1500, atk: 3.5, voice: 'steel', every: [6, 10], nn: [2, 4], gap: [.4, .8], wind: [520, .7, .014], lay: ['waves', 'wind', 'cicada'], ed: .36, efb: .28 }),
    quietnight: Z({ r: 51, m: 'min',   prog: [0, 6, 3, 5], pt: ['sine', 'sine'], plp: 600, plv: .026, atk: 6, voice: 'vibes', every: [13, 20], nn: [1, 3], gap: [1.6, 2.8], wind: [220, .9, .008], lay: ['crickets', 'hiss'], ed: 1, efb: .45 }),
    rivernight: Z({ r: 58, m: 'dor',   prog: [0, 4, 2, 6], voice: 'harp', every: [9, 14], nn: [3, 5], gap: [.5, 1], wind: [300, .8, .008], lay: ['stream', 'frogs', 'chimes'], ed: .6, efb: .4 }),
    nightfall:  Z({ r: 45, m: 'min',   prog: [0, 3, 5, 4], pt: ['triangle', 'sine'], plp: 650, atk: 5, voice: 'guitar', every: [10, 16], nn: [3, 4], gap: [.8, 1.4], wind: [330, .8, .014], lay: ['fire', 'wind', 'ice'], ed: .8, efb: .45 }),
    starrynight: Z({ r: 36, m: 'pent', prog: [0, 3, 1, 4], pt: ['sine', 'triangle'], plp: 500, plv: .034, atk: 7, voice: 'bowl', every: [14, 22], nn: [1, 3], gap: [1.8, 3], wind: [240, .9, .01], lay: ['crickets', 'shimmer', 'cicada'], ed: 1.2, efb: .55 }),
    summerdusk: Z({ r: 53, m: 'mpent', prog: [0, 2, 3, 1], plp: 1200, voice: 'guitar', every: [8, 13], nn: [3, 5], gap: [.5, .9], wind: [420, .7, .01], lay: ['cicada', 'birds', 'frogs'], ed: .5, efb: .35 }),
    sunsetpeak: Z({ r: 45, m: 'phr',   prog: [0, 5, 3, 1], pt: ['sawtooth', 'sawtooth'], plp: 560, plv: .018, atk: 7, voice: 'horn', every: [12, 18], nn: [1, 3], gap: [1.6, 2.8], wind: [360, .8, .02], lay: ['wind', 'hum'], ed: .95, efb: .45 }),
    vhsstore:   Z({ r: 49, m: 'dor',   prog: [0, 3, 0, 4], pt: ['sawtooth', 'triangle'], plp: 750, plv: .02, atk: 3, voice: 'synth', every: [6, 10], nn: [4, 6], gap: [.25, .5], arp: 1, wind: [220, 1.1, .005], lay: ['buzz', 'hiss', 'city'], ed: .375, efb: .55 }),
    nightwaterfall: Z({ r: 42, m: 'min', prog: [0, 2, 5, 4], pt: ['sine', 'triangle'], plp: 500, plv: .03, atk: 6, voice: 'celesta', every: [10, 16], nn: [2, 3], gap: [1, 1.8], wind: [280, .9, .012], lay: ['fall', 'drip', 'frogs'], ed: 1.1, efb: .5 }),
    winterlights: Z({ r: 55, m: 'major', prog: [0, 3, 1, 4], plp: 1200, plv: .028, atk: 4, voice: 'bell', every: [6, 10], nn: [3, 5], gap: [.45, .85], wind: [480, .8, .012], lay: ['ice', 'fire', 'chimes'], ed: .5, efb: .38 }),
    bridgeglow: Z({ r: 47, m: 'lyd',   prog: [0, 6, 4, 2], pt: ['triangle', 'sine'], plp: 900, plv: .024, atk: 5, voice: 'epiano', every: [9, 14], nn: [2, 4], gap: [.7, 1.2], wind: [350, .8, .01], lay: ['train', 'waves', 'birds'], ed: .7, efb: .42 }),
    beachdusk:  Z({ r: 51, m: 'hmin',  prog: [0, 4, 5, 3], plp: 1000, voice: 'marimba', every: [8, 12], nn: [2, 4], gap: [.6, 1], wind: [400, .7, .012], lay: ['waves', 'crickets', 'cicada'], ed: .45, efb: .35 }),
    beyondmtn:  Z({ r: 62, m: 'hira',  prog: [0, 4, 2, 3], pt: ['sine', 'sine'], plp: 1500, voice: 'shaku', every: [12, 20], nn: [2, 3], gap: [1.4, 2.4], wind: [560, .8, .01], lay: ['waves', 'chimes'], ed: .9, efb: .42 }),
    summerbay:  Z({ r: 61, m: 'pent',  prog: [0, 2, 4, 3], plp: 1700, atk: 3.5, voice: 'steel', every: [6, 10], nn: [3, 5], gap: [.35, .7], wind: [480, .7, .01], lay: ['waves', 'gulls', 'birds'], ed: .33, efb: .28 }),
    summersands: Z({ r: 66, m: 'lyd',  prog: [0, 1, 5, 4], plp: 1600, plv: .026, atk: 4, voice: 'kalimba', every: [7, 12], nn: [3, 5], gap: [.5, .9], wind: [620, .7, .012], lay: ['waves', 'wind', 'gulls'], ed: .42, efb: .32 }),
    mtnstream:  Z({ r: 54, m: 'major', prog: [0, 5, 4, 3], plp: 1300, voice: 'flute', every: [8, 13], nn: [2, 3], gap: [1.1, 1.9], wind: [900, .6, .01], lay: ['stream', 'birds', 'leaves'], ed: .5, efb: .3 }),
    moonfield:  Z({ r: 44, m: 'dor',   prog: [0, 5, 1, 4], pt: ['sine', 'sine'], plp: 560, plv: .03, atk: 6, voice: 'organ', every: [12, 18], nn: [1, 3], gap: [1.6, 2.6], wind: [300, .9, .014], lay: ['crickets', 'frogs', 'wind'], ed: .95, efb: .45 }),
    seacliff:   Z({ r: 63, m: 'mix',   prog: [0, 6, 4, 3], plp: 1500, voice: 'guitar', every: [7, 11], nn: [3, 5], gap: [.5, .9], wind: [560, .7, .016], lay: ['waves', 'wind', 'leaves'], ed: .45, efb: .3 }),
    sunrise4k:  Z({ r: 58, m: 'major', prog: [0, 4, 5, 2], plp: 1500, plv: .028, atk: 4, voice: 'celesta', every: [8, 12], nn: [3, 5], gap: [.45, .85], wind: [440, .7, .01], lay: ['birds', 'cicada', 'hiss'], ed: .55, efb: .3 }),
    sunsetvalley: Z({ r: 52, m: 'mpent', prog: [0, 4, 3, 1], pt: ['triangle', 'sine'], plp: 850, voice: 'cello', every: [10, 15], nn: [2, 4], gap: [.9, 1.6], wind: [340, .8, .012], lay: ['stream', 'crickets', 'train'], ed: .75, efb: .38 }),
    benchsea:   Z({ r: 56, m: 'pent',  prog: [0, 3, 2, 4], plp: 1300, voice: 'pluck', every: [9, 14], nn: [2, 4], gap: [.8, 1.4], wind: [450, .7, .012], lay: ['waves', 'leaves', 'cicada'], ed: .55, efb: .33 }),
    sakuraview: Z({ r: 59, m: 'insen', prog: [0, 3, 1, 4], plp: 1400, plv: .026, voice: 'koto', every: [8, 12], nn: [3, 5], gap: [.5, 1], wind: [520, .8, .01], lay: ['leaves', 'birds', 'chimes'], ed: .55, efb: .4 }),
    midnight:   Z({ r: 37, m: 'loc',   prog: [0, 1, 3, 4], pt: ['sine', 'triangle'], plp: 420, plv: .032, atk: 7, voice: 'bell', every: [16, 26], nn: [1, 2], gap: [2.4, 4], wind: [240, .9, .01], lay: ['wind', 'owl', 'hum', 'drip'], ed: 1.15, efb: .5 }),
  };
  const VOICES = {
    bell:   { w: 'sine', r2: 2.76, g2: .32, atk: .004, dec: 1.7, len: 9, lp: 5000, lvl: .04 },
    chime:  { w: 'sine', r2: 3.0, g2: .5, atk: .003, dec: 1.2, len: 7, lp: 9000, lvl: .028, up: 2 },
    pluck:  { w: 'triangle', r2: 2, g2: .22, atk: .003, dec: .5, len: 4, lp: 2600, lvl: .055, sweep: 1 },
    koto:   { w: 'sawtooth', r2: 2, g2: .08, atk: .002, dec: .42, len: 4, lp: 2400, lvl: .03, sweep: 1 },
    marimba: { w: 'sine', r2: 4, g2: .3, atk: .003, dec: .3, len: 3, lp: 3500, lvl: .06 },
    harp:   { w: 'triangle', r2: 3, g2: .12, atk: .004, dec: .95, len: 6, lp: 3200, lvl: .05 },
    bowl:   { w: 'sine', r2: 2.01, g2: .4, atk: .05, dec: 2.8, len: 14, lp: 2500, lvl: .04, beat: 1.004 },
    epiano: { w: 'sine', r2: 2, g2: .32, atk: .006, dec: .95, len: 5, lp: 2800, lvl: .05 },
    music:  { w: 'sine', r2: 4, g2: .28, atk: .003, dec: 1.0, len: 5, lp: 6000, lvl: .04, up: 2 },
    flute:  { w: 'sine', r2: 2, g2: .06, atk: .2, dec: 1.2, len: 6, lp: 2400, lvl: .04, vib: 5.2, sus: 1.4 },
    celesta: { w: 'sine', r2: 4, g2: .18, atk: .003, dec: 1.4, len: 6, lp: 8000, lvl: .03, up: 2 },
    glass:  { w: 'sine', r2: 5.4, g2: .25, atk: .003, dec: 2.2, len: 9, lp: 9000, lvl: .026, up: 2 },
    kalimba: { w: 'sine', r2: 6.3, g2: .12, atk: .002, dec: .7, len: 4, lp: 4200, lvl: .05 },
    guitar: { w: 'sawtooth', r2: 2, g2: .05, atk: .003, dec: .8, len: 5, lp: 1800, lvl: .034, sweep: 1 },
    cello:  { w: 'sawtooth', r2: 1.005, g2: .4, atk: .35, dec: 1.8, len: 8, lp: 900, lvl: .024, sus: 1.2, vib: 4.6 },
    organ:  { w: 'sine', r2: 2, g2: .6, atk: .15, dec: 2, len: 8, lp: 2200, lvl: .03, sus: 2 },
    vibes:  { w: 'sine', r2: 4, g2: .15, atk: .003, dec: 1.8, len: 7, lp: 4500, lvl: .045, vib: 5 },
    steel:  { w: 'sine', r2: 2.5, g2: .35, atk: .002, dec: .45, len: 3, lp: 4000, lvl: .055 },
    synth:  { w: 'sawtooth', r2: 1.01, g2: .6, atk: .08, dec: 1.1, len: 6, lp: 1500, lvl: .022, sus: .5, sweep: 1 },
    shaku:  { w: 'sine', r2: 3, g2: .03, atk: .3, dec: 1.4, len: 7, lp: 1800, lvl: .035, vib: 4, sus: 1.8 },
    zither: { w: 'triangle', r2: 2.01, g2: .3, atk: .002, dec: 1.2, len: 5, lp: 3600, lvl: .045, beat: 1.003 },
    horn:   { w: 'sawtooth', r2: 1.005, g2: .5, atk: .6, dec: 2.2, len: 10, lp: 650, lvl: .02, sus: 2.2 },
  };
  let S = SCENES.winter, SC = null, wantId = 'winter', epoch = 0, tm = new Set(), DROPS = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99];
  const scn = (d, oct = 0) => { const m = MODES[S.m], n = m.length; return S.r + m[((d % n) + n) % n] + 12 * (Math.floor(d / n) + oct); };
  const rbase = () => (S.r < 46 ? 1 : 0);
  let ci = 0, voices = [], timer = 0, keyTimer = 0, cur = null, echo = null, noiseBuf = null;
  const later = (fn, ms) => { const ep = epoch; const id = setTimeout(() => { tm.delete(id); if (ep === epoch && started) { try { fn(); } catch (e) { /* ignore */ } } }, ms); tm.add(id); };
  const rr = (a, b) => a + Math.random() * (b - a);
  function to(node, pan) {   // send a sound into the current scene: dry, reverb and echo
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; let src = node; if (p) { p.pan.value = pan == null ? Math.random() * 1.2 - 0.6 : pan; node.connect(p); src = p; }
    src.connect(SC.dry); src.connect(SC.wet); if (SC.ein) src.connect(SC.ein);
  }
  function chord(first) {
    if (!ctx || !SC) return;
    const t = t0(), d = S.prog[ci++ % S.prog.length], b = rbase(), old = voices; voices = [];
    const PV = 0.7; const bass = MF(scn(d, b ? 0 : -1)), pad = [scn(d + 2, b), scn(d + 4, b), scn(d + 7, b), S.sev ? scn(d + 6, b + 1) : scn(d + 9, b)].map(MF);
    cur = { keys: [0, 1, 2, 4, 6, 7, 9].map((k) => MF(scn(d + k, b + 1))) };
    old.forEach((v) => { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.setTargetAtTime(0, t, 5); setTimeout(() => { try { v.stop.forEach((o) => o.stop()); } catch (e) { /* done */ } }, 30000); });
    [[bass, S.plv * 2.3 * PV, 0], ...pad.map((f, i) => [f, S.plv * PV, i + 1])].forEach(([f, level, i]) => {
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o1.type = i === 0 ? 'sine' : S.pt[0]; o2.type = i === 0 ? 'sine' : S.pt[1]; o1.frequency.value = f; o2.frequency.value = f * (i % 2 ? 1.003 : 0.997); lp.type = 'lowpass'; lp.frequency.value = i === 0 ? 180 : S.plp; lp.Q.value = 0.3;
      lfo.frequency.value = 0.03 + i * 0.013; lg.gain.value = level * 0.25; lfo.connect(lg); lg.connect(g.gain);
      g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(level, t + (first === true ? 0.05 : 0.5), first === true ? Math.min(1.1, S.atk * 0.25) : S.atk);
      o1.connect(lp); o2.connect(lp); lp.connect(g); to(g, (i - 2) * 0.25);
      o1.start(t); o2.start(t); lfo.start(t); voices.push({ g, stop: [o1, o2, lfo] });
    });
  }
  function note(f, at, vn, pan) {
    if (!ctx || !started || !SC) return; const v = VOICES[vn]; if (v.up) f *= v.up; while (f > 5200) f /= 2;
    const t = t0() + at, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = v.w; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * v.r2; g2.gain.value = v.g2; lp.type = 'lowpass'; lp.frequency.setValueAtTime(v.lp * 0.55, t); if (v.sweep) lp.frequency.exponentialRampToValueAtTime(Math.max(300, v.lp * 0.2), t + 0.6);
    const hold = t + v.atk + (v.sus || 0.04);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v.lvl * 0.5, t + v.atk * 3); g.gain.setValueAtTime(v.lvl * 0.5, hold); g.gain.setTargetAtTime(0, hold, v.dec * 0.55);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); to(lp, pan);
    const stops = [o, o2];
    if (v.beat) { const o3 = ctx.createOscillator(); o3.frequency.value = f * v.beat; o3.connect(g); o3.start(t); stops.push(o3); }
    if (v.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = v.vib; lg.gain.value = f * 0.0045; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.3); stops.push(l); }
    o.start(t); o2.start(t); stops.forEach((s) => s.stop(t + v.len));
  }
  function phrase() {
    if (!started || !cur) return;
    const pool = cur.keys, n = Math.min(2, S.nn[0] + Math.floor(Math.random() * (S.nn[1] - S.nn[0] + 1))); let at = 0, idx = 0 ? 0 : Math.floor(Math.random() * pool.length);
    for (let i = 0; i < n; i++) { note(pool[idx], at, S.voice); idx = S.arp ? Math.min(pool.length - 1, idx + 1) : Math.max(0, Math.min(pool.length - 1, idx + (Math.random() < 0.5 ? -1 : 1))); at += rr(S.gap[0], S.gap[1]) * 2.2 + 1; }
    keyTimer = setTimeout(phrase, rr(S.every[0], S.every[1]) * 2.4 * 1000);
  }
  // water, to match the lake in the wallpaper: every so often a ripple or splash on screen makes a soft sound here too
  let DROPS_UNUSED = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99];   // D-minor pentatonic-ish, so any mix sounds calm
  let lastDrop = 0;
  function bloop(f, level, dur, pan01) {   // a round "bloop": a sine that rises quickly, then rings out into the reverb
    const t = t0(), o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.type = 'sine'; o.frequency.setValueAtTime(f * 0.62, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.09); lp.type = 'lowpass'; lp.frequency.value = 2200;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + 0.012); g.gain.setTargetAtTime(0, t + 0.03, dur);
    o.connect(g); g.connect(lp);
    if (pan) { pan.pan.value = Math.max(-0.8, Math.min(0.8, pan01 * 1.6 - 0.8)); lp.connect(pan); pan.connect(musBus); pan.connect(reverb); if (echo) pan.connect(echo); } else { lp.connect(musBus); lp.connect(reverb); }
    o.start(t); o.stop(t + dur * 8 + 0.5);
  }
  function drop(x01 = 0.5, depth = 0.5) {   // a ripple: one soft high note, never more than one every second or so
    if (!ctx || !started) return; const now = performance.now(); if (now - lastDrop < 1100) return; lastDrop = now;
    const i = Math.max(0, Math.min(DROPS.length - 1, Math.floor(x01 * DROPS.length)));
    bloop(DROPS[i], 0.022 + depth * 0.012, 0.35, x01);
  }
  function plop(size = 0.7, x01 = 0.5) {   // a splash: a lower, rounder bloop and a short puff of water noise
    if (!ctx || !started) return; const now = performance.now(); if (now - lastDrop < 500) return; lastDrop = now;
    bloop(150 + Math.max(0, 1.4 - size) * 160, 0.05, 0.22, x01);
    const len = Math.floor(ctx.sampleRate * 0.35), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.7; g.gain.value = 0.02 + size * 0.012;
    src.connect(bp); bp.connect(g); g.connect(musBus); g.connect(reverb); src.start();
  }
  // ---- the sounds of each place ----
  function nbuf() { if (noiseBuf) return noiseBuf; const len = ctx.sampleRate * 5; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate); const d = noiseBuf.getChannelData(0); let y = 0; for (let i = 0; i < len; i++) { y += ((Math.random() * 2 - 1) - y) * 0.35; d[i] = y * 1.6; } return noiseBuf; }
  function bed(type, f, q, lvl, rate, depth, fdepth) {   // a steady, slowly breathing bed of noise (wind, surf, rain)
    const src = ctx.createBufferSource(); src.buffer = nbuf(); src.loop = true; const fl = ctx.createBiquadFilter(), g = ctx.createGain(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = lvl * 1.5;
    src.connect(fl); fl.connect(g); g.connect(SC.dry); g.connect(SC.wet); src.start(0, Math.random() * 3); SC.nodes.push(src);
    if (rate) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = rate; lg.gain.value = depth * 1.5; l.connect(lg); lg.connect(g.gain); l.start(); SC.nodes.push(l); }
    if (fdepth) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = (rate || 0.05) * 0.73; lg.gain.value = fdepth; l.connect(lg); lg.connect(fl.frequency); l.start(); SC.nodes.push(l); }
  }
  function tick(type, f, q, lvl, dur, pan) {   // a short burst of filtered noise
    const src = ctx.createBufferSource(); src.buffer = nbuf(); const fl = ctx.createBiquadFilter(), g = ctx.createGain(), t = t0(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); src.connect(fl); fl.connect(g); to(g, pan); src.start(t, Math.random() * 3, dur + 0.05);
  }
  function chirp(f0, f1, dur, lvl, at, pan) {   // a little swept sine: a bird, a gull, a cricket
    const t = t0() + at, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + Math.min(0.02, dur * 0.3)); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(g); to(g, pan); o.start(t); o.stop(t + dur + 0.05);
  }
  const LAYERS = {
    wind() { bed('bandpass', 520, 0.9, 0.016, 0.045, 0.012, 200); bed('bandpass', 1100, 1.4, 0.006, 0.07, 0.005, 300); },
    stream() { bed('bandpass', 2200, 0.8, 0.012, 0.3, 0.004, 500); bed('highpass', 5000, 0.5, 0.0035, 0.5, 0.002); },
    fall() { bed('bandpass', 800, 0.4, 0.02, 0.06, 0.004, 150); bed('highpass', 2500, 0.4, 0.008); bed('lowpass', 160, 0.5, 0.014); },
    frogs() { const go = () => { const n = 2 + Math.floor(Math.random() * 3), b = rr(520, 760), pan = rr(-0.8, 0.8); for (let i = 0; i < n; i++) chirp(b, b * 1.15, 0.09, 0.01, i * 0.13, pan); later(go, rr(2500, 8000)); }; later(go, 2000); },
    cicada() { bed('bandpass', 6200, 6, 0.004, 0.12, 0.0025); },
    chimes() { const go = () => { note(MF(scn([0, 1, 2, 4, 5][Math.floor(Math.random() * 5)], 2 + rbase())), 0, 'chime'); later(go, rr(5000, 15000)); }; later(go, 4000); },
    leaves() { bed('bandpass', 3400, 1.2, 0.006, 0.17, 0.005, 800); },
    hiss() { bed('highpass', 7000, 0.3, 0.004); const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = 60; g.gain.value = 0.006; o.connect(g); g.connect(SC.dry); o.start(); SC.nodes.push(o); },
    buzz() { const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(), l = ctx.createOscillator(), lg = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = 100; lp.type = 'lowpass'; lp.frequency.value = 500; g.gain.value = 0.005; l.frequency.value = 0.4; lg.gain.value = 0.002; l.connect(lg); lg.connect(g.gain); o.connect(lp); lp.connect(g); g.connect(SC.dry); o.start(); l.start(); SC.nodes.push(o, l); },
    city() { bed('lowpass', 140, 0.5, 0.014, 0.03, 0.005); bed('bandpass', 900, 0.8, 0.003, 0.02, 0.0015); },
    ice() { const go = () => { tick('highpass', 6500, 1, 0.01, 0.02, rr(-0.8, 0.8)); later(go, rr(1500, 6000)); }; later(go, 1200); },
    train() { const go = () => { tick('lowpass', 110, 0.7, 0.03, 6, 0); later(go, rr(35000, 70000)); }; later(go, 8000); },
    waves() { bed('lowpass', 420, 0.5, 0.012, 0.09, 0.011, 90); bed('highpass', 3200, 0.4, 0.002, 0.11, 0.0018); },
    rain() { bed('highpass', 3500, 0.5, 0.011); bed('bandpass', 1300, 0.6, 0.007, 0.04, 0.002); },
    hum() { [[0, 0.03], [7, 0.012]].forEach(([s, lv], i) => { const o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain(); o.type = 'sine'; o.frequency.value = MF(S.r + s - 12 + (S.r < 44 ? 12 : 0)); g.gain.value = lv; l.frequency.value = 0.05 + i * 0.03; lg.gain.value = lv * 0.5; l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(SC.dry); g.connect(SC.wet); o.start(); l.start(); SC.nodes.push(o, l); }); },
    shimmer() { [24, 28, 31, 36].forEach((s, i) => { const o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; o.type = 'sine'; o.frequency.value = MF(S.r + s); g.gain.value = 0.004; l.frequency.value = 0.06 + i * 0.037; lg.gain.value = 0.0038; l.connect(lg); lg.connect(g.gain); o.connect(g); if (p) { p.pan.value = i % 2 ? 0.5 : -0.5; g.connect(p); p.connect(SC.dry); p.connect(SC.wet); } else { g.connect(SC.dry); g.connect(SC.wet); } o.start(); l.start(); SC.nodes.push(o, l); }); },
    birds() { const go = () => { const n = 2 + Math.floor(Math.random() * 4), b = rr(2600, 4200), pan = rr(-0.8, 0.8); for (let i = 0; i < n; i++) chirp(b * rr(0.9, 1.1), b * rr(1.1, 1.4), rr(0.06, 0.12), 0.006, i * 0.14, pan); later(go, rr(3500, 9000)); }; later(go, 2500); },
    crickets() { const go = () => { const n = 3 + Math.floor(Math.random() * 3), b = rr(4300, 4800), pan = rr(-0.8, 0.8); for (let i = 0; i < n; i++) chirp(b, b, 0.05, 0.006, i * 0.075, pan); later(go, rr(2500, 7500)); }; later(go, 3000); },
    gulls() { const go = () => { const pan = rr(-0.7, 0.7); chirp(1700, 1150, 0.34, 0.008, 0, pan); chirp(1500, 1000, 0.42, 0.007, 0.45, pan); if (Math.random() < 0.5) chirp(1650, 1100, 0.3, 0.006, 1, pan); later(go, rr(14000, 28000)); }; later(go, 6000); },
    owl() { const go = () => { const pan = rr(-0.7, 0.7); chirp(392, 380, 0.45, 0.018, 0, pan); chirp(349, 340, 0.7, 0.016, 0.62, pan); later(go, rr(28000, 58000)); }; later(go, 15000); },
    drip() { const go = () => { const f = MF(scn([0, 2, 4, 7][Math.floor(Math.random() * 4)], rbase() + 2)), pan = rr(-0.8, 0.8); chirp(f * 0.72, f, 0.07, 0.016, 0, pan); later(go, rr(1800, 6000)); }; later(go, 1500); },
    fire() { bed('lowpass', 200, 0.6, 0.008, 0.07, 0.003); const go = () => { tick('bandpass', rr(1500, 4500), 1.2, rr(0.008, 0.02), rr(0.015, 0.05), rr(-0.4, 0.4)); later(go, Math.random() < 0.2 ? rr(30, 90) : rr(120, 900)); }; later(go, 500); },
    bell() { const go = () => { const f = MF(scn(0, 1 + rbase())); [[1, 1], [2.0, 0.5], [2.4, 0.4], [3.0, 0.25], [4.1, 0.15]].forEach(([r, a]) => { const t = t0(), o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * r; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.013 * a, t + 0.01); g.gain.setTargetAtTime(0, t + 0.02, 2.4 / (1 + r * 0.3)); o.connect(g); to(g, 0.3); o.start(t); o.stop(t + 14); }); later(go, rr(38000, 62000)); }; later(go, 12000); },
  };
  function buildScene(id) {
    if (!ctx) return;
    S = SCENES[id] || SCENES.winter; const now = t0();
    // fade the old scene away
    if (SC) { const o = SC; o.dry.gain.cancelScheduledValues(now); o.dry.gain.setTargetAtTime(0, now, 0.7); o.wet.gain.setTargetAtTime(0, now, 0.7); setTimeout(() => { try { o.nodes.forEach((n) => n.stop()); o.dry.disconnect(); o.wet.disconnect(); if (o.ein) o.ein.disconnect(); } catch (e) { /* gone */ } }, 9000); }
    voices.forEach((v) => setTimeout(() => { try { v.stop.forEach((x) => x.stop()); } catch (e) { /* gone */ } }, 9000)); voices = [];
    epoch++; tm.forEach(clearTimeout); tm.clear(); clearInterval(timer); clearTimeout(keyTimer);
    const dry = ctx.createGain(), wet = ctx.createGain(); dry.gain.value = 0; wet.gain.value = 0; dry.connect(musBus); wet.connect(reverb);
    dry.gain.setTargetAtTime(1, now, 0.6); wet.gain.setTargetAtTime(0.85, now, 0.6);
    SC = { dry, wet, nodes: [], ein: null };
    const dl = ctx.createDelay(2), fb = ctx.createGain(), dlp = ctx.createBiquadFilter(), eg = ctx.createGain(), ein = ctx.createGain();
    dl.delayTime.value = S.ed; fb.gain.value = S.efb; dlp.type = 'lowpass'; dlp.frequency.value = 1100; eg.gain.value = 0.5; ein.gain.value = 0.5;
    ein.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(eg); eg.connect(dry); eg.connect(wet); SC.ein = ein; echo = ein;
    // the air of the place
    bed('bandpass', S.wind[0], S.wind[1], S.wind[2], 0.05, S.wind[2] * 0.65, S.wind[0] * 0.4);
    S.lay.forEach((l) => LAYERS[l] && LAYERS[l]());
    DROPS = [0, 1, 2, 4, 5, 7, 9, 11].map((k) => MF(scn(k, rbase() + 1)));
    ci = 0; chord(true); timer = setInterval(() => chord(), (S.cp || 26) * 1000);
    keyTimer = setTimeout(phrase, SC.first ? 9000 : 1500); SC.first = true;
  }
  function startMusic() {
    if (started || !init()) return; started = true; buildScene(wantId); applyMusic(true);
  }
  function applyMusic(fast) {
    if (!ctx) return;
    const on = st.music && !st.hush && !st.spot && !st.hold && !st.muted && document.hasFocus() && !document.hidden;
    musBus.gain.cancelScheduledValues(t0()); musBus.gain.setValueAtTime(musBus.gain.value, t0()); musBus.gain.setTargetAtTime(on ? st.musicVol * 0.9 : 0, t0() + (fast === true ? 0.15 : 0), on ? (fast === true ? 1.5 : 0.7) : 0.6);   // starts slowly and swells in, never pops
  }
  window.addEventListener('focus', applyMusic); window.addEventListener('blur', applyMusic); document.addEventListener('visibilitychange', applyMusic);
  const unlock = () => { try { init(); if (ctx.state === 'suspended') ctx.resume(); startMusic(); } catch (e) { /* ignore */ } };
  ['pointerdown', 'keydown', 'gamepadconnected'].forEach((e) => window.addEventListener(e, unlock, { once: false, passive: true }));
  setTimeout(unlock, 0);   // autoplay is allowed in this app, so the music can begin the moment it loads
  return {
    play, unlock, startMusic, drop, plop,
    theme(id) { id = SCENES[id] ? id : 'winter'; if (id === wantId && SC) return; wantId = id; if (started && ctx) buildScene(id); },   // every wallpaper has its own score
    mute(on) { on = !!on; if (st.muted === on) return; st.muted = on; if (!on) st.soft = performance.now() + 2500; applyMusic(); try { if (ctx) on ? ctx.suspend() : ctx.resume(); } catch {} },   // everything goes quiet while a game is running
    set(o) { if ('sfxVol' in o) { st.sfxVol = Math.max(0, Math.min(1, +o.sfxVol)); if (sfxBus) sfxBus.gain.setTargetAtTime(st.sfxVol * 0.8, t0(), 0.05); } if ('musicVol' in o) { st.musicVol = Math.max(0, Math.min(1, +o.musicVol)); applyMusic(); } if ('sfx' in o) st.sfx = !!o.sfx; if ('music' in o) { st.music = !!o.music; applyMusic(); } },
    spot(on) { on = !!on; if (st.spot === on) return; st.spot = on; applyMusic(); },   // Spotify is playing: the ambient music stays off
    hush(on) { on = !!on; if (st.hush === on) return; st.hush = on; applyMusic(); },   // pause the ambient music while a trailer with sound plays
    hold(on) { on = !!on; if (st.hold === on) return; st.hold = on; applyMusic(!on); },   // no ambient music over the startup video
    quiet(ms) { st.quiet = performance.now() + ms; },
  };
})();

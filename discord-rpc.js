// Talks to the Discord desktop app on this PC (its local "RPC" pipe) so the console can show the party chat: who is in your voice channel,
// who is speaking, mute / deafen, leave and join. The Discord app keeps carrying the voice. Nothing here touches Discord's website or modifies it.
const nodeNet = require('net'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const CLIENT_ID = '1567338830842036264';
const SCOPES = ['rpc', 'rpc.voice.read', 'rpc.voice.write', 'identify'];
const REDIRECT = 'http://127.0.0.1';
const b64u = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function create({ dir, onState, log, launch }) {
  const tokF = path.join(dir, 'discord-rpc.json'), secF = path.join(dir, 'discord-secret.txt');
  let launched = false, sock = null, buf = Buffer.alloc(0), pend = new Map(), wanted = false, retryT = null, emitT = null, subs = [], guilds = null, authBusy = false, gen = 0;
  let tok = null; try { tok = JSON.parse(fs.readFileSync(tokF, 'utf8')); } catch {}
  const st = { connected: false, auth: 'off', error: '', channel: null, members: [], me: { mute: false, deaf: false } };
  const emit = () => { clearTimeout(emitT); emitT = setTimeout(() => { try { onState(JSON.parse(JSON.stringify(st))); } catch {} }, 40); };
  const L = (m) => { try { log('discord rpc: ' + m); } catch {} };

  function frame(op, obj) { const d = Buffer.from(JSON.stringify(obj), 'utf8'), h = Buffer.alloc(8); h.writeInt32LE(op, 0); h.writeInt32LE(d.length, 4); return Buffer.concat([h, d]); }
  function send(cmd, args, evt, ms) {
    return new Promise((resolve, reject) => {
      if (!sock) return reject(new Error('not connected'));
      const nonce = crypto.randomUUID(), t = setTimeout(() => { pend.delete(nonce); reject(new Error(cmd + ' timed out')); }, ms || 12000);
      pend.set(nonce, { resolve, reject, t });
      const o = { cmd, nonce }; if (args) o.args = args; if (evt) o.evt = evt;
      try { sock.write(frame(1, o)); } catch (e) { clearTimeout(t); pend.delete(nonce); reject(e); }
    });
  }
  function drop(why) {
    const s = sock; sock = null; buf = Buffer.alloc(0); gen++;
    for (const [, p] of pend) { clearTimeout(p.t); p.reject(new Error(why || 'closed')); } pend.clear();
    try { if (s) s.destroy(); } catch {}
    subs = []; st.connected = false; st.auth = 'off'; st.channel = null; st.members = []; emit();
    if (wanted) { clearTimeout(retryT); retryT = setTimeout(connect, 1500); }
  }
  function connect() {
    if (!wanted || sock) return;
    const myGen = ++gen; let i = 0, codes = [];
    const next = () => {
      if (!wanted || myGen !== gen || sock) return;
      if (i > 9) { L('no Discord pipe found: ' + codes.join(',')); if (!launched && launch) { launched = true; try { launch(); } catch (e) { L('launch: ' + e.message); } } st.error = 'Open the Discord app on this PC first (it has to be running and signed in).'; emit(); clearTimeout(retryT); retryT = setTimeout(connect, 1500); return; }
      const p = process.platform === 'win32' ? '\\\\?\\pipe\\discord-ipc-' + i : '/tmp/discord-ipc-' + i; i++;
      const s = nodeNet.createConnection(p);
      s.once('error', (e) => { codes.push(e && e.code); try { s.destroy(); } catch {} next(); });
      s.once('connect', () => {
        if (!wanted || myGen !== gen) { try { s.destroy(); } catch {} return; }
        s.removeAllListeners('error'); sock = s; buf = Buffer.alloc(0);
        s.on('data', onData); s.on('error', () => drop('pipe error')); s.on('close', () => { if (sock === s) drop('pipe closed'); });
        s.write(frame(0, { v: 1, client_id: CLIENT_ID }));
        L('connected to the Discord app');
      });
    };
    next();
  }
  function onData(d) {
    buf = Buffer.concat([buf, d]);
    while (buf.length >= 8) {
      const op = buf.readInt32LE(0), len = buf.readInt32LE(4); if (buf.length < 8 + len) break;
      let msg = null; try { msg = JSON.parse(buf.slice(8, 8 + len).toString('utf8')); } catch {}
      buf = buf.slice(8 + len);
      if (op === 3 && msg !== undefined) { try { sock.write(frame(4, msg || {})); } catch {} continue; }
      if (op === 2) { L('closed by Discord: ' + JSON.stringify(msg)); drop('closed by Discord'); return; }
      if (msg) handle(msg);
    }
  }
  function handle(m) {
    if (m.nonce && pend.has(m.nonce)) { const p = pend.get(m.nonce); pend.delete(m.nonce); clearTimeout(p.t); if (m.evt === 'ERROR') p.reject(new Error((m.data && m.data.message) || 'error')); else p.resolve(m.data); return; }
    const d = m.data || {};
    switch (m.evt) {
      case 'READY': st.connected = true; st.error = ''; emit(); login().catch((e) => { st.auth = 'error'; st.error = e.message; L('login: ' + e.message); emit(); }); break;
      case 'VOICE_SETTINGS_UPDATE': st.me.mute = !!d.mute; st.me.deaf = !!d.deaf; emit(); break;
      case 'VOICE_CHANNEL_SELECT': if (d.channel_id) readChannel().catch(() => {}); else { clearChannel(); } break;
      case 'VOICE_STATE_CREATE': case 'VOICE_STATE_UPDATE': upsert(d); break;
      case 'VOICE_STATE_DELETE': st.members = st.members.filter((x) => x.id !== (d.user && d.user.id)); emit(); break;
      case 'SPEAKING_START': case 'SPEAKING_STOP': { const x = st.members.find((y) => y.id === d.user_id); if (x) { x.speaking = m.evt === 'SPEAKING_START'; emit(); } break; }
    }
  }
  const nameOf = (u, nick) => nick || (u && (u.global_name || u.username)) || 'Player';
  function memberOf(d) { const v = d.voice_state || {}, u = d.user || {}; return { id: u.id, name: nameOf(u, d.nick), mute: !!(v.mute || v.self_mute), deaf: !!(v.deaf || v.self_deaf), speaking: false }; }
  function upsert(d) { const x = memberOf(d); if (!x.id) return; const k = st.members.find((y) => y.id === x.id); if (k) { k.name = x.name; k.mute = x.mute; k.deaf = x.deaf; } else st.members.push(x); emit(); }
  function clearChannel() { subs = []; st.channel = null; st.members = []; emit(); }
  async function readChannel() {
    const ch = await send('GET_SELECTED_VOICE_CHANNEL');
    if (!ch || !ch.id) return clearChannel();
    st.channel = { id: ch.id, name: ch.name || 'Voice channel', guild: ch.guild_id || '' };
    st.members = (ch.voice_states || []).map(memberOf).filter((x) => x.id);
    emit();
    for (const e of ['VOICE_STATE_CREATE', 'VOICE_STATE_UPDATE', 'VOICE_STATE_DELETE', 'SPEAKING_START', 'SPEAKING_STOP']) { try { await send('SUBSCRIBE', { channel_id: ch.id }, e); } catch {} }
  }
  // ---- sign in: the first time Discord shows an approval pop-up; afterwards the saved sign-in is reused ----
  const saveTok = (t) => { tok = t; try { fs.writeFileSync(tokF, JSON.stringify(t)); } catch {} };
  async function tokenCall(params) {
    let sec = ''; try { sec = fs.readFileSync(secF, 'utf8').trim(); } catch {}
    const body = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: REDIRECT, ...params }); if (sec) body.set('client_secret', sec);
    const r = await fetch('https://discord.com/api/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(15000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) throw new Error('Discord would not give a sign-in (' + (j.error_description || j.error || r.status) + '). In the Developer Portal open OAuth2 and switch on "Public Client".');
    saveTok({ access_token: j.access_token, refresh_token: j.refresh_token, exp: Date.now() + (j.expires_in || 600000) * 1000 - 60000 });
  }
  async function login() {
    if (authBusy) return; authBusy = true;
    try {
      st.auth = 'working'; emit();
      let ok = false;
      if (tok && tok.refresh_token && tok.exp < Date.now()) { try { await tokenCall({ grant_type: 'refresh_token', refresh_token: tok.refresh_token }); } catch (e) { L('refresh failed: ' + e.message); tok = null; } }
      if (tok && tok.access_token) { try { await send('AUTHENTICATE', { access_token: tok.access_token }); ok = true; } catch (e) { L('saved sign-in refused: ' + e.message); tok = null; } }
      if (!ok) {
        st.auth = 'approve'; emit();   // Discord shows a small window: press Authorize
        const ver = b64u(crypto.randomBytes(48)), chal = b64u(crypto.createHash('sha256').update(ver).digest());
        const a = await send('AUTHORIZE', { client_id: CLIENT_ID, scopes: SCOPES, code_challenge: chal, code_challenge_method: 'S256' }, null, 180000);
        st.auth = 'working'; emit();
        let sec = ''; try { sec = fs.readFileSync(secF, 'utf8').trim(); } catch {}
        await tokenCall(sec ? { grant_type: 'authorization_code', code: a.code } : { grant_type: 'authorization_code', code: a.code, code_verifier: ver });
        await send('AUTHENTICATE', { access_token: tok.access_token });
      }
      st.auth = 'ok'; st.error = ''; emit(); L('signed in');
      try { const v = await send('GET_VOICE_SETTINGS'); st.me.mute = !!v.mute; st.me.deaf = !!v.deaf; } catch {}
      for (const e of ['VOICE_CHANNEL_SELECT', 'VOICE_SETTINGS_UPDATE']) { try { await send('SUBSCRIBE', {}, e); } catch (er) { L('subscribe ' + e + ': ' + er.message); } }
      await readChannel().catch(() => {}); emit();
    } finally { authBusy = false; }
  }
  const need = () => { if (st.auth !== 'ok') throw new Error('Not signed in to Discord yet.'); };
  return {
    start() { wanted = true; if (!sock) connect(); else emit(); },
    stop() { wanted = false; clearTimeout(retryT); drop('stopped'); },
    state() { return JSON.parse(JSON.stringify(st)); },
    async mute() { need(); await send('SET_VOICE_SETTINGS', { mute: !st.me.mute }); },
    async deaf() { need(); await send('SET_VOICE_SETTINGS', { deaf: !st.me.deaf }); },
    async leave() { need(); await send('SELECT_VOICE_CHANNEL', { channel_id: null }); },
    async join(id) { need(); await send('SELECT_VOICE_CHANNEL', { channel_id: String(id), force: true }, null, 15000); },
    async list() {   // your servers and their voice channels, for "Join a voice channel"
      need();
      const g = ((await send('GET_GUILDS')) || {}).guilds || [], out = [];
      for (const x of g.slice(0, 12)) { try { const c = ((await send('GET_CHANNELS', { guild_id: x.id })) || {}).channels || []; const v = c.filter((y) => y.type === 2).map((y) => ({ id: y.id, name: y.name })); if (v.length) out.push({ id: x.id, name: x.name, channels: v.slice(0, 20) }); } catch {} }
      return out;
    },
  };
}
module.exports = { create };

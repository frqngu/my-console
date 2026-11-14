// Spotify built into the console: sign-in (PKCE, no secret) and the Web API. The sound comes from a hidden player inside the console
// (see renderer/spotify-player.html) or, when that cannot play protected audio, from one of your other Spotify devices.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const REDIRECT = 'http://127.0.0.1:8888/callback';
const SCOPES = ['streaming', 'user-read-email', 'user-read-private', 'user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing', 'user-library-read', 'user-library-modify', 'playlist-read-private', 'playlist-read-collaborative', 'user-read-recently-played', 'user-top-read'];
const b64u = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function create({ dir, log, openAuth, enc }) {
  const idF = path.join(dir, 'spotify-client-id.txt'), tokF = path.join(dir, 'spotify.json');
  let tok = null;
  try { const raw = fs.readFileSync(tokF); tok = JSON.parse(enc && enc.dec ? enc.dec(raw) : raw.toString('utf8')); } catch {}
  const saveTok = (t) => { tok = t; try { const s = JSON.stringify(t); fs.writeFileSync(tokF, enc && enc.enc ? enc.enc(s) : s); } catch {} };
  const clientId = () => { try { const v = fs.readFileSync(idF, 'utf8').trim(); return /^[a-f0-9]{32}$/i.test(v) ? v : ''; } catch { return ''; } };
  async function tokenCall(params) {
    const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: clientId(), ...params }), signal: AbortSignal.timeout(15000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) throw new Error('Spotify refused the sign-in (' + (j.error_description || j.error || r.status) + ')');
    saveTok({ access: j.access_token, refresh: j.refresh_token || (tok && tok.refresh) || '', exp: Date.now() + (j.expires_in || 3600) * 1000 - 60000 });
  }
  async function token() {
    if (!tok || !tok.access) throw new Error('Not signed in to Spotify.');
    if (tok.exp < Date.now()) { if (!tok.refresh) throw new Error('Spotify sign-in expired. Sign in again.'); await tokenCall({ grant_type: 'refresh_token', refresh_token: tok.refresh }); }
    return tok.access;
  }
  async function call(method, p, body, retry) {
    const t = await token();
    const r = await fetch('https://api.spotify.com/v1' + p, { method, headers: { Authorization: 'Bearer ' + t, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
    if (r.status === 401 && !retry) { tok.exp = 0; return call(method, p, body, true); }
    if (r.status === 204 || r.status === 202) return {};
    const txt = await r.text(); let j = {}; try { j = txt ? JSON.parse(txt) : {}; } catch {}
    if (!r.ok) { const e = new Error((j.error && j.error.message) || 'Spotify error ' + r.status); e.status = r.status; throw e; }
    return j;
  }
  return {
    clientId, token, call,
    setId(v) { v = String(v || '').trim(); if (!/^[a-f0-9]{32}$/i.test(v)) return false; fs.writeFileSync(idF, v); return true; },
    status() { return { hasId: !!clientId(), signedIn: !!(tok && tok.access) }; },
    signOut() { tok = null; try { fs.unlinkSync(tokF); } catch {} },
    async signIn() {
      if (!clientId()) throw new Error('Add your Spotify Client ID first.');
      const ver = b64u(crypto.randomBytes(48)), chal = b64u(crypto.createHash('sha256').update(ver).digest()), state = b64u(crypto.randomBytes(12));
      const url = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({ client_id: clientId(), response_type: 'code', redirect_uri: REDIRECT, scope: SCOPES.join(' '), code_challenge_method: 'S256', code_challenge: chal, state }).toString();
      const got = await openAuth(url, REDIRECT);   // { code, state } or null when the window was closed
      if (!got || !got.code || got.state !== state) throw new Error('Sign-in was cancelled.');
      await tokenCall({ grant_type: 'authorization_code', code: got.code, redirect_uri: REDIRECT, code_verifier: ver });
      log('spotify: signed in');
    },
  };
}
module.exports = { create };

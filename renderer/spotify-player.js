// The hidden Spotify player inside the console: no window is ever shown. It makes the console a Spotify device called "Frankie Console".
window.onSpotifyWebPlaybackSDKReady = () => {
  const host = window.spHost; if (!host) return;
  const p = new Spotify.Player({ name: 'Frankie Console', getOAuthToken: (cb) => { host.token().then(cb).catch(() => {}); }, volume: 0.8 });
  p.addListener('ready', ({ device_id }) => host.report({ device: device_id }));
  p.addListener('not_ready', () => host.report({ device: '' }));
  for (const e of ['initialization_error', 'authentication_error', 'account_error', 'playback_error']) p.addListener(e, (m) => host.report({ error: e + ': ' + ((m && m.message) || '') }));
  try { navigator.requestMediaKeySystemAccess('com.widevine.alpha', [{ initDataTypes: ['cenc'], audioCapabilities: [{ contentType: 'audio/mp4;codecs="mp4a.40.2"', robustness: 'SW_SECURE_CRYPTO' }] }]).then((a) => host.report({ note: 'EME ok ' + a.keySystem }), (e) => host.report({ note: 'EME failed: ' + e.message })); } catch (e) { host.report({ note: 'EME check: ' + e.message }); }
  p.addListener('player_state_changed', (s) => { try { host.report({ note: 'state paused=' + (s && s.paused) + ' pos=' + (s && s.position) + ' track=' + (s && s.track_window && s.track_window.current_track && s.track_window.current_track.name) }); } catch {} });
  window.__sp = p;   // the console asks it for volume changes (instant, no web call)
  p.connect();
};

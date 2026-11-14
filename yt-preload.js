// runs before YouTube's scripts: tell the TV screen this is a 4K display that can play everything, so it offers the high qualities
const { webFrame } = require('electron');
try {
  webFrame.executeJavaScript(`(() => { try {
    window.close = function () {};   // leaving the app with B must never close the page
    const mc = navigator.mediaCapabilities;
    if (mc && mc.decodingInfo) { const o = mc.decodingInfo.bind(mc); mc.decodingInfo = async (c) => { try { const r = await o(c); if (r && r.supported) return { supported: true, smooth: true, powerEfficient: true, keySystemAccess: r.keySystemAccess }; return r; } catch (e) { return { supported: true, smooth: true, powerEfficient: true }; } }; }
    const MS = window.MediaSource;
    if (MS && MS.isTypeSupported) { const ot = MS.isTypeSupported.bind(MS); const base = (t) => String(t).replace(/;\\s*(width|height|framerate|bitrate|eotf|decoding-info)\\s*=\\s*[^;]*/gi, ''); MS.isTypeSupported = (t) => { const a = ot(t); return a || ot(base(t)); }; }
    const ev = window.HTMLVideoElement && HTMLVideoElement.prototype.canPlayType; if (ev) { const oc = ev; HTMLVideoElement.prototype.canPlayType = function (t) { const a = oc.call(this, t); return a || oc.call(this, String(t).replace(/;\\s*(width|height|framerate|bitrate|eotf)\\s*=\\s*[^;]*/gi, '')); }; }
    const sd = (k, v) => { try { Object.defineProperty(screen, k, { get: () => v }); } catch (e) {} };
    sd('width', 3840); sd('height', 2160); sd('availWidth', 3840); sd('availHeight', 2160);
    const ms = window.MediaSource, ty = (s) => { try { return ms ? ms.isTypeSupported(s) : null; } catch (e) { return 'err'; } };
    console.log('__cn__yt ' + JSON.stringify({ vp9: ty('video/webm; codecs="vp9"'), vp9p2: ty('video/webm; codecs="vp09.02.51.10"'), av1: ty('video/mp4; codecs="av01.0.12M.08"'), avc: ty('video/mp4; codecs="avc1.640028"'), ua: navigator.userAgent.slice(0, 90), dpr: devicePixelRatio, iw: innerWidth, ih: innerHeight, mc: !!mc, big: ty('video/webm; codecs="vp09.00.51.08"; width=3840; height=2160; framerate=60'), raw: (() => { try { return MediaSource.isTypeSupported.toString().length; } catch (e) { return 0; } })() }));
  } catch (e) { console.log('__cn__yt err ' + e); } })()`);
} catch {}

try { const hc = () => { try { if (document.getElementById('__cncur')) return; const st = document.createElement('style'); st.id = '__cncur'; st.textContent = '*{cursor:none!important}'; (document.head || document.documentElement).appendChild(st); } catch {} }; hc(); document.addEventListener('DOMContentLoaded', hc); new MutationObserver(hc).observe(document, { childList: true, subtree: true }); } catch {}

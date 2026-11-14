// Controller for YouTube's TV screen inside the console: the d-pad and A/B become the keys that screen already understands.
(() => {
  if (window.__cnYt) return; window.__cnYt = true;
  const rep = {}, held = {}; let backAt = 0, lastChk = 0;
  const send = (k) => console.log('__cn__key:' + k);
  const edge = (i, k, now, pressed) => { if (pressed) { if (!held[i]) { held[i] = 1; send(k); } } else held[i] = 0; };
  function loop(now) {
    requestAnimationFrame(loop);
    const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find((g) => g && g.connected); if (!gp) return;
    if (!window.__cnSaw) { window.__cnSaw = 1; console.log('__cn__pad'); }
    const b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed), ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const dirs = [['Left', b(14) || ax < -.55], ['Right', b(15) || ax > .55], ['Up', b(12) || ay < -.55], ['Down', b(13) || ay > .55]];
    for (const [k, on] of dirs) { if (on) { const r = rep[k]; if (!r) { rep[k] = { t: now, n: 0 }; send(k); } else if (now - r.t > (r.n ? 110 : 340)) { r.t = now; r.n++; send(k); } } else delete rep[k]; }
    edge(0, 'Return', now, b(0)); edge(2, 'Space', now, b(2));
    if (b(1)) { if (!held[1]) { held[1] = 1; backAt = now; send('Escape'); } } else held[1] = 0;
    if (backAt && now - backAt < 2500 && now - lastChk > 150) {   // B at the very top makes YouTube show the account picker: pick the same account again so nothing is lost
      lastChk = now;
      try { const t = document.body ? document.body.innerText : ''; if (/Watch as guest/i.test(t) && /Add account/i.test(t)) { backAt = 0; setTimeout(() => send('Return'), 120); } } catch {}
    }
  }
  // YouTube paints plain black rectangles behind some text lines (ad info, labels): clear them, keep round badges and buttons
  const clean = () => {
    try {
      for (const el of document.querySelectorAll('div,span,p,a')) {
        const t = (el.textContent || '').trim(); if (!t || t.length > 90 || el.querySelector('img,video,canvas,svg')) continue;
        const cs = getComputedStyle(el), m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(cs.backgroundColor); if (!m) continue;
        const a = m[4] === undefined ? 1 : +m[4]; if (a < 0.2 || (+m[1] + +m[2] + +m[3]) > 60) continue;
        if (parseFloat(cs.borderTopLeftRadius) >= 3 || el.hasAttribute('tabindex')) continue;
        if (el.__cnClr) continue; el.__cnClr = 1;
        el.style.setProperty('background', 'transparent', 'important'); el.style.setProperty('text-shadow', '0 1px 6px rgba(0,0,0,.85)', 'important');
      }
    } catch {}
  };
  let ct = 0; new MutationObserver(() => { if (!ct) ct = setTimeout(() => { ct = 0; clean(); }, 250); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(clean, 1000);
  console.log('__cn__ready'); requestAnimationFrame(loop);
})();

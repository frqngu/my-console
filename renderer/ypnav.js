// Controller for the YouTube player inside the console: buttons become the keys YouTube's player understands.
(() => {
  if (window.__cnYp) return; window.__cnYp = true;
  const rep = {}, held = {};
  const send = (k) => console.log('__cn__key:' + k);
  const edge = (i, k, pressed) => { if (pressed) { if (!held[i]) { held[i] = 1; send(k); } } else held[i] = 0; };
  function loop(now) {
    requestAnimationFrame(loop);
    const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find((g) => g && g.connected); if (!gp) return;
    const b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed), ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const dirs = [['Left', b(14) || ax < -.55], ['Right', b(15) || ax > .55], ['Up', b(12) || ay < -.55], ['Down', b(13) || ay > .55]];
    for (const [k, on] of dirs) { if (on) { const r = rep[k]; if (!r) { rep[k] = { t: now, n: 0 }; send(k); } else if (now - r.t > (r.n ? 120 : 380)) { r.t = now; r.n++; send(k); } } else delete rep[k]; }
    edge(0, 'K', b(0)); edge(1, 'Esc', b(1)); edge(2, 'Skip', b(2)); edge(3, 'C', b(3)); edge(4, 'J', b(4)); edge(5, 'L', b(5));
  }
  requestAnimationFrame(loop);
})();

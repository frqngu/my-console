/* The controller on the Button layout screen: your own front and back pictures, shown exactly as they are (their shading is what gives the sticks and buttons depth),
   on a two-sided card that lifts, tilts and turns when you flip it.
   PAD3D.mount(slot, back, intro)   PAD3D.flip(back, ms, cb)   PAD3D.set(back) */
(() => {
  const A = { slot: null, card: null, back: false, anim: null };
  const rest = (back) => 'translateZ(0px) rotateY(' + (back ? 180 : 0) + 'deg)';
  window.PAD3D = {
    ok: true,
    mount(slot, back, intro) {
      if (!slot) return;
      A.slot = slot; A.back = !!back;
      const ps = document.body.classList.contains('pad-ps'), F = ps ? 'omega.png' : 'pad_front.png', B = ps ? 'omega_back.png' : 'pad_back.png';
      slot.innerHTML = '<div class="mp-sway"><div class="mp-card"><img class="mp-ph mp-phf" alt="" draggable="false" src="' + F + '"><img class="mp-ph mp-phb" alt="" draggable="false" src="' + B + '"></div></div>';
      A.card = slot.querySelector('.mp-card'); A.card.style.transform = rest(A.back);
      if (intro && A.card.animate) A.card.animate([{ transform: 'translateZ(-70px) rotateY(' + (A.back ? 180 : 0) + 'deg)' }, { transform: rest(A.back) }], { duration: 1000, easing: 'cubic-bezier(.2,.8,.2,1)' });
    },
    set(back) { if (A.card) { A.back = !!back; A.card.style.transform = rest(A.back); } },
    flip(back, ms, cb) {   // lift toward you, tilt, and turn the card over
      if (!A.card || !A.card.animate) { if (cb) cb(); return; }
      const from = A.back ? 180 : 0, to = back ? 180 : 0, d = to > from ? 1 : -1, T = (z, rx, ry) => 'translateZ(' + z + 'px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      const a = A.card.animate([
        { transform: T(0, 0, from) },
        { transform: T(150, -9, from + 60 * d), offset: 0.3 },
        { transform: T(180, 7, from + 125 * d), offset: 0.68 },
        { transform: T(0, 0, to) },
      ], { duration: ms || 1400, easing: 'cubic-bezier(.45,.05,.2,1)', fill: 'forwards' });
      a.onfinish = () => { A.back = !!back; A.card.style.transform = rest(A.back); a.cancel(); if (cb) cb(); };
    },
  };
})();

'use strict';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
window.oskApi.onState((s) => {
  const rows = s.rows.map((row, r) => `<div class="r">${row.map((k, c) =>
    `<span class="k${r === s.r && c === s.c ? ' on' : ''}${k.length > 1 ? ' w' : ''}${k === 'Shift' && s.shift ? ' sh' : ''}">${esc(k)}</span>`).join('')}</div>`).join('');
  document.getElementById('root').innerHTML = `<div class="t">${s.typed ? esc(s.typed) : 'Typing into the app you were using'}<i>|</i></div>${rows}<div class="h">D-pad / stick: move   A: type   X: delete   Y: space   LB: shift   Menu: Enter   B: close</div>`;
});

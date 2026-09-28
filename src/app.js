'use strict';
(function () {
/* ============ assets (sticker sheets cut into single stickers, embedded) ============ */
const STK = __STK__;

/* ============ tiny helpers ============ */
const $ = (s, r) => (r || document).querySelector(s);
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return e;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : (s || ''); };
const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const stars = r => { r = +r || 0; return '★'.repeat(Math.floor(r)) + (r % 1 >= .5 ? '½' : ''); };
const tone = r => r >= 4 ? 'tone-h' : r >= 3 ? 'tone-m' : r > 0 ? 'tone-l' : 'tone-n';
const newId = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const okUrl = u => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch (e) { return ''; } };
const byRecent = (a, b) => (b.watched || '').localeCompare(a.watched || '') || (b.logged || '').localeCompare(a.logged || '');
const rand = a => a[Math.floor(Math.random() * a.length)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ICONS = {
  video: '<rect x="2" y="7" width="14" height="11" rx="2"/><path d="M16 11l6-3v9l-6-3z"/>',
  camera: '<rect x="2" y="7" width="20" height="13" rx="3"/><circle cx="12" cy="13.5" r="4"/><path d="M8 7l1.5-3h5L16 7"/>',
  vinyl: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  tray: '<rect x="2" y="6" width="20" height="13" rx="3"/><path d="M12 6v13M2 12h20"/>',
  key: '<circle cx="8" cy="14" r="4"/><path d="M11 11l9-8M16 6l3 3"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20"/>',
  spkon: '<path d="M3 9v6h4l5 4V5L7 9z"/><path d="M16 8c2 2 2 6 0 8M19 5c4 4 4 10 0 14"/>',
  spkoff: '<path d="M3 9v6h4l5 4V5L7 9z"/><path d="M16 9l6 6M22 9l-6 6"/>',
  pen: '<path d="M4 20l4-1L19 8l-3-3L5 16z"/>'
};
const icon = (n, cls) => h('span', { class: 'ic ' + (cls || ''), 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24">' + ICONS[n] + '</svg>' });

/* ============ state ============ */
let S;
try { S = JSON.parse(document.getElementById('state').textContent); } catch (e) { S = {}; }
S.movies = Array.isArray(S.movies) ? S.movies : [];
S.posts = Array.isArray(S.posts) ? S.posts : [];
S.settings = Object.assign({ spotify: '', spotifyLabel: '', tagline: '' }, S.settings || {});
let dirty = false, canEdit = false, publishing = false, adminTab = 'movies';

/* ============ vintage-desktop sounds (synthesised, no audio files) ============ */
const Snd = (() => {
  let ctx = null, on = true, crack = null;
  try { on = localStorage.getItem('bag-snd') !== 'off'; } catch (e) {}
  function ac() {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, t0, d, type, g, f2) {
    if (!on) return; const c = ac(); if (!c) return;
    const t = c.currentTime + t0, o = c.createOscillator(), a = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g || .1, t + .012); a.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(a); a.connect(c.destination); o.start(t); o.stop(t + d + .05);
  }
  const P = {
    click() { tone(1500, 0, .035, 'square', .04); },
    open() { tone(560, 0, .12, 'triangle', .09, 880); tone(880, .09, .16, 'triangle', .08, 1240); },
    close() { tone(920, 0, .13, 'triangle', .09, 460); },
    ding() { tone(880, 0, .5, 'sine', .14); tone(1320, .13, .65, 'sine', .11); },
    error() { tone(330, 0, .2, 'square', .07); tone(247, .03, .34, 'square', .07); },
    pop() { tone(280, 0, .13, 'sine', .16, 900); },
    start() {
      [[311, 0, .7], [466, .2, .7], [622, .4, .8], [554, .66, .7], [831, .9, 1.4]].forEach(n => tone(n[0], n[1], n[2], 'sine', .1));
      [156, 233, 392].forEach(f => tone(f, 0, 2.1, 'triangle', .035));
    },
    tada() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .07, .5, 'triangle', .09)); tone(1568, .3, .9, 'sine', .08); }
  };
  return {
    play(n) { if (P[n]) P[n](); },
    get on() { return on; },
    set(v) { on = v; try { localStorage.setItem('bag-snd', v ? 'on' : 'off'); } catch (e) {} if (!v) this.crackle(false); },
    crackle(go) {
      if (crack) { try { crack.src.stop(); } catch (e) {} crack = null; }
      if (!go || !on) return; const c = ac(); if (!c) return;
      const len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() < .0011 ? (Math.random() * 2 - 1) * .9 : (Math.random() * 2 - 1) * .006;
      const src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
      src.buffer = b; src.loop = true; g.gain.value = .3; f.type = 'highpass'; f.frequency.value = 700;
      src.connect(f); f.connect(g); g.connect(c.destination); src.start(); crack = { src };
    }
  };
})();

/* ============ artwork ============ */
const ARM = `<svg class="arm" viewBox="0 0 100 190" aria-hidden="true"><path d="M88 23 L34 150" stroke="#e6e0ec" stroke-width="7" stroke-linecap="round"/><circle cx="88" cy="23" r="15" fill="#cfd6e6" stroke="#2b1638" stroke-width="4"/><circle cx="88" cy="23" r="5" fill="#2b1638"/><rect x="22" y="146" width="20" height="30" rx="5" fill="#ff6fa8" stroke="#2b1638" stroke-width="4" transform="rotate(22 32 160)"/></svg>`;
const STARSVG = `<svg viewBox="0 0 24 24"><path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10Z"/></svg>`;
const FLAG = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 3q4-2 7 0v7q-3-2-7 0z" fill="#f65314"/><path d="M11 3q4 2 7 0v7q-3 2-7 0z" fill="#7cbb00"/><path d="M2 11q4-2 7 0v7q-3-2-7 0z" fill="#00a1f1"/><path d="M11 11q4 2 7 0v7q-3 2-7 0z" fill="#ffbb00"/></svg>`;

/* ============ sticker layout ============ */
const FIELD = [ // key, x%, y%, width px, rotation, hide-on-phone
  ['lips', 4, 14, 92, -12, ''], ['martini', 7, 51, 84, 9, 'hm'], ['chili', 2, 66, 150, 30, 'hm'],
  ['peach', 80, 19, 122, 8, 'hm'], ['cd', 88, 39, 108, -10, ''], ['sun', 77, 50, 128, 6, 'hm'], ['lime', 85, 62, 118, -8, 'hm'], ['berry', 72, 64, 84, 10, 'hm']
];
const BLOOMS = [ // flower index, x%, y%, width, rotation, hide-on-phone
  [0, 12, 74, 88, -10, ''], [3, 21, 79, 100, 14, ''], [1, 26, 70, 72, -8, 'hm'], [5, 72, 79, 86, -14, ''], [2, 80, 73, 96, 20, 'hm'], [6, 88, 80, 84, -6, ''], [4, 5, 81, 72, 12, 'hm']
];
const BAGSTK = [['cherry', 9, 79, 10, -14], ['lips', 84, 78, 12, 10], ['heart', 44, 88, 9, 8], ['girls', 57, 89, 17, -5]];
const FLIES = [[0, 22, 38, 2, 'fly-r'], [3, 46, 46, 15, 'fly-l'], [4, 58, 52, 27, 'fly-r'], [2, 32, 60, 41, 'fly-l']];
const ITEMS = [
  { id: 'reel', cls: 'i-video', tag: 't-video', label: 'reel log', src: 'videocam' },
  { id: 'photos', cls: 'i-photo', tag: 't-photo', label: 'photo roll', src: 'photocam' },
  { id: 'vinyl', cls: 'i-vinyl', tag: 't-vinyl', label: 'now spinning', src: 'earphones' }
];

/* ============ windows ============ */
const wins = new Map();
let zTop = 100, active = null;
const APPS = {
  reel: { title: 'Reel Log — my Letterboxd diary', short: 'Reel Log', icon: 'video', w: 820, h: 620, mount: mountReel },
  photos: { title: 'Photo Roll', short: 'Photo Roll', icon: 'camera', w: 840, h: 620, mount: mountPhotos },
  vinyl: { title: 'Now Spinning', short: 'Now Spinning', icon: 'vinyl', w: 520, h: 600, mount: mountVinyl, onClose: () => Snd.crackle(false) },
  combo: { title: 'My Typical Combo', short: 'Typical Combo', icon: 'tray', w: 660, h: 560, mount: mountCombo },
  admin: { title: 'Admin — edit my bag', short: 'Admin', icon: 'key', w: 780, h: 640, mount: mountAdmin }
};
function openWin(id) {
  const def = APPS[id]; if (!def) return null;
  if (id === 'admin' && !canEdit) { xpError('Access denied', 'Only the owner of this bag can open the admin. If that is you, open this page while signed in to your Claude account.'); return null; }
  let w = wins.get(id);
  if (w) { w.el.hidden = false; w.min = false; focusWin(id); Snd.play('open'); return w; }
  const vw = innerWidth, vh = innerHeight, W = Math.min(def.w, vw - 24), H = Math.min(def.h, vh - 100), n = wins.size % 4;
  const x = Math.max(8, (vw - W) / 2 + n * 28 - 42), y = Math.max(60, (vh - H - 36) / 2 + n * 28 - 42);
  const el = h('section', { class: 'win', role: 'dialog', 'aria-label': def.title, style: `left:${x}px;top:${y}px;width:${W}px;height:${H}px` });
  const body = h('div', { class: 'wbody' });
  w = { id, def, el, body, min: false, max: false };
  const tb = h('div', { class: 'tb', ondblclick: e => { if (!e.target.closest('.tbtn')) toggleMax(w); } },
    icon(def.icon), h('span', { class: 'ttl' }, def.title),
    h('button', { class: 'tbtn', type: 'button', 'aria-label': 'Minimise', onclick: () => { w.min = true; el.hidden = true; if (active === id) active = null; tasks(); Snd.play('close'); } }, '–'),
    h('button', { class: 'tbtn', type: 'button', 'aria-label': 'Maximise', onclick: () => toggleMax(w) }, '□'),
    h('button', { class: 'tbtn x', type: 'button', 'aria-label': 'Close', onclick: () => closeWin(id) }, '✕'));
  el.append(tb, body); $('#wins').append(el); wins.set(id, w);
  dragWin(tb, el, w);
  el.addEventListener('pointerdown', () => focusWin(id), true);
  def.mount(body, w); focusWin(id); Snd.play('open'); return w;
}
function toggleMax(w) { w.max = !w.max; w.el.classList.toggle('max', w.max); }
function closeWin(id) { const w = wins.get(id); if (!w) return; if (w.def.onClose) w.def.onClose(); w.el.remove(); wins.delete(id); if (active === id) active = null; tasks(); Snd.play('close'); }
function focusWin(id) { const w = wins.get(id); if (!w) return; w.el.style.zIndex = ++zTop; active = id; tasks(); }
function refreshApp(id) { const w = wins.get(id); if (w) w.def.mount(w.body, w); }
function dragWin(tb, el, w) {
  tb.addEventListener('pointerdown', e => {
    if (e.target.closest('.tbtn') || w.max || innerWidth <= 640 || e.button) return;
    const sx = e.clientX, sy = e.clientY, ol = el.offsetLeft, ot = el.offsetTop;
    tb.setPointerCapture(e.pointerId); tb.style.cursor = 'grabbing';
    const mv = ev => { el.style.left = Math.min(innerWidth - 80, Math.max(-el.offsetWidth + 120, ol + ev.clientX - sx)) + 'px'; el.style.top = Math.min(innerHeight - 80, Math.max(0, ot + ev.clientY - sy)) + 'px'; };
    const up = () => { tb.style.cursor = ''; tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); tb.removeEventListener('pointercancel', up); };
    tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up); tb.addEventListener('pointercancel', up);
  });
}
function xpError(title, msg) {
  Snd.play('error');
  const el = h('section', { class: 'win err', role: 'alertdialog', 'aria-label': title });
  const close = () => el.remove();
  const ok = h('button', { class: 'btn', type: 'button', onclick: close }, 'OK');
  el.append(h('div', { class: 'tb' }, h('span', { class: 'ttl' }, title), h('button', { class: 'tbtn x', type: 'button', 'aria-label': 'Close', onclick: close }, '✕')),
    h('div', { class: 'wbody' }, h('div', { class: 'x-ico', 'aria-hidden': 'true' }, '×'), h('div', null, h('p', null, msg), ok)));
  $('#wins').append(el); el.style.zIndex = 500; ok.focus();
}
let balloonT = null;
function balloon(title, msg, sound) {
  const old = $('.balloon'); if (old) old.remove(); clearTimeout(balloonT);
  const b = h('div', { class: 'balloon', role: 'status' }, h('b', null, title), msg, h('button', { type: 'button', 'aria-label': 'Dismiss', onclick: () => b.remove() }, '✕'));
  $('#root').append(b); if (sound) Snd.play('ding'); balloonT = setTimeout(() => b.remove(), 9000);
}

/* ============ taskbar / start menu ============ */
function tasks() {
  const box = $('#tbtns'); if (!box) return; box.replaceChildren();
  for (const [id, w] of wins) {
    box.append(h('button', {
      class: 'tk' + (active === id && !w.min ? ' on' : ''), type: 'button',
      onclick: () => { if (w.min) { w.min = false; w.el.hidden = false; focusWin(id); } else if (active === id) { w.min = true; w.el.hidden = true; active = null; tasks(); } else focusWin(id); }
    }, icon(w.def.icon), h('span', null, w.def.short)));
  }
}
function buildMenu() {
  const old = $('.sm'); if (old) old.remove();
  const item = (ic, label, fn, small) => h('button', { class: 'smi', type: 'button', onclick: () => { closeMenu(); fn(); } }, icon(ic), label, small ? h('small', null, small) : null);
  const m = h('div', { class: 'sm', hidden: true, id: 'startmenu' },
    h('div', { class: 'smh' }, h('span', { class: 'av', 'aria-hidden': 'true' }, 'a'), 'Abhaya'),
    item('video', 'Reel Log', () => openWin('reel')), item('camera', 'Photo Roll', () => openWin('photos')),
    item('vinyl', 'Now Spinning', () => openWin('vinyl')), item('tray', 'My Typical Combo', () => openWin('combo')),
    h('a', { class: 'smi', href: 'https://abhaya-omega.vercel.app/', target: '_blank', rel: 'noopener noreferrer', onclick: closeMenu }, icon('globe'), 'My work', h('small', null, '↗')),
    item('key', 'Admin', () => openWin('admin'), canEdit ? '' : 'owner'),
    h('button', { class: 'smi', type: 'button', id: 'sndbtn', 'aria-pressed': String(Snd.on), onclick: () => { Snd.set(!Snd.on); syncSound(); if (Snd.on) Snd.play('ding'); } }));
  $('#root').append(m);
}
function closeMenu() { const m = $('#startmenu'); if (m) m.hidden = true; }
function toggleMenu() { const m = $('#startmenu'); if (!m) return; m.hidden = !m.hidden; if (!m.hidden) Snd.play('open'); }

/* ============ scene ============ */
function img(src, cls, alt, style) { return h('img', { src, class: cls, alt: alt || '', draggable: 'false', style }); }
function buildScene() {
  const root = $('#root'); root.replaceChildren();
  root.append(h('div', { class: 'bgfx' }));

  // header
  root.append(h('header', { class: 'top' },
    h('button', { class: 'mark', type: 'button', onclick: () => { Snd.play('start'); hopAll(); }, 'aria-label': 'A' }, h('img', { src: STK.A, alt: '', draggable: 'false' })),
    h('nav', { class: 'nav', 'aria-label': 'Site' },
      h('a', { class: 'nl work', href: 'https://abhaya-omega.vercel.app/', target: '_blank', rel: 'noopener noreferrer' }, icon('globe'), 'my work', h('span', { class: 'long' }, ' · abhaya-omega.vercel.app'), ' ↗'))));

  // loose stickers
  const field = h('div', { class: 'field' });
  FIELD.forEach(f => field.append(h('img', { class: 'stk ' + f[5], src: STK.disco[f[0]], alt: '', draggable: 'false', style: `--x:${f[1]};--y:${f[2]};--w:${f[3]};--r:${f[4]}deg` })));
  BLOOMS.forEach(f => field.append(h('img', { class: 'stk flower ' + f[5], src: STK.flowers[f[0]], alt: '', draggable: 'false', style: `--x:${f[1]};--y:${f[2]};--w:${f[3]};--r:${f[4]}deg` })));
  root.append(field);
  field.querySelectorAll('.stk').forEach(dragSticker);
  FLIES.forEach(f => {
    const b = h('button', { class: 'fly', type: 'button', 'aria-label': 'dragonfly', style: `--y:${f[1]}%;--d:${f[2]}s;--delay:${f[3]}s;--path:${f[4]}`, onclick: e => { sparkBurst(e.clientX, e.clientY); Snd.play('ding'); } }, h('img', { src: STK.dflies[f[0]], alt: '', draggable: 'false' }));
    root.append(b);
  });
  root.append(h('button', { class: 'ball', type: 'button', 'aria-label': 'Disco ball. Click for disco mode.', onclick: discoMode }, img(STK.disco.ball, '', '')));

  // bag
  const bag = h('div', { class: 'bag' });
  ITEMS.forEach(it => {
    const d = h('div', { class: 'item ' + it.cls, 'data-id': it.id, role: 'button', tabindex: '0', 'aria-label': it.label, onclick: () => poke(it.id), onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(it.id); } } }, h('img', { src: STK[it.src], alt: '', draggable: 'false' }));
    bag.append(d);
  });
  bag.append(h('img', { class: 'bagimg', src: STK.bag, alt: '', draggable: 'false' }));
  bag.append(h('div', { class: 'bag-hit', 'aria-hidden': 'true', onclick: () => { Snd.play('start'); hopAll(); } }));
  BAGSTK.forEach(s => bag.append(h('img', { class: 'bagstk', src: STK.disco[s[0]], alt: '', style: `left:${s[1]}cqw;top:${s[2]}cqw;width:${s[3]}cqw;--r:${s[4]}deg` })));
  bag.append(h('img', { class: 'bagclip', src: STK.clips[5], alt: '', style: 'left:7cqw;top:42cqw;width:10cqw;--r:-14deg' }),
    h('img', { class: 'bagclip', src: STK.clips[8], alt: '', style: 'left:85cqw;top:40cqw;width:10cqw;--r:14deg' }));
  [[16, 30, 0], [78, 28, 1], [90, 62, 2], [6, 70, 1.6]].forEach(g => bag.append(h('span', { class: 'glint', 'aria-hidden': 'true', style: `left:${g[0]}cqw;top:${g[1]}cqw;--dl:${g[2]}s`, html: STARSVG })));
  bag.querySelectorAll('.item').forEach(it => {
    it.addEventListener('mouseenter', () => it.classList.add('lift'));
    it.addEventListener('mouseleave', () => it.classList.remove('lift'));
    it.addEventListener('focus', () => it.classList.add('lift'));
    it.addEventListener('blur', () => it.classList.remove('lift'));
  });
  const tag = h('p', { class: 'tagline', id: 'tagline' });
  root.append(h('main', { class: 'scene' }, tag, bag));
  setTagline();

  root.append(h('div', { id: 'wins' }));
  // taskbar
  root.append(h('div', { class: 'task' },
    h('button', { class: 'start', type: 'button', 'aria-haspopup': 'true', onclick: e => { e.stopPropagation(); toggleMenu(); }, html: FLAG + '<span>start</span>' }),
    h('div', { class: 'tbtns', id: 'tbtns' }),
    h('div', { class: 'trayr' },
      h('button', { class: 'pubtray', type: 'button', id: 'pubtray', hidden: true, onclick: () => publish() }, 'publish changes'),
      h('span', { id: 'clock' }))));
  buildMenu(); syncSound(); tick();
}
function setTagline() { const t = $('#tagline'); if (!t) return; const v = (S.settings.tagline || '').trim(); t.textContent = v; t.hidden = !v; }
function syncSound() { const b = $('#sndbtn'); if (!b) return; b.replaceChildren(icon(Snd.on ? 'spkon' : 'spkoff'), Snd.on ? 'Sound effects: on' : 'Sound effects: off'); b.setAttribute('aria-pressed', String(Snd.on)); }
function tick() { const c = $('#clock'); if (c) c.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function lift(id, on) { const it = $('.item[data-id="' + id + '"]'); if (it) it.classList.toggle('lift', on); }
function poke(id) {
  const it = $('.item[data-id="' + id + '"]');
  if (it) { it.classList.remove('hop'); void it.offsetWidth; it.classList.add('hop'); setTimeout(() => it.classList.remove('hop'), 650); }
  Snd.play('pop'); setTimeout(() => openWin(id), 180);
}
function hopAll() { document.querySelectorAll('.item').forEach((it, i) => { setTimeout(() => { it.classList.remove('hop'); void it.offsetWidth; it.classList.add('hop'); setTimeout(() => it.classList.remove('hop'), 650); }, i * 110); }); }
let discoT = null;
function discoMode() {
  const r = $('#root'); Snd.play('tada'); r.classList.add('disco'); clearTimeout(discoT);
  for (let i = 0; i < 14; i++) setTimeout(() => spawnBloom(Math.random() * r.clientWidth, Math.random() * r.clientHeight * .7 + 60), i * 120);
  discoT = setTimeout(() => r.classList.remove('disco'), 6000);
}
function dragSticker(elm) {
  elm.addEventListener('pointerdown', e => {
    if (e.button) return; e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, ol = elm.offsetLeft, ot = elm.offsetTop;
    elm.style.left = ol + 'px'; elm.style.top = ot + 'px'; elm.classList.add('drag'); elm.setPointerCapture(e.pointerId); Snd.play('click');
    const mv = ev => { elm.style.left = (ol + ev.clientX - sx) + 'px'; elm.style.top = (ot + ev.clientY - sy) + 'px'; };
    const up = () => { elm.classList.remove('drag'); elm.removeEventListener('pointermove', mv); elm.removeEventListener('pointerup', up); elm.removeEventListener('pointercancel', up); };
    elm.addEventListener('pointermove', mv); elm.addEventListener('pointerup', up); elm.addEventListener('pointercancel', up);
  });
}
function spawnBloom(x, y) {
  if (reduced) return; const r = $('#root');
  const b = h('img', { class: 'bloom', src: rand(STK.flowers), alt: '', style: `left:${x}px;top:${y}px;--w:${60 + Math.random() * 40}px` });
  r.append(b); b.addEventListener('animationend', () => b.remove());
}
function sparkBurst(cx, cy) {
  if (reduced) return; const r = $('#root'), rc = r.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    const s = h('span', { class: 'spk', style: `left:${cx - rc.left + (Math.random() * 60 - 30)}px;top:${cy - rc.top + (Math.random() * 60 - 30)}px;color:${rand(['#ff6fa8', '#cbb8ff', '#ffd166', '#a9c8ff'])}` }, '✦');
    r.append(s); s.addEventListener('animationend', () => s.remove());
  }
}
let lastSpk = 0;
function trail(e) {
  if (reduced || e.pointerType === 'touch') return; const now = performance.now(); if (now - lastSpk < 55) return; lastSpk = now;
  const r = $('#root'), rc = r.getBoundingClientRect();
  const s = h('span', { class: 'spk', style: `left:${e.clientX - rc.left}px;top:${e.clientY - rc.top}px;color:${rand(['#ff6fa8', '#cbb8ff', '#ffd166', '#a9c8ff'])}` }, '✦');
  r.append(s); s.addEventListener('animationend', () => s.remove());
}

/* ============ reel log ============ */
function mountReel(body) {
  body.replaceChildren();
  const q = { text: '', sort: 'recent', f: 'all' };
  const list = h('div', { class: 'reel-list' }), stats = h('div', { class: 'reel-stats' });
  const search = h('input', { class: 'search', type: 'search', id: 'reel-q', placeholder: 'search my films…', 'aria-label': 'Search films', oninput: e => { q.text = e.target.value.trim().toLowerCase(); draw(); } });
  const sort = h('select', { class: 'sel', id: 'reel-sort', 'aria-label': 'Sort films', onchange: e => { q.sort = e.target.value; draw(); } },
    h('option', { value: 'recent' }, 'recently watched'), h('option', { value: 'rating' }, 'highest rated'), h('option', { value: 'title' }, 'A to Z'), h('option', { value: 'year' }, 'newest release'));
  const chipDefs = [['all', 'all'], ['5', '5★'], ['4', '4★ and up'], ['rev', 'with a review']];
  const chips = h('div', { class: 'chips' });
  const chipEls = chipDefs.map(c => { const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(c[0] === 'all'), onclick: () => { q.f = c[0]; chipEls.forEach((x, i) => x.setAttribute('aria-pressed', String(chipDefs[i][0] === q.f))); draw(); } }, c[1]); chips.append(b); return b; });
  body.append(h('div', { class: 'reel-head' }, search, sort, chips), stats, list);
  function card(m) {
    const has = !!(m.review && m.review.trim());
    const art = h('article', { class: 'tix ' + tone(m.rating) });
    const btn = h('button', { class: 'tix-btn', type: 'button', 'aria-expanded': 'false', onclick: () => { const o = art.classList.toggle('open'); btn.setAttribute('aria-expanded', String(o)); Snd.play('click'); } },
      h('span', { class: 'stub' }, h('b', null, m.rating ? String(m.rating) : '–'), h('i', null, stars(m.rating))),
      h('span', { class: 'tix-main' }, h('span', { class: 'tix-t' }, m.name),
        h('span', { class: 'tix-m' }, [m.year, m.watched ? fmtDate(m.watched) : null, m.rewatch ? '↻ rewatch' : null].filter(Boolean).join(' · ')),
        has ? h('span', { class: 'tix-x' }, m.review) : null));
    const u = okUrl(m.uri);
    art.append(btn, h('div', { class: 'tix-d' }, u ? h('a', { href: u, target: '_blank', rel: 'noopener noreferrer' }, 'open on Letterboxd ↗') : (has ? '' : 'no review yet')));
    return art;
  }
  function draw() {
    let ms = S.movies.slice();
    if (q.text) ms = ms.filter(m => (m.name || '').toLowerCase().includes(q.text) || String(m.year || '').includes(q.text));
    if (q.f === '5') ms = ms.filter(m => m.rating === 5);
    if (q.f === '4') ms = ms.filter(m => m.rating >= 4);
    if (q.f === 'rev') ms = ms.filter(m => m.review && m.review.trim());
    const cmp = { recent: byRecent, rating: (a, b) => (b.rating || 0) - (a.rating || 0) || byRecent(a, b), title: (a, b) => (a.name || '').localeCompare(b.name || ''), year: (a, b) => (b.year || 0) - (a.year || 0) || byRecent(a, b) };
    ms.sort(cmp[q.sort]);
    const all = S.movies, rated = all.filter(m => m.rating > 0);
    const avg = rated.length ? (rated.reduce((a, m) => a + m.rating, 0) / rated.length).toFixed(2) : '–';
    stats.replaceChildren(...[h('span', null, h('b', null, all.length), ' films logged'), h('span', null, 'average ', h('b', null, avg), '★'), all.some(m => m.review && m.review.trim()) ? h('span', null, h('b', null, all.filter(m => m.review && m.review.trim()).length), ' reviews') : null, h('span', null, h('b', null, all.filter(m => m.rewatch).length), ' rewatches')].filter(Boolean));
    list.replaceChildren(...ms.map(card));
    if (!ms.length) list.replaceChildren(h('div', { class: 'empty', style: 'grid-column:1/-1' }, all.length ? 'nothing matches that' : 'the reel is empty', h('small', null, all.length ? 'try another word or clear the filter' : 'films appear here once they are logged in the admin')));
  }
  draw();
}

/* ============ photo roll ============ */
function mountPhotos(body) {
  body.replaceChildren();
  const rots = [-2.6, 1.8, -1.2, 2.7, -2, 1.1, -2.9, 2.2];
  const posts = S.posts.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  function grid() {
    body.replaceChildren();
    if (!posts.length) {
      body.append(h('div', { class: 'empty' }, 'no photos on the roll yet', h('small', null, canEdit ? 'add the first one from Admin → posts' : 'check back soon')));
      return;
    }
    body.append(h('div', { class: 'pgrid' }, posts.map((p, i) => {
      const b = h('button', { class: 'pol', type: 'button', style: `--r:${rots[i % rots.length]}deg`, onclick: () => detail(p), 'aria-label': p.title || 'post' },
        h('img', { class: 'clip', src: STK.clips[(i * 5 + 1) % STK.clips.length], alt: '', style: `--cr:${(i % 3 - 1) * 6}deg` }),
        p.photo ? h('img', { class: 'ph', src: p.photo, alt: p.title || '' }) : h('span', { class: 'note' }, (p.body || p.title || '').slice(0, 90)),
        h('span', { class: 'cap' }, p.title || 'untitled'), h('span', { class: 'dt' }, fmtDate(p.date)));
      return b;
    })));
  }
  function detail(p) {
    body.replaceChildren(); body.scrollTop = 0;
    const v = okUrl(p.video);
    body.append(h('div', { class: 'pdetail' },
      h('button', { class: 'btn alt', type: 'button', onclick: grid }, '← back to the roll'),
      p.photo ? h('img', { class: 'bigph', src: p.photo, alt: p.title || '' }) : null,
      h('h2', null, p.title || 'untitled'), h('div', { class: 'dt' }, fmtDate(p.date)),
      p.body ? h('div', { class: 'txt' }, p.body) : null,
      v ? h('a', { class: 'btn gold', href: v, target: '_blank', rel: 'noopener noreferrer' }, 'watch the video ↗') : null));
  }
  grid();
}

/* ============ vinyl ============ */
function mountVinyl(body) {
  body.replaceChildren(); Snd.crackle(false);
  const url = okUrl(S.settings.spotify), label = (S.settings.spotifyLabel || '').trim() || 'my Spotify';
  const deck = h('div', { class: 'deck', html: '<img class="rec" alt="" draggable="false" src="' + STK.vinyl + '">' + ARM });
  let on = false;
  const play = h('button', { class: 'btn', type: 'button', 'aria-pressed': 'false', onclick: () => { on = !on; deck.classList.toggle('on', on); play.textContent = on ? 'lift the needle' : 'drop the needle'; play.setAttribute('aria-pressed', String(on)); Snd.crackle(on); } }, 'drop the needle');
  body.append(h('div', { class: 'vwrap' }, deck, h('h2', null, label),
    h('p', null, url ? 'Drop the needle for some crackle, then open the real thing on Spotify.' : 'No Spotify link yet.' + (canEdit ? ' Add one in Admin → site.' : '')),
    h('div', { class: 'vrow' }, play, url ? h('a', { class: 'btn gold', href: url, target: '_blank', rel: 'noopener noreferrer' }, 'open in Spotify ↗') : null)));
}

/* ============ typical combo ============ */
function mountCombo(body) {
  body.replaceChildren();
  const ms = S.movies, rated = ms.filter(m => m.rating > 0);
  const avg = rated.length ? (rated.reduce((a, m) => a + m.rating, 0) / rated.length).toFixed(2) : '–';
  const five = [...new Set(ms.filter(m => m.rating === 5).map(m => m.name))];
  const last = ms.slice().sort(byRecent).slice(0, 3);
  const dec = {}; ms.filter(m => m.rating >= 4 && m.year).forEach(m => { const d = Math.floor(m.year / 10) * 10; dec[d] = (dec[d] || 0) + 1; });
  const top = Object.entries(dec).sort((a, b) => b[1] - a[1])[0];
  const ul = (arr, more) => h('ul', null, arr.map(x => h('li', null, x)), more > 0 ? h('li', null, '+ ' + more + ' more') : null);
  body.append(h('div', { class: 'cwrap' }, h('div', { class: 'tray' },
    h('div', { class: 'cmp' }, h('h3', null, '5★ club'), five.length ? ul(five.slice(0, 6), five.length - 6) : h('p', null, 'no five-star films yet')),
    h('div', { class: 'cmp' }, h('h3', null, 'lately'), ul(last.map(m => m.name + ' ' + stars(m.rating)))),
    h('div', { class: 'cmp' }, h('h3', null, 'average rating'), h('div', { class: 'big' }, avg), h('p', null, 'across ' + rated.length + ' rated films')),
    h('div', { class: 'cmp' }, h('h3', null, 'most loved decade'), h('div', { class: 'big' }, top ? top[0] + 's' : '–'), h('p', null, top ? top[1] + ' films rated 4★ or more' : 'rate a few films first')),
    h('div', { class: 'cmp wide' }, h('h3', null, 'on the tray'), h('p', null, ms.length + ' films logged, ' + ms.filter(m => m.rewatch).length + ' watched again'))),
    h('p', { class: 'csub' }, 'is this all of me?')));
}

/* ============ admin ============ */
const field = (label, ctl, hint, cls) => h('label', { class: 'fld ' + (cls || '') }, h('span', null, label), ctl, hint ? h('small', null, hint) : null);
function delBtn(onConfirm) {
  let armed = false, t; const b = h('button', { class: 'sm-btn danger', type: 'button', onclick: () => {
    if (!armed) { armed = true; b.textContent = 'sure?'; b.classList.add('arm2'); t = setTimeout(() => { armed = false; b.textContent = 'delete'; b.classList.remove('arm2'); }, 2600); }
    else { clearTimeout(t); onConfirm(); }
  } }, 'delete'); return b;
}
function ratingSel() { const s = h('select', { class: 'sel', id: 'mv-rating' }, h('option', { value: '0' }, 'no rating')); for (let r = 5; r >= .5; r -= .5) s.append(h('option', { value: String(r) }, r + '  ' + stars(r))); return s; }
function markDirty() { dirty = true; syncPub(); }
function afterMovies() { markDirty(); refreshApp('reel'); refreshApp('combo'); }
function afterPosts() { markDirty(); refreshApp('photos'); }

function moviesPane() {
  const root = h('div'); let editId = null;
  const name = h('input', { class: 'inp', id: 'mv-name', placeholder: 'e.g. Charulata', autocomplete: 'off' });
  const year = h('input', { class: 'inp', id: 'mv-year', type: 'number', min: '1880', max: '2100', placeholder: '1964' });
  const rating = ratingSel();
  const date = h('input', { class: 'inp', id: 'mv-date', type: 'date', value: todayISO() });
  const uri = h('input', { class: 'inp', id: 'mv-uri', type: 'url', placeholder: 'https://boxd.it/…' });
  const rew = h('input', { type: 'checkbox', id: 'mv-rew' });
  const review = h('textarea', { class: 'ta', id: 'mv-review', placeholder: 'what did you think?' });
  const title = h('h3', null, 'log a movie');
  const saveBtn = h('button', { class: 'btn', type: 'button', onclick: save }, 'add to reel log');
  const msg = h('span', { class: 'pubmsg', role: 'status' });
  function reset() { editId = null; name.value = ''; year.value = ''; rating.value = '0'; date.value = todayISO(); uri.value = ''; rew.checked = false; review.value = ''; title.textContent = 'log a movie'; saveBtn.textContent = 'add to reel log'; }
  function save() {
    const n = name.value.trim(); if (!n) { msg.textContent = 'Add a title first.'; name.focus(); return; }
    const rec = { name: n, year: +year.value || null, rating: +rating.value || 0, watched: date.value || todayISO(), rewatch: rew.checked, review: review.value.trim(), uri: uri.value.trim() };
    if (editId) { const m = S.movies.find(x => x.id === editId); if (m) Object.assign(m, rec); } else S.movies.unshift(Object.assign({ id: newId(), logged: todayISO(), tags: '' }, rec));
    msg.textContent = (editId ? 'Saved ' : 'Added ') + n + '. Publish to put it on the site.'; Snd.play('ding'); reset(); afterMovies(); drawList();
  }
  function edit(m) {
    editId = m.id; name.value = m.name || ''; year.value = m.year || ''; rating.value = String(m.rating || 0); date.value = m.watched || todayISO(); uri.value = m.uri || ''; rew.checked = !!m.rewatch; review.value = m.review || '';
    title.textContent = 'editing ' + m.name; saveBtn.textContent = 'save changes'; const p = root.closest('.apane'); if (p) p.scrollTo({ top: 0, behavior: 'smooth' }); review.focus();
  }
  const form = h('div', { class: 'form' }, title, field('title', name, null, 'full'), field('year', year), field('rating', rating), field('date watched', date), h('label', { class: 'chk' }, rew, 'watched it again'),
    field('Letterboxd link (optional)', uri, null, 'full'), field('review', review, null, 'full'),
    h('div', { class: 'full vrow', style: 'justify-content:flex-start' }, saveBtn, h('button', { class: 'btn alt', type: 'button', onclick: reset }, 'clear'), msg));
  const q = h('input', { class: 'search', type: 'search', id: 'mv-find', placeholder: 'find a film to edit…', 'aria-label': 'Find a film', oninput: drawList });
  const list = h('div');
  function drawList() {
    const t = q.value.trim().toLowerCase();
    const ms = S.movies.slice().sort(byRecent).filter(m => !t || (m.name || '').toLowerCase().includes(t)).slice(0, 150);
    list.replaceChildren(...ms.map(m => h('div', { class: 'arow' },
      h('div', { class: 'nm' }, m.name, h('small', null, [m.year, stars(m.rating), m.review ? 'reviewed' : ''].filter(Boolean).join(' · '))),
      h('button', { class: 'sm-btn', type: 'button', onclick: () => edit(m) }, 'edit'),
      delBtn(() => { S.movies = S.movies.filter(x => x.id !== m.id); afterMovies(); drawList(); }))));
    if (!ms.length) list.replaceChildren(h('div', { class: 'empty' }, 'no films match'));
  }
  drawList(); root.append(form, q, list); return root;
}

function compress(file, max, qual) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.width * s)); c.height = Math.max(1, Math.round(im.height * s));
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', qual));
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('That file could not be read as a picture. Try a JPG or PNG.')); };
    im.src = url;
  });
}

function postsPane() {
  const root = h('div'); let editId = null, photo = '';
  const title = h('input', { class: 'inp', id: 'po-title', placeholder: 'a name for this post', autocomplete: 'off' });
  const date = h('input', { class: 'inp', id: 'po-date', type: 'date', value: todayISO() });
  const video = h('input', { class: 'inp', id: 'po-video', type: 'url', placeholder: 'https://youtube.com/… (optional vlog link)' });
  const bodyT = h('textarea', { class: 'ta', id: 'po-body', placeholder: 'write about it…' });
  const file = h('input', { class: 'inp', id: 'po-file', type: 'file', accept: 'image/*', onchange: async e => {
    const f = e.target.files[0]; if (!f) return; msg.textContent = 'Shrinking the picture…';
    try { photo = await compress(f, 1280, .74); showPrev(); msg.textContent = 'Picture ready (' + Math.round(photo.length / 1024) + ' KB).'; } catch (err) { msg.textContent = err.message; }
  } });
  const prev = h('div', { class: 'full' }), msg = h('span', { class: 'pubmsg', role: 'status' });
  const h3 = h('h3', null, 'new post'), saveBtn = h('button', { class: 'btn', type: 'button', onclick: save }, 'add post');
  function showPrev() { prev.replaceChildren(); if (photo) prev.append(h('img', { class: 'preview', src: photo, alt: 'Selected photo' }), h('div', null, h('button', { class: 'sm-btn', type: 'button', onclick: () => { photo = ''; file.value = ''; showPrev(); } }, 'remove photo'))); }
  function reset() { editId = null; photo = ''; title.value = ''; date.value = todayISO(); video.value = ''; bodyT.value = ''; file.value = ''; h3.textContent = 'new post'; saveBtn.textContent = 'add post'; showPrev(); }
  function save() {
    if (!title.value.trim() && !photo && !bodyT.value.trim()) { msg.textContent = 'Add a title, a photo or some words first.'; return; }
    const rec = { title: title.value.trim(), date: date.value || todayISO(), body: bodyT.value.trim(), photo, video: video.value.trim() };
    if (editId) { const p = S.posts.find(x => x.id === editId); if (p) Object.assign(p, rec); } else S.posts.unshift(Object.assign({ id: newId() }, rec));
    msg.textContent = 'Saved. Publish to put it on the site.'; Snd.play('ding'); reset(); afterPosts(); drawList();
  }
  function edit(p) { editId = p.id; photo = p.photo || ''; title.value = p.title || ''; date.value = p.date || todayISO(); video.value = p.video || ''; bodyT.value = p.body || ''; h3.textContent = 'editing post'; saveBtn.textContent = 'save changes'; showPrev(); const pn = root.closest('.apane'); if (pn) pn.scrollTo({ top: 0, behavior: 'smooth' }); }
  const form = h('div', { class: 'form' }, h3, field('title', title, null, 'full'), field('date', date), field('photo', file, 'JPG or PNG. It is shrunk to about 1280 px so the page stays light.'), prev, field('what happened', bodyT, null, 'full'), field('vlog or video link', video, 'Videos open on their own site in a new tab.', 'full'),
    h('div', { class: 'full vrow', style: 'justify-content:flex-start' }, saveBtn, h('button', { class: 'btn alt', type: 'button', onclick: reset }, 'clear'), msg));
  const list = h('div');
  function drawList() {
    const ps = S.posts.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    list.replaceChildren(...ps.map(p => h('div', { class: 'arow' }, p.photo ? h('img', { class: 'ph-s', src: p.photo, alt: '' }) : null,
      h('div', { class: 'nm' }, p.title || 'untitled', h('small', null, fmtDate(p.date))),
      h('button', { class: 'sm-btn', type: 'button', onclick: () => edit(p) }, 'edit'),
      delBtn(() => { S.posts = S.posts.filter(x => x.id !== p.id); afterPosts(); drawList(); }))));
    if (!ps.length) list.replaceChildren(h('div', { class: 'empty' }, 'no posts yet'));
  }
  drawList(); root.append(form, list); return root;
}

function sitePane() {
  const sp = h('input', { class: 'inp', id: 'st-sp', type: 'url', placeholder: 'https://open.spotify.com/…', value: S.settings.spotify || '', oninput: e => { S.settings.spotify = e.target.value.trim(); markDirty(); refreshApp('vinyl'); } });
  const lb = h('input', { class: 'inp', id: 'st-lb', placeholder: 'e.g. late night drive', value: S.settings.spotifyLabel || '', oninput: e => { S.settings.spotifyLabel = e.target.value; markDirty(); refreshApp('vinyl'); } });
  const tg = h('input', { class: 'inp', id: 'st-tg', placeholder: 'leave empty for no line', value: S.settings.tagline || '', oninput: e => { S.settings.tagline = e.target.value; markDirty(); setTagline(); } });
  return h('div', null, h('p', { class: 'hint' }, 'These show on the vinyl window and above the bag.'),
    h('div', { class: 'form' }, field('Spotify link', sp, 'Paste a profile, playlist or album link. Only https links are used.', 'full'), field('title on the record', lb, null, 'full'), field('line above the bag', tg, null, 'full')));
}

function parseCSV(t) {
  const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; r.push(f); f = ''; if (r.length > 1 || r[0] !== '') rows.push(r); r = []; }
    else f += c;
  }
  if (f !== '' || r.length) { r.push(f); rows.push(r); }
  return rows;
}
function mergeCSV(text) {
  const rows = parseCSV(text.replace(/^﻿/, '')); if (rows.length < 2) throw new Error('That file has no rows.');
  const head = rows[0].map(x => x.trim()), ix = n => head.indexOf(n);
  if (ix('Name') < 0) throw new Error('This does not look like a Letterboxd export. It needs a Name column.');
  let added = 0, updated = 0;
  for (const r of rows.slice(1)) {
    const g = n => { const i = ix(n); return i >= 0 ? (r[i] || '').trim() : ''; };
    const name = g('Name'); if (!name) continue;
    const rec = { name, year: +g('Year') || null, rating: parseFloat(g('Rating')) || 0, watched: g('Watched Date') || g('Date') || '', logged: g('Date') || '', uri: g('Letterboxd URI'), rewatch: /^yes$/i.test(g('Rewatch')) };
    const rv = g('Review');
    const m = S.movies.find(x => rec.uri && x.uri === rec.uri) || S.movies.find(x => x.name === rec.name && x.year === rec.year && x.watched === rec.watched);
    if (m) {
      const before = JSON.stringify([m.rating, m.watched, m.rewatch, m.uri, m.review]);
      m.rating = rec.rating; m.rewatch = rec.rewatch; m.watched = rec.watched || m.watched; m.uri = rec.uri || m.uri; m.year = rec.year || m.year; if (rv) m.review = rv;
      if (before !== JSON.stringify([m.rating, m.watched, m.rewatch, m.uri, m.review])) updated++;
    } else { S.movies.push({ id: rec.uri || newId(), tags: '', review: rv, name: rec.name, year: rec.year, rating: rec.rating, watched: rec.watched, logged: rec.logged, uri: rec.uri, rewatch: rec.rewatch }); added++; }
  }
  return { added, updated };
}
function importPane() {
  const msg = h('p', { class: 'hint', role: 'status' });
  const file = h('input', { class: 'inp', id: 'im-file', type: 'file', accept: '.csv,text/csv', onchange: async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const r = mergeCSV(await f.text()); msg.textContent = 'Done: ' + r.added + ' new, ' + r.updated + ' updated. Reviews you already wrote are kept.'; if (r.added || r.updated) { afterMovies(); Snd.play('ding'); } }
    catch (err) { msg.textContent = err.message; Snd.play('error'); }
    file.value = '';
  } });
  return h('div', null, h('p', { class: 'hint' }, 'Export your data from Letterboxd (Settings → Data), then drop diary.csv or reviews.csv here. New films are added, and existing ones are matched by their Letterboxd link so nothing doubles up.'),
    h('div', { class: 'form' }, field('Letterboxd export (.csv)', file, null, 'full')), msg);
}

function mountAdmin(body) {
  body.replaceChildren(); body.classList.add('admin');
  const panes = { movies: moviesPane, posts: postsPane, site: sitePane, import: importPane };
  const labels = { movies: 'movies', posts: 'posts', site: 'site', import: 'import' };
  const pane = h('div', { class: 'apane' }), tabs = h('div', { class: 'tabs', role: 'tablist' });
  function show(t) {
    adminTab = t; tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === t)));
    pane.replaceChildren(panes[t]()); pane.scrollTop = 0;
  }
  Object.keys(panes).forEach(t => tabs.append(h('button', { type: 'button', role: 'tab', 'data-t': t, 'aria-selected': 'false', onclick: () => show(t) }, labels[t])));
  const bar = h('div', { class: 'pubbar' }, h('span', { class: 'pubmsg', role: 'status' }), h('button', { class: 'btn pubbtn', type: 'button', onclick: () => publish() }, 'publish to the site'));
  body.append(tabs, pane, bar); show(adminTab); syncPub();
}

/* ============ publishing (the page rewrites itself with the new content) ============ */
function syncPub() {
  const kb = Math.round(JSON.stringify(S).length / 1024), size = kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB';
  const msg = publishing ? 'Publishing…' : dirty ? 'You have unpublished changes. Page size about ' + size + ' of 16 MB.' : 'Everything is published. Page size about ' + size + ' of 16 MB.';
  document.querySelectorAll('.pubmsg').forEach(n => { if (n.closest('.pubbar')) { n.textContent = msg; n.classList.toggle('dirty', dirty); } });
  document.querySelectorAll('.pubbtn').forEach(b => { b.disabled = !dirty || publishing; });
  const t = $('#pubtray'); if (t) t.hidden = !(dirty && canEdit);
}
const escJSON = s => s.replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
function buildDoc() {
  const reset = document.head.querySelector('style');
  let out = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>' + (reset ? reset.textContent : '') + '</style></head><body>';
  document.querySelectorAll('[data-s]').forEach(n => {
    if (n.id === 'root') out += '<div data-s id="root"></div>';
    else if (n.id === 'state') out += '<script data-s id="state" type="application/json">' + escJSON(JSON.stringify(S)) + '<\/script>';
    else out += n.outerHTML;
  });
  return out + '</body></html>';
}
async function publish() {
  if (publishing || !dirty) return;
  if (!canEdit) { xpError('Access denied', 'Only the owner can publish changes.'); return; }
  const c = window.claude; let art = null;
  try { art = c && c.use ? await c.use('artifact') : null; } catch (e) {}
  if (!art) { xpError('Cannot publish here', 'Publishing only works on the live page, opened while signed in as the owner.'); return; }
  const doc = buildDoc();
  if (doc.length > 15.5 * 1024 * 1024) { xpError('Too much for one page', 'The page is over 15 MB. Delete a few big photos, then publish again.'); return; }
  publishing = true; syncPub();
  try { sessionStorage.setItem('bag-reopen', 'admin'); } catch (e) {}
  try { await art.publish(doc); dirty = false; publishing = false; Snd.play('tada'); syncPub(); balloon('Published', 'Your changes are live. The page reloads with the new version.', false); }
  catch (err) {
    publishing = false; syncPub(); try { sessionStorage.removeItem('bag-reopen'); } catch (e) {}
    const code = err && err.code;
    if (code === 'conflict') xpError('Someone saved first', 'A newer version was published while you were editing. The page will reload to it, so make your change again.');
    else if (code === 'not_granted' || code === 'not_writer') xpError('Access denied', 'This account cannot publish this page.');
    else xpError('Could not publish', (err && err.message) || 'Something went wrong. Your edits are still here, so try again.');
  }
}

/* ============ start ============ */
async function init() {
  buildScene();
  const root = $('#root');
  root.addEventListener('pointerdown', e => {
    if (!e.target.closest('.start,.sm')) closeMenu();
  });
  root.addEventListener('click', e => {
    if (e.target.closest('button,a,.win,.item,.stk,.top,.task,.tag,.fly,.sm,.balloon,.bag-hit,.ball')) return;
    const rc = root.getBoundingClientRect(); spawnBloom(e.clientX - rc.left, e.clientY - rc.top); Snd.play('pop');
  });
  document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('button,a,.item')) Snd.play('click'); }, true);
  document.addEventListener('pointermove', trail);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); if (active && wins.has(active) && !e.target.closest('input,textarea,select')) closeWin(active); } });
  setInterval(tick, 30000);
  const hs = location.hash.slice(1); if (APPS[hs] && hs !== 'admin') openWin(hs);
  const c = window.claude;
  if (c && c.use) { try { const U = await c.use('user'); canEdit = !!(U && (U.canEdit() || U.isOwner())); } catch (e) {} }
  buildMenu(); syncPub();
  let re = null; try { re = sessionStorage.getItem('bag-reopen'); sessionStorage.removeItem('bag-reopen'); } catch (e) {}
  if (re === 'admin' && canEdit) openWin('admin');
  else if (!wins.size) setTimeout(() => { if (!wins.size) balloon('psst', 'Tap what is poking out of the bag. Stickers can be dragged around, and the disco ball does something.', false); }, 1400);
}
init();
})();

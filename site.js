/* =====================================================================
   GK-2026 · site behaviour
   No dependencies. Everything degrades to a readable static page.
   ===================================================================== */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EMAIL = 'srigovardhan96@gmail.com';
  var GK = window.GK = window.GK || {};

  function el(tag, attrs, parent) {
    var n = doc.createElementNS(SVGNS, tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, cls, extra) {
    var t = el('text', Object.assign({ x: x, y: y, 'class': cls || '' }, extra || {}), parent);
    t.textContent = s; return t;
  }
  function rng(seed) { // mulberry32, deterministic so the die looks the same every visit
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ===================================================================
     DIE: procedural layout, floorplan → signoff
     =================================================================== */
  var C = {
    die: '#101318', dieEdge: '#58616d', seal: '#2a3139', pad: '#b8923a', padEdge: '#e2c068',
    core: '#6a7480', macro: '#16263b', macroEdge: '#4f86d9', macroTxt: '#79a3ea',
    vdd: '#e08a4a', vss: '#6fa8dc',
    cells: ['#2f8f6b', '#38a27a', '#2a7d5f', '#46b389', '#23694f', '#3b9670'],
    clk: '#ffd166', leaf: '#ffe7a1', m2: '#c678dd', m3: '#4fb3c8', via: '#e9edf1', ok: '#3ddc97'
  };
  var CORE = { x: 64, y: 64, w: 472, h: 472 };
  var MACROS = [[80, 80, 148, 106], [372, 80, 148, 106], [80, 414, 106, 106], [414, 414, 106, 106]];

  function buildDie(svg) {
    var R = rng(20260907);
    svg.innerHTML = '';

    // --- floorplan: die, seal ring, IO pads, core, macros
    var fp = el('g', { 'class': 'L L-fp' }, svg);
    el('rect', { x: 8, y: 8, width: 584, height: 584, rx: 3, fill: C.die, stroke: C.dieEdge, 'stroke-width': 1.5 }, fp);
    el('rect', { x: 16, y: 16, width: 568, height: 568, rx: 2, fill: 'none', stroke: C.seal, 'stroke-width': 3 }, fp);
    var n = 13, s0 = 58, step = (542 - 58) / (n - 1);
    for (var i = 0; i < n; i++) {
      var p = s0 + i * step;
      [[p - 12, 22, 24, 14], [p - 12, 564, 24, 14], [22, p - 12, 14, 24], [564, p - 12, 14, 24]].forEach(function (r) {
        el('rect', { x: r[0], y: r[1], width: r[2], height: r[3], rx: 1.5, fill: C.pad, 'fill-opacity': .82, stroke: C.padEdge, 'stroke-width': .6 }, fp);
      });
    }
    el('rect', { x: CORE.x, y: CORE.y, width: CORE.w, height: CORE.h, fill: 'none', stroke: C.core, 'stroke-width': 1, 'stroke-dasharray': '5 4' }, fp);
    MACROS.forEach(function (m) {
      el('rect', { x: m[0], y: m[1], width: m[2], height: m[3], rx: 2, fill: C.macro, stroke: C.macroEdge, 'stroke-width': 1.2 }, fp);
      for (var k = 0; k < 9; k++) {
        var px = m[0] + 10 + k * ((m[2] - 20) / 8);
        el('rect', { x: px - 1.5, y: m[1] + m[3] - 5, width: 3, height: 5, fill: C.macroEdge }, fp);
      }
      txt(fp, m[0] + m[2] / 2, m[1] + m[3] / 2 + 4, 'SRAM', '', { 'text-anchor': 'middle', fill: C.macroTxt, 'font-family': 'ui-monospace, SF Mono, Menlo, Plex Mono, monospace', 'font-size': 11, 'letter-spacing': 1.5 });
    });

    // --- power: rings, straps, followpin rails
    var pw = el('g', { 'class': 'L L-pwr' }, svg);
    el('rect', { x: 46, y: 46, width: 508, height: 508, fill: 'none', stroke: C.vdd, 'stroke-width': 3.2 }, pw);
    el('rect', { x: 53, y: 53, width: 494, height: 494, fill: 'none', stroke: C.vss, 'stroke-width': 3.2 }, pw);
    for (var r = 0; r < 40; r++) {
      var ry = CORE.y + r * 12;
      el('line', { x1: CORE.x, y1: ry, x2: CORE.x + CORE.w, y2: ry, stroke: r % 2 ? C.vdd : C.vss, 'stroke-width': .55, 'stroke-opacity': .32 }, pw);
    }
    for (var x = 104; x <= 500; x += 66) {
      el('line', { x1: x, y1: 46, x2: x, y2: 554, stroke: C.vdd, 'stroke-width': 2.2, 'stroke-opacity': .9 }, pw);
      el('line', { x1: x + 8, y1: 53, x2: x + 8, y2: 547, stroke: C.vss, 'stroke-width': 2.2, 'stroke-opacity': .9 }, pw);
    }
    [200, 300, 400].forEach(function (y) {
      el('line', { x1: 46, y1: y, x2: 554, y2: y, stroke: C.vdd, 'stroke-width': 1.6, 'stroke-opacity': .7 }, pw);
      el('line', { x1: 53, y1: y + 7, x2: 547, y2: y + 7, stroke: C.vss, 'stroke-width': 1.6, 'stroke-opacity': .7 }, pw);
    });

    // --- placement: standard-cell rows, macros keep a halo
    var pl = el('g', { 'class': 'L L-place' }, svg);
    var HALO = 7, widths = [4, 5, 6, 6, 8, 8, 10, 12, 14];
    function blocked(x, y, w) {
      for (var k = 0; k < MACROS.length; k++) {
        var m = MACROS[k];
        if (x + w > m[0] - HALO && x < m[0] + m[2] + HALO && y + 10 > m[1] - HALO && y < m[1] + m[3] + HALO) return m;
      }
      return null;
    }
    for (var row = 0; row < 39; row++) {
      var g = el('g', { 'class': 'cell-row', style: '--d:' + (row * 26) + 'ms' }, pl);
      var y = CORE.y + row * 12 + 1, cx = CORE.x + 2;
      while (cx < CORE.x + CORE.w - 4) {
        var w = widths[Math.floor(R() * widths.length)];
        if (cx + w > CORE.x + CORE.w - 2) break;
        var b = blocked(cx, y, w);
        if (b) { cx = b[0] + b[2] + HALO + 1; continue; }
        if (R() > .06) {
          el('rect', { x: cx, y: y, width: w - .8, height: 10, fill: C.cells[Math.floor(R() * C.cells.length)], 'fill-opacity': (.62 + R() * .33).toFixed(2) }, g);
        }
        cx += w + (R() < .18 ? 1 : 0);
      }
    }

    // --- CTS: clock from a pad into a balanced H-tree
    var ct = el('g', { 'class': 'L L-cts' }, svg);
    function seg(x1, y1, x2, y2, wdt, d) {
      var len = Math.abs(x2 - x1) + Math.abs(y2 - y1);
      el('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: C.clk, 'stroke-width': wdt, 'stroke-linecap': 'round', 'class': 'cts-seg', style: '--len:' + len.toFixed(1) + ';--d:' + d + 'ms' }, ct);
    }
    seg(300, 36, 300, 294, 2.6, 0);
    var widthsC = [3, 2.6, 2.1, 1.7, 1.3, 1];
    (function h(x, y, len, horiz, lvl) {
      var d = 260 + lvl * 250;
      if (lvl === 6) {
        el('circle', { cx: x, cy: y, r: 2.6, fill: C.leaf, 'class': 'cts-leaf', style: '--d:' + d + 'ms' }, ct);
        return;
      }
      if (horiz) { seg(x - len, y, x + len, y, widthsC[lvl], d); h(x - len, y, len, false, lvl + 1); h(x + len, y, len, false, lvl + 1); }
      else { seg(x, y - len, x, y + len, widthsC[lvl], d); var nl = lvl % 2 ? len / 2 : len / 2; h(x, y - len, nl, true, lvl + 1); h(x, y + len, nl, true, lvl + 1); }
    })(300, 300, 128, true, 0);
    el('rect', { x: 294, y: 294, width: 12, height: 12, rx: 2, fill: C.clk }, ct);

    // --- route: Manhattan nets, M2 horizontal, M3 vertical, vias at bends
    var rt = el('g', { 'class': 'L L-route' }, svg);
    var bins = [];
    for (var bi = 0; bi < 10; bi++) bins.push(el('g', { 'class': 'net', style: '--d:' + (bi * 85) + 'ms' }, rt));
    for (var k = 0; k < 280; k++) {
      var x1 = CORE.x + 8 + R() * (CORE.w - 16), y1 = CORE.y + 8 + R() * (CORE.h - 16);
      var dx = (R() - .5) * 170, dy = (R() - .5) * 130;
      var x2 = Math.max(CORE.x + 6, Math.min(CORE.x + CORE.w - 6, x1 + dx));
      var y2 = Math.max(CORE.y + 6, Math.min(CORE.y + CORE.h - 6, y1 + dy));
      var gb = bins[k % 10];
      el('line', { x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y1.toFixed(1), stroke: C.m2, 'stroke-width': 1.1, 'stroke-opacity': .85 }, gb);
      el('line', { x1: x2.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), stroke: C.m3, 'stroke-width': 1.1, 'stroke-opacity': .85 }, gb);
      el('rect', { x: (x2 - 1.4).toFixed(1), y: (y1 - 1.4).toFixed(1), width: 2.8, height: 2.8, fill: C.via, 'fill-opacity': .85 }, gb);
    }

    // --- signoff
    var sg = el('g', { 'class': 'L L-sign' }, svg);
    el('rect', { x: CORE.x, y: CORE.y, width: CORE.w, height: CORE.h, fill: 'rgba(61,220,151,.05)', stroke: C.ok, 'stroke-width': 1.3, 'class': 'core-tint' }, sg);
    var st = el('g', { 'class': 'stamp' }, sg);
    el('rect', { x: 176, y: 258, width: 248, height: 84, rx: 9, fill: 'rgba(10,12,15,.9)', stroke: C.ok, 'stroke-width': 2 }, st);
    txt(st, 300, 293, 'SIGNOFF CLEAN', '', { 'text-anchor': 'middle', fill: C.ok, 'font-family': 'ui-monospace, SF Mono, Menlo, Plex Mono, monospace', 'font-size': 19, 'font-weight': 500, 'letter-spacing': 2.5 });
    txt(st, 300, 320, 'DRC · LVS · STA · IR/EM  →  GDSII', '', { 'text-anchor': 'middle', fill: '#a7ecce', 'font-family': 'ui-monospace, SF Mono, Menlo, Plex Mono, monospace', 'font-size': 11 });
    return svg;
  }

  var STAGES = [
    ['Floorplan', '<b>Floorplan.</b> Die size, IO ring, core area and macro placement are fixed before a single cell lands.'],
    ['Power', '<b>Power grid.</b> VDD and VSS rings, straps and followpin rails, sized so IR drop stays inside budget.'],
    ['Place', '<b>Placement.</b> Standard cells are legalized into rows while macros keep their halos and density is watched.'],
    ['CTS', '<b>Clock tree.</b> A balanced H-tree carries the clock from one root to every sink with matched delay.'],
    ['Route', '<b>Routing.</b> Signal nets on alternating metal layers, horizontal on one and vertical on the next.'],
    ['Signoff', '<b>Signoff.</b> Timing at every corner, IR and EM, DRC and LVS. Only then does the GDSII leave.']
  ];
  var DUR = [1500, 1500, 2100, 2500, 1900];

  function initDie() {
    var svg = $('#die'); if (!svg) return;
    buildDie(svg);
    var chips = $('#stages'), capN = $('#capN'), capT = $('#capT'), timer = null, cur = 0;
    STAGES.forEach(function (s, i) {
      var b = doc.createElement('button');
      b.type = 'button'; b.className = 'stg'; b.textContent = s[0];
      b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', 'false');
      b.addEventListener('click', function () { stop(); set(i + 1); });
      chips.appendChild(b);
    });
    var btns = $$('.stg', chips);
    function set(n) {
      cur = n;
      for (var k = 0; k <= 6; k++) svg.classList.remove('s' + k);
      svg.classList.add('s' + n);
      btns.forEach(function (b, i) {
        b.classList.toggle('on', i + 1 === n);
        b.classList.toggle('done', i + 1 < n);
        b.setAttribute('aria-selected', i + 1 === n ? 'true' : 'false');
      });
      capN.textContent = ('0' + n).slice(-2) + ' / 06';
      capT.innerHTML = n ? STAGES[n - 1][1] : 'Press play to run the flow.';
      var on = btns[n - 1];
      if (on && on.scrollIntoView && chips.scrollWidth > chips.clientWidth) {
        chips.scrollTo({ left: on.offsetLeft - chips.clientWidth / 2 + on.clientWidth / 2, behavior: 'smooth' });
      }
    }
    function stop() { if (timer) { clearTimeout(timer); timer = null; } }
    function play() {
      stop();
      svg.classList.add('instant'); set(0); void svg.getBoundingClientRect(); svg.classList.remove('instant');
      var i = 1;
      (function next() { set(i); if (i < 6) { timer = setTimeout(next, DUR[i - 1]); i++; } })();
    }
    $('#replay').addEventListener('click', play);
    GK.replay = function () { $('#top').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); setTimeout(play, reduce ? 0 : 350); };

    if (reduce) { svg.classList.add('instant'); set(6); return; }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); setTimeout(play, 250); }
      }, { threshold: .35 });
      io.observe(svg);
    } else play();
  }

  /* ===================================================================
     PROJECT FIGURES
     =================================================================== */
  function initSocTiles() {
    var g = $('#socTiles'); if (!g) return;
    var dom = [['var(--blue)', 'var(--card)'], ['var(--cu)', 'var(--card)'], ['var(--ok)', 'var(--card)']];
    var idx = 0;
    for (var c = 0; c < 3; c++) {
      var x0 = 24 + c * 212, cx = x0 + 84;
      for (var r = 0; r < 2; r++) for (var q = 0; q < 2; q++) {
        var tx = x0 + 14 + q * 74, ty = 86 + r * 78;
        el('rect', { x: tx, y: ty, width: 66, height: 70, rx: 5, fill: dom[c][1], stroke: dom[c][0], 'stroke-width': 1.1, 'stroke-dasharray': '3 2' }, g);
        var ccx = tx + 33, ccy = ty + 28;
        el('circle', { cx: ccx, cy: ccy, r: 9, fill: 'none', stroke: dom[c][0], 'stroke-width': 1.2 }, g);
        el('path', { d: 'M' + ccx + ' ' + (ccy - 5) + 'V' + ccy + 'l3.5 2.5', fill: 'none', stroke: dom[c][0], 'stroke-width': 1.2, 'stroke-linecap': 'round' }, g);
        txt(g, ccx, ty + 57, 'clk' + idx++, 't2', { 'text-anchor': 'middle' });
      }
      el('path', { d: 'M' + cx + ' 234V256', 'class': 'w' }, g);
      el('rect', { x: x0 + 62, y: 256, width: 44, height: 36, rx: 5, 'class': 'bx' }, g);
      txt(g, cx, 278, 'NoC R', 't2', { 'text-anchor': 'middle', fill: 'var(--ink)' });
    }
  }

  function initNpu() {
    var svg = $('#figNpu'); if (!svg) return;
    var ox = 172, oy = 44, cs = 30, gp = 8;
    txt(svg, 96, 194, 'OPERANDS →', 't3', { 'text-anchor': 'middle', transform: 'rotate(-90 96 194)' });
    txt(svg, 320, 24, 'OPERANDS ↓', 't3', { 'text-anchor': 'middle' });
    for (var i = 0; i < 8; i++) {
      var yc = oy + i * (cs + gp) + cs / 2, xc = ox + i * (cs + gp) + cs / 2;
      el('path', { d: 'M126 ' + yc + 'H' + (ox - 9), 'class': 'w flowline' }, svg);
      el('path', { d: 'M' + (ox - 2) + ' ' + yc + 'l-7-3.5v7z', 'class': 'ar' }, svg);
      el('path', { d: 'M' + xc + ' 32V' + (oy - 8), 'class': 'w flowline' }, svg);
    }
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      el('rect', { x: ox + c * (cs + gp), y: oy + r * (cs + gp), width: cs, height: cs, rx: 4, 'class': 'pe', style: '--d:' + ((r + c) * .11).toFixed(2) + 's' }, svg);
    }
    txt(svg, 320, 372, '8 × 8 MAC processing elements', 't3', { 'text-anchor': 'middle' });
    var ax = 494;
    [['64', 'MAC PEs'], ['444 MHz', 'after pipelining'], ['26 mV', 'IR drop, in budget']].forEach(function (a, k) {
      var y = 108 + k * 86;
      el('line', { x1: ax - 12, y1: y - 22, x2: ax - 12, y2: y + 20, stroke: 'var(--cu)', 'stroke-width': 2 }, svg);
      txt(svg, ax, y, a[0], '', { fill: 'var(--ink)', 'font-size': 21, 'font-weight': 500, 'font-family': 'ui-monospace, SF Mono, Menlo, Plex Mono, monospace' });
      txt(svg, ax, y + 18, a[1], 't2');
    });
  }

  function initDft() {
    var svg = $('#figDft'); if (!svg) return;
    function box(x, y, w, h, a, b, hot) {
      el('rect', { x: x, y: y, width: w, height: h, rx: 6, 'class': 'bx' + (hot ? ' hot' : '') }, svg);
      txt(svg, x + w / 2, y + h / 2 - 2, a, 't1', { 'text-anchor': 'middle' });
      txt(svg, x + w / 2, y + h / 2 + 15, b, 't2', { 'text-anchor': 'middle' });
    }
    el('rect', { x: 164, y: 58, width: 320, height: 258, rx: 8, fill: 'none', stroke: 'var(--ink-3)', 'stroke-dasharray': '5 4' }, svg);
    txt(svg, 176, 82, 'FSM CONTROLLER · CUT', 't3');
    txt(svg, 404, 82, 'SHIFT', 'tc mode-a', { 'text-anchor': 'end' });
    txt(svg, 474, 82, 'CAPTURE', 'tc mode-b', { 'text-anchor': 'end' });
    box(8, 60, 112, 58, 'ATPG', 'TetraMAX');
    box(8, 150, 112, 64, 'LFSR', 'BIST gen');
    el('path', { d: 'M120 89H128V107H136', 'class': 'w' }, svg);
    el('path', { d: 'M120 182H128V123H136', 'class': 'w' }, svg);
    el('path', { d: 'M136 99L152 105V125L136 131Z', fill: 'var(--card-2)', stroke: 'var(--ink-3)', 'stroke-width': 1.2 }, svg);
    el('path', { d: 'M152 115H470V167H176V219H470V271H176V296H500V182H514', 'class': 'scan' }, svg);
    el('path', { d: 'M521 182l-8-4v8z', 'class': 'ar cu' }, svg);
    for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) {
      var x = 190 + c * 56, y = 100 + r * 52;
      el('rect', { x: x, y: y, width: 40, height: 30, rx: 3, 'class': 'ff' }, svg);
      txt(svg, x + 20, y + 19, 'FF', 't2', { 'text-anchor': 'middle' });
    }
    box(522, 150, 112, 64, 'MISR', 'signature', true);
    el('path', { d: 'M578 214V236', 'class': 'w' }, svg);
    el('path', { d: 'M578 243l-4-8h8z', 'class': 'ar' }, svg);
    txt(svg, 578, 260, 'pass / fail', 't2', { 'text-anchor': 'middle' });
    txt(svg, 157, 107, 'SI', 't2');
    txt(svg, 324, 348, '90.93% stuck-at fault coverage', 'tc', { 'text-anchor': 'middle', 'font-size': 14 });
  }


  /* ===================================================================
     DOCUMENTS: read a PDF in-page; phones use their own PDF viewer
     =================================================================== */
  function initDocs() {
    var dlg = $('#pdfv'); if (!dlg) return;
    var frame = $('#pdfvF'), last = null;
    // the single-file preview embeds PDFs as data; turn them into blob URLs browsers will display
    function resolve(src) {
      if (window.GK_DOCS && GK_DOCS[src]) {
        if (!GK_DOCS['_' + src]) {
          var b = atob(GK_DOCS[src]), u = new Uint8Array(b.length);
          for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
          GK_DOCS['_' + src] = URL.createObjectURL(new Blob([u], { type: 'application/pdf' }));
        }
        return GK_DOCS['_' + src];
      }
      return src;
    }
    $$('.doc a[download]').forEach(function (a) {
      var u = resolve(a.getAttribute('href')); if (u !== a.getAttribute('href')) { a.setAttribute('download', a.getAttribute('href').split('/').pop()); a.href = u; }
    });
    var phone = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches || navigator.pdfViewerEnabled === false;
    function open(d) { openPath(d.getAttribute('data-pdf'), d.getAttribute('data-title') || 'Document'); }
    function openPath(path, title) {
      var src = resolve(path);
      if (phone) { window.open(src, '_blank', 'noopener'); return; }
      last = doc.activeElement;
      $('#pdfvT').textContent = title; frame.title = title;
      $('#pdfvNew').href = src; $('#pdfvDl').href = src; $('#pdfvDl').setAttribute('download', path.split('/').pop());
      frame.src = src + '#view=FitH&toolbar=1';
      dlg.hidden = false; doc.body.style.overflow = 'hidden';
      setTimeout(function () { $('#pdfvX').focus(); }, 30);
    }
    function close() {
      dlg.hidden = true; doc.body.style.overflow = ''; frame.src = 'about:blank';
      if (last && last.focus) last.focus();
    }
    $$('.doc [data-view]').forEach(function (b) { b.addEventListener('click', function () { open(b.closest('.doc')); }); });
    $('#pdfvX').addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dlg.hidden) close(); });
    GK.openPaper = function () { var d = $('.doc'); if (d) open(d); };
    GK.openPdf = openPath; GK.resolveDoc = resolve;
  }

  /* figures: alternate caption when the real layout is showing */
  /* figures get a Layout tab automatically when a screenshot exists */
  function initShots() {
    $$('.fig[data-shot]').forEach(function (fig) {
      var src = fig.getAttribute('data-shot'), img = new Image();
      img.onload = function () {
        img.className = 'shot'; img.alt = fig.getAttribute('data-shot-alt') || '';
        img.loading = 'lazy'; img.decoding = 'async';
        $('.fig-body', fig).appendChild(img);
        fig.classList.add('has-shot', 'show-shot');
        var capEl = $('figcaption span', fig), capArch = capEl ? capEl.textContent : '', capShot = fig.getAttribute('data-shot-cap');
        function setCap() { if (capEl && capShot) capEl.textContent = fig.classList.contains('show-shot') ? capShot : capArch; }
        setCap();
        $$('.fig-tabs button', fig).forEach(function (b) {
          b.addEventListener('click', function () {
            var shot = b.getAttribute('data-v') === 'shot';
            fig.classList.toggle('show-shot', shot); setCap();
            $$('.fig-tabs button', fig).forEach(function (o) { o.setAttribute('aria-selected', o === b ? 'true' : 'false'); });
          });
        });
      };
      img.src = src;
    });
    // portrait: try assets/img/headshot.jpg, then assets/headshot.jpg
    var frame = $('#pframe'); if (!frame) return;
    var tries = ['assets/img/headshot.jpg', 'assets/headshot.jpg', 'assets/img/headshot.png'];
    (function next(i) {
      if (i >= tries.length) return;
      var im = new Image();
      im.onload = function () { im.alt = 'Govardhana Kondapaturi'; var ph = $('.ph', frame); if (ph) ph.remove(); frame.insertBefore(im, frame.firstChild); };
      im.onerror = function () { next(i + 1); };
      im.src = tries[i];
    })(0);
  }

  /* ===================================================================
     SKILLS MATRIX
     =================================================================== */
  var SKILLS = [
    ['Synthesis', 'RTL → netlist', 'Design Compiler, DFT-aware synthesis, SDC constraints', 'OpenLane synthesis', 'soc npu dft adpll'],
    ['Floorplan & power', 'die, macros, grid', 'Innovus floorplanning, macro and structured placement, chip integration, power planning', 'OpenROAD floorplan and PDN', 'soc npu adpll'],
    ['Placement', 'legalize, optimize', 'Innovus placement, congestion analysis', 'OpenROAD global and detailed placement', 'soc npu adpll'],
    ['Clock tree', 'CTS, skew', 'Physical clock design, customized CTS, clock gating', 'OpenROAD CTS', 'soc npu adpll'],
    ['Routing', 'signal and ECO', 'Innovus routing, wire editing, ECO methodology', 'OpenROAD routing', 'soc npu adpll'],
    ['Low power', 'UPF intent', 'UPF, multiple power domains, multi-Vt, isolation cells, level shifters, clock gating, DVFS', '', 'soc npu'],
    ['Static timing', 'MCMM signoff', 'PrimeTime MCMM setup and hold, SDC development, timing ECOs', 'OpenLane signoff STA', 'soc npu adpll'],
    ['Power integrity', 'IR, EM, noise', 'RedHawk-SC IR drop and EM, signal EM and noise analysis', 'OpenLane IR analysis', 'soc adpll'],
    ['Physical verification', 'DRC, LVS, PEX', 'Calibre DRC, LVS, PEX, antenna, ERC', 'Magic, KLayout', 'soc adpll'],
    ['CDC & formal', 'structure, equivalence', 'SpyGlass CDC/RDC and lint, JasperGold, Conformal, Formality', '', 'soc'],
    ['DFT', 'scan, BIST, ATPG', 'TetraMAX ATPG, scan insertion and stitching, BIST with LFSR/MISR', '', 'dft'],
    ['Verification', 'simulation', 'Gate-level simulation with SDF annotation', 'cocotb, Icarus Verilog', 'dft adpll'],
    ['Automation', 'flow scripting', 'TCL, Python, Perl for report parsing, ECO and regression flows', 'GitHub Actions CI for the LibreLane flow', 'soc npu adpll']
  ];
  var PNAME = { adpll: 'ADPLL', soc: 'SoC', npu: 'Systolic', dft: 'DFT' };
  var PID = { adpll: '#p-adpll', soc: '#p-soc', npu: '#p-npu', dft: '#p-dft' };

  function initMatrix() {
    var mx = $('#matrix'); if (!mx) return;
    SKILLS.forEach(function (s) {
      var row = doc.createElement('div');
      row.className = 'mx-row'; row.setAttribute('data-p', s[4]);
      var ev = s[4].split(' ').map(function (p) {
        return '<a href="' + PID[p] + '"><i class="p-' + p + '"></i>' + PNAME[p] + '</a>';
      }).join('');
      row.innerHTML =
        '<div class="stage">' + s[0] + '<small>' + s[1] + '</small></div>' +
        '<div><span class="mx-lbl">Commercial</span>' + s[2] + '</div>' +
        '<div><span class="mx-lbl">Open</span>' + (s[3] || '<span class="none">—</span>') + '</div>' +
        '<div class="ev">' + ev + '</div>';
      mx.appendChild(row);
    });
    var chips = $$('.fchip');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.getAttribute('data-f');
        chips.forEach(function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
        mx.classList.toggle('filtering', f !== 'all');
        $$('.mx-row:not(.head)', mx).forEach(function (r) {
          r.classList.toggle('match', f !== 'all' && r.getAttribute('data-p').split(' ').indexOf(f) > -1);
        });
      });
    });
  }


  /* rated skills: highlight rows used in a given project */
  function initRated() {
    var grid = $('#skgrid'); if (!grid) return;
    var chips = $$('.sk-bar .fchip');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.getAttribute('data-f');
        chips.forEach(function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
        grid.classList.toggle('filtering', f !== 'all');
        $$('.sk', grid).forEach(function (r) { r.classList.toggle('match', f !== 'all' && (' ' + r.getAttribute('data-p') + ' ').indexOf(' ' + f + ' ') > -1); });
      });
    });
  }

  /* ===================================================================
     PAGE CHROME: theme, progress, nav, reveal, counters
     =================================================================== */
  function effectiveTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function toggleTheme() {
    var n = effectiveTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', n);
    try { localStorage.setItem('gk-theme', n); } catch (e) {}
    toast(n === 'dark' ? 'Cleanroom mode' : 'Paper mode');
  }

  function initChrome() {
    $('#themeBtn').addEventListener('click', toggleTheme);
    $('#printBtn').addEventListener('click', function () { window.print(); });

    var trace = $('#trace'), ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var h = root.scrollHeight - window.innerHeight;
        trace.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
        if (window.scrollY < 200) $$('.links a').forEach(function (a) { a.classList.remove('on'); });
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    if (!('IntersectionObserver' in window)) { $$('.rv').forEach(function (e) { e.classList.add('in'); }); return; }

    var links = $$('.links a');
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-42% 0px -54% 0px' });
    ['work', 'skills', 'about', 'research', 'contact'].forEach(function (id) { var s = doc.getElementById(id); if (s) so.observe(s); });

    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
    $$('.rv').forEach(function (e) { ro.observe(e); });

    if (reduce) { $$('svg.dg').forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); }); return; }
    var nums = $$('[data-to]');
    nums.forEach(function (n) { n.textContent = (n.getAttribute('data-pre') || '') + '0' + (n.getAttribute('data-suf') || ''); });
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        var n = e.target, to = +n.getAttribute('data-to'), pre = n.getAttribute('data-pre') || '', suf = n.getAttribute('data-suf') || '', t0 = null;
        (function step(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / 1300), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
          n.textContent = pre + v + suf;
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: .6 });
    nums.forEach(function (n) { co.observe(n); });
  }

  /* ===================================================================
     COPY, TOAST, PINOUT, FORM
     =================================================================== */
  var tt = null;
  function toast(msg) {
    var t = $('#toast'); $('#toastT').textContent = msg;
    t.classList.add('show'); clearTimeout(tt);
    tt = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }
  function copy(text, msg) {
    function fallback() {
      var ta = doc.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0'; doc.body.appendChild(ta); ta.select();
      try { doc.execCommand('copy'); } catch (e) {}
      ta.remove();
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(fallback); else fallback();
    toast(msg || 'Copied');
  }
  GK.copyEmail = function () { copy(EMAIL, 'Email copied'); };

  function initInteractions() {
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () { copy(b.getAttribute('data-copy'), b.getAttribute('data-toast')); });
    });
    $$('[data-copy-from]').forEach(function (b) {
      b.addEventListener('click', function () { var s = $(b.getAttribute('data-copy-from')); if (s) copy(s.textContent.trim(), b.getAttribute('data-toast')); });
    });

    // pinout hover sync: package pin ↔ table row
    $$('[data-pin]').forEach(function (n) {
      var id = n.getAttribute('data-pin');
      function on(v) { $$('[data-pin="' + id + '"]').forEach(function (m) { m.classList.toggle('hl', v); }); }
      n.addEventListener('mouseenter', function () { on(true); });
      n.addEventListener('mouseleave', function () { on(false); });
      n.addEventListener('focusin', function () { on(true); });
      n.addEventListener('focusout', function () { on(false); });
    });

    // form: Formspree when configured, otherwise hand off to the visitor's mail app
    var form = $('#msgForm'); if (!form) return;
    var configured = form.action.indexOf('YOUR_FORM_ID') === -1;
    if (!configured) $('#fnote').innerHTML = 'Opens your email app with the message filled in. Or write to <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>.';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form._gotcha && form._gotcha.value) return;
      var bad = $$('[required]', form).filter(function (f) { return !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)); });
      $$('[required]', form).forEach(function (f) { f.style.borderColor = ''; });
      if (bad.length) { bad.forEach(function (f) { f.style.borderColor = 'var(--cu)'; }); bad[0].focus(); toast('Please fill in ' + bad[0].previousElementSibling.textContent.toLowerCase()); return; }
      var name = form.name.value.trim(), co = form.company.value.trim();
      if (!configured) {
        var subj = 'Hello from ' + name + (co ? ' (' + co + ')' : '');
        var body = form.message.value.trim() + '\n\n' + name + '\n' + form.email.value.trim() + (co ? '\n' + co : '');
        window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
        toast('Opening your email app');
        return;
      }
      var btn = $('button[type=submit]', form); btn.disabled = true; btn.style.opacity = '.6';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw 0; $('#formCard').classList.add('sent'); })
        .catch(function () { toast('Could not send. Please email me directly.'); })
        .then(function () { btn.disabled = false; btn.style.opacity = ''; });
    });
  }


  /* ===================================================================
     CONTACT: bond-wire die
     =================================================================== */
  var RESUME_URL = 'assets/Govardhana_Kondapaturi_Resume.pdf';
  var CONTACT_PINS = [
    { n: 1, name: 'EMAIL', type: 'I/O', value: 'srigovardhan96@gmail.com', desc: 'The fastest way to reach me.',
      acts: [['Compose', 'mailto:srigovardhan96@gmail.com', 1], ['Copy', 'copy:srigovardhan96@gmail.com']] },
    { n: 2, name: 'PHONE', type: 'I/O', value: '+1 (559) 874-7599', desc: 'Call or text. Pacific time.',
      acts: [['Call', 'tel:+15598747599', 1], ['Copy', 'copy:+1 (559) 874-7599']] },
    { n: 3, name: 'LINKEDIN', type: 'I/O', value: 'in/sri-kondapaturi', desc: 'Background, posts and recommendations.',
      acts: [['Open LinkedIn', 'https://www.linkedin.com/in/sri-kondapaturi/', 1]] },
    { n: 4, name: 'GITHUB', type: 'OUT', value: 'SriKondapaturi', desc: 'Source for the ADPLL tapeout.',
      acts: [['Open GitHub', 'https://github.com/SriKondapaturi', 1]] },
    { n: 5, name: 'RESUME', type: 'OUT', value: 'Resume · PDF', desc: 'Projects, tools and education in one page.',
      acts: [['Download', 'dl:', 1], ['Read', 'paper:']] },
    { n: 6, name: '3D LAYOUT', type: 'OUT', value: 'ADPLL · SKY130', desc: 'My taped-out chip, explorable in 3D.',
      acts: [['Open 3D viewer', 'https://srikondapaturi.github.io/tt-um-govardhana-adpll/', 1]] }
  ];
  function initBondWire() {
    var g = $('#bwPins'), ro = $('#bwRo'); if (!g || !ro) return;
    function mk(t, a, p) { return el(t, a, p); }
    var leadY = [150, 240, 330], dieY = [192, 240, 288];
    var spec = [['L', 0], ['L', 1], ['L', 2], ['R', 2], ['R', 1], ['R', 0]];
    var groups = [];
    spec.forEach(function (s, i) {
      var P = CONTACT_PINS[i], L = s[0] === 'L', y = leadY[s[1]], dy = dieY[s[1]];
      var grp = mk('g', { 'class': 'bwp', tabindex: 0, role: 'button', 'aria-label': 'Pin ' + P.n + ', ' + P.name + ': ' + P.value }, g);
      var lx = L ? 108 : 610, fx0 = L ? 150 : 548, fx1 = L ? 212 : 610, px = L ? 262 : 488;
      mk('rect', { 'class': 'hit', x: L ? 0 : 560, y: y - 30, width: 200, height: 60 }, grp);
      mk('rect', { 'class': 'ld', x: lx, y: y - 9, width: 42, height: 18, rx: 2.5 }, grp);
      mk('rect', { 'class': 'fg', x: fx0, y: y - 6, width: fx1 - fx0, height: 12, rx: 1.5, opacity: .9 }, grp);
      mk('rect', { 'class': 'dp', x: px, y: dy - 5, width: 10, height: 10, rx: 1.5 }, grp);
      var x0 = L ? fx1 - 8 : fx0 + 8, x1 = L ? px : px + 10, mx = (x0 + x1) / 2;
      var curve = 'C ' + mx + ' ' + (y - 34) + ', ' + mx + ' ' + (dy - 30) + ', ' + x1 + ' ' + dy;
      mk('path', { 'class': 'wr', d: 'M' + x0 + ' ' + y + ' ' + curve }, grp);
      mk('path', { 'class': 'pl', d: 'M' + (L ? lx : lx + 42) + ' ' + y + ' L ' + x0 + ' ' + y + ' ' + curve, pathLength: 438 }, grp);
      txt(grp, L ? 96 : 664, y + 5, P.name, 'lb', { 'text-anchor': L ? 'end' : 'start' });
      txt(grp, L ? 181 : 579, y - 12, String(P.n), 'nm', { 'text-anchor': 'middle' });
      groups[i] = grp;
    });
    function button(a) {
      var b, href = a[1];
      if (href.indexOf('copy:') === 0) { b = doc.createElement('button'); b.type = 'button'; b.addEventListener('click', function () { copy(href.slice(5), 'Copied'); }); }
      else if (href === 'paper:') { b = doc.createElement('button'); b.type = 'button'; b.addEventListener('click', function () { GK.openPdf ? GK.openPdf(RESUME_URL, 'Govardhana Kondapaturi · Resume') : window.open(RESUME_URL, '_blank', 'noopener'); }); }
      else if (href === 'dl:') { b = doc.createElement('a'); b.href = GK.resolveDoc ? GK.resolveDoc(RESUME_URL) : RESUME_URL; b.setAttribute('download', 'Govardhana_Kondapaturi_Resume.pdf'); }
      else { b = doc.createElement('a'); b.href = href; if (/^https?:/.test(href)) { b.target = '_blank'; b.rel = 'noopener'; } }
      b.className = 'btn' + (a[2] ? ' pri' : ''); b.textContent = a[0]; return b;
    }
    var cur = -1, auto = null, touched = false;
    function show(i, user) {
      if (user && !touched) { touched = true; clearInterval(auto); }
      if (i === cur) return; cur = i;
      groups.forEach(function (gr, k) { gr.classList.toggle('on', k === i); });
      var P = CONTACT_PINS[i];
      ro.innerHTML = '<div class="bw-k">Pin ' + P.n + ' · ' + P.name + ' · ' + P.type + '</div><div class="bw-v">' + P.value + '</div><div class="bw-d">' + P.desc + '</div><div class="bw-a"></div>';
      var box = $('.bw-a', ro); P.acts.forEach(function (a) { box.appendChild(button(a)); });
      ro.classList.remove('swap'); void ro.offsetWidth; ro.classList.add('swap');
    }
    groups.forEach(function (gr, i) {
      gr.addEventListener('mouseenter', function () { show(i, true); });
      gr.addEventListener('focus', function () { show(i, true); });
      gr.addEventListener('click', function () { show(i, true); });
      gr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); var a = $('.btn.pri', ro); if (a) a.click(); } });
    });
    show(0);
    // idle: walk the pins while the panel is on screen and nobody has touched it
    if (reduce || !('IntersectionObserver' in window)) return;
    var k = 0, io = new IntersectionObserver(function (es) {
      if (touched) return io.disconnect();
      if (es[0].isIntersecting) { if (!auto) auto = setInterval(function () { k = (k + 1) % 6; show(k); }, 2600); }
      else { clearInterval(auto); auto = null; }
    }, { threshold: .3 });
    io.observe($('#bondout'));
  }

  /* ===================================================================
     COMMAND PALETTE  (⌘K / Ctrl+K / "/")
     =================================================================== */
  function go(sel) { return function () { var t = $(sel); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }; }
  function open(url) { return function () { window.open(url, '_blank', 'noopener'); }; }
  var ACTIONS = [
    ['Navigate', '→', 'Selected work', '01', go('#work')],
    ['Navigate', '→', 'ADPLL on SkyWater SKY130', 'Fig. 1', go('#p-adpll')],
    ['Navigate', '→', 'Multi-chiplet SoC', 'Fig. 2', go('#p-soc')],
    ['Navigate', '→', 'Systolic accelerator', 'Fig. 3', go('#p-npu')],
    ['Navigate', '→', 'DFT / BIST / ATPG', 'Fig. 4', go('#p-dft')],
    ['Navigate', '→', 'Skills, rated 1–5', '02', go('#skills')],
    ['Navigate', '→', 'About and path', '03', go('#about')],
    ['Navigate', '→', 'Research and certifications', '04', go('#research')],
    ['Navigate', '→', 'Contact', '05', go('#contact')],
    ['Actions', '@', 'Copy email address', EMAIL, function () { GK.copyEmail(); }],
    ['Actions', '▤', 'Read the LASCAS paper', 'PDF', function () { GK.openPaper && GK.openPaper(); }],
    ['Actions', '↓', 'Download resume (PDF)', 'PDF', function () { var a = doc.createElement('a'); a.href = 'assets/Govardhana_Kondapaturi_Resume.pdf'; a.download = ''; doc.body.appendChild(a); a.click(); a.remove(); }],
    ['Actions', '↻', 'Replay the chip build-up', '', function () { GK.replay && GK.replay(); }],
    ['Actions', '◐', 'Switch light / dark theme', '', toggleTheme],
    ['Actions', '⎙', 'Print this page as a datasheet', '', function () { setTimeout(function () { window.print(); }, 60); }],
    ['Links', 'in', 'LinkedIn', 'sri-kondapaturi', open('https://www.linkedin.com/in/sri-kondapaturi/')],
    ['Links', 'gh', 'GitHub', 'SriKondapaturi', open('https://github.com/SriKondapaturi')],
    ['Links', '3D', 'ADPLL layout in 3D', 'Tiny Tapeout', open('https://srikondapaturi.github.io/tt-um-govardhana-adpll/')],
    ['Links', '{}', 'ADPLL source code', 'GitHub', open('https://github.com/SriKondapaturi/tt-um-govardhana-adpll')]
  ];

  function initPalette() {
    var pal = $('#pal'), q = $('#palQ'), list = $('#palList'), btn = $('#palBtn'), items = [], sel = 0, lastFocus = null;
    var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    $('#kbdHint').textContent = mac ? '⌘K' : 'Ctrl K';

    function render() {
      var term = q.value.trim().toLowerCase();
      var hits = ACTIONS.filter(function (a) { return !term || (a[2] + ' ' + a[3] + ' ' + a[0]).toLowerCase().indexOf(term) > -1; });
      list.innerHTML = ''; items = [];
      if (!hits.length) { list.innerHTML = '<div class="pal-empty">Nothing matches “' + q.value.replace(/</g, '&lt;') + '”</div>'; return; }
      var grp = '';
      hits.forEach(function (a) {
        if (a[0] !== grp) { grp = a[0]; var h = doc.createElement('div'); h.className = 'pal-g'; h.textContent = grp; list.appendChild(h); }
        var it = doc.createElement('div');
        it.className = 'pal-i'; it.setAttribute('role', 'option'); it.id = 'pi' + items.length;
        it.innerHTML = '<span class="ic">' + a[1] + '</span><span>' + a[2] + '</span><span class="hint">' + (a[3] || '') + '</span>';
        var idx = items.length;
        it.addEventListener('mousemove', function () { if (sel !== idx) { sel = idx; mark(); } });
        it.addEventListener('click', function () { run(idx); });
        list.appendChild(it); items.push({ n: it, a: a });
      });
      sel = Math.min(sel, items.length - 1); mark();
    }
    function mark() {
      items.forEach(function (it, i) { it.n.classList.toggle('sel', i === sel); it.n.setAttribute('aria-selected', i === sel ? 'true' : 'false'); });
      if (items[sel]) { items[sel].n.scrollIntoView({ block: 'nearest' }); q.setAttribute('aria-activedescendant', items[sel].n.id); }
    }
    function run(i) { var it = items[i]; if (!it) return; close(); setTimeout(it.a[4], 30); }
    function openP() { lastFocus = doc.activeElement; pal.classList.add('open'); q.value = ''; sel = 0; render(); setTimeout(function () { q.focus(); }, 10); doc.body.style.overflow = 'hidden'; }
    function close() { pal.classList.remove('open'); doc.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
    GK.palette = openP;

    btn.addEventListener('click', openP);
    pal.addEventListener('click', function (e) { if (e.target === pal) close(); });
    q.addEventListener('input', function () { sel = 0; render(); });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % items.length; mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { e.preventDefault(); }
    });
    doc.addEventListener('keydown', function (e) {
      var typing = /INPUT|TEXTAREA|SELECT/.test((doc.activeElement || {}).tagName || '') || (doc.activeElement && doc.activeElement.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); pal.classList.contains('open') ? close() : openP(); }
      else if (e.key === '/' && !typing && !pal.classList.contains('open')) { e.preventDefault(); openP(); }
      else if (e.key === 'Escape' && pal.classList.contains('open')) close();
    });
  }


  /* ===================================================================
     CHIP VIEWER: the real ADPLL layout, from assets/chip (tools/gds2web.py)
     =================================================================== */
  var FAMILY_NOTE = {
    'Flip-flop / latch': 'stores one bit per clock edge',
    'Inverter': 'flips a signal; also used to size the ring oscillator',
    'Buffer / delay': 'drives long wires, or adds deliberate delay',
    'Logic gate': 'combinational logic',
    'Multiplexer': 'selects one of several inputs',
    'Tie cell': 'ties an input to a constant 0 or 1',
    'Fill / decap / tap': 'no logic: fills gaps, steadies the supply, anchors the well',
    'Antenna diode': 'protects gates from charge build-up during fabrication'
  };
  var FAM_RULES = [
    [/^(dfrtp|dfrbp|dfstp|dfxtp|dfxbp|dfbbp|dfsbp|edfxtp|sdf|dlxtp|dlrtp|dlxbn)/, 'Flip-flop / latch'],
    [/^(inv|clkinv|einv)/, 'Inverter'], [/^(buf|clkbuf|dlygate|dlymetal|bufbuf|dlclkp|clkdlybuf)/, 'Buffer / delay'],
    [/^(nand|and|nor|or|xor|xnor|a\d|o\d|maj|ha|fa)/, 'Logic gate'], [/^mux/, 'Multiplexer'], [/^conb/, 'Tie cell'],
    [/^(fill|decap|tapvpwrvgnd|tap)/, 'Fill / decap / tap'], [/^diode/, 'Antenna diode']
  ];
  function describe(cell) {
    var m = /^sky130_\w+?__(.+?)(?:_(\d+))?$/.exec(cell || ''), base = m ? m[1] : cell, drive = m && m[2];
    var fam = 'Other';
    for (var i = 0; i < FAM_RULES.length; i++) if (FAM_RULES[i][0].test(base)) { fam = FAM_RULES[i][1]; break; }
    return { base: base, drive: drive, fam: fam };
  }

  function initChip(done) {
    var panel = $('.die'); if (!panel) return done(false);
    function load(cb) {
      if (window.GK_CHIP) return cb(window.GK_CHIP, '');
      if (!window.fetch || location.protocol === 'file:') return cb(null);
      fetch('assets/chip/chip.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (d) { cb(d, 'assets/chip/'); }).catch(function () { cb(null); });
    }
    load(function (meta, base) {
      if (!meta) return done(false);
      build(meta, base); done(true);
    });

    function build(M, base) {
      var PW = M.px[0], PH = M.px[1];
      panel.classList.add('is-chip');
      panel.setAttribute('aria-label', 'Interactive layout of the ADPLL chip, drawn from its real GDSII file');
      var bar = $('.die-bar', panel);
      bar.innerHTML = '<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '<span class="nm"><b>' + M.top + '</b><span class="die-sub"> · SKY130 · <span class="um">' + M.um[0].toFixed(0) + ' × ' + M.um[1].toFixed(0) + ' µm</span></span></span>' +
        '<span class="grow"></span><span class="real"><i></i>Real GDSII</span>';

      var view = $('.die-view', panel); view.innerHTML = '';
      view.className = 'die-view chipv'; view.tabIndex = 0;
      view.setAttribute('aria-label', 'Layout viewer. Drag to pan, scroll or pinch to zoom, plus and minus keys to zoom, 0 to fit.');
      var stage = doc.createElement('div'); stage.className = 'chipv-stage';
      stage.style.width = PW + 'px'; stage.style.height = PH + 'px';
      var imgs = {};
      M.layers.forEach(function (L) {
        var im = new Image(); im.alt = ''; im.draggable = false; im.decoding = 'async';
        im.src = (L.data || base + L.file); im.className = 'chipv-l';
        im.style.width = PW + 'px'; im.style.height = PH + 'px';
        stage.appendChild(im); imgs[L.id] = im;
      });
      var hl = doc.createElement('div'); hl.className = 'chipv-hl'; stage.appendChild(hl);
      view.appendChild(stage);
      var tip = doc.createElement('div'); tip.className = 'chipv-tip'; tip.setAttribute('role', 'status'); view.appendChild(tip);
      var tools = doc.createElement('div'); tools.className = 'chipv-tools';
      tools.innerHTML = '<button type="button" data-z="in" aria-label="Zoom in">+</button><button type="button" data-z="out" aria-label="Zoom out">−</button><button type="button" data-z="fit" aria-label="Fit to view">⤢</button>';
      view.appendChild(tools);
      var hint = doc.createElement('div'); hint.className = 'chipv-hint';
      hint.textContent = ('ontouchstart' in window) ? 'Drag · pinch to zoom · tap a cell' : 'Click, then scroll to zoom · drag to pan · hover a cell';
      view.appendChild(hint);

      /* ---- pan / zoom ---- */
      var s = 1, tx = 0, ty = 0, fitS = 1;
      function apply() { stage.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')'; }
      function fit() {
        var r = view.getBoundingClientRect();
        fitS = Math.min(r.width / PW, r.height / PH) * 0.94; s = fitS;
        tx = (r.width - PW * s) / 2; ty = (r.height - PH * s) / 2; apply();
      }
      function clampPan() {
        var r = view.getBoundingClientRect(), w = PW * s, h = PH * s, m = 40;
        tx = w < r.width ? (r.width - w) / 2 : Math.min(m, Math.max(r.width - w - m, tx));
        ty = h < r.height ? (r.height - h) / 2 : Math.min(m, Math.max(r.height - h - m, ty));
      }
      function zoomAt(f, cx, cy) {
        var ns = Math.max(fitS, Math.min(fitS * 14, s * f)); f = ns / s;
        tx = cx - (cx - tx) * f; ty = cy - (cy - ty) * f; s = ns; clampPan(); apply();
        hint.classList.add('gone');
      }
      function center(r) { return [r.width / 2, r.height / 2]; }
      tools.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var r = view.getBoundingClientRect(), c = center(r), z = b.getAttribute('data-z');
        if (z === 'fit') fit(); else zoomAt(z === 'in' ? 1.6 : 1 / 1.6, c[0], c[1]);
      });
      view.addEventListener('wheel', function (e) {
        // don't hijack page scrolling: zoom only once the visitor has clicked into the chip (or holds Ctrl / pinches a trackpad)
        if (!e.ctrlKey && !view.classList.contains('engaged')) { hint.classList.remove('gone'); hint.classList.add('nudge'); clearTimeout(hint._t); hint._t = setTimeout(function () { hint.classList.remove('nudge'); }, 900); return; }
        e.preventDefault();
        var r = view.getBoundingClientRect();
        zoomAt(Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0022)), e.clientX - r.left, e.clientY - r.top);
      }, { passive: false });
      view.addEventListener('dblclick', function (e) { var r = view.getBoundingClientRect(); zoomAt(2, e.clientX - r.left, e.clientY - r.top); });
      view.addEventListener('keydown', function (e) {
        var r = view.getBoundingClientRect(), c = center(r);
        if (e.key === '+' || e.key === '=') { zoomAt(1.5, c[0], c[1]); e.preventDefault(); }
        else if (e.key === '-' || e.key === '_') { zoomAt(1 / 1.5, c[0], c[1]); e.preventDefault(); }
        else if (e.key === '0') { fit(); e.preventDefault(); }
        else if (/^Arrow/.test(e.key)) {
          var d = 60; if (e.key === 'ArrowLeft') tx += d; if (e.key === 'ArrowRight') tx -= d; if (e.key === 'ArrowUp') ty += d; if (e.key === 'ArrowDown') ty -= d;
          clampPan(); apply(); e.preventDefault();
        }
      });
      var pts = {}, last = null, pinch0 = null, moved = 0;
      view.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.chipv-tools')) return;
        view.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY]; moved = 0;
        view.classList.add('grabbing', 'engaged');
        var k = Object.keys(pts);
        if (k.length === 2) { var a = pts[k[0]], b = pts[k[1]]; pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: s }; }
        last = [e.clientX, e.clientY];
      });
      view.addEventListener('pointermove', function (e) {
        if (pts[e.pointerId]) {
          pts[e.pointerId] = [e.clientX, e.clientY];
          var k = Object.keys(pts), r = view.getBoundingClientRect();
          if (k.length === 2 && pinch0) {
            var a = pts[k[0]], b = pts[k[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
            zoomAt((pinch0.s * d / pinch0.d) / s, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top);
          } else if (last) {
            tx += e.clientX - last[0]; ty += e.clientY - last[1]; moved += Math.abs(e.clientX - last[0]) + Math.abs(e.clientY - last[1]);
            clampPan(); apply(); if (moved > 4) hint.classList.add('gone');
          }
          last = [e.clientX, e.clientY];
          hideTip();
        } else if (e.pointerType === 'mouse') hover(e);
      });
      function up(e) {
        var tapped = pts[e.pointerId] && moved < 6 && e.pointerType !== 'mouse';
        delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch0 = null;
        if (!Object.keys(pts).length) { view.classList.remove('grabbing'); last = null; }
        if (tapped) hover(e);
      }
      view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
      view.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hideTip(); });
      view.addEventListener('mouseleave', function () { view.classList.remove('engaged'); });

      /* ---- hover: which standard cell is under the cursor ---- */
      var G = 64, grid = {};
      M.cells.forEach(function (c, i) {
        for (var gx = Math.floor(c[0] / G); gx <= Math.floor((c[0] + c[2]) / G); gx++)
          for (var gy = Math.floor(c[1] / G); gy <= Math.floor((c[1] + c[3]) / G); gy++)
            (grid[gx + ',' + gy] = grid[gx + ',' + gy] || []).push(i);
      });
      function hideTip() { tip.classList.remove('on'); hl.classList.remove('on'); }
      function hover(e) {
        var r = view.getBoundingClientRect(), x = (e.clientX - r.left - tx) / s, y = (e.clientY - r.top - ty) / s;
        var list = grid[Math.floor(x / G) + ',' + Math.floor(y / G)] || [], hit = null;
        for (var i = 0; i < list.length; i++) { var c = M.cells[list[i]]; if (x >= c[0] && x <= c[0] + c[2] && y >= c[1] && y <= c[1] + c[3]) { hit = c; break; } }
        if (!hit) return hideTip();
        var d = describe(M.types[hit[4]]);
        hl.style.left = hit[0] + 'px'; hl.style.top = hit[1] + 'px'; hl.style.width = hit[2] + 'px'; hl.style.height = hit[3] + 'px';
        hl.style.borderWidth = (1.5 / s) + 'px'; hl.classList.add('on');
        tip.innerHTML = '<b>' + d.base + (d.drive ? '<small> ×' + d.drive + '</small>' : '') + '</b><span>' + d.fam + '</span>' +
          (FAMILY_NOTE[d.fam] ? '<em>' + FAMILY_NOTE[d.fam] + '</em>' : '') +
          '<code>' + (hit[2] / M.scale).toFixed(2) + ' × ' + (hit[3] / M.scale).toFixed(2) + ' µm</code>';
        var tw = 230, left = e.clientX - r.left + 14, top = e.clientY - r.top + 14;
        if (left + tw > r.width) left = e.clientX - r.left - tw - 10;
        if (top + 110 > r.height) top = e.clientY - r.top - 118;
        tip.style.left = left + 'px'; tip.style.top = top + 'px'; tip.classList.add('on');
      }

      /* ---- layer chips + bottom-up build ---- */
      var chips = $('#stages'), capN = $('#capN'), capT = $('#capT');
      chips.innerHTML = ''; chips.setAttribute('aria-label', 'Layers');
      var on = {};
      M.layers.forEach(function (L) {
        on[L.id] = L.on;
        var b = doc.createElement('button'); b.type = 'button'; b.className = 'stg lay';
        b.innerHTML = '<i style="background:' + L.color + '"></i>' + L.label;
        b.setAttribute('aria-pressed', L.on ? 'true' : 'false');
        b.addEventListener('click', function () { stopBuild(); on[L.id] = !on[L.id]; paint(); });
        b._id = L.id; chips.appendChild(b);
      });
      function paint(upto) {
        M.layers.forEach(function (L, i) {
          var vis = on[L.id] && (upto == null || i <= upto);
          imgs[L.id].classList.toggle('off', !vis);
        });
        $$('.lay', chips).forEach(function (b) { b.setAttribute('aria-pressed', on[b._id] ? 'true' : 'false'); b.classList.toggle('on', !!on[b._id]); });
      }
      var fams = M.census || {}, ff = fams['Flip-flop / latch'] || 0;
      var summary = '<b>' + M.placed + ' placed cells</b>, ' + M.logic_cells + ' of them logic' + (ff ? ', ' + ff + ' flip-flops' : '') + '. Every shape here is from the file I sent to the fab.';
      capN.textContent = 'GDSII';
      var bt = null;
      function stopBuild() { if (bt) { clearTimeout(bt); bt = null; } capT.innerHTML = summary; paint(); }
      function buildUp() {
        stopBuild();
        var order = M.layers.map(function (L, i) { return i; }).filter(function (i) { return M.layers[i].on; });
        var k = 0; paint(-1);
        (function step() {
          if (k >= order.length) { capT.innerHTML = summary; paint(); bt = null; return; }
          var L = M.layers[order[k]];
          capT.innerHTML = '<b>' + L.label + '.</b> ' + (LAYER_NOTE[L.id] || '');
          paint(order[k]); k++; bt = setTimeout(step, reduce ? 0 : 1250);
        })();
      }
      var LAYER_NOTE = {
        nwell: 'The doped well the PMOS transistors sit in.',
        diff: 'Diffusion: where the transistors actually are.',
        poly: 'Polysilicon gates crossing the diffusion; each crossing is a transistor.',
        li1: 'Local interconnect, wiring inside each standard cell.',
        met1: 'Metal 1: power rails along every cell row, plus short hops between cells.',
        met2: 'Metal 2: signal routing, mostly vertical.',
        met3: 'Metal 3: longer signal routes, mostly horizontal.',
        met4: 'Metal 4: the power straps that feed the whole block.',
        met5: 'Metal 5: top-level power.'
      };
      $('#replay').setAttribute('aria-label', 'Replay the layer build-up');
      $('#replay').addEventListener('click', buildUp);
      GK.replay = function () { $('#top').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); setTimeout(buildUp, reduce ? 0 : 350); };

      fit(); paint();
      window.addEventListener('resize', function () { var was = s / fitS; fit(); if (was > 1.01) zoomAt(was, view.clientWidth / 2, view.clientHeight / 2); });
      if (reduce || !('IntersectionObserver' in window)) { capT.innerHTML = summary; return; }
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(buildUp, 300); } }, { threshold: .35 });
      io.observe(view);
    }
  }

  /* ===================================================================
     boot
     =================================================================== */
  GK.buildDie = buildDie;
  if (window.GK_NO_BOOT) return;

  // printing mid-scroll should never show half-counted numbers or hidden sections
  function finalize() {
    $$('[data-to]').forEach(function (n) { n.textContent = (n.getAttribute('data-pre') || '') + n.getAttribute('data-to') + (n.getAttribute('data-suf') || ''); });
    $$('.rv').forEach(function (e) { e.classList.add('in'); });
    var d = $('#die'); if (d) { d.classList.add('instant'); for (var k = 0; k < 6; k++) d.classList.remove('s' + k); d.classList.add('s6'); }
  }
  window.addEventListener('beforeprint', finalize);

  function boot() {
    initChrome();
    initChip(function (ok) { if (!ok) initDie(); });
    initSocTiles();
    initNpu();
    initDft();
    initShots();
    initDocs();
    initMatrix();
    initRated();
    initInteractions();
    initBondWire();
    initPalette();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();

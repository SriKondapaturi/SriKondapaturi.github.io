/* concept B · film strip */
(function () {
  'use strict';
  var sc = document.querySelector('.film-sc'); if (!sc) return;
  var tr = sc.querySelector('.film-tr');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var frames = [].slice.call(tr.children);
  // second copy so the strip can loop forever
  frames.forEach(function (f) { var c = f.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; tr.appendChild(c); });
  var all = [].slice.call(tr.children), N = frames.length;

  var pos = 0, half = 0, paused = false, seen = false, idle = null, last = 0, mine = false;
  function measure() { half = tr.scrollWidth / 2; }
  function hold() { paused = true; clearTimeout(idle); }
  function release(ms) { clearTimeout(idle); idle = setTimeout(function () { paused = false; pos = sc.scrollLeft; }, ms || 2200); }
  function tick(t) {
    var dt = last ? Math.min(64, t - last) : 16; last = t;
    if (!paused && seen && !reduce && !document.hidden && !lb.open) {
      pos += dt * .028; if (pos >= half) pos -= half;
      mine = true; sc.scrollLeft = pos;
    }
    requestAnimationFrame(tick);
  }
  sc.addEventListener('scroll', function () {
    if (mine) { mine = false; return; }
    pos = sc.scrollLeft; if (half && pos >= half) { pos -= half; mine = true; sc.scrollLeft = pos; }
  }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: .2 }).observe(sc); else seen = true;
  sc.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hold(); });
  sc.addEventListener('pointerleave', function () { release(900); });
  sc.addEventListener('focusin', hold); sc.addEventListener('focusout', function () { release(); });
  sc.addEventListener('wheel', function () { hold(); release(); }, { passive: true });
  sc.addEventListener('touchstart', hold, { passive: true });
  sc.addEventListener('touchend', function () { release(); }, { passive: true });

  // mouse drag to scrub
  var dn = false, sx = 0, sl = 0, moved = 0;
  sc.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; dn = true; sx = e.clientX; sl = sc.scrollLeft; moved = 0; hold(); });
  window.addEventListener('pointermove', function (e) { if (!dn) return; moved = Math.max(moved, Math.abs(e.clientX - sx)); if (moved > 4) sc.classList.add('drag'); sc.scrollLeft = sl - (e.clientX - sx); });
  window.addEventListener('pointerup', function () { if (!dn) return; dn = false; sc.classList.remove('drag'); });

  // lightbox
  var lb = document.getElementById('lb'), lbImg = lb.querySelector('img'), lbT = lb.querySelector('.t'), cur = 0;
  function show(i) {
    cur = (i + N) % N; var f = frames[cur], im = f.querySelector('img');
    lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt; lbT.innerHTML = f.querySelector('.cap').innerHTML;
  }
  all.forEach(function (f, k) {
    f.addEventListener('click', function (e) { if (e.detail && moved > 4) { moved = 0; e.preventDefault(); return; } show(k % N); if (lb.showModal) lb.showModal(); else lb.setAttribute('open', ''); });
  });
  lb.querySelector('.p').addEventListener('click', function () { show(cur - 1); });
  lb.querySelector('.n').addEventListener('click', function () { show(cur + 1); });
  lb.querySelector('.x').addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
  lb.addEventListener('close', function () { release(1200); });

  window.addEventListener('load', measure); window.addEventListener('resize', measure);
  [].forEach.call(tr.querySelectorAll('img'), function (im) { if (!im.complete) im.addEventListener('load', measure); });
  measure(); requestAnimationFrame(tick);
})();

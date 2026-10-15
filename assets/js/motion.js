/* Site-wide motion: scroll reveals, scroll progress bar, header state and count-ups.
   Loaded in <head> so the MutationObserver is attached before the page renders —
   elements are tagged in the same microtask they are inserted, so nothing flashes.
   Page views are re-rendered on every hash change, so new content is picked up
   automatically. Does nothing at all when the visitor prefers reduced motion. */
(function () {
  if (!('IntersectionObserver' in window) || !('MutationObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // [selector, variant]. Elements are only revealed inside the page content and footer.
  var TARGETS = [
    // Shared
    ['.sec-head', 'up'], ['.md-sec-head', 'up'], ['.table-card', 'up'], ['.act-head > *', 'up'],
    // Home
    ['.split > .stack > *', 'up'], ['.leader-photo', 'zoom'], ['.leader-body > *', 'right'],
    ['.slider', 'zoom'], ['.prog-card', 'up'], ['.stage-note', 'up'],
    ['.why-intro > *', 'left'], ['.why-list > li', 'up'], ['.act-step', 'up'],
    ['.seg', 'up'], ['.book-card', 'up'], ['.doc-card', 'up'], ['.testi-card', 'up'],
    ['.cta-band h2', 'left'], ['.cta-band .btn', 'right'],
    // About
    ['.about-media', 'left'], ['.about-text > *', 'up'], ['.stats > li', 'up'],
    ['.value-grid > li', 'up'], ['.facts > li', 'up'], ['.team > .profile', 'up'],
    // Program
    ['.pp-row', 'up'], ['.pp-closing', 'zoom'],
    // Admission
    ['.adm-intro > .stack > *', 'up'], ['.adm-photos > div', 'zoom'], ['.steps > li', 'up'], ['.panel', 'up'],
    // Contact
    ['.contact-grid > .stack > .stack > *', 'up'], ['.info-list > li', 'left'], ['.map', 'zoom'], ['.contact-grid > .form', 'right'],
    // Gallery
    ['.masonry > button', 'zoom'], ['.empty', 'zoom'],
    // Mandatory disclosure & document view
    ['.paper-hint', 'up'], ['.paper-item', 'up'], ['.doc-bar', 'up'], ['.doc-side', 'right'], ['.notfound > *', 'up'],
    // Footer
    ['.foot-grid > *', 'up']
  ];
  var SCOPES = ['#main', '.site-footer'];
  var SELECTOR = TARGETS.map(function (t) {
    return SCOPES.map(function (s) { return s + ' ' + t[0]; }).join(',');
  }).join(',');

  function variantOf(el) {
    for (var i = 0; i < TARGETS.length; i++) if (el.matches(TARGETS[i][0])) return TARGETS[i][1];
    return 'up';
  }

  var io = new IntersectionObserver(function (entries) {
    var shown = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
    shown.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
    shown.forEach(function (el, i) {
      io.unobserve(el);
      el.style.setProperty('--rv-d', Math.min(i, 6) * 90 + 'ms');
      el.setAttribute('data-rv-in', '');
      countUp(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  function scan() {
    var els = document.querySelectorAll(SELECTOR);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.hasAttribute('data-rv')) continue;
      // A target inside another target would move twice — let the outer one carry it.
      if (el.parentElement && el.parentElement.closest('[data-rv]')) continue;
      el.setAttribute('data-rv', variantOf(el));
      io.observe(el);
    }
  }

  // Numbers marked data-count="20" count up from 0 the first time they come into view.
  function countUp(root) {
    var nodes = root.matches('[data-count]') ? [root] : root.querySelectorAll('[data-count]');
    Array.prototype.forEach.call(nodes, function (el) {
      var text = el.firstChild;
      if (!text || text.nodeType !== 3 || el.__counted) return;
      el.__counted = true;
      var end = parseFloat(el.getAttribute('data-count')), suffix = text.nodeValue.replace(/^[\d.]+/, '');
      var start = performance.now(), dur = 1400;
      (function tick(now) {
        var p = Math.min(1, (now - start) / dur), eased = 1 - Math.pow(1 - p, 3);
        text.nodeValue = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    });
  }

  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });

  // Scroll progress bar and header state
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
      document.documentElement.classList.toggle('is-scrolled', scrollY > 8);
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(bar);
    scan();
    onScroll();
  });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  addEventListener('hashchange', onScroll);
})();

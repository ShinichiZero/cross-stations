/**
 * app.js – Stations of the Cross interactive behaviour
 *
 * Responsibilities:
 *  1. Sticky header: update current-station label as user scrolls
 *  2. Intersection Observer: fade/slide sections into view
 *  3. Parallax: subtle background movement on scroll (desktop only)
 *  4. Virtual Candle: wire up toggle buttons using CandleStore,
 *     restore persisted state on load, update "candles lit" counter
 */

(function () {
  'use strict';

  /* ── Guard: CandleStore must be loaded before app.js ─────────────────── */
  if (typeof CandleStore === 'undefined') {
    console.error('CandleStore is not defined – ensure candle.js loads first.');
    return;
  }

  /* ── Cache DOM references ─────────────────────────────────────────────── */
  var header         = document.getElementById('site-header');
  var headerLabel    = document.getElementById('header-station');
  var headerCounter  = document.getElementById('header-candles-lit');
  var stationSections = Array.prototype.slice.call(
    document.querySelectorAll('.station[data-station]')
  );
  var candleButtons  = Array.prototype.slice.call(
    document.querySelectorAll('.candle-btn[data-station]')
  );
  var animateEls     = Array.prototype.slice.call(
    document.querySelectorAll('.animate-on-scroll')
  );
  var stationBgs     = Array.prototype.slice.call(
    document.querySelectorAll('.station-bg[data-parallax]')
  );
  var introBg        = document.querySelector('.intro-bg');

  /* Station metadata – keyed by station number string */
  var STATION_LABELS = {
    '1':  'Station I – Jesus is condemned to death',
    '2':  'Station II – Jesus takes up His Cross',
    '3':  'Station III – Jesus falls the first time',
    '4':  'Station IV – Jesus meets His Mother',
    '5':  'Station V – Simon carries the Cross',
    '6':  'Station VI – Veronica wipes the face of Jesus',
    '7':  'Station VII – Jesus falls the second time',
    '8':  'Station VIII – Jesus meets the women of Jerusalem',
    '9':  'Station IX – Jesus falls the third time',
    '10': 'Station X – Jesus is stripped of His garments',
    '11': 'Station XI – Jesus is nailed to the Cross',
    '12': 'Station XII – Jesus dies on the Cross',
    '13': 'Station XIII – Jesus is taken down from the Cross',
    '14': 'Station XIV – Jesus is laid in the tomb'
  };

  var DEFAULT_LABEL = 'Stations of the Cross';

  /* ── 1. Sticky Header scroll class ───────────────────────────────────── */
  function onScroll() {
    if (header) {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    if (introBg) {
      applyParallax(introBg, 0, 0.3);
    }
  }

  function applyParallax(el, sectionTop, factor) {
    var scroll = window.scrollY - sectionTop;
    el.style.transform = 'translateY(' + (scroll * factor) + 'px)';
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  /* ── 2. Intersection Observer – fade/slide animations ────────────────── */
  var animObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          animObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  animateEls.forEach(function (el) {
    animObserver.observe(el);
  });

  /* ── 3. Sticky Header – active station tracking ───────────────────────── */
  var currentStation = null;

  var stationObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        var num = entry.target.dataset.station;
        if (entry.isIntersecting) {
          currentStation = num;
        } else if (currentStation === num) {
          currentStation = null;
        }
      });
      updateHeaderLabel();
    },
    {
      threshold: 0,
      rootMargin: '-' + Math.floor(window.innerHeight * 0.45) + 'px 0px -' +
                  Math.floor(window.innerHeight * 0.45) + 'px 0px'
    }
  );

  stationSections.forEach(function (section) {
    stationObserver.observe(section);
  });

  function updateHeaderLabel() {
    var label = currentStation && STATION_LABELS[currentStation]
      ? STATION_LABELS[currentStation]
      : DEFAULT_LABEL;
    if (headerLabel) {
      headerLabel.textContent = label;
    }
  }

  /* ── 4. Virtual Candle – restore state & toggle ───────────────────────── */
  function updateCandleCounter() {
    var states = CandleStore.loadAll();
    var litCount = 0;
    for (var i = 1; i <= CandleStore.STATION_COUNT; i++) {
      if (states[i]) litCount++;
    }
    if (headerCounter) {
      headerCounter.textContent = litCount > 0
        ? '🕯️ ' + litCount + ' / ' + CandleStore.STATION_COUNT
        : '';
    }
  }

  function applyButtonState(btn, lit) {
    btn.setAttribute('aria-pressed', lit ? 'true' : 'false');
  }

  /* Restore persisted states on page load */
  candleButtons.forEach(function (btn) {
    var stationNum = btn.dataset.station;
    var lit = false;
    try {
      lit = CandleStore.isLit(stationNum);
    } catch (_) {
      /* invalid station attribute – skip */
    }
    applyButtonState(btn, lit);
  });

  updateCandleCounter();

  /* Toggle on click */
  candleButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var stationNum = btn.dataset.station;
      var newState = false;
      try {
        newState = CandleStore.toggle(stationNum);
      } catch (e) {
        console.warn('Candle toggle failed:', e.message);
        return;
      }
      applyButtonState(btn, newState);
      updateCandleCounter();
    });
  });

  /* ── 5. Parallax on station backgrounds (desktop, reduced-motion off) ── */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    var parallaxBgs = Array.prototype.slice.call(
      document.querySelectorAll('.station-bg')
    );

    function onParallaxScroll() {
      var scrollY = window.scrollY;
      parallaxBgs.forEach(function (bg) {
        var section = bg.parentElement;
        if (!section) return;
        var rect = section.getBoundingClientRect();
        var sectionMid = rect.top + rect.height / 2;
        var viewMid    = window.innerHeight / 2;
        var offset     = (sectionMid - viewMid) * 0.12;
        bg.style.transform = 'translateY(' + offset + 'px)';
      });

      if (introBg) {
        introBg.style.transform = 'translateY(' + (scrollY * 0.25) + 'px)';
      }
    }

    window.addEventListener('scroll', onParallaxScroll, { passive: true });
    onParallaxScroll();
  }

})();

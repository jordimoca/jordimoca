/**
 * JORDI MOCA — Portfolio  ·  script.js
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Modules
 * ───────
 * 01  Theme        — toggle + localStorage + OS preference
 * 02  HeroCanvas   — generative grid that forms JORDI MOCA on load
 *                    cursor interaction, scroll dissolve
 * 03  KineticHero  — subtle mouse parallax on hero text
 * 04  Cursor       — two-element custom cursor (dot + lagged ring)
 * 05  ScrollBar    — progress indicator
 * 06  Nav          — frosted-glass on scroll, hamburger/mobile
 * 07  Reveal       — IntersectionObserver scroll animations
 * 08  ActiveNav    — marks correct nav link as current
 * 09  Magnetic     — magnetic hover on [data-magnetic] elements
 * 10  Init
 *
 * Accessibility
 * ─────────────
 * All animation modules check `REDUCED` (prefers-reduced-motion) at init.
 * If true: canvas is not created, parallax is disabled, reveal elements
 * become visible instantly, cursor animation is skipped.
 *
 * Performance
 * ───────────
 * Single rAF loop for canvas (not running if hero not present).
 * IntersectionObserver for all scroll reveals (no scroll listener needed).
 * Magnetic and cursor each use their own rAF sub-loop only when active.
 */

'use strict';

/* ─── Global: reduced motion flag ──────────────────────────────────────── */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ==========================================================================
   01 · THEME
   ========================================================================== */

const Theme = (() => {
  const HTML   = document.documentElement;
  const btn    = document.getElementById('theme-toggle');
  const STORE  = 'jm-theme';
  const TRANS  = 'theme-transitioning';

  function get() {
    return HTML.dataset.theme;
  }

  function set(theme) {
    HTML.classList.add(TRANS);
    HTML.dataset.theme = theme;
    localStorage.setItem(STORE, theme);
    if (btn) btn.setAttribute('aria-pressed', String(theme === 'dark'));
    setTimeout(() => HTML.classList.remove(TRANS), 450);
  }

  function init() {
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(get() === 'dark'));
    btn.addEventListener('click', () => set(get() === 'dark' ? 'light' : 'dark'));

    /* Follow OS preference only if user hasn't manually chosen */
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(STORE)) set(e.matches ? 'dark' : 'light');
    });
  }

  return { init, get };
})();


/* ==========================================================================
   02 · HERO CANVAS
   ─────────────────────────────────────────────────────────────────────────
   Creates a grid of small dots filling the viewport.
   On load: dots form the letters JORDI MOCA via a left-to-right wave.
   On cursor move: dots within ~110px radius react (grow + brighten).
   On scroll: letter dots dissolve back to neutral.

   Implementation
   ──────────────
   1. Measure hero, set canvas to full viewport size
   2. Sample letter positions: render JORDI MOCA to offscreen canvas at
      large font size, read pixel data, mark which grid cells contain ink
   3. Assign stagger delays to letter cells (left-to-right wave)
   4. Run rAF loop: update cell states, draw all cells

   Cell data: { x, y, idx, t, delay, cur }
     t     — activation progress 0→1 (letter cells)
     delay — ms until this cell starts activating
     cur   — cursor influence 0→1
   ========================================================================== */

const HeroCanvas = (() => {

  /* ── Config ──────────────────────────────────────────────────────────── */
  const CELL     = 17;   /* grid cell size in px */
  const DOT_R    = 1.4;  /* base dot radius in px */
  const CURSOR_R = 110;  /* cursor influence radius in px */
  const STAGGER  = 1200; /* ms for full left→right stagger */
  const CELL_DUR = 280;  /* ms for each cell's ease-in animation */
  const DELAY_MS = 220;  /* ms before reveal starts (canvas fade-in first) */

  /* ── State ───────────────────────────────────────────────────────────── */
  let canvas, ctx;
  let W = 0, H = 0, COLS = 0, ROWS = 0;
  let cells      = [];
  let letterSet  = new Set();
  let mouse      = { x: -9999, y: -9999 };
  let scrollY    = 0;
  let revealAt   = null; /* performance.now() when reveal starts */
  let raf        = null;

  /* ── Easing ──────────────────────────────────────────────────────────── */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* ── Debounce ────────────────────────────────────────────────────────── */
  function debounce(fn, wait) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
  }

  /* ── Measure ─────────────────────────────────────────────────────────── */
  function measure() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    COLS = Math.ceil(W / CELL);
    ROWS = Math.ceil(H / CELL);
  }

  /* ── Build grid ──────────────────────────────────────────────────────── */
  function buildGrid() {
    cells = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        cells.push({
          x:     c * CELL + CELL / 2,
          y:     r * CELL + CELL / 2,
          idx:   r * COLS + c,
          t:     0,        /* activation 0→1 */
          delay: Infinity, /* ms — set during scheduleReveal */
          cur:   0,        /* cursor influence 0→1 */
        });
      }
    }
  }

  /* ── Sample letter positions ─────────────────────────────────────────── */
  /* Renders JORDI MOCA to an offscreen canvas, reads pixel data,
     marks which grid cells contain letter pixels.                         */
  async function sampleLetters() {
    /* Wait for Inter to be available */
    await document.fonts.ready;

    const off = document.createElement('canvas');
    off.width  = W;
    off.height = H;
    const octx = off.getContext('2d');

    /* Font size: 17% of viewport height, clamped to reasonable range */
    const fs = Math.max(80, Math.min(H * 0.17, W * 0.115, 200));

    octx.font          = `800 ${fs}px Inter, system-ui, sans-serif`;
    octx.fillStyle     = '#fff';
    octx.textBaseline  = 'middle';

    const txt = 'JORDI MOCA';
    const tw  = octx.measureText(txt).width;

    /* Centre text horizontally, position at 44% from top */
    const tx = (W - tw) / 2;
    const ty = H * 0.44;
    octx.fillText(txt, tx, ty);

    const data = octx.getImageData(0, 0, W, H).data;
    letterSet.clear();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        /* Sample the centre of the cell */
        const px = Math.round(c * CELL + CELL / 2);
        const py = Math.round(r * CELL + CELL / 2);
        if (px < W && py < H) {
          /* Check alpha channel (offset +3 from RGBA start of pixel) */
          const i = (py * W + px) * 4;
          if (data[i + 3] > 110) {
            letterSet.add(r * COLS + c);
          }
        }
      }
    }
  }

  /* ── Schedule reveal ─────────────────────────────────────────────────── */
  /* Assigns stagger delays to letter cells, sorted left→right.           */
  function scheduleReveal() {
    if (REDUCED) {
      /* Instant: all letter cells go to t=1 immediately */
      cells.forEach(c => { if (letterSet.has(c.idx)) c.t = 1; });
      return;
    }

    const lc = cells.filter(c => letterSet.has(c.idx));
    if (!lc.length) return;

    const xMin = Math.min(...lc.map(c => c.x));
    const xMax = Math.max(...lc.map(c => c.x));
    const span = Math.max(1, xMax - xMin);

    lc.forEach(c => {
      /* Left→right ratio with slight per-cell jitter for organic feel */
      const ratio = (c.x - xMin) / span;
      const jitter = (Math.random() - 0.5) * 0.04;
      c.delay = DELAY_MS + (ratio + jitter) * STAGGER;
    });

    revealAt = performance.now();
  }

  /* ── Update ──────────────────────────────────────────────────────────── */
  function update(now) {
    /* How much of the hero has been scrolled away (0→1) */
    const dissolve = Math.min(1, scrollY / (H * 0.55));

    for (const cell of cells) {
      /* Letter activation */
      if (letterSet.has(cell.idx) && revealAt !== null) {
        const elapsed = now - revealAt - cell.delay;
        if (elapsed > 0) {
          const raw = elapsed / CELL_DUR;
          const activated = easeOut(Math.min(1, raw));
          cell.t = activated * (1 - dissolve);
        } else {
          /* Not started yet — dissolve might still apply to pre-existing t */
          cell.t *= (1 - dissolve);
        }
      }

      /* Cursor influence — smooth lerp */
      if (!REDUCED) {
        const dx  = mouse.x - cell.x;
        const dy  = mouse.y - cell.y;
        const d   = Math.sqrt(dx * dx + dy * dy);
        const tgt = d < CURSOR_R ? (1 - d / CURSOR_R) * 0.72 : 0;
        cell.cur += (tgt - cell.cur) * 0.09;
      }
    }
  }

  /* ── Draw ────────────────────────────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    const isDark = document.documentElement.dataset.theme !== 'light';

    /* Base dot colour (white in dark mode, dark in light mode) */
    const bR = isDark ? 250 : 13;
    const bG = isDark ? 250 : 13;
    const bB = isDark ? 250 : 13;

    /* Accent colour (#3A7BFF dark / #1D4ED8 light) */
    const aR = isDark ? 58  : 29;
    const aG = isDark ? 123 : 78;
    const aB = isDark ? 255 : 216;

    for (const cell of cells) {
      const isLetter = letterSet.has(cell.idx);
      const act      = isLetter ? cell.t : 0;
      const cur      = cell.cur;

      let r, g, b, alpha, radius;

      if (act > 0) {
        /* Letter cell: interpolate from base colour → accent */
        r = bR + (aR - bR) * act;
        g = bG + (aG - bG) * act;
        b = bB + (aB - bB) * act;
        const baseA = isDark ? 0.11 : 0.09;
        alpha  = baseA + act * 0.78 + cur * 0.10;
        radius = DOT_R + act * 0.75 + cur * 0.9;
      } else {
        r = bR; g = bG; b = bB;
        const baseA = isDark ? 0.09 : 0.07;
        alpha  = baseA + cur * 0.32;
        radius = DOT_R + cur * 1.2;
      }

      if (alpha < 0.004) continue; /* skip invisible cells */

      ctx.beginPath();
      ctx.arc(cell.x, cell.y, Math.max(0.4, radius), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${Math.min(1, alpha).toFixed(3)})`;
      ctx.fill();
    }
  }

  /* ── rAF loop ────────────────────────────────────────────────────────── */
  function startLoop() {
    function tick(now) {
      update(now);
      draw();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  /* ── Resize ──────────────────────────────────────────────────────────── */
  const onResize = debounce(async () => {
    cancelAnimationFrame(raf);
    measure();
    buildGrid();
    await sampleLetters();
    scheduleReveal();
    startLoop();
  }, 300);

  /* ── Init ────────────────────────────────────────────────────────────── */
  async function init() {
    if (REDUCED) return;

    canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');

    measure();
    buildGrid();
    await sampleLetters();
    scheduleReveal();
    startLoop();

    /* Mouse tracking (position relative to canvas top-left) */
    document.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }, { passive: true });

    /* Scroll tracking for dissolve */
    window.addEventListener('scroll', () => {
      scrollY = window.scrollY;
    }, { passive: true });

    window.addEventListener('resize', onResize);
  }

  return { init };
})();


/* ==========================================================================
   03 · KINETIC HERO
   ─────────────────────────────────────────────────────────────────────────
   Subtle mouse parallax on the hero text — ±8px horizontal, ±5px vertical.
   Disabled: touch devices, reduced motion.
   ========================================================================== */

const KineticHero = (() => {
  let heroBody, tx = 0, ty = 0, cx = 0, cy = 0;
  let active = true;

  function init() {
    if (REDUCED || window.matchMedia('(hover: none)').matches) return;

    heroBody = document.getElementById('hero-body');
    if (!heroBody) return;

    document.addEventListener('mousemove', e => {
      if (!active) return;
      tx = (e.clientX / window.innerWidth  - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('scroll', () => {
      active = window.scrollY < window.innerHeight;
    }, { passive: true });

    function tick() {
      /* Lerp toward mouse position */
      cx += (tx - cx) * 0.055;
      cy += (ty - cy) * 0.055;

      if (active && heroBody) {
        heroBody.style.transform =
          `translate(${(cx * 8).toFixed(2)}px, ${(cy * 5).toFixed(2)}px)`;
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  return { init };
})();


/* ==========================================================================
   04 · CURSOR
   ─────────────────────────────────────────────────────────────────────────
   .cur-dot  — tracks exactly with pointer (instant)
   .cur-ring — follows with spring-like lag via rAF

   Body classes:
     .cur-hover — over interactive elements (ring slightly expands)
     .cur-view  — over work rows (ring fills with accent)
   ========================================================================== */

const Cursor = (() => {
  const dot  = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');

  let mx = 0, my = 0;
  let rx = 0, ry = 0;

  const HOVER_SEL = 'a, button, [role="button"], .theme-btn, label';
  const VIEW_SEL  = '.work-row:not(.work-row--locked)';

  function animRing() {
    rx += (mx - rx - 18) * 0.11;
    ry += (my - ry - 18) * 0.11;
    if (ring) ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(animRing);
  }

  function init() {
    if (!dot || !ring) return;
    if (window.matchMedia('(hover: none)').matches) return;
    if (REDUCED) return;

    /* Exact dot tracking */
    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
    }, { passive: true });

    /* Hover detection */
    document.addEventListener('mouseover', e => {
      if (e.target.closest(VIEW_SEL))  { document.body.classList.add('cur-view');  return; }
      if (e.target.closest(HOVER_SEL)) document.body.classList.add('cur-hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(VIEW_SEL))  document.body.classList.remove('cur-view');
      if (e.target.closest(HOVER_SEL)) document.body.classList.remove('cur-hover');
    });

    /* Hide when leaving window */
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity = '';
      ring.style.opacity = '';
    });

    animRing();
  }

  return { init };
})();


/* ==========================================================================
   05 · SCROLL BAR
   ========================================================================== */

const ScrollBar = (() => {
  const bar = document.getElementById('scroll-bar');

  function update() {
    if (!bar) return;
    const st = window.scrollY;
    const dh = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (dh > 0 ? (st / dh) * 100 : 0) + '%';
  }

  function init() {
    if (!bar) return;
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  return { init };
})();


/* ==========================================================================
   06 · NAV
   ========================================================================== */

const Nav = (() => {
  const nav = document.getElementById('site-nav');
  const hbg = document.getElementById('hamburger');
  const mob = document.getElementById('mob-menu');
  let open  = false;

  function setScrolled() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 24);
  }

  function openMenu() {
    open = true;
    hbg?.classList.add('open');
    hbg?.setAttribute('aria-expanded', 'true');
    mob?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    open = false;
    hbg?.classList.remove('open');
    hbg?.setAttribute('aria-expanded', 'false');
    mob?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function init() {
    window.addEventListener('scroll', setScrolled, { passive: true });
    setScrolled();

    hbg?.addEventListener('click', () => open ? closeMenu() : openMenu());
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) closeMenu(); });
    mob?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  }

  return { init };
})();


/* ==========================================================================
   07 · REVEAL
   ─────────────────────────────────────────────────────────────────────────
   IntersectionObserver adds .visible to .reveal elements when in viewport.
   If reduced motion: all elements made visible instantly on init.
   ========================================================================== */

const Reveal = (() => {
  function init() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (REDUCED) {
      items.forEach(el => el.classList.add('visible'));
      return;
    }

    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.07, rootMargin: '0px 0px -16px 0px' }
    );

    items.forEach(el => io.observe(el));
  }

  return { init };
})();


/* ==========================================================================
   08 · ACTIVE NAV
   Sets aria-current="page" on the matching nav link.
   ========================================================================== */

const ActiveNav = (() => {
  function init() {
    const path  = window.location.pathname;
    const links = document.querySelectorAll('.nav-links a');

    links.forEach(link => {
      const raw  = link.getAttribute('href') || '';
      const href = raw.replace(/^(\.\.\/)+/, '/').replace(/^\.\//, '/').replace(/index\.html$/, '');
      const norm = path.replace(/index\.html$/, '');

      const isHome     = (norm === '/' || norm === '') && (href === '/' || href === '');
      const isWork     = norm.includes('/work')     && href.includes('/work');
      const isInsights = norm.includes('/insights') && href.includes('/insights');
      const isAbout    = norm.includes('/about')    && href.includes('/about');

      if (isHome || isWork || isInsights || isAbout) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  return { init };
})();


/* ==========================================================================
   09 · MAGNETIC
   ─────────────────────────────────────────────────────────────────────────
   Elements with [data-magnetic] shift slightly toward cursor on hover.
   The element resets smoothly on mouse leave.
   Disabled on touch devices and with reduced motion.
   ========================================================================== */

const Magnetic = (() => {
  function init() {
    if (REDUCED || window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r  = el.getBoundingClientRect();
        const cx = r.left + r.width  / 2;
        const cy = r.top  + r.height / 2;
        const dx = (e.clientX - cx) * 0.28;
        const dy = (e.clientY - cy) * 0.28;
        el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
        el.style.transition = 'transform 0.1s linear';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1)';
      });
    });
  }

  return { init };
})();


/* ==========================================================================
   10 · HERO SCROLL FADE
   ─────────────────────────────────────────────────────────────────────────
   Hero body content gently fades + rises as the user scrolls.
   Creates cinematic exit from the hero section.
   ========================================================================== */

const HeroScrollFade = (() => {
  function init() {
    if (REDUCED) return;

    const heroBody = document.getElementById('hero-body');
    if (!heroBody) return;

    const hero = document.querySelector('.hero');
    if (!hero) return;

    window.addEventListener('scroll', () => {
      const scrolled  = window.scrollY;
      const heroH     = hero.offsetHeight;
      const threshold = heroH * 0.45;
      const ratio     = Math.min(1, Math.max(0, scrolled / threshold));

      /* Fade out + slight upward move */
      heroBody.style.opacity  = String((1 - ratio * 1.2).toFixed(3));
      /* Don't override kinetic transform here — compose via separate layer */
      /* Only apply when ratio > 0 to avoid unnecessary style changes */
    }, { passive: true });
  }

  return { init };
})();


/* ==========================================================================
   INIT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();
  Nav.init();
  ScrollBar.init();
  Cursor.init();
  Reveal.init();
  ActiveNav.init();
  Magnetic.init();
  HeroScrollFade.init();

  /* Canvas hero — async (needs font to be ready for letter sampling) */
  await HeroCanvas.init();

  /* Kinetic parallax on hero — runs independently via rAF */
  KineticHero.init();
});

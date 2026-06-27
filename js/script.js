/**
 * JORDI MOCA — Portfolio  ·  script.js
 * ─────────────────────────────────────────────────────────────────────────
 * Modules
 * ───────
 * 01  HeroMesh     — interactive dot-mesh canvas behind the hero
 * 02  HeroGlow     — lime glow that follows the pointer inside the hero
 * 03  Scramble     — text-scramble on the hero name + experience rows
 * 04  HeroEntrance — staggered rise-up reveal for hero content
 * 05  Cursor       — two-element custom cursor (dot + lagged ring)
 * 06  ScrollBar    — scroll progress indicator (+ article progress)
 * 07  Nav          — frosted-glass on scroll, hamburger / mobile menu
 * 08  Reveal       — IntersectionObserver scroll reveals
 * 09  ActiveNav    — marks the matching nav link as current
 * 10  Magnetic     — magnetic hover on [data-magnetic] elements
 * 11  Init
 *
 * Accessibility / performance
 * ───────────────────────────
 * Every animation module checks REDUCED (prefers-reduced-motion). If true,
 * the canvas is skipped, scramble resolves to the final text instantly,
 * reveals show immediately and the custom cursor is not used.
 * The mesh runs a single rAF loop and pauses while the hero is off-screen.
 */

'use strict';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NO_HOVER = window.matchMedia('(hover: none)').matches;

/* Read a CSS custom property as an "r,g,b" triplet (falls back to lime). */
function accentRGB() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#CDFF00';
  const m = v.replace('#', '');
  const int = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}


/* ==========================================================================
   01 · SITE MESH
   Full-page fixed background: a grid of dots gently drifts; dots near the
   pointer pull toward it, brighten to the accent colour and link up with
   short lines. Present behind every page (z-index:-1).
   ========================================================================== */

const SiteMesh = (() => {
  let cvs, ctx, raf = null;
  let W = 0, H = 0, dots = [], t = 0;
  const GAP = 34, RADIUS = 165, LINK = 48;
  const m = { x: -9999, y: -9999, active: false };
  let ACC = [205, 255, 0];

  function build() {
    W = cvs.width = Math.max(1, window.innerWidth);
    H = cvs.height = Math.max(1, window.innerHeight);
    dots = [];
    for (let y = GAP / 2; y < H; y += GAP)
      for (let x = GAP / 2; x < W; x += GAP) dots.push({ x, y, ox: x, oy: y });
  }

  function loop() {
    t += 0.01;
    ctx.clearRect(0, 0, W, H);
    const near = [];
    for (const d of dots) {
      const dx = d.x - m.x, dy = d.y - m.y, dist = Math.hypot(dx, dy) || 0.001;
      let px = d.ox + Math.sin(t + d.ox * 0.01) * 2;
      let py = d.oy + Math.cos(t + d.oy * 0.01) * 2;
      let r = 1.1, col = 'rgba(120,120,112,0.45)';
      if (m.active && dist < RADIUS) {
        const f = 1 - dist / RADIUS;
        px += dx / dist * f * 20; py += dy / dist * f * 20;
        r = 1.1 + f * 2.4;
        col = `rgba(${ACC[0]},${ACC[1]},${ACC[2]},${(0.35 + f * 0.65).toFixed(3)})`;
        near.push({ x: px, y: py });
      }
      d.x = px; d.y = py;
      ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fillStyle = col; ctx.fill();
    }
    if (near.length) {
      ctx.lineWidth = 1;
      for (let i = 0; i < near.length; i++)
        for (let j = i + 1; j < near.length; j++) {
          const a = near[i], b = near[j], dd = Math.hypot(a.x - b.x, a.y - b.y);
          if (dd < LINK) {
            ctx.strokeStyle = `rgba(${ACC[0]},${ACC[1]},${ACC[2]},${(0.22 * (1 - dd / LINK)).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
    }
    raf = requestAnimationFrame(loop);
  }

  function start() { if (raf === null) raf = requestAnimationFrame(loop); }
  function stop() { if (raf !== null) { cancelAnimationFrame(raf); raf = null; ctx && ctx.clearRect(0, 0, W, H); } }

  function init() {
    if (REDUCED) return;
    cvs = document.getElementById('site-canvas');
    if (!cvs) return;
    ctx = cvs.getContext('2d');
    ACC = accentRGB();
    build();
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });

    window.addEventListener('pointermove', e => {
      m.x = e.clientX; m.y = e.clientY; m.active = true;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { m.active = false; m.x = m.y = -9999; });

    /* Pause the loop while the tab is hidden */
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

    start();
  }

  return { init };
})();


/* ==========================================================================
   02 · HERO GLOW — lime glow that follows the pointer inside the hero only
   ========================================================================== */

const HeroGlow = (() => {
  function init() {
    if (REDUCED || NO_HOVER) return;
    const host = document.querySelector('.hero');
    const g = document.getElementById('hero-glow');
    if (!host || !g) return;
    host.addEventListener('pointermove', e => {
      const r = host.getBoundingClientRect();
      g.style.opacity = '1';
      g.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
    });
    host.addEventListener('pointerleave', () => { g.style.opacity = '0'; });
  }
  return { init };
})();


/* ==========================================================================
   03 · SCRAMBLE
   ========================================================================== */

const Scramble = (() => {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ#%&/<>0123456789';

  function run(el) {
    if (!el) return;
    const final = el.getAttribute('data-text') || el.textContent;
    clearInterval(el._iv);
    let it = 0;
    el._iv = setInterval(() => {
      el.textContent = final.split('').map((c, i) =>
        c === ' ' ? ' ' : (i < it ? final[i] : CHARS[Math.floor(Math.random() * CHARS.length)])
      ).join('');
      it += 0.5;
      if (it >= final.length) { clearInterval(el._iv); el.textContent = final; }
    }, 30);
  }

  function init() {
    const targets = document.querySelectorAll('[data-scramble]');
    if (!targets.length) return;

    if (REDUCED) {
      /* Ensure the literal final text is shown, no animation */
      targets.forEach(el => { el.textContent = el.getAttribute('data-text') || el.textContent; });
      return;
    }

    /* Hero name: run once on load */
    document.querySelectorAll('.hero-name [data-scramble]').forEach(el => run(el));

    /* Experience rows: scramble the role title when the row is hovered */
    document.querySelectorAll('[data-exp-row]').forEach(row => {
      const title = row.querySelector('[data-scramble]');
      if (title) row.addEventListener('pointerenter', () => run(title));
    });

    /* Any other scramble target: replay on hover */
    targets.forEach(el => {
      if (el.closest('[data-exp-row]')) return;
      el.addEventListener('pointerenter', () => run(el));
    });
  }

  return { init };
})();


/* ==========================================================================
   04 · HERO ENTRANCE
   ========================================================================== */

const HeroEntrance = (() => {
  function init() {
    const body = document.getElementById('hero-body');
    if (!body) return;
    requestAnimationFrame(() => body.classList.add('hero-in'));
  }
  return { init };
})();


/* ==========================================================================
   05 · CURSOR
   ========================================================================== */

const Cursor = (() => {
  const dot = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;
  const HOVER_SEL = 'a, button, [role="button"], label, [data-magnetic]';
  const VIEW_SEL = '.work-row:not(.work-row--locked), .insight-row, .insight-row2';

  function animRing() {
    rx += (mx - rx - 17) * 0.11; ry += (my - ry - 17) * 0.11;
    if (ring) ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(animRing);
  }

  function init() {
    if (!dot || !ring || NO_HOVER || REDUCED) return;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
    }, { passive: true });
    document.addEventListener('mouseover', e => {
      if (e.target.closest(VIEW_SEL)) { document.body.classList.add('cur-view'); return; }
      if (e.target.closest(HOVER_SEL)) document.body.classList.add('cur-hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(VIEW_SEL)) document.body.classList.remove('cur-view');
      if (e.target.closest(HOVER_SEL)) document.body.classList.remove('cur-hover');
    });
    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = ''; ring.style.opacity = ''; });
    animRing();
  }
  return { init };
})();


/* ==========================================================================
   06 · SCROLL BAR  (top progress + optional article progress)
   ========================================================================== */

const ScrollBar = (() => {
  const bar = document.getElementById('scroll-bar');
  const article = document.getElementById('article-progress');

  function update() {
    const st = window.scrollY;
    const dh = document.documentElement.scrollHeight - window.innerHeight;
    const pct = dh > 0 ? (st / dh) * 100 : 0;
    if (bar) bar.style.width = pct + '%';
    if (article) article.style.width = pct + '%';
  }

  function init() {
    if (!bar && !article) return;
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
  return { init };
})();


/* ==========================================================================
   07 · NAV
   ========================================================================== */

const Nav = (() => {
  const nav = document.getElementById('site-nav');
  const hbg = document.getElementById('hamburger');
  const mob = document.getElementById('mob-menu');
  let open = false;

  function setScrolled() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 24); }
  function openMenu() { open = true; hbg?.classList.add('open'); hbg?.setAttribute('aria-expanded', 'true'); mob?.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeMenu() { open = false; hbg?.classList.remove('open'); hbg?.setAttribute('aria-expanded', 'false'); mob?.classList.remove('open'); document.body.style.overflow = ''; }

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
   08 · REVEAL
   ========================================================================== */

const Reveal = (() => {
  function init() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (REDUCED) { items.forEach(el => el.classList.add('visible')); return; }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }),
      { threshold: 0.07, rootMargin: '0px 0px -16px 0px' }
    );
    items.forEach(el => io.observe(el));
  }
  return { init };
})();


/* ==========================================================================
   09 · ACTIVE NAV
   ========================================================================== */

const ActiveNav = (() => {
  function init() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
      const raw = link.getAttribute('href') || '';
      const href = raw.replace(/^(\.\.\/)+/, '/').replace(/^\.\//, '/').replace(/index\.html$/, '');
      const norm = path.replace(/index\.html$/, '');
      const isHome = (norm === '/' || norm === '') && (href === '/' || href === '');
      const isWork = norm.includes('/work') && href.includes('/work');
      const isBlog = norm.includes('/blog') && href.includes('/blog');
      const isAbout = norm.includes('/about-me') && href.includes('/about-me');
      if (isHome || isWork || isBlog || isAbout) link.setAttribute('aria-current', 'page');
    });
  }
  return { init };
})();


/* ==========================================================================
   10 · MAGNETIC
   ========================================================================== */

const Magnetic = (() => {
  function init() {
    if (REDUCED || NO_HOVER) return;
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.3;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
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
   11 · INIT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  Nav.init();
  ScrollBar.init();
  Cursor.init();
  Reveal.init();
  ActiveNav.init();
  Magnetic.init();
  HeroEntrance.init();
  HeroGlow.init();
  Scramble.init();
  SiteMesh.init();
});

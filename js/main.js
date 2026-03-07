/**
 * JORDI MOCA — PORTFOLIO
 * main.js v2
 *
 * Modules:
 * 01. Theme — toggle, persistence, OS preference
 * 02. Custom Cursor
 * 03. Scroll Progress
 * 04. Navigation — scroll state, hamburger
 * 05. Scroll Reveal — IntersectionObserver
 * 06. Active Nav Link
 * 07. Article TOC — smooth scroll + active highlight
 * 08. Init
 */

'use strict';

/* ==========================================================================
   01. THEME
   ========================================================================== */

const Theme = (() => {
  const HTML   = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const STORE  = 'jm-theme';
  const TRANS  = 'theme-transitioning';

  function getSystem() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getCurrent() {
    return HTML.getAttribute('data-theme');
  }

  function set(theme) {
    HTML.classList.add(TRANS);
    HTML.setAttribute('data-theme', theme);
    localStorage.setItem(STORE, theme);
    if (toggle) toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    setTimeout(() => HTML.classList.remove(TRANS), 450);
  }

  function init() {
    if (toggle) {
      toggle.setAttribute('aria-pressed', getCurrent() === 'dark' ? 'true' : 'false');
      toggle.addEventListener('click', () => set(getCurrent() === 'dark' ? 'light' : 'dark'));
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(STORE)) set(e.matches ? 'dark' : 'light');
    });
  }

  return { init, set, getCurrent };
})();


/* ==========================================================================
   02. CUSTOM CURSOR
   ========================================================================== */

const Cursor = (() => {
  const dot  = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');

  let mx = 0, my = 0;
  let rx = 0, ry = 0;

  const HOVER_TARGETS = 'a, button, [role="button"], .work-item--active, .theme-toggle, .insight-card, .insight-row, .related-card';

  function animateRing() {
    rx += (mx - rx - 20) * 0.14;
    ry += (my - ry - 20) * 0.14;
    if (ring) ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(animateRing);
  }

  function init() {
    if (!dot || !ring) return;
    if (window.matchMedia('(hover: none)').matches) return;

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      if (dot) dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
    }, { passive: true });

    document.addEventListener('mouseover', e => {
      if (e.target.closest(HOVER_TARGETS)) document.body.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(HOVER_TARGETS)) document.body.classList.remove('cursor-hover');
    });
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0'; ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity = ''; ring.style.opacity = '';
    });

    animateRing();
  }

  return { init };
})();


/* ==========================================================================
   03. SCROLL PROGRESS
   ========================================================================== */

const ScrollProgress = (() => {
  const bar = document.getElementById('scroll-progress');

  function update() {
    if (!bar) return;
    const st  = window.scrollY;
    const dh  = document.documentElement.scrollHeight - window.innerHeight;
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
   04. NAVIGATION
   ========================================================================== */

const Nav = (() => {
  const nav = document.getElementById('site-nav');
  const hbg = document.getElementById('hamburger');
  const mob = document.getElementById('mob-menu');

  let isOpen = false;

  function setScrolled() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 32);
  }

  function openMobile() {
    isOpen = true;
    if (hbg) { hbg.classList.add('is-open'); hbg.setAttribute('aria-expanded', 'true'); }
    if (mob) mob.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobile() {
    isOpen = false;
    if (hbg) { hbg.classList.remove('is-open'); hbg.setAttribute('aria-expanded', 'false'); }
    if (mob) mob.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function init() {
    window.addEventListener('scroll', setScrolled, { passive: true });
    setScrolled();
    if (hbg) hbg.addEventListener('click', () => isOpen ? closeMobile() : openMobile());
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeMobile(); });
    if (mob) mob.querySelectorAll('a').forEach(l => l.addEventListener('click', closeMobile));
  }

  return { init, closeMobile };
})();


/* ==========================================================================
   05. SCROLL REVEAL
   ========================================================================== */

const Reveal = (() => {
  function init() {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }
  return { init };
})();


/* ==========================================================================
   06. ACTIVE NAV LINK
   ========================================================================== */

const ActiveNav = (() => {
  function init() {
    const path  = window.location.pathname;
    const links = document.querySelectorAll('.nav-links a');

    links.forEach(link => {
      const raw  = link.getAttribute('href') || '';
      // Normalise: strip leading ../ and ./ and trailing index.html
      const href = raw.replace(/^(\.\.\/)+/, '/').replace(/^\.\//, '/').replace(/index\.html$/, '');
      const norm = path.replace(/index\.html$/, '');

      const isHome     = (norm === '/' || norm === '') && (href === '/' || href === '');
      const isWorkRoot = norm.includes('/work') && href.includes('/work');
      const isInsights = norm.includes('/insights') && href.includes('/insights');
      const isAbout    = norm.includes('/about') && href.includes('/about');

      if (isHome || isWorkRoot || isInsights || isAbout) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }
  return { init };
})();


/* ==========================================================================
   07. ARTICLE TOC — smooth scroll + active section highlight
   ========================================================================== */

const ArticleTOC = (() => {
  function init() {
    const tocLinks = document.querySelectorAll('.article-toc__link');
    if (!tocLinks.length) return;

    // Smooth scroll to section
    tocLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
          window.scrollTo({ top: target.offsetTop - navH - 24, behavior: 'smooth' });
        }
      });
    });

    // Highlight active section
    const sections = Array.from(tocLinks)
      .map(l => document.querySelector(l.getAttribute('href')))
      .filter(Boolean);

    if (!sections.length) return;

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = '#' + entry.target.id;
            tocLinks.forEach(l => l.style.color = l.getAttribute('href') === id ? 'var(--fg)' : '');
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    sections.forEach(s => io.observe(s));
  }
  return { init };
})();


/* ==========================================================================
   08. INIT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Cursor.init();
  ScrollProgress.init();
  Nav.init();
  Reveal.init();
  ActiveNav.init();
  ArticleTOC.init();
});

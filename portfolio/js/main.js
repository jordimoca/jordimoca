/**
 * JORDI MOCA — PORTFOLIO
 * main.js
 *
 * Modules:
 * 01. Theme — toggle, persistence, OS preference
 * 02. Custom Cursor
 * 03. Scroll Progress
 * 04. Navigation — scroll state, hamburger
 * 05. Scroll Reveal — IntersectionObserver
 * 06. Active Nav Link
 * 07. Init
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
    // Anti-FOUC: theme is already set by inline script in <head>.
    // Sync the toggle button's aria state.
    if (toggle) {
      toggle.setAttribute('aria-pressed', getCurrent() === 'dark' ? 'true' : 'false');
      toggle.addEventListener('click', () => {
        set(getCurrent() === 'dark' ? 'light' : 'dark');
      });
    }

    // Respond to OS preference changes when no manual override exists
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(STORE)) {
        set(e.matches ? 'dark' : 'light');
      }
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

  let mx = 0, my = 0; // mouse
  let rx = 0, ry = 0; // ring (lagged)
  let rafId;

  const HOVER_TARGETS = 'a, button, [role="button"], .work-item--active, .theme-toggle';

  function animateRing() {
    rx += (mx - rx - 20) * 0.14;
    ry += (my - ry - 20) * 0.14;
    if (ring) ring.style.transform = `translate(${rx}px, ${ry}px)`;
    rafId = requestAnimationFrame(animateRing);
  }

  function onMove(e) {
    mx = e.clientX;
    my = e.clientY;
    if (dot) dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
  }

  function init() {
    if (!dot || !ring) return;
    if (window.matchMedia('(hover: none)').matches) return; // touch devices

    document.addEventListener('mousemove', onMove, { passive: true });

    document.addEventListener('mouseover', e => {
      if (e.target.closest(HOVER_TARGETS)) document.body.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(HOVER_TARGETS)) document.body.classList.remove('cursor-hover');
    });

    document.addEventListener('mouseleave', () => {
      dot.style.opacity  = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity  = '';
      ring.style.opacity = '';
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
    const scrollTop   = window.scrollY;
    const docHeight   = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width   = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
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

    if (hbg) {
      hbg.addEventListener('click', () => isOpen ? closeMobile() : openMobile());
    }

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) closeMobile();
    });

    // Close mobile menu links after click
    if (mob) {
      mob.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => closeMobile());
      });
    }
  }

  return { init, closeMobile };
})();


/* ==========================================================================
   05. SCROLL REVEAL
   ========================================================================== */

const Reveal = (() => {
  let observer;

  function init() {
    observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.10, rootMargin: '0px 0px -20px 0px' }
    );

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
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
      const href = link.getAttribute('href');
      // Match homepage exactly; match sub-pages by prefix
      if (
        (path === '/' || path.endsWith('index.html')) && (href === '/' || href === 'index.html' || href === './index.html')
        || (href !== '/' && href !== 'index.html' && href !== './index.html' && path.includes(href.replace(/^\.\.\//, '').replace(/^\.\//, '')))
      ) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  return { init };
})();


/* ==========================================================================
   07. INIT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Cursor.init();
  ScrollProgress.init();
  Nav.init();
  Reveal.init();
  ActiveNav.init();
});

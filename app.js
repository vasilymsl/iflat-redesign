/* app.js — iFlat interactions */

(function() {
  'use strict';

  // ========================================
  // Hamburger Menu
  // ========================================
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ========================================
  // Tariff Tab Switching
  // ========================================
  const tabs = document.querySelectorAll('.tariff-tab');
  const panels = document.querySelectorAll('.tariff-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      panels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.dataset.panel === target) {
          panel.classList.add('active');
          // Staggered card reveal
          const cards = panel.querySelectorAll('.tariff-card');
          cards.forEach((card, i) => {
            card.style.opacity = '0';
            setTimeout(() => {
              card.style.transition = 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)';
              card.style.opacity = '1';
            }, 80 * i);
          });
        }
      });
    });
  });

  // ========================================
  // Scroll Reveal (IntersectionObserver)
  // ========================================
  const reveals = document.querySelectorAll('.reveal');

  if (reveals.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add a small stagger for child elements if present
          const staggerChildren = entry.target.hasAttribute('data-stagger');
          if (staggerChildren) {
            Array.from(entry.target.children).forEach((child, i) => {
              child.style.opacity = '0';
              child.style.transition = 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)';
              child.style.transitionDelay = (60 * i) + 'ms';
              // Force reflow then animate
              requestAnimationFrame(() => {
                child.style.opacity = '1';
              });
            });
          }
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

    reveals.forEach(el => revealObserver.observe(el));
  }

  // ========================================
  // Smooth scroll for anchor links
  // ========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ========================================
  // Header shadow on scroll
  // ========================================
  const header = document.querySelector('.site-header');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      header.style.boxShadow = '0 4px 24px oklch(0 0 0 / 0.15)';
    } else {
      header.style.boxShadow = 'none';
    }
  }, { passive: true });

})();

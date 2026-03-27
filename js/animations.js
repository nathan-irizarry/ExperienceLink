/**
 * ExperienceLink Animation System
 * Scroll-triggered animations and interactive effects
 */

// ============================================
// SCROLL ANIMATION OBSERVER
// ============================================

class ScrollAnimator {
  constructor() {
    this.animatedElements = document.querySelectorAll('[data-animate]');
    this.observer = null;
    this.init();
  }

  init() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.showAllElements();
      return;
    }

    // Create intersection observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Unobserve after animation triggers (one-time animation)
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1,
      }
    );

    // Observe all animated elements
    this.animatedElements.forEach((el) => {
      this.observer.observe(el);
    });
  }

  showAllElements() {
    this.animatedElements.forEach((el) => {
      el.classList.add('is-visible');
    });
  }

  // Refresh observer for dynamically added elements
  refresh() {
    this.animatedElements = document.querySelectorAll('[data-animate]:not(.is-visible)');
    this.animatedElements.forEach((el) => {
      this.observer.observe(el);
    });
  }
}

// ============================================
// MOBILE MENU
// ============================================

class MobileMenu {
  constructor() {
    this.menuButton = document.querySelector('[data-mobile-menu-btn]');
    this.menu = document.querySelector('[data-mobile-menu]');
    this.isOpen = false;
    this.init();
  }

  init() {
    if (!this.menuButton || !this.menu) return;

    this.menuButton.addEventListener('click', () => this.toggle());

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.menu.contains(e.target) && !this.menuButton.contains(e.target)) {
        this.close();
      }
    });

    // Close menu on window resize (tablet/desktop)
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && this.isOpen) {
        this.close();
      }
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.menu.classList.add('is-open');
    this.menuButton.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen = false;
    this.menu.classList.remove('is-open');
    this.menuButton.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
}

// ============================================
// COUNTER ANIMATION
// ============================================

class CounterAnimator {
  constructor() {
    this.counters = document.querySelectorAll('[data-counter]');
    this.observer = null;
    this.init();
  }

  init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.showAllCounters();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    this.counters.forEach((counter) => {
      this.observer.observe(counter);
    });
  }

  animateCounter(element) {
    const target = parseInt(element.dataset.counter, 10);
    const duration = parseInt(element.dataset.duration, 10) || 2000;
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';

    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      element.textContent = `${prefix}${current.toLocaleString()}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
      }
    };

    requestAnimationFrame(step);
  }

  showAllCounters() {
    this.counters.forEach((counter) => {
      const target = counter.dataset.counter;
      const suffix = counter.dataset.suffix || '';
      const prefix = counter.dataset.prefix || '';
      counter.textContent = `${prefix}${parseInt(target, 10).toLocaleString()}${suffix}`;
    });
  }
}

// ============================================
// SMOOTH SCROLL
// ============================================

class SmoothScroll {
  constructor() {
    this.links = document.querySelectorAll('a[href^="#"]');
    this.init();
  }

  init() {
    this.links.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      });
    });
  }
}

// ============================================
// TABS
// ============================================

class TabController {
  constructor() {
    this.tabGroups = document.querySelectorAll('[data-tabs]');
    this.init();
  }

  init() {
    this.tabGroups.forEach((group) => {
      const tabs = group.querySelectorAll('[data-tab]');
      const panels = document.querySelectorAll('[data-tab-panel]');

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const targetId = tab.dataset.tab;

          // Update active tab
          tabs.forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');

          // Show corresponding panel
          panels.forEach((panel) => {
            if (panel.dataset.tabPanel === targetId) {
              panel.classList.remove('hidden');
            } else {
              panel.classList.add('hidden');
            }
          });
        });
      });
    });
  }
}

// ============================================
// FORM CHARACTER COUNT
// ============================================

class CharacterCount {
  constructor() {
    this.textareas = document.querySelectorAll('[data-char-count]');
    this.init();
  }

  init() {
    this.textareas.forEach((textarea) => {
      const counterId = textarea.dataset.charCount;
      const counter = document.getElementById(counterId);

      if (counter) {
        // Initial count
        counter.textContent = textarea.value.length;

        // Update on input
        textarea.addEventListener('input', () => {
          counter.textContent = textarea.value.length;
        });
      }
    });
  }
}

// ============================================
// INITIALIZE ALL MODULES
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all animation/interaction modules
  // Merge with existing ExperienceLink (e.g., Supabase client) instead of overwriting
  window.ExperienceLink = {
    ...window.ExperienceLink, // Preserve existing properties (Auth, Profiles, etc.)
    scrollAnimator: new ScrollAnimator(),
    mobileMenu: new MobileMenu(),
    counterAnimator: new CounterAnimator(),
    smoothScroll: new SmoothScroll(),
    tabController: new TabController(),
    charCount: new CharacterCount(),
  };

  // Add loaded class for page transition
  document.body.classList.add('is-loaded');
});

// ============================================
// EXPORT FOR MODULE USAGE (if needed)
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ScrollAnimator,
    MobileMenu,
    CounterAnimator,
    SmoothScroll,
    TabController,
    CharacterCount,
  };
}

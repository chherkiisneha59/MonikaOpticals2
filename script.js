/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Glassmorphic Clone
   Enhanced scroll animations, parallax, counters, nav, marquees
   ═══════════════════════════════════════════════════════════════ */

/* ── Inline API Config fallback ── */
if (typeof API_CONFIG === 'undefined') {
  var API_CONFIG = {
    BASE_URL: 'https://monikaopticals2-1.onrender.com',
    api: (path) => `https://monikaopticals2-1.onrender.com${path}`,
    imageUrl: (src) => {
      if (!src) return '';
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
      return `https://monikaopticals2-1.onrender.com${src}`;
    }
  };
}

document.addEventListener('DOMContentLoaded', async () => {

  /* ── Navbar scroll effect ── */
  const navbar = document.getElementById('navbar');

  const handleNavScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* ── Active nav link highlighting ── */
  const navLinks = document.querySelectorAll('.navbar__links a');
  const sections = document.querySelectorAll('section[id]');

  const highlightNav = () => {
    const scrollY = window.scrollY + 200;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });

  /* ── Mobile Nav Toggle ── */
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileClose = document.getElementById('mobile-nav-close');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    const closeMobileNav = () => {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    };

    mobileClose.addEventListener('click', closeMobileNav);

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });
  }

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ══════════════════════════════════════════════════════
     ENHANCED SCROLL REVEAL SYSTEM
     Supports: fade-up, fade-down, slide-left, slide-right,
               scale-up, blur-in, rotate-in
     ══════════════════════════════════════════════════════ */
  const revealElements = document.querySelectorAll(
    '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur, .reveal-rotate'
  );

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ══════════════════════════════════════════════════════
     STAGGERED CHILDREN ANIMATION
     Add .stagger-parent to a container and .stagger-child
     to each child for cascading reveal
     ══════════════════════════════════════════════════════ */
  const staggerParents = document.querySelectorAll('.stagger-parent');

  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const children = entry.target.querySelectorAll('.stagger-child');
        children.forEach((child, i) => {
          child.style.transitionDelay = `${i * 0.12}s`;
          child.classList.add('visible');
        });
        staggerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  staggerParents.forEach(el => staggerObserver.observe(el));

  /* ══════════════════════════════════════════════════════
     PARALLAX SCROLL — images float at different rates
     ══════════════════════════════════════════════════════ */
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  let ticking = false;
  const updateParallax = () => {
    const scrollY = window.scrollY;
    const viewH = window.innerHeight;

    parallaxElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const speed = parseFloat(el.dataset.parallax) || 0.1;

      if (rect.top < viewH && rect.bottom > 0) {
        const travel = (rect.top - viewH / 2) * speed;
        el.style.transform = `translateY(${travel}px)`;
      }
    });

    // Decorative circles parallax
    const circles = document.querySelectorAll('.hero__circle');
    circles.forEach((circle, i) => {
      const speed = (i + 1) * 0.1;
      circle.style.transform = `translateY(${scrollY * speed}px)`;
    });

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  /* ══════════════════════════════════════════════════════
     SMOOTH HERO GALLERY — infinite CSS-driven scroll
     Uses duplicated content + CSS animation for silky movement
     Dynamically loads banners from persistent API backend
     ══════════════════════════════════════════════════════ */
  const heroGallery = document.querySelector('.hero__gallery');

  if (heroGallery) {
    // Load banner images from persistent backend API
    try {
      const res = await fetch(API_CONFIG.api('/api/banners'));
      if (res.ok) {
        const banners = await res.json();
        const visibleBanners = banners.filter(b => b.visible !== false);
        if (visibleBanners.length > 0) {
          heroGallery.innerHTML = visibleBanners.map(b =>
            `<div class="hero__gallery-card"><img src="${API_CONFIG.imageUrl(b.src)}" alt="${b.alt || 'Eyewear'}" /></div>`
          ).join('');
        }
      }
    } catch (e) { /* server offline — use original HTML content */ }

    // Duplicate gallery items for seamless loop
    const items = heroGallery.innerHTML;
    heroGallery.innerHTML = items + items;

    // Pause animation on hover
    heroGallery.addEventListener('mouseenter', () => {
      heroGallery.style.animationPlayState = 'paused';
    });
    heroGallery.addEventListener('mouseleave', () => {
      heroGallery.style.animationPlayState = 'running';
    });
  }

  /* ══════════════════════════════════════════════════════
     SCROLL PROGRESS BAR — thin accent bar at the top
     ══════════════════════════════════════════════════════ */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.prepend(progressBar);

  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  };

  window.addEventListener('scroll', updateProgress, { passive: true });

  /* ══════════════════════════════════════════════════════
     COUNT-UP ANIMATION
     ══════════════════════════════════════════════════════ */
  const countElements = document.querySelectorAll('.count-up');
  let countAnimated = false;

  const animateCount = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const startTime = performance.now();

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    };

    requestAnimationFrame(step);
  };

  const trustSection = document.getElementById('trust');
  if (trustSection) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countAnimated) {
          countAnimated = true;
          countElements.forEach(el => animateCount(el));
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    countObserver.observe(trustSection);
  }

  /* ══════════════════════════════════════════════════════
     IMAGE TILT EFFECT — subtle 3D tilt on hover
     Add .tilt-hover class to any image container
     ══════════════════════════════════════════════════════ */
  document.querySelectorAll('.tilt-hover').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) translateY(0)';
    });
  });

});

/* ── Global helper ── */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

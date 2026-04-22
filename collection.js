/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Collection Page Logic
   Product data loaded from persistent backend API (admin managed)
   Only shows products the admin has added/uploaded
   ═══════════════════════════════════════════════════════════════ */


const CATEGORY_META = {
  all:        { title: 'All Eyewear', desc: 'Browse our full range of premium eyewear, precision-fitted using our special automatic machines.' },
  sunglasses: { title: 'Sunglasses', desc: 'Premium UV-protected sunglasses for every style. From aviators to cat-eyes, curated from top global brands.' },
  reading:    { title: 'Reading Glasses', desc: 'Crystal-clear reading glasses for comfortable vision. Multiple lens options including progressive and bifocal.' },
  computer:   { title: 'Computer Glasses', desc: 'Blue-light blocking glasses for digital wellness. Protect your eyes during long screen sessions.' },
  sports:     { title: 'Sports Eyewear', desc: 'Impact-resistant eyewear for active lifestyles. Polarized, lightweight, and built for performance.' },
  kids:       { title: 'Kids Eyewear', desc: 'Durable and fun frames for young eyes. Flexible, colorful, and built to withstand active play.' },
  contacts:   { title: 'Contact Lenses', desc: 'Comfortable daily and monthly contact lenses from Bausch & Lomb. Available in daily, monthly, and toric.' },
};

/* Helper: get color name */
function getColorName(hex) {
  const names = {
    '#1A1A1A': 'Black', '#C0C0C0': 'Silver', '#FFD700': 'Gold',
    '#B87333': 'Copper', '#8B4513': 'Brown', '#4169E1': 'Blue',
    '#DC143C': 'Red', '#228B22': 'Green', '#FF69B4': 'Pink',
    '#800080': 'Purple', '#FF8C00': 'Orange', '#FFFFFF': 'White',
    '#F5F5DC': 'Cream', '#808080': 'Grey', '#E8CDA0': 'Tortoiseshell'
  };
  return names[hex?.toUpperCase?.()] || hex || '';
}

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('products-grid');
  const titleEl = document.getElementById('col-title');
  const descEl = document.getElementById('col-desc');
  const filterBtns = document.querySelectorAll('.col-filter-btn');

  // Load products ONLY from the backend API (admin-managed)
  let activeProducts = [];
  try {
    const res = await fetch(API_CONFIG.api('/api/products'));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) activeProducts = data;
    }
  } catch (e) { /* server offline — show empty */ }

  // Filter out hidden products (admin visibility control)
  activeProducts = activeProducts.filter(p => p.visible !== false);

  // Read category from URL
  const params = new URLSearchParams(window.location.search);
  let currentCat = params.get('cat') || 'all';

  // Highlight active nav link
  document.querySelectorAll('.navbar__links a[data-cat]').forEach(link => {
    if (link.dataset.cat === currentCat) link.classList.add('active');
  });

  function setActiveFilter(cat) {
    currentCat = cat;
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === cat);
    });

    const meta = CATEGORY_META[cat] || CATEGORY_META.all;
    titleEl.textContent = meta.title;
    descEl.textContent = meta.desc;

    // Update page title
    document.title = (cat === 'all' ? 'Collection' : meta.title) + ' — Monika Opticals | Vidisha';

    // Update URL without reload
    const newUrl = cat === 'all' ? 'collection.html' : `collection.html?cat=${cat}`;
    history.replaceState(null, '', newUrl);

    renderProducts(cat);
  }

  function renderProducts(cat) {
    const filtered = cat === 'all' ? activeProducts : activeProducts.filter(p => p.category === cat);

    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--color-text-muted);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin:0 auto 16px;display:block;opacity:0.3;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p style="font-size:1.1rem;font-weight:600;margin-bottom:6px;">No products available</p>
          <p style="font-size:0.88rem;opacity:0.6;">Products will appear here once added by the admin.</p>
        </div>
      `;
      return;
    }

    // Helper: get images array (backward compat)
    function getImages(p) {
      if (Array.isArray(p.images) && p.images.length > 0) return p.images;
      if (p.image) return [p.image];
      return [];
    }

    filtered.forEach((product, i) => {
      const card = document.createElement('div');
      card.className = 'product-card reveal';
      card.style.transitionDelay = `${Math.min(i * 0.08, 0.5)}s`;

      const imgs = getImages(product).map(src => API_CONFIG.imageUrl(src));
      const primaryImg = imgs[0] || '';

      const badgeHTML = product.badge
        ? `<span class="product-card__badge">${product.badge}</span>`
        : '';

      const featuresHTML = product.features
        .map(f => `<span class="product-card__tag">${f}</span>`)
        .join('');

      // Dot indicators for multi-image
      let dotsHTML = '';
      if (imgs.length > 1) {
        dotsHTML = '<div class="product-card__dots">';
        imgs.forEach((_, di) => {
          dotsHTML += `<span class="product-card__dot${di === 0 ? ' active' : ''}" data-dot="${di}"></span>`;
        });
        dotsHTML += '</div>';
      }

      // Color dots
      const colors = Array.isArray(product.colors) ? product.colors : [];
      let colorsHTML = '';
      if (colors.length > 0) {
        colorsHTML = '<div class="product-card__colors">';
        colors.forEach(c => {
          const style = c === '#E8CDA0'
            ? 'background:linear-gradient(135deg,#E8CDA0,#8B4513,#E8CDA0);'
            : `background:${c};`;
          const borderStyle = (c === '#FFFFFF' || c === '#F5F5DC')
            ? 'border:1px solid rgba(0,0,0,0.15);'
            : '';
          colorsHTML += `<span class="product-card__color-dot" style="${style}${borderStyle}" title="${getColorName(c)}"></span>`;
        });
        colorsHTML += '</div>';
      }

      const whatsappMsg = encodeURIComponent(`Hi, I'm interested in the ${product.name} (${product.brand}) - ${product.price}. Can I get more details?`);

      card.innerHTML = `
        <div class="product-card__image-wrap">
          ${badgeHTML}
          <img src="${primaryImg}" alt="${product.name}" class="product-card__image" loading="lazy" />
          ${dotsHTML}
        </div>
        <div class="product-card__body">
          <span class="product-card__brand">${product.brand}</span>
          <h3 class="product-card__name">${product.name}</h3>
          ${colorsHTML}
          <div class="product-card__tags">${featuresHTML}</div>
          <div class="product-card__footer">
            <div style="display:flex; gap:8px;">
              ${(product.category !== 'contacts') ? `
                <button class="btn--try-on" data-vto="${product.name}" data-img="${primaryImg}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  Try On
                </button>
              ` : ''}
              <a href="https://wa.me/918109204075?text=${whatsappMsg}" target="_blank" rel="noopener" class="product-card__enquire">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Enquire
              </a>
            </div>
          </div>
        </div>
      `;

      // Dot click handlers for image switching
      if (imgs.length > 1) {
        const dotsWrap = card.querySelector('.product-card__dots');
        const imgEl = card.querySelector('.product-card__image');
        dotsWrap.addEventListener('click', (e) => {
          const dot = e.target.closest('.product-card__dot');
          if (!dot) return;
          const idx = parseInt(dot.dataset.dot);
          imgEl.src = imgs[idx];
          dotsWrap.querySelectorAll('.product-card__dot').forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
        });
      }

      grid.appendChild(card);
    });

    // Trigger reveal animation
    requestAnimationFrame(() => {
      grid.querySelectorAll('.product-card').forEach(card => {
        card.classList.add('visible');
      });
    });
  }

  // Filter button clicks
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveFilter(btn.dataset.filter);
    });
  });

  // Initialize
  setActiveFilter(currentCat);
});

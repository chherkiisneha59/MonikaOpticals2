/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Collection Page Logic
   Product data, filtering, dynamic rendering, WhatsApp enquiry
   Reads from localStorage backend (admin edits)
   ═══════════════════════════════════════════════════════════════ */

const PRODUCTS = [
  // ── Sunglasses ──
  { id: 'sun-1', name: 'Aviator Classic', brand: 'Ray-Ban', price: '₹4,990', category: 'sunglasses', image: 'images/products/sun-1.png', features: ['UV400 Protection', 'Polarized Lenses', 'Gold Metal Frame'], badge: 'Best Seller', colors: ['#FFD700', '#C0C0C0', '#1A1A1A'] },
  { id: 'sun-2', name: 'Cat-Eye Noir', brand: 'Vincent Chase', price: '₹2,490', category: 'sunglasses', image: 'images/products/sun-2.png', features: ['UV Protection', 'Acetate Frame', 'Scratch Resistant'], colors: ['#1A1A1A', '#800080'] },
  { id: 'sun-3', name: 'Retro Round', brand: 'John Jacobs', price: '₹3,290', category: 'sunglasses', image: 'images/products/sun-3.png', features: ['Gradient Lenses', 'Tortoiseshell Frame', 'Lightweight'], colors: ['#E8CDA0', '#1A1A1A'] },
  { id: 'sun-4', name: 'Sport Wrap', brand: 'Oakley', price: '₹6,990', category: 'sunglasses', image: 'images/products/sun-4.png', features: ['Polarized', 'Impact Resistant', 'Wraparound Fit'], badge: 'Premium', colors: ['#1A1A1A', '#4169E1'] },
  { id: 'sun-5', name: 'Oversized Square', brand: 'Vogue', price: '₹3,790', category: 'sunglasses', image: 'images/products/sun-5.png', features: ['Brown Gradient', 'Full Rim', 'Fashion Forward'], colors: ['#8B4513', '#1A1A1A'] },

  // ── Reading Glasses ──
  { id: 'read-1', name: 'Executive Gold', brand: 'Titan Eyeplus', price: '₹2,190', category: 'reading', image: 'images/products/read-1.png', features: ['Anti-Glare Coating', 'Lightweight Gold Frame', 'Spring Hinges'], badge: 'Popular', colors: ['#FFD700', '#C0C0C0'] },
  { id: 'read-2', name: 'Scholar Half-Rim', brand: 'Lenskart', price: '₹1,490', category: 'reading', image: 'images/products/read-2.png', features: ['Silver Frame', 'Anti-Reflective', 'Comfortable Fit'], colors: ['#C0C0C0', '#1A1A1A'] },
  { id: 'read-3', name: 'Vintage Round', brand: 'John Jacobs', price: '₹1,990', category: 'reading', image: 'images/products/read-3.png', features: ['Tortoiseshell Acetate', 'Classic Design', 'Durable Build'], colors: ['#E8CDA0'] },
  { id: 'read-4', name: 'Progressive Pro', brand: 'Bausch & Lomb', price: '₹3,490', category: 'reading', image: 'images/products/read-4.png', features: ['Progressive Lenses', 'Black Acetate', 'Multi-Focal'], badge: 'Advanced', colors: ['#1A1A1A'] },

  // ── Computer Glasses ──
  { id: 'comp-1', name: 'Digital Shield', brand: 'Lenskart', price: '₹1,790', category: 'computer', image: 'images/products/comp-1.png', features: ['Blue-Light Filter', 'Anti-Glare', 'Transparent Frame'], badge: 'Top Rated', colors: ['#FFFFFF', '#1A1A1A'] },
  { id: 'comp-2', name: 'Code Master', brand: 'Vincent Chase', price: '₹1,990', category: 'computer', image: 'images/products/comp-2.png', features: ['Blue-Light Block', 'Matte Black Frame', 'Slight Yellow Tint'], colors: ['#1A1A1A'] },
  { id: 'comp-3', name: 'Rose Circle', brand: 'John Jacobs', price: '₹2,490', category: 'computer', image: 'images/products/comp-3.png', features: ['Anti-Blue Light', 'Rose Gold Metal', 'Ultra Lightweight'], colors: ['#FF69B4', '#FFD700'] },
  { id: 'comp-4', name: 'Office Elite', brand: 'Fastrack', price: '₹1,590', category: 'computer', image: 'images/products/comp-4.png', features: ['Anti-Reflective', 'Navy Acetate', 'Ergonomic Fit'], colors: ['#4169E1', '#1A1A1A'] },

  // ── Sports Eyewear ──
  { id: 'sport-1', name: 'Aero Pro', brand: 'Oakley', price: '₹7,490', category: 'sports', image: 'images/products/sport-1.png', features: ['Polarized', 'Impact Resistant', 'Wraparound Design'], badge: 'Pro Choice', colors: ['#1A1A1A', '#DC143C'] },
  { id: 'sport-2', name: 'Velocity', brand: 'Oakley', price: '₹5,990', category: 'sports', image: 'images/products/sport-2.png', features: ['Mirrored Blue Lenses', 'White Frame', 'Cycling Optimized'], colors: ['#FFFFFF', '#4169E1'] },
  { id: 'sport-3', name: 'Trail Runner', brand: 'Fastrack', price: '₹3,290', category: 'sports', image: 'images/products/sport-3.png', features: ['Polarized Grey', 'Orange Frame', 'Ultra-Light'], colors: ['#FF8C00', '#1A1A1A'] },

  // ── Kids Eyewear ──
  { id: 'kids-1', name: 'Fun Purple', brand: 'Lenskart', price: '₹990', category: 'kids', image: 'images/products/kids-1.png', features: ['Flexible Frame', 'Scratch Proof', 'Fun Purple Color'], badge: 'Kid Fav', colors: ['#800080', '#FF69B4'] },
  { id: 'kids-2', name: 'Tiny Scholar', brand: 'Titan Eyeplus', price: '₹1,190', category: 'kids', image: 'images/products/kids-2.png', features: ['Lightweight', 'Anti-Glare', 'Gold Frame'], colors: ['#FFD700'] },
  { id: 'kids-3', name: 'Mini Round', brand: 'Vincent Chase', price: '₹890', category: 'kids', image: 'images/products/kids-3.png', features: ['Durable Build', 'Round Shape', 'Tortoiseshell'], colors: ['#E8CDA0'] },

  // ── Contact Lenses ──
  { id: 'contact-1', name: 'Daily Fresh', brand: 'Bausch & Lomb', price: '₹799/box', category: 'contacts', image: 'images/products/contact-1.png', features: ['Daily Disposable', 'High Moisture', '30 Pack'], badge: 'Best Value', colors: [] },
  { id: 'contact-2', name: 'Monthly Comfort', brand: 'Bausch & Lomb', price: '₹1,290/pair', category: 'contacts', image: 'images/products/contact-2.png', features: ['Monthly Wear', 'UV Blocking', 'Breathable'], colors: [] },
  { id: 'contact-3', name: 'Toric Precision', brand: 'Bausch & Lomb', price: '₹1,590/pair', category: 'contacts', image: 'images/products/contact-3.png', features: ['For Astigmatism', 'Stable Fit', 'Clear Vision'], badge: 'Specialist', colors: [] },
];

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

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('products-grid');
  const titleEl = document.getElementById('col-title');
  const descEl = document.getElementById('col-desc');
  const filterBtns = document.querySelectorAll('.col-filter-btn');

  // Load products: prefer localStorage (admin edits) over hardcoded defaults
  let activeProducts = PRODUCTS;
  const stored = localStorage.getItem('monika_opticals_products');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) activeProducts = parsed;
    } catch (e) { /* fall back to hardcoded */ }
  }

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

      const imgs = getImages(product);
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
            <span class="product-card__price">${product.price}</span>
            <a href="https://wa.me/918109204075?text=${whatsappMsg}" target="_blank" rel="noopener" class="product-card__enquire">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enquire
            </a>
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

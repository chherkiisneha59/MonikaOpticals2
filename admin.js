/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Admin Panel Backend
   Full CRUD, Banner Manager, Display Control, Frame Colors,
   Multi-image upload, localStorage persistence, Export/Import
   ═══════════════════════════════════════════════════════════════ */

const ADMIN_PASSWORD = 'monika1980';
const STORAGE_KEY = 'monika_opticals_products';
const BANNER_KEY = 'monika_opticals_banners';
const SETTINGS_KEY = 'monika_opticals_settings';

/* ── Default product catalog (hardcoded fallback) ── */
const DEFAULT_PRODUCTS = [
  // Sunglasses
  { id: 'sun-1', name: 'Aviator Classic', brand: 'Ray-Ban', price: '₹4,990', category: 'sunglasses', image: 'images/products/sun-1.png', images: ['images/products/sun-1.png'], features: ['UV400 Protection', 'Polarized Lenses', 'Gold Metal Frame'], badge: 'Best Seller', colors: ['#FFD700', '#C0C0C0', '#1A1A1A'], visible: true },
  { id: 'sun-2', name: 'Cat-Eye Noir', brand: 'Vincent Chase', price: '₹2,490', category: 'sunglasses', image: 'images/products/sun-2.png', images: ['images/products/sun-2.png'], features: ['UV Protection', 'Acetate Frame', 'Scratch Resistant'], colors: ['#1A1A1A', '#800080'], visible: true },
  { id: 'sun-3', name: 'Retro Round', brand: 'John Jacobs', price: '₹3,290', category: 'sunglasses', image: 'images/products/sun-3.png', images: ['images/products/sun-3.png'], features: ['Gradient Lenses', 'Tortoiseshell Frame', 'Lightweight'], colors: ['#E8CDA0', '#1A1A1A'], visible: true },
  { id: 'sun-4', name: 'Sport Wrap', brand: 'Oakley', price: '₹6,990', category: 'sunglasses', image: 'images/products/sun-4.png', images: ['images/products/sun-4.png'], features: ['Polarized', 'Impact Resistant', 'Wraparound Fit'], badge: 'Premium', colors: ['#1A1A1A', '#4169E1'], visible: true },
  { id: 'sun-5', name: 'Oversized Square', brand: 'Vogue', price: '₹3,790', category: 'sunglasses', image: 'images/products/sun-5.png', images: ['images/products/sun-5.png'], features: ['Brown Gradient', 'Full Rim', 'Fashion Forward'], colors: ['#8B4513', '#1A1A1A'], visible: true },

  // Reading
  { id: 'read-1', name: 'Executive Gold', brand: 'Titan Eyeplus', price: '₹2,190', category: 'reading', image: 'images/products/read-1.png', images: ['images/products/read-1.png'], features: ['Anti-Glare Coating', 'Lightweight Gold Frame', 'Spring Hinges'], badge: 'Popular', colors: ['#FFD700', '#C0C0C0'], visible: true },
  { id: 'read-2', name: 'Scholar Half-Rim', brand: 'Lenskart', price: '₹1,490', category: 'reading', image: 'images/products/read-2.png', images: ['images/products/read-2.png'], features: ['Silver Frame', 'Anti-Reflective', 'Comfortable Fit'], colors: ['#C0C0C0', '#1A1A1A'], visible: true },
  { id: 'read-3', name: 'Vintage Round', brand: 'John Jacobs', price: '₹1,990', category: 'reading', image: 'images/products/read-3.png', images: ['images/products/read-3.png'], features: ['Tortoiseshell Acetate', 'Classic Design', 'Durable Build'], colors: ['#E8CDA0'], visible: true },
  { id: 'read-4', name: 'Progressive Pro', brand: 'Bausch & Lomb', price: '₹3,490', category: 'reading', image: 'images/products/read-4.png', images: ['images/products/read-4.png'], features: ['Progressive Lenses', 'Black Acetate', 'Multi-Focal'], badge: 'Advanced', colors: ['#1A1A1A'], visible: true },

  // Computer
  { id: 'comp-1', name: 'Digital Shield', brand: 'Lenskart', price: '₹1,790', category: 'computer', image: 'images/products/comp-1.png', images: ['images/products/comp-1.png'], features: ['Blue-Light Filter', 'Anti-Glare', 'Transparent Frame'], badge: 'Top Rated', colors: ['#FFFFFF', '#1A1A1A'], visible: true },
  { id: 'comp-2', name: 'Code Master', brand: 'Vincent Chase', price: '₹1,990', category: 'computer', image: 'images/products/comp-2.png', images: ['images/products/comp-2.png'], features: ['Blue-Light Block', 'Matte Black Frame', 'Slight Yellow Tint'], colors: ['#1A1A1A'], visible: true },
  { id: 'comp-3', name: 'Rose Circle', brand: 'John Jacobs', price: '₹2,490', category: 'computer', image: 'images/products/comp-3.png', images: ['images/products/comp-3.png'], features: ['Anti-Blue Light', 'Rose Gold Metal', 'Ultra Lightweight'], colors: ['#FF69B4', '#FFD700'], visible: true },
  { id: 'comp-4', name: 'Office Elite', brand: 'Fastrack', price: '₹1,590', category: 'computer', image: 'images/products/comp-4.png', images: ['images/products/comp-4.png'], features: ['Anti-Reflective', 'Navy Acetate', 'Ergonomic Fit'], colors: ['#4169E1', '#1A1A1A'], visible: true },

  // Sports
  { id: 'sport-1', name: 'Aero Pro', brand: 'Oakley', price: '₹7,490', category: 'sports', image: 'images/products/sport-1.png', images: ['images/products/sport-1.png'], features: ['Polarized', 'Impact Resistant', 'Wraparound Design'], badge: 'Pro Choice', colors: ['#1A1A1A', '#DC143C'], visible: true },
  { id: 'sport-2', name: 'Velocity', brand: 'Oakley', price: '₹5,990', category: 'sports', image: 'images/products/sport-2.png', images: ['images/products/sport-2.png'], features: ['Mirrored Blue Lenses', 'White Frame', 'Cycling Optimized'], colors: ['#FFFFFF', '#4169E1'], visible: true },
  { id: 'sport-3', name: 'Trail Runner', brand: 'Fastrack', price: '₹3,290', category: 'sports', image: 'images/products/sport-3.png', images: ['images/products/sport-3.png'], features: ['Polarized Grey', 'Orange Frame', 'Ultra-Light'], colors: ['#FF8C00', '#1A1A1A'], visible: true },

  // Kids
  { id: 'kids-1', name: 'Fun Purple', brand: 'Lenskart', price: '₹990', category: 'kids', image: 'images/products/kids-1.png', images: ['images/products/kids-1.png'], features: ['Flexible Frame', 'Scratch Proof', 'Fun Purple Color'], badge: 'Kid Fav', colors: ['#800080', '#FF69B4'], visible: true },
  { id: 'kids-2', name: 'Tiny Scholar', brand: 'Titan Eyeplus', price: '₹1,190', category: 'kids', image: 'images/products/kids-2.png', images: ['images/products/kids-2.png'], features: ['Lightweight', 'Anti-Glare', 'Gold Frame'], colors: ['#FFD700'], visible: true },
  { id: 'kids-3', name: 'Mini Round', brand: 'Vincent Chase', price: '₹890', category: 'kids', image: 'images/products/kids-3.png', images: ['images/products/kids-3.png'], features: ['Durable Build', 'Round Shape', 'Tortoiseshell'], colors: ['#E8CDA0'], visible: true },

  // Contacts
  { id: 'contact-1', name: 'Daily Fresh', brand: 'Bausch & Lomb', price: '₹799/box', category: 'contacts', image: 'images/products/contact-1.png', images: ['images/products/contact-1.png'], features: ['Daily Disposable', 'High Moisture', '30 Pack'], badge: 'Best Value', colors: [], visible: true },
  { id: 'contact-2', name: 'Monthly Comfort', brand: 'Bausch & Lomb', price: '₹1,290/pair', category: 'contacts', image: 'images/products/contact-2.png', images: ['images/products/contact-2.png'], features: ['Monthly Wear', 'UV Blocking', 'Breathable'], colors: [], visible: true },
  { id: 'contact-3', name: 'Toric Precision', brand: 'Bausch & Lomb', price: '₹1,590/pair', category: 'contacts', image: 'images/products/contact-3.png', images: ['images/products/contact-3.png'], features: ['For Astigmatism', 'Stable Fit', 'Clear Vision'], badge: 'Specialist', colors: [], visible: true },
];

const DEFAULT_BANNERS = [
  { id: 'b1', src: 'images/hero-1.png', alt: 'Round Metal Eyeglasses', visible: true },
  { id: 'b2', src: 'images/hero-2.png', alt: 'Sunglasses Collection', visible: true },
  { id: 'b3', src: 'images/hero-3.png', alt: 'Premium Sunglasses', visible: true },
  { id: 'b4', src: 'images/hero-4.png', alt: 'Wire Frame Glasses', visible: true },
  { id: 'b5', src: 'images/hero-5.png', alt: 'Tortoiseshell Glasses', visible: true },
];

const CATEGORY_LABELS = {
  sunglasses: 'Sunglasses',
  reading: 'Reading',
  computer: 'Computer',
  sports: 'Sports',
  kids: 'Kids',
  contacts: 'Contacts'
};

/* ══════════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════════ */
let products = [];
let banners = [];
let deleteTargetId = null;
let currentImages = []; // array of base64 or path strings for the modal form
let currentColors = []; // array of hex color strings for the modal form

/* Helper: get images array from product (backward compat) */
function getProductImages(product) {
  if (Array.isArray(product.images) && product.images.length > 0) return product.images;
  if (product.image) return [product.image];
  return [];
}

/* Helper: get colors from product */
function getProductColors(product) {
  return Array.isArray(product.colors) ? product.colors : [];
}

/* Helper: get color name from hex */
function getColorName(hex) {
  const colorNames = {
    '#1A1A1A': 'Black', '#C0C0C0': 'Silver', '#FFD700': 'Gold',
    '#B87333': 'Copper', '#8B4513': 'Brown', '#4169E1': 'Blue',
    '#DC143C': 'Red', '#228B22': 'Green', '#FF69B4': 'Pink',
    '#800080': 'Purple', '#FF8C00': 'Orange', '#FFFFFF': 'White',
    '#F5F5DC': 'Cream', '#808080': 'Grey', '#E8CDA0': 'Tortoiseshell'
  };
  return colorNames[hex.toUpperCase()] || hex;
}

/* ══════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Check session
  if (sessionStorage.getItem('monika_admin_auth') === 'true') {
    showDashboard();
  }

  // Login
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('admin-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('monika_admin_auth');
    location.reload();
  });

  // Tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Add product
  document.getElementById('add-product-btn').addEventListener('click', () => openProductModal());

  // Modal close/cancel
  document.getElementById('modal-close').addEventListener('click', closeProductModal);
  document.getElementById('modal-cancel').addEventListener('click', closeProductModal);
  document.getElementById('product-modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeProductModal();
  });

  // Form submit
  document.getElementById('product-form').addEventListener('submit', handleFormSubmit);

  // Delete modal
  document.getElementById('delete-modal-close').addEventListener('click', closeDeleteModal);
  document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);
  document.getElementById('delete-confirm').addEventListener('click', confirmDelete);
  document.getElementById('delete-modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDeleteModal();
  });

  // Reset modal
  document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('reset-modal-overlay').classList.add('active');
  });
  document.getElementById('reset-modal-close').addEventListener('click', closeResetModal);
  document.getElementById('reset-cancel').addEventListener('click', closeResetModal);
  document.getElementById('reset-confirm').addEventListener('click', confirmReset);
  document.getElementById('reset-modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeResetModal();
  });

  // Search & filter
  document.getElementById('admin-search').addEventListener('input', renderTable);
  document.getElementById('admin-cat-filter').addEventListener('change', renderTable);

  // Export
  document.getElementById('export-btn').addEventListener('click', exportData);

  // Import
  document.getElementById('import-file').addEventListener('change', importData);

  // Image upload
  setupImageUpload();

  // Color picker
  setupColorPicker();

  // Banner manager
  setupBannerManager();
});

/* ══════════════════════════════════════════════════════════
   TABS
   ══════════════════════════════════════════════════════════ */
function switchTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

  document.querySelector(`.admin-tab[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');

  if (tabName === 'banners') renderBanners();
  if (tabName === 'display') renderDisplayGrid();
}

/* ══════════════════════════════════════════════════════════
   AUTH
   ══════════════════════════════════════════════════════════ */
function handleLogin() {
  const pwd = document.getElementById('admin-password').value;
  const errorEl = document.getElementById('login-error');

  if (pwd === ADMIN_PASSWORD) {
    sessionStorage.setItem('monika_admin_auth', 'true');
    showDashboard();
  } else {
    errorEl.textContent = 'Incorrect password. Try again.';
    document.getElementById('admin-password').classList.add('shake');
    setTimeout(() => {
      document.getElementById('admin-password').classList.remove('shake');
    }, 500);
  }
}

function showDashboard() {
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'block';
  loadProducts();
  loadBanners();
  renderStats();
  renderTable();
}

/* ══════════════════════════════════════════════════════════
   STORAGE
   ══════════════════════════════════════════════════════════ */
function loadProducts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      products = JSON.parse(stored);
      // Backward compat: add missing fields
      products = products.map(p => ({
        ...p,
        colors: Array.isArray(p.colors) ? p.colors : [],
        visible: p.visible !== undefined ? p.visible : true,
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : [])
      }));
    } catch (e) {
      products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    }
  } else {
    products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function loadBanners() {
  const stored = localStorage.getItem(BANNER_KEY);
  if (stored) {
    try {
      banners = JSON.parse(stored);
    } catch (e) {
      banners = JSON.parse(JSON.stringify(DEFAULT_BANNERS));
    }
  } else {
    banners = JSON.parse(JSON.stringify(DEFAULT_BANNERS));
  }
}

function saveBanners() {
  localStorage.setItem(BANNER_KEY, JSON.stringify(banners));
}

/* ══════════════════════════════════════════════════════════
   STATS
   ══════════════════════════════════════════════════════════ */
function renderStats() {
  const statsEl = document.getElementById('admin-stats');
  const cats = Object.keys(CATEGORY_LABELS);
  const total = products.length;
  const visible = products.filter(p => p.visible !== false).length;

  let html = `
    <div class="admin-stat-card admin-stat-card--accent">
      <div class="admin-stat-card__number">${total}</div>
      <div class="admin-stat-card__label">Total Products</div>
    </div>
    <div class="admin-stat-card admin-stat-card--green">
      <div class="admin-stat-card__number">${visible}</div>
      <div class="admin-stat-card__label">Visible</div>
    </div>
  `;

  cats.forEach(cat => {
    const count = products.filter(p => p.category === cat).length;
    html += `
      <div class="admin-stat-card">
        <div class="admin-stat-card__number">${count}</div>
        <div class="admin-stat-card__label">${CATEGORY_LABELS[cat]}</div>
      </div>
    `;
  });

  statsEl.innerHTML = html;
}

/* ══════════════════════════════════════════════════════════
   TABLE
   ══════════════════════════════════════════════════════════ */
function renderTable() {
  const search = document.getElementById('admin-search').value.toLowerCase().trim();
  const catFilter = document.getElementById('admin-cat-filter').value;
  const tbody = document.getElementById('admin-tbody');
  const emptyEl = document.getElementById('admin-empty');

  let filtered = [...products];

  if (catFilter !== 'all') {
    filtered = filtered.filter(p => p.category === catFilter);
  }

  if (search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.brand.toLowerCase().includes(search) ||
      p.price.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display = 'none';

  tbody.innerHTML = filtered.map(product => {
    const badgeHtml = product.badge
      ? `<span class="admin-badge">${product.badge}</span>`
      : '<span class="admin-text-muted">—</span>';

    const imgs = getProductImages(product);
    const primaryImg = imgs[0] || '';
    const imgCountBadge = imgs.length > 1 ? `<span class="admin-img-count">${imgs.length}</span>` : '';

    const colors = getProductColors(product);
    const colorsHtml = colors.length > 0
      ? colors.map(c => `<span class="admin-color-dot" style="background:${c === '#E8CDA0' ? 'linear-gradient(135deg,#E8CDA0,#8B4513,#E8CDA0)' : c};${c === '#FFFFFF' || c === '#F5F5DC' ? 'border:1px solid rgba(255,255,255,0.3);' : ''}" title="${getColorName(c)}"></span>`).join('')
      : '<span class="admin-text-muted">—</span>';

    const visibleToggle = product.visible !== false
      ? `<button class="admin-toggle admin-toggle--on" onclick="toggleVisibility('${product.id}')" title="Visible on store"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>`
      : `<button class="admin-toggle admin-toggle--off" onclick="toggleVisibility('${product.id}')" title="Hidden from store"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg></button>`;

    return `
      <tr data-id="${product.id}" class="${product.visible === false ? 'admin-row-hidden' : ''}">
        <td>
          <div class="admin-table-img">
            ${imgCountBadge}
            <img src="${primaryImg}" alt="${product.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23EDE9E3%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2240%22>👓</text></svg>'" />
          </div>
        </td>
        <td><strong>${product.name}</strong></td>
        <td>${product.brand}</td>
        <td><span class="admin-cat-pill">${CATEGORY_LABELS[product.category] || product.category}</span></td>
        <td><strong>${product.price}</strong></td>
        <td><div class="admin-color-dots">${colorsHtml}</div></td>
        <td>${badgeHtml}</td>
        <td>${visibleToggle}</td>
        <td>
          <div class="admin-actions">
            <button class="admin-action-btn admin-action-btn--edit" onclick="editProduct('${product.id}')" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="admin-action-btn admin-action-btn--delete" onclick="deleteProduct('${product.id}')" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   PRODUCT VISIBILITY TOGGLE
   ══════════════════════════════════════════════════════════ */
function toggleVisibility(id) {
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return;
  products[idx].visible = !products[idx].visible;
  saveProducts();
  renderStats();
  renderTable();
  showToast(`"${products[idx].name}" is now ${products[idx].visible ? 'visible' : 'hidden'}.`, 'success');
}

/* ══════════════════════════════════════════════════════════
   PRODUCT MODAL
   ══════════════════════════════════════════════════════════ */
function openProductModal(product = null) {
  const overlay = document.getElementById('product-modal-overlay');
  const titleEl = document.getElementById('modal-title');
  const submitEl = document.getElementById('modal-submit');

  if (product) {
    titleEl.textContent = 'Edit Product';
    submitEl.textContent = 'Update Product';
    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-brand').value = product.brand;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-badge').value = product.badge || '';
    document.getElementById('prod-features').value = product.features.join(', ');

    // Load existing images
    currentImages = [...getProductImages(product)];
    renderThumbnails();

    // Load existing colors
    currentColors = [...getProductColors(product)];
    renderSelectedColors();
    updateColorSwatchStates();
  } else {
    titleEl.textContent = 'Add Product';
    submitEl.textContent = 'Save Product';
    document.getElementById('product-form').reset();
    document.getElementById('edit-product-id').value = '';
    currentImages = [];
    currentColors = [];
    renderThumbnails();
    renderSelectedColors();
    updateColorSwatchStates();
  }

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    document.getElementById('prod-name').focus();
  }, 200);
}

function closeProductModal() {
  document.getElementById('product-modal-overlay').classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('product-form').reset();
  currentImages = [];
  currentColors = [];
  renderThumbnails();
  renderSelectedColors();
  updateColorSwatchStates();
}

function handleFormSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById('edit-product-id').value;
  const name = document.getElementById('prod-name').value.trim();
  const brand = document.getElementById('prod-brand').value.trim();
  const price = document.getElementById('prod-price').value.trim();
  const category = document.getElementById('prod-category').value;
  const badge = document.getElementById('prod-badge').value.trim();
  const features = document.getElementById('prod-features').value.split(',').map(f => f.trim()).filter(f => f);

  if (!name || !brand || !price || !category || features.length === 0) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  if (currentImages.length === 0) {
    showToast('Please upload at least one product image.', 'error');
    return;
  }

  if (editId) {
    // Update existing
    const idx = products.findIndex(p => p.id === editId);
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        name,
        brand,
        price,
        category,
        badge: badge || undefined,
        features,
        image: currentImages[0],
        images: [...currentImages],
        colors: [...currentColors]
      };
      if (!products[idx].badge) delete products[idx].badge;
    }
    showToast(`"${name}" updated successfully!`, 'success');
  } else {
    // Create new
    const newId = category.slice(0, 4) + '-' + Date.now().toString(36);
    products.push({
      id: newId,
      name,
      brand,
      price,
      category,
      image: currentImages[0],
      images: [...currentImages],
      features,
      colors: [...currentColors],
      visible: true,
      ...(badge ? { badge } : {})
    });
    showToast(`"${name}" added successfully!`, 'success');
  }

  saveProducts();
  renderStats();
  renderTable();
  closeProductModal();
}

/* ══════════════════════════════════════════════════════════
   EDIT & DELETE
   ══════════════════════════════════════════════════════════ */
function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (product) openProductModal(product);
}

function deleteProduct(id) {
  deleteTargetId = id;
  const product = products.find(p => p.id === id);
  document.getElementById('delete-product-name').textContent = product ? product.name : 'this product';
  document.getElementById('delete-modal-overlay').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('delete-modal-overlay').classList.remove('active');
  deleteTargetId = null;
}

function confirmDelete() {
  if (deleteTargetId) {
    const product = products.find(p => p.id === deleteTargetId);
    products = products.filter(p => p.id !== deleteTargetId);
    saveProducts();
    renderStats();
    renderTable();
    showToast(`"${product?.name || 'Product'}" deleted.`, 'success');
  }
  closeDeleteModal();
}

/* ══════════════════════════════════════════════════════════
   RESET
   ══════════════════════════════════════════════════════════ */
function closeResetModal() {
  document.getElementById('reset-modal-overlay').classList.remove('active');
}

function confirmReset() {
  products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  banners = JSON.parse(JSON.stringify(DEFAULT_BANNERS));
  saveProducts();
  saveBanners();
  renderStats();
  renderTable();
  showToast('Catalog restored to defaults.', 'success');
  closeResetModal();
}

/* ══════════════════════════════════════════════════════════
   EXPORT / IMPORT
   ══════════════════════════════════════════════════════════ */
function exportData() {
  const data = { products, banners };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `monika-opticals-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Full backup exported successfully!', 'success');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = JSON.parse(evt.target.result);

      // Support both old format (array) and new format (object with products+banners)
      if (Array.isArray(data)) {
        // Old format — just products
        const valid = data.every(p =>
          p.id && p.name && p.brand && p.price && p.category && (p.image || (Array.isArray(p.images) && p.images.length > 0)) && Array.isArray(p.features)
        );
        if (!valid) throw new Error('Invalid product structure');
        products = data.map(p => ({
          ...p,
          colors: Array.isArray(p.colors) ? p.colors : [],
          visible: p.visible !== undefined ? p.visible : true,
          images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : [])
        }));
        saveProducts();
      } else if (data.products) {
        // New format
        products = data.products.map(p => ({
          ...p,
          colors: Array.isArray(p.colors) ? p.colors : [],
          visible: p.visible !== undefined ? p.visible : true,
          images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : [])
        }));
        saveProducts();

        if (Array.isArray(data.banners)) {
          banners = data.banners;
          saveBanners();
        }
      } else {
        throw new Error('Invalid format');
      }

      renderStats();
      renderTable();
      showToast(`Imported successfully!`, 'success');
    } catch (err) {
      showToast('Invalid file format. Please use a valid JSON export.', 'error');
    }
  };
  reader.readAsText(file);

  // Reset file input so same file can be re-imported
  e.target.value = '';
}

/* ══════════════════════════════════════════════════════════
   COLOR PICKER
   ══════════════════════════════════════════════════════════ */
function setupColorPicker() {
  const presets = document.getElementById('color-presets');
  const customInput = document.getElementById('custom-color-input');

  presets.addEventListener('click', (e) => {
    const swatch = e.target.closest('.admin-color-swatch');
    if (!swatch) return;

    const color = swatch.dataset.color;
    if (color === 'custom') {
      customInput.click();
      return;
    }

    toggleColor(color);
  });

  customInput.addEventListener('input', (e) => {
    const color = e.target.value.toUpperCase();
    if (!currentColors.includes(color)) {
      currentColors.push(color);
      renderSelectedColors();
      updateColorSwatchStates();
    }
  });
}

function toggleColor(hex) {
  hex = hex.toUpperCase();
  const idx = currentColors.indexOf(hex);
  if (idx > -1) {
    currentColors.splice(idx, 1);
  } else {
    currentColors.push(hex);
  }
  renderSelectedColors();
  updateColorSwatchStates();
}

function removeColor(index) {
  currentColors.splice(index, 1);
  renderSelectedColors();
  updateColorSwatchStates();
}

function updateColorSwatchStates() {
  document.querySelectorAll('#color-presets .admin-color-swatch').forEach(swatch => {
    const c = swatch.dataset.color;
    if (c === 'custom') return;
    swatch.classList.toggle('selected', currentColors.includes(c.toUpperCase()));
  });
}

function renderSelectedColors() {
  const container = document.getElementById('selected-colors');
  if (currentColors.length === 0) {
    container.innerHTML = '<span class="admin-no-colors">No colors selected</span>';
    return;
  }
  container.innerHTML = currentColors.map((c, i) => `
    <div class="admin-selected-color" title="${getColorName(c)}">
      <span class="admin-selected-color__circle" style="background:${c === '#E8CDA0' ? 'linear-gradient(135deg,#E8CDA0,#8B4513,#E8CDA0)' : c};${c === '#FFFFFF' || c === '#F5F5DC' ? 'border:1px solid rgba(255,255,255,0.3);' : ''}"></span>
      <span class="admin-selected-color__name">${getColorName(c)}</span>
      <button type="button" class="admin-selected-color__remove" onclick="removeColor(${i})">&times;</button>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════
   IMAGE UPLOAD (Multi-Image)
   ══════════════════════════════════════════════════════════ */
function setupImageUpload() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('prod-image');

  // Click to browse
  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  // File selected (multiple)
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      processMultipleImages(fileInput.files);
      fileInput.value = '';
    }
  });

  // Drag events
  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processMultipleImages(files);
    }
  });
}

function processMultipleImages(files) {
  const remaining = 6 - currentImages.length;
  if (remaining <= 0) {
    showToast('Maximum 6 images reached.', 'error');
    return;
  }

  const toProcess = Array.from(files).slice(0, remaining);
  let processed = 0;

  toProcess.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast(`"${file.name}" is too large (max 2MB).`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      currentImages.push(e.target.result);
      processed++;
      if (processed >= toProcess.length) {
        renderThumbnails();
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderThumbnails() {
  const grid = document.getElementById('thumbs-grid');
  if (currentImages.length === 0) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = currentImages.map((img, i) => `
    <div class="admin-thumb" data-index="${i}">
      <img src="${img}" alt="Image ${i + 1}" />
      ${i === 0 ? '<span class="admin-thumb__primary">Primary</span>' : ''}
      <button type="button" class="admin-thumb__remove" onclick="removeImage(${i})">&times;</button>
    </div>
  `).join('');
}

function removeImage(index) {
  currentImages.splice(index, 1);
  renderThumbnails();
}

/* ══════════════════════════════════════════════════════════
   BANNER MANAGER
   ══════════════════════════════════════════════════════════ */
function setupBannerManager() {
  const addBtn = document.getElementById('add-banner-btn');
  const fileInput = document.getElementById('banner-file-input');

  addBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      Array.from(fileInput.files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        if (file.size > 3 * 1024 * 1024) {
          showToast(`"${file.name}" is too large (max 3MB).`, 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          banners.push({
            id: 'b-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
            src: e.target.result,
            alt: file.name.replace(/\.[^/.]+$/, ''),
            visible: true
          });
          saveBanners();
          renderBanners();
        };
        reader.readAsDataURL(file);
      });
      fileInput.value = '';
    }
  });
}

function renderBanners() {
  const grid = document.getElementById('banner-grid');
  const emptyEl = document.getElementById('banner-empty');

  if (banners.length === 0) {
    grid.innerHTML = '';
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display = 'none';

  grid.innerHTML = banners.map((banner, i) => `
    <div class="admin-banner-card ${banner.visible ? '' : 'admin-banner-card--hidden'}" data-id="${banner.id}">
      <div class="admin-banner-card__img">
        <img src="${banner.src}" alt="${banner.alt}" />
        <div class="admin-banner-card__overlay">
          <span class="admin-banner-card__order">${i + 1}</span>
        </div>
      </div>
      <div class="admin-banner-card__controls">
        <div class="admin-banner-card__info">
          <input class="admin-banner-alt-input" value="${banner.alt}" onchange="updateBannerAlt('${banner.id}', this.value)" placeholder="Alt text..." />
        </div>
        <div class="admin-banner-card__actions">

          ${i > 0 ? `<button class="admin-action-btn admin-action-btn--edit" onclick="moveBanner('${banner.id}', -1)" title="Move Left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>` : ''}

          ${i < banners.length - 1 ? `<button class="admin-action-btn admin-action-btn--edit" onclick="moveBanner('${banner.id}', 1)" title="Move Right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>` : ''}

          <button class="admin-toggle ${banner.visible ? 'admin-toggle--on' : 'admin-toggle--off'}" onclick="toggleBannerVisibility('${banner.id}')" title="${banner.visible ? 'Hide Banner' : 'Show Banner'}">
            ${banner.visible
              ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
            }
          </button>

          <button class="admin-action-btn admin-action-btn--delete" onclick="deleteBanner('${banner.id}')" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>

        </div>
      </div>
    </div>
  `).join('');
}

function toggleBannerVisibility(id) {
  const idx = banners.findIndex(b => b.id === id);
  if (idx === -1) return;
  banners[idx].visible = !banners[idx].visible;
  saveBanners();
  renderBanners();
  showToast(`Banner is now ${banners[idx].visible ? 'visible' : 'hidden'}.`, 'success');
}

function deleteBanner(id) {
  banners = banners.filter(b => b.id !== id);
  saveBanners();
  renderBanners();
  showToast('Banner deleted.', 'success');
}

function moveBanner(id, direction) {
  const idx = banners.findIndex(b => b.id === id);
  if (idx === -1) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= banners.length) return;

  // Swap
  [banners[idx], banners[newIdx]] = [banners[newIdx], banners[idx]];
  saveBanners();
  renderBanners();
}

function updateBannerAlt(id, value) {
  const idx = banners.findIndex(b => b.id === id);
  if (idx !== -1) {
    banners[idx].alt = value;
    saveBanners();
  }
}

/* ══════════════════════════════════════════════════════════
   DISPLAY CONTROL GRID
   ══════════════════════════════════════════════════════════ */
function renderDisplayGrid() {
  const grid = document.getElementById('display-grid');

  if (products.length === 0) {
    grid.innerHTML = '<p class="admin-text-muted" style="padding:40px;text-align:center;">No products to manage.</p>';
    return;
  }

  grid.innerHTML = products.map(product => {
    const imgs = getProductImages(product);
    const primaryImg = imgs[0] || '';
    const isVisible = product.visible !== false;

    return `
      <div class="admin-display-card ${isVisible ? '' : 'admin-display-card--hidden'}" data-id="${product.id}">
        <div class="admin-display-card__img">
          <img src="${primaryImg}" alt="${product.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23EDE9E3%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2240%22>👓</text></svg>'" />
        </div>
        <div class="admin-display-card__info">
          <strong>${product.name}</strong>
          <small>${product.brand} · ${CATEGORY_LABELS[product.category] || product.category}</small>
        </div>
        <label class="admin-switch">
          <input type="checkbox" ${isVisible ? 'checked' : ''} onchange="toggleVisibilityFromDisplay('${product.id}', this.checked)" />
          <span class="admin-switch__slider"></span>
        </label>
      </div>
    `;
  }).join('');
}

function toggleVisibilityFromDisplay(id, checked) {
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return;
  products[idx].visible = checked;
  saveProducts();
  renderStats();
  // Don't re-render the entire display grid to prevent losing focus — update card class inline
  const card = document.querySelector(`.admin-display-card[data-id="${id}"]`);
  if (card) {
    card.classList.toggle('admin-display-card--hidden', !checked);
  }
}

/* ══════════════════════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════════════════════ */
function showToast(message, type = 'success') {
  const toast = document.getElementById('admin-toast');
  toast.textContent = message;
  toast.className = 'admin-toast admin-toast--' + type + ' admin-toast--visible';

  setTimeout(() => {
    toast.classList.remove('admin-toast--visible');
  }, 3000);
}

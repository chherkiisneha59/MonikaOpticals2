/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Admin Panel Frontend
   Full CRUD, Banner Manager, Display Control, Frame Colors
   Uses Express REST API backend with Multer file uploads
   Version 4.0.0 — Direct Render backend calls
   ═══════════════════════════════════════════════════════════════ */

/* ── Inline API Config (fallback if api-config.js fails to load) ── */
const BACKEND_URL = 'https://monikaopticals2-1.onrender.com';
if (typeof API_CONFIG === 'undefined') {
  var API_CONFIG = {
    BASE_URL: BACKEND_URL,
    api: (path) => `${BACKEND_URL}${path}`,
    imageUrl: (src) => {
      if (!src) return '';
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
      return `${BACKEND_URL}${src}`;
    }
  };
} else {
  // Ensure API_CONFIG always points to the Render backend, not the Vercel domain
  if (API_CONFIG.BASE_URL && API_CONFIG.BASE_URL.includes('vercel.app')) {
    API_CONFIG.BASE_URL = BACKEND_URL;
    API_CONFIG.api = (path) => `${BACKEND_URL}${path}`;
    API_CONFIG.imageUrl = (src) => {
      if (!src) return '';
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
      return `${BACKEND_URL}${src}`;
    };
  }
}

const ADMIN_PASSWORD = 'monika1980';

const CATEGORY_LABELS = {
  sunglasses: 'Sunglasses', reading: 'Reading', computer: 'Computer',
  sports: 'Sports', kids: 'Kids', contacts: 'Contacts'
};

/* ══════════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════════ */
let products = [];
let banners = [];
let deleteTargetId = null;
let currentImages = [];      // { src: string, isNew: bool, file?: File }
let currentColors = [];

/* ══════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════ */
function getColorName(hex) {
  const names = {
    '#1A1A1A': 'Black', '#C0C0C0': 'Silver', '#FFD700': 'Gold',
    '#B87333': 'Copper', '#8B4513': 'Brown', '#4169E1': 'Blue',
    '#DC143C': 'Red', '#228B22': 'Green', '#FF69B4': 'Pink',
    '#800080': 'Purple', '#FF8C00': 'Orange', '#FFFFFF': 'White',
    '#F5F5DC': 'Cream', '#808080': 'Grey', '#E8CDA0': 'Tortoiseshell'
  };
  return names[hex.toUpperCase()] || hex;
}

function getProductImages(p) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images;
  if (p.image) return [p.image];
  return [];
}

function getProductColors(p) {
  return Array.isArray(p.colors) ? p.colors : [];
}

/* ══════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('monika_admin_auth') === 'true') showDashboard();

  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('admin-password').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  document.getElementById('logout-btn').addEventListener('click', () => { sessionStorage.removeItem('monika_admin_auth'); location.reload(); });

  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('add-product-btn').addEventListener('click', () => openProductModal());
  document.getElementById('modal-close').addEventListener('click', closeProductModal);
  document.getElementById('modal-cancel').addEventListener('click', closeProductModal);
  document.getElementById('product-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeProductModal(); });

  document.getElementById('product-form').addEventListener('submit', handleFormSubmit);

  document.getElementById('delete-modal-close').addEventListener('click', closeDeleteModal);
  document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);
  document.getElementById('delete-confirm').addEventListener('click', confirmDelete);
  document.getElementById('delete-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeDeleteModal(); });

  document.getElementById('reset-btn').addEventListener('click', () => document.getElementById('reset-modal-overlay').classList.add('active'));
  document.getElementById('reset-modal-close').addEventListener('click', closeResetModal);
  document.getElementById('reset-cancel').addEventListener('click', closeResetModal);
  document.getElementById('reset-confirm').addEventListener('click', confirmReset);
  document.getElementById('reset-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeResetModal(); });

  document.getElementById('admin-search').addEventListener('input', renderTable);
  document.getElementById('admin-cat-filter').addEventListener('change', renderTable);
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-file').addEventListener('change', importData);

  setupImageUpload();
  setupColorPicker();
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
  if (pwd === ADMIN_PASSWORD) {
    sessionStorage.setItem('monika_admin_auth', 'true');
    showDashboard();
  } else {
    document.getElementById('login-error').textContent = 'Incorrect password. Try again.';
    document.getElementById('admin-password').classList.add('shake');
    setTimeout(() => document.getElementById('admin-password').classList.remove('shake'), 500);
  }
}

async function showDashboard() {
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'block';
  await loadProducts();
  await loadBanners();
  renderStats();
  renderTable();
}

/* ══════════════════════════════════════════════════════════
   DATA LOADING (from REST API)
   ══════════════════════════════════════════════════════════ */
async function loadProducts() {
  try {
    const res = await fetch(API_CONFIG.api('/api/products'));
    if (res.ok) products = await res.json();
  } catch (e) { console.error('Failed to load products:', e); }
}

async function loadBanners() {
  try {
    const res = await fetch(API_CONFIG.api('/api/banners'));
    if (res.ok) banners = await res.json();
  } catch (e) { console.error('Failed to load banners:', e); }
}

/* ══════════════════════════════════════════════════════════
   STATS
   ══════════════════════════════════════════════════════════ */
function renderStats() {
  const el = document.getElementById('admin-stats');
  const total = products.length;
  const visible = products.filter(p => p.visible !== false).length;
  let html = `
    <div class="admin-stat-card admin-stat-card--accent"><div class="admin-stat-card__number">${total}</div><div class="admin-stat-card__label">Total Products</div></div>
    <div class="admin-stat-card admin-stat-card--green"><div class="admin-stat-card__number">${visible}</div><div class="admin-stat-card__label">Visible</div></div>
  `;
  Object.entries(CATEGORY_LABELS).forEach(([key, label]) => {
    const count = products.filter(p => p.category === key).length;
    html += `<div class="admin-stat-card"><div class="admin-stat-card__number">${count}</div><div class="admin-stat-card__label">${label}</div></div>`;
  });
  el.innerHTML = html;
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
  if (catFilter !== 'all') filtered = filtered.filter(p => p.category === catFilter);
  if (search) filtered = filtered.filter(p => (p.name + p.brand + p.price + p.category).toLowerCase().includes(search));

  if (filtered.length === 0) { tbody.innerHTML = ''; emptyEl.style.display = 'flex'; return; }
  emptyEl.style.display = 'none';

  tbody.innerHTML = filtered.map(product => {
    const imgs = getProductImages(product);
    const primaryImg = imgs[0] ? API_CONFIG.imageUrl(imgs[0]) : '';
    const imgCount = imgs.length > 1 ? `<span class="admin-img-count">${imgs.length}</span>` : '';
    const colors = getProductColors(product);
    const colorsHtml = colors.length > 0
      ? colors.map(c => `<span class="admin-color-dot" style="background:${c === '#E8CDA0' ? 'linear-gradient(135deg,#E8CDA0,#8B4513,#E8CDA0)' : c};${c === '#FFFFFF' || c === '#F5F5DC' ? 'border:1px solid rgba(255,255,255,0.3);' : ''}" title="${getColorName(c)}"></span>`).join('')
      : '<span class="admin-text-muted">—</span>';
    const badge = product.badge ? `<span class="admin-badge">${product.badge}</span>` : '<span class="admin-text-muted">—</span>';
    const visIcon = product.visible !== false
      ? `<button class="admin-toggle admin-toggle--on" onclick="toggleVisibility('${product.id}')" title="Visible"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>`
      : `<button class="admin-toggle admin-toggle--off" onclick="toggleVisibility('${product.id}')" title="Hidden"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg></button>`;

    return `
      <tr data-id="${product.id}" class="${product.visible === false ? 'admin-row-hidden' : ''}">
        <td><div class="admin-table-img">${imgCount}<img src="${primaryImg}" alt="${product.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23EDE9E3%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2240%22>👓</text></svg>'" /></div></td>
        <td><strong>${product.name}</strong></td>
        <td>${product.brand}</td>
        <td><span class="admin-cat-pill">${CATEGORY_LABELS[product.category] || product.category}</span></td>
        <td><strong>${product.price}</strong></td>
        <td><div class="admin-color-dots">${colorsHtml}</div></td>
        <td>${badge}</td>
        <td>${visIcon}</td>
        <td><div class="admin-actions">
          <button class="admin-action-btn admin-action-btn--edit" onclick="editProduct('${product.id}')" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="admin-action-btn admin-action-btn--delete" onclick="deleteProduct('${product.id}')" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
        </div></td>
      </tr>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   VISIBILITY TOGGLE (REST API)
   ══════════════════════════════════════════════════════════ */
async function toggleVisibility(id) {
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return;
  const newVal = !products[idx].visible;
  try {
    await fetch(API_CONFIG.api(`/api/products/${id}/visibility`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: newVal })
    });
    products[idx].visible = newVal;
    renderStats();
    renderTable();
    showToast(`"${products[idx].name}" is now ${newVal ? 'visible' : 'hidden'}.`);
  } catch (e) { showToast('Failed to toggle visibility.', 'error'); }
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
    document.getElementById('prod-features').value = (product.features || []).join(', ');
    currentImages = getProductImages(product).map(src => ({ src: API_CONFIG.imageUrl(src), isNew: false, originalSrc: src }));
    currentColors = [...getProductColors(product)];
  } else {
    titleEl.textContent = 'Add Product';
    submitEl.textContent = 'Save Product';
    document.getElementById('product-form').reset();
    document.getElementById('edit-product-id').value = '';
    currentImages = [];
    currentColors = [];
  }

  renderThumbnails();
  renderSelectedColors();
  updateColorSwatchStates();
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('prod-name').focus(), 200);
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

async function handleFormSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById('edit-product-id').value;
  const name = document.getElementById('prod-name').value.trim();
  const brand = document.getElementById('prod-brand').value.trim();
  const price = document.getElementById('prod-price').value.trim();
  const category = document.getElementById('prod-category').value;
  const badge = document.getElementById('prod-badge').value.trim();
  const features = document.getElementById('prod-features').value.split(',').map(f => f.trim()).filter(f => f);

  if (!name || !brand || !price || !category || features.length === 0) { showToast('Please fill all required fields.', 'error'); return; }
  if (currentImages.length === 0) { showToast('Please upload at least one image.', 'error'); return; }

  // Build FormData for file upload
  const formData = new FormData();
  formData.append('name', name);
  formData.append('brand', brand);
  formData.append('price', price);
  formData.append('category', category);
  formData.append('badge', badge);
  formData.append('features', JSON.stringify(features));
  formData.append('colors', JSON.stringify(currentColors));

  // Separate existing images (already on server) from new files
  const existingImages = currentImages.filter(i => !i.isNew).map(i => i.originalSrc || i.src);
  formData.append('existingImages', JSON.stringify(existingImages));

  // Append new files
  currentImages.filter(i => i.isNew && i.file).forEach(i => {
    formData.append('images', i.file);
  });

  try {
    const url = editId ? API_CONFIG.api(`/api/products/${editId}`) : API_CONFIG.api('/api/products');
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, body: formData });
    const data = await res.json();

    if (data.ok) {
      await loadProducts();
      renderStats();
      renderTable();
      closeProductModal();
      showToast(`"${name}" ${editId ? 'updated' : 'added'} successfully!`);
    } else {
      showToast(data.error || 'Failed to save product.', 'error');
    }
  } catch (err) {
    console.error('Product save error:', err.message, err.stack);
    showToast('Server error: ' + err.message, 'error');
  }
}

/* ══════════════════════════════════════════════════════════
   EDIT & DELETE (REST API)
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

async function confirmDelete() {
  if (!deleteTargetId) { closeDeleteModal(); return; }
  try {
    const res = await fetch(API_CONFIG.api(`/api/products/${deleteTargetId}`), { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
      products = products.filter(p => p.id !== deleteTargetId);
      renderStats();
      renderTable();
      showToast(data.message || 'Product deleted.');
    }
  } catch (e) { showToast('Failed to delete.', 'error'); }
  closeDeleteModal();
}

/* ══════════════════════════════════════════════════════════
   RESET
   ══════════════════════════════════════════════════════════ */
function closeResetModal() { document.getElementById('reset-modal-overlay').classList.remove('active'); }

async function confirmReset() {
  try {
    await fetch(API_CONFIG.api('/api/products/bulk'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '[]' });
    products = [];
    renderStats();
    renderTable();
    showToast('All products cleared.');
  } catch (e) { showToast('Failed to reset.', 'error'); }
  closeResetModal();
}

/* ══════════════════════════════════════════════════════════
   EXPORT / IMPORT
   ══════════════════════════════════════════════════════════ */
async function exportData() {
  try {
    const res = await fetch(API_CONFIG.api('/api/export'));
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monika-opticals-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup exported!');
  } catch (e) { showToast('Export failed.', 'error'); }
}

async function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      const payload = Array.isArray(data) ? { products: data, banners: [] } : data;
      const res = await fetch(API_CONFIG.api('/api/import'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        await loadProducts();
        await loadBanners();
        renderStats();
        renderTable();
        showToast('Imported successfully!');
      }
    } catch (err) { showToast('Invalid file format.', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

/* ══════════════════════════════════════════════════════════
   COLOR PICKER
   ══════════════════════════════════════════════════════════ */
function setupColorPicker() {
  document.getElementById('color-presets').addEventListener('click', e => {
    const swatch = e.target.closest('.admin-color-swatch');
    if (!swatch) return;
    const color = swatch.dataset.color;
    if (color === 'custom') { document.getElementById('custom-color-input').click(); return; }
    toggleColor(color);
  });
  document.getElementById('custom-color-input').addEventListener('input', e => {
    const color = e.target.value.toUpperCase();
    if (!currentColors.includes(color)) { currentColors.push(color); renderSelectedColors(); updateColorSwatchStates(); }
  });
}

function toggleColor(hex) {
  hex = hex.toUpperCase();
  const idx = currentColors.indexOf(hex);
  if (idx > -1) currentColors.splice(idx, 1);
  else currentColors.push(hex);
  renderSelectedColors();
  updateColorSwatchStates();
}

function removeColor(i) { currentColors.splice(i, 1); renderSelectedColors(); updateColorSwatchStates(); }

function updateColorSwatchStates() {
  document.querySelectorAll('#color-presets .admin-color-swatch').forEach(s => {
    const c = s.dataset.color;
    if (c === 'custom') return;
    s.classList.toggle('selected', currentColors.includes(c.toUpperCase()));
  });
}

function renderSelectedColors() {
  const el = document.getElementById('selected-colors');
  if (currentColors.length === 0) { el.innerHTML = '<span class="admin-no-colors">No colors selected</span>'; return; }
  el.innerHTML = currentColors.map((c, i) => `
    <div class="admin-selected-color" title="${getColorName(c)}">
      <span class="admin-selected-color__circle" style="background:${c === '#E8CDA0' ? 'linear-gradient(135deg,#E8CDA0,#8B4513,#E8CDA0)' : c};${c === '#FFFFFF' || c === '#F5F5DC' ? 'border:1px solid rgba(255,255,255,0.3);' : ''}"></span>
      <span class="admin-selected-color__name">${getColorName(c)}</span>
      <button type="button" class="admin-selected-color__remove" onclick="removeColor(${i})">&times;</button>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════
   IMAGE UPLOAD (File-based, not base64)
   ══════════════════════════════════════════════════════════ */
function setupImageUpload() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('prod-image');
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { if (fileInput.files.length > 0) { addImageFiles(fileInput.files); fileInput.value = ''; } });
  ['dragenter', 'dragover'].forEach(e => dropzone.addEventListener(e, ev => { ev.preventDefault(); dropzone.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(e => dropzone.addEventListener(e, ev => { ev.preventDefault(); dropzone.classList.remove('dragover'); }));
  dropzone.addEventListener('drop', ev => { ev.preventDefault(); if (ev.dataTransfer.files.length > 0) addImageFiles(ev.dataTransfer.files); });
}

function addImageFiles(files) {
  const remaining = 6 - currentImages.length;
  if (remaining <= 0) { showToast('Maximum 6 images.', 'error'); return; }
  Array.from(files).slice(0, remaining).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { showToast(`"${file.name}" too large (max 5MB).`, 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      currentImages.push({ src: e.target.result, isNew: true, file });
      renderThumbnails();
    };
    reader.readAsDataURL(file);
  });
}

function renderThumbnails() {
  const grid = document.getElementById('thumbs-grid');
  if (currentImages.length === 0) { grid.innerHTML = ''; return; }
  grid.innerHTML = currentImages.map((img, i) => `
    <div class="admin-thumb" data-index="${i}">
      <img src="${img.src}" alt="Image ${i + 1}" />
      ${i === 0 ? '<span class="admin-thumb__primary">Primary</span>' : ''}
      <button type="button" class="admin-thumb__remove" onclick="removeImage(${i})">&times;</button>
    </div>
  `).join('');
}

function removeImage(i) { currentImages.splice(i, 1); renderThumbnails(); }

/* ══════════════════════════════════════════════════════════
   BANNER MANAGER (REST API with file upload)
   ══════════════════════════════════════════════════════════ */
function setupBannerManager() {
  const addBtn = document.getElementById('add-banner-btn');
  const fileInput = document.getElementById('banner-file-input');
  addBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      Array.from(fileInput.files).forEach(async file => {
        if (!file.type.startsWith('image/')) return;
        if (file.size > 5 * 1024 * 1024) { showToast(`"${file.name}" too large (max 5MB).`, 'error'); return; }
        const formData = new FormData();
        formData.append('image', file);
        formData.append('alt', file.name.replace(/\.[^/.]+$/, ''));
        try {
          const res = await fetch(API_CONFIG.api('/api/banners'), { method: 'POST', body: formData });
          const data = await res.json();
          if (data.ok) { banners.push(data.banner); renderBanners(); showToast('Banner added!'); }
        } catch (e) { showToast('Failed to upload banner.', 'error'); }
      });
      fileInput.value = '';
    }
  });
}

function renderBanners() {
  const grid = document.getElementById('banner-grid');
  const emptyEl = document.getElementById('banner-empty');
  if (banners.length === 0) { grid.innerHTML = ''; emptyEl.style.display = 'flex'; return; }
  emptyEl.style.display = 'none';
  grid.innerHTML = banners.map((b, i) => {
    const imgSrc = API_CONFIG.imageUrl(b.src);
    return `
    <div class="admin-banner-card ${b.visible ? '' : 'admin-banner-card--hidden'}" data-id="${b.id}">
      <div class="admin-banner-card__img"><img src="${imgSrc}" alt="${b.alt}" /><div class="admin-banner-card__overlay"><span class="admin-banner-card__order">${i + 1}</span></div></div>
      <div class="admin-banner-card__controls">
        <div class="admin-banner-card__info"><input class="admin-banner-alt-input" value="${b.alt}" onchange="updateBannerAlt('${b.id}', this.value)" placeholder="Alt text..." /></div>
        <div class="admin-banner-card__actions">
          ${i > 0 ? `<button class="admin-action-btn admin-action-btn--edit" onclick="moveBanner('${b.id}', -1)" title="Move Left"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>` : ''}
          ${i < banners.length - 1 ? `<button class="admin-action-btn admin-action-btn--edit" onclick="moveBanner('${b.id}', 1)" title="Move Right"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>` : ''}
          <button class="admin-toggle ${b.visible ? 'admin-toggle--on' : 'admin-toggle--off'}" onclick="toggleBannerVisibility('${b.id}')" title="${b.visible ? 'Hide' : 'Show'}">
            ${b.visible ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'}
          </button>
          <button class="admin-action-btn admin-action-btn--delete" onclick="deleteBanner('${b.id}')" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>
      </div>
    </div>
  `;}).join('');
}

async function toggleBannerVisibility(id) {
  const idx = banners.findIndex(b => b.id === id);
  if (idx === -1) return;
  const newVal = !banners[idx].visible;
  try {
    await fetch(API_CONFIG.api(`/api/banners/${id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visible: newVal }) });
    banners[idx].visible = newVal;
    renderBanners();
    showToast(`Banner ${newVal ? 'shown' : 'hidden'}.`);
  } catch (e) { showToast('Failed.', 'error'); }
}

async function deleteBanner(id) {
  try {
    await fetch(API_CONFIG.api(`/api/banners/${id}`), { method: 'DELETE' });
    banners = banners.filter(b => b.id !== id);
    renderBanners();
    showToast('Banner deleted.');
  } catch (e) { showToast('Failed to delete.', 'error'); }
}

async function moveBanner(id, direction) {
  const idx = banners.findIndex(b => b.id === id);
  if (idx === -1) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= banners.length) return;
  [banners[idx], banners[newIdx]] = [banners[newIdx], banners[idx]];
  try {
    await fetch(API_CONFIG.api('/api/banners/reorder'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderedIds: banners.map(b => b.id) }) });
    renderBanners();
  } catch (e) { showToast('Reorder failed.', 'error'); }
}

async function updateBannerAlt(id, value) {
  const idx = banners.findIndex(b => b.id === id);
  if (idx !== -1) {
    banners[idx].alt = value;
    try { await fetch(API_CONFIG.api(`/api/banners/${id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alt: value }) }); } catch(e) {}
  }
}

/* ══════════════════════════════════════════════════════════
   DISPLAY CONTROL GRID
   ══════════════════════════════════════════════════════════ */
function renderDisplayGrid() {
  const grid = document.getElementById('display-grid');
  if (products.length === 0) { grid.innerHTML = '<p class="admin-text-muted" style="padding:40px;text-align:center;">No products yet.</p>'; return; }
  grid.innerHTML = products.map(p => {
    const imgs = getProductImages(p);
    const isVis = p.visible !== false;
    const imgSrc = imgs[0] ? API_CONFIG.imageUrl(imgs[0]) : '';
    return `
      <div class="admin-display-card ${isVis ? '' : 'admin-display-card--hidden'}" data-id="${p.id}">
        <div class="admin-display-card__img"><img src="${imgSrc}" alt="${p.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23EDE9E3%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2240%22>👓</text></svg>'" /></div>
        <div class="admin-display-card__info"><strong>${p.name}</strong><small>${p.brand} · ${CATEGORY_LABELS[p.category] || p.category}</small></div>
        <label class="admin-switch"><input type="checkbox" ${isVis ? 'checked' : ''} onchange="toggleVisibilityFromDisplay('${p.id}', this.checked)" /><span class="admin-switch__slider"></span></label>
      </div>`;
  }).join('');
}

async function toggleVisibilityFromDisplay(id, checked) {
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return;
  await fetch(API_CONFIG.api(`/api/products/${id}/visibility`), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visible: checked }) });
  products[idx].visible = checked;
  renderStats();
  const card = document.querySelector(`.admin-display-card[data-id="${id}"]`);
  if (card) card.classList.toggle('admin-display-card--hidden', !checked);
}

/* ══════════════════════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════════════════════ */
function showToast(message, type = 'success') {
  const toast = document.getElementById('admin-toast');
  toast.textContent = message;
  toast.className = 'admin-toast admin-toast--' + type + ' admin-toast--visible';
  setTimeout(() => toast.classList.remove('admin-toast--visible'), 3000);
}

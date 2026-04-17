/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Express Backend Server
   Full CRUD API for Products & Banners
   File-based image uploads via Multer
   Persistent JSON storage on disk
   ═══════════════════════════════════════════════════════════════ */

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Directories ── */
const DATA_DIR    = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const BANNERS_FILE  = path.join(DATA_DIR, 'banners.json');

// Ensure directories exist
[DATA_DIR, UPLOADS_DIR, path.join(UPLOADS_DIR, 'products'), path.join(UPLOADS_DIR, 'banners')].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Ensure data files exist
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, '[]', 'utf-8');
if (!fs.existsSync(BANNERS_FILE))  fs.writeFileSync(BANNERS_FILE, '[]', 'utf-8');

/* ── Middleware ── */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Pure REST API root route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' });
});

/* ── Multer config for product images ── */
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(UPLOADS_DIR, 'products')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, 'prod-' + uniqueSuffix + ext);
  }
});

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(UPLOADS_DIR, 'banners')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, 'banner-' + uniqueSuffix + ext);
  }
});

const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  }
});

const uploadBanner = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  }
});

/* ── JSON helpers ── */
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/* ═══════════════════════════════════════════════════════════
   PRODUCT API
   ═══════════════════════════════════════════════════════════ */

// GET all products
app.get('/api/products', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  res.json(products);
});

// GET single product
app.get('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST create product (with image upload)
app.post('/api/products', uploadProduct.array('images', 6), (req, res) => {
  try {
    const products = readJSON(PRODUCTS_FILE);
    const body = req.body;

    // Build image paths from uploaded files
    const uploadedImages = (req.files || []).map(f => '/uploads/products/' + f.filename);
    
    // Also accept base64 images sent in body
    let existingImages = [];
    if (body.existingImages) {
      try { existingImages = JSON.parse(body.existingImages); } catch(e) { existingImages = []; }
    }

    const allImages = [...existingImages, ...uploadedImages];

    const newProduct = {
      id: body.id || ('prod-' + Date.now().toString(36)),
      name: body.name,
      brand: body.brand,
      price: body.price,
      category: body.category,
      features: body.features ? (typeof body.features === 'string' ? JSON.parse(body.features) : body.features) : [],
      badge: body.badge || '',
      colors: body.colors ? (typeof body.colors === 'string' ? JSON.parse(body.colors) : body.colors) : [],
      images: allImages,
      image: allImages[0] || '',
      visible: body.visible !== undefined ? body.visible === 'true' || body.visible === true : true
    };

    products.push(newProduct);
    writeJSON(PRODUCTS_FILE, products);

    console.log(`  ✅ Product added: "${newProduct.name}" (${newProduct.id})`);
    res.json({ ok: true, product: newProduct });
  } catch (err) {
    console.error('  ❌ Error adding product:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT update product
app.put('/api/products/:id', uploadProduct.array('images', 6), (req, res) => {
  try {
    const products = readJSON(PRODUCTS_FILE);
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const body = req.body;

    // New uploaded images
    const uploadedImages = (req.files || []).map(f => '/uploads/products/' + f.filename);

    // Existing images to keep (sent from frontend)
    let existingImages = [];
    if (body.existingImages) {
      try { existingImages = JSON.parse(body.existingImages); } catch(e) { existingImages = []; }
    }

    const allImages = [...existingImages, ...uploadedImages];

    // Delete old images that are no longer used
    const oldImages = products[idx].images || [];
    oldImages.forEach(img => {
      if (img.startsWith('/uploads/') && !allImages.includes(img)) {
        const filePath = path.join(__dirname, img);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    products[idx] = {
      ...products[idx],
      name: body.name || products[idx].name,
      brand: body.brand || products[idx].brand,
      price: body.price || products[idx].price,
      category: body.category || products[idx].category,
      features: body.features ? (typeof body.features === 'string' ? JSON.parse(body.features) : body.features) : products[idx].features,
      badge: body.badge !== undefined ? body.badge : products[idx].badge,
      colors: body.colors ? (typeof body.colors === 'string' ? JSON.parse(body.colors) : body.colors) : products[idx].colors,
      images: allImages.length > 0 ? allImages : products[idx].images,
      image: allImages.length > 0 ? allImages[0] : products[idx].image,
      visible: body.visible !== undefined ? (body.visible === 'true' || body.visible === true) : products[idx].visible
    };

    writeJSON(PRODUCTS_FILE, products);
    console.log(`  ✏️  Product updated: "${products[idx].name}"`);
    res.json({ ok: true, product: products[idx] });
  } catch (err) {
    console.error('  ❌ Error updating product:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle visibility
app.patch('/api/products/:id/visibility', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  products[idx].visible = req.body.visible;
  writeJSON(PRODUCTS_FILE, products);
  console.log(`  👁️  "${products[idx].name}" → ${products[idx].visible ? 'visible' : 'hidden'}`);
  res.json({ ok: true, product: products[idx] });
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  let products = readJSON(PRODUCTS_FILE);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  // Delete associated uploaded images
  (product.images || []).forEach(img => {
    if (img.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, img);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });

  products = products.filter(p => p.id !== req.params.id);
  writeJSON(PRODUCTS_FILE, products);
  console.log(`  🗑️  Product deleted: "${product.name}"`);
  res.json({ ok: true, message: `"${product.name}" deleted` });
});

// POST bulk save products (for import/reset)
app.post('/api/products/bulk', (req, res) => {
  try {
    writeJSON(PRODUCTS_FILE, req.body);
    console.log(`  📦 Bulk save: ${req.body.length} products`);
    res.json({ ok: true, count: req.body.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ═══════════════════════════════════════════════════════════
   BANNER API
   ═══════════════════════════════════════════════════════════ */

// GET all banners
app.get('/api/banners', (req, res) => {
  const banners = readJSON(BANNERS_FILE);
  res.json(banners);
});

// POST add banner (with image upload)
app.post('/api/banners', uploadBanner.single('image'), (req, res) => {
  try {
    const banners = readJSON(BANNERS_FILE);
    const body = req.body;

    let imageSrc = '';
    if (req.file) {
      imageSrc = '/uploads/banners/' + req.file.filename;
    } else if (body.src) {
      imageSrc = body.src;  // base64 or URL
    }

    const newBanner = {
      id: 'b-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
      src: imageSrc,
      alt: body.alt || 'Banner Image',
      visible: true
    };

    banners.push(newBanner);
    writeJSON(BANNERS_FILE, banners);
    console.log(`  🖼️  Banner added: "${newBanner.alt}"`);
    res.json({ ok: true, banner: newBanner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update banner
app.put('/api/banners/:id', (req, res) => {
  const banners = readJSON(BANNERS_FILE);
  const idx = banners.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Banner not found' });

  if (req.body.alt !== undefined) banners[idx].alt = req.body.alt;
  if (req.body.visible !== undefined) banners[idx].visible = req.body.visible;

  writeJSON(BANNERS_FILE, banners);
  res.json({ ok: true, banner: banners[idx] });
});

// DELETE banner
app.delete('/api/banners/:id', (req, res) => {
  let banners = readJSON(BANNERS_FILE);
  const banner = banners.find(b => b.id === req.params.id);
  if (!banner) return res.status(404).json({ error: 'Banner not found' });

  // Delete uploaded file
  if (banner.src && banner.src.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, banner.src);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  banners = banners.filter(b => b.id !== req.params.id);
  writeJSON(BANNERS_FILE, banners);
  console.log(`  🗑️  Banner deleted: "${banner.alt}"`);
  res.json({ ok: true });
});

// POST reorder banners
app.post('/api/banners/reorder', (req, res) => {
  try {
    const { orderedIds } = req.body;
    const banners = readJSON(BANNERS_FILE);
    const reordered = orderedIds.map(id => banners.find(b => b.id === id)).filter(Boolean);
    // Add any banners not in the reorder list at the end
    banners.forEach(b => {
      if (!orderedIds.includes(b.id)) reordered.push(b);
    });
    writeJSON(BANNERS_FILE, reordered);
    console.log(`  ↕️  Banners reordered`);
    res.json({ ok: true, banners: reordered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST bulk save banners (for import/reset)
app.post('/api/banners/bulk', (req, res) => {
  try {
    writeJSON(BANNERS_FILE, req.body);
    console.log(`  📦 Bulk save: ${req.body.length} banners`);
    res.json({ ok: true, count: req.body.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ═══════════════════════════════════════════════════════════
   EXPORT / IMPORT
   ═══════════════════════════════════════════════════════════ */

// GET full export
app.get('/api/export', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const banners = readJSON(BANNERS_FILE);
  res.json({ products, banners, exportedAt: new Date().toISOString() });
});

// POST full import
app.post('/api/import', (req, res) => {
  try {
    const { products, banners } = req.body;
    if (Array.isArray(products)) writeJSON(PRODUCTS_FILE, products);
    if (Array.isArray(banners)) writeJSON(BANNERS_FILE, banners);
    console.log(`  📥 Import complete: ${products?.length || 0} products, ${banners?.length || 0} banners`);
    res.json({ ok: true, products: products?.length || 0, banners: banners?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ═══════════════════════════════════════════════════════════
   START SERVER
   ═══════════════════════════════════════════════════════════ */
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║   Monika Opticals — Backend Server       ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║   Local:   http://localhost:${PORT}/          ║`);
  console.log(`  ║   Admin:   http://localhost:${PORT}/admin     ║`);
  console.log('  ║                                          ║');
  console.log('  ║   API Endpoints:                         ║');
  console.log('  ║   GET/POST/PUT/DELETE /api/products       ║');
  console.log('  ║   GET/POST/PUT/DELETE /api/banners        ║');
  console.log('  ║   GET /api/export   POST /api/import      ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});

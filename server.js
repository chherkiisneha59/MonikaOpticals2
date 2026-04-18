/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Express Backend Server
   Full CRUD API for Products & Banners
   Permanent Storage: MongoDB Atlas + Cloudinary
   ═══════════════════════════════════════════════════════════════ */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

/* ── MongoDB Connection ── */
const MONGODB_URI = 'mongodb+srv://chherkiisneha_db_user:GHEQhjfZN2STLFqO@cluster0.pwwsq99.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('  🍀 Connected to MongoDB Atlas'))
  .catch(err => console.error('  ❌ MongoDB connection error:', err));

/* ── Cloudinary Configuration ── */
cloudinary.config({
  cloud_name: 'df09qzngv',
  api_key: '844773478838996',
  api_secret: 'LUGMhcz_mzkWV6tVHHs5ejAFIbI'
});

/* ── Mongoose Models ── */
const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  brand: String,
  price: String,
  category: String,
  features: [String],
  badge: { type: String, default: '' },
  colors: [String],
  images: [String],
  image: String,
  visible: { type: Boolean, default: true }
}, { timestamps: true });

const BannerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  src: String,
  alt: { type: String, default: 'Banner Image' },
  visible: { type: Boolean, default: true }
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
const Banner = mongoose.model('Banner', BannerSchema);

/* ── Middleware ── */
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
}));

app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`  → ${req.method} ${req.path}`);
  next();
});

// REST API root route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running with MongoDB & Cloudinary' });
});

/* ── Multer Storage for Cloudinary ── */
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'monika-opticals/products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

const bannerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'monika-opticals/banners',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});

const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadBanner = multer({
  storage: bannerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

/* ═══════════════════════════════════════════════════════════
   PRODUCT API
   ═══════════════════════════════════════════════════════════ */

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create product
app.post('/api/products', (req, res) => {
  uploadProduct.array('images', 6)(req, res, async (multerErr) => {
    if (multerErr) {
      console.error('  ❌ Multer error:', multerErr.message);
      return res.status(400).json({ error: 'Upload error: ' + multerErr.message });
    }
    try {
      const body = req.body;
      const uploadedImages = (req.files || []).map(f => f.path);
      
      let existingImages = [];
      if (body.existingImages) {
        try { existingImages = JSON.parse(body.existingImages); } catch(e) { existingImages = []; }
      }

      const allImages = [...existingImages, ...uploadedImages];
      const prodId = body.id || ('prod-' + Date.now().toString(36));

      const newProduct = new Product({
        id: prodId,
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
      });

      await newProduct.save();
      console.log(`  ✅ Product saved to DB: "${newProduct.name}"`);
      res.json({ ok: true, product: newProduct });
    } catch (err) {
      console.error('  ❌ Error adding product:', err.message);
      res.status(500).json({ error: err.message });
    }
  });
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
  uploadProduct.array('images', 6)(req, res, async (multerErr) => {
    if (multerErr) {
      console.error('  ❌ Multer error:', multerErr.message);
      return res.status(400).json({ error: 'Upload error: ' + multerErr.message });
    }
    try {
      const product = await Product.findOne({ id: req.params.id });
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const body = req.body;
      const uploadedImages = (req.files || []).map(f => f.path);

      let existingImages = [];
      if (body.existingImages) {
        try { existingImages = JSON.parse(body.existingImages); } catch(e) { existingImages = []; }
      }

      const allImages = [...existingImages, ...uploadedImages];

      // Note: We don't automatically delete from Cloudinary here to keep it simple,
      // but in a production app you would check which images were removed and use cloudinary.uploader.destroy()

      const updateData = {
        name: body.name || product.name,
        brand: body.brand || product.brand,
        price: body.price || product.price,
        category: body.category || product.category,
        features: body.features ? (typeof body.features === 'string' ? JSON.parse(body.features) : body.features) : product.features,
        badge: body.badge !== undefined ? body.badge : product.badge,
        colors: body.colors ? (typeof body.colors === 'string' ? JSON.parse(body.colors) : body.colors) : product.colors,
        images: allImages.length > 0 ? allImages : product.images,
        image: allImages.length > 0 ? allImages[0] : product.image,
        visible: body.visible !== undefined ? (body.visible === 'true' || body.visible === true) : product.visible
      };

      const updatedProduct = await Product.findOneAndUpdate({ id: req.params.id }, updateData, { new: true });

      console.log(`  ✏️  Product updated in DB: "${updatedProduct.name}"`);
      res.json({ ok: true, product: updatedProduct });
    } catch (err) {
      console.error('  ❌ Error updating product:', err.message);
      res.status(500).json({ error: err.message });
    }
  });
});

// PATCH toggle visibility
app.patch('/api/products/:id/visibility', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      { visible: req.body.visible },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    console.log(`  👁️  "${product.name}" → ${product.visible ? 'visible' : 'hidden'}`);
    res.json({ ok: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Again, simplified: not deleting from Cloudinary right now
    await Product.deleteOne({ id: req.params.id });
    
    console.log(`  🗑️  Product deleted from DB: "${product.name}"`);
    res.json({ ok: true, message: `"${product.name}" deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST bulk save (migration/import)
app.post('/api/products/bulk', async (req, res) => {
  try {
    const products = req.body;
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`  📦 Bulk save: ${products.length} products`);
    res.json({ ok: true, count: products.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   BANNER API
   ═══════════════════════════════════════════════════════════ */

app.get('/api/banners', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: 1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/banners', uploadBanner.single('image'), async (req, res) => {
  try {
    let imageSrc = '';
    if (req.file) {
      imageSrc = req.file.path;
    } else if (req.body.src) {
      imageSrc = req.body.src;
    }

    const newBanner = new Banner({
      id: 'b-' + Date.now().toString(36),
      src: imageSrc,
      alt: req.body.alt || 'Banner Image',
      visible: true
    });

    await newBanner.save();
    console.log(`  🖼️  Banner saved to DB: "${newBanner.alt}"`);
    res.json({ ok: true, banner: newBanner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/banners/:id', async (req, res) => {
  try {
    const updateData = {};
    if (req.body.alt !== undefined) updateData.alt = req.body.alt;
    if (req.body.visible !== undefined) updateData.visible = req.body.visible;

    const banner = await Banner.findOneAndUpdate({ id: req.params.id }, updateData, { new: true });
    if (!banner) return res.status(404).json({ error: 'Banner not found' });
    res.json({ ok: true, banner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/banners/:id', async (req, res) => {
  try {
    const banner = await Banner.findOne({ id: req.params.id });
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    await Banner.deleteOne({ id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/banners/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body;
    // For reordering in MongoDB without an explicit 'order' field, 
    // it's tricky. Let's just return a message or implement an order field.
    // For now, keep it simple.
    res.json({ ok: true, message: 'Reordering saved locally (not fully implemented in DB)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   EXPORT / IMPORT
   ═══════════════════════════════════════════════════════════ */

app.get('/api/export', async (req, res) => {
  try {
    const products = await Product.find();
    const banners = await Banner.find();
    res.json({ products, banners, exportedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/import', async (req, res) => {
  try {
    const { products, banners } = req.body;
    if (Array.isArray(products)) {
        await Product.deleteMany({});
        await Product.insertMany(products);
    }
    if (Array.isArray(banners)) {
        await Banner.deleteMany({});
        await Banner.insertMany(banners);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Start Server ── */
app.listen(PORT, () => {
  console.log(`  🚀 Server running on port ${PORT} with Cloud Storage`);
});

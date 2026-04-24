/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Express Backend Server (Supabase Version)
   Full CRUD API for Products & Banners
   Permanent Storage: Supabase (PostgreSQL) + Supabase Storage
   ═══════════════════════════════════════════════════════════════ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

/* ── Supabase Configuration ── */
const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : undefined;
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('  ❌ CRITICAL: Missing SUPABASE_URL or SUPABASE_KEY in environment variables!');
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('  🍀 Initialized Supabase Client');

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
app.set('json spaces', 2);

app.use((req, res, next) => {
  console.log(`  → ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend is running with Supabase',
    supabaseConnected: !!supabaseUrl,
    debug: '/api/debug-supabase'
  });
});

/* ── Config Route (Secure Handoff) ── */
app.get('/api/config', (req, res) => {
  res.json({
    email: process.env.ADMIN_EMAIL || '',
    phone: process.env.BUSINESS_PHONE || '',
    whatsapp: process.env.BUSINESS_WHATSAPP || '',
    address: process.env.BUSINESS_ADDRESS || '',
    mapsUrl: process.env.BUSINESS_MAPS_URL || ''
  });
});

/* ── Auth Route (Secure) ── */
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'monika1980';
  if (password === adminPassword) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: 'Incorrect password' });
  }
});

/* ── Debug Route ── */
app.get('/api/debug-supabase', async (req, res) => {
  try {
    const results = {
      config: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        isServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      storage: {},
      database: {}
    };

    // Check Storage
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (bErr) results.storage.error = bErr.message;
    else {
      results.storage.buckets = buckets.map(b => b.name);
      results.storage.hasRequiredBucket = buckets.some(b => b.name === 'monika-opticals');
    }

    // Check Database
    const { error: tErr } = await supabase.from('products').select('id').limit(1);
    if (tErr) results.database.productsTable = tErr.message;
    else results.database.productsTable = 'OK';

    const { error: btErr } = await supabase.from('banners').select('id').limit(1);
    if (btErr) results.database.bannersTable = btErr.message;
    else results.database.bannersTable = 'OK';

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Multer Storage (In-Memory) ── */
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } 
});

/* ── Helper: Upload to Supabase Storage ── */
async function uploadToSupabase(file, bucketName, folder) {
  if (!file) return '';
  
  const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) {
    console.error(`  ❌ Supabase Storage Error [Bucket: ${bucketName}]:`, error.message);
    throw new Error(`Upload failed for "${file.originalname}": ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrl;
}

/* ═══════════════════════════════════════════════════════════
   PRODUCT API
   ═══════════════════════════════════════════════════════════ */

app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', upload.array('images', 6), async (req, res) => {
  try {
    const body = req.body;
    const files = req.files || [];
    
    const category = body.category ? body.category.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'uncategorized';
    
    const uploadedImages = await Promise.all(
      files.map(file => uploadToSupabase(file, 'monika-opticals', `products/${category}`))
    );
    
    let existingImages = [];
    if (body.existingImages) {
      try { existingImages = JSON.parse(body.existingImages); } catch(e) { existingImages = []; }
    }

    const allImages = [...existingImages, ...uploadedImages];
    const prodId = body.id || ('prod-' + Date.now().toString(36));

    const productData = {
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
      visible: body.visible !== undefined ? (body.visible === 'true' || body.visible === true) : true
    };

    // Ensure these are arrays for Supabase JSONB columns
    const finalFeatures = Array.isArray(productData.features) ? productData.features : [];
    const finalColors = Array.isArray(productData.colors) ? productData.colors : [];
    const finalImages = Array.isArray(allImages) ? allImages : [];

    const cleanProductData = {
      ...productData,
      features: finalFeatures,
      colors: finalColors,
      images: finalImages,
      image: finalImages[0] || ''
    };

    const { data, error } = await supabase
      .from('products')
      .insert([cleanProductData])
      .select();

    if (error) {
      console.error('  ❌ Database Insert Error:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    res.json({ ok: true, product: data[0] });
  } catch (err) {
    console.error('  ❌ POST /api/products error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', upload.array('images', 6), async (req, res) => {
  try {
    const body = req.body;
    const files = req.files || [];
    const uploadedImages = await Promise.all(
      files.map(file => uploadToSupabase(file, 'monika-opticals', 'products'))
    );

    let existingImages = [];
    if (body.existingImages) {
      try { existingImages = JSON.parse(body.existingImages); } catch(e) { existingImages = []; }
    }

    const allImages = [...existingImages, ...uploadedImages];

    const updateData = {
      name: body.name,
      brand: body.brand,
      price: body.price,
      category: body.category,
      features: body.features ? (typeof body.features === 'string' ? JSON.parse(body.features) : body.features) : undefined,
      badge: body.badge,
      colors: body.colors ? (typeof body.colors === 'string' ? JSON.parse(body.colors) : body.colors) : undefined,
      images: allImages.length > 0 ? allImages : undefined,
      image: allImages.length > 0 ? allImages[0] : undefined,
      visible: body.visible !== undefined ? (body.visible === 'true' || body.visible === true) : undefined
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json({ ok: true, product: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/products/:id/visibility', async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ visible: req.body.visible })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products/bulk', async (req, res) => {
  try {
    const products = req.body;
    await supabase.from('products').delete().neq('id', '_');
    const { data, error } = await supabase.from('products').insert(products).select();
    if (error) throw error;
    res.json({ ok: true, count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   BANNER API
   ═══════════════════════════════════════════════════════════ */

app.get('/api/banners', async (req, res) => {
  try {
    const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/banners', upload.single('image'), async (req, res) => {
  try {
    let imageSrc = '';
    if (req.file) {
      imageSrc = await uploadToSupabase(req.file, 'monika-opticals', 'banners');
    } else if (req.body.src) {
      imageSrc = req.body.src;
    }

    const bannerData = {
      id: 'b-' + Date.now().toString(36),
      src: imageSrc,
      alt: req.body.alt || 'Banner Image',
      visible: true
    };

    const { data, error } = await supabase.from('banners').insert([bannerData]).select();
    if (error) {
      console.error('  ❌ Banner Insert Error:', error.message);
      throw new Error(`Banner Database Error: ${error.message}`);
    }
    res.json({ ok: true, banner: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/banners/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('banners').update(req.body).eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/banners/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('banners').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   EXPORT / IMPORT
   ═══════════════════════════════════════════════════════════ */

app.get('/api/export', async (req, res) => {
  try {
    const { data: products } = await supabase.from('products').select('*');
    const { data: banners } = await supabase.from('banners').select('*');
    res.json({ products, banners, exportedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/import', async (req, res) => {
  try {
    const { products, banners } = req.body;
    if (Array.isArray(products)) {
      await supabase.from('products').delete().neq('id', '_');
      await supabase.from('products').insert(products);
    }
    if (Array.isArray(banners)) {
      await supabase.from('banners').delete().neq('id', '_');
      await supabase.from('banners').insert(banners);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`  🚀 Server running on port ${PORT} with Robust Supabase Handling`);
});

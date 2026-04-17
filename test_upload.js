async function run() {
  const form = new FormData();
  form.append('name', 'Test Glasses');
  form.append('brand', 'RayBan');
  form.append('price', '1999');
  form.append('category', 'sunglasses');
  form.append('features', JSON.stringify(['UV Protection']));
  form.append('colors', JSON.stringify(['#000000']));
  form.append('existingImages', JSON.stringify([]));

  // Dummy image payload as a blob
  const fileContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
  const blob = new Blob([fileContent], { type: 'image/png' });
  form.append('images', blob, 'test.png');

  console.log('Sending request to Render...');
  try {
    const res = await fetch('https://monikaopticals2-1.onrender.com/api/products', {
      method: 'POST',
      body: form
    });
    
    const status = res.status;
    const text = await res.text();
    console.log(`Status: ${status}`);
    console.log(`Response Body: ${text}`);
  } catch (e) {
    console.error('Fetch Failed:', e);
  }
}

run();

const fs = require('fs');
const path = require('path');

async function testUpload() {
  const formData = new FormData();
  formData.append('name', 'Test');
  formData.append('brand', 'TestBrand');
  formData.append('price', '100');
  formData.append('category', 'sunglasses');
  formData.append('features', JSON.stringify(['Test']));
  
  // Note: normally we append files, but let's test without files first, wait, does multer require an image?
  // Let's create a dummy blob
  const text = "dummy image content";
  const blob = new Blob([text], { type: 'image/jpeg' });
  formData.append('images', blob, 'test.jpg');

  try {
    const res = await fetch('https://monikaopticals2-1.onrender.com/api/products', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch(e) {
    console.error("Error:", e);
  }
}

testUpload();

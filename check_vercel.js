async function checkVercel() {
  try {
    const res = await fetch('https://monika-opticals2-henna.vercel.app/admin.js');
    const text = await res.text();
    if (text.includes('API_CONFIG')) {
      console.log('✅ API_CONFIG is present in Vercel admin.js');
    } else {
      console.log('❌ API_CONFIG is MISSING from Vercel admin.js');
    }
    
    // Check fetch statements
    const fetches = text.match(/fetch\(.*?\)/g);
    if (fetches) {
      console.log('Found fetch calls:', fetches.slice(0, 3));
    }
  } catch (e) {
    console.error(e);
  }
}
checkVercel();

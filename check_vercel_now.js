async function run() {
  const fetch = (await import('node-fetch')).default || global.fetch;
  try {
    const res = await fetch('https://monika-opticals2-henna.vercel.app/admin.js?v=' + Date.now());
    const text = await res.text();
    if (text.includes('API_CONFIG')) {
      console.log('✅ Vercel HAS API_CONFIG!');
    } else {
      console.log('❌ Vercel still missing API_CONFIG!');
    }
  } catch (e) {}
}
run();

const https = require('https');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== Checking what Vercel is ACTUALLY serving ===\n');

  // 1. Check admin.html source for script tags
  const html = await fetchText('https://monika-opticals2-henna.vercel.app/admin.html');
  console.log('admin.html status:', html.status);
  const scriptTags = html.body.match(/<script[^>]*src="([^"]*)"[^>]*>/g);
  console.log('Script tags found:', scriptTags || 'NONE');

  // 2. Check if API_CONFIG exists in admin.js
  const adminJs = await fetchText('https://monika-opticals2-henna.vercel.app/admin.js');
  console.log('\nadmin.js status:', adminJs.status);
  console.log('admin.js length:', adminJs.body.length, 'bytes');
  console.log('Has API_CONFIG:', adminJs.body.includes('API_CONFIG'));
  console.log('Has BACKEND_URL:', adminJs.body.includes('monikaopticals2-1.onrender.com'));
  console.log('Has Version 3.0:', adminJs.body.includes('Version 3.0'));
  
  // Show first 500 chars
  console.log('\nFirst 500 chars of admin.js:');
  console.log(adminJs.body.substring(0, 500));
  
  // 3. Check fetch URLs used
  const fetches = adminJs.body.match(/fetch\([^)]+\)/g);
  console.log('\nAll fetch() calls:');
  if (fetches) fetches.forEach(f => console.log('  ', f));

  // 4. Check api-config.js
  const apiConfig = await fetchText('https://monika-opticals2-henna.vercel.app/api-config.js');
  console.log('\napi-config.js status:', apiConfig.status);
  if (apiConfig.status === 200) {
    console.log('api-config.js content:', apiConfig.body.substring(0, 300));
  }

  // 5. Check if vercel.json took effect
  const vercelJson = await fetchText('https://monika-opticals2-henna.vercel.app/vercel.json');
  console.log('\nvercel.json status:', vercelJson.status);
}

main().catch(console.error);

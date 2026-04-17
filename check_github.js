const https = require('https');
https.get('https://raw.githubusercontent.com/aayush1574/MonikaOpticals2/main/admin.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (data.includes('API_CONFIG')) console.log('✅ GitHub has API_CONFIG');
    else console.log('❌ GitHub is missing API_CONFIG. It is using old code.');
  });
});

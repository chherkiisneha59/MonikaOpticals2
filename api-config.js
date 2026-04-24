const API_CONFIG = (() => {
  const BACKEND_URL = 'https://monikaopticals2-nr5i.onrender.com';
  
  // ═══════════════════════════════════════════════════════════════
  // OWNER CONFIGURATION — Update these when handing over
  // ═══════════════════════════════════════════════════════════════
  const BUSINESS_INFO = {
    email: 'REPLACE_WITH_OWNER_EMAIL',
    adminEmail: 'REPLACE_WITH_OWNER_EMAIL',
    phone: '+91 8109204075',
    whatsapp: '918109204075',
    address: 'Civil Lines, Vidisha, Madhya Pradesh 464001',
    mapsUrl: 'https://maps.google.com/?q=Monika+Opticals+Vidisha'
  };

  return {
    BASE_URL: BACKEND_URL,
    BUSINESS: BUSINESS_INFO,
    api: (path) => `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`,
    imageUrl: (src) => {
      if (!src) return '';
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('images/')) return src;
      return `${BACKEND_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    }
  };
})();

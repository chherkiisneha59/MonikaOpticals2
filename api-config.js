const API_CONFIG = (() => {
  const BACKEND_URL = 'https://monikaopticals2-nr5i.onrender.com';
  return {
    BASE_URL: BACKEND_URL,
    api: (path) => `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`,
    imageUrl: (src) => {
      if (!src) return '';
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('images/')) return src;
      return `${BACKEND_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    }
  };
})();

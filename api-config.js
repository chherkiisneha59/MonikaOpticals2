/* ═══════════════════════════════════════════════════════════════
   API Configuration — Single source of truth for backend URL
   Frontend (Vercel) ↔ Backend (Render) connection
   Version: 4.0 — Direct backend calls (no proxy/rewrite)
   ═══════════════════════════════════════════════════════════════ */

const API_CONFIG = (() => {
  // Backend URL on Render — ALL API calls go directly here
  const BACKEND_URL = 'https://monikaopticals2-1.onrender.com';

  return {
    // Base backend URL (no trailing slash)
    BASE_URL: BACKEND_URL,

    // Full API endpoint builder
    api: (path) => `${BACKEND_URL}${path}`,

    // Build full image URL from a relative path like "/uploads/products/xxx.png"
    // If it's already an absolute URL (https://...), return as-is
    imageUrl: (src) => {
      if (!src) return '';
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('images/')) {
        return src;
      }
      return `${BACKEND_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    }
  };
})();

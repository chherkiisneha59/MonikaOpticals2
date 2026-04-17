/* ═══════════════════════════════════════════════════════════════
   API Configuration — Single source of truth for backend URL
   Frontend (Vercel) ↔ Backend (Render) connection
   ═══════════════════════════════════════════════════════════════ */

const API_CONFIG = (() => {
  // Backend URL on Render
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
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
        return src;
      }
      return `${BACKEND_URL}${src}`;
    }
  };
})();

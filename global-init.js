/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Global UI Initializer
   Populates business info (email, phone, address) across all pages
   from the central API_CONFIG.BUSINESS object.
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const biz = API_CONFIG.BUSINESS;
    if (!biz) return;

    // Update all elements with [data-biz] attribute
    document.querySelectorAll('[data-biz]').forEach(el => {
        const key = el.dataset.biz;
        if (!biz[key]) return;

        if (key === 'email') {
            el.textContent = biz.email;
            if (el.tagName === 'A') el.href = `mailto:${biz.email}`;
            // If it's a span inside a link, we find the parent link
            const parentLink = el.closest('a');
            if (parentLink && parentLink.href.startsWith('mailto:')) {
                parentLink.href = `mailto:${biz.email}`;
            }
        } 
        else if (key === 'phone') {
            el.textContent = biz.phone;
            if (el.tagName === 'A') el.href = `tel:${biz.whatsapp || biz.phone}`;
            const parentLink = el.closest('a');
            if (parentLink && parentLink.href.startsWith('tel:')) {
                parentLink.href = `tel:${biz.whatsapp || biz.phone}`;
            }
        }
        else if (key === 'whatsapp') {
            if (el.tagName === 'A') {
                 // Check if it's a whatsapp link
                 const url = new URL(el.href);
                 if (url.hostname === 'wa.me') {
                    const text = url.searchParams.get('text') || '';
                    el.href = `https://wa.me/${biz.whatsapp}?text=${encodeURIComponent(text)}`;
                 }
            }
        }
        else if (key === 'address') {
            el.textContent = biz.address;
        }
        else if (key === 'maps') {
            if (el.tagName === 'A') el.href = biz.mapsUrl;
        }
    });

    // Special handling for hardcoded WhatsApp links that might not have data-biz
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        const url = new URL(link.href);
        const text = url.searchParams.get('text') || '';
        link.href = `https://wa.me/${biz.whatsapp}?text=${encodeURIComponent(text)}`;
    });
});

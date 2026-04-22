/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Virtual Try-On Logic (IndexSizeError Fix)
   - Robust stick removal that protects thin nose bridges
   - Color-Camera enforcement
   - 2.0x Standardized fit
   ═══════════════════════════════════════════════════════════════ */

const VTO = {
  modal: null, video: null, overlay: null, faceMesh: null,
  stream: null, isActive: false, zoomOffset: 0,

  init() {
    this.modal = document.getElementById('vto-modal');
    this.video = document.getElementById('vto-video');
    this.overlay = document.getElementById('vto-overlay');
    this.loading = document.getElementById('vto-loading');
    this.prodName = document.getElementById('vto-product-name');
    if (!this.modal) return;

    this.faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    this.faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    this.faceMesh.onResults((results) => this.onResults(results));

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn--try-on');
      if (btn) this.open(btn.dataset.img, btn.dataset.vto);
    });
    document.getElementById('vto-close').addEventListener('click', () => this.close());
    document.getElementById('vto-zoom-in').addEventListener('click', () => { this.zoomOffset += 2; });
    document.getElementById('vto-zoom-out').addEventListener('click', () => { this.zoomOffset -= 2; });
  },

  async open(src, name) {
    this.prodName.textContent = name;
    this.loading.style.display = 'block';
    this.loading.textContent = "Adjusting fits...";
    try {
        const processed = await this.processImage(src);
        this.overlay.src = processed;
        this.overlay.style.display = 'none';
        this.modal.classList.add('active');
        this.isActive = true;

        this.stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        this.video.srcObject = this.stream;
        this.video.play();
        this.startTracking();
    } catch (e) { this.close(); }
  },

  startTracking() {
    const loop = async () => {
        if (this.isActive && this.video.readyState >= 2) {
            await this.faceMesh.send({ image: this.video });
        }
        if (this.isActive) requestAnimationFrame(loop);
    };
    loop();
  },

  async processImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;

        // 1. Find the bounds of the entire glasses object
        let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const i = (y * img.width + x) * 4;
            if (data[i] < 242 || data[i+1] < 242 || data[i+2] < 242) {
              if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY) maxY = y;
            }
          }
        }

        // 2. Safe Cropping: Take the middle 66% of the object to remove sticks
        const objW = maxX - minX;
        const objH = maxY - minY;
        if (objW <= 10 || objH <= 10) return resolve(src); // Safety fallback

        const cropX = minX + (objW * 0.17); // 17% crop on left
        const cropW = objW * 0.66;          // Keep center 66%

        const out = document.createElement("canvas");
        out.width = cropW; out.height = objH;
        const octx = out.getContext("2d");
        octx.drawImage(img, cropX, minY, cropW, objH, 0, 0, cropW, objH);

        // 3. Transparent background removal
        const od = octx.getImageData(0, 0, out.width, out.height);
        const p = od.data;
        for (let i = 0; i < p.length; i += 4) {
          if (p[i] > 230 && p[i+1] > 230 && p[i+2] > 230) p[i+3] = 0;
        }
        octx.putImageData(od, 0, 0);
        resolve(out.toDataURL());
      };
      img.src = src;
    });
  },

  onResults(results) {
    if (this.isActive && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const lm = results.multiFaceLandmarks[0];
      const left = lm[468], right = lm[473], nose = lm[6];
      const midX = (left.x + right.x) / 2, midY = nose.y;
      const angle = Math.atan2(right.y - left.y, right.x - left.x) * (180 / Math.PI);
      const dist = Math.sqrt(Math.pow(right.y - left.y, 2) + Math.pow(right.x - left.x, 2));

      // 2.0x Scaled Fit
      const w = (dist * 2.0 * 100) + this.zoomOffset;
      this.overlay.style.left = `${(1 - midX) * 100}%`;
      this.overlay.style.top = `${midY * 100}%`;
      this.overlay.style.width = w + '%';
      this.overlay.style.transform = `translate(-50%, -46%) rotate(${-angle}deg)`;
      this.overlay.style.display = 'block';
      this.loading.style.display = 'none';
    }
  },

  close() {
    this.isActive = false; this.modal.classList.remove('active');
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.video.srcObject = null;
    this.overlay.style.display = 'none';
  }
};
window.addEventListener('load', () => { if (window.FaceMesh) VTO.init(); });

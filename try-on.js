/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Virtual Try-On Logic (Stability Fix)
   - Fail-proof cropping to remove sticks
   - 1.8x Standardized fit
   ═══════════════════════════════════════════════════════════════ */

const VTO = {
  modal: null, video: null, overlay: null, faceMesh: null,
  camera: null, isActive: false, zoomOffset: 0,

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
    this.loading.textContent = "Loading...";
    this.zoomOffset = 0;
    try {
        this.overlay.src = await this.processImage(src);
        this.overlay.style.display = 'none';
        this.modal.classList.add('active');
        this.isActive = true;
        if (!this.camera) {
            this.camera = new Camera(this.video, {
                onFrame: async () => { if (this.isActive) await this.faceMesh.send({ image: this.video }); },
                width: 640, height: 480
            });
        }
        await this.camera.start();
    } catch (e) { this.close(); }
  },

  async processImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;

        // Find actual object bounds
        let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const i = (y * img.width + x) * 4;
            if (data[i] < 240 || data[i+1] < 240 || data[i+2] < 240) {
              if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY) maxY = y;
            }
          }
        }

        // CRAFTED CROP: Take only the middle 65% of the glasses object (removes sticks)
        const objWidth = maxX - minX;
        const objHeight = maxY - minY;
        if (objWidth <= 0 || objHeight <= 0) return resolve(src);

        const cropX = minX + (objWidth * 0.18); 
        const cropWidth = objWidth * 0.64;

        const out = document.createElement("canvas");
        out.width = cropWidth; out.height = objHeight;
        const octx = out.getContext("2d");
        octx.drawImage(img, cropX, minY, cropWidth, objHeight, 0, 0, cropWidth, objHeight);

        // Background removal
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

      // 1.8x Scaling Factor
      const w = (dist * 1.8 * 100) + this.zoomOffset;
      this.overlay.style.left = `${(1 - midX) * 100}%`;
      this.overlay.style.top = `${midY * 100}%`;
      this.overlay.style.width = w + '%';
      this.overlay.style.transform = `translate(-50%, -45%) rotate(${-angle}deg)`;
      this.overlay.style.display = 'block';
      this.loading.style.display = 'none';
    }
  },

  close() {
    this.isActive = false; this.modal.classList.remove('active');
    if (this.camera) this.camera.stop();
    this.overlay.style.display = 'none';
  }
};
window.addEventListener('load', () => { if (window.FaceMesh) VTO.init(); });

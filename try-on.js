/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Virtual Try-On Logic (Master Fit)
   - Intelligent Hinge-Jump detection (Preserves full frames)
   - Real-time Head Rotation & Mirror-Corrected Tilt
   - Optimized Lenskart-style 2.1x scaling
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
    this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.close(); });
  },

  async open(src, name) {
    this.prodName.textContent = name;
    this.loading.style.display = 'block';
    this.loading.textContent = "Analyzing frames...";
    this.zoomOffset = 0;
    try {
        this.overlay.src = await this.intelligentCrop(src);
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
        if (this.isActive && this.video.readyState >= 2) { await this.faceMesh.send({ image: this.video }); }
        if (this.isActive) requestAnimationFrame(loop);
    };
    loop();
  },

  // INTELLIGENT CROP: Finds the "Hinge Jump" to remove sticks but keep 100% of the frame
  async intelligentCrop(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;

        // 1. Calculate Vertical Density for every column X
        const heights = new Array(img.width).fill(0);
        for (let x = 0; x < img.width; x++) {
          for (let y = 0; y < img.height; y++) {
            const i = (y * img.width + x) * 4;
            if (data[i] < 240 || data[i+1] < 240 || data[i+2] < 240) heights[x]++;
          }
        }

        // 2. Find Hinge Jump: Starting from center, look for where height drops SIGNIFICANTLY
        const middle = Math.floor(img.width / 2);
        const centerHeight = heights[middle] || 10;
        let leftLimit = 0, rightLimit = img.width;

        // Scan Left: Stop only when we find a "Stick" (very thin) or nothing
        for (let x = middle; x > 0; x--) {
          if (heights[x] < 5) { leftLimit = x; break; }
          // If height drops to 40% of center height, it's likely the beginning of the stick
          if (heights[x] < centerHeight * 0.4) { leftLimit = x; break; }
        }
        // Scan Right
        for (let x = middle; x < img.width; x++) {
          if (heights[x] < 5) { rightLimit = x; break; }
          if (heights[x] < centerHeight * 0.4) { rightLimit = x; break; }
        }

        const w = rightLimit - leftLimit;
        if (w <= 10) return resolve(src);

        const out = document.createElement("canvas");
        out.width = w; out.height = img.height;
        const octx = out.getContext("2d");
        octx.drawImage(img, leftLimit, 0, w, img.height, 0, 0, w, img.height);
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

      // Rotation Tilt (Angle between eyes)
      // Since video is mirrored, we use the raw angle
      const angle = Math.atan2(right.y - left.y, right.x - left.x) * (180 / Math.PI);
      const dist = Math.sqrt(Math.pow(right.x - left.x, 2) + Math.pow(right.y - left.y, 2));

      const w = (dist * 2.1 * 100) + this.zoomOffset;
      this.overlay.style.left = `${(1 - midX) * 100}%`;
      this.overlay.style.top = `${midY * 100}%`;
      this.overlay.style.width = w + '%';
      
      // ROTATION: Applied with negative angle for mirror correction
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

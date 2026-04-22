/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Virtual Try-On Logic (Color Fix & Pro Fit)
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
    this.loading.textContent = "Processing color stream...";
    this.zoomOffset = 0;
    try {
        this.overlay.src = await this.processImage(src);
        this.overlay.style.display = 'none';
        this.modal.classList.add('active');
        this.isActive = true;

        // Manual Camera Request (Forces Color and User Facing)
        this.stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        this.video.srcObject = this.stream;
        this.video.play();
        
        // Tracking Loop
        this.startTracking();
    } catch (e) { 
        console.error("Camera fail:", e);
        alert("Color camera not found or permission denied.");
        this.close(); 
    }
  },

  startTracking() {
    const loop = async () => {
        if (!this.isActive) return;
        if (this.video.readyState >= 2) {
            await this.faceMesh.send({ image: this.video });
        }
        requestAnimationFrame(loop);
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

        // Calculate heights for stick removal
        const heights = new Array(img.width).fill(0);
        let maxHeight = 0;
        for (let x = 0; x < img.width; x++) {
          for (let y = 0; y < img.height; y++) {
            const i = (y * img.width + x) * 4;
            if (data[i] < 240 || data[i+1] < 240 || data[i+2] < 240) heights[x]++;
          }
          if (heights[x] > maxHeight) maxHeight = heights[x];
        }

        const middle = Math.floor(img.width / 2);
        let left = 0, right = img.width;
        // Aggressive stick removal: anything less than 50% of the lens height is a stick
        for (let x = middle; x > 0; x--) { if (heights[x] < maxHeight * 0.5) { left = x; break; } }
        for (let x = middle; x < img.width; x++) { if (heights[x] < maxHeight * 0.5) { right = x; break; } }

        const w = right - left;
        const out = document.createElement("canvas");
        out.width = w; out.height = img.height;
        const octx = out.getContext("2d");
        octx.drawImage(img, left, 0, w, img.height, 0, 0, w, img.height);
        
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

      // 2.0x Scaling Factor (Balanced Fit)
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

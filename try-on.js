/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Virtual Try-On Logic (Density Radar Fit)
   - Vertical Density Radar to cut thin sticks and keep thick frames
   - 1.9x "Sweet Spot" scaling for perfect realistic fit
   - Nose-bridge anchor with depth correction
   ═══════════════════════════════════════════════════════════════ */

const VTO = {
  modal: null,
  video: null,
  overlay: null,
  faceMesh: null,
  camera: null,
  isActive: false,
  zoomOffset: 0,

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

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults((results) => this.onResults(results));

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn--try-on');
      if (btn) this.open(btn.dataset.img, btn.dataset.vto);
    });

    document.getElementById('vto-close').addEventListener('click', () => this.close());
    document.getElementById('vto-zoom-in').addEventListener('click', (e) => { e.stopPropagation(); this.zoomOffset += 2; });
    document.getElementById('vto-zoom-out').addEventListener('click', (e) => { e.stopPropagation(); this.zoomOffset -= 2; });
    this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.close(); });
  },

  async open(imgSrc, name) {
    this.prodName.textContent = name;
    this.loading.style.display = 'block';
    this.loading.textContent = "Processing frames...";
    this.zoomOffset = 0;
    
    try {
        const finalImg = await this.densityRadarCrop(imgSrc);
        this.overlay.src = finalImg;
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
    } catch (err) {
        console.error("VTO Error", err);
        this.close();
    }
  },

  // DENSITY RADAR: Finds the big lenses and eliminates the thin sticks
  async densityRadarCrop(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // 1. Calculate the "Density" (Height of dark pixels) for every column
        const densities = new Array(img.width).fill(0);
        let maxDensity = 0;
        for (let x = 0; x < img.width; x++) {
          for (let y = 0; y < img.height; y++) {
            const i = (y * img.width + x) * 4;
            if (data[i] < 240 || data[i+1] < 240 || data[i+2] < 240) {
              densities[x]++;
            }
          }
          if (densities[x] > maxDensity) maxDensity = densities[x];
        }

        // 2. Scan from center and stop when density drops (where sticks start)
        const middle = Math.floor(img.width / 2);
        let leftLimit = 0, rightLimit = img.width;

        // Left scan
        for (let x = middle; x > 0; x--) {
          // If the height of the frame suddenly drops below 35% of the lens height, it's a stick!
          if (densities[x] < maxDensity * 0.35) {
            leftLimit = x; break;
          }
        }
        // Right scan
        for (let x = middle; x < img.width; x++) {
          if (densities[x] < maxDensity * 0.35) {
            rightLimit = x; break;
          }
        }

        const finalWidth = rightLimit - leftLimit;
        const outCanvas = document.createElement("canvas");
        const outCtx = outCanvas.getContext("2d");
        outCanvas.width = finalWidth;
        outCanvas.height = img.height;
        outCtx.drawImage(img, leftLimit, 0, finalWidth, img.height, 0, 0, finalWidth, img.height);

        // Remove white
        const outData = outCtx.getImageData(0, 0, finalWidth, img.height);
        const p = outData.data;
        for (let i = 0; i < p.length; i += 4) {
          if (p[i] > 230 && p[i+1] > 230 && p[i+2] > 230) p[i+3] = 0;
        }
        outCtx.putImageData(outData, 0, 0);
        resolve(outCanvas.toDataURL());
      };
      img.src = src;
    });
  },

  onResults(results) {
    if (!this.isActive) return;
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      this.updateGlasses(results.multiFaceLandmarks[0]);
      this.loading.style.display = 'none';
    } else {
      this.overlay.style.display = 'none';
    }
  },

  updateGlasses(landmarks) {
    const leftEye = landmarks[468];
    const rightEye = landmarks[473];
    const noseBridge = landmarks[6];

    const midX = (leftEye.x + rightEye.x) / 2;
    const midY = noseBridge.y;
    const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
    const dist = Math.sqrt(Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2));

    // SCALE: 1.9 is the perfect middle-ground fit
    const width = (dist * 1.9 * 100) + this.zoomOffset; 
    
    this.overlay.style.left = `${(1 - midX) * 100}%`;
    this.overlay.style.top = `${midY * 100}%`;
    this.overlay.style.width = width + '%';
    this.overlay.style.transform = `translate(-50%, -45%) rotate(${-angle}deg)`;
    this.overlay.style.display = 'block';
  },

  close() {
    this.isActive = false;
    this.modal.classList.remove('active');
    if (this.camera) this.camera.stop();
    this.overlay.style.display = 'none';
  }
};

window.addEventListener('load', () => { if (window.FaceMesh) VTO.init(); });

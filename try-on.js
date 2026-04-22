/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Virtual Try-On Logic (Smart Fit)
   - Aggressive auto-crop to remove temples (sticks)
   - Real-world scaling (Lenskart-style 2.2x ratio)
   - Nose bridge anchoring
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
    document.getElementById('vto-zoom-in').addEventListener('click', (e) => { e.stopPropagation(); this.zoomOffset += 5; });
    document.getElementById('vto-zoom-out').addEventListener('click', (e) => { e.stopPropagation(); this.zoomOffset -= 5; });
    this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.close(); });
  },

  async open(originalImgSrc, name) {
    this.prodName.textContent = name;
    this.loading.style.display = 'block';
    this.loading.textContent = "Fitting frames...";
    this.zoomOffset = 0; // Reset
    
    try {
        const finalImg = await this.smartCropGlasses(originalImgSrc);
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

  // SMART CROP: Finds the frame and cuts off the arms/sticks
  async smartCropGlasses(src) {
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

        // 1. Find boundaries of the glasses frame (ignoring white space)
        let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
        
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const i = (y * img.width + x) * 4;
            // If pixel is NOT white (darker frames)
            if (data[i] < 240 || data[i+1] < 240 || data[i+2] < 240) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // 2. Remove the "sticks" (usually at least 15% of the total frame width on each side)
        const frameWidth = maxX - minX;
        const stickCutoff = frameWidth * 0.18; // Aggressive cut
        const finalMinX = minX + stickCutoff;
        const finalMaxX = maxX - stickCutoff;
        const finalWidth = finalMaxX - finalMinX;
        const finalHeight = maxY - minY;

        // 3. Create the final transparent, cropped image
        const outCanvas = document.createElement("canvas");
        const outCtx = outCanvas.getContext("2d");
        outCanvas.width = finalWidth;
        outCanvas.height = finalHeight;

        // Draw cropped portion
        outCtx.drawImage(img, finalMinX, minY, finalWidth, finalHeight, 0, 0, finalWidth, finalHeight);

        // 4. Remove any remaining white
        const outData = outCtx.getImageData(0, 0, finalWidth, finalHeight);
        const pixels = outData.data;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] > 230 && pixels[i+1] > 230 && pixels[i+2] > 230) {
            pixels[i+3] = 0;
          }
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
      this.loading.style.display = 'block';
      this.loading.textContent = "Positioning face...";
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

    // SCALE: Reduced to 2.2 based on real-world face-to-eye ratios
    const width = (dist * 2.2 * 100) + this.zoomOffset; 
    
    this.overlay.style.left = `${(1 - midX) * 100}%`;
    this.overlay.style.top = `${midY * 100}%`;
    this.overlay.style.width = width + '%';
    this.overlay.style.transform = `translate(-50%, -50%) rotate(${-angle}deg)`;
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

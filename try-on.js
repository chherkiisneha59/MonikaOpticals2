/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Virtual Try-On Logic (Stable FaceMesh)
   Now with Automatic Background Removal (White to Transparent)
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
    console.log("VTO: Initializing...");
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
    this.loading.textContent = "Removing background...";
    
    // Process image to remove white background before showing
    try {
        const transparentImg = await this.removeWhiteBackground(originalImgSrc);
        this.overlay.src = transparentImg;
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
        this.loading.textContent = "Opening camera...";
    } catch (err) {
        console.error("VTO: Error", err);
        this.close();
    }
  },

  // NEW FEATURE: Deletes white pixels to make JPGs look like transparent PNGs
  async removeWhiteBackground(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Needed for external images
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Loop through pixels and check for white
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          
          // If pixel is white or very close to white, make it transparent
          if (r > 230 && g > 230 && b > 230) {
            data[i+3] = 0; // Alpha = 0 (Transparent)
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL());
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
      this.loading.textContent = "Position your face...";
      this.overlay.style.display = 'none';
    }
  },

  updateGlasses(landmarks) {
    const leftEye = landmarks[468];
    const rightEye = landmarks[473];
    const midX = (leftEye.x + rightEye.x) / 2;
    const midY = (leftEye.y + rightEye.y) / 2;
    const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
    const dist = Math.sqrt(Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2));

    const width = (dist * 2.8 * 100) + this.zoomOffset; 
    
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
    this.zoomOffset = 0;
  }
};

window.addEventListener('load', () => { if (window.FaceMesh) VTO.init(); });

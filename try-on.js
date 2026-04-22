/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Virtual Try-On Logic (Perfect Fit)
   - Removes side temples (sticks) automatically
   - Anchor to nose bridge for realism
   - Auto-scaling based on face depth
   ═══════════════════════════════════════════════════════════════ */

const VTO = {
  modal: null,
  video: null,
  overlay: null,
  faceMesh: null,
  camera: null,
  isActive: false,
  zoomOffset: 2, // Slight default zoom for better fit

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

    // Handle clicks from dynamic product cards
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn--try-on');
      if (btn) this.open(btn.dataset.img, btn.dataset.vto);
    });

    document.getElementById('vto-close').addEventListener('click', () => this.close());
    document.getElementById('vto-zoom-in').addEventListener('click', (e) => { e.stopPropagation(); this.zoomOffset += 5; });
    document.getElementById('vto-zoom-out').addEventListener('click', (e) => { e.stopPropagation(); this.zoomOffset -= 5; });
    this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.close(); });
  },

  async open(imgSrc, name) {
    this.prodName.textContent = name;
    this.loading.style.display = 'block';
    this.loading.textContent = "Adjusting frames...";
    
    try {
        // Process image: Remove white background AND Crop the side "sticks"
        const finalImg = await this.processGlassesImage(imgSrc);
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
        this.loading.textContent = "Tracking face...";
    } catch (err) {
        console.error("VTO Error", err);
        this.close();
    }
  },

  // NEW LOGIC: Removes white background + Crops 15% from left/right to hide temples
  async processGlassesImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Define crop (remove 15% from left and 15% from right)
        const cropX = img.width * 0.15;
        const cropWidth = img.width * 0.70;
        
        canvas.width = cropWidth;
        canvas.height = img.height;

        // Draw only the center part of the glasses (hides the arms/sticks)
        ctx.drawImage(img, cropX, 0, cropWidth, img.height, 0, 0, cropWidth, img.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 230 && data[i+1] > 230 && data[i+2] > 230) {
            data[i+3] = 0; // Make white transparent
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
      this.overlay.style.display = 'none';
    }
  },

  updateGlasses(landmarks) {
    // Landmark references: 
    // Left Iris: 468, Right Iris: 473
    // Nose Bridge: 6 (Exact spot where glasses sit)
    const leftEye = landmarks[468];
    const rightEye = landmarks[473];
    const noseBridge = landmarks[6];

    // Position X based on center of eyes
    const midX = (leftEye.x + rightEye.x) / 2;
    // Position Y exactly on the nose bridge
    const midY = noseBridge.y;

    // Head tilt
    const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
    
    // Width based on eye distance
    const dist = Math.sqrt(Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2));

    // Flexible scaling: Multiplier adjusted for cropped image (usually higher)
    const width = (dist * 3.5 * 100) + this.zoomOffset; 
    
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

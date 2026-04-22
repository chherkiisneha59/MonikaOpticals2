/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Virtual Try-On Logic (Stable FaceMesh)
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
    console.log("VTO: Initializing Stable Engine...");
    this.modal = document.getElementById('vto-modal');
    this.video = document.getElementById('vto-video');
    this.overlay = document.getElementById('vto-overlay');
    this.loading = document.getElementById('vto-loading');
    this.prodName = document.getElementById('vto-product-name');

    if (!this.modal) return;

    // 1. Initialize FaceMesh
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

    // 2. Event Delegation for Try-On buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn--try-on');
      if (btn) this.open(btn.dataset.img, btn.dataset.vto);
    });

    document.getElementById('vto-close').addEventListener('click', () => this.close());
    
    // Zoom Controls
    document.getElementById('vto-zoom-in').addEventListener('click', (e) => { e.stopPropagation(); this.zoomOffset += 5; });
    document.getElementById('vto-zoom-out').addEventListener('click', (e) => { e.stopPropagation(); this.zoomOffset -= 5; });

    this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.close(); });

    console.log("VTO: Stable Engine Ready");
  },

  async open(imgSrc, name) {
    this.prodName.textContent = name;
    this.overlay.src = imgSrc;
    this.overlay.style.display = 'none';
    this.modal.classList.add('active');
    this.isActive = true;
    this.loading.style.display = 'block';
    this.loading.textContent = "Connecting to camera...";

    try {
      if (!this.camera) {
        this.camera = new Camera(this.video, {
          onFrame: async () => {
            if (this.isActive) await this.faceMesh.send({ image: this.video });
          },
          width: 640,
          height: 480
        });
      }
      await this.camera.start();
    } catch (err) {
      console.error("VTO: Camera error:", err);
      alert("Camera access is required for Virtual Try-On.");
      this.close();
    }
  },

  onResults(results) {
    if (!this.isActive) return;

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      this.updateGlasses(results.multiFaceLandmarks[0]);
      this.loading.style.display = 'none';
    } else {
      this.loading.style.display = 'block';
      this.loading.textContent = "Center your face...";
      this.overlay.style.display = 'none';
    }
  },

  updateGlasses(landmarks) {
    // Indices for eyes in FaceMesh: Left (468), Right (473) for iris
    const leftEye = landmarks[468];
    const rightEye = landmarks[473];

    // Midpoint between eyes
    const midX = (leftEye.x + rightEye.x) / 2;
    const midY = (leftEye.y + rightEye.y) / 2;

    // Angle and distance
    const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
    const dist = Math.sqrt(Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2));

    // Scaling
    const width = (dist * 2.8 * 100) + this.zoomOffset; 
    
    // Applying CSS. Video is mirrored (scaleX -1), so we subtract from 100%
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

// Start
window.addEventListener('load', () => {
    // FaceMesh library should be global
    if (window.FaceMesh) {
        VTO.init();
    } else {
        console.error("VTO: FaceMesh library not found.");
    }
});

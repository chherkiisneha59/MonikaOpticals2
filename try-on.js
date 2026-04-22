/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Virtual Try-On Logic (AI Powered)
   Uses MediaPipe Face Landmarker for Automatic Tracking
   ═══════════════════════════════════════════════════════════════ */

const VTO = {
  modal: null,
  video: null,
  overlay: null,
  faceLandmarker: null,
  runningMode: "VIDEO",
  stream: null,
  lastVideoTime: -1,
  isActive: false,

  async init() {
    this.modal = document.getElementById('vto-modal');
    this.video = document.getElementById('vto-video');
    this.overlay = document.getElementById('vto-overlay');
    this.loading = document.getElementById('vto-loading');
    this.prodName = document.getElementById('vto-product-name');

    // Create Face Landmarker
    const vision = await camvas.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    this.faceLandmarker = await camvas.FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU"
      },
      outputFaceBlendshapes: true,
      runningMode: this.runningMode,
      numFaces: 1
    });

    this.loading.textContent = "Camera Ready. Click Try-On!";

    // Event Delegation for Try-On buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn--try-on');
      if (btn) this.open(btn.dataset.img, btn.dataset.vto);
    });

    document.getElementById('vto-close').addEventListener('click', () => this.close());
    
    // Zoom Controls (Now work as adjustment offsets)
    this.zoomOffset = 0;
    document.getElementById('vto-zoom-in').addEventListener('click', () => this.zoomOffset += 2);
    document.getElementById('vto-zoom-out').addEventListener('click', () => this.zoomOffset -= 2);
  },

  async open(imgSrc, name) {
    this.prodName.textContent = name;
    this.overlay.src = imgSrc;
    this.modal.classList.add('active');
    this.isActive = true;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      this.video.srcObject = this.stream;
      this.video.addEventListener("loadeddata", () => this.predict());
    } catch (err) {
      alert("Camera access denied.");
      this.close();
    }
  },

  async predict() {
    if (!this.isActive) return;

    let startTimeMs = performance.now();
    if (this.lastVideoTime !== this.video.currentTime) {
      this.lastVideoTime = this.video.currentTime;
      const results = this.faceLandmarker.detectForVideo(this.video, startTimeMs);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        this.updateGlasses(results.faceLandmarks[0]);
        this.loading.style.display = 'none';
      } else {
        this.loading.style.display = 'block';
        this.loading.textContent = "Looking for face...";
      }
    }

    requestAnimationFrame(() => this.predict());
  },

  updateGlasses(landmarks) {
    // MediaPipe Indices: Left Pupil (~468), Right Pupil (~473)
    const leftEye = landmarks[468];
    const rightEye = landmarks[473];

    // Calculate center point (midpoint between eyes)
    const midX = (leftEye.x + rightEye.x) / 2;
    const midY = (leftEye.y + rightEye.y) / 2;

    // Calculate rotation (Angle between eyes)
    const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

    // Calculate distance between eyes for scaling
    const dist = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) + 
      Math.pow(rightEye.y - leftEye.y, 2)
    );

    // Apply to overlay
    // We scale based on eye distance. 2.5x is a good starting multiplier for glasses width
    const width = (dist * 2.5 * 100) + this.zoomOffset; 
    
    // Position: 
    // Since video is scaleX(-1) centered, we use (1 - midX) for mirrored X
    this.overlay.style.left = `${(1 - midX) * 100}%`;
    this.overlay.style.top = `${midY * 100}%`;
    this.overlay.style.width = `${width}%`;
    this.overlay.style.transform = `translate(-50%, -50%) rotate(${-angle}deg)`;
    this.overlay.style.display = 'block';
  },

  close() {
    this.isActive = false;
    this.modal.classList.remove('active');
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.video.srcObject = null;
    this.overlay.style.display = 'none';
  }
};

// Use a small helper to handle global namespace of mediapipe
const camvas = {
  FilesetResolver: null,
  FaceLandmarker: null
};

window.addEventListener('load', () => {
    // Wait for the bundle to load
    const checkMP = setInterval(() => {
        if (window.tasksVision) {
            camvas.FilesetResolver = window.tasksVision.FilesetResolver;
            camvas.FaceLandmarker = window.tasksVision.FaceLandmarker;
            VTO.init();
            clearInterval(checkMP);
        }
    }, 100);
});

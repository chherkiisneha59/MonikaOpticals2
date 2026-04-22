/* ═══════════════════════════════════════════════════════════════
   Monika Opticals — Virtual Try-On Logic (AI Powered)
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
  zoomOffset: 0,

  async init() {
    console.log("VTO: Initializing...");
    this.modal = document.getElementById('vto-modal');
    this.video = document.getElementById('vto-video');
    this.overlay = document.getElementById('vto-overlay');
    this.loading = document.getElementById('vto-loading');
    this.prodName = document.getElementById('vto-product-name');

    if (!this.modal) {
        console.error("VTO: Modal element not found!");
        return;
    }

    // Event Delegation for Try-On buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn--try-on');
      if (btn) {
        console.log("VTO: Button clicked for", btn.dataset.vto);
        this.open(btn.dataset.img, btn.dataset.vto);
      }
    });

    document.getElementById('vto-close').addEventListener('click', () => this.close());
    
    // Zoom Controls
    document.getElementById('vto-zoom-in').addEventListener('click', (e) => {
        e.stopPropagation();
        this.zoomOffset += 5;
    });
    document.getElementById('vto-zoom-out').addEventListener('click', (e) => {
        e.stopPropagation();
        this.zoomOffset -= 5;
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Start loading the AI engine in the background
    this.setupAI();
  },

  async setupAI() {
    try {
        const vision = await tasksVision.FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        this.faceLandmarker = await tasksVision.FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
            },
            outputFaceBlendshapes: true,
            runningMode: this.runningMode,
            numFaces: 1
        });
        console.log("VTO: AI Engine Ready");
    } catch (err) {
        console.error("VTO: AI Setup failed:", err);
    }
  },

  async open(imgSrc, name) {
    this.prodName.textContent = name;
    this.overlay.src = imgSrc;
    this.overlay.style.display = 'none'; // hide until face found
    this.modal.classList.add('active');
    this.isActive = true;
    this.loading.style.display = 'block';
    this.loading.textContent = "Opening Camera...";

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 } 
      });
      this.video.srcObject = this.stream;
      this.video.onloadeddata = () => {
          this.loading.textContent = "Hold still, looking for face...";
          this.predict();
      };
    } catch (err) {
      console.error("VTO: Camera error:", err);
      alert("Please allow camera access to use this feature.");
      this.close();
    }
  },

  async predict() {
    if (!this.isActive || !this.faceLandmarker) {
        if (!this.faceLandmarker) {
            console.warn("VTO: AI still loading...");
            setTimeout(() => this.predict(), 500);
        }
        return;
    }

    if (this.lastVideoTime !== this.video.currentTime) {
      this.lastVideoTime = this.video.currentTime;
      const results = this.faceLandmarker.detectForVideo(this.video, performance.now());

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        this.updateGlasses(results.faceLandmarks[0]);
        this.loading.style.display = 'none';
      }
    }

    requestAnimationFrame(() => this.predict());
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
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.video.srcObject = null;
    this.overlay.style.display = 'none';
    this.zoomOffset = 0;
  }
};

// Start
window.addEventListener('load', () => {
    // Check if tasksVision is available
    let attempts = 0;
    const checkInterval = setInterval(() => {
        if (window.tasksVision) {
            VTO.init();
            clearInterval(checkInterval);
        } else if (attempts > 50) {
            console.error("VTO: MediaPipe library (tasksVision) failed to load.");
            clearInterval(checkInterval);
        }
        attempts++;
    }, 100);
});

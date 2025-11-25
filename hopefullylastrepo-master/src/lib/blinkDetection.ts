import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Eye Aspect Ratio (EAR) calculation
export function calculateEAR(landmarks: number[][]): number {
  // Using standard EAR formula for one eye
  // EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
  
  const p1 = landmarks[0];
  const p2 = landmarks[1];
  const p3 = landmarks[2];
  const p4 = landmarks[3];
  const p5 = landmarks[4];
  const p6 = landmarks[5];

  const dist = (a: number[], b: number[]) =>
    Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));

  const vertical1 = dist(p2, p6);
  const vertical2 = dist(p3, p5);
  const horizontal = dist(p1, p4);

  return (vertical1 + vertical2) / (2.0 * horizontal);
}

// MediaPipe Face Landmarks indices for eyes
export const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
export const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

export interface BlinkEvent {
  timestamp: number;
  durationMs: number;
  ear: number;
}

export class BlinkDetector {
  private faceLandmarker: FaceLandmarker | null = null;
  private isInitialized = false;
  private earThreshold = 0.2;  // Will be calibrated
  private isBlinking = false;
  private blinkStartTime = 0;
  private blinkStartEAR = 0;
  private onBlinkCallback?: (event: BlinkEvent) => void;
  private calibrationMode = false;
  private calibrationSamples: number[] = [];
  private readonly CALIBRATION_SAMPLES = 150;  // 5 seconds at 30 FPS

  async initialize() {
    if (this.isInitialized) return;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.isInitialized = true;
      console.log('✅ BlinkDetector initialized with MediaPipe FaceMesh');
    } catch (error) {
      console.error('❌ Failed to initialize BlinkDetector:', error);
      throw error;
    }
  }

  public setBlinkCallback(callback: (event: BlinkEvent) => void) {
    this.onBlinkCallback = callback;
  }

  public setEARThreshold(threshold: number) {
    this.earThreshold = threshold;
  }

  public getEARThreshold(): number {
    return this.earThreshold;
  }

  public startCalibration() {
    this.calibrationMode = true;
    this.calibrationSamples = [];
    console.log('📊 Starting calibration... Keep eyes open and relaxed');
  }

  public finishCalibration(): { threshold: number; avgEAR: number } | null {
    if (this.calibrationSamples.length < 50) {
      console.warn('Not enough calibration samples');
      return null;
    }

    const avgEAR = this.calibrationSamples.reduce((a, b) => a + b, 0) / this.calibrationSamples.length;
    const stdDev = Math.sqrt(
      this.calibrationSamples.reduce((sum, val) => sum + Math.pow(val - avgEAR, 2), 0) / this.calibrationSamples.length
    );

    // Set threshold at 70% of average (conservative for blink detection)
    this.earThreshold = avgEAR * 0.7;
    this.calibrationMode = false;

    console.log(`✅ Calibration complete: AvgEAR=${avgEAR.toFixed(3)}, StdDev=${stdDev.toFixed(3)}, Threshold=${this.earThreshold.toFixed(3)}`);

    return { threshold: this.earThreshold, avgEAR };
  }

  public detectBlink(video: HTMLVideoElement, timestamp: number): { leftEAR: number; rightEAR: number; avgEAR: number } | null {
    if (!this.faceLandmarker || !this.isInitialized) return null;

    try {
      const results = this.faceLandmarker.detectForVideo(video, timestamp);

      if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
        return null;
      }

      const landmarks = results.faceLandmarks[0];

      // Extract eye landmarks
      const leftEyeLandmarks = LEFT_EYE_INDICES.map(idx => [landmarks[idx].x, landmarks[idx].y]);
      const rightEyeLandmarks = RIGHT_EYE_INDICES.map(idx => [landmarks[idx].x, landmarks[idx].y]);

      const leftEAR = calculateEAR(leftEyeLandmarks);
      const rightEAR = calculateEAR(rightEyeLandmarks);
      const avgEAR = (leftEAR + rightEAR) / 2;

      // Calibration mode - collect samples
      if (this.calibrationMode && this.calibrationSamples.length < this.CALIBRATION_SAMPLES) {
        this.calibrationSamples.push(avgEAR);
        return { leftEAR, rightEAR, avgEAR };
      }

      // Blink detection logic
      if (!this.isBlinking && avgEAR < this.earThreshold) {
        // Blink start
        this.isBlinking = true;
        this.blinkStartTime = Date.now();
        this.blinkStartEAR = avgEAR;
      } else if (this.isBlinking && avgEAR >= this.earThreshold) {
        // Blink end
        const blinkDuration = Date.now() - this.blinkStartTime;
        
        // Filter out very short or very long blinks
        if (blinkDuration >= 50 && blinkDuration <= 2000) {
          const blinkEvent: BlinkEvent = {
            timestamp: Date.now(),
            durationMs: blinkDuration,
            ear: this.blinkStartEAR
          };

          this.onBlinkCallback?.(blinkEvent);
        }
        
        this.isBlinking = false;
      }

      return { leftEAR, rightEAR, avgEAR };
    } catch (error) {
      console.error('Error detecting blink:', error);
      return null;
    }
  }

  public isCalibrating(): boolean {
    return this.calibrationMode;
  }

  public getCalibrationProgress(): number {
    return Math.min(100, (this.calibrationSamples.length / this.CALIBRATION_SAMPLES) * 100);
  }

  public destroy() {
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
    }
  }
}

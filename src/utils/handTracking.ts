import { HandLandmark } from '../types';

export interface GestureResults {
  wristX: number; // 0 (left) to 1 (right)
  fingersExtended: boolean[]; // [Thumb, Index, Middle, Ring, Pinky]
  gesture: 'open_palm' | 'closed_fist' | 'rotated_wrist' | 'unknown';
  landmarks: HandLandmark[] | null;
}

export class HandTracker {
  private hands: any = null;
  private camera: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private onResultsCallback: (results: GestureResults) => void = () => {};
  private isTrackerRunning: boolean = false;

  constructor() {
    // Check if MediaPipe is available in window
    if (typeof window !== 'undefined') {
      const Win = window as any;
      if (Win.Hands) {
        this.hands = new Win.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        this.hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        this.hands.onResults((results: any) => {
          this.processResults(results);
        });
      } else {
        console.error('MediaPipe Hands is not loaded yet.');
      }
    }
  }

  public async start(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    onResults: (results: GestureResults) => void
  ): Promise<void> {
    if (this.isTrackerRunning) {
      return;
    }

    this.videoElement = video;
    this.canvasElement = canvas;
    this.onResultsCallback = onResults;

    if (!this.hands) {
      console.error('HandTracker not initialized properly. MediaPipe not found.');
      return;
    }

    try {
      const Win = window as any;
      if (Win.Camera && this.videoElement) {
        this.camera = new Win.Camera(this.videoElement, {
          onFrame: async () => {
            if (this.videoElement && this.isTrackerRunning) {
              await this.hands.send({ image: this.videoElement });
            }
          },
          width: 640,
          height: 480,
        });

        this.isTrackerRunning = true;
        await this.camera.start();
      } else {
        throw new Error('MediaPipe Camera helper not available or video element missing.');
      }
    } catch (err) {
      console.error('Failed to start webcam/tracking:', err);
      throw err;
    }
  }

  public stop(): void {
    this.isTrackerRunning = false;
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    // Clear canvas
    if (this.canvasElement) {
      const ctx = this.canvasElement.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      }
    }
  }

  private processResults(results: any): void {
    if (!this.isTrackerRunning) return;

    const ctx = this.canvasElement?.getContext('2d');
    if (this.canvasElement && ctx) {
      ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

      // Mirror-friendly canvas drawing
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-this.canvasElement.width, 0);

      // Draw the video frame to show the patient's face and hand background
      if (this.videoElement) {
        ctx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
      }

      const Win = window as any;
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Draw landmarks using MediaPipe DrawingUtils if loaded
        if (Win.drawConnectors && Win.drawLandmarks) {
          const handsModule = Win.HAND_CONNECTIONS;
          Win.drawConnectors(ctx, landmarks, handsModule, {
            color: '#10B981', // Emerald green
            lineWidth: 4,
          });
          Win.drawLandmarks(ctx, landmarks, {
            color: '#3B82F6', // Blue
            lineWidth: 2,
            radius: 4,
          });
        }

        ctx.restore();

        // Calculate gesture metrics
        const gestureResults = this.analyzeHand(landmarks);
        this.onResultsCallback(gestureResults);
      } else {
        ctx.restore();
        // No hand detected
        this.onResultsCallback({
          wristX: 0.5,
          fingersExtended: [false, false, false, false, false],
          gesture: 'unknown',
          landmarks: null,
        });
      }
    }
  }

  private analyzeHand(landmarks: any[]): GestureResults {
    // 1. Wrist position (landmark 0)
    // MediaPipe X is 0 to 1. In mirrored mode, x close to 0 is the right of the screen (from user's view, their left)
    // Let's invert x so that physical left corresponds to 0 and right to 1
    const wrist = landmarks[0];
    const wristX = 1 - wrist.x;

    // 2. Identify finger extensions
    // Calculate Euclidean distance between two 3D landmarks
    const getDistance = (p1: any, p2: any) => {
      return Math.sqrt(
        Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2)
      );
    };

    // A finger is considered extended if the distance from TIP to MCP is significantly
    // greater than the distance from PIP to MCP (which stays relatively constant as finger bends).
    // Or simpler/highly reliable: compare Tip-to-Wrist distance vs PIP-to-Wrist distance.
    // Let's use distance of Tip to MCP versus PIP to MCP:
    // Landmarks:
    // Thumb: MCP=2, IP=3, TIP=4
    // Index: MCP=5, PIP=6, DIP=7, TIP=8
    // Middle: MCP=9, PIP=10, DIP=11, TIP=12
    // Ring: MCP=13, PIP=14, DIP=15, TIP=16
    // Pinky: MCP=17, PIP=18, DIP=19, TIP=20

    // Index
    const isIndexExtended = getDistance(landmarks[8], landmarks[5]) > getDistance(landmarks[6], landmarks[5]) * 1.15 && landmarks[8].y < landmarks[6].y + 0.05;
    // Middle
    const isMiddleExtended = getDistance(landmarks[12], landmarks[9]) > getDistance(landmarks[10], landmarks[9]) * 1.15 && landmarks[12].y < landmarks[10].y + 0.05;
    // Ring
    const isRingExtended = getDistance(landmarks[16], landmarks[13]) > getDistance(landmarks[14], landmarks[13]) * 1.15 && landmarks[16].y < landmarks[14].y + 0.05;
    // Pinky
    const isPinkyExtended = getDistance(landmarks[20], landmarks[17]) > getDistance(landmarks[18], landmarks[17]) * 1.15 && landmarks[20].y < landmarks[18].y + 0.05;

    // Thumb is a bit trickier because it moves horizontally.
    // Let's check distance between thumb tip (4) and index MCP (5). If thumb is extended, this distance is larger.
    const thumbIndexDistance = getDistance(landmarks[4], landmarks[5]);
    const mcpDistance = getDistance(landmarks[5], landmarks[17]); // Distance across palm
    const isThumbExtended = thumbIndexDistance > mcpDistance * 0.38 && landmarks[4].y < landmarks[5].y + 0.1;

    const fingersExtended = [
      isThumbExtended,
      isIndexExtended,
      isMiddleExtended,
      isRingExtended,
      isPinkyExtended,
    ];

    // Count how many fingers are extended
    const extendedCount = fingersExtended.filter(Boolean).length;

    // 3. Detect Rotated Wrist (Yellow signal gesture)
    // We can compute the tilt of the hand by analyzing the vector from Wrist (0) to Middle Finger MCP (9).
    // An upright hand has Middle MCP directly above Wrist, so dx (horizontal difference) is close to 0.
    // If hand is rotated or tilted sideways, dx is large relative to dy.
    const dx = landmarks[9].x - landmarks[0].x;
    const dy = landmarks[9].y - landmarks[0].y;
    const tiltRatio = Math.abs(dx) / (Math.abs(dy) || 0.001);
    
    // If the tilt ratio is high (> 0.65), the hand is rotated or tilted significantly.
    const isRotated = tiltRatio > 0.65;

    // 4. Classify Gestures
    let gesture: 'open_palm' | 'closed_fist' | 'rotated_wrist' | 'unknown' = 'unknown';

    if (extendedCount >= 4) {
      if (isRotated) {
        gesture = 'rotated_wrist';
      } else {
        gesture = 'open_palm';
      }
    } else if (extendedCount <= 1) {
      gesture = 'closed_fist';
    } else if (isRotated) {
      gesture = 'rotated_wrist';
    }

    return {
      wristX,
      fingersExtended,
      gesture,
      landmarks: landmarks.map((l: any) => ({ x: l.x, y: l.y, z: l.z })),
    };
  }
}

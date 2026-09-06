import { useState, useEffect, useRef } from 'react';
import { UserProfile, GameSession } from '../types';
import { HandTracker, GestureResults } from '../utils/handTracking';
import {
  Play,
  Pause,
  ArrowLeft,
  Volume2,
  VolumeX,
  Target,
  Sparkles,
  Camera,
  Activity,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface GameScreenProps {
  gameId: 'fruit_catcher' | 'balloon_pop' | 'traffic_signal' | 'finger_match';
  profile: UserProfile;
  onBackToDashboard: () => void;
}

// Simple internal sound synthesis via Web Audio API
class SoundFX {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  constructor() {
    // Lazy initialize to bypass browser autoplay blocks
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public playPop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playCatch() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.setValueAtTime(450, this.ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(600, this.ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playMatch() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }
}

export default function GameScreen({ gameId, profile, onBackToDashboard }: GameScreenProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isGameOver, setIsGameOver] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [soundMuted, setSoundMuted] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    (profile.therapyPreference?.difficulty?.toLowerCase() as 'easy' | 'medium' | 'hard') || 'medium'
  );

  // Active gesture debug output
  const [currentGesture, setCurrentGesture] = useState<string>('Detecting...');
  
  // DOM References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tracking instance ref
  const trackerRef = useRef<HandTracker | null>(null);
  const soundRef = useRef<SoundFX | null>(null);

  // Mutable game-engine metrics (to prevent React stale enclosure in high-freq canvas animation loop)
  const trackerResultsRef = useRef<GestureResults>({
    wristX: 0.5,
    fingersExtended: [false, false, false, false, false],
    gesture: 'unknown',
    landmarks: null
  });

  // Unique Game State references
  const gameStatsRef = useRef({
    score: 0,
    attempts: 0,
    successes: 0,
    isPaused: false,
    timeLeft: 60,
  });

  // Game 1: Fruit Catcher variables
  const fruitsRef = useRef<Array<{ x: number; y: number; speed: number; type: string; color: string; size: number }>>([]);
  const basketXRef = useRef<number>(0.5);

  // Game 2: Balloon Pop variables
  const balloonsRef = useRef<Array<{ x: number; y: number; radius: number; color: string; popProgress: number }>>([]);
  const lastClenchedStateRef = useRef<boolean>(false);

  // Game 3: Traffic Challenge variables
  const signalLightRef = useRef<'green' | 'yellow' | 'red'>('green');
  const signalTimerRef = useRef<number>(4.0); // change light every 4 seconds
  const signalMatchFeedbackRef = useRef<string>(''); // visual "MATCHED" feedback
  const matchDurationSecondsRef = useRef<number>(0);

  // Game 4: Finger Match variables
  const fingerNames = ['Thumb', 'Index Finger', 'Middle Finger', 'Ring Finger', 'Pinky'];
  const targetFingerIndexRef = useRef<number>(1); // start with Index
  const fingerTimerRef = useRef<number>(6.0); // change target finger every 6s

  // Initialize Audio
  if (!soundRef.current) {
    soundRef.current = new SoundFX();
  }

  // Handle Mute
  const toggleMute = () => {
    setSoundMuted(!soundMuted);
    if (soundRef.current) {
      soundRef.current.muted = !soundMuted;
    }
  };

  // 1. Initialize and Start Hand Tracking
  useEffect(() => {
    let active = true;
    trackerRef.current = new HandTracker();

    const startCamera = async () => {
      if (!videoRef.current || !cameraCanvasRef.current) return;
      try {
        setCameraLoading(true);
        setCameraError(null);
        await trackerRef.current?.start(
          videoRef.current,
          cameraCanvasRef.current,
          (results) => {
            if (active) {
              trackerResultsRef.current = results;
              setCurrentGesture(results.gesture === 'unknown' ? 'No clear gesture' : results.gesture.replace('_', ' '));
            }
          }
        );
        setCameraLoading(false);
      } catch (err) {
        console.error(err);
        setCameraError('Webcam access was denied or your device does not have a camera. Please grant camera permission or check connection.');
        setCameraLoading(false);
      }
    };

    startCamera();

    return () => {
      active = false;
      trackerRef.current?.stop();
    };
  }, []);

  // 2. Countdown Timer Loop
  useEffect(() => {
    if (isPaused || isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        gameStatsRef.current.timeLeft = next;
        if (next <= 0) {
          clearInterval(timer);
          handleGameOver();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, isGameOver]);

  const handleGameOver = () => {
    setIsGameOver(true);
    if (trackerRef.current) {
      trackerRef.current.stop();
    }
  };

  const handleSaveAndExit = () => {
    // Create new Game Session record
    const gameNames = {
      fruit_catcher: 'Fruit Catcher',
      balloon_pop: 'Balloon Pop',
      traffic_signal: 'Traffic Signal',
      finger_match: 'Finger Match'
    };

    const newSession: GameSession = {
      id: Math.random().toString(36).substring(2, 9),
      gameId,
      gameName: gameNames[gameId],
      date: new Date().toISOString().split('T')[0],
      score,
      accuracy,
      duration: 60 - timeLeft
    };

    // Save to Local Storage
    const key = `rehab_sessions_${profile.email}`;
    const stored = localStorage.getItem(key);
    let sessionsList: GameSession[] = [];
    if (stored) {
      sessionsList = JSON.parse(stored);
    }
    sessionsList.push(newSession);
    localStorage.setItem(key, JSON.stringify(sessionsList));

    // Return to dashboard
    onBackToDashboard();
  };

  // 3. Main Gameplay loop (HTML5 Canvas rendering & Collision detection)
  useEffect(() => {
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    gameStatsRef.current.isPaused = isPaused;

    // Reset game-specific parameters
    fruitsRef.current = [];
    balloonsRef.current = [];
    signalLightRef.current = 'green';
    signalTimerRef.current = 4.0;
    targetFingerIndexRef.current = 1; // Index finger
    fingerTimerRef.current = 6.0;

    // Seed initial balloons for Balloon Pop depending on difficulty
    if (gameId === 'balloon_pop') {
      const balloonCount = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
      for (let i = 0; i < balloonCount; i++) {
        let baseRadius = 24;
        if (difficulty === 'easy') baseRadius = 36;
        if (difficulty === 'hard') baseRadius = 16;
        balloonsRef.current.push({
          x: Math.random() * (canvas.width - 80) + 40,
          y: Math.random() * (canvas.height - 180) + 60,
          radius: Math.random() * 10 + baseRadius,
          color: ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'][i % 5],
          popProgress: 0,
        });
      }
    }

    const gameLoop = () => {
      if (gameStatsRef.current.isPaused || isGameOver) {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      // Clear Canvas with grid representation
      ctx.fillStyle = '#0F172A'; // Slate-900 background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render futuristic grid lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Get tracker details
      const tracker = trackerResultsRef.current;

      // ----------------------------------------------------
      // GAME 1: FRUIT CATCHER LOOP
      // ----------------------------------------------------
      if (gameId === 'fruit_catcher') {
        // Update Basket X position based on tracked wrist
        // smooth it slightly
        const targetX = tracker.wristX * canvas.width;
        basketXRef.current = basketXRef.current + (targetX - basketXRef.current) * 0.2;

        // Draw Basket with modern therapeutic metallic aesthetic - width varies by difficulty
        const bx = basketXRef.current;
        let bw = 100;
        if (difficulty === 'easy') bw = 140;
        if (difficulty === 'hard') bw = 75;
        const bh = 22;
        const by = canvas.height - 40;

        ctx.fillStyle = '#10B981'; // Emerald Basket Base
        ctx.beginPath();
        ctx.roundRect(bx - bw / 2, by, bw, bh, 8);
        ctx.fill();

        // Basket handle/net
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bx, by + bh, bw / 3, 0, Math.PI);
        ctx.stroke();

        // Spawn fruits - speed varies by difficulty
        if (Math.random() < 0.02 && fruitsRef.current.length < 5) {
          const types = [
            { label: 'Apple', color: '#EF4444', size: 14 },
            { label: 'Orange', color: '#F97316', size: 15 },
            { label: 'Grape', color: '#8B5CF6', size: 12 },
            { label: 'Strawberry', color: '#EC4899', size: 11 },
          ];
          const selected = types[Math.floor(Math.random() * types.length)];
          
          let speedBase = 1.8;
          if (difficulty === 'easy') speedBase = 1.2;
          if (difficulty === 'hard') speedBase = 2.8;

          fruitsRef.current.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: -20,
            speed: Math.random() * 1.5 + speedBase, // responsive speed
            type: selected.label,
            color: selected.color,
            size: selected.size,
          });
        }

        // Move and Collide fruits
        fruitsRef.current.forEach((fruit, idx) => {
          fruit.y += fruit.speed;

          // Draw Fruit
          ctx.fillStyle = fruit.color;
          ctx.beginPath();
          ctx.arc(fruit.x, fruit.y, fruit.size, 0, Math.PI * 2);
          ctx.fill();

          // Leaf or stem
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.ellipse(fruit.x + 2, fruit.y - fruit.size, 4, 2, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          // Check Catch Collision
          if (
            fruit.y + fruit.size >= by &&
            fruit.y - fruit.size <= by + bh &&
            fruit.x >= bx - bw / 2 &&
            fruit.x <= bx + bw / 2
          ) {
            // Caught!
            setScore((s) => s + 2);
            gameStatsRef.current.successes += 1;
            gameStatsRef.current.attempts += 1;
            soundRef.current?.playCatch();

            // Spawn floating score feedback
            ctx.fillStyle = '#10B981';
            ctx.font = 'bold 16px Space Grotesk';
            ctx.fillText('+2', fruit.x - 10, by - 15);

            fruitsRef.current.splice(idx, 1);
          } else if (fruit.y > canvas.height) {
            // Missed!
            gameStatsRef.current.attempts += 1;
            fruitsRef.current.splice(idx, 1);
          }
        });

        // Compute real-time accuracy percentage
        if (gameStatsRef.current.attempts > 0) {
          const acc = Math.round((gameStatsRef.current.successes / gameStatsRef.current.attempts) * 100);
          setAccuracy(acc);
        }
      }

      // ----------------------------------------------------
      // GAME 2: BALLOON POP LOOP
      // ----------------------------------------------------
      else if (gameId === 'balloon_pop') {
        // Target hand cursor is mapped from Wrist X and primary finger y positions
        let hx = canvas.width / 2;
        let hy = canvas.height / 2;

        if (tracker.landmarks && tracker.landmarks.length > 9) {
          // Map landmark 9 (middle knuckle) to canvas coords
          hx = (1 - tracker.landmarks[9].x) * canvas.width;
          hy = tracker.landmarks[9].y * canvas.height;
        } else {
          // Fallback smooth hover
          hx = tracker.wristX * canvas.width;
        }

        // Draw Interactive Reticle
        ctx.strokeStyle = tracker.gesture === 'closed_fist' ? '#EF4444' : '#10B981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hx, hy, 16, 0, Math.PI * 2);
        ctx.stroke();
        // Inner cursor dot
        ctx.fillStyle = tracker.gesture === 'closed_fist' ? '#EF4444' : '#10B981';
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fill();

        // Check Open Palm -> Closed Fist clench event
        const isFist = tracker.gesture === 'closed_fist';
        const transitionToFist = isFist && !lastClenchedStateRef.current;
        lastClenchedStateRef.current = isFist;

        // Draw balloons
        balloonsRef.current.forEach((balloon, idx) => {
          if (balloon.popProgress > 0) {
            // Draw Pop animation ripple
            balloon.popProgress += 1;
            ctx.strokeStyle = balloon.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(balloon.x, balloon.y, balloon.radius * (1 + balloon.popProgress * 0.15), 0, Math.PI * 2);
            ctx.stroke();

            if (balloon.popProgress > 10) {
              // Delete popped balloon, spawn a new one in its place with appropriate size
              let baseRadius = 24;
              if (difficulty === 'easy') baseRadius = 36;
              if (difficulty === 'hard') baseRadius = 16;

              balloonsRef.current[idx] = {
                x: Math.random() * (canvas.width - 80) + 40,
                y: Math.random() * (canvas.height - 180) + 60,
                radius: Math.random() * 10 + baseRadius,
                color: ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 5)],
                popProgress: 0,
              };
            }
            return;
          }

          // Move balloons slightly to animate flotation - drift speed varies by difficulty
          let floatIntensity = 0.25;
          if (difficulty === 'easy') floatIntensity = 0.12;
          if (difficulty === 'hard') floatIntensity = 0.5;
          balloon.y += Math.sin(Date.now() / 1000 + balloon.x) * floatIntensity;

          // Draw Balloon
          ctx.fillStyle = balloon.color;
          ctx.beginPath();
          ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
          ctx.fill();

          // Highlight shine
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.beginPath();
          ctx.arc(balloon.x - balloon.radius * 0.35, balloon.y - balloon.radius * 0.35, balloon.radius * 0.2, 0, Math.PI * 2);
          ctx.fill();

          // Balloon string
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(balloon.x, balloon.y + balloon.radius);
          ctx.quadraticCurveTo(balloon.x - 5, balloon.y + balloon.radius + 15, balloon.x + 2, balloon.y + balloon.radius + 30);
          ctx.stroke();

          // Check Clench hover collision
          const distToHand = Math.sqrt(Math.pow(hx - balloon.x, 2) + Math.pow(hy - balloon.y, 2));
          const isHovered = distToHand <= balloon.radius + 10;

          if (isHovered) {
            // Draw subtle glow
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(balloon.x, balloon.y, balloon.radius + 5, 0, Math.PI * 2);
            ctx.stroke();

            // Pop Trigger condition (transition from Open palm to closed fist)
            if (transitionToFist) {
              balloon.popProgress = 1;
              setScore((s) => s + 2);
              gameStatsRef.current.successes += 1;
              gameStatsRef.current.attempts += 1;
              soundRef.current?.playPop();
            }
          }
        });

        // Compute interactive clenches accuracy
        if (transitionToFist) {
          // If they clenched and missed, attempts rises but successes doesn't.
          // Let's check if any balloon popped from this clench
          const hitAny = balloonsRef.current.some(b => b.popProgress === 1);
          if (!hitAny) {
            gameStatsRef.current.attempts += 1; // missed clench
          }
          const acc = gameStatsRef.current.attempts > 0
            ? Math.round((gameStatsRef.current.successes / gameStatsRef.current.attempts) * 100)
            : 100;
          setAccuracy(Math.min(100, acc));
        }
      }

      // ----------------------------------------------------
      // GAME 3: TRAFFIC SIGNAL CHALLENGE LOOP
      // ----------------------------------------------------
      else if (gameId === 'traffic_signal') {
        signalTimerRef.current -= 1 / 60; // 60 fps decrement
        
        // Timer countdown for traffic lights
        if (signalTimerRef.current <= 0) {
          const lights: Array<'green' | 'yellow' | 'red'> = ['green', 'yellow', 'red'];
          const current = signalLightRef.current;
          let nextLight = current;
          while (nextLight === current) {
            nextLight = lights[Math.floor(Math.random() * lights.length)];
          }
          signalLightRef.current = nextLight;
          
          // Timer duration varies depending on difficulty
          let baseTimer = 4.0;
          if (difficulty === 'easy') baseTimer = 5.5;
          if (difficulty === 'hard') baseTimer = 2.8;

          signalTimerRef.current = Math.random() * 1.5 + baseTimer;
          signalMatchFeedbackRef.current = '';
          matchDurationSecondsRef.current = 0;
        }

        const activeLight = signalLightRef.current;

        // Draw Traffic Light post on the canvas
        const cx = canvas.width / 2;
        const cy = 130;
        
        ctx.fillStyle = '#1E293B'; // dark post body
        ctx.beginPath();
        ctx.roundRect(cx - 50, cy - 80, 100, 190, 20);
        ctx.fill();

        // Pole
        ctx.fillStyle = '#334155';
        ctx.fillRect(cx - 10, cy + 110, 20, canvas.height - cy - 110);

        // Draw the Three lights
        const lightRadius = 22;
        const lightYCoords = [cy - 50, cy + 15, cy + 80];
        const lightColors = {
          red: { active: '#EF4444', dim: '#7F1D1D' },
          yellow: { active: '#F59E0B', dim: '#78350F' },
          green: { active: '#10B981', dim: '#064E3B' }
        };

        // Red light
        ctx.fillStyle = activeLight === 'red' ? lightColors.red.active : lightColors.red.dim;
        ctx.beginPath();
        ctx.arc(cx, lightYCoords[0], lightRadius, 0, Math.PI * 2);
        ctx.fill();
        if (activeLight === 'red') {
          // add subtle glowing effect
          ctx.shadowColor = '#EF4444';
          ctx.shadowBlur = 15;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, lightYCoords[0], lightRadius + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }

        // Yellow light
        ctx.fillStyle = activeLight === 'yellow' ? lightColors.yellow.active : lightColors.yellow.dim;
        ctx.beginPath();
        ctx.arc(cx, lightYCoords[1], lightRadius, 0, Math.PI * 2);
        ctx.fill();
        if (activeLight === 'yellow') {
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 15;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, lightYCoords[1], lightRadius + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Green light
        ctx.fillStyle = activeLight === 'green' ? lightColors.green.active : lightColors.green.dim;
        ctx.beginPath();
        ctx.arc(cx, lightYCoords[2], lightRadius, 0, Math.PI * 2);
        ctx.fill();
        if (activeLight === 'green') {
          ctx.shadowColor = '#10B981';
          ctx.shadowBlur = 15;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, lightYCoords[2], lightRadius + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Define expected gesture for target light
        let expectedGesture = 'unknown';
        let promptText = '';
        if (activeLight === 'green') {
          expectedGesture = 'open_palm';
          promptText = 'Show: OPEN PALM';
        } else if (activeLight === 'yellow') {
          expectedGesture = 'rotated_wrist';
          promptText = 'Show: ROTATED WRIST';
        } else {
          expectedGesture = 'closed_fist';
          promptText = 'Show: CLOSED FIST';
        }

        // Check if user's gesture matches expectation
        const isMatch = tracker.gesture === expectedGesture;

        // Draw Prompts text below the signal
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(promptText, cx, cy + 160);

        // Subtitle instructions
        ctx.fillStyle = '#94A3B8';
        ctx.font = '14px Inter';
        ctx.fillText(`Hold gesture to earn points!`, cx, cy + 185);

        // Success / Progress tracking logic
        if (isMatch) {
          matchDurationSecondsRef.current += 1 / 60;
          
          let requiredHold = 1.0;
          if (difficulty === 'easy') requiredHold = 0.6;
          if (difficulty === 'hard') requiredHold = 1.4;

          // Every required period of holding correct gesture, reward patient
          if (matchDurationSecondsRef.current >= requiredHold) {
            setScore((s) => s + 2);
            gameStatsRef.current.successes += 1;
            gameStatsRef.current.attempts += 1;
            soundRef.current?.playMatch();
            
            signalMatchFeedbackRef.current = 'PERFECT +2!';
            setTimeout(() => {
              signalMatchFeedbackRef.current = '';
            }, 800);

            matchDurationSecondsRef.current = 0; // reset ticks
          }

          // Draw nice feedback
          ctx.fillStyle = '#10B981';
          ctx.font = 'bold 20px Space Grotesk';
          ctx.fillText('MATCHING GESTURE!', cx, cy + 225);
        } else {
          // Decay the progress slightly instead of hard resetting, for better accessibility
          matchDurationSecondsRef.current = Math.max(0, matchDurationSecondsRef.current - 0.003);
        }

        // Draw temporary award points feedback
        if (signalMatchFeedbackRef.current) {
          ctx.fillStyle = '#10B981';
          ctx.font = 'black 28px Space Grotesk';
          ctx.fillText(signalMatchFeedbackRef.current, cx, cy - 110);
        }

        // Periodically update accuracy
        // Since it's continuous, we can calculate correctness ratio of frames when a hand is present
        if (tracker.gesture !== 'unknown') {
          if (isMatch) {
            // increase correctness ratio
            gameStatsRef.current.successes += 0.2; // fraction
          }
          gameStatsRef.current.attempts += 0.2; // denominator
          const acc = Math.round((gameStatsRef.current.successes / gameStatsRef.current.attempts) * 100);
          setAccuracy(Math.max(15, Math.min(100, acc)));
        }
      }

      // ----------------------------------------------------
      // GAME 4: FINGER MATCH LOOP
      // ----------------------------------------------------
      else {
        fingerTimerRef.current -= 1 / 60;

        if (fingerTimerRef.current <= 0) {
          // Choose a new random finger index (0: Thumb, 1: Index, 2: Middle, 3: Ring, 4: Pinky)
          const currentIdx = targetFingerIndexRef.current;
          let nextIdx = currentIdx;
          while (nextIdx === currentIdx) {
            nextIdx = Math.floor(Math.random() * 5);
          }
          targetFingerIndexRef.current = nextIdx;
          
          let baseTimer = 6.0;
          if (difficulty === 'easy') baseTimer = 8.0;
          if (difficulty === 'hard') baseTimer = 4.0;

          fingerTimerRef.current = baseTimer; // timer depending on level
          signalMatchFeedbackRef.current = '';
          matchDurationSecondsRef.current = 0;
        }

        const targetFingerIdx = targetFingerIndexRef.current;
        const targetFingerName = fingerNames[targetFingerIdx];

        // Draw virtual Hand Graphic representing fingers to stretch
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 - 20;

        // Draw Palm boundary
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.arc(cx, cy + 40, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw 5 virtual fingers
        // Angles: Thumb (~170deg), Index (~110deg), Middle (~90deg), Ring (~70deg), Pinky (~20deg)
        const fingerAngles = [
          Math.PI * 1.1, // Thumb
          Math.PI * 0.7, // Index
          Math.PI * 0.5, // Middle
          Math.PI * 0.3, // Ring
          Math.PI * 0.0, // Pinky
        ];

        const fingerColors = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6'];

        // Draw fingers
        for (let i = 0; i < 5; i++) {
          const angle = fingerAngles[i];
          const isTarget = i === targetFingerIdx;
          
          // Compute finger coordinates
          // If extended (or is the target) draw larger, else draw folded/short
          const length = isTarget ? 65 : 35;
          const fx = cx + Math.cos(angle - Math.PI) * 55;
          const fy = cy + 40 + Math.sin(angle - Math.PI) * 55;
          const tx = fx + Math.cos(angle - Math.PI) * length;
          const ty = fy + Math.sin(angle - Math.PI) * length;

          ctx.strokeStyle = isTarget ? fingerColors[i] : '#475569';
          ctx.lineWidth = isTarget ? 14 : 8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          // Highlight circles around the target fingertip
          if (isTarget) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(tx, ty, 6, 0, Math.PI * 2);
            ctx.fill();

            // Glow ring
            ctx.strokeStyle = fingerColors[i];
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(tx, ty, 12, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Instructions text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(`Extend: ${targetFingerName.toUpperCase()}`, cx, cy + 140);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '13px Inter';
        ctx.fillText(
          difficulty === 'easy' 
            ? 'Raise the target finger.'
            : difficulty === 'medium'
              ? 'Raise target finger and try folding others.'
              : 'Raise ONLY this finger and keep others folded.', 
          cx, 
          cy + 165
        );

        // Analyze fingers extended array [Thumb, Index, Middle, Ring, Pinky]
        const fingers = tracker.fingersExtended;
        
        // Success criteria: the target finger is extended.
        const isFingerRaised = fingers[targetFingerIdx];
        
        // Count other fingers raised (to encourage isolation)
        const otherFingersRaisedCount = fingers.filter((val, i) => i !== targetFingerIdx && val).length;
        
        // Dynamic match criteria based on chosen level (Easy is extremely accessible, hard requires perfect isolation)
        let isMatch = false;
        if (difficulty === 'easy') {
          isMatch = isFingerRaised;
        } else if (difficulty === 'medium') {
          isMatch = isFingerRaised && otherFingersRaisedCount <= 2;
        } else {
          isMatch = isFingerRaised && otherFingersRaisedCount <= 1;
        }

        if (isMatch) {
          // Accumulate holding frames
          matchDurationSecondsRef.current += 1 / 60;

          let requiredHold = 0.8;
          if (difficulty === 'easy') requiredHold = 0.4; // super responsive points
          if (difficulty === 'hard') requiredHold = 1.2;

          if (matchDurationSecondsRef.current >= requiredHold) {
            setScore((s) => s + 2);
            gameStatsRef.current.score += 2;
            gameStatsRef.current.successes += 1;
            gameStatsRef.current.attempts += 1;
            soundRef.current?.playMatch();

            signalMatchFeedbackRef.current = 'EXCELLENT! +2';
            setTimeout(() => {
              signalMatchFeedbackRef.current = '';
            }, 1000);

            // Instantly transition to next target finger on success for rewarding feedback loop!
            const currentIdx = targetFingerIndexRef.current;
            let nextIdx = currentIdx;
            while (nextIdx === currentIdx) {
              nextIdx = Math.floor(Math.random() * 5);
            }
            targetFingerIndexRef.current = nextIdx;

            let baseTimer = 6.0;
            if (difficulty === 'easy') baseTimer = 8.0;
            if (difficulty === 'hard') baseTimer = 4.0;
            fingerTimerRef.current = baseTimer;

            matchDurationSecondsRef.current = 0;
          }

          ctx.fillStyle = '#10B981';
          ctx.font = 'bold 20px Space Grotesk';
          ctx.fillText(difficulty === 'easy' ? 'FINGER RAISED!' : 'ISOLATION DETECTED!', cx, cy + 205);
        } else {
          // Decay progress slowly instead of wiping it instantly on a single frame jitter!
          matchDurationSecondsRef.current = Math.max(0, matchDurationSecondsRef.current - 0.003);

          if (isFingerRaised) {
            ctx.fillStyle = '#F59E0B';
            ctx.font = 'bold 15px Space Grotesk';
            ctx.fillText('RAISED! NOW FOLD OTHER FINGERS', cx, cy + 205);
          }
        }

        // Draw temporary score feedback
        if (signalMatchFeedbackRef.current) {
          ctx.fillStyle = '#10B981';
          ctx.font = 'black 28px Space Grotesk';
          ctx.fillText(signalMatchFeedbackRef.current, cx, cy - 35);
        }

        // Periodically update accuracy based on hand isolation checks
        if (tracker.gesture !== 'unknown') {
          if (isMatch) {
            gameStatsRef.current.successes += 0.2;
          }
          gameStatsRef.current.attempts += 0.2;
          const acc = Math.round((gameStatsRef.current.successes / gameStatsRef.current.attempts) * 100);
          setAccuracy(Math.max(20, Math.min(100, acc)));
        }
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPaused, isGameOver, gameId, difficulty]);

  return (
    <div id="gameplay-wrapper" class="min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-colors duration-300 select-none">
      
      {/* GAME SCREEN HEADER CONTAINER */}
      <header class="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Game details and back action */}
        <div class="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <button
            id="game-back-to-dashboard"
            onClick={onBackToDashboard}
            class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Exit to Dashboard
          </button>
          
          <div class="flex items-center gap-4">
            <div>
              <h2 class="text-lg font-black font-display text-white capitalize leading-tight">
                {gameId.replace('_', ' ')}
              </h2>
              <p class="text-[11px] text-slate-400 capitalize">Stage: <span class="text-slate-200 font-semibold">{profile.therapyPreference.difficulty}</span></p>
            </div>

            {/* Level selection buttons */}
            <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
              {(['easy', 'medium', 'hard'] as const).map((level) => {
                const isActive = difficulty === level;
                return (
                  <button
                    key={level}
                    onClick={() => {
                      setDifficulty(level);
                      // Reset session temp scores to give clean start
                      setScore(0);
                      gameStatsRef.current.score = 0;
                      gameStatsRef.current.successes = 0;
                      gameStatsRef.current.attempts = 0;
                      setAccuracy(100);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? level === 'easy'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                          : level === 'medium'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/60'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle: Game KPIs */}
        <div id="game-live-kpi-bar" class="flex gap-4 bg-slate-950/80 px-6 py-2.5 rounded-2xl border border-slate-800/80 w-full md:w-auto justify-around">
          <div class="text-center">
            <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Score</p>
            <h4 class="text-xl font-display font-extrabold text-blue-400 flex items-center justify-center gap-1">
              <Award className="w-4 h-4" /> {score}
            </h4>
          </div>
          <div class="w-px bg-slate-800 self-stretch" />
          <div class="text-center">
            <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Accuracy</p>
            <h4 class="text-xl font-display font-extrabold text-emerald-400 flex items-center justify-center gap-1">
              <Target className="w-4 h-4" /> {accuracy}%
            </h4>
          </div>
          <div class="w-px bg-slate-800 self-stretch" />
          <div class="text-center">
            <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Time Left</p>
            <h4 class="text-xl font-display font-mono font-extrabold text-pink-400 flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" /> {timeLeft}s
            </h4>
          </div>
        </div>

        {/* Right Side: Game controls */}
        <div class="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            id="game-mute-btn"
            onClick={toggleMute}
            class="p-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition cursor-pointer"
            title="Toggle game sounds"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {isPaused ? (
            <button
              id="game-resume-btn"
              onClick={() => setIsPaused(false)}
              class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" /> Resume
            </button>
          ) : (
            <button
              id="game-pause-btn"
              onClick={() => setIsPaused(true)}
              class="px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-yellow-500 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-4 h-4" /> Pause
            </button>
          )}
        </div>
      </header>

      {/* DUAL CANVAS WORKSPACE */}
      <div class="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* GAME SCREEN ZONE */}
        <div class="lg:col-span-8 bg-slate-900 border border-slate-800/80 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center">
          
          {/* Pause overlay */}
          {isPaused && (
            <div id="pause-overlay" class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
              <div class="p-4 bg-yellow-500/10 text-yellow-500 rounded-full mb-4 animate-pulse">
                <Pause className="w-8 h-8" />
              </div>
              <h3 class="text-2xl font-display font-bold text-white mb-2">Therapy Paused</h3>
              <p class="text-sm text-slate-400 max-w-xs text-center leading-relaxed mb-6">
                Take a deep breath to relax your muscles before resuming.
              </p>
              <button
                id="pause-resume-btn"
                onClick={() => setIsPaused(false)}
                class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Resume Routine
              </button>
            </div>
          )}

          {/* HTML5 Canvas viewport */}
          <canvas
            id="game-loop-canvas"
            ref={gameCanvasRef}
            width={640}
            height={440}
            class="w-full h-auto max-h-[500px] rounded-3xl object-contain bg-slate-950"
          />
        </div>

        {/* WEBCAM PREVIEW ZONE */}
        <div class="lg:col-span-4 flex flex-col gap-6">
          <div class="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden flex-1 min-h-[300px]">
            <div>
              <div class="flex justify-between items-center mb-3">
                <h3 class="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-500" /> Web Camera Biofeedback
                </h3>
                {cameraLoading ? (
                  <span class="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold animate-pulse">
                    Initiating AI
                  </span>
                ) : cameraError ? (
                  <span class="text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                    Offline
                  </span>
                ) : (
                  <span class="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold flex items-center gap-1">
                    <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> AI active
                  </span>
                )}
              </div>

              {/* Dual Webcam viewport box - Left = Face Feed, Right = AI Hand landmarks */}
              <div class="relative min-h-[160px]">
                
                {/* Dual split container: Left = Face Feed, Right = AI Hand Landmarks */}
                <div className={`grid grid-cols-2 gap-3 transition-opacity duration-300 ${cameraLoading || cameraError ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                  {/* Panel 1: Face / Player View */}
                  <div class="relative aspect-[4/3] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-end">
                    <video
                      ref={videoRef}
                      class="absolute inset-0 w-full h-full object-cover -scale-x-100"
                      playsInline
                      muted
                      width="640"
                      height="480"
                    />
                    <div class="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] text-slate-300 font-extrabold uppercase tracking-wider z-10 border border-slate-800/60">
                      Player Face
                    </div>
                  </div>

                  {/* Panel 2: AI Hand Detection View */}
                  <div class="relative aspect-[4/3] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-end">
                    <canvas
                      id="camera-overlay-canvas"
                      ref={cameraCanvasRef}
                      width={640}
                      height={480}
                      class="absolute inset-0 w-full h-full object-cover -scale-x-100"
                    />
                    <div class="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider z-10 border border-emerald-950/60">
                      AI Tracking
                    </div>
                  </div>
                </div>

                {/* Overlay loading/error states */}
                {(cameraLoading || cameraError) && (
                  <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-sm rounded-2xl border border-slate-800 z-20">
                    {cameraLoading ? (
                      <>
                        <Activity className="w-8 h-8 text-blue-500 animate-pulse-slow mb-3" />
                        <p class="text-xs font-semibold text-slate-300">Calibrating Hand Tracking Engine...</p>
                        <p class="text-[10px] text-slate-500 mt-1">Please allow camera permissions if requested</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-8 h-8 text-rose-500 mb-3" />
                        <p class="text-xs font-semibold text-slate-300">Camera Interface Blocked</p>
                        <p class="text-[10px] text-slate-500 mt-1">{cameraError}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Gesture recognition output telemetry */}
            <div class="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/50 p-4 rounded-xl">
              <p class="text-[9px] uppercase tracking-wider font-bold text-slate-500">Current Recognized Gesture</p>
              <h4 class="text-lg font-display font-black text-white capitalize mt-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse-slow" /> {currentGesture}
              </h4>
              <div class="mt-3 grid grid-cols-5 gap-1 text-[10px] text-center">
                {['Th', 'Id', 'Md', 'Rg', 'Pk'].map((fName, idx) => {
                  const isExt = trackerResultsRef.current.fingersExtended[idx];
                  return (
                    <div
                      key={fName}
                      class={`py-1.5 rounded font-bold transition ${
                        isExt ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800/40 text-slate-600'
                      }`}
                    >
                      {fName}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GAME OVER SUMMARY DIALOG MODAL */}
      {isGameOver && (
        <div id="game-over-modal" class="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
            {/* Background glowing effects */}
            <div class="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
            <div class="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

            <div class="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 animate-pulse-slow" />
            </div>

            <h3 class="text-3xl font-display font-black text-white leading-tight">Rehab Session Completed</h3>
            <p class="text-xs text-slate-400 mt-2">You completed 1 minute of neuromuscular movement retraining!</p>

            {/* Session Stats Breakdown */}
            <div class="grid grid-cols-2 gap-4 my-8 bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80">
              <div>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Therapy Score</p>
                <h4 class="text-2xl font-display font-extrabold text-blue-400 mt-1">+{score}</h4>
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Accuracy Achieved</p>
                <h4 class="text-2xl font-display font-extrabold text-emerald-400 mt-1">{accuracy}%</h4>
              </div>
            </div>

            <p class="text-xs text-slate-400 leading-relaxed mb-8">
              Great job! These points are credited to your <strong>{profile.fullName}</strong> recovery history, updating your rehabilitation daily goal metrics. Keep repeating these exercises daily!
            </p>

            <button
              id="game-save-and-exit"
              onClick={handleSaveAndExit}
              class="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Save Progress & Return
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

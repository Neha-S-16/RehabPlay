import { Activity, Play, CheckCircle, ShieldCheck, HeartPulse, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div id="landing-container" class="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Hero Section */}
      <div id="hero-section" class="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900 py-20 px-6 sm:px-12">
        <div class="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0))] dark:bg-grid-slate-700/10" />
        
        <div class="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            class="flex items-center justify-center gap-3 mb-6"
          >
            <div class="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <Activity className="w-8 h-8 animate-pulse-slow" />
            </div>
            <span class="text-3xl font-display font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              RehabPlay
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            class="text-4xl sm:text-6xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto"
          >
            Gamified AI Stroke Rehabilitation
            <span class="block text-blue-600 dark:text-blue-400 mt-2">Right From Your Browser</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            class="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            Recover hand, wrist, and finger motor function with real-time webcam gesture-tracking games, patient-focused daily goals, and progress reports.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            class="mt-10 flex flex-wrap justify-center gap-4"
          >
            <button
              id="landing-get-started-btn"
              onClick={() => onNavigate('signup')}
              class="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Free Therapy Session
            </button>
            <button
              id="landing-login-btn"
              onClick={() => onNavigate('login')}
              class="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              Sign In to Profile
            </button>
          </motion.div>

          <div class="mt-16 flex justify-center items-center gap-8 text-slate-500 dark:text-slate-400 text-sm flex-wrap">
            <span class="flex items-center gap-1.5"><ShieldCheck className="w-5 h-5 text-emerald-500" /> No Sensors Required</span>
            <span class="flex items-center gap-1.5"><HeartPulse className="w-5 h-5 text-rose-500" /> Clinic-Approved Exercises</span>
            <span class="flex items-center gap-1.5"><Award className="w-5 h-5 text-blue-500" /> Real-time Hand Biofeedback</span>
          </div>
        </div>
      </div>

      {/* Target Rehabilitation Features */}
      <div id="therapy-features" class="py-20 px-6 sm:px-12 max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-display font-bold text-slate-900 dark:text-white">
            Designed for Progressive Hand & Wrist Recovery
          </h2>
          <p class="mt-4 text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            RehabPlay translates precise physical therapy routines into engaging micro-games.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6 font-bold text-lg">
              01
            </div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Wrist Flexion</h3>
            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Strengthen joint movement and control side-to-side wrist angles with responsive lateral tracking.
            </p>
          </div>

          <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6 font-bold text-lg">
              02
            </div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Grip & Release</h3>
            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Practice fundamental open-palm and closed-fist actions to combat post-stroke spasticity.
            </p>
          </div>

          <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-6 font-bold text-lg">
              03
            </div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Motor Coordination</h3>
            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Improve neuromuscular reaction speed by executing randomized therapeutic poses on demand.
            </p>
          </div>

          <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center mb-6 font-bold text-lg">
              04
            </div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Finger Dexterity</h3>
            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Isolate and activate individual finger movements to stimulate precise cortical reorganization.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Banner / Instructions */}
      <div id="instruction-banner" class="bg-slate-100 dark:bg-slate-800/40 py-16 px-6 sm:px-12">
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white mb-6">
            Clinical-Grade Tech, Simple Setup
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-10">
            <div class="flex gap-4">
              <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white mb-1">1. Setup Webcam</h4>
                <p class="text-xs text-slate-600 dark:text-slate-400">Securely enable webcam access inside your standard browser window.</p>
              </div>
            </div>
            <div class="flex gap-4">
              <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white mb-1">2. Custom Calibration</h4>
                <p class="text-xs text-slate-600 dark:text-slate-400">RehabPlay configures limits adjusted to your level of severity.</p>
              </div>
            </div>
            <div class="flex gap-4">
              <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white mb-1">3. Play & Progress</h4>
                <p class="text-xs text-slate-600 dark:text-slate-400">Track and review daily sessions to witness physical progress over time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

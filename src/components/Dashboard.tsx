import React, { useState, useEffect } from 'react';
import { UserProfile, GameSession } from '../types';
import {
  TrendingUp,
  Activity,
  Award,
  Calendar,
  Sparkles,
  Play,
  LogOut,
  Target,
  User,
  Heart,
  Moon,
  Sun,
  Flame,
  UserCheck,
  Users,
  Settings,
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface DashboardProps {
  profile: UserProfile;
  onLogout: () => void;
  onStartGame: (gameId: 'fruit_catcher' | 'balloon_pop' | 'traffic_signal' | 'finger_match') => void;
  onUpdateProfile?: (profile: UserProfile) => void;
  onSwitchProfile?: (profile: UserProfile) => void;
}

export default function Dashboard({
  profile,
  onLogout,
  onStartGame,
  onUpdateProfile,
  onSwitchProfile
}: DashboardProps) {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'games' | 'progress' | 'profiles'>('games');
  const [chartTimeframe, setChartTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // All registered profiles on this browser
  const [localProfiles, setLocalProfiles] = useState<UserProfile[]>([]);
  
  // Form state for editing active profile
  const [editName, setEditName] = useState(profile.fullName);
  const [editAge, setEditAge] = useState(profile.age);
  const [editGender, setEditGender] = useState(profile.gender || 'Other');
  const [editPhone, setEditPhone] = useState(profile.phone || '');
  const [editAffectedHand, setEditAffectedHand] = useState(profile.strokeDetails.affectedHand);
  const [editSeverity, setEditSeverity] = useState(profile.strokeDetails.severity);
  const [editStrokeDate, setEditStrokeDate] = useState(profile.strokeDetails.dateOfStroke);
  const [editDifficulty, setEditDifficulty] = useState(profile.therapyPreference.difficulty);
  const [editDailyGoal, setEditDailyGoal] = useState(profile.therapyPreference.dailyGoalMinutes);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync edit form state whenever active profile changes
  useEffect(() => {
    setEditName(profile.fullName);
    setEditAge(profile.age);
    setEditGender(profile.gender || 'Other');
    setEditPhone(profile.phone || '');
    setEditAffectedHand(profile.strokeDetails.affectedHand);
    setEditSeverity(profile.strokeDetails.severity);
    setEditStrokeDate(profile.strokeDetails.dateOfStroke);
    setEditDifficulty(profile.therapyPreference.difficulty);
    setEditDailyGoal(profile.therapyPreference.dailyGoalMinutes);
    setSaveSuccess(false);
  }, [profile]);

  // Load user sessions and other registered browser profiles
  useEffect(() => {
    // 1. Load active user sessions
    const key = `rehab_sessions_${profile.email}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setSessions(JSON.parse(stored));
    } else {
      // If demo account, seed default sessions, otherwise start completely clean
      if (profile.email === 'demo@rehabplay.com') {
        const seedData: GameSession[] = [
          { id: '1', gameId: 'fruit_catcher', gameName: 'Fruit Catcher', date: '2026-06-18', score: 32, accuracy: 80, duration: 60 },
          { id: '2', gameId: 'balloon_pop', gameName: 'Balloon Pop', date: '2026-06-19', score: 24, accuracy: 75, duration: 60 },
          { id: '3', gameId: 'traffic_signal', gameName: 'Traffic Signal', date: '2026-06-20', score: 40, accuracy: 88, duration: 60 },
          { id: '4', gameId: 'finger_match', gameName: 'Finger Match', date: '2026-06-21', score: 36, accuracy: 82, duration: 60 },
          { id: '5', gameId: 'fruit_catcher', gameName: 'Fruit Catcher', date: '2026-06-22', score: 44, accuracy: 92, duration: 60 },
          { id: '6', gameId: 'balloon_pop', gameName: 'Balloon Pop', date: '2026-06-23', score: 34, accuracy: 85, duration: 60 },
        ];
        localStorage.setItem(key, JSON.stringify(seedData));
        setSessions(seedData);
      } else {
        setSessions([]);
      }
    }

    // 2. Fetch all registered user profiles on this browser
    const loadedProfiles: UserProfile[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith('rehab_user_')) {
        try {
          const u = JSON.parse(localStorage.getItem(storageKey) || '');
          if (u && u.email) {
            loadedProfiles.push(u);
          }
        } catch (e) {
          // ignore corrupted data
        }
      }
    }
    setLocalProfiles(loadedProfiles);

    // 3. Load dark mode setting
    const isDark = localStorage.getItem('rehab_dark_mode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile.email]);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('rehab_dark_mode', String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleProfileUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;

    const updatedProfile: UserProfile = {
      ...profile,
      fullName: editName,
      age: Number(editAge),
      gender: editGender,
      phone: editPhone,
      strokeDetails: {
        affectedHand: editAffectedHand,
        severity: editSeverity,
        dateOfStroke: editStrokeDate,
      },
      therapyPreference: {
        difficulty: editDifficulty,
        dailyGoalMinutes: Number(editDailyGoal),
      }
    };

    onUpdateProfile(updatedProfile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    // Re-list profiles
    const updatedProfiles = localProfiles.map(p => p.email === profile.email ? updatedProfile : p);
    setLocalProfiles(updatedProfiles);
  };

  const loadSampleData = () => {
    const key = `rehab_sessions_${profile.email}`;
    const seedData: GameSession[] = [
      { id: '1', gameId: 'fruit_catcher', gameName: 'Fruit Catcher', date: '2026-06-18', score: 32, accuracy: 80, duration: 60 },
      { id: '2', gameId: 'balloon_pop', gameName: 'Balloon Pop', date: '2026-06-19', score: 24, accuracy: 75, duration: 60 },
      { id: '3', gameId: 'traffic_signal', gameName: 'Traffic Signal', date: '2026-06-20', score: 40, accuracy: 88, duration: 60 },
      { id: '4', gameId: 'finger_match', gameName: 'Finger Match', date: '2026-06-21', score: 36, accuracy: 82, duration: 60 },
      { id: '5', gameId: 'fruit_catcher', gameName: 'Fruit Catcher', date: '2026-06-22', score: 44, accuracy: 92, duration: 60 },
      { id: '6', gameId: 'balloon_pop', gameName: 'Balloon Pop', date: '2026-06-23', score: 34, accuracy: 85, duration: 60 },
    ];
    localStorage.setItem(key, JSON.stringify(seedData));
    setSessions(seedData);
  };

  const clearSessionHistory = () => {
    const key = `rehab_sessions_${profile.email}`;
    localStorage.removeItem(key);
    setSessions([]);
  };

  // Compute stats
  const totalSessions = sessions.length;
  const totalScore = sessions.reduce((acc, curr) => acc + curr.score, 0);
  const avgAccuracy = totalSessions > 0
    ? Math.round(sessions.reduce((acc, curr) => acc + curr.accuracy, 0) / totalSessions)
    : 0;

  const totalDurationMinutes = Math.round(
    sessions.reduce((acc, curr) => acc + curr.duration, 0) / 60
  );
  
  const dailyGoalMinutes = profile.therapyPreference.dailyGoalMinutes || 20;
  const dailyGoalProgressPercent = Math.min(
    100,
    Math.round((totalDurationMinutes / dailyGoalMinutes) * 100)
  );

  // Personalized Recommendation based on hand setting
  const getPersonalizedRecommendation = () => {
    const hand = profile.strokeDetails.affectedHand;
    if (hand === 'left') {
      return {
        title: 'Left Hand Hemiparesis Focused Routine',
        desc: 'Prioritizing left-side unilateral sensory-motor integration. Optimize webcam position to frame your LEFT side. Start with Fruit Catcher (3 mins) to normalize elbow/wrist angles, followed by Balloon Pop to activate grip extension.',
        tags: ['Left Range of Motion', 'Focal Neuroplasticity']
      };
    } else if (hand === 'right') {
      return {
        title: 'Right Hand Hemiparesis Focused Routine',
        desc: 'Prioritizing right-side neurological pathway activation. Focus on right-arm visual biofeedback. Start with Finger Match (3 mins) to isolate finger flexion, then Traffic Signal Challenge to practice fast-firing cortical reactions.',
        tags: ['Right Lateral Dexterity', 'Fine-Motor Isolation']
      };
    } else {
      return {
        title: 'Bilateral Coordination & Balance Routine',
        desc: 'Prioritizing symmetric hemispheric brain stimulation. We recommend alternating exercises between left and right hands. Utilize Finger Match and Traffic Signal to practice alternating hand configurations.',
        tags: ['Bilateral Balance', 'Symmetric Brain Retraining']
      };
    }
  };

  const recommendation = getPersonalizedRecommendation();

  // Prepare charts
  const dailyChartData = sessions.slice(-6).map((s) => ({
    name: s.date.slice(5), // MM-DD
    Score: s.score,
    Accuracy: s.accuracy,
  }));

  const weeklyChartData = [
    { name: 'Mon', Sessions: totalSessions > 0 ? 1 : 0, Improvement: 45 },
    { name: 'Tue', Sessions: totalSessions > 1 ? 2 : 0, Improvement: 55 },
    { name: 'Wed', Sessions: totalSessions > 2 ? 1 : 0, Improvement: 68 },
    { name: 'Thu', Sessions: totalSessions > 3 ? 1 : 0, Improvement: 72 },
    { name: 'Fri', Sessions: totalSessions > 4 ? 2 : 0, Improvement: 78 },
    { name: 'Sat', Sessions: totalSessions > 5 ? Math.max(1, totalSessions - 5) : 0, Improvement: avgAccuracy || 80 },
    { name: 'Sun', Sessions: 0, Improvement: 82 },
  ];

  const monthlyChartData = [
    { month: 'Jan', RangeOfMotion: 45, ReactionTime: 40, AccuracyTrend: 50 },
    { month: 'Feb', RangeOfMotion: 52, ReactionTime: 48, AccuracyTrend: 58 },
    { month: 'Mar', RangeOfMotion: 60, ReactionTime: 55, AccuracyTrend: 68 },
    { month: 'Apr', RangeOfMotion: 68, ReactionTime: 65, AccuracyTrend: 72 },
    { month: 'May', RangeOfMotion: 74, ReactionTime: 72, AccuracyTrend: 80 },
    { month: 'Jun', RangeOfMotion: 82, ReactionTime: 81, AccuracyTrend: avgAccuracy || 85 },
  ];

  return (
    <div id="dashboard-wrapper" class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Primary Header */}
      <header class="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-blue-600 rounded-xl text-white">
            <Activity class="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span class="text-xl font-display font-black bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              RehabPlay
            </span>
            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Biofeedback Clinic</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          {/* Theme switch */}
          <button
            id="theme-toggle"
            onClick={toggleDarkMode}
            class="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Toggle theme"
          >
            {darkMode ? <Sun class="w-5 h-5 text-amber-400" /> : <Moon class="w-5 h-5 text-indigo-500" />}
          </button>

          {/* Active Profile Quick Badge */}
          <div class="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-slate-800/60 px-4 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-700/30">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center text-white font-extrabold text-sm uppercase shadow-sm">
              {profile.fullName.slice(0, 2)}
            </div>
            <div class="text-left">
              <p class="text-xs font-bold leading-tight">{profile.fullName}</p>
              <p class="text-[9px] text-slate-500 font-bold capitalize">{profile.strokeDetails.affectedHand} Hand • {profile.therapyPreference.difficulty}</p>
            </div>
          </div>

          <button
            id="header-logout-btn"
            onClick={onLogout}
            class="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div class="max-w-7xl mx-auto px-6 py-8">
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR: PROFILE OVERVIEW & VERTICAL NAVIGATION */}
          <div class="lg:col-span-4 space-y-6">
            
            {/* Vertical Navigation Menu */}
            <div id="vertical-navigation-menu" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 p-5 shadow-sm space-y-1.5">
              <div class="px-2 mb-2">
                <span class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                  Rehab Workspace
                </span>
              </div>
              
              <button
                id="tab-games"
                onClick={() => setActiveTab('games')}
                class={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer text-left border ${
                  activeTab === 'games'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                <div class="flex items-center gap-3">
                  <Play class="w-4 h-4 fill-current" />
                  <span>Rehabilitation Games</span>
                </div>
                {activeTab === 'games' && <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
              </button>

              <button
                id="tab-progress"
                onClick={() => setActiveTab('progress')}
                class={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer text-left border ${
                  activeTab === 'progress'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                <div class="flex items-center gap-3">
                  <TrendingUp class="w-4 h-4" />
                  <span>Recovery Progress</span>
                </div>
                {activeTab === 'progress' && <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
              </button>

              <button
                id="tab-profiles"
                onClick={() => setActiveTab('profiles')}
                class={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer text-left border ${
                  activeTab === 'profiles'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                <div class="flex items-center gap-3">
                  <Users class="w-4 h-4" />
                  <span>Patients & Profiles</span>
                </div>
                {activeTab === 'profiles' && <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
              </button>
            </div>

            {/* Quick Summary Profile Card */}
            <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 p-6 shadow-sm">
              <h3 class="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <User class="w-4.5 h-4.5 text-blue-500" /> Patient Card
              </h3>
              
              <div class="flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-850">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-inner">
                  {profile.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 class="text-base font-extrabold text-slate-900 dark:text-white leading-tight">{profile.fullName}</h4>
                  <p class="text-xs text-slate-400">{profile.email}</p>
                  <span class="inline-block mt-2 text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black px-2 py-0.5 rounded uppercase tracking-wider border border-blue-100/20">
                    {profile.therapyPreference.difficulty} Level
                  </span>
                </div>
              </div>

              {/* Physical Clinical Parameters */}
              <div class="grid grid-cols-2 gap-4 py-5 border-b border-slate-100 dark:border-slate-850">
                <div>
                  <p class="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Stroke Severity</p>
                  <p class="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize flex items-center gap-1.5 mt-0.5">
                    <span class={`w-2 h-2 rounded-full ${
                      profile.strokeDetails.severity === 'mild'
                        ? 'bg-emerald-500'
                        : profile.strokeDetails.severity === 'moderate'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                    }`} />
                    {profile.strokeDetails.severity}
                  </p>
                </div>
                <div>
                  <p class="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Affected Hand</p>
                  <p class="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize mt-0.5">
                    {profile.strokeDetails.affectedHand} Side
                  </p>
                </div>
                <div>
                  <p class="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Age / Gender</p>
                  <p class="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                    {profile.age} yrs / {profile.gender}
                  </p>
                </div>
                <div>
                  <p class="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Onset Date</p>
                  <p class="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                    {profile.strokeDetails.dateOfStroke || 'Not Set'}
                  </p>
                </div>
              </div>

              {/* Daily Goal Gauge */}
              <div class="pt-5">
                <div class="flex justify-between items-center mb-1.5">
                  <span class="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Flame class="w-4 h-4 text-orange-500" /> Daily Practice Goal
                  </span>
                  <span class="text-xs font-black text-blue-600 dark:text-blue-400">{totalDurationMinutes} / {dailyGoalMinutes} min</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-blue-600 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${dailyGoalProgressPercent}%` }}
                  />
                </div>
                <p class="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Stroke recovery relies on high-frequency movement. You have reached <strong>{dailyGoalProgressPercent}%</strong> of your daily training schedule today.
                </p>
              </div>
            </div>

            {/* Smart Clinical AI Box */}
            <div class="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden border border-blue-900/30">
              <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />
              
              <div class="flex items-center gap-2 mb-3 bg-white/10 px-2.5 py-1 rounded-full w-fit">
                <Sparkles class="w-3.5 h-3.5 text-blue-300 animate-pulse fill-current" />
                <span class="text-[9px] font-black tracking-widest uppercase text-blue-200">Clinical Recommendation</span>
              </div>

              <h4 class="text-base font-black leading-tight mb-2">{recommendation.title}</h4>
              <p class="text-xs text-slate-300 leading-relaxed mb-4">{recommendation.desc}</p>
              
              <div class="flex flex-wrap gap-1.5">
                {recommendation.tags.map((tag) => (
                  <span key={tag} class="text-[9px] bg-slate-800/80 border border-slate-700/50 px-2 py-0.5 rounded font-bold text-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT VIEWPORT: CHANGED DEPENDING ON ACTIVE TAB */}
          <div class="lg:col-span-8 space-y-6">
            
            {/* Active Patient Context Header */}
            <div class="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="relative flex items-center justify-center">
                  <span class="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute" />
                  <span class="w-3 h-3 bg-emerald-500 rounded-full relative" />
                </div>
                <div class="text-left">
                  <p class="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider leading-none">Active Medical Session</p>
                  <p class="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                    Treating <span class="text-blue-600 dark:text-blue-400 font-black">{profile.fullName}</span>
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-slate-500 dark:text-slate-400">
                  {profile.strokeDetails.affectedHand} Hand Active
                </span>
                <span class="text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl text-blue-600 dark:text-blue-400">
                  {profile.therapyPreference.difficulty} Mode
                </span>
              </div>
            </div>

            {/* -------------------------------------------------------------------- */}
            {/* VIEW 1: REHABILITATION GAMES */}
            {/* -------------------------------------------------------------------- */}
            {activeTab === 'games' && (
              <div class="space-y-6">
                <div>
                  <h3 class="text-xl font-display font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    🎮 Interactive Rehabilitation Games
                  </h3>
                  <p class="text-xs text-slate-500 mt-1">
                    Hold up your hand and mirror your physical range of motion to complete exercises. These games utilize real-time computer vision biofeedback.
                  </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Game 1 */}
                  <div class="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                    <div>
                      <div class="flex justify-between items-start mb-4">
                        <span class="text-[10px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-blue-100/10">
                          Wrist Flexion
                        </span>
                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lateral Movement</span>
                      </div>
                      <h4 class="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition duration-150">
                        Fruit Catcher
                      </h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Retrain wrist horizontal dexterity and lateral balance. Guide the tray left and right by tilting your wrist or forearm horizontally to catch falling medical fruits.
                      </p>
                    </div>
                    <div class="pt-5 border-t border-slate-100 dark:border-slate-850 mt-6 flex items-center justify-between">
                      <span class="text-[10px] font-mono text-slate-400">Duration: <strong>60s</strong></span>
                      <button
                        onClick={() => onStartGame('fruit_catcher')}
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/10 flex items-center gap-1 group-hover:scale-[1.03] transition cursor-pointer"
                      >
                        Launch <ChevronRight class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Game 2 */}
                  <div class="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                    <div>
                      <div class="flex justify-between items-start mb-4">
                        <span class="text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-emerald-100/10">
                          Grip & Release
                        </span>
                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Spasticity Relief</span>
                      </div>
                      <h4 class="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition duration-150">
                        Balloon Pop
                      </h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Exercise clenching and full extensions to combat hand tightness. Hover your cursor over rising balloons and perform a fist open/close squeeze to pop them.
                      </p>
                    </div>
                    <div class="pt-5 border-t border-slate-100 dark:border-slate-850 mt-6 flex items-center justify-between">
                      <span class="text-[10px] font-mono text-slate-400">Duration: <strong>60s</strong></span>
                      <button
                        onClick={() => onStartGame('balloon_pop')}
                        class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-emerald-500/10 flex items-center gap-1 group-hover:scale-[1.03] transition cursor-pointer"
                      >
                        Launch <ChevronRight class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Game 3 */}
                  <div class="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                    <div>
                      <div class="flex justify-between items-start mb-4">
                        <span class="text-[10px] font-black bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-pink-100/10">
                          Cortical Reaction
                        </span>
                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fast Firing</span>
                      </div>
                      <h4 class="text-lg font-black text-slate-900 dark:text-white group-hover:text-pink-500 transition duration-150">
                        Traffic Signal Challenge
                      </h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Speed up motor execution signals. Match the traffic light: hold Open Palm on Green, rotate wrist on Yellow, or lock a Closed Fist on Red within the deadline.
                      </p>
                    </div>
                    <div class="pt-5 border-t border-slate-100 dark:border-slate-850 mt-6 flex items-center justify-between">
                      <span class="text-[10px] font-mono text-slate-400">Duration: <strong>60s</strong></span>
                      <button
                        onClick={() => onStartGame('traffic_signal')}
                        class="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-pink-500/10 flex items-center gap-1 group-hover:scale-[1.03] transition cursor-pointer"
                      >
                        Launch <ChevronRight class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Game 4 */}
                  <div class="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                    <div>
                      <div class="flex justify-between items-start mb-4">
                        <span class="text-[10px] font-black bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-purple-100/10">
                          Finger Isolation
                        </span>
                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fine Motor</span>
                      </div>
                      <h4 class="text-lg font-black text-slate-900 dark:text-white group-hover:text-purple-500 transition duration-150">
                        Finger Match
                      </h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Isolate and stretch individual fingers. Extend ONLY the target finger on screen (such as the index, middle, or thumb) while folding all other fingers to gain score.
                      </p>
                    </div>
                    <div class="pt-5 border-t border-slate-100 dark:border-slate-850 mt-6 flex items-center justify-between">
                      <span class="text-[10px] font-mono text-slate-400">Duration: <strong>60s</strong></span>
                      <button
                        onClick={() => onStartGame('finger_match')}
                        class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-purple-500/10 flex items-center gap-1 group-hover:scale-[1.03] transition cursor-pointer"
                      >
                        Launch <ChevronRight class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* -------------------------------------------------------------------- */}
            {/* VIEW 2: RECOVERY PROGRESS & HISTORIC LOGS */}
            {/* -------------------------------------------------------------------- */}
            {activeTab === 'progress' && (
              <div class="space-y-8">
                
                {/* Stats cards Grid */}
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 p-5 shadow-sm">
                    <div class="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl w-fit mb-3">
                      <Calendar class="w-5 h-5" />
                    </div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sessions</p>
                    <h4 class="text-2xl font-display font-black mt-1 text-slate-800 dark:text-white">{totalSessions}</h4>
                  </div>

                  <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 p-5 shadow-sm">
                    <div class="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit mb-3">
                      <Award class="w-5 h-5" />
                    </div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Points</p>
                    <h4 class="text-2xl font-display font-black mt-1 text-slate-800 dark:text-white">{totalScore}</h4>
                  </div>

                  <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 p-5 shadow-sm">
                    <div class="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit mb-3">
                      <Target class="w-5 h-5" />
                    </div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg Accuracy</p>
                    <h4 class="text-2xl font-display font-black mt-1 text-slate-800 dark:text-white">{avgAccuracy}%</h4>
                  </div>

                  <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 p-5 shadow-sm">
                    <div class="p-2 bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 rounded-xl w-fit mb-3">
                      <TrendingUp class="w-5 h-5" />
                    </div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Met</p>
                    <h4 class="text-2xl font-display font-black mt-1 text-slate-800 dark:text-white">
                      {sessions.length > 0 ? Math.round(avgAccuracy * 0.95) : 0}%
                    </h4>
                  </div>
                </div>

                {/* Progress Charts Box */}
                <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 p-6 shadow-sm">
                  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h3 class="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        📈 Therapeutic Progress Analytics
                      </h3>
                      <p class="text-xs text-slate-500 mt-0.5">Physical biofeedback tracking score trends</p>
                    </div>

                    <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {(['daily', 'weekly', 'monthly'] as const).map((frame) => (
                        <button
                          key={frame}
                          onClick={() => setChartTimeframe(frame)}
                          class={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            chartTimeframe === frame
                              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                          }`}
                        >
                          {frame}
                        </button>
                      ))}
                    </div>
                  </div>

                  {sessions.length === 0 ? (
                    <div class="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <Info class="w-10 h-10 text-slate-400 mb-3" />
                      <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">No Gameplay Sessions Recorded Yet</h4>
                      <p class="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                        Newly registered accounts start with an empty history. Complete your first 60s therapy session in the Games Tab to start logging data!
                      </p>
                      
                      <button
                        onClick={loadSampleData}
                        class="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Load Sample Recovery Chart Data
                      </button>
                    </div>
                  ) : (
                    <div class="h-64 sm:h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartTimeframe === 'daily' ? (
                          <AreaChart data={dailyChartData}>
                            <defs>
                              <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="accColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                            <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                            <YAxis stroke="#94A3B8" fontSize={10} />
                            <Tooltip contentStyle={{ background: '#1E293B', borderRadius: '12px', border: 'none', color: '#F8FAFC', fontSize: '11px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                            <Area type="monotone" name="Game Score" dataKey="Score" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreColor)" />
                            <Area type="monotone" name="Detection Accuracy (%)" dataKey="Accuracy" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#accColor)" />
                          </AreaChart>
                        ) : chartTimeframe === 'weekly' ? (
                          <BarChart data={weeklyChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                            <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                            <YAxis stroke="#94A3B8" fontSize={10} />
                            <Tooltip contentStyle={{ background: '#1E293B', borderRadius: '12px', border: 'none', color: '#F8FAFC', fontSize: '11px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                            <Bar name="Sessions Completed" dataKey="Sessions" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={28} />
                            <Bar name="Recovery Multiplier (%)" dataKey="Improvement" fill="#10B981" radius={[4, 4, 0, 0]} barSize={28} />
                          </BarChart>
                        ) : (
                          <LineChart data={monthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                            <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} />
                            <YAxis stroke="#94A3B8" fontSize={10} />
                            <Tooltip contentStyle={{ background: '#1E293B', borderRadius: '12px', border: 'none', color: '#F8FAFC', fontSize: '11px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                            <Line type="monotone" name="Wrist ROM" dataKey="RangeOfMotion" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" name="Reaction Speed" dataKey="ReactionTime" stroke="#EC4899" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" name="Fine Isolation" dataKey="AccuracyTrend" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Session Log Table */}
                <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 p-6 shadow-sm">
                  <div class="flex items-center justify-between mb-5">
                    <div>
                      <h3 class="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <ClipboardList class="w-4.5 h-4.5 text-blue-500" /> Complete Therapy Logs
                      </h3>
                      <p class="text-xs text-slate-500">Chronological history of active patient's gaming exercises</p>
                    </div>

                    {sessions.length > 0 && (
                      <button
                        onClick={clearSessionHistory}
                        class="text-xs text-rose-500 hover:text-rose-600 font-bold underline cursor-pointer"
                      >
                        Reset My Logs
                      </button>
                    )}
                  </div>

                  {sessions.length === 0 ? (
                    <p class="text-xs text-slate-400 text-center py-6">0 sessions logged for this profile.</p>
                  ) : (
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-xs text-slate-500 dark:text-slate-400">
                        <thead class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-950/60">
                          <tr>
                            <th class="px-4 py-3 rounded-l-xl">Date</th>
                            <th class="px-4 py-3">Exercise Game</th>
                            <th class="px-4 py-3 text-center">Score</th>
                            <th class="px-4 py-3 text-center">Accuracy</th>
                            <th class="px-4 py-3 text-center rounded-r-xl">Duration</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-850">
                          {sessions.map((s, idx) => (
                            <tr key={s.id || idx} class="hover:bg-slate-50 dark:hover:bg-slate-950/30">
                              <td class="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{s.date}</td>
                              <td class="px-4 py-3">
                                <span class="font-bold text-slate-900 dark:text-white">{s.gameName}</span>
                              </td>
                              <td class="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">+{s.score} pts</td>
                              <td class="px-4 py-3 text-center">
                                <span class="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                                  {s.accuracy}%
                                </span>
                              </td>
                              <td class="px-4 py-3 text-center font-mono">{s.duration}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* -------------------------------------------------------------------- */}
            {/* VIEW 3: PATIENT PROFILES & EDIT CONFIG */}
            {/* -------------------------------------------------------------------- */}
            {activeTab === 'profiles' && (
              <div class="space-y-8">
                
                {/* 1. SELECT PROFILE (Browser Accounts List) as requested */}
                <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 p-6 shadow-sm">
                  <div class="mb-5">
                    <h3 class="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Users class="w-4.5 h-4.5 text-blue-500" /> Switch / Select Patient Profile
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">Switch active user session with a single click. Records are safely separated.</p>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localProfiles.map((p) => {
                      const isActive = p.email === profile.email;
                      return (
                        <div
                          key={p.email}
                          class={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
                            isActive
                              ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-500 shadow-sm'
                              : 'bg-slate-50/60 dark:bg-slate-950/10 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div class="flex items-center gap-3">
                            <div class={`w-10 h-10 rounded-xl flex items-center justify-center font-black uppercase text-xs ${
                              isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {p.fullName.slice(0, 2)}
                            </div>
                            <div class="text-left">
                              <h4 class="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                {p.fullName}
                                {isActive && (
                                  <span class="flex items-center gap-0.5 text-[8px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1 rounded">
                                    ACTIVE
                                  </span>
                                )}
                              </h4>
                              <p class="text-[10px] text-slate-400 font-bold">{p.email}</p>
                              <p class="text-[9px] text-slate-500 mt-0.5 capitalize">
                                Hand: <strong class="text-slate-400">{p.strokeDetails.affectedHand}</strong> | Goal: <strong class="text-slate-400">{p.therapyPreference.dailyGoalMinutes}m</strong>
                              </p>
                            </div>
                          </div>

                          {!isActive && onSwitchProfile && (
                            <button
                              onClick={() => onSwitchProfile(p)}
                              class="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-[10px] font-black uppercase rounded-xl transition cursor-pointer"
                            >
                              Switch
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. EDIT ACTIVE PROFILE DETAILS */}
                <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 p-6 shadow-sm">
                  <div class="mb-6">
                    <h3 class="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Settings class="w-4.5 h-4.5 text-blue-500" /> Edit Active Patient Profile Configuration
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">Adjust biological details, stroke details, and training target preferences.</p>
                  </div>

                  <form onSubmit={handleProfileUpdateSubmit} class="space-y-6 text-left">
                    {saveSuccess && (
                      <div class="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-extrabold flex items-center gap-2">
                        <CheckCircle2 class="w-4 h-4" /> Profile configuration updated successfully!
                      </div>
                    )}

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Name */}
                      <div>
                        <label class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Full Name</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Contact Number</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        />
                      </div>

                      {/* Age */}
                      <div>
                        <label class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Age</label>
                        <input
                          type="number"
                          required
                          value={editAge}
                          onChange={(e) => setEditAge(Number(e.target.value))}
                          class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Gender</label>
                        <select
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value)}
                          class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Affected Hand Side */}
                      <div>
                        <label class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Affected Side / Hand</label>
                        <select
                          value={editAffectedHand}
                          onChange={(e) => setEditAffectedHand(e.target.value as 'left' | 'right' | 'both')}
                          class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="left">Left Hand</option>
                          <option value="right">Right Hand</option>
                          <option value="both">Both Hands</option>
                        </select>
                      </div>

                      {/* Stroke Severity */}
                      <div>
                        <label class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Severity Stage</label>
                        <select
                          value={editSeverity}
                          onChange={(e) => setEditSeverity(e.target.value as 'mild' | 'moderate' | 'severe')}
                          class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="mild">Mild</option>
                          <option value="moderate">Moderate</option>
                          <option value="severe">Severe</option>
                        </select>
                      </div>

                      {/* Stroke OnsetDate */}
                      <div>
                        <label class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Date of Stroke Onset</label>
                        <input
                          type="date"
                          value={editStrokeDate}
                          onChange={(e) => setEditStrokeDate(e.target.value)}
                          class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Daily Goal minutes */}
                      <div>
                        <label class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Daily Goal Minutes</label>
                        <input
                          type="number"
                          value={editDailyGoal}
                          onChange={(e) => setEditDailyGoal(Number(e.target.value))}
                          class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Therapy Stage difficulty level */}
                      <div class="md:col-span-2">
                        <label class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Therapy Difficulty Stage</label>
                        <div class="grid grid-cols-3 gap-3">
                          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
                            const isSel = editDifficulty === level;
                            return (
                              <button
                                type="button"
                                key={level}
                                onClick={() => setEditDifficulty(level)}
                                class={`py-2.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer border ${
                                  isSel
                                    ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {level}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    <button
                      type="submit"
                      class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </form>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* Footer info line */}
      <footer class="mt-20 py-8 border-t border-slate-200/50 dark:border-slate-800/80 text-xs text-slate-400 text-center">
        <p>© 2026 RehabPlay – AI Stroke Rehabilitation Gaming & Biofeedback Clinical Workspace.</p>
        <p class="mt-1 text-[10px] text-slate-500">Separated Local Sessions Sandboxed Environment</p>
      </footer>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { UserProfile } from './types';
import LandingPage from './components/LandingPage';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import GameScreen from './components/GameScreen';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'signup' | 'dashboard' | 'game'>('landing');
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [activeGameId, setActiveGameId] = useState<'fruit_catcher' | 'balloon_pop' | 'traffic_signal' | 'finger_match' | null>(null);

  // Restore session from Local Storage on mount
  useEffect(() => {
    const activeEmail = localStorage.getItem('rehab_active_session_email');
    if (activeEmail) {
      const storedProfile = localStorage.getItem(`rehab_user_${activeEmail}`);
      if (storedProfile) {
        setActiveProfile(JSON.parse(storedProfile));
        setView('dashboard');
      }
    }
  }, []);

  const handleSignupSuccess = (profile: UserProfile) => {
    setActiveProfile(profile);
    localStorage.setItem('rehab_active_session_email', profile.email);
    setView('dashboard');
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    setActiveProfile(profile);
    localStorage.setItem('rehab_active_session_email', profile.email);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('rehab_active_session_email');
    setActiveProfile(null);
    setView('landing');
  };

  const handleStartGame = (gameId: 'fruit_catcher' | 'balloon_pop' | 'traffic_signal' | 'finger_match') => {
    setActiveGameId(gameId);
    setView('game');
  };

  const handleBackToDashboard = () => {
    setActiveGameId(null);
    setView('dashboard');
  };

  return (
    <div id="rehabplay-app" class="relative">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage onNavigate={setView} />
          </motion.div>
        )}

        {view === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SignupPage onSignupSuccess={handleSignupSuccess} onNavigate={setView} />
          </motion.div>
        )}

        {view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={setView} />
          </motion.div>
        )}

        {view === 'dashboard' && activeProfile && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard
              profile={activeProfile}
              onLogout={handleLogout}
              onStartGame={handleStartGame}
              onUpdateProfile={(updated) => {
                setActiveProfile(updated);
                localStorage.setItem(`rehab_user_${updated.email}`, JSON.stringify(updated));
              }}
              onSwitchProfile={(newProfile) => {
                setActiveProfile(newProfile);
                localStorage.setItem('rehab_active_session_email', newProfile.email);
              }}
            />
          </motion.div>
        )}

        {view === 'game' && activeProfile && activeGameId && (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <GameScreen
              gameId={activeGameId}
              profile={activeProfile}
              onBackToDashboard={handleBackToDashboard}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

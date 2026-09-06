import React, { useState } from 'react';
import { UserProfile, AffectedHand, StrokeSeverity, DifficultyLevel } from '../types';
import { User, ShieldAlert, Heart, ArrowRight, ArrowLeft } from 'lucide-react';

interface SignupPageProps {
  onSignupSuccess: (profile: UserProfile) => void;
  onNavigate: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export default function SignupPage({ onSignupSuccess, onNavigate }: SignupPageProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number>(55);
  const [gender, setGender] = useState('Male');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [affectedHand, setAffectedHand] = useState<AffectedHand>('right');
  const [severity, setSeverity] = useState<StrokeSeverity>('moderate');
  const [dateOfStroke, setDateOfStroke] = useState(new Date().toISOString().split('T')[0]);

  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');

  const [errorMsg, setErrorMsg] = useState('');

  const validateStep1 = () => {
    if (!fullName.trim()) return 'Full Name is required.';
    if (!email.trim() || !email.includes('@')) return 'Enter a valid email address.';
    if (!phone.trim()) return 'Phone number is required.';
    if (!password) return 'Password is required.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleNextStep = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setErrorMsg(err);
        return;
      }
    }
    setErrorMsg('');
    setStep((prev) => (prev + 1) as 1 | 2 | 3);
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const step1Err = validateStep1();
    if (step1Err) {
      setStep(1);
      setErrorMsg(step1Err);
      return;
    }

    if (!dateOfStroke) {
      setErrorMsg('Please specify the date of stroke.');
      return;
    }

    const profile: UserProfile = {
      fullName,
      age: Number(age),
      gender,
      email,
      phone,
      strokeDetails: {
        affectedHand,
        severity,
        dateOfStroke,
      },
      therapyPreference: {
        dailyGoalMinutes: Number(dailyGoalMinutes),
        difficulty,
      },
    };

    // Save profile and credentials in Local Storage
    localStorage.setItem(`rehab_user_${email}`, JSON.stringify(profile));
    localStorage.setItem(`rehab_pwd_${email}`, password);
    // Auto-login or navigate
    onSignupSuccess(profile);
  };

  return (
    <div id="signup-container" class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 transition-colors duration-300">
      <div class="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 sm:p-10 relative overflow-hidden">
        {/* Dynamic header background ribbon */}
        <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-emerald-400 to-emerald-500" />
        
        <div class="mb-8 text-center">
          <h2 class="text-3xl font-display font-extrabold text-slate-900 dark:text-white">
            Create Rehabilitation Profile
          </h2>
          <p class="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Step {step} of 3: {step === 1 ? 'Personal Details' : step === 2 ? 'Clinical Diagnosis' : 'Therapy Configuration'}
          </p>

          {/* Step Progress Bar */}
          <div class="flex items-center justify-center gap-2 mt-4">
            <span class={`h-2 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`} />
            <span class={`h-2 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`} />
            <span class={`h-2 rounded-full transition-all duration-300 ${step >= 3 ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`} />
          </div>
        </div>

        {errorMsg && (
          <div id="signup-error" class="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-sm font-medium flex gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-6">
          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <div id="signup-step-1" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Full Name
                </label>
                <div class="relative">
                  <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    id="signup-name-input"
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    class="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Age
                  </label>
                  <input
                    id="signup-age-input"
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Gender
                  </label>
                  <select
                    id="signup-gender-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  id="signup-email-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Phone Number
                </label>
                <input
                  id="signup-phone-input"
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Password
                  </label>
                  <input
                    id="signup-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    id="signup-confirm-input"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: STROKE DETAILS */}
          {step === 2 && (
            <div id="signup-step-2" class="space-y-6">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Which hand is affected?
                </label>
                <div class="grid grid-cols-3 gap-3">
                  {(['left', 'right', 'both'] as AffectedHand[]).map((hand) => (
                    <button
                      key={hand}
                      type="button"
                      onClick={() => setAffectedHand(hand)}
                      class={`px-4 py-4 rounded-xl border font-semibold text-sm transition-all text-center capitalize cursor-pointer ${
                        affectedHand === hand
                          ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {hand === 'both' ? 'Both' : `${hand} Hand`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Stroke Severity
                </label>
                <div class="grid grid-cols-3 gap-3">
                  {(['mild', 'moderate', 'severe'] as StrokeSeverity[]).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      class={`px-4 py-4 rounded-xl border font-semibold text-sm transition-all text-center capitalize cursor-pointer ${
                        severity === sev
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Date of Stroke
                </label>
                <input
                  id="signup-stroke-date"
                  type="date"
                  required
                  value={dateOfStroke}
                  onChange={(e) => setDateOfStroke(e.target.value)}
                  class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* STEP 3: THERAPY PREFERENCE */}
          {step === 3 && (
            <div id="signup-step-3" class="space-y-6">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex justify-between">
                  <span>Daily Exercise Goal (Minutes)</span>
                  <span class="text-blue-600 font-bold">{dailyGoalMinutes} min</span>
                </label>
                <input
                  id="signup-goal-range"
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                  class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div class="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>5 mins</span>
                  <span>30 mins</span>
                  <span>60 mins</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Therapy Difficulty Level
                </label>
                <div class="grid grid-cols-3 gap-3">
                  {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      class={`px-4 py-4 rounded-xl border font-semibold text-sm transition-all text-center capitalize cursor-pointer ${
                        difficulty === level
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                  *Recommended: <strong>Beginner</strong> for patients in the early stages of recovery to maximize rehabilitation accuracy.
                </p>
              </div>

              <div class="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex gap-3 text-emerald-800 dark:text-emerald-300">
                <Heart className="w-5 h-5 shrink-0 mt-0.5" />
                <p class="text-xs leading-relaxed">
                  Your calibration targets and game elements will be optimized based on your preference and diagnostic data.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div class="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {step > 1 && (
              <button
                id="signup-back-btn"
                type="button"
                onClick={handlePrevStep}
                class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}

            {step < 3 ? (
              <button
                id="signup-next-btn"
                type="button"
                onClick={handleNextStep}
                class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="signup-submit-btn"
                type="submit"
                class="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Complete Registration <Heart className="w-4 h-4 fill-current" />
              </button>
            )}
          </div>
        </form>

        <div class="mt-6 text-center">
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <button
              id="signup-signin-link"
              type="button"
              onClick={() => onNavigate('login')}
              class="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

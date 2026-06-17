import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const LandingPage = lazy(() => import('./components/LandingPage'));
const Auth = lazy(() => import('./components/Auth'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Workouts = lazy(() => import('./components/Workouts'));
const ExerciseLibrary = lazy(() => import('./components/ExerciseLibrary'));
const AICoach = lazy(() => import('./components/AICoach'));
import { cmToFtIn, ftInToCm, kgToLbs, lbsToKg } from './utils/healthCalculators';
import {
  LayoutDashboard,
  Activity,
  BookOpen,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Settings,
  Sun,
  Moon
} from 'lucide-react';

function AppContent() {
  const { user, profile, updateProfile, signOut, loading } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'workouts' | 'library' | 'coach' | 'settings'
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [viewAuth, setViewAuth] = useState(false); // Public routes: false = Landing, true = Login

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }, [theme]);

  // Profile Form States
  const [profName, setProfName] = useState('');
  const [profAge, setProfAge] = useState('');
  const [profGender, setProfGender] = useState('male');
  const [profGoal, setProfGoal] = useState('');
  const [profInjuries, setProfInjuries] = useState('');
  const [profActivity, setProfActivity] = useState('');
  const [profUnits, setProfUnits] = useState('metric');
  
  const [profWeight, setProfWeight] = useState('');
  const [profHeightCm, setProfHeightCm] = useState('');
  const [profHeightFt, setProfHeightFt] = useState('');
  const [profHeightIn, setProfHeightIn] = useState('');
  const [isProfFormLoaded, setIsProfFormLoaded] = useState(false);

  // Initialize profile form values when entering Settings tab
  const loadProfileToForm = () => {
    if (!profile) return;
    setProfName(profile.name || '');
    setProfAge(profile.age?.toString() || '');
    setProfGender(profile.gender || 'male');
    setProfGoal(profile.goal || '');
    setProfInjuries(profile.injuries || 'None');
    setProfActivity(profile.activity_level || 'moderate');
    setProfUnits(profile.unit_system || 'metric');

    if (profile.unit_system === 'imperial') {
      setProfWeight(kgToLbs(profile.weight_kg));
      const { feet, inches } = cmToFtIn(profile.height_cm);
      setProfHeightFt(feet.toString());
      setProfHeightIn(inches.toString());
    } else {
      setProfWeight(profile.weight_kg.toString());
      setProfHeightCm(profile.height_cm.toString());
    }
    setIsProfFormLoaded(true);
  };

  const handleProfileUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalWeight = parseFloat(profWeight);
      let finalHeight = parseFloat(profHeightCm);

      if (profUnits === 'imperial') {
        finalWeight = parseFloat(lbsToKg(profWeight));
        finalHeight = ftInToCm(parseInt(profHeightFt), parseInt(profHeightIn));
      }

      await updateProfile({
        name: profName,
        age: parseInt(profAge),
        gender: profGender,
        goal: profGoal,
        injuries: profInjuries,
        activity_level: profActivity,
        unit_system: profUnits,
        weight_kg: finalWeight,
        height_cm: finalHeight,
        protein_goal_grams: finalWeight * 1.0 > 80 ? Math.round(finalWeight * 1.2) : 80,
      });

      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error updating profile.');
    }
  };

  const handleUnitChange = (newUnit) => {
    if (newUnit === profUnits) return;
    setProfUnits(newUnit);

    // Convert existing input values on the fly to prevent resetting user data!
    if (newUnit === 'imperial') {
      // Metric -> Imperial
      const currentWt = parseFloat(profWeight) || 0;
      const currentHt = parseFloat(profHeightCm) || 0;
      setProfWeight(kgToLbs(currentWt));
      const { feet, inches } = cmToFtIn(currentHt);
      setProfHeightFt(feet.toString());
      setProfHeightIn(inches.toString());
    } else {
      // Imperial -> Metric
      const currentWtLbs = parseFloat(profWeight) || 0;
      const currentHtCm = ftInToCm(parseInt(profHeightFt) || 0, parseInt(profHeightIn) || 0);
      setProfWeight(lbsToKg(currentWtLbs));
      setProfHeightCm(currentHtCm.toString());
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-xs font-mono">Syncing credentials & profile...</p>
      </div>
    );
  }

  // ─── PUBLIC ROUTES ─────────────────────────────────────────────────────────
  if (!user) {
    if (viewAuth) {
      return (
        <div className="relative">
          <button
            onClick={() => setViewAuth(false)}
            className="absolute top-6 left-6 text-slate-400 hover:text-white text-xs font-bold bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl transition-all cursor-pointer z-50"
          >
            ← Back to Home
          </button>
          <Suspense fallback={
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
              <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-xs font-mono">Loading authentication...</p>
            </div>
          }>
            <Auth />
          </Suspense>
        </div>
      );
    }
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-xs font-mono">Loading homepage...</p>
        </div>
      }>
        <LandingPage onGetStarted={() => setViewAuth(true)} />
      </Suspense>
    );
  }

  // ─── AUTHENTICATED ROUTES (WORKSPACE SHELL) ────────────────────────────────
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workouts', label: 'Workouts', icon: Activity },
    { id: 'library', label: 'Exercise Library', icon: BookOpen },
    { id: 'coach', label: 'AI Coach', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Header Branding */}
          <div className="p-6 flex items-center justify-between border-b border-slate-850">
            <div className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
                <Activity className="h-4 w-4" />
              </span>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">RecoverFit</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="text-slate-400 hover:text-slate-200 p-2 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-850 transition-all cursor-pointer flex items-center justify-center"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden text-slate-400 hover:text-white cursor-pointer"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Nav Links */}
          <nav className={`p-4 space-y-1 ${showMobileMenu ? 'block' : 'hidden md:block'}`}>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowMobileMenu(false);
                    if (item.id === 'coach') {
                      try {
                        localStorage.setItem('coach_consulted', 'true');
                      } catch (e) {}
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <IconComponent className="h-4.5 w-4.5" />
                  {item.label}
                </button>
              );
            })}
            
            <button
              onClick={() => {
                setActiveTab('settings');
                loadProfileToForm();
                setShowMobileMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
              Profile Settings
            </button>
          </nav>
        </div>

        {/* Footer User Info */}
        <div className={`p-4 border-t border-slate-850 space-y-3 ${showMobileMenu ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-slate-950 flex items-center justify-center font-bold text-slate-400 border border-slate-850">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-200 truncate">{profile?.name || 'Athlete'}</div>
              <div className="text-[9px] text-slate-500 truncate">{user.email}</div>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to sign out?')) signOut();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)] w-full text-slate-400">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-mono">Loading view...</p>
          </div>
        }>
          {activeTab === 'dashboard' && (
            <Dashboard
              onStartWorkout={() => setActiveTab('workouts')}
              setActiveTab={setActiveTab}
            />
          )}
          
          {activeTab === 'workouts' && <Workouts />}
          
          {activeTab === 'library' && <ExerciseLibrary />}
          
          {activeTab === 'coach' && <AICoach />}

          {activeTab === 'settings' && (
            <div className="space-y-6 page-fade-in text-left">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Profile Settings</h1>
                <p className="text-slate-400 text-xs">Manage your goals, weight/height metrics, and injuries context.</p>
              </div>

              <form onSubmit={handleProfileUpdateSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                
                <div className="flex justify-between items-center pb-4 border-b border-slate-850">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Measurement System</span>
                  <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-850 flex">
                    <button
                      type="button"
                      onClick={() => handleUnitChange('metric')}
                      className={`px-3 py-1 text-[10px] rounded-md font-bold transition-all ${profUnits === 'metric' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      India (Metric)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnitChange('imperial')}
                      className={`px-3 py-1 text-[10px] rounded-md font-bold transition-all ${profUnits === 'imperial' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      USA (Imperial)
                    </button>
                  </div>
                </div>

                {/* Name & Age Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Age (Years)</label>
                    <input
                      type="number"
                      required
                      value={profAge}
                      onChange={(e) => setProfAge(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Physical Metrics Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Weight ({profUnits === 'metric' ? 'kg' : 'lbs'})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={profWeight}
                      onChange={(e) => setProfWeight(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Height</label>
                    {profUnits === 'metric' ? (
                      <input
                        type="number"
                        required
                        value={profHeightCm}
                        onChange={(e) => setProfHeightCm(e.target.value)}
                        placeholder="cm"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none"
                      />
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          required
                          value={profHeightFt}
                          onChange={(e) => setProfHeightFt(e.target.value)}
                          placeholder="ft"
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-xs focus:outline-none text-center"
                        />
                        <input
                          type="number"
                          required
                          value={profHeightIn}
                          onChange={(e) => setProfHeightIn(e.target.value)}
                          placeholder="in"
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-xs focus:outline-none text-center"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Goal & Injury Concerns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Goal</label>
                    <select
                      value={profGoal}
                      onChange={(e) => setProfGoal(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs focus:outline-none"
                    >
                      <option value="Fat Loss + Endurance">Fat Loss + Endurance</option>
                      <option value="Muscle Building">Muscle Building</option>
                      <option value="Endurance Running">Endurance Running</option>
                      <option value="General Health">General Health / Active Recovery</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Injury Concerns</label>
                    <select
                      value={profInjuries}
                      onChange={(e) => setProfInjuries(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs focus:outline-none"
                    >
                      <option value="Shin/Calf Pain">Shin / Calf Pain</option>
                      <option value="Knee Pain">Knee Pain</option>
                      <option value="Lower Back Pain">Lower Back Pain</option>
                      <option value="Shoulder Pain">Shoulder Pain</option>
                      <option value="Ankle/Foot Pain">Ankle / Foot Pain</option>
                      <option value="Elbow/Wrist Pain">Elbow / Wrist Pain</option>
                      <option value="Hip/Groin Pain">Hip / Groin Pain</option>
                      <option value="Neck/Upper Back Pain">Neck / Upper Back Pain</option>
                      <option value="None">None - Fit & Pain-Free</option>
                    </select>
                  </div>
                </div>

                {/* Activity Level */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daily Activity Level</label>
                  <select
                    value={profActivity}
                    onChange={(e) => setProfActivity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs focus:outline-none"
                  >
                    <option value="sedentary">Sedentary (desk job, low physical activity)</option>
                    <option value="light">Light Active (daily walks, active standing)</option>
                    <option value="moderate">Moderately Active (workouts 3-5 days/week)</option>
                    <option value="active">Very Active (heavy workouts 6-7 days/week)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/10 cursor-pointer text-xs uppercase tracking-wider"
                >
                  Save Settings Updates
                </button>

              </form>
            </div>
          )}
        </Suspense>
      </main>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

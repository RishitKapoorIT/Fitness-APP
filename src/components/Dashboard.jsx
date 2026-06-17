import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  METRIC_DEFINITIONS,
  kgToLbs,
  lbsToKg
} from '../utils/healthCalculators';
import {
  Activity,
  Droplet,
  Scale,
  Calendar,
  AlertTriangle,
  Info,
  ChevronRight,
  TrendingUp,
  Heart,
  Plus,
  Undo,
  Flame,
  Award,
  Lock,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

export default function Dashboard({ onStartWorkout, setActiveTab }) {
  const { user, profile, updateProfile } = useAuth();
  
  // Local fallbacks if Supabase is offline/not connected
  const [localLogs, setLocalLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(`fitness_logs_${user?.id}`);
      return saved ? JSON.parse(saved) : { recovery: {}, water: {}, weight: [], workouts: {} };
    } catch {
      return { recovery: {}, water: {}, weight: [], workouts: {} };
    }
  });

  // UI Dialog/Panel States
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(null); // 'BMI' | 'BMR' | 'TDEE'

  // Input states
  const [sleepHours, setSleepHours] = useState('8');
  const [soreness, setSoreness] = useState('0'); // 0-10
  const [energy, setEnergy] = useState('4'); // 1-5
  const [notes, setNotes] = useState('');
  
  const [newWeight, setNewWeight] = useState('');

  // Daily status states
  const todayStr = new Date().toISOString().split('T')[0];
  const [todayRecovery, setTodayRecovery] = useState(null);
  const [todayWater, setTodayWater] = useState(0.0);
  const [weightHistory, setWeightHistory] = useState([]);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [loading, setLoading] = useState(true);

  // Streaks, Achievements and Weekly analytics states
  const [streaks, setStreaks] = useState({ workout: 0, water: 0, recovery: 0 });
  const [weeklySummary, setWeeklySummary] = useState({
    workoutsCount: 0,
    weightChange: 0,
    waterCompliance: 0,
    avgRecovery: 0
  });
  const [achievements, setAchievements] = useState([]);

  const computeMetrics = (recoveryList = [], waterList = [], workoutList = [], weightList = []) => {
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    const getPastDateStr = (daysAgo) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return formatDate(d);
    };

    const recoveryMap = {};
    recoveryList.forEach(r => { if (r && r.date) recoveryMap[r.date] = r; });

    const waterMap = {};
    waterList.forEach(w => { if (w && w.date) waterMap[w.date] = w.amount_liters; });

    const workoutMap = {};
    workoutList.forEach(w => { if (w && w.date) workoutMap[w.date] = w; });

    const calculateStreak = (checkFn) => {
      let streak = 0;
      let currDaysAgo = 0;
      
      const todayStr = getPastDateStr(0);
      const yesterdayStr = getPastDateStr(1);
      
      if (!checkFn(todayStr) && !checkFn(yesterdayStr)) {
        return 0;
      }
      
      if (!checkFn(todayStr) && checkFn(yesterdayStr)) {
        currDaysAgo = 1;
      }

      while (true) {
        const dateStr = getPastDateStr(currDaysAgo);
        if (checkFn(dateStr)) {
          streak++;
          currDaysAgo++;
        } else {
          break;
        }
      }
      return streak;
    };

    const recoveryStreak = calculateStreak(date => !!recoveryMap[date]);
    const waterGoal = profile?.water_goal_liters || 3.0;
    const waterStreak = calculateStreak(date => (waterMap[date] || 0) >= waterGoal);
    const workoutStreak = calculateStreak(date => !!workoutMap[date]);

    // Weekly summary (last 7 days)
    const last7DaysStr = Array.from({ length: 7 }, (_, i) => getPastDateStr(i));
    let weeklyWorkouts = 0;
    let weeklyWaterDays = 0;
    let totalRecoveryScore = 0;
    let recoveryDaysCount = 0;

    last7DaysStr.forEach(date => {
      if (workoutMap[date]) weeklyWorkouts++;
      if ((waterMap[date] || 0) >= waterGoal) weeklyWaterDays++;
      if (recoveryMap[date]) {
        totalRecoveryScore += recoveryMap[date].recovery_score;
        recoveryDaysCount++;
      }
    });

    const avgRecovery = recoveryDaysCount > 0 ? Math.round(totalRecoveryScore / recoveryDaysCount) : 0;

    // Weight change this week
    let weightDiff = 0.0;
    const sevenDaysAgoStr = getPastDateStr(7);
    const recentWeights = weightList
      .filter(w => w && w.date >= sevenDaysAgoStr)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (recentWeights.length > 1) {
      const oldestWeight = recentWeights[0].weight;
      const latestWeight = recentWeights[recentWeights.length - 1].weight;
      weightDiff = latestWeight - oldestWeight;
    }

    // Achievements computation
    const badges = [];
    
    const hasLog = recoveryList.length > 0;
    badges.push({
      id: 'first_step',
      name: 'First Step',
      desc: 'Log your first morning recovery score.',
      unlocked: hasLog,
      icon: 'Activity'
    });

    const metWaterGoalAtLeastOnce = waterList.some(w => w && w.amount_liters >= waterGoal);
    badges.push({
      id: 'h2o_champion',
      name: 'H2O Champion',
      desc: `Meet your daily ${waterGoal}L hydration goal.`,
      unlocked: metWaterGoalAtLeastOnce,
      icon: 'Droplet'
    });

    const hasWorkoutStreak = workoutStreak >= 3 || workoutList.length >= 3;
    badges.push({
      id: 'consistency',
      name: 'Consistency Master',
      desc: 'Complete 3 or more workouts in total.',
      unlocked: hasWorkoutStreak,
      icon: 'Award'
    });

    let coachOpened = false;
    try {
      coachOpened = localStorage.getItem('coach_consulted') === 'true';
    } catch {}
    badges.push({
      id: 'mindful_athlete',
      name: 'Mindful Athlete',
      desc: 'Consult your AI Coach for guidance.',
      unlocked: coachOpened,
      icon: 'Sparkles'
    });

    const hasWeightEntry = weightList.length > 0;
    badges.push({
      id: 'weight_milestone',
      name: 'Weight Tracker',
      desc: 'Log your body weight for the first time.',
      unlocked: hasWeightEntry,
      icon: 'Scale'
    });

    setStreaks({ workout: workoutStreak, water: waterStreak, recovery: recoveryStreak });
    setWeeklySummary({
      workoutsCount: weeklyWorkouts,
      weightChange: weightDiff,
      waterCompliance: weeklyWaterDays,
      avgRecovery: avgRecovery
    });
    setAchievements(badges);
  };

  // Load daily logs
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      let userLocalLogs = { recovery: {}, water: {}, weight: [], workouts: {} };
      try {
        const saved = localStorage.getItem(`fitness_logs_${user.id}`);
        if (saved) {
          userLocalLogs = JSON.parse(saved);
          if (!userLocalLogs.workouts) userLocalLogs.workouts = {};
        }
      } catch (err) {
        console.warn('Could not read user local logs:', err);
      }

      // Try fetching from Supabase if connected, otherwise fallback to LocalStorage
      try {
        const { data: recData } = await supabase
          .from('recovery_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', todayStr)
          .maybeSingle();

        const { data: waterData } = await supabase
          .from('water_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', todayStr)
          .maybeSingle();

        const { data: wtData } = await supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true })
          .limit(10);

        const { data: recList } = await supabase
          .from('recovery_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        const { data: waterList } = await supabase
          .from('water_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        const { data: workoutList } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (recData) setTodayRecovery(recData);
        else if (userLocalLogs.recovery[todayStr]) setTodayRecovery(userLocalLogs.recovery[todayStr]);

        let finalWater = 0.0;
        if (waterData) {
          const dbAmt = waterData.amount_liters;
          const localAmt = userLocalLogs.water[todayStr] || 0.0;
          finalWater = Math.max(dbAmt, localAmt);
          setTodayWater(finalWater);
          if (finalWater > dbAmt) {
            supabase
              .from('water_logs')
              .upsert({ user_id: user.id, date: todayStr, amount_liters: finalWater }, { onConflict: 'user_id,date' })
              .catch(console.error);
          }
        } else if (userLocalLogs.water[todayStr]) {
          finalWater = userLocalLogs.water[todayStr];
          setTodayWater(finalWater);
        } else {
          setTodayWater(0.0);
        }

        let finalWeights = [];
        if (wtData && wtData.length > 0) {
          finalWeights = wtData.map(w => ({ date: w.date, weight: w.weight_kg }));
          setWeightHistory(finalWeights);
        } else {
          finalWeights = userLocalLogs.weight || [];
          setWeightHistory(finalWeights);
        }

        const allRecovery = recList || Object.values(userLocalLogs.recovery);
        const allWater = waterList || Object.entries(userLocalLogs.water).map(([date, amount]) => ({ date, amount_liters: amount }));
        const allWorkouts = workoutList || Object.values(userLocalLogs.workouts || {});
        computeMetrics(allRecovery, allWater, allWorkouts, finalWeights);

        // Find today's workout log
        let finalWorkout = null;
        if (workoutList && workoutList.length > 0) {
          finalWorkout = workoutList.find(w => w.date === todayStr) || null;
        }
        if (!finalWorkout && userLocalLogs.workouts[todayStr]) {
          finalWorkout = userLocalLogs.workouts[todayStr];
        }
        setTodayWorkout(finalWorkout);

        const updatedLogs = { ...userLocalLogs };
        if (recData) updatedLogs.recovery[todayStr] = recData;
        updatedLogs.water[todayStr] = finalWater;
        if (wtData && wtData.length > 0) {
          updatedLogs.weight = finalWeights;
        }
        setLocalLogs(updatedLogs);
        localStorage.setItem(`fitness_logs_${user.id}`, JSON.stringify(updatedLogs));
      } catch (err) {
        console.warn('Using LocalStorage fallback for Dashboard:', err);
        if (userLocalLogs.recovery[todayStr]) setTodayRecovery(userLocalLogs.recovery[todayStr]);
        if (userLocalLogs.water[todayStr]) setTodayWater(userLocalLogs.water[todayStr]);
        const finalWeights = userLocalLogs.weight || [];
        setWeightHistory(finalWeights);

        const allRecovery = Object.values(userLocalLogs.recovery);
        const allWater = Object.entries(userLocalLogs.water).map(([date, amount]) => ({ date, amount_liters: amount }));
        const allWorkouts = Object.values(userLocalLogs.workouts || {});
        computeMetrics(allRecovery, allWater, allWorkouts, finalWeights);

        const finalWorkout = userLocalLogs.workouts[todayStr] || null;
        setTodayWorkout(finalWorkout);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, todayStr]);

  // Sync recovery input fields when today's record updates or loads
  useEffect(() => {
    if (todayRecovery) {
      setSleepHours(String(todayRecovery.sleep_hours ?? 8));
      setSoreness(String(todayRecovery.soreness_level ?? 0));
      setEnergy(String(todayRecovery.energy_level ?? 4));
      setNotes(todayRecovery.notes ?? '');
    }
  }, [todayRecovery]);

  // Handle Recovery Check-In
  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    const slp = parseFloat(sleepHours) || 8;
    const sorn = parseInt(soreness) || 0;
    const nrg = parseInt(energy) || 4;

    // Recovery Score Math
    let score = 100;
    
    // Sleep deduction/bonus
    if (slp < 7) score -= (7 - slp) * 12;
    else if (slp >= 8) score += 5;

    // Soreness deduction
    score -= sorn * 7;

    // Energy factor
    score += (nrg - 3) * 8;

    // Clamp between 0 and 100
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    const logPayload = {
      user_id: user?.id,
      date: todayStr,
      sleep_hours: slp,
      soreness_level: sorn,
      energy_level: nrg,
      recovery_score: finalScore,
      notes
    };

    // Save locally
    const updated = {
      ...localLogs,
      recovery: { ...localLogs.recovery, [todayStr]: logPayload }
    };
    setLocalLogs(updated);
    localStorage.setItem(`fitness_logs_${user?.id}`, JSON.stringify(updated));
    setTodayRecovery(logPayload);
    setShowRecoveryModal(false);

    // Save to Supabase
    try {
      await supabase.from('recovery_logs').upsert(logPayload, { onConflict: 'user_id,date' });
    } catch (err) {
      console.error('Supabase save error:', err);
    }
  };

  // Handle Water Logging
  const addWater = async (amountLiters) => {
    const newAmt = Math.max(0, parseFloat((todayWater + amountLiters).toFixed(2)));
    
    const logPayload = {
      user_id: user?.id,
      date: todayStr,
      amount_liters: newAmt
    };

    const updated = {
      ...localLogs,
      water: { ...localLogs.water, [todayStr]: newAmt }
    };
    setLocalLogs(updated);
    localStorage.setItem(`fitness_logs_${user?.id}`, JSON.stringify(updated));
    setTodayWater(newAmt);

    try {
      await supabase.from('water_logs').upsert(logPayload, { onConflict: 'user_id,date' });
    } catch (err) {
      console.error('Supabase water log error:', err);
    }
  };

  // Handle Weight Logging
  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    const wt = parseFloat(newWeight);
    if (!wt || wt <= 0) return;

    let wtKg = wt;
    if (profile?.unit_system === 'imperial') {
      wtKg = parseFloat(lbsToKg(wt));
    }

    const logPayload = {
      user_id: user?.id,
      date: todayStr,
      weight_kg: wtKg
    };

    const newHist = [...weightHistory, { date: todayStr, weight: wtKg }].slice(-10);
    const updated = {
      ...localLogs,
      weight: newHist
    };
    setLocalLogs(updated);
    localStorage.setItem(`fitness_logs_${user?.id}`, JSON.stringify(updated));
    setWeightHistory(newHist);
    
    // Update profile weight too
    try {
      await updateProfile({ weight_kg: wtKg });
      await supabase.from('weight_logs').insert(logPayload);
    } catch (err) {
      console.error(err);
    }

    setNewWeight('');
    setShowWeightModal(false);
  };

  // Health Metrics Computations
  const weightVal = profile?.weight_kg || 70;
  const heightVal = profile?.height_cm || 170;
  const isMetric = profile?.unit_system !== 'imperial';

  const bmi = calculateBMI(weightVal, heightVal);
  const bmiCat = getBMICategory(bmi);
  const bmr = calculateBMR(weightVal, heightVal, profile?.age || 25, profile?.gender || 'male');
  const tdee = calculateTDEE(bmr, profile?.activity_level || 'moderate');

  // Chart Formatting
  const chartData = weightHistory.map((w) => {
    const wtDisplay = isMetric ? w.weight : parseFloat(kgToLbs(w.weight));
    return {
      date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      Weight: wtDisplay
    };
  });

  // Recovery recommendation helper
  const getRecoveryZone = (score) => {
    if (score >= 75) return { label: 'Optimal / Green', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', note: 'Ready for full training load.' };
    if (score >= 45) return { label: 'Caution / Yellow', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', note: 'Consider lowering intensity or sets by 30%.' };
    return { label: 'Rest / Red', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', note: 'Overtraining danger. Rest or light active stretching only.' };
  };

  const recoveryZone = todayRecovery ? getRecoveryZone(todayRecovery.recovery_score) : null;

  // Get dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const greeting = getGreeting();

  if (loading) {
    return (
      <div className="space-y-6 text-left animate-pulse p-4">
        {/* Top Welcome Bar Skeleton */}
        <div className="h-28 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-between">
          <div className="space-y-2 w-1/3">
            <div className="h-6 bg-slate-805/80 rounded w-3/4"></div>
            <div className="h-4 bg-slate-805/80 rounded w-1/2"></div>
          </div>
          <div className="h-10 bg-slate-805/80 rounded w-32"></div>
        </div>

        {/* Streaks Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-900/60 border border-slate-850 rounded-2xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 justify-center py-2">
              <div className="h-10 w-10 bg-slate-805/80 rounded-xl"></div>
              <div className="space-y-1.5 w-1/2">
                <div className="h-3 bg-slate-805/80 rounded"></div>
                <div className="h-4 bg-slate-805/80 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-64"></div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-64"></div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in text-left">
      
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden page-fade-in">
        <div className="space-y-1.5 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {greeting}, {profile?.name || 'Athlete'}! 👋
          </h1>
          <p className="text-slate-400 text-xs flex flex-wrap items-center gap-x-2 gap-y-1">
            <Calendar className="h-3.5 w-3.5 text-blue-500" />
            <span>Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            <span className="text-slate-650">•</span>
            <span className="text-blue-400 font-bold">{weeklySummary.workoutsCount} Workouts completed this week</span>
            {streaks.workout > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-orange-400 font-bold">{streaks.workout} Day Streak 🔥</span>
              </>
            )}
          </p>
        </div>
        
        {/* Quick check-in shortcut */}
        <button
          onClick={() => setShowRecoveryModal(true)}
          className="relative z-10 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white font-bold text-xs py-3 px-5 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          <Activity className="h-4 w-4 text-blue-500" />
          Update Recovery
        </button>
      </div>

      {/* Streaks Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-900/60 border border-slate-850 rounded-2xl">
        <div className="flex items-center gap-3 px-2 justify-center border-b sm:border-b-0 sm:border-r border-slate-800/80 pb-3 sm:pb-0">
          <div className="h-10 w-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-400">
            <Flame className="h-5 w-5 fill-current" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Workout Streak</div>
            <div className="text-lg font-black text-slate-200">{streaks.workout} {streaks.workout === 1 ? 'day' : 'days'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-2 justify-center border-b sm:border-b-0 sm:border-r border-slate-800/80 pb-3 sm:pb-0">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400">
            <Flame className="h-5 w-5 fill-current" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hydration Streak</div>
            <div className="text-lg font-black text-slate-200">{streaks.water} {streaks.water === 1 ? 'day' : 'days'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-2 justify-center pt-1 sm:pt-0">
          <div className="h-10 w-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-400">
            <Flame className="h-5 w-5 fill-current" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Check-in Streak</div>
            <div className="text-lg font-black text-slate-200">{streaks.recovery} {streaks.recovery === 1 ? 'day' : 'days'}</div>
          </div>
        </div>
      </div>

      {/* KPI Caloric Targets Grid (USA/Imperial & India/Metric) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weight Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative group">
          <button
            onClick={() => setShowWeightModal(true)}
            className="absolute top-4 right-4 h-6 w-6 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-center text-xs hover:text-white text-slate-400 transition-colors"
            title="Log Today's Weight"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
            <Scale className="h-3.5 w-3.5 text-blue-500" />
            Weight
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">
            {isMetric ? `${weightVal} kg` : `${kgToLbs(weightVal)} lbs`}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Height: {isMetric ? `${heightVal} cm` : `${Math.floor((heightVal/2.54)/12)}'${Math.round((heightVal/2.54)%12)}"`}</div>
        </div>

        {/* BMI Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative">
          <button
            onClick={() => setShowInfoModal('BMI')}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Info className="h-4 w-4" />
          </button>
          <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">BMI (Body Mass)</div>
          <div className="text-2xl font-black text-slate-100 mt-2">
            {bmi.toFixed(1)}
          </div>
          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${bmiCat.bgClass} ${bmiCat.textClass}`}>
            {bmiCat.label}
          </span>
        </div>

        {/* BMR Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative">
          <button
            onClick={() => setShowInfoModal('BMR')}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Info className="h-4 w-4" />
          </button>
          <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">BMR (Rest Burn)</div>
          <div className="text-2xl font-black text-slate-100 mt-2">
            {Math.round(bmr)} <span className="text-xs text-slate-500">kcal</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Life-sustaining minimum</div>
        </div>

        {/* TDEE Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative">
          <button
            onClick={() => setShowInfoModal('TDEE')}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Info className="h-4 w-4" />
          </button>
          <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">TDEE (Daily Burn)</div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            {Math.round(tdee)} <span className="text-xs text-blue-500">kcal</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Calorie limit for maintenance</div>
        </div>
      </div>

      {/* Weekly Progress Analytics */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-850">
          <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider">Weekly Progress Summary</h3>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Last 7 Days</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block text-left">Workouts Logged</span>
            <div className="text-xl font-extrabold text-slate-100 text-left">{weeklySummary.workoutsCount} Sessions</div>
            <p className="text-[10px] text-slate-500 leading-none text-left">Target: 3+ per week</p>
          </div>
          <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block text-left">Weight Change</span>
            <div className={`text-xl font-extrabold text-left ${weeklySummary.weightChange < 0 ? 'text-green-400' : weeklySummary.weightChange > 0 ? 'text-blue-400' : 'text-slate-300'}`}>
              {weeklySummary.weightChange < 0 
                ? `${weeklySummary.weightChange.toFixed(1)} kg` 
                : weeklySummary.weightChange > 0 
                  ? `+${weeklySummary.weightChange.toFixed(1)} kg` 
                  : 'Stable'}
            </div>
            <p className="text-[10px] text-slate-500 leading-none text-left">This week's progression</p>
          </div>
          <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block text-left">Hydration Met</span>
            <div className="text-xl font-extrabold text-slate-100 text-left">{weeklySummary.waterCompliance} / 7 Days</div>
            <p className="text-[10px] text-slate-500 leading-none text-left">Met daily water goal</p>
          </div>
          <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block text-left">Avg Recovery Score</span>
            <div className="text-xl font-extrabold text-blue-400 text-left">{weeklySummary.avgRecovery}%</div>
            <p className="text-[10px] text-slate-500 leading-none text-left">Readiness index average</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Water Tracker & Workout Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Today's Generated Workout & Soreness Guide */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 relative overflow-hidden page-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Recovery Hero Circle Dial */}
              <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4 bg-slate-950/40 border border-slate-850 rounded-2xl relative">
                <div className="relative h-32 w-32 flex items-center justify-center rounded-full bg-slate-950 border-[6px] border-slate-850 shadow-inner">
                  {todayRecovery ? (
                    <>
                      {/* SVG Progress Ring */}
                      <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#1e293b" strokeWidth="4" />
                        <circle
                          cx="50"
                          cy="50"
                          r="44"
                          fill="none"
                          stroke={todayRecovery.recovery_score >= 75 ? '#10b981' : todayRecovery.recovery_score >= 45 ? '#eab308' : '#ef4444'}
                          strokeWidth="5"
                          strokeDasharray={276}
                          strokeDashoffset={276 - (276 * (todayRecovery.recovery_score / 100))}
                          strokeLinecap="round"
                          className="transition-all duration-1000 linear"
                        />
                      </svg>
                      <div className="text-center z-10 space-y-0.5">
                        <div className="text-3xl font-black font-mono tracking-tight text-white">
                          {todayRecovery.recovery_score}%
                        </div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                          Recovery Score
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center z-10 p-3 space-y-1.5">
                      <AlertTriangle className="h-6 w-6 text-blue-500 mx-auto animate-pulse" />
                      <div className="text-[9px] font-extrabold text-blue-400 uppercase tracking-wider">
                        Not Checked In
                      </div>
                    </div>
                  )}
                </div>
                
                {todayRecovery ? (
                  <div className="mt-3 space-y-1 text-center">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${recoveryZone.bg} ${recoveryZone.color}`}>
                      {recoveryZone.label}
                    </span>
                    <p className="text-[9px] text-slate-400 max-w-[150px] leading-snug mx-auto">{recoveryZone.note}</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowRecoveryModal(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9px] py-1.5 px-3 rounded-lg transition-all shadow-md uppercase tracking-wider cursor-pointer"
                    >
                      Check In Now
                    </button>
                  </div>
                )}
              </div>

              {/* Training Plan details */}
              <div className="md:col-span-7 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-slate-200 text-base">Today's Adaptive Plan</h3>
                    {todayWorkout && (
                      <span className="text-[9px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Completed
                      </span>
                    )}
                  </div>

                  {todayWorkout ? (
                    <div className="p-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-start gap-2.5">
                      <Award className="h-5 w-5 shrink-0 text-emerald-400 fill-current animate-bounce" />
                      <div className="space-y-1">
                        <p className="font-bold text-slate-100 text-sm">Workout Completed!</p>
                        <p className="leading-relaxed text-slate-300 text-[11px]">
                          You logged a <strong>{todayWorkout.workout_type || todayWorkout.type || 'Adaptive'}</strong> workout session today. Great job staying consistent with your recovery plan!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-400">Generated Routine:</span>
                        <span className="text-blue-400 font-extrabold text-sm">
                          {!todayRecovery 
                            ? 'Check in to see plan' 
                            : todayRecovery.recovery_score < 40 
                            ? 'Rest & Stretch Only' 
                            : 'Cardio & Strength mix'}
                        </span>
                      </div>

                      {profile?.injuries && profile.injuries !== 'None' && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2.5">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <p className="leading-relaxed text-[11px]">
                            <strong>{profile.injuries} Active</strong>: Swap out high-strain vectors for safe, low-impact exercise alternatives.
                          </p>
                        </div>
                      )}

                      {todayRecovery && todayRecovery.recovery_score >= 40 && todayRecovery.recovery_score < 75 && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs rounded-xl flex items-start gap-2.5">
                          <Heart className="h-4 w-4 shrink-0 mt-0.5 animate-pulse" />
                          <p className="leading-relaxed text-[11px] font-medium">
                            <strong>Fatigue Warning ({todayRecovery.recovery_score}%)</strong>: Total training volume scaled back by 30%.
                          </p>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {!todayRecovery
                          ? 'Start by submitting your morning questionnaire to compute your personalized training capacity.'
                          : todayRecovery.recovery_score < 40
                          ? 'Your recovery is critical today. Overtraining on high-fatigue days delays weight loss goals.'
                          : 'Sufficient recovery score recorded. Workouts are configured specifically for fat loss and calf mobility.'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  {todayWorkout ? (
                    <div className="flex gap-2">
                      <div className="flex-1 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
                        <Flame className="h-4.5 w-4.5 fill-current text-emerald-400" />
                        Workout Logged
                      </div>
                      <button
                        onClick={onStartWorkout}
                        className="px-4 py-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        Do Again
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={!todayRecovery}
                      onClick={onStartWorkout}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                    >
                      {!todayRecovery ? 'Log Recovery First' : 'Start Adaptive Workout'}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Weight Progress Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 page-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-200 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Weight Trend ({isMetric ? 'kg' : 'lbs'})
              </h3>
              <button 
                onClick={() => setShowWeightModal(true)}
                className="text-[10px] font-bold text-blue-400 hover:text-white uppercase tracking-wider cursor-pointer bg-slate-950 border border-slate-850 hover:border-slate-800 px-3 py-1.5 rounded-xl transition-all"
              >
                + Log Weight
              </button>
            </div>
            {weightHistory.length > 1 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="Weight" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 bg-slate-950/25 border border-slate-850 rounded-2xl border-dashed">
                <Scale className="h-8 w-8 text-slate-500 mb-2 animate-bounce" />
                <p className="text-xs font-bold text-slate-350">⚖️ No Weight Logs Yet</p>
                <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed mt-1 mx-auto">
                  Log your body weight over multiple days to unlock the trend visualization charts.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Water Tracker */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-full flex flex-col justify-between space-y-6">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-200 flex items-center gap-2">
                <Droplet className="h-4 w-4 text-blue-400" />
                Hydration Tracker
              </h3>
              <p className="text-slate-500 text-xs">Stay hydrated to recover faster and metabolize fat efficiently.</p>
            </div>

            {/* Circular Hydration Indicator */}
            <div className="py-4 flex flex-col items-center">
              <div className="relative h-36 w-36 flex items-center justify-center rounded-full bg-slate-950 border-[6px] border-slate-850 shadow-inner">
                {/* SVG Ring background and fill */}
                <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="4" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeDasharray={282}
                    strokeDashoffset={282 - (282 * Math.min(todayWater, 3.0)) / 3.0}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="text-center">
                  <div className="text-3xl font-black text-slate-200">{todayWater.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">/ 3.0 Liters</div>
                </div>
              </div>
            </div>

            {/* Water Quick Add Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addWater(0.25)}
                  className="bg-slate-950 hover:bg-slate-850 border border-slate-850 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
                >
                  +250 ml
                </button>
                <button
                  onClick={() => addWater(0.5)}
                  className="bg-slate-950 hover:bg-slate-850 border border-slate-850 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
                >
                  +500 ml
                </button>
                <button
                  onClick={() => addWater(1.0)}
                  className="bg-slate-950 hover:bg-slate-850 border border-slate-850 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
                >
                  +1.0 Liter
                </button>
              </div>
              <button
                onClick={() => addWater(-0.25)}
                className="w-full bg-rose-950/15 hover:bg-rose-950/25 border border-rose-900/30 hover:border-rose-500/40 py-2.5 rounded-xl text-xs font-bold text-rose-450 hover:text-rose-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Undo className="h-4 w-4 text-rose-400" />
                Accidentally Added? Remove 250ml
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Achievements Milestones */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-850">
          <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider">Achievements & Milestones</h3>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Unlocked Badges</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {achievements.map(badge => {
            const renderIcon = (name, active) => {
              const cls = `h-6 w-6 ${active ? 'text-blue-400' : 'text-slate-650'}`;
              if (name === 'Activity') return <Activity className={cls} />;
              if (name === 'Droplet') return <Droplet className={cls} />;
              if (name === 'Award') return <Award className={cls} />;
              if (name === 'Sparkles') return <Sparkles className={cls} />;
              if (name === 'Scale') return <Scale className={cls} />;
              return <Award className={cls} />;
            };

            return (
              <div 
                key={badge.id}
                className={`p-4 border rounded-2xl flex flex-col items-center text-center space-y-2 relative group transition-all duration-300 ${
                  badge.unlocked 
                    ? 'bg-slate-950/60 border-blue-900/30 shadow-md shadow-blue-500/5' 
                    : 'bg-slate-950/10 border-slate-850 opacity-40'
                }`}
              >
                {/* Badge Icon */}
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${
                  badge.unlocked ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-slate-900/80 border border-slate-850'
                }`}>
                  {badge.unlocked ? renderIcon(badge.icon, true) : <Lock className="h-5 w-5 text-slate-600" />}
                </div>

                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-200 leading-tight">{badge.name}</h4>
                  <p className="text-[9px] text-slate-500 mt-1 leading-normal max-w-[110px] mx-auto">{badge.desc}</p>
                </div>

                {badge.unlocked && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 1. MORNING RECOVERY CHECK-IN MODAL */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-6 shadow-2xl page-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg">Morning Recovery Check-In</h3>
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              {/* Sleep input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sleep Duration (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm focus:outline-none"
                />
              </div>

              {/* Soreness slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Muscle / Calf Soreness</label>
                  <span className="text-xs text-blue-400 font-bold">{soreness}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={soreness}
                  onChange={(e) => setSoreness(e.target.value)}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[8px] text-slate-500 uppercase font-bold">
                  <span>0 - Fresh & Ready</span>
                  <span>10 - Extreme Pain</span>
                </div>
              </div>

              {/* Energy Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Energy Level</label>
                <select
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm focus:outline-none"
                >
                  <option value="1">1 - Extremely Drained</option>
                  <option value="2">2 - Low Energy</option>
                  <option value="3">3 - Moderate / Normal</option>
                  <option value="4">4 - High Energy</option>
                  <option value="5">5 - Peak Energy</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notes / Soreness Locations</label>
                <input
                  type="text"
                  placeholder="e.g. Left calf feels tight"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
              >
                Log Status & Calculate Score
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. LOG WEIGHT MODAL */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 space-y-6 shadow-2xl page-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg">Log Today's Weight</h3>
              <button
                onClick={() => setShowWeightModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWeightSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Weight ({isMetric ? 'kg' : 'lbs'})
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  autoFocus
                  placeholder={isMetric ? 'e.g. 84.0' : 'e.g. 185.0'}
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
              >
                Save Weight Log
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. SCIENTIFIC METRIC EXPLANATION MODAL */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-6 shadow-2xl page-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-blue-400">
                {METRIC_DEFINITIONS[showInfoModal].title}
              </h3>
              <button
                onClick={() => setShowInfoModal(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <p>{METRIC_DEFINITIONS[showInfoModal].definition}</p>
              
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Application</span>
                <p className="text-slate-400">{METRIC_DEFINITIONS[showInfoModal].clinicalMeaning}</p>
              </div>

              {showInfoModal === 'BMI' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">BMI Scales & Categories</span>
                  <div className="grid grid-cols-2 gap-2">
                    {METRIC_DEFINITIONS.BMI.ranges.map((r, idx) => (
                      <div key={idx} className={`${r.bg} p-2.5 rounded-xl border border-white/5`}>
                        <div className={`font-bold ${r.color}`}>{r.label}</div>
                        <div className="text-[10px] text-slate-400">{r.range}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowInfoModal(null)}
              className="w-full bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-3 rounded-xl transition-all"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

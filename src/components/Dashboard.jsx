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
  Plus
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
      return saved ? JSON.parse(saved) : { recovery: {}, water: {}, weight: [] };
    } catch {
      return { recovery: {}, water: {}, weight: [] };
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

  // Load daily logs
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
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

        if (recData) setTodayRecovery(recData);
        else if (localLogs.recovery[todayStr]) setTodayRecovery(localLogs.recovery[todayStr]);

        if (waterData) setTodayWater(waterData.amount_liters);
        else if (localLogs.water[todayStr]) setTodayWater(localLogs.water[todayStr]);

        if (wtData && wtData.length > 0) {
          setWeightHistory(wtData.map(w => ({ date: w.date, weight: w.weight_kg })));
        } else {
          setWeightHistory(localLogs.weight);
        }
      } catch (err) {
        console.warn('Using LocalStorage fallback for Dashboard:', err);
        if (localLogs.recovery[todayStr]) setTodayRecovery(localLogs.recovery[todayStr]);
        if (localLogs.water[todayStr]) setTodayWater(localLogs.water[todayStr]);
        setWeightHistory(localLogs.weight);
      }
    };

    loadData();
  }, [user, localLogs, todayStr]);

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
      await supabase.from('recovery_logs').upsert(logPayload);
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
      await supabase.from('water_logs').upsert(logPayload);
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
  const weightVal = profile?.weight_kg || 84;
  const heightVal = profile?.height_cm || 173;
  const isMetric = profile?.unit_system !== 'imperial';

  const bmi = calculateBMI(weightVal, heightVal);
  const bmiCat = getBMICategory(bmi);
  const bmr = calculateBMR(weightVal, heightVal, profile?.age || 21, profile?.gender || 'male');
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

  return (
    <div className="space-y-6 page-fade-in text-left">
      
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Hi, {profile?.name || 'Athlete'}!
          </h1>
          <p className="text-slate-400 text-xs flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Track for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {/* Recovery Score CTA */}
        {!todayRecovery ? (
          <button
            onClick={() => setShowRecoveryModal(true)}
            className="relative z-10 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 px-5 rounded-2xl transition-all shadow-lg shadow-blue-500/10 flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Activity className="h-4 w-4" />
            Log Morning Recovery
          </button>
        ) : (
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${recoveryZone.bg} ${recoveryZone.border} relative z-10`}>
            <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center font-black text-lg text-white">
              {todayRecovery.recovery_score}
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Recovery Readiness</div>
              <div className={`text-xs font-bold ${recoveryZone.color}`}>{recoveryZone.label}</div>
            </div>
          </div>
        )}
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

      {/* Main Grid: Water Tracker & Workout Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Today's Generated Workout & Soreness Guide */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-850">
              <h3 className="font-extrabold text-slate-200">Today's Adaptive Plan</h3>
              {todayRecovery && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${recoveryZone.bg} ${recoveryZone.color}`}>
                  {todayRecovery.recovery_score}% Recovered
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-300">Generated Routine:</span>
                <span className="text-blue-400">
                  {todayRecovery && todayRecovery.recovery_score < 40 ? 'Rest & Stretch Only' : 'Cardio & Strength mix'}
                </span>
              </div>

              {profile?.injuries === 'Shin/Calf Pain' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Shin/Calf Pain Active</strong>: We have swapped high-impact running intervals with brisk walking, mobility rotations, and standing calf raises to protect your shins.
                  </p>
                </div>
              )}

              {todayRecovery && todayRecovery.recovery_score >= 40 && todayRecovery.recovery_score < 75 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs rounded-xl flex items-start gap-2.5">
                  <Heart className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Fatigue Detected (Readiness: {todayRecovery.recovery_score}%)</strong>: Total training volume has been scaled back by 30%. Focus on conversational pace.
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed">
                {todayRecovery && todayRecovery.recovery_score < 40
                  ? 'Your recovery is critical today. Overtraining on high-fatigue days delays weight loss goals and increases shin splints risk.'
                  : 'Sufficient recovery score recorded. Workouts are configured specifically for fat loss and calf mobility.'}
              </p>
            </div>

            <button
              onClick={onStartWorkout}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider mt-4"
            >
              Start Adaptive Workout
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {/* Weight Progress Chart */}
          {weightHistory.length > 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-extrabold text-slate-200 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Weight Trend ({isMetric ? 'kg' : 'lbs'})
              </h3>
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
            </div>
          )}
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
                  <div className="text-3xl font-black text-slate-200">{todayWater.toFixed(1)}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">/ 3.0 Liters</div>
                </div>
              </div>
            </div>

            {/* Water Quick Add Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addWater(0.25)}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-850 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
                >
                  +250 ml
                </button>
                <button
                  onClick={() => addWater(0.5)}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-850 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
                >
                  +500 ml
                </button>
                <button
                  onClick={() => addWater(1.0)}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-850 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
                >
                  +1.0 Liter
                </button>
              </div>
              <button
                onClick={() => addWater(-0.25)}
                className="w-full text-slate-500 hover:text-slate-400 text-[10px] transition-colors py-1 cursor-pointer"
              >
                Accidentally added? Remove 250ml
              </button>
            </div>
          </div>
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

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { Play, Pause, RotateCcw, CheckCircle, AlertCircle, Info, Heart, ArrowRight } from 'lucide-react';

// Static base plan from original workout-chart.jsx
const BASE_DAYS_PLAN = [
  {
    day: "MON", label: "Monday", type: "Cardio", color: "blue",
    focus: "Walk + Jog Intervals", duration: "35 mins",
    warmup: [
      { name: "Slow Walk", detail: "5 min", timerSec: 300 },
      { name: "Ankle Rotations", detail: "30 sec", timerSec: 30 },
      { name: "Arm Swings", detail: "30 sec", timerSec: 30 },
      { name: "Leg Swings", detail: "30 sec", timerSec: 30 },
    ],
    exercises: [
      { name: "Walk (interval)", sets: "7×", reps: "3 min each", timerSec: 180, totalSets: 7, note: "Brisk pace", isInterval: true },
      { name: "Jog (interval)", sets: "7×", reps: "1 min each", timerSec: 60, totalSets: 7, note: "Conversational pace", isInterval: true, highImpact: true },
      { name: "Cool Down Walk", sets: "1×", reps: "5 min", timerSec: 300, totalSets: 1, note: "", isInterval: false },
    ],
    stretches: ["Calf Stretch", "Hamstring Stretch", "Quad Stretch"],
  },
  {
    day: "TUE", label: "Tuesday", type: "Strength", color: "purple",
    focus: "Strength + Recovery Walk", duration: "35–40 mins",
    warmup: [{ name: "Brisk Walk", detail: "15–20 min", timerSec: 1080 }],
    exercises: [
      { name: "Bodyweight Squats", sets: "3", reps: "12", timerSec: null, totalSets: 3, note: "Keep heels flat" },
      { name: "Calf Raises", sets: "3", reps: "20", timerSec: null, totalSets: 3, note: "Focus on calves" },
      { name: "Glute Bridges", sets: "3", reps: "15", timerSec: null, totalSets: 3, note: "Squeeze glutes" },
      { name: "Step-ups", sets: "3", reps: "10 each leg", timerSec: null, totalSets: 3, note: "Step on bench/stair" },
      { name: "Wall Sit", sets: "3", reps: "30 sec", timerSec: 30, totalSets: 3, note: "Rest 45s between sets" },
    ],
    stretches: ["Calf Stretch", "Quad Stretch"],
  },
  {
    day: "WED", label: "Wednesday", type: "Recovery", color: "emerald",
    focus: "Active Recovery Walk", duration: "30 mins",
    warmup: [],
    exercises: [{ name: "Brisk Walk", sets: "1×", reps: "30 min", timerSec: 1800, totalSets: 1, note: "No running today" }],
    stretches: ["Full Body Light Stretch", "Ankle Mobility Circles"],
  },
  {
    day: "THU", label: "Thursday", type: "Cardio", color: "blue",
    focus: "Walk + Jog Intervals", duration: "35 mins",
    warmup: [
      { name: "Slow Walk", detail: "5 min", timerSec: 300 },
      { name: "Ankle Rotations", detail: "30 sec", timerSec: 30 },
      { name: "Arm Swings", detail: "30 sec", timerSec: 30 },
      { name: "Leg Swings", detail: "30 sec", timerSec: 30 },
    ],
    exercises: [
      { name: "Walk (interval)", sets: "7×", reps: "3 min each", timerSec: 180, totalSets: 7, note: "Brisk pace", isInterval: true },
      { name: "Jog (interval)", sets: "7×", reps: "1 min each", timerSec: 60, totalSets: 7, note: "Conversational pace", isInterval: true, highImpact: true },
      { name: "Cool Down Walk", sets: "1×", reps: "5 min", timerSec: 300, totalSets: 1, note: "", isInterval: false },
    ],
    stretches: ["Calf Stretch", "Hamstring Stretch", "Quad Stretch"],
  },
  {
    day: "FRI", label: "Friday", type: "Strength", color: "purple",
    focus: "Strength + Core", duration: "40 mins",
    warmup: [{ name: "Walking Warmup", detail: "5 min", timerSec: 300 }],
    exercises: [
      { name: "Squats", sets: "3", reps: "15", timerSec: null, totalSets: 3, note: "" },
      { name: "Calf Raises", sets: "3", reps: "20", timerSec: null, totalSets: 3, note: "" },
      { name: "Glute Bridges", sets: "3", reps: "15", timerSec: null, totalSets: 3, note: "" },
      { name: "Lunges", sets: "3", reps: "8 each leg", timerSec: null, totalSets: 3, note: "" },
      { name: "Wall Sit", sets: "3", reps: "40 sec", timerSec: 40, totalSets: 3, note: "" },
      { name: "Plank", sets: "3", reps: "20–30 sec", timerSec: 25, totalSets: 3, note: "Core focus" },
      { name: "Dead Bug", sets: "3", reps: "10 each side", timerSec: null, totalSets: 3, note: "Slow & controlled" },
    ],
    stretches: ["Calf Stretch", "Quad Stretch", "Hamstring Stretch"],
  },
  {
    day: "SAT", label: "Saturday", type: "Fat Burn", color: "amber",
    focus: "Long Easy Walk", duration: "40–50 mins",
    warmup: [],
    exercises: [{ name: "Easy Walk", sets: "1×", reps: "40–50 min", timerSec: 2700, totalSets: 1, note: "Steady, NOT fast" }],
    stretches: ["Light Stretch"],
  },
  {
    day: "SUN", label: "Sunday", type: "Rest", color: "slate",
    focus: "Full Rest & Recovery", duration: "—",
    warmup: [],
    exercises: [{ name: "Rest & Recovery", sets: "—", reps: "All day", timerSec: null, totalSets: 0, note: "Recovery = progress" }],
    stretches: [],
  },
];

const BADGE_THEMES = {
  Cardio: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  Strength: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  Recovery: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  "Fat Burn": { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  Rest: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
};

export default function Workouts() {
  const { user, profile } = useAuth();
  const [dayIdx, setDayIdx] = useState(0);
  const [activeTimerEx, setActiveTimerEx] = useState(null);
  
  // Stopwatch States
  const [swSecs, setSwSecs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const stopwatchRef = useRef(null);

  // Recovery Log Fetching (to dynamically adjust current day's routine)
  const [recoveryScore, setRecoveryScore] = useState(null);

  useEffect(() => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Fetch today's recovery score
    supabase
      .from('recovery_logs')
      .select('recovery_score')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setRecoveryScore(data.recovery_score);
        else {
          // Check local storage fallback
          try {
            const saved = localStorage.getItem(`fitness_logs_${user.id}`);
            if (saved) {
              const logs = JSON.parse(saved);
              if (logs.recovery[todayStr]) {
                setRecoveryScore(logs.recovery[todayStr].recovery_score);
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      });
  }, [user]);

  // Session Stopwatch
  useEffect(() => {
    if (swRunning) {
      stopwatchRef.current = setInterval(() => setSwSecs((s) => s + 1), 1000);
    } else {
      clearInterval(stopwatchRef.current);
    }
    return () => clearInterval(stopwatchRef.current);
  }, [swRunning]);

  const formatStopwatch = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ADAPTIVE WORKOUT GENERATION ENGINE
  const getAdaptiveDayPlan = (baseDay) => {
    let dayCopy = JSON.parse(JSON.stringify(baseDay)); // Deep copy to prevent modifying static data
    
    // 1. Injury Adjustments (e.g. Calf/Shin Pain)
    if (profile?.injuries === 'Shin/Calf Pain') {
      dayCopy.exercises = dayCopy.exercises.map((ex) => {
        if (ex.highImpact) {
          // Replace Jogging with low impact walking intervals & extra calf protection
          return {
            ...ex,
            name: "Brisk Walk (low-impact interval)",
            note: "Substituted high-impact jog to prevent calf splints",
            highImpact: false,
            timerSec: ex.timerSec + 60 // extend walk time since impact is reduced
          };
        }
        return ex;
      });

      // Insert extra calf mobility warmup if missing
      const hasCalfWarmup = dayCopy.warmup.some(w => w.name.includes("Calf") || w.name.includes("Ankle"));
      if (dayCopy.warmup.length > 0 && !hasCalfWarmup) {
        dayCopy.warmup.push({ name: "Gentle Calf Stretching", detail: "30 sec", timerSec: 30 });
      }
    }

    // 2. Recovery Score Adjustments (Red / Yellow / Green Zones)
    if (recoveryScore !== null) {
      if (recoveryScore < 40) {
        // RED ZONE: Switch entire workout to Recovery/Rest Day
        dayCopy.type = "Rest";
        dayCopy.focus = "Rest & Mobility Recovery";
        dayCopy.duration = "15 mins";
        dayCopy.warmup = [];
        dayCopy.exercises = [
          { name: "Active Rest & Hydration", sets: "—", reps: "All Day", note: "Let muscle tissue repair" },
          { name: "Foam Roll / Calf Massage", sets: "1×", reps: "5 min", timerSec: 300 }
        ];
        dayCopy.stretches = ["Calf Stretch", "Gentle Leg Swings", "Wall Calf Hold"];
      } else if (recoveryScore >= 40 && recoveryScore < 75) {
        // YELLOW ZONE: Fatigue. Scale back sets and intervals by 30-40%
        dayCopy.focus = `${dayCopy.focus} (Reduced Volume)`;
        dayCopy.exercises = dayCopy.exercises.map((ex) => {
          if (ex.totalSets > 1) {
            const adjustedSets = Math.max(1, Math.round(ex.totalSets * 0.6));
            return {
              ...ex,
              sets: `${adjustedSets}×`,
              totalSets: adjustedSets,
              note: `${ex.note ? ex.note + ' · ' : ''}Scaled down due to moderate recovery score (${recoveryScore}%)`
            };
          }
          return ex;
        });
      }
    }

    return dayCopy;
  };

  const d = getAdaptiveDayPlan(BASE_DAYS_PLAN[dayIdx]);
  const badgeTheme = BADGE_THEMES[d.type] || BADGE_THEMES.Rest;

  return (
    <div className="space-y-6 page-fade-in text-left">
      
      {/* Session Timer Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-lg ${swRunning ? 'bg-blue-500/10 text-blue-500 animate-pulse' : 'bg-slate-950 text-slate-500'}`}>
            ⏱️
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Session Stopwatch</div>
            <div className="text-3xl font-black font-mono tracking-tight text-slate-100">{formatStopwatch(swSecs)}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSwRunning(!swRunning)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${swRunning ? 'bg-amber-600/10 text-amber-500 border border-amber-500/20' : 'bg-blue-600 text-white shadow-blue-500/10'}`}
          >
            {swRunning ? 'Pause' : 'Start Timer'}
          </button>
          <button
            onClick={() => { setSwRunning(false); setSwSecs(0); }}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-850 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Week Day Pills Selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {BASE_DAYS_PLAN.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setDayIdx(idx)}
            className={`px-4 py-3 rounded-2xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
              dayIdx === idx
                ? 'bg-slate-100 text-slate-950 border-slate-100 shadow-md shadow-white/5'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {day.day}
          </button>
        ))}
      </div>

      {/* Main Adaptive Routine Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header banner */}
        <div className="p-6 bg-slate-950 border-b border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-100">{d.label} Routine</h2>
            <p className="text-slate-400 text-xs">{d.focus}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeTheme.bg} ${badgeTheme.text} ${badgeTheme.border}`}>
              {d.type}
            </span>
            {d.duration !== '—' && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800">
                {d.duration}
              </span>
            )}
          </div>
        </div>

        {/* Exercises List */}
        <div className="p-6 space-y-6">
          
          {/* Warmup Sublist */}
          {d.warmup.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">🔥 Warmup Prep</span>
              <div className="grid grid-cols-1 gap-2">
                {d.warmup.map((ex, idx) => (
                  <ExerciseRow key={idx} ex={ex} onStartTimer={() => setActiveTimerEx(ex)} />
                ))}
              </div>
            </div>
          )}

          {/* Main Exercises Sublist */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">💪 Workout Exercises</span>
            <div className="grid grid-cols-1 gap-2">
              {d.exercises.map((ex, idx) => (
                <ExerciseRow key={idx} ex={ex} onStartTimer={() => setActiveTimerEx(ex)} />
              ))}
            </div>
          </div>

          {/* Stretches list */}
          {d.stretches.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">🧘 Restorative Stretches</span>
              <div className="flex flex-wrap gap-2">
                {d.stretches.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTimerEx({ name: s, reps: "25s Hold", timerSec: 25, totalSets: 1 })}
                    className="px-4 py-2 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 hover:text-emerald-300 text-xs rounded-xl font-semibold transition-all cursor-pointer"
                  >
                    🧘 {s}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Calf/Shin Splints Pain Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="font-extrabold text-slate-200 flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-400" />
          Pain & Soreness Guide
        </h3>
        <p className="text-slate-400 text-xs">
          Calf muscles often get sore, but sharp shin bone pain is a warning sign. Learn when it is safe to push and when to stop:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-1">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="h-4.5 w-4.5 shrink-0" />
              Safe to Train (Mild Soreness)
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Dull ache in the calf muscles that fades after warming up. Tightness that improves with calf stretch holds.
            </p>
          </div>
          <div className="p-3.5 bg-red-500/5 rounded-2xl border border-red-500/10 space-y-1">
            <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              Stop Immediately (Sharp Pain)
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Sharp, tender bone pain along the front/inner shin bone when walking or jogging. Limping or localized swelling.
            </p>
          </div>
        </div>
      </div>

      {/* ACTIVE COUNTDOWN/WORK TIMER MODAL */}
      {activeTimerEx && (
        <TimerModal
          ex={activeTimerEx}
          onClose={() => setActiveTimerEx(null)}
        />
      )}

    </div>
  );
}

// ─── INTERNAL COMPONENTS ─────────────────────────────────────────────────────

function ExerciseRow({ ex, onStartTimer }) {
  const isRest = ex.sets === '—';
  const hasTimer = ex.timerSec > 0 || ex.totalSets > 0;

  return (
    <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-2xl hover:border-slate-800 transition-colors">
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-slate-100">{ex.name}</h4>
        <div className="flex flex-wrap items-center gap-2">
          {ex.sets && !isRest && (
            <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md">
              {ex.sets} {ex.reps}
            </span>
          )}
          {ex.note && (
            <span className="text-[10px] text-slate-500 font-medium">{ex.note}</span>
          )}
        </div>
      </div>

      {!isRest && hasTimer && (
        <button
          onClick={onStartTimer}
          className="bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-[10px] py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          Track Set
        </button>
      )}
    </div>
  );
}

function TimerModal({ ex, onClose }) {
  const totalSets = ex.totalSets || 1;
  const isCountdown = ex.timerSec > 0;
  
  // Timer States
  const [phase, setPhase] = useState('idle'); // 'idle' | 'work' | 'rest' | 'done'
  const [setNum, setSetNum] = useState(1);
  
  const [remainSec, setRemainSec] = useState(ex.timerSec || 0); // work countdown
  const [elapsedSec, setElapsedSec] = useState(0); // work stopwatch count-up
  const [restSec, setRestSec] = useState(55); // Rest period: 55 seconds
  
  const timerRef = useRef(null);

  useEffect(() => {
    // Reset timer on load
    setRemainSec(ex.timerSec || 0);
    setElapsedSec(0);
    setRestSec(55);
  }, [ex]);

  // Master Clock effect
  useEffect(() => {
    clearInterval(timerRef.current);

    if (phase === 'work') {
      timerRef.current = setInterval(() => {
        if (isCountdown) {
          setRemainSec((r) => {
            if (r <= 1) {
              clearInterval(timerRef.current);
              handleWorkEnd();
              return 0;
            }
            return r - 1;
          });
        } else {
          setElapsedSec((e) => e + 1);
        }
      }, 1000);
    } else if (phase === 'rest') {
      timerRef.current = setInterval(() => {
        setRestSec((r) => {
          if (r <= 1) {
            clearInterval(timerRef.current);
            setSetNum((s) => s + 1);
            setRemainSec(ex.timerSec || 0);
            setElapsedSec(0);
            setRestSec(55);
            setPhase('work');
            return 55;
          }
          return r - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [phase, setNum]);

  const handleWorkEnd = () => {
    if (setNum >= totalSets) {
      setPhase('done');
    } else {
      setPhase('rest');
    }
  };

  const skipRest = () => {
    setSetNum((s) => s + 1);
    setRemainSec(ex.timerSec || 0);
    setElapsedSec(0);
    setRestSec(55);
    setPhase('work');
  };

  const formatMinSec = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  // SVG Ring calculation
  const getProgressPct = () => {
    if (phase === 'rest') return restSec / 55;
    if (isCountdown) return remainSec / ex.timerSec;
    return 1.0; // no percentage for count-ups
  };

  const pct = getProgressPct();
  const strokeDashoffset = 282 * (1 - pct);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 text-center space-y-6 shadow-2xl relative page-fade-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-slate-100">{ex.name}</h3>
          <p className="text-slate-400 text-xs">
            {phase === 'done' ? 'All Sets Complete!' : `Set ${setNum} of ${totalSets}`}
          </p>
        </div>

        {/* Set Progress Indicators */}
        {totalSets > 1 && phase !== 'done' && (
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: totalSets }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  i < setNum - 1
                    ? 'bg-green-500'
                    : i === setNum - 1
                    ? 'bg-blue-500 w-4'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        )}

        {/* Timer Ring */}
        <div className="py-2 flex justify-center">
          <div className="relative h-44 w-44 flex items-center justify-center rounded-full bg-slate-950 border-[6px] border-slate-850 shadow-inner">
            <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="4" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={phase === 'rest' ? '#10b981' : '#3b82f6'}
                strokeWidth="4"
                strokeDasharray={282}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 linear"
              />
            </svg>
            
            <div className="text-center space-y-1">
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                {phase === 'done' ? '🎉' : phase === 'rest' ? formatMinSec(restSec) : isCountdown ? formatMinSec(remainSec) : formatMinSec(elapsedSec)}
              </div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                {phase === 'done' ? 'Done' : phase === 'rest' ? 'Rest Time' : isCountdown ? 'Remaining' : 'Elapsed'}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="pt-2 flex gap-2">
          {phase === 'done' && (
            <button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              Finish Exercise ✓
            </button>
          )}

          {phase === 'rest' && (
            <button
              onClick={skipRest}
              className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-bold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1"
            >
              Skip Rest
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {(phase === 'idle' || phase === 'work') && (
            <>
              {phase === 'work' ? (
                <button
                  onClick={() => setPhase('idle')}
                  className="w-2/3 bg-amber-600/10 border border-amber-500/20 text-amber-500 font-bold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  Pause Set
                </button>
              ) : (
                <button
                  onClick={() => setPhase('work')}
                  className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  Start Set
                </button>
              )}

              {!isCountdown && phase === 'work' && (
                <button
                  onClick={handleWorkEnd}
                  className="w-1/3 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-300 font-bold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  Done
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

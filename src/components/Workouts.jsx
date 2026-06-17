import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

import { BASE_DAYS_PLAN, BADGE_THEMES, getAdaptiveDayPlan } from '../utils/workoutPlanner';
import { Play, Pause, RotateCcw, CheckCircle, AlertCircle, Info, Heart, ArrowRight, Minimize2, Maximize2, Calendar, ChevronRight } from 'lucide-react';

export default function Workouts({ setActiveTab }) {
  const { user, profile } = useAuth();
  
  // Set default tab to today's actual day of the week
  const [dayIdx, setDayIdx] = useState(() => {
    const day = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const map = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
    return map[day] !== undefined ? map[day] : 0;
  });
  
  const [activeTimerEx, setActiveTimerEx] = useState(null);

  // Synchronized workout session states
  const [activePlayerSteps, setActivePlayerSteps] = useState(null);
  const [currentPlayerStepIdx, setCurrentPlayerStepIdx] = useState(0);
  const [playerRunning, setPlayerRunning] = useState(false);
  const [playerTimeLeft, setPlayerTimeLeft] = useState(0);
  const [playerElapsed, setPlayerElapsed] = useState(0);
  const [playerMinimized, setPlayerMinimized] = useState(false);

  const playerTimerRef = useRef(null);

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

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (err) {
      console.warn("Could not play audio beep:", err);
    }
  };

  // Synchronized Player Timer Effect
  useEffect(() => {
    if (playerTimerRef.current) clearInterval(playerTimerRef.current);
    if (!activePlayerSteps) return;

    const currentStep = activePlayerSteps[currentPlayerStepIdx];

    if (playerRunning) {
      playerTimerRef.current = setInterval(() => {
        if (currentStep.timerSec > 0) {
          setPlayerTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(playerTimerRef.current);
              playBeep();
              // Go to next step automatically
              if (currentPlayerStepIdx < activePlayerSteps.length - 1) {
                const nextIdx = currentPlayerStepIdx + 1;
                setCurrentPlayerStepIdx(nextIdx);
                const nextStep = activePlayerSteps[nextIdx];
                setPlayerTimeLeft(nextStep.timerSec || 0);
                setPlayerElapsed(0);
              } else {
                setPlayerRunning(false);
              }
              return 0;
            }
            return prev - 1;
          });
        } else {
          setPlayerElapsed((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => {
      if (playerTimerRef.current) clearInterval(playerTimerRef.current);
    };
  }, [playerRunning, activePlayerSteps, currentPlayerStepIdx]);

  // Session autoplay check from Dashboard redirection
  useEffect(() => {
    const autoPlay = sessionStorage.getItem('auto_play_workout');
    if (autoPlay === 'true') {
      sessionStorage.removeItem('auto_play_workout');
      // Auto compile for today
      const currentPlan = getAdaptiveDayPlan(BASE_DAYS_PLAN[dayIdx], profile, recoveryScore);
      const steps = compileWorkoutSteps(currentPlan);
      startWorkoutSession(steps);
    }
  }, [dayIdx, profile, recoveryScore]);

  const startWorkoutSession = (steps) => {
    setActivePlayerSteps(steps);
    setCurrentPlayerStepIdx(0);
    setPlayerRunning(true);
    setPlayerTimeLeft(steps[0].timerSec || 0);
    setPlayerElapsed(0);
    setPlayerMinimized(false);
  };

  const stopWorkoutSession = () => {
    setActivePlayerSteps(null);
    setPlayerRunning(false);
  };

  const handleFinishWorkout = async () => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];
    
    const payload = {
      user_id: user.id,
      date: todayStr,
      workout_type: d?.type || 'General',
      completed_exercises: activePlayerSteps.map(s => ({ name: s.name, timerSec: s.timerSec })),
      duration_seconds: activePlayerSteps.reduce((acc, s) => acc + (s.timerSec || 0), 0),
      recovery_score_at_time: recoveryScore
    };

    try {
      await supabase.from('workout_logs').insert(payload);
    } catch (err) {
      console.error("Error inserting workout log:", err);
    }

    try {
      const saved = localStorage.getItem(`fitness_logs_${user.id}`);
      const logs = saved ? JSON.parse(saved) : { recovery: {}, water: {}, weight: [], workouts: {} };
      if (!logs.workouts) logs.workouts = {};
      logs.workouts[todayStr] = { type: d?.type || 'General', date: todayStr };
      localStorage.setItem(`fitness_logs_${user.id}`, JSON.stringify(logs));
    } catch (e) {
      console.error("Error saving local workout log:", e);
    }

    setActivePlayerSteps(null);
    setPlayerRunning(false);
    alert("Congratulations! Workout completed and logged.");
    if (setActiveTab) {
      setActiveTab('dashboard');
    }
  };

  const handleNextStep = () => {
    if (!activePlayerSteps) return;
    if (currentPlayerStepIdx < activePlayerSteps.length - 1) {
      const nextIdx = currentPlayerStepIdx + 1;
      setCurrentPlayerStepIdx(nextIdx);
      setPlayerTimeLeft(activePlayerSteps[nextIdx].timerSec || 0);
      setPlayerElapsed(0);
    }
  };

  const handlePrevStep = () => {
    if (!activePlayerSteps) return;
    if (currentPlayerStepIdx > 0) {
      const prevIdx = currentPlayerStepIdx - 1;
      setCurrentPlayerStepIdx(prevIdx);
      setPlayerTimeLeft(activePlayerSteps[prevIdx].timerSec || 0);
      setPlayerElapsed(0);
    }
  };

  const formatStopwatch = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const d = getAdaptiveDayPlan(BASE_DAYS_PLAN[dayIdx], profile, recoveryScore);
  const badgeTheme = BADGE_THEMES[d.type] || BADGE_THEMES.Rest;

  return (
    <div className="space-y-6 page-fade-in text-left">
      
      {/* ─── WORKOUT INTERVAL ROUTINE PLAYER CONTROL WIDGET ─── */}
      {activePlayerSteps ? (
        <div className="bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-900/30 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-lg ${playerRunning ? 'bg-blue-500/10 text-blue-400 animate-pulse' : 'bg-slate-950 text-slate-500'}`}>
              <Play className="h-4.5 w-4.5 text-blue-500 fill-current" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Active Session: {activePlayerSteps[currentPlayerStepIdx].section}</div>
              <div className="text-base font-extrabold text-slate-200 mt-0.5">{activePlayerSteps[currentPlayerStepIdx].name}</div>
              <p className="text-[11px] text-slate-400">{activePlayerSteps[currentPlayerStepIdx].note}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full md:w-auto gap-4">
            <div className="flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto pb-2 sm:pb-0 border-b sm:border-b-0 border-slate-800/60">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Remaining</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-100">
                {activePlayerSteps[currentPlayerStepIdx].timerSec > 0 
                  ? formatStopwatch(playerTimeLeft) 
                  : formatStopwatch(playerElapsed)}
              </div>
            </div>

            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={() => setPlayerRunning(!playerRunning)}
                className={`flex-1 sm:flex-none text-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${playerRunning ? 'bg-amber-600/10 text-amber-500 border border-amber-500/20' : 'bg-blue-600 text-white shadow-blue-500/10'}`}
              >
                {playerRunning ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={handleNextStep}
                disabled={currentPlayerStepIdx === activePlayerSteps.length - 1}
                className="flex-1 sm:flex-none text-center justify-center bg-slate-950 hover:bg-slate-850 border border-slate-800 disabled:opacity-45 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={() => setPlayerMinimized(false)}
                className="flex-1 sm:flex-none text-center justify-center bg-blue-600/15 border border-blue-500/20 hover:bg-blue-600/25 px-3.5 py-2.5 rounded-xl text-xs font-bold text-blue-400 transition-all cursor-pointer flex items-center gap-1"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Maximize
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-500">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Workout Session Player</div>
              <div className="text-base font-extrabold text-slate-200 mt-0.5">Ready to start today's routine?</div>
              <p className="text-[11px] text-slate-400">Play the routine to track your walk/jog intervals and rest periods automatically.</p>
            </div>
          </div>

          <button
            onClick={() => {
              const steps = compileWorkoutSteps(d);
              startWorkoutSession(steps);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 px-5 rounded-2xl transition-all shadow-md uppercase tracking-wider flex items-center gap-2 justify-center cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Start Routine Player
          </button>
        </div>
      )}

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
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {d.duration !== '—' && (
              <button
                onClick={() => {
                  const steps = compileWorkoutSteps(d);
                  startWorkoutSession(steps);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Play Workout
              </button>
            )}
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

          {/* Active Personalization Adaptations Alert Box */}
          {((profile?.injuries && profile.injuries !== 'None') || (recoveryScore !== null && recoveryScore < 75)) ? (
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-indigo-400">
                <Heart className="h-3.5 w-3.5" />
                <span>Active Adaptations</span>
              </div>
              <ul className="space-y-1.5 text-slate-400 font-medium pl-5 list-disc">
                {profile?.injuries && profile.injuries !== 'None' && (
                  <li>
                    Body Pain Profile: <strong className="text-slate-300">{profile.injuries}</strong>. High-impact movements and strain vectors have been substituted with low-impact or pain-free exercises.
                  </li>
                )}
                {recoveryScore !== null && recoveryScore < 40 && (
                  <li>
                    Readiness Score: <strong className="text-slate-300">{recoveryScore}% (Red Zone)</strong>. Swapped to active rest, stretching, and mobility drills to support recovery.
                  </li>
                )}
                {recoveryScore !== null && recoveryScore >= 40 && recoveryScore < 75 && (
                  <li>
                    Readiness Score: <strong className="text-slate-300">{recoveryScore}% (Yellow Zone)</strong>. Set and volume configurations scaled back by 30% to prevent fatigue overload.
                  </li>
                )}
              </ul>
            </div>
          ) : (
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span>Standard Baseline Plan (No pain or fatigue logged)</span>
            </div>
          )}
          
          {/* Warmup Sublist */}
          {d.warmup.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs md:text-sm font-extrabold uppercase text-slate-300 tracking-wider block mt-2">Warmup Prep</span>
              <div className="grid grid-cols-1 gap-2">
                {d.warmup.map((ex, idx) => (
                  <ExerciseRow key={idx} ex={ex} onStartTimer={() => setActiveTimerEx(ex)} />
                ))}
              </div>
            </div>
          )}

          {/* Main Exercises Sublist */}
          <div className="space-y-3">
            <span className="text-xs md:text-sm font-extrabold uppercase text-slate-300 tracking-wider block mt-2">Workout Exercises</span>
            <div className="grid grid-cols-1 gap-2">
              {d.exercises.map((ex, idx) => (
                <ExerciseRow key={idx} ex={ex} onStartTimer={() => setActiveTimerEx(ex)} />
              ))}
            </div>
          </div>

          {/* Stretches list */}
          {d.stretches.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs md:text-sm font-extrabold uppercase text-slate-300 tracking-wider block mt-2">Restorative Stretches</span>
              <div className="flex flex-wrap gap-2">
                {d.stretches.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTimerEx({ name: s, reps: "25s Hold", timerSec: 25, totalSets: 1 })}
                    className="px-4 py-2 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 hover:text-emerald-300 text-xs rounded-xl font-semibold transition-all cursor-pointer"
                  >
                    {s}
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

      {/* CONTINUOUS WORKOUT SESSION PLAYER */}
      {activePlayerSteps && !playerMinimized && (
        <WorkoutPlayerModal
          steps={activePlayerSteps}
          activeIdx={currentPlayerStepIdx}
          handleNext={handleNextStep}
          handlePrev={handlePrevStep}
          onClose={stopWorkoutSession}
          onMinimize={() => setPlayerMinimized(true)}
          isRunning={playerRunning}
          setIsRunning={setPlayerRunning}
          timeLeft={playerTimeLeft}
          elapsed={playerElapsed}
          onFinish={handleFinishWorkout}
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-2xl hover:border-slate-800 transition-all gap-3">
      <div className="space-y-1.5 flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-100 break-words">{ex.name}</h4>
        <div className="flex flex-wrap items-center gap-2">
          {ex.sets && !isRest && (
            <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md shrink-0">
              {ex.sets} {ex.reps}
            </span>
          )}
          {ex.note && (
            <span className="text-[10px] text-slate-500 font-medium break-words leading-relaxed">{ex.note}</span>
          )}
        </div>
      </div>

      {!isRest && hasTimer && (
        <button
          onClick={onStartTimer}
          className="w-full sm:w-auto text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider whitespace-nowrap"
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 sm:p-6 text-center space-y-4 sm:space-y-6 shadow-2xl relative page-fade-in max-h-[92vh] overflow-y-auto">
        
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
          <div className="relative h-32 w-32 md:h-44 md:w-44 flex items-center justify-center rounded-full bg-slate-950 border-[6px] border-slate-850 shadow-inner">
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
              <div className="text-2xl md:text-3xl font-black font-mono tracking-tight text-white">
                {phase === 'done' ? 'COMPLETE' : phase === 'rest' ? formatMinSec(restSec) : isCountdown ? formatMinSec(remainSec) : formatMinSec(elapsedSec)}
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
              Finish Exercise
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

// ─── SEQUENTIAL WORKOUT SESSION PLAYER ENGINE ─────────────────────────────────

const compileWorkoutSteps = (dayPlan) => {
  const steps = [];

  // 1. Warmup Prep
  if (dayPlan.warmup && dayPlan.warmup.length > 0) {
    dayPlan.warmup.forEach((ex, idx) => {
      steps.push({
        id: `warmup-${idx}`,
        name: ex.name,
        section: 'Warmup Prep',
        note: ex.detail || ex.note || 'Prepare your muscles',
        timerSec: ex.timerSec || 0,
        setIndex: 1,
        totalSets: 1,
        isRest: false
      });
    });
  }

  // 2. Main Workout
  if (dayPlan.exercises && dayPlan.exercises.length > 0) {
    const intervalExs = dayPlan.exercises.filter(ex => ex.isInterval);
    const nonIntervalExs = dayPlan.exercises.filter(ex => !ex.isInterval);

    if (intervalExs.length > 0) {
      // Find max sets
      const maxSets = Math.max(...intervalExs.map(e => e.totalSets || 1));
      for (let s = 1; s <= maxSets; s++) {
        intervalExs.forEach((ex) => {
          if (s <= (ex.totalSets || 1)) {
            steps.push({
              id: `interval-work-${ex.name}-${s}`,
              name: ex.name,
              section: 'Main Workout (Intervals)',
              note: ex.note || `Set ${s} of ${ex.totalSets}`,
              timerSec: ex.timerSec || 0,
              setIndex: s,
              totalSets: ex.totalSets,
              isRest: false
            });
          }
        });
      }
    }

    // Add non-interval exercises
    nonIntervalExs.forEach((ex, idx) => {
      if (ex.name === "Rest & Recovery" || ex.sets === "—") return;

      const sets = ex.totalSets || 1;
      for (let s = 1; s <= sets; s++) {
        steps.push({
          id: `work-${ex.name}-${s}`,
          name: ex.name,
          section: 'Main Workout',
          note: `${ex.note ? ex.note + ' · ' : ''}Set ${s} of ${sets} ${ex.reps ? '· ' + ex.reps : ''}`,
          timerSec: ex.timerSec || 0, // 0 means stopwatch style
          setIndex: s,
          totalSets: sets,
          isRest: false
        });

        // Add rest step if not the last set of the last exercise
        if (s < sets || idx < nonIntervalExs.length - 1) {
          steps.push({
            id: `rest-${ex.name}-${s}`,
            name: 'Rest Period',
            section: 'Rest / Transition',
            note: `Catch your breath. Up next: ${s < sets ? `${ex.name} (Set ${s + 1})` : (nonIntervalExs[idx + 1] ? nonIntervalExs[idx + 1].name : 'Stretches')}`,
            timerSec: 45, // default rest duration
            setIndex: s,
            totalSets: sets,
            isRest: true
          });
        }
      }
    });
  }

  // 3. Restorative Stretches
  if (dayPlan.stretches && dayPlan.stretches.length > 0) {
    if (steps.length > 0) {
      steps.push({
        id: `rest-pre-stretch`,
        name: 'Rest & Prepare Stretches',
        section: 'Rest / Transition',
        note: `Prepare for: ${dayPlan.stretches[0]}`,
        timerSec: 15,
        setIndex: 1,
        totalSets: 1,
        isRest: true
      });
    }

    dayPlan.stretches.forEach((stretchName, idx) => {
      steps.push({
        id: `stretch-${idx}`,
        name: stretchName,
        section: 'Restorative Stretches',
        note: 'Hold static stretch · Focus on breathing',
        timerSec: 30, // default 30s stretch hold
        setIndex: 1,
        totalSets: 1,
        isRest: false
      });

      if (idx < dayPlan.stretches.length - 1) {
        steps.push({
          id: `rest-stretch-${idx}`,
          name: 'Rest & Change Stretch',
          section: 'Rest / Transition',
          note: `Up next: ${dayPlan.stretches[idx + 1]}`,
          timerSec: 10,
          setIndex: 1,
          totalSets: 1,
          isRest: true
        });
      }
    });
  }

  return steps;
};

function WorkoutPlayerModal({
  steps,
  activeIdx,
  handleNext,
  handlePrev,
  onClose,
  onMinimize,
  isRunning,
  setIsRunning,
  timeLeft,
  elapsed,
  onFinish
}) {
  const step = steps[activeIdx];
  const total = steps.length;
  
  const progressPercent = ((activeIdx + 1) / total) * 100;
  const nextStep = activeIdx < total - 1 ? steps[activeIdx + 1] : null;

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-5 md:p-8 space-y-4 sm:space-y-6 shadow-2xl relative text-left page-fade-in max-h-[92vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex justify-between items-center pb-2">
          <div>
            <span className="text-[10px] font-bold uppercase text-blue-400 tracking-widest bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md">
              {step.section}
            </span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onMinimize}
              className="text-blue-400 hover:text-white font-bold text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850 cursor-pointer flex items-center gap-1 transition-all"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              Minimize
            </button>
            <button 
              onClick={onClose}
              className="text-red-400 hover:text-white font-bold text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850 cursor-pointer transition-all"
            >
              ✕ Quit
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span>Step {activeIdx + 1} of {total}</span>
            <span>{Math.round(progressPercent)}% Done</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850/50">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="py-3 sm:py-6 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-100 leading-tight">
            {step.name}
          </h2>
          
          <p className="text-xs text-slate-400 font-semibold max-w-sm leading-relaxed">
            {step.note}
          </p>

          {/* Large Clock */}
          <div className="py-2">
            <div className="relative h-32 w-32 md:h-44 md:w-44 flex items-center justify-center rounded-full bg-slate-950 border-[8px] border-slate-850 shadow-inner">
              {step.timerSec > 0 && (
                <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="4" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={step.isRest ? "#10b981" : "#3b82f6"}
                    strokeWidth="4"
                    strokeDasharray={282}
                    strokeDashoffset={282 - (282 * (timeLeft / step.timerSec))}
                    strokeLinecap="round"
                    className="transition-all duration-100"
                  />
                </svg>
              )}
              
              <div className="text-center z-10">
                <div className="text-3xl md:text-4xl font-black font-mono tracking-tight text-slate-100">
                  {step.timerSec > 0 ? formatTime(timeLeft) : formatTime(elapsed)}
                </div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  {step.timerSec > 0 ? (step.isRest ? 'REST' : 'COUNTDOWN') : 'STOPWATCH'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handlePrev}
              disabled={activeIdx === 0}
              className="bg-slate-950 hover:bg-slate-850 border border-slate-850 py-3 rounded-2xl text-xs font-bold text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              ← Prev
            </button>
            
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-lg ${
                isRunning 
                  ? 'bg-amber-600/10 text-amber-500 border border-amber-500/20 hover:bg-amber-600/20' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10'
              }`}
            >
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            
            <button
              onClick={handleNext}
              disabled={activeIdx === total - 1}
              className="bg-slate-950 hover:bg-slate-850 border border-slate-850 py-3 rounded-2xl text-xs font-bold text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              Next →
            </button>
          </div>

          {/* Up Next Preview Footer */}
          {nextStep ? (
            <div className="p-3 bg-slate-950/60 border border-slate-850/50 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Up Next:</span>
              <span className="text-slate-300 font-bold truncate max-w-[200px]">{nextStep.name}</span>
              <span className="text-[10px] text-slate-500 font-semibold">{nextStep.timerSec > 0 ? `${formatTime(nextStep.timerSec)}` : 'Reps'}</span>
            </div>
          ) : (
            <button
              onClick={onFinish}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-500/20"
            >
              <CheckCircle className="h-4.5 w-4.5 text-emerald-100" />
              Finish & Log Workout
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

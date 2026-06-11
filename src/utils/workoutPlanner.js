// Static base plan from original workout-chart.jsx
export const BASE_DAYS_PLAN = [
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

export const BADGE_THEMES = {
  Cardio: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  Strength: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  Recovery: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  "Fat Burn": { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  Rest: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
};

// ADAPTIVE WORKOUT GENERATION ENGINE (Pure Utility)
export const getAdaptiveDayPlan = (baseDay, profile, recoveryScore) => {
  let dayCopy = JSON.parse(JSON.stringify(baseDay)); // Deep copy to prevent modifying static data
  
  // 1. Injury / Pain Adjustments
  if (profile?.injuries && profile.injuries !== 'None') {
    const injury = profile.injuries;

    dayCopy.exercises = dayCopy.exercises.map((ex) => {
      // High impact conversion
      if (ex.highImpact && (injury === 'Shin/Calf Pain' || injury === 'Knee Pain' || injury === 'Ankle/Foot Pain' || injury === 'Hip/Groin Pain')) {
        return {
          ...ex,
          name: "Brisk Walk (low-impact interval)",
          note: `Substituted high-impact jog to protect your ${injury.replace(' Pain', '').toLowerCase()}`,
          highImpact: false,
          timerSec: ex.timerSec ? ex.timerSec + 60 : null
        };
      }

      // Specific exercise substitutions based on pain type
      if (ex.name === "Bodyweight Squats" || ex.name === "Squats") {
        if (injury === 'Knee Pain') {
          return { ...ex, name: "Quarter Squats (limited depth)", note: "Stop before 90 degrees to protect knee joint" };
        }
        if (injury === 'Lower Back Pain') {
          return { ...ex, name: "Wall Sit", note: "Squats substituted to eliminate spinal pressure" };
        }
      }

      if (ex.name === "Lunges") {
        if (injury === 'Knee Pain' || injury === 'Hip/Groin Pain') {
          return { ...ex, name: "Glute Bridges (strength alternative)", note: "Substituted lunges to prevent knee/hip strain" };
        }
      }

      if (ex.name === "Push-ups" || ex.name === "Plank") {
        if (injury === 'Elbow/Wrist Pain') {
          return { ...ex, name: "Plank (on forearms)", note: "Substituted to avoid wrist hyperextension" };
        }
        if (injury === 'Shoulder Pain') {
          return { ...ex, name: "Glute Bridges (core substitute)", note: "Substituted to protect rotator cuff" };
        }
        if (injury === 'Neck/Upper Back Pain') {
          return { ...ex, name: "Dead Bug (core substitute)", note: "Substituted to avoid neck strain" };
        }
      }

      return ex;
    });

    // Insert target warmup stretches depending on injury
    if (dayCopy.warmup.length > 0) {
      if (injury === 'Shin/Calf Pain' || injury === 'Ankle/Foot Pain') {
        dayCopy.warmup.push({ name: "Ankle Rotations & Calf Stretches", detail: "60 sec", timerSec: 60 });
      } else if (injury === 'Lower Back Pain') {
        dayCopy.warmup.push({ name: "Cat-Cow Stretch", detail: "60 sec", timerSec: 60 });
      } else if (injury === 'Knee Pain') {
        dayCopy.warmup.push({ name: "Quad stretches (supported)", detail: "60 sec", timerSec: 60 });
      } else if (injury === 'Shoulder Pain') {
        dayCopy.warmup.push({ name: "Shoulder rotations & arm swings", detail: "60 sec", timerSec: 60 });
      } else if (injury === 'Elbow/Wrist Pain') {
        dayCopy.warmup.push({ name: "Wrist mobility circles", detail: "60 sec", timerSec: 60 });
      } else if (injury === 'Hip/Groin Pain') {
        dayCopy.warmup.push({ name: "Butterfly Stretch & Hip Openers", detail: "60 sec", timerSec: 60 });
      } else if (injury === 'Neck/Upper Back Pain') {
        dayCopy.warmup.push({ name: "Neck rolls & upper back release", detail: "60 sec", timerSec: 60 });
      }
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
        { name: "Foam Roll / Massage", sets: "1×", reps: "5 min", timerSec: 300 }
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

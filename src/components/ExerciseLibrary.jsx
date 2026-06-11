import { useState } from 'react';
import { Search, Heart, Info, ArrowRight, ShieldCheck } from 'lucide-react';

const EXERCISES_DATA = [
  {
    name: "Bodyweight Squats",
    category: "Strength",
    target: "Quads, Glutes, Hamstrings",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Keep your heels flat on the floor, push your knees outwards, and descend until thighs are parallel to the ground. Maintain a neutral spine.",
    safetyNote: "Safe for calves. If experiencing knee pain, decrease depth to a quarter-squat. If lower back hurts, swap for a Wall Sit."
  },
  {
    name: "Calf Raises",
    category: "Strength",
    target: "Gastrocnemius, Soleus (Calves)",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Raise heels slowly as high as possible, hold for 1 second at peak, then lower slowly. Perform near a wall for balance.",
    safetyNote: "Crucial rehab movement for shin splints and Achilles stiffness. Keep movement slow and controlled."
  },
  {
    name: "Glute Bridges",
    category: "Strength",
    target: "Glutes, Hamstrings, Core",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Lie on your back, bend knees with feet flat, lift hips by squeezing glutes until knees, hips, and shoulders form a straight line.",
    safetyNote: "Excellent core/glute builder with zero spine loading and zero knee impact. Ideal substitution for squats/lunges."
  },
  {
    name: "Step-ups",
    category: "Strength",
    target: "Quads, Glutes, Calves",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Place one foot onto a stair or bench, push through the heel to lift your body, and step down slowly with control.",
    safetyNote: "Low joint impact, but control the eccentric step-down phase to avoid landing shock on heels/ankles."
  },
  {
    name: "Wall Sit",
    category: "Strength",
    target: "Quadriceps, Glutes",
    difficulty: "Beginner / Intermediate",
    impact: "Low Impact",
    tips: "Lean back against a wall, slide down until hips/knees are at 90-degree angles. Press your spine flat into the wall and hold.",
    safetyNote: "Static load with zero joint movement. Excellent alternative for active squats if knees or back are tender."
  },
  {
    name: "Push-ups",
    category: "Strength",
    target: "Chest, Anterior Deltoids, Triceps",
    difficulty: "Intermediate",
    impact: "Low Impact",
    tips: "Keep core engaged, elbows tucked at 45 degrees, and lower chest to floor. Do not let lower back sag.",
    safetyNote: "Can aggravate shoulder impingement. Swap to incline pushups to reduce loading, or forearms plank if wrists ache."
  },
  {
    name: "Dumbbell Rows",
    category: "Strength",
    target: "Lats, Rhomboids, Rear Delts",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Pull weight towards hip crease, keeping elbow close to side and chest square to the ground.",
    safetyNote: "Supports lower back by isolating upper body. Pull cleanly without jerking to prevent shoulder stress."
  },
  {
    name: "Shoulder Press",
    category: "Strength",
    target: "Deltoids, Triceps",
    difficulty: "Intermediate",
    impact: "Low Impact",
    tips: "Press dumbbells vertically from shoulders until arms lock overhead. Keep core tight to avoid hyperextending back.",
    safetyNote: "Avoid if experiencing acute shoulder/rotator cuff pain. Replace with lateral raises or band pull-aparts."
  },
  {
    name: "Bicep Curls",
    category: "Strength",
    target: "Biceps Brachii, Brachialis",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Keep elbows pinned to sides, curl dumbbell up fully, and lower with control. Avoid swinging hips.",
    safetyNote: "Very safe for knees, back, and shoulders. Keep wrist neutral to avoid strain."
  },
  {
    name: "Tricep Overhead Extension",
    category: "Strength",
    target: "Triceps Brachii",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Hold dumbbell overhead with both hands, lower weight behind head by bending elbows, then press back up.",
    safetyNote: "If shoulders pinch or feel restricted, substitute with tricep kickbacks or pushdowns."
  },
  {
    name: "Brisk Walk",
    category: "Cardio",
    target: "Cardiovascular System, Calves",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Walk with active arm swings and roll from heel to toe. Keep a speed where breathing is elevated but conversation is possible.",
    safetyNote: "The universal baseline cardio option. Highly recommended if recovering from knee, shin, or back injuries."
  },
  {
    name: "Jog (Interval)",
    category: "Cardio",
    target: "Cardiovascular System, Calves",
    difficulty: "Intermediate",
    impact: "High Impact",
    tips: "Maintain an upright posture, land gently on the midfoot (not heavy heel-striking), and keep steps short and quick.",
    safetyNote: "High bone impact. Avoid running on concrete or if recovering from shin, knee, or ankle soreness."
  },
  {
    name: "High Knees",
    category: "Cardio",
    target: "Cardiovascular System, Hip Flexors",
    difficulty: "Intermediate",
    impact: "High Impact",
    tips: "Run in place, lifting knees up to hip height. Stay light on your toes and pump arms actively.",
    safetyNote: "High ankle and knee stress. If joints are tender, swap to low-impact marching in place."
  },
  {
    name: "Mountain Climbers",
    category: "Cardio",
    target: "Cardiovascular System, Core",
    difficulty: "Intermediate",
    impact: "Low Impact",
    tips: "Start in pushup position, drive knees toward chest alternately. Keep hips low and shoulders directly over wrists.",
    safetyNote: "Engages wrists and shoulders statically. Rest on forearms or swap to bicycle crunches if wrists ache."
  },
  {
    name: "Plank",
    category: "Core",
    target: "Rectus Abdominis, Transverse Abdominis, Shoulders",
    difficulty: "Beginner / Intermediate",
    impact: "Low Impact",
    tips: "Support weight on forearms and toes. Keep the body in a straight line. Squeeze glutes and pull the belly button toward the spine.",
    safetyNote: "Great static core exercise. If lower back arches/hurts, raise hips slightly or drop knees to floor."
  },
  {
    name: "Dead Bug",
    category: "Core",
    target: "Deep Core, Hip Flexors",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Lie on back, arms pointing up, knees bent at 90 degrees. Lower opposite arm and leg toward the floor slowly, keeping lower back flat.",
    safetyNote: "Physiotherapy approved for lower back pain. Keeps the lumbar spine completely supported."
  },
  {
    name: "Russian Twists",
    category: "Core",
    target: "Obliques, Core",
    difficulty: "Intermediate",
    impact: "Low Impact",
    tips: "Sit with knees bent, lean torso back slightly, and rotate shoulders side to side. Keep chest high.",
    safetyNote: "Avoid or do slowly if recovering from lower back strains. Keep spine straight, do not round back."
  },
  {
    name: "Bird-Dog",
    category: "Core",
    target: "Glutes, Lower Back, Shoulder Stabilizers",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "On all fours, extend opposite arm and leg simultaneously, holding a flat back posture for 2 seconds.",
    safetyNote: "Superb for back stability. Avoid overextending the leg upward to prevent lower back arching."
  },
  {
    name: "Calf Stretch (Wall Hold)",
    category: "Recovery",
    target: "Gastrocnemius, Achilles Tendon",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Stand facing a wall, extend one leg back with heel flat on the floor, lean forward until you feel a gentle stretch in the calf.",
    safetyNote: "Reduces ankle stiffness and calf muscle tension. Highly advised after walks and jogs."
  },
  {
    name: "Cat-Cow Stretch",
    category: "Recovery",
    target: "Spine, Neck, Shoulders",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Alternate arching back toward ceiling (Cat) and dropping belly to floor while lifting head (Cow) on all fours.",
    safetyNote: "Improves spinal mobility. Move gently and hold positions where you feel tight, not painful."
  },
  {
    name: "Hamstring Stretch",
    category: "Recovery",
    target: "Hamstrings, Lower Back",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Sit on floor with one leg straight, bend opposite knee, and reach forward to toes. Keep spine long.",
    safetyNote: "Relieves pulling on the pelvis which directly helps reduce lower back aches. Do not force the reach."
  },
  {
    name: "Quad Stretch (Supported)",
    category: "Recovery",
    target: "Quadriceps, Hip Flexors",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Stand on one leg, hold wall for balance, bend knee and pull ankle to glute. Keep knees aligned.",
    safetyNote: "Protects knee caps by keeping quads flexible. Avoid pulling excessively if knee joint is inflamed."
  },
  {
    name: "Chest Opener Stretch",
    category: "Recovery",
    target: "Pectoralis Major, Anterior Deltoid",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Clasp hands behind back, pull shoulders down and back, and lift chest up towards the ceiling.",
    safetyNote: "Excellent for posture correction. Avoid if experiencing sharp rotator cuff pinch."
  }
];

export default function ExerciseLibrary() {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  const filtered = EXERCISES_DATA.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) || ex.target.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'All' || ex.category === filterCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 page-fade-in text-left">
      
      {/* Header Info */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Exercise Library</h1>
        <p className="text-slate-400 text-xs">Form guides, target muscles, and shin-safety ratings for all program exercises.</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search exercises or target muscles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
          />
        </div>

        {/* Filter categories */}
        <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 shrink-0">
          {['All', 'Strength', 'Cardio', 'Core', 'Recovery'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${filterCat === cat ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length > 0 ? (
          filtered.map((ex, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-850 hover:border-slate-800 p-5 rounded-3xl space-y-4 transition-all flex flex-col justify-between">
              
              <div className="space-y-2">
                {/* Title and Badges */}
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-extrabold text-base text-slate-100">{ex.name}</h3>
                  <div className="flex gap-1 shrink-0">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-950 text-slate-400 border border-slate-850">
                      {ex.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${ex.impact === 'Low Impact' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {ex.impact}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-bold uppercase">
                  Target: <span className="text-slate-300 font-normal">{ex.target}</span> · Difficulty: <span className="text-slate-300 font-normal">{ex.difficulty}</span>
                </div>

                {/* Tips */}
                <p className="text-xs text-slate-400 leading-relaxed pt-1">{ex.tips}</p>
              </div>

              {/* Joint Safety Panel */}
              <div className="p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider block">Joint & Pain Safety Guidance</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{ex.safetyNote}</p>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 bg-slate-900/40 border border-slate-900 rounded-3xl text-slate-500 text-xs">
            No matching exercises found in library.
          </div>
        )}
      </div>

    </div>
  );
}

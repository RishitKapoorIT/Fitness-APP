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
    shinSafety: "Excellent for building calf and leg stability without bone impact.",
  },
  {
    name: "Calf Raises",
    category: "Strength",
    target: "Gastrocnemius, Soleus (Calves)",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Raise heels slowly as high as possible, hold for 1 second at peak, then lower slowly. Perform near a wall for balance.",
    shinSafety: "Essential rehabilitation exercise for shin splints and calf strains. Strengthens lower leg tendon attachments.",
  },
  {
    name: "Glute Bridges",
    category: "Strength",
    target: "Glutes, Hamstrings, Core",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Lie on your back, bend knees with feet flat, lift hips by squeezing glutes until knees, hips, and shoulders form a straight line.",
    shinSafety: "Zero impact on shins or feet. Excellent posterior chain activation.",
  },
  {
    name: "Step-ups",
    category: "Strength",
    target: "Quads, Glutes, Calves",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Place one foot onto a stair or bench, push through the heel to lift your body, and step down slowly with control.",
    shinSafety: "Low impact, but control the eccentric step-down phase to avoid sudden calf landing shock.",
  },
  {
    name: "Wall Sit",
    category: "Strength",
    target: "Quadriceps, Glutes",
    difficulty: "Beginner / Intermediate",
    impact: "Low Impact",
    tips: "Lean back against a wall, slide down until hips/knees are at 90-degree angles. Press your spine flat into the wall and hold.",
    shinSafety: "Static holds have zero impact and help build muscular endurance in the legs.",
  },
  {
    name: "Brisk Walk (Interval)",
    category: "Cardio",
    target: "Cardiovascular System, Calves",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Walk with active arm swings and roll from heel to toe. Keep a speed where breathing is elevated but conversation is possible.",
    shinSafety: "The recommended replacement for jogging on days when shin pain or calf soreness is elevated.",
  },
  {
    name: "Jog (Interval)",
    category: "Cardio",
    target: "Cardiovascular System, Calves",
    difficulty: "Intermediate",
    impact: "High Impact",
    tips: "Maintain an upright posture, land gently on the midfoot (not heavy heel-striking), and keep steps short and quick.",
    shinSafety: "Caution: High impact forces can irritate shin splints. Limit volume and avoid running on concrete.",
  },
  {
    name: "Plank",
    category: "Core",
    target: "Rectus Abdominis, Transverse Abdominis, Shoulders",
    difficulty: "Beginner / Intermediate",
    impact: "Low Impact",
    tips: "Support weight on forearms and toes. Keep the body in a straight line. Squeeze glutes and pull the belly button toward the spine.",
    shinSafety: "Zero leg bone impact.",
  },
  {
    name: "Dead Bug",
    category: "Core",
    target: "Deep Core, Hip Flexors",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Lie on back, arms pointing up, knees bent at 90 degrees. Lower opposite arm and leg toward the floor slowly, keeping lower back flat.",
    shinSafety: "Zero joint pressure.",
  },
  {
    name: "Calf Stretch (Wall Hold)",
    category: "Recovery",
    target: "Gastrocnemius, Achilles Tendon",
    difficulty: "Beginner",
    impact: "Low Impact",
    tips: "Stand facing a wall, extend one leg back with heel flat on the floor, lean forward until you feel a gentle stretch in the calf.",
    shinSafety: "Highly recommended after every cardio or strength session to release calf tightness.",
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

              {/* Shin Safety Panel */}
              <div className="p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider block">Shin/Calf Safety</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{ex.shinSafety}</p>
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

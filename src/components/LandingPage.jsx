import { useState } from 'react';
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  METRIC_DEFINITIONS,
  ftInToCm,
  lbsToKg
} from '../utils/healthCalculators';
import { Activity, Zap, Award, Calendar } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  // Public Calculator States
  const [unitSystem, setUnitSystem] = useState('metric'); // 'metric' (India) or 'imperial' (USA)
  const [age, setAge] = useState('21');
  const [gender, setGender] = useState('male');
  
  // Weight & Height
  const [weightKg, setWeightKg] = useState('84');
  const [weightLbs, setWeightLbs] = useState('185');
  const [heightCm, setHeightCm] = useState('173');
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('8');
  
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [calcResult, setCalcResult] = useState(null);
  const [activeDef, setActiveDef] = useState('BMI'); // 'BMI' | 'BMR' | 'TDEE'

  const handleCalculate = (e) => {
    e.preventDefault();
    
    let w = parseFloat(weightKg);
    let h = parseFloat(heightCm);
    
    if (unitSystem === 'imperial') {
      w = parseFloat(lbsToKg(weightLbs));
      h = ftInToCm(parseInt(heightFt), parseInt(heightIn));
    }

    if (!w || !h || w <= 0 || h <= 0) return;

    const bmi = calculateBMI(w, h);
    const bmiCat = getBMICategory(bmi);
    const bmr = calculateBMR(w, h, parseInt(age), gender);
    const tdee = calculateTDEE(bmr, activityLevel);

    setCalcResult({
      bmi: bmi.toFixed(1),
      bmiLabel: bmiCat.label,
      bmiColor: bmiCat.textClass,
      bmiBg: bmiCat.bgClass,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      weight: unitSystem === 'metric' ? `${w} kg` : `${weightLbs} lbs`,
      height: unitSystem === 'metric' ? `${h} cm` : `${heightFt}'${heightIn}"`
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/15">
              <Activity className="h-4.5 w-4.5" />
            </span>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">Fitness Hub</span>
          </div>
          <button
            onClick={onGetStarted}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer"
          >
            Dashboard Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Zap className="h-3 w-3 text-blue-400" />
              <span>Recovery-First Intelligent Coaching</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Fitness Made{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Simple
              </span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-xl">
              Personalized workouts, recovery scores, and direct coach conversations that adjust dynamically to shin, calf, or knee soreness. Built with full Metric & Imperial configurations.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                Get Started Free ➔
              </button>
              <a
                href="#calculator"
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-8 py-3.5 rounded-2xl transition-all flex items-center justify-center cursor-pointer"
              >
                Try Quick Calculator
              </a>
            </div>
          </div>

          {/* Visual Mockup Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 flex-row">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-indigo-400" />
                  Daily Focus Card
                </span>
                <span className="text-[10px] bg-green-500/10 text-green-400 px-2.5 py-0.5 rounded-full font-bold border border-green-500/20">Optimal Recovery</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Recovery Score</div>
                  <div className="text-3xl font-extrabold text-green-400 mt-1">87<span className="text-xs text-slate-500">/100</span></div>
                  <div className="text-[10px] text-slate-400 mt-1">Green Zone: Train active</div>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">BMI Rating</div>
                  <div className="text-3xl font-extrabold text-blue-400 mt-1">24.2</div>
                  <div className="text-[10px] text-slate-400 mt-1">Healthy BMI range</div>
                </div>
              </div>
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Today's Plan:
                  </span>
                  <span className="text-blue-400 font-semibold">Interval Walk/Jog</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Workout generated automatically for Rishit. Heavy jogs reduced by 30% due to ongoing mild calf soreness.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 px-6 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold">All-In-One Fitness Architecture</h2>
            <p className="text-slate-400 text-sm">Everything you need to plan workouts, monitor recovery, prevent injuries, and hit target metrics safely.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Adaptive Workouts', desc: 'Schedules that adjust dynamically if you log physical soreness or pain (like calf splints).' },
              { title: 'Recovery Intelligence', desc: 'Calculates a daily readiness score based on sleep hours, energy, and muscle fatigue.' },
              { title: 'Health Metrics', desc: 'Track BMI, Basal Metabolic Rate (BMR), and Total Daily Energy Expenditure (TDEE) side by side.' },
              { title: 'AI Fitness Assistant', desc: 'Direct chat assistant powered by Gemini API, trained with your specific injury profile to guide safe movement.' }
            ].map((f, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 p-6 rounded-2xl hover:-translate-y-1 transition-all duration-300">
                <h3 className="font-extrabold text-lg text-slate-200 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Measurement & Calculator Section */}
      <section id="calculator" className="py-20 px-6 border-t border-slate-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Column 1: Definitions & Meanings */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold">Understand Your Body Metrics</h2>
              <p className="text-slate-400 text-sm">
                We believe in health education. Here is what each metric means and how we use them to tailor your fitness plans.
              </p>
            </div>

            {/* Selector Tabs */}
            <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
              {['BMI', 'BMR', 'TDEE'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveDef(type)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeDef === type ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Definitions Box */}
            <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl min-h-[240px] flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-lg font-bold text-blue-400">{METRIC_DEFINITIONS[activeDef].title}</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{METRIC_DEFINITIONS[activeDef].definition}</p>
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Clinical Meaning</span>
                  <p className="text-xs text-slate-400 leading-relaxed">{METRIC_DEFINITIONS[activeDef].clinicalMeaning}</p>
                </div>
              </div>
              {activeDef === 'BMI' && (
                <div className="grid grid-cols-4 gap-1.5 pt-2">
                  {METRIC_DEFINITIONS.BMI.ranges.map((r, idx) => (
                    <div key={idx} className={`${r.bg} p-2 rounded-xl text-center border border-white/5`}>
                      <div className={`text-[10px] font-bold ${r.color}`}>{r.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{r.range}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Public Calculator (Metric + Imperial) */}
          <div className="lg:col-span-6 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-900">
              <h3 className="font-extrabold text-lg text-slate-100">Quick Caloric Calculator</h3>
              
              {/* Unit switch */}
              <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex">
                <button
                  onClick={() => { setUnitSystem('metric'); setCalcResult(null); }}
                  className={`px-3 py-1 text-[10px] rounded-md font-bold transition-all ${unitSystem === 'metric' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Metric (kg/cm)
                </button>
                <button
                  onClick={() => { setUnitSystem('imperial'); setCalcResult(null); }}
                  className={`px-3 py-1 text-[10px] rounded-md font-bold transition-all ${unitSystem === 'imperial' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Imperial (lbs/ft)
                </button>
              </div>
            </div>

            <form onSubmit={handleCalculate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {unitSystem === 'metric' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight (kg)</label>
                      <input
                        type="number"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height (cm)</label>
                      <input
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight (lbs)</label>
                      <input
                        type="number"
                        value={weightLbs}
                        onChange={(e) => setWeightLbs(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height (Feet/In)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={heightFt}
                          onChange={(e) => setHeightFt(e.target.value)}
                          placeholder="ft"
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-xs focus:outline-none text-center"
                        />
                        <input
                          type="number"
                          value={heightIn}
                          onChange={(e) => setHeightIn(e.target.value)}
                          placeholder="in"
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-xs focus:outline-none text-center"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                >
                  <option value="sedentary">Sedentary (desk job, low physical activity)</option>
                  <option value="light">Light Active (daily walks, active standing)</option>
                  <option value="moderate">Moderately Active (workouts 3-5 days/week)</option>
                  <option value="active">Very Active (heavy workouts 6-7 days/week)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/10 cursor-pointer text-xs uppercase tracking-wider"
              >
                Compute Metrics
              </button>
            </form>

            {/* Results Grid */}
            {calcResult && (
              <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl grid grid-cols-3 gap-4 page-fade-in text-center">
                <div className="space-y-1">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">BMI</div>
                  <div className={`text-xl font-extrabold ${calcResult.bmiColor}`}>{calcResult.bmi}</div>
                  <div className={`text-[8px] font-semibold px-1 py-0.5 rounded-full inline-block ${calcResult.bmiBg}`}>{calcResult.bmiLabel}</div>
                </div>
                <div className="space-y-1 border-x border-slate-900">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">BMR (Rest)</div>
                  <div className="text-xl font-extrabold text-slate-200">{calcResult.bmr}</div>
                  <div className="text-[9px] text-slate-500">kcal/day</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">TDEE (Daily)</div>
                  <div className="text-xl font-extrabold text-blue-400">{calcResult.tdee}</div>
                  <div className="text-[9px] text-slate-500">kcal/day</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex justify-center gap-6 text-slate-400">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Plan</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms & Conditions</span>
            <span className="hover:text-white transition-colors cursor-pointer">Support</span>
          </div>
          <p>© 2026 Fitness Hub. Customized for Rishit Kapoor. Standalone MVP.</p>
          <div className="text-[10px] text-slate-600 font-mono italic">
            Consistency for 6 months &gt; Intensity for 10 days
          </div>
        </div>
      </footer>
    </div>
  );
}

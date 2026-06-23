import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ftInToCm, lbsToKg } from '../utils/healthCalculators';
import { Activity, AlertTriangle } from 'lucide-react';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Profile Setup Fields (Step 2 of Sign Up)
  const [step, setStep] = useState(1); // 1 = Account Info, 2 = Physical Details, 3 = Goals
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [unitSystem, setUnitSystem] = useState('metric'); // 'metric' = India (kg/cm), 'imperial' = USA (lbs/ft-in)
  
  // Weight & Height States
  const [weightKg, setWeightKg] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('General Health');
  const [injuries, setInjuries] = useState('None');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp && step === 1) {
      handleNextStep();
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Flow
        let finalWeight = 0;
        let finalHeight = 0;

        if (unitSystem === 'metric') {
          finalWeight = parseFloat(weightKg);
          finalHeight = parseFloat(heightCm);
        } else {
          finalWeight = parseFloat(lbsToKg(weightLbs));
          finalHeight = ftInToCm(parseInt(heightFt), parseInt(heightIn));
        }

        const parsedAge = parseInt(age);
        if (isNaN(parsedAge) || parsedAge <= 0) {
          setError('Please enter a valid age.');
          setLoading(false);
          return;
        }
        if (isNaN(finalWeight) || finalWeight <= 0) {
          setError('Please enter a valid weight.');
          setLoading(false);
          return;
        }
        if (isNaN(finalHeight) || finalHeight <= 0) {
          setError('Please enter a valid height.');
          setLoading(false);
          return;
        }

        const metadata = {
          name,
          age: parsedAge,
          gender,
          height_cm: finalHeight,
          weight_kg: finalWeight,
          activity_level: activityLevel,
          goal,
          injuries,
          unit_system: unitSystem,
          water_goal_liters: 3.0, // defaults
          protein_goal_grams: finalWeight * 1.0 > 80 ? Math.round(finalWeight * 1.2) : 80,
        };

        await signUp(email, password, metadata);
        alert('Verification email sent or account created! Please check your inbox or sign in.');
        setIsSignUp(false);
        setStep(1);
      } else {
        // Sign In Flow
        await signIn(email, password);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!email || !password || (isSignUp && !name)) {
      setError('Please fill in all account credentials.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handlePrevStep = () => {
    setError('');
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-4">
      {/* Background radial highlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative z-10 space-y-6 transition-all duration-300">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            RecoverFit
          </h2>
          <p className="text-slate-400 text-sm">
            {isSignUp ? 'Create your smart fitness & recovery profile' : 'Welcome back! Let\'s hit your goals today.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* STEP 1: Account Setup */}
          {step === 1 && (
            <div className="space-y-4 page-fade-in">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {isSignUp ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Continue Profile Setup ➔
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              )}
            </div>
          )}

          {/* STEP 2: Physical Metrics (USA/Imperial & India/Metric) */}
          {step === 2 && isSignUp && (
            <div className="space-y-4 page-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400">Step 2: Profile Settings</span>
                {/* Unit Switcher */}
                <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex">
                  <button
                    type="button"
                    onClick={() => setUnitSystem('metric')}
                    className={`px-3 py-1 text-[11px] rounded-md font-bold transition-all ${unitSystem === 'metric' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    India (Metric)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitSystem('imperial')}
                    className={`px-3 py-1 text-[11px] rounded-md font-bold transition-all ${unitSystem === 'imperial' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    USA (Imperial)
                  </button>
                </div>
              </div>

              {/* Age & Gender Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age (Years)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Height & Weight Inputs (Responsive / Unit-Based) */}
              <div className="grid grid-cols-2 gap-3">
                {unitSystem === 'metric' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight (kg)</label>
                      <input
                        type="number"
                        required={unitSystem === 'metric'}
                        min="20"
                        max="300"
                        step="0.1"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        placeholder="70"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height (cm)</label>
                      <input
                        type="number"
                        required={unitSystem === 'metric'}
                        min="50"
                        max="250"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="170"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight (lbs)</label>
                      <input
                        type="number"
                        required={unitSystem === 'imperial'}
                        min="40"
                        max="700"
                        step="0.1"
                        value={weightLbs}
                        onChange={(e) => setWeightLbs(e.target.value)}
                        placeholder="150"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height (Feet/In)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          required={unitSystem === 'imperial'}
                          min="2"
                          max="8"
                          value={heightFt}
                          onChange={(e) => setHeightFt(e.target.value)}
                          placeholder="ft"
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-sm focus:outline-none text-center"
                        />
                        <input
                          type="number"
                          required={unitSystem === 'imperial'}
                          min="0"
                          max="11"
                          value={heightIn}
                          onChange={(e) => setHeightIn(e.target.value)}
                          placeholder="in"
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-sm focus:outline-none text-center"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Goal Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                >
                  <option value="Fat Loss + Endurance">Fat Loss + Endurance</option>
                  <option value="Muscle Building">Muscle Building</option>
                  <option value="Endurance Running">Endurance Running</option>
                  <option value="General Health">General Health / Active Recovery</option>
                </select>
              </div>

              {/* Injury Concerns Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Injury Concerns</label>
                <select
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
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

              {/* Activity Level Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                >
                  <option value="sedentary">Sedentary (desk job, low movement)</option>
                  <option value="light">Light Active (daily walks, active standing)</option>
                  <option value="moderate">Moderately Active (exercise 3-5 days/week)</option>
                  <option value="active">Very Active (heavy workouts 6-7 days/week)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="bg-slate-950 border border-slate-800 hover:bg-slate-800/50 text-slate-300 font-semibold py-3 rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all"
                >
                  {loading ? 'Creating Profile...' : 'Complete Signup'}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Tab Toggle */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setStep(1);
              setError('');
            }}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}

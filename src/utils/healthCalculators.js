/**
 * Health Metric Calculators & Unit Conversion Utilities
 * Supports both India/Metric (kg, cm) and USA/Imperial (lbs, ft, in) systems.
 */

// ─── DEFINITIONS ─────────────────────────────────────────────────────────────
export const METRIC_DEFINITIONS = {
  BMI: {
    title: 'Body Mass Index (BMI)',
    definition: 'A simple index of weight-for-height that is commonly used to classify underweight, normal weight, overweight, and obesity in adults.',
    clinicalMeaning: 'BMI is an indicator of body fatness. It does not measure body fat directly but correlates closely with direct fat measures. Note: It may overestimate fat in muscular athletes and underestimate fat in older adults.',
    ranges: [
      { label: 'Underweight', range: '< 18.5', color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { label: 'Normal Weight', range: '18.5 – 24.9', color: 'text-green-500', bg: 'bg-green-500/10' },
      { label: 'Overweight', range: '25.0 – 29.9', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
      { label: 'Obese', range: '≥ 30.0', color: 'text-red-500', bg: 'bg-red-500/10' },
    ]
  },
  BMR: {
    title: 'Basal Metabolic Rate (BMR)',
    definition: 'The number of calories your body requires to perform basic, life-sustaining functions (like breathing, blood circulation, cell growth, and brain activity) at complete rest.',
    clinicalMeaning: 'BMR is your baseline energy burn. Think of it as the energy your body needs if you were to stay in bed all day. Knowing this helps you determine your daily caloric intake requirements.'
  },
  TDEE: {
    title: 'Total Daily Energy Expenditure (TDEE)',
    definition: 'An estimation of how many calories you burn per day when accounting for your Basal Metabolic Rate (BMR) plus daily physical activity, exercise, and the thermic effect of food.',
    clinicalMeaning: 'Your TDEE is the starting point for weight management. To maintain weight, consume equal to your TDEE. To lose weight (fat loss), eat at a deficit (e.g., TDEE - 500 kcal). To build muscle, eat at a surplus (TDEE + 300 kcal).'
  }
};

// ─── UNIT CONVERSIONS ────────────────────────────────────────────────────────
export const kgToLbs = (kg) => (parseFloat(kg) * 2.20462).toFixed(1);
export const lbsToKg = (lbs) => (parseFloat(lbs) * 0.453592).toFixed(1);

export const cmToFtIn = (cm) => {
  const inchesTotal = parseFloat(cm) / 2.54;
  const feet = Math.floor(inchesTotal / 12);
  const inches = Math.round(inchesTotal % 12);
  return { feet, inches };
};

export const ftInToCm = (feet, inches) => {
  const f = parseFloat(feet) || 0;
  const i = parseFloat(inches) || 0;
  return Math.round((f * 12 + i) * 2.54);
};

// ─── CALCULATORS ─────────────────────────────────────────────────────────────

/**
 * Calculates BMI (Body Mass Index)
 * Formula: weight (kg) / [height (m)]^2
 */
export const calculateBMI = (weightKg, heightCm) => {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm) / 100;
  if (!w || !h || w <= 0 || h <= 0) return 0;
  return w / (h * h);
};

/**
 * Get BMI category and styling config
 */
export const getBMICategory = (bmi) => {
  const b = parseFloat(bmi);
  if (b < 18.5) {
    return { label: 'Underweight', color: '#3B82F6', textClass: 'text-blue-500', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20' };
  }
  if (b < 25) {
    return { label: 'Normal', color: '#10B981', textClass: 'text-green-500', bgClass: 'bg-green-500/10', borderClass: 'border-green-500/20' };
  }
  if (b < 30) {
    return { label: 'Overweight', color: '#F59E0B', textClass: 'text-yellow-500', bgClass: 'bg-yellow-500/10', borderClass: 'border-yellow-500/20' };
  }
  return { label: 'Obese', color: '#EF4444', textClass: 'text-red-500', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/20' };
};

/**
 * Ideal weight range based on height (using healthy BMI boundaries of 18.5 and 24.9)
 */
export const getIdealWeightRange = (heightCm, isMetric = true) => {
  const h = parseFloat(heightCm) / 100;
  if (!h || h <= 0) return { min: 0, max: 0 };
  const minKg = 18.5 * h * h;
  const maxKg = 24.9 * h * h;
  if (isMetric) {
    return { min: minKg.toFixed(1), max: maxKg.toFixed(1) };
  } else {
    return { min: kgToLbs(minKg), max: kgToLbs(maxKg) };
  }
};

/**
 * Calculates BMR (Basal Metabolic Rate) using the Mifflin-St Jeor Equation
 * Male Formula: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
 * Female Formula: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
 */
export const calculateBMR = (weightKg, heightCm, age, gender = 'male') => {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  const a = parseInt(age);
  
  if (!w || !h || !a || w <= 0 || h <= 0 || a <= 0) return 0;
  
  if (gender.toLowerCase() === 'female') {
    return 10 * w + 6.25 * h - 5 * a - 161;
  }
  return 10 * w + 6.25 * h - 5 * a + 5;
};

/**
 * Calculates TDEE (Total Daily Energy Expenditure)
 * Multiplies BMR by an activity factor
 */
export const calculateTDEE = (bmr, activityLevel) => {
  const b = parseFloat(bmr);
  if (!b || b <= 0) return 0;
  
  const factors = {
    sedentary: 1.2,        // Little or no exercise
    light: 1.375,         // Light exercise 1-3 days/week
    moderate: 1.55,       // Moderate exercise 3-5 days/week
    active: 1.725,        // Hard exercise 6-7 days/week
    very_active: 1.9      // Very intense exercise daily or physical job
  };
  
  const factor = factors[activityLevel] || 1.2;
  return Math.round(b * factor);
};

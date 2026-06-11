# Goal Description

Upgrade the single-file React workout tracker (`workout-chart.jsx`) into a premium, responsive, database-driven fitness and recovery platform ("Fitness Hub") using Vite, Tailwind CSS, Supabase, and Gemini API. The app will feature a personalized workout generator, daily recovery intelligence to adapt workouts dynamically, health calculators (BMI/BMR/TDEE), progress tracking charts, water logs, and an AI coaching chat widget.

---

## User Review Required

Please review the following key decisions and requirements:

> [!IMPORTANT]
> **External API Credentials Required:**
> 1. **Supabase URL & Anon Key**: Go to [Supabase](https://supabase.com), create a free project, and provide these credentials for user profiles, workouts, recovery, and water tracking.
> 2. **Gemini API Key**: Go to [Google AI Studio](https://aistudio.google.com), create a free API key, and provide it for the AI Fitness Coach chat.

> [!WARNING]
> **Vite Initialization Overwrites & Restructure:**
> We will initialize a standard Vite + React project directly inside the `R:\Portfolio\Fitness APP` directory. We will backup your existing `workout-chart.jsx` to `backup-workout-chart.jsx` so we do not lose your original code. We will also initialize and configure Tailwind CSS.

---

## Open Questions

- **Authentication Choice**: Do you want Google OAuth login enabled from day one, or should we start with standard email/password authentication via Supabase and add Google Login later?
- **AI Coach Availability**: Do you prefer the AI coach to be a floating chat widget available on all screens, or a dedicated "Coach" tab/page?

---

## Proposed Changes

### Configuration and Setup

#### [NEW] [backup-workout-chart.jsx](file:///r:/Portfolio/Fitness%20APP/backup-workout-chart.jsx)
- Backup of the original single-file JSX tracker code before initialization.

#### [NEW] [package.json](file:///r:/Portfolio/Fitness%20APP/package.json)
- Define dependencies: React, Lucide-React, Recharts, React-Router-DOM, Supabase JS Client, and Tailwind CSS tools.

#### [NEW] [tailwind.config.js](file:///r:/Portfolio/Fitness%20APP/tailwind.config.js)
- Configure light/dark theme color palettes using:
  - Light mode: BG `#F8FAFC`, Cards `#FFFFFF`, Primary `#2563EB`, Success `#22C55E`, Warning `#F59E0B`, Danger `#EF4444`.
  - Dark mode: BG `#0F172A`, Cards `#1E293B`, Primary `#3B82F6`, Text `#F8FAFC`.

#### [NEW] [.env](file:///r:/Portfolio/Fitness%20APP/.env)
- Environment variables for `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_GEMINI_API_KEY`.

---

### Core Frontend Application

#### [NEW] [index.css](file:///r:/Portfolio/Fitness%20APP/src/index.css)
- Tailwind styles, CSS custom utility tokens, custom animations (fade-in, hover-lift, ring filling).

#### [NEW] [supabaseClient.js](file:///r:/Portfolio/Fitness%20APP/src/supabaseClient.js)
- Initialize and export the Supabase JS SDK client interface.

#### [NEW] [App.jsx](file:///r:/Portfolio/Fitness%20APP/src/App.jsx)
- Main application routing (Public landing page, Signup/Login, and Protected dashboard dashboard layout).

---

### UI Component Framework

#### [NEW] [LandingPage.jsx](file:///r:/Portfolio/Fitness%20APP/src/components/LandingPage.jsx)
- Premium hero header with title ("Fitness Made Simple"), animated floating badges, features grid, how-it-works progression timeline, and Get Started call to action.

#### [NEW] [Auth.jsx](file:///r:/Portfolio/Fitness%20APP/src/components/Auth.jsx)
- Login/Signup screen using Supabase authentication methods.

#### [NEW] [Dashboard.jsx](file:///r:/Portfolio/Fitness%20APP/src/components/Dashboard.jsx)
- Main user interface panel displaying key stats:
  - BMI progress bar, calculated BMR and TDEE.
  - Recovery Score dashboard card with colored status (Green/Yellow/Red).
  - Quick action to log daily water intake with circular progress ring.
  - Today's workout plan overview.

#### [NEW] [WorkoutPlan.jsx](file:///r:/Portfolio/Fitness%20APP/src/components/WorkoutPlan.jsx)
- Daily exercises tracker including:
  - Interactive timers modal (Interval walk/jog stopwatch, sets tracker).
  - Dynamic generator engine logic: Swaps high-impact joggers for stretches or walking if shin/calf pain is active or recovery is Red.

#### [NEW] [ExerciseLibrary.jsx](file:///r:/Portfolio/Fitness%20APP/src/components/ExerciseLibrary.jsx)
- Searchable list of exercise guides with difficulty indicators, target muscles, and Youtube embedded videos.

#### [NEW] [AICoach.jsx](file:///r:/Portfolio/Fitness%20APP/src/components/AICoach.jsx)
- Gemini-powered chat companion with system prompt custom-fitted to the user's profile and injury warnings.

#### [NEW] [Progress.jsx](file:///r:/Portfolio/Fitness%20APP/src/components/Progress.jsx)
- Detailed Recharts weight, BMI progress charts, and streak tracker.

---

## Verification Plan

### Automated Tests
- Build verification: Run `npm run build` to verify standard bundler success without TypeScript/syntax compilation errors.
- Test server runtime: Verify standard component hooks work during local hot-reloads.

### Manual Verification
- **Aesthetic check**: Test the UI theme toggle. Confirm colors map precisely to the light and dark palettes specified in Chat 3.
- **Form validation**: Enter invalid BMI parameters and confirm input boundaries.
- **Workflow verification**: Submit the morning check-in questionnaire, check recovery score calculation, and confirm the generated workout changes based on injury or low score reports.
- **Database syncing**: Verify logs correctly save records to Supabase tables on workout completion or water logger submissions.

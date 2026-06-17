# Fitness Hub MVP

A premium, responsive, and personalized **Fitness & Recovery Cockpit** built with Vite, React, Tailwind CSS v4, and Supabase. The app is designed to help you track daily health metrics, log morning recovery scores, generate customized workout schedules that adapt to calf/shin pain, and get real-time advice from an AI Fitness Coach.

---

## Key Features

*   **Dual-Unit Health Cockpit**: Automatically toggle between **India (Metric: kg/cm)** and **USA (Imperial: lbs/ft/in)** systems. Dynamically calculates BMI, BMR, and TDEE with descriptive medical tooltips.
*   **Morning Readiness & Recovery Score**: Start each day with a recovery questionnaire scoring your readiness from 0-100% based on sleep, energy, and localized leg soreness.
*   **Injury-Aware Workout Generator**: Adjusts training volume based on your recovery score. Substitutes high-impact running intervals for low-impact recovery walks and ankle mobility routines when pain points are active.
*   **Workout Routine Timer Player**: Live sequential routine player with automated transitions, sound alerts, rest cycles, and minimization background tracking controls.
*   **Context-Aware Gemini AI Coach**: Interactive assistant powered by **Gemini 1.5 Flash**. Automatically pre-loaded with your age, weight, target goals, and injury details for tailored safety guidance.
*   **Progress Charts**: Graphical weight tracking charts powered by Recharts, showing goal progression and historical trends.
*   **Water & Protein Trackers**: Seamlessly tracks daily hydration with self-healing offline sync and auto-calculates protein requirements based on target bodyweight.

---

## Tech Stack

*   **Frontend**: React (Vite)
*   **Styling**: Tailwind CSS v4 (native `@tailwindcss/vite` plugin compilation)
*   **Icons**: Lucide React
*   **Database & Auth**: Supabase DB with Row-Level Security (RLS) policies
*   **Charts**: Recharts
*   **AI Integration**: Google Gemini 1.5 Flash (Google AI Studio)

---

## Project Architecture

```
Fitness APP/
├── .agents/                 # Workspace agent skill hooks
├── src/
│   ├── components/
│   │   ├── LandingPage.jsx  # Public homepage & guest calculators
│   │   ├── Auth.jsx         # Supabase registration & wizard
│   │   ├── Dashboard.jsx    # Primary user dashboard & logs
│   │   ├── Workouts.jsx     # Timetable, timers, and stopwatches
│   │   ├── ExerciseLibrary.jsx # Safety database & form guides
│   │   └── AICoach.jsx      # Google Gemini coach chatbot panel
│   ├── contexts/
│   │   └── AuthContext.jsx  # Supabase Auth session & profile triggers
│   ├── utils/
│   │   └── healthCalculators.js # Standard BMR/BMI/TDEE math
│   │   └── workoutPlanner.js    # Adaptive routine logic
│   ├── App.jsx              # Navigation layout routing shell
│   ├── index.css            # Tailwind directives & global styling
│   ├── main.jsx             # React DOM bootstrapper
│   └── supabaseClient.js    # Supabase connection wrapper
├── supabase_schema.sql      # Database tables, triggers, and RLS rules
├── .env.example             # Template environment configurations
└── vite.config.js           # Vite server & bundler configuration
```

---

## Getting Started

### 1. Pre-requisites
Ensure you have **Node.js** installed.

### 2. Configure Environment Keys
Create a `.env` file in the root folder (or rename `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-google-ai-studio-api-key
```

### 3. Initialize the Database
Import the SQL script in `supabase_schema.sql` into the **Supabase SQL Editor** and execute it to set up the profile tables, recovery logger schemas, and auth registration listener triggers.

### 4. Install Dependencies & Launch
```bash
# Install packages
npm install

# Run the local developer server
npm run dev

# Build production distribution bundle
npm run build
```

---

## Security Hardening
All tables utilize Postgres Row-Level Security (RLS) to ensure users can only read or write their own private logs. The auth trigger function execution has been secured against public role RPC invocation attacks and restricted to secure database paths.

---

## Recent Enhancements

*   **Dynamic Onboarding Engine**: Re-engineered database trigger functions and onboarding flows to parse user-entered signup metadata dynamically, eliminating hardcoded profile templates.
*   **Complete Profile Isolation**: Sanitized all frontend fallbacks and default states. Every new user begins with a generic dashboard setup and clean registration form inputs, preventing any diagnostic or metric leaks between accounts.
*   **Mobile UX/UI Optimization**:
    *   **Viewport-Adaptive Modals**: Redesigned the *Workout Player* and *Countdown Timer* modal cards with height constraints (`max-h-[92vh]`) and vertical scroll containment (`overflow-y-auto`) to prevent UI overflow on smaller phone screens.
    *   **Responsive Vector Scales**: Circular timers and countdown clock rings scale down dynamically from `h-44` to `h-32` on narrow viewports.
    *   **Touch-Friendly Action Stacking**: Control blocks and action triggers stack vertically with equal-width grid buttons on mobile viewports for easy thumb access.
    *   **Layout Reflows**: Dashboard stats grids and streak widgets transition smoothly between horizontal grids (desktop) and border-separated vertical columns (mobile).


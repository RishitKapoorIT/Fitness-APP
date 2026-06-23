-- Supabase SQL Database Schema for Fitness Hub (MVP)

-- 1. Create Profiles Table (links to Supabase Auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  age integer,
  gender text,
  height_cm numeric not null,
  weight_kg numeric not null,
  activity_level text, -- 'sedentary', 'light', 'moderate', 'active', 'very_active'
  goal text, -- 'fat_loss', 'muscle_gain', 'endurance', 'general_fitness'
  injuries text, -- 'Shin/Calf Pain', 'Knee Pain', 'None', etc.
  water_goal_liters numeric default 3.0,
  protein_goal_grams numeric default 80.0,
  unit_system text default 'metric', -- 'metric' (India) or 'imperial' (USA)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- 2. Create Recovery Logs Table (tracks soreness, sleep, energy)
create table public.recovery_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date default current_date not null,
  soreness_level integer not null, -- 0 to 10 scale
  sleep_hours numeric not null,
  energy_level integer not null, -- 1 to 5 scale
  recovery_score integer not null, -- 0 to 100 calculation
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date) -- allows only one log per day
);

-- Enable RLS on Recovery Logs
alter table public.recovery_logs enable row level security;

create policy "Users can view their own recovery logs" on public.recovery_logs
  for select using (auth.uid() = user_id);

create policy "Users can create their own recovery logs" on public.recovery_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own recovery logs" on public.recovery_logs
  for update using (auth.uid() = user_id);

-- 3. Create Water Logs Table (tracks hydration cups/ml/liters)
create table public.water_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date default current_date not null,
  amount_liters numeric not null default 0.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date)
);

-- Enable RLS on Water Logs
alter table public.water_logs enable row level security;

create policy "Users can view their own water logs" on public.water_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert/update their own water logs" on public.water_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own water logs" on public.water_logs
  for update using (auth.uid() = user_id);

-- 4. Create Weight Logs Table (tracks progress for chart visualization)
create table public.weight_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date default current_date not null,
  weight_kg numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Weight Logs
alter table public.weight_logs enable row level security;

create policy "Users can view their own weight logs" on public.weight_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own weight logs" on public.weight_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can delete/update their own weight logs" on public.weight_logs
  for delete using (auth.uid() = user_id);

-- 5. Create Workout Logs Table (stores completed exercises)
create table public.workout_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date default current_date not null,
  workout_type text not null, -- 'Cardio', 'Strength', 'Recovery', 'Fat Burn', 'Rest'
  completed_exercises jsonb not null default '[]'::jsonb, -- Array of objects: { name, sets_done, reps, duration_sec }
  duration_seconds integer not null default 0,
  recovery_score_at_time integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Workout Logs
alter table public.workout_logs enable row level security;

create policy "Users can view their own workout logs" on public.workout_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own workout logs" on public.workout_logs
  for insert with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, 
    name, 
    age,
    gender,
    height_cm, 
    weight_kg, 
    activity_level,
    goal,
    injuries,
    unit_system, 
    water_goal_liters, 
    protein_goal_grams
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    coalesce((new.raw_user_meta_data->>'age')::integer, 25),
    coalesce(new.raw_user_meta_data->>'gender', 'male'),
    coalesce((new.raw_user_meta_data->>'height_cm')::numeric, 170),
    coalesce((new.raw_user_meta_data->>'weight_kg')::numeric, 70),
    coalesce(new.raw_user_meta_data->>'activity_level', 'moderate'),
    coalesce(new.raw_user_meta_data->>'goal', 'General Health'),
    coalesce(new.raw_user_meta_data->>'injuries', 'None'),
    coalesce(new.raw_user_meta_data->>'unit_system', 'metric'),
    coalesce((new.raw_user_meta_data->>'water_goal_liters')::numeric, 3.0),
    coalesce((new.raw_user_meta_data->>'protein_goal_grams')::numeric, 80)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

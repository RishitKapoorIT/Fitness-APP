import { useState, useEffect, useRef } from "react";

// ─── EXERCISE DATA ───────────────────────────────────────────────────────────
const DAYS = [
  {
    day:"MON", label:"Monday", type:"Cardio", color:"#3B82F6", bg:"#EFF6FF",
    focus:"Walk + Jog Intervals", duration:"35 mins",
    warmup:[
      {name:"Slow Walk",      detail:"5 min",    timerSec:300},
      {name:"Ankle Rotations",detail:"30 sec",   timerSec:30},
      {name:"Arm Swings",     detail:"30 sec",   timerSec:30},
      {name:"Leg Swings",     detail:"30 sec",   timerSec:30},
    ],
    exercises:[
      {name:"Walk (interval)", sets:"7×", reps:"3 min each", timerSec:180, totalSets:7, note:"Brisk pace"},
      {name:"Jog (interval)",  sets:"7×", reps:"1 min each", timerSec:60,  totalSets:7, note:"Conversational pace"},
      {name:"Cool Down Walk",  sets:"1×", reps:"5 min",      timerSec:300, totalSets:1, note:""},
    ],
    stretches:["Calf Stretch","Hamstring Stretch","Quad Stretch"],
  },
  {
    day:"TUE", label:"Tuesday", type:"Strength", color:"#8B5CF6", bg:"#F5F3FF",
    focus:"Strength + Recovery Walk", duration:"35–40 mins",
    warmup:[{name:"Brisk Walk", detail:"15–20 min", timerSec:1080}],
    exercises:[
      {name:"Bodyweight Squats", sets:"3", reps:"12",          timerSec:null, totalSets:3, note:""},
      {name:"Calf Raises",       sets:"3", reps:"20",          timerSec:null, totalSets:3, note:""},
      {name:"Glute Bridges",     sets:"3", reps:"15",          timerSec:null, totalSets:3, note:""},
      {name:"Step-ups",          sets:"3", reps:"10 each leg", timerSec:null, totalSets:3, note:""},
      {name:"Wall Sit",          sets:"3", reps:"30 sec",      timerSec:30,   totalSets:3, note:"Rest 45–60s between"},
    ],
    stretches:["Calf Stretch","Quad Stretch"],
  },
  {
    day:"WED", label:"Wednesday", type:"Recovery", color:"#10B981", bg:"#ECFDF5",
    focus:"Active Recovery", duration:"30 mins",
    warmup:[],
    exercises:[{name:"Brisk Walk", sets:"1×", reps:"30 min", timerSec:1800, totalSets:1, note:"No jogging today"}],
    stretches:["Full Body Light Stretch","Ankle Mobility Circles"],
  },
  {
    day:"THU", label:"Thursday", type:"Cardio", color:"#3B82F6", bg:"#EFF6FF",
    focus:"Walk + Jog Intervals", duration:"35 mins",
    warmup:[
      {name:"Slow Walk",      detail:"5 min",  timerSec:300},
      {name:"Ankle Rotations",detail:"30 sec", timerSec:30},
      {name:"Arm Swings",     detail:"30 sec", timerSec:30},
      {name:"Leg Swings",     detail:"30 sec", timerSec:30},
    ],
    exercises:[
      {name:"Walk (interval)", sets:"7×", reps:"3 min each", timerSec:180, totalSets:7, note:"Brisk pace"},
      {name:"Jog (interval)",  sets:"7×", reps:"1 min each", timerSec:60,  totalSets:7, note:"Conversational pace"},
      {name:"Cool Down Walk",  sets:"1×", reps:"5 min",      timerSec:300, totalSets:1, note:""},
    ],
    stretches:["Calf Stretch","Hamstring Stretch","Quad Stretch"],
  },
  {
    day:"FRI", label:"Friday", type:"Strength", color:"#8B5CF6", bg:"#F5F3FF",
    focus:"Strength + Core", duration:"40 mins",
    warmup:[{name:"Walking Warmup", detail:"5 min", timerSec:300}],
    exercises:[
      {name:"Squats",        sets:"3", reps:"15",          timerSec:null, totalSets:3, note:""},
      {name:"Calf Raises",   sets:"3", reps:"20",          timerSec:null, totalSets:3, note:""},
      {name:"Glute Bridges", sets:"3", reps:"15",          timerSec:null, totalSets:3, note:""},
      {name:"Lunges",        sets:"3", reps:"8 each leg",  timerSec:null, totalSets:3, note:""},
      {name:"Wall Sit",      sets:"3", reps:"40 sec",      timerSec:40,   totalSets:3, note:""},
      {name:"Plank",         sets:"3", reps:"20–30 sec",   timerSec:25,   totalSets:3, note:"Core"},
      {name:"Dead Bug",      sets:"3", reps:"10 each side",timerSec:null, totalSets:3, note:"Core"},
    ],
    stretches:["Calf Stretch","Quad Stretch","Hamstring Stretch"],
  },
  {
    day:"SAT", label:"Saturday", type:"Fat Burn", color:"#F59E0B", bg:"#FFFBEB",
    focus:"Long Easy Walk", duration:"40–50 mins",
    warmup:[],
    exercises:[{name:"Easy Walk", sets:"1×", reps:"40–50 min", timerSec:2700, totalSets:1, note:"Steady, NOT fast"}],
    stretches:["Light Stretch"],
  },
  {
    day:"SUN", label:"Sunday", type:"Rest", color:"#6B7280", bg:"#F9FAFB",
    focus:"Full Rest", duration:"—",
    warmup:[],
    exercises:[{name:"Rest & Recovery", sets:"—", reps:"All day", timerSec:null, totalSets:0, note:"No guilt. Recovery = progress."}],
    stretches:[],
  },
];

const TYPE_BADGE = {
  Cardio:   {bg:"#DBEAFE", text:"#1D4ED8"},
  Strength: {bg:"#EDE9FE", text:"#6D28D9"},
  Recovery: {bg:"#D1FAE5", text:"#065F46"},
  "Fat Burn":{bg:"#FEF3C7", text:"#92400E"},
  Rest:     {bg:"#F3F4F6", text:"#374151"},
};

const DEFAULT_PROFILE = {
  name:"Rishit Kapoor", age:"21", weightKg:"84", heightCm:"173",
  goal:"Fat Loss + Endurance", injuries:"Shin/Calf Pain",
  level:"Beginner Runner", planWeek:"Week 1–2",
  waterGoal:"2.5–3L", proteinGoal:"80g",
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
function fmtTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}
function calcBMI(w, h) { const hm = h/100; return w/(hm*hm); }
function bmiCat(bmi) {
  if (bmi < 18.5) return {label:"Underweight", color:"#3B82F6", bg:"#EFF6FF"};
  if (bmi < 25)   return {label:"Normal",       color:"#10B981", bg:"#ECFDF5"};
  if (bmi < 30)   return {label:"Overweight",   color:"#F59E0B", bg:"#FFFBEB"};
  return            {label:"Obese",             color:"#EF4444", bg:"#FEF2F2"};
}
function idealRange(hcm) { const h=hcm/100; return {min:(18.5*h*h).toFixed(1), max:(24.9*h*h).toFixed(1)}; }
function cmToFt(cm) { const i=cm/2.54; return {ft:Math.floor(i/12), inch:Math.round(i%12)}; }
function lbsToKg(l) { return (l*0.453592).toFixed(1); }
function kgToLbs(k) { return (k*2.20462).toFixed(1); }
function ftInToCm(ft, inch) { return Math.round(ft*30.48 + inch*2.54); }

// ─── SESSION STOPWATCH ───────────────────────────────────────────────────────
function SessionStopwatch({ color }) {
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs(s => s + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      background:"#fff", border:"1.5px solid #E2E8F0",
      borderRadius:14, padding:"12px 16px", marginBottom:14,
      boxShadow:"0 2px 8px #0F172A08"
    }}>
      <div style={{
        width:40, height:40, borderRadius:"50%",
        background: running ? `${color}18` : "#F1F5F9",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:18, flexShrink:0,
        boxShadow: running ? `0 0 0 4px ${color}22` : "none",
        transition:"all 0.3s"
      }}>⏱</div>
      <div style={{flex:1}}>
        <div style={{fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:1.2}}>Session Time</div>
        <div style={{
          fontSize:28, fontWeight:900, color: running ? "#0F172A" : "#94A3B8",
          fontVariantNumeric:"tabular-nums", letterSpacing:-1, lineHeight:1.1,
          fontFamily:"'Courier New', monospace"
        }}>{fmtTime(secs)}</div>
      </div>
      <div style={{display:"flex", gap:8}}>
        <button
          onClick={() => setRunning(r => !r)}
          style={{
            width:40, height:40, borderRadius:10, border:"none",
            background: running ? "#FEE2E2" : `${color}`,
            color: running ? "#EF4444" : "#fff",
            fontSize:16, cursor:"pointer", fontWeight:700,
            boxShadow: running ? "none" : `0 2px 8px ${color}55`
          }}>
          {running ? "⏸" : "▶"}
        </button>
        <button
          onClick={() => { setRunning(false); setSecs(0); }}
          style={{
            width:40, height:40, borderRadius:10,
            border:"1.5px solid #E2E8F0", background:"#F8FAFC",
            color:"#94A3B8", fontSize:16, cursor:"pointer"
          }}>↺</button>
      </div>
    </div>
  );
}

// ─── CIRCULAR RING ───────────────────────────────────────────────────────────
function Ring({ value, total, color, size, children }) {
  const R = (size/2) - 10;
  const circ = 2 * Math.PI * R;
  const pct = total > 0 ? Math.max(0, Math.min(1, value/total)) : 0;
  return (
    <div style={{position:"relative", width:size, height:size, margin:"0 auto"}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="#F1F5F9" strokeWidth={10}/>
        <circle cx={size/2} cy={size/2} r={R} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{transition:"stroke-dashoffset 0.9s linear"}}
        />
      </svg>
      <div style={{
        position:"absolute", inset:0, display:"flex",
        flexDirection:"column", alignItems:"center", justifyContent:"center"
      }}>{children}</div>
    </div>
  );
}

// ─── EXERCISE TIMER MODAL ────────────────────────────────────────────────────
function TimerModal({ ex, color, onClose }) {
  const REST = 52;
  const workSec = ex.timerSec || 0;
  const isCountdown = workSec > 0;
  const totalSets = ex.totalSets || 1;

  const [phase, setPhase]       = useState("idle");   // idle | work | rest | done
  const [setNum, setSetNum]     = useState(1);
  const [elapsed, setElapsed]   = useState(0);        // stopwatch (count up)
  const [remain, setRemain]     = useState(workSec);  // countdown
  const [restRemain, setRest]   = useState(REST);
  const ref = useRef(null);

  // master tick
  useEffect(() => {
    clearInterval(ref.current);
    if (phase === "work") {
      ref.current = setInterval(() => {
        if (isCountdown) {
          setRemain(r => {
            if (r <= 1) {
              clearInterval(ref.current);
              // move to rest or done
              if (setNum >= totalSets) { setPhase("done"); }
              else { setPhase("rest"); setRest(REST); }
              return 0;
            }
            return r - 1;
          });
        } else {
          setElapsed(e => e + 1);
        }
      }, 1000);
    } else if (phase === "rest") {
      ref.current = setInterval(() => {
        setRest(r => {
          if (r <= 1) {
            clearInterval(ref.current);
            setSetNum(n => n + 1);
            setRemain(workSec);
            setElapsed(0);
            setPhase("work");
            return REST;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(ref.current);
  }, [phase]);

  const handleStart = () => { setPhase("work"); };
  const handlePause = () => { setPhase("paused"); };
  const handleResume = () => { setPhase("work"); };
  const handleReset = () => {
    setPhase("idle"); setSetNum(1);
    setRemain(workSec); setElapsed(0); setRest(REST);
  };
  const handleDoneSet = () => {
    if (setNum >= totalSets) { setPhase("done"); }
    else { setPhase("rest"); setRest(REST); }
  };
  const handleSkipRest = () => {
    clearInterval(ref.current);
    setSetNum(n => n + 1);
    setRemain(workSec); setElapsed(0);
    setPhase("work");
  };

  const phaseColor = phase === "rest" ? "#10B981" : phase === "done" ? "#10B981" : color;

  // what to show in ring
  const ringVal   = phase === "rest" ? restRemain : isCountdown ? remain : elapsed;
  const ringTotal = phase === "rest" ? REST        : isCountdown ? workSec : Math.max(elapsed, 1);
  const ringPct   = phase === "rest" ? restRemain/REST : isCountdown ? remain/workSec : 1;

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"rgba(0,0,0,0.6)", zIndex:999,
      display:"flex", alignItems:"flex-end", justifyContent:"center"
    }}>
      <div style={{
        background:"#fff", borderRadius:"24px 24px 0 0",
        padding:"8px 22px 36px", width:"100%", maxWidth:480,
        boxSizing:"border-box", maxHeight:"95vh", overflowY:"auto"
      }}>
        {/* drag handle */}
        <div style={{width:40,height:4,background:"#E2E8F0",borderRadius:99,margin:"12px auto 18px"}}/>

        {/* header */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16}}>
          <div>
            <div style={{fontSize:20, fontWeight:800, color:"#0F172A"}}>{ex.name}</div>
            <div style={{fontSize:13, color:"#64748B", marginTop:2}}>{ex.reps} · {totalSets} set{totalSets>1?"s":""}</div>
          </div>
          <button onClick={onClose} style={{
            background:"#F1F5F9", border:"none", borderRadius:10,
            width:36, height:36, fontSize:15, cursor:"pointer", color:"#475569"
          }}>✕</button>
        </div>

        {/* set dots */}
        {totalSets > 1 && (
          <div style={{display:"flex", gap:7, justifyContent:"center", marginBottom:16}}>
            {Array.from({length:totalSets}).map((_,i) => (
              <div key={i} style={{
                width:11, height:11, borderRadius:"50%",
                background: i < setNum-1 ? "#10B981"
                          : i === setNum-1 ? phaseColor
                          : "#E2E8F0",
                transition:"background 0.3s"
              }}/>
            ))}
          </div>
        )}

        {/* phase label */}
        <div style={{textAlign:"center", marginBottom:16}}>
          <span style={{
            fontSize:12, fontWeight:700, padding:"4px 16px",
            borderRadius:20, textTransform:"uppercase", letterSpacing:1,
            background: phase==="rest"||phase==="done" ? "#D1FAE5" : `${phaseColor}18`,
            color: phaseColor
          }}>
            {phase==="idle"  ? `Set ${setNum} of ${totalSets} — Ready`
            :phase==="work"  ? `Set ${setNum} of ${totalSets} — GO!`
            :phase==="paused"? `Set ${setNum} of ${totalSets} — Paused`
            :phase==="rest"  ? "🧘 Rest"
            :                  "🎉 Done!"}
          </span>
        </div>

        {/* ring display */}
        {phase === "done" ? (
          <div style={{textAlign:"center", padding:"20px 0"}}>
            <div style={{fontSize:60}}>🎉</div>
            <div style={{fontSize:22, fontWeight:800, color:"#10B981", marginTop:8}}>All {totalSets} sets done!</div>
          </div>
        ) : (
          <Ring
            value={phase==="rest" ? restRemain : isCountdown ? remain : elapsed}
            total={phase==="rest" ? REST : isCountdown ? workSec : Math.max(elapsed, 1)}
            color={phaseColor} size={190}
          >
            <div style={{
              fontSize:38, fontWeight:900, color: phase==="done"?"#10B981":"#0F172A",
              fontFamily:"'Courier New', monospace", letterSpacing:-1, lineHeight:1
            }}>
              {phase==="rest" ? fmtTime(restRemain)
               : isCountdown  ? fmtTime(remain)
               :                fmtTime(elapsed)}
            </div>
            <div style={{fontSize:11, color:"#94A3B8", fontWeight:700, marginTop:4, textTransform:"uppercase", letterSpacing:1}}>
              {phase==="rest"   ? "Rest"
               :phase==="idle"  ? "Ready"
               :phase==="paused"? "Paused"
               :isCountdown     ? "Remaining"
               :                  "Elapsed"}
            </div>
          </Ring>
        )}

        {/* controls */}
        <div style={{marginTop:22, display:"flex", gap:10}}>
          {phase === "done" && (
            <button onClick={onClose} style={{flex:1, padding:"14px", borderRadius:12, border:"none", background:"#10B981", color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer"}}>
              Close ✓
            </button>
          )}
          {phase === "rest" && (
            <button onClick={handleSkipRest} style={{flex:1, padding:"14px", borderRadius:12, border:"1.5px solid #10B981", background:"#ECFDF5", color:"#10B981", fontWeight:700, fontSize:14, cursor:"pointer"}}>
              Skip Rest →
            </button>
          )}
          {(phase === "idle" || phase === "paused" || phase === "work") && (
            <>
              <button onClick={handleReset} style={{
                width:48, height:48, borderRadius:12, border:"1.5px solid #E2E8F0",
                background:"#F8FAFC", color:"#94A3B8", fontSize:18, cursor:"pointer"
              }}>↺</button>

              {phase === "work" ? (
                <button onClick={handlePause} style={{
                  flex:1, padding:"14px", borderRadius:12, border:"none",
                  background:"#FEF3C7", color:"#92400E",
                  fontWeight:800, fontSize:16, cursor:"pointer"
                }}>⏸ Pause</button>
              ) : (
                <button onClick={phase==="idle" ? handleStart : handleResume} style={{
                  flex:1, padding:"14px", borderRadius:12, border:"none",
                  background:`linear-gradient(135deg,${color},${color}bb)`,
                  color:"#fff", fontWeight:800, fontSize:16, cursor:"pointer",
                  boxShadow:`0 4px 14px ${color}55`
                }}>▶ {phase==="idle" ? "Start" : "Resume"}</button>
              )}

              {!isCountdown && phase !== "idle" && (
                <button onClick={handleDoneSet} style={{
                  width:56, height:48, borderRadius:12, border:"1.5px solid #E2E8F0",
                  background:"#F8FAFC", color:"#475569", fontSize:12, fontWeight:700, cursor:"pointer"
                }}>Done✓</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── WORKOUT TAB ─────────────────────────────────────────────────────────────
function WorkoutTab() {
  const [dayIdx, setDayIdx]       = useState(0);
  const [modal, setModal]         = useState(null);
  const d = DAYS[dayIdx];
  const badge = TYPE_BADGE[d.type];

  const ExRow = ({ ex, isWarmup }) => {
    const canTimer = ex.timerSec > 0 || ex.totalSets > 0;
    const isRest = d.type === "Rest";
    return (
      <div style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"11px 12px", background:"#FAFAFA",
        borderRadius:10, marginBottom:6,
        border:"1.5px solid #F1F5F9",
      }}>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontWeight:600, color:"#1E293B", fontSize:14}}>{ex.name}</div>
          <div style={{display:"flex", gap:7, marginTop:3, flexWrap:"wrap", alignItems:"center"}}>
            {!isRest && ex.sets && ex.sets !== "—" && (
              <span style={{fontSize:11, fontWeight:700, color:d.color, background:`${d.color}15`, padding:"1px 7px", borderRadius:6}}>
                {ex.sets}
              </span>
            )}
            <span style={{fontSize:11, color:"#64748B", fontWeight:600}}>{ex.reps || ex.detail || ""}</span>
            {ex.note ? <span style={{fontSize:10, color:"#94A3B8"}}>· {ex.note}</span> : null}
            {ex.timerSec ? <span style={{fontSize:10, color:"#94A3B8", fontWeight:600}}>⏱ {fmtTime(ex.timerSec)}</span> : null}
          </div>
        </div>
        {!isRest && canTimer && (
          <button
            onClick={() => setModal(ex)}
            style={{
              padding:"8px 14px", borderRadius:9, border:"none",
              background: `linear-gradient(135deg,${d.color},${d.color}bb)`,
              color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer",
              boxShadow:`0 2px 8px ${d.color}44`, whiteSpace:"nowrap", flexShrink:0
            }}>
            ▶ {ex.timerSec ? "Timer" : "Track"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <SessionStopwatch color={d.color} />

      {/* day pills */}
      <div style={{display:"flex", gap:6, marginBottom:14, flexWrap:"wrap"}}>
        {DAYS.map((dy,i) => (
          <button key={i} onClick={() => setDayIdx(i)} style={{
            padding:"7px 12px", borderRadius:10, cursor:"pointer", fontSize:12,
            fontWeight: dayIdx===i ? 700 : 500,
            border: dayIdx===i ? `2px solid ${dy.color}` : "2px solid transparent",
            background: dayIdx===i ? dy.bg : "#fff",
            color: dayIdx===i ? dy.color : "#475569",
            boxShadow: dayIdx===i ? `0 0 0 3px ${dy.color}22` : "0 1px 3px #0001",
          }}>{dy.day}</button>
        ))}
      </div>

      {/* day card */}
      <div style={{background:"#fff", borderRadius:16, overflow:"hidden", border:`1.5px solid ${d.color}33`, marginBottom:14, boxShadow:"0 4px 16px #0F172A0A"}}>
        <div style={{background:d.bg, padding:"16px 18px", borderBottom:`1px solid ${d.color}22`}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8}}>
            <div>
              <div style={{fontSize:20, fontWeight:800, color:d.color}}>{d.label}</div>
              <div style={{fontSize:13, fontWeight:600, color:"#0F172A", marginTop:1}}>{d.focus}</div>
            </div>
            <div style={{display:"flex", gap:6}}>
              <span style={{background:badge.bg, color:badge.text, fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, textTransform:"uppercase"}}>{d.type}</span>
              {d.duration!=="—" && <span style={{background:"#F1F5F9", color:"#475569", fontSize:10, fontWeight:600, padding:"3px 9px", borderRadius:20}}>⏱ {d.duration}</span>}
            </div>
          </div>
        </div>
        <div style={{padding:"14px 14px"}}>
          {d.warmup.length > 0 && (
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:1.5, marginBottom:8}}>🔥 Warmup</div>
              {d.warmup.map((w,i) => <ExRow key={i} ex={w} isWarmup />)}
            </div>
          )}
          <div style={{marginBottom: d.stretches.length ? 14 : 0}}>
            <div style={{fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:1.5, marginBottom:8}}>
              {d.type==="Rest" ? "📅 Today" : "💪 Exercises"}
            </div>
            {d.exercises.map((ex,i) => <ExRow key={i} ex={ex} />)}
          </div>
          {d.stretches.length > 0 && (
            <div>
              <div style={{fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:1.5, marginBottom:8}}>🧘 Cool Down</div>
              <div style={{display:"flex", flexWrap:"wrap", gap:7}}>
                {d.stretches.map((s,i) => (
                  <button key={i}
                    onClick={() => setModal({name:s, timerSec:25, totalSets:1, reps:"25 sec", sets:"1×", note:"Hold stretch"})}
                    style={{background:"#FFF7ED", border:"1.5px solid #FED7AA", borderRadius:20, padding:"6px 13px", fontSize:12, fontWeight:600, color:"#C2410C", cursor:"pointer"}}>
                    🧘 {s} ▶
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* pain guide */}
      <div style={{background:"#fff", borderRadius:12, padding:"12px 14px", border:"1px solid #FEE2E2", marginBottom:14}}>
        <div style={{fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:1.5, marginBottom:8}}>Pain Guide</div>
        <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
          {[{l:"Mild Soreness",ok:1},{l:"Tight Calves",ok:1},{l:"Heavy Legs",ok:1},{l:"Sharp Shin Pain",ok:0},{l:"Limping",ok:0},{l:"Pain While Jogging",ok:0}].map((x,i)=>(
            <span key={i} style={{background:x.ok?"#DCFCE7":"#FEE2E2", color:x.ok?"#166534":"#B91C1C", fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20}}>
              {x.ok?"✅":"❌"} {x.l}
            </span>
          ))}
        </div>
      </div>

      {/* week grid */}
      <div style={{background:"#fff", borderRadius:12, padding:"12px 14px", border:"1px solid #E2E8F0"}}>
        <div style={{fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10}}>Week At a Glance</div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5}}>
          {DAYS.map((dy,i)=>(
            <div key={i} onClick={()=>setDayIdx(i)} style={{
              cursor:"pointer", textAlign:"center", padding:"7px 2px", borderRadius:8,
              background: dayIdx===i ? dy.bg : "#F8FAFC",
              border:`1.5px solid ${dayIdx===i ? dy.color : "#E2E8F0"}`,
            }}>
              <div style={{fontSize:10, fontWeight:700, color: dayIdx===i ? dy.color : "#94A3B8"}}>{dy.day}</div>
              <div style={{width:7,height:7,borderRadius:"50%",background:dy.color,margin:"4px auto 0"}}/>
            </div>
          ))}
        </div>
      </div>

      {modal && <TimerModal ex={modal} color={d.color} onClose={() => setModal(null)} />}
    </div>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────
function ProfileTab() {
  const [p, setP] = useState(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_PROFILE);
  const bmi = calcBMI(parseFloat(p.weightKg), parseFloat(p.heightCm));
  const cat = bmiCat(bmi);
  const ideal = idealRange(parseFloat(p.heightCm));
  const tolose = (parseFloat(p.weightKg) - parseFloat(ideal.max)).toFixed(1);
  const {ft, inch} = cmToFt(parseFloat(p.heightCm));

  const F = (label, key) => (
    <div style={{marginBottom:12}}>
      <label style={{fontSize:10,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:3}}>{label}</label>
      <input value={draft[key]} onChange={e=>setDraft(v=>({...v,[key]:e.target.value}))}
        style={{width:"100%",padding:"9px 11px",borderRadius:8,border:"1.5px solid #E2E8F0",fontSize:14,fontWeight:500,color:"#1E293B",outline:"none",boxSizing:"border-box",background:"#FAFAFA"}}/>
    </div>
  );

  return (
    <div>
      <div style={{background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",borderRadius:16,padding:"20px 16px",marginBottom:14,color:"#fff",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,flexShrink:0}}>{p.name.charAt(0)}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:800}}>{p.name}</div>
          <div style={{fontSize:12,opacity:0.85,marginTop:1}}>{p.level} · {p.goal}</div>
        </div>
        <button onClick={()=>{setDraft(p);setEditing(true);}} style={{background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>✏️ Edit</button>
      </div>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {[{l:"Age",v:`${p.age} yrs`},{l:"Weight",v:`${p.weightKg} kg`,c:"#3B82F6"},{l:"Height",v:`${ft}'${inch}"`},{l:"BMI",v:bmi.toFixed(1),c:cat.color}].map((s,i)=>(
          <div key={i} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,padding:"9px 12px",flex:"1 1 70px"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{s.l}</div>
            <div style={{fontSize:15,fontWeight:800,color:s.c||"#0F172A"}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{background:cat.bg,border:`1px solid ${cat.color}44`,borderRadius:12,padding:"13px 14px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:cat.color,textTransform:"uppercase",letterSpacing:1}}>BMI Status</div>
            <div style={{fontSize:22,fontWeight:800,color:cat.color}}>{bmi.toFixed(1)} — {cat.label}</div>
          </div>
          <div style={{textAlign:"right",fontSize:12,color:"#475569"}}>
            <div>Ideal: <strong style={{color:"#10B981"}}>{ideal.min}–{ideal.max} kg</strong></div>
            {tolose>0 && <div style={{color:"#F59E0B",fontWeight:600}}>~{tolose} kg to lose</div>}
          </div>
        </div>
        <div style={{marginTop:10,height:8,background:"#E2E8F0",borderRadius:99,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${Math.min(100,((bmi-15)/25)*100)}%`,background:`linear-gradient(90deg,#10B981,${cat.color})`,borderRadius:99}}/>
        </div>
      </div>

      <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:"13px 14px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Goals & Info</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[{l:"🎯 Goal",v:p.goal},{l:"⚠️ Injury",v:p.injuries},{l:"💧 Water",v:p.waterGoal+"/day"},{l:"🥚 Protein",v:p.proteinGoal+"/day"}].map((x,i)=>(
            <div key={i} style={{background:"#F8FAFC",borderRadius:8,padding:"7px 10px"}}>
              <div style={{fontSize:10,color:"#94A3B8",fontWeight:600}}>{x.l}</div>
              <div style={{fontSize:12,fontWeight:700,color:"#1E293B",marginTop:1}}>{x.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:11,fontWeight:700,color:"#166534",marginBottom:6}}>📈 Realistic Progress</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["1 Month: ~2–4 kg","3 Months: ~6–10 kg","6 Months: ~12–20 kg"].map((t,i)=>(
            <span key={i} style={{background:"#DCFCE7",color:"#166534",fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20}}>{t}</span>
          ))}
        </div>
      </div>

      {editing && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#fff",borderRadius:16,padding:20,width:"100%",maxWidth:400,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:17,fontWeight:800,color:"#0F172A"}}>Edit Profile</div>
              <button onClick={()=>setEditing(false)} style={{background:"#F1F5F9",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:13}}>✕</button>
            </div>
            {F("Name","name")}{F("Age","age")}{F("Weight (kg)","weightKg")}{F("Height (cm)","heightCm")}
            {F("Goal","goal")}{F("Injury Notes","injuries")}{F("Fitness Level","level")}
            {F("Plan Week","planWeek")}{F("Water Goal","waterGoal")}{F("Protein Goal","proteinGoal")}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button onClick={()=>setEditing(false)} style={{flex:1,padding:"10px",borderRadius:8,border:"1.5px solid #E2E8F0",background:"#F8FAFC",color:"#475569",fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{setP(draft);setEditing(false);}} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",fontWeight:700,cursor:"pointer"}}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BMI TAB ─────────────────────────────────────────────────────────────────
function BMITab() {
  const [unit, setUnit] = useState("metric");
  const [wKg,setWKg]=useState("84"); const [wLbs,setWLbs]=useState("185");
  const [hCm,setHCm]=useState("173"); const [hFt,setHFt]=useState("5"); const [hIn,setHIn]=useState("8");
  const [res, setRes] = useState(null);
  const iStyle = {padding:"10px 11px",borderRadius:8,border:"1.5px solid #E2E8F0",fontSize:15,fontWeight:600,color:"#1E293B",outline:"none",background:"#FAFAFA",width:"100%",boxSizing:"border-box"};
  const lStyle = {fontSize:10,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:4};
  function calc() {
    let wkg,hcm;
    if(unit==="metric"){wkg=parseFloat(wKg);hcm=parseFloat(hCm);}
    else{wkg=parseFloat(lbsToKg(parseFloat(wLbs)));hcm=ftInToCm(parseFloat(hFt),parseFloat(hIn));}
    if(!wkg||!hcm||wkg<=0||hcm<=0) return;
    const bmi=calcBMI(wkg,hcm); const cat=bmiCat(bmi); const ideal=idealRange(hcm);
    setRes({bmi,cat,wkg,hcm,ideal,diff:(wkg-parseFloat(ideal.max)).toFixed(1)});
  }
  return (
    <div>
      <div style={{background:"#F1F5F9",borderRadius:10,padding:4,display:"flex",marginBottom:16,gap:4}}>
        {["metric","imperial"].map(u=>(
          <button key={u} onClick={()=>{setUnit(u);setRes(null);}} style={{flex:1,padding:"8px",borderRadius:7,border:"none",background:unit===u?"#fff":"transparent",color:unit===u?"#3B82F6":"#64748B",fontWeight:unit===u?700:500,fontSize:13,cursor:"pointer",boxShadow:unit===u?"0 1px 4px #0002":"none"}}>
            {u==="metric"?"🔢 Metric (kg/cm)":"🇺🇸 Imperial (lbs/ft)"}
          </button>
        ))}
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"14px 12px",border:"1px solid #E2E8F0",marginBottom:14}}>
        {unit==="metric" ? (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lStyle}>Weight (kg)</label><input style={iStyle} type="number" value={wKg} onChange={e=>setWKg(e.target.value)}/></div>
            <div><label style={lStyle}>Height (cm)</label><input style={iStyle} type="number" value={hCm} onChange={e=>setHCm(e.target.value)}/></div>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div><label style={lStyle}>Weight (lbs)</label><input style={iStyle} type="number" value={wLbs} onChange={e=>setWLbs(e.target.value)}/></div>
            <div><label style={lStyle}>Feet</label><input style={iStyle} type="number" value={hFt} onChange={e=>setHFt(e.target.value)}/></div>
            <div><label style={lStyle}>Inches</label><input style={iStyle} type="number" value={hIn} onChange={e=>setHIn(e.target.value)}/></div>
          </div>
        )}
        {unit==="imperial"&&<div style={{marginTop:8,fontSize:11,color:"#94A3B8",background:"#F8FAFC",borderRadius:7,padding:"5px 9px"}}>{wLbs&&`${wLbs} lbs = ${lbsToKg(parseFloat(wLbs))} kg`}{hFt&&` · ${hFt}'${hIn}" = ${ftInToCm(parseFloat(hFt||0),parseFloat(hIn||0))} cm`}</div>}
        <button onClick={calc} style={{marginTop:12,width:"100%",padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Calculate BMI →</button>
      </div>
      {res&&(()=>{const{bmi,cat,wkg,hcm,ideal,diff}=res; const bp=Math.min(98,Math.max(2,((bmi-15)/25)*100)); return(
        <div style={{background:cat.bg,border:`2px solid ${cat.color}55`,borderRadius:14,padding:"16px 14px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <div><div style={{fontSize:10,fontWeight:700,color:cat.color,textTransform:"uppercase",letterSpacing:1}}>Your BMI</div><div style={{fontSize:44,fontWeight:900,color:cat.color,lineHeight:1}}>{bmi.toFixed(1)}</div><div style={{fontSize:15,fontWeight:700,color:cat.color}}>{cat.label}</div></div>
            <div style={{textAlign:"right",fontSize:12,color:"#475569"}}><div>Ideal: <strong style={{color:"#10B981"}}>{ideal.min}–{ideal.max} kg</strong></div>{diff>0?<div style={{color:"#F59E0B",fontWeight:700}}>~{diff} kg above</div>:<div style={{color:"#10B981",fontWeight:700}}>In range! 🎉</div>}</div>
          </div>
          <div style={{marginTop:12,position:"relative",height:10,background:"linear-gradient(90deg,#3B82F6,#10B981 30%,#F59E0B 60%,#EF4444)",borderRadius:99}}>
            <div style={{position:"absolute",top:"50%",left:`${bp}%`,transform:"translate(-50%,-50%)",width:18,height:18,borderRadius:"50%",background:"#fff",border:`3px solid ${cat.color}`,boxShadow:`0 0 0 3px ${cat.color}33`}}/>
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:10}}>
            <span style={{background:"rgba(255,255,255,0.6)",borderRadius:8,padding:"3px 9px",fontSize:11,fontWeight:600,color:"#475569"}}>{wkg.toFixed(1)} kg = {kgToLbs(wkg)} lbs</span>
            <span style={{background:"rgba(255,255,255,0.6)",borderRadius:8,padding:"3px 9px",fontSize:11,fontWeight:600,color:"#475569"}}>{hcm} cm = {cmToFt(hcm).ft}'{cmToFt(hcm).inch}"</span>
          </div>
        </div>
      );})()}
      <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>BMI Scale</div>
        {[{l:"Underweight",r:"< 18.5",c:"#3B82F6"},{l:"Normal",r:"18.5–24.9",c:"#10B981"},{l:"Overweight",r:"25–29.9",c:"#F59E0B"},{l:"Obese",r:"≥ 30",c:"#EF4444"}].map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:s.c,flexShrink:0}}/>
            <span style={{fontSize:13,fontWeight:700,color:s.c,width:90}}>{s.l}</span>
            <span style={{fontSize:12,color:"#64748B",fontWeight:600}}>BMI {s.r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("workout");
  const tabs = [{id:"workout",label:"🏃 Workout"},{id:"profile",label:"👤 Profile"},{id:"bmi",label:"📊 BMI"}];
  return (
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif",background:"#F8FAFC",minHeight:"100vh",padding:"18px 14px 40px"}}>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#94A3B8",textTransform:"uppercase",marginBottom:3}}>Fat Loss + Endurance</div>
          <h1 style={{margin:0,fontSize:22,fontWeight:900,color:"#0F172A"}}>Rishit's Fitness Hub</h1>
        </div>
        <div style={{display:"flex",gap:5,marginBottom:18,background:"#F1F5F9",borderRadius:12,padding:4}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"9px 5px",borderRadius:9,border:"none",background:tab===t.id?"#fff":"transparent",color:tab===t.id?"#3B82F6":"#64748B",fontWeight:tab===t.id?700:500,fontSize:12,cursor:"pointer",boxShadow:tab===t.id?"0 1px 6px #0002":"none",transition:"all 0.15s"}}>{t.label}</button>
          ))}
        </div>
        {tab==="workout" && <WorkoutTab/>}
        {tab==="profile" && <ProfileTab/>}
        {tab==="bmi"     && <BMITab/>}
        <div style={{textAlign:"center",marginTop:18,fontSize:11,color:"#CBD5E1"}}>Consistency for 6 months &gt; Intensity for 10 days 💪</div>
      </div>
    </div>
  );
}

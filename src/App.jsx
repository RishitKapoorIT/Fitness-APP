import { useState } from 'react';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="h-16 w-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-blue-500/20">
          💪
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Fitness Hub
          </h1>
          <p className="text-slate-400 text-sm">
            Personalized fitness & recovery coach MVP setup is complete.
          </p>
        </div>

        <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-left font-mono space-y-2">
          <div className="text-green-400">✓ React & Vite active</div>
          <div className="text-green-400">✓ Tailwind CSS loaded</div>
          <div className="text-green-400">✓ Standalone repository ready</div>
        </div>

        <button className="w-full bg-blue-600 hover:bg-blue-500 transition-colors text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/20">
          Initializing Platform...
        </button>
      </div>
    </div>
  );
}

export default App;

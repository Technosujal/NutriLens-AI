import React, { useState } from 'react';
import { GlassWater, Plus, Droplet } from 'lucide-react';

export const WaterTracker = ({ logged = 0, goal = 2000, onLogWater }) => {
  const [customAmount, setCustomAmount] = useState('');
  const percent = Math.min(100, Math.round((logged / goal) * 100));

  const handleQuickAdd = (amount) => {
    if (onLogWater) {
      onLogWater(amount);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(customAmount);
    if (val && val > 0 && onLogWater) {
      onLogWater(val);
      setCustomAmount('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-glass dark:shadow-glassDark transition-all duration-300 flex flex-col md:flex-row items-center gap-6">
      
      {/* Animated Wave representation */}
      <div className="relative w-40 h-40 rounded-full border-4 border-blue-500/20 dark:border-blue-500/10 overflow-hidden flex flex-col items-center justify-center flex-shrink-0 bg-slate-50 dark:bg-slate-900/50">
        
        {/* Animated Water Body */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600/70 to-blue-400/80 transition-all duration-1000 ease-out"
          style={{ height: `${percent}%` }}
        >
          {/* Waves effect using custom CSS */}
          <div className="absolute -top-4 left-0 right-0 h-4 bg-transparent overflow-hidden">
            <svg
              viewBox="0 0 120 28"
              className="absolute w-[200%] h-full text-blue-400/80 animate-[wave_4s_linear_infinite]"
              style={{ transform: 'translateX(0)' }}
            >
              <path
                d="M0,15 C30,15 30,0 60,0 C90,0 90,15 120,15 C150,15 150,0 180,0 C210,0 210,15 240,15 L240,30 L0,30 Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
        </div>

        {/* Labels Overlay */}
        <div className="z-10 flex flex-col items-center justify-center text-center">
          <Droplet className={`w-8 h-8 ${percent > 40 ? 'text-white' : 'text-blue-500'} transition-colors duration-500 mb-1`} />
          <span className={`text-2xl font-extrabold ${percent > 40 ? 'text-white' : 'text-slate-800 dark:text-slate-100'} transition-colors duration-500`}>
            {logged}
          </span>
          <span className={`text-xs font-semibold uppercase ${percent > 40 ? 'text-blue-100' : 'text-slate-400'} transition-colors duration-500`}>
            / {goal} ml
          </span>
        </div>
      </div>

      {/* Control Buttons Panel */}
      <div className="flex-grow w-full flex flex-col justify-center">
        <div className="flex items-center space-x-2 mb-3">
          <GlassWater className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Water Tracker
          </h3>
        </div>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
          Hydration boosts metabolism and helps manage weight. Track your progress here.
        </p>

        {/* Quick Log Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => handleQuickAdd(250)}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-blue-500/20 dark:border-blue-500/10 hover:border-blue-500/40 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/15 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold text-sm transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + 250ml <span className="text-xs font-normal opacity-75 ml-1">(Cup)</span>
          </button>
          <button
            onClick={() => handleQuickAdd(500)}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-blue-500/20 dark:border-blue-500/10 hover:border-blue-500/40 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/15 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold text-sm transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + 500ml <span className="text-xs font-normal opacity-75 ml-1">(Bottle)</span>
          </button>
        </div>

        {/* Custom Logger Form */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Custom (e.g. 300)"
            className="flex-grow px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all"
          >
            Add
          </button>
        </form>
      </div>

      {/* Embedded waves styling */}
      <style>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default WaterTracker;

import React, { useState } from 'react';
import { GlassWater, Plus, Minus, Droplet, Sparkles, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../../hooks/useToast';
import { triggerConfetti } from '../UI/ConfettiEffect';

export const WaterTracker = ({ logged = 0, goal = 2500, onLogWater }) => {
  const [customAmount, setCustomAmount] = useState('');
  const { showToast } = useToast();
  const percent = Math.min(100, Math.round((logged / (goal || 2500)) * 100));
  const isHydrationGoalMet = percent >= 100;

  const handleQuickAdd = (amount) => {
    if (onLogWater) {
      onLogWater(amount);
      if (amount < 0) {
        showToast(`Subtracted ${Math.abs(amount)}ml water.`, 'info');
      } else if (amount > 0) {
        showToast(`Logged ${amount}ml water! Stay hydrated. 💧`, 'success');
        if (logged + amount >= goal && logged < goal) {
          triggerConfetti('Daily Hydration Goal Smashed! 🌊');
        }
      }
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(customAmount);
    if (val && val > 0 && onLogWater) {
      onLogWater(val);
      showToast(`Logged ${val}ml water!`, 'success');
      if (logged + val >= goal && logged < goal) {
        triggerConfetti('Daily Hydration Goal Smashed! 🌊');
      }
      setCustomAmount('');
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="glass-card p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden border border-teal-500/20 dark:border-teal-500/15"
    >
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Animated Wave Sphere / Bottle with rising bubbles */}
      <div className="relative w-40 h-40 rounded-3xl border-2 border-teal-500/40 dark:border-teal-500/30 overflow-hidden flex flex-col items-center justify-center flex-shrink-0 bg-slate-900/80 shadow-[0_0_25px_rgba(20,184,166,0.25)] group">
        
        {/* Multi-Layer Animated Water Body */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-teal-600 via-cyan-500 to-teal-400 transition-all duration-1000 ease-out"
          style={{ height: `${percent}%` }}
        >
          {/* Wave 1 */}
          <div className="absolute -top-3 left-0 right-0 h-6 bg-transparent overflow-hidden opacity-80">
            <svg
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              className="absolute w-[200%] h-full text-cyan-200 animate-wave-fast"
            >
              <path
                d="M0,10 C30,10 30,0 60,0 C90,0 90,10 120,10 L120,20 L0,20 Z"
                fill="currentColor"
              />
            </svg>
          </div>
          
          {/* Wave 2 (Deeper layer) */}
          <div className="absolute -top-2 left-0 right-0 h-5 bg-transparent overflow-hidden opacity-60">
            <svg
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              className="absolute w-[200%] h-full text-teal-300 animate-wave-slow"
            >
              <path
                d="M0,8 C25,12 35,4 65,8 C95,12 105,4 135,8 L135,20 L0,20 Z"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Bubbles */}
          <div className="absolute bottom-1 left-4 w-2 h-2 rounded-full bg-white/70 bubble-1" />
          <div className="absolute bottom-2 right-6 w-1.5 h-1.5 rounded-full bg-white/60 bubble-2" />
          <div className="absolute bottom-3 left-10 w-2.5 h-2.5 rounded-full bg-white/80 bubble-3" />
        </div>

        {/* Labels Overlay */}
        <div className="z-10 flex flex-col items-center justify-center text-center select-none">
          <Droplet className={`w-7 h-7 ${percent > 45 ? 'text-white animate-bounce' : 'text-teal-400'} transition-colors duration-500 mb-0.5 filter drop-shadow`} />
          <span className={`text-2xl font-black font-display ${percent > 45 ? 'text-white' : 'text-slate-100'} transition-colors duration-500 tracking-tight`}>
            {logged}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${percent > 45 ? 'text-teal-100' : 'text-slate-400'} transition-colors duration-500`}>
            / {goal} ml
          </span>
        </div>
      </div>

      {/* Control Buttons Panel */}
      <div className="flex-grow w-full flex flex-col justify-center space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center">
              <GlassWater className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Hydration Tracker
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">Optimal fluid balance & recovery</span>
            </div>
          </div>
          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
            isHydrationGoalMet 
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
              : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
          }`}>
            {isHydrationGoalMet ? <Trophy className="w-3 h-3 text-amber-400 mr-0.5" /> : <Sparkles className="w-3 h-3 mr-0.5" />}
            <span>{percent}% Target</span>
          </span>
        </div>

        {/* Quick Log Buttons with interactive pop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => handleQuickAdd(250)}
            className="flex items-center justify-center px-3 py-2.5 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 font-black text-xs border border-teal-500/20 hover:border-teal-500/40 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            250ml Glass
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => handleQuickAdd(500)}
            className="flex items-center justify-center px-3 py-2.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-black text-xs border border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            500ml Bottle
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => handleQuickAdd(750)}
            className="flex items-center justify-center px-3 py-2.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 font-black text-xs border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            750ml Flask
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => handleQuickAdd(-250)}
            className="flex items-center justify-center px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/15 text-slate-500 dark:text-slate-400 hover:text-rose-400 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
          >
            <Minus className="w-3.5 h-3.5 mr-1" />
            Undo 250ml
          </motion.button>
        </div>

        {/* Custom Logger Form */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2 pt-1">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Custom volume in ml (e.g. 350)"
            className="flex-grow px-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium"
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black rounded-2xl text-xs shadow-glowTeal transition-all cursor-pointer"
          >
            Add Water
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default WaterTracker;

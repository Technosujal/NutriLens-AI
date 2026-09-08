import React from 'react';
import { Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const CalorieRing = ({ consumed = 0, goal = 2000, remaining = 2000 }) => {
  const percentage = goal > 0 ? Math.min(100, Math.round((consumed / goal) * 100)) : 0;
  const isGoalReached = percentage >= 100;
  
  const radius = 88;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group border border-emerald-500/20 dark:border-emerald-500/15"
    >
      {/* Ambient animated background aura */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shadow-xs">
            <Flame className="w-5 h-5 text-emerald-400 fill-emerald-400/20 animate-flame" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Energy Balance
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">Today's Calorie Budget</span>
          </div>
        </div>
        
        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
          isGoalReached 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
            : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
        }`}>
          {isGoalReached ? <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-400" /> : <Sparkles className="w-3 h-3 mr-0.5" />}
          <span>{percentage}% Met</span>
        </span>
      </div>
      
      {/* SVG Circular Progress with Pulsing Rings */}
      <div className="relative flex items-center justify-center my-3 z-10">
        {/* Outer glowing ambient ring */}
        <div className="absolute w-[180px] h-[180px] rounded-full border border-emerald-500/10 dark:border-emerald-500/15 pointer-events-none" />

        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90 filter drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]"
        >
          {/* Background circle */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-slate-100 dark:text-slate-800/80"
          />
          {/* Progress circle */}
          <circle
            stroke="url(#calorieGradient)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />   {/* Emerald */}
              <stop offset="50%" stopColor="#14b8a6" />  {/* Teal */}
              <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan */}
            </linearGradient>
          </defs>
        </svg>

        {/* Center Labels */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <motion.span 
            key={remaining}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            className="text-3xl sm:text-4xl font-black font-display text-slate-900 dark:text-white tracking-tight"
          >
            {remaining}
          </motion.span>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider mt-0.5">
            kcal remaining
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs z-10">
        <div className="bg-slate-50/90 dark:bg-slate-900/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Consumed</span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-display">
            {consumed} <span className="text-[10px] font-normal text-slate-400">kcal</span>
          </span>
        </div>
        <div className="bg-slate-50/90 dark:bg-slate-900/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-right">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Daily Target</span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-display">
            {goal} <span className="text-[10px] font-normal text-slate-400">kcal</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default CalorieRing;

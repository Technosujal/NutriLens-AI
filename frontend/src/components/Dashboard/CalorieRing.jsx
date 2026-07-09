import React from 'react';
import { Flame } from 'lucide-react';

export const CalorieRing = ({ consumed = 0, goal = 2000, remaining = 2000 }) => {
  const percentage = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;
  
  const radius = 85;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-glass dark:shadow-glassDark transition-all duration-300">
      <div className="flex items-center space-x-2 mb-4">
        <Flame className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Calories Today
        </h3>
      </div>
      
      {/* SVG Circular Progress */}
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-slate-100 dark:text-slate-700"
          />
          {/* Progress circle */}
          <circle
            stroke="url(#calorieGradient)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />   {/* Emerald */}
              <stop offset="100%" stopColor="#14b8a6" /> {/* Teal */}
            </linearGradient>
          </defs>
        </svg>

        {/* Center Labels */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            {remaining}
          </span>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase mt-0.5">
            kcal remaining
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between w-full mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/40 text-xs">
        <div className="flex flex-col">
          <span className="text-slate-400 font-medium">Logged</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {consumed} <span className="text-xs font-normal text-slate-400">kcal</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-slate-400 font-medium">Daily Goal</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {goal} <span className="text-xs font-normal text-slate-400">kcal</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CalorieRing;

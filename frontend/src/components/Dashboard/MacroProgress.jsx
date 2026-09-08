import React from 'react';
import { Target, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const MacroProgress = ({
  protein = 0,
  proteinGoal = 150,
  carbs = 0,
  carbsGoal = 225,
  fat = 0,
  fatGoal = 55,
  fiber = 0,
  fiberGoal = 30,
}) => {
  const getPercentage = (value, goal) => {
    if (goal <= 0) return 0;
    return Math.min(100, Math.round((value / goal) * 100));
  };

  const macros = [
    {
      name: 'Protein',
      icon: '🍗',
      value: protein,
      goal: proteinGoal,
      percent: getPercentage(protein, proteinGoal),
      unit: 'g',
      colorClass: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_14px_rgba(59,130,246,0.4)]',
      bgClass: 'bg-blue-100/70 dark:bg-blue-950/40',
      textClass: 'text-blue-500 dark:text-blue-400',
    },
    {
      name: 'Carbs',
      icon: '🍞',
      value: carbs,
      goal: carbsGoal,
      percent: getPercentage(carbs, carbsGoal),
      unit: 'g',
      colorClass: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 shadow-[0_0_14px_rgba(245,158,11,0.4)]',
      bgClass: 'bg-amber-100/70 dark:bg-amber-950/40',
      textClass: 'text-amber-500 dark:text-amber-400',
    },
    {
      name: 'Fat',
      icon: '🥑',
      value: fat,
      goal: fatGoal,
      percent: getPercentage(fat, fatGoal),
      unit: 'g',
      colorClass: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.4)]',
      bgClass: 'bg-rose-100/70 dark:bg-rose-950/40',
      textClass: 'text-rose-500 dark:text-rose-400',
    },
    {
      name: 'Fiber',
      icon: '🥦',
      value: fiber,
      goal: fiberGoal,
      percent: getPercentage(fiber, fiberGoal),
      unit: 'g',
      colorClass: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.4)]',
      bgClass: 'bg-emerald-100/70 dark:bg-emerald-950/40',
      textClass: 'text-emerald-500 dark:text-emerald-400',
    },
  ];

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="glass-card p-6 flex flex-col justify-between border border-blue-500/20 dark:border-blue-500/15 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Macronutrients
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">Grams & Target Ratio</span>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          Daily Goals
        </span>
      </div>

      <div className="space-y-3.5">
        {macros.map((macro) => (
          <div key={macro.name} className="flex flex-col space-y-1.5 group">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200">
                <span className="text-sm group-hover:scale-125 transition-transform duration-200">{macro.icon}</span>
                <span className="font-display font-black text-xs">{macro.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-700 dark:text-slate-300 font-bold">
                  {macro.value}
                  <span className="text-slate-400 font-normal"> / {macro.goal}{macro.unit}</span>
                </span>
                <span className={`font-black text-[10px] px-1.5 py-0.2 rounded-md ${macro.bgClass} ${macro.textClass}`}>
                  {macro.percent}%
                </span>
              </div>
            </div>
            
            {/* Progress line with glowing smooth transition */}
            <div className={`w-full h-3 rounded-full ${macro.bgClass} overflow-hidden p-0.5 relative`}>
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${macro.colorClass}`}
                style={{ width: `${macro.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default MacroProgress;

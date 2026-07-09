import React from 'react';
import { Target } from 'lucide-react';

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
      value: protein,
      goal: proteinGoal,
      percent: getPercentage(protein, proteinGoal),
      unit: 'g',
      colorClass: 'bg-gradient-to-r from-rose-500 to-pink-500',
      bgClass: 'bg-rose-100 dark:bg-rose-950/20',
      textClass: 'text-rose-500',
    },
    {
      name: 'Carbs',
      value: carbs,
      goal: carbsGoal,
      percent: getPercentage(carbs, carbsGoal),
      unit: 'g',
      colorClass: 'bg-gradient-to-r from-amber-500 to-orange-500',
      bgClass: 'bg-amber-100 dark:bg-amber-950/20',
      textClass: 'text-amber-500',
    },
    {
      name: 'Fat',
      value: fat,
      goal: fatGoal,
      percent: getPercentage(fat, fatGoal),
      unit: 'g',
      colorClass: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      bgClass: 'bg-blue-100 dark:bg-blue-950/20',
      textClass: 'text-blue-500',
    },
    {
      name: 'Fiber',
      value: fiber,
      goal: fiberGoal,
      percent: getPercentage(fiber, fiberGoal),
      unit: 'g',
      colorClass: 'bg-gradient-to-r from-violet-500 to-purple-500',
      bgClass: 'bg-violet-100 dark:bg-violet-950/20',
      textClass: 'text-violet-500',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-glass dark:shadow-glassDark transition-all duration-300">
      <div className="flex items-center space-x-2 mb-6">
        <Target className="w-5 h-5 text-emerald-500" />
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Macronutrients
        </h3>
      </div>

      <div className="space-y-5">
        {macros.map((macro) => (
          <div key={macro.name} className="flex flex-col">
            <div className="flex items-center justify-between mb-1.5 text-sm">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {macro.name}
              </span>
              <span className="text-slate-400 font-medium">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  {macro.value}
                </span>
                /{macro.goal}
                <span className="text-xs font-normal"> {macro.unit}</span>
                <span className={`ml-2 text-xs font-bold ${macro.textClass}`}>
                  ({macro.percent}%)
                </span>
              </span>
            </div>
            
            {/* Progress line */}
            <div className={`w-full h-3 rounded-full ${macro.bgClass} overflow-hidden`}>
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${macro.colorClass}`}
                style={{ width: `${macro.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MacroProgress;

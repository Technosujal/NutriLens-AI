import React, { useState } from 'react';
import { Coffee, Apple, Pizza, Croissant, Trash2, Edit3, ChevronDown, Sparkles, Utensils, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MealItemCard = ({ meal, onDelete, onEdit }) => {
  const [detailsVisible, setDetailsVisible] = useState(false);

  const getMealIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return <Croissant className="w-5 h-5 text-amber-400" />;
      case 'lunch':
        return <Pizza className="w-5 h-5 text-emerald-400" />;
      case 'dinner':
        return <Pizza className="w-5 h-5 text-indigo-400" />;
      case 'snacks':
      case 'snack':
      default:
        return <Apple className="w-5 h-5 text-rose-400" />;
    }
  };

  const getMealBg = (type) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return 'bg-gradient-to-r from-amber-500/15 via-orange-500/5 to-transparent border-amber-500/20';
      case 'lunch':
        return 'bg-gradient-to-r from-emerald-500/15 via-teal-500/5 to-transparent border-emerald-500/20';
      case 'dinner':
        return 'bg-gradient-to-r from-indigo-500/15 via-purple-500/5 to-transparent border-indigo-500/20';
      case 'snacks':
      case 'snack':
      default:
        return 'bg-gradient-to-r from-rose-500/15 via-pink-500/5 to-transparent border-rose-500/20';
    }
  };

  const getHealthGrade = () => {
    const cals = meal.total_calories || 1;
    const prot = meal.total_protein || 0;
    const carbs = meal.total_carbs || 0;
    const fiber = meal.total_fiber || 0;
    const protRatio = (prot * 4) / cals;

    if (protRatio >= 0.25 && fiber >= 2.5) return { grade: 'A+', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', label: 'Nutrient Dense' };
    if (protRatio >= 0.20) return { grade: 'A', color: 'text-teal-400 bg-teal-500/15 border-teal-500/30', label: 'High Protein' };
    if (carbs > 45 && fiber < 2) return { grade: 'B-', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', label: 'High Glycemic' };
    return { grade: 'B+', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30', label: 'Balanced' };
  };

  const health = getHealthGrade();

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="glass-card hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200/80 dark:border-slate-800/80 group"
    >
      {/* Header banner */}
      <div className={`px-5 py-3.5 border-b flex items-center justify-between ${getMealBg(meal.meal_type)}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/60 dark:border-slate-800 group-hover:scale-110 transition-transform">
            {getMealIcon(meal.meal_type)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-black text-slate-900 dark:text-white capitalize text-sm font-display">
                {meal.meal_type}
              </h4>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${health.color}`}>
                {health.grade} • {health.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {meal.date
                ? new Date(typeof meal.date === 'string' && !meal.date.includes('T') ? `${meal.date}T00:00:00` : meal.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                : 'Today'}
            </p>
          </div>
        </div>

        {/* Meal total calories */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-xl font-black text-slate-900 dark:text-white font-display tracking-tight">
              {Math.round(meal.total_calories)}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">kcal</span>
          </div>
          
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-200/60 dark:border-slate-800">
            {onEdit && (
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit(meal)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Edit Meal"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(meal.id)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Delete Meal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Food items list */}
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
            <Utensils className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            <span className="text-slate-700 dark:text-slate-300">{meal.name || 'Food Breakdown'}</span>
          </h5>
          <button 
            onClick={() => setDetailsVisible(!detailsVisible)}
            className="flex items-center text-xs font-bold text-emerald-500 hover:text-emerald-400 hover:underline cursor-pointer"
          >
            {detailsVisible ? 'Hide' : 'Expand Details'} 
            <ChevronDown className={`w-3.5 h-3.5 ml-1 transform transition-transform duration-200 ${detailsVisible ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {meal.items && meal.items.length > 0 ? (
          <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/80">
            {meal.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`flex flex-col text-xs ${idx > 0 ? 'pt-2.5' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {item.food_name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Qty: {item.quantity} • {item.serving_size || '1 portion'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-800 dark:text-slate-200 text-xs">
                      {Math.round(item.calories)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal ml-0.5">kcal</span>
                  </div>
                </div>

                <AnimatePresence>
                  {detailsVisible && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-4 gap-1.5 mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 text-center text-[11px]"
                    >
                      <div className="bg-slate-50 dark:bg-slate-900/70 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Protein</span>
                        <span className="font-extrabold text-blue-500 dark:text-blue-400">{item.protein}g</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/70 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Carbs</span>
                        <span className="font-extrabold text-amber-500 dark:text-amber-400">{item.carbs}g</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/70 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Fat</span>
                        <span className="font-extrabold text-rose-500 dark:text-rose-400">{item.fat}g</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/70 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Fiber</span>
                        <span className="font-extrabold text-emerald-500 dark:text-emerald-400">{item.fiber || 0}g</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Logged meal item.</p>
        )}

        {/* Macros summary footer */}
        <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
          <div className="p-1.5 rounded-xl bg-blue-500/10 dark:bg-blue-950/40 border border-blue-500/20">
            <span className="text-[10px] text-blue-400 font-bold block">Protein</span>
            <span className="font-black text-slate-800 dark:text-slate-200">{meal.total_protein}g</span>
          </div>
          <div className="p-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20">
            <span className="text-[10px] text-amber-400 font-bold block">Carbs</span>
            <span className="font-black text-slate-800 dark:text-slate-200">{meal.total_carbs}g</span>
          </div>
          <div className="p-1.5 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/20">
            <span className="text-[10px] text-rose-400 font-bold block">Fat</span>
            <span className="font-black text-slate-800 dark:text-slate-200">{meal.total_fat}g</span>
          </div>
          <div className="p-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-400 font-bold block">Fiber</span>
            <span className="font-black text-slate-800 dark:text-slate-200">{meal.total_fiber || 0}g</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MealItemCard;

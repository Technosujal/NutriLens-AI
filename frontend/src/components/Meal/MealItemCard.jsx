import React, { useState } from 'react';
import { Coffee, Apple, Pizza, Croissant, Trash2, Edit3, ChevronDown } from 'lucide-react';

export const MealItemCard = ({ meal, onDelete, onEdit }) => {
  const [detailsVisible, setDetailsVisible] = useState(false);

  const getMealIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return <Croissant className="w-5 h-5 text-amber-500" />;
      case 'lunch':
        return <Pizza className="w-5 h-5 text-emerald-500" />;
      case 'dinner':
        return <Pizza className="w-5 h-5 text-indigo-500" />;
      case 'snacks':
      case 'snack':
      default:
        return <Apple className="w-5 h-5 text-rose-500" />;
    }
  };

  const getMealBg = (type) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/35';
      case 'lunch':
        return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/35';
      case 'dinner':
        return 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/35';
      case 'snacks':
      case 'snack':
      default:
        return 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/35';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      
      {/* Header banner */}
      <div className={`px-5 py-4 border-b flex items-center justify-between ${getMealBg(meal.meal_type)}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800/80">
            {getMealIcon(meal.meal_type)}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 capitalize">
              {meal.meal_type}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {new Date(meal.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Meal total calories */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              {meal.total_calories}
            </span>
            <span className="text-xs font-normal text-slate-400 ml-1">kcal</span>
          </div>
          
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-700/40">
            {onEdit && (
              <button
                onClick={() => onEdit(meal)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                title="Edit Meal"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(meal.id)}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                title="Delete Meal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Food items list */}
      <div className="p-5">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Items ({meal.name || 'Details'})
          </h5>
          <button 
            onClick={() => setDetailsVisible(!detailsVisible)}
            className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {detailsVisible ? 'Hide' : 'Show'} details 
            <ChevronDown className={`w-4 h-4 ml-1 transform transition-transform ${detailsVisible ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {meal.items && meal.items.length > 0 ? (
          <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-700">
            {meal.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`flex flex-col text-sm ${idx > 0 ? 'pt-2.5' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.food_name}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Qty: {item.quantity} • {item.serving_size || '1 portion'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {item.calories}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">kcal</span>
                  </div>
                </div>

                {detailsVisible && (
                  <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 text-center text-xs">
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-medium">Protein</span>
                      <span className="font-bold text-rose-500 dark:text-rose-400 mt-0.5">{item.protein}g</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-medium">Carbs</span>
                      <span className="font-bold text-amber-500 dark:text-amber-400 mt-0.5">{item.carbs}g</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-medium">Fat</span>
                      <span className="font-bold text-blue-500 dark:text-blue-400 mt-0.5">{item.fat}g</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-medium">Fiber</span>
                      <span className="font-bold text-violet-500 dark:text-violet-400 mt-0.5">{item.fiber}g</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No detailed items.</p>
        )}

        {/* Macros summary for this meal */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 text-center text-xs">
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Total Protein</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {meal.total_protein}g
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Total Carbs</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {meal.total_carbs}g
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Total Fat</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {meal.total_fat}g
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Total Fiber</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {meal.total_fiber || 0}g
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealItemCard;

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { BarChart3, Activity } from 'lucide-react';

export const DailyCalorieChart = ({ calorieData = [], proteinData = [], calorieGoal = 2000, proteinGoal = 150 }) => {
  const [activeTab, setActiveTab] = useState('calories');

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isCal = activeTab === 'calories';
      const val = payload[0].value;
      const goal = isCal ? calorieGoal : proteinGoal;
      const unit = isCal ? 'kcal' : 'g';
      
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/80 shadow-md">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
            {val} <span className="text-xs font-normal opacity-85">{unit}</span>
          </p>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-400 mt-1">
            Goal: {goal} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-glass dark:shadow-glassDark transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Nutritional Progress (7 Days)
          </h3>
        </div>
        
        {/* Tab switchers */}
        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('calories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === 'calories'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Calories
          </button>
          <button
            onClick={() => setActiveTab('protein')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === 'protein'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Protein
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'calories' ? (
            <BarChart data={calorieData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/35" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="calories"
                fill="url(#colorCalories)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <defs>
                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.15} />
                </linearGradient>
              </defs>
            </BarChart>
          ) : (
            <AreaChart data={proteinData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/35" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="protein"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProtein)"
              />
              <defs>
                <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyCalorieChart;

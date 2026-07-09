import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export const WeightTrendChart = ({ weightData = [], currentWeight = 70, targetWeight = 70 }) => {
  
  // Custom tooltip for weight logging
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const difference = (val - targetWeight).toFixed(1);
      const isOver = difference > 0;
      
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/80 shadow-md">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
            {val} <span className="text-xs font-normal opacity-85">kg</span>
          </p>
          {targetWeight > 0 && (
            <p className="text-xs font-medium mt-1">
              {difference == 0 ? (
                <span className="text-emerald-500 font-bold">Goal weight reached!</span>
              ) : isOver ? (
                <span className="text-blue-500">+{difference} kg to target</span>
              ) : (
                <span className="text-rose-500">{difference} kg below target</span>
              )}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Find min and max weights to scale Y Axis nicely
  const weights = weightData.map(d => d.weight).filter(w => w > 0);
  const minWeight = weights.length ? Math.min(...weights, targetWeight) - 2 : Math.max(0, targetWeight - 5);
  const maxWeight = weights.length ? Math.max(...weights, targetWeight) + 2 : targetWeight + 5;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-glass dark:shadow-glassDark transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Weight Trend
          </h3>
        </div>
        
        {targetWeight > 0 && (
          <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
            Goal: {targetWeight} kg
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weightData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/35" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              domain={[Math.floor(minWeight), Math.ceil(maxWeight)]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Target Weight Reference Line */}
            {targetWeight > 0 && (
              <ReferenceLine
                y={targetWeight}
                stroke="#3b82f6"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: 'Goal',
                  fill: '#3b82f6',
                  fontSize: 10,
                  position: 'insideBottomRight',
                  offset: 5
                }}
              />
            )}
            
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeightTrendChart;

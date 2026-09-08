import React from 'react';
import { Flame, Sparkles, Trophy, Zap, ChevronRight, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export const StreakBanner = ({ streakDays = 3, consistencyScore = 92, onQuickAction }) => {
  const motivationalQuotes = [
    "You're in the top 8% of athletes hitting their macro targets this week!",
    "Consistency creates momentum. Every logged meal is a step toward your goal!",
    "Your protein pacing is right on track for optimal recovery today.",
    "Hydration and nutrient timing are locked in. Keep up the high energy!"
  ];

  const randomQuote = motivationalQuotes[streakDays % motivationalQuotes.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 shadow-glass"
    >
      {/* Background glowing flare */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/3 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side: Fire badge & stats */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex flex-col items-center justify-center">
                <Flame className="w-6 h-6 text-amber-400 fill-amber-400/30 animate-flame" />
                <span className="text-[10px] font-black text-amber-300 -mt-0.5 font-display">{streakDays}d</span>
              </div>
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-white">
              ★
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                {streakDays} Day Nutrition Streak!
              </span>
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                • {consistencyScore}% Consistency
              </span>
            </div>
            <h3 className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
              Fueling Champion Habits 🔥
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-xl line-clamp-1 sm:line-clamp-none">
              {randomQuote}
            </p>
          </div>
        </div>

        {/* Right Side: Momentum Score & Quick Boost */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-amber-500/20">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">
              Weekly Momentum
            </span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <div className="w-20 sm:w-28 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-1000"
                  style={{ width: `${consistencyScore}%` }}
                />
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-display">
                {consistencyScore}%
              </span>
            </div>
          </div>

          {onQuickAction && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onQuickAction}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-md flex items-center space-x-1 flex-shrink-0 cursor-pointer"
            >
              <span>Boost</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StreakBanner;

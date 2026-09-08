import React, { useState } from 'react';
import { 
  Plus, Camera, Mic, Utensils, Droplets, Bot, Sparkles, 
  ArrowRightLeft, ShoppingBag, X, ChevronUp, ChevronDown, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerConfetti } from './ConfettiEffect';
import api from '../../services/api';
import useToast from '../../hooks/useToast';

export const FloatingActionDock = ({ 
  onOpenMealLog, 
  onOpenAICoach, 
  onOpenFoodSwap, 
  onOpenGroceryPlan,
  onWaterLogged
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const { showToast } = useToast();

  // Instant Quick Water logger from dock
  const handleQuickWater = async () => {
    try {
      setIsHydrating(true);
      const todayStr = new Date().toISOString().split('T')[0];
      await api.post('/water', { amount_ml: 250, date: todayStr });
      showToast('Hydration Boost: +250ml logged! 💧', 'success');
      triggerConfetti('+250ml Hydrated!');
      
      // Notify parent to refresh dashboard
      if (onWaterLogged) {
        onWaterLogged(250);
      }
      window.dispatchEvent(new CustomEvent('calorie_ai_data_updated', { detail: { type: 'water', amount_ml: 250 } }));
    } catch (err) {
      console.error(err);
      showToast('Failed to log water.', 'error');
    } finally {
      setTimeout(() => setIsHydrating(false), 600);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
      {/* Expanded Radial/Grid Quick Action Menu */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="mb-3 p-3 rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex items-center gap-2"
          >
            {/* Camera Food Vision */}
            <motion.button
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setIsExpanded(false);
                if (onOpenMealLog) onOpenMealLog('image');
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/80 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-400 border border-slate-700/60 hover:border-emerald-500/40 transition-all group"
              title="AI Camera Scan"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-1 text-emerald-400 group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black tracking-tight uppercase">Photo</span>
            </motion.button>

            {/* Voice Mic Log */}
            <motion.button
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setIsExpanded(false);
                if (onOpenMealLog) onOpenMealLog('voice');
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/80 hover:bg-teal-500/20 text-slate-200 hover:text-teal-300 border border-slate-700/60 hover:border-teal-500/40 transition-all group"
              title="Hands-free Voice Log"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center mb-1 text-teal-300 group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black tracking-tight uppercase">Voice</span>
            </motion.button>

            {/* Manual Text Log */}
            <motion.button
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setIsExpanded(false);
                if (onOpenMealLog) onOpenMealLog('text');
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 transition-all group"
              title="Text Natural Language Log"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-1 text-cyan-300 group-hover:scale-110 transition-transform">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black tracking-tight uppercase">Text Log</span>
            </motion.button>

            <div className="h-10 w-[1px] bg-slate-700/60 mx-1" />

            {/* Smart Food Swap */}
            <motion.button
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setIsExpanded(false);
                if (onOpenFoodSwap) onOpenFoodSwap();
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/80 hover:bg-purple-500/20 text-slate-200 hover:text-purple-300 border border-slate-700/60 hover:border-purple-500/40 transition-all group"
              title="Smart Food Swap"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center mb-1 text-purple-300 group-hover:scale-110 transition-transform">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black tracking-tight uppercase">Swap</span>
            </motion.button>

            {/* Smart Grocery Planner */}
            <motion.button
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setIsExpanded(false);
                if (onOpenGroceryPlan) onOpenGroceryPlan();
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/80 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-700/60 hover:border-amber-500/40 transition-all group"
              title="Smart Grocery Planner"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center mb-1 text-amber-300 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black tracking-tight uppercase">Groceries</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Glass Floating Island Dock */}
      <motion.div
        layout
        className="flex items-center space-x-1.5 p-1.5 rounded-full bg-slate-900/85 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/10 dark:border-emerald-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.5)]"
      >
        {/* Main Central Expand / Log Action Trigger */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-full font-black text-xs transition-all shadow-glowEmerald ${
            isExpanded
              ? 'bg-slate-800 text-slate-200 border border-slate-700'
              : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
          }`}
        >
          {isExpanded ? (
            <>
              <X className="w-4 h-4" />
              <span>Close</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 font-black" />
              <span>Log Meal</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />
            </>
          )}
        </motion.button>

        {/* Quick Hydrate Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleQuickWater}
          disabled={isHydrating}
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-teal-500/15 hover:bg-teal-500/30 border border-teal-500/30 text-teal-300 transition-all"
          title="Instant Hydration (+250ml)"
        >
          <Droplets className={`w-4 h-4 ${isHydrating ? 'animate-bounce text-cyan-200' : ''}`} />
          <span className="sr-only">Hydrate</span>
          <span className="absolute -top-1 -right-1 text-[9px] font-black px-1 rounded-full bg-teal-400 text-slate-950">
            +250
          </span>
        </motion.button>

        {/* Ask AI Coach Trigger */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (onOpenAICoach) onOpenAICoach();
          }}
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 transition-all"
          title="Ask AI Coach"
        >
          <Bot className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default FloatingActionDock;

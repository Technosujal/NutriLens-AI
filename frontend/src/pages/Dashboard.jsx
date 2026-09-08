import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Flame, AlertCircle, Info, Calendar, Sparkles, HelpCircle,
  Bot, RefreshCw, ShoppingBag, ArrowRightLeft, Target, TrendingUp, CheckCircle2, Zap, Utensils, Droplets, Camera, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import CalorieRing from '../components/Dashboard/CalorieRing';
import MacroProgress from '../components/Dashboard/MacroProgress';
import WaterTracker from '../components/Dashboard/WaterTracker';
import DailyCalorieChart from '../components/Dashboard/DailyCalorieChart';
import WeightTrendChart from '../components/Dashboard/WeightTrendChart';
import MealItemCard from '../components/Meal/MealItemCard';
import MealLogModal from '../components/Meal/MealLogModal';
import SmartFoodSwapModal from '../components/Dashboard/SmartFoodSwapModal';
import GroceryPlannerModal from '../components/AI/GroceryPlannerModal';
import { SkeletonDashboard } from '../components/UI/Skeleton';
import AnimatedButton from '../components/UI/AnimatedButton';
import FloatingActionDock from '../components/UI/FloatingActionDock';
import { triggerConfetti } from '../components/UI/ConfettiEffect';

const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

export const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [initialLogTab, setInitialLogTab] = useState('text');
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Determine greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Load dashboard aggregates
  const loadDashboard = async () => {
    try {
      const response = await api.get(`/dashboard?date=${selectedDate}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard details:', error);
      showToast('Could not load dashboard data. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const handleDataUpdated = () => {
      loadDashboard();
    };
    window.addEventListener('calorie_ai_data_updated', handleDataUpdated);
    return () => window.removeEventListener('calorie_ai_data_updated', handleDataUpdated);
  }, [selectedDate]);

  // Add water helper
  const handleLogWater = async (amount) => {
    const originalData = { ...dashboardData };
    const newAmount = Math.max(0, (dashboardData?.water_summary?.amount_ml || 0) + amount);

    // Optimistically update UI
    const updatedData = {
      ...dashboardData,
      water_summary: {
        ...dashboardData.water_summary,
        amount_ml: newAmount,
      },
    };
    setDashboardData(updatedData);

    try {
      await api.post('/water', { amount_ml: amount, date: selectedDate });
    } catch (error) {
      setDashboardData(originalData);
      console.error(error);
      showToast('Failed to record water. Try again.', 'error');
    }
  };

  // Delete meal helper
  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Are you sure you want to delete this meal log?')) return;
    try {
      await api.delete(`/meal/${mealId}`);
      showToast('Meal log deleted successfully.', 'success');
      loadDashboard();
    } catch (error) {
      console.error(error);
      showToast('Failed to delete meal log.', 'error');
    }
  };

  // Open Log Modal with specific tab
  const handleOpenMealLog = (tab = 'text') => {
    setInitialLogTab(tab);
    setIsLogModalOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonDashboard />
      </div>
    );
  }

  const todaySummary = dashboardData?.today_summary || {};
  const waterSummary = dashboardData?.water_summary || {};
  const weightSummary = dashboardData?.weight_summary || {};
  const charts = dashboardData?.charts || {};
  const todayMeals = dashboardData?.today_meals || [];
  const recommendation = dashboardData?.latest_recommendation;
  const isProfileComplete = todaySummary.profile_complete;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 pb-28"
    >
      {/* Profile Onboarding Alert */}
      {!isProfileComplete && (
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent text-amber-800 dark:text-amber-300 gap-4 shadow-glass">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm font-display">Complete Your Fitness Profile</h4>
              <p className="text-xs opacity-90 mt-0.5">
                Provide your age, target weight, and activity level to unlock personalized AI recommendations and precise BMR/TDEE calculations.
              </p>
            </div>
          </div>
          <AnimatedButton
            onClick={() => navigate('/profile')}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all whitespace-nowrap cursor-pointer"
          >
            Complete Profile
          </AnimatedButton>
        </motion.div>
      )}



      {/* Hero Welcome & Quick Action Bar */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 shadow-glassDark glow-card-emerald">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-72 h-72 bg-teal-500/12 rounded-full blur-3xl pointer-events-none animate-float-reverse" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Dashboard Overview
              </span>
              <span className="text-xs text-slate-400 font-semibold flex items-center">
                <Flame className="w-3.5 h-3.5 text-amber-400 mr-1 animate-flame" />
                Active Today
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-display text-white tracking-tight">
              {getGreeting()}, <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">{user?.name || 'Athlete'}</span>! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl font-medium leading-relaxed">
              Track nutrition hands-free with voice or image capture, get sports nutrition coaching via RAG, and optimize your fitness journey.
            </p>
          </div>

          {/* Quick Action Buttons & Date Picker */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2.5 text-xs rounded-2xl border border-slate-700 bg-slate-800/90 text-white font-bold focus:outline-none focus:border-emerald-500 shadow-xs"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenMealLog('text')}
              className="flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 rounded-2xl text-xs font-black shadow-glowEmerald transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5 font-black" />
              Log Meal
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenMealLog('image')}
              className="flex items-center px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              title="Camera Meal Scanner"
            >
              <Camera className="w-4 h-4 mr-1.5 text-emerald-400" />
              Photo
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenMealLog('voice')}
              className="flex items-center px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              title="Voice Meal Transcriber"
            >
              <Mic className="w-4 h-4 mr-1.5 text-teal-400" />
              Voice
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.dispatchEvent(new CustomEvent('nutrilens_open_coach'))}
              className="flex items-center px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4 mr-1.5 text-emerald-400" />
              Coach
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Primary Row: Rings, Macros & Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CalorieRing
          consumed={todaySummary.calories_consumed}
          goal={todaySummary.calories_goal}
          remaining={todaySummary.calories_remaining}
        />
        
        <MacroProgress
          protein={todaySummary.protein_consumed}
          proteinGoal={todaySummary.protein_goal}
          carbs={todaySummary.carbs_consumed}
          carbsGoal={todaySummary.carbs_goal}
          fat={todaySummary.fat_consumed}
          fatGoal={todaySummary.fat_goal}
          fiber={todaySummary.fiber_consumed}
          fiberGoal={isProfileComplete ? 30 : 0}
        />

        {/* Body Metrics Card */}
        <motion.div 
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="glass-card p-6 flex flex-col justify-between border border-purple-500/20 dark:border-purple-500/15"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    Target & Weight
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Goal Trajectory</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                {user?.weight_goal ? user.weight_goal.replace('_', ' ') : 'Maintain'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/90 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Weight</span>
                <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-display">
                  {weightSummary.current_weight || '--'} <span className="text-xs font-normal text-slate-400">kg</span>
                </span>
              </div>
              <div className="bg-slate-50/90 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Weight</span>
                <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-display">
                  {weightSummary.target_weight || '--'} <span className="text-xs font-normal text-slate-400">kg</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              <span>Goal Journey</span>
              <span className="text-purple-400 font-extrabold">{weightSummary.progress_pct || 0}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-900/80 overflow-hidden relative p-0.5">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-400 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                style={{ width: `${weightSummary.progress_pct || 0}%` }}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Water Tracker Widget */}
      <motion.div variants={itemVariants}>
        <WaterTracker
          logged={waterSummary.amount_ml}
          goal={waterSummary.goal_ml}
          onLogWater={handleLogWater}
        />
      </motion.div>

      {/* Weekly Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyCalorieChart
          calorieData={charts.weekly_calories || []}
          proteinData={charts.weekly_protein || []}
          calorieGoal={todaySummary.calories_goal}
          proteinGoal={todaySummary.protein_goal}
        />
        
        <WeightTrendChart
          weightData={charts.weight_trend || []}
          currentWeight={weightSummary.current_weight}
          targetWeight={weightSummary.target_weight}
        />
      </motion.div>

      {/* Recommendations Banner Teaser */}
      {recommendation ? (
        <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-teal-500/5 to-transparent">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-emerald-400 font-black text-sm font-display">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Personalized Nutrition Strategy Available</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              NutriLens AI compiled targeted meal plans tailored to your remaining macros and health targets.
            </p>
          </div>
          <AnimatedButton
            onClick={() => navigate('/recommendations')}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black rounded-2xl text-xs shadow-glowEmerald transition-all cursor-pointer whitespace-nowrap"
          >
            Review Recommendations
          </AnimatedButton>
        </motion.div>
      ) : (
        isProfileComplete && (
          <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-display">
                Need meal inspiration for today?
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Let Gemini analyze your remaining calorie budget and recommend targeted breakfast, lunch, or dinner recipes.
              </p>
            </div>
            <AnimatedButton
              onClick={() => navigate('/recommendations')}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-200 hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            >
              Generate Meal Plan
            </AnimatedButton>
          </motion.div>
        )
      )}

      {/* Logged Meals timeline list */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black font-display text-slate-900 dark:text-white flex items-center">
            <Utensils className="w-5 h-5 text-emerald-400 mr-2" />
            Today's Logged Meals
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {todayMeals.length} {todayMeals.length === 1 ? 'Meal' : 'Meals'} Logged
          </span>
        </div>

        {todayMeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {todayMeals.map((meal) => (
              <MealItemCard
                key={meal.id}
                meal={meal}
                onDelete={handleDeleteMeal}
                onEdit={(m) => navigate(`/history?edit=${m.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 glass-card border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-glowEmerald">
              <Utensils className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium">No meals logged for this date yet.</p>
            <div className="flex justify-center gap-2.5 pt-1">
              <AnimatedButton
                onClick={() => handleOpenMealLog('text')}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black rounded-2xl text-xs shadow-glowEmerald cursor-pointer"
              >
                Log Meal <Plus className="w-3.5 h-3.5 ml-1 inline" />
              </AnimatedButton>
              <AnimatedButton
                onClick={() => window.dispatchEvent(new CustomEvent('nutrilens_open_coach'))}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-2xl text-xs font-bold cursor-pointer"
              >
                Tell AI Coach <Bot className="w-3.5 h-3.5 ml-1 inline text-emerald-400" />
              </AnimatedButton>
            </div>
          </div>
        )}
      </motion.div>

      {/* Floating Action Island / Hub */}
      <FloatingActionDock
        onOpenMealLog={(tab) => handleOpenMealLog(tab)}
        onOpenAICoach={() => window.dispatchEvent(new CustomEvent('nutrilens_open_coach'))}
        onOpenFoodSwap={() => setIsSwapModalOpen(true)}
        onOpenGroceryPlan={() => setIsGroceryModalOpen(true)}
        onWaterLogged={(amount) => handleLogWater(amount)}
      />

      {/* Unified Logging Modal */}
      <MealLogModal
        isOpen={isLogModalOpen}
        initialTab={initialLogTab}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={() => {
          triggerConfetti('Meal Successfully Logged! 🥗');
          loadDashboard();
        }}
      />

      {/* Smart Food Swap Modal */}
      <SmartFoodSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
      />

      {/* Smart Grocery Planner Modal */}
      <GroceryPlannerModal
        isOpen={isGroceryModalOpen}
        onClose={() => setIsGroceryModalOpen(false)}
        dietPreference={user?.diet_preference || 'Balanced'}
      />
    </motion.div>
  );
};

export default Dashboard;

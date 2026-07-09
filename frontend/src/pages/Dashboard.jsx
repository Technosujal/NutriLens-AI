import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Flame, AlertCircle, Info, Calendar, Sparkles, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
import { SkeletonDashboard } from '../components/UI/Skeleton';
import AnimatedButton from '../components/UI/AnimatedButton';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

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
  }, [selectedDate]);

  // Add water helper
  const handleLogWater = async (amount) => {
    try {
      await api.post('/water', { amount_ml: amount, date: selectedDate });
      showToast(`Added ${amount}ml of water!`, 'success');
      loadDashboard(); // Refresh
    } catch (error) {
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
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      
      {/* Profile Onboarding Alert */}
      {!isProfileComplete && (
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border border-amber-500/20 bg-amber-50/75 dark:bg-amber-950/15 text-amber-800 dark:text-amber-300 gap-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Complete Your Fitness Profile</h4>
              <p className="text-xs opacity-90 mt-1">
                We need details like age, weight, target weight, activity levels to calculate your personalized BMI, BMR, TDEE, and daily caloric macro goals.
              </p>
            </div>
          </div>
          <AnimatedButton
            onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap"
          >
            Complete Profile
          </AnimatedButton>
        </motion.div>
      )}

      {/* Date Navigator & Action Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Hi, {user?.name || 'there'}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's a review of your nutritional intake today.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Custom Date selector */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors font-semibold"
            />
          </div>

          <AnimatedButton
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log Meal
          </AnimatedButton>
        </div>
      </motion.div>

      {/* Primary Row: Rings & Macros details */}
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

        {/* Quick Summary Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-glass dark:shadow-glassDark transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Body Metrics
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-semibold block">Current Weight</span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {weightSummary.current_weight || '--'} <span className="text-xs font-normal opacity-75">kg</span>
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-semibold block">Target Weight</span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {weightSummary.target_weight || '--'} <span className="text-xs font-normal opacity-75">kg</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/40">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 block mb-2">
              Weight Progress
            </span>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-900/65 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${weightSummary.progress_pct}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mt-1.5">
              <span>Goal Progress</span>
              <span>{weightSummary.progress_pct}%</span>
            </div>
          </div>
        </div>
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
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI Recommendations Available</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Gemini has compiled a personalized diet list based on your remaining macro balances.
            </p>
          </div>
          <AnimatedButton
            onClick={() => navigate('/recommendations')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-md hover:scale-102 transition-all"
          >
            Review Recommendations
          </AnimatedButton>
        </motion.div>
      ) : (
        isProfileComplete && (
          <motion.div variants={itemVariants} className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 text-center">
            <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Need eating inspiration?
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-4">
              Let Gemini analyze your calorie budget and write target meals (Breakfast, Lunch, Dinner).
            </p>
            <AnimatedButton
              onClick={() => navigate('/recommendations')}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Generate Recommendations
            </AnimatedButton>
          </motion.div>
        )
      )}

      {/* Logged Meals details list */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <Calendar className="w-5 h-5 text-emerald-500 mr-2" />
          Today's Meals
        </h3>

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
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-sm">No meals logged for this date yet.</p>
            <AnimatedButton
              onClick={() => setIsLogModalOpen(true)}
              className="mt-3 inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Add first meal <Plus className="w-3.5 h-3.5 ml-1" />
            </AnimatedButton>
          </div>
        )}
      </motion.div>

      {/* Unified Logging Modal */}
      <MealLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={loadDashboard}
      />
    </motion.div>
  );
};

export default Dashboard;

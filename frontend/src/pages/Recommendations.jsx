import React, { useEffect, useState, useContext } from 'react';
import { Sparkles, RefreshCw, Loader2, Salad, Dumbbell, Calendar, Apple, Search, ArrowRightLeft, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import { SkeletonCard } from '../components/UI/Skeleton';
import SmartFoodSwapModal from '../components/Dashboard/SmartFoodSwapModal';
import WeeklyReportCard from '../components/Dashboard/WeeklyReportCard';

import GroceryPlannerModal from '../components/AI/GroceryPlannerModal';
import { ShoppingBag } from 'lucide-react';

export const Recommendations = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [recommendations, setRecommendations] = useState(null);
  const [dietPref, setDietPref] = useState('Non-Vegetarian');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Smart Meal Finder Search Query state
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [mealFinderData, setMealFinderData] = useState(null);
  const [mealFinderLoading, setMealFinderLoading] = useState(false);

  // Food Swap Modal state
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [selectedSwapItem, setSelectedSwapItem] = useState(null);

  // Grocery Planner Modal state
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);

  const fetchRecommendations = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const response = await api.get(`/recommendations`, {
        params: {
          diet_preference: dietPref,
          refresh: isRefresh
        }
      });
      setRecommendations(response.data);
      if (isRefresh) {
        showToast('Generated fresh suggestions based on today\'s logs!', 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('Could not fetch recommendations. Try again.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSmartMealFinder = async (query = '') => {
    setMealFinderLoading(true);
    try {
      const response = await api.get('/rag/meal-finder', {
        params: { 
          ingredients: query,
          diet_preference: dietPref
        }
      });
      setMealFinderData(response.data);
    } catch (error) {
      console.error('Failed to run smart meal finder', error);
    } finally {
      setMealFinderLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(true);
    fetchSmartMealFinder(ingredientQuery);
  }, [dietPref]);

  const handleRefresh = () => {
    fetchRecommendations(true);
    fetchSmartMealFinder(ingredientQuery);
  };

  const handleIngredientSearch = (e) => {
    e.preventDefault();
    fetchSmartMealFinder(ingredientQuery);
  };

  const handleOpenSwapModal = (meal) => {
    setSelectedSwapItem({
      name: meal.meal_name,
      calories: meal.calories,
      protein: meal.protein,
      fat: meal.fat
    });
    setIsSwapModalOpen(true);
  };

  const renderRecommendationCard = (key, title, iconClass, icon) => {
    if (!recommendations || !recommendations[key]) return null;
    const meal = recommendations[key];

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-glass dark:shadow-glassDark hover:shadow-xl transition-all duration-300 p-6 space-y-4 relative group hover:-translate-y-1"
      >
        
        {/* Card header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/40">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${iconClass} flex items-center justify-center`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {title}
                </h3>
                {dietPref === 'Vegetarian' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <Leaf className="w-2.5 h-2.5 mr-0.5" /> Veg
                  </span>
                )}
              </div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 text-base">
                {meal.meal_name}
              </h4>
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg font-black text-slate-800 dark:text-slate-100">
              {meal.calories}
            </span>
            <span className="text-xs text-slate-400 ml-0.5">kcal</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          {meal.description}
        </p>

        {/* Nutritional breakdown */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/40 py-2.5 px-4 rounded-xl text-center text-xs">
          <div>
            <span className="text-slate-400 font-semibold block">Protein</span>
            <span className="font-bold text-rose-500 mt-0.5">{meal.protein}g</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block">Carbs</span>
            <span className="font-bold text-amber-500 mt-0.5">{meal.carbs}g</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block">Fat</span>
            <span className="font-bold text-blue-500 mt-0.5">{meal.fat}g</span>
          </div>
        </div>

        {/* AI Explanation / Justification */}
        <div className="pt-1 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-0.5">
              <Sparkles className="w-3.5 h-3.5 fill-emerald-500/10" />
              <span>Why this fits your goal:</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold italic">
              "{meal.explanation}"
            </p>
          </div>

          <button
            onClick={() => handleOpenSwapModal(meal)}
            className="ml-2 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 flex-shrink-0 active:scale-95"
            title="Find healthy RAG swap"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>
        </div>
      </motion.div>
    );
  };

  const isProfileComplete = user?.calorie_goal;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center">
            <Sparkles className="w-8 h-8 text-emerald-500 mr-2 fill-emerald-500/10" />
            Smart RAG Nutrition & Recipe Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalized vector-matched meals and intelligent weekly reports targeted to your daily macros.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Diet Preference selector */}
          <select
            value={dietPref}
            onChange={(e) => setDietPref(e.target.value)}
            className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
          >
            <option value="Non-Vegetarian">Non-Vegetarian</option>
            <option value="Vegetarian">Vegetarian</option>
          </select>

          {/* Grocery Planner Trigger Button */}
          <button
            onClick={() => setIsGroceryModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl font-bold text-sm border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">5-Day Grocery Plan</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading || refreshing || !isProfileComplete}
            className="flex items-center justify-center p-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white rounded-xl font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Refresh recommendations"
          >
            {refreshing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Profile Warning if incomplete */}
      {!isProfileComplete && (
        <div className="flex items-center p-5 rounded-2xl border border-blue-500/20 bg-blue-50/50 dark:bg-slate-900/35 text-slate-700 dark:text-slate-300">
          <Calendar className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
          <p className="text-xs leading-relaxed font-semibold">
            Recommendations are operating in demo mode. Complete your <span className="underline cursor-pointer text-emerald-600">Fitness Profile</span> to let RAG generate custom lists targeted to your exact remaining macros today.
          </p>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left side (2 Columns) - RAG Meal Suggestions & Grocery Search */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Smart Grocery / Recipe Finder Input Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 p-6 shadow-glass space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center">
                <Search className="w-5 h-5 text-emerald-500 mr-2" />
                RAG Smart Recipe & Ingredient Matcher
              </h3>
              {mealFinderData?.remaining_budget && (
                <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                  Remaining Today: {mealFinderData.remaining_budget.calories} kcal ({mealFinderData.remaining_budget.protein}g protein)
                </div>
              )}
            </div>

            <form onSubmit={handleIngredientSearch} className="flex gap-2">
              <input
                type="text"
                value={ingredientQuery}
                onChange={(e) => setIngredientQuery(e.target.value)}
                placeholder="Type ingredients you have (e.g. chicken, oats, eggs, spinach)..."
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={mealFinderLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {mealFinderLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Search RAG Recipes</span>
                )}
              </button>
            </form>

            {/* Smart Meal Finder Suggestions */}
            {mealFinderData?.suggestions && mealFinderData.suggestions.length > 0 ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Matched RAG Recipes for "{mealFinderData.query_used}"</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {mealFinderData.suggestions.length} recipes found
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mealFinderData.suggestions.map((sugg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: idx * 0.05 }}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-emerald-500/20 dark:border-slate-700/50 space-y-3 shadow-sm hover:shadow-md transition-all hover:border-emerald-500/40"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                          {sugg.meal_name}
                        </h5>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full">
                          {sugg.calories} kcal
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        {sugg.description}
                      </p>

                      <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-800 py-1.5 px-3 rounded-xl text-center text-xs border border-slate-100 dark:border-slate-700">
                        <div>
                          <span className="text-slate-400 block font-semibold text-[10px]">Protein</span>
                          <span className="font-bold text-rose-500">{sugg.protein}g</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold text-[10px]">Carbs</span>
                          <span className="font-bold text-amber-500">{sugg.carbs}g</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold text-[10px]">Fat</span>
                          <span className="font-bold text-blue-500">{sugg.fat}g</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold italic flex items-center space-x-1 pt-1">
                        <Sparkles className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        <span>{sugg.match_reason}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : mealFinderLoading ? (
              <div className="p-6 text-center text-xs text-slate-400 font-semibold animate-pulse">
                Searching recipe database and matching vector embeddings...
              </div>
            ) : null}
          </div>

          {/* Daily Goal Meal Suggestions Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              Daily Target Meal Suggestions
            </h3>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonCard className="h-80 w-full" />
                <SkeletonCard className="h-80 w-full" />
                <SkeletonCard className="h-80 w-full" />
                <SkeletonCard className="h-80 w-full" />
              </div>
            ) : recommendations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderRecommendationCard(
                  'breakfast',
                  'Breakfast Suggestion',
                  'bg-amber-100 dark:bg-amber-950/20 text-amber-500',
                  <Apple className="w-5 h-5" />
                )}
                {renderRecommendationCard(
                  'lunch',
                  'Lunch Suggestion',
                  'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500',
                  <Salad className="w-5 h-5" />
                )}
                {renderRecommendationCard(
                  'dinner',
                  'Dinner Suggestion',
                  'bg-indigo-100 dark:bg-indigo-950/20 text-indigo-500',
                  <Dumbbell className="w-5 h-5" />
                )}
                {renderRecommendationCard(
                  'snacks',
                  'Healthy Snack Suggestion',
                  'bg-rose-100 dark:bg-rose-950/20 text-rose-500',
                  <Apple className="w-5 h-5" />
                )}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300">No suggestions compiled.</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Tap the refresh button above to prompt RAG AI to generate custom meal structures.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right side (1 Column) - Weekly RAG Health Report */}
        <div className="lg:col-span-1 space-y-6">
          <WeeklyReportCard />
        </div>
        
      </div>

      {/* Smart Food Swap Modal */}
      <SmartFoodSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        initialFood={selectedSwapItem}
      />

      {/* 5-Day Grocery & Prep Planner Modal */}
      <GroceryPlannerModal
        isOpen={isGroceryModalOpen}
        onClose={() => setIsGroceryModalOpen(false)}
        dietPreference={dietPref}
      />
    </div>
  );
};

export default Recommendations;

import React, { useEffect, useState, useContext } from 'react';
import { Sparkles, RefreshCw, Loader2, Salad, Dumbbell, Calendar, Apple } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import { SkeletonCard } from '../components/UI/Skeleton';
import Chatbot from '../components/Dashboard/Chatbot';

export const Recommendations = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [recommendations, setRecommendations] = useState(null);
  const [dietPref, setDietPref] = useState('Non-Vegetarian');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    fetchRecommendations();
  }, [dietPref]);

  const handleRefresh = () => {
    fetchRecommendations(true);
  };

  // Safe checks for empty results
  const renderRecommendationCard = (key, title, iconClass, icon) => {
    if (!recommendations || !recommendations[key]) return null;
    const meal = recommendations[key];

    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-glass dark:shadow-glassDark hover:shadow-lg transition-all duration-300 p-6 space-y-4">
        
        {/* Card header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/40">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${iconClass} flex items-center justify-center`}>
              {icon}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {title}
              </h3>
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
        <div className="pt-2">
          <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 fill-emerald-500/10" />
            <span>Why this fits your goal:</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold italic">
            "{meal.explanation}"
          </p>
        </div>
      </div>
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
            Gemini AI Recommendations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Get personalized meals customized to satisfy your remaining calories and macro balances.
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
            Recommendations are operating in demo mode. Complete your <span className="underline cursor-pointer text-emerald-600">Fitness Profile</span> to let Gemini generate custom lists targeted to your exact remaining macros today.
          </p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left side - Meal Recommendations */}
        <div className="lg:col-span-2 space-y-6">
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
                Tap the refresh button above to prompt Gemini AI to generate custom meal structures.
              </p>
            </div>
          )}
        </div>

        {/* Right side - Chatbot */}
        <div className="lg:col-span-1">
          <Chatbot />
        </div>
        
      </div>
    </div>
  );
};

export default Recommendations;

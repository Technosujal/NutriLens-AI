import React, { useState, useEffect, useContext } from 'react';
import { User, Activity, Dumbbell, ShieldCheck, HeartPulse, Scale, MoveUp, CheckCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import useToast from '../hooks/useToast';

export const Profile = () => {
  const { user, updateProfileState, refreshProfile } = useContext(AuthContext);
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('Sedentary');
  const [weightGoal, setWeightGoal] = useState('Maintain Weight');
  const [dietPreference, setDietPreference] = useState('Non-Vegetarian');
  
  const [saving, setSaving] = useState(false);
  const [calculatedGoals, setCalculatedGoals] = useState(null);

  // Sync state with user context
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAge(user.age || '');
      setGender(user.gender || 'Male');
      setHeight(user.height_cm || '');
      setWeight(user.weight_kg || '');
      setTargetWeight(user.target_weight_kg || '');
      setActivityLevel(user.activity_level || 'Sedentary');
      setWeightGoal(user.weight_goal || 'Maintain Weight');
      setDietPreference(user.diet_preference || 'Non-Vegetarian');
      
      if (user.calorie_goal) {
        setCalculatedGoals({
          bmi: user.bmi,
          bmr: user.bmr,
          tdee: user.tdee,
          calorie_goal: user.calorie_goal,
          protein_goal_g: user.protein_goal_g,
          carbs_goal_g: user.carbs_goal_g,
          fat_goal_g: user.fat_goal_g,
        });
      }
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const profilePayload = {
      name,
      age: parseInt(age) || null,
      gender,
      height_cm: parseFloat(height) || null,
      weight_kg: parseFloat(weight) || null,
      target_weight_kg: parseFloat(targetWeight) || null,
      activity_level: activityLevel,
      weight_goal: weightGoal,
      diet_preference: dietPreference
    };

    try {
      const response = await api.put('/profile', profilePayload);
      updateProfileState(response.data);
      
      setCalculatedGoals({
        bmi: response.data.bmi,
        bmr: response.data.bmr,
        tdee: response.data.tdee,
        calorie_goal: response.data.calorie_goal,
        protein_goal_g: response.data.protein_goal_g,
        carbs_goal_g: response.data.carbs_goal_g,
        fat_goal_g: response.data.fat_goal_g,
      });
      
      showToast('Profile and fitness goals updated!', 'success');
      // Refresh context profile details
      refreshProfile();
    } catch (error) {
      console.error(error);
      const detail = error.response?.data?.detail || 'Failed to update profile. Please verify your entries.';
      showToast(detail, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getBmiStatus = (bmi) => {
    if (!bmi) return { label: 'Unknown', color: 'text-slate-400' };
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-500' };
    if (bmi < 25) return { label: 'Normal weight', color: 'text-emerald-500' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-500' };
    return { label: 'Obese', color: 'text-rose-500 font-bold' };
  };

  const bmiStatus = getBmiStatus(calculatedGoals?.bmi);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Inputs Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-glass dark:shadow-glassDark p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Fitness Profile & Goals
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Provide your details to calculate accurate metabolism requirements.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">Age (years)</label>
                <input
                  type="number"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">Target Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="Sedentary">Sedentary (No Exercise)</option>
                  <option value="Lightly Active">Lightly Active (1-3 days/week)</option>
                  <option value="Moderately Active">Moderately Active (3-5 days/week)</option>
                  <option value="Very Active">Very Active (6-7 days/week)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">Weight Goal</label>
                <select
                  value={weightGoal}
                  onChange={(e) => setWeightGoal(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="Lose Weight">Lose Weight</option>
                  <option value="Maintain Weight">Maintain Weight</option>
                  <option value="Gain Muscle">Gain Muscle</option>
                </select>
              </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">Diet Preference</label>
                <select
                  value={dietPreference}
                  onChange={(e) => setDietPreference(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegetarian">Vegetarian</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Calculating Targets...
                </>
              ) : (
                'Save Changes & Update Goals'
              )}
            </button>
          </form>
        </div>

        {/* Calculated Goals Panel */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center space-x-2">
              <HeartPulse className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Calculated Targets
              </h3>
            </div>

            {calculatedGoals ? (
              <div className="space-y-4">
                
                {/* BMI */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Body Mass Index (BMI)</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 block">
                      {calculatedGoals.bmi}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 ${bmiStatus.color}`}>
                    {bmiStatus.label}
                  </span>
                </div>

                {/* BMR */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Basal Metabolic Rate (BMR)</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {calculatedGoals.bmr} <span className="text-xs font-normal text-slate-400">kcal/day</span>
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Calories burned at complete rest.</p>
                </div>

                {/* TDEE */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Active Energy Burn (TDEE)</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {calculatedGoals.tdee} <span className="text-xs font-normal text-slate-400">kcal/day</span>
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Total energy spent based on physical activities.</p>
                </div>

                {/* Target Calories */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-4 rounded-2xl text-white shadow-md">
                  <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider block">Daily Intake Target</span>
                  <span className="text-3xl font-black mt-0.5 block">
                    {calculatedGoals.calorie_goal} <span className="text-sm font-normal opacity-85">kcal/day</span>
                  </span>
                  <p className="text-[10px] text-emerald-50 opacity-90 mt-1 font-semibold capitalize">
                    Goal Selected: {weightGoal}
                  </p>
                </div>

                {/* Macro splits */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">Daily Macro Targets</span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-[9px] font-semibold text-rose-500 block">Protein</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">{calculatedGoals.protein_goal_g}g</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-[9px] font-semibold text-amber-500 block">Carbs</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">{calculatedGoals.carbs_goal_g}g</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-[9px] font-semibold text-blue-500 block">Fats</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">{calculatedGoals.fat_goal_g}g</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 text-center border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
                <Scale className="w-10 h-10 text-slate-300 dark:text-slate-500 mb-3" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Awaiting calculations</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Provide your metrics in the profile form and click save to calculate your caloric targets!
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold justify-center pt-4 border-t border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure Database storage</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;

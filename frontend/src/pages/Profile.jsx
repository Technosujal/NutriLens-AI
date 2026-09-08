import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  User, Activity, Dumbbell, ShieldCheck, HeartPulse, Scale, 
  MoveUp, CheckCircle, Loader2, Sparkles, TrendingUp, Zap, Target,
  Flame, Calendar, Apple, Award, ArrowRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import { triggerConfetti } from '../components/UI/ConfettiEffect';

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
  const [savedGoals, setSavedGoals] = useState(null);

  // Sync state with user context
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAge(user.age ? String(user.age) : '');
      setGender(user.gender || 'Male');
      setHeight(user.height_cm ? String(user.height_cm) : '');
      setWeight(user.weight_kg ? String(user.weight_kg) : '');
      setTargetWeight(user.target_weight_kg ? String(user.target_weight_kg) : '');
      setActivityLevel(user.activity_level || 'Sedentary');
      setWeightGoal(user.weight_goal || 'Maintain Weight');
      setDietPreference(user.diet_preference || 'Non-Vegetarian');
      
      if (user.calorie_goal) {
        setSavedGoals({
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

  // Real-time live estimation calculation from active form values
  const activeDisplayGoals = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    const tw = parseFloat(targetWeight);

    if (!w || !h || !a) {
      return savedGoals || null;
    }

    // 1. BMI = weight (kg) / (height (m))^2
    const hMeter = h / 100;
    const bmiVal = parseFloat((w / (hMeter * hMeter)).toFixed(1));

    // 2. Mifflin-St Jeor BMR
    let bmrVal = 10 * w + 6.25 * h - 5 * a;
    bmrVal += gender === 'Male' ? 5 : -161;
    bmrVal = Math.round(bmrVal * 10) / 10;

    // 3. TDEE Multipliers
    const multipliers = {
      'Sedentary': 1.2,
      'Lightly Active': 1.375,
      'Moderately Active': 1.55,
      'Very Active': 1.725
    };
    const tdeeVal = Math.round(bmrVal * (multipliers[activityLevel] || 1.2) * 10) / 10;

    // 4. Calorie Goal
    let calGoal = Math.round(tdeeVal);
    if (weightGoal === 'Lose Weight') {
      calGoal = Math.max(1200, Math.round(tdeeVal - 500));
    } else if (weightGoal === 'Gain Muscle') {
      calGoal = Math.round(tdeeVal + 300);
    }

    // 5. Macro Distributions (30% Protein, 45% Carbs, 25% Fat)
    const protG = Math.round((calGoal * 0.30) / 4);
    const carbG = Math.round((calGoal * 0.45) / 4);
    const fatG = Math.round((calGoal * 0.25) / 9);

    // 6. Time to target weight projection
    let weeksToGoal = 0;
    if (tw && tw !== w) {
      const diffKg = Math.abs(tw - w);
      weeksToGoal = Math.max(1, Math.round(diffKg / 0.45));
    }

    return {
      bmi: bmiVal,
      bmr: bmrVal,
      tdee: tdeeVal,
      calorie_goal: calGoal,
      protein_goal_g: protG,
      carbs_goal_g: carbG,
      fat_goal_g: fatG,
      weeksToGoal,
      diffKg: tw ? Math.abs(tw - w).toFixed(1) : 0
    };
  }, [weight, height, age, gender, activityLevel, weightGoal, targetWeight, savedGoals]);

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
      
      setSavedGoals({
        bmi: response.data.bmi,
        bmr: response.data.bmr,
        tdee: response.data.tdee,
        calorie_goal: response.data.calorie_goal,
        protein_goal_g: response.data.protein_goal_g,
        carbs_goal_g: response.data.carbs_goal_g,
        fat_goal_g: response.data.fat_goal_g,
      });
      
      showToast('Profile and nutrition targets successfully updated! 🎯', 'success');
      triggerConfetti('Daily Target Updated!');
      
      // Notify Dashboard and RAG components immediately
      window.dispatchEvent(new CustomEvent('calorie_ai_data_updated', { detail: response.data }));
      refreshProfile();
    } catch (error) {
      console.error(error);
      let detail = 'Failed to update profile. Please verify your entries.';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          detail = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          detail = error.response.data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
        }
      } else if (error.message) {
        detail = error.message;
      }
      showToast(detail, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getBmiStatus = (bmi) => {
    if (!bmi) return { label: 'Unknown', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    if (bmi < 25) return { label: 'Normal weight (Optimal)', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'Obese', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  const bmiStatus = getBmiStatus(activeDisplayGoals?.bmi);

  const goalTiles = [
    { id: 'Lose Weight', label: 'Cut / Fat Loss', desc: '-500 kcal deficit', icon: '📉' },
    { id: 'Maintain Weight', label: 'Maintain & Tone', desc: 'Caloric balance (TDEE)', icon: '⚖️' },
    { id: 'Gain Muscle', label: 'Lean Bulk', desc: '+300 kcal surplus', icon: '📈' },
  ];

  const activityTiles = [
    { id: 'Sedentary', label: 'Sedentary', desc: 'Desk job / minimal movement', icon: '🛋️' },
    { id: 'Lightly Active', label: 'Lightly Active', desc: '1–3 training days / week', icon: '🚶' },
    { id: 'Moderately Active', label: 'Moderately Active', desc: '3–5 workouts / week', icon: '🏃' },
    { id: 'Very Active', label: 'Very Active', desc: '6–7 intense training days', icon: '⚡' },
  ];

  const dietTiles = [
    { id: 'Non-Vegetarian', label: 'Non-Vegetarian', desc: 'Poultry, eggs, seafood, dairy & plants', icon: '🍗' },
    { id: 'Vegetarian', label: 'Vegetarian', desc: 'Dairy, legumes, tofu, grains & vegetables', icon: '🥗' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28 relative">
      {/* Background glowing aurora */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Profile Inputs Form (Left Col 7) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 glass-card p-6 sm:p-8 space-y-7 border border-slate-200/80 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-200/60 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-glowEmerald flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                Fitness Profile & Goal Calibration
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Set biometric variables to compute exact BMR, TDEE, and optimal macronutrient splits.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Row 1: Name & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Age (Years)
                </label>
                <input
                  type="number"
                  required
                  min="12"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Row 2: Gender, Height, Weight, Target Weight */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="Male">Male ♂</option>
                  <option value="Female">Female ♀</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 171"
                  className="w-full px-3 py-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 62"
                  className="w-full px-3 py-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Target (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="e.g. 70"
                  className="w-full px-3 py-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold shadow-inner"
                />
              </div>
            </div>

            {/* Visual Goal Selector Tiles */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Primary Weight & Fitness Objective
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {goalTiles.map((tile) => {
                  const isSelected = weightGoal === tile.id;
                  return (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={tile.id}
                      onClick={() => setWeightGoal(tile.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border-emerald-500 shadow-glowEmerald'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{tile.icon}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-black text-xs text-slate-900 dark:text-white mt-2">
                        {tile.label}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{tile.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Visual Activity Level Selector Tiles */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Weekly Activity & Exercise Routine
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activityTiles.map((tile) => {
                  const isSelected = activityLevel === tile.id;
                  return (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={tile.id}
                      onClick={() => setActivityLevel(tile.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gradient-to-tr from-teal-500/20 to-cyan-500/10 border-teal-500 shadow-glowTeal'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="text-lg">{tile.icon}</span>
                      <h4 className="font-display font-black text-xs text-slate-900 dark:text-white mt-1">
                        {tile.label}
                      </h4>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{tile.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Diet Preference Tiles */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Dietary Pattern
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dietTiles.map((tile) => {
                  const isSelected = dietPreference === tile.id;
                  return (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={tile.id}
                      onClick={() => setDietPreference(tile.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center space-x-3.5 ${
                        isSelected
                          ? 'bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border-emerald-500 shadow-glowEmerald'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="text-2xl">{tile.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-black text-xs text-slate-900 dark:text-white">
                            {tile.label}
                          </h4>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{tile.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-2xl shadow-glowEmerald disabled:opacity-50 transition-all flex items-center justify-center text-xs uppercase tracking-wider cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving & Recalculating Targets...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1.5 font-black" />
                  Save Changes & Recalculate Goals
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Calculated Goals Panel (Right Col 5 - Sticky) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 glass-card p-6 sm:p-7 space-y-4.5 border border-slate-200/80 dark:border-slate-800 lg:sticky lg:top-24"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-display">
                Calculated Targets
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Live Preview
            </span>
          </div>

          {activeDisplayGoals ? (
            <div className="space-y-4">
              
              {/* Main Prominent Hero Caloric Target Card */}
              <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-slate-950 shadow-[0_10px_30px_rgba(16,185,129,0.35)]">
                <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/20 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/80">
                    Daily Intake Target
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950/20 text-slate-950 border border-slate-950/20">
                    {weightGoal}
                  </span>
                </div>
                
                <div className="flex items-baseline space-x-2 my-2">
                  <span className="text-4xl sm:text-5xl font-black font-display text-slate-950 tracking-tight">
                    {activeDisplayGoals.calorie_goal}
                  </span>
                  <span className="text-sm font-black text-emerald-950/90">kcal / day</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-950/15 text-[11px] font-extrabold text-emerald-950">
                  <span>TDEE Burn: {activeDisplayGoals.tdee} kcal</span>
                  <span>{weightGoal === 'Gain Muscle' ? '+300 kcal Bulk' : weightGoal === 'Lose Weight' ? '-500 kcal Cut' : 'Maintenance'}</span>
                </div>
              </div>

              {/* BMI Gauge Card */}
              <div className="bg-slate-50/90 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Body Mass Index (BMI)
                  </span>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-display mt-0.5 block">
                    {activeDisplayGoals.bmi}
                  </span>
                </div>
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${bmiStatus.color}`}>
                  {bmiStatus.label}
                </span>
              </div>

              {/* BMR & TDEE side-by-side */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50/90 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                    Basal Rate (BMR)
                  </span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-display mt-0.5 block">
                    {activeDisplayGoals.bmr} <span className="text-[10px] font-normal text-slate-400">kcal</span>
                  </span>
                  <p className="text-[9px] text-slate-400 mt-0.5">Burn at complete rest</p>
                </div>

                <div className="bg-slate-50/90 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                    Total Burn (TDEE)
                  </span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-display mt-0.5 block">
                    {activeDisplayGoals.tdee} <span className="text-[10px] font-normal text-slate-400">kcal</span>
                  </span>
                  <p className="text-[9px] text-slate-400 mt-0.5">Daily activity burn</p>
                </div>
              </div>

              {/* Target Timeline Projection Card */}
              {activeDisplayGoals.weeksToGoal > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-transparent border border-purple-500/30 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-black text-purple-400 text-[11px]">
                    <Target className="w-3.5 h-3.5" />
                    <span>Estimated Timeline to {targetWeight} kg</span>
                  </div>
                  <p className="text-slate-300 text-[11px] font-medium leading-relaxed">
                    At your goal pace, you will reach <strong className="text-white">{targetWeight} kg</strong> (~{activeDisplayGoals.diffKg} kg change) in approximately <strong className="text-purple-300">{activeDisplayGoals.weeksToGoal} weeks</strong>!
                  </p>
                </div>
              )}

              {/* Recommended Daily Macro Budget */}
              <div className="bg-slate-50/90 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2.5">
                  Recommended Daily Macro Budget
                </span>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-blue-500/10 dark:bg-blue-950/40 rounded-xl border border-blue-500/20">
                    <span className="text-[9px] font-black uppercase text-blue-400 block">Protein</span>
                    <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-display mt-0.5 block">
                      {activeDisplayGoals.protein_goal_g}g
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">30% split</span>
                  </div>
                  
                  <div className="p-2.5 bg-amber-500/10 dark:bg-amber-950/40 rounded-xl border border-amber-500/20">
                    <span className="text-[9px] font-black uppercase text-amber-400 block">Carbs</span>
                    <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-display mt-0.5 block">
                      {activeDisplayGoals.carbs_goal_g}g
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">45% split</span>
                  </div>
                  
                  <div className="p-2.5 bg-rose-500/10 dark:bg-rose-950/40 rounded-xl border border-rose-500/20">
                    <span className="text-[9px] font-black uppercase text-rose-400 block">Fats</span>
                    <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-display mt-0.5 block">
                      {activeDisplayGoals.fat_goal_g}g
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">25% split</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-2">
              <Scale className="w-10 h-10 text-slate-400 mb-1" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Awaiting Biometric Inputs</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs">
                Fill in your height, weight, and age to compute metabolic targets.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-400 font-black pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Biometric Storage • Powered by Mifflin-St Jeor</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Profile;

import React, { useState, useEffect } from 'react';
import { X, Text, Mic, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceLogger from './VoiceLogger';
import ImageLogger from './ImageLogger';
import api from '../../services/api';
import useToast from '../../hooks/useToast';

export const MealLogModal = ({ isOpen, initialTab = 'text', onClose, onSuccess }) => {
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mealType, setMealType] = useState('Breakfast');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [textLog, setTextLog] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textLog.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/meal/text', {
        text: textLog,
        date,
        meal_type: mealType
      });
      showToast('Meal logged successfully! 🥗', 'success');
      setTextLog('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Failed to extract nutrition details. Try a different description.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChildMealLogged = async ({ text, formData, isVoice, isImage }) => {
    setLoading(true);
    try {
      if (isVoice) {
        // Voice triggers /meal/voice
        await api.post('/meal/voice', { text, date, meal_type: mealType });
      } else if (isImage) {
        // Image triggers /meal/image (already compiled in ImageLogger)
        await api.post('/meal/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Failed to extract details from food log.';
      showToast(msg, 'error');
      throw err; // bubble up to clear child loader
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'text', name: 'Natural Language', icon: <Text className="w-4 h-4 mr-1.5" /> },
    { id: 'voice', name: 'Voice Mic', icon: <Mic className="w-4 h-4 mr-1.5" /> },
    { id: 'image', name: 'AI Vision Camera', icon: <ImageIcon className="w-4 h-4 mr-1.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl transition-all duration-300 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-glowEmerald">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                Log Today's Meal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                AI parses portion sizes, calories & macronutrients
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="p-6">
          {/* Metadata selectors (Meal Type, Date) */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Meal Category
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
              >
                <option value="Breakfast">🍳 Breakfast</option>
                <option value="Lunch">🥗 Lunch</option>
                <option value="Dinner">🍽️ Dinner</option>
                <option value="Snacks">🍎 Snacks</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Log Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 mb-6 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center py-2.5 px-3 text-xs font-black rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="min-h-56">
            {activeTab === 'text' && (
              <form onSubmit={handleTextSubmit} className="flex flex-col gap-4">
                <textarea
                  value={textLog}
                  onChange={(e) => setTextLog(e.target.value)}
                  placeholder='Describe your meal naturally, e.g. "I had 2 boiled eggs, 1 slice whole wheat toast with peanut butter and a cup of black coffee"'
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all font-medium resize-none text-xs leading-relaxed"
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !textLog.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-2xl shadow-glowEmerald disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer text-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2.5 animate-spin" />
                      Gemini extracting nutrients...
                    </>
                  ) : (
                    'Extract Nutrition & Log Meal ✨'
                  )}
                </motion.button>
              </form>
            )}

            {activeTab === 'voice' && (
              <VoiceLogger
                mealType={mealType}
                date={date}
                onMealLogged={handleChildMealLogged}
                onSuccess={onSuccess}
                onClose={onClose}
                showToast={showToast}
              />
            )}

            {activeTab === 'image' && (
              <ImageLogger
                mealType={mealType}
                date={date}
                onMealLogged={handleChildMealLogged}
                showToast={showToast}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MealLogModal;

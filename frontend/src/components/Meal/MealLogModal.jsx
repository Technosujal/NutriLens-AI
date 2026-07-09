import React, { useState } from 'react';
import { X, Text, Mic, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import VoiceLogger from './VoiceLogger';
import ImageLogger from './ImageLogger';
import api from '../../services/api';
import useToast from '../../hooks/useToast';

export const MealLogModal = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('text');
  const [mealType, setMealType] = useState('Breakfast');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [textLog, setTextLog] = useState('');
  const [loading, setLoading] = useState(false);

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
      showToast('Meal logged successfully!', 'success');
      setTextLog('');
      onSuccess();
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
    { id: 'text', name: 'Text Description', icon: <Text className="w-4 h-4 mr-1.5" /> },
    { id: 'voice', name: 'Voice Logging', icon: <Mic className="w-4 h-4 mr-1.5" /> },
    { id: 'image', name: 'Food Image', icon: <ImageIcon className="w-4 h-4 mr-1.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl transition-all duration-300 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Log Today's Meal
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Metadata selectors (Meal Type, Date) */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Meal Category
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Log Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-700 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
                }`}
              >
                {tab.icon}
                {tab.name}
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
                  placeholder='Describe your meal, e.g. "I had 2 slices of whole wheat bread with peanut butter and a glass of warm milk"'
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all font-medium resize-none text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !textLog.trim()}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2.5 animate-spin" />
                      Gemini extracting...
                    </>
                  ) : (
                    'Extract Nutrition & Log'
                  )}
                </button>
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
      </div>
    </div>
  );
};

export default MealLogModal;

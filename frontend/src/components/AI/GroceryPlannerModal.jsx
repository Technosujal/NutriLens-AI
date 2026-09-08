import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckSquare, Square, Copy, Check, Sparkles, X, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import useToast from '../../hooks/useToast';

export const GroceryPlannerModal = ({ isOpen, onClose, dietPreference = 'Non-Vegetarian' }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [copied, setCopied] = useState(false);

  const fetchGroceryPlan = async () => {
    setLoading(true);
    try {
      const response = await api.post('/rag/grocery-plan', {
        diet_preference: dietPreference,
        days: 5
      });
      setPlanData(response.data);
    } catch (err) {
      console.error('Failed to load grocery plan:', err);
      showToast('Could not compile grocery plan. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGroceryPlan();
    }
  }, [isOpen, dietPreference]);

  const toggleCheck = (id) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = () => {
    if (!planData) return;
    const lines = [`🛒 CalorieAI 5-Day Meal Prep Grocery List (${dietPreference})`, ''];
    const sections = [
      { title: '🥦 Produce & Greens', key: 'produce' },
      { title: '🥩 Lean Proteins', key: 'lean_proteins' },
      { title: '🥛 Dairy & Alternatives', key: 'dairy_and_alternatives' },
      { title: '🌾 Grains & Pantry Staples', key: 'pantry_and_grains' },
      { title: '🥑 Healthy Fats & Nuts', key: 'healthy_fats_and_nuts' }
    ];

    sections.forEach(({ title, key }) => {
      if (planData[key] && planData[key].length > 0) {
        lines.push(title);
        planData[key].forEach((item) => {
          lines.push(`• ${item.item} (${item.quantity}) - ${item.purpose}`);
        });
        lines.push('');
      }
    });

    if (planData.meal_prep_summary) {
      lines.push(`💡 Meal Prep Strategy: ${planData.meal_prep_summary}`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    showToast('Grocery list copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isOpen) return null;

  const categories = [
    { title: 'Produce & Fresh Greens', key: 'produce', icon: '🥦' },
    { title: 'Lean Proteins', key: 'lean_proteins', icon: '🥩' },
    { title: 'Dairy & Alternatives', key: 'dairy_and_alternatives', icon: '🥛' },
    { title: 'Pantry & Grains', key: 'pantry_and_grains', icon: '🌾' },
    { title: 'Healthy Fats & Nuts', key: 'healthy_fats_and_nuts', icon: '🥑' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 dark:from-emerald-950/30 to-transparent">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                AI 5-Day Grocery & Prep Planner
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tailored for {dietPreference} diet and your target daily macros
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              disabled={loading || !planData}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy List'}</span>
            </button>

            <button
              onClick={fetchGroceryPlan}
              disabled={loading}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Regenerate plan"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Gemini is optimizing your 5-day shopping cart...
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Balancing macro distribution, shelf life, and budget efficiency.
              </p>
            </div>
          ) : planData ? (
            <>
              {/* Meal Prep Strategy Tip */}
              {planData.meal_prep_summary && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-300 flex items-start space-x-2.5 font-medium leading-relaxed">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Meal Prep Strategy: </span>
                    {planData.meal_prep_summary}
                  </div>
                </div>
              )}

              {/* Categorized Lists */}
              <div className="space-y-5">
                {categories.map(({ title, key, icon }) => {
                  const items = planData[key] || [];
                  if (items.length === 0) return null;

                  return (
                    <div key={key} className="space-y-2.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center">
                        <span className="mr-1.5">{icon}</span> {title}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {items.map((item, idx) => {
                          const itemId = `${key}_${idx}`;
                          const isDone = !!checkedItems[itemId];

                          return (
                            <div
                              key={idx}
                              onClick={() => toggleCheck(itemId)}
                              className={`p-3 rounded-xl border transition-all flex items-start space-x-3 cursor-pointer select-none ${
                                isDone
                                  ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/40 opacity-60'
                                  : 'bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/60 shadow-xs hover:border-emerald-500/40'
                              }`}
                            >
                              <button
                                type="button"
                                className="mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                              >
                                {isDone ? (
                                  <CheckSquare className="w-4 h-4 fill-emerald-500/20" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-xs font-bold ${
                                      isDone
                                        ? 'line-through text-slate-400'
                                        : 'text-slate-800 dark:text-slate-200'
                                    }`}
                                  >
                                    {item.item}
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-400 ml-1">
                                    {item.quantity}
                                  </span>
                                </div>
                                {item.purpose && (
                                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                    {item.purpose}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};

export default GroceryPlannerModal;

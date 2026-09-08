import React, { useState } from 'react';
import { RefreshCw, ArrowRightLeft, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import useToast from '../../hooks/useToast';

export const SmartFoodSwapModal = ({ isOpen, onClose, initialFood = null }) => {
    const [foodName, setFoodName] = useState('');
    const [calories, setCalories] = useState(300);
    const [protein, setProtein] = useState(10);
    const [fat, setFat] = useState(12);
    const [loading, setLoading] = useState(false);
    const [swapResult, setSwapResult] = useState(null);
    const { showToast } = useToast();

    React.useEffect(() => {
        if (isOpen && initialFood) {
            setFoodName(initialFood.name || '');
            setCalories(initialFood.calories || 300);
            setProtein(initialFood.protein || 10);
            setFat(initialFood.fat || 12);
            setSwapResult(null);
        }
    }, [isOpen, initialFood]);

    if (!isOpen) return null;

    const handleFindSwap = async (e) => {
        if (e) e.preventDefault();
        if (!foodName.trim()) return;

        setLoading(true);
        try {
            const res = await api.post('/rag/food-swap', {
                food_name: foodName,
                calories: Number(calories),
                protein: Number(protein),
                fat: Number(fat)
            });
            setSwapResult(res.data);
            showToast('Found smart RAG food swap!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Could not calculate food swap.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-2xl max-w-lg w-full p-6 space-y-6 relative overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/40 pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                            <ArrowRightLeft className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                                Smart RAG Food Swap
                            </h3>
                            <p className="text-xs text-slate-400 font-semibold">
                                Find lower-calorie, high-protein healthy alternatives
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold text-xl p-1"
                    >
                        ✕
                    </button>
                </div>

                {/* Input form */}
                <form onSubmit={handleFindSwap} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Food Name
                        </label>
                        <input
                            type="text"
                            value={foodName}
                            onChange={(e) => setFoodName(e.target.value)}
                            placeholder="e.g. White Rice, French Fries, Butter Chicken"
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-semibold focus:outline-none focus:border-emerald-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Calories (kcal)
                            </label>
                            <input
                                type="number"
                                value={calories}
                                onChange={(e) => setCalories(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Protein (g)
                            </label>
                            <input
                                type="number"
                                value={protein}
                                onChange={(e) => setProtein(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Fat (g)
                            </label>
                            <input
                                type="number"
                                value={fat}
                                onChange={(e) => setFat(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !foodName.trim()}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 fill-white/20" />
                                <span>Find Healthy RAG Swap</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Swap Results */}
                {swapResult && (
                    <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Recommended Swap</span>
                            </div>
                            <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-black">
                                -{swapResult.smart_swap.calories_saved} kcal saved!
                            </span>
                        </div>

                        <h4 className="text-base font-black text-slate-800 dark:text-slate-100">
                            {swapResult.smart_swap.swap_name}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                            {swapResult.smart_swap.reason}
                        </p>

                        <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl text-center text-xs border border-emerald-100 dark:border-slate-700">
                            <div>
                                <span className="text-slate-400 block font-semibold">Calories</span>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                    {swapResult.smart_swap.calories} kcal
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-semibold">Protein</span>
                                <span className="font-extrabold text-rose-500">
                                    {swapResult.smart_swap.protein}g
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-semibold">Fat</span>
                                <span className="font-extrabold text-blue-500">
                                    {swapResult.smart_swap.fat}g
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartFoodSwapModal;

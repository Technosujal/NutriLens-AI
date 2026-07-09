import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Calendar, Trash2, Edit3, X, Plus, Sparkles, Loader2, ListFilter } from 'lucide-react';
import api from '../services/api';
import useToast from '../hooks/useToast';
import MealItemCard from '../components/Meal/MealItemCard';

export const MealHistory = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  // Editing state
  const [editingMeal, setEditingMeal] = useState(null);
  const [editMealType, setEditMealType] = useState('Breakfast');
  const [editMealName, setEditMealName] = useState('');
  const [editMealDate, setEditMealDate] = useState('');
  const [editItems, setEditItems] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

  // Fetch meals history
  const fetchMeals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDate) params.date = filterDate;
      if (searchQuery) params.query = searchQuery;
      
      const response = await api.get('/meals', { params });
      setMeals(response.data);
      
      // If edit query param is present, open that meal immediately
      const editId = searchParams.get('edit');
      if (editId && response.data.length > 0) {
        const mealToEdit = response.data.find(m => m.id === parseInt(editId));
        if (mealToEdit) {
          openEditModal(mealToEdit);
          // Clear query param
          setSearchParams({});
        }
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to load meal history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [filterDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMeals();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterDate('');
    // Trigger reloading
    setMeals([]);
    api.get('/meals').then(res => setMeals(res.data));
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Delete this meal log?')) return;
    try {
      await api.delete(`/meal/${mealId}`);
      showToast('Meal log deleted successfully.', 'success');
      fetchMeals();
    } catch (error) {
      console.error(error);
      showToast('Failed to delete meal log.', 'error');
    }
  };

  // Editing logic
  const openEditModal = (meal) => {
    setEditingMeal(meal);
    setEditMealType(meal.meal_type);
    setEditMealName(meal.name);
    setEditMealDate(meal.date);
    // Deep copy items so we don't modify state directly
    setEditItems(meal.items.map(item => ({ ...item })));
  };

  const handleEditItemChange = (idx, field, value) => {
    const updated = [...editItems];
    if (field === 'quantity' || field === 'calories' || field === 'protein' || field === 'carbs' || field === 'fat' || field === 'fiber') {
      updated[idx][field] = parseFloat(value) || 0;
    } else {
      updated[idx][field] = value;
    }
    setEditItems(updated);
  };

  const handleAddEditItem = () => {
    setEditItems([
      ...editItems,
      { food_name: 'New Food Item', quantity: 1.0, serving_size: '1 serving', calories: 100, protein: 5, carbs: 15, fat: 2, fiber: 1 }
    ]);
  };

  const handleRemoveEditItem = (idx) => {
    setEditItems(editItems.filter((_, i) => i !== idx));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (editItems.length === 0) {
      showToast('Meal must have at least 1 food item.', 'warning');
      return;
    }

    setEditLoading(true);
    try {
      await api.put(`/meal/${editingMeal.id}`, {
        meal_type: editMealType,
        name: editMealName,
        date: editMealDate,
        items: editItems.map(item => ({
          food_name: item.food_name,
          quantity: item.quantity,
          serving_size: item.serving_size,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber
        }))
      });
      showToast('Meal log updated successfully!', 'success');
      setEditingMeal(null);
      fetchMeals();
    } catch (error) {
      console.error(error);
      showToast('Failed to update meal log.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Meal History
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review, search, and manage your previously logged meals.
        </p>
      </div>

      {/* Search & Filter Panel */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md flex gap-2">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search food, e.g. eggs, dal, salad..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Search
          </button>
        </form>

        <div className="flex w-full md:w-auto items-center gap-3">
          {/* Date Picker Filter */}
          <div className="relative w-full md:w-44">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors font-semibold"
            />
          </div>

          <button
            onClick={handleResetFilters}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold transition-all whitespace-nowrap"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* History Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        </div>
      ) : meals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meals.map((meal) => (
            <MealItemCard
              key={meal.id}
              meal={meal}
              onDelete={handleDeleteMeal}
              onEdit={openEditModal}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 max-w-lg mx-auto">
          <ListFilter className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No logs match your search.</h4>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">
            Try adjusting your query or logging a new meal on the dashboard.
          </p>
        </div>
      )}

      {/* Advanced Edit Modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl transition-all duration-300 my-8">
            <form onSubmit={handleSaveEdit}>
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Edit Meal Log details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingMeal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      Meal Type
                    </label>
                    <select
                      value={editMealType}
                      onChange={(e) => setEditMealType(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snacks">Snacks</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      Meal Description/Name
                    </label>
                    <input
                      type="text"
                      value={editMealName}
                      onChange={(e) => setEditMealName(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* Items Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      Food Items & Nutrients (per 1 serving)
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddEditItem}
                      className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Food
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 relative space-y-3"
                      >
                        {/* Remove item button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveEditItem(idx)}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-6">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Food Name</label>
                            <input
                              type="text"
                              value={item.food_name}
                              onChange={(e) => handleEditItemChange(idx, 'food_name', e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Serving Size</label>
                            <input
                              type="text"
                              value={item.serving_size || ''}
                              onChange={(e) => handleEditItemChange(idx, 'serving_size', e.target.value)}
                              placeholder="e.g. 1 bowl, 100g"
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block mb-1">Quantity eaten</label>
                            <input
                              type="number"
                              step="0.1"
                              value={item.quantity}
                              onChange={(e) => handleEditItemChange(idx, 'quantity', e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        {/* Nutrition details grid */}
                        <div className="grid grid-cols-5 gap-2 text-center">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Kcal</label>
                            <input
                              type="number"
                              value={item.calories}
                              onChange={(e) => handleEditItemChange(idx, 'calories', e.target.value)}
                              className="w-full text-center px-1.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Prot (g)</label>
                            <input
                              type="number"
                              value={item.protein}
                              onChange={(e) => handleEditItemChange(idx, 'protein', e.target.value)}
                              className="w-full text-center px-1.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Carb (g)</label>
                            <input
                              type="number"
                              value={item.carbs}
                              onChange={(e) => handleEditItemChange(idx, 'carbs', e.target.value)}
                              className="w-full text-center px-1.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Fat (g)</label>
                            <input
                              type="number"
                              value={item.fat}
                              onChange={(e) => handleEditItemChange(idx, 'fat', e.target.value)}
                              className="w-full text-center px-1.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-violet-500 uppercase tracking-wider">Fib (g)</label>
                            <input
                              type="number"
                              value={item.fiber}
                              onChange={(e) => handleEditItemChange(idx, 'fiber', e.target.value)}
                              className="w-full text-center px-1.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-end space-x-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setEditingMeal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealHistory;

import React, { useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
      aria-label="Toggle Theme Mode"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45 duration-300" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-600 transition-transform hover:-rotate-12 duration-300" />
      )}
    </button>
  );
};

export default ThemeToggle;

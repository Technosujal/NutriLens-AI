import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, HeartPulse, User, Calendar } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export const Navbar = () => {
  const { token, user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'History', path: '/history' },
    { name: 'AI Recommendations', path: '/recommendations' },
    { name: 'Profile', path: '/profile' },
  ];

  // Formatting current date e.g. "Monday, July 6"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <HeartPulse className="w-8 h-8 text-emerald-500 mr-2 animate-pulse-ring rounded-full" />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              CalorieAI
            </span>
          </div>

          {/* Navigation Links for Authenticated Users (Desktop) */}
          {token && (
            <div className="hidden md:flex space-x-1 lg:space-x-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          )}

          {/* Controls Panel (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {token && (
              <div className="flex items-center space-x-3 pr-2 border-r border-slate-200 dark:border-slate-800">
                {/* Date tag */}
                <div className="flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {formattedDate}
                </div>
                
                {/* User avatar/name */}
                <div className="flex items-center text-slate-700 dark:text-slate-300 text-sm font-semibold select-none">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mr-2">
                    <User className="w-4 h-4" />
                  </div>
                  {user?.name || 'Loading...'}
                </div>
              </div>
            )}
            
            <ThemeToggle />

            {token && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-3">
            <ThemeToggle />
            {token && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {token && isMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
            <div className="border-t border-slate-100 dark:border-slate-800/60 my-2 pt-2">
              <div className="px-4 py-2 flex items-center text-slate-700 dark:text-slate-300 text-sm font-semibold">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mr-2">
                  <User className="w-4 h-4" />
                </div>
                {user?.name || 'Loading...'}
              </div>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-base font-semibold transition-all duration-200"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

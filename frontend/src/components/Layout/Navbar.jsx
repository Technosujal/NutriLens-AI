import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Sparkles, User, Calendar, Flame, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    { name: 'Dashboard', path: '/', icon: Activity },
    { name: 'AI Coach', path: '/coach', icon: Sparkles, badge: 'Live' },
    { name: 'Meal History', path: '/history' },
    { name: 'RAG Hub', path: '/recommendations' },
    { name: 'Profile', path: '/profile' },
  ];

  // Formatting current date e.g. "Mon, Sep 1"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl transition-all duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-17">
          
          {/* Brand Logo */}
          <motion.div 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center space-x-3 cursor-pointer group select-none" 
            onClick={() => navigate('/')}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-glowEmerald group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-emerald-400 fill-emerald-400/20 animate-flame" />
              </div>
            </div>
            <div>
              <span className="font-display text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center">
                Nutri<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Lens</span>
                <span className="ml-1.5 text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 tracking-wider">
                  AI
                </span>
              </span>
            </div>
          </motion.div>

          {/* Navigation Links (Desktop) */}
          {token && (
            <div className="hidden md:flex items-center space-x-1 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive
                        ? 'text-slate-950 dark:text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
                    }`
                  }
                >
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-amber-400/30 text-amber-900 dark:text-amber-200 border border-amber-400/40 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          )}

          {/* Controls Panel (Desktop) */}
          <div className="hidden md:flex items-center space-x-2.5">
            {token && (
              <>
                <div className="hidden lg:flex items-center text-xs font-bold px-3 py-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  {formattedDate}
                </div>
                
                {/* User avatar pill */}
                <motion.div 
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/profile')}
                  className="flex items-center pl-1 pr-3 py-1 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs cursor-pointer hover:border-emerald-500/40 transition-all"
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center mr-2 font-black text-xs shadow-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {user?.name || 'Athlete'}
                  </span>
                </motion.div>
              </>
            )}
            
            <ThemeToggle />

            {token && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-500/20 transition-all duration-200"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeToggle />
            {token && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      <AnimatePresence>
        {token && isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl px-4 py-4 space-y-2"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <span>{item.name}</span>
                {item.badge && (
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between">
              <div className="flex items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-900 flex items-center justify-center mr-2 font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user?.name || 'Athlete'}</span>
              </div>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition-all"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

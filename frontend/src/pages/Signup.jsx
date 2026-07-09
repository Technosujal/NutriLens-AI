import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse, KeyRound, Mail, User, Loader2, ArrowRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import useToast from '../hooks/useToast';

export const Signup = () => {
  const { signup } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    setLoading(true);
    const result = await signup(email, password, name);
    setLoading(false);

    if (result.success) {
      showToast('Account created successfully! Welcome to CalorieAI.', 'success');
      // Redirect to profile page for initial onboarding
      navigate('/profile');
    } else {
      showToast(result.error, 'error');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 transition-all">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl p-8 glassmorphism">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center rounded-2xl mb-3 animate-pulse-ring">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Start Your Journey
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-400 mt-1">
            Create an account to start tracking calories with AI.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
              Your Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <>
                Sign Up
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 dark:text-slate-400 mt-6 font-medium">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

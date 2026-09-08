import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Flame, KeyRound, Mail, Loader2, ArrowRight, Eye, EyeOff, 
  Sparkles, Bot, Camera, Mic, CheckCircle2, ShieldCheck, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import { triggerConfetti } from '../components/UI/ConfettiEffect';

export const Login = () => {
  const { login } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      showToast('Welcome back to NutriLens AI! 🚀', 'success');
      triggerConfetti('Welcome back!');
      navigate('/');
    } else {
      showToast(result.error || 'Invalid email or password.', 'error');
    }
  };

  // Demo auto-fill helper
  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  const featurePills = [
    { icon: Camera, text: 'AI Multimodal Vision', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400' },
    { icon: Mic, text: 'Hands-Free Voice NLP', color: 'from-teal-500/20 to-cyan-500/20 text-teal-300' },
    { icon: Bot, text: 'RAG Sports Coach', color: 'from-indigo-500/20 to-purple-500/20 text-indigo-300' },
  ];

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      {/* Background Animated Aurora Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none animate-float-reverse" />
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-cyan-500/8 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Brand Teaser & Live Metric Visuals (Desktop) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4"
        >
          {/* Logo & Headline */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 select-none">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-glowEmerald">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Flame className="w-6 h-6 text-emerald-400 fill-emerald-400/20 animate-flame" />
                </div>
              </div>
              <div>
                <span className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center">
                  Nutri<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Lens</span>
                  <span className="ml-2 text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 tracking-wider">
                    AI 2.0
                  </span>
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900 dark:text-white tracking-tight leading-tight">
              Fuel Your Potential With{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Intelligent Nutrition
              </span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-md">
              Log meals hands-free with AI photo recognition and voice dictation. Connect your daily macros to customized sports nutrition coaching.
            </p>
          </div>

          {/* Interactive Feature Pills */}
          <div className="flex flex-wrap gap-2.5">
            {featurePills.map((pill, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md shadow-xs"
              >
                <pill.icon className={`w-4 h-4 ${pill.color.split(' ')[2]}`} />
                <span className="text-xs font-black text-slate-700 dark:text-slate-200">{pill.text}</span>
              </div>
            ))}
          </div>

          {/* Floating Mini Mock Card */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="p-5 rounded-3xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl shadow-glassDark text-white space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black tracking-wider uppercase text-emerald-400">Live AI Nutrition Log</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                1,840 kcal remaining
              </span>
            </div>
            
            <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  🥗
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-200">Grilled Salmon & Avocado Bowl</h5>
                  <p className="text-[10px] text-slate-400">540 kcal • 42g Protein • 18g Fat</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Grade A+
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-6 w-full"
        >
          <div className="w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-7 sm:p-9 relative overflow-hidden glow-card-emerald">
            
            {/* Ambient corner glow */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col items-center justify-center text-center mb-7">
              <div className="w-13 h-13 bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center rounded-2xl mb-3 shadow-glowEmerald">
                <Flame className="w-7 h-7 animate-flame" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Log into your personalized NutriLens AI dashboard.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-xs font-semibold transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-xs font-semibold transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-2xl shadow-glowEmerald transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Log In to Dashboard
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Quick Demo Credentials helper */}
            <div className="mt-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">
                Quick Test Account:
              </span>
              <button
                type="button"
                onClick={() => handleQuickFill('sujaldhar777@gmail.com', '123456')}
                className="text-xs font-black text-emerald-500 hover:text-emerald-400 hover:underline inline-flex items-center cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 mr-1" />
                Fill Demo Credentials (sujaldhar777@gmail.com)
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 font-medium">
              New to NutriLens AI?{' '}
              <Link
                to="/signup"
                className="text-emerald-500 dark:text-emerald-400 hover:underline font-black"
              >
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import AnimatedRoute from './components/Layout/AnimatedRoute';

// Page Imports
import Dashboard from './pages/Dashboard';
import MealHistory from './pages/MealHistory';
import Recommendations from './pages/Recommendations';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
          <span className="text-sm font-semibold tracking-wide">Loading CalorieAI...</span>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppContent() {
  const { token } = useContext(AuthContext);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Navbar />
      <main className="transition-all duration-300">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/signup" element={token ? <Navigate to="/" replace /> : <Signup />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AnimatedRoute>
                    <Dashboard />
                  </AnimatedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <AnimatedRoute>
                    <MealHistory />
                  </AnimatedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute>
                  <AnimatedRoute>
                    <Recommendations />
                  </AnimatedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AnimatedRoute>
                    <Profile />
                  </AnimatedRoute>
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

import React, { createContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  // Utility icons for Toast
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 mr-2 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />;
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20 dark:border-emerald-500/10 bg-emerald-50/90 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
      case 'error':
        return 'border-rose-500/20 dark:border-rose-500/10 bg-rose-50/90 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300';
      case 'warning':
        return 'border-amber-500/20 dark:border-amber-500/10 bg-amber-50/90 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300';
      case 'info':
      default:
        return 'border-blue-500/20 dark:border-blue-500/10 bg-blue-50/90 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-4 rounded-xl border shadow-lg glassmorphism transition-all duration-300 transform translate-y-0 opacity-100 pointer-events-auto ${getTypeStyles(
              toast.type
            )}`}
          >
            <div className="flex items-center">
              {getIcon(toast.type)}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 hover:opacity-75 transition-opacity"
            >
              <X className="w-4 h-4 opacity-60" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

import React from 'react';

export const SkeletonCard = ({ className = "" }) => {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800/60 rounded-2xl ${className}`}></div>
  );
};

export const SkeletonText = ({ className = "h-4 w-3/4" }) => {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800/60 rounded-lg ${className}`}></div>
  );
};

export const SkeletonDashboard = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Target stats skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64 bg-slate-200 dark:bg-slate-800/40 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800/40 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800/40 rounded-2xl"></div>
      </div>
      
      {/* Dashboard logger card skeleton */}
      <div className="h-32 bg-slate-200 dark:bg-slate-800/40 rounded-2xl"></div>
      
      {/* Charts skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-slate-200 dark:bg-slate-800/40 rounded-2xl"></div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800/40 rounded-2xl"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;

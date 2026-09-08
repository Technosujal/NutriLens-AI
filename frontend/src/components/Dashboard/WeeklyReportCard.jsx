import React, { useEffect, useState } from 'react';
import { FileText, TrendingUp, Award, Droplets, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export const WeeklyReportCard = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchWeeklyReport = async () => {
        setLoading(true);
        try {
            const res = await api.get('/rag/weekly-report');
            setReport(res.data);
        } catch (error) {
            console.error('Failed to load weekly report', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeeklyReport();
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 p-6 shadow-glass animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                <div className="h-20 bg-slate-100 dark:bg-slate-700/50 rounded-2xl"></div>
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-glass dark:shadow-glassDark p-6 space-y-5">
            {/* Title bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-500 rounded-xl">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                            Weekly RAG Health Report
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold">
                            Period: {report.period} ({report.days_logged} days logged)
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchWeeklyReport}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 rounded-xl transition-all"
                    title="Refresh report"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Micro progress stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/40">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>Avg Daily Calories</span>
                        <span className="text-indigo-500">{report.adherence.calorie_pct}% goal</span>
                    </div>
                    <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
                        {report.averages.calories} <span className="text-xs text-slate-400 font-normal">kcal</span>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/40">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>Avg Daily Protein</span>
                        <span className="text-rose-500">{report.adherence.protein_pct}% goal</span>
                    </div>
                    <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
                        {report.averages.protein} <span className="text-xs text-slate-400 font-normal">g</span>
                    </div>
                </div>
            </div>

            {/* Dynamic AI Insights */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    RAG Personalized Insights
                </h4>
                <div className="space-y-2">
                    {report.insights.map((insight, idx) => (
                        <div
                            key={idx}
                            className="p-3 bg-slate-50/70 dark:bg-slate-900/30 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed border border-slate-100 dark:border-slate-700/30"
                            dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WeeklyReportCard;

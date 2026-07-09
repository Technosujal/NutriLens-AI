import React, { useState } from 'react';
import { Send, CornerDownLeft, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import api from '../../services/api';
import useToast from '../../hooks/useToast';

const Chatbot = () => {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
    };

    const handleSendQuery = async () => {
        if (!query.trim()) return;

        const newHistory = [...history, { type: 'user', text: query }];
        setHistory(newHistory);
        setQuery('');
        setLoading(true);

        try {
            const response = await api.post('/recommendations/chat', { query });
            const aiResponse = response.data.response;
            setHistory([...newHistory, { type: 'ai', text: aiResponse }]);
        } catch (error) {
            console.error(error);
            showToast('Failed to get response from AI. Please try again.', 'error');
            setHistory(newHistory); // Revert history if AI call fails
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendQuery();
        }
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-glass dark:shadow-glassDark p-6 space-y-4">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center">
                <Bot className="w-6 h-6 text-indigo-500 mr-2" />
                Conversational AI Nutritionist
            </h2>
            <div className="h-80 overflow-y-auto pr-4 space-y-4">
                {history.map((entry, index) => (
                    <div key={index} className={`flex items-start gap-3 ${entry.type === 'user' ? 'justify-end' : ''}`}>
                        {entry.type === 'ai' && <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                        <div className={`p-3 rounded-2xl max-w-lg ${entry.type === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            <p className="text-sm leading-relaxed">{entry.text}</p>
                        </div>
                         {entry.type === 'user' && <User className="w-5 h-5 text-slate-500 flex-shrink-0" />}
                    </div>
                ))}
                {loading && (
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-700">
                           <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        </div>
                    </div>
                )}
            </div>
            <div className="relative">
                <textarea
                    value={query}
                    onChange={handleQueryChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask for diet advice..."
                    className="w-full p-4 pr-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-medium resize-none"
                    rows="2"
                />
                <button
                    onClick={handleSendQuery}
                    disabled={loading || !query.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Chatbot;

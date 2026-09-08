import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, X, Loader2, BookOpen, Flame, Mic, MicOff, 
  CheckCircle2, Utensils, Droplets, Scale, ArrowRight, Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';
import useSpeechToText from '../../hooks/useSpeechToText';

const QUICK_ACTIONS = [
  { label: '🍳 Log 2 Eggs & Toast', query: 'Log 2 boiled eggs and 1 slice toast for breakfast' },
  { label: '💧 Add 500ml Water', query: 'Add 500 ml water for today' },
  { label: '🥗 Suggest Dinner <500 kcal', query: 'Suggest a dinner under 500 kcal for my remaining macros' },
  { label: '📊 Weekly Protein Intake', query: 'How has my protein intake been over the past week?' }
];

export const AICoachDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: "👋 Hi! I'm your **Personal AI Health Coach**.\n\nI can answer nutrition questions, analyze your logs via **RAG**, or **directly log meals & water** (e.g. *\"Log 2 eggs & toast for breakfast\"*, *\"Add 500ml water\"*).\n\nTap 🎙️ to talk hands-free!",
      citations: [],
      action: null
    }
  ]);

  const messagesEndRef = useRef(null);

  // Voice speech-to-text integration
  const { isListening, transcript, startListening, stopListening, resetTranscript, supported } = useSpeechToText({ continuous: false });

  useEffect(() => {
    const handleOpenCoachEvent = () => setIsOpen(true);
    window.addEventListener('nutrilens_open_coach', handleOpenCoachEvent);
    return () => window.removeEventListener('nutrilens_open_coach', handleOpenCoachEvent);
  }, []);

  useEffect(() => {
    if (!isListening && transcript.trim().length > 0) {
      setInputMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userMsgId = Date.now().toString();
    const newMessages = [
      ...messages,
      { id: userMsgId, sender: 'user', text: query, citations: [] }
    ];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    // Build history for multi-turn conversational context
    const chatHistory = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }));

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const response = await api.post('/rag/coach-chat', {
        message: query,
        chat_history: chatHistory,
        date: todayStr
      });

      const citations = response.data.citations || [];
      const actionPerformed = response.data.action_performed || null;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: response.data.response,
          citations,
          action: actionPerformed
        }
      ]);

      // If an agentic action was executed (e.g. water logged, meal logged, weight updated), notify UI to refresh immediately
      if (actionPerformed) {
        window.dispatchEvent(new CustomEvent('calorie_ai_data_updated', { detail: actionPerformed }));
      }
    } catch (err) {
      console.error('Coach chat failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: '⚠️ Sorry, I encountered an issue retrieving your logs. Please try again in a moment.',
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 px-4 py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-emerald-300/50 transition-all cursor-pointer text-xs"
        title="Chat with AI Health Coach"
      >
        <div className="relative">
          <Bot className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full"></span>
        </div>
        <span className="hidden sm:inline tracking-tight font-display text-sm">Ask AI Coach</span>
      </motion.button>

      {/* Slide-out Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full z-50 border-l border-slate-200/80 dark:border-slate-800"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-emerald-500/15 via-teal-500/5 to-transparent flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-glowEmerald">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      <Bot className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-slate-900 dark:text-white text-base font-display">
                        NutriLens AI Coach
                      </h3>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Live RAG
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Connected to your live macro & water logs
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-3xl px-4.5 py-3.5 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold rounded-br-xs shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      <div className="prose dark:prose-invert prose-xs max-w-none text-xs leading-relaxed font-sans">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>

                      {/* Action confirmation widget */}
                      {msg.action && (
                        <div className="mt-3 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs space-y-1.5">
                          <div className="flex items-center space-x-1.5 font-black text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Action Logged in Database</span>
                          </div>
                          {msg.action.type === 'meal' && (
                            <div className="font-bold text-slate-200">
                              🥗 {msg.action.meal_name || msg.action.meal_type} (~{Math.round(msg.action.calories || 0)} kcal)
                            </div>
                          )}
                          {msg.action.type === 'water' && (
                            <div className="font-bold text-teal-300">
                              💧 +{msg.action.amount_ml}ml (Total: {msg.action.total_ml}ml)
                            </div>
                          )}
                        </div>
                      )}

                      {/* Grounded In Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center mb-1">
                            <BookOpen className="w-3 h-3 mr-1 text-emerald-400" /> Grounded In:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {msg.citations.map((c, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                              >
                                {c.source} ({c.score}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold p-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>AI Coach is querying your logs & nutrition knowledge...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Voice Visualizer Indicator */}
              {isListening && (
                <div className="px-5 py-2 bg-rose-500/10 border-t border-rose-500/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping mr-2" />
                    Listening to your voice...
                  </span>
                  <div className="flex items-center space-x-1 h-5">
                    <div className="w-1 bg-rose-400 rounded-full animate-audio-bar-1" />
                    <div className="w-1 bg-rose-400 rounded-full animate-audio-bar-2" />
                    <div className="w-1 bg-rose-400 rounded-full animate-audio-bar-3" />
                    <div className="w-1 bg-rose-400 rounded-full animate-audio-bar-4" />
                    <div className="w-1 bg-rose-400 rounded-full animate-audio-bar-5" />
                  </div>
                </div>
              )}

              {/* Quick Actions Bar */}
              <div className="px-5 py-2.5 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center">
                  <Zap className="w-3 h-3 mr-1 text-amber-400" /> Suggested Prompts:
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <motion.button
                      whileHover={{ scale: 1.04, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      key={idx}
                      onClick={() => handleSendMessage(action.query)}
                      disabled={loading}
                      className="whitespace-nowrap text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-all font-semibold flex-shrink-0 shadow-xs cursor-pointer"
                    >
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Input Field */}
              <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center space-x-2"
                >
                  {supported && (
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isListening
                          ? 'bg-rose-500 text-white border-rose-600 shadow-md animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-emerald-400'
                      }`}
                      title={isListening ? 'Stop Listening' : 'Speak to Coach'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </motion.button>
                  )}

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isListening ? 'Listening...' : 'Log meal, water, or ask anything...'}
                    disabled={loading}
                    className="flex-1 px-4 py-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium shadow-inner"
                  />

                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    type="submit"
                    disabled={!inputMessage.trim() || loading}
                    className="p-3 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-2xl shadow-glowEmerald disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AICoachDrawer;

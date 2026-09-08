import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Bot, Send, Sparkles, Mic, MicOff, BookOpen, Trash2, Copy, Check, 
  Flame, Droplets, Target, Loader2, ArrowRight, Utensils, Scale,
  CheckCircle2, ChevronRight, Zap, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import useSpeechToText from '../hooks/useSpeechToText';
import useToast from '../hooks/useToast';

const QUICK_ACTIONS = [
  {
    label: '🍳 Log 2 Eggs & Toast',
    query: 'Log 2 boiled eggs and 1 slice toast for breakfast',
    type: 'meal'
  },
  {
    label: '🥣 Log 1 Bowl Oatmeal',
    query: 'I ate 1 bowl of oatmeal with banana and honey for breakfast',
    type: 'meal'
  },
  {
    label: '🥗 Log Grilled Chicken Salad',
    query: 'Log 1 plate grilled chicken salad for lunch',
    type: 'meal'
  },
  {
    label: '💧 Log 500ml Water',
    query: 'Add 500 ml water for today',
    type: 'water'
  },
  {
    label: '⚖️ Log Weight 72.5 kg',
    query: 'Log my weight as 72.5 kg',
    type: 'weight'
  }
];

const CATEGORIZED_PROMPTS = [
  {
    category: '📊 Progress & Deficits',
    icon: <Target className="w-4 h-4 text-cyan-400" />,
    prompts: [
      'How has my protein intake been over the past week?',
      'Why is my weight plateauing based on my logged calories?',
      'Am I in a healthy calorie deficit for my target weight?'
    ]
  },
  {
    category: '🥗 Smart Meal Ideas',
    icon: <Flame className="w-4 h-4 text-amber-400" />,
    prompts: [
      'Suggest a dinner under 500 kcal that fits my remaining macros today',
      'What are 3 high-protein snack ideas for post-workout?',
      'How can I improve the fiber content of my meals?'
    ]
  },
  {
    category: '💧 Hydration & Recovery',
    icon: <Droplets className="w-4 h-4 text-teal-400" />,
    prompts: [
      'Analyze my hydration consistency over recent days',
      'What are the best recovery foods after a heavy workout?'
    ]
  }
];

export const AICoach = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('calorie_ai_coach_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: `## Hello, ${user?.name || 'Champion'}! 👋\n\nI'm your **Personal AI Health Coach & Sports Nutritionist**.\n\nI have real-time access to your database records via **RAG (Retrieval-Augmented Generation)**:\n- 🥗 **Your Logged Meals & Macronutrient Totals**\n- 💧 **Your Daily Hydration Logs**\n- ⚖️ **Your Weight History & Targets**\n- 📖 **Clinical Sports Nutrition Guidelines**\n\n💡 *Tip: You can ask questions OR directly command me to log meals and water (e.g. "Log 2 eggs and toast for breakfast", "Add 500ml water")!*`,
        citations: [],
        action: null
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedCitations, setSelectedCitations] = useState([]);

  const messagesEndRef = useRef(null);

  // Speech to text integration
  const { isListening, transcript, startListening, stopListening, resetTranscript, supported } = useSpeechToText({ continuous: false });

  useEffect(() => {
    if (!isListening && transcript.trim().length > 0) {
      setInputMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  useEffect(() => {
    localStorage.setItem('calorie_ai_coach_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    // Build chat history formatted for backend
    const chatHistory = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }));

    const userMsgId = Date.now().toString();
    const newMessages = [
      ...messages,
      { id: userMsgId, sender: 'user', text: query, citations: [] }
    ];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

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

      if (citations.length > 0) {
        setSelectedCitations(citations);
      }

      // If an agentic action was executed (e.g. water logged, meal logged, weight updated), notify UI to refresh immediately
      if (actionPerformed) {
        window.dispatchEvent(new CustomEvent('calorie_ai_data_updated', { detail: actionPerformed }));
        if (actionPerformed.type === 'meal') {
          showToast(`Successfully logged ${actionPerformed.meal_name || actionPerformed.meal_type || 'meal'}!`, 'success');
        } else if (actionPerformed.type === 'water') {
          showToast(`Logged ${actionPerformed.amount_ml}ml water in database!`, 'success');
        } else if (actionPerformed.type === 'weight') {
          showToast(`Updated weight to ${actionPerformed.weight_kg}kg!`, 'success');
        } else {
          showToast('Database updated successfully!', 'success');
        }
      }
    } catch (err) {
      console.error('Coach chat request failed:', err);
      showToast('AI Coach could not generate a response. Please check connection.', 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: '⚠️ I encountered an issue processing your request. Please try asking again in a moment.',
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (!window.confirm('Are you sure you want to reset the coaching conversation?')) return;
    const initial = [
      {
        id: 'welcome',
        sender: 'ai',
        text: `## Chat Reset! 👋\n\nReady for a fresh session. Ask me anything about your diet, workouts, or command me to log meals and hydration!`,
        citations: []
      }
    ];
    setMessages(initial);
    setSelectedCitations([]);
    localStorage.removeItem('calorie_ai_coach_history');
    showToast('Coaching history reset.', 'info');
  };

  const copyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Message copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 shadow-glassDark">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-glowEmerald">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Bot className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
                    AI Health & Nutrition Coach
                  </h1>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wider">
                    Agentic RAG Active
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  Real-time conversational intelligence connected directly to your meals, macros, and hydration logs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto">
            <button
              onClick={handleClearHistory}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-xl text-xs font-bold transition-all border border-slate-700 hover:border-rose-500/30 shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Chat</span>
            </button>
          </div>
        </div>

        {/* Quick Action Pills */}
        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 mb-2.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Agentic Commands (Tap to execute):</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(action.query)}
                disabled={loading}
                className="whitespace-nowrap text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-emerald-500/20 border border-slate-700/80 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 transition-all flex items-center space-x-1.5 flex-shrink-0 group"
              >
                <span>{action.label}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Chat Workspace + RAG Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Center Chat Area (2 Columns) */}
        <div className="lg:col-span-2 flex flex-col glass-card overflow-hidden h-[72vh]">
          
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Header */}
                <div className="flex items-center space-x-2 mb-1 px-1 text-[11px] font-bold text-slate-400">
                  {msg.sender === 'ai' && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                  )}
                  <span>{msg.sender === 'user' ? 'You' : 'NutriLens AI Coach'}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative group max-w-[94%] sm:max-w-[85%] rounded-3xl px-5 py-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs shadow-md font-medium'
                      : 'bg-white/80 dark:bg-slate-800/85 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs shadow-xs'
                  }`}
                >
                  <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>

                  {/* Render Action Confirmation Card if Action was Performed */}
                  {msg.action && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3.5 p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-500/30 text-slate-800 dark:text-slate-100 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Action Executed & Synced with Database</span>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 dark:text-emerald-300">
                          {msg.action.type}
                        </span>
                      </div>

                      {msg.action.type === 'meal' && (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                            <span className="flex items-center space-x-1.5">
                              <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{msg.action.meal_name || msg.action.meal_type}</span>
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                              {msg.action.calories ? `${Math.round(msg.action.calories)} kcal` : ''}
                            </span>
                          </div>

                          {/* Macro pills */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {msg.action.protein !== undefined && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] border border-blue-500/20">
                                🍗 {msg.action.protein}g Protein
                              </span>
                            )}
                            {msg.action.carbs !== undefined && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px] border border-amber-500/20">
                                🍞 {msg.action.carbs}g Carbs
                              </span>
                            )}
                            {msg.action.fat !== undefined && (
                              <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[11px] border border-rose-500/20">
                                🥑 {msg.action.fat}g Fat
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {msg.action.type === 'water' && (
                        <div className="flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400">
                          <span className="flex items-center space-x-1.5">
                            <Droplets className="w-4 h-4 text-teal-500" />
                            <span>Added {msg.action.amount_ml} ml</span>
                          </span>
                          <span>Total Today: {msg.action.total_ml} ml</span>
                        </div>
                      )}

                      {msg.action.type === 'weight' && (
                        <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                          <span className="flex items-center space-x-1.5">
                            <Scale className="w-4 h-4 text-purple-500" />
                            <span>Logged Weight</span>
                          </span>
                          <span>{msg.action.weight_kg} kg</span>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Message Tools (Copy & Citations) */}
                  <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/40 text-xs">
                    {msg.citations && msg.citations.length > 0 ? (
                      <button
                        onClick={() => setSelectedCitations(msg.citations)}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>View {msg.citations.length} Grounded Contexts</span>
                      </button>
                    ) : <div />}

                    <button
                      onClick={() => copyMessage(msg.id, msg.text)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/70 text-xs font-bold text-slate-300 shadow-sm"
              >
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400 flex-shrink-0" />
                <span className="animate-pulse">Coach is querying your database records, estimating nutritional profiles, and synthesizing recommendations...</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Recording Active Banner */}
          {isListening && (
            <div className="px-6 py-2.5 bg-rose-500/10 border-t border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 bg-rose-500 rounded-full animate-audio-bar-1" />
                  <span className="w-1.5 bg-rose-500 rounded-full animate-audio-bar-2" />
                  <span className="w-1.5 bg-rose-500 rounded-full animate-audio-bar-3" />
                  <span className="w-1.5 bg-rose-500 rounded-full animate-audio-bar-4" />
                  <span className="w-1.5 bg-rose-500 rounded-full animate-audio-bar-5" />
                </div>
                <span className="text-xs font-bold text-rose-400">Listening to your voice... Speak your meal or question.</span>
              </div>
              <button
                onClick={stopListening}
                className="text-xs font-bold px-3 py-1 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                Done Speaking
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-slate-200/60 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              {supported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`p-3 rounded-2xl border transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white border-rose-600 shadow-glowRose animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-emerald-400 hover:border-emerald-500/40'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Speak Message'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask advice, or tell coach (e.g. 'Log 2 eggs & toast for breakfast', 'Add 500ml water')..."
                disabled={loading}
                className="flex-1 px-4 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition-all"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl shadow-glowEmerald disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-1.5"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: RAG Grounding Inspector & Question Library */}
        <div className="space-y-6">
          
          {/* RAG Context Inspector */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-display">
                RAG Retrieval Inspector
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Live semantic records and guidelines retrieved from your database during chat:
            </p>

            {selectedCitations && selectedCitations.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedCitations.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/70 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="truncate max-w-[70%]">{c.source}</span>
                      <span className="text-[10px] font-extrabold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {c.score}% Match
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Type: {c.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700/80 text-center text-xs text-slate-400 font-medium">
                Send a question or command to inspect live semantic vectors and action groundings.
              </div>
            )}
          </div>

          {/* Categorized Question Library */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-display">
                Explore Coaching Topics
              </h3>
            </div>

            <div className="space-y-4">
              {CATEGORIZED_PROMPTS.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    {cat.icon}
                    <span>{cat.category}</span>
                  </h4>
                  <div className="space-y-1.5">
                    {cat.prompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendMessage(p)}
                        disabled={loading}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500/30 text-xs text-slate-700 dark:text-slate-300 hover:text-emerald-400 transition-all font-medium flex items-center justify-between group"
                      >
                        <span className="truncate pr-2">{p}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AICoach;

import React, { useEffect, useState } from 'react';
import { Mic, MicOff, AlertCircle, Loader2 } from 'lucide-react';
import useSpeechToText from '../../hooks/useSpeechToText';

export const VoiceLogger = ({ mealType, date, onMealLogged, onSuccess, onClose, showToast }) => {
  const {
    isListening,
    transcript,
    error: speechError,
    supported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechToText({ continuous: false });

  const [loading, setLoading] = useState(false);
  const [submittingTranscript, setSubmittingTranscript] = useState('');

  // Automatically submit once listening stops and we have a transcript
  useEffect(() => {
    if (!isListening && transcript.trim().length > 0) {
      submitVoiceTranscript(transcript);
    }
  }, [isListening, transcript]);

  const toggleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const submitVoiceTranscript = async (textToSubmit) => {
    setLoading(true);
    setSubmittingTranscript(textToSubmit);
    try {
      await onMealLogged({
        text: textToSubmit,
        date,
        meal_type: mealType,
        isVoice: true
      });
      showToast('Meal logged successfully!', 'success');
      resetTranscript();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to log voice meal:', err);
    } finally {
      setLoading(false);
      setSubmittingTranscript('');
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center p-4 rounded-xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 text-sm">
        <AlertCircle className="w-5 h-5 mr-2.5 flex-shrink-0" />
        <span>{speechError}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      
      {/* Visual Ripple and microphone container */}
      <div className="relative mb-6">
        {isListening && (
          <>
            <span className="absolute -inset-2 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full animate-ping"></span>
            <span className="absolute -inset-4 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full animate-[pulse_1.5s_infinite]"></span>
          </>
        )}
        
        <button
          onClick={toggleListen}
          disabled={loading}
          className={`relative z-10 p-5 rounded-full shadow-lg border transition-all duration-300 ${
            isListening
              ? 'bg-rose-500 border-rose-600 text-white hover:bg-rose-600'
              : 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600 hover:scale-105 active:scale-95'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 animate-pulse" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>
      </div>

      <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
        {isListening ? 'Listening...' : loading ? 'Analyzing voice...' : 'Hands-Free Logging'}
      </h4>
      
      <p className="text-xs text-slate-400 dark:text-slate-400 max-w-xs mb-6">
        {isListening
          ? 'Tap button to stop and analyze.'
          : 'Tap mic and say "I had three scrambled eggs and a banana for breakfast."'}
      </p>

      {/* Live transcript feedback */}
      {(transcript || submittingTranscript) && (
        <div className="w-full max-w-md p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 text-sm">
          <div className="flex items-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            <span>Detected Text</span>
            {loading && <Loader2 className="w-3.5 h-3.5 ml-2 animate-spin text-emerald-500" />}
          </div>
          <p className="text-slate-700 dark:text-slate-300 italic font-medium">
            "{transcript || submittingTranscript}"
          </p>
        </div>
      )}

      {speechError && !isListening && (
        <div className="flex items-center mt-4 text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/10 px-3 py-1.5 rounded-lg">
          <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
          {speechError}
        </div>
      )}
    </div>
  );
};

export default VoiceLogger;
